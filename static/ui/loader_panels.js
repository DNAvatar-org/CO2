// File: static/ui/loader_panels.js - Charge html/visu_radiatif.html et html/scie_radiatif.html dans les panels
// Desc: Fetch + injection avant chargement des scripts ; loader graphique listing modules (vert = chargé)
// Version 1.1.14
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Date: March 2026
// Logs: v1.1.14 EPOCH_ID_TO_NAME 🐊 « Éocène »
// Logs: v1.1.13 DEBUG_TIMELINE_HIDDEN → pdTrace (TIMELINE epochs)
// Logs: v1.1.12 scie_hysteresis_search.js avant sync_panels (window.HYSTERESIS parent pour hystUnlockIce)
// Logs: v1.0.2 délai 250ms avant 1er compute ; v1.1.0 loader graphique ; v1.1.1 ordre script avant footer + timeout 30s
// - v1.1.2: IO_LISTENER.compute:progress: supprime log debug + double receive (compute:progress n'arrive que depuis scie_/non-anim)
// - v1.1.3: visu_+anim : compute:progress déclenche displayDichotomyStep puis plot:drawn ; scie_/non-anim garde cycleCalcul léger
// - v1.1.4: non-anim : avanceTic() sur chaque tic (disque creux en cases) ; show/hideComputeLoader
// - v1.1.5: clic direct = overlay (texte rouge) + body cursor wait uniquement ; anim = idem + disque creux
// - v1.1.6: curseur wait via class compute-loading (html+body) pour résister en anim
// - v1.1.7: scheduleInitialCompute() appelé systématiquement en fin initAfterLoad pour garantir [4] après [3]
// - v1.1.8: garde updateEpochActions si events.js pas encore chargé
// - v1.1.10: EPOCH_ID_TO_NAME 🐊 « Éocène »
// - v1.1.11: retrait onglet Hysteresis (switchTab ne gère plus hysteresis-panel-active)
// - v1.1.9: fine_tuning_bounds.js + tuning.js après initDATA (FINE_TUNING_BOUNDS + fillDataTuningFromBary côté visu_)
// Ordre: index.html charge plotly + three.min.js ; puis ce loader injecte HTML et charge SCRIPTS ci-dessous.
// Fin Three.js (texture + sphère) : window.IO_LISTENER.on('three:ready', fn) (payload: { hasTexture, canvas }).

