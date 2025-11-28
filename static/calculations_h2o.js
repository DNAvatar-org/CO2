// ============================================================================
// File: calculations_h2o.js - Calculs H2O (vapeur et nuages)
// Desc: Séparation vapeur d'eau (effet de serre) et nuages (albedo)
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [November 2025]
// ============================================================================

// TODO: Évolutions futures du cycle de l'eau
// - Évaporation des océans (fonction de la température de surface et de la couverture océanique)
// - Précipitations (condensation de la vapeur en fonction de l'altitude et de la température)
// - Ruissellement (retour de l'eau vers les océans via les rivières)
// - Stockage dans les calottes glaciaires (accumulation/fonte selon la température)
// - Bilan hydrique global (conservation de la masse d'eau totale)
// - Cycle saisonnier (variations annuelles de l'évaporation et des précipitations)
// - Impact du volcanisme sur l'apport d'eau (dégazage du manteau)


/**
 * Calcule la pression de vapeur saturante selon l'équation de Clausius-Clapeyron
 * @param {number} temp_K - Température en Kelvin
 * @returns {number} Pression de vapeur saturante en Pa
 */
function calculateSaturatedVaporPressure(temp_K) {
    // Constantes pour l'équation de Clausius-Clapeyron
    const T0 = 273.15; // Point triple de l'eau (K)
    const P0 = 611.2;  // Pression au point triple (Pa)
    const L = 2.5e6;   // Chaleur latente de vaporisation (J/kg)
    const Rv = 461.5;  // Constante des gaz pour la vapeur d'eau (J/(kg·K))

    // Formule de Clausius-Clapeyron
    const exponent = (L / Rv) * (1 / T0 - 1 / temp_K);
    return P0 * Math.exp(exponent);
}

/**
 * Calcule la fraction volumique maximale de vapeur d'eau à saturation
 * @param {number} temp_K - Température en Kelvin
 * @param {number} pressure_atm - Pression atmosphérique en atm (défaut: 1)
 * @returns {number} Fraction volumique (0-1)
 */
function calculateMaxH2OVaporFraction(temp_K, pressure_atm = 1.0) {
    const P_sat = calculateSaturatedVaporPressure(temp_K);
    const P_total = pressure_atm * 101325; // Conversion atm -> Pa

    // Fraction volumique = P_sat / P_total (loi de Dalton)
    const fraction = Math.min(P_sat / P_total, 1.0);
    return fraction;
}

/**
 * Calcule le forçage radiatif de la vapeur d'eau
 * Basé sur des formules empiriques de la littérature
 * @param {number} h2o_vapor_fraction - Fraction volumique de vapeur d'eau (0-1)
 * @param {number} temp_K - Température en Kelvin
 * @returns {number} Forçage radiatif en W/m²
 */
function calculateH2OGreenhouseForcing(h2o_vapor_fraction, temp_K) {
    if (h2o_vapor_fraction <= 0) return 0;

    // Formule basée sur la littérature (similaire à CO2 mais adaptée pour H2O)
    // L'effet de serre de H2O est logarithmique avec la concentration
    // et dépend de la température (feedback positif)
    
    // Référence : concentration très basse (comme CO2 utilise 280 ppm)
    // Utiliser 100 ppm (0.01%) comme référence - concentration typique dans une atmosphère très sèche
    // Les concentrations atmosphériques réalistes vont de quelques ppm à ~2-3% max (saturation)
    const H2O_REF_FRACTION = 100e-6; // 100 ppm = 0.01% (référence basse, comme CO2 à 280 ppm)
    
    // Coefficient : H2O est ~1.5-2x plus efficace que CO2 (5.35 W/m²)
    // Basé sur la littérature : H2O absorbe mieux dans l'IR que CO2
    // Utiliser 6.0 W/m² comme coefficient (plus conservateur pour éviter les amplifications excessives)
    const H2O_FORCING_COEFFICIENT = 6.0; // W/m² (réduit de 8.0 à 6.0 pour éviter les amplifications)
    
    // Forçage de base : formule logarithmique standard (comme CO2)
    // ΔF = α * ln(C/C₀) où C est la concentration et C₀ la référence
    // Fonctionne pour des concentrations réalistes (de quelques ppm à quelques %)
    const base_forcing = H2O_FORCING_COEFFICIENT * Math.log(Math.max(h2o_vapor_fraction, H2O_REF_FRACTION) / H2O_REF_FRACTION);

    // Feedback température : effet amplifié à haute température (feedback positif)
    // Plus il fait chaud, plus il y a de vapeur, plus l'effet de serre est fort
    // Formule continue : normalisation à 288K (15°C, température de référence terrestre)
    // À basse température, l'effet est réduit car moins de vapeur peut exister
    // Réduire l'amplification pour éviter les rétroactions trop fortes
    const temp_factor = Math.min(temp_K / 288, 1.2); // Limiter à 1.2 pour éviter les amplifications excessives

    return Math.max(base_forcing * temp_factor, 0);
}

