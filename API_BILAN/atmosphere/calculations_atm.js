// File: API_BILAN/atmosphere/calculations_atm.js - Calculs composition atmosphérique
// Desc: En français, dans l'architecture, je suis le module de calculs atmosphériques
// Version 1.1.5
// Date: [June 08, 2025] [HH:MM UTC+1]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - Fix: use DATA['🧮']['🧮🌡️'] in calculateAtmosphereProperties (was typo 🌡️)
// - Suppression logs calculateMolarMassAir
// - co2KgToFraction, ch4KgToFraction (masse kg → fraction molaire pour updateLevelsConfig)
// - updateAtmosphereHeightFromCurrentT() : met à jour 📏🫧🧿 et 📏🫧🛩 depuis T courante (même grille verticale cold/warm start)
// - v1.1.4 : 🎈 inclut vapeur d'eau : P = (⚖️🫧 + masse_vapeur) × 🍎 / (4π×R²), masse_vapeur = ⚖️🫧×🍰🫧💧/(1−🍰🫧💧)
// - v1.1.5 : add sulfate proxy fraction 🍰🫧🌫 from DATA['⚖️']['⚖️🌫'] (separate from dry-air renormalization)
//
// ============================================================================
// CALCUL DE PRESSION ET STRUCTURE ATMOSPHÉRIQUE
// ============================================================================

//Calcule les propriétés structurelles de l'atmosphère (utilise DATA directement)
function calculateAtmosphereProperties() {
    // console.log(`🫧 [calculateAtmosphereProperties@calculations_atm.js]`);
    const DATA = window.DATA;
    
    const temperature_K = DATA['🧮']['🧮🌡️'];
    window.calculateMolarMassAir();
    const molar_mass_kg_mol = DATA['🫧']['🧪'];

    const CONST = window.CONST;
    
    // Calcul physique de l'échelle de hauteur H = RT / Mg
    // Éviter NaN si molar_mass_kg_mol ou gravity = 0
    const denominator = molar_mass_kg_mol * DATA['📅']['🍎'];
    const scale_height = (denominator > 0) ? (CONST.R_GAS * temperature_K) / denominator : 0;
    
    // Seuil pour atmosphère massive : ~5x la masse actuelle (5.15e18 kg) = 2.5e19 kg
    const is_massive = DATA['⚖️']['⚖️🫧'] > 2.5e19;
    
    // Calcul de z_max basé sur la pression au sol P0
    const planet_radius_m = DATA['📅']['📐'] * 1000;
    const surface_area = 4 * Math.PI * Math.pow(planet_radius_m, 2);
    const atm_mass = (DATA['⚖️'] && DATA['⚖️']['⚖️🫧']) ? DATA['⚖️']['⚖️🫧'] : 0;
    const P0 = atm_mass * DATA['📅']['🍎'] / surface_area;
    const P_limit = 0.01;

    // Tout à 0 (pas d'atmosphère) → une seule couche très fine, calcul en une passe (corps noir, 🧲🌈🔼 = σT⁴)
    if (atm_mass <= 0 || P0 <= 0) {
        return { z_max: 1e-6, scale_height: 0, is_massive: false };
    }

    // Éviter NaN si scale_height = 0 ou P0 invalide
    let z_max_theoretical = 0;
    if (scale_height > 0 && P0 > 0) {
        z_max_theoretical = scale_height * Math.log(Math.max(P0, 1e-5) / P_limit);
        z_max_theoretical = Math.max(0, z_max_theoretical);
    }

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

    if (!isFinite(z_max) || isNaN(z_max)) {
        z_max = 0;
    }

    return {
        z_max, // en mètres
        scale_height, // en mètres
        is_massive
    };
}


// ============================================================================
// FONCTIONS HELPER POUR CALCULER LES PARAMÈTRES DEPUIS LA CONFIG
// ============================================================================

