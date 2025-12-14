// ============================================================================
// File: calculations.js - Calculs de transfert radiatif
// Desc: En français, dans l'architecture, je suis le module de calculs radiatifs
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: calculs de transfert radiatif en JavaScript
// ============================================================================

// ============================================================================
// CALCULS DE TRANSFERT RADIATIF EN JAVASCRIPT
// ============================================================================

// Constantes physiques et climatiques sont maintenant dans physics.js et climate.js
// Utiliser directement les constantes globales exposées par ces modules

// Les fonctions calculateAlbedo, calculateCloudCoverage et calculateSolarFluxAbsorbed
// ont été déplacées dans calculations_albedo.js
// Utiliser window.calculateAlbedo, window.calculateCloudCoverage, window.calculateSolarFluxAbsorbed

// Fonction wrapper pour compatibilité (redirige vers calculations_albedo.js)
// ⚠️ IMPORTANT : Ne pas créer de récursion infinie
function calculateAlbedo(T_surface_K, h2o_enabled, geothermal_flux = null) {
    // Utiliser la fonction originale sauvegardée par calculations_albedo.js
    if (typeof window !== 'undefined' && typeof window._calculateAlbedoOriginal === 'function') {
        return window._calculateAlbedoOriginal(T_surface_K, h2o_enabled, geothermal_flux);
    }
    // Fallback vers window.calculateAlbedo si la version originale n'existe pas
    if (typeof window !== 'undefined' && typeof window.calculateAlbedo === 'function') {
        const realFunction = window.calculateAlbedo;
        // Vérifier que ce n'est pas nous-mêmes (éviter récursion)
        if (realFunction !== calculateAlbedo) {
            return realFunction(T_surface_K, h2o_enabled, geothermal_flux);
        }
    }
    // Fallback si calculations_albedo.js n'est pas chargé
    console.error('[calculations.js] calculateAlbedo non disponible, calculations_albedo.js doit être chargé avant');
    return 0.3; // Valeur par défaut
}

// Fonction wrapper pour compatibilité (redirige vers calculations_albedo.js)
// ⚠️ IMPORTANT : Ne pas créer de récursion infinie
function calculateCloudCoverage(T_surface_K, h2o_enabled) {
    // Utiliser la fonction originale sauvegardée par calculations_albedo.js
    if (typeof window !== 'undefined' && typeof window._calculateCloudCoverageOriginal === 'function') {
        return window._calculateCloudCoverageOriginal(T_surface_K, h2o_enabled);
    }
    // Fallback vers window.calculateCloudCoverage si la version originale n'existe pas
    if (typeof window !== 'undefined' && typeof window.calculateCloudCoverage === 'function') {
        const realFunction = window.calculateCloudCoverage;
        // Vérifier que ce n'est pas nous-mêmes (éviter récursion)
        if (realFunction !== calculateCloudCoverage) {
            return realFunction(T_surface_K, h2o_enabled);
        }
    }
    // Fallback si calculations_albedo.js n'est pas chargé
    console.error('[calculations.js] calculateCloudCoverage non disponible, calculations_albedo.js doit être chargé avant');
    return 0;
}

// Fonction wrapper pour compatibilité (redirige vers calculations_albedo.js)
// ⚠️ IMPORTANT : Ne pas créer de récursion infinie
// On utilise directement window._calculateSolarFluxAbsorbedOriginal si disponible
function calculateSolarFluxAbsorbed(T_surface_K, h2o_enabled, geothermal_flux = null) {
    // Utiliser la fonction originale sauvegardée par calculations_albedo.js
    if (typeof window !== 'undefined' && typeof window._calculateSolarFluxAbsorbedOriginal === 'function') {
        return window._calculateSolarFluxAbsorbedOriginal(T_surface_K, h2o_enabled, geothermal_flux);
    }
    // Fallback vers window.calculateSolarFluxAbsorbed si la version originale n'existe pas
    if (typeof window !== 'undefined' && typeof window.calculateSolarFluxAbsorbed === 'function') {
        const realFunction = window.calculateSolarFluxAbsorbed;
        // Vérifier que ce n'est pas nous-mêmes (éviter récursion)
        if (realFunction !== calculateSolarFluxAbsorbed) {
            return realFunction(T_surface_K, h2o_enabled, geothermal_flux);
        }
    }
    // Fallback si calculations_albedo.js n'est pas chargé
    const SOLAR_CONSTANT = window.SOLAR_CONSTANT || 1366;
    return SOLAR_CONSTANT * 0.7 / 4; // Valeur par défaut (albedo 0.3)
}

// Les fonctions calculateAlbedo, calculateCloudCoverage et calculateSolarFluxAbsorbed
// ont été déplacées dans calculations_albedo.js
// Les wrappers ci-dessus redirigent vers les fonctions globales exposées par ce module

// ============================================================================
// FONCTIONS DE TRANSFERT RADIATIF (conservées dans ce fichier)
// ============================================================================

// Les fonctions de forçage radiatif sont maintenant dans climate.js
// Utiliser directement les fonctions globales exposées par ce module (window.calculateCO2Forcing, etc.)

// Valeurs de référence
const CO2_PREINDUSTRIAL = 280e-6;     // 280 ppm
const CO2_CURRENT = 420e-6;           // 420 ppm

// Logos pour les logs (utilise window.LOGOS si disponible, sinon valeurs par défaut)
const LOGO_EDS = '📛'; // Forçage radiatif (EDS)
const LOGO_CO2 = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CO2) ? window.LOGOS.CO2 : '🏭';
const LOGO_H2O = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.H2O) ? window.LOGOS.H2O : '💧';
const LOGO_CH4 = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CH4) ? window.LOGOS.CH4 : '⛽';
const LOGO_TEMP = '🌡️';

// Variable globale pour activer/désactiver la vapeur d'eau
let waterVaporEnabled = false;

// Exposer la variable globalement pour l'interface
if (typeof window !== 'undefined') {
    window.waterVaporEnabled = false;
    Object.defineProperty(window, 'waterVaporEnabled', {
        get: () => waterVaporEnabled,
        set: (value) => {
            waterVaporEnabled = value;
        }
    });
}

// ============================================================================
// FONCTION DE PLANCK
// ============================================================================

// La fonction planckFunction est maintenant dans physics.js
// Utiliser directement window.planckFunction pour éviter les conflits de nom
function getPlanckFunction() {
    if (typeof window !== 'undefined' && typeof window.planckFunction === 'function') {
        return window.planckFunction;
    }
    // Fallback si physics.js n'est pas chargé
    console.error('[calculations.js] planckFunction non disponible, physics.js doit être chargé avant');
    return null;
}

// Fonction locale pour utiliser planckFunction sans conflit
function localPlanckFunction(lambda, T) {
    const planckFunc = getPlanckFunction();
    if (planckFunc) {
        return planckFunc(lambda, T);
    }
    // Fallback si physics.js n'est pas chargé (ne devrait jamais arriver)
    const PLANCK_H = 6.62607015e-34;
    const SPEED_OF_LIGHT = 2.998e8;
    const BOLTZMANN_KB = 1.380649e-23;
    const term1 = (2 * PLANCK_H * SPEED_OF_LIGHT * SPEED_OF_LIGHT) / Math.pow(lambda, 5);
    const term2 = Math.exp((PLANCK_H * SPEED_OF_LIGHT) / (lambda * BOLTZMANN_KB * T)) - 1;
    return term1 / term2;
}

// ============================================================================
// MODÈLE ATMOSPHÉRIQUE
// ============================================================================

/**
 * Wrapper pour la fonction pressure de calculations_atm.js
 * Calcule la pression à partir des quantités de gaz (pas de formule fixe)
 * 
 * @param {number} z - Altitude en mètres
 * @param {Object} params - Paramètres atmosphériques (optionnel, utilise valeurs par défaut si non fourni)
 * @returns {number} Pression en Pascal (Pa)
 */
// Fonction physique pour calculer la pression
// P0 = (M_atm * g) / S_terre
// P(z) = P0 * exp(-z / H) avec H = R*T / (M_air * g)
function pressure(z, params = null) {
    const R_GAS_CONSTANT = 8.314462618; // J/(mol·K)

    // Initialisation avec undefined pour détecter les manquants
    let total_mass, gravity, planet_radius, temp_K, molar_mass_air;

    // Récupération des paramètres dynamiques (depuis window ou params)
    if (typeof window !== 'undefined') {
        // 1. Paramètres de l'époque
        if (window.currentEpochName) {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch) {
                if (typeof currentEpoch['⚖️🌬'] === 'number') total_mass = currentEpoch['⚖️🌬'];
                if (typeof currentEpoch.gravity === 'number') gravity = currentEpoch.gravity;
                // Convertir le rayon de km en mètres pour les calculs
                if (typeof currentEpoch['📐'] === 'number') planet_radius = currentEpoch['📐'] * 1000;

                // Calculer ou récupérer la masse molaire moyenne de l'air
                if (typeof currentEpoch.molar_mass_air === 'number') {
                    molar_mass_air = currentEpoch.molar_mass_air;
                } else {
                    // Utiliser la fonction helper pour calculer depuis les composants
                    molar_mass_air = window.calculateMolarMassAir(currentEpoch);
                }

                // Température initiale si définie dans l'époque
                if (typeof currentEpoch.initial_temperature_K === 'number') temp_K = currentEpoch.initial_temperature_K;
            }
        }

        // 2. Température calculée (prioritaire sur l'initiale)
        if (window.plotData && typeof window.plotData.temp_surface === 'number') {
            temp_K = window.plotData.temp_surface;
        }
        // Ou T0 ajustée lors des calculs itératifs
        else if (typeof window.current_T0_adjusted === 'number' && window.current_T0_adjusted > 0) {
            temp_K = window.current_T0_adjusted;
        }
    }

    // Surcharge par params si fourni
    if (params) {
        if (params.total_atmosphere_mass_kg) total_mass = params.total_atmosphere_mass_kg;
        if (params.gravity) gravity = params.gravity;
        if (params.temperature_K) temp_K = params.temperature_K;
        if (params.planet_radius) planet_radius = params.planet_radius;
        if (params.molar_mass_air) molar_mass_air = params.molar_mass_air; // Si fourni explicitement
    }
    
    // Si params n'est pas fourni, essayer d'utiliser window._currentPhysParams (exposé par calculateFluxForT0)
    if (!params && typeof window !== 'undefined' && window._currentPhysParams) {
        const physParams = window._currentPhysParams;
        if (physParams.total_atmosphere_mass_kg !== undefined) total_mass = physParams.total_atmosphere_mass_kg;
        if (physParams.gravity !== undefined) gravity = physParams.gravity;
        if (physParams.temperature_K !== undefined) temp_K = physParams.temperature_K;
        if (physParams.planet_radius !== undefined) planet_radius = physParams.planet_radius;
        if (physParams.molar_mass_air !== undefined) molar_mass_air = physParams.molar_mass_air;
    }
    
    // Si total_mass est toujours undefined, essayer de le récupérer depuis window._currentPhysParams
    if (total_mass === undefined && typeof window !== 'undefined' && window._currentPhysParams) {
        total_mass = window._currentPhysParams.total_atmosphere_mass_kg;
    }
    
    // Si total_mass est toujours undefined, essayer de le récupérer depuis window.DATA
    if (total_mass === undefined && typeof window !== 'undefined' && window.DATA && window.DATA['⚖️']) {
        total_mass = window.DATA['⚖️']['⚖️📿'] || 0;
    }

    // 🔒 VALIDATION STRICTE : Aucune valeur par défaut terrestre silencieuse
    // Si pas d'atmosphère (total_mass = 0), retourner 0 immédiatement sans warning
    if (total_mass === 0) {
        return 0; // Pas d'atmosphère = pas de pression (cas normal pour Corps noir)
    }
    
    if (total_mass === undefined || gravity === undefined || planet_radius === undefined) {
        console.error("[pressure] ❌ ERREUR CRITIQUE : Paramètres physiques manquants pour calcul de pression !", { total_mass, gravity, planet_radius, epoch: (typeof window !== 'undefined' ? window.currentEpochName : 'unknown') });

        if (typeof window !== 'undefined' && !window._physicsAlertShown) {
            const alertFunc = (window.showSelectableAlert) ? window.showSelectableAlert : alert;
            alertFunc(`ERREUR PHYSIQUE : Paramètres atmosphériques manquants pour l'époque '${window.currentEpochName}'.\n\nIl manque : ${total_mass === undefined ? 'Masse Atm' : ''} ${gravity === undefined ? 'Gravité' : ''} ${planet_radius === undefined ? 'Rayon' : ''}\n\nLe calcul ne peut pas aboutir.`, "Erreur Physique");
            window._physicsAlertShown = true;
        }

        // Sans paramètres, pas d'atmosphère
        return 0;
    }

    // Température et Molaire doivent aussi être définis ou calculables
    // Si molar_mass_air manque dans params, essayer de le calculer depuis les composants
    if (molar_mass_air === undefined && typeof window !== 'undefined' && window.currentEpochName) {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        molar_mass_air = window.calculateMolarMassAir(currentEpoch);
    }
    
    // Si molar_mass_air est toujours undefined mais qu'on a une atmosphère, utiliser une valeur par défaut
    // (pour les cas où tous les composants sont à 0 mais qu'il y a quand même une atmosphère)
    if (molar_mass_air === undefined && total_mass !== undefined && total_mass > 0) {
        // Valeur par défaut basée sur la masse totale de l'atmosphère
        // Atmosphère lourde (> 2.5e19 kg) → 0.044, sinon 0.029 (air moderne)
        molar_mass_air = (total_mass > 2.5e19) ? 0.044 : 0.029;
    }

    // Si pas d'atmosphère (total_mass = 0), retourner 0 sans warning (c'est normal)
    if (total_mass === 0 || total_mass === undefined) {
        return 0; // Pas d'atmosphère = pas de pression
    }

    // Si temp_K ou molar_mass_air sont undefined alors qu'on a une atmosphère, c'est une erreur
    if (temp_K === undefined || molar_mass_air === undefined) {
        console.warn("[pressure] Température ou masse molaire indéfinie, retour 0", { temp_K, molar_mass_air, total_mass, epoch: (typeof window !== 'undefined' ? window.currentEpochName : 'unknown') });
        return 0;
    }

    // Calcul de la surface planétaire
    // S = 4 * pi * R^2
    const surface_area = 4 * Math.PI * Math.pow(planet_radius, 2);

    // Calcul de la pression au sol P0 (Pa)
    // P = F / S = (m * g) / S
    const P0 = (total_mass * gravity) / surface_area;

    // Calcul de l'échelle de hauteur H (Scale Height)
    // H = (R * T) / (M * g)
    // Note : T devrait être la température moyenne de la basse atmosphère, T0 est une bonne approx
    const H = (R_GAS_CONSTANT * temp_K) / (molar_mass_air * gravity);

    // Formule barométrique isotherme (approximation suffisante pour la structure globale)
    return P0 * Math.exp(-z / H);
}

// ============================================================================
// OBJET D'ÉTAT CENTRALISÉ POUR LES CONCENTRATIONS ET ÉTATS
// ============================================================================
/**
 * Convertit les ppm en différentes unités
 * @param {number} ppm - Valeur en ppm (parties par million)
 * @returns {object} Objet avec différentes représentations
 */
function convertPPM(ppm) {
    const fraction = ppm * 1e-6; // ppm → fraction molaire
    const percent = ppm * 0.0001; // ppm → pourcentage
    return {
        ppm: ppm,
        fraction: fraction,
        percent: percent,
        formattedPPM: `${ppm.toFixed(2)} ppm`,
        formattedPercent: `${percent.toFixed(6)}%`,
        formattedFraction: `${fraction.toExponential(3)}`
    };
}

/**
 * Convertit une fraction molaire en ppm
 * @param {number} fraction - Fraction molaire (0 à 1)
 * @returns {number} Valeur en ppm
 */
function fractionToPPM(fraction) {
    return fraction * 1e6;
}

/**
 * Convertit les ppm en pourcentage
 * @param {number} ppm - Valeur en ppm
 * @returns {number} Pourcentage (0 à 100)
 */
function ppmToPercent(ppm) {
    return ppm * 0.0001; // 1 ppm = 0.0001%
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.convertPPM = convertPPM;
    window.fractionToPPM = fractionToPPM;
    window.ppmToPercent = ppmToPercent;
}

// ============================================================================
// OBJET D'ÉTAT CENTRALISÉ POUR LES CONCENTRATIONS ET ÉTATS
// ============================================================================
/**
 * Objet centralisé pour gérer l'état de la simulation
 * Contient toutes les concentrations et états actifs/inactifs
 */
const simulationState = {
    // Concentrations (en fraction molaire)
    co2_fraction: 0,              // Fraction molaire de CO₂ (0 à 1)
    co2_ppm: 0,                   // CO₂ en ppm (parties par million)

    // États actifs/inactifs
    h2o_enabled: false,            // Vapeur d'eau activée (true/false)
    cloud_coverage: 0,             // Couverture nuageuse (0 à 1, 0% à 100%)

    // Température
    T0: null,                      // Température de surface (K)
    T0_adjusted: null,             // T0 ajustée par dichotomie (K)

    // Albedo
    albedo: 0.3,                   // Albédo actuel (0 à 1)

    // Autres
    ice_coverage: 0,               // Couverture de glace (0 à 1)
    volcano_count: 0               // Nombre de volcans
};

// ============================================================================
// COMPOSITION ATMOSPHÉRIQUE COMPLÈTE (pour calculs précis)
// ============================================================================
/**
 * Structure pour la composition atmosphérique complète
 * Stockée mais non affichée, utilisée pour des calculs plus précis
 */
if (typeof window !== 'undefined') {
    window.atmosphericComposition = {
        // Gaz à effet de serre
        CO2: 0,                    // Fraction molaire CO₂ (0-1)
        H2O_vapor: 0,              // Fraction molaire H₂O vapeur (0-1) - calculée dynamiquement
        CH4: 0,                    // Fraction molaire CH₄ (0-1)

        // Gaz neutres (pas d'effet de serre direct)
        N2: 0.78,                  // Azote - fraction molaire (défaut: 78% comme sur Terre moderne)
        O2: 0.21,                  // Oxygène - fraction molaire (défaut: 21% comme sur Terre moderne)
        Ar: 0.009,                 // Argon - fraction molaire (défaut: 0.9%)

        // Eau (répartition calculée dynamiquement)
        H2O_total: 0,              // Total eau disponible (vapeur + glace) en fraction
        H2O_ice: 0,                // Eau sous forme de glace (fraction)

        // Normalisation : la somme doit faire 1.0
        // Les gaz neutres (N2, O2, Ar) remplissent le reste après soustraction des GES
    };
}

// Variable globale pour stocker la fraction CO2 actuelle et T0 ajustée (pour compatibilité)
let current_CO2_fraction_for_temp = null;
let current_T0_adjusted = null; // T0 ajustée par dichotomie

// ============================================================================
// FONCTIONS DE CONVERSION PPM / % / FRACTION
// ============================================================================
/**
 * Convertit les ppm en différentes unités
 * @param {number} ppm - Valeur en ppm (parties par million)
 * @returns {object} Objet avec différentes représentations
 */
function convertPPM(ppm) {
    const fraction = ppm * 1e-6;           // Fraction molaire (0 à 1)
    const percent = ppm * 0.0001;          // Pourcentage (%)
    const ppb = ppm * 1000;                // Parties par milliard (ppb)

    // Formatage intelligent selon la valeur
    let formatted = '';
    if (ppm >= 1) {
        formatted = `${ppm.toFixed(2)} ppm`;
    } else if (ppm >= 0.001) {
        formatted = `${(ppm * 1000).toFixed(3)} ppb`; // milli-ppm
    } else if (ppm >= 0.000001) {
        formatted = `${(ppm * 1e6).toFixed(3)} ppt`; // micro-ppm (parties par trillion)
    } else {
        formatted = `${fraction.toExponential(3)} (fraction)`;
    }

    return {
        ppm: ppm,
        fraction: fraction,
        percent: percent,
        ppb: ppb,
        formatted: formatted,
        // Formatage détaillé
        formattedPPM: `${ppm.toFixed(2)} ppm`,
        formattedPercent: `${percent.toFixed(6)}%`,
        formattedFraction: `${fraction.toExponential(3)}`
    };
}

