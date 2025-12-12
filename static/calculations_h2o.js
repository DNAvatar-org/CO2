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


//Calcule la pression de vapeur saturante selon l'équation de Clausius-Clapeyron
function calculateSaturatedVaporPressure() {
    console.log(`💧 [calculateSaturatedVaporPressure@calculations_h2o.js]`);
    const DATA = window.DATA;
    const CONST = window.CONST;
    const temp_K = DATA['⏳']['⏳🌡️🚩'];
    const exponent = (CONST.L_VAPORIZATION / CONST.RV_WATER) * (1 / CONST.T0_WATER - 1 / temp_K);
    DATA['💧']['💧P_sat'] = CONST.P0_WATER * Math.exp(exponent);
    return true;
}

//Calcule la fraction volumique maximale de vapeur d'eau à saturation
function calculateMaxH2OVaporFraction() {
    console.log(`💧 [calculateMaxH2OVaporFraction@calculations_h2o.js]`);
    const DATA = window.DATA;
    const CONST = window.CONST;
    calculateSaturatedVaporPressure();
    const P_sat = DATA['💧']['💧P_sat'];
    const P_total = DATA['🌬']['🎈'] * CONST.STANDARD_ATMOSPHERE_PA;
    DATA['💧']['🍰⏳🌧'] = Math.min(P_sat / P_total, 1.0);
    return true;
}

//Calcule le forçage radiatif de la vapeur d'eau :: Basé sur des formules empiriques de la littérature
function calculateH2OGreenhouseForcing() {
    console.log(`💧 [calculateH2OGreenhouseForcing@calculations_h2o.js]`);
    const DATA = window.DATA;
    if (!DATA['📛']) DATA['📛'] = {};
    const h2o_vapor_fraction = DATA['🌬']['🍰🌬💧'];
    const temp_K = DATA['⏳']['⏳🌡️🚩'];
    
    if (h2o_vapor_fraction <= 0) {
        DATA['📛']['📛💧'] = 0;
        return true;
    }

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

    DATA['📛']['📛💧'] = Math.max(base_forcing * temp_factor, 0);
    return true;
}

//Calcule la contribution des nuages à l'albedo
function calculateCloudAlbedoContribution() {
    console.log(`💧 [calculateCloudAlbedoContribution@calculations_h2o.js]`);
    const DATA = window.DATA;
    const cloud_coverage = DATA['💧']['🍰💧⛅'];
    const cloud_albedo = 0.5;
    DATA['🪞']['🪞⛅'] = cloud_coverage * cloud_albedo * (1 - 0.2 * cloud_coverage);
    return true;
}

//Calcule la couverture nuageuse en fonction de la température et de l'humidité
//Modèle simplifié pour estimer la formation de nuages
function estimateCloudCoverage() {
    console.log(`💧 [estimateCloudCoverage@calculations_h2o.js]`);
    const DATA = window.DATA;
    const temp_K = DATA['⏳']['⏳🌡️🚩'];
    const h2o_vapor_fraction = DATA['🌬']['🍰🌬💧'];
    const relative_humidity = 0.8;
    
    if (h2o_vapor_fraction <= 0) {
        DATA['💧']['🍰💧⛅'] = 0;
        return true;
    }

    // Calculer la saturation maximale
    calculateMaxH2OVaporFraction();
    const max_fraction = DATA['💧']['🍰⏳🌧'];
    
    // Si on est proche de la saturation, formation de nuages
    const saturation_ratio = h2o_vapor_fraction / (max_fraction * relative_humidity);

    // Cas spécial : Hadéen (température très élevée, 2000K+)
    DATA['💧']['🍰💧⛅'] = temp_K > 2000 ? Math.max(Math.min(saturation_ratio * 0.4, 0.3), 0.05) :
                          temp_K > 350 ? Math.max(Math.min(saturation_ratio * 0.3, 0.15), 0.05) :
                          temp_K < 200 ? 0.1 :
                          Math.max(Math.min(saturation_ratio * 0.8, 0.8), 0.1);
    return true;
}

