// ============================================================================
// File: API_BILAN/physics/physics.js - Constantes et lois physiques fondamentales
// Desc: En français, dans l'architecture, je suis le module de physique fondamentale
// Version 2.0.7
// Date: [January 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - Sections efficaces : hitran.js + lignes HITRAN. ΔF = convention affichage → climate.js, pas ici.
// - getH2OVaporEDSScale() — formule T,P,vapor,CO2 (pas d'époque), doc/API/VAPEUR_VS_NUAGES.md
// - Convention : Credence (%) + Plage lit. / écart-type en commentaire pour params tunables (éviter patch en aveugle). v2.0.3.
// - getH2OVaporEDSScale : 1.0→0.70 pour CO2≥400 ppm (cible EDS_H₂O ~72 W/m², lit. ~75).
// - v2.0.4 : atténuation thermique h2o_eds_scale (5–10%) au-dessus de 20°C pour limiter la sur-rétroaction chaude
// - v2.0.5 : règle simple h2o_eds_scale = 0.92 si T>290K, sinon 1.0
// - v2.0.6 : essai calibration 2025 (EDS H2O) : h2o_eds_scale = 0.92 en base, sans branchement epoch
// - v2.0.7 : CONV (convention) et EARTH (terrestre) extraits de CONST ; albédos 🪩🍰 dans EARTH, override par EPOCH['🪩🍰']
// ============================================================================

// Initialiser CONST (pointeur vers window.CONST)
// var pour permettre plot.js et main.js de faire var CONST = window.CONST sans erreur
var CONST = window.CONST = window.CONST || {};

// ========== 1. FONDAMENTALES (universelles, sans ref terrestre) ==========
CONST.PLANCK_H = 6.62607015e-34;      // Planck, J·s (CODATA 2018)
CONST.SPEED_OF_LIGHT = 2.998e8;       // c, m/s
CONST.BOLTZMANN_KB = 1.380649e-23;    // Boltzmann, J/K (CODATA 2018)
CONST.STEFAN_BOLTZMANN = 5.670374419e-8; // Stefan-Boltzmann, W/(m²·K⁴)
CONST.SOLAR_CONSTANT = 1366;              // Constante solaire, W/m² (satellites, ~1361–1366 selon cycle)
CONST.MAX_PLANCK_SAFE = 1e30;         // Cap Planck (W/(m²·sr·m)) pour workers / transfert radiatif

// ========== 2. PHYSIQUE DURE (propriétés intrinsèques) ==========
CONST.R_GAS = 8.314;  // Gaz parfaits, J/(mol·K)
CONST.M_N2 = 0.02801;   // N₂ kg/mol
CONST.M_O2 = 0.03200;   // O₂ kg/mol
CONST.M_CO2 = 0.04401;  // CO₂ kg/mol
CONST.M_CH4 = 0.01604;  // CH₄ kg/mol
CONST.M_H2O = 0.01802;  // H₂O kg/mol
CONST.M_AR = 0.03995;   // Ar kg/mol
CONST.RHO_WATER = 1000;  // Densité eau kg/m³
CONST.P0_WATER = 611.2;  // Pression point triple eau (Pa)
CONST.L_VAPORIZATION = 2.5e6;  // Chaleur latente vaporisation (J/kg)
CONST.RV_WATER = 461.5;  // R vapeur d'eau J/(kg·K)
CONST.L_V = 40660;  // Chaleur latente (J/mol)
CONST.CP_AIR = 1005;  // Capacité calorifique air sec J/(kg·K)
CONST.T_BOIL = 373.15;  // Ébullition eau 1 atm (K)
CONST.T0_WATER = 273.15;  // Point triple eau (K) — seule occurrence 273.15
CONST.T_LAVA_START = 1000;   // Transition lave (K)
CONST.T_LAVA_COMPLETE = 2373;  // Lave complète (K)
CONST.LAMBDA_CO2_CENTER = 15.0e-6;   // CO₂ 15 μm
CONST.LAMBDA_H2O_1 = 6.3e-6;
CONST.LAMBDA_H2O_2 = 17.0e-6;
CONST.LAMBDA_CH4_1 = 7.7e-6;
CONST.LAMBDA_CH4_2 = 3.3e-6;

// ========== 3. CONVERSION TEMPÉRATURE (DATA = K ; °C/°F = affichage) ==========
CONST.KELVIN_TO_CELSIUS = CONST.T0_WATER;  // 273.15
CONST.K2C = function (K) { return K - CONST.KELVIN_TO_CELSIUS; };
CONST.K2F = function (K) { return (K - CONST.KELVIN_TO_CELSIUS) * 9 / 5 + 32; };

