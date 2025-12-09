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
// Si alphabet.js n'est pas chargé, on définit des fallbacks
if (typeof window === 'undefined' || !window.getLogo) {
    function getLogo(name) {
        return window.LOGOS ? (window.LOGOS[name] || '') : '';
    }
    window.getLogo = getLogo;
}

if (typeof window === 'undefined' || !window.getLogoKey) {
    function getLogoKey(...names) {
        return window.LOGOS ? names.map(name => window.LOGOS[name] || '').join('') : '';
    }
    window.getLogoKey = getLogoKey;
}

// ============================================================================
// VARIABLES GLOBALES D'ÉTAT
// ============================================================================

let T0 = 180.0;  // old_T0 n'existe plus, utilise dateConfig['🌡️🏮'] qui vient de window.T0
let Phase = "None";
let signeDeltaFirst = 0;
let flux_entrant = 238;

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

// Initialiser window.ALL_DATA et window.ALL_DESC si nécessaire
if (typeof window !== 'undefined' && !window.ALL_DATA) {
    window.ALL_DATA = {};
    // Initialiser ALL.CONSTANTS pour les constantes physiques
    // ⚠️ EARTH_SURFACE_AREA n'est PAS une constante, il dépend de epoch.planet_radius !
    window.ALL_DATA.CONSTANTS = {
        STEFAN_BOLTZMANN: 5.670374419e-8,  // W/(m²·K⁴) - constante de Stefan-Boltzmann
        SOLAR_CONSTANT_REF: 1361,          // W/m² - constante solaire à 1 UA
        SOLAR_POWER_REF: 3.828e26,         // W - puissance totale du soleil
        SOLAR_SURFACE_AREA: 6.09e18,       // m² - surface du soleil
        EARTH_RADIUS_REF: 6371000,         // m - rayon terrestre de référence (utilisé comme base)
        EARTH_TOTAL_WATER_MASS_KG: 1.4e21  // kg - masse totale d'eau terrestre
    };
    // Initialiser ALL.EPOCH (remplace window.epoch)
    window.ALL_DATA.EPOCH = null;
}

// Initialiser window.ALL_DESC pour les descriptions (même architecture que ALL_DATA)
if (typeof window !== 'undefined' && !window.ALL_DESC) {
    window.ALL_DESC = {};
}

// Fonction pour récupérer les états activés (remplace isH2O_eds, isCO2_eds, etc.)
// Retourne window.ALL_DATA avec des logos comme clés : {'💧📛':true, '⛽📛':true, '🏭📛':true, '🪞':true, '🎞':false}
// Les anciennes variables window.isH2O_eds, window.isCO2_eds, etc. sont encore utilisées pour la compatibilité
// mais window.ALL_DATA est la source unique de vérité pour toutes les valeurs
function getEnabledStates() {
    // Wrappers pour éviter window abusifs
    const ALL_DATA = window.ALL_DATA;
    const ALL_DESC = window.ALL_DESC;
    const ENABLED_STATES = ALL_DATA.ENABLED_STATES;
    
    // Récupérer l'état anim depuis le DOM
    let animState = false;
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Le bouton "anim" peut être "plot-anim-toggle" (principal) ou "anim-toggle" (test)
        // Vérifier d'abord le checkbox caché (pour compatibilité avec main.js)
        const animToggleCheckbox = document.getElementById('plot-anim-toggle-checkbox');
        if (animToggleCheckbox) {
            animState = animToggleCheckbox.checked;
        } else {
            // Sinon, vérifier le bouton avec classe "selected" (nouveau système)
            const animButtonPlot = document.getElementById('plot-anim-toggle');
            if (animButtonPlot && animButtonPlot.classList.contains('selected')) {
                animState = true;
            } else {
                const animButtonTest = document.getElementById('anim-toggle');
                if (animButtonTest && animButtonTest.classList.contains('selected')) {
                    animState = true;
                }
            }
        }
    }
    
    // Selon grammar.txt : enabledStates={'🔘💧📛':true, '🔘⛽📛':true, '🔘🏭📛':true, '🔘🪞':true, '🔘🎬':false}
    // Mettre à jour ALL_DATA directement (source unique de vérité)
    ALL_DATA.ENABLED_STATES.H2O_EDS = window.isH2O_eds !== undefined ? window.isH2O_eds : true;
    ALL_DATA.ENABLED_STATES.CH4_EDS = window.isCH4_eds !== undefined ? window.isCH4_eds : true;
    ALL_DATA.ENABLED_STATES.CO2_EDS = window.isCO2_eds !== undefined ? window.isCO2_eds : true;
    ALL_DATA.ENABLED_STATES.ALBEDO = window.isAlbedo !== undefined ? window.isAlbedo : true;
    ALL_DATA.ENABLED_STATES.ANIMATION = animState;
    
    // Retourner ALL_DATA directement (pas de duplication)
    return ALL_DATA;
}

