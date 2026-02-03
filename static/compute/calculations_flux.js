// ============================================================================
// File: static/compute/calculations_flux.js - Calculs de flux radiatif
// Desc: En français, dans l'architecture, je suis le module de calculs de flux radiatif
// Version 1.2.38
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
// - Init atmosphere from epoch T (🌡️🧮) in both anim/non-anim so same equilibrium (Hadéen)
// - Phase Init cycle eau : utiliser T_epoch (pas T_solver) pour mêmes conditions initiales anim/sans anim
// - Cycle 1 : même calculs anim/sans anim (T_epoch + composition + H2O + albedo), une seule séquence, ref supprimée
// - Suppression computeRadiativeTransferLegacy (chemin mort) ; sans args → rejet, utiliser simulateRadiativeTransfer
// - updateConvergenceBounds() : bornes Init basées sur 🧮🌡️ et ☯ (pas 📅🌡️🧮) pour anim Hadéen
// - Premier cycle : phase Search + skip précip pour aligner ☁️/🍰🪩⛅ avec 1re itération radiatif
// - Init: next_T_C pour affichage => next_T°C ; franchissement T_input vs T_output (0°C ou T_boil) en sortie → redoWaterCycle
// - Dicho/bounds update après recalc flux (avant snapshot) pour affichage [🔽,🔼] et next_T°C corrects quand ☯=-1
// - Même bloc Dicho/bounds dans crossing ; yinYang = DATA['🧮']['🧮☯'] (source unique, pas Math.sign intermédiaire)
// - Boucle externe retirée : crossing géré en interne (cycleDeLeau + continue), pas de réinit index
// - Pas de push CycleEau après crossing : CycleEauCrossing suffit (évite doublon cycle 2, T cohérente avec => next°C)
// - CycleEauCrossing : T_crossing_C = T_next_K (explicite) pour cohérence avec => next°C
// - Dicho bounds au sign change : min/max(T_prev,T_curr) pour éviter inversion 🔽/🔼 (ex: crossing 37.9→187.9°C)
// - Crossing : ajout getEnabledStates + calculateAlbedo avant calculateFluxForT0 (albedo obsolète → Δ faux → pas de convergence)
// - Bloc post-T (sans crossing) : idem getEnabledStates+calculateAlbedo ; Dicho bounds min/max (éviter inversion comme en haut de boucle)
// - Bloc post-T : mise à jour bornes Dicho (Δ>0→🔽, Δ<0→🔼) manquait → Δ>0 mais T baissait ; retrait cycle1_T_C
// - calculateGasContributionsToEDS : décomposition EDS par gaz (CO2, H2O, CH4) en % ; affichage dans displayConvergence
// - Convention Δ : 🔺🧲 = flux_entrant - flux_sortant (Δ>0→réchauffer→🔽=T, Δ<0→refroidir→🔼=T)
// - expandBracketIfInvalid() : exécuté quelle que soit la phase si 🔽>=🔼 ; dT = |Δ|/(4σT³) (formule physique)
// - Fix oscillation Search : ne pas mettre à jour ☯ quand Δ×☯<0 (changement de signe) pour détecter passage en Dicho
// - ΔT proportionnel à Δ : computeSearchIncrement = Δ/(4σT³), cap maxStepK uniquement ; Init affiche next_T_C (T suivante)
// - computeSearchIncrement: Math.pow(Δ,1/3)=NaN si Δ<0 → sign(Δ)×|Δ|^(1/3)
// - calcul radiatif N : T affichée = température d'entrée (🧮🌡️⏮), pas la sortie après pas
// - next_T_C = T atteinte par le pas (Search et Dicho) pour cohérence cycle albédo
// - Dicho T===T_prev : arrêt seulement si convergé ; sinon élargir bracket pour débloquer
// - 3 Dicho même sens d'affilée → retour Search + expansion bornes (comme Search)
// - Crossing (0°C, T_boil) : phase=Search, 🧮🔄🪩++ pour index monotone (éviter cycle 6 puis 1)
// - T===T_prev : tolérance |T-T_prev|<0.01 K (éviter 39.3 vs 39.5°C faux positifs)
// - Search : garde Δ>0⇒T↑, Δ<0⇒T↓ (éviter next_T opposé au sens de Δ)
// - push delta_equilibre = 🧲🔺⏮ (Δ à l'entrée) pour affichage cohérent
// - Snapshot CycleEau après calculateAlbedo : 🧮🔄🪩 (index affichage) pour nouvelle div
// - Init : 🧮🔄🪩++ pour que premier cycle après Init = 1 (pas 0)
// - Crossing pushPayload : T_input=T_prev, next_T=T_crossing (afficher pas 224.6=>263.9°C, pas 263.9=>304.7)
// - v1.2.25 : waterPass→albedoIter/waterIter, waterPassCrossing supprimé
// - v1.2.26 : 💧 cycle eau utilise albedoIter (0,1,2..) ; calcul radiatif albedoIter=🧮🔄🪩-1
// - v1.2.27 : 🧮🔄🪩++ déplacé en fin de boucle (après push calcul radiatif) et entre pushPayload/CycleEauCrossing
// - CycleEauCrossing : T_transition_C, P_atm pour affichage 💧┴ = T°C [🎈=P atm]
// - pushPayload : albedoIter (🪩), waterIter (💧) ; waterPassCrossing supprimé
// - v1.2.28 : yinYangForPush = ☯ avant mise à jour ligne 709 pour afficher ☯ ancien (changement signe→Dicho visible)
// - v1.2.29 : 🧮🛑 raison arrêt (converged|max_iter|abort|crash|max_water) affichée dans convergence
// - v1.2.30 : push état convergé avant break pour cohérence affichage (Δ final listé)
// - v1.2.31 : phaseForStep = phase avant changement ; afficher phase réelle du pas (Search vs Dicho)
// - v1.2.32 : fix clampBracketToEpochMax (supprimé, non défini) ; logs DEBUG_ANALYSE CO2, cloud_index, CycleEau T/albedo/vapor
// - v1.2.33 : console.log complets (DEBUG_ANALYSE) pour copie/colle depuis la console
// - v1.2.34 : fix ReferenceError DATA in computeSearchIncrement + newDate (const DATA = window.DATA)
// - v1.2.35 : fix updateConvergenceBounds — définir les deux bornes (🔼 restait undefined → NaN)
// - v1.2.36 : DEBUG_ANALYSE_DETAIL + logDetailPremiersCalculs (CYCLE0, Init, CycleEau iter=0) pour transmettre à une autre IA
// - v1.2.37 : Search step : clamp explicite 80 K pour T>2000 K (Hadéen) pour éviter oscillation
// - v1.2.38 : initForConfig : T_epoch si |T_solver-T_epoch|≤20K (1800 OK), T réelle si transition extrême (Corps noir→Archéen)
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
    DATA['📛'] = null; // breakdown EDS par gaz (tau_i/tau dans calculateFluxForT0)

    // IMPORTANT: On met toujours à jour DATA['🧮']['🧮🌡️'] avec la valeur calculée
    // Si animation activée (🔘🎬 = true) : T0_base a été lu depuis DATA['🧮']['🧮🌡️'] (ligne 43)
    // Si animation désactivée (🔘🎬 = false) : T0 = DATA['📅']['🌡️🧮'] + adjustment (ligne 47)
    // On doit mettre à jour DATA['🧮']['🧮🌡️'] pour que la convergence utilise cette nouvelle valeur
    // Pour la convergence, c'est TOUJOURS DATA['🧮']['🧮🌡️'] qui est utilisé
    DATA['🧮']['🧮🌡️'] = DATA['🧮']['🧮🌡️🚩'];
    // Tolérance flux (W/m²) = 4σT³ × precision_K (EPOCH['🧲🔬'] en K) — pas une valeur fixe 1 W/m²
    DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * EPOCH['🧲🔬'];
    
    // Logs désactivés pour réduire la taille
    // console.log(`🌡️ T0 [calculateT0@calculations_flux.js]`);
    // console.log(`T0 initial: ${DATA['🧮']['🧮🌡️'].toFixed(2)}K`);
    
    return true;
}

