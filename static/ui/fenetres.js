// File: CO2/static/ui/fenetres.js
// Desc: Onglet ISS en fond (la Terre et l'organigramme toujours ouverts) : Spectrale, Histoire, Bench, Science et Milankovitch
//       sont des fenêtres empilées en haut à droite, au-dessus de Temps et Point de vue de la page ISS. Repliées : leur titre
//       et un +. Une seule dépliée à la fois : elle monte tout en haut, contre le bord droit, son − dans son coin, les
//       titres repliés se rangent dessous. Mouvements en
//       transition (index-shell.css). Un onglet cliqué déplie sa fenêtre, ISS les replie toutes (switchTab, loader_panels.js).
//       Taille commune à toutes les fenêtres, bornée au panneau : TAILLE_DEFAUT, ou celle choisie à la poignée (coin bas
//       gauche), retenue en cookie. Au premier chargement, Spectrale est ouverte (loader_panels.js).
// Version 1.2.2
// - v1.2.2: plus de bas de pile : Temps et Point de vue de la page ISS vont à gauche, sous Atmosphère (onglets_graphe.js).
// - v1.2.1: FENETRES.ouverte() (Entrée relayée à Milankovitch, onglets_graphe.js).
// - v1.2.0: taille par défaut 1000 × 555 px (la fenêtre ne suit plus le bord de la Terre).
// - v1.1.0: poignée coin bas gauche (largeur, hauteur) ; taille en cookie.
// Date: 2026-10-16
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const ORDRE = ['visu', 'histoire', 'bench', 'scie', 'milankovitch'];
    // Contenu de chaque fenêtre : la zone du graphe spectral (page Spectrale) ou le panneau de l'onglet.
    const CONTENU = {
        visu: () => document.querySelector('#visu-panel .plot-container-wrapper'),
        histoire: () => document.getElementById('histoire-panel'),
        bench: () => document.getElementById('bench-panel'),
        scie: () => document.getElementById('scie-panel'),
        milankovitch: () => document.getElementById('milankovitch-panel')
    };
    // Dépliée : le spectre se dessine (comme à l'onglet Spectrale), Science reçoit l'état et le dernier calcul ; repliée, le
    // spectre est caché et effacé comme sous les autres onglets.
    const A_L_OUVERTURE = {
        visu() {
            CONTENU.visu().classList.remove('spectre-cache');
            window.dispatchEvent(new Event('resize'));   // Plotly et canvas à la taille de la fenêtre (plot.js)
            if (window.DATA['🧮']['🧮🌡️'] !== undefined) window.projectToVisu(window.DATA);
        },
        histoire() {}, bench() {}, milankovitch() {},
        scie() { window.synchroniserScie(); }
    };
    const A_LA_FERMETURE = {
        visu() { CONTENU.visu().classList.add('spectre-cache'); window.ONGLETS_GRAPHE.effacerSpectre(); },
        histoire() {}, bench() {}, scie() {}, milankovitch() {}
    };
    const MARGE = 8;        // [px] du bord du panneau ISS, et entre la fenêtre et les titres repliés
    const PAS_TITRE = 30;   // [px] un titre replié
    let ouverte = null;     // id de la fenêtre dépliée, ou null
    // Taille { largeur, hauteur } [px] : par défaut, ou choisie à la poignée et retenue en cookie.
    const COOKIE_TAILLE = 'bilan_radiatif_fenetre';
    const TAILLE_DEFAUT = { largeur: 1000, hauteur: 555 };
    const TAILLE_MIN = { largeur: 260, hauteur: 160 };
    const souvenir = document.cookie.split('; ').find((c) => c.startsWith(COOKIE_TAILLE + '='));
    let taille = TAILLE_DEFAUT;
    if (souvenir !== undefined) {
        const [largeur, hauteur] = souvenir.split('=')[1].split(',').map(Number);
        taille = { largeur: largeur, hauteur: hauteur };
    }
    /** Une taille bornée au panneau ISS (page : son rectangle) : jamais sous TAILLE_MIN, jamais hors du panneau. */
    const bornee = (t, page) => ({
        largeur: Math.min(Math.max(t.largeur, TAILLE_MIN.largeur), page.width - 2 * MARGE),
        hauteur: Math.min(Math.max(t.hauteur, TAILLE_MIN.hauteur), page.height - 2 * MARGE)
    });

    const titre = (id) => document.querySelector('.fenetre-tete[data-fenetre="' + id + '"]');
    const bouton = (id) => document.getElementById('tab-' + id);

    /** Range la pile : la fenêtre dépliée en haut (hauteur commune --fenetre-hauteur), son titre dans son coin ; les titres
     *  repliés dessous, dans l'ordre des onglets. */
    function poser() {
        const page = document.getElementById('iss-panel').getBoundingClientRect();
        const haut = page.top + MARGE, droite = page.right - MARGE, t = bornee(taille, page), hauteur = t.hauteur;
        const s = document.body.style;
        s.setProperty('--fenetre-haut', haut + 'px');
        s.setProperty('--fenetre-hauteur', hauteur + 'px');
        s.setProperty('--fenetre-gauche', (droite - t.largeur) + 'px');
        let y = haut;
        if (ouverte !== null) { titre(ouverte).style.top = (y + 6) + 'px'; y += hauteur + MARGE; }
        ORDRE.filter((id) => id !== ouverte).forEach((id) => { titre(id).style.top = y + 'px'; y += PAS_TITRE; });
    }

    /** Déplie la fenêtre id (null : toutes repliées) ; celle qui l'était se replie. */
    function montrer(id) {
        if (ouverte !== null) {
            CONTENU[ouverte]().classList.remove('fenetre-ouverte');
            titre(ouverte).classList.remove('deplie');
            bouton(ouverte).classList.remove('active');
            A_LA_FERMETURE[ouverte]();
        }
        ouverte = id;
        if (ouverte !== null) {
            CONTENU[ouverte]().classList.add('fenetre-ouverte');
            titre(ouverte).classList.add('deplie');
            bouton(ouverte).classList.add('active');
            A_L_OUVERTURE[ouverte]();
        }
        document.body.classList.toggle('fenetre-deplie', ouverte !== null);   // la poignée se montre (index-shell.css)
        poser();
        window.ONGLETS_GRAPHE.envoyerMargesISS();
    }

    /** Poignée (coin bas gauche de la fenêtre dépliée) : le bord droit reste, la souris donne la largeur et la hauteur,
     *  bornées au panneau ; Temps et Point de vue suivent. Au relâcher : taille en cookie, spectre redimensionné. */
    function brancherPoignee() {
        const poignee = document.getElementById('fenetre-poignee');
        const glisser = (e) => {
            const page = document.getElementById('iss-panel').getBoundingClientRect();
            const droite = page.right - MARGE, haut = page.top + MARGE;
            taille = bornee({ largeur: droite - e.clientX, hauteur: e.clientY - haut }, page);
            poser();
            window.ONGLETS_GRAPHE.envoyerMargesISS();
        };
        const lacher = () => {
            poignee.removeEventListener('pointermove', glisser);
            document.cookie = COOKIE_TAILLE + '=' + Math.round(taille.largeur) + ',' + Math.round(taille.hauteur)
                + '; max-age=31536000; path=/; SameSite=Lax';
            window.dispatchEvent(new Event('resize'));   // Plotly et canvas du spectre à la nouvelle taille (plot.js)
        };
        poignee.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            poignee.setPointerCapture(e.pointerId);
            poignee.addEventListener('pointermove', glisser);
        });
        poignee.addEventListener('pointerup', lacher);
        poignee.addEventListener('pointercancel', lacher);
    }
    brancherPoignee();

    window.FENETRES = {
        montrer: montrer,
        poser: poser,
        basculer(id) { montrer(ouverte === id ? null : id); },
        ouverte: () => ouverte
    };
})();
