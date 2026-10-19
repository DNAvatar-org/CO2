// File: CO2/organigramme/zoom_terre.js
// Desc: La Terre de l'organigramme à l'écran — TERRE_ECRAN, centre et rayon (configOrganigramme.js), paramètres des
//       placements autour d'elle : la molette change le rayon ; ZOOM_TERRE.poser({ cx, cy, R }) pose centre et rayon
//       (onglet ISS : la Terre de la page ISS, onglets_graphe.js). Puis on redessine ce qui en dépend : globe, noyau et
//       cercle d'atmosphère, boutons autour (EDS, CO₂, CH₄, H₂O, albédo), bloc Soleil + Géométrie (en haut à gauche du
//       cercle), satellites (sous les 🛰), radiations, flèches.
//       Le zoom n'est pas limité par le cadre : seuls les boutons butent sur ses bords et sur les éléments de leur
//       bornesPar (emprise : cercle + textes non vides des cases autour), et les flèches gardent leur longueur minimale
//       (organigramme.js, generateArrows). Soleil, albédo, EDS, satellites et l'éventail CO₂ / H₂O / CH₄ se glissent à la souris
//       (leur angle et leur distance autour de la Terre) ; la Géométrie suit le Soleil, au bord de son rayonnement ; les ondes
//       suivent leurs flèches.
// Version 1.1.13
// - v1.1.13: la Géométrie se rapproche du Soleil (distPct, de 45 à 100 % du bord de son rayonnement).
// - v1.1.12: miroir (page embarquée, configOrganigramme.js TERRE_ECRAN.miroir) : placeDuCote remplace placeAGauche — la place
//   que l'organigramme demande de son côté de la Terre (à droite en miroir) ; la Géométrie glissée garde son angle de disposition.
// - v1.1.11: poser reçoit ref (la Terre au zoom ×1) : T° et pression, place à gauche s'y rapportent.
// - v1.1.10: poser reçoit horizon (caméra de l'ISS) ; glisser et place à gauche passent par versEcran / depuisEcran.
// - v1.1.9: la Géométrie se glisse autour du Soleil (son angle) ; T° et pression posées sur la Terre (SYNTHESE_SUR_TERRE) ;
//   les 🛰 n'ont plus d'action au clic.
// - v1.1.8: place à gauche bornée par le Soleil lui-même (son emprise), plus par son rayonnement.
// - v1.1.7: relâché sans bouger = clic (auClic) : le 🛰 du satellite IR reste glissable et bascule OBSERVATIONS.
// - v1.1.6: poser reçoit le vrai Soleil à l'écran et l'orbite de la Lune ; glisser et place à gauche suivent l'ellipse.
// - v1.1.5: onglet ISS, place à gauche : le rayonnement du Soleil touche le bord gauche (Terre et organigramme décalés à gauche).
// - v1.1.4: l'effet de serre (EDS) se glisse aussi ; au relâcher, angle et distance du bouton écrits en console.
// - v1.1.3: poser n'impose plus l'angle du vrai Soleil : celui de l'organigramme reste où on l'a mis.
// - v1.1.2: Soleil glissé : son angle et sa distance retenus en cookie au relâcher, repris au chargement.
// - v1.1.1: rien n'est mesuré ni redessiné avant le premier dessin de l'organigramme (flux:lastDrawn : les blocs 🛰
//   OBSERVATIONS, obstacles des boutons, existent alors) ; les changements d'avant s'appliquent d'un coup.
// Date: 2026-10-16
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const RT = window.TERRE_ECRAN;
    const R0 = RT.R;
    const R_MIN = R0 * 0.25;
    const R_MAX = R0 * 4;   // borne technique (taille du canvas WebGL), pas le cadre
    const PAS = 1.1;   // un cran de molette = ×1,1 sur le rayon
    // cellules posées autour de la Terre (boutons et satellites) ; les 🛰 OBSERVATIONS centrés sur leur satellite
    const AUTOUR = ['reemis', 'co2', 'methane', 'h2o', 'albedo-btn', 'espace1', 'espace2', 'soleil'];
    const SATELLITES = { espace1: 'observation-config-wrap', espace2: 'observation-config-wrap-bas' };
    /** La Géométrie au plus près du Soleil : % du bord de son rayonnement */
    const GEOMETRIE_MIN_PCT = 45;
    // cellules posées sans emprise : centrées sur la Terre, et la Géométrie (au bord du rayonnement du Soleil)
    const POSEES = ['terre', 'noyau', 'albedo', 'geometrie'];
    const flux = document.getElementById('flux-diagram');
    const noeud = (id) => window.configOrganigramme.nodes.find((n) => n.id === id);

    /** Tailles qui mettent à l'échelle les cellules terre (k) et albedo (rayon du cercle d'atmosphère), relevées AVANT un
     *  changement de TERRE_ECRAN. */
    const tailles = () => ({ terre: RT.k(), albedo: noeud('albedo').radius });

    /** terre et albedo : leur cercle EST un rayon autour de la Terre. Une cellule née à la taille t₀ est mise à l'échelle
     *  t / t₀ autour de son centre ; recréée (changement d'époque), elle naît à la bonne taille (accesseurs de
     *  configOrganigramme). Une cellule qu'on n'a pas encore vue est née avant ce changement : t₀ = la taille d'avant. */
    const naissance = new WeakMap();   // cellule → { taille, transform } à sa création
    function aLEchelle(cell, tailleAvant, taille) {
        if (!naissance.has(cell)) naissance.set(cell, { taille: tailleAvant, transform: cell.style.transform });
        const n = naissance.get(cell);
        const s = taille / n.taille;
        cell.style.transform = n.transform + ' scale(' + s + ')';
        return s;
    }

    /** Radiation d'un nœud à rayon fixe dans la config (albedo, reemis), redessinée dans son groupe, ouverture finale
     *  directement (pas d'animation à chaque cran). Mêmes défauts que la construction (organigramme.js, étape 8). */
    function redessinerRadiation(node) {
        const groupe = flux.querySelector('.flux-radiation-group[data-node="' + node.id + '"]');
        groupe.replaceChildren();
        const P = resolveRadiationArcParams(node.radiation, { openingAngle: 270, rotation: 270, rayonDepart: node.radius });
        for (let i = 1; i <= P.numCircles; i++) {
            const t = i / P.numCircles;
            const r = P.rayonDepart + (P.maxRadius - P.rayonDepart) * t;
            const arc = createArc(node.x, node.y, r, 0.3 + t * 0.2, P.openingFinal, P.rotation, groupe);
            arc.style.border = P.strokeSize + 'px dashed ' + P.color;
        }
    }

    /** generateArrows recrée les libellés des flèches avec leur texte de config : on y reporte le texte affiché. */
    function fleches() {
        const avant = new Map();
        flux.querySelectorAll('.flux-label[data-id]').forEach((l) => {
            if (!l.closest('.flux-grid-item')) avant.set(l.dataset.id, { html: l.innerHTML, classe: l.className });
        });
        window.ORG.generateArrows();
        flux.querySelectorAll('.flux-label[data-id]').forEach((l) => {
            if (l.closest('.flux-grid-item') || !avant.has(l.dataset.id)) return;
            l.innerHTML = avant.get(l.dataset.id).html;
            l.className = avant.get(l.dataset.id).classe;
        });
    }

    /** Origine des coordonnées des cellules : coin intérieur (bordure exclue) de #flux-diagram, dans la fenêtre. */
    function origine() {
        const r = flux.getBoundingClientRect();
        return { x: r.left + flux.clientLeft, y: r.top + flux.clientTop };
    }

    /** Rectangle de l'ENCRE d'un texte : ses lignes, pas la boîte de son élément (une case de grille de 100 px pour
     *  « 0 ppm » collé au cercle). */
    function encre(texte) {
        const plage = document.createRange();
        plage.selectNodeContents(texte);
        return plage.getBoundingClientRect();
    }

    /** Boîte de ce qui est VISIBLE dans un élément, bords { g, d, h, b } en px de #flux-diagram. Cellule : son cercle et
     *  l'encre des textes NON VIDES des 8 cases autour (une case vide, si large soit-elle, ne compte pas) ; textes masqués
     *  par ⚗ / 🛰 compris (visibility : ils gardent leur place). Bloc de boutons (🛰 OBSERVATIONS) : ses boutons et l'encre
     *  de son titre. Cadre simple (le titre « Bilan Radiatif ») : tout entier. Un morceau sans boîte (display: none) ne
     *  compte pas. */
    function boiteVisible(el) {
        const cercle = el.querySelector('.flux-circle-bg'), boutons = el.classList.contains('organigram-buttons');
        const textes = cercle
            ? [...el.querySelectorAll('.flux-label')].filter((l) => l.textContent.trim() !== '')
            : boutons ? [...el.querySelectorAll('.organigram-config-heading')] : [];
        const boites = cercle ? [cercle] : boutons ? [...el.querySelectorAll('button')] : [el];
        const rects = [...boites.map((m) => m.getBoundingClientRect()), ...textes.map(encre)];
        const o = origine(), b = { g: Infinity, d: -Infinity, h: Infinity, b: -Infinity };
        rects.forEach((r) => {
            if (r.width === 0 || r.height === 0) return;
            b.g = Math.min(b.g, r.left - o.x);
            b.d = Math.max(b.d, r.right - o.x);
            b.h = Math.min(b.h, r.top - o.y);
            b.b = Math.max(b.b, r.bottom - o.y);
        });
        return b;
    }

    /** Emprise d'un bouton autour de son centre (= centre du cercle, posé en x, y) et boîtes de ses obstacles (bornesPar),
     *  mesurées dans la page : un texte qui change de longueur change l'emprise. Satellite : son 🛰 OBSERVATIONS, centré sur
     *  lui (appliquer) — l'emprise est la demi-boîte visible du 🛰 (bouton et titre). */
    function mesurer(id) {
        const n = noeud(id);
        if (id in SATELLITES) {
            const b = boiteVisible(document.getElementById(SATELLITES[id]));
            n.emprise = { g: (b.d - b.g) / 2, d: (b.d - b.g) / 2, h: (b.b - b.h) / 2, b: (b.b - b.h) / 2 };
        } else {
            const cell = document.getElementById('cell-' + id);
            const c = cell.querySelector('.flux-circle-bg').getBoundingClientRect(), o = origine();
            const cx = c.left + c.width / 2 - o.x, cy = c.top + c.height / 2 - o.y;
            const b = boiteVisible(cell);
            n.emprise = { g: cx - b.g, d: b.d - cx, h: cy - b.h, b: b.b - cy };
        }
        n.obstacles = n.bornesPar.map((idObstacle) => boiteVisible(document.getElementById(idObstacle)));
    }

    /** Les 🛰 OBSERVATIONS centrés sur leur satellite (au lieu des coins de l'organigramme, organigramme.css). */
    function poserSatellites() {
        Object.keys(SATELLITES).forEach((id) => {
            const n = noeud(id), s = document.getElementById(SATELLITES[id]).style;
            s.left = n.x + 'px'; s.top = n.y + 'px'; s.right = 'auto'; s.bottom = 'auto'; s.transform = 'translate(-50%, -50%)';
        });
    }

    function appliquer(avant) {
        const maintenant = tailles(), terre = document.getElementById('cell-terre');
        const s = aLEchelle(terre, avant.terre, maintenant.terre);
        // canvas agrandi par CSS : sa résolution suit, la Terre reste nette
        terre.querySelector('canvas')._threeJSData.renderer.setPixelRatio(window.devicePixelRatio * s);
        aLEchelle(document.getElementById('cell-albedo'), avant.albedo, maintenant.albedo);
        POSEES.forEach((id) => {
            const n = noeud(id), cell = document.getElementById('cell-' + id);
            cell.style.left = n.x + 'px';
            cell.style.top = n.y + 'px';
        });
        // logo de la Géométrie tourné de son angle : sa face éclairée vers le Soleil (vers la gauche à angle 0)
        document.querySelector('#cell-geometrie img').style.rotate = noeud('geometrie').angle + 'rad';
        // T° et pression sur la Terre (SYNTHESE_SUR_TERRE), en px de la fenêtre : leur bloc reste dans le titre, en
        // position fixe (index-shell.css)
        const o = origine(), st = window.SYNTHESE_SUR_TERRE, b = document.body.style;
        b.setProperty('--synthese-x', (o.x + RT.ref.cx + st.k * RT.ref.R * Math.cos(st.theta)) + 'px');   // sur la Terre ×1
        b.setProperty('--synthese-y', (o.y + RT.ref.cy + st.k * RT.ref.R * Math.sin(st.theta)) + 'px');
        AUTOUR.forEach((id) => {
            mesurer(id);
            const n = noeud(id), cell = document.getElementById('cell-' + id);
            cell.style.left = n.x + 'px';
            cell.style.top = n.y + 'px';
        });
        poserSatellites();
        window.ORG.recreateTerreRadiation();
        window.ORG.recreateNoyauRadiation();
        redessinerRadiation(noeud('albedo'));
        redessinerRadiation(noeud('reemis'));
        redessinerRadiation(noeud('soleil'));
        fleches();
    }

    /** Les textes changent à chaque calcul (valeurs, tableau de l'albédo) : emprises remesurées après le rendu des
     *  libellés ; un bouton que ses bords repoussent ailleurs → redessin au même rayon. */
    window.IO_LISTENER.on('compute:done', function () {
        if (!pret) return;                                  // le premier dessin mesure tout (flux:lastDrawn ci-dessous)
        requestAnimationFrame(function () {
            AUTOUR.forEach(mesurer);
            const pas = (el, n) => parseFloat(el.style.left) !== n.x || parseFloat(el.style.top) !== n.y;
            const bouge = AUTOUR.some((id) => pas(document.getElementById('cell-' + id), noeud(id)))
                || Object.keys(SATELLITES).some((id) => pas(document.getElementById(SATELLITES[id]), noeud(id)));
            if (bouge) appliquer(tailles());
        });
    }, 'zoom_terre');

    /** Un redessin par trame : les changements d'une même trame (crans de molette, messages de la page ISS)
     *  s'additionnent ; les tailles d'avant sont celles du début de la trame. */
    let avantTrame = null;
    // L'organigramme est-il dessiné (flux:lastDrawn) ? Avant, main.js n'a pas encore créé les blocs 🛰 OBSERVATIONS, obstacles des
    // boutons et place des satellites : on note les changements (centre, rayon, Soleil) sans mesurer ni redessiner ; le premier
    // dessin les applique tous.
    let pret = false;
    // Emprises à zéro jusqu'à la première mesure (placeDuCote les lit dès le chargement de la page ISS).
    AUTOUR.forEach((id) => { noeud(id).emprise = { g: 0, d: 0, h: 0, b: 0 }; });
    window.IO_LISTENER.on('flux:lastDrawn', function () {
        if (pret) return;
        // après les autres écouteurs du même événement (main.js crée les blocs 🛰 dans le sien)
        requestAnimationFrame(function () { pret = true; appliquer(tailles()); });
    }, 'zoom_terre:pret');
    function changer(modifier) {
        if (!pret) { modifier(); return; }
        if (avantTrame === null) {
            avantTrame = tailles();
            requestAnimationFrame(function () {
                const avant = avantTrame;
                avantTrame = null;   // AVANT appliquer : une erreur dans ce redessin ne bloque pas les suivants
                appliquer(avant);
            });
        }
        modifier();
    }

    /** La molette zoome sur le cercle d'atmosphère (albedo) ou sur le globe quand il le dépasse ; ailleurs elle fait
     *  défiler la page. */
    flux.addEventListener('wheel', function (e) {
        const o = origine(), t = noeud('terre');
        const zone = Math.max(noeud('albedo').radius, getNodeProperty(t, 'radiusExobase'));
        if (Math.hypot(e.clientX - o.x - t.x, e.clientY - o.y - t.y) > zone) return;
        e.preventDefault();
        changer(() => { RT.R = Math.min(R_MAX, Math.max(R_MIN, RT.R * (e.deltaY < 0 ? PAS : 1 / PAS))); });
    }, { passive: false });

    /** Glisser à la souris (Soleil, albédo, EDS, satellites 🛰, gaz) : la position donne l'angle et la distance autour de la Terre (theta,
     *  rayonPct en % du cercle d'atmosphère, jamais dedans) ; ce qui en dépend suit (Géométrie, flèches). Le mouvement n'est
     *  écouté que pendant le glisser. */
    /** Glisser à la souris : angle et distance du nœud autour de la Terre. Relâché sans avoir bougé de plus de 3 px : un
     *  clic (auClic). placer(n, x, y) pose le nœud sous la souris (x, y : repère de #flux-diagram [px]) et rend ce qu'il
     *  faut recopier dans configOrganigramme.js : par défaut, angle et distance autour de la Terre. */
    const autourDeLaTerre = (n, x, y) => {
        n.theta = RT.depuisEcran(Math.atan2(y - RT.cy, x - RT.cx));
        n.rayonPct = RT.rayonPctDe(n.theta, Math.hypot(x - RT.cx, y - RT.cy));
        return 'theta: ' + n.theta.toFixed(3) + ', rayonPct: ' + Math.round(n.rayonPct);
    };
    function rendreGlissable(poignee, id, auLacher = () => {}, auClic = () => {}, placer = autourDeLaTerre) {
        const n = noeud(id);
        poignee.style.cursor = 'grab';
        let depart = { x: 0, y: 0 }, bouge = false, releve = '';
        const glisser = (e) => {
            bouge = bouge || Math.hypot(e.clientX - depart.x, e.clientY - depart.y) > 3;
            if (!bouge) return;
            const o = origine();
            changer(() => { releve = placer(n, e.clientX - o.x, e.clientY - o.y); });
        };
        const lacher = (e) => {
            poignee.removeEventListener('pointermove', glisser);
            poignee.style.cursor = 'grab';
            if (bouge) {
                console.info('[zoom_terre] ' + id + ' : ' + releve);   // à recopier dans configOrganigramme.js
                auLacher(n);
            } else if (e.type === 'pointerup') auClic();
        };
        poignee.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            depart = { x: e.clientX, y: e.clientY };
            bouge = false;
            poignee.setPointerCapture(e.pointerId);
            poignee.style.cursor = 'grabbing';
            poignee.addEventListener('pointermove', glisser);
        });
        poignee.addEventListener('pointerup', lacher);
        poignee.addEventListener('pointercancel', lacher);
    }
    // Le Soleil garde la place où on l'a glissé, d'une visite à l'autre : angle et distance (theta, rayonPct) en cookie, écrits
    // au relâcher, repris ici au chargement (avant le premier dessin).
    const COOKIE_SOLEIL = 'bilan_radiatif_soleil';
    const souvenirSoleil = document.cookie.split('; ').find((c) => c.startsWith(COOKIE_SOLEIL + '='));
    if (souvenirSoleil !== undefined) {
        const [theta, rayonPct] = souvenirSoleil.split('=')[1].split(',').map(Number);
        noeud('soleil').theta = theta;
        noeud('soleil').rayonPct = rayonPct;
    }
    rendreGlissable(document.querySelector('#cell-soleil .flux-circle-bg'), 'soleil', (n) => {
        document.cookie = COOKIE_SOLEIL + '=' + n.theta.toFixed(4) + ',' + n.rayonPct.toFixed(2) + '; max-age=31536000; path=/; SameSite=Lax';
    });
    rendreGlissable(document.querySelector('#cell-albedo-btn .flux-circle-bg'), 'albedo-btn');
    rendreGlissable(document.querySelector('#cell-reemis .flux-circle-bg'), 'reemis');
    // l'éventail CO₂ / H₂O / CH₄ (configOrganigramme.js) : CO₂ ou H₂O l'ouvrent, CH₄ le tourne
    ['co2', 'h2o', 'methane'].forEach((id) => rendreGlissable(document.querySelector('#cell-' + id + ' .flux-circle-bg'), id));
    // la Géométrie tourne autour du Soleil et s'en rapproche : son angle, sa distance en % du bord du rayonnement (de
    // GEOMETRIE_MIN_PCT à 100 : jamais dans le Soleil, jamais au-delà de ses ondes)
    rendreGlissable(document.querySelector('#cell-geometrie .flux-circle-bg'), 'geometrie', undefined, undefined, (n, x, y) => {
        const soleil = noeud('soleil');
        n.angle = RT.angleEcran(Math.atan2(y - soleil.y, x - soleil.x));   // angle de la disposition (miroir retourné)
        const d = Math.hypot(x - soleil.x, y - soleil.y) / soleil.radiation.maxRadius * 100;
        n.distPct = Math.min(100, Math.max(GEOMETRIE_MIN_PCT, d));
        return 'angle: ' + n.angle.toFixed(3) + ', distPct: ' + Math.round(n.distPct);
    });

    /** poser : centre et rayon de la Terre à l'écran, dans le repère de #flux-diagram [px], vrai Soleil à l'écran et orbite de
     *  la Lune (onglet ISS : soleilVrai, orbite, configOrganigramme.js TERRE_ECRAN ; null : le Soleil garde sa place, le
     *  cercle d'atmosphère). redessiner : la mise en page a changé (pleine page, redimensionnement). */
    window.ZOOM_TERRE = {
        poser(p) { changer(() => { RT.cx = p.cx; RT.cy = p.cy; RT.R = p.R; RT.soleilVrai = p.soleilVrai; RT.orbite = p.orbite; RT.horizon = p.horizon; RT.ref = p.ref; }); },
        redessiner() { changer(() => {}); },
        /** Place que la disposition demande du côté de l'organigramme [px] — à gauche du centre de la Terre, à droite en
         *  miroir —, posés à leur angle et leur distance (sans les bords du cadre, qui les repoussent) : boutons, satellites
         *  et Soleil lui-même (pas son rayonnement, qui peut sortir du cadre) gardent une marge. La page ISS pose le centre
         *  de sa Terre à cette distance du bord (onglets_graphe.js, message iss:marges ; pages/ISS js/hote.js). */
        placeDuCote() {
            const s = RT.miroir ? -1 : 1;   // vers le côté de l'organigramme : −x (gauche), +x en miroir
            const debord = (n) => -s * RT.distanceAutour(n.theta, n.rayonPct) * Math.cos(RT.versEcran(n.theta));
            const debordSoleil = RT.soleilVrai === null ? debord(noeud('soleil')) : s * (RT.cx - RT.soleilVrai.x);   // le vrai Soleil, s'il est à l'écran
            const emprise = (n) => (RT.miroir ? n.emprise.d : n.emprise.g);
            // depuis le centre de la Terre ×1 (ref) : la page ISS pose là le centre de sa Terre au zoom ×1
            return 16 - s * (RT.cx - RT.ref.cx) + Math.max(...AUTOUR.map((id) => (id === 'soleil' ? debordSoleil : debord(noeud(id))) + emprise(noeud(id))));
        },
        rendreGlissable: rendreGlissable   // les 🛰, créés plus tard par main.js
    };
})();
