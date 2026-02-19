// ============================================================================
// File: static/compute/calculations_flux.js - Calculs de flux radiatif
// Desc: En français, dans l'architecture, je suis le module de calculs de flux radiatif
// Version 1.2.58
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
// - Tolérance flux : helper computeToleranceWm2 (source unique), borne min tolMinWm2
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
// - v1.2.39 : cycleDeLeau : guard _lastCycleRef undefined avant accès albedo/vapor (runComputeInParent crossing)
// - v1.2.42 : postMessage compute:progress iframe→parent pour actualiser organigramme (core_flux_wm, atm_height_km, h2o, albedo)
// - v1.2.43 : logEdsBreakdownWithScale() — log getH2OVaporEDSScale + répartition CO2/H2O/CH4% à chaque EDS breakdown
// - v1.2.44 : retrait logEdsBreakdownWithScale (verbeux) ; logConvergenceT() une seule fois à la convergence (T°C, albedo, flux, Δ, EDS %) ; CLOUD_LW_TAU_REF = 1 (calculations.js) selon lit. Stephens 1978 / Chylek 1982 — voir FORMULES_FLUX.md § τ nuages LW
// - v1.2.45 : commentaire arrêt convergence : 🔺🧲 = résidu (pas 0) ; 🧲🔬 = 4σT³×precision_K → plus T haute, plus tol grande → T cesse d’augmenter
// - v1.2.47 : updateAtmosphereHeightFromCurrentT() au début de chaque pas radiatif : même 📏🫧🧿 à 15,8°C en cold/warm start (Δ cohérent)
// - v1.2.48 : maxWaterAlbedoCyclesAtInit (5 par défaut) : converger météo à T_init avant premier flux pour même Δ qu'en cold start
// - v1.2.49 : data_snapshot Init/Search/Dicho/converged : ajout 🫧 (🍰🫧📿🌈) pour affichage correct dans debug (évite 0.000 vs 0.023–0.030)
// - v1.2.50 : reset _iceCoverageRampState dans initForConfig (nouveau run/epoch démarre sans inertie glace résiduelle)
// - v1.2.51 : initForConfig fixe _iceCoverageLock (🍰🪩🧊 initial) pour stabiliser Search sur bassin froid (waterPass=0)
// - v1.2.52 : reset _iceDurationBlendState/_iceEpochFixedState au début d'époque (glace d'époque recalculée une fois puis figée en solver)
// - v1.2.53 : spin-up climatologique paramétrable avant solver (climateSpinupCycles) avec snapshots CycleEau visibles
// - v1.2.54 : spin-up pondéré par quantités (⚖️🫧, ⚖️💧) pour neutralité corps noir sans if d'époque
// - v1.2.55 : initForConfig fixe _iceEpochFixedState en fin d'init (formule glace + override EPOCH.ice_fixed)
// - v1.2.56 : vérif cohérence glace (logs DATA vs EPOCH) ; continuité DATA par défaut, override epoch optionnel via config
// - v1.2.57 : continuité glace nettoyée physiquement (atm/eau/hautes terres) + log raw/effective pour éviter faux diagnostics
// - v1.2.58 : séparation verrous glace eau/albédo (_iceEpochFixedWaterState vs _iceEpochFixedAlbedoState) + log double
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

