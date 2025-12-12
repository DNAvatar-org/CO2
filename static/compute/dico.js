// File: static/compute/dico.js - Dictionnaire des clés (combinaisons de caractères)
// Desc: Définit toutes les clés (combinaisons de caractères) et leurs descriptions
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [January 2025]

// ============================================================================
// OBJET KEYS (toutes les clés regroupées) - Utilise directement les emojis
// ============================================================================
const KEYS = {
    // États activés
    '🔘': {
        'ENABLED_H2O': '🔘💧📛',
        'ENABLED_CH4': '🔘⛽📛',
        'ENABLED_CO2': '🔘🏭📛',
        'ENABLED_ALBEDO': '🔘🪞',
        'ENABLED_ANIMATION': '🔘🎬',
    },
    
    // Configuration de date / Événements
    '📜': {
        'OLD_T0': '🌡️🏮',
        'T0_CONFIG': '🌡️⏳',
        'METEORITE_COUNT': '📿☄️',
        'DELTA_WATER_METEORITE': '🔺⚖️💧☄️',
        'TIC_TIME_COUNT': '📿💫',
        'DELTA_TEMP_TIC_TIME': '🔺🌡️💫',
        'DELTA_FLUX_GEOTHERMAL_TIC_TIME': '🔺🧲🌕💫',
    },
    // Date Époque
    '📅': {
        'DATE_START': '▶',
        'DATE_END': '◀',
        'T0_CONFIG': '🌡️⏳',
        'PRECISION': '🧲🔬',
    },
    
    // Masses
    '⚖️': {
        'MASSE_CO2': '⚖️🏭',
        'MASSE_CH4': '⚖️⛽',
        'MASSE_H2O': '⚖️💧',
        'MASSE_O2': '⚖️🌫',
        'MASSE_TOTAL': '⚖️📿',
    },
    // Composition atmosphérique
    '🌬': {
        'ATM_ALTITUDE': '📏🌬🧿',
        'ATM_TROPOPAUSE': '📏🌬🛩',
        'ATM_CO2': '🍰🌬🏭',
        'ATM_H2O': '🍰🌬💧',
        'ATM_CH4': '🍰🌬⛽',
        'ATM_O2': '🍰🌬🌫',
        'ATM_N2': '🍰🌬💨',
        'ATM_PRESSURE': '🎈',
    },
    // Cycle de l'eau
    '💧': {
        'H2O_ICE': '🍰💧🧊',
        'H2O_CLOUD': '🍰💧⛅',
        'H2O_OCEAN': '🍰💧🌊',
        'H2O_MAX_VAPOR': '🍰⏳🌧',
    },
    // Albédo
    '🪞': {
        'ALBEDO_TOTAL': '🍰🪞📿',
        'ALBEDO_VOLCANO': '🍰🪞🌋',
        'ALBEDO_DESERT': '🍰🪞🏖',
        'ALBEDO_FOREST': '🍰🪞🌳',
        'ALBEDO_OCEAN': '🍰🪞🌊',
        'ALBEDO_ICE': '🍰🪞🧊',
        'ALBEDO_CLOUD': '🍰🪞⛅',
    },
    // Flux radiatif
    '🧲': {
        'FLUX_SOLAR_ABSORBED': '🧲☀️🔽',
        'FLUX_GEOTHERMAL_IN': '🧲🌕🔽',
        'FLUX_OUT': '🧲🌑🔼',
        'FLUX_SPECTRAL_OUT': '🧲🌈🔼',
        'FLUX_REFLECTED': '🧲🪞🔼',
        'FLUX_DELTA': '🔺🧲',
    },
    // Convergence
    '⏳': {
        'CONVERGENCE_OLD_T0': '🌡️🏮',
        'CONVERGENCE_T0': '⏳🌡️🚩',
        'CONVERGENCE_PHASE': '⏳⚧',
        'CONVERGENCE_DIRECTION': '⏳☯',
        'CONVERGENCE_TOLERANCE': '🧲🔬',
        'CONVERGENCE_SPECTRAL_SAMPLING': '🔬🌈',
        'CONVERGENCE_ATMOSPHERE_SAMPLING': '🔬🌬',
    },
    // Soleil
    '☀️': {
        'SOLEIL_CONSTANT': '🧲☀️',
        'SOLEIL_GEOMETRY_ORIGIN': '🧲☀️🎱',
        'SOLEIL_POWER': '🔋☀️',
    },
    
    // Noyau
    '🌕': {
        'NOYAU_FLUX': '🧲🌕',
        'NOYAU_POWER': '🔋🌕',
    },
    // EDS (Forçage radiatif)
    '📛': {
        'EDS_H2O': '📛💧',
    }
};

