// File: CO2/static/scie/scie_results_view.js - Affichage des résultats et de la convergence
// Desc: Les RÉSULTATS : le pas-à-pas de la convergence, le bilan final, les écarts avec le calcul précédent,
//       et les replis/dépliages de chaque bloc.
// Version 1.0.0
// Date: [September 19, 2026]
// logs :
//   - v1.0.0: extraction depuis le <script> en ligne de CO2/html/scie_compute.html (1810 lignes d'un bloc).
//     Découpage par responsabilité, à code IDENTIQUE : seule l'indentation change. Les fichiers restent des
//     scripts classiques chargés dans l'ordre des dépendances — la page garde son chargement synchrone.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.


function displayResults(result) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const configDiv = document.getElementById('config');
    const configContent = document.getElementById('config-content');

    if (!configDiv || !configContent) return;
    
    // Récupérer l'époque et le nom depuis DATA
    const EPOCH = DATA['📅'];
    const epochId = DATA['📜']['🗿'];
    const epochName = window.CHARS_DESC[epochId] || epochId;
    
    // Calculer la date actuelle depuis DATA['📜']['📅'] (source unique — getEpochDateConfig)
    const epochEndD = typeof EPOCH['◀'] === 'number' ? EPOCH['◀'] : null;
    const isForwardD = EPOCH['▶'] != null && epochEndD != null && EPOCH['▶'] < epochEndD;
    const dateYearsD = (DATA['📜'] && DATA['📜']['📅'] != null) ? DATA['📜']['📅'] : null;
    let currentDateStr;
    if (dateYearsD != null) {
        if (isForwardD) {
            currentDateStr = Math.round(dateYearsD) + ' CE';
        } else {
            currentDateStr = (dateYearsD / 1e6).toFixed(0) + ' Ma';
        }
    } else {
        currentDateStr = '?';
    }
    
    // Mettre à jour le titre avec le nom de l'époque et la description
    const configTitle = configDiv.querySelector('h2');
    if (configTitle) {
        const button = configTitle.querySelector('.toggle-button');
        const buttonText = button ? button.textContent : 'Formules +';
        const epochLabel = isForwardD ? Math.round(EPOCH['▶']) : epochName;
        configTitle.innerHTML = `📋 Configuration : ${epochId} ${epochLabel} | 📅: ${currentDateStr} <button class="toggle-button" onclick="toggleConfig()">${buttonText}</button>`;
    }
    
    let html = '';
    
    // Config minimale : pas de flux, pas de spectre. 🫧💧🪩🧲 sont dans Convergence (cycle eau + radiatif).
    html += json2html(DATA['🔘'], null, null, null, '🔘');
    html += json2html(DATA['📜'], null, null, null, '📜');
    html += json2html(EPOCH['🕰'], null, null, null, '🕰');
    html += json2html(DATA['⚖️'], null, null, null, '⚖️');
    html += json2html(DATA['🌕'] || {}, null, null, null, '🌕');
    html += json2html(DATA['☀️'] || {}, null, null, null, '☀️');
    // 🎚️ (fine-tuning CLOUD_SW/SOLVER) affiché dans la section dédiée 🧩 — pas dans la config brute

    configContent.innerHTML = html;
    configDiv.style.display = 'block';
    displayFineTuning();
    
    // 🔒 Ne pas appeler displayConvergence() ici pour éviter les boucles infinies
    // displayConvergence() sera appelé séparément si nécessaire
}

// Fonction pour comparer deux objets et retourner seulement les différences
function getDifferences(current, previous) {
    if (!previous) return current; // Première itération : afficher tout
    
    const diff = {};
    for (const key in current) {
        const currentVal = current[key];
        const previousVal = previous[key];
        
        // Comparer les valeurs (tolérance pour les nombres)
        if (typeof currentVal === 'number' && typeof previousVal === 'number') {
            if (Math.abs(currentVal - previousVal) > 0.0001) {
                diff[key] = currentVal;
            }
        } else if (typeof currentVal === 'object' && currentVal !== null && typeof previousVal === 'object' && previousVal !== null) {
            // Objets imbriqués : comparer récursivement
            const nestedDiff = getDifferences(currentVal, previousVal);
            if (Object.keys(nestedDiff).length > 0) {
                diff[key] = nestedDiff;
            }
        } else if (currentVal !== previousVal) {
            // Valeurs différentes
            diff[key] = currentVal;
        }
    }
    return diff;
}

