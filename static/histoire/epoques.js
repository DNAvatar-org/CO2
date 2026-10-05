// File: CO2/static/histoire/epoques.js
// Desc: Logos d'époque placés au DÉBUT de leur époque, lus dans la source unique : window.TIMELINE
//       (API_BILAN/config/configTimeline.js, ▶ de chaque époque) et window.CHARS / epochIndex pour le
//       logo et le nom. Aucune date recopiée à la main.
//       ▶ est en années AVANT le présent pour les époques géologiques (▶ > ◀), et en années du
//       CALENDRIER pour 🛖 🚂 📱 (▶ < ◀) : on convertit tout en « années avant 2025 ».
// Version 1.0.0
// Date: 2026-09-23
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HISTOIRE;
    H.AN_PRESENT = 2025;
    H.epoques = function () {
        if (!Array.isArray(window.TIMELINE)) throw new Error('[histoire] window.TIMELINE manquant — charger API_BILAN/config/configTimeline.js');
        if (!window.CHARS) throw new Error('[histoire] window.CHARS manquant — charger API_BILAN/data/alphabet.js');
        const C = window.CHARS;
        // Les états d'hystérésis ont un id texte : leur logo d'affichage est dans l'alphabet.
        const LOGO = { 'hysteresis 1a': C.SNOWBALL_ENTRY, 'hysteresis 1b': C.CRYO_INTERLUDE, 'hysteresis 1c': C.SNOWBALL_EXIT, 'hysteresis 2': C.EOCENE_OLIGOCENE };
        return window.epochIndex().filter(e => e.type === 'epoch').map(e => {
            const debut = e['▶'], fin = e['◀'];
            const ago = debut > fin ? debut : H.AN_PRESENT - debut;   // géologique : déjà « avant » ; sinon calendrier
            return { t: ago, logo: LOGO[e.id] || e.id, nom: e.name };
        });
    };
})();