//Calcule la masse molaire moyenne de l'air depuis les fractions actuelles (utilise DATA directement)
function calculateMolarMassAir() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    // 🔒 UTILISER LES FRACTIONS ACTUELLES (après renormalisation avec H2O), pas les masses de l'époque
    // Les fractions sont déjà normalisées : 🍰🫧🏭 + 🍰🫧⛽ + 🍰🫧🫁 + 🍰🫧💨 + 🍰🫧💧 = 1.0
    const frac_CO2 = DATA['🫧']['🍰🫧🏭'] || 0;
    const frac_CH4 = DATA['🫧']['🍰🫧⛽'] || 0;
    const frac_O2 = DATA['🫧']['🍰🫧🫁'] || 0;
    const frac_N2 = DATA['🫧']['🍰🫧💨'] || 0;
    const frac_H2O = DATA['💧']['🍰🫧💧'] || 0;
    // Masse molaire moyenne pondérée par les fractions molaires (approximation : fractions volumiques ≈ fractions molaires)
    // M_air = Σ(fraction_i × M_i)
    const M_air = frac_CO2 * CONST.M_CO2 + 
                   frac_CH4 * CONST.M_CH4 + 
                   frac_O2 * CONST.M_O2 + 
                   frac_N2 * CONST.M_N2 + 
                   frac_H2O * CONST.M_H2O;
    
    // Si pas d'atmosphère, utiliser la valeur de référence
    DATA['🫧']['🧪'] = M_air > 0 ? M_air : CONV.molar_mass_air_ref;
    return true;
}

// Calcule la pression atmosphérique (utilise DATA directement).
// P = (masse totale × 🍎) / (4π × R²) ; masse totale = air sec (⚖️🫧) + vapeur d'eau.
// Vapeur : 🍰🫧💧 = fraction massique vapeur ⇒ masse_vapeur = ⚖️🫧 × 🍰🫧💧 / (1 − 🍰🫧💧).
// → 🎈 ~0.988–0.995 atm (2025) au lieu de ~0.976 si on ignorait la vapeur (📏🫧🛩, Clausius-Clapeyron cohérents).
function calculatePressureAtm() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = DATA['📅'];
    const planet_radius_m = EPOCH['📐'] * 1000;
    const surface_area = 4 * Math.PI * Math.pow(planet_radius_m, 2);
    const atm_mass_dry = DATA['⚖️']['⚖️🫧'];
    const frac_vapor = (DATA['💧'] && DATA['💧']['🍰🫧💧'] != null) ? DATA['💧']['🍰🫧💧'] : 0;
    const denom = Math.max(1e-10, 1 - frac_vapor);
    const mass_vapor = (frac_vapor > 0 && frac_vapor < 1) ? (atm_mass_dry * frac_vapor / denom) : 0;
    const atm_mass_total = atm_mass_dry + mass_vapor;
    const gravity = EPOCH['🍎'];
    const pressure_pa = (atm_mass_total * gravity) / surface_area;

    DATA['🫧']['🎈'] = (surface_area > 0 && isFinite(pressure_pa) && pressure_pa > 0) ? pressure_pa / CONV.STANDARD_ATMOSPHERE_PA : 0;

    return true;
}

// ============================================================================
// FONCTION PRINCIPALE : CALCULER COMPOSITION DEPUIS OBJET AVEC LOGOS
// ============================================================================

