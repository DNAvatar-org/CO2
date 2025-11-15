// ============================================================================
// GESTION DU GRAPHIQUE AVEC PLOTLY.JS
// ============================================================================

// Températures pour les courbes Planck de référence (en K)
window.PLANCK_TEMPERATURES = [120, 180, 225, 255, 275, 300, 330];

// Activer l'affichage des étapes de dichotomie par défaut
if (typeof window !== 'undefined') {
    window.showDichotomySteps = true;
}

// Fonction de couleur basée sur la température (palette avec couleurs très distinctes)
// Exposer globalement pour être accessible depuis main.js
window.tempToColor = function tempToColor(temp, temp_min = 120, temp_max = 330) {
    // Palette de couleurs très distinctes et contrastées
    const colorMap = {
        120: '#0000FF',  // Bleu foncé
        180: '#00BFFF',  // Bleu ciel
        225: '#00FF7F',  // Vert printemps
        255: '#228B22',  // Vert forêt
        275: '#FFD700',  // Or
        300: '#FF6347',  // Tomate
        330: '#DC143C'  // Rouge cramoisi
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
    
    if (canvas) {
        const canvasStyle = window.getComputedStyle(canvas);
        const canvasInline = canvas.style.zIndex;
        const canvasRect = canvas.getBoundingClientRect();
        console.log(`Canvas (#spectral-visualization):`);
        console.log(`  - Inline style: ${canvasInline || 'non défini'}`);
        console.log(`  - Computed: ${canvasStyle.zIndex}`);
        console.log(`  - Position: ${canvasStyle.position}`);
        console.log(`  - Display: ${canvasStyle.display}`);
        console.log(`  - Visibility: ${canvasStyle.visibility}`);
        console.log(`  - Opacity: ${canvasStyle.opacity}`);
        console.log(`  - Width: ${canvas.width}px, Height: ${canvas.height}px`);
        console.log(`  - BoundingRect: left=${canvasRect.left}, top=${canvasRect.top}, width=${canvasRect.width}, height=${canvasRect.height}`);
        console.log(`  - Parent: ${canvas.parentElement ? canvas.parentElement.className || canvas.parentElement.id : 'aucun'}`);
        console.log(`  - Next sibling: ${canvas.nextSibling ? (canvas.nextSibling.className || canvas.nextSibling.id || canvas.nextSibling.tagName) : 'aucun'}`);
        console.log(`  - Canvas visible: ${canvasRect.width > 0 && canvasRect.height > 0 ? 'OUI' : 'NON'}`);
    } else {
        console.log('Canvas: NON TROUVÉ');
    }
    
    if (title) {
        const titleStyle = window.getComputedStyle(title);
        console.log(`Titre (.plot-overlay-title):`);
        console.log(`  - Computed z-index: ${titleStyle.zIndex}`);
    }
    
    if (plotContainer) {
        const plotStyle = window.getComputedStyle(plotContainer);
        console.log(`Plot Container (#plot-container):`);
        console.log(`  - Computed z-index: ${plotStyle.zIndex}`);
    }
    
    // Vérifier les éléments Plotly
    if (plotContainer) {
        const plotlayers = plotContainer.querySelectorAll('.plotlayer, .cartesianlayer, .xaxislayer-above, .yaxislayer-above');
        console.log(`Éléments Plotly (${plotlayers.length} trouvés):`);
        plotlayers.forEach((el, i) => {
            const style = window.getComputedStyle(el);
            console.log(`  ${i+1}. ${el.className}: z-index=${style.zIndex}`);
        });
    }
    console.log('===================');
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
            tickfont: { color: 'white' }, // Valeurs de l'axe X en blanc
            titlefont: { color: 'white' }, // Titre de l'axe X en blanc
            showgrid: false, // Pas de grille verticale
            gridwidth: 1
        },
        yaxis: {
            title: "Luminance spectrale (W·m⁻²·μm⁻¹·sr⁻¹)",
            range: [0, 40],
            showgrid: true,
            gridcolor: 'rgba(0, 0, 0, 0.5)', // Lignes horizontales noires à 50%
            gridwidth: 1
        },
        yaxis2: {
            title: "Altitude (km)",
            overlaying: 'y',
            side: 'right',
            range: [0, 80], // 0 km en bas, 80 km en haut
            position: 1.0,
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
        margin: { l: 50, r: 100, t: 0, b: 40 }, // Augmenter la marge droite pour l'axe (100px)
        plot_bgcolor: 'rgba(0,0,0,0)', // Fond transparent
        paper_bgcolor: 'rgba(0,0,0,0)' // Fond du papier transparent
    };
    
    Plotly.newPlot('plot-container', [], layout, {
        responsive: true,
        displayModeBar: false
    }).then(() => {
        // Calculer et définir la taille du canvas dès que Plotly est prêt
        // La bande sera dessinée automatiquement dans resizeCanvasToPlot()
        resizeCanvasToPlot();
    });
}

