// ============================================================================
// File: static/compute/calculations_flux.js - Calculs de flux radiatif
// Desc: En français, dans l'architecture, je suis le module de calculs de flux radiatif
// Version 1.2.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: calculs de flux radiatif simplifiés
//   - Updated getGasValuesFromConfig to return kg values (co2_kg, ch4_kg, h2o_kg) from config
//   - Fixed computeRadiativeTransfer to calculate h2o_total_percent from h2o_kg config + meteorites
//   - Fixed computeRadiativeTransfer to use h2o_total_percent instead of h2o_total_MT
//   - Moved to static/compute/ and updated to use window.LOGOS
// ============================================================================

// ============================================================================
// FONCTIONS DE CALCUL DE FLUX RADIATIF
// ============================================================================

// 🔒 VARIABLES GLOBALES UNIQUES : window.isCO2_eds, window.isCH4_eds, window.isH2O_eds, window.isAlbedo
// Ces variables sont mises à jour UNIQUEMENT au clic sur les boutons (dans organigramme.js)
// Ne PAS vérifier directement le DOM, utiliser ces variables globales

// Fonction helper pour récupérer les logos : définie dans compute.js (chargé avant ce fichier)
// On utilise window.getLogo() exposé depuis compute.js

// Variables d'état : déclarées dans compute.js (chargé avant ce fichier)
// On utilise les variables globales définies dans compute.js
// old_T0, T0, Phase, signeDeltaFirst, flux_entrant sont accessibles depuis compute.js

// Fonctions getAnimState() et getEpochDateConfig() : définies dans compute.js (chargé avant ce fichier)
// window.epoch est utilisé directement (pas de fonction getEpochConfig)
// On utilise les fonctions globales définies dans compute.js

// (🎬) => T0=🏮 : T0=🌡️, puis T0 += ☄️*🌡️☄️ + 🕓*🌡️🕓
function calculateT0(dateConfig) {
    // dateConfig utilise maintenant des logos comme clés
    const animEnabled = dateConfig['🎬'] ?? false;
    const t0_config = dateConfig['🌡️'];
    const meteoriteCount = dateConfig['☄️'] ?? 0;
    const deltaMeteorite = dateConfig['🌡️☄️'] ?? 0;
    const ticTime = dateConfig['🕓'] ?? 0;
    const deltaTicTime_per_tic = dateConfig['🌡️🕓'] ?? 0;
    
    if (!t0_config || t0_config <= 0) {
        console.error(`${window.getLogo('EDS')} [calculateT0@calculations_flux.js] ❌ t0_config invalide: ${t0_config}`);
        return null;
    }
    
    // (🎬) => T0=🏮 : T0=🌡️
    // 🏮 = window.old_T0
    let baseTemp;
    if (animEnabled && window.old_T0 > 0) {
        baseTemp = window.old_T0; // 🎬 => T0=🏮
    } else {
        baseTemp = t0_config; // T0=🌡️
    }
    
    // T0 += ☄️*🌡️☄️ + 🕓*🌡️🕓
    let adjustment = 0;
    if (deltaMeteorite) adjustment += deltaMeteorite * meteoriteCount;
    if (deltaTicTime_per_tic) adjustment += deltaTicTime_per_tic * ticTime;
    
    const T0 = baseTemp + adjustment;
    
    if (T0 <= 0) {
        console.error(`${window.getLogo('EDS')} [calculateT0@calculations_flux.js] ❌ T0 invalide: ${T0}`);
        return null;
    }
    
    // Créer window.T0converge
    window.T0converge = {
        '🚩': T0,
        '⚧': 'None',
        '🔺': 0
    };
    
    // Log T0
    console.log(`🌡️ T0 [calculateT0@calculations_flux.js]`);
    console.log(`T0converge={'🚩':${T0.toFixed(1)}, '⚧':'None', '🔺':0}`);
    
    return T0;
}

// Fonction pour réinitialiser les variables lors d'un changement de date
function newDate() {
    Phase = "Search";
    signeDeltaFirst = 0;
}

