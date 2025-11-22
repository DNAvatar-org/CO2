// ============================================================================
// File: debug.js - Interface de debug pour le style
// Desc: En français, dans l'architecture, je suis le module d'interface de debug
// Version 1.0.1
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: interface de debug pour basculer entre modes d'affichage
// ============================================================================

(function () {
    'use strict';

    function initDebugInterface() {
        // Interface de debug désactivée - plus de boutons de debug
        // Le bouton "Blur Off" a été retiré
        return; // Ne rien faire
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDebugInterface);
    } else {
        initDebugInterface();
    }
})();
