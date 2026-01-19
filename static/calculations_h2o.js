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
// Formule: P_sat = P₀ × exp((L_v / R_v) × (1/T₀ - 1/T))
// Optionnel: L_v peut être ajusté avec la température: L_v = 2.501e6 - 2300 × (T - 273.15)
function calculateSaturatedVaporPressure() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const temp_K = DATA['🧮']['🧮🌡️'];
    
    // 🔒 OPTIONNEL: Ajuster L_v avec la température pour plus de précision
    // L_v diminue légèrement avec la température (approximation linéaire)
    // À 273.15K: L_v = 2.501e6 J/kg
    // À 373.15K: L_v ≈ 2.257e6 J/kg (diminution d'environ 10%)
    // Formule: L_v = 2.501e6 - 2300 × (T - 273.15)
    // Pour l'instant, on utilise L_v constant (CONST.L_VAPORIZATION = 2.5e6 J/kg)
    // Si besoin de plus de précision, décommenter la ligne suivante:
    // const L_v = 2.501e6 - 2300 * (temp_K - CONST.T0_WATER);
    const L_v = CONST.L_VAPORIZATION; // Utiliser la constante pour l'instant
    
    const exponent = (L_v / CONST.RV_WATER) * (1 / CONST.T0_WATER - 1 / temp_K);
    const P_sat = CONST.P0_WATER * Math.exp(exponent);
    return P_sat;
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
    const h2o_vapor_fraction = DATA['💧']['🍰🫧💧'];
    const temp_K = DATA['🧮']['🧮🌡️'];
    
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
    //const EPOCH = window.TIMELINE[DATA['📜']['👉']];

    if (DATA['⚖️']['⚖️🫧'] == 0) {
        DATA['💧']['🍰💧🧊'] = 0;
        DATA['💧']['🍰💧🌊'] = 0;
        DATA['💧']['🍰🧮🌧'] = 0;
        DATA['💧']['🍰🫧💧'] = 0;
        return true;
    }
    
    // 🔒 h2o_total_fraction = fraction d'eau totale par rapport à la masse atmosphérique
    // Utilisé uniquement pour les calculs intermédiaires
    const h2o_total_fraction = DATA['⚖️']['⚖️💧'] / DATA['⚖️']['⚖️🫧'];
    
    // 🔒 ÉTAPE 1 : Obtenir les surfaces géologiques (doit être calculé avant)
    window.calculateGeologySurfaces();

    // Pas d'atmosphère : pas de vapeur, mais on peut avoir de la glace si T < 0°C
    const hasNoAtmosphere = DATA['🫧']['🧪'] === 0 || DATA['🫧']['🎈'] === 0 || DATA['🫧']['🎈'] <= 0;
    if (hasNoAtmosphere) {
        // Sans atmosphère : toute l'eau est soit glace (si T < 0°C) soit liquide (océan)
        DATA['💧']['🍰🧮🌧'] = 0;  // Pas de vapeur sans atmosphère
        DATA['💧']['🍰🫧💧'] = 0;
        if (DATA['🧮']['🧮🌡️'] < CONST.T_FREEZE && h2o_total_fraction > 0) {
            // T < 0°C : toute l'eau est glace
            DATA['💧']['🍰💧🧊'] = h2o_total_fraction;
            DATA['💧']['🍰💧🌊'] = 0;
        } else {
            // T >= 0°C : toute l'eau est liquide (océan)
            DATA['💧']['🍰💧🧊'] = 0;
            DATA['💧']['🍰💧🌊'] = h2o_total_fraction;
        }
        return true;
    }
    
    // Avec atmosphère : initialiser les valeurs avant calcul
    // 🔒 IMPORTANT : Ne PAS réinitialiser 🍰🫧💧 car elle est calculée par calculatePrecipitationFeedback()
    // ou par calculateH2OParametersWithIteration() et doit être préservée
    DATA['💧']['🍰💧🧊'] = 0;
    DATA['💧']['🍰💧🌊'] = 0;
    DATA['💧']['🍰🧮🌧'] = 0;
    // 🍰🫧💧 n'est PAS réinitialisée ici, elle est préservée depuis l'appel précédent

    // Calculer la pression de vapeur saturante
    const P_sat = calculateSaturatedVaporPressure();
    const P_total = DATA['🫧']['🎈'] * CONST.STANDARD_ATMOSPHERE_PA;
    const max_vapor_fraction = P_total > 0 ? Math.min(P_sat / P_total, 1.0) : 0;

    // Stocker la fraction molaire maximale (🍰🧮🌧)
    DATA['💧']['🍰🧮🌧'] = max_vapor_fraction;

    // 🔒 ÉTAPE 2 : Déterminer la glace selon la température ET les surfaces disponibles
    // La glace est limitée par les hautes terres disponibles (géologie)
    const temp_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
    const has_polar_ice = temp_C < CONST.T_NO_POLAR_ICE_C;
    
    // Calculer la fraction de glace souhaitée selon le climat
    // À 0°C : ~10% de glace (calottes polaires), à T_NO_POLAR_ICE_C : 0% de glace
    const polar_ice_fraction_climate = has_polar_ice ? Math.max(0, Math.min(0.10, (CONST.T_NO_POLAR_ICE_C - temp_C) / CONST.T_NO_POLAR_ICE_C * 0.10)) : 0;
    
    // 🔒 CONTRAINTE GÉOLOGIQUE : La glace ne peut pas dépasser les hautes terres disponibles
    // polar_ice_fraction est une fraction de surface, limitée par highlands_fraction
    const polar_ice_fraction = Math.min(DATA['🗻']['🍰🗻🏔'], polar_ice_fraction_climate);
    
    // 🔒 CALCUL DE 🍰🫧💧 (fraction massique de vapeur d'eau dans l'atmosphère)
    // Formule : 🍰🫧💧 = max_vapor_fraction × (M_H2O / M_air)
    // Où :
    //   max_vapor_fraction = P_sat / P_total (fraction molaire maximale, ~0.017–0.02)
    //   M_H2O / M_air ≈ 0.018 / 0.029 ≈ 0.62
    //   Donc 🍰🫧💧 ≈ 0.017 × 0.62 ≈ 0.0105 (1.05%)
    const atm_mass_total = DATA['⚖️']['⚖️🫧'];
    const M_H2O = CONST.M_H2O;
    const M_air = DATA['🫧']['🧪'];
    
    // 🔒 VÉRIFICATION : M_air doit être raisonnable (entre 0.016 et 0.050 kg/mol)
    // Si M_air est trop petit, mass_ratio sera trop élevé et 🍰🫧💧 sera surévalué
    // Valeurs typiques : air sec ≈ 0.029 kg/mol, air humide ≈ 0.028 kg/mol
    // Si M_air < 0.018, alors mass_ratio > 1.0, ce qui est physiquement impossible
    const mass_ratio = M_H2O / M_air; // ~0.62 (0.01802 / 0.029 ≈ 0.621)
    
    // Calculer la fraction massique maximale (limite physique)
    // Formule : max_vapor_mass_fraction = max_vapor_fraction × (M_H2O / M_air)
    // À 288K : max_vapor_fraction ≈ 0.0171, M_H2O/M_air ≈ 0.62
    // Donc max_vapor_mass_fraction ≈ 0.0171 × 0.62 ≈ 0.0106 (1.06%)
    const max_vapor_mass_fraction = max_vapor_fraction * mass_ratio;
    
    // 🔒 LIMITE PHYSIQUE : La pression de vapeur saturante est TOUJOURS la contrainte principale
    // Même si l'eau disponible est supérieure, on ne peut pas dépasser la limite physique
    // available_water_fraction = fraction d'eau disponible par rapport à la masse atmosphérique
    const available_water_fraction = atm_mass_total > 0 ? DATA['⚖️']['⚖️💧'] / atm_mass_total : 0;

    // 🔒 IMPORTANT : calculateWaterPartition() ne doit PAS recalculer 🍰🫧💧
    // 🍰🫧💧 est calculée par calculatePrecipitationFeedback() (dans la boucle Init)
    // ou par calculateH2OParametersWithIteration() (en phase Init)
    // ou par calculateH2OParameters() (en phase non-Init)
    // calculateWaterPartition() doit seulement calculer 🍰💧🧊 et 🍰💧🌊 en utilisant la valeur existante de 🍰🫧💧
    // 🍰🫧💧 est préservée telle quelle (pas de réinitialisation, pas de recalcul)
    
    // Calculer la masse de vapeur d'eau (en kg) pour les calculs suivants
    const h2o_vapor_mass_kg = DATA['💧']['🍰🫧💧'] * atm_mass_total;
    
    // 🔒 RENORMALISATION : Les fractions de l'air sec doivent être ajustées pour que la somme totale = 1.0
    // 🔒 IMPORTANT : TOUJOURS recalculer depuis les masses pour éviter l'accumulation d'erreurs
    // Si 🍰🫧💧 > 0, alors les fractions de l'air sec doivent être multipliées par (1 - 🍰🫧💧)
    const dry_air_fraction = DATA['💧']['🍰🫧💧'] > 0 && DATA['💧']['🍰🫧💧'] < 1.0 ? (1.0 - DATA['💧']['🍰🫧💧']) : 1.0;
    
    // 🔒 TOUJOURS recalculer depuis les masses pour éviter l'accumulation d'erreurs
    const mass_CO2 = DATA['⚖️']['⚖️🏭'];
    const mass_CH4 = DATA['⚖️']['⚖️⛽'];
    const mass_O2 = DATA['⚖️']['⚖️🌫'];
    const mass_N2 = DATA['⚖️']['⚖️💨'];
    
    // Calculer les fractions de l'air sec depuis les masses, puis multiplier par dry_air_fraction
    if (atm_mass_total > 0) {
        DATA['🫧']['🍰🫧🏭'] = (mass_CO2 / atm_mass_total) * dry_air_fraction;
        DATA['🫧']['🍰🫧⛽'] = (mass_CH4 / atm_mass_total) * dry_air_fraction;
        DATA['🫧']['🍰🫧🌫'] = (mass_O2 / atm_mass_total) * dry_air_fraction;
        DATA['🫧']['🍰🫧💨'] = (mass_N2 / atm_mass_total) * dry_air_fraction;
    } else {
        DATA['🫧']['🍰🫧🏭'] = 0;
        DATA['🫧']['🍰🫧⛽'] = 0;
        DATA['🫧']['🍰🫧🌫'] = 0;
        DATA['🫧']['🍰🫧💨'] = 0;
    }
    
    // 🔒 CALCUL DE LA FRACTION DE VAPEUR PAR RAPPORT À LA MASSE TOTALE D'EAU
    // h2o_vapor_mass_kg est la masse de vapeur d'eau (en kg)
    // h2o_vapor_mass_fraction_of_total = fraction de vapeur par rapport à la masse totale d'eau (⚖️💧)
    // Cette fraction doit être entre 0 et 1, et 🍰💧🧊 + 🍰💧🌊 + h2o_vapor_mass_fraction_of_total = 1.0
    const h2o_vapor_mass_fraction_of_total = DATA['⚖️']['⚖️💧'] > 0 ? (h2o_vapor_mass_kg / DATA['⚖️']['⚖️💧']) : 0;
    
    // 🔒 CALCUL DE LA FRACTION RESTANTE (LIQUIDE + GLACE) PAR RAPPORT À LA MASSE TOTALE D'EAU
    // remaining_after_vapor = 1.0 - h2o_vapor_mass_fraction_of_total
    // C'est la fraction de la masse totale d'eau qui n'est PAS en vapeur
    const remaining_after_vapor = Math.max(0, 1.0 - h2o_vapor_mass_fraction_of_total);
    
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
    if (DATA['🧮']['🧮🌡️'] < T_freeze_adjusted) {
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
    if (DATA['🧮']['🧮🌡️'] > T_freeze_adjusted - CONST.T_ICE_TRANSITION_RANGE_C && DATA['🧮']['🧮🌡️'] < T_freeze_adjusted) {
        const transition_factor = (DATA['🧮']['🧮🌡️'] - (CONST.T_FREEZE - CONST.T_ICE_TRANSITION_RANGE_C)) / CONST.T_ICE_TRANSITION_RANGE_C;
        const ice_before = DATA['💧']['🍰💧🧊'];
        const liquid_before = DATA['💧']['🍰💧🌊'];
        // Convertir une partie de la glace en liquide selon la température
        const ice_to_liquid = ice_before * (1 - transition_factor);
        DATA['💧']['🍰💧🌊'] = liquid_before + ice_to_liquid;
        DATA['💧']['🍰💧🧊'] = ice_before - ice_to_liquid;
    }

    // 🔒 NORMALISATION FINALE : 🍰💧🧊 + 🍰💧🌊 + h2o_vapor_mass_fraction_of_total = 1.0
    // Toutes ces valeurs sont des fractions de la masse totale d'eau (⚖️💧)
    // h2o_vapor_mass_fraction_of_total est déjà calculé plus haut
    const total_liquid_ice = DATA['💧']['🍰💧🌊'] + DATA['💧']['🍰💧🧊'];
    const expected_liquid_ice = Math.max(0, 1.0 - h2o_vapor_mass_fraction_of_total);
    
    // 🔒 LOGS DÉSACTIVÉS pour éviter les boucles infinies dans la console
    // Les logs sont maintenant conditionnels et limités
    // const phase = DATA['🧮']['🧮⚧'];
    // if (phase === 'Init') {
    //     console.log(`\n📊 [calculateWaterPartition] DÉTAILS CALCUL 💧:`);
    //     console.log(`   🍰🫧💧 = ${DATA['💧']['🍰🫧💧'].toFixed(3)} (fraction massique vapeur / masse atmosphérique)`);
    //     console.log(`   🍰🫧💧 (fraction / masse totale eau) = ${h2o_vapor_mass_fraction_of_total.toFixed(3)}`);
    //     console.log(`   🍰💧🧊 = ${DATA['💧']['🍰💧🧊'].toFixed(3)} (fraction glace / masse totale eau)`);
    //     console.log(`   🍰💧🌊 = ${DATA['💧']['🍰💧🌊'].toFixed(3)} (fraction liquide / masse totale eau)`);
    //     console.log(`   Total = ${(h2o_vapor_mass_fraction_of_total + DATA['💧']['🍰💧🧊'] + DATA['💧']['🍰💧🌊']).toFixed(3)} (doit être 1.0)`);
    // }
    
    // Normaliser liquide/glace pour que la somme = expected_liquid_ice
    if (total_liquid_ice > 0 && expected_liquid_ice > 0) {
        const scale = expected_liquid_ice / total_liquid_ice;
        DATA['💧']['🍰💧🌊'] = Math.max(0, Math.min(1.0, DATA['💧']['🍰💧🌊'] * scale));
        DATA['💧']['🍰💧🧊'] = Math.max(0, Math.min(1.0, DATA['💧']['🍰💧🧊'] * scale));
    } else if (expected_liquid_ice <= 0) {
        // Toute l'eau est en vapeur
        DATA['💧']['🍰💧🌊'] = 0;
        DATA['💧']['🍰💧🧊'] = 0;
    }

    // 🔒 VÉRIFICATION FINALE : 🍰💧🧊 + 🍰💧🌊 + h2o_vapor_mass_fraction_of_total doit être ≈ 1.0
    const final_sum = DATA['💧']['🍰💧🌊'] + DATA['💧']['🍰💧🧊'] + h2o_vapor_mass_fraction_of_total;
    if (Math.abs(final_sum - 1.0) > 0.001) {
        // Ajuster pour garantir la normalisation exacte
        const correction = 1.0 / final_sum;
        DATA['💧']['🍰💧🌊'] *= correction;
        DATA['💧']['🍰💧🧊'] *= correction;
    }
    
    return true;
}

