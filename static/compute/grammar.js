// File: static/compute/grammar.js - Grammaire des logos et construction des clés
// Desc: Centralise les règles de construction des clés d'objets JSON avec logos
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [January 2025]
// Logs:
//   - Initial version: extraction depuis compute.js et configOrganigramme.js

// ============================================================================
// DÉFINITION DES LOGOS
// ============================================================================
// ⚠️ IMPORTANT : Les logos sont définis dans organigramme/configOrganigramme.js
// Fichier : organigramme/configOrganigramme.js
// Objet : const LOGOS = { ... } (lignes 17-72)
// Exposition globale : window.LOGOS (ligne 84)
// 
// Pour modifier un logo, éditer configOrganigramme.js :
//   Exemple : BOOLEAN: '🔘'  => changer '🔘' par un autre emoji
// Toutes les clés construites avec getLogoKey() seront automatiquement mises à jour.

// ============================================================================
// FONCTIONS HELPER POUR CONSTRUCTION DES CLÉS
// ============================================================================

// FONCTION HELPER : getLogo(name)
// Récupère un logo depuis window.LOGOS
// window.LOGOS est défini dans organigramme/configOrganigramme.js
function getLogo(name) {
    if (typeof window === 'undefined' || !window.LOGOS) {
        console.error('[grammar.js] window.LOGOS non défini');
        return '';
    }
    return window.LOGOS[name] || '';
}

// FONCTION HELPER : getLogoKey(...)
// Construit une clé composite à partir de plusieurs logos
// Exemple: getLogoKey('BOOLEAN', 'ANIMATION') => '🔘🎬'
// Exemple: getLogoKey('BOOLEAN', 'H2O', 'EDS') => '🔘💧📛'
function getLogoKey(...names) {
    if (typeof window === 'undefined' || !window.LOGOS) {
        console.error('[grammar.js] window.LOGOS non défini');
        return '';
    }
    return names.map(name => window.LOGOS[name] || '').join('');
}

// ============================================================================
// CONSTANTES DE CLÉS PRÉDÉFINIES (pour éviter les répétitions)
// ============================================================================

// Clés pour enabledStates
const ENABLED_STATES_KEYS = {
    H2O_EDS: () => getLogoKey('BOOLEAN', 'H2O', 'EDS'),
    CH4_EDS: () => getLogoKey('BOOLEAN', 'CH4', 'EDS'),
    CO2_EDS: () => getLogoKey('BOOLEAN', 'CO2', 'EDS'),
    ALBEDO: () => getLogoKey('BOOLEAN', 'ALBEDO'),
    ANIMATION: () => getLogoKey('BOOLEAN', 'ANIMATION')
};

// Clés pour dateConfig
const DATE_CONFIG_KEYS = {
    OLD_T0: () => getLogoKey('TEMP', 'OLD_T0'),
    T0_CONFIG: () => getLogoKey('TEMP', 'COMPUTE', 'CONFIG'),
    ANIMATION: () => getLogoKey('BOOLEAN', 'ANIMATION'),
    METEORITE_COUNT: () => getLogoKey('CARDINAL', 'METEORITE_COUNT', 'CONFIG'),
    DELTA_TEMP_METEORITE: () => getLogoKey('DELTA', 'TEMP', 'METEORITE_COUNT', 'CONFIG'),
    DELTA_WATER_METEORITE: () => getLogoKey('DELTA', 'WEIGHT', 'H2O', 'METEORITE_COUNT', 'CONFIG'),
    TIC_TIME_COUNT: () => getLogoKey('CARDINAL', 'TIC_TIME', 'CONFIG'),
    DELTA_TEMP_TIC_TIME: () => getLogoKey('DELTA', 'TEMP', 'TIC_TIME', 'CONFIG'),
    DELTA_FLUX_GEOTHERMAL_TIC_TIME: () => getLogoKey('DELTA', 'ENERGY_FLUX', 'GEOTHERMAL_FLUX', 'TIC_TIME', 'CONFIG')
};

