// ============================================================================
// COMPTEUR FPS
// ============================================================================
let fps = 0;
let fpsFrames = 0;
let fpsLastTime = performance.now();

// ============================================================================
// HORLOGE / TIMELINE
// ============================================================================
let timelineFrame = 0; // Nombre de frames écoulées
const YEARS_PER_FRAME = 100; // 1 frame = 100 ans (un doublement de CO2 prend ~100 ans)
// Note : Pour les sources industrielles ou volcaniques, on peut espérer un étalement dans le temps
let timelineRunning = false; // État de l'horloge (en pause par défaut)
let timelineLastUpdate = performance.now();
const TIMELINE_UPDATE_INTERVAL = 100; // Mise à jour toutes les 100ms (peut être ajusté)

function updateTimeline() {
    if (timelineRunning) {
        const currentTime = performance.now();
        const elapsed = currentTime - timelineLastUpdate;
        
        // Incrémenter les frames selon l'intervalle
        if (elapsed >= TIMELINE_UPDATE_INTERVAL) {
            timelineFrame++;
            timelineLastUpdate = currentTime;
        }
    }
    
    // Mettre à jour l'affichage
    const timelineDisplay = document.getElementById('timeline-display');
    const frameDisplay = document.getElementById('frame-display');
    
    if (timelineDisplay) {
        const years = timelineFrame * YEARS_PER_FRAME;
        timelineDisplay.textContent = `${years} ans`;
    }
    
    if (frameDisplay) {
        frameDisplay.textContent = timelineFrame.toString();
    }
    
    requestAnimationFrame(updateTimeline);
}

// Démarrer l'horloge
if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    requestAnimationFrame(updateTimeline);
}

function startTimeline() {
    timelineRunning = true;
    timelineLastUpdate = performance.now();
}

function pauseTimeline() {
    timelineRunning = false;
}

function resetTimeline() {
    timelineFrame = 0;
    timelineRunning = false;
    updateTimeline();
}

function updateFPS() {
    fpsFrames++;
    const currentTime = performance.now();
    const elapsed = currentTime - fpsLastTime;
    
    if (elapsed >= 1000) {
        fps = Math.round((fpsFrames * 1000) / elapsed);
        fpsFrames = 0;
        fpsLastTime = currentTime;
        
        const fpsDisplay = document.getElementById('fps-display');
        if (fpsDisplay) {
            fpsDisplay.textContent = `FPS: ${fps}`;
        }
    }
    
    requestAnimationFrame(updateFPS);
}

// Démarrer le compteur FPS dès que possible
if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    requestAnimationFrame(updateFPS);
}

// ============================================================================
// LOGIQUE PRINCIPALE
// ============================================================================

// États possibles : 0=0ppm, 1=280ppm (pré-industriel), 2=420ppm (actuel), 3+=multiplicateurs
let currentState = 2; // Commence à 420 ppm (usine) par défaut
let plotData = {
    lambda_range: null,
    current: null,
    co2_ppm: 0
};

// Valeurs de référence pour les boutons
const CO2_STATES = {
    0: 0,           // 0 ppm (iceberg)
    1: 280e-6,      // 280 ppm (pré-industriel, forêt)
    2: 420e-6,      // 420 ppm (actuel, usine) - DÉFAUT
    3: 560e-6       // 560 ppm (×2, volcan)
};

// Cache pour éviter de recalculer les scénarios de référence
// Note: PLANCK_TEMPERATURES est défini dans plot.js
let cache_280ppm = null;
let cache_420ppm = null;

function calculateInitialData() {
    initPlot();
    document.getElementById('status').textContent = 'Initialisation...';
    
    // Créer une grille lambda pour les courbes Planck
    const lambda_min = 0.1e-6;
    const lambda_max = 100e-6;
    const delta_lambda = 0.1e-6;
    plotData.lambda_range = [];
    for (let lambda = lambda_min; lambda < lambda_max; lambda += delta_lambda) {
        plotData.lambda_range.push(lambda);
    }
    
    // Afficher les courbes Planck de référence avant les calculs
    const tempPlotData = {
        lambda_range: plotData.lambda_range,
        current: null,
        co2_ppm: 0
    };
    updatePlot(tempPlotData);
    
    // Ne pas calculer les scénarios de référence (280ppm et 420ppm)
    // Commencer directement à 0 ppm par défaut sans calculer
    
    // Activer l'affichage des étapes de dichotomie pour les calculs interactifs
    if (typeof window !== 'undefined') {
        window.showDichotomySteps = true;
    }
    
    // Afficher les courbes de référence (Planck uniquement)
    updateLegend(plotData);
    updatePlot(plotData);
    
    // Initialiser à 0 ppm par défaut et calculer
    plotData.co2_ppm = 0;
    updateCO2Level(0); // 0 ppm - déclenche le calcul
}