//Calcule la composition atmosphérique depuis DATA (met à jour DATA['🫧'])
function calculateAtmosphereComposition() {
    const DATA = window.DATA;
    // 🔒 CORRECTION : Les fractions sont calculées par rapport à ⚖️🫧 (masse atmosphérique totale)
    // ⚖️🫧 = ⚖️🏭 + ⚖️⛽ + ⚖️🫁 + ⚖️💨 (air sec, sans vapeur d'eau pour l'instant)
    // La vapeur d'eau sera ajoutée après dans calculateWaterPartition()
    const atm_mass_total = DATA['⚖️']['⚖️🫧'];
    
    // 🔒 Protection contre undefined/NaN : traiter comme 0
    const mass_CO2 = isFinite(DATA['⚖️']['⚖️🏭']) ? DATA['⚖️']['⚖️🏭'] : 0;
    const mass_CH4 = isFinite(DATA['⚖️']['⚖️⛽']) ? DATA['⚖️']['⚖️⛽'] : 0;
    const mass_O2 = isFinite(DATA['⚖️']['⚖️🫁']) ? DATA['⚖️']['⚖️🫁'] : 0;
    const mass_N2 = isFinite(DATA['⚖️']['⚖️💨']) ? DATA['⚖️']['⚖️💨'] : 0;
    const mass_SULFATE = isFinite(DATA['⚖️']['⚖️🌫']) ? DATA['⚖️']['⚖️🌫'] : 0;
    
    // 🔒 GESTION CAS SANS ATMOSPHÈRE (corps noir, etc.) : toutes les fractions à 0
    if (atm_mass_total <= 0) {
        DATA['🫧']['🍰🫧🏭'] = 0;
        DATA['🫧']['🍰🫧⛽'] = 0;
        DATA['🫧']['🍰🫧🫁'] = 0;
        DATA['🫧']['🍰🫧💨'] = 0;
        DATA['🫧']['🍰🫧🌫'] = 0;
        DATA['💧']['🍰🫧💧'] = 0;
    } else {
        // 🔒 FORMULES CORRIGÉES : Toutes les fractions sont calculées par rapport à ⚖️🫧
        // 🍰🫧🏭 = ⚖️🏭 / ⚖️🫧
        DATA['🫧']['🍰🫧🏭'] = mass_CO2 / atm_mass_total;
        // 🍰🫧⛽ = ⚖️⛽ / ⚖️🫧
        DATA['🫧']['🍰🫧⛽'] = mass_CH4 / atm_mass_total;
        
        // 🍰🫧🫁 = ⚖️🫁 / ⚖️🫧
        DATA['🫧']['🍰🫧🫁'] = mass_O2 / atm_mass_total;
        
        // 🍰🫧💨 = ⚖️💨 / ⚖️🫧
        DATA['🫧']['🍰🫧💨'] = mass_N2 / atm_mass_total;
        // 🍰🫧🌫 = ⚖️🌫 / ⚖️🫧 (proxy CCN ; hors renormalisation air sec)
        DATA['🫧']['🍰🫧🌫'] = mass_SULFATE / atm_mass_total;
    }
        
    // H2O atmosphérique (vapeur) : sera calculé dans calculateWaterPartition()
    // 🍰🫧💧 = ⚖️💧 × 🍰🧮🌧 / ⚖️🫧 (sera calculé après)
    DATA['💧']['🍰🫧💧'] = 0;
        
    // Vérifier que la somme des fractions de l'air sec = 1.0 (avec tolérance)
    const total_fraction_dry = DATA['🫧']['🍰🫧🏭'] + DATA['🫧']['🍰🫧⛽'] + DATA['🫧']['🍰🫧🫁'] + DATA['🫧']['🍰🫧💨'];
    if (Math.abs(total_fraction_dry - 1.0) > 0.01) {
        // Ajuster N2 pour que la somme de l'air sec = 1.0
        DATA['🫧']['🍰🫧💨'] = Math.max(0, 1.0 - (DATA['🫧']['🍰🫧🏭'] + DATA['🫧']['🍰🫧⛽'] + DATA['🫧']['🍰🫧🫁']));
    }
    
    const props = window.calculateAtmosphereProperties();
    const altitude = props.z_max;
    const tropopause = calculateTropopauseHeight();
    
    // Mettre à jour DATA directement
    DATA['🫧']['📏🫧🧿'] = altitude / 1000;  // Altitude max en km
    DATA['🫧']['📏🫧🛩'] = tropopause / 1000;  // Tropopause en km
    
    return true;
}

/** Met à jour 📏🫧🧿 et 📏🫧🛩 à partir de la T courante (DATA['🧮']['🧮🌡️']).
 *  À appeler au début de chaque pas radiatif pour que cold start et warm start
 *  aient la même grille verticale à même T (évite Δ différent à 15,8°C). */