// ============================================================================
// FONCTION PRINCIPALE : getMasses()
// ============================================================================
// Calcule les masses en tenant compte des événements (meteor, etc.)
// Utilise ALL_DATA.EPOCH et ALL_DATA.DATE_CONFIG directement
function getMasses() {
    // Wrappers pour éviter window abusifs
    const ALL_DATA = window.ALL_DATA;
    const ALL_DESC = window.ALL_DESC;
    
    // Valeurs de base depuis ALL_DATA.EPOCH (directement dans ALL_DATA, pas de variables intermédiaires)
    ALL_DATA.MASSES.CO2 = ALL_DATA.EPOCH.co2_kg;
    ALL_DATA.MASSES.CH4 = ALL_DATA.EPOCH.ch4_kg;
    let h2o_kg = ALL_DATA.EPOCH.h2o_kg;
    ALL_DATA.MASSES.O2 = ALL_DATA.EPOCH.o2_kg;
    
    // Appliquer les événements
    if (ALL_DATA.EPOCH.events.meteor.water_added_kg) {
        if (ALL_DATA.DATE_CONFIG.METEORITE_COUNT > 0 && ALL_DATA.DATE_CONFIG.DELTA_WATER_METEORITE > 0) {
            h2o_kg += ALL_DATA.DATE_CONFIG.DELTA_WATER_METEORITE * ALL_DATA.DATE_CONFIG.METEORITE_COUNT;
        }
    }
    ALL_DATA.MASSES.H2O = h2o_kg;
    
    // Calculer la masse totale de l'atmosphère
    ALL_DATA.MASSES.TOTAL = ALL_DATA.EPOCH.total_atmosphere_mass_kg;
    
    // Log getMasses
    console.log(`📋 [getMasses@compute.js]`);
    const massesStr = `{'${ALL_DATA.MASSES.CO2}': ${ALL_DATA.MASSES.CO2.toExponential(2)}, '${ALL_DATA.MASSES.CH4}': ${ALL_DATA.MASSES.CH4.toExponential(2)}, '${ALL_DATA.MASSES.H2O}': ${ALL_DATA.MASSES.H2O.toExponential(2)}, '${ALL_DATA.MASSES.O2}': ${ALL_DATA.MASSES.O2.toExponential(2)}, '${ALL_DATA.MASSES.TOTAL}': ${ALL_DATA.MASSES.TOTAL.toExponential(2)}}`;
    console.log(`masses=${massesStr}`);
    
    // Pas de return nécessaire, ALL est modifié directement
}

