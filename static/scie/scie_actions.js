// File: CO2/static/scie/scie_actions.js - Boutons d'événement de l'époque, init des globals, cycle run/stop
// Desc: Les ACTIONS : les boutons d'événement de l'époque courante (version simplifiée de timeline/events.js,
//       cette page n'ayant pas d'organigramme), l'initialisation des globals avant un calcul, et le bouton
//       qui lance ou interrompt la convergence.
// Version 1.0.0
// Date: [September 19, 2026]
// logs :
//   - v1.0.0: extraction depuis le <script> en ligne de CO2/html/scie_compute.html (1810 lignes d'un bloc).
//     Découpage par responsabilité, à code IDENTIQUE : seule l'indentation change. Les fichiers restent des
//     scripts classiques chargés dans l'ordre des dépendances — la page garde son chargement synchrone.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

// Mettre à jour les événements selon l'époque (version simplifiée de events.js)
function updateEpochActions() {
    const eventsLogos = document.getElementById('timeline-events-logos');
    if (!eventsLogos) return;
    
    eventsLogos.innerHTML = '';
    
    const DATA = window.DATA;
    let EPOCH = DATA['📅'];
    if (!EPOCH && window.DATA && window.DATA['📜'] && window.DATA['📜']['👉'] !== undefined && window.TIMELINE) {
        EPOCH = window.TIMELINE[window.DATA['📜']['👉']];
        if (!DATA['📅']) {
            DATA['📅'] = EPOCH;
        }
    }
    
    if (!EPOCH || !EPOCH['🕰']) return;
    
    // 📱 year-indexed : boutons par tranche d'année (⛽, 🛢, 🛳…)
    // Géologique : bouton >> (💫) ou 🛢 string-key
    const isYearIndexed = EPOCH['🕰'] && Object.keys(EPOCH['🕰']).some(k => !isNaN(Number(k)));

    if (isYearIndexed) {
        // 📅 hors fenêtre [▶,◀] (résidu géologique) → ▶+📿💫×pas, sinon ▶ — même logique que events.js
        const yearKeys = Object.keys(EPOCH['🕰'])
            .filter(k => !isNaN(Number(k)))
            .map(Number)
            .sort((a, b) => a - b);
        const epochStart = (EPOCH['▶'] != null && Number.isFinite(EPOCH['▶'])) ? EPOCH['▶'] : (yearKeys[0] || 2000);
        const epochEnd = (EPOCH['◀'] != null && Number.isFinite(EPOCH['◀'])) ? EPOCH['◀'] : (yearKeys[yearKeys.length - 1] || 2100);
        const winLo = epochStart - 0.5;
        const winHi = epochEnd + 200;
        const rawYr = (DATA['📜']['📅'] != null && Number.isFinite(DATA['📜']['📅'])) ? DATA['📜']['📅'] : epochStart;
        let curYrForBucket = rawYr;
        if (!(curYrForBucket >= winLo && curYrForBucket <= winHi)) {
            const k0 = yearKeys[0];
            const firstActs = (k0 != null) ? (EPOCH['🕰'][k0] || EPOCH['🕰'][String(k0)]) : null;
            const firstCfg = firstActs && typeof firstActs === 'object' ? Object.values(firstActs)[0] : null;
            const stepYr = (firstCfg && typeof firstCfg['🔺⏳'] === 'number') ? firstCfg['🔺⏳'] * 1e6 : 25;
            const tic = (DATA['📜'] && Number.isFinite(DATA['📜']['📿💫'])) ? DATA['📜']['📿💫'] : 0;
            curYrForBucket = epochStart + tic * stepYr;
            if (!(curYrForBucket >= winLo && curYrForBucket <= winHi)) curYrForBucket = epochStart;
        }
        let activeYr = yearKeys[0];
        if (yearKeys.length && Number.isFinite(curYrForBucket)) {
            if (curYrForBucket < yearKeys[0]) {
                activeYr = yearKeys[0];
            } else {
                for (let i = 0; i < yearKeys.length; i++) {
                    const yStart = yearKeys[i];
                    const yEnd = (i + 1 < yearKeys.length) ? yearKeys[i + 1] : Infinity;
                    if (curYrForBucket >= yStart && curYrForBucket < yEnd) {
                        activeYr = yStart;
                        break;
                    }
                }
            }
        }
        const actions = EPOCH['🕰'][activeYr];

        if (actions) {
            for (const [emoji, cfg] of Object.entries(actions)) {
                const co2kg = cfg['🔺⚖️🏭'] || 0;
                const dtYr = (cfg['🔺⏳'] || 0.000025) * 1e6;
                const dtYrDisp = Math.round(dtYr);
                const gtDisp = Math.round(co2kg / 1e12);

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'icon-button btn-events';
                btn.textContent = emoji;
                btn.title = '+' + dtYrDisp + 'ans +' + gtDisp + 'Gt CO2';

                btn.addEventListener('click', () => {
                    const D = window.DATA;
                    // 1. CO₂ : cumul injecté (racine époque + 📜🔺⚖️🏭, getMasses)
                    D['📜']['🔺⚖️🏭'] += co2kg; // cumul lu par getMasses (compute.js v1.0.23)
                    window.CO2.advanceCarbonSinks(dtYr, co2kg); // puits océan + forêts
                    // 2. Temps avance (📿💫 = compteur universel, barycentre + date)
                    D['📜']['📿💫'] = (D['📜']['📿💫'] || 0) + 1;
                    // 3. Physique
                    window.COMPUTE.getEpochDateConfig();
                    window.COMPUTE.getNoyau();
                    // 4. Log
                    const ppmAfter = (D['⚖️'] && D['⚖️']['⚖️🫧'] > 0)
                        ? Math.round((D['⚖️']['⚖️🏭'] * 0.029 / (D['⚖️']['⚖️🫧'] * 0.04401)) * 1e6)
                        : '?';
                    const logMsg = `[${emoji}] +${dtYrDisp}ans +${gtDisp}Gt (${co2kg.toExponential(2)} kg) → ⚖️🏭=${D['⚖️']['⚖️🏭'].toExponential(3)} kg (~${ppmAfter} ppm)`;
                    console.log(logMsg);
                    window._lastCO2ActionLog = logMsg;
                    const logEl = document.getElementById('co2-action-log');
                    if (logEl) logEl.textContent = logMsg;
                    // 5. Affichage + sync
                    updateTimelineDisplay();
                    emitSyncToParent();
                    // 6. Re-render boutons (nouvelle année peut débloquer de nouveaux boutons)
                    updateEpochActions();
                });

                eventsLogos.appendChild(btn);
            }
        }
    } else {
        // Géologique — bouton >> ou 🛢 string-key
        const _ticK = getTicKey(EPOCH);
        const _ctrK = '📿' + _ticK;
        if (EPOCH['🕰'] && EPOCH['🕰']['🌋'] && typeof EPOCH['🕰']['🌋'] === 'object') {
            const dVeil = EPOCH['🕰']['🌋']['🔺🍰⚽'];
            const stepVeil = (dVeil != null && Number.isFinite(Number(dVeil))) ? Number(dVeil) : 0.02;
            const volcBtn = document.createElement('button');
            volcBtn.type = 'button';
            volcBtn.className = 'icon-button btn-events';
            volcBtn.textContent = '🌋';
            volcBtn.title = 'Voile stratosphérique : +' + (stepVeil * 100).toFixed(1) + ' % atténuation SW (cumul 📜🔺🍰⚽)';
            volcBtn.addEventListener('click', () => {
                const D = window.DATA;
                if (!D['📜']) D['📜'] = {};
                D['📜']['🔺🍰⚽'] = Math.min(0.95, (D['📜']['🔺🍰⚽'] || 0) + stepVeil);
                D['📜']['📿💫'] = (D['📜']['📿💫'] || 0) + 1;
                window.COMPUTE.getEpochDateConfig();
                window.COMPUTE.getNoyau();
                updateTimelineDisplay();
                emitSyncToParent();
            });
            eventsLogos.appendChild(volcBtn);
        }
        if (EPOCH['🕰'] && EPOCH['🕰'][_ticK]) {
            const ticBtn = document.createElement('button');
            ticBtn.type = 'button';
            ticBtn.className = 'icon-button btn-events';
            ticBtn.textContent = '>>';
            ticBtn.title = 'Avancer d\'un tic (refroidissement, flux géothermique)';
            ticBtn.addEventListener('click', () => {
                window.DATA['📜'][_ctrK] = (window.DATA['📜'][_ctrK] || 0) + 1;
                window.COMPUTE.getEpochDateConfig();
                window.COMPUTE.getNoyau();
                updateTimelineDisplay();
                emitSyncToParent();
            });
            eventsLogos.appendChild(ticBtn);
        }
    }
    
    // Bouton météorite (☄️) — accumule eau dans 🔺⚖️💧, avance 📿💫
    if (EPOCH['🕰'] && EPOCH['🕰']['☄️']) {
        const meteorBtn = document.createElement('img');
        meteorBtn.src = (window.getLogoImageSrc && window.getLogoImageSrc('☄️')) || getImagePath('fonts/pics/ice_meteorite.png');
        meteorBtn.alt = '';
        meteorBtn.className = 'timeline-event-logo btn-events';
        meteorBtn.title = 'Météorite de glace';
        const mass_kg = EPOCH['🕰']['☄️']['🔺⚖️💧☄️'];
        meteorBtn.addEventListener('click', () => {
            const D = window.DATA;
            // Eau s'accumule directement (survit aux rappels getMasses)
            D['📜']['🔺⚖️💧'] = (D['📜']['🔺⚖️💧'] || 0) + mass_kg;
            // Temps avance (📿💫 = compteur universel)
            D['📜']['📿💫'] = (D['📜']['📿💫'] || 0) + 1;
            // Pourcentage pour affichage (compat)
            const earthTotalWaterKg = window.CONFIG_COMPUTE.earthTotalWaterMassKg;
            if (!D['💧']) D['💧'] = {};
            D['💧']['☄️'] = Math.min(100, ((D['📜']['🔺⚖️💧'] || 0) / earthTotalWaterKg) * 100);
            window.RUNTIME_STATE.h2oTotalFromMeteorites = D['💧']['☄️'];
            // Physique
            window.COMPUTE.getEpochDateConfig();
            window.COMPUTE.getNoyau();
            updateTimelineDisplay();
            emitSyncToParent();
        });
        eventsLogos.appendChild(meteorBtn);
    }
    
    // Bouton impact majeur
    if (EPOCH['🕰'] && EPOCH['🕰']['🎇']) {
        const bigImpactBtn = document.createElement('img');
        bigImpactBtn.src = (window.getLogoImageSrc && window.getLogoImageSrc('🎇')) || getImagePath('fonts/pics/big_impact.png');
        bigImpactBtn.alt = '';
        bigImpactBtn.className = 'timeline-event-logo btn-events';
        bigImpactBtn.title = 'Impact majeur - Crée la lune';
        bigImpactBtn.addEventListener('click', () => {
            selectEpoch(EPOCH['🕰']['🎇']['⏩']);
        });
        eventsLogos.appendChild(bigImpactBtn);
    }
}

