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

// Initialiser window.CONST avec les constantes molaires
if (typeof window !== 'undefined') {
    if (!window.CONST) {
        window.CONST = {};
    }
    window.CONST.M_N2 = 0.02801;      // N₂ : 28.01 g/mol
    window.CONST.M_O2 = 0.03200;      // O₂ : 32.00 g/mol
    window.CONST.M_CO2 = 0.04401;     // CO₂ : 44.01 g/mol
    window.CONST.M_CH4 = 0.01604;     // CH₄ : 16.04 g/mol
    window.CONST.M_H2O = 0.01802;     // H₂O : 18.02 g/mol
    window.CONST.M_AR = 0.03995;      // Ar : 39.95 g/mol
    window.CONST.molar_mass_air_ref = 0.029;  // Masse molaire moyenne de l'air de référence (kg/mol)
}

// Constantes locales pour compatibilité (seront remplacées par window.CONST)
const MOLAR_MASS_CO2 = window.CONST.M_CO2;
const MOLAR_MASS_CH4 = window.CONST.M_CH4;
const MOLAR_MASS_H2O = window.CONST.M_H2O;
const MOLAR_MASS_N2 = window.CONST.M_N2;
const MOLAR_MASS_O2 = window.CONST.M_O2;
const MOLAR_MASS_AR = window.CONST.M_AR;

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
// FONCTION UNIFIÉE DE CONVERSION QUANTITÉ → FRACTION MOLAIRE
// ============================================================================

/**
 * Convertit une quantité de gaz (en kg) en fraction molaire
 * @param {number} gas_kg - Quantité de gaz en kg
 * @param {number} molar_mass_gas - Masse molaire du gaz en kg/mol
 * @param {number} total_atmosphere_mass_kg - Masse totale de l'atmosphère en kg
 * @param {number} molar_mass_air - Masse molaire moyenne de l'air en kg/mol
 * @param {number} vapor_fraction - Fraction vapeur (pour H2O uniquement, défaut: 1.0)
 * @returns {number} Fraction molaire (0-1)
 */
function kgToFraction(gas_kg, molar_mass_gas, total_atmosphere_mass_kg, molar_mass_air, vapor_fraction = 1.0) {
    const gas_vapor_kg = gas_kg * vapor_fraction;
    const moles_gas = gas_vapor_kg / molar_mass_gas;
    const moles_total = total_atmosphere_mass_kg / molar_mass_air;
    return moles_gas / moles_total;
}

// Fonctions de compatibilité (utilisent la fonction unifiée)
function co2KgToFraction(co2_kg, total_atmosphere_mass_kg, molar_mass_air) {
    return kgToFraction(co2_kg, window.CONST.M_CO2, total_atmosphere_mass_kg, molar_mass_air);
}

function ch4KgToFraction(ch4_kg, total_atmosphere_mass_kg, molar_mass_air) {
    return kgToFraction(ch4_kg, window.CONST.M_CH4, total_atmosphere_mass_kg, molar_mass_air);
}

function h2oKgToVaporFraction(h2o_total_kg, vapor_fraction, total_atmosphere_mass_kg, molar_mass_air) {
    return kgToFraction(h2o_total_kg, window.CONST.M_H2O, total_atmosphere_mass_kg, molar_mass_air, vapor_fraction);
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
    return moles_CO2 * window.CONST.M_CO2;
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
    return moles_CH4 * window.CONST.M_CH4;
}

// ============================================================================
// CALCUL DE PRESSION ET STRUCTURE ATMOSPHÉRIQUE
// ============================================================================

/**
 * Calcule les propriétés structurelles de l'atmosphère (utilise DATA directement, pas de paramètres)
 * Retourne { z_max: number, scale_height: number, is_massive: boolean }
 */