/**
 * Convertit une fraction molaire en ppm
 * @param {number} fraction - Fraction molaire (0 à 1)
 * @returns {number} Valeur en ppm
 */
function fractionToPPM(fraction) {
    return fraction * 1e6;
}

/**
 * Convertit les ppm en pourcentage
 * @param {number} ppm - Valeur en ppm
 * @returns {number} Pourcentage (%)
 */
function ppmToPercent(ppm) {
    return ppm * 0.0001; // 1 ppm = 0.0001%
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.simulationState = simulationState;
    window.convertPPM = convertPPM;
    window.fractionToPPM = fractionToPPM;
    window.ppmToPercent = ppmToPercent;
}

/**
 * Calcule la hauteur de la tropopause en fonction de la température de surface
 * La tropopause dépend de T0 : plus T0 est élevé, plus la tropopause est haute
 * Formule empirique : z_trop ≈ 11 km pour T0 = 288K, avec variation de ~0.1 km/K
 * @param {number} T0 - Température de surface en Kelvin
 * @returns {number} Hauteur de la tropopause en mètres
 */
function calculateTropopauseHeight(T0) {
    // Tropopause standard : dépend de T0 et de la gravité
    // Formule physique approximative : z_trop ≈ R * T / (g * M) * constante_structure
    // Mais on garde l'approche empirique paramétrable

    let z_trop_standard = 11000; // 11 km par défaut (Terre)
    let T0_standard = 288; // 288K par défaut
    let sensitivity = 100; // 100 m/K

    // Récupérer les paramètres de l'époque si disponibles
    if (typeof window !== 'undefined' && window.currentEpochName) {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            // Ajuster selon la gravité (plus g est fort, plus l'atmosphère est tassée)
            // z_trop ~ 1/g
            const g_earth = 9.81;
            const g_current = currentEpoch.gravity || g_earth;

            if (g_current > 0) {
                z_trop_standard = z_trop_standard * (g_earth / g_current);
            }

            // On pourrait ajouter d'autres paramètres ici si définis dans l'époque
        }
    }

    let z_trop = z_trop_standard + (T0 - T0_standard) * sensitivity;

    // Limites physiques (ajustées selon la gravité aussi potentiellement, mais gardons simple)
    // Élargir les bornes pour permettre des atmosphères différentes
    z_trop = Math.max(5000, Math.min(30000, z_trop));

    return z_trop;
}

function temperature(z, CO2_fraction = null, T0_override = null) {
    // Utiliser T0_override si fourni (pour la dichotomie), sinon utiliser la globale
    let T0;
    if (T0_override !== null) {
        T0 = T0_override;
    } else if (current_T0_adjusted !== null) {
        T0 = current_T0_adjusted;
    } else {
        // Calculer T0 à partir des formules (valeur initiale)
        const co2_frac = CO2_fraction !== null ? CO2_fraction : current_CO2_fraction_for_temp;
        // Utiliser un albedo de base pour l'initialisation (sans glace ni nuages)
        // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
        const cellH2O_temp = typeof document !== 'undefined' ? document.getElementById('cell-h2o') : null;
        const h2o_enabled_temp = cellH2O_temp && cellH2O_temp.classList.contains('checked');
        const STEFAN_BOLTZMANN = window.STEFAN_BOLTZMANN || 5.670374419e-8;
        const T0_no_greenhouse = Math.pow(calculateSolarFluxAbsorbed(255, false) / STEFAN_BOLTZMANN, 0.25);

        if (co2_frac === 0 || co2_frac === null) {
            T0 = T0_no_greenhouse;
        } else {
            const CO2_ref = 1e-6;
            const forcing_CO2 = 5.35 * Math.log(Math.max(co2_frac, CO2_ref) / CO2_ref);
            const climate_sensitivity = 0.8;
            const delta_T_greenhouse = climate_sensitivity * forcing_CO2;
            T0 = T0_no_greenhouse + delta_T_greenhouse;
        }
    }

    // Calculer la tropopause dynamiquement en fonction de T0
    const z_trop = calculateTropopauseHeight(T0);

    // Gradient de température (Lapse Rate)
    // Terre standard : -6.5 K/km
    // Dépend de la composition (humide vs sec) et de la gravité
    // Γ = g / cp (adiabatique sec), réduit par la condensation
    let Gamma = -0.0065; // Valeur par défaut

    if (typeof window !== 'undefined' && window.currentEpochName) {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            // Si un lapse rate spécifique est défini
            if (typeof currentEpoch.lapse_rate === 'number') {
                Gamma = currentEpoch.lapse_rate;
            } else if (currentEpoch.gravity) {
                // Ajustement proportionnel à la gravité (Γ ~ g)
                // Si g double, le gradient double (l'air se refroidit plus vite en montant)
                Gamma = -0.0065 * (currentEpoch.gravity / 9.81);
            }
        }
    }

    const T_trop = T0 + Gamma * z_trop;

    if (z < z_trop) {
        return T0 + Gamma * z;
    } else {
        return T_trop;
    }
}

// Exposer la fonction de calcul de tropopause globalement
if (typeof window !== 'undefined') {
    window.calculateTropopauseHeight = calculateTropopauseHeight;
}

function airNumberDensity(z, CO2_fraction = null, T0_override = null, params = null) {
    const BOLTZMANN_KB = window.BOLTZMANN_KB || 1.380649e-23;
    return pressure(z, params) / (BOLTZMANN_KB * temperature(z, CO2_fraction, T0_override));
}

// ============================================================================
// ABSORPTION CO2
// ============================================================================

function crossSectionCO2(wavelength) {
    const LAMBDA_0 = 15.0e-6;  // Centre de bande, m
    const exponent = -22.5 - 24 * Math.abs((wavelength - LAMBDA_0) / LAMBDA_0);
    return Math.pow(10, exponent);
}

// ============================================================================
// VAPEUR D'EAU (H2O)
// ============================================================================

// Profil de mixing ratio de vapeur d'eau (fraction molaire)
// Formule simplifiée basée sur l'altitude uniquement (approximation)
/**
 * Calcule le ratio de mélange de la vapeur d'eau (fraction molaire)
 * 
 * ⚠️ IMPORTANT : Cette fonction calcule la VAPEUR D'EAU (gaz), pas les nuages ⚠️
 * 
 * La vapeur d'eau est l'eau sous forme gazeuse dans l'atmosphère.
 * - Au niveau de la mer : ~1.5% de l'air est de la vapeur d'eau
 * - Cette vapeur absorbe le rayonnement IR (effet de serre)
 * - Les nuages sont calculés séparément via calculateCloudCoverage()
 * 
 * @param {number} z - Altitude en mètres
 * @returns {number} Ratio de mélange (fraction molaire, 0 à 1)
 */
function waterVaporMixingRatio(z, r0_override = null) {
    let r0 = r0_override;
    if (r0 === null) {
        // Essayer de récupérer depuis la variable globale
        if (typeof window !== 'undefined' && window.h2oVaporPercent !== undefined) {
            r0 = window.h2oVaporPercent / 100;
        } else {
            r0 = 0.015;  // Fallback: ~1.5% (conditions modernes)
        }
    }

    // Échelle de hauteur de la vapeur d'eau (H_H2O)
    // La vapeur d'eau décroît beaucoup plus vite que l'air (H_air ≈ 8.5 km vs H_H2O ≈ 2-2.5 km)
    // Cela dépend de la température (Clausius-Clapeyron)
    // Pour l'instant on garde 2500m comme approximation standard
    const H_H2O = 2500;

    return r0 * Math.exp(-z / H_H2O);
}

// Section efficace d'absorption H2O (approximation)
// H2O absorbe dans plusieurs bandes IR, principalement autour de 6-7 μm et 15-20 μm
function crossSectionH2O(wavelength) {
    // Bande principale autour de 6.3 μm
    const LAMBDA_1 = 6.3e-6;
    // Bande secondaire autour de 15-20 μm (recouvre partiellement CO2)
    const LAMBDA_2 = 17.0e-6;

    // Absorption dans les deux bandes
    const sigma1 = Math.pow(10, -20 - 15 * Math.abs((wavelength - LAMBDA_1) / LAMBDA_1));
    const sigma2 = Math.pow(10, -21 - 18 * Math.abs((wavelength - LAMBDA_2) / LAMBDA_2));

    // Prendre le maximum (les bandes peuvent se chevaucher)
    return Math.max(sigma1, sigma2);
}

// Densité numérique de H2O
// 🔄 MODIFIÉ : Utilise maintenant calculateWaterPartition pour déterminer la vapeur selon la température
function waterVaporNumberDensity(z, CO2_fraction = null, T0_override = null, params = null) {
    // Vérifier si H2O est activé (via variable globale ou window)
    const enabled = (typeof window !== 'undefined' && window.waterVaporEnabled !== undefined)
        ? window.waterVaporEnabled
        : waterVaporEnabled;
    if (!enabled) return 0;

    // Récupérer la température de surface (T0_override ou valeur globale)
    const T0 = T0_override !== null ? T0_override :
        (typeof window !== 'undefined' && window.current_T0_adjusted !== undefined ? window.current_T0_adjusted : null);

    // Si pas de température disponible, utiliser l'ancienne méthode (valeur fixe)
    if (T0 === null || !isFinite(T0) || T0 <= 0) {
        const n_air = airNumberDensity(z, CO2_fraction, T0_override, params);

        // Récupérer la quantité d'eau globale pour le mixing ratio
        let h2o_percent = 1.5; // Défaut 1.5%
        if (typeof window !== 'undefined' && window.h2oVaporPercent !== undefined) {
            h2o_percent = window.h2oVaporPercent + window.h2oTotalFromMeteorites;
        }

        const mixing_ratio = waterVaporMixingRatio(z, h2o_percent / 100);
        return n_air * mixing_ratio;
    }

    // Récupérer l'eau totale disponible (base + météorites)
    const h2o_base = (typeof window !== 'undefined' && window.h2oVaporPercent !== undefined)
        ? window.h2oVaporPercent : 0;
    const h2o_from_meteorites = (typeof window !== 'undefined' && window.h2oTotalFromMeteorites !== undefined)
        ? window.h2oTotalFromMeteorites : 0;
    const h2o_total_percent = h2o_base + h2o_from_meteorites;

    if (h2o_total_percent <= 0) return 0;

    // Récupérer les paramètres de l'époque courante (ou utiliser params si fournis)
    let epochParams = params;
    // Si params n'est pas fourni, on tente de récupérer de window (fallback)
    if (!params && typeof window !== 'undefined' && window.currentEpochName) {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            // Calculer pressure_atm et molar_mass_air depuis les composants
            const pressure_atm = window.calculatePressureAtm(currentEpoch);
            const molar_mass_air = window.calculateMolarMassAir(currentEpoch);
            
            epochParams = {
                pressure_atm: pressure_atm,
                molar_mass_air: molar_mass_air,
                gravity: currentEpoch.gravity,
                ocean_coverage: currentEpoch.ocean_coverage
            };
        }
    }

    // Calculer la répartition vapeur/liquide/glace selon la température
    if (typeof window !== 'undefined' && typeof window.calculateWaterPartition === 'function') {
        const h2o_total_fraction = h2o_total_percent / 100;
        const waterPartition = window.calculateWaterPartition(T0, h2o_total_fraction, epochParams);
        const vapor_fraction = waterPartition.vapor_fraction;

        // Calculer la densité numérique de vapeur d'eau
        // n_H2O = n_air * vapor_fraction (fraction molaire de vapeur)
        const n_air = airNumberDensity(z, CO2_fraction, T0_override, params);

        // Ajuster la fraction de vapeur selon l'altitude (décroît avec z)
        // Utiliser le même profil que waterVaporMixingRatio pour la distribution verticale
        const H_H2O = 2500; // Échelle de hauteur de la vapeur d'eau (m)
        const altitude_factor = Math.exp(-z / H_H2O);
        const vapor_fraction_at_z = vapor_fraction * altitude_factor;

        return n_air * vapor_fraction_at_z;
    } else {
        // Fallback : utiliser l'ancienne méthode si calculateWaterPartition n'est pas disponible
        const n_air = airNumberDensity(z, CO2_fraction, T0_override, params);
        const mixing_ratio = waterVaporMixingRatio(z);
        return n_air * mixing_ratio;
    }
}

// ============================================================================
// MÉTHANE (CH4)
// ============================================================================

// Section efficace d'absorption CH4 (approximation)
// CH4 absorbe principalement autour de 7.7 μm (bande ν4) et 3.3 μm (bande ν3)
function crossSectionCH4(wavelength) {
    // Bande principale autour de 7.7 μm (ν4)
    const LAMBDA_1 = 7.7e-6;
    // Bande secondaire autour de 3.3 μm (ν3)
    const LAMBDA_2 = 3.3e-6;

    // Absorption dans les deux bandes
    // CH4 a une section efficace similaire à H2O mais centrée sur 7.7 μm
    const sigma1 = Math.pow(10, -20 - 16 * Math.abs((wavelength - LAMBDA_1) / LAMBDA_1));
    const sigma2 = Math.pow(10, -21 - 17 * Math.abs((wavelength - LAMBDA_2) / LAMBDA_2));

    // Prendre le maximum (les bandes peuvent se chevaucher)
    return Math.max(sigma1, sigma2);
}

// Densité numérique de CH4
// CH4 est un gaz bien mélangé dans l'atmosphère (comme CO2), pas de profil vertical complexe
function methaneNumberDensity(z, CH4_fraction = null, CO2_fraction = null, T0_override = null, params = null) {
    // Vérifier si CH4 est activé (via variable globale ou window)
    const enabled = (typeof window !== 'undefined' && window.methaneEnabled !== undefined)
        ? window.methaneEnabled
        : (typeof methaneEnabled !== 'undefined' ? methaneEnabled : false);
    if (!enabled || !CH4_fraction) return 0;

    // CH4 est bien mélangé, donc la fraction est constante avec l'altitude
    // (contrairement à H2O qui décroît avec l'altitude)
    const n_air = airNumberDensity(z, CO2_fraction, T0_override, params);
    return n_air * CH4_fraction;
}

// Évaporation/précipitation (formule simplifiée)
// Taux d'évaporation approximatif en fonction de la température de surface
function evaporationRate(T_surface) {
    // Formule empirique simplifiée : E ∝ exp(T/constante)
    // Plus la température est élevée, plus l'évaporation est importante
    const E0 = 0.001; // Taux de base (m/s)
    const T_ref = 288; // Température de référence (K)
    return E0 * Math.exp((T_surface - T_ref) / 20); // Facteur 20 K pour la sensibilité
}

// Transport de vapeur d'eau (profil basé sur la pression)
// Le transport vertical est modélisé par un profil exponentiel
function waterVaporTransport(z) {
    // Le transport diminue avec l'altitude (moins de vapeur en altitude)
    // Utilise le même profil que le mixing ratio
    return waterVaporMixingRatio(z);
}

// ============================================================================
// SIMULATION DU TRANSFERT RADIATIF
// ============================================================================

// ⚡ OPTIMISATION : Calculer le facteur de précision adaptatif selon le FPS
// 🔒 Cette fonction est maintenant contrôlée par l'événement fpsLevelChanged
function getPrecisionFactorFromFPS() {
    // Utiliser window.fpsLevel si disponible (défini par l'événement FPS)
    if (typeof window !== 'undefined' && window.fpsLevel && window.fpsPrecisionFactor !== undefined) {
        return window.fpsPrecisionFactor;
    }
    
    // Fallback : calculer selon l'ancienne logique
    const FPSalert = 25;
    const FPSmin = 20;
    const FPSmax = 55;
    const currentFPS = (typeof window !== 'undefined' && window.fps) ? window.fps : 60;

    if (currentFPS < FPSmin) {
        return 0.5;
    } else if (currentFPS > FPSmax) {
        return 2.0;
    } else if (currentFPS < FPSalert) {
        return 0.75;
    }

    return 1.0;
}

// Exposer la fonction globalement pour l'affichage FPS
if (typeof window !== 'undefined') {
    window.getPrecisionFactorFromFPS = getPrecisionFactorFromFPS;
}

// Fonction pour log Delta équilibre
function logDeltaEquilibre(delta_equilibre, T0_current, T_effective, delta_eds, tolerance_current, tolerance_status) {
    console.log(`🌡️ Delta équilibre (→0): ${delta_equilibre.toFixed(4)} W/m² | T° sol: ${T0_current.toFixed(2)}K (${(T0_current - 273.15).toFixed(1)}°C) | T° corps noir: ${T_effective.toFixed(2)}K (${(T_effective - 273.15).toFixed(1)}°C) | Delta EDS: ${delta_eds.toFixed(4)} W/m² | Tolérance: ${tolerance_current.toFixed(2)} W/m² ${tolerance_status}`);
}

// Fonction interne pour calculer le flux total sortant pour une T0 donnée
// Fonction de logging centralisée pour les phases de calcul
function logCalculationPhase(phase, data) {
    if (typeof window === 'undefined' || !window.console) return;

    // Ne garder que les phases importantes : DICHOTOMIE START, DICHOTOMIE ITER, DICHOTOMIE CONVERGENCE
    const importantPhases = ['DICHOTOMIE START', 'DICHOTOMIE ITER', 'DICHOTOMIE CONVERGENCE'];
    const isImportantPhase = importantPhases.some(important => phase.includes(important));
    
    if (!isImportantPhase) {
        return; // Ne pas afficher les autres phases
    }

    // Afficher uniquement T0 pour les phases importantes
    if (phase.includes('DICHOTOMIE START')) {
        // Log supprimé : redondant avec T0_initial_config qui affiche déjà la température
    } else if (phase.includes('DICHOTOMIE ITER')) {
        // Log supprimé : redondant avec le log delta aire qui affiche déjà la température
    } else if (phase.includes('DICHOTOMIE CONVERGENCE')) {
        const T0_final = data?.T0_final || 'N/A';
        console.log(`✅ Convergence: T° = ${T0_final}K (${(parseFloat(T0_final) - 273.15).toFixed(1)}°C)`);
    }
}

// Exposer globalement pour utilisation dans main.js
if (typeof window !== 'undefined') {
    window.logCalculationPhase = logCalculationPhase;
}

