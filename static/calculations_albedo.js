// File: calculations_albedo.js - Calculs albedo et couverture nuageuse
// Desc: En français, dans l'architecture, je suis le module de calculs d'albedo
// Version 1.2.18
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
// - epochId Archéen : 🦠 (🌋 réservé actions). Archéen utilise clouds modernes pour ~15°C.
// - 🍰⚖️💦 : formule P = W/τ (litt. 8–10 j), ⏳☔ = 1/τ_global ; rampe (RH−💭☔)/0,2 ; ref. Nature Rev. Earth Env. 2021, HESS 2017, GPCP ~2,7 mm/j.
// - v1.2.1 : rampe douce 🍰🪩🧊 en Search/Dicho (premières itérations) pour éviter saut de bassin albédo/glace
// - v1.2.2 : verrou optionnel glace initiale pendant Search du premier bassin (🧮🔄🌊=0) pour stabiliser le point fixe froid
// - v1.2.3 : retrait gardes défensives CONFIG_COMPUTE sur rampe glace (règle crash)
// - v1.2.4 : héritage glaciaire pondéré par durée d'époque (blend une fois/époque entre glace héritée et glace d'équilibre à T_config)
// - v1.2.5 : expose une glace d'époque figée (_iceEpochFixedState) pour bloquer le recalcul glace dans le solver radiatif
// - v1.2.6 : rampe glace renforcée au début Search (0.001 pendant 10 itérations), puis step nominal
// - v1.2.7 : verrou glace par époque en phase solver (Search/Dicho) via _iceEpochFixedState (anti-bistabilité)
// - v1.2.8 : proxy CCN continu (O2, T, CO2) pour 🍰🪩⛅ sans if d'époque + refs CERES/MODIS/FYSP en commentaires
// - v1.2.9 : proxy CCN enrichi (O2 + biomasse + facteur anthropique) + efficacité optique type Twomey
// - v1.2.10 : facteur anthropique progressif (1900→1980 puis déclin SO2) + sulfate_proxy ; commentaires justificatifs littérature
// - v1.2.11 : log updateLevelsConfig clarifié (vapeur init UI vs état cycle eau) + ajout masse totale H2O
// - v1.2.12 : priorité verrou glace d'époque sur _iceCoverageLock (évite 🧊=0.09 quand _iceEpochFixedState=0.022)
// - v1.2.13 : séparation verrou glace albédo (🍰🪩🧊) du verrou glace eau (🍰💧🧊) + log proxy nuages optionnel
// - v1.2.14 : calibration CCN normalisée sur un référentiel moderne (eta_cloud ~1 en 📱), logs cloud-proxy enrichis
// - v1.2.15 : nuages SW "version physique" (CCN+pression+oxydation+température), doc scientifique intégrée en commentaires
// - v1.2.16 : recalibration physique nuages SW (référence moderne explicite) pour retrouver 🍰🪩⛅~0.28-0.35 en 📱
// - v1.2.17 : annotation explicite OBS vs EQ dans le bloc nuages (traçabilité source des constantes)
// - v1.2.18 : formule forêt revue (land_frac + suitability thermique + modulation océanique) pour éviter 🌳=0 en moderne
//
// FORMULES ALBEDO :
// 🍰🪩📿 = Σ(🍰🪩❀ × 🪩🍰❀) pour ❀ ∈ {🌋,🌊,🌳,🌍,🏜️,🧊} + contribution_glace + contribution_nuages
//   où contribution_glace = (🪩🍰🧊 - albedo_base) × 🍰💧🧊 × 0.5
//   et contribution_nuages = albedo × (1 - 🍰🪩⛅) + 🪩🍰⛅ × 🍰🪩⛅
// 🍰🪩🌋 = volcano_coverage = f(T, flux_geo) : Hadéen=1.0, sinon min(1.0, flux_geo/10000)
// 🍰🪩🌊 = ocean_coverage = (ocean_volume_m3 / (📏🌊 × 1000)) × 🐚 / (4π × 📐²)
//   où ocean_volume_m3 = (⚖️💧 × 🍰💧🌊) / 1000
// 🍰🪩🌳 = forest_coverage = f(T, ocean_coverage) : si T<30°C et ocean>0.1 alors min(0.5, ocean × (1-T/30))
// 🍰🪩🌍 = land_coverage = max(0, 1.0 - ocean - ice - forest) (continents, prairies, sols humides, albedo ~0.18)
// 🍰🪩🏜️ = desert_coverage = 1.0 - (🌋 + 🌊 + 🌳 + 🌍 + 🧊) (zones arides, albedo ~0.30)
// 🍰🪩🧊 = ice_coverage = min(0.9, 🍰💧🧊 × 0.9)
// 🍰🪩⛅ = cloud_coverage = C_max × ☁️ où C_max ≈ 0.7 et ☁️ = CloudFormationIndex

// ============================================================================
// COEFFICIENTS D'ALBÉDO PAR TYPE DE SURFACE
// ============================================================================
// Coefficients d'albédo déplacés dans CONST (propriétés physiques constantes)
// Utiliser CONST.ALBEDO_REFLECTOR_COEFF depuis physics.js

// ============================================================================
// FONCTION : CALCULER LES SURFACES GÉOLOGIQUES (COUCHE A)
// ============================================================================
// 🔒 NOUVEAU PIPELINE : Géologie → Surfaces → Stocks → Climat → Albedo
// Cette fonction fixe les surfaces à partir de la géologie/relief (quasi constants)
// Les surfaces déterminent ensuite les stocks d'eau, pas l'inverse

function calculateGeologySurfaces() {
    const DATA = window.DATA;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    
    // Lire depuis les configs epoch - DOIT EXISTER (crash si manquant)
    const ocean_basin_fraction = EPOCH['🗻']['🍰🗻🌊'];
    const highlands_fraction = EPOCH['🗻']['🍰🗻🏔'];
    const lowlands_fraction = EPOCH['🗻']['🍰🗻🌍'];
    
    // Vérifier que la somme est cohérente (doit être ≤ 1.0)
    const total = ocean_basin_fraction + lowlands_fraction + highlands_fraction;
    if (total > 1.0) {
        console.warn(`⚠️ [calculateGeologySurfaces] Somme > 1.0 (${total}), normalisation...`);
        const scale = 1.0 / total;
        ocean_basin_fraction *= scale;
        lowlands_fraction *= scale;
        highlands_fraction *= scale;
    }
    
    // Stocker les surfaces géologiques dans DATA
    // Ces valeurs sont fixes (géologie) et déterminent les stocks d'eau
    DATA['🗻']['🍰🗻🌊'] = ocean_basin_fraction;  // Surface océanique potentielle
    DATA['🗻']['🍰🗻🏔'] = highlands_fraction;     // Hautes terres (zones de glace potentielles)
    DATA['🗻']['🍰🗻🌍'] = lowlands_fraction;      // Terres basses (zones de forêts/continents)
    
    return true;
}