function updateCO2Level(state) {
    currentState = state;
    // Gérer explicitement le cas state = 0 (0 ppm) car 0 est falsy en JavaScript
    let co2_fraction;
    if (state === 0) {
        co2_fraction = 0;
    } else if (CO2_STATES[state] !== undefined) {
        co2_fraction = CO2_STATES[state];
    } else {
        co2_fraction = CO2_STATES[3] * Math.pow(2, state - 3);
    }
    plotData.co2_ppm = co2_fraction * 1e6;
    
    document.getElementById('status').textContent = `Calcul pour ${plotData.co2_ppm.toFixed(0)} ppm...`;
    
    setTimeout(() => {
        // Calculer le scénario courant (peut retourner une Promise)
        const result = window.simulateRadiativeTransfer(co2_fraction);
        const processResult = (data) => {
            plotData.current = data;
            
            // Les scénarios de référence sont déjà calculés dans calculateInitialData
            // Juste s'assurer qu'ils sont stockés
            if (cache_280ppm) plotData.flux_280ppm = cache_280ppm;
            if (cache_420ppm) plotData.flux_420ppm = cache_420ppm;
            
            const temp_eff = plotData.current.effective_temperature;
            // Température effective sans effet de serre (référence) ~255K
            const temp_eff_0 = 255.0; // Température effective sans CO2 (approximation)
            // Température de surface calculée par dichotomie (équilibre radiatif avec CO2 uniquement)
            // Note: Les 15°C réels incluent aussi vapeur d'eau, nuages, etc. - ce modèle ne prend que le CO2
            const temp_surface = temperature(0); // Température au sol (z=0) ajustée par dichotomie
            const temp_surface_c = temp_surface - 273.15;
            const delta_temp = temp_eff - temp_eff_0;
            
            // Ajouter temp_surface_c à plotData pour que updatePlot puisse l'utiliser
            plotData.temp_surface_c = temp_surface_c;
            
            // Récupérer l'albedo et la couverture nuageuse depuis les résultats
            const albedo = plotData.current.albedo !== undefined ? plotData.current.albedo : null;
            const cloud_coverage = plotData.current.cloud_coverage !== undefined ? plotData.current.cloud_coverage : null;
            
            // Calculer les forçages radiatifs séparés
            const forcing_CO2 = typeof window.calculateCO2Forcing === 'function' 
                ? window.calculateCO2Forcing(plotData.co2_ppm * 1e-6) 
                : 0;
            const forcing_H2O = typeof window.calculateH2OForcing === 'function'
                ? window.calculateH2OForcing(typeof window.waterVaporEnabled !== 'undefined' ? window.waterVaporEnabled : false, cloud_coverage || 0)
                : 0;
            const forcing_Albedo = typeof window.calculateAlbedoForcing === 'function' && albedo !== null
                ? window.calculateAlbedoForcing(albedo)
                : 0;
            
            // Forçage total
            const forcing_total = forcing_CO2 + forcing_H2O + forcing_Albedo;
            
            updateDisplay({
                state: currentState,
                co2_ppm: plotData.co2_ppm,
                temp_surface: temp_surface,
                temp_surface_c: temp_surface_c,
                temp_eff: temp_eff,
                temp_eff_c: temp_eff - 273.15,
                delta_temp: delta_temp,
                forcing: forcing_total,
                forcing_CO2: forcing_CO2,
                forcing_H2O: forcing_H2O,
                forcing_Albedo: forcing_Albedo,
                albedo: albedo,
                cloud_coverage: cloud_coverage
            });
            
            updateLegend(plotData);
            updatePlot(plotData);
            // Mettre à jour la visualisation spectrale après un délai pour s'assurer que Plotly a fini
            setTimeout(() => {
                const canvas = document.getElementById('spectral-visualization');
                if (canvas) {
                    canvas.style.setProperty('display', 'block', 'important');
                    canvas.style.setProperty('visibility', 'visible', 'important');
                    canvas.style.setProperty('opacity', '1', 'important');
                    canvas.style.setProperty('z-index', '10000', 'important');
                    canvas.style.setProperty('position', 'absolute', 'important');
                }
                if (typeof window.updateSpectralVisualization === 'function' && plotData.current) {
                    window.updateSpectralVisualization(plotData.current);
                }
            }, 200);
            document.getElementById('status').textContent = 'Prêt';
        };
        
        if (result instanceof Promise) {
            result.then(processResult);
        } else {
            processResult(result);
        }
    }, 100);
}