// ========== CONV (convention : unités, références) ==========
var CONV = window.CONV = window.CONV || {};
CONV.AU_M = 1.496e11;
CONV.STANDARD_ATMOSPHERE_PA = 101325;
CONV.molar_mass_air_ref = 0.029;
CONV.SECONDS_PER_DAY = 86400;
CONV.TAU_VAPOR_GLOBAL_S = 10 * CONV.SECONDS_PER_DAY;
CONV.P_ANN_SCALE_MM_AN = 200000;
CONV.O2_REF_MASS = 1e18;
CONV.CH4_REF_MASS = 1e13;
CONV.CCN_O2_REF_KG = 1.08e18;
CONV.CCN_CH4_REF_KG = 5.2e12;
CONV.CCN_SULFATE_REF_KG = 1.0e14;
CONV.H2O_VAPOR_REF = 0.01;
CONV.ALPHA_OCEAN = 0.3;
CONV.SCALE_CLOUD = 0.4;

// ========== EARTH (terrestre : seuils climat, cycle eau, albédos par défaut ; overridable par époque) ==========
// var pour permettre plot.js / main.js de faire var EARTH = window.EARTH sans erreur
var EARTH = window.EARTH = window.EARTH || {};
EARTH.T_NO_POLAR_ICE_K = CONST.KELVIN_TO_CELSIUS + 20;
EARTH.T_NO_POLAR_ICE_RANGE_K = 20;
/** Fraction max de glace polaire depuis la formule thermique (ice_temp_factor × ce coef, plafonné par highlands). */
EARTH.ICE_FORMULA_MAX_FRACTION = 0.46;
EARTH.T_ICE_TRANSITION_RANGE_K = 20;
EARTH.EVAPORATION_E0 = 0.001;
EARTH.EVAPORATION_T_REF = 288;
EARTH.EVAPORATION_T_SCALE = 20;
/** Cap vapeur dynamique (approx Clausius-Clapeyron, calibrage ERA5/AIRS). calculations_h2o.js : c_c_max = BASE + SLOPE × (T - EVAPORATION_T_REF). */
EARTH.H2O_VAPOR_CAP_BASE = 0.0065;       // fraction massique vapeur à T_ref (~0.5–0.8 %)
EARTH.H2O_VAPOR_CAP_SLOPE_PER_K = 0.0007; // pente /K
/** Cap vapeur final Init (AIRS/ERA5 ~7%/K). calculations_h2o.js : realistic_vapor_max = BASE + SLOPE × (T - EVAPORATION_T_REF). */
EARTH.H2O_VAPOR_REALISTIC_MAX_BASE = 0.0052;
EARTH.H2O_VAPOR_REALISTIC_MAX_SLOPE_PER_K = 0.00007;
/** Feedback Iris simplifié (vapeur / iris_factor). Lit. Lindzen 2001, Mauritsen & Stevens 2015, Sherwood 2020 ; calib 2025 amplitude prudente. */
EARTH.IRIS_STRENGTH = 0.02;   // amplitude (sans dimension, × (T - T_REF) / IRIS_T_SCALE_K)
EARTH.IRIS_T_SCALE_K = 10;    // échelle thermique (par 10 K)
EARTH.IRIS_FACTOR_MIN = 0.7;  // plancher iris_factor (évite sur-assèchement)
EARTH.T_FREEZE_SEAWATER_K = 271.15;
EARTH.T_WATER_CYCLE_MIN_C = -10;
EARTH.T_WATER_CYCLE_MAX_C = 150;
EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM = 1;
EARTH.T_WATER_CYCLE_MARGIN_GEL_K = 5;
EARTH.T_WATER_CYCLE_EVAP_LOW_K = 323.15;
EARTH.T_WATER_CYCLE_HIGH_K_PER_ATM = 5;
/** Seuils pour recalcul partition eau (calculations_h2o.js) : recalcul seulement si ΔT > DELTA_T_K ou ΔP > DELTA_P_ATM. */
EARTH.WATER_PARTITION_DELTA_T_K = 5;
EARTH.WATER_PARTITION_DELTA_P_ATM = 1;
EARTH.PRECIP_BASE_RATE = 5e-6;
EARTH.PRECIP_PRESSURE_SCALE = 5e-6;
EARTH.PRECIP_CLOUD_SCALE = 1e-6;
/** Précip convective (calculations_h2o.js) : facteur temp = (T / T_REF)^EXP_T, facteur RH = (RH / RH_REF)^EXP_RH. Lit. Held & Soden 2006, IPCC AR6 ; réponse précip plus lente que C-C. */
EARTH.PRECIP_CONVECTIVE_T_REF_K = 288;   // T ref (réutilise EVAPORATION_T_REF)
EARTH.PRECIP_CONVECTIVE_T_EXPONENT = 1.2; // adouci vs C-C (~7%/K) pour éviter sur-assèchement
EARTH.PRECIP_CONVECTIVE_RH_REF = 0.7;    // seuil RH convective typique (~70 %)
EARTH.PRECIP_CONVECTIVE_RH_EXPONENT = 1.0; // exposant facteur humidité (calib v1.0.8)
EARTH.H2O_EDS_SCALE = 0.92;  // Facteur κ_H2O dans EDS (calculations.js), calibration 2025
EARTH['🪩🍰'] = {
    '🪩🍰🌋': 0.05, '🪩🍰🌊': 0.08, '🪩🍰🌳': 0.17, '🪩🍰🏜️': 0.30,
    '🪩🍰🧊': 0.70, '🪩🍰⛅': 0.50, '🪩🍰🌍': 0.18
};

