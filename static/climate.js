// ============================================================================
// File: climate.js - Forçages radiatifs et climatologie
// Desc: En français, dans l'architecture, je suis le module de climatologie
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: radiative forcings, climate sensitivity, albedo
// ============================================================================

// Constantes climatiques
// ✅ SCIENTIFIQUEMENT CERTAIN : Valeur mesurée par satellites (variations ~1361-1366 W/m² selon cycle solaire)
const SOLAR_CONSTANT = 1366;          // Constante solaire, W/m²
// ✅ SCIENTIFIQUEMENT CERTAIN : Albedo terrestre moyen ~0.3 (30% réfléchi) - valeur acceptée par l'IPCC
const ALBEDO_BASE = 0.3;               // Albédo de base terrestre (30% réfléchi)

// Zone habitable pour la vie (températures en Kelvin)
const TEMP_HABITABLE_MIN = 253;       // -20°C : limite inférieure pour la vie complexe
const TEMP_HABITABLE_MAX = 323;       // 50°C : limite supérieure pour la vie complexe
const TEMP_HABITABLE_OPTIMAL = 288;    // 15°C : température optimale pour la vie (référence)
const TEMP_REF_NO_CO2 = 255.0;        // Température effective sans CO2 (référence pour ΔT°)

// Fonction pour calculer le forçage radiatif du CO2
// ✅ SCIENTIFIQUEMENT CERTAIN :
// - La formule ΔF = 5.35 * ln(C/C₀) est la formule standard de Myhre et al. (1998)
// - Cette formule est acceptée par l'IPCC et utilisée dans tous les modèles climatiques
// - Le coefficient 5.35 W/m² est une valeur mesurée et validée expérimentalement
// - La référence pré-industrielle de 280 ppm est une valeur paléoclimatique bien établie
function calculateCO2Forcing(CO2_fraction) {
    const CO2_ref = 280e-6; // Référence pré-industrielle (280 ppm) - ✅ scientifiquement accepté
    if (CO2_fraction <= 0) return 0;
    return 5.35 * Math.log(Math.max(CO2_fraction, CO2_ref) / CO2_ref); // W/m² (formule de Myhre et al. 1998)
}

// Fonction pour calculer le forçage radiatif de H2O (vapeur d'eau)
// 
// ⚠️ IMPORTANT : DISTINCTION ENTRE VAPEUR D'EAU ET NUAGES ⚠️
// 
// L'effet de serre de H2O comprend DEUX composantes distinctes :
// 1. VAPEUR D'EAU (gaz dans l'atmosphère) :
//    - Représentée par le ratio de mélange r_H2O(z) = r0 * exp(-z/H_H2O)
//    - Au niveau de la mer : r0 ≈ 0.015 (1.5% de l'air en vapeur d'eau)
//    - C'est la présence d'eau sous forme gazeuse dans l'atmosphère (%)
//    - Cette vapeur absorbe le rayonnement IR (effet de serre)
//    - Calculée dans calculations.js via waterVaporMixingRatio() et waterVaporNumberDensity()
// 
// 2. NUAGES (gouttelettes d'eau condensée) :
//    - Représentée par cloud_coverage (0 à 1, 0% à 100% de couverture)
//    - Effet complexe : réchauffement (IR) + refroidissement (albedo)
//    - Calculée dans calculations.js via calculateCloudCoverage()
//    - Les nuages se forment quand la vapeur d'eau se condense
// 
// ⚠️ APPROXIMATION SIMPLIFIÉE POUR MODÉLISATION :
// - Le forçage H2O réel est complexe et dépend de nombreux facteurs (humidité, altitude, température)
// - En réalité, la vapeur d'eau contribue ~20-30 W/m² à l'effet de serre terrestre
// - Les nuages ont un effet net complexe qui dépend du type (cirrus vs stratus) et de l'altitude
// - Cette fonction est simplifiée pour le gameplay et évite l'emballement thermique
// 
// ✅ SCIENTIFIQUEMENT CERTAIN :
// - La vapeur d'eau est le principal gaz à effet de serre (contribution ~60% de l'effet de serre total)
// - Les nuages ont un effet net complexe qui dépend du type (cirrus vs stratus) et de l'altitude
// - La rétroaction vapeur d'eau-température est une rétroaction positive bien documentée
// 
// @param {boolean} h2o_enabled - Si true, la vapeur d'eau est activée (présence d'eau dans l'atmosphère)
// @param {number} cloud_coverage - Couverture nuageuse (0 à 1, 0% à 100%)
// @returns {number} Forçage radiatif total H2O (W/m²) = vapeur + nuages
function calculateH2OForcing(h2o_enabled, cloud_coverage) {
    if (!h2o_enabled) return 0;
    // Forçage de base de la vapeur d'eau (présence d'eau gazeuse dans l'atmosphère)
    // Cette valeur représente l'effet de serre de la vapeur d'eau (~1.5% au niveau de la mer)
    const base_forcing = 15; // W/m² - réduit pour éviter l'emballement
    
    // Contribution supplémentaire des nuages (gouttelettes condensées)
    // Les nuages ajoutent un forçage radiatif supplémentaire (effet IR > effet albedo dans ce modèle simplifié)
    const cloud_forcing_max = 5; // Contribution maximale des nuages (W/m²)
    const cloud_forcing = Math.min(cloud_forcing_max, cloud_coverage * cloud_forcing_max);
    
    // Forçage total = vapeur d'eau (gaz) + nuages (condensé)
    return base_forcing + cloud_forcing; // W/m²
}

// Fonction pour calculer le forçage radiatif de l'albedo (négatif)
// ⚠️ WARNING - MODIFICATION POUR GAMEPLAY ⚠️
// L'effet d'albedo est divisé par 2 pour des raisons de gameplay.
// Cette modification réduit l'impact scientifique réel de l'albedo sur le climat.
// En réalité, le forçage radiatif de l'albedo suit la formule : ΔF = S_0/4 * (A_ref - A_actuel)
// 
// ✅ SCIENTIFIQUEMENT CERTAIN : 
// - La formule de base ΔF = S_0/4 * (A_ref - A_actuel) est bien établie (IPCC, modèles climatiques)
// - Un albedo plus élevé réduit effectivement le flux solaire absorbé (forçage négatif)
// - La constante solaire S_0 ≈ 1366 W/m² est une valeur mesurée et acceptée
// - La division par 4 vient de la géométrie sphérique (surface 4πr² vs section πr²)
function calculateAlbedoForcing(albedo) {
    const ALBEDO_REF = 0.3; // Albedo de référence (✅ scientifiquement accepté : ~0.3 pour la Terre)
    const forcing_scientific = SOLAR_CONSTANT / 4 * (ALBEDO_REF - albedo); // W/m² (négatif si albedo > 0.3)
    // ⚠️ MODIFICATION POUR GAMEPLAY : Diviser par 2 pour réduire l'impact
    return forcing_scientific / 2;
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.SOLAR_CONSTANT = SOLAR_CONSTANT;
    window.ALBEDO_BASE = ALBEDO_BASE;
    window.TEMP_HABITABLE_MIN = TEMP_HABITABLE_MIN;
    window.TEMP_HABITABLE_MAX = TEMP_HABITABLE_MAX;
    window.TEMP_HABITABLE_OPTIMAL = TEMP_HABITABLE_OPTIMAL;
    window.TEMP_REF_NO_CO2 = TEMP_REF_NO_CO2;
    window.calculateCO2Forcing = calculateCO2Forcing;
    window.calculateH2OForcing = calculateH2OForcing;
    window.calculateAlbedoForcing = calculateAlbedoForcing;
}

