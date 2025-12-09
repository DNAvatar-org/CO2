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
    N2: '⚗',       // N2 : azote (tornade/air)⚗💨🌪
    WEIGHT: '🐳',   // Poids : baleine (masse)
    DENSITY: '💨',  // Densité : vent
    ALTITUDE: '🧿', // Altitude : galaxie (Ligne de Kármán, frontière atmosphère/espace)
    ANIMATION: '🎬', // Animation : caméra
    TROPOPAUSE: '🛩', // Tropopause : avion
    GREENHOUSE_FORCING: '♻', // Greenhouse forcing : recyclage
    CLOUD_ALBEDO: '🌤', // Cloud albedo contribution : soleil avec nuage
    MAX_VAPOR: '🌧', // Max vapor fraction : pluie
    ALBEDO: '🪞',   // Albédo : miroir
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
    COMPUTE: '⏳',  // Compute : sablier (pour les valeurs de convergence)
    GREENHOUSE_FORCING_ALT: '🌴',  // Greenhouse forcing alternatif : palmier
    BOOLEAN: '🔘',  // Boolean : bouton
    CARDINAL: '📿', // Cardinal : 🎓
    DELTA: '🔺',    // Delta : triangle
    METER: '📏',    // Mètre : règle
    PROPORTION: '🍰', // Proportion : 🥒 🧩
    POWER: '🔋',    // Puissance : batterie (Watts)
    SUN_ORIGIN: '☀️', // Soleil : soleil
    GEOMETRY_ORIGIN: '🎱', // Géometrie : boule de billard
    SPECTRAL: '🌈', // Spectre : arc-en-ciel
    ATMOSPHERE: '🌬', // Atmosphère : vent
    CONFIG: '📜',   // Config : parchemin
    OLD_T0: '🏮',   // Old T0 : lanterne
    METEORITE_COUNT: '☄️', // Nombre de météorites
    FLUX_IN: '🔽',  // Flux entrant (réception, +)
    FLUX_OUT: '🔼', // Flux sortant (émission, -)
};

// Objet pour mapper les logos emoji vers les fichiers images
const charsImages = {
    '🎇': 'big_impact.png',  // Big impact utilise une image
};

// ============================================================================
// DESCRIPTIONS DES CARACTÈRES (CHARS_DESC)
// ============================================================================
const CHARS_DESC = {
    // Unités
    'BOOLEAN': 'is Computed (Boolean)',
    'CARDINAL': 'Cardinal (#)',
    'DELTA': 'Delta (*)',
    'TEMP': 'Température (K)',
    'WEIGHT': 'Masse (kg)',
    'METER': 'Longueur (km)',
    'PROPORTION': 'Proportion (%)',
    'ENERGY_FLUX': 'Flux (W/m²)',
    'POWER': 'Puissance (W)',
    'FLUX_IN': 'Réception (+)',
    'FLUX_OUT': 'Émission (-)',
    // Éléments
    'H2O': 'H2O',
    'CH4': 'CH4',
    'CO2': 'CO2',
    'O2': 'O2',
    'ICE': 'Glace',
    'CLOUD': 'Nuages',
    'OCEAN': 'Océan',
    'VOLCANO': 'Volcan',
    'DESERT': 'Désert',
    'FOREST': 'Forêt',
    'ATMOSPHERE': 'Atmosphère',
    'SUN_ORIGIN': 'Soleil',
    'GEOMETRY_ORIGIN': 'Géometrie',
    'SPECTRAL': 'Spectre',
    // Calculs
    'COMPUTE': 'Compute',
    'ANIMATION': 'Animation',
    'PHASE': 'Phase (Search/Dicho)',
    'TOLERANCE': 'Tolérance (précision)',
    'DIRECTION': 'Direction (+/-)',
    'OLD_T0': 'old_T0 (backup T°)',
    'T0': 'T0 (T° initiale)',
    'ALBEDO': 'Albédo',
    'GEOTHERMAL_FLUX': 'Flux géothermique',
    'EDS': 'EDS (Forçage radiatif)',
    'FLUX_CN': 'Corps noir',
    // Événements
    'CONFIG': 'Config',
    'TIC_TIME': 'TicTime',
    'METEORITE_COUNT': 'Météorite de glace',
    'SATELLITE': 'Satellite',
    'MAX_VAPOR': 'Max vapor fraction',
    'BIG_IMPACT': 'Big impact',
    'FLUX_START': 'Flux start',
    'FLUX_END': 'Flux end',
    'ALTITUDE': 'Ligne de Kármán',
    'TROPOPAUSE': 'Tropopause'
};

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