// ========== STATE (état solver partagé : glace figée, etc.) ==========
var STATE = window.STATE = window.STATE || {};

// ========== PHYS (fonctions de physique exposées) ==========
var PHYS = window.PHYS = window.PHYS || {};

// NOTE : C_MAX_CLOUD et ETA_CLOUD ne sont PAS des constantes universelles
// Elles dépendent de la pression atmosphérique, composition, gravité, température
// Elles sont calculées dynamiquement dans calculateCloudFormationIndex() ou calculateAlbedo()

// ✅ SCIENTIFIQUEMENT CERTAIN :
// - La loi de Planck B(λ,T) = (2hc²/λ⁵) / (exp(hc/λkT) - 1) est une loi fondamentale de la physique
// - Dérivée par Max Planck en 1900, elle décrit le spectre d'émission d'un corps noir
// - Cette formule est exacte et utilisée dans tous les modèles de transfert radiatif
// - Les constantes utilisées (h, c, k) sont des constantes fondamentales mesurées avec précision
// - Cap numérique : pour T très élevé (ex. Hadéen 2450 K) et λ court, term1/term2 peut overflow → plafonner
function planckFunction(lambda, T) {
    if (!Number.isFinite(lambda) || !Number.isFinite(T) || lambda <= 0 || T <= 0) return 0;
    const term1 = (2 * CONST.PLANCK_H * CONST.SPEED_OF_LIGHT * CONST.SPEED_OF_LIGHT) / Math.pow(lambda, 5);
    const term2 = Math.exp((CONST.PLANCK_H * CONST.SPEED_OF_LIGHT) / (lambda * CONST.BOLTZMANN_KB * T)) - 1;
    const B = (term2 > 0) ? term1 / term2 : 0;
    if (!Number.isFinite(B) || B < 0) return 0;
    return Math.min(B, CONST.MAX_PLANCK_SAFE); // W/(m²·m·sr) - Intensité spectrale d'un corps noir
}

PHYS.planckFunction = planckFunction;

// Borne basse/haute (K) pour "cycle eau actif", fonction de la pression (atm).
// Plage max -10°C à 150°C ; la pression resserre la fourchette (gel et évaporation).
function getWaterCycleTempBoundsFromPressure(P_atm) {
    const T_MIN_K = EARTH.T_WATER_CYCLE_MIN_C + CONST.KELVIN_TO_CELSIUS;
    const T_MAX_K = EARTH.T_WATER_CYCLE_MAX_C + CONST.KELVIN_TO_CELSIUS;
    if (typeof P_atm !== 'number' || !Number.isFinite(P_atm) || P_atm < 0.01) {
        return { T_low_K: T_MIN_K, T_high_K: T_MAX_K };
    }
    const T_freeze = EARTH.T_FREEZE_SEAWATER_K - (P_atm - 1) * EARTH.T_WATER_CYCLE_FREEZE_K_PER_ATM;
    const T_low_K = Math.max(T_MIN_K, T_freeze - EARTH.T_WATER_CYCLE_MARGIN_GEL_K);
    const T_high_K = Math.max(EARTH.T_WATER_CYCLE_EVAP_LOW_K, Math.min(T_MAX_K, T_MAX_K - (P_atm - 1) * EARTH.T_WATER_CYCLE_HIGH_K_PER_ATM));
    return { T_low_K, T_high_K };
}
PHYS.getWaterCycleTempBoundsFromPressure = getWaterCycleTempBoundsFromPressure;

// Facteur d'échelle vapeur d'eau (gaz) pour EDS. Calculé depuis T, P, vapor, CO2 (pas d'époque).
// Réf Schmidt 2010 : vapeur ~50% EDS. Formule corrige sur-estimation (chevauchement H2O/CO2 15-17 µm).
// CO2 ≥ 400 ppm : scale = 0.70 (lit. EDS_H₂O ~75 W/m² vs tau-ratio ~103 → réduction 38%).
// CO2 < 400 ppm : scale = 0.5 × f_T × f_P × f_v (saturation, pression).
//
// --- Credence et plage ---
// Credence: ~60%. 0.70 cible EDS_H₂O ≈ 72 W/m² à T=15°C (lit. ~75). Plage lit. 0.3–1.0.
// H2O_EDS_SCALE : EARTH.H2O_EDS_SCALE (calculations.js).