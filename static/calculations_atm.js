// File: calculations_atm.js - Calculs composition atmosphérique
// Desc: En français, dans l'architecture, je suis le module de calculs atmosphériques
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: calculs composition atmosphérique à partir de quantités (CO2, CH4, H2O, N2, O2)
//   - Conversion quantités → fractions molaires pour calculs physiques

// ============================================================================
// CONSTANTES ATMOSPHÉRIQUES
// ============================================================================

// Masse molaire des gaz (kg/mol)
const MOLAR_MASS_CO2 = 0.044;      // CO₂ : 44 g/mol
const MOLAR_MASS_CH4 = 0.016;      // CH₄ : 16 g/mol
const MOLAR_MASS_H2O = 0.018;      // H₂O : 18 g/mol
const MOLAR_MASS_N2 = 0.028;       // N₂ : 28 g/mol
const MOLAR_MASS_O2 = 0.032;       // O₂ : 32 g/mol
const MOLAR_MASS_AR = 0.040;       // Ar : 40 g/mol

// Masse totale d'eau terrestre actuelle (kg)
// Source: ~1.4 × 10²¹ kg (océans + glaces + eau souterraine + atmosphère)
const EARTH_TOTAL_WATER_MASS_KG = 1.4e21;

// Masse totale de l'atmosphère terrestre actuelle (kg)
// Source: ~5.15 × 10¹⁸ kg
const EARTH_ATMOSPHERE_MASS_KG = 5.15e18;

// ============================================================================
// FONCTIONS DE CONVERSION QUANTITÉ → FRACTION MOLAIRE
// ============================================================================

/**
 * Convertit une quantité de CO2 (en kg) en fraction molaire
 * @param {number} co2_kg - Quantité de CO2 en kg
 * @param {number} total_atmosphere_mass_kg - Masse totale de l'atmosphère en kg
 * @param {number} molar_mass_air - Masse molaire moyenne de l'air en kg/mol (défaut: 0.029)
 * @returns {number} Fraction molaire de CO2 (0-1)
 */
function co2KgToFraction(co2_kg, total_atmosphere_mass_kg = EARTH_ATMOSPHERE_MASS_KG, molar_mass_air = 0.029) {
    if (co2_kg <= 0 || total_atmosphere_mass_kg <= 0) return 0;
    
    // Nombre de moles de CO2
    const moles_CO2 = co2_kg / MOLAR_MASS_CO2;
    
    // Nombre de moles totales dans l'atmosphère
    const moles_total = total_atmosphere_mass_kg / molar_mass_air;
    
    // Fraction molaire
    return moles_CO2 / moles_total;
}

/**
 * Convertit une quantité de CH4 (en kg) en fraction molaire
 * @param {number} ch4_kg - Quantité de CH4 en kg
 * @param {number} total_atmosphere_mass_kg - Masse totale de l'atmosphère en kg
 * @param {number} molar_mass_air - Masse molaire moyenne de l'air en kg/mol (défaut: 0.029)
 * @returns {number} Fraction molaire de CH4 (0-1)
 */
function ch4KgToFraction(ch4_kg, total_atmosphere_mass_kg = EARTH_ATMOSPHERE_MASS_KG, molar_mass_air = 0.029) {
    if (ch4_kg <= 0 || total_atmosphere_mass_kg <= 0) return 0;
    
    const moles_CH4 = ch4_kg / MOLAR_MASS_CH4;
    const moles_total = total_atmosphere_mass_kg / molar_mass_air;
    return moles_CH4 / moles_total;
}

/**
 * Convertit une quantité d'eau totale (en kg) en fraction molaire pour la vapeur
 * Note: Seule la partie vapeur contribue à la fraction molaire atmosphérique
 * @param {number} h2o_total_kg - Quantité totale d'eau en kg (vapeur + liquide + glace)
 * @param {number} vapor_fraction - Fraction de l'eau sous forme vapeur (0-1)
 * @param {number} total_atmosphere_mass_kg - Masse totale de l'atmosphère en kg
 * @param {number} molar_mass_air - Masse molaire moyenne de l'air en kg/mol (défaut: 0.029)
 * @returns {number} Fraction molaire de H2O vapeur (0-1)
 */
