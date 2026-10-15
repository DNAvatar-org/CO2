// File: CO2/static/ui/onglets_graphe.js
// Desc: Les onglets Scientifique, Bench, Milankovitch et Histoire s'affichent DANS LA ZONE DU GRAPHE SPECTRAL
//       (#visu-panel .plot-container-wrapper) ; la page Spectrale (#visu-panel) reste toujours visible. Les panneaux ne
//       sont pas déplacés dans le DOM (une iframe déplacée se recharge, et l'iframe scie perdrait sa synchro) : ils sont
//       en position fixe, recalés sur la zone quand elle change de taille, au redimensionnement et au défilement (c'est le
//       body qui défile, index-shell.css).
// Version 1.2.9
// - v1.2.9: vue de l'ISS choisie par qui l'ouvre (choisirVueISS) : Terre (onglet, ✕ de Science), horizon de la Lune (🛰).
//   Onglet ISS en pleine page (body.onglet-plein) : titre, organigramme et frise par-dessus ; ses boutons se
//   posent autour de la Terre de la page ISS (message iss:terre → ZOOM_TERRE.poser).
// - v1.2.8: l'ISS s'ouvre en mode bilan radiatif (?provenance=CO2 : ×1000, fenêtres repliées, pas de Check Photo) :
//   satellite Iridium, vue Terre (de l'extérieur), aucune case cochée ; plus de zen au démarrage.
// - v1.2.7: dès l'an 2000, l'ISS montre sa propre Terre (NASA geoview / steamNight + tuiles GIBS, Sentinel-2 au zoom) : ni ?jour ni ?nuit.
// - v1.2.6: onglet ISS ouvert : rechargé à chaque compute:done (carte et atmosphère de l'époque suivent les clics).
// - v1.2.5: l'iframe ISS reçoit aussi l'atmosphère du dernier calcul (?atm= : pression, hauteur d'échelle, luminescence).
// - v1.2.4: chargerISS — l'iframe ISS reçoit les cartes de l'époque (?jour= / ?nuit=) et ?onglet ; 🛰 de l'organigramme → onglet ISS.
// - v1.2.3: bouton ⛶ du panneau ISS : zen / pas zen de la page ISS (message iss:zen).
// - v1.2.2: onglet ISS (iss-panel).
// - v1.2.1: un logo d'époque cliqué dans Histoire (histoire:epoque) lance l'époque comme la frise.
// - v1.2.0: spectre caché en display: none + canvas effacé.
// - v1.1.0: spectreVisible — le graphe spectral est caché (visibility) sous les autres onglets.
// Date: 2026-10-15
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const PANNEAUX = ['scie-panel', 'bench-panel', 'milankovitch-panel', 'histoire-panel', 'iss-panel'];
    // Onglets en pleine page : sur toute la page Spectrale (#visu-panel), pas la seule zone du graphe ; titre, organigramme
    // et frise restent des cadres séparés, posés par-dessus (index-shell.css, body.onglet-plein).
    const PLEINE_PAGE = ['iss-panel'];

    // Onglet ISS : la page publiée (pages/ISS), en onglet (?onglet : ni signature ni ⛶ à elle), sans zen ; le bouton ⛶
    // du panneau la bascule par message, sans recharger (pages/ISS, js/ui.js, écoute 'iss:zen').
    // Avant l'an 2000, ses cartes de la Terre sont celles du globe de l'organigramme (texture de jour
    // window._lastPlanetTexturePath, carte de nuit 📜🌙), prises dans la copie PUBLIÉE de CO2 : même site que la page ISS,
    // donc lisibles par son WebGL. Dès 2000 : aucune carte passée, la page ISS garde ses vraies textures et ses tuiles de
    // détail au zoom (pages/ISS js/url.js : TUILES_ACTIVES = pas de ?jour). Le globe de l'organigramme reste inchangé.
    const AN_TERRE_REELLE = 2000;
    const ISS_PAGE = 'https://dnavatar.org/pages/ISS/';
    const CO2_PUBLIE = 'https://dnavatar.org/pages/bilan_radiatif/CO2/';
    const O2_MASSIQUE_ACTUEL = 0.2314;   // part massique de l'O₂ de l'air d'aujourd'hui (référence de la luminescence)
    // Vue ouverte par l'onglet ISS (pages/ISS js/url.js) : la Terre vue de loin depuis Iridium (onglet ISS, ✕ de Science),
    // ou l'horizon de la Lune vu de l'ISS (🛰 OBSERVATIONS, main.js).
    const VUES_ISS = { terre: 'sat=iridium&vue=terre', lune: 'sat=iss&vue=lune' };
    let vueISS = 'terre';
    function choisirVueISS(v) { vueISS = v; }
    let zenISS = false;   // fenêtres Temps et Point de vue visibles, repliées (?provenance=CO2) ; ⛶ les masque
    /** Atmosphère du dernier calcul pour la page ISS (?atm=, pages/ISS js/url.js) : pression de surface 🎈 [atm] ; hauteur
     *  d'échelle H = R T / (M g) à la température de surface [km] ; luminescence nocturne (airglow : O, OH, Na, O₂ — toutes
     *  issues de l'oxygène) ∝ part massique d'O₂ rapportée à aujourd'hui (approximation déclarée). Sans air : p:0. */
    function atmISS() {
        const D = window.DATA;
        const H_km = window.CONST.R_GAS * D['🧮']['🧮🌡️'] / (D['🫧']['🧪'] * D['📅']['🍎']) / 1000;
        return 'p:' + D['🫧']['🎈'].toFixed(3) + ',H:' + H_km.toFixed(2) + ',lum:' + (D['🫧']['🍰🫧🫁'] / O2_MASSIQUE_ACTUEL).toFixed(3);
    }
    /** Année de la frise, signée (négative avant notre ère) : géologique = années avant le présent, sinon calendrier. */
    function anneeFrise() {
        const ans = window.getTimelineCurrentYears();
        return window.timelineEpochIsForward(window.getEpochAtTimelineIndex()) ? ans : -ans;
    }
    function cartesISS() {
        if (anneeFrise() >= AN_TERRE_REELLE) return '';
        const nuit = window.DATA['📜']['🌙'];
        return '&jour=' + encodeURIComponent(new URL(window._lastPlanetTexturePath, CO2_PUBLIE).href)
            + (nuit === '' ? '' : '&nuit=' + encodeURIComponent(new URL(nuit, CO2_PUBLIE).href));
    }
    function chargerISS() {
        const src = ISS_PAGE + '?provenance=CO2&' + VUES_ISS[vueISS] + '&onglet' + (zenISS ? '&zen' : '') + '&atm=' + atmISS() + cartesISS();
        const iframe = document.getElementById('iss-iframe');
        if (iframe.src !== src) iframe.src = src;   // même époque : la page garde sa vue (pas de rechargement)
    }
    function basculerZenISS() {
        zenISS = !zenISS;
        document.getElementById('iss-iframe').contentWindow.postMessage({ type: 'iss:zen', zen: zenISS }, '*');
    }

    // Onglet Histoire : un clic sur le logo d'une époque est un clic sur la frise. Onglet ISS : la page a basculé elle-même
    // (toucher, son bouton ⛶) — le bouton du panneau repart de son état.
    window.addEventListener('message', function (e) {
        if (e.data.type === 'histoire:epoque') window.setEpochFromEpochButton(e.data.id);
        if (e.data.type === 'iss:zenEtat') zenISS = e.data.zen;
        if (e.data.type === 'iss:terre' && window.API_ONGLETS.getCurrentTab() === 'iss') poserTerreISS(e.data);
    });

    /** Onglet ISS en pleine page : l'organigramme se pose autour de la Terre de la page ISS, que celle-ci envoie (centre et
     *  rayon en px de sa page, pages/ISS js/hote.js) ; ses boutons butent sur les bords du panneau. En sortant, la Terre
     *  de l'organigramme reprend sa place et sa taille. */
    let terreAvantISS = null;
    function entrerPleinePageISS() {
        if (document.body.classList.contains('onglet-plein')) return;   // ISS re-cliqué (onglet, 🛰) : on y est déjà
        const T = window.TERRE_ECRAN;
        terreAvantISS = { cx: T.cx, cy: T.cy, R: T.R };
        T.cadreEl = document.getElementById('iss-panel');
        document.body.classList.add('onglet-plein');
        placer();
    }
    function sortirPleinePageISS() {
        document.body.classList.remove('onglet-plein');
        window.TERRE_ECRAN.cadreEl = document.getElementById('flux-diagram');
        window.ZOOM_TERRE.poser(terreAvantISS);
    }
    /** Coordonnées de la page ISS → repère de #flux-diagram (coin intérieur) : l'iframe et l'organigramme sont dans la même
     *  fenêtre. */
    function poserTerreISS(t) {
        const i = document.getElementById('iss-iframe').getBoundingClientRect();
        const f = document.getElementById('flux-diagram'), fr = f.getBoundingClientRect();
        window.ZOOM_TERRE.poser({ cx: i.left + t.cx - fr.left - f.clientLeft, cy: i.top + t.cy - fr.top - f.clientTop, R: t.r });
    }

    function zone() {
        return document.querySelector('#visu-panel .plot-container-wrapper');
    }

    /** Pose les panneaux sur la zone du graphe, ou sur toute la page Spectrale pour ceux en pleine page (coordonnées de la
     *  fenêtre, position: fixed). */
    function placer() {
        const graphe = zone().getBoundingClientRect(), page = document.getElementById('visu-panel').getBoundingClientRect();
        PANNEAUX.forEach(function (id) {
            const r = PLEINE_PAGE.includes(id) ? page : graphe;
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

    /** Après l'injection de visu (loader_panels.initAfterLoad) : la zone existe. Onglet ISS ouvert : chaque calcul
     *  lui repasse la carte (posée au clic, organigramme updatePlanetTextureFromDate) et l'atmosphère du calcul. */
    function brancher() {
        new ResizeObserver(placer).observe(zone());
        window.addEventListener('resize', placer);
        document.addEventListener('scroll', placer, true);
        placer();
        window.IO_LISTENER.on('compute:done', function () {
            if (window.API_ONGLETS.getCurrentTab() === 'iss') chargerISS();
        }, 'onglets_graphe');
    }

    window.ONGLETS_GRAPHE = { PANNEAUX: PANNEAUX, placer: placer, brancher: brancher, spectreVisible: spectreVisible, basculerZenISS: basculerZenISS,
        chargerISS: chargerISS, choisirVueISS: choisirVueISS, entrerPleinePageISS: entrerPleinePageISS, sortirPleinePageISS: sortirPleinePageISS };
})();
