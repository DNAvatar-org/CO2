// ============================================================================
// COMPTEUR FPS
// ============================================================================
let fps = 0;
let fpsFrames = 0;
let fpsLastTime = performance.now();

// ============================================================================
// GESTION DES BOUTONS (désactivation pendant les calculs)
// ============================================================================
let calculationInProgress = false; // État du calcul en cours

// ============================================================================
// SYSTÈME DE VOLCANS (effet sur H2O et glace)
// ============================================================================
// Variable globale pour suivre l'effet cumulatif des volcans
// Chaque volcan augmente H2O de 1% et diminue la glace de 1%
let volcanoH2OBonus = 0; // Bonus H2O en % (0 à 100)
let volcanoIceReduction = 0; // Réduction de glace en % (0 à 100)

// Exposer globalement pour les calculs
if (typeof window !== 'undefined') {
    window.volcanoH2OBonus = 0;
    window.volcanoIceReduction = 0;
}

// Fonction pour désactiver tous les boutons
function disableButtons() {
    calculationInProgress = true;
    const buttons = [
        'btn-iceberg', 'btn-forest', 'btn-factory',
        'btn-desert', 'btn-volcano', 'btn-cloud'
    ];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = true;
            // Pour le bouton cloud, préserver son style spécifique mais le griser quand même
            if (btnId === 'btn-cloud') {
                // Sauvegarder l'opacity actuelle pour la restaurer après
                if (!btn.dataset.originalOpacity) {
                    btn.dataset.originalOpacity = btn.style.opacity || '0.5';
                }
                btn.style.opacity = '0.3'; // Plus grisé que les autres pour indiquer la désactivation
            } else {
                btn.style.opacity = '0.5';
            }
            btn.style.cursor = 'not-allowed';
        }
    });
}

// Fonction pour réactiver tous les boutons
function enableButtons() {
    calculationInProgress = false;
    const buttons = [
        'btn-iceberg', 'btn-forest', 'btn-factory',
        'btn-desert', 'btn-volcano', 'btn-cloud'
    ];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            // Pour le bouton cloud, restaurer son style spécifique (opacity et border)
            if (btnId === 'btn-cloud') {
                // Restaurer l'opacity originale sauvegardée, ou utiliser le style de toggleWaterVapor
                if (btn.dataset.originalOpacity) {
                    btn.style.opacity = btn.dataset.originalOpacity;
                    delete btn.dataset.originalOpacity;
                } else {
                    // Si pas de sauvegarde, utiliser le style selon l'état de waterVaporEnabled
                    if (typeof window.waterVaporEnabled !== 'undefined' && window.waterVaporEnabled) {
                        btn.style.opacity = '1';
                    } else {
                        btn.style.opacity = '0.5';
                    }
                }
            } else {
                btn.style.opacity = '1';
            }
        }
    });
}

// ============================================================================
// HORLOGE / TIMELINE
// ============================================================================
let timelineFrame = 0; // Nombre de frames écoulées
const YEARS_PER_FRAME = 100; // 1 frame = 100 ans (un doublement de CO2 prend ~100 ans)
// Note : Pour les sources industrielles ou volcaniques, on peut espérer un étalement dans le temps
let timelineRunning = false; // État de l'horloge (désactivée par défaut - ne s'incrémente que lors des calculs/clics)
let timelineLastUpdate = performance.now();
const TIMELINE_UPDATE_INTERVAL = 1000; // Mise à jour toutes les 1000ms (1 seconde = 100 ans) - UNIQUEMENT si timelineRunning = true

