// File: scie_hyst_repro_state.js - Snapshot reproductible [REPRO] (hyst R&D + epoch)
// Desc: Même format JSON (une ligne [REPRO] …) après convergence API, pour diff hors-ligne
//       hyst/iframe vs fiches TIMELINE : masses, atmos, surfaces, 🎚️, ligne TIMELINE, adapter hyst.
// Version 1.1.1
// Copyright 2025-2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: April 25, 2026
// Logs:
// - v1.1.1: [REPRO] + export bloc ⛄ : scieFormatJSONCompact / scieStringifyDataPretty (notation e, pas entiers longs)
// - v1.1.0: export TIMELINE ⛄ = fusion + DATA (🌡️🧮 = T après dernier calcul ; caler la graine fiche
//   sur le pas dicho **chaud** ex. −2,9 °C, pas sur le pas à −60 °C)
// - v1.0.1: hyst.warmCo2Factor1a depuis window.HYST_RND_WARM_CO2_FACTOR_1A (scie_hysteresis_search)
// - v1.0.0: buildSnapshot + emitToHystPanel / emitToEpochFile (CONFIG_COMPUTE.logReproComparableState)

(function () {
    'use strict';

    var CC_KEYS = [
        'pressureBroadening', 'polarAmplificationK', 'midlatAmplificationK', 'useFactorTropopause',
        'radiativeFactorTropopauseFixed', 'troposphericLapseRateKPerM', 'plotSmoothEnable'
    ];

    function safeClone(o) {
        try { return JSON.parse(JSON.stringify(o)); } catch (e) { return null; }
    }

    function timelineRowByEpochId(epochId) {
        if (!window.TIMELINE || epochId == null) return null;
        var s = String(epochId);
        for (var i = 0; i < window.TIMELINE.length; i++) {
            var r = window.TIMELINE[i];
            if (r && r['📅'] === s) {
                return safeClone(r);
            }
        }
        return null;
    }

    function pickConfigCompute() {
        var C = window.CONFIG_COMPUTE;
        if (!C) return null;
        var o = {};
        for (var k = 0; k < CC_KEYS.length; k++) {
            var key = CC_KEYS[k];
            if (Object.prototype.hasOwnProperty.call(C, key)) o[key] = C[key];
        }
        return o;
    }

    function pickTuning() {
        var T = window.DATA && window.DATA['🎚️'];
        if (!T) return null;
        return {
            bary: T.bary,
            baryByGroup: T.baryByGroup ? safeClone(T.baryByGroup) : null,
            RADIATIVE: T.RADIATIVE ? safeClone(T.RADIATIVE) : null,
            CLOUD_SW: T.CLOUD_SW ? safeClone(T.CLOUD_SW) : null,
            SOLVER: T.SOLVER ? safeClone(T.SOLVER) : null,
            HYSTERESIS: T.HYSTERESIS ? safeClone(T.HYSTERESIS) : null
        };
    }

    /**
     * Instantané post-convergence — même schéma pour hyst (appendLog) et epoch (logToTopic).
     * @param {{ epochId?: string }} ctx
     * @returns {Object}
     */
    function buildSnapshot(ctx) {
        ctx = ctx || {};
        var D = window.DATA || {};
        var CONST = window.CONST;
        var T_K = D['🧮'] && D['🧮']['🧮🌡️'];
        var T_C = (Number.isFinite(T_K) && CONST) ? (T_K - CONST.KELVIN_TO_CELSIUS) : null;
        var ep = ctx.epochId;
        if (ep == null && D['📜'] && D['📜']['🗿'] != null) {
            ep = D['📜']['🗿'];
        }
        var H = window.HYSTERESIS;
        var ad = H && H.adapter;
        return {
            schema: 'hyst_repro_v1',
            epochId: String(ep != null ? ep : '—'),
            T_conv_C: (Number.isFinite(T_C) ? T_C : null),
            T_K: (Number.isFinite(T_K) ? T_K : null),
            phase: D['🧮'] && D['🧮']['🧮⚧'] != null ? D['🧮']['🧮⚧'] : null,
            stepKind: (ctx.stepKind != null ? String(ctx.stepKind) : null),
            masses: D['⚖️'] ? safeClone(D['⚖️']) : null,
            atmos: D['🫧'] ? {
                '🧪': D['🫧']['🧪'],
                '🍰🫧🏭': D['🫧']['🍰🫧🏭'],
                '🍰🫧🫁': D['🫧']['🍰🫧🫁'],
                '🍰🫧💨': D['🫧']['🍰🫧💨'],
                '🎈': D['🫧']['🎈'],
                '📏🫧🧿': D['🫧']['📏🫧🧿'],
                '📏🫧🛩': D['🫧']['📏🫧🛩'],
                '🍰🫧💧': D['🫧']['🍰🫧💧'],
                '🍰🌧💧': D['🫧']['🍰🌧💧'],
                '🍰🫧✈': D['🫧']['🍰🫧✈']
            } : null,
            water: D['💧'] ? safeClone(D['💧']) : null,
            surfaces: D['🪩'] ? safeClone(D['🪩']) : null,
            tuning: pickTuning(),
            timelineRow: ep ? timelineRowByEpochId(String(ep)) : null,
            hyst: H ? {
                active: H.active,
                epochId: H.epochId,
                phase: H.phase,
                outerIndex: H.outerIndex,
                adapter: (ad && ad.isBaryAdapter) ? { bary: true, co2MaxFactor: ad.co2MaxFactor } : { bary: false },
                warmCo2Factor1a: (typeof window.HYST_RND_WARM_CO2_FACTOR_1A === 'number' ? window.HYST_RND_WARM_CO2_FACTOR_1A : null)
            } : null,
            configCompute: pickConfigCompute()
        };
    }

    function oneLineRepro(snap) {
        var fn = window.scieFormatJSONCompact;
        var s = (typeof fn === 'function') ? fn(snap) : JSON.stringify(snap);
        return '[REPRO] ' + s;
    }

    function shouldEmit() {
        var C = window.CONFIG_COMPUTE;
        return C && C.logReproComparableState === true;
    }

    function emitToHystPanel(appendLog, stepKind) {
        if (!shouldEmit() || typeof appendLog !== 'function') return;
        var snap = buildSnapshot({ stepKind: stepKind != null ? stepKind : 'hyst:outer' });
        appendLog(oneLineRepro(snap));
    }

    function emitToEpochFile(logToTopic) {
        if (!shouldEmit() || typeof logToTopic !== 'function') return;
        var snap = buildSnapshot({ stepKind: 'epoch:compute:done' });
        logToTopic('epoch', oneLineRepro(snap));
    }

    var PLEIN_SNOWBALL_EPOCH = '⛄';

    /**
     * Remplace l’objet fiche ⛄ (TIMELINE) par : modèle `TIMELINE[⛄]` + masses DATA['⚖️'] + 🌡️🧮 (T courante) +
     * champs lourds depuis DATA['📅'] (🗻, 🌱, 🧫, 🌊🏭, 🔒, 🕰) quand cohérents.
     * Résultat : JSON 4 espaces, prêt à coller dans `configTimeline.js` à la place du bloc { '📅': '⛄', … }.
     */
    function exportPleinSnowTimelineBlockForConfig() {
        if (!window.TIMELINE || !window.DATA) {
            return '// (TIMELINE ou DATA manquant — recharger la page)\n';
        }
        var row = null;
        for (var i = 0; i < window.TIMELINE.length; i++) {
            if (window.TIMELINE[i] && window.TIMELINE[i]['📅'] === PLEIN_SNOWBALL_EPOCH) {
                row = safeClone(window.TIMELINE[i]);
                break;
            }
        }
        if (!row) {
            return "// TIMELINE : entrée { '📅': '⛄' } introuvable\n";
        }
        var m = window.DATA['⚖️'];
        if (m) {
            if (m['⚖️🏭'] != null) row['⚖️🏭'] = m['⚖️🏭'];
            if (m['⚖️🐄'] != null) row['⚖️🐄'] = m['⚖️🐄'];
            if (m['⚖️💧'] != null) row['⚖️💧'] = m['⚖️💧'];
            if (m['⚖️🫁'] != null) row['⚖️🫁'] = m['⚖️🫁'];
            if (m['⚖️💨'] != null) row['⚖️💨'] = m['⚖️💨'];
            if (m['⚖️✈'] != null) row['⚖️✈'] = m['⚖️✈'];
            if (m['⚖️🫧'] != null) row['⚖️🫧'] = m['⚖️🫧'];
        }
        var tK = window.DATA['🧮'] && window.DATA['🧮']['🧮🌡️'];
        if (Number.isFinite(tK)) {
            row['🌡️🧮'] = tK;
        }
        var e = window.DATA['📅'];
        if (e) {
            if (e['🗻'] != null) row['🗻'] = safeClone(e['🗻']);
            if (e['🌱'] != null) row['🌱'] = e['🌱'];
            if (e['🧫'] != null) row['🧫'] = e['🧫'];
            if (e['🌊🏭'] != null) row['🌊🏭'] = e['🌊🏭'];
            if (e['🔒'] != null) row['🔒'] = safeClone(e['🔒']);
            if (e['🕰'] != null) row['🕰'] = safeClone(e['🕰']);
        }
        var epId = (window.DATA['📜'] && window.DATA['📜']['🗿'] != null) ? String(window.DATA['📜']['🗿']) : '—';
        var header = '// Remplacement entrée TIMELINE Plein Snowball (⛄) — généré depuis l’état courant (DATA).\n'
            + '// Époque active (📜.🗿) au moment de l’export : ' + epId + '.\n'
            + "// Coller dans API_BILAN/config/configTimeline.js : remplacer l'objet entier { '📅': '⛄', … } par ce bloc, puis recharger.\n\n";
        var pFn = window.scieStringifyDataPretty;
        var pretty = (typeof pFn === 'function') ? pFn(row, 4) : JSON.stringify(row, null, 4);
        return header + pretty + '\n';
    }

    function copyPleinSnowTimelineBlockForConfig(appendLog, textAreaOrId) {
        var text = exportPleinSnowTimelineBlockForConfig();
        var ta = textAreaOrId;
        if (typeof textAreaOrId === 'string') {
            ta = document.getElementById(textAreaOrId);
        }
        if (ta && typeof ta.value !== 'undefined') {
            ta.value = text;
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text).then(function () {
                if (typeof appendLog === 'function') {
                    appendLog('━━ [TIMELINE ⛄] Bloc prêt (presse-papiers + zone ci-dessus) — coller dans API_BILAN/config/configTimeline.js ━━');
                }
            }).catch(function () {
                if (typeof appendLog === 'function') {
                    appendLog('━━ [TIMELINE ⛄] Presse-papiers refusé : copie depuis le champ texte ci-dessus ━━');
                }
            });
        } else if (typeof appendLog === 'function') {
            appendLog('━━ [TIMELINE ⛄] Bloc généré (copie depuis le champ texte) ━━');
        }
    }

    window.hystClickExportPleinSnowTimeline = function () {
        var ap = (window.HYSTERESIS && window.HYSTERESIS.appendLog)
            ? window.HYSTERESIS.appendLog.bind(window.HYSTERESIS)
            : function (x) { console.log(x); };
        var ta = document.getElementById('hyst-timeline-snow-export');
        copyPleinSnowTimelineBlockForConfig(ap, ta);
    };

    window.HYST_REPRO_LOG = {
        buildSnapshot: buildSnapshot,
        oneLineRepro: oneLineRepro,
        emitToHystPanel: emitToHystPanel,
        emitToEpochFile: emitToEpochFile,
        exportPleinSnowTimelineBlockForConfig: exportPleinSnowTimelineBlockForConfig,
        copyPleinSnowTimelineBlockForConfig: copyPleinSnowTimelineBlockForConfig
    };
})();