/**
 * Calcule la contribution des nuages à l'albedo
 * @param {number} cloud_coverage - Couverture nuageuse (0-1)
 * @param {number} cloud_albedo - Albedo des nuages (défaut: 0.5)
 * @returns {number} Contribution à l'albedo total (0-1)
 */
function calculateCloudAlbedoContribution(cloud_coverage, cloud_albedo = 0.5) {
    // Les nuages augmentent l'albedo de manière non-linéaire
    // (effet de saturation à haute couverture)
    return cloud_coverage * cloud_albedo * (1 - 0.2 * cloud_coverage);
}

/**
 * Calcule la couverture nuageuse en fonction de la température et de l'humidité
 * Modèle simplifié pour estimer la formation de nuages
 * @param {number} temp_K - Température en Kelvin
 * @param {number} h2o_vapor_fraction - Fraction volumique de vapeur d'eau (0-1)
 * @param {number} relative_humidity - Humidité relative (0-1, défaut: 0.8)
 * @returns {number} Couverture nuageuse estimée (0-1)
 */
function estimateCloudCoverage(temp_K, h2o_vapor_fraction, relative_humidity = 0.8) {
    // Pas de nuages si température trop élevée (> 350K = 77°C)
    if (temp_K > 350) return 0.05;

    // Pas de nuages si température trop basse (< 200K = -73°C, tout gelé)
    if (temp_K < 200) return 0.1;

    // Saturation maximale
    const max_fraction = calculateMaxH2OVaporFraction(temp_K);

    // Si on est proche de la saturation, formation de nuages
    const saturation_ratio = h2o_vapor_fraction / (max_fraction * relative_humidity);

    // Couverture nuageuse proportionnelle au ratio de saturation
    // Avec un maximum de 80% de couverture
    const cloud_coverage = Math.min(saturation_ratio * 0.8, 0.8);

    return Math.max(cloud_coverage, 0.1); // Minimum 10% (toujours quelques nuages)
}

/**
 * Calcule la répartition eau vapeur / liquide / glace selon les conditions physiques
 * Formule complète basée sur la thermodynamique et le cycle de l'eau
 * 
 * @param {number} temp_K - Température en Kelvin
 * @param {number} h2o_total_fraction - Fraction totale d'eau disponible (vapeur + liquide + glace, 0-1)
 * @param {Object} options - Options supplémentaires
 * @param {number} options.pressure_atm - Pression atmosphérique en atm (défaut: 1.0)
 * @param {number} options.molar_mass_air - Masse molaire moyenne de l'air en kg/mol (défaut: 0.029)
 * @param {number} options.gravity - Accélération gravitationnelle en m/s² (défaut: 9.81)
 * @param {number} options.ocean_coverage - Couverture océanique (0-1, défaut: 0.7)
 * @returns {Object} {vapor_fraction, liquid_fraction, ice_fraction, max_vapor_fraction}
 */
