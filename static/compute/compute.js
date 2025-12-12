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
let Phase = "None";
let signeDeltaFirst = 0;
let flux_entrant = 238;

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

// Ajouter les constantes physiques à window.CONST (plantera si window.CONST n'existe pas)
window.CONST.STEFAN_BOLTZMANN = 5.670374419e-8;  // W/(m²·K⁴) - constante de Stefan-Boltzmann
window.CONST.SOLAR_CONSTANT_REF = 1361;          // W/m² - constante solaire à 1 UA
window.CONST.SOLAR_POWER_REF = 3.828e26;         // W - puissance totale du soleil
window.CONST.SOLAR_SURFACE_AREA = 6.09e18;       // m² - surface du soleil
window.CONST.EARTH_RADIUS_REF = 6371000;         // m - rayon terrestre de référence (utilisé comme base)
window.CONST.EARTH_TOTAL_WATER_MASS_KG = 1.4e21;  // kg - masse totale d'eau terrestre

// Fonction pour récupérer les états activés (utilise DATA directement, pas de paramètres)
// Retourne true si DATA a été modifié
function getEnabledStates() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    // Récupérer l'état anim depuis le DOM
    // Accès direct (plantera si n'existe pas, comme demandé)
    const animToggleCheckbox = document.getElementById('plot-anim-toggle-checkbox');
    const animState = animToggleCheckbox.checked;
    
    // Mettre à jour DATA directement (source unique de vérité)
    DATA['🔘']['🔘💧📛'] = window.isH2O_eds;
    DATA['🔘']['🔘⛽📛'] = window.isCH4_eds;
    DATA['🔘']['🔘🏭📛'] = window.isCO2_eds;
    DATA['🔘']['🔘🪞'] = window.isAlbedo;
    DATA['🔘']['🔘🎬'] = animState;
    
    // Retourner true car DATA a été modifié
    return true;
}

