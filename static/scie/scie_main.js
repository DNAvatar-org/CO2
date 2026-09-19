// File: CO2/static/scie/scie_main.js - Démarrage de la page et pont postMessage
// Desc: Le DÉMARRAGE, en dernier : j'écoute les messages de la page parente, j'envoie le tuning initial et je
//       monte la page au DOMContentLoaded. Tout ce dont j'ai besoin est défini par les fichiers ci-dessus.
// Version 1.0.1
// Date: [September 19, 2026]
// logs :
//   - v1.0.1: les 3 appels passent par window.TUNING.fillDataTuningFromBary (API) — la copie locale
//     de scie_tuning_view.js est supprimée.
//   - v1.0.0: extraction depuis le <script> en ligne de CO2/html/scie_compute.html (1810 lignes d'un bloc).
//     Découpage par responsabilité, à code IDENTIQUE : seule l'indentation change. Les fichiers restent des
//     scripts classiques chargés dans l'ordre des dépendances — la page garde son chargement synchrone.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.


window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'resize-iframe') {
        const iframe = event.data.source === 'alphabet' 
            ? document.getElementById('alphabet-iframe')
            : document.getElementById('dico-iframe');
        if (iframe && event.data.height) {
            iframe.style.height = event.data.height + 'px';
        }
    }
    if (event.data && event.data.type === 'sync:state') {
        const p = event.data.payload;
        if (!p) return;
        if (p.epochId !== undefined) {
            const epochIndex = window.TIMELINE ? window.TIMELINE.findIndex(item => item['📅'] === p.epochId) : -1;
            if (epochIndex >= 0 && window.DATA) {
                if (!window.DATA['📜']) window.DATA['📜'] = {};
                window.DATA['📅'] = window.TIMELINE[epochIndex];
                window.DATA['📜']['👉'] = epochIndex;
                window.DATA['📜']['🗿'] = p.epochId;
                document.querySelectorAll('.epoch-btn-horizontal').forEach(btn => {
                    btn.classList.toggle('selected', btn.getAttribute('data-epoch') === p.epochId);
                });
                updateEpochActions();
                updateTimelineDisplay();
            }
        }
        if (p.animEnabled !== undefined) {
            const animBtn = document.getElementById('anim-toggle');
            if (animBtn) animBtn.classList.toggle('selected', p.animEnabled);
            let cb = document.getElementById('plot-anim-toggle-checkbox');
            if (!cb) {
                cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.id = 'plot-anim-toggle-checkbox';
                cb.style.display = 'none';
                document.body.appendChild(cb);
            }
            cb.checked = p.animEnabled;
            if (window.DATA && window.DATA['🔘']) window.DATA['🔘']['🔘🎞'] = p.animEnabled;
        }
        if (p.ticTime !== undefined && window.DATA && window.DATA['📜']) {
            window.DATA['📜']['📿💫'] = p.ticTime;
            updateTimelineDisplay();
        }
    }
    if (event.data && event.data.type === 'compute:done') {
        var DATA = event.data.DATA;
        if (DATA && window !== window.top) {
            Object.keys(DATA).forEach(function (k) { window.DATA[k] = DATA[k]; });
            // Ne pas réinitialiser baryByGroup.SOLVER : conserver le réglage utilisateur (ex. 100%)
            window.TUNING.fillDataTuningFromBary();
            displayResults(window.DATA);
            displayConvergence();
        }
    }
    if (event.data && event.data.type === 'convergence:clear') {
        clearConvergenceTrace();
    }
    if (event.data && event.data.type === 'convergence:append') {
        var step = event.data.step;
        if (step) appendConvergenceStep(step);
    }
    if (event.data && event.data.type === 'convergence:restore') {
        var stepsHtml = event.data.stepsHtml;
        if (Array.isArray(stepsHtml) && stepsHtml.length > 0) {
            clearConvergenceTrace();
            var stepsEl = document.getElementById('convergence-steps');
            if (stepsEl) stepsHtml.forEach(function (html) { stepsEl.insertAdjacentHTML('beforeend', html); });
            displayConvergence();
        }
    }
    if (event.data && event.data.type === 'sync:tuning') {
        var p = event.data.payload;
        if (!p || !p.baryByGroup) return;
        var bg = window.DATA['🎚️'].baryByGroup;
        bg.ATM = p.baryByGroup.ATM;
        bg.CLOUD_SW = bg.ATM;
        bg.SCIENCE = bg.ATM;
        if (p.baryByGroup.SOLVER !== undefined) bg.SOLVER = p.baryByGroup.SOLVER;
        window.TUNING.fillDataTuningFromBary();
        if (!syncFineTuningSlidersFromBary()) {
            displayFineTuning();
        }
    }
});

// Au first load : appliquer 100 % (nominal), rafraîchir l’affichage, puis envoyer au parent.
function sendInitialTuningToParent() {
    window.TUNING.fillDataTuningFromBary();
    if (window.parent === window) return;
    var T = window.DATA['🎚️'];
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
}

// Initialiser au chargement
window.addEventListener('DOMContentLoaded', function() {
    // Les contenus Alphabet et Dico sont maintenant chargés via iframe (alphabet.html et dico.html)
    console.log('📄 Page de test chargée');
    console.log('🔧 Initialisation des variables globales...');
    
    // S'assurer que TIMELINE est chargée
    if (window.TIMELINE) {
        console.log('✅ Timeline chargée: ' + window.TIMELINE.length + ' époques');
        // Générer la timeline horizontale
        generateHorizontalTimeline();
    } else {
        console.error('❌ Timeline non chargée');
    }
    // Tuning 100 % vers parent pour 1er compute (16.4°C) sans clic
    sendInitialTuningToParent();
});
