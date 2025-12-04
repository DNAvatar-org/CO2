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
        if (window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch) {
                if (typeof currentEpoch.total_atmosphere_mass_kg === 'number') total_mass = currentEpoch.total_atmosphere_mass_kg;
                if (typeof currentEpoch.gravity === 'number') gravity = currentEpoch.gravity;
                if (typeof currentEpoch.planet_radius === 'number') planet_radius = currentEpoch.planet_radius;

                // Calculer ou récupérer la masse molaire moyenne de l'air
                if (typeof currentEpoch.molar_mass_air === 'number') {
                    molar_mass_air = currentEpoch.molar_mass_air;
                } else if (typeof window.calculateMolarMassAir === 'function') {
                    // Utiliser la fonction helper pour calculer depuis les composants
                    molar_mass_air = window.calculateMolarMassAir(currentEpoch);
                } else {
                    // Fallback : Essayer de calculer depuis les composants (kg)
                    // M_air = Masse_totale / Moles_totales
                    const M_N2 = 0.02801; const M_O2 = 0.03200; const M_CO2 = 0.04401; const M_CH4 = 0.01604;

                    let m_n2 = currentEpoch.n2_kg || 0;
                    let m_o2 = currentEpoch.o2_kg || 0;
                    let m_co2 = currentEpoch.co2_kg || 0;
                    let m_ch4 = currentEpoch.ch4_kg || 0;
                    // On ignore l'Argon et H2O pour cette estimation par défaut si non fournis

                    let mass_sum = m_n2 + m_o2 + m_co2 + m_ch4;
                    let moles_sum = (m_n2 / M_N2) + (m_o2 / M_O2) + (m_co2 / M_CO2) + (m_ch4 / M_CH4);

                    if (moles_sum > 0) {
                        molar_mass_air = mass_sum / moles_sum;
                    }
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
    if (molar_mass_air === undefined && typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            if (typeof window.calculateMolarMassAir === 'function') {
                molar_mass_air = window.calculateMolarMassAir(currentEpoch);
            } else if (currentEpoch.molar_mass_air !== undefined) {
                molar_mass_air = currentEpoch.molar_mass_air; // Fallback si fonction non disponible
            }
        }
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
    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
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

    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
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
            h2o_percent = window.h2oVaporPercent + (window.h2oTotalFromMeteorites || 0);
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
    let epochParams = params || {};
    // Si params n'est pas fourni, on tente de récupérer de window (fallback)
    if (!params && typeof window !== 'undefined' && window.currentEpochName &&
        typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            // Calculer pressure_atm et molar_mass_air depuis les composants
            const pressure_atm = typeof window.calculatePressureAtm === 'function' 
                ? window.calculatePressureAtm(currentEpoch) : currentEpoch.atmospheric_pressure;
            const molar_mass_air = typeof window.calculateMolarMassAir === 'function' 
                ? window.calculateMolarMassAir(currentEpoch) : currentEpoch.molar_mass_air;
            
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
function getPrecisionFactorFromFPS() {
    const FPSalert = 25;  // Seuil d'alerte (FPS bas)
    const FPSmin = 20;     // FPS minimum acceptable
    const FPSmax = 55;     // FPS maximum (bonne performance)

    const currentFPS = (typeof window !== 'undefined' && window.fps) ? window.fps : 60;

    if (currentFPS < FPSmin) {
        // FPS très bas : diviser la précision par 2 (réduire les points)
        return 0.5;
    } else if (currentFPS > FPSmax) {
        // FPS excellent : multiplier la précision par 2 (augmenter les points)
        return 2.0;
    } else if (currentFPS < FPSalert) {
        // FPS en alerte : légèrement réduire la précision
        return 0.75;
    }

    // FPS normal : précision standard
    return 1.0;
}

// Exposer la fonction globalement pour l'affichage FPS
if (typeof window !== 'undefined') {
    window.getPrecisionFactorFromFPS = getPrecisionFactorFromFPS;
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
        const T0_init = data?.T0_initial || data?.t0 || data?.T0_initial_config || 'N/A';
        console.log(`🌡️ T° au sol init: ${T0_init}K (${(parseFloat(T0_init) - 273.15).toFixed(1)}°C)`);
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
    // Log supprimé (non essentiel)

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
    // ⚡ FORCER fullSpectre à true pour désactiver le regroupement adaptatif lambda
    const forceFullSpectre = true; // Toujours utiliser le spectre complet (pas de regroupement lambda)

    // Récupérer le facteur de précision depuis le FPS
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

    if (typeof window !== 'undefined' && window.configOrganigramme && window.currentEpochName) {
        const currentEpoch = window.configOrganigramme.timeline.find(e => e.name === window.currentEpochName);
        if (currentEpoch) {
            // Récupération stricte : si undefined, on laisse undefined (ce qui provoquera une erreur plus loin)
            // Sauf si on veut explicitement autoriser 0 (Corps Noir)
            if (currentEpoch.total_atmosphere_mass_kg !== undefined) {
                total_mass = currentEpoch.total_atmosphere_mass_kg;
            } else {
                console.error(`[calculateFluxForT0] ❌ ERREUR : 'total_atmosphere_mass_kg' manquant dans l'époque '${window.currentEpochName}'`);
            }

            // Récupération gravity, radius et masse molaire
            if (currentEpoch.gravity !== undefined) gravity_val = currentEpoch.gravity;
            if (currentEpoch.planet_radius !== undefined) planet_radius_val = currentEpoch.planet_radius;
            // Calculer molar_mass_air depuis les composants si non défini
            if (typeof window.calculateMolarMassAir === 'function') {
                molar_mass_val = window.calculateMolarMassAir(currentEpoch);
            } else {
                molar_mass_val = currentEpoch.molar_mass_air; // Peut être undefined (Corps Noir)
            }

            // Calculer la pression atmosphérique depuis les composants si non définie
            let pressure_atm_val;
            if (typeof window.calculatePressureAtm === 'function') {
                pressure_atm_val = window.calculatePressureAtm(currentEpoch);
            } else {
                pressure_atm_val = currentEpoch.atmospheric_pressure;
                // Fallback : calculer manuellement si nécessaire
                if (pressure_atm_val === undefined && total_mass !== undefined && gravity_val !== undefined && planet_radius_val !== undefined) {
                    const surface_area = 4 * Math.PI * Math.pow(planet_radius_val, 2);
                    const pressure_pa = (total_mass * gravity_val) / surface_area;
                    pressure_atm_val = pressure_pa / 101325;
                }
            }

            // Création de l'objet params pour les helpers
            physParams = {
                total_atmosphere_mass_kg: total_mass,
                gravity: gravity_val,
                planet_radius: planet_radius_val,
                molar_mass_air: molar_mass_val,
                temperature_K: T0_test,
                pressure_atm: pressure_atm_val,
                ocean_coverage: currentEpoch.ocean_coverage || 0
            };

            // Utiliser la nouvelle fonction centralisée dans calculations_atm.js
            if (typeof window.calculateAtmosphereProperties === 'function' && total_mass !== undefined) {
                // Passer T0_test pour avoir une hauteur d'atmosphère cohérente avec la température testée
                const props = window.calculateAtmosphereProperties(total_mass, T0_test, molar_mass_val, gravity_val); // gravity passed explicitement
                dynamic_z_max = props.z_max;

                if (props.is_massive) {
                }
            }
        }
    } else if (dynamic_z_max === undefined) {
        // Hors contexte global, pas de fallback magique sur 5.15e18.
        // Si total_mass n'est pas fourni (undefined), calculateAtmosphereProperties va (ou devrait) râler.
        // Mais ici total_mass est undefined.
        if (typeof window !== 'undefined' && typeof window.calculateAtmosphereProperties === 'function' && total_mass !== undefined) {
            const props = window.calculateAtmosphereProperties(total_mass, T0_test);
            dynamic_z_max = props.z_max;
        }
    }

    // 🚨 VALIDATION CRITIQUE : Si z_max n'est toujours pas défini, on arrête tout.
    // Pas de valeur par défaut silencieuse qui cache des bugs.
    if (dynamic_z_max === undefined || dynamic_z_max === null || isNaN(dynamic_z_max)) {
        console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE : Hauteur d'atmosphère (z_max) indéterminée. total_mass=${total_mass}, z_max_option=${z_max}`);
        return null;
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
    const upward_flux = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));
    const optical_thickness = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));
    const emitted_flux = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));
    const absorbed_flux = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));

    // Log supprimé (non essentiel)

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

    // Debug: analyser le flux < 9μm au sommet de l'atmosphère
    const top_flux = upward_flux[upward_flux.length - 1];
    const lambda_9um_top = 9e-6;
    const top_flux_below_9um = top_flux.filter((flux, idx) => lambda_range[idx] < lambda_9um_top).reduce((sum, f) => sum + f, 0);
    const top_flux_total = top_flux.reduce((sum, f) => sum + f, 0);

    return { total_flux, lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux };
}

