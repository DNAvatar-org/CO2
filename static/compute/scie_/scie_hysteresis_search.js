// File: scie_hysteresis_search.js - Recherche seuil CO₂ hystérésis scie_
// Desc: En français, dans l'architecture, je suis window.HYSTERESIS — négatif : scan CO₂×factor chute T failed <½·x₀ ; positif : ÷factor saut T chaud failed >2·x₀ ; dicho 0,5 [min,max]
// Version 2.2.20
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// PHYSIQUE DU CYCLE SNOWBALL — référence pour hystérésis 1 (entrée Sturtien) et suite (sortie, R&D).
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// DRAWDOWN pré-snowball (/10 en CO₂, ~5 Myr) — moteur de l'entrée Sturtien :
// ─────────────────────────────────────────────────────────────────────────────
//   • Fragmentation de Rodinia (~800-720 Ma) → surface silicate fraîche exposée × 2-3 en zone tropicale humide.
//   • Franklin LIP à 717 Ma → ~2e6 km³ basalte frais au tropique (cible altération, T haute + pluie).
//   • Cycle d'Urey accéléré : CaSiO₃ + 2CO₂ + H₂O → Ca²⁺ + 2HCO₃⁻ + SiO₂, puis précipitation carbonate marin.
//   • ΔF CO₂ = 5.35 × ln(1/10) = -12.3 W/m² → ΔT ≈ -10 K avec sensibilité 0.8 K/(W/m²). Suffit à déclencher le runaway glace-albédo.
//   • Taux drawdown estimé ~1 ppm/kyr sur 1-10 Myr (compatible paléomag 740→717 Ma).
//   Réfs : Hoffman & Schrag 2002 ; Mills et al. 2011 ; Goddéris et al. 2017 ; Hoffman 2017 Sci Adv 3:e1600983.
//
// BUILDUP pendant snowball (×100-1000 en CO₂, 10-57 Myr) — moteur de la sortie (hysteresis 1b) :
// ─────────────────────────────────────────────────────────────────────────────────────────────
//   • SHUTDOWN complet de l'altération silicate pendant snowball (pas d'eau liquide, pas de CO₂ sink) → asymétrie clé.
//   • Outgassing volcanique continu ~6e12 mol CO₂/an (Protérozoïque ≈ moderne, Catling & Kasting 2017).
//     Sur 10 Myr : 6e19 mol = 2.6e18 kg CO₂ = +340 000 ppm théoriques ajoutés à l'atmosphère !
//   • Poussière aérosols volcaniques + érosion éolienne → α snowball 0.62 → 0.45-0.50 après 5-20 Myr.
//     Gagne ~40 W/m² sans toucher au CO₂ (Abbot & Pierrehumbert 2010).
//   • CH₄ (océan anoxique sous glace, méthanogenèse forte) monte à 100-1000 ppm → +5-15 W/m² gratis.
//   • Bilan albédo : terre moderne α=0.30 absorbe 240 W/m² ; snowball hard α=0.62 absorbe 122 W/m² → déficit 118 W/m².
//   • Seuil déglaciation GCM avec aides ci-dessus : 10 000-100 000 ppm (Pierrehumbert 2004 ; Abbot 2010 ; Hoffman 2017).
//   Réfs : Pierrehumbert 2004 Nature 429:646 ; Abbot & Pierrehumbert 2010 JGR 115:D03103 ;
//          Le Hir et al. 2010 EPSL 297:349 ; Catling & Kasting 2017 "Atmospheric Evolution on Inhabited Worlds".
//
// SEUILS DE BIFURCATION — où l'algo hystérésis scan doit trouver le point de bascule :
// ────────────────────────────────────────────────────────────────────────────────────
//   • Entrée Sturtien (S/S₀=0.94, hysteresis 1a) : seuil 100-300 ppm GCM moderne.
//     Réfs : Voigt & Marotzke 2010 J. Clim. 23:4305 ; Voigt & Abbot 2012 Clim. Past 8:2079 ;
//            Yang, Peltier & Hu 2012 J. Clim. 25:2711 ; Hörner et al. 2022 Clim. Past 18:2437.
//     Pour Budyko-Sellers 0D (notre modèle) : fourchette plus large 100-800 ppm selon tunings
//     (seaIceTransitionRangeK, polarAmplificationK, CCN, etc.). C'est ce qu'on cherche à caler.
//   • Sortie Marinoen (hysteresis 1b, ~635 Ma) : seuil déglaciation 0.01-0.12 bar (~10k-120k ppm).
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: April 25, 2026
// Logs:
// - v2.2.20: writeAndContinue — en dicho+scan négatif, si CO₂↑ (bary, retour côté chaud), reposer T sur EPOCH[🌡️🧮] (~10 °C
//   1a) pour ne pas laisser Picard sur l’attracteur froid (−60 °C) quand on remonte le CO₂.
// - v2.2.19: après convergence — [REPRO] (HYST_REPRO_LOG) si logReproComparableState ; logEpochCompareBlock accepte wantRepro seul (sans logEpochCompareToFile)
// - v2.2.18: hysteresis 1a — marge CO₂ R&D (×1.1) dans cet onglet seulement : x0 + createBaryAdapter(..., { co2MaxFactor: 1.1 }) ;
//   configTimeline (TIMELINE) reste 8.594e+14 (pas de v1.4.57 dans le fichier).
// - v2.2.17: ligne T_conv — afficher graine initiale seulement si 📿🧮=1 ; jamais de rappel graine / « T propagée »
//   sur les pas suivants (journaling minimal ; la T d’entrée est celle sortie du pas précédent).
// - v2.2.16: T_conv: graine seulement si 📿🧮=1 ; sinon texte T propagé (trop long → v2.2.17 resserre)
// - v2.2.15: appendLog + logEpochCompareBlock — miroir fichier si CONFIG_COMPUTE.logHystPanelToFile|logEpochCompareToFile (applyFileTopicFromConfig avant DEBUG.log)
// - v2.2.14: logEpochCompareBlock + _buildHystPerStepDiagnosticLines — mêmes lignes 🔬[diag] que hyst ; avec ?debug=epoch → _logs/epoch.txt
//   (calcul seul, pas hyst) pour diff hors-ligne vs ?debug=hyst → _logs/hyst.txt. Appel iframe compute:done si !HYSTERESIS.active.
// - v2.2.13: _appendHystPerStepDiagnostic — ligne 🔬[diag bilan] : Δ, entrée (Sabs+🌕), OLR, phase 🧮⚧, id ép. + EDS CH₄/CO₂ si 📛
// - v2.2.12: appendLog → `DEBUG.log` si `?debug=hyst` (logs_to_server.js) : fichier `_logs/hyst.txt` côté serveur,
//   même contenu que le panneau hyst (aligné `?debug=plot` + plot_debug.js → `_logs/plot.txt`).
// - v2.2.11: afterRadiativeConverged — le journal affiche T_conv (DATA['🧮']['🧮🌡️'] après bilan), pas EPOCH['🌡️🧮'].
//   Ligne : T_conv=… (graine … °C) pour éviter confusion avec la température visée sur Sturtienne/⛄ (autre ligne TIMELINE
//   que l’id hyst `hysteresis 1a`, dont la graine vient de TIMELINE['hysteresis 1a']['🌡️🧮']).
// - v2.2.10: onEpochButton — hysteresis 1b force le run en signe positif (CO₂↑ depuis branche froide vers déglaciation).
//   hysteresis 1a reste négatif (CO₂↓ depuis branche chaude vers Snowball). Le bouton ↑↓ garde le mode manuel pour les autres cas/R&D.
// - v2.2.9: Scan hystérésis élargi. (a) scanCo2MassFactor défaut 0.9 → 0.5 : CO₂ /2 par pas au lieu
//   de -10 % (traversée de 1280 → 128 ppm en ~4 pas au lieu de ~22). (b) Nouveau paramètre
//   `scanFailRatio` (défaut 0.1) : plancher de la plage en fraction de ⚖️🏭₀. FAILED si xNext < 0.1·x0
//   (scan−) ou > 10·x0 (scan+), au lieu du ½·x0 / 2·x0 hardcodé. Motivation : seuil snowball GCM
//   100-300 ppm = 8-24 % de 1280 ppm baseline Sturtien, donc ½·x0 (640 ppm) s'arrêtait trop haut.
//   Mis à jour : initDATA.js HYSTERESIS defaults, logs start-of-run (plus de "½·⚖️🏭₀" hardcodé),
//   failHalf() dynamique. Ajout bloc de commentaires PHYSIQUE DU CYCLE SNOWBALL en tête de fichier
//   (drawdown /10, buildup ×100-1000, seuils bifurcation) avec biblio complète.
// - v2.2.8: Rebrand bouton ☃ — `hyst-epoch-snow` (onclick '⛄', glyph 🪸⛄) → `hyst-epoch-h1a`
//   (onclick 'hysteresis 1a', glyph ☃⛄). L'utilisateur attend qu'un clic sur le bouton "neige"
//   lance la config hysteresis 1a (Sturtienne, T_seed ≈ 18 °C, CO₂ = 1.0e16, highlands 0.08) afin
//   d'observer la bifurcation depuis la branche chaude quand CO₂ ↓. L'ancien `'⛄'` (Plein Snowball,
//   T_seed ≈ −61 °C) ne sert pas pour la R&D hystérésis d'entrée Sturtienne. 4 fichiers touchés :
//   hysteresis_compute.html, scie_compute.html, search_scie.html (bouton + syncHystEpochButtonsFromData),
//   scie_hysteresis_search.js (clearHystEpochButtonsSelected). Le hook HYSTERESIS_REF_EPOCH_ID reste à null.
// - v2.2.7: REVERT du routage forcé ☃ (v2.2.4 + v2.2.6). Malentendu sur "prend ☃ comme ref unique" —
//   c'était une remarque sémantique (l'hystérésis part conceptuellement d'un état chaud pré-snowball),
//   pas un routage de boutons. Chaque bouton (⛄ / 1b / 2) retrouve sa propre config d'époque.
//   HYSTERESIS_REF_EPOCH_ID = null désactive le hook de redirection dans les 3 HTML compute.
//   Le fix FAILED seuils absolus (v2.2.5) est conservé car indépendant du routage.
// - v2.2.6: (reverté par v2.2.7) redirection déplacée vers scieRunEpochLikeVisuTimeline (HTML) pour
//   aligner compute + hyst sur la même row TIMELINE. Reste utile si HYSTERESIS_REF_EPOCH_ID un jour ≠ null.
// - v2.2.5: FAILED "déjà sur branche" — critère basé sur SEUILS ABSOLUS coldBranchT_C / warmBranchT_C,
//   plus sur delta relatif seedT_C ± 20 K. La graine T_seed peut être agressive (ex. ☃ 39°C) mais la
//   convergence Picard peut atterrir modérément (ex. 0°C à 989 ppm) SANS être la branche froide cible :
//   tant que T > coldBranchT_C (−20°C), le scan est légitime et doit continuer (scan CO₂↓ attendu).
//   FAILED ne se déclenche désormais QUE si T_step1 < coldBranchT_C (scan−) ou > warmBranchT_C (scan+),
//   i.e. la branche cible est déjà atteinte au CO₂ baseline → pas de bifurcation à trouver.
//   Bug corrigé : expression `!this.runSearchSign !== 'positive'` (priorité opérateur erronée) →
//   remplacée par `var negativeScan = this.runSearchSign !== 'positive'`.
// - v2.2.4: R&D hystérésis — TOUS les boutons hyst (⛄ / 1b / 2) routés vers la config UNIQUE ☃ = 'hysteresis 1b'
//   (Sortie Marinoen −690 Ma, baseline chaude ~16°C). Rationale utilisateur : la R&D hystérésis doit partir
//   systématiquement d'un état chaud (T_glob ≥ 16 °C) puis observer la bascule branche chaude → branche froide
//   lorsque CO₂ ↓ au pas 2. Les configs ⛄ (cold, T_seed ~ −18°C) et h2 (Eocène) ne servent pas pour cette
//   phase R&D. Pour réactiver le routage par bouton, retirer la ligne `epochId = HYSTERESIS_REF_EPOCH_ID`
//   dans onEpochButton (cf. HYSTERESIS_REF_EPOCH_ID en tête de fichier).
// - v2.2.3: revert v2.2.2 (graine T depuis époque précédente) — mauvais diagnostic. Les divergences config ⛄ vs ☃ (highlands 0.15 vs 0.08, CO₂₀ 0.8e16 vs 1.0e16, 🌱 etc.) sont INTENTIONNELLES et font partie des variables testables pour la bifurcation Snowball. L'hystérésis doit émerger du scan lui-même (via la suppression du verrou glace v1.2.53 + blend dt à chaque pas), pas de conditions initiales alignées. Retour à graine T = EPOCH['🌡️🧮'] de l'époque cliquée.
// - v2.2.2: (reverté par v2.2.3) graine T depuis époque précédente — conceptuellement incorrect pour l'hystérésis.
// - v2.2.1: init unifié AVANT pas 1 — `this.adapter.writeXToTimeline(x0)` appelé INCONDITIONNELLEMENT pour que BaryAdapter co-évolue les masses secondaires (sulfate, O₂, N₂...) dès le premier compute. Le bloc CCN-CO₂ init (legacy defaultCo2Adapter) est gardé sous `!isBaryAdapter`, et pour BaryAdapter on relit sulfate depuis DATA pour rafraîchir `sulfateBaselineKg`. Élimine l'artefact de boot où ⛄ démarrait avec ⚖️✈=0 (config commentée) → faux pas de bifurcation au pas 2.
// - v2.2.0: critère scan/dicho remplacé : plus de relatif (T < T_ref - brutalDeltaT_C) → seuils absolus
//   coldBranchT_C (= DATA['🎚️'].HYSTERESIS.coldBranchHint_C, défaut -5°C) et
//   warmBranchT_C (= warmBranchHint_C, défaut -5°C). brutalDeltaT_C conservé pour log seulement.
//   Scan : continue jusqu'à T < coldBranchT_C (vraie branche froide). Dicho : cold = T < coldBranchT_C.
//   tWarmRef gardé pour log ; ne sert plus de critère.
// - v2.1.15: onEpochButton — si HYSTERESIS_BARY disponible et époque avec bornes '🔒', utilise BaryAdapter
//            (co-évolution CH₄/N₂/O₂/H₂O/sulfates depuis bary déduit de CO₂) au lieu de defaultCo2Adapter.
//            writeAndContinue — skip couplage CCN-CO₂ si adapter.isBaryAdapter (sulfates gérés par bary).
//            Dépend de scie_hysteresis_bary.js (chargé avant ce fichier dans hysteresis_compute.html).
// - v2.1.14: onEpochButton — restauration CO₂ TIMELINE initial entre deux runs. window._hystCo2OrigByEpoch[epochId] mémorise la valeur de config au 1er clic ; les clics suivants restaurent TIMELINE avant readXFromTimeline() → x0 toujours = valeur config initiale (pas la valeur laissée par le run précédent).
// - v2.1.13: afterRadiativeConverged — détection "déjà sur branche froide/chaude au 1er pas" (|T−seedT| > 20 K) → FAILED immédiat avec message d'aide (ajuster CO₂ initial ou amplification polaire).
// - v2.1.12: writeAndContinue — couplage CCN-CO₂ : ⚖️✈ = baseline × (x0/xNew)^ccnSulfateCoupling à chaque pas scan. baseline=DATA['⚖️✈'] au démarrage ou 1e12 kg si époque sans sulfates (ex. ⛄). Paramètre DATA['🎚️'].HYSTERESIS.ccnSulfateCoupling (défaut 0.5). Écrit dans TIMELINE avant writeXToTimeline → getMasses() lit valeur mise à jour. onEpochButton: sulfateBaselineKg initialisé.
// - v2.1.11: onEpochButton — init DATA['🧮']['🧮🌡️'] (+⏮+🚩) depuis EPOCH['🌡️🧮'] à chaque clic bouton hyst. Nécessaire car les 3 boutons hyst forcent 🔘🎞=true (continuité T inter-ticks) ce qui désactive le reset T dans runTest ; sans cet init explicite, le scan démarrait depuis T résiduelle / fallback corps noir (~254 K / -18.5 °C) → branche indéterminée. Chaque epoch hyst pose maintenant sa graine de branche au clic (1a/1b chaude, ⛄ froide, 2 chaude).
// - v2.1.10: clearHystEpochButtonsSelected — retrait hyst-epoch-h1 (UI hyst = 3 boutons seulement : snow, h1b, h2).
// - v2.1.9: clearHystEpochButtonsSelected — retirer .selected sur hyst-epoch-snow (⛄) et hyst-epoch-h1b (hysteresis 1b) en plus de h1 / h2.
// - v2.1.8: lectures HYSTERESIS migrées window.TUNING → window.DATA['🎚️'] (source unique live). Fin de window.TUNING (initDATA.js v1.1.0 : DATA['🎚️'] = clone(DEFAULT.TUNING)).
// - v2.1.7: CONFIG_COMPUTE.logCo2RadiativeDiagnostic → console 🧲📛🏭 + T après chaque pas (onParentComputeDone)
// - v2.1.6: parent (index) charge ce fichier — garde-fous DOM ; sync:hysteresis active↔parent ; EPOCH depuis TIMELINE si onEpochButton avant selectEpoch
// - v2.1.5: sync:state hyst → parent animEnabled true (continuité 🧮🌡️ ; pas reset 📅🌡️🧮 à chaque pas)
// - v2.1.4: rappel logIceFractionDiagnostic au démarrage run hyst
// - v2.1.3: UI mode négatif|positif (libellé français) ; log signe=négatif|positif
// - v2.1.2: logs hyst 1er + dernier pas instantané 💧🪩 après compute:done (scieFormatJSONCompact)
// - v2.1.1: titre 🧲 Hystérésis + span negative|positive ; bouton ↑↓ après Jauges (plus de label ±)
// - v2.1.0: searchSign negative|positive — scan CO₂↓ chute T vs scan CO₂↑ saut T ; failed ½·x₀ | 2·x₀ ; bouton UI ↑↓
// - v2.0.0: remplace init/search/dicho sens par scan×0.9 + dicho 0,5 + failed initial/2 + max 30 dicho
// - v1.6.0: (obsolète) bracket ancien algorithme
// - v1.1.0: iframe compute:done → parent

