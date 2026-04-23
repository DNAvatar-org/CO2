// File: scie_hysteresis_search.js - Recherche seuil CO₂ hystérésis scie_
// Desc: En français, dans l'architecture, je suis window.HYSTERESIS — négatif : scan CO₂×factor chute T failed <½·x₀ ; positif : ÷factor saut T chaud failed >2·x₀ ; dicho 0,5 [min,max]
// Version 2.1.14
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: April 22, 2026
// Logs:
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
    var X_ABS_MAX = 5e17;
    /** Garde-fou nombre total d’appels API (scan + dicho) */
    var MAX_OUTER = 200;

    function clampX(x) {
        return Math.max(X_ABS_MIN, Math.min(X_ABS_MAX, Math.max(X_ABS_MIN, x)));
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
        scanCo2MassFactor: 0.9,
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
            this.logLines.push(String(line));
            var logEl = hystLogEl();
            if (logEl) logEl.textContent = this.logLines.join('\n');
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

        clearHystEpochButtonsSelected: function () {
            document.getElementById('hyst-epoch-snow').classList.remove('selected');
            document.getElementById('hyst-epoch-h1b').classList.remove('selected');
            document.getElementById('hyst-epoch-h2').classList.remove('selected');
        },

        syncSearchSignButtonUI: function () {
            var btn = document.getElementById('hyst-search-sign-btn');
            var modeEl = document.getElementById('hyst-sign-mode');
            var neg = this.searchSign === 'negative';
            var Ht = window.DATA && window.DATA['🎚️'] && window.DATA['🎚️'].HYSTERESIS;
            var facRaw = Ht && Number(Ht.scanCo2MassFactor);
            var fac = (Number.isFinite(facRaw) && facRaw > 0 && facRaw < 1) ? facRaw : 0.9;
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
            postHysteresisActiveToParent(false);
        },

        onEpochButton: function (epochId) {
            var idxEp = timelineIndexForEpoch(epochId);
            var EPOCH = (idxEp >= 0 && window.TIMELINE[idxEp]) ? window.TIMELINE[idxEp] : window.DATA['📅'];
            var H = window.DATA['🎚️'].HYSTERESIS;
            this.active = true;
            this.epochId = epochId;
            this.adapter = defaultCo2Adapter(epochId);
            this.phase = 'scan';
            this.epsilon = Number(H.epsilonT_C);
            this.epsilonPpm = Number(H.epsilonPpm);
            this.convergencePpmMass = Number(H.convergencePpmMass);
            this.brutalDeltaT_C = (Number.isFinite(Number(H.brutalDeltaT_C)) && Number(H.brutalDeltaT_C) > 0) ? Number(H.brutalDeltaT_C) : 3;
            this.scanCo2MassFactor = (Number.isFinite(Number(H.scanCo2MassFactor)) && Number(H.scanCo2MassFactor) > 0 && Number(H.scanCo2MassFactor) < 1) ? Number(H.scanCo2MassFactor) : 0.9;
            this.maxDichoSteps = (Number.isFinite(Number(H.maxDichoSteps)) && Number(H.maxDichoSteps) > 0) ? Math.floor(Number(H.maxDichoSteps)) : 30;
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
            // ─────────────────────────────────────────────────────────────────────────────────────
            var x0 = clampX(this.adapter.readXFromTimeline());
            this.xBaselineKg = x0;
            this.x = x0;
            this.xOld = x0;
            this.tScanRef = NaN;
            this.xScanWarm = NaN;
            this.valueMin = NaN;
            this.valueMax = NaN;
            this.tWarmRef = NaN;
            this.dichoIter = 0;
            this.seedT_C = Number(EPOCH['🌡️🧮']) - window.CONST.KELVIN_TO_CELSIUS;
            this.tRef_C = this.seedT_C;
            // Init T° depuis graine époque (EPOCH.🌡️🧮) — obligatoire pour l'hystérésis :
            // les 3 boutons hyst forcent 🔘🎞=true (continuité T inter-ticks du scan), ce qui
            // désactive le reset T de runTest(). Sans init explicite ici, le scan démarre depuis
            // T résiduelle (ou fallback corps noir ~254 K / -18.5 °C) → branche indéterminée.
            // Chaque epoch hyst pose sa graine de branche (1a/1b=chaude ~290-312 K, ⛄=froide 239 K, 2=298 K).
            var seedTK = Number(EPOCH['🌡️🧮']);
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
            this.resetLog();
            window._scieHystSearchHadActivity = true;
            this.appendLog('📋 Configuration : hysteresis ' + epochId + ' | signe=' + (this.runSearchSign === 'positive' ? 'positif' : 'négatif'));
            switch (this.runSearchSign) {
                case 'positive':
                    this.appendLog('  ⚖️🏭₀=' + x0.toExponential(3) + ' kg | scan ÷' + this.scanCo2MassFactor + ' (CO₂↑) jusqu’à saut T ≥ ' + this.brutalDeltaT_C + ' °C');
                    this.appendLog('  Failed si ⚖️🏭 > 2·⚖️🏭₀ | dicho bary 0,5 | succès |Δ| < ' + this.convergencePpmMass + ' ppm-éq | max ' + this.maxDichoSteps + ' dicho');
                    break;
                default:
                    this.appendLog('  ⚖️🏭₀=' + x0.toExponential(3) + ' kg | scan ×' + this.scanCo2MassFactor + ' (CO₂↓) jusqu’à chute T ≥ ' + this.brutalDeltaT_C + ' °C');
                    this.appendLog('  Failed si ⚖️🏭 < ½·⚖️🏭₀ | dicho bary 0,5 | succès |Δ| < ' + this.convergencePpmMass + ' ppm-éq | max ' + this.maxDichoSteps + ' dicho');
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
            this.appendLog('── 📿🧮=' + this.outerIndex + '  phase=' + this.phase + '  ⚖️🏭=' + xBefore.toExponential(3) + ' kg → 🌡️🧮=' + T.toFixed(2) + ' °C ──');
            this._refreshHystWaterAlbedoSnapshots(T);

            switch (true) {
                case this.outerIndex >= MAX_OUTER:
                    this.appendLog('━━ Arrêt : garde-fou maxOuter=' + MAX_OUTER + ' ━━');
                    this._appendHystLastCycleSnapshot();
                    this.deactivate();
                    return false;
                default:
            }

            // Détection départ sur branche froide (1er pas) : si T est déjà très éloignée de la graine,
            // la branche chaude n'existe pas à ⚖️🏭₀ — pas de seuil à trouver en descendant.
            // Seuil : T < seedT − 20°C (froid brutal) pour scan négatif, ou T > seedT + 20°C pour scan positif.
            var coldThreshDrop = 20;
            var alreadyCold = !this.runSearchSign !== 'positive'
                && this.outerIndex === 1
                && Number.isFinite(this.seedT_C)
                && T < this.seedT_C - coldThreshDrop;
            var alreadyHot = this.runSearchSign === 'positive'
                && this.outerIndex === 1
                && Number.isFinite(this.seedT_C)
                && T > this.seedT_C + coldThreshDrop;
            if (alreadyCold || alreadyHot) {
                this.appendLog('━━ FAILED : déjà sur branche ' + (alreadyCold ? 'froide' : 'chaude') + ' au départ ━━');
                this.appendLog('  T=' + T.toFixed(2) + ' °C vs graine=' + this.seedT_C.toFixed(2) + ' °C (écart ' + Math.abs(T - this.seedT_C).toFixed(1) + ' K > seuil ' + coldThreshDrop + ' K)');
                this.appendLog('  La branche ' + (alreadyCold ? 'chaude' : 'froide') + ' n\'existe pas à ⚖️🏭₀=' + xBefore.toExponential(3) + ' kg.');
                this.appendLog('  → Ajuster CO₂ initial (⚖️🏭₀), ou réduire polarAmplificationK / midlatAmplificationK.');
                this._appendHystLastCycleSnapshot();
                this.deactivate();
                return false;
            }

            function failHalf() {
                switch (isPos) {
                    case true:
                        self.appendLog('━━ FAILED : ⚖️🏭 serait > 2·⚖️🏭₀ — pas de saut chaud trouvé dans la plage ━━');
                        self.appendLog('  2·⚖️🏭₀=' + (2 * x0).toExponential(3) + ' kg');
                        break;
                    default:
                        self.appendLog('━━ FAILED : ⚖️🏭 serait < ½·⚖️🏭₀ — pas de chute brutale trouvée dans la plage ━━');
                        self.appendLog('  ½·⚖️🏭₀=' + (0.5 * x0).toExponential(3) + ' kg');
                }
                self._appendHystLastCycleSnapshot();
                self.deactivate();
                return false;
            }

            function writeAndContinue(xNew) {
                self.xOld = xBefore;
                self.x = clampX(xNew);
                self.appendLog('  → prochain ⚖️🏭=' + self.x.toExponential(3) + ' kg');
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
                            var riseScan = T > this.tScanRef + brutal;
                            switch (true) {
                                case riseScan:
                                    this.valueMin = this.xScanWarm;
                                    this.valueMax = xBefore;
                                    this.tWarmRef = this.tScanRef;
                                    this.phase = 'dicho';
                                    this.dichoIter = 0;
                                    this.appendLog('  [scan+] saut chaud : T ' + this.tScanRef.toFixed(2) + ' → ' + T.toFixed(2) + ' °C → dicho [min,max]=[' + this.valueMin.toExponential(3) + ',' + this.valueMax.toExponential(3) + ']');
                                    var xMid0p = 0.5 * (this.valueMin + this.valueMax);
                                    return writeAndContinue(xMid0p);
                                default:
                            }
                            var xNextP = xBefore / fac;
                            switch (true) {
                                case xNextP > 2 * x0:
                                    return failHalf();
                                default:
                            }
                            this.tScanRef = T;
                            this.xScanWarm = xBefore;
                            this.appendLog('  [scan+] pas de saut chaud (seuil ' + brutal + ' °C) ; réf. T←' + T.toFixed(2) + ' °C');
                            return writeAndContinue(xNextP);
                        default:
                            switch (true) {
                                case !Number.isFinite(this.tScanRef):
                                    this.tScanRef = T;
                                    this.xScanWarm = xBefore;
                                    this.appendLog('  [scan−] référence chaude T=' + T.toFixed(2) + ' °C @ ' + xBefore.toExponential(3) + ' kg');
                                    var x1 = xBefore * fac;
                                    switch (true) {
                                        case x1 < 0.5 * x0:
                                            return failHalf();
                                        default:
                                            return writeAndContinue(x1);
                                    }
                                default:
                            }
                            var dropScan = T < this.tScanRef - brutal;
                            switch (true) {
                                case dropScan:
                                    this.valueMax = this.xScanWarm;
                                    this.valueMin = xBefore;
                                    this.tWarmRef = this.tScanRef;
                                    this.phase = 'dicho';
                                    this.dichoIter = 0;
                                    this.appendLog('  [scan−] chute brutale : T ' + this.tScanRef.toFixed(2) + ' → ' + T.toFixed(2) + ' °C → dicho [min,max]=[' + this.valueMin.toExponential(3) + ',' + this.valueMax.toExponential(3) + ']');
                                    var xMid0 = 0.5 * (this.valueMin + this.valueMax);
                                    return writeAndContinue(xMid0);
                                default:
                            }
                            var xNext = xBefore * fac;
                            switch (true) {
                                case xNext < 0.5 * x0:
                                    return failHalf();
                                default:
                            }
                            this.tScanRef = T;
                            this.xScanWarm = xBefore;
                            this.appendLog('  [scan−] pas de chute (seuil ' + brutal + ' °C) ; réf. T←' + T.toFixed(2) + ' °C');
                            return writeAndContinue(xNext);
                    }

                case 'dicho':
                    this.dichoIter++;
                    this.appendLog('  [dicho] pas ' + this.dichoIter + ' / ' + this.maxDichoSteps);
                    switch (isPos) {
                        case true:
                            var hot = T > this.tWarmRef + brutal;
                            switch (true) {
                                case hot:
                                    this.valueMax = xBefore;
                                    this.appendLog('  → chaud (T > T_froid+' + brutal + ') : max ← ' + this.valueMax.toExponential(3));
                                    break;
                                default:
                                    this.valueMin = xBefore;
                                    this.tWarmRef = T;
                                    this.appendLog('  → encore froid : min ← ' + this.valueMin.toExponential(3) + ' , T_froid←' + T.toFixed(2) + ' °C');
                            }
                            break;
                        default:
                            var cold = T < this.tWarmRef - brutal;
                            switch (true) {
                                case cold:
                                    this.valueMin = xBefore;
                                    this.appendLog('  → froid (T < T_chaud−' + brutal + ') : min ← ' + this.valueMin.toExponential(3));
                                    break;
                                default:
                                    this.valueMax = xBefore;
                                    this.tWarmRef = T;
                                    this.appendLog('  → encore chaud : max ← ' + this.valueMax.toExponential(3) + ' , T_chaud←' + T.toFixed(2) + ' °C');
                            }
                    }
                    var span = Math.abs(this.valueMax - this.valueMin);
                    switch (true) {
                        case span < tolKg:
                            this.appendLog('━━ SUCCESS : |max−min|=' + span.toExponential(3) + ' kg < tol 1ppm-éq (' + tolKg.toExponential(3) + ') ━━');
                            this.appendLog('  bornes ⚖️🏭 min=' + this.valueMin.toExponential(3) + ' max=' + this.valueMax.toExponential(3) + ' kg | 🌡️🧮=' + T.toFixed(2) + ' °C');
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
