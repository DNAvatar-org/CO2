// File: CO2/static/compute/alphabet_render.js - Rendu de l'alphabet : lexique, pictos, logos
// Desc: En français, dans l'architecture, je suis la partie VISIBLE de l'alphabet : la grille du lexique,
//       les emojis remplacés par des PNG quand la police ne suffit pas, et les helpers de logo. Les
//       définitions (CHARS, CHARS_DESC) ne sont plus ici : elles vivent dans API_BILAN/data/alphabet.js,
//       que je lis par window. Je dois donc être chargé APRÈS lui.
// Version 1.0.0
// Date: [September 19, 2026]
// logs :
//   - v1.0.0: extraction depuis CO2/static/compute/alphabet.js v1.0.17. Code identique, à ceci près que
//     CHARS et CHARS_DESC sont lus sur window au lieu d'être des constantes du même fichier.
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

// Contrat : script classique, chargé APRÈS API_BILAN/data/alphabet.js (window.CHARS / window.CHARS_DESC).

(function () {
    'use strict';
    if (typeof window !== 'undefined' && window.__alphabetRenderLoaded) return;
    if (typeof window !== 'undefined') window.__alphabetRenderLoaded = true;

    // Définitions : source unique côté API. Crash-first si l'ordre de chargement est faux.
    if (!window.CHARS || !window.CHARS_DESC) {
        throw new Error('[alphabet_render.js] window.CHARS/CHARS_DESC absents — charger API_BILAN/data/alphabet.js avant.');
    }
    const CHARS = window.CHARS;
    const CHARS_DESC = window.CHARS_DESC;

// Les textures Three.js (fonds/*.png) : chemin déduit de la date (getPlanetTexturePathFromEpoch) ; liste préload : configOrganigramme.TEXTURES_THREEJS.
const charsImages = {
    '☀️': 'fonts/pics/sun.png',           // Soleil
    //'⚫': 'fonts/pics/corps_noir.png',    // Corps noir
    '🎇': 'fonts/pics/big_impact.png',    // Big impact
    '☄️': 'fonts/pics/ice_meteorite.png', // Météorite de glace
    //'🔥': 'fonts/pics/hadeen.png',           // Feu
    '🐄': 'fonts/pics/ch4.png',           // CH4 (picto texte ; spectre + organigramme)
};

// ============================================================================
// FONCTION : CRÉER L'ALPHABET (LEXIQUE)
// ============================================================================

function createAlphabetHtml() {
    if (typeof CHARS === 'undefined') console.error('[createAlphabet] CHARS non défini');
    // Colonne 1 : Unités
    const charsCol1 = [
        'CARDINAL', 'PROPORTION', 'METER', 'WEIGHT', 'PRESSURE', 'TEMP', 'POWER', 'FLUX_IN', 'FLUX_OUT', 'GRAVITY', 'ENERGY_FLUX', 'MOLAR_MASS_AIR', 'ALEMBIC', 'TRIPLE_POINT'
    ];
    
    // Colonne 2 : Éléments
    const charsCol2 = [
        'H2O', 'CH4', 'CO2', 'O2', 'N2', 'SULFATE', 'ICE', 'CLOUD', 'OCEAN', 'DESERT', 'FOREST', 'ATMOSPHERE', 'SUN_ORIGIN', 'SPECTRAL'
    ];
    
    // Colonne 3 : Calculs
    const charsCol3 = [
        'COMPUTE', 'ANIMATION', 'PHASE', 'DELTA', 'TOLERANCE', 'DIRECTION', 'T0', 'ALBEDO', 'GEOTHERMAL_FLUX', 'EDS', 'GEOMETRY_ORIGIN', 'FLUX_CN', 'MAX_VAPOR', 'CLOUD_FORMATION'
    ];
    
    // Colonne 4 : Événements
    const charsCol4 = [
        'DATE', 'TIC_TIME', 'EVENTS', 'CYCLE', 'TEXTURE', 'NIGHTMAP', 'OBLIQUITY', 'TRANSITION', 'BIG_IMPACT', 'METEORITE_COUNT', 'VOLCANO_VEIL', 'VOLCANO', 'FLUX_START', 'FLUX_END', 'PLANET_RADIUS', 'TROPOPAUSE', 'ALTITUDE', 'SATELLITE', 'INDEX_EPOCH'
    ];
    
    // Colonne 5 : Époques et autres logos
    const charsCol5 = [
        'EPOCH', 'INDEX_EPOCH', 'LOGO_EPOCH', 'CORPS_NOIR', 'HADEEN', 'ARCHEEN', 'PROTEROZOIC', 'SNOWBALL_ENTRY', 'SNOWBALL', 'SNOWBALL_EXIT', 'PALEOZOIC_MARINE', 'PALEOZOIC_LAND', 'PERMIAN_TRIASSIC', 'MESOZOIC', 'CENOZOIC', 'PETM_HOUSE', 'EOCENE_OLIGOCENE', 'EOT', 'QUATERNARY', 'HOLOCENE', 'TODAY', 'MODERN'
    ];
    
    // Descriptions personnalisées pour certains caractères
    const customDescriptions = {
        'TIC_TIME': 'TicTime',
        'T0': 'T0 (t° initiale)'
    };
    
    // Fonction helper pour créer une div avec caractère et description
    // Réf = emoji (toujours en premier, utilisé dans calculs/code). Image = affichage optionnel entre parenthèses.
    const createCharDiv = (charName) => {
        const char = CHARS[charName];
        const description = CHARS_DESC[char] || charName;
        
        if (!char || char === '') return '';
        
        const hasImage = charsImages[char] && (charsImages[char].endsWith('.png') || charsImages[char].endsWith('.svg') || charsImages[char].endsWith('.jpg'));
        const imgInParens = hasImage ? ' (' + getDisplayChar(char) + ')' : '';
        const logoClass = char === '⚗' ? 'logo logo-alembic' : 'logo';
        
        return `<div class="legend-item"><span class="${logoClass}">${char}</span><span class="description">${description}${imgInParens}</span></div>`;
    };
    
    // Filtrer les divs vides avant de les joindre
    const col1_filtered = charsCol1.map(createCharDiv).filter(div => div !== '').join('');
    const col2_filtered = charsCol2.map(createCharDiv).filter(div => div !== '').join('');
    const col3_filtered = charsCol3.map(createCharDiv).filter(div => div !== '').join('');
    const col4_filtered = charsCol4.map(createCharDiv).filter(div => div !== '').join('');
    // Époques sur 2 colonnes (22 lignes → 11 + 11) : plus de barre de scroll dans la popup
    const col5_items = charsCol5.map(createCharDiv).filter(div => div !== '');
    const col5_half = Math.ceil(col5_items.length / 2);
    const col5a_filtered = col5_items.slice(0, col5_half).join('');
    const col5b_filtered = col5_items.slice(col5_half).join('');
    
    return `
        <div class="legend-grid legend-grid--alphabet">
            <div class="legend-column">
                <h3 class="legend-title">Unités</h3>
                ${col1_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Éléments</h3>
                ${col2_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Calculs</h3>
                ${col3_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Événements</h3>
                ${col4_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Époques</h3>
                ${col5a_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">&nbsp;</h3>
                ${col5b_filtered}
            </div>
        </div>
    `;
}
// ============================================================================
// FONCTIONS HELPER
// ============================================================================

//Récupère un logo (emoji) depuis son nom
function getLogo(name) {
    return CHARS[name] || '';
}

//Combine plusieurs noms de logos en une seule clé emoji
function getLogoKey(...names) {
    return names.map(name => CHARS[name] || '').join('');
}

// Résout le chemin image (depuis static/compute/ -> ../../fonts/... ; depuis html/*.html -> ../fonts/...)
function resolveImagePath(path) {
    if (!path) return path;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path;
    if (typeof window.getImagePath === 'function') return window.getImagePath(path);
    const base = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
    const inCompute = base.includes('/static/compute/') || base.includes('static\\compute\\') || base.endsWith('alphabet.html');
    if (inCompute) {
        return '../..' + (path.startsWith('/') ? path : '/' + path);
    }
    // scie_compute.html, etc. : page sous CO2/html/ → fonts/ est CO2/fonts/ (un niveau au-dessus)
    const inHtmlFolder = /\/html\//.test(base) && /\.html$/i.test(base);
    if (inHtmlFolder) {
        return '../' + (path.startsWith('/') ? path.slice(1) : path);
    }
    return path;
}

// Mapping DATA key -> affichage (image path ou emoji). Alt = ref (CHARS).
function getDisplayChar(dataKey) {
    const imgPath = charsImages[dataKey];
    if (imgPath && (imgPath.endsWith('.png') || imgPath.endsWith('.svg') || imgPath.endsWith('.jpg'))) {
        const src = resolveImagePath(imgPath);
        const alt = CHARS_DESC[dataKey] || dataKey;
        return '<img src="' + src + '" alt="' + alt + '" style="height:1.4em;vertical-align:middle">';
    }
    return dataKey;
}

// Retourne l'URL src pour afficher un logo en image (events, timeline, etc.).
// Source unique : charsImages. Retourne null si pas d'image.
function getLogoImageSrc(emoji) {
    const path = charsImages[emoji];
    if (!path || !(path.endsWith('.png') || path.endsWith('.svg') || path.endsWith('.jpg'))) return null;
    return resolveImagePath(path);
}

// Retourne l'affichage pour un picto : image si dans charsImages, sinon le picto.
// Utilisé pour les boutons (frise, etc.) - transparent si on ajoute des images dans charsImages.
// Retourne { type: 'image', value: src } ou { type: 'text', value: picto }
function getDisplayForPicto(picto) {
    const src = getLogoImageSrc(picto);
    if (src) return { type: 'image', value: src };
    return { type: 'text', value: picto };
}


// ============================================================================
// EXPOSITION GLOBALE — rendu seulement
// ============================================================================

window.charsImages = charsImages;
window.createAlphabetHtml = createAlphabetHtml;
window.getLogo = getLogo;
window.getLogoKey = getLogoKey;
window.getDisplayChar = getDisplayChar;
window.getLogoImageSrc = getLogoImageSrc;
window.getDisplayForPicto = getDisplayForPicto;
// Init graphique : remplir [data-char] depuis CHARS (visu, etc.)
window.initCharsForDisplay = function () {
    if (!window.CHARS) return;
    document.querySelectorAll('[data-char]').forEach(function (el) {
        var key = el.getAttribute('data-char');
        if (key && window.CHARS[key]) el.textContent = window.CHARS[key];
    });
};

})();
