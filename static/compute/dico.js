// File: static/compute/dico.js - Dictionnaire des clés (combinaisons de caractères)
// Desc: Définit toutes les clés (combinaisons de caractères) et leurs descriptions
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [January 2025]

// ============================================================================
// OBJET KEYS (toutes les clés regroupées)
// ============================================================================
const KEYS = {
    // États activés
    'ENABLED_H2O': getCharKey('BOOLEAN', 'H2O', 'EDS'),
    'ENABLED_CH4': getCharKey('BOOLEAN', 'CH4', 'EDS'),
    'ENABLED_CO2': getCharKey('BOOLEAN', 'CO2', 'EDS'),
    'ENABLED_ALBEDO': getCharKey('BOOLEAN', 'ALBEDO'),
    'ENABLED_ANIMATION': getCharKey('BOOLEAN', 'ANIMATION'),
    
    // Configuration de date
    'OLD_T0': getCharKey('TEMP', 'OLD_T0'),
    'T0_CONFIG': getCharKey('TEMP', 'COMPUTE'),
    'METEORITE_COUNT': getCharKey('CARDINAL', 'METEORITE_COUNT'),
    'DELTA_WATER_METEORITE': getCharKey('DELTA', 'WEIGHT', 'H2O', 'METEORITE_COUNT'),
    'TIC_TIME_COUNT': getCharKey('CARDINAL', 'TIC_TIME'),
    'DELTA_TEMP_TIC_TIME': getCharKey('DELTA', 'TEMP', 'TIC_TIME'),
    'DELTA_FLUX_GEOTHERMAL_TIC_TIME': getCharKey('DELTA', 'ENERGY_FLUX', 'GEOTHERMAL_FLUX', 'TIC_TIME'),
    
    // Masses
    'MASSE_CO2': getCharKey('WEIGHT', 'CO2'),
    'MASSE_CH4': getCharKey('WEIGHT', 'CH4'),
    'MASSE_H2O': getCharKey('WEIGHT', 'H2O'),
    'MASSE_O2': getCharKey('WEIGHT', 'O2'),
    'MASSE_TOTAL': getCharKey('WEIGHT', 'CARDINAL'),
    
    // Composition atmosphérique
    'ATM_ALTITUDE': getCharKey('METER', 'ATMOSPHERE', 'ALTITUDE'),
    'ATM_TROPOPAUSE': getCharKey('METER', 'ATMOSPHERE', 'TROPOPAUSE'),
    'ATM_CO2': getCharKey('PROPORTION', 'ATMOSPHERE', 'CO2'),
    'ATM_H2O': getCharKey('PROPORTION', 'ATMOSPHERE', 'H2O'),
    'ATM_CH4': getCharKey('PROPORTION', 'ATMOSPHERE', 'CH4'),
    'ATM_O2': getCharKey('PROPORTION', 'ATMOSPHERE', 'O2'),
    'ATM_N2': getCharKey('PROPORTION', 'ATMOSPHERE', 'N2'),
    
    // Cycle de l'eau
    'H2O_ICE': getCharKey('PROPORTION', 'H2O', 'ICE'),
    'H2O_CLOUD': getCharKey('PROPORTION', 'H2O', 'CLOUD'),
    'H2O_OCEAN': getCharKey('PROPORTION', 'H2O', 'OCEAN'),
    'H2O_MAX_VAPOR': getCharKey('PROPORTION', 'COMPUTE', 'MAX_VAPOR'),
    
    // Albédo
    'ALBEDO_TOTAL': getCharKey('PROPORTION', 'ALBEDO', 'CARDINAL'),
    'ALBEDO_VOLCANO': getCharKey('PROPORTION', 'ALBEDO', 'VOLCANO'),
    'ALBEDO_DESERT': getCharKey('PROPORTION', 'ALBEDO', 'DESERT'),
    'ALBEDO_FOREST': getCharKey('PROPORTION', 'ALBEDO', 'FOREST'),
    'ALBEDO_OCEAN': getCharKey('PROPORTION', 'ALBEDO', 'OCEAN'),
    'ALBEDO_ICE': getCharKey('PROPORTION', 'ALBEDO', 'ICE'),
    'ALBEDO_CLOUD': getCharKey('PROPORTION', 'ALBEDO', 'CLOUD'),
    
    // Flux radiatif
    'FLUX_SOLAR_ABSORBED': getCharKey('ENERGY_FLUX', 'SUN_ORIGIN', 'FLUX_IN'),
    'FLUX_GEOTHERMAL_IN': getCharKey('ENERGY_FLUX', 'GEOTHERMAL_FLUX', 'FLUX_IN'),
    'FLUX_OUT': getCharKey('ENERGY_FLUX', 'FLUX_CN', 'FLUX_OUT'),
    'FLUX_SPECTRAL_OUT': getCharKey('ENERGY_FLUX', 'SPECTRAL', 'FLUX_OUT'),
    'FLUX_REFLECTED': getCharKey('ENERGY_FLUX', 'ALBEDO', 'FLUX_OUT'),
    'FLUX_DELTA': getCharKey('DELTA', 'ENERGY_FLUX'),
    
    // Convergence
    'CONVERGENCE_OLD_T0': getCharKey('TEMP', 'OLD_T0'),
    'CONVERGENCE_T0': getCharKey('COMPUTE', 'TEMP', 'T0'),
    'CONVERGENCE_PHASE': getCharKey('COMPUTE', 'PHASE'),
    'CONVERGENCE_DIRECTION': getCharKey('COMPUTE', 'DIRECTION'),
    'CONVERGENCE_TOLERANCE': getCharKey('ENERGY_FLUX', 'TOLERANCE'),
    'CONVERGENCE_SPECTRAL_SAMPLING': getCharKey('CARDINAL', 'SPECTRAL'),
    'CONVERGENCE_ATMOSPHERE_SAMPLING': getCharKey('CARDINAL', 'ATMOSPHERE'),
    
    // Soleil
    'SOLEIL_CONSTANT': getCharKey('ENERGY_FLUX', 'SUN_ORIGIN'),
    'SOLEIL_GEOMETRY_ORIGIN': getCharKey('ENERGY_FLUX', 'SUN_ORIGIN', 'GEOMETRY_ORIGIN'),
    'SOLEIL_SUN_ORIGIN': getCharKey('ENERGY_FLUX', 'SUN_ORIGIN', 'SUN_ORIGIN'),
    'SOLEIL_POWER': getCharKey('POWER', 'SUN_ORIGIN'),
    
    // Noyau
    'NOYAU_FLUX': getCharKey('ENERGY_FLUX', 'GEOTHERMAL_FLUX'),
    'NOYAU_POWER': getCharKey('POWER', 'GEOTHERMAL_FLUX')
};