// Fonction helper pour afficher une courbe temporaire pendant la dichotomie
function displayDichotomyStep(CO2_fraction, T0_test, result, iteration, isInitial = false, options = {}) {
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
    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
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
    const albedo = result.albedo !== undefined ? result.albedo : calculateAlbedo(T0_test, h2o_enabled, geo_flux);
    const cloud_coverage = result.cloud_coverage !== undefined ? result.cloud_coverage : calculateCloudCoverage(T0_test, h2o_enabled);

    // Calculer les forçages radiatifs séparés
    const forcing_CO2 = typeof window.calculateCO2Forcing === 'function'
        ? window.calculateCO2Forcing(CO2_fraction)
        : 0;
    const forcing_H2O = typeof window.calculateH2OForcing === 'function'
        ? window.calculateH2OForcing(h2o_enabled, cloud_coverage || 0)
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

function simulateRadiativeTransfer(CO2_fraction, options = {}) {
    console.log(`[simulateRadiativeTransfer] 🚀 DÉBUT - CO2_fraction: ${CO2_fraction}, appelé depuis:`, new Error().stack.split('\n')[2]?.trim() || 'unknown');

    // Définir la fraction CO2 globale
    current_CO2_fraction_for_temp = CO2_fraction;
    current_T0_adjusted = null; // Réinitialiser

    const {
        z_max = 120000,
        delta_z = 50,
        lambda_min = 0.1e-6,
        lambda_max = 100e-6,
        delta_lambda = 0.1e-6,
        CH4_fraction = null // Fraction molaire de CH4 (optionnel)
    } = options;

    // Calculer T0 initiale
    let T0_initial = null; // Initialiser T0_initial ici

    // Si pas de température initiale définie, calculer depuis les formules
    // 🔒 OPTIMISATION : Utiliser la dernière température connue comme point de départ si disponible
    // Cela accélère considérablement la convergence lors de petites perturbations (ajout d'eau, de CO2)
    if (T0_initial === null && typeof window !== 'undefined' && window.current_T0_adjusted !== null && window.current_T0_adjusted > 0) {
        // Vérifier si on a changé d'époque récemment (si oui, ne pas utiliser la T0 précédente)
        // On suppose que si T0_initial est null, c'est qu'on n'a pas changé d'époque ou que l'époque n'a pas de T0 fixe
        // Mais attention : si on passe de Corps Noir à Hadéen, T0_initial est défini dans l'époque, donc on ne rentre pas ici.
        // Si on est déjà en Hadéen et qu'on ajoute de l'eau, T0_initial est null (car currentEpoch.initial_temperature_K est utilisé plus haut seulement si défini)
        // Ah, wait. configOrganigramme définit initial_temperature_K pour Hadéen.
        // Donc T0_initial est TOUJOURS réinitialisé à 2469.65K pour Hadéen via le bloc précédent.

        // On doit modifier la logique ci-dessus pour prioriser la T0 précédente SI elle est proche de l'équilibre attendu
        // ou si on est dans une simulation continue.
    }

    // 🔒 REVISION DE LA LOGIQUE D'INITIALISATION
    // 1. Si on a une T0 précédente valide (simulation en cours), on l'utilise comme base.
    // 2. Sinon, si l'époque définit une T0 initiale, on l'utilise.
    // 3. Sinon, on calcule une T0 théorique sans effet de serre.

    let usePreviousT0 = false;
    if (typeof window !== 'undefined' && window.current_T0_adjusted !== null && window.current_T0_adjusted > 0) {
        // On utilise la T0 précédente seulement si on n'a pas changé d'époque "drastiquement"
        // Pour simplifier : si on a une T0 précédente, c'est probablement le meilleur point de départ
        // sauf si on vient de changer d'époque via setEpoch (qui devrait reset current_T0_adjusted ?)
        // current_T0_adjusted est reset à null au début de cette fonction ! 
        // Ah, "current_T0_adjusted = null;" à la ligne 1359.
        // Donc on ne peut pas l'utiliser ici car elle vient d'être effacée.

        // Solution : récupérer la valeur AVANT le reset.
        // Elle est passée via window.plotData.temp_surface ou sauvegardée avant l'appel.
    }

    // Récupérer la température précédente depuis window.plotData AVANT d'écraser quoi que ce soit
    let prev_T0 = null;
    if (typeof window !== 'undefined' && window.plotData && window.plotData.temp_surface) {
        prev_T0 = window.plotData.temp_surface;
    }

    // Définir la fraction CO2 globale
    current_CO2_fraction_for_temp = CO2_fraction;
    current_T0_adjusted = null; // Réinitialiser

    // z_max, delta_z, etc. sont déjà définis au début de la fonction (ligne 1361)
    // On ne doit pas les redéclarer ici

    // Calculer T0 initiale
    // let T0_initial = null; // REMOVED: Déjà déclaré plus haut
    let T0_initial_config = null;
    // Vérifier si l'époque définit une température initiale
    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            // 🔒 PRIORITÉ 1 : Température selon t0 + deltaTemp * nombre_météorites (si disponible) pour convergence rapide
            if (typeof currentEpoch.t0 === 'number' && currentEpoch.t0 > 0) {
                let meteoriteCount = 0;
                
                // Calculer le nombre de météorites à partir de h2oTotalFromMeteorites
                if (currentEpoch.events && currentEpoch.events.ice_meteorite && currentEpoch.events.ice_meteorite.water_added_kg) {
                    const h2oTotalFromMeteorites = (typeof window !== 'undefined' && window.h2oTotalFromMeteorites !== undefined) ? window.h2oTotalFromMeteorites : 0;
                    
                    if (h2oTotalFromMeteorites > 0) {
                        // Calculer le pourcentage ajouté par météorite
                        const mass_kg = currentEpoch.events.ice_meteorite.water_added_kg;
                        const EARTH_TOTAL_WATER_MASS_KG = 1.4e21; // Masse totale d'eau terrestre
                        const h2oPerMeteorite = (mass_kg / EARTH_TOTAL_WATER_MASS_KG) * 100;
                        
                        // Pour Hadéen, multiplier par 10 (comme dans events.js)
                        const h2oPerMeteoriteAdjusted = (currentEpoch.id === 'hadeen') ? Math.max(h2oPerMeteorite * 10, 2.1) : h2oPerMeteorite;
                        
                        // Calculer le nombre approximatif de météorites
                        meteoriteCount = Math.floor(h2oTotalFromMeteorites / h2oPerMeteoriteAdjusted);
                    }
                }
                
                // Calculer ticTime = infoTimeMa / 50 (pour ajustement temporel)
                const ticTime = (typeof window !== 'undefined' && window.infoTimeMa !== undefined) 
                    ? Math.floor(window.infoTimeMa / 50) 
                    : 0;
                
                // Calculer la température initiale : base + deltaTemp_meteorite * meteoriteCount + deltaTemp_ticTime * deltaTicTime
                // 🔒 TOUJOURS utiliser prev_T0 comme base si disponible (température finale précédente)
                // Sinon, utiliser t0 de l'époque
                // ticTime = nombre de textures écoulées (chaque texture = 50Ma)
                // deltaTemp_ticTime = changement de température par ticTime (refroidissement au fil du temps)
                // 🔒 IMPORTANT : Si prev_T0 existe, on applique seulement le delta pour le nouveau ticTime, pas depuis t0
                // Exemple : ticTime=0 → T°=2470K, ticTime=1 → T°=2470K + (-300*1) = 2170K (pas 2437K + (-300*1))
                const baseTemp = (prev_T0 !== null && prev_T0 > 0) ? prev_T0 : currentEpoch.t0;
                
                // 🔒 Stocker meteoriteCount dans window pour la vérification de priorité
                if (typeof window !== 'undefined') {
                    window.currentMeteoriteCount = meteoriteCount;
                }
                
                // Récupérer deltaTemp pour ticTime depuis events.tic_time.deltaTemp
                const deltaTemp_ticTime = (currentEpoch.events && currentEpoch.events.tic_time && typeof currentEpoch.events.tic_time.deltaTemp === 'number')
                    ? currentEpoch.events.tic_time.deltaTemp
                    : null;
                
                // Récupérer deltaTemp pour météorites depuis events.ice_meteorite.deltaTemp
                const deltaTemp_meteorite = (currentEpoch.events && currentEpoch.events.ice_meteorite && typeof currentEpoch.events.ice_meteorite.deltaTemp === 'number')
                    ? currentEpoch.events.ice_meteorite.deltaTemp
                    : null;
                
                // 🔒 Calculer le deltaTicTime : différence entre le ticTime actuel et le ticTime précédent
                // Si prev_T0 existe, on part de la température finale précédente et on applique seulement le delta pour le nouveau ticTime
                // Sinon, on applique le delta depuis t0 (première fois)
                let deltaTicTime = 0;
                if (prev_T0 !== null && prev_T0 > 0 && deltaTemp_ticTime !== null) {
                    // On a une température finale précédente : on applique seulement le delta pour le nouveau ticTime
                    // Si ticTime passe de 0 à 1, on applique -300K une fois
                    // Si ticTime passe de 1 à 2, on applique -300K une fois de plus
                    // Donc : deltaTicTime = 1 (on avance d'un ticTime)
                    deltaTicTime = 1;
                } else if (deltaTemp_ticTime !== null) {
                    // Première fois : on applique le delta depuis t0
                    deltaTicTime = ticTime;
                }
                
                // Calculer T0_initial_config avec les deux deltas
                // 🔒 TOUJOURS calculer T0_initial_config depuis t0 de l'époque (même sans deltaTemp)
                // pour garantir qu'on parte de la bonne température initiale
                let adjustment = 0;
                if (deltaTemp_meteorite !== null) {
                    adjustment += deltaTemp_meteorite * meteoriteCount;
                }
                if (deltaTemp_ticTime !== null) {
                    adjustment += deltaTemp_ticTime * deltaTicTime;
                }
                T0_initial_config = baseTemp + adjustment;
                console.log(`[T0_initial_config] baseTemp: ${baseTemp.toFixed(2)}K (${prev_T0 !== null && prev_T0 > 0 ? 'prev_T0' : 't0'}), meteoriteCount: ${meteoriteCount}, deltaTemp_meteorite: ${deltaTemp_meteorite !== null ? deltaTemp_meteorite + 'K' : 'N/A'}, deltaTemp_ticTime: ${deltaTemp_ticTime !== null ? deltaTemp_ticTime + 'K' : 'N/A'}, ticTime: ${ticTime}, deltaTicTime: ${deltaTicTime} → T0_initial_config: ${T0_initial_config.toFixed(2)}K`);
                
                // 🔒 Anticiper la couleur avec t0 dès le début (AVANT les calculs)
                if (typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function' && typeof window.updateBlackBodyColor === 'function') {
                    const tempC_anticipated = T0_initial_config - 273.15;
                    const color_anticipated = window.tempSurfaceToColor(tempC_anticipated);
                    window.updateBlackBodyColor(color_anticipated);
                    
                    // Mettre à jour legend-equilibre avec la couleur anticipée
                    const legendEquilibre = typeof document !== 'undefined' ? document.querySelector('.legend-equilibre') : null;
                    if (legendEquilibre) {
                        legendEquilibre.style.color = color_anticipated;
                    }
                }
            }
            // 🔒 PRIORITÉ 2 : Température initiale de l'époque (fallback)
            if (T0_initial_config === null && typeof currentEpoch.initial_temperature_K === 'number' && currentEpoch.initial_temperature_K > 0) {
            T0_initial_config = currentEpoch.initial_temperature_K;
                
                // 🔒 Anticiper la couleur avec initial_temperature_K si t0 n'est pas disponible
                if (typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function' && typeof window.updateBlackBodyColor === 'function') {
                    const tempC_anticipated = T0_initial_config - 273.15;
                    const color_anticipated = window.tempSurfaceToColor(tempC_anticipated);
                    window.updateBlackBodyColor(color_anticipated);
                    
                    // Mettre à jour legend-equilibre avec la couleur anticipée
                    const legendEquilibre = typeof document !== 'undefined' ? document.querySelector('.legend-equilibre') : null;
                    if (legendEquilibre) {
                        legendEquilibre.style.color = color_anticipated;
                    }
                }
            }
        }
    }

    // Stratégie de choix de T0_initial :
    // 1. Si config époque existe avec deltaTemp ET qu'on a ajouté des météorites, utiliser T0_initial_config (avec deltaTemp).
    // 2. Si on a une température précédente (simulation continue), on l'utilise (meilleure convergence).
    // 3. Sinon, si config époque existe, on l'utilise.
    // 4. Sinon, calcul théorique.

    // 🔒 PRIORITÉ : Si T0_initial_config est calculé depuis t0 de l'époque, l'utiliser TOUJOURS
    // (même sans météorites, pour partir de la bonne température initiale de l'époque)
    let useT0Config = false;
    if (T0_initial_config !== null && T0_initial_config > 0) {
        // Vérifier si des météorites ont été ajoutées
        const meteoriteCount = (typeof window !== 'undefined' && window.currentMeteoriteCount !== undefined) 
            ? window.currentMeteoriteCount 
            : 0;
        
        console.log(`[useT0Config] T0_initial_config: ${T0_initial_config.toFixed(2)}K, meteoriteCount: ${meteoriteCount}, prev_T0: ${prev_T0 !== null ? prev_T0.toFixed(2) : 'null'}K`);
        
        // 🔒 Utiliser T0_initial_config si :
        // 1. Des météorites ont été ajoutées (ajustement deltaTemp)
        // 2. OU si prev_T0 est null (premier calcul de l'époque, doit partir de t0)
        if (meteoriteCount > 0 || prev_T0 === null || prev_T0 <= 0) {
            // Utiliser T0_initial_config (depuis t0 de l'époque ou avec ajustement deltaTemp)
            useT0Config = true;
            console.log(`[useT0Config] ✅ Utilisation de T0_initial_config (${meteoriteCount > 0 ? 'avec deltaTemp' : 'depuis t0 de l\'époque'})`);
        }
    }

    if (useT0Config) {
        // Utiliser T0_initial_config (avec ajustement deltaTemp)
        T0_initial = T0_initial_config;
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
    } else if (prev_T0 !== null && prev_T0 > 0) {
        // Si pas d'ajustement deltaTemp, utiliser prev_T0 (simulation continue)
        T0_initial = prev_T0;
        // Si on ajoute des GES (H2O, CO2), la température va monter.
        // On ajoute un petit delta pour aider la dichotomie à chercher "vers le haut"
        // (Sauf si on est en refroidissement -> à gérer par la dichotomie)
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
    } else if (T0_initial_config !== null) {
        T0_initial = T0_initial_config;
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
    } else {
        // Si pas de température initiale définie, calculer depuis les formules
        const STEFAN_BOLTZMANN = window.STEFAN_BOLTZMANN || 5.670374419e-8;

        // Récupérer le flux géothermique pour l'initialisation
        let geo_flux_init = 0;
        if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch) {
                if (typeof window.calculateGeothermalFlux === 'function' &&
                    typeof currentEpoch.core_temperature === 'number' &&
                    typeof currentEpoch.geothermal_diffusion_factor === 'number') {
                    geo_flux_init = window.calculateGeothermalFlux(currentEpoch.core_temperature, currentEpoch.geothermal_diffusion_factor);
                } else if (typeof currentEpoch.geothermal_flux === 'number') {
                    geo_flux_init = currentEpoch.geothermal_flux;
                }
            }
        }

        // Utiliser un albedo de base pour l'initialisation (sans glace ni nuages)
        const solar_absorbed_init = calculateSolarFluxAbsorbed(255, false);

        // 🔒 CORRECTION CRITIQUE : Inclure le flux géothermique dans l'estimation de T0 initiale
        // T = ((Flux Solaire + Flux Géo) / sigma)^0.25
        const total_flux_init = solar_absorbed_init + geo_flux_init;
        const T0_no_greenhouse = Math.pow(total_flux_init / STEFAN_BOLTZMANN, 0.25);

        if (CO2_fraction === 0) {
            T0_initial = T0_no_greenhouse;
        } else {
            const CO2_ref = 1e-6;
            const forcing_CO2 = 5.35 * Math.log(Math.max(CO2_fraction, CO2_ref) / CO2_ref);
            const climate_sensitivity = 0.8;
            const delta_T_greenhouse = climate_sensitivity * forcing_CO2;
            T0_initial = T0_no_greenhouse + delta_T_greenhouse;
        }

        logCalculationPhase('DICHOTOMIE START', {
            T0_initial: T0_initial.toFixed(2)
        });

        // Si H2O est activé, ajuster T0_initial (H2O ajoute un effet de serre important)
        // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
        const cellH2O_init = typeof document !== 'undefined' ? document.getElementById('cell-h2o') : null;
        const h2o_enabled = cellH2O_init && cellH2O_init.classList.contains('checked');
        if (h2o_enabled) {
            // H2O ajoute un effet de serre supplémentaire, mais limité pour éviter l'emballement
            // Réduit de 25K à 15K pour limiter la rétroaction positive température → nuages → forçage
            T0_initial += 15; // Approximation réduite
        }
    }

    // Dichotomie pour trouver T0 qui donne flux_total = flux_solaire_absorbé
    // 🔒 Ajuster les bornes selon la température initiale (peut être très élevée pour Hadéen)
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const cellH2O_check = typeof document !== 'undefined' ? document.getElementById('cell-h2o') : null;
    const h2o_enabled_check = cellH2O_check && cellH2O_check.classList.contains('checked');

    // Si T0_initial est très élevé (ex: Hadéen post-impact), utiliser un intervalle plus large
    // 🔒 OPTIMISATION : Réduire l'intervalle si on part d'une T0 précédente connue (continuité)
    const range_factor = (prev_T0 !== null && prev_T0 > 0) ? 0.5 : 1.0; // Réduire intervalle de 50% si continuité
    const INITIAL_RANGE = ((T0_initial > 1000) ? 200 : 50) * range_factor; // Intervalle adaptatif

    let T0_min = Math.max(200, T0_initial - INITIAL_RANGE); // Borne inférieure, minimum 200K
    // Borne supérieure : permettre jusqu'à 3000K pour Hadéen (juste après impact)
    const T0_max_limit = (T0_initial > 1000) ? 3000 : (h2o_enabled_check ? 400 : 350);
    let T0_max = Math.min(T0_max_limit, T0_initial + INITIAL_RANGE);
    let T0 = T0_initial;
    
    // 🔒 Calculer la tolérance depuis la précision de l'époque (en K) convertie en W/m²
    // Relation : ΔF = 4 * σ * T³ * ΔT (dérivée de F = σ * T⁴)
    let tolerance = 0.1; // Tolérance par défaut (W/m²)
    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch && typeof currentEpoch.precision === 'number' && currentEpoch.precision > 0) {
            const STEFAN_BOLTZMANN = window.STEFAN_BOLTZMANN || 5.670374419e-8;
            const precision_K = currentEpoch.precision; // Précision en K depuis la config
            // Convertir en W/m² : ΔF = 4 * σ * T³ * ΔT
            // Utiliser T0_initial comme température de référence pour la conversion
            tolerance = 4 * STEFAN_BOLTZMANN * Math.pow(T0_initial, 3) * precision_K;
            console.log(`[DICHOTOMIE] Précision config: ${precision_K}K → Tolérance: ${tolerance.toFixed(4)} W/m² (T_ref: ${T0_initial.toFixed(2)}K)`);
        }
    }
    
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
    console.log(`[simulateRadiativeTransfer] 📊 Calcul de la courbe initiale - T0_initial: ${T0_initial.toFixed(2)}K`);
    const startTime = performance.now();
    result = calculateFluxForT0(CO2_fraction, T0_initial, options);
    const endTime = performance.now();
    console.log(`[simulateRadiativeTransfer] ⏱️ Courbe initiale calculée en ${(endTime - startTime).toFixed(2)}ms`);

    // Afficher la courbe initiale (avant dichotomie) seulement si demandé
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
                console.log(`[performDichotomy] 🚀 DÉBUT dichotomie - T0_initial: ${T0_initial.toFixed(2)}K, tolerance: ${tolerance.toFixed(4)} W/m²`);
                // Vérifier si annulé
                if (window.cancelCalculation || isCancelled) {
                    console.log(`[performDichotomy] ⏸️ Annulé avant démarrage`);
                    return;
                }

                let T0_current = T0_initial;
                let iter = 0;
                let final_result = result;

                // Déclarer shouldDisplaySteps une seule fois pour toute la fonction iterate
                const shouldDisplaySteps = typeof window !== 'undefined' && window.showDichotomySteps;

                // 🔒 Initialiser les bornes pour la dichotomie classique
                // Ces bornes seront mises à jour par la phase exponentielle ou la dichotomie classique
                let T0_min = T0_initial - 50; // Borne inférieure initiale
                let T0_max = T0_initial + 50; // Borne supérieure initiale

                // 🔒 Phase de recherche exponentielle : variables pour la montée exponentielle
                // La phase exponentielle ne s'active que si on part d'une température trop basse (flux_diff < 0)
                let exponentialPhase = false; // Sera activée seulement si nécessaire
                let exponentialIncrement = 1; // Incrément initial : 1, puis 2, 4, 8...
                let lastFluxDiffSign = null; // Signe du flux_diff précédent pour détecter le changement
                let previousT0 = T0_initial; // Valeur précédente de T0 pour calculer T0_min correctement

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
                    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
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
                    const total_flux_in = solar_flux_absorbed + (geo_flux || 0);
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
                    // Par définition de T_effective, ce delta devrait être 0 (ou très proche de 0)
                    // C'est l'équilibre mentionné dans la légende "∫ ...= ∫___"
                    const delta_aire = planck_effective_flux - real_emission_flux;
                    
                    // Delta équilibrage (pour convergence) : flux_sortant - flux_entrant
                    // C'est CE delta qui tend vers 0 pour la convergence (équilibre énergétique global)
                    const delta_equilibre = flux_diff;
                    
                    // Delta EDS (Effet de Serre) : différence entre corps noir théorique à T0 et émission réelle
                    // Ce delta NE TEND PAS vers 0, c'est l'effet de serre (normal qu'il reste élevé)
                    // C'est la différence entre ce que la surface émet (σT0⁴) et ce qui sort réellement
                    const blackbody_flux_T0 = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
                    const delta_eds = blackbody_flux_T0 - real_emission_flux;
                    
                    // Signe * sqrt(abs(delta)) pour l'équilibrage (utiliser delta_equilibre pour la phase exponentielle)
                    // C'est le delta qui doit tendre vers 0, pas delta_aire (qui est toujours ~0 par définition)
                    // 🔒 CORRECTION : Si delta_equilibre < 0, on émet moins qu'on reçoit → il faut AUGMENTER T
                    // Donc signe×√|delta| négatif signifie qu'on doit augmenter T (incrément positif)
                    const sqrt_delta = Math.sqrt(Math.abs(delta_equilibre));
                    const signe_sqrt = delta_equilibre >= 0 ? 1 : -1; // Signe pour l'affichage
                    const sqrt_delta_signed = signe_sqrt * sqrt_delta;
                    
                    // 🔒 Afficher le log avec T° au sol ET T° corps noir (courbe)
                    // Delta équilibre (→0) : flux_sortant - flux_entrant (convergence énergétique globale)
                    // Delta aire (→0) : équilibre des aires sous les courbes affichées (pointillée vs pleine)
                    // Delta EDS : effet de serre (ne tend PAS vers 0, c'est normal)
                    console.log(`🌡️ T° sol: ${T0_current.toFixed(2)}K (${(T0_current - 273.15).toFixed(1)}°C) | T° corps noir: ${T_effective.toFixed(2)}K (${(T_effective - 273.15).toFixed(1)}°C) | Delta équilibre (→0): ${delta_equilibre.toFixed(4)} W/m² | Delta aire (→0): ${delta_aire.toFixed(4)} W/m² | Delta EDS: ${delta_eds.toFixed(4)} W/m² | signe×√|delta|: ${sqrt_delta_signed.toFixed(4)}`);
                    
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
                    if (Math.abs(delta_equilibre) <= tolerance) {
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
                    
                    // 🔒 Phase exponentielle : activer si delta_equilibre != 0 (on n'est pas à l'équilibre)
                    // Si c'est la première itération et qu'on n'est pas à l'équilibre, activer la phase exponentielle
                    if (iter === 0 && Math.abs(delta_equilibre) > tolerance) {
                        exponentialPhase = true;
                        // T_min ou T_max = T0_current (point de départ)
                        if (delta_equilibre < 0) {
                            // On émet moins qu'on reçoit → il faut AUGMENTER T
                            T0_min = T0_current;
                            // ANCIEN CODE (commenté) : const delta0 = sqrt_delta / 10; // Incrément en K (trop grand quand on s'approche)
                            const delta0 = Math.abs(delta_equilibre) / 3000; // Incrément en K (proportionnel au delta)
                            T0_max = T0_min + delta0; // On augmente T
                            lastFluxDiffSign = -1;
                        } else {
                            // On émet trop → il faut DIMINUER T
                            T0_max = T0_current;
                            // ANCIEN CODE (commenté) : const delta0 = sqrt_delta / 10; // Incrément en K (trop grand quand on s'approche)
                            const delta0 = Math.abs(delta_equilibre) / 3000; // Incrément en K (proportionnel au delta)
                            T0_min = T0_max - delta0; // On diminue T
                            lastFluxDiffSign = 1;
                        }
                        previousT0 = T0_current; // Initialiser previousT0
                        // Tester la nouvelle température immédiatement
                        T0_current = (delta_equilibre < 0) ? T0_max : T0_min;
                        iter++;
                        if (typeof window !== 'undefined' && typeof window.incrementTimeline === 'function') {
                            window.incrementTimeline();
                        }
                        setTimeout(iterate, 0);
                        return; // Sortir de cette itération, la suivante utilisera la nouvelle T
                    }
                    
                    // 🔒 Phase exponentielle : recherche rapide, détection du changement de signe
                    if (exponentialPhase) {
                        const currentFluxDiffSign = flux_diff < 0 ? -1 : (flux_diff > 0 ? 1 : 0);
                        
                        if (delta_equilibre < 0) {
                            // On émet encore moins qu'on reçoit : continuer à AUGMENTER T
                            previousT0 = T0_current; // Sauvegarder la valeur précédente (T° où flux_diff < 0)
                            // 🔒 Sauvegarder aussi le flux_diff précédent (négatif) pour la dichotomie
                            if (typeof window !== 'undefined') {
                                window.previousFluxDiff = flux_diff; // Valeur négative
                            }
                            // ANCIEN CODE (commenté) : const new_sqrt_delta = Math.sqrt(Math.abs(delta_equilibre));
                            // ANCIEN CODE (commenté) : const new_delta0 = new_sqrt_delta / 10; // Incrément en K (trop grand quand on s'approche)
                            const new_delta0 = Math.abs(delta_equilibre) / 3000; // Incrément en K (proportionnel au delta)
                            // T_max = T_current + new_delta0 (on augmente T)
                            T0_max = T0_current + new_delta0;
                            T0_current = T0_max; // Tester le nouveau T_max
                            lastFluxDiffSign = -1;
                            // Continuer l'itération avec le nouveau T0_current
                            iter++;
                            if (typeof window !== 'undefined' && typeof window.incrementTimeline === 'function') {
                                window.incrementTimeline();
                            }
                            setTimeout(iterate, 0);
                            return; // Sortir de cette itération, la suivante utilisera le nouveau T0_current
                        } else if (delta_equilibre > 0) {
                            // On émet trop : continuer à DIMINUER T
                            previousT0 = T0_current; // Sauvegarder la valeur précédente (T° où flux_diff > 0)
                            // 🔒 Sauvegarder aussi le flux_diff précédent (positif) pour la dichotomie
                            if (typeof window !== 'undefined') {
                                window.previousFluxDiff = flux_diff; // Valeur positive
                            }
                            // ANCIEN CODE (commenté) : const new_sqrt_delta = Math.sqrt(Math.abs(delta_equilibre));
                            // ANCIEN CODE (commenté) : const new_delta0 = new_sqrt_delta / 10; // Incrément en K (trop grand quand on s'approche)
                            const new_delta0 = Math.abs(delta_equilibre) / 3000; // Incrément en K (proportionnel au delta)
                            // T_min = T_current - new_delta0 (on diminue T)
                            T0_min = T0_current - new_delta0;
                            T0_current = T0_min; // Tester le nouveau T_min
                            lastFluxDiffSign = 1;
                            // Continuer l'itération avec le nouveau T0_current
                            iter++;
                            if (typeof window !== 'undefined' && typeof window.incrementTimeline === 'function') {
                                window.incrementTimeline();
                            }
                            setTimeout(iterate, 0);
                            return; // Sortir de cette itération, la suivante utilisera le nouveau T0_current
                        } else if (Math.abs(delta_equilibre) <= tolerance) {
                            // On a atteint l'équilibre pendant la phase exponentielle
                            exponentialPhase = false;
                            // Convergence atteinte
                            final_T0 = T0_current;
                            result = final_result;
                            return;
                        } else if ((delta_equilibre < 0 && lastFluxDiffSign > 0) || (delta_equilibre > 0 && lastFluxDiffSign < 0)) {
                            // Changement de signe détecté (négatif -> positif) : passer à la dichotomie classique
                            exponentialPhase = false;
                            // Initialiser les bornes pour la dichotomie
                            // T0_current est la première valeur où flux_diff > 0 (on a dépassé)
                            // previousT0 est la dernière valeur où flux_diff < 0 (juste avant de dépasser)
                            T0_max = T0_current; // Première valeur où flux_diff > 0
                            T0_min = previousT0; // Dernière valeur où flux_diff < 0
                            // 🔒 Utiliser le flux_diff précédent (négatif) sauvegardé
                            window.flux_diff_min = (typeof window !== 'undefined' && window.previousFluxDiff !== undefined) 
                                ? window.previousFluxDiff 
                                : -1e9; // Valeur négative (dernière où flux_diff < 0)
                            window.flux_diff_max = flux_diff; // Valeur actuelle (positive)
                            // 🔒 Calculer T0_current = (T0_min + T0_max) / 2 pour la dichotomie classique
                            T0_current = (T0_min + T0_max) / 2;
                            // Recalculer avec le nouveau T0_current avant de continuer
                            iter++;
                            if (typeof window !== 'undefined' && typeof window.incrementTimeline === 'function') {
                                window.incrementTimeline();
                            }
                            setTimeout(iterate, 0);
                            return; // Sortir pour recalculer avec T0_current = (T_min + T_max) / 2
                        } else {
                            // Premier calcul ou flux_diff === 0 (ne devrait pas arriver)
                            lastFluxDiffSign = currentFluxDiffSign;
                        }
                    }

                    // 🔒 Vérifier la convergence AVANT de continuer (peu importe la phase)
                    if (Math.abs(delta_equilibre) <= tolerance) {
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

                    // 🔒 Dichotomie classique (après la phase exponentielle ou si flux_diff > 0 dès le début)
                    if (!exponentialPhase) {
                        // S'assurer que T0_min et T0_max sont bien définis
                        if (T0_min === undefined || T0_max === undefined || T0_min >= T0_max) {
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
                    }

                    logCalculationPhase(`DICHOTOMIE ITER ${iter + 1}`, {
                        T0_current: T0_current.toFixed(2)
                    });

                    // Afficher chaque étape de la dichotomie seulement si demandé
                    if (shouldDisplaySteps && !isCancelled) {
                        displayDichotomyStep(CO2_fraction, T0_current, final_result, iter + 1, false, options);
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

                    // 🔒 Vérification de convergence déjà faite plus haut (avant la dichotomie)
                    // Cette vérification est maintenant redondante mais conservée pour sécurité
                    if (Math.abs(flux_diff) < tolerance) {
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

                    iter++;
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
            if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
                const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
                if (currentEpoch && typeof currentEpoch.geothermal_flux === 'number') {
                    geo_flux = currentEpoch.geothermal_flux;
                }
            }
            const solar_flux_absorbed = calculateSolarFluxAbsorbed(T0, h2o_enabled, geo_flux);
            const flux_diff = result.total_flux - solar_flux_absorbed;

            // 🔒 DÉSACTIVÉ : Ne plus incrémenter le temps à chaque itération de dichotomie
            // L'incrémentation se fait uniquement lors des clics sur boutons (météorite glace, etc.)
            // if (typeof window !== 'undefined' && typeof window.incrementTimeline === 'function') {
            //     window.incrementTimeline();
            // }

            if (Math.abs(flux_diff) < tolerance) {
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
    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
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
            window.h2oIceFractionFromCalculation = h2o_params.ice_fraction || 0;
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

    // Mettre à jour la visualisation spectrale avant de résoudre
    if (typeof window !== 'undefined' && typeof window.updateSpectralVisualization === 'function') {
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
            window.updateSpectralVisualization(spectralData);
        }, 150);
    }

    resolve(final_result_obj);
}

// Fonction pour finaliser les résultats (mode synchrone)
function finalizeResultsSync(result, T0, lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux, CO2_fraction) {
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
    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
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
            window.h2oIceFractionFromCalculation = h2o_params.ice_fraction || 0;
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