function setIceberg() {
    // Forcer à 0 ppm
    currentState = 0;
    plotData.co2_ppm = 0;
    updateCO2Level(0); // 0 ppm
}

function setPreindustrial() {
    updateCO2Level(1); // 280 ppm
}

function setCurrent() {
    updateCO2Level(2); // 420 ppm
}

function divideCO2() {
    // Diviser le CO2 actuel par 2
    const current_ppm = plotData.co2_ppm;
    const new_ppm = current_ppm / 2;
    const new_fraction = new_ppm * 1e-6;
    
    // Trouver l'état correspondant ou créer un nouvel état
    if (new_ppm === 0) {
        updateCO2Level(0);
    } else if (Math.abs(new_ppm - 280) < 1) {
        updateCO2Level(1);
    } else if (Math.abs(new_ppm - 420) < 1) {
        updateCO2Level(2);
    } else {
        // État personnalisé : calculer le state à partir de la fraction
        plotData.co2_ppm = new_ppm;
        currentState = 3; // Utiliser state 3 comme base pour les valeurs personnalisées
        updateCO2LevelDirect(new_fraction);
    }
}

function multiplyCO2() {
    // Multiplier le CO2 actuel par 2
    const current_ppm = plotData.co2_ppm;
    // Cas spécial : si on est à 0 ppm, ×2 donne 1 ppm (pas 0)
    const new_ppm = (current_ppm === 0) ? 1 : (current_ppm * 2);
    const new_fraction = new_ppm * 1e-6;
    
    // Trouver l'état correspondant ou créer un nouvel état
    if (new_ppm === 0) {
        updateCO2Level(0);
    } else if (Math.abs(new_ppm - 280) < 1) {
        updateCO2Level(1);
    } else if (Math.abs(new_ppm - 420) < 1) {
        updateCO2Level(2);
    } else {
        // État personnalisé : calculer le state à partir de la fraction
        plotData.co2_ppm = new_ppm;
        currentState = 3; // Utiliser state 3 comme base pour les valeurs personnalisées
        updateCO2LevelDirect(new_fraction);
    }
}

// Variables pour gérer l'annulation des calculs en cours
let currentCalculationPromise = null;
let currentCalculationTimeouts = [];

function cancelCurrentCalculation() {
    // Annuler tous les timeouts en cours
    currentCalculationTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
    });
    currentCalculationTimeouts = [];
    
    // Annuler aussi les timeouts stockés dans calculations.js
    if (typeof window !== 'undefined' && window.calculationTimeouts) {
        window.calculationTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        window.calculationTimeouts = [];
    }
    
    // Marquer la Promise comme annulée
    if (currentCalculationPromise) {
        currentCalculationPromise = null;
    }
    
    // Marquer le calcul comme annulé dans calculations.js
    if (typeof window !== 'undefined') {
        window.cancelCalculation = true;
    }
}

