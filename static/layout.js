// File: layout.js - Gestion automatique du layout en deux colonnes
// Desc: Réorganise les divs dans left-column et right-column selon la largeur d'écran
// Version 1.0.2
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
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
        'timeline-display',
        'fps-display' // Ajouté pour le positionnement dynamique
        // synthese_EdS est intégrée dans l'organigramme par integrateEds.js, donc pas besoin de la positionner
    ];
    
    // Fonction pour réorganiser les divs selon la largeur d'écran
    function reorganizeLayout() {
        const screenWidth = window.innerWidth;
        const leftColumn = document.getElementById('left-column');
        const rightColumn = document.getElementById('right-column');
        const container = document.querySelector('.container');
        
        if (!leftColumn || !rightColumn || !container) {
            return;
        }
        
        // Si widthScreen < 1000, passer la colonne right sous la colonne left
        if (screenWidth < 1000) {
            // Changer la direction du container en colonne
            container.style.flexDirection = 'column';
            // La colonne right reste à 999px de large
            rightColumn.style.width = '999px';
            rightColumn.style.maxWidth = '999px';
        } else {
            // Direction normale en ligne
            container.style.flexDirection = 'row';
            // Réinitialiser la largeur de right-column
            rightColumn.style.width = '';
            rightColumn.style.maxWidth = '';
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
        
        // Récupérer les sous-colonnes de left
        const leftLeft = document.getElementById('left-left');
        const leftTimeline = document.getElementById('left-timeline');
        
        if (!leftLeft || !leftTimeline) {
            return;
        }
        
        // Vider les colonnes APRÈS avoir récupéré les références
        leftLeft.innerHTML = '';
        leftTimeline.innerHTML = '';
        rightColumn.innerHTML = '';
        
        // LEFT COLUMN - Structure en 2 colonnes
        // leftLeft : title et flux
        if (divs['title-container']) {
            leftLeft.appendChild(divs['title-container']);
        }
        if (divs['flux-diagram-wrapper']) {
            leftLeft.appendChild(divs['flux-diagram-wrapper']);
        }
        
        // leftTimeline : timeline
        if (divs['timeline-display']) {
            leftTimeline.appendChild(divs['timeline-display']);
        }
        
        // RIGHT COLUMN
        // plot-container-wrapper (seul dans right)
        if (divs['plot-container-wrapper']) {
            rightColumn.appendChild(divs['plot-container-wrapper']);
        }
        
        // Gestion du FPS (Hors flux, position absolue calculée)
        // Ne pas mettre dans rightColumn pour que le footer ne soit pas affecté
        const fpsDisplay = document.getElementById('fps-display');
        if (fpsDisplay) {
            // S'assurer qu'il est dans le body (pour position absolute par rapport au doc)
            if (fpsDisplay.parentElement !== document.body) {
                document.body.appendChild(fpsDisplay);
            }
            
            // Calculer la position Y sous la colonne de droite de manière déterministe
            // Logique imposée :
            // - Hauteur colonne fixe = 630px
            // - Padding Body = 20px
            // - Si desktop (côte à côte) : Y = 630 + 2*20 = 670px
            // - Si mobile (l'un sous l'autre) : Y = 2*630 + 3*20 = 1320px
            
            const PADDING_BODY = 20;
            const COL_HEIGHT = 630;
            let topPos;
            
            if (screenWidth < 1000) {
                // Mode Mobile : Colonnes empilées (Left puis Right)
                // Y = PaddingTop + LeftCol + Gap(Padding) + RightCol + PaddingBottom
                // Formule simplifiée demandée : 2*630 + 3*20 = 1320px
                topPos = (2 * COL_HEIGHT) + (3 * PADDING_BODY);
            } else {
                // Mode Desktop : Colonnes côte à côte
                // Y = PaddingTop + RightCol + PaddingBottom
                // Formule simplifiée demandée : 630 + 2*20 = 670px
                topPos = COL_HEIGHT + (2 * PADDING_BODY);
            }
            
            fpsDisplay.style.top = topPos + 'px';
            // fpsDisplay.style.left = '0px'; // Gauche toute - SUPPRIMÉ pour laisser le CSS gérer (left: 20px)
        }
        
        // synthese_EdS est intégrée dans l'organigramme par integrateEds.js, donc pas besoin de la positionner
    }
    
    // Réorganiser au chargement
    function initLayout() {
        // Vérifier que les éléments existent avant de réorganiser
        const leftColumn = document.getElementById('left-column');
        const rightColumn = document.getElementById('right-column');
        const leftLeft = document.getElementById('left-left');
        const leftTimeline = document.getElementById('left-timeline');
        const titleContainer = document.querySelector('.title-container');
        
        if (leftColumn && rightColumn && leftLeft && leftTimeline && titleContainer) {
            reorganizeLayout();
        } else {
            // Réessayer au prochain frame si les éléments ne sont pas encore là (synchrone via requestAnimationFrame)
            requestAnimationFrame(initLayout);
        }
    }
    
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLayout);
    } else {
        // DOM déjà chargé, essayer directement, sinon au prochain frame
        if (document.getElementById('left-column') && document.getElementById('right-column') && 
            document.getElementById('left-left') && document.getElementById('left-timeline') && 
            document.querySelector('.title-container')) {
            initLayout();
        } else {
            requestAnimationFrame(initLayout);
        }
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

