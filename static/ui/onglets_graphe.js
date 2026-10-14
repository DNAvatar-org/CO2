// File: CO2/static/ui/onglets_graphe.js
// Desc: Les onglets Scientifique, Bench, Milankovitch et Histoire s'affichent DANS LA ZONE DU GRAPHE SPECTRAL
//       (#visu-panel .plot-container-wrapper) ; la page Spectrale (#visu-panel) reste toujours visible. Les panneaux ne
//       sont pas déplacés dans le DOM (une iframe déplacée se recharge, et l'iframe scie perdrait sa synchro) : ils sont
//       en position fixe, recalés sur la zone quand elle change de taille, au redimensionnement et au défilement (c'est le
//       body qui défile, index-shell.css).
// Version 1.1.0
// - v1.1.0: spectreVisible — le graphe spectral est caché (visibility) sous les autres onglets.
// Date: 2026-10-14
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const PANNEAUX = ['scie-panel', 'bench-panel', 'milankovitch-panel', 'histoire-panel'];

    function zone() {
        return document.querySelector('#visu-panel .plot-container-wrapper');
    }

    /** Pose les quatre panneaux sur la zone du graphe (coordonnées de la fenêtre, position: fixed). */
    function placer() {
        const r = zone().getBoundingClientRect();
        PANNEAUX.forEach(function (id) {
            const s = document.getElementById(id).style;
            s.top = r.top + 'px';
            s.left = r.left + 'px';
            s.width = r.width + 'px';
            s.height = r.height + 'px';
        });
    }

    /** Spectre caché sous un autre onglet : ses éléments ne se dessinent plus et ne captent plus la souris (boutons,
     *  légende) ; la zone garde sa taille, le panneau s'y pose. Rendu à l'onglet Spectrale (onShowVisu redessine). */
    function spectreVisible(oui) {
        zone().classList.toggle('spectre-cache', !oui);
    }

    /** Après l'injection de visu (loader_panels.initAfterLoad) : la zone existe. */
    function brancher() {
        new ResizeObserver(placer).observe(zone());
        window.addEventListener('resize', placer);
        document.addEventListener('scroll', placer, true);
        placer();
    }

    window.ONGLETS_GRAPHE = { PANNEAUX: PANNEAUX, placer: placer, brancher: brancher, spectreVisible: spectreVisible };
})();