function updateCO2LevelDirect(co2_fraction) {
    // Annuler tout calcul en cours avant de commencer un nouveau
    cancelCurrentCalculation();
    
    plotData.co2_ppm = co2_fraction * 1e6;
    
    document.getElementById('status').textContent = `Calcul pour ${plotData.co2_ppm.toFixed(0)} ppm...`;
    
    // Activer l'affichage des étapes de dichotomie pour le calcul courant
    if (typeof window !== 'undefined') {
        window.showDichotomySteps = true;
        window.cancelCalculation = false; // Réinitialiser le flag d'annulation
    }
    
    const timeoutId = setTimeout(() => {
        // Vérifier si le calcul a été annulé avant de commencer
        if (window.cancelCalculation) {
            return;
        }
        
        // Calculer le scénario courant (peut retourner une Promise)
        const result = window.simulateRadiativeTransfer(co2_fraction);
        currentCalculationPromise = result;
        
        const processResult = (data) => {
            // Vérifier si le calcul a été annulé
            if (window.cancelCalculation) {
                return;
            }
            
            // Retirer ce timeout de la liste
            const index = currentCalculationTimeouts.indexOf(timeoutId);
            if (index > -1) {
                currentCalculationTimeouts.splice(index, 1);
            }
            plotData.current = data;
            
            // Les scénarios de référence sont déjà calculés dans calculateInitialData
            // Juste s'assurer qu'ils sont stockés
            if (cache_280ppm) plotData.flux_280ppm = cache_280ppm;
            if (cache_420ppm) plotData.flux_420ppm = cache_420ppm;
            
            const temp_eff = plotData.current.effective_temperature;
            // Température effective sans effet de serre (référence) ~255K
            const temp_eff_0 = 255.0; // Température effective sans CO2 (approximation)
            // Température de surface calculée par dichotomie (équilibre radiatif avec CO2 uniquement)
            // Note: Les 15°C réels incluent aussi vapeur d'eau, nuages, etc. - ce modèle ne prend que le CO2
            const temp_surface = temperature(0); // Température au sol (z=0) ajustée par dichotomie
            const temp_surface_c = temp_surface - 273.15;
            const delta_temp = temp_eff - temp_eff_0;
            
            // Ajouter temp_surface_c à plotData pour que updatePlot puisse l'utiliser
            plotData.temp_surface_c = temp_surface_c;
            
            // Récupérer l'albedo et la couverture nuageuse depuis les résultats
            const albedo = plotData.current.albedo !== undefined ? plotData.current.albedo : null;
            const cloud_coverage = plotData.current.cloud_coverage !== undefined ? plotData.current.cloud_coverage : null;
            
            // Calculer les forçages radiatifs séparés
            const forcing_CO2 = typeof window.calculateCO2Forcing === 'function' 
                ? window.calculateCO2Forcing(plotData.co2_ppm * 1e-6) 
                : 0;
            const forcing_H2O = typeof window.calculateH2OForcing === 'function'
                ? window.calculateH2OForcing(typeof window.waterVaporEnabled !== 'undefined' ? window.waterVaporEnabled : false, cloud_coverage || 0)
                : 0;
            const forcing_Albedo = typeof window.calculateAlbedoForcing === 'function' && albedo !== null
                ? window.calculateAlbedoForcing(albedo)
                : 0;
            
            // Forçage total
            const forcing_total = forcing_CO2 + forcing_H2O + forcing_Albedo;
            
            updateDisplay({
                state: currentState,
                co2_ppm: plotData.co2_ppm,
                temp_surface: temp_surface,
                temp_surface_c: temp_surface_c,
                temp_eff: temp_eff,
                temp_eff_c: temp_eff - 273.15,
                delta_temp: delta_temp,
                forcing: forcing_total,
                forcing_CO2: forcing_CO2,
                forcing_H2O: forcing_H2O,
                forcing_Albedo: forcing_Albedo,
                albedo: albedo,
                cloud_coverage: cloud_coverage
            });
            
            updateLegend(plotData);
            updatePlot(plotData);
            // Mettre à jour la visualisation spectrale après un délai pour s'assurer que Plotly a fini
            setTimeout(() => {
                const canvas = document.getElementById('spectral-visualization');
                if (canvas) {
                    canvas.style.setProperty('display', 'block', 'important');
                    canvas.style.setProperty('visibility', 'visible', 'important');
                    canvas.style.setProperty('opacity', '1', 'important');
                    canvas.style.setProperty('z-index', '10000', 'important');
                    canvas.style.setProperty('position', 'absolute', 'important');
                }
                if (typeof window.updateSpectralVisualization === 'function' && plotData.current) {
                    window.updateSpectralVisualization(plotData.current);
                }
            }, 200);
            document.getElementById('status').textContent = 'Prêt';
        };
        
        if (result instanceof Promise) {
            result.then(processResult);
        } else {
            processResult(result);
        }
    }, 100);
}

