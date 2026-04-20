// ============================================================================
// File: FPS.js - Graphique de performance FPS et mémoire
// Desc: En français, dans l'architecture, je suis le module de visualisation FPS
// Version 1.2.3
// Date: [March 08, 2026]
// logs :
// - v1.2.0 : remplacement courbe Précision par Mémoire Mo (performance.memory, Chromium) ; retrait getPrecisionFactorFromFPS
// - v1.2.1 : yaxis2.range adaptatif (max mémoire) pour que la courbe RAM soit visible et défile avec les FPS
// - v1.2.2 : label "Mo (heap onglet)" — on n'a pas accès à la RAM libre/totale machine, seulement heap JS de l'onglet (Chromium)
// - v1.2.3 : trace "limite heap" (jsHeapSizeLimit) + annotation valeur en orange (ex. "33 Go") ; "0 (indisponible)" si pas performance.memory
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// ============================================================================

// Historique des valeurs (pour les courbes)
const fpsHistory = [];
const memoryHistory = []; // Mémoire JS heap en Mo (Chromium seulement via performance.memory)
const MAX_HISTORY = 100;
const X_SECONDS_PER_POINT = 1.0; // En mode timer : 1 point = 1 s ; X en float (secondes)

// Durée minimale par pixel (en secondes)
const PIXEL_DURATION = 0.1; // 100ms par pixel (10 pixels par seconde à 60 FPS)

// Seuils FPS
const FPSalert = 25;  // Seuil d'alerte (FPS bas) — courbe toujours affichée
const FPSmin = 20;     // FPS minimum acceptable
const FPSmax = 55;     // FPS maximum (bonne performance)

window.UI_STATE.FPSalert = FPSalert;
window.FPSmin = FPSmin;

// Variables pour le système de ping
let t0 = null; // Temps du ping précédent (sera réinitialisé quand le ping arrive)
let currentFPS = 0; // FPS actuel calculé depuis dt

// Buffer pour accumuler les valeurs avant d'afficher un pixel
let fpsBuffer = [];
let memoryBuffer = []; // Buffer des valeurs mémoire (Mo)
let accumulatedTime = 0;

// État du système de timer d'une seconde
let timerActive = true; // Le timer d'une seconde est actif par défaut
let timerId = null; // ID du timer pour pouvoir l'arrêter