function calculateAtmosphereProperties() {
    const DATA = window.DATA;
    const KEYS = window.KEYS;
    const CONST = window.CONST;
    
    const total_atmosphere_mass_kg = DATA['🐳']['🐳📿'];
    const temperature_K = DATA['📜']['🌡️⏳'];
    const molar_mass_kg_mol = window.calculateMolarMassAir();
    const gravity = DATA['📅']['🐋'];

    const R = 8.314; // Constante des gaz parfaits
    
    // Calcul physique de l'échelle de hauteur H = RT / Mg
    const scale_height = (R * temperature_K) / (molar_mass_kg_mol * gravity);
    
    const is_massive = total_atmosphere_mass_kg > MASSIVE_ATM_THRESHOLD;
    
    // Calcul de z_max basé sur la pression au sol P0
    // Convertir le rayon de km en mètres pour les calculs
    const planet_radius_m = DATA['📅']['📐'] * 1000;
    const surface_area = 4 * Math.PI * Math.pow(planet_radius_m, 2);
    const P0 = (total_atmosphere_mass_kg * gravity) / surface_area;
    const P_limit = 0.01;
    
    let z_max_theoretical = scale_height * Math.log(Math.max(P0, 1e-5) / P_limit);
    z_max_theoretical = Math.max(0, z_max_theoretical);
    
    let z_max = z_max_theoretical;
    if (P0 > 100) {
        z_max = Math.max(120000, z_max_theoretical);
    } else {
        z_max = Math.max(1, z_max_theoretical); 
    }
    
    if (is_massive && z_max < 300000) {
        z_max = 300000;
    }

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
        CO2 * norm_factor * window.CONST.M_CO2 +
        CH4 * norm_factor * window.CONST.M_CH4 +
        H2O_vapor * norm_factor * window.CONST.M_H2O +
        N2 * norm_factor * window.CONST.M_N2 +
        O2 * norm_factor * window.CONST.M_O2 +
        Ar * norm_factor * window.CONST.M_AR
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
 * Calcule la masse molaire moyenne de l'air depuis les composants (utilise DATA.EPOCH directement)
 * Retourne la masse molaire en kg/mol
 */
function calculateMolarMassAir() {
    const DATA = window.DATA;
    const KEYS = window.KEYS;
    const CONST = window.CONST;
    
    const epoch = DATA['📅'];
    const mass_sum = epoch.n2_kg + epoch.o2_kg + epoch.co2_kg + epoch.ch4_kg;
    const moles_sum = (epoch.n2_kg / CONST.M_N2) + (epoch.o2_kg / CONST.M_O2) + (epoch.co2_kg / CONST.M_CO2) + (epoch.ch4_kg / CONST.M_CH4);
    
        return mass_sum / moles_sum;
}

/**
 * Calcule la pression atmosphérique (utilise DATA.EPOCH directement)
 * Retourne la pression en atm
 */
function calculatePressureAtm() {
    const DATA = window.DATA;
    const KEYS = window.KEYS;
    
    const epoch = DATA['📅'];
        // Convertir le rayon de km en mètres pour les calculs
        const planet_radius_m = epoch['📐'] * 1000;
        const surface_area = 4 * Math.PI * Math.pow(planet_radius_m, 2);
        const pressure_pa = (epoch.total_atmosphere_mass_kg * epoch.gravity) / surface_area;
        return pressure_pa / 101325; // Conversion Pa -> atm
}

// ============================================================================
// FONCTION PRINCIPALE : CALCULER COMPOSITION DEPUIS OBJET AVEC LOGOS
// ============================================================================

/**
 * Calcule la composition atmosphérique (utilise DATA directement, pas de paramètres)
 * Retourne true si DATA a été modifié
 */
function calculateCompositionFromLogoConfig() {
    const DATA = window.DATA;
    const KEYS = window.KEYS;
    
    // Calculer la masse molaire moyenne
    const molar_mass_air = window.calculateMolarMassAir();
    
    // Calculer les fractions molaires directement depuis DATA
    const CO2_fraction = co2KgToFraction(DATA['🐳']['🐳🏭'], DATA['🐳']['🐳📿'], molar_mass_air);
    const CH4_fraction = ch4KgToFraction(DATA['🐳']['🐳⛽'], DATA['🐳']['🐳📿'], molar_mass_air);
    
    // Pour H2O, on utilise une fraction vapeur par défaut (sera calculée plus tard dans calculations_h2o)
    const h2o_vapor_fraction_default = 1.0; // Approximation : tout en vapeur pour le calcul initial
    const H2O_fraction = h2oKgToVaporFraction(DATA['🐳']['🐳💧'], h2o_vapor_fraction_default, DATA['🐳']['🐳📿'], molar_mass_air);
    
    // Pour O2, convertir kg en fraction molaire
    const moles_O2 = DATA['🐳']['🐳🌫'] / window.CONST.M_O2;
    const moles_total = DATA['🐳']['🐳📿'] / molar_mass_air;
    const O2_fraction = moles_O2 / moles_total;
    
    // Calculer N2 comme "le reste" après avoir soustrait les autres gaz
    const total_ges_fraction = CO2_fraction + CH4_fraction + H2O_fraction;
    const remaining_fraction = Math.max(0, 1.0 - (total_ges_fraction + O2_fraction));
    const N2_fraction = remaining_fraction * 0.78; // 78% du reste
    
    // Calculer les propriétés atmosphériques (densité, altitude, tropopause)
    const T0 = DATA['📜']['🌡️⏳'];
    const props = window.calculateAtmosphereProperties();
    const altitude = props.z_max; // Altitude max en mètres
    const tropopause = window.calculateTropopauseHeight(T0);
    
    // Mettre à jour DATA directement
    DATA['🌬']['📏🌬🧿'] = altitude / 1000;  // Altitude max en km
    DATA['🌬']['📏🌬🛩'] = tropopause / 1000;  // Tropopause en km
    DATA['🌬']['🍰🌬🌫'] = O2_fraction * 100;    // O2 en %
    DATA['🌬']['🍰🌬🏭'] = CO2_fraction * 100;   // CO2 en %
    DATA['🌬']['🍰🌬💧'] = H2O_fraction * 100;  // H2O en %
    DATA['🌬']['🍰🌬⛽'] = CH4_fraction * 100;   // CH4 en %
    DATA['🌬']['🍰🌬⚗'] = N2_fraction * 100;    // N2 en %
    
    // Retourner true car DATA a été modifié
    return true;
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
    window.calculateCompositionFromLogoConfig = calculateCompositionFromLogoConfig;
    
    // Constantes
    window.EARTH_TOTAL_WATER_MASS_KG = EARTH_TOTAL_WATER_MASS_KG;
    window.EARTH_ATMOSPHERE_MASS_KG = EARTH_ATMOSPHERE_MASS_KG;
    window.MASSIVE_ATM_THRESHOLD = MASSIVE_ATM_THRESHOLD;
    // Les constantes molaires sont maintenant dans window.CONST
}
