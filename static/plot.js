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

// Initialiser le graphique
function initPlot() {
    const layout = {
        xaxis: {
            title: "Longueur d'onde (μm)",
            range: [0, 50]
        },
        yaxis: {
            title: "Luminance spectrale (W·m⁻²·μm⁻¹·sr⁻¹)",
            range: [0, 40]
        },
        showlegend: false,
        margin: { l: 50, r: 10, t: 0, b: 40 },
        grid: { showgrid: true }
    };
    
    Plotly.newPlot('plot-container', [], layout, {
        responsive: true,
        displayModeBar: false
    });
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
    function createPlanckTrace(T, label, color, showInLegend = false) {
        const planck = data.lambda_range.map(l => {
            const value = Math.PI * planckFunction(l, T) / 1e6;
            // Pour 255K, s'assurer que la valeur est visible même si faible
            if (T === 255 && value < 0.01) {
                return 0.01; // Minimum visible
            }
            return value;
        });
        return {
            x: lambda_planck,
            y: planck,
            type: 'scatter',
            mode: 'lines',
            name: label,
            line: { dash: 'dash', width: 1, color: color },
            showlegend: showInLegend,
            hovertemplate: showInLegend ? label + '<extra></extra>' : '<extra></extra>'
        };
    }
    
    // 1. Afficher toutes les courbes Planck de référence
    if (window.PLANCK_TEMPERATURES) {
        window.PLANCK_TEMPERATURES.forEach((T, index) => {
            const normalized = index / (window.PLANCK_TEMPERATURES.length - 1);
            const color = tempToColor(T);
            const label = `${T}K (${(T - 273.15).toFixed(0)}°C)`;
            const planck = createPlanckTrace(T, label, color, false); // Pas de légende dans le graphique
            // Augmenter l'épaisseur pour les températures basses (plus visibles)
            if (T <= 180) {
                planck.line.width = 1.5;
            }
            // 255K : même style que les autres, seule la couleur change (vert forêt via tempToColor)
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
        
        // Courbe Planck correspondante (pointillée) à la température effective - toujours en gris avec dots
        const planck_current = createPlanckTrace(T_current, `Planck ${data.co2_ppm.toFixed(0)} ppm`, 'gray', false);
        planck_current.line.width = 2; // Plus épaisse pour la courbe sélectionnée
        planck_current.line.dash = 'dot'; // Points au lieu de tirets
        traces.push(planck_current);
    }
    
    Plotly.react('plot-container', traces, {
        margin: { l: 50, r: 10, t: 0, b: 40 },
        xaxis: { 
            range: [0, 50],
            title: "Longueur d'onde (μm)"
        },
        yaxis: { 
            range: [0, 40],
            title: "Luminance spectrale (W·m⁻²·μm⁻¹·sr⁻¹)"
        }
    }).then(() => {
        // S'assurer que la visualisation spectrale reste visible après la mise à jour Plotly
        setTimeout(() => {
            const canvas = document.getElementById('spectral-visualization');
            if (canvas) {
                // Toujours forcer la visibilité, même si on n'a pas de nouvelles données
                canvas.style.setProperty('display', 'block', 'important');
                canvas.style.setProperty('visibility', 'visible', 'important');
                canvas.style.setProperty('opacity', '1', 'important');
                canvas.style.setProperty('z-index', '10000', 'important');
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
    const lightness = 0.5; // Luminosité moyenne
    
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
    
    // Forcer la visibilité du canvas avec !important via setProperty
    canvas.style.setProperty('display', 'block', 'important');
    canvas.style.setProperty('visibility', 'visible', 'important');
    canvas.style.setProperty('opacity', '1', 'important');
    canvas.style.setProperty('z-index', '10000', 'important');
    canvas.style.setProperty('position', 'absolute', 'important');
    
    // Calculer la taille pour correspondre à la zone de drag de Plotly (nsewdrag drag)
    const plotContainer = document.getElementById('plot-container');
    if (plotContainer) {
        setTimeout(() => {
            // Trouver tous les éléments pertinents pour le debug
            const draglayer = plotContainer.querySelector('.nsewdrag.drag');
            const xy = plotContainer.querySelector('.xy');
            const draglayerCursor = plotContainer.querySelector('.draglayer.cursor-crosshair');
            const wrapper = plotContainer.parentElement;
            
            // Logs pour comprendre les positions
            console.log('[DEBUG POSITION] === Éléments trouvés ===');
            if (draglayer) {
                const dragRect = draglayer.getBoundingClientRect();
                console.log(`[DEBUG POSITION] .nsewdrag.drag: left=${dragRect.left}, top=${dragRect.top}, width=${dragRect.width}, height=${dragRect.height}`);
            } else {
                console.log('[DEBUG POSITION] .nsewdrag.drag: NON TROUVÉ');
            }
            
            if (xy) {
                const xyRect = xy.getBoundingClientRect();
                console.log(`[DEBUG POSITION] .xy: left=${xyRect.left}, top=${xyRect.top}, width=${xyRect.width}, height=${xyRect.height}`);
            } else {
                console.log('[DEBUG POSITION] .xy: NON TROUVÉ');
            }
            
            if (draglayerCursor) {
                const dragCursorRect = draglayerCursor.getBoundingClientRect();
                console.log(`[DEBUG POSITION] .draglayer.cursor-crosshair: left=${dragCursorRect.left}, top=${dragCursorRect.top}, width=${dragCursorRect.width}, height=${dragCursorRect.height}`);
            } else {
                console.log('[DEBUG POSITION] .draglayer.cursor-crosshair: NON TROUVÉ');
            }
            
            const plotRect = plotContainer.getBoundingClientRect();
            console.log(`[DEBUG POSITION] #plot-container: left=${plotRect.left}, top=${plotRect.top}, width=${plotRect.width}, height=${plotRect.height}`);
            
            if (wrapper) {
                const wrapperRect = wrapper.getBoundingClientRect();
                console.log(`[DEBUG POSITION] .plot-container-wrapper: left=${wrapperRect.left}, top=${wrapperRect.top}, width=${wrapperRect.width}, height=${wrapperRect.height}`);
            }
            
            const canvasRect = canvas.getBoundingClientRect();
            console.log(`[DEBUG POSITION] #spectral-visualization (avant): left=${canvasRect.left}, top=${canvasRect.top}, width=${canvasRect.width}, height=${canvasRect.height}`);
            
            // Utiliser l'élément le plus approprié
            let targetElement = draglayer || xy || draglayerCursor;
            if (targetElement) {
                const targetRect = targetElement.getBoundingClientRect();
                const width = Math.floor(targetRect.width);
                const height = Math.floor(targetRect.height);
                
                console.log(`[DEBUG POSITION] Élément cible utilisé: ${targetElement.className || targetElement.tagName}`);
                console.log(`[DEBUG POSITION] Taille cible: width=${width}, height=${height}`);
                
                // Positionner le canvas avec exactement la même position absolue que la zone de drag
                // Le canvas est dans plot-container-wrapper, donc on doit calculer par rapport à son parent
                if (wrapper) {
                    const wrapperRect = wrapper.getBoundingClientRect();
                    const left = targetRect.left - wrapperRect.left;
                    const top = targetRect.top - wrapperRect.top;
                    console.log(`[DEBUG POSITION] Calcul position: left=${left} (${targetRect.left} - ${wrapperRect.left}), top=${top} (${targetRect.top} - ${wrapperRect.top})`);
                    // Utiliser setProperty avec !important pour forcer la position (le CSS a !important)
                    canvas.style.setProperty('left', left + 'px', 'important');
                    canvas.style.setProperty('top', top + 'px', 'important');
                } else {
                    // Fallback : position relative au plot-container
                    const left = targetRect.left - plotRect.left;
                    const top = targetRect.top - plotRect.top;
                    console.log(`[DEBUG POSITION] Calcul position (fallback): left=${left}, top=${top}`);
                    canvas.style.setProperty('left', left + 'px', 'important');
                    canvas.style.setProperty('top', top + 'px', 'important');
                }
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
                canvas.width = width;
                canvas.height = height;
                
                // Log position finale
                setTimeout(() => {
                    const finalRect = canvas.getBoundingClientRect();
                    console.log(`[DEBUG POSITION] #spectral-visualization (après): left=${finalRect.left}, top=${finalRect.top}, width=${finalRect.width}, height=${finalRect.height}`);
                    if (targetElement) {
                        const targetRectFinal = targetElement.getBoundingClientRect();
                        console.log(`[DEBUG POSITION] Différence: left=${finalRect.left - targetRectFinal.left}, top=${finalRect.top - targetRectFinal.top}`);
                    }
                }, 50);
            } else {
                // Fallback : attendre un peu plus que Plotly soit prêt
                setTimeout(() => {
                    const draglayerRetry = plotContainer.querySelector('.nsewdrag.drag');
                    if (draglayerRetry) {
                        const dragRect = draglayerRetry.getBoundingClientRect();
                        const plotRect = plotContainer.getBoundingClientRect();
                        const wrapper = plotContainer.parentElement;
                        const width = Math.floor(dragRect.width);
                        const height = Math.floor(dragRect.height);
                        if (wrapper) {
                            const wrapperRect = wrapper.getBoundingClientRect();
                            canvas.style.setProperty('left', (dragRect.left - wrapperRect.left) + 'px', 'important');
                            canvas.style.setProperty('top', (dragRect.top - wrapperRect.top) + 'px', 'important');
                        } else {
                            canvas.style.setProperty('left', (dragRect.left - plotRect.left) + 'px', 'important');
                            canvas.style.setProperty('top', (dragRect.top - plotRect.top) + 'px', 'important');
                        }
                        canvas.style.width = width + 'px';
                        canvas.style.height = height + 'px';
                        canvas.width = width;
                        canvas.height = height;
                        drawSpectralVisualization(canvas, data);
                    }
                }, 200);
                return;
            }
            
            // Forcer à nouveau la visibilité après le redimensionnement
            canvas.style.setProperty('display', 'block', 'important');
            canvas.style.setProperty('visibility', 'visible', 'important');
            canvas.style.setProperty('opacity', '1', 'important');
            canvas.style.setProperty('z-index', '10000', 'important');
            canvas.style.setProperty('position', 'absolute', 'important');
            
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
    
    // Nettoyer le canvas
    ctx.clearRect(0, 0, width, height);
    
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
    const layerStep = Math.max(1, Math.floor(upward_flux.length / height));
    
    // Dessiner chaque pixel
    for (let y = 0; y < height; y++) {
        // Une ligne sur layerStep couches
        const layerIndex = Math.floor(y * layerStep);
        if (layerIndex >= upward_flux.length) continue;
        
        const layerFlux = upward_flux[layerIndex];
        
        for (let x = 0; x < width; x++) {
            // Mapper la position X du canvas directement à la longueur d'onde (0 à 50 μm)
            const normalizedX = x / width; // 0 à 1
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
            // Mais avec un alpha minimum pour toujours voir les couleurs (même très atténuées)
            const gamma = 0.7; // Légèrement moins agressif
            const alphaRaw = Math.pow(normalized, gamma);
            // Alpha minimum de 0.1 pour toujours voir les couleurs, maximum 1.0
            const alpha = Math.max(0.1, Math.min(1.0, alphaRaw));
            
            // Obtenir la couleur pour cette longueur d'onde (calée sur l'axe X du graphique)
            const [r, g, b] = wavelengthToColor(lambda, lambda_range[0], lambda_range[lambda_range.length - 1]);
            
            // Dessiner le pixel avec alpha variable selon l'intensité du flux
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.fillRect(x, height - 1 - y, 1, 1); // Inverser Y pour avoir le sol en bas
        }
    }
}

