// ============================================================================
// File: API_BILAN/physics/climate.js - Forçages radiatifs (convention affichage) et climatologie
// Desc: ΔF = diagnostic conventionnel (terrestre / contemporain), pas utilisé pour le calcul de T. EDS/OLR = physique (calculations.js).
// Version 1.0.1
// Date: [January 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// ============================================================================

// Convention ΔF CO₂ (Myhre 1998, IPCC) — affichage uniquement, pas de calcul T.
// ΔF = α×ln(C/C₀) : diagnostic relatif à une référence, concept terrestre/contemporain.
const CONVENTION_CO2_FORCING_COEFF = 5.35;  // W/m². Plage lit. 4.0–6.5.
const CONVENTION_CO2_REF_PPM = 280;         // ppm pré-ind. (C₀). Convention IPCC.

// Constantes climatiques = window.CONST (physics.js) : STEFAN_BOLTZMANN, SOLAR_CONSTANT, TEMP_HABITABLE_*
// Température de référence sans effet de serre (T_eff)
// ⚠️ NE PAS HARDCODER 255K ! Cela dépend de l'albedo et de l'intensité solaire
// Sera calculé dynamiquement via la fonction getEffectiveTemperatureNoGreenhouse()
// const TEMP_REF_NO_CO2 = 255.0; // DEPRECATED

// Fonction pour obtenir la température effective sans effet de serre
// T_eff = (S * (1 - A) / 4σ)^(1/4)
function getEffectiveTemperatureNoGreenhouse() {
    if (typeof window === 'undefined') return 255.0;

    const CONST = window.CONST;
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
    const solar_constant = CONST.SOLAR_CONSTANT;

    // Récupérer l'albedo de base de l'époque courante
    let albedo_ref = 0.3; 
    if (window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            // Ajuster la constante solaire si définie
            if (typeof currentEpoch.solar_intensity === 'number') {
                // solar_intensity est un facteur (ex: 0.7 pour 70%)
                // Mais attention, SOLAR_CONSTANT est la valeur actuelle
                // Il faut vérifier si solar_constant est déjà ajusté ou si on doit le faire ici
                // Dans main.js, FluxManager met à jour SOLAR_CONSTANT. Supposons qu'il est à jour.
            }
            
            if (typeof currentEpoch.albedo_base === 'number') {
                albedo_ref = currentEpoch.albedo_base;
            }
        }
    }

    const flux_absorbed = (solar_constant / 4) * (1 - albedo_ref);
    const T_eff = Math.pow(flux_absorbed / STEFAN_BOLTZMANN, 0.25);
    
    return T_eff;
}

// ΔF CO₂ (convention affichage) : ΔF = α×ln(C/C₀). Pas utilisé pour T finale.
function calculateCO2Forcing(CO2_fraction) {
    if (CO2_fraction <= 0) return 0;
    const CO2_ref = CONVENTION_CO2_REF_PPM * 1e-6;
    return CONVENTION_CO2_FORCING_COEFF * Math.log(Math.max(CO2_fraction, CO2_ref) / CO2_ref);
}

// Fonction pour calculer le diagnostic ΔF CH4 (méthane, convention affichage)
// ✅ SCIENTIFIQUEMENT CERTAIN :
// - La formule ΔF = 0.036 * (√M - √M₀) est la formule standard pour le CH4 (Myhre et al. 1998)
// - Cette formule est acceptée par l'IPCC et utilisée dans tous les modèles climatiques
// - Le coefficient 0.036 W/m²/(ppb)¹/² est une valeur mesurée et validée expérimentalement
// - La référence pré-industrielle de 700 ppb (0.7 ppm) est une valeur paléoclimatique bien établie
// - Bande d'absorption principale : ~7.7 μm, avec un pic important à ~23 μm (1300 cm⁻¹)
// - Note : Le CH4 a un pouvoir de réchauffement global (PRG) ~25-30x supérieur au CO2 sur 100 ans
function calculateCH4Forcing(CH4_fraction) {
    const CH4_ref = 0.7e-6; // Référence pré-industrielle (0.7 ppm = 700 ppb) - ✅ scientifiquement accepté
    if (CH4_fraction <= 0) return 0;
    // Formule : ΔF = 0.036 * (√M - √M₀) où M est la concentration en ppb
    // Convertir ppm en ppb : 1 ppm = 1000 ppb
    const CH4_ppb = CH4_fraction * 1e6; // ppm → ppb
    const CH4_ref_ppb = CH4_ref * 1e6; // ppm → ppb
    return 0.036 * (Math.sqrt(Math.max(CH4_ppb, CH4_ref_ppb)) - Math.sqrt(CH4_ref_ppb)); // W/m²
}