function calculateFluxForT0(CO2_fraction, T0_test, options) {
    
    // fullSpectre=false : utilise un regroupement adaptatif des longueurs d'onde pour optimiser les calculs (plus rapide)
    // fullSpectre=true : utilise le spectre complet sans regroupement (plus précis mais plus lent)
    // Note: actuellement forcé à true dans le code (forceFullSpectre), donc toujours spectre complet
    // Log supprimé : affichage uniquement du mode (dichotomie/exponentielle) dans la boucle principale
    // const co2_ppm = (CO2_fraction * 1e6).toFixed(0);
    // const ch4_ppm = ((options?.CH4_fraction || 0) * 1e6).toFixed(0);
    // const fullSpectre_emoji = (options?.fullSpectre || false) ? '🌈' : '⚡';
    // console.log(`${LOGO_EDS} [calculateFluxForT0@calculations.js] 🏭 ${co2_ppm}ppm ${LOGO_TEMP} ${T0_test?.toFixed(2) || 'N/A'}K ⛽ ${ch4_ppm}ppm ${fullSpectre_emoji}`);

    const {
        z_max, // ⚡ Plus de valeur par défaut (120000), doit être fourni ou calculé
        delta_z = 50,
        lambda_min = 0.1e-6,
        lambda_max = 100e-6,
        delta_lambda = 0.1e-6,
        fullSpectre = false, // ⚡ Si true, désactive les optimisations lambda (spectre complet)
        CH4_fraction = null // Fraction molaire de CH4 (optionnel)
    } = options;

    // ⚡ PRÉCISION ADAPTATIVE : Utiliser la précision selon le FPS
    // 🔒 forceFullSpectre : contrôle si on utilise le spectre complet ou le regroupement adaptatif
    // - true : toujours spectre complet (précision maximale, plus lent)
    // - false : regroupement adaptatif selon FPS (plus rapide, moins précis)
    // - Peut être dynamique selon FPS ou delta_equilibre (à implémenter si nécessaire)
    // Pour l'instant : toujours true pour précision maximale
    const forceFullSpectre = true; // TODO: pourrait être dynamique selon FPS ou delta_equilibre

    // 🔒 Récupérer le facteur de précision depuis le FPS (pour l'échantillonnage atmosphère)
    // 🔒 IMPORTANT : precisionFactor contrôle la taille des échantillons (delta_z_stratosphere), pas la convergence
    // - tolerance : seuil de convergence pour delta_equilibre (flux_sortant - flux_entrant) en W/m²
    // - precisionFactor : facteur d'échantillonnage atmosphère (delta_z_stratosphere) contrôlé par FPS
    // precisionFactor < 1.0 : réduire la précision (augmenter delta_z_stratosphere) pour aller plus vite
    // precisionFactor = 1.0 : précision standard
    // precisionFactor > 1.0 : augmenter la précision (réduire delta_z_stratosphere) pour plus de détails
    let precisionFactor = 1.0;
    if (typeof window !== 'undefined' && typeof getPrecisionFactorFromFPS === 'function') {
        precisionFactor = getPrecisionFactorFromFPS();
    }

    // Ajuster delta_z et delta_lambda (toujours à la valeur de base, pas de réduction)
    // Note : delta_z sous tropopause reste constant (pas d'optimisation)
    const final_delta_lambda = delta_lambda; // Toujours utiliser delta_lambda de base (précision maximale)

    // ⚡ OPTIMISATION : Créer les grilles avec précision adaptative
    // Pour lambda : regrouper en plages de moyennes pour accélérer
    // Pour z : précision fine sous tropopause, grossière au-dessus

    // Récupérer la hauteur max de l'atmosphère dynamique (ex: 600km pour Hadéen)
    let total_mass; // Pas de valeur par défaut, doit être fourni par l'époque
    let dynamic_z_max = z_max; // Initialisé avec l'option passée (peut être undefined)
    let gravity_val; // Sera récupéré de l'époque
    let planet_radius_val; // Sera récupéré de l'époque
    let molar_mass_val; // Sera récupéré de l'époque
    let physParams = null; // Objet regroupant les paramètres physiques pour les helpers

    // Priorité 1 : Utiliser physParams depuis options si fourni (pour test_computeRadiativeTransfer.html)
    if (options?.physParams !== undefined) {
        physParams = options.physParams;
        total_mass = physParams.total_atmosphere_mass_kg;
    }
    
    // Priorité 1b : Utiliser les paramètres passés dans options (pour test_computeRadiativeTransfer.html)
    if (options?.total_atmosphere_mass_kg !== undefined && total_mass === undefined) {
        total_mass = options.total_atmosphere_mass_kg;
    }
    if (options?.z_max !== undefined) {
        dynamic_z_max = options.z_max; // Utiliser z_max depuis options en priorité
    }
    
    // Si on a total_mass depuis options, essayer de créer physParams depuis window.epoch
    if (total_mass !== undefined && physParams === null && typeof window !== 'undefined' && window.epoch) {
        gravity_val = window.epoch.gravity;
        planet_radius_val = window.epoch.planet_radius;
        molar_mass_val = window.calculateMolarMassAir(window.epoch);
        
        // Calculer la pression atmosphérique
        const pressure_atm_val = window.calculatePressureAtm(window.epoch);
        
        // Créer physParams
        physParams = {
            total_atmosphere_mass_kg: total_mass,
            gravity: gravity_val,
            planet_radius: planet_radius_val,
            molar_mass_air: molar_mass_val,
            temperature_K: T0_test,
            pressure_atm: pressure_atm_val,
            ocean_coverage: window.epoch.ocean_coverage
        };
    }

    // Priorité 2 : Utiliser window.epoch si disponible (pour test_computeRadiativeTransfer.html)
    if (typeof window !== 'undefined' && window.epoch && total_mass === undefined) {
        total_mass = window.epoch['⚖️🌬'];
        if (window.epoch['🍎'] !== undefined) gravity_val = window.epoch['🍎'];
        // Convertir le rayon de km en mètres pour les calculs
        if (window.epoch['📐'] !== undefined) planet_radius_val = window.epoch['📐'] * 1000;
        molar_mass_val = window.calculateMolarMassAir(window.epoch);
        
        // Calculer la pression atmosphérique
        const pressure_atm_val = window.calculatePressureAtm(window.epoch);
        
        // Créer physParams pour window.epoch
        physParams = {
            total_atmosphere_mass_kg: total_mass,
            gravity: gravity_val,
            planet_radius: planet_radius_val,
            molar_mass_air: molar_mass_val,
            temperature_K: T0_test,
            pressure_atm: pressure_atm_val,
            ocean_coverage: window.epoch.ocean_coverage
        };
    }

    // Priorité 3 : Utiliser window.configOrganigramme et window.currentEpochName (pour index.html)
    if (typeof window !== 'undefined' && window.configOrganigramme && window.currentEpochName && total_mass === undefined) {
        const currentEpoch = window.configOrganigramme.timeline.find(e => e.name === window.currentEpochName);
        if (currentEpoch) {
            // Récupération stricte : si undefined, on laisse undefined (ce qui provoquera une erreur plus loin)
            // Sauf si on veut explicitement autoriser 0 (Corps Noir)
            if (currentEpoch['⚖️🌬'] !== undefined) {
                total_mass = currentEpoch['⚖️🌬'];
            } else {
                console.error(`[calculateFluxForT0] ❌ ERREUR : 'total_atmosphere_mass_kg' manquant dans l'époque '${window.currentEpochName}'`);
            }

            // Récupération gravity, radius et masse molaire
            if (currentEpoch['🍎'] !== undefined) gravity_val = currentEpoch['🍎'];
            // Convertir le rayon de km en mètres pour les calculs
            if (currentEpoch['📐'] !== undefined) planet_radius_val = currentEpoch['📐'] * 1000;
            // Calculer molar_mass_air depuis les composants si non défini
            molar_mass_val = window.calculateMolarMassAir(currentEpoch);

            // Calculer la pression atmosphérique depuis les composants
            const pressure_atm_val = window.calculatePressureAtm(currentEpoch);

            // Création de l'objet params pour les helpers
            physParams = {
                total_atmosphere_mass_kg: total_mass,
                gravity: gravity_val,
                planet_radius: planet_radius_val,
                molar_mass_air: molar_mass_val,
                temperature_K: T0_test,
                pressure_atm: pressure_atm_val,
                ocean_coverage: currentEpoch.ocean_coverage
            };

            // Utiliser la nouvelle fonction centralisée dans calculations_atm.js
            if (total_mass !== undefined) {
                // Passer T0_test pour avoir une hauteur d'atmosphère cohérente avec la température testée
                const props = window.calculateAtmosphereProperties(total_mass, T0_test, molar_mass_val, gravity_val); // gravity passed explicitement
                dynamic_z_max = props.z_max;

                if (props.is_massive) {
                }
            }
        }
    }
    
    // Si z_max n'est toujours pas défini mais que total_mass est disponible, le calculer
    if (dynamic_z_max === undefined && total_mass !== undefined) {
        // Utiliser window.epoch ou window.currentEpochName pour récupérer les paramètres physiques
        let epoch_for_calc = null;
        if (typeof window !== 'undefined' && window.epoch) {
            epoch_for_calc = window.epoch;
        } else if (typeof window !== 'undefined' && window.configOrganigramme && window.currentEpochName) {
            epoch_for_calc = window.configOrganigramme.timeline.find(e => e.name === window.currentEpochName);
        }
        
        if (epoch_for_calc && typeof window !== 'undefined') {
            const temp_gravity = gravity_val || epoch_for_calc.gravity;
            const temp_molar_mass = molar_mass_val || window.calculateMolarMassAir(epoch_for_calc);
            if (temp_gravity !== undefined && temp_molar_mass !== undefined) {
                const props = window.calculateAtmosphereProperties(total_mass, T0_test, temp_molar_mass, temp_gravity);
                dynamic_z_max = props.z_max;
            }
        }
    }

    // 🚨 VALIDATION CRITIQUE : Si z_max n'est toujours pas défini, on arrête tout.
    // Pas de valeur par défaut silencieuse qui cache des bugs.
    if (dynamic_z_max === undefined || dynamic_z_max === null || isNaN(dynamic_z_max)) {
        console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE : Hauteur d'atmosphère (z_max) indéterminée. total_mass=${total_mass}, z_max_option=${z_max}`);
        return null;
    }
    
    // 🚨 VALIDATION CRITIQUE : Si physParams n'est pas défini, on arrête tout.
    // physParams est requis pour pressure() et airNumberDensity()
    if (physParams === null || physParams.temperature_K === undefined) {
        // Si physParams n'est pas défini mais qu'on a les paramètres de base, le créer
        if (total_mass !== undefined && typeof window !== 'undefined' && window.TIMELINE && window.DATA) {
            const DATA = window.DATA;
            const epochId = DATA['📜']['🗿'];
            const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
            const EPOCH = window.TIMELINE[epochIndex];
            physParams = {
                total_atmosphere_mass_kg: total_mass || 0,
                gravity: EPOCH['🍎'],
                planet_radius: EPOCH['📐'] * 1000,
                molar_mass_air: window.DATA && window.DATA['🌬'] ? window.DATA['🌬']['🧪'] : 0.029,
                temperature_K: T0_test,
                pressure_atm: window.DATA && window.DATA['🌬'] ? window.DATA['🌬']['🎈'] : 0,
                ocean_coverage: window.DATA && window.DATA['💧'] ? window.DATA['💧']['🍰💧🌊'] : 0
            };
        } else {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE : physParams non défini ou temperature_K manquant. total_mass=${total_mass}, epoch=${typeof window !== 'undefined' && window.epoch ? window.epoch.id : 'unknown'}`);
            return null;
        }
    }
    
    // S'assurer que total_atmosphere_mass_kg est défini dans physParams (même si 0)
    if (physParams.total_atmosphere_mass_kg === undefined) {
        physParams.total_atmosphere_mass_kg = total_mass !== undefined ? total_mass : 0;
    }
    
    // S'assurer que total_mass est défini (même si 0) pour éviter les erreurs
    if (total_mass === undefined) {
        total_mass = physParams.total_atmosphere_mass_kg || 0;
    }
    
    // Exposer physParams globalement pour que pressure() et airNumberDensity() puissent y accéder
    // IMPORTANT : Exposer AVANT tout appel à pressure() ou airNumberDensity()
    if (typeof window !== 'undefined') {
        window._currentPhysParams = physParams;
    }

    // Calculer la tropopause pour déterminer les zones de précision
    const z_trop_precalc = calculateTropopauseHeight(T0_test);

    // Créer la grille lambda avec regroupement adaptatif (sauf si fullSpectre)
    const lambda_range = [];
    const lambda_weights = []; // Poids pour les moyennes pondérées

    // ⚡ FORCER fullSpectre pour précision maximale (pas de regroupement)
    const useFullSpectre = fullSpectre || forceFullSpectre;

    if (useFullSpectre) {
        // ⚡ Dernière itération : spectre complet sans optimisation
        // Calculer le nombre exact d'éléments : (lambda_max - lambda_min) / delta_lambda + 1
        // Exemple : de 0.1e-6 à 100e-6 avec pas 0.1e-6 = (100-0.1)/0.1 + 1 = 999 + 1 = 1000 points
        const expected_points = Math.floor((lambda_max - lambda_min) / delta_lambda) + 1;
        
        // Créer exactement le bon nombre de points, en forçant lambda_max comme dernier élément
        for (let i = 0; i < expected_points; i++) {
            let lambda;
            if (i === expected_points - 1) {
                // Dernier élément : forcer lambda_max exactement pour éviter les erreurs d'arrondi
                lambda = lambda_max;
            } else {
                // Autres éléments : calcul normal
                lambda = lambda_min + i * delta_lambda;
            }
            lambda_range.push(lambda);
            lambda_weights.push(1.0); // Poids unitaire pour tous
        }
        
        // Vérification finale
        if (lambda_range.length !== expected_points) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE: lambda_range.length (${lambda_range.length}) != expected (${expected_points})`);
            throw new Error(`lambda_range.length (${lambda_range.length}) != expected (${expected_points})`);
        }
        if (Math.abs(lambda_range[lambda_range.length - 1] - lambda_max) > delta_lambda * 0.0001) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE: dernier élément (${lambda_range[lambda_range.length - 1]}) != lambda_max (${lambda_max})`);
            throw new Error(`Dernier élément lambda_range != lambda_max`);
        }
        
        // Log pour debug
    } else {
        // Optimisation : regroupement adaptatif (sans ajustement FPS, précision maximale)
        // Zone critique : 10-20 μm (bande CO₂) - haute précision
        const lambda_critical_min = 10e-6;
        const lambda_critical_max = 20e-6;
        const delta_lambda_critical = final_delta_lambda; // Précision maximale dans la bande CO₂

        // Zones non-critiques : précision réduite (moyennes sur plages) mais avec précision maximale
        const delta_lambda_coarse = final_delta_lambda * 10; // Regroupement fixe (10x) pour zones non-critiques

        for (let lambda = lambda_min; lambda < lambda_max;) {
            if (lambda >= lambda_critical_min && lambda < lambda_critical_max) {
                // Zone critique (10-20 μm) : précision fine
                lambda_range.push(lambda);
                lambda_weights.push(1.0); // Poids unitaire
                lambda += delta_lambda_critical;
            } else {
                // Zone non-critique : moyenne sur une plage
                const lambda_start = lambda;
                let lambda_end = lambda + delta_lambda_coarse;

                // Ne pas dépasser la zone critique si on est avant
                if (lambda < lambda_critical_min && lambda_end > lambda_critical_min) {
                    lambda_end = lambda_critical_min;
                }
                // Ne pas dépasser lambda_max
                if (lambda_end > lambda_max) {
                    lambda_end = lambda_max;
                }
                // Si on est après la zone critique, continuer normalement
                if (lambda >= lambda_critical_max && lambda_end > lambda_critical_max) {
                    // OK, on continue
                }

                const lambda_mid = (lambda_start + lambda_end) / 2;
                lambda_range.push(lambda_mid);
                lambda_weights.push((lambda_end - lambda_start) / delta_lambda); // Poids = nombre de points regroupés
                lambda = lambda_end;

                // Arrêter si on a atteint lambda_max
                if (lambda >= lambda_max) {
                    break;
                }
            }
        }
    }

    // Créer la grille z avec précision adaptative
    // ⚠️ IMPORTANT : Sous tropopause, on garde la précision fine (pas d'optimisation)
    // Au-dessus de la tropopause, on peut réduire la précision (densité ↓ exponentielle)
    const z_range = [];
    const delta_z_troposphere = delta_z; // Précision fine sous tropopause (50m) - PAS D'OPTIMISATION

    // Au-dessus de la tropopause : précision adaptative selon precisionFactor
    // precisionFactor < 1.0 → delta_z_stratosphere plus grand (moins de points, plus rapide)
    // precisionFactor = 1.0 → delta_z_stratosphere standard (250m)
    // precisionFactor > 1.0 → delta_z_stratosphere plus petit (plus de points, plus précis)
    // Formule : delta_z_stratosphere = (delta_z * 5) / precisionFactor
    // Exemples :
    //   - precisionFactor = 0.5 → delta_z_stratosphere = delta_z * 10 (500m, moins précis, plus rapide)
    //   - precisionFactor = 1.0 → delta_z_stratosphere = delta_z * 5 (250m, standard)
    //   - precisionFactor = 2.0 → delta_z_stratosphere = delta_z * 2.5 (125m, plus précis, plus lent)
    const delta_z_stratosphere = (delta_z * 5) / precisionFactor;

    // AJUSTEMENT HADÉEN : Si on va jusqu'à 600km, on doit augmenter le pas dans la haute atmosphère 
    // sinon on aura trop de couches (600000 / 250 = 2400 couches ! trop lent)
    // Stratégie : garder 250m jusqu'à 120km, puis augmenter fortement au-delà
    const delta_z_exosphere = (dynamic_z_max > 120000) ? 5000 : delta_z_stratosphere; // 5km pas au-delà de 120km

    // Sous tropopause : précision fine (delta_z constant = 50m)
    for (let z = 0; z < z_trop_precalc; z += delta_z_troposphere) {
        z_range.push(z);
    }

    // S'assurer que la tropopause est incluse
    if (z_range[z_range.length - 1] < z_trop_precalc) {
        z_range.push(z_trop_precalc);
    }

    // Au-dessus de la tropopause jusqu'à 120km : précision moyenne (250m)
    const limit_std_atmosphere = 120000;
    let current_z_max_loop = Math.min(dynamic_z_max, limit_std_atmosphere);

    // Au-dessus de la tropopause : précision grossière (delta_z * 5 = 250m)
    for (let z = z_trop_precalc + delta_z_stratosphere; z < current_z_max_loop; z += delta_z_stratosphere) {
        z_range.push(z);
    }

    // Si atmosphère massive, continuer au-delà de 120km avec un pas plus grand
    if (dynamic_z_max > limit_std_atmosphere) {
        // S'assurer d'inclure la limite 120km
        if (z_range[z_range.length - 1] < limit_std_atmosphere) {
            z_range.push(limit_std_atmosphere);
        }

        for (let z = limit_std_atmosphere + delta_z_exosphere; z < dynamic_z_max; z += delta_z_exosphere) {
            z_range.push(z);
        }
    }

    // S'assurer que z_max est inclus
    if (z_range[z_range.length - 1] < dynamic_z_max) {
        z_range.push(dynamic_z_max);
    }

    // ⚠️ IMPORTANT : S'assurer que lambda_range est complètement construit avant de créer upward_flux
    // Vérifier la cohérence des longueurs
    if (lambda_range.length !== lambda_weights.length) {
        console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE : Longueurs incompatibles - lambda_range: ${lambda_range.length}, lambda_weights: ${lambda_weights.length}`);
        throw new Error(`Longueurs incompatibles : lambda_range (${lambda_range.length}) != lambda_weights (${lambda_weights.length})`);
    }

    // Initialiser les tableaux avec la longueur finale de lambda_range
    const final_lambda_length = lambda_range.length;
    const num_couches = z_range.length;
    const num_plages_spectre = final_lambda_length;
    const total_cases = num_couches * num_plages_spectre;
    
    const upward_flux = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));
    const optical_thickness = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));
    const emitted_flux = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));
    const absorbed_flux = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));

    // Log du calcul spectral
    console.log(`📊 [calculateFluxForT0@calculations.js] Calcul spectral:`);
    console.log(`   Nombre de couches atmosphériques: ${num_couches}`);
    console.log(`   Nombre de plages spectrales: ${num_plages_spectre}`);
    console.log(`   Produit (cases calculées): ${total_cases}`);

    // Condition limite : flux émis par la surface avec T0_test
    // ⚡ OPTIMISATION : Tenir compte des poids lambda pour les plages regroupées
    if (lambda_range.length !== lambda_weights.length) {
        console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE avant earth_flux: lambda_range.length (${lambda_range.length}) != lambda_weights.length (${lambda_weights.length})`);
        throw new Error(`Longueurs incompatibles avant earth_flux: lambda_range (${lambda_range.length}) != lambda_weights (${lambda_weights.length})`);
    }
    const earth_flux = lambda_range.map((lambda, idx) => {
        if (lambda_weights[idx] === undefined) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE: lambda_weights[${idx}] manquant pour lambda_range[${idx}] = ${lambda}`);
            throw new Error(`lambda_weights[${idx}] requis`);
        }
        return Math.PI * localPlanckFunction(lambda, T0_test) * delta_lambda * lambda_weights[idx];
    });

    // Log supprimé (non essentiel)

    // Debug: analyser l'émission dans la zone < 9 microns
    const lambda_9um = 9e-6; // 9 microns en mètres
    const flux_below_9um = earth_flux.filter((flux, idx) => lambda_range[idx] < lambda_9um).reduce((sum, f) => sum + f, 0);
    const flux_total = earth_flux.reduce((sum, f) => sum + f, 0);

    // ⚡ OPTIMISATION : Calculer tropopause une seule fois
    const z_trop = calculateTropopauseHeight(T0_test);
    const Gamma = -0.0065; // Gradient de température, K/m

    const T_trop = T0_test + Gamma * z_trop;

    // Trouver l'index de la tropopause dans z_range
    let i_trop = z_range.length; // Par défaut, pas de tropopause (tout avant)
    for (let i = 0; i < z_range.length; i++) {
        if (z_range[i] >= z_trop) {
            i_trop = i;
            break;
        }
    }

    // ⚡ OPTIMISATION : Précalculer B_λ(T_trop) pour toutes les λ (après tropopause)
    const planck_trop = lambda_range.map(lambda =>
        localPlanckFunction(lambda, T_trop)
    );

    // ⚡ OPTIMISATION : Précalculer les sections efficaces (dépendent uniquement de λ)
    const cross_section_CO2 = lambda_range.map(lambda => crossSectionCO2(lambda));
    const cross_section_H2O = lambda_range.map(lambda => crossSectionH2O(lambda));
    const cross_section_CH4 = lambda_range.map(lambda => crossSectionCH4(lambda));

    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const cellH2O = typeof document !== 'undefined' ? document.getElementById('cell-h2o') : null;
    const h2o_enabled = cellH2O && cellH2O.classList.contains('checked');

    const ch4_enabled = (typeof window !== 'undefined' && window.methaneEnabled !== undefined)
        ? window.methaneEnabled
        : (typeof methaneEnabled !== 'undefined' ? methaneEnabled : false);

    // Log supprimé (non essentiel)

    // Vérifier que earth_flux a la bonne longueur
    if (earth_flux.length !== lambda_range.length) {
        console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE: earth_flux.length (${earth_flux.length}) != lambda_range.length (${lambda_range.length})`);
        throw new Error(`Longueurs incompatibles: earth_flux (${earth_flux.length}) != lambda_range (${lambda_range.length})`);
    }
    let flux_in = [...earth_flux];

    // ⚡ OPTIMISATION : Boucle avant tropopause (T varie avec z)
    for (let i = 0; i < i_trop; i++) {
        const z = z_range[i];
        const T = T0_test + Gamma * z; // Calcul direct, sans appel à temperature()
        const n_CO2 = airNumberDensity(z, CO2_fraction, T0_test, physParams) * CO2_fraction;

        // ⚠️ IMPORTANT : Sous tropopause, on garde delta_z constant = 50m (PAS D'OPTIMISATION)
        // On utilise directement delta_z_troposphere, pas de calcul de delta_z_real
        const delta_z_real = delta_z_troposphere;

        // Vérifier que flux_in et upward_flux[i] ont la bonne longueur avant la boucle
        if (flux_in.length !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE dans boucle troposphère i=${i}: flux_in.length (${flux_in.length}) != lambda_range.length (${lambda_range.length})`);
            throw new Error(`Longueurs incompatibles dans boucle troposphère: flux_in (${flux_in.length}) != lambda_range (${lambda_range.length})`);
        }
        if (upward_flux[i].length !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE dans boucle troposphère i=${i}: upward_flux[${i}].length (${upward_flux[i].length}) != lambda_range.length (${lambda_range.length})`);
            throw new Error(`Longueurs incompatibles dans boucle troposphère: upward_flux[${i}] (${upward_flux[i].length}) != lambda_range (${lambda_range.length})`);
        }

        // Calculer pour chaque longueur d'onde
        for (let j = 0; j < lambda_range.length; j++) {
            if (j >= flux_in.length || j >= upward_flux[i].length) {
                console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE troposphère: j=${j}, flux_in.length=${flux_in.length}, upward_flux[${i}].length=${upward_flux[i].length}, lambda_range.length=${lambda_range.length}`);
                throw new Error(`Index j=${j} hors limites`);
            }

            const lambda = lambda_range[j];

            // ⚡ OPTIMISATION : Utiliser les sections efficaces précalculées
            // Absorption CO2
            const kappa_CO2 = cross_section_CO2[j] * n_CO2;

            // Absorption H2O (si activé)
            const n_H2O = h2o_enabled ? waterVaporNumberDensity(z, CO2_fraction, T0_test, physParams) : 0;
            const kappa_H2O = h2o_enabled ? cross_section_H2O[j] * n_H2O : 0;

            // Absorption CH4 (si activé)
            const n_CH4 = (ch4_enabled && CH4_fraction) ? methaneNumberDensity(z, CH4_fraction, CO2_fraction, T0_test, physParams) : 0;
            const kappa_CH4 = (ch4_enabled && CH4_fraction) ? cross_section_CH4[j] * n_CH4 : 0;

            // Debug: analyser l'absorption H2O dans la zone < 9μm (une fois par itération, pour quelques longueurs d'onde clés)
            if (i === 0 && (j === 0 || j === Math.floor(lambda_range.length / 4) || j === Math.floor(lambda_range.length / 2))) {
                const lambda_um = lambda * 1e6;
            }

            // Coefficient d'absorption total (CO2 + H2O + CH4)
            const kappa = kappa_CO2 + kappa_H2O + kappa_CH4;

            optical_thickness[i][j] = kappa * delta_z_real;

            // 🔒 Corps noir = pas d'absorption (CO2=0 ET H2O réellement absent ET CH4 réellement absent)
            // Vérifier les valeurs réelles, pas seulement les boutons
            const has_absorption = (CO2_fraction > 0) || (n_H2O > 1e-10) || (n_CH4 > 1e-10);
            if (!has_absorption) {
                // Pas d'absorption : corps noir pur, flux passe sans modification
                upward_flux[i][j] = flux_in[j];
                emitted_flux[i][j] = 0;
                absorbed_flux[i][j] = 0;
            } else {
                // Transfert radiatif dans la couche (Formule exacte avec exponentielle)
                // I_out = I_in * exp(-tau) + B(T) * (1 - exp(-tau))

                const tau = optical_thickness[i][j];
                const transmission = Math.exp(-tau);
                const emissivity = 1 - transmission; // Kirchhoff: epsilon = 1 - transmission

                // 1. Flux absorbé
                const abs_flux = flux_in[j] * (1 - transmission);

                // 2. Flux émis
                // F_émis = (1 - exp(-tau)) × π × B_λ(T_couche) × Δλ × poids
                const em_flux = emissivity * Math.PI * localPlanckFunction(lambda, T) * delta_lambda * (lambda_weights[j] || 1.0);

                // 3. Flux sortant
                upward_flux[i][j] = flux_in[j] * transmission + em_flux;

                // Stocker les valeurs pour la visualisation
                emitted_flux[i][j] = em_flux;
                absorbed_flux[i][j] = abs_flux;
            }

            flux_in[j] = upward_flux[i][j];
        }
    }

    // ⚡ OPTIMISATION : Boucle après tropopause (T constante = T_trop, B_λ précalculé)
    for (let i = i_trop; i < z_range.length; i++) {
        const z = z_range[i];
        const n_CO2 = airNumberDensity(z, CO2_fraction, T0_test, physParams) * CO2_fraction;

        // ⚡ OPTIMISATION : Calculer delta_z réel pour cette couche (précision grossière au-dessus)
        const delta_z_real = i > i_trop ? z - z_range[i - 1] : delta_z_stratosphere;

        // Vérifier que flux_in et upward_flux[i] ont la bonne longueur avant la boucle
        if (flux_in.length !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE dans boucle stratosphère i=${i}: flux_in.length (${flux_in.length}) != lambda_range.length (${lambda_range.length})`);
            throw new Error(`Longueurs incompatibles dans boucle stratosphère: flux_in (${flux_in.length}) != lambda_range (${lambda_range.length})`);
        }
        if (upward_flux[i].length !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE dans boucle stratosphère i=${i}: upward_flux[${i}].length (${upward_flux[i].length}) != lambda_range.length (${lambda_range.length})`);
            throw new Error(`Longueurs incompatibles dans boucle stratosphère: upward_flux[${i}] (${upward_flux[i].length}) != lambda_range (${lambda_range.length})`);
        }

        // Calculer pour chaque longueur d'onde
        for (let j = 0; j < lambda_range.length; j++) {
            if (j >= flux_in.length || j >= upward_flux[i].length) {
                console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE stratosphère: j=${j}, flux_in.length=${flux_in.length}, upward_flux[${i}].length=${upward_flux[i].length}, lambda_range.length=${lambda_range.length}`);
                throw new Error(`Index j=${j} hors limites`);
            }

            const lambda = lambda_range[j];

            // ⚡ OPTIMISATION : Utiliser les sections efficaces précalculées
            // Absorption CO2
            const kappa_CO2 = cross_section_CO2[j] * n_CO2;

            // Absorption H2O (si activé)
            const n_H2O = h2o_enabled ? waterVaporNumberDensity(z, CO2_fraction, T0_test, physParams) : 0;
            const kappa_H2O = h2o_enabled ? cross_section_H2O[j] * n_H2O : 0;

            // Absorption CH4 (si activé)
            const n_CH4 = (ch4_enabled && CH4_fraction) ? methaneNumberDensity(z, CH4_fraction, CO2_fraction, T0_test, physParams) : 0;
            const kappa_CH4 = (ch4_enabled && CH4_fraction) ? cross_section_CH4[j] * n_CH4 : 0;

            // Coefficient d'absorption total (CO2 + H2O + CH4)
            const kappa = kappa_CO2 + kappa_H2O + kappa_CH4;

            optical_thickness[i][j] = kappa * delta_z_real;

            // 🔒 Corps noir = pas d'absorption (CO2=0 ET H2O réellement absent ET CH4 réellement absent)
            // Vérifier les valeurs réelles, pas seulement les boutons
            const has_absorption = (CO2_fraction > 0) || (n_H2O > 1e-10) || (n_CH4 > 1e-10);
            if (!has_absorption) {
                // Pas d'absorption : corps noir pur, flux passe sans modification
                upward_flux[i][j] = flux_in[j];
                emitted_flux[i][j] = 0;
                absorbed_flux[i][j] = 0;
            } else {
                // Transfert radiatif dans la couche (Formule exacte avec exponentielle)
                const tau = optical_thickness[i][j];
                const transmission = Math.exp(-tau);
                const emissivity = 1 - transmission;

                // 1. Flux absorbé
                const abs_flux = flux_in[j] * (1 - transmission);

                // 2. Flux émis
                // ⚡ OPTIMISATION : Utiliser B_λ(T_trop) précalculé
                const em_flux = emissivity * Math.PI * planck_trop[j] * delta_lambda * (lambda_weights[j] || 1.0);

                // 3. Flux sortant
                upward_flux[i][j] = flux_in[j] * transmission + em_flux;

                // Stocker les valeurs pour la visualisation
                emitted_flux[i][j] = em_flux;
                absorbed_flux[i][j] = abs_flux;
            }

            flux_in[j] = upward_flux[i][j];
        }
    }

    // Log supprimé (non essentiel)

    // Calculer le flux total au sommet
    // Vérifier que upward_flux n'est pas vide avant d'appeler reduce
    // Vérifier la longueur de upward_flux avant de retourner
    if (upward_flux.length > 0) {
        const topFluxLength = upward_flux[upward_flux.length - 1].length;
        if (topFluxLength !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE FINALE: upward_flux[top].length (${topFluxLength}) != lambda_range.length (${lambda_range.length})`);
        }
    }
    
    if (!upward_flux || upward_flux.length === 0 || !upward_flux[upward_flux.length - 1]) {
        console.error('[calculateFluxForT0] upward_flux est vide ou invalide');
        return {
            total_flux: 0,
            lambda_range: [],
            z_range: [],
            upward_flux: [],
            optical_thickness: [],
            emitted_flux: [],
            absorbed_flux: [],
            earth_flux: [],
            albedo: 0.3,
            cloud_coverage: 0
        };
    }
    const total_flux = upward_flux[upward_flux.length - 1].reduce((sum, val) => sum + val, 0);
    
    // Log du delta (flux sortant - flux entrant initial)
    // Note: flux entrant initial = earth_flux total (flux émis par la surface)
    const earth_flux_total = earth_flux.reduce((sum, val) => sum + val, 0);
    const delta_spectral = total_flux - earth_flux_total;
    console.log(`📊 [calculateFluxForT0@calculations.js] Résultat calcul spectral:`);
    console.log(`   Flux entrant initial (surface): ${earth_flux_total.toFixed(2)} W/m²`);
    console.log(`   Flux sortant final (sommet atm): ${total_flux.toFixed(2)} W/m²`);
    console.log(`   Delta (sortant - entrant): ${delta_spectral.toFixed(2)} W/m²`);

    // Debug: analyser le flux < 9μm au sommet de l'atmosphère
    const top_flux = upward_flux[upward_flux.length - 1];
    const lambda_9um_top = 9e-6;
    const top_flux_below_9um = top_flux.filter((flux, idx) => lambda_range[idx] < lambda_9um_top).reduce((sum, f) => sum + f, 0);
    const top_flux_total = top_flux.reduce((sum, f) => sum + f, 0);

    return { total_flux, lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux };
}