function updateTimeline() {
    // Mettre à jour l'affichage (toujours, même si timelineRunning = false)
    const timelineDisplay = document.getElementById('timeline-display');
    const frameDisplay = document.getElementById('frame-display');
    const infoTimeDisplay = document.getElementById('info-time');
    
    const years = timelineFrame * YEARS_PER_FRAME;
    
    // Formater les années avec M (Mega) et M̅ (Milliard avec barre)
    const formattedYears = formatYears(years);
    
    if (timelineDisplay) {
        timelineDisplay.textContent = `⏳ ${formattedYears}`;
    }
    
    if (frameDisplay) {
        frameDisplay.textContent = timelineFrame.toString();
    }
    
    // Mettre à jour l'horloge dans l'en-tête d'info (prioritaire)
    if (infoTimeDisplay) {
        infoTimeDisplay.textContent = `⏳ ${formattedYears}`;
        infoTimeDisplay.style.display = 'inline-block';
        infoTimeDisplay.style.visibility = 'visible';
        infoTimeDisplay.style.opacity = '1';
    }
    
    // Incrémenter automatiquement UNIQUEMENT si timelineRunning = true
    if (timelineRunning) {
        const currentTime = performance.now();
        const elapsed = currentTime - timelineLastUpdate;
        
        // Incrémenter les frames selon l'intervalle
        if (elapsed >= TIMELINE_UPDATE_INTERVAL) {
            timelineFrame++;
            timelineLastUpdate = currentTime;
            const years = timelineFrame * YEARS_PER_FRAME;
            // Mettre à jour l'affichage immédiatement après l'incrémentation
            const formattedYears = formatYears(years);
            if (timelineDisplay) timelineDisplay.textContent = `⏳ ${formattedYears}`;
            if (frameDisplay) frameDisplay.textContent = timelineFrame.toString();
            if (infoTimeDisplay) infoTimeDisplay.textContent = `⏳ ${formattedYears}`;
        }
    }
    
    requestAnimationFrame(updateTimeline);
}

// Fonction pour formater les années avec M (Mega) et M̅ (Milliard)
// Format : 0M0M8200 ans (exemple : 1 milliard 200 millions 50 mille ans)
function formatYears(years) {
    if (years === 0) return '0 ans';
    
    const MILLIARD = 1e9; // 1 milliard
    const MEGA = 1e6;    // 1 million
    const MILLE = 1e3;   // 1 mille
    
    let result = '';
    let remaining = years;
    
    // Milliards (M̅ avec barre au-dessus)
    if (remaining >= MILLIARD) {
        const milliards = Math.floor(remaining / MILLIARD);
        result += `${milliards}M̅`;
        remaining = remaining % MILLIARD;
    } else {
        result += '0M̅';
    }
    
    // Millions (M)
    if (remaining >= MEGA) {
        const millions = Math.floor(remaining / MEGA);
        result += `${millions}M`;
        remaining = remaining % MEGA;
    } else {
        result += '0M';
    }
    
    // Milliers et unités
    if (remaining > 0) {
        result += remaining.toString();
    } else if (result === '0M̅0M') {
        result = '0';
    }
    
    return result + ' ans';
}

// Fonction pour incrémenter le temps de 100 ans
function incrementTimeline() {
    timelineFrame++;
    updateTimeline();
}

// Démarrer l'horloge
if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    requestAnimationFrame(updateTimeline);
}

function startTimeline() {
    timelineRunning = true;
    timelineLastUpdate = performance.now();
    updateTimeline();
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
            // Calculer ΔT° à partir du forçage radiatif (calibration)
            // ΔT° = différence par rapport à 255K (sans CO2)
            // On calcule d'abord les forçages, puis on calcule delta_temp
            // (sera calculé après les forçages)
            let delta_temp = 0; // Sera calculé après
            
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
            
            // Calculer ΔT° à partir du forçage radiatif (calibration)
            // ΔT° = différence par rapport à 255K (sans CO2)
            // Sensibilité climatique calibrée pour correspondre aux observations
            // Avec forçage -128.26 W/m² → ΔT° -56.11K, sensibilité = 0.44 K/(W/m²)
            const CLIMATE_SENSITIVITY = 0.44; // K/(W/m²) - sensibilité climatique calibrée
            // ΔT° calculé à partir du forçage (plus cohérent physiquement)
            delta_temp = forcing_total * CLIMATE_SENSITIVITY;
            
            // Calculer ΔT° par rapport à la température optimale habitable (15°C = 288K)
            const TEMP_HABITABLE_OPTIMAL = 288; // 15°C
            const TEMP_HABITABLE_MIN = 253; // -20°C
            const TEMP_HABITABLE_MAX = 323; // 50°C
            const delta_temp_habitable = temp_surface - TEMP_HABITABLE_OPTIMAL;
            const life_viable = temp_surface >= TEMP_HABITABLE_MIN && temp_surface <= TEMP_HABITABLE_MAX;
            
            updateDisplay({
                state: currentState,
                co2_ppm: plotData.co2_ppm,
                temp_surface: temp_surface,
                temp_surface_c: temp_surface_c,
                temp_eff: temp_eff,
                temp_eff_c: temp_eff - 273.15,
                delta_temp: delta_temp,
                delta_temp_habitable: delta_temp_habitable,
                life_viable: life_viable,
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
            enableButtons(); // Réactiver les boutons quand la courbe est stabilisée
        };
        
        if (result instanceof Promise) {
            result.then(processResult);
        } else {
            processResult(result);
        }
    }, 100);
}