// ============================================================================
// FONCTION PRINCIPALE : getEpochDateConfig()
// ============================================================================
// 🕓🛠 => 🎬:true 🏮:180.00K (-93.1°C) 🌡️:255.00K (-18.1°C), ☄️:0, 🌡️☄️:-3.5K, 🕓:0, 🌡️🕓:0K
function getEpochDateConfig() {
    // Wrappers pour éviter window abusifs
    const ALL_DATA = window.ALL_DATA;
    const ALL_DESC = window.ALL_DESC;
    
    let meteoriteCount = 0;
    let ticTime = 0;
    let deltaTicTime_per_tic = null;
    let water_added_kg = 0; // ☄️💧🐳
    
    if (typeof ALL_DATA.EPOCH.t0 === 'number' && ALL_DATA.EPOCH.t0 > 0) {
        // Calculer le nombre de météorites
        if (ALL_DATA.EPOCH.events.meteor.water_added_kg) {
            const h2oTotalFromMeteorites = window.h2oTotalFromMeteorites;
            if (h2oTotalFromMeteorites > 0) {
                const mass_kg = ALL_DATA.EPOCH.events.meteor.water_added_kg;
                const h2oPerMeteorite = (mass_kg / ALL_DATA.CONSTANTS.EARTH_TOTAL_WATER_MASS_KG) * 100;
                const h2oPerMeteoriteAdjusted = (ALL_DATA.EPOCH.id === 'hadeen') ? Math.max(h2oPerMeteorite * 10, 2.1) : h2oPerMeteorite;
                meteoriteCount = Math.floor(h2oTotalFromMeteorites / h2oPerMeteoriteAdjusted);
                water_added_kg = mass_kg; // ☄️💧🐳
            }
        }
        
        ticTime = Math.floor(window.infoTimeMa / 50);
        
        deltaTicTime_per_tic = ALL_DATA.EPOCH.events.tic_time.deltaTemp;
    }
    
    // Mettre à jour ALL_DATA directement (source unique de vérité)
    // dateConfig={'🌡️🏮':180.0, '🌡️⏳':2450, '🔘🎬':false, '🎓☄️📜':0, '🔺🐳💧☄️📜':1.00e+18, '🎓💫📜':0, '🔺🌡️💫📜':-300.0, '🔺🧲🌕💫📜':{'▶':2000000, '◀':0.3}}
    // ⚠️ CONFIG (📜) uniquement pour les événements (METEORITE_COUNT, TIC_TIME)
    ALL_DATA.CONVERGENCE.OLD_T0 = ALL_DATA.CONVERGENCE.T0;  // old_T0 (température précédente) - PAS de 📜
    ALL_DATA.DATE_CONFIG.T0_CONFIG = ALL_DATA.EPOCH.t0;                       // T0 attendu (température config) - 🌡️⏳ (sans 📜, pas un événement)
    ALL_DATA.DATE_CONFIG.METEORITE_COUNT = meteoriteCount;              // Nombre de météorites
    ALL_DATA.DATE_CONFIG.DELTA_WATER_METEORITE = water_added_kg;               // Masse d'eau ajoutée / météorite
    ALL_DATA.DATE_CONFIG.TIC_TIME_COUNT = ticTime;                     // Nombre de ticTime
    ALL_DATA.DATE_CONFIG.DELTA_TEMP_TIC_TIME = deltaTicTime_per_tic;     // Delta température / ticTime
    ALL_DATA.DATE_CONFIG.DELTA_FLUX_GEOTHERMAL_TIC_TIME = ALL_DATA.EPOCH.events.tic_time.geothermal_flux ? {  // Delta Flux Geom /ticTime
        [window.LOGOS.FLUX_START]: ALL_DATA.EPOCH.events.tic_time.geothermal_flux.start,
        [window.LOGOS.FLUX_END]: ALL_DATA.EPOCH.events.tic_time.geothermal_flux.end
    } : null;
    
    // Calculer les masses avec getMasses() (met à jour ALL_DATA directement, utilise ALL_DATA.EPOCH)
    getMasses();
    
    // Log getEpochDateConfig
    const geothermal_flux_str = ALL_DATA.EPOCH.events.tic_time.geothermal_flux 
        ? `{'${window.LOGOS.FLUX_START}':${ALL_DATA.EPOCH.events.tic_time.geothermal_flux.start}, '${window.LOGOS.FLUX_END}':${ALL_DATA.EPOCH.events.tic_time.geothermal_flux.end}}`
        : 'null';
    console.log(`💫🛠 [getEpochDateConfig@compute.js]`);
    console.log(`dateConfig={'${ALL_DATA.CONVERGENCE.OLD_T0}':${ALL_DATA.CONVERGENCE.OLD_T0.toFixed(2)}, '${ALL_DATA.DATE_CONFIG.T0_CONFIG}':${ALL_DATA.DATE_CONFIG.T0_CONFIG.toFixed(0)}, '${ALL_DATA.ENABLED_STATES.ANIMATION}':${ALL_DATA.ENABLED_STATES.ANIMATION}, '${ALL_DATA.DATE_CONFIG.METEORITE_COUNT}':${meteoriteCount}, '${ALL_DATA.DATE_CONFIG.DELTA_WATER_METEORITE}':${water_added_kg > 0 ? water_added_kg.toExponential(2) : '0'}, '${ALL_DATA.DATE_CONFIG.TIC_TIME_COUNT}':${ticTime}, '${ALL_DATA.DATE_CONFIG.DELTA_TEMP_TIC_TIME}':${deltaTicTime_per_tic.toFixed(1)}, '${ALL_DATA.DATE_CONFIG.DELTA_FLUX_GEOTHERMAL_TIC_TIME}':${geothermal_flux_str}}`);
    
    return ALL_DATA;
}

