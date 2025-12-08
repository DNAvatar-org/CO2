// File: static/compute/syntaxe.js - Syntaxe des combinaisons de logos
// Desc: Définit les catégories de combinaisons de logos (2+ logos d'affilée)
// Version 1.2.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [January 2025]
// Logs:
//   - Initial version: extraction depuis grammar.js
//   - v1.0.1: Remplacement styles inline par classes CSS (syntaxe.css)
//   - v1.1.0: Ajout clés avec CONFIG, correction MASSES.TOTAL, correction DIRECTION
//   - v1.2.0: key() remplacé par valeur directe (plus rapide, pas de fonction wrapper)

// ============================================================================
// DÉFINITION DES CATÉGORIES DE SYNTAXE
// ============================================================================
// ⚠️ IMPORTANT : Les logos sont définis dans grammar.js
// window.LOGOS est défini dans grammar.js
// window.getLogoKey est défini dans grammar.js
//
// UTILISATION :
// Au lieu d'utiliser directement window.getLogoKey('BOOLEAN', 'H2O', 'EDS'),
// utilisez les références nommées via les catégories :
//   window.ENABLED_STATES.H2O_EDS.key  => '🔘💧📛'
//   window.DATE_CONFIG.OLD_T0.key      => '🌡️🏮'
//   window.MASSES.CO2.key               => '🐳🏭'
//   window.ATM.CO2.key                  => '🍰🌬🏭'
//   window.H2O.ICE.key                  => '🍰💧🧊'
//   window.ALBEDO.TOTAL.key              => '🍰🪞🎓'
//   window.FLUX.SOLAR_ABSORBED.key      => '🧲☀️🔽'
//   window.CONVERGENCE.T0.key           => '⏳🌡️🚩'
//
// Ces catégories servent de références nommées pour tous les multilogos (2+ logos)

// ============================================================================
// CATÉGORIES DE COMBINAISONS DE LOGOS
// ============================================================================
// Les clés sont calculées directement (plus rapide que des fonctions)
// ⚠️ IMPORTANT : syntaxe.js doit être chargé APRÈS grammar.js pour que window.getLogoKey soit disponible

// États activés (enabledStates)
const ENABLED_STATES = {
    'H2O_EDS': {
        key: window.getLogoKey('BOOLEAN', 'H2O', 'EDS'),
        desc: 'H2O EDS on/off'
    },
    'CH4_EDS': {
        key: window.getLogoKey('BOOLEAN', 'CH4', 'EDS'),
        desc: 'CH4 EDS on/off'
    },
    'CO2_EDS': {
        key: window.getLogoKey('BOOLEAN', 'CO2', 'EDS'),
        desc: 'CO2 EDS on/off'
    },
    'ALBEDO': {
        key: window.getLogoKey('BOOLEAN', 'ALBEDO'),
        desc: 'Albedo on/off'
    },
    'ANIMATION': {
        key: window.getLogoKey('BOOLEAN', 'ANIMATION'),
        desc: 'Animation on/off'
    }
};

// Configuration de date (dateConfig)
const DATE_CONFIG = {
    'OLD_T0': {
        key: window.getLogoKey('TEMP', 'OLD_T0'),
        desc: 'old_T0 (backup t°)'
    },
    'T0_CONFIG': {
        key: window.getLogoKey('TEMP', 'COMPUTE', 'CONFIG'),
        desc: 'T0 attendu (t° config)'
    },
    'METEORITE_COUNT': {
        key: window.getLogoKey('CARDINAL', 'METEORITE_COUNT', 'CONFIG'),
        desc: 'Nombre de météore'
    },
    'DELTA_TEMP_METEORITE': {
        key: window.getLogoKey('DELTA', 'TEMP', 'METEORITE_COUNT', 'CONFIG'),
        desc: 'Delta t° / météore'
    },
    'DELTA_WATER_METEORITE': {
        key: window.getLogoKey('DELTA', 'WEIGHT', 'H2O', 'METEORITE_COUNT', 'CONFIG'),
        desc: 'Masse d\'eau / météore'
    },
    'TIC_TIME_COUNT': {
        key: window.getLogoKey('CARDINAL', 'TIC_TIME', 'CONFIG'),
        desc: 'Nombre de ticTime'
    },
    'DELTA_TEMP_TIC_TIME': {
        key: window.getLogoKey('DELTA', 'TEMP', 'TIC_TIME', 'CONFIG'),
        desc: 'Delta t° / ticTime'
    },
    'DELTA_FLUX_GEOTHERMAL_TIC_TIME': {
        key: window.getLogoKey('DELTA', 'ENERGY_FLUX', 'GEOTHERMAL_FLUX', 'TIC_TIME', 'CONFIG'),
        desc: 'Delta Flux Geom /ticTime'
    }
};

// Masses (masses)
const MASSES = {
    'CO2': {
        key: window.getLogoKey('WEIGHT', 'CO2'),
        desc: 'Masse CO2'
    },
    'CH4': {
        key: window.getLogoKey('WEIGHT', 'CH4'),
        desc: 'Masse CH4'
    },
    'H2O': {
        key: window.getLogoKey('WEIGHT', 'H2O'),
        desc: 'Masse H2O'
    },
    'O2': {
        key: window.getLogoKey('WEIGHT', 'O2'),
        desc: 'Masse O2'
    },
    'TOTAL': {
        key: window.getLogoKey('WEIGHT', 'CARDINAL'),
        desc: 'Masse Atm.'
    }
};

