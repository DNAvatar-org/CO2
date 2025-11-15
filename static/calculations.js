// ============================================================================
// CALCULS DE TRANSFERT RADIATIF EN JAVASCRIPT
// ============================================================================

// Constantes physiques
const PLANCK_H = 6.62607015e-34;      // Constante de Planck, J·s
const SPEED_OF_LIGHT = 2.998e8;       // Vitesse de la lumière, m/s
const BOLTZMANN_KB = 1.380649e-23;    // Constante de Boltzmann, J/K
const STEFAN_BOLTZMANN = 5.670374419e-8; // Constante de Stefan-Boltzmann, W/(m²·K⁴)

// Constantes climatiques
const SOLAR_CONSTANT = 1366;          // Constante solaire, W/m²
const ALBEDO_BASE = 0.3;               // Albédo de base terrestre (30% réfléchi)

// Fonction pour calculer l'albedo dynamique basé sur la glace et les nuages
// Modélisation créative inspirée de :
// - "Ice-Albedo Feedback in Climate Models" (approximation simplifiée)
// - Modèles de rétroaction glace-albedo (Budyko, 1969; Sellers, 1969)
// - Paramétrisation nuageuse simplifiée pour visualisation pédagogique
function calculateAlbedo(T_surface_K, h2o_enabled) {
    const T_surface_C = T_surface_K - 273.15;
    let albedo = ALBEDO_BASE;
    
    // Contribution de la glace (albedo augmente avec le froid)
    // Modélisation : transition progressive de l'albedo terrestre vers l'albedo glaciaire
    // Référence conceptuelle : rétroaction glace-albedo (modèles simplifiés de climat)
    // Si température < 0°C, il y a de la glace
    // À -2.2°C, on veut beaucoup de glace (fraction élevée)
    if (T_surface_C < 0) {
        // Albedo de la glace : ~0.6-0.9 selon l'épaisseur (valeur moyenne choisie pour visualisation)
        // Note : Le blanc (glace) ne fait pas totalement miroir, il y a une rediffusion vers le bas
        // Plus il fait froid, plus il y a de glace
        // Utiliser une fonction qui monte rapidement : à -2.2°C, on veut ~70% de la surface du globe couverte de glace
        const ice_albedo = 0.7; // Albedo moyen de la glace (approximation créative)
        // Fonction exponentielle pour avoir beaucoup de glace dès -2.2°C
        // À -2.2°C : fraction = 1 - exp(-2.2/3) ≈ 0.7 (70% de la surface du globe couverte de glace)
        // À -10°C : fraction ≈ 0.97 (97% de la surface du globe couverte de glace)
        const ice_fraction = Math.min(1, 1 - Math.exp(T_surface_C / 3)); // Fraction de surface couverte de glace (0 à 1)
        // Transition progressive : albedo = base + (glace - base) * fraction_glace
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
        // Albedo des nuages : ~0.3-0.6 selon la couverture nuageuse (valeur moyenne choisie)
        const cloud_albedo = 0.4; // Albedo moyen des nuages (approximation créative)
        
        // Utiliser la fonction dédiée pour calculer la couverture nuageuse
        const cloud_fraction = calculateCloudCoverage(T_surface_K, h2o_enabled);
        
        // Diviser par 2 car les nuages noirs ne réfléchissent pas (ou très peu)
        albedo = albedo + (cloud_albedo * cloud_fraction) / 2;
    }
    
    // Clamper entre 0.1 et 0.9 (valeurs physiques raisonnables pour la Terre)
    return Math.max(0.1, Math.min(0.9, albedo));
}

