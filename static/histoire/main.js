// File: CO2/static/histoire/main.js
// Desc: Point d'entrée de CO2/histoire.html : canvas, époques du TIMELINE, redimensionnement, interactions.
// Version 1.0.0
// Date: 2026-09-23
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
        v.width = canvas.width = window.innerWidth;
        v.height = canvas.height = window.innerHeight;
        if (v.xScale === 0) v.xScale = v.width / 800e6;   // départ : les 800 derniers millions d'années
        H.borner();
        redessiner();
    }
    window.addEventListener('resize', resize);
    H.brancherInteractions(canvas, redessiner);
    resize();
})();