// Initialiser le graphique Plotly
function initFPSChart() {
    const chartDiv = document.getElementById('fps-chart');
    if (!chartDiv) {
        return;
    }
    
    // Vérifier si le graphique est déjà initialisé (vérifier si Plotly a créé des éléments)
    if (chartDiv.querySelector('.plotly')) {
        // Redimensionner au cas où
        Plotly.Plots.resize('fps-chart');
        return;
    }
    
    const layout = {
        autosize: true,
        margin: { l: 42, r: 42, t: 8, b: 8 },
        paper_bgcolor: 'rgba(0,0,0,0.9)',
        plot_bgcolor: 'rgba(0,0,0,0.9)',
        xaxis: {
            range: [0, MAX_HISTORY * X_SECONDS_PER_POINT],
            showgrid: true,
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            showticklabels: false,
            zeroline: false,
            dtick: 0.5,
            fixedrange: true
        },
        yaxis: {
            range: [0, 80],
            showgrid: true,
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            tickfont: { color: 'white', size: 10 },
            title: { text: '', font: { color: 'white', size: 11 } },
            side: 'left',
            fixedrange: true
        },
        yaxis2: {
            type: 'linear',
            range: [0, 2000],
            overlaying: 'y',
            side: 'right',
            showgrid: false,
            tickfont: { color: '#44aaff', size: 9 },
            title: { text: '', font: { color: '#44aaff', size: 10 } },
            tickmode: 'array',
            tickvals: [0, 500, 1000, 1500, 2000],
            ticktext: ['0', '500', '1G', '1.5G', '2G']
        },
        annotations: [
            {
                text: 'FPS',
                xref: 'paper',
                yref: 'paper',
                x: 0.02,
                y: 0.98,
                xanchor: 'left',
                yanchor: 'top',
                font: { color: 'white', size: 12 },
                showarrow: false
            },
            {
                text: 'Mo (heap onglet)',
                xref: 'paper',
                yref: 'paper',
                x: 0.98,
                y: 0.5,
                xanchor: 'right',
                yanchor: 'middle',
                textangle: -90,
                font: { color: '#44aaff', size: 11 },
                showarrow: false
            },
            {
                text: '',
                xref: 'x',
                yref: 'y2',
                x: 0,
                y: 0,
                xanchor: 'left',
                yanchor: 'middle',
                font: { color: 'rgba(255, 165, 0, 1)', size: 10 },
                showarrow: false
            }
        ],
        showlegend: false,
        hovermode: false
    };
    
    // Traces : 0=Heap JS (onglet), 1=limite heap (frontière au-delà de laquelle le navigateur peut mettre en pause / crasher)
    const traces = [
        {
            x: [],
            y: [],
            type: 'scatter',
            mode: 'lines',
            name: 'Heap JS (onglet)',
            line: { color: '#44aaff', width: 1.5 },
            yaxis: 'y2'
        },
        {
            x: [0, MAX_HISTORY * X_SECONDS_PER_POINT],
            y: [0, 0],
            type: 'scatter',
            mode: 'lines',
            name: 'limite heap',
            line: { color: 'rgba(255, 165, 0, 0.8)', width: 1, dash: 'dash' },
            yaxis: 'y2',
            showlegend: false,
            hoverinfo: 'name+y'
        },
        {
            x: [0, MAX_HISTORY * X_SECONDS_PER_POINT],
            y: [FPSmin, FPSmin],
            type: 'scatter',
            mode: 'lines',
            name: 'FPSmin',
            line: { color: 'rgba(255, 0, 0, 0.3)', width: 1, dash: 'dash' },
            yaxis: 'y',
            showlegend: false,
            hoverinfo: 'skip'
        },
        {
            x: [0, MAX_HISTORY * X_SECONDS_PER_POINT],
            y: [FPSalert, FPSalert],
            type: 'scatter',
            mode: 'lines',
            name: 'FPSalert',
            line: { color: 'rgba(255, 0, 0, 0.5)', width: 1, dash: 'dot' },
            yaxis: 'y',
            showlegend: false,
            hoverinfo: 'skip'
        },
        {
            x: [0, MAX_HISTORY * X_SECONDS_PER_POINT],
            y: [FPSmax, FPSmax],
            type: 'scatter',
            mode: 'lines',
            name: 'FPSmax',
            line: { color: 'rgba(0, 255, 0, 0.3)', width: 1, dash: 'dash' },
            yaxis: 'y',
            showlegend: false,
            hoverinfo: 'skip'
        },
        {
            x: [],
            y: [],
            type: 'scatter',
            mode: 'lines',
            name: 'FPS',
            line: { color: 'white', width: 1 }, // Blanc fin, au-dessus (trace en dernier, dessinée après toutes les autres)
            yaxis: 'y'
        }
    ];
    
    Plotly.newPlot('fps-chart', traces, layout, {
        displayModeBar: false,
        staticPlot: true
    });
}

