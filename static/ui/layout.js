// File: layout.js - Gestion automatique du layout en deux colonnes
// Desc: Range les divs dans left-column et right-column — une seule mise en page, quelle que soit la largeur
// Version 1.1.0
// - v1.1.0: plus de mode vertical sous 1000 px (colonnes empilées) ; sur téléphone, la page fait 1000 px, réduite.
// Date: [October 15, 2026]
// - v1.0.4: la frise dans sa colonne à droite (#timeline-column, après right-column), dans tous les onglets.
// - v1.0.3: plus de maxWidth 900px sur right-column (le graphe prend la place libre).
// logs :
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI

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
        const rightColumn = document.getElementById('right-column');

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
        
        // Récupérer la sous-colonne de left et la colonne de la frise (tout à gauche)
        const leftLeft = document.getElementById('left-left');
        const colonneFrise = document.getElementById('timeline-column');
        
        if (!leftLeft || !colonneFrise) {
            return;
        }
        
        // Vider les colonnes APRÈS avoir récupéré les références
        leftLeft.innerHTML = '';
        colonneFrise.innerHTML = '';
        rightColumn.innerHTML = '';
        
        // LEFT COLUMN - Structure en 2 colonnes
        // leftLeft : title et flux
        if (divs['title-container']) {
            leftLeft.appendChild(divs['title-container']);
        }
        if (divs['flux-diagram-wrapper']) {
            leftLeft.appendChild(divs['flux-diagram-wrapper']);
        }
        
        // colonne de la frise, tout à gauche
        if (divs['timeline-display']) {
            colonneFrise.appendChild(divs['timeline-display']);
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
            
            // Positionner en bas de l'écran : dépliée, la div FPS touche le bas
            fpsDisplay.style.top = '';
            fpsDisplay.style.bottom = '0';
        }
        
        // synthese_EdS est intégrée dans l'organigramme par integrateEds.js, donc pas besoin de la positionner
    }
    
    // Réorganiser au chargement
    function initLayout() {
        // Vérifier que les éléments existent avant de réorganiser
        const leftColumn = document.getElementById('left-column');
        const rightColumn = document.getElementById('right-column');
        const leftLeft = document.getElementById('left-left');
        const colonneFrise = document.getElementById('timeline-column');
        const titleContainer = document.querySelector('.title-container');
        
        if (leftColumn && rightColumn && leftLeft && colonneFrise && titleContainer) {
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
            document.getElementById('left-left') && document.getElementById('timeline-column') && 
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

