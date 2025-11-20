// ============================================================================
// File: FPS.js - Graphique de performance FPS et précision
// Desc: En français, dans l'architecture, je suis le module de visualisation FPS
// Version 1.1.2
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: FPS chart with 2 curves (FPS and precision)
//   - v1.1.0: Système de ping avec dt, échelle logarithmique pour précision
//   - v1.1.1: Fix z-order: FPS curve (white) now drawn above precision curve (grey)
//   - v1.1.2: Shift FPS curve 1px to the right for better visibility
// ============================================================================

// Historique des valeurs (pour les courbes)
const fpsHistory = [];
const precisionHistory = [];
const MAX_HISTORY = 100; // Nombre de points à garder en mémoire
const X_STEP = 10; // Step de 10px en X (chaque pixel = même durée)

// Durée minimale par pixel (en secondes)
// Si stepX = 10px et on veut 1 pixel toutes les 100ms, alors PIXEL_DURATION = 0.1
const PIXEL_DURATION = 0.1; // 100ms par pixel (10 pixels par seconde à 60 FPS)

// Seuils de précision
const FPSalert = 25;  // Seuil d'alerte (FPS bas)
const FPSmin = 20;     // FPS minimum acceptable
const FPSmax = 55;     // FPS maximum (bonne performance)

// Variables pour le système de ping
let t0 = null; // Temps du ping précédent (sera réinitialisé quand le ping arrive)
let currentFPS = 0; // FPS actuel calculé depuis dt

// Buffer pour accumuler les valeurs avant d'afficher un pixel
let fpsBuffer = []; // Buffer des valeurs FPS
let precisionBuffer = []; // Buffer des valeurs précision
let accumulatedTime = 0; // Temps accumulé depuis le dernier pixel

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
    
    // Configuration initiale du graphique
    const layout = {
        autosize: true,
        margin: { l: 15, r: 25, t: 0, b: 0 }, /* Marges réduites : droite et bas à 5px pour que le 0 commence en bas */
        paper_bgcolor: 'rgba(0,0,0,0.9)', // Fond noir
        plot_bgcolor: 'rgba(0,0,0,0.9)', // Fond noir
        xaxis: {
            range: [0, MAX_HISTORY * X_STEP],
            showgrid: true,
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            showticklabels: false,
            zeroline: false,
            dtick: X_STEP // Step de 10px en X
        },
        yaxis: {
            range: [0, 80], // 0 à 80 FPS (augmenté pour que 60 soit plus bas, sous le bouton)
            showgrid: true,
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            tickfont: { color: 'white', size: 10 },
            title: {
                text: '', // Pas de titre sur l'axe
                font: { color: 'white', size: 11 }
            },
            side: 'left'
        },
        yaxis2: {
            type: 'log', // Échelle logarithmique pour la précision
            range: [Math.log10(0.5), Math.log10(2.5)], // Plotly log range utilise log10 des valeurs
            overlaying: 'y',
            side: 'right',
            showgrid: false,
            tickfont: { color: '#888888', size: 9 }, // Gris
            title: {
                text: '', // Pas de titre sur l'axe
                font: { color: '#888888', size: 10 } // Gris
            },
            tickmode: 'array',
            tickvals: [0.5, 0.75, 1.0, 1.5, 2.0, 2.5],
            ticktext: ['0.5x', '0.75x', '1.0x', '1.5x', '2.0x', '2.5x']
        },
        annotations: [
            {
                text: 'FPS',
                xref: 'paper',
                yref: 'paper',
                x: 0.02, // En haut à gauche
                y: 0.98, // Proche du haut
                xanchor: 'left',
                yanchor: 'top',
                font: { color: 'white', size: 12 },
                showarrow: false
            },
            {
                text: 'Précision',
                xref: 'paper',
                yref: 'paper',
                x: 0.98, // En haut à droite
                y: 0.98, // Proche du haut
                xanchor: 'right',
                yanchor: 'top',
                font: { color: '#888888', size: 12 }, // Gris
                showarrow: false
            }
        ],
        showlegend: false,
        hovermode: false
    };
    
    // Traces initiales (vides)
    // Ordre important : Plotly dessine les traces dans l'ordre, donc la dernière est au-dessus
    const traces = [
        {
            x: [],
            y: [],
            type: 'scatter',
            mode: 'lines',
            name: 'Précision',
            line: { color: '#888888', width: 2 }, // Gris
            yaxis: 'y2'
        },
        // Barres horizontales pour les seuils FPS
        {
            x: [0, MAX_HISTORY * X_STEP],
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
    
    // Créer les tableaux de coordonnées X avec step de 10px
    const xData = Array.from({ length: fpsHistory.length }, (_, i) => i * X_STEP);
    // Décaler la courbe FPS de 1px à droite
    const xDataFPS = xData.map(x => x + 1);
    
    // Mettre à jour les traces (Précision trace 0, FPS trace 4 pour qu'elle soit au-dessus)
    // Utiliser restyle pour mettre à jour seulement les traces nécessaires
    Plotly.restyle('fps-chart', {
        x: [xData],
        y: [precisionHistory]
    }, [0]); // Mettre à jour la trace 0 (Précision)
    
    Plotly.restyle('fps-chart', {
        x: [xDataFPS], // Courbe FPS décalée de 1px à droite
        y: [fpsHistory]
    }, [4]); // Mettre à jour la trace 4 (FPS)
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
        window.fps = fps;
    }
    
    // Récupérer la précision actuelle
    let precisionFactor = 1.0;
    if (typeof window !== 'undefined' && typeof getPrecisionFactorFromFPS === 'function') {
        precisionFactor = getPrecisionFactorFromFPS();
    } else {
        // Calculer approximativement la précision selon le FPS
        if (fps < FPSmin) {
            precisionFactor = 0.5;
        } else if (fps < FPSalert) {
            precisionFactor = 0.75;
        } else if (fps > FPSmax) {
            precisionFactor = 2.0;
        } else {
            precisionFactor = 1.0;
        }
    }
    
    // Accumuler les valeurs dans le buffer
    fpsBuffer.push(fps);
    precisionBuffer.push(precisionFactor);
    accumulatedTime += dt;
    
    // Si on a accumulé assez de temps pour un pixel, afficher
    if (accumulatedTime >= PIXEL_DURATION) {
        // Calculer la moyenne des valeurs accumulées
        const avgFPS = fpsBuffer.reduce((a, b) => a + b, 0) / fpsBuffer.length;
        const avgPrecision = precisionBuffer.reduce((a, b) => a + b, 0) / precisionBuffer.length;
        
        // Mettre à jour le graphique avec la moyenne
        updateFPSChart(avgFPS, avgPrecision);
        
        // Réinitialiser le buffer
        fpsBuffer = [];
        precisionBuffer = [];
        accumulatedTime = 0;
    }
}

// Fonction principale appelée depuis main.js (ancienne méthode, conservée pour compatibilité)
function updateFPSDisplay(fps, precisionFactor) {
    updateFPSChart(fps, precisionFactor);
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
        // Attendre un peu pour que le CSS soit appliqué
        setTimeout(initFPS, 100);
    }
    
    // Exposer les fonctions globalement
    window.updateFPSDisplay = updateFPSDisplay;
    window.fpsPing = ping; // Nouvelle fonction ping
    window.fpsStopTimer = stopTimer; // Fonction pour arrêter le timer
    window.fpsStartTimer = startTimer; // Fonction pour relancer le timer
}