// Fonction helper pour afficher une courbe temporaire pendant la dichotomie
function displayDichotomyStep(CO2_fraction, T0_test, result, iteration, isInitial = false, options = {}) {
    // Récupérer H2O et CH4 pour le log
    const h2o_percent = (typeof window !== 'undefined' && window.h2oVaporPercent !== undefined) ? window.h2oVaporPercent : 0;
    const h2o_meteorites = (typeof window !== 'undefined' && window.h2oTotalFromMeteorites !== undefined) ? window.h2oTotalFromMeteorites : 0;
    const h2o_total = h2o_percent + h2o_meteorites;
    const ch4_ppm = options.CH4_fraction * 1e6;
    
    // Log supprimé : affichage uniquement du mode (dichotomie/exponentielle) dans la boucle principale
    // if (iteration === 0 || isInitial) {
    //     console.log(`${LOGO_EDS} [displayDichotomyStep@calculations.js] iter=${iteration} T0=${T0_test?.toFixed(2) || 'N/A'}K 🏭=${(CO2_fraction * 1e6).toFixed(0)}ppm 💧=${h2o_total.toFixed(1)}% ⛽=${ch4_ppm.toFixed(0)}ppm`);
    // }
    if (typeof window === 'undefined') return;

    // Créer un objet plotData temporaire pour l'affichage
    // ✅ SCIENTIFIQUEMENT CERTAIN : Loi de Stefan-Boltzmann T = (F/σ)^(1/4)
    // - Cette loi décrit la température effective d'un corps noir en équilibre radiatif
    // - Dérivée de la loi de Planck, elle est exacte pour un corps noir
    // - La constante σ = 5.67×10⁻⁸ W/(m²·K⁴) est une constante fondamentale
    const STEFAN_BOLTZMANN = window.STEFAN_BOLTZMANN || 5.670374419e-8;

    // ⚠️ DIFFÉRENCE ENTRE effective_temperature ET temp_surface :
    // - effective_temperature (temp_eff) = (flux_total / σ)^0.25
    //   → Température du corps noir équivalent qui émettrait le même flux total vers l'espace
    //   → Le flux émis vers l'espace vient de différentes altitudes (plus froid en altitude)
    // - temp_surface (T0_test) = Température réelle au sol calculée par dichotomie
    //   → Équilibre le bilan énergétique : flux solaire absorbé = flux terrestre émis
    //   → Dans une atmosphère avec effet de serre, la surface est plus chaude que la température effective
    //   → C'est l'effet de serre : la surface est plus chaude que ce que le flux émis vers l'espace suggère
    //   → La différence (temp_surface - effective_temperature) mesure l'intensité de l'effet de serre
    // 
    // Récupérer l'albedo et la couverture nuageuse depuis les résultats
    const h2o_enabled = (typeof window !== 'undefined' && window.waterVaporEnabled !== undefined)
        ? window.waterVaporEnabled
        : false;
    // Récupérer le flux géothermique depuis l'époque courante
    // 🔒 Utiliser calculateGeothermalFlux si disponible (nouveau système)
    let geo_flux = null;
    if (typeof window !== 'undefined' && window.currentEpochName) {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            // 🔒 Priorité absolue au flux géothermique direct (dynamique ou statique)
            if (typeof currentEpoch.geothermal_flux === 'number') {
                geo_flux = currentEpoch.geothermal_flux;
            }
            // Fallback legacy (ne devrait plus être utilisé car getGeologicalPeriodByName injecte geothermal_flux)
            else if (typeof window.calculateGeothermalFlux === 'function' &&
                typeof currentEpoch.core_temperature === 'number' &&
                typeof currentEpoch.geothermal_diffusion_factor === 'number') {
                geo_flux = window.calculateGeothermalFlux(currentEpoch.core_temperature, currentEpoch.geothermal_diffusion_factor);
            }
        }
    }
    // Récupérer CH4 depuis options
    const ch4_enabled = (typeof window !== 'undefined' && window.methaneEnabled !== undefined)
        ? window.methaneEnabled
        : false;
    const CH4_fraction = (options && options.CH4_fraction !== undefined) ? options.CH4_fraction : null;

    // ⚠️ CAS PARTICULIER : Corps noir (pas d'atmosphère, albedo = 0)
    //   → Pas d'effet de serre, donc temp_surface = effective_temperature
    //   → Le flux émis par la surface passe directement vers l'espace sans absorption
    //   → On utilise temp_surface directement pour éviter les erreurs numériques
    const isBlackBody = (CO2_fraction === 0 || CO2_fraction === null) && !h2o_enabled && (!ch4_enabled || !CH4_fraction);
    const temp_eff = isBlackBody
        ? T0_test  // Corps noir : utiliser directement temp_surface (formule analytique exacte)
        : Math.pow(result.total_flux / STEFAN_BOLTZMANN, 0.25);  // Avec atmosphère : calculer depuis flux_total
    // Calculer la température terrestre en °C à partir de T0_test (température au sol en K)
    const temp_surface_c = T0_test - 273.15;
    const temp_eff_0 = 255.0; // Température effective sans CO2 (référence 255K)
    const albedo = result.albedo;
    const cloud_coverage = result.cloud_coverage;

    // Calculer les forçages radiatifs séparés
    const forcing_CO2 = typeof window.calculateCO2Forcing === 'function'
        ? window.calculateCO2Forcing(CO2_fraction)
        : 0;
    const forcing_H2O = typeof window.calculateH2OForcing === 'function'
        ? window.calculateH2OForcing(h2o_enabled, cloud_coverage)
        : 0;
    const forcing_Albedo = typeof window.calculateAlbedoForcing === 'function' && albedo !== null
        ? window.calculateAlbedoForcing(albedo)
        : 0;

    // Forçage total
    const forcing_total = forcing_CO2 + forcing_H2O + forcing_Albedo;

    // Calculer ΔT° = différence de température par rapport à la référence (255K sans CO2)
    // ΔT° = T° actuelle - T° référence (255K)
    // C'est la différence directe de température, plus claire et compréhensible
    const TEMP_REF_NO_CO2 = 255.0; // Température effective sans CO2 (référence)
    const delta_temp = T0_test - TEMP_REF_NO_CO2;

    // Calculer ΔT° par rapport à la température optimale habitable (15°C = 288K)
    // ΔT° habitable = T° actuelle - T° optimale habitable
    const delta_temp_habitable = T0_test - TEMP_HABITABLE_OPTIMAL;

    // Déterminer si la vie est possible (température dans la zone habitable)
    const life_viable = T0_test >= TEMP_HABITABLE_MIN && T0_test <= TEMP_HABITABLE_MAX;

    // Mettre à jour les informations à chaque étape
    if (typeof window.updateDisplay === 'function') {
        window.updateDisplay({
            state: typeof window.currentState !== 'undefined' ? window.currentState : 0,
            co2_ppm: CO2_fraction * 1e6,
            temp_surface: T0_test,
            temp_surface_c: temp_surface_c,
            temp_eff: temp_eff,
            temp_eff_c: temp_eff - 273.15,
            delta_temp: delta_temp,
            delta_temp_habitable: delta_temp_habitable,
            life_viable: life_viable,
            forcing: forcing_total,
            forcing_CO2: forcing_CO2,
            forcing_H2O: forcing_H2O,
            forcing_Albedo: forcing_Albedo,
            albedo: albedo,
            cloud_coverage: cloud_coverage
        });
    }

    // Mettre à jour les labels du flux pendant le calcul
    if (typeof window !== 'undefined' && typeof window.updateFluxLabels === 'function') {
        const ch4_ppm = (options && options.CH4_fraction) ? options.CH4_fraction * 1e6 : 0;
        window.updateFluxLabels({
            T0: T0_test,
            temp_surface: T0_test,
            total_flux: result.total_flux,
            albedo: albedo,
            cloud_coverage: cloud_coverage,
            co2_ppm: CO2_fraction * 1e6,
            ch4_ppm: ch4_ppm
        });
    }

    // 🔒 Mettre à jour la couleur avec la température actuelle (à chaque étape de dichotomie)
    if (typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function' && typeof window.updateBlackBodyColor === 'function') {
        const color_current = window.tempSurfaceToColor(temp_surface_c);
        window.updateBlackBodyColor(color_current);
        
        // Mettre à jour legend-equilibre avec la couleur actuelle
        const legendEquilibre = typeof document !== 'undefined' ? document.querySelector('.legend-equilibre') : null;
        if (legendEquilibre) {
            legendEquilibre.style.color = color_current;
        }
    }

    const tempPlotData = {
        lambda_range: result.lambda_range,
        lambda_weights: result.lambda_weights, // ⚡ Nécessaire pour normalisation correcte du flux
        z_range: result.z_range,
        current: {
            upward_flux: result.upward_flux,
            effective_temperature: temp_eff,
            emitted_flux: result.emitted_flux,
            absorbed_flux: result.absorbed_flux,
            earth_flux: result.earth_flux,
            lambda_range: result.lambda_range, // Nécessaire pour updateSpectralVisualization
            lambda_weights: result.lambda_weights, // ⚡ Nécessaire pour updateSpectralVisualization
            z_range: result.z_range, // Nécessaire pour updateSpectralVisualization
            albedo: albedo,
            cloud_coverage: cloud_coverage
        },
        co2_ppm: CO2_fraction * 1e6,
        temp_surface: T0_test, // Température de surface réelle (K) pour cohérence avec affichage
        temp_surface_c: temp_surface_c // Température de surface en °C pour mise à jour de la couleur en temps réel
    };

    // Mettre à jour le graphique
    if (typeof window.updatePlot === 'function') {
        window.updatePlot(tempPlotData);
    }

    // Mettre à jour la visualisation spectrale
    setTimeout(() => {
        const canvas = document.getElementById('spectral-visualization');
        if (canvas) {
            canvas.style.setProperty('display', 'block', 'important');
            canvas.style.setProperty('visibility', 'visible', 'important');
            canvas.style.setProperty('opacity', '1', 'important');
            canvas.style.setProperty('z-index', '0', 'important');
            canvas.style.setProperty('position', 'absolute', 'important');
        }
        if (typeof window.updateSpectralVisualization === 'function' && tempPlotData.current) {
            window.updateSpectralVisualization(tempPlotData.current);
        }
    }, 100);

    // Mettre à jour le statut
    if (typeof document !== 'undefined') {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            if (isInitial) {
                statusEl.textContent = `[Dichotomie] Étape initiale: T0 = ${T0_test.toFixed(2)} K, flux = ${result.total_flux.toFixed(2)} W/m²`;
            } else {
                statusEl.textContent = `[Dichotomie] Itération ${iteration}: T0 = ${T0_test.toFixed(2)} K, flux = ${result.total_flux.toFixed(2)} W/m²`;
            }
        }
    }
}

