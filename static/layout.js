// File: layout.js - Gestion automatique du layout en deux colonnes
// Desc: Réorganise les divs dans left-column et right-column selon la largeur d'écran
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: système de layout automatique avec deux colonnes

(function() {
    'use strict';
    
    // Ordre des divs
    const order = [
        'title-container',
        'flux-diagram',
        'plot-container-wrapper',
        'timeline-display',
        'button-container',
        'synthese_EdS',
        'synthese_Temp'
    ];
    
    // Fonction pour réorganiser les divs selon la largeur d'écran
    function reorganizeLayout() {
        const screenWidth = window.innerWidth;
        const leftColumn = document.getElementById('left-column');
        const rightColumn = document.getElementById('right-column');
        
        if (!leftColumn || !rightColumn) {
            console.error('left-column ou right-column non trouvé');
            return;
        }
        
        // Récupérer toutes les divs AVANT de vider les colonnes
        // (important : les récupérer avant de les déplacer)
        const divs = {};
        order.forEach(className => {
            // Chercher dans tout le document, pas seulement dans .container
            const element = document.querySelector('.' + className);
            if (element) {
                divs[className] = element;
            } else {
                console.warn('Div non trouvée:', className);
            }
        });
        
        // Vider les colonnes APRÈS avoir récupéré les références
        leftColumn.innerHTML = '';
        rightColumn.innerHTML = '';
        
        // LEFT COLUMN
        // 1. title-container (toujours)
        if (divs['title-container']) {
            leftColumn.appendChild(divs['title-container']);
        }
        
        // 2. (screenWidth>400)?flux-diagram:plot-container-wrapper
        if (screenWidth > 400) {
            if (divs['flux-diagram']) {
                leftColumn.appendChild(divs['flux-diagram']);
            }
        } else {
            if (divs['plot-container-wrapper']) {
                leftColumn.appendChild(divs['plot-container-wrapper']);
            }
        }
        
        // 3. synthese_Temp
        if (divs['synthese_Temp']) {
            leftColumn.appendChild(divs['synthese_Temp']);
        }
        
        // RIGHT COLUMN
        // 1. (screenWidth>400)?plot-container-wrapper:flux-diagram
        if (screenWidth > 400) {
            if (divs['plot-container-wrapper']) {
                rightColumn.appendChild(divs['plot-container-wrapper']);
            }
        } else {
            if (divs['flux-diagram']) {
                rightColumn.appendChild(divs['flux-diagram']);
            }
        }
        
        // 2. timeline-display
        if (divs['timeline-display']) {
            rightColumn.appendChild(divs['timeline-display']);
        }
        
        // 3. button-container
        if (divs['button-container']) {
            rightColumn.appendChild(divs['button-container']);
        }
        
        // 4. synthese_EdS
        if (divs['synthese_EdS']) {
            rightColumn.appendChild(divs['synthese_EdS']);
        }
    }
    
    // Réorganiser au chargement
    function initLayout() {
        // Vérifier que les éléments existent avant de réorganiser
        const leftColumn = document.getElementById('left-column');
        const rightColumn = document.getElementById('right-column');
        const titleContainer = document.querySelector('.title-container');
        
        if (leftColumn && rightColumn && titleContainer) {
            reorganizeLayout();
        } else {
            // Réessayer après un court délai si les éléments ne sont pas encore là
            setTimeout(initLayout, 50);
        }
    }
    
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLayout);
    } else {
        // DOM déjà chargé, attendre un peu pour que les autres scripts s'exécutent
        setTimeout(initLayout, 50);
    }
    
    // Réorganiser au redimensionnement (avec debounce)
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(reorganizeLayout, 100);
    });
    
    // Exposer la fonction globalement pour réorganisation manuelle si nécessaire
    if (typeof window !== 'undefined') {
        window.reorganizeLayout = reorganizeLayout;
    }
})();

