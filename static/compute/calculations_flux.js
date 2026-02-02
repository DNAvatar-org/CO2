// ============================================================================
// File: static/compute/calculations_flux.js - Calculs de flux radiatif
// Desc: En français, dans l'architecture, je suis le module de calculs de flux radiatif
// Version 1.2.2
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
// - Init atmosphere from epoch T (🌡️🧮) in both anim/non-anim so same equilibrium (Hadéen)
// - Phase Init cycle eau : utiliser T_epoch (pas T_solver) pour mêmes conditions initiales anim/sans anim
// - Logs flux/atmosphère affichés tout le temps (sans flag DEBUG_DATA_IO)
// - Cycle 1 : même calculs anim/sans anim (T_epoch + composition + H2O + albedo), une seule séquence, ref supprimée
// - Suppression computeRadiativeTransferLegacy (chemin mort) ; sans args → rejet, utiliser simulateRadiativeTransfer
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

// Calcule T0 initial. Seule différence anim/sans anim : en anim T0 ne s'actualise pas (reste prev_T0) ; sans anim T0 = 🌡️🧮 + 💫.
function calculateT0() {
    const DATA = window.DATA;
    const CONST = window.CONST;

    if (DATA['🔘']['🔘🎬']) {
        DATA['🧮']['🧮🌡️🚩'] = DATA['🧮']['🧮🌡️']; // anim : garder T0 actuel
    } else {
        const adjustment = DATA['📜']['🔺🌡️💫'] * DATA['📜']['📿💫'];
        DATA['🧮']['🧮🌡️🚩'] = DATA['📅']['🌡️🧮'] + adjustment; // sans anim : T0 = config époque
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
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    // 🔒 Conditions initiales = config époque (comme sans anim) ; T0 déjà fixé par calculateT0() (en anim = prev)
    const T_solver_init = DATA['🧮']['🧮🌡️'];
    const adjustment_atm = (DATA['📜']['🔺🌡️💫'] || 0) * (DATA['📜']['📿💫'] || 0);
    const T_epoch_for_atm = (EPOCH && EPOCH['🌡️🧮'] != null ? EPOCH['🌡️🧮'] : 288) + adjustment_atm;
    DATA['🧮']['🧮🌡️'] = T_epoch_for_atm;
    window.calculateAtmosphereComposition();
    if (window.calculateGeologySurfaces) window.calculateGeologySurfaces();
    // Partition eau une fois avec T0 de la config (cache invalidé pour forcer le recalcul)
    window._lastH2OParamsCache = null;
    window.calculateH2OParameters();
    window.getEnabledStates();
    window.calculateAlbedo();
    DATA['🧮']['🧮🌡️'] = T_solver_init;
    DATA['🧮']['🔬🌈'] = window.CONFIG_COMPUTE.maxSpectralBinsConvergence;
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

// OOM = Out Of Memory (manque de RAM → processus tué, ex. Brave code 5). Debug mémoire sans DEBUG_DATA_IO.
// Activer en console avant Calcul : window.DEBUG_OOM = true
function _oomLog(label, extra) {
    if (!window.DEBUG_OOM || typeof console === 'undefined') return;
    const m = (typeof performance !== 'undefined' && performance.memory)
        ? { heapMB: (performance.memory.usedJSHeapSize / 1e6).toFixed(1), limitMB: (performance.memory.jsHeapSizeLimit / 1e6).toFixed(0) }
        : {};
    console.log('[OOM]', label, { ...m, ...extra });
}

async function cycleDeLeau(outerIter, isFirst) {
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return { changed: false };
    const DATA = window.DATA;
    window.calculateH2OParameters();
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return { changed: false };
    window.getEnabledStates();
    window.calculatePrecipitationFeedback();
    window.calculateAlbedo();
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return { changed: false };
    window.calculateCloudFormationIndex();

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
    const P_atm = (DATA['🫧'] && DATA['🫧']['🎈']) || 1;
    const { T_low_K, T_high_K } = window.getWaterCycleTempBoundsFromPressure(P_atm);
    const T_K = DATA['🧮']['🧮🌡️'];
    if (T_K < T_low_K || T_K > T_high_K) {
        window._lastCycleRef = { albedo, vapor };
        return { changed: false };
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
// Sans args : rejet (utiliser simulateRadiativeTransfer() pour le calcul principal — chemin sans anim).
// ============================================================================
function computeRadiativeTransfer(outerIter, waterPass) {
    if (typeof outerIter === 'number' && typeof waterPass === 'number') {
        return runRadiatifOnly(outerIter, waterPass);
    }
    return Promise.reject(new Error('computeRadiativeTransfer() sans args : utiliser simulateRadiativeTransfer()'));
}

async function runRadiatifOnly(outerIter, waterPass) {
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return null;
    const DATA = window.DATA;
    const epochIndex = DATA['📜']['👉'];
    const EPOCH = window.TIMELINE[epochIndex];
    const CONST = window.CONST;
    if (!DATA['🧮']['previous']) DATA['🧮']['previous'] = [];
    _oomLog('runRadiatifOnly start', { outerIter, waterPass, previousLen: DATA['🧮']['previous'].length });

    const geothermal_flux_init = DATA['🌕']['🧲🌕'];
    const solar_flux_incident_init = DATA['☀️']['🧲☀️🎱'];
    const albedo_init_value = (DATA['🪩'] && DATA['🪩']['🍰🪩📿']) != null ? DATA['🪩']['🍰🪩📿'] : 0;
    const flux_solaire_absorbe_init = solar_flux_incident_init * (1 - albedo_init_value);
    const flux_entrant_init = flux_solaire_absorbe_init + geothermal_flux_init;

    if (!window.calculateFluxForT0()) return Promise.reject(new Error('calculateFluxForT0() a échoué'));
    const spectral_result_init = window.getSpectralResultFromDATA();
    if (spectral_result_init.lambda_range && spectral_result_init.z_range) {
        const bins = spectral_result_init.lambda_range.length;
        const layers = spectral_result_init.z_range.length;
        const estMB = (bins * layers * 5 * 8) / 1e6;
        _oomLog('after first calculateFluxForT0', { bins, layers, estMB: estMB.toFixed(1) + ' MB' });
    }
    // Avertissement mémoire (une fois par session) : pas de garantie cross‑machine, informer si grosse grille
    if (outerIter === 0 && !window._spectralMemoryWarned && spectral_result_init.lambda_range && spectral_result_init.z_range) {
        const bins = spectral_result_init.lambda_range.length;
        const layers = spectral_result_init.z_range.length;
        const estMB = (bins * layers * 5 * 8) / 1e6;
        if (estMB > 25) {
            console.warn('⚠️ Grille spectrale ~' + estMB.toFixed(0) + ' MB (bins=' + bins + ', couches=' + layers + '). Sur machine peu RAM ou crash (Brave code 5), réduire CONFIG_COMPUTE.maxSpectralBinsConvergence (ex. 50).');
            window._spectralMemoryWarned = true;
        }
    }
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

    // DATA['🧮']['🔬🌈'] et DATA['🧮']['🔬🫧'] déjà mis à jour par calculateFluxForT0
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
    // Bornes dès calcul radiatif 0 : T° époque (pas anim prev) → mêmes bornes anim/sans anim
    const T_bornes_init = DATA['📅']['🌡️🧮'] + (DATA['📜']['🔺🌡️💫'] || 0) * (DATA['📜']['📿💫'] || 0);
    DATA['🧮']['🧮🌡️🔽'] = T_bornes_init - 50;
    DATA['🧮']['🧮🌡️🔼'] = T_bornes_init + 50;
    DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️'];
    DATA['🧮']['🧲🔺⏮'] = delta_equilibre_init;
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

    try { window.displayConvergence(); } catch (e) { console.warn('displayConvergence:', e); }
    await new Promise(r => setTimeout(r, 0)); // Laisser le DOM et la console afficher Init

    const maxInnerIters = (CONST.maxRadiatifIters != null) ? CONST.maxRadiatifIters : 21;
    let innerConverged = false;
    while (DATA['🧮']['🧮🔄☀️'] < maxInnerIters && !innerConverged) {
        await new Promise(r => setTimeout(r, 0)); // Laisser le clic Stop être traité
        if (window.ABORT_COMPUTE) return null;
        DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * (EPOCH['🧲🔬'] ?? 0.1);
        window.calculateH2OParameters();
        window.getEnabledStates();
        window.calculateAlbedo();
        window.calculateFluxForT0();
        window.calculateRadiativeCapacities();
        const spectral_result = window.getSpectralResultFromDATA();
        DATA['🧲']['🧲☀️🔽'] = window.calculateSolarFluxAbsorbed();
        DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
        DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
        const flux_sortant_effectif_inner = Number.isFinite(spectral_result.total_flux) && spectral_result.total_flux > 0 ? spectral_result.total_flux : DATA['🧲']['🧲🌑🔼'];
        DATA['🧲']['🧲🌈🔼'] = flux_sortant_effectif_inner;
        DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * (DATA['🪩'] && DATA['🪩']['🍰🪩📿'] ? DATA['🪩']['🍰🪩📿'] : 0);
        DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
        // DATA['🧮']['🔬🌈'] et DATA['🧮']['🔬🫧'] déjà mis à jour par calculateFluxForT0

        // Dicho : encadrer Δ=0. Convention 🔽 = borne basse (min T), 🔼 = borne haute (max T), toujours 🔽 < 🔼.
        // En Search : mettre à jour les bornes au fur et à mesure (sinon 🔽🔼 restent 205-305 si init avec T° epoch précédente)
        if (DATA['🧮']['🧮⚧'] === 'Search' && DATA['🧮']['🧮🔄☀️'] > 0) {
            const T_curr = DATA['🧮']['🧮🌡️'];
            if (DATA['🧲']['🔺🧲'] > 0) {
                DATA['🧮']['🧮🌡️🔽'] = T_curr;
                if (DATA['🧮']['🧮🌡️🔼'] <= T_curr) DATA['🧮']['🧮🌡️🔼'] = T_curr + 50;
            } else if (DATA['🧲']['🔺🧲'] < 0) {
                DATA['🧮']['🧮🌡️🔼'] = T_curr;
                if (DATA['🧮']['🧮🌡️🔽'] >= T_curr) DATA['🧮']['🧮🌡️🔽'] = Math.max(100, T_curr - 50);
            }
        }
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
            window.alert('Crash algo: ☯=0 en phase Search (Δ sans signe, direction impossible). Arrêt.');
            console.error('Crash algo: ☯=0 en phase Search');
            return null;
        }
        try { window.displayConvergence(); } catch (e) { console.warn('displayConvergence:', e); }
        await new Promise(r => setTimeout(r, 0)); // Laisser le DOM et la console à jour après chaque itération

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
            const rawCapRun = window.CONFIG_COMPUTE.maxSearchT_K;
            const TcapRun = (rawCapRun === null) ? Infinity : ((typeof rawCapRun === 'number' && Number.isFinite(rawCapRun)) ? rawCapRun : (CONST.T_LAVA_COMPLETE != null ? CONST.T_LAVA_COMPLETE : 2373));
            if (Number.isFinite(TcapRun) && DATA['🧮']['🧮🌡️'] > TcapRun) DATA['🧮']['🧮🌡️'] = TcapRun;
        } else if (DATA['🧮']['🧮⚧'] === 'Dicho') {
            // Réduction du bracket : Δ>0 → 🔽 = T ; Δ<0 → 🔼 = T. Garder 🔽 < 🔼 strict (évite boucle infinie).
            const T_curr = DATA['🧮']['🧮🌡️'];
            const low = DATA['🧮']['🧮🌡️🔽'];
            const high = DATA['🧮']['🧮🌡️🔼'];
            if (DATA['🧲']['🔺🧲'] > 0 && T_curr > low && T_curr < high) DATA['🧮']['🧮🌡️🔽'] = T_curr;
            else if (DATA['🧲']['🔺🧲'] < 0 && T_curr < high && T_curr > low) DATA['🧮']['🧮🌡️🔼'] = T_curr;
            if (DATA['🧮']['🧮🌡️🔽'] >= DATA['🧮']['🧮🌡️🔼']) {
                const T0 = DATA['🧮']['🧮🌡️'];
                const dT = Math.max(2, Math.abs(DATA['🧲']['🔺🧲']) / 100, T0 * 0.005); // largeur min 2 K pour éviter collapse
                if (DATA['🧲']['🔺🧲'] > 0) { DATA['🧮']['🧮🌡️🔽'] = T0; DATA['🧮']['🧮🌡️🔼'] = Math.min(3000, T0 + dT); }
                else { DATA['🧮']['🧮🌡️🔼'] = T0; DATA['🧮']['🧮🌡️🔽'] = Math.max(100, T0 - dT); }
            }
            DATA['🧮']['🧮🌡️'] = (DATA['🧮']['🧮🌡️🔽'] + DATA['🧮']['🧮🌡️🔼']) / 2;
        }
        if (DATA['🧮']['🧮🌡️'] === T_before_update_run) innerConverged = true;
        const iter_index = DATA['🧮']['🧮🔄☀️'];
        DATA['🧮']['🧮🔄☀️']++;

        // Recalculer flux et Δ à la nouvelle T pour afficher (T_new, Δ_new) cohérent
        _oomLog('before calculateFluxForT0', { iter: DATA['🧮']['🧮🔄☀️'], T: DATA['🧮']['🧮🌡️'], previousLen: DATA['🧮']['previous'].length });
        window.calculateH2OParameters();
        window.calculateFluxForT0();
        window.calculateRadiativeCapacities();
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
        const maxPrevious = window.CONFIG_COMPUTE.maxPreviousLength;
        if (DATA['🧮']['previous'].length > maxPrevious) DATA['🧮']['previous'].splice(0, DATA['🧮']['previous'].length - maxPrevious);
        _oomLog('after push', { previousLen: DATA['🧮']['previous'].length });
        await new Promise(r => setTimeout(r, 0)); // Yield pour afficher cette étape avant la suivante
    }
    return true;
}

// Exposer les fonctions globalement
// Note: getEpochDateConfig est déjà exposé dans compute.js
window.calculateT0 = calculateT0;
window.initForConfig = initForConfig;
window.cycleDeLeau = cycleDeLeau;
window.computeRadiativeTransfer = computeRadiativeTransfer;
window.newDate = newDate;