//Réinitialise les variables lors d'un changement de date
function newDate() {
    const DATA = window.DATA;
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
    const T_solver_init = DATA['🧮']['🧮🌡️'];
    const T_epoch = EPOCH['🌡️🧮'] + DATA['📜']['🔺🌡️💫'] * DATA['📜']['📿💫'];
    // Transition extrême (ex: Corps noir -18°C→Archéen) : cycle eau avec T réelle pour Δ cohérent Init/iter
    // Cas normal (ex: 1800) : T_epoch pour éviter régression (22°C au lieu de 15°C)
    if (Math.abs(T_solver_init - T_epoch) > 20) DATA['🧮']['🧮🌡️'] = T_solver_init;
    else DATA['🧮']['🧮🌡️'] = T_epoch;
    window.calculateAtmosphereComposition();
    if (window.calculateGeologySurfaces) window.calculateGeologySurfaces();
    // Partition eau une fois avec T0 de la config (cache invalidé pour forcer le recalcul)
    // 🔒 WORKAROUND : En Init, calculateH2OParametersWithIteration converge vers 🍰🫧💧=0 (précip sans évap).
    // Utiliser Search (vapeur potentielle) pour avoir nuages/albédo cohérents dès le départ.
    const phasePrev = DATA['🧮']['🧮⚧'];
    if (phasePrev === 'Init') DATA['🧮']['🧮⚧'] = 'Search';
    window._lastH2OParamsCache = null;
    window.calculateH2OParameters();
    if (phasePrev === 'Init') DATA['🧮']['🧮⚧'] = phasePrev;
    window.getEnabledStates();
    window.calculateAlbedo();
    DATA['🧮']['🧮🌡️'] = T_solver_init;
    DATA['🧮']['🔬🌈'] = window.CONFIG_COMPUTE.maxSpectralBinsConvergence;
    window._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
    return true;
}

// ============================================================================
// cycleDeLeau — Cycle eau (h2o, précip, albedo, nuages). Retourne Promise<{ changed }>.
// isFirst: true = après config, on pousse le premier cycle dans Convergence.
// Async + yields pour que le bouton Stop soit cliquable pendant les calculs.
// ============================================================================
/** Met à jour 🧮🌡️🔽 et 🧮🌡️🔼 à partir de 🧮🌡️ et ☯ (signe Δ).
 * Convention Δ = flux_entrant - flux_sortant.
 * ☯=+1 : Δ>0, on reçoit plus qu'on émet → réchauffer → borne min (🔽) = T_curr.
 * ☯=-1 : Δ<0, on émet plus qu'on reçoit → refroidir → borne max (🔼) = T_curr. */
function updateConvergenceBounds() {
    const DATA = window.DATA;
    const T_curr = DATA['🧮']['🧮🌡️'];
    const yinYang = DATA['🧮']['🧮☯'];
    const dT = computeSearchIncrement();
    // Δ = flux_entrant - flux_sortant : Δ>0 → réchauffer (🔽=T), Δ<0 → refroidir (🔼=T)
    if (yinYang > 0) {
        DATA['🧮']['🧮🌡️🔽'] = T_curr;
        DATA['🧮']['🧮🌡️🔼'] = T_curr + Math.max(1, Math.abs(dT));
    } else if (yinYang < 0) {
        DATA['🧮']['🧮🌡️🔼'] = T_curr;
        DATA['🧮']['🧮🌡️🔽'] = Math.max(100, T_curr - Math.abs(dT));
    }
}

/** Calcule l'incrément Search en K. ΔT ∝ |Δ|^(1/pow), signe = signe(Δ).
 * pow = 2 + DT/1500 avec DT = |T - T_cible| (tuning par époque).
 * Hadéen (T>2000K): cap 80 K pour éviter oscillation (équilibre bande étroite ~2250°C). */
function computeSearchIncrement() {
    const DATA = window.DATA;
    const delta = DATA['🧲']['🔺🧲'];
    const T_K = DATA['🧮']['🧮🌡️'];
    const DT = Math.abs(T_K - DATA['📅']['🌡️🧮']);
    const pow = 2 + DT / 1500.0;
    let res = Math.sign(delta) * Math.pow(Math.abs(delta), 1 / pow);
    if (T_K > 2000) {
        const cap = 80;
        if (Math.abs(res) > cap) res = Math.sign(res) * cap;
    }
    if (window.DEBUG_ANALYSE) {
        const iterIdx = (DATA['🧮'] && DATA['🧮']['🧮🔄☀️'] != null) ? (DATA['🧮']['🧮🔄☀️'] === 0 ? 'Init' : DATA['🧮']['🧮🔄☀️']) : '-';
        console.log('[computeSearchIncrement][calculations_flux.js] iter=' + iterIdx + ' DT=' + DT.toFixed(2) + ' pow=' + pow.toFixed(3) + ' res=' + res.toFixed(4) + 'K');
    }
    return res;
}