// 🔒 FONCTION : Feedback précipitation (appelée dans la boucle externe)
// Calcule 🍰🫧☔, 💭☔, ⏳☔, 🍰⚖️💦, puis met à jour 🍰🫧💧 et ajoute à 🍰💧🌊 ou 🍰💧🧊
function calculatePrecipitationFeedback() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    // 1. Calculer 🍰🫧☔, 💭☔, ⏳☔, 🍰⚖️💦 (via calculateCloudFormationIndex)
    window.calculateCloudFormationIndex();
    
    const relative_humidity = DATA['💧']['🍰🫧☔'];
    const precip_threshold = DATA['💧']['💭☔'];
    const precip_time_constant = DATA['💧']['⏳☔'];
    const precipitation_rate = DATA['💧']['🍰⚖️💦'];
    const cloud_index = DATA['🪩']['☁️'];
    
    console.log(`   🔍 [calculatePrecipitationFeedback] 🍰🫧☔=${relative_humidity.toFixed(4)} | 💭☔=${precip_threshold.toFixed(4)} | ⏳☔=${precip_time_constant.toExponential(2)} | 🍰⚖️💦=${precipitation_rate.toExponential(2)}`);
    
    // 2. Mise à jour 🍰🫧💧 = 🍰🫧💧 - (🍰⚖️💦 × Surface × 🔺⏳) / ⚖️🫧
    // VÉRIFICATION HOMOGÉNÉITÉ :
    // 🍰⚖️💦 : kg/m²/s (taux de précipitation)
    // Surface : m²
    // 🔺⏳ : s (temps)
    // ⚖️🫧 : kg (masse atmosphérique)
    // (🍰⚖️💦 × Surface × 🔺⏳) / ⚖️🫧 = (kg/m²/s × m² × s) / kg = kg / kg = sans dimension ✓
    const vapor_before = DATA['💧']['🍰🫧💧'];
    const atm_mass_total = DATA['⚖️']['⚖️🫧'];
    let precipitation_loss_fraction = 0;
    
    // Calculer la perte de précipitation (sans if, crash si valeurs manquantes selon REGLE_JS_CRASH.md)
    const has_precipitation = precipitation_rate > 0 && DATA['📅']['🔺⏳'] > 0 && atm_mass_total > 0;
    if (has_precipitation) {
        const EPOCH = window.TIMELINE[DATA['📜']['👉']];
        const planet_radius_km = EPOCH['📐'];
        const planet_surface_m2 = 4 * Math.PI * Math.pow(planet_radius_km * 1000, 2);
        const precipitation_mass_kg = precipitation_rate * planet_surface_m2 * DATA['📅']['🔺⏳'];
        precipitation_loss_fraction = precipitation_mass_kg / atm_mass_total;
        
        DATA['💧']['🍰🫧💧'] = Math.max(0, vapor_before - precipitation_loss_fraction);
        
        console.log(`      🔍 VÉRIFICATION UNITÉS:`);
        console.log(`         🍰⚖️💦 = ${precipitation_rate.toExponential(2)} kg/m²/s`);
        console.log(`         Surface = ${planet_surface_m2.toExponential(2)} m²`);
        console.log(`         🔺⏳ = ${DATA['📅']['🔺⏳'].toFixed(0)} s`);
        console.log(`         ⚖️🫧 = ${atm_mass_total.toExponential(2)} kg`);
        console.log(`         Masse précipitée = 🍰⚖️💦 × Surface × 🔺⏳ = ${precipitation_mass_kg.toExponential(2)} kg`);
        console.log(`         Perte fraction = Masse précipitée / ⚖️🫧 = ${precipitation_loss_fraction.toExponential(6)} (sans dimension)`);
        console.log(`      🍰🫧💧: ${vapor_before.toFixed(6)} → ${DATA['💧']['🍰🫧💧'].toFixed(6)} (perte: ${precipitation_loss_fraction.toExponential(6)})`);
    } else {
        console.log(`      🍰🫧💧: ${vapor_before.toFixed(4)} (pas de précipitation)`);
    }
    
    // 3. Ajouter la perte à 🍰💧🌊 ou 🍰💧🧊
    if (precipitation_loss_fraction > 0) {
        const precipitation_mass_kg_total = precipitation_loss_fraction * atm_mass_total;
        const h2o_total_kg = DATA['⚖️']['⚖️💧'];
        const precipitation_fraction_of_total_water = h2o_total_kg > 0 ? precipitation_mass_kg_total / h2o_total_kg : 0;
        
        const temp_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
        if (temp_C < CONST.T_FREEZE - CONST.KELVIN_TO_CELSIUS) {
            DATA['💧']['🍰💧🧊'] = Math.min(1.0, (DATA['💧']['🍰💧🧊'] || 0) + precipitation_fraction_of_total_water);
            console.log(`      Ajout à 🍰💧🧊: +${precipitation_fraction_of_total_water.toFixed(6)} (total: ${DATA['💧']['🍰💧🧊'].toFixed(4)})`);
        } else {
            DATA['💧']['🍰💧🌊'] = Math.min(1.0, (DATA['💧']['🍰💧🌊'] || 0) + precipitation_fraction_of_total_water);
            console.log(`      Ajout à 🍰💧🌊: +${precipitation_fraction_of_total_water.toFixed(6)} (total: ${DATA['💧']['🍰💧🌊'].toFixed(4)})`);
        }
    }
}

