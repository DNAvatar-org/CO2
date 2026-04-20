// File: static/timeline/scie_parent_bridge.js - Pont actions timeline scie_ → parent (IO_LISTENER, DATA)
// Desc: Dans l’iframe scie, events.js utilise le même updateEpochActions que le visu ; le parent exécute le calcul.
// Version 1.0.2
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2026-03-26
// Logs:
// - v1.0.0: IO_LISTENER.emit(config:applyThenCompute) → parent ; sync DATA[📜]/💧/infoTimeMa avant emit ; délégation setEpoch, updateTimeline, etc.
// - v1.0.1: updateTimeline = parent + timeline.js iframe + updateTimelineDisplay si défini ; hideTooltip noop si absent parent
// - v1.0.2: ne pas sortir si IO_LISTENER pas encore prêt (race iframe vs event_bus) — sinon addCustomTooltip jamais défini → updateEpochActions plante, 0 bouton ☄️/💫

(function () {
    'use strict';
    if (typeof window === 'undefined' || window === window.top) return;
    var pw = window.parent;
    if (!pw) return;

    window.addCustomTooltip = function (el, html) {
        if (!el) return;
        var t = typeof html === 'string' ? html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
        el.title = t;
    };
    window.hideTooltip = function () {};

    function syncDataToParent() {
        try {
            if (!pw.DATA || !window.DATA) return;
            if (window.DATA['📜']) {
                if (!pw.DATA['📜']) pw.DATA['📜'] = {};
                Object.assign(pw.DATA['📜'], window.DATA['📜']);
            }
            if (window.DATA['💧']) {
                if (!pw.DATA['💧']) pw.DATA['💧'] = {};
                Object.assign(pw.DATA['💧'], window.DATA['💧']);
            }
            pw.infoTimeMa = window.infoTimeMa;
            if (window.FLUX) pw.FLUX = window.FLUX;
            if (window.RUNTIME_STATE.h2oTotalFromMeteorites !== undefined) pw.h2oTotalFromMeteorites = window.RUNTIME_STATE.h2oTotalFromMeteorites;
            if (window.isIceChange !== undefined) pw.isIceChange = window.isIceChange;
            pw.UI_STATE = window.UI_STATE;
        } catch (e) {}
    }

    try {
        if (!pw.FLUX) pw.FLUX = {};
        window.FLUX = pw.FLUX;
    } catch (e) {}

    window.IO_LISTENER = {
        emit: function (type, payload) {
            if (type !== 'config:applyThenCompute') return;
            syncDataToParent();
            var bus = pw.IO_LISTENER;
            if (bus && typeof bus.emit === 'function') {
                bus.emit(type, payload);
            }
        }
    };

    function wrapParent(fnName) {
        if (typeof pw[fnName] !== 'function') return;
        window[fnName] = function () {
            syncDataToParent();
            return pw[fnName].apply(pw, arguments);
        };
    }

    wrapParent('setEpoch');
    var timelineJsLocal = window.updateTimeline;
    window.updateTimeline = function () {
        syncDataToParent();
        if (typeof pw.updateTimeline === 'function') pw.updateTimeline();
        if (typeof timelineJsLocal === 'function') timelineJsLocal();
        if (typeof window.updateTimelineDisplay === 'function') window.updateTimelineDisplay();
    };
    wrapParent('updateHadeenTexture');
    wrapParent('updateCO2LevelDirect');
    wrapParent('updateH2OLevelDirect');
    if (typeof pw.hideTooltip === 'function') {
        window.hideTooltip = function () {
            syncDataToParent();
            pw.hideTooltip.apply(pw, arguments);
        };
    }
    wrapParent('checkDateEvents');

    var origUEA = window.updateEpochActions;
    if (typeof origUEA !== 'function') return;
    window.updateEpochActions = function () {
        try {
            if (pw.infoTimeMa != null) window.infoTimeMa = pw.infoTimeMa;
            if (pw.currentEpochName) window.RUNTIME_STATE.currentEpochName = pw.currentEpochName;
        } catch (e) {}
        return origUEA.apply(this, arguments);
    };
})();
