// File: layout.js - Gestion automatique du layout en deux colonnes
// Desc: Réorganise les divs dans left-column et right-column selon la largeur d'écran
// Version 1.0.2
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: système de layout automatique avec deux colonnes
//   - Moved timeline-display to top of right column for visibility

(function() {
    'use strict';
    
    // Ordre des divs
    const order = [
        'title-container',
        'flux-diagram-wrapper',
        'plot-container-wrapper',
        'timeline-display'
        // synthese_EdS est intégrée dans l'organigramme par integrateEds.js, donc pas besoin de la positionner
    ];
    
    // Fonction pour réorganiser les divs selon la largeur d'écran
    function reorganizeLayout() {
        const screenWidth = window.innerWidth;
        const leftColumn = document.getElementById('left-column');
        const rightColumn = document.getElementById('right-column');
        
        if (!leftColumn || !rightColumn) {
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
    
    // 2. (screenWidth>400)?flux-diagram-wrapper:plot-container-wrapper
    if (screenWidth > 400) {
        if (divs['flux-diagram-wrapper']) {
            leftColumn.appendChild(divs['flux-diagram-wrapper']);
        }
    } else {
        if (divs['plot-container-wrapper']) {
            leftColumn.appendChild(divs['plot-container-wrapper']);
        }
    }
    
    
    // RIGHT COLUMN
    // 1. timeline-display (en haut pour visibilité)
    if (divs['timeline-display']) {
        rightColumn.appendChild(divs['timeline-display']);
    }
    
    // 2. (screenWidth>400)?plot-container-wrapper:flux-diagram-wrapper
    if (screenWidth > 400) {
        if (divs['plot-container-wrapper']) {
            rightColumn.appendChild(divs['plot-container-wrapper']);
        }
    } else {
        if (divs['flux-diagram-wrapper']) {
            rightColumn.appendChild(divs['flux-diagram-wrapper']);
        }
    }
    
    // synthese_EdS est intégrée dans l'organigramme par integrateEds.js, donc pas besoin de la positionner
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

