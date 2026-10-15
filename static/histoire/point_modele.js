// File: CO2/static/histoire/point_modele.js
// Desc: UN point des courbes du modèle d'Histoire (orange = chaîne de clics, violette = frise de chaque époque), lu dans
//       window.DATA à la fin d'un calcul. Seule fabrique : le banc headless (scripts/bench_headless/courbe_modele.js, qui
//       écrit courbe_modele*.js) et le banc de l'index (static/ui/bench_pilote.js, qui trace en direct dans l'onglet
//       Histoire). Chargé avec le moteur (API_BILAN/loader/engine_manifest.js).
// Version 1.0.0
// Date: 2026-10-15
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.HISTOIRE = window.HISTOIRE || {};

/**
 * @param {string} etape  clic joué, pour le survol (« frise 🦕 », « 🍄 💫 », « 🐊 →💫 hysteresis 2 »)
 * @param {?string} cle   action jouée (null pour une frise)
 * @param {?number} dt    durée du clic en Ma (null pour une frise)
 * @param {string} mode   'frise' | 'clic'
 */
window.HISTOIRE.pointModele = function (etape, cle, dt, mode) {
    const D = window.DATA, C = window.CONST, N = D['🌕'];
    const ep = D['📜']['🗿'];
    const E = window.TIMELINE.find((e) => e['📅'] === ep), an = window.CLICS.date();
    return {
        etape, cle, dt, mode, ep,
        T: +(D['🧮']['🧮🌡️'] - 273.15).toFixed(2),
        glace: +(+D['💧']['🍰💧🧊']).toFixed(3),
        // ppm d'air SEC (comme le banc, epoch_bench_format.js)
        ppm: +(D['🫧']['🍰🫧🏭'] / C.M_CO2 / (1 / D['🫧']['🧪'] - D['💧']['🍰🫧💧'] / C.M_H2O) * 1e6).toFixed(1),
        // Intérieur (geology/interieur.js) : T potentielle °C (null avant l'intérieur, ⚫), flux W/m², puissance TW
        Tint: N['🌡️🌕'] > 0 ? +(N['🌡️🌕'] - 273.15).toFixed(1) : null,
        geo: +(+N['🧲🌕']).toPrecision(4),
        TW: +(N['🔋🌕'] / 1e12).toFixed(2),
        solidif: N['📅🧊🌕'] > 0 ? Math.round(N['📅🧊🌕']) : null,
        t: Math.round(E['▶'] > E['◀'] ? an : window.HISTOIRE.litterature.AN - an),   // années avant L.AN
        st: D['🧮']['🧮🛑']
    };
};
