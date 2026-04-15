// ============================================================================
// File: debug.js - Interface de debug pour le style
// Desc: En français, dans l'architecture, je suis le module d'interface de debug
// Version 1.0.8
// Date: [April 02, 2026] [21:15 UTC+1]
// logs :
// - v1.0.8: _logStep même libellé que groupe courant → return (pas de groupEnd+reopen ; évite double [0] / faux « groupe jamais fermé »)
// - v1.0.7: pd() = erreurs uniquement (❌) ; pdTrace() = trace/diagnostic/appel (🔍) ; _logStep avertit si libellé déjà ouvert
// - v1.0.6: _logStep / _logStepEnd / _openLogGroup (avant configOrganigramme.js) — [1] config en groupCollapsed partout
// - v1.0.5: log surfaces 🍰🪩🎾 (ex-🍰🪩🌋)
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.2: pd() PrintDebug global
// - v1.0.3: pd() format ❌ + répétitions (x n) sur même ligne
// - v1.0.4: pd() log immédiat + répétitions compactées au prochain message
// ============================================================================

// pd() = erreurs / anomalies uniquement. Format: ❌ [fonction][fichier] message
// pdTrace() = traces, diagnostics, appels instrumentés. Format: 🔍 [fonction][fichier] message
(function () {
    let _pdLastLine = '';
    let _pdRepeatCount = 0;
    let _ptLastLine = '';
    let _ptRepeatCount = 0;

    function flushPd() {
        if (_pdLastLine && _pdRepeatCount > 0) {
            console.log(_pdLastLine + ' (x ' + (_pdRepeatCount + 1) + ')');
        }
    }
    function flushPt() {
        if (_ptLastLine && _ptRepeatCount > 0) {
            console.log(_ptLastLine + ' (x ' + (_ptRepeatCount + 1) + ')');
        }
    }

    window.pd = function (fn, file, msg) {
        const line = '❌ [' + fn + '][' + file + '] ' + msg;
        if (line === _pdLastLine) { _pdRepeatCount++; return; }
        flushPd();
        console.log(line);
        _pdLastLine = line;
        _pdRepeatCount = 0;
    };

    window.pdTrace = function (fn, file, msg) {
        const line = '🔍 [' + fn + '][' + file + '] ' + msg;
        if (line === _ptLastLine) { _ptRepeatCount++; return; }
        flushPt();
        console.log(line);
        _ptLastLine = line;
        _ptRepeatCount = 0;
    };

    window.pdFlush = function () {
        if (_pdLastLine && _pdRepeatCount > 0) {
            console.log(_pdLastLine + ' (x ' + (_pdRepeatCount + 1) + ')');
            _pdRepeatCount = 0;
        }
    };
    window.pdTraceFlush = function () {
        if (_ptLastLine && _ptRepeatCount > 0) {
            console.log(_ptLastLine + ' (x ' + (_ptRepeatCount + 1) + ')');
            _ptRepeatCount = 0;
        }
    };
})();

// ============================================================================
// LOG STEPS — groupCollapsed ; chargé avant configOrganigramme.js (index + scie_)
// ============================================================================
window._openLogGroup = null;
window._logStep = function (label) {
    // Même libellé que le groupe déjà ouvert : ne pas groupEnd+rouvrir (sinon 2× la même ligne debug.js + impression de groupe non fermé).
    if (window._openLogGroup === label) {
        console.warn('⚠️ [_logStep] Libellé déjà ouvert — ignoré (évite double groupCollapsed) :', label);
        return;
    }
    if (window._openLogGroup !== null) { console.groupEnd(); window._openLogGroup = null; }
    console.groupCollapsed(label);
    window._openLogGroup = label;
};
window._logStepEnd = function () {
    if (window._openLogGroup !== null) { console.groupEnd(); window._openLogGroup = null; }
};

(function () {
    'use strict';

    function initDebugInterface() {
        // Interface de debug désactivée - plus de boutons de debug
        // Le bouton "Blur Off" a été retiré
        return; // Ne rien faire
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDebugInterface);
    } else {
        initDebugInterface();
    }
})();