// ============================================================================
// FONCTION : CALCULER L'INDEX DE FORMATION NUAGEUSE (☁️)
// ============================================================================
// ☁️ = CloudFormationIndex ∈ [0, 1] : potentiel de condensation (ni masse ni surface)
//
// FORMULE RÉELLE (implémentée) — Schéma Sundqvist 1989 :
// ☁️ = (1 - Math.pow(1 - min(🍰🫧☔, 1), 0.6)) × 🍰💭
//   où 🍰🫧☔ = humidité relative (q/q_sat), 🍰💭 = CCN (0.3–1.0).
// À HR=98.9% : ☁️ ≈ 0.93 × 🍰💭. ☁️ n'utilise PAS 🍰🫧💧🌈 (cap. rad. IR, calculée ailleurs).
//
// Note : L'ancienne formule (🍰🫧💧/H2O_VAPOR_REF × f(T) × ...) n'est plus utilisée.

function calculateCloudFormationIndex() {
    const DATA = window.DATA;
    const CONST = window.CONST;

    const h2o_vapor_fraction = DATA['💧']['🍰🫧💧'];
    const h2o_vapor_ref = CONST.H2O_VAPOR_REF;
    const T_surface_K = DATA['🧮']['🧮🌡️'];
    const tropopause_km = DATA['🫧']['📏🫧🛩'];
    const ocean_coverage = DATA['🪩']['🍰🪩🌊'];
    const alpha_ocean = CONST.ALPHA_OCEAN;
    const phase = DATA['🧮']['🧮⚧'];

    // 🔒 CALCUL DE 🍰🫧☔ (Humidité relative moyenne globale)
    // FORMULE : 🍰🫧☔ = clamp(🍰🫧💧 / ((CONST.M_H2O / 🧪) × 🍰🧮🌧), 0, 1)
    // où :
    //   🍰🫧💧 = fraction massique de vapeur d'eau dans l'atmosphère
    //   CONST.M_H2O = masse molaire de H2O (0.01802 kg/mol)
    //   🧪 = masse molaire de l'air (DATA['🫧']['🧪'])
    //   🍰🧮🌧 = fraction molaire maximale de vapeur saturante (P_sat / P_total)
    //   (CONST.M_H2O / 🧪) × 🍰🧮🌧 = fraction massique saturante q_sat
    //   🍰🫧☔ = q / q_sat = humidité relative (RH)
    const M_H2O = CONST.M_H2O;
    const M_air = DATA['🫧']['🧪'];
    const max_vapor_fraction = DATA['💧']['🍰🧮🌧'];
    const mass_ratio = M_H2O / M_air;
    const q_sat = mass_ratio * max_vapor_fraction;  // Fraction massique saturante
    const relative_humidity = q_sat > 0 ? Math.max(0, Math.min(1, h2o_vapor_fraction / q_sat)) : 0;
    DATA['💧']['🍰🫧☔'] = relative_humidity;
    
    // 🔒 CALCUL DE 💭☔ (Seuil critique précipitations)
    // FORMULE : 💭☔ = clamp(0.75 + 0.05 × (🧮🌡️ - CONST.EVAPORATION_T_REF) / CONST.EVAPORATION_T_SCALE, 0.7, 0.95)
    const temp_K = DATA['🧮']['🧮🌡️'];
    const temp_diff = temp_K - CONST.EVAPORATION_T_REF;
    const temp_factor = temp_diff / CONST.EVAPORATION_T_SCALE;
    const precip_threshold = Math.max(0.7, Math.min(0.95, 0.75 + 0.05 * temp_factor));
    DATA['💧']['💭☔'] = precip_threshold;

    // 🔒 CALCUL DE 🍰💭 (CCN - Efficacité condensation nuageuse)
    // FORMULE : 🍰💭 = clamp(0.4 + 0.6 × (⚖️🫁 / 1.08e18 + ⚖️⛽ / 5.2e12), 0.3, 1.0)
    const O2_mass = DATA['⚖️']['⚖️🫁'];
    const CH4_mass = DATA['⚖️']['⚖️⛽'];
    const O2_ratio = O2_mass / 1.08e18;
    const CH4_ratio = CH4_mass / 5.2e12;
    const ccn_efficiency = Math.max(0.3, Math.min(1.0, 0.4 + 0.6 * (O2_ratio + CH4_ratio)));
    DATA['🫧']['🍰💭'] = ccn_efficiency;
    
    // 🔒 FORMULE SUNDQVIST : ☁️ = (1 - Math.pow(1 - min(🍰🫧☔, 1), 0.6)) × 🍰💭
    // Exposant 0.6 (Sundqvist 1989) au lieu de 0.5 (sqrt) pour donner des valeurs plus réalistes
    const rh_clamped = Math.min(relative_humidity, 1);
    const cloud_formation_index = (1 - Math.pow(1 - rh_clamped, 0.6)) * ccn_efficiency;
    
    // Clamp entre 0 et 1
    const clamped_index = Math.max(0, Math.min(1, cloud_formation_index));
    
    // Stocker dans DATA
    DATA['🪩']['☁️'] = clamped_index;
    
    // 🔒 CALCUL DE ⏳☔ (Inverse du temps de résidence global de la vapeur)
    // Littérature : temps de résidence vapeur ~8–10 j (Nature Rev. Earth Env. 2021; HESS 2017).
    // Relation : P = W/τ → taux précipitation (kg/m²/s) = colonne vapeur (kg/m²) / τ (s).
    // ⏳☔ = 1/τ_global (s⁻¹) pour cohérence avec le bilan eau et ~2,7 mm/j global (GPCP).
    const TAU_VAPOR_GLOBAL_S = 10 * 86400; // 10 j (litt. 8–10 j)
    const inv_tau_global = 1 / TAU_VAPOR_GLOBAL_S;
    DATA['💧']['⏳☔'] = inv_tau_global;
    
    // 🔒 INITIALISATION DE 🔺⏳ (Pas de temps fixe = 1 jour)
    // FORMULE : 🔺⏳ = 86400 s (1 jour)
    DATA['📅']['🔺⏳'] = 86400;
    
    // 🔒 CALCUL DE 🍰⚖️💦 (Taux de précipitation en kg/m²/s)
    // Formule littérature : P = W/τ (colonne vapeur / temps résidence). Quand RH > 💭☔, on applique
    // ce taux ; rampe lisse (RH - 💭☔)/0.2 pour éviter discontinuité au seuil.
    // Réf. : GPCP ~2,7 mm/j ; τ ~10 j → P ≈ W/(10×86400) ≈ 2,5–3 mm/j pour W ~25 kg/m².
    const atm_mass_total = DATA['⚖️']['⚖️🫧'];
    const planet_radius_km = window.TIMELINE[DATA['📜']['👉']]['📐'];
    const planet_surface_m2 = 4 * Math.PI * Math.pow(planet_radius_km * 1000, 2);
    const vapor_mass_per_m2 = (DATA['💧']['🍰🫧💧'] * atm_mass_total) / planet_surface_m2; // kg/m² (W)
    const rh_excess = relative_humidity - precip_threshold;
    const ramp = rh_excess <= 0 ? 0 : Math.min(1, rh_excess / 0.2);
    const precipitation_rate = ramp * (vapor_mass_per_m2 / TAU_VAPOR_GLOBAL_S); // kg/m²/s
    DATA['💧']['🍰⚖️💦'] = precipitation_rate;

    return clamped_index;
}

