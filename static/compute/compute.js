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
// FONCTION HELPER : getLogo()
// ============================================================================
// window.LOGOS est défini dans organigramme/configOrganigramme.js
function getLogo(name) {
    return window.LOGOS[name];
}

// ============================================================================
// VARIABLES GLOBALES D'ÉTAT
// ============================================================================

let old_T0 = 180.0;
let T0 = 180.0;
let Phase = "None";
let signeDeltaFirst = 0;
let flux_entrant = 238;

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

// Fonction pour récupérer les états activés (remplace isH2O_eds, isCO2_eds, etc.)
// Retourne window.enabledStates avec des logos comme clés : {'💧📛':true, '⛽📛':true, '🏭📛':true, '🪞':true, '🎞':false}
// Les anciennes variables window.isH2O_eds, window.isCO2_eds, etc. sont encore utilisées pour la compatibilité
// mais window.enabledStates est la source unique de vérité pour les états activés
function getEnabledStates() {
    // Selon grammar.txt : enabledStates={'📫💧📛':true, '📫⛽📛':true, '📫🏭📛':true, '📫🪞':true, '📫🎬':false}
    window.enabledStates = {
        '📫💧📛': window.isH2O_eds !== undefined ? window.isH2O_eds : true,
        '📫⛽📛': window.isCH4_eds !== undefined ? window.isCH4_eds : true,
        '📫🏭📛': window.isCO2_eds !== undefined ? window.isCO2_eds : true,
        '📫🪞': window.isAlbedo !== undefined ? window.isAlbedo : true,
        '📫🎬': getAnimState()
    };
    return window.enabledStates;
}

// Fonction helper pour récupérer l'état anim (🎞)
function getAnimState() {
    if (typeof window === 'undefined') return false;
    // Le bouton "anim" peut être "plot-anim-toggle" (principal) ou "anim-toggle" (test)
    // Vérifier d'abord le checkbox caché (pour compatibilité avec main.js)
    const animToggleCheckbox = typeof document !== 'undefined' 
        ? document.getElementById('plot-anim-toggle-checkbox')
        : null;
    if (animToggleCheckbox) {
        return animToggleCheckbox.checked;
    }
    // Sinon, vérifier le bouton avec classe "selected" (nouveau système)
    const animButtonPlot = typeof document !== 'undefined'
        ? document.getElementById('plot-anim-toggle')
        : null;
    if (animButtonPlot && animButtonPlot.classList.contains('selected')) {
        return true;
    }
    const animButtonTest = typeof document !== 'undefined'
        ? document.getElementById('anim-toggle')
        : null;
    if (animButtonTest && animButtonTest.classList.contains('selected')) {
        return true;
    }
    return false;
}

// ============================================================================
// FONCTION PRINCIPALE : getMasses()
// ============================================================================
// Calcule les masses en tenant compte des événements (meteor, etc.)
// Utilise dateConfig (avec logos) et epoch
function getMasses(dateConfig, epoch) {
    // Valeurs de base depuis epoch
    let co2_kg = epoch?.co2_kg || 0;
    let ch4_kg = epoch?.ch4_kg || 0;
    let h2o_kg = epoch?.h2o_kg || 0;
    let o2_kg = epoch?.o2_kg || 0;
    
    // Appliquer les événements
    if (epoch?.events?.meteor?.water_added_kg) {
        const meteoriteCount = dateConfig?.['🎓☄️📜'] || 0;
        const water_added_kg = dateConfig?.['🔺🐳💧☄️📜'] || epoch.events.meteor.water_added_kg || 0;
        if (meteoriteCount > 0 && water_added_kg > 0) {
            h2o_kg += water_added_kg * meteoriteCount;
        }
    }
    
    // Calculer la masse totale de l'atmosphère
    const total_atmosphere_mass_kg = epoch?.total_atmosphere_mass_kg || 0;
    
    // Créer l'objet avec logos selon grammar.txt : masses={'🐳🏭': 5.15e+17, '🐳⛽': 5.15e+15, '🐳💧': 2.10e+20, '🐳🌫': 0.00e+0, '🐳🎓': 5.30e+20}
    const masses = {
        '🐳🏭': co2_kg,
        '🐳⛽': ch4_kg,
        '🐳💧': h2o_kg,
        '🐳🌫': o2_kg,
        '🐳🎓': total_atmosphere_mass_kg
    };
    
    // Sauvegarder dans window.masses
    window.masses = masses;
    
    // Log getMasses
    console.log(`📋 [getMasses@compute.js]`);
    const massesStr = `{'🐳🏭': ${co2_kg.toExponential(2)}, '🐳⛽': ${ch4_kg.toExponential(2)}, '🐳💧': ${h2o_kg.toExponential(2)}, '🐳🌫': ${o2_kg.toExponential(2)}, '🐳🎓': ${total_atmosphere_mass_kg.toExponential(2)}}`;
    console.log(`masses=${massesStr}`);
    
    return masses;
}

