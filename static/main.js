// ============================================================================
// File: main.js - Logique principale de la simulation
// Desc: En français, dans l'architecture, je suis le module principal de simulation
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: simulation du bilan radiatif terrestre
// ============================================================================

// ============================================================================
// COMPTEUR FPS
// ============================================================================
let fps = 0;
let fpsFrames = 0;
let fpsLastTime = performance.now();
let fpsTimerActive = true; // État du timer d'une seconde

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
    window.fps = 0; // Exposer le FPS pour l'optimisation de la visualisation spectrale
    window.methaneEnabled = true; // CH4 activé par défaut
}

// ============================================================================
// UNITÉ DE TEMPÉRATURE (cycle °C → °F → K)
// ============================================================================
let temperatureUnit = 'C'; // 'C', 'F', ou 'K'
let currentTempCelsius = null; // Stocker la température en Celsius

function convertTemperature(tempC, unit) {
    if (tempC === null || tempC === undefined) return null;
    switch(unit) {
        case 'C':
            return tempC;
        case 'F':
            return tempC * 9/5 + 32;
        case 'K':
            return tempC + 273.15;
        default:
            return tempC;
    }
}

function getTemperatureUnitSymbol(unit) {
    switch(unit) {
        case 'C': return '°C';
        case 'F': return '°F';
        case 'K': return 'K'; // Kelvin sans le symbole °
        default: return '°C';
    }
}

function cycleTemperatureUnit() {
    const units = ['C', 'F', 'K'];
    const currentIndex = units.indexOf(temperatureUnit);
    temperatureUnit = units[(currentIndex + 1) % units.length];
    // Mettre à jour l'affichage avec la nouvelle unité
    if (currentTempCelsius !== null) {
        updateTemperatureDisplay();
    }
}

function updateTemperatureDisplay() {
    const tempSurfaceEl = document.getElementById('temp-surface-synthese');
    const tempUnitEl = document.getElementById('temp-unit-synthese');
    if (tempSurfaceEl && currentTempCelsius !== null) {
        const convertedTemp = convertTemperature(currentTempCelsius, temperatureUnit);
        tempSurfaceEl.textContent = convertedTemp.toFixed(1);
    }
    if (tempUnitEl) {
        tempUnitEl.textContent = getTemperatureUnitSymbol(temperatureUnit);
    }
}

// ============================================================================
// ÉPOQUES GÉOLOGIQUES ET FACTEUR VOLCANIQUE
// ============================================================================
// Les époques géologiques sont maintenant dans geology.js
// Utiliser directement les fonctions globales exposées par ce module

// Fonction pour déterminer quels boutons sont disponibles selon l'époque géologique
function getAvailableButtons(yearsAgo) {
    const era = (window.getGeologicalEra || function() { return { name: 'Phanérozoïque', volcanoFactor: 1.0 }; })(yearsAgo);
    const available = {
        'btn-comet': true, // Toujours disponible (comètes peuvent arriver à tout moment)
        'btn-volcano': era.volcanoFactor > 0, // Disponible seulement si volcans existent (pas pour Corps noir)
        'btn-cloud': true, // Toujours disponible
        'btn-iceberg': yearsAgo < 2.5e9, // Disponible avant l'Archéen (glace possible)
        'btn-desert': yearsAgo < 2.5e9, // Disponible avant l'Archéen
        'btn-forest': yearsAgo < 541e6, // Disponible avant le Phanérozoïque (avant la vie complexe)
        'btn-factory': yearsAgo < 541e6 // Disponible avant le Phanérozoïque
    };
    return available;
}

// Fonction pour désactiver tous les boutons
function disableButtons() {
    calculationInProgress = true;
    // Réinitialiser les flags de convergence
    if (typeof window !== 'undefined') {
        window.calculationConverged = false;
        window.spectralConverged = false;
        window.spectralPrecisionTarget = 'auto';
    }
    const buttons = [
        'btn-comet', 'btn-iceberg', 'btn-forest', 'btn-factory',
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

// Fonction pour réactiver les boutons selon l'époque géologique
function enableButtons() {
    calculationInProgress = false;
    const currentYears = timelineFrame * YEARS_PER_FRAME;
    const available = getAvailableButtons(currentYears);
    
    const buttons = [
        'btn-comet', 'btn-iceberg', 'btn-forest', 'btn-factory',
        'btn-desert', 'btn-volcano', 'btn-cloud'
    ];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            const isAvailable = available[btnId] !== false;
            btn.disabled = !isAvailable;
            
            if (isAvailable) {
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
            } else {
                // Bouton non disponible pour cette époque
                btn.style.opacity = '0.3';
                btn.style.cursor = 'not-allowed';
            }
        }
    });
    
    // Remettre le timer à jour à la fin du processus de convergence
    // pour que les tics automatiques reprennent immédiatement
    timelineLastUpdate = performance.now();
}