// Fonction helper pour récupérer l'état du bouton "anim"
// Retourne un seul boolean depuis la variable globale unique (seule référence)
// Fonction supprimée : utiliser directement window.enabledStates[window.ENABLED_STATES.ANIMATION.key]

// 🔒 Fonction pour calculer T0_initial_config AVANT simulateRadiativeTransfer
// Cette fonction doit être appelée avant simulateRadiativeTransfer pour déterminer la température de départ
// Formule : 🎥 ? T0=🏮 : T0=🌡️, puis T0 += ☄️*🌡️☄️ + 🕓*🌡️🕓
function calculateT0InitialConfig() {
    // Récupérer la température précédente depuis window.plotData
    let prev_T0 = null;
    if (typeof window !== 'undefined' && window.plotData && window.plotData.temp_surface) {
        prev_T0 = window.plotData.temp_surface;
    }
    
    let T0_initial_config = null;
    // Vérifier si l'époque définit une température initiale
    if (typeof window !== 'undefined' && window.currentEpochName) {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch && typeof currentEpoch.t0 === 'number' && currentEpoch.t0 > 0) {
            // Calculer le nombre de météorites
            let meteoriteCount = 0;
            if (currentEpoch.events && currentEpoch.events.ice_meteorite && currentEpoch.events.ice_meteorite.water_added_kg) {
                const h2oTotalFromMeteorites = (typeof window !== 'undefined' && window.h2oTotalFromMeteorites !== undefined) ? window.h2oTotalFromMeteorites : 0;
                if (h2oTotalFromMeteorites > 0) {
                    const mass_kg = currentEpoch.events.ice_meteorite.water_added_kg;
                    const EARTH_TOTAL_WATER_MASS_KG = 1.4e21;
                    const h2oPerMeteorite = (mass_kg / EARTH_TOTAL_WATER_MASS_KG) * 100;
                    const h2oPerMeteoriteAdjusted = (currentEpoch.id === 'hadeen') ? Math.max(h2oPerMeteorite * 10, 2.1) : h2oPerMeteorite;
                    meteoriteCount = Math.floor(h2oTotalFromMeteorites / h2oPerMeteoriteAdjusted);
                }
            }
            
            const ticTime = (typeof window !== 'undefined' && window.infoTimeMa !== undefined) 
                ? Math.floor(window.infoTimeMa / 50) 
                : 0;
            
            // Wrapper pour éviter window abusifs
            const ENABLED_STATES = window.ENABLED_STATES;
            const animEnabled = (window.enabledStates && window.enabledStates[ENABLED_STATES.ANIMATION.key]) || true; // 🎥
            const t0_config = currentEpoch.t0; // 🌡️
            
            // Récupérer les deltas
            const deltaTicTime_per_tic = (currentEpoch.events && currentEpoch.events.tic_time && typeof currentEpoch.events.tic_time.deltaTemp === 'number')
                ? currentEpoch.events.tic_time.deltaTemp
                : null;
            
            if (typeof window !== 'undefined') {
                window.currentMeteoriteCount = meteoriteCount;
            }
            
            // 🔒 Formule : 🎥 ? T0=🏮 : T0=🌡️, puis T0 += 🕓*🌡️🕓
            const baseTemp = animEnabled ? (prev_T0 !== null && prev_T0 > 0 ? prev_T0 : t0_config) : t0_config;
            let adjustment = 0;
            if (deltaTicTime_per_tic !== null) {
                adjustment += deltaTicTime_per_tic * ticTime;
            }
            T0_initial_config = baseTemp + adjustment;
            
            // Log du calcul : afficher la formule exacte
            const prev_T0_str = prev_T0 !== null && prev_T0 > 0 ? `${prev_T0.toFixed(2)}K (${(prev_T0 - 273.15).toFixed(1)}°C)` : 'null';
            const t0_config_str = `${t0_config.toFixed(2)}K (${(t0_config - 273.15).toFixed(1)}°C)`;
            const deltaTicTime_str = deltaTicTime_per_tic !== null ? `${deltaTicTime_per_tic.toFixed(1)}K` : '0K';
            
            // Construire la formule : T0 = base + 🕓*🌡️🕓
            let formula_parts = [];
            if (animEnabled) {
                formula_parts.push(`T0=${prev_T0_str}`);
            } else {
                formula_parts.push(`T0=${t0_config_str}`);
            }
            if (deltaTicTime_per_tic !== null && ticTime > 0) {
                const tictime_adj = deltaTicTime_per_tic * ticTime;
                formula_parts.push(`+${ticTime}×${deltaTicTime_per_tic.toFixed(1)}K`);
            }
            const formula = formula_parts.join(' ');
            
            console.log(`🕓🛠 [T0_initial_config@calculations.js] 🎥:${animEnabled} 🏮:${prev_T0_str} 🌡️:${t0_config_str}, ☄️:${meteoriteCount}, 🕓:${ticTime}, 🌡️🕓:${deltaTicTime_str} => ${formula} = ${T0_initial_config.toFixed(2)}K`);
            
            // Anticiper la couleur
            if (typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function' && typeof window.updateBlackBodyColor === 'function') {
                const tempC_anticipated = T0_initial_config - 273.15;
                const color_anticipated = window.tempSurfaceToColor(tempC_anticipated);
                window.updateBlackBodyColor(color_anticipated);
                const legendEquilibre = typeof document !== 'undefined' ? document.querySelector('.legend-equilibre') : null;
                if (legendEquilibre) {
                    legendEquilibre.style.color = color_anticipated;
                }
            }
        } else if (currentEpoch && typeof currentEpoch.initial_temperature_K === 'number' && currentEpoch.initial_temperature_K > 0) {
            // Fallback : température initiale de l'époque
            T0_initial_config = currentEpoch.initial_temperature_K;
            if (typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function' && typeof window.updateBlackBodyColor === 'function') {
                const tempC_anticipated = T0_initial_config - 273.15;
                const color_anticipated = window.tempSurfaceToColor(tempC_anticipated);
                window.updateBlackBodyColor(color_anticipated);
                const legendEquilibre = typeof document !== 'undefined' ? document.querySelector('.legend-equilibre') : null;
                if (legendEquilibre) {
                    legendEquilibre.style.color = color_anticipated;
                }
            }
        }
    }
    
    return T0_initial_config;
}

