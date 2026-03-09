// File: shell.js - Dispatch des sorties calcul vers le panel actif (visu ou scie)
// Desc: Couche de routage unique entre moteur de calcul et affichage.
//       - Entrée calcul → shell : tout (convergenceStep, compute:done, etc.) passe par dataInput(payload)
//         et est envoyé au panel actif (visu ou scie) via current.dataInput ; buffer convergence pour restauration scie à l'ouverture onglet.
//       - Entrée utilisateur → shell : setEpoch, runCompute, applyStateFromScie, applyTuningFromScie sont le point d'entrée des boutons
//         et délèguent à sync_panels (setEpoch, runComputeInParent, etc.).
//       En standalone (visu_ ou scie_ sans index), current = cette page.
// Version 1.0.6
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: 2025-02-25
// Logs:
// - v1.0.6: convergence:clear et convergence:append toujours envoyés à scie (cycles à jour même quand current=visu)
// - v1.0.5: logs [shell] setCurrentPanel, dataInput (convergenceStep/clear/compute:done), restoreConvergenceToScie, switchTab(visu/scie) pour tracer A/R
// - v1.0.4: compute:done toujours envoyé à l'iframe scie pour mise à jour convergence sans aller-retour onglet
// - v1.0.3: buffer convergence = HTML (buildStepHtmlForConvergence), restore stepsHtml ; dépend de scie_convergence.js
// - v1.0.2: buffer convergence (steps) pour restauration scie au switch ; getConvergenceTrace, restoreConvergenceToScie
// - v1.0.1: setEpoch, runCompute, applyStateFromScie, applyTuningFromScie ; tous les boutons passent par le shell
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

    /** Actions boutons : point d'entrée unique. syncToScie/setEpoch/runComputeInParent sont dans sync_panels. */
    function setEpoch(epochId) {
        if (window.setEpoch) window.setEpoch(epochId);
        if (window.syncToScie) window.syncToScie({ epochId: epochId });
    }
    function setState(payload) {
        if (payload.epochId !== undefined && window.setEpoch) window.setEpoch(payload.epochId);
        if (window.SYNC_STATE) {
            if (payload.epochId !== undefined) window.SYNC_STATE.epochId = payload.epochId;
            if (payload.animEnabled !== undefined) window.SYNC_STATE.animEnabled = payload.animEnabled;
            if (payload.ticTime !== undefined) window.SYNC_STATE.ticTime = payload.ticTime;
        }
        if (window.syncToScie) window.syncToScie(payload);
    }
    function runCompute() {
        if (window.runComputeInParent) window.runComputeInParent();
    }
    /** État envoyé depuis scie (postMessage sync:state) → appliquer au parent et lancer le calcul. */
    function applyStateFromScie(payload) {
        if (window.applyStateFromScie) window.applyStateFromScie(payload);
    }
    /** Tuning envoyé depuis scie (postMessage sync:tuning) → appliquer et optionnellement lancer le calcul. */
    function applyTuningFromScie(payload) {
        if (window.applyTuningFromScie) window.applyTuningFromScie(payload);
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
            if (current && current.dataInput) current.dataInput(payload);
            if (scieWin) {
                try { scieWin.postMessage({ type: 'convergence:append', step: payload.data }, '*'); } catch (e) {}
            }
            return;
        }
        if (payload.type === 'clearConvergenceTrace') {
            convergenceSteps = [];
            LOG('dataInput clearConvergenceTrace buffer=0 -> current=' + cur + ' + postMessage(scie clear)');
            if (current && current.dataInput) current.dataInput(payload);
            if (scieWin) {
                try { scieWin.postMessage({ type: 'convergence:clear' }, '*'); } catch (e) {}
            }
            return;
        }
        if (payload.type === 'compute:done') {
            LOG('dataInput compute:done -> current=' + cur + ' + postMessage(scie)');
            if (current && current.dataInput) current.dataInput(payload);
            if (scieWin && payload.DATA) {
                try { scieWin.postMessage({ type: 'compute:done', DATA: payload.DATA }, '*'); } catch (e) {}
            }
            return;
        }
        if (payload.type === 'displayConvergence' || payload.type === 'convergenceStep') {
            if (current && current.dataInput) current.dataInput(payload);
            return;
        }
        if (current && current.dataInput) current.dataInput(payload);
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
        runCompute: runCompute,
        applyStateFromScie: applyStateFromScie,
        applyTuningFromScie: applyTuningFromScie,
        getConvergenceTrace: getConvergenceTrace,
        restoreConvergenceToScie: restoreConvergenceToScie
    };
})();
