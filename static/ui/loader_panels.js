// File: static/ui/loader_panels.js - Charge html/visu_radiatif.html et html/scie_radiatif.html dans les panels
// Desc: Fetch + injection avant chargement des scripts ; loader graphique listing modules (vert = chargé)
// Version 1.3.1
// Logs: v1.3.1: spectreAffiche() remplace isVisuPanelActive (spectre caché = pas de plot).
// Logs: v1.3.1: bench_pilote.js chargé (onglet Bench piloté par l'index). SYNC_STATE.hotePret posé avant le 1er calcul (sync_panels n'accepte un run de la scie qu'après).
// Logs: v1.3.0: Spectrale (ex-Visuel) toujours visible ; les autres onglets dans la zone du graphe (onglets_graphe.js),
//   plus de body.scie-panel-active / bench-panel-active.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Date: 2026-10-12
// Logs: v1.2.0: scripts chargés par le loader commun (API_BILAN/loader/loader.js, BILAN_LOADER.load) : le moteur
//        vient de sa liste unique (engine_manifest.js, avec convergence/clics.js qui manquait ici), l'application
//        ne liste plus que ses scripts avant/après. Fin de loadScriptsSequentially et du chemin du worker en double.
// Logs: v1.1.38: onglet ISS — à l'ouverture, l'iframe reçoit les cartes de l'époque (ONGLETS_GRAPHE.chargerISS).
// Logs: v1.1.37: onglet ISS (dnavatar.org/pages/ISS, vue pôle) dans la zone du graphe.
// Logs: v1.1.36: onglet Histoire (histoire.html) après Milankovitch — littérature sourcée vs courbe du modèle.
// Logs: v1.1.35: alphabet_render.js / dico_render.js lus depuis API_BILAN/demo/ — dessiner l'alphabet et le
//        dictionnaire de l'API fait partie de ce qui illustre l'API ; l'application s'y sert.
// Logs: v1.1.33: alphabet.js / dico.js → API_BILAN/data/ (définitions) + static/compute/*_render.js (rendu).
//        Leur en-tête les plaçait dans API_BILAN depuis toujours ; le moteur en lit KEYS pour construire DATA.
// Ordre: index.html charge plotly + three.min.js ; puis ce loader injecte HTML et charge SCRIPTS ci-dessous.
// Fin Three.js (texture + sphère) : window.IO_LISTENER.on('three:ready', fn) (payload: { hasTexture, canvas }).