function updateDisplay(data) {
    if (data && data.co2_ppm !== undefined) {
        const ppm = Math.round(data.co2_ppm);
        document.getElementById('co2-ppm').textContent = `${ppm} ppm`;
        
        // Mettre à jour l'emoji selon le niveau de CO2
        const emojiElement = document.getElementById('co2-emoji');
        if (emojiElement) {
            if (ppm === 0) {
                emojiElement.textContent = '🧊'; // Iceberg pour 0 ppm
            } else if (ppm < 200) {
                emojiElement.textContent = '🌵'; // Cactus pour très bas
            } else if (ppm < 350) {
                emojiElement.textContent = '🌲'; // Arbre pour pré-industriel (~280 ppm)
            } else if (ppm < 500) {
                emojiElement.textContent = '🏭'; // Usine pour actuel (~420 ppm)
            } else {
                emojiElement.textContent = '🌋'; // Volcan pour très élevé
            }
        }
    }
    
    // Mettre à jour le statut H2O avec le % de couverture nuageuse
    const h2oStatusElement = document.getElementById('h2o-status');
    if (h2oStatusElement) {
        if (data && data.cloud_coverage !== undefined) {
            // Afficher le % de couverture nuageuse (vue depuis le ciel)
            const cloudPercent = (data.cloud_coverage * 100).toFixed(0);
            h2oStatusElement.textContent = `${cloudPercent} %`;
        } else if (typeof window.waterVaporEnabled !== 'undefined') {
            // Si pas de données, afficher selon l'état H2O
            h2oStatusElement.textContent = window.waterVaporEnabled ? '-- %' : '0 %';
        } else {
            h2oStatusElement.textContent = '0 %';
        }
    }
    if (data && data.temp_surface !== undefined && data.temp_surface > 0) {
        document.getElementById('temp-surface').textContent = `${data.temp_surface.toFixed(1)} K (${data.temp_surface_c.toFixed(1)} °C)`;
    }
    if (data && data.temp_eff !== undefined && data.temp_eff > 0) {
        document.getElementById('temp-eff').textContent = `${data.temp_eff.toFixed(1)} K (${data.temp_eff_c.toFixed(1)} °C)`;
    }
    if (data && data.delta_temp !== undefined) {
        document.getElementById('delta-temp').textContent = `${data.delta_temp >= 0 ? '+' : ''}${data.delta_temp.toFixed(2)} K`;
    }
    // Mettre à jour les forçages séparés
    // CO2 : toujours avec + (même si 0)
    if (data && data.forcing_CO2 !== undefined) {
        document.getElementById('forcing-co2').textContent = `+${data.forcing_CO2.toFixed(2)} W/m²`;
    }
    // H2O : toujours avec + (même si 0)
    if (data && data.forcing_H2O !== undefined) {
        document.getElementById('forcing-h2o').textContent = `+${data.forcing_H2O.toFixed(2)} W/m²`;
    }
    // Alb. : toujours avec - (effet négatif sur le flux)
    if (data && data.forcing_Albedo !== undefined) {
        document.getElementById('forcing-albedo').textContent = `-${Math.abs(data.forcing_Albedo).toFixed(2)} W/m²`;
    }
    // Total : avec signe selon valeur
    if (data && data.forcing !== undefined) {
        document.getElementById('forcing-total').textContent = `${data.forcing >= 0 ? '+' : ''}${data.forcing.toFixed(2)} W/m²`;
    }
    
    // Mettre à jour l'albedo
    if (data && data.albedo !== undefined) {
        const albedoPercent = (data.albedo * 100).toFixed(1);
        document.getElementById('albedo-value').textContent = `${albedoPercent} %`;
    }
}

