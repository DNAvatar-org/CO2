// File: loader_panels.js - Charge visu_radiatif.html et scie_radiatif.html dans les panels
// Desc: Fetch + injection avant chargement des scripts applicatifs
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Date: 2025-02-03

(function () {
    'use strict';
    const SCRIPTS = [
        'static/timeline/configTimeline.js',
        'static/compute/alphabet.js',
        'static/compute/dico.js',
        'organigramme/configOrganigramme.js',
        'static/event_bus.js',
        'static/sync_panels.js',
        'static/flux_manager.js',
        'static/tooltips.js',
        'static/modal.js',
        'static/patterns.js',
        'static/physics.js',
        'static/climate.js',
        'static/calculations_atm.js',
        'static/calculations_albedo.js',
        'organigramme/organigramme.js',
        'static/calculations_geology.js',
        'static/calculations_h2o.js',
        'static/calculations.js',
        'static/compute/compute.js',
        'static/compute/calculations_flux.js',
        'static/FPS/FPS.js',
        'static/courbes/plot.js',
        'static/layout.js',
        'static/integrateEds.js',
        'static/debug.js',
        'static/events.js',
        'static/timeline/timeline.js',
        'static/main.js'
    ];

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.body.appendChild(s);
        });
    }

    function loadScriptsSequentially(list) {
        if (list.length === 0) return Promise.resolve();
        return loadScript(list[0]).then(function () { return loadScriptsSequentially(list.slice(1)); });
    }

    Promise.all([
        fetch('visu_radiatif.html').then(function (r) { return r.text(); }),
        fetch('scie_radiatif.html').then(function (r) { return r.text(); })
    ]).then(function (results) {
        const visuPanel = document.getElementById('visu-panel');
        const sciePanel = document.getElementById('scie-panel');
        if (visuPanel) visuPanel.innerHTML = results[0];
        if (sciePanel) sciePanel.innerHTML = results[1];
        return loadScriptsSequentially(SCRIPTS);
    }).then(function () {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAfterLoad);
        } else {
            initAfterLoad();
        }
    }).catch(function (err) {
        console.error('[loader_panels]', err);
        document.getElementById('visu-panel').innerHTML = '<p style="color:#f00;padding:20px;">Erreur chargement visu_radiatif.html</p>';
    });

    window.togglePlotAnim = function () {
        var animButton = document.getElementById('plot-anim-toggle');
        if (animButton) {
            var isSelected = animButton.classList.contains('selected');
            animButton.classList.toggle('selected');
            var cb = document.getElementById('plot-anim-toggle-checkbox');
            if (!cb) {
                cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.id = 'plot-anim-toggle-checkbox';
                cb.style.display = 'none';
                document.body.appendChild(cb);
            }
            cb.checked = !isSelected;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
            window.syncToScie({ animEnabled: !isSelected });
        }
    };

    window.switchTab = function (name) {
        document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
        document.querySelectorAll('.tabs-bar button').forEach(function (b) { b.classList.remove('active'); });
        var panel = document.getElementById(name + '-panel');
        var btn = document.getElementById('tab-' + name);
        if (panel) panel.classList.add('active');
        if (btn) btn.classList.add('active');
        if (name === 'visu' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new Event('resize'));
        }
        // Scie : renvoyer le dernier compute si dispo (calculs visibles sans clic)
        if (name === 'scie' && window._lastComputePayloadForScie && window._lastComputePayloadForScie.DATA) {
            var iframe = document.getElementById('scie-iframe');
            if (iframe && iframe.contentWindow) {
                try { iframe.contentWindow.postMessage({ type: 'compute:done', DATA: window._lastComputePayloadForScie.DATA }, '*'); } catch (e) {}
            }
        }
    };

    window.isVisuPanelActive = function () {
        var visu = document.getElementById('visu-panel');
        return visu && visu.classList.contains('active');
    };

    function initAfterLoad() {
        if (typeof window.initCharsForDisplay === 'function') window.initCharsForDisplay();
        if (typeof window.configOrganigramme !== 'undefined' && typeof window.TIMELINE !== 'undefined') {
            window.configOrganigramme.timeline = window.TIMELINE.map(function (item) {
                if (item['📅']) {
                    const epochId = item['📅'];
                    let epochName = epochId;
                    if (typeof window.CHARS_DESC !== 'undefined' && window.CHARS_DESC[epochId]) {
                        epochName = window.CHARS_DESC[epochId];
                    }
                    const epochNameMap = {
                        '⚫': 'Corps noir', '🔥': 'Hadéen', '🦠': 'Archéen', '🦕': 'Mésozoïque',
                        '🦴': 'Paléozoïque', '🦣': 'Cénozoïque', '🚂': 'Industriel', '📱': 'Aujourd\'hui'
                    };
                    if (epochNameMap[epochId]) epochName = epochNameMap[epochId];
                    // ▶ = début (années), ◀ = fin → startYears, endYears pour getGeologicalPeriodByName et formatYears
                    const startYears = item['▶'] != null ? item['▶'] : item.startYears;
                    const endYears = item['◀'] != null ? item['◀'] : item.endYears;
                    return { ...item, type: 'epoch', name: epochName, id: epochId, startYears, endYears };
                }
                return { ...item, type: 'separator' };
            });
        }
        var animButton = document.getElementById('plot-anim-toggle');
        if (animButton) {
            animButton.classList.add('selected');
            var cb = document.getElementById('plot-anim-toggle-checkbox');
            if (!cb) {
                cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.id = 'plot-anim-toggle-checkbox';
                cb.checked = true;
                cb.style.display = 'none';
                document.body.appendChild(cb);
            }
        }
        var lastComputePayload = null;
        if (window.CO2_EVENTS) {
            window.CO2_EVENTS.on('compute:progress', function (payload) {
                if (typeof window.updateFluxLabels !== 'function' || !payload || !window.DATA) return;
                var DATA = window.DATA;
                var T0 = payload.T0;
                var total_flux = payload.total_flux;
                if (T0 == null || total_flux == null) return;
                var CONST = window.CONST || { KELVIN_TO_CELSIUS: 273.15 };
                var h2o_frac = (DATA['💧'] && DATA['💧']['🍰🫧💧'] != null) ? DATA['💧']['🍰🫧💧'] : 0;
                var h2o_meteorites = (typeof window.h2oTotalFromMeteorites !== 'undefined') ? window.h2oTotalFromMeteorites : 0;
                window.h2oVaporPercent = Math.min(100, Math.max(0, h2o_frac * 100 + h2o_meteorites));
                if (!window.plotData) window.plotData = {};
                window.plotData.co2_ppm = (DATA['🫧'] && DATA['🫧']['🍰🫧🏭'] != null ? DATA['🫧']['🍰🫧🏭'] : 0) * 1e6;
                window.plotData.ch4_ppm = (DATA['🫧'] && DATA['🫧']['🍰🫧⛽'] != null ? DATA['🫧']['🍰🫧⛽'] : 0) * 1e6;
                var fluxData = {
                    T0: T0,
                    temp_surface: T0,
                    temp_surface_c: T0 - CONST.KELVIN_TO_CELSIUS,
                    total_flux: total_flux,
                    albedo: DATA['🪩'] && DATA['🪩']['🍰🪩📿'] != null ? DATA['🪩']['🍰🪩📿'] : 0,
                    cloud_coverage: DATA['🪩'] && DATA['🪩']['☁️'] != null ? DATA['🪩']['☁️'] : 0,
                    co2_ppm: window.plotData.co2_ppm,
                    ch4_ppm: window.plotData.ch4_ppm
                };
                try { window.updateFluxLabels(fluxData); } catch (e) { console.error('[compute:progress] updateFluxLabels', e); }
            });
            window.CO2_EVENTS.on('compute:done', function (payload) {
                if (payload && payload.DATA) {
                    lastComputePayload = payload;
                    window._lastComputePayloadForScie = payload;
                }
                var iframe = document.getElementById('scie-iframe');
                if (iframe && iframe.contentWindow && payload && payload.DATA) {
                    try { iframe.contentWindow.postMessage({ type: 'compute:done', DATA: payload.DATA }, '*'); } catch (e) {}
                }
            });
        }
        // Mettre à jour les actions 🕰 (météorite, impact, etc.) après injection du contenu visu
        window.updateEpochActions();
        var scieIframe = document.getElementById('scie-iframe');
        function sendComputeToScie() {
            if (lastComputePayload && lastComputePayload.DATA && scieIframe.contentWindow) {
                try { scieIframe.contentWindow.postMessage({ type: 'compute:done', DATA: lastComputePayload.DATA }, '*'); } catch (e) {}
            } else if (window.runComputeInParent) {
                window.runComputeInParent();
            }
        }
        scieIframe.addEventListener('load', function () {
            window.syncToScie({ epochId: '⚫', animEnabled: true, ticTime: 0 });
            // Décaler pour laisser setEpoch (RAF+RAF+setTimeout) s'exécuter avant runComputeInParent
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    sendComputeToScie();
                });
            });
        });
        window.syncToScie({ epochId: '⚫', animEnabled: true, ticTime: 0 });
        if (scieIframe.contentDocument && scieIframe.contentDocument.readyState === 'complete') {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    sendComputeToScie();
                });
            });
        }
        initTipeeeRollover();
        // Forcer resize au chargement : layout, plot et flux se calibrent correctement
        // (switchTab ne dispatch resize que lors d'un changement d'onglet manuel)
        window.dispatchEvent(new Event('resize'));
    }

    function initTipeeeRollover() {
        var tipeeeButtons = document.querySelectorAll('.tipeee-btn');
        tipeeeButtons.forEach(function (button) {
            var hoverTimeout = null;
            var isHovered = false;
            button.addEventListener('mouseenter', function () {
                isHovered = true;
                // UX : 500ms avant affichage hover (éviter flash au survol rapide)
                hoverTimeout = setTimeout(function () {
                    if (isHovered) button.classList.add('hover-active');
                }, 500);
            });
            button.addEventListener('mouseleave', function () {
                isHovered = false;
                if (hoverTimeout) { clearTimeout(hoverTimeout); hoverTimeout = null; }
                button.classList.remove('hover-active');
            });
        });
    }
})();
