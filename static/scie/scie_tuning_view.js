// File: CO2/static/scie/scie_tuning_view.js - Panneau fine-tuning : bornes, barycentres, curseurs
// Desc: Le FINE-TUNING : les bornes de FINE_TUNING_BOUNDS, les curseurs de barycentre par groupe, et la
//       synchronisation avec la page parente. C'est la partie qui rend visible le flou scientifique.
// Version 1.1.0
// Date: [September 19, 2026]
// logs :
//   - v1.1.0: fillDataTuningFromBary retiré — appel à window.TUNING.fillDataTuningFromBary (API).
//     Deuxième écriture de la même interpolation, avec une sémantique de barycentre périmée.
//   - v1.0.0: extraction depuis le <script> en ligne de CO2/html/scie_compute.html (1810 lignes d'un bloc).
//     Découpage par responsabilité, à code IDENTIQUE : seule l'indentation change. Les fichiers restent des
//     scripts classiques chargés dans l'ordre des dépendances — la page garde son chargement synchrone.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.


function getFineTuningTargets() {
    return window.FINE_TUNING_BOUNDS.targets.filter(function (target) {
        return target && target.group && target.key && window.DATA['🎚️'][target.group];
    });
}

/**
 * Une cible SORTIE du barycentre (`fixed` dans fine_tuning_bounds.js) n'a plus de min/moy/max :
 * sa plage ne décrivait pas une incertitude scientifique et ne doit plus s'afficher comme telle.
 * Voir API_BILAN/doc/AUDIT_TUNING_7_PARAMS.md.
 */
function isFineTuningFixed(target) {
    return target && target.fixed != null && Number.isFinite(Number(target.fixed));
}

function getFineTuningThreeValues(target) {
    if (isFineTuningFixed(target)) {
        const f = Number(target.fixed);
        return [{ label: 'figé', value: f }];
    }
    const min = Number(target.min);
    const max = Number(target.max);
    const avg = (min + max) / 2;
    return [
        { label: 'min', value: min },
        { label: 'moy', value: avg },
        { label: 'max', value: max }
    ];
}

function setFineTuningValue(target, value) {
    window.DATA['🎚️'][target.group][target.key] = value;
    if (target.group === 'SOLVER') syncSolverConfigFromData();
}

function getFineTuningBaryPercent(groupKey) {
    return Number(window.DATA['🎚️'].baryByGroup[groupKey]);
}

/** Jauge unique en-tête ☁️+🔬 : source unique ATM. */
function getFineTuningUnifiedAtmBaryPercent() {
    var bg = window.DATA['🎚️'].baryByGroup;
    return Math.max(0, Math.min(100, Math.round(Number(bg.ATM))));
}

function setFineTuningBaryPercent(groupKey, percentRaw) {
    const p = Number(percentRaw);
    const bounded = Math.max(0, Math.min(100, Number.isFinite(p) ? p : 0));
    window.DATA['🎚️'].baryByGroup[groupKey] = bounded;
    return bounded;
}

function getFineTuningBaryValue(target, baryPercent) {
    // Cible sortie du barycentre : la jauge ne la touche plus (même règle que tuning.js interpolate).
    if (isFineTuningFixed(target)) return Number(target.fixed);
    var min = Number(target.min);
    var max = Number(target.max);
    var pct = Number(baryPercent);
    var alpha = pct / 100;
    if (alpha < 0) alpha = 0;
    if (alpha > 1) alpha = 1;
    return min + (max - min) * alpha;
}

function getFineTuningTargetsByGroup(groupKey) {
    const targets = getFineTuningTargets();
    if (groupKey === 'SCIENCE') {
        return targets.filter(function (t) { return t.baryGroup === 'SCIENCE'; });
    }
    if (groupKey === 'CLOUD_SW') {
        return targets.filter(function (t) { return t.group === 'CLOUD_SW' && (t.baryGroup == null || t.baryGroup === 'CLOUD_SW'); });
    }
    return targets.filter(function (t) { return t.group === groupKey; });
}

