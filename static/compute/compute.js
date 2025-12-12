// ============================================================================
// File: static/compute/compute.js - Module de calcul de transfert radiatif
// Desc: En français, dans l'architecture, je suis le module principal de calcul de transfert radiatif
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: refactoring de calculations_flux.js avec nouvelle structure
// ============================================================================

// ============================================================================
// FONCTION HELPER : getLogo() et getLogoKey() sont maintenant dans alphabet.js
// On utilise window.getLogo et window.getLogoKey exposés par alphabet.js
// Accès direct (plantera si n'existe pas, comme demandé)

// ============================================================================
// VARIABLES GLOBALES D'ÉTAT
// ============================================================================

// T0 est dans DATA['⏳']['⏳🌡️🚩'], pas besoin de variable globale
// Phase est dans DATA['⏳']['⏳⚧'], pas besoin de variable globale
// signeDeltaFirst est dans DATA['⏳']['⏳☯'], pas besoin de variable globale
// flux_entrant est calculé localement dans computeRadiativeTransfer, pas besoin de variable globale

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

// Initialiser window.CONST s'il n'existe pas
if (typeof window !== 'undefined' && !window.CONST) {
    window.CONST = {};
}

// Ajouter les constantes physiques universelles à window.CONST
// CONST contient uniquement les constantes physiques universelles (ne varient pas avec les époques)
window.CONST.STEFAN_BOLTZMANN = 5.670374419e-8;  // W/(m²·K⁴) - constante de Stefan-Boltzmann
window.CONST.AU_M = 1.496e11;                     // m - 1 Unité Astronomique en mètres (constante universelle)
window.CONST.STANDARD_ATMOSPHERE_PA = 101325;     // Pa - Pression atmosphérique standard (1 atm = 101325 Pa)

// Constantes molaires (masse molaire en kg/mol) - propriétés intrinsèques des molécules
window.CONST.M_N2 = 0.02801;      // N₂ : 28.01 g/mol
window.CONST.M_O2 = 0.03200;      // O₂ : 32.00 g/mol
window.CONST.M_CO2 = 0.04401;     // CO₂ : 44.01 g/mol
window.CONST.M_CH4 = 0.01604;     // CH₄ : 16.04 g/mol
window.CONST.M_H2O = 0.01802;     // H₂O : 18.02 g/mol
window.CONST.M_AR = 0.03995;      // Ar : 39.95 g/mol
    window.CONST.molar_mass_air_ref = 0.029;  // Masse molaire moyenne de l'air de référence (kg/mol)
    // Constantes pour l'eau (H2O)
    window.CONST.R_GAS = 8.314;  // Constante des gaz parfaits, J/(mol·K)
    window.CONST.T_FREEZE = 273.15;  // Point de congélation de l'eau (K)
    window.CONST.T_BOIL = 373.15;  // Point d'ébullition de l'eau à 1 atm (K)
    window.CONST.T0_WATER = 273.15;  // Point triple de l'eau (K)
    window.CONST.P0_WATER = 611.2;  // Pression au point triple de l'eau (Pa)
    window.CONST.L_VAPORIZATION = 2.5e6;  // Chaleur latente de vaporisation (J/kg)
    window.CONST.RV_WATER = 461.5;  // Constante des gaz pour la vapeur d'eau (J/(kg·K))
    window.CONST.L_V = 40660;  // Chaleur latente de vaporisation (J/mol)

// Note: SOLAR_CONSTANT_REF, SOLAR_POWER_REF, EARTH_RADIUS_REF, EARTH_TOTAL_WATER_MASS_KG
// sont des valeurs de référence actuelles et devraient être dans la timeline (époque "Today")