// ============================================================================
// HORLOGE / TIMELINE
// ============================================================================
let timelineFrame = 0; // Nombre de frames écoulées
const YEARS_PER_FRAME = 10; // 1 frame = 10 ans (tic automatique toutes les secondes = +10 ans)
// Note : Pour les sources industrielles ou volcaniques, on peut espérer un étalement dans le temps
let timelineRunning = true; // État de l'horloge (activée - tics automatiques de +10 ans/seconde)
let timelineLastUpdate = performance.now();
const TIMELINE_UPDATE_INTERVAL = 1000; // Mise à jour toutes les 1000ms (1 seconde = 10 ans) - UNIQUEMENT si pas de calcul en cours
let currentEpochStartYears = null; // Stocker le début de l'époque actuelle pour calculer le delta

function updateTimeline() {
    // Mettre à jour l'affichage (toujours, même si timelineRunning = false)
    const timelineDisplay = document.getElementById('timeline-display');
    const frameDisplay = document.getElementById('frame-display');
    const infoTimeDisplay = document.getElementById('info-time');
    
    const years = timelineFrame * YEARS_PER_FRAME;
    
    // Formater les années avec M (Mega) et M̅ (Milliard avec barre)
    const formattedYears = formatYears(years);
    
    if (timelineDisplay) {
        timelineDisplay.innerHTML = `<span class="timeline-hourglass">📅</span> ${formattedYears}`;
    }
    
    if (frameDisplay) {
        frameDisplay.textContent = timelineFrame.toString();
    }
    
    // Mettre à jour l'horloge dans l'en-tête d'info (prioritaire)
    // Afficher le delta depuis le début de l'époque en dizaines d'années uniquement
    if (infoTimeDisplay && currentEpochStartYears !== null) {
        // Calculer le delta depuis le début de l'époque
        const deltaYears = years - currentEpochStartYears;
        // Toujours afficher en dizaines d'années (jamais millions/milliards)
        const deltaInTens = Math.floor(deltaYears / 10) * 10; // Arrondir à la dizaine
        if (deltaInTens > 0) {
            infoTimeDisplay.textContent = `+${deltaInTens} ans`;
        } else {
            infoTimeDisplay.textContent = '+0 ans';
        }
        infoTimeDisplay.style.display = 'inline-block';
        infoTimeDisplay.style.visibility = 'visible';
        infoTimeDisplay.style.opacity = '1';
    }
    
    // Incrémenter automatiquement de +10 ans toutes les secondes UNIQUEMENT si pas de calcul en cours
    // Si un calcul est en cours, on s'arrête, mais on reprend automatiquement après
    if (timelineRunning && !calculationInProgress) {
        const currentTime = performance.now();
        const elapsed = currentTime - timelineLastUpdate;
        
        // Incrémenter les frames selon l'intervalle (1 seconde = 10 ans)
        if (elapsed >= TIMELINE_UPDATE_INTERVAL) {
            timelineFrame++;
            timelineLastUpdate = currentTime;
            const years = timelineFrame * YEARS_PER_FRAME;
            // Mettre à jour l'affichage immédiatement après l'incrémentation
            const formattedYears = formatYears(years);
            if (timelineDisplay) timelineDisplay.innerHTML = `<span class="timeline-hourglass">📅</span> ${formattedYears}`;
            if (frameDisplay) frameDisplay.textContent = timelineFrame.toString();
            // Afficher le delta depuis le début de l'époque en dizaines d'années uniquement
            if (infoTimeDisplay && currentEpochStartYears !== null) {
                const deltaYears = years - currentEpochStartYears;
                const deltaInTens = Math.floor(deltaYears / 10) * 10; // Arrondir à la dizaine
                if (deltaInTens > 0) {
                    infoTimeDisplay.textContent = `+${deltaInTens} ans`;
                } else {
                    infoTimeDisplay.textContent = '+0 ans';
                }
            }
        }
    }
    // Si calculationInProgress = true, on ne fait rien (pas d'incrémentation, pas de mise à jour de timelineLastUpdate)
    // pour que le tic reprenne immédiatement après la fin du calcul
    
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
    }
    
    // Millions (M)
    if (remaining >= MEGA) {
        const millions = Math.floor(remaining / MEGA);
        result += `${millions}M`;
        remaining = remaining % MEGA;
    }
    
    // Milliers et unités
    if (remaining > 0) {
        result += remaining.toString();
    } else if (result === '') {
        result = '0';
    }
    
    return result + ' ans';
}

