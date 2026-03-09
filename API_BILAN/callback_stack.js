// File: API_BILAN/callback_stack.js - Pile de callbacks synchrones pour calculs intermédiaires
// Desc: Côté API, on ajoute des listeners ; les fonctions de calcul appellent runStack(event, payload) à chaque pas.
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-03-08
// Logs: Initial - pile synchrone, run appelle tous les listeners.

(function () {
    'use strict';

    var stack = [];

    function pushListener(fn) {
        if (typeof fn === 'function') stack.push(fn);
    }

    function popListener() {
        if (stack.length) stack.pop();
    }

    function runStack(event, payload) {
        for (var i = 0; i < stack.length; i++) {
            try {
                stack[i](event, payload);
            } catch (e) {
                if (typeof console !== 'undefined') console.error('[API_BILAN.runStack]', e);
            }
        }
    }

    function getStackLength() {
        return stack.length;
    }

    if (!window.FUNC_API_BILAN) window.FUNC_API_BILAN = {};
    window.FUNC_API_BILAN.callbackStack = {
        push: pushListener,
        pop: popListener,
        run: runStack,
        length: getStackLength
    };
})();