/** Log EDS breakdown + getH2OVaporEDSScale pour debug (valeur H₂O vs scale). */
/** Log unique à la convergence : 1) W/m² (flux in/out, Δ, EDS total + par composant) ; 2) T°C, albedo, % EDS. */
function logConvergenceT() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    if (!DATA || !DATA['🧮'] || !DATA['🧲']) return;
    const T_K = DATA['🧮']['🧮🌡️'];
    const T_C = (T_K - CONST.KELVIN_TO_CELSIUS).toFixed(2);
    const fluxIn = (DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽']).toFixed(2);
    const fluxOut = (DATA['🧲']['🧲🌈🔼']).toFixed(2);
    const delta = DATA['🧲']['🔺🧲'] != null ? DATA['🧲']['🔺🧲'].toFixed(3) : '—';
    const albedo = DATA['🪩'] && DATA['🪩']['🍰🪩📿'] != null ? (DATA['🪩']['🍰🪩📿'] * 100).toFixed(1) : '—';
    const b = DATA['📛'];
    const edsTotal = b && b['🧲📛'] != null ? b['🧲📛'] : 0;
    const co2Pct = b && b['🍰📛🏭'] != null ? (b['🍰📛🏭'] * 100).toFixed(1) : '—';
    const h2oPct = b && b['🍰📛💧'] != null ? (b['🍰📛💧'] * 100).toFixed(1) : '—';
    const ch4Pct = b && b['🍰📛⛽'] != null ? (b['🍰📛⛽'] * 100).toFixed(1) : '—';
    const cloudsPct = b && b['🍰📛⛅'] != null ? (b['🍰📛⛅'] * 100).toFixed(1) : '—';
    const co2Wm2 = b && b['🧲📛🏭'] != null ? Number(b['🧲📛🏭']).toFixed(2) : (b && b['🍰📛🏭'] != null ? (edsTotal * b['🍰📛🏭']).toFixed(2) : '—');
    const h2oWm2 = b && b['🧲📛💧'] != null ? Number(b['🧲📛💧']).toFixed(2) : (b && b['🍰📛💧'] != null ? (edsTotal * b['🍰📛💧']).toFixed(2) : '—');
    const ch4Wm2 = b && b['🧲📛⛽'] != null ? Number(b['🧲📛⛽']).toFixed(2) : (b && b['🍰📛⛽'] != null ? (edsTotal * b['🍰📛⛽']).toFixed(2) : '—');
    const cloudsWm2 = b && b['🧲📛⛅'] != null ? Number(b['🧲📛⛅']).toFixed(2) : (b && b['🍰📛⛅'] != null ? (edsTotal * b['🍰📛⛅']).toFixed(2) : '—');
    if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) {
        console.log('[convergence] T=' + T_C + '°C Δ=' + delta + ' EDS=' + edsTotal.toFixed(1) + ' CO2%=' + co2Pct + ' H2O%=' + h2oPct);
    }
    const deltaNum = DATA['🧲']['🔺🧲'] != null ? Number(DATA['🧲']['🔺🧲']) : NaN;
    if (Number.isFinite(deltaNum)) {
        const tol = DATA['🧮']['🧲🔬'];
        const sens = (tol != null && Math.abs(deltaNum) <= tol) ? 'équilibre (|Δ|≤tol)' : (deltaNum < 0 ? 'trop de sortie → refroidir' : (deltaNum > 0 ? 'pas assez de sortie → réchauffer' : 'équilibre'));
        if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) console.log('[convergence] ' + delta + ' ' + sens);
    }
}

/** Construit l'objet DATA['📛'] : EDS total (🧲📛), parts [0,1] (🍰📛❀), W/m² par composant (🧲📛❀). */
function buildEdsBreakdown(b) {
    if (!b || b.EDS_Wm2 == null) return null;
    const E = b.EDS_Wm2;
    const pCloud = b.Clouds != null ? b.Clouds.pct : 0;
    return {
        '🧲📛': E,
        '🍰📛🏭': b.CO2.pct,
        '🍰📛💧': b.H2O.pct,
        '🍰📛⛽': b.CH4.pct,
        '🍰📛⛅': pCloud,
        '🧲📛🏭': E * b.CO2.pct,
        '🧲📛💧': E * b.H2O.pct,
        '🧲📛⛽': E * b.CH4.pct,
        '🧲📛⛅': E * pCloud
    };
}

/** Snapshot 📛 pour output convergence (sans 🔺📛💧). */
function snapshotEdsForConvergence() {
    const DATA = window.DATA;
    if (!DATA['📛']) return null;
    const snap = JSON.parse(JSON.stringify(DATA['📛']));
    delete snap['🔺📛💧'];
    return snap;
}

