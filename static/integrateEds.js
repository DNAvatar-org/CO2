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
        
        // Supprimer uniquement les anciennes div factors (garder le fond fillImage)
        const factors = rectangle.querySelectorAll('.flux-rectangle-factor');
        factors.forEach(factor => factor.remove());
        
        // Extraire le contenu de synthese_EdS et l'ajouter directement au rectangle
        while (syntheseEds.firstChild) {
            const child = syntheseEds.firstChild;
            // Assurer que chaque élément est au-dessus du fond (z-index: 0)
            if (child.nodeType === 1) { // Element node
                child.style.position = 'relative';
                child.style.zIndex = '10';
            }
            rectangle.appendChild(child);
        }
        
        // Supprimer la div synthese_EdS maintenant vide
        syntheseEds.remove();
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