function setIceberg() {
    if (calculationInProgress) return; // Bloquer si calcul en cours
    // Forcer à 0 ppm
    currentState = 0;
    plotData.co2_ppm = 0;
    incrementTimeline(); // +100 ans
    disableButtons(); // Désactiver les boutons
    updateCO2Level(0); // 0 ppm
}

function setPreindustrial() {
    if (calculationInProgress) return; // Bloquer si calcul en cours
    incrementTimeline(); // +100 ans
    disableButtons(); // Désactiver les boutons
    updateCO2Level(1); // 280 ppm
}

function setCurrent() {
    if (calculationInProgress) return; // Bloquer si calcul en cours
    incrementTimeline(); // +100 ans
    disableButtons(); // Désactiver les boutons
    updateCO2Level(2); // 420 ppm
}

function divideCO2() {
    if (calculationInProgress) return; // Bloquer si calcul en cours
    // Diviser le CO2 actuel par 2
    const current_ppm = plotData.co2_ppm;
    const new_ppm = current_ppm / 2;
    const new_fraction = new_ppm * 1e-6;
    
    incrementTimeline(); // +100 ans
    disableButtons(); // Désactiver les boutons
    
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
    if (calculationInProgress) return; // Bloquer si calcul en cours
    
    // ⚠️ MODIFICATION POUR GAMEPLAY : Un volcan ajoute une quantité fixe de CO2
    // Au lieu de multiplier par 2, on ajoute l'équivalent d'un gros volcan
    // Référence : Éruption du Pinatubo (1991) ≈ 20 Mt de SO2, mais CO2 aussi
    // Pour un gros volcan : ~100-200 ppm de CO2 supplémentaire (approximation créative)
    const VOLCAN_CO2_ADDITION = 150; // ppm de CO2 ajoutés par un gros volcan
    
    const current_ppm = plotData.co2_ppm;
    const new_ppm = current_ppm + VOLCAN_CO2_ADDITION;
    const new_fraction = new_ppm * 1e-6;
    
    // Effet volcanique : augmenter H2O de 1% et diminuer la glace de 1%
    volcanoH2OBonus = Math.min(100, volcanoH2OBonus + 1); // Maximum 100%
    volcanoIceReduction = Math.min(100, volcanoIceReduction + 1); // Maximum 100%
    
    // Exposer globalement pour les calculs
    if (typeof window !== 'undefined') {
        window.volcanoH2OBonus = volcanoH2OBonus;
        window.volcanoIceReduction = volcanoIceReduction;
    }
    
    incrementTimeline(); // +100 ans
    disableButtons(); // Désactiver les boutons
    
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
            // Calculer ΔT° à partir du forçage radiatif (calibration)
            // ΔT° = différence par rapport à 255K (sans CO2)
            // On calcule d'abord les forçages, puis on calcule delta_temp
            // (sera calculé après les forçages)
            let delta_temp = 0; // Sera calculé après
            
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
            
            // Calculer ΔT° à partir du forçage radiatif (calibration)
            // ΔT° = différence par rapport à 255K (sans CO2)
            // Sensibilité climatique calibrée pour correspondre aux observations
            // Avec forçage -128.26 W/m² → ΔT° -56.11K, sensibilité = 0.44 K/(W/m²)
            const CLIMATE_SENSITIVITY = 0.44; // K/(W/m²) - sensibilité climatique calibrée
            // ΔT° calculé à partir du forçage (plus cohérent physiquement)
            delta_temp = forcing_total * CLIMATE_SENSITIVITY;
            
            // Calculer ΔT° par rapport à la température optimale habitable (15°C = 288K)
            const TEMP_HABITABLE_OPTIMAL = 288; // 15°C
            const TEMP_HABITABLE_MIN = 253; // -20°C
            const TEMP_HABITABLE_MAX = 323; // 50°C
            const delta_temp_habitable = temp_surface - TEMP_HABITABLE_OPTIMAL;
            const life_viable = temp_surface >= TEMP_HABITABLE_MIN && temp_surface <= TEMP_HABITABLE_MAX;
            
            updateDisplay({
                state: currentState,
                co2_ppm: plotData.co2_ppm,
                temp_surface: temp_surface,
                temp_surface_c: temp_surface_c,
                temp_eff: temp_eff,
                temp_eff_c: temp_eff - 273.15,
                delta_temp: delta_temp,
                delta_temp_habitable: delta_temp_habitable,
                life_viable: life_viable,
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
            enableButtons(); // Réactiver les boutons quand la courbe est stabilisée
        };
        
        if (result instanceof Promise) {
            result.then(processResult);
        } else {
            processResult(result);
        }
    }, 100);
}

