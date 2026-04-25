// File: CO2/static/logs_to_server.js - Hooks erreurs JS -> POST /_log
// Desc: En francais, dans l'architecture, je suis le capteur d'erreurs cote client qui envoie
//       au serveur (serve_site.py) les crashes (window.error, unhandledrejection, 404 assets)
//       et les console.error/console.warn. A charger EN PREMIER dans <head> de chaque HTML
//       (avant tout autre script) pour capturer les erreurs d'init.
// Version 1.1.6
// Copyright 2025-2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: April 25, 2026
// Logs:
// - v1.1.6: logToTopic(topic,msg) + debugMirrorConfigLogToFile — chaque clé CONFIG_COMPUTE.log* → _logs/<fichier>.txt
//   indépendant ; hyst + epoch (et autres) peuvent être true en même temps. Erreurs → errors.txt (serveur).
//   Retrait applyFileTopicFromConfig (un seul activeTopic) pour hyst/epoch.
// - v1.1.5: CONFIG_COMPUTE.logHystPanelToFile / logEpochCompareToFile (configTimeline) → même fichiers _logs/ sans ?debug= ; setTopic(…, { reset:false }) pour ne pas vider le fichier au F5
// - v1.0.0: error + unhandledrejection (capture=true pour 404 assets) + patch console.error/warn.
//           Buffer + flush (sendBeacon prioritaire, fetch fallback) avec retry simple.