// ============================================================================
// OBJET DESC (toutes les descriptions)
// ============================================================================
const DESC = {
    // États activés
    [KEYS['ENABLED_H2O']]: 'H2O EDS on/off',
    [KEYS['ENABLED_CH4']]: 'CH4 EDS on/off',
    [KEYS['ENABLED_CO2']]: 'CO2 EDS on/off',
    [KEYS['ENABLED_ALBEDO']]: 'Albedo on/off',
    [KEYS['ENABLED_ANIMATION']]: 'Animation on/off',
    
    // Configuration de date
    [KEYS['OLD_T0']]: 'old_T0 (backup t°)',
    [KEYS['T0_CONFIG']]: 'T0 attendu (t° config)',
    [KEYS['METEORITE_COUNT']]: 'Nombre de météore',
    [KEYS['DELTA_WATER_METEORITE']]: 'Masse d\'eau / météore',
    [KEYS['TIC_TIME_COUNT']]: 'Nombre de ticTime',
    [KEYS['DELTA_TEMP_TIC_TIME']]: 'Delta t° / ticTime',
    [KEYS['DELTA_FLUX_GEOTHERMAL_TIC_TIME']]: 'Delta Geoth / ticTime',
    
    // Masses
    [KEYS['MASSE_CO2']]: 'Masse CO2',
    [KEYS['MASSE_CH4']]: 'Masse CH4',
    [KEYS['MASSE_H2O']]: 'Masse H2O',
    [KEYS['MASSE_O2']]: 'Masse O2',
    [KEYS['MASSE_TOTAL']]: 'Masse Atm.',
    
    // Composition atmosphérique
    [KEYS['ATM_ALTITUDE']]: 'Ligne de Kármán',
    [KEYS['ATM_TROPOPAUSE']]: 'Tropopause',
    [KEYS['ATM_CO2']]: 'CO2',
    [KEYS['ATM_H2O']]: 'H2O',
    [KEYS['ATM_CH4']]: 'CH4',
    [KEYS['ATM_O2']]: 'O2',
    [KEYS['ATM_N2']]: 'N2',
    
    // Cycle de l'eau
    [KEYS['H2O_ICE']]: 'Glace',
    [KEYS['H2O_CLOUD']]: 'Nuages',
    [KEYS['H2O_OCEAN']]: 'Océan',
    [KEYS['H2O_MAX_VAPOR']]: 'Max vapor fraction',
    
    // Albédo
    [KEYS['ALBEDO_TOTAL']]: 'Albedo total',
    [KEYS['ALBEDO_VOLCANO']]: 'Volcan',
    [KEYS['ALBEDO_DESERT']]: 'Désert',
    [KEYS['ALBEDO_FOREST']]: 'Forêt',
    [KEYS['ALBEDO_OCEAN']]: 'Océan',
    [KEYS['ALBEDO_ICE']]: 'Glace',
    [KEYS['ALBEDO_CLOUD']]: 'Nuages',
    
    // Flux radiatif
    [KEYS['FLUX_SOLAR_ABSORBED']]: 'Flux solaire absorbé',
    [KEYS['FLUX_GEOTHERMAL_IN']]: 'Flux géothermique',
    [KEYS['FLUX_OUT']]: 'Flux sortant (σT⁴)',
    [KEYS['FLUX_SPECTRAL_OUT']]: 'Courbe spectrale',
    [KEYS['FLUX_REFLECTED']]: 'Flux réfléchi',
    [KEYS['FLUX_DELTA']]: 'Delta flux',
    
    // Convergence
    [KEYS['CONVERGENCE_OLD_T0']]: 'old_T0 (backup t°)',
    [KEYS['CONVERGENCE_T0']]: 'T0 (t° initiale)',
    [KEYS['CONVERGENCE_PHASE']]: 'Phase (Search/Dicho)',
    [KEYS['CONVERGENCE_DIRECTION']]: 'Direction (+/-)',
    [KEYS['CONVERGENCE_TOLERANCE']]: 'Précision en Flux',
    [KEYS['CONVERGENCE_SPECTRAL_SAMPLING']]: 'Résolution spectrale',
    [KEYS['CONVERGENCE_ATMOSPHERE_SAMPLING']]: 'Résolution atmosphérique',
    
    // Soleil
    [KEYS['SOLEIL_CONSTANT']]: 'Constante solaire à 1 UA',
    [KEYS['SOLEIL_GEOMETRY_ORIGIN']]: 'Flux solaire géométrique (1 UA / 4)',
    [KEYS['SOLEIL_SUN_ORIGIN']]: 'Flux solaire à la surface du soleil',
    [KEYS['SOLEIL_POWER']]: 'Puissance totale du soleil',
    
    // Noyau
    [KEYS['NOYAU_FLUX']]: 'Flux géothermique',
    [KEYS['NOYAU_POWER']]: 'Puissance totale du noyau'
};