// Mettre à jour le graphique avec les nouvelles valeurs
// memMB : mémoire JS heap en Mo (performance.memory.usedJSHeapSize / 1e6, Chromium seulement)
function updateFPSChart(fps, memMB) {
    const chartDiv = document.getElementById('fps-chart');
    if (!chartDiv) return;
    
    fpsHistory.push(fps);
    memoryHistory.push(memMB);
    
    if (fpsHistory.length > MAX_HISTORY) {
        fpsHistory.shift();
        memoryHistory.shift();
    }
    
    // X en float (secondes) : 1 point = 1 s en mode timer
    const xData = Array.from({ length: fpsHistory.length }, (_, i) => (i + 0) * X_SECONDS_PER_POINT);
    const xDataFPS = Array.from({ length: fpsHistory.length }, (_, i) => (i + 0.1) * X_SECONDS_PER_POINT);
    
    // Mettre à jour les traces (Mémoire trace 0, FPS trace 4 pour qu'elle soit au-dessus)
    const xMax = fpsHistory.length === 0 ? 10 : Math.max(fpsHistory.length * X_SECONDS_PER_POINT, 5);
    const maxMem = memoryHistory.length ? Math.max.apply(null, memoryHistory) : 0;
    const limitMo = performance.memory ? performance.memory.jsHeapSizeLimit / 1e6 : 0;
    const y2Max = Math.max(100, Math.ceil((maxMem || 50) * 1.2), limitMo ? Math.ceil(limitMo * 1.05) : 0);
    const limitLabel = limitMo >= 1024
        ? (limitMo / 1024).toFixed(1) + ' Go'
        : limitMo > 0
            ? Math.round(limitMo) + ' Mo'
            : '0 (indisponible)';

    Plotly.restyle('fps-chart', {
        x: [xData],
        y: [memoryHistory]
    }, [0]);
    Plotly.restyle('fps-chart', {
        x: [[0, xMax]],
        y: [[limitMo || 0, limitMo || 0]]
    }, [1]);
    Plotly.restyle('fps-chart', {
        x: [xDataFPS],
        y: [fpsHistory]
    }, [5]);

    Plotly.relayout('fps-chart', {
        'xaxis.range': [0, xMax],
        'yaxis2.range': [0, y2Max],
        'annotations[2].text': limitLabel,
        'annotations[2].x': xMax,
        'annotations[2].y': limitMo || 0,
        'annotations[2].xanchor': 'right'
    });
    Plotly.restyle('fps-chart', { x: [[0, xMax], [0, xMax], [0, xMax]] }, [2, 3, 4]);
}

// Arrêter le timer d'une seconde quand le système de ping est utilisé
function stopTimer() {
    if (timerActive) {
        timerActive = false;
        // Désactiver le timer dans main.js
        if (typeof window !== 'undefined' && window.fpsTimerActive !== undefined) {
            window.fpsTimerActive = false;
        }
    }
}

// Réactiver le timer d'une seconde (si nécessaire)
function startTimer() {
    if (!timerActive) {
        timerActive = true;
        // Réactiver le timer dans main.js
        if (typeof window !== 'undefined' && window.fpsTimerActive !== undefined) {
            window.fpsTimerActive = true;
            // Relancer updateFPS si nécessaire
            if (typeof window !== 'undefined' && window.requestAnimationFrame) {
                window.requestAnimationFrame(window.updateFPS);
            }
        }
    }
}

