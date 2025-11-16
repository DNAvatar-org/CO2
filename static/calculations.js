// ============================================================================
// CALCULS DE TRANSFERT RADIATIF EN JAVASCRIPT
// ============================================================================

// Constantes physiques et climatiques sont maintenant dans physics.js et climate.js
// Utiliser directement les constantes globales exposées par ces modules

// Fonction pour calculer l'albedo dynamique basé sur la glace et les nuages
// Modélisation créative inspirée de :
// - "Ice-Albedo Feedback in Climate Models" (approximation simplifiée)
// - Modèles de rétroaction glace-albedo (Budyko, 1969; Sellers, 1969)
// - Paramétrisation nuageuse simplifiée pour visualisation pédagogique
function calculateAlbedo(T_surface_K, h2o_enabled) {
    const T_surface_C = T_surface_K - 273.15;
    let albedo = window.ALBEDO_BASE || 0.3;
    
    // Contribution de la glace (albedo augmente avec le froid)
    // Modélisation : transition progressive de l'albedo terrestre vers l'albedo glaciaire
    // Référence conceptuelle : rétroaction glace-albedo (modèles simplifiés de climat)
    // Si température < 0°C, il y a de la glace
    // À -2.2°C, on veut beaucoup de glace (fraction élevée)
    // ⚠️ MODIFICATION POUR GAMEPLAY : Les volcans réduisent la glace (réchauffement, fonte)
    const volcanoIceReduction = (typeof window !== 'undefined' && window.volcanoIceReduction !== undefined) 
        ? window.volcanoIceReduction / 100 
        : 0; // Réduction en fraction (0 à 1)
    
    if (T_surface_C < 0) {
        // Albedo de la glace : ~0.6-0.9 selon l'épaisseur (valeur moyenne choisie pour visualisation)
        // Note : Le blanc (glace) ne fait pas totalement miroir, il y a une rediffusion vers le bas
        // Plus il fait froid, plus il y a de glace
        // Utiliser une fonction qui monte rapidement : à -2.2°C, on veut ~70% de la surface du globe couverte de glace
        const ice_albedo = 0.7; // Albedo moyen de la glace (approximation créative)
        // Fonction exponentielle pour avoir beaucoup de glace dès -2.2°C
        // À -2.2°C : fraction = 1 - exp(-2.2/3) ≈ 0.7 (70% de la surface du globe couverte de glace)
        // À -10°C : fraction ≈ 0.97 (97% de la surface du globe couverte de glace)
        let ice_fraction = Math.min(1, 1 - Math.exp(T_surface_C / 3)); // Fraction de surface couverte de glace (0 à 1)
        
        // ⚠️ MODIFICATION POUR GAMEPLAY : Réduire la glace selon l'effet volcanique
        // Les volcans réchauffent et font fondre la glace
        ice_fraction = Math.max(0, ice_fraction - volcanoIceReduction);
        
        // Transition progressive : albedo = base + (glace - base) * fraction_glace
        const ALBEDO_BASE = window.ALBEDO_BASE || 0.3;
        albedo = ALBEDO_BASE + (ice_albedo - ALBEDO_BASE) * ice_fraction;
    }
    
    // Contribution des nuages (H2O activé)
    // Modélisation : ajout d'un albedo nuageux moyen lorsque H2O est activé
    // Référence conceptuelle : paramétrisation nuageuse simplifiée (modèles climatiques simplifiés)
    // Note : Les nuages noirs (épais, sombres) n'ont pas d'albedo significatif
    // Note : Sur les nuages, la réflexion/absorption ne passe pas très bien dans les deux sens,
    // mais ce ne sont pas les mêmes fréquences, donc pas les mêmes absorption/miroir/radiation
    // Note : La couverture nuageuse est proportionnelle/croissante avec la température au sol
    // (plus il fait chaud, plus il y a d'évaporation et donc de nuages)
    // TODO : Justifier ce choix de modélisation (couverture nuageuse vs température, altitude, etc.)
    if (h2o_enabled) {
        // Utiliser la fonction dédiée pour calculer la couverture nuageuse
        const cloud_fraction = calculateCloudCoverage(T_surface_K, h2o_enabled);
        
        // Seuil minimum : ne pas appliquer l'albedo nuageux si la couverture est trop faible (< 5%)
        // Cela évite que 1% de nuages ait un impact drastique sur l'albedo
        if (cloud_fraction >= 0.05) {
            // Albedo des nuages : ~0.3-0.6 selon la couverture nuageuse (valeur moyenne choisie)
            const cloud_albedo = 0.4; // Albedo moyen des nuages (approximation créative)
            
            // Diviser par 2 car les nuages noirs ne réfléchissent pas (ou très peu)
            // Ajuster la contribution pour qu'elle soit proportionnelle à la couverture nuageuse
            // mais avec un effet plus doux pour les faibles couvertures
            const cloud_contribution = (cloud_albedo * cloud_fraction) / 2;
            albedo = albedo + cloud_contribution;
        }
        // Si cloud_fraction < 5%, on n'ajoute pas de contribution nuageuse à l'albedo
    }
    
    // Clamper entre 0.1 et 0.9 (valeurs physiques raisonnables pour la Terre)
    return Math.max(0.1, Math.min(0.9, albedo));
}

