// File: CO2/static/histoire/vue.js
// Desc: État de la vue (échelles, décalages) et ses BORNES : rien avant −5000 Ma, rien après 2025.
//       Le temps t est en années avant 2025 ; le bord gauche de l'écran est t = xOffset, le bord droit
//       t = xOffset − largeur / xScale.
// Version 1.0.0
// Date: 2026-09-23
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HISTOIRE;
    H.T_MAX_AGO = 5.0e9;   // bord gauche le plus ancien : −5000 Ma
    H.T_MIN_AGO = 0;       // bord droit le plus récent : 2025
    H.SPAN_MIN = 10;       // zoom maximal : 10 ans sur toute la largeur
    H.vue = { width: 0, height: 0, xScale: 0, xOffset: 800e6, yScale: 8, yOffset: 15 };

    /** Ramène la vue dans ses bornes : pas de dézoom au-delà de [−5000 Ma ; 2025], pas de glissement hors. */
    H.borner = function () {
        const v = H.vue;
        const spanMax = H.T_MAX_AGO - H.T_MIN_AGO;
        v.xScale = Math.min(Math.max(v.xScale, v.width / spanMax), v.width / H.SPAN_MIN);
        const span = v.width / v.xScale;
        v.xOffset = Math.min(Math.max(v.xOffset, H.T_MIN_AGO + span), H.T_MAX_AGO);
    };
})();
