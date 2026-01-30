// ============================================================================
// File: static/compute/calculations_flux.js - Calculs de flux radiatif
// Desc: En français, dans l'architecture, je suis le module de calculs de flux radiatif
// Version 1.2.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
// ============================================================================

// ============================================================================
// FONCTIONS DE CALCUL DE FLUX RADIATIF
// ============================================================================

// 🔒 VARIABLES GLOBALES : window.enabledStates (créé par getEnabledStates()) remplace isH2O_eds, isCO2_eds, etc.
// Ces variables sont mises à jour UNIQUEMENT au clic sur les boutons (dans organigramme.js)
// Ne PAS vérifier directement le DOM, utiliser ces variables globales

// Fonction helper pour récupérer les logos : définie dans compute.js (chargé avant ce fichier)
// On utilise window.getLogo() exposé depuis compute.js

// Variables d'état : déclarées dans compute.js (chargé avant ce fichier)
// On utilise les variables globales définies dans compute.js
// old_T0, T0, Phase, signeDeltaFirst sont dans DATA['🧮'], flux_entrant est calculé localement

// Fonctions getAnimState() et getEpochDateConfig() : définies dans compute.js (chargé avant ce fichier)
// window.epoch est utilisé directement (pas de fonction getEpochConfig)
// On utilise les fonctions globales définies dans compute.js

//Calcule T0 initial :: (🎬) => T0=prev_T0 : T0=🌡️, puis T0 += ☄️*🌡️☄️ + 💫*🌡️💫
function calculateT0() {
    const DATA = window.DATA;
    const CONST = window.CONST;

    // Calculer T0 initial : si animation activée, garder T0 actuel (pas de config)
    if (DATA['🔘']['🔘🎬']) {
        // Animation activée : T0 ne change pas (garde la température actuelle)
        DATA['🧮']['🧮🌡️🚩'] = DATA['🧮']['🧮🌡️'];
    } else {
        // Animation désactivée : T0 = 📅.🌡️🧮 (température attendue de l'époque) + ajustements
    const adjustment = DATA['📜']['🔺🌡️💫'] * DATA['📜']['📿💫'];
        DATA['🧮']['🧮🌡️🚩'] = DATA['📅']['🌡️🧮'] + adjustment;
    }
    
    if (DATA['🧮']['🧮🌡️🚩'] <= 0) {
        console.error(`📛 [calculateT0@calculations_flux.js] ❌ T0 invalide: ${DATA['🧮']['🧮🌡️🚩']}`);
        return false;
    }
    
    // Initialiser DATA directement (sera complété dans computeRadiativeTransfer)
    const epochIndex = DATA['📜']['👉'];
    const EPOCH = window.TIMELINE[epochIndex];
    DATA['🧮']['🧮⚧'] = 'Init'; // Phase d'initialisation
    DATA['🧮']['🧮☯'] = 0;
    DATA['🧮']['🧮🔄'] = 0; // Réinitialiser le compteur d'itérations
    DATA['🧲']['🧲☀️🔽'] = 0;
    DATA['🧲']['🧲🌕🔽'] = 0;
    DATA['🧲']['🧲🌑🔼'] = 0;
    DATA['🧲']['🧲🌈🔼'] = 0;
    DATA['🧲']['🧲🪩🔼'] = 0;
    DATA['🧲']['🔺🧲'] = 0;

    // IMPORTANT: On met toujours à jour DATA['🧮']['🧮🌡️'] avec la valeur calculée
    // Si animation activée (🔘🎬 = true) : T0_base a été lu depuis DATA['🧮']['🧮🌡️'] (ligne 43)
    // Si animation désactivée (🔘🎬 = false) : T0 = DATA['📅']['🌡️🧮'] + adjustment (ligne 47)
    // On doit mettre à jour DATA['🧮']['🧮🌡️'] pour que la convergence utilise cette nouvelle valeur
    // Pour la convergence, c'est TOUJOURS DATA['🧮']['🧮🌡️'] qui est utilisé
    DATA['🧮']['🧮🌡️'] = DATA['🧮']['🧮🌡️🚩'];
    // Tolérance flux (W/m²) = 4σT³ × precision_K (EPOCH['🧲🔬'] en K) — pas une valeur fixe 1 W/m²
    DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * (EPOCH['🧲🔬'] ?? 0.1);
    
    // Logs désactivés pour réduire la taille
    // console.log(`🌡️ T0 [calculateT0@calculations_flux.js]`);
    // console.log(`T0 initial: ${DATA['🧮']['🧮🌡️'].toFixed(2)}K`);
    
    return true;
}

//Réinitialise les variables lors d'un changement de date
function newDate() {
    DATA['🧮']['🧮⚧'] = "Search";
    DATA['🧮']['🧮☯'] = 0;
}

// Fonction helper pour récupérer les valeurs de gaz depuis DATA
// Fonction supprimée : getGasValuesFromConfig() n'était pas utilisée
// Les valeurs sont directement dans DATA['🫧'] après calculateAtmosphereComposition()

// ============================================================================
// initForConfig — Config sans aucun calcul radiatif (affichée dès le debug)
// ============================================================================
function initForConfig() {
    if (window.ABORT_COMPUTE) return false;
    const DATA = window.DATA;
    window.getSoleil();
    window.getNoyau();
    getEpochDateConfig();
    if (!calculateT0()) return false;
    window.calculateAtmosphereComposition();
    if (window.calculateGeologySurfaces) window.calculateGeologySurfaces();
    // Partition eau une fois avec T0 de la config (cache invalidé pour forcer le recalcul)
    window._lastH2OParamsCache = null;
    window.calculateH2OParameters();
    window.getEnabledStates && window.getEnabledStates();
    window.calculateAlbedo();
    return true;
}

// ============================================================================
// cycleDeLeau — Cycle eau (h2o, précip, albedo, nuages). Retourne Promise<{ changed }>.
// isFirst: true = après config, on pousse le premier cycle dans Convergence.
// Async + yields pour que le bouton Stop soit cliquable pendant les calculs.
// ============================================================================
const CYCLE_TOL_ALBEDO = 1e-4;
const CYCLE_TOL_VAPOR = 1e-6;
// Pas minimum en Search quand |Δ| grand : évite pas ≈ Δ/(4σT³) trop petit (ex. 0.3 K à 3000 K) → jamais Dicho
const MIN_SEARCH_STEP_K = 30;
// Pas maximum en Search : avec atmosphère opaque, flux_out ne suit pas σT⁴ → plafonner pour éviter overshoot
const MAX_SEARCH_STEP_K = 100;
// Quand |Δ| >> tolérance : pas proportionnel à Δ, plafonné pour éviter saut Init→iter0 trop gros (ex. 38°C→538°C)
const MAX_SEARCH_STEP_LARGE_K = 150;   // plafond du pas en Search quand |Δ| > 10×tolérance (K)
const LARGE_DELTA_FACTOR = 10;         // si |Δ| > LARGE_DELTA_FACTOR * tolérance → scale le pas
const SEARCH_STEP_SCALE_MAX = 200;     // facteur max : pas = (Δ/sensitivity) * min(SEARCH_STEP_SCALE_MAX, |Δ|/tolérance)