//Calcule la répartition eau vapeur / liquide / glace selon les conditions physiques
function calculateWaterPartition() {
    console.log(`💧 [calculateWaterPartition@calculations_h2o.js]`);
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    const h2o_total_fraction = DATA['⚖️']['⚖️📿'] > 0 ? (DATA['⚖️']['⚖️💧'] / DATA['⚖️']['⚖️📿']) : 0;
    
    // Pas d'atmosphère : pas de vapeur, mais on peut avoir de la glace si T < 0°C
    const hasNoAtmosphere = DATA['🌬']['🧪'] === 0 || DATA['🌬']['🎈'] === 0;
    DATA['💧']['🍰💧🧊'] = hasNoAtmosphere && DATA['⏳']['⏳🌡️🚩'] < CONST.T_FREEZE && h2o_total_fraction > 0 ? h2o_total_fraction : 0;
    DATA['💧']['🍰💧⛅'] = 0;
    DATA['💧']['🍰💧🌊'] = 0;
    DATA['💧']['🍰⏳🌧'] = 0;
    DATA['🌬']['🍰🌬💧'] = 0;
    
    // Si pas d'atmosphère, retourner
    if (hasNoAtmosphere) return true;

    // Calculer la pression de vapeur saturante
    calculateSaturatedVaporPressure();
    const P_sat = DATA['💧']['💧P_sat'];
    const P_total = DATA['🌬']['🎈'] * CONST.STANDARD_ATMOSPHERE_PA;
    const max_vapor_fraction = Math.min(P_sat / P_total, 1.0);

    // Point d'ébullition ajusté selon la pression
    const T_boil_pressure = 1 / (1 / CONST.T_BOIL - (CONST.R_GAS * Math.log(DATA['🌬']['🎈'])) / CONST.L_V);

    // Déterminer les phases selon la température
    DATA['🌬']['🍰🌬💧'] = DATA['⏳']['⏳🌡️🚩'] >= T_boil_pressure ? h2o_total_fraction : Math.min(h2o_total_fraction, max_vapor_fraction);
    DATA['💧']['🍰💧🌊'] = DATA['⏳']['⏳🌡️🚩'] >= CONST.T_FREEZE && DATA['⏳']['⏳🌡️🚩'] < T_boil_pressure ? Math.max(0, h2o_total_fraction - DATA['🌬']['🍰🌬💧']) : 0;
    DATA['💧']['🍰💧🧊'] = DATA['⏳']['⏳🌡️🚩'] < CONST.T_FREEZE ? Math.max(0, h2o_total_fraction - DATA['🌬']['🍰🌬💧']) : 0;

    // Transition liquide-glace
    DATA['💧']['🍰💧🌊'] = DATA['⏳']['⏳🌡️🚩'] > CONST.T_FREEZE - 20 && DATA['⏳']['⏳🌡️🚩'] < CONST.T_FREEZE ? DATA['💧']['🍰💧🧊'] * ((DATA['⏳']['⏳🌡️🚩'] - (CONST.T_FREEZE - 20)) / 20) * DATA['💧']['🍰💧🌊'] : DATA['💧']['🍰💧🌊'];
    DATA['💧']['🍰💧🧊'] = DATA['⏳']['⏳🌡️🚩'] > CONST.T_FREEZE - 20 && DATA['⏳']['⏳🌡️🚩'] < CONST.T_FREEZE ? DATA['💧']['🍰💧🧊'] - DATA['💧']['🍰💧🌊'] : DATA['💧']['🍰💧🧊'];

    // Normaliser
    DATA['🌬']['🍰🌬💧'] = Math.max(0, Math.min(1.0, DATA['🌬']['🍰🌬💧']));
    DATA['💧']['🍰💧🌊'] = Math.max(0, Math.min(1.0, DATA['💧']['🍰💧🌊']));
    DATA['💧']['🍰💧🧊'] = Math.max(0, Math.min(1.0, DATA['💧']['🍰💧🧊']));
    
    const total_phases = DATA['🌬']['🍰🌬💧'] + DATA['💧']['🍰💧🌊'] + DATA['💧']['🍰💧🧊'];
    const scale = total_phases > h2o_total_fraction && total_phases > 0 ? h2o_total_fraction / total_phases : 1;
    DATA['🌬']['🍰🌬💧'] *= scale;
    DATA['💧']['🍰💧🌊'] *= scale;
    DATA['💧']['🍰💧🧊'] *= scale;

    DATA['💧']['🍰⏳🌧'] = max_vapor_fraction;
    
    return true;
}

//Fonction principale : calcule tous les paramètres H2O
window.calculateH2OParameters = function () {
    const DATA = window.DATA;

    window.getMasses();
    window.calculatePressureAtm();
    window.calculateMolarMassAir();
    calculateWaterPartition();
    estimateCloudCoverage();
    calculateH2OGreenhouseForcing();
    calculateCloudAlbedoContribution();

    // Log avec les clés logo sauvegardées et les valeurs
    console.log(`💧 [calculateH2OParameters@calculations_h2o.js]`);
    console.log(`h2o=${JSON.stringify(DATA['💧'])}`);

    return true;
};

// Exposer uniquement les fonctions utilisées ailleurs (calculations.js, main.js, calculations_albedo.js)
// Note: Ces fonctions sont déjà appelées dans calculateH2OParameters, donc les exposer permet de les réutiliser sans recalculer
window.calculateH2OGreenhouseForcing = calculateH2OGreenhouseForcing;
window.calculateCloudAlbedoContribution = calculateCloudAlbedoContribution;
window.estimateCloudCoverage = estimateCloudCoverage;
window.calculateWaterPartition = calculateWaterPartition;