// Fonction pour incrémenter le temps de 10 ans (lors des clics sur boutons)
// Note : Les tics automatiques ajoutent aussi +10 ans/seconde
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
    // Vérifier si le timer est désactivé (système de ping actif)
    if (!fpsTimerActive) {
        // Le timer est désactivé, ne pas continuer
        return;
    }
    
    fpsFrames++;
    const currentTime = performance.now();
    const elapsed = currentTime - fpsLastTime;
    
    if (elapsed >= 1000) {
        fps = Math.round((fpsFrames * 1000) / elapsed);
        fpsFrames = 0;
        fpsLastTime = currentTime;
        
        // Exposer le FPS globalement pour l'optimisation
        if (typeof window !== 'undefined') {
            window.fps = fps;
        }
        
        // Mettre à jour le graphique FPS
        if (typeof window !== 'undefined' && typeof window.updateFPSDisplay === 'function') {
            // Récupérer la précision actuelle
            let precisionFactor = 1.0;
            if (typeof window !== 'undefined' && typeof getPrecisionFactorFromFPS === 'function') {
                precisionFactor = getPrecisionFactorFromFPS();
            } else if (typeof window !== 'undefined' && window.fps) {
                // Calculer approximativement la précision selon le FPS
                const currentFPS = window.fps;
                if (currentFPS < 20) {
                    precisionFactor = 0.5;
                } else if (currentFPS < 25) {
                    precisionFactor = 0.75;
                } else if (currentFPS > 55) {
                    precisionFactor = 2.0;
                } else {
                    precisionFactor = 1.0;
                }
            }
            
            window.updateFPSDisplay(fps, precisionFactor);
        }
    }
    
    requestAnimationFrame(updateFPS);
}

// Exposer fpsTimerActive et updateFPS globalement pour que FPS.js puisse les contrôler
if (typeof window !== 'undefined') {
    // Créer un objet pour permettre la modification
    Object.defineProperty(window, 'fpsTimerActive', {
        get: () => fpsTimerActive,
        set: (value) => { fpsTimerActive = value; },
        configurable: true
    });
    window.updateFPS = updateFPS; // Exposer updateFPS pour pouvoir le relancer
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
    co2_ppm: 0,
    ch4_ppm: 0 // Concentration de CH4 en ppm (initialisée à 0)
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
        if (typeof window.simulateRadiativeTransfer !== 'function') {
            return;
        }
        // Récupérer CH4_fraction depuis plotData (défini par setEpoch ou par défaut 0)
        const ch4_ppm = plotData.ch4_ppm || 0;
        const ch4_fraction = ch4_ppm * 1e-6;
        const result = window.simulateRadiativeTransfer(co2_fraction, {
            CH4_fraction: ch4_fraction
        });
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
            
            // Calculer ΔT° = différence de température par rapport à la référence (255K sans CO2)
            // ΔT° = T° actuelle - T° référence (255K)
            // C'est la différence directe de température, plus claire et compréhensible
            const TEMP_REF_NO_CO2 = 255.0; // Température effective sans CO2 (référence)
            delta_temp = temp_surface - TEMP_REF_NO_CO2;
            
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
            // Réinitialiser les flags de convergence après l'affichage final (après un délai pour laisser le temps à la précision max)
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.spectralConverged = false;
                    window.spectralPrecisionTarget = 'auto';
                }
            }, 2000); // Laisser 2 secondes pour la précision maximale
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