// Clés pour masses
const MASSES_KEYS = {
    CO2: () => getLogoKey('WEIGHT', 'CO2'),
    CH4: () => getLogoKey('WEIGHT', 'CH4'),
    H2O: () => getLogoKey('WEIGHT', 'H2O'),
    O2: () => getLogoKey('WEIGHT', 'O2'),
    TOTAL: () => getLogoKey('WEIGHT', 'CARDINAL')
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
    'SIGNE_DELTA_FIRST': 'signeDeltaFirst (+/-)',
    'OLD_T0': 'old_T0 (backup T°)',
    'T0': 'T0 (T° initiale)',
    'ALBEDO': 'Albédo',
    'GEOTHERMAL_FLUX': 'Flux géothermique',
    'EDS': 'EDS (Forçage radiatif)',
    // Événements
    'CONFIG': 'Config',
    'TIC_TIME': 'TicTime',
    'METEORITE_COUNT': 'Météorite de glace',
    'MAX_VAPOR': 'Max vapor fraction',
    'BIG_IMPACT': 'Big impact',
    'FLUX_START': 'Flux start (valeur de départ)',
    'FLUX_END': 'Flux end (valeur de fin)',
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
    'COMPUTE_SIGNE_DELTA_FIRST': 'signeDeltaFirst',
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
// FONCTION : GÉNÉRER LA LÉGENDE
// ============================================================================

// Fonction pour générer la légende dynamiquement (4 colonnes avec titres)
function generateLegend() {
    if (typeof window === 'undefined' || !window.LOGOS) {
        console.error('[generateLegend] window.LOGOS non défini');
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
        'COMPUTE', 'ANIMATION', 'PHASE', 'TOLERANCE', 'SIGNE_DELTA_FIRST', 'OLD_T0', 'T0', 'ALBEDO', 'GEOTHERMAL_FLUX', 'EDS', 'GEOMETRY_ORIGIN'
    ];
    
    // Colonne 4 : Événements
    const logosCol4 = [
        'CONFIG', 'TIC_TIME', 'METEORITE_COUNT', 'MAX_VAPOR', 'BIG_IMPACT', 'FLUX_START', 'FLUX_END', 'ALTITUDE', 'TROPOPAUSE'
    ];
    
    // Fonction helper pour créer une div avec logo et description
    const createLogoDiv = (logoName) => {
        const logo = getLogo(logoName);
        const description = LOGO_DESCRIPTIONS[logoName] || logoName;
        
        // Si le logo est vide, ne rien afficher plutôt que le nom
        if (!logo || logo === '') {
            return '';
        }
        
        // Format: <div><span style="font-size: 15px">emoji</span> <span style="font-size: 12px">description</span></div>
        return `<div><span style="font-size: 15px;">${logo}</span> <span style="font-size: 12px;">${description}</span></div>`;
    };
    
    // Filtrer les divs vides avant de les joindre
    const col1_filtered = logosCol1.map(createLogoDiv).filter(div => div !== '').join('');
    const col2_filtered = logosCol2.map(createLogoDiv).filter(div => div !== '').join('');
    const col3_filtered = logosCol3.map(createLogoDiv).filter(div => div !== '').join('');
    const col4_filtered = logosCol4.map(createLogoDiv).filter(div => div !== '').join('');
    
    console.log('[generateLegend] Colonnes générées:', {
        col1: col1_filtered.split('</div>').length - 1,
        col2: col2_filtered.split('</div>').length - 1,
        col3: col3_filtered.split('</div>').length - 1,
        col4: col4_filtered.split('</div>').length - 1
    });
    
    return `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <h3 style="color: #4a9eff; font-size: 14px; margin-bottom: 5px; font-weight: bold;">Unités</h3>
                ${col1_filtered}
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <h3 style="color: #4a9eff; font-size: 14px; margin-bottom: 5px; font-weight: bold;">Éléments</h3>
                ${col2_filtered}
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <h3 style="color: #4a9eff; font-size: 14px; margin-bottom: 5px; font-weight: bold;">Calculs</h3>
                ${col3_filtered}
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <h3 style="color: #4a9eff; font-size: 14px; margin-bottom: 5px; font-weight: bold;">Événements</h3>
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
    window.generateLegend = generateLegend;
}