// ============================================================================
// FONCTION PRINCIPALE : getEpochDateConfig()
// ============================================================================
// 🕓🛠 => 🎬:true 🏮:180.00K (-93.1°C) 🌡️:255.00K (-18.1°C), ☄️:0, 🌡️☄️:-3.5K, 🕓:0, 🌡️🕓:0K
function getEpochDateConfig() {
    const epoch = window.epoch; // window.epoch = timeline[2*k]
    
    let meteoriteCount = 0;
    let ticTime = 0;
    let t0_config = epoch?.t0 || null;
    let deltaMeteorite = null;
    let deltaTicTime_per_tic = null;
    let water_added_kg = 0; // ☄️💧🐳
    
    if (epoch && typeof epoch.t0 === 'number' && epoch.t0 > 0) {
        // Calculer le nombre de météorites
        if (epoch.events?.meteor?.water_added_kg) {
            const h2oTotalFromMeteorites = window.h2oTotalFromMeteorites || 0;
            if (h2oTotalFromMeteorites > 0) {
                const mass_kg = epoch.events.meteor.water_added_kg;
                const EARTH_TOTAL_WATER_MASS_KG = 1.4e21;
                const h2oPerMeteorite = (mass_kg / EARTH_TOTAL_WATER_MASS_KG) * 100;
                const h2oPerMeteoriteAdjusted = (epoch.id === 'hadeen') ? Math.max(h2oPerMeteorite * 10, 2.1) : h2oPerMeteorite;
                meteoriteCount = Math.floor(h2oTotalFromMeteorites / h2oPerMeteoriteAdjusted);
                water_added_kg = mass_kg; // ☄️💧🐳
            }
        }
        
        ticTime = Math.floor((window.infoTimeMa || 0) / 50);
        
        deltaMeteorite = epoch.events?.meteor?.deltaTemp ?? null;
        deltaTicTime_per_tic = epoch.events?.tic_time?.deltaTemp ?? null;
    }
    
    const animEnabled = getAnimState(); // 🎞
    
    // Récupérer prev_T0 depuis old_T0
    const prev_T0_val = window.old_T0 > 0 ? window.old_T0 : null;
    
    // Retourner un objet avec logos complets selon grammar.txt
    // dateConfig={'🌡️🏮📜':180.0, '⏳🌡️':2450, '🎓☄️📜':0, '🔺🌡️☄️📜':-3.0, '🔺🐳💧☄️📜':1.00e+18, '🎓💫📜':0, '🔺🌡️💫📜':-300.0, '🔺🧲🌕💫📜':{'▶':2000000, '◀':0.3}}
    const result = {
        '🌡️🏮📜': prev_T0_val,  // old_T0 (température précédente) - le logo 🌡️ indique déjà que c'est une température
        '⏳🌡️': t0_config,                       // T0 attendu (température config)
        '🎓☄️📜': meteoriteCount ?? 0,              // Nombre de météorites
        '🔺🌡️☄️📜': deltaMeteorite ?? 0,           // Delta température / météorite
        '🔺🐳💧☄️📜': water_added_kg,               // Masse d'eau ajoutée / météorite
        '🎓💫📜': ticTime ?? 0,                     // Nombre de ticTime
        '🔺🌡️💫📜': deltaTicTime_per_tic ?? 0,     // Delta température / ticTime
        '🔺🧲🌕💫📜': epoch?.events?.tic_time?.geothermal_flux ? {  // Delta Flux Geom /ticTime
            '▶': epoch.events.tic_time.geothermal_flux.start || 0,
            '◀': epoch.events.tic_time.geothermal_flux.end || 0
        } : null
    };
    
    // Calculer les masses avec getMasses() (sauvegarde dans window.masses)
    getMasses(result, epoch);
    
    // Créer window.dateConfig (pour l'affichage)
    window.dateConfig = result;
    
    // Log getEpochDateConfig
    const old_T0_str = prev_T0_val ? `${prev_T0_val.toFixed(2)}K` : 'null';
    const t0_config_str = t0_config ? t0_config.toFixed(0) : 'null';
    const deltaMeteorite_str = (deltaMeteorite ?? 0).toFixed(1);
    const deltaTicTime_str = (deltaTicTime_per_tic ?? 0).toFixed(1);
    const water_added_str = water_added_kg > 0 ? water_added_kg.toExponential(2) : '0';
    const geothermal_flux_str = epoch?.events?.tic_time?.geothermal_flux 
        ? `{'▶':${epoch.events.tic_time.geothermal_flux.start || 0}, '◀':${epoch.events.tic_time.geothermal_flux.end || 0}}`
        : 'null';
    console.log(`💫🛠 [getEpochDateConfig@compute.js]`);
    console.log(`dateConfig={'🌡️🏮📜':${old_T0_str}, '⏳🌡️':${t0_config_str}, '🎓☄️📜':${meteoriteCount}, '🔺🌡️☄️📜':${deltaMeteorite_str}, '🔺🐳💧☄️📜':${water_added_str}, '🎓💫📜':${ticTime}, '🔺🌡️💫📜':${deltaTicTime_str}, '🔺🧲🌕💫📜':${geothermal_flux_str}}`);
    
    return result;
}

