// File: CO2/static/ui/demarrage.js
// Desc: L'ordre du démarrage de la page seule : d'abord l'onglet ISS et sa fenêtre Spectrale, à leur taille, avec le dernier
//       affichage gardé (courbe, fond spectral, organigramme) ; puis, la Terre de l'ISS posée à son zoom, l'organigramme
//       autour ; alors seulement le premier calcul (le ⚫ que main.js clique). Embarquée : rien de tout ça, le calcul part
//       tout de suite (l'hôte a sa Terre et son état gardé, embarque.js).
// Version 1.0.0
// Date: 2026-11-16
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.DEMARRAGE = (function () {
    'use strict';
    /** Le dernier affichage, gardé d'un chargement à l'autre (IndexedDB : etats_gardes.js) : DATA à la fin du dernier calcul
     *  montré, ~230 Ko — sa grille spectrale 📊 redonne courbe et fond (projectToVisu), le reste l'organigramme. */
    const CLE = 'co2_affiche';
    let lance = false;          // le premier calcul est parti (main.js : le clic ⚫)
    let terrePosee = false;     // la Terre de l'ISS a été posée une première fois (onglets_graphe.js poserTerreISS)
    let apresTerre = null;      // le premier calcul, en attente de la Terre
    // Page seule : l'organigramme caché dès le chargement, tant qu'il n'est pas posé autour de la Terre (index-shell.css)
    document.body.classList.toggle('attente-terre', window.EMBARQUE.hote === null);

    /** Le dernier affichage gardé (DATA), ou null : aucun, ou gardé par un autre moteur (EMBARQUE.etatVersion) */
    function gardee() {
        const s = window.ETATS_GARDES.get(CLE), g = s === null ? null : JSON.parse(s);
        return g !== null && g.v === window.EMBARQUE.etatVersion ? g.DATA : null;
    }

    /** L'onglet ISS (sa page sur sa propre Terre : pas encore d'époque, onglets_graphe.js chargerPageISS) et la fenêtre
     *  Spectrale dépliée à sa taille ; puis le dernier affichage gardé, remis dans DATA (comme la progression, progression.js :
     *  le clic ⚫ qui suit repart de sa graine, quel que soit l'état) et dessiné. */
    function ouvrir() {
        window.switchTab('iss');
        window.switchTab('visu');
        const E = gardee();
        if (E === null) return;   // premier passage : la courbe viendra du premier calcul
        for (const k of Object.keys(E)) window.DATA[k] = E[k];
        window.projectToVisu(window.DATA);
    }

    return {
        /** Le premier calcul (f : le clic ⚫ de main.js). Page seule : ISS et Spectrale ouvertes d'abord, f à la Terre posée. */
        lancer: function (f) {
            if (window.EMBARQUE.hote !== null) { lance = true; f(); return; }
            ouvrir();
            apresTerre = function () { lance = true; f(); };
            if (terrePosee) apresTerre();
        },
        /** La Terre de l'ISS posée (onglets_graphe.js poserTerreISS) : l'organigramme est autour ; la première fois, le calcul part. */
        terre: function () {
            if (terrePosee) return;
            terrePosee = true;
            document.body.classList.remove('attente-terre');
            if (apresTerre !== null) apresTerre();
        },
        /** Le premier calcul est-il parti ? Avant, pas d'époque : la page ISS s'ouvre sur sa propre Terre, sans cartes. */
        lance: function () { return lance; },
        /** Fin d'un calcul montré (sync_panels.js afficherCalcul) : DATA gardé pour le prochain chargement. Page seule. */
        garder: function () {
            if (window.EMBARQUE.hote !== null) return;
            window.ETATS_GARDES.put(CLE, JSON.stringify({ v: window.EMBARQUE.etatVersion, DATA: window.DATA }));
        }
    };
})();