// ============================================================================
// OBJET DATA (initialisé avec 0.0, sera rempli après)
// ============================================================================
const DATA = {};
// Parcourir KEYS pour créer DATA avec valeurs par défaut
for (const keyName in KEYS) {
    const key = KEYS[keyName];
    // Déterminer le type par défaut selon le nom de la clé
    if (keyName.includes('ENABLED') || keyName.includes('ANIMATION')) {
        DATA[key] = false;  // Booléens
    } else if (keyName.includes('PHASE')) {
        DATA[key] = '';  // String
    } else if (keyName.includes('DIRECTION')) {
        DATA[key] = 0;  // Number (signe)
    } else if (keyName.includes('DELTA_FLUX_GEOTHERMAL_TIC_TIME')) {
        DATA[key] = null;  // Object
    } else {
        DATA[key] = 0.0;  // Numbers
    }
}

// ============================================================================
// FONCTION : CRÉER LE DICO (utilise DATA directement, pas de paramètres)
// ============================================================================
function createDico() {
    if (typeof window === 'undefined' || !window.DATA || !window.DESC || !window.KEYS) {
        console.error('[createDico] DATA, DESC ou KEYS non défini');
        return '';
    }
    
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const DESC = window.DESC;
    const KEYS = window.KEYS;
    
    // Fonction helper pour créer une entrée
    const createDicoEntry = (key, desc) => {
        return `<div class="legend-item"><span class="logo">${key}</span><span class="description">${desc}</span></div>`;
    };
    
    // Catégories (8 catégories réparties en 4 colonnes, 2 par colonne)
    const categories = [
        {
            name: 'États activés',
            keys: ['ENABLED_H2O', 'ENABLED_CH4', 'ENABLED_CO2', 'ENABLED_ALBEDO', 'ENABLED_ANIMATION']
        },
        {
            name: 'Config Événements',
            keys: ['OLD_T0', 'T0_CONFIG', 'METEORITE_COUNT', 'DELTA_WATER_METEORITE', 'TIC_TIME_COUNT', 'DELTA_TEMP_TIC_TIME', 'DELTA_FLUX_GEOTHERMAL_TIC_TIME']
        },
        {
            name: 'Masses',
            keys: ['MASSE_CO2', 'MASSE_CH4', 'MASSE_H2O', 'MASSE_O2', 'MASSE_TOTAL']
        },
        {
            name: 'Atmosphére',
            keys: ['ATM_ALTITUDE', 'ATM_TROPOPAUSE', 'ATM_CO2', 'ATM_H2O', 'ATM_CH4', 'ATM_O2', 'ATM_N2']
        },
        {
            name: 'Cycle de l\'eau',
            keys: ['H2O_ICE', 'H2O_CLOUD', 'H2O_OCEAN', 'H2O_MAX_VAPOR']
        },
        {
            name: 'Albédo',
            keys: ['ALBEDO_TOTAL', 'ALBEDO_VOLCANO', 'ALBEDO_DESERT', 'ALBEDO_FOREST', 'ALBEDO_OCEAN', 'ALBEDO_ICE', 'ALBEDO_CLOUD']
        },
        {
            name: 'Flux radiatif',
            keys: ['FLUX_SOLAR_ABSORBED', 'FLUX_GEOTHERMAL_IN', 'FLUX_OUT', 'FLUX_SPECTRAL_OUT', 'FLUX_REFLECTED', 'FLUX_DELTA']
        },
        {
            name: 'Convergence',
            keys: ['CONVERGENCE_OLD_T0', 'CONVERGENCE_T0', 'CONVERGENCE_PHASE', 'CONVERGENCE_DIRECTION', 'CONVERGENCE_TOLERANCE', 'CONVERGENCE_SPECTRAL_SAMPLING', 'CONVERGENCE_ATMOSPHERE_SAMPLING']
        }
    ];
    
    // Générer le HTML pour chaque catégorie
    const categoryHTMLs = categories.map(category => {
        const items = category.keys
            .map(keyName => {
                const key = KEYS[keyName];
                const desc = DESC[key] || '';
                return createDicoEntry(key, desc);
            })
            .join('');
        
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

// ============================================================================
// EXPOSITION GLOBALE (uniquement KEYS, DESC, DATA)
// ============================================================================
if (typeof window !== 'undefined') {
    window.KEYS = KEYS;
    window.DESC = DESC;
    window.DATA = DATA;
    window.createDico = createDico;
    
    // Compatibilité : ALL_DATA devient DATA
    window.ALL_DATA = DATA;
    window.ALL_DESC = DESC;
}
