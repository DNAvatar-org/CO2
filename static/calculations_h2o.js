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
    const DATA = window.DATA;
    const CONST = window.CONST;
    const temp_K = DATA['🧮']['🌡️'];
    const exponent = (CONST.L_VAPORIZATION / CONST.RV_WATER) * (1 / CONST.T0_WATER - 1 / temp_K);
    return CONST.P0_WATER * Math.exp(exponent);
}

//Calcule la fraction volumique maximale de vapeur d'eau à saturation
function calculateMaxH2OVaporFraction() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const P_sat = calculateSaturatedVaporPressure();
    const P_total = DATA['🫧']['🎈'] * CONST.STANDARD_ATMOSPHERE_PA;
    DATA['💧']['🍰🧮🌧'] = Math.min(P_sat / P_total, 1.0);
    return true;
}

//Calcule le forçage radiatif de la vapeur d'eau :: Basé sur des formules empiriques de la littérature
function calculateH2OGreenhouseForcing() {
    // console.log(`💧 [calculateH2OGreenhouseForcing@calculations_h2o.js]`);
    const DATA = window.DATA;
    if (!DATA['📛']) DATA['📛'] = {};
    const h2o_vapor_fraction = DATA['🫧']['🍰🫧💧'];
    const temp_K = DATA['🧮']['🌡️'];
    
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
    // Note: L'albedo des nuages est calculé directement dans calculateAlbedo()
    // Cette fonction est conservée pour compatibilité mais ne fait plus rien
    return true;
}

// 🔒 SUPPRIMÉ : estimateCloudCoverage() - Les nuages ne sont pas un stock d'eau
// Les nuages sont maintenant calculés via calculateCloudFormationIndex() dans calculations_albedo.js
// qui calcule ☁️ (CloudFormationIndex) puis 🍰🪩⛅ (couverture nuageuse pour albedo)