// Fonction helper pour récupérer les valeurs de gaz depuis la config de l'époque ou options
function getGasValuesFromConfig(options = {}) {
    // Si options fourni, utiliser options
    if (options.CO2_percent !== undefined || options.CH4_percent !== undefined || options.H2O_percent !== undefined) {
        return {
            CO2_ppm: (options.CO2_percent || 0),
            CH4_ppm: (options.CH4_percent || 0),
            H2O_percent: (options.H2O_percent || 0),
            // Valeurs en kg si disponibles dans options
            co2_kg: options.co2_kg || 0,
            ch4_kg: options.ch4_kg || 0,
            h2o_kg: options.h2o_kg || 0
        };
    }
    
    // Sinon, récupérer depuis la config de l'époque
    let CO2_ppm = 0;
    let CH4_ppm = 0;
    let H2O_percent = 0;
    let co2_kg = 0;
    let ch4_kg = 0;
    let h2o_kg = 0;
    
    if (window?.currentEpochName && window.getGeologicalPeriodByName) {
        const epoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (epoch) {
            // Récupérer les valeurs en kg directement depuis la config
            co2_kg = epoch.co2_kg || 0;
            ch4_kg = epoch.ch4_kg || 0;
            h2o_kg = epoch.h2o_kg || 0;
            
            // Convertir co2_kg, ch4_kg, h2o_kg en ppm/%
            if (co2_kg > 0 && window.co2KgToFraction && epoch.total_atmosphere_mass_kg) {
                const molar_mass_air = window.calculateMolarMassAir ? window.calculateMolarMassAir(epoch) : 0.029;
                const co2_fraction = window.co2KgToFraction(co2_kg, epoch.total_atmosphere_mass_kg, molar_mass_air);
                CO2_ppm = co2_fraction * 1e6;
            }
            if (ch4_kg > 0 && window.ch4KgToFraction && epoch.total_atmosphere_mass_kg) {
                const molar_mass_air = window.calculateMolarMassAir ? window.calculateMolarMassAir(epoch) : 0.029;
                const ch4_fraction = window.ch4KgToFraction(ch4_kg, epoch.total_atmosphere_mass_kg, molar_mass_air);
                CH4_ppm = ch4_fraction * 1e6;
            }
            if (h2o_kg > 0 && epoch.total_atmosphere_mass_kg) {
                H2O_percent = (h2o_kg / epoch.total_atmosphere_mass_kg) * 100;
            }
        }
    }
    
    return { CO2_ppm, CH4_ppm, H2O_percent, co2_kg, ch4_kg, h2o_kg };
}

