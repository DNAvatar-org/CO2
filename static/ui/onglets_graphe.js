// File: CO2/static/ui/onglets_graphe.js
// Desc: Les onglets Scientifique, Bench, Milankovitch et Histoire s'affichent DANS LA ZONE DU GRAPHE SPECTRAL
//       (#visu-panel .plot-container-wrapper) ; la page Spectrale (#visu-panel) reste toujours visible. Les panneaux ne
//       sont pas déplacés dans le DOM (une iframe déplacée se recharge, et l'iframe scie perdrait sa synchro) : ils sont
//       en position fixe, recalés sur la zone quand elle change de taille, au redimensionnement et au défilement (c'est le
//       body qui défile, index-shell.css).
// Version 1.2.3
// - v1.2.3: bouton ⛶ du panneau ISS : zen / pas zen de la page ISS (message iss:zen).
// - v1.2.2: onglet ISS (iss-panel).
// - v1.2.1: un logo d'époque cliqué dans Histoire (histoire:epoque) lance l'époque comme la frise.
// - v1.2.0: spectre caché en display: none + canvas effacé.
// - v1.1.0: spectreVisible — le graphe spectral est caché (visibility) sous les autres onglets.
// Date: 2026-10-14
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const PANNEAUX = ['scie-panel', 'bench-panel', 'milankovitch-panel', 'histoire-panel', 'iss-panel'];

    // Onglet ISS : la page démarre en zen (?zen dans l'URL de l'iframe) ; le bouton ⛶ du panneau la bascule par message,
    // sans recharger la page (pages/ISS, js/ui.js, écoute 'iss:zen').
    let zenISS = true;
    function basculerZenISS() {
        zenISS = !zenISS;
        document.getElementById('iss-iframe').contentWindow.postMessage({ type: 'iss:zen', zen: zenISS }, '*');
    }

    // Onglet Histoire : un clic sur le logo d'une époque est un clic sur la frise. Onglet ISS : la page a basculé elle-même
    // (toucher, son bouton ⛶) — le bouton du panneau repart de son état.
    window.addEventListener('message', function (e) {
        if (e.data.type === 'histoire:epoque') window.setEpochFromEpochButton(e.data.id);
        if (e.data.type === 'iss:zenEtat') zenISS = e.data.zen;
    });

    function zone() {
        return document.querySelector('#visu-panel .plot-container-wrapper');
    }

    /** Pose les panneaux sur la zone du graphe (coordonnées de la fenêtre, position: fixed). */
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

    /** Spectre caché sous un autre onglet : son contenu sort du rendu (display: none, index-shell.css) et le canvas est
     *  effacé ; la zone garde sa taille, le panneau s'y pose. À l'onglet Spectrale, onShowVisu redimensionne (resize) et
     *  redessine (projectToVisu). */
    function spectreVisible(oui) {
        zone().classList.toggle('spectre-cache', !oui);
        if (oui) return;
        const canvas = document.getElementById('spectral-visualization');
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }

    /** Après l'injection de visu (loader_panels.initAfterLoad) : la zone existe. */
    function brancher() {
        new ResizeObserver(placer).observe(zone());
        window.addEventListener('resize', placer);
        document.addEventListener('scroll', placer, true);
        placer();
    }

    window.ONGLETS_GRAPHE = { PANNEAUX: PANNEAUX, placer: placer, brancher: brancher, spectreVisible: spectreVisible, basculerZenISS: basculerZenISS };
})();
