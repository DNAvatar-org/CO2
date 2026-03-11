// File: API_BILAN/receiver.js - Récepteur universel API → dispatch visu / scie
// Desc: Reçoit (event, payload) de l'API et dispatch vers iframes ou local selon le contexte (index vs visu vs scie).
// Version 1.0.1
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// Date: 2025-02-25
// Logs: v1.0.1 FUNC_API_BILAN.createReceiver, const en tête du callback

'use strict';

/**
 * Crée le récepteur universel : reçoit les events de l'API et les dispatch.
 * - En index : postMessage vers visu-panel (contenu injecté) et scie-iframe.
 * - En iframe (visu ou scie seul) : mise à jour locale uniquement.
 *
 * @param {object} options - { visuTarget?: Window|Element, scieTarget?: Window, dispatchVisu?: boolean, dispatchScie?: boolean }
 * @returns {function(string, object)} callback(event, payload)
 */
function createReceiver(options) {
    const document = window.document;
    var opt = options || {};
    var visuTarget = opt.visuTarget || null;
    var scieTarget = opt.scieTarget || null;
    var dispatchVisu = opt.dispatchVisu !== false;
    var dispatchScie = opt.dispatchScie !== false;

    if (!visuTarget && typeof document !== 'undefined') {
        var visuPanel = document.getElementById('visu-panel');
        if (visuPanel && visuPanel.firstElementChild && visuPanel.firstElementChild.contentWindow) {
            visuTarget = visuPanel.firstElementChild.contentWindow;
        }
    }
    if (!scieTarget && typeof document !== 'undefined') {
        var iframe = document.getElementById('scie-iframe');
        if (iframe && iframe.contentWindow) scieTarget = iframe.contentWindow;
    }

    var isInIframe = typeof window !== 'undefined' && window !== window.top;

    return function (event, payload) {
        const IO_LISTENER = window.IO_LISTENER;
        const shell = window.shell;
        const updateFluxLabels = window.updateFluxLabels;
        const projectToVisu = window.projectToVisu;

        if (event === 'convergenceStep') {
            if (!isInIframe && !shell && dispatchScie && scieTarget) {
                try { scieTarget.postMessage({ type: 'convergenceStep', data: payload }, '*'); } catch (e) {}
            }
            return;
        }
        if (event === 'cycleCalcul') {
            if (IO_LISTENER) IO_LISTENER.emit('compute:progress', payload);
            if (!isInIframe && dispatchVisu && typeof updateFluxLabels === 'function') {
                try { updateFluxLabels('cycleCalcul'); } catch (e) {}
            }
            if (!isInIframe && dispatchScie && scieTarget && payload && payload.DATA) {
                try { scieTarget.postMessage({ type: 'cycleCalcul', DATA: payload.DATA, h2oVaporPercent: window.h2oVaporPercent }, '*'); } catch (e) {}
            }
            return;
        }
        if (event === 'ProcessFinished') {
            if (IO_LISTENER && payload && payload.DATA) {
                IO_LISTENER.emit('compute:done', { DATA: payload.DATA, result: payload.result });
            }
            if (!isInIframe && typeof projectToVisu === 'function' && payload && payload.DATA) {
                projectToVisu(payload.DATA);
            }
            if (!isInIframe && shell && shell.dataInput && payload && payload.DATA) {
                shell.dataInput({ type: 'compute:done', DATA: payload.DATA });
            } else if (!isInIframe && scieTarget && payload && payload.DATA) {
                try { scieTarget.postMessage({ type: 'compute:done', DATA: payload.DATA }, '*'); } catch (e) {}
            }
            if (typeof updateFluxLabels === 'function') {
                try { updateFluxLabels('ProcessFinished'); } catch (e) {}
            }
        }
    };
}

if (!window.FUNC_API_BILAN) window.FUNC_API_BILAN = {};
window.FUNC_API_BILAN.createReceiver = createReceiver;
window.createBilanRadiatifReceiver = createReceiver;