/** Tolérance flux (W/m²) = max(4σT³×precision_K, tolMinWm2). Source unique, pas de duplication. */
function computeToleranceWm2(T_K, precision_K) {
    const CONST = window.CONST;
    const tolRaw = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(T_K, 3) * precision_K;
    const tolMin = (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.tolMinWm2 != null) ? window.CONFIG_COMPUTE.tolMinWm2 : 0.1;
    return Math.max(tolRaw, tolMin);
}

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
    DATA['🧮']['🧲🔬'] = computeToleranceWm2(DATA['🧮']['🧮🌡️'], EPOCH['🧲🔬']);
    
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
    if (!DATA || !window.TIMELINE) return false;
    if (!window.getSoleil() || !window.getNoyau()) return false;
    getEpochDateConfig();
    if (!calculateT0()) return false;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const epochId = DATA['📜']['🗿'];
    const T_solver_init = DATA['🧮']['🧮🌡️'];
    const T_epoch = EPOCH['🌡️🧮'] + DATA['📜']['🔺🌡️💫'] * DATA['📜']['📿💫'];
    const animEnabled = DATA['🔘'] && DATA['🔘']['🔘🎬'];
    // Mode anim : toujours garder T_solver_init (convergence depuis T° courante)
    // Mode sans anim : transition extrême → T réelle ; cas normal → T_epoch pour éviter régression
    if (animEnabled) {
        DATA['🧮']['🧮🌡️'] = T_solver_init;
    } else if (Math.abs(T_solver_init - T_epoch) > 20) {
        DATA['🧮']['🧮🌡️'] = T_solver_init;
    } else {
        DATA['🧮']['🧮🌡️'] = T_epoch;
    }
    window._iceDurationBlendState = null;
    window._iceEpochFixedState = null; // legacy
    window._iceEpochFixedWaterState = null;
    window._iceEpochFixedAlbedoState = null;
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
    // Verrou glaciaire pour tout le solver de cette époque
    const ice_data_raw = (DATA['💧'] && DATA['💧']['🍰💧🧊'] != null && Number.isFinite(DATA['💧']['🍰💧🧊']))
        ? DATA['💧']['🍰💧🧊']
        : 0;
    const highlands_max = (DATA['🗻'] && DATA['🗻']['🍰🗻🏔'] != null && Number.isFinite(DATA['🗻']['🍰🗻🏔']))
        ? Math.max(0, DATA['🗻']['🍰🗻🏔'])
        : 0;
    const hasAtmWaterSupport = (DATA['⚖️'] && DATA['⚖️']['⚖️🫧'] > 0 && DATA['⚖️']['⚖️💧'] > 0);
    const ice_data_continuity = hasAtmWaterSupport
        ? Math.max(0, Math.min(highlands_max, ice_data_raw))
        : 0;
    const ice_temp_factor = Math.max(0, (CONST.T_NO_POLAR_ICE_C + CONST.KELVIN_TO_CELSIUS - EPOCH['🌡️🧮']) / CONST.T_NO_POLAR_ICE_C);
    const ice_fixed_epoch = EPOCH['ice_fixed'];
    const ice_formula_epoch = Math.max(0, Math.min(highlands_max, 0.46 * ice_temp_factor));
    const useEpochOverride = window.CONFIG_COMPUTE.useEpochIceFixedOverride === true;
    const ice_fixed_value = (useEpochOverride && ice_fixed_epoch != null && Number.isFinite(ice_fixed_epoch))
        ? ice_fixed_epoch
        : ice_data_continuity;
    const albedo_ice_raw = (DATA['🪩'] && DATA['🪩']['🍰🪩🧊'] != null && Number.isFinite(DATA['🪩']['🍰🪩🧊']))
        ? DATA['🪩']['🍰🪩🧊']
        : ice_formula_epoch;
    const albedo_ice_effective = Math.max(0, Math.min(highlands_max, albedo_ice_raw));
    window._iceEpochFixedWaterState = {
        epochId: epochId,
        value: Math.max(0, Math.min(highlands_max, ice_fixed_value))
    };
    window._iceEpochFixedAlbedoState = {
        epochId: epochId,
        value: albedo_ice_effective
    };
    window._iceEpochFixedState = window._iceEpochFixedWaterState; // compat
    if (window.CONFIG_COMPUTE.logIceFixedDiagnostic) {
        console.log('[ice-lock] epoch=' + epochId
            + ' DATA_raw=' + ice_data_raw.toFixed(3)
            + ' DATA_effective=' + ice_data_continuity.toFixed(3)
            + ' ALBEDO_raw=' + albedo_ice_raw.toFixed(3)
            + ' ALBEDO_effective=' + albedo_ice_effective.toFixed(3)
            + ' EPOCH_ice_fixed=' + (ice_fixed_epoch != null && Number.isFinite(ice_fixed_epoch) ? Number(ice_fixed_epoch).toFixed(3) : 'n/a')
            + ' EPOCH_formula=' + ice_formula_epoch.toFixed(3)
            + ' highlands=' + highlands_max.toFixed(3)
            + ' atm_water=' + (hasAtmWaterSupport ? '1' : '0')
            + ' selected_water=' + window._iceEpochFixedWaterState.value.toFixed(3)
            + ' selected_albedo=' + window._iceEpochFixedAlbedoState.value.toFixed(3)
            + ' source=' + ((useEpochOverride && ice_fixed_epoch != null && Number.isFinite(ice_fixed_epoch)) ? 'EPOCH' : 'DATA'));
    }
    DATA['🧮']['🧮🌡️'] = T_solver_init;
    DATA['🧮']['🔬🌈'] = window.CONFIG_COMPUTE.maxSpectralBinsConvergence;
    window._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
    window._iceCoverageRampState = null;
    window._iceCoverageLock = {
        epochId: DATA['📜']['🗿'],
        value: DATA['🪩']['🍰🪩🧊']
    };
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