function updateAtmosphereHeightFromCurrentT() {
    const props = window.calculateAtmosphereProperties();
    const tropopause_m = calculateTropopauseHeight();
    window.DATA['🫧']['📏🫧🧿'] = props.z_max / 1000;
    window.DATA['🫧']['📏🫧🛩'] = tropopause_m / 1000;
    return true;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

function calculateTropopauseHeight() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const atm_mass = (DATA['⚖️'] && DATA['⚖️']['⚖️🫧']) ? DATA['⚖️']['⚖️🫧'] : 0;
    if (atm_mass <= 0) return 0;
    return (CONST.R_GAS * DATA['🧮']['🧮🌡️']) / (DATA['🫧']['🧪'] * EPOCH['🍎']);
}

function pressureAtZ(z) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    if (DATA['⚖️']['⚖️🫧'] === 0) return 0;
    const P0_pa = (DATA['🫧']['🎈'] != null && DATA['🫧']['🎈'] > 0) ? DATA['🫧']['🎈'] * CONV.STANDARD_ATMOSPHERE_PA : (DATA['⚖️']['⚖️🫧'] * EPOCH['🍎']) / (4 * Math.PI * Math.pow(EPOCH['📐'] * 1000, 2));
    const H = (CONST.R_GAS * DATA['🧮']['🧮🌡️']) / (DATA['🫧']['🧪'] * EPOCH['🍎']);
    return P0_pa * Math.exp(-z / H);
}

function airNumberDensityAtZ(z) {
    const CONST = window.CONST;
    return pressureAtZ(z) / (CONST.BOLTZMANN_KB * window.temperatureAtZ(z));
}

/** Convertit masse CO2 (kg) en fraction molaire : (mass_CO2/M_CO2) / (mass_total/M_air) */
function co2KgToFraction(co2_kg, total_atm_kg, molar_mass_air) {
    const CONST = window.CONST;
    if (!total_atm_kg || total_atm_kg <= 0) return 0;
    const M_air = molar_mass_air && molar_mass_air > 0 ? molar_mass_air : CONV.molar_mass_air_ref;
    return (co2_kg * M_air) / (total_atm_kg * CONST.M_CO2);
}

/** Convertit masse CH4 (kg) en fraction molaire : (mass_CH4/M_CH4) / (mass_total/M_air) */
function ch4KgToFraction(ch4_kg, total_atm_kg, molar_mass_air) {
    const CONST = window.CONST;
    if (!total_atm_kg || total_atm_kg <= 0) return 0;
    const M_air = molar_mass_air && molar_mass_air > 0 ? molar_mass_air : CONV.molar_mass_air_ref;
    return (ch4_kg * M_air) / (total_atm_kg * CONST.M_CH4);
}

var ATM = window.ATM = window.ATM || {};
ATM.calculateAtmosphereProperties = calculateAtmosphereProperties;
ATM.calculateMolarMassAir = calculateMolarMassAir;
ATM.calculatePressureAtm = calculatePressureAtm;
ATM.calculateAtmosphereComposition = calculateAtmosphereComposition;
ATM.updateAtmosphereHeightFromCurrentT = updateAtmosphereHeightFromCurrentT;
ATM.calculateTropopauseHeight = calculateTropopauseHeight;
ATM.pressureAtZ = pressureAtZ;
ATM.airNumberDensityAtZ = airNumberDensityAtZ;
ATM.co2KgToFraction = co2KgToFraction;
ATM.ch4KgToFraction = ch4KgToFraction;
window.calculateAtmosphereProperties = calculateAtmosphereProperties;
window.calculateMolarMassAir = calculateMolarMassAir;
window.calculatePressureAtm = calculatePressureAtm;
window.calculateAtmosphereComposition = calculateAtmosphereComposition;
window.updateAtmosphereHeightFromCurrentT = updateAtmosphereHeightFromCurrentT;
window.calculateTropopauseHeight = calculateTropopauseHeight;
window.pressureAtZ = pressureAtZ;
window.airNumberDensityAtZ = airNumberDensityAtZ;
window.co2KgToFraction = co2KgToFraction;
window.ch4KgToFraction = ch4KgToFraction;