// Fonction pour redimensionner le canvas pour correspondre à la zone de plot Plotly
function resizeCanvasToPlot() {
    const canvas = document.getElementById('spectral-visualization');
    const plotContainer = document.getElementById('plot-container');
    if (!canvas || !plotContainer) return;
    
    // Attendre un peu que Plotly ait fini de rendre
    setTimeout(() => {
        // Trouver tous les éléments pertinents
        const draglayer = plotContainer.querySelector('.nsewdrag.drag');
        const xy = plotContainer.querySelector('.xy');
        const draglayerCursor = plotContainer.querySelector('.draglayer.cursor-crosshair');
        const wrapper = plotContainer.parentElement;
        
        // Utiliser l'élément le plus approprié
        let targetElement = draglayer || xy || draglayerCursor;
        if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            // Ajouter une largeur de caractère de chaque côté pour couvrir 0 et 50 complètement
            const charWidth = 10; // Largeur approximative d'un caractère
            const width = Math.floor(targetRect.width) + (charWidth * 2);
            const height = Math.floor(targetRect.height) + 15; // +15px pour la bande de spectre
            
            // Positionner le canvas avec exactement la même position absolue que la zone de drag
            if (wrapper) {
                const wrapperRect = wrapper.getBoundingClientRect();
                const left = (targetRect.left - wrapperRect.left) - charWidth;
                const top = targetRect.top - wrapperRect.top;
                canvas.style.setProperty('left', left + 'px', 'important');
                canvas.style.setProperty('top', top + 'px', 'important');
            } else {
                // Fallback : position relative au plot-container
                const plotRect = plotContainer.getBoundingClientRect();
                const left = (targetRect.left - plotRect.left) - charWidth;
                const top = targetRect.top - plotRect.top;
                canvas.style.setProperty('left', left + 'px', 'important');
                canvas.style.setProperty('top', top + 'px', 'important');
            }
            
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            canvas.width = width;
            canvas.height = height;
            canvas.style.setProperty('z-index', '1', 'important');
            
            // Redessiner la bande de spectre immédiatement après le resize
            // Utiliser les dimensions calculées directement pour éviter tout délai
            drawSpectrumBarOnlyWithSize(width, height);
        } else {
            // Fallback : réessayer après un délai
            setTimeout(() => {
                resizeCanvasToPlot();
            }, 200);
        }
    }, 100);
}

// Fonction pour dessiner uniquement la bande de spectre de 15px (sans données)
function drawSpectrumBarOnly() {
    const canvas = document.getElementById('spectral-visualization');
    if (!canvas) return;
    drawSpectrumBarOnlyWithSize(canvas.width, canvas.height);
}