// Fonction pour calculer la couverture nuageuse (fraction de surface couverte vue depuis le ciel)
function calculateCloudCoverage(T_surface_K, h2o_enabled) {
    if (!h2o_enabled) {
        return 0; // Pas de nuages si H2O désactivé
    }
    
    const T_surface_C = T_surface_K - 273.15;
    
    // Couverture nuageuse proportionnelle à la température au sol
    // Plus il fait chaud, plus il y a d'évaporation et donc de nuages
    // Fonction croissante : à 0°C = 0.2, à 15°C = 0.5, à 30°C = 0.8
    // Approximation linéaire entre 0°C et 30°C
    const cloud_fraction_min = 0.2; // Couverture minimale à 0°C
    const cloud_fraction_max = 0.8; // Couverture maximale à 30°C
    const T_ref_min = 0; // Température de référence minimale (°C)
    const T_ref_max = 30; // Température de référence maximale (°C)
    
    if (T_surface_C <= T_ref_min) {
        return cloud_fraction_min;
    } else if (T_surface_C >= T_ref_max) {
        return cloud_fraction_max;
    } else {
        // Interpolation linéaire entre T_ref_min et T_ref_max
        return cloud_fraction_min + (cloud_fraction_max - cloud_fraction_min) * 
               ((T_surface_C - T_ref_min) / (T_ref_max - T_ref_min));
    }
}

// Fonction pour calculer le flux solaire absorbé avec albedo dynamique
function calculateSolarFluxAbsorbed(T_surface_K, h2o_enabled) {
    const albedo = calculateAlbedo(T_surface_K, h2o_enabled);
    return SOLAR_CONSTANT * (1 - albedo) / 4; // Divisé par 4 car la surface de la sphère (4πr²) est 4 fois la section (πr²)
}

// Fonction pour calculer le forçage radiatif du CO2
function calculateCO2Forcing(CO2_fraction) {
    const CO2_ref = 280e-6; // Référence pré-industrielle (280 ppm)
    if (CO2_fraction <= 0) return 0;
    return 5.35 * Math.log(Math.max(CO2_fraction, CO2_ref) / CO2_ref); // W/m²
}

// Fonction pour calculer le forçage radiatif de H2O (vapeur d'eau)
// Approximation : effet de serre supplémentaire de ~20-30 W/m² quand H2O est activé
function calculateH2OForcing(h2o_enabled, cloud_coverage) {
    if (!h2o_enabled) return 0;
    // Forçage basé sur la couverture nuageuse et l'effet de serre de la vapeur d'eau
    // Approximation : ~25 W/m² pour une couverture nuageuse complète
    const base_forcing = 20; // Forçage de base de la vapeur d'eau (W/m²)
    const cloud_forcing = cloud_coverage * 10; // Contribution des nuages (jusqu'à 10 W/m²)
    return base_forcing + cloud_forcing; // W/m²
}

// Fonction pour calculer le forçage radiatif de l'albedo (négatif)
// Un albedo plus élevé réduit le flux solaire absorbé
function calculateAlbedoForcing(albedo) {
    const ALBEDO_REF = 0.3; // Albedo de référence
    // Forçage négatif : ΔF = S_0/4 * (A_ref - A_actuel)
    // Si albedo augmente, le forçage devient plus négatif (moins d'absorption)
    return SOLAR_CONSTANT / 4 * (ALBEDO_REF - albedo); // W/m² (négatif si albedo > 0.3)
}

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

function planckFunction(lambda, T) {
    const term1 = (2 * PLANCK_H * SPEED_OF_LIGHT * SPEED_OF_LIGHT) / Math.pow(lambda, 5);
    const term2 = Math.exp((PLANCK_H * SPEED_OF_LIGHT) / (lambda * BOLTZMANN_KB * T)) - 1;
    return term1 / term2;
}

// ============================================================================
// MODÈLE ATMOSPHÉRIQUE
// ============================================================================

function pressure(z) {
    const P0 = 101325;  // Pression au niveau de la mer, Pa
    const H = 8500;     // Échelle de hauteur, m
    return P0 * Math.exp(-z / H);
}