// ============================================================================
// OBJET DESC (toutes les descriptions) - Structure hiérarchique (2 niveaux)
// Utilise directement les emojis
// ============================================================================
const DESC = {
    '🔘': {
        '🔘💧📛': 'H2O EDS on/off',
        '🔘⛽📛': 'CH4 EDS on/off',
        '🔘🏭📛': 'CO2 EDS on/off',
        '🔘🪞': 'Albedo on/off',
        '🔘🎬': 'Animation on/off',
    },
    '📜': {
        '🌡️🏮': 'old_T0 (backup t°)',
        '🌡️⏳': 'T0 attendu (t° config)',
        '📿☄️': 'Nombre de météore',
        '🔺⚖️💧☄️': 'Masse d\'eau / météore',
        '📿💫': 'Nombre de ticTime',
        '🔺🌡️💫': 'Delta t° / ticTime',
        '🔺🧲🌕💫': 'Delta Geoth / ticTime',
    },
    '🌬': {
        '📏🌬🧿': 'Ligne de Kármán',
        '📏🌬🛩': 'Tropopause',
        '🍰🌬🏭': 'CO2',
        '🍰🌬💧': 'H2O',
        '🍰🌬⛽': 'CH4',
        '🍰🌬🌫': 'O2',
        '🍰🌬💨': 'N2',
        '🎈': 'Pression atmosphérique',
    },
    '⚖️': {
        '⚖️🏭': 'Masse CO2',
        '⚖️⛽': 'Masse CH4',
        '⚖️💧': 'Masse H2O',
        '⚖️🌫': 'Masse O2',
        '⚖️📿': 'Masse Atm.',
    },
    '💧': {
        '🍰💧🧊': 'Glace',
        '🍰💧⛅': 'Nuages',
        '🍰💧🌊': 'Océan',
        '🍰⏳🌧': 'Max vapor fraction',
    },
    '🪞': {
        '🍰🪞📿': 'Albedo total',
        '🍰🪞🌋': 'Volcan',
        '🍰🪞🏖': 'Désert',
        '🍰🪞🌳': 'Forêt',
        '🍰🪞🌊': 'Océan',
        '🍰🪞🧊': 'Glace',
        '🍰🪞⛅': 'Nuages',
    },
    '🧲': {
        '🧲☀️🔽': 'Flux solaire absorbé',
        '🧲🌕🔽': 'Flux géothermique',
        '🧲🌑🔼': 'Flux sortant (σT⁴)',
        '🧲🌈🔼': 'Courbe spectrale',
        '🧲🪞🔼': 'Flux réfléchi',
        '🔺🧲': 'Delta flux',
    },
    '⏳': {
        '🌡️🏮': 'old_T0 (backup t°)',
        '⏳🌡️🚩': 'T0 (t° initiale)',
        '⏳⚧': 'Phase (Search/Dicho)',
        '⏳☯': 'Direction (+/-)',
        '🧲🔬': 'Précision en Flux',
        '🔬🌈': 'Résolution spectrale',
        '🔬🌬': 'Résolution atmosphérique',
    },
    '☀️': {
        '🧲☀️': 'Flux solaire à 1 UA',
        '🧲☀️🎱': 'Flux solaire géométrique (1 UA / 4)',
        '🔋☀️': 'Puissance totale du soleil',
    },
    '🌕': {
        '🧲🌕': 'Flux géothermique',
        '🔋🌕': 'Puissance totale du noyau',
    },
    '📅': {
        '▶': 'Date Début',
        '◀': 'Date Fin',
        '🌡️⏳': 'T° attendue',
        '🧲🔬': 'Précision Flux',
    },
    '📛': {
        '📛💧': 'Forçage radiatif H2O',
    }
};

