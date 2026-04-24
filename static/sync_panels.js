// File: sync_panels.js - Synchronisation état visu ↔ scie (iframe)
// Desc: État partagé epoch, anim, ticTime + exécution centralisée index.html → projection visu + scie
// Version 1.1.44
// - v1.1.44: broadcastTuningToIframes — factorise propagation sync:tuning vers scie + bench + hysteresis (#hysteresis-iframe). Utilisé dans applyTuningFromScie (mini-slider visu_), message listener sync:tuning (écho scie) et IO_LISTENER. Bench & hysteresis reçoivent désormais les changements venant de visu_ et scie_ (hysteresis = écoute seule, postMessage sortant mute v1.0.1).
// - v1.1.43: syncTuningToBench — IO_LISTENER 'sync:tuning' propage aussi vers l'iframe bench (#bench-iframe). Bench reçoit le payload via postMessage et rafraîchit ses jauges via message listener (epoch_bench.html v1.0.16).
// - v1.1.42: migration namespaces — window.PLOT.updatePlot / updateSpectralVisualization / tempSurfaceToColor + window.ORG.updateFluxLabels + RUNTIME_STATE (currentEpochName, spectralConverged, spectralPrecisionTarget, showSpectralBackground, h2oVaporPercent, h2oTotalFromMeteorites). Retrait stubs updateFluxLabels / updateLabel (ordre chargement contractuel, crash-first).
// - v1.1.41: retrait recopie DATA → window.TUNING (syncTuningFromData). DATA['🎚️'] = source unique live (initDATA v1.1.0). Miroirs CONFIG_COMPUTE conservés pour legacy.
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
// - v1.1.40: projectToVisu recolorise .synthese_Temp (setProperty color !important) + appelle updateLegend(plotData) → fix bug Hadéen title cyan persistant + légende figée au timeClic (setEpoch n'étant pas rappelé hors SKIP époque)
// - v1.1.30: applyTuningPayload appelle fillDataTuningFromBary si dispo (interpolation depuis bary + FINE_TUNING_BOUNDS)
// - v1.1.31: _epochIdToName 🐊 « Éocène »
// - v1.1.26: [4] effectif groupe reste ouvert jusqu'à [4] retour (suppr _logStepEnd prématuré)
// - v1.1.21: guard calculationInProgress en tête de runComputeInParent (évite double appel sendComputeToScie + config:applyThenCompute) (retire markDrawn/isDrawn/resetDrawAck/awaitVisuDraw — while mort); appel direct RAF dans calculations_flux
// - v1.1.39: _epochIdToName 🐊 « Éocène »
// - v1.1.38: diagnostics run/tuning/inputs → pdTrace (pd réservé aux erreurs)
// - v1.1.37: groupe 📡 sync:state (DEBUG_SYNC_PANELS) ; [4] retour sans _logStepEnd immédiat (logs post-run dans le groupe) ; fermetures [4] sur erreurs idx/init
// - v1.1.36: message sync:hysteresis {active} + payload.hysteresisActive (sync:state) → window.HYSTERESIS.active parent (même bundle que scie_)
// - v1.1.35: payload.hysteresisTimelineCo2Kg + epochId → patch TIMELINE[⚖️🏭] avant config:applyThenCompute (boucle HYSTERESIS iframe)
// - v1.1.12: sync:state inclut tuning (🎚️) depuis scie ; applyStateFromScie applique p.tuning pour reproductibilité run scie/visu
// - v1.1.11: applyStateFromScie/applyTuningFromScie exposés ; messages sync:state/sync:tuning passent par shell
// - v1.1.10: displayConvergence/clearConvergenceTrace/appendConvergenceStep passent par shell.dataInput ; compute:done aussi
// - v1.1.32: logs pdTrace pre/post initForConfig et post-run (inputs réels) pour diagnostiquer divergence UI vs solveur
// - v1.1.33: add huge TRACE_VISU banner + trace at runComputeInParent entry
// - v1.1.34: remove TRACE_VISU + dedupe sync:state run
// - v1.1.9: shell.registerPanelApi visu/scie + setCurrentPanel(active) dans initSyncPanels ; dispatch prêt pour dataInput
// - v1.1.8: source unique tuning dans DATA[🎚️]; applyTuningPayload écrit DATA[🎚️]; runComputeInParent sync TUNING depuis DATA[🎚️]