// Fonction pour calculer la couverture nuageuse (fraction de surface couverte vue depuis le ciel)
function calculateCloudCoverage(T_surface_K, h2o_enabled) {
    if (!h2o_enabled) {
        // ⚠️ MODIFICATION POUR GAMEPLAY : Les volcans peuvent créer des nuages même si H2O désactivé
        // Les volcans émettent de la vapeur d'eau et des particules qui forment des nuages
        const volcanoBonus = (typeof window !== 'undefined' && window.volcanoH2OBonus !== undefined) 
            ? window.volcanoH2OBonus / 100 
            : 0;
        if (volcanoBonus > 0) {
            return Math.min(1, volcanoBonus); // Bonus volcanique en fraction (0 à 1)
        }
        return 0; // Pas de nuages si H2O désactivé et pas de volcans
    }
    
    const T_surface_C = T_surface_K - 273.15;
    
    // ⚠️ MODIFICATION POUR GAMEPLAY : Bonus volcanique sur la couverture nuageuse
    // Les volcans émettent de la vapeur d'eau et des particules qui augmentent la couverture nuageuse
    const volcanoBonus = (typeof window !== 'undefined' && window.volcanoH2OBonus !== undefined) 
        ? window.volcanoH2OBonus / 100 
        : 0; // Bonus en fraction (0 à 1)
    
    // À très basse température (< -20°C), l'air est très sec, peu de nuages possibles
    // Nuages blancs (cirrus, stratus) : nécessitent de la vapeur d'eau, peu probables à très basse température
    // Nuages noirs (orageux) : encore moins probables à très basse température
    // À des températures très froides, la couverture nuageuse doit être proche de 0
    
    if (T_surface_C < -20) {
        // Très froid : presque pas de nuages (air très sec)
        // Fonction décroissante exponentielle : à -60°C ≈ 0%, à -20°C = 5%
        // Calcul à -60°C : 0.05 * exp(0.1 * (-60 - (-20))) = 0.05 * exp(-4) ≈ 0.0009 ≈ 0%
        const T_cold = -20; // Seuil de froid
        const cloud_at_cold = 0.05; // 5% à -20°C
        const decay_rate = 0.1; // Taux de décroissance
        let cloud_fraction = cloud_at_cold * Math.exp(decay_rate * (T_surface_C - T_cold));
        
        // ⚠️ MODIFICATION POUR GAMEPLAY : Ajouter le bonus volcanique même par temps très froid
        cloud_fraction = Math.min(1, Math.max(0, cloud_fraction) + volcanoBonus);
        
        return cloud_fraction;
    } else if (T_surface_C < 0) {
        // Froid mais pas extrême : quelques nuages possibles (nuages blancs)
        // Interpolation entre -20°C (5%) et 0°C (20%)
        const cloud_at_0 = 0.2; // 20% à 0°C
        const cloud_at_cold = 0.05; // 5% à -20°C
        let cloud_fraction = cloud_at_cold + (cloud_at_0 - cloud_at_cold) * ((T_surface_C - (-20)) / 20);
        
        // ⚠️ MODIFICATION POUR GAMEPLAY : Ajouter le bonus volcanique
        cloud_fraction = Math.min(1, cloud_fraction + volcanoBonus);
        
        return cloud_fraction;
    } else {
        // Température positive : couverture nuageuse proportionnelle à la température
        // Plus il fait chaud, plus il y a d'évaporation et donc de nuages
        // Référence : Climat tropical humide (30-35°C) → 70-80% de couverture nuageuse moyenne
        // Limitation : Utiliser une saturation douce pour éviter l'emballement thermique
        const cloud_fraction_min = 0.2; // Couverture minimale à 0°C (20%)
        const cloud_fraction_max_physical = 0.75; // Couverture maximale physique pour climat tropical humide (75%)
        const cloud_fraction_max_limited = 0.6; // Limite appliquée pour éviter l'emballement (60%)
        const T_ref_max = 30; // Température de référence maximale (°C)
        
        // Calculer la valeur physique (réaliste pour climat tropical humide)
        // À 0°C = 20%, à 30°C = 75% (référence : zones tropicales humides)
        let physical_fraction;
        if (T_surface_C >= T_ref_max) {
            // Au-delà de 30°C : saturation à la valeur physique maximale (75%)
            physical_fraction = cloud_fraction_max_physical;
        } else {
            // Interpolation linéaire entre 0°C et 30°C
            physical_fraction = cloud_fraction_min + (cloud_fraction_max_physical - cloud_fraction_min) * 
                        (T_surface_C / T_ref_max);
        }
        
        // Appliquer une limitation à 60% pour éviter l'emballement thermique
        // (compromis entre réalisme physique et stabilité numérique)
        let final_fraction = Math.min(cloud_fraction_max_limited, physical_fraction);
        
        // ⚠️ MODIFICATION POUR GAMEPLAY : Ajouter le bonus volcanique (les volcans augmentent la couverture nuageuse)
        final_fraction = Math.min(1, final_fraction + volcanoBonus);
        
        return final_fraction;
    }
}