function simulateRadiativeTransfer(options = {}) {
    const CO2_percent = options.CO2_percent; // en ppm
    const H2O_percent = options.H2O_percent; // en pourcentage
    const CH4_percent = options.CH4_percent; // en ppm
    
    // Convertir en fractions pour les calculs
    const CO2_fraction = CO2_percent * 1e-6;
    const CH4_fraction = CH4_percent * 1e-6;
    
    // 🔒 Calcul simple de T0 : (🎥) => T0=🏮 : T0=🌡️, puis T0 += ☄️*🌡️☄️ + 🕓*🌡️🕓
    let prev_T0 = null;
    if (typeof window !== 'undefined' && window.plotData && window.plotData.temp_surface) {
        prev_T0 = window.plotData.temp_surface;
    }
    
    let T0_initial = null;
    if (typeof window !== 'undefined' && window.currentEpochName) {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch && typeof currentEpoch.t0 === 'number' && currentEpoch.t0 > 0) {
            // Wrapper pour éviter window abusifs
            const ENABLED_STATES = window.ENABLED_STATES;
            const animEnabled = (window.enabledStates && window.enabledStates[ENABLED_STATES.ANIMATION.key]) || true; // 🎥
            const t0_config = currentEpoch.t0; // 🌡️
            
            // (🎥) => T0=🏮 : T0=🌡️
            const baseTemp = animEnabled ? (prev_T0 !== null && prev_T0 > 0 ? prev_T0 : t0_config) : t0_config;
            
            // T0 += ☄️*🌡️☄️ + 🕓*🌡️🕓
            let meteoriteCount = 0;
            if (currentEpoch.events && currentEpoch.events.ice_meteorite && currentEpoch.events.ice_meteorite.water_added_kg) {
                const h2oTotalFromMeteorites = (typeof window !== 'undefined' && window.h2oTotalFromMeteorites !== undefined) ? window.h2oTotalFromMeteorites : 0;
                if (h2oTotalFromMeteorites > 0) {
                    const mass_kg = currentEpoch.events.ice_meteorite.water_added_kg;
                    const EARTH_TOTAL_WATER_MASS_KG = 1.4e21;
                    const h2oPerMeteorite = (mass_kg / EARTH_TOTAL_WATER_MASS_KG) * 100;
                    const h2oPerMeteoriteAdjusted = (currentEpoch.id === 'hadeen') ? Math.max(h2oPerMeteorite * 10, 2.1) : h2oPerMeteorite;
                    meteoriteCount = Math.floor(h2oTotalFromMeteorites / h2oPerMeteoriteAdjusted);
                }
            }
            
            const ticTime = (typeof window !== 'undefined' && window.infoTimeMa !== undefined) 
                ? Math.floor(window.infoTimeMa / 50) 
                : 0;
            
            const deltaTicTime_per_tic = (currentEpoch.events && currentEpoch.events.tic_time && typeof currentEpoch.events.tic_time.deltaTemp === 'number')
                ? currentEpoch.events.tic_time.deltaTemp
                : null;
            
            let adjustment = 0;
            if (deltaTicTime_per_tic !== null) {
                adjustment += deltaTicTime_per_tic * ticTime;
            }
            
            T0_initial = baseTemp + adjustment;
            
            // Log du calcul
            const prev_T0_str = prev_T0 !== null && prev_T0 > 0 ? `${prev_T0.toFixed(2)}K (${(prev_T0 - 273.15).toFixed(1)}°C)` : 'null';
            const t0_config_str = `${t0_config.toFixed(2)}K (${(t0_config - 273.15).toFixed(1)}°C)`;
            const deltaTicTime_str = deltaTicTime_per_tic !== null ? `${deltaTicTime_per_tic.toFixed(1)}K` : '0K';
            
            let formula_parts = [];
            if (animEnabled) {
                formula_parts.push(`T0=${prev_T0_str}`);
            } else {
                formula_parts.push(`T0=${t0_config_str}`);
            }
            if (deltaTicTime_per_tic !== null && ticTime > 0) {
                formula_parts.push(`+${ticTime}×${deltaTicTime_per_tic.toFixed(1)}K`);
            }
            const formula = formula_parts.join(' ');
            
            console.log(`🕓🛠 [simulateRadiativeTransfer@calculations.js] 🎥:${animEnabled} 🏮:${prev_T0_str} 🌡️:${t0_config_str}, ☄️:${meteoriteCount}, 🕓:${ticTime}, 🌡️🕓:${deltaTicTime_str} => ${formula} = ${T0_initial.toFixed(2)}K`);
        }
    }
    
    if (T0_initial === null || T0_initial <= 0) {
        console.error(`${LOGO_EDS} [simulateRadiativeTransfer@calculations.js] ❌ T0_initial invalide: ${T0_initial}`);
        return Promise.reject(new Error('T0_initial invalide'));
    }
    
    // fullSpectre=false : utilise un regroupement adaptatif des longueurs d'onde pour optimiser les calculs
    // fullSpectre=true : utilise le spectre complet sans regroupement (plus précis mais plus lent)
    // Note: actuellement forcé à true dans le code (forceFullSpectre), donc toujours spectre complet
    console.log(`${LOGO_EDS} [simulateRadiativeTransfer@calculations.js] ${LOGO_CO2}=${CO2_percent.toFixed(0)}ppm ${LOGO_H2O}=${H2O_percent.toFixed(1)}% ${LOGO_CH4}=${CH4_percent.toFixed(0)}ppm`);
    
    // Définir la fraction CO2 globale
    current_CO2_fraction_for_temp = CO2_fraction;
    current_T0_adjusted = null; // Réinitialiser

    const {
        z_max = 120000,
        delta_z = 50,
        lambda_min = 0.1e-6,
        lambda_max = 100e-6,
        delta_lambda = 0.1e-6,
    } = options;
    
    logCalculationPhase('DICHOTOMIE START', {
        T0_initial: T0_initial.toFixed(2)
    });
    
    // 🔒 Anticiper la couleur avec T0_initial dès le début
    if (typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function' && typeof window.updateBlackBodyColor === 'function') {
        const tempC_anticipated = T0_initial - 273.15;
        const color_anticipated = window.tempSurfaceToColor(tempC_anticipated);
        window.updateBlackBodyColor(color_anticipated);
        
        // Mettre à jour legend-equilibre avec la couleur anticipée
        const legendEquilibre = typeof document !== 'undefined' ? document.querySelector('.legend-equilibre') : null;
        if (legendEquilibre) {
            legendEquilibre.style.color = color_anticipated;
        }
    }
    
    // 🔒 Préparer les options pour calculateFluxForT0 avec CH4_fraction
    const fluxOptions = {
        ...options,
        CH4_fraction: CH4_fraction
    };

    // Dichotomie pour trouver T0 qui donne flux_total = flux_solaire_absorbé
    // 🔒 Ajuster les bornes selon la température initiale (peut être très élevée pour Hadéen)
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const cellH2O_check = typeof document !== 'undefined' ? document.getElementById('cell-h2o') : null;
    const h2o_enabled_check = cellH2O_check && cellH2O_check.classList.contains('checked');

    // Si T0_initial est très élevé (ex: Hadéen post-impact), utiliser un intervalle plus large
    // 🔒 OPTIMISATION : Réduire l'intervalle si on part d'une T0 précédente connue (continuité)
    const prev_T0_for_range = (typeof window !== 'undefined' && window.plotData && window.plotData.temp_surface) ? window.plotData.temp_surface : null;
    const range_factor = (prev_T0_for_range !== null && prev_T0_for_range > 0) ? 0.5 : 1.0; // Réduire intervalle de 50% si continuité
    const INITIAL_RANGE = ((T0_initial > 1000) ? 200 : 50) * range_factor; // Intervalle adaptatif

    let T0_min = Math.max(200, T0_initial - INITIAL_RANGE); // Borne inférieure, minimum 200K
    // Borne supérieure : permettre jusqu'à 3000K pour Hadéen (juste après impact)
    const T0_max_limit = (T0_initial > 1000) ? 3000 : (h2o_enabled_check ? 400 : 350);
    let T0_max = Math.min(T0_max_limit, T0_initial + INITIAL_RANGE);
    let T0 = T0_initial;
    
    // 🔒 Calculer la tolérance depuis la précision de convergence (variable globale unique)
    // 🔒 IMPORTANT : tolerance (convergence) ≠ precision (échantillonnage atmosphère)
    // - tolerance : seuil de convergence pour delta_equilibre (flux_sortant - flux_entrant) en W/m²
    // - precision : taille des échantillons d'atmosphère (delta_z_stratosphere) contrôlée par precisionFactor (FPS)
    // 
    // 🔒 CALCUL DE TOLÉRANCE : tolerance = 4 * σ * T³ * precision_K
    // Explication :
    // - F = σT⁴ (loi de Stefan-Boltzmann, F = flux en W/m², T = température en K)
    // - dF/dT = 4σT³ (dérivée)
    // - Donc ΔF = 4σT³ × ΔT
    // - Pour une précision de precision_K en K, la tolérance en W/m² est : tolerance = 4σT³ × precision_K
    // Exemples :
    //   - À 255K avec precision_K=0.1K → tolerance = 4×5.67e-8×255³×0.1 ≈ 0.38 W/m²
    //   - À 255K avec precision_K=1K → tolerance = 4×5.67e-8×255³×1 ≈ 3.8 W/m²
    //   - À 255K avec precision_K=10K → tolerance = 4×5.67e-8×255³×10 ≈ 38 W/m²
    // Note : 1 K = 1 °C (même delta, juste décalage de 273.15), donc 0.1° = 0.1 K
    const STEFAN_BOLTZMANN = window.STEFAN_BOLTZMANN || 5.670374419e-8;
    
    // 🔒 UTILISER UNIQUEMENT la variable globale unique (seule référence)
    // Cette variable est initialisée depuis la config UNIQUEMENT au changement d'époque (setEpoch)
    // Si l'utilisateur change la précision, la config ne l'écrase plus
    // La boucle principale ne relit PAS la config, elle utilise la valeur courante
    const precision_K = typeof window !== 'undefined' && window.convergencePrecision_K !== undefined
        ? window.convergencePrecision_K
        : 0.1; // Fallback par défaut si pas encore initialisé
    
    // Convertir la précision en K en tolérance de base en W/m² : ΔF = 4 * σ * T³ * ΔT
    // La tolérance sera recalculée à chaque itération avec T0_current (car la sensibilité change avec T)
    // Note : La précision est déjà initialisée dans setEpoch (log 🕰 🛠 [setEpoch@main.js] 🎚=0.1° 🔘 selected)
    // Note : La tolérance sera recalculée à chaque itération avec T0_current pour une précision correcte
    const tolerance_base = 4 * STEFAN_BOLTZMANN * Math.pow(T0_initial, 3) * precision_K;
    
    const max_iterations = 20;
    let iteration = 0;
    let result = null;

    // 🔒 GESTION DE L'OVERLAY DE CALCUL
    // Afficher l'overlay au début du calcul (si mode asynchrone)
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.setTimeout) {
        const overlay = document.getElementById('calculation-overlay');
        if (overlay) {
            overlay.style.display = 'flex'; // Afficher (flex pour centrer)
            // Reset des points
            const dots = document.getElementById('calculation-dots');
            if (dots) dots.textContent = '';
        }
    }

    // Vérifier si on doit afficher les étapes (seulement pour les calculs interactifs)
    // 🔒 Le bouton "anim" contrôle directement window.showDichotomySteps
    const shouldDisplaySteps = typeof window !== 'undefined' && window.showDichotomySteps;

    if (shouldDisplaySteps) {
        // Créer un lambda_range temporaire pour afficher les courbes Planck avant la dichotomie
        // (utiliser les variables déjà déclarées ci-dessus)
        const temp_lambda_range = [];
        for (let lambda = lambda_min; lambda < lambda_max; lambda += delta_lambda) {
            temp_lambda_range.push(lambda);
        }

        // Afficher les courbes Planck de référence avant la dichotomie
        if (typeof window !== 'undefined' && window.updatePlot && typeof window.PLANCK_TEMPERATURES !== 'undefined') {
            // Créer lambda_weights pour temp_lambda_range (poids unitaire pour pas constant)
            const temp_lambda_weights = temp_lambda_range.map(() => 1.0);
            
            // Créer un plotData temporaire avec seulement les courbes Planck
            const tempPlotData = {
                lambda_range: temp_lambda_range,
                lambda_weights: temp_lambda_weights, // ⚡ Nécessaire pour updatePlot
                current: null,
                co2_ppm: CO2_fraction * 1e6
            };
            window.updatePlot(tempPlotData);

            // S'assurer que la visualisation spectrale reste visible même sans nouvelles données
            setTimeout(() => {
                const canvas = document.getElementById('spectral-visualization');
                if (canvas) {
                    canvas.style.setProperty('display', 'block', 'important');
                    canvas.style.setProperty('visibility', 'visible', 'important');
                    canvas.style.setProperty('opacity', '1', 'important');
                    canvas.style.setProperty('z-index', '1', 'important');
                    canvas.style.setProperty('position', 'absolute', 'important');
                }
            }, 100);
        }
    } else {
        // Pour les calculs de référence, pas d'affichage graphique
    }

    // Calculer la courbe initiale
    result = calculateFluxForT0(CO2_fraction, T0_initial, fluxOptions);

    // Afficher la courbe initiale (avant dichotomie) seulement si demandé
    // 🔒 Réutiliser shouldDisplaySteps déjà calculé ci-dessus (peut avoir changé via bouton anim)
    if (shouldDisplaySteps) {
        displayDichotomyStep(CO2_fraction, T0_initial, result, 0, true, options);
    }

    // Reset des flux diff min/max pour la nouvelle dichotomie asynchrone
    if (typeof window !== 'undefined') {
        window.flux_diff_min = -1e9;
        window.flux_diff_max = 1e9;
    }

    // Dichotomie avec affichage progressif
    // Note: On utilise une approche asynchrone pour permettre l'affichage progressif
    // mais on retourne immédiatement une Promise pour ne pas bloquer
    if (typeof window !== 'undefined' && window.setTimeout) {
        // Mode asynchrone avec affichage progressif
        return new Promise((resolve) => {
            let isCancelled = false;
            const timeoutIds = [];

            const performDichotomy = () => {
                // Vérifier si annulé
                if (window.cancelCalculation || isCancelled) {
                    return;
                }

                let T0_current = T0_initial;
                let iter = 0;
                let final_result = result;

                // 🔒 Initialiser les bornes pour la dichotomie classique
                // Ces bornes seront mises à jour par la phase exponentielle ou la dichotomie classique
                let T0_min = T0_initial - 50; // Borne inférieure initiale
                let T0_max = T0_initial + 50; // Borne supérieure initiale

                // 🔒 Algorithme simplifié : Phase="Search" puis Phase="Dicho"
                // Phase="Search" : T0 -= Delta équilibre jusqu'à changement de signe
                // Phase="Dicho" : T0 = (old_T0 + T0) / 2
                let Phase = "Search";
                let signeDeltaFirst = 0;
                let old_T0 = T0_initial;
                let previousT0_for_convergence = null; // T0 précédente pour vérifier la convergence en température

                const iterate = () => {
                    // Vérifier si annulé avant chaque itération
                    if (window.cancelCalculation || isCancelled) {
                        return;
                    }

                    if (iter >= max_iterations) {
                        // Maximum d'itérations atteint
                        if (!isCancelled) {
                            finalizeResults(final_result, T0_current, CO2_fraction, resolve);
                        }
                        return;
                    }

                    // 🔒 Vérifier shouldDisplaySteps à chaque itération (peut changer via événement FPS)
                    const shouldDisplaySteps = typeof window !== 'undefined' && window.showDichotomySteps;

                    // Mettre à jour current_T0_adjusted dans window pour que waterVaporNumberDensity puisse y accéder
                    if (typeof window !== 'undefined') {
                        window.current_T0_adjusted = T0_current;
                    }
                    current_T0_adjusted = T0_current;

                    // Toujours recalculer pour avoir les valeurs à jour (le delta doit changer avec T0_current)
                    final_result = calculateFluxForT0(CO2_fraction, T0_current, options);
                    // Calculer le flux solaire absorbé avec albedo dynamique (glace + nuages)
                    // Récupérer le flux géothermique depuis l'époque courante
                    let geo_flux = null;
                    if (typeof window !== 'undefined' && window.currentEpochName) {
                        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
                        if (currentEpoch && typeof currentEpoch.geothermal_flux === 'number') {
                            geo_flux = currentEpoch.geothermal_flux;
                        }
                    }
                    // Récupérer l'état H2O depuis l'état réel du bouton (checked/unchecked)
                    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
                    const cellH2O_state = typeof document !== 'undefined' ? document.getElementById('cell-h2o') : null;
                    const h2o_enabled_state = cellH2O_state && cellH2O_state.classList.contains('checked');
                    const solar_flux_absorbed = calculateSolarFluxAbsorbed(T0_current, h2o_enabled_state, geo_flux);

                    // 🔒 CORRECTION CRITIQUE : Inclure le flux géothermique dans le bilan énergétique !
                    // Équilibre : Flux Sortant = Flux Solaire Absorbé + Flux Géothermique
                    const total_flux_in = solar_flux_absorbed + geo_flux;
                    const flux_diff = final_result.total_flux - total_flux_in;
                    
                    // 🔒 ÉQUILIBRE RADIATIF : Les aires sous les courbes affichées doivent être égales
                    // Sur le graphique :
                    // - Courbe pointillée (...) = Planck à T_effective = σT_eff⁴
                    // - Courbe pleine (___) = émission réelle spectrale = total_flux
                    // Légende : "∫ ...= ∫___" signifie équilibre des aires sous ces deux courbes
                    const STEFAN_BOLTZMANN = window.STEFAN_BOLTZMANN || 5.670374419e-8;
                    
                    // Calculer la température effective du corps noir (T° de la courbe pointillée affichée)
                    // T_eff = (total_flux / σ)^0.25
                    // 🔒 TOUJOURS calculer depuis total_flux (pas d'initialisation à T0)
                    const real_emission_flux = final_result.total_flux;
                    const T_effective = Math.pow(real_emission_flux / STEFAN_BOLTZMANN, 0.25);
                    
                    // Aire sous courbe pointillée (Planck à T_effective) : σT_eff⁴
                    const planck_effective_flux = STEFAN_BOLTZMANN * Math.pow(T_effective, 4);
                    
                    // Delta aire (équilibre des courbes affichées) : différence entre les aires sous les deux courbes
                    // ⚠️ IMPORTANT : delta_aire est TOUJOURS ~0 par définition mathématique !
                    // T_effective est calculé depuis real_emission_flux : T_eff = (real_emission_flux / σ)^0.25
                    // Donc planck_effective_flux = σT_eff⁴ = real_emission_flux (par construction)
                    // delta_aire = planck_effective_flux - real_emission_flux ≈ 0 (vérification de cohérence, pas de convergence)
                    // C'est l'équilibre mentionné dans la légende "∫ ...= ∫___"
                    const delta_aire = planck_effective_flux - real_emission_flux;
                    
                    // Delta équilibrage (pour convergence) : flux_sortant - flux_entrant
                    // C'est CE delta qui tend vers 0 pour la convergence (équilibre énergétique global)
                    const delta_equilibre = flux_diff;
                    
                    // 🔒 CORRECTION : Recalculer la tolérance à chaque itération avec T0_current
                    // La sensibilité change avec la température : ΔF = 4 * σ * T³ * ΔT
                    // À 255K, 10K = 37.6 W/m², mais à 2470K, 10K = beaucoup plus grand (≈33000 W/m²)
                    // Il faut recalculer la tolérance avec T0_current pour une précision correcte
                    const tolerance_current = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
                    
                    // Delta EDS (Effet de Serre) : différence entre corps noir théorique à T0 et émission réelle
                    // Ce delta NE TEND PAS vers 0, c'est l'effet de serre (normal qu'il reste élevé)
                    // C'est la différence entre ce que la surface émet (σT0⁴) et ce qui sort réellement
                    const blackbody_flux_T0 = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
                    const delta_eds = blackbody_flux_T0 - real_emission_flux;
                    
                    // 🔒 CALCUL DIRECT D'AJUSTEMENT DE T0 (pour information/debug)
                    // Relation approximative : dT/dF ≈ 1/(4σT³) où F est le flux
                    // Pour un delta_equilibre donné, l'ajustement de T0 serait approximativement :
                    // T0_ajusté ≈ T0 - delta_equilibre / (4σT0³)
                    // Facteur de conversion : 4σT0³ (sensibilité de la température au flux)
                    // ⚠️ PROTECTION : Cette formule n'est valide que pour de petits ajustements
                    // Quand T0 est très basse, le dénominateur devient très petit et l'ajustement devient absurde
                    let T0_adjustment_direct = 0;
                    let T0_ajuste_theorique = T0_current;
                    if (T0_current > 50) { // Seulement si T0 > 50K (éviter les valeurs absurdes)
                        const sensitivity_factor = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3);
                        if (Math.abs(sensitivity_factor) > 1e-10) { // Éviter division par zéro
                            T0_adjustment_direct = -delta_equilibre / sensitivity_factor;
                            // Limiter l'ajustement à ±1000K pour éviter les valeurs absurdes
                            T0_adjustment_direct = Math.max(-1000, Math.min(1000, T0_adjustment_direct));
                            T0_ajuste_theorique = T0_current + T0_adjustment_direct;
                        }
                    }
                    
                    // Signe * sqrt(abs(delta)) pour l'équilibrage (utiliser delta_equilibre pour la phase exponentielle)
                    // C'est le delta qui doit tendre vers 0, pas delta_aire (qui est toujours ~0 par définition)
                    // 🔒 CORRECTION : Si delta_equilibre < 0, on émet moins qu'on reçoit → il faut AUGMENTER T
                    // Donc signe×√|delta| négatif signifie qu'on doit augmenter T (incrément positif)
                    const sqrt_delta = Math.sqrt(Math.abs(delta_equilibre));
                    const signe_sqrt = delta_equilibre >= 0 ? 1 : -1; // Signe pour l'affichage
                    const sqrt_delta_signed = signe_sqrt * sqrt_delta;
                    
                    // 🔒 Afficher le log en commençant par Delta équilibre (valeur utilisée pour le calcul)
                    // Delta équilibre (→0) : flux_sortant - flux_entrant (convergence énergétique globale)
                    // Delta aire (→0) : équilibre des aires sous les courbes affichées (pointillée vs pleine) - TOUJOURS ~0 par définition
                    // Delta EDS : effet de serre (ne tend PAS vers 0, c'est normal)
                    // T0 ajusté théorique : calcul direct T0 - delta_equilibre/(4σT0³) pour référence
                    // Tolérance actuelle : recalculée avec T0_current (change avec la température)
                    const tolerance_status = Math.abs(delta_equilibre) <= tolerance_current ? '✅' : '⏳';
                    
                    // ⚠️ Vérifier si delta_equilibre est anormalement grand
                    if (Math.abs(delta_equilibre) > 10000) {
                        console.warn(`⚠️ [calculations.js] Delta équilibre anormalement grand: ${delta_equilibre.toFixed(2)} W/m² (flux_sortant=${final_result.total_flux.toFixed(2)} W/m², flux_entrant=${total_flux_in.toFixed(2)} W/m²)`);
                    }
                    
                    // Fonction pour log Delta équilibre
                    logDeltaEquilibre(delta_equilibre, T0_current, T_effective, delta_eds, tolerance_current, tolerance_status);
                    
                    // Afficher le calcul direct seulement si l'ajustement est raisonnable (T0 > 50K et ajustement < 100K)
                    // ⚠️ Cette formule linéaire n'est valide que pour de petits ajustements (ΔT << T)
                    // À 100K avec delta_equilibre = -233 W/m², l'ajustement serait -1013K (absurde)
                    // On n'affiche que si l'ajustement est < 100K (approximation valide)
                    if (T0_current > 50 && Math.abs(T0_adjustment_direct) > 0.01 && Math.abs(T0_adjustment_direct) < 100) {
                        const sensitivity_factor = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3);
                        console.log(`   📊 Calcul direct: T0_ajusté = T0 - delta_equilibre/(4σT0³) = ${T0_current.toFixed(2)}K - ${delta_equilibre.toFixed(2)}/(4σ×${T0_current.toFixed(2)}³) = ${T0_ajuste_theorique.toFixed(2)}K (ajustement: ${T0_adjustment_direct > 0 ? '+' : ''}${T0_adjustment_direct.toFixed(2)}K, sensibilité: ${sensitivity_factor.toFixed(2)} W/m²/K)`);
                    }
                    
                    // 🔒 Mettre à jour la couleur de legend-equilibre avec la température actuelle (pendant les calculs)
                    if (typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function') {
                        const tempC_current = T0_current - 273.15;
                        const color_current = window.tempSurfaceToColor(tempC_current);
                        const legendEquilibre = typeof document !== 'undefined' ? document.querySelector('.legend-equilibre') : null;
                        if (legendEquilibre) {
                            legendEquilibre.style.color = color_current;
                        }
                    }
                    
                    // 🔒 Ajouter un point à chaque cycle/phase de calcul (exponentielle ou dichotomie)
                    // Avec une pause de 0.1s pour permettre l'affichage de la courbe
                    if (typeof document !== 'undefined') {
                        const dots = document.getElementById('calculation-dots');
                        if (dots) {
                            // Ajouter le point avec un délai de 0.1s pour permettre l'affichage
                            setTimeout(() => {
                                dots.innerHTML += '.';
                            }, 100);
                        }
                    }
                    
                    // 🔒 Vérifier la convergence IMMÉDIATEMENT après le calcul (avant phase exponentielle/dichotomie)
                    // Deux critères de convergence :
                    // 1. Delta équilibre en W/m² : |delta_equilibre| <= tolerance_current (recalculé avec T0_current)
                    // 2. Variation de température : |T0_current - previousT0_for_convergence| <= precision_K
                    // Si l'un des deux est satisfait, on converge (précision en température OU en flux)
                    // 🔒 CORRECTION : Ne pas vérifier la convergence par température à la première itération (iter === 0)
                    // car previousT0_for_convergence = T0_initial = T0_current, donc |ΔT| = 0 toujours
                    // Utiliser previousT0_for_convergence AVANT de le mettre à jour (pour comparer avec l'itération précédente)
                    // previousT0_for_convergence est null à la première itération, donc on ne vérifie pas la convergence par température
                    const delta_T_convergence = previousT0_for_convergence !== null ? Math.abs(T0_current - previousT0_for_convergence) : Infinity;
                    const converged_by_flux = Math.abs(delta_equilibre) <= tolerance_current;
                    // 🔒 CORRECTION : La convergence par température est un critère secondaire
                    // Elle ne doit se déclencher QUE si l'équilibre radiatif est déjà atteint (ou presque)
                    // Si delta_equilibre est encore élevé, on continue même si la température ne bouge plus
                    const converged_by_temp = previousT0_for_convergence !== null && delta_T_convergence <= precision_K && Math.abs(delta_equilibre) <= tolerance_current * 10; // Seulement si on a une valeur précédente ET que l'équilibre est presque atteint
                    
                    if (converged_by_flux || converged_by_temp) {
                        if (converged_by_temp && !converged_by_flux) {
                            console.log(`[DICHOTOMIE] ✅ Convergence par précision température: |ΔT| = ${delta_T_convergence.toFixed(2)}K <= ${precision_K}K (delta_equilibre: ${delta_equilibre.toFixed(2)} W/m², tolerance: ${tolerance_current.toFixed(2)} W/m²)`);
                        }
                        logCalculationPhase('DICHOTOMIE CONVERGENCE', {
                            T0_final: T0_current.toFixed(2)
                        });

                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const final_options = { ...options, fullSpectre: true };
                        final_result = calculateFluxForT0(CO2_fraction, T0_current, final_options);

                        // Déclencher un événement de convergence
                        if (typeof window !== 'undefined') {
                            window.calculationConverged = true;
                            if (window.dispatchEvent) {
                                window.dispatchEvent(new CustomEvent('calculationConverged', {
                                    detail: { T0: T0_current, iteration: iter + 1 }
                                }));
                            }
                        }
                        if (!isCancelled) {
                            finalizeResults(final_result, T0_current, CO2_fraction, resolve);
                        }
                        return;
                    }
                    
                    // 🔒 Algorithme simplifié : Phase="Search" puis Phase="Dicho"
                    // Phase="Search" : T0 -= Delta équilibre jusqu'à changement de signe
                    // Phase="Dicho" : T0 = (old_T0 + T0) / 2
                    
                    // Initialiser signeDeltaFirst à la première itération
                    if (iter === 0) {
                        signeDeltaFirst = delta_equilibre < 0 ? -1 : (delta_equilibre > 0 ? 1 : 0);
                        old_T0 = T0_current;
                    }
                    
                    // Vérifier changement de signe : passer en Phase="Dicho"
                    const signeDelta = delta_equilibre < 0 ? -1 : (delta_equilibre > 0 ? 1 : 0);
                    if (Phase === "Search" && signeDeltaFirst !== 0 && signeDeltaFirst !== signeDelta) {
                        Phase = "Dicho";
                        // Initialiser les bornes pour la dichotomie
                        if (signeDeltaFirst < 0) {
                            // On était en dessous, maintenant au-dessus
                            T0_min = old_T0;
                            T0_max = T0_current;
                        } else {
                            // On était au-dessus, maintenant en dessous
                            T0_min = T0_current;
                            T0_max = old_T0;
                        }
                        console.log(`🔍 [DICH] Phase="Dicho" (min=${T0_min.toFixed(2)}K, max=${T0_max.toFixed(2)}K)`);
                    }
                    
                    // Appliquer l'algorithme selon la phase
                    if (Phase === "Search") {
                        // Phase="Search" : T0 -= Delta équilibre
                        old_T0 = T0_current;
                        T0_current = T0_current - delta_equilibre;
                        console.log(`📈 [Search] T0=${old_T0.toFixed(2)}K → ${T0_current.toFixed(2)}K (Δ=${(-delta_equilibre).toFixed(2)}K)`);
                        // Recalculer avec la nouvelle T0
                        final_result = calculateFluxForT0(CO2_fraction, T0_current, options);
                        // Recalculer delta_equilibre avec la nouvelle T0
                        const solar_flux_absorbed_new = calculateSolarFluxAbsorbed(T0_current, h2o_enabled_state, geo_flux);
                        const total_flux_in_new = solar_flux_absorbed_new + (geo_flux || 0);
                        delta_equilibre = final_result.total_flux - total_flux_in_new;
                        // Recalculer tolerance_current avec la nouvelle T0
                        tolerance_current = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
                    } else if (Phase === "Dicho") {
                        // Phase="Dicho" : T0 = (old_T0 + T0) / 2
                        old_T0 = T0_current;
                        T0_current = (T0_min + T0_max) / 2;
                        console.log(`🔍 [DICH] T0=${T0_current.toFixed(2)}K (min=${T0_min.toFixed(2)}K, max=${T0_max.toFixed(2)}K)`);
                        // Recalculer avec la nouvelle T0
                        final_result = calculateFluxForT0(CO2_fraction, T0_current, options);
                        // Recalculer delta_equilibre avec la nouvelle T0
                        const solar_flux_absorbed_new = calculateSolarFluxAbsorbed(T0_current, h2o_enabled_state, geo_flux);
                        const total_flux_in_new = solar_flux_absorbed_new + (geo_flux || 0);
                        delta_equilibre = final_result.total_flux - total_flux_in_new;
                        // Recalculer tolerance_current avec la nouvelle T0
                        tolerance_current = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
                        // Mettre à jour les bornes selon le signe de delta_equilibre
                        if (delta_equilibre < 0) {
                            // On émet moins qu'on reçoit → augmenter T (T0_min = T0_current)
                            T0_min = T0_current;
                        } else {
                            // On émet trop → diminuer T (T0_max = T0_current)
                            T0_max = T0_current;
                        }
                        // Continuer normalement (le dessin sera fait dans la boucle principale)
                        if (typeof window !== 'undefined' && typeof window.incrementTimeline === 'function') {
                            window.incrementTimeline();
                        }
                        // Ne pas faire setTimeout ici, continuer normalement pour passer par le dessin
                        // (pas de return, on continue dans la boucle)
                    }
                    
                    // 🔒 Vérifier la convergence AVANT de continuer (peu importe la phase)
                    // 🔒 CALCUL DE TOLÉRANCE : tolerance = 4 * σ * T³ * precision_K
                    // Explication : F = σT⁴ (loi de Stefan-Boltzmann)
                    // dF/dT = 4σT³ (dérivée)
                    // Donc ΔF = 4σT³ × ΔT
                    // Pour une précision de precision_K en K, la tolérance en W/m² est 4σT³ × precision_K
                    // Exemple : à 255K avec precision_K=0.1K → tolerance = 4×5.67e-8×255³×0.1 ≈ 0.38 W/m²
                    // Deux critères de convergence :
                    // 1. Delta équilibre en W/m² : |delta_equilibre| <= tolerance_current (recalculé avec T0_current)
                    // 2. Variation de température : |T0_current - previousT0_for_convergence| <= precision_K
                    // 🔒 CORRECTION : Ne pas vérifier la convergence par température à la première itération
                    // previousT0_for_convergence est null à la première itération, donc on ne vérifie pas la convergence par température
                    const delta_T_convergence_check = previousT0_for_convergence !== null ? Math.abs(T0_current - previousT0_for_convergence) : Infinity;
                    const converged_by_flux_check = Math.abs(delta_equilibre) <= tolerance_current;
                    // 🔒 CORRECTION : La convergence par température est un critère secondaire
                    // Elle ne doit se déclencher QUE si l'équilibre radiatif est déjà atteint (ou presque)
                    // Si delta_equilibre est encore élevé, on continue même si la température ne bouge plus
                    const converged_by_temp_check = previousT0_for_convergence !== null && delta_T_convergence_check <= precision_K && Math.abs(delta_equilibre) <= tolerance_current * 10; // Seulement si on a une valeur précédente ET que l'équilibre est presque atteint
                    
                    if (converged_by_flux_check || converged_by_temp_check) {
                        if (converged_by_temp_check && !converged_by_flux_check) {
                            console.log(`[DICHOTOMIE] ✅ Convergence par précision température: |ΔT| = ${delta_T_convergence_check.toFixed(2)}K <= ${precision_K}K (delta_equilibre: ${delta_equilibre.toFixed(2)} W/m², tolerance: ${tolerance_current.toFixed(2)} W/m²)`);
                        }
                        logCalculationPhase('DICHOTOMIE CONVERGENCE', {
                            T0_final: T0_current.toFixed(2)
                        });

                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const final_options = { ...options, fullSpectre: true };
                        final_result = calculateFluxForT0(CO2_fraction, T0_current, final_options);

                        // Déclencher un événement de convergence pour permettre l'augmentation de précision
                        if (typeof window !== 'undefined') {
                            window.calculationConverged = true;
                            // Déclencher un événement personnalisé
                            if (window.dispatchEvent) {
                                window.dispatchEvent(new CustomEvent('calculationConverged', {
                                    detail: { T0: T0_current, iteration: iter + 1 }
                                }));
                            }
                        }
                        if (!isCancelled) {
                            finalizeResults(final_result, T0_current, CO2_fraction, resolve);
                        }
                        return;
                    }

                    // S'assurer que T0_min et T0_max sont bien définis pour la dichotomie
                    if (Phase === "Dicho" && (T0_min === undefined || T0_max === undefined || T0_min >= T0_max)) {
                        // Si les bornes ne sont pas définies, les initialiser
                        if (flux_diff > 0) {
                            // On émet trop, diminuer T0
                            T0_max = T0_current;
                            T0_min = Math.max(200, T0_current - 100); // Borne inférieure
                        } else {
                            // On émet pas assez, augmenter T0
                            T0_min = T0_current;
                            T0_max = Math.min(3000, T0_current + 100); // Borne supérieure
                        }
                    }

                    // 🔒 CASSER LA DOUBLE BOUCLE : incrémenter, dessiner, puis vérifier conditions
                    iter++;
                    
                    // Afficher chaque étape de la dichotomie seulement si demandé
                    // 🔒 Vérifier shouldDisplaySteps à chaque itération (peut changer via bouton anim)
                    const shouldDisplayStepsIter = typeof window !== 'undefined' && window.showDichotomySteps;
                    
                    // 🔒 Vérifier conditions de sortie AVANT de dessiner (pour éviter de dessiner inutilement)
                    // 🔒 IMPORTANT : tolerance_current est pour la convergence (delta_equilibre), pas pour delta_aire
                    // delta_aire est toujours ~0 par définition (T_effective est calculé depuis total_flux)
                    // On utilise delta_equilibre pour la convergence, pas delta_aire
                    // tolerance_current est recalculé à chaque itération avec T0_current pour une précision correcte
                    // Deux critères de convergence : flux OU température
                    // 🔒 CORRECTION : Ne pas vérifier la convergence par température à la première itération
                    // Utiliser previousT0_for_convergence AVANT de le mettre à jour (pour comparer avec l'itération précédente)
                    // previousT0_for_convergence est null à la première itération, donc on ne vérifie pas la convergence par température
                    const delta_T_final = previousT0_for_convergence !== null ? Math.abs(T0_current - previousT0_for_convergence) : Infinity;
                    const converged_by_flux_final = Math.abs(delta_equilibre) < tolerance_current;
                    // 🔒 CORRECTION : La convergence par température est un critère secondaire
                    // Elle ne doit se déclencher QUE si l'équilibre radiatif est déjà atteint (ou presque)
                    // Si delta_equilibre est encore élevé, on continue même si la température ne bouge plus
                    const converged_by_temp_final = previousT0_for_convergence !== null && delta_T_final <= precision_K && Math.abs(delta_equilibre) <= tolerance_current * 10; // Seulement si on a une valeur précédente ET que l'équilibre est presque atteint
                    
                    if (iter > 20 || converged_by_flux_final || converged_by_temp_final) {
                        // Condition de sortie atteinte
                        if (iter > 20) {
                            console.log('[calculations.js] ⚠️ Maximum d\'itérations atteint (20)');
                        } else if (converged_by_temp_final && !converged_by_flux_final) {
                            console.log(`[calculations.js] ✅ Convergence par précision température: |ΔT| = ${delta_T_final.toFixed(2)}K <= ${precision_K}K (delta_equilibre: ${delta_equilibre.toFixed(2)} W/m², tolerance: ${tolerance_current.toFixed(2)} W/m²)`);
                        } else {
                            console.log(`[calculations.js] ✅ Convergence atteinte (delta_equilibre: ${Math.abs(delta_equilibre).toFixed(4)} < tolerance: ${tolerance_current.toFixed(4)} W/m² à T=${T0_current.toFixed(2)}K)`);
                        }
                        
                        logCalculationPhase('DICHOTOMIE CONVERGENCE', {
                            T0_final: T0_current.toFixed(2)
                        });

                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const final_options = { ...options, fullSpectre: true };
                        final_result = calculateFluxForT0(CO2_fraction, T0_current, final_options);

                        // Déclencher un événement de convergence
                        if (typeof window !== 'undefined') {
                            window.calculationConverged = true;
                            if (window.dispatchEvent) {
                                window.dispatchEvent(new CustomEvent('calculationConverged', {
                                    detail: { T0: T0_current, iteration: iter }
                                }));
                            }
                        }
                        if (!isCancelled) {
                            finalizeResults(final_result, T0_current, CO2_fraction, resolve);
                        }
                        return;
                    }
                    
                    // Mettre à jour previousT0_for_convergence pour la prochaine itération (APRÈS vérification de convergence)
                    // Si on continue, on met à jour pour la prochaine comparaison
                    previousT0_for_convergence = T0_current;
                    
                    // 🔒 Dessiner après avoir vérifié qu'on continue (utiliser requestAnimationFrame pour laisser le navigateur rendre)
                    if (shouldDisplayStepsIter && !isCancelled) {
                        displayDichotomyStep(CO2_fraction, T0_current, final_result, iter, false, options);
                        
                        // 🔒 Utiliser requestAnimationFrame pour laisser le navigateur dessiner avant de continuer
                        // Double RAF pour s'assurer que le rendu est fait
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                // Continuer après que le navigateur ait eu le temps de rendre
                                setTimeout(() => {
                                    iterate();
                                }, 50); // Petit délai supplémentaire pour laisser le temps de rendre
                            });
                        });
                        return; // Sortir pour laisser le temps de rendre
                    }

                    // Mettre à jour les labels du flux pendant le calcul
                    if (typeof window !== 'undefined' && typeof window.updateFluxLabels === 'function') {
                        // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked)
                        const cellH2O_iter = typeof document !== 'undefined' ? document.getElementById('cell-h2o') : null;
                        // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
                        const h2o_enabled = cellH2O_iter && cellH2O_iter.classList.contains('checked');

                        // 🔒 UTILISER geo_flux (variable locale déjà calculée correctement ci-dessus)
                        // au lieu de le recalculer (potentiellement mal) via getGeologicalPeriodByName
                        // let geo_flux = null; ... REMOVED

                        const albedo = calculateAlbedo(T0_current, h2o_enabled, geo_flux);
                        const cloud_coverage = calculateCloudCoverage(T0_current, h2o_enabled);
                        const co2_ppm = CO2_fraction * 1e6;
                        const ch4_ppm = (options && options.CH4_fraction) ? options.CH4_fraction * 1e6 : 0;

                        // Mettre à jour les labels avec les valeurs actuelles
                        window.updateFluxLabels({
                            T0: T0_current,
                            temp_surface: T0_current,
                            total_flux: final_result.total_flux,
                            albedo: albedo,
                            cloud_coverage: cloud_coverage,
                            co2_ppm: co2_ppm,
                            ch4_ppm: ch4_ppm,
                            geo_flux: geo_flux, // Passer geo_flux explicitement
                            planet_radius: (options && options.planet_radius) ? options.planet_radius : 6371000 // Passer le rayon
                        });
                    }

                    // 🔒 Vérification de convergence déjà faite plus haut (après incrément et dessin)

                    if (flux_diff > 0) {
                        // Flux trop élevé, diminuer T0
                        // 🔒 Mettre à jour T0_max seulement si on n'a pas encore de borne supérieure valide
                        if (T0_max > T0_current || T0_max === T0_initial + 50) {
                        T0_max = T0_current;
                        }

                        // ⚡ OPTIMISATION : Méthode Regula Falsi (Fausse Position) au lieu de Dichotomie simple
                        // Au lieu de prendre le milieu (T_min + T_max)/2, on utilise l'erreur relative
                        // pour estimer où le zéro se trouve probablement.
                        // Comme Flux ~ T^4, la fonction est monotone et convexe/concave, donc très prédictible.

                        // Sauvegarder la différence de flux pour les bornes (si disponible)
                        if (typeof window.flux_diff_min === 'undefined') window.flux_diff_min = -1e9; // Valeur très négative par défaut
                        if (typeof window.flux_diff_max === 'undefined') window.flux_diff_max = 1e9;  // Valeur très positive par défaut

                        window.flux_diff_max = flux_diff;

                        // Si on a des bornes valides avec des signes opposés, utiliser Regula Falsi
                        if (window.flux_diff_min < 0 && window.flux_diff_max > 0) {
                            // Formule de la sécante : x = a - f(a) * (b - a) / (f(b) - f(a))
                            // Ici a = T0_min, b = T0_max
                            const delta = (T0_max - T0_min);
                            const df = (window.flux_diff_max - window.flux_diff_min);

                            // Interpolation linéaire
                            let T0_next = T0_min - window.flux_diff_min * (delta / df);

                            // 🔒 SÉCURITÉ : Garder une marge par rapport aux bords (éviter stagnation)
                            // Ne pas aller trop près des bornes (min 10% de l'intervalle)
                            const safety_margin = delta * 0.1;
                            T0_next = Math.max(T0_min + safety_margin, Math.min(T0_max - safety_margin, T0_next));

                            T0_current = T0_next;
                        } else {
                            // Fallback Dichotomie classique si pas assez d'infos
                            T0_current = (T0_min + T0_max) / 2;
                        }
                    } else {
                        // Flux trop faible, augmenter T0 (dichotomie classique)
                        T0_min = T0_current;

                        // Sauvegarder la différence de flux
                        if (typeof window.flux_diff_min === 'undefined') window.flux_diff_min = -1e9;
                        if (typeof window.flux_diff_max === 'undefined') window.flux_diff_max = 1e9;

                        window.flux_diff_min = flux_diff;

                        // Si on a des bornes valides avec des signes opposés, utiliser Regula Falsi
                        if (window.flux_diff_min < 0 && window.flux_diff_max > 0) {
                            const delta = (T0_max - T0_min);
                            const df = (window.flux_diff_max - window.flux_diff_min);

                            let T0_next = T0_min - window.flux_diff_min * (delta / df);

                            // 🔒 SÉCURITÉ
                            const safety_margin = delta * 0.1;
                            T0_next = Math.max(T0_min + safety_margin, Math.min(T0_max - safety_margin, T0_next));

                            T0_current = T0_next;
                        } else {
                            T0_current = (T0_min + T0_max) / 2;
                        }
                    }

                    // Incrémenter le temps à chaque itération de dichotomie
                    if (typeof window !== 'undefined' && typeof window.incrementTimeline === 'function') {
                        window.incrementTimeline();
                    }

                    // Mettre à jour l'overlay (barre de progression avec .)
                    // Avec une pause de 0.1s pour permettre l'affichage de la courbe
                    if (typeof document !== 'undefined') {
                        const dots = document.getElementById('calculation-dots');
                        if (dots) {
                            // Ajouter un '.' à chaque étape de dichotomie (boucle externe)
                            // Avec un délai de 0.1s pour permettre l'affichage
                            setTimeout(() => {
                                dots.innerHTML += '.';
                            }, 100);
                        }
                    }

                    // Continuer avec un délai pour permettre la visualisation
                    if (shouldDisplaySteps && !isCancelled) {
                        const timeoutId = setTimeout(iterate, 100); // Délai de 0.1s pour visualiser chaque étape
                        timeoutIds.push(timeoutId);
                    } else if (!isCancelled) {
                        const timeoutId = setTimeout(iterate, 0); // Pas de délai si pas d'affichage (calculs de référence)
                        timeoutIds.push(timeoutId);
                    }
                };

                iterate();
            };

            const initialTimeoutId = setTimeout(performDichotomy, 500); // Attendre 500ms après l'affichage initial
            timeoutIds.push(initialTimeoutId);

            // Stocker les timeoutIds pour pouvoir les annuler
            if (typeof window !== 'undefined') {
                if (!window.calculationTimeouts) {
                    window.calculationTimeouts = [];
                }
                window.calculationTimeouts.push(...timeoutIds);
            }
        });
    } else {
        // Mode synchrone (si pas de setTimeout disponible) - pas d'affichage progressif
        while (iteration < max_iterations) {
            result = calculateFluxForT0(CO2_fraction, T0, options);
            
            // Calculer le flux solaire absorbé avec albedo dynamique (glace + nuages)
            // Récupérer le flux géothermique depuis l'époque courante
            let geo_flux = null;
            if (typeof window !== 'undefined' && window.currentEpochName) {
                const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
                if (currentEpoch && typeof currentEpoch.geothermal_flux === 'number') {
                    geo_flux = currentEpoch.geothermal_flux;
                }
            }
            const solar_flux_absorbed = calculateSolarFluxAbsorbed(T0, h2o_enabled, geo_flux);
            const flux_diff = result.total_flux - solar_flux_absorbed;

            // 🔒 CORRECTION : Recalculer la tolérance avec T0 actuel (mode synchrone)
            // La sensibilité change avec la température : ΔF = 4 * σ * T³ * ΔT
            const tolerance_sync = 4 * STEFAN_BOLTZMANN * Math.pow(T0, 3) * precision_K;

            // 🔒 DÉSACTIVÉ : Ne plus incrémenter le temps à chaque itération de dichotomie
            // L'incrémentation se fait uniquement lors des clics sur boutons (météorite glace, etc.)
            // if (typeof window !== 'undefined' && typeof window.incrementTimeline === 'function') {
            //     window.incrementTimeline();
            // }

            if (Math.abs(flux_diff) < tolerance_sync) {
                // Convergence atteinte : recalculer avec spectre complet pour précision finale
                const final_options = { ...options, fullSpectre: true };
                result = calculateFluxForT0(CO2_fraction, T0, final_options);

                if (typeof window !== 'undefined') {
                    window.calculationConverged = true;
                    // Déclencher un événement personnalisé
                    if (window.dispatchEvent) {
                        window.dispatchEvent(new CustomEvent('calculationConverged', {
                            detail: { T0: T0, iteration: iteration }
                        }));
                    }
                }
                break;
            }

            if (flux_diff > 0) {
                // Flux trop élevé, diminuer T0
                T0_max = T0;

                // ⚡ OPTIMISATION : Méthode Regula Falsi (Fausse Position)
                if (typeof window !== 'undefined') {
                    window.flux_diff_max = flux_diff;

                    if (window.flux_diff_min < 0 && window.flux_diff_max > 0) {
                        const delta = (T0_max - T0_min);
                        const df = (window.flux_diff_max - window.flux_diff_min);
                        let T0_next = T0_min - window.flux_diff_min * (delta / df);

                        // 🔒 SÉCURITÉ
                        const safety_margin = delta * 0.1;
                        T0_next = Math.max(T0_min + safety_margin, Math.min(T0_max - safety_margin, T0_next));

                        T0 = T0_next;
                    } else {
                        T0 = (T0_min + T0_max) / 2;
                    }
                } else {
                    T0 = (T0_min + T0_max) / 2;
                }
            } else {
                // Flux trop faible, augmenter T0
                T0_min = T0;

                // Sauvegarder la différence de flux
                if (typeof window !== 'undefined') {
                    window.flux_diff_min = flux_diff;

                    if (window.flux_diff_min < 0 && window.flux_diff_max > 0) {
                        const delta = (T0_max - T0_min);
                        const df = (window.flux_diff_max - window.flux_diff_min);
                        let T0_next = T0_min - window.flux_diff_min * (delta / df);

                        // 🔒 SÉCURITÉ
                        const safety_margin = delta * 0.1;
                        T0_next = Math.max(T0_min + safety_margin, Math.min(T0_max - safety_margin, T0_next));

                        T0 = T0_next;
                    } else {
                        T0 = (T0_min + T0_max) / 2;
                    }
                } else {
                    T0 = (T0_min + T0_max) / 2;
                }
            }

            iteration++;
        }


        // Stocker la T0 ajustée
        current_T0_adjusted = T0;

        // Utiliser les résultats de la dernière itération
        const { lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux } = result;

        return finalizeResultsSync(result, T0, lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux, CO2_fraction);
    }
}