function getFineTuningBaryByGroupSnapshot() {
    var bg = window.DATA['🎚️'].baryByGroup;
    return { ATM: bg.ATM, CLOUD_SW: bg.CLOUD_SW, SCIENCE: bg.SCIENCE, SOLVER: bg.SOLVER };
}

// Remplissage complet DATA['🎚️'].CLOUD_SW et .SOLVER depuis baryByGroup (jauges => étape 2).
// Aligné API_BILAN/tuning.js : RADIATIVE.factorTropopause hors bary (pas de baryByGroup.RADIATIVE).
// fillDataTuningFromBary : plus ici. C'est window.TUNING.fillDataTuningFromBary (API_BILAN/tuning.js),
// que main.js et sync_panels.js appelaient déjà — cette page en avait une seconde écriture, avec une
// sémantique périmée : elle lisait baryByGroup.CLOUD_SW / .SCIENCE alors que l'API impose ATM comme
// source unique et force les deux autres à sa valeur (tuning.js v1.0.13). Tant que les trois barycentres
// sont d'accord les deux versions donnent le même résultat au chiffre près ; dès qu'ils divergent —
// et le mini-curseur du panneau visu écrit CLOUD_SW seul — 7 paramètres de CLOUD_SW partaient de travers.
function applyFineTuningBaryGroup(groupKey, percentRaw, refreshPanel) {
    var targets = getFineTuningTargetsByGroup(groupKey);
    setFineTuningBaryPercent(groupKey, percentRaw);
    var bary = getFineTuningBaryPercent(groupKey);
    for (var i = 0; i < targets.length; i++) {
        var target = targets[i];
        setFineTuningValue(target, getFineTuningBaryValue(target, bary));
    }
    if (refreshPanel !== false) displayFineTuning();
}

function applyFineTuningBaryAtmUnified(percentRaw, refreshPanel) {
    applyFineTuningBaryGroup('CLOUD_SW', percentRaw, false);
    applyFineTuningBaryGroup('SCIENCE', percentRaw, false);
    if (refreshPanel !== false) displayFineTuning();
}

function applyFineTuningBaryAll(percentRaw, refreshPanel) {
    applyFineTuningBaryGroup('CLOUD_SW', percentRaw, false);
    applyFineTuningBaryGroup('SCIENCE', percentRaw, false);
    applyFineTuningBaryGroup('SOLVER', percentRaw, false);
    syncSolverConfigFromData();
    if (refreshPanel !== false) displayFineTuning();
}

function applyFineTuningBaryGroupAndRun(groupKey, percentRaw) {
    if (groupKey === 'ATM' || groupKey === 'CLOUD_SW' || groupKey === 'SCIENCE') {
        applyFineTuningBaryAtmUnified(percentRaw, true);
    } else {
        applyFineTuningBaryGroup(groupKey, percentRaw, true);
    }
    if (window !== window.top) {
        var T = window.DATA['🎚️'];
        console.log('[DBG scie] fine-tuning play clicked group=' + groupKey + ' percentRaw=' + percentRaw + ' bary.CLOUD_SW=' + T.baryByGroup.CLOUD_SW + ' SCIENCE=' + T.baryByGroup.SCIENCE);
        if (typeof window.pd === 'function') window.pd('applyFineTuningBaryGroupAndRun', 'scie_compute.html', 'group=' + groupKey + ' percentRaw=' + percentRaw + ' bary.CLOUD_SW=' + T.baryByGroup.CLOUD_SW + ' SCIENCE=' + T.baryByGroup.SCIENCE);
    window.parent.postMessage({
        type: 'sync:tuning',
        payload: {
            baryByGroup: { ATM: T.baryByGroup.ATM, CLOUD_SW: T.baryByGroup.ATM, SCIENCE: T.baryByGroup.ATM, SOLVER: T.baryByGroup.SOLVER, HYSTERESIS: T.baryByGroup.HYSTERESIS },
            CLOUD_SW: T.CLOUD_SW,
            SOLVER: T.SOLVER,
            updates: [],
            run: true
        }
    }, '*');
        return;
    }
    window.runTest();
}

