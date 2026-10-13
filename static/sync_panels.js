// File: sync_panels.js - Synchronisation état visu ↔ scie (iframe)
// Desc: État partagé epoch, anim, ticTime + exécution centralisée index.html → projection visu + scie
// Version 1.2.1
// - v1.2.1 (2026-10-13): journaux sync:tuning affichent tout baryByGroup (jauges séparées).
// - v1.2.0: (2026-10-12) l'état d'époque n'a qu'un écrivain, CLICS (via setEpoch / events.js jouerClic) :
//   applyStateToData et applyToVisu, qui reposaient l'époque et refaisaient ⏳ = ticTime × pas (repli 50 Ma !),
//   sont retirés ; plus d'écoute de sync:state / action:nextEpoch venant de la scie (elle n'en envoie plus) ;
//   config:applyThenCompute ne guette plus de changement d'époque (getEpochDateConfig n'en fait plus).
// - v1.1.51: sync:state run:true — si un calcul tourne, ABORT_COMPUTE + attente de SYNC_STATE.runningCompute avant de relancer
//   (plus de calculationInProgress=false forcé → 2 boucles solveur concurrentes sur DATA). runComputeInParent : null toléré si abandon.
// - v1.1.50: initSyncPanels après DOM + attente window.shell (scripts loader asynchrones) — sinon registerPanelApi jamais appelé → current=null dans shell.dataInput.
// - v1.1.49: initSyncPanels — shell.runCompute / applyStateFromScie / applyTuningFromScie = refs window.* (plus de wrappers dans shell.js).
// - v1.1.48: sync:state / applyToVisu — syncEpochFromTimelinePointer() au lieu de configOrganigramme.timeline.find(ep.name) ; 👉 source de vérité.
// - v1.1.47: projectToVisu — après draw flux, rAF → PLOT.logPlotScaleAfterCompute (DEBUG_PLOT_LOG + _logs/plot.txt)
// - v1.1.46: projectToVisu — appels directs PLOT.invalidateSpectralYLuminanceCache / FLUX.skipSpectralFluxRedrawOnce (pas de typeof === 'function')
// - v1.1.45: projectToVisu — invalidateSpectralYLuminanceCache avant 1er updatePlot ; 2e rAF: skipSpectralFluxRedrawOnce + invalidate puis updatePlot (échelle Y finale + overlays sans double draw flux dans le callback ; updateSpectralVisualization assure le canvas flux).
// - v1.1.44: broadcastTuningToIframes — factorise propagation sync:tuning vers scie + bench + hysteresis (#hysteresis-iframe). Utilisé dans applyTuningFromScie (mini-slider visu_), message listener sync:tuning (écho scie) et IO_LISTENER. Bench & hysteresis reçoivent désormais les changements venant de visu_ et scie_ (hysteresis = écoute seule, postMessage sortant mute v1.0.1).
// - v1.1.43: syncTuningToBench — IO_LISTENER 'sync:tuning' propage aussi vers l'iframe bench (#bench-iframe). Bench reçoit le payload via postMessage et rafraîchit ses jauges via message listener (epoch_bench.html v1.0.16).
// - v1.1.42: migration namespaces — window.PLOT.updatePlot / updateSpectralVisualization / tempSurfaceToColor + window.ORG.updateFluxLabels + RUNTIME_STATE (currentEpochName, spectralConverged, spectralPrecisionTarget, showSpectralBackground, h2oVaporPercent, h2oTotalFromMeteorites). Retrait stubs updateFluxLabels / updateLabel (ordre chargement contractuel, crash-first).
// - v1.1.41: retrait recopie DATA → window.TUNING (syncTuningFromData). DATA['🎚️'] = source unique live (initDATA v1.1.0). Miroirs CONFIG_COMPUTE conservés pour legacy.
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-02-06
// Logs:
// - v1.1.1: passage global _REGLE_JS_CRASH (pas de if abusifs, pas de fallbacks)
// - v1.1.2: T0 init quand anim+T<=0 ; displayConvergence no-op parent ; _lastCycleRef guard
// - v1.1.3: Guards null pour plot-anim-toggle, plot-anim-toggle-checkbox, info-time, visuPanel, DATA
// - v1.1.4: runComputeInParent init DATA[📅]/[📜] si race avec setEpoch ; guard initForConfig false
// - v1.1.5: runComputeInParent appelle getEnabledStates() avant calcul (source de vérité anim = bouton visu)
// - v1.1.5: appel direct getEnabledStates() sans typeof (règle _REGLE_JS_CRASH)
// - v1.1.6: event sync:tuning (bary + updates) pour appliquer tuning sur parent/visu puis run unique
// - v1.1.7: support baryByGroup (CLOUD_SW/SOLVER) pour jauges séparées
// - v1.1.13: runComputeInParent normalise entrée (getMasses + h2oTotalFromMeteorites=0) pour même résultat visu vs scie
// - v1.1.14: projectToVisu fix draw: showSpectralBackground forcé true dans RAF2, RAF3 unpause threeJS, retrait guards abusifs
// - v1.1.15: reset _lastFinalSig au démarrage d'un calcul pour autoriser 1 FINAL par run (anti-doublon cross-run)
// - v1.1.16: runComputeInParent passe renderMode (visu_/scie_) à computeRadiativeTransfer; pas de projectToVisu en scie_
// - v1.1.17: ajout namespace window.VISUALWAIT (computeRenderMode, shouldAwaitDraw, resetDrawAck, markDrawn, isDrawn)
// - v1.1.18: runComputeInParent force showDichotomySteps depuis DATA['🔘']['🔘🎞'] (visu anim = draws par cycle)
// - v1.1.19: VISUALWAIT simplifié
// - v1.1.20: un seul calcul (config:applyThenCompute) ; refresh visu = updateFluxLabels après compute:done (visu ou scie)
// - v1.1.22: [4]/[X] logs utilisent _logStep/_logStepEnd (console.groupCollapsed) si définis
// - v1.1.23: debug logs config:applyThenCompute + runComputeInParent (trace appelant [X])
// - v1.1.24: fix "un nextEpoch en trop" — applyToVisu(fromScie) ne réécrit pas 📿💫/infoTimeMa ; config:applyThenCompute appelle setEpoch si transition
// - v1.1.25: log [4] calculs (effectif) dans doCompute (après rAF) pour tracer le vrai début de calcul vs le scheduling
// - v1.1.27: action:nextEpoch depuis scie → togglePlotAnim() dans parent (🎞 = prochaine époque, pas toggle on/off)
// - v1.1.28: run scie_ émet flux:lastDrawn après compute:done (débloque fin de calcul rouge côté visu)
// - v1.1.29: debug run complet: source d'appel + payload tuning + état DATA avant runComputeInParent
// - v1.1.40: projectToVisu recolorise .synthese_Temp (setProperty color !important) + appelle updateLegend(plotData) → fix bug Hadéen title cyan persistant + légende figée au timeClic (setEpoch n'étant pas rappelé hors SKIP époque)
// - v1.1.30: applyTuningPayload appelle fillDataTuningFromBary si dispo (interpolation depuis bary + FINE_TUNING_BOUNDS)
// - v1.1.31: _epochIdToName 🐊 « Éocène »
// - v1.1.26: [4] effectif groupe reste ouvert jusqu'à [4] retour (suppr _logStepEnd prématuré)
// - v1.1.21: guard calculationInProgress en tête de runComputeInParent (évite double appel sendComputeToScie + config:applyThenCompute) (retire markDrawn/isDrawn/resetDrawAck/awaitVisuDraw — while mort); appel direct RAF dans calculations_flux
// - v1.1.39: _epochIdToName 🐊 « Éocène »
// - v1.1.38: diagnostics run/tuning/inputs → pdTrace (pd réservé aux erreurs)
// - v1.1.37: groupe 📡 sync:state (DEBUG_SYNC_PANELS) ; [4] retour sans _logStepEnd immédiat (logs post-run dans le groupe) ; fermetures [4] sur erreurs idx/init
// - v1.1.36: message sync:hysteresis {active} + payload.hysteresisActive (sync:state) → window.HYSTERESIS.active parent (même bundle que scie_)
// - v1.1.35: payload.hysteresisTimelineCo2Kg + epochId → patch TIMELINE[⚖️🏭] avant config:applyThenCompute (boucle HYSTERESIS iframe)
// - v1.1.12: sync:state inclut tuning (🎚️) depuis scie ; applyStateFromScie applique p.tuning pour reproductibilité run scie/visu
// - v1.1.11: applyStateFromScie/applyTuningFromScie exposés ; messages sync:state/sync:tuning passent par shell
// - v1.1.10: displayConvergence/clearConvergenceTrace/appendConvergenceStep passent par shell.dataInput ; compute:done aussi
// - v1.1.32: logs pdTrace pre/post initForConfig et post-run (inputs réels) pour diagnostiquer divergence UI vs solveur
// - v1.1.33: add huge TRACE_VISU banner + trace at runComputeInParent entry
// - v1.1.34: remove TRACE_VISU + dedupe sync:state run
// - v1.1.9: shell.registerPanelApi visu/scie + setCurrentPanel(active) dans initSyncPanels ; dispatch prêt pour dataInput
// - v1.1.8: source unique tuning dans DATA[🎚️]; applyTuningPayload écrit DATA[🎚️]; runComputeInParent sync TUNING depuis DATA[🎚️]

