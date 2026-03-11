// File: API_BILAN/event_bus.js - Bus d'événements API ↔ rendus
// Desc: Canal pub/sub moteur ↔ UI. Expose window.IO_LISTENER (on/off/emit). Source unique : DATA.
// Version 1.2.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-03-08
// Logs:
// - v1.1: events par ID, handlers lisent DATA
// - v1.2.0: déplacé dans API_BILAN (contrat émis par l'API)
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
    const listeners = {};
    window.IO_LISTENER = {
        on: function (name, fn) {
            if (!listeners[name]) listeners[name] = [];
            listeners[name].push(fn);
        },
        off: function (name, fn) {
            if (!listeners[name]) return;
            listeners[name] = listeners[name].filter(f => f !== fn);
        },
        emit: function (name, payload) {
            if (!listeners[name]) return;
            listeners[name].forEach(fn => {
                try { fn(payload); } catch (e) { console.error('[IO_LISTENER]', name, e); }
            });
        }
    };
})();