function syncTuningToParent(runFlag) {
    if (window === window.top) return;
    var T = window.DATA['🎚️'];
    window.parent.postMessage({
        type: 'sync:tuning',
        payload: {
            baryByGroup: {
                ATM: T.baryByGroup.ATM,
                CLOUD_SW: T.baryByGroup.ATM,
                SCIENCE: T.baryByGroup.ATM,
                SOLVER: T.baryByGroup.SOLVER,
                HYSTERESIS: T.baryByGroup.HYSTERESIS
            },
            CLOUD_SW: T.CLOUD_SW,
            SOLVER: T.SOLVER,
            updates: [],
            run: runFlag === true
        }
    }, '*');
}

function onFineTuningBaryInput(groupKey, percentRaw) {
    if (groupKey === 'ATM' || groupKey === 'CLOUD_SW' || groupKey === 'SCIENCE') {
        applyFineTuningBaryAtmUnified(percentRaw, false);
        var rounded = Math.round(Number(percentRaw));
        var valueHeaderAtm = document.getElementById('fine-tuning-bary-value-ATM-header');
        valueHeaderAtm.textContent = rounded + '%';
        var valueCloud = document.getElementById('fine-tuning-bary-value-CLOUD_SW');
        valueCloud.textContent = rounded + '%';
        var valueScience = document.getElementById('fine-tuning-bary-value-SCIENCE');
        valueScience.textContent = rounded + '%';
        syncTuningToParent(false);
        return;
    }
    setFineTuningBaryPercent(groupKey, percentRaw);
    // Important: ne pas re-render le panneau pendant le drag, sinon le slider est recréé et le glissement s'arrête.
    applyFineTuningBaryGroup(groupKey, percentRaw, false);
    var valueEl = document.getElementById('fine-tuning-bary-value-' + groupKey);
    if (valueEl) valueEl.textContent = Math.round(Number(percentRaw)) + '%';
    var valueHeaderEl = document.getElementById('fine-tuning-bary-value-' + groupKey + '-header');
    if (valueHeaderEl) valueHeaderEl.textContent = Math.round(Number(percentRaw)) + '%';
    syncTuningToParent(false);
}

// Désactiver le clic sur la bande des jauges fine tuning / solveur : seul le glissement du bouton bleu change la valeur
document.addEventListener('mousedown', function (e) {
    var el = e.target;
    if (el.type !== 'range' || !el.id || el.id.indexOf('fine-tuning-bary-slider') !== 0) return;
    var r = el.getBoundingClientRect();
    var min = parseFloat(el.min) || 0;
    var max = parseFloat(el.max) || 100;
    var val = parseFloat(el.value) || min;
    var pct = (max > min) ? (val - min) / (max - min) : 0;
    var thumbX = r.left + pct * r.width;
    if (Math.abs(e.clientX - thumbX) > 15) e.preventDefault();
}, true);

function getInitRadiatifMetrics() {
    const trace = window.getConvergenceTrace ? window.getConvergenceTrace() : [];
    const init = trace.length > 0 ? trace[0] : null;
    if (!init) return { T_init_C: NaN, delta_init: NaN };
    const T_init = Number.isFinite(init.temperature_C) ? init.temperature_C : NaN;
    const delta_init = Number.isFinite(init.delta_equilibre) ? init.delta_equilibre : NaN;
    return { T_init_C: T_init, delta_init: delta_init };
}

