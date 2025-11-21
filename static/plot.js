// ============================================================================
// File: plot.js - Gestion du graphique avec Plotly.js
// Desc: En français, dans l'architecture, je suis le module de visualisation graphique
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: graphique Plotly avec visualisation spectrale
// ============================================================================

// ============================================================================
// GESTION DU GRAPHIQUE AVEC PLOTLY.JS
// ============================================================================

// Marges du graphique Plotly (communes à initPlot et updatePlot)
// va avec .plot-container-wrapper { padding: 0; !!! Important ne pas changer !!!
const PLOT_MARGINS = { l: 70, r: 75, t: 0, b: 75 }; // Marges ajustées pour éviter le débordement
// Note: Ces marges sont utilisées par Plotly pour positionner le graphique dans le conteneur

// Couleur de la tropopause (bleu vif) - utilisée pour la ligne et l'annotation
const ColorTropo = '#7799FF'; 

// Configuration de l'annotation Stratosphère/Troposphère
const STRATOSPHERE_ANNOTATION_X = 1.0; // Position X en coordonnées paper (1.0 = bord droit de l'axe)
const STRATOSPHERE_ANNOTATION_COLOR = ColorTropo; // Couleur de l'annotation (par défaut = ColorTropo)

// Couleur du fond du graphique (zone où sont dessinées les courbes)
const PLOT_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0)'; // Fond blanc opaque (100% alpha)

// Police globale - peut être changée via le bouton de debug
window.globalFontFamily = 'ProggyDotted'; // Police par défaut pour le graphique

// Fonction pour obtenir la couleur par défaut du body (vert)
function getDefaultTextColor() {
    if (typeof window !== 'undefined' && document.body) {
        const computedStyle = window.getComputedStyle(document.body);
        return computedStyle.color || '#00ff00'; // Vert par défaut si non trouvé
    }
    return '#00ff00'; // Vert par défaut
}

// Températures pour les courbes Planck de référence (en K)
window.PLANCK_TEMPERATURES = [180, 225, 255, 275, 300, 315];

/**
 * Convertit une température terrestre (°C) en couleur pour les courbes courantes
 * @param {number} tempC - Température en °C
 * @returns {string} Couleur (cyan, jaune, rouge, etc.)
 */
window.tempSurfaceToColor = function (tempC) {
    if (tempC <= -20) {
        return 'cyan';
    } else if (tempC < 20) {
        // Interpolation entre cyan (-20°C) et jaune (20°C)
        const ratio = (tempC + 20) / 40; // 0 à -20°C, 1 à 20°C
        // Cyan (0,255,255) vers Jaune (255,255,0)
        const r = Math.round(ratio * 255);
        const g = 255;
        const b = Math.round((1 - ratio) * 255);
        return `rgb(${r}, ${g}, ${b})`;
    } else if (tempC < 30) {
        // Interpolation entre jaune (20°C) et rouge (30°C)
        const ratio = (tempC - 20) / 10; // 0 à 20°C, 1 à 30°C
        // Jaune (255,255,0) vers Rouge (255,0,0)
        const r = 255;
        const g = Math.round((1 - ratio) * 255);
        const b = 0;
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        // 30°C et plus = rouge
        return 'red';
    }
};

// Activer l'affichage des étapes de dichotomie par défaut
if (typeof window !== 'undefined') {
    window.showDichotomySteps = true;
}

// Fonction de couleur basée sur la température (palette avec couleurs très distinctes)
// Exposer globalement pour être accessible depuis main.js
window.tempToColor = function tempToColor(temp, temp_min = 180, temp_max = 315) {
    // Palette de couleurs très distinctes et contrastées
    const colorMap = {
        180: '#00BFFF',  // Bleu ciel
        225: '#00FF7F',  // Vert printemps
        255: '#228B22',  // Vert forêt
        275: '#FFD700',  // Or
        300: '#FF6347',  // Tomate
        315: '#DC143C'  // Rouge cramoisi
    };

    // Si la température correspond exactement à une valeur dans la map, utiliser cette couleur
    if (colorMap[temp]) {
        return colorMap[temp];
    }

    // Sinon, interpolation entre les couleurs les plus proches
    const temps = Object.keys(colorMap).map(Number).sort((a, b) => a - b);
    if (temp <= temps[0]) return colorMap[temps[0]];
    if (temp >= temps[temps.length - 1]) return colorMap[temps[temps.length - 1]];

    // Trouver les deux températures les plus proches
    for (let i = 0; i < temps.length - 1; i++) {
        if (temp >= temps[i] && temp <= temps[i + 1]) {
            const t1 = temps[i];
            const t2 = temps[i + 1];
            const ratio = (temp - t1) / (t2 - t1);

            // Interpolation simple entre les couleurs hex
            const c1 = colorMap[t1];
            const c2 = colorMap[t2];
            const r1 = parseInt(c1.substr(1, 2), 16);
            const g1 = parseInt(c1.substr(3, 2), 16);
            const b1 = parseInt(c1.substr(5, 2), 16);
            const r2 = parseInt(c2.substr(1, 2), 16);
            const g2 = parseInt(c2.substr(3, 2), 16);
            const b2 = parseInt(c2.substr(5, 2), 16);

            const r = Math.round(r1 + (r2 - r1) * ratio);
            const g = Math.round(g1 + (g2 - g1) * ratio);
            const b = Math.round(b1 + (b2 - b1) * ratio);

            return `rgb(${r}, ${g}, ${b})`;
        }
    }

    return '#000000'; // Par défaut noir
}

// Fonction de debug pour vérifier les z-index
window.debugZIndex = function () {
    const canvas = document.getElementById('spectral-visualization');
    const title = document.querySelector('.plot-overlay-title');
    const plotContainer = document.getElementById('plot-container');

    // Debug z-index désactivé
};

