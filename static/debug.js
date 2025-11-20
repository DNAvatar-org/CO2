// ============================================================================
// File: debug.js - Interface de debug pour le style
// Desc: En français, dans l'architecture, je suis le module d'interface de debug
// Version 1.0.1
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: interface de debug pour basculer entre modes d'affichage
// ============================================================================

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

        // Bouton pour changer la police globale
        const fontBtn = document.createElement('button');
        
        // Liste des polices disponibles
        const fonts = ['04B_03', 'ProggyDotted', 'Tahoma', 'Roboto', 'Verdana'];
        // Trouver l'index de la police actuelle (synchroniser avec window.globalFontFamily)
        const currentFont = window.globalFontFamily || '04B_03';
        let currentFontIndex = fonts.indexOf(currentFont);
        if (currentFontIndex === -1) currentFontIndex = 0; // Fallback si non trouvé
        
        // Initialiser le texte du bouton avec la police actuelle
        fontBtn.textContent = `Font: ${currentFont}`;
        fontBtn.style.cssText = btnStyle;
        
        fontBtn.onclick = function () {
            // Passer à la police suivante
            currentFontIndex = (currentFontIndex + 1) % fonts.length;
            const newFont = fonts[currentFontIndex];
            
            // Mettre à jour la police globale
            if (typeof window !== 'undefined') {
                window.globalFontFamily = newFont;
            }
            
            // Appliquer au body avec fallbacks pour '04B_03'
            if (newFont === '04B_03') {
                document.body.style.fontFamily = "'04B_03', 'Tahoma', 'Roboto', 'Verdana', sans-serif";
            } else {
                document.body.style.fontFamily = `'${newFont}', 'Tahoma', 'Roboto', 'Verdana', sans-serif`;
            }
            
            // Mettre à jour le texte du bouton
            fontBtn.textContent = `Font: ${newFont}`;
            
            // Mettre à jour Plotly via updatePlot (qui utilise getPlotlyFont avec window.globalFontFamily)
            if (typeof window.updatePlot === 'function') {
                const plotData = typeof window.plotData !== 'undefined' ? window.plotData : null;
                if (plotData) {
                    // Forcer la mise à jour immédiate
                    window.updatePlot(plotData);
                }
            }
        };
        
        debugContainer.appendChild(fontBtn);

        container.appendChild(debugContainer);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDebugInterface);
    } else {
        initDebugInterface();
    }
})();