// ============================================================================
// TRACE CALLS (crash-first via pd)
// Desc: Wrap fonctions globales pour tracer les appels + inputs (comparaison search vs visu_)
// Version 1.0.5
// Logs:
// - v1.0.5: add installFunctionTraces() to wrap key engine functions
// ============================================================================
(function () {
    'use strict';

    function safeStr(v) {
        try {
            if (v === undefined) return 'undefined';
            if (v === null) return 'null';
            if (typeof v === 'string') return JSON.stringify(v.length > 80 ? v.slice(0, 77) + '…' : v);
            if (typeof v === 'number' || typeof v === 'boolean') return String(v);
            if (Array.isArray(v)) return '[len=' + v.length + ']';
            if (typeof v === 'object') {
                const keys = Object.keys(v);
                return '{' + keys.slice(0, 8).join(',') + (keys.length > 8 ? ',…' : '') + '}';
            }
            return String(v);
        } catch (e) {
            return '(unprintable)';
        }
    }

    function wrapGlobalFunction(fnName, fileHint) {
        const orig = window[fnName];
        if (typeof orig !== 'function') return false;
        if (orig && orig.__pd_wrapped) return true;
        function wrapped() {
            const args = Array.prototype.slice.call(arguments);
            window.pdTrace('call', fileHint || 'trace', fnName + '(' + args.map(safeStr).join(', ') + ')');
            return orig.apply(this, args);
        }
        wrapped.__pd_wrapped = true;
        wrapped.__pd_orig = orig;
        window[fnName] = wrapped;
        return true;
    }

    window.installFunctionTraces = function () {
        // Crash-first: pd() doit exister
        window.pdTrace('trace', 'debug.js', 'installFunctionTraces()');

        // Pipeline (visu_ + search)
        wrapGlobalFunction('getEpochDateConfig', 'compute.js');
        wrapGlobalFunction('getMasses', 'compute.js');
        wrapGlobalFunction('getEnabledStates', 'compute.js');
        wrapGlobalFunction('initForConfig', 'calculations_flux.js');
        wrapGlobalFunction('cycleDeLeau', 'calculations_flux.js');
        wrapGlobalFunction('computeRadiativeTransfer', 'calculations_flux.js');

        // Physique/atm/h2o/albedo (fonctions souvent responsables des bifurcations)
        wrapGlobalFunction('calculateAtmosphereComposition', 'calculations_atm.js');
        wrapGlobalFunction('calculatePressureAtm', 'calculations_atm.js');
        wrapGlobalFunction('calculateWaterPartition', 'calculations_h2o.js');
        wrapGlobalFunction('calculateH2OParameters', 'calculations_h2o.js');
        wrapGlobalFunction('calculateAlbedo', 'calculations_albedo.js');
        wrapGlobalFunction('calculateGeologySurfaces', 'calculations_albedo.js');

        // CO2 océan
        if (window.CO2 && typeof window.CO2.calculateCO2Partition === 'function' && !window.CO2.calculateCO2Partition.__pd_wrapped) {
            const orig = window.CO2.calculateCO2Partition;
            function wrappedCO2() {
                window.pdTrace('call', 'calculations_co2.js', 'CO2.calculateCO2Partition()');
                return orig.apply(this, arguments);
            }
            wrappedCO2.__pd_wrapped = true;
            wrappedCO2.__pd_orig = orig;
            window.CO2.calculateCO2Partition = wrappedCO2;
        }

        return true;
    };
})();

