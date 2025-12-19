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
    '🔘': ['🔘💧📛', '🔘⛽📛', '🔘🏭📛', '🔘🪩', '🔘🎬'],
    // Configuration de date / Événements
    '📜': ['🌡️🧮', '📿☄️', '🔺⚖️💧☄️', '🔺🌡️💫', '🔺🧲🌕💫','🧲🔬'],
    // Date Époque
    '📅': ['🌡️🧮','📿💫'],
    // Masses
    '⚖️': ['⚖️💧', '⚖️🫧', '⚖️🏭', '⚖️⛽', '⚖️🌫', '⚖️💨'],
    // Composition atmosphérique
    '🫧': ['🎈', '🧪', '📏🫧🧿', '📏🫧🛩', '🍰🫧💧', '🍰🫧🏭', '🍰🫧⛽', '🍰🫧🌫', '🍰🫧💨', '☁️', '🍰🫧📿🌈', '🍰🫧🏭🌈', '🍰🫧💧🌈', '🍰🫧⛽🌈'],
    // Cycle de l'eau
    '💧': ['🍰💧🧊', '🍰💧🌊', '🍰🧮🌧'],
    // Albédo
    '🪩': ['🍰🪩📿', '🍰🪩🌋', '🍰🪩🏖', '🍰🪩🌳', '🍰🪩🌊', '🍰🪩🧊', '🍰🪩⛅', '🍰🪩🌍'],
    // Flux radiatif
    '🧲': ['🧲☀️🔽', '🧲🌕🔽', '🧲🌑🔼', '🧲🌈🔼', '🧲🪩🔼', '🔺🧲'],
    // Convergence
    '🧮': ['🧮🌡️', '🧮⚧', '🧮☯', '🧲🔬', '🔬🌈', '🔬🫧', '🧮🔄'],
    // Soleil
    '☀️': ['🧲☀️', '🧲☀️🎱', '🔋☀️'],
    // Noyau
    '🌕': ['🧲🌕', '🔋🌕'],
    // EDS (Forçage radiatif)
    '📛': ['📛💧', '📛🏭', '📛⛽', '📿📛'],
    // Géologie (Surfaces géologiques - Couche A)
    '🗻': ['🍰🗻🌊', '🍰🗻🏔', '🍰🗻🌍'],
    // Constantes physiques
    '💎': ['🎈┴💧', '🌡️┴💧']
};

