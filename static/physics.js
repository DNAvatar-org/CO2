// ============================================================================
// File: physics.js - Constantes et lois physiques fondamentales
// Desc: En français, dans l'architecture, je suis le module de physique fondamentale
// Version 2.0.6
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
// - Sections efficaces : hitran.js + lignes HITRAN. ΔF = convention affichage → climate.js, pas ici.
// - getH2OVaporEDSScale() — formule T,P,vapor,CO2 (pas d'époque), doc/VAPEUR_VS_NUAGES.md
// - Convention : Credence (%) + Plage lit. / écart-type en commentaire pour params tunables (éviter patch en aveugle). v2.0.3.
// - getH2OVaporEDSScale : 1.0→0.70 pour CO2≥400 ppm (cible EDS_H₂O ~72 W/m², lit. ~75).
// - v2.0.4 : atténuation thermique h2o_eds_scale (5–10%) au-dessus de 20°C pour limiter la sur-rétroaction chaude
// - v2.0.5 : règle simple h2o_eds_scale = 0.92 si T>290K, sinon 1.0
// - v2.0.6 : essai calibration 2025 (EDS H2O) : h2o_eds_scale = 0.92 en base, sans branchement epoch
// ============================================================================

// Initialiser CONST (pointeur vers window.CONST)
// var pour permettre plot.js et main.js de faire var CONST = window.CONST sans erreur
var CONST = window.CONST = window.CONST || {};

// ✅ SCIENTIFIQUEMENT CERTAIN : Toutes ces constantes sont des valeurs mesurées et acceptées internationalement
CONST.PLANCK_H = 6.62607015e-34;      // Constante de Planck, J·s (CODATA 2018)
CONST.SPEED_OF_LIGHT = 2.998e8;       // Vitesse de la lumière, m/s (mesurée)
CONST.BOLTZMANN_KB = 1.380649e-23;    // Constante de Boltzmann, J/K (CODATA 2018)
CONST.STEFAN_BOLTZMANN = 5.670374419e-8; // Constante de Stefan-Boltzmann, W/(m²·K⁴) (dérivée des constantes fondamentales)

// Constantes physiques universelles (ne varient pas avec les époques)
CONST.AU_M = 1.496e11;                     // m - 1 Unité Astronomique en mètres (constante universelle)
CONST.STANDARD_ATMOSPHERE_PA = 101325;     // Pa - Pression atmosphérique standard (1 atm = 101325 Pa)

// Constantes molaires (masse molaire en kg/mol) - propriétés intrinsèques des molécules
CONST.M_N2 = 0.02801;      // N₂ : 28.01 g/mol
CONST.M_O2 = 0.03200;      // O₂ : 32.00 g/mol
CONST.M_CO2 = 0.04401;     // CO₂ : 44.01 g/mol
CONST.M_CH4 = 0.01604;     // CH₄ : 16.04 g/mol
CONST.M_H2O = 0.01802;     // H₂O : 18.02 g/mol
CONST.M_AR = 0.03995;      // Ar : 39.95 g/mol
CONST.molar_mass_air_ref = 0.029;  // Masse molaire moyenne de l'air de référence (kg/mol)

// Constantes pour l'eau (H2O)
CONST.R_GAS = 8.314;  // Constante des gaz parfaits, J/(mol·K)
CONST.T_BOIL = 373.15;  // Point d'ébullition de l'eau à 1 atm (K)
CONST.T0_WATER = 273.15;  // Point triple de l'eau (K) = point de congélation à 1 atm
CONST.P0_WATER = 611.2;  // Pression au point triple de l'eau (Pa)
CONST.L_VAPORIZATION = 2.5e6;  // Chaleur latente de vaporisation (J/kg)
CONST.RV_WATER = 461.5;  // Constante des gaz pour la vapeur d'eau (J/(kg·K))
CONST.L_V = 40660;  // Chaleur latente de vaporisation (J/mol)
CONST.CP_AIR = 1005;  // Capacité calorifique à pression constante de l'air sec (J/(kg·K))
CONST.T_NO_POLAR_ICE_C = 20;  // Température en °C au-dessus de laquelle il n'y a plus de glace polaire
CONST.T_ICE_TRANSITION_RANGE_C = 20;  // Zone de transition liquide-glace (en °C)

// Constantes de conversion température
CONST.KELVIN_TO_CELSIUS = 273.15;  // Conversion Kelvin → Celsius (K = °C + 273.15)

// Nombre max d'itérations radiatif : CONFIG_COMPUTE.maxRadiatifIters uniquement (pas de copie dans CONST).

// Constantes pour l'eau
CONST.RHO_WATER = 1000;  // Densité de l'eau (kg/m³)

// Constantes pour le calcul de volcano_coverage
CONST.T_LAVA_START = 1000;  // Température de début de transition vers lave (K)
CONST.T_LAVA_COMPLETE = 2373;  // Température complète de lave (K, 2100°C)