async function runSingleFineTuningCompute() {
    initializeGlobals();
    const DATA = window.DATA;
    DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'];
    if (!window.CONVERGE.initForConfig()) throw new Error('initForConfig a échoué');
    DATA['🧮']['previous'] = [];
    DATA['🧮']['🧮🔄🌊'] = 0;
    DATA['🧮']['🧮🔄🪩'] = 0;
    const result = await window.CONVERGE.computeRadiativeTransfer();
    displayResults(result);
    displayConvergence();
    return result;
}

async function runFineTuningTrials() {
    const targets = getFineTuningTargets();
    setRunStopButtonRunning(true);
    const originalValues = {};
    targets.forEach(function (target) {
        originalValues[target.group + '.' + target.key] = window.DATA['🎚️'][target.group][target.key];
    });
    const DATA = window.DATA;
    const animWasEnabled = DATA['🔘']['🔘🎞'] === true;
    DATA['🔘']['🔘🎞'] = false;
    const animToggle = document.getElementById('anim-toggle');
    if (animToggle) animToggle.classList.remove('selected');
    const animCheckbox = document.getElementById('plot-anim-toggle-checkbox');
    if (animCheckbox) animCheckbox.checked = false;
    window.FINE_TUNING_TRIALS = [];
    try {
        for (let t = 0; t < targets.length; t++) {
            const target = targets[t];
            const trials = getFineTuningThreeValues(target);
            for (let i = 0; i < trials.length; i++) {
                const trial = trials[i];
                setFineTuningValue(target, trial.value);
                await runSingleFineTuningCompute();
                const initMetrics = getInitRadiatifMetrics();
                const DATA = window.DATA;
                const T_final_K = (DATA && DATA['🧮' ] && DATA['🧮']['🧮🌡️'] != null) ? Number(DATA['🧮']['🧮🌡️']) : NaN;
                const T_final_C = Number.isFinite(T_final_K) ? T_final_K - 273.15 : NaN;
                window.FINE_TUNING_TRIALS.push({
                    label: trial.label,
                    param_group: target.group,
                    param_key: target.key,
                    param_value: trial.value,
                    min: target.min,
                    max: target.max,
                    note: target.note || '',
                    T_init_C: initMetrics.T_init_C,
                    delta_init: initMetrics.delta_init,
                    T_final_C: T_final_C
                });
                console.log('[fine-tuning trial]'
                    + ' ' + trial.label
                    + ' ' + target.group + '.' + target.key + '=' + formatTuningValue(trial.value)
                    + ' | Init: T=' + (Number.isFinite(initMetrics.T_init_C) ? initMetrics.T_init_C.toFixed(1) : 'n/a') + '°C'
                    + ', 🔺🧲=' + (Number.isFinite(initMetrics.delta_init) ? initMetrics.delta_init.toFixed(3) : 'n/a')
                    + ' | Final: T=' + (Number.isFinite(T_final_C) ? T_final_C.toFixed(1) : 'n/a') + '°C');
            }
        }
    } catch (err) {
        console.error('❌ Fine-tuning trials:', err);
    } finally {
        DATA['🔘']['🔘🎞'] = animWasEnabled;
        if (animToggle) {
            if (animWasEnabled) animToggle.classList.add('selected');
            else animToggle.classList.remove('selected');
        }
        if (animCheckbox) animCheckbox.checked = animWasEnabled;
        targets.forEach(function (target) {
            const k = target.group + '.' + target.key;
            setFineTuningValue(target, originalValues[k]);
        });
        setRunStopButtonRunning(false);
        displayFineTuning();
    }
}