function calculateWaterPartition(temp_K, h2o_total_fraction, options = {}) {
    // Validation stricte
    if (options.pressure_atm === undefined || options.molar_mass_air === undefined || options.gravity === undefined || options.ocean_coverage === undefined) {
         console.warn("[calculateWaterPartition] Paramètres physiques manquants, calcul incomplet", options);
         // Si manque gravité ou pression, impossible de calculer T_boil
         if (options.gravity === undefined || options.pressure_atm === undefined) return { vapor_fraction: 0, liquid_fraction: 0, ice_fraction: 0, max_vapor_fraction: 0, air_density: 0 };
    }

    const pressure_atm = options.pressure_atm;
    const molar_mass_air = options.molar_mass_air; 
    const gravity = options.gravity; 
    const ocean_coverage = options.ocean_coverage; 
    
    // Constantes physiques
    const R = 8.314; // Constante des gaz parfaits, J/(mol·K)
    //const T0 = 273.15; // Point triple de l'eau (K)
    const T_freeze = 273.15; // Point de congélation (K)
    const T_boil = 373.15; // Point d'ébullition à 1 atm (K)
    
    // 1. Calculer la pression de vapeur saturante (équation de Clausius-Clapeyron)
    const P_sat = calculateSaturatedVaporPressure(temp_K);
    
    // 2. Calculer la pression atmosphérique totale
    const P_total = pressure_atm * 101325; // Conversion atm -> Pa
    
    // 3. Calculer la fraction maximale de vapeur d'eau à saturation (loi de Dalton)
    // P_vapor = P_sat = x_vapor * P_total
    // x_vapor = P_sat / P_total
    const max_vapor_fraction = Math.min(P_sat / P_total, 1.0);
    
    // 4. Calculer la densité de l'air (loi des gaz parfaits)
    // ρ = P * M / (R * T) où M est la masse molaire
    const air_density = (P_total * molar_mass_air) / (R * temp_K); // kg/m³
    
    // 5. Déterminer les phases selon la température et la pression
    let vapor_fraction = 0;
    let liquid_fraction = 0;
    let ice_fraction = 0;
    
    // En Hadéen, la température peut dépasser 2000K et la pression 100 bar
    // L'eau est alors un fluide supercritique ou une vapeur dense, mais pour ce modèle
    // on considère que c'est de la vapeur (gaz) si T > T_boil(P)
    
    // Point d'ébullition ajusté selon la pression (approximation Antoine simplifiée)
    // T_boil augmente avec la pression. À 100 bar, T_boil ≈ 311°C (584K)
    // Formule approximative : T_boil(P) ≈ T_boil(1) * P^0.1 (très grossier mais suffisant pour l'ordre de grandeur)
    // Pour être plus précis, on utilise T_boil ≈ 1 / (1/373.15 - R*ln(P_atm)/L)
    const L_v = 40660; // J/mol
    let T_boil_pressure = 1 / (1/T_boil - (R * Math.log(pressure_atm)) / L_v);
    
    // Si P < 1 atm, la formule marche aussi.
    
    if (temp_K >= T_boil_pressure) {
        // Au-dessus du point d'ébullition : tout est vapeur (jusqu'à saturation ou tout le stock)
        // À haute température, l'atmosphère peut contenir beaucoup d'eau
        vapor_fraction = h2o_total_fraction; 
        liquid_fraction = 0;
        ice_fraction = 0;
    } else if (temp_K >= T_freeze) {
        // Entre 0°C et 100°C : vapeur + liquide
        // La vapeur est limitée par la saturation
        vapor_fraction = Math.min(h2o_total_fraction, max_vapor_fraction);
        // Le reste est liquide (océans, lacs, etc.)
        liquid_fraction = Math.max(0, h2o_total_fraction - vapor_fraction);
    } else {
        // En-dessous de 0°C : vapeur + glace
        // La vapeur est limitée par la saturation (très faible à basse température)
        vapor_fraction = Math.min(h2o_total_fraction, max_vapor_fraction);
        // Le reste est glace
        ice_fraction = Math.max(0, h2o_total_fraction - vapor_fraction);
        
        // Transition liquide-glace : si on refroidit progressivement, l'eau liquide peut persister
        // en surfusion jusqu'à ~-20°C, mais on simplifie ici
        if (temp_K > T_freeze - 20) {
            // Zone de transition : peut y avoir un peu de liquide
            const transition_factor = (temp_K - (T_freeze - 20)) / 20;
            const liquid_from_ice = ice_fraction * transition_factor * ocean_coverage;
            liquid_fraction = liquid_from_ice;
            ice_fraction = ice_fraction - liquid_from_ice;
        }
    }
    
    // Normaliser pour garantir que toutes les fractions sont dans [0, 1] et que leur somme ne dépasse pas 1.0
    // La glace ne peut pas dépasser 100% de la surface
    vapor_fraction = Math.max(0, Math.min(1.0, vapor_fraction));
    liquid_fraction = Math.max(0, Math.min(1.0, liquid_fraction));
    ice_fraction = Math.max(0, Math.min(1.0, ice_fraction));
    
    // S'assurer que la somme ne dépasse pas h2o_total_fraction (normalisation)
    const total_phases = vapor_fraction + liquid_fraction + ice_fraction;
    if (total_phases > h2o_total_fraction && total_phases > 0) {
        const scale = h2o_total_fraction / total_phases;
        vapor_fraction *= scale;
        liquid_fraction *= scale;
        ice_fraction *= scale;
    }
    
    return {
        vapor_fraction,
        liquid_fraction,
        ice_fraction,
        max_vapor_fraction,
        air_density // Densité de l'air pour d'autres calculs
    };
}

