// File: CO2/static/logs_to_server.js - Hooks erreurs JS -> POST /_log
// Desc: En francais, dans l'architecture, je suis le capteur d'erreurs cote client qui envoie
//       au serveur (log_server.py) les crashes (window.error, unhandledrejection, 404 assets)
//       et les console.error/console.warn. A charger EN PREMIER dans <head> de chaque HTML
//       (avant tout autre script) pour capturer les erreurs d'init.
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: April 18, 2026 [22:10 UTC+1]
// Logs:
// - v1.0.0: error + unhandledrejection (capture=true pour 404 assets) + patch console.error/warn.
//           Buffer + flush (sendBeacon prioritaire, fetch fallback) avec retry simple.

(function () {
    const ENDPOINT = '/_log';
    const FLUSH_MS = 500;           // flush periodique
    const MAX_BUFFER = 64;           // flush si buffer plein
    const PAGE = location.pathname + location.search;

    const buffer = [];
    let flushTimer = null;

    function enqueue(kind, msg, src, stack) {
        buffer.push({ kind, msg, src, stack, page: PAGE, t: Date.now() });
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
})();