// ============================================================================
// OBJET DESC (toutes les descriptions) - Structure hiérarchique (2 niveaux)
// Utilise directement les emojis
// ============================================================================
const DESC = {
    '🔘': {
        '🔘💧📛': 'H₂O EDS on/off',
        '🔘⛽📛': 'CH₄ EDS on/off',
        '🔘🏭📛': 'CO₂ EDS on/off',
        '🔘🪩': 'Albedo on/off',
        '🔘🎬': 'Animation on/off',
    },
    '📜': {
        '🌡️🧮': 't° attendu (t° config)',
        '📿☄️': 'Nombre de météore',
        '🔺⚖️💧☄️': 'Masse H₂O / météore',
        '🔺🌡️💫': 'Delta t° / ticTime',
        '🔺🧲🌕💫': 'Delta Geoth / ticTime',
        '🧲🔬': 'Précision Flux',
    },
    '📅': {
        '🌡️🧮': 't° attendue',
        '📿💫': 'Nombre de ticTime',
    },
    '🫧': {
        '🎈': '!Pression atmosphérique',
        '🧪': '!Masse molaire (kg/mol)',
        '📏🫧🧿': 'Ligne de Kármán',
        '📏🫧🛩': 'Tropopause',
        '🍰🫧❀': 'Prop.Rad.EDS<sub>❀∈{🏭, ⛽, 🌫, 💨}</sub>',
        '🍰🫧💧': 'Prop.Rad.EDS H₂O atm.',
        '🍰🫧🏭': '!CO₂',
        '🍰🫧⛽': '!CH₄',
        '🍰🫧🌫': '!O₂',
        '🍰🫧💨': '!N₂',
        '🍰🫧❀🌈': 'Cap.Rad.IR<sub>❀∈{🏭, ⛽, 💧}</sub>',
        '🍰🫧📿🌈': 'Σ(🍰🫧❀🌈)<sub>❀∈{🏭,⛽,💧}</sub>',
        '🍰🫧🏭🌈': '!Capacité radiative IR de CO₂',
        '🍰🫧💧🌈': 'Cap.Rad.IR H₂O atm.',
        '🍰🫧⛽🌈': '!Capacité radiative IR de CH₄',
        '☁️': '!Index formation nuageuse [0,1]',
    },
    '⚖️': {
        '⚖️❀': 'Masse<sub>❀∈{🏭, ⛽, 🌫, 💨}</sub>',
        '⚖️💧': 'Masse H₂O totale',
        '⚖️🫧': 'Masse atmosphère sec',
        '⚖️🏭': '!Masse CO₂',
        '⚖️⛽': '!Masse CH₄',
        '⚖️🌫': '!Masse O₂',
        '⚖️💨': '!Masse N₂',
    },
    '💧': {
        '🍰💧🧊': 'Glace',
        '🍰💧🌊': 'Océan',
        '🍰🧮🌧': 'Fraction de vapeur max',
    },
    '🪩': {
        '🍰🪩📿': 'Albedo total',
        '🍰🪩🌋': 'Volcan',
        '🍰🪩🏖': 'Désert',
        '🍰🪩🌳': 'Forêt',
        '🍰🪩🌊': 'Océan',
        '🍰🪩🧊': 'Glace',
        '🍰🪩⛅': 'Nuages',
        '🍰🪩🌍': 'Continents',
    },
    '🧲': {
        '🧲☀️🔽': 'Flux solaire absorbé',
        '🧲🌕🔽': 'Flux géothermique',
        '🧲🌑🔼': 'Flux sortant (σT⁴)',
        '🧲🌈🔼': 'Courbe spectrale',
        '🧲🪩🔼': 'Flux réfléchi',
        '🔺🧲': 'Delta flux',
    },
    '🧮': {
        '🧮🌡️': 'Temp. (t° courante)',
        '🧮⚧': 'Phase (Init/Search/Dicho)',
        '🧮☯': 'Direction (+/-)',
        '🧲🔬': '!Précision en Flux',
        '🔬🌈': 'Résolution spectrale (🔺λ)',
        '🔬🫧': 'Résolution atm. (🔺z)',
        '🧮🔄': 'Complexité O(🔬🌈×🔬🫧)',
    },
    '☀️': {
        '🧲☀️': 'Flux solaire à 1 UA',
        '🧲☀️🎱': 'Flux moyen sphérique',
        '🔋☀️': 'Puissance totale du soleil',
    },
    '🌕': {
        '🧲🌕': 'Flux géothermique',
        '🔋🌕': 'Puissance du noyau',
    },
    '📛': {
        '📛💧': 'Forçage radiatif H2O',
        '📛🏭': 'Forçage radiatif CO2',
        '📛⛽': 'Forçage radiatif CH4',
        '📿📛': 'Forçage radiatif total (EDS)',
    },
    '🗻': {
        '🍰🗻🌊': 'Surface océanique potentielle (bassin océanique, géologie)',
        '🍰🗻🏔': 'Surface hautes terres (zones de glace potentielles, géologie)',
        '🍰🗻🌍': 'Surface terres basses (zones de forêts/continents, géologie)',
    }
};