async function cycleDeLeau(outerIter, isFirst) {
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return { changed: false };
    const DATA = window.DATA;
    window.calculateH2OParameters();
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return { changed: false };
    window.getEnabledStates && window.getEnabledStates();
    if (typeof window.calculatePrecipitationFeedback === 'function') window.calculatePrecipitationFeedback();
    window.calculateAlbedo();
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return { changed: false };
    if (typeof window.calculateCloudFormationIndex === 'function') window.calculateCloudFormationIndex();

    const albedo = (DATA['🪩'] && DATA['🪩']['🍰🪩📿']) != null ? DATA['🪩']['🍰🪩📿'] : 0;
    const vapor = (DATA['💧'] && DATA['💧']['🍰🫧💧']) != null ? DATA['💧']['🍰🫧💧'] : 0;

    if (isFirst) {
        if (!DATA['🧮']['previous']) DATA['🧮']['previous'] = [];
        DATA['🧮']['previous'].push({
            outerIter,
            innerIter: null,
            phase: 'CycleEau',
            data_snapshot: {
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩']))
            }
        });
        window._lastCycleRef = { albedo, vapor };
        return { changed: false };
    }

    // Régime T hors bande liquide (gel / vapeur pure) → un seul passage radiatif, pas de boucle cycle eau
    if (typeof window.getWaterCycleTempBoundsFromPressure === 'function') {
        const P_atm = (DATA['🫧'] && DATA['🫧']['🎈']) || 1;
        const { T_low_K, T_high_K } = window.getWaterCycleTempBoundsFromPressure(P_atm);
        const T_K = DATA['🧮']['🧮🌡️'];
        if (T_K < T_low_K || T_K > T_high_K) {
            window._lastCycleRef = { albedo, vapor };
            return { changed: false };
        }
    }
    const ref = window._lastCycleRef || { albedo: 0, vapor: 0 };
    const changed = (Math.abs(albedo - ref.albedo) > CYCLE_TOL_ALBEDO) || (Math.abs(vapor - ref.vapor) > CYCLE_TOL_VAPOR);
    window._lastCycleRef = { albedo, vapor };
    return { changed };
}

// ============================================================================
// computeRadiativeTransfer(outerIter, waterPass) — Radiatif seul (0..20) si (outerIter, waterPass) fournis.
// À appeler après initForConfig() et cycleDeLeau(outerIter, true).
// Après retour, l'orchestrateur fait cycleDeLeau(outerIter, false); si changed → rappeler avec waterPass+1.
// Sans args : ancien flux complet (legacy).
// ============================================================================
function computeRadiativeTransfer(outerIter, waterPass) {
    if (typeof outerIter === 'number' && typeof waterPass === 'number') {
        return runRadiatifOnly(outerIter, waterPass);
    }
    return computeRadiativeTransferLegacy();
}