// ============================================================================
// FONCTION : getSoleil() - Calculer les valeurs du soleil
// ============================================================================
function getSoleil() {
    // Wrappers pour éviter window abusifs
    const ALL_DATA = window.ALL_DATA;
    const ALL_DESC = window.ALL_DESC;
    
    // Constante solaire à 1 UA (depuis solar_intensity - config 📜)
    const SOLAR_CONSTANT = ALL_DATA.CONSTANTS.SOLAR_CONSTANT_REF * ALL_DATA.EPOCH.solar_intensity;
    
    // Flux solaire à 1 UA / 4 (moyenne sphérique, AVANT albedo)
    // 🎱 représente la géométrie (division par 4 pour la moyenne sphérique)
    const solar_flux_1ua_geometric = SOLAR_CONSTANT / 4; // Moyenne sphérique, AVANT albedo
    
    // Flux solaire à la surface du soleil (en W/m²) - calculé depuis solar_intensity (config 📜)
    const solar_surface_flux = (ALL_DATA.CONSTANTS.SOLAR_POWER_REF / ALL_DATA.CONSTANTS.SOLAR_SURFACE_AREA) * ALL_DATA.EPOCH.solar_intensity; // ~62.9e6 W/m²
    
    // Puissance totale du soleil (en Watts) - calculé depuis solar_intensity (config 📜)
    const solar_power_total = ALL_DATA.CONSTANTS.SOLAR_POWER_REF * ALL_DATA.EPOCH.solar_intensity;
    
    // Mettre à jour ALL_DATA directement (source unique de vérité) (ALL_DATA déjà déclaré au début)
    const SOLEIL = ALL_DATA.SOLEIL;
    ALL_DATA.SOLEIL.CONSTANT = SOLAR_CONSTANT;  // Constante solaire à 1 UA (W/m²) - depuis solar_intensity (config 📜)
    ALL_DATA.SOLEIL.GEOMETRY_ORIGIN = solar_flux_1ua_geometric;  // Flux solaire à 1 UA / 4 (moyenne sphérique, AVANT albedo)
    ALL_DATA.SOLEIL.SUN_ORIGIN = solar_surface_flux;  // Flux solaire à la surface du soleil (W/m²)
    ALL_DATA.SOLEIL.POWER = solar_power_total;  // Puissance totale du soleil (W) - depuis solar_intensity (config 📜)
    
    console.log(`☀️ [getSoleil@compute.js]`);
    console.log(`soleil={'${SOLEIL.CONSTANT}':${SOLAR_CONSTANT.toFixed(2)}, '${SOLEIL.GEOMETRY_ORIGIN}':${solar_flux_1ua_geometric.toFixed(2)}, '${SOLEIL.SUN_ORIGIN}':${solar_surface_flux.toExponential(2)}, '${SOLEIL.POWER}':${solar_power_total.toExponential(2)}}`);
    
    return ALL_DATA;
}

