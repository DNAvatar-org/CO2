// File: CO2/static/ui/progression.js
// Desc: La progression calculée, gardée d'un chargement à l'autre (F5) : l'état du dernier calcul de l'interface hors
//       run — DATA entier ; 📜 y porte l'époque (👉), l'horloge (⏳) et le curseur des clics (📿🕰) — et la courbe verte
//       d'Histoire, les messages histoire:calcul depuis le dernier clic sur la frise (bench_pilote.js apresCalcul).
//       Dans localStorage : DATA pèse ~235 Ko en JSON, dont 226 Ko de spectre (📊), loin des 4 Ko d'un cookie.
//       Au premier calcul de la page (le ⚫ du démarrage), la progression gardée prend sa place, sans calcul : DATA remis,
//       l'interface comme à la fin d'un calcul, la courbe verte rejouée. Le curseur de la frise suit 📜 à chaque trame
//       (organigramme/timeline.js updateTimeline) : il se pose sur la dernière année calculée. Un clic sur la frise fait
//       repartir la courbe, et la progression gardée avec elle. Page seule : embarquée, l'hôte a son état gardé
//       (embarque.js garderEtat, scenario_hote.js), qui se remet par le même poser.
// Version 1.0.0
// Date: 2026-11-03
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.PROGRESSION = (function () {
    'use strict';
    const CLE = 'co2_progression';
    /** Les messages histoire:calcul depuis le dernier départ (clic sur la frise), dans l'ordre : Histoire en refait la
     *  courbe verte et son dernier point (static/histoire/main.js). null avant le premier calcul de la page. */
    let calculs = null;

    /** La progression gardée par le chargement précédent { v, DATA, calculs }, ou null : aucune, ou gardée par un autre
     *  moteur (EMBARQUE.etatVersion, la version de l'état gardé) */
    function gardee() {
        const s = localStorage.getItem(CLE);
        if (s === null) return null;
        const g = JSON.parse(s);
        return g.v === window.EMBARQUE.etatVersion ? g : null;
    }

    /** Un état gardé remis dans DATA sans calcul : ses groupes (comme BENCH.voir ; l'époque DATA['📅'] suit 📜👉), le nom de
     *  l'époque relu de la frise, la glace que lit l'éclairage de la Terre (la copie que fait le moteur,
     *  h2o/calculations_h2o.js), l'organigramme redessiné, puis l'interface comme à la fin d'un calcul (afficherCalcul).
     *  Seulement quand aucun calcul n'est en cours : un calcul qui tournerait après repartirait de son époque
     *  (api.js prepare) sur cet état. */
    function poser(E) {
        const DATA = window.DATA, ORG = window.ORG, RUNTIME_STATE = window.RUNTIME_STATE;
        for (const k of Object.keys(E)) DATA[k] = E[k];
        window.syncEpochFromTimelinePointer();   // 🗿 et le nom de l'époque (RUNTIME_STATE.currentEpochName) depuis 👉
        RUNTIME_STATE.h2oIceFractionFromCalculation = DATA['💧']['🍰💧🧊'];
        ORG.recreateNoyauRadiation();
        ORG.recreateTerreRadiation();
        ORG.generateArrows();
        window.afficherCalcul(true);
    }

    /** La progression gardée à la place du calcul qui vient de finir : son état, puis sa courbe verte rejouée (le premier
     *  message est un départ : il efface le point du calcul remplacé) */
    function remettre(G) {
        calculs = G.calculs;
        poser(G.DATA);
        const histoire = document.getElementById('histoire-iframe').contentWindow;
        calculs.forEach(function (m) { histoire.postMessage(m, '*'); });
    }

    return {
        poser: poser,
        /** Un calcul de l'interface hors run, son message Histoire envoyé (bench_pilote.js apresCalcul) : gardé avec
         *  l'état. Le premier de la page (le ⚫ du démarrage, un départ) : la progression gardée, s'il y en a une, prend
         *  sa place. */
        calcul: function (msg) {
            if (window.EMBARQUE.hote !== null) return;   // embarquée : l'hôte a son état gardé
            if (calculs === null) {
                const G = gardee();
                if (G !== null) { remettre(G); return; }
            }
            calculs = msg.depart ? [msg] : calculs.concat([msg]);
            localStorage.setItem(CLE, JSON.stringify({ v: window.EMBARQUE.etatVersion, DATA: window.DATA, calculs: calculs }));
        }
    };
})();
