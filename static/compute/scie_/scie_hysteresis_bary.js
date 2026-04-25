// File: scie_hysteresis_bary.js — Jauge bary pour l'hystérésis : co-évolution des masses gazeuses
// Desc: Lit les bornes '🔒' de configTimeline.js et convertit bary [0,1] ↔ masse pour chaque gaz.
//       Fournit createBaryAdapter(epochId) compatible avec HYSTERESIS.adapter (scie_hysteresis_search.js).
//       Chaque pas scan écrit la masse primaire (CO₂) + co-évolue les masses secondaires (CH₄, N₂, O₂, H₂O, sulfates).
// Version 1.0.1
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: April 25, 2026
// Logs:
// - v1.0.1: createBaryAdapter(epochId, clampFn, { co2MaxFactor }) — scale uniquement le max CO₂ (TIMELINE 🔒
//   inchangé) : onglet hyst R&D hysteresis 1a, pas d’édit configTimeline.
// - v1.0.0: Step 3 — architecture jauge bary hystérésis. Lit '🔒' per-epoch (configTimeline v1.4.23).
//           Sémantique : bary=0 → refroidissement max (cools direction), bary=1 → réchauffement max.
//           Clé primaire : '⚖️🏭' (CO₂). Clés secondaires co-évoluées : '⚖️🐄' CH₄, '⚖️💨' N₂,
//           '⚖️🫁' O₂, '⚖️💧' H₂O-hydrosphère, '⚖️✈' sulfates.
//           Adapter compatible HYSTERESIS.adapter : isBaryAdapter=true → scie_hysteresis_search v2.1.15
//           skip couplage CCN-CO₂ (sulfates gérés par la co-évolution bary).
//           Fallback : si l'époque n'a pas de '🔒', HYSTERESIS.adapter reste defaultCo2Adapter.
//           ⚠️ N₂ ('⚖️💨') : écrit en TIMELINE, effectif si isFinite(EPOCH['⚖️💨']). Total '⚖️🫧' fixé
//           par EPOCH → légère incohérence pression acceptée (cohérente avec comportement CCN coupling).

