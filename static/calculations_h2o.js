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

    // Formule empirique simplifiée basée sur la littérature
    // L'effet de serre de H2O est logarithmique avec la concentration
    // et dépend de la température (feedback positif)

    // Conversion fraction -> ppm équivalent pour la formule
    const h2o_ppm_equiv = h2o_vapor_fraction * 1e6;

    // Forçage de base (similaire au CO2 mais plus fort)
    // H2O a un forçage ~2-3x plus fort que le CO2 à concentration égale
    const base_forcing = 5.35 * Math.log(h2o_ppm_equiv / 4000); // 4000 ppm = valeur de référence moderne

    // Feedback température (effet amplifié à haute température)
    const temp_factor = Math.min(temp_K / 288, 2.0); // Normalisation à 288K (15°C)

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
 * Fonction principale : calcule tous les paramètres H2O
 * @param {number} temp_K - Température en Kelvin
 * @param {number} h2o_vapor_percent - Pourcentage volumique de vapeur d'eau (0-100)
 * @param {number} cloud_coverage_override - Couverture nuageuse forcée (optionnel, 0-1)
 * @returns {Object} {vapor_fraction, cloud_coverage, greenhouse_forcing, cloud_albedo_contribution}
 */
window.calculateH2OParameters = function (temp_K, h2o_vapor_percent, cloud_coverage_override = null) {
    const vapor_fraction = h2o_vapor_percent / 100;

    // Calculer ou utiliser la couverture nuageuse
    const cloud_coverage = cloud_coverage_override !== null
        ? cloud_coverage_override
        : estimateCloudCoverage(temp_K, vapor_fraction);

    // Calculer le forçage de l'effet de serre
    const greenhouse_forcing = calculateH2OGreenhouseForcing(vapor_fraction, temp_K);

    // Calculer la contribution à l'albedo
    const cloud_albedo_contribution = calculateCloudAlbedoContribution(cloud_coverage);

    return {
        vapor_fraction,
        cloud_coverage,
        greenhouse_forcing,
        cloud_albedo_contribution,
        max_vapor_fraction: calculateMaxH2OVaporFraction(temp_K)
    };
};

// Exposer les fonctions individuelles pour usage externe si nécessaire
if (typeof window !== 'undefined') {
    window.calculateSaturatedVaporPressure = calculateSaturatedVaporPressure;
    window.calculateMaxH2OVaporFraction = calculateMaxH2OVaporFraction;
    window.calculateH2OGreenhouseForcing = calculateH2OGreenhouseForcing;
    window.calculateCloudAlbedoContribution = calculateCloudAlbedoContribution;
    window.estimateCloudCoverage = estimateCloudCoverage;
}
