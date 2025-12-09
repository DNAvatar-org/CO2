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
// dateConfig est maintenant window.ALL_DATA (source unique de vérité)
function calculateT0(dateConfig) {
    // dateConfig est maintenant ALL_DATA directement
    const ALL_DATA = window.ALL_DATA;
    const ALL_DESC = window.ALL_DESC;
    
    if (!ALL_DATA.DATE_CONFIG.T0_CONFIG || ALL_DATA.DATE_CONFIG.T0_CONFIG <= 0) {
        console.error(`${window.getLogo('EDS')} [calculateT0@calculations_flux.js] ❌ t0_config invalide: ${ALL_DATA.DATE_CONFIG.T0_CONFIG}`);
        return null;
    }
    
    // Logique selon la sémantique :
    // (!🔘🎬) => ⏳🌡️🚩 = 🌡️⏳📜  (si animation désactivée, T0 calculé = T0 config)
    // (🔘🎬) => ⏳🌡️🚩 = 🌡️🏮     (si animation activée, T0 calculé = old_T0)
    let adjustment = 0;
    if (ALL_DATA.DATE_CONFIG.DELTA_TEMP_TIC_TIME) adjustment += ALL_DATA.DATE_CONFIG.DELTA_TEMP_TIC_TIME * ALL_DATA.DATE_CONFIG.TIC_TIME_COUNT;
    
    ALL_DATA.CONVERGENCE.T0 = (ALL_DATA.ENABLED_STATES.ANIMATION ? ALL_DATA.CONVERGENCE.OLD_T0 : ALL_DATA.DATE_CONFIG.T0_CONFIG) + adjustment;        // T0 calculé (température)
    
    if (ALL_DATA.CONVERGENCE.T0 <= 0) {
        console.error(`${window.getLogo('EDS')} [calculateT0@calculations_flux.js] ❌ T0 invalide: ${ALL_DATA.CONVERGENCE.T0}`);
        return null;
    }
    
    // Initialiser ALL_DATA directement (sera complété dans computeRadiativeTransfer)
    ALL_DATA.CONVERGENCE.PHASE = 'None';       // Phase (None/Search/Dicho)
    ALL_DATA.CONVERGENCE.DIRECTION = 0;           // direction (signe: -1, 0, 1 - pas d'unité physique)
    ALL_DATA.FLUX.SOLAR_ABSORBED = 0;         // Flux solaire absorbé (W/m²)
    ALL_DATA.FLUX.GEOTHERMAL_IN = 0;         // Flux géothermique (W/m²)
    ALL_DATA.FLUX.OUT = 0;            // Flux sortant (W/m²)
    ALL_DATA.FLUX.DELTA = 0;           // Delta flux (W/m²)
    ALL_DATA.CONVERGENCE.TOLERANCE = 0;            // Tolérance (W/m²)
    
    // Log T0
    console.log(`🌡️ T0 [calculateT0@calculations_flux.js]`);
    console.log(`T0 initial: ${ALL_DATA.CONVERGENCE.T0.toFixed(2)}K`);
    
    return ALL_DATA.CONVERGENCE.T0;
}

// Fonction pour réinitialiser les variables lors d'un changement de date
function newDate() {
    Phase = "Search";
    signeDeltaFirst = 0;
}

// Fonction helper pour récupérer les valeurs de gaz depuis ALL_DATA
function getGasValuesFromConfig() {
    const ALL_DATA = window.ALL_DATA;
    const ALL_DESC = window.ALL_DESC;
    
    let CO2_ppm = 0;
    let CH4_ppm = 0;
    let H2O_percent = 0;
    
    // Convertir co2_kg, ch4_kg, h2o_kg en ppm/%
    if (ALL_DATA.EPOCH.co2_kg > 0 && window.co2KgToFraction && ALL_DATA.EPOCH.total_atmosphere_mass_kg) {
        const molar_mass_air = window.calculateMolarMassAir ? window.calculateMolarMassAir(ALL_DATA.EPOCH) : 0.029;
        const co2_fraction = window.co2KgToFraction(ALL_DATA.EPOCH.co2_kg, ALL_DATA.EPOCH.total_atmosphere_mass_kg, molar_mass_air);
        CO2_ppm = co2_fraction * 1e6;
    }
    if (ALL_DATA.EPOCH.ch4_kg > 0 && window.ch4KgToFraction && ALL_DATA.EPOCH.total_atmosphere_mass_kg) {
        const molar_mass_air = window.calculateMolarMassAir ? window.calculateMolarMassAir(ALL_DATA.EPOCH) : 0.029;
        const ch4_fraction = window.ch4KgToFraction(ALL_DATA.EPOCH.ch4_kg, ALL_DATA.EPOCH.total_atmosphere_mass_kg, molar_mass_air);
        CH4_ppm = ch4_fraction * 1e6;
    }
    if (ALL_DATA.EPOCH.h2o_kg > 0 && ALL_DATA.EPOCH.total_atmosphere_mass_kg) {
        H2O_percent = (ALL_DATA.EPOCH.h2o_kg / ALL_DATA.EPOCH.total_atmosphere_mass_kg) * 100;
    }
    
    return { CO2_ppm, CH4_ppm, H2O_percent, co2_kg: ALL_DATA.EPOCH.co2_kg, ch4_kg: ALL_DATA.EPOCH.ch4_kg, h2o_kg: ALL_DATA.EPOCH.h2o_kg };
}