// Fonction de debug pour inspecter la structure DOM de Plotly
window.debugPlotlyStructure = function () {
    const plotContainer = document.getElementById('plot-container');
    if (!plotContainer) {
        return;
    }

    const draglayer = plotContainer.querySelector('.nsewdrag.drag');
    const xy = plotContainer.querySelector('.xy');
    const draglayerCursor = plotContainer.querySelector('.draglayer.cursor-crosshair');
    let targetElement = draglayer || xy || draglayerCursor;

    if (!targetElement) {
        return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const wrapper = plotContainer.parentElement;
};

// Fonction pour masquer la ligne de l'axe x (trait noir horizontal de 0 à 50μm)
// IMPORTANT : Masquer UNIQUEMENT la ligne horizontale, PAS les labels (légende)
function hideXAxisLine() {
    const plotContainer = document.getElementById('plot-container');
    if (!plotContainer) return;

    // Chercher spécifiquement les éléments path de l'axe x (la ligne horizontale)
    // Ne PAS toucher aux éléments text (les labels)
    const xAxisGroups = plotContainer.querySelectorAll('g.xaxis, g.xaxislayer-above, g.xaxislayer-below');

    xAxisGroups.forEach(group => {
        // Chercher tous les path dans le groupe (ce sont les lignes de l'axe)
        const paths = group.querySelectorAll('path');
        paths.forEach(path => {
            // Vérifier si c'est bien un path horizontal (ligne d'axe, pas un tick)
            const d = path.getAttribute('d');
            // Les lignes horizontales ont généralement des commandes M (move) et H (horizontal) ou L avec y constant
            if (d && (d.includes('H') || d.match(/M[\d\.,]+,[\d\.,]+L[\d\.,]+,[\d\.,]+/))) {
                // C'est probablement la ligne de l'axe horizontal
                path.style.display = 'none';
                path.style.visibility = 'hidden';
                path.style.stroke = 'none';
                path.style.opacity = '0';
                path.setAttribute('display', 'none');
                path.setAttribute('stroke', 'none');
                path.setAttribute('opacity', '0');
            }
        });

        // Chercher aussi les lignes horizontales (line elements)
        const lines = group.querySelectorAll('line');
        lines.forEach(line => {
            const y1 = line.getAttribute('y1');
            const y2 = line.getAttribute('y2');
            // Si y1 == y2, c'est une ligne horizontale (probablement l'axe)
            if (y1 === y2) {
                line.style.display = 'none';
                line.style.visibility = 'hidden';
                line.style.stroke = 'none';
                line.style.opacity = '0';
                line.setAttribute('display', 'none');
                line.setAttribute('stroke', 'none');
                line.setAttribute('opacity', '0');
            }
        });
    });

    // Chercher aussi directement les path dans .crisp (parfois Plotly met la ligne là)
    const crispPaths = plotContainer.querySelectorAll('.crisp path, path.crisp');
    crispPaths.forEach(path => {
        const d = path.getAttribute('d');
        if (d && d.includes('M0')) {
            // Si le path commence par M0, c'est probablement l'axe
            path.style.display = 'none';
            path.setAttribute('display', 'none');
        }
    });

    // Chercher TOUS les path dans les couches d'axes (plus agressif)
    const allAxisPaths = plotContainer.querySelectorAll('svg path, path.domain, .gridlayer + g path, .zerolinelayer path');
    allAxisPaths.forEach(path => {
        const d = path.getAttribute('d');
        const parent = path.parentElement;
        // Si le parent est un groupe xaxis ou si c'est un path.domain, le masquer
        if (parent && (parent.classList.contains('xaxis') || parent.tagName === 'g')) {
            const parentClass = parent.getAttribute('class') || '';
            if (parentClass.includes('xaxis')) {
                path.style.display = 'none';
                path.style.stroke = 'none';
                path.style.strokeWidth = '0';
                path.setAttribute('display', 'none');
                path.setAttribute('stroke', 'none');
            }
        }
        // Si c'est un path.domain, le masquer aussi
        if (path.classList.contains('domain')) {
            path.style.display = 'none';
            path.setAttribute('display', 'none');
        }
    });

    // Observer les changements du DOM pour réappliquer le masquage si Plotly redessine
    if (!plotContainer._xAxisObserver) {
        const observer = new MutationObserver(() => {
            // Réappliquer le masquage après un court délai
            setTimeout(hideXAxisLine, 50);
        });
        observer.observe(plotContainer, { childList: true, subtree: true });
        plotContainer._xAxisObserver = observer;
    }
}

// Initialiser le graphique
function initPlot() {
    // Créer le canvas AVANT Plotly pour qu'il soit en arrière-plan
    const plotContainerWrapper = document.querySelector('.plot-container-wrapper');
    if (plotContainerWrapper) {
        let canvas = document.getElementById('spectral-visualization');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'spectral-visualization';
            canvas.width = 333;
            canvas.height = 400;
            // Insérer AVANT plot-container pour qu'il soit en arrière-plan dans le DOM
            const plotContainer = document.getElementById('plot-container');
            if (plotContainer) {
                plotContainerWrapper.insertBefore(canvas, plotContainer);
            } else {
                plotContainerWrapper.appendChild(canvas);
            }
            // Forcer le z-index immédiatement
            canvas.style.setProperty('z-index', '1', 'important');
            canvas.style.setProperty('position', 'absolute', 'important');
            canvas.style.setProperty('pointer-events', 'none', 'important');
        }
    }

    const layout = {
        xaxis: {
            title: {
                text: "Longueur d'onde (μm)",
                standoff: 20, // Remonté pour être plus proche de l'axe
                font: getPlotlyFont(14, getDefaultTextColor()) // color: '#667eea' (bleu) en réserve
            },
            tickfont: getPlotlyFont(12, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
            range: [0, 50], // Commence à 0
            fixedrange: true,
            // Valeurs de l'axe X sans couleur imposée (hérite du body)
            showgrid: false,
            showline: false, // Pas de ligne d'axe
            zeroline: false,
            showticklabels: true, // Garder les valeurs 0, 10, 20, etc.
            ticks: 'outside', // Garder les ticks mais à l'extérieur
            ticklen: 0, // Longueur des ticks à 0 pour les cacher
            tickwidth: 0 // Épaisseur des ticks à 0
        },
        yaxis: {
            title: {
                text: "Luminance spectrale (W·m⁻²·μm⁻¹·sr⁻¹)",
                font: getPlotlyFont(14, getDefaultTextColor()) // color: '#667eea' (bleu) en réserve
            },
            range: [0, 40],
            fixedrange: true, // Désactiver le zoom
            side: 'left', // Luminance à gauche
            tickfont: getPlotlyFont(12, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
            titlefont: getPlotlyFont(14, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
            showgrid: true,
            gridcolor: 'rgba(0, 0, 0, 0.5)', // Lignes horizontales noires à 50%
            gridwidth: 1
        },
        yaxis2: {
            title: {
                text: "Altitude (km)",
                font: getPlotlyFont(14, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
                standoff: 10
            },
            overlaying: 'y',
            side: 'right', // Altitude à droite
            range: [0, 120], // 0 km en bas, 120 km en haut
            fixedrange: true, // Désactiver le zoom
            position: 1, // Position à 1 (droite)
            // Aligner les ticks avec l'axe Y principal
            // yaxis: 0-40, yaxis2: 0-120 km, facteur = 3
            // Utiliser le même espacement que yaxis (généralement 5 ou 10)
            tickmode: 'linear',
            dtick: 15, // 15 km par tick (correspond à 5 sur yaxis : 5 * 3 = 15)
            tickfont: getPlotlyFont(12, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
            titlefont: getPlotlyFont(14, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
            showticklabels: true,
            showline: true,
            linecolor: 'rgba(0, 0, 0, 0.5)',
            linewidth: 1,
            mirror: 'ticks',
            showgrid: false, // Pas de grille pour l'axe secondaire
            zeroline: false,
            visible: true
        },
        showlegend: false,
        margin: PLOT_MARGINS, // Marges du graphique (variable commune)
        plot_bgcolor: PLOT_BACKGROUND_COLOR, // Fond de la zone de dessin (configurable)
        paper_bgcolor: PLOT_BACKGROUND_COLOR, // Fond du papier (configurable)
        annotations: [
            {
                x: STRATOSPHERE_ANNOTATION_X, // Position X configurable (en coordonnées paper)
                y: 11, // Position de la tropopause (11 km sur l'axe altitude)
                text: 'Stratosphère<br>8.0K<br>Troposphère',
                showarrow: false,
                xref: 'paper', // Coordonnées relatives au graphique
                yref: 'y2', // Utiliser l'axe altitude (droite)
                xanchor: 'left', // Aligné à gauche du texte (donc à droite de l'axe, séparé des pointillés)
                yanchor: 'middle',
                align: 'left', // Justifié à gauche
                font: getPlotlyFont(9, STRATOSPHERE_ANNOTATION_COLOR) // Couleur configurable
            },
            {
                x: 0.02, // En bas à gauche du graphique
                y: 0.02, // En bas à gauche du graphique
                text: '', // Sera rempli dynamiquement
                showarrow: false,
                xref: 'paper',
                yref: 'paper',
                xanchor: 'left',
                yanchor: 'bottom',
                font: getPlotlyFont(12, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                bordercolor: 'rgba(255, 255, 255, 0.3)',
                borderwidth: 1,
                borderpad: 4
            }
        ]
    };

    Plotly.newPlot('plot-container', [], layout, {
        responsive: true,
        displayModeBar: false,
        scrollZoom: false,
        doubleClick: false,
        dragmode: false
    }).then(() => {
        // Redimensionner le graphique Plotly à la bonne taille
        Plotly.Plots.resize('plot-container');

        // Calculer et définir la taille du canvas dès que Plotly est prêt
        // La bande sera dessinée automatiquement dans resizeCanvasToPlot()
        resizeCanvasToPlot();

        // Masquer la ligne de l'axe x (trait noir de 0 à 50μm)
        hideXAxisLine();
    });
}

// Fonction pour redimensionner le canvas pour correspondre à la zone de plot Plotly
// Debounce pour éviter trop d'appels lors du resize
let resizeTimeout = null;
function debouncedResizeCanvas() {
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    // Augmenter le délai pour laisser le temps au layout de se stabiliser (scrollbar)
    resizeTimeout = setTimeout(() => {
        // Force recalculation of position and redraw via callback
        resizeCanvasToPlot(() => {
            // Redessiner la visualisation spectrale si on a des données
            const canvas = document.getElementById('spectral-visualization');
            if (canvas && canvas._lastData) {
                // Forcer un redessin complet
                requestAnimationFrame(() => {
                    drawSpectralVisualization(canvas, canvas._lastData);
                });
            }
        });
    }, 300); // 300ms pour être sûr que le resize est fini
}

// Flag pour éviter les appels multiples simultanés
let resizeCanvasInProgress = false;
let resizeCanvasRetryCount = 0;
const MAX_RETRY_COUNT = 5;

function resizeCanvasToPlot(callback) {
    // Éviter les appels multiples simultanés
    if (resizeCanvasInProgress) {
        return;
    }

    const canvas = document.getElementById('spectral-visualization');
    const plotContainer = document.getElementById('plot-container');
    if (!canvas || !plotContainer) return;

    resizeCanvasInProgress = true;

    // Attendre un peu que Plotly ait fini de rendre
    setTimeout(() => {
        // Trouver spécifiquement ".nsewdrag.drag.cursor-pointer" pour calibrer le canvas
        const targetElement = plotContainer.querySelector('.nsewdrag.drag.cursor-pointer');
        const wrapper = plotContainer.parentElement;

        if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            const hBarre = 20; // Hauteur de la barre en bas (20px)
            const paddingX = 5; // 5px de chaque côté pour être derrière le 0 et le 50 μm

            // Dimensions : même largeur + 5px de chaque côté, même hauteur + barre
            const width = Math.round(targetRect.width) + (paddingX * 2);
            const height = Math.round(targetRect.height) + hBarre;

            // Positionner le canvas : même Y, left - 5px pour être derrière le 0
            if (wrapper) {
                const wrapperRect = wrapper.getBoundingClientRect();
                const left = Math.round((targetRect.left - wrapperRect.left) - paddingX);
                const top = Math.round(targetRect.top - wrapperRect.top); // Même Y

                canvas.style.setProperty('left', left + 'px', 'important');
                canvas.style.setProperty('top', top + 'px', 'important');
                canvas.style.removeProperty('transform');
            } else {
                const plotRect = plotContainer.getBoundingClientRect();
                const left = Math.round((targetRect.left - plotRect.left) - paddingX);
                const top = Math.round(targetRect.top - plotRect.top); // Même Y

                canvas.style.setProperty('left', left + 'px', 'important');
                canvas.style.setProperty('top', top + 'px', 'important');
                canvas.style.removeProperty('transform');
            }

            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            canvas.width = width;
            canvas.height = height;
            canvas.style.setProperty('z-index', '1', 'important');

            // Redessiner la bande de spectre immédiatement après le resize
            const rect = canvas.getBoundingClientRect();
            const displayHeight = Math.floor(rect.height) || height;
            const resFactor = displayHeight / height;
            drawSpectrumBarOnlyWithSize(width, height, resFactor);

            resizeCanvasInProgress = false;
            resizeCanvasRetryCount = 0; // Réinitialiser le compteur en cas de succès

            // Exécuter le callback (redessin complet) si fourni
            if (callback && typeof callback === 'function') {
                callback();
            }
        } else {
            // Fallback : réessayer après un délai (limité pour éviter les boucles infinies)
            if (resizeCanvasRetryCount < MAX_RETRY_COUNT) {
                resizeCanvasRetryCount++;
                setTimeout(() => {
                    resizeCanvasInProgress = false;
                    resizeCanvasToPlot(callback);
                }, 200);
            } else {
                resizeCanvasInProgress = false;
                resizeCanvasRetryCount = 0;
            }
        }
    }, 100);
}

// Ajouter l'écouteur d'événement resize
if (typeof window !== 'undefined') {
    window.addEventListener('resize', debouncedResizeCanvas);
}

// Fonction pour dessiner uniquement la bande de spectre de 15px (sans données)
function drawSpectrumBarOnly() {
    const canvas = document.getElementById('spectral-visualization');
    if (!canvas) return;
    // Calculer le resolutionFactor pour la barre
    const rect = canvas.getBoundingClientRect();
    const displayHeight = Math.floor(rect.height) || canvas.height;
    const resFactor = displayHeight / canvas.height;
    drawSpectrumBarOnlyWithSize(canvas.width, canvas.height, resFactor);
}

// Fonction pour dessiner la bande avec des dimensions spécifiques
function drawSpectrumBarOnlyWithSize(width, height, resolutionFactor = 1) {
    const canvas = document.getElementById('spectral-visualization');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // La barre doit toujours faire 20px en pixels d'affichage
    // Le canvas interne est réduit, puis agrandi par CSS avec resolutionFactor
    // Donc on doit diviser par resolutionFactor pour obtenir 20px d'affichage final
    const spectrumBarHeight = Math.max(1, Math.floor(20 / resolutionFactor)); // 20px d'affichage
    const charWidth = 5; // 5px de chaque côté pour être derrière le 0 et le 50 μm

    // Nettoyer seulement la zone de la bande
    const spectrumBarY = height - spectrumBarHeight + 0.5;
    ctx.clearRect(0, spectrumBarY, width, spectrumBarHeight);

    // Plage de l'axe X du graphique : 0 à 50 μm
    const graph_min_um = 0;
    const graph_max_um = 50;
    
    // Calculer effectiveWidth une seule fois
    const effectiveWidth = width - (charWidth * 2);

    // Dessiner la bande de spectre en bas (20px d'affichage) avec alpha=1 pour toutes les couleurs
    for (let x = 0; x < width; x++) {
        // Mapper la position X à la longueur d'onde (0 à 50 μm)
        // Compenser le décalage de charWidth de chaque côté
        // x=0 correspond à lambda_min (0 μm), x=width correspond à lambda_max (50 μm)
        const normalizedX = Math.max(0, Math.min(1, (x - charWidth) / effectiveWidth)); // 0 à 1
        const lambda_um = graph_min_um + normalizedX * (graph_max_um - graph_min_um); // 0 à 50 μm
        const lambda_m = lambda_um * 1e-6; // Convertir en mètres

        // Obtenir la couleur pour cette longueur d'onde (calée sur l'axe X du graphique)
        // Utiliser une plage par défaut si pas de données
        const lambda_min = 0.1e-6; // 0.1 μm
        const lambda_max = 100e-6; // 100 μm
        const [r, g, b] = wavelengthToColor(lambda_m, lambda_min, lambda_max);

        // Dessiner la bande avec alpha=1 (opacité maximale)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, spectrumBarY, 1, spectrumBarHeight);
    }
    
}

// Fonction helper pour obtenir la famille de police par défaut
function getDefaultFontFamily() {
    // Utiliser la police globale si définie, sinon fallback
    if (typeof window !== 'undefined' && window.globalFontFamily) {
        const font = window.globalFontFamily;
        // Toujours ajouter les fallbacks pour toutes les polices
        return `'${font}', 'Tahoma', 'Roboto', 'Verdana', sans-serif`;
    }
    return "'Tahoma', 'Roboto', 'Verdana', sans-serif";
}

// Fonction helper pour obtenir la configuration de font complète pour Plotly
function getPlotlyFont(size, color) {
    return {
        family: getDefaultFontFamily(),
        size: size,
        color: color || getDefaultTextColor()
    };
}

// Mettre à jour le graphique
// Exposer globalement pour être accessible depuis calculations.js
window.updatePlot = function updatePlot(data) {
    const traces = [];

    if (!data.lambda_range) return;

    const lambda_planck = data.lambda_range.map(l => l * 1e6); // Convertir en μm
    // ⚡ CORRECTION : Utiliser lambda_weights si disponible pour normalisation correcte
    // Le flux est calculé avec delta_lambda = 0.1e-6 dans calculations.js
    // Chaque point représente une plage de largeur delta_lambda * lambda_weights[j]
    const delta_lambda_base = 0.1e-6; // Pas de base utilisé dans les calculs (toujours 0.1e-6)
    const lambda_weights = data.lambda_weights || data.lambda_range.map(() => 1.0); // Par défaut, poids unitaire si non fourni

    // Fonction helper pour créer une trace de flux observé (absorption)
    function createFluxTrace(flux_data, co2_ppm, temp_eff, color, label) {
        // ⚡ CORRECTION : Normaliser avec la largeur effective de chaque point
        // Le flux calculé utilise delta_lambda * lambda_weights[j] dans calculations.js
        // Donc on doit diviser par la même valeur pour obtenir W/m²/μm
        const flux = flux_data.upward_flux[flux_data.upward_flux.length - 1]
            .map((f, idx) => {
                // Largeur effective = delta_lambda_base * lambda_weights[j]
                const effective_delta_lambda = delta_lambda_base * (lambda_weights[idx] || 1.0);
                return f / effective_delta_lambda / 1e6; // Convertir en W/m²/μm
            });
        // Tooltip : "Courbe d'équilibre d'émission de la terre" pour 0 ppm, sinon avec température
        let hoverText;
        if (co2_ppm === 0) {
            hoverText = "Courbe d'équilibre d'émission de la terre";
        } else if (temp_eff) {
            const tempC = (temp_eff - 273.15).toFixed(1);
            hoverText = `Courbe d'équilibre d'émission de la terre (${temp_eff.toFixed(1)} K, ${tempC}°C)`;
        } else {
            hoverText = "Courbe d'équilibre d'émission de la terre";
        }
        
        return {
            x: lambda_planck,
            y: flux,
            type: 'scatter',
            mode: 'lines',
            name: label,
            line: { color: color, width: 2 },
            hovertemplate: hoverText + '<extra></extra>'
        };
    }

    // Fonction helper pour créer une trace Planck
    function createPlanckTrace(T, label, color, showInLegend = false, dashPattern = 'dash') {
        const planck = data.lambda_range.map(l => {
            const value = Math.PI * (window.planckFunction || function () { return 0; })(l, T) / 1e6;
            // Pour 255K, s'assurer que la valeur est visible même si faible
            if (T === 255 && value < 0.01) {
                return 0.01; // Minimum visible
            }
            return value;
        });
        // Utiliser la couleur fournie (noir pour les références, couleur de l'absorption pour la courbe courante)
        const lineColor = color || 'black';
        
        // Tooltip : "Courbe d'émission du corps noir" avec température (le corps noir est par définition à l'équilibre)
        const tempC = (T - 273.15).toFixed(1);
        const hoverText = `Courbe d'émission du corps noir à ${T.toFixed(1)} K (${tempC}°C)`;
        
        return {
            x: lambda_planck,
            y: planck,
            type: 'scatter',
            mode: 'lines',
            name: label,
            line: { dash: dashPattern, width: 1, color: lineColor },
            showlegend: showInLegend,
            hovertemplate: hoverText + '<extra></extra>'
        };
    }

    // 1. Afficher toutes les courbes Planck de référence
    if (window.PLANCK_TEMPERATURES) {
        // Vérifier si getReferencePattern est disponible, sinon utiliser un fallback
        const getPattern = typeof window.getReferencePattern === 'function'
            ? window.getReferencePattern
            : function (index) {
                // Fallback : utiliser les 4 patterns disponibles directement (ordre : dash, dashdot, longdash, longdashdot)
                const fallbackPatterns = ['dash', 'dashdot', 'longdash', 'longdashdot'];
                return fallbackPatterns[index % 4];
            };

        const totalCount = window.PLANCK_TEMPERATURES.length;
        window.PLANCK_TEMPERATURES.forEach((T, index) => {
            const label = `${T}K (${(T - 273.15).toFixed(0)}°C)`;
            // Utiliser la fonction pour obtenir le pattern
            const dashPattern = getPattern(index);
            const planck = createPlanckTrace(T, label, 'white', false, dashPattern); // Blanc
            // Utiliser la fonction générique pour obtenir l'épaisseur selon le nombre total de courbes
            if (typeof window.getLineWidth === 'function') {
                planck.line.width = window.getLineWidth(index, totalCount);
            } else {
                // Fallback : très fin pour les 4 premières, plus épais pour les suivantes
                planck.line.width = index < 4 ? 0.5 : 1.5;
            }
            traces.push(planck);
        });
    }

    // 2. Afficher les 2 courbes pour le ppm sélectionné (absorption + Planck)
    let T_current_display = null; // Pour l'affichage de la température
    if (data.current) {
        // Utiliser la température effective calculée par les formules
        const T_current = data.current.effective_temperature;
        T_current_display = T_current; // Stocker pour l'annotation

        // Déterminer la couleur selon la température terrestre (T° Terrestre)
        let color_current = 'red'; // Par défaut
        // Récupérer temp_surface_c depuis data
        const temp_surface_c = data.temp_surface_c;

        if (temp_surface_c !== undefined && typeof window.tempSurfaceToColor === 'function') {
            // Utiliser la température terrestre en °C pour déterminer la couleur
            color_current = window.tempSurfaceToColor(temp_surface_c);
        } else {
            // Fallback : utiliser l'ancienne logique basée sur le ppm
            if (data.co2_ppm === 0) color_current = 'cyan';
            else if (Math.abs(data.co2_ppm - 280) < 1) color_current = 'green';
            else if (Math.abs(data.co2_ppm - 420) < 1) color_current = 'gray';
        }

        const trace_absorption = createFluxTrace(data.current, data.co2_ppm, T_current, color_current,
            `${data.co2_ppm.toFixed(0)} ppm (absorption)`);
        trace_absorption.showlegend = false; // Pas dans la légende
        traces.push(trace_absorption);

        // Courbe Planck correspondante (pointillée) à la température effective - en gras avec des points, même couleur que l'absorption
        const planck_current = createPlanckTrace(T_current, `Planck ${data.co2_ppm.toFixed(0)} ppm`, color_current, false, 'dot');
        planck_current.line.width = 2; // En gras comme la courbe d'absorption
        planck_current.line.color = color_current; // Même couleur que la courbe d'absorption
        traces.push(planck_current);
    }

    // 3. Ajouter une trace invisible pour forcer la création de l'axe yaxis2 (altitude)
    // Cette trace est nécessaire car Plotly ne crée un axe que s'il est utilisé par au moins une trace
    traces.push({
        x: [0, 0], // Points invisibles à x=0
        y: [0, 120], // De 0 à 120 km sur l'axe altitude
        type: 'scatter',
        mode: 'lines',
        name: 'Axe altitude',
        line: { color: 'rgba(0,0,0,0)', width: 0 }, // Invisible
        showlegend: false,
        hoverinfo: 'skip',
        yaxis: 'y2' // Utiliser l'axe secondaire (altitude)
    });

    // 4. Ajouter une ligne horizontale pour la tropopause (calculée dynamiquement)
    // Calculer la tropopause en fonction de T0 (température de surface)
    let T0 = 288; // Valeur par défaut (15°C)
    if (data.current && data.current.effective_temperature) {
        // Utiliser la température effective comme approximation de T0
        T0 = data.current.effective_temperature;
    } else if (data.temp_surface_c !== undefined) {
        // Convertir de °C en K
        T0 = data.temp_surface_c + 273.15;
    }

    // Calculer la tropopause dynamiquement
    const z_trop_m = (typeof window.calculateTropopauseHeight === 'function')
        ? window.calculateTropopauseHeight(T0)
        : 11000; // Fallback à 11 km si la fonction n'est pas disponible
    const z_trop_km = z_trop_m / 1000; // Convertir en km

    traces.push({
        x: [0, 50], // Ligne horizontale sur toute la largeur du graphique
        y: [z_trop_km, z_trop_km], // Ligne horizontale à la hauteur de la tropopause (en km, axe altitude 0-120)
        type: 'scatter',
        mode: 'lines',
        name: `Ligne de séparation (${z_trop_km.toFixed(1)} km)`,
        line: { color: ColorTropo, width: 1, dash: 'dot' }, // Même couleur que l'annotation
        showlegend: false,
        hovertemplate: `Ligne de séparation (${z_trop_km.toFixed(1)} km)<extra></extra>`,
        yaxis: 'y2' // Utiliser l'axe altitude (gauche)
    });

    const updateLayout = {
        margin: PLOT_MARGINS, // Marges du graphique (variable commune)
        xaxis: {
            range: [0, 50], // Commence à 0
            fixedrange: true,
            title: {
                text: "Longueur d'onde (μm)",
                standoff: 20, // Remonté pour être plus proche de l'axe
                font: getPlotlyFont(14, getDefaultTextColor()) // color: '#667eea' (bleu) en réserve
            },
            tickfont: getPlotlyFont(12, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
            showgrid: false,
            showline: false, // Pas de ligne d'axe
            zeroline: false,
            showticklabels: true, // Garder les valeurs 0, 10, 20, etc.
            ticks: 'outside', // Garder les ticks mais à l'extérieur
            ticklen: 0, // Longueur des ticks à 0 pour les cacher
            tickwidth: 0 // Épaisseur des ticks à 0
        },
        yaxis: {
            range: [0, 40],
            fixedrange: true, // Désactiver le zoom
            title: {
                text: "Luminance spectrale (W·m⁻²·μm⁻¹·sr⁻¹)",
                font: getPlotlyFont(14, getDefaultTextColor()) // color: '#667eea' (bleu) en réserve
            },
            side: 'left', // Luminance à gauche
            tickfont: getPlotlyFont(12, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
            titlefont: getPlotlyFont(14, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
            showgrid: true,
            gridcolor: 'rgba(0, 0, 0, 0.5)', // Lignes horizontales noires à 50%
            gridwidth: 1,
            showline: true, // Afficher le trait vertical de l'axe
            linecolor: 'rgba(0, 0, 0, 0.5)',
            linewidth: 1,
            mirror: 'ticks'
        },
        yaxis2: {
            title: {
                text: "Altitude (km)",
                font: getPlotlyFont(14, getDefaultTextColor())
            },
            overlaying: 'y',
            side: 'right', // Altitude à droite
            range: [0, 120], // 0 km en bas, 120 km en haut (même orientation que yaxis)
            fixedrange: true, // Désactiver le zoom
            position: 1, // Position à 1 (droite)
            // Aligner les ticks avec l'axe Y principal
            // yaxis: 0-40, yaxis2: 0-120 km, facteur = 3
            // Utiliser le même espacement que yaxis (généralement 5 ou 10)
            tickmode: 'linear',
            dtick: 15, // 15 km par tick (correspond à 5 sur yaxis : 5 * 3 = 15)
            tickfont: getPlotlyFont(12, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
            titlefont: getPlotlyFont(14, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
            showline: true,
            linecolor: 'rgba(0, 0, 0, 0.5)',
            linewidth: 1,
            mirror: 'ticks',
            showgrid: false,
            zeroline: false,
            visible: true
        },
        plot_bgcolor: PLOT_BACKGROUND_COLOR, // Fond de la zone de dessin (configurable)
        paper_bgcolor: PLOT_BACKGROUND_COLOR, // Fond du papier (configurable)
        annotations: [
            {
                x: STRATOSPHERE_ANNOTATION_X, // Position X configurable (en coordonnées paper)
                y: z_trop_km, // Position de la tropopause (en km, axe altitude)
                text: 'Stratosphère<br>8.0K<br>Troposphère',
                showarrow: false,
                xref: 'paper', // Coordonnées relatives au graphique
                yref: 'y2', // Utiliser l'axe altitude (droite)
                xanchor: 'left', // Aligné à gauche du texte (donc à droite de l'axe, séparé des pointillés)
                yanchor: 'middle',
                align: 'left', // Justifié à gauche
                font: getPlotlyFont(9, STRATOSPHERE_ANNOTATION_COLOR) // Couleur configurable
            },
        ]
    };

    // Afficher la température hors du graphique, en bas à gauche de la div
    if (T_current_display) {
        const plotContainer = document.getElementById('plot-container');
        if (plotContainer) {
            // Supprimer l'ancien affichage s'il existe
            const oldTempDisplay = plotContainer.querySelector('.temp-display-cyan');
            if (oldTempDisplay) {
                oldTempDisplay.remove();
            }
            
            // Créer un nouvel élément pour afficher la température
            const tempDisplay = document.createElement('div');
            tempDisplay.className = 'temp-display-cyan';
            
            // Calculer les températures
            const tempK = T_current_display.toFixed(1);
            const tempC = (T_current_display - 273.15).toFixed(1);
            const tempF = ((T_current_display - 273.15) * 9/5 + 32).toFixed(1);
            
            // Créer le contenu sur 3 lignes
            tempDisplay.innerHTML = `${tempK} K<br>${tempC}°C<br>${tempF}°F`;
            
            // Pas de couleur imposée, hérite du body (vert par défaut)
            
            plotContainer.appendChild(tempDisplay);
        }
    }
    
    // Afficher le texte "via lunettes infrarouge" en bas à droite, au-dessus de la bande spectrale
    const plotContainerWrapper = document.querySelector('.plot-container-wrapper');
    if (plotContainerWrapper) {
        // Supprimer l'ancien affichage s'il existe
        const oldInfraText = plotContainerWrapper.querySelector('.infra-note');
        if (oldInfraText) {
            oldInfraText.remove();
        }
        
        // Créer un nouvel élément pour afficher le texte
        const infraText = document.createElement('div');
        infraText.className = 'infra-note';
        infraText.textContent = 'via lunettes infrarouge logarithmique';
        
        plotContainerWrapper.appendChild(infraText);
    }

    updateLayout.yaxis2 = {
        title: {
            text: "Altitude (km)",
            font: getPlotlyFont(14, getDefaultTextColor()) // color: '#667eea' (bleu) en réserve
        },
        overlaying: 'y',
        side: 'right', // Altitude à droite
        range: [0, 120], // 0 km en bas, 120 km en haut
        fixedrange: true, // Désactiver le zoom
        position: 1, // Position à 1 (droite)
        // Aligner les ticks avec l'axe Y principal
        tickmode: 'linear',
        dtick: 15, // 15 km par tick (correspond à 5 sur yaxis : 5 * 3 = 15)
        tickfont: getPlotlyFont(12, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
        titlefont: getPlotlyFont(14, getDefaultTextColor()), // color: '#667eea' (bleu) en réserve
        showline: true,
        linecolor: 'rgba(0, 0, 0, 0.5)',
        linewidth: 1,
        mirror: 'ticks',
        showgrid: false,
        zeroline: false,
        visible: true
    };

    Plotly.react('plot-container', traces, updateLayout).then(() => {
        // Masquer la ligne de l'axe x (trait noir de 0 à 50μm)
        hideXAxisLine();

        // Observer le parent pour détecter quand Plotly modifie le DOM
        const plotContainer = document.getElementById('plot-container');
        const canvas = document.getElementById('spectral-visualization');
        const plotContainerWrapper = document.querySelector('.plot-container-wrapper');

        if (plotContainer && canvas && plotContainerWrapper && !plotContainer._plotlyObserver) {
            let debounceTimer = null;
            // Observer les modifications du DOM dans plot-container-wrapper
            const plotlyObserver = new MutationObserver(() => {
                // Debounce pour éviter les boucles infinies
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }
                debounceTimer = setTimeout(() => {
                    if (canvas && canvas.parentElement && plotContainerWrapper) {
                        // S'assurer que le canvas est AVANT plot-container dans le DOM (ordre de rendu)
                        if (canvas.nextSibling !== plotContainer && canvas.parentElement === plotContainerWrapper) {
                            plotContainerWrapper.insertBefore(canvas, plotContainer);
                        }

                        // Forcer le z-index
                        const currentZIndex = window.getComputedStyle(canvas).zIndex;
                        if (currentZIndex !== '1' && currentZIndex !== 'auto') {
                            canvas.style.setProperty('z-index', '1', 'important');
                        }
                    }
                }, 50); // Debounce de 50ms
            });
            plotlyObserver.observe(plotContainerWrapper, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            plotContainer._plotlyObserver = plotlyObserver;
        }

        // Forcer immédiatement
        if (canvas) {
            canvas.style.setProperty('z-index', '1', 'important');
        }
        // S'assurer que la visualisation spectrale reste visible après la mise à jour Plotly
        setTimeout(() => {
            const canvas = document.getElementById('spectral-visualization');
            if (canvas) {
                // Toujours forcer la visibilité, même si on n'a pas de nouvelles données
                canvas.style.setProperty('display', 'block', 'important');
                canvas.style.setProperty('visibility', 'visible', 'important');
                canvas.style.setProperty('opacity', '1', 'important');
                canvas.style.setProperty('z-index', '1', 'important');
                canvas.style.setProperty('position', 'absolute', 'important');
                // Mettre à jour seulement si on a des données
                if (data && data.current && typeof window.updateSpectralVisualization === 'function') {
                    window.updateSpectralVisualization(data.current);
                }
                // Sinon, garder la dernière visualisation visible (ne rien faire)
            }
        }, 150);
    });
}

// ============================================================================
// VISUALISATION SPECTRALE DES RAIES
// ============================================================================


// Fonction pour convertir une longueur d'onde visible (nm) en RGB
// Basée sur l'algorithme standard de conversion spectre visible → RGB
function wavelengthToRGB(lambda_nm) {
    let r, g, b;
    let attenuation;

    const lmin=380;
    const lviolet=440;
    const lblue=490;
    const lcyan=510;
    const lgreen=580;
    const lorange=645;
    const lred=789;
    const effacement_fin=20;

    if (lambda_nm >= lmin && lambda_nm < lviolet) {
        // Violet (380-440 nm)
        attenuation = 0.3 + 0.7 * (lambda_nm - lmin) / (lviolet - lmin);
        attenuation = Math.max(0,Math.min(1,(lviolet - lambda_nm) / (lviolet - lmin)));
        r = ((-(lambda_nm - lviolet) / (lviolet - lmin)) * attenuation) * 255;
        g = 0;
        b = 255 * attenuation;
    } else if (lambda_nm >= lviolet && lambda_nm < lblue) {
        // Bleu (440-490 nm)
        r = 0;
        g = ((lambda_nm - lviolet) / (lblue - lviolet)) * 255;
        b = 255;
    } else if (lambda_nm >= lblue && lambda_nm < lcyan) {
        // Cyan (490-510 nm)
        r = 0;
        g = 255;
        b = (-(lambda_nm - lcyan) / (lcyan - lblue)) * 255;
    } else if (lambda_nm >= lcyan && lambda_nm < lgreen) {
        // Vert (510-580 nm)
        r = ((lambda_nm - lcyan) / (lgreen - lcyan)) * 255;
        g = 255;
        b = 0;
    } else if (lambda_nm >= lgreen && lambda_nm < lorange) {
        // Jaune → Orange → Rouge (580-645 nm)
        r = 255;
        g = (-(lambda_nm - lorange) / (lorange - lgreen)) * 255;
        b = 0;
    } else if (lambda_nm >= lorange && lambda_nm <= lred) {
        attenuation = Math.max(0,Math.min(1,(lred - effacement_fin - lambda_nm) / (lred - effacement_fin - lorange)));
        r = 255 * attenuation;
        g = 0;
        b = 0;
    } else {
        // Hors du spectre visible
        r = 0;
        g = 0;
        b = 0;
    }

    return [Math.round(Math.max(0, Math.min(255, r))), 
            Math.round(Math.max(0, Math.min(255, g))), 
            Math.round(Math.max(0, Math.min(255, b)))];
}


// Fonction Hz2RGB : convertit une fréquence (en unités de 10^14 Hz) en couleur RGB
// Retourne [0,0,0] si hors du spectre visible
// Visible : 789 THz → 429 THz (380 nm → 700 nm) = 7.89 → 4.29 en unités 10^14 Hz
function Hz2RGB(freq_10_14) {
    // Spectre visible : 7.89 → 4.29 (en unités de 10^14 Hz)
    // 789 THz = 7.89 × 10^14 Hz (violet, 380 nm)
    // 429 THz = 4.29 × 10^14 Hz (rouge, 700 nm)
    if (freq_10_14 > 7.89) {
        return [0, 0, 0]; // Invisible (UV ou IR)
    }
    
    // Convertir la fréquence en longueur d'onde : λ = c / ν
    // c = 3×10^8 m/s, ν = freq_10_14 × 10^14 Hz
    // λ (nm) = (3×10^8) / (freq_10_14 × 10^14) × 10^9 = 3000 / freq_10_14
    const lambda_nm = 3000 / freq_10_14;
    // 3000/4.29=699.3006993006993
    // 3000/7.89=379.9746514575412
    
    // Clamper entre 380 et 700 nm
    //const lambda_nm_clamped = Math.max(380, Math.min(700, lambda_nm));
    
    // Convertir en RGB selon le spectre visible
    return wavelengthToRGB(lambda_nm);
}

// Fonction pour convertir une longueur d'onde en couleur RGB en utilisant les VRAIES longueurs d'onde
// avec formule d'étalement : log(lambda) = log10(λ_μm) + 6, hz = 1/(log(lambda) - 3)
// Passe directement à Hz2RGB(2000 * hz)
function wavelengthToColorReal(lambda_m, lambda_range_min, lambda_range_max) {
    const lambda_um = lambda_m * 1e6; // Convertir en μm
    if (lambda_um <= 1) {
        return [0, 0, 0]; // Point singulier : invisible
    }
    
    
    // lambda_um= 1 -> 5 -> 10 -> 50
    const log_lambda = Math.log10(lambda_um);
    // log_lambda= 0 -> 0.7 -> 1 -> 1.7
    const effacement_debut=30;
    const hz = 1598.5 / (log_lambda+2.026);
    // hz= 789 -> ... -> ... -> 429 (en THz)
    // vis.789        ->        429 THz Delta=360
    // vis.380        ->        700 nm Delta=320
    
    // Conversion THz → unités de 10^14 Hz
    // 789 THz = 789 × 10^12 Hz = 7.89 × 10^14 Hz
    const freq_10_14 = (hz-effacement_debut) / 100;
    
    return Hz2RGB(freq_10_14);
}

// Fonction principale : utilise uniquement les vraies longueurs d'onde
function wavelengthToColor(lambda_m, lambda_range_min, lambda_range_max) {
    return wavelengthToColorReal(lambda_m, lambda_range_min, lambda_range_max);
}

// Variable globale pour suivre l'état de convergence et la précision cible
if (typeof window !== 'undefined') {
    window.spectralPrecisionTarget = 'auto'; // 'auto', 'low', 'medium', 'high', 'max'
    window.spectralConverged = false;
}

// Écouter l'événement de convergence pour ajuster la précision
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('calculationConverged', (event) => {
        // Convergence atteinte : vérifier le FPS pour décider de la précision finale
        const currentFPS = window.fps || 60;
        if (currentFPS > 55) {
            // FPS stable : cibler la précision maximale (pixel par pixel)
            window.spectralConverged = true;
            window.spectralPrecisionTarget = 'max';
        } else if (currentFPS > 45) {
            // FPS bon : précision haute
            window.spectralConverged = true;
            window.spectralPrecisionTarget = 'high';
        } else {
            // FPS moyen : précision moyenne
            window.spectralConverged = true;
            window.spectralPrecisionTarget = 'medium';
        }

        // Redessiner avec la nouvelle précision si on a des données
        const canvas = document.getElementById('spectral-visualization');
        if (canvas && canvas._lastData) {
            setTimeout(() => {
                if (typeof window.updateSpectralVisualization === 'function') {
                    window.updateSpectralVisualization(canvas._lastData);
                }
            }, 100);
        }
    });
}

// Fonction pour créer la visualisation spectrale
window.updateSpectralVisualization = function (data) {
    // Ne pas actualiser pendant les calculs de dichotomie pour améliorer les performances
    if (typeof window !== 'undefined' && window.calculationInProgress) {
        return; // Ignorer les mises à jour pendant la dichotomie
    }

    const canvas = document.getElementById('spectral-visualization');
    if (!canvas || !data || !data.upward_flux || !data.lambda_range || !data.z_range) {
        return;
    }

    // Stocker les données pour pouvoir les redessiner lors du resize
    canvas._lastData = data;

    // Fonction pour forcer le z-index à 1 (au-dessus du fond mais en dessous des courbes)
    const forceZIndex = (silent = false, source = 'unknown') => {
        if (canvas && !canvas._forcingZIndex) {
            canvas._forcingZIndex = true; // Éviter les appels récursifs

            // Désactiver temporairement l'observer pour éviter la boucle
            if (canvas._zIndexObserver) {
                canvas._zIndexObserver.disconnect();
            }

            const oldZIndex = window.getComputedStyle(canvas).zIndex;

            // Forcer le z-index même si déjà à 1 (Plotly peut le changer très rapidement)
            canvas.style.setProperty('z-index', '1', 'important');
            canvas.style.zIndex = '1'; // Double application pour être sûr

            const newZIndex = window.getComputedStyle(canvas).zIndex;

            // Réactiver l'observer après un délai plus long pour laisser Plotly finir
            if (canvas._zIndexObserver) {
                setTimeout(() => {
                    canvas._forcingZIndex = false; // Réinitialiser APRÈS la réactivation
                    if (canvas && canvas._zIndexObserver) {
                        canvas._zIndexObserver.observe(canvas, {
                            attributes: true,
                            attributeFilter: ['style'],
                            attributeOldValue: false
                        });
                    }
                }, 100); // Délai plus long
            } else {
                canvas._forcingZIndex = false;
            }
        }
    };

    // Forcer le z-index à chaque frame si nécessaire (plus agressif)
    let lastZIndexCheck = 0;
    const forceZIndexOnFrame = () => {
        if (canvas && !canvas._forcingZIndex) {
            const currentZIndex = window.getComputedStyle(canvas).zIndex;
            if (currentZIndex !== '1' && currentZIndex !== 'auto') {
                forceZIndex(true); // Silent pour éviter le spam
            }
        }
        requestAnimationFrame(forceZIndexOnFrame);
    };

    // Observer les changements de style pour forcer le z-index à chaque modification
    if (!canvas._zIndexObserver) {
        const observer = new MutationObserver((mutations) => {
            // Ignorer si on est en train de forcer nous-mêmes
            if (canvas._forcingZIndex) {
                return;
            }

            // Ne forcer que si le style a vraiment changé
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    // Attendre un peu pour voir si c'est Plotly qui modifie
                    setTimeout(() => {
                        if (!canvas._forcingZIndex) {
                            const beforeZIndex = window.getComputedStyle(canvas).zIndex;
                            // Ne corriger que si le z-index n'est pas déjà à 1
                            if (beforeZIndex !== '1' && beforeZIndex !== 'auto') {
                                forceZIndex(true, 'MutationObserver'); // Silent pour éviter le spam
                            }
                        }
                    }, 20); // Petit délai pour distinguer nos modifications de celles de Plotly
                    break;
                }
            }
        });
        observer.observe(canvas, {
            attributes: true,
            attributeFilter: ['style'],
            attributeOldValue: false
        });
        canvas._zIndexObserver = observer;

        // Forcer aussi périodiquement mais moins souvent (2000ms) - backup
        canvas._zIndexInterval = setInterval(() => {
            const currentZIndex = window.getComputedStyle(canvas).zIndex;
            if (currentZIndex !== '1' && currentZIndex !== 'auto') {
                forceZIndex(true); // Silent pour éviter le spam
            }
        }, 2000);

        // Démarrer le forçage à chaque frame (plus agressif)
        if (!canvas._zIndexFrameId) {
            canvas._zIndexFrameId = requestAnimationFrame(forceZIndexOnFrame);
        }
    }

    // Forcer la visibilité du canvas avec !important via setProperty
    canvas.style.setProperty('display', 'block', 'important');
    canvas.style.setProperty('visibility', 'visible', 'important');
    canvas.style.setProperty('opacity', '1', 'important');
    canvas.style.setProperty('z-index', '1', 'important');
    canvas.style.setProperty('position', 'absolute', 'important');

    // Ne pas appeler resizeCanvasToPlot ici - elle est déjà appelée au resize et à l'init
    // Le canvas devrait déjà être dimensionné correctement

    // Dessiner la visualisation avec les données
    const plotContainer = document.getElementById('plot-container');
    if (plotContainer) {
        setTimeout(() => {
            drawSpectralVisualization(canvas, data);
        }, 100);
    } else {
        drawSpectralVisualization(canvas, data);
    }
};

function drawSpectralVisualization(canvas, data) {
    const ctx = canvas.getContext('2d');

    // Utiliser la taille réelle du canvas visible à l'écran (pas une taille fixe)
    // Cela limite les calculs aux pixels réellement visibles
    const rect = canvas.getBoundingClientRect();
    let width = Math.floor(rect.width) || canvas.width; // Taille visible à l'écran
    let height = Math.floor(rect.height) || canvas.height; // Taille visible à l'écran

    // Ajuster la résolution du canvas pour correspondre à la taille visible
    // Réduire la résolution si retina (devicePixelRatio > 1) pour améliorer les performances
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Réduire drastiquement la résolution pendant la dichotomie (/4 des 2 dimensions = /16)
    const isDichotomy = typeof window !== 'undefined' && window.calculationInProgress;

    // Adapter la précision en fonction du FPS et de l'état de convergence
    // Le canvas écoute l'événement 'calculationConverged' pour savoir quand augmenter la précision
    const currentFPS = typeof window !== 'undefined' && window.fps ? window.fps : 60;
    const isConverged = typeof window !== 'undefined' && window.spectralConverged;
    const precisionTarget = typeof window !== 'undefined' && window.spectralPrecisionTarget ? window.spectralPrecisionTarget : 'auto';

    let resolutionFactor;
    if (isDichotomy) {
        resolutionFactor = 4; // Pendant la dichotomie, toujours très basse résolution
    } else if (isConverged && precisionTarget === 'max') {
        // Convergence atteinte ET précision cible = max : précision maximale (pixel par pixel)
        resolutionFactor = 1; // Précision maximale (1 pixel = 1 pixel), même sur retina
    } else if (isConverged && precisionTarget === 'high') {
        // Convergence atteinte ET précision cible = high : haute précision
        resolutionFactor = devicePixelRatio > 1 ? 1.5 : 1;
    } else if (isConverged && precisionTarget === 'medium') {
        // Convergence atteinte ET précision cible = medium : précision moyenne
        resolutionFactor = 2;
    } else if (currentFPS < 20) {
        resolutionFactor = 4; // Très basse précision si FPS très bas
    } else if (currentFPS < 30) {
        resolutionFactor = 3; // Basse précision
    } else if (currentFPS < 45) {
        resolutionFactor = 2; // Précision moyenne
    } else if (currentFPS < 55) {
        resolutionFactor = devicePixelRatio > 1 ? 1.5 : 1.5; // Bonne précision
    } else {
        resolutionFactor = devicePixelRatio > 1 ? 2 : 1; // Haute précision (retina/2 ou 1)
    }

    // Réduire la résolution pour améliorer les performances
    width = Math.floor(width / resolutionFactor);
    height = Math.floor(height / resolutionFactor);

    const displayWidth = width;
    const displayHeight = height;

    // Ajuster la taille interne du canvas si nécessaire
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    // Ajuster le style pour que le canvas s'affiche à la bonne taille (upscale si nécessaire)
    canvas.style.width = (width * resolutionFactor) + 'px';
    canvas.style.height = (height * resolutionFactor) + 'px';

    // La barre doit toujours faire 20px en pixels d'affichage
    // Le canvas interne est réduit, puis agrandi par CSS avec resolutionFactor
    // Donc on doit diviser par resolutionFactor pour obtenir 20px d'affichage final
    const spectrumBarHeight = Math.max(1, Math.floor(20 / resolutionFactor)); // 20px d'affichage
    const charWidth = 5; // 5px de chaque côté pour être derrière le 0 et le 50 μm

    // Nettoyer le canvas
    ctx.clearRect(0, 0, width, height);

    // Zone de visualisation principale (hauteur - barre pour la bande, sans padding en haut pour dessiner jusqu'en haut)
    // La barre fait maintenant 20px
    const visualizationHeight = height - spectrumBarHeight + Math.max(1, Math.floor(2 / resolutionFactor));

    const upward_flux = data.upward_flux;
    const earth_flux = data.earth_flux || null; // Courbe de Planck pure au sol
    const lambda_range = data.lambda_range;
    const z_range = data.z_range;

    // Calculer la courbe d'absorption normalisée (flux au sommet de l'atmosphère)
    // C'est la courbe verte qui filtre le spectre
    let absorptionCurve = null;
    if (upward_flux && upward_flux.length > 0) {
        const topFlux = upward_flux[upward_flux.length - 1]; // Flux au sommet
        // Normaliser entre 0 et 1 pour chaque longueur d'onde
        const topFluxMax = Math.max(...topFlux);
        if (topFluxMax > 0) {
            absorptionCurve = topFlux.map(f => f / topFluxMax);
        }
    }

    // Trouver les valeurs min/max pour normaliser l'alpha
    // Utiliser upward_flux directement (comme avant - première version qui fonctionnait bien)
    const allFluxes = [];
    for (let i = 0; i < upward_flux.length; i++) {
        for (let j = 0; j < upward_flux[i].length; j++) {
            allFluxes.push(upward_flux[i][j]);
        }
    }
    allFluxes.sort((a, b) => a - b);

    // Utiliser les percentiles 1% et 99% pour mieux voir les faibles valeurs
    // (réduire de 5% à 1% pour éviter d'écraser les faibles flux dans la zone < 9 μm)
    const p1Index = Math.floor(allFluxes.length * 0.01);
    const p99Index = Math.floor(allFluxes.length * 0.99);
    const minFlux = allFluxes[p1Index] || allFluxes[0] || 0;
    const maxFlux = allFluxes[p99Index] || allFluxes[allFluxes.length - 1] || 1;
    const fluxRange = maxFlux - minFlux;

    // Plage de l'axe X du graphique : 0 à 50 μm
    const graph_min_um = 0;
    const graph_max_um = 50;

    // Calculer l'altitude max pour normaliser
    const z_max = z_range.length > 0 ? z_range[z_range.length - 1] : 120000; // 120 km par défaut
    const z_max_km = z_max / 1000; // En km

    // Mapper chaque pixel Y à une altitude spécifique (0 à z_max)
    // Pour avoir une correspondance directe entre pixel Y et altitude
    const altitudePerPixel = z_max / visualizationHeight; // Altitude en mètres par pixel

    // Constantes pour le calcul de la densité (approximation exponentielle)
    const H = 8500; // Échelle de hauteur en mètres (environ 8.5 km)
    const P0 = 101325; // Pression au niveau de la mer en Pa

    // Dessiner chaque pixel de la visualisation principale
    // Adapter le pas en Y en fonction du FPS et de la convergence
    // Le canvas écoute l'événement 'calculationConverged' pour savoir quand augmenter la précision
    let yStep = 1;
    if (isDichotomy) {
        yStep = 2; // Pendant la dichotomie, toujours sauter des pixels
    } else if (isConverged && precisionTarget === 'max') {
        yStep = 1; // Précision maximale : pixel par pixel
    } else if (isConverged && precisionTarget === 'high') {
        yStep = 1; // Haute précision : pixel par pixel
    } else if (isConverged && precisionTarget === 'medium') {
        yStep = 1; // Précision moyenne : pixel par pixel quand même
    } else if (currentFPS < 30) {
        yStep = 2; // Sauter des pixels si FPS bas
    } else if (currentFPS < 45) {
        yStep = 2; // Pas de 2 pour éviter les problèmes de boucle (on dessinera 2 pixels de haut)
    } else {
        yStep = 1; // Tous les pixels si FPS bon
    }

    for (let y = 0; y < visualizationHeight; y += yStep) {
        // Calculer l'altitude correspondant à ce pixel Y
        // y=0 (en haut) → z=0 (sol), y=max (en bas) → z=z_max (haute altitude)
        const z_target = y * altitudePerPixel;

        // Trouver la couche la plus proche de cette altitude
        let layerIndex = 0;
        let minDiff = Infinity;
        for (let i = 0; i < z_range.length; i++) {
            const diff = Math.abs(z_range[i] - z_target);
            if (diff < minDiff) {
                minDiff = diff;
                layerIndex = i;
            }
        }

        if (layerIndex >= upward_flux.length || layerIndex >= z_range.length) continue;

        const z = z_range[layerIndex]; // Altitude en mètres

        // CORRECTION : Inverser l'index pour corriger l'affichage
        // Si la coupure apparaît à 112 km au lieu de 11 km, c'est que les données sont inversées
        // y=0 (en haut) doit afficher z_max, y=max (en bas) doit afficher z=0
        // Donc on inverse l'index : au lieu de layerIndex, utiliser l'index inversé
        const reversedIndex = z_range.length - 1 - layerIndex;
        const z_reversed = z_range[reversedIndex]; // Altitude correspondant à l'index inversé

        // Utiliser upward_flux avec l'index inversé
        // Au sol (z_reversed < 25m), utiliser earth_flux (courbe de Planck pure)
        let layerFlux;
        if (z_reversed < 25 && earth_flux) {
            layerFlux = earth_flux;
        } else {
            // Utiliser upward_flux avec index inversé pour corriger l'affichage
            layerFlux = upward_flux[reversedIndex];
        }

        // Calculer le facteur de densité relative (diminue exponentiellement avec l'altitude)
        // Densité relative = exp(-z/H) où H est l'échelle de hauteur
        // Normaliser pour avoir 1 au sol (z=0) et diminuer avec l'altitude
        // Utiliser z_reversed pour le calcul de densité (altitude réelle de la couche affichée)
        const densityFactor = Math.exp(-z_reversed / H);

        // Utiliser directement le facteur de densité sans transition brutale
        // La décroissance exponentielle naturelle suffit
        const densityAlpha = densityFactor;

        // Adapter le pas en X en fonction du FPS et de la convergence
        // Le canvas écoute l'événement 'calculationConverged' pour savoir quand augmenter la précision
        let xStep = 1;
        if (isDichotomy) {
            xStep = 2; // Pendant la dichotomie, toujours sauter des pixels
        } else if (isConverged && precisionTarget === 'max') {
            xStep = 1; // Précision maximale : pixel par pixel
        } else if (isConverged && precisionTarget === 'high') {
            xStep = 1; // Haute précision : pixel par pixel
        } else if (isConverged && precisionTarget === 'medium') {
            xStep = 1; // Précision moyenne : pixel par pixel quand même
        } else if (currentFPS < 30) {
            xStep = 2; // Sauter des pixels si FPS bas
        } else if (currentFPS < 45) {
            xStep = 2; // Pas de 2 pour éviter les problèmes de boucle (on dessinera 2 pixels de large)
        } else {
            xStep = 1; // Tous les pixels si FPS bon
        }

        for (let x = 0; x < width; x += xStep) {
            // Mapper la position X du canvas à la longueur d'onde (0 à 50 μm)
            // Compenser le décalage de charWidth de chaque côté
            const effectiveWidth = width - (charWidth * 2);
            const normalizedX = Math.max(0, Math.min(1, (x - charWidth) / effectiveWidth)); // 0 à 1
            const lambda_um = graph_min_um + normalizedX * (graph_max_um - graph_min_um); // 0 à 50 μm
            const lambda_m = lambda_um * 1e-6; // Convertir en mètres

            // Trouver l'index dans lambda_range qui correspond le plus à cette longueur d'onde
            let lambdaIndex = 0;
            let minDiff = Infinity;
            for (let i = 0; i < lambda_range.length; i++) {
                const diff = Math.abs(lambda_range[i] - lambda_m);
                if (diff < minDiff) {
                    minDiff = diff;
                    lambdaIndex = i;
                }
            }

            if (lambdaIndex >= lambda_range.length) continue;

            const lambda = lambda_range[lambdaIndex];
            let flux = layerFlux[lambdaIndex];


            // TEMPORAIRE : Désactiver la multiplication par la courbe d'absorption pour diagnostiquer
            // Multiplier par la courbe d'absorption normalisée pour filtrer le spectre
            // Cela montre l'émission filtrée par l'absorption atmosphérique
            // if (absorptionCurve && absorptionCurve[lambdaIndex] !== undefined) {
            //     flux = flux * absorptionCurve[lambdaIndex];
            // }

            // Normaliser le flux pour l'alpha (0 à 1) avec étirement du contraste
            let normalized = fluxRange > 0 ? (flux - minFlux) / fluxRange : 0.5;

            // Si le flux est < minFlux (en dessous du percentile 1%), il sera négatif
            // Dans ce cas, ne pas dessiner du tout pour éviter les barres grises
            if (normalized < 0 || flux <= 0) {
                // Flux en dessous du minimum ou nul : ne pas dessiner
                continue; // Passer au pixel suivant sans dessiner
            }

            // Clamper entre 0 et 1 (sécurité supplémentaire)
            normalized = Math.max(0, Math.min(1, normalized));

            // Appliquer une courbe gamma pour améliorer le contraste
            const gamma = 0.6; // Réduire de 0.7 à 0.6 pour mieux voir les faibles valeurs
            const alphaRaw = Math.pow(normalized, gamma);
            // Alpha minimum de 0, maximum 1.0
            let alpha = Math.max(0, Math.min(1.0, alphaRaw));

            // Pour l'émission, réduire moins l'alpha avec la densité pour garder les couleurs visibles
            // Appliquer un facteur moins agressif : garder au moins 50% de l'alpha même en haute altitude
            // S'assurer que densityAlpha est entre 0 et 1 pour éviter les alpha négatifs
            const densityFactor = Math.max(0, Math.min(1, densityAlpha));
            alpha = alpha * (0.5 + 0.5 * densityFactor);

            // Clamper l'alpha final entre 0 et 1 (sécurité absolue)
            alpha = Math.max(0, Math.min(1.0, alpha));

            // Ne pas dessiner si alpha est trop faible (< 0.05) pour éviter les barres grises
            // Augmenter le seuil pour éliminer complètement les pixels presque transparents
            if (alpha < 0.05) {
                continue; // Passer au pixel suivant sans dessiner
            }

            // Obtenir la couleur pour cette longueur d'onde (calée sur l'axe X du graphique)
            const [r, g, b] = wavelengthToColor(lambda, lambda_range[0], lambda_range[lambda_range.length - 1]);

            // Dessiner le pixel avec alpha variable selon l'intensité du flux et la densité
            // Utiliser le mode de fusion 'screen' ou 'lighter' pour un effet lumineux sur fond sombre
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            // Dessiner un rectangle plus large si on saute des pixels (pour combler les trous)
            ctx.fillRect(x, y, xStep, yStep);
            // Rétablir le mode par défaut pour la suite
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    // Dessiner la barre de spectre en bas (utilise la fonction dédiée pour éviter la duplication)
    // Passer le resolutionFactor pour que la barre reste à 20px d'affichage
    drawSpectrumBarOnlyWithSize(width, height, resolutionFactor);
    
}