// Exposer updateDisplay globalement pour être accessible depuis calculations.js
window.updateDisplay = function updateDisplay(data) {
    if (data && data.co2_ppm !== undefined) {
        const ppm = Math.round(data.co2_ppm);
        const co2NumberEl = document.getElementById('co2-number');
        if (co2NumberEl) {
            co2NumberEl.textContent = ppm.toString();
        }
        
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
        const tempSurfaceEl = document.getElementById('temp-surface');
        if (tempSurfaceEl) {
            tempSurfaceEl.textContent = `${' '.repeat(5)}${data.temp_surface.toFixed(1)}K (${data.temp_surface_c >= 0 ? '+' : ''}${data.temp_surface_c.toFixed(1)}°C)`;
        }
    } else {
        const tempSurfaceEl = document.getElementById('temp-surface');
        if (tempSurfaceEl) {
            tempSurfaceEl.textContent = '--';
        }
    }
    if (data && data.temp_eff !== undefined && data.temp_eff > 0) {
        const tempEffEl = document.getElementById('temp-eff');
        if (tempEffEl) {
            tempEffEl.textContent = `${' '.repeat(5)}${data.temp_eff.toFixed(1)}K (${data.temp_eff_c >= 0 ? '+' : ''}${data.temp_eff_c.toFixed(1)}°C)`;
        }
    } else {
        const tempEffEl = document.getElementById('temp-eff');
        if (tempEffEl) {
            tempEffEl.textContent = '--';
        }
    }
    if (data && data.delta_temp !== undefined) {
        const deltaTempEl = document.getElementById('delta-temp');
        if (deltaTempEl) {
            deltaTempEl.textContent = `${' '.repeat(5)}${data.delta_temp >= 0 ? '+' : ''}${data.delta_temp.toFixed(2)}K`;
        }
    } else {
        const deltaTempEl = document.getElementById('delta-temp');
        if (deltaTempEl) {
            deltaTempEl.textContent = '--';
        }
    }
    
    // Afficher ΔT° habitable et indicateur de viabilité
    if (data && data.delta_temp_habitable !== undefined) {
        const deltaTempHabitableEl = document.getElementById('delta-temp-habitable');
        if (deltaTempHabitableEl) {
            deltaTempHabitableEl.textContent = `${' '.repeat(5)}${data.delta_temp_habitable >= 0 ? '+' : ''}${data.delta_temp_habitable.toFixed(2)}K`;
        }
        
        // Indicateur de viabilité
        const lifeIndicatorEl = document.getElementById('life-indicator');
        if (lifeIndicatorEl) {
            if (data.life_viable) {
                lifeIndicatorEl.textContent = '🌱'; // Vie possible
            } else {
                lifeIndicatorEl.textContent = '💀'; // Vie impossible
            }
        }
    } else {
        const deltaTempHabitableEl = document.getElementById('delta-temp-habitable');
        if (deltaTempHabitableEl) {
            deltaTempHabitableEl.textContent = '--';
        }
        const lifeIndicatorEl = document.getElementById('life-indicator');
        if (lifeIndicatorEl) {
            lifeIndicatorEl.textContent = '--';
        }
    }
    // Mettre à jour les forçages séparés (sans unité, elle est en haut)
    // CO2 : toujours avec + (même si 0)
    const forcingCO2El = document.getElementById('forcing-co2');
    if (forcingCO2El) {
        if (data && data.forcing_CO2 !== undefined) {
            forcingCO2El.textContent = `+${data.forcing_CO2.toFixed(2)}`;
        } else {
            forcingCO2El.textContent = '--';
        }
    }
    // H2O : toujours avec + (même si 0)
    const forcingH2OEl = document.getElementById('forcing-h2o');
    if (forcingH2OEl) {
        if (data && data.forcing_H2O !== undefined) {
            forcingH2OEl.textContent = `+${data.forcing_H2O.toFixed(2)}`;
        } else {
            forcingH2OEl.textContent = '--';
        }
    }
    // Alb. : toujours avec - (effet négatif sur le flux)
    const forcingAlbedoEl = document.getElementById('forcing-albedo');
    if (forcingAlbedoEl) {
        if (data && data.forcing_Albedo !== undefined) {
            forcingAlbedoEl.textContent = `-${Math.abs(data.forcing_Albedo).toFixed(2)}`;
        } else {
            forcingAlbedoEl.textContent = '--';
        }
    }
    // Total : avec signe selon valeur (sans unité, comme les autres)
    const forcingTotalEl = document.getElementById('forcing-total');
    if (forcingTotalEl) {
        if (data && data.forcing !== undefined) {
            forcingTotalEl.textContent = `${data.forcing >= 0 ? '+' : ''}${data.forcing.toFixed(2)}`;
        } else {
            forcingTotalEl.textContent = '--';
        }
    }
    
    // Mettre à jour l'albedo
    if (data && data.albedo !== undefined) {
        const albedoPercent = (data.albedo * 100).toFixed(1);
        const albedoNumberEl = document.getElementById('albedo-number');
        if (albedoNumberEl) {
            albedoNumberEl.textContent = albedoPercent;
        }
    } else {
        const albedoNumberEl = document.getElementById('albedo-number');
        if (albedoNumberEl) {
            albedoNumberEl.textContent = '--';
        }
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
                window.MathJax.typesetPromise([grid]).catch(() => {});
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
    if (calculationInProgress) return; // Bloquer si calcul en cours
    if (typeof window.waterVaporEnabled === 'undefined') {
        // Accéder directement à la variable globale si disponible
        return;
    }
    
    window.waterVaporEnabled = !window.waterVaporEnabled;
    disableButtons(); // Désactiver les boutons
    
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
    // Initialiser l'horloge (mais NE PAS la démarrer automatiquement)
    resetTimeline();
    
    // S'assurer que l'horloge est visible dès le départ
    setTimeout(() => {
        const infoTimeDisplay = document.getElementById('info-time');
        if (infoTimeDisplay) {
            infoTimeDisplay.style.display = 'inline-block';
            infoTimeDisplay.style.visibility = 'visible';
            infoTimeDisplay.style.opacity = '1';
            updateTimeline(); // Forcer une mise à jour immédiate (affichage seulement, pas d'incrémentation)
        }
        // NE PAS démarrer l'horloge automatiquement - elle s'incrémentera uniquement lors des calculs/clics
    }, 100);
});

