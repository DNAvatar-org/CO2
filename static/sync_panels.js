// File: sync_panels.js - Synchronisation état visu ↔ scie (iframe)
// Desc: État partagé epoch, anim, ticTime + exécution centralisée index.html → projection visu + scie
// Version 1.1.4
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-02-03
// Logs:
// - v1.1.1: passage global _REGLE_JS_CRASH (pas de if abusifs, pas de fallbacks)
// - v1.1.2: T0 init quand anim+T<=0 ; displayConvergence no-op parent ; _lastCycleRef guard
// - v1.1.3: Guards null pour plot-anim-toggle, plot-anim-toggle-checkbox, info-time, visuPanel, DATA
// - v1.1.4: runComputeInParent init DATA[📅]/[📜] si race avec setEpoch ; guard initForConfig false

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
                    var ep = window.configOrganigramme.timeline.find(function (e) { return e.type === 'epoch' && e.id === payload.epochId; });
                    window.currentEpochName = ep.name;
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
        var co2_ppm = DATA['🫧']['🍰🫧🏭'] * 1e6;
        window.plotData.lambda_range = spectral.lambda_range;
        window.plotData.lambda_weights = spectral.lambda_weights;
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
            effective_temperature: window.getEffectiveTemperatureNoGreenhouse()
        };
        window.plotData.temp_surface_c = tempC;
        window.plotData.co2_ppm = co2_ppm;
        window.spectralConverged = true;
        window.spectralPrecisionTarget = 'max';
        window.showSpectralBackground = true;
        window.updatePlot(window.plotData);
        window.updateSpectralVisualization(window.plotData.current);
        window.updateFluxLabels(window.plotData);
    }

    function projectToScie(DATA) {
        getIframe().contentWindow.postMessage({ type: 'compute:done', DATA: DATA }, '*');
    }

    window.runComputeInParent = function () {
        var DATA = window.DATA;
        if (!DATA || !DATA['🧮'] || !DATA['🔘']) return;
        // S'assurer que DATA['📅'] et DATA['📜'] sont initialisés (race avec setEpoch au chargement)
        var epochId = (DATA['📜'] && DATA['📜']['🗿']) || (window.SYNC_STATE && window.SYNC_STATE.epochId) || '⚫';
        var idx = window.TIMELINE ? window.TIMELINE.findIndex(function (item) { return item['📅'] === epochId; }) : -1;
        if (idx >= 0) {
            DATA['📅'] = window.TIMELINE[idx];
            if (!DATA['📜']) DATA['📜'] = {};
            DATA['📜']['👉'] = idx;
            DATA['📜']['🗿'] = epochId;
        } else {
            return; // TIMELINE non prêt ou époque invalide
        }
        DATA['🧮']['previous'] = [];
        DATA['🧮']['🧮🔄🌊'] = 0;
        DATA['🧮']['🧮🔄🪩'] = 0;
        if (!DATA['🔘']['🔘🎬']) {
            DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'];
        } else if (!DATA['🧮']['🧮🌡️'] || DATA['🧮']['🧮🌡️'] <= 0) {
            var adj = (DATA['📜']['🔺🌡️💫'] || 0) * (DATA['📜']['📿💫'] || 0);
            DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'] + adj;
        }
        if (!window.initForConfig()) return;
        // S'assurer que FluxManager a SOLAR_CONSTANT et GEOTHERMAL_FLUX (requis par updateFluxLabels)
        var epochId = DATA['📜']['🗿'];
        if (window.FluxManager && window.getGeologicalPeriodByName) {
            window.currentEpochName = window.currentEpochName || epochId;
            window.FluxManager.updateAllFluxes(epochId);
        }
        window.computeRadiativeTransfer().then(function (result) {
            if (result === null) return;
            window.CO2_EVENTS.emit('compute:done', { DATA: window.DATA, result: result });
            projectToVisu(window.DATA);
            projectToScie(window.DATA);
        }).catch(function (e) { console.error('[runComputeInParent]', e); });
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

        window.CO2_EVENTS.on('sync:state', function (payload) {
            if (payload.epochId !== undefined) window.SYNC_STATE.epochId = payload.epochId;
            if (payload.animEnabled !== undefined) window.SYNC_STATE.animEnabled = payload.animEnabled;
            if (payload.ticTime !== undefined) window.SYNC_STATE.ticTime = payload.ticTime;
            syncToScie(payload);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSyncPanels);
    } else {
        initSyncPanels();
    }
})();