// Fonction pour calculer le flux solaire absorbé avec albedo dynamique
// ✅ SCIENTIFIQUEMENT CERTAIN : 
// - La formule F = S_0 * (1 - A) / 4 est la base de l'équilibre radiatif terrestre
// - La division par 4 vient de la géométrie sphérique : surface 4πr² vs section πr² (facteur 4)
// - Cette formule est utilisée dans tous les modèles climatiques (IPCC, GCM)
function calculateSolarFluxAbsorbed(T_surface_K, h2o_enabled) {
    const albedo = calculateAlbedo(T_surface_K, h2o_enabled);
    const SOLAR_CONSTANT = window.SOLAR_CONSTANT || 1366;
    const flux_absorbed = SOLAR_CONSTANT * (1 - albedo) / 4; // Divisé par 4 car la surface de la sphère (4πr²) est 4 fois la section (πr²)
    return flux_absorbed;
}

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
    return function(lambda, T) {
        const PLANCK_H = 6.62607015e-34;
        const SPEED_OF_LIGHT = 2.998e8;
        const BOLTZMANN_KB = 1.380649e-23;
        const term1 = (2 * PLANCK_H * SPEED_OF_LIGHT * SPEED_OF_LIGHT) / Math.pow(lambda, 5);
        const term2 = Math.exp((PLANCK_H * SPEED_OF_LIGHT) / (lambda * BOLTZMANN_KB * T)) - 1;
        return term1 / term2;
    };
}
// Fonction locale pour utiliser planckFunction sans conflit
function localPlanckFunction(lambda, T) {
    return getPlanckFunction()(lambda, T);
}