(function () {
    'use strict';
    const IO_LISTENER = window.IO_LISTENER;

    // organigramme.js doit être chargé avant sync_panels.js — contrat d'ordre (loader_panels).
    // ORG.updateFluxLabels / ORG.updateLabel : source unique, pas de stub.

    // window.SYNC_STATE : créé par le moteur (API_BILAN/data/initDATA.js), une seule fois.

    function getIframe() {
        return document.getElementById('scie-iframe');
    }

    function syncToScie(payload) {
        if (payload.epochId !== undefined) window.SYNC_STATE.epochId = payload.epochId;
        if (payload.animEnabled !== undefined) window.SYNC_STATE.animEnabled = payload.animEnabled;
        if (payload.ticTime !== undefined) window.SYNC_STATE.ticTime = payload.ticTime;

        var iframe = getIframe();
        iframe.contentWindow.postMessage({
            type: 'sync:state',
            payload: {
                epochId: window.SYNC_STATE.epochId,
                animEnabled: window.SYNC_STATE.animEnabled,
                ticTime: window.SYNC_STATE.ticTime
            }
        }, '*');
    }

    function syncTuningToScie(payload) {
        var iframe = getIframe();
        iframe.contentWindow.postMessage({
            type: 'sync:tuning',
            payload: payload
        }, '*');
    }

    // v1.1.43 : propage aussi vers l'iframe bench (epoch_bench.html, #bench-iframe dans bench_panel.html).
    // Le bench rafraîchit ses jauges via listener postMessage (epoch_bench.html v1.0.16).
    // Ne relance PAS runAllEpochs — l'utilisateur clique ▶️ dans le bench pour recalculer.
    function syncTuningToBench(payload) {
        var benchEl = document.getElementById('bench-iframe');
        if (!benchEl || !benchEl.contentWindow) return;
        benchEl.contentWindow.postMessage({ type: 'sync:tuning', payload: payload }, '*');
    }

    // v1.1.44 : propage vers l'iframe hystérésis (hysteresis_compute.html, #hysteresis-iframe).
    // Hystérésis = onglet "écoute seule" : postMessage sortant parent est neutralisé (v1.0.1 de
    // hysteresis_compute.html), mais il doit rester synchronisé avec les tuning émis par visu/scie/bench.
    function syncTuningToHysteresis(payload) {
        var hystEl = document.getElementById('hysteresis-iframe');
        if (!hystEl || !hystEl.contentWindow) return;
        hystEl.contentWindow.postMessage({ type: 'sync:tuning', payload: payload }, '*');
    }

    // v1.1.44 : broadcast unique. 3 onglets iframe parlent/écoutent (scie, bench) OU écoutent seul (hysteresis).
    // visu_ n'est pas une iframe → n'a pas besoin de postMessage (applyTuningPayload a déjà écrit DATA['🎚️']).
    function broadcastTuningToIframes(payload) {
        syncTuningToScie(payload);
        syncTuningToBench(payload);
        syncTuningToHysteresis(payload);
    }

    // Une seule implémentation : celle du moteur (API_BILAN/tuning.js). La copie locale (et la fonction vide
    // syncTuningFromData « conservée pour compat ») sont retirées le 2026-10-10.
    function applyTuningPayload(payload) {
        window.TUNING.applyTuningPayload(payload);
    }

    function projectToVisu(DATA) {
        if (!window.plotData) {
            window.plotData = { lambda_range: null, current: null, co2_ppm: 0, ch4_ppm: 0, temp_surface: 0 };
        }
        var CONST = window.CONST;
        var spectral = window.RADIATIVE.getSpectralResultFromDATA();
        var T0 = DATA['🧮']['🧮🌡️'];
        var tempC = T0 - CONST.KELVIN_TO_CELSIUS;
        document.getElementById('temp-surface-synthese').textContent = tempC.toFixed(1);
        var P_atm = (DATA['🫧'] && DATA['🫧']['🎈'] != null) ? DATA['🫧']['🎈'] : null;
        var pressureValEl = document.getElementById('pressure-surface-synthese');
        if (pressureValEl) pressureValEl.textContent = (P_atm != null && Number.isFinite(P_atm)) ? '🎈 ' + P_atm.toFixed(2) + ' atm' : '🎈 -- atm';
        // ppm CO2/CH4 = fraction molaire × 1e6 (co2KgToFraction/ch4KgToFraction), pas fraction massique × 1e6
        var atm_kg = DATA['⚖️']['⚖️🫧'];
        var M_air = DATA['🫧']['🧪'];
        var co2_ppm = window.ATM.co2KgToFraction(DATA['⚖️']['⚖️🏭'], atm_kg, M_air) * 1e6;
        var ch4_ppm = window.ATM.ch4KgToFraction(DATA['⚖️']['⚖️🐄'], atm_kg, M_air) * 1e6;
        var h2o_vapor_frac = (DATA['💧'] && DATA['💧']['🍰🫧💧'] != null) ? DATA['💧']['🍰🫧💧'] : 0;
        window.plotData.ch4_ppm = ch4_ppm;
        window.RUNTIME_STATE.h2oVaporPercent = Math.min(100, Math.max(0, h2o_vapor_frac * 100));
        window.plotData.lambda_range = spectral.lambda_range;
        window.plotData.lambda_weights = spectral.lambda_weights;
        var sigma = (CONST && CONST.STEFAN_BOLTZMANN != null) ? CONST.STEFAN_BOLTZMANN : 5.670374419e-8;
        var T_eff = (spectral.total_flux > 0) ? Math.pow(spectral.total_flux / sigma, 0.25) : T0;
        window.plotData.current = {
            T0: T0,
            temp_surface: T0,
            temp_surface_c: tempC,
            total_flux: spectral.total_flux,
            albedo: DATA['🪩']['🍰🪩📿'],
            cloud_coverage: DATA['🪩']['☁️'],
            lambda_range: spectral.lambda_range,
            lambda_weights: spectral.lambda_weights,
            upward_flux: spectral.upward_flux,
            z_range: spectral.z_range,
            earth_flux: spectral.earth_flux,
            effective_temperature: T_eff
        };
        window.plotData.temp_surface_c = tempC;
        window.plotData.temp_surface = T0;
        window.plotData.co2_ppm = co2_ppm;
        window.PLOT.invalidateSpectralYLuminanceCache();
        window.RUNTIME_STATE.spectralConverged = true;
        window.RUNTIME_STATE.spectralPrecisionTarget = 'max';
        // v1.1.40: resync couleur T° courante (hors chemin setEpoch anticipé).
        // - updateBlackBodyColor : met à jour la couleur globale des corps noirs (plot).
        // - .synthese_Temp : title col-left/right → couleur T° sol (sinon reste bloqué sur anticipation ou fallback cyan).
        // - updateLegend : regénère SVG strokes + textes équilibre avec la nouvelle couleur (sinon timeClic → plot recolore mais légende reste figée).
        var newColor = window.PLOT.tempSurfaceToColor(tempC);
        window.updateBlackBodyColor(newColor);
        var syntheseTempEl = document.querySelector('.synthese_Temp');
        if (syntheseTempEl) syntheseTempEl.style.setProperty('color', newColor, 'important');
        // Dernier cycle : toujours mettre à jour plot + spectre (pas de garde FPS)
        window.PLOT.updatePlot(window.plotData);
        window.updateLegend(window.plotData);
        window.ORG.updateFluxLabels('ProcessFinished');
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                var fresh = window.RADIATIVE.getSpectralResultFromDATA();
                if (fresh.lambda_range && fresh.upward_flux) {
                    window.plotData.lambda_range = fresh.lambda_range;
                    window.plotData.lambda_weights = fresh.lambda_weights;
                    window.plotData.current = Object.assign({}, window.plotData.current, fresh);
                    var T0Data = window.DATA['🧮']['🧮🌡️'];
                    window.plotData.current.T0 = T0Data;
                    window.plotData.current.temp_surface = T0Data;
                    window.plotData.current.temp_surface_c = T0Data - CONST.KELVIN_TO_CELSIUS;
                    window.plotData.temp_surface_c = window.plotData.current.temp_surface_c;
                    window.plotData.temp_surface = T0Data;
                }
                window.FLUX.skipSpectralFluxRedrawOnce = true;
                window.PLOT.invalidateSpectralYLuminanceCache();
                window.PLOT.updatePlot(window.plotData);
                // Force showSpectralBackground juste avant le draw (résiste au FPS monitor)
                window.RUNTIME_STATE.showSpectralBackground = true;
                try {
                    window.PLOT.updateSpectralVisualization(window.plotData.current);
                } catch (err) {
                    console.error('❌ [drawFlux@sync]', err);
                }
                IO_LISTENER.emit('flux:lastDrawn');
                requestAnimationFrame(function () {
                    window.PLOT.logPlotScaleAfterCompute();
                });
            });
        });
    }

    function projectToScie(DATA) {
        var iframe = getIframe();
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'compute:done', DATA: DATA }, '*');
            setTimeout(function () { if (window.resizeScieIframe) window.resizeScieIframe(); }, 200);
        }
    }

    // Main thread réservé GUI/DOM ; calcul cycles pourrait être déporté dans static/workers/compute_worker.js
    /**
     * LE canal du moteur vers l'interface (callback de api.run). Trace de convergence → panneau courant
     * (shell) ; fin de pas → étiquettes, chargeur, et en animation sur la visu, dessin pas à pas : la promesse
     * rendue fait attendre le moteur jusqu'à l'accusé plot:drawn (loader_panels → displayDichotomyStep).
     */
    function onEngineEvent(event, payload) {
        if (event === 'convergenceStart') { window.shell.dataInput({ type: 'clearConvergenceTrace' }); return; }
        if (event === 'convergenceStep') { window.shell.dataInput({ type: 'convergenceStep', data: payload }); return; }
        if (event === 'convergenceRefresh') { window.shell.dataInput({ type: 'displayConvergence' }); return; }
        if (event !== 'cycleCalcul') return;   // ProcessFinished : traité après run()
        var D = window.DATA;
        window.RUNTIME_STATE.h2oVaporPercent = Math.min(100, Math.max(0, D['💧']['🍰🫧💧'] * 100));
        if (!(D['🔘']['🔘🎞'] && window.isVisuPanelActive())) {
            IO_LISTENER.emit('compute:progress', payload);   // → loader_panels : étiquettes (cycleCalcul)
            return;
        }
        return new Promise(function (resolve) {
            var onDrawn = function (drawn) {
                if (drawn.iteration !== payload.iteration) return;
                IO_LISTENER.off('plot:drawn', onDrawn);
                requestAnimationFrame(resolve);
            };
            IO_LISTENER.on('plot:drawn', onDrawn);
            IO_LISTENER.emit('compute:progress', payload);
        });
    }

    window.runComputeInParent = function () {
        if (window.DEBUG_SYNC_PANELS === true) console.log('[DBG sync_panels] runComputeInParent epoch=' + window.DATA['📜']['🗿'] + ' 📿💫=' + window.DATA['📜']['📿💫'] + ' locked=' + window.SYNC_STATE.calculationInProgress);
        // Un calcul à la fois : un second appel pendant le premier (scie + visu) est ignoré.
        if (window.SYNC_STATE.calculationInProgress) {
            window._logStep('[X] bloqué calculationInProgress=true');
            window._logStepEnd();
            return Promise.resolve(null);
        }
        window.SYNC_STATE.calculationInProgress = true;
        window._logStep('[4] calculs (appel)');
        var DATA = window.DATA;
        // Rendre 📜 cohérent en premier (📿☄️, 🔺⚖️💧☄️, passage d'époque) avant le calcul.
        window.COMPUTE.getEpochDateConfig();
        var epochId = DATA['📜']['🗿'];
        window.COMPUTE_LOADER.show();
        function doCompute() {
            window._logStep('[4] calculs (effectif)');
            window.RUNTIME_STATE.currentEpochName = window.RUNTIME_STATE.currentEpochName || epochId;
            window.FluxManager.updateAllFluxes(epochId);
            var _sv = document.getElementById('spectral-visualization');
            _sv._lastDrawnBins = 0;
            _sv._lastFinalSig = null;
            // Projection UI : dépend du panel actif, pas du calcul.
            var shouldProjectToVisu = window.isVisuPanelActive();
            // UN point d'entrée moteur (API_BILAN/api.js) : époque, mode, masses, T initiale, init, convergence.
            return window.getBilanRadiatifAPI(onEngineEvent).run({ epochId: epochId, animEnabled: DATA['🔘']['🔘🎞'] }).then(function (result) {
            window.SYNC_STATE.calculationInProgress = false;
            window._logStepEnd(); // ferme groupe [4] effectif
            window._logStep('[4] calculs (retour)');
            // null = interrompu (ABORT_COMPUTE : un run plus récent a demandé l'abandon).
            if (result === null) return null;
            // emit = abonnés in-page (ex. loader_panels stocke lastComputePayload pour envoi différé à l'iframe scie à l'ouverture de l'onglet)
            IO_LISTENER.emit('compute:done', { DATA: window.DATA, result: result });
            if (shouldProjectToVisu) projectToVisu(window.DATA);
            // Sans dessin visu, émettre l'ack de fin pour libérer l'UI (loader rouge « calcul en cours », Three.js).
            if (!shouldProjectToVisu) IO_LISTENER.emit('flux:lastDrawn');
            window.ORG.updateFluxLabels('ProcessFinished');
            window.updateTimeline();
            window.shell.dataInput({ type: 'compute:done', DATA: window.DATA });
            return result;
        }, function (e) {
            window.SYNC_STATE.calculationInProgress = false;
            window._logStepEnd();
            console.error('[runComputeInParent]', e);
            throw e;
        });
        }
        var runningCompute = new Promise(function (r) {
            requestAnimationFrame(function () { requestAnimationFrame(r); });
        }).then(doCompute);
        window.SYNC_STATE.runningCompute = runningCompute;
        return runningCompute;
    };

    function initSyncPanels() {
        // Point d'entrée unique : config (📿☄️, ⚖️💧) puis calcul. Émis par visu (events.js) et par scie (sync:state).
        IO_LISTENER.on('config:applyThenCompute', function (payload) {
            // L'époque ne change jamais ici : le passage est décidé par le clic (CLICS.jouer → setEpoch).
            window.COMPUTE.getEpochDateConfig();
            window.runComputeInParent();
        }, 'sync_panels');

        window.syncToScie = syncToScie;

        // Shell : enregistrer les APIs panel pour dispatch via shell.dataInput (migration progressive)
        if (window.shell) {
            window.shell.registerPanelApi('scie', {
                dataInput: function (payload) {
                    var iframe = getIframe();
                    if (!iframe || !iframe.contentWindow) return;
                    if (payload.type === 'convergenceStep') iframe.contentWindow.appendConvergenceStep(payload.data);
                    else if (payload.type === 'displayConvergence') iframe.contentWindow.displayConvergence();
                    else if (payload.type === 'clearConvergenceTrace') iframe.contentWindow.clearConvergenceTrace();
                    else if (payload.type === 'compute:done') {
                        iframe.contentWindow.postMessage({ type: 'compute:done', DATA: payload.DATA }, '*');
                        setTimeout(function () { if (window.resizeScieIframe) window.resizeScieIframe(); }, 200);
                    }
                }
            });
            window.shell.registerPanelApi('visu', {
                dataInput: function (payload) {
                    if (window.visuDataInput) window.visuDataInput(payload);
                }
            });
            var visuEl = document.getElementById('visu-panel');
            var activeVisu = visuEl && visuEl.classList.contains('active');
            window.shell.setCurrentPanel(activeVisu ? 'visu' : 'scie');
        }

        window.applyTuningFromScie = function (p) {
            applyTuningPayload(p);
            broadcastTuningToIframes(p); // v1.1.44 : scie + bench + hysteresis
            if (p.run === true) window.runComputeInParent();
        };

        if (window.shell) {
            window.shell.runCompute = window.runComputeInParent;
            window.shell.applyTuningFromScie = window.applyTuningFromScie;
        }

        window.addEventListener('message', function (event) {
            if (event.data.type !== 'sync:tuning') return;
            var p = event.data.payload;
            window.SYNC_STATE.lastRunRequestSource = 'scie:message:sync:tuning';
            if (window.DEBUG_SYNC_PANELS === true) console.log('[DBG sync_panels] message sync:tuning run=' + p.run + ' bary=' + JSON.stringify(p.baryByGroup));
            if (typeof window.pdTrace === 'function') window.pdTrace('onMessageSyncTuning', 'sync_panels.js', 'run=' + p.run + ' bary=' + JSON.stringify(p.baryByGroup));
            if (window.shell && window.shell.applyTuningFromScie) window.shell.applyTuningFromScie(p);
            else { applyTuningPayload(p); broadcastTuningToIframes(p); if (p.run === true) window.runComputeInParent(); }
        });

        var _lastSyncRunSig = null;
        var _lastSyncRunAt = 0;
        IO_LISTENER.on('sync:state', function (payload) {
            if (payload.epochId !== undefined) window.SYNC_STATE.epochId = payload.epochId;
            if (payload.animEnabled !== undefined) window.SYNC_STATE.animEnabled = payload.animEnabled;
            if (payload.ticTime !== undefined) window.SYNC_STATE.ticTime = payload.ticTime;
            syncToScie(payload);
            if (payload.run === true) {
                var sig = JSON.stringify({ epochId: window.SYNC_STATE.epochId, animEnabled: window.SYNC_STATE.animEnabled, ticTime: window.SYNC_STATE.ticTime, bary: (payload.bary !== undefined ? payload.bary : null) });
                var now = Date.now();
                if (_lastSyncRunSig === sig && (now - _lastSyncRunAt) < 250) return;
                _lastSyncRunSig = sig;
                _lastSyncRunAt = now;
                var startRun = function () {
                    window.ABORT_COMPUTE = false;
                    // L'état (époque, horloge, compteurs) est déjà posé par setEpoch (CLICS) : rien à recopier ici.
                    window.COMPUTE.getEpochDateConfig();
                    window.SYNC_STATE.calculationInProgress = false;
                    window.runComputeInParent();
                };
                // Calcul encore en cours (ex. dernier 💫 cliqué pendant le run, fin d'époque → SKIP → setEpoch) :
                // l'abandonner et ATTENDRE sa fin. Avant : calculationInProgress forcé à false → 2 boucles solveur
                // en parallèle sur le même DATA + pool workers partagé → Δ/EDS H₂O aberrants (saut 9 → 16 °C à −750 Ma).
                if (window.SYNC_STATE.calculationInProgress && window.SYNC_STATE.runningCompute) {
                    window.ABORT_COMPUTE = true;
                    // Erreur éventuelle du run abandonné déjà loguée par son propre catch
                    window.SYNC_STATE.runningCompute.then(startRun, startRun);
                } else {
                    startRun();
                }
            }
        }, 'sync_panels');
        IO_LISTENER.on('sync:tuning', function (payload) {
            window.SYNC_STATE.lastRunRequestSource = 'visu:IO_LISTENER:sync:tuning';
            if (window.DEBUG_SYNC_PANELS === true) console.log('[DBG sync_panels] IO sync:tuning run=' + payload.run + ' bary=' + JSON.stringify(payload.baryByGroup));
            if (typeof window.pdTrace === 'function') window.pdTrace('onSyncTuning', 'sync_panels.js', 'run=' + payload.run + ' bary=' + JSON.stringify(payload.baryByGroup));
            applyTuningPayload(payload);
            broadcastTuningToIframes(payload); // v1.1.44 : scie + bench + hysteresis
            if (payload.run === true) window.runComputeInParent();
        }, 'sync_panels');
    }

    /** shell.js est chargé après ce fichier (loader séquentiel async) ; sans attente, registerPanelApi ne tourne jamais. */
    var INIT_SYNC_PANELS_SHELL_WAIT_MAX = 200;

    function deferInitSyncPanels() {
        function runWhenShellReady(attempt) {
            var n = attempt || 0;
            if (!window.shell) {
                if (n >= INIT_SYNC_PANELS_SHELL_WAIT_MAX) {
                    throw new Error('[sync_panels] window.shell absent après chargement (vérifier ordre SCRIPTS / loader_panels)');
                }
                setTimeout(function () { runWhenShellReady(n + 1); }, 0);
                return;
            }
            initSyncPanels();
        }
        function onDomReady() {
            setTimeout(function () { runWhenShellReady(0); }, 0);
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onDomReady);
        } else {
            onDomReady();
        }
    }
    deferInitSyncPanels();
})();