async function runRadiatifOnly(outerIter, waterPass) {
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return null;
    const DATA = window.DATA;
    const epochIndex = DATA['📜']['👉'];
    const EPOCH = window.TIMELINE[epochIndex];
    const CONST = window.CONST;
    if (!DATA['🧮']['previous']) DATA['🧮']['previous'] = [];

    if (window.DEBUG_DATA_IO) {
        const _e = (x) => (typeof x === 'number' && (Math.abs(x) >= 1e3 || (Math.abs(x) < 1e-3 && x !== 0))) ? x.toExponential(2) : x;
        const alb = (DATA['🪩'] && DATA['🪩']['🍰🪩📿']) != null ? DATA['🪩']['🍰🪩📿'] : '-';
        console.log(`🧲 [runRadiatifOnly] in outerIter=${outerIter} waterPass=${waterPass} T=${_e(DATA['🧮']['🧮🌡️'])} albedo=${typeof alb === 'number' ? _e(alb) : alb}`);
    }
    const geothermal_flux_init = DATA['🌕']['🧲🌕'];
    const solar_flux_incident_init = DATA['☀️']['🧲☀️🎱'];
    const albedo_init_value = (DATA['🪩'] && DATA['🪩']['🍰🪩📿']) != null ? DATA['🪩']['🍰🪩📿'] : 0;
    const flux_solaire_absorbe_init = solar_flux_incident_init * (1 - albedo_init_value);
    const flux_entrant_init = flux_solaire_absorbe_init + geothermal_flux_init;

    if (!window.calculateFluxForT0()) return Promise.reject(new Error('calculateFluxForT0() a échoué'));
    const spectral_result_init = window.getSpectralResultFromDATA();
    if (window.calculateRadiativeCapacities) window.calculateRadiativeCapacities();
    // Équilibre radiatif (sommet de l'atmosphère) :
    // - flux_entrant = solaire absorbé + géothermique (ce que la planète reçoit).
    // - flux_sortant_effectif = intégrale du spectre d'émission réel au sommet = aire sous la courbe "réelle"
    //   (ce qui s'échappe vers l'espace ; 🧲🌈🔼 = total_flux du transfert radiatif).
    // - À l'équilibre : flux_entrant = flux_sortant_effectif ⇒ Δ = 0.
    // La surface émet σT⁴ (corps noir à T) ; l'atmosphère absorbe une partie → ce qui sort au sommet
    // (aire sous la courbe réelle) est < σT⁴. Donc "aire courbe Planck T" ≠ "aire courbe réelle" en général ;
    // le delta est bien (flux_entrant − aire courbe réelle), pas la différence entre deux aires spectrales.
    const flux_sortant_surface_init = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
    let flux_sortant_effectif_init = spectral_result_init.total_flux;
    if (!Number.isFinite(flux_sortant_effectif_init) || flux_sortant_effectif_init <= 0) {
        flux_sortant_effectif_init = flux_sortant_surface_init;
    }
    const delta_equilibre_init = flux_entrant_init - flux_sortant_effectif_init;

    DATA['🧮']['🔬🌈'] = spectral_result_init.lambda_range ? spectral_result_init.lambda_range.length : 0;
    DATA['🧮']['🔬🫧'] = spectral_result_init.z_range ? spectral_result_init.z_range.length : 0;
    DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_init;
    DATA['🧲']['🧲🌕🔽'] = geothermal_flux_init;
    DATA['🧲']['🧲🌑🔼'] = flux_sortant_surface_init;
    DATA['🧲']['🧲🌈🔼'] = flux_sortant_effectif_init;
    DATA['🧲']['🧲🪩🔼'] = solar_flux_incident_init * albedo_init_value;
    DATA['🧲']['🔺🧲'] = delta_equilibre_init;
    // Tolérance flux (W/m²) = 4σT³ × precision_K — à 2500K avec 1K : ~6e6 W/m² (pas 1)
    DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * (EPOCH['🧲🔬'] ?? 0.1);

    DATA['🧮']['🧮☯'] = Math.sign(delta_equilibre_init);
    DATA['🧮']['🧮⚧'] = 'Search';
    DATA['🧮']['🧮🔄☀️'] = 0;
    DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'] - 50;
    DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + 50;
    DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️'];
    DATA['🧮']['🧲🔺⏮'] = delta_equilibre_init;
    const T_K = DATA['🧮']['🧮🌡️'];
    const maxBinsRun = window.CONFIG_COMPUTE.maxSpectralBinsConvergence;
    DATA['🧮']['🔬🌈_target'] = (T_K > 2000) ? 50 : maxBinsRun; // Éviter OOM (1000×z = crash Archéen)
    DATA['📅']['🔺⏳'] = 86400 * 10;

    // Snapshot Init (calcul radiatif -1) : {T°, Albedo} => Δ => phase => ☯
    const init_T_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
    DATA['🧮']['previous'].push({
        outerIter,
        innerIter: -1,
        waterPass,
        phase: 'Init',
        temperature_K: DATA['🧮']['🧮🌡️'],
        temperature_C: init_T_C,
        delta_equilibre: delta_equilibre_init,
        albedo: albedo_init_value,
        yinYang: Math.sign(delta_equilibre_init),
        data_snapshot: {
            '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
            '🧲': JSON.parse(JSON.stringify(DATA['🧲']))
        }
    });

    if (window.DEBUG_DATA_IO) {
        const _e = (x) => (typeof x === 'number' && (Math.abs(x) >= 1e3 || (Math.abs(x) < 1e-3 && x !== 0))) ? x.toExponential(2) : x;
        console.log(`🧲 [runRadiatifOnly] init out 🔺🧲=${_e(delta_equilibre_init)} 🧮🌡️=${_e(DATA['🧮']['🧮🌡️'])} 🧲☀️🔽=${_e(flux_solaire_absorbe_init)} 🧲🌈🔼=${_e(flux_sortant_effectif_init)}`);
    }
    try { if (typeof window.displayConvergence === 'function') window.displayConvergence(); } catch (e) { if (typeof console !== 'undefined') console.warn('displayConvergence:', e); }
    await new Promise(r => setTimeout(r, 0)); // Laisser le DOM et la console afficher Init

    const maxInnerIters = (CONST.maxRadiatifIters != null) ? CONST.maxRadiatifIters : 21;
    let innerConverged = false;
    while (DATA['🧮']['🧮🔄☀️'] < maxInnerIters && !innerConverged) {
        await new Promise(r => setTimeout(r, 0)); // Laisser le clic Stop être traité
        if (window.ABORT_COMPUTE) return null;
        DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * (EPOCH['🧲🔬'] ?? 0.1);
        window.calculateH2OParameters();
        window.getEnabledStates && window.getEnabledStates();
        window.calculateAlbedo();
        window.calculateFluxForT0();
        window.calculateRadiativeCapacities && window.calculateRadiativeCapacities();
        const spectral_result = window.getSpectralResultFromDATA();
        DATA['🧲']['🧲☀️🔽'] = window.calculateSolarFluxAbsorbed();
        DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
        DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
        const flux_sortant_effectif_inner = Number.isFinite(spectral_result.total_flux) && spectral_result.total_flux > 0 ? spectral_result.total_flux : DATA['🧲']['🧲🌑🔼'];
        DATA['🧲']['🧲🌈🔼'] = flux_sortant_effectif_inner;
        DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * (DATA['🪩'] && DATA['🪩']['🍰🪩📿'] ? DATA['🪩']['🍰🪩📿'] : 0);
        DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
        DATA['🧮']['🔬🌈'] = spectral_result.lambda_range ? spectral_result.lambda_range.length : 0;
        DATA['🧮']['🔬🫧'] = spectral_result.z_range ? spectral_result.z_range.length : 0;

        // Dicho : encadrer Δ=0. Convention 🔽 = borne basse (min T), 🔼 = borne haute (max T), toujours 🔽 < 🔼.
        if (DATA['🧮']['🧮☯'] !== 0 && DATA['🧲']['🔺🧲'] * DATA['🧮']['🧮☯'] < 0) {
            DATA['🧮']['🧮⚧'] = 'Dicho';
            if (DATA['🧮']['🧮☯'] < 0 && Math.sign(DATA['🧲']['🔺🧲']) > 0) {
                // Δ était <0, maintenant >0 : on a baissé T → T_prev > T_curr → 🔽 = current, 🔼 = previous
                DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️⏮'];
            } else if (DATA['🧮']['🧮☯'] > 0 && Math.sign(DATA['🧲']['🔺🧲']) < 0) {
                // Δ était >0, maintenant <0 : on a monté T → T_prev < T_curr → 🔽 = previous, 🔼 = current
                DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️⏮'];
                DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
            }
        }
        DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️'];
        if (DATA['🧮']['🧮🔄☀️'] === 0) DATA['🧮']['🧮⚧'] = 'Search';
        else { DATA['🧮']['🧮☯'] = Math.sign(DATA['🧲']['🔺🧲']); if (DATA['🧮']['🧮⚧'] !== 'Dicho') DATA['🧮']['🧮⚧'] = 'Search'; }

        const delta_this = DATA['🧲']['🔺🧲'];
        const phase_this = DATA['🧮']['🧮⚧'];
        const yinYang_this = DATA['🧮']['🧮☯'];
        const albedo_this = (DATA['🪩'] && DATA['🪩']['🍰🪩📿']) != null ? DATA['🪩']['🍰🪩📿'] : 0;

        if (phase_this === 'Search' && yinYang_this === 0) {
            if (typeof window.alert === 'function') {
                window.alert('Crash algo: ☯=0 en phase Search (Δ sans signe, direction impossible). Arrêt.');
            }
            console.error('Crash algo: ☯=0 en phase Search');
            return null;
        }
        try { if (typeof window.displayConvergence === 'function') window.displayConvergence(); } catch (e) { if (typeof console !== 'undefined') console.warn('displayConvergence:', e); }
        await new Promise(r => setTimeout(r, 0)); // Laisser le DOM et la console à jour après chaque itération

        if (window.DEBUG_DATA_IO) { const _e = (x) => (typeof x === 'number' && (Math.abs(x) >= 1e3 || (Math.abs(x) < 1e-3 && x !== 0))) ? x.toExponential(2) : x; console.log(`🧲 [runRadiatifOnly] iter=${DATA['🧮']['🧮🔄☀️']} T=${_e(DATA['🧮']['🧮🌡️'])} 🔺🧲=${_e(delta_this)} phase=${phase_this} ☯=${yinYang_this}`); }
        if (Math.abs(delta_this) <= DATA['🧮']['🧲🔬']) innerConverged = true;
        if (innerConverged) break;

        // Nouvelle T° testée : Search → T += Δ/sensitivity ; Dicho → T = (🔽+🔼)/2
        const T_before_update_run = DATA['🧮']['🧮🌡️'];
        if (DATA['🧮']['🧮⚧'] === 'Search') {
            const delta_to_use = DATA['🧮']['🧮🔄☀️'] === 0 ? delta_equilibre_init : DATA['🧲']['🔺🧲'];
            const sensitivity = (DATA['🧮']['🧲🔬'] / EPOCH['🧲🔬']) || 1;
            let increment = sensitivity !== 0 ? delta_to_use / sensitivity : 0;
            const tolerance = DATA['🧮']['🧲🔬'];
            if (tolerance > 0 && Math.abs(delta_to_use) > LARGE_DELTA_FACTOR * tolerance) {
                const scale = Math.min(SEARCH_STEP_SCALE_MAX, Math.abs(delta_to_use) / tolerance);
                increment *= scale;
            }
            const maxStepK = (tolerance > 0 && Math.abs(delta_to_use) > LARGE_DELTA_FACTOR * tolerance) ? MAX_SEARCH_STEP_LARGE_K : MAX_SEARCH_STEP_K;
            if (Number.isFinite(increment) && Math.abs(delta_to_use) > tolerance && Math.abs(increment) < MIN_SEARCH_STEP_K)
                increment = Math.sign(delta_to_use) * Math.max(Math.abs(increment), MIN_SEARCH_STEP_K);
            if (Number.isFinite(increment) && Math.abs(increment) > maxStepK)
                increment = Math.sign(increment) * maxStepK;
            DATA['🧮']['🧮🌡️'] += Number.isFinite(increment) ? increment : 0;
            const rawCapRun = (typeof window !== 'undefined' && window.CONFIG_COMPUTE) ? window.CONFIG_COMPUTE.maxSearchT_K : undefined;
            const TcapRun = (rawCapRun === null) ? Infinity : ((typeof rawCapRun === 'number' && Number.isFinite(rawCapRun)) ? rawCapRun : (CONST.T_LAVA_COMPLETE != null ? CONST.T_LAVA_COMPLETE : 2373));
            if (Number.isFinite(TcapRun) && DATA['🧮']['🧮🌡️'] > TcapRun) DATA['🧮']['🧮🌡️'] = TcapRun;
        } else if (DATA['🧮']['🧮⚧'] === 'Dicho') {
            // Réduction du bracket : Δ>0 → T trop bas → 🔽 = T ; Δ<0 → T trop haut → 🔼 = T
            if (DATA['🧲']['🔺🧲'] > 0 && DATA['🧮']['🧮🌡️'] > DATA['🧮']['🧮🌡️🔽']) DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
            else if (DATA['🧲']['🔺🧲'] < 0 && DATA['🧮']['🧮🌡️'] < DATA['🧮']['🧮🌡️🔼']) DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
            if (DATA['🧮']['🧮🌡️🔽'] >= DATA['🧮']['🧮🌡️🔼']) {
                const T0 = DATA['🧮']['🧮🌡️'];
                const dT = Math.max(1, Math.abs(DATA['🧲']['🔺🧲']) / 100);
                if (DATA['🧲']['🔺🧲'] > 0) { DATA['🧮']['🧮🌡️🔽'] = T0; DATA['🧮']['🧮🌡️🔼'] = Math.min(3000, T0 + dT * 2); }
                else { DATA['🧮']['🧮🌡️🔼'] = T0; DATA['🧮']['🧮🌡️🔽'] = Math.max(100, T0 - dT * 2); }
            }
            DATA['🧮']['🧮🌡️'] = (DATA['🧮']['🧮🌡️🔽'] + DATA['🧮']['🧮🌡️🔼']) / 2;
        }
        if (DATA['🧮']['🧮🌡️'] === T_before_update_run) innerConverged = true;
        const iter_index = DATA['🧮']['🧮🔄☀️'];
        DATA['🧮']['🧮🔄☀️']++;

        // Recalculer flux et Δ à la nouvelle T pour afficher (T_new, Δ_new) cohérent
        window.calculateH2OParameters();
        window.calculateFluxForT0();
        window.calculateRadiativeCapacities && window.calculateRadiativeCapacities();
        const spectral_after = window.getSpectralResultFromDATA();
        DATA['🧲']['🧲☀️🔽'] = window.calculateSolarFluxAbsorbed();
        DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
        DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
        const flux_sortant_after = Number.isFinite(spectral_after.total_flux) && spectral_after.total_flux > 0 ? spectral_after.total_flux : DATA['🧲']['🧲🌑🔼'];
        DATA['🧲']['🧲🌈🔼'] = flux_sortant_after;
        DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * (DATA['🪩'] && DATA['🪩']['🍰🪩📿'] ? DATA['🪩']['🍰🪩📿'] : 0);
        DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
        const delta_after = DATA['🧲']['🔺🧲'];
        const albedo_after = (DATA['🪩'] && DATA['🪩']['🍰🪩📿']) != null ? DATA['🪩']['🍰🪩📿'] : 0;
        const yinYang_after = Math.sign(delta_after);

        const data_snapshot = {
            '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
            '🧲': JSON.parse(JSON.stringify(DATA['🧲']))
        };
        const pushPayload = {
            outerIter,
            innerIter: iter_index,
            waterPass,
            temperature_K: DATA['🧮']['🧮🌡️'],
            temperature_C: DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS,
            delta_equilibre: delta_after,
            phase: phase_this,
            albedo: albedo_after,
            yinYang: yinYang_after,
            data_snapshot
        };
        if (phase_this === 'Dicho') {
            pushPayload.dichoT_low_C = DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS;
            pushPayload.dichoT_high_C = DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS;
        }
        DATA['🧮']['previous'].push(pushPayload);
        await new Promise(r => setTimeout(r, 0)); // Yield pour afficher cette étape avant la suivante
    }
    if (window.DEBUG_DATA_IO) { const _e = (x) => (typeof x === 'number' && (Math.abs(x) >= 1e3 || (Math.abs(x) < 1e-3 && x !== 0))) ? x.toExponential(2) : x; console.log(`🧲 [runRadiatifOnly] out T=${_e(DATA['🧮']['🧮🌡️'])} 🔺🧲=${_e(DATA['🧲']['🔺🧲'])} iters=${DATA['🧮']['🧮🔄☀️']}`); }
    return true;
}