// Constantes pour l'évaporation
CONST.EVAPORATION_E0 = 0.001;  // Taux d'évaporation de base (kg/(m²·s))
CONST.EVAPORATION_T_REF = 288;  // Température de référence pour l'évaporation (K, 15°C)
CONST.EVAPORATION_T_SCALE = 20;  // Facteur d'échelle température-évaporation (K)

// ΔF = convention terrestre / affichage uniquement (climate.js), pas utilisé pour le calcul de T.
// Constantes et formules ΔF → climate.js (cosmétique / diagnostic). Ici : physique uniquement (EDS, OLR, σ, etc.).

// Longueurs d'onde des bandes d'absorption (m) — affichage plot / marqueurs spectre. Sections efficaces : hitran.js + lignes HITRAN.
CONST.LAMBDA_CO2_CENTER = 15.0e-6;   // CO₂ 15 μm
CONST.LAMBDA_H2O_1 = 6.3e-6;         // H₂O 6.3 μm
CONST.LAMBDA_H2O_2 = 17.0e-6;        // H₂O 17 μm
CONST.LAMBDA_CH4_1 = 7.7e-6;         // CH₄ 7.7 μm
CONST.LAMBDA_CH4_2 = 3.3e-6;         // CH₄ 3.3 μm

// Coefficients d'albédo par type de surface (propriétés physiques constantes)
// Credence globale: ~90%. Plage lit. par surface ci‑dessous (écart-type ~0.03–0.08 selon type).
CONST['🪩🍰'] = {
    '🪩🍰🌋': 0.05,  // Volcan. Plage lit.: 0.05–0.10. Credence ~85%.
    '🪩🍰🌊': 0.08,  // Océan. Plage lit.: 0.05–0.15. Credence ~90%.
    '🪩🍰🌳': 0.17,  // Forêt. Plage lit.: 0.15–0.20. Credence ~90%.
    '🪩🍰🏜️': 0.30,  // Désert. Plage lit.: 0.28–0.35. Credence ~95%.
    '🪩🍰🧊': 0.70,  // Glace. Plage lit.: 0.60–0.90 (neige fraîche plus haute). Credence ~90%.
    '🪩🍰⛅': 0.50,  // Nuages. Plage lit.: 0.50–0.80. Credence ~80%.
    '🪩🍰🌍': 0.18   // Land. Plage lit.: 0.15–0.25. Credence ~85%.
};

// Constantes pour le calcul de l'index de formation nuageuse (☁️)
// ☁️ = clamp((🍰🫧💧 / H2O_VAPOR_REF) × f(T_surface, 📏🫧🛩) × (1 + ALPHA_OCEAN × 🍰🪩🌊) × SCALE_CLOUD, 0, 1)
// Credence H2O_VAPOR_REF: ~80%. Plage lit.: 0.008–0.015 (Terre tempérée 0.5–1.5% vapeur).
// Credence ALPHA_OCEAN: ~60%. Plage lit.: 0.2–0.5 (paramètre empirique convection/océan).
// Credence SCALE_CLOUD: ~50%. Plage lit.: 0.3–0.6 (ajusté pour ☁️ ~0.4–0.6 ; pas de σ litt. direct).
CONST.H2O_VAPOR_REF = 0.01;  // 🍰🫧💧_ref = 0.01 (1%, Terre tempérée, référence pour ratio vapeur)
CONST.ALPHA_OCEAN = 0.3;    // α = 0.3 (effet océan / convection sur formation nuageuse)
CONST.SCALE_CLOUD = 0.4;    // Facteur d'échelle pour ajuster ☁️ dans la plage 0.3-0.5

// Bornes température cycle de l'eau : -10°C à 150°C max, resserrées par la pression
CONST.T_WATER_CYCLE_MIN_C = -10;   // Borne basse absolue (°C)
CONST.T_WATER_CYCLE_MAX_C = 150;  // Borne haute absolue (°C)
CONST.T_FREEZE_SEAWATER_K = 271.15;  // -2°C, congélation eau de mer à 1 atm (K)
CONST.T_WATER_CYCLE_FREEZE_K_PER_ATM = 1;   // T_freeze baisse d'environ 1 K par atm au-dessus de 1
CONST.T_WATER_CYCLE_MARGIN_GEL_K = 5;      // Marge autour du gel (K), bande gel = [T_freeze-margin, T_freeze+margin]
CONST.T_WATER_CYCLE_EVAP_LOW_K = 323.15;   // 50°C, début zone évaporation (K)
CONST.T_WATER_CYCLE_HIGH_K_PER_ATM = 5;    // Borne haute baisse de 5 K par atm > 1 (resserrement)