// Fonction pour dessiner la bande avec des dimensions spécifiques
function drawSpectrumBarOnlyWithSize(width, height) {
    const canvas = document.getElementById('spectral-visualization');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const spectrumBarHeight = 15; // Hauteur de la bande de spectre en bas
    const charWidth = 10; // Largeur de caractère ajoutée de chaque côté
    
    // Nettoyer seulement la zone de la bande
    const spectrumBarY = height - spectrumBarHeight;
    ctx.clearRect(0, spectrumBarY, width, spectrumBarHeight);
    
    // Plage de l'axe X du graphique : 0 à 50 μm
    const graph_min_um = 0;
    const graph_max_um = 50;
    
    // Dessiner la bande de spectre en bas (15px) avec alpha=1 pour toutes les couleurs
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
            const value = Math.PI * planckFunction(l, T) / 1e6;
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
        
        // Courbe d'absorption (pleine) - calculée réellement par les formules
        let color_current = 'red';
        if (data.co2_ppm === 0) color_current = 'cyan';
        else if (Math.abs(data.co2_ppm - 280) < 1) color_current = 'green';
        else if (Math.abs(data.co2_ppm - 420) < 1) color_current = 'gray';
        
        const trace_absorption = createFluxTrace(data.current, data.co2_ppm, T_current, color_current, 
            `${data.co2_ppm.toFixed(0)} ppm (absorption)`);
        trace_absorption.showlegend = false; // Pas dans la légende
        traces.push(trace_absorption);
        
        // Courbe Planck correspondante (pointillée) à la température effective - petits points avec la même couleur que l'absorption
        const planck_current = createPlanckTrace(T_current, `Planck ${data.co2_ppm.toFixed(0)} ppm`, color_current, false, 'dot');
        planck_current.line.width = 2; // Plus épaisse pour la courbe sélectionnée
        planck_current.line.color = color_current; // Même couleur que la courbe d'absorption
        traces.push(planck_current);
    }
    
    // 3. Ajouter une trace invisible pour forcer la création de l'axe yaxis2 (altitude)
    // Cette trace est nécessaire car Plotly ne crée un axe que s'il est utilisé par au moins une trace
    traces.push({
        x: [0, 0], // Points invisibles à x=0
        y: [0, 80], // De 0 à 80 km sur l'axe altitude
        type: 'scatter',
        mode: 'lines',
        name: 'Axe altitude',
        line: { color: 'rgba(0,0,0,0)', width: 0 }, // Invisible
        showlegend: false,
        hoverinfo: 'skip',
        yaxis: 'y2' // Utiliser l'axe secondaire (altitude)
    });
    
    // 4. Ajouter une ligne horizontale pour la tropopause (11 km)
    // Convertir 11 km en valeur de l'axe Y principal (0-40) pour l'aligner
    // L'axe altitude va de 0 à 80 km (0 en bas, 80 en haut), aligné avec l'axe Y principal (0 en bas, 40 en haut)
    // Donc 0 km altitude = 0 sur l'axe Y, 80 km = 40 sur l'axe Y
    // 11 km = 40 * (11/80) = 5.5 sur l'axe Y
    const z_trop_km = 11; // Tropopause à 11 km
    const z_max_km = 80; // Altitude max à 80 km
    const y_trop = 40 * (z_trop_km / z_max_km); // Position sur l'axe Y (0-40), 0 km = 0, 80 km = 40
    
    traces.push({
        x: [0, 50], // De 0 à 50 μm
        y: [y_trop, y_trop], // Ligne horizontale à la hauteur de la tropopause
        type: 'scatter',
        mode: 'lines',
        name: 'Tropopause (11 km)',
        line: { color: 'rgba(0, 0, 0, 0.5)', width: 1, dash: 'dash' },
        showlegend: false,
        hovertemplate: 'Tropopause (11 km)<extra></extra>',
        yaxis: 'y' // Utiliser l'axe Y principal
    });
    
    const updateLayout = {
        margin: { l: 50, r: 100, t: 0, b: 40 }, // Augmenter la marge droite pour l'axe altitude (100px)
        xaxis: { 
            range: [0, 50],
            title: "Longueur d'onde (μm)",
            tickfont: { color: 'white' }, // Valeurs de l'axe X en blanc
            titlefont: { color: 'white' }, // Titre de l'axe X en blanc
            showgrid: false, // Pas de grille verticale
            gridwidth: 1
        },
        yaxis: { 
            range: [0, 40],
            title: "Luminance spectrale (W·m⁻²·μm⁻¹·sr⁻¹)",
            showgrid: true,
            gridcolor: 'rgba(0, 0, 0, 0.5)', // Lignes horizontales noires à 50%
            gridwidth: 1
        },
        yaxis2: {
            title: "Altitude (km)",
            overlaying: 'y',
            side: 'right',
            range: [80, 0], // Inversé : 80 km en haut (correspond à y=0), 0 km en bas (correspond à y=40)
            position: 1.0,
            tickfont: { color: 'black', size: 12 },
            titlefont: { color: 'black', size: 14 },
            showline: true,
            linecolor: 'black',
            linewidth: 3,
            mirror: 'ticks',
            showgrid: false,
            zeroline: false,
            visible: true
        },
        plot_bgcolor: 'rgba(0,0,0,0)', // Fond transparent
        paper_bgcolor: 'rgba(0,0,0,0)' // Fond du papier transparent
    };
    
    updateLayout.yaxis2 = {
        title: "Altitude (km)",
        overlaying: 'y',
        side: 'right',
        range: [0, 80], // 0 km en bas, 80 km en haut
        position: 1.0,
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
    
    // Plage de l'axe X du graphique : 0 à 50 μm
    const graph_min_um = 0;
    const graph_max_um = 50;
    
    // Normaliser la position dans la plage du graphique
    const normalized = Math.max(0, Math.min(1, (lambda_um - graph_min_um) / (graph_max_um - graph_min_um)));
    
    // Mapper sur un arc-en-ciel complet (hue de 0 à 1)
    // 0 = rouge, 0.17 = jaune, 0.33 = vert, 0.5 = cyan, 0.67 = bleu, 0.83 = violet, 1 = rouge
    const hue = (1 - normalized) * 0.83; // Inverser pour avoir rouge à gauche, violet à droite
    const saturation = 1.0; // Saturation maximale
    const lightness = 0.6; // Luminosité augmentée pour des couleurs plus vives
    
    // Convertir HSL en RGB
    const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
    const m = lightness - c / 2;
    
    let r, g, b;
    if (hue < 1/6) {
        r = c; g = x; b = 0;
    } else if (hue < 2/6) {
        r = x; g = c; b = 0;
    } else if (hue < 3/6) {
        r = 0; g = c; b = x;
    } else if (hue < 4/6) {
        r = 0; g = x; b = c;
    } else if (hue < 5/6) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }
    
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    ];
}

