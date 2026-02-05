// File: event_bus.js - Bus d'événements moteur ↔ rendus
// Desc: Séparation moteur / rendus graphiques via events. Source unique : DATA.
// Version 1.1.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-02-03
// Logs:
// - v1.1: events par ID, handlers lisent DATA (configLoaded, cycleAlbedo, cycleH2O, cycleCalcul, ProcessFinished)
//
// Events (payload minimal ou vide, handlers lisent window.DATA) :
// - configLoaded  : config chargée
// - cycleAlbedo   : cycle albédo terminé
// - cycleH2O      : cycle H2O terminé
// - cycleCalcul   : calcul radiatif (dichotomie) — refresh organigramme depuis DATA
// - compute:done  : calcul terminé (legacy, payload.DATA)
// - ProcessFinished : processus complet terminé

(function () {
    'use strict';
    const listeners = {};
    window.CO2_EVENTS = {
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
                try { fn(payload); } catch (e) { console.error('[CO2_EVENTS]', name, e); }
            });
        }
    };
})();
