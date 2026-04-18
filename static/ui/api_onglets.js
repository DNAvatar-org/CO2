// File: api_onglets.js - API onglets index.html (visu / scie / milankovitch + futurs)
// Desc: Registre synchrone d'onglets. Chaque onglet = { id, buttonId, panelId, onShow?, onHide? }.
//       showTab(id) : applique .active sur bouton+panel cibles, retire des autres, appelle onHide(prev) puis onShow(next).
//       Synchrone : ordre = registerTab → showTab (pas de setTimeout, listeners attachés via onShow).
//       Source unique : pas de duplication de state interne, on ne stocke que l'id courant + le registre.
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [April 18, 2026] [18:45 UTC+1]
// Logs:
// - v1.0.0: extraction de loader_panels.switchTab → API_ONGLETS.{registerTab, showTab, getCurrentTab} ; loader_panels.switchTab devient proxy

(function () {
    'use strict';

    var TABS = {};
    var ORDER = [];
    var current = null;

    function registerTab(spec) {
        // Crash-first : chaque champ obligatoire doit être là.
        var id = spec.id;
        TABS[id] = {
            id: id,
            buttonId: spec.buttonId,
            panelId: spec.panelId,
            onShow: spec.onShow || null,
            onHide: spec.onHide || null
        };
        if (ORDER.indexOf(id) < 0) ORDER.push(id);
    }

    function showTab(id) {
        var next = TABS[id];
        // Crash-first : tab non enregistré = appel illégal, on laisse échouer à l'accès plus bas.
        var prev = current ? TABS[current] : null;

        // .active OFF partout (aligné switchTab actuel : querySelectorAll sur .tab-panel + .tabs-bar button)
        document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
        document.querySelectorAll('.tabs-bar button').forEach(function (b) { b.classList.remove('active'); });

        // onHide du précédent (si différent du nouveau)
        if (prev && prev.id !== next.id && prev.onHide) prev.onHide(prev, next);

        // .active ON sur la cible
        var panel = document.getElementById(next.panelId);
        var btn = document.getElementById(next.buttonId);
        if (panel) panel.classList.add('active');
        if (btn) btn.classList.add('active');

        current = next.id;

        // onShow du nouveau
        if (next.onShow) next.onShow(next, prev);
    }

    function getCurrentTab() { return current; }

    function listTabs() { return ORDER.slice(0); }

    window.API_ONGLETS = {
        registerTab: registerTab,
        showTab: showTab,
        getCurrentTab: getCurrentTab,
        listTabs: listTabs
    };
})();
