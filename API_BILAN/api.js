// File: API_BILAN/api.js - Point d'entrée API calcul bilan radiatif
// Desc: API pure calcul (config + callback). Chargeable dans index, visu_ ou scie_. Pas de DOM/rendu.
// Version 1.0.1
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-02-25
// Logs: v1.0.1 FUNC_API_BILAN, const MAJ en tête ; dossier renommé API_BILAN

'use strict';

/**
 * API Bilan Radiatif : entrée config, sortie via callback (récepteur universel).
 * Le calcul est délégué aux modules déjà chargés (physics, calculations, calculations_flux, etc.).
 * Le callback reçoit (event, payload) et dispatch vers visu/scie selon le contexte.
 *
 * @param {function(string, object)} callback - Récepteur: callback(event, payload). Events: 'convergenceStep' | 'cycleCalcul' | 'ProcessFinished'
 */
function BilanRadiatifAPI(callback) {
    this.callback = typeof callback === 'function' ? callback : function () {};
}

/** Identifiant d'époque par défaut de l'API (si aucun config ni epochId passé). */
var DEFAULT_EPOCH_ID = '⚫';

/**
 * Applique la config au contexte global (DATA, SYNC_STATE, etc.) puis lance le calcul.
 * Entrée : objet config { epochId?, animEnabled?, ticTime?, tuning? } OU un identifiant d'époque (string).
 * Si un identifiant seul est passé, c'est celui de l'API (paramètre) qui est pris ; sinon config.epochId ou défaut API.
 * Exécution asynchrone (Promise) ; le callback est appelé pendant l'exécution.
 *
 * @param {object|string} configOrEpochId - config complète ou identifiant d'époque (ex. '⚫')
 * @returns {Promise<object|null>} - Résultat du calcul (ou null si abort/erreur)
 */
BilanRadiatifAPI.prototype.run = function (configOrEpochId) {
    const DATA = window.DATA;
    const TIMELINE = window.TIMELINE;
    const SYNC_STATE = window.SYNC_STATE;
    const initForConfig = window.initForConfig;
    const computeRadiativeTransfer = window.computeRadiativeTransfer;
    var self = this;

    if (!DATA || !TIMELINE) {
        if (typeof console !== 'undefined') console.error('[BilanRadiatifAPI] DATA ou TIMELINE manquant');
        return Promise.resolve(null);
    }

    var config = (typeof configOrEpochId === 'string' || typeof configOrEpochId === 'undefined')
        ? { epochId: configOrEpochId != null ? configOrEpochId : DEFAULT_EPOCH_ID }
        : (configOrEpochId || {});

    var epochId = config.epochId != null ? config.epochId : (SYNC_STATE && SYNC_STATE.epochId) || DEFAULT_EPOCH_ID;
    var idx = TIMELINE.findIndex(function (item) { return item['📅'] === epochId; });
    if (idx >= 0) {
        DATA['📅'] = TIMELINE[idx];
        if (!DATA['📜']) DATA['📜'] = {};
        DATA['📜']['👉'] = idx;
        DATA['📜']['🗿'] = epochId;
    }
    if (config.animEnabled !== undefined && SYNC_STATE) SYNC_STATE.animEnabled = config.animEnabled;
    if (config.ticTime !== undefined && SYNC_STATE) SYNC_STATE.ticTime = config.ticTime;
    if (config.tuning && typeof window.applyTuningPayload === 'function') window.applyTuningPayload(config.tuning);
    if (typeof window.getEnabledStates === 'function') window.getEnabledStates();
    if (typeof window.getMasses === 'function') window.getMasses();
    if (config.animEnabled === false) {
        DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'];
    }

    DATA['🧮']['previous'] = [];
    DATA['🧮']['🧮🔄🌊'] = 0;
    DATA['🧮']['🧮🔄🪩'] = 0;
    window.h2oTotalFromMeteorites = 0;
    if (typeof window.calculationInProgress !== 'undefined') window.calculationInProgress = true;

    if (typeof initForConfig !== 'function') {
        if (typeof window.calculationInProgress !== 'undefined') window.calculationInProgress = false;
        return Promise.resolve(null);
    }

    if (!initForConfig()) {
        if (typeof window.calculationInProgress !== 'undefined') window.calculationInProgress = false;
        return Promise.resolve(null);
    }

    var callbackStack = window.FUNC_API_BILAN && window.FUNC_API_BILAN.callbackStack;
    var dispatcher = self.callback;
    if (callbackStack) {
        callbackStack.push(self.callback);
        dispatcher = function (event, payload) {
            callbackStack.run(event, payload);
        };
    }

    var computePromise = (typeof computeRadiativeTransfer === 'function')
        ? computeRadiativeTransfer(dispatcher)
        : Promise.resolve(null);

    return computePromise.then(function (result) {
        const DATA = window.DATA;
        if (typeof window.calculationInProgress !== 'undefined') window.calculationInProgress = false;
        if (callbackStack) callbackStack.pop();
        self.callback('ProcessFinished', { DATA: DATA, result: result });
        return result;
    }).catch(function (e) {
        if (typeof window.calculationInProgress !== 'undefined') window.calculationInProgress = false;
        if (callbackStack) callbackStack.pop();
        throw e;
    });
};

if (!window.FUNC_API_BILAN) window.FUNC_API_BILAN = {};
window.FUNC_API_BILAN.BilanRadiatifAPI = BilanRadiatifAPI;
window.FUNC_API_BILAN.defaultEpochId = DEFAULT_EPOCH_ID;
window.BilanRadiatifAPI = BilanRadiatifAPI;
