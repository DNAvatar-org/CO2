// File: CO2/static/logs_to_server.js - Hooks erreurs JS -> POST /_log
// Desc: En francais, dans l'architecture, je suis le capteur d'erreurs cote client qui envoie
//       au serveur (serve_site.py) les crashes (window.error, unhandledrejection, 404 assets)
//       et les console.error/console.warn. A charger EN PREMIER dans <head> de chaque HTML
//       (avant tout autre script) pour capturer les erreurs d'init.
// Version 1.1.0
// Copyright 2025-2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: April 23, 2026
// Logs:
// - v1.0.0: error + unhandledrejection (capture=true pour 404 assets) + patch console.error/warn.
//           Buffer + flush (sendBeacon prioritaire, fetch fallback) avec retry simple.
// - v1.1.0: API window.DEBUG (topic-based). DEBUG.setTopic('iceFactor') -> _logs/iceFactor.txt
//           (reset file à chaque setTopic). DEBUG.log / DEBUG.error. Activable via ?debug=<name>.
//           Errors toujours miroitées dans _logs/errors.txt (routage serveur).

(function () {
    const ENDPOINT = '/_log';
    const FLUSH_MS = 500;           // flush periodique
    const MAX_BUFFER = 64;           // flush si buffer plein
    const PAGE = location.pathname + location.search;

    const buffer = [];
    let flushTimer = null;

    // Topic actif (initialisé plus bas via ?debug=<name> ou DEBUG.setTopic).
    // Les entrées poussées avec ce topic seront écrites dans _logs/<topic>.txt (côté serveur).
    let activeTopic = null;

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

        // sendBeacon : non bloquant, survit a unload (ideal pour F5 / navigation).
        const blob = new Blob([body], { type: 'application/json' });
        const ok = navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob);
        if (ok) return;

        // Fallback fetch (keepalive pour survivre a unload si possible).
        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body,
            keepalive: true
        }).catch(() => {
            // En cas d'echec reseau, on abandonne ce batch (crash-first, pas de retry infini).
        });
    }

    // ----- 1) Crashes JS non catches + 404 assets (capture=true) -----
    window.addEventListener('error', function (e) {
        // e.target est un Element (IMG/SCRIPT/LINK) pour les 404 assets ; sinon erreur JS.
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
    }, true);  // capture=true IMPORTANT : sinon 404 assets non remontes

    // ----- 2) Promises rejetees -----
    window.addEventListener('unhandledrejection', function (e) {
        const r = e.reason || {};
        enqueue(
            'unhandledrejection',
            r.message || String(r),
            '',
            r.stack || ''
        );
    });

    // ----- 3) Patch console.error / console.warn (rouges/orange) -----
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

    // ----- 4) Flush avant unload (securite) -----
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);

    // Marqueur de session (utile pour reperer les F5 dans runtime.log).
    enqueue('session', 'page loaded: ' + PAGE, document.referrer || '', '');

    // ─── window.DEBUG : API logs par topic ────────────────────────────────────
    // Usage :
    //   ?debug=iceFactor (URL)  → topic actif = 'iceFactor', fichier iceFactor.txt reset
    //   DEBUG.setTopic('foo')  → idem en console (reset fichier)
    //   DEBUG.log('msg')       → append dans le fichier du topic courant
    //   DEBUG.error('msg')     → toujours miroité dans errors.txt + topic courant si défini
    //   DEBUG.reset()          → vide le fichier topic courant (appeler avant un nouveau test)
    // Whitelist topic : [A-Za-z0-9_-]{1,32} (côté serveur).
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
    const DEBUG = window.DEBUG = {
        get topic() { return activeTopic; },
        setTopic: function (name, opts) {
            opts = opts || {};
            if (typeof name !== 'string' || !/^[A-Za-z0-9_\-]{1,32}$/.test(name)) {
                console.warn('[DEBUG] topic invalide (whitelist [A-Za-z0-9_-]{1,32}) :', name);
                return;
            }
            activeTopic = name;
            // Reset fichier topic par défaut (comportement "que le dernier test").
            if (opts.reset !== false) {
                flush();            // purge buffer en cours (ancien topic ou null)
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
            if (!activeTopic) return;  // no-op si pas de topic actif
            enqueue('debug', String(msg), '', '');
        },
        error: function (msg, stack) {
            // kind=error → serveur miroite dans errors.txt en plus du topic
            enqueue('error', String(msg), '', stack || '');
        }
    };

    // Activation via ?debug=<topic>
    try {
        const qs = new URLSearchParams(location.search);
        const dbg = qs.get('debug');
        if (dbg) DEBUG.setTopic(dbg);
    } catch (_) {}
})();
