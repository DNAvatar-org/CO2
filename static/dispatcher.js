// File: dispatcher.js - Dispatch messages API ↔ pages (postMessage scie↔parent, CO2_EVENTS)
// Desc: Centralise le routage cycleCalcul / compute:done entre iframe scie et visu ; sync plot depuis DATA.
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. See LICENSE_HEADER.txt for full terms.
// Logs: v1.0.0 extraction depuis loader_panels (postMessage + CO2_EVENTS + syncPlot)
// - v1.0.1: plotData.current autonome (z_range, lambda_range) pour éviter mix avec DATA['📊'] écrasé avant .then()

(function () {
    'use strict';

    var lastComputePayload = null;
    var scieIframe = null;

    function logFluxDebut(D) {
        /* Réservé debug : contenu bins/T0/total_flux/lambda/topFlux. Appelé avant syncPlot. */
        if (!D || !D['📊']) return;
    }

    function syncPlotDataFromDATAAndUpdatePlot() {
        var D = window.DATA;
        if (!D) return;
        if (!D['📊'] || !D['📊'].lambda_range || !D['📊'].upward_flux) return;
        if (!window.plotData || typeof window.updatePlot !== 'function') return;
        logFluxDebut(D);
        window.plotData.lambda_range = D['📊'].lambda_range;
        window.plotData.lambda_weights = D['📊'].lambda_weights;
        var T0_K = (D['🧮'] && D['🧮']['🧮🌡️'] != null) ? D['🧮']['🧮🌡️'] : 288;
        var totalFlux = (D['📊'].total_flux != null) ? D['📊'].total_flux : 0;
        var sigma = (window.CONST && window.CONST.STEFAN_BOLTZMANN) ? window.CONST.STEFAN_BOLTZMANN : 5.670374419e-8;
        var T_eff = (totalFlux > 0 && sigma > 0) ? Math.pow(totalFlux / sigma, 0.25) : T0_K;
        // plotData.current doit être autonome : z_range/lambda_range inclus pour que le callback async de updatePlot
        // n'ait pas à relire window.DATA['📊'] (risque d'écrasement avant le .then() → mauvais plot affiché).
        window.plotData.current = {
            upward_flux: D['📊'].upward_flux,
            T0: T0_K,
            effective_temperature: T_eff,
            total_flux: totalFlux,
            z_range: D['📊'].z_range || null,
            lambda_range: D['📊'].lambda_range || null
        };
        window.plotData.temp_surface = T0_K;
        window.plotData.temp_surface_c = T0_K - 273.15;
        var bins = (D['📊'].lambda_range && D['📊'].lambda_range.length) || 0;
        var layers = (D['📊'].z_range && D['📊'].z_range.length) || (D['🧮'] && D['🧮']['🔬🫧']) || 0;
        var nLayersFlux = (D['📊'].upward_flux && D['📊'].upward_flux.length) || 0;
        console.log('[plot] VA ÊTRE DESSINÉ → tableau ' + bins + '×' + (nLayersFlux || layers) + ' (lambda×layers) T0=' + (T0_K != null ? T0_K.toFixed(1) : '?'));
        try { window.updatePlot(window.plotData); } catch (e) { console.error('[cycleCalcul] updatePlot', e); }
    }

    function onMessage(event) {
        if (event.data && event.data.type === 'cycleCalcul') {
            var iframe = document.getElementById('scie-iframe');
            var fromOurIframe = iframe && event.source === iframe.contentWindow;
            if (fromOurIframe && event.data.DATA && window.DATA) {
                var src = event.data.DATA;
                var recvBins = (src['📊'] && src['📊'].lambda_range) ? src['📊'].lambda_range.length : 0;
                var recvLayers = (src['📊'] && src['📊'].upward_flux) ? src['📊'].upward_flux.length : 0;
                console.log('[plot] REÇU cycleCalcul → tableau ' + recvBins + '×' + recvLayers + ' (ce qui est envoyé)');
                logFluxDebut(event.data.DATA);
                ['🧮', '🪩', '🫧', '💧', '📛', '📜', '📊'].forEach(function (k) {
                    if (src[k]) {
                        if (!window.DATA[k]) window.DATA[k] = {};
                        Object.keys(src[k]).forEach(function (k2) { window.DATA[k][k2] = src[k][k2]; });
                    }
                });
                if (event.data.h2oVaporPercent != null) window.h2oVaporPercent = event.data.h2oVaporPercent;
                window.waterVaporEnabled = window.h2oVaporPercent > 0;
                var epochId = (window.DATA['📜'] && window.DATA['📜']['🗿']) || '⚫';
                if (epochId && window.configOrganigramme && window.configOrganigramme.timeline) {
                    var ep = window.configOrganigramme.timeline.find(function (e) { return e.type === 'epoch' && e.id === epochId; });
                    if (ep) window.currentEpochName = ep.name;
                }
                if (typeof window.updateFluxLabels === 'function') {
                    try { window.updateFluxLabels('cycleCalcul'); } catch (e) { console.error('[cycleCalcul] updateFluxLabels', e); }
                }
                syncPlotDataFromDATAAndUpdatePlot();
            }
        }
        if (event.data && event.data.type === 'compute:done') {
            var iframe = document.getElementById('scie-iframe');
            var fromOurIframe = iframe && event.source === iframe.contentWindow;
            if (fromOurIframe && event.data.DATA && window.DATA) {
                var src = event.data.DATA;
                var doneBins = (src['📊'] && src['📊'].lambda_range) ? src['📊'].lambda_range.length : 0;
                var doneLayers = (src['📊'] && src['📊'].upward_flux) ? src['📊'].upward_flux.length : 0;
                console.log('[plot] REÇU compute:done → tableau ' + doneBins + '×' + doneLayers);
                ['🧮', '🪩', '🫧', '💧', '📛', '📜', '📊', '📅', '⚖️', '🔘', '🎚️'].forEach(function (k) {
                    if (src[k]) {
                        if (!window.DATA[k]) window.DATA[k] = {};
                        Object.keys(src[k]).forEach(function (k2) { window.DATA[k][k2] = src[k][k2]; });
                    }
                });
                lastComputePayload = { DATA: window.DATA };
                window._lastComputePayloadForScie = lastComputePayload;
                if (window.CO2_EVENTS) window.CO2_EVENTS.emit('compute:done', { DATA: window.DATA });
                if (typeof window.projectToVisu === 'function') window.projectToVisu(window.DATA);
                if (window.shell && window.shell.dataInput) window.shell.dataInput({ type: 'compute:done', DATA: window.DATA });
                window.calculationInProgress = false;
                if (window._computeRunDeferred && window._computeRunDeferred.resolve) {
                    window._computeRunDeferred.resolve({ DATA: window.DATA });
                    window._computeRunDeferred = null;
                }
                /* Rafraîchir le plot avec l'état final (convergence terminée). */
                if (typeof window.updateFluxLabels === 'function') {
                    try { window.updateFluxLabels('compute:done'); } catch (e) { console.error('[compute:done] updateFluxLabels', e); }
                }
                syncPlotDataFromDATAAndUpdatePlot();
                /* applyResizeEvent appelé dans projectToVisu (rAF) pour un seul redraw. */
            }
        }
    }

    function sendComputeToScie() {
        if (lastComputePayload && lastComputePayload.DATA && scieIframe && scieIframe.contentWindow) {
            try { scieIframe.contentWindow.postMessage({ type: 'compute:done', DATA: lastComputePayload.DATA }, '*'); } catch (e) {}
        } else if (window.runComputeInParent) {
            window.runComputeInParent();
        }
    }

    /** À appeler après injection des panels (ex. initAfterLoad du loader). Enregistre postMessage et CO2_EVENTS. */
    function initDispatcher() {
        scieIframe = document.getElementById('scie-iframe');
        window.addEventListener('message', onMessage);
        if (window.CO2_EVENTS) {
            window.CO2_EVENTS.on('cycleCalcul', function () {
                if (typeof window.updateFluxLabels === 'function') {
                    try { window.updateFluxLabels('cycleCalcul'); } catch (e) { console.error('[cycleCalcul] updateFluxLabels', e); }
                }
                syncPlotDataFromDATAAndUpdatePlot();
            });
            window.CO2_EVENTS.on('compute:progress', function (payload) {
                if (payload && window.DATA && window.CO2_EVENTS) window.CO2_EVENTS.emit('cycleCalcul');
            });
            window.CO2_EVENTS.on('compute:done', function (payload) {
                if (payload && payload.DATA) {
                    lastComputePayload = payload;
                    window._lastComputePayloadForScie = payload;
                }
            });
        }
        window.sendComputeToScie = sendComputeToScie;
        window.syncPlotDataFromDATAAndUpdatePlot = syncPlotDataFromDATAAndUpdatePlot;
    }

    window.initDispatcher = initDispatcher;
})();
