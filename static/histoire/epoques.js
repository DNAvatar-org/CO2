// File: CO2/static/histoire/epoques.js
// Desc: Logos d'époque placés au DÉBUT de leur époque, lus dans la source unique : window.TIMELINE
//       (API_BILAN/config/configTimeline.js, ▶ de chaque époque) et window.CHARS / epochIndex pour le
//       logo et le nom. Aucune date recopiée à la main.
//       ▶ est en années AVANT le présent pour les époques géologiques (▶ > ◀), et en années du
//       CALENDRIER pour 🛖 🚂 📱 (▶ < ◀) : on convertit tout en « années avant 2025 ».
//       Les TICTIMES NOMMÉS (entrée de 🕰.order qui porte '📅', comme une époque : 🫠 🌨 🫗) ont leur logo à leur date,
//       tirée de la séquence (▶ − somme des 🔺⏳ jusqu'à ce clic) : l'Histoire les montre, la frise non.
// Version 1.2.0
// Date: 2026-10-28
// - v1.2.0: époques à chemins (🛤) : la séquence de chaque chemin, lue dans la config.
// - v1.1.1: id des époques de la frise (non hidden) : leur logo est cliquable comme la frise.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HISTOIRE;
    H.AN_PRESENT = H.litterature.AN;   // l'axe de la littérature (années avant 2025)
    H.epoques = function () {
        if (!Array.isArray(window.TIMELINE)) throw new Error('[histoire] window.TIMELINE manquant — charger API_BILAN/config/configTimeline.js');
        if (!window.CHARS) throw new Error('[histoire] window.CHARS manquant — charger API_BILAN/data/alphabet.js');
        const C = window.CHARS, C_DESC = window.CHARS_DESC;
        // Les états d'hystérésis ont un id texte : leur logo d'affichage est dans l'alphabet.
        const LOGO = { 'hysteresis 1a': C.SNOWBALL_ENTRY, 'hysteresis 1b': C.CRYO_INTERLUDE, 'hysteresis 1c': C.SNOWBALL_EXIT, 'hysteresis 2': C.EOCENE_OLIGOCENE };
        const liste = [];
        window.epochIndex().filter(e => e.type === 'epoch').forEach(e => {
            const debut = e['▶'], fin = e['◀'], geo = debut > fin;
            const ago = (an) => geo ? an : H.AN_PRESENT - an;   // géologique : déjà « avant » ; sinon calendrier
            liste.push({ t: ago(debut), logo: LOGO[e.id] || e.id, nom: e.name, clic: e.hidden ? null : e.id });   // clic : comme la frise (pas les hidden)
            // Époque à chemins (🛤, 🦣) : 🕰.order suit le chemin joué, un état du moteur que l'Histoire n'a pas ; chaque chemin
            // porte sa séquence. 📱 : actions par tranche, pas de séquence.
            const W = e['🕰'];
            for (const seq of ('🛤' in W ? Object.values(W['🛤']) : (W.order ? [W] : []))) {
                let an = debut;
                seq.order.forEach(c => {
                    an += (geo ? -1 : 1) * c['🔺⏳'] * 1e6;
                    if ('📅' in c) liste.push({ t: ago(an), logo: c['📅'], nom: C_DESC[c['📅']], clic: null });
                });
            }
        });
        const F = window.TIMELINE_FUTUR;   // 🔮 2100 → 2300 : repère affiché, hors TIMELINE
        liste.push({ t: H.AN_PRESENT - F['▶'], logo: F['📅'], nom: window.CHARS_DESC[F['📅']], clic: null });   // repère, non cliquable
        return liste;
    };
})();