(function () {
    'use strict';
    const IO_LISTENER = window.IO_LISTENER;

    // organigramme.js doit être chargé avant sync_panels.js — contrat d'ordre (loader_panels).
    // ORG.updateFluxLabels / ORG.updateLabel : source unique, pas de stub.

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

    // DATA['🎚️'] seule ref : payload contient baryByGroup + CLOUD_SW + HYSTERESIS + RADIATIVE.
    // SOLVER n'est plus dans DATA (source unique = CONFIG_COMPUTE, configTimeline.js v1.4.13).
    function applyTuningPayload(payload) {
        var T = window.DATA['🎚️'];
        if (payload.baryByGroup) {
            T.baryByGroup.ATM = payload.baryByGroup.ATM;
            T.baryByGroup.CLOUD_SW = T.baryByGroup.ATM;
            T.baryByGroup.SCIENCE = T.baryByGroup.ATM;
            T.baryByGroup.HYSTERESIS = payload.baryByGroup.HYSTERESIS;
        }
        if (window.TUNING && window.TUNING.fillDataTuningFromBary) {
            window.TUNING.fillDataTuningFromBary();
        } else {
            T.CLOUD_SW = Object.assign({}, T.CLOUD_SW, payload.CLOUD_SW || {});
        }
        (payload.updates || []).forEach(function (u) {
            if (!T[u.group]) T[u.group] = {};
            T[u.group][u.key] = u.value;
        });
    }

    // v1.1.42 : no-op. SOLVER n'est plus dans DATA ; source unique = window.CONFIG_COMPUTE
    // (configTimeline.js v1.4.13). Fonction conservée pour compat des appelants.
    function syncTuningFromData() {
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
                    if (ep) window.RUNTIME_STATE.currentEpochName = ep.name;
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

    function applyParentHysteresisActiveFromPayload(payload) {
        if (!payload || !window.HYSTERESIS) return;
        if (!Object.prototype.hasOwnProperty.call(payload, 'hysteresisActive')) return;
        window.HYSTERESIS.active = !!payload.hysteresisActive;
    }

    /** sync:state depuis scie : boucle externe HYSTERESIS (⚖️🏭 sur la ligne d'époque du parent). */
    function patchTimelineCo2FromSciePayload(payload) {
        if (!payload || payload.hysteresisTimelineCo2Kg == null || payload.epochId == null) return;
        var kg = Number(payload.hysteresisTimelineCo2Kg);
        if (!Number.isFinite(kg) || kg <= 0) return;
        var idx = window.TIMELINE ? window.TIMELINE.findIndex(function (item) { return item && item['📅'] === payload.epochId; }) : -1;
        if (idx < 0) return;
        window.TIMELINE[idx]['⚖️🏭'] = kg;
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
                        if (ep) window.RUNTIME_STATE.currentEpochName = ep.name;
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
            window.RUNTIME_STATE.h2oTotalFromMeteorites = payload.h2oTotalFromMeteorites;
            if (!window.DATA['💧']) window.DATA['💧'] = {};
            window.DATA['💧']['☄️'] = payload.h2oTotalFromMeteorites;
        }
    }

    function projectToVisu(DATA) {
        if (!window.plotData) {
            window.plotData = { lambda_range: null, current: null, co2_ppm: 0, ch4_ppm: 0, temp_surface: 0 };
        }
        var CONST = window.CONST;
        var spectral = window.RADIATIVE.getSpectralResultFromDATA();
        var T0 = DATA['🧮']['🧮🌡️'];
        var tempC = T0 - CONST.KELVIN_TO_CELSIUS;
        document.getElementById('temp-surface-synthese').textContent = tempC.toFixed(1);
        var P_atm = (DATA['🫧'] && DATA['🫧']['🎈'] != null) ? DATA['🫧']['🎈'] : null;
        var pressureValEl = document.getElementById('pressure-surface-synthese');
        if (pressureValEl) pressureValEl.textContent = (P_atm != null && Number.isFinite(P_atm)) ? '🎈 ' + P_atm.toFixed(2) + ' atm' : '🎈 -- atm';
        // ppm CO2/CH4 = fraction molaire × 1e6 (co2KgToFraction/ch4KgToFraction), pas fraction massique × 1e6
        var atm_kg = DATA['⚖️']['⚖️🫧'];
        var M_air = DATA['🫧']['🧪'];
        var co2_ppm = window.ATM.co2KgToFraction(DATA['⚖️']['⚖️🏭'], atm_kg, M_air) * 1e6;
        var ch4_ppm = window.ATM.ch4KgToFraction(DATA['⚖️']['⚖️🐄'], atm_kg, M_air) * 1e6;
        var h2o_vapor_frac = (DATA['💧'] && DATA['💧']['🍰🫧💧'] != null) ? DATA['💧']['🍰🫧💧'] : 0;
        var h2o_meteorites = (typeof window.RUNTIME_STATE.h2oTotalFromMeteorites !== 'undefined') ? window.RUNTIME_STATE.h2oTotalFromMeteorites : 0;
        window.plotData.ch4_ppm = ch4_ppm;
        window.RUNTIME_STATE.h2oVaporPercent = Math.min(100, Math.max(0, h2o_vapor_frac * 100 + h2o_meteorites));
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
        window.RUNTIME_STATE.spectralConverged = true;
        window.RUNTIME_STATE.spectralPrecisionTarget = 'max';
        // v1.1.40: resync couleur T° courante (hors chemin setEpoch anticipé).
        // - updateBlackBodyColor : met à jour la couleur globale des corps noirs (plot).
        // - .synthese_Temp : title col-left/right → couleur T° sol (sinon reste bloqué sur anticipation ou fallback cyan).
        // - updateLegend : regénère SVG strokes + textes équilibre avec la nouvelle couleur (sinon timeClic → plot recolore mais légende reste figée).
        var newColor = window.PLOT.tempSurfaceToColor(tempC);
        window.updateBlackBodyColor(newColor);
        var syntheseTempEl = document.querySelector('.synthese_Temp');
        if (syntheseTempEl) syntheseTempEl.style.setProperty('color', newColor, 'important');
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
                window.PLOT.updatePlot(window.plotData);
                // Force showSpectralBackground juste avant le draw (résiste au FPS monitor)
                window.RUNTIME_STATE.showSpectralBackground = true;
                try {
                    window.PLOT.updateSpectralVisualization(window.plotData.current);
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
        function fmt3(n) { return n.toExponential(3); }
        function snapInputs(tag) {
            const D = window.DATA;
            const S = window.STATE;
            const ep = D['📜']['🗿'];
            const idx = D['📜']['👉'];
            const phase = D['🧮']['🧮⚧'];
            const T = D['🧮']['🧮🌡️'];
            const alb = D['🪩']['🍰🪩📿'];
            const ice = D['🪩']['🍰🪩🧊'];
            const oce = D['🪩']['🍰🪩🌊'];
            const P = D['🫧']['🎈'];
            const co2 = D['⚖️']['⚖️🏭'];
            const ch4 = D['⚖️']['⚖️🐄'];
            const h2o = D['⚖️']['⚖️💧'];
            const o2 = D['⚖️']['⚖️🫁'];
            const atm = D['⚖️']['⚖️🫧'];
            const lockW = (S.iceEpochFixedWaterState && S.iceEpochFixedWaterState.epochId === ep) ? S.iceEpochFixedWaterState.value : null;
            const lockA = (S.iceEpochFixedAlbedoState && S.iceEpochFixedAlbedoState.epochId === ep) ? S.iceEpochFixedAlbedoState.value : null;
            if (typeof window.pdTrace === 'function') window.pdTrace('inputs', 'sync_panels.js',
                tag
                + ' ep=' + ep + ' idx=' + idx + ' phase=' + phase
                + ' T_C=' + (T - 273.15).toFixed(2) + ' T_K=' + fmt3(T)
                + ' P_atm=' + fmt3(P)
                + ' CO2=' + fmt3(co2) + ' CH4=' + fmt3(ch4) + ' H2O=' + fmt3(h2o) + ' O2=' + fmt3(o2) + ' atm=' + fmt3(atm)
                + ' ALB=' + fmt3(alb) + ' ICE=' + fmt3(ice) + ' OCE=' + fmt3(oce)
                + ' iceLockW=' + (lockW == null ? 'null' : fmt3(lockW))
                + ' iceLockA=' + (lockA == null ? 'null' : fmt3(lockA))
            );
        }

        var _epRun = window.DATA && window.DATA['📜'] && window.DATA['📜']['🗿'];
        var _ticRun = window.DATA && window.DATA['📜'] && window.DATA['📜']['📿💫'];
        var _srcRun = window.SYNC_STATE && window.SYNC_STATE.lastRunRequestSource ? window.SYNC_STATE.lastRunRequestSource : 'unknown';
        var _baryRun = window.DATA && window.DATA['🎚️'] && window.DATA['🎚️'].baryByGroup ? window.DATA['🎚️'].baryByGroup.CLOUD_SW : 'n/a';
        var _albRun = window.DATA && window.DATA['🪩'] ? window.DATA['🪩']['🍰🪩📿'] : 'n/a';
        if (window.DEBUG_SYNC_PANELS === true) console.log('[DBG sync_panels] runComputeInParent source=' + _srcRun + ' CLOUD_SW_bary=' + _baryRun + ' albedo=' + _albRun);
        if (typeof window.pdTrace === 'function') window.pdTrace('runComputeInParent', 'sync_panels.js', 'source=' + _srcRun + ' CLOUD_SW_bary=' + _baryRun + ' albedo=' + _albRun);
        if (window.DEBUG_SYNC_PANELS === true) console.log('[DBG sync_panels] runComputeInParent epoch=' + _epRun + ' 📿💫=' + _ticRun + ' locked=' + window.SYNC_STATE.calculationInProgress);
        if (window.SYNC_STATE.calculationInProgress) {
            if (window._logStep) window._logStep('[X] bloqué calculationInProgress=true');
            else console.log('[4] bloqué calculationInProgress=true');
            if (window._logStepEnd) window._logStepEnd();
            if (window.DEBUG_SYNC_PANELS === true) console.trace('[DBG] ⬆ stack de l\'appelant bloqué [X]');
            return Promise.resolve(null);
        }
        window.SYNC_STATE.calculationInProgress = true;
        if (window._logStep) window._logStep('[4] calculs (appel)');
        else console.log('[4] calculs (appel)');
        var DATA = window.DATA;
        // Rendre 📜 cohérent en premier (📿☄️, 🔺⚖️💧☄️) avant tout calcul — sinon ⚖️💧 reste 0
        window.COMPUTE.getEpochDateConfig();
        // Ne pas réinitialiser h2oTotalFromMeteorites ici (conservé après clic météorite ; reset dans setEpoch au changement d'époque)
        syncTuningFromData();
        // Source de vérité pour anim : bouton visu (plot-anim-toggle). Rafraîchir DATA['🔘'] avant le calcul
        window.COMPUTE.getEnabledStates();
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
            if (window._logStepEnd) window._logStepEnd(); // ferme [4] calculs (appel) — TIMELINE / époque invalide
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
        // Aligner le pipeline sur search.html : initForConfig s'appuie sur 🧮⚧ (Init→Search workaround H2O).
        DATA['🧮']['🧮⚧'] = 'Init';
        // snapInputs('PRE_INIT');
        window.COMPUTE_LOADER.show();
        function doCompute() {
            // Log : moment réel où la computation commence (après les 2× requestAnimationFrame)
            var _epEff = window.DATA && window.DATA['📜'] && window.DATA['📜']['🗿'];
            if (window.DEBUG_SYNC_PANELS === true) console.log('[DBG sync_panels] doCompute (effectif après rAF) epoch=' + _epEff);
            if (window._logStep) window._logStep('[4] calculs (effectif)');
            else console.log('[4] calculs (effectif)');
            // groupe [4] reste ouvert — fermé à [4] calculs (retour)
            if (!window.CONVERGE.initForConfig()) {
                window.SYNC_STATE.calculationInProgress = false;
                if (window._logStepEnd) window._logStepEnd(); // ferme [4] calculs (effectif)
                return Promise.resolve(null);
            }
            // snapInputs('POST_INIT');
            var epochId = DATA['📜']['🗿'];
            if (window.FluxManager && window.GEOLOGY) {
                window.RUNTIME_STATE.currentEpochName = window.RUNTIME_STATE.currentEpochName || epochId;
                window.FluxManager.updateAllFluxes(epochId);
            }
            var _sv = document.getElementById('spectral-visualization');
            if (_sv) {
                _sv._lastDrawnBins = 0;
                _sv._lastFinalSig = null;
            }
            // IMPORTANT: en non-anim, on force le chemin scie_ (même pipeline que search.html)
            // pour éviter des divergences d'état UI/visu_ (bridge compute:progress/plot:drawn) inutiles hors anim.
            var renderMode = (!DATA['🔘']['🔘🎞']) ? 'scie_' : window.VISUALWAIT.computeRenderMode();
            // Projection UI: dépend du panel actif, pas du renderMode de calcul.
            var shouldProjectToVisu = (typeof window.isVisuPanelActive === 'function') ? window.isVisuPanelActive() : true;
            return window.CONVERGE.computeRadiativeTransfer(null, { renderMode: renderMode }).then(function (result) {
            window.SYNC_STATE.calculationInProgress = false;
            if (window._logStepEnd) window._logStepEnd(); // ferme groupe [4] effectif
            if (window._logStep) window._logStep('[4] calculs (retour)');
            else console.log('[4] calculs (retour)');
            // Pas de _logStepEnd ici : le groupe [4] retour reste ouvert pour IO_LISTENER / updateFluxLabels / shell
            // jusqu'au prochain _logStep (ex. [4] calculs (appel) du run suivant), cf. v1.1.37
            if (result === null) throw new Error('[runComputeInParent][sync_panels.js] computeRadiativeTransfer returned null');
            // snapInputs('POST_RUN');
            // emit = abonnés in-page (ex. loader_panels stocke lastComputePayload pour envoi différé à l'iframe scie à l'ouverture de l'onglet)
            IO_LISTENER.emit('compute:done', { DATA: window.DATA, result: result });
            if (shouldProjectToVisu) projectToVisu(window.DATA);
            // En mode scie_ (pas de draw visu), émettre l'ack de fin pour libérer l'UI
            // (loader/timeline rouge "calcul en cours" et reprise Three.js).
            if (!shouldProjectToVisu) IO_LISTENER.emit('flux:lastDrawn');
            // Rafraîchir les labels visu (albédo, flux, T°) après chaque calcul pour que l’onglet Visuel affiche le bon état
            window.ORG.updateFluxLabels('ProcessFinished');
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
            if (window._logStepEnd) window._logStepEnd();
            if (window._logStepEnd) window._logStepEnd();
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
            if (window.DEBUG_SYNC_PANELS === true) console.log('[DBG sync_panels] config:applyThenCompute btn=' + payload.button + ' epoch=' + _epBefore + ' 📿💫=' + _ticBefore);
            window.DATA['📜']['🔘🕰'] = payload.button;
            window.COMPUTE.getEpochDateConfig();
            var _epAfter = window.DATA && window.DATA['📜'] && window.DATA['📜']['🗿'];
            var _ticAfter = window.DATA && window.DATA['📜'] && window.DATA['📜']['📿💫'];
            if (window.DEBUG_SYNC_PANELS === true) console.log('[DBG sync_panels] après getEpochDateConfig epoch=' + _epAfter + ' 📿💫=' + _ticAfter + ((_epBefore !== _epAfter) ? ' ⚡TRANSITION' : ''));
            // Si getEpochDateConfig a détecté une transition d'époque, déléguer à setEpoch pour mettre
            // à jour l'UI (boutons, texture, currentEpochName) — évite le "nextEpoch en trop" visible
            if (_epAfter !== _epBefore && typeof window.setEpoch === 'function') {
                var _newEpochName = (typeof window.epochName === 'function') ? window.epochName(_epAfter) : _epAfter;
                if (window.DEBUG_SYNC_PANELS === true) console.log('[DBG sync_panels] ⚡ transition → setEpoch(' + _newEpochName + ')');
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
        window.CONVERGE.clearConvergenceTrace = function () {
            if (window.shell && window.shell.dataInput) {
                window.shell.dataInput({ type: 'clearConvergenceTrace' });
                return;
            }
            var iframe = getIframe();
            if (iframe && iframe.contentWindow) {
                try { iframe.contentWindow.CONVERGE.clearConvergenceTrace(); } catch (e) {}
            }
        };
        window.CONVERGE.appendConvergenceStep = function (payload) {
            if (window.shell && window.shell.dataInput) {
                window.shell.dataInput({ type: 'convergenceStep', data: payload });
                return;
            }
            var iframe = getIframe();
            if (iframe && iframe.contentWindow) {
                try { iframe.contentWindow.CONVERGE.appendConvergenceStep(payload); } catch (e) {}
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

        function applyStateFromSciePayloadCore(p) {
            applyParentHysteresisActiveFromPayload(p);
            patchTimelineCo2FromSciePayload(p);
            applyToVisu(p, true);
            if (p.tuning) applyTuningPayload(p.tuning);
        }

        // API appelée par shell quand scie envoie sync:state → appliquer DATA puis même chemin que visu
        window.applyStateFromScie = function (p) {
            if (window.DEBUG_SYNC_PANELS === true) {
                console.groupCollapsed('📡 sync:state → parent (état + tuning)');
            }
            try {
                applyStateFromSciePayloadCore(p);
            } finally {
                if (window.DEBUG_SYNC_PANELS === true) {
                    console.groupEnd();
                }
            }
            // Synchro scie→visu : pas de clic bouton, on conserve le 🔘🕰 courant
            IO_LISTENER.emit('config:applyThenCompute', { button: window.DATA['📜']['🔘🕰'] });
        };
        window.applyTuningFromScie = function (p) {
            applyTuningPayload(p);
            broadcastTuningToIframes(p); // v1.1.44 : scie + bench + hysteresis
            if (p.run === true) window.runComputeInParent();
        };

        window.addEventListener('message', function (event) {
            if (!event.data || !event.data.type) return;
            if (event.data.type === 'sync:hysteresis') {
                if (window.HYSTERESIS) window.HYSTERESIS.active = !!event.data.active;
                return;
            }
            if (event.data.type !== 'sync:state') return;
            var p = event.data.payload;
            if (window.shell && window.shell.applyStateFromScie) window.shell.applyStateFromScie(p);
            else {
                if (window.DEBUG_SYNC_PANELS === true) {
                    console.groupCollapsed('📡 sync:state → parent (état + tuning)');
                }
                try {
                    applyStateFromSciePayloadCore(p);
                } finally {
                    if (window.DEBUG_SYNC_PANELS === true) {
                        console.groupEnd();
                    }
                }
                IO_LISTENER.emit('config:applyThenCompute', { button: window.DATA['📜']['🔘🕰'] });
            }
        });
        window.addEventListener('message', function (event) {
            if (event.data.type !== 'sync:tuning') return;
            var p = event.data.payload;
            window.SYNC_STATE.lastRunRequestSource = 'scie:message:sync:tuning';
            if (window.DEBUG_SYNC_PANELS === true) console.log('[DBG sync_panels] message sync:tuning run=' + p.run + ' bary.CLOUD_SW=' + (p && p.baryByGroup ? p.baryByGroup.CLOUD_SW : 'n/a'));
            if (typeof window.pdTrace === 'function') window.pdTrace('onMessageSyncTuning', 'sync_panels.js', 'run=' + p.run + ' bary.CLOUD_SW=' + (p && p.baryByGroup ? p.baryByGroup.CLOUD_SW : 'n/a'));
            if (window.shell && window.shell.applyTuningFromScie) window.shell.applyTuningFromScie(p);
            else { applyTuningPayload(p); broadcastTuningToIframes(p); if (p.run === true) window.runComputeInParent(); }
        });
        window.addEventListener('message', function (event) {
            if (event.data.type !== 'action:nextEpoch') return;
            window.togglePlotAnim();
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
                // Appliquer l'état au DATA du contexte courant (parent) avant le calcul, sinon 🔬🌈/📿💫 non initialisés → NaN
                applyStateToData(payload);
                window.COMPUTE.getEpochDateConfig();
                window.SYNC_STATE.calculationInProgress = false;
                window.runComputeInParent();
            }
        }, 'sync_panels');
        IO_LISTENER.on('sync:tuning', function (payload) {
            window.SYNC_STATE.lastRunRequestSource = 'visu:IO_LISTENER:sync:tuning';
            if (window.DEBUG_SYNC_PANELS === true) console.log('[DBG sync_panels] IO sync:tuning run=' + payload.run + ' bary.CLOUD_SW=' + (payload && payload.baryByGroup ? payload.baryByGroup.CLOUD_SW : 'n/a'));
            if (typeof window.pdTrace === 'function') window.pdTrace('onSyncTuning', 'sync_panels.js', 'run=' + payload.run + ' bary.CLOUD_SW=' + (payload && payload.baryByGroup ? payload.baryByGroup.CLOUD_SW : 'n/a'));
            applyTuningPayload(payload);
            broadcastTuningToIframes(payload); // v1.1.44 : scie + bench + hysteresis
            if (payload.run === true) window.runComputeInParent();
        }, 'sync_panels');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSyncPanels);
    } else {
        initSyncPanels();
    }
})();
