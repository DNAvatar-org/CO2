// File: CO2/static/compute/visu_/visu_dichotomie.js
// Desc: Dessin des pas de convergence dans la visu (displayDichotomyStep) et ANCIEN solveur par dichotomie
//       (simulateRadiativeTransfer, finalizeResults*), sortis du moteur le 2026-10-10 : c'est du DOM et de
//       l'affichage, pas de la physique. simulateRadiativeTransfer double le solveur du moteur
//       (API_BILAN/convergence/calculations_flux.js) ; ses 3 appelants (ui/main.js) lui passent des arguments
//       qu'il ne lit pas. Code DÉPLACÉ tel quel — à purger / supprimer dans la passe UI.
//       Utilise les fonctions globales du moteur (calculateFluxForT0, temperatureAtZ…) : chargé APRÈS lui.
// Version 1.0.0
// Date: 2026-10-10
// Copyright 2026 DNAvatar.org - Arnaud Maignan

'use strict';

// Fonction helper pour afficher une courbe temporaire pendant la dichotomie
function displayDichotomyStep(CO2_fraction, T0_test, result, iteration, isInitial = false, options = {}) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    // Récupérer H2O et CH4 pour le log
    // 🔒 CORRECTION : Utiliser DATA['💧']['🍰🫧💧'] comme source unique de vérité
    const h2o_total = DATA['💧']['🍰🫧💧'] * 100; // Fraction → %
    const ch4_ppm = (options && options.CH4_fraction != null) ? options.CH4_fraction * 1e6 : (DATA['🫧']['🍰🫧🐄'] != null ? DATA['🫧']['🍰🫧🐄'] * 1e6 : 0);
    
    // Log supprimé : affichage uniquement du mode (dichotomie/exponentielle) dans la boucle principale
    // if (iteration === 0 || isInitial) {
    //     console.log(`📛 [displayDichotomyStep@calculations.js] iter=${iteration} T0=${T0_test.toFixed(2)}K 🏭=${(CO2_fraction * 1e6).toFixed(0)}ppm 💧=${h2o_total.toFixed(1)}% 🐄=${ch4_ppm.toFixed(0)}ppm`);
    // }
    if (typeof window === 'undefined') return;

    // Créer un objet plotData temporaire pour l'affichage
    // ✅ SCIENTIFIQUEMENT CERTAIN : Loi de Stefan-Boltzmann T = (F/σ)^(1/4)
    // - Cette loi décrit la température effective d'un corps noir en équilibre radiatif
    // - Dérivée de la loi de Planck, elle est exacte pour un corps noir
    // - La constante σ = 5.67×10⁻⁸ W/(m²·K⁴) est une constante fondamentale
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;

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
    const h2o_enabled = true;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const geo_flux = DATA['🌕']['🧲🌕'];   // flux intérieur : UNE source (geology/interieur.js)
    const ch4_enabled = true;
    const CH4_fraction = DATA['🫧']['🍰🫧🐄'];

    // ⚠️ CAS PARTICULIER : Corps noir (pas d'atmosphère, albedo = 0)
    //   → Pas d'effet de serre, donc temp_surface = effective_temperature
    //   → Le flux émis par la surface passe directement vers l'espace sans absorption
    //   → On utilise temp_surface directement pour éviter les erreurs numériques
    const isBlackBody = (CO2_fraction === 0 || CO2_fraction === null) && !h2o_enabled && (!ch4_enabled || !CH4_fraction);
    const temp_eff = isBlackBody
        ? T0_test  // Corps noir : utiliser directement temp_surface (formule analytique exacte)
        : Math.pow(result.total_flux / STEFAN_BOLTZMANN, 0.25);  // Avec atmosphère : calculer depuis flux_total
    // Calculer la température terrestre en °C à partir de T0_test (température au sol en K)
    const temp_surface_c = T0_test - CONST.KELVIN_TO_CELSIUS;
    const temp_eff_0 = 255.0; // Température effective sans CO2 (référence 255K)
    const albedo = result.albedo;
    const cloud_coverage = result.cloud_coverage;

    // Convention affichage uniquement (pas utilisé dans le calcul radiatif) : ΔF CO2/H2O/albedo pour labels.
    const forcing_CO2 = window.CLIMATE.calculateCO2Forcing(CO2_fraction);
    const forcing_H2O = window.CLIMATE.calculateH2OForcing(h2o_enabled, cloud_coverage);
    const forcing_Albedo = (albedo !== null) ? window.CLIMATE.calculateAlbedoForcing(albedo) : 0;

    // Forçage total (affichage)
    const forcing_total = forcing_CO2 + forcing_H2O + forcing_Albedo;

    // Calculer ΔT° = différence de température par rapport à la référence (255K sans CO2)
    // ΔT° = T° actuelle - T° référence (255K)
    // C'est la différence directe de température, plus claire et compréhensible
    const TEMP_REF_NO_CO2 = 255.0; // Température effective sans CO2 (référence)
    const delta_temp = T0_test - TEMP_REF_NO_CO2;

    // Zone habitable (affichage uniquement)
    const TEMP_HABITABLE_OPTIMAL = 288; // 15°C
    const TEMP_HABITABLE_MIN = 253;    // ~ -20°C
    const TEMP_HABITABLE_MAX = 323;    // ~ 50°C
    const delta_temp_habitable = T0_test - TEMP_HABITABLE_OPTIMAL;
    const life_viable = T0_test >= TEMP_HABITABLE_MIN && T0_test <= TEMP_HABITABLE_MAX;

    // Mettre à jour les informations à chaque étape
    window.updateDisplay({
            state: window.currentState, // Plantera si n'existe pas
            co2_ppm: CO2_fraction * 1e6,
            temp_surface: T0_test,
            temp_surface_c: temp_surface_c,
            temp_eff: temp_eff,
            temp_eff_c: temp_eff - CONST.KELVIN_TO_CELSIUS,
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

    // Mettre à jour les labels du flux pendant le calcul : écrire albedo/cloud dans DATA pour que updateFluxLabels (cycleCalcul) mette à jour le DOM (albedo_percent, etc.)
    DATA['📊'] = DATA['📊'] || {};
    DATA['📊'].total_flux = result.total_flux;
    if (DATA['🪩']) {
        if (albedo != null) {
            DATA['🪩']['🍰🪩📿'] = window.ALBEDO.applyVeilToPlanetaryAlbedo01(albedo);
        } else if (albedo != null) {
            DATA['🪩']['🍰🪩📿'] = albedo;
        }
        if (cloud_coverage != null) DATA['🪩']['☁️'] = cloud_coverage;
    }
    if (window.IO_LISTENER) window.IO_LISTENER.emit('cycleCalcul');
    const fpsOk = (window.RUNTIME_STATE.fps >= window.UI_STATE.FPSalert);
    if (fpsOk) {
        window.ORG.updateFluxLabels('cycleCalcul');
    }

    // 🔒 Mettre à jour la couleur avec la température actuelle (à chaque étape de dichotomie)
    const color_current = window.PLOT.tempSurfaceToColor(temp_surface_c);
    window.updateBlackBodyColor(color_current);
    const legendEquilibre = document.querySelector('.legend-equilibre');
    if (legendEquilibre) legendEquilibre.style.color = color_current;

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
            _cycleToken: iteration,
            albedo: albedo,
            cloud_coverage: cloud_coverage
        },
        co2_ppm: CO2_fraction * 1e6,
        temp_surface: T0_test, // Température de surface réelle (K) pour cohérence avec affichage
        temp_surface_c: temp_surface_c // Température de surface en °C pour mise à jour de la couleur en temps réel
    };

    // Courbe à chaque cycle (toujours mettre à jour)
    window.PLOT.updatePlot(tempPlotData);
    if (typeof window.updateLegend === 'function') {
        window.updateLegend(tempPlotData);
    }

    // Visualisation spectrale à chaque cycle: appel direct (pas d'event bus, pas de file setTimeout)
    const canvas = document.getElementById('spectral-visualization');
    if (canvas) {
        canvas.style.setProperty('display', 'block', 'important');
        canvas.style.setProperty('visibility', 'visible', 'important');
        canvas.style.setProperty('opacity', '1', 'important');
        canvas.style.setProperty('z-index', '0', 'important');
        canvas.style.setProperty('position', 'absolute', 'important');
    }
    /*
     * ================================================================
     * ACK OBLIGATOIRE du bridge plot
     * ================================================================
     * displayDichotomyStep() est le point où l'UI a effectivement :
     * - mis à jour les courbes
     * - lancé le draw spectral du cycle courant
     *
     * Le calcul amont (calculations_flux.js) attend explicitement
     * IO_LISTENER.emit('plot:drawn', { iteration }) avec la même iteration.
     *
     * NE PAS supprimer cet emit.
     * NE PAS le déplacer avant updateSpectralVisualization().
     * Sinon le calcul repart trop tôt et les flux intermédiaires
     * se recompactent à la fin au lieu d'apparaître cycle par cycle.
     * ================================================================
     */
    if (tempPlotData.current) window.PLOT.updateSpectralVisualization(tempPlotData.current);
    window.IO_LISTENER.emit('plot:drawn', { iteration: iteration });

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