// Fonction pour créer la visualisation spectrale
window.updateSpectralVisualization = function(data) {
    const canvas = document.getElementById('spectral-visualization');
    if (!canvas || !data || !data.upward_flux || !data.lambda_range || !data.z_range) {
        return;
    }
    
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
    
    // Redimensionner le canvas si nécessaire
    resizeCanvasToPlot();
    
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
    const width = canvas.width;
    const height = canvas.height;
    const spectrumBarHeight = 15; // Hauteur de la bande de spectre en bas
    const charWidth = 10; // Largeur de caractère ajoutée de chaque côté
    
    // Nettoyer le canvas
    ctx.clearRect(0, 0, width, height);
    
    // Zone de visualisation principale (hauteur - 15px pour la bande)
    const visualizationHeight = height - spectrumBarHeight;
    
    const upward_flux = data.upward_flux;
    const lambda_range = data.lambda_range;
    const z_range = data.z_range;
    
    // Trouver les valeurs min/max pour normaliser l'alpha
    // Utiliser les percentiles pour améliorer le contraste (ignorer les valeurs extrêmes)
    const allFluxes = [];
    for (let i = 0; i < upward_flux.length; i++) {
        for (let j = 0; j < upward_flux[i].length; j++) {
            allFluxes.push(upward_flux[i][j]);
        }
    }
    allFluxes.sort((a, b) => a - b);
    
    // Utiliser les percentiles 5% et 95% pour éviter les valeurs extrêmes qui écrasent le contraste
    const p5Index = Math.floor(allFluxes.length * 0.05);
    const p95Index = Math.floor(allFluxes.length * 0.95);
    const minFlux = allFluxes[p5Index] || allFluxes[0] || 0;
    const maxFlux = allFluxes[p95Index] || allFluxes[allFluxes.length - 1] || 1;
    const fluxRange = maxFlux - minFlux;
    
    // Plage de l'axe X du graphique : 0 à 50 μm
    const graph_min_um = 0;
    const graph_max_um = 50;
    
    // Calculer les facteurs d'échantillonnage pour les couches
    const layerStep = Math.max(1, Math.floor(upward_flux.length / visualizationHeight));
    
    // Dessiner chaque pixel de la visualisation principale
    for (let y = 0; y < visualizationHeight; y++) {
        // Une ligne sur layerStep couches
        const layerIndex = Math.floor(y * layerStep);
        if (layerIndex >= upward_flux.length) continue;
        
        const layerFlux = upward_flux[layerIndex];
        
        for (let x = 0; x < width; x++) {
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
            const flux = layerFlux[lambdaIndex];
            
            // Normaliser le flux pour l'alpha (0 à 1) avec étirement du contraste
            let normalized = fluxRange > 0 ? (flux - minFlux) / fluxRange : 0.5;
            // Clamper entre 0 et 1
            normalized = Math.max(0, Math.min(1, normalized));
            
            // Appliquer une courbe gamma pour améliorer le contraste
            const gamma = 0.7; // Légèrement moins agressif
            const alphaRaw = Math.pow(normalized, gamma);
            // Alpha minimum de 0, maximum 1.0
            const alpha = Math.max(0, Math.min(1.0, alphaRaw));
            
            // Obtenir la couleur pour cette longueur d'onde (calée sur l'axe X du graphique)
            const [r, g, b] = wavelengthToColor(lambda, lambda_range[0], lambda_range[lambda_range.length - 1]);
            
            // Dessiner le pixel avec alpha variable selon l'intensité du flux
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.fillRect(x, visualizationHeight - 1 - y, 1, 1); // Inverser Y pour avoir le sol en bas
        }
    }
    
    // Dessiner la bande de spectre en bas (15px) avec alpha=1 pour toutes les couleurs
    const spectrumBarY = visualizationHeight; // Commence après la visualisation principale
    for (let x = 0; x < width; x++) {
        // Mapper la position X à la longueur d'onde (0 à 50 μm)
        // Compenser le décalage de charWidth de chaque côté
        const effectiveWidth = width - (charWidth * 2);
        const normalizedX = Math.max(0, Math.min(1, (x - charWidth) / effectiveWidth)); // 0 à 1
        const lambda_um = graph_min_um + normalizedX * (graph_max_um - graph_min_um); // 0 à 50 μm
        const lambda_m = lambda_um * 1e-6; // Convertir en mètres
        
        // Obtenir la couleur pour cette longueur d'onde (calée sur l'axe X du graphique)
        const [r, g, b] = wavelengthToColor(lambda_m, lambda_range[0], lambda_range[lambda_range.length - 1]);
        
        // Dessiner la bande avec alpha=1 (opacité maximale)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, spectrumBarY, 1, spectrumBarHeight);
    }
}