function computeRadiativeTransfer(options = {}) {
    // Sauvegarder T0 actuel dans window.old_T0 avant le calcul
    window.old_T0 = window.T0;
    
    const dateConfig = getEpochDateConfig();
    // 🎥:true 🏮:180.00K (-93.1°C) 🌡️:255.00K (-18.1°C), ☄️:0, 🌡️☄️:-3.5K, 🕓:0, 🌡️🕓:0K
    window.T0 = calculateT0(dateConfig);
    if (!window.T0) return Promise.reject(new Error('T0 invalide'));
    
    // 1. Récupérer les masses depuis window.masses (calculé par getMasses() dans getEpochDateConfig())
    const epoch = window.epoch; // window.epoch = timeline[2*k]
    const masses = window.masses || {
        '🏭🐳': epoch?.co2_kg || 0,
        '⛽🐳': epoch?.ch4_kg || 0,
        '💧🐳': epoch?.h2o_kg || 0,
        '🌫🐳': epoch?.o2_kg || 0,
        '🐳': epoch?.total_atmosphere_mass_kg || 0
    };
    
    // 2. Passer par calculations_atm.js pour avoir la densité et les %/ppm utilisés pour EDS
    // calculateCompositionFromLogoConfig() prend dateConfig (avec logos incluant les masses) et retourne les fractions molaires
    const total_atmosphere_mass_kg = masses['🐳'] || epoch?.total_atmosphere_mass_kg || 0;
    const dateConfigWithMasses = { ...dateConfig, ...masses };
    const atmComposition = window.calculateCompositionFromLogoConfig 
        ? window.calculateCompositionFromLogoConfig(dateConfigWithMasses, total_atmosphere_mass_kg, epoch)
        : dateConfigWithMasses; // Fallback si pas disponible
    
    // Extraire les valeurs depuis atmComposition (avec logos comme clés)
    const CO2_ppm = atmComposition['🏭'] || 0;
    const CH4_ppm = atmComposition['⛽'] || 0;
    const H2O_percent = atmComposition['💧'] || 0;
    
    // Log composition atmosphérique
    console.log(`🌍 [calculateCompositionFromLogoConfig@calculations_atm.js]`);
    console.log(`atm={'💨':${(atmComposition['💨'] || 0).toFixed(0)}, '🚀':${(atmComposition['🚀'] || 0).toFixed(0)}, '🛩':${(atmComposition['🛩'] || 0).toFixed(0)}, '🌫':${(atmComposition['🌫'] || 0).toFixed(0)}, '🏭':${CO2_ppm.toFixed(0)}, '💧':${H2O_percent.toFixed(0)}, '⛽':${CH4_ppm.toFixed(0)}}`);
    
    // 2. Passer par calculations_h2o.js pour les trucs de l'albedo
    // Calculer h2o_total_percent à partir de H2O_percent (depuis atm) + météorites
    const h2o_from_meteorites = window.h2oTotalFromMeteorites || 0;
    const h2o_total_percent = H2O_percent + h2o_from_meteorites;
    
    // Calculer les paramètres H2O (vapeur, glace, nuages)
    // calculateH2OParameters va créer window.h2o automatiquement
    const h2o_params = window.calculateH2OParameters ? window.calculateH2OParameters(window.T0, h2o_total_percent, null) : {
        vapor_fraction: 0,
        ice_fraction: 0,
        cloud_coverage: 0,
        greenhouse_forcing: 0,
        cloud_albedo_contribution: 0,
        max_vapor_fraction: 0
    };

    // window.h2o est déjà créé dans calculateH2OParameters
    
    // 7.b calculations_albedo.js => flux_entrant : 238W/m2
    const geo_flux = epoch?.geothermal_flux || null;
    const h2o_enabled = window.isH2O_eds || false;
  
    flux_entrant = window.calculateSolarFluxAbsorbed ? window.calculateSolarFluxAbsorbed(window.T0, h2o_enabled, geo_flux) : 238;
    if (geo_flux) flux_entrant += geo_flux;
    
    // Créer window.flux (pour l'affichage)
    window.flux = { '☀️': flux_entrant };
    
    // Log flux radiatif
    console.log(`☀️ [calculateSolarFluxAbsorbed@calculations_albedo.js]`);
    console.log(`flux={'☀️':${flux_entrant.toFixed(2)}}`);
    
    // TODO #4: 7.f (signeDeltaFirst!=0 && signeDeltaFirst!=signe(Delta équilibre)) => Phase="Dicho"
    // Calculer delta_equilibre = flux_sortant - flux_entrant
    // Détecter le changement de signe et passer en Phase="Dicho" si nécessaire
    // Initialiser T0_min et T0_max pour la dichotomie
    
    // TODO #5: 7.g (Phase=="Search") => {T0-=Delta équilibre; signeDeltaFirst=signe(Delta équilibre)}
    //         (Phase=="Dicho") => T0=(old_T0+T0)/2
    // Implémenter la boucle principale avec les deux phases
    
    // TODO #6: 7.h (anim) => dessine courbes
    // Si anim est activé, appeler les fonctions de dessin (displayDichotomyStep, etc.)
    
    // TODO #7: Test d'arrêt via précision
    // Récupérer precision_K depuis window.convergencePrecision_K
    // Calculer tolerance = 4 * σ * T³ * precision_K
    // Vérifier |delta_equilibre| <= tolerance pour arrêter la boucle
    
    // Pour l'instant, on retourne les résultats initiaux
    return Promise.resolve({
        T0: window.T0,
        h2o_result: window.h2o || {},
        albedo_result: window.flux || {},
        atm_result: {},
        atm_composition: window.atm || {},
        Phase: window.T0converge?.['⚧'] || 'None',
        signeDeltaFirst: window.T0converge?.['🔺'] || 0
    });
}

// Exposer les fonctions globalement
// Note: getEpochDateConfig est déjà exposé dans compute.js
// window.epoch est utilisé directement (pas de fonction getEpochConfig)
if (typeof window !== 'undefined') {
    window.calculateT0 = calculateT0;
    window.computeRadiativeTransfer = computeRadiativeTransfer;
    window.newDate = newDate;
}

