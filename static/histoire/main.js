// File: CO2/static/histoire/main.js
// Desc: Point d'entrée de CO2/histoire.html : canvas, époques du TIMELINE, redimensionnement, interactions.
// Version 1.0.1
// Date: 2026-09-24
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
        if (v.xScale === 0) v.xScale = v.width / 800e6;   // départ : les 800 derniers millions d'années
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
    H.brancherInteractions(canvas, redessiner);
    resize();
})();
