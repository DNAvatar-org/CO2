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

// Initialiser CONST (pointeur vers window.CONST)
// CONST est un pointeur : modifier CONST modifie automatiquement window.CONST
const CONST = window.CONST = window.CONST || {};

// Initialiser les constantes molaires en fallback (seront écrasées par compute.js si chargé après)
if (!CONST.M_CO2) {
    CONST.M_N2 = 0.02801;
    CONST.M_O2 = 0.03200;
    CONST.M_CO2 = 0.04401;
    CONST.M_CH4 = 0.01604;
    CONST.M_H2O = 0.01802;
    CONST.M_AR = 0.03995;
    CONST.molar_mass_air_ref = 0.029;
}

// ============================================================================
// FONCTION UNIFIÉE DE CONVERSION QUANTITÉ → FRACTION MOLAIRE
// ============================================================================

//Convertit une quantité de gaz (en kg) en fraction molaire
function kgToFraction(gas_kg, molar_mass_gas, total_atmosphere_mass_kg, molar_mass_air, vapor_fraction = 1.0) {
    const gas_vapor_kg = gas_kg * vapor_fraction;
    const moles_gas = gas_vapor_kg / molar_mass_gas;
    const moles_total = total_atmosphere_mass_kg / molar_mass_air;
    return moles_gas / moles_total;
}

// Fonctions wrapper supprimées : utiliser directement kgToFraction() avec CONST.M_CO2, CONST.M_CH4, etc.
// calculateAtmosphericComposition() supprimée : fonction orpheline non utilisée
// calculateAtmosphereComposition() (sans "Atmospheric") est utilisée et remplit DATA directement

// ============================================================================
// FONCTIONS DE CONVERSION FRACTION → QUANTITÉ (pour compatibilité)
// ============================================================================

//Convertit une fraction molaire de CO2 en quantité (kg)
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
    return moles_CO2 * CONST.M_CO2;
}

//Convertit une fraction molaire de CH4 en quantité (kg)
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
    return moles_CH4 * CONST.M_CH4;
}

// ============================================================================
// CALCUL DE PRESSION ET STRUCTURE ATMOSPHÉRIQUE
// ============================================================================

