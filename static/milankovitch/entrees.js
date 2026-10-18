// File: CO2/static/milankovitch/entrees.js
// Desc: Entrées de la page Milankovitch (html/test_milankovitch.html) : clic sur le dessin → popup d'explication ; Entrée →
//       VALIDER (updateChart), tapée dans la page ou relayée par l'index quand la fenêtre Milankovitch est ouverte
//       (milankovitch:valider, static/ui/onglets_graphe.js). Chargé après le script de la page (updateChart).
// Version 1.0.0
// Date: [October 18, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const popup = document.getElementById('milankovitch-explication');
    document.getElementById('milankovitch-dessin').addEventListener('click', () => popup.showModal());
    popup.querySelector('.milankovitch-fermer').addEventListener('click', () => popup.close());
    // clic sur le fond, hors du cadre de la popup
    popup.addEventListener('click', (e) => {
        const r = popup.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) popup.close();
    });

    document.addEventListener('keydown', (e) => {
        // sur un bouton, Entrée le clique déjà (VALIDER : pas deux tracés)
        if (e.key === 'Enter' && !popup.open && e.target.tagName !== 'BUTTON') updateChart();
    });
    window.addEventListener('message', (e) => {
        if (e.data.type === 'milankovitch:valider') updateChart();
    });
})();
