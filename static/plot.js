// ============================================================================
// GESTION DU GRAPHIQUE AVEC PLOTLY.JS
// ============================================================================

// Températures pour les courbes Planck de référence (en K)
window.PLANCK_TEMPERATURES = [180, 225, 255, 275, 300, 315];

/**
 * Convertit une température terrestre (°C) en couleur pour les courbes courantes
 * @param {number} tempC - Température en °C
 * @returns {string} Couleur (cyan, jaune, rouge, etc.)
 */
window.tempSurfaceToColor = function(tempC) {
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
window.debugZIndex = function() {
    const canvas = document.getElementById('spectral-visualization');
    const title = document.querySelector('.plot-overlay-title');
    const plotContainer = document.getElementById('plot-container');
    
    // Debug z-index désactivé
};

// Fonction de debug pour inspecter la structure DOM de Plotly
window.debugPlotlyStructure = function() {
    const plotContainer = document.getElementById('plot-container');
    if (!plotContainer) {
        console.log('❌ plot-container non trouvé');
        return;
    }
    
    const draglayer = plotContainer.querySelector('.nsewdrag.drag');
    const xy = plotContainer.querySelector('.xy');
    const draglayerCursor = plotContainer.querySelector('.draglayer.cursor-crosshair');
    let targetElement = draglayer || xy || draglayerCursor;
    
    if (!targetElement) {
        console.log('❌ Aucun élément de positionnement trouvé');
        return;
    }
    
    const targetRect = targetElement.getBoundingClientRect();
    const wrapper = plotContainer.parentElement;
    
    console.log('=== POSITIONNEMENT ===');
    console.log('targetElement:', targetElement.tagName, targetElement.className);
    console.log('targetRect:', {
        left: Math.round(targetRect.left * 100) / 100,
        top: Math.round(targetRect.top * 100) / 100,
        width: Math.round(targetRect.width * 100) / 100,
        height: Math.round(targetRect.height * 100) / 100
    });
    
    if (wrapper) {
        const wrapperRect = wrapper.getBoundingClientRect();
        console.log('wrapper:', wrapper.tagName, wrapper.className);
        console.log('wrapperRect:', {
            left: Math.round(wrapperRect.left * 100) / 100,
            top: Math.round(wrapperRect.top * 100) / 100,
            width: Math.round(wrapperRect.width * 100) / 100,
            height: Math.round(wrapperRect.height * 100) / 100
        });
        console.log('Calcul top:', Math.round((targetRect.top - wrapperRect.top - 1) * 100) / 100);
    }
    
    const canvas = document.getElementById('spectral-visualization');
    if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        console.log('canvas position:', {
            left: Math.round(canvasRect.left * 100) / 100,
            top: Math.round(canvasRect.top * 100) / 100,
            width: Math.round(canvasRect.width * 100) / 100,
            height: Math.round(canvasRect.height * 100) / 100
        });
    }
};

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
            title: "Longueur d'onde (μm)",
            range: [0, 50],
            fixedrange: true, // Désactiver le zoom
            tickfont: { color: 'white' }, // Valeurs de l'axe X en blanc
            titlefont: { color: 'white' }, // Titre de l'axe X en blanc
            showgrid: false, // Pas de grille verticale
            gridwidth: 1
        },
        yaxis: {
            title: "Luminance spectrale (W·m⁻²·μm⁻¹·sr⁻¹)",
            range: [0, 40],
            fixedrange: true, // Désactiver le zoom
            tickfont: { color: 'black', size: 12 },
            titlefont: { color: 'black', size: 14 }, // Titre de l'axe Y en noir pour visibilité
            showgrid: true,
            gridcolor: 'rgba(0, 0, 0, 0.5)', // Lignes horizontales noires à 50%
            gridwidth: 1
        },
        yaxis2: {
            title: "Altitude (km)",
            overlaying: 'y',
            side: 'right',
            range: [0, 120], // 0 km en bas, 120 km en haut
            fixedrange: true, // Désactiver le zoom
            position: 1.0,
            // Aligner les ticks avec l'axe Y principal
            // yaxis: 0-40, yaxis2: 0-120 km, facteur = 3
            // Utiliser le même espacement que yaxis (généralement 5 ou 10)
            tickmode: 'linear',
            dtick: 15, // 15 km par tick (correspond à 5 sur yaxis : 5 * 3 = 15)
            tickfont: { color: 'black', size: 12 },
            titlefont: { color: 'black', size: 14 },
            showline: true,
            linecolor: 'rgba(0, 0, 0, 0.5)',
            linewidth: 1,
            mirror: 'ticks',
            showgrid: false, // Pas de grille pour l'axe secondaire
            zeroline: false,
            visible: true
        },
        showlegend: false,
        margin: { l: 50, r: 100, t: 0, b: 0 }, // Marges réduites pour toucher les bords
        plot_bgcolor: 'rgba(0,0,0,0)', // Fond transparent
        paper_bgcolor: 'rgba(0,0,0,0)', // Fond du papier transparent
        annotations: [
            {
                x: 50, // À droite du graphique
                y: 40 * (11 / 120), // Position de la tropopause (11 km)
                text: 'Stratosphère 8.0K<br>Troposphère',
                showarrow: false,
                xref: 'x',
                yref: 'y',
                xanchor: 'left',
                yanchor: 'middle',
                font: { color: 'rgba(0, 0, 0, 0.5)', size: 11 } // Même couleur que le trait, pas de cadre
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
        // Calculer et définir la taille du canvas dès que Plotly est prêt
        // La bande sera dessinée automatiquement dans resizeCanvasToPlot()
        resizeCanvasToPlot();
    });
}

