// File: static/site_paths.js - Racines URL absolues (OVH / localhost:8001)
// Desc: _interfaces www racine ; logs_to_server injecté uniquement en local
// Version 1.0.2
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: July 13, 2025
// Logs:
// - v1.0.2: retrait CO2 ; logs_to_server local uniquement ; INTERFACES = /_interfaces/
// - v1.0.1: CO2 racine (retiré — undefined sur prod partielle)
// - v1.0.0: INTERFACES → /_interfaces/

(function () {
    var host = window.location.hostname;
    var local = host === 'localhost' || host === '127.0.0.1';
    window.SITE_PATHS = {
        INTERFACES: '/_interfaces/',
        LOCAL_DEV: local,
    };
    if (!local) {
        return;
    }
    var scripts = document.getElementsByTagName('script');
    var me = scripts[scripts.length - 1];
    var base = me.src.replace(/site_paths\.js(\?.*)?$/, '');
    var s = document.createElement('script');
    s.src = base + 'logs_to_server.js';
    document.head.appendChild(s);
})();