// Initialiser les variables globales nécessaires
function initializeGlobals() {
    // Initialiser window.currentEpochIndex depuis le bouton sélectionné
    const selectedBtn = document.querySelector('.epoch-btn-horizontal.selected');
    let epochId = null;
    if (selectedBtn) {
        epochId = selectedBtn.getAttribute('data-epoch');
    } else {
        epochId = '⚫'; // Par défaut : Corps Noir
    }
    
    // Trouver l'index de l'époque dans TIMELINE
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    const epochIndex_final = epochIndex >= 0 ? epochIndex : window.TIMELINE.findIndex(item => item['📅']);
    
    // Initialiser DATA['📅'] avec l'objet epoch complet (source unique de vérité)
    if (!window.DATA['📜']) window.DATA['📜'] = {};
    window.DATA['📅'] = window.TIMELINE[epochIndex_final];
    window.DATA['📜']['👉'] = epochIndex_final;
    window.DATA['📜']['🗿'] = epochId; // Logo de l'époque (emoji), pas la description
    
    
    // Initialiser DATA si nécessaire
    if (!window.DATA['📜']) window.DATA['📜'] = {};
    if (!window.DATA['🔘']) window.DATA['🔘'] = {};
    if (!window.DATA['🧮']) window.DATA['🧮'] = {};
    
    // 🔒 Initialiser previous (historique de convergence) comme tableau vide
    if (!window.DATA['🧮']['previous']) {
        window.DATA['🧮']['previous'] = [];
    }
    
    // Récupérer le bouton animation et son état AVANT d'initialiser DATA
    const animBtn = document.getElementById('anim-toggle');
    const animEnabled = animBtn ? animBtn.classList.contains('selected') : false;
    
    // Initialiser les valeurs dans DATA
    window.DATA['📜']['📿💫'] = 0;
    window.DATA['📜']['🔺⚖️🏭'] = 0; window.DATA['📜']['🌊🔺⚖️🏭'] = 0; window.DATA['📜']['🌳🔺⚖️🏭'] = 0;
    window.DATA['📜']['🔺⚖️💧'] = 0;
    window.DATA['📜']['🔺🍰⚽'] = 0;
    // IMPORTANT: Si animation activée, on NE TOUCHE PAS à DATA['🧮']['🧮🌡️']
    // On garde la température actuelle pour continuité entre époques
    // Note: getEpochDateConfig() sera appelé plus tard et initialisera DATA['📅']['🌡️🧮']
    if (!animEnabled) {
        // Si animation désactivée, on initialisera avec DATA['📅']['🌡️🧮'] après getEpochDateConfig()
        // Pour l'instant, on initialise avec une valeur par défaut si nécessaire
        if (!window.DATA['🧮'] || !window.DATA['🧮']['🧮🌡️'] || window.DATA['🧮']['🧮🌡️'] === 0) {
        const epochIndex = window.DATA['📜'] && window.DATA['📜']['👉'] !== undefined ? window.DATA['📜']['👉'] : 0;
        const EPOCH = window.TIMELINE[epochIndex];
            window.DATA['🧮']['🧮🌡️'] = EPOCH ? EPOCH['🌡️🧮'] : 180.0;
        }
    } else {
        // Si animation activée, on ne touche PAS à DATA['🧮']['🧮🌡️']
        // Elle sera utilisée dans calculateT0() ligne 38 comme T0_base
        if (!window.DATA['🧮'] || !window.DATA['🧮']['🧮🌡️'] || window.DATA['🧮']['🧮🌡️'] === 0) {
            // Seulement si elle n'existe vraiment pas, on l'initialise
            const epochIndex = window.DATA['📜'] && window.DATA['📜']['👉'] !== undefined ? window.DATA['📜']['👉'] : 0;
            const EPOCH = window.TIMELINE[epochIndex];
            window.DATA['🧮']['🧮🌡️'] = EPOCH ? EPOCH['🌡️🧮'] : 180.0;
        }
    }
    
    // Initialiser les états activés
    if (window.COMPUTE && window.COMPUTE.getEnabledStates) {
        window.COMPUTE.getEnabledStates();
    }
    
    // Créer ou mettre à jour plot-anim-toggle-checkbox pour compatibilité avec compute.js
    let plotAnimToggleCheckbox = document.getElementById('plot-anim-toggle-checkbox');
    if (!plotAnimToggleCheckbox) {
        plotAnimToggleCheckbox = document.createElement('input');
        plotAnimToggleCheckbox.type = 'checkbox';
        plotAnimToggleCheckbox.id = 'plot-anim-toggle-checkbox';
        plotAnimToggleCheckbox.style.display = 'none';
        document.body.appendChild(plotAnimToggleCheckbox);
    }
    plotAnimToggleCheckbox.checked = animEnabled;
    
    // Mettre à jour DATA['🔘']['🔘🎞'] avec l'état d'animation
    if (!window.DATA['🔘']) window.DATA['🔘'] = {};
    window.DATA['🔘']['🔘🎞'] = animEnabled;
}

