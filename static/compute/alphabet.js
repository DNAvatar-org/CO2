// File: static/compute/alphabet.js - Alphabet des caractères (logos)
// Desc: Définit les caractères (logos) de base et leurs descriptions
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [January 2025]

// ============================================================================
// DÉFINITION DES CARACTÈRES (CHARS)
// ============================================================================
// Source unique de référence pour tous les caractères (logos) utilisés dans l'application
const CHARS = {
    CO2: '🏭',      // CO2 : usine (émissions industrielles)
    CH4: '⛽',       // CH4 : pompe à essence (combustibles fossiles, pets de vache)
    H2O: '💧',      // H2O : goutte d'eau
    GEOTHERMAL_FLUX: '🌕', // Geothermal flux : lune (flux géothermique)
    FLUX_START: '▶', // Flux start : flèche droite (valeur de départ)
    FLUX_END: '◀', // Flux end : flèche gauche (valeur de fin)
    ENERGY_FLUX: '🧲', // Energy flux : sources chaudes (W/m²)
    O2: '🌫',       // O2 : brouillard/air
    N2: '💨',       // N2 : vent (azote/air)
    WEIGHT: '⚖️',   // Poids : balance (masse)
    DENSITY: '💨',  // Densité : vent
    ALTITUDE: '🧿', // Altitude : galaxie (Ligne de Kármán, frontière atmosphère/espace)
    ANIMATION: '🎬', // Animation : caméra
    TROPOPAUSE: '🛩', // Tropopause : avion
    GREENHOUSE_FORCING: '♻', // Greenhouse forcing : recyclage
    CLOUD_ALBEDO: '🌤', // Cloud albedo contribution : soleil avec nuage
    MAX_VAPOR: '🌧', // Max vapor fraction : pluie
    ALBEDO: '🪩',   // Albédo : miroir
    EDS: '📛',      // EDS : Forçage radiatif (Radiative Forcing)
    TEMP: '🌡️',     // TEMP : Température
    PHASE: '⚧',     // Phase : symbole transgenre (phase de convergence)
    T0: '🚩',        // T0 : drapeau (température initiale)
    DIRECTION: '☯', // Direction : yin-yang (direction du delta)
    BIG_IMPACT: '🎇', // Big impact : feu d'artifice (événement d'impact majeur)
    TIC_TIME: '💫', // TicTime : étoile (événement d'avancement temporel)
    SATELLITE: '🛰', // Satellite : satellite (événement)
    FLUX_CN: '🌑', // Flux sortant : lune noire (rayonnement corps noir sortant)
    TOLERANCE: '🔬', // Tolérance : précision pour le test d'arrêt
    DESERT: '🏖',   // Désert : plage (utilisé dans albedo breakdown)
    VOLCANO: '🌋',  // Volcan : magma (utilisé dans albedo breakdown)
    OCEAN: '🌊',    // Océan : vagues (utilisé dans albedo breakdown)
    FOREST: '🌳',   // Forêt : arbre (utilisé dans albedo breakdown)
    ICE: '🧊',      // Glace : glaçon (utilisé dans albedo breakdown)
    CLOUD: '⛅',     // Nuages : nuage avec soleil (utilisé dans albedo breakdown)
    CLOUD_FORMATION: '☁️', // Potentiel de condensation nuageuse
    COMPUTE: '🧮',  // Compute : sablier (pour les valeurs de convergence)
    GREENHOUSE_FORCING_ALT: '🌴',  // Greenhouse forcing alternatif : palmier
    BOOLEAN: '🔘',  // Boolean : bouton
    CARDINAL: '📿', // Cardinal : 🎓
    DELTA: '🔺',    // Delta : triangle
    METER: '📏',    // Mètre : règle
    PROPORTION: '🍰', // Proportion : 🍰 🧩
    POWER: '🔋',    // Puissance : batterie (Watts)
    SUN_ORIGIN: '☀️', // Soleil : soleil
    GEOMETRY_ORIGIN: '🎱', // Géometrie : boule de billard
    SPECTRAL: '🌈', // Spectre : arc-en-ciel
    ATMOSPHERE: '🫧', // Atmosphère : vent
    CONFIG: '📜',   // Config : parchemin
    METEORITE_COUNT: '☄️', // Nombre de météorites
    FLUX_IN: '🔽',  // Flux entrant (réception, +)
    FLUX_OUT: '🔼', // Flux sortant (émission, -)
    // Époques géologiques
    EPOCH: '📜',    // Époque : parchemin
    CORPS_NOIR: '⚫', // Corps noir
    HADEEN: '🔥',   // Hadéen : feu/lave
    ARCHEEN: '🦠',  // Archéen : microbe unicellulaire
    PROTEROZOIC: '🌿', // Protérozoïque : plantes primitives
    MESOZOIC: '🦕', // Mésozoïque : dinosaure sauropode
    CRETACEOUS: '🦴', // Crétacé : os/fossile
    CENOZOIC: '🦣', // Cénozoïque : mammouth
    TODAY: '🚂',    // 1800 : train (1800)
    MODERN: '📱',   // Moderne : smartphone (2025)
    EVENTS: '🕰',   // Événements : horloge
    TRANSITION: '⏩', // Transition : flèche rapide
    DATE: '📅',     // Date : calendrier
    PLANET_RADIUS: '📐', // Rayon de la planète : équerre
    GRAVITY: '🍎',  // Gravité : pomme (gravité)
    MOLAR_MASS_AIR: '🧪', // Masse molaire de l'air : flacon (chimie)
    PRESSURE: '🎈', // Pression : ballon (pression)
    INDEX_EPOCH: '👉', // Index de l'époque : pointeur
    LOGO_EPOCH: '🗿', // Logo/Nom de l'époque : statue
    TRIPLE_POINT: '┴', // Point triple : pont (P,T au point triple)
};