(function () {
    'use strict';
    const SCRIPTS = [
        'static/debug.js',
        '../API_BILAN/config/model_tuning.js',
        '../API_BILAN/config/model_tuning_biblio.js',
        '../API_BILAN/config/configTimeline.js',
        'static/compute/alphabet.js',
        'static/compute/dico.js',
        '../API_BILAN/data/initDATA.js',
        '../API_BILAN/config/fine_tuning_bounds.js',
        '../API_BILAN/tuning.js',
        'organigramme/configOrganigramme.js',
        '../API_BILAN/event_bus.js',
        '../API_BILAN/convergence/compute.js',
        'static/compute/visu_/flux_manager.js',
        'static/ui/tooltips.js',
        'static/ui/modal.js',
        'static/courbes/patterns.js',
        '../API_BILAN/physics/physics.js',
        'static/compute/visu_/log_display.js',
        '../API_BILAN/data/hitran_lines_CO2.js',
        '../API_BILAN/data/hitran_lines_H2O.js',
        '../API_BILAN/data/hitran_lines_CH4.js',
        '../API_BILAN/spectroscopy/hitran.js',
        '../API_BILAN/physics/climate.js',
        '../API_BILAN/atmosphere/calculations_atm.js',
        '../API_BILAN/albedo/calculations_albedo.js',
        'organigramme/organigramme.js',
        '../API_BILAN/geology/calculations_geology.js',
        '../API_BILAN/h2o/calculations_h2o.js',
        '../API_BILAN/co2/calculations_co2.js',
        '../API_BILAN/radiative/calculations.js',
        '../API_BILAN/convergence/calculations_flux.js',
        'static/compute/scie_/scie_convergence.js',
        'static/compute/scie_/scie_hysteresis_search.js',
        'static/sync_panels.js',
        '../API_BILAN/callback_stack.js',
        '../API_BILAN/api.js',
        '../API_BILAN/receiver.js',
        'static/shell.js',
        'static/FPS/FPS.js',
        'static/courbes/plot.js',
        'static/ui/layout.js',
        'static/timeline/integrateEds.js',
        'static/timeline/events.js',
        'organigramme/timeline.js',
        'static/ui/main.js'
    ];

    var loaderListEl = document.getElementById('app-loader-list');
    var loaderOverlay = document.getElementById('app-loader');
    var loaderItems = [];

    function labelFromPath(path) {
        var i = path.lastIndexOf('/');
        return i >= 0 ? path.slice(i + 1) : path;
    }

    function initLoaderUI() {
        if (!loaderListEl) return;
        var li = document.createElement('li');
        li.setAttribute('data-phase', 'html');
        li.textContent = 'HTML visu + scie';
        loaderListEl.appendChild(li);
        loaderItems.push({ el: li, phase: 'html' });
        SCRIPTS.forEach(function (src) {
            li = document.createElement('li');
            li.setAttribute('data-src', src);
            li.textContent = labelFromPath(src);
            loaderListEl.appendChild(li);
            loaderItems.push({ el: li, src: src });
        });
    }

    function setLoaded(index) {
        if (loaderItems[index] && loaderItems[index].el) loaderItems[index].el.classList.add('loaded');
    }

    function hideLoader() {
        if (loaderOverlay) loaderOverlay.classList.add('hidden');
    }

    function loadScript(src, index) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.onload = function () { setLoaded(index); resolve(); };
            s.onerror = reject;
            document.body.appendChild(s);
        });
    }

    function loadScriptsSequentially(list, startIndex) {
        var i = startIndex || 0;
        if (list.length === 0) return Promise.resolve();
        return loadScript(list[0], i).then(function () { return loadScriptsSequentially(list.slice(1), i + 1); });
    }

    initLoaderUI();

    var loaderDone = false;
    var LOADER_TIMEOUT_MS = 30000;
    var timeoutId = setTimeout(function () {
        if (loaderDone) return;
        loaderDone = true;
        if (loaderOverlay && !loaderOverlay.classList.contains('hidden')) {
            loaderOverlay.classList.add('hidden');
            var v = document.getElementById('visu-panel');
            if (v) v.innerHTML = '<p style="color:#f00;padding:20px;">Délai dépassé (vérifier réseau ou console).</p>';
        }
    }, LOADER_TIMEOUT_MS);

    Promise.all([
        fetch('html/visu_radiatif.html').then(function (r) { return r.text(); }),
        fetch('html/scie_radiatif.html').then(function (r) { return r.text(); })
    ]).then(function (results) {
        setLoaded(0);
        var visuPanel = document.getElementById('visu-panel');
        var sciePanel = document.getElementById('scie-panel');
        if (visuPanel) visuPanel.innerHTML = results[0];
        if (sciePanel) sciePanel.innerHTML = results[1];
        return loadScriptsSequentially(SCRIPTS, 1);
    }).then(function () {
        loaderDone = true;
        clearTimeout(timeoutId);
        hideLoader();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAfterLoad);
        } else {
            initAfterLoad();
        }
    }).catch(function (err) {
        loaderDone = true;
        clearTimeout(timeoutId);
        console.error('[loader_panels]', err);
        if (loaderOverlay) loaderOverlay.classList.add('hidden');
        var v = document.getElementById('visu-panel');
        if (v) v.innerHTML = '<p style="color:#f00;padding:20px;">Erreur chargement</p>';
    });

    // Mapping 📅 → nom d'époque (pour togglePlotAnim : raw TIMELINE n'a pas .name)
    var EPOCH_ID_TO_NAME = { '⚫': 'Corps Noir', '🔥': 'Hadéen', '🦠': 'Archéen', '🥟': 'Protérozoïque', '⛄': 'Boule de neige', '🌿': 'Paléozoïque', '🦕': 'Mésozoïque', '🦣': 'Cénozoïque', '🐊': 'Éocène', 'hysteresis 1': 'hysteresis 1', 'hysteresis 2': 'hysteresis 2', '🏔': 'Grande Coupure', '❄️': 'Quaternaire', '🚂': 'Industriel', '📱': 'Aujourd\'hui' };
    function nextEpochName(nextItem, nextId) {
        return nextItem.name || EPOCH_ID_TO_NAME[nextId] || (window.CHARS_DESC && window.CHARS_DESC[nextId]) || nextId;
    }
    // Bouton animation = bouton normal (pas on/off) : clic = mode anim + prochaine époque (via shell). Transition en animation du curseur timeline puis setEpoch.
    window.togglePlotAnim = function () {
        if (typeof window.hideTooltip === 'function') window.hideTooltip();
        if (window.DATA && window.DATA['🔘']) window.DATA['🔘']['🔘🎞'] = true;
        var cb = document.getElementById('plot-anim-toggle-checkbox');
        if (cb) cb.checked = true;
        var applyNextEpoch = function (idx, nextName, useShell) {
            if (typeof window.animateTimelineCursorToEpoch === 'function') {
                window.animateTimelineCursorToEpoch(idx, 400, function () {
                    if (useShell && window.shell && window.shell.setEpoch) window.shell.setEpoch(nextName);
                    else if (typeof window.setEpoch === 'function') window.setEpoch(nextName);
                });
            } else {
                if (useShell && window.shell && window.shell.setEpoch) window.shell.setEpoch(nextName);
                else if (typeof window.setEpoch === 'function') window.setEpoch(nextName);
            }
        };
        if (window.shell && window.shell.setState) {
            window.shell.setState({ animEnabled: true });
            if (window.DATA && window.DATA['📜'] && typeof window.TIMELINE !== 'undefined' && window.TIMELINE.length) {
                var cur = window.DATA['📜']['👉'];
                if (typeof cur !== 'number') cur = 0;
                var idx = cur + 1;
                while (idx < window.TIMELINE.length && !window.TIMELINE[idx]['📅']) idx++;
                if (idx >= window.TIMELINE.length) idx = 0;
                while (idx < window.TIMELINE.length && !window.TIMELINE[idx]['📅']) idx++;
                var nextItem = window.TIMELINE[idx];
                var nextId = nextItem['📅'];
                var nextName = nextEpochName(nextItem, nextId);
                applyNextEpoch(idx, nextName, true);
            }
        } else {
            window.syncToScie({ animEnabled: true });
            if (window.DATA && window.DATA['📜'] && typeof window.TIMELINE !== 'undefined' && window.TIMELINE.length) {
                var cur = window.DATA['📜']['👉'];
                if (typeof cur !== 'number') cur = 0;
                var idx = cur + 1;
                while (idx < window.TIMELINE.length && !window.TIMELINE[idx]['📅']) idx++;
                if (idx >= window.TIMELINE.length) idx = 0;
                while (idx < window.TIMELINE.length && !window.TIMELINE[idx]['📅']) idx++;
                var nextItem = window.TIMELINE[idx];
                var nextId = nextItem['📅'];
                var nextName = nextEpochName(nextItem, nextId);
                applyNextEpoch(idx, nextName, false);
            }
        }
    };

    // Clic sur un bouton époque = sans animation (via shell) ; ticTime remis à 0
    window.setEpochFromEpochButton = function (epochId) {
        if (window.DATA && window.DATA['🔘']) window.DATA['🔘']['🔘🎞'] = false;
        var cb = document.getElementById('plot-anim-toggle-checkbox');
        if (cb) cb.checked = false;
        if (window.shell && window.shell.setState) {
            window.shell.setState({ animEnabled: false, epochId: epochId, ticTime: 0 });
        } else {
            window.syncToScie({ animEnabled: false, ticTime: 0 });
            if (typeof window.setEpoch === 'function') window.setEpoch(epochId);
        }
    };

    /** Redimensionne l'iframe scie à la hauteur de son contenu pour une seule barre de scroll (body index). */
    window.resizeScieIframe = function () {
        var iframe = document.getElementById('scie-iframe');
        if (!iframe || !iframe.contentDocument) return;
        try {
            var doc = iframe.contentDocument;
            var h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight, doc.body.offsetHeight || 0);
            iframe.style.height = (h + 8) + 'px';
        } catch (e) {}
    };

    window.switchTab = function (name) {
        document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
        document.querySelectorAll('.tabs-bar button').forEach(function (b) { b.classList.remove('active'); });
        if (name === 'scie') document.body.classList.add('scie-panel-active'); else document.body.classList.remove('scie-panel-active');
        var panel = document.getElementById(name + '-panel');
        var btn = document.getElementById('tab-' + name);
        if (panel) panel.classList.add('active');
        if (btn) btn.classList.add('active');
        if ((name === 'visu' || name === 'scie') && window.shell && window.shell.setCurrentPanel) window.shell.setCurrentPanel(name);
        if (name === 'visu') {
            if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('resize'));
            if (window.DATA && window.DATA['🧮'] && typeof window.projectToVisu === 'function') window.projectToVisu(window.DATA);
        }
        if (name === 'scie') {
            var iframe = document.getElementById('scie-iframe');
            if (iframe && iframe.contentWindow) {
                var epochId = (window.DATA && window.DATA['📜'] && window.DATA['📜']['🗿']) || (window.SYNC_STATE && window.SYNC_STATE.epochId) || '⚫';
                var animEnabled = (window.SYNC_STATE && window.SYNC_STATE.animEnabled !== undefined) ? window.SYNC_STATE.animEnabled : false;
                var ticTime = (window.SYNC_STATE && window.SYNC_STATE.ticTime !== undefined) ? window.SYNC_STATE.ticTime : 0;
                try {
                    iframe.contentWindow.postMessage({ type: 'sync:state', payload: { epochId: epochId, animEnabled: animEnabled, ticTime: ticTime } }, '*');
                } catch (e) {}
                var dataToSend = (window.DATA && window.DATA['🧮']) ? window.DATA : (window._lastComputePayloadForScie && window._lastComputePayloadForScie.DATA) ? window._lastComputePayloadForScie.DATA : null;
                if (dataToSend) {
                    try { iframe.contentWindow.postMessage({ type: 'compute:done', DATA: dataToSend }, '*'); } catch (e) {}
                }
                if (window.shell && window.shell.restoreConvergenceToScie) window.shell.restoreConvergenceToScie();
                // Synchrone: éviter setTimeout (debug/trace plus lisible, pas d'effet de bord timing).
                window.resizeScieIframe();
            }
        }
    };

    window.isVisuPanelActive = function () {
        var visu = document.getElementById('visu-panel');
        return visu && visu.classList.contains('active');
    };

    function initAfterLoad() {
        if (typeof window.initCharsForDisplay === 'function') window.initCharsForDisplay();
        // Crash-first: le traceur DOIT exister si debug.js est chargé.
        window.installFunctionTraces();
        if (typeof window.configOrganigramme !== 'undefined' && typeof window.TIMELINE !== 'undefined') {
            if (window.DEBUG_TIMELINE_HIDDEN) {
                try {
                    var dbg = window.TIMELINE
                        .filter(function (it) { return it && it['📅']; })
                        .map(function (it) { return it['📅'] + ':' + (it.hidden ? 'hidden' : 'show'); })
                        .join(', ');
                    if (typeof window.pdTrace === 'function') window.pdTrace('initAfterLoad', 'loader_panels.js', 'TIMELINE epochs=' + dbg);
                } catch (e) {}
            }
            // Crash-first: toutes les époques doivent exister côté configOrganigramme.timeline.
            // Le masquage UI se fait côté rendu (CSS/DOM), pas en supprimant des données de la source unique.
            window.configOrganigramme.timeline = window.TIMELINE.map(function (item) {
                if (item && item['📅']) {
                    const epochId = item['📅'];
                    let epochName = epochId;
                    if (typeof window.CHARS_DESC !== 'undefined' && window.CHARS_DESC[epochId]) {
                        epochName = window.CHARS_DESC[epochId];
                    }
                    const epochNameMap = {
                        '⚫': 'Corps Noir', '🔥': 'Hadéen', '🦠': 'Archéen', '🥟': 'Protérozoïque', '⛄': 'Boule de neige',
                        '🌿': 'Paléozoïque', '🦕': 'Mésozoïque', '🦣': 'Cénozoïque', '🐊': 'Éocène', 'hysteresis 1': 'hysteresis 1', 'hysteresis 2': 'hysteresis 2', '🏔': 'Grande Coupure', '❄️': 'Quaternaire', '🚂': 'Industriel', '📱': 'Aujourd\'hui'
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
            var cb = document.getElementById('plot-anim-toggle-checkbox');
            if (!cb) {
                cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.id = 'plot-anim-toggle-checkbox';
                cb.checked = false;
                cb.style.display = 'none';
                document.body.appendChild(cb);
            }
        }
        var lastComputePayload = null;
        var COMPUTE_TIC_SEGMENTS = 12;
        var _computeTicIndex = 0;
        window.COMPUTE_LOADER = {
            avanceTic: function () {
                var ring = document.querySelector('#compute-tic-loader .compute-tic-loader__ring');
                if (!ring) return;
                _computeTicIndex = (_computeTicIndex + 1) % COMPUTE_TIC_SEGMENTS;
                var filledDeg = _computeTicIndex * (360 / COMPUTE_TIC_SEGMENTS);
                ring.style.background = 'conic-gradient(#22c55e 0deg, #22c55e ' + filledDeg + 'deg, #888 ' + filledDeg + 'deg, #888 360deg)';
                ring.offsetHeight;
            },
            show: function () {
                _computeTicIndex = 0;
                var overlay = document.getElementById('calculation-overlay');
                var loaderEl = document.getElementById('compute-tic-loader');
                var ring = document.querySelector('#compute-tic-loader .compute-tic-loader__ring');
                if (overlay) overlay.style.display = 'flex';
                document.body.classList.add('compute-loading');
                document.documentElement.classList.add('compute-loading');
                var anim = window.DATA && window.DATA['🔘'] && window.DATA['🔘']['🔘🎞'];
                if (loaderEl) loaderEl.style.display = anim ? 'flex' : 'none';
                if (ring) ring.style.background = 'conic-gradient(#888 0deg, #888 360deg)';
            },
            hide: function () {
                var overlay = document.getElementById('calculation-overlay');
                if (overlay) overlay.style.display = 'none';
                document.body.classList.remove('compute-loading');
                document.documentElement.classList.remove('compute-loading');
            }
        };
        const IO_LISTENER = window.IO_LISTENER;
        IO_LISTENER.on('cycleCalcul', function () {
                var D = window.DATA;
                var albedoIn = (D && D['🪩']) ? D['🪩']['🍰🪩📿'] : null;
                console.log('[loader_panels] cycleCalcul input albedo=', albedoIn);
                if (typeof window.updateFluxLabels === 'function') {
                    try { window.updateFluxLabels('cycleCalcul'); } catch (e) { console.error('[cycleCalcul] updateFluxLabels', e); }
                }
                var el = document.querySelector('[data-id="albedo_percent"]');
                console.log('[loader_panels] cycleCalcul DOM albedo_percent=', el ? el.textContent : '(élément absent)');
            }, 'loader_panels');
        IO_LISTENER.on('compute:progress', function (payload) {
                /*
                 * ============================================================
                 * BRIDGE UI du flux spectral
                 * ============================================================
                 * Ce listener est le maillon UI du bridge anim+visu_.
                 *
                 * Entrée :
                 * - compute:progress émis par calculations_flux.js avec
                 *   un payload contenant result + CO2_fraction + iteration
                 *
                 * Rôle :
                 * - en visu_ + anim : dessiner IMMÉDIATEMENT ce cycle via
                 *   displayDichotomyStep(...)
                 * - ne PAS remplacer par un simple emit('cycleCalcul')
                 * - ne PAS retirer payload.result du contrat
                 *
                 * Sortie :
                 * - displayDichotomyStep() finira par émettre plot:drawn
                 * - c'est cet ack qui débloque la reprise du calcul côté API
                 *
                 * Hors visu_ + anim :
                 * - on garde le chemin léger emit('cycleCalcul')
                 * ============================================================
                 */
                window.COMPUTE_LOADER.avanceTic();
                if (window.isVisuPanelActive() && window.DATA['🔘']['🔘🎞'] && payload.result) {
                    window.displayDichotomyStep(payload.CO2_fraction, payload.T0, payload.result, payload.iteration, payload.isInitial);
                    return;
                }
                IO_LISTENER.emit('cycleCalcul');
            }, 'loader_panels');
        IO_LISTENER.on('compute:done', function (payload) {
                var albedoIn = (payload && payload.DATA && payload.DATA['🪩']) ? payload.DATA['🪩']['🍰🪩📿'] : null;
                console.log('[loader_panels] compute:done input albedo=', albedoIn);
                if (payload && payload.DATA) {
                    lastComputePayload = payload;
                    window._lastComputePayloadForScie = payload;
                    // Mettre à jour le DOM visu (comme setEpoch après getMasses) pour que les labels reflètent DATA après une action (météorite, tic, etc.)
                    window.updateFluxLabels('ProcessFinished');
                }
                // Envoi vers panel actif via shell.dataInput (sync_panels/runComputeInParent) ; plus de postMessage ici
            }, 'loader_panels');
        IO_LISTENER.on('flux:lastDrawn', function () {
                window.COMPUTE_LOADER.hide();
            }, 'loader_panels');
        IO_LISTENER.on('three:runStart', function () {
                window.COMPUTE_LOADER.hide();
            }, 'loader_panels');
        // Mettre à jour les actions 🕰 (météorite, impact, etc.) après injection du contenu visu
        if (typeof window.updateEpochActions === 'function') {
            window.updateEpochActions();
        }
        var scieIframe = document.getElementById('scie-iframe');
        window.addEventListener('message', function (event) {
            var iframe = document.getElementById('scie-iframe');
            var fromScieIframe = iframe && event.source === iframe.contentWindow;
            if (fromScieIframe && event.data && event.data.type === 'scie:contentUpdated') {
                window.resizeScieIframe();
                return;
            }
            if (event.data && event.data.type === 'cycleCalcul') {
                var fromOurIframe = fromScieIframe;
                if (fromOurIframe && event.data.DATA && window.DATA) {
                    // Crash-first: si l'iframe scie_ tente d'injecter DATA pendant un calcul parent,
                    // on veut le voir immédiatement (sinon divergence silencieuse search vs index).
                    if (window.SYNC_STATE && window.SYNC_STATE.calculationInProgress) {
                        throw new Error('❌ [loader_panels.js] cycleCalcul reçu depuis scie_ pendant calculationInProgress=true (écrasement DATA probable)');
                    }
                    var src = event.data.DATA;
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
                    const fpsOk = (typeof window.fps === 'number' && window.fps >= (window.FPSalert || 25));
                    if (fpsOk && typeof window.updateFluxLabels === 'function') {
                        try { window.updateFluxLabels('cycleCalcul'); } catch (e) { console.error('[cycleCalcul] updateFluxLabels', e); }
                    }
                }
            }
        });
        function sendComputeToScie() {
            if (lastComputePayload && lastComputePayload.DATA && scieIframe.contentWindow) {
                try { scieIframe.contentWindow.postMessage({ type: 'compute:done', DATA: lastComputePayload.DATA }, '*'); } catch (e) {}
            } else if (window.runComputeInParent) {
                window.runComputeInParent();
            }
        }
        var initialComputeScheduled = false;
        function scheduleInitialCompute() {
            if (initialComputeScheduled) return;
            initialComputeScheduled = true;
            window.syncToScie({ epochId: '⚫', animEnabled: false, ticTime: 0 });
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    setTimeout(function () { sendComputeToScie(); }, 250);
                });
            });
        }
        scieIframe.addEventListener('load', scheduleInitialCompute);
        window.syncToScie({ epochId: '⚫', animEnabled: false, ticTime: 0 });
        if (scieIframe.contentDocument && scieIframe.contentDocument.readyState === 'complete') {
            scheduleInitialCompute();
        }
        // Garantir [4] après [3] : déclencher le 1er calcul même si l'iframe n'a pas encore émis load (évite de le rater)
        scheduleInitialCompute();
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