// ============================================================================
// FONCTION : getNoyau() - Calculer les valeurs du noyau (géothermique)
// ============================================================================
function getNoyau() {
    // Wrappers pour éviter window abusifs
    const ALL_DATA = window.ALL_DATA;
    const ALL_DESC = window.ALL_DESC;
    
    // Flux géothermique en W/m² (depuis ALL_DATA.EPOCH - config 📜)
    let geothermal_flux_wm2 = 0;
    if (ALL_DATA.EPOCH.events.tic_time.geothermal_flux) {
        // Utiliser la valeur actuelle du flux géothermique (peut varier avec ticTime)
        // Pour l'instant, utiliser la valeur de départ (start)
        geothermal_flux_wm2 = ALL_DATA.EPOCH.events.tic_time.geothermal_flux.start;
    } else if (ALL_DATA.EPOCH.geothermal_flux) {
        // geothermal_flux est dans la config (📜)
        geothermal_flux_wm2 = ALL_DATA.EPOCH.geothermal_flux;
    }
    
    // Puissance totale du noyau (en Watts) - depuis core_power_watts (config 📜) si disponible
    let geothermal_power_total = 0;
    if (ALL_DATA.EPOCH.core_power_watts) {
        // core_power_watts est dans la config (📜)
        geothermal_power_total = ALL_DATA.EPOCH.core_power_watts;
    } else {
        // Sinon, calculer depuis le flux géothermique
        // Calculer la surface terrestre depuis ALL_DATA.EPOCH.planet_radius (varie selon l'époque)
        const earth_surface_area = 4 * Math.PI * Math.pow(ALL_DATA.EPOCH.planet_radius, 2);
        geothermal_power_total = geothermal_flux_wm2 * earth_surface_area;
    }
    
    // Mettre à jour ALL_DATA directement (source unique de vérité) (ALL_DATA déjà déclaré au début)
    const NOYAU = ALL_DATA.NOYAU;
    ALL_DATA.NOYAU.FLUX = geothermal_flux_wm2;  // Flux géothermique (W/m²) - depuis ALL_DATA.EPOCH.geothermal_flux (config 📜)
    ALL_DATA.NOYAU.POWER = geothermal_power_total;  // Puissance totale du noyau (W) - depuis ALL_DATA.EPOCH.core_power_watts (config 📜) ou calculé
    
    console.log(`🌕 [getNoyau@compute.js]`);
    console.log(`noyau={'${NOYAU.FLUX}':${geothermal_flux_wm2.toExponential(2)}, '${NOYAU.POWER}':${geothermal_power_total.toExponential(2)}}`);
    
    return ALL_DATA;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================
if (typeof window !== 'undefined') {
    window.getEpochDateConfig = getEpochDateConfig;
    window.getDateConfig = getEpochDateConfig; // Alias pour compatibilité
    window.getMasses = getMasses; // Exposer getMasses
    window.getLogo = getLogo; // Exposer getLogo pour utilisation dans calculations_flux.js
    window.getLogoKey = getLogoKey; // Exposer getLogoKey pour construction dynamique des clés
    window.getEnabledStates = getEnabledStates; // Exposer getEnabledStates
    window.getSoleil = getSoleil; // Exposer getSoleil
    window.getNoyau = getNoyau; // Exposer getNoyau
    // Exposer T0 pour utilisation dans calculations_flux.js (old_T0 n'existe plus, utilise dateConfig['🌡️🏮'])
    Object.defineProperty(window, 'T0', {
        get: () => T0,
        set: (value) => { T0 = value; }
    });
}

