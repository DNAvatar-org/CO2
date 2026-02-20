// File: sync_panels.js - Synchronisation état visu ↔ scie (iframe)
// Desc: État partagé epoch, anim, ticTime + exécution centralisée index.html → projection visu + scie
// Version 1.1.7
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

(function () {
    'use strict';

    window.SYNC_STATE = {
        epochId: '⚫',
        animEnabled: true,
        ticTime: 0
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

    function applyTuningPayload(payload) {
        if (!payload || !payload.updates || !Array.isArray(payload.updates)) return;
        if (!window.TUNING) return;
        payload.updates.forEach(function (u) {
            if (!u || !u.group || !u.key) return;
            if (!window.TUNING[u.group]) return;
            window.TUNING[u.group][u.key] = u.value;
        });
        if (window.TUNING.SOLVER && window.CONFIG_COMPUTE) {
            window.CONFIG_COMPUTE.tolMinWm2 = window.TUNING.SOLVER.TOL_MIN_WM2;
            window.CONFIG_COMPUTE.maxSearchStepK = window.TUNING.SOLVER.MAX_SEARCH_STEP_K;
            window.CONFIG_COMPUTE.maxSearchStepLargeK = window.TUNING.SOLVER.MAX_SEARCH_STEP_LARGE_K;
            window.CONFIG_COMPUTE.largeDeltaFactor = window.TUNING.SOLVER.LARGE_DELTA_FACTOR;
        }
        if (payload.baryPercent != null) {
            window.FINE_TUNING_BARY_PERCENT = payload.baryPercent;
        }
        if (payload.baryByGroup) {
            window.FINE_TUNING_BARY_PERCENT_BY_GROUP = window.FINE_TUNING_BARY_PERCENT_BY_GROUP || {};
            if (payload.baryByGroup.CLOUD_SW != null) window.FINE_TUNING_BARY_PERCENT_BY_GROUP.CLOUD_SW = payload.baryByGroup.CLOUD_SW;
            if (payload.baryByGroup.SOLVER != null) window.FINE_TUNING_BARY_PERCENT_BY_GROUP.SOLVER = payload.baryByGroup.SOLVER;
        }
    }

    function applyToVisu(payload, fromScie) {
        var visuPanel = document.getElementById('visu-panel');
        if (!payload) return;

        if (payload.epochId !== undefined) {
            window.SYNC_STATE.epochId = payload.epochId;
            if (!fromScie) {
                if (typeof window.setEpoch === 'function') window.setEpoch(payload.epochId);
            } else {
                var idx = window.TIMELINE ? window.TIMELINE.findIndex(function (item) { return item['📅'] === payload.epochId; }) : -1;
                if (window.DATA && idx >= 0) {
                    window.DATA['📅'] = window.TIMELINE[idx];
                    if (window.DATA['📜']) {
                        window.DATA['📜']['👉'] = idx;
                        window.DATA['📜']['🗿'] = payload.epochId;
                    }
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
            var animToggle = document.getElementById('plot-anim-toggle');
            if (animToggle) animToggle.classList.toggle('selected', payload.animEnabled);
            var animCb = document.getElementById('plot-anim-toggle-checkbox');
            if (animCb) animCb.checked = payload.animEnabled;
            if (window.DATA && window.DATA['🔘']) window.DATA['🔘']['🔘🎬'] = payload.animEnabled;
            window.isAnim = payload.animEnabled;
        }
        if (payload.ticTime !== undefined) {
            window.SYNC_STATE.ticTime = payload.ticTime;
            window.infoTimeMa = payload.ticTime * 50;
            if (window.DATA && window.DATA['📜']) window.DATA['📜']['📿💫'] = payload.ticTime;
            var infoTime = document.getElementById('info-time');
            if (infoTime) infoTime.textContent = '+' + (payload.ticTime * 50).toFixed(0) + ' Ma';
        }
    }

    function projectToVisu(DATA) {
        var spectral = window.getSpectralResultFromDATA();
        var T0 = DATA['🧮']['🧮🌡️'];
        var tempC = T0 - window.CONST.KELVIN_TO_CELSIUS;
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
        var sigma = (window.CONST && window.CONST.STEFAN_BOLTZMANN != null) ? window.CONST.STEFAN_BOLTZMANN : 5.670374419e-8;
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
        window.plotData.co2_ppm = co2_ppm;
        window.spectralConverged = true;
        window.spectralPrecisionTarget = 'max';
        window.showSpectralBackground = true;
        window.updatePlot(window.plotData);
        window.updateSpectralVisualization(window.plotData.current);
        window.updateFluxLabels('ProcessFinished');
    }

    function projectToScie(DATA) {
        getIframe().contentWindow.postMessage({ type: 'compute:done', DATA: DATA }, '*');
    }

    window.runComputeInParent = function () {
        var DATA = window.DATA;
        if (!DATA || !DATA['🧮'] || !DATA['🔘']) return Promise.resolve(null);
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
        window.calculationInProgress = true; // Pour plot.js resizeCanvasToPlot (skipReposition pendant dichotomie)
        if (!DATA['🔘']['🔘🎬']) {
            DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'];
        } else if (!DATA['🧮']['🧮🌡️'] || DATA['🧮']['🧮🌡️'] <= 0) {
            var adj = (DATA['📜']['🔺🌡️💫'] || 0) * (DATA['📜']['📿💫'] || 0);
            DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'] + adj;
        }
        if (window.pd) window.pd('runComputeInParent', 'sync_panels.js', 'epochId=' + epochId + ' anim=' + DATA['🔘']['🔘🎬'] + ' T_init=' + DATA['🧮']['🧮🌡️']);
        if (!window.initForConfig()) {
            window.calculationInProgress = false;
            return Promise.resolve(null);
        }
        // S'assurer que FluxManager a SOLAR_CONSTANT et GEOTHERMAL_FLUX (requis par updateFluxLabels)
        var epochId = DATA['📜']['🗿'];
        if (window.FluxManager && window.getGeologicalPeriodByName) {
            window.currentEpochName = window.currentEpochName || epochId;
            window.FluxManager.updateAllFluxes(epochId);
        }
        return window.computeRadiativeTransfer().then(function (result) {
            window.calculationInProgress = false;
            if (result === null) return null;
            window.CO2_EVENTS.emit('compute:done', { DATA: window.DATA, result: result });
            projectToVisu(window.DATA);
            projectToScie(window.DATA);
            return result;
        }).catch(function (e) {
            window.calculationInProgress = false;
            console.error('[runComputeInParent]', e);
            throw e;
        });
    };

    function initSyncPanels() {
        if (!window.displayConvergence) window.displayConvergence = function () {};
        window.syncToScie = syncToScie;

        window.addEventListener('message', function (event) {
            if (event.data.type !== 'sync:state') return;
            var p = event.data.payload;
            applyToVisu(p, true);
            window.runComputeInParent();
        });
        window.addEventListener('message', function (event) {
            if (!event.data || event.data.type !== 'sync:tuning') return;
            var p = event.data.payload;
            applyTuningPayload(p);
            if (p && p.run === true) window.runComputeInParent();
        });

        window.CO2_EVENTS.on('sync:state', function (payload) {
            if (payload.epochId !== undefined) window.SYNC_STATE.epochId = payload.epochId;
            if (payload.animEnabled !== undefined) window.SYNC_STATE.animEnabled = payload.animEnabled;
            if (payload.ticTime !== undefined) window.SYNC_STATE.ticTime = payload.ticTime;
            syncToScie(payload);
        });
        window.CO2_EVENTS.on('sync:tuning', function (payload) {
            applyTuningPayload(payload);
            syncTuningToScie(payload);
            if (payload && payload.run === true) window.runComputeInParent();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSyncPanels);
    } else {
        initSyncPanels();
    }
})();