function setRunStopButtonRunning(running) {
    const btn = document.getElementById('run-stop-btn');
    if (!btn) return;
    window.COMPUTE_RUNNING = !!running;
    if (running) {
        btn.textContent = '⏹';
        btn.title = 'Arrêter les calculs';
        btn.classList.add('selected');
    } else {
        btn.textContent = '▶️';
        btn.title = 'Exécuter';
        btn.classList.remove('selected');
    }
}

function toggleRunStop() {
    if (window.COMPUTE_RUNNING) {
        window.ABORT_COMPUTE = true;
        return;
    }
    if (window !== window.top) {
        emitSyncToParent();
        return;
    }
    runTest();
}

async function runTest() {
    setRunStopButtonRunning(true);
    window.ABORT_COMPUTE = false;
    window.CONFIG_INIT_SNAPSHOT = null;
    try {
        initializeGlobals();
        const DATA = window.DATA;
        let result = null;
        const dateConfig = (window.COMPUTE && window.COMPUTE.getEpochDateConfig) ? window.COMPUTE.getEpochDateConfig() : null;
        if (!DATA['🔘']['🔘🎞']) {
            DATA['🧮']['🧮🌡️'] = DATA['📅']['🌡️🧮'];
        }

        // 1. Config dès le debug (sans aucun calcul radiatif)
        if (window.CONVERGE && !window.CONVERGE.initForConfig()) {
            console.error('❌ initForConfig a échoué');
            return;
        }
        displayResults(null);
        if (window.ABORT_COMPUTE) { /* skip */ } else {

        DATA['🧮']['previous'] = [];
        DATA['🧮']['🧮🔄🌊'] = 0;
        DATA['🧮']['🧮🔄🪩'] = 0;

        result = await window.CONVERGE.computeRadiativeTransfer();
        if (window.displayConvergence) window.displayConvergence();

        }

        try {
            if (result !== null) displayResults(result);
            displayConvergence();
        } catch (displayErr) {
            console.error('❌ Affichage après arrêt:', displayErr);
        }
        if (result !== null) {
            console.log('✅ Test terminé avec succès');
        } else {
            console.log('⏹ Calculs arrêtés');
        }
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        document.getElementById('results').style.display = 'block';
        document.getElementById('results-content').innerHTML = `
            <div class="error">
                <strong>Erreur:</strong> ${error.message}
                <pre>${error.stack}</pre>
            </div>
        `;
    } finally {
        setRunStopButtonRunning(false);
    }
}
