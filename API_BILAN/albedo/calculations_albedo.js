// File: API_BILAN/albedo/calculations_albedo.js - Calculs albedo et couverture nuageuse
// Desc: En français, dans l'architecture, je suis le module de calculs d'albedo
// Version 1.2.27
// Date: [June 08, 2025] [HH:MM UTC+1]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
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
// - v1.2.19 : fine-tuning forêt réaliste (31% terres, suitability thermique bornée) pour stabiliser CCN moderne
// - v1.2.20 : normalisation stricte des surfaces au sol + nuages traités en voile optique (pas en surface additionnelle)
// - v1.2.21 : retour calculateAlbedo aligné sur DATA['🪩']['🍰🪩📿'] (final_albedo_with_water) pour cohérence solveur/UI
// - v1.2.22 : SO₄²⁻ branché dans proxy CCN via DATA (⚖️🌫, 🍰🫧🌫) + log cloud-proxy enrichi
// - v1.2.23 : coefficients cloud SW externalisés vers static/tuning/model_tuning.js (iso-résultats)
// - v1.2.24 : fallback synchrone cloud tuning si window.TUNING absent
// - v1.2.25 : Corps noir avec ⚖️💧>0 → ice_cap_surface 0.9 pour 🍰🪩🧊 (glace météorites didactique)
// - v1.2.27 : ne pas écraser iceEpochFixedWaterState en Search/Dicho (bloc blend glace) pour reproductibilité visu vs scie
// - v1.2.26 : source unique CLOUD_SW : lecture DATA['🎚️'].CLOUD_SW en priorité (pas variable dupliquée)
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
    
    const total = EPOCH['🗻']['🍰🗻🌊'] + EPOCH['🗻']['🍰🗻🏔'] + EPOCH['🗻']['🍰🗻🌍'];
    if (total > 1.0) {
        console.warn(`⚠️ [calculateGeologySurfaces] Somme > 1.0 (${total}), normalisation...`);
        const scale = 1.0 / total;
        DATA['🗻']['🍰🗻🌊'] = EPOCH['🗻']['🍰🗻🌊'] * scale;
        DATA['🗻']['🍰🗻🏔'] = EPOCH['🗻']['🍰🗻🏔'] * scale;
        DATA['🗻']['🍰🗻🌍'] = EPOCH['🗻']['🍰🗻🌍'] * scale;
    } else {
        DATA['🗻']['🍰🗻🌊'] = EPOCH['🗻']['🍰🗻🌊'];
        DATA['🗻']['🍰🗻🏔'] = EPOCH['🗻']['🍰🗻🏔'];
        DATA['🗻']['🍰🗻🌍'] = EPOCH['🗻']['🍰🗻🌍'];
    }
    
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
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;

    // 🔒 CALCUL DE 🍰🫧☔ (Humidité relative moyenne globale)
    // FORMULE : 🍰🫧☔ = clamp(🍰🫧💧 / ((CONST.M_H2O / 🧪) × 🍰🧮🌧), 0, 1)
    // où :
    //   🍰🫧💧 = fraction massique de vapeur d'eau dans l'atmosphère
    //   CONST.M_H2O = masse molaire de H2O (0.01802 kg/mol)
    //   🧪 = masse molaire de l'air (DATA['🫧']['🧪'])
    //   🍰🧮🌧 = fraction molaire maximale de vapeur saturante (P_sat / P_total)
    //   (CONST.M_H2O / 🧪) × 🍰🧮🌧 = fraction massique saturante q_sat
    //   🍰🫧☔ = q / q_sat = humidité relative (RH)
    const q_sat = (CONST.M_H2O / DATA['🫧']['🧪']) * DATA['💧']['🍰🧮🌧'];  // Fraction massique saturante
    DATA['💧']['🍰🫧☔'] = q_sat > 0 ? Math.max(0, Math.min(1, DATA['💧']['🍰🫧💧'] / q_sat)) : 0;
    
    // 🔒 CALCUL DE 💭☔ (Seuil critique précipitations)
    // FORMULE : 💭☔ = clamp(0.75 + 0.05 × (🧮🌡️ - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE, 0.7, 0.95)
    const temp_factor = (DATA['🧮']['🧮🌡️'] - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE;
    DATA['💧']['💭☔'] = Math.max(0.7, Math.min(0.95, 0.75 + 0.05 * temp_factor));

    // 🔒 CALCUL DE 🍰💭 (CCN - Efficacité condensation nuageuse)
    // FORMULE : 🍰💭 = clamp(0.4 + 0.5×(⚖️🫁/CCN_O2_REF + ⚖️⛽/CCN_CH4_REF) + 0.1×(⚖️🌫/CCN_SULFATE_REF), 0.3, 1.0)
    const ccn_efficiency = Math.max(0.3, Math.min(1.0, 0.4 + 0.5 * (DATA['⚖️']['⚖️🫁'] / CONV.CCN_O2_REF_KG + DATA['⚖️']['⚖️⛽'] / CONV.CCN_CH4_REF_KG) + 0.1 * (DATA['⚖️']['⚖️🌫'] / CONV.CCN_SULFATE_REF_KG)));
    DATA['🫧']['🍰💭'] = ccn_efficiency;
    
    // 🔒 FORMULE SUNDQVIST : ☁️ = (1 - Math.pow(1 - min(🍰🫧☔, 1), 0.6)) × 🍰💭 (exposant 0.6 Sundqvist 1989)
    DATA['🪩']['☁️'] = Math.max(0, Math.min(1, (1 - Math.pow(1 - Math.min(DATA['💧']['🍰🫧☔'], 1), 0.6)) * ccn_efficiency));
    
    // 🔒 CALCUL DE ⏳☔ (Inverse du temps de résidence global de la vapeur)
    // Littérature : temps de résidence vapeur ~8–10 j (Nature Rev. Earth Env. 2021; HESS 2017).
    // Relation : P = W/τ → taux précipitation (kg/m²/s) = colonne vapeur (kg/m²) / τ (s).
    DATA['💧']['⏳☔'] = 1 / CONV.TAU_VAPOR_GLOBAL_S;
    
    // 🔒 INITIALISATION DE 🔺⏳ (1 jour). En phase eau, tuning SOLVER.DELTA_T_ACCELERATION_DAYS (8–10 j) peut l’augmenter.
    DATA['📅']['🔺⏳'] = CONV.SECONDS_PER_DAY;
    
    // 🔒 CALCUL DE 🍰⚖️💦 (Taux de précipitation en kg/m²/s). P = W/τ ; rampe (RH−💭☔)/0.2. Réf. GPCP ~2,7 mm/j.
    const rh_excess = DATA['💧']['🍰🫧☔'] - DATA['💧']['💭☔'];
    const ramp = rh_excess <= 0 ? 0 : Math.min(1, rh_excess / 0.2);
    DATA['💧']['🍰⚖️💦'] = ramp * (DATA['💧']['🍰🫧💧'] * DATA['⚖️']['⚖️🫧']) / (4 * Math.PI * Math.pow(EPOCH['📐'] * 1000, 2)) / CONV.TAU_VAPOR_GLOBAL_S;

    return DATA['🪩']['☁️'];
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
    const ALBEDO = window.ALBEDO;
    const STATE = window.STATE;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;

    // Héritage glaciaire vs réinitialisation géologique :
    // époques courtes → forte inertie (glace héritée), époques longues → proche équilibre à T_config.
    function calcGlaceEquilibre(T_K) {
        const stock_factor = Math.max(0, (EARTH.T_NO_POLAR_ICE_K - T_K) / EARTH.T_NO_POLAR_ICE_RANGE_K);
        return Math.max(0, Math.min(1, 0.1 * stock_factor));
    }
    // Ne pas écraser le verrou glace posé par initForConfig en phase Search/Dicho (reproductibilité visu vs scie)
    const inSolverPhase = (DATA['🧮']['🧮⚧'] === 'Search' || DATA['🧮']['🧮⚧'] === 'Dicho');
    const epochLockAlreadySet = STATE.iceEpochFixedWaterState && STATE.iceEpochFixedWaterState.epochId === DATA['📜']['🗿'];
    if ((!STATE.iceDurationBlendState || STATE.iceDurationBlendState.epochId !== DATA['📜']['🗿']) && !(inSolverPhase && epochLockAlreadySet)) {
        const duree_ans = Math.abs(EPOCH['▶'] - EPOCH['◀']);
        const fraction_fonte = Math.max(0, Math.min(1, duree_ans / CONFIG_COMPUTE.tauGlaceAns));
        const glace_equilibre = calcGlaceEquilibre(EPOCH['🌡️🧮']);
        DATA['💧']['🍰💧🧊'] = Math.max(0, Math.min(1, DATA['💧']['🍰💧🧊'] * (1 - fraction_fonte) + glace_equilibre * fraction_fonte));
        STATE.iceDurationBlendState = { epochId: DATA['📜']['🗿'] };
        STATE.iceEpochFixedWaterState = { epochId: DATA['📜']['🗿'], value: DATA['💧']['🍰💧🧊'] };
        STATE.iceEpochFixedState = STATE.iceEpochFixedWaterState; // compat
    }
    // 🔒 ÉTAPE 1 : Calculer les surfaces géologiques (fixes, déterminées par la géologie)
    ALBEDO.calculateGeologySurfaces();
    
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
    // 🍰🪩🧊 = min(🗻.🍰🗻🏔, 0.46 × (T_NO_POLAR_ICE_K - 🧮🌡️) / T_NO_POLAR_ICE_RANGE_K). Si T > T_NO_POLAR_ICE_K, plus de glace.
    const ice_temp_factor = Math.max(0, (EARTH.T_NO_POLAR_ICE_K - DATA['🧮']['🧮🌡️']) / EARTH.T_NO_POLAR_ICE_RANGE_K);
    // Corps noir avec eau météorites : autoriser glace de surface (didactique) même si 🍰🗻🏔 = 0
    const ice_cap_surface = (DATA['📜']['🗿'] === '⚫' && DATA['⚖️']['⚖️💧'] > 0) ? 0.9 : DATA['🗻']['🍰🗻🏔'];
    const ice_fraction_target = Math.min(ice_cap_surface, EARTH.ICE_FORMULA_MAX_FRACTION * ice_temp_factor);
    if (!STATE.iceCoverageRampState || STATE.iceCoverageRampState.epochId !== DATA['📜']['🗿']) {
        STATE.iceCoverageRampState = { epochId: DATA['📜']['🗿'], value: ice_fraction_target };
    }
    const isConvergencePhase = (DATA['🧮']['🧮⚧'] === 'Search' || DATA['🧮']['🧮⚧'] === 'Dicho');
    const albedoFixedState = STATE.iceEpochFixedAlbedoState;
    const hasEpochIceLock = isConvergencePhase && albedoFixedState && albedoFixedState.epochId === DATA['📜']['🗿'];
    DATA['🪩']['🍰🪩🧊'] = ice_fraction_target;
    if (hasEpochIceLock) {
        DATA['🪩']['🍰🪩🧊'] = Math.max(0, Math.min(ice_cap_surface, albedoFixedState.value));
    }
    const freezeIceDuringSearch = CONFIG_COMPUTE.freezePolarIceDuringSearch !== false;
    const waterPass = (DATA['🧮'] && DATA['🧮']['🧮🔄🌊'] != null) ? DATA['🧮']['🧮🔄🌊'] : 0;
    const lock = STATE.iceCoverageLock;
    if (!hasEpochIceLock && freezeIceDuringSearch && isConvergencePhase && waterPass === 0 && lock && lock.epochId === DATA['📜']['🗿']) {
        DATA['🪩']['🍰🪩🧊'] = Math.max(0, Math.min(ice_cap_surface, lock.value));
    }
    if (isConvergencePhase && DATA['🧮']['🧮🔄☀️'] < Math.max(0, CONFIG_COMPUTE.iceCoverageRampIters) && !hasEpochIceLock && !(freezeIceDuringSearch && waterPass === 0 && lock && lock.epochId === DATA['📜']['🗿'])) {
        const prevIce = STATE.iceCoverageRampState.value;
        const deltaIce = ice_fraction_target - prevIce;
        const rampStepActive = DATA['🧮']['🧮🔄☀️'] < Math.max(0, CONFIG_COMPUTE.iceCoverageRampEarlyIters) ? Math.max(0, CONFIG_COMPUTE.iceCoverageRampMaxStepEarly) : Math.max(0, CONFIG_COMPUTE.iceCoverageRampMaxStep);
        const deltaIceClamped = Math.max(-rampStepActive, Math.min(rampStepActive, deltaIce));
        DATA['🪩']['🍰🪩🧊'] = Math.max(0, Math.min(ice_cap_surface, prevIce + deltaIceClamped));
    }
    STATE.iceCoverageRampState.value = DATA['🪩']['🍰🪩🧊'];
    
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
    const F_conv = Math.max(0.1, Math.min(2.0, 1.0 + (DATA['🧮']['🧮🌡️'] - 288.15) / 50));  // Facteur convection (T optimal ~15°C = 288.15 K)
    const P_ann = DATA['💧']['🍰🧮🌧'] * ocean_coverage * F_conv * CONV.P_ANN_SCALE_MM_AN;  // mm/an (tuning CONV.P_ANN_SCALE_MM_AN)

    // 🔒 ÉTAPE 4 : Calculer ☁️ (index de formation nuageuse) AVANT de calculer les biomes
    // calculateCloudFormationIndex() calcule aussi 🍰🫧☔ (humidité relative) nécessaire pour les biomes
    ALBEDO.calculateCloudFormationIndex();
    
    // 🔒 ÉTAPE 5 : Calculer les terres disponibles (🍰🪩🌍_)
    // FORMULE : 🍰🪩🌍_ = 1 - 🍰🗻🌊 - 🍰🪩🧊
    // Terres disponibles = surface totale - océans - glace
    const land_available = Math.max(0, 1.0 - DATA['🗻']['🍰🗻🌊'] - DATA['🪩']['🍰🪩🧊']);
    
    // 🔒 ÉTAPE 6 : Calculer forêts 🌳
    // === FORÊT - VERSION RÉALISTE (pas de if d'époque) ===
    // Réf : FAO Global Forest Resources Assessment 2020 ~31% des terres émergées. Formule en K : (T_K - 268.15) / 25 = (°C + 5) / 25.
    const relative_humidity = DATA['💧']['🍰🫧☔'];
    const temp_suitability = Math.max(0.4, Math.min(1.0, (DATA['🧮']['🧮🌡️'] - 268.15) / 25));
    const forest_potential = 0.31 * land_available * temp_suitability;
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
    const temp_variability = Math.max(0.5, Math.min(1, (DATA['🧮']['🧮🌡️'] - (CONST.KELVIN_TO_CELSIUS + 5)) / 10)); // Plus de variabilité si T > 5°C, minimum 0.5
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
    
    // 🔒 VÉRIFICATION + NORMALISATION : les surfaces au sol doivent sommer à 1 (sans nuages)
    // Les nuages ⛅ sont traités comme un voile optique indépendant, pas comme une surface additionnelle.
    let volcano_surface = volcano_coverage;
    let ocean_surface = ocean_coverage;
    let forest_surface = forest_coverage;
    let ice_surface = DATA['🪩']['🍰🪩🧊'];
    let land_surface = total_land_coverage;
    let desert_surface = desert_coverage;
    const surface_sum = volcano_surface + ocean_surface + forest_surface + ice_surface + land_surface + desert_surface;
    if (Math.abs(surface_sum - 1.0) > 0.03) {
        console.warn(`⚠️ [calculateAlbedo] Somme surfaces=${surface_sum.toFixed(4)} -> normalisation`);
        const scale = 1.0 / surface_sum;
        volcano_surface = volcano_surface * scale;
        ocean_surface = ocean_surface * scale;
        forest_surface = forest_surface * scale;
        ice_surface = ice_surface * scale;
        land_surface = land_surface * scale;
        desert_surface = desert_surface * scale;
    }
    
    // Stocker toutes les surfaces dans DATA['🪩'] (SURFACES SECHES, sans H2O)
    DATA['🪩']['🍰🪩🌋'] = volcano_surface;
    DATA['🪩']['🍰🪩🌊'] = ocean_surface;
    DATA['🪩']['🍰🪩🌳'] = forest_surface;
    DATA['🪩']['🍰🪩🧊'] = ice_surface;
    DATA['🪩']['🍰🪩🌍'] = land_surface;
    DATA['🪩']['🍰🪩🏜️'] = desert_surface;
    
    // 🔒 ALBEDO BASE : Calculer depuis les surfaces SECHES uniquement
    // Fusionner les coefficients : EPOCH peut override certains coefficients (ex: Corps noir)
    const albedo_coeff = { ...EARTH['🪩🍰'], ...(EPOCH['🪩🍰'] || {}) };
    let weighted_albedo = 0;
    
    if (albedo_coeff) {
        weighted_albedo += volcano_surface * albedo_coeff['🪩🍰🌋'];
        weighted_albedo += ocean_surface * albedo_coeff['🪩🍰🌊'];
        weighted_albedo += forest_surface * albedo_coeff['🪩🍰🌳'];
        weighted_albedo += land_surface * albedo_coeff['🪩🍰🌍'];
        weighted_albedo += desert_surface * albedo_coeff['🪩🍰🏜️'];
        weighted_albedo += ice_surface * albedo_coeff['🪩🍰🧊'];
    }
    
    albedo_base = weighted_albedo;
    
    let albedo = albedo_base;

    // 🔒 CONTRIBUTION H2O (GLACE) : Calculée séparément, n'affecte PAS la somme des surfaces
    // ice_fraction = fraction du stock d'eau (0-1), PAS fraction de surface. Utiliser albedo_coeff (merge CONST+EPOCH) pour éviter NaN si clé absente.
    const ice_albedo = albedo_coeff['🪩🍰🧊'];
    const ice_fraction_stock = Math.min(1.0, Math.max(0, DATA['💧']['🍰💧🧊']));
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
        const biomass_proxy = 1.0 + DATA['🎚️'].CLOUD_SW.BIOMASS_GAIN * DATA['🪩']['🍰🪩🌳'];
        let anthro_factor = 1.0;
        if (EPOCH['▶'] >= DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_START_YEAR) {
            anthro_factor = 1.0 + DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_MAX * Math.min(1, (EPOCH['▶'] - DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_START_YEAR) / DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_WINDOW_YEARS);
        }
        if (EPOCH['▶'] > DATA['🎚️'].CLOUD_SW.ANTHRO_DECAY_START_YEAR) {
            anthro_factor = anthro_factor * (1 - DATA['🎚️'].CLOUD_SW.ANTHRO_DECAY_MAX * Math.min(1, (EPOCH['▶'] - DATA['🎚️'].CLOUD_SW.ANTHRO_DECAY_START_YEAR) / DATA['🎚️'].CLOUD_SW.ANTHRO_DECAY_WINDOW_YEARS));
        }
        const sulfate_boost = (EPOCH['▶'] >= DATA['🎚️'].CLOUD_SW.ANTHRO_RISE_START_YEAR)
            ? (1.0 + Math.min(DATA['🎚️'].CLOUD_SW.SULFATE_BOOST_MAX, DATA['🫧']['🍰🫧🌫'] * DATA['🎚️'].CLOUD_SW.SULFATE_BOOST_SCALE))
            : 1.0;
        const ccn_proxy = (DATA['🎚️'].CLOUD_SW.CCN_BASE + DATA['🎚️'].CLOUD_SW.CCN_O2_WEIGHT * DATA['🫧']['🍰🫧🫁'] * biomass_proxy * anthro_factor) * sulfate_boost;
        // [OBS/CALIB] Référence moderne explicite : O2=21%, biomasse efficace ~3%, anthro courant.
        // On compare les époques en relatif, plutôt qu'en absolu, pour éviter d'écraser le moderne.
        const ccn_ref_modern = DATA['🎚️'].CLOUD_SW.CCN_BASE + DATA['🎚️'].CLOUD_SW.CCN_O2_WEIGHT * DATA['🎚️'].CLOUD_SW.MODERN_REF_O2 * (1.0 + DATA['🎚️'].CLOUD_SW.BIOMASS_GAIN * DATA['🎚️'].CLOUD_SW.MODERN_REF_FOREST) * anthro_factor;
        const ccn_ratio = ccn_proxy / ccn_ref_modern;

        // 2) Facteurs physiques d'efficacité nuageuse
        // [EQ] Forme analytique simple (pression/oxydation/température) pour la microphysique effective.
        const pressure_factor = Math.min(DATA['🎚️'].CLOUD_SW.PRESSURE_FACTOR_MAX, DATA['🫧']['🎈']);
        const oxidation_factor = Math.min(1.0, DATA['🎚️'].CLOUD_SW.OXIDATION_BASE + DATA['🎚️'].CLOUD_SW.OXIDATION_O2_GAIN * DATA['🫧']['🍰🫧🫁']);
        const temp_factor = Math.max(DATA['🎚️'].CLOUD_SW.TEMP_FACTOR_MIN, Math.min(DATA['🎚️'].CLOUD_SW.TEMP_FACTOR_MAX, DATA['🧮']['🧮🌡️'] / DATA['🎚️'].CLOUD_SW.TEMP_FACTOR_REF_K));

        // 3) Efficacité optique réelle (Twomey + microphysique)
        // Centrage moderne autour de 1.0-1.2 ; états pauvres en CCN en dessous.
        // [OBS/CALIB] 1.10 et 0.45 choisis pour reproduire la plage moderne observée de couverture optique SW effective.
        let cloud_optical_efficiency = DATA['🎚️'].CLOUD_SW.OPTICAL_EFF_BASE + DATA['🎚️'].CLOUD_SW.OPTICAL_EFF_CCN_GAIN * (ccn_ratio - 1.0);
        // Oxydation déjà partiellement portée par ccn_proxy : on la garde mais en pondération douce.
        // [EQ] Pondération douce pour limiter la double comptabilisation.
        const oxidation_soft_factor = DATA['🎚️'].CLOUD_SW.OXIDATION_SOFT_BASE + DATA['🎚️'].CLOUD_SW.OXIDATION_SOFT_GAIN * oxidation_factor;
        cloud_optical_efficiency = cloud_optical_efficiency * pressure_factor * oxidation_soft_factor * temp_factor;

        // 4) Couverture optique SW effective (impact albédo)
        // [EQ] Fermeture diagnostique : cloud_index (dynamique) -> fraction optique efficace.
        cloud_fraction = (DATA['🎚️'].CLOUD_SW.CLOUD_FRACTION_BASE + DATA['🎚️'].CLOUD_SW.CLOUD_FRACTION_INDEX_GAIN * cloud_index) * cloud_optical_efficiency;

        // Limites physiques
        cloud_fraction = Math.max(0, Math.min(DATA['🎚️'].CLOUD_SW.CLOUD_FRACTION_MAX, cloud_fraction));
        if (CONFIG_COMPUTE.logCloudProxyDiagnostic) {
            console.log('[cloud-proxy] epoch=' + DATA['📜']['🗿']
                + ' T_C=' + CONST.K2C(DATA['🧮']['🧮🌡️']).toFixed(2)
                + ' cloud_idx=' + cloud_index.toFixed(3)
                + ' o2=' + DATA['🫧']['🍰🫧🫁'].toFixed(3)
                + ' forest=' + DATA['🪩']['🍰🪩🌳'].toFixed(3)
                + ' ccn=' + ccn_proxy.toFixed(3)
                + ' ccn_ref=' + ccn_ref_modern.toFixed(3)
                + ' ccn_ratio=' + ccn_ratio.toFixed(3)
                + ' so4=' + DATA['🫧']['🍰🫧🌫'].toExponential(2)
                + ' so4_boost=' + sulfate_boost.toFixed(3)
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
    albedo = albedo * (1 - cloud_fraction) + albedo_coeff['🪩🍰⛅'] * cloud_fraction;

    const final_albedo = Math.max(0.0, Math.min(0.9, albedo));
    
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
    if (final_albedo_with_water === 0 || !Number.isFinite(final_albedo_with_water)) {
        /* diagnostic désactivé en prod */
    }
    // 🔒 Les surfaces sont déjà stockées plus haut (lignes 249-254)
    // ice_fraction_base est la surface de glace, ice_fraction_stock est la fraction du stock d'eau
    DATA['🪩']['🍰🪩📿'] = final_albedo_with_water;
    DATA['🪩']['🍰🪩⛅'] = cloud_fraction;
    return final_albedo_with_water;
}

function calculateCloudCoverage() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    if (!DATA['🔘']['🔘💧📛']) {
        return 0;
    }

    // 🔒 REFONTE : calculateCloudCoverage() est maintenant DEPRECATED
    // Utiliser calculateCloudFormationIndex() + 🍰🪩⛅ = C_max × ☁️ à la place
    // Cette fonction est conservée pour compatibilité. Calculs en K (DATA officiel).
    const T_K = DATA['🧮']['🧮🌡️'];
    const T_COLD_K = 253.15;   // -20°C
    const T_0_K = 273.15;     // 0°C
    const T_REF_MAX_K = 303.15;  // 30°C

    if (T_K < T_COLD_K) {
        const cloud_at_cold = 0.05;
        const decay_rate = 0.1;
        const cloud_fraction = cloud_at_cold * Math.exp(decay_rate * (T_K - T_COLD_K));
        return Math.min(1, Math.max(0, cloud_fraction));
    }
    if (T_K < T_0_K) {
        const cloud_at_0 = 0.2;
        const cloud_at_cold = 0.05;
        const cloud_fraction = cloud_at_cold + (cloud_at_0 - cloud_at_cold) * ((T_K - T_COLD_K) / 20);
        return Math.min(1, cloud_fraction);
    }
    const cloud_fraction_min = 0.2;
    const cloud_fraction_max_physical = 0.75;
    const cloud_fraction_max_limited = 0.6;
    const physical_fraction = (T_K >= T_REF_MAX_K)
        ? cloud_fraction_max_physical
        : cloud_fraction_min + (cloud_fraction_max_physical - cloud_fraction_min) * (T_K / T_REF_MAX_K);
    return Math.min(1, Math.min(cloud_fraction_max_limited, physical_fraction));
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

var ALBEDO = window.ALBEDO = window.ALBEDO || {};
ALBEDO.calculateAlbedo = calculateAlbedo;
ALBEDO.calculateCloudCoverage = calculateCloudCoverage; // DEPRECATED: utiliser calculateCloudFormationIndex() + 🍰🪩⛅
ALBEDO.calculateCloudFormationIndex = calculateCloudFormationIndex;
ALBEDO.calculateSolarFluxAbsorbed = calculateSolarFluxAbsorbed;
ALBEDO.calculateGeologySurfaces = calculateGeologySurfaces;
window.calculateAlbedo = calculateAlbedo;
window.calculateCloudCoverage = calculateCloudCoverage;
window.calculateCloudFormationIndex = calculateCloudFormationIndex;
window.calculateSolarFluxAbsorbed = calculateSolarFluxAbsorbed;
window.calculateGeologySurfaces = calculateGeologySurfaces;

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
    
    const h2o_total_kg = DATA['⚖️']['⚖️💧'];
    console.log('📛 [updateLevelsConfig] 🏭=' + co2_ppm.toFixed(0) + 'ppm 🍰🫧💧(initUI)=' + h2o_percent.toFixed(1) + '% ⛽=' + ch4_ppm.toFixed(0) + 'ppm ⚖️💧=' + h2o_total_kg.toExponential(2) + 'kg');
}

// Exposer globalement pour utilisation dans main.js
window.updateLevelsConfig = updateLevelsConfig;

