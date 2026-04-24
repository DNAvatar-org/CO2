// File: plot_debug.js - Flag dédié + topic fichier _logs/plot.txt pour le graphe spectral
// Desc: En français, dans l'architecture, je charge avant plot.js ; active logs fichier plot via ?debugPlot=1 ou true
// Version 1.0.0
// Date: [April 25, 2026] [22:00 UTC+1]
// Logs:
// - v1.0.0: DEBUG_PLOT_LOG + DEBUG.setTopic('plot') pour DEBUG.log → _logs/plot.txt (logs_to_server.js)
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

(function () {
    'use strict';
    window.DEBUG_PLOT_LOG = false;
    const q = new URLSearchParams(window.location.search);
    const v = q.get('debugPlot');
    if (v === '1' || v === 'true') {
        window.DEBUG_PLOT_LOG = true;
        window.DEBUG.setTopic('plot');
    }
})();