// Fonction pour redimensionner le canvas pour correspondre à la zone de plot Plotly
// Debounce pour éviter trop d'appels lors du resize
let resizeTimeout = null;
function debouncedResizeCanvas() {
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
        resizeCanvasToPlot();
        // Redessiner la visualisation spectrale si on a des données
        const canvas = document.getElementById('spectral-visualization');
        if (canvas && canvas._lastData) {
            drawSpectralVisualization(canvas, canvas._lastData);
        }
    }, 150);
}

// Flag pour éviter les appels multiples simultanés
let resizeCanvasInProgress = false;
let resizeCanvasRetryCount = 0;
const MAX_RETRY_COUNT = 5;

function resizeCanvasToPlot() {
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
            const hBarre = 16; // Hauteur de la barre en bas (réduite de 18px à 16px pour corriger l'offset)
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
            // Utiliser les dimensions calculées directement pour éviter tout délai
            // Calculer le resolutionFactor pour la barre (par défaut 1 si pas de réduction)
            const rect = canvas.getBoundingClientRect();
            const displayHeight = Math.floor(rect.height) || height;
            const resFactor = displayHeight / height;
            drawSpectrumBarOnlyWithSize(width, height, resFactor);
            
            resizeCanvasInProgress = false;
            resizeCanvasRetryCount = 0; // Réinitialiser le compteur en cas de succès
        } else {
            // Fallback : réessayer après un délai (limité pour éviter les boucles infinies)
            if (resizeCanvasRetryCount < MAX_RETRY_COUNT) {
                resizeCanvasRetryCount++;
                setTimeout(() => {
                    resizeCanvasInProgress = false;
                    resizeCanvasToPlot();
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
    // La barre doit toujours faire 16px en pixels d'affichage (réduite de 18px à 16px)
    // Ajuster la hauteur de la barre selon le facteur de résolution
    const spectrumBarHeight = Math.max(1, Math.floor(16 / resolutionFactor)); // 16px d'affichage
    const charWidth = 5; // 5px de chaque côté pour être derrière le 0 et le 50 μm
    
    // Nettoyer seulement la zone de la bande
    const spectrumBarY = height - spectrumBarHeight;
    ctx.clearRect(0, spectrumBarY, width, spectrumBarHeight);
    
    // Plage de l'axe X du graphique : 0 à 50 μm
    const graph_min_um = 0;
    const graph_max_um = 50;
    
    // Dessiner la bande de spectre en bas (18px d'affichage) avec alpha=1 pour toutes les couleurs
    for (let x = 0; x < width; x++) {
        // Mapper la position X à la longueur d'onde (0 à 50 μm)
        // Compenser le décalage de charWidth de chaque côté
        const effectiveWidth = width - (charWidth * 2);
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

// Mettre à jour le graphique
// Exposer globalement pour être accessible depuis calculations.js
window.updatePlot = function updatePlot(data) {
    const traces = [];
    
    if (!data.lambda_range) return;
    
    const lambda_planck = data.lambda_range.map(l => l * 1e6); // Convertir en μm
    const delta_lambda = data.lambda_range[1] - data.lambda_range[0];
    
    // Fonction helper pour créer une trace de flux observé (absorption)
    function createFluxTrace(flux_data, co2_ppm, temp_eff, color, label) {
        // Utiliser le flux calculé réellement par les formules (pas d'invention)
        const flux = flux_data.upward_flux[flux_data.upward_flux.length - 1]
            .map(f => f / delta_lambda / 1e6);
        return {
            x: lambda_planck,
            y: flux,
            type: 'scatter',
            mode: 'lines',
            name: label,
            line: { color: color, width: 2 },
            hovertemplate: label + '<extra></extra>'
        };
    }
    
    // Fonction helper pour créer une trace Planck
    function createPlanckTrace(T, label, color, showInLegend = false, dashPattern = 'dash') {
        const planck = data.lambda_range.map(l => {
            const value = Math.PI * (window.planckFunction || function() { return 0; })(l, T) / 1e6;
            // Pour 255K, s'assurer que la valeur est visible même si faible
            if (T === 255 && value < 0.01) {
                return 0.01; // Minimum visible
            }
            return value;
        });
        // Utiliser la couleur fournie (noir pour les références, couleur de l'absorption pour la courbe courante)
        const lineColor = color || 'black';
        return {
            x: lambda_planck,
            y: planck,
            type: 'scatter',
            mode: 'lines',
            name: label,
            line: { dash: dashPattern, width: 1, color: lineColor },
            showlegend: showInLegend,
            hovertemplate: showInLegend ? label + '<extra></extra>' : '<extra></extra>'
        };
    }
    
    // 1. Afficher toutes les courbes Planck de référence
    if (window.PLANCK_TEMPERATURES) {
        // Vérifier si getReferencePattern est disponible, sinon utiliser un fallback
        const getPattern = typeof window.getReferencePattern === 'function' 
            ? window.getReferencePattern 
            : function(index) {
                // Fallback : utiliser les 4 patterns disponibles directement
                const fallbackPatterns = ['dash', 'longdash', 'dashdot', 'longdashdot'];
                return fallbackPatterns[index % 4];
            };
        
        const totalCount = window.PLANCK_TEMPERATURES.length;
        window.PLANCK_TEMPERATURES.forEach((T, index) => {
            const label = `${T}K (${(T - 273.15).toFixed(0)}°C)`;
            // Utiliser la fonction pour obtenir le pattern
            const dashPattern = getPattern(index);
            const planck = createPlanckTrace(T, label, 'black', false, dashPattern); // Toutes en noir avec différents motifs
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
    if (data.current) {
        // Utiliser la température effective calculée par les formules
        const T_current = data.current.effective_temperature;
        
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
        
        // Courbe Planck correspondante (pointillée) à la température effective - petits points avec la même couleur que l'absorption
        const planck_current = createPlanckTrace(T_current, `Planck ${data.co2_ppm.toFixed(0)} ppm`, color_current, false, 'dot');
        planck_current.line.width = 0.5; // Très fine comme les autres courbes
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
    
    const z_max_km = 120; // Altitude max à 120 km
    const y_trop = 40 * (z_trop_km / z_max_km); // Position sur l'axe Y (0-40), 0 km = 0, 120 km = 40
    
    traces.push({
        x: [0, 50], // De 0 à 50 μm
        y: [y_trop, y_trop], // Ligne horizontale à la hauteur de la tropopause
        type: 'scatter',
        mode: 'lines',
        name: `Ligne de séparation (${z_trop_km.toFixed(1)} km)`,
        line: { color: 'rgba(0, 0, 0, 0.5)', width: 1, dash: 'dot' }, // Points au lieu de tirets
        showlegend: false,
        hovertemplate: `Ligne de séparation (${z_trop_km.toFixed(1)} km)<extra></extra>`,
        yaxis: 'y' // Utiliser l'axe Y principal
    });
    
    const updateLayout = {
        margin: { l: 50, r: 100, t: 0, b: 40 }, // Augmenter la marge droite pour l'axe altitude (100px)
        xaxis: { 
            range: [0, 50],
            fixedrange: true, // Désactiver le zoom
            title: "Longueur d'onde (μm)",
            tickfont: { color: 'white' }, // Valeurs de l'axe X en blanc
            titlefont: { color: 'white' }, // Titre de l'axe X en blanc
            showgrid: false, // Pas de grille verticale
            gridwidth: 1
        },
        yaxis: { 
            range: [0, 40],
            fixedrange: true, // Désactiver le zoom
            title: "Luminance spectrale (W·m⁻²·μm⁻¹·sr⁻¹)",
            tickfont: { color: 'black', size: 12 },
            titlefont: { color: 'black', size: 14 }, // Titre de l'axe Y en noir pour visibilité
            showgrid: true,
            gridcolor: 'rgba(0, 0, 0, 0.5)', // Lignes horizontales noires à 50%
            gridwidth: 1
        },
        yaxis2: {
            title: "Altitude (km)",
            overlaying: 'y',
            side: 'right',
            range: [0, 120], // 0 km en bas, 120 km en haut (même orientation que yaxis)
            fixedrange: true, // Désactiver le zoom
            position: 1.0,
            // Aligner les ticks avec l'axe Y principal
            // yaxis: 0-40, yaxis2: 0-120 km, facteur = 3
            // Utiliser le même espacement que yaxis (généralement 5 ou 10)
            tickmode: 'linear',
            dtick: 15, // 15 km par tick (correspond à 5 sur yaxis : 5 * 3 = 15)
            tickfont: { color: 'black', size: 12 },
            titlefont: { color: 'black', size: 14 },
            showline: true,
            linecolor: 'rgba(0, 0, 0, 0.5)',
            linewidth: 1,
            mirror: 'ticks',
            showgrid: false,
            zeroline: false,
            visible: true
        },
        plot_bgcolor: 'rgba(0,0,0,0)', // Fond transparent
        paper_bgcolor: 'rgba(0,0,0,0)', // Fond du papier transparent
        annotations: [
            {
                x: 50, // À droite du graphique
                y: y_trop, // Position de la tropopause (calculée dynamiquement)
                text: 'Stratosphère 8.0K<br>Troposphère',
                showarrow: false,
                xref: 'x',
                yref: 'y',
                xanchor: 'left',
                yanchor: 'middle',
                font: { color: 'rgba(0, 0, 0, 0.5)', size: 11 } // Même couleur que le trait, pas de cadre
            }
        ]
    };
    
    updateLayout.yaxis2 = {
        title: "Altitude (km)",
        overlaying: 'y',
        side: 'right',
        range: [0, 120], // 0 km en bas, 120 km en haut
        fixedrange: true, // Désactiver le zoom
        position: 1.0,
        // Aligner les ticks avec l'axe Y principal
        tickmode: 'linear',
        dtick: 15, // 15 km par tick (correspond à 5 sur yaxis : 5 * 3 = 15)
        tickfont: { color: 'black', size: 12 },
        titlefont: { color: 'black', size: 14 },
        showline: true,
        linecolor: 'rgba(0, 0, 0, 0.5)',
        linewidth: 1,
        mirror: 'ticks',
        showgrid: false,
        zeroline: false,
        visible: true
    };
    
    Plotly.react('plot-container', traces, updateLayout).then(() => {
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

// Fonction pour convertir une longueur d'onde en couleur RGB
// Les couleurs sont calées sur l'axe X du graphique (0 à 50 μm)
function wavelengthToColor(lambda_m, lambda_range_min, lambda_range_max) {
    const lambda_um = lambda_m * 1e6; // Convertir en μm
    
    // Séquence de couleurs mémorisée avec transitions smooth :
    // 0-3 μm : Noir → transition smooth vers violet UV
    // 3-20 μm : Transition directe du violet UV le plus possible jusqu'au rouge (sans passer par les autres couleurs)
    // 20-45 μm : Transition smooth du rouge vers orange, puis orange vers jaune
    // 45-50 μm : Jaune jusqu'à la fin (à droite)
    
    let r, g, b;
    
    if (lambda_um < 2.5) {
        // 0-2.5 μm : Noir pur
        r = 0;
        g = 0;
        b = 0;
    } else if (lambda_um < 3.5) {
        // 2.5-3.5 μm : Transition smooth noir → violet UV
        const ratio = (lambda_um - 2.5) / (3.5 - 2.5); // 0 à 1
        r = Math.round(ratio * 75); // 0 → 75
        g = 0;
        b = Math.round(ratio * 130); // 0 → 130
    } else if (lambda_um <= 19) {
        // 3.5-19 μm : Transition directe violet UV → rouge
        const normalized = (lambda_um - 3.5) / (19 - 3.5); // 0 à 1
        // Violet UV (75, 0, 130) → Rouge (255, 0, 0)
        r = Math.round(75 + normalized * (255 - 75)); // 75 → 255
        g = 0;
        b = Math.round(130 - normalized * 130); // 130 → 0
    } else if (lambda_um <= 45) {
        // 19-45 μm : Transition smooth rouge → orange → jaune (se déroule tranquillement)
        const normalized = (lambda_um - 19) / (45 - 19); // 0 à 1
        // Rouge (255, 0, 0) → Orange (255, 128, 0) → Jaune (255, 255, 0)
        r = 255; // Rouge reste à 255
        g = Math.round(normalized * 255); // 0 → 255 (rouge → orange → jaune)
        b = 0;
    } else {
        // 45-50 μm : Jaune jusqu'à la fin (à droite)
        r = 255;
        g = 255;
        b = 0;
    }
    
    return [r, g, b];
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
window.updateSpectralVisualization = function(data) {
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
    
    // La barre doit toujours faire 16px en pixels d'affichage (réduite de 18px à 16px pour corriger l'offset de 2px)
    // Ajuster la hauteur de la barre selon le facteur de résolution
    const spectrumBarHeight = Math.max(1, Math.floor(16 / resolutionFactor)); // 16px d'affichage (au lieu de 18px)
    const charWidth = 5; // 5px de chaque côté pour être derrière le 0 et le 50 μm
    
    // Nettoyer le canvas
    ctx.clearRect(0, 0, width, height);
    
    // Zone de visualisation principale (hauteur - barre pour la bande, sans padding en haut pour dessiner jusqu'en haut)
    // Augmentée de 2px pour compenser la réduction de la barre (18px -> 16px)
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
        // y=0 (en haut du canvas) → z=z_max (haute altitude)
        // y=max (en bas du canvas) → z=0 (sol)
        // Le spectre émis vient du sol, donc il doit être en bas visuellement
        // Ajouter topPadding pour décaler vers le bas
        const z_target = (visualizationHeight - 1 - y) * altitudePerPixel; // Inverser Y pour avoir le sol en bas
        
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
        
        // Utiliser upward_flux directement (comme avant - première version qui fonctionnait bien)
        // Au sol (z < 25m), utiliser earth_flux (courbe de Planck pure)
        let layerFlux;
        if (z < 25 && earth_flux) {
            layerFlux = earth_flux;
        } else {
            // Utiliser upward_flux directement (flux montant réel)
            layerFlux = upward_flux[layerIndex];
        }
        
        // Calculer le facteur de densité relative (diminue exponentiellement avec l'altitude)
        // Densité relative = exp(-z/H) où H est l'échelle de hauteur
        // Normaliser pour avoir 1 au sol (z=0) et diminuer avec l'altitude
        const densityFactor = Math.exp(-z / H);
        
        // À partir de 30 km, l'émission devient négligeable (densité très faible)
        // Appliquer une décroissance plus rapide au-delà de 30 km
        const z_km = z / 1000; // Altitude en km
        let densityAlpha;
        if (z_km >= 30) {
            // Au-delà de 30 km : décroissance très rapide vers 0
            // Utiliser une fonction qui tend rapidement vers 0
            const excess = z_km - 30; // Excès au-delà de 30 km
            const decayFactor = Math.exp(-excess / 2); // Décroissance rapide (échelle de 2 km)
            densityAlpha = densityFactor * decayFactor * 0.1; // Multiplier par 0.1 pour réduire encore plus
        } else {
            // En dessous de 30 km : utiliser le facteur de densité normal
            densityAlpha = densityFactor;
        }
        // Clamper entre 0 et 1.0
        densityAlpha = Math.max(0, Math.min(1.0, densityAlpha));
        
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
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            // Dessiner un rectangle plus large si on saute des pixels (pour combler les trous)
            // Dessiner directement sans padding pour aller jusqu'en haut
            const pixelWidth = xStep;
            const pixelHeight = yStep;
            ctx.fillRect(x, visualizationHeight - 1 - y, pixelWidth, pixelHeight); // Inverser Y pour avoir le sol en bas
        }
    }
    
    // Dessiner la barre de spectre en bas (utilise la fonction dédiée pour éviter la duplication)
    // Passer le resolutionFactor pour que la barre reste à 18px d'affichage
    drawSpectrumBarOnlyWithSize(width, height, resolutionFactor);
}

