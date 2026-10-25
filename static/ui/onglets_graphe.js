// File: CO2/static/ui/onglets_graphe.js
// Desc: Les onglets Science, Bench, Milankovitch, Histoire et ISS s'affichent en PLEINE PAGE, sur toute la page Spectrale
//       (#visu-panel), son interface (titre, organigramme, frise) par-dessus. Les panneaux ne sont pas déplacés dans le DOM
//       (une iframe déplacée se recharge, et l'iframe scie perdrait sa synchro) : ils sont en position fixe, recalés quand
//       la zone change de taille, au redimensionnement et au défilement (c'est le body qui défile, index-shell.css).
// Version 1.10.0
// - v1.10.0: plus de bouton ⛶ du panneau ISS (zen de la page ISS) : le plein écran de la page, en bas, est le seul.
// - v1.9.0: page embarquée (static/ui/embarque.js) : pas de page ISS — la Terre est celle de l'hôte (iss:terre relayé, en
//   coordonnées de cette page), les cartes de l'époque lui vont (co2:cartes) ; miroir : le centre de la Terre à placeDuCote du
//   bord DROIT, l'horizon pris à droite.
// - v1.8.0: l'organigramme posé une fois pour toutes autour de la Terre de référence (iss:terre terreRef, zoom ×1) : il ne suit
//   plus le zoom, la vue ni le vrai Soleil ; la page ISS zoome sur un point d'horizon fixe.
// - v1.7.0: caméra de l'ISS : le cercle de l'organigramme est l'horizon de la haute atmosphère (iss:terre horizon), ses
//   boutons resserrés sur l'arc visible, autour du point sous le Soleil.
// - v1.6.4: iss:fenetres — l'organigramme troué à la place de Temps et Point de vue : ils passent par-dessus.
// - v1.6.3: iss:marges fenetres { gauche, haut } — Temps et Point de vue de la page ISS à gauche, sous Atmosphère.
// - v1.6.2: Entrée relayée à la fenêtre Milankovitch ouverte (milankovitch:valider).
// - v1.6.1: histoire:vue relayé à la fenêtre Milankovitch (milankovitch:periode).
// - v1.6.0: la fenêtre Spectre passe à fenetres.js (toutes les fenêtres de l'onglet ISS) ; Temps et Point de vue sous leur pile.
// - v1.5.1: iss:terre — vrai Soleil à l'écran et orbite de la Lune passés à l'organigramme ; fenêtre Spectre collée en haut, de
//   la Terre au bord droit.
// - v1.5.0: onglet ISS : le spectre dans une fenêtre repliable au-dessus de Temps (basculerSpectreISS) ; dépliée, Temps et
//   Point de vue descendent dessous.
// - v1.4.1: page ISS en caméra de l'ISS (iss:terre vue 'iss') : organigramme invisible (body.iss-horizon).
// - v1.4.0: page ISS chargée une fois, puis cartes / atmosphère / côté nuit lumineux envoyés par message (iss:cartes) : sa vue
//   et son Soleil restent d'une époque à l'autre ; lave (surface > point de Draper) : notIR = 70 ; pays seulement depuis 1750.
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

    // Onglet ISS : la page publiée (pages/ISS), en onglet (?onglet : ni signature ni ⛶ à elle), sans zen.
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
    let fenetresISS = [];   // rectangles de Temps et Point de vue dans la page ISS (iss:fenetres) : trous de l'organigramme
    /** Atmosphère du dernier calcul pour la page ISS (?atm=, pages/ISS js/url.js) : pression de surface 🎈 [atm] ; hauteur
     *  d'échelle H = R T / (M g) à la température de surface [km] ; luminescence nocturne (airglow : O, OH, Na, O₂ — toutes
     *  issues de l'oxygène) ∝ part massique d'O₂ rapportée à aujourd'hui (approximation déclarée). Sans air : p:0. */
    function atmEpoque() {
        const D = window.DATA;
        return { p: D['🫧']['🎈'], H: window.CONST.R_GAS * D['🧮']['🧮🌡️'] / (D['🫧']['🧪'] * D['📅']['🍎']) / 1000,
            lum: D['🫧']['🍰🫧🫁'] / O2_MASSIQUE_ACTUEL };
    }
    function atmISS() {
        const a = atmEpoque();
        return 'p:' + a.p.toFixed(3) + ',H:' + a.H.toFixed(2) + ',lum:' + a.lum.toFixed(3);
    }
    /** Année de la frise, signée (négative avant notre ère) : géologique = années avant le présent, sinon calendrier. */
    function anneeFrise() {
        const ans = window.getTimelineCurrentYears();
        return window.timelineEpochIsForward(window.getEpochAtTimelineIndex()) ? ans : -ans;
    }
    /** Cartes de l'époque pour la page ISS : { jour, nuit } en URL absolues, jour = null dès l'an 2000 (ses vraies textures),
     *  nuit = null sans carte de nuit (pas de lumières). */
    function cartesEpoque() {
        if (anneeFrise() >= AN_TERRE_REELLE) return { jour: null, nuit: null };
        const nuit = window.DATA['📜']['🌙'];
        return { jour: new URL(window._lastPlanetTexturePath, CO2_PUBLIE).href, nuit: nuit === '' ? null : new URL(nuit, CO2_PUBLIE).href };
    }
    function cartesISS() {
        const c = cartesEpoque();
        return (c.jour === null ? '' : '&jour=' + encodeURIComponent(c.jour)) + (c.nuit === null ? '' : '&nuit=' + encodeURIComponent(c.nuit));
    }
    // Côté nuit LUMINEUX (pages/ISS ?notIR=) : une surface au-dessus du point de Draper (798 K, début de l'incandescence
    // visible) brille d'elle-même — la lave de l'Hadéen ; la nuit montre alors sa carte de jour à NOT_IR_LAVE %. Sinon 0.
    // Pays (pages/ISS ?pays=) : seulement depuis 1750 — avant, une Terre sans frontières.
    const AN_PAYS = 1750;
    const T_DRAPER_K = 798;
    const NOT_IR_LAVE = 70;
    const notIRISS = () => (window.DATA['🧮']['🧮🌡️'] >= T_DRAPER_K ? NOT_IR_LAVE : 0);
    /** Page embarquée (static/ui/embarque.js) : les cartes de l'époque à l'hôte, qui les pose sur SA Terre (pas de page ISS) */
    function cartesHote() {
        const c = cartesEpoque();
        window.parent.postMessage({ type: 'co2:cartes', jour: c.jour, nuit: c.nuit, notIR: notIRISS(), atm: atmEpoque(),
            pays: anneeFrise() >= AN_PAYS }, '*');
    }
    /** Onglet ISS ouvert, ou nouveau calcul : les cartes de l'époque à la Terre — celle de l'hôte (embarquée), ou la page ISS */
    function chargerISS() {
        if (window.EMBARQUE.hote !== null) cartesHote();
        else chargerPageISS();
    }
    function chargerPageISS() {
        // la Terre vue de loin, depuis Iridium, en mode bilan radiatif
        const iframe = document.getElementById('iss-iframe');
        // Première ouverture : la page, avec les cartes de l'époque. Ensuite, jamais rechargée : les cartes de l'époque lui
        // sont envoyées (pages/ISS js/hote.js, iss:cartes) — sa vue, sa date et son Soleil, donc l'organigramme, restent.
        if (iframe.getAttribute('src') === null) {
            iframe.src = ISS_PAGE + '?provenance=CO2&sat=iridium&vue=terre&onglet&atm=' + atmISS()
                + cartesISS() + '&notIR=' + notIRISS() + '&pays=' + (anneeFrise() >= AN_PAYS);
            return;
        }
        const c = cartesEpoque();
        iframe.contentWindow.postMessage({ type: 'iss:cartes', jour: c.jour, nuit: c.nuit, notIR: notIRISS(), atm: atmEpoque(),
            pays: anneeFrise() >= AN_PAYS }, '*');
    }

    // Onglet Histoire : un clic sur le logo d'une époque est un clic sur la frise.
    window.addEventListener('message', function (e) {
        if (e.data.type === 'histoire:epoque') window.setEpochFromEpochButton(e.data.id);
        // période visible d'Histoire → la fenêtre Milankovitch la prend (html/test_milankovitch.html)
        if (e.data.type === 'histoire:vue') document.querySelector('#milankovitch-panel iframe').contentWindow.postMessage(
            { type: 'milankovitch:periode', debut: e.data.debut, fin: e.data.fin }, '*');
        if (e.data.type === 'iss:fenetres') { fenetresISS = e.data.rects; trouerOrganigramme(); }
        if (e.data.type === 'iss:terre' && window.API_ONGLETS.getCurrentTab() === 'iss') {
            // caméra de l'ISS : pas de Terre entière — l'organigramme se répartit le long de l'horizon (poserTerreISS)
            document.body.classList.toggle('iss-horizon', e.data.vue === 'iss');
            poserTerreISS(e.data);
        }
    });

    // Entrée, fenêtre Milankovitch ouverte (dépliée sur l'onglet ISS, ou onglet courant) : son bouton VALIDER. Tapée dans
    // la page Milankovitch elle-même, la touche y reste (static/milankovitch/entrees.js).
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        if (window.FENETRES.ouverte() !== 'milankovitch' && window.API_ONGLETS.getCurrentTab() !== 'milankovitch') return;
        document.querySelector('#milankovitch-panel iframe').contentWindow.postMessage({ type: 'milankovitch:valider' }, '*');
    });

    /** Organigramme en plein (onglet ISS) : il prend la taille et la place du panneau de l'onglet (index-shell.css,
     *  body.organigramme-plein), ses boutons butent sur ses bords ; la Terre est celle de la page ISS, qu'elle envoie (centre
     *  et rayon en px de sa page, pages/ISS js/hote.js). En sortant, la Terre de l'organigramme reprend sa place et sa taille. */
    let terreAvantPlein = null;
    function entrerOrganigrammePlein(panneau, classe) {
        if (document.body.classList.contains('organigramme-plein')) return;   // onglet re-cliqué (onglet, 🛰) : on y est déjà
        const T = window.TERRE_ECRAN;
        terreAvantPlein = { cx: T.cx, cy: T.cy, R: T.R, soleilVrai: null, orbite: null, horizon: null, ref: { cx: T.cx, cy: T.cy, R: T.R } };
        T.cadreEl = document.getElementById(panneau);
        document.body.classList.add('organigramme-plein', classe);
    }
    function sortirOrganigrammePlein(classe) {
        document.body.classList.remove('organigramme-plein', classe);
        window.TERRE_ECRAN.cadreEl = document.getElementById('flux-diagram');
        window.ZOOM_TERRE.poser(terreAvantPlein);
    }
    // ISS : la Terre est une vraie boule — cercle d'atmosphère et globe de l'organigramme sur son bord (TERRE_ECRAN.boule)
    function entrerPleinePageISS() { entrerOrganigrammePlein('iss-panel', 'terre-iss'); window.TERRE_ECRAN.boule = true; window.FENETRES.poser(); }
    function sortirPleinePageISS() {
        window.TERRE_ECRAN.boule = false; sortirOrganigrammePlein('terre-iss');
        document.body.classList.remove('iss-horizon');   // hors de l'onglet ISS, l'organigramme est toujours visible
        document.body.classList.remove('iss-lune');
        window.FENETRES.montrer(null);   // le spectre retrouve sa place (Spectrale) ou se cache (autres onglets)
        trouerOrganigramme();   // hors de l'onglet ISS : plus de trous
    }
    function effacerSpectre() {
        const canvas = document.getElementById('spectral-visualization');
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
    // Histoire : titre et organigramme cachés, la courbe seule sur toute la largeur (index-shell.css, body.histoire)
    function entrerHistoire() { document.body.classList.add('histoire'); }
    function sortirHistoire() { document.body.classList.remove('histoire'); }
    /** Coordonnées de la page ISS → repère de #flux-diagram (coin intérieur) : l'iframe et l'organigramme sont dans la même
     *  fenêtre. Embarquée : l'hôte a déjà ramené sa Terre aux coordonnées de cette page (origine : son coin). */
    function poserTerreISS(t) {
        const i = window.EMBARQUE.hote === null ? document.getElementById('iss-iframe').getBoundingClientRect() : { left: 0, top: 0 };
        const f = document.getElementById('flux-diagram'), fr = f.getBoundingClientRect();
        const ox = i.left - fr.left - f.clientLeft, oy = i.top - fr.top - f.clientTop;
        // Le cercle d'atmosphère suit la vraie Terre (vue Terre) ou l'horizon (caméra de l'ISS) : concentrique, de rayon
        // très grand quand on zoome sur le point d'horizon fixe (pages/ISS js/hote.js decalerTerre). Les pictos s'y posent
        // comme autour de la Terre ×1 (ref), angles resserrés dans le rapport des rayons (configOrganigramme.js versEcran :
        // même étendue le long du limbe, la répartition s'aplatit), écarts à l'échelle de la Terre ×1, le point d'horizon à
        // la gauche de la Terre (θ = π). Vue Terre–Lune : autour de la Terre ×1. Le Soleil à sa place.
        const ref = { cx: t.terreRef.cx + ox, cy: t.terreRef.cy + oy, R: t.terreRef.r };
        const c = t.vue === 'iss' ? { cx: t.horizon.cx, cy: t.horizon.cy, r: t.horizon.r }
            : t.orbite === null ? { cx: t.cx, cy: t.cy, r: t.r } : { cx: t.terreRef.cx, cy: t.terreRef.cy, r: t.terreRef.r };
        // point d'horizon fixe : le bord gauche de la Terre ×1 (pages/ISS js/hote.js pointHorizon) ; le droit en miroir (embarquée :
        // l'hôte donne sa Terre telle quelle comme référence, k = 1)
        const bord = window.TERRE_ECRAN.miroir ? ref.R : -ref.R;
        window.ZOOM_TERRE.poser({ cx: c.cx + ox, cy: c.cy + oy, R: c.r, soleilVrai: null, orbite: null, ref: ref,
            horizon: { haut: Math.atan2(ref.cy - c.cy - oy, ref.cx + bord - c.cx - ox), k: ref.R / c.r, rTerre: ref.R } });
        document.body.classList.toggle('iss-lune', t.vue === 'ext' && t.orbite !== null);   // T° dans le titre, cercle effacé (index-shell.css)
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
        window.FENETRES.poser();   // la pile des fenêtres suit le panneau
        envoyerMargesISS();
        trouerOrganigramme();
    }
    /** Temps et Point de vue de la page ISS (rectangles en px de sa page, iss:fenetres) : l'organigramme, posé par-dessus
     *  l'iframe, est troué à leur place (clip-path evenodd) — on les lit et on les clique au travers. Hors de l'onglet ISS,
     *  aucun trou. */
    function trouerOrganigramme() {
        const f = document.getElementById('flux-diagram');
        if (!document.body.classList.contains('terre-iss')) { f.style.clipPath = ''; return; }
        const i = document.getElementById('iss-iframe').getBoundingClientRect(), fr = f.getBoundingClientRect();
        const ox = i.left - fr.left, oy = i.top - fr.top;
        const trous = fenetresISS.map((r) => 'M' + (r.x + ox) + ' ' + (r.y + oy) + 'h' + r.w + 'v' + r.h + 'h' + (-r.w) + 'Z').join('');
        f.style.clipPath = "path(evenodd, 'M0 0H" + fr.width + 'V' + fr.height + 'H0Z' + trous + "')";
    }
    /** Bord gauche d'Energies / Atmosphère et 10 px sous eux, en px de la page ISS : ses fenêtres Temps et Point de vue
     *  s'empilent là, à gauche, et s'ouvrent vers le bas (pages/ISS js/url.js, ?provenance=CO2) ; et la place que l'organigramme demande à
     *  gauche de la Terre : la page ISS y pose le centre de sa Terre (pages/ISS js/hote.js).
     *  Envoyé quand le panneau bouge, à chaque chargement de la page ISS, quand sa Terre bouge, après un glisser dans
     *  l'organigramme et quand une fenêtre se plie ou se déplie. */
    function envoyerMargesISS() {
        const iframe = document.getElementById('iss-iframe'), cadre = iframe.getBoundingClientRect();
        const boutons = document.getElementById('titre-affichages').getBoundingClientRect();   // Energies, Atmosphère
        const fenetres = { gauche: boutons.left - cadre.left, haut: boutons.bottom - cadre.top + 10 };
        // vue Terre–Lune : pas de place à faire, la page ISS garde son cadrage (la Terre au milieu de l'image) ; miroir : la
        // place est à droite, le centre de la Terre à cette distance du bord droit
        const place = window.ZOOM_TERRE.placeDuCote();
        const gauche = window.TERRE_ECRAN.orbite !== null ? iframe.clientWidth / 2
            : window.TERRE_ECRAN.miroir ? iframe.clientWidth - place : place;
        iframe.contentWindow.postMessage({ type: 'iss:marges', gauche: gauche, fenetres: fenetres }, '*');
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
        effacerSpectre();
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

    window.ONGLETS_GRAPHE = { PANNEAUX: PANNEAUX, placer: placer, brancher: brancher, spectreVisible: spectreVisible,
        chargerISS: chargerISS, effacerSpectre: effacerSpectre, envoyerMargesISS: envoyerMargesISS, entrerPleinePageISS: entrerPleinePageISS, sortirPleinePageISS: sortirPleinePageISS,
        entrerHistoire: entrerHistoire, sortirHistoire: sortirHistoire };
})();
