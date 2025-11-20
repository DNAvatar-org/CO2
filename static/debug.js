// File: debug.js - Interface de debug pour le style
// Desc: Permet de basculer entre les modes d'affichage (Blur/No-Blur)
// Version 1.0.1

(function () {
    'use strict';

    function initDebugInterface() {
        const container = document.querySelector('.bottom-info');
        if (!container) return;

        const debugContainer = document.createElement('div');
        debugContainer.className = 'debug-interface';
        // debugContainer.style.marginTop = '10px'; // Déjà géré par bottom-info
        debugContainer.style.display = 'flex';
        debugContainer.style.justifyContent = 'center';
        debugContainer.style.gap = '10px';

        // Style commun pour les petits boutons
        const btnStyle = `
            padding: 2px 8px;
            cursor: pointer;
            background: rgba(0, 0, 0, 0.3);
            color: #aaa;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            font-size: 10px;
            font-family: sans-serif;
            transition: all 0.2s;
        `;

        // Bouton Blur On/Off
        const blurBtn = document.createElement('button');
        blurBtn.textContent = 'Blur Off';
        blurBtn.style.cssText = btnStyle;

        blurBtn.onclick = function () {
            document.body.classList.toggle('no-blur');
            if (document.body.classList.contains('no-blur')) {
                blurBtn.textContent = 'Blur On';
                blurBtn.style.background = '#667eea'; // Actif
                blurBtn.style.color = '#fff';
            } else {
                blurBtn.textContent = 'Blur Off';
                blurBtn.style.background = 'rgba(0, 0, 0, 0.3)';
                blurBtn.style.color = '#aaa';
            }
        };

        debugContainer.appendChild(blurBtn);

        container.appendChild(debugContainer);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDebugInterface);
    } else {
        initDebugInterface();
    }
})();
