// ============================================================================
// File: FPS.js - Graphique de performance FPS et précision
// Desc: En français, dans l'architecture, je suis le module de visualisation FPS
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: FPS chart with 2 curves (FPS and precision)
// ============================================================================

// Historique des valeurs (pour les courbes)
const fpsHistory = [];
const precisionHistory = [];
const MAX_HISTORY = 100; // Nombre de points à garder en mémoire

// Seuils de précision
const FPSalert = 25;  // Seuil d'alerte (FPS bas)
const FPSmin = 20;     // FPS minimum acceptable
const FPSmax = 55;     // FPS maximum (bonne performance)

// Initialiser le graphique Plotly
function initFPSChart() {
    const chartDiv = document.getElementById('fps-chart');
    if (!chartDiv) return;
    
    // Configuration initiale du graphique
    const layout = {
        autosize: true,
        margin: { l: 40, r: 20, t: 5, b: 20 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: {
            range: [0, MAX_HISTORY],
            showgrid: true,
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            showticklabels: false,
            zeroline: false
        },
        yaxis: {
            range: [0, 70], // 0 à 70 FPS
            showgrid: true,
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            tickfont: { color: 'white', size: 9 },
            title: {
                text: 'FPS',
                font: { color: 'white', size: 10 }
            },
            side: 'left'
        },
        yaxis2: {
            range: [0, 2.5], // 0 à 2.5x précision
            overlaying: 'y',
            side: 'right',
            showgrid: false,
            tickfont: { color: '#4CAF50', size: 9 },
            title: {
                text: 'Précision',
                font: { color: '#4CAF50', size: 10 }
            }
        },
        showlegend: false,
        hovermode: false
    };
    
    // Traces initiales (vides)
    const traces = [
        {
            x: [],
            y: [],
            type: 'scatter',
            mode: 'lines',
            name: 'FPS',
            line: { color: '#2196F3', width: 2 },
            yaxis: 'y'
        },
        {
            x: [],
            y: [],
            type: 'scatter',
            mode: 'lines',
            name: 'Précision',
            line: { color: '#4CAF50', width: 2 },
            yaxis: 'y2'
        },
        // Barres horizontales pour les seuils FPS
        {
            x: [0, MAX_HISTORY],
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
            x: [0, MAX_HISTORY],
            y: [FPSalert, FPSalert],
            type: 'scatter',
            mode: 'lines',
            name: 'FPSalert',
            line: { color: 'rgba(255, 165, 0, 0.3)', width: 1, dash: 'dash' },
            yaxis: 'y',
            showlegend: false,
            hoverinfo: 'skip'
        },
        {
            x: [0, MAX_HISTORY],
            y: [FPSmax, FPSmax],
            type: 'scatter',
            mode: 'lines',
            name: 'FPSmax',
            line: { color: 'rgba(0, 255, 0, 0.3)', width: 1, dash: 'dash' },
            yaxis: 'y',
            showlegend: false,
            hoverinfo: 'skip'
        }
    ];
    
    Plotly.newPlot('fps-chart', traces, layout, {
        displayModeBar: false,
        staticPlot: true
    });
}

// Mettre à jour le graphique avec les nouvelles valeurs
function updateFPSChart(fps, precision) {
    const chartDiv = document.getElementById('fps-chart');
    if (!chartDiv) return;
    
    // Ajouter les nouvelles valeurs à l'historique
    fpsHistory.push(fps);
    precisionHistory.push(precision);
    
    // Limiter la taille de l'historique
    if (fpsHistory.length > MAX_HISTORY) {
        fpsHistory.shift();
        precisionHistory.shift();
    }
    
    // Créer les tableaux de coordonnées X
    const xData = Array.from({ length: fpsHistory.length }, (_, i) => i);
    
    // Mettre à jour les traces
    Plotly.update('fps-chart', {
        x: [xData, xData],
        y: [fpsHistory, precisionHistory]
    }, {}, [0, 1]); // Mettre à jour seulement les traces 0 (FPS) et 1 (Précision)
}

// Fonction principale appelée depuis main.js
function updateFPSDisplay(fps, precisionFactor) {
    updateFPSChart(fps, precisionFactor);
}

// Initialiser le graphique quand le DOM est prêt
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFPSChart);
    } else {
        initFPSChart();
    }
    
    // Exposer la fonction globalement
    window.updateFPSDisplay = updateFPSDisplay;
}