(function () {
    'use strict';

    // ─── Clé primaire & clés secondaires ───────────────────────────────────────
    var PRIMARY_KEY = '⚖️🏭'; // CO₂ — variable de scan de l'hystérésis
    var SECONDARY_KEYS = ['⚖️🐄', '⚖️💨', '⚖️🫁', '⚖️💧', '⚖️✈'];
    // Note '⚖️💨' (N₂) : lu directement depuis EPOCH si isFinite(EPOCH['⚖️💨']),
    //      sinon calculé comme résidu par getMasses(). Co-évolution bary active dans les deux cas.

    // ─── Accès TIMELINE ────────────────────────────────────────────────────────

    function timelineIndex(epochId) {
        if (!window.TIMELINE) return -1;
        return window.TIMELINE.findIndex(function (r) { return r['📅'] === epochId; });
    }

    function epochEntry(epochId) {
        var idx = timelineIndex(epochId);
        return idx >= 0 ? window.TIMELINE[idx] : null;
    }

    // ─── Bornes '🔒' ───────────────────────────────────────────────────────────

    /**
     * Retourne true si l'époque possède un bloc '🔒' avec au moins la clé primaire.
     * @param {string} epochId
     */
    function hasBounds(epochId) {
        var entry = epochEntry(epochId);
        return !!(entry && entry['🔒'] && entry['🔒'][PRIMARY_KEY]);
    }

    /**
     * Retourne les bornes { min, max, cools } pour une clé de masse dans une époque.
     * Retourne null si absent.
     * @param {string} epochId
     * @param {string} massKey
     * @returns {{ min: number, max: number, cools: string }|null}
     */
    function getBounds(epochId, massKey) {
        var entry = epochEntry(epochId);
        if (!entry || !entry['🔒']) return null;
        var b = entry['🔒'][massKey];
        return (b && Number.isFinite(b.min) && Number.isFinite(b.max)) ? b : null;
    }

    // ─── Conversion bary ↔ masse ───────────────────────────────────────────────

    /**
     * Convertit bary [0,1] → masse (kg) pour des bornes données.
     * cools='min' (GES) : bary=0 → min (froid), bary=1 → max (chaud).
     * cools='max' (sulfates) : bary=0 → max (froid), bary=1 → min (chaud).
     * @param {number} bary01
     * @param {{ min: number, max: number, cools: string }} bounds
     * @returns {number}
     */
    function baryToMass(bary01, bounds) {
        var b = Math.max(0, Math.min(1, bary01));
        if (bounds.cools === 'max') {
            // Refroidit si max → bary=0 donne max (froid), bary=1 donne min (chaud)
            return bounds.max - b * (bounds.max - bounds.min);
        }
        // Refroidit si min → bary=0 donne min (froid), bary=1 donne max (chaud)
        return bounds.min + b * (bounds.max - bounds.min);
    }

    /**
     * Convertit masse (kg) → bary [0,1] pour des bornes données.
     * @param {number} mass
     * @param {{ min: number, max: number, cools: string }} bounds
     * @returns {number}
     */
    function massToBary(mass, bounds) {
        if (bounds.max === bounds.min) return 0.5;
        var raw;
        if (bounds.cools === 'max') {
            raw = (bounds.max - mass) / (bounds.max - bounds.min);
        } else {
            raw = (mass - bounds.min) / (bounds.max - bounds.min);
        }
        return Math.max(0, Math.min(1, raw));
    }

    // ─── Co-évolution des masses secondaires ───────────────────────────────────

    /**
     * Écrit toutes les masses secondaires (hors primaryKey) dans TIMELINE[epochId]
     * en fonction d'un bary [0,1]. Ignore les clés sans bornes '🔒'.
     * N'appelle PAS getMasses() — l'appelant doit le faire après.
     * @param {string} epochId
     * @param {number} bary01
     * @param {string} primaryKey  Clé à exclure (déjà traitée par l'adapter)
     */
    function writeSecondaryMasses(epochId, bary01, primaryKey) {
        var idx = timelineIndex(epochId);
        if (idx < 0) return;
        var entry = window.TIMELINE[idx];
        if (!entry || !entry['🔒']) return;
        for (var i = 0; i < SECONDARY_KEYS.length; i++) {
            var key = SECONDARY_KEYS[i];
            if (key === primaryKey) continue;
            var b = entry['🔒'][key];
            if (!b || !Number.isFinite(b.min) || !Number.isFinite(b.max)) continue;
            window.TIMELINE[idx][key] = baryToMass(bary01, b);
        }
    }

    // ─── Adapter ───────────────────────────────────────────────────────────────

    /**
     * Crée un adapter bary compatible avec HYSTERESIS.adapter (scie_hysteresis_search.js).
     * La variable x est la masse CO₂ (kg), comme defaultCo2Adapter.
     * writeXToTimeline co-évolue toutes les masses secondaires via le bary déduit de CO₂.
     * isBaryAdapter: true → scie_hysteresis_search v2.1.15 skip le couplage CCN-CO₂ natif.
     *
     * @param {string} epochId
     * @param {function} [clampFn]  — clamp(x)→x optionnel (ex. clampX de search.js)
     * @param {{ co2MaxFactor?: number }} [opts]  — R&D hyst : multiplie seulement max(⚖️🏭) pour le bary (TIMELINE['🔒'] source inchangé).
     * @returns {object} adapter
     */
    function createBaryAdapter(epochId, clampFn, opts) {
        opts = opts || {};
        var co2MaxFactor = (Number.isFinite(Number(opts.co2MaxFactor)) && Number(opts.co2MaxFactor) > 0) ? Number(opts.co2MaxFactor) : 1;
        var clamp = (typeof clampFn === 'function') ? clampFn : function (x) { return x; };

        function idxEp() { return timelineIndex(epochId); }

        function effectiveCo2Bounds(idx) {
            var raw = (idx >= 0 && window.TIMELINE && window.TIMELINE[idx] && window.TIMELINE[idx]['🔒'])
                ? window.TIMELINE[idx]['🔒'][PRIMARY_KEY]
                : null;
            if (!raw || !Number.isFinite(raw.min) || !Number.isFinite(raw.max)) {
                return null;
            }
            if (co2MaxFactor === 1) {
                return raw;
            }
            return { min: raw.min, max: raw.max * co2MaxFactor, cools: raw.cools };
        }

        return {
            id: PRIMARY_KEY,
            epochId: epochId,
            isBaryAdapter: true, // ← flag pour scie_hysteresis_search v2.1.15
            co2MaxFactor: co2MaxFactor,

            /** Lit CO₂ kg depuis TIMELINE (comme defaultCo2Adapter). */
            readXFromTimeline: function () {
                var idx = idxEp();
                return idx >= 0 ? Number(window.TIMELINE[idx][PRIMARY_KEY]) : NaN;
            },

            /**
             * Écrit CO₂ kg en TIMELINE, déduit le bary [0,1] depuis les bornes CO₂,
             * co-évolue toutes les masses secondaires, puis appelle getMasses().
             */
            writeXToTimeline: function (x) {
                var xClamped = clamp(x);
                var idx = idxEp();
                if (idx < 0) return;
                // 1. Écrire la masse primaire (CO₂)
                window.TIMELINE[idx][PRIMARY_KEY] = xClamped;
                // 2. Déduire le bary depuis les bornes CO₂ (option co2MaxFactor = max × facteur, hors TIMELINE)
                var co2Bounds = effectiveCo2Bounds(idx);
                if (co2Bounds && Number.isFinite(co2Bounds.min) && Number.isFinite(co2Bounds.max)) {
                    var bary01 = massToBary(xClamped, co2Bounds);
                    // 3. Co-évoluer les masses secondaires
                    writeSecondaryMasses(epochId, bary01, PRIMARY_KEY);
                }
                // 4. Propager vers DATA
                if (window.COMPUTE && typeof window.COMPUTE.getMasses === 'function') {
                    window.COMPUTE.getMasses();
                }
            },

            /** Lit CO₂ kg depuis DATA (comme defaultCo2Adapter). */
            readXFromData: function () {
                var D = window.DATA;
                return Number(D && D['⚖️'] && D['⚖️'][PRIMARY_KEY]);
            },

            /**
             * Lit le bary courant depuis les bornes CO₂ et la masse CO₂ en DATA.
             * Utile pour debug / affichage UI.
             */
            readBaryFromData: function () {
                var mass = this.readXFromData();
                var idx = idxEp();
                if (idx < 0) return 0.5;
                var b = effectiveCo2Bounds(idx);
                if (!b) return 0.5;
                return massToBary(mass, b);
            }
        };
    }

    // ─── Export ────────────────────────────────────────────────────────────────

    window.HYSTERESIS_BARY = {
        hasBounds: hasBounds,
        getBounds: getBounds,
        baryToMass: baryToMass,
        massToBary: massToBary,
        writeSecondaryMasses: writeSecondaryMasses,
        createBaryAdapter: createBaryAdapter
    };

})();