// Composition atmosphérique (atm)
const ATM = {
    'ALTITUDE': {
        key: window.getLogoKey('METER', 'ATMOSPHERE', 'ALTITUDE'),
        desc: 'Altitude max'
    },
    'TROPOPAUSE': {
        key: window.getLogoKey('METER', 'ATMOSPHERE', 'TROPOPAUSE'),
        desc: 'Tropopause'
    },
    'CO2': {
        key: window.getLogoKey('PROPORTION', 'ATMOSPHERE', 'CO2'),
        desc: 'CO2'
    },
    'H2O': {
        key: window.getLogoKey('PROPORTION', 'ATMOSPHERE', 'H2O'),
        desc: 'H2O'
    },
    'CH4': {
        key: window.getLogoKey('PROPORTION', 'ATMOSPHERE', 'CH4'),
        desc: 'CH4'
    },
    'O2': {
        key: window.getLogoKey('PROPORTION', 'ATMOSPHERE', 'O2'),
        desc: 'O2'
    }
};

// Cycle de l'eau (h2o)
const H2O = {
    'ICE': {
        key: window.getLogoKey('PROPORTION', 'H2O', 'ICE'),
        desc: 'Glace'
    },
    'CLOUD': {
        key: window.getLogoKey('PROPORTION', 'H2O', 'CLOUD'),
        desc: 'Nuages'
    },
    'OCEAN': {
        key: window.getLogoKey('PROPORTION', 'H2O', 'OCEAN'),
        desc: 'Océan'
    },
    'MAX_VAPOR': {
        key: window.getLogoKey('PROPORTION', 'COMPUTE', 'MAX_VAPOR'),
        desc: 'Max vapor fraction'
    }
};

// Albédo (albedo)
const ALBEDO = {
    'TOTAL': {
        key: window.getLogoKey('PROPORTION', 'ALBEDO', 'CARDINAL'),
        desc: 'Albedo total'
    },
    'VOLCANO': {
        key: window.getLogoKey('PROPORTION', 'ALBEDO', 'VOLCANO'),
        desc: 'Volcan'
    },
    'DESERT': {
        key: window.getLogoKey('PROPORTION', 'ALBEDO', 'DESERT'),
        desc: 'Désert'
    },
    'FOREST': {
        key: window.getLogoKey('PROPORTION', 'ALBEDO', 'FOREST'),
        desc: 'Forêt'
    },
    'OCEAN': {
        key: window.getLogoKey('PROPORTION', 'ALBEDO', 'OCEAN'),
        desc: 'Océan'
    },
    'ICE': {
        key: window.getLogoKey('PROPORTION', 'ALBEDO', 'ICE'),
        desc: 'Glace'
    },
    'CLOUD': {
        key: window.getLogoKey('PROPORTION', 'ALBEDO', 'CLOUD'),
        desc: 'Nuages'
    }
};

// Flux radiatif (flux)
const FLUX = {
    'SOLAR_ABSORBED': {
        key: window.getLogoKey('ENERGY_FLUX', 'SUN_ORIGIN', 'FLUX_IN'),
        desc: 'Flux solaire absorbé'
    },
    'GEOTHERMAL_IN': {
        key: window.getLogoKey('ENERGY_FLUX', 'GEOTHERMAL_FLUX', 'FLUX_IN'),
        desc: 'Flux géothermique'
    },
    'OUT': {
        key: window.getLogoKey('ENERGY_FLUX', 'FLUX_CN', 'FLUX_OUT'),
        desc: 'Flux sortant (σT⁴)'
    },
    'DELTA': {
        key: window.getLogoKey('DELTA', 'ENERGY_FLUX'),
        desc: 'Delta flux'
    }
};

// Convergence (fluxState)
const CONVERGENCE = {
    'OLD_T0': {
        key: window.getLogoKey('TEMP', 'OLD_T0'),
        desc: 'old_T0 (backup t°)'
    },
    'T0': {
        key: window.getLogoKey('COMPUTE', 'TEMP', 'T0'),
        desc: 'T0 (t° initiale)'
    },
    'PHASE': {
        key: window.getLogoKey('COMPUTE', 'PHASE'),
        desc: 'Phase (Search/Dicho)'
    },
    'DIRECTION': {
        key: window.getLogoKey('COMPUTE', 'DIRECTION'),
        desc: 'Direction (+/-)'
    },
    'TOLERANCE': {
        key: window.getLogoKey('ENERGY_FLUX', 'TOLERANCE'),
        desc: 'Précision en Flux'
    }
};

// ============================================================================
// FONCTION : CRÉER LA SYNTAXE
// ============================================================================

function createSyntaxe() {
    if (typeof window === 'undefined' || !window.getLogoKey) {
        console.error('[createSyntaxe] window.getLogoKey non défini');
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
        { name: 'Configuration de date', data: DATE_CONFIG },
        { name: 'Masses', data: MASSES },
        { name: 'Composition atmosphérique', data: ATM },
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
            <h3 class="syntaxe-title">${category.name}</h3>
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
        <div class="syntaxe-grid">
            <div class="syntaxe-column">
                ${col1}
            </div>
            <div class="syntaxe-column">
                ${col2}
            </div>
            <div class="syntaxe-column">
                ${col3}
            </div>
            <div class="syntaxe-column">
                ${col4}
            </div>
        </div>
    `;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

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