//Récupère les états activés (utilise DATA directement)
function getEnabledStates() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    
    // Chercher tous les boutons ergonomiques (ergo-button-cell ou flux-button-cell)
    const allCells = Array.from(document.querySelectorAll('.ergo-button-cell, .flux-button-cell'));
    
    // Fonction helper pour trouver un bouton par son logo
    function findButtonByLogo(logo) {
        for (const cell of allCells) {
            const circle = cell.querySelector('.ergo-button-circle');
            if (circle && circle.textContent.includes(logo)) {
                return cell;
            }
        }
        return null;
    }
    
    const h2oCell = findButtonByLogo('💧');
    DATA['🔘']['🔘💧📛'] = h2oCell ? h2oCell.classList.contains('checked') : true;
    const ch4Cell = findButtonByLogo('⛽');
    DATA['🔘']['🔘⛽📛'] = ch4Cell ? ch4Cell.classList.contains('checked') : true;
    const co2Cell = findButtonByLogo('🏭');
    DATA['🔘']['🔘🏭📛'] = co2Cell ? co2Cell.classList.contains('checked') : true;
    const albedoCell = findButtonByLogo('🪞');
    DATA['🔘']['🔘🪞'] = albedoCell ? albedoCell.classList.contains('checked') : true;
    const animCell = findButtonByLogo('🎬');
    DATA['🔘']['🔘🎬'] = animCell ? animCell.classList.contains('checked') : true;
    
    // Retourner true car DATA a été modifié
    return true;
}