// ============================================================================
// FONCTION : CALCULER L'ALBEDO DYNAMIQUE
// ============================================================================

// Fonction pour calculer l'albedo dynamique basé sur la glace et les nuages
// Modélisation créative inspirée de :
// - "Ice-Albedo Feedback in Climate Models" (approximation simplifiée)
// - Modèles de rétroaction glace-albedo (Budyko, 1969; Sellers, 1969)
// - Paramétrisation nuageuse simplifiée pour visualisation pédagogique
function calculateAlbedo() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const T_surface_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
    const phase = DATA['🧮']['🧮⚧'];
    const epochId = DATA['📜']['🗿'];

    // Héritage glaciaire vs réinitialisation géologique :
    // époques courtes → forte inertie (glace héritée), époques longues → proche équilibre à T_config.
    function calcGlaceEquilibre(T_K) {
        const T_no_ice_K = CONST.T_NO_POLAR_ICE_C + CONST.KELVIN_TO_CELSIUS;
        const stock_factor = Math.max(0, (T_no_ice_K - T_K) / CONST.T_NO_POLAR_ICE_C);
        return Math.max(0, Math.min(1, 0.1 * stock_factor));
    }
    if (!window._iceDurationBlendState || window._iceDurationBlendState.epochId !== epochId) {
        const duree_ans = Math.abs(EPOCH['▶'] - EPOCH['◀']);
        const tau_glace_ans = window.CONFIG_COMPUTE.tauGlaceAns;
        const fraction_fonte = Math.max(0, Math.min(1, duree_ans / tau_glace_ans));
        const glace_heritee = DATA['💧']['🍰💧🧊'];
        const glace_equilibre = calcGlaceEquilibre(EPOCH['🌡️🧮']);
        DATA['💧']['🍰💧🧊'] = Math.max(0, Math.min(1, glace_heritee * (1 - fraction_fonte) + glace_equilibre * fraction_fonte));
        window._iceDurationBlendState = { epochId: epochId };
        window._iceEpochFixedWaterState = { epochId: epochId, value: DATA['💧']['🍰💧🧊'] };
        window._iceEpochFixedState = window._iceEpochFixedWaterState; // compat
    }
    // 🔒 ÉTAPE 1 : Calculer les surfaces géologiques (fixes, déterminées par la géologie)
    calculateGeologySurfaces();
    
    // 🔒 ÉTAPE 1.5 : Calculer volcano_coverage depuis la température de base de l'époque
    // À 2100°C (2373K), tout est lave → volcano_coverage = 1.0
    // Transition progressive : T < 1000K → 0, T > 2373K → 1.0
    const volcano_coverage = Math.max(0, Math.min(1.0, (DATA['📅']['🌡️🧮'] - CONST.T_LAVA_START) / (CONST.T_LAVA_COMPLETE - CONST.T_LAVA_START)));
    
    // 🔒 ÉTAPE 2 : Calculer la couverture océanique réelle depuis la géologie + stocks d'eau
    // La surface océanique est limitée par la géologie ET par la quantité d'eau disponible
    // Si volcano_coverage = 1.0, alors ocean_coverage = 0 (pas de mer possible)
    const planet_surface_m2 = 4 * Math.PI * EPOCH['📐'] * EPOCH['📐'];
    
    // Volume maximum que peut contenir le bassin océanique
    const ocean_basin_surface_m2 = DATA['🗻']['🍰🗻🌊'] * planet_surface_m2;
    const ocean_volume_max_m3 = (ocean_basin_surface_m2 / EPOCH['🐚']) * EPOCH['📏🌊'] * 1000;
    const ocean_mass_max_kg = ocean_volume_max_m3 * CONST.RHO_WATER;
    
    // Masse d'eau océanique réelle = min(stock_total, capacité_bassin)
    const ocean_mass_actual_kg = Math.min(DATA['⚖️']['⚖️💧'], ocean_mass_max_kg);
    
    // Surface océanique réelle (peut être < bassin si pas assez d'eau)
    const ocean_volume_actual_m3 = ocean_mass_actual_kg / CONST.RHO_WATER;
    const ocean_surface_actual_m2 = (ocean_volume_actual_m3 / EPOCH['📏🌊'] / 1000) * EPOCH['🐚'];
    const ocean_coverage_base = Math.min(DATA['🗻']['🍰🗻🌊'], Math.max(0.0, ocean_surface_actual_m2 / planet_surface_m2));
    
    // Réduire ocean_coverage proportionnellement à volcano_coverage
    const ocean_coverage = ocean_coverage_base * (1.0 - volcano_coverage);
    
    // 🔒 Stocker ocean_coverage dans DATA AVANT calculateCloudFormationIndex()
    // calculateCloudFormationIndex() a besoin de DATA['🪩']['🍰🪩🌊'] pour calculer ☁️
    DATA['🪩']['🍰🪩🌊'] = ocean_coverage;
    
    let albedo_base = 0.0;
    
    // 🔒 ÉTAPE 3 : Calculer la couverture de glace depuis les hautes terres + climat
    // FORMULE CORRIGÉE : 🍰🪩🧊 = min(🗻.🍰🗻🏔, max(0, 0.1 × (CONST.T_NO_POLAR_ICE_C + CONST.KELVIN_TO_CELSIUS - 🧮🌡️) / CONST.T_NO_POLAR_ICE_C))
    // La glace est limitée par la surface disponible (hautes terres) ET par la température
    // En 2025 : T ≈ 15°C (288.8K), il y a ~10% de glace polaire (Groenland ~3% + Antarctique ~7%)
    // Si T > 20°C (CONST.T_NO_POLAR_ICE_C), il n'y a plus de glace polaire
    // Si T = 0°C, glace maximale = 0.1 × (T_NO_POLAR_ICE_C + KELVIN_TO_CELSIUS - KELVIN_TO_CELSIUS) / T_NO_POLAR_ICE_C = 0.1
    // Correction : Utiliser un facteur plus élevé pour avoir ~10% à 15°C
    // À 15°C : 0.1 × (293.15 - 288.8) / 20 = 0.02175 (trop faible)
    // Pour avoir 0.1 à 15°C : facteur = 0.1 / ((293.15 - 288.8) / 20) = 0.46
    const temp_K = DATA['🧮']['🧮🌡️'];
    const T_no_ice_K = CONST.T_NO_POLAR_ICE_C + CONST.KELVIN_TO_CELSIUS;
    const ice_temp_factor = Math.max(0, (T_no_ice_K - temp_K) / CONST.T_NO_POLAR_ICE_C);
    const ice_fraction_target = Math.min(DATA['🗻']['🍰🗻🏔'], 0.46 * ice_temp_factor);
    let ice_fraction_base = ice_fraction_target;
    if (!window._iceCoverageRampState || window._iceCoverageRampState.epochId !== epochId) {
        window._iceCoverageRampState = { epochId: epochId, value: ice_fraction_target };
    }
    const isConvergencePhase = (phase === 'Search' || phase === 'Dicho');
    // === VERROU GLACE PAR ÉPOQUE (anti-bistabilité) ===
    const albedoFixedState = window._iceEpochFixedAlbedoState || window._iceEpochFixedState;
    const hasEpochIceLock = isConvergencePhase && albedoFixedState && albedoFixedState.epochId === epochId;
    if (hasEpochIceLock) {
        ice_fraction_base = Math.max(0, Math.min(DATA['🗻']['🍰🗻🏔'], albedoFixedState.value));
        // Option douce (Cénozoïque) :
        // ice_fraction_base = 0.85 * albedoFixedState.value + 0.15 * ice_fraction_target;
    }
    const freezeIceDuringSearch = window.CONFIG_COMPUTE.freezePolarIceDuringSearch !== false;
    const waterPass = (DATA['🧮'] && DATA['🧮']['🧮🔄🌊'] != null) ? DATA['🧮']['🧮🔄🌊'] : 0;
    const lock = window._iceCoverageLock;
    if (!hasEpochIceLock && freezeIceDuringSearch && isConvergencePhase && waterPass === 0 && lock && lock.epochId === epochId) {
        ice_fraction_base = Math.max(0, Math.min(DATA['🗻']['🍰🗻🏔'], lock.value));
    }
    const iterRadiatif = (DATA['🧮'] && DATA['🧮']['🧮🔄☀️'] != null) ? DATA['🧮']['🧮🔄☀️'] : 0;
    const rampIters = (window.CONFIG_COMPUTE.iceCoverageRampIters != null && Number.isFinite(window.CONFIG_COMPUTE.iceCoverageRampIters))
        ? Math.max(0, window.CONFIG_COMPUTE.iceCoverageRampIters)
        : 12;
    const rampMaxStep = (window.CONFIG_COMPUTE.iceCoverageRampMaxStep != null && Number.isFinite(window.CONFIG_COMPUTE.iceCoverageRampMaxStep))
        ? Math.max(0, window.CONFIG_COMPUTE.iceCoverageRampMaxStep)
        : 0.004;
    const rampEarlyIters = (window.CONFIG_COMPUTE.iceCoverageRampEarlyIters != null && Number.isFinite(window.CONFIG_COMPUTE.iceCoverageRampEarlyIters))
        ? Math.max(0, window.CONFIG_COMPUTE.iceCoverageRampEarlyIters)
        : 10;
    const rampMaxStepEarly = (window.CONFIG_COMPUTE.iceCoverageRampMaxStepEarly != null && Number.isFinite(window.CONFIG_COMPUTE.iceCoverageRampMaxStepEarly))
        ? Math.max(0, window.CONFIG_COMPUTE.iceCoverageRampMaxStepEarly)
        : 0.001;
    const rampStepActive = iterRadiatif < rampEarlyIters ? rampMaxStepEarly : rampMaxStep;
    if (isConvergencePhase && iterRadiatif < rampIters && !hasEpochIceLock && !(freezeIceDuringSearch && waterPass === 0 && lock && lock.epochId === epochId)) {
        const prevIce = window._iceCoverageRampState.value;
        const deltaIce = ice_fraction_target - prevIce;
        const deltaIceClamped = Math.max(-rampStepActive, Math.min(rampStepActive, deltaIce));
        ice_fraction_base = Math.max(0, Math.min(DATA['🗻']['🍰🗻🏔'], prevIce + deltaIceClamped));
    }
    window._iceCoverageRampState.value = ice_fraction_base;
    
    // 🔒 volcano_coverage déjà calculé plus haut (ligne ~200)
    
    // 🔒 ÉTAPE 4 : Calculer forêts/déserts/terres depuis l'indice d'humidité climatique (H)
    // NOUVEAU SYSTÈME : Répartition automatique 🌳 / 🏜️ / 🌍 basée sur température et précipitations
    // Les biomes dépendent uniquement de température et pluie, robuste pour d'autres planètes
    //
    // 1. Calculer précipitations annuelles P_ann (mm/an)
    // P_ann ∝ 🍰🧮🌧 × 🍰🪩🌊 × F_conv × facteur_échelle
    // Où 🍰🧮🌧 = max vapor fraction (potentiel de précipitation)
    //    🍰🪩🌊 = couverture océanique (source d'évaporation)
    //    F_conv = facteur de convection (fonction de température)
    // 🔒 CORRECTION : Le facteur d'échelle était trop faible
    // Sur Terre : 🍰🧮🌧 ≈ 0.017, 🍰🪩🌊 ≈ 0.71, F_conv ≈ 1.0
    // P_ann_base = 0.017 × 0.71 × 1.0 = 0.01207
    // Pour obtenir H ≈ 1.0 à 15°C : H = P_ann / (1000 × exp(0.05 × 15)) = P_ann / 2117
    // Donc P_ann ≈ 2117 mm/an pour H = 1.0
    // Facteur d'échelle : 2117 / 0.01207 ≈ 175000
    // Mais on veut H ≈ 1.0-1.2 pour avoir des forêts, donc facteur ≈ 200000
    const max_vapor_fraction = DATA['💧']['🍰🧮🌧'] || 0;
    const F_conv = Math.max(0.1, Math.min(2.0, 1.0 + (T_surface_C - 15) / 50));  // Facteur convection (T optimal ~15°C)
    const P_ann_base = max_vapor_fraction * ocean_coverage * F_conv;
    const P_ann = P_ann_base * 200000;  // Conversion en mm/an (facteur d'échelle corrigé)

    // 🔒 ÉTAPE 4 : Calculer ☁️ (index de formation nuageuse) AVANT de calculer les biomes
    // calculateCloudFormationIndex() calcule aussi 🍰🫧☔ (humidité relative) nécessaire pour les biomes
    window.calculateCloudFormationIndex();
    
    // 🔒 ÉTAPE 5 : Calculer les terres disponibles (🍰🪩🌍_)
    // FORMULE : 🍰🪩🌍_ = 1 - 🍰🗻🌊 - 🍰🪩🧊
    // Terres disponibles = surface totale - océans - glace
    const land_available = Math.max(0, 1.0 - DATA['🗻']['🍰🗻🌊'] - ice_fraction_base);
    
    // 🔒 ÉTAPE 6 : Calculer forêts 🌳
    // FORMULE (réaliste simplifiée) :
    // land_frac = 1 - 🍰🪩🌊 - 🍰🪩🧊
    // temp_suitability = clamp((T_K - 278)/15, 0, 1)  // fenêtre ~5 à 20°C
    // 🍰🪩🌳 = min(land_available, 0.31 * land_frac * temp_suitability * (1 + 0.5 * 🍰🪩🌊))
    // Réf ordre de grandeur : FAO (~31% des terres), Ramankutty & Foley (répartition biome-climat).
    const temp_C = T_surface_C;
    const relative_humidity = DATA['💧']['🍰🫧☔'];
    const land_frac = Math.max(0, 1.0 - ocean_coverage - ice_fraction_base);
    const temp_suitability = Math.max(0, Math.min(1, (DATA['🧮']['🧮🌡️'] - 278) / 15));
    const ocean_coupling = 1 + 0.5 * ocean_coverage;
    const forest_potential = 0.31 * land_frac * temp_suitability * ocean_coupling;
    const forest_coverage = Math.min(land_available, forest_potential);
    
    // 🔒 ÉTAPE 7 : Calculer déserts 🏜️
    // FORMULE CORRIGÉE : 🍰🪩🏜️ = 🍰🪩🌍_ × (base_aridité + variabilité_régionale)
    // Les déserts sont des zones régionales avec conditions locales très différentes de la moyenne globale
    // En 2025 : Sahara a P_ann < 200 mm/an et RH < 0.3, mais moyenne globale P_ann ≈ 2600 mm/an et RH ≈ 0.83
    // Correction : Utiliser un facteur de variabilité régionale pour avoir ~20% de déserts même si moyenne globale est humide
    // Base : déserts si conditions moyennes sont arides
    const precip_factor_desert = Math.max(0, 1 - Math.min(1, P_ann / 1000)); // P_ann < 1000 mm/an → désert
    const humidity_factor_desert = Math.max(0, 1 - Math.min(1, relative_humidity / 0.6)); // RH < 0.6 → désert
    const desert_base = land_available * precip_factor_desert * humidity_factor_desert;
    
    // Variabilité régionale : même si moyenne globale est humide, il y a toujours des zones arides
    // Facteur basé sur la température (plus chaud → plus de variabilité) et l'inverse de l'humidité
    // En 2025 : ~20% de déserts sur les terres (Sahara, Gobi, etc.) même si moyenne globale est humide
    // Sur les terres disponibles (0.20), on veut ~0.06 de déserts (30% des terres)
    const temp_variability = Math.max(0.5, Math.min(1, (temp_C - 5) / 10)); // Plus de variabilité si T > 5°C, minimum 0.5
    const humidity_variability = Math.max(0.5, 1 - relative_humidity * 0.6); // Plus de variabilité si RH faible, minimum 0.5
    const VARIABILITY_FACTOR = 0.6; // 60% des terres disponibles peuvent être arides (pondéré par les facteurs)
    const variability_term = land_available * VARIABILITY_FACTOR * temp_variability * humidity_variability;
    
    // Si EPOCH['🍰🪩🏜️'] est défini (même si = 0.0), l'utiliser directement (override pour cas particuliers comme Corps noir)
    // Utiliser ?? au lieu de || car 0.0 est falsy mais est une valeur valide qu'on veut utiliser
    const desert_coverage = EPOCH['🍰🪩🏜️'] ?? Math.min(land_available, desert_base + variability_term);
    
    // 🔒 ÉTAPE 8 : Calculer terres restantes 🌍
    // FORMULE : 🍰🪩🌍 = 🍰🪩🌍_ - 🍰🪩🌳 - 🍰🪩🏜️
    // 🌍 absorbe automatiquement : steppes, prairies, toundras, montagnes
    const total_land_coverage = Math.max(0, land_available - forest_coverage - desert_coverage);
    
    // 🔒 VÉRIFICATION : Les surfaces SECHES doivent sommer à 1 (sans H2O, sans nuages)
    // 🍰🪩🌊 + 🍰🪩🌳 + 🍰🪩🧊 + 🍰🪩🏜️ + 🍰🪩🌍 + 🍰🪩🌋 = 1
    // Les nuages ⛅ restent hors somme (fraction optique, pas surface au sol)
    // 🔒 H2O (glace) est calculé séparément pour l'albedo, mais ice_fraction_base est dans la somme des surfaces
    const surface_sum = volcano_coverage + ocean_coverage + forest_coverage + ice_fraction_base + total_land_coverage + desert_coverage;
    if (Math.abs(surface_sum - 1.0) > 0.01) {
        console.warn(`⚠️ [calculateAlbedo] Somme des surfaces = ${surface_sum.toFixed(4)} (attendu: 1.0) | 🌋=${volcano_coverage.toFixed(3)} 🌊=${ocean_coverage.toFixed(3)} 🌳=${forest_coverage.toFixed(3)} 🧊=${ice_fraction_base.toFixed(3)} 🌍=${total_land_coverage.toFixed(3)} 🏜️=${desert_coverage.toFixed(3)}`);
    }
    
    // Stocker toutes les surfaces dans DATA['🪩'] (SURFACES SECHES, sans H2O)
    DATA['🪩']['🍰🪩🌋'] = volcano_coverage;
    DATA['🪩']['🍰🪩🌊'] = ocean_coverage;
    DATA['🪩']['🍰🪩🌳'] = forest_coverage;
    DATA['🪩']['🍰🪩🧊'] = ice_fraction_base;
    DATA['🪩']['🍰🪩🌍'] = total_land_coverage;
    DATA['🪩']['🍰🪩🏜️'] = desert_coverage;
    
    // 🔒 ALBEDO BASE : Calculer depuis les surfaces SECHES uniquement
    // Fusionner les coefficients : EPOCH peut override certains coefficients (ex: Corps noir)
    const albedo_coeff = { ...CONST['🪩🍰'], ...(EPOCH['🪩🍰'] || {}) };
    let weighted_albedo = 0;
    
    if (albedo_coeff) {
        weighted_albedo += (isFinite(volcano_coverage) ? volcano_coverage : 0) * albedo_coeff['🪩🍰🌋'];
        weighted_albedo += (isFinite(ocean_coverage) ? ocean_coverage : 0) * albedo_coeff['🪩🍰🌊'];
        weighted_albedo += (isFinite(forest_coverage) ? forest_coverage : 0) * albedo_coeff['🪩🍰🌳'];
        weighted_albedo += (isFinite(total_land_coverage) ? total_land_coverage : 0) * albedo_coeff['🪩🍰🌍'];
        weighted_albedo += (isFinite(desert_coverage) ? desert_coverage : 0) * albedo_coeff['🪩🍰🏜️'];
        weighted_albedo += (isFinite(ice_fraction_base) ? ice_fraction_base : 0) * albedo_coeff['🪩🍰🧊'];
    }
    
    albedo_base = isFinite(weighted_albedo) ? weighted_albedo : 0;
    
    let albedo = albedo_base;

    // 🔒 CONTRIBUTION H2O (GLACE) : Calculée séparément, n'affecte PAS la somme des surfaces
    // ice_fraction = fraction du stock d'eau (0-1), PAS fraction de surface
    const ice_albedo = CONST['🪩🍰']['🪩🍰🧊'];
    const ice_fraction_stock = Math.min(1.0, Math.max(0, DATA['💧']['🍰💧🧊']));
    
    // 🔒 Contribution glace à l'albedo : utilise ice_fraction_stock (fraction du stock), pas ice_fraction_base (surface)
    const ice_impact_factor = 0.5;
    const ice_albedo_contribution = (ice_albedo - albedo_base) * ice_fraction_stock * ice_impact_factor;
    albedo = albedo_base + ice_albedo_contribution;

    // Contribution des nuages (H2O activé)
    // 🔒 REFONTE : Les nuages ne sont pas un stock d'eau, mais un phénomène optique
    // 🍰🪩⛅ n'est pas une proportion de surface au sol, mais une fraction optique moyenne vue par le Soleil
    //
    // FORMULE EXPLICITE :
    // 🍰🪩⛅ = C_max × eta_cloud × ☁️
    //
    // Où :
    //   C_max = 0.65 × pressure_factor (plafond physique ajusté par pression)
    //   eta_cloud = 0.40 × temp_factor_optique (efficacité optique ajustée par température)
    //   ☁️ = CloudFormationIndex (calculé par calculateCloudFormationIndex())
    //
    // Exemple Terre 1800 :
    //   P0 = 1.0 atm → pressure_factor = 1.0 → C_max = 0.65
    //   T = 14°C → temp_factor_optique ≈ 1.0 → eta_cloud = 0.40
    //   ☁️ = 1.0
    //   🍰🪩⛅ = 0.65 × 0.40 × 1.0 = 0.26
    //
    // Les nuages saturent vite : au-delà d'un certain seuil d'humidité, c'est l'optique — pas l'eau — qui limite leur effet
    let cloud_fraction = 0;
    if (DATA['🔘']['🔘💧📛'] && DATA['💧']['🍰🫧💧'] > 0) {
        // 🔒 calculateCloudFormationIndex() a déjà été appelé plus haut (ligne ~262)
        // On réutilise DATA['🪩']['☁️'] déjà calculé
        const cloud_index = DATA['🪩']['☁️'];
        // ====================== NUAGES - VERSION PHYSIQUE (pas de patch arbitraire) ======================
        // Références synthèse :
        // - Goldblatt & Zahnle (2011), Climate of the Past, FYSP : baisse low-clouds/CCN -> +10 à +25 W/m².
        // - Wolf & Toon (2013), Feulner et al. (2012) : GCM Archéen, faible CCN -> nuages SW moins réfléchissants.
        // - CERES EBAF + MODIS (2000-2025) : fraction optique SW effective moderne ~0.28-0.35.
        // - Twomey + AR6 aérosols : hausse CCN (SO2, VOCs, anthropique) -> albédo nuageux +10 à +30%.
        // Cette paramétrisation vise donc une efficacité basse en atmosphère peu oxydée/peu biotique,
        // et une efficacité proche/modérément au-dessus de 1 en moderne.

        // 1) Proxy CCN (conservé)
        // [OBS/CALIB] 0.15 et 0.85 calibrés pour rester dans les ordres de grandeur littérature FYSP/Twomey.
        const o2_frac = (DATA['🫧']['🍰🫧🫁'] != null && Number.isFinite(DATA['🫧']['🍰🫧🫁'])) ? DATA['🫧']['🍰🫧🫁'] : 0.0;
        const forest_frac = (DATA['🪩']['🍰🪩🌳'] != null && Number.isFinite(DATA['🪩']['🍰🪩🌳'])) ? DATA['🪩']['🍰🪩🌳'] : 0.0;
        const biomass_proxy = 1.0 + 4.0 * forest_frac;
        const year = (EPOCH['▶'] != null && Number.isFinite(EPOCH['▶'])) ? EPOCH['▶'] : 2025;
        let anthro_factor = 1.0;
        if (year >= 1900) anthro_factor = 1.0 + 0.25 * Math.min(1, (year - 1900) / 80);
        if (year > 1980) anthro_factor = anthro_factor * (1 - 0.15 * Math.min(1, (year - 1980) / 40));
        const ccn_proxy = 0.15 + 0.85 * o2_frac * biomass_proxy * anthro_factor;
        // [OBS/CALIB] Référence moderne explicite : O2=21%, biomasse efficace ~3%, anthro courant.
        // On compare les époques en relatif, plutôt qu'en absolu, pour éviter d'écraser le moderne.
        const ccn_ref_modern = 0.15 + 0.85 * 0.21 * (1.0 + 4.0 * 0.03) * anthro_factor;
        const ccn_ratio = ccn_proxy / ccn_ref_modern;

        // 2) Facteurs physiques d'efficacité nuageuse
        // [EQ] Forme analytique simple (pression/oxydation/température) pour la microphysique effective.
        const pressure_factor = Math.min(1.2, DATA['🫧']['🎈']);
        const oxidation_factor = Math.min(1.0, 0.3 + 4.0 * o2_frac);
        const temp_factor = Math.max(0.6, Math.min(1.3, DATA['🧮']['🧮🌡️'] / 288));

        // 3) Efficacité optique réelle (Twomey + microphysique)
        // Centrage moderne autour de 1.0-1.2 ; états pauvres en CCN en dessous.
        // [OBS/CALIB] 1.10 et 0.45 choisis pour reproduire la plage moderne observée de couverture optique SW effective.
        let cloud_optical_efficiency = 1.10 + 0.45 * (ccn_ratio - 1.0);
        // Oxydation déjà partiellement portée par ccn_proxy : on la garde mais en pondération douce.
        // [EQ] Pondération douce pour limiter la double comptabilisation.
        const oxidation_soft_factor = 0.85 + 0.15 * oxidation_factor;
        cloud_optical_efficiency = cloud_optical_efficiency * pressure_factor * oxidation_soft_factor * temp_factor;

        // 4) Couverture optique SW effective (impact albédo)
        // [EQ] Fermeture diagnostique : cloud_index (dynamique) -> fraction optique efficace.
        cloud_fraction = (0.19 + 0.11 * cloud_index) * cloud_optical_efficiency;

        // Limites physiques
        cloud_fraction = Math.max(0, Math.min(0.75, cloud_fraction));
        if (window.CONFIG_COMPUTE.logCloudProxyDiagnostic) {
            console.log('[cloud-proxy] epoch=' + epochId
                + ' T_C=' + T_surface_C.toFixed(2)
                + ' cloud_idx=' + cloud_index.toFixed(3)
                + ' o2=' + o2_frac.toFixed(3)
                + ' forest=' + forest_frac.toFixed(3)
                + ' ccn=' + ccn_proxy.toFixed(3)
                + ' ccn_ref=' + ccn_ref_modern.toFixed(3)
                + ' ccn_ratio=' + ccn_ratio.toFixed(3)
                + ' anthro=' + anthro_factor.toFixed(3)
                + ' press=' + pressure_factor.toFixed(3)
                + ' oxy=' + oxidation_factor.toFixed(3)
                + ' temp=' + temp_factor.toFixed(3)
                + ' opt=' + cloud_optical_efficiency.toFixed(3)
                + ' cloud_frac=' + cloud_fraction.toFixed(3));
        }
        
        // Stocker la couverture nuageuse dans DATA['🪩']
        DATA['🪩']['🍰🪩⛅'] = cloud_fraction;
    } else {
        DATA['🪩']['🍰🪩⛅'] = 0;
    }

    // 🔒 FORMULE ALBEDO CORRIGÉE :
    // 🍰🪩📿 = 🍰🪩⛅ × 🪩🍰⛅ + Σ(🍰🪩❀ × 🪩🍰❀) | ❀ ∈ { 🌋,🌊,🌳,🏜️,🧊 }
    // Nuages : effet SW (albédo) ici. Inclut : réflexion solaire par les nuages + visible qui traverse, frappe sol/glace/désert, renvoie, et est bloqué par les nuages (tout agrégé dans 🪩🍰⛅ × 🍰🪩⛅). LW (τ_cloud IR) = calculations.js, barre spectre 4–50 μm.
    const cloud_albedo_coeff = albedo_coeff['🪩🍰⛅'];
    const cloud_albedo_contribution = cloud_fraction * cloud_albedo_coeff;
    albedo = albedo + cloud_albedo_contribution;

    const final_albedo = isFinite(albedo) ? Math.max(0.0, Math.min(0.9, albedo)) : 0;
    
    // 🔒 Facteur corps noir : si pas assez d'eau pour 10m de profondeur, réduire l'albedo
    // Calculer le volume d'eau disponible (m³)
    const water_volume_m3 = DATA['⚖️']['⚖️💧'] / CONST.RHO_WATER;
    
    // Surface totale de la planète (m²) - réutiliser celle calculée ligne 217
    
    // Volume minimal requis pour 10 mètres de profondeur (m³)
    const min_depth_m = 10; // 10 mètres minimum
    const min_volume_required_m3 = planet_surface_m2 * min_depth_m;
    
    // Ratio : si ratio < 1, pas assez d'eau pour 10m de profondeur
    // Si ratio = 0 (pas d'eau), blackbody_factor = 0 (corps noir)
    const water_ratio = min_volume_required_m3 > 0 ? water_volume_m3 / min_volume_required_m3 : 0;
    
    // blackbody_factor : 0 si pas d'eau, 1 si assez d'eau pour 10m
    const blackbody_factor = Math.min(1, Math.max(0, water_ratio));
    
    // Appliquer au final_albedo
    const final_albedo_with_water = final_albedo * blackbody_factor;
    
    // 🔒 Les surfaces sont déjà stockées plus haut (lignes 249-254)
    // ice_fraction_base est la surface de glace, ice_fraction_stock est la fraction du stock d'eau
    DATA['🪩']['🍰🪩📿'] = final_albedo_with_water;
    DATA['🪩']['🍰🪩⛅'] = isFinite(cloud_fraction) ? cloud_fraction : 0;
    return final_albedo;
}

