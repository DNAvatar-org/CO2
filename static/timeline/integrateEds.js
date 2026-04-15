// File: integrateEds.js - Intégration de synthese_EdS dans le rectangle Effet de Serre
// Desc: Déplace le contenu de synthese_EdS dans le flux-cellRect d'effetSerre
// Version 1.0.0
// Date: [November 18, 2025] [HH:MM UTC+1]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI

(function() {
    'use strict';
    
    function integrateSyntheseEds() {
        const edsCell = document.getElementById('cell-effetSerre');
        const syntheseEds = document.querySelector('.synthese_EdS');
        
        if (!edsCell || !syntheseEds) {
            // DOM : cell-effetSerre / synthese_EdS pas encore injectés (visu_radiatif.html). Retry 100ms.
            setTimeout(integrateSyntheseEds, 100);
            return;
        }
        
        // Trouver le rectangle dans la cellule
        const rectangle = edsCell.querySelector('.flux-rectangle');
        
        if (!rectangle) {
            return;
        }
        
        // Supprimer uniquement les anciennes div factors (garder le fond fillImage)
        const factors = rectangle.querySelectorAll('.flux-rectangle-factor');
        factors.forEach(factor => factor.remove());
        
        // Extraire le contenu de synthese_EdS et l'ajouter directement au rectangle
        // Retirer le trait séparateur, la ligne "Forç:" (diagnostic ΔF affichage) et l'en-tête "(W/m²)"
        while (syntheseEds.firstChild) {
            const child = syntheseEds.firstChild;
            // Ignorer le trait séparateur (info-separator-line), la ligne forçage total (forcing-total-row)
            // et l'en-tête avec "(W/m²)" (info-unit-header)
            if (child.nodeType === 1 && // Element node
                (child.classList.contains('info-separator-line') || 
                 child.classList.contains('forcing-total-row') ||
                 child.classList.contains('info-unit-header'))) {
                // Retirer cet élément sans l'ajouter au rectangle
                syntheseEds.removeChild(child);
                continue;
            }
            // Assurer que chaque élément est au-dessus du fond (z-index: 0)
            if (child.nodeType === 1) { // Element node
                child.style.position = 'relative';
                child.style.zIndex = '10';
            }
            rectangle.appendChild(child);
        }
        
        // Répartir les lignes sur toute la hauteur sans marge
        // Le rectangle utilise déjà flexbox avec flex-direction: column
        // Ajuster pour répartir uniformément sur toute la hauteur
        rectangle.style.justifyContent = 'space-between'; // Répartir uniformément
        rectangle.style.gap = '0'; // Pas de gap entre les lignes
        rectangle.style.padding = '0'; // Pas de padding
        
        // Supprimer la div synthese_EdS maintenant vide
        syntheseEds.remove();
    }
    
    // DOM : organigramme génère nodes/arrows dynamiquement. 500ms pour laisser generateNodes/Arrows finir.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(integrateSyntheseEds, 500);
        });
    } else {
        setTimeout(integrateSyntheseEds, 500);
    }
})();