/** Calcule l'incrément Search (incTemp) en K.
 * Formule physique : ΔT = Δ/(4σT³) (linéarisation Stefan-Boltzmann, dF/dT = 4σT³).
 * Cap max : CONFIG_COMPUTE.maxSearchStepK (100 K). Si |Δ| > largeDeltaFactor×tol : maxSearchStepLargeK (150 K).
 * Hadéen (T>2000K) : cap 80 K pour éviter oscillation.
 */
function computeSearchIncrement() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const delta = DATA['🧲']['🔺🧲'];
    const T_K = DATA['🧮']['🧮🌡️'];
    const sigmaT3 = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(T_K, 3);
    let res = delta / sigmaT3;
    const tol = DATA['🧮']['🧲🔬'];
    let cap = window.CONFIG_COMPUTE.maxSearchStepK;
    if (Math.abs(delta) > window.CONFIG_COMPUTE.largeDeltaFactor * tol) {
        cap = window.CONFIG_COMPUTE.maxSearchStepLargeK;
    }
    cap = Math.min(window.CONFIG_COMPUTE.maxSearchStepLargeK, cap);
    if (Math.abs(res) > cap) res = Math.sign(res) * cap;
    return res;
}

/** Expansion du bracket quand 🔽 >= 🔼. Formule physique : ΔT = |Δ|/(4σT³). Exécuté quelle que soit la phase. */
function expandBracketIfInvalid() {
    const DATA = window.DATA;
    if (DATA['🧮']['🧮🌡️🔽'] < DATA['🧮']['🧮🌡️🔼']) return; // Bracket valide, rien à faire

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

async function cycleDeLeau(isFirst) {
    // OBLIGATOIRE : yield event loop pour que le bouton Stop soit cliquable pendant calcul long
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
    if (!window._lastCycleRef) {
        window._lastCycleRef = { albedo: DATA['🪩']['🍰🪩📿'], vapor: DATA['💧']['🍰🫧💧'] };
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
    if (currentWaterPass === 0) {
        window._fromCrossing = false;
        DATA['🧮']['🧮🔄🪩'] = 0;
    }

    // Spin-up climatologique : cycles fixes eau/albédo avant solver, visibles dans la scie CycleEau.
    // Objectif : converger météo locale (vapeur/nuages/albédo) avec glace verrouillée avant la boucle radiative.
    const climateSpinupCycles = (window.CONFIG_COMPUTE.climateSpinupCycles != null && Number.isFinite(window.CONFIG_COMPUTE.climateSpinupCycles))
        ? Math.max(0, Math.floor(window.CONFIG_COMPUTE.climateSpinupCycles))
        : 0;
    const atmMassRef = (window.CONFIG_COMPUTE.climateSpinupAtmMassRefKg != null && Number.isFinite(window.CONFIG_COMPUTE.climateSpinupAtmMassRefKg))
        ? Math.max(1, window.CONFIG_COMPUTE.climateSpinupAtmMassRefKg)
        : 1.0e18;
    const waterMassRef = (window.CONFIG_COMPUTE.climateSpinupWaterMassRefKg != null && Number.isFinite(window.CONFIG_COMPUTE.climateSpinupWaterMassRefKg))
        ? Math.max(1, window.CONFIG_COMPUTE.climateSpinupWaterMassRefKg)
        : 1.0e20;
    const atmMass = (DATA['⚖️'] && DATA['⚖️']['⚖️🫧'] != null && Number.isFinite(DATA['⚖️']['⚖️🫧'])) ? Math.max(0, DATA['⚖️']['⚖️🫧']) : 0;
    const waterMass = (DATA['⚖️'] && DATA['⚖️']['⚖️💧'] != null && Number.isFinite(DATA['⚖️']['⚖️💧'])) ? Math.max(0, DATA['⚖️']['⚖️💧']) : 0;
    const spinupWeightAtm = Math.max(0, Math.min(1, atmMass / atmMassRef));
    const spinupWeightWater = Math.max(0, Math.min(1, waterMass / waterMassRef));
    const climateSpinupCyclesEffective = Math.max(0, Math.round(climateSpinupCycles * spinupWeightAtm * spinupWeightWater));
    const maxWaterAlbedoAtInit = (window.CONFIG_COMPUTE.maxWaterAlbedoCyclesAtInit != null) ? window.CONFIG_COMPUTE.maxWaterAlbedoCyclesAtInit : 1;
    if (currentWaterPass === 0) {
        if (climateSpinupCyclesEffective > 0) {
            const phasePrevSpinup = DATA['🧮']['🧮⚧'];
            DATA['🧮']['🧮⚧'] = 'Search';
            for (let w = 0; w < climateSpinupCyclesEffective; w++) {
                await window.cycleDeLeau(false);
                const T_C_init = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
                if (window.CONFIG_COMPUTE.logEdsDiagnostic) console.log('[spinup] CycleEau #' + (w + 1) + ' @' + T_C_init.toFixed(1) + '°C');
                DATA['🧮']['previous'].push({
                    innerIter: null,
                    albedoIter: w,
                    waterIter: 0,
                    phase: 'CycleEau',
                    data_snapshot: {
                        '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
                        '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                        '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                        '🪩': JSON.parse(JSON.stringify(DATA['🪩']))
                    }
                });
                if (window.ABORT_COMPUTE) return null;
            }
            DATA['🧮']['🧮⚧'] = phasePrevSpinup;
        } else {
            for (let w = 0; w < maxWaterAlbedoAtInit; w++) {
                const resInit = await window.cycleDeLeau(false);
                const T_C_init = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
                if (window.CONFIG_COMPUTE.logEdsDiagnostic) console.log('[cycle] Init @' + T_C_init.toFixed(1) + '°C');
                DATA['🧮']['previous'].push({
                    innerIter: null,
                    albedoIter: w,
                    waterIter: 0,
                    phase: 'CycleEau',
                    data_snapshot: {
                        '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
                        '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                        '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                        '🪩': JSON.parse(JSON.stringify(DATA['🪩']))
                    }
                });
                if (!resInit.changed) break;
                if (window.ABORT_COMPUTE) return null;
            }
        }
    }

    if (currentWaterPass > 0 && (currentWaterPass > 1 || !window._fromCrossing)) {
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
    // DATA['🧮']['🔬🌈'] et DATA['🧮']['🔬🫧'] déjà mis à jour par calculateFluxForT0
    DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_init;
    DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
    DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
    DATA['🧲']['🧲🌈🔼'] = flux_sortant_effectif_init;
    DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
    // À l'équilibre TOA : flux_entrant = flux_sortant ⇒ 🔺🧲 ≈ 0 ; sinon 🧲🌈🔼 (OLR) ou flux solaire incohérent. Voir doc/SENS_CONVERGENCE_ET_VALEURS.md §2.1.
    DATA['🧲']['🔺🧲'] = delta_equilibre_init;
    const h2oScale = window.getH2OVaporEDSScale();
    const bins = DATA['🧮']['🔬🌈'];
    const nLayers = DATA['🧮']['🔬🫧'];
    const deltaZ = (DATA['📊'] && DATA['📊'].delta_z != null) ? DATA['📊'].delta_z : '—';
    if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) console.log('[Init] OLR=' + flux_sortant_effectif_init.toFixed(2) + ' Δ=' + delta_equilibre_init.toFixed(2));
    const bInit = DATA['📊'] && DATA['📊'].eds_breakdown;
    DATA['📛'] = buildEdsBreakdown(bInit);
    if (DATA['📛']) window.calculateH2OGreenhouseForcing();
    DATA['🧮']['🧲🔬'] = computeToleranceWm2(DATA['🧮']['🧮🌡️'], EPOCH['🧲🔬']);

    DATA['🧮']['🧮☯'] = Math.sign(delta_equilibre_init);
    DATA['🧮']['🧮⚧'] = 'Search';
    DATA['🧮']['🧮🔄☀️'] = 0;
    updateConvergenceBounds();  // Bornes basées sur 🧮🌡️ et ☯ (pas sur 📅🌡️🧮)
    DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️'];
    DATA['🧮']['🧲🔺⏮'] = delta_equilibre_init;
    DATA['📅']['🔺⏳'] = 86400 * 10;
    DATA['🧮']['🧮🛑'] = ''; // Réinit pour que le snapshot Init n'affiche pas l'ancien 'converged'

    // Init : snapshot INPUT (T avant increment), puis DATA = OUTPUT (T + increment)
    const incInit = computeSearchIncrement();
    const T_init_K = DATA['🧮']['🧮🌡️'];
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
            '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
            '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
            '📛': snapshotEdsForConvergence()
        }
    });
    if (Number.isFinite(delta_equilibre_init)) {
        const sensInit = delta_equilibre_init < 0 ? 'trop de sortie → refroidir' : (delta_equilibre_init > 0 ? 'pas assez de sortie → réchauffer' : 'équilibre');
        if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) console.log('[Init] ' + sensInit);
    }
    DATA['🧮']['🧮🌡️'] = T_init_K + incInit;
    if (DATA['🧮']['🧮🔄🪩'] != null) DATA['🧮']['🧮🔄🪩']++; // Cycle eau s'incrémente à Init (premier cycle après = 1)
    try { window.displayConvergence(); } catch (e) { console.warn('displayConvergence:', e); }
    await new Promise(r => setTimeout(r, 0)); // Laisser le DOM et la console afficher Init

    const maxInnerIters = window.CONFIG_COMPUTE.maxRadiatifIters;
    let innerConverged = false;
    DATA['🧮']['🧮🛑'] = null;
    let dichoSameDirCount = 0;
    let lastDichoSign = 0;
    while (DATA['🧮']['🧮🔄☀️'] < maxInnerIters && !innerConverged) {
        await new Promise(r => setTimeout(r, 0)); // Laisser le clic Stop être traité
        if (window.ABORT_COMPUTE) { DATA['🧮']['🧮🛑'] = 'abort'; return null; }
        // Mettre à jour hauteur atmosphère (📏🫧🧿, 📏🫧🛩) depuis T courante : même grille verticale à 15,8°C en cold/warm start
        window.updateAtmosphereHeightFromCurrentT();
        DATA['🧮']['🧲🔬'] = computeToleranceWm2(DATA['🧮']['🧮🌡️'], EPOCH['🧲🔬']);
        // Météo : 2 ou N cycles eau/albédo par pas radiatif ; un snapshot CycleEau par cycle pour affichage
        const maxWaterAlbedo = (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.maxWaterAlbedoCyclesPerStep != null) ? window.CONFIG_COMPUTE.maxWaterAlbedoCyclesPerStep : 1;
        if (maxWaterAlbedo <= 1) {
            window.calculateH2OParameters();
            window.getEnabledStates();
            window.calculateAlbedo();
            if (DATA['🧮']['🧮🔄🪩'] == null) DATA['🧮']['🧮🔄🪩'] = DATA['🧮']['🧮🔄🌊'];
            const T_C_oneStep = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
            const albedoOneStep = (DATA['🪩']['🍰🪩📿'] != null) ? (DATA['🪩']['🍰🪩📿'] * 100).toFixed(2) : '-';
            const h2oOneStep = (DATA['💧']['🍰🫧💧'] != null) ? (DATA['💧']['🍰🫧💧'] * 100).toFixed(2) : '-';
            if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) console.log('[cycle] radiatif @' + T_C_oneStep.toFixed(1) + '°C');
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
        } else {
            const baseAlbedoIter = (DATA['🧮']['🧮🔄🪩'] != null ? DATA['🧮']['🧮🔄🪩'] : 0) * maxWaterAlbedo;
            for (let w = 0; w < maxWaterAlbedo; w++) {
                const res = await window.cycleDeLeau(false);
                const T_C_step = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
                const albedoPctStep = (DATA['🪩']['🍰🪩📿'] != null) ? (DATA['🪩']['🍰🪩📿'] * 100).toFixed(2) : '-';
                const h2oPctStep = (DATA['💧']['🍰🫧💧'] != null) ? (DATA['💧']['🍰🫧💧'] * 100).toFixed(2) : '-';
                if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) console.log('[cycle] radiatif w=' + w + ' @' + T_C_step.toFixed(1) + '°C');
                DATA['🧮']['previous'].push({
                    innerIter: null,
                    albedoIter: baseAlbedoIter + w,
                    waterIter: DATA['🧮']['🧮🔄🌊'],
                    phase: 'CycleEau',
                    data_snapshot: {
                        '🧮': { '🧮🌡️': DATA['🧮']['🧮🌡️'] },
                        '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                        '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                        '🪩': JSON.parse(JSON.stringify(DATA['🪩']))
                    }
                });
                if (!res.changed) break;
                if (window.ABORT_COMPUTE) { DATA['🧮']['🧮🛑'] = 'abort'; return null; }
            }
        }
        window.calculateFluxForT0();
        window.calculateRadiativeCapacities();
        const spectral_result = window.getSpectralResultFromDATA();
        DATA['🧲']['🧲☀️🔽'] = window.calculateSolarFluxAbsorbed();
        DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
        DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
        DATA['🧲']['🧲🌈🔼'] = spectral_result.total_flux;
        DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
        // 🔺🧲 = entrant − sortant ; équilibre ⇒ ≈ 0. Si |🔺🧲| > tol mais converged, vérifier tol ou état affiché (doc §2.1).
        DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
        const b = DATA['📊'] && DATA['📊'].eds_breakdown;
        DATA['📛'] = buildEdsBreakdown(b);
        if (DATA['📛']) window.calculateH2OGreenhouseForcing();
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

        // Arrêt quand |Δ| ≤ tol : 🔺🧲 = résidu (pas 0). 🧲🔬 = max(4σT³×precision_K, tolMinWm2) → plus T est haute, plus tol est grande → on accepte un résidu plus grand et la T° cesse d’augmenter.
        if (Math.abs(DATA['🧲']['🔺🧲']) <= DATA['🧮']['🧲🔬']) {
            innerConverged = true;
            DATA['🧮']['🧮🛑'] = 'converged';
            // Push état convergé pour cohérence affichage (sinon Arrêt montre Δ final non listé)
            const data_snapshot_conv = {
                '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
                '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                '📛': snapshotEdsForConvergence()
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
            logConvergenceT(); // Log unique à la convergence pour régler T° (cible ~15°C)
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
            const increment = computeSearchIncrement();
            const T_curr_S = DATA['🧮']['🧮🌡️'];
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
            DATA['📛'] = buildEdsBreakdown(bCross);
            if (DATA['📛']) window.calculateH2OGreenhouseForcing();
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
            const data_snapshot = {
                '🧮': (() => { const d = { ...DATA['🧮'] }; delete d.previous; return JSON.parse(JSON.stringify(d)); })(),
                '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
                '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                '📛': snapshotEdsForConvergence()
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
                // Bloqué sans convergence : élargir le bracket pour pouvoir bouger
                const mid = (DATA['🧮']['🧮🌡️🔽'] + DATA['🧮']['🧮🌡️🔼']) / 2;
                const eps = Math.max(0.5, (DATA['🧮']['🧮🌡️🔼'] - DATA['🧮']['🧮🌡️🔽']) * 0.5);
                if (DATA['🧲']['🔺🧲'] > 0) { DATA['🧮']['🧮🌡️🔽'] = mid; DATA['🧮']['🧮🌡️🔼'] = mid + eps; }
                else { DATA['🧮']['🧮🌡️🔼'] = mid; DATA['🧮']['🧮🌡️🔽'] = mid - eps; }
            }
        }
        DATA['🧮']['🧮🔄☀️']++;

        // Recalculer flux et Δ à la nouvelle T pour afficher (T_new, Δ_new) cohérent (météo : 2 ou 4 cycles si config)
        const maxWaterAlbedoPost = (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.maxWaterAlbedoCyclesPerStep != null) ? window.CONFIG_COMPUTE.maxWaterAlbedoCyclesPerStep : 1;
        if (maxWaterAlbedoPost <= 1) {
            window.calculateH2OParameters();
            window.getEnabledStates();
            window.calculateAlbedo();
        } else {
            for (let w = 0; w < maxWaterAlbedoPost; w++) {
                const resPost = await window.cycleDeLeau(false);
                if (!resPost.changed) break;
                if (window.ABORT_COMPUTE) { DATA['🧮']['🧮🛑'] = 'abort'; return null; }
            }
        }
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
        DATA['📛'] = buildEdsBreakdown(bPost);
        if (DATA['📛']) window.calculateH2OGreenhouseForcing();
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
            '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
            '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
            '📛': snapshotEdsForConvergence()
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
        DATA['🧮']['previous'].push(pushPayload);
        DATA['🧮']['🧮🔄🪩']++;
        const maxPrevious = window.CONFIG_COMPUTE.maxPreviousLength;
        if (DATA['🧮']['previous'].length > maxPrevious) DATA['🧮']['previous'].splice(0, DATA['🧮']['previous'].length - maxPrevious);

        var payload = { iteration: DATA['🧮']['🧮🔄☀️'] - 1, T0: DATA['🧮']['🧮🌡️'], total_flux: spectral_result.total_flux, phase: phaseForStep };
        if (window.CO2_EVENTS) {
            window.CO2_EVENTS.emit('compute:progress', payload);
        }
        var showSteps = window.showDichotomySteps && window.isVisuPanelActive();
        if (showSteps) {
            window.displayDichotomyStep(DATA['🫧']['🍰🫧🏭'], DATA['🧮']['🧮🌡️'], spectral_result, DATA['🧮']['🧮🔄☀️'] - 1, false);
            await new Promise(function (resolve) {
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        setTimeout(resolve, 50);
                    });
                });
            });
        } else {
            var h2o_frac = (DATA['💧'] && DATA['💧']['🍰🫧💧'] != null) ? DATA['💧']['🍰🫧💧'] : 0;
            var h2o_meteorites = (typeof window.h2oTotalFromMeteorites !== 'undefined') ? window.h2oTotalFromMeteorites : 0;
            var h2oVaporPercent = Math.min(100, Math.max(0, h2o_frac * 100 + h2o_meteorites));
            window.h2oVaporPercent = h2oVaporPercent;
            if (window.plotData) {
                window.plotData.ch4_ppm = (DATA['🫧']['🍰🫧⛽'] != null ? DATA['🫧']['🍰🫧⛽'] : 0) * 1e6;
            }
            DATA['📊'] = DATA['📊'] || {};
            DATA['📊'].total_flux = spectral_result.total_flux;
            if (window !== window.top) {
                var dataSubset = { '🧮': DATA['🧮'], '🪩': DATA['🪩'], '🫧': DATA['🫧'], '💧': DATA['💧'], '📛': snapshotEdsForConvergence(), '📜': DATA['📜'], '📊': DATA['📊'] };
                window.parent.postMessage({ type: 'cycleCalcul', DATA: dataSubset, h2oVaporPercent: window.h2oVaporPercent }, '*');
            }
            if (window.CO2_EVENTS) window.CO2_EVENTS.emit('cycleCalcul');
            if (typeof window.updateFluxLabels === 'function') {
                window.updateFluxLabels('cycleCalcul');
            }
            await new Promise(r => setTimeout(r, 0));
        }
    }
    if (!DATA['🧮']['🧮🛑']) DATA['🧮']['🧮🛑'] = 'max_iter';
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
window.snapshotEdsForConvergence = snapshotEdsForConvergence;