// ============================================================================
// OBJET FORM (formules de calcul) - Structure hiérarchique (2 niveaux)
// ============================================================================
const FORM = {
    '🧲': {
        '🧲☀️🔽': '🧲☀️🎱 × (1 - 🍰🪩📿) = Flux solaire absorbé',
        '🧲🌕🔽': 'Flux géothermique (constant)',
        '🧲🌑🔼': 'σ × T⁴ = Flux émis par la surface (corps noir théorique à température T). Formule: 🧲🌑🔼 = σT⁴ où σ = 5.670374419e-8 W/(m²·K⁴). Pour T=303.5K: ≈501 W/m². ⚠️ Ce n\'est PAS le flux qui sort au sommet (c\'est 🧲🌈🔼). ⚠️ Ne pas comparer directement à 🧲☀️🔽+🧲🌕🔽 car l\'effet de serre fait que la surface émet plus que ce qui sort.',
        '🧲🌈🔼': 'Σ[λ=0.1→100μm] I_λ(z_max) × Δλ = Aire sous courbe spectrale réelle (émission au sommet atmosphère, après transfert radiatif couche par couche avec concentrations atmosphériques). Calculé via transfert radiatif spectral: pour chaque couche z et chaque λ, calcul de l\'épaisseur optique τ_λ(z) avec concentrations CO₂, CH₄, H₂O, O₂, N₂, puis transmission exp(-τ) et émission (1-exp(-τ))×π×B_λ(T). Intégration finale au sommet: 🧲🌈🔼 = Σ[λ] upward_flux[z_max][λ] × Δλ. En équilibre: 🧲🌈🔼 ≈ 🧲☀️🔽+🧲🌕🔽',
        '🧲🪩🔼': '🧲☀️🎱 - 🧲☀️🔽 = 🧲☀️🎱 × 🍰🪩📿 = Flux réfléchi par albedo',
        '🔺🧲': '🧲☀️🔽 + 🧲🌕🔽 - 🧲🌈🔼 = Delta équilibre radiatif (flux entrant - flux sortant). En équilibre: 🔺🧲 ≈ 0',
        '_explication_equilibre': 'Corps noir (70% soleil): 🧲☀️🔽 devrait être ~238 W/m² (pas 341.50) → équilibre à T≈255K',
        '_temperature_equilibre_corps_noir': 'T_équilibre = (S/4σ)^(1/4) = (952/4σ)^(1/4) ≈ 255K (-18°C) pour corps noir pur (S=70% actuel)',
        '_bug_flux_solaire': 'BUG: Si 🧲☀️🔽=341.50 W/m² au lieu de 238 W/m² → code utilise soleil actuel (100%) au lieu de 70%',
        '_effet_serre': 'Avec EDS: surface émet plus (T_surface > T_effective) mais atmosphère bloque → 🧲🌈🔼 < 🧲🌑🔼',
        '_evolution_soleil': 'Soleil jeune (4.5 Ga): 🔋☀️ = 70% actuel (2.68e26 W vs 3.83e26 W) - Faint Young Sun Paradox',
        '_faint_young_sun': 'Paradoxe: Soleil 30% moins lumineux mais Terre pas gelée → EDS plus fort (CO₂, CH₄) compensait',
        '_flux_entrant': '🧲☀️🔽 + 🧲🌕🔽 = Flux entrant total',
        '_formule_planck': 'B_λ(T) = (2hc²/λ⁵) / (exp(hc/λkT) - 1)',
        '_formule_stefan': 'F = σT⁴ ≈ 239.7 W/m² pour T=255K (intégration complète 0→∞)',
        '_note_spectrale': 'Calcul spectral: intégration sur λ ∈ [0.1μm, 100μm] avec Δλ=0.1μm'
    },
    '🧮': {
        '🧮🌡️': 'T° courante (K)',
        '🧮⚧': 'Phase (Init/Search/Dicho)',
        '🧮☯': 'Direction Search (+/-)',
        '🧲🔬': '!Précision en Flux',
        '🔬🌈': 'Résolution spectrale',
        '🔬🫧': 'Résolution atmosphérique',
        '🧮🔄': 'Complexité O(🔬🌈×🔬🫧)',
        '🧮🌡️🚩': 'T° initiale (T0)'
    },
    '☀️': {
        '🧲☀️': '🔋☀️ / (4π × (1 UA)²) = Flux solaire à 1 UA (W/m²)',
        '🧲☀️🎱': '🧲☀️ / 4 (Surf.Éclairée/Surf.Tot = πR²/4πR² = 1/4)',
        '🔋☀️': 'Puissance totale du soleil (W)'
    },
    '🌕': {
        '🧲🌕': '🔋🌕 / (4π × R²) = Flux géothermique (W/m²), où R = rayon planète (m). Actuellement simplifié : ne tient pas compte de la couverture océanique, température de l\'eau, profondeurs, niveau de la mer. TODO: Affiner avec calculs géologiques (calculations_geology.js ou nouveau fichier)',
        '🔋🌕': 'Puissance totale du noyau (W)'
    },
    '🫧': {
        '🎈': '!Pression atmosphérique',
        '🧪': '!Masse molaire (kg/mol)',
        '📏🫧🧿': 'Ligne de Kármán',
        '📏🫧🛩': 'Tropopause',
        '🍰🫧❀': 'Proportion radiative EDS - ∀ ❀ ∈ {🏭, ⛽, 🌫, 💨}',
        '🍰🫧💧': 'Proportion radiative EDS de H₂O dans l\'atmosphère',
        '🍰🫧❀🌈': 'Capacité radiative IR de ❀ - ∀ ❀ ∈ {🏭, ⛽, 💧}',
        '🍰🫧📿🌈': 'Σ(🍰🫧❀🌈) - ∀ ❀ ∈ {🏭, ⛽, 💧} (pour normalisation)',
        '☁️': 'clamp(🍰🫧💧🌈 × 🍰🧮🌧 × (📏🫧🛩 / 📏🫧🧿), 0, 1) - Potentiel de condensation nuageuse'
    },
    '💧': {
        '🍰💧🧊': 'Si T < ❄️ alors toute l\'eau restante (après vapeur) est glace, sinon glace polaire (10% à 0°C → 0% à 20°C) - ❄️ = 271.15K - (P-1)×1.0',
        '🍰💧🌊': 'Océan',
        '🍰🧮🌧': '🎈🌧 / 🎈<br>🎈🌧 = 🎈┴💧 × exp(L_v/R_v × (1/🌡️┴💧 - 1/🧮🌡️)) [Clausius-Clapeyron]<br>🎈┴💧 = 611.2 Pa, 🌡️┴💧 = 273.15 K,<br>L_v = 2.5e6 J/kg (chaleur latente vaporisation H2O), R_v = 461.5 J/(kg·K) = R/M_H2O, 🧮🌡️ = température actuelle'
    },
    '🪩': {
        '🍰🪩📿': 'Σ(🍰🪩❀ × 🪩🍰❀) pour ❀ ∈ {🌋,🌊,🌳,🌍,🏖,🧊} + contribution_glace + contribution_nuages',
        '🍰🪩🌋': 'volcano_coverage = f(T, flux_geo) : Hadéen=1.0, sinon min(1.0, flux_geo/10000)',
        '🍰🪩🌊': 'ocean_coverage = (ocean_volume_m3 / (📏🌊 × 1000)) × 🐚 / (4π × 📐²) où ocean_volume_m3 = (⚖️💧 × 🍰💧🌊) / 1000',
        '🍰🪩🌳': 'forest_coverage = L × clamp((H - 0.5) / 0.7, 0, 1) où H = indice d\'humidité climatique, L = terre libre de glace. Forêts apparaissent si H > 0.5',
        '🍰🪩🏖': 'desert_coverage = L × clamp((0.6 - H) / 0.6, 0, 1) où H = indice d\'humidité climatique. Déserts apparaissent si H < 0.6 (zones arides, albedo ~0.30)',
        '🍰🪩🌍': 'land_coverage = L - 🍰🪩🌳 - 🍰🪩🏖 où L = terre libre de glace. Absorbe automatiquement : steppes, prairies, toundras, montagnes (albedo ~0.18)',
        '🍰🪩🧊': 'ice_coverage = min(0.9, 🍰💧🧊 × 0.9)',
        '🍰🪩⛅': 'cloud_coverage = C_max × η_cloud × ☁️ où C_max = 0.65 (plafond physique), η_cloud = 0.40 (efficacité optique), ☁️ = CloudFormationIndex. Fraction optique moyenne vue par le Soleil, pas proportion de surface au sol.',
        '_contribution_glace': 'contribution_glace = (🪩🍰🧊 - albedo_base) × 🍰💧🧊 × 0.5',
        '_contribution_nuages': 'contribution_nuages = albedo × (1 - 🍰🪩⛅) + 🪩🍰⛅ × 🍰🪩⛅'
    },
    '🗻': {
        '🍰🗻🌊': 'Surface océanique potentielle (bassin océanique, géologie)',
        '🍰🗻🏔': 'Surface hautes terres (zones de glace potentielles, géologie)',
        '🍰🗻🌍': 'Surface terres basses (zones de forêts/continents, géologie)'
    },
    '💎': {
        '🎈┴💧': 'Pression au point triple de l\'eau (611.2 Pa)',
        '🌡️┴💧': 'Température au point triple de l\'eau (273.15 K, 0°C)'
    },
    '🗻': {
        '🍰🗻🌊': 'Surface océanique potentielle (bassin océanique) = f(époque) : Hadéen=1.0, Archéen=0.80, Moderne=0.71',
        '🍰🗻🏔': 'Surface hautes terres (zones de glace potentielles) = f(époque) : Hadéen=0.0, Archéen=0.05, Moderne=0.09',
        '🍰🗻🌍': 'Surface terres basses (zones de forêts/continents) = f(époque) : Hadéen=0.0, Archéen=0.15, Moderne=0.20',
        '_note': '🗻 = Géologie (Couche A) : surfaces fixes déterminées par la géologie/relief, indépendantes des stocks d\'eau'
    },
    '⚖️': {
        '⚖️❀': 'Masse ❀ - ∀ ❀ ∈ {🏭, ⛽, 🌫, 💨}',
        '⚖️💧': 'Masse H2O totale',
        '⚖️🫧': 'Masse atmosphère sec = ⚖️🏭 + ⚖️⛽ + ⚖️🌫 + ⚖️💨 (sans vapeur d\'eau)'
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
            logo: '🔘',
            name: 'États activés'
        },
        {
            logo: '📜',
            name: 'Config Événements'
        },
        {
            logo: '📅',
            name: 'Date Époque'
        },
        {
            logo: '🫧',
            name: 'Atmosphère'
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
            logo: '⚖️',
            name: 'Masses'
        },
        {
            logo: '🪩',
            name: 'Albédo'
        },
        {
            logo: '💧',
            name: 'Cycle de l\'eau'
        },
        {
            logo: '🧮',
            name: 'Convergence'
        },
        {
            logo: '🧲',
            name: 'Flux radiatif'
        }
    ];
    
    // Générer le HTML pour chaque catégorie
    const categoryHTMLs = categories.map(category => {
        // 🔒 CORRECTION : Parcourir DESC directement, pas seulement KEYS
        // Cela permet d'afficher les clés mathématiques (avec ❀) qui sont dans DESC mais pas dans KEYS
        if (!DESC[category.logo]) return '';
        
        // Récupérer toutes les clés depuis DESC (source de vérité pour l'affichage)
        const descKeys = Object.keys(DESC[category.logo]);
        
        const items = descKeys
            .map(fullKey => {
                const desc = DESC[category.logo][fullKey];
                // Ignorer les variables dont la description commence par "!" (variables internes aux calculs)
                if (!desc || desc.startsWith('!')) return '';
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
    const col3 = categoryHTMLs.slice(4, 7).join('');
    const col4 = categoryHTMLs.slice(7, 9).join('');
    const col5 = categoryHTMLs.slice(9, 11).join('');
    
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
    window.FORM = FORM;
    window.createDicoHtml = createDicoHtml;
    //window.createDico = createDicoHtml; // Alias pour compatibilité
}