// 🔒 FONCTION D'ITÉRATION EN PHASE INIT : Calcul correct avec condensation
// Ordre recommandé :
// 1. Calculer 🍰🧮🌧 (saturation via T et P)
// 2. Calculer vapeur potentielle = min(disponible, saturation massique)
// 3. Calculer ☁️ (via RH)
// 4. Réduire la vapeur effective : 🍰🫧💧 = vapeur_potentielle × (1 - ☁️ × efficacité_condensation)
// 5. Mettre l'eau condensée dans 🌊 ou 🧊
// 6. Recalculer RH et ☁️ (itération)
function calculateH2OParametersWithIteration() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const phase = DATA['🧮']['🧮⚧'];
    const isInit = phase === 'Init';
    const EFFICIENCY_CONDENSATION = 0.9; // Efficacité de condensation (0.8-1.0)
    const MAX_ITERATIONS = 5;
    const TOLERANCE = 0.001;
    
    // 🔒 ACCÉLÉRATION DE CONVERGENCE : Utiliser 🔺⏳×10 au début, puis revenir à 1 jour
    // Au début : 🔺⏳ = 86400 × 10 = 864000 s (10 jours) pour accélérer
    // Après convergence partielle : 🔺⏳ = 86400 s (1 jour)
    const ACCELERATION_FACTOR = 10;
    const ACCELERATION_THRESHOLD = 0.01; // Seuil pour passer de ×10 à ×1
    
    if (!isInit) {
        // En phase non-Init, utiliser l'ancien calcul
        return window.calculateH2OParameters();
    }
    
    // 🔒 ÉTAPE 1 : Préparer les calculs de base
    window.getMasses();
    window.calculatePressureAtm();
    window.calculateMolarMassAir(); // Calculer M_air initial
    
    // 🔒 ÉTAPE 2 : Calculer 🍰🧮🌧 (saturation via T et P)
    const P_sat = calculateSaturatedVaporPressure();
    const P_total = DATA['🫧']['🎈'] * CONST.STANDARD_ATMOSPHERE_PA;
    const max_vapor_fraction = P_total > 0 ? Math.min(P_sat / P_total, 1.0) : 0;
    DATA['💧']['🍰🧮🌧'] = max_vapor_fraction;
    
    // 🔒 ÉTAPE 3 : Calculer vapeur potentielle = min(disponible, saturation massique)
    const atm_mass_total = DATA['⚖️']['⚖️🫧'];
    const M_H2O = CONST.M_H2O;
    const M_air = DATA['🫧']['🧪'];
    const mass_ratio = M_H2O / M_air;
    const max_vapor_mass_fraction = max_vapor_fraction * mass_ratio;
    const available_water_fraction = atm_mass_total > 0 ? DATA['⚖️']['⚖️💧'] / atm_mass_total : 0;
    let vapor_potentielle = Math.min(max_vapor_mass_fraction, available_water_fraction);
    
    // 🔒 INITIALISATION : Commencer avec la vapeur potentielle
    DATA['💧']['🍰🫧💧'] = vapor_potentielle;
    let previous_vapor = vapor_potentielle;
    
    // 🔒 ACCÉLÉRATION : Utiliser 🔺⏳×10 au début pour accélérer la convergence
    let use_acceleration = true;
    
    console.log(`🔍 [calculateH2OParametersWithIteration] ========== PHASE INIT ==========`);
    console.log(`   Vapeur initiale: 🍰🫧💧=${vapor_potentielle.toFixed(4)} (max_vapor_mass_fraction=${max_vapor_mass_fraction.toFixed(4)}, available_water_fraction=${available_water_fraction.toFixed(4)})`);
    
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
        // 🔒 Ajuster 🔺⏳ selon l'état de convergence
        if (use_acceleration && iter > 0) {
            const delta_vapor_prev = Math.abs(previous_vapor - vapor_potentielle);
            if (delta_vapor_prev < ACCELERATION_THRESHOLD) {
                use_acceleration = false; // Passer à 🔺⏳ normal (1 jour)
                console.log(`   🔒 Accélération désactivée (convergence partielle atteinte)`);
            }
        }
        DATA['📅']['🔺⏳'] = use_acceleration ? 86400 * ACCELERATION_FACTOR : 86400;
        
        // 🔒 ÉTAPE 1 : Calculer 🍰🫧☔ (RH) depuis la vapeur actuelle
        const q_sat = mass_ratio * max_vapor_fraction;
        const current_vapor = DATA['💧']['🍰🫧💧'];
        const relative_humidity = q_sat > 0 ? Math.max(0, Math.min(1, current_vapor / q_sat)) : 0;
        DATA['💧']['🍰🫧☔'] = relative_humidity;
        
        // 🔒 ÉTAPE 2 : Calculer 💭☔, ⏳☔, 🍰⚖️💦 (via calculateCloudFormationIndex)
        // ⚠️ IMPORTANT : calculateCloudFormationIndex() calcule 💭☔, ⏳☔, 🍰⚖️💦
        window.calculateCloudFormationIndex();
        const precip_threshold = DATA['💧']['💭☔'] || 0;
        const precip_time_constant = DATA['💧']['⏳☔'] || 0;
        const precipitation_rate = DATA['💧']['🍰⚖️💦'] || 0;
        const cloud_index = DATA['🪩']['☁️'];
        
        console.log(`   🔍 Itération ${iter + 1}:`);
        console.log(`      🍰🫧☔=${relative_humidity.toFixed(4)} | 💭☔=${precip_threshold.toFixed(4)} | ⏳☔=${precip_time_constant.toExponential(2)} | 🍰⚖️💦=${precipitation_rate.toExponential(2)}`);
        
        // 🔒 ÉTAPE 3 : Mise à jour 🍰🫧💧 = 🍰🫧💧 - (🍰⚖️💦 × Surface × 🔺⏳) / ⚖️🫧
        const vapor_before_precipitation = DATA['💧']['🍰🫧💧'];
        let precipitation_loss_fraction = 0;
        // Calculer la perte de précipitation (sans if, crash si valeurs manquantes selon REGLE_JS_CRASH.md)
        const has_precipitation_inner = precipitation_rate > 0 && DATA['📅']['🔺⏳'] > 0 && atm_mass_total > 0;
        if (has_precipitation_inner) {
            const EPOCH = window.TIMELINE[DATA['📜']['👉']];
            const planet_radius_km = EPOCH['📐'];
            const planet_surface_m2 = 4 * Math.PI * Math.pow(planet_radius_km * 1000, 2); // Surface en m²
            const precipitation_mass_kg = precipitation_rate * planet_surface_m2 * DATA['📅']['🔺⏳']; // Masse précipitée en kg
            precipitation_loss_fraction = precipitation_mass_kg / atm_mass_total; // Fraction massique précipitée
            
            DATA['💧']['🍰🫧💧'] = Math.max(0, vapor_before_precipitation - precipitation_loss_fraction);
            
            console.log(`      🍰🫧💧: ${vapor_before_precipitation.toFixed(4)} → ${DATA['💧']['🍰🫧💧'].toFixed(4)} (perte: ${precipitation_loss_fraction.toFixed(6)})`);
            console.log(`      Surface: ${planet_surface_m2.toExponential(2)} m² | 🔺⏳: ${DATA['📅']['🔺⏳'].toFixed(0)} s | Masse précipitée: ${precipitation_mass_kg.toExponential(2)} kg`);
        } else {
            console.log(`      🍰🫧💧: ${vapor_before_precipitation.toFixed(4)} (pas de précipitation)`);
        }
        
        // 🔒 ÉTAPE 4 : Ajouter la perte à 🍰💧🌊 ou 🍰💧🧊
        if (precipitation_loss_fraction > 0) {
            const precipitation_mass_kg_total = precipitation_loss_fraction * atm_mass_total;
            const h2o_total_kg = DATA['⚖️']['⚖️💧'];
            const precipitation_fraction_of_total_water = h2o_total_kg > 0 ? precipitation_mass_kg_total / h2o_total_kg : 0;
            
            // Ajouter à 🌊 ou 🧊 selon la température
            const temp_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
            if (temp_C < CONST.T_FREEZE - CONST.KELVIN_TO_CELSIUS) {
                // T < 0°C : ajouter à la glace
                DATA['💧']['🍰💧🧊'] = Math.min(1.0, (DATA['💧']['🍰💧🧊'] || 0) + precipitation_fraction_of_total_water);
                console.log(`      Ajout à 🍰💧🧊: +${precipitation_fraction_of_total_water.toFixed(6)} (total: ${DATA['💧']['🍰💧🧊'].toFixed(4)})`);
            } else {
                // T >= 0°C : ajouter à l'océan
                DATA['💧']['🍰💧🌊'] = Math.min(1.0, (DATA['💧']['🍰💧🌊'] || 0) + precipitation_fraction_of_total_water);
                console.log(`      Ajout à 🍰💧🌊: +${precipitation_fraction_of_total_water.toFixed(6)} (total: ${DATA['💧']['🍰💧🌊'].toFixed(4)})`);
            }
        }
        
        // 🔒 ÉTAPE 5 : Recalculer la répartition eau (vapeur/liquide/glace) avec la nouvelle vapeur
        calculateWaterPartition();
        
        // La nouvelle vapeur après précipitation
        const vapor_after_precipitation = DATA['💧']['🍰🫧💧'];
        
        // Vérifier la convergence
        const delta_vapor = Math.abs(vapor_after_precipitation - previous_vapor);
        console.log(`      Δ🍰🫧💧: ${delta_vapor.toFixed(6)} (tolérance: ${TOLERANCE.toFixed(6)})`);
        
        if (delta_vapor < TOLERANCE) {
            console.log(`   ✅ Convergence atteinte après ${iter + 1} itérations`);
            break;
        }
        
        previous_vapor = vapor_after_precipitation;
        // Pour la prochaine itération, on repart de la vapeur après précipitation
        DATA['💧']['🍰🫧💧'] = vapor_after_precipitation;
    }
    
    console.log(`   ========== FIN PHASE INIT ==========`);
    console.log(`   🍰🫧💧 final: ${DATA['💧']['🍰🫧💧'].toFixed(4)}`);
    
    // Dernier calcul de répartition avec la vapeur finale
    calculateWaterPartition();
    
    // Recalculer M_air avec les fractions incluant H2O
    window.calculateMolarMassAir();
    
    // Calculer les autres paramètres
    calculateH2OGreenhouseForcing();
    calculateCloudAlbedoContribution();
    
    return true;
}