function clearConvergenceTrace() {
    const convergenceContent = document.getElementById('convergence-content');
    if (!convergenceContent) return;
    // Pas d'injection ici : _co2ProfileLog n'est pas encore écrit (timing)
    // → injection au premier appendConvergenceStep()
    convergenceContent.innerHTML = '<div id="convergence-co2-header"></div><div id="convergence-steps"></div><div id="convergence-final"></div>';
}

function appendConvergenceStep(state) {
    // Injection 🏭📊 au premier step (après que getEpochDateConfig a écrit _co2ProfileLog)
    if (!window._co2ProfileLogInjected && window._co2ProfileLog) {
        const headerEl = document.getElementById('convergence-co2-header');
        if (headerEl) {
            headerEl.innerHTML = `<div class="iteration-header" style="color:#8cf;margin-bottom:4px;">${window._co2ProfileLog}</div>`;
            window._co2ProfileLogInjected = true;
        }
    }
    let stepsEl = document.getElementById('convergence-steps');
    if (!stepsEl) {
        clearConvergenceTrace();
        stepsEl = document.getElementById('convergence-steps');
        if (!stepsEl) return;
    }
    stepsEl.insertAdjacentHTML('beforeend', buildStepHtml(state));
}

function displayConvergence() {
    try {
    const DATA = window.DATA;
    const CONST = window.CONST || { KELVIN_TO_CELSIUS: 273.15 };
    const convergenceDiv = document.getElementById('convergence');
    const convergenceContent = document.getElementById('convergence-content');

    if (!convergenceDiv || !convergenceContent) return;
    if (!DATA || !DATA['🧮']) {
        convergenceContent.innerHTML = '<div class="config-value">Aucune donnée de convergence disponible</div>';
        convergenceDiv.style.display = 'block';
        return;
    }
    
    // Mettre à jour le titre avec la température en °C
    const convergenceTitle = convergenceDiv.querySelector('h2');
    if (convergenceTitle) {
        const T_K = DATA['🧮']['🧮🌡️'];
        const temp_C = (T_K != null && Number.isFinite(T_K)) ? (T_K - CONST.KELVIN_TO_CELSIUS).toFixed(3) : '—';
        const formulesButton = convergenceTitle.querySelector('.toggle-formules');
        const formulesButtonText = formulesButton ? formulesButton.textContent : 'Formules +';
        const detailsVisible = convergenceDiv.classList.contains('details-visible');
        const detailsButtonText = detailsVisible ? 'Bilan −' : 'Bilan +';
        const cyclesHidden = convergenceDiv.classList.contains('convergence-cycles-hidden');
        const cyclesButtonText = cyclesHidden ? 'Cycles +' : 'Cycles −';
        convergenceTitle.innerHTML = `⚙ Convergence : ${temp_C}°C <span class="convergence-buttons"><button class="toggle-button toggle-cycles" onclick="toggleCycles(); return false;">${cyclesButtonText}</button><button class="toggle-button toggle-details" onclick="toggleConvergenceDetails(); return false;">${detailsButtonText}</button><button class="toggle-button toggle-formules" onclick="toggleConvergence()">${formulesButtonText}</button></span>`;
    }
    
    if (!document.getElementById('convergence-steps')) convergenceContent.innerHTML = '<div id="convergence-steps"></div><div id="convergence-final"></div>';
    const finalEl = document.getElementById('convergence-final');
    if (!finalEl) return;
    const safeNumTempLast = (v) => { if (v == null) return '—'; const n = Number(v); if (!Number.isFinite(n)) return '—'; return n.toFixed(1); };
    let html = '';
    const breakdown = DATA['📛'];
    if (breakdown) {
        const fmt = (v) => (v != null && Number.isFinite(v)) ? v.toFixed(2) : '—';
        const h2oScale = EARTH.H2O_EDS_SCALE;
        html += '<div class="config-value convergence-breakdown-block" style="margin-top:10px;padding:8px;background:rgba(0,0,0,0.2);border-radius:6px;">';
        html += '<strong>EDS (effet de serre)</strong>: 🧲📛 = ' + fmt(breakdown['🧲📛']) + ' W/m²<br>';
        html += 'Pondération vapeur d\'eau pour l\'EDS : ' + (Number.isFinite(h2oScale) ? h2oScale.toFixed(3) : '—') + '<br>';
        html += '<em>Attribution</em> : part par τ (τ_X/τ_tot) ; overlap H₂O–CO₂ partagé réaliste (Schmidt 2010 « split the difference »).<br>';
        html += '<strong>Répartition (en W/m² retournés par EDS, normalisé, 🍰📛 ∈ [0, 1])</strong>:<br>';
        if (breakdown['🍰📛🏭'] != null && breakdown['🍰📛🏭'] > 0) html += `&nbsp;• CO₂: ${fmt(breakdown['🍰📛🏭'])}<br>`;
        if (breakdown['🍰📛💧'] != null && breakdown['🍰📛💧'] > 0) html += `&nbsp;• H₂O: ${fmt(breakdown['🍰📛💧'])}<br>`;
        if (breakdown['🍰📛🐄'] != null && breakdown['🍰📛🐄'] > 0) html += `&nbsp;• CH₄: ${fmt(breakdown['🍰📛🐄'])}<br>`;
        if (breakdown['🍰📛⛅'] != null) { const nv = breakdown['🍰📛⛅']; const nvStr = (nv != null && Number.isFinite(nv)) ? (nv < 0.01 ? '&lt; 0,01' : nv.toFixed(2)) : '—'; html += `&nbsp;• Nuages (⛅): ${nvStr}<br>`; }
        html += '</div>';
    }
    const T_final_K = DATA['🧮']['🧮🌡️'] != null ? DATA['🧮']['🧮🌡️'] : null;
    const T_final_C = T_final_K != null ? T_final_K - CONST.KELVIN_TO_CELSIUS : null;
    const Tc = safeNumTempLast(T_final_C);
    const Tk = safeNumTempLast(T_final_K);
    html += '<div class="config-value convergence-final-block">';
    html += `<div class="config-value"><strong>🌡️ Température finale: ${Tc}°C (${Tk}K)</strong></div>`;
    const P_atm_val = (DATA['🫧'] && DATA['🫧']['🎈'] != null) ? DATA['🫧']['🎈'] : null;
    html += `<div class="config-value">🎈 Pression au sol: ${(P_atm_val != null && Number.isFinite(P_atm_val)) ? P_atm_val.toFixed(2) + ' atm' : '—'}</div>`;
    const P_atm = DATA['🫧'] && DATA['🫧']['🎈'];
    const T_boil_K = (P_atm != null) ? window.H2O.getBoilingPointKFromPressure(P_atm) : null;
    const TcNum = T_final_C != null ? Number(T_final_C) : null;
    if (P_atm != null && P_atm < 0.01) html += `<div class="config-value">T_ébullition(🎈=${P_atm.toFixed(2)} atm) = — (pas d'atmosphère, liquide impossible)</div>`;
    else if (T_boil_K != null) { const T_boil_C = (T_boil_K - CONST.KELVIN_TO_CELSIUS).toFixed(1); const aboveBoil = Number.isFinite(TcNum) && TcNum > T_boil_K - CONST.KELVIN_TO_CELSIUS; html += `<div class="config-value">T_ébullition(🎈=${P_atm.toFixed(2)} atm) = ${T_boil_C}°C ${aboveBoil ? '→ T finale &gt; T_ébullition (eau bout)' : '→ liquide possible'}</div>`; }
    const stopReason = DATA['🧮']['🧮🛑'];
    const deltaFinal = DATA['🧲'] && DATA['🧲']['🔺🧲'] != null ? Number(DATA['🧲']['🔺🧲']) : NaN;
    const seuilFinal = DATA['🧮'] && DATA['🧮']['🧲🔬'] != null ? Number(DATA['🧮']['🧲🔬']) : null;
    const stopLabels = { converged: 'Convergence |Δ|≤seuil', max_iter: 'Max itérations radiatives', oscillation: 'Oscillation (pas d’équilibre local unique, ex. yoyo T/Δ sur plusieurs attracteurs)', abort: 'Arrêt manuel', crash: 'Crash algo', max_water: 'Max cycles eau' };
    const stopLabel = (stopReason && stopLabels[stopReason]) ? stopLabels[stopReason] : (stopReason || '—');
    const absDelta = Number.isFinite(deltaFinal) ? Math.abs(deltaFinal) : NaN;
    const deltaStr = Number.isFinite(absDelta) ? (absDelta >= 1e3 || (absDelta < 1e-2 && absDelta !== 0) ? absDelta.toExponential(2) : absDelta.toFixed(2) + '') : '—';
    const seuilStr = seuilFinal != null ? (Math.abs(seuilFinal) >= 1e3 || (Math.abs(seuilFinal) < 1e-2 && seuilFinal !== 0) ? seuilFinal.toExponential(2) : seuilFinal.toFixed(2) + '') : '—';
    const stopDetailMaxOrOsc = (Number.isFinite(deltaFinal) && seuilFinal != null) ? ` (|Δ|=${deltaStr} W/m² &gt; seuil ${seuilStr} W/m²)` : '';
    const stopDetail = (stopReason === 'max_iter' || stopReason === 'oscillation') ? stopDetailMaxOrOsc : (stopReason === 'converged' ? ` (|Δ|=${deltaStr} W/m² ≤ ${seuilStr} W/m²)` : '');
    html += `<div class="config-value"><strong>Arrêt:</strong> ${stopLabel}${stopDetail}</div>`;
    html += '</div>';
    finalEl.innerHTML = html;
    convergenceDiv.style.display = 'block';
    if (window.parent !== window) {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                window.parent.postMessage({ type: 'scie:contentUpdated' }, '*');
            });
        });
    }
    return;
    } catch (err) {
        console.error('❌ displayConvergence:', err);
        const convergenceContent = document.getElementById('convergence-content');
        if (convergenceContent) convergenceContent.innerHTML = `<div class="config-value error">Erreur affichage: ${err.message}</div>`;
    }
}

