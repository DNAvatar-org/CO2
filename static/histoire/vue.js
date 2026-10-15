// File: CO2/static/histoire/vue.js
// Desc: État de la vue (échelles, décalages) et ses BORNES : rien avant −5000 Ma, rien après la borne de la frise (2300).
//       Le temps t est en années avant 2025 ; le bord gauche de l'écran est t = xOffset, le bord droit
//       t = xOffset − largeur / xScale.
// Version 1.2.2
// - v1.2.2: marge à droite de 2300 (H.MARGE_PX) : la pointe des scénarios ne colle plus au bord quand on zoome dessus.
// - v1.2.1: bord droit = window.TIMELINE_FUTUR ◀ (2300), plus 2200 recopié.
// - v1.2.0: départ = toute la durée (−5000 Ma → 2200), de −150 à 400 °C.
// - v1.1.0: bord droit 2200 (était 2025).
// Date: 2026-10-15
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HISTOIRE;
    H.T_MAX_AGO = 5.0e9;   // bord gauche le plus ancien : −5000 Ma
    H.AN_FIN = window.TIMELINE_FUTUR['◀'];       // bord droit le plus récent : la borne de la frise (axe ; aucune donnée après 2024)
    H.T_MIN_AGO = H.AN_PRESENT - H.AN_FIN;       // en années avant 2025 (négatif)
    H.SPAN_MIN = 10;       // zoom maximal : 10 ans sur toute la largeur
    H.MARGE_PX = 120;      // vide à droite de 2300, en pixels quel que soit le zoom : la pointe reste lisible
    H.DEPART_T = [-150, 400];   // vue de départ : toute la durée, de −150 à 400 °C
    H.vue = { width: 0, height: 0, xScale: 0, xOffset: H.T_MAX_AGO, yScale: 0, yOffset: (H.DEPART_T[0] + H.DEPART_T[1]) / 2 };

    /** Ramène la vue dans ses bornes : pas de dézoom au-delà de [−5000 Ma ; 2300 + H.MARGE_PX], pas de glissement hors. */
    H.borner = function () {
        const v = H.vue;
        const spanMax = H.T_MAX_AGO - H.T_MIN_AGO;
        v.xScale = Math.min(Math.max(v.xScale, (v.width - H.MARGE_PX) / spanMax), v.width / H.SPAN_MIN);
        const span = v.width / v.xScale;
        v.xOffset = Math.min(Math.max(v.xOffset, H.T_MIN_AGO + span - H.MARGE_PX / v.xScale), H.T_MAX_AGO);
    };
})();