// Mise à jour des seules jauges DOM depuis DATA (pas de innerHTML) — sync parent↔scie sans clignotement.
function syncFineTuningSlidersFromBary() {
    var bg = window.DATA && window.DATA['🎚️'] && window.DATA['🎚️'].baryByGroup;
    if (!bg) return false;
    var groups = ['CLOUD_SW', 'SCIENCE', 'SOLVER'];
    var updated = false;
    for (var gi = 0; gi < groups.length; gi++) {
        var gk = groups[gi];
        var raw = Number(bg[gk]);
        var v = Number.isFinite(raw) ? Math.max(0, Math.min(100, Math.round(raw))) : 100;
        var el = document.getElementById('fine-tuning-bary-slider-' + gk);
        if (el) {
            el.value = String(v);
            updated = true;
        }
        var span = document.getElementById('fine-tuning-bary-value-' + gk);
        if (span) span.textContent = v + '%';
    }
    var hEl = document.getElementById('fine-tuning-bary-slider-ATM-header');
    if (hEl) {
        var atm = getFineTuningUnifiedAtmBaryPercent();
        hEl.value = String(atm);
        updated = true;
        var hSpan = document.getElementById('fine-tuning-bary-value-ATM-header');
        if (hSpan) hSpan.textContent = atm + '%';
    }
    return updated;
}

function toggleFineTuning() {
    const content = document.getElementById('fine-tuning-content');
    const btn = document.getElementById('fine-tuning-toggle');
    if (!content || !btn) return;
    const isOpen = content.style.display !== 'none';
    content.style.display = isOpen ? 'none' : 'block';
    btn.textContent = isOpen ? '+' : '−';
}

function displayFineTuning() {
    const tuningDiv = document.getElementById('fine-tuning');
    const tuningContent = document.getElementById('fine-tuning-content');
    if (!tuningDiv || !tuningContent) return;
    applyFineTuningBaryGroup('CLOUD_SW', getFineTuningBaryPercent('CLOUD_SW'), false);
    applyFineTuningBaryGroup('SCIENCE', getFineTuningBaryPercent('SCIENCE'), false);
    applyFineTuningBaryGroup('SOLVER', getFineTuningBaryPercent('SOLVER'), false);
    const atmBary = getFineTuningUnifiedAtmBaryPercent();
    const fineTitle = tuningDiv.querySelector('h2');
    if (fineTitle) {
        fineTitle.style.display = 'flex';
        fineTitle.style.alignItems = 'center';
        fineTitle.style.justifyContent = 'flex-start';
        fineTitle.style.flexWrap = 'wrap';
        fineTitle.style.gap = '8px';
        // Conserver l'état du bouton plie/déplie (ne pas l'écraser)
        const toggleBtn = document.getElementById('fine-tuning-toggle');
        const isOpen = tuningContent.style.display !== 'none';
        fineTitle.innerHTML = `🧩 Fine-tuning 🪩
            <span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;" title="Même % pour CLOUD_SW (☁️) et SCIENCE (🔬)">🔺☁️🔬
                <input id="fine-tuning-bary-slider-ATM-header" type="range" min="0" max="100" step="1" value="${atmBary.toFixed(0)}" oninput="onFineTuningBaryInput('ATM', this.value); var v=document.getElementById('fine-tuning-bary-value-ATM-header'); if(v) v.textContent=this.value + '%';">
                <span id="fine-tuning-bary-value-ATM-header">${atmBary.toFixed(0)}%</span>
                <button class="toggle-button" onclick="applyFineTuningBaryGroupAndRun('ATM', document.getElementById('fine-tuning-bary-slider-ATM-header').value); return false;">▶️</button>🔻
            </span>
            <button class="toggle-button" id="fine-tuning-toggle" onclick="toggleFineTuning()" style="margin-left:auto">${isOpen ? '−' : '+'}</button>`;
    }

    let html = '';
    html += renderMergedCategory('CLOUD_SW', 'CLOUD_SW', '☁️', false);
    html += renderMergedCategory('SCIENCE', 'Science', '🔬', true);
    html += renderMergedCategory('SOLVER', 'Solveur', '🧮', true);

    tuningContent.innerHTML = html;
    tuningDiv.style.display = 'block';
    // Ne pas toucher à tuningContent.style.display — respecter l'état plié/déplié actuel
}
