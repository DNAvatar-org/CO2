// File: CO2/organigramme/zoom_terre.js
// Desc: La Terre de l'organigramme à l'écran — TERRE_ECRAN, centre et rayon (configOrganigramme.js), paramètres des
//       placements autour d'elle : la molette change le rayon ; ZOOM_TERRE.poser({ cx, cy, R }) pose centre et rayon
//       (onglet ISS : la Terre de la page ISS, onglets_graphe.js). Puis on redessine ce qui en dépend : globe, noyau et
//       cercle d'atmosphère, boutons autour (EDS, CO₂, CH₄, H₂O, albédo), radiations, flèches.
//       Le zoom n'est pas limité par le cadre : seuls les boutons butent sur ses bords et sur les éléments de leur
//       bornesPar (emprise : cercle + textes non vides des cases autour), et les flèches gardent leur longueur minimale
//       (organigramme.js, generateArrows).
// Version 1.0.0
// Date: 2026-10-15
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const RT = window.TERRE_ECRAN;
    const R0 = RT.R;
    const R_MIN = R0 * 0.25;
    const R_MAX = R0 * 4;   // borne technique (taille du canvas WebGL), pas le cadre
    const PAS = 1.1;   // un cran de molette = ×1,1 sur le rayon
    const AUTOUR = ['reemis', 'co2', 'methane', 'h2o', 'albedo-btn'];   // cellules posées autour de la Terre
    const CENTRES = ['terre', 'noyau', 'albedo'];                         // cellules centrées sur la Terre
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
        const P = resolveRadiationArcParams(node.radiation, { openingAngle: 270, rotation: 270 });
        for (let i = 1; i <= P.numCircles; i++) {
            const t = i / P.numCircles;
            const r = node.radius + (P.maxRadius - node.radius) * t;
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
     *  par ⚗ / 🛰 compris (visibility : ils gardent leur place). Autre élément (DETAILS, OBSERVATIONS) : ses boutons et
     *  l'encre de son titre. Un morceau sans boîte (display: none) ne compte pas. */
    function boiteVisible(el) {
        const cercle = el.querySelector('.flux-circle-bg');
        const textes = cercle
            ? [...el.querySelectorAll('.flux-label')].filter((l) => l.textContent.trim() !== '')
            : [...el.querySelectorAll('.organigram-config-heading')];
        const boites = cercle ? [cercle] : [...el.querySelectorAll('button')];
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
     *  mesurées dans la page : un texte qui change de longueur change l'emprise. */
    function mesurer(id) {
        const n = noeud(id), cell = document.getElementById('cell-' + id);
        const c = cell.querySelector('.flux-circle-bg').getBoundingClientRect(), o = origine();
        const cx = c.left + c.width / 2 - o.x, cy = c.top + c.height / 2 - o.y;
        const b = boiteVisible(cell);
        n.emprise = { g: cx - b.g, d: b.d - cx, h: cy - b.h, b: b.b - cy };
        n.obstacles = n.bornesPar.map((idObstacle) => boiteVisible(document.getElementById(idObstacle)));
    }

    function appliquer(avant) {
        const maintenant = tailles(), terre = document.getElementById('cell-terre');
        const s = aLEchelle(terre, avant.terre, maintenant.terre);
        // canvas agrandi par CSS : sa résolution suit, la Terre reste nette
        terre.querySelector('canvas')._threeJSData.renderer.setPixelRatio(window.devicePixelRatio * s);
        aLEchelle(document.getElementById('cell-albedo'), avant.albedo, maintenant.albedo);
        CENTRES.forEach((id) => {
            const n = noeud(id), cell = document.getElementById('cell-' + id);
            cell.style.left = n.x + 'px';
            cell.style.top = n.y + 'px';
        });
        AUTOUR.forEach((id) => {
            mesurer(id);
            const n = noeud(id), cell = document.getElementById('cell-' + id);
            cell.style.left = n.x + 'px';
            cell.style.top = n.y + 'px';
        });
        window.ORG.recreateTerreRadiation();
        window.ORG.recreateNoyauRadiation();
        redessinerRadiation(noeud('albedo'));
        redessinerRadiation(noeud('reemis'));
        fleches();
    }

    /** Les textes changent à chaque calcul (valeurs, tableau de l'albédo) : emprises remesurées après le rendu des
     *  libellés ; un bouton que ses bords repoussent ailleurs → redessin au même rayon. */
    window.IO_LISTENER.on('compute:done', function () {
        requestAnimationFrame(function () {
            AUTOUR.forEach(mesurer);
            const bouge = AUTOUR.some((id) => {
                const n = noeud(id), cell = document.getElementById('cell-' + id);
                return parseFloat(cell.style.left) !== n.x || parseFloat(cell.style.top) !== n.y;
            });
            if (bouge) appliquer(tailles());
        });
    }, 'zoom_terre');

    /** Un redessin par trame : les changements d'une même trame (crans de molette, messages de la page ISS)
     *  s'additionnent ; les tailles d'avant sont celles du début de la trame. */
    let avantTrame = null;
    function changer(modifier) {
        if (avantTrame === null) {
            avantTrame = tailles();
            requestAnimationFrame(function () {
                appliquer(avantTrame);
                avantTrame = null;
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

    /** Centre et rayon de la Terre à l'écran, dans le repère de #flux-diagram [px] (onglet ISS : sa Terre). */
    window.ZOOM_TERRE = {
        poser(p) { changer(() => { RT.cx = p.cx; RT.cy = p.cy; RT.R = p.R; }); }
    };
})();
