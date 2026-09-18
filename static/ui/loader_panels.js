// File: static/ui/loader_panels.js - Charge html/visu_radiatif.html et html/scie_radiatif.html dans les panels
// Desc: Fetch + injection avant chargement des scripts ; loader graphique listing modules (vert = chargé)
// Version 1.1.31
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Date: April 2026
// Logs: v1.1.31: spectral_slice_worker.js chargé en <script> avant worker_pool.js — permet le repli blob: quand
//        new Worker('file://…') est refusé (origine 'null'), donc l'app tourne aussi sans serveur.
// Logs: v1.1.30: static/ui/cpu_threads_notice.js dans la liste (après modal.js) — avertit une fois quand le
//        navigateur sous-déclare navigator.hardwareConcurrency (Brave « farbling »), qui dimensionne le pool de workers.
// Logs: v1.1.29: tooltips literal /_interfaces/tooltips.js (www racine).
// Logs: v1.1.28: tooltips.js via window.SITE_PATHS.INTERFACES (absolu /_interfaces/, pas ../../ relatif page).
// Logs: v1.1.27: tooltips.js → ../../_interfaces/tooltips.js (code partagé site/_interfaces).
// Logs: v1.1.26: version bandeau — source window.BILAN_VISU_APP_VERSION dans API_BILAN/api.js (plus d’assignation loader).
// Logs: v1.1.25: window.BILAN_VISU_APP_VERSION = 1.0.8 + synchro span #title-app-version après injection visu_radiatif.html.
// Logs: v1.1.24: togglePlotAnim déplacé vers timeline.js (visu inchangé ; scie_compute / html sans loader ont SKIP).
// Logs: v1.1.23: cycleCalcul iframe — syncEpochFromTimelinePointer() après merge 📜 (👉 fait foi, évite 🗿 stale / atmosphère erronée).
// Logs: v1.1.22: COMPUTE_LOADER — append #organigram-calculation-overlay dans #flux-diagram au show (z au-dessus des cellules) ; replacer dans .flux-diagram-wrapper au hide
// Logs: v1.1.21: static/courbes/plot_debug.js avant plot.js (?debugPlot=1 → _logs/plot.txt + DEBUG_PLOT_LOG)
// Logs: v1.1.20 migration window.updateFluxLabels → window.ORG.updateFluxLabels + lectures UI_STATE.FPSalert / RUNTIME_STATE (fps, currentEpochName, h2oVaporPercent). Retrait typeof defensive check sur updateFluxLabels (crash-first : organigramme.js chargé avant).
// Logs: v1.1.19 workers/worker_pool.js ajouté après hitran.js → scie/visu utilisent les workers (parallèle) comme bench. Retire divergence 0.115 W/m² sur 🧲🌈🔼 (ordre addition float série vs parallèle) → 15.28°C → 15.35°C aligné 📱.
// Logs: v1.1.18 physics.js avant tuning.js → EARTH dispo pour syncRadiativeConfig au boot (corrige EARTH.H2O_EDS_SCALE resté à 0.6 au lieu de 0.74 côté scie/visu).
// Logs: v1.1.17 onglet Hystérésis (iframe standalone hysteresis_compute.html) + fetch html/hysteresis_panel.html + registerTab hysteresis (onShow minimal, body.hysteresis-panel-active)
// Logs: v1.1.16 onglet Bench (iframe standalone epoch_bench.html) + fetch html/bench_panel.html + registerTab bench (onShow minimal)
// Logs: v1.1.15 switchTab → proxy API_ONGLETS ; registerTab visu/scie/milankovitch après chargement SCRIPTS
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
        'static/ui/api_onglets.js',
        'static/debug.js',
        '../API_BILAN/config/model_tuning.js',
        '../API_BILAN/config/model_tuning_biblio.js',
        '../API_BILAN/config/configTimeline.js',
        'static/compute/alphabet.js',
        'static/compute/dico.js',
        '../API_BILAN/data/initDATA.js',
        '../API_BILAN/config/fine_tuning_bounds.js',
        '../API_BILAN/physics/physics.js',
        '../API_BILAN/tuning.js',
        'organigramme/configOrganigramme.js',
        '../API_BILAN/event_bus.js',
        '../API_BILAN/convergence/compute.js',
        'static/compute/visu_/flux_manager.js',
        '/_interfaces/tooltips.js',
        'static/ui/modal.js',
        'static/ui/cpu_threads_notice.js',
        'static/courbes/patterns.js',
        'static/compute/visu_/log_display.js',
        '../API_BILAN/data/hitran_lines_CO2.js',
        '../API_BILAN/data/hitran_lines_H2O.js',
        '../API_BILAN/data/hitran_lines_CH4.js',
        '../API_BILAN/spectroscopy/hitran.js',
        // Avant le pool : publie la source du worker pour le repli blob: (pages ouvertes en file://).
        '../API_BILAN/workers/spectral_slice_worker.js',
        '../API_BILAN/workers/worker_pool.js',
        '../API_BILAN/physics/climate.js',
        '../API_BILAN/atmosphere/calculations_atm.js',
        '../API_BILAN/albedo/calculations_albedo.js',
        'static/texts/epochs_alt2sec.js',
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
        'static/courbes/plot_debug.js',
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
        li.textContent = 'HTML visu + scie + bench + hyst';
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
        fetch('html/scie_radiatif.html').then(function (r) { return r.text(); }),
        fetch('html/bench_panel.html').then(function (r) { return r.text(); }),
        fetch('html/hysteresis_panel.html').then(function (r) { return r.text(); })
    ]).then(function (results) {
        setLoaded(0);
        var visuPanel = document.getElementById('visu-panel');
        var sciePanel = document.getElementById('scie-panel');
        var benchPanel = document.getElementById('bench-panel');
        var hystPanel = document.getElementById('hysteresis-panel');
        if (visuPanel) visuPanel.innerHTML = results[0];
        if (sciePanel) sciePanel.innerHTML = results[1];
        if (benchPanel) benchPanel.innerHTML = results[2];
        if (hystPanel) hystPanel.innerHTML = results[3];
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

    // togglePlotAnim : définition dans organigramme/timeline.js (source unique ; pages sans ce loader, ex. scie_compute.html).

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

    // switchTab = proxy vers API_ONGLETS (v1.1.15). Mécanique (classList, body, shell, postMessage) externalisée en onShow/onHide des tabs (enregistrées plus bas, dans initAfterLoad).
    window.switchTab = function (name) {
        if (window.API_ONGLETS && window.API_ONGLETS.showTab) {
            window.API_ONGLETS.showTab(name);
        }
    };

    // onShow spécifiques aux tabs (factorisation de l'ancien switchTab). Appelés par API_ONGLETS après .active + shell.setCurrentPanel.
    function onShowVisu() {
        document.body.classList.remove('scie-panel-active');
        document.body.classList.remove('bench-panel-active');
        document.body.classList.remove('hysteresis-panel-active');
        if (window.shell && window.shell.setCurrentPanel) window.shell.setCurrentPanel('visu');
        if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('resize'));
        if (window.DATA && window.DATA['🧮'] && typeof window.projectToVisu === 'function') window.projectToVisu(window.DATA);
    }
    function onShowScie() {
        document.body.classList.add('scie-panel-active');
        document.body.classList.remove('bench-panel-active');
        document.body.classList.remove('hysteresis-panel-active');
        if (window.shell && window.shell.setCurrentPanel) window.shell.setCurrentPanel('scie');
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
    function onShowMilankovitch() {
        // Aligné sur l'ancien switchTab (v1.1.15-) : seul scie-panel-active était manipulé ; bench/hyst retirés pour cohérence.
        document.body.classList.remove('scie-panel-active');
        document.body.classList.remove('bench-panel-active');
        document.body.classList.remove('hysteresis-panel-active');
    }
    // Bench = iframe standalone (epoch_bench.html) ; pas de listener shell, pas de sync DATA. body.bench-panel-active pour les règles hauteur.
    function onShowBench() {
        document.body.classList.remove('scie-panel-active');
        document.body.classList.remove('hysteresis-panel-active');
        document.body.classList.add('bench-panel-active');
    }
    // Hystérésis = iframe standalone (hysteresis_compute.html) ; globals isolés, calculs autonomes. Pas de listener shell par défaut (bridge postMessage possible ultérieurement).
    function onShowHysteresis() {
        document.body.classList.remove('scie-panel-active');
        document.body.classList.remove('bench-panel-active');
        document.body.classList.add('hysteresis-panel-active');
    }

    window.isVisuPanelActive = function () {
        var visu = document.getElementById('visu-panel');
        return visu && visu.classList.contains('active');
    };

    function initAfterLoad() {
        if (typeof window.initCharsForDisplay === 'function') window.initCharsForDisplay();
        // Crash-first: le traceur DOIT exister si debug.js est chargé.
        window.installFunctionTraces();
        // Enregistrement des onglets (v1.1.15). registerTab est idempotent ; showTab s'appuie dessus.
        // Crash-first : API_ONGLETS doit exister (chargé en tête de SCRIPTS).
        window.API_ONGLETS.registerTab({ id: 'visu', buttonId: 'tab-visu', panelId: 'visu-panel', onShow: onShowVisu });
        window.API_ONGLETS.registerTab({ id: 'scie', buttonId: 'tab-scie', panelId: 'scie-panel', onShow: onShowScie });
        window.API_ONGLETS.registerTab({ id: 'bench', buttonId: 'tab-bench', panelId: 'bench-panel', onShow: onShowBench });
        window.API_ONGLETS.registerTab({ id: 'hysteresis', buttonId: 'tab-hysteresis', panelId: 'hysteresis-panel', onShow: onShowHysteresis });
        window.API_ONGLETS.registerTab({ id: 'milankovitch', buttonId: 'tab-milankovitch', panelId: 'milankovitch-panel', onShow: onShowMilankovitch });
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
                    // epochNameMap : fallback si CHARS_DESC absent — CHARS_DESC est la source de vérité (alphabet.js).
                    // Entrées couvertes seulement pour les ids non-emoji (strings) et les cas sans CHARS_DESC.
                    const epochNameMap = {
                        'hysteresis 1a': 'Sturtienne', 'hysteresis 1b': 'Sortie Marinoen', 'hysteresis 2': 'Eocène-Oligocène'
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
                var orgOverlay = document.getElementById('organigram-calculation-overlay');
                var fluxDiagram = document.getElementById('flux-diagram');
                var loaderEl = document.getElementById('compute-tic-loader');
                var ring = document.querySelector('#compute-tic-loader .compute-tic-loader__ring');
                if (overlay) overlay.style.display = 'flex';
                /* Dernier enfant de #flux-diagram : au-dessus des cellules (z-index inline) et des labels .flux-label */
                if (orgOverlay && fluxDiagram && orgOverlay.parentNode !== fluxDiagram) {
                    fluxDiagram.appendChild(orgOverlay);
                }
                if (orgOverlay) {
                    orgOverlay.style.display = 'flex';
                    orgOverlay.setAttribute('aria-hidden', 'false');
                }
                document.body.classList.add('compute-loading');
                document.documentElement.classList.add('compute-loading');
                var anim = window.DATA && window.DATA['🔘'] && window.DATA['🔘']['🔘🎞'];
                if (loaderEl) loaderEl.style.display = anim ? 'flex' : 'none';
                if (ring) ring.style.background = 'conic-gradient(#888 0deg, #888 360deg)';
            },
            hide: function () {
                var overlay = document.getElementById('calculation-overlay');
                var orgOverlay = document.getElementById('organigram-calculation-overlay');
                var wrap = document.querySelector('.flux-diagram-wrapper');
                if (overlay) overlay.style.display = 'none';
                if (orgOverlay) {
                    orgOverlay.style.display = 'none';
                    orgOverlay.setAttribute('aria-hidden', 'true');
                    if (wrap && orgOverlay.parentNode === document.getElementById('flux-diagram')) {
                        wrap.appendChild(orgOverlay);
                    }
                }
                document.body.classList.remove('compute-loading');
                document.documentElement.classList.remove('compute-loading');
            }
        };
        const IO_LISTENER = window.IO_LISTENER;
        IO_LISTENER.on('cycleCalcul', function () {
                var D = window.DATA;
                var albedoIn = (D && D['🪩']) ? D['🪩']['🍰🪩📿'] : null;
                console.log('[loader_panels] cycleCalcul input albedo=', albedoIn);
                try { window.ORG.updateFluxLabels('cycleCalcul'); } catch (e) { console.error('[cycleCalcul] updateFluxLabels', e); }
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
                    window.ORG.updateFluxLabels('ProcessFinished');
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
                    if (event.data.h2oVaporPercent != null) window.RUNTIME_STATE.h2oVaporPercent = event.data.h2oVaporPercent;
                    window.UI_STATE.waterVaporEnabled = window.RUNTIME_STATE.h2oVaporPercent > 0;
                    window.syncEpochFromTimelinePointer();
                    const fpsOk = (window.RUNTIME_STATE.fps >= window.UI_STATE.FPSalert);
                    if (fpsOk) {
                        try { window.ORG.updateFluxLabels('cycleCalcul'); } catch (e) { console.error('[cycleCalcul] updateFluxLabels', e); }
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