// Fonction pour finaliser les résultats (mode asynchrone)
function finalizeResults(final_result, final_T0, CO2_fraction, resolve) {
    const logo = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CO2) ? window.LOGOS.CO2 : '🏭';
    console.log(`${logo} [finalizeResults@calculations.js] T0=${final_T0?.toFixed(2) || 'N/A'}K flux=${final_result?.total_flux?.toFixed(2) || 'N/A'}W/m²`);
    // 🔒 Réactiver l'affichage du spectre à la fin des calculs (même si FPS était bas pendant)
    if (typeof window !== 'undefined') {
        window.showSpectralBackground = true;
    }
    
    // Cacher l'overlay de calcul
    if (typeof document !== 'undefined') {
        const overlay = document.getElementById('calculation-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Stocker la T0 ajustée
    current_T0_adjusted = final_T0;

    // Utiliser les résultats de la dernière itération
    const { lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux } = final_result;

    // Note importante : Ce modèle ne prend en compte QUE le CO2
    // Les 15°C réels de la Terre incluent aussi :
    // - Vapeur d'eau (H2O) : effet de serre majeur
    // - Méthane (CH4), protoxyde d'azote (N2O), etc.
    // - Nuages : effet de serre très important
    // Donc les températures calculées ici seront plus basses que la réalité
    //
    // Vérification avec la littérature :
    // - T_eff sans effet de serre : ~255 K (-18°C) ✓ (cohérent)
    // - T0 à 0 ppm : 255.28 K (-18.0°C) ✓
    // - T0 à 280 ppm : 266.21 K (-6.9°C) - effet de serre du CO2 seul
    // - T0 à 420 ppm : 266.80 K (-6.3°C) - effet de serre du CO2 seul
    // - Différence 420-280 ppm : 0.59 K (modèle complet) vs ~1.74 K (formule simplifiée)

    // Calculer le flux total au sommet de l'atmosphère
    const total_flux = upward_flux[upward_flux.length - 1].reduce((sum, val) => sum + val, 0);

    // Calculer l'albedo dynamique et la couverture nuageuse
    // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked) au lieu de se fier uniquement à window.waterVaporEnabled
    const cellH2O = typeof document !== 'undefined' ? document.getElementById('cell-h2o') : null;
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const h2o_enabled = cellH2O && cellH2O.classList.contains('checked');
    // Récupérer le flux géothermique depuis l'époque courante
    // 🔒 Utiliser calculateGeothermalFlux si disponible (nouveau système)
    let geo_flux = null;
    if (typeof window !== 'undefined' && window.currentEpochName) {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            // 🔒 Priorité absolue au flux géothermique direct (dynamique ou statique)
            if (typeof currentEpoch.geothermal_flux === 'number') {
                geo_flux = currentEpoch.geothermal_flux;
            }
            // Fallback legacy (ne devrait plus être utilisé car getGeologicalPeriodByName injecte geothermal_flux)
            else if (typeof window.calculateGeothermalFlux === 'function' &&
                typeof currentEpoch.core_temperature === 'number' &&
                typeof currentEpoch.geothermal_diffusion_factor === 'number') {
                geo_flux = window.calculateGeothermalFlux(currentEpoch.core_temperature, currentEpoch.geothermal_diffusion_factor);
            }
        }
    }
    // Récupérer CH4 pour détecter le cas du corps noir
    const ch4_enabled = (typeof window !== 'undefined' && window.methaneEnabled !== undefined)
        ? window.methaneEnabled
        : false;
    // Dans finalizeResults, on n'a pas accès direct à CH4_fraction depuis options
    // On suppose que si ch4_enabled est false, alors CH4_fraction est null ou 0
    const CH4_fraction = null; // Approximation : sera vérifié via ch4_enabled

    // ✅ SCIENTIFIQUEMENT CERTAIN : Température effective (loi de Stefan-Boltzmann)
    // - T_eff = (F/σ)^(1/4) où F est le flux radiatif total et σ la constante de Stefan-Boltzmann
    // - Cette formule est exacte pour un corps noir en équilibre radiatif
    // - Pour la Terre sans effet de serre : T_eff ≈ 255K (-18°C) - valeur bien établie
    // ⚠️ CAS PARTICULIER : Corps noir (pas d'atmosphère, albedo = 0)
    //   → Pas d'effet de serre, donc temp_surface = effective_temperature
    //   → On utilise final_T0 directement pour éviter les erreurs numériques
    const STEFAN_BOLTZMANN = window.STEFAN_BOLTZMANN || 5.670374419e-8;
    const isBlackBody = (CO2_fraction === 0 || CO2_fraction === null) && !h2o_enabled && (!ch4_enabled || !CH4_fraction);
    const effective_temperature = isBlackBody
        ? final_T0  // Corps noir : utiliser directement temp_surface (formule analytique exacte)
        : Math.pow(total_flux / STEFAN_BOLTZMANN, 0.25);  // Avec atmosphère : calculer depuis flux_total

    // 🔒 FORCER le recalcul de la glace avant de calculer l'albedo
    // Si H2O est activé, recalculer h2oIceFractionFromCalculation avec la température finale
    if (h2o_enabled && typeof window !== 'undefined' && typeof window.calculateH2OParameters === 'function') {
        const h2o_vapor_percent = (typeof window.h2oVaporPercent !== 'undefined') ? window.h2oVaporPercent : 0;
        const h2o_from_meteorites = (typeof window.h2oTotalFromMeteorites !== 'undefined') ? window.h2oTotalFromMeteorites : 0;
        const h2o_total_percent = h2o_vapor_percent + h2o_from_meteorites;
        
        if (h2o_total_percent > 0) {
            // Calculer la répartition vapeur/glace selon la température finale
            const h2o_params = window.calculateH2OParameters(final_T0, h2o_total_percent, null);
            // Mettre à jour h2oIceFractionFromCalculation pour que calculateAlbedo() l'utilise
            window.h2oIceFractionFromCalculation = h2o_params.ice_fraction;
        }
    }

    const albedo = calculateAlbedo(final_T0, h2o_enabled, geo_flux);
    const cloud_coverage = calculateCloudCoverage(final_T0, h2o_enabled);
    
    // Log albedo
    console.log(`🌍 Albedo: ${(albedo * 100).toFixed(1)}%`);

    // Calculer EDS (Effet de Serre) = Flux Surface - Flux Sortant
    const flux_surface = STEFAN_BOLTZMANN * Math.pow(final_T0, 4);
    const eds = flux_surface - total_flux;
    
    // 🔒 Mettre à jour la couleur avec la température finale (après convergence)
    if (typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function' && typeof window.updateBlackBodyColor === 'function') {
        const tempC_final = final_T0 - 273.15;
        const color_final = window.tempSurfaceToColor(tempC_final);
        window.updateBlackBodyColor(color_final);
        
        // Mettre à jour legend-equilibre avec la couleur finale
        const legendEquilibre = typeof document !== 'undefined' ? document.querySelector('.legend-equilibre') : null;
        if (legendEquilibre) {
            legendEquilibre.style.color = color_final;
        }
    }
    
    // Log EDS et T° finale
    console.log(`🔥 EDS: ${eds.toFixed(1)} W/m²`);
    console.log(`🌡️ T° finale: ${final_T0.toFixed(2)}K (${(final_T0 - 273.15).toFixed(1)}°C)`);

    // 🔒 Mettre à jour window.plotData.temp_surface pour que prev_T0 soit disponible au prochain calcul
    if (typeof window !== 'undefined') {
        if (!window.plotData) {
            window.plotData = {};
        }
        window.plotData.temp_surface = final_T0;
        window.plotData.temp_surface_c = final_T0 - 273.15;
    }

    const final_result_obj = {
        lambda_range: lambda_range,
        lambda_weights: lambda_weights, // ⚡ Nécessaire pour normalisation correcte dans plot.js
        z_range: z_range,
        upward_flux: upward_flux,
        optical_thickness: optical_thickness,
        emitted_flux: emitted_flux,
        absorbed_flux: absorbed_flux,
        earth_flux: earth_flux,
        total_flux: total_flux,
        effective_temperature: effective_temperature,
        albedo: albedo,
        cloud_coverage: cloud_coverage,
        T0: final_T0, // 🔒 Température de surface (K) - nécessaire pour updateH2OLevelDirect
        temp_surface: final_T0, // 🔒 Alias pour compatibilité
        temp_surface_c: final_T0 - 273.15 // 🔒 Température de surface (°C) - nécessaire pour updateH2OLevelDirect
    };

    // 🔒 Mettre à jour la visualisation spectrale avant de résoudre
    // Forcer la précision maximale (1px) à la fin des calculs si pas déjà fait
    if (typeof window !== 'undefined') {
        // Réactiver l'affichage du fond spectral (au cas où il aurait été désactivé)
        window.showSpectralBackground = true;
        // Forcer la précision maximale (1px) pour le recalcul final
        window.spectralConverged = true;
        window.spectralPrecisionTarget = 'max';
    }
    
    if (typeof window !== 'undefined' && typeof window.updateSpectralVisualization === 'function') {
        // 🔒 Utiliser un délai plus long pour s'assurer que updatePlot a fini
        setTimeout(() => {
            const canvas = document.getElementById('spectral-visualization');
            if (canvas) {
                // 🔒 FORCER la visibilité du canvas avec !important
                canvas.style.setProperty('display', 'block', 'important');
                canvas.style.setProperty('visibility', 'visible', 'important');
                canvas.style.setProperty('opacity', '1', 'important');
                canvas.style.setProperty('z-index', '1', 'important');
                canvas.style.setProperty('position', 'absolute', 'important');
            }
            // Créer un objet avec les données nécessaires pour la visualisation
            const spectralData = {
                upward_flux: upward_flux,
                lambda_range: lambda_range,
                z_range: z_range
            };
            // 🔒 S'assurer que showSpectralBackground est toujours true avant de mettre à jour
            if (typeof window !== 'undefined') {
                window.showSpectralBackground = true;
            }
            // 🔒 Recalculer avec précision maximale (1px) à la fin
            window.updateSpectralVisualization(spectralData);
            
            // 🔒 Vérifier après un court délai que le canvas est toujours visible
            setTimeout(() => {
                const canvasCheck = document.getElementById('spectral-visualization');
                if (canvasCheck && (canvasCheck.style.display === 'none' || canvasCheck.style.visibility === 'hidden' || canvasCheck.style.opacity === '0')) {
                    console.warn('[finalizeResults] ⚠️ Canvas spectral caché après mise à jour, réactivation...');
                    canvasCheck.style.setProperty('display', 'block', 'important');
                    canvasCheck.style.setProperty('visibility', 'visible', 'important');
                    canvasCheck.style.setProperty('opacity', '1', 'important');
                    // Redessiner avec les mêmes données
                    if (typeof window.updateSpectralVisualization === 'function') {
                        window.updateSpectralVisualization(spectralData);
                    }
                }
            }, 300);
        }, 250); // Délai plus long pour laisser updatePlot finir
    }

    resolve(final_result_obj);
}