function h2oKgToVaporFraction(h2o_total_kg, vapor_fraction, total_atmosphere_mass_kg = EARTH_ATMOSPHERE_MASS_KG, molar_mass_air = 0.029) {
    if (h2o_total_kg <= 0 || vapor_fraction <= 0 || total_atmosphere_mass_kg <= 0) return 0;
    
    const h2o_vapor_kg = h2o_total_kg * vapor_fraction;
    const moles_H2O = h2o_vapor_kg / MOLAR_MASS_H2O;
    const moles_total = total_atmosphere_mass_kg / molar_mass_air;
    return moles_H2O / moles_total;
}

// ============================================================================
// FONCTION PRINCIPALE : CALCULER LA COMPOSITION ATMOSPHÉRIQUE
// ============================================================================

/**
 * Calcule la composition atmosphérique complète à partir des quantités de gaz
 * @param {Object} quantities - Objet contenant les quantités en kg
 * @param {number} quantities.co2_kg - Quantité de CO2 en kg
 * @param {number} quantities.ch4_kg - Quantité de CH4 en kg
 * @param {number} quantities.h2o_total_kg - Quantité totale d'eau en kg
 * @param {number} quantities.h2o_vapor_fraction - Fraction de l'eau sous forme vapeur (0-1)
 * @param {number} total_atmosphere_mass_kg - Masse totale de l'atmosphère en kg (optionnel)
 * @returns {Object} Composition atmosphérique avec fractions molaires
 */
function calculateAtmosphericComposition(quantities, total_atmosphere_mass_kg = EARTH_ATMOSPHERE_MASS_KG) {
    const {
        co2_kg = 0,
        ch4_kg = 0,
        h2o_total_kg = 0,
        h2o_vapor_fraction = 0
    } = quantities;
    
    // Calculer les fractions molaires des GES
    const CO2_fraction = co2KgToFraction(co2_kg, total_atmosphere_mass_kg);
    const CH4_fraction = ch4KgToFraction(ch4_kg, total_atmosphere_mass_kg);
    const H2O_vapor_fraction = h2oKgToVaporFraction(h2o_total_kg, h2o_vapor_fraction, total_atmosphere_mass_kg);
    
    // Calculer la fraction totale des GES
    const total_ges_fraction = CO2_fraction + CH4_fraction + H2O_vapor_fraction;
    
    // Les gaz neutres (N2, O2, Ar) comblent le reste
    // Répartition par défaut (moderne): N2=78%, O2=21%, Ar=0.9%
    // On ajuste proportionnellement pour que la somme fasse 1.0
    const remaining_fraction = Math.max(0, 1.0 - total_ges_fraction);
    
    // Répartition des gaz neutres (proportions modernes)
    const N2_fraction = remaining_fraction * 0.78;
    const O2_fraction = remaining_fraction * 0.21;
    const Ar_fraction = remaining_fraction * 0.009;
    
    // Normaliser pour s'assurer que la somme = 1.0
    const total = CO2_fraction + CH4_fraction + H2O_vapor_fraction + N2_fraction + O2_fraction + Ar_fraction;
    const normalization_factor = total > 0 ? 1.0 / total : 1.0;
    
    return {
        CO2: CO2_fraction * normalization_factor,
        CH4: CH4_fraction * normalization_factor,
        H2O_vapor: H2O_vapor_fraction * normalization_factor,
        N2: N2_fraction * normalization_factor,
        O2: O2_fraction * normalization_factor,
        Ar: Ar_fraction * normalization_factor,
        // Quantités brutes (pour référence)
        quantities: {
            co2_kg,
            ch4_kg,
            h2o_total_kg
        }
    };
}

