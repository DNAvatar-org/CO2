// File: sync_panels.js - Synchronisation état visu ↔ scie (iframe)
// Desc: État partagé epoch, anim, ticTime + exécution centralisée index.html → projection visu + scie
// Version 1.2.3
// - v1.2.3 (2026-10-15): window.afficherCalcul(result) — l'affichage de fin de calcul, réutilisé par le banc (BENCH.voir).
// - v1.2.2 (2026-10-15): spectre caché (autre onglet) = aucun appel au plot, bandeau titre seul (projectSynthese).
// - v1.2.2 (2026-10-15): window.BENCH branché (debutCalcul / surPas / apresCalcul) — onglet Bench piloté par l'index.
// - v1.2.2 (2026-10-15): run:true de l'iframe scie ignoré tant que l'hôte n'a pas fini son init (SYNC_STATE.hotePret) —
//   il plantait sur COMPUTE_LOADER et laissait calculationInProgress bloqué ; le 1er calcul de l'init s'en charge.
// - v1.2.1 (2026-10-13): journaux sync:tuning affichent tout baryByGroup (jauges séparées).
// - v1.2.0: (2026-10-12) l'état d'époque n'a qu'un écrivain, CLICS (via setEpoch / events.js jouerClic) :
//   applyStateToData et applyToVisu, qui reposaient l'époque et refaisaient ⏳ = ticTime × pas (repli 50 Ma !),
//   sont retirés ; plus d'écoute de sync:state / action:nextEpoch venant de la scie (elle n'en envoie plus) ;
//   config:applyThenCompute ne guette plus de changement d'époque (getEpochDateConfig n'en fait plus).
// - v1.1.51: sync:state run:true — si un calcul tourne, ABORT_COMPUTE + attente de SYNC_STATE.runningCompute avant de relancer
//   (plus de calculationInProgress=false forcé → 2 boucles solveur concurrentes sur DATA). runComputeInParent : null toléré si abandon.
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-02-06

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

    /** Bandeau titre (T°, pression, couleur de la T°) : à chaque calcul, que le spectre soit affiché ou non. */
    function projectSynthese(DATA) {
        var tempC = DATA['🧮']['🧮🌡️'] - window.CONST.KELVIN_TO_CELSIUS;
        document.getElementById('temp-surface-synthese').textContent = tempC.toFixed(1);
        var P_atm = (DATA['🫧'] && DATA['🫧']['🎈'] != null) ? DATA['🫧']['🎈'] : null;
        var pressureValEl = document.getElementById('pressure-surface-synthese');
        if (pressureValEl) pressureValEl.textContent = (P_atm != null && Number.isFinite(P_atm)) ? '🎈 ' + P_atm.toFixed(2) + ' atm' : '🎈 -- atm';
        // - updateBlackBodyColor : met à jour la couleur globale des corps noirs.
        // - .synthese_Temp : couleur T° sol (sinon reste bloqué sur anticipation ou fallback cyan).
        var newColor = window.PLOT.tempSurfaceToColor(tempC);
        window.updateBlackBodyColor(newColor);
        document.querySelector('.synthese_Temp').style.setProperty('color', newColor, 'important');
    }

    /** Spectre (plot + canvas + légende) : seulement s'il est affiché (spectreAffiche) ; sinon aucun appel au plot. */
    function projectToVisu(DATA) {
        projectSynthese(DATA);
        if (!window.plotData) {
            window.plotData = { lambda_range: null, current: null, co2_ppm: 0, ch4_ppm: 0, temp_surface: 0 };
        }
        var CONST = window.CONST;
        var spectral = window.RADIATIVE.getSpectralResultFromDATA();
        var T0 = DATA['🧮']['🧮🌡️'];
        var tempC = T0 - CONST.KELVIN_TO_CELSIUS;
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
        // updateLegend : regénère SVG strokes + textes équilibre avec la nouvelle couleur (projectSynthese).
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
        if (event === 'convergenceStep') {
            window.BENCH.surPas(payload);   // onglet Bench : chemin de convergence de la ligne (bench_pilote.js)
            window.shell.dataInput({ type: 'convergenceStep', data: payload });
            return;
        }
        if (event === 'convergenceRefresh') { window.shell.dataInput({ type: 'displayConvergence' }); return; }
        if (event !== 'cycleCalcul') return;   // ProcessFinished : traité après run()
        var D = window.DATA;
        window.RUNTIME_STATE.h2oVaporPercent = Math.min(100, Math.max(0, D['💧']['🍰🫧💧'] * 100));
        if (!(D['🔘']['🔘🎞'] && window.spectreAffiche())) {
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

    window.projectToVisu = projectToVisu;   // retour à l'onglet Spectrale : redessin (loader_panels.onShowVisu)

    /** L'interface montre l'état de window.DATA : fin d'un calcul (runComputeInParent), ou état d'une ligne du banc
     *  rechargé sans recalcul (BENCH.voir, bench_pilote.js). */
    window.afficherCalcul = function (result) {
        // emit = abonnés in-page (ex. loader_panels stocke lastComputePayload pour envoi différé à l'iframe scie à l'ouverture de l'onglet)
        IO_LISTENER.emit('compute:done', { DATA: window.DATA, result: result });
        // Projection UI : dépend du panel actif, pas du calcul.
        if (window.spectreAffiche()) projectToVisu(window.DATA);
        // Spectre caché (autre onglet) : le bandeau titre seulement ; ack de fin pour libérer l'UI (loader, Three.js).
        else { projectSynthese(window.DATA); IO_LISTENER.emit('flux:lastDrawn'); }
        window.ORG.updateFluxLabels('ProcessFinished');
        window.updateTimeline();
        window.shell.dataInput({ type: 'compute:done', DATA: window.DATA });
    };

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
        // Rendre 📜 cohérent en premier (📿☄️, 🔺⚖️💧, passage d'époque) avant le calcul.
        window.COMPUTE.getEpochDateConfig();
        var epochId = DATA['📜']['🗿'];
        window.BENCH.debutCalcul();   // onglet Bench : ligne « en cours » (rien hors banc)
        window.COMPUTE_LOADER.show();
        function doCompute() {
            window._logStep('[4] calculs (effectif)');
            window.RUNTIME_STATE.currentEpochName = window.RUNTIME_STATE.currentEpochName || epochId;
            window.FluxManager.updateAllFluxes(epochId);
            var _sv = document.getElementById('spectral-visualization');
            _sv._lastDrawnBins = 0;
            _sv._lastFinalSig = null;
            // UN point d'entrée moteur (API_BILAN/api.js) : époque, mode, masses, T initiale, init, convergence.
            return window.getBilanRadiatifAPI(onEngineEvent).run({ epochId: epochId, animEnabled: DATA['🔘']['🔘🎞'] }).then(function (result) {
            window.SYNC_STATE.calculationInProgress = false;
            window._logStepEnd(); // ferme groupe [4] effectif
            window._logStep('[4] calculs (retour)');
            // null = interrompu (ABORT_COMPUTE : un run plus récent a demandé l'abandon).
            if (result === null) { window.BENCH.apresCalcul(null); return null; }
            window.afficherCalcul(result);
            window.BENCH.apresCalcul(result);   // onglet Bench : ligne envoyée, puis clic suivant selon le flag
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
            // L'iframe scie demande le 1er calcul dès qu'elle est chargée, parfois avant la fin de l'init de l'index :
            // le réglage est pris, et c'est le 1er calcul de l'init (loader_panels.scheduleInitialCompute) qui calcule.
            if (p.run === true && window.SYNC_STATE.hotePret) window.runComputeInParent();
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
            window.applyTuningFromScie(p);
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
