// File: CO2/static/ui/fenetres.js
// Desc: Onglet ISS en fond (la Terre et l'organigramme toujours ouverts) : Spectrale, Histoire, Bench, Science et Milankovitch
//       sont des fenêtres dont les titres (titre et +) forment une rangée tout en haut, alignée à droite, par-dessus la
//       scène. Une seule dépliée à la fois : sous la rangée, contre le bord droit, son titre éclairé avec un −. Un onglet
//       cliqué déplie sa fenêtre, ISS les replie toutes (switchTab, loader_panels.js).
//       Taille commune à toutes les fenêtres, bornée au panneau : par défaut LARGEUR_DEFAUT et jusqu'au-dessus des boutons
//       ⓒ et ⛶ du coin bas droit, ou celle choisie à la poignée (coin bas gauche) ou au bord gauche (largeur seule),
//       retenue en cookie. Au premier chargement, Spectrale est ouverte (loader_panels.js).
// Version 1.4.0
// - v1.4.0: bord gauche saisissable (largeur seule).
// - v1.3.0: titres en rangée horizontale en haut ; hauteur par défaut jusqu'au-dessus de ⓒ et ⛶.
// Date: 2026-11-02
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
    const MARGE = 8;            // [px] du bord du panneau ISS, et entre la rangée des titres et la fenêtre
    const HAUTEUR_RANGEE = 20;  // [px] la rangée des titres (bouton + / − de 20 px, index-shell.css)
    const BOUTONS_BAS = 46;     // [px] haut de ⓒ depuis le bas du panneau (12 + 34 : pages/ISS #bCredits, seul dans le coin)
    const FROLE = 4;            // [px] entre le bas de la fenêtre et ⓒ, ⛶
    let ouverte = null;     // id de la fenêtre dépliée, ou null
    // Taille choisie { largeur, hauteur } [px], retenue en cookie (« auto » pour null) : chacune null tant qu'on ne l'a pas
    // choisie (la poignée choisit les deux, le bord gauche la largeur seule) — la taille par défaut, LARGEUR_DEFAUT et la hauteur
    // jusqu'au-dessus de ⓒ et ⛶, qui suit le panneau.
    const COOKIE_TAILLE = 'bilan_radiatif_fenetre';
    const LARGEUR_DEFAUT = 1000;
    const TAILLE_MIN = { largeur: 260, hauteur: 160 };
    const souvenir = document.cookie.split('; ').find((c) => c.startsWith(COOKIE_TAILLE + '='));
    let taille = { largeur: null, hauteur: null };
    if (souvenir !== undefined) {
        const [largeur, hauteur] = souvenir.split('=')[1].split(',').map((v) => (v === 'auto' ? null : Number(v)));
        taille = { largeur: largeur, hauteur: hauteur };
    }
    /** Haut de la fenêtre dépliée : sous la rangée des titres (page : le rectangle du panneau ISS). */
    const hautFenetre = (page) => page.top + MARGE + HAUTEUR_RANGEE + MARGE;
    /** Une taille bornée au panneau ISS : jamais sous TAILLE_MIN, jamais hors du panneau. */
    const bornee = (t, page) => ({
        largeur: Math.min(Math.max(t.largeur, TAILLE_MIN.largeur), page.width - 2 * MARGE),
        hauteur: Math.min(Math.max(t.hauteur, TAILLE_MIN.hauteur), page.bottom - MARGE - hautFenetre(page))
    });
    /** La taille de la fenêtre dépliée, bornée au panneau : chaque dimension choisie, sinon LARGEUR_DEFAUT et jusqu'au-dessus de
     *  ⓒ et ⛶. */
    const tailleCourante = (page) => bornee({
        largeur: taille.largeur === null ? LARGEUR_DEFAUT : taille.largeur,
        hauteur: taille.hauteur === null ? page.bottom - BOUTONS_BAS - FROLE - hautFenetre(page) : taille.hauteur
    }, page);

    const titre = (id) => document.querySelector('.fenetre-tete[data-fenetre="' + id + '"]');
    const bouton = (id) => document.getElementById('tab-' + id);

    /** Pose la rangée des titres en haut à droite du panneau ISS, et la fenêtre dépliée dessous (--fenetre-haut,
     *  --fenetre-gauche, --fenetre-hauteur) : à sa taille choisie, sinon jusqu'au-dessus de ⓒ et ⛶. */
    function poser() {
        const page = document.getElementById('iss-panel').getBoundingClientRect();
        const haut = hautFenetre(page), droite = page.right - MARGE;
        const t = tailleCourante(page);
        const rangee = document.getElementById('fenetres-titres').style;
        rangee.top = (page.top + MARGE) + 'px';
        rangee.right = (document.documentElement.clientWidth - droite) + 'px';
        const s = document.body.style;
        s.setProperty('--fenetre-haut', haut + 'px');
        s.setProperty('--fenetre-hauteur', t.hauteur + 'px');
        s.setProperty('--fenetre-gauche', (droite - t.largeur) + 'px');
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

    /** Glisser un élément de la fenêtre dépliée : le bord droit reste, voulue(e, page) donne les dimensions que la souris choisit
     *  (les autres gardent leur choix ou leur défaut), bornées au panneau ; Temps et Point de vue suivent. Au relâcher : taille en
     *  cookie, spectre redimensionné. */
    function brancherGlisser(element, voulue) {
        const page = () => document.getElementById('iss-panel').getBoundingClientRect();
        const glisser = (e) => {
            const p = page(), v = voulue(e, p), t = bornee(Object.assign(tailleCourante(p), v), p);
            for (const k of Object.keys(v)) taille[k] = t[k];
            poser();
            window.ONGLETS_GRAPHE.envoyerMargesISS();
        };
        const lacher = () => {
            element.removeEventListener('pointermove', glisser);
            element.removeEventListener('pointerup', lacher);
            element.removeEventListener('pointercancel', lacher);
            element.classList.remove('glisse');
            const ecrire = (v) => (v === null ? 'auto' : Math.round(v));
            document.cookie = COOKIE_TAILLE + '=' + ecrire(taille.largeur) + ',' + ecrire(taille.hauteur)
                + '; max-age=31536000; path=/; SameSite=Lax';
            window.dispatchEvent(new Event('resize'));   // Plotly et canvas du spectre à la nouvelle taille (plot.js)
        };
        element.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            element.setPointerCapture(e.pointerId);
            element.classList.add('glisse');
            element.addEventListener('pointermove', glisser);
            element.addEventListener('pointerup', lacher);
            element.addEventListener('pointercancel', lacher);
        });
    }
    // Poignée (coin bas gauche) : largeur et hauteur ; bord gauche : la largeur seule.
    brancherGlisser(document.getElementById('fenetre-poignee'),
        (e, p) => ({ largeur: p.right - MARGE - e.clientX, hauteur: e.clientY - hautFenetre(p) }));
    brancherGlisser(document.getElementById('fenetre-bord'),
        (e, p) => ({ largeur: p.right - MARGE - e.clientX }));

    window.FENETRES = {
        montrer: montrer,
        poser: poser,
        basculer(id) { montrer(ouverte === id ? null : id); },
        ouverte: () => ouverte
    };
})();