function calculateCloudCoverage() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    if (!DATA['🔘']['🔘💧📛']) {
        return 0;
    }

    // 🔒 REFONTE : calculateCloudCoverage() est maintenant DEPRECATED
    // Utiliser calculateCloudFormationIndex() + 🍰🪩⛅ = C_max × ☁️ à la place
    // Cette fonction est conservée pour compatibilité mais ne devrait plus être utilisée
    const T_surface_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;

    if (T_surface_C < -20) {
        const T_cold = -20;
        const cloud_at_cold = 0.05;
        const decay_rate = 0.1; // Taux de décroissance
        const cloud_fraction = cloud_at_cold * Math.exp(decay_rate * (T_surface_C - T_cold));
        return Math.min(1, Math.max(0, cloud_fraction));
    } else if (T_surface_C < 0) {
        // Froid mais pas extrême : quelques nuages possibles (nuages blancs)
        // Interpolation entre -20°C (5%) et 0°C (20%)
        const cloud_at_0 = 0.2; // 20% à 0°C
        const cloud_at_cold = 0.05; // 5% à -20°C
        const cloud_fraction = cloud_at_cold + (cloud_at_0 - cloud_at_cold) * ((T_surface_C - (-20)) / 20);
        return Math.min(1, cloud_fraction);
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

        let final_fraction = Math.min(cloud_fraction_max_limited, physical_fraction);
        return Math.min(1, final_fraction);
    }
}

