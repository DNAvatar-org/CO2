// File: CO2/static/ui/onglets_graphe.js
// Desc: Les onglets Science, Bench, Milankovitch, Histoire et ISS s'affichent en PLEINE PAGE, sur toute la page Spectrale
//       (#visu-panel), son interface (titre, organigramme, frise) par-dessus. Les panneaux ne sont pas déplacés dans le DOM
//       (une iframe déplacée se recharge, et l'iframe scie perdrait sa synchro) : ils sont en position fixe, recalés quand
//       la zone change de taille, au redimensionnement et au défilement (c'est le body qui défile, index-shell.css).
// Version 1.3.10
// - v1.3.9: onglet ISS : le Soleil de l'organigramme prend l'angle du vrai Soleil à l'écran (iss:terre).
// - v1.3.8: frise tout à gauche : les panneaux vont de la frise (ISS, Histoire) ou de l'organigramme (les autres) au bord droit.
// - v1.3.7: Histoire : titre et organigramme cachés (body.histoire), la courbe sur toute la largeur.
// - v1.3.6: Science, Bench, Milankovitch commencent après la colonne de l'organigramme ; ISS et Histoire (organigramme en
//   plein) gardent toute la largeur.
// - v1.3.5: onglet ISS : TERRE_ECRAN.boule — cercle d'atmosphère et globe de l'organigramme = R, le bord de la boule 3D.
// - v1.3.4: en local (localhost), l'onglet ISS charge la page ISS locale (/Pesquet/) et lui passe les cartes locales.
// - v1.3.3: frise à droite dans tous les onglets (#timeline-column) ; organigramme en plein pour l'ISS et Histoire
//   (globe au centre du panneau) ; 🛰 plus collés à droite.
// - v1.3.2: onglet ISS : l'organigramme a la taille du panneau de la Terre 3D (--onglet-*), titre par-dessus ; le bas du
//   titre est envoyé à la page ISS (iss:marges) : ses fenêtres Temps et Point de vue commencent dessous.
// - v1.3.1: panneau jusqu'à la frise.
// - v1.3.0: tous les onglets en pleine page (body.onglet-plein, posé par spectreVisible) ; la Terre de l'ISS : body.terre-iss.
// - v1.2.9: onglet ISS en pleine page (body.onglet-plein) : titre, organigramme et frise par-dessus ; ses boutons se
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
    // Panneaux sur toute la largeur, sous l'organigramme transparent (organigramme en plein) ; les autres commencent après
    // la colonne de l'organigramme, qui garde sa place et ne doit pas cacher leur contenu.
    const PAGE_ENTIERE = ['iss-panel', 'histoire-panel'];

    // Onglet ISS : la page publiée (pages/ISS), en onglet (?onglet : ni signature ni ⛶ à elle), sans zen ; le bouton ⛶
    // du panneau la bascule par message, sans recharger (pages/ISS, js/ui.js, écoute 'iss:zen').
    // Avant l'an 2000, ses cartes de la Terre sont celles du globe de l'organigramme (texture de jour
    // window._lastPlanetTexturePath, carte de nuit 📜🌙), prises dans la copie PUBLIÉE de CO2 : même site que la page ISS,
    // donc lisibles par son WebGL. Dès 2000 : aucune carte passée, la page ISS garde ses vraies textures et ses tuiles de
    // détail au zoom (pages/ISS js/url.js : TUILES_ACTIVES = pas de ?jour). Le globe de l'organigramme reste inchangé.
    const AN_TERRE_REELLE = 2000;
    // En local (serveur de _outward, site/ servi sur localhost:8001), la page ISS de travail (site/Pesquet) et les cartes de
    // la copie locale de CO2 — même serveur, lisibles par son WebGL ; en ligne, les copies publiées.
    const EN_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const ISS_PAGE = EN_LOCAL ? '/Pesquet/' : 'https://dnavatar.org/pages/ISS/';
    const CO2_PUBLIE = EN_LOCAL ? new URL('./', location.href).href : 'https://dnavatar.org/pages/bilan_radiatif/CO2/';
    const O2_MASSIQUE_ACTUEL = 0.2314;   // part massique de l'O₂ de l'air d'aujourd'hui (référence de la luminescence)
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
        // la Terre vue de loin, depuis Iridium, en mode bilan radiatif
        const src = ISS_PAGE + '?provenance=CO2&sat=iridium&vue=terre&onglet' + (zenISS ? '&zen' : '') + '&atm=' + atmISS() + cartesISS();
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

    /** Organigramme en plein (onglet ISS) : il prend la taille et la place du panneau de l'onglet (index-shell.css,
     *  body.organigramme-plein), ses boutons butent sur ses bords ; la Terre est celle de la page ISS, qu'elle envoie (centre
     *  et rayon en px de sa page, pages/ISS js/hote.js). En sortant, la Terre de l'organigramme reprend sa place et sa taille. */
    let terreAvantPlein = null;
    function entrerOrganigrammePlein(panneau, classe) {
        if (document.body.classList.contains('organigramme-plein')) return;   // onglet re-cliqué (onglet, 🛰) : on y est déjà
        const T = window.TERRE_ECRAN;
        terreAvantPlein = { cx: T.cx, cy: T.cy, R: T.R, soleilTheta: T.soleilTheta };
        T.cadreEl = document.getElementById(panneau);
        document.body.classList.add('organigramme-plein', classe);
    }
    function sortirOrganigrammePlein(classe) {
        document.body.classList.remove('organigramme-plein', classe);
        window.TERRE_ECRAN.cadreEl = document.getElementById('flux-diagram');
        window.ZOOM_TERRE.poser(terreAvantPlein);
    }
    // ISS : la Terre est une vraie boule — cercle d'atmosphère et globe de l'organigramme sur son bord (TERRE_ECRAN.boule)
    function entrerPleinePageISS() { entrerOrganigrammePlein('iss-panel', 'terre-iss'); window.TERRE_ECRAN.boule = true; }
    function sortirPleinePageISS() { window.TERRE_ECRAN.boule = false; sortirOrganigrammePlein('terre-iss'); }
    // Histoire : titre et organigramme cachés, la courbe seule sur toute la largeur (index-shell.css, body.histoire)
    function entrerHistoire() { document.body.classList.add('histoire'); }
    function sortirHistoire() { document.body.classList.remove('histoire'); }
    /** Coordonnées de la page ISS → repère de #flux-diagram (coin intérieur) : l'iframe et l'organigramme sont dans la même
     *  fenêtre. */
    function poserTerreISS(t) {
        const i = document.getElementById('iss-iframe').getBoundingClientRect();
        const f = document.getElementById('flux-diagram'), fr = f.getBoundingClientRect();
        window.ZOOM_TERRE.poser({ cx: i.left + t.cx - fr.left - f.clientLeft, cy: i.top + t.cy - fr.top - f.clientTop, R: t.r,
            soleilTheta: t.soleil });   // le Soleil de l'organigramme du côté du vrai, il suit la caméra
        envoyerMargesISS();   // rayon ou Soleil changés : la place à gauche aussi
    }

    function zone() {
        return document.querySelector('#visu-panel .plot-container-wrapper');
    }

    /** Pose les panneaux sur la page Spectrale (#visu-panel), à droite de la frise (tout à gauche, 5 px après) jusqu'au bord
     *  droit : ISS et Histoire dès la frise, titre et organigramme par-dessus ; les autres après la colonne de l'organigramme
     *  (coordonnées de la fenêtre, position: fixed). Le rectangle des panneaux pleine page va au CSS (--onglet-haut,
     *  --onglet-gauche, --onglet-largeur, --onglet-hauteur) : l'organigramme en plein le reprend (index-shell.css). */
    function placer() {
        const page = document.getElementById('visu-panel').getBoundingClientRect();
        const apresFrise = document.getElementById('timeline-column').getBoundingClientRect().right + 5;
        const apresOrganigramme = document.getElementById('left-column').getBoundingClientRect().right + 5;
        const droite = page.right;
        PANNEAUX.forEach(function (id) {
            const gauche = PAGE_ENTIERE.includes(id) ? apresFrise : apresOrganigramme;
            const s = document.getElementById(id).style;
            s.top = page.top + 'px';
            s.left = gauche + 'px';
            s.width = (droite - gauche) + 'px';
            s.height = page.height + 'px';
        });
        const b = document.body.style;
        b.setProperty('--onglet-haut', page.top + 'px');
        b.setProperty('--onglet-gauche', apresFrise + 'px');
        b.setProperty('--onglet-largeur', (droite - apresFrise) + 'px');
        b.setProperty('--onglet-hauteur', page.height + 'px');
        envoyerMargesISS();
    }
    /** Bas du titre « Bilan Radiatif », en px de la page ISS : ses fenêtres Temps et Point de vue commencent dessous (pages/ISS
     *  js/url.js, ?provenance=CO2) ; et la place que l'organigramme demande à gauche de la Terre : la page ISS la décale vers
     *  la droite pour la laisser (pages/ISS js/hote.js). Envoyé quand le panneau bouge, à chaque chargement de la page ISS,
     *  quand sa Terre bouge et après un glisser dans l'organigramme. */
    function envoyerMargesISS() {
        const iframe = document.getElementById('iss-iframe');
        const haut = document.querySelector('#visu-panel .title-container').getBoundingClientRect().bottom - iframe.getBoundingClientRect().top;
        iframe.contentWindow.postMessage({ type: 'iss:marges', haut: haut, gauche: window.ZOOM_TERRE.placeAGauche() }, '*');
    }

    /** Spectre caché sous un autre onglet : son contenu sort du rendu (display: none, index-shell.css) et le canvas est
     *  effacé ; la zone garde sa taille, le panneau s'y pose. À l'onglet Spectrale, onShowVisu redimensionne (resize) et
     *  redessine (projectToVisu). */
    function spectreVisible(oui) {
        // Un autre onglet que Spectrale : pleine page — son contenu en grand, l'interface par-dessus (index-shell.css).
        document.body.classList.toggle('onglet-plein', !oui);
        placer();
        window.ZOOM_TERRE.redessiner();   // mise en page changée : boutons, satellites et flèches suivent
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
        document.getElementById('iss-iframe').addEventListener('load', envoyerMargesISS);
        document.getElementById('flux-diagram').addEventListener('pointerup', envoyerMargesISS);   // un bouton glissé
        window.addEventListener('resize', function () { window.ZOOM_TERRE.redessiner(); });   // cadre changé : boutons, flèches
        document.addEventListener('scroll', placer, true);
        placer();
        window.IO_LISTENER.on('compute:done', function () {
            if (window.API_ONGLETS.getCurrentTab() === 'iss') chargerISS();
        }, 'onglets_graphe');
    }

    window.ONGLETS_GRAPHE = { PANNEAUX: PANNEAUX, placer: placer, brancher: brancher, spectreVisible: spectreVisible, basculerZenISS: basculerZenISS,
        chargerISS: chargerISS, entrerPleinePageISS: entrerPleinePageISS, sortirPleinePageISS: sortirPleinePageISS,
        entrerHistoire: entrerHistoire, sortirHistoire: sortirHistoire };
})();
