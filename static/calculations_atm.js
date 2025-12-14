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
// CALCUL DE PRESSION ET STRUCTURE ATMOSPHÉRIQUE
// ============================================================================

//Calcule les propriétés structurelles de l'atmosphère (utilise DATA directement)
function calculateAtmosphereProperties() {
    console.log(`🌬 [calculateAtmosphereProperties@calculations_atm.js]`);
    const DATA = window.DATA;
    
    const temperature_K = DATA['⏳']['🌡️'];
    window.calculateMolarMassAir();
    const molar_mass_kg_mol = DATA['🌬']['🧪'];

    const CONST = window.CONST;
    
    // Calcul physique de l'échelle de hauteur H = RT / Mg
    // Éviter NaN si molar_mass_kg_mol ou gravity = 0
    const denominator = molar_mass_kg_mol * DATA['📅']['🍎'];
    const scale_height = (denominator > 0) ? (CONST.R_GAS * temperature_K) / denominator : 0;
    
    // Seuil pour atmosphère massive : ~5x la masse actuelle (5.15e18 kg) = 2.5e19 kg
    const is_massive = DATA['⚖️']['⚖️📿'] > 2.5e19;
    
    // Calcul de z_max basé sur la pression au sol P0
    // Convertir le rayon de km en mètres pour les calculs
    const planet_radius_m = DATA['📅']['📐'] * 1000;
    const surface_area = 4 * Math.PI * Math.pow(planet_radius_m, 2);
    const P0 = (surface_area > 0) ? (DATA['⚖️']['⚖️📿'] * DATA['📅']['🍎']) / surface_area : 0;
    const P_limit = 0.01;
    
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

    // Éviter NaN final
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

//Calcule la masse molaire moyenne de l'air depuis les composants (utilise DATA directement)
function calculateMolarMassAir() {
    console.log(`🌬 [calculateMolarMassAir@calculations_atm.js]`);
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    const EPOCH = DATA['📅'];
    const mass_sum = EPOCH['⚖️💨'] + EPOCH['⚖️🌫'] + EPOCH['⚖️🏭'] + EPOCH['⚖️⛽'];
    const moles_sum = (EPOCH['⚖️💨'] / CONST.M_N2) + (EPOCH['⚖️🌫'] / CONST.M_O2) + (EPOCH['⚖️🏭'] / CONST.M_CO2) + (EPOCH['⚖️⛽'] / CONST.M_CH4);
    
    // Éviter NaN si moles_sum = 0 (pas d'atmosphère)
    DATA['🌬']['🧪'] = moles_sum > 0 ? mass_sum / moles_sum : CONST.molar_mass_air_ref;
    
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
    const pressure_pa = (EPOCH['⚖️🌬'] * EPOCH['🍎']) / surface_area;
    
    // Éviter NaN si surface_area = 0 ou si pressure_pa est invalide
    DATA['🌬']['🎈'] = (surface_area > 0 && isFinite(pressure_pa)) ? pressure_pa / CONST.STANDARD_ATMOSPHERE_PA : 0;
    
    return true;
}

// ============================================================================
// FONCTION PRINCIPALE : CALCULER COMPOSITION DEPUIS OBJET AVEC LOGOS
// ============================================================================

//Calcule la composition atmosphérique depuis DATA (met à jour DATA['🌬'])
function calculateAtmosphereComposition() {
    console.log(`🌬 [calculateAtmosphereComposition@calculations_atm.js]`);
    const DATA = window.DATA;
    
    // Utiliser la masse atmosphérique (⚖️🌬) et non la masse totale (⚖️📿)
    // La masse totale inclut l'eau liquide/glace, pas l'atmosphère
    const atm_mass = DATA['⚖️']['⚖️🌬'];
    
    // Éviter NaN si atm_mass = 0
    if (atm_mass > 0) {
        // Fractions en masse (direct, sans conversion molaire) - unité % = fraction < 1.0
        DATA['🌬']['🍰🌬🏭'] = DATA['⚖️']['⚖️🏭'] / atm_mass;   // CO2 (fraction)
        DATA['🌬']['🍰🌬⛽'] = DATA['⚖️']['⚖️⛽'] / atm_mass;   // CH4 (fraction)
        DATA['🌬']['🍰🌬🌫'] = DATA['⚖️']['⚖️🌫'] / atm_mass;  // O2 (fraction)
        
        // N2 : récupérer depuis EPOCH ou calculer comme le reste
        const EPOCH = DATA['📅'];
        const N2_kg = EPOCH['⚖️💨'] || 0;
        DATA['🌬']['🍰🌬💨'] = N2_kg / atm_mass;  // N2 (fraction)
        
        // H2O atmosphérique (vapeur) : sera calculé dans calculateH2OParameters
        // Pour l'instant, utiliser 0 (sera mis à jour après)
        DATA['🌬']['🍰🌬💧'] = 0;
        
        // Vérifier que la somme des fractions = 1.0 (avec tolérance)
        const total_fraction = DATA['🌬']['🍰🌬🏭'] + DATA['🌬']['🍰🌬⛽'] + DATA['🌬']['🍰🌬🌫'] + DATA['🌬']['🍰🌬💨'];
        if (Math.abs(total_fraction - 1.0) > 0.01) {
            // Ajuster N2 pour que la somme = 1.0
            DATA['🌬']['🍰🌬💨'] = Math.max(0, 1.0 - (DATA['🌬']['🍰🌬🏭'] + DATA['🌬']['🍰🌬⛽'] + DATA['🌬']['🍰🌬🌫']));
        }
    } else {
        // Pas d'atmosphère : toutes les fractions à 0
        DATA['🌬']['🍰🌬🏭'] = 0;
        DATA['🌬']['🍰🌬⛽'] = 0;
        DATA['🌬']['🍰🌬💧'] = 0;
        DATA['🌬']['🍰🌬🌫'] = 0;
        DATA['🌬']['🍰🌬💨'] = 0;
    }
    
    // Calculer les propriétés atmosphériques (densité, altitude, tropopause)
    const T0 = DATA['⏳']['🌡️'];
    const props = window.calculateAtmosphereProperties();
    const altitude = props.z_max; // Altitude max en mètres
    const tropopause = window.calculateTropopauseHeight(T0);
    
    // Mettre à jour DATA directement
    DATA['🌬']['📏🌬🧿'] = altitude / 1000;  // Altitude max en km
    DATA['🌬']['📏🌬🛩'] = tropopause / 1000;  // Tropopause en km
    
    // Retourner true car DATA a été modifié
    return true;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

window.calculateAtmosphereProperties = calculateAtmosphereProperties;
window.calculateMolarMassAir = calculateMolarMassAir;
window.calculatePressureAtm = calculatePressureAtm;
window.calculateAtmosphereComposition = calculateAtmosphereComposition;