// ============================================================================
// MODÈLE ATMOSPHÉRIQUE
// ============================================================================

function pressure(z) {
    const P0 = 101325;  // Pression au niveau de la mer, Pa
    const H = 8500;     // Échelle de hauteur, m
    return P0 * Math.exp(-z / H);
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
    // Tropopause standard : 11 km pour T0 = 288K (conditions terrestres moyennes)
    // Variation : environ 0.1 km par Kelvin de différence
    // Limites physiques : entre 8 km (pôles, très froid) et 17 km (tropiques, très chaud)
    const z_trop_standard = 11000; // 11 km en mètres
    const T0_standard = 288; // Température standard en K
    const sensitivity = 100; // 0.1 km/K = 100 m/K
    
    let z_trop = z_trop_standard + (T0 - T0_standard) * sensitivity;
    
    // Limites physiques
    z_trop = Math.max(8000, Math.min(17000, z_trop)); // Entre 8 et 17 km
    
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
        const h2o_enabled_temp = (typeof window !== 'undefined' && window.waterVaporEnabled !== undefined) 
            ? window.waterVaporEnabled 
            : waterVaporEnabled;
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
    const Gamma = -0.0065; // Gradient de température, K/m
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

function airNumberDensity(z, CO2_fraction = null, T0_override = null) {
    const BOLTZMANN_KB = window.BOLTZMANN_KB || 1.380649e-23;
    return pressure(z) / (BOLTZMANN_KB * temperature(z, CO2_fraction, T0_override));
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
function waterVaporMixingRatio(z) {
    const r0 = 0.015;  // Mixing ratio au niveau de la mer (~1.5% de l'air en vapeur d'eau)
    const H_H2O = 2500; // Échelle de hauteur de la vapeur d'eau (m) - décroît avec l'altitude
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
function waterVaporNumberDensity(z, CO2_fraction = null, T0_override = null) {
    // Vérifier si H2O est activé (via variable globale ou window)
    const enabled = (typeof window !== 'undefined' && window.waterVaporEnabled !== undefined) 
        ? window.waterVaporEnabled 
        : waterVaporEnabled;
    if (!enabled) return 0;
    
    const n_air = airNumberDensity(z, CO2_fraction, T0_override);
    const mixing_ratio = waterVaporMixingRatio(z);
    return n_air * mixing_ratio;
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

// Fonction interne pour calculer le flux total sortant pour une T0 donnée
function calculateFluxForT0(CO2_fraction, T0_test, options) {
    const {
        z_max = 120000,
        delta_z = 50,
        lambda_min = 0.1e-6,
        lambda_max = 100e-6,
        delta_lambda = 0.1e-6
    } = options;
    
    // Créer les grilles
    const lambda_range = [];
    for (let lambda = lambda_min; lambda < lambda_max; lambda += delta_lambda) {
        lambda_range.push(lambda);
    }
    
    const z_range = [];
    for (let z = 0; z < z_max; z += delta_z) {
        z_range.push(z);
    }
    
    // Initialiser les tableaux
    const upward_flux = Array(z_range.length).fill(0).map(() => Array(lambda_range.length).fill(0));
    const optical_thickness = Array(z_range.length).fill(0).map(() => Array(lambda_range.length).fill(0));
    const emitted_flux = Array(z_range.length).fill(0).map(() => Array(lambda_range.length).fill(0));
    const absorbed_flux = Array(z_range.length).fill(0).map(() => Array(lambda_range.length).fill(0));
    
    // Condition limite : flux émis par la surface avec T0_test
    const earth_flux = lambda_range.map(lambda => 
        Math.PI * localPlanckFunction(lambda, T0_test) * delta_lambda
    );
    
    // Debug: analyser l'émission dans la zone < 9 microns
    const lambda_9um = 9e-6; // 9 microns en mètres
    const flux_below_9um = earth_flux.filter((flux, idx) => lambda_range[idx] < lambda_9um).reduce((sum, f) => sum + f, 0);
    const flux_total = earth_flux.reduce((sum, f) => sum + f, 0);
    
    let flux_in = [...earth_flux];
    
    // Parcourir chaque couche d'altitude
    for (let i = 0; i < z_range.length; i++) {
        const z = z_range[i];
        const T = temperature(z, CO2_fraction, T0_test);
        const n_CO2 = airNumberDensity(z, CO2_fraction, T0_test) * CO2_fraction;
        
        // Calculer pour chaque longueur d'onde
        for (let j = 0; j < lambda_range.length; j++) {
            const lambda = lambda_range[j];
            
            // Absorption CO2
            const kappa_CO2 = crossSectionCO2(lambda) * n_CO2;
            
            // Absorption H2O (si activé)
            const n_H2O = waterVaporNumberDensity(z, CO2_fraction, T0_test);
            const h2o_enabled = (typeof window !== 'undefined' && window.waterVaporEnabled !== undefined) 
                ? window.waterVaporEnabled 
                : waterVaporEnabled;
            const kappa_H2O = h2o_enabled ? crossSectionH2O(lambda) * n_H2O : 0;
            
            // Debug: analyser l'absorption H2O dans la zone < 9μm (une fois par itération, pour quelques longueurs d'onde clés)
            if (i === 0 && (j === 0 || j === Math.floor(lambda_range.length / 4) || j === Math.floor(lambda_range.length / 2))) {
                const lambda_um = lambda * 1e6;
            }
            
            // Coefficient d'absorption total (CO2 + H2O)
            const kappa = kappa_CO2 + kappa_H2O;
            
            optical_thickness[i][j] = kappa * delta_z;
            
            if (CO2_fraction === 0 && !h2o_enabled) {
                // Pas d'absorption si CO2 = 0 et H2O désactivé
                upward_flux[i][j] = flux_in[j];
                emitted_flux[i][j] = 0;
                absorbed_flux[i][j] = 0;
            } else {
                // Transfert radiatif dans la couche :
                // 1. Absorption : le CO2/H2O absorbe une partie du flux entrant
                const abs_flux = Math.min(kappa * delta_z * flux_in[j], flux_in[j]);
                // 2. Émission : le CO2/H2O réémet à sa température (loi de Planck)
                //    F_émis = τ × π × B_λ(T_couche) × Δλ
                const em_flux = optical_thickness[i][j] * Math.PI * localPlanckFunction(lambda, T) * delta_lambda;
                // 3. Flux sortant = flux entrant - absorption + émission
                //    NOTE : Le "palier" observé dans les courbes correspond à F_émis
                //    Quand l'absorption est totale (F_absorbé ≈ F_entrant),
                //    alors F_sortant ≈ F_émis, ce qui crée un "palier" qui suit
                //    la courbe de Planck à la température de la couche la plus froide
                //    (généralement la tropopause ~216K)
                upward_flux[i][j] = flux_in[j] - abs_flux + em_flux;
                // Stocker les valeurs pour la visualisation
                emitted_flux[i][j] = em_flux;
                absorbed_flux[i][j] = abs_flux;
            }
            
            flux_in[j] = upward_flux[i][j];
        }
    }
    
    // Calculer le flux total au sommet
    const total_flux = upward_flux[upward_flux.length - 1].reduce((sum, val) => sum + val, 0);
    
    // Debug: analyser le flux < 9μm au sommet de l'atmosphère
    const top_flux = upward_flux[upward_flux.length - 1];
    const lambda_9um_top = 9e-6;
    const top_flux_below_9um = top_flux.filter((flux, idx) => lambda_range[idx] < lambda_9um_top).reduce((sum, f) => sum + f, 0);
    const top_flux_total = top_flux.reduce((sum, f) => sum + f, 0);
    
    return { total_flux, lambda_range, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux };
}

// Fonction helper pour afficher une courbe temporaire pendant la dichotomie
function displayDichotomyStep(CO2_fraction, T0_test, result, iteration, isInitial = false) {
    if (typeof window === 'undefined') return;
    
    // Créer un objet plotData temporaire pour l'affichage
    // ✅ SCIENTIFIQUEMENT CERTAIN : Loi de Stefan-Boltzmann T = (F/σ)^(1/4)
    // - Cette loi décrit la température effective d'un corps noir en équilibre radiatif
    // - Dérivée de la loi de Planck, elle est exacte pour un corps noir
    // - La constante σ = 5.67×10⁻⁸ W/(m²·K⁴) est une constante fondamentale
    const STEFAN_BOLTZMANN = window.STEFAN_BOLTZMANN || 5.670374419e-8;
    const temp_eff = Math.pow(result.total_flux / STEFAN_BOLTZMANN, 0.25);
    // Calculer la température terrestre en °C à partir de T0_test (température au sol en K)
    const temp_surface_c = T0_test - 273.15;
    const temp_eff_0 = 255.0; // Température effective sans CO2 (référence 255K)
    
    // Récupérer l'albedo et la couverture nuageuse depuis les résultats
    const h2o_enabled = (typeof window !== 'undefined' && window.waterVaporEnabled !== undefined)
        ? window.waterVaporEnabled
        : false;
    const albedo = result.albedo !== undefined ? result.albedo : calculateAlbedo(T0_test, h2o_enabled);
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
    
    const tempPlotData = {
        lambda_range: result.lambda_range,
        z_range: result.z_range,
        current: {
            upward_flux: result.upward_flux,
            effective_temperature: temp_eff,
            emitted_flux: result.emitted_flux,
            absorbed_flux: result.absorbed_flux,
            earth_flux: result.earth_flux,
            lambda_range: result.lambda_range, // Nécessaire pour updateSpectralVisualization
            z_range: result.z_range, // Nécessaire pour updateSpectralVisualization
            albedo: albedo,
            cloud_coverage: cloud_coverage
        },
        co2_ppm: CO2_fraction * 1e6,
        temp_surface_c: temp_surface_c // Température intermédiaire pour mise à jour de la couleur en temps réel
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
    // Définir la fraction CO2 globale
    current_CO2_fraction_for_temp = CO2_fraction;
    current_T0_adjusted = null; // Réinitialiser
    
    const {
        z_max = 120000,
        delta_z = 50,
        lambda_min = 0.1e-6,
        lambda_max = 100e-6,
        delta_lambda = 0.1e-6
    } = options;
    
    // Calculer T0 initiale (approximation avec albedo de base)
    // Utiliser un albedo de base pour l'initialisation (sans glace ni nuages)
    const T0_no_greenhouse = Math.pow(calculateSolarFluxAbsorbed(255, false) / STEFAN_BOLTZMANN, 0.25);
    let T0_initial;
    if (CO2_fraction === 0) {
        T0_initial = T0_no_greenhouse;
    } else {
        const CO2_ref = 1e-6;
        const forcing_CO2 = 5.35 * Math.log(Math.max(CO2_fraction, CO2_ref) / CO2_ref);
        const climate_sensitivity = 0.8;
        const delta_T_greenhouse = climate_sensitivity * forcing_CO2;
        T0_initial = T0_no_greenhouse + delta_T_greenhouse;
    }
    
    // Si H2O est activé, ajuster T0_initial (H2O ajoute un effet de serre important)
    const h2o_enabled = (typeof window !== 'undefined' && window.waterVaporEnabled !== undefined) 
        ? window.waterVaporEnabled 
        : waterVaporEnabled;
    if (h2o_enabled) {
        // H2O ajoute un effet de serre supplémentaire, mais limité pour éviter l'emballement
        // Réduit de 25K à 15K pour limiter la rétroaction positive température → nuages → forçage
        T0_initial += 15; // Approximation réduite
    }
    
    // Dichotomie pour trouver T0 qui donne flux_total = flux_solaire_absorbé
    // Réduire les pas initiaux en centrant les bornes autour de T0_initial
    // Intervalle initial plus serré : ±50K autour de T0_initial (au lieu de 200-350K)
    const INITIAL_RANGE = 50; // Intervalle initial autour de T0_initial (K)
    let T0_min = Math.max(200, T0_initial - INITIAL_RANGE); // Borne inférieure, minimum 200K
    let T0_max = Math.min(h2o_enabled ? 400 : 350, T0_initial + INITIAL_RANGE); // Borne supérieure, maximum selon H2O
    let T0 = T0_initial;
    const tolerance = 0.1; // Tolérance sur le flux (W/m²)
    const max_iterations = 20;
    let iteration = 0;
    let result = null;
    
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
            // Créer un plotData temporaire avec seulement les courbes Planck
            const tempPlotData = {
                lambda_range: temp_lambda_range,
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
    result = calculateFluxForT0(CO2_fraction, T0_initial, options);
    
    // Afficher la courbe initiale (avant dichotomie) seulement si demandé
    if (shouldDisplaySteps) {
        displayDichotomyStep(CO2_fraction, T0_initial, result, 0, true);
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
                
                // Déclarer shouldDisplaySteps une seule fois pour toute la fonction iterate
                const shouldDisplaySteps = typeof window !== 'undefined' && window.showDichotomySteps;
                
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
                    
                    final_result = calculateFluxForT0(CO2_fraction, T0_current, options);
                    // Calculer le flux solaire absorbé avec albedo dynamique (glace + nuages)
                    const solar_flux_absorbed = calculateSolarFluxAbsorbed(T0_current, h2o_enabled);
                    const flux_diff = final_result.total_flux - solar_flux_absorbed;
                    
                    // Afficher chaque étape de la dichotomie seulement si demandé
                    if (shouldDisplaySteps && !isCancelled) {
                        displayDichotomyStep(CO2_fraction, T0_current, final_result, iter + 1, false);
                    }
                    
                    if (Math.abs(flux_diff) < tolerance) {
                        // Convergence atteinte
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
                        T0_max = T0_current;
                        T0_current = (T0_min + T0_max) / 2;
                    } else {
                        // Flux trop faible, augmenter T0
                        T0_min = T0_current;
                        T0_current = (T0_min + T0_max) / 2;
                    }
                    
                    iter++;
                    // Incrémenter le temps à chaque itération de dichotomie
                    if (typeof window !== 'undefined' && typeof window.incrementTimeline === 'function') {
                        window.incrementTimeline();
                    }
                    // Continuer avec un délai pour permettre la visualisation
                    if (shouldDisplaySteps && !isCancelled) {
                        const timeoutId = setTimeout(iterate, 50); // Délai pour visualiser chaque étape
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
            const solar_flux_absorbed = calculateSolarFluxAbsorbed(T0, h2o_enabled);
            const flux_diff = result.total_flux - solar_flux_absorbed;
            
            // Incrémenter le temps à chaque itération de dichotomie
            if (typeof window !== 'undefined' && typeof window.incrementTimeline === 'function') {
                window.incrementTimeline();
            }
            
            if (Math.abs(flux_diff) < tolerance) {
                // Convergence atteinte
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
                T0 = (T0_min + T0_max) / 2;
            } else {
                // Flux trop faible, augmenter T0
                T0_min = T0;
                T0 = (T0_min + T0_max) / 2;
            }
            
            iteration++;
        }
        
        
        // Stocker la T0 ajustée
        current_T0_adjusted = T0;
        
        // Utiliser les résultats de la dernière itération
        const { lambda_range, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux } = result;
        
        return finalizeResultsSync(result, T0, lambda_range, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux, CO2_fraction);
    }
}

// Fonction pour finaliser les résultats (mode asynchrone)
function finalizeResults(final_result, final_T0, CO2_fraction, resolve) {
    // Stocker la T0 ajustée
    current_T0_adjusted = final_T0;
    
    // Utiliser les résultats de la dernière itération
    const { lambda_range, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux } = final_result;
    
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
    
    // ✅ SCIENTIFIQUEMENT CERTAIN : Température effective (loi de Stefan-Boltzmann)
    // - T_eff = (F/σ)^(1/4) où F est le flux radiatif total et σ la constante de Stefan-Boltzmann
    // - Cette formule est exacte pour un corps noir en équilibre radiatif
    // - Pour la Terre sans effet de serre : T_eff ≈ 255K (-18°C) - valeur bien établie
    const effective_temperature = Math.pow(total_flux / STEFAN_BOLTZMANN, 0.25);
    
    // Calculer l'albedo dynamique et la couverture nuageuse
    const h2o_enabled = (typeof window !== 'undefined' && window.waterVaporEnabled !== undefined) 
        ? window.waterVaporEnabled 
        : waterVaporEnabled;
    const albedo = calculateAlbedo(final_T0, h2o_enabled);
    const cloud_coverage = calculateCloudCoverage(final_T0, h2o_enabled);
    
    const final_result_obj = {
        lambda_range: lambda_range,
        z_range: z_range,
        upward_flux: upward_flux,
        optical_thickness: optical_thickness,
        emitted_flux: emitted_flux,
        absorbed_flux: absorbed_flux,
        earth_flux: earth_flux,
        total_flux: total_flux,
        effective_temperature: effective_temperature,
        albedo: albedo,
        cloud_coverage: cloud_coverage
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
function finalizeResultsSync(result, T0, lambda_range, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux, CO2_fraction) {
    // Calculer le flux total au sommet de l'atmosphère
    const total_flux = upward_flux[upward_flux.length - 1].reduce((sum, val) => sum + val, 0);
    
    // Récupérer h2o_enabled pour calculer l'albedo dynamique et la couverture nuageuse
    const h2o_enabled = (typeof window !== 'undefined' && window.waterVaporEnabled !== undefined) 
        ? window.waterVaporEnabled 
        : waterVaporEnabled;
    const solar_flux_absorbed = calculateSolarFluxAbsorbed(T0, h2o_enabled);
    const albedo = calculateAlbedo(T0, h2o_enabled);
    const cloud_coverage = calculateCloudCoverage(T0, h2o_enabled);
    
    // ✅ SCIENTIFIQUEMENT CERTAIN : Température effective (loi de Stefan-Boltzmann)
    // - T_eff = (F/σ)^(1/4) où F est le flux radiatif total et σ la constante de Stefan-Boltzmann
    // - Cette formule est exacte pour un corps noir en équilibre radiatif
    // - Pour la Terre sans effet de serre : T_eff ≈ 255K (-18°C) - valeur bien établie
    const effective_temperature = Math.pow(total_flux / STEFAN_BOLTZMANN, 0.25);
    
    return {
        lambda_range: lambda_range,
        z_range: z_range,
        upward_flux: upward_flux,
        optical_thickness: optical_thickness,
        emitted_flux: emitted_flux,
        absorbed_flux: absorbed_flux,
        earth_flux: earth_flux,
        total_flux: total_flux,
        effective_temperature: effective_temperature,
        albedo: albedo,
        cloud_coverage: cloud_coverage
    };
}

// ============================================================================
// EXPORT POUR UTILISATION
// ============================================================================

// Exposer les fonctions globalement pour être accessibles depuis main.js
if (typeof window !== 'undefined') {
    window.simulateRadiativeTransfer = simulateRadiativeTransfer;
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

