// File: sync_panels.js - Synchronisation état visu ↔ scie (iframe)
// Desc: État partagé epoch, anim, ticTime + exécution centralisée index.html → projection visu + scie
// Version 1.1.19
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
// - v1.1.19: VISUALWAIT simplifié (retire markDrawn/isDrawn/resetDrawAck/awaitVisuDraw — while mort); appel direct RAF dans calculations_flux
// - v1.1.12: sync:state inclut tuning (🎚️) depuis scie ; applyStateFromScie applique p.tuning pour reproductibilité run scie/visu
// - v1.1.11: applyStateFromScie/applyTuningFromScie exposés ; messages sync:state/sync:tuning passent par shell
// - v1.1.10: displayConvergence/clearConvergenceTrace/appendConvergenceStep passent par shell.dataInput ; compute:done aussi
// - v1.1.9: shell.registerPanelApi visu/scie + setCurrentPanel(active) dans initSyncPanels ; dispatch prêt pour dataInput
// - v1.1.8: source unique tuning dans DATA[🎚️]; applyTuningPayload écrit DATA[🎚️]; runComputeInParent sync TUNING depuis DATA[🎚️]

(function () {
    'use strict';
    const IO_LISTENER = window.IO_LISTENER;

    // Stubs pour éviter crash si projectToVisu/runComputeInParent appellent FluxManager avant que organigramme.js ait défini updateFluxLabels / updateLabel (ordre chargement ; organigramme remplace par les vraies fonctions)
    if (typeof window.updateFluxLabels !== 'function') {
        window.updateFluxLabels = function () {};
    }
    if (typeof window.updateLabel !== 'function') {
        window.updateLabel = function () {};
    }

    window.SYNC_STATE = {
        epochId: '⚫',
        animEnabled: false,
        ticTime: 0,
        calculationInProgress: false
    };
    window.VISUALWAIT = {
        computeRenderMode: function () {
            return window.isVisuPanelActive() ? 'visu_' : 'scie_';
        }
    };

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

    // DATA['🎚️'] seule ref : payload contient baryByGroup + CLOUD_SW + SOLVER (remplissage complet depuis iframe).
    function applyTuningPayload(payload) {
        var T = window.DATA['🎚️'];
        T.baryByGroup.CLOUD_SW = payload.baryByGroup.CLOUD_SW;
        T.baryByGroup.SCIENCE = payload.baryByGroup.SCIENCE;
        T.baryByGroup.SOLVER = payload.baryByGroup.SOLVER;
        T.CLOUD_SW = Object.assign({}, payload.CLOUD_SW);
        T.SOLVER = Object.assign({}, payload.SOLVER);
        payload.updates.forEach(function (u) {
            T[u.group][u.key] = u.value;
        });
        syncTuningFromData();
    }

    // DATA source → TUNING et CONFIG_COMPUTE dérivés.
    function syncTuningFromData() {
        var T = window.DATA['🎚️'];
        window.TUNING.CLOUD_SW = Object.assign({}, T.CLOUD_SW);
        window.TUNING.SOLVER = Object.assign({}, T.SOLVER);
        window.CONFIG_COMPUTE.tolMinWm2 = T.SOLVER.TOL_MIN_WM2;
        window.CONFIG_COMPUTE.maxSearchStepK = T.SOLVER.MAX_SEARCH_STEP_K;
        window.CONFIG_COMPUTE.maxSearchStepLargeK = T.SOLVER.MAX_SEARCH_STEP_LARGE_K;
        window.CONFIG_COMPUTE.largeDeltaFactor = T.SOLVER.LARGE_DELTA_FACTOR;
    }

    function applyToVisu(payload, fromScie) {
        var visuPanel = document.getElementById('visu-panel');
        if (payload.epochId !== undefined) {
            window.SYNC_STATE.epochId = payload.epochId;
            if (!fromScie) {
                if (typeof window.setEpoch === 'function') window.setEpoch(payload.epochId);
            } else {
                var idx = window.TIMELINE ? window.TIMELINE.findIndex(function (item) { return item['📅'] === payload.epochId; }) : -1;
                if (idx >= 0) {
                    window.DATA['📅'] = window.TIMELINE[idx];
                    window.DATA['📜']['👉'] = idx;
                    window.DATA['📜']['🗿'] = payload.epochId;
                    if (window.configOrganigramme && window.configOrganigramme.timeline) {
                        var ep = window.configOrganigramme.timeline.find(function (e) { return e.type === 'epoch' && e.id === payload.epochId; });
                        if (ep) window.currentEpochName = ep.name;
                    }
                }
            }
            if (visuPanel) {
                var epochBtns = visuPanel.querySelectorAll('.epoch-btn');
                epochBtns.forEach(function (btn) {
                    btn.classList.toggle('selected', btn.getAttribute('data-epoch') === payload.epochId);
                });
            }
        }
        if (payload.animEnabled !== undefined) {
            window.SYNC_STATE.animEnabled = payload.animEnabled;
            var animCb = document.getElementById('plot-anim-toggle-checkbox');
            if (animCb) animCb.checked = payload.animEnabled;
            window.DATA['🔘']['🔘🎞'] = payload.animEnabled;
        }
        if (payload.ticTime !== undefined) {
            window.SYNC_STATE.ticTime = payload.ticTime;
            window.infoTimeMa = payload.ticTime * 50;
            window.DATA['📜']['📿💫'] = payload.ticTime;
            var infoTime = document.getElementById('info-time');
            if (infoTime) infoTime.textContent = '+' + (payload.ticTime * 50).toFixed(0) + ' Ma';
        }
    }

    function projectToVisu(DATA) {
        var CONST = window.CONST;
        var spectral = window.getSpectralResultFromDATA();
        var T0 = DATA['🧮']['🧮🌡️'];
        var tempC = T0 - CONST.KELVIN_TO_CELSIUS;
        document.getElementById('temp-surface-synthese').textContent = tempC.toFixed(1);
        var P_atm = (DATA['🫧'] && DATA['🫧']['🎈'] != null) ? DATA['🫧']['🎈'] : null;
        var pressureValEl = document.getElementById('pressure-surface-synthese');
        if (pressureValEl) pressureValEl.textContent = (P_atm != null && Number.isFinite(P_atm)) ? '🎈 ' + P_atm.toFixed(2) + ' atm' : '🎈 -- atm';
        // ppm CO2/CH4 = fraction molaire × 1e6 (co2KgToFraction/ch4KgToFraction), pas fraction massique × 1e6
        var atm_kg = DATA['⚖️']['⚖️🫧'];
        var M_air = DATA['🫧']['🧪'];
        var co2_ppm = window.co2KgToFraction(DATA['⚖️']['⚖️🏭'], atm_kg, M_air) * 1e6;
        var ch4_ppm = window.ch4KgToFraction(DATA['⚖️']['⚖️⛽'], atm_kg, M_air) * 1e6;
        var h2o_vapor_frac = (DATA['💧'] && DATA['💧']['🍰🫧💧'] != null) ? DATA['💧']['🍰🫧💧'] : 0;
        var h2o_meteorites = (typeof window.h2oTotalFromMeteorites !== 'undefined') ? window.h2oTotalFromMeteorites : 0;
        window.plotData.ch4_ppm = ch4_ppm;
        window.h2oVaporPercent = Math.min(100, Math.max(0, h2o_vapor_frac * 100 + h2o_meteorites));
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
        window.spectralConverged = true;
        window.spectralPrecisionTarget = 'max';
        // Dernier cycle : toujours mettre à jour plot + spectre (pas de garde FPS)
        window.updatePlot(window.plotData);
        window.updateFluxLabels('ProcessFinished');
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                var fresh = window.getSpectralResultFromDATA();
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
                window.updatePlot(window.plotData);
                // Force showSpectralBackground juste avant le draw (résiste au FPS monitor)
                window.showSpectralBackground = true;
                try {
                    window.updateSpectralVisualization(window.plotData.current);
                } catch (err) {
                    console.error('❌ [drawFlux@sync]', err);
                }
                IO_LISTENER.emit('flux:lastDrawn');
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
    window.runComputeInParent = function () {
        console.log('[4] calculs');
        var DATA = window.DATA;
        syncTuningFromData();
        // Source de vérité pour anim : bouton visu (plot-anim-toggle). Rafraîchir DATA['🔘'] avant le calcul
        // pour que sans animation on parte bien de 🌡️🧮 (ex. 288.8 K), pas de 255 K.
        window.getEnabledStates();
        // S'assurer que DATA['📅'] et DATA['📜'] sont initialisés (race avec setEpoch au chargement)
        var epochId = (DATA['📜'] && DATA['📜']['🗿']) || (window.SYNC_STATE && window.SYNC_STATE.epochId) || '⚫';
        var idx = window.TIMELINE ? window.TIMELINE.findIndex(function (item) { return item['📅'] === epochId; }) : -1;
        if (idx >= 0) {
            DATA['📅'] = window.TIMELINE[idx];
            if (!DATA['📜']) DATA['📜'] = {};
            DATA['📜']['👉'] = idx;
            DATA['📜']['🗿'] = epochId;
        } else {
            return Promise.resolve(null); // TIMELINE non prêt ou époque invalide
        }
        DATA['🧮']['previous'] = [];
        DATA['🧮']['🧮🔄🌊'] = 0;
        DATA['🧮']['🧮🔄🪩'] = 0;
        // Même état entrée visu/scie : masses époque courante + h2oTotalFromMeteorites=0 (comme après setEpoch/updateLevelsConfig)
        if (window.getMasses) window.getMasses();
        window.h2oTotalFromMeteorites = 0;
        window.SYNC_STATE.calculationInProgress = true; // Pour plot.js resizeCanvasToPlot (skipReposition pendant dichotomie)
        if (!DATA['🔘']['🔘🎞']) {
            DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'];
        } else if (!DATA['🧮']['🧮🌡️'] || DATA['🧮']['🧮🌡️'] <= 0) {
            var adj = (DATA['📜']['🔺🌡️💫'] || 0) * (DATA['📜']['📿💫'] || 0);
            DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'] + adj;
        }
        window.COMPUTE_LOADER.show();
        function doCompute() {
            if (!window.initForConfig()) {
                window.SYNC_STATE.calculationInProgress = false;
                return Promise.resolve(null);
            }
            var epochId = DATA['📜']['🗿'];
            if (window.FluxManager && window.getGeologicalPeriodByName) {
                window.currentEpochName = window.currentEpochName || epochId;
                window.FluxManager.updateAllFluxes(epochId);
            }
            var _sv = document.getElementById('spectral-visualization');
            if (_sv) {
                _sv._lastDrawnBins = 0;
                _sv._lastFinalSig = null;
            }
            var renderMode = window.VISUALWAIT.computeRenderMode();
            var isVisuMode = renderMode === 'visu_';
            return window.computeRadiativeTransfer(null, { renderMode: renderMode }).then(function (result) {
            window.SYNC_STATE.calculationInProgress = false;
            if (result === null) return null;
            // emit = abonnés in-page (ex. loader_panels stocke lastComputePayload pour envoi différé à l'iframe scie à l'ouverture de l'onglet)
            IO_LISTENER.emit('compute:done', { DATA: window.DATA, result: result });
            if (isVisuMode) {
                projectToVisu(window.DATA);
            }
            // dataInput = envoi immédiat au panel actif (iframe scie si c'est l'onglet visible)
            if (window.shell && window.shell.dataInput) {
                window.shell.dataInput({ type: 'compute:done', DATA: window.DATA });
            } else {
                projectToScie(window.DATA);
            }
            return result;
        }).catch(function (e) {
            window.SYNC_STATE.calculationInProgress = false;
            console.error('[runComputeInParent]', e);
            throw e;
        });
        }
        return new Promise(function (r) {
            requestAnimationFrame(function () { requestAnimationFrame(r); });
        }).then(doCompute);
    };

    function initSyncPanels() {
        // Dispatch via shell vers current (visu ou scie) ; fallback direct iframe si pas de shell
        window.displayConvergence = function () {
            if (window.shell && window.shell.dataInput) {
                window.shell.dataInput({ type: 'displayConvergence' });
                return;
            }
            var iframe = getIframe();
            if (iframe && iframe.contentWindow) {
                try { iframe.contentWindow.displayConvergence(); } catch (e) {}
            }
        };
        window.syncToScie = syncToScie;
        window.clearConvergenceTrace = function () {
            if (window.shell && window.shell.dataInput) {
                window.shell.dataInput({ type: 'clearConvergenceTrace' });
                return;
            }
            var iframe = getIframe();
            if (iframe && iframe.contentWindow) {
                try { iframe.contentWindow.clearConvergenceTrace(); } catch (e) {}
            }
        };
        window.appendConvergenceStep = function (payload) {
            if (window.shell && window.shell.dataInput) {
                window.shell.dataInput({ type: 'convergenceStep', data: payload });
                return;
            }
            var iframe = getIframe();
            if (iframe && iframe.contentWindow) {
                try { iframe.contentWindow.appendConvergenceStep(payload); } catch (e) {}
            }
        };

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

        // API appelée par shell quand scie envoie sync:state (epoch/anim/tic + tuning pour même conditions run scie/visu)
        window.applyStateFromScie = function (p) {
            applyToVisu(p, true);
            if (p.tuning) applyTuningPayload(p.tuning);
            window.runComputeInParent();
        };
        window.applyTuningFromScie = function (p) {
            applyTuningPayload(p);
            syncTuningToScie(p);
            if (p.run === true) window.runComputeInParent();
        };

        window.addEventListener('message', function (event) {
            if (event.data.type !== 'sync:state') return;
            var p = event.data.payload;
            if (window.shell && window.shell.applyStateFromScie) window.shell.applyStateFromScie(p);
            else {
                applyToVisu(p, true);
                if (p.tuning) applyTuningPayload(p.tuning);
                window.runComputeInParent();
            }
        });
        window.addEventListener('message', function (event) {
            if (event.data.type !== 'sync:tuning') return;
            var p = event.data.payload;
            if (window.shell && window.shell.applyTuningFromScie) window.shell.applyTuningFromScie(p);
            else { applyTuningPayload(p); syncTuningToScie(p); if (p.run === true) window.runComputeInParent(); }
        });

        IO_LISTENER.on('sync:state', function (payload) {
            if (payload.epochId !== undefined) window.SYNC_STATE.epochId = payload.epochId;
            if (payload.animEnabled !== undefined) window.SYNC_STATE.animEnabled = payload.animEnabled;
            if (payload.ticTime !== undefined) window.SYNC_STATE.ticTime = payload.ticTime;
            syncToScie(payload);
        });
        IO_LISTENER.on('sync:tuning', function (payload) {
            applyTuningPayload(payload);
            syncTuningToScie(payload);
            if (payload.run === true) window.runComputeInParent();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSyncPanels);
    } else {
        initSyncPanels();
    }
})();
