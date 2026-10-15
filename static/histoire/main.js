// File: CO2/static/histoire/main.js
// Desc: Point d'entrée de CO2/histoire.html : canvas, époques du TIMELINE, redimensionnement, interactions.
// Version 1.1.1
// - v1.1.1: histoire:prolonger — les tranches de 25 ans de 📱 jouées hors run prolongent la courbe orange.
// - v1.1.0: courbe du modèle retracée en direct par le banc de l'index (messages histoire:courbe / histoire:point).
// Date: 2026-10-15
// - v1.0.2: départ dézoomé (toute la durée, −150 → 400 °C).
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HISTOIRE;
    const canvas = document.getElementById('graph');
    const ctx = canvas.getContext('2d');
    const v = H.vue;
    H.listeEpoques = H.epoques();
    const redessiner = () => H.render(ctx);
    function resize() {
        // Iframe cachée (onglet inactif) : taille nulle. On ne dessine pas, et
        // surtout on n'empoisonne pas la vue : borner() ferait span = 0/0 = NaN,
        // d'où xOffset = NaN que Math.max ne rattraperait plus jamais.
        if (window.innerWidth === 0 || window.innerHeight === 0) return;
        v.width = canvas.width = window.innerWidth;
        v.height = canvas.height = window.innerHeight;
        if (v.xScale === 0) {   // départ (vue.js, H.DEPART_T) : toute la durée, de −150 à 400 °C
            v.xScale = v.width / (H.T_MAX_AGO - H.T_MIN_AGO);
            v.yScale = v.height / (H.DEPART_T[1] - H.DEPART_T[0]);
        }
        H.borner();
        redessiner();
    }
    window.addEventListener('resize', resize);
    // Onglet Histoire : l'iframe est chargée en display:none (taille 0), puis
    // révélée au clic sur l'onglet — sans qu'aucun 'resize' window ne se déclenche
    // dans l'iframe. On observe donc la racine : dès que l'iframe reprend une
    // taille non nulle, on redimensionne le canvas et on redessine.
    if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
            if (window.innerWidth > 0 &&
                (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight)) {
                resize();
            }
        });
        ro.observe(document.documentElement);
    }
    // Banc de l'index (static/ui/bench_pilote.js) : au lancement, la courbe du modèle qu'il refait repart de zéro
    // (H.modeleFrise pour ▶ Époques, H.modele pour ▶ Tictimes), puis reçoit un point par calcul. Iframe cachée (autre
    // onglet, taille nulle) : les points s'accumulent, le dessin attend que l'onglet s'affiche (resize).
    window.addEventListener('message', function (e) {
        if (e.data.type === 'histoire:courbe') H[e.data.courbe] = { mode: e.data.mode, bary: e.data.bary, points: [] };
        else if (e.data.type === 'histoire:point') H[e.data.courbe].points.push(e.data.point);
        // Tranche de 25 ans jouée sur 📱 hors run : le point remplace ceux de même date ou plus tardifs (t = années avant
        // L.AN, il décroît vers le futur), pour qu'un autre scénario rejoué depuis une tranche reparte de là.
        else if (e.data.type === 'histoire:prolonger') {
            const M = H[e.data.courbe], p = e.data.point;
            M.points = M.points.filter((q) => q.t > p.t);
            M.points.push(p);
        }
        else return;
        if (v.width > 0) redessiner();
    });
    H.brancherInteractions(canvas, redessiner);
    resize();
})();