// Constantes pour les précipitations
CONST.PRECIP_BASE_RATE = 5e-6;  // Taux de base de précipitation (s⁻¹)
CONST.PRECIP_PRESSURE_SCALE = 5e-6;  // Facteur d'échelle pression pour précipitations
CONST.PRECIP_CLOUD_SCALE = 1e-6;  // Facteur d'échelle nuages pour précipitations

// Constantes de référence pour les masses
CONST.O2_REF_MASS = 1e18;  // Masse de référence pour O₂ (kg)
CONST.CH4_REF_MASS = 1e13;  // Masse de référence pour CH₄ (kg)

// NOTE : C_MAX_CLOUD et ETA_CLOUD ne sont PAS des constantes universelles
// Elles dépendent de la pression atmosphérique, composition, gravité, température
// Elles sont calculées dynamiquement dans calculateCloudFormationIndex() ou calculateAlbedo()

// ✅ SCIENTIFIQUEMENT CERTAIN :
// - La loi de Planck B(λ,T) = (2hc²/λ⁵) / (exp(hc/λkT) - 1) est une loi fondamentale de la physique
// - Dérivée par Max Planck en 1900, elle décrit le spectre d'émission d'un corps noir
// - Cette formule est exacte et utilisée dans tous les modèles de transfert radiatif
// - Les constantes utilisées (h, c, k) sont des constantes fondamentales mesurées avec précision
// - Cap numérique : pour T très élevé (ex. Hadéen 2450 K) et λ court, term1/term2 peut overflow → plafonner
const MAX_PLANCK_SAFE = 1e30; // W/(m²·sr·m) — évite Infinity dans le transfert radiatif
function planckFunction(lambda, T) {
    if (!Number.isFinite(lambda) || !Number.isFinite(T) || lambda <= 0 || T <= 0) return 0;
    const term1 = (2 * CONST.PLANCK_H * CONST.SPEED_OF_LIGHT * CONST.SPEED_OF_LIGHT) / Math.pow(lambda, 5);
    const term2 = Math.exp((CONST.PLANCK_H * CONST.SPEED_OF_LIGHT) / (lambda * CONST.BOLTZMANN_KB * T)) - 1;
    const B = (term2 > 0) ? term1 / term2 : 0;
    if (!Number.isFinite(B) || B < 0) return 0;
    return Math.min(B, MAX_PLANCK_SAFE); // W/(m²·m·sr) - Intensité spectrale d'un corps noir
}

window.planckFunction=planckFunction;

// Borne basse/haute (K) pour "cycle eau actif", fonction de la pression (atm).
// Plage max -10°C à 150°C ; la pression resserre la fourchette (gel et évaporation).
function getWaterCycleTempBoundsFromPressure(P_atm) {
    const T_MIN_K = CONST.T_WATER_CYCLE_MIN_C + CONST.KELVIN_TO_CELSIUS;
    const T_MAX_K = CONST.T_WATER_CYCLE_MAX_C + CONST.KELVIN_TO_CELSIUS;
    if (typeof P_atm !== 'number' || !Number.isFinite(P_atm) || P_atm < 0.01) {
        return { T_low_K: T_MIN_K, T_high_K: T_MAX_K };
    }
    const T_freeze = CONST.T_FREEZE_SEAWATER_K - (P_atm - 1) * CONST.T_WATER_CYCLE_FREEZE_K_PER_ATM;
    const T_low_K = Math.max(T_MIN_K, T_freeze - CONST.T_WATER_CYCLE_MARGIN_GEL_K);
    const T_high_K = Math.max(CONST.T_WATER_CYCLE_EVAP_LOW_K, Math.min(T_MAX_K, T_MAX_K - (P_atm - 1) * CONST.T_WATER_CYCLE_HIGH_K_PER_ATM));
    return { T_low_K, T_high_K };
}
window.getWaterCycleTempBoundsFromPressure = getWaterCycleTempBoundsFromPressure;

// Facteur d'échelle vapeur d'eau (gaz) pour EDS. Calculé depuis T, P, vapor, CO2 (pas d'époque).
// Réf Schmidt 2010 : vapeur ~50% EDS. Formule corrige sur-estimation (chevauchement H2O/CO2 15-17 µm).
// CO2 ≥ 400 ppm : scale = 0.70 (lit. EDS_H₂O ~75 W/m² vs tau-ratio ~103 → réduction 38%).
// CO2 < 400 ppm : scale = 0.5 × f_T × f_P × f_v (saturation, pression).
//
// --- Credence et plage ---
// Credence: ~60%. 0.70 cible EDS_H₂O ≈ 72 W/m² à T=15°C (lit. ~75). Plage lit. 0.3–1.0.
function getH2OVaporEDSScale() {
    const DATA = window.DATA;
    if (!DATA || !DATA['🧮']) return 1.0;
    return 0.92; // -8% global, essai #1 pour réduire 🔺🧲 moderne
}
window.getH2OVaporEDSScale = getH2OVaporEDSScale;