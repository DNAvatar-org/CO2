// ============================================================================
// File: debug.js - Interface de debug pour le style
// Desc: En français, dans l'architecture, je suis le module d'interface de debug
// Version 1.0.1
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
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

function logDeltaEquilibre() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const delta_equilibre = DATA['🧲']['🔺🧲'] || 0;
    const T0_current = DATA['🧮']['🧮🌡️'];
    const T_effective = Math.pow((DATA['🧲']['🧲🌈🔼'] || 0) / CONST.STEFAN_BOLTZMANN, 0.25);
    const blackbody_flux_T0 = CONST.STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
    const delta_eds = blackbody_flux_T0 - (DATA['🧲']['🧲🌈🔼'] || 0);
    const tolerance_current = DATA['🧮']['🧲🔬'] || 0.1;
    const tolerance_status = Math.abs(delta_equilibre) <= tolerance_current ? '✅' : '🧮';
    console.log(`🌡️ Delta équilibre (→0): ${delta_equilibre.toFixed(4)} W/m² | T° sol: ${T0_current.toFixed(2)}K (${(T0_current - 273.15).toFixed(1)}°C) | T° corps noir: ${T_effective.toFixed(2)}K (${(T_effective - 273.15).toFixed(1)}°C) | Delta EDS: ${delta_eds.toFixed(4)} W/m² | Tolérance: ${tolerance_current.toFixed(2)} W/m² ${tolerance_status}`);
}

window.logDeltaEquilibre = logDeltaEquilibre;
