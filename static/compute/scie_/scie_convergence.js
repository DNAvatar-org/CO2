// File: scie_convergence.js - Formatage HTML des étapes de convergence (scie)
// Desc: Module partagé parent + iframe scie : buildStepHtml(state) → fragment HTML pour #convergence-steps.
//       Utilisé par le shell pour stocker des chaînes HTML au lieu des payloads complets.
// Version 1.0.4
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: 2025-02-25
// Logs:
// - v1.0.2: export scieFormatJSONCompact pour logs hystérésis (💧🪩 instantanés)
// - v1.0.3: ligne radiatif — albédo en % (×100, fraction DATA) ; hint Δ = ☀️🔽+🌕🔽−🌈🔼 (🌑🔼/🪩🔼 hors bilan)
// - v1.0.4: titre sur « EDS H2O » — part dans sum_blocked (τ), pas vapeur molaire ni capacités 🌈 ; évite lecture « 0 % = pas d’eau »
// - v1.0.1: renomme H2O% en % EDS H2O pour éviter la confusion avec 🍰🫧💧
// Logs:
// - v1.0.0: extraction depuis scie_compute.html ; json2html, formatJSONCompact, buildStepHtml

(function () {
    'use strict';

    function formatJSONCompact(obj) {
        return JSON.stringify(obj, function (key, value) {
            if (typeof value === 'number') {
                if (Math.abs(value) > 1000 || (Math.abs(value) < 0.001 && value !== 0)) {
                    return value.toExponential(3);
                }
                return parseFloat(value.toFixed(3));
            }
            return value;
        });
    }

    function json2htmlConvergence(obj, objName, categoryKey) {
        if (!obj) return '';
        var formatNumber = function (value) {
            if (typeof value !== 'number') return value;
            if (value === 0) return '0.000';
            if (Math.abs(value) > 1000 || (Math.abs(value) < 0.001 && value !== 0)) {
                return value.toExponential(3);
            }
            return value.toFixed(3);
        };
        var formatValue = function (value) {
            if (value === null) return 'null';
            if (value === undefined) return 'undefined';
            if (typeof value === 'number') return formatNumber(value);
            if (typeof value === 'boolean') return value.toString();
            if (typeof value === 'string') return "'" + value + "'";
            if (Array.isArray(value)) {
                return '[' + value.map(formatValue).join(', ') + ']';
            }
            if (typeof value === 'object') {
                var entries = Object.keys(value).map(function (k) { return "'" + k + "':" + formatValue(value[k]); });
                return '{' + entries.join(', ') + '}';
            }
            return String(value);
        };
        var jsonStr = formatValue(obj);
        if (categoryKey) {
            jsonStr = categoryKey + '=' + jsonStr;
        } else if (objName) {
            jsonStr = objName + '=' + jsonStr;
        }
        var formuleHtml = '';
        if (categoryKey && window.FORM && window.FORM[categoryKey]) {
            var formulas = [];
            for (var key in obj) {
                if (window.FORM[categoryKey][key]) {
                    var formula = window.FORM[categoryKey][key];
                    if (formula.indexOf('!') === 0) continue;
                    var val = obj[key];
                    if (typeof val === 'number') {
                        var fmt = function (v) {
                            if (v === 0) return '0.000';
                            if (Math.abs(v) > 1000 || (Math.abs(v) < 0.001 && v !== 0)) return v.toExponential(3);
                            return v.toFixed(3);
                        };
                        formula = formula.replace(/%1/g, fmt(val));
                        formula = formula.replace(/%2/g, fmt(val));
                    }
                    formula = formula.replace(/∀/g, '<strong style="font-size: 1.1em;">∀</strong>');
                    formula = formula.replace(/∈/g, '<strong style="font-size: 1.1em;">∈</strong>');
                    formulas.push(key + ': ' + formula);
                }
            }
            if (formulas.length > 0) {
                formuleHtml = '<div class="formule">' + formulas.join('<br>') + '</div>';
            }
        }
        return '<div class="config-section"><div class="config-value">' + jsonStr + '</div>' +
            (formuleHtml ? '<div class="formule-container notVisible">' + formuleHtml + '</div>' : '') + '</div>';
    }

    var safeNumTempConv = function (v, def) {
        if (v == null) return def;
        var n = Number(v);
        if (!Number.isFinite(n)) return def;
        return n.toFixed(1);
    };
    var safeNumConv = function (v, def) {
        if (v == null) return def;
        var n = Number(v);
        if (!Number.isFinite(n)) return def;
        return (Math.abs(n) >= 1e3 || (Math.abs(n) < 1e-2 && n !== 0)) ? n.toExponential(3) : n.toFixed(3);
    };
    var safeNumDeltaConv = function (v, def) {
        if (v == null) return def;
        var n = Number(v);
        if (!Number.isFinite(n)) return def;
        var a = Math.abs(n);
        if (a >= 1e6) return (n < 0 ? '-' : '') + (a / 1e6).toFixed(1) + 'e6';
        if (a >= 1e3) return (n < 0 ? '-' : '') + (a / 1e3).toFixed(1) + 'e3';
        if (a < 1e-2 && n !== 0) return n.toExponential(2);
        return n.toFixed(2);
    };

    /**
     * Construit le fragment HTML d'une étape de convergence (cycle eau, crossing, ou itération radiative).
     * Utilise window.DATA / window.CONST si présents (iframe scie), sinon fallbacks.
     * @param {Object} state - payload d'étape (phase, data_snapshot, temperature_C, albedo, etc.)
     * @returns {string} HTML à insérer dans #convergence-steps
     */
    function buildStepHtml(state) {
        var DATA = window.DATA;
        var CONST = window.CONST || { KELVIN_TO_CELSIUS: 273.15 };
        if (!state) return '';
        var waterIter = (state.waterIter != null) ? state.waterIter : ((state.waterPass != null) ? state.waterPass : 0);
        var albedoIter = (state.albedoIter != null) ? state.albedoIter : ((state.waterPass != null) ? state.waterPass : 0);

        if (state.phase === 'CycleEau') {
            var T_cycle = safeNumTempConv((state.data_snapshot && state.data_snapshot['🧮'] && state.data_snapshot['🧮']['🧮🌡️'] != null) ? state.data_snapshot['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS : (DATA && DATA['🧮']) ? DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS : null, '-');
            var compactEau = (state.data_snapshot && state.data_snapshot['💧']) ? formatJSONCompact(state.data_snapshot['💧']).replace(/"/g, "'") : '';
            var h = '<div class="iteration-header convergence-cycle"><strong>💧 cycle de l\'eau ' + albedoIter + '</strong> @' + T_cycle + '°C :' + (compactEau ? '<span class="convergence-inline-json"> ' + compactEau + '</span>' : '') + '</div>';
            if (state.data_snapshot) {
                h += '<div class="convergence-cycle-eau-block convergence-cycle">';
                ['🫧', '💧', '⚖️', '🌊'].forEach(function (cat) {
                    if (state.data_snapshot[cat]) h += json2htmlConvergence(state.data_snapshot[cat], null, cat);
                });
                h += '</div>';
            }
            return h;
        }
        if (state.phase === 'CycleEauCrossing') {
            var T_trans = safeNumTempConv(state.T_transition_C, '-');
            var P_atm = (state.P_atm != null) ? Number(state.P_atm).toFixed(2) : '-';
            compactEau = (state.data_snapshot && state.data_snapshot['💧']) ? formatJSONCompact(state.data_snapshot['💧']).replace(/"/g, "'") : '';
            h = '<div class="iteration-header convergence-cycle"><strong>💧┴ = ' + T_trans + '°C [🎈=' + P_atm + ' atm]</strong> :' + (compactEau ? '<span class="convergence-inline-json"> ' + compactEau + '</span>' : '') + '</div>';
            if (state.data_snapshot) {
                h += '<div class="convergence-cycle-eau-block convergence-cycle">';
                ['🫧', '💧', '⚖️', '🌊'].forEach(function (cat) {
                    if (state.data_snapshot[cat]) h += json2htmlConvergence(state.data_snapshot[cat], null, cat);
                });
                h += '</div>';
            }
            return h;
        }
        if (state.innerIter == null) return '';

        var html = '';
        if (state.data_snapshot && state.data_snapshot['🪩']) {
            var compactAlbedo = formatJSONCompact(state.data_snapshot['🪩']).replace(/"/g, "'");
            var sulfateFrac = (state.data_snapshot['🫧'] && state.data_snapshot['🫧']['🍰🫧✈'] != null && Number.isFinite(state.data_snapshot['🫧']['🍰🫧✈'])) ? state.data_snapshot['🫧']['🍰🫧✈'] : 0;
            var sulfateBoostPct = (Math.min(0.35, sulfateFrac * 500) * 100).toFixed(1);
            var T_alb = safeNumTempConv(state.innerIter === -1 ? state.temperature_C : (state.next_T_C != null ? state.next_T_C : state.temperature_C), '-');
            html += '<div class="iteration-header convergence-cycle"><strong>🪩 cycle albédo ' + albedoIter + '</strong> @' + T_alb + '°C :<span class="convergence-inline-json"> ' + compactAlbedo + '</span> <span class="convergence-inline-json">| ✈️ CCN +' + sulfateBoostPct + '%</span></div>';
        }
        var innerIter = state.innerIter;
        var T = safeNumTempConv(state.temperature_C, '-');
        var albedoRaw = state.albedo;
        var albedoPctStr = '-';
        if (albedoRaw != null && Number.isFinite(Number(albedoRaw))) {
            var albedoNum = Number(albedoRaw);
            albedoPctStr = (albedoNum >= 0 && albedoNum <= 1)
                ? (albedoNum * 100).toFixed(1) + '%'
                : albedoNum.toFixed(2) + '%';
        }
        var phase = (state.phase != null) ? String(state.phase) : '-';
        var delta = safeNumDeltaConv(state.delta_equilibre, '-');
        var m = (state.data_snapshot && state.data_snapshot['🧮']) ? state.data_snapshot['🧮'] : {};
        var yy = (state.yinYang != null) ? Number(state.yinYang) : ((state.delta_equilibre != null) ? Math.sign(Number(state.delta_equilibre)) : 0);
        var yinYangStr = (yy === 1) ? '+' : (yy === -1) ? '−' : '0';
        var iterLabel = (innerIter === -1) ? 'Init' : (innerIter + 1);
        var T_low_K = m['🧮🌡️🔽'];
        var T_high_K = m['🧮🌡️🔼'];
        var dichoBounds = (T_low_K != null && T_high_K != null) ? ' [🔽: ' + safeNumTempConv(T_low_K - CONST.KELVIN_TO_CELSIUS, '-') + '°C, 🔼: ' + safeNumTempConv(T_high_K - CONST.KELVIN_TO_CELSIUS, '-') + '°C]' : '';
        var seuil = (m['🧲🔬'] != null) ? m['🧲🔬'] : null;
        var seuilStr = seuil != null ? safeNumConv(seuil, '-') : '-';
        var deltaVal = state.delta_equilibre != null ? Number(state.delta_equilibre) : NaN;
        var arretOk = (Number.isFinite(deltaVal) && seuil != null && Math.abs(deltaVal) <= seuil) ? 'oui' : 'non';
        var nextT = (state.next_T_C != null && Number.isFinite(state.next_T_C)) ? state.next_T_C.toFixed(1) : '';
        if (!nextT && phase === 'Dicho' && T_low_K != null && T_high_K != null && Number.isFinite(T_low_K) && Number.isFinite(T_high_K)) nextT = ((T_low_K + T_high_K) / 2 - CONST.KELVIN_TO_CELSIUS).toFixed(1);
        if (!nextT && state.dichoT_low_C != null && state.dichoT_high_C != null) nextT = ((state.dichoT_low_C + state.dichoT_high_C) / 2).toFixed(1);
        var nextTSuffix = nextT ? ' => ' + nextT + '°C' : '';
        var b = state.data_snapshot && state.data_snapshot['📛'];
        var h2oPctVal = (b && b['🍰📛💧'] != null) ? Number(b['🍰📛💧']) : null;
        var h2oEdsTitle = 'Part H₂O dans la somme des absorptions de bande (EDS τ, sum_blocked_* au passage spectral). Si CO₂/CH₄ dominent les bandes, cette part peut être très faible tout en ayant de la vapeur (voir 🍰🫧💧 et 🍰🫧💧🌈 ailleurs).';
        var h2oPctStr = (h2oPctVal != null && Number.isFinite(h2oPctVal))
            ? ('<span style="cursor:help;text-decoration:underline dotted" title="' + h2oEdsTitle + '">' + (h2oPctVal * 100).toFixed(1) + '%</span>')
            : '-';
        var h2oVs05 = (h2oPctVal != null && Number.isFinite(h2oPctVal) && h2oPctVal < 0.005) ? ' <0.5%' : '';
        var deltaHint = '<span style="cursor:help;opacity:0.75" title="Δ = 🧲☀️🔽+🧲🌕🔽−🧲🌈🔼 (solaire absorbé + lune − OLR au sommet). 🧲🌑🔼 (σT⁴ surface) et 🧲🪩🔼 (SW réfléchi au TOA) sont affichés en diagnostic ; ils ne s’additionnent pas dans Δ (l’albédo est déjà pris en compte dans 🧲☀️🔽).">ⓘ</span>';
        html += '<div class="iteration-header">🌈 calcul radiatif ' + iterLabel + ' @' + T + '°C : Albédo: ' + albedoPctStr + ' EDS H2O: ' + h2oPctStr + h2oVs05 + ' => Δ: ' + delta + ' W/m² ' + deltaHint + ' .. ⚧: ' + phase + ' & ☯: ' + yinYangStr + ' => arrêt |Δ|≤' + seuilStr + ' W/m²: ' + arretOk + dichoBounds + nextTSuffix + '</div>';
        html += '<div class="convergence-details-block">';
        var snap = state.data_snapshot || {};
        if (snap['🧮']) {
            var mCopy = {};
            for (var k in snap['🧮']) {
                if (k === 'previous') continue;
                if (k === '🌡️') continue; // doublon de 🧮🌡️, source unique = 🧮🌡️
                mCopy[k] = snap['🧮'][k];
            }
            html += json2htmlConvergence(mCopy, null, '🧮');
        }
        if (snap['🧲']) html += json2htmlConvergence(snap['🧲'], null, '🧲');
        if (snap['📛']) html += json2htmlConvergence(snap['📛'], null, '📛');
        html += '</div>';
        return html;
    }

    window.buildStepHtmlForConvergence = buildStepHtml;
    window.buildStepHtml = buildStepHtml;
    window.scieFormatJSONCompact = formatJSONCompact;
})();