//Calcule les propriétés structurelles de l'atmosphère (utilise DATA directement)
function calculateAtmosphereProperties() {
    console.log(`🌬 [calculateAtmosphereProperties@calculations_atm.js]`);
    const DATA = window.DATA;
    
    const total_atmosphere_mass_kg = DATA['⚖️']['⚖️📿'] || 0;
    const temperature_K = DATA['📜']['🌡️⏳'] || 273.15;
    window.calculateMolarMassAir();
    const molar_mass_kg_mol = DATA['🌬']['🧪'] || 0.029;
    const gravity = DATA['📅']['🍎'] || 9.81;

    // Si pas d'atmosphère, retourner des valeurs minimales
    if (total_atmosphere_mass_kg <= 0 || molar_mass_kg_mol <= 0) {
        return {
            z_max: 0,
            scale_height: 0,
            is_massive: false
        };
    }

    const R = 8.314; // Constante des gaz parfaits
    
    // Calcul physique de l'échelle de hauteur H = RT / Mg
    const scale_height = (R * temperature_K) / (molar_mass_kg_mol * gravity);
    
    // Seuil pour atmosphère massive : ~5x la masse actuelle (5.15e18 kg) = 2.5e19 kg
    const is_massive = total_atmosphere_mass_kg > 2.5e19;
    
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

//Calcule la pression atmosphérique à une altitude z :: Formule barométrique P(z) = P0 * exp(-z/H)
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
    // La composition doit être fournie (pas de valeurs par défaut "aujourd'hui")
    if (!composition || Object.keys(composition).length === 0) {
        console.error("[calculatePressure] ❌ ERREUR CRITIQUE : composition manquante");
        throw new Error('calculatePressure: composition requise (pas de valeurs par défaut)');
    }
    
    const {
        CO2 = 0,
        CH4 = 0,
        H2O_vapor = 0,
        N2 = 0,
        O2 = 0,
        Ar = 0
    } = composition;
    
    // Normaliser les fractions pour s'assurer que la somme = 1.0
    const total_fraction = CO2 + CH4 + H2O_vapor + N2 + O2 + Ar;
    if (total_fraction <= 0) {
        console.error("[calculatePressure] ❌ ERREUR CRITIQUE : composition invalide (somme = 0)", composition);
        throw new Error('calculatePressure: composition invalide (somme des fractions = 0)');
    }
    const norm_factor = 1.0 / total_fraction;
    
    const M_avg = (
        CO2 * norm_factor * CONST.M_CO2 +
        CH4 * norm_factor * CONST.M_CH4 +
        H2O_vapor * norm_factor * CONST.M_H2O +
        N2 * norm_factor * CONST.M_N2 +
        O2 * norm_factor * CONST.M_O2 +
        Ar * norm_factor * CONST.M_AR
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

//Calcule la masse molaire moyenne de l'air depuis les composants (utilise DATA directement)
function calculateMolarMassAir() {
    console.log(`🌬 [calculateMolarMassAir@calculations_atm.js]`);
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    const EPOCH = DATA['📅'];
    const mass_sum = (EPOCH.n2_kg || 0) + (EPOCH.o2_kg || 0) + (EPOCH.co2_kg || 0) + (EPOCH.ch4_kg || 0);
    const moles_sum = ((EPOCH.n2_kg || 0) / CONST.M_N2) + ((EPOCH.o2_kg || 0) / CONST.M_O2) + ((EPOCH.co2_kg || 0) / CONST.M_CO2) + ((EPOCH.ch4_kg || 0) / CONST.M_CH4);
    
    DATA['🌬']['🧪'] = moles_sum > 0 ? mass_sum / moles_sum : 0;
    
    return true;
}

//Calcule la pression atmosphérique (utilise DATA directement)
function calculatePressureAtm() {
    console.log(`🌬 [calculatePressureAtm@calculations_atm.js]`);
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    const EPOCH = DATA['📅'];
    const planet_radius_m = EPOCH['📐'] * 1000;
    const surface_area = 4 * Math.PI * Math.pow(planet_radius_m, 2);
    const pressure_pa = ((EPOCH.total_atmosphere_mass_kg || 0) * EPOCH['🍎']) / surface_area;
    
    DATA['🌬']['🎈'] = pressure_pa / CONST.STANDARD_ATMOSPHERE_PA;
    
    return true;
}

// ============================================================================
// FONCTION PRINCIPALE : CALCULER COMPOSITION DEPUIS OBJET AVEC LOGOS
// ============================================================================

//Calcule la composition atmosphérique depuis DATA (met à jour DATA['🌬'])
function calculateAtmosphereComposition() {
    console.log(`🌬 [calculateAtmosphereComposition@calculations_atm.js]`);
    const DATA = window.DATA;
    
    const total_mass = DATA['⚖️']['⚖️📿'] || 0;
    
    // Fractions en masse (direct, sans conversion molaire) - unité % = fraction < 1.0
    DATA['🌬']['🍰🌬🏭'] = total_mass > 0 ? (DATA['⚖️']['⚖️🏭'] / total_mass) : 0;   // CO2 (fraction)
    DATA['🌬']['🍰🌬⛽'] = total_mass > 0 ? (DATA['⚖️']['⚖️⛽'] / total_mass) : 0;   // CH4 (fraction)
    DATA['🌬']['🍰🌬💧'] = total_mass > 0 ? (DATA['⚖️']['⚖️💧'] / total_mass) : 0;  // H2O (fraction)
    DATA['🌬']['🍰🌬🌫'] = total_mass > 0 ? (DATA['⚖️']['⚖️🌫'] / total_mass) : 0;  // O2 (fraction)
    
    // N2 = le reste (approximation : N2 représente ~78% de l'air moderne)
    const total_ges = DATA['🌬']['🍰🌬🏭'] + DATA['🌬']['🍰🌬⛽'] + DATA['🌬']['🍰🌬💧'] + DATA['🌬']['🍰🌬🌫'];
    DATA['🌬']['🍰🌬💨'] = Math.max(0, 1.0 - total_ges);  // N2 (fraction, reste)
    
    // Calculer les propriétés atmosphériques (densité, altitude, tropopause)
    const T0 = DATA['📜']['🌡️⏳'];
    const props = window.calculateAtmosphereProperties();
    const altitude = props ? props.z_max : 0; // Altitude max en mètres
    const tropopause = window.calculateTropopauseHeight ? window.calculateTropopauseHeight(T0) : 7700;
    
    // Mettre à jour DATA directement
    DATA['🌬']['📏🌬🧿'] = altitude / 1000;  // Altitude max en km
    DATA['🌬']['📏🌬🛩'] = tropopause / 1000;  // Tropopause en km
    
    // Retourner true car DATA a été modifié
    return true;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

window.co2FractionToKg = co2FractionToKg;
window.ch4FractionToKg = ch4FractionToKg;
window.calculateAtmosphereProperties = calculateAtmosphereProperties;
window.calculatePressure = calculatePressure;
window.co2FractionToKg = co2FractionToKg;
window.ch4FractionToKg = ch4FractionToKg;
window.calculateAtmosphereProperties = calculateAtmosphereProperties;
window.calculatePressure = calculatePressure;
window.calculateMolarMassAir = calculateMolarMassAir;
window.calculatePressureAtm = calculatePressureAtm;
window.calculateAtmosphereComposition = calculateAtmosphereComposition;
