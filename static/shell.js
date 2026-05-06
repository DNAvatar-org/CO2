// File: shell.js - Dispatch des sorties calcul vers le panel actif (visu ou scie)
// Desc: Couche de routage unique entre moteur de calcul et affichage.
//       - Entrée calcul → shell : tout (convergenceStep, compute:done, etc.) passe par dataInput(payload)
//         et est envoyé au panel actif (visu ou scie) via current.dataInput ; buffer convergence pour restauration scie à l'ouverture onglet.
//       - Entrée utilisateur → shell : setEpoch/setState ; runCompute / applyStateFromScie / applyTuningFromScie = mêmes refs que window.*
//         (assignées dans sync_panels initSyncPanels — pas de wrappers dupliqués ici).
//       En standalone (visu_ ou scie_ sans index), current = cette page.
// Version 1.0.15
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: 2025-02-25
// Logs: v1.0.15 runCompute / apply* — corps retirés ; shell.* = refs sync_panels (initSyncPanels).
// Logs: v1.0.14 setState — clés présentes via hasOwn (!== undefined retiré) ; plus de forceResetTics (non traité par setEpoch@main).
// Logs: v1.0.13 setState — plus de checkbox (#plot-anim-toggle-checkbox) ni doublon SYNC_STATE ; syncToScie fait SYNC_STATE.
// Logs: v1.0.12 setState animEnabled — accès direct DATA['🔘'] (plus de garde && window.DATA).
// Logs: v1.0.11 setState — applique animEnabled à DATA['🔘']['🔘🎞'] + checkbox (aligné applyToVisu ; clic frise via shell).
// Logs: v1.0.10 epochNameToId 🐊 « Éocène »
// Logs: v1.0.8 resolveEpochIdForTimeline — syncToScie/setState utilisent 📅 (emoji), pas le nom français (fix 🎞 Hadéen)
// Logs: v1.0.7 setState → setEpoch(payload.epochId, { forceResetTics }) si payload.forceResetTics (bouton époque)
// Logs:
// - v1.0.6: convergence:clear et convergence:append toujours envoyés à scie (cycles à jour même quand current=visu)
// - v1.0.5: logs [shell] setCurrentPanel, dataInput (convergenceStep/clear/compute:done), restoreConvergenceToScie, switchTab(visu/scie) pour tracer A/R
// - v1.0.4: compute:done toujours envoyé à l'iframe scie pour mise à jour convergence sans aller-retour onglet
// - v1.0.3: buffer convergence = HTML (buildStepHtmlForConvergence), restore stepsHtml ; dépend de scie_convergence.js
// - v1.0.2: buffer convergence (steps) pour restauration scie au switch ; getConvergenceTrace, restoreConvergenceToScie
// - v1.0.1: façade shell vs sync_panels (setEpoch, calcul, apply depuis scie)
// - v1.0.0: current + dataInput(payload), registerPanelApi, setCurrentPanel ; doc dispatch + standalone