window.CONVERGE.clearConvergenceTrace = clearConvergenceTrace;
window.CONVERGE.appendConvergenceStep = appendConvergenceStep;

// 🔒 Exposer displayConvergence sur window pour que calculations_flux.js puisse l'appeler
window.displayConvergence = displayConvergence;

function toggleConfig() {
    const configDiv = document.getElementById('config');
    const button = configDiv.querySelector('.toggle-button');
    const formuleContainers = configDiv.querySelectorAll('.formule-container');
    
    // Toggle la classe 'replied' pour replier/déplier la section
    const isReplied = configDiv.classList.contains('replied');
    if (isReplied) {
        configDiv.classList.remove('replied');
        button.textContent = 'Formules −';
        // Quand on déplie, afficher les formules si elles existent
        formuleContainers.forEach(container => {
            container.classList.remove('notVisible');
            container.classList.add('visible');
        });
    } else {
        configDiv.classList.add('replied');
        button.textContent = 'Formules +';
        // Quand on replie, cacher les formules
        formuleContainers.forEach(container => {
            container.classList.remove('visible');
            container.classList.add('notVisible');
        });
    }
    notifyParentResize();
}

function notifyParentResize() {
    if (window.parent !== window) {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                window.parent.postMessage({ type: 'scie:contentUpdated' }, '*');
            });
        });
    }
}

