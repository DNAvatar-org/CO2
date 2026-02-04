// File: event_bus.js - Bus d'événements moteur ↔ rendus
// Desc: Séparation moteur / rendus graphiques via events
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-02-03
// Logs:
// - Initial: data:sync, compute:start, compute:done, compute:abort

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