//Calcule les masses en tenant compte des événements (meteor, etc.) :: utilise DATA directement
function getMasses() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    //const CONST = window.CONST;
    
    // Récupérer l'époque directement depuis timeline avec l'index
    const EPOCH = window.timeline[window.currentEpochIndex];
    let h2o_kg = EPOCH['⚖️💧'] || 0;
    
    // Appliquer les événements
    const meteoriteCount = DATA['📜']['📿☄️'] || 0;
    const deltaWater = DATA['📜']['🔺⚖️💧☄️'] || 0;
    h2o_kg += deltaWater * meteoriteCount;
    
    // Mettre à jour DATA directement
    DATA['⚖️']['⚖️🏭'] = EPOCH['⚖️🏭'];
    DATA['⚖️']['⚖️⛽'] = EPOCH['⚖️⛽'];
    DATA['⚖️']['⚖️💧'] = h2o_kg;
    DATA['⚖️']['⚖️🌫'] = EPOCH['⚖️🌫'];
    DATA['⚖️']['⚖️📿'] = EPOCH['⚖️📿'];
    
    // Log getMasses - utiliser DATA directement
    console.log(`📋 [getMasses@compute.js]`);
    console.log(`masses=${JSON.stringify(DATA['⚖️'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

//Récupère la configuration de l'époque (utilise DATA directement)
function getEpochDateConfig() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.timeline[window.currentEpochIndex];
    
    let meteoriteCount = 0;
    let ticTime = 0;
    let deltaTicTime_per_tic = null;
    let water_added_kg = 0;
    // Calculer le nombre de météorites
    const h2oTotalFromMeteorites = window.h2oTotalFromMeteorites || 0;
    meteoriteCount = 0;
    water_added_kg = 0;
    if (EPOCH['🕰'] && EPOCH['🕰']['☄️']) {
        const mass_kg = EPOCH['🕰']['☄️']['🔺⚖️💧☄️'];
        const h2oPerMeteorite = (mass_kg / CONST.EARTH_TOTAL_WATER_MASS_KG) * 100;
        const h2oPerMeteoriteAdjusted = Math.max(h2oPerMeteorite * 10, 2.1);
        meteoriteCount = Math.floor(h2oTotalFromMeteorites / h2oPerMeteoriteAdjusted);
        water_added_kg = mass_kg;
    }
    
    ticTime = Math.floor(window.infoTimeMa / 50);
    
    // Vérifier si 💫 existe dans les événements (certaines époques n'ont pas de ticTime)
    if (EPOCH['🕰']['💫']) {
        // Accès direct (plantera si n'existe pas, comme demandé)
        deltaTicTime_per_tic = EPOCH['🕰']['💫']['🔺🌡️💫'];
        // Accès direct (plantera si n'existe pas, comme demandé)
        DATA['📜']['🔺🧲🌕💫'] = {
            '▶': EPOCH['🕰']['💫']['🔺🧲🌕💫']['▶'],
            '◀': EPOCH['🕰']['💫']['🔺🧲🌕💫']['◀']
        };
    } else {
        // Pas de ticTime pour cette époque
        deltaTicTime_per_tic = 0;
        DATA['📜']['🔺🧲🌕💫'] = { '▶': 0, '◀': 0 };
    }
    
    // Mettre à jour DATA directement (source unique de vérité)
    // 🌡️🏮 (old_T0) : garder la valeur précédente si elle existe, sinon utiliser T0 config
    if (!DATA['⏳']['🌡️🏮'] || DATA['⏳']['🌡️🏮'] <= 0) {
        DATA['⏳']['🌡️🏮'] = EPOCH['🌡️⏳'];
    }
    DATA['📜']['🌡️⏳'] = EPOCH['🌡️⏳'];
    DATA['📜']['📿☄️'] = meteoriteCount || 0;              // Nombre de météorites
    DATA['📜']['🔺⚖️💧☄️'] = water_added_kg || 0;               // Masse d'eau ajoutée / météorite
    DATA['📜']['📿💫'] = ticTime || 0;                     // Nombre de ticTime
    DATA['📜']['🔺🌡️💫'] = deltaTicTime_per_tic || 0;     // Delta température / ticTime
    
    // Calculer les masses avec getMasses() (met à jour DATA directement)
    getMasses();
    
    // Log getEpochDateConfig - utiliser DATA directement
    console.log(`💫🛠 [getEpochDateConfig@compute.js]`);
    console.log(`dateConfig=${JSON.stringify(DATA['📜'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

//Calcule les valeurs du soleil (utilise DATA directement)
function getSoleil() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.timeline[window.currentEpochIndex];
    
    // Mettre à jour DATA directement (source unique de vérité)
    DATA['☀️']['🔋☀️'] = EPOCH['🔋☀️'];
    
    // Calculer la constante solaire à 1 UA depuis la puissance totale
    // Relation: P = S * 4πr² où P est la puissance totale, S est la constante solaire, r = 1 UA = 1.496e11 m
    // Donc: S = P / (4π * (1 UA)²)
    DATA['☀️']['🧲☀️'] = DATA['☀️']['🔋☀️'] / (4 * Math.PI * CONST.AU_M * CONST.AU_M);
    
    // Flux solaire à 1 UA / 4 (moyenne sphérique, AVANT albedo)
    // 🎱 représente la géométrie (division par 4 pour la moyenne sphérique)
    DATA['☀️']['🧲☀️🎱'] = DATA['☀️']['🧲☀️'] / 4;
    
    console.log(`☀️ [getSoleil@compute.js]`);
    console.log(`soleil=${JSON.stringify(DATA['☀️'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

//Calcule les valeurs du noyau géothermique (utilise DATA directement)
function getNoyau() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    // Récupérer l'époque directement depuis timeline avec l'index
    const EPOCH = window.timeline[window.currentEpochIndex];
    
    // Flux géothermique en W/m² (depuis timeline)
    // Vérifier si 💫 existe dans les événements (certaines époques ont le flux directement)
    if (EPOCH['🕰']['💫'] && EPOCH['🕰']['💫']['🔺🧲🌕💫']) {
        // Flux depuis les événements ticTime
        DATA['🌕']['🧲🌕'] = EPOCH['🕰']['💫']['🔺🧲🌕💫']['▶'];
    } else if (EPOCH['🧲🌕'] !== undefined) {
        // Flux directement dans l'époque (ex: Hadéen)
        DATA['🌕']['🧲🌕'] = EPOCH['🧲🌕'];
    } else {
        // Pas de flux géothermique pour cette époque
        DATA['🌕']['🧲🌕'] = 0;
    }
    
    // Puissance totale du noyau (en Watts) - depuis 🔋🌕
    DATA['🌕']['🔋🌕'] = EPOCH['🔋🌕'];
    
    console.log(`🌕 [getNoyau@compute.js]`);
    console.log(`noyau=${JSON.stringify(DATA['🌕'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================
window.getEpochDateConfig = getEpochDateConfig;
window.getDateConfig = getEpochDateConfig; // Alias pour compatibilité
window.getMasses = getMasses; // Exposer getMasses
window.getEnabledStates = getEnabledStates; // Exposer getEnabledStates
window.getSoleil = getSoleil; // Exposer getSoleil
window.getNoyau = getNoyau; // Exposer getNoyau
// T0 est dans DATA['⏳']['⏳🌡️🚩'], pas besoin de window.T0
// getLogo et getLogoKey sont exposés par alphabet.js