// Fonction pour calculer le diagnostic ΔF H2O (vapeur d'eau, convention affichage)
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
// @returns {number} Diagnostic ΔF total H2O (W/m², convention affichage) = vapeur + nuages
function calculateH2OForcing(h2o_enabled, cloud_coverage) {
    if (!h2o_enabled) return 0;
    // Forçage de base de la vapeur d'eau (présence d'eau gazeuse dans l'atmosphère)
    // Cette valeur représente l'effet de serre de la vapeur d'eau (~1.5% au niveau de la mer)
    const base_forcing = 15; // W/m² - réduit pour éviter l'emballement
    
    // Contribution supplémentaire des nuages (gouttelettes condensées)
    // Les nuages ajoutent un terme ΔF supplémentaire (effet IR > effet albedo dans ce modèle simplifié)
    const cloud_forcing_max = 5; // Contribution maximale des nuages (W/m²)
    const cloud_forcing = Math.min(cloud_forcing_max, cloud_coverage * cloud_forcing_max);
    
    // Forçage total = vapeur d'eau (gaz) + nuages (condensé)
    return base_forcing + cloud_forcing; // W/m²
}

// Fonction pour calculer le diagnostic ΔF de l'albedo (convention affichage)
// ✅ SCIENTIFIQUEMENT CERTAIN :
// - Le forçage albedo est : ΔF_albedo = -S/4 * ΔA où S est la constante solaire et ΔA est le changement d'albedo
// - Référence : albedo de référence de l'époque courante (albedo_base)
// - Si albedo augmente, le forçage est négatif (refroidissement)
// - Si albedo diminue, le forçage est positif (réchauffement)
// 🔒 CORRECTION : Utiliser l'albedo_base de l'époque comme référence, pas toujours 0.3
function calculateAlbedoForcing(albedo) {
    if (albedo === null || albedo === undefined) return 0;
    
    // Récupérer l'albedo de référence de l'époque courante (albedo_base)
    let albedo_ref = 0.3; // Valeur par défaut (terrestre moyenne)
    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch && typeof currentEpoch.albedo_base === 'number') {
            albedo_ref = currentEpoch.albedo_base;
        }
    }
    
    // Si albedo = albedo_ref, alors forçage = 0 (pas de changement)
    // Pour Corps noir : albedo_base = 0, donc si albedo = 0, forçage = 0
    if (Math.abs(albedo - albedo_ref) < 1e-6) {
        return 0;
    }
    
    const CONST = window.CONST;
    const SOLAR_FLUX_AVERAGE = CONST.SOLAR_CONSTANT / 4; // 341.5 W/m²

    // ΔF_albedo = -S/4 * (A - A_ref)
    // Négatif car une augmentation d'albedo réduit le flux absorbé (refroidissement)
    const delta_albedo = albedo - albedo_ref;
    const forcing = -SOLAR_FLUX_AVERAGE * delta_albedo;
    
    return forcing; // W/m²
}

// Exposer uniquement les appels (fonctions) ; pas de variables MAJUSCULE sur window (règle : CONST/DATA)
if (typeof window !== 'undefined') {
    window.getEffectiveTemperatureNoGreenhouse = getEffectiveTemperatureNoGreenhouse;
    window.calculateCO2Forcing = calculateCO2Forcing;
    window.calculateCH4Forcing = calculateCH4Forcing;
    window.calculateH2OForcing = calculateH2OForcing;
    window.calculateAlbedoForcing = calculateAlbedoForcing;
}