// Objet pour mapper les logos emoji vers les fichiers images
const charsImages = {
    '🎇': 'big_impact.png',  // Big impact utilise une image
    '⚫': 'fonts/pics/corps_noir.png',  // Corps noir
};

// ============================================================================
// DESCRIPTIONS DES CARACTÈRES (CHARS_DESC) - Utilise directement les emojis
// ============================================================================
const CHARS_DESC = {
    // Unités
    '📿': 'Cardinal (#)',
    '🍰': 'Proportion ([0,1])',
    '🔘': 'Calculé (Boolean)',
    '📏': 'Longueur (km)',
    '⚖️': 'Masse (kg)',
    '🎈': 'Pression (atm)',
    '🌡️': 't° (K)',
    '🔋': 'Puissance (W)',
    '🔽': 'Réception (+)',
    '🔼': 'Émission (-)',
    '🍎': 'Gravité (m/s²)',
    '🧲': 'Flux (W/m²)',
    '🧪': 'Masse molaire (kg/mol)',
    '┴': 'Point triple (🎈,🌡️)',
    '⚧': 'Phase (Init/Search/Dicho)',
    '☯': 'Direction Search (+/-)',
    // Éléments
    '💧': 'H₂O',
    '⛽': 'CH₄',
    '🏭': 'CO₂',
    '🌫': 'O₂',
    '🧊': 'Glace',
    '⛅': 'Nuages',
    '🌊': 'Océan',
    '🌋': 'Volcan',
    '🏖': 'Désert',
    '🌳': 'Forêt',
    '🫧': 'Atmosphère',
    '☀️': 'Soleil',
    '🎱': 'Géometrie',
    '🌈': 'Spectre',
    // Calculs
    '🧮': 'Calculs O(🧲🔬x🔬🌈x🔬🫧)',
    '🎬': 'Animation',
    '🔺': 'Delta (*)',
    '🔬': 'Tolérance (précision)',
    '🚩': 'T0 (t° initiale)',
    '🪩': 'Albédo',
    '🌕': 'Flux géothermique',
    '📛': 'EDS (Forçage radiatif)',
    '🌑': 'Corps noir',
    '☁️': 'Index formation nuageuse [0,1]',
    // Événements
    '💫': 'TicTime (+50 Ma)',
    '☄️': 'Météorite de glace',
    '🛰': 'Satellite',
    '🌧': 'Saturation H₂O',
    '🎇': 'Big impact',
    '▶': 'Début',
    '◀': 'Fin',
    '🧿': 'Ligne de Kármán',
    '🛩': 'Tropopause',
    // Autres
    '💨': 'N₂',
    // Époques géologiques
    '📜': 'Époque (Ma)',
    '👉': 'Index',
    '🗿': 'Logo',
    '⚫': 'Corps noir',
    '🔥': 'Hadéen',
    '🦠': 'Archéen',
    '🌿': 'Protérozoïque',
    '🦕': 'Mésozoïque',
    '🦴': 'Crétacé',
    '🦣': 'Cénozoïque',
    '🚂': '1800',
    '📱': '2025',
    '🕰': 'Événements',
    '⏩': 'Transition',
    '📅': 'Date (Ma)',
    '📐': 'Rayon planète',
    '🍎': 'Gravité (m/s²)',
    '┴': 'Point triple (🎈,🌡️)'
};