// Variable globale pour stocker la fraction CO2 actuelle et T0 ajustée
let current_CO2_fraction_for_temp = null;
let current_T0_adjusted = null; // T0 ajustée par dichotomie

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
    
    const z_trop = 11000; // Hauteur de la tropopause, m
    const Gamma = -0.0065; // Gradient de température, K/m
    const T_trop = T0 + Gamma * z_trop;
    
    if (z < z_trop) {
        return T0 + Gamma * z;
    } else {
        return T_trop;
    }
}

function airNumberDensity(z, CO2_fraction = null, T0_override = null) {
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
function waterVaporMixingRatio(z) {
    const r0 = 0.015;  // Mixing ratio au niveau de la mer (~1.5%)
    const H_H2O = 2500; // Échelle de hauteur de la vapeur d'eau (m)
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
        Math.PI * planckFunction(lambda, T0_test) * delta_lambda
    );
    
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
                const em_flux = optical_thickness[i][j] * Math.PI * planckFunction(lambda, T) * delta_lambda;
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
    return { total_flux, lambda_range, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux };
}

// Fonction helper pour afficher une courbe temporaire pendant la dichotomie
function displayDichotomyStep(CO2_fraction, T0_test, result, iteration, isInitial = false) {
    if (typeof window === 'undefined') return;
    
    // Créer un objet plotData temporaire pour l'affichage
    const temp_eff = Math.pow(result.total_flux / STEFAN_BOLTZMANN, 0.25);
    // Calculer la température terrestre en °C à partir de T0_test (température au sol en K)
    const temp_surface_c = T0_test - 273.15;
    
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
            z_range: result.z_range // Nécessaire pour updateSpectralVisualization
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
        // H2O ajoute environ 20-30 K d'effet de serre supplémentaire
        T0_initial += 25; // Approximation
    }
    
    // Dichotomie pour trouver T0 qui donne flux_total = flux_solaire_absorbé
    let T0_min = 200; // Borne inférieure (K)
    let T0_max = h2o_enabled ? 400 : 350; // Borne supérieure plus élevée si H2O activé
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
            
            console.log(`[Dichotomie] Itération ${iteration + 1}: T0 = ${T0.toFixed(2)} K, flux = ${result.total_flux.toFixed(2)} W/m², diff = ${flux_diff.toFixed(2)} W/m²`);
            
            if (Math.abs(flux_diff) < tolerance) {
                console.log(`[Dichotomie] Convergence atteinte après ${iteration + 1} itérations`);
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
        
        if (iteration >= max_iterations) {
            console.log(`[Dichotomie] Maximum d'itérations atteint, utilisation de T0 = ${T0.toFixed(2)} K`);
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
    
    // Température effective (loi de Stefan-Boltzmann)
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
    
    console.log(`Flux total calculé: ${total_flux.toFixed(2)} W/m² pour ${(CO2_fraction * 1e6).toFixed(0)} ppm`);
    console.log(`Albedo: ${(albedo * 100).toFixed(1)}% (glace: ${T0 < 273.15 ? 'oui' : 'non'}, nuages: ${h2o_enabled ? 'oui' : 'non'})`);
    console.log(`Flux solaire absorbé attendu: ${solar_flux_absorbed.toFixed(2)} W/m²`);
    console.log(`Différence: ${(total_flux - solar_flux_absorbed).toFixed(2)} W/m²`);
    
    // Température effective (loi de Stefan-Boltzmann)
    const effective_temperature = Math.pow(total_flux / STEFAN_BOLTZMANN, 0.25);
    console.log(`Température effective: ${effective_temperature.toFixed(2)} K (${(effective_temperature - 273.15).toFixed(2)} °C)`);
    
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
    window.calculateCO2Forcing = calculateCO2Forcing;
    window.calculateH2OForcing = calculateH2OForcing;
    window.calculateAlbedoForcing = calculateAlbedoForcing;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        planckFunction,
        temperature,
        simulateRadiativeTransfer,
        CO2_PREINDUSTRIAL,
        CO2_CURRENT
    };
}

