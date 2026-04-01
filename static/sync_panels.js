// File: sync_panels.js - Synchronisation état visu ↔ scie (iframe)
// Desc: État partagé epoch, anim, ticTime + exécution centralisée index.html → projection visu + scie
// Version 1.1.31
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
// - v1.1.30: applyTuningPayload appelle fillDataTuningFromBary si dispo (interpolation depuis bary + FINE_TUNING_BOUNDS)
// - v1.1.31: _epochIdToName 🐊 « Hyperthermie éocène »
// - v1.1.26: [4] effectif groupe reste ouvert jusqu'à [4] retour (suppr _logStepEnd prématuré)
// - v1.1.21: guard calculationInProgress en tête de runComputeInParent (évite double appel sendComputeToScie + config:applyThenCompute) (retire markDrawn/isDrawn/resetDrawAck/awaitVisuDraw — while mort); appel direct RAF dans calculations_flux
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
        calculationInProgress: false,
        lastRunRequestSource: 'unknown'
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
        if (payload.baryByGroup) {
            if (payload.baryByGroup.CLOUD_SW !== undefined) T.baryByGroup.CLOUD_SW = payload.baryByGroup.CLOUD_SW;
            if (payload.baryByGroup.SCIENCE !== undefined) T.baryByGroup.SCIENCE = payload.baryByGroup.SCIENCE;
            if (payload.baryByGroup.SOLVER !== undefined) T.baryByGroup.SOLVER = payload.baryByGroup.SOLVER;
        }
        if (typeof window.fillDataTuningFromBary === 'function') {
            window.fillDataTuningFromBary();
        } else {
            T.CLOUD_SW = Object.assign({}, T.CLOUD_SW, payload.CLOUD_SW || {});
            T.SOLVER = Object.assign({}, T.SOLVER, payload.SOLVER || {});
        }
        (payload.updates || []).forEach(function (u) {
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

    // Applique payload sync:state au DATA du contexte courant (sans DOM). Utilisé avant runComputeInParent quand run:true.
    function applyStateToData(payload) {
        if (!window.DATA['📜']) window.DATA['📜'] = {};
        if (payload.epochId !== undefined) {
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
        if (payload.ticTime !== undefined) {
            var _stEp = window.TIMELINE && window.DATA['📜'] && window.DATA['📜']['👉'] != null ? window.TIMELINE[window.DATA['📜']['👉']] : null;
            var _stTicKey = (_stEp && _stEp['🕰'] && _stEp['🕰']['🛢']) ? '🛢' : '💫';
            var _stStep = (_stEp && _stEp['🕰'] && _stEp['🕰'][_stTicKey] && typeof _stEp['🕰'][_stTicKey]['🔺⏳'] === 'number') ? _stEp['🕰'][_stTicKey]['🔺⏳'] : 50;
            window.infoTimeMa = payload.ticTime * _stStep;
            window.DATA['📜']['📿💫'] = payload.ticTime;
            if (_stTicKey === '🛢') window.DATA['📜']['📿🛢'] = payload.ticTime;
        }
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
            // fromScie : la scie renvoie son ticTime en écho → ne pas écraser la position temporelle du parent
            // (le parent est source de vérité pour 📿💫/infoTimeMa ; l'écho scie crée une race condition)
            if (!fromScie) {
                var _avEp = window.TIMELINE && window.DATA['📜'] && window.DATA['📜']['👉'] != null ? window.TIMELINE[window.DATA['📜']['👉']] : null;
                var _avTicKey = (_avEp && _avEp['🕰'] && _avEp['🕰']['🛢']) ? '🛢' : '💫';
                var _avStep = (_avEp && _avEp['🕰'] && _avEp['🕰'][_avTicKey] && typeof _avEp['🕰'][_avTicKey]['🔺⏳'] === 'number') ? _avEp['🕰'][_avTicKey]['🔺⏳'] : 50;
                window.infoTimeMa = payload.ticTime * _avStep;
                window.DATA['📜']['📿💫'] = payload.ticTime;
                if (_avTicKey === '🛢') window.DATA['📜']['📿🛢'] = payload.ticTime;
                var infoTime = document.getElementById('info-time');
                if (infoTime) {
                    if (_avTicKey === '🛢') {
                        // Époque forward (📱) : afficher l'année CE
                        var _avYr = Math.round((_avEp['▶'] || 0) + payload.ticTime * _avStep * 1e6);
                        infoTime.textContent = _avYr + ' CE';
                    } else {
                        infoTime.textContent = '+' + (payload.ticTime * _avStep).toFixed(0) + ' Ma';
                    }
                }
            }
        }
        if (fromScie && payload.h2oTotalFromMeteorites !== undefined) {
            window.h2oTotalFromMeteorites = payload.h2oTotalFromMeteorites;
            if (!window.DATA['💧']) window.DATA['💧'] = {};
            window.DATA['💧']['☄️'] = payload.h2oTotalFromMeteorites;
        }
    }

    function projectToVisu(DATA) {
        if (!window.plotData) {
            window.plotData = { lambda_range: null, current: null, co2_ppm: 0, ch4_ppm: 0, temp_surface: 0 };
        }
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
        var ch4_ppm = window.ch4KgToFraction(DATA['⚖️']['⚖️🐄'], atm_kg, M_air) * 1e6;
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
        var _epRun = window.DATA && window.DATA['📜'] && window.DATA['📜']['🗿'];
        var _ticRun = window.DATA && window.DATA['📜'] && window.DATA['📜']['📿💫'];
        var _srcRun = window.SYNC_STATE && window.SYNC_STATE.lastRunRequestSource ? window.SYNC_STATE.lastRunRequestSource : 'unknown';
        var _baryRun = window.DATA && window.DATA['🎚️'] && window.DATA['🎚️'].baryByGroup ? window.DATA['🎚️'].baryByGroup.CLOUD_SW : 'n/a';
        var _albRun = window.DATA && window.DATA['🪩'] ? window.DATA['🪩']['🍰🪩📿'] : 'n/a';
        console.log('[DBG sync_panels] runComputeInParent source=' + _srcRun + ' CLOUD_SW_bary=' + _baryRun + ' albedo=' + _albRun);
        if (typeof window.pd === 'function') window.pd('runComputeInParent', 'sync_panels.js', 'source=' + _srcRun + ' CLOUD_SW_bary=' + _baryRun + ' albedo=' + _albRun);
        console.log('[DBG sync_panels] runComputeInParent epoch=' + _epRun + ' 📿💫=' + _ticRun + ' locked=' + window.SYNC_STATE.calculationInProgress);
        if (window.SYNC_STATE.calculationInProgress) {
        if (window._logStep) window._logStep('[X] bloqué calculationInProgress=true');
        else console.log('[4] bloqué calculationInProgress=true');
        if (window._logStepEnd) window._logStepEnd();
        console.trace('[DBG] ⬆ stack de l\'appelant bloqué [X]');
        return Promise.resolve(null);
        }
        window.SYNC_STATE.calculationInProgress = true;
        if (window._logStep) window._logStep('[4] calculs (appel)');
        else console.log('[4] calculs (appel)');
        var DATA = window.DATA;
        // Rendre 📜 cohérent en premier (📿☄️, 🔺⚖️💧☄️) avant tout calcul — sinon ⚖️💧 reste 0
        window.getEpochDateConfig();
        // Ne pas réinitialiser h2oTotalFromMeteorites ici (conservé après clic météorite ; reset dans setEpoch au changement d'époque)
        syncTuningFromData();
        // Source de vérité pour anim : bouton visu (plot-anim-toggle). Rafraîchir DATA['🔘'] avant le calcul
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
            window.SYNC_STATE.calculationInProgress = false;
            return Promise.resolve(null); // TIMELINE non prêt ou époque invalide
        }
        DATA['🧮']['previous'] = [];
        DATA['🧮']['🧮🔄🌊'] = 0;
        DATA['🧮']['🧮🔄🪩'] = 0;
        // calculationInProgress déjà mis à true en tête pour éviter double entrée (sendComputeToScie + config:applyThenCompute)
        if (!DATA['🔘']['🔘🎞']) {
            DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'];
        } else if (!DATA['🧮']['🧮🌡️'] || DATA['🧮']['🧮🌡️'] <= 0) {
            var adj = (DATA['📜']['🔺🌡️💫'] || 0) * (DATA['📜']['📿💫'] || 0);
            DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'] + adj;
        }
        window.COMPUTE_LOADER.show();
        function doCompute() {
            // Log : moment réel où la computation commence (après les 2× requestAnimationFrame)
            var _epEff = window.DATA && window.DATA['📜'] && window.DATA['📜']['🗿'];
            console.log('[DBG sync_panels] doCompute (effectif après rAF) epoch=' + _epEff);
            if (window._logStep) window._logStep('[4] calculs (effectif)');
            else console.log('[4] calculs (effectif)');
            // groupe [4] reste ouvert — fermé à [4] calculs (retour)
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
            if (window._logStepEnd) window._logStepEnd(); // ferme groupe [4] effectif
            if (window._logStep) window._logStep('[4] calculs (retour)');
            else console.log('[4] calculs (retour)');
            if (window._logStepEnd) window._logStepEnd();
            if (result === null) return null;
            // emit = abonnés in-page (ex. loader_panels stocke lastComputePayload pour envoi différé à l'iframe scie à l'ouverture de l'onglet)
            IO_LISTENER.emit('compute:done', { DATA: window.DATA, result: result });
            if (isVisuMode) projectToVisu(window.DATA);
            // En mode scie_ (pas de draw visu), émettre l'ack de fin pour libérer l'UI
            // (loader/timeline rouge "calcul en cours" et reprise Three.js).
            if (!isVisuMode) IO_LISTENER.emit('flux:lastDrawn');
            // Rafraîchir les labels visu (albédo, flux, T°) après chaque calcul pour que l’onglet Visuel affiche le bon état
            window.updateFluxLabels('ProcessFinished');
            if (typeof window.updateTimeline === 'function') window.updateTimeline();
            var albedoEl = document.querySelector('[data-id="albedo_percent"]');
            console.log('[sync_panels] après ProcessFinished DOM albedo_percent=', albedoEl ? albedoEl.textContent : '(élément absent)');
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
        // Point d'entrée unique : config (📿☄️, ⚖️💧) puis calcul. Émis par visu (events.js) et par scie (sync:state).
        IO_LISTENER.on('config:applyThenCompute', function (payload) {
            var _epBefore = window.DATA && window.DATA['📜'] && window.DATA['📜']['🗿'];
            var _ticBefore = window.DATA && window.DATA['📜'] && window.DATA['📜']['📿💫'];
            console.log('[DBG sync_panels] config:applyThenCompute btn=' + payload.button + ' epoch=' + _epBefore + ' 📿💫=' + _ticBefore);
            window.DATA['📜']['🔘🕰'] = payload.button;
            window.getEpochDateConfig();
            var _epAfter = window.DATA && window.DATA['📜'] && window.DATA['📜']['🗿'];
            var _ticAfter = window.DATA && window.DATA['📜'] && window.DATA['📜']['📿💫'];
            console.log('[DBG sync_panels] après getEpochDateConfig epoch=' + _epAfter + ' 📿💫=' + _ticAfter + ((_epBefore !== _epAfter) ? ' ⚡TRANSITION' : ''));
            // Si getEpochDateConfig a détecté une transition d'époque, déléguer à setEpoch pour mettre
            // à jour l'UI (boutons, texture, currentEpochName) — évite le "nextEpoch en trop" visible
            if (_epAfter !== _epBefore && typeof window.setEpoch === 'function') {
                var _epochIdToName = {'⚫':'Corps Noir','🔥':'Hadéen','🦠':'Archéen','🥟':'Protérozoïque','⛄':'Boule de neige','🌿':'Paléozoïque','🦕':'Mésozoïque','🦣':'Cénozoïque','🐊':'Hyperthermie éocène','⛰':'Prélude glaciaire','🏔':'Grande Coupure','❄️':'Quaternaire','🚂':'Industriel','📱':"Aujourd'hui"};
                var _newEpochName = _epochIdToName[_epAfter] || _epAfter;
                console.log('[DBG sync_panels] ⚡ transition → setEpoch(' + _newEpochName + ')');
                window.setEpoch(_newEpochName);
                return;
            }
            window.runComputeInParent();
        }, 'sync_panels');

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

        // API appelée par shell quand scie envoie sync:state → appliquer DATA puis même chemin que visu
        window.applyStateFromScie = function (p) {
            applyToVisu(p, true);
            if (p.tuning) applyTuningPayload(p.tuning);
            // Synchro scie→visu : pas de clic bouton, on conserve le 🔘🕰 courant
            IO_LISTENER.emit('config:applyThenCompute', { button: window.DATA['📜']['🔘🕰'] });
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
                // Synchro scie→visu : pas de clic bouton, on conserve le 🔘🕰 courant
                IO_LISTENER.emit('config:applyThenCompute', { button: window.DATA['📜']['🔘🕰'] });
            }
        });
        window.addEventListener('message', function (event) {
            if (event.data.type !== 'sync:tuning') return;
            var p = event.data.payload;
            window.SYNC_STATE.lastRunRequestSource = 'scie:message:sync:tuning';
            console.log('[DBG sync_panels] message sync:tuning run=' + p.run + ' bary.CLOUD_SW=' + (p && p.baryByGroup ? p.baryByGroup.CLOUD_SW : 'n/a'));
            if (typeof window.pd === 'function') window.pd('onMessageSyncTuning', 'sync_panels.js', 'run=' + p.run + ' bary.CLOUD_SW=' + (p && p.baryByGroup ? p.baryByGroup.CLOUD_SW : 'n/a'));
            if (window.shell && window.shell.applyTuningFromScie) window.shell.applyTuningFromScie(p);
            else { applyTuningPayload(p); syncTuningToScie(p); if (p.run === true) window.runComputeInParent(); }
        });
        window.addEventListener('message', function (event) {
            if (event.data.type !== 'action:nextEpoch') return;
            window.togglePlotAnim();
        });

        IO_LISTENER.on('sync:state', function (payload) {
            if (payload.epochId !== undefined) window.SYNC_STATE.epochId = payload.epochId;
            if (payload.animEnabled !== undefined) window.SYNC_STATE.animEnabled = payload.animEnabled;
            if (payload.ticTime !== undefined) window.SYNC_STATE.ticTime = payload.ticTime;
            syncToScie(payload);
            console.log('[sync:state] run=' + payload.run + ' calculationInProgress=' + window.SYNC_STATE.calculationInProgress);
            if (payload.run === true) {
                // Appliquer l'état au DATA du contexte courant (parent) avant le calcul, sinon 🔬🌈/📿💫 non initialisés → NaN
                applyStateToData(payload);
                window.getEpochDateConfig();
                window.SYNC_STATE.calculationInProgress = false;
                window.runComputeInParent();
            }
        }, 'sync_panels');
        IO_LISTENER.on('sync:tuning', function (payload) {
            window.SYNC_STATE.lastRunRequestSource = 'visu:IO_LISTENER:sync:tuning';
            console.log('[DBG sync_panels] IO sync:tuning run=' + payload.run + ' bary.CLOUD_SW=' + (payload && payload.baryByGroup ? payload.baryByGroup.CLOUD_SW : 'n/a'));
            if (typeof window.pd === 'function') window.pd('onSyncTuning', 'sync_panels.js', 'run=' + payload.run + ' bary.CLOUD_SW=' + (payload && payload.baryByGroup ? payload.baryByGroup.CLOUD_SW : 'n/a'));
            applyTuningPayload(payload);
            syncTuningToScie(payload);
            if (payload.run === true) window.runComputeInParent();
        }, 'sync_panels');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSyncPanels);
    } else {
        initSyncPanels();
    }
})();