// ============================================================================
// FONCTION : getSoleil() - Calculer les valeurs du soleil
// ============================================================================
function getSoleil() {
    const epoch = window.epoch;
    // solar_intensity est dans la config (📜)
    const solar_intensity = epoch?.solar_intensity || 1.0;
    
    // Constantes solaires (d'après flux_manager.js)
    const SOLAR_POWER_REF = 3.828e26; // W (puissance totale du soleil)
    const SOLAR_SURFACE_AREA = 6.09e18; // m² (surface du soleil)
    const SOLAR_CONSTANT_REF = 1361; // W/m² (constante solaire à 1 UA)
    
    // Flux solaire à la surface du soleil (en W/m²) - calculé depuis solar_intensity (config 📜)
    const solar_surface_flux = (SOLAR_POWER_REF / SOLAR_SURFACE_AREA) * solar_intensity; // ~62.9e6 W/m²
    
    // Flux solaire à 1 UA / 4 (moyenne sphérique, AVANT albedo)
    // 🎱 représente la géométrie (division par 4 pour la moyenne sphérique)
    const SOLAR_CONSTANT = SOLAR_CONSTANT_REF * solar_intensity;
    const solar_flux_1ua_geometric = SOLAR_CONSTANT / 4; // Moyenne sphérique, AVANT albedo
    
    // Puissance totale du soleil (en Watts) - calculé depuis solar_intensity (config 📜)
    const solar_power_total = SOLAR_POWER_REF * solar_intensity;
    
    const result = {
        '🧲☀️📜': solar_surface_flux,  // Flux solaire à la surface du soleil (W/m²) - depuis solar_intensity (config 📜)
        '🧲☀️🎱': solar_flux_1ua_geometric,  // Flux solaire à 1 UA / 4 (moyenne sphérique, AVANT albedo)
        '🔋☀️📜': solar_power_total  // Puissance totale du soleil (W) - depuis solar_intensity (config 📜)
    };
    
    window.soleil = result;
    
    console.log(`☀️ [getSoleil@compute.js]`);
    console.log(`soleil={'🧲☀️📜':${solar_surface_flux.toExponential(2)}, '🧲☀️🎱':${solar_flux_1ua_geometric.toFixed(2)}, '🔋☀️📜':${solar_power_total.toExponential(2)}}`);
    
    return result;
}

// ============================================================================
// FONCTION : getNoyau() - Calculer les valeurs du noyau (géothermique)
// ============================================================================
function getNoyau() {
    const epoch = window.epoch;
    
    // Flux géothermique en W/m² (depuis epoch - config 📜)
    let geothermal_flux_wm2 = 0;
    if (epoch?.events?.tic_time?.geothermal_flux) {
        // Utiliser la valeur actuelle du flux géothermique (peut varier avec ticTime)
        const geo_flux_obj = epoch.events.tic_time.geothermal_flux;
        // Pour l'instant, utiliser la valeur de départ (start)
        geothermal_flux_wm2 = geo_flux_obj.start || 0;
    } else if (epoch?.geothermal_flux) {
        // geothermal_flux est dans la config (📜)
        geothermal_flux_wm2 = epoch.geothermal_flux;
    }
    
    // Puissance totale du noyau (en Watts) - depuis core_power_watts (config 📜) si disponible
    let geothermal_power_total = 0;
    if (epoch?.core_power_watts) {
        // core_power_watts est dans la config (📜)
        geothermal_power_total = epoch.core_power_watts;
    } else {
        // Sinon, calculer depuis le flux géothermique
        const EARTH_SURFACE_AREA = 4 * Math.PI * Math.pow(6371000, 2); // ~5.1e14 m²
        geothermal_power_total = geothermal_flux_wm2 * EARTH_SURFACE_AREA;
    }
    
    const result = {
        '🧲🌕📜': geothermal_flux_wm2,  // Flux géothermique (W/m²) - depuis epoch.geothermal_flux (config 📜)
        '🔋🌕📜': geothermal_power_total  // Puissance totale du noyau (W) - depuis epoch.core_power_watts (config 📜) ou calculé
    };
    
    window.noyau = result;
    
    console.log(`🌕 [getNoyau@compute.js]`);
    console.log(`noyau={'🧲🌕📜':${geothermal_flux_wm2.toExponential(2)}, '🔋🌕📜':${geothermal_power_total.toExponential(2)}}`);
    
    return result;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================
if (typeof window !== 'undefined') {
    window.getEpochDateConfig = getEpochDateConfig;
    window.getDateConfig = getEpochDateConfig; // Alias pour compatibilité
    window.getMasses = getMasses; // Exposer getMasses
    window.getLogo = getLogo; // Exposer getLogo pour utilisation dans calculations_flux.js
    window.getEnabledStates = getEnabledStates; // Exposer getEnabledStates
    window.getSoleil = getSoleil; // Exposer getSoleil
    window.getNoyau = getNoyau; // Exposer getNoyau
    // Exposer old_T0 et T0 pour utilisation dans calculations_flux.js
    Object.defineProperty(window, 'old_T0', {
        get: () => old_T0,
        set: (value) => { old_T0 = value; }
    });
    Object.defineProperty(window, 'T0', {
        get: () => T0,
        set: (value) => { T0 = value; }
    });
}