function updateLegend(data) {
    // Créer la légende avec les motifs de traits
    const grid = document.getElementById('legend-planck-grid');
    if (grid && window.PLANCK_TEMPERATURES) {
        grid.innerHTML = '';
        
        // Configuration de la grille : 2 colonnes (4 éléments dans la première)
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.gap = '8px 20px';
        
        // Trier les températures par ordre croissant
        const sortedTemps = [...window.PLANCK_TEMPERATURES].sort((a, b) => a - b);
        
        // Créer un élément pour chaque température
        sortedTemps.forEach((T, sortedIndex) => {
            // Trouver l'index original pour obtenir le bon motif
            const originalIndex = window.PLANCK_TEMPERATURES.indexOf(T);
            // Utiliser la fonction commune pour obtenir le pattern (même que dans plot.js)
            // IMPORTANT: utiliser originalIndex pour correspondre avec plot.js
            const dashPattern = typeof window.getReferencePattern === 'function' 
                ? window.getReferencePattern(originalIndex) 
                : 'dash'; // Fallback
            
            // Debug: vérifier que le pattern correspond
            console.log(`[LEGEND] T=${T}K, originalIndex=${originalIndex}, pattern=${dashPattern}`);
            
            const item = document.createElement('div');
            item.className = 'legend-planck-item';
            
            // Utiliser SVG pour dessiner le pattern (plus fiable que canvas)
            const patternSVG = typeof window.createDashPatternSVG === 'function'
                ? window.createDashPatternSVG(dashPattern)
                : `<svg width="50" height="4" style="vertical-align: middle; display: inline-block; margin-right: 8px;">
                    <line x1="2" y1="2" x2="48" y2="2" stroke="black" stroke-width="2.5"/>
                   </svg>`;
            
            // Créer un conteneur pour le SVG
            const patternContainer = document.createElement('div');
            patternContainer.innerHTML = patternSVG;
            patternContainer.style.display = 'inline-block';
            patternContainer.style.marginRight = '8px';
            patternContainer.style.verticalAlign = 'middle';
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'legend-text';
            labelSpan.textContent = `${T}K (${(T - 273.15).toFixed(0)}°C)`;
            
            item.appendChild(patternContainer);
            item.appendChild(labelSpan);
            grid.appendChild(item);
        });
        
        // Forcer le rendu MathJax après insertion
        if (window.MathJax && window.MathJax.typesetPromise) {
            setTimeout(() => {
                window.MathJax.typesetPromise([grid]).catch((err) => console.log('MathJax error:', err));
            }, 100);
        }
    }
}

// Fonction pour obtenir le style CSS de bordure selon le pattern
function getDashStyleForPattern(pattern) {
    switch(pattern) {
        case 'dash':
            return 'dashed';
        case 'dot':
            return 'dotted';
        case 'dashdot':
            return 'dashed'; // CSS ne supporte pas dashdot directement, on utilise dashed
        case 'longdash':
            return 'dashed';
        case 'longdashdot':
            return 'dashed';
        case 'solid':
        default:
            return 'solid';
    }
}

// Les fonctions createDashPatternSVG et getDashArray sont maintenant dans patterns.js

// Fonction pour activer/désactiver la vapeur d'eau
function toggleWaterVapor() {
    if (typeof window.waterVaporEnabled === 'undefined') {
        // Accéder directement à la variable globale si disponible
        console.warn('waterVaporEnabled non disponible, utilisation de la valeur par défaut');
        return;
    }
    
    window.waterVaporEnabled = !window.waterVaporEnabled;
    
    // Mettre à jour l'affichage H2O
    const h2oStatusElement = document.getElementById('h2o-status');
    if (h2oStatusElement) {
        // Afficher 0% si désactivé, sinon sera mis à jour lors du calcul
        h2oStatusElement.textContent = window.waterVaporEnabled ? '-- %' : '0 %';
    }
    
    const btn = document.getElementById('btn-cloud');
    if (btn) {
        if (window.waterVaporEnabled) {
            btn.style.opacity = '1';
            btn.style.border = '2px solid #4CAF50';
            btn.title = 'Vapeur d\'eau activée - Cliquer pour désactiver';
        } else {
            btn.style.opacity = '0.5';
            btn.style.border = '1px solid #ccc';
            btn.title = 'Activer/Désactiver vapeur d\'eau';
        }
    }
    
    // Recalculer avec la nouvelle configuration
    console.log(`Vapeur d'eau ${window.waterVaporEnabled ? 'activée' : 'désactivée'}`);
    
    // Vider le cache car les calculs changent avec H2O
    cache_280ppm = null;
    cache_420ppm = null;
    plotData.current = null;
    
    // Recalculer les données actuelles
    if (plotData.co2_ppm !== undefined && plotData.co2_ppm !== null) {
        const current_ppm = plotData.co2_ppm;
        updateCO2LevelDirect(current_ppm * 1e-6);
    } else {
        // Recalculer depuis l'état actuel
        updateCO2Level(currentState);
    }
}

// Fonction pour rétracter/déployer le panneau de référence
function toggleReferencePanel() {
    const container = document.querySelector('.reference-container');
    const icon = document.querySelector('.reference-toggle-icon');
    if (container) {
        container.classList.toggle('collapsed');
    }
}

// Exposer la fonction globalement
window.toggleReferencePanel = toggleReferencePanel;

window.addEventListener('DOMContentLoaded', () => {
    calculateInitialData();
    // Initialiser l'affichage de l'horloge
    resetTimeline();
});