/**
 * Fonction principale : calcule tous les paramètres H2O
 * @param {number} temp_K - Température en Kelvin
 * @param {number} h2o_vapor_percent - Pourcentage volumique de vapeur d'eau (0-100)
 * @param {number} cloud_coverage_override - Couverture nuageuse forcée (optionnel, 0-1)
 * @returns {Object} {vapor_fraction, cloud_coverage, greenhouse_forcing, cloud_albedo_contribution, ice_fraction}
 */
window.calculateH2OParameters = function (temp_K, h2o_vapor_percent, cloud_coverage_override = null) {
    const h2o_total_fraction = h2o_vapor_percent / 100;
    
    // Récupérer les paramètres de l'époque courante (si disponibles)
    let epochParams = {};
    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            epochParams = {
                pressure_atm: currentEpoch.atmospheric_pressure,
                molar_mass_air: currentEpoch.molar_mass_air,
                gravity: currentEpoch.gravity,
                ocean_coverage: currentEpoch.ocean_coverage
            };
        }
    }
    
    // Calculer la répartition eau vapeur / liquide / glace selon les conditions physiques
    const waterPartition = calculateWaterPartition(temp_K, h2o_total_fraction, epochParams);
    const vapor_fraction = waterPartition.vapor_fraction;
    const liquid_fraction = waterPartition.liquid_fraction || 0;
    const ice_fraction = waterPartition.ice_fraction;

    // Calculer ou utiliser la couverture nuageuse
    const cloud_coverage = cloud_coverage_override !== null
        ? cloud_coverage_override
        : estimateCloudCoverage(temp_K, vapor_fraction);

    // Calculer le forçage de l'effet de serre (seulement pour la vapeur, pas la glace)
    const greenhouse_forcing = calculateH2OGreenhouseForcing(vapor_fraction, temp_K);

    // Calculer la contribution à l'albedo
    const cloud_albedo_contribution = calculateCloudAlbedoContribution(cloud_coverage);
    
    // Stocker la glace calculée pour calculateAlbedo et les logs
    if (typeof window !== 'undefined') {
        window.h2oIceFractionFromCalculation = ice_fraction;
    }
    
    // Mettre à jour la composition atmosphérique (si disponible)
    if (typeof window !== 'undefined' && window.atmosphericComposition) {
        window.atmosphericComposition.H2O_vapor = vapor_fraction;
        window.atmosphericComposition.H2O_ice = ice_fraction;
        window.atmosphericComposition.H2O_total = h2o_total_fraction;
        
        // Normaliser les gaz neutres pour que la somme fasse 1.0
        const total_ges = (window.atmosphericComposition.CO2 || 0) + 
                         vapor_fraction + 
                         (window.atmosphericComposition.CH4 || 0);
        const remaining = Math.max(0, 1.0 - total_ges);
        
        // Calculer les ratios initiaux (valeurs par défaut si non définies)
        const n2_default = window.atmosphericComposition.N2 || 0.78;
        const o2_default = window.atmosphericComposition.O2 || 0.21;
        const ar_default = window.atmosphericComposition.Ar || 0.009;
        const total_neutres_default = n2_default + o2_default + ar_default;
        
        if (total_neutres_default > 0) {
            // Répartir proportionnellement N2, O2, Ar selon leurs ratios par défaut
            const n2_ratio = n2_default / total_neutres_default;
            const o2_ratio = o2_default / total_neutres_default;
            const ar_ratio = ar_default / total_neutres_default;
            
            window.atmosphericComposition.N2 = remaining * n2_ratio;
            window.atmosphericComposition.O2 = remaining * o2_ratio;
            window.atmosphericComposition.Ar = remaining * ar_ratio;
        } else {
            // Si pas de valeurs par défaut, répartir équitablement
            window.atmosphericComposition.N2 = remaining / 3;
            window.atmosphericComposition.O2 = remaining / 3;
            window.atmosphericComposition.Ar = remaining / 3;
        }
    }

    return {
        vapor_fraction,
        ice_fraction,
        cloud_coverage,
        greenhouse_forcing,
        cloud_albedo_contribution,
        max_vapor_fraction: waterPartition.max_vapor_fraction
    };
};

// Exposer les fonctions individuelles pour usage externe si nécessaire
if (typeof window !== 'undefined') {
    window.calculateSaturatedVaporPressure = calculateSaturatedVaporPressure;
    window.calculateMaxH2OVaporFraction = calculateMaxH2OVaporFraction;
    window.calculateH2OGreenhouseForcing = calculateH2OGreenhouseForcing;
    window.calculateCloudAlbedoContribution = calculateCloudAlbedoContribution;
    window.estimateCloudCoverage = estimateCloudCoverage;
    window.calculateWaterPartition = calculateWaterPartition; // Fonction complète avec tous les paramètres physiques
}