function calculateSolarFluxAbsorbed() {
    const DATA = window.DATA;
    // 🔒 CRASH si calculateAlbedo() échoue (pas de fallback)
    const albedo = calculateAlbedo();
    const solar_flux_average_wm = DATA['☀️']['🧲☀️🎱'];
    const solar_flux_reflected_wm = solar_flux_average_wm * albedo;
    const solar_flux_absorbed_wm = solar_flux_average_wm - solar_flux_reflected_wm;
    return solar_flux_absorbed_wm;
}

if (typeof window !== 'undefined') {
    window.calculateAlbedo = calculateAlbedo;
    window.calculateCloudCoverage = calculateCloudCoverage; // DEPRECATED: utiliser calculateCloudFormationIndex() + 🍰🪩⛅
    window.calculateCloudFormationIndex = calculateCloudFormationIndex; // Nouvelle fonction
    window.calculateSolarFluxAbsorbed = calculateSolarFluxAbsorbed;
    window.calculateGeologySurfaces = calculateGeologySurfaces;
}

function updateLevelsConfig() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = DATA['📅'];
    const total_atmosphere_mass_kg = DATA['⚖️']['⚖️🫧'];
    const molar_mass_air = DATA['🫧']['🧪'];
    const isCorpsNoir = DATA['📜']['🗿'] === '⚫';
    
    // Initialiser CO2 depuis EPOCH
    let co2_ppm = 0;
    if (!isCorpsNoir && EPOCH['⚖️🏭'] > 0) {
        const co2_fraction = window.co2KgToFraction(EPOCH['⚖️🏭'], total_atmosphere_mass_kg, molar_mass_air);
        co2_ppm = co2_fraction * 1e6;
    }
    
    // Initialiser CH4 depuis EPOCH
    let ch4_ppm = 0;
    if (!isCorpsNoir && EPOCH['⚖️⛽'] > 0) {
        const ch4_fraction = window.ch4KgToFraction(EPOCH['⚖️⛽'], total_atmosphere_mass_kg, molar_mass_air);
        ch4_ppm = ch4_fraction * 1e6;
    }
    
    // Initialiser H2O : ⚖️💧 = eau totale (océans), pas vapeur. Utiliser DATA['💧']['🍰🫧💧'] si dispo, sinon 0.
    let h2o_percent = 0;
    if (DATA['💧'] && DATA['💧']['🍰🫧💧'] != null && DATA['💧']['🍰🫧💧'] > 0) {
        h2o_percent = DATA['💧']['🍰🫧💧'] * 100;
    }
    
    // Si maximiseData (appel depuis un événement), prendre le max entre la valeur sauvegardée et la valeur par défaut
    if (window.maximiseData) {
        const savedCO2 = window.savedCO2 || 0;
        const savedCH4 = window.savedCH4 || 0;
        const savedH2O = window.savedH2O || 0;
        co2_ppm = Math.max(savedCO2, co2_ppm);
        ch4_ppm = Math.max(savedCH4, ch4_ppm);
        h2o_percent = Math.max(savedH2O, h2o_percent);
    }
    
    // Mettre à jour plotData
    if (typeof plotData !== 'undefined') {
        plotData.co2_ppm = co2_ppm;
        plotData.ch4_ppm = ch4_ppm;
    }
    
    // Mettre à jour window.h2oVaporPercent
    window.h2oVaporPercent = h2o_percent;
    window.h2oTotalFromMeteorites = 0;
    
    const h2o_total_kg = (DATA['⚖️'] && DATA['⚖️']['⚖️💧'] != null && Number.isFinite(DATA['⚖️']['⚖️💧'])) ? DATA['⚖️']['⚖️💧'] : 0;
    console.log('📛 [updateLevelsConfig] 🏭=' + co2_ppm.toFixed(0) + 'ppm 🍰🫧💧(initUI)=' + h2o_percent.toFixed(1) + '% ⛽=' + ch4_ppm.toFixed(0) + 'ppm ⚖️💧=' + h2o_total_kg.toExponential(2) + 'kg');
}

// Exposer globalement pour utilisation dans main.js
window.updateLevelsConfig = updateLevelsConfig;