// ============================================================================
// FONCTION : CRÉER L'ALPHABET (LEXIQUE)
// ============================================================================

function createAlphabetHtml() {
    if (typeof CHARS === 'undefined') {
        console.error('[createAlphabet] CHARS non défini');
        return '';
    }
    
    // Colonne 1 : Unités
    const charsCol1 = [
        'CARDINAL', 'PROPORTION', 'BOOLEAN', 'METER', 'WEIGHT', 'PRESSURE', 'TEMP', 'POWER', 'FLUX_IN', 'FLUX_OUT', 'GRAVITY', 'ENERGY_FLUX', 'MOLAR_MASS_AIR', 'TRIPLE_POINT'
    ];
    
    // Colonne 2 : Éléments
    const charsCol2 = [
        'H2O', 'CH4', 'CO2', 'O2', 'N2', 'ICE', 'CLOUD', 'OCEAN', 'VOLCANO', 'DESERT', 'FOREST', 'ATMOSPHERE', 'SUN_ORIGIN', 'SPECTRAL'
    ];
    
    // Colonne 3 : Calculs
    const charsCol3 = [
        'COMPUTE', 'ANIMATION', 'PHASE', 'DELTA', 'TOLERANCE', 'DIRECTION', 'T0', 'ALBEDO', 'GEOTHERMAL_FLUX', 'EDS', 'GEOMETRY_ORIGIN', 'FLUX_CN', 'MAX_VAPOR', 'CLOUD_FORMATION'
    ];
    
    // Colonne 4 : Événements
    const charsCol4 = [
        'DATE', 'TIC_TIME', 'EVENTS', 'TRANSITION', 'BIG_IMPACT', 'METEORITE_COUNT', 'FLUX_START', 'FLUX_END', 'PLANET_RADIUS', 'TROPOPAUSE', 'ALTITUDE', 'SATELLITE', 'INDEX_EPOCH'
    ];
    
    // Colonne 5 : Époques et autres logos
    const charsCol5 = [
        'EPOCH', 'INDEX_EPOCH', 'LOGO_EPOCH', 'CORPS_NOIR', 'HADEEN', 'ARCHEEN', 'PROTEROZOIC', 'MESOZOIC', 'CRETACEOUS', 'CENOZOIC', 'TODAY', 'MODERN'
    ];
    
    // Descriptions personnalisées pour certains caractères
    const customDescriptions = {
        'TIC_TIME': 'TicTime (+50 Ma)',
        'T0': 'T0 (t° initiale)'
    };
    
    // Fonction helper pour créer une div avec caractère et description
    const createCharDiv = (charName) => {
        const char = CHARS[charName];
        // Utiliser la description depuis CHARS_DESC avec l'emoji comme clé
        const description = CHARS_DESC[char] || charName;
        
        // Si le caractère est vide, ne rien afficher plutôt que le nom
        if (!char || char === '') {
            return '';
        }
        
        // Format identique à syntaxe : utiliser les classes CSS pour les ellipsis
        return `<div class="legend-item"><span class="logo">${char}</span><span class="description">${description}</span></div>`;
    };
    
    // Filtrer les divs vides avant de les joindre
    const col1_filtered = charsCol1.map(createCharDiv).filter(div => div !== '').join('');
    const col2_filtered = charsCol2.map(createCharDiv).filter(div => div !== '').join('');
    const col3_filtered = charsCol3.map(createCharDiv).filter(div => div !== '').join('');
    const col4_filtered = charsCol4.map(createCharDiv).filter(div => div !== '').join('');
    const col5_filtered = charsCol5.map(createCharDiv).filter(div => div !== '').join('');
    
    return `
        <div class="legend-grid">
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
                ${col5_filtered}
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

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

window.CHARS = CHARS;
window.CHARS_DESC = CHARS_DESC;
window.charsImages = charsImages;
window.createAlphabetHtml = createAlphabetHtml;
window.getLogo = getLogo;
window.getLogoKey = getLogoKey;