//Calcule la répartition eau vapeur / liquide / glace selon les conditions physiques
// 🔒 NOUVEAU : Utilise les surfaces géologiques pour contraindre la répartition
function calculateWaterPartition() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    
    const h2o_total_fraction = DATA['⚖️']['⚖️🫧'] > 0 ? (DATA['⚖️']['⚖️💧'] / DATA['⚖️']['⚖️🫧']) : 0;
    const h2o_total_mass_kg = DATA['⚖️']['⚖️💧'];
    
    // 🔒 ÉTAPE 1 : Obtenir les surfaces géologiques (doit être calculé avant)
    if (!window.calculateGeologySurfaces || !window.calculateGeologySurfaces()) {
        console.error(`❌ [calculateWaterPartition] calculateGeologySurfaces() a échoué`);
        return false;
    }
    const highlands_fraction = DATA['🗻']['🍰🗻🏔'];
    
    // Pas d'atmosphère : pas de vapeur, mais on peut avoir de la glace si T < 0°C
    const hasNoAtmosphere = DATA['🫧']['🧪'] === 0 || DATA['🫧']['🎈'] === 0;
    DATA['💧']['🍰💧🧊'] = hasNoAtmosphere && DATA['🧮']['🌡️'] < CONST.T_FREEZE && h2o_total_fraction > 0 ? h2o_total_fraction : 0;
    // 🔒 REFONTE : 🍰💧⛅ supprimé (nuages ne sont pas un stock d'eau)
    DATA['💧']['🍰💧🌊'] = 0;
    DATA['💧']['🍰🧮🌧'] = 0;
    DATA['🫧']['🍰🫧💧'] = 0;
    
    // Si pas d'atmosphère, retourner
    if (hasNoAtmosphere) return true;

    // Calculer la pression de vapeur saturante
    const P_sat = calculateSaturatedVaporPressure();
    const P_total = DATA['🫧']['🎈'] * CONST.STANDARD_ATMOSPHERE_PA;
    const max_vapor_fraction = Math.min(P_sat / P_total, 1.0);

    // Point d'ébullition ajusté selon la pression
    const T_boil_pressure = 1 / (1 / CONST.T_BOIL - (CONST.R_GAS * Math.log(DATA['🫧']['🎈'])) / CONST.L_V);

    // 🔒 ÉTAPE 2 : Déterminer la glace selon la température ET les surfaces disponibles
    // La glace est limitée par les hautes terres disponibles (géologie)
    const temp_C = DATA['🧮']['🌡️'] - 273.15;
    const has_polar_ice = temp_C < 20;
    
    // Calculer la fraction de glace souhaitée selon le climat
    // À 0°C : ~10% de glace (calottes polaires), à 20°C : 0% de glace
    const polar_ice_fraction_climate = has_polar_ice ? Math.max(0, Math.min(0.10, (20 - temp_C) / 20 * 0.10)) : 0;
    
    // 🔒 CONTRAINTE GÉOLOGIQUE : La glace ne peut pas dépasser les hautes terres disponibles
    // polar_ice_fraction est une fraction de surface, limitée par highlands_fraction
    const polar_ice_fraction = Math.min(highlands_fraction, polar_ice_fraction_climate);
    
    // 🔒 FORMULE CORRIGÉE : 🍰🫧💧 = ⚖️💧 × 🍰🧮🌧 / ⚖️🫧
    // Où :
    //   ⚖️💧 = masse totale d'eau (kg)
    //   🍰🧮🌧 = max vapor fraction (P_sat / P_total)
    //   ⚖️🫧 = masse atmosphérique totale (kg) = ⚖️🏭 + ⚖️⛽ + ⚖️🌫 + ⚖️💨
    //
    // Calculer la masse de vapeur d'eau possible (TOUJOURS limitée par la pression de vapeur saturante)
    // ⚠️ IMPORTANT : Même à l'ébullition, on ne peut pas avoir 100% de l'atmosphère en vapeur d'eau !
    // La limite physique est toujours la pression de vapeur saturante (loi de Dalton)
    const atm_mass_total = DATA['⚖️']['⚖️🫧'];
    
    // max_vapor_fraction est déjà calculé comme P_sat / P_total (fraction molaire maximale)
    // Convertir en masse : masse_vapeur = max_vapor_fraction * masse_atmosphère * (M_H2O / M_air)
    // Approximation : M_H2O ≈ 0.018 kg/mol, M_air ≈ 0.029 kg/mol, donc ratio ≈ 0.62
    const M_H2O = CONST.M_H2O;
    const M_air = DATA['🫧']['🧪'];
    const mass_ratio = M_H2O / M_air; // ~0.62
    const max_vapor_mass_kg = max_vapor_fraction * atm_mass_total * mass_ratio;
    const h2o_vapor_mass_kg = Math.min(DATA['⚖️']['⚖️💧'], max_vapor_mass_kg);
    
    // 🍰🫧💧 = fraction de vapeur d'eau dans l'atmosphère totale
    DATA['🫧']['🍰🫧💧'] = atm_mass_total > 0 ? Math.min(1.0, h2o_vapor_mass_kg / atm_mass_total) : 0;
    
    // 🔒 RENORMALISATION : Les fractions de l'air sec doivent être ajustées pour que la somme totale = 1.0
    // Si 🍰🫧💧 > 0, alors les fractions de l'air sec doivent être multipliées par (1 - 🍰🫧💧)
    if (DATA['🫧']['🍰🫧💧'] > 0 && DATA['🫧']['🍰🫧💧'] < 1.0) {
        const dry_air_fraction = 1.0 - DATA['🫧']['🍰🫧💧'];
        // Renormaliser les fractions de l'air sec pour qu'elles représentent des fractions de l'atmosphère totale
        DATA['🫧']['🍰🫧🏭'] = DATA['🫧']['🍰🫧🏭'] * dry_air_fraction;
        DATA['🫧']['🍰🫧⛽'] = DATA['🫧']['🍰🫧⛽'] * dry_air_fraction;
        DATA['🫧']['🍰🫧🌫'] = DATA['🫧']['🍰🫧🌫'] * dry_air_fraction;
        DATA['🫧']['🍰🫧💨'] = DATA['🫧']['🍰🫧💨'] * dry_air_fraction;
    }
    
    // Calculer la masse d'eau restante (après vapeur) pour liquide/glace
    // h2o_vapor_mass_kg est la masse de vapeur d'eau (en kg)
    // h2o_vapor_mass_fraction_of_total = fraction de vapeur par rapport à la masse totale d'eau (⚖️💧)
    const h2o_vapor_mass_fraction_of_total = DATA['⚖️']['⚖️💧'] > 0 ? (h2o_vapor_mass_kg / DATA['⚖️']['⚖️💧']) : 0;
    const remaining_after_vapor = Math.max(0, h2o_total_fraction - h2o_vapor_mass_fraction_of_total);
    
    // CORRECTION: L'eau de mer gèle à ~-2°C (271K), pas 0°C
    // Et ça dépend de la pression (plus de pression = point de congélation plus bas)
    // Pour simplifier, utiliser -2°C comme point de congélation de l'eau de mer
    const T_FREEZE_SEAWATER = 271.15; // -2°C (eau de mer)
    const pressure_atm = DATA['🫧']['🎈'];
    // Ajuster selon la pression : plus de pression = point de congélation plus bas
    // À 1 atm : -2°C, à 2 atm : ~-3°C (approximation linéaire)
    const T_freeze_adjusted = T_FREEZE_SEAWATER - (pressure_atm - 1) * 1.0; // -1°C par atm supplémentaire
    
    // Si température < point de congélation ajusté : toute l'eau restante est glace
    // Si température >= point de congélation ajusté : glace aux pôles seulement
    if (DATA['🧮']['🌡️'] < T_freeze_adjusted) {
        DATA['💧']['🍰💧🧊'] = remaining_after_vapor;
        DATA['💧']['🍰💧🌊'] = 0;
    } else {
        DATA['💧']['🍰💧🧊'] = polar_ice_fraction;
        DATA['💧']['🍰💧🌊'] = Math.max(0, remaining_after_vapor - polar_ice_fraction);
    }

    // Transition liquide-glace (zone de transition entre -20°C et point de congélation ajusté)
    // T_FREEZE_SEAWATER et T_freeze_adjusted déjà déclarés plus haut, réutiliser
    const pressure_atm_transition = DATA['🫧']['🎈'];
    // T_freeze_adjusted déjà calculé ligne 206, réutiliser cette valeur
    if (DATA['🧮']['🌡️'] > T_freeze_adjusted - 20 && DATA['🧮']['🌡️'] < T_freeze_adjusted) {
        const transition_factor = (DATA['🧮']['🌡️'] - (CONST.T_FREEZE - 20)) / 20;
        const ice_before = DATA['💧']['🍰💧🧊'];
        const liquid_before = DATA['💧']['🍰💧🌊'];
        // Convertir une partie de la glace en liquide selon la température
        const ice_to_liquid = ice_before * (1 - transition_factor);
        DATA['💧']['🍰💧🌊'] = liquid_before + ice_to_liquid;
        DATA['💧']['🍰💧🧊'] = ice_before - ice_to_liquid;
    }

    // Normaliser pour que la somme des phases (liquide + glace) = h2o_total_fraction - vapeur
    // ⚠️ IMPORTANT : 🍰🫧💧 est une fraction de la masse atmosphérique (⚖️🫧)
    // Donc on ne normalise QUE les phases liquide/glace (qui sont des fractions de la masse totale d'eau ⚖️💧)
    // La vapeur (🍰🫧💧) reste une fraction de la masse atmosphérique
    // h2o_vapor_mass_kg est déjà calculé plus haut, on l'utilise directement
    const h2o_vapor_mass_fraction_of_total_final = DATA['⚖️']['⚖️💧'] > 0 ? (h2o_vapor_mass_kg / DATA['⚖️']['⚖️💧']) : 0;
    const total_liquid_ice = DATA['💧']['🍰💧🌊'] + DATA['💧']['🍰💧🧊'];
    const expected_liquid_ice = Math.max(0, h2o_total_fraction - h2o_vapor_mass_fraction_of_total_final);
    
    // Normaliser liquide/glace si nécessaire
    if (total_liquid_ice > 0 && expected_liquid_ice > 0) {
        const scale = expected_liquid_ice / total_liquid_ice;
        DATA['💧']['🍰💧🌊'] = Math.max(0, Math.min(1.0, DATA['💧']['🍰💧🌊'] * scale));
        DATA['💧']['🍰💧🧊'] = Math.max(0, Math.min(1.0, DATA['💧']['🍰💧🧊'] * scale));
    } else if (expected_liquid_ice <= 0) {
        // Toute l'eau est en vapeur
        DATA['💧']['🍰💧🌊'] = 0;
        DATA['💧']['🍰💧🧊'] = 0;
    }

    DATA['💧']['🍰🧮🌧'] = max_vapor_fraction;
    
    return true;
}