async function simulateRadiativeTransfer() {
    const DATA = window.DATA;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    
    const CO2_fraction = DATA['🫧']['🍰🫧🏭'];
    const CH4_fraction = DATA['🫧']['🍰🫧🐄'];
    
    const t0_config = EPOCH['🌡️🧮'];
    const animEnabled = window.SYNC_STATE.animEnabled;
    // En mode anim : partir de la T0 actuelle du modèle (DATA = source unique, pas plotData)
    // En mode normal : partir de la T0 de référence de l'époque
    const baseTemp = animEnabled ? DATA['🧮']['🧮🌡️'] : t0_config;
    
    const meteoriteCount = DATA['📜']['📿☄️'];
    const ticTime = DATA['📜']['📿💫'];
    const deltaTicTime_per_tic = DATA['📜']['🔺🌡️💫'];
    
    const adjustment = deltaTicTime_per_tic * ticTime;
    const T0_initial = baseTemp + adjustment;

    if (T0_initial <= 0) {
        throw new Error(`T0_initial invalide: ${T0_initial}`);
    }
    
    const CO2_ppm = CO2_fraction * 1e6;
    const CH4_ppm = CH4_fraction * 1e6;
    const H2O_percent = DATA['💧']['🍰🧪🌧'] * 100;
    

    const lambda_min = 0.1e-6;
    const lambda_max = 100e-6;
    // 🔒 Utiliser le même pas constant que dans calculateFluxForT0() pour cohérence
    // DATA['🧮']['🔬🌈'] contient le nombre d'éléments (length), pas le pas
    // Le pas est toujours 0.1e-6 (comme dans calculateFluxForT0 ligne 97)
    const delta_lambda = 0.1e-6;
    
    // 🔒 SUPPRIMÉ : logCalculationPhase inutile
    
    // 🔒 Anticiper la couleur avec T0_initial dès le début
    
        const tempC_anticipated = T0_initial - CONST.KELVIN_TO_CELSIUS;
        const color_anticipated = window.PLOT.tempSurfaceToColor(tempC_anticipated);
        window.updateBlackBodyColor(color_anticipated);
        
        // Mettre à jour legend-equilibre avec la couleur anticipée
        const legendEquilibre = document.querySelector('.legend-equilibre'); // Plantera si n'existe pas
        if (legendEquilibre) {
            legendEquilibre.style.color = color_anticipated;
    }

    

    // Dichotomie pour trouver T0 qui donne flux_total = flux_solaire_absorbé
    // 🔒 Ajuster les bornes selon la température initiale (peut être très élevée pour Hadéen)
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const cellH2O_check = document.getElementById('cell-h2o'); // Plantera si n'existe pas
    const h2o_enabled_check = cellH2O_check && cellH2O_check.classList.contains('checked');

    // Si T0_initial est très élevé (ex: Hadéen post-impact), utiliser un intervalle plus large
    // 🔒 OPTIMISATION : Réduire l'intervalle si on part d'une T0 précédente connue (continuité)
    const prev_T0_for_range = window.plotData.temp_surface; // Plantera si n'existe pas
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
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
    
    const precision_K = DATA['🧮']['🧲🔬'];
    
    // Convertir la précision en K en tolérance de base en W/m² : ΔF = 4 * σ * T³ * ΔT
    // La tolérance sera recalculée à chaque itération avec T0_current (car la sensibilité change avec T)
    // Note : La précision est déjà initialisée dans setEpoch (log 🕰 🛠 [setEpoch@main.js] 🎚=0.1° 🔘 selected)
    // Note : La tolérance sera recalculée à chaque itération avec T0_current pour une précision correcte
    const tolerance_base = 4 * STEFAN_BOLTZMANN * Math.pow(T0_initial, 3) * precision_K;
    const _md = window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.maxDichotomyIterations;
    const max_iterations =
        Number.isFinite(Number(_md)) && Number(_md) > 0 ? Math.floor(Number(_md)) : 30;
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

    const shouldDisplaySteps = window.showDichotomySteps && window.spectreAffiche();

    if (shouldDisplaySteps) {
        // Créer un lambda_range temporaire pour afficher les courbes Planck avant la dichotomie
        // (utiliser les variables déjà déclarées ci-dessus)
        const temp_lambda_range = [];
        for (let lambda = lambda_min; lambda < lambda_max; lambda += delta_lambda) {
            temp_lambda_range.push(lambda);
        }

        // Afficher les courbes Planck de référence avant la dichotomie
        {
            // Créer lambda_weights pour temp_lambda_range (poids unitaire pour pas constant)
            const temp_lambda_weights = temp_lambda_range.map(() => 1.0);
            
            // Créer un plotData temporaire avec seulement les courbes Planck
            const tempPlotData = {
                lambda_range: temp_lambda_range,
                lambda_weights: temp_lambda_weights, // ⚡ Nécessaire pour updatePlot
                current: null,
                co2_ppm: CO2_fraction * 1e6
            };
            window.PLOT.updatePlot(tempPlotData);

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
    
    // 🔒 IMPORTANT : Mettre à jour DATA['🧮']['🧮🌡️'] AVANT le calcul initial aussi !
    DATA['🧮']['🧮🌡️'] = T0_initial;
    DATA['🧮']['🧮⚧'] = 'Search'; // Éviter Init (cycle eau complet) ; recalcul vapeur à chaque T
    // 🔒 Résolution spectrale uniforme (test) ; init → doit exister
    DATA['🧮']['🔬🌈'] = window.CONFIG_COMPUTE.maxSpectralBinsConvergence;
    window.H2O.calculateH2OParameters();
    // Calculer la courbe initiale
    const calc_success_init = await calculateFluxForT0();
    if (!calc_success_init) {
        console.error('[performDichotomy] calculateFluxForT0() initial a échoué');
        return;
    }
    result = getSpectralResultFromDATA();
    if (!result) {
        console.error('[performDichotomy] Impossible de récupérer les résultats depuis DATA');
        return;
    }
    

    // Afficher la courbe initiale (avant dichotomie) seulement si demandé
    // 🔒 Réutiliser shouldDisplaySteps déjà calculé ci-dessus (peut avoir changé via bouton anim)
    if (shouldDisplaySteps) {
        displayDichotomyStep(DATA['🫧']['🍰🫧🏭'], T0_initial, result, 0, true, options);
    }

    // Reset des flux diff min/max pour la nouvelle dichotomie asynchrone
    window.flux_diff_min = -1e9;
    window.flux_diff_max = 1e9;

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

                if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) {
                    const mPd1 = `🚀 [performDichotomy] Début convergence - T0_initial = ${T0_initial.toFixed(2)}K (${(T0_initial - CONST.KELVIN_TO_CELSIUS).toFixed(2)}°C)`;
                    const mPd2 = `🚀 [performDichotomy] DATA['🧮']['🧮🌡️'] avant = ${DATA['🧮']['🧮🌡️'].toFixed(2)}K`;
                    console.log(mPd1);
                    console.log(mPd2);
                    if (typeof window.debugMirrorConfigLogToFile === 'function') {
                        window.debugMirrorConfigLogToFile('logEdsDiagnostic', mPd1);
                        window.debugMirrorConfigLogToFile('logEdsDiagnostic', mPd2);
                    }
                }

                const iterate = async () => {
                    // Vérifier si annulé avant chaque itération
                    if (window.cancelCalculation || isCancelled) {
                        return;
                    }

                    if (iter >= max_iterations) {
                        // Maximum d'itérations atteint
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
                        }
                        return;
                    }

                    const shouldDisplaySteps = window.showDichotomySteps && window.spectreAffiche();
                    DATA['🧮']['🧮🌡️'] = T0_current;
                    window.H2O.calculateH2OParameters();
                    // Toujours recalculer pour avoir les valeurs à jour (le delta doit changer avec T0_current)
                    const calc_success = await calculateFluxForT0();
                    if (!calc_success) {
                        console.error('[iterate] calculateFluxForT0() a échoué');
                        return;
                    }
                    final_result = getSpectralResultFromDATA();
                    if (!final_result) {
                        console.error('[iterate] Impossible de récupérer les résultats depuis DATA');
                        return;
                    }
                    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
                    const geo_flux = DATA['🌕']['🧲🌕'];   // flux intérieur : UNE source (geology/interieur.js)
                    // 🔒 CORRECTION : Utiliser DATA directement, pas le bouton
                    const solar_flux_absorbed = window.ALBEDO.calculateSolarFluxAbsorbed();

                    // 🔒 CORRECTION CRITIQUE : Inclure le flux géothermique dans le bilan énergétique !
                    // Équilibre : Flux Sortant = Flux Solaire Absorbé + Flux Géothermique
                    const total_flux_in = solar_flux_absorbed + (geo_flux || 0);
                    const flux_diff = final_result.total_flux - total_flux_in;
                    
                    // 🔒 ÉQUILIBRE RADIATIF : Les aires sous les courbes affichées doivent être égales
                    // Sur le graphique :
                    // - Courbe pointillée (...) = Planck à T_effective = σT_eff⁴
                    // - Courbe pleine (___) = émission réelle spectrale = total_flux
                    // Légende : "∫ ...= ∫___" signifie équilibre des aires sous ces deux courbes
                    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
                    
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
                    const tolerance_status = Math.abs(delta_equilibre) <= tolerance_current ? '✅' : '🧮';
                    
                    // ⚠️ Vérifier si delta_equilibre est anormalement grand
                    if (Math.abs(delta_equilibre) > 10000) {
                        console.warn(`⚠️ [calculations.js] Delta équilibre anormalement grand: ${delta_equilibre.toFixed(2)} W/m² (flux_sortant=${final_result.total_flux.toFixed(2)} W/m², flux_entrant=${total_flux_in.toFixed(2)} W/m²)`);
                    }
                    
                    // Fonction pour log Delta équilibre
                    window.logDeltaEquilibre();
                    
                    // Afficher le calcul direct seulement si l'ajustement est raisonnable (T0 > 50K et ajustement < 100K)
                    // ⚠️ Cette formule linéaire n'est valide que pour de petits ajustements (ΔT << T)
                    // À 100K avec delta_equilibre = -233 W/m², l'ajustement serait -1013K (absurde)
                    // On n'affiche que si l'ajustement est < 100K (approximation valide)
                    // 🔒 Mettre à jour la couleur de legend-equilibre avec la température actuelle (pendant les calculs)
                    if (typeof window !== 'undefined' && typeof window.PLOT.tempSurfaceToColor === 'function') {
                        const tempC_current = T0_current - CONST.KELVIN_TO_CELSIUS;
                        const color_current = window.PLOT.tempSurfaceToColor(tempC_current);
                        const legendEquilibre = document.querySelector('.legend-equilibre'); // Plantera si n'existe pas
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
                        }
                        // 🔒 SUPPRIMÉ : logCalculationPhase inutile

                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.H2O.calculateH2OParameters();
                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const calc_success_conv = await calculateFluxForT0();
                        if (!calc_success_conv) {
                            console.error('[Convergence] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Convergence] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }

                        // Déclencher un événement de convergence
                        window.RUNTIME_STATE.calculationConverged = true;
                        window.dispatchEvent(new CustomEvent('calculationConverged', {
                            detail: { T0: T0_current, iteration: iter + 1 }
                        }));
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
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
                    }
                    
                    // Appliquer l'algorithme selon la phase
                    if (Phase === "Search") {
                        // Phase="Search" : incTemp (dT) = -delta / sensitivity
                        // Formule : dF/dT = 4σT³ => incTemp = -delta_equilibre / (4σT³)
                        // Si delta>0 (on émet trop) => diminuer T ; si delta<0 => augmenter T
                        old_T0 = T0_current;
                        const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
                        const sensitivity = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3);
                        let T0_adjustment = -delta_equilibre / sensitivity; // incTemp
                        // 🔒 Limiter l'ajustement pour éviter des sauts trop importants (max ±50K par itération)
                        const T0_adjustment_unlimited = T0_adjustment;
                        T0_adjustment = Math.max(-50, Math.min(50, T0_adjustment));
                        T0_current = T0_current + T0_adjustment;
                        // 🔒 Protection : éviter les températures négatives ou trop basses
                        T0_current = Math.max(200, T0_current);
                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.H2O.calculateH2OParameters();
                        // Recalculer avec la nouvelle T0
                        const calc_success_search = await calculateFluxForT0();
                        if (!calc_success_search) {
                            console.error('[Search] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Search] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }
                        // Recalculer delta_equilibre avec la nouvelle T0
                        const solar_flux_absorbed_new = calculateSolarFluxAbsorbed(T0_current, true, geo_flux);
                        const total_flux_in_new = solar_flux_absorbed_new + (geo_flux || 0);
                        delta_equilibre = final_result.total_flux - total_flux_in_new;
                        // Recalculer tolerance_current avec la nouvelle T0
                        tolerance_current = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
                    } else if (Phase === "Dicho") {
                        // Phase="Dicho" : T0 = (old_T0 + T0) / 2
                        old_T0 = T0_current;
                        T0_current = (T0_min + T0_max) / 2;
                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.H2O.calculateH2OParameters();
                        // Recalculer avec la nouvelle T0
                        const calc_success_dicho = await calculateFluxForT0();
                        if (!calc_success_dicho) {
                            console.error('[Dicho] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Dicho] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }
                        // Recalculer delta_equilibre avec la nouvelle T0
                        const solar_flux_absorbed_new = calculateSolarFluxAbsorbed(T0_current, true, geo_flux);
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
                        window.incrementTimeline();
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
                        }
                        // 🔒 SUPPRIMÉ : logCalculationPhase inutile

                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.H2O.calculateH2OParameters();
                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const calc_success_conv = await calculateFluxForT0();
                        if (!calc_success_conv) {
                            console.error('[Convergence] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Convergence] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }

                        // Déclencher un événement de convergence pour permettre l'augmentation de précision
                        if (typeof window !== 'undefined') {
                            window.RUNTIME_STATE.calculationConverged = true;
                            // Déclencher un événement personnalisé
                            if (window.dispatchEvent) {
                                window.dispatchEvent(new CustomEvent('calculationConverged', {
                                    detail: { T0: T0_current, iteration: iter + 1 }
                                }));
                            }
                        }
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
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
                    const shouldDisplayStepsIter = window.showDichotomySteps && window.spectreAffiche();
                    
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
                    
                    if (iter > max_iterations || converged_by_flux_final || converged_by_temp_final) {
                        // Condition de sortie atteinte
                        if (iter > max_iterations && window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logEdsDiagnostic) {
                            const mMi = '[calculations.js] ⚠️ Maximum d\'itérations atteint (' + max_iterations + ')';
                            console.log(mMi);
                            if (typeof window.debugMirrorConfigLogToFile === 'function') window.debugMirrorConfigLogToFile('logEdsDiagnostic', mMi);
                        } else if (converged_by_temp_final && !converged_by_flux_final) {
                        } else {
                        }
                        
                        // 🔒 SUPPRIMÉ : logCalculationPhase inutile

                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.H2O.calculateH2OParameters();
                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const calc_success_conv = await calculateFluxForT0();
                        if (!calc_success_conv) {
                            console.error('[Convergence] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Convergence] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }

                        // Déclencher un événement de convergence
                        window.RUNTIME_STATE.calculationConverged = true;
                        window.dispatchEvent(new CustomEvent('calculationConverged', {
                            detail: { T0: T0_current, iteration: iter }
                        }));
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
                        }
                        return;
                    }
                    
                    // Mettre à jour previousT0_for_convergence pour la prochaine itération (APRÈS vérification de convergence)
                    // Si on continue, on met à jour pour la prochaine comparaison
                    previousT0_for_convergence = T0_current;
                    
                    // 🔒 Dessiner après avoir vérifié qu'on continue (utiliser requestAnimationFrame pour laisser le navigateur rendre)
                    if (shouldDisplayStepsIter && !isCancelled) {
                        displayDichotomyStep(DATA['🫧']['🍰🫧🏭'], T0_current, final_result, iter, false, options);
                        
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
                    {
                        // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked)
                        const cellH2O_iter = document.getElementById('cell-h2o'); // Plantera si n'existe pas
                        // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
                        const h2o_enabled = cellH2O_iter && cellH2O_iter.classList.contains('checked');

                        // 🔒 UTILISER geo_flux (variable locale déjà calculée correctement ci-dessus)
                        // au lieu de le recalculer (potentiellement mal) via getGeologicalPeriodByName
                        // let geo_flux = null; ... REMOVED

                        const albedo = window.ALBEDO.calculateAlbedo();
                        const cloud_coverage = DATA['🪩']['🍰🪩⛅'];
                        const co2_ppm = DATA['🫧']['🍰🫧🏭'] * 1e6;
                        const ch4_ppm = DATA['🫧']['🍰🫧🐄'] * 1e6;

                        // Mettre à jour les labels et la légende (K, °C, °F + couleur)
                        const fluxData = {
                            T0: T0_current,
                            temp_surface: T0_current,
                            temp_surface_c: T0_current - CONST.KELVIN_TO_CELSIUS,
                            total_flux: final_result.total_flux,
                            albedo: albedo,
                            cloud_coverage: cloud_coverage,
                            co2_ppm: co2_ppm,
                            ch4_ppm: ch4_ppm,
                            geo_flux: geo_flux,
                            planet_radius: (options && options.planet_radius) ? options.planet_radius : 6371000
                        };
                        const fpsOkInner = (window.RUNTIME_STATE.fps >= window.UI_STATE.FPSalert);
                        if (fpsOkInner) {
                            window.ORG.updateFluxLabels('cycleCalcul');
                        }
                        if (typeof window.updateLegend === 'function') {
                            window.updateLegend(fluxData);
                        }
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
                    window.incrementTimeline();

                    // Mettre à jour l'overlay (barre de progression avec .)
                    const dots = document.getElementById('calculation-dots');
                    if (dots) {
                        setTimeout(() => { dots.innerHTML += '.'; }, 100);
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

            if (!window.RUNTIME_STATE.calculationTimeouts) {
                window.RUNTIME_STATE.calculationTimeouts = [];
            }
            window.RUNTIME_STATE.calculationTimeouts.push(...timeoutIds);
        });
}

// Fonction pour finaliser les résultats (mode asynchrone)
function finalizeResults(final_result, final_T0, CO2_fraction, resolve) {
    const logo = '🏭'; // Emoji CO2 depuis dico.js
    // 🔒 Réactiver l'affichage du spectre à la fin des calculs (même si FPS était bas pendant)
    if (typeof window !== 'undefined') {
        window.RUNTIME_STATE.showSpectralBackground = true;
    }
    
    // Cacher l'overlay de calcul
    if (typeof document !== 'undefined') {
        const overlay = document.getElementById('calculation-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Stocker la T0 ajustée

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
    // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked) au lieu de se fier uniquement à window.UI_STATE.waterVaporEnabled
    const cellH2O = document.getElementById('cell-h2o'); // Plantera si n'existe pas
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const h2o_enabled = cellH2O && cellH2O.classList.contains('checked');
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const geo_flux = DATA['🌕']['🧲🌕'];   // flux intérieur : UNE source (geology/interieur.js)
    // Récupérer CH4 pour détecter le cas du corps noir
    const ch4_enabled = window.UI_STATE.methaneEnabled;
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
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
    const isBlackBody = (CO2_fraction === 0 || CO2_fraction === null) && !h2o_enabled && (!ch4_enabled || !CH4_fraction);
    const effective_temperature = isBlackBody
        ? final_T0  // Corps noir : utiliser directement temp_surface (formule analytique exacte)
        : Math.pow(total_flux / STEFAN_BOLTZMANN, 0.25);  // Avec atmosphère : calculer depuis flux_total

    // 🔒 FORCER le recalcul de la glace avant de calculer l'albedo
    if (h2o_enabled) {
        const h2o_total_percent = DATA['💧']['🍰🫧💧'] * 100;
        if (h2o_total_percent > 0) {
            const h2o_params = window.H2O.calculateH2OParameters(final_T0, h2o_total_percent, null);
            window.RUNTIME_STATE.h2oIceFractionFromCalculation = h2o_params.ice_fraction;
        }
    }

    const albedo = window.ALBEDO.calculateAlbedo();
    const cloud_coverage = DATA['🪩']['🍰🪩⛅'];
    
    // Calculer EDS (Effet de Serre) = Flux Surface - Flux Sortant
    const flux_surface = STEFAN_BOLTZMANN * Math.pow(final_T0, 4);
    const eds = flux_surface - total_flux;
    
    // 🔒 Mettre à jour la couleur avec la température finale (après convergence)
    const tempC_final = final_T0 - CONST.KELVIN_TO_CELSIUS;
    const color_final = window.PLOT.tempSurfaceToColor(tempC_final);
    window.updateBlackBodyColor(color_final);
    const legendEquilibre_f = document.querySelector('.legend-equilibre');
    if (legendEquilibre_f) legendEquilibre_f.style.color = color_final;
    
    if (!window.plotData) window.plotData = {};
    window.plotData.temp_surface = final_T0;
    window.plotData.temp_surface_c = final_T0 - CONST.KELVIN_TO_CELSIUS;
    DATA['🧮']['🧮🌡️'] = final_T0;

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
        temp_surface_c: final_T0 - CONST.KELVIN_TO_CELSIUS // 🔒 Température de surface (°C) - nécessaire pour updateH2OLevelDirect
    };

    const maxBinsFinal = (window.FLUX && typeof window.FLUX.plotAxisXPx === 'number' && window.FLUX.plotAxisXPx > 0)
        ? Math.max(24, Math.floor(window.FLUX.plotAxisXPx))
        : (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.maxSpectralBinsConvergence) || 2000;
    window.RUNTIME_STATE.showSpectralBackground = !!(lambda_range && lambda_range.length >= maxBinsFinal);
    window.RUNTIME_STATE.spectralConverged = true;
    window.RUNTIME_STATE.spectralPrecisionTarget = 'max';
    
    {
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
            window.PLOT.updateSpectralVisualization(spectralData);
            setTimeout(() => {
                const canvasCheck = document.getElementById('spectral-visualization');
                if (canvasCheck && (canvasCheck.style.display === 'none' || canvasCheck.style.visibility === 'hidden' || canvasCheck.style.opacity === '0')) {
                    console.warn('[finalizeResults] ⚠️ Canvas spectral caché après mise à jour, réactivation...');
                    canvasCheck.style.setProperty('display', 'block', 'important');
                    canvasCheck.style.setProperty('visibility', 'visible', 'important');
                    canvasCheck.style.setProperty('opacity', '1', 'important');
                    window.PLOT.updateSpectralVisualization(spectralData);
                }
            }, 300);
        }, 250); // Délai plus long pour laisser updatePlot finir
    }

    resolve(final_result_obj);
}

// Fonction pour finaliser les résultats (mode synchrone)
function finalizeResultsSync(result, T0, lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux, CO2_fraction) {
    const logo = '🏭'; // Emoji CO2 depuis dico.js
    // Calculer le flux total au sommet de l'atmosphère
    const total_flux = upward_flux[upward_flux.length - 1].reduce((sum, val) => sum + val, 0);

    // Récupérer h2o_enabled pour calculer l'albedo dynamique et la couverture nuageuse
    // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked) au lieu de se fier uniquement à window.UI_STATE.waterVaporEnabled
    const cellH2O = document.getElementById('cell-h2o'); // Plantera si n'existe pas
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const h2o_enabled = cellH2O && cellH2O.classList.contains('checked');
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const geo_flux = DATA['🌕']['🧲🌕'];   // flux intérieur : UNE source (geology/interieur.js)
    const solar_flux_absorbed = calculateSolarFluxAbsorbed(T0, h2o_enabled, geo_flux);
    if (h2o_enabled) {
        const h2o_total_percent = DATA['💧']['🍰🫧💧'] * 100;
        if (h2o_total_percent > 0) {
            const h2o_params = window.H2O.calculateH2OParameters(T0, h2o_total_percent, null);
            window.RUNTIME_STATE.h2oIceFractionFromCalculation = h2o_params.ice_fraction;
        }
    }
    
    const albedo = calculateAlbedo(T0, h2o_enabled, geo_flux);
    const cloud_coverage = DATA['🪩']['🍰🪩⛅'];
    
    const tempC_final_sync = T0 - CONST.KELVIN_TO_CELSIUS;
    const color_final_sync = window.PLOT.tempSurfaceToColor(tempC_final_sync);
    window.updateBlackBodyColor(color_final_sync);
    const legendEquilibre_sync = document.querySelector('.legend-equilibre');
    if (legendEquilibre_sync) legendEquilibre_sync.style.color = color_final_sync;

    const ch4_enabled = window.UI_STATE.methaneEnabled;
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
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
    const flux_surface = STEFAN_BOLTZMANN * Math.pow(T0, 4);
    const eds = flux_surface - total_flux;
    
    if (!window.plotData) window.plotData = {};
    window.plotData.temp_surface = T0;
    window.plotData.temp_surface_c = T0 - CONST.KELVIN_TO_CELSIUS;
    DATA['🧮']['🧮🌡️'] = T0;

    const maxBinsSync = (window.FLUX && typeof window.FLUX.plotAxisXPx === 'number' && window.FLUX.plotAxisXPx > 0)
        ? Math.max(24, Math.floor(window.FLUX.plotAxisXPx))
        : (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.maxSpectralBinsConvergence) || 2000;
    window.RUNTIME_STATE.showSpectralBackground = !!(lambda_range && lambda_range.length >= maxBinsSync);
    window.RUNTIME_STATE.spectralConverged = true;
    window.RUNTIME_STATE.spectralPrecisionTarget = 'max';
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
                window.PLOT.updateSpectralVisualization(spectralData);
    }, 150);

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
        temp_surface_c: T0 - CONST.KELVIN_TO_CELSIUS // 🔒 Température de surface (°C) - nécessaire pour updateH2OLevelDirect
    };
}


window.VISU_DICHO = {
    displayDichotomyStep: displayDichotomyStep,
    simulateRadiativeTransfer: simulateRadiativeTransfer
};