// ============================================================================
// FONCTIONS DE CONVERSION FRACTION → QUANTITÉ (pour compatibilité)
// ============================================================================

/**
 * Convertit une fraction molaire de CO2 en quantité (kg)
 * @param {number} co2_fraction - Fraction molaire de CO2 (0-1)
 * @param {number} total_atmosphere_mass_kg - Masse totale de l'atmosphère en kg
 * @param {number} molar_mass_air - Masse molaire moyenne de l'air en kg/mol (défaut: 0.029)
 * @returns {number} Quantité de CO2 en kg
 */
function co2FractionToKg(co2_fraction, total_atmosphere_mass_kg = EARTH_ATMOSPHERE_MASS_KG, molar_mass_air = 0.029) {
    if (co2_fraction <= 0) return 0;
    
    const moles_total = total_atmosphere_mass_kg / molar_mass_air;
    const moles_CO2 = co2_fraction * moles_total;
    return moles_CO2 * MOLAR_MASS_CO2;
}

/**
 * Convertit une fraction molaire de CH4 en quantité (kg)
 * @param {number} ch4_fraction - Fraction molaire de CH4 (0-1)
 * @param {number} total_atmosphere_mass_kg - Masse totale de l'atmosphère en kg
 * @param {number} molar_mass_air - Masse molaire moyenne de l'air en kg/mol (défaut: 0.029)
 * @returns {number} Quantité de CH4 en kg
 */
function ch4FractionToKg(ch4_fraction, total_atmosphere_mass_kg = EARTH_ATMOSPHERE_MASS_KG, molar_mass_air = 0.029) {
    if (ch4_fraction <= 0) return 0;
    
    const moles_total = total_atmosphere_mass_kg / molar_mass_air;
    const moles_CH4 = ch4_fraction * moles_total;
    return moles_CH4 * MOLAR_MASS_CH4;
}

// ============================================================================
// CALCUL DE PRESSION ATMOSPHÉRIQUE
// ============================================================================

/**
 * Calcule la pression atmosphérique à une altitude z
 * Basé sur la masse totale de l'atmosphère et la composition des gaz
 * 
 * Formule barométrique : P(z) = P0 * exp(-z/H)
 * où :
 * - P0 = (masse_atmosphère * g) / surface_terre (pression au niveau de la mer)
 * - H = RT/(Mg) (échelle de hauteur)
 * - R = constante des gaz parfaits
 * - T = température
 * - M = masse molaire moyenne
 * - g = gravité
 * 
 * @param {number} z - Altitude en mètres
 * @param {Object} params - Paramètres atmosphériques
 * @param {number} params.total_atmosphere_mass_kg - Masse totale de l'atmosphère en kg
 * @param {number} params.temperature_K - Température au niveau de la mer en Kelvin
 * @param {number} params.gravity - Gravité en m/s² (défaut: 9.81)
 * @param {Object} params.composition - Composition atmosphérique (fractions molaires)
 * @param {number} params.composition.CO2 - Fraction molaire CO2
 * @param {number} params.composition.CH4 - Fraction molaire CH4
 * @param {number} params.composition.H2O_vapor - Fraction molaire H2O vapeur
 * @param {number} params.composition.N2 - Fraction molaire N2
 * @param {number} params.composition.O2 - Fraction molaire O2
 * @param {number} params.composition.Ar - Fraction molaire Ar
 * @returns {number} Pression en Pascal (Pa)
 */