//Fonction principale : calcule tous les paramètres H2O
window.calculateH2OParameters = function () {
    const DATA = window.DATA;

    window.getMasses();
    window.calculatePressureAtm();
    window.calculateMolarMassAir();
    calculateWaterPartition();
        // 🔒 REFONTE : estimateCloudCoverage() supprimé, remplacé par calculateCloudFormationIndex()
    calculateH2OGreenhouseForcing();
    calculateCloudAlbedoContribution();

    // Log avec les clés logo sauvegardées et les valeurs
    // console.log(`💧 [calculateH2OParameters@calculations_h2o.js]`);
    // console.log(`h2o=${JSON.stringify(DATA['💧'])}`);

    return true;
};

// Exposer uniquement les fonctions utilisées ailleurs (calculations.js, main.js, calculations_albedo.js)
// Note: Ces fonctions sont déjà appelées dans calculateH2OParameters, donc les exposer permet de les réutiliser sans recalculer
window.calculateH2OGreenhouseForcing = calculateH2OGreenhouseForcing;
window.calculateCloudAlbedoContribution = calculateCloudAlbedoContribution;
// 🔒 SUPPRIMÉ : window.estimateCloudCoverage - Les nuages ne sont pas un stock d'eau
window.calculateWaterPartition = calculateWaterPartition;
