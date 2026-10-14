// File: CO2/static/event_bus.js - Bus d'événements de l'interface
// Desc: Canal pub/sub moteur ↔ UI. Expose window.IO_LISTENER (on/off/emit). Source unique : DATA.
// Version 1.4.0
// - v1.4.0 (2026-10-12): quitte API_BILAN — le moteur ne parle plus que par le callback de api.run ;
//   ce bus ne relie plus que des morceaux de l'interface CO2.
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-03-08
//
// Events émis par l'API (payload minimal ou vide, handlers lisent window.DATA) :
// - configLoaded  : config chargée
// - cycleAlbedo   : cycle albédo terminé
// - cycleH2O      : cycle H2O terminé
// - cycleCalcul   : calcul radiatif (dichotomie) — refresh organigramme depuis DATA
// - compute:progress : progression (iteration, T0, total_flux, phase)
// - compute:done  : calcul terminé (payload.DATA, payload.result)
// - ProcessFinished : processus complet terminé
// Events émis par l'UI : sync:state, sync:tuning

(function () {
    'use strict';
    // listeners[eventName] = [ { fn, label }, ... ] — tableau par type d'événement, appelés en sync dans l'ordre
    const listeners = {};
    window.IO_LISTENER = {
        on: function (name, fn, label) {
            if (!listeners[name]) listeners[name] = [];
            listeners[name].push({ fn: fn, label: label });
        },
        off: function (name, fn) {
            listeners[name] = listeners[name].filter(function (item) { return item.fn !== fn; });
        },
        emit: function (name, payload) {
            const list = listeners[name];
            if (list === undefined) return;   // événement sans abonné : normal
            list.forEach(function (item) { item.fn(payload); });
        }
    };
})();