(function () {
    'use strict';

    var X_ABS_MIN = 1e10;
    // v-2026-07-14 : 5e17 → 1e19. L'ancien plafond (5e17 ≈ 0.08 bar) rabotait le CO₂ du scan POSITIF
    // (déglaciation 1b) : la config 1b (7.0e17) était déjà clampée à 5e17, et le scan CO₂↑ (jusqu'à
    // ~10·x₀ pour trouver le seuil de fonte snowball, ~0.1–0.3 bar) restait bloqué → boucle infinie,
    // FAILED jamais atteint. 1e19 (~1.3 bar) laisse la marge. N'affecte pas le scan négatif (CO₂↓).
    var X_ABS_MAX = 1e19;
    // [CO₂ SCAN-CEIL v-2026-07-16] Plafond du scan CO₂ (kg) piloté par la CONFIG d'époque (⚖️🏭🔝), lu
    // génériquement par clampX — aucun if(epoch==) dans le calcul. Défaut = X_ABS_MAX (aucun plafond
    // spécifique). Posé par onEpochButton depuis la config. Voir configTimeline.js ⚖️🏭🔝 (déglaciation 1b).
    var X_ceilCurrent = X_ABS_MAX;
    /** Garde-fou nombre total d’appels API (scan + dicho) */
    var MAX_OUTER = 200;
    /** Marge haut de plage CO₂ (R&D, onglet hyst) pour hysteresis 1a — TIMELINE / configTimeline inchangés. */
    var HYST_RND_WARM_CO2_FACTOR_1A = 1.1;
    window.HYST_RND_WARM_CO2_FACTOR_1A = HYST_RND_WARM_CO2_FACTOR_1A;

    // v2.2.7 — Routage direct bouton → sa propre config. Clic sur ⛄ → recherche hyst ⛄,
    // clic sur 1b → hyst 1b, clic sur 2 → hyst 2 (comportement historique attendu).
    // Hook gardé en null pour permettre une future redirection opt-in (R&D param sweep).
    var HYSTERESIS_REF_EPOCH_ID = null;
    window.HYSTERESIS_REF_EPOCH_ID = HYSTERESIS_REF_EPOCH_ID;

    function clampX(x) {
        return Math.max(X_ABS_MIN, Math.min(X_ceilCurrent, Math.max(X_ABS_MIN, x)));
    }

    function timelineIndexForEpoch(epochId) {
        return window.TIMELINE.findIndex(function (row) { return row['📅'] === epochId; });
    }

    function hystLogEl() {
        return document.getElementById('hyst-search-log');
    }

    /** Synchronise window.HYSTERESIS.active côté parent (index) sans lancer config:applyThenCompute. */
    function postHysteresisActiveToParent(active) {
        if (window === window.top) return;
        try {
            window.parent.postMessage({ type: 'sync:hysteresis', active: !!active }, '*');
        } catch (e) {}
    }

    function readTcelsius() {
        return Number(window.DATA['🧮']['🧮🌡️']) - window.CONST.KELVIN_TO_CELSIUS;
    }

    function readCo2Ppm() {
        return window.ATM.co2KgToFraction(
            window.DATA['⚖️']['⚖️🏭'],
            window.DATA['⚖️']['⚖️🫧'],
            window.DATA['🫧']['🧪']
        ) * 1e6;
    }

    function deltaKgCo2ForOnePpm() {
        var D = window.DATA;
        var total = Number(D['⚖️']['⚖️🫧']);
        var Mair = Number(D['🫧']['🧪']);
        return (total * window.CONST.M_CO2) / (1e6 * Mair);
    }

    function defaultCo2Adapter(epochId) {
        return {
            id: '⚖️🏭',
            epochId: epochId,
            readXFromTimeline: function () {
                return Number(window.TIMELINE[timelineIndexForEpoch(epochId)]['⚖️🏭']);
            },
            writeXToTimeline: function (x) {
                window.TIMELINE[timelineIndexForEpoch(epochId)]['⚖️🏭'] = clampX(x);
                window.COMPUTE.getMasses();
            },
            readXFromData: function () {
                return Number(window.DATA['⚖️']['⚖️🏭']);
            }
        };
    }

    /** Ancien export ; plus de bracket sens — no-op pour compat. */
    function hysteresisLegacyNoOp() {}

    var HYST = {
        active: false,
        epochId: null,
        /** 'scan' | 'dicho' */
        phase: 'scan',
        x: NaN,
        xOld: NaN,
        xBaselineKg: NaN,
        epsilon: 1,
        epsilonPpm: 1,
        convergencePpmMass: 1,
        brutalDeltaT_C: 3,
        /** Seuil absolu branche froide : scan → dicho quand T < coldBranchT_C (°C). Initialisé depuis DATA['🎚️'].HYSTERESIS.coldBranchHint_C. */
        coldBranchT_C: -5,
        /** Seuil absolu branche chaude (log, référence dicho warm). Initialisé depuis DATA['🎚️'].HYSTERESIS.warmBranchHint_C. */
        warmBranchT_C: -5,
        scanCo2MassFactor: 0.5,
        /** Plage de scan en fraction de ⚖️🏭₀. FAILED si xNext < scanFailRatio·x0 (négatif) ou > (1/scanFailRatio)·x0 (positif). */
        scanFailRatio: 0.1,
        maxDichoSteps: 30,
        /** UI / prochain run : 'negative' (défaut) | 'positive' */
        searchSign: 'negative',
        /** Figé à onEpochButton pour tout le run */
        runSearchSign: 'negative',
        /** Référence T au dernier point scan stable (xScanWarm = masse de ce point) */
        tScanRef: NaN,
        xScanWarm: NaN,
        valueMin: NaN,
        valueMax: NaN,
        tWarmRef: NaN,
        dichoIter: 0,
        seedT_C: NaN,
        tRef_C: NaN,
        lastPpm: NaN,
        outerIndex: 0,
        adapter: null,
        logLines: [],
        _hystLoggedFirstCycle: false,
        _hystLastCycleLines: null,

        resetLog: function () {
            this.logLines = [];
            var logEl = hystLogEl();
            if (logEl) logEl.textContent = '';
        },

        appendLog: function (line) {
            var s = String(line);
            this.logLines.push(s);
            var logEl = hystLogEl();
            if (logEl) logEl.textContent = this.logLines.join('\n');
            var C = window.CONFIG_COMPUTE;
            var hystFile = C && C.logHystPanelToFile === true;
            var hystUrl = window.DEBUG && window.DEBUG.topic === 'hyst';
            if ((hystFile || hystUrl) && window.DEBUG && typeof window.DEBUG.logToTopic === 'function') {
                window.DEBUG.logToTopic('hyst', s);
            }
        },

        _hystFormatCompact: function (obj) {
            if (obj == null) return '(null)';
            var fn = window.scieFormatJSONCompact;
            if (typeof fn === 'function') return fn(obj).replace(/"/g, "'");
            try {
                return JSON.stringify(obj);
            } catch (e) {
                return String(obj);
            }
        },

        _refreshHystWaterAlbedoSnapshots: function (T_C) {
            var D = window.DATA;
            var lines = [];
            lines.push('  [ordre réf. convergence] 🧲 bilan → 🌡️🧮 → cycle 💧 → cycle 🪩');
            if (D && D['💧']) {
                lines.push('  💧 @' + T_C.toFixed(1) + '°C : ' + this._hystFormatCompact(D['💧']));
            } else {
                lines.push('  💧 : (absent)');
            }
            if (D && D['🪩']) {
                lines.push('  🪩 @' + T_C.toFixed(1) + '°C : ' + this._hystFormatCompact(D['🪩']));
            } else {
                lines.push('  🪩 : (absent)');
            }
            this._hystLastCycleLines = lines;
            switch (true) {
                case this.outerIndex !== 1:
                case this._hystLoggedFirstCycle:
                    return;
                default:
            }
            this._hystLoggedFirstCycle = true;
            this.appendLog('━━ 1er pas — instantané DATA après compute:done (💧 puis 🪩) ━━');
            for (var i = 0; i < lines.length; i++) {
                this.appendLog(lines[i]);
            }
        },

        _appendHystLastCycleSnapshot: function () {
            if (!this._hystLastCycleLines || !this._hystLastCycleLines.length) return;
            this.appendLog('━━ Dernier pas — instantané 💧 + 🪩 (📿🧮=' + this.outerIndex + ') ━━');
            for (var j = 0; j < this._hystLastCycleLines.length; j++) {
                this.appendLog(this._hystLastCycleLines[j]);
            }
        },

        /**
         * Mêmes chaînes que _appendHystPerStepDiagnostic (ordre figé pour diff hyst.txt vs epoch.txt).
         * @returns {string[]}
         */
        _buildHystPerStepDiagnosticLines: function (T_C, xKg, ppm) {
            var D = window.DATA || {};
            var HD = window._hystDiag || {};
            var clouds = D['🪩'] || {};
            var water = D['💧'] || {};
            var masses = D['⚖️'] || {};
            var fx = function (v, n) {
                return (typeof v === 'number' && isFinite(v)) ? v.toFixed(n == null ? 3 : n) : 'NaN';
            };
            var fexp = function (v, n) {
                return (typeof v === 'number' && isFinite(v)) ? v.toExponential(n == null ? 3 : n) : 'NaN';
            };
            var out = [];
            out.push('  🔬[diag CO₂] ppm=' + fx(ppm, 1)
                + ' ⚖️🏭=' + fexp(xKg)
                + ' ⚖️✈=' + fexp(masses['⚖️✈'])
                + ' ⚖️💧vap=' + fexp(water['🍰🫧💧'])
                + ' RH=' + fx(water['🍰🫧☔']));
            out.push('  🔬[diag CCN] ccn_ratio=' + fx(HD.ccnRatio)
                + ' so4_boost=' + fx(HD.sulfateBoost)
                + ' anthro=' + fx(HD.anthroFactor)
                + ' press=' + fx(HD.pressureFactor)
                + ' temp_f=' + fx(HD.tempFactor)
                + ' f_liq=' + fx(HD.fLiq)
                + ' opt_eff=' + fx(HD.cloudOptEff)
                + ' cloud_idx=' + fx(HD.cloudIndex)
                + ' cloud_frac=' + fx(HD.cloudFraction));
            out.push('  🔬[diag ☀️] T_pol=' + fx(HD.T_polar_C, 2) + '°C'
                + ' ice_eff=' + fx(HD.iceAlbedoEff)
                + ' ice_snow=' + fx(HD.iceAlbedoSnowDeep)
                + ' ice_cold=' + fx(HD.iceAlbedoCold)
                + ' melt01=' + fx(HD.iceAlbedoMeltProgress01)
                + ' ice_surf=' + fx(clouds['🍰🪩🧊'])
                + ' α_base=' + fx(HD.weightedAlbedoBase)
                + ' α_final=' + fx(HD.finalAlbedo)
                + ' α_eff=' + fx(HD.aEff));
            var b = D['🧲'] || {};
            var dFlux = b['🔺🧲'];
            var sAbs = b['🧲☀️🔽'];
            var g = b['🧲🌕🔽'];
            var olr = b['🧲🌈🔼'];
            var phase = (D['🧮'] && D['🧮']['🧮⚧'] != null) ? String(D['🧮']['🧮⚧']) : '—';
            var epId = (D['📜'] && D['📜']['🗿'] != null) ? String(D['📜']['🗿']) : '—';
            var edsTot = (D['📛'] && D['📛']['🧲📛'] != null) ? fx(D['📛']['🧲📛'], 2) : '—';
            var edsCo2 = (D['📛'] && D['📛']['🧲📛🏭'] != null) ? fx(D['📛']['🧲📛🏭'], 2) : '—';
            var edsH2o = (D['📛'] && D['📛']['🧲📛💧'] != null) ? fx(D['📛']['🧲📛💧'], 2) : '—';
            var edsCh4 = (D['📛'] && D['📛']['🧲📛🐄'] != null) ? fx(D['📛']['🧲📛🐄'], 2) : '—';
            var pc = function (k) { return (D['📛'] && D['📛'][k] != null && isFinite(D['📛'][k])) ? (D['📛'][k] * 100).toFixed(1) : '—'; };
            var pctCo2 = pc('🍰📛🏭'), pctH2o = pc('🍰📛💧'), pctCh4 = pc('🍰📛🐄');
            var edsCia = (D['📛'] && D['📛']['🧲📛🌫️'] != null) ? fx(D['📛']['🧲📛🌫️'], 2) : '—';
            var ratCia = (D['📛'] && D['📛']['🍰📛🌫️'] != null && isFinite(D['📛']['🍰📛🌫️'])) ? (D['📛']['🍰📛🌫️'] * 100).toFixed(0) : '—';
            out.push('  🔬[diag bilan] ep=' + epId
                + ' |🧮⚧=' + phase
                + ' | Δ=' + (typeof dFlux === 'number' && isFinite(dFlux) ? dFlux.toFixed(2) : '—') + ' W/m²'
                + ' | entr=' + (typeof sAbs === 'number' && isFinite(sAbs) && typeof g === 'number' && isFinite(g) ? (sAbs + g).toFixed(1) : '—')
                + ' (Sabs=' + (typeof sAbs === 'number' && isFinite(sAbs) ? sAbs.toFixed(1) : '—') + ' +🌕=' + (typeof g === 'number' && isFinite(g) ? g.toFixed(1) : '—') + ')'
                + ' | OLR=' + (typeof olr === 'number' && isFinite(olr) ? olr.toFixed(1) : '—')
                + ' | EDS=' + edsTot + ' W/m² [CO₂ ' + edsCo2 + ' (' + pctCo2 + '%) · H₂O ' + edsH2o + ' (' + pctH2o + '%) · CH₄ ' + edsCh4 + ' (' + pctCh4 + '%)]'
                + ' | 🌫️CIA=' + edsCia + ' W/m² (' + ratCia + '% des raies CO₂)');
            return out;
        },

        /**
         * Diagnostic par-pas : dump des suspects de rétroaction (nuages / CCN / sulfates / H2O / glace).
         * Objectif : identifier quel terme fournit le warming positif malgré CO₂↓ pendant pas 2→N.
         */
        _appendHystPerStepDiagnostic: function (T_C, xKg, ppm) {
            var lines = this._buildHystPerStepDiagnosticLines(T_C, xKg, ppm);
            for (var i = 0; i < lines.length; i++) {
                this.appendLog(lines[i]);
            }
        },

        /**
         * Fichier _logs/epoch.txt si ?debug=epoch (même schéma 🔬 que hyst) — calcul seul, HYSTERESIS inactive.
         * @param {string} [tag] contexte (ex. iframe compute:done)
         */
        logEpochCompareBlock: function (tag) {
            if (this.active) {
                return;
            }
            var C = window.CONFIG_COMPUTE;
            var epochFile = C && C.logEpochCompareToFile === true;
            var epochUrl = window.DEBUG && window.DEBUG.topic === 'epoch';
            var wantRepro = C && C.logReproComparableState === true;
            if (!epochFile && !epochUrl && !wantRepro) {
                return;
            }
            if (!window.DEBUG || typeof window.DEBUG.logToTopic !== 'function') {
                return;
            }
            var L = window.DEBUG.logToTopic;
            if (epochFile || epochUrl) {
                var n = (window._radCompareEpochIndex = (window._radCompareEpochIndex || 0) + 1);
                var T = readTcelsius();
                var xKg = Number(window.DATA['⚖️'] && window.DATA['⚖️']['⚖️🏭']);
                var ppm = readCo2Ppm();
                var epId = (window.DATA['📜'] && window.DATA['📜']['🗿'] != null) ? String(window.DATA['📜']['🗿']) : '—';
                var st = (window.DATA['🧮'] && window.DATA['🧮']['🧮🛑'] != null) ? String(window.DATA['🧮']['🧮🛑']) : '—';
                var it = (window.DATA['🧮'] && window.DATA['🧮']['🧮🔄☀️'] != null) ? String(window.DATA['🧮']['🧮🔄☀️']) : '—';
                L('epoch', '');
                L('epoch', '── 📿🧮=' + n + '  (fichier epoch)  ep=' + epId
                    + '  ⚖️🏭=' + (isFinite(xKg) ? xKg.toExponential(3) : 'NaN') + ' kg'
                    + ' → T_conv=' + T.toFixed(2) + ' °C | 🧮🛑=' + st + ' | innerIter=' + it
                    + ' | ' + (tag != null && tag !== '' ? String(tag) : 'compute:done') + ' ──');
                var lines = this._buildHystPerStepDiagnosticLines(T, isFinite(xKg) ? xKg : NaN, ppm);
                for (var j = 0; j < lines.length; j++) {
                    L('epoch', lines[j]);
                }
            }
            if (window.HYST_REPRO_LOG && typeof window.HYST_REPRO_LOG.emitToEpochFile === 'function') {
                window.HYST_REPRO_LOG.emitToEpochFile(L);
            }
        },

        clearHystEpochButtonsSelected: function () {
            document.getElementById('hyst-epoch-h1a').classList.remove('selected');
            document.getElementById('hyst-epoch-h1b').classList.remove('selected');
            document.getElementById('hyst-epoch-h2').classList.remove('selected');
        },

        syncSearchSignButtonUI: function () {
            var btn = document.getElementById('hyst-search-sign-btn');
            var modeEl = document.getElementById('hyst-sign-mode');
            var neg = this.searchSign === 'negative';
            var Ht = window.DATA && window.DATA['🎚️'] && window.DATA['🎚️'].HYSTERESIS;
            var facRaw = Ht && Number(Ht.scanCo2MassFactor);
            var fac = (Number.isFinite(facRaw) && facRaw > 0 && facRaw < 1) ? facRaw : 0.5;
            if (btn) {
                btn.title = neg
                    ? 'Mode négatif (défaut) : CO₂ ↓ ×' + fac + ', chute T — cliquer pour mode positif'
                    : 'Mode positif : CO₂ ↑ ÷' + fac + ', saut T chaud — cliquer pour mode négatif';
            }
            if (modeEl) {
                modeEl.textContent = neg ? 'négatif' : 'positif';
                modeEl.title = neg ? 'Recherche refroidissement brutal (CO₂↓)' : 'Recherche réchauffement brutal (CO₂↑)';
            }
        },

        toggleSearchSign: function () {
            this.searchSign = this.searchSign === 'negative' ? 'positive' : 'negative';
            this.syncSearchSignButtonUI();
        },

        deactivate: function () {
            this.active = false;
            // v-2026-07-14 : restaurer la graine 🌡️🧮 config (override froid du scan positif) pour ne pas
            // laisser fuiter le froid vers un clic direct / la visu de l'époque après le scan.
            if (window._hystSeedTOrigByEpoch && this.epochId != null
                && window._hystSeedTOrigByEpoch[this.epochId] != null) {
                var idxR = timelineIndexForEpoch(this.epochId);
                if (idxR >= 0 && window.TIMELINE[idxR]) {
                    window.TIMELINE[idxR]['🌡️🧮'] = window._hystSeedTOrigByEpoch[this.epochId];
                }
            }
            postHysteresisActiveToParent(false);
        },

        onEpochButton: function (epochId) {
            // v2.2.6 — redirect déplacé vers scieRunEpochLikeVisuTimeline (HTML) pour aligner compute + hyst
            // sur la MÊME row TIMELINE (sinon split-brain : compute lit TIMELINE[⛄], hyst écrit TIMELINE[h1b]).
            // Ici on lit juste le redirect déjà effectué en amont pour logger le "bouton cliqué → ref".
            var clickedEpochId = (typeof window._hystClickedEpochId === 'string' && window._hystClickedEpochId) ? window._hystClickedEpochId : epochId;
            var idxEp = timelineIndexForEpoch(epochId);
            var EPOCH = (idxEp >= 0 && window.TIMELINE[idxEp]) ? window.TIMELINE[idxEp] : window.DATA['📅'];
            var H = window.DATA['🎚️'].HYSTERESIS;
            this.active = true;
            this.epochId = epochId;
            // v-2026-07-14 : SYNCHRO test↔visu. Par DÉFAUT, scan CO₂ SIMPLE sur les masses racine :
            // defaultCo2Adapter lit ⚖️🏭 depuis la TIMELINE (la config) et ne co-varie RIEN → le test
            // calcule sur EXACTEMENT le même vecteur de masses que la visu (pas de 🔒 dupliqué, pas de
            // co-variation CH₄/O₂/sulfates, pas de marge co2MaxFactor). Le tip trouvé = le tip de la visu.
            // Le BaryAdapter (co-variation via 🔒 + co2MaxFactor) reste dispo pour la R&D uniquement si
            // DATA['🎚️'].HYSTERESIS.useBaryAdapter === true.
            // v2.1.15 (legacy) : BaryAdapter par défaut si bornes '🔒' — désactivé ici.
            if (H.useBaryAdapter === true && window.HYSTERESIS_BARY && window.HYSTERESIS_BARY.hasBounds(epochId)) {
                var baryOpt = (epochId === 'hysteresis 1a')
                    ? { co2MaxFactor: HYST_RND_WARM_CO2_FACTOR_1A }
                    : undefined;
                this.adapter = window.HYSTERESIS_BARY.createBaryAdapter(epochId, clampX, baryOpt);
            } else {
                this.adapter = defaultCo2Adapter(epochId);
            }
            this.phase = 'scan';
            this.epsilon = Number(H.epsilonT_C);
            this.epsilonPpm = Number(H.epsilonPpm);
            this.convergencePpmMass = Number(H.convergencePpmMass);
            this.brutalDeltaT_C = (Number.isFinite(Number(H.brutalDeltaT_C)) && Number(H.brutalDeltaT_C) > 0) ? Number(H.brutalDeltaT_C) : 3;
            this.coldBranchT_C = Number.isFinite(Number(H.coldBranchHint_C)) ? Number(H.coldBranchHint_C) : -5;
            this.warmBranchT_C = Number.isFinite(Number(H.warmBranchHint_C)) ? Number(H.warmBranchHint_C) : -5;
            this.scanCo2MassFactor = (Number.isFinite(Number(H.scanCo2MassFactor)) && Number(H.scanCo2MassFactor) > 0 && Number(H.scanCo2MassFactor) < 1) ? Number(H.scanCo2MassFactor) : 0.5;
            this.scanFailRatio = (Number.isFinite(Number(H.scanFailRatio)) && Number(H.scanFailRatio) > 0 && Number(H.scanFailRatio) < 1) ? Number(H.scanFailRatio) : 0.1;
            this.maxDichoSteps = (Number.isFinite(Number(H.maxDichoSteps)) && Number(H.maxDichoSteps) > 0) ? Math.floor(Number(H.maxDichoSteps)) : 30;
            switch (epochId) {
                case 'hysteresis 1b':
                    this.searchSign = 'positive';
                    break;
                case 'hysteresis 1a':
                    this.searchSign = 'negative';
                    break;
            }
            // [CO₂ SCAN-CEIL v-2026-07-16] Plafond du scan lu depuis la config d'époque (⚖️🏭🔝), pas d'if(epoch==) :
            // c'est le régime imposé par la config (déglaciation 1b = poussière volcanique) qui pose le plafond au
            // minimum d'OLR. Époque sans le champ → X_ABS_MAX (aucun plafond spécifique).
            var _epochRowCeil = window.TIMELINE[timelineIndexForEpoch(epochId)];
            X_ceilCurrent = (_epochRowCeil && Number.isFinite(_epochRowCeil['⚖️🏭🔝'])) ? _epochRowCeil['⚖️🏭🔝'] : X_ABS_MAX;
            this.runSearchSign = this.searchSign === 'positive' ? 'positive' : 'negative';
            this.syncSearchSignButtonUI();
            // ── CO₂ TIMELINE : restauration valeur de config initiale ─────────────────────────────
            // Un run précédent peut avoir laissé une valeur modifiée dans TIMELINE[epochId]['⚖️🏭'].
            // window._hystCo2OrigByEpoch[epochId] est initialisé au 1er clic → restauré aux suivants.
            // Garantit que x0 = CO₂ initial de l'époque (ex. ⛄ → 9.9e15 kg) à chaque nouveau run.
            if (!window._hystCo2OrigByEpoch) window._hystCo2OrigByEpoch = {};
            if (window._hystCo2OrigByEpoch[epochId] == null) {
                // Premier clic : mémoriser la valeur de config (avant tout scan).
                window._hystCo2OrigByEpoch[epochId] = Number(window.TIMELINE[idxEp]['⚖️🏭']);
            } else {
                // Clics suivants : restaurer TIMELINE → readXFromTimeline() lira la valeur originale.
                window.TIMELINE[idxEp]['⚖️🏭'] = window._hystCo2OrigByEpoch[epochId];
            }
            // ── Graine T° (🌡️🧮) : override FROID pour le scan POSITIF (déglaciation 1b) ───────────
            // v-2026-07-14 : le compute repart TOUJOURS de EPOCH['🌡️🧮'] (compute.js:206 réécrit
            // DATA['📅']['🌡️🧮'] à chaque pas → les resets T sync_panels/api et le t0_config de
            // simulateRadiativeTransfer lisent la config). Poser DATA['🧮🌡️'] en onEpochButton ne
            // suffit pas : le 1er compute l'écrase avec la config. Pour la SORTIE de snowball, la graine
            // config doit donc être FROIDE, sinon 1b (config 35 °C) démarre déjà déglacé (→ FAILED / 25 °C).
            // On override la 🌡️🧮 de l'époque le temps du scan positif (mémorisée/restaurée comme le CO₂).
            // Le scan négatif (1a) garde sa graine chaude config (déjà correcte).
            if (!window._hystSeedTOrigByEpoch) window._hystSeedTOrigByEpoch = {};
            if (window._hystSeedTOrigByEpoch[epochId] == null) {
                window._hystSeedTOrigByEpoch[epochId] = Number(window.TIMELINE[idxEp]['🌡️🧮']);
            } else {
                window.TIMELINE[idxEp]['🌡️🧮'] = window._hystSeedTOrigByEpoch[epochId];
            }
            if (this.runSearchSign === 'positive') {
                var coldSeedCfgTK = window.CONST.KELVIN_TO_CELSIUS + (this.coldBranchT_C - 20);
                if (Number.isFinite(coldSeedCfgTK) && coldSeedCfgTK > 0) {
                    window.TIMELINE[idxEp]['🌡️🧮'] = coldSeedCfgTK;
                }
            }
            // ─────────────────────────────────────────────────────────────────────────────────────
            var x0 = clampX(this.adapter.readXFromTimeline());
            // [WARM-START v-2026-07-16] Le scan de RECHERCHE (entrée, signe négatif) démarre AU-DESSUS de la
            // fenêtre bistable — facteur lu depuis la config d'époque (⚖️🏭🔺), générique, pas d'if(epoch==).
            // Époque sans le champ → 1 (départ = baseline, identique à la visu). Requis pour 1a : au baseline
            // (~100 ppm) sous voile 2 %, on est déjà SOUS le tip (~112 ppm) → branche chaude absente → le scan
            // ×0.5 (CO₂↓) ne peut pas amorcer (« branche froide déjà atteinte »). Partir à ×facteur de CO₂ pose
            // le départ sur la branche chaude ; le scan redescend et trouve proprement la bifurcation. La visu
            // n'exécute pas ce scan (elle reste au baseline) → pas de déssynchro. N'affecte pas le scan positif.
            var _epochRowWarm = window.TIMELINE[idxEp];
            var _warmFac = (_epochRowWarm && Number.isFinite(_epochRowWarm['⚖️🏭🔺']) && _epochRowWarm['⚖️🏭🔺'] > 0)
                ? _epochRowWarm['⚖️🏭🔺'] : 1;
            if (this.runSearchSign !== 'positive' && _warmFac > 1) {
                x0 = clampX(x0 * _warmFac);
            }
            this.xBaselineKg = x0;
            this.x = x0;
            this.xOld = x0;
            this.tScanRef = NaN;
            this.xScanWarm = NaN;
            this.valueMin = NaN;
            this.valueMax = NaN;
            this.tWarmRef = NaN;
            this.dichoIter = 0;
            // Init T° obligatoire (les boutons hyst forcent 🔘🎞=true → pas de reset T dans runTest ;
            // sans init explicite, le scan démarre depuis T résiduelle / fallback corps noir → branche indéterminée).
            // v-2026-07-14 : GRAINE selon le SENS du scan (fix 1b déglaciation).
            //   négatif (entrée 1a) : graine CHAUDE = EPOCH['🌡️🧮'] → part branche chaude, CO₂↓ jusqu'au gel.
            //   positif (sortie 1b) : graine FROIDE (snowball ≈ coldBranchT_C−20 ≈ −40 °C) → part branche froide,
            //     CO₂↑ jusqu'à la fonte. Sans ça, 1b seedé chaud (35 °C) était DÉJÀ déglacé au 1er pas
            //     ("branche chaude déjà atteinte" → FAILED) → seuil de déglaciation introuvable.
            var warmSeedTK = Number(EPOCH['🌡️🧮']);
            var coldSeedTK = window.CONST.KELVIN_TO_CELSIUS + (this.coldBranchT_C - 20);
            var seedTK = (this.runSearchSign === 'positive' && Number.isFinite(coldSeedTK) && coldSeedTK > 0) ? coldSeedTK : warmSeedTK;
            this.seedT_C = seedTK - window.CONST.KELVIN_TO_CELSIUS;
            this.tRef_C = this.seedT_C;
            if (Number.isFinite(seedTK) && seedTK > 0) {
                window.DATA['🧮']['🧮🌡️'] = seedTK;
                window.DATA['🧮']['🧮🌡️⏮'] = seedTK;
                window.DATA['🧮']['🧮🌡️🚩'] = seedTK;
            }
            this.lastPpm = NaN;
            this.outerIndex = 0;
            this._hystLoggedFirstCycle = false;
            this._hystLastCycleLines = null;
            // Baseline sulfates au démarrage : si l'époque n'a pas de ⚖️✈ (ex. ⛄), fallback 1e12 kg
            // (ordre de grandeur volcanique Néoprotérozoïque cohérent avec les époques voisines).
            var D = window.DATA;
            this.sulfateBaselineKg = (D && D['⚖️'] && Number.isFinite(Number(D['⚖️']['⚖️✈'])) && Number(D['⚖️']['⚖️✈']) > 0)
                ? Number(D['⚖️']['⚖️✈']) : 1e12;
            // v2.1.17 : Init de l'état AVANT le pas 1 du scan pour éliminer l'artefact de boot.
            // Sans cette init, pas 1 tourne avec les masses secondaires non-peuplées (ex. ⛄ : ⚖️✈=0
            // en config car commenté), puis pas 2 saute brutalement → faux pas de bifurcation
            // (T chutant 17→7°C juste par le boot sulfate, pas par la physique CO₂).
            //
            // ── Branche BaryAdapter (époques avec '🔒' bounds — ex. ⛄) ──
            // writeXToTimeline(x0) : écrit CO₂=x0, déduit bary depuis bounds CO₂, co-évolue TOUTES
            // les masses secondaires via writeSecondaryMasses (sulfate, O₂, N₂...), puis getMasses().
            // Résultat : TIMELINE['⚖️✈'] et DATA['⚖️']['⚖️✈'] peuplés cohéremment avec bary(x0).
            //
            // ── Branche defaultCo2Adapter (époques sans bounds) ──
            // writeXToTimeline(x0) écrit juste CO₂ (no-op car déjà x0). On applique en plus l'init
            // CCN-CO₂ : à xNew=x0, ratio=1 → sulfateNew=sulfateBaselineKg (évite le boot nul).
            this.adapter.writeXToTimeline(x0);
            if (!this.adapter.isBaryAdapter) {
                var _H2init = D && D['🎚️'] && D['🎚️'].HYSTERESIS;
                var _ccnCouplingInit = (_H2init && Number.isFinite(Number(_H2init.ccnSulfateCoupling))) ? Number(_H2init.ccnSulfateCoupling) : 0.5;
                if (_ccnCouplingInit > 0 && Number.isFinite(this.sulfateBaselineKg) && this.sulfateBaselineKg > 0) {
                    var _idxInit = timelineIndexForEpoch(this.epochId);
                    if (_idxInit >= 0 && window.TIMELINE[_idxInit]) {
                        window.TIMELINE[_idxInit]['⚖️✈'] = this.sulfateBaselineKg;
                    }
                    if (D && D['⚖️']) D['⚖️']['⚖️✈'] = this.sulfateBaselineKg;
                }
            } else {
                // Après writeXToTimeline, relire sulfate depuis DATA pour mettre à jour baseline.
                // Pour BaryAdapter ⛄ : bary(x0) ≈ 0.xxx → sulfate ≈ baryToMass([0,5e14], ...) > 0.
                if (D && D['⚖️'] && Number.isFinite(Number(D['⚖️']['⚖️✈'])) && Number(D['⚖️']['⚖️✈']) > 0) {
                    this.sulfateBaselineKg = Number(D['⚖️']['⚖️✈']);
                }
            }
            this.resetLog();
            window._scieHystSearchHadActivity = true;
            if (HYSTERESIS_REF_EPOCH_ID && clickedEpochId !== HYSTERESIS_REF_EPOCH_ID) {
                this.appendLog('🔁 [v2.2.4] Bouton cliqué = ' + clickedEpochId + ' → REDIRECTION ref unique R&D → ' + HYSTERESIS_REF_EPOCH_ID + ' (☃ Sortie Marinoen, chaud ~16°C)');
            }
            this.appendLog('📋 Configuration : hysteresis ' + epochId + ' | signe=' + (this.runSearchSign === 'positive' ? 'positif' : 'négatif'));
            var _rNeg = this.scanFailRatio;
            var _rPos = 1 / _rNeg;
            var _rNegStr = _rNeg.toFixed(2);
            var _rPosStr = _rPos.toFixed(0);
            switch (this.runSearchSign) {
                case 'positive':
                    this.appendLog('  ⚖️🏭₀=' + x0.toExponential(3) + ' kg | scan ÷' + this.scanCo2MassFactor + ' (CO₂↑) jusqu’à T > ' + this.warmBranchT_C + ' °C (branche chaude)');
                    this.appendLog('  Failed si ⚖️🏭 > ' + _rPosStr + '·⚖️🏭₀ | dicho bary 0,5 | succès |Δ| < ' + this.convergencePpmMass + ' ppm-éq | max ' + this.maxDichoSteps + ' dicho');
                    break;
                default:
                    this.appendLog('  ⚖️🏭₀=' + x0.toExponential(3) + ' kg | scan ×' + this.scanCo2MassFactor + ' (CO₂↓) jusqu’à T < ' + this.coldBranchT_C + ' °C (branche froide)');
                    this.appendLog('  Failed si ⚖️🏭 < ' + _rNegStr + '·⚖️🏭₀ | dicho bary 0,5 | succès |Δ| < ' + this.convergencePpmMass + ' ppm-éq | max ' + this.maxDichoSteps + ' dicho');
            }
            this.appendLog('━━ 🧲 démarrage (compute:done = un pas) ━━');
            this.appendLog('  (opt.) détail 🧊 : CONFIG_COMPUTE.logIceFractionDiagnostic=true → console / pd() chaîne polar+mer+verrous+surface');
            window !== window.top && this.appendLog('  (iframe) sync:state + ⚖️🏭');
            postHysteresisActiveToParent(true);
        },

        syncIframeTimelineCo2FromData: function () {
            window.TIMELINE[timelineIndexForEpoch(this.epochId)]['⚖️🏭'] = Number(window.DATA['⚖️']['⚖️🏭']);
        },

        onParentComputeDone: function () {
            var need = this.afterRadiativeConverged();
            if (window.CONFIG_COMPUTE && window.CONFIG_COMPUTE.logCo2RadiativeDiagnostic === true) {
                var DATA = window.DATA;
                var eds = (DATA && DATA['📛'] && DATA['📛']['🧲📛🏭'] != null) ? Number(DATA['📛']['🧲📛🏭']) : NaN;
                var tC = DATA && DATA['🧮'] && DATA['🧮']['🧮🌡️'] != null
                    ? (Number(DATA['🧮']['🧮🌡️']) - window.CONST.KELVIN_TO_CELSIUS) : NaN;
                console.log('🔎 DIAG HYST',
                    '📿🧮=' + this.outerIndex,
                    '🧲📛🏭=', (Number.isFinite(eds) ? eds.toFixed(3) : 'n/a'), 'W/m²',
                    'T=', (Number.isFinite(tC) ? tC.toFixed(2) : 'n/a'), '°C');
            }
            switch (need) {
                case true:
                    this.emitParentHysteresisContinue();
                    break;
                default:
                    this.clearHystEpochButtonsSelected();
                    window._scieHystSearchHadActivity = false;
            }
        },

        emitParentHysteresisContinue: function () {
            var DATA = window.DATA;
            var T = DATA['🎚️'];
            var bg = T.baryByGroup;
            window.parent.postMessage({
                type: 'sync:state',
                payload: {
                    epochId: this.epochId,
                    animEnabled: true,
                    ticTime: DATA['📜']['📿💫'],
                    hysteresisActive: true,
                    h2oTotalFromMeteorites: window.RUNTIME_STATE.h2oTotalFromMeteorites,
                    hysteresisTimelineCo2Kg: this.x,
                    bary: DATA['📜']['bary'],
                    tuning: {
                        baryByGroup: {
                            CLOUD_SW: bg.CLOUD_SW,
                            SCIENCE: bg.SCIENCE,
                            SOLVER: bg.SOLVER,
                            HYSTERESIS: bg.HYSTERESIS
                        },
                        CLOUD_SW: T.CLOUD_SW,
                        SOLVER: T.SOLVER,
                        updates: []
                    }
                }
            }, '*');
        },

        afterRadiativeConverged: function () {
            var DATA = window.DATA;
            var self = this;
            var fac = this.scanCo2MassFactor;
            var brutal = this.brutalDeltaT_C;
            var x0 = this.xBaselineKg;
            var isPos = this.runSearchSign === 'positive';
            var tolKg = deltaKgCo2ForOnePpm() * Number(this.convergencePpmMass);

            switch (true) {
                case !this.active:
                case !!window.ABORT_COMPUTE:
                    window.ABORT_COMPUTE && this.appendLog('━━ Interruption (ABORT) ━━');
                    this._appendHystLastCycleSnapshot();
                    this.deactivate();
                    return false;
                default:
            }

            switch (this.adapter) {
                case null:
                case undefined:
                    this.deactivate();
                    return false;
                default:
            }

            var xBefore = this.x;
            var T = readTcelsius();
            var ppm = readCo2Ppm();
            this.outerIndex++;
            this.appendLog('');
            var tConvSuffix = (this.outerIndex === 1)
                ? ' (graine initiale ' + this.seedT_C.toFixed(2) + ' °C, une fois)'
                : '';
            this.appendLog('── 📿🧮=' + this.outerIndex + '  phase=' + this.phase + '  ⚖️🏭=' + xBefore.toExponential(3)
                + ' kg → T_conv=' + T.toFixed(2) + ' °C' + tConvSuffix + ' ──');
            this._refreshHystWaterAlbedoSnapshots(T);
            this._appendHystPerStepDiagnostic(T, xBefore, ppm);
            if (window.HYST_REPRO_LOG && typeof window.HYST_REPRO_LOG.emitToHystPanel === 'function') {
                window.HYST_REPRO_LOG.emitToHystPanel(this.appendLog.bind(this), 'hyst:outer');
            }

            switch (true) {
                case this.outerIndex >= MAX_OUTER:
                    this.appendLog('━━ Arrêt : garde-fou maxOuter=' + MAX_OUTER + ' ━━');
                    this._appendHystLastCycleSnapshot();
                    this.deactivate();
                    return false;
                default:
            }

            // v2.2.5 — Détection départ sur branche cible (1er pas) basée sur SEUILS ABSOLUS
            // (coldBranchT_C / warmBranchT_C), plus delta relatif à seedT_C.
            // Rationale : la graine T_seed peut être agressive (ex. ☃ 39°C) mais la convergence Picard
            // peut atterrir modérément chaude (ex. 0°C à 989 ppm) sans que ce soit la branche froide.
            // Tant que T reste > coldBranchT_C (scan−) ou < warmBranchT_C (scan+), le scan est légitime.
            // FAILED ne se déclenche que si la branche cible est DÉJÀ atteinte au CO₂ baseline → pas de
            // seuil d'hystérésis à trouver.
            // Bug corrigé aussi : `!this.runSearchSign !== 'positive'` → parenthésé correctement via var.
            var negativeScan = this.runSearchSign !== 'positive';
            var alreadyCold = negativeScan
                && this.outerIndex === 1
                && Number.isFinite(this.coldBranchT_C)
                && T < this.coldBranchT_C;
            var alreadyHot = !negativeScan
                && this.outerIndex === 1
                && Number.isFinite(this.warmBranchT_C)
                && T > this.warmBranchT_C;
            if (alreadyCold || alreadyHot) {
                this.appendLog('━━ FAILED : branche ' + (alreadyCold ? 'froide' : 'chaude') + ' déjà atteinte au CO₂ baseline ━━');
                var seuilAbs = alreadyCold ? this.coldBranchT_C : this.warmBranchT_C;
                this.appendLog('  T=' + T.toFixed(2) + ' °C ' + (alreadyCold ? '<' : '>') + ' seuil ' + (alreadyCold ? 'froid' : 'chaud') + ' ' + seuilAbs + ' °C.');
                this.appendLog('  Pas de bifurcation à trouver : la branche ' + (alreadyCold ? 'chaude' : 'froide') + ' n\'existe pas à ⚖️🏭₀=' + xBefore.toExponential(3) + ' kg.');
                this.appendLog('  → Ajuster CO₂ initial (⚖️🏭₀), ou réviser polarAmplificationK / midlatAmplificationK / highlands.');
                this._appendHystLastCycleSnapshot();
                this.deactivate();
                return false;
            }

            function failHalf() {
                var rNeg = self.scanFailRatio;
                var rPos = 1 / rNeg;
                var rNegStr = (rNeg).toFixed(2);
                var rPosStr = (rPos).toFixed(0);
                switch (isPos) {
                    case true:
                        self.appendLog('━━ FAILED : ⚖️🏭 serait > ' + rPosStr + '·⚖️🏭₀ — pas de saut chaud trouvé dans la plage ━━');
                        self.appendLog('  ' + rPosStr + '·⚖️🏭₀=' + (rPos * x0).toExponential(3) + ' kg');
                        break;
                    default:
                        self.appendLog('━━ FAILED : ⚖️🏭 serait < ' + rNegStr + '·⚖️🏭₀ — pas de chute brutale trouvée dans la plage ━━');
                        self.appendLog('  ' + rNegStr + '·⚖️🏭₀=' + (rNeg * x0).toExponential(3) + ' kg');
                }
                self._appendHystLastCycleSnapshot();
                self.deactivate();
                return false;
            }

            function writeAndContinue(xNew) {
                self.xOld = xBefore;
                self.x = clampX(xNew);
                if (self.phase === 'dicho' && !isPos && xNew > xBefore) {
                    var idxE = timelineIndexForEpoch(self.epochId);
                    var EP = (idxE >= 0 && window.TIMELINE[idxE]) ? window.TIMELINE[idxE] : null;
                    var gT = EP && Number(EP['🌡️🧮']);
                    if (Number.isFinite(gT) && gT > 0 && window.DATA && window.DATA['🧮']) {
                        window.DATA['🧮']['🧮🌡️'] = gT;
                        window.DATA['🧮']['🧮🌡️⏮'] = gT;
                        window.DATA['🧮']['🧮🌡️🚩'] = gT;
                        self.appendLog('  (dicho−) CO₂↑ : T ← EPOCH[🌡️🧮] = ' + (gT - window.CONST.KELVIN_TO_CELSIUS).toFixed(2) + ' °C (évite reprise depuis attracteur froid)');
                    }
                }
                // v-2026-07-14 : symétrique scan POSITIF (déglaciation 1b). Quand la dicho BAISSE le CO₂
                // (retour côté froid), re-seed FROID pour rester sur la branche snowball et ne pas sauter
                // à l'attracteur chaud (le bloc négatif ci-dessus re-seed chaud sur CO₂↑).
                if (self.phase === 'dicho' && isPos && xNew < xBefore) {
                    var cT = window.CONST.KELVIN_TO_CELSIUS + (self.coldBranchT_C - 20);
                    if (Number.isFinite(cT) && cT > 0 && window.DATA && window.DATA['🧮']) {
                        window.DATA['🧮']['🧮🌡️'] = cT;
                        window.DATA['🧮']['🧮🌡️⏮'] = cT;
                        window.DATA['🧮']['🧮🌡️🚩'] = cT;
                        self.appendLog('  (dicho+) CO₂↓ : T ← froid ' + (cT - window.CONST.KELVIN_TO_CELSIUS).toFixed(2) + ' °C (évite reprise depuis attracteur chaud)');
                    }
                }
                self.appendLog('  → prochain ⚖️🏭=' + self.x.toExponential(3) + ' kg');
                // v2.1.15 : couplage CCN-CO₂ désactivé si BaryAdapter actif.
                // Le BaryAdapter co-évolue les sulfates via bary dans writeXToTimeline → pas de double écriture.
                if (!self.adapter || !self.adapter.isBaryAdapter) {
                // Couplage CCN-CO₂ hystérésis : sulfates volcaniques (⚖️✈) varient en sens inverse du CO₂.
                // Physique ⛄ : rifting Rodinia → SO₂ volcanique ↑ quand CO₂↓ par weathering (Hoffman 1998).
                // Formula : ⚖️✈ = baseline × (x0/xNew)^coupling. coupling=0.5 (racine, softer) par défaut.
                // Écrit dans TIMELINE avant writeXToTimeline → getMasses() lit la valeur mise à jour.
                var H2 = window.DATA && window.DATA['🎚️'] && window.DATA['🎚️'].HYSTERESIS;
                var ccnCoupling = (H2 && Number.isFinite(Number(H2.ccnSulfateCoupling))) ? Number(H2.ccnSulfateCoupling) : 0.5;
                if (ccnCoupling > 0 && Number.isFinite(self.sulfateBaselineKg) && self.xBaselineKg > 0 && self.x > 0) {
                    var xRatio = self.x / self.xBaselineKg;
                    var sulfateNew = self.sulfateBaselineKg * Math.pow(1 / xRatio, ccnCoupling);
                    var idxS = timelineIndexForEpoch(self.epochId);
                    if (idxS >= 0 && window.TIMELINE[idxS]) {
                        window.TIMELINE[idxS]['⚖️✈'] = sulfateNew;
                    }
                    self.appendLog('  ⚖️✈=' + sulfateNew.toExponential(3) + ' kg (sulfates ×' + (sulfateNew / self.sulfateBaselineKg).toFixed(3) + ')');
                }
                } // end if (!adapter.isBaryAdapter) — v2.1.15
                self.adapter.writeXToTimeline(self.x);
                self.tRef_C = T;
                self.lastPpm = ppm;
                DATA['📅'] = window.TIMELINE[timelineIndexForEpoch(self.epochId)];
                return true;
            }

            switch (this.phase) {
                case 'scan':
                    switch (isPos) {
                        case true:
                            switch (true) {
                                case !Number.isFinite(this.tScanRef):
                                    this.tScanRef = T;
                                    this.xScanWarm = xBefore;
                                    this.appendLog('  [scan+] référence T=' + T.toFixed(2) + ' °C @ ' + xBefore.toExponential(3) + ' kg');
                                    var x1p = xBefore / fac;
                                    switch (true) {
                                        case x1p > 2 * x0:
                                            return failHalf();
                                        default:
                                            return writeAndContinue(x1p);
                                    }
                                default:
                            }
                            var riseScan = T > this.warmBranchT_C;
                            switch (true) {
                                case riseScan:
                                    this.valueMin = this.xScanWarm;
                                    this.valueMax = xBefore;
                                    this.tWarmRef = this.tScanRef;
                                    this.phase = 'dicho';
                                    this.dichoIter = 0;
                                    this.appendLog('  [scan+] branche chaude atteinte : T ' + T.toFixed(2) + ' °C > seuil ' + this.warmBranchT_C + ' °C → dicho [min,max]=[' + this.valueMin.toExponential(3) + ',' + this.valueMax.toExponential(3) + ']');
                                    var xMid0p = 0.5 * (this.valueMin + this.valueMax);
                                    return writeAndContinue(xMid0p);
                                default:
                            }
                            var xNextP = xBefore / fac;
                            switch (true) {
                                // FAILED aussi si le CO₂ est coincé au plafond X_ABS_MAX (clamp ne progresse plus) :
                                // sinon boucle infinie quand X_ABS_MAX < (1/scanFailRatio)·x0 (v-2026-07-16).
                                case xNextP > (1 / this.scanFailRatio) * x0 || clampX(xNextP) <= xBefore:
                                    return failHalf();
                                default:
                            }
                            this.tScanRef = T;
                            this.xScanWarm = xBefore;
                            this.appendLog('  [scan+] pas branche chaude (T=' + T.toFixed(2) + ' °C < seuil ' + this.warmBranchT_C + ' °C) ; réf. T←' + T.toFixed(2) + ' °C');
                            return writeAndContinue(xNextP);
                        default:
                            switch (true) {
                                case !Number.isFinite(this.tScanRef):
                                    this.tScanRef = T;
                                    this.xScanWarm = xBefore;
                                    this.appendLog('  [scan−] référence chaude T=' + T.toFixed(2) + ' °C @ ' + xBefore.toExponential(3) + ' kg');
                                    var x1 = xBefore * fac;
                                    switch (true) {
                                        case x1 < this.scanFailRatio * x0:
                                            return failHalf();
                                        default:
                                            return writeAndContinue(x1);
                                    }
                                default:
                            }
                            var dropScan = T < this.coldBranchT_C;
                            switch (true) {
                                case dropScan:
                                    this.valueMax = this.xScanWarm;
                                    this.valueMin = xBefore;
                                    this.tWarmRef = this.tScanRef;
                                    this.phase = 'dicho';
                                    this.dichoIter = 0;
                                    this.appendLog('  [scan−] branche froide atteinte : T ' + T.toFixed(2) + ' °C < seuil ' + this.coldBranchT_C + ' °C → dicho [min,max]=[' + this.valueMin.toExponential(3) + ',' + this.valueMax.toExponential(3) + ']');
                                    var xMid0 = 0.5 * (this.valueMin + this.valueMax);
                                    return writeAndContinue(xMid0);
                                default:
                            }
                            var xNext = xBefore * fac;
                            switch (true) {
                                // FAILED aussi si le CO₂ est coincé au plancher X_ABS_MIN (clamp ne progresse plus) (v-2026-07-16).
                                case xNext < this.scanFailRatio * x0 || clampX(xNext) >= xBefore:
                                    return failHalf();
                                default:
                            }
                            this.tScanRef = T;
                            this.xScanWarm = xBefore;
                            this.appendLog('  [scan−] pas branche froide (T=' + T.toFixed(2) + ' °C ≥ seuil ' + this.coldBranchT_C + ' °C) ; réf. T←' + T.toFixed(2) + ' °C');
                            return writeAndContinue(xNext);
                    }

                case 'dicho':
                    this.dichoIter++;
                    this.appendLog('  [dicho] pas ' + this.dichoIter + ' / ' + this.maxDichoSteps);
                    switch (isPos) {
                        case true:
                            var hot = T > this.warmBranchT_C;
                            switch (true) {
                                case hot:
                                    this.valueMax = xBefore;
                                    this.appendLog('  → chaud (T=' + T.toFixed(2) + ' °C > seuil ' + this.warmBranchT_C + ') : max ← ' + this.valueMax.toExponential(3));
                                    break;
                                default:
                                    this.valueMin = xBefore;
                                    this.tWarmRef = T;
                                    this.appendLog('  → encore froid (T=' + T.toFixed(2) + ' °C ≤ seuil ' + this.warmBranchT_C + ') : min ← ' + this.valueMin.toExponential(3));
                            }
                            break;
                        default:
                            var cold = T < this.coldBranchT_C;
                            switch (true) {
                                case cold:
                                    this.valueMin = xBefore;
                                    this.appendLog('  → froid (T=' + T.toFixed(2) + ' °C < seuil ' + this.coldBranchT_C + ') : min ← ' + this.valueMin.toExponential(3));
                                    break;
                                default:
                                    this.valueMax = xBefore;
                                    this.tWarmRef = T;
                                    this.appendLog('  → encore chaud (T=' + T.toFixed(2) + ' °C ≥ seuil ' + this.coldBranchT_C + ') : max ← ' + this.valueMax.toExponential(3));
                            }
                    }
                    var span = Math.abs(this.valueMax - this.valueMin);
                    switch (true) {
                        case span < tolKg:
                            this.appendLog('━━ SUCCESS : |max−min|=' + span.toExponential(3) + ' kg < tol 1ppm-éq (' + tolKg.toExponential(3) + ') ━━');
                            this.appendLog('  bornes ⚖️🏭 min=' + this.valueMin.toExponential(3) + ' max=' + this.valueMax.toExponential(3) + ' kg | T_conv=' + T.toFixed(2) + ' °C');
                            this._appendHystLastCycleSnapshot();
                            this.deactivate();
                            return false;
                        default:
                    }
                    switch (true) {
                        case this.dichoIter >= this.maxDichoSteps:
                            this.appendLog('━━ PARTIEL : ' + this.maxDichoSteps + ' dicho — seuil pas assez serré ━━');
                            this.appendLog('  ⚖️🏭 min=' + this.valueMin.toExponential(3) + ' kg | max=' + this.valueMax.toExponential(3) + ' kg | |Δ|=' + span.toExponential(3) + ' kg');
                            this._appendHystLastCycleSnapshot();
                            this.deactivate();
                            return false;
                        default:
                    }
                    var xMid = 0.5 * (this.valueMin + this.valueMax);
                    this.appendLog('  → barycentre 0,5 → ⚖️🏭=' + xMid.toExponential(3) + ' kg');
                    return writeAndContinue(xMid);

                default:
                    this.phase = 'scan';
                    return writeAndContinue(xBefore);
            }
        },

        registerAdapter: function (adapter) {
            this.adapter = adapter;
        },

        applyBracketStep: hysteresisLegacyNoOp
    };

    window.HYSTERESIS = HYST;
    window.scieHysteresisApplyBracketStep = hysteresisLegacyNoOp;
    window.scieHysteresisDeltaKgForOnePpm = deltaKgCo2ForOnePpm;
})();
