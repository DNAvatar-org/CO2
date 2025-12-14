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
    '🔘': ['🔘💧📛', '🔘⛽📛', '🔘🏭📛', '🔘🪞', '🔘🎬'],
    // Configuration de date / Événements
    '📜': ['🌡️⏳', '📿☄️', '🔺⚖️💧☄️', '🔺🌡️💫', '🔺🧲🌕💫','🧲🔬', '👉', '🗿'],
    // Date Époque
    '📅': ['🌡️⏳','📿💫'],
    // Masses
    '⚖️': ['⚖️🏭', '⚖️⛽', '⚖️💧', '⚖️🌫', '⚖️📿', '⚖️🌬'],
    // Composition atmosphérique
    '🌬': ['🎈', '🧪', '📏🌬🧿', '📏🌬🛩', '🍰🌬🏭', '🍰🌬💧', '🍰🌬⛽', '🍰🌬🌫', '🍰🌬💨'],
    // Cycle de l'eau
    '💧': ['🍰💧🧊', '🍰💧⛅', '🍰💧🌊', '🍰⏳🌧'],
    // Albédo
    '🪞': ['🍰🪞📿', '🍰🪞🌋', '🍰🪞🏖', '🍰🪞🌳', '🍰🪞🌊', '🍰🪞🧊', '🍰🪞⛅'],
    // Flux radiatif
    '🧲': ['🧲☀️🔽', '🧲🌕🔽', '🧲🌑🔼', '🧲🌈🔼', '🧲🪞🔼', '🔺🧲'],
    // Convergence
    '⏳': ['🌡️', '⏳⚧', '⏳☯', '🧲🔬', '🔬🌈', '🔬🌬', '⏳🔄'],
    // Soleil
    '☀️': ['🧲☀️', '🧲☀️🎱', '🔋☀️'],
    // Noyau
    '🌕': ['🧲🌕', '🔋🌕'],
    // EDS (Forçage radiatif)
    '📛': ['📛💧', '📛🏭', '📛⛽', '📿📛']
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
        '🌡️⏳': 'T0 attendu (t° config)',
        '📿☄️': 'Nombre de météore',
        '🔺⚖️💧☄️': 'Masse d\'eau / météore',
        '🔺🌡️💫': 'Delta t° / ticTime',
        '🔺🧲🌕💫': 'Delta Geoth / ticTime',
        '🧲🔬': 'Précision Flux',
        '👉': 'Index',
        '🗿': 'Logo',
    },
    '📅': {
        '🌡️⏳': 'T° attendue',
        '📿💫': 'Nombre de ticTime',
    },
    '🌬': {
        '🎈': 'Pression atmosphérique',
        '🧪': 'Masse molaire air',
        '📏🌬🧿': 'Ligne de Kármán',
        '📏🌬🛩': 'Tropopause',
        '🍰🌬🏭': 'CO2',
        '🍰🌬💧': 'H2O',
        '🍰🌬⛽': 'CH4',
        '🍰🌬🌫': 'O2',
        '🍰🌬💨': 'N2',
    },
    '⚖️': {
        '⚖️🏭': 'Masse CO2',
        '⚖️⛽': 'Masse CH4',
        '⚖️💧': 'Masse H2O',
        '⚖️🌫': 'Masse O2',
        '⚖️📿': 'Masse Atm.',
        '⚖️🌬': 'Masse atmosphère',
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
        '🌡️': 'T0 (t° courante)',
        '⏳⚧': 'Phase (Init/Search/Dicho)',
        '⏳☯': 'Direction (+/-)',
        '🧲🔬': '!Précision en Flux',
        '🔬🌈': 'Résolution spectrale',
        '🔬🌬': 'Résolution atmosphérique',
        '⏳🔄': 'Nombre d\'itérations (O(🔬🌈*🔬🌬))',
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
    '📛': {
        '📛💧': 'Forçage radiatif H2O',
        '📛🏭': 'Forçage radiatif CO2',
        '📛⛽': 'Forçage radiatif CH4',
        '📿📛': 'Forçage radiatif total (EDS)',
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
    
    // KEYS peut être un tableau ou un objet
    const keysArray = Array.isArray(category) ? category : Object.values(category);
    
    for (const fullKey of keysArray) {
        // Déterminer le type par défaut selon l'emoji
        if (fullKey.startsWith('🔘')) {
            DATA[categoryKey][fullKey] = false;  // Booléens (états activés)
        } else if (fullKey.includes('⚧')) {
            DATA[categoryKey][fullKey] = '';  // String (phase)
        } else if (fullKey.includes('☯')) {
            DATA[categoryKey][fullKey] = 0;  // Number (signe/direction)
        } else if (fullKey.includes('🔺🧲🌕💫')) {
            DATA[categoryKey][fullKey] = null;  // Object (delta flux géothermique ticTime)
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
            logo: '📜',
            name: 'Config Événements'
        },
        {
            logo: '📅',
            name: 'Date Époque'
        },
        {
            logo: '🔘',
            name: 'États activés'
        },
        {
            logo: '⚖️',
            name: 'Masses'
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
        }
    ];
    
    // Générer le HTML pour chaque catégorie
    const categoryHTMLs = categories.map(category => {
        if (!KEYS[category.logo]) return '';
        
        // KEYS peut être un tableau ou un objet
        const keysArray = Array.isArray(KEYS[category.logo]) 
            ? KEYS[category.logo] 
            : Object.values(KEYS[category.logo]);
        
        const items = keysArray
            .map(fullKey => {
                const desc = DESC[category.logo] && DESC[category.logo][fullKey] ? DESC[category.logo][fullKey] : '';
                // Ignorer les variables dont la description commence par "!" (variables internes aux calculs)
                if (desc.startsWith('!')) return '';
                return createDicoEntry(fullKey, desc);
            })
            .filter(item => item !== '') // Retirer les entrées vides
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