// FONCTION HELPER : getChar(name)
// Récupère un caractère depuis CHARS
function getChar(name) {
    return CHARS[name] || '';
}

// FONCTION HELPER : getCharKey(...)
// Construit une clé composite à partir de plusieurs caractères
// Exemple: getCharKey('BOOLEAN', 'ANIMATION') => '🔘🎬'
// Exemple: getCharKey('BOOLEAN', 'H2O', 'EDS') => '🔘💧📛'
function getCharKey(...names) {
    return names.map(name => CHARS[name] || '').join('');
}

// ============================================================================
// FONCTION : CRÉER L'ALPHABET (LEXIQUE)
// ============================================================================

function createAlphabet() {
    if (typeof CHARS === 'undefined') {
        console.error('[createAlphabet] CHARS non défini');
        return '';
    }
    
    // Colonne 1 : Unités
    const charsCol1 = [
        'BOOLEAN', 'CARDINAL', 'DELTA', 'TEMP', 'WEIGHT', 'METER', 'PROPORTION', 'ENERGY_FLUX', 'POWER', 'FLUX_IN', 'FLUX_OUT'
    ];
    
    // Colonne 2 : Éléments
    const charsCol2 = [
        'H2O', 'CH4', 'CO2', 'O2', 'ICE', 'CLOUD', 'OCEAN', 'VOLCANO', 'DESERT', 'FOREST', 'ATMOSPHERE', 'SUN_ORIGIN', 'SPECTRAL'
    ];
    
    // Colonne 3 : Calculs
    const charsCol3 = [
        'COMPUTE', 'ANIMATION', 'PHASE', 'TOLERANCE', 'DIRECTION', 'OLD_T0', 'T0', 'ALBEDO', 'GEOTHERMAL_FLUX', 'EDS', 'GEOMETRY_ORIGIN', 'FLUX_CN'
    ];
    
    // Colonne 4 : Événements
    const charsCol4 = [
        'CONFIG', 'TIC_TIME', 'BIG_IMPACT', 'METEORITE_COUNT', 'MAX_VAPOR', 'FLUX_START', 'FLUX_END', 'SATELLITE', 'ALTITUDE', 'TROPOPAUSE'
    ];
    
    // Descriptions personnalisées pour certains caractères
    const customDescriptions = {
        'TIC_TIME': 'TicTime (+50 Ma)',
        'OLD_T0': 'old_T0 (backup t°)',
        'T0': 'T0 (t° initiale)'
    };
    
    // Fonction helper pour créer une div avec caractère et description
    const createCharDiv = (charName) => {
        const char = getChar(charName);
        // Utiliser la description personnalisée si disponible, sinon CHARS_DESC, sinon le nom
        const description = customDescriptions[charName] || CHARS_DESC[charName] || charName;
        
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
        </div>
    `;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

if (typeof window !== 'undefined') {
    window.CHARS = CHARS;
    window.CHARS_DESC = CHARS_DESC;
    window.charsImages = charsImages;
    window.getChar = getChar;
    window.getCharKey = getCharKey;
    window.createAlphabet = createAlphabet;
    
    // Compatibilité : exposer aussi comme LOGOS pour les anciens fichiers
    window.LOGOS = CHARS;
    window.getLogo = getChar;
    window.getLogoKey = getCharKey;
}

