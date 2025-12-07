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

// 🔒 VARIABLES GLOBALES : window.enabledStates (créé par getEnabledStates()) remplace isH2O_eds, isCO2_eds, etc.
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

// (🎬) => T0=🏮 : T0=🌡️, puis T0 += ☄️*🌡️☄️ + 💫*🌡️💫
// dateConfig utilise maintenant les logos complets selon grammar.txt
function calculateT0(dateConfig) {
    // Récupérer les valeurs depuis dateConfig (pas de fallback, pas de window.old_T0)
    const old_T0 = dateConfig[window.getLogoKey('TEMP', 'OLD_T0')];  // old_T0 depuis dateConfig uniquement
    const t0_config = dateConfig[window.getLogoKey('TEMP', 'COMPUTE', 'CONFIG')];  // T0 config depuis dateConfig
    const animEnabled = dateConfig[window.getLogoKey('BOOLEAN', 'ANIMATION')];  // Animation depuis dateConfig
    const meteoriteCount = dateConfig[window.getLogoKey('CARDINAL', 'METEORITE_COUNT', 'CONFIG')];
    const deltaMeteorite = dateConfig[window.getLogoKey('DELTA', 'TEMP', 'METEORITE_COUNT', 'CONFIG')];
    const ticTime = dateConfig[window.getLogoKey('CARDINAL', 'TIC_TIME', 'CONFIG')];
    const deltaTicTime_per_tic = dateConfig[window.getLogoKey('DELTA', 'TEMP', 'TIC_TIME', 'CONFIG')];
    
    if (!t0_config || t0_config <= 0) {
        console.error(`${window.getLogo('EDS')} [calculateT0@calculations_flux.js] ❌ t0_config invalide: ${t0_config}`);
        return null;
    }
    
    // Logique selon la sémantique :
    // (!🔘🎬) => ⏳🌡️🚩 = 🌡️⏳📜  (si animation désactivée, T0 calculé = T0 config)
    // (🔘🎬) => ⏳🌡️🚩 = 🌡️🏮     (si animation activée, T0 calculé = old_T0)
    const baseTemp = animEnabled ? old_T0 : t0_config;
    
    // T0 += ☄️*🌡️☄️ + 💫*🌡️💫
    let adjustment = 0;
    if (deltaMeteorite) adjustment += deltaMeteorite * meteoriteCount;
    if (deltaTicTime_per_tic) adjustment += deltaTicTime_per_tic * ticTime;
    
    const T0 = baseTemp + adjustment;
    
    if (T0 <= 0) {
        console.error(`${window.getLogo('EDS')} [calculateT0@calculations_flux.js] ❌ T0 invalide: ${T0}`);
        return null;
    }
    
    // Initialiser window.fluxState (sera complété dans computeRadiativeTransfer)
    window.fluxState = {
        '⏳🌡️🚩': T0,        // T0 calculé (température)
        '⏳⚧': 'None',       // Phase (None/Search/Dicho)
        '⏳🔺': 0,           // signeDeltaFirst (signe: -1, 0, 1 - pas d'unité physique)
        '🧲☀️🔽': 0,         // Flux solaire absorbé (W/m²)
        '🧲🌕🔽': 0,         // Flux géothermique (W/m²)
        '🧲🔼': 0,            // Flux sortant (W/m²)
        '🔺🧲': 0,           // Delta flux (W/m²)
        '🧲🔬': 0            // Tolérance (W/m²)
    };
    
    // Log T0
    console.log(`🌡️ T0 [calculateT0@calculations_flux.js]`);
    console.log(`T0 initial: ${T0.toFixed(2)}K`);
    
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
    // Réinitialiser l'historique des itérations
    window.fluxStateHistory = [];
    
    // 0. Calculer les valeurs du soleil et du noyau
    if (window.getSoleil) window.getSoleil();
    if (window.getNoyau) window.getNoyau();
    
    const dateConfig = getEpochDateConfig();
    // 🎥:true 🏮:180.00K (-93.1°C) 🌡️:255.00K (-18.1°C), ☄️:0, 🌡️☄️:-3.5K, 💫:0, 🌡️💫:0K
    window.T0 = calculateT0(dateConfig);
    if (!window.T0) return Promise.reject(new Error('T0 invalide'));
    
    // 1. Récupérer les masses depuis window.masses (calculé par getMasses() dans getEpochDateConfig())
    const epoch = window.epoch; // window.epoch = timeline[2*k]
    // Selon grammar.txt : masses={'🐳🏭': 5.15e+17, '🐳⛽': 5.15e+15, '🐳💧': 2.10e+20, '🐳🌫': 0.00e+0, '🐳🎓': 5.30e+20}
    const masses = window.masses || {
        '🐳🏭': epoch?.co2_kg || 0,
        '🐳⛽': epoch?.ch4_kg || 0,
        '🐳💧': epoch?.h2o_kg || 0,
        '🐳🌫': epoch?.o2_kg || 0,
        '🐳🎓': epoch?.total_atmosphere_mass_kg || 0
    };
    
    // 2. Passer par calculations_atm.js pour avoir la densité et les %/ppm utilisés pour EDS
    // calculateCompositionFromLogoConfig() prend dateConfig (avec logos incluant les masses) et retourne les fractions molaires
    const total_atmosphere_mass_kg = masses['🐳'] || epoch?.total_atmosphere_mass_kg || 0;
    const dateConfigWithMasses = { ...dateConfig, ...masses };
    const atmComposition = window.calculateCompositionFromLogoConfig 
        ? window.calculateCompositionFromLogoConfig(dateConfigWithMasses, total_atmosphere_mass_kg, epoch)
        : dateConfigWithMasses; // Fallback si pas disponible
    
    // Extraire les valeurs depuis atmComposition (avec logos complets selon grammar.txt)
    // atm={'📏🌬🚀':1300, '📏🌬🛩':30, '🥒🌬🌫':0.0, '🥒🌬🏭':0.703, '🥒🌬💧':0.000701158, '🥒🌬⛽':0.00019}
    const CO2_percent = atmComposition['🥒🌬🏭'] || 0;
    const CH4_percent = atmComposition['🥒🌬⛽'] || 0;
    const H2O_percent = atmComposition['🥒🌬💧'] || 0;
    const O2_percent = atmComposition['🥒🌬🌫'] || 0;
    const altitude_km = atmComposition['📏🌬🚀'] || 0;
    const tropopause_km = atmComposition['📏🌬🛩'] || 0;
    
    // Log composition atmosphérique
    console.log(`🌍 [calculateCompositionFromLogoConfig@calculations_atm.js]`);
    console.log(`atm={'📏🌬🚀':${altitude_km.toFixed(0)}, '📏🌬🛩':${tropopause_km.toFixed(0)}, '🥒🌬🌫':${O2_percent.toFixed(3)}, '🥒🌬🏭':${CO2_percent.toFixed(3)}, '🥒🌬💧':${H2O_percent.toFixed(6)}, '🥒🌬⛽':${CH4_percent.toFixed(3)}}`);
    
    // 2. Passer par calculations_h2o.js pour les trucs de l'albedo
    // calculateH2OParameters attend un pourcentage, H2O_percent est déjà en %
    const h2o_from_meteorites = window.h2oTotalFromMeteorites || 0; // Déjà en %
    const h2o_total_percent = H2O_percent + h2o_from_meteorites;
    
    // Calculer les paramètres H2O (vapeur, glace, nuages) avec T0 initial
    // calculateH2OParameters va créer window.h2o automatiquement
    const h2o_params = window.calculateH2OParameters ? window.calculateH2OParameters(window.T0, h2o_total_percent, null) : {
        vapor_fraction: 0,
        ice_fraction: 0,
        cloud_coverage: 0,
        greenhouse_forcing: 0,
        cloud_albedo_contribution: 0,
        max_vapor_fraction: 0
    };
    
    // Note: h2o et albedo seront calculés dans la boucle d'itération avec T0_current
    
    // ============================================================================
    // ITÉRATION DE CALCUL DE FLUX vs CORPS NOIR
    // ============================================================================
    // Principe : Équilibre radiatif entre flux entrant (solaire) et flux sortant (corps noir)
    //
    // 1. CORPS NOIR (rayonnement thermique) :
    //    - Loi de Stefan-Boltzmann : F = σT⁴
    //    - σ = 5.670374419e-8 W/(m²·K⁴) (constante de Stefan-Boltzmann)
    //    - Le flux sortant est le rayonnement émis par la surface terrestre
    //    - Pour une sphère : surface = 4πR², mais le flux est déjà en W/m²
    //
    // 2. AIRES (surfaces d'échange) :
    //    - Surface terrestre : A_surface = 4πR² ≈ 5.1×10¹⁴ m² (R = 6371 km)
    //    - Le flux est en W/m², donc on travaille directement avec des densités de flux
    //    - Pas besoin de multiplier par la surface pour l'équilibre énergétique
    //
    // 3. TEST D'ARRÊT :
    //    - Précision demandée : precision_K (en K, ex: 0.1K)
    //    - Dérivée de F = σT⁴ : dF/dT = 4σT³
    //    - Pour une variation ΔT = precision_K, la variation de flux est : ΔF = 4σT³ × precision_K
    //    - Tolérance réelle : tolerance = 4σT³ × precision_K (en W/m²)
    //    - Exemple : à T=255K avec precision_K=0.1K → tolerance = 4×5.67e-8×255³×0.1 ≈ 0.38 W/m²
    //    - Condition d'arrêt : |flux_sortant - flux_entrant| <= tolerance
    
    const STEFAN_BOLTZMANN = window.STEFAN_BOLTZMANN || 5.670374419e-8;
    const geo_flux = epoch?.geothermal_flux || null;
    const precision_K = window.convergencePrecision_K || 0.1; // Précision en K (défaut: 0.1K)
    
    // Initialiser les variables d'itération
    let T0_current = window.T0;
    let T0_min = null;
    let T0_max = null;
    let signeDeltaFirst = 0;  // Sera initialisé à la première itération
    let Phase = 'Search';  // Commencer en phase Search pour ajuster T0
    const max_iterations = 3; // 3 itérations pour test
    let iteration = 0;
    
    console.log(`🔄 [computeRadiativeTransfer@calculations_flux.js] Début itération`);
    console.log(`   Précision demandée: ${precision_K}K`);
    console.log(`   T0 initial: ${T0_current.toFixed(2)}K`);
    
    // Boucle d'itération
    while (iteration < max_iterations) {
        iteration++;
        
        // ========================================================================
        // CYCLE : Informations sur l'itération
        // ========================================================================
        // Selon grammar.txt : 🎓⏳ (cardinal + compute), 🌡️⏳ (température + compute), 🌡️🔬📜 (température + tolerance + config)
        window.step0_cycle = {
            '🎓⏳': iteration,  // Numéro du cycle (cardinal + compute origin)
            '🌡️⏳': T0_current,  // Température de départ (température + compute origin)
            '⏳⚧': Phase,  // Phase actuelle (compute + phase)
            '🌡️🔬📜': precision_K  // Précision demandée (température + tolerance + config origin)
        };
        
        // ========================================================================
        // ÉTAPE 1 : Recalculer H2O avec le nouveau T0_current
        // ========================================================================
        const H2O_percent_iter = H2O_percent; // Déjà en %
        const h2o_from_meteorites_iter = window.h2oTotalFromMeteorites || 0; // Déjà en %
        const h2o_total_percent_iter = H2O_percent_iter + h2o_from_meteorites_iter;
        
        // Recalculer les paramètres H2O avec T0_current (crée window.h2o)
        if (window.calculateH2OParameters) {
            window.calculateH2OParameters(T0_current, h2o_total_percent_iter, null);
        }
        
        // Note: step1_h2o supprimé car redondant :
        // - '🥒🌬💧' est déjà dans atm['🥒🌬💧'] (source unique)
        // - '🌡️⏳' est déjà dans step0_cycle['🌡️⏳'] (source unique)
        
        // ========================================================================
        // ÉTAPE 2 : Calculer flux solaire absorbé (albedo + réflexion)
        // ========================================================================
        const enabledStates = window.getEnabledStates ? window.getEnabledStates() : {};
        const h2o_enabled = enabledStates[window.getLogo('H2O_EDS')] || false;
        
        // Calculer albedo (crée window.albedo)
        let albedo_value = 0;
        if (window.calculateAlbedo) {
            albedo_value = window.calculateAlbedo(T0_current, h2o_enabled, geo_flux);
        }
        
        // Utiliser window.soleil si disponible (source unique), sinon calculer depuis solar_intensity
        let SOLAR_CONSTANT;
        let solar_flux_average_wm;
        if (window.soleil && window.soleil['🧲☀️🎱']) {
            // Utiliser les valeurs de window.soleil (source unique)
            SOLAR_CONSTANT = window.soleil['🧲☀️🎱'] * 4; // Reconstruire depuis la moyenne sphérique
            solar_flux_average_wm = window.soleil['🧲☀️🎱'];
        } else {
            // Fallback : calculer depuis solar_intensity de l'époque
            const epoch = window.epoch;
            const solar_intensity = epoch?.solar_intensity || 1.0;
            const SOLAR_CONSTANT_REF = 1361; // W/m² (constante solaire de référence)
            SOLAR_CONSTANT = SOLAR_CONSTANT_REF * solar_intensity;
            solar_flux_average_wm = SOLAR_CONSTANT / 4; // Moyenne sphérique
        }
        
        // Utiliser window.albedo['🥒🪞🎓'] directement (source unique)
        const albedo_from_window = window.albedo?.['🥒🪞🎓'] ?? albedo_value;
        
        const solar_flux_reflected_wm = solar_flux_average_wm * albedo_from_window;
        const flux_solaire_absorbe = solar_flux_average_wm - solar_flux_reflected_wm;
        
        // Objet étape 2 : Flux solaire
        // Note: Utilise window.soleil['🧲☀️🎱'] et window.albedo['🥒🪞🎓'] comme sources uniques
        window.step2_solar = {
            '🧲☀️📜': SOLAR_CONSTANT,  // Constante solaire à 1 UA (W/m²) - depuis solar_intensity (config 📜)
            '🧲☀️🎱': solar_flux_average_wm,  // Flux moyen sphérique (W/m²) - depuis window.soleil si disponible
            '🥒🪞🎓': albedo_from_window,  // Albedo total - depuis window.albedo['🥒🪞🎓'] (source unique)
            '🧲☀️🪞': solar_flux_reflected_wm,  // Flux réfléchi (W/m²) - flux solaire + albedo (réflexion)
            '🧲☀️🔽': flux_solaire_absorbe  // Flux absorbé (W/m²) - flux solaire absorbé
        };
        
        // ========================================================================
        // ÉTAPE 3 : Flux géothermique
        // ========================================================================
        const flux_geothermique = geo_flux || 0;
        
        // Objet étape 3 : Géothermique
        window.step3_geothermal = {
            '🧲🌕🔽': flux_geothermique  // Flux géothermique (W/m²)
        };
        
        // ========================================================================
        // ÉTAPE 4 : Flux entrant total
        // ========================================================================
        // Vérification : flux_entrant doit être la somme exacte de solaire + géothermique
        const flux_entrant_calculated = flux_solaire_absorbe + flux_geothermique;
        const flux_entrant = flux_entrant_calculated;
        
        // Vérification de cohérence
        const expected_sum = flux_solaire_absorbe + flux_geothermique;
        if (Math.abs(flux_entrant - expected_sum) > 0.01) {
            console.error(`   ❌ [ERROR step4] Incohérence flux_entrant: ${flux_entrant.toFixed(2)} ≠ ${flux_solaire_absorbe.toFixed(2)} + ${flux_geothermique > 1000 ? flux_geothermique.toExponential(2) : flux_geothermique.toFixed(2)} = ${expected_sum > 1000 ? expected_sum.toExponential(2) : expected_sum.toFixed(2)}`);
        }
        
        // Log de débogage pour vérifier le calcul
        console.log(`   🔍 [DEBUG step4] flux_solaire_absorbe=${flux_solaire_absorbe.toFixed(2)} W/m², flux_geothermique=${flux_geothermique > 1000 ? flux_geothermique.toExponential(2) : flux_geothermique.toFixed(2)} W/m², flux_entrant=${flux_entrant > 1000 ? flux_entrant.toExponential(2) : flux_entrant.toFixed(2)} W/m²`);
        
        // Objet étape 4 : Flux entrant
        window.step4_fluxIn = {
            '🧲☀️🔽': flux_solaire_absorbe,  // Flux solaire absorbé (W/m²)
            '🧲🌕🔽': flux_geothermique,     // Flux géothermique (W/m²)
            '🧲🔽': flux_entrant  // Flux entrant total = solaire + géothermique (W/m²)
        };
        
        // ========================================================================
        // ÉTAPE 5 : Calculer flux sortant (corps noir : σT⁴ ou spectral si disponible)
        // ========================================================================
        let flux_sortant = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
        let spectral_info = null;
        
        // Si calculateFluxForT0 est disponible, utiliser le calcul spectral
        if (typeof window.calculateFluxForT0 === 'function') {
            try {
                const enabledStates = window.getEnabledStates ? window.getEnabledStates() : {};
                const h2o_enabled = enabledStates[window.getLogo('H2O_EDS')] || false;
                const ch4_enabled = enabledStates[window.getLogo('CH4_EDS')] || false;
                const co2_fraction = CO2_percent / 100;
                const ch4_fraction = CH4_percent / 100;
                
                // Récupérer total_mass depuis window.masses et z_max depuis window.atm
                const total_mass = window.masses?.['🐳🎓'] || window.epoch?.total_atmosphere_mass_kg;
                const z_max_km = window.atm?.['📏🌬🚀'] || 0;
                const z_max = z_max_km * 1000; // Convertir km en mètres
                
                const spectral_result = window.calculateFluxForT0(co2_fraction, T0_current, {
                    h2o_enabled: h2o_enabled,
                    ch4_enabled: ch4_enabled,
                    ch4_fraction: ch4_fraction,
                    z_max: z_max,  // Passer z_max en mètres
                    total_atmosphere_mass_kg: total_mass  // Passer total_mass pour calculateAtmosphereProperties
                });
                
                if (spectral_result && spectral_result.total_flux) {
                    flux_sortant = spectral_result.total_flux;
                    
                    // Calculer les contributions des gaz (réémis vers la terre = EDS)
                    const num_couches = spectral_result.z_range ? spectral_result.z_range.length : 0;
                    const num_plages_spectre = spectral_result.lambda_range ? spectral_result.lambda_range.length : 0;
                    const total_cases = num_couches * num_plages_spectre;
                    
                    // Calculer les contributions par gaz depuis optical_thickness et emitted_flux
                    // Note: Le flux émis est proportionnel à l'épaisseur optique de chaque gaz
                    let contribution_CO2 = 0;
                    let contribution_H2O = 0;
                    let contribution_CH4 = 0;
                    
                    if (spectral_result.emitted_flux && spectral_result.optical_thickness && spectral_result.z_range && spectral_result.lambda_range) {
                        // Pour chaque couche et chaque longueur d'onde, calculer la contribution de chaque gaz
                        for (let i = 0; i < spectral_result.emitted_flux.length; i++) {
                            for (let j = 0; j < spectral_result.emitted_flux[i].length; j++) {
                                const em_flux = spectral_result.emitted_flux[i][j] || 0;
                                const tau_total = spectral_result.optical_thickness[i][j] || 0;
                                
                                if (tau_total > 0 && em_flux > 0) {
                                    // Calculer les épaisseurs optiques individuelles (approximation)
                                    // En réalité, il faudrait les stocker séparément dans calculateFluxForT0
                                    const tau_CO2 = co2_fraction > 0 ? tau_total * (co2_fraction / (co2_fraction + ch4_fraction + (h2o_enabled ? H2O_percent/100 : 0) + 0.001)) : 0;
                                    const tau_H2O = h2o_enabled && H2O_percent > 0 ? tau_total * ((H2O_percent/100) / (co2_fraction + ch4_fraction + H2O_percent/100 + 0.001)) : 0;
                                    const tau_CH4 = ch4_enabled && ch4_fraction > 0 ? tau_total * (ch4_fraction / (co2_fraction + ch4_fraction + (h2o_enabled ? H2O_percent/100 : 0) + 0.001)) : 0;
                                    
                                    // Répartition du flux émis selon les épaisseurs optiques
                                    if (tau_CO2 > 0) contribution_CO2 += em_flux * (tau_CO2 / tau_total);
                                    if (tau_H2O > 0) contribution_H2O += em_flux * (tau_H2O / tau_total);
                                    if (tau_CH4 > 0) contribution_CH4 += em_flux * (tau_CH4 / tau_total);
                                }
                            }
                        }
                    }
                    
                    // Selon grammar.txt : 🎓⏳🌬 (cardinal + compute + atmosphère), 🎓⏳🌈 (cardinal + compute + spectre), 🎓⏳🌬🌈 (cardinal + compute + atmosphère + spectre)
                    // 🎓⏳🌬 = nombre de couches atmosphériques calculées (ex: 1060 couches)
                    // 🎓⏳🌈 = nombre de plages spectrales (longueurs d'onde) (ex: 1000 plages)
                    // 🎓⏳🌬🌈 = total de cases calculées = couches × plages spectrales (ex: 1 060 000 cases)
                    spectral_info = {
                        '🎓⏳🌬': num_couches,  // Nombre de couches atmosphériques (cardinal + compute + atmosphère)
                        '🎓⏳🌈': num_plages_spectre,  // Nombre de plages spectrales (cardinal + compute + spectre)
                        '🎓⏳🌬🌈': total_cases,  // Total cases calculées = couches × plages (cardinal + compute + atmosphère + spectre)
                        '🧲🏭📛': contribution_CO2,  // Contribution CO2 réémis vers la Terre (EDS) - flux + CO2 + EDS (W/m²)
                        '🧲💧📛': contribution_H2O,  // Contribution H2O réémis vers la Terre (EDS) - flux + H2O + EDS (W/m²)
                        '🧲⛽📛': contribution_CH4  // Contribution CH4 réémis vers la Terre (EDS) - flux + CH4 + EDS (W/m²)
                    };
                }
            } catch (error) {
                console.warn(`   ⚠️ Erreur calcul spectral: ${error.message}, utilisation de σT⁴`);
            }
        }
        
        // Objet étape 5 : Flux sortant
        // Selon grammar.txt : 🌡️⏳ (température + compute), 🧲🔼 (flux sortant)
        window.step5_fluxOut = {
            '🌡️⏳': T0_current,  // Température (K) - température + compute origin
            '🧲🔼': flux_sortant  // Flux sortant (W/m²) - spectral si disponible, sinon σT⁴
        };
        
        // Ajouter les infos spectrales si disponibles
        if (spectral_info) {
            window.step5_spectral = spectral_info;
        }
        
        // ========================================================================
        // ÉTAPE 6 : Delta équilibre
        // ========================================================================
        const delta_equilibre = flux_sortant - flux_entrant;
        
        // Objet étape 6 : Delta
        window.step6_delta = {
            '🧲🔼': flux_sortant,  // Flux sortant
            '🧲🔽': flux_entrant,  // Flux entrant
            '🔺🧲': delta_equilibre  // Delta (sortant - entrant)
        };
        
        // ========================================================================
        // ÉTAPE 7 : Tolérance (test d'arrêt)
        // ========================================================================
        // tolerance = 4σT³ × precision_K (dérivée de F = σT⁴)
        const tolerance = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
        
        // Objet étape 7 : Tolérance
        // Selon grammar.txt : 🌡️⏳ (température + compute), 🌡️🔬📜 (précision config), 🧲🔬 (tolérance)
        window.step7_tolerance = {
            '🌡️⏳': T0_current,  // Température (K) - température + compute origin
            '🌡️🔬📜': precision_K,  // Précision demandée (K) - température + tolerance + config origin
            '🧲🔬': tolerance  // Tolérance calculée (W/m²) - flux + tolerance
        };
        
        // ========================================================================
        // CONCLUSION : Résumé de l'itération
        // ========================================================================
        // Selon grammar.txt : 🔘 (boolean), 🌡️⏳ (température + compute), 🔺🧲 (delta flux), 🧲🔬 (tolérance), ⏳⚧ (phase), ⏳🔺 (signeDeltaFirst)
        const convergence_reached = Math.abs(delta_equilibre) <= tolerance;
        window.step8_conclusion = {
            '🔘✅': convergence_reached,  // Convergence atteinte ? (boolean)
            '🌡️⏳': T0_current,  // Température finale du cycle (température + compute origin)
            '🔺🧲': delta_equilibre,  // Delta équilibre (delta + flux)
            '🧲🔬': tolerance,  // Tolérance (flux + tolerance)
            '⏳⚧': Phase,  // Phase finale (compute + phase)
            '⏳🔺': signeDeltaFirst  // Signe delta first (compute + delta)
        };
        
        // 8. Mettre à jour window.fluxState avec les valeurs de l'itération (séparer solaire et géothermique)
        window.fluxState = {
            '⏳🌡️🚩': T0_current,
            '⏳⚧': Phase,
            '⏳🔺': signeDeltaFirst,
            '🧲☀️🔽': flux_solaire_absorbe,  // Flux solaire absorbé (séparé)
            '🧲🌕🔽': flux_geothermique,     // Flux géothermique (séparé)
            '🧲🔼': flux_sortant,            // Flux sortant (corps noir)
            '🔺🧲': delta_equilibre,        // Delta flux (sortant - entrant)
            '🧲🔬': tolerance                // Tolérance (précision pour test d'arrêt) - 🔬 selon grammar.txt
        };
        
        // Ajouter une copie de fluxState et des étapes à l'historique
        window.fluxStateHistory.push({
            fluxState: JSON.parse(JSON.stringify(window.fluxState)),
            step0_cycle: window.step0_cycle ? JSON.parse(JSON.stringify(window.step0_cycle)) : null,
            // step1_h2o supprimé : redondant (🥒🌬💧 dans atm, 🌡️⏳ dans step0_cycle)
            step2_solar: window.step2_solar ? JSON.parse(JSON.stringify(window.step2_solar)) : null,
            step3_geothermal: window.step3_geothermal ? JSON.parse(JSON.stringify(window.step3_geothermal)) : null,
            step4_fluxIn: window.step4_fluxIn ? JSON.parse(JSON.stringify(window.step4_fluxIn)) : null,
            step5_fluxOut: window.step5_fluxOut ? JSON.parse(JSON.stringify(window.step5_fluxOut)) : null,
            step5_spectral: window.step5_spectral ? JSON.parse(JSON.stringify(window.step5_spectral)) : null,
            step6_delta: window.step6_delta ? JSON.parse(JSON.stringify(window.step6_delta)) : null,
            step7_tolerance: window.step7_tolerance ? JSON.parse(JSON.stringify(window.step7_tolerance)) : null,
            step8_conclusion: window.step8_conclusion ? JSON.parse(JSON.stringify(window.step8_conclusion)) : null
        });
        
        // Log des étapes intermédiaires
        // Note: Étape 1 - H2O supprimée (redondante : 🥒🌬💧 dans atm, 🌡️⏳ dans step0_cycle)
        console.log(`   📊 Étape 2 - Flux solaire: step2_solar=${JSON.stringify(window.step2_solar)}`);
        console.log(`   📊 Étape 3 - Géothermique: step3_geothermal=${JSON.stringify(window.step3_geothermal)}`);
        console.log(`   📊 Étape 4 - Flux entrant: step4_fluxIn=${JSON.stringify(window.step4_fluxIn)}`);
        console.log(`   📊 Étape 5 - Flux sortant: step5_fluxOut=${JSON.stringify(window.step5_fluxOut)}`);
        console.log(`   📊 Étape 6 - Delta: step6_delta=${JSON.stringify(window.step6_delta)}`);
        console.log(`   📊 Étape 7 - Tolérance: step7_tolerance=${JSON.stringify(window.step7_tolerance)}`);
        
        // Log de l'itération avec fluxState complet
        console.log(`   Itération ${iteration}: T0=${T0_current.toFixed(2)}K, flux_entrant=${flux_entrant.toFixed(2)} W/m², flux_sortant=${flux_sortant.toFixed(2)} W/m², delta=${delta_equilibre.toFixed(2)} W/m², tolerance=${tolerance.toFixed(2)} W/m²`);
        console.log(`   fluxState={'⏳🌡️🚩':${T0_current.toFixed(2)}, '⏳⚧':'${Phase}', '⏳🔺':${signeDeltaFirst.toFixed(2)}, '🧲☀️🔽':${flux_solaire_absorbe.toFixed(2)}, '🧲🌕🔽':${flux_geothermique > 1000 ? flux_geothermique.toExponential(2) : flux_geothermique.toFixed(2)}, '🧲🔼':${flux_sortant > 1000 ? flux_sortant.toExponential(2) : flux_sortant.toFixed(2)}, '🔺🧲':${delta_equilibre > 1000 ? delta_equilibre.toExponential(2) : delta_equilibre.toFixed(2)}, '🧲🔬':${tolerance.toFixed(2)}}`);
        if (window.h2o) {
            // Note: 💧 (H2O vapeur %) est dans atm['🥒🌬💧'] - source unique, pas de duplication
            // Note: 🌴 (greenhouse forcing) est dans step5_spectral['🧲💧📛'], 🌤 (cloud albedo) est dans window.albedo['🥒🪞⛅']
            console.log(`   h2o={'🥒💧🧊':${(window.h2o['🥒💧🧊'] || 0).toFixed(2)}, '🥒💧⛅':${(window.h2o['🥒💧⛅'] || 0).toFixed(2)}, '🥒💧🌊':${(window.h2o['🥒💧🌊'] || 0).toFixed(2)}, '⏳🌧':${(window.h2o['⏳🌧'] || 0).toFixed(2)}}`);
        }
        if (window.albedo) {
            // Selon grammar.txt : albedo={'🥒🪞🎓':0.05, '🥒🪞🌋':1.00, '🥒🪞🌊':0.00, '🥒🪞🌳':0.00, '🥒🪞🏖':0.00, '🥒🪞🧊':0.00, '🥒🪞⛅':0.05}
            console.log(`   albedo={'🥒🪞🎓':${(window.albedo['🥒🪞🎓'] || 0).toFixed(2)}, '🥒🪞🌋':${(window.albedo['🥒🪞🌋'] || 0).toFixed(2)}, '🥒🪞🌊':${(window.albedo['🥒🪞🌊'] || 0).toFixed(2)}, '🥒🪞🌳':${(window.albedo['🥒🪞🌳'] || 0).toFixed(2)}, '🥒🪞🏖':${(window.albedo['🥒🪞🏖'] || 0).toFixed(2)}, '🥒🪞🧊':${(window.albedo['🥒🪞🧊'] || 0).toFixed(2)}, '🥒🪞⛅':${(window.albedo['🥒🪞⛅'] || 0).toFixed(2)}}`);
        }
        
        // 8. Test d'arrêt : |delta_equilibre| <= tolerance
        if (Math.abs(delta_equilibre) <= tolerance) {
            console.log(`   ✅ Convergence atteinte après ${iteration} itérations`);
            console.log(`   T0 final: ${T0_current.toFixed(2)}K (${(T0_current - 273.15).toFixed(2)}°C)`);
            console.log(`   Équilibre: |${delta_equilibre.toFixed(2)}| W/m² <= ${tolerance.toFixed(2)} W/m²`);
            break;
        }
        
        // 7. Détecter changement de signe pour passer en Phase="Dicho"
        if (signeDeltaFirst !== 0) {
            const signeDelta = Math.sign(delta_equilibre);
            if (signeDeltaFirst !== signeDelta) {
                // Changement de signe détecté → passer en dichotomie
                Phase = 'Dicho';
                // T0_min sera initialisé à la première itération avec changement de signe
                if (T0_min === null) T0_min = T0_current;
                if (T0_max === null) T0_max = T0_current;
                console.log(`   🔀 Changement de signe détecté → Phase=Dicho (T0_min=${T0_min.toFixed(2)}K, T0_max=${T0_max.toFixed(2)}K)`);
            }
        } else {
            // Première itération : initialiser signeDeltaFirst
            signeDeltaFirst = Math.sign(delta_equilibre);
        }
        
        // 8. Ajuster T0 selon la phase
        if (Phase === 'Search') {
            // Phase Search : ajustement direct proportionnel au delta
            // Sensibilité : dF/dT = 4σT³, donc dT = dF / (4σT³)
            const sensitivity = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3);
            const delta_T = -delta_equilibre / sensitivity; // Négatif car si flux_sortant > flux_entrant, T0 doit diminuer
            const T0_avant = T0_current;
            T0_current += delta_T;
            
            // Limiter T0 à des valeurs physiques raisonnables (Hadéen peut atteindre 2500K+)
            const T0_limite = Math.max(100, Math.min(3000, T0_current));
            if (T0_limite !== T0_current) {
                console.log(`   ⚠️ T0 limité: ${T0_current.toFixed(2)}K → ${T0_limite.toFixed(2)}K`);
            }
            T0_current = T0_limite;
            
            // Log de l'ajustement
            console.log(`   🔧 Ajustement T0 (Phase=Search): T0=${T0_avant.toFixed(2)}K, sensitivity=${sensitivity.toFixed(2)} W/(m²·K), delta_T=${delta_T.toFixed(2)}K → T0_new=${T0_current.toFixed(2)}K`);
        } else if (Phase === 'Dicho') {
            // Phase Dicho : méthode de dichotomie
            if (delta_equilibre > 0) {
                // T0 trop élevé → réduire T0_max
                T0_max = T0_current;
            } else {
                // T0 trop bas → augmenter T0_min
                T0_min = T0_current;
            }
            T0_current = (T0_min + T0_max) / 2;
        }
        
        // 9. Mettre à jour window.T0 pour la prochaine itération
        window.T0 = T0_current;
    }
    
    if (iteration >= max_iterations) {
        console.warn(`   ⚠️ Maximum d'itérations atteint (${max_iterations})`);
    }
    
    // Mettre à jour window.T0 avec la valeur convergée
    window.T0 = T0_current;
    
    // Calculer le flux final (séparer solaire et géothermique)
    const enabledStates_final = window.getEnabledStates ? window.getEnabledStates() : {};
    const h2o_enabled_final = enabledStates_final[window.getLogo('H2O_EDS')] || false;
    const flux_solaire_absorbe_final = window.calculateSolarFluxAbsorbed ? window.calculateSolarFluxAbsorbed(T0_current, h2o_enabled_final, geo_flux) : 238;
    const flux_geothermique_final = geo_flux || 0;
    const flux_entrant_final = flux_solaire_absorbe_final + flux_geothermique_final;
    const flux_sortant_final = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
    const delta_equilibre_final = flux_sortant_final - flux_entrant_final;
    const tolerance_final = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
    
    // Mettre à jour window.fluxState avec les valeurs finales (séparer solaire et géothermique)
    window.fluxState = {
        '⏳🌡️🚩': T0_current,
        '⏳⚧': Phase,
        '⏳🔺': signeDeltaFirst,
        '🧲☀️🔽': flux_solaire_absorbe_final,  // Flux solaire absorbé (séparé)
        '🧲🌕🔽': flux_geothermique_final,     // Flux géothermique (séparé)
        '🧲🔼': flux_sortant_final,            // Flux sortant (corps noir)
        '🔺🧲': delta_equilibre_final,        // Delta flux (sortant - entrant)
        '🧲🔬': tolerance_final                // Tolérance (précision pour test d'arrêt) - 🔬 selon grammar.txt
    };
    
    // Créer window.flux (pour l'affichage simplifié)
    window.flux = { 
        '🧲☀️🔽': flux_solaire_absorbe_final,  // Flux solaire absorbé
        '🧲🌕🔽': flux_geothermique_final,     // Flux géothermique
        '🧲🔼': flux_sortant_final              // Flux sortant (corps noir)
    };
    
    // Log flux radiatif final
    console.log(`☀️ [computeRadiativeTransfer@calculations_flux.js]`);
    console.log(`flux={'🧲☀️🔽':${flux_solaire_absorbe_final.toFixed(2)}, '🧲🌕🔽':${flux_geothermique_final.toFixed(2)}, '🧲🔼':${flux_sortant_final.toFixed(2)}}`);
    
    // Retourner les résultats
    return Promise.resolve({
        T0: window.T0,
        h2o_result: window.h2o || {},
        albedo_result: window.flux || {},
        atm_result: {},
        atm_composition: window.atm || {},
        Phase: Phase,
        signeDeltaFirst: signeDeltaFirst,
        iterations: iteration
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