function calculatePressure(z, params = {}) {
    // Validation stricte des paramètres physiques
    // On refuse les valeurs par défaut silencieuses pour la physique planétaire
    if (params.total_atmosphere_mass_kg === undefined || 
        params.gravity === undefined || 
        params.planet_radius === undefined) {
        
        console.error("[calculatePressure] ❌ ERREUR CRITIQUE : Paramètres physiques manquants !", params);
        
        // Alerte utilisateur (une seule fois pour ne pas spammer)
        if (typeof window !== 'undefined' && !window._physicsAlertShown) {
            const alertFunc = (window.showSelectableAlert) ? window.showSelectableAlert : alert;
            alertFunc("ERREUR PHYSIQUE : Paramètres atmosphériques manquants (masse, gravité ou rayon).\nLe calcul de pression utilise des valeurs par défaut terrestres, ce qui est probablement INCORRECT pour cette époque/planète.\n\nVérifiez la configuration de l'époque.", "Erreur Physique");
            window._physicsAlertShown = true;
        }
    }

    const {
        total_atmosphere_mass_kg = EARTH_ATMOSPHERE_MASS_KG,
        temperature_K = 288, // Température standard (15°C)
        gravity = 9.81,
        planet_radius = 6371000, // Rayon Terre (m)
        composition = {}
    } = params;
    
    // Constantes physiques
    const R = 8.314; // Constante des gaz parfaits (J/(mol·K))
    // const EARTH_SURFACE_AREA_M2 = 5.1e14; // Surface de la Terre en m²
    const surface_area = 4 * Math.PI * Math.pow(planet_radius, 2);
    
    // Calculer la masse molaire moyenne de l'atmosphère
    // M = Σ(xi * Mi) où xi = fraction molaire, Mi = masse molaire
    const {
        CO2 = 0,
        CH4 = 0,
        H2O_vapor = 0,
        N2 = 0.78,
        O2 = 0.21,
        Ar = 0.009
    } = composition;
    
    // Normaliser les fractions pour s'assurer que la somme = 1.0
    const total_fraction = CO2 + CH4 + H2O_vapor + N2 + O2 + Ar;
    const norm_factor = total_fraction > 0 ? 1.0 / total_fraction : 1.0;
    
    const M_avg = (
        CO2 * norm_factor * MOLAR_MASS_CO2 +
        CH4 * norm_factor * MOLAR_MASS_CH4 +
        H2O_vapor * norm_factor * MOLAR_MASS_H2O +
        N2 * norm_factor * MOLAR_MASS_N2 +
        O2 * norm_factor * MOLAR_MASS_O2 +
        Ar * norm_factor * MOLAR_MASS_AR
    );
    
    // Pression au niveau de la mer : P0 = (masse * g) / surface
    const P0 = (total_atmosphere_mass_kg * gravity) / surface_area;
    
    // Échelle de hauteur : H = RT/(Mg)
    const H = (R * temperature_K) / (M_avg * gravity);
    
    // Formule barométrique
    return P0 * Math.exp(-z / H);
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

if (typeof window !== 'undefined') {
    window.co2KgToFraction = co2KgToFraction;
    window.ch4KgToFraction = ch4KgToFraction;
    window.h2oKgToVaporFraction = h2oKgToVaporFraction;
    window.calculateAtmosphericComposition = calculateAtmosphericComposition;
    window.co2FractionToKg = co2FractionToKg;
    window.ch4FractionToKg = ch4FractionToKg;
    window.calculatePressure = calculatePressure;
    
    // Constantes
    window.EARTH_TOTAL_WATER_MASS_KG = EARTH_TOTAL_WATER_MASS_KG;
    window.EARTH_ATMOSPHERE_MASS_KG = EARTH_ATMOSPHERE_MASS_KG;
    window.MOLAR_MASS_CO2 = MOLAR_MASS_CO2;
    window.MOLAR_MASS_CH4 = MOLAR_MASS_CH4;
    window.MOLAR_MASS_H2O = MOLAR_MASS_H2O;
    window.MOLAR_MASS_N2 = MOLAR_MASS_N2;
    window.MOLAR_MASS_O2 = MOLAR_MASS_O2;
    window.MOLAR_MASS_AR = MOLAR_MASS_AR;
}

