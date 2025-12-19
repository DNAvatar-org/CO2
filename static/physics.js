// ============================================================================
// File: physics.js - Constantes et lois physiques fondamentales
// Desc: En français, dans l'architecture, je suis le module de physique fondamentale
// Version 2.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: physics constants and Planck/Stefan-Boltzmann functions
//   - Centralisation de toutes les CONST dans physics.js
// ============================================================================

// Initialiser CONST (pointeur vers window.CONST)
// CONST est un pointeur : modifier CONST modifie automatiquement window.CONST
const CONST = window.CONST = window.CONST || {};

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
CONST.T_FREEZE = 273.15;  // Point de congélation de l'eau (K)
CONST.T_BOIL = 373.15;  // Point d'ébullition de l'eau à 1 atm (K)
CONST.T0_WATER = 273.15;  // Point triple de l'eau (K)
CONST.P0_WATER = 611.2;  // Pression au point triple de l'eau (Pa)
CONST.L_VAPORIZATION = 2.5e6;  // Chaleur latente de vaporisation (J/kg)
CONST.RV_WATER = 461.5;  // Constante des gaz pour la vapeur d'eau (J/(kg·K))
CONST.L_V = 40660;  // Chaleur latente de vaporisation (J/mol)

// Coefficients d'albédo par type de surface (propriétés physiques constantes)
// Ces valeurs sont des propriétés intrinsèques des matériaux, indépendantes de l'époque
// Références littérature :
// - Albedo moyen Terre actuelle : ~0.31 (31%)
// - Neige fraîche : 0.75-0.90
// - Glace : 0.60
// - Nuages : 0.50-0.80
// - Forêt de feuillus : 0.15-0.20
// - Cultures : 0.15-0.25
// - Mer/Océan : 0.05-0.15
// - Déserts : ~0.30
// - Zones urbaines : 0.1-0.2
CONST['🪩🍰'] = {
    '🪩🍰🌋': 0.05,  // Volcan/magma : très sombre (littérature : ~0.05-0.10)
    '🪩🍰🌊': 0.08,  // Océan : sombre (littérature : 0.05-0.15, moyenne ~0.08)
    '🪩🍰🌳': 0.17,  // Forêt : légèrement réfléchissant (littérature : 0.15-0.20, moyenne ~0.17)
    '🪩🍰🏖': 0.30,  // Désert : réfléchissant (littérature : ~0.30)
    '🪩🍰🧊': 0.70,  // Glace : très réfléchissant (littérature : 0.60, neige fraîche 0.75-0.90, moyenne ~0.70)
    '🪩🍰⛅': 0.50,  // Nuages : moyennement réfléchissant (littérature : 0.50-0.80, moyenne ~0.50)
    '🪩🍰🌍': 0.18   // Land/Continents : prairies, sols humides (littérature : 0.15-0.20, moyenne ~0.18)
};

// Constantes pour le calcul de l'index de formation nuageuse (☁️)
// ☁️ = clamp((🍰🫧💧 / H2O_VAPOR_REF) × f(T_surface, 📏🫧🛩) × (1 + ALPHA_OCEAN × 🍰🪩🌊), 0, 1)
CONST.H2O_VAPOR_REF = 0.4;  // 🍰🫧💧_ref = 0.4 (Terre tempérée, référence pour ratio vapeur)
CONST.ALPHA_OCEAN = 0.3;    // α = 0.3 (effet océan / convection sur formation nuageuse)

// NOTE : C_MAX_CLOUD et ETA_CLOUD ne sont PAS des constantes universelles
// Elles dépendent de la pression atmosphérique, composition, gravité, température
// Elles sont calculées dynamiquement dans calculateCloudFormationIndex() ou calculateAlbedo()

// ✅ SCIENTIFIQUEMENT CERTAIN :
// - La loi de Planck B(λ,T) = (2hc²/λ⁵) / (exp(hc/λkT) - 1) est une loi fondamentale de la physique
// - Dérivée par Max Planck en 1900, elle décrit le spectre d'émission d'un corps noir
// - Cette formule est exacte et utilisée dans tous les modèles de transfert radiatif
// - Les constantes utilisées (h, c, k) sont des constantes fondamentales mesurées avec précision
function planckFunction(lambda, T) {
    const term1 = (2 * CONST.PLANCK_H * CONST.SPEED_OF_LIGHT * CONST.SPEED_OF_LIGHT) / Math.pow(lambda, 5);
    const term2 = Math.exp((CONST.PLANCK_H * CONST.SPEED_OF_LIGHT) / (lambda * CONST.BOLTZMANN_KB * T)) - 1;
    return term1 / term2; // W/(m²·m·sr) - Intensité spectrale d'un corps noir
}

window.planckFunction=planckFunction;