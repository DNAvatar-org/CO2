// File: static/compute/grammar.js - Grammaire des logos et construction des clés
// Desc: Centralise les règles de construction des clés d'objets JSON avec logos
// Version 1.1.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [January 2025]
// Logs:
//   - Initial version: extraction depuis compute.js et configOrganigramme.js
//   - v1.1.0: Intégration de syntaxe.js (catégories de combinaisons de logos)

// ============================================================================
// DÉFINITION DES LOGOS
// ============================================================================
// Source unique de référence pour tous les logos utilisés dans l'application
// Utilisé à la fois dans le flux (organigramme) et dans le graphique (plot)
const LOGOS = {
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
    ALTITUDE: '🚀', // Altitude : fusée
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
// Utilisé quand un logo emoji doit être remplacé par une image
const logosImages = {
    '🎇': 'big_impact.png',  // Big impact utilise une image
    // Ajouter d'autres mappings si nécessaire
    // Exemple: '🌋': 'volcano.png' si on veut remplacer l'emoji par une image
};

// Exposer LOGOS et logosImages immédiatement pour que configOrganigramme.js puisse les utiliser
if (typeof window !== 'undefined') {
    window.LOGOS = LOGOS;
    window.logosImages = logosImages;
}

// ============================================================================
// FONCTIONS HELPER POUR CONSTRUCTION DES CLÉS
// ============================================================================

// FONCTION HELPER : getLogo(name)
// Récupère un logo depuis LOGOS (défini dans ce fichier)
function getLogo(name) {
    return LOGOS[name] || '';
}

// FONCTION HELPER : getLogoKey(...)
// Construit une clé composite à partir de plusieurs logos
// Exemple: getLogoKey('BOOLEAN', 'ANIMATION') => '🔘🎬'
// Exemple: getLogoKey('BOOLEAN', 'H2O', 'EDS') => '🔘💧📛'
function getLogoKey(...names) {
    return names.map(name => LOGOS[name] || '').join('');
}

// ============================================================================
// CONSTANTES DE CLÉS PRÉDÉFINIES (pour éviter les répétitions)
// ============================================================================

// Clés pour enabledStates (valeurs directes, plus rapide)
const ENABLED_STATES_KEYS = {
    H2O_EDS: getLogoKey('BOOLEAN', 'H2O', 'EDS'),
    CH4_EDS: getLogoKey('BOOLEAN', 'CH4', 'EDS'),
    CO2_EDS: getLogoKey('BOOLEAN', 'CO2', 'EDS'),
    ALBEDO: getLogoKey('BOOLEAN', 'ALBEDO'),
    ANIMATION: getLogoKey('BOOLEAN', 'ANIMATION')
};

// Clés pour dateConfig (valeurs directes, plus rapide)
// ⚠️ CONFIG (📜) uniquement pour les événements (METEORITE_COUNT, TIC_TIME)
const DATE_CONFIG_KEYS = {
    OLD_T0: getLogoKey('TEMP', 'OLD_T0'),
    T0_CONFIG: getLogoKey('TEMP', 'COMPUTE'),
    ANIMATION: getLogoKey('BOOLEAN', 'ANIMATION'),
    METEORITE_COUNT: getLogoKey('CARDINAL', 'METEORITE_COUNT'),
    DELTA_TEMP_METEORITE: getLogoKey('DELTA', 'TEMP', 'METEORITE_COUNT'),
    DELTA_WATER_METEORITE: getLogoKey('DELTA', 'WEIGHT', 'H2O', 'METEORITE_COUNT'),
    TIC_TIME_COUNT: getLogoKey('CARDINAL', 'TIC_TIME'),
    DELTA_TEMP_TIC_TIME: getLogoKey('DELTA', 'TEMP', 'TIC_TIME'),
    DELTA_FLUX_GEOTHERMAL_TIC_TIME: getLogoKey('DELTA', 'ENERGY_FLUX', 'GEOTHERMAL_FLUX', 'TIC_TIME')
};

// Clés pour masses (valeurs directes, plus rapide)
const MASSES_KEYS = {
    CO2: getLogoKey('WEIGHT', 'CO2'),
    CH4: getLogoKey('WEIGHT', 'CH4'),
    H2O: getLogoKey('WEIGHT', 'H2O'),
    O2: getLogoKey('WEIGHT', 'O2'),
    TOTAL: getLogoKey('WEIGHT', 'CARDINAL')
};

// ============================================================================
// DESCRIPTIONS DES LOGOS (pour attributs title/alt)
// ============================================================================

// Descriptions des logos simples (selon structure fournie)
const LOGO_DESCRIPTIONS = {
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
    'MAX_VAPOR': 'Max vapor fraction',
    'BIG_IMPACT': 'Big impact',
    'FLUX_START': 'Flux start',
    'FLUX_END': 'Flux end',
    'ALTITUDE': 'Altitude',
    'TROPOPAUSE': 'Tropopause'
};

// Descriptions des combos (logos composés) - gardées sous le coude pour utilisation future
// Format: clé_combo => description (ex: 'WEIGHT_CO2' => 'Masse CO2 (kg)')
const LOGO_COMBOS_DESCRIPTIONS = {
    // enabledStates
    'BOOLEAN_ANIMATION': 'Animation',
    'BOOLEAN_H2O_EDS': 'H2O EDS activé',
    'BOOLEAN_CH4_EDS': 'CH4 EDS activé',
    'BOOLEAN_CO2_EDS': 'CO2 EDS activé',
    'BOOLEAN_ALBEDO': 'Albedo activé',
    // dateConfig
    'TEMP_OLD_T0': 'old_T0 (température précédente)',
    'TEMP_COMPUTE_CONFIG': 'T0 attendu (température config)',
    'CARDINAL_METEORITE_COUNT_CONFIG': 'Nombre de météorites',
    'DELTA_TEMP_METEORITE_COUNT_CONFIG': 'Delta température / météorite',
    'DELTA_WEIGHT_H2O_METEORITE_COUNT_CONFIG': 'Masse d\'eau ajoutée / météorite',
    'CARDINAL_TIC_TIME_CONFIG': 'Nombre de ticTime',
    'DELTA_TEMP_TIC_TIME_CONFIG': 'Delta température / ticTime',
    'DELTA_ENERGY_FLUX_GEOTHERMAL_FLUX_TIC_TIME_CONFIG': 'Delta Flux Geom /ticTime',
    'COMPUTE_TEMP_T0': 'T0 calculé (température calculée)',
    'COMPUTE_PHASE': 'Phase (None/Search/Dicho)',
    'COMPUTE_DIRECTION': 'Direction',
    // masses
    'WEIGHT_CO2': 'Masse CO2 (kg)',
    'WEIGHT_CH4': 'Masse CH4 (kg)',
    'WEIGHT_H2O': 'Masse H2O (kg)',
    'WEIGHT_O2': 'Masse O2 (kg)',
    'WEIGHT_CARDINAL': 'Masse totale atmosphère (kg)',
    // atm
    'METER_ATMOSPHERE_ALTITUDE': 'Altitude max (km) - épaisseur de l\'atmosphère',
    'METER_ATMOSPHERE_TROPOPAUSE': 'Tropopause (km) - limite troposphère/stratosphère',
    'PROPORTION_ATMOSPHERE_CO2': 'CO2 (%)',
    'PROPORTION_ATMOSPHERE_H2O': 'H2O (%)',
    'PROPORTION_ATMOSPHERE_CH4': 'CH4 (%)',
    'PROPORTION_ATMOSPHERE_O2': 'O2 (%)',
    // h2o
    'PROPORTION_H2O_ICE': 'Glace (%)',
    'PROPORTION_H2O_CLOUD': 'Nuages (%)',
    'PROPORTION_H2O_OCEAN': 'Océan (%)',
    'ENERGY_FLUX_H2O_EDS': 'Greenhouse forcing H2O (dans step5_spectral)',
    'COMPUTE_MAX_VAPOR': 'Max vapor fraction',
    // albedo
    'PROPORTION_ALBEDO_CARDINAL': '% Albedo total',
    'PROPORTION_ALBEDO_VOLCANO': 'Volcan',
    'PROPORTION_ALBEDO_DESERT': 'Désert',
    'PROPORTION_ALBEDO_FOREST': 'Forêt',
    'PROPORTION_ALBEDO_OCEAN': 'Océan',
    'PROPORTION_ALBEDO_ICE': 'Glace',
    'PROPORTION_ALBEDO_CLOUD': 'Cloud albedo (dans window.albedo)',
    // flux
    'ENERGY_FLUX_ANIMATION': 'Flux solaire (W/m²)',
    'ENERGY_FLUX_ANIMATION_FLUX_IN': 'Flux solaire absorbé (W/m²)',
    'ENERGY_FLUX_GEOTHERMAL_FLUX_FLUX_IN': 'Flux géothermique (W/m²)',
    'ENERGY_FLUX_FLUX_OUT_LOGO': 'Flux sortant (corps noir σT⁴, W/m²)',
    'DELTA_ENERGY_FLUX': 'Delta flux (W/m²)',
    'DELTA_ENERGY_FLUX_GEOTHERMAL_FLUX': 'Delta flux géothermique (W/m²)'
};

// ============================================================================
// FONCTION : CRÉER LE LEXIQUE
// ============================================================================

// Fonction pour créer le lexique dynamiquement (4 colonnes avec titres)
function createLexique() {
    // Utiliser LOGOS défini dans ce fichier (pas besoin de window.LOGOS)
    if (typeof LOGOS === 'undefined') {
        console.error('[createLexique] LOGOS non défini');
        return '';
    }
    
    // Colonne 1 : Unités
    const logosCol1 = [
        'BOOLEAN', 'CARDINAL', 'DELTA', 'TEMP', 'WEIGHT', 'METER', 'PROPORTION', 'ENERGY_FLUX', 'POWER', 'FLUX_IN', 'FLUX_OUT'
    ];
    
    // Colonne 2 : Éléments
    const logosCol2 = [
        'H2O', 'CH4', 'CO2', 'O2', 'ICE', 'CLOUD', 'OCEAN', 'VOLCANO', 'DESERT', 'FOREST', 'ATMOSPHERE', 'SUN_ORIGIN', 'SPECTRAL'
    ];
    
    // Colonne 3 : Calculs
    const logosCol3 = [
        'COMPUTE', 'ANIMATION', 'PHASE', 'TOLERANCE', 'DIRECTION', 'OLD_T0', 'T0', 'ALBEDO', 'GEOTHERMAL_FLUX', 'EDS', 'GEOMETRY_ORIGIN', 'FLUX_CN'
    ];
    
    // Colonne 4 : Événements
    const logosCol4 = [
        'CONFIG', 'TIC_TIME', 'METEORITE_COUNT', 'MAX_VAPOR', 'BIG_IMPACT', 'FLUX_START', 'FLUX_END', 'ALTITUDE', 'TROPOPAUSE'
    ];
    
    // Descriptions personnalisées pour certains logos
    const customDescriptions = {
        'TIC_TIME': 'TicTime (+50 Ma)',
        'OLD_T0': 'old_T0 (backup t°)',
        'T0': 'T0 (t° initiale)'
    };
    
    // Fonction helper pour créer une div avec logo et description
    const createLogoDiv = (logoName) => {
        const logo = getLogo(logoName);
        // Utiliser la description personnalisée si disponible, sinon LOGO_DESCRIPTIONS, sinon le nom
        const description = customDescriptions[logoName] || LOGO_DESCRIPTIONS[logoName] || logoName;
        
        // Si le logo est vide, ne rien afficher plutôt que le nom
        if (!logo || logo === '') {
            return '';
        }
        
        // Format identique à syntaxe : utiliser les classes CSS pour les ellipsis
        return `<div class="legend-item"><span class="logo">${logo}</span><span class="description">${description}</span></div>`;
    };
    
    // Filtrer les divs vides avant de les joindre
    const col1_filtered = logosCol1.map(createLogoDiv).filter(div => div !== '').join('');
    const col2_filtered = logosCol2.map(createLogoDiv).filter(div => div !== '').join('');
    const col3_filtered = logosCol3.map(createLogoDiv).filter(div => div !== '').join('');
    const col4_filtered = logosCol4.map(createLogoDiv).filter(div => div !== '').join('');
    
    console.log('[createLexique] Colonnes générées:', {
        col1: col1_filtered.split('</div>').length - 1,
        col2: col2_filtered.split('</div>').length - 1,
        col3: col3_filtered.split('</div>').length - 1,
        col4: col4_filtered.split('</div>').length - 1
    });
    
    return `
        <div class="legend-grid">
            <div class="legend-column">
                <h3 class="legend-title lexique-title">Unités</h3>
                ${col1_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title lexique-title">Éléments</h3>
                ${col2_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title lexique-title">Calculs</h3>
                ${col3_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title lexique-title">Événements</h3>
                ${col4_filtered}
            </div>
        </div>
    `;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

if (typeof window !== 'undefined') {
    window.getLogo = getLogo;
    window.getLogoKey = getLogoKey;
    window.ENABLED_STATES_KEYS = ENABLED_STATES_KEYS;
    window.DATE_CONFIG_KEYS = DATE_CONFIG_KEYS;
    window.MASSES_KEYS = MASSES_KEYS;
    window.LOGO_DESCRIPTIONS = LOGO_DESCRIPTIONS;
    window.LOGO_COMBOS_DESCRIPTIONS = LOGO_COMBOS_DESCRIPTIONS;
    window.createLexique = createLexique;
}

// ============================================================================
// SYNTAXE : CATÉGORIES DE COMBINAISONS DE LOGOS
// ============================================================================
// Intégré depuis syntaxe.js
// Les clés sont calculées directement (plus rapide que des fonctions)
// ⚠️ IMPORTANT : Ces objets utilisent window.getLogoKey défini ci-dessus

// États activés (enabledStates)
const ENABLED_STATES = {
    'H2O_EDS': {
        key: getLogoKey('BOOLEAN', 'H2O', 'EDS'),
        desc: 'H2O EDS on/off'
    },
    'CH4_EDS': {
        key: getLogoKey('BOOLEAN', 'CH4', 'EDS'),
        desc: 'CH4 EDS on/off'
    },
    'CO2_EDS': {
        key: getLogoKey('BOOLEAN', 'CO2', 'EDS'),
        desc: 'CO2 EDS on/off'
    },
    'ALBEDO': {
        key: getLogoKey('BOOLEAN', 'ALBEDO'),
        desc: 'Albedo on/off'
    },
    'ANIMATION': {
        key: getLogoKey('BOOLEAN', 'ANIMATION'),
        desc: 'Animation on/off'
    }
};

// Configuration de date (dateConfig)
// ⚠️ CONFIG (📜) 
const DATE_CONFIG = {
    'OLD_T0': {
        key: getLogoKey('TEMP', 'OLD_T0'),
        desc: 'old_T0 (backup t°)'
    },
    'T0_CONFIG': {
        key: getLogoKey('TEMP', 'COMPUTE'),
        desc: 'T0 attendu (t° config)'
    },
    'METEORITE_COUNT': {
        key: getLogoKey('CARDINAL', 'METEORITE_COUNT'),
        desc: 'Nombre de météore'
    },
    'DELTA_TEMP_METEORITE': {
        key: getLogoKey('DELTA', 'TEMP', 'METEORITE_COUNT'),
        desc: 'Delta t° / météore'
    },
    'DELTA_WATER_METEORITE': {
        key: getLogoKey('DELTA', 'WEIGHT', 'H2O', 'METEORITE_COUNT'),
        desc: 'Masse d\'eau / météore'
    },
    'TIC_TIME_COUNT': {
        key: getLogoKey('CARDINAL', 'TIC_TIME'),
        desc: 'Nombre de ticTime'
    },
    'DELTA_TEMP_TIC_TIME': {
        key: getLogoKey('DELTA', 'TEMP', 'TIC_TIME'),
        desc: 'Delta t° / ticTime'
    },
    'DELTA_FLUX_GEOTHERMAL_TIC_TIME': {
        key: getLogoKey('DELTA', 'ENERGY_FLUX', 'GEOTHERMAL_FLUX', 'TIC_TIME'),
        desc: 'Delta Flux Geom /ticTime'
    }
};

// Masses (masses)
const MASSES = {
    'CO2': {
        key: getLogoKey('WEIGHT', 'CO2'),
        desc: 'Masse CO2'
    },
    'CH4': {
        key: getLogoKey('WEIGHT', 'CH4'),
        desc: 'Masse CH4'
    },
    'H2O': {
        key: getLogoKey('WEIGHT', 'H2O'),
        desc: 'Masse H2O'
    },
    'O2': {
        key: getLogoKey('WEIGHT', 'O2'),
        desc: 'Masse O2'
    },
    'TOTAL': {
        key: getLogoKey('WEIGHT', 'CARDINAL'),
        desc: 'Masse Atm.'
    }
};

// Composition atmosphérique (atm)
const ATM = {
    'ALTITUDE': {
        key: getLogoKey('METER', 'ATMOSPHERE', 'ALTITUDE'),
        desc: 'Altitude max'
    },
    'TROPOPAUSE': {
        key: getLogoKey('METER', 'ATMOSPHERE', 'TROPOPAUSE'),
        desc: 'Tropopause'
    },
    'CO2': {
        key: getLogoKey('PROPORTION', 'ATMOSPHERE', 'CO2'),
        desc: 'CO2'
    },
    'H2O': {
        key: getLogoKey('PROPORTION', 'ATMOSPHERE', 'H2O'),
        desc: 'H2O'
    },
    'CH4': {
        key: getLogoKey('PROPORTION', 'ATMOSPHERE', 'CH4'),
        desc: 'CH4'
    },
    'O2': {
        key: getLogoKey('PROPORTION', 'ATMOSPHERE', 'O2'),
        desc: 'O2'
    },
    'N2': {
        key: getLogoKey('PROPORTION', 'ATMOSPHERE', 'N2'),
        desc: 'N2'
    }
};

// Cycle de l'eau (h2o)
const H2O = {
    'ICE': {
        key: getLogoKey('PROPORTION', 'H2O', 'ICE'),
        desc: 'Glace'
    },
    'CLOUD': {
        key: getLogoKey('PROPORTION', 'H2O', 'CLOUD'),
        desc: 'Nuages'
    },
    'OCEAN': {
        key: getLogoKey('PROPORTION', 'H2O', 'OCEAN'),
        desc: 'Océan'
    },
    'MAX_VAPOR': {
        key: getLogoKey('PROPORTION', 'COMPUTE', 'MAX_VAPOR'),
        desc: 'Max vapor fraction'
    }
};

// Albédo (albedo)
const ALBEDO = {
    'TOTAL': {
        key: getLogoKey('PROPORTION', 'ALBEDO', 'CARDINAL'),
        desc: 'Albedo total'
    },
    'VOLCANO': {
        key: getLogoKey('PROPORTION', 'ALBEDO', 'VOLCANO'),
        desc: 'Volcan'
    },
    'DESERT': {
        key: getLogoKey('PROPORTION', 'ALBEDO', 'DESERT'),
        desc: 'Désert'
    },
    'FOREST': {
        key: getLogoKey('PROPORTION', 'ALBEDO', 'FOREST'),
        desc: 'Forêt'
    },
    'OCEAN': {
        key: getLogoKey('PROPORTION', 'ALBEDO', 'OCEAN'),
        desc: 'Océan'
    },
    'ICE': {
        key: getLogoKey('PROPORTION', 'ALBEDO', 'ICE'),
        desc: 'Glace'
    },
    'CLOUD': {
        key: getLogoKey('PROPORTION', 'ALBEDO', 'CLOUD'),
        desc: 'Nuages'
    }
};

// Flux radiatif (flux)
const FLUX = {
    'SOLAR_ABSORBED': {
        key: getLogoKey('ENERGY_FLUX', 'SUN_ORIGIN', 'FLUX_IN'),
        desc: 'Flux solaire absorbé'
    },
    'GEOTHERMAL_IN': {
        key: getLogoKey('ENERGY_FLUX', 'GEOTHERMAL_FLUX', 'FLUX_IN'),
        desc: 'Flux géothermique'
    },
    'OUT': {
        key: getLogoKey('ENERGY_FLUX', 'FLUX_CN', 'FLUX_OUT'),
        desc: 'Flux sortant (σT⁴)'
    },
    'DELTA': {
        key: getLogoKey('DELTA', 'ENERGY_FLUX'),
        desc: 'Delta flux'
    }
};

// Convergence (fluxState)
const CONVERGENCE = {
    'OLD_T0': {
        key: getLogoKey('TEMP', 'OLD_T0'),
        desc: 'old_T0 (backup t°)'
    },
    'T0': {
        key: getLogoKey('COMPUTE', 'TEMP', 'T0'),
        desc: 'T0 (t° initiale)'
    },
    'PHASE': {
        key: getLogoKey('COMPUTE', 'PHASE'),
        desc: 'Phase (Search/Dicho)'
    },
    'DIRECTION': {
        key: getLogoKey('COMPUTE', 'DIRECTION'),
        desc: 'Direction (+/-)'
    },
    'TOLERANCE': {
        key: getLogoKey('ENERGY_FLUX', 'TOLERANCE'),
        desc: 'Précision en Flux'
    },
    'SPECTRAL_SAMPLING': {
        key: getLogoKey('CARDINAL', 'SPECTRAL'),
        desc: 'Résolution spectrale'
    },
    'ATMOSPHERE_SAMPLING': {
        key: getLogoKey('CARDINAL', 'ATMOSPHERE'),
        desc: 'Résolution atmosphérique'
    }
    
};

// ============================================================================
// FONCTION : CRÉER LA SYNTAXE
// ============================================================================

function createSyntaxe() {
    if (typeof window === 'undefined' || !getLogoKey) {
        console.error('[createSyntaxe] getLogoKey non défini');
        return '';
    }
    
    // Fonction helper pour créer une entrée (même format que lexique)
    const createSyntaxeEntry = (id, data) => {
        // key est maintenant directement la valeur (plus rapide)
        const keyValue = data.key;
        
        // Format identique à lexique : logo + description
        return `<div class="legend-item"><span class="logo">${keyValue}</span><span class="description">${data.desc}</span></div>`;
    };
    
    // Parcourir toutes les catégories (8 catégories réparties en 4 colonnes, 2 par colonne)
    const categories = [
        { name: 'États activés', data: ENABLED_STATES },
        { name: 'Config Événements', data: DATE_CONFIG },
        { name: 'Masses', data: MASSES },
        { name: 'Atmosphére', data: ATM },
        { name: 'Cycle de l\'eau', data: H2O },
        { name: 'Albédo', data: ALBEDO },
        { name: 'Flux radiatif', data: FLUX },
        { name: 'Convergence', data: CONVERGENCE }
    ];
    
    // Générer le HTML pour chaque catégorie (sans wrapper de colonne)
    const categoryHTMLs = categories.map(category => {
        const items = Object.entries(category.data)
            .map(([id, data]) => createSyntaxeEntry(id, data))
            .join('');
        
        // Format identique à lexique : h3 + items directement
        return `
            <h3 class="legend-title">${category.name}</h3>
            ${items}
        `;
    });
    
    // Organiser en 4 colonnes, 2 catégories par colonne
    const col1 = categoryHTMLs.slice(0, 2).join('');
    const col2 = categoryHTMLs.slice(2, 4).join('');
    const col3 = categoryHTMLs.slice(4, 6).join('');
    const col4 = categoryHTMLs.slice(6, 8).join('');
    
    // Format identique à createLexique : une seule grille avec 4 colonnes
    return `
        <div class="legend-grid">
            <div class="legend-column">
                ${col1}
            </div>
            <div class="legend-column">
                ${col2}
            </div>
            <div class="legend-column">
                ${col3}
            </div>
            <div class="legend-column">
                ${col4}
            </div>
        </div>
    `;
}

// Exposition globale des objets syntaxe
if (typeof window !== 'undefined') {
    window.ENABLED_STATES = ENABLED_STATES;
    window.DATE_CONFIG = DATE_CONFIG;
    window.MASSES = MASSES;
    window.ATM = ATM;
    window.H2O = H2O;
    window.ALBEDO = ALBEDO;
    window.FLUX = FLUX;
    window.CONVERGENCE = CONVERGENCE;
    window.createSyntaxe = createSyntaxe;
}