// Fonction ping : appelée à chaque frame pour enregistrer le temps
// Usage : 
//   const t1 = performance.now() / 1000; // en secondes
//   if (t0 !== null) {
//       const dt = t1 - t0;
//       window.fpsPing(dt);
//   }
//   t0 = t1;
// 
// dt = temps écoulé depuis le dernier ping (en secondes)
function ping(dt) {
    if (dt <= 0 || !isFinite(dt) || dt > 1.0) return; // Ignorer les valeurs invalides (dt > 1s = < 1 FPS)
    
    // Arrêter le timer d'une seconde si ce n'est pas déjà fait
    if (timerActive) {
        stopTimer();
        // Réinitialiser t0 pour que le prochain ping soit propre
        t0 = null;
    }
    
    // Calculer FPS = 1/dt
    const fps = 1.0 / dt;
    currentFPS = fps;
    
    // Exposer le FPS globalement pour l'optimisation
    if (typeof window !== 'undefined') {
        window.RUNTIME_STATE.fps = fps;
    }
    
    // 🔒 Déterminer le niveau de performance FPS (pour événement uniquement)
    let fpsLevel = 'warning';
    if (fps > 60) fpsLevel = 'ultra';
    else if (fps > 30) fpsLevel = 'rapide';
    else if (fps > 20) fpsLevel = 'lent';
    else if (fps > 10) fpsLevel = 'aïe';

    // performance.memory : heap JS de cet onglet uniquement (Chromium). Pas d'accès RAM libre/totale machine.
    const memMB = performance.memory ? performance.memory.usedJSHeapSize / 1e6 : 0;

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        const fpsEvent = new CustomEvent('fpsLevelChanged', {
            detail: { fps: fps, level: fpsLevel }
        });
        window.dispatchEvent(fpsEvent);
    }

    fpsBuffer.push(fps);
    memoryBuffer.push(memMB);
    accumulatedTime += dt;
    
    if (accumulatedTime >= PIXEL_DURATION) {
        const avgFPS = fpsBuffer.reduce((a, b) => a + b, 0) / fpsBuffer.length;
        const avgMem = memoryBuffer.reduce((a, b) => a + b, 0) / memoryBuffer.length;
        updateFPSChart(avgFPS, avgMem);
        fpsBuffer = [];
        memoryBuffer = [];
        accumulatedTime = 0;
    }
}

// Fonction principale appelée depuis main.js
function updateFPSDisplay(fps) {
    const memMB = performance.memory ? performance.memory.usedJSHeapSize / 1e6 : 0;
    updateFPSChart(fps, memMB);
    
    let fpsLevel = 'warning';
    if (fps > 60) fpsLevel = 'ultra';
    else if (fps > 30) fpsLevel = 'rapide';
    else if (fps > 20) fpsLevel = 'lent';
    else if (fps > 10) fpsLevel = 'aïe';
    
    window.dispatchEvent(new CustomEvent('fpsLevelChanged', {
        detail: { fps: fps, level: fpsLevel }
    }));
}

// Fonction pour rétracter/étendre la fenêtre FPS
function toggleFPSDisplay() {
    const fpsDisplay = document.getElementById('fps-display');
    if (fpsDisplay) {
        const wasCollapsed = fpsDisplay.classList.contains('collapsed');
        fpsDisplay.classList.toggle('collapsed');
        
        // Redimensionner le graphique après le changement d'état
        setTimeout(function() {
            const chartDiv = document.getElementById('fps-chart');
            if (chartDiv) {
                if (!chartDiv.querySelector('.plotly')) {
                    // Le graphique n'est pas encore initialisé, l'initialiser
                    initFPSChart();
                }
                // Toujours redimensionner pour prendre toute la hauteur disponible
                Plotly.Plots.resize('fps-chart');
            }
        }, 200); // Délai pour laisser le CSS s'appliquer et la transition se terminer (0.3s)
    }
}

// Initialiser le graphique quand le DOM est prêt
if (typeof window !== 'undefined') {
    function initFPS() {
        // Toujours initialiser le graphique, même si collapsed (il sera caché par CSS)
        initFPSChart();
        
        // Ajouter l'événement click sur le bouton toggle
        const toggleBtn = document.getElementById('fps-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleFPSDisplay);
        }
        
        // Si le FPS est ouvert, redimensionner après un court délai
        const fpsDisplay = document.getElementById('fps-display');
        if (fpsDisplay && !fpsDisplay.classList.contains('collapsed')) {
            setTimeout(function() {
                Plotly.Plots.resize('fps-chart');
            }, 200);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFPS);
    } else {
        initFPS(); /* Synchrone : évite que updateFPS (main.js) appelle restyle avant init → crash */
    }
    
    // Exposer les fonctions globalement
    window.updateFPSDisplay = updateFPSDisplay;
    window.fpsPing = ping; // Nouvelle fonction ping
    window.fpsStopTimer = stopTimer; // Fonction pour arrêter le timer
    window.fpsStartTimer = startTimer; // Fonction pour relancer le timer
}