function toggleConvergence() {
    const convergenceDiv = document.getElementById('convergence');
    const formulesButton = convergenceDiv.querySelector('h2 .toggle-formules');
    const formuleContainers = convergenceDiv.querySelectorAll('.formule-container');
    
    const isReplied = convergenceDiv.classList.contains('replied');
    if (isReplied) {
        convergenceDiv.classList.remove('replied');
        if (formulesButton) formulesButton.textContent = 'Formules −';
        formuleContainers.forEach(container => {
            container.classList.remove('notVisible');
            container.classList.add('visible');
        });
    } else {
        convergenceDiv.classList.add('replied');
        if (formulesButton) formulesButton.textContent = 'Formules +';
        formuleContainers.forEach(container => {
            container.classList.remove('visible');
            container.classList.add('notVisible');
        });
    }
    notifyParentResize();
}

function toggleConvergenceDetails() {
    const convergenceDiv = document.getElementById('convergence');
    const detailsButton = convergenceDiv.querySelector('h2 .toggle-details');
    const detailsVisible = convergenceDiv.classList.toggle('details-visible');
    if (detailsButton) detailsButton.textContent = detailsVisible ? 'Bilan −' : 'Bilan +';
    notifyParentResize();
}
function toggleCycles() {
    const convergenceDiv = document.getElementById('convergence');
    const btn = convergenceDiv.querySelector('h2 .toggle-cycles');
    const hidden = convergenceDiv.classList.toggle('convergence-cycles-hidden');
    if (btn) btn.textContent = hidden ? 'Cycles +' : 'Cycles −';
    notifyParentResize();
}


function toggleLexique() {
    const lexiqueDiv = document.getElementById('lexique');
    const button = lexiqueDiv.querySelector('.toggle-button');
    if (lexiqueDiv.classList.contains('replied')) {
        lexiqueDiv.classList.remove('replied');
        button.textContent = 'x';
    } else {
        lexiqueDiv.classList.add('replied');
        button.textContent = '+';
    }
}

function toggleSyntaxe() {
    const syntaxeDiv = document.getElementById('syntaxe');
    const button = syntaxeDiv.querySelector('.toggle-button');
    if (syntaxeDiv.classList.contains('replied')) {
        syntaxeDiv.classList.remove('replied');
        button.textContent = 'x';
    } else {
        syntaxeDiv.classList.add('replied');
        button.textContent = '+';
    }
}