(function () {
    'use strict';

    // Moteur : la liste unique (API_BILAN/loader/engine_manifest.js) chargée par BILAN_LOADER, qui pose aussi le
    // chemin du worker spectral. Ici, seulement ce que l'application ajoute avant et après lui.
    const LOAD = {
        apiBase: '../API_BILAN/',
        before: [
            'static/ui/api_onglets.js',
            'static/ui/onglets_graphe.js',
            'static/ui/bench_pilote.js',   // window.BENCH : lu sans test par sync_panels (runComputeInParent)
            'static/debug.js'
        ],
        after: [
            // Rendu des définitions de l'API (alphabet, dico) : l'API définit, l'application dessine.
            '../API_BILAN/demo/js/alphabet_render.js',
            '../API_BILAN/demo/js/dico_render.js',
            'organigramme/configOrganigramme.js',
            'static/event_bus.js',
            'static/compute/visu_/flux_manager.js',
            '/_interfaces/tooltips.js',
            'static/ui/modal.js',
            'static/ui/cpu_threads_notice.js',
            'static/courbes/patterns.js',
            'static/compute/visu_/log_display.js',
            'static/texts/epochs_alt2sec.js',
            'organigramme/organigramme.js',
            'static/compute/visu_/visu_dichotomie.js',
            '../API_BILAN/demo/js/scie_convergence.js',
            'static/sync_panels.js',
            'static/shell.js',
            'static/FPS/FPS.js',
            'static/courbes/plot_debug.js',
            'static/courbes/plot.js',
            'static/ui/layout.js',
            'static/timeline/integrateEds.js',
            'static/timeline/events.js',
            'organigramme/timeline.js',
            'static/ui/main.js'
        ],
        cacheBust: '',
        onLoaded: function (src, i) { setLoaded(i + 1); }   // 0 = phase HTML
    };
    const SCRIPTS = window.BILAN_LOADER.list(LOAD);

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
        li.textContent = 'HTML visu + scie + bench';
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
        fetch('html/bench_panel.html').then(function (r) { return r.text(); })
    ]).then(function (results) {
        setLoaded(0);
        var visuPanel = document.getElementById('visu-panel');
        var sciePanel = document.getElementById('scie-panel');
        var benchPanel = document.getElementById('bench-panel');
        if (visuPanel) visuPanel.innerHTML = results[0];
        if (sciePanel) sciePanel.innerHTML = results[1];
        if (benchPanel) benchPanel.innerHTML = results[2];
        return window.BILAN_LOADER.load(LOAD);
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
        window.ONGLETS_GRAPHE.spectreVisible(true);
        if (window.shell && window.shell.setCurrentPanel) window.shell.setCurrentPanel('visu');
        if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('resize'));
        if (window.DATA['🧮']['🧮🌡️'] !== undefined) window.projectToVisu(window.DATA);
    }
    function onShowScie() {
        window.ONGLETS_GRAPHE.spectreVisible(false);
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
    // Milankovitch, Histoire, Bench : iframes autonomes dans la zone du graphe ; rien à synchroniser.
    function onShowMilankovitch() { window.ONGLETS_GRAPHE.spectreVisible(false); }
    function onShowBench() { window.ONGLETS_GRAPHE.spectreVisible(false); }
    function onShowISS() { window.ONGLETS_GRAPHE.spectreVisible(false); window.ONGLETS_GRAPHE.chargerISS(); }
    /** Le spectre est-il à l'écran ? Non sous un autre onglet (spectre-cache, onglets_graphe.js) : alors aucun appel
     *  au plot (courbes, canvas, dégradé, légende) — onShowVisu redessine au retour. */
    window.spectreAffiche = function () {
        return !document.querySelector('#visu-panel .plot-container-wrapper').classList.contains('spectre-cache');
    };

    function initAfterLoad() {
        if (typeof window.initCharsForDisplay === 'function') window.initCharsForDisplay();
        // Crash-first: le traceur DOIT exister si debug.js est chargé.
        window.installFunctionTraces();
        // Enregistrement des onglets (v1.1.15). registerTab est idempotent ; showTab s'appuie dessus.
        // Crash-first : API_ONGLETS doit exister (chargé en tête de SCRIPTS).
        // Zone du graphe spectral : les panneaux des autres onglets s'y posent (visu est injecté à ce stade).
        window.ONGLETS_GRAPHE.brancher();
        window.API_ONGLETS.registerTab({ id: 'visu', buttonId: 'tab-visu', panelId: 'visu-panel', onShow: onShowVisu });
        window.API_ONGLETS.registerTab({ id: 'scie', buttonId: 'tab-scie', panelId: 'scie-panel', onShow: onShowScie });
        window.API_ONGLETS.registerTab({ id: 'bench', buttonId: 'tab-bench', panelId: 'bench-panel', onShow: onShowBench });
        window.API_ONGLETS.registerTab({ id: 'milankovitch', buttonId: 'tab-milankovitch', panelId: 'milankovitch-panel', onShow: onShowMilankovitch });
        // v1.1.36 : onglet Histoire (histoire.html, iframe standalone comme Milankovitch)
        window.API_ONGLETS.registerTab({ id: 'histoire', buttonId: 'tab-histoire', panelId: 'histoire-panel', onShow: onShowMilankovitch });
        // Onglet ISS : dnavatar.org/pages/ISS en iframe, même zone et même effet (spectre caché) que Milankovitch.
        window.API_ONGLETS.registerTab({ id: 'iss', buttonId: 'tab-iss', panelId: 'iss-panel', onShow: onShowISS });
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
            // L'index des époques est construit par l'API (configTimeline.js v1.4.89, window.epochIndex).
            // Il était fabriqué ici, ce qui obligeait API_BILAN/geology à lire configOrganigramme.timeline.
            // On garde la propriété : le rendu (main.js, events.js) la lit encore.
            window.configOrganigramme.timeline = window.epochIndex();
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
                if (window.spectreAffiche() && window.DATA['🔘']['🔘🎞'] && payload.result) {
                    window.VISU_DICHO.displayDichotomyStep(payload.CO2_fraction, payload.T0, payload.result, payload.iteration, payload.isInitial);
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
        window.SYNC_STATE.hotePret = true;
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