// Fonction pour ajouter du CO2 via une comète/météorite de glace
function addCometCO2() {
    if (calculationInProgress) return; // Bloquer si calcul en cours
    
    const COMET_CO2_ADDITION = 0.1; // +0.1 ppm par comète
    const COMET_H2O_ADDITION = 0.1; // +0.1% H2O par comète
    const current_ppm = plotData.co2_ppm;
    const new_ppm = current_ppm + COMET_CO2_ADDITION;
    const new_fraction = new_ppm * 1e-6;
    
    // Activer H2O si ce n'est pas déjà fait
    if (typeof window.waterVaporEnabled === 'undefined' || !window.waterVaporEnabled) {
        window.waterVaporEnabled = true;
        waterVaporEnabled = true;
        // Mettre à jour le bouton cloud
        const btn = document.getElementById('btn-cloud');
        if (btn) {
            btn.style.opacity = '1';
            btn.style.border = '2px solid #4CAF50';
        }
    }
    
    // Ajouter le bonus H2O pour les comètes (comme pour les volcans)
    volcanoH2OBonus = Math.min(100, volcanoH2OBonus + COMET_H2O_ADDITION); // Maximum 100%
    if (typeof window !== 'undefined') {
        window.volcanoH2OBonus = volcanoH2OBonus;
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
    
    // ⚠️ MODIFICATION POUR GAMEPLAY : Un volcan ajoute une quantité de CO2 selon l'époque géologique
    // Au début de la Terre (Hadéen/Archéen), les volcans étaient beaucoup plus gros et nombreux
    // Calculer l'époque actuelle selon le temps écoulé
    const currentYears = timelineFrame * YEARS_PER_FRAME;
    const era = (window.getGeologicalEra || function() { return { volcanoFactor: 1.0, co2PerVolcano: 150 }; })(currentYears);
    
    // CO2 par volcan selon l'époque (plus gros au début)
    // ⚠️ MODIFICATION : Réduire l'effet du volcan pour le gameplay
    const CO2_PER_VOLCANO = era.co2PerVolcano * 0.1; // Réduire à 10% de l'effet original
    
    // Facteur multiplicatif : au début de la Terre, un clic = plusieurs volcans
    // Par exemple, à l'Hadéen, un clic = 10 volcans (facteur 10)
    const volcanoCount = Math.floor(era.volcanoFactor); // Nombre de volcans équivalents
    const VOLCAN_CO2_ADDITION = CO2_PER_VOLCANO * volcanoCount;
    
    const current_ppm = plotData.co2_ppm;
    const new_ppm = current_ppm + VOLCAN_CO2_ADDITION;
    const new_fraction = new_ppm * 1e-6;
    
    // Effet volcanique : augmenter H2O et diminuer la glace selon le nombre de volcans
    // Si facteur = 10, on ajoute 10% au lieu de 1%
    const h2oIncrement = Math.min(100, volcanoH2OBonus + era.volcanoFactor); // Maximum 100%
    const iceIncrement = Math.min(100, volcanoIceReduction + era.volcanoFactor); // Maximum 100%
    volcanoH2OBonus = h2oIncrement;
    volcanoIceReduction = iceIncrement;
    
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
        if (typeof window.simulateRadiativeTransfer !== 'function') {
            return;
        }
        // Récupérer CH4_fraction depuis plotData (défini par setEpoch ou par défaut 0)
        const ch4_ppm = plotData.ch4_ppm || 0;
        const ch4_fraction = ch4_ppm * 1e-6;
        const result = window.simulateRadiativeTransfer(co2_fraction, {
            CH4_fraction: ch4_fraction
        });
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
            
            // Calculer ΔT° = différence de température par rapport à la référence (255K sans CO2)
            // ΔT° = T° actuelle - T° référence (255K)
            // C'est la différence directe de température, plus claire et compréhensible
            const TEMP_REF_NO_CO2 = 255.0; // Température effective sans CO2 (référence)
            delta_temp = temp_surface - TEMP_REF_NO_CO2;
            
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
            // Réinitialiser les flags de convergence après l'affichage final (après un délai pour laisser le temps à la précision max)
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.spectralConverged = false;
                    window.spectralPrecisionTarget = 'auto';
                }
            }, 2000); // Laisser 2 secondes pour la précision maximale
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
        const co2NumberEl = document.getElementById('co2-number-synthese');
        if (co2NumberEl) {
            co2NumberEl.textContent = ppm.toString();
        }
        
        // L'emoji est maintenant dans le bouton principal btn-co2 autour du cercle albedo
        // Plus besoin de mettre à jour btn-co2-synthese car il n'existe plus
    }
    
    // Mettre à jour le statut H2O avec le % de couverture nuageuse
    const h2oStatusElement = document.getElementById('h2o-status-synthese');
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
    if (data && data.temp_surface_c !== undefined) {
        currentTempCelsius = data.temp_surface_c;
        updateTemperatureDisplay();
    } else {
        currentTempCelsius = null;
        const tempSurfaceEl = document.getElementById('temp-surface-synthese');
        if (tempSurfaceEl) {
            tempSurfaceEl.textContent = '--';
        }
    }
    if (data && data.temp_eff !== undefined && data.temp_eff > 0) {
        const tempEffEl = document.getElementById('temp-eff-synthese');
        if (tempEffEl) {
            tempEffEl.textContent = `${' '.repeat(5)}${data.temp_eff.toFixed(1)}K (${data.temp_eff_c >= 0 ? '+' : ''}${data.temp_eff_c.toFixed(1)}°C)`;
        }
    } else {
        const tempEffEl = document.getElementById('temp-eff-synthese');
        if (tempEffEl) {
            tempEffEl.textContent = '--';
        }
    }
    if (data && data.delta_temp !== undefined) {
        const deltaTempEl = document.getElementById('delta-temp-synthese');
        if (deltaTempEl) {
            deltaTempEl.textContent = `${' '.repeat(5)}${data.delta_temp >= 0 ? '+' : ''}${data.delta_temp.toFixed(2)}K`;
        }
    } else {
        const deltaTempEl = document.getElementById('delta-temp-synthese');
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
    const forcingCO2El = document.getElementById('forcing-co2-synthese');
    if (forcingCO2El) {
        if (data && data.forcing_CO2 !== undefined) {
            forcingCO2El.textContent = `+${data.forcing_CO2.toFixed(2)}`;
        } else {
            forcingCO2El.textContent = '--';
        }
    }
    // H2O : toujours avec + (même si 0)
    const forcingH2OEl = document.getElementById('forcing-h2o-synthese');
    if (forcingH2OEl) {
        if (data && data.forcing_H2O !== undefined) {
            forcingH2OEl.textContent = `+${data.forcing_H2O.toFixed(2)}`;
        } else {
            forcingH2OEl.textContent = '--';
        }
    }
    // Alb. : toujours avec - (effet négatif sur le flux)
    const forcingAlbedoEl = document.getElementById('forcing-albedo-synthese');
    if (forcingAlbedoEl) {
        if (data && data.forcing_Albedo !== undefined) {
            forcingAlbedoEl.textContent = `-${Math.abs(data.forcing_Albedo).toFixed(2)}`;
        } else {
            forcingAlbedoEl.textContent = '--';
        }
    }
    // Total : avec signe selon valeur (sans unité, comme les autres)
    const forcingTotalEl = document.getElementById('forcing-total-synthese');
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
        const albedoNumberEl = document.getElementById('albedo-number-synthese');
        if (albedoNumberEl) {
            albedoNumberEl.textContent = albedoPercent;
        }
    } else {
        const albedoNumberEl = document.getElementById('albedo-number-synthese');
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
        grid.style.gap = '0px 20px'; // 0px entre les lignes, 20px entre les colonnes
        
        // Trier les températures par ordre croissant
        const sortedTemps = [...window.PLANCK_TEMPERATURES].sort((a, b) => a - b);
        const totalCount = window.PLANCK_TEMPERATURES.length;
        
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
            // Passer l'index original et le totalCount pour calculer le stroke-width correct
            const patternSVG = typeof window.createDashPatternSVG === 'function'
                ? window.createDashPatternSVG(dashPattern, originalIndex, totalCount)
                : `<svg width="50" height="5" style="vertical-align: middle; display: inline-block; margin-right: 8px;">
                    <line x1="2" y1="2.5" x2="48" y2="2.5" stroke="white" stroke-width="1"/>
                   </svg>`;
            
            // Créer un conteneur pour le SVG avec les températures au-dessus et en-dessous
            const patternContainer = document.createElement('div');
            patternContainer.style.display = 'inline-block';
            patternContainer.style.position = 'relative';
            patternContainer.style.width = '50px';
            patternContainer.style.height = '5px';
            patternContainer.style.marginRight = '8px';
            patternContainer.style.verticalAlign = 'middle';
            
            // SVG du trait (centré dans le conteneur de 5px)
            const svgContainer = document.createElement('div');
            svgContainer.innerHTML = patternSVG;
            svgContainer.style.position = 'absolute';
            svgContainer.style.top = '50%';
            svgContainer.style.left = '0px';
            svgContainer.style.transform = 'translateY(-35%)';
            
            // Déterminer quelle unité afficher selon la langue
            const lang = (typeof window !== 'undefined' && window.lang) ? window.lang : 'fr';
            const showCelsius = lang === 'fr';
            const showFahrenheit = lang === 'en';
            
            // °C au-dessus du trait (si français)
            if (showCelsius) {
                const tempCAbove = document.createElement('span');
                tempCAbove.style.position = 'absolute';
                tempCAbove.style.top = '-4px';
                tempCAbove.style.right = '0%';
                tempCAbove.style.fontSize = '0.8em';
                tempCAbove.style.lineHeight = '1';
                tempCAbove.style.textAlign = 'right';
                tempCAbove.style.whiteSpace = 'nowrap';
                tempCAbove.textContent = `${(T - 273.15).toFixed(0)}°C`;
                patternContainer.appendChild(tempCAbove);
            }
            
            // °F en-dessous du trait (si anglais)
            if (showFahrenheit) {
                const tempFBelow = document.createElement('span');
                tempFBelow.style.position = 'absolute';
                tempFBelow.style.bottom = '-8px';
                tempFBelow.style.right = '0%';
                tempFBelow.style.fontSize = '0.8em';
                tempFBelow.style.lineHeight = '1';
                tempFBelow.style.textAlign = 'right';
                tempFBelow.style.whiteSpace = 'nowrap';
                const tempF = ((T - 273.15) * 9/5 + 32).toFixed(0);
                tempFBelow.textContent = `${tempF}°F`;
                patternContainer.appendChild(tempFBelow);
            }
            
            patternContainer.appendChild(svgContainer);
            
            // K à côté (normal)
            const labelSpan = document.createElement('span');
            labelSpan.className = 'legend-text';
            labelSpan.textContent = `${T}K`;
            
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
    
    // Ajouter les légendes pour les courbes d'équilibre (corps noir pointillé et courbe réelle pleine)
    const equilibreCurvesContainer = document.getElementById('legend-equilibre-curves');
    if (equilibreCurvesContainer && data && data.current && data.current.effective_temperature) {
        equilibreCurvesContainer.innerHTML = '';
        
        const T = data.current.effective_temperature;
        const tempC = (T - 273.15).toFixed(0);
        const tempF = ((T - 273.15) * 9/5 + 32).toFixed(0);
        
        // Créer deux éléments de légende : un pour le corps noir (pointillé 'dot') et un pour la courbe réelle (pleine 'solid')
        const patterns = [
            { name: 'dot', label: 'Corps noir' },
            { name: 'solid', label: 'Courbe réelle' }
        ];
        
        patterns.forEach((patternInfo) => {
            const item = document.createElement('div');
            item.className = 'legend-equilibre-item';
            
            // Créer le SVG avec le pattern approprié (cyan pour la légende d'équilibre)
            const dashArray = typeof window.getDashArray === 'function' 
                ? window.getDashArray(patternInfo.name)
                : (patternInfo.name === 'dot' ? '1,3' : 'none');
            const dashAttr = dashArray !== 'none' ? `stroke-dasharray="${dashArray}"` : '';
            const patternSVG = `<svg width="50" height="5" style="vertical-align: middle; display: inline-block; margin-right: 8px;">
                <line x1="2" y1="2.5" x2="48" y2="2.5" stroke="cyan" stroke-width="2" ${dashAttr}/>
            </svg>`;
            
            // Créer un conteneur pour le SVG avec les températures au-dessus et en-dessous
            const patternContainer = document.createElement('div');
            patternContainer.style.display = 'inline-block';
            patternContainer.style.position = 'relative';
            patternContainer.style.width = '50px';
            patternContainer.style.height = '5px';
            patternContainer.style.marginRight = '8px';
            patternContainer.style.verticalAlign = 'middle';
            
            // SVG du trait (centré dans le conteneur de 5px)
            const svgContainer = document.createElement('div');
            svgContainer.innerHTML = patternSVG;
            svgContainer.style.position = 'absolute';
            svgContainer.style.top = '50%';
            svgContainer.style.left = '0px';
            svgContainer.style.transform = 'translateY(-35%)';
            
            // Déterminer quelle unité afficher selon la langue
            const lang = (typeof window !== 'undefined' && window.lang) ? window.lang : 'fr';
            const showCelsius = lang === 'fr';
            const showFahrenheit = lang === 'en';
            
            // °C au-dessus du trait (si français)
            if (showCelsius) {
                const tempCAbove = document.createElement('span');
                tempCAbove.style.position = 'absolute';
                tempCAbove.style.top = '-4px';
                tempCAbove.style.right = '0%';
                tempCAbove.style.fontSize = '0.8em';
                tempCAbove.style.lineHeight = '1';
                tempCAbove.style.textAlign = 'right';
                tempCAbove.style.whiteSpace = 'nowrap';
                tempCAbove.style.color = 'cyan';
                tempCAbove.textContent = `${tempC}°C`;
                patternContainer.appendChild(tempCAbove);
            }
            
            // °F en-dessous du trait (si anglais)
            if (showFahrenheit) {
                const tempFBelow = document.createElement('span');
                tempFBelow.style.position = 'absolute';
                tempFBelow.style.bottom = '-8px';
                tempFBelow.style.right = '0%';
                tempFBelow.style.fontSize = '0.8em';
                tempFBelow.style.lineHeight = '1';
                tempFBelow.style.textAlign = 'right';
                tempFBelow.style.whiteSpace = 'nowrap';
                tempFBelow.style.color = 'cyan';
                tempFBelow.textContent = `${tempF}°F`;
                patternContainer.appendChild(tempFBelow);
            }
            
            patternContainer.appendChild(svgContainer);
            
            // K à côté (normal)
            const labelSpan = document.createElement('span');
            labelSpan.className = 'legend-text';
            labelSpan.style.color = 'cyan';
            labelSpan.textContent = `${T.toFixed(1)}K`;
            
            item.appendChild(patternContainer);
            item.appendChild(labelSpan);
            equilibreCurvesContainer.appendChild(item);
        });
    }
    
    // Remplacer les spans CSS par des SVG pour harmoniser les pointillés dans l'intégrale
    const dottedSpan = document.querySelector('.legend-line-dotted');
    const solidSpan = document.querySelector('.legend-line-solid');
    
    if (dottedSpan) {
        // Créer un SVG avec le même pattern que la légende (dot avec stroke-dasharray="1,3")
        const dashArray = typeof window.getDashArray === 'function' ? window.getDashArray('dot') : '1,3';
        dottedSpan.innerHTML = `<svg width="30" height="2" style="vertical-align: middle; display: inline-block;">
            <line x1="0" y1="1" x2="30" y2="1" stroke="cyan" stroke-width="2" stroke-dasharray="${dashArray}"/>
        </svg>`;
        // Supprimer le style CSS border qui n'est plus nécessaire
        dottedSpan.style.border = 'none';
    }
    
    if (solidSpan) {
        // Créer un SVG avec une ligne pleine
        solidSpan.innerHTML = `<svg width="30" height="2" style="vertical-align: middle; display: inline-block;">
            <line x1="0" y1="1" x2="30" y2="1" stroke="cyan" stroke-width="2"/>
        </svg>`;
        // Supprimer le style CSS border qui n'est plus nécessaire
        solidSpan.style.border = 'none';
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
// Fonction pour appliquer les conditions initiales d'une époque géologique
function setEpoch(epochName) {
    if (calculationInProgress) return; // Bloquer si calcul en cours
    
    // Gérer la sélection unique (boutons radio)
    const allEpochButtons = document.querySelectorAll('.epoch-btn');
    allEpochButtons.forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Sélectionner le bouton cliqué
    const clickedButton = document.querySelector(`.epoch-btn[data-epoch="${epochName}"]`);
    if (clickedButton) {
        clickedButton.classList.add('selected');
    }
    
    // Récupérer les conditions de l'époque depuis geology.js
    if (typeof window.getGeologicalPeriodByName !== 'function') {
        return;
    }
    
    const epoch = window.getGeologicalPeriodByName(epochName);
    if (!epoch) {
        return;
    }
    
    disableButtons(); // Désactiver les boutons
    
    // Mettre à jour la timeline pour correspondre au début de l'époque
    timelineFrame = Math.floor(epoch.startYears / YEARS_PER_FRAME);
    
    // Stocker le début de l'époque pour calculer le delta
    currentEpochStartYears = epoch.startYears;
    
    // Mettre à jour la date de début affichée
    const epochStartTimeDisplay = document.querySelector('.epoch-start-time');
    if (epochStartTimeDisplay) {
        const formattedYears = formatYears(epoch.startYears);
        epochStartTimeDisplay.textContent = formattedYears;
    }
    
    // Afficher le nom de l'époque
    const epochNameDisplay = document.getElementById('epoch-name');
    if (epochNameDisplay) {
        // Pour "Corps noir", utiliser un nom plus descriptif
        let displayName = epoch.name;
        if (epoch.name === 'Corps noir') {
            displayName = 'État initial';
        }
        epochNameDisplay.textContent = displayName;
    }
    
    // Cacher "+90 ans" quand on clique sur une époque (sera réaffiché lors de l'incrémentation)
    const infoTimeDisplay = document.getElementById('info-time');
    if (infoTimeDisplay) {
        infoTimeDisplay.style.display = 'none';
    }
    
    updateTimeline();
    
    // Appliquer les conditions initiales
    // En époque "Corps noir", tout est désactivé
    const isCorpsNoir = epoch.name === 'Corps noir';
    
    // 1. CO2
    const co2_fraction = epoch.co2_ppm * 1e-6;
    plotData.co2_ppm = epoch.co2_ppm;
    currentState = 3; // Utiliser state 3 comme base pour les valeurs personnalisées
    
    // Mettre à jour le bouton CO2
    const btnCo2 = document.getElementById('btn-co2');
    if (btnCo2) {
        if (isCorpsNoir) {
            btnCo2.classList.remove('checked');
            btnCo2.classList.add('disabled');
            btnCo2.disabled = true;
        } else {
            btnCo2.classList.remove('disabled');
            btnCo2.disabled = false;
            if (epoch.co2_ppm > 0) {
                btnCo2.classList.add('checked');
            } else {
                btnCo2.classList.remove('checked');
            }
        }
    }
    
    // 2. H2O
    if (typeof window.waterVaporEnabled !== 'undefined') {
        window.waterVaporEnabled = !isCorpsNoir && (epoch.h2o_enabled !== false); // true par défaut si non spécifié
    }
    
    // Mettre à jour l'affichage H2O
    const h2oStatusElement = document.getElementById('h2o-status-synthese');
    if (h2oStatusElement) {
        h2oStatusElement.textContent = (!isCorpsNoir && epoch.h2o_enabled !== false) ? 'Activé' : 'Désactivé';
    }
    
    // Mettre à jour le bouton H2O
    const btnH2O = document.getElementById('btn-h2o');
    if (btnH2O) {
        if (isCorpsNoir) {
            btnH2O.classList.remove('checked');
            btnH2O.classList.add('disabled');
            btnH2O.disabled = true;
        } else {
            btnH2O.classList.remove('disabled');
            btnH2O.disabled = false;
            if (epoch.h2o_enabled !== false) {
                btnH2O.classList.add('checked');
            } else {
                btnH2O.classList.remove('checked');
            }
        }
    }
    
    const btn = document.getElementById('btn-cloud');
    if (btn) {
        if (!isCorpsNoir && epoch.h2o_enabled !== false) {
            btn.style.opacity = '1';
            btn.style.border = '2px solid #4CAF50';
            btn.title = 'Vapeur d\'eau activée - Cliquer pour désactiver';
        } else {
            btn.style.opacity = '0.5';
            btn.style.border = 'none';
            btn.title = 'Vapeur d\'eau désactivée - Cliquer pour activer';
        }
    }
    
    // 3. CH4 (méthane)
    if (epoch.ch4_ppm !== undefined) {
        plotData.ch4_ppm = isCorpsNoir ? 0 : epoch.ch4_ppm;
        // Activer CH4 si la concentration est > 0
        if (typeof window.methaneEnabled !== 'undefined') {
            window.methaneEnabled = !isCorpsNoir && (epoch.ch4_ppm > 0);
        }
    } else {
        // Par défaut, désactiver CH4 si non spécifié
        plotData.ch4_ppm = 0;
        if (typeof window.methaneEnabled !== 'undefined') {
            window.methaneEnabled = false;
        }
    }
    
    // Mettre à jour le bouton CH4
    const btnMethane = document.getElementById('btn-methane');
    if (btnMethane) {
        if (isCorpsNoir) {
            btnMethane.classList.remove('checked');
            btnMethane.classList.add('disabled');
            btnMethane.disabled = true;
        } else {
            btnMethane.classList.remove('disabled');
            btnMethane.disabled = false;
            if (epoch.ch4_ppm > 0) {
                btnMethane.classList.add('checked');
            } else {
                btnMethane.classList.remove('checked');
            }
        }
    }
    
    // 4. Albedo (toujours disponible sauf en Corps noir)
    const btnAlbedo = document.getElementById('btn-albedo');
    if (btnAlbedo) {
        if (isCorpsNoir) {
            btnAlbedo.classList.remove('checked');
            btnAlbedo.classList.add('disabled');
            btnAlbedo.disabled = true;
        } else {
            btnAlbedo.classList.remove('disabled');
            btnAlbedo.disabled = false;
            // Albedo est généralement activé par défaut
            btnAlbedo.classList.add('checked');
        }
    }
    
    // 4. Cloud coverage sera appliqué automatiquement dans les calculs via calculateCloudCoverage
    // On peut stocker la valeur pour référence
    if (epoch.cloud_coverage !== undefined) {
        // Le cloud_coverage sera utilisé dans calculateCloudCoverage si nécessaire
        // Pour l'instant, on le stocke dans plotData pour référence
        plotData.epoch_cloud_coverage = epoch.cloud_coverage;
    }
    
    // Lancer le calcul avec les nouvelles conditions
    updateCO2LevelDirect(co2_fraction);
}


function toggleWaterVapor() {
    if (calculationInProgress) return; // Bloquer si calcul en cours
    
    // Vérifier si on est en époque Corps noir (tout désactivé)
    const btnH2O = document.getElementById('btn-h2o');
    if (btnH2O && btnH2O.classList.contains('disabled')) {
        return; // Ne rien faire si désactivé
    }
    
    if (typeof window.waterVaporEnabled === 'undefined') {
        // Accéder directement à la variable globale si disponible
        return;
    }
    
    window.waterVaporEnabled = !window.waterVaporEnabled;
    
    // Mettre à jour la classe checked
    if (btnH2O) {
        if (window.waterVaporEnabled) {
            btnH2O.classList.add('checked');
        } else {
            btnH2O.classList.remove('checked');
        }
    }
    
    disableButtons(); // Désactiver les boutons
    
    // Mettre à jour l'affichage H2O
    const h2oStatusElement = document.getElementById('h2o-status-synthese');
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

// Exposer les fonctions globalement
window.toggleReferencePanel = toggleReferencePanel;
window.setEpoch = setEpoch;

window.addEventListener('DOMContentLoaded', () => {
    calculateInitialData();
    // Initialiser l'horloge (mais NE PAS la démarrer automatiquement)
    resetTimeline();
    
    // Sélectionner "Corps noir" par défaut
    const corpsNoirButton = document.querySelector('.epoch-btn[data-epoch="Corps noir"]');
    if (corpsNoirButton) {
        corpsNoirButton.classList.add('selected');
    }
    
    // Initialiser l'époque par défaut (Corps noir)
    if (typeof window.getGeologicalPeriodByName === 'function') {
        const defaultEpoch = window.getGeologicalPeriodByName('Corps noir');
        if (defaultEpoch) {
            currentEpochStartYears = defaultEpoch.startYears;
        }
    }
    
    // Initialiser le nom de l'époque au chargement
    const epochNameDisplay = document.getElementById('epoch-name');
    if (epochNameDisplay) {
        epochNameDisplay.textContent = 'État initial';
    }
    
    // Initialiser les boutons du flux en époque Corps noir (tout désactivé)
    const fluxButtons = ['btn-co2', 'btn-methane', 'btn-h2o', 'btn-albedo'];
    fluxButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.classList.remove('checked');
            btn.classList.add('disabled');
            btn.disabled = true;
        }
    });
    
    // Initialiser l'état des boutons selon l'époque géologique
    enableButtons();
    
    // Ajouter un gestionnaire de clic sur la température pour cycler les unités
    const syntheseTempEl = document.querySelector('.synthese_Temp');
    if (syntheseTempEl) {
        syntheseTempEl.style.cursor = 'pointer';
        syntheseTempEl.addEventListener('click', cycleTemperatureUnit);
    }
    
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