/** Expansion du bracket quand 🔽 >= 🔼. Formule physique : ΔT = |Δ|/(4σT³). Exécuté quelle que soit la phase. */
function expandBracketIfInvalid() {
    const DATA = window.DATA;
    if (DATA['🧮']['🧮🌡️🔽'] < DATA['🧮']['🧮🌡️🔼']) return; // Bracket valide, rien à faire

    if (window.DEBUG_ANALYSE) {
        const CONST = window.CONST;
        console.log('[expandBracketIfInvalid][calculations_flux.js] Bracket invalide T_low=' + (DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ' T_high=' + (DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ' delta=' + DATA['🧲']['🔺🧲'].toFixed(2) + ' phase=' + DATA['🧮']['🧮⚧']);
    }
    //window.alert('[expandBracketIfInvalid] Bracket invalide: 🔽 >= 🔼. Correction en cours.');
    const dT_clamped = computeSearchIncrement();
    if (DATA['🧲']['🔺🧲'] > 0) {
        DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
        DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + dT_clamped;
    } else {
        DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
        DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'] + dT_clamped;
    }
}

// OOM = Out Of Memory (manque de RAM → processus tué, ex. Brave code 5).
// Activer en console avant Calcul : window.DEBUG_OOM = true
function _oomLog(label, extra) {
    if (!window.DEBUG_OOM || typeof console === 'undefined') return;
    const m = (typeof performance !== 'undefined' && performance.memory)
        ? { heapMB: (performance.memory.usedJSHeapSize / 1e6).toFixed(1), limitMB: (performance.memory.jsHeapSizeLimit / 1e6).toFixed(0) }
        : {};
    console.log('[OOM]', label, { ...m, ...extra });
}

async function cycleDeLeau(isFirst) {
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return { changed: false };
    const DATA = window.DATA;
    const CONST = window.CONST;
    // 🔒 Premier cycle : utiliser la même logique que la 1re itération Search (vapeur potentielle, pas d'itération précip)
    // Sinon Init → calculateH2OParametersWithIteration converge vers 🍰🫧💧=0 → ☁️=0, 🍰🪩⛅=0 ; Search → vapeur potentielle → ☁️>0
    const phasePrev = DATA['🧮']['🧮⚧'];
    if (isFirst && phasePrev === 'Init') {
        DATA['🧮']['🧮⚧'] = 'Search';
    }
    window.calculateH2OParameters();
    if (isFirst && phasePrev === 'Init') {
        DATA['🧮']['🧮⚧'] = phasePrev;
    }
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return { changed: false };
    window.getEnabledStates();
    // Premier cycle : pas de calculatePrecipitationFeedback (comme la 1re itération Search)
    if (!isFirst) window.calculatePrecipitationFeedback();
    window.calculateAlbedo();
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return { changed: false };
    window.calculateCloudFormationIndex();

    if (isFirst) {
        if (!DATA['🧮']['previous']) DATA['🧮']['previous'] = [];
        DATA['🧮']['previous'].push({
            innerIter: null,
            albedoIter: 0,
            waterIter: 0,
            phase: 'CycleEau',
            temperature_C: DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS,
            data_snapshot: {
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩']))
            }
        });
        window._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
        return { changed: false };
    }

    const { T_low_K, T_high_K } = window.getWaterCycleTempBoundsFromPressure(DATA['🫧']['🎈']);
    if (DATA['🧮']['🧮🌡️'] < T_low_K || DATA['🧮']['🧮🌡️'] > T_high_K) {
        window._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
        return { changed: false };
    }
    const changed = Math.abs(DATA['🪩']['🍰🪩📿'] - window._lastCycleRef.albedo) > window.CONFIG_COMPUTE.cycleTolAlbedo
        || Math.abs(DATA['💧']['🍰🫧💧'] - window._lastCycleRef.vapor) > window.CONFIG_COMPUTE.cycleTolVapor;
    window._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
    return { changed };
}

// ============================================================================
// computeRadiativeTransfer() — Radiatif seul. À appeler après initForConfig() et cycleDeLeau(true).
// 🧮🔄🌊 = cycle eau (0=après init, 1+=après crossing 0°C ou T_boil). Lu/écrit dans DATA.
// 🧮🔄☀️ = cycle radiatif (nombre de crossings). Crossing 0°C/T_boil géré en interne.
// Sans appel : rejet (utiliser simulateRadiativeTransfer() pour le calcul principal — chemin sans anim).
// ============================================================================
function computeRadiativeTransfer() {
    return runRadiatifOnly();
}

async function runRadiatifOnly() {
    await new Promise(r => setTimeout(r, 0));
    if (window.ABORT_COMPUTE) return null;
    const DATA = window.DATA;
    const epochIndex = DATA['📜']['👉'];
    const EPOCH = window.TIMELINE[epochIndex];
    const CONST = window.CONST;
    if (!DATA['🧮']['previous']) DATA['🧮']['previous'] = [];
    if (DATA['🧮']['🧮🔄🌊'] == null) DATA['🧮']['🧮🔄🌊'] = 0;
    const currentWaterPass = DATA['🧮']['🧮🔄🌊'];
    const maxWaterPass = 5;
    _oomLog('runRadiatifOnly start', { '🧮🔄🌊': currentWaterPass, previousLen: DATA['🧮']['previous'].length });
    if (window.DEBUG_ANALYSE) {
        const co2_kg = DATA['⚖️'] && DATA['⚖️']['⚖️🏭'];
        const co2_frac = DATA['🫧'] && DATA['🫧']['🍰🫧🏭'];
        const epochId = DATA['📜'] && DATA['📜']['🗿'] ? DATA['📜']['🗿'] : '?';
        const ch4_kg = DATA['⚖️'] && DATA['⚖️']['⚖️⛽'];
        const epoch_co2 = EPOCH && EPOCH['⚖️🏭'];
        console.log('[runRadiatifOnly][calculations_flux.js] START CO2_kg=' + (co2_kg != null ? co2_kg.toExponential(2) : '?') + ' CO2_frac=' + (co2_frac != null ? co2_frac.toExponential(4) : '?') + ' epochId=' + epochId + ' CH4_kg=' + (ch4_kg != null ? ch4_kg.toExponential(2) : '?') + ' EPOCH_CO2=' + (epoch_co2 != null ? epoch_co2.toExponential(2) : '?'));
    }
    if (currentWaterPass === 0) {
        window._fromCrossing = false;
        DATA['🧮']['🧮🔄🪩'] = 0;
    }

    if (currentWaterPass === 0) {
        DATA['🧮']['previous'].push({
            innerIter: null,
            albedoIter: 0,
            waterIter: 0,
            phase: 'CycleEau',
            data_snapshot: {
                '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩']))
            }
        });
    } else if (currentWaterPass > 0 && (currentWaterPass > 1 || !window._fromCrossing)) {
        DATA['🧮']['previous'].push({
            innerIter: null,
            albedoIter: DATA['🧮']['🧮🔄🪩'],
            waterIter: DATA['🧮']['🧮🔄🌊'],
            phase: 'CycleEau',
            data_snapshot: {
                '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩']))
            }
        });
        window._fromCrossing = false;
    }

    const T_input_K = DATA['🧮']['🧮🌡️'];
    const flux_solaire_absorbe_init = DATA['☀️']['🧲☀️🎱'] * (1 - DATA['🪩']['🍰🪩📿']);
    const flux_entrant_init = flux_solaire_absorbe_init + DATA['🌕']['🧲🌕'];

    if (!window.calculateFluxForT0()) return Promise.reject(new Error('calculateFluxForT0() a échoué'));
    const spectral_result_init = window.getSpectralResultFromDATA();
    if (spectral_result_init.lambda_range && spectral_result_init.z_range) {
        const bins = spectral_result_init.lambda_range.length;
        const layers = spectral_result_init.z_range.length;
        const estMB = (bins * layers * 5 * 8) / 1e6;
        _oomLog('after first calculateFluxForT0', { bins, layers, estMB: estMB.toFixed(1) + ' MB' });
    }
    // Avertissement mémoire (une fois par session) : pas de garantie cross‑machine, informer si grosse grille
    if (!window._spectralMemoryWarned && spectral_result_init.lambda_range && spectral_result_init.z_range) {
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
    const flux_sortant_effectif_init = spectral_result_init.total_flux;
    const delta_equilibre_init = flux_entrant_init - flux_sortant_effectif_init;
    if (window.DEBUG_ANALYSE) {
        const eds = DATA['📛'] ? DATA['📛']['🧲📛'] : null;
        const co2Pct = DATA['📛'] ? DATA['📛']['🍰📛🏭'] : null;
        const h2oPct = DATA['📛'] ? DATA['📛']['🍰📛💧'] : null;
        const ch4Pct = DATA['📛'] ? DATA['📛']['🍰📛⛽'] : null;
        const h2oScale = (typeof window.getH2OVaporEDSScale === 'function') ? window.getH2OVaporEDSScale().toFixed(3) : '?';
        console.log('[runRadiatifOnly][calculations_flux.js] CYCLE0 T_K=' + DATA['🧮']['🧮🌡️'].toFixed(2) + ' T_C=' + (DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ' flux_in=' + flux_entrant_init.toFixed(2) + ' flux_out=' + flux_sortant_effectif_init.toFixed(2) + ' delta=' + delta_equilibre_init.toFixed(2) + ' solar=' + flux_solaire_absorbe_init.toFixed(2) + ' albedo=' + DATA['🪩']['🍰🪩📿'].toFixed(3) + ' vapor=' + (DATA['💧']['🍰🫧💧'] != null ? DATA['💧']['🍰🫧💧'].toExponential(3) : '?') + ' cloud=' + (DATA['🪩']['☁️'] != null ? DATA['🪩']['☁️'].toFixed(3) : '?') + ' tol=' + DATA['🧮']['🧲🔬'].toFixed(2) + ' EDS=' + (eds != null ? eds.toFixed(1) : '?') + ' CO2%=' + (co2Pct != null ? co2Pct.toFixed(1) : '?') + ' H2O%=' + (h2oPct != null ? h2oPct.toFixed(1) : '?') + ' CH4%=' + (ch4Pct != null ? ch4Pct.toFixed(1) : '?') + ' H2O_scale=' + h2oScale);
    }
    if (window.DEBUG_ANALYSE_DETAIL && window.logDetailPremiersCalculs) {
        window.DETAIL_LOG_TEXT = '';
        window._detailLogPhase = true;
        const bins = spectral_result_init.lambda_range ? spectral_result_init.lambda_range.length : null;
        const layers = spectral_result_init.z_range ? spectral_result_init.z_range.length : null;
        const epochId = DATA['📜'] && DATA['📜']['🗿'] ? DATA['📜']['🗿'] : '?';
        const T_cible_K = EPOCH && EPOCH['🌡️🧮'] != null ? EPOCH['🌡️🧮'] : null;
        window.logDetailPremiersCalculs('CYCLE0 (premier calcul radiatif, delta ~+9.8)', DATA, CONST, { flux_in: flux_entrant_init, flux_out: flux_sortant_effectif_init, delta: delta_equilibre_init, bins, layers, epochId, T_cible_K });
    }
    // DATA['🧮']['🔬🌈'] et DATA['🧮']['🔬🫧'] déjà mis à jour par calculateFluxForT0
    DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_init;
    DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
    DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
    DATA['🧲']['🧲🌈🔼'] = flux_sortant_effectif_init;
    DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
    DATA['🧲']['🔺🧲'] = delta_equilibre_init;
    const bInit = DATA['📊'] && DATA['📊'].eds_breakdown;
    DATA['📛'] = bInit ? { '🧲📛': bInit.EDS_Wm2, '🍰📛🏭': bInit.CO2.pct, '🍰📛💧': bInit.H2O.pct, '🍰📛⛽': bInit.CH4.pct } : null;
    // Tolérance flux (W/m²) = 4σT³ × precision_K — à 2500K avec 1K : ~6e6 W/m² (pas 1)
    DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * EPOCH['🧲🔬'];

    DATA['🧮']['🧮☯'] = Math.sign(delta_equilibre_init);
    DATA['🧮']['🧮⚧'] = 'Search';
    DATA['🧮']['🧮🔄☀️'] = 0;
    updateConvergenceBounds();  // Bornes basées sur 🧮🌡️ et ☯ (pas sur 📅🌡️🧮)
    DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️'];
    DATA['🧮']['🧲🔺⏮'] = delta_equilibre_init;
    DATA['📅']['🔺⏳'] = 86400 * 10;

    // Init : snapshot INPUT (T avant increment), puis DATA = OUTPUT (T + increment)
    const incInit = computeSearchIncrement();
    const T_init_K = DATA['🧮']['🧮🌡️'];
    if (window.DEBUG_ANALYSE) {
        console.log('[Init][calculations_flux.js] T_K=' + T_init_K.toFixed(2) + ' T_C=' + (T_init_K - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ' delta=' + delta_equilibre_init.toFixed(2) + ' incInit=' + incInit.toFixed(4) + 'K next_T_C=' + (T_init_K + incInit - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ' albedo=' + DATA['🪩']['🍰🪩📿'].toFixed(3) + ' bounds=[' + (DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ',' + (DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ']');
    }
    if (window.DEBUG_ANALYSE_DETAIL && window.logDetailPremiersCalculs) {
        window.logDetailPremiersCalculs('Init (avant pas Search, delta=' + delta_equilibre_init.toFixed(2) + ')', DATA, CONST, { delta: delta_equilibre_init, epochId: DATA['📜'] && DATA['📜']['🗿'] ? DATA['📜']['🗿'] : '?', T_cible_K: EPOCH && EPOCH['🌡️🧮'] != null ? EPOCH['🌡️🧮'] : null });
    }
    DATA['🧮']['previous'].push({
        innerIter: -1,
        albedoIter: 0,
        waterIter: 0,
        phase: 'Init',
        temperature_K: T_init_K,
        temperature_C: T_init_K - CONST.KELVIN_TO_CELSIUS,
        delta_equilibre: delta_equilibre_init,
        albedo: DATA['🪩']['🍰🪩📿'],
        yinYang: Math.sign(delta_equilibre_init),
        next_T_C: T_init_K + incInit - CONST.KELVIN_TO_CELSIUS,
        data_snapshot: {
            '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
            '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
            '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
            '📛': DATA['📛'] ? JSON.parse(JSON.stringify(DATA['📛'])) : null
        }
    });
    DATA['🧮']['🧮🌡️'] = T_init_K + incInit;
    if (DATA['🧮']['🧮🔄🪩'] != null) DATA['🧮']['🧮🔄🪩']++; // Cycle eau s'incrémente à Init (premier cycle après = 1)
    try { window.displayConvergence(); } catch (e) { console.warn('displayConvergence:', e); }
    await new Promise(r => setTimeout(r, 0)); // Laisser le DOM et la console afficher Init

    const maxInnerIters = CONST.maxRadiatifIters;
    let innerConverged = false;
    DATA['🧮']['🧮🛑'] = null;
    let dichoSameDirCount = 0;
    let lastDichoSign = 0;
    while (DATA['🧮']['🧮🔄☀️'] < maxInnerIters && !innerConverged) {
        await new Promise(r => setTimeout(r, 0)); // Laisser le clic Stop être traité
        if (window.ABORT_COMPUTE) { DATA['🧮']['🧮🛑'] = 'abort'; return null; }
        DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * EPOCH['🧲🔬'];
        window.calculateH2OParameters();
        window.getEnabledStates();
        window.calculateAlbedo();
        // Snapshot cycle eau après calculateCloudFormationIndex : index affichage (0, 1, 2...)
        if (DATA['🧮']['🧮🔄🪩'] == null) DATA['🧮']['🧮🔄🪩'] = DATA['🧮']['🧮🔄🌊'];
        DATA['🧮']['previous'].push({
            innerIter: null,
            albedoIter: DATA['🧮']['🧮🔄🪩'],
            waterIter: DATA['🧮']['🧮🔄🌊'],
            phase: 'CycleEau',
            data_snapshot: {
                '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩']))
            }
        });
        window.calculateFluxForT0();
        window.calculateRadiativeCapacities();
        const spectral_result = window.getSpectralResultFromDATA();
        DATA['🧲']['🧲☀️🔽'] = window.calculateSolarFluxAbsorbed();
        DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
        DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
        DATA['🧲']['🧲🌈🔼'] = spectral_result.total_flux;
        DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
        DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
        const b = DATA['📊'] && DATA['📊'].eds_breakdown;
        DATA['📛'] = b ? { '🧲📛': b.EDS_Wm2, '🍰📛🏭': b.CO2.pct, '🍰📛💧': b.H2O.pct, '🍰📛⛽': b.CH4.pct } : null;
        if (window.DEBUG_ANALYSE) {
            const T_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
            const albedo = DATA['🪩']['🍰🪩📿'];
            const vapor = DATA['💧']['🍰🫧💧'] || 0;
            const cloudIdx = DATA['🪩']['☁️'];
            const co2_frac = DATA['🫧']['🍰🫧🏭'] || 0;
            const flux_in = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'];
            const flux_out = DATA['🧲']['🧲🌈🔼'];
            const delta = DATA['🧲']['🔺🧲'];
            const eds = DATA['📛'] ? DATA['📛']['🧲📛'] : null;
            const bounds = '[' + (DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ',' + (DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ']';
            if (window.DEBUG_ANALYSE_DETAIL && DATA['🧮']['🧮🔄☀️'] === 0 && window.logDetailPremiersCalculs) {
                const spectral = window.getSpectralResultFromDATA ? window.getSpectralResultFromDATA() : null;
                const bins = spectral && spectral.lambda_range ? spectral.lambda_range.length : null;
                const layers = spectral && spectral.z_range ? spectral.z_range.length : null;
                window.logDetailPremiersCalculs('CycleEau iter=0 (après T=17°C, delta ~+7)', DATA, CONST, { flux_in, flux_out, delta, bins, layers, epochId: DATA['📜'] && DATA['📜']['🗿'] ? DATA['📜']['🗿'] : '?', T_cible_K: EPOCH && EPOCH['🌡️🧮'] != null ? EPOCH['🌡️🧮'] : null });
                window._detailLogPhase = false;
            }
            const h2oScaleCyc = (typeof window.getH2OVaporEDSScale === 'function') ? window.getH2OVaporEDSScale().toFixed(3) : '?';
            console.log('[CycleEau][calculations_flux.js] iter=' + DATA['🧮']['🧮🔄☀️'] + ' phase=' + DATA['🧮']['🧮⚧'] + ' T_C=' + T_C.toFixed(1) + ' flux_in=' + flux_in.toFixed(2) + ' flux_out=' + flux_out.toFixed(2) + ' delta=' + delta.toFixed(2) + ' albedo=' + albedo.toFixed(3) + ' vapor=' + vapor.toExponential(2) + ' cloud=' + (cloudIdx != null ? cloudIdx.toFixed(3) : '?') + ' CO2_frac=' + co2_frac.toExponential(4) + ' bounds=' + bounds + ' tol=' + DATA['🧮']['🧲🔬'].toFixed(2) + ' EDS=' + (eds != null ? eds.toFixed(1) : '?') + ' H2O_scale=' + h2oScaleCyc);
        }
        // Phase AVANT mise à jour : pour affichage cohérent (phase utilisée pour le pas précédent)
        const phaseAtInput = DATA['🧮']['🧮⚧'];

        // Dicho : encadrer Δ=0. Δ=flux_entrant-flux_sortant : Δ>0→réchauffer(🔽=T), Δ<0→refroidir(🔼=T)
        if (DATA['🧮']['🧮⚧'] === 'Search' && DATA['🧮']['🧮🔄☀️'] > 0) {
            if (DATA['🧲']['🔺🧲'] > 0) {
                DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                if (DATA['🧮']['🧮🌡️🔼'] <= DATA['🧮']['🧮🌡️']) DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + 50;
            } else if (DATA['🧲']['🔺🧲'] < 0) {
                DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
                if (DATA['🧮']['🧮🌡️🔽'] >= DATA['🧮']['🧮🌡️']) DATA['🧮']['🧮🌡️🔽'] = Math.max(100, DATA['🧮']['🧮🌡️'] - 50);
            }
        }
        // ☯ = ancien signe(Δ). Passage en Dicho quand signe(Δ) change (Δ×☯<0). Affiché ☯ = signe(Δ) actuel (mis à jour en fin de boucle).
        const switchedToDicho = (DATA['🧮']['🧮☯'] !== 0 && DATA['🧲']['🔺🧲'] * DATA['🧮']['🧮☯'] < 0);
        if (switchedToDicho && window.DEBUG_ANALYSE) {
            console.log('[Search->Dicho][calculations_flux.js] iter=' + DATA['🧮']['🧮🔄☀️'] + ' T_C=' + (DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ' delta=' + DATA['🧲']['🔺🧲'].toFixed(2) + ' bounds=[' + (DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ',' + (DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ']');
        }
        if (switchedToDicho) {
            DATA['🧮']['🧮⚧'] = 'Dicho';
            dichoSameDirCount = 1;
            lastDichoSign = Math.sign(DATA['🧲']['🔺🧲']);
            // Convention 🔽 = min T, 🔼 = max T. Utiliser min/max pour éviter inversion selon sens du pas.
            const T_prev = DATA['🧮']['🧮🌡️⏮'];
            const T_curr = DATA['🧮']['🧮🌡️'];
            DATA['🧮']['🧮🌡️🔽'] = Math.min(T_prev, T_curr);
            DATA['🧮']['🧮🌡️🔼'] = Math.max(T_prev, T_curr);
        }
        DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️'];
        if (DATA['🧮']['🧮🔄☀️'] === 0) {
            DATA['🧮']['🧮⚧'] = 'Search';
            dichoSameDirCount = 0;
            lastDichoSign = 0;
        } else if (!switchedToDicho) {
            if (DATA['🧮']['🧮⚧'] === 'Dicho') {
                const signDelta = Math.sign(DATA['🧲']['🔺🧲']);
                if (signDelta === lastDichoSign) dichoSameDirCount++;
                else { dichoSameDirCount = 1; lastDichoSign = signDelta; }
                if (dichoSameDirCount >= 3) {
                    DATA['🧮']['🧮⚧'] = 'Search';
                    DATA['🧮']['🧮☯'] = signDelta;
                    // Hadéen (T>2000K) : expansion réduite (30 K) pour éviter oscillation
                    const expK = (DATA['🧮']['🧮🌡️'] > 2000) ? 30 : 50;
                    if (signDelta > 0) {
                        DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                        DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + expK;
                    } else {
                        DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
                        DATA['🧮']['🧮🌡️🔽'] = Math.max(100, DATA['🧮']['🧮🌡️'] - expK);
                    }
                    dichoSameDirCount = 0;
                    lastDichoSign = 0;
                }
            } else {
                DATA['🧮']['🧮☯'] = Math.sign(DATA['🧲']['🔺🧲']);
                dichoSameDirCount = 0;
                lastDichoSign = 0;
            }
            if (DATA['🧮']['🧮⚧'] !== 'Dicho') DATA['🧮']['🧮⚧'] = 'Search';
        }

        if (DATA['🧮']['🧮⚧'] === 'Search' && DATA['🧮']['🧮☯'] === 0) {
            DATA['🧮']['🧮🛑'] = 'crash';
            window.alert('Crash algo: ☯=0 en phase Search (Δ sans signe, direction impossible). Arrêt.');
            console.error('Crash algo: ☯=0 en phase Search');
            return null;
        }
        expandBracketIfInvalid();
        try { window.displayConvergence(); } catch (e) { console.warn('displayConvergence:', e); }
        await new Promise(r => setTimeout(r, 0)); // Laisser le DOM et la console à jour après chaque itération

        if (Math.abs(DATA['🧲']['🔺🧲']) <= DATA['🧮']['🧲🔬']) {
            innerConverged = true;
            DATA['🧮']['🧮🛑'] = 'converged';
            if (window.DEBUG_ANALYSE) {
                const T_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
                const eds = DATA['📛'] ? DATA['📛']['🧲📛'] : null;
                const co2Pct = DATA['📛'] ? DATA['📛']['🍰📛🏭'] : null;
                const h2oPct = DATA['📛'] ? DATA['📛']['🍰📛💧'] : null;
                const h2oScaleConv = (typeof window.getH2OVaporEDSScale === 'function') ? window.getH2OVaporEDSScale().toFixed(3) : '?';
                console.log('[CONVERGED][calculations_flux.js] iter=' + DATA['🧮']['🧮🔄☀️'] + ' T_C=' + T_C.toFixed(1) + ' flux_in=' + (DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽']).toFixed(2) + ' flux_out=' + DATA['🧲']['🧲🌈🔼'].toFixed(2) + ' delta=' + DATA['🧲']['🔺🧲'].toFixed(2) + ' albedo=' + DATA['🪩']['🍰🪩📿'].toFixed(3) + ' vapor=' + (DATA['💧']['🍰🫧💧'] != null ? DATA['💧']['🍰🫧💧'].toExponential(3) : '?') + ' EDS=' + (eds != null ? eds.toFixed(1) : '?') + ' CO2%=' + (co2Pct != null ? co2Pct.toFixed(1) : '?') + ' H2O%=' + (h2oPct != null ? h2oPct.toFixed(1) : '?') + ' H2O_scale=' + h2oScaleConv);
            }
            // Push état convergé pour cohérence affichage (sinon Arrêt montre Δ final non listé)
            const data_snapshot_conv = {
                '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
                '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                '📛': DATA['📛'] ? JSON.parse(JSON.stringify(DATA['📛'])) : null
            };
            const pushConv = {
                innerIter: DATA['🧮']['🧮🔄☀️'],
                albedoIter: DATA['🧮']['🧮🔄🪩'],
                waterIter: DATA['🧮']['🧮🔄🌊'],
                temperature_K: DATA['🧮']['🧮🌡️'],
                temperature_C: DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS,
                delta_equilibre: DATA['🧲']['🔺🧲'],
                phase: DATA['🧮']['🧮⚧'],
                albedo: DATA['🪩']['🍰🪩📿'],
                yinYang: DATA['🧮']['🧮☯'],
                data_snapshot: data_snapshot_conv
            };
            pushConv.next_T_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
            if (DATA['🧮']['🧮⚧'] === 'Dicho') {
                pushConv.dichoT_low_C = DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS;
                pushConv.dichoT_high_C = DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS;
            }
            DATA['🧮']['previous'].push(pushConv);
        }
        if (innerConverged) break;

        // Sauvegarder Δ à l'entrée (avant pas) pour push cohérent : afficher Δ@T_input, pas Δ@T_output
        DATA['🧮']['🧲🔺⏮'] = DATA['🧲']['🔺🧲'];

        // Phase utilisée pour ce pas (avant tout changement) : afficher phase réelle du pas, pas celle du suivant
        const phaseForStep = DATA['🧮']['🧮⚧'];

        // Calculer T_next AVANT de déplacer (pour snapshot cohérent : T, Δ, bounds, next_T)
        // Init : pas de déplacement (snapshot seul). Search/Dicho : déplacement ici (increment ou milieu bracket).
        let T_next_K = null;
        if (DATA['🧮']['🧮⚧'] === 'Search') {
            let increment = computeSearchIncrement();
            const T_curr_S = DATA['🧮']['🧮🌡️'];
            // Hadéen (T>2000K) : clamp explicite 80 K pour éviter oscillation (équilibre bande étroite)
            if (T_curr_S > 2000 && Math.abs(increment) > 80) increment = Math.sign(increment) * 80;
            T_next_K = T_curr_S + increment;
            // Garde : Δ>0 ⇒ T augmente, Δ<0 ⇒ T diminue (éviter T_next opposé au sens de Δ)
            if ((DATA['🧲']['🔺🧲'] > 0 && T_next_K < T_curr_S) || (DATA['🧲']['🔺🧲'] < 0 && T_next_K > T_curr_S)) {
                const incAbs = Math.abs(increment);
                T_next_K = DATA['🧲']['🔺🧲'] > 0 ? T_curr_S + incAbs : T_curr_S - incAbs;
            }
            if (window.CONFIG_COMPUTE.maxSearchT_K != null && T_next_K > window.CONFIG_COMPUTE.maxSearchT_K)
                T_next_K = window.CONFIG_COMPUTE.maxSearchT_K;
            DATA['🧮']['🧮🌡️'] = T_next_K;
        } else if (DATA['🧮']['🧮⚧'] === 'Dicho') {
            if (DATA['🧲']['🔺🧲'] > 0 && DATA['🧮']['🧮🌡️'] > DATA['🧮']['🧮🌡️🔽'] && DATA['🧮']['🧮🌡️'] < DATA['🧮']['🧮🌡️🔼'])
                DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
            else if (DATA['🧲']['🔺🧲'] < 0 && DATA['🧮']['🧮🌡️'] < DATA['🧮']['🧮🌡️🔼'] && DATA['🧮']['🧮🌡️'] > DATA['🧮']['🧮🌡️🔽'])
                DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
            T_next_K = (DATA['🧮']['🧮🌡️🔽'] + DATA['🧮']['🧮🌡️🔼']) / 2;
            // Garde : Δ>0 ⇒ T augmente, Δ<0 ⇒ T diminue (sinon bracket incohérent → forcer Search)
            const T_curr = DATA['🧮']['🧮🌡️'];
            if ((DATA['🧲']['🔺🧲'] > 0 && T_next_K < T_curr) || (DATA['🧲']['🔺🧲'] < 0 && T_next_K > T_curr)) {
                const inc = computeSearchIncrement();
                T_next_K = T_curr + inc;
            }
            DATA['🧮']['🧮🌡️'] = T_next_K;
        }
        const T_boil = window.getBoilingPointKFromPressure(DATA['🫧']['🎈']);
        const crosses = (DATA['🧮']['🧮🌡️⏮'] < CONST.T0_WATER && T_next_K >= CONST.T0_WATER) || (DATA['🧮']['🧮🌡️⏮'] >= CONST.T0_WATER && T_next_K < CONST.T0_WATER)
            || (DATA['🧮']['🧮🌡️⏮'] < T_boil && T_next_K >= T_boil) || (DATA['🧮']['🧮🌡️⏮'] >= T_boil && T_next_K < T_boil);
        if (crosses && T_next_K != null && Number.isFinite(T_next_K)) {
            const T_prev_K = DATA['🧮']['🧮🌡️⏮'];
            const T_crossing_C = T_next_K - CONST.KELVIN_TO_CELSIUS;
            DATA['🧮']['🧮🔄☀️']++;
            _oomLog('crossing', { T_prev: DATA['🧮']['🧮🌡️⏮'], T_next: T_next_K, T_boil });
            window.calculateH2OParameters();
            window.getEnabledStates();
            window.calculateAlbedo();
            window.calculateFluxForT0();
            window.calculateRadiativeCapacities();
            DATA['🧲']['🧲☀️🔽'] = window.calculateSolarFluxAbsorbed();
            DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
            DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
            DATA['🧲']['🧲🌈🔼'] = window.getSpectralResultFromDATA().total_flux;
            DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
            DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
            const bCross = DATA['📊'] && DATA['📊'].eds_breakdown;
            DATA['📛'] = bCross ? { '🧲📛': bCross.EDS_Wm2, '🍰📛🏭': bCross.CO2.pct, '🍰📛💧': bCross.H2O.pct, '🍰📛⛽': bCross.CH4.pct } : null;
            // Même bloc Dicho/bounds qu'en flux normal : sinon snapshot incohérent (☯, [🔽,🔼])
            if (DATA['🧮']['🧮⚧'] === 'Search' && DATA['🧮']['🧮🔄☀️'] > 0) {
            if (DATA['🧲']['🔺🧲'] > 0) {
                DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                if (DATA['🧮']['🧮🌡️🔼'] <= DATA['🧮']['🧮🌡️']) DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + 50;
            } else if (DATA['🧲']['🔺🧲'] < 0) {
                DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
                if (DATA['🧮']['🧮🌡️🔽'] >= DATA['🧮']['🧮🌡️']) DATA['🧮']['🧮🌡️🔽'] = Math.max(100, DATA['🧮']['🧮🌡️'] - 50);
            }
        }
            const switchedCross = (DATA['🧮']['🧮☯'] !== 0 && DATA['🧲']['🔺🧲'] * DATA['🧮']['🧮☯'] < 0);
            if (switchedCross) {
                const T_prev = DATA['🧮']['🧮🌡️⏮'];
                const T_curr = DATA['🧮']['🧮🌡️'];
                DATA['🧮']['🧮🌡️🔽'] = Math.min(T_prev, T_curr);
                DATA['🧮']['🧮🌡️🔼'] = Math.max(T_prev, T_curr);
            }
            // Crossing = changement d'état (0°C, T_boil) : toujours repasser en Search (nouveau régime eau)
            DATA['🧮']['🧮⚧'] = 'Search';
            DATA['🧮']['🧮☯'] = Math.sign(DATA['🧲']['🔺🧲']);
            dichoSameDirCount = 0;
            lastDichoSign = 0;
            expandBracketIfInvalid();
            if (window.DEBUG_ANALYSE) {
                console.log('[crossing][calculations_flux.js] T_cross_C=' + T_crossing_C.toFixed(1) + ' T_prev=' + (T_prev_K - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ' T_next=' + (T_next_K - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ' cycle=' + (DATA['🧮']['🧮🔄🪩'] != null ? DATA['🧮']['🧮🔄🪩'] : DATA['🧮']['🧮🔄🌊'] + 1) + ' delta=' + DATA['🧲']['🔺🧲'].toFixed(2) + ' albedo=' + DATA['🪩']['🍰🪩📿'].toFixed(3) + ' vapor=' + (DATA['💧']['🍰🫧💧'] != null ? DATA['💧']['🍰🫧💧'].toExponential(3) : '?'));
            }
            const data_snapshot = {
                '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
                '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                '📛': DATA['📛'] ? JSON.parse(JSON.stringify(DATA['📛'])) : null
            };
            const pushPayload = {
                innerIter: DATA['🧮']['🧮🔄☀️'] - 1,
                albedoIter: DATA['🧮']['🧮🔄🪩'],
                waterIter: DATA['🧮']['🧮🔄🌊'],
                temperature_K: T_prev_K,
                temperature_C: T_prev_K - CONST.KELVIN_TO_CELSIUS,
                delta_equilibre: (DATA['🧮']['🧲🔺⏮'] != null) ? DATA['🧮']['🧲🔺⏮'] : DATA['🧲']['🔺🧲'],
                phase: phaseForStep,
                albedo: DATA['🪩']['🍰🪩📿'],
                yinYang: DATA['🧮']['🧮☯'],
                data_snapshot
            };
            pushPayload.next_T_C = T_crossing_C;
            if (phaseForStep === 'Dicho') {
                pushPayload.dichoT_low_C = DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS;
                pushPayload.dichoT_high_C = DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS;
            }
            if (window.DEBUG_ANALYSE) {
                console.log('[crossing][calculations_flux.js] pushPayload phase=' + pushPayload.phase + ' T=' + pushPayload.temperature_C.toFixed(1) + '->' + pushPayload.next_T_C.toFixed(1) + ' delta=' + (pushPayload.delta_equilibre != null ? pushPayload.delta_equilibre.toFixed(2) : '?'));
            }
            DATA['🧮']['previous'].push(pushPayload);
            if (DATA['🧮']['🧮🔄🪩'] != null) DATA['🧮']['🧮🔄🪩']++;
            const isTboilCross = (T_prev_K < T_boil && T_next_K >= T_boil) || (T_prev_K >= T_boil && T_next_K < T_boil);
            const P_atm = DATA['🫧']['🎈'];
            // À P≈0 atm : pas de liquide, seul solide↔gaz (0°C) a un sens. T_boil=100°C serait faux.
            const T_transition_C = (P_atm < 0.01) ? 0 : (isTboilCross ? (T_boil - CONST.KELVIN_TO_CELSIUS) : 0);
            DATA['🧮']['previous'].push({
                innerIter: -0.5,
                albedoIter: DATA['🧮']['🧮🔄🪩'],
                waterIter: DATA['🧮']['🧮🔄🌊'],
                phase: 'CycleEauCrossing',
                cycleNum: DATA['🧮']['🧮🔄🪩'],
                temperature_C: T_crossing_C,
                T_transition_C,
                P_atm,
                data_snapshot: {
                    '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                    '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                    '🪩': JSON.parse(JSON.stringify(DATA['🪩']))
                }
            });
            const maxPrevious = window.CONFIG_COMPUTE.maxPreviousLength;
            if (DATA['🧮']['previous'].length > maxPrevious) DATA['🧮']['previous'].splice(0, DATA['🧮']['previous'].length - maxPrevious);
            window._lastH2OParamsCache = null;
            window._fromCrossing = true;
            try { window.displayConvergence(); } catch (e) { console.warn('displayConvergence:', e); }
            await new Promise(r => setTimeout(r, 0));
            if (DATA['🧮']['🧮🔄🌊'] >= maxWaterPass) {
                DATA['🧮']['🧮🛑'] = 'max_water';
                return true;
            }
            const cycleResult = window.cycleDeLeau ? await window.cycleDeLeau(false) : { changed: false };
            window.displayConvergence();
            await new Promise(r => setTimeout(r, 0));
            if (window.ABORT_COMPUTE) { DATA['🧮']['🧮🛑'] = 'abort'; return null; }
            DATA['🧮']['🧮🔄🌊']++;
            // Ne pas réinitialiser 🧮🔄🪩 : garder l'index monotone pour affichage
            // Pas de push CycleEau ici : CycleEauCrossing suffit (évite doublon "cycle 2" et T incohérente)
            continue;
        }
        // Arrêt si T inchangée (milieu bracket = T courante) ET convergé
        // Tolérance : |T - T_prev| < 0.01 K (éviter 39.3 vs 39.5°C considérés égaux par ===)
        const epsT_K = 0.01;
        if (Math.abs(DATA['🧮']['🧮🌡️'] - DATA['🧮']['🧮🌡️⏮']) < epsT_K) {
            if (Math.abs(DATA['🧲']['🔺🧲']) <= DATA['🧮']['🧲🔬']) innerConverged = true;
            else {
                if (window.DEBUG_ANALYSE) {
                    console.log('[T_blocked][calculations_flux.js] T inchangée delta=' + DATA['🧲']['🔺🧲'].toFixed(2) + ' tol=' + DATA['🧮']['🧲🔬'].toFixed(2) + ' -> élargir bracket');
                }
                // Bloqué sans convergence : élargir le bracket pour pouvoir bouger
                const mid = (DATA['🧮']['🧮🌡️🔽'] + DATA['🧮']['🧮🌡️🔼']) / 2;
                const eps = Math.max(0.5, (DATA['🧮']['🧮🌡️🔼'] - DATA['🧮']['🧮🌡️🔽']) * 0.5);
                if (DATA['🧲']['🔺🧲'] > 0) { DATA['🧮']['🧮🌡️🔽'] = mid; DATA['🧮']['🧮🌡️🔼'] = mid + eps; }
                else { DATA['🧮']['🧮🌡️🔼'] = mid; DATA['🧮']['🧮🌡️🔽'] = mid - eps; }
            }
        }
        DATA['🧮']['🧮🔄☀️']++;

        // Recalculer flux et Δ à la nouvelle T pour afficher (T_new, Δ_new) cohérent
        _oomLog('before calculateFluxForT0', { iter: DATA['🧮']['🧮🔄☀️'], T: DATA['🧮']['🧮🌡️'], previousLen: DATA['🧮']['previous'].length });
        window.calculateH2OParameters();
        window.getEnabledStates();
        window.calculateAlbedo();
        window.calculateFluxForT0();
        window.calculateRadiativeCapacities();
        const spectral_after = window.getSpectralResultFromDATA();
        DATA['🧲']['🧲☀️🔽'] = window.calculateSolarFluxAbsorbed();
        DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
        DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
        DATA['🧲']['🧲🌈🔼'] = spectral_after.total_flux;
        DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
        DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
        const bPost = DATA['📊'] && DATA['📊'].eds_breakdown;
        DATA['📛'] = bPost ? { '🧲📛': bPost.EDS_Wm2, '🍰📛🏭': bPost.CO2.pct, '🍰📛💧': bPost.H2O.pct, '🍰📛⛽': bPost.CH4.pct } : null;
        // Ne pas mettre à jour ☯ si changement de signe (Δ×☯<0) : garder ☯ pour détecter le passage en Dicho au tour suivant
        const signChangePost = (DATA['🧮']['🧮☯'] !== 0 && DATA['🧲']['🔺🧲'] * DATA['🧮']['🧮☯'] < 0);
        if (!signChangePost) DATA['🧮']['🧮☯'] = Math.sign(DATA['🧲']['🔺🧲']);
        // Sauvegarder ☯ avant mise à jour finale : pour push cohérent (☯ = ancien signe, celui qui a déclenché Dicho si switch)
        const yinYangForPush = DATA['🧮']['🧮☯'];

        // Mise à jour bornes Dicho/Search AVANT snapshot : sinon affichage [🔽,🔼] et next_T°C incorrects
        // (le bloc en début de boucle s'exécute avant le déplacement de T ; ici T et Δ sont à jour)
        if (DATA['🧮']['🧮⚧'] === 'Search' && DATA['🧮']['🧮🔄☀️'] > 0) {
            if (DATA['🧲']['🔺🧲'] > 0) {
                DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                if (DATA['🧮']['🧮🌡️🔼'] <= DATA['🧮']['🧮🌡️']) DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + 50;
            } else if (DATA['🧲']['🔺🧲'] < 0) {
                DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
                if (DATA['🧮']['🧮🌡️🔽'] >= DATA['🧮']['🧮🌡️']) DATA['🧮']['🧮🌡️🔽'] = Math.max(100, DATA['🧮']['🧮🌡️'] - 50);
            }
        }
        if (DATA['🧮']['🧮⚧'] === 'Dicho') {
            // Réduction du bracket (post-T) : T et Δ sont à la NOUVELLE T (après déplacement).
            // Δ>0 → 🔽=T (réchauffer) ; Δ<0 → 🔼=T (refroidir).
            // On peut mettre à jour les deux bornes dans la même itération : avant move (T_curr, Δ_curr)
            // puis après move (T_new, Δ_new) — ex: T=2409 Δ<0→🔼=2409, move→2218, Δ>0→🔽=2218.
            if (DATA['🧲']['🔺🧲'] > 0 && DATA['🧮']['🧮🌡️'] > DATA['🧮']['🧮🌡️🔽'] && DATA['🧮']['🧮🌡️'] < DATA['🧮']['🧮🌡️🔼'])
                DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
            else if (DATA['🧲']['🔺🧲'] < 0 && DATA['🧮']['🧮🌡️'] < DATA['🧮']['🧮🌡️🔼'] && DATA['🧮']['🧮🌡️'] > DATA['🧮']['🧮🌡️🔽'])
                DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
        }
        if (DATA['🧮']['🧮☯'] !== 0 && DATA['🧲']['🔺🧲'] * DATA['🧮']['🧮☯'] < 0) {
            DATA['🧮']['🧮⚧'] = 'Dicho';
            const T_prev = DATA['🧮']['🧮🌡️⏮'];
            const T_curr = DATA['🧮']['🧮🌡️'];
            DATA['🧮']['🧮🌡️🔽'] = Math.min(T_prev, T_curr);
            DATA['🧮']['🧮🌡️🔼'] = Math.max(T_prev, T_curr);
        }
        DATA['🧮']['🧮☯'] = Math.sign(DATA['🧲']['🔺🧲']);
        expandBracketIfInvalid();
        const data_snapshot = {
            '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
            '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
            '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
            '📛': DATA['📛'] ? JSON.parse(JSON.stringify(DATA['📛'])) : null
        };
        // T affichée = température d'entrée du calcul radiatif (avant le pas), pas la sortie
        const T_input_iter = DATA['🧮']['🧮🌡️⏮'];
        const pushPayload = {
            innerIter: DATA['🧮']['🧮🔄☀️'] - 1,
            albedoIter: DATA['🧮']['🧮🔄🪩'],
            waterIter: DATA['🧮']['🧮🔄🌊'],
            temperature_K: T_input_iter,
            temperature_C: T_input_iter - CONST.KELVIN_TO_CELSIUS,
            delta_equilibre: (DATA['🧮']['🧲🔺⏮'] != null) ? DATA['🧮']['🧲🔺⏮'] : DATA['🧲']['🔺🧲'],
            phase: phaseForStep,
            albedo: DATA['🪩']['🍰🪩📿'],
            yinYang: yinYangForPush,
            data_snapshot
        };
        if (phaseForStep === 'Dicho') {
            pushPayload.dichoT_low_C = DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS;
            pushPayload.dichoT_high_C = DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS;
        }
        // next_T_C = T atteinte par le pas (Search et Dicho)
        pushPayload.next_T_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
        if (window.DEBUG_ANALYSE) {
            const eds = DATA['📛'] ? DATA['📛']['🧲📛'] : null;
            const bounds = phaseForStep === 'Dicho' ? '[' + (DATA['🧮']['🧮🌡️🔽'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ',' + (DATA['🧮']['🧮🌡️🔼'] - CONST.KELVIN_TO_CELSIUS).toFixed(1) + ']' : '-';
            console.log('[Search/Dicho][calculations_flux.js] iter=' + (DATA['🧮']['🧮🔄☀️'] - 1) + ' phase=' + phaseForStep + ' T=' + pushPayload.temperature_C.toFixed(1) + '->' + pushPayload.next_T_C.toFixed(1) + ' delta=' + (pushPayload.delta_equilibre != null ? pushPayload.delta_equilibre.toFixed(2) : '?') + ' flux_in=' + (DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽']).toFixed(2) + ' flux_out=' + DATA['🧲']['🧲🌈🔼'].toFixed(2) + ' albedo=' + pushPayload.albedo.toFixed(3) + ' bounds=' + bounds + ' EDS=' + (eds != null ? eds.toFixed(1) : '?'));
        }
        DATA['🧮']['previous'].push(pushPayload);
        DATA['🧮']['🧮🔄🪩']++;
        const maxPrevious = window.CONFIG_COMPUTE.maxPreviousLength;
        if (DATA['🧮']['previous'].length > maxPrevious) DATA['🧮']['previous'].splice(0, DATA['🧮']['previous'].length - maxPrevious);
        _oomLog('after push', { previousLen: DATA['🧮']['previous'].length });
        await new Promise(r => setTimeout(r, 0)); // Yield pour afficher cette étape avant la suivante
    }
    if (!DATA['🧮']['🧮🛑']) DATA['🧮']['🧮🛑'] = 'max_iter';
    if (window.DEBUG_ANALYSE && DATA['🧮']['🧮🛑'] === 'max_iter') {
        const T_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
        console.log('[max_iter][calculations_flux.js] Non convergé iter=' + DATA['🧮']['🧮🔄☀️'] + ' T_C=' + T_C.toFixed(1) + ' delta=' + DATA['🧲']['🔺🧲'].toFixed(2) + ' tol=' + DATA['🧮']['🧲🔬'].toFixed(2));
    }
    return true;
}

// Exposer les fonctions globalement
// Note: getEpochDateConfig est déjà exposé dans compute.js
window.calculateT0 = calculateT0;
window.initForConfig = initForConfig;
window.cycleDeLeau = cycleDeLeau;
window.updateConvergenceBounds = updateConvergenceBounds;
window.computeRadiativeTransfer = computeRadiativeTransfer;
window.newDate = newDate;