(function () {
    const ENDPOINT = '/_log';
    const FLUSH_MS = 500;           // flush periodique
    const MAX_BUFFER = 64;           // flush si buffer plein
    const PAGE = location.pathname + location.search;

    const buffer = [];
    let flushTimer = null;

    // Topic "courant" pour DEBUG.log() sans argument de topic (legacy ?debug= + setTopic).
    let activeTopic = null;

    const TOPIC_RE = /^[A-Za-z0-9_\-]{1,32}$/;

    /** Chaque clé CONFIG_COMPUTE.log* → nom de fichier _logs/<id>.txt (serve_site whitelist). */
    const CONFIG_LOG_FILE_TOPIC = {
        logEdsDiagnostic: 'eds',
        logIceFixedDiagnostic: 'iceFixed',
        logIceFractionDiagnostic: 'iceFraction',
        logCo2RadiativeDiagnostic: 'co2Rad',
        logCloudProxyDiagnostic: 'cloudProxy',
        logIrisDiagnostic: 'iris',
        logCo2PartitionDiagnostic: 'co2Partition',
        logHystPanelToFile: 'hyst',
        logEpochCompareToFile: 'epoch'
    };

    function enqueue(kind, msg, src, stack, topic) {
        const t = (typeof topic === 'string' && topic) ? topic : activeTopic;
        const entry = { kind, msg, src, stack, page: PAGE, t: Date.now() };
        if (t) entry.topic = t;
        buffer.push(entry);
        if (buffer.length >= MAX_BUFFER) {
            flush();
        } else if (!flushTimer) {
            flushTimer = setTimeout(flush, FLUSH_MS);
        }
    }

    function flush() {
        if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
        if (buffer.length === 0) return;
        const batch = buffer.splice(0, buffer.length);
        const body = JSON.stringify(batch);

        const blob = new Blob([body], { type: 'application/json' });
        const ok = navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob);
        if (ok) return;

        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body,
            keepalive: true
        }).catch(() => {});
    }

    window.addEventListener('error', function (e) {
        const t = e.target;
        if (t && t !== window && (t.src || t.href)) {
            enqueue(
                'asset-404',
                (t.tagName || 'ASSET') + ' failed to load',
                t.src || t.href,
                ''
            );
        } else {
            const err = e.error || {};
            enqueue(
                'error',
                e.message || String(err.message || err),
                (e.filename || '') + ':' + (e.lineno || '') + ':' + (e.colno || ''),
                err.stack || ''
            );
        }
    }, true);

    window.addEventListener('unhandledrejection', function (e) {
        const r = e.reason || {};
        enqueue(
            'unhandledrejection',
            r.message || String(r),
            '',
            r.stack || ''
        );
    });

    const _origErr = console.error.bind(console);
    const _origWarn = console.warn.bind(console);

    console.error = function () {
        const msg = Array.prototype.map.call(arguments, formatArg).join(' ');
        enqueue('console.error', msg, '', '');
        _origErr.apply(console, arguments);
    };
    console.warn = function () {
        const msg = Array.prototype.map.call(arguments, formatArg).join(' ');
        enqueue('console.warn', msg, '', '');
        _origWarn.apply(console, arguments);
    };

    function formatArg(a) {
        if (a === null) return 'null';
        if (typeof a === 'string') return a;
        if (a instanceof Error) return a.stack || (a.name + ': ' + a.message);
        try { return JSON.stringify(a); } catch (_) { return String(a); }
    }

    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);

    enqueue('session', 'page loaded: ' + PAGE, document.referrer || '', '');

    function _sendControl(payload) {
        try {
            fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(() => {});
        } catch (_) {}
    }

    function logToTopic(topic, msg) {
        if (typeof topic !== 'string' || !TOPIC_RE.test(topic)) {
            return;
        }
        enqueue('debug', String(msg), '', '', topic);
    }

    /** Si CONFIG_COMPUTE[configKey] === true, envoie la même ligne que la console vers _logs/<id>.txt. */
    function debugMirrorConfigLogToFile(configKey, msg) {
        const C = window.CONFIG_COMPUTE;
        if (!C || C[configKey] !== true) {
            return;
        }
        const fileId = CONFIG_LOG_FILE_TOPIC[configKey];
        if (!fileId) {
            return;
        }
        logToTopic(fileId, msg);
    }

    const DEBUG = window.DEBUG = {
        get topic() { return activeTopic; },
        setTopic: function (name, opts) {
            opts = opts || {};
            if (typeof name !== 'string' || !TOPIC_RE.test(name)) {
                console.warn('[DEBUG] topic invalide (whitelist [A-Za-z0-9_-]{1,32}) :', name);
                return;
            }
            activeTopic = name;
            if (name === 'epoch') {
                try { window._radCompareEpochIndex = 0; } catch (e) {}
            }
            if (opts.reset !== false) {
                flush();
                _sendControl({ reset: name });
            }
        },
        reset: function (name) {
            const t = name || activeTopic;
            if (!t) return;
            flush();
            _sendControl({ reset: t });
        },
        log: function (msg) {
            if (!activeTopic) return;
            enqueue('debug', String(msg), '', '');
        },
        logToTopic: logToTopic,
        error: function (msg, stack) {
            enqueue('error', String(msg), '', stack || '');
        }
    };

    window.debugMirrorConfigLogToFile = debugMirrorConfigLogToFile;
    // Alias court pour l’API (optionnel)
    window.CONFIG_LOG_FILE_TOPIC = CONFIG_LOG_FILE_TOPIC;

    // ?debug= sur cette fenêtre
    try {
        const qs = new URLSearchParams(location.search);
        const dbg = qs.get('debug');
        if (dbg) DEBUG.setTopic(dbg);
    } catch (_) {}

    // Iframe : remonter jusqu’à top pour ?debug=
    try {
        if (!activeTopic) {
            let w = window;
            for (let i = 0; i < 8 && w; i++) {
                const loc = w.location;
                if (loc && loc.search) {
                    const dbgA = new URLSearchParams(loc.search).get('debug');
                    if (dbgA) {
                        DEBUG.setTopic(dbgA, { reset: false });
                        break;
                    }
                }
                if (w.DEBUG && typeof w.DEBUG.topic === 'string' && w.DEBUG.topic) {
                    DEBUG.setTopic(w.DEBUG.topic, { reset: false });
                    break;
                }
                if (w === w.top) {
                    break;
                }
                w = w.parent;
            }
        }
    } catch (e) {}
})();