function computeRadiativeTransfer(options = {}) {
    // Réinitialiser l'historique des itérations
    window.fluxStateHistory = [];
    
    // 0. Calculer les valeurs du soleil et du noyau
    if (window.getSoleil) window.getSoleil();
    if (window.getNoyau) window.getNoyau();
    
    getEpochDateConfig();
    // 🎥:true 🏮:180.00K (-93.1°C) 🌡️:255.00K (-18.1°C), ☄️:0, 🌡️☄️:-3.5K, 💫:0, 🌡️💫:0K
    if (!calculateT0()) return Promise.reject(new Error('T0 invalide'));
    
    // Wrappers pour éviter window abusifs
    const ALL_DATA = window.ALL_DATA;
    const ALL_DESC = window.ALL_DESC;
    
    // 2. Passer par calculations_atm.js pour avoir la densité et les %/ppm utilisés pour EDS
    // calculateCompositionFromLogoConfig() prend dateConfig (qui est maintenant ALL_DATA) et retourne les fractions molaires
    const atmComposition = window.calculateCompositionFromLogoConfig(ALL_DATA, ALL_DATA.MASSES.TOTAL, ALL_DATA.EPOCH);
    
    // Mettre à jour ALL_DATA avec la composition atmosphérique
    ALL_DATA.ATM.CO2 = atmComposition[ALL_DATA.ATM.CO2];
    ALL_DATA.ATM.CH4 = atmComposition[ALL_DATA.ATM.CH4];
    ALL_DATA.ATM.H2O = atmComposition[ALL_DATA.ATM.H2O];
    ALL_DATA.ATM.O2 = atmComposition[ALL_DATA.ATM.O2];
    ALL_DATA.ATM.ALTITUDE = atmComposition[ALL_DATA.ATM.ALTITUDE];
    ALL_DATA.ATM.TROPOPAUSE = atmComposition[ALL_DATA.ATM.TROPOPAUSE];
    
    // Log composition atmosphérique
    console.log(`🌍 [calculateCompositionFromLogoConfig@calculations_atm.js]`);
    console.log(`atm={'${ALL_DATA.ATM.ALTITUDE}':${ALL_DATA.ATM.ALTITUDE.toFixed(0)}, '${ALL_DATA.ATM.TROPOPAUSE}':${ALL_DATA.ATM.TROPOPAUSE.toFixed(0)}, '${ALL_DATA.ATM.O2}':${ALL_DATA.ATM.O2.toFixed(3)}, '${ALL_DATA.ATM.CO2}':${ALL_DATA.ATM.CO2.toFixed(3)}, '${ALL_DATA.ATM.H2O}':${ALL_DATA.ATM.H2O.toFixed(6)}, '${ALL_DATA.ATM.CH4}':${ALL_DATA.ATM.CH4.toFixed(3)}}`);
    
    // 2. Passer par calculations_h2o.js pour les trucs de l'albedo
    // calculateH2OParameters attend un pourcentage, ALL_DATA.ATM.H2O est déjà en %
    const h2o_total_percent = ALL_DATA.ATM.H2O + window.h2oTotalFromMeteorites;
    
    // Calculer les paramètres H2O (vapeur, glace, nuages) avec T0 initial
    // calculateH2OParameters va créer window.h2o automatiquement
    const h2o_params = window.calculateH2OParameters ? window.calculateH2OParameters(ALL_DATA.CONVERGENCE.T0, h2o_total_percent, null) : {
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
    
    // Initialiser les variables d'itération
    let T0_current = ALL_DATA.CONVERGENCE.T0;
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
            [window.getLogoKey('CARDINAL', 'COMPUTE')]: iteration,  // Numéro du cycle (cardinal + compute origin)
            [window.getLogoKey('TEMP', 'COMPUTE')]: T0_current,  // Température de départ (température + compute origin)
            [window.getLogoKey('COMPUTE', 'PHASE')]: Phase,  // Phase actuelle (compute + phase)
            [window.getLogoKey('TEMP', 'TOLERANCE', 'CONFIG')]: precision_K  // Précision demandée (température + tolerance + config origin)
        };
        
        // ========================================================================
        // ÉTAPE 1 : Recalculer H2O avec le nouveau T0_current
        // ========================================================================
        // Recalculer les paramètres H2O avec T0_current (crée window.h2o)
        if (window.calculateH2OParameters) {
            window.calculateH2OParameters(T0_current, ALL_DATA.ATM.H2O + window.h2oTotalFromMeteorites, null);
        }
        
        // Note: step1_h2o supprimé car redondant :
        // - '🥒🌬💧' est déjà dans atm['🥒🌬💧'] (source unique)
        // - '🌡️⏳' est déjà dans step0_cycle['🌡️⏳'] (source unique)
        
        // ========================================================================
        // ÉTAPE 2 : Calculer flux solaire absorbé (albedo + réflexion)
        // ========================================================================
        // IMPORTANT : Utiliser window.calculateSolarFluxAbsorbed() comme fonction commune
        // pour garantir la cohérence avec le calcul final (même fonction, même logique)
        const h2o_enabled = window.getEnabledStates()[window.getLogo('H2O_EDS')];
        
        // Calculer albedo (crée window.albedo) - nécessaire pour step2_solar
        if (window.calculateAlbedo) {
            window.calculateAlbedo(T0_current, h2o_enabled, ALL_DATA.EPOCH.geothermal_flux);
        }
        
        // Utiliser la fonction commune calculateSolarFluxAbsorbed() (source unique)
        const flux_solaire_absorbe = window.calculateSolarFluxAbsorbed ? 
            window.calculateSolarFluxAbsorbed(T0_current, h2o_enabled, ALL_DATA.EPOCH.geothermal_flux) : 
            238; // Fallback
        
        // Récupérer les valeurs pour step2_solar depuis ALL_DATA (sources uniques)
        let SOLAR_CONSTANT;
        let solar_flux_average_wm;
        const SOLEIL = ALL_DATA.SOLEIL;
        if (ALL_DATA.SOLEIL.GEOMETRY_ORIGIN) {
            // Utiliser les valeurs de ALL_DATA (source unique)
            SOLAR_CONSTANT = ALL_DATA.SOLEIL.GEOMETRY_ORIGIN * 4; // Reconstruire depuis la moyenne sphérique
            solar_flux_average_wm = ALL_DATA.SOLEIL.GEOMETRY_ORIGIN;
        } else {
            // Fallback : calculer depuis solar_intensity de l'époque
            SOLAR_CONSTANT = ALL_DATA.CONSTANTS.SOLAR_CONSTANT_REF * ALL_DATA.EPOCH.solar_intensity;
            solar_flux_average_wm = SOLAR_CONSTANT / 4; // Moyenne sphérique
        }
        
        const solar_flux_reflected_wm = solar_flux_average_wm * ALL_DATA.ALBEDO.TOTAL;
        
        // Objet étape 2 : Flux solaire
        // IMPORTANT : Utilise window.calculateSolarFluxAbsorbed() pour garantir la cohérence
        // Note: Utilise ALL_DATA.SOLEIL et ALL_DATA.ALBEDO comme sources uniques
        window.step2_solar = {
            [SOLEIL.CONSTANT]: SOLAR_CONSTANT,  // Constante solaire à 1 UA (W/m²) - depuis solar_intensity (config 📜)
            [SOLEIL.GEOMETRY_ORIGIN]: solar_flux_average_wm,  // Flux moyen sphérique (W/m²) - depuis ALL si disponible
            [ALL_DATA.ALBEDO.TOTAL]: ALL_DATA.ALBEDO.TOTAL,  // Albedo total - depuis ALL_DATA.ALBEDO.TOTAL (source unique)
            [ALL_DATA.FLUX.REFLECTED]: solar_flux_reflected_wm,  // Flux réfléchi (W/m²) - flux solaire + albedo (réflexion)
            [ALL_DATA.FLUX.SOLAR_ABSORBED]: flux_solaire_absorbe  // Flux absorbé (W/m²) - depuis calculateSolarFluxAbsorbed() (fonction commune)
        };
        
        // ========================================================================
        // ÉTAPE 3 : Flux géothermique
        // ========================================================================
        // Objet étape 3 : Géothermique
        window.step3_geothermal = {
            [ALL_DATA.FLUX.GEOTHERMAL_IN]: ALL_DATA.EPOCH.geothermal_flux  // Flux géothermique (W/m²)
        };
        
        // ========================================================================
        // ÉTAPE 4 : Flux entrant total
        // ========================================================================
        // Vérification : flux_entrant doit être la somme exacte de solaire + géothermique
        const flux_entrant = flux_solaire_absorbe + ALL_DATA.EPOCH.geothermal_flux;
        
        // Vérification de cohérence
        const expected_sum = flux_solaire_absorbe + flux_geothermique;
        if (Math.abs(flux_entrant - expected_sum) > 0.01) {
            console.error(`   ❌ [ERROR step4] Incohérence flux_entrant: ${flux_entrant.toFixed(2)} ≠ ${flux_solaire_absorbe.toFixed(2)} + ${flux_geothermique > 1000 ? flux_geothermique.toExponential(2) : flux_geothermique.toFixed(2)} = ${expected_sum > 1000 ? expected_sum.toExponential(2) : expected_sum.toFixed(2)}`);
        }
        
        // Log de débogage pour vérifier le calcul
        console.log(`   🔍 [DEBUG step4] flux_solaire_absorbe=${flux_solaire_absorbe.toFixed(2)} W/m², flux_geothermique=${flux_geothermique > 1000 ? flux_geothermique.toExponential(2) : flux_geothermique.toFixed(2)} W/m², flux_entrant=${flux_entrant > 1000 ? flux_entrant.toExponential(2) : flux_entrant.toFixed(2)} W/m²`);
        
        // Objet étape 4 : Flux entrant
        const FLUX = ALL_DATA.FLUX;
        window.step4_fluxIn = {
            [FLUX.SOLAR_ABSORBED]: flux_solaire_absorbe,  // Flux solaire absorbé (W/m²)
            [FLUX.GEOTHERMAL_IN]: flux_geothermique,     // Flux géothermique (W/m²)
            [window.getLogoKey('ENERGY_FLUX', 'FLUX_IN')]: flux_entrant  // Flux entrant total = solaire + géothermique (W/m²)
        };
        
        // ========================================================================
        // ÉTAPE 5 : Calculer flux sortant (corps noir : σT⁴ ou spectral si disponible)
        // ========================================================================
        // IMPORTANT : Le flux sortant dans step5_fluxOut est le flux ÉMIS PAR LA SURFACE (avant EDS)
        // C'est le flux corps noir : σT⁴ (ou earth_flux_total du calcul spectral)
        let flux_sortant_surface = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
        let flux_sortant_effectif = flux_sortant_surface; // Par défaut, égal au flux surface (pas d'EDS)
        let spectral_info = null;
        
        // Si calculateFluxForT0 est disponible, utiliser le calcul spectral
        if (typeof window.calculateFluxForT0 === 'function') {
            try {
                const enabledStates = window.getEnabledStates ? window.getEnabledStates() : {};
                const h2o_enabled = enabledStates[window.getLogo('H2O_EDS')];
                const ch4_enabled = enabledStates[window.getLogo('CH4_EDS')];
                const co2_fraction = CO2_percent / 100;
                const ch4_fraction = CH4_percent / 100;
                
                // Récupérer total_mass depuis ALL_DATA et z_max depuis ALL_DATA
                const total_mass = ALL_DATA.MASSES.TOTAL;
                const z_max_km = ALL_DATA.ATM.ALTITUDE;
                const z_max = z_max_km * 1000; // Convertir km en mètres
                
                const spectral_result = window.calculateFluxForT0(co2_fraction, T0_current, {
                    h2o_enabled: h2o_enabled,
                    ch4_enabled: ch4_enabled,
                    ch4_fraction: ch4_fraction,
                    z_max: z_max,  // Passer z_max en mètres
                    total_atmosphere_mass_kg: total_mass  // Passer total_mass pour calculateAtmosphereProperties
                });
                
                if (spectral_result) {
                    // Flux émis par la surface (AVANT EDS) = earth_flux_total
                    const earth_flux_total = spectral_result.earth_flux ? 
                        spectral_result.earth_flux.reduce((sum, val) => sum + val, 0) : 
                        flux_sortant_surface;
                    flux_sortant_surface = earth_flux_total;
                    
                    // Flux sortant effectif (APRÈS EDS) = total_flux au sommet de l'atmosphère
                    if (spectral_result.total_flux) {
                        flux_sortant_effectif = spectral_result.total_flux;
                    }
                    
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
                                const em_flux = spectral_result.emitted_flux[i][j];
                                const tau_total = spectral_result.optical_thickness[i][j];
                                
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
                        [window.getLogoKey('CARDINAL', 'COMPUTE', 'ATMOSPHERE')]: num_couches,  // Nombre de couches atmosphériques (cardinal + compute + atmosphère)
                        [window.getLogoKey('CARDINAL', 'COMPUTE', 'SPECTRAL')]: num_plages_spectre,  // Nombre de plages spectrales (cardinal + compute + spectre)
                        [window.getLogoKey('CARDINAL', 'COMPUTE', 'ATMOSPHERE', 'SPECTRAL')]: total_cases,  // Total cases calculées = couches × plages (cardinal + compute + atmosphère + spectre)
                        [window.getLogoKey('ENERGY_FLUX', 'CO2', 'EDS')]: contribution_CO2,  // Contribution CO2 réémis vers la Terre (EDS) - flux + CO2 + EDS (W/m²)
                        [window.getLogoKey('ENERGY_FLUX', 'H2O', 'EDS')]: contribution_H2O,  // Contribution H2O réémis vers la Terre (EDS) - flux + H2O + EDS (W/m²)
                        [window.getLogoKey('ENERGY_FLUX', 'CH4', 'EDS')]: contribution_CH4  // Contribution CH4 réémis vers la Terre (EDS) - flux + CH4 + EDS (W/m²)
                    };
                }
            } catch (error) {
                console.warn(`   ⚠️ Erreur calcul spectral: ${error.message}, utilisation de σT⁴`);
            }
        }
        
        // Objet étape 5 : Flux sortant
        // Selon grammar.txt : 🌡️⏳ (température + compute), 🧲🔼 (flux sortant)
        // IMPORTANT : 🧲🔼 = flux émis par la surface (AVANT EDS), pas le flux effectif après EDS
        window.step5_fluxOut = {
            [window.getLogoKey('TEMP', 'COMPUTE')]: T0_current,  // Température (K) - température + compute origin
            [window.getLogoKey('ENERGY_FLUX', 'FLUX_CN', 'FLUX_OUT')]: flux_sortant_surface  // Flux sortant surface (W/m²)
        };
        
        // Ajouter les infos spectrales si disponibles
        if (spectral_info) {
            window.step5_spectral = spectral_info;
        }
        
        // ========================================================================
        // ÉTAPE 6 : Delta équilibre
        // ========================================================================
        // IMPORTANT : Pour l'équilibre, on compare flux_entrant avec flux_sortant_effectif (après EDS)
        // Le flux_sortant_surface est affiché pour information (corps noir pur)
        const delta_equilibre = flux_sortant_effectif - flux_entrant;
        
        // Objet étape 6 : Delta
        // IMPORTANT : 🧲🔼 dans step6_delta = flux_sortant_effectif (après EDS) pour l'équilibre
        window.step6_delta = {
            [window.getLogoKey('ENERGY_FLUX', 'FLUX_CN', 'FLUX_OUT')]: flux_sortant_effectif,  // Flux sortant effectif (après EDS)
            [window.getLogoKey('ENERGY_FLUX', 'FLUX_IN')]: flux_entrant,  // Flux entrant
            [window.getLogoKey('DELTA', 'ENERGY_FLUX')]: delta_equilibre  // Delta (sortant effectif - entrant)
        };
        
        // ========================================================================
        // ÉTAPE 7 : Tolérance (test d'arrêt)
        // ========================================================================
        // tolerance = 4σT³ × precision_K (dérivée de F = σT⁴)
        ALL_DATA.CONVERGENCE.TOLERANCE = 4 * ALL_DATA.CONSTANTS.STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * window.convergencePrecision_K;
        
        // Objet étape 7 : Tolérance
        // Selon grammar.txt : 🌡️⏳ (température + compute), 🌡️🔬📜 (précision config), 🧲🔬 (tolérance)
        window.step7_tolerance = {
            [window.getLogoKey('TEMP', 'COMPUTE')]: T0_current,  // Température (K) - température + compute origin
            [window.getLogoKey('TEMP', 'TOLERANCE', 'CONFIG')]: window.convergencePrecision_K,  // Précision demandée (K) - température + tolerance + config origin
            [ALL_DATA.CONVERGENCE.TOLERANCE]: ALL_DATA.CONVERGENCE.TOLERANCE  // Tolérance calculée (W/m²) - flux + tolerance
        };
        
        // ========================================================================
        // CONCLUSION : Résumé de l'itération
        // ========================================================================
        // Selon grammar.txt : 🔘 (boolean), 🌡️⏳ (température + compute), 🔺🧲 (delta flux), 🧲🔬 (tolérance), ⏳⚧ (phase), ⏳🍴 (signeDeltaFirst)
        window.step8_conclusion = {
            [window.getLogo('BOOLEAN') + '✅']: Math.abs(ALL_DATA.FLUX.DELTA) <= ALL_DATA.CONVERGENCE.TOLERANCE,  // Convergence atteinte ? (boolean) - ✅ n'est pas dans LOGOS, ajouté manuellement
            [window.getLogoKey('TEMP', 'COMPUTE')]: T0_current,  // Température finale du cycle (température + compute origin)
            [window.getLogoKey('DELTA', 'ENERGY_FLUX')]: ALL_DATA.FLUX.DELTA,  // Delta équilibre (delta + flux)
            [ALL_DATA.CONVERGENCE.TOLERANCE]: ALL_DATA.CONVERGENCE.TOLERANCE,  // Tolérance (flux + tolerance)
            [ALL_DATA.CONVERGENCE.PHASE]: Phase,  // Phase finale (compute + phase)
            [ALL_DATA.CONVERGENCE.DIRECTION]: signeDeltaFirst  // Direction (compute + direction)
        };
        
        // 8. Mettre à jour ALL_DATA avec les valeurs de l'itération (séparer solaire et géothermique)
        // IMPORTANT : 🧲🔼 dans ALL_DATA = flux_sortant_surface (AVANT EDS) pour cohérence avec step5_fluxOut
        ALL_DATA.CONVERGENCE.T0 = T0_current;
        ALL_DATA.CONVERGENCE.PHASE = Phase;
        ALL_DATA.CONVERGENCE.DIRECTION = signeDeltaFirst;
        ALL_DATA.FLUX.SOLAR_ABSORBED = flux_solaire_absorbe;  // Flux solaire absorbé (séparé)
        ALL_DATA.FLUX.GEOTHERMAL_IN = ALL_DATA.EPOCH.geothermal_flux;     // Flux géothermique (séparé)
        ALL_DATA.FLUX.OUT = flux_sortant_surface;     // Flux sortant surface (AVANT EDS)
        ALL_DATA.FLUX.DELTA = flux_sortant_effectif - flux_entrant;        // Delta flux (sortant effectif - entrant) - utilise flux_sortant_effectif
        
        // Ajouter une copie de ALL_DATA et des étapes à l'historique
        window.fluxStateHistory.push({
            fluxState: JSON.parse(JSON.stringify({
                [ALL_DATA.CONVERGENCE.T0]: ALL_DATA.CONVERGENCE.T0,
                [ALL_DATA.CONVERGENCE.PHASE]: ALL_DATA.CONVERGENCE.PHASE,
                [ALL_DATA.CONVERGENCE.DIRECTION]: ALL_DATA.CONVERGENCE.DIRECTION,
                [ALL_DATA.FLUX.SOLAR_ABSORBED]: ALL_DATA.FLUX.SOLAR_ABSORBED,
                [ALL_DATA.FLUX.GEOTHERMAL_IN]: ALL_DATA.FLUX.GEOTHERMAL_IN,
                [ALL_DATA.FLUX.OUT]: ALL_DATA.FLUX.OUT,
                [ALL_DATA.FLUX.DELTA]: ALL_DATA.FLUX.DELTA,
                [ALL_DATA.CONVERGENCE.TOLERANCE]: ALL_DATA.CONVERGENCE.TOLERANCE
            })),
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
        // IMPORTANT : flux_sortant_surface = flux émis par la surface (AVANT EDS), flux_sortant_effectif = flux après EDS
        console.log(`   Itération ${iteration}: T0=${T0_current.toFixed(2)}K, flux_entrant=${flux_entrant.toFixed(2)} W/m², flux_sortant_surface=${flux_sortant_surface > 1000 ? flux_sortant_surface.toExponential(2) : flux_sortant_surface.toFixed(2)} W/m², flux_sortant_effectif=${flux_sortant_effectif > 1000 ? flux_sortant_effectif.toExponential(2) : flux_sortant_effectif.toFixed(2)} W/m², delta=${delta_equilibre > 1000 ? delta_equilibre.toExponential(2) : delta_equilibre.toFixed(2)} W/m², tolerance=${tolerance.toFixed(2)} W/m²`);
        const signeDeltaFirst_key = ALL_DATA.CONVERGENCE.DIRECTION;
        console.log(`   fluxState={'${ALL_DATA.CONVERGENCE.T0}':${T0_current.toFixed(2)}, '${ALL_DATA.CONVERGENCE.PHASE}':'${Phase}', '${signeDeltaFirst_key}':${signeDeltaFirst.toFixed(2)}, '${ALL_DATA.FLUX.SOLAR_ABSORBED}':${flux_solaire_absorbe.toFixed(2)}, '${ALL_DATA.FLUX.GEOTHERMAL_IN}':${flux_geothermique > 1000 ? flux_geothermique.toExponential(2) : flux_geothermique.toFixed(2)}, '${ALL_DATA.FLUX.OUT}':${flux_sortant_surface > 1000 ? flux_sortant_surface.toExponential(2) : flux_sortant_surface.toFixed(2)}, '${ALL_DATA.FLUX.DELTA}':${delta_equilibre > 1000 ? delta_equilibre.toExponential(2) : delta_equilibre.toFixed(2)}, '${ALL_DATA.CONVERGENCE.TOLERANCE}':${tolerance.toFixed(2)}}`);
        if (window.h2o) {
            // Note: 💧 (H2O vapeur %) est dans atm['🥒🌬💧'] - source unique, pas de duplication
            // Note: 🌴 (greenhouse forcing) est dans step5_spectral['🧲💧📛'], 🌤 (cloud albedo) est dans window.albedo['🥒🪞⛅']
            console.log(`   h2o={'🥒💧🧊':${window.h2o['🥒💧🧊'].toFixed(2)}, '🥒💧⛅':${window.h2o['🥒💧⛅'].toFixed(2)}, '🥒💧🌊':${window.h2o['🥒💧🌊'].toFixed(2)}, '⏳🌧':${window.h2o['⏳🌧'].toFixed(2)}}`);
        }
        // Utiliser ALL_DATA pour l'albedo (source unique)
        // Selon grammar.txt : albedo={'🥒🪞🎓':0.05, '🥒🪞🌋':1.00, '🥒🪞🌊':0.00, '🥒🪞🌳':0.00, '🥒🪞🏖':0.00, '🥒🪞🧊':0.00, '🥒🪞⛅':0.05}
        console.log(`   albedo={'${ALL_DATA.ALBEDO.TOTAL}':${ALL_DATA.ALBEDO.TOTAL.toFixed(2)}, '${ALL_DATA.ALBEDO.VOLCANO}':${ALL_DATA.ALBEDO.VOLCANO.toFixed(2)}, '${ALL_DATA.ALBEDO.OCEAN}':${ALL_DATA.ALBEDO.OCEAN.toFixed(2)}, '${ALL_DATA.ALBEDO.FOREST}':${ALL_DATA.ALBEDO.FOREST.toFixed(2)}, '${ALL_DATA.ALBEDO.DESERT}':${ALL_DATA.ALBEDO.DESERT.toFixed(2)}, '${ALL_DATA.ALBEDO.ICE}':${ALL_DATA.ALBEDO.ICE.toFixed(2)}, '${ALL_DATA.ALBEDO.CLOUD}':${ALL_DATA.ALBEDO.CLOUD.toFixed(2)}}`);
        
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
        
        // 10. IMPORTANT : Recalculer h2o et albedo à la fin du cycle (après ajustement de T0)
        // pour le cycle suivant - garantit la cohérence avec le nouveau T0
        if (iteration < max_iterations) { // Pas besoin de recalculer si c'est la dernière itération
            const enabledStates_next = window.getEnabledStates ? window.getEnabledStates() : {};
            const h2o_enabled_next = enabledStates_next[window.getLogo('H2O_EDS')];
            
            // Recalculer h2o avec le nouveau T0_current pour le prochain cycle
            const h2o_total_percent_next = H2O_percent + window.h2oTotalFromMeteorites;
            if (window.calculateH2OParameters) {
                window.calculateH2OParameters(T0_current, h2o_total_percent_next, null);
            }
            
            // Recalculer albedo avec le nouveau T0_current pour le prochain cycle
            if (window.calculateAlbedo) {
                window.calculateAlbedo(T0_current, h2o_enabled_next, geo_flux);
            }
            
            console.log(`   🔄 Recalcul h2o et albedo pour cycle suivant (T0=${T0_current.toFixed(2)}K)`);
        }
    }
    
    if (iteration >= max_iterations) {
        console.warn(`   ⚠️ Maximum d'itérations atteint (${max_iterations})`);
    }
    
    // Mettre à jour window.T0 avec la valeur convergée
    window.T0 = T0_current;
    
    // Calculer le flux final (séparer solaire et géothermique)
    // IMPORTANT : flux_sortant_final = flux émis par la surface (AVANT EDS) = σT⁴
    // Pour l'équilibre, on utilise le flux_sortant_effectif (après EDS) depuis la dernière itération
    const enabledStates_final = window.getEnabledStates ? window.getEnabledStates() : {};
    const h2o_enabled_final = enabledStates_final[window.getLogo('H2O_EDS')];
    const flux_solaire_absorbe_final = window.calculateSolarFluxAbsorbed(T0_current, h2o_enabled_final, geo_flux);
    const flux_geothermique_final = geo_flux;
    const flux_entrant_final = flux_solaire_absorbe_final + flux_geothermique_final;
    const flux_sortant_surface_final = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);  // Flux émis par la surface (AVANT EDS)
    // Note: ALL, CONVERGENCE et FLUX sont déjà déclarés au début de computeRadiativeTransfer
    
    // Utiliser le delta_equilibre de la dernière itération (qui utilise flux_sortant_effectif)
    const delta_equilibre_final = ALL_DATA.FLUX.DELTA;
    const tolerance_final = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
    
    // Mettre à jour ALL_DATA avec les valeurs finales (séparer solaire et géothermique)
    // IMPORTANT : 🧲🔼 dans ALL_DATA = flux_sortant_surface (AVANT EDS) pour cohérence avec step5_fluxOut
    ALL_DATA.CONVERGENCE.T0 = T0_current;
    ALL_DATA.CONVERGENCE.PHASE = Phase;
    ALL_DATA.CONVERGENCE.DIRECTION = signeDeltaFirst;
    ALL_DATA.FLUX.SOLAR_ABSORBED = flux_solaire_absorbe_final;  // Flux solaire absorbé (séparé)
    ALL_DATA.FLUX.GEOTHERMAL_IN = flux_geothermique_final;     // Flux géothermique (séparé)
    ALL_DATA.FLUX.OUT = flux_sortant_surface_final;    // Flux sortant surface (AVANT EDS)
    ALL_DATA.FLUX.DELTA = delta_equilibre_final;        // Delta flux (utilise flux_sortant_effectif pour équilibre)
    ALL_DATA.CONVERGENCE.TOLERANCE = tolerance_final;                // Tolérance (précision pour test d'arrêt) - 🔬 selon grammar.txt
    
    // Créer window.flux (pour l'affichage simplifié)
    // IMPORTANT : 🧲🔼 = flux émis par la surface (AVANT EDS), pas le flux effectif après EDS
    const FLUX = ALL_DATA.FLUX;
    window.flux = { 
        [FLUX.SOLAR_ABSORBED]: flux_solaire_absorbe_final,  // Flux solaire absorbé
        [FLUX.GEOTHERMAL_IN]: flux_geothermique_final,     // Flux géothermique
        [FLUX.OUT]: flux_sortant_surface_final     // Flux sortant surface (AVANT EDS)
    };
    
    // Log flux radiatif final
    // IMPORTANT : 🧲🔼 = flux émis par la surface (AVANT EDS), pas le flux effectif après EDS
    console.log(`☀️ [computeRadiativeTransfer@calculations_flux.js]`);
    console.log(`flux={'🧲☀️🔽':${flux_solaire_absorbe_final.toFixed(2)}, '🧲🌕🔽':${flux_geothermique_final > 1000 ? flux_geothermique_final.toExponential(2) : flux_geothermique_final.toFixed(2)}, '🧲🔼':${flux_sortant_surface_final > 1000 ? flux_sortant_surface_final.toExponential(2) : flux_sortant_surface_final.toFixed(2)}}`);
    
    // Retourner les résultats
    return Promise.resolve({
        T0: window.T0,
        h2o_result: window.h2o,
        albedo_result: window.flux,
        atm_result: {},
        atm_composition: ALL_DATA, // Utiliser ALL_DATA directement (source unique)
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