function logDeltaEquilibre() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const delta_equilibre = DATA['🧲']['🔺🧲'] || 0;
    const T0_current = DATA['🧮']['🧮🌡️'];
    const T_effective = Math.pow((DATA['🧲']['🧲🌈🔼'] || 0) / CONST.STEFAN_BOLTZMANN, 0.25);
    const blackbody_flux_T0 = CONST.STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
    const delta_eds = blackbody_flux_T0 - (DATA['🧲']['🧲🌈🔼'] || 0);
    const tolerance_current = DATA['🧮']['🧲🔬'] || 0.1;
    const tolerance_status = Math.abs(delta_equilibre) <= tolerance_current ? '✅' : '🧮';
    console.log(`🌡️ Delta équilibre (→0): ${delta_equilibre.toFixed(4)} W/m² | T° sol: ${T0_current.toFixed(2)}K (${(T0_current - CONST.KELVIN_TO_CELSIUS).toFixed(1)}°C) | T° corps noir: ${T_effective.toFixed(2)}K (${(T_effective - CONST.KELVIN_TO_CELSIUS).toFixed(1)}°C) | Delta EDS: ${delta_eds.toFixed(4)} W/m² | Tolérance: ${tolerance_current.toFixed(2)} W/m² ${tolerance_status}`);
}

window.logDeltaEquilibre = logDeltaEquilibre;

/** Log détaillé pour les premiers calculs (delta ~+9.8 W/m²).
 * Accumule le texte dans window.DETAIL_LOG_TEXT pour affichage HTML. */
