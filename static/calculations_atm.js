// File: calculations_atm.js - Calculs composition atmosphérique
// Desc: En français, dans l'architecture, je suis le module de calculs atmosphériques
// Version 1.1.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: calculs composition atmosphérique à partir de quantités (CO2, CH4, H2O, N2, O2)
//   - Conversion quantités → fractions molaires pour calculs physiques
//   - Ajout calcul hauteur atmosphère dynamique (Hadéen vs Standard)

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

// Seuil pour considérer une atmosphère comme massive (ex: Hadéen)
// ~5x la masse actuelle (5.15e18 kg)
const MASSIVE_ATM_THRESHOLD = 2.5e19;

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
function co2KgToFraction(co2_kg, total_atmosphere_mass_kg, molar_mass_air) {
    if (co2_kg === undefined || total_atmosphere_mass_kg === undefined || molar_mass_air === undefined) {
        console.error("[co2KgToFraction] ❌ ERREUR CRITIQUE : Paramètres manquants", { co2_kg, total_atmosphere_mass_kg, molar_mass_air });
        throw new Error('co2KgToFraction: Paramètres requis manquants');
    }
    if (co2_kg <= 0 || total_atmosphere_mass_kg <= 0 || molar_mass_air <= 0) {
        return 0; // Cas valide : pas de CO2, pas d'atmosphère, ou pas de masse molaire
    }
    
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
function ch4KgToFraction(ch4_kg, total_atmosphere_mass_kg, molar_mass_air) {
    if (ch4_kg === undefined || total_atmosphere_mass_kg === undefined || molar_mass_air === undefined) {
        console.error("[ch4KgToFraction] ❌ ERREUR CRITIQUE : Paramètres manquants", { ch4_kg, total_atmosphere_mass_kg, molar_mass_air });
        throw new Error('ch4KgToFraction: Paramètres requis manquants');
    }
    if (ch4_kg <= 0 || total_atmosphere_mass_kg <= 0 || molar_mass_air <= 0) {
        return 0; // Cas valide : pas de CH4, pas d'atmosphère, ou pas de masse molaire
    }
    
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
function h2oKgToVaporFraction(h2o_total_kg, vapor_fraction, total_atmosphere_mass_kg, molar_mass_air) {
    if (h2o_total_kg === undefined || vapor_fraction === undefined || total_atmosphere_mass_kg === undefined || molar_mass_air === undefined) {
        console.error("[h2oKgToVaporFraction] ❌ ERREUR CRITIQUE : Paramètres manquants", { h2o_total_kg, vapor_fraction, total_atmosphere_mass_kg, molar_mass_air });
        throw new Error('h2oKgToVaporFraction: Paramètres requis manquants');
    }
    if (h2o_total_kg <= 0 || vapor_fraction <= 0 || total_atmosphere_mass_kg <= 0 || molar_mass_air <= 0) {
        return 0; // Cas valide : pas d'eau, pas d'atmosphère, ou pas de masse molaire
    }
    
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
function calculateAtmosphericComposition(quantities, total_atmosphere_mass_kg) {
    if (total_atmosphere_mass_kg === undefined) {
        console.error("[calculateAtmosphericComposition] ❌ ERREUR CRITIQUE : total_atmosphere_mass_kg manquant");
        throw new Error('calculateAtmosphericComposition: total_atmosphere_mass_kg requis');
    }
    
    // Fallback pour molar_mass_air (paramètre interne des helpers, non exposé ici)
    // Pour calculateAtmosphericComposition, on doit calculer la masse molaire moyenne,
    // mais les helpers (co2KgToFraction) demandent une masse molaire de l'air pour convertir masse totale -> moles totales
    // C'est un problème circulaire : pour avoir M_air il faut la composition, pour avoir la composition il faut M_air (via total_moles)
    // Solution : Utiliser une approximation initiale pour le nombre total de moles, ou itérer.
    // Ici, on va conserver l'usage de 0.029 (Air standard) comme référence pour "total_moles" dans les helpers,
    // car "total_atmosphere_mass_kg" est souvent défini par rapport à la Terre actuelle.
    // Si on voulait être exact, il faudrait définir "total_moles" directement dans l'époque.
    const molar_mass_air_ref = 0.029; // Référence standard pour convertir kg -> moles "d'air équivalent"
    
    const {
        co2_kg = 0,
        ch4_kg = 0,
        h2o_total_kg = 0,
        h2o_vapor_fraction = 0
    } = quantities;
    
    // Calculer les fractions molaires des GES
    const CO2_fraction = co2KgToFraction(co2_kg, total_atmosphere_mass_kg, molar_mass_air_ref);
    const CH4_fraction = ch4KgToFraction(ch4_kg, total_atmosphere_mass_kg, molar_mass_air_ref);
    const H2O_vapor_fraction = h2oKgToVaporFraction(h2o_total_kg, h2o_vapor_fraction, total_atmosphere_mass_kg, molar_mass_air_ref);
    
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
function co2FractionToKg(co2_fraction, total_atmosphere_mass_kg, molar_mass_air) {
    if (co2_fraction === undefined || total_atmosphere_mass_kg === undefined || molar_mass_air === undefined) {
        console.error("[co2FractionToKg] ❌ ERREUR CRITIQUE : Paramètres manquants", { co2_fraction, total_atmosphere_mass_kg, molar_mass_air });
        throw new Error('co2FractionToKg: Paramètres requis manquants');
    }
    if (co2_fraction <= 0) {
        return 0; // Cas valide : pas de CO2
    }
    
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
function ch4FractionToKg(ch4_fraction, total_atmosphere_mass_kg, molar_mass_air) {
    if (ch4_fraction === undefined || total_atmosphere_mass_kg === undefined || molar_mass_air === undefined) {
        console.error("[ch4FractionToKg] ❌ ERREUR CRITIQUE : Paramètres manquants", { ch4_fraction, total_atmosphere_mass_kg, molar_mass_air });
        throw new Error('ch4FractionToKg: Paramètres requis manquants');
    }
    if (ch4_fraction <= 0) {
        return 0; // Cas valide : pas de CH4
    }
    
    const moles_total = total_atmosphere_mass_kg / molar_mass_air;
    const moles_CH4 = ch4_fraction * moles_total;
    return moles_CH4 * MOLAR_MASS_CH4;
}

// ============================================================================
// CALCUL DE PRESSION ET STRUCTURE ATMOSPHÉRIQUE
// ============================================================================

/**
 * Calcule les propriétés structurelles de l'atmosphère (Hauteur max, Échelle de hauteur)
 * basées sur la physique (T, M, g)
 * @param {number} total_atmosphere_mass_kg - Masse totale en kg
 * @param {number} temperature_K - Température de surface (K) - défaut 288
 * @param {number} molar_mass_kg_mol - Masse molaire moyenne (kg/mol) - défaut 0.029
 * @param {number} gravity - Gravité (m/s²) - défaut 9.81
 * @returns {Object} { z_max: number, scale_height: number, is_massive: boolean }
 */
function calculateAtmosphereProperties(total_atmosphere_mass_kg, temperature_K, molar_mass_kg_mol, gravity) {
    // Cas spécial : Vide / Corps Noir
    if (total_atmosphere_mass_kg === 0) {
        return { z_max: 0, scale_height: 0, is_massive: false };
    }

    // Validation stricte
    if (total_atmosphere_mass_kg === undefined || temperature_K === undefined || molar_mass_kg_mol === undefined || gravity === undefined) {
        console.error("[calculateAtmosphereProperties] ❌ ERREUR CRITIQUE : Paramètres manquants", { total_atmosphere_mass_kg, temperature_K, molar_mass_kg_mol, gravity });
        throw new Error('calculateAtmosphereProperties: Tous les paramètres requis (total_atmosphere_mass_kg, temperature_K, molar_mass_kg_mol, gravity)');
    }

    const R = 8.314; // Constante des gaz parfaits
    
    // Calcul physique de l'échelle de hauteur H = RT / Mg
    const scale_height = (R * temperature_K) / (molar_mass_kg_mol * gravity);
    
    if (isNaN(scale_height) || scale_height <= 0) {
        console.error("[calculateAtmosphereProperties] ❌ ERREUR CRITIQUE : scale_height invalide", { scale_height, temperature_K, molar_mass_kg_mol, gravity });
        throw new Error('calculateAtmosphereProperties: scale_height invalide (NaN ou <= 0)');
    }

    let is_massive = false;
    
    // Détection atmosphère massive (ex: Hadéen)
    if (total_atmosphere_mass_kg > MASSIVE_ATM_THRESHOLD) {
        is_massive = true;
    }
    
    // Calcul de z_max basé sur la pression au sol P0
    // P(z) = P0 * exp(-z/H) => z = -H * ln(P/P0)
    // On cherche z tel que P soit négligeable (ex: 0.01 Pa, limite de l'exosphère/espace)
    
    // 1. Estimer P0 (approximation rapide si on n'a pas le rayon exact, on prend celui de la Terre)
    const surface_area = 5.1e14; // m²
    const P0 = (total_atmosphere_mass_kg * gravity) / surface_area;
    
    // 2. Définir une pression limite "espace" (0.01 Pa)
    const P_limit = 0.01;
    
    // 3. Calculer z_max théorique
    // Si P0 est très grand (Hadéen ~100 bar = 10^7 Pa), ln(P0/P_limit) sera grand
    // Si P0 est très petit (Corps Noir ~0 Pa), ln(P0/P_limit) sera négatif ou petit
    // On prend Math.max(P0, 1e-5) pour éviter log(0)
    let z_max_theoretical = scale_height * Math.log(Math.max(P0, 1e-5) / P_limit);
    
    // Si z_max_theoretical est négatif (P0 < P_limit), on met 0
    z_max_theoretical = Math.max(0, z_max_theoretical);
    
    // Sécurité : bornes min/max
    // Si P0 est significatif (> 100 Pa = 1 mbar), on garde le minimum de 120km pour la visualisation standard
    // Sinon (atmosphère ténue ou nulle), on laisse z_max suivre la physique
    let z_max = z_max_theoretical;
    
    if (P0 > 100) {
        z_max = Math.max(120000, z_max_theoretical);
    } else {
        // Si atmosphère quasi-nulle, on garde une valeur minimale (1m) pour éviter les bugs de division par zéro dans les boucles
        z_max = Math.max(1, z_max_theoretical); 
    }
    
    // Si atmosphère massive, on s'assure que ça monte bien (boost visuel si besoin)
    if (is_massive && z_max < 300000) {
        z_max = 300000;
    }

    // Arrondir z_max
    // Si grand (> 1km), on arrondit au 10km
    // Si petit, on garde la précision
    if (z_max > 1000) {
        z_max = Math.ceil(z_max / 10000) * 10000;
    } else {
        z_max = Math.ceil(z_max);
    }

    return {
        z_max, // en mètres
        scale_height, // en mètres
        is_massive
    };
}

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
    const {
        total_atmosphere_mass_kg, // Doit être fourni
        temperature_K, // Doit être fourni
        gravity, // Doit être fourni
        planet_radius, // Doit être fourni
        composition = {}
    } = params;
    
    // Validation stricte
    if (total_atmosphere_mass_kg === undefined || temperature_K === undefined || gravity === undefined || planet_radius === undefined) {
         console.error("[calculatePressure] ❌ ERREUR CRITIQUE : Paramètres physiques manquants", { total_atmosphere_mass_kg, temperature_K, gravity, planet_radius });
         throw new Error('calculatePressure: Tous les paramètres requis (total_atmosphere_mass_kg, temperature_K, gravity, planet_radius)');
    }
    
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
// FONCTIONS HELPER POUR CALCULER LES PARAMÈTRES DEPUIS LA CONFIG
// ============================================================================

/**
 * Calcule la masse molaire moyenne de l'air depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg)
 * @param {Object} epoch - Objet époque avec n2_kg, o2_kg, co2_kg, ch4_kg
 * @returns {number|undefined} Masse molaire moyenne en kg/mol, ou undefined si impossible à calculer
 */
function calculateMolarMassAir(epoch) {
    if (!epoch) return 0; // Pas d'époque = pas d'atmosphère = 0
    
    const M_N2 = 0.02801; const M_O2 = 0.03200; const M_CO2 = 0.04401; const M_CH4 = 0.01604;
    const m_n2 = epoch.n2_kg || 0;
    const m_o2 = epoch.o2_kg || 0;
    const m_co2 = epoch.co2_kg || 0;
    const m_ch4 = epoch.ch4_kg || 0;
    const mass_sum = m_n2 + m_o2 + m_co2 + m_ch4;
    const moles_sum = (m_n2 / M_N2) + (m_o2 / M_O2) + (m_co2 / M_CO2) + (m_ch4 / M_CH4);
    
    if (moles_sum > 0) {
        return mass_sum / moles_sum;
    }
    return 0; // Pas de composants = pas d'atmosphère = 0 (au lieu de undefined)
}

/**
 * Calcule la pression atmosphérique depuis total_atmosphere_mass_kg, gravity, planet_radius
 * @param {Object} epoch - Objet époque avec total_atmosphere_mass_kg, gravity, planet_radius
 * @returns {number|undefined} Pression en atm, ou undefined si impossible à calculer
 */
function calculatePressureAtm(epoch) {
    if (!epoch) return undefined;
    
    if (epoch.total_atmosphere_mass_kg !== undefined && 
        epoch.gravity !== undefined && 
        epoch.planet_radius !== undefined) {
        const surface_area = 4 * Math.PI * Math.pow(epoch.planet_radius, 2);
        const pressure_pa = (epoch.total_atmosphere_mass_kg * epoch.gravity) / surface_area;
        return pressure_pa / 101325; // Conversion Pa -> atm
    }
    return undefined;
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
    window.calculateAtmosphereProperties = calculateAtmosphereProperties;
    window.calculatePressure = calculatePressure;
    window.calculateMolarMassAir = calculateMolarMassAir;
    window.calculatePressureAtm = calculatePressureAtm;
    
    // Constantes
    window.EARTH_TOTAL_WATER_MASS_KG = EARTH_TOTAL_WATER_MASS_KG;
    window.EARTH_ATMOSPHERE_MASS_KG = EARTH_ATMOSPHERE_MASS_KG;
    window.MASSIVE_ATM_THRESHOLD = MASSIVE_ATM_THRESHOLD;
    window.MOLAR_MASS_CO2 = MOLAR_MASS_CO2;
    window.MOLAR_MASS_CH4 = MOLAR_MASS_CH4;
    window.MOLAR_MASS_H2O = MOLAR_MASS_H2O;
    window.MOLAR_MASS_N2 = MOLAR_MASS_N2;
    window.MOLAR_MASS_O2 = MOLAR_MASS_O2;
    window.MOLAR_MASS_AR = MOLAR_MASS_AR;
}