//Fonction principale : calcule tous les paramètres H2O
window.calculateH2OParameters = function () {
    const DATA = window.DATA;
    const phase = DATA['🧮']['🧮⚧'];
    const isInit = phase === 'Init';
    
    // En phase Init, utiliser l'itération
    if (isInit) {
        return calculateH2OParametersWithIteration();
    }
    
    // En phase non-Init, utiliser l'ancien calcul
    window.getMasses();
    window.calculatePressureAtm();
    window.calculateMolarMassAir();
    calculateWaterPartition();
    window.calculateMolarMassAir();
    calculateH2OGreenhouseForcing();
    calculateCloudAlbedoContribution();

    return true;
};

// Exposer uniquement les fonctions utilisées ailleurs (calculations.js, main.js, calculations_albedo.js)
// Note: Ces fonctions sont déjà appelées dans calculateH2OParameters, donc les exposer permet de les réutiliser sans recalculer
window.calculateH2OGreenhouseForcing = calculateH2OGreenhouseForcing;
window.calculateCloudAlbedoContribution = calculateCloudAlbedoContribution;
// 🔒 SUPPRIMÉ : window.estimateCloudCoverage - Les nuages ne sont pas un stock d'eau
window.calculateWaterPartition = calculateWaterPartition;
window.calculatePrecipitationFeedback = calculatePrecipitationFeedback;