(function () {
    'use strict';

    var LOG = function () { /* logs désactivés */ };

    /** Référence au panel actif (visu ou scie). API : { dataInput: function(payload) {} } */
    var current = null;

    /** APIs enregistrées par nom de panel. */
    var panels = { visu: null, scie: null };

    /** Trace des étapes de convergence (cycles, détails, formules) pour affichage différé dans scie au switch onglet. */
    var convergenceSteps = [];

    /** Payload partiel sync : tester la présence de la clé (distinct d'une valeur undefined explicite). */
    function ownPayloadKey(o, k) {
        return Object.prototype.hasOwnProperty.call(o, k);
    }

    /** TIMELINE['📅'] = emoji ; les libellés français (ex. Hadéen) doivent être résolus avant syncToScie / applyStateToData. */
    function resolveEpochIdForTimeline(raw) {
        if (raw == null || raw === '') return raw;
        var T = window.TIMELINE;
        if (T && T.length) {
            var i;
            for (i = 0; i < T.length; i++) {
                if (T[i]['📅'] === raw) return raw;
            }
        }
        // Map name→id depuis CHARS_DESC (source de vérité) + alias
        var nameToEmoji = Object.entries(window.CHARS_DESC || {}).reduce(function(m, e) { m[e[1]] = e[0]; return m; }, {
            'Hyperthermie éocène': '🐊', 'Prélude glaciaire': 'hysteresis 2', 'EOT (33,9 Ma)': '🏔'
        });
        return ownPayloadKey(nameToEmoji, raw) ? nameToEmoji[raw] : raw;
    }
    window.resolveEpochIdForTimeline = resolveEpochIdForTimeline;

    /** Actions boutons : point d'entrée unique. syncToScie/setEpoch/runComputeInParent sont dans sync_panels. */
    function setEpoch(epochId, options) {
        var resolved = resolveEpochIdForTimeline(epochId);
        window.setEpoch(resolved, options);
        window.syncToScie({ epochId: resolved });
    }
    function setState(payload) {
        var syncPayload = payload;
        if (ownPayloadKey(payload, 'epochId')) {
            var resolved = resolveEpochIdForTimeline(payload.epochId);
            window.setEpoch(resolved);
            syncPayload = Object.assign({}, payload, { epochId: resolved });
        }
        if (ownPayloadKey(payload, 'animEnabled')) {
            window.DATA['🔘']['🔘🎞'] = payload.animEnabled;
        }
        window.syncToScie(syncPayload);
    }

    /**
     * Enregistre l'API d'un panel. À appeler au chargement (loader/sync_panels).
     * @param {string} name - 'visu' | 'scie'
     * @param {{ dataInput: function(Object) }} api - au minimum { dataInput: function(payload) {} }
     */
    function registerPanelApi(name, api) {
        if (name === 'visu' || name === 'scie') {
            panels[name] = api;
        }
    }

    /**
     * Définit le panel actif (onglet affiché). À appeler au changement d'onglet.
     * @param {string} name - 'visu' | 'scie'
     */
    function setCurrentPanel(name) {
        if (name === 'visu' || name === 'scie') {
            current = panels[name];
            LOG('setCurrentPanel ' + name);
        }
    }

    /**
     * Envoie les infos de calcul au panel actif. Point d'entrée unique pour convergence, texture, compute:done, etc.
     * Stocke le HTML des étapes (buildStepHtmlForConvergence) pour limiter la taille du buffer ; restauration scie au switch onglet.
     * @param {Object} payload - ex. { type: 'convergenceStep', data: ... } ou { type: 'compute:done', DATA: ... }
     */
    function dataInput(payload) {
        var cur = (current === panels.visu) ? 'visu' : (current === panels.scie) ? 'scie' : 'null';
        var iframe = document.getElementById('scie-iframe');
        var scieWin = iframe && iframe.contentWindow;

        if (payload.type === 'convergenceStep' && payload.data != null) {
            var html = window.buildStepHtmlForConvergence(payload.data);
            if (html) convergenceSteps.push(html);
            LOG('dataInput convergenceStep buffer=' + convergenceSteps.length + ' -> current=' + cur + ' + postMessage(scie append)');
            current.dataInput(payload);
            if (scieWin) {
                try { scieWin.postMessage({ type: 'convergence:append', step: payload.data }, '*'); } catch (e) {}
            }
            return;
        }
        if (payload.type === 'clearConvergenceTrace') {
            convergenceSteps = [];
            LOG('dataInput clearConvergenceTrace buffer=0 -> current=' + cur + ' + postMessage(scie clear)');
            current.dataInput(payload);
            if (scieWin) {
                try { scieWin.postMessage({ type: 'convergence:clear' }, '*'); } catch (e) {}
            }
            return;
        }
        if (payload.type === 'compute:done') {
            LOG('dataInput compute:done -> current=' + cur + ' + postMessage(scie)');
            current.dataInput(payload);
            if (scieWin) {
                try { scieWin.postMessage({ type: 'compute:done', DATA: payload.DATA }, '*'); } catch (e) {}
            }
            return;
        }
        if (payload.type === 'displayConvergence' || payload.type === 'convergenceStep') {
            current.dataInput(payload);
            return;
        }
        current.dataInput(payload);
    }

    /** Retourne la trace des étapes de convergence (tableau de chaînes HTML). */
    function getConvergenceTrace() {
        return { stepsHtml: convergenceSteps.slice(0) };
    }

    /** Envoie la trace HTML stockée à l'iframe scie (clear + insert chaque chunk + displayConvergence). Appelé à l'ouverture onglet scie. */
    function restoreConvergenceToScie() {
        var iframe = document.getElementById('scie-iframe');
        if (!iframe || !iframe.contentWindow || convergenceSteps.length === 0) {
            LOG('restoreConvergenceToScie skip (no iframe or buffer=' + convergenceSteps.length + ')');
            return;
        }
        LOG('restoreConvergenceToScie stepsHtml=' + convergenceSteps.length + ' (ouverture onglet scie)');
        try {
            iframe.contentWindow.postMessage({ type: 'convergence:restore', stepsHtml: convergenceSteps.slice(0) }, '*');
        } catch (e) {}
    }

    /** Retourne le nom du panel actif ('visu' | 'scie') ou null. */
    function getCurrentPanel() {
        if (current === panels.visu) return 'visu';
        if (current === panels.scie) return 'scie';
        return null;
    }

    window.shell = {
        registerPanelApi: registerPanelApi,
        setCurrentPanel: setCurrentPanel,
        dataInput: dataInput,
        getCurrentPanel: getCurrentPanel,
        setEpoch: setEpoch,
        setState: setState,
        getConvergenceTrace: getConvergenceTrace,
        restoreConvergenceToScie: restoreConvergenceToScie
    };
})();