function computeRadiativeTransferLegacy() {
    const DATA = window.DATA;
    const epochIndex = DATA['📜']['👉'];
    const EPOCH = window.TIMELINE[epochIndex];
    
    window.getSoleil();
    window.getNoyau();
    getEpochDateConfig();
    if (!calculateT0()) return Promise.reject(new Error('T0 invalide'));
    const CONST = window.CONST;
    window.calculateAtmosphereComposition();
    if (window.calculateGeologySurfaces) window.calculateGeologySurfaces();
    window.calculateH2OParameters();
    window.getEnabledStates && window.getEnabledStates();
    window.calculateAlbedo();
    
    if (typeof window.displayConfigReady === 'function') window.displayConfigReady();
    return (async function runAfterConfigPaint() {
        await Promise.resolve();
    DATA['🧮']['🧮⚧'] = 'Init';
    DATA['🧮']['🧮🔄'] = 0;
    DATA['🧮']['previous'] = [];
    
    // Calculer le flux initial pour avoir un état de référence
    // IMPORTANT: Pour être cohérent avec Configuration, on utilise l'albedo déjà calculé ligne 135
    // Au lieu de recalculer l'albedo (qui pourrait être différent), on utilise directement DATA['🪩']
    const geothermal_flux_init = DATA['🌕']['🧲🌕'];
    // Utiliser l'albedo de Configuration (déjà calculé ligne 135) pour garantir la cohérence
    const solar_flux_incident_init = DATA['☀️']['🧲☀️🎱'];
    const albedo_init_value = DATA['🪩']['🍰🪩📿']; // Utiliser l'albedo de Configuration
    const flux_solaire_absorbe_init = solar_flux_incident_init * (1 - albedo_init_value);
    const flux_entrant_init = flux_solaire_absorbe_init + geothermal_flux_init;
    
    // Calcul spectral initial (utilise DATA['🧮']['🧮🌡️'] qui peut être ajustée)
    // 🔒 DOIT être appelé AVANT calculateRadiativeCapacities() pour initialiser DATA['📊']
    if (!window.calculateFluxForT0()) {
        console.error(`📛 [computeRadiativeTransfer@calculations_flux.js] ❌ ERREUR CRITIQUE : calculateFluxForT0() initial a échoué`);
        return Promise.reject(new Error('calculateFluxForT0() initial a échoué'));
    }
    const spectral_result_init = window.getSpectralResultFromDATA();
    
    // 5. Calculer les capacités radiatives IR (🍰🫧❀🌈) et ☁️ à l'init
    // Ces valeurs sont nécessaires pour l'affichage dans Configuration
    // 🔒 DOIT être appelé APRÈS calculateFluxForT0() pour que DATA['📊'] soit rempli
    if (window.calculateRadiativeCapacities) {
        window.calculateRadiativeCapacities();
    }
    
    // 🔒 Calculer les flux AVANT le return pour que DATA['🧲'] soit rempli en mode config
    // 🔒 🧲🌑🔼 dans Config = σT⁴ avec T = température ACTUELLE (DATA['🧮']['🧮🌡️']), pas EPOCH['🌡️🧮']
    // Car on calcule avec la température actuelle, pas celle de l'époque
    const flux_sortant_surface_init = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
    let flux_sortant_effectif_init = spectral_result_init.total_flux;
    const spectral_flux_init = spectral_result_init.total_flux_by_wavelength ? 
        spectral_result_init.total_flux_by_wavelength.reduce((sum, val) => sum + val, 0) : 
        flux_sortant_effectif_init;
    const albedo_flux_init = solar_flux_incident_init * DATA['🪩']['🍰🪩📿'];
    let flux_sortant_effectif_init_used = flux_sortant_effectif_init;
    if (!Number.isFinite(flux_sortant_effectif_init) || flux_sortant_effectif_init <= 0) {
        flux_sortant_effectif_init_used = flux_sortant_surface_init;
    }
    const delta_equilibre_init = flux_entrant_init - flux_sortant_effectif_init_used;
    
    // Mettre à jour les résolutions depuis spectral_result_init
    DATA['🧮']['🔬🌈'] = spectral_result_init.lambda_range ? spectral_result_init.lambda_range.length : 0;
    DATA['🧮']['🔬🫧'] = spectral_result_init.z_range ? spectral_result_init.z_range.length : 0;
    
    // Flux spectral affiché : utiliser la valeur effective (fallback σT⁴ si spectral NaN)
    const spectral_flux_init_used = Number.isFinite(spectral_flux_init) && spectral_flux_init > 0 ? spectral_flux_init : flux_sortant_effectif_init_used;
    
    // Mettre à jour DATA['🧲'] pour l'état initial (APRÈS tous les ajustements)
    DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_init;
    DATA['🧲']['🧲🌕🔽'] = geothermal_flux_init;
    DATA['🧲']['🧲🌑🔼'] = flux_sortant_surface_init;
    DATA['🧲']['🧲🌈🔼'] = spectral_flux_init_used;
    DATA['🧲']['🧲🪩🔼'] = albedo_flux_init;
    DATA['🧲']['🔺🧲'] = delta_equilibre_init;
    DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * (EPOCH['🧲🔬'] ?? 0.1);

    // Sauvegarder les valeurs initiales de l'atmosphère (pour Configuration - ne changera plus)
    // ⚠️ ATTENTION : Cette valeur sera mise à jour APRÈS la phase Init pour inclure 🍰🫧💧 calculé
    // Pour l'instant, on initialise avec les valeurs de base (🍰🫧💧 sera mis à jour plus tard)
    DATA['🫧_initial'] = JSON.parse(JSON.stringify(DATA['🫧'])); // Copie profonde
    
    // 🔒 MODE CONFIG UNIQUEMENT : Ne pas lancer la convergence, juste afficher la config
    // ⚠️ IMPORTANT : Les flux doivent être calculés AVANT le return
    // Ne pas appeler displayResults ici pour éviter les boucles infinies
    // displayResults sera appelé depuis runTest() après computeRadiativeTransfer()
    
    // Note: h2o et albedo seront recalculés dans la boucle d'itération avec DATA['🧮']['🧮🌡️'] (pour Convergence)
    
    // ============================================================================
    // ITÉRATION DE CALCUL DE FLUX vs CORPS NOIR
    // ============================================================================
    // Principe : Équilibre radiatif entre flux entrant (solaire) et flux sortant (corps noir)
    //
    // 1. CORPS NOIR (rayonnement thermique) :
    //    - Loi de Stefan-Boltzmann : F = σT⁴
    //    - σ = 5.670374419e-8 W/(m²·K⁴) (constante de Stefan-Boltzmann)
    //    - Le flux sortant est le rayonnement émis par la surface terrestre
    //    - Pour une sphère : surface = 4πR², mais le flux est déjà en W/m²
    //
    // 2. AIRES (surfaces d'échange) :
    //    - Surface terrestre : A_surface = 4πR² ≈ 5.1×10¹⁴ m² (R = 6371 km)
    //    - Le flux est en W/m², donc on travaille directement avec des densités de flux
    //    - Pas besoin de multiplier par la surface pour l'équilibre énergétique
    //
    // 3. TEST D'ARRÊT : 🧲🔬 = tolérance flux (W/m²)
    //    - EPOCH['🧲🔬'] = precision_K (en K, ex: 0.1K ou 1K Hadéen)
    //    - DATA['🧮']['🧲🔬'] = 4σT³ × precision_K (W/m²). Pourquoi dépendre de T ?
    //      Car F = σT⁴ → dF/dT = 4σT³ : un même ΔT donne un ΔF plus grand quand T est haut.
    //      "À precision_K près en T" ⟺ "|ΔF| ≤ 4σT³×precision_K". Donc la tolérance en W/m² doit suivre T³.
    //    - Ex. T=255K, precision_K=0.1 → 🧲🔬 ≈ 0.38 W/m². T=3000K, precision_K=1 → 🧲🔬 ≈ 6.1e3 W/m².
    //    - Condition d'arrêt : |🔺🧲| ≤ 🧲🔬
    
    // 🔒 spectral_result_init doit exister (crash si manquant)
    
    // Stocker l'état initial dans l'historique
    const temp_C_init = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
    const albedo_init = JSON.parse(JSON.stringify(DATA['🪩']));
    
    // 🔒 SAUVEGARDE DES VALEURS INITIALES (pour Configuration - ne changera plus JAMAIS)
    // Ces valeurs sont figées et ne doivent jamais être modifiées après cette ligne
    DATA['🧲_initial'] = JSON.parse(JSON.stringify(DATA['🧲'])); // Copie profonde
    Object.freeze(DATA['🧲_initial']);

    // Snapshot Init pour l’affichage Configuration : 🌕, ☀️, 🧲 ne doivent jamais se mettre à jour ensuite
    window.CONFIG_INIT_SNAPSHOT = {
        '🌕': JSON.parse(JSON.stringify(DATA['🌕'])),
        '☀️': JSON.parse(JSON.stringify(DATA['☀️'])),
        '🧲': JSON.parse(JSON.stringify(DATA['🧲']))
    };
    
    // Snapshot initial pour comparaison
    const data_snapshot_init = {
        '🧮': (() => {
            const data = { ...DATA['🧮'] };
            delete data.previous; // Exclure previous (récursif)
            return JSON.parse(JSON.stringify(data));
        })(),
        '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
        '💧': JSON.parse(JSON.stringify(DATA['💧'])),
        '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
        '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
        '📛': JSON.parse(JSON.stringify(DATA['📛']))
    };
    
    DATA['🧮']['previous'].push({
        outerIter: 0,
        innerIter: 0,
        temperature_K: DATA['🧮']['🧮🌡️'],
        temperature_C: temp_C_init,
        delta_equilibre: delta_equilibre_init,
        phase: 'Init',
        data_snapshot: data_snapshot_init
    });
    
    // ========================================================================
    // PHASE INIT : Cycle de l'eau pour initialiser 🍰🫧💧 correctement
    // ========================================================================
    if (DATA['🧮']['🧮⚧'] === 'Init') {
        // Accélérer la convergence avec 🔺⏳×10
        DATA['📅']['🔺⏳'] = 86400 * 10; // 10 jours pour accélérer
        
        // Itérer le cycle de l'eau jusqu'à convergence
        for (let initIter = 0; initIter < 5; initIter++) {
            window.calculateH2OParameters();
            window.calculatePrecipitationFeedback();
            
            const vapor_before = DATA['💧']['🍰🫧💧'];
            window.calculateH2OParameters();
            const vapor_after = DATA['💧']['🍰🫧💧'];
            const delta_vapor = Math.abs(vapor_after - vapor_before);
            
            if (delta_vapor < 0.001) {
                break;
            }
        }
        
        // Revenir à 🔺⏳ normal (1 jour)
        DATA['📅']['🔺⏳'] = 86400;
        
        // 🔒 Mettre à jour DATA['🫧_initial'] APRÈS la phase Init pour inclure 🍰🫧💧 calculé
        // (pour que la Configuration affiche la bonne valeur)
        DATA['🫧_initial'] = JSON.parse(JSON.stringify(DATA['🫧']));
    }
    
    // ========================================================================
    // BOUCLE EXTERNE : Cycle de l'eau (partition, précipitation, albedo, nuages)
    // BOUCLE INTERNE : Convergence radiatif (ajustement T jusqu'à équilibre)
    // ========================================================================
    DATA['🧮']['🧮☯'] = Math.sign(delta_equilibre_init);
    DATA['🧮']['🧮⚧'] = 'Search';
    DATA['🧮']['🧮🔄'] = 0;
    DATA['🧮']['🧮🔄🌊'] = 0; // Compteur boucle externe (Init = 0, premier cycle = 1)
    DATA['🧮']['🧮🔄☀️'] = 0; // Compteur boucle interne
    
    DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'] - 50; // T0_min
    DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + 50; // T0_max
    DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️']; // T0_prev
    DATA['🧮']['🧲🔺⏮'] = delta_equilibre_init; // deltaFluxOld
    
    // Accélérer la convergence avec 🔺⏳×10 au début
    DATA['📅']['🔺⏳'] = 86400 * 10; // 10 jours pour accélérer
    
    // ========================================================================
    // BOUCLE EXTERNE : Cycle de l'eau — asynchrone pour laisser le DOM se peindre après chaque cycle
    // ========================================================================
    return (async function runOuterLoop() {
    while (DATA['🧮']['🧮🔄🌊'] < 10) {
        if (window.ABORT_COMPUTE) return null;
        DATA['🧮']['🧮🔄🌊']++;

        // 💧 Résolution spectrale : 50 si T élevé, sinon plafond maxSpectralBinsConvergence (éviter OOM Archéen)
        const _T = (DATA['🧮'] && DATA['🧮']['🧮🌡️']) || 300;
        const maxBins = (typeof window !== 'undefined' && window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.maxSpectralBinsConvergence != null) ? window.CONFIG_COMPUTE.maxSpectralBinsConvergence : 150;
        DATA['🧮']['🔬🌈_target'] = (_T > 2000) ? 50 : maxBins;

        // 🔒 Arrêt cycle eau si T hors bande active : [-10°C, 150°C] resserrée par pression (gel + évaporation)
        if (DATA['🧮']['🧮🔄🌊'] > 1 && typeof window.getWaterCycleTempBoundsFromPressure === 'function') {
            const P_atm = (DATA['🫧'] && DATA['🫧']['🎈']) || 1;
            const { T_low_K, T_high_K } = window.getWaterCycleTempBoundsFromPressure(P_atm);
            const T_K = DATA['🧮']['🧮🌡️'];
            if (T_K < T_low_K || T_K > T_high_K) break;
        }

        // 1. Partition eau (vapeur potentielle, glace, océan) — calcul avec T0, sans flux
        // 🔒 IMPORTANT : Ne recalculer que si ce n'est pas la première itération après Init
        if (DATA['🧮']['🧮🔄🌊'] > 1) {
            window.calculateH2OParameters();
            window.getEnabledStates();
            window.calculateAlbedo();
        }
        
        // 💧 Cycle de l'eau : snapshot 🫧, 💧, 🪩 (sans calcul de flux) pour l'affichage Convergence
        DATA['🧮']['previous'].push({
            outerIter: DATA['🧮']['🧮🔄🌊'],
            innerIter: null,
            phase: 'CycleEau',
            data_snapshot: {
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩']))
            }
        });
        try { if (typeof window.displayConvergence === 'function') window.displayConvergence(); } catch (e) { if (typeof console !== 'undefined') console.warn('displayConvergence:', e); }
        
        // Référence cycle eau pour détecter si on doit refaire un tour radiatif (zone liquide)
        const tol_albedo = 1e-4;
        const tol_vapor = 1e-6;
        let ref_cycle = {
            albedo: (DATA['🪩'] && DATA['🪩']['🍰🪩📿']) != null ? DATA['🪩']['🍰🪩📿'] : 0,
            vapor: (DATA['💧'] && DATA['💧']['🍰🫧💧']) != null ? DATA['💧']['🍰🫧💧'] : 0
        };
        let water_repeats = 0;
        const max_water_repeats = 5;
        let innerConverged = false;
        let repeat_radiative = false;
        
        do {
            DATA['🧮']['🧮🔄☀️'] = 0;
            innerConverged = false;
            const waterPass = water_repeats;
        
        // 2. Boucle radiatif interne : max CONST.maxRadiatifIters, afficher 🧮 et 🧲 à chaque calcul radiatif
        const maxRadiatifIters = (CONST.maxRadiatifIters != null) ? CONST.maxRadiatifIters : 21;
        while (DATA['🧮']['🧮🔄☀️'] < maxRadiatifIters && !innerConverged) {
            if (window.ABORT_COMPUTE) break;
            DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * (EPOCH['🧲🔬'] ?? 0.1);

        // IMPORTANT: Pour la première itération (iteration=0), on calcule d'abord les flux avec T initial
        // puis on fait l'ajustement APRÈS le calcul des flux, pour que l'état Init soit visible avec T=287K
        // L'ajustement se fera à la fin de la première itération, après avoir calculé les flux
        
            // BOUCLE INTERNE : Convergence radiatif
            // 🔒 IMPORTANT : Recalculer H2O et albedo dans la boucle interne car ils dépendent de T
            // Mais on ne fait PAS le feedback précipitation ici (seulement dans le cycle externe)
            // Cela permet de converger la température avec des paramètres qui suivent T
            window.calculateH2OParameters();
            window.getEnabledStates();
            window.calculateAlbedo();
            
            window.calculateFluxForT0();
            window.calculateRadiativeCapacities();
            
            const spectral_result = window.getSpectralResultFromDATA();
            
            DATA['🧲']['🧲☀️🔽'] = window.calculateSolarFluxAbsorbed();
            DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
            DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
            const flux_sortant_effectif_inner = Number.isFinite(spectral_result.total_flux) && spectral_result.total_flux > 0
                ? spectral_result.total_flux
                : DATA['🧲']['🧲🌑🔼'];
            DATA['🧲']['🧲🌈🔼'] = flux_sortant_effectif_inner;
            DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
            DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
            
            DATA['🧮']['🔬🌈'] = spectral_result.lambda_range.length;
            DATA['🧮']['🔬🫧'] = spectral_result.z_range.length;

            DATA['📛']['📛🏭'] = window.calculateCO2Forcing(DATA['🫧']['🍰🫧🏭']);
            DATA['📛']['📛⛽'] = window.calculateCH4Forcing(DATA['🫧']['🍰🫧⛽']);
            DATA['📛']['📿📛'] = DATA['📛']['📛🏭'] + DATA['📛']['📛⛽'] + DATA['📛']['📛💧'];
        DATA['📛']['📛🏭'] = window.calculateCO2Forcing(DATA['🫧']['🍰🫧🏭']);
        DATA['📛']['📛⛽'] = window.calculateCH4Forcing(DATA['🫧']['🍰🫧⛽']);
        DATA['📛']['📿📛'] = DATA['📛']['📛🏭'] + DATA['📛']['📛⛽'] + DATA['📛']['📛💧'];

            // Détecter changement de signe pour passer en Phase="Dicho"
            if (DATA['🧮']['🧮☯'] !== 0 && DATA['🧲']['🔺🧲'] * DATA['🧮']['🧮☯'] < 0) {
                DATA['🧮']['🧮⚧'] = 'Dicho';
                if (DATA['🧮']['🧮☯'] < 0 && Math.sign(DATA['🧲']['🔺🧲']) > 0) {
                    DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️⏮'];
                    DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
                } else if (DATA['🧮']['🧮☯'] > 0 && Math.sign(DATA['🧲']['🔺🧲']) < 0) {
                    DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                    DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️⏮'];
                }
            }
            DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️'];
            
            if (DATA['🧮']['🧮🔄☀️'] === 0) {
                DATA['🧮']['🧮⚧'] = 'Search';
            } else {
                DATA['🧮']['🧮☯'] = Math.sign(DATA['🧲']['🔺🧲']);
                if (DATA['🧮']['🧮⚧'] !== 'Dicho') {
                    DATA['🧮']['🧮⚧'] = 'Search';
                }
            }
        
            // Sauvegarder chaque calcul radiatif (0..20) : 🧮 et 🧲 uniquement
            const data_snapshot = {
                '🧮': (() => {
                    const data = { ...DATA['🧮'] };
                    delete data.previous;
                    return JSON.parse(JSON.stringify(data));
                })(),
                '🧲': JSON.parse(JSON.stringify(DATA['🧲']))
            };
            DATA['🧮']['previous'].push({
                outerIter: DATA['🧮']['🧮🔄🌊'],
                innerIter: DATA['🧮']['🧮🔄☀️'],
                waterPass: waterPass,
                temperature_K: DATA['🧮']['🧮🌡️'],
                temperature_C: DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS,
                delta_equilibre: DATA['🧲']['🔺🧲'],
                phase: DATA['🧮']['🧮⚧'],
                data_snapshot: data_snapshot
            });
            try { if (typeof window.displayConvergence === 'function') window.displayConvergence(); } catch (e) { if (typeof console !== 'undefined') console.warn('displayConvergence:', e); }
            
            // Test convergence interne
            if (Math.abs(DATA['🧲']['🔺🧲']) <= DATA['🧮']['🧲🔬']) {
                innerConverged = true;
            }
            
            if (innerConverged) break;
            
            // Ajuster T selon la phase (avant prochaine itération)
            const T_before_update = DATA['🧮']['🧮🌡️'];
            if (DATA['🧮']['🧮⚧'] === 'Search') {
                const delta_to_use = DATA['🧮']['🧮🔄☀️'] === 0 ? delta_equilibre_init : DATA['🧲']['🔺🧲'];
                const sensitivity = DATA['🧮']['🧲🔬'] / EPOCH['🧲🔬'];
                let increment = sensitivity !== 0 ? delta_to_use / sensitivity : 0;
                const tolerance = DATA['🧮']['🧲🔬'];
                if (tolerance > 0 && Math.abs(delta_to_use) > LARGE_DELTA_FACTOR * tolerance) {
                    const scale = Math.min(SEARCH_STEP_SCALE_MAX, Math.abs(delta_to_use) / tolerance);
                    increment *= scale;
                }
                const maxStepK = (tolerance > 0 && Math.abs(delta_to_use) > LARGE_DELTA_FACTOR * tolerance) ? MAX_SEARCH_STEP_LARGE_K : MAX_SEARCH_STEP_K;
                if (Number.isFinite(increment) && Math.abs(delta_to_use) > tolerance && Math.abs(increment) < MIN_SEARCH_STEP_K)
                    increment = Math.sign(delta_to_use) * Math.max(Math.abs(increment), MIN_SEARCH_STEP_K);
                if (Number.isFinite(increment) && Math.abs(increment) > maxStepK)
                    increment = Math.sign(increment) * maxStepK;
                if (!Number.isFinite(increment)) {
                    DATA['🧮']['🧮🌡️'] = (DATA['📅'] && DATA['📅']['🌡️🧮'] != null) ? DATA['📅']['🌡️🧮'] : DATA['🧮']['🧮🌡️'];
                } else {
                    DATA['🧮']['🧮🌡️'] += increment;
                }
                // Plafond T en Search : maxSearchT_K === null → pas de plafond (T monte) ; nombre → plafond ; non défini → T_LAVA_COMPLETE
                const rawCap = (typeof window !== 'undefined' && window.CONFIG_COMPUTE) ? window.CONFIG_COMPUTE.maxSearchT_K : undefined;
                const Tcap = (rawCap === null) ? Infinity : ((typeof rawCap === 'number' && Number.isFinite(rawCap)) ? rawCap : (CONST.T_LAVA_COMPLETE != null ? CONST.T_LAVA_COMPLETE : 2373));
                if (Number.isFinite(Tcap) && DATA['🧮']['🧮🌡️'] > Tcap) DATA['🧮']['🧮🌡️'] = Tcap;
            } else if (DATA['🧮']['🧮⚧'] === 'Dicho') {
                if (DATA['🧲']['🔺🧲'] > 0 && DATA['🧮']['🧮🌡️'] < DATA['🧮']['🧮🌡️🔼']) {
                    DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
                } else if (DATA['🧲']['🔺🧲'] < 0 && DATA['🧮']['🧮🌡️'] > DATA['🧮']['🧮🌡️🔽']) {
                    DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                }
                if (DATA['🧮']['🧮🌡️🔽'] >= DATA['🧮']['🧮🌡️🔼']) {
                    const T0_center = DATA['🧮']['🧮🌡️'];
                    const delta_T = Math.max(1.0, Math.abs(DATA['🧲']['🔺🧲']) / 100);
                    if (DATA['🧲']['🔺🧲'] > 0) {
                        DATA['🧮']['🧮🌡️🔼'] = T0_center;
                        DATA['🧮']['🧮🌡️🔽'] = Math.max(100, T0_center - delta_T * 2);
                    } else {
                        DATA['🧮']['🧮🌡️🔽'] = T0_center;
                        DATA['🧮']['🧮🌡️🔼'] = Math.min(3000, T0_center + delta_T * 2);
                    }
                }
                DATA['🧮']['🧮🌡️'] = (DATA['🧮']['🧮🌡️🔽'] + DATA['🧮']['🧮🌡️🔼']) / 2;
            }
            // Arrêt si T inchangée (plafond atteint ou pas nul) → évite 21 itérations inutiles
            if (DATA['🧮']['🧮🌡️'] === T_before_update) innerConverged = true;
            DATA['🧮']['🧮🔄☀️']++;
        }
        if (window.ABORT_COMPUTE) return null;

        // 3. Calcul feedback précipitation (après RH et ☁️)
        window.calculatePrecipitationFeedback();
        
        // 4. Recalculer albedo et nuages avec nouvelle vapeur
        window.calculateAlbedo();
        window.calculateCloudFormationIndex();
        
        // 🔒 ÉTAPE CRITIQUE : Recalculer les flux radiatifs APRÈS le feedback précipitation
        // car les paramètres (vapeur, albedo, nuages) ont changé, donc 🔺🧲 doit être recalculé
        const flux_solaire_absorbe_after = window.calculateSolarFluxAbsorbed();
        const geothermal_flux_after = DATA['🌕']['🧲🌕'];
        const flux_entrant_after = flux_solaire_absorbe_after + geothermal_flux_after;
        
        window.calculateFluxForT0();
        window.calculateRadiativeCapacities();
        const spectral_result_after = window.getSpectralResultFromDATA();
        const flux_sortant_surface_after = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
        let flux_sortant_effectif_after = spectral_result_after.total_flux;
        if (!Number.isFinite(flux_sortant_effectif_after) || flux_sortant_effectif_after <= 0) {
            flux_sortant_effectif_after = flux_sortant_surface_after;
        }
        
        // Mettre à jour les flux dans DATA
        DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_after;
        DATA['🧲']['🧲🌕🔽'] = geothermal_flux_after;
        DATA['🧲']['🧲🌑🔼'] = flux_sortant_surface_after;
        DATA['🧲']['🧲🌈🔼'] = flux_sortant_effectif_after;
        DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
        DATA['🧲']['🔺🧲'] = flux_entrant_after - flux_sortant_effectif_after;
        // DATA['🧮']['🧲🔬'] garde la valeur EPOCH['🧲🔬'] définie à l'init (ne pas écraser)

        // Si zone liquide et cycle eau a changé (albedo/vapeur) → refaire un tour radiatif (convergence rapide)
        if (typeof window.getWaterCycleTempBoundsFromPressure === 'function') {
            const P_atm = (DATA['🫧'] && DATA['🫧']['🎈']) || 1;
            const { T_low_K, T_high_K } = window.getWaterCycleTempBoundsFromPressure(P_atm);
            const T_K = DATA['🧮']['🧮🌡️'];
            const in_liquid_range = (T_K >= T_low_K && T_K <= T_high_K);
            const new_albedo = (DATA['🪩'] && DATA['🪩']['🍰🪩📿']) != null ? DATA['🪩']['🍰🪩📿'] : 0;
            const new_vapor = (DATA['💧'] && DATA['💧']['🍰🫧💧']) != null ? DATA['💧']['🍰🫧💧'] : 0;
            const water_changed = in_liquid_range && (
                Math.abs(new_albedo - ref_cycle.albedo) > tol_albedo ||
                Math.abs(new_vapor - ref_cycle.vapor) > tol_vapor
            );
            if (water_changed && water_repeats < max_water_repeats) {
                ref_cycle = { albedo: new_albedo, vapor: new_vapor };
                water_repeats++;
            } else {
                break;
            }
        } else {
            break;
        }
        } while (true);
        if (window.ABORT_COMPUTE) return null;

        // 5. Ajuster température selon déséquilibre radiatif (seulement si la boucle interne n'a pas convergé)
        // Si la boucle interne a convergé, 🔺🧲 devrait être proche de zéro, donc pas besoin d'ajustement
        // Si la boucle interne n'a pas convergé, on ajuste légèrement la température pour la prochaine itération
        if (innerConverged) {
            // La boucle interne a convergé : vérifier si on peut arrêter
            if (Math.abs(DATA['🧲']['🔺🧲']) < DATA['🧮']['🧲🔬'] && Math.abs(DATA['🧲']['🔺🧲'] - DATA['🧮']['🧲🔺⏮']) < 0.01) {
                // Revenir à 🔺⏳ normal si convergence partielle
                if (DATA['📅']['🔺⏳'] > 86400) {
                    DATA['📅']['🔺⏳'] = 86400;
                }
                break;
            }
            // Même si la boucle interne a convergé, si 🔺🧲 change encore (à cause du cycle de l'eau),
            // on ajuste très légèrement la température
            const dT = DATA['🧲']['🔺🧲'] * 0.1; // Réduire le facteur de 0.8 à 0.1 pour éviter les oscillations
            if (Number.isFinite(dT)) {
                DATA['🧮']['🧮🌡️'] += dT;
            } else {
                DATA['🧮']['🧮🌡️'] = (DATA['📅'] && DATA['📅']['🌡️🧮'] != null) ? DATA['📅']['🌡️🧮'] : DATA['🧮']['🧮🌡️'];
            }
            //DATA['🧮']['🧮🌡️'] = Math.max(100, Math.min(3000, DATA['🧮']['🧮🌡️']));
        } else {
            // La boucle interne n'a pas convergé : ajuster la température plus agressivement
            // mais toujours avec un facteur réduit pour éviter les oscillations
            const dT = DATA['🧲']['🔺🧲'] * 0.2; // Réduire le facteur de 0.8 à 0.2
            if (Number.isFinite(dT)) {
                DATA['🧮']['🧮🌡️'] += dT;
            } else {
                DATA['🧮']['🧮🌡️'] = (DATA['📅'] && DATA['📅']['🌡️🧮'] != null) ? DATA['📅']['🌡️🧮'] : DATA['🧮']['🧮🌡️'];
            }
            //DATA['🧮']['🧮🌡️'] = Math.max(100, Math.min(3000, DATA['🧮']['🧮🌡️']));
        }
        DATA['🧮']['🧲🔺⏮'] = DATA['🧲']['🔺🧲'];
        
        // Réduire 🔺⏳ progressivement après quelques itérations
        if (DATA['🧮']['🧮🔄🌊'] > 3 && DATA['📅']['🔺⏳'] > 86400) {
            DATA['📅']['🔺⏳'] = 86400; // Revenir à 1 jour
        }
        try { if (window.displayConvergence) window.displayConvergence(); } catch (e) { if (typeof console !== 'undefined') console.warn('displayConvergence:', e); }
        await new Promise(function (r) { setTimeout(r, 0); });
    }

    window.getEnabledStates();
    DATA['📛']['📛🏭'] = window.calculateCO2Forcing(DATA['🫧']['🍰🫧🏭']);
    DATA['📛']['📛⛽'] = window.calculateCH4Forcing(DATA['🫧']['🍰🫧⛽']);
    DATA['📛']['📿📛'] = DATA['📛']['📛🏭'] + DATA['📛']['📛⛽'] + DATA['📛']['📛💧'];
    // DATA['🧮']['🧲🔬'] garde la valeur EPOCH['🧲🔬'] définie à l'init (ne pas écraser)
    DATA['🧮']['🧮🔄'] = DATA['🧮']['🧮🔄🌊'];
    return true;
    })();
    })();
}

// Exposer les fonctions globalement
// Note: getEpochDateConfig est déjà exposé dans compute.js
window.calculateT0 = calculateT0;
window.initForConfig = initForConfig;
window.cycleDeLeau = cycleDeLeau;
window.computeRadiativeTransfer = computeRadiativeTransfer;
window.newDate = newDate;

