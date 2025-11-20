// File: patterns.js - Gestion des patterns de traits pour les courbes
// Desc: Définit l'ordre complet des patterns et les fonctions associées
// Version 1.1.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - v1.1.0: Changed pattern order to dash, dashdot, longdash, longdashdot; simplified stroke-width cycling

// Ordre complet des patterns : dot (0, réservé), dash (1), dashdot (2), longdash (3), longdashdot (4), solid (5, réservé)
window.DASH_PATTERNS = ['dot', 'dash', 'dashdot', 'longdash', 'longdashdot', 'solid'];

// Index réservés
window.DASH_PATTERN_DOT_INDEX = 0;    // Réservé pour la courbe courante
window.DASH_PATTERN_SOLID_INDEX = 5;  // Réservé

// Index utilisables pour les courbes de référence (1-4)
window.DASH_PATTERN_REF_START = 1;
window.DASH_PATTERN_REF_COUNT = 4;

/**
 * Obtient le pattern pour une courbe de référence selon son index
 * @param {number} index - Index de la température dans PLANCK_TEMPERATURES
 * @returns {string} Le nom du pattern (dash, longdash, dashdot, ou longdashdot)
 */
window.getReferencePattern = function(index) {
    // Utiliser des valeurs par défaut si les constantes ne sont pas définies
    const refStart = (typeof window.DASH_PATTERN_REF_START !== 'undefined') ? window.DASH_PATTERN_REF_START : 1;
    const refCount = (typeof window.DASH_PATTERN_REF_COUNT !== 'undefined') ? window.DASH_PATTERN_REF_COUNT : 4;
    const patterns = (typeof window.DASH_PATTERNS !== 'undefined' && Array.isArray(window.DASH_PATTERNS)) 
        ? window.DASH_PATTERNS 
        : ['dot', 'dash', 'longdash', 'dashdot', 'longdashdot', 'solid'];
    
    const patternIndex = refStart + (index % refCount);
    return patterns[patternIndex];
};

/**
 * Obtient l'épaisseur de ligne pour une courbe selon son index et le nombre total de courbes
 * Cycle en augmentant le stroke-width à chaque cycle (4 courbes par cycle)
 * @param {number} index - Index de la température dans PLANCK_TEMPERATURES
 * @param {number} totalCount - Nombre total de courbes
 * @returns {number} L'épaisseur de la ligne
 */
window.getLineWidth = function(index, totalCount) {
    // Utiliser DASH_PATTERN_REF_COUNT si disponible, sinon 4 par défaut
    const refCount = (typeof window.DASH_PATTERN_REF_COUNT !== 'undefined') ? window.DASH_PATTERN_REF_COUNT : 4;
    
    // Calculer dans quel cycle on se trouve (chaque cycle = 4 courbes avec les 4 patterns)
    const cycle = Math.floor(index / refCount);
    
    // Augmenter l'épaisseur à chaque cycle : 0.5, 1.0, 1.5, 2.0, 2.5, etc.
    return 0.5 + (cycle * 0.5);
};

/**
 * Obtient le stroke-dasharray selon le motif
 * @param {string} pattern - Nom du pattern
 * @returns {string} La valeur stroke-dasharray pour SVG
 */
window.getDashArray = function(pattern) {
    switch(pattern) {
        case 'dash':
            return '6,4';
        case 'dot':
            return '1,3';
        case 'dashdot':
            return '6,2,1,2';
        case 'longdash':
            return '10,4';
        case 'longdashdot':
            return '10,2,1,2';
        case 'solid':
        default:
            return 'none';
    }
};

/**
 * Crée un SVG représentant le motif de trait pour la légende
 * @param {string} pattern - Nom du pattern
 * @param {number} index - Index de la courbe (pour calculer le stroke-width)
 * @param {number} totalCount - Nombre total de courbes
 * @returns {string} HTML du SVG
 */
window.createDashPatternSVG = function(pattern, index = 0, totalCount = 1) {
    const width = 50;
    const height = 4;
    const dashArray = window.getDashArray(pattern);
    
    // Calculer le stroke-width en fonction de l'index (cycle)
    // Multiplier par un facteur pour que ce soit visible dans la légende (échelle plus grande)
    const baseWidth = typeof window.getLineWidth === 'function' 
        ? window.getLineWidth(index, totalCount) 
        : 0.5;
    
    // Facteur multiplicateur pour la légende (rendre les différences plus visibles)
    const strokeWidth = baseWidth * 3; // 0.5 → 1.5px, 1.0 → 3.0px, 1.5 → 4.5px, etc.
    
    // Utiliser stroke-dasharray même pour solid (none) pour s'assurer que la ligne est visible
    const dashAttr = dashArray !== 'none' ? `stroke-dasharray="${dashArray}"` : '';
    
    return `<svg width="${width}" height="${height}" style="vertical-align: middle; display: inline-block; overflow: visible;">
        <line x1="2" y1="${height/2}" x2="${width-2}" y2="${height/2}" stroke="white" stroke-width="${strokeWidth}" ${dashAttr}/>
    </svg>`;
};