// ============================================================================
// OBJET DATA (initialisé avec 0.0, structure hiérarchique 2 niveaux)
// ============================================================================
const DATA = {};
// Parcourir KEYS pour créer DATA avec valeurs par défaut (structure hiérarchique)
for (const categoryKey in KEYS) {
    const category = KEYS[categoryKey];
    DATA[categoryKey] = {};
    
    for (const keyName in category) {
        const fullKey = category[keyName];
        
        // Déterminer le type par défaut selon le nom de la clé
        if (keyName.includes('ENABLED') || keyName.includes('ANIMATION')) {
            DATA[categoryKey][fullKey] = false;  // Booléens
        } else if (keyName.includes('PHASE')) {
            DATA[categoryKey][fullKey] = '';  // String
        } else if (keyName.includes('DIRECTION')) {
            DATA[categoryKey][fullKey] = 0;  // Number (signe)
        } else if (keyName.includes('DELTA_FLUX_GEOTHERMAL_TIC_TIME')) {
            DATA[categoryKey][fullKey] = null;  // Object
        } else {
            DATA[categoryKey][fullKey] = 0.0;  // Numbers
        }
    }
}

// ============================================================================
// FONCTION : CRÉER LE DICO (utilise DATA directement, pas de paramètres)
// ============================================================================
function createDicoHtml() {
    if (typeof window === 'undefined' || !window.DATA || !window.DESC) {
        console.error('[createDico] DATA ou DESC non défini');
        return '';
    }
    
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const DESC = window.DESC;
    // KEYS est défini localement dans ce fichier
    
    // Fonction helper pour créer une entrée
    const createDicoEntry = (key, desc) => {
        return `<div class="legend-item"><span class="logo">${key}</span><span class="description">${desc}</span></div>`;
    };
    
    // Catégories avec leurs logos et noms (utilise directement les emojis)
    const categories = [
        {
            logo: '🔘',
            name: 'États activés'
        },
        {
            logo: '📜',
            name: 'Config Événements'
        },
        {
            logo: '🌬',
            name: 'Atmosphère'
        },
        {
            logo: '💧',
            name: 'Cycle de l\'eau'
        },
        {
            logo: '🪞',
            name: 'Albédo'
        },
        {
            logo: '🧲',
            name: 'Flux radiatif'
        },
        {
            logo: '⏳',
            name: 'Convergence'
        },
        {
            logo: '☀️',
            name: 'Soleil'
        },
        {
            logo: '🌕',
            name: 'Noyau'
        },
        {
            logo: '📅',
            name: 'Date Époque'
        },
        {
            logo: '⚖️',
            name: 'Masses'
        }
    ];
    
    // Générer le HTML pour chaque catégorie
    const categoryHTMLs = categories.map(category => {
        if (!KEYS[category.logo]) return '';
        
        const items = Object.keys(KEYS[category.logo])
            .map(keyName => {
                const fullKey = KEYS[category.logo][keyName];
                const desc = DESC[category.logo] && DESC[category.logo][fullKey] ? DESC[category.logo][fullKey] : '';
                return createDicoEntry(fullKey, desc);
            })
            .join('');
        
        return `
            <h3 class="legend-title">${category.logo} ${category.name}</h3>
            ${items}
        `;
    });
    
    // Organiser en colonnes (répartir les 11 catégories en 5 colonnes)
    // Répartition équilibrée : 3, 2, 2, 2, 2 (total = 11)
    const col1 = categoryHTMLs.slice(0, 2).join('');
    const col2 = categoryHTMLs.slice(2, 4).join('');
    const col3 = categoryHTMLs.slice(4, 6).join('');
    const col4 = categoryHTMLs.slice(6, 8).join('');
    const col5 = categoryHTMLs.slice(8, 11).join('');
    
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
            <div class="legend-column">
                ${col5}
            </div>
        </div>
    `;
}

// ============================================================================
// EXPOSITION GLOBALE (uniquement DESC, DATA - KEYS n'est pas exporté)
// ============================================================================
if (typeof window !== 'undefined') {
    window.DESC = DESC;
    window.DATA = DATA;
    window.createDicoHtml = createDicoHtml;
    //window.createDico = createDicoHtml; // Alias pour compatibilité
}
