// File: integrateEds.js - Intégration de synthese_EdS dans le rectangle Effet de Serre
// Desc: Déplace le contenu de synthese_EdS dans le flux-cellRect d'effetSerre
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [November 18, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: intégration de synthese_EdS dans l'organigramme

(function() {
    'use strict';
    
    function integrateSyntheseEds() {
        const edsCell = document.getElementById('cell-effetSerre');
        const syntheseEds = document.querySelector('.synthese_EdS');
        
        if (!edsCell || !syntheseEds) {
            console.warn('cell-effetSerre ou synthese_EdS non trouvé, réessayer...');
            setTimeout(integrateSyntheseEds, 100);
            return;
        }
        
        // Trouver le rectangle dans la cellule
        const rectangle = edsCell.querySelector('.flux-rectangle');
        
        if (!rectangle) {
            console.warn('flux-rectangle non trouvé dans cell-effetSerre');
            return;
        }
        
        // Styliser synthese_EdS pour qu'elle s'intègre bien dans le rectangle
        syntheseEds.style.position = 'relative';
        syntheseEds.style.zIndex = '2'; // Au-dessus du logo de fond
        syntheseEds.style.padding = '8px';
        syntheseEds.style.background = 'rgba(255, 255, 255, 0.9)';
        syntheseEds.style.borderRadius = '8px';
        syntheseEds.style.fontSize = '10px';
        syntheseEds.style.width = 'calc(100% - 16px)';
        syntheseEds.style.maxWidth = '100%';
        syntheseEds.style.boxShadow = 'none';
        
        // Déplacer synthese_EdS dans le rectangle
        rectangle.appendChild(syntheseEds);
        
        console.log('Synthèse EdS intégrée dans le rectangle Effet de Serre');
    }
    
    // Attendre que le DOM et l'organigramme soient chargés
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(integrateSyntheseEds, 500);
        });
    } else {
        setTimeout(integrateSyntheseEds, 500);
    }
})();