// ============================================================================
// FONCTION PRINCIPALE : getMasses()
// ============================================================================
// Calcule les masses en tenant compte des événements (meteor, etc.)
// Utilise DATA directement (pas de paramètres)
// Retourne true si DATA a été modifié
function getMasses() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    // Récupérer l'époque directement depuis timeline avec l'index
    const EPOCH = window.timeline[window.currentEpochIndex];
    let h2o_kg = EPOCH['🐳💧'];
    
    // Appliquer les événements
    const meteoriteCount = DATA['📜']['📿☄️'];
    const deltaWater = DATA['📜']['🔺🐳💧☄️'];
    h2o_kg += deltaWater * meteoriteCount;
    
    // Mettre à jour DATA directement
    DATA['🐳']['🐳🏭'] = EPOCH['🐳🏭'];
    DATA['🐳']['🐳⛽'] = EPOCH['🐳⛽'];
    DATA['🐳']['🐳💧'] = h2o_kg;
    DATA['🐳']['🐳🌫'] = EPOCH['🐳🌫'];
    DATA['🐳']['🐳📿'] = EPOCH['🐳📿'];
    
    // Log getMasses - utiliser DATA directement
    console.log(`📋 [getMasses@compute.js]`);
    console.log(`masses=${JSON.stringify(DATA['🐳'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

// ============================================================================
// FONCTION PRINCIPALE : getEpochDateConfig()
// ============================================================================
// Utilise DATA directement (pas de paramètres)
// Retourne true si DATA a été modifié
function getEpochDateConfig() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    const CHARS = window.CHARS;
    
    // Récupérer l'époque directement depuis timeline avec l'index
    const EPOCH = window.timeline[window.currentEpochIndex];
    
    let meteoriteCount = 0;
    let ticTime = 0;
    let deltaTicTime_per_tic = null;
    let water_added_kg = 0;
    // Calculer le nombre de météorites
    const h2oTotalFromMeteorites = window.h2oTotalFromMeteorites;
    // Accès direct à '🕰'['☄️'] (plantera si n'existe pas, comme demandé)
    const mass_kg = EPOCH['🕰']['☄️']['🔺🐳💧☄️'];
    const h2oPerMeteorite = (mass_kg / CONST.EARTH_TOTAL_WATER_MASS_KG) * 100;
    const h2oPerMeteoriteAdjusted = Math.max(h2oPerMeteorite * 10, 2.1);
    meteoriteCount = Math.floor(h2oTotalFromMeteorites / h2oPerMeteoriteAdjusted);
    water_added_kg = mass_kg;
    
    ticTime = Math.floor(window.infoTimeMa / 50);
    
    // Accès direct (plantera si n'existe pas, comme demandé)
    deltaTicTime_per_tic = EPOCH['🕰']['💫']['🔺🌡️💫'];
    
    // Mettre à jour DATA directement (source unique de vérité)
    DATA['⏳']['🌡️🏮'] = DATA['⏳']['⏳🌡️🚩'];
    DATA['📜']['🌡️⏳'] = EPOCH['🌡️⏳'];
    DATA['📜']['📿☄️'] = meteoriteCount;              // Nombre de météorites
    DATA['📜']['🔺🐳💧☄️'] = water_added_kg;               // Masse d'eau ajoutée / météorite
    DATA['📜']['📿💫'] = ticTime;                     // Nombre de ticTime
    DATA['📜']['🔺🌡️💫'] = deltaTicTime_per_tic;     // Delta température / ticTime
    // Accès direct (plantera si n'existe pas, comme demandé)
    DATA['📜']['🔺🧲🌕💫'] = {
        '▶': EPOCH['🕰']['💫']['🔺🧲🌕💫']['▶'],
        '◀': EPOCH['🕰']['💫']['🔺🧲🌕💫']['◀']
    };
    
    // Calculer les masses avec getMasses() (met à jour DATA directement)
    getMasses();
    
    // Log getEpochDateConfig - utiliser DATA directement
    console.log(`💫🛠 [getEpochDateConfig@compute.js]`);
    console.log(`dateConfig=${JSON.stringify(DATA['📜'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

// ============================================================================
// FONCTION : getSoleil() - Calculer les valeurs du soleil
// ============================================================================
// Utilise DATA directement (pas de paramètres)
// Retourne true si DATA a été modifié
function getSoleil() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    // Récupérer l'époque directement depuis timeline avec l'index
    const EPOCH = window.timeline[window.currentEpochIndex];
    
    // Mettre à jour DATA directement (source unique de vérité)
    DATA['☀️']['🔋☀️'] = EPOCH['🔋☀️'];
    
    // Calculer la constante solaire à 1 UA depuis la puissance totale
    // Relation: P = S * 4πr² où P est la puissance totale, S est la constante solaire, r = 1 UA = 1.496e11 m
    // Donc: S = P / (4π * (1 UA)²)
    const AU_M = 1.496e11; // 1 UA en mètres
    DATA['☀️']['🧲☀️'] = DATA['☀️']['🔋☀️'] / (4 * Math.PI * AU_M * AU_M);
    
    // Flux solaire à 1 UA / 4 (moyenne sphérique, AVANT albedo)
    // 🎱 représente la géométrie (division par 4 pour la moyenne sphérique)
    DATA['☀️']['🧲☀️🎱'] = DATA['☀️']['🧲☀️'] / 4;
    
    console.log(`☀️ [getSoleil@compute.js]`);
    console.log(`soleil=${JSON.stringify(DATA['☀️'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

// ============================================================================
// FONCTION : getNoyau() - Calculer les valeurs du noyau (géothermique)
// ============================================================================
// Utilise DATA directement (pas de paramètres)
// Retourne true si DATA a été modifié
function getNoyau() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    // Récupérer l'époque directement depuis timeline avec l'index
    const EPOCH = window.timeline[window.currentEpochIndex];
    
    // Flux géothermique en W/m² (depuis timeline)
    // Accès direct (plantera si n'existe pas, comme demandé)
    DATA['🌕']['🧲🌕'] = EPOCH['🕰']['💫']['🔺🧲🌕💫']['▶'];
    
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