function logDetailPremiersCalculs(stepLabel, DATA, CONST, extra) {
    if (!DATA) return;
    const lines = [];
    const add = (s) => { lines.push(s); console.log(s); };
    const T_K = DATA['🧮'] && DATA['🧮']['🧮🌡️'];
    const T_C = T_K != null ? T_K - CONST.KELVIN_TO_CELSIUS : null;
    const flux_in = (DATA['🧲'] && (DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'])) || extra?.flux_in;
    const flux_out = (DATA['🧲'] && DATA['🧲']['🧲🌈🔼']) || extra?.flux_out;
    const delta = extra?.delta ?? (DATA['🧲'] && DATA['🧲']['🔺🧲']);
    const solar_top = DATA['☀️'] && DATA['☀️']['🧲☀️🎱'];
    const albedo = DATA['🪩'] && DATA['🪩']['🍰🪩📿'];
    const solar_absorbed = solar_top != null && albedo != null ? solar_top * (1 - albedo) : null;
    add('═══════════════════════════════════════════════════════════════');
    add('[DETAIL] ' + stepLabel + ' | T=' + (T_C != null ? T_C.toFixed(1) : '?') + '°C | delta=' + (delta != null ? delta.toFixed(2) : '?') + ' W/m²');
    add('───────────────────────────────────────────────────────────────');
    const sigma = CONST && CONST.STEFAN_BOLTZMANN;
    const bb_flux = (T_K != null && sigma) ? sigma * Math.pow(T_K, 4) : null;
    add('BILAN RADIATIF: flux_in=' + (flux_in != null ? flux_in.toFixed(2) : '?') + ' flux_out=' + (flux_out != null ? flux_out.toFixed(2) : '?') + ' delta=' + (delta != null ? delta.toFixed(2) : '?') + ' W/m²');
    add('  solar_top=' + (solar_top != null ? solar_top.toFixed(2) : '?') + ' albedo=' + (albedo != null ? albedo.toFixed(4) : '?') + ' solar_absorbed=' + (solar_absorbed != null ? solar_absorbed.toFixed(2) : '?'));
    add('  blackbody_surface=' + (bb_flux != null ? bb_flux.toFixed(2) : '?') + ' (sigma*T^4) | EDS_blocked=' + (bb_flux != null && flux_out != null ? (bb_flux - flux_out).toFixed(2) : '?') + ' W/m²');
    add('ALBEDO: total=' + (albedo != null ? albedo.toFixed(4) : '?'));
    if (DATA['🪩']) {
        const w = DATA['🪩'];
        add('  surfaces: volcano=' + (w['🍰🪩🎾'] != null ? w['🍰🪩🎾'].toFixed(3) : '?') + ' ocean=' + (w['🍰🪩🌊'] != null ? w['🍰🪩🌊'].toFixed(3) : '?') + ' forest=' + (w['🍰🪩🌳'] != null ? w['🍰🪩🌳'].toFixed(3) : '?') + ' land=' + (w['🍰🪩🌍'] != null ? w['🍰🪩🌍'].toFixed(3) : '?') + ' desert=' + (w['🍰🪩🏜️'] != null ? w['🍰🪩🏜️'].toFixed(3) : '?') + ' ice=' + (w['🍰🪩🧊'] != null ? w['🍰🪩🧊'].toFixed(3) : '?'));
        add('  clouds: cloud_frac=' + (w['🍰🪩⛅'] != null ? w['🍰🪩⛅'].toFixed(3) : '?') + ' cloud_index=' + (w['☁️'] != null ? w['☁️'].toFixed(3) : '?'));
    }
    if (DATA['💧']) {
        const q = DATA['💧'];
        add('CYCLE EAU: vapor=' + (q['🍰🫧💧'] != null ? q['🍰🫧💧'].toExponential(3) : '?') + ' max_frac=' + (q['🍰🧮🌧'] != null ? q['🍰🧮🌧'].toExponential(3) : '?') + ' ice_stock=' + (q['🍰💧🧊'] != null ? q['🍰💧🧊'].toFixed(3) : '?'));
    }
    if (DATA['🫧']) {
        const p = DATA['🫧'];
        add('ATMOSPHERE: P_atm=' + (p['🎈'] != null ? p['🎈'].toFixed(3) : '?') + ' CO2_frac=' + (p['🍰🫧🏭'] != null ? p['🍰🫧🏭'].toExponential(4) : '?'));
    }
    if (DATA['⚖️']) {
        const m = DATA['⚖️'];
        add('MASSES: CO2_kg=' + (m['⚖️🏭'] != null ? m['⚖️🏭'].toExponential(2) : '?') + ' H2O_kg=' + (m['⚖️💧'] != null ? m['⚖️💧'].toExponential(2) : '?'));
    }
    if (DATA['📛']) {
        const b = DATA['📛'];
        const eds = b['🧲📛'] != null ? b['🧲📛'] : 0;
        const co2W = b['🍰📛🏭'] != null ? (eds * b['🍰📛🏭']).toFixed(2) : '?';
        const h2oW = b['🍰📛💧'] != null ? (eds * b['🍰📛💧']).toFixed(2) : '?';
        const ch4W = b['🍰📛🐄'] != null ? (eds * b['🍰📛🐄']).toFixed(2) : '?';
        const cloudW = b['🍰📛⛅'] != null ? (eds * b['🍰📛⛅']).toFixed(2) : '?';
        add('EDS W/m²: total=' + (eds > 0 ? eds.toFixed(2) : '?') + ' CO2=' + co2W + ' H2O=' + h2oW + ' CH4=' + ch4W + ' Nuages=' + cloudW + ' (%=part EDS)');
    }
    if (EARTH && EARTH.H2O_EDS_SCALE != null) {
        add('H2O_VAPOR_EDS_SCALE=' + Number(EARTH.H2O_EDS_SCALE).toFixed(3));
    }
    if (DATA['☀️']) add('SOLAIRE: flux_top=' + (DATA['☀️']['🧲☀️🎱'] != null ? DATA['☀️']['🧲☀️🎱'].toFixed(2) : '?') + ' W/m²');
    if (DATA['🌕']) add('GEO: flux=' + (DATA['🌕']['🧲🌕'] != null ? DATA['🌕']['🧲🌕'].toFixed(2) : '?') + ' W/m²');
    if (extra && extra.bins) add('SPECTRE: bins=' + extra.bins + ' layers=' + (extra.layers || '?'));
    if (extra && extra.epochId) add('EPOQUE: ' + extra.epochId + ' T_cible=' + (extra.T_cible_K != null ? (extra.T_cible_K - CONST.KELVIN_TO_CELSIUS).toFixed(1) : '?') + '°C');
    add('═══════════════════════════════════════════════════════════════');
    window.DETAIL_LOG_TEXT = (window.DETAIL_LOG_TEXT || '') + lines.join('\n') + '\n';
}
window.logDetailPremiersCalculs = logDetailPremiersCalculs;