// Fonction pour finaliser les résultats (mode synchrone)
function finalizeResultsSync(result, T0, lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux, CO2_fraction) {
    const logo = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CO2) ? window.LOGOS.CO2 : '🏭';
    console.log(`${logo} [finalizeResultsSync@calculations.js] T0=${T0?.toFixed(2) || 'N/A'}K emitted=${emitted_flux?.toFixed(2) || 'N/A'}W/m² absorbed=${absorbed_flux?.toFixed(2) || 'N/A'}W/m²`);
    // Calculer le flux total au sommet de l'atmosphère
    const total_flux = upward_flux[upward_flux.length - 1].reduce((sum, val) => sum + val, 0);

    // Récupérer h2o_enabled pour calculer l'albedo dynamique et la couverture nuageuse
    // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked) au lieu de se fier uniquement à window.waterVaporEnabled
    const cellH2O = typeof document !== 'undefined' ? document.getElementById('cell-h2o') : null;
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const h2o_enabled = cellH2O && cellH2O.classList.contains('checked');
    // Récupérer le flux géothermique depuis l'époque courante
    // 🔒 Utiliser calculateGeothermalFlux si disponible (nouveau système)
    let geo_flux = null;
    if (typeof window !== 'undefined' && window.currentEpochName) {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            // 🔒 Priorité absolue au flux géothermique direct (dynamique ou statique)
            if (typeof currentEpoch.geothermal_flux === 'number') {
                geo_flux = currentEpoch.geothermal_flux;
            }
            // Fallback legacy (ne devrait plus être utilisé car getGeologicalPeriodByName injecte geothermal_flux)
            else if (typeof window.calculateGeothermalFlux === 'function' &&
                typeof currentEpoch.core_temperature === 'number' &&
                typeof currentEpoch.geothermal_diffusion_factor === 'number') {
                geo_flux = window.calculateGeothermalFlux(currentEpoch.core_temperature, currentEpoch.geothermal_diffusion_factor);
            }
        }
    }
    const solar_flux_absorbed = calculateSolarFluxAbsorbed(T0, h2o_enabled, geo_flux);
    // 🔒 FORCER le recalcul de la glace avant de calculer l'albedo (mode synchrone)
    // Si H2O est activé, recalculer h2oIceFractionFromCalculation avec la température finale
    if (h2o_enabled && typeof window !== 'undefined' && typeof window.calculateH2OParameters === 'function') {
        const h2o_vapor_percent = (typeof window.h2oVaporPercent !== 'undefined') ? window.h2oVaporPercent : 0;
        const h2o_from_meteorites = (typeof window.h2oTotalFromMeteorites !== 'undefined') ? window.h2oTotalFromMeteorites : 0;
        const h2o_total_percent = h2o_vapor_percent + h2o_from_meteorites;
        
        if (h2o_total_percent > 0) {
            // Calculer la répartition vapeur/glace selon la température finale
            const h2o_params = window.calculateH2OParameters(T0, h2o_total_percent, null);
            // Mettre à jour h2oIceFractionFromCalculation pour que calculateAlbedo() l'utilise
            window.h2oIceFractionFromCalculation = h2o_params.ice_fraction;
        }
    }
    
    const albedo = calculateAlbedo(T0, h2o_enabled, geo_flux);
    const cloud_coverage = calculateCloudCoverage(T0, h2o_enabled);
    
    // Log albedo
    console.log(`🌍 Albedo: ${(albedo * 100).toFixed(1)}%`);
    
    // 🔒 Mettre à jour la couleur avec la température finale (après convergence, mode synchrone)
    if (typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function' && typeof window.updateBlackBodyColor === 'function') {
        const tempC_final = T0 - 273.15;
        const color_final = window.tempSurfaceToColor(tempC_final);
        window.updateBlackBodyColor(color_final);
        
        // Mettre à jour legend-equilibre avec la couleur finale
        const legendEquilibre = typeof document !== 'undefined' ? document.querySelector('.legend-equilibre') : null;
        if (legendEquilibre) {
            legendEquilibre.style.color = color_final;
        }
    }

    // Récupérer CH4 pour détecter le cas du corps noir
    const ch4_enabled = (typeof window !== 'undefined' && window.methaneEnabled !== undefined)
        ? window.methaneEnabled
        : false;
    // Dans finalizeResultsSync, on n'a pas accès direct à CH4_fraction depuis options
    // On suppose que si ch4_enabled est false, alors CH4_fraction est null ou 0
    const CH4_fraction = null; // Approximation : sera vérifié via ch4_enabled

    // ✅ SCIENTIFIQUEMENT CERTAIN : Température effective (loi de Stefan-Boltzmann)
    // - T_eff = (F/σ)^(1/4) où F est le flux radiatif total et σ la constante de Stefan-Boltzmann
    // - Cette formule est exacte pour un corps noir en équilibre radiatif
    // - Pour la Terre sans effet de serre : T_eff ≈ 255K (-18°C) - valeur bien établie
    // ⚠️ CAS PARTICULIER : Corps noir (pas d'atmosphère, albedo = 0)
    //   → Pas d'effet de serre, donc temp_surface = effective_temperature
    //   → On utilise T0 directement pour éviter les erreurs numériques
    const isBlackBody = (CO2_fraction === 0 || CO2_fraction === null) && !h2o_enabled && (!ch4_enabled || !CH4_fraction);
    const effective_temperature = isBlackBody
        ? T0  // Corps noir : utiliser directement temp_surface (formule analytique exacte)
        : Math.pow(total_flux / STEFAN_BOLTZMANN, 0.25);  // Avec atmosphère : calculer depuis flux_total

    // Calculer EDS (Effet de Serre) = Flux Surface - Flux Sortant
    const STEFAN_BOLTZMANN = window.STEFAN_BOLTZMANN || 5.670374419e-8;
    const flux_surface = STEFAN_BOLTZMANN * Math.pow(T0, 4);
    const eds = flux_surface - total_flux;
    
    // Log EDS et T° finale
    console.log(`🔥 EDS: ${eds.toFixed(1)} W/m²`);
    console.log(`🌡️ T° finale: ${T0.toFixed(2)}K (${(T0 - 273.15).toFixed(1)}°C)`);

    // 🔒 Mettre à jour la visualisation spectrale (mode synchrone)
    // Forcer la précision maximale (1px) à la fin des calculs si pas déjà fait
    if (typeof window !== 'undefined') {
        // Réactiver l'affichage du fond spectral (au cas où il aurait été désactivé)
        window.showSpectralBackground = true;
        // Forcer la précision maximale (1px) pour le recalcul final
        window.spectralConverged = true;
        window.spectralPrecisionTarget = 'max';
        
        // Mettre à jour le fond spectral avec les données finales
        if (typeof window.updateSpectralVisualization === 'function') {
            // Utiliser setTimeout pour laisser le DOM se mettre à jour (même en mode synchrone)
            setTimeout(() => {
                const canvas = document.getElementById('spectral-visualization');
                if (canvas) {
                    canvas.style.setProperty('display', 'block', 'important');
                    canvas.style.setProperty('visibility', 'visible', 'important');
                    canvas.style.setProperty('opacity', '1', 'important');
                    canvas.style.setProperty('z-index', '1', 'important');
                    canvas.style.setProperty('position', 'absolute', 'important');
                }
                // Créer un objet avec les données nécessaires pour la visualisation
                const spectralData = {
                    upward_flux: upward_flux,
                    lambda_range: lambda_range,
                    z_range: z_range
                };
                // 🔒 Recalculer avec précision maximale (1px) à la fin
                window.updateSpectralVisualization(spectralData);
            }, 150);
        }
    }

    return {
        lambda_range: lambda_range,
        lambda_weights: lambda_weights, // ⚡ Nécessaire pour normalisation correcte dans plot.js
        z_range: z_range,
        upward_flux: upward_flux,
        optical_thickness: optical_thickness,
        emitted_flux: emitted_flux,
        absorbed_flux: absorbed_flux,
        earth_flux: earth_flux,
        total_flux: total_flux,
        effective_temperature: effective_temperature,
        albedo: albedo,
        cloud_coverage: cloud_coverage,
        T0: T0, // 🔒 Température de surface (K) - nécessaire pour updateH2OLevelDirect
        temp_surface: T0, // 🔒 Alias pour compatibilité
        temp_surface_c: T0 - 273.15 // 🔒 Température de surface (°C) - nécessaire pour updateH2OLevelDirect
    };
}

// ============================================================================
// EXPORT POUR UTILISATION
// ============================================================================

// Exposer les fonctions globalement pour être accessibles depuis main.js
if (typeof window !== 'undefined') {
    window.simulateRadiativeTransfer = simulateRadiativeTransfer;
    // Ne pas exposer les wrappers calculateAlbedo et calculateSolarFluxAbsorbed
    // car ils appellent window.calculateAlbedo et window.calculateSolarFluxAbsorbed
    // qui sont déjà exposés par calculations_albedo.js
    // window.calculateAlbedo = calculateAlbedo; // ❌ Éviter récursion infinie
    // window.calculateSolarFluxAbsorbed = calculateSolarFluxAbsorbed; // ❌ Éviter récursion infinie
    // Les fonctions de forçage sont maintenant dans climate.js, pas besoin de les exposer ici
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        planckFunction: getPlanckFunction(),
        temperature,
        simulateRadiativeTransfer,
        CO2_PREINDUSTRIAL,
        CO2_CURRENT
    };
}

