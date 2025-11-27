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
    window.h2oTotalFromMeteorites = 0; // Eau totale ajoutée par les météorites (en pourcentage 0-100)
}

// ============================================================================
// UNITÉ DE TEMPÉRATURE (cycle °C → °F → K)
// ============================================================================
let temperatureUnit = 'C'; // 'C', 'F', ou 'K'
let currentTempCelsius = null; // Stocker la température en Celsius

function convertTemperature(tempC, unit) {
    if (tempC === null || tempC === undefined) return null;
    switch (unit) {
        case 'C':
            return tempC;
        case 'F':
            return tempC * 9 / 5 + 32;
        case 'K':
            return tempC + 273.15;
        default:
            return tempC;
    }
}

function getTemperatureUnitSymbol(unit) {
    switch (unit) {
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

// Fonction pour calculer la couleur du contour selon la température
// Utilise des if simples avec interpolation linéaire entre les points de référence
// Points : Noir(-273°C/0K), Violet(-70°C), Bleu(-40°C), Blanc(-10°C), Blanc(0°C), Vert(15°C), Jaune(20°C), Rouge(30°C)
// Transition alpha du violet vers le noir pour les températures très froides
function getTemperatureGlowColor(tempC) {
    // Points de référence : [température, couleur RGB]
    const colorPoints = [
        [-273, { r: 0, g: 0, b: 0 }],       // Noir à -273°C (0K, zéro absolu)
        [-70, { r: 128, g: 0, b: 255 }],   // Violet à -70°C
        [-40, { r: 0, g: 0, b: 255 }],     // Bleu à -40°C
        [-10, { r: 255, g: 255, b: 255 }], // Blanc à -10°C
        [0, { r: 255, g: 255, b: 255 }],   // Blanc à 0°C
        [15, { r: 0, g: 255, b: 0 }],      // Vert à 15°C
        [20, { r: 255, g: 255, b: 0 }],    // Jaune à 20°C
        [30, { r: 255, g: 0, b: 0 }]       // Rouge à 30°C
    ];

    // Si en dehors de la plage, utiliser les couleurs extrêmes
    if (tempC <= colorPoints[0][0]) {
        return `rgb(${colorPoints[0][1].r}, ${colorPoints[0][1].g}, ${colorPoints[0][1].b})`;
    }
    if (tempC >= colorPoints[colorPoints.length - 1][0]) {
        const last = colorPoints[colorPoints.length - 1][1];
        return `rgb(${last.r}, ${last.g}, ${last.b})`;
    }

    // Trouver les deux points entre lesquels interpoler
    for (let i = 0; i < colorPoints.length - 1; i++) {
        const temp1 = colorPoints[i][0];
        const temp2 = colorPoints[i + 1][0];
        const color1 = colorPoints[i][1];
        const color2 = colorPoints[i + 1][1];

        if (tempC >= temp1 && tempC <= temp2) {
            // Interpolation linéaire
            const ratio = (tempC - temp1) / (temp2 - temp1);
            const r = Math.round(color1.r + (color2.r - color1.r) * ratio);
            const g = Math.round(color1.g + (color2.g - color1.g) * ratio);
            const b = Math.round(color1.b + (color2.b - color1.b) * ratio);

            // Transition alpha du violet vers le noir pour les températures très froides
            // Entre -273°C et -70°C : alpha diminue progressivement
            let alpha = 1.0;
            if (tempC < -70) {
                // Entre -273°C et -70°C : alpha de 0 à 1
                const alphaRatio = (tempC - (-273)) / (-70 - (-273));
                alpha = Math.max(0, Math.min(1, alphaRatio));
            }

            if (alpha < 1.0) {
                return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
            }
            return `rgb(${r}, ${g}, ${b})`;
        }
    }

    // Par défaut (ne devrait pas arriver)
    return 'rgb(255, 255, 255)';
}

function updateTemperatureDisplay() {
    const tempSurfaceEl = document.getElementById('temp-surface-synthese');
    const tempUnitEl = document.getElementById('temp-unit-synthese');
    const syntheseTempEl = document.querySelector('.synthese_Temp');
    const thermometerIcon = syntheseTempEl ? syntheseTempEl.querySelector('.thermometer-icon') : null;

    if (tempSurfaceEl && currentTempCelsius !== null) {
        const convertedTemp = convertTemperature(currentTempCelsius, temperatureUnit);
        tempSurfaceEl.textContent = convertedTemp.toFixed(1);

        // Mettre à jour la couleur du contenu du thermomètre selon la température
        if (thermometerIcon) {
            const glowColor = getTemperatureGlowColor(currentTempCelsius);

            // Calculer la couleur du pic d'émission du corps noir (loi de Wien) avec symétrie à 7 μm
            const tempK = currentTempCelsius + 273.15;
            const wienConstant = 2898; // Constante de Wien en μm·K
            const lambda_um = wienConstant / tempK;

            // Symétrie à 7 μm : λ_sym = 14 - λ
            // On veut toujours un résultat > 7 μm (vert..cyan..bleu..violet, jamais rouge)
            let lambda_sym_um = 14 - lambda_um;

            // Si le résultat est < 7 μm, le refléter à nouveau pour rester > 7 μm
            // Exemple : si λ = 10 μm → λ_sym = 4 μm → refléter → 10 μm
            // Mais on veut > 7 μm, donc si λ_sym < 7, alors λ_sym = 7 + (7 - λ_sym) = 14 - λ_sym
            // Mais 14 - λ_sym = 14 - (14 - λ) = λ, donc on revient à l'original...
            // En fait, si λ > 7, alors λ_sym = 14 - λ < 7, et on veut > 7
            // Solution : si λ_sym < 7, alors utiliser λ directement (déjà > 7)
            if (lambda_sym_um < 7) {
                // Si la symétrie donne < 7 μm, utiliser la valeur originale si elle est > 7
                // Sinon, refléter à nouveau
                if (lambda_um > 7) {
                    lambda_sym_um = lambda_um; // Utiliser l'original si > 7
                } else {
                    // Si λ < 7 et λ_sym < 7, refléter à nouveau
                    lambda_sym_um = 7 + (7 - lambda_sym_um);
                }
            }

            // S'assurer que le résultat est toujours > 7 μm
            if (lambda_sym_um <= 7) {
                lambda_sym_um = 7.1; // Minimum juste au-dessus de 7 μm
            }

            const lambda_sym_m = lambda_sym_um * 1e-6;
            const lambda_sym_um_calc = lambda_sym_um;
            const lambda_sym_nm = lambda_sym_um_calc * 1000;

            // Utiliser l'algorithme "if" (wavelengthToRGB) pour convertir en couleur
            let bodyColor = null;
            if (typeof wavelengthToRGB === 'function') {
                // Algorithme "if" : if pour le visible, log pour l'IR, noir pour l'UV
                // Avant l'UV (< 380 nm) : toujours noir
                if (lambda_sym_nm < 380) {
                    bodyColor = { r: 0, g: 0, b: 0 };
                } else if (lambda_sym_nm >= 380 && lambda_sym_nm <= 789) {
                    // Si dans le spectre visible (380-789 nm), utiliser les if
                    const [r, g, b] = wavelengthToRGB(lambda_sym_nm);
                    bodyColor = { r: Math.max(0, r), g: Math.max(0, g), b: Math.max(0, b) };
                } else {
                    // Pour l'IR (lambda_nm > 789), utiliser la conversion log condensée
                    if (lambda_sym_um_calc <= 1) {
                        bodyColor = { r: 0, g: 0, b: 0 }; // Point singulier : invisible
                    } else {
                        const log_lambda = Math.log10(lambda_sym_um_calc);
                        const effacement_debut = 30;
                        const hz = 1598.5 / (log_lambda + 2.026);
                        const freq_10_14 = (hz - effacement_debut) / 100;
                        if (typeof Hz2RGB === 'function') {
                            const [r, g, b] = Hz2RGB(freq_10_14);
                            bodyColor = { r, g, b };
                        }
                    }
                }
            }

            if (bodyColor) {
                // Appliquer la couleur directement au contenu du thermomètre (sans halo)
                const colorStr = `rgb(${Math.round(bodyColor.r)}, ${Math.round(bodyColor.g)}, ${Math.round(bodyColor.b)})`;
                thermometerIcon.style.setProperty('color', colorStr, 'important');
                thermometerIcon.style.setProperty('filter', '', 'important');
                thermometerIcon.style.setProperty('text-shadow', '', 'important');
            } else {
                // Fallback si pas de fonction disponible : utiliser la couleur du glow
                thermometerIcon.style.setProperty('color', glowColor, 'important');
                thermometerIcon.style.setProperty('filter', '', 'important');
                thermometerIcon.style.setProperty('text-shadow', '', 'important');
            }
        }
    } else {
        // Si pas de température, enlever la couleur
        if (thermometerIcon) {
            thermometerIcon.style.setProperty('color', '', 'important');
            thermometerIcon.style.setProperty('filter', '', 'important');
            thermometerIcon.style.setProperty('text-shadow', '', 'important');
        }
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
    const era = (window.getGeologicalEra || function () { return { name: 'Phanérozoïque', volcanoFactor: 1.0 }; })(yearsAgo);
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

    // Mettre à jour l'horloge dans la zone horloge
    // Afficher le delta depuis le début de l'époque en dizaines d'années uniquement
    if (infoTimeDisplay && currentEpochStartYears !== null) {
        // Calculer le delta depuis le début de l'époque
        const deltaYears = years - currentEpochStartYears;
        // Toujours afficher en dizaines d'années (jamais millions/milliards)
        const deltaInTens = Math.floor(deltaYears / 10) * 10; // Arrondir à la dizaine
        const newText = deltaInTens > 0 ? `+${deltaInTens} ans` : '+0 ans';
        // Ne modifier le texte que s'il a changé pour éviter le clignotement
        if (infoTimeDisplay.textContent !== newText) {
            infoTimeDisplay.textContent = newText;
        }
    }

    // 🔒 DÉSACTIVÉ : Ne plus incrémenter automatiquement de +10 ans toutes les secondes
    // L'incrémentation se fait uniquement lors des clics sur boutons (météorite glace, etc.)
    // if (timelineRunning && !calculationInProgress) {
    //     const currentTime = performance.now();
    //     const elapsed = currentTime - timelineLastUpdate;
    //
    //     // Incrémenter les frames selon l'intervalle (1 seconde = 10 ans)
    //     if (elapsed >= TIMELINE_UPDATE_INTERVAL) {
    //         timelineFrame++;
    //         timelineLastUpdate = currentTime;
    //         const years = timelineFrame * YEARS_PER_FRAME;
    //         // Mettre à jour l'affichage immédiatement après l'incrémentation
    //         const formattedYears = formatYears(years);
    //         if (timelineDisplay) timelineDisplay.innerHTML = `<span class="timeline-hourglass">📅</span> ${formattedYears}`;
    //         if (frameDisplay) frameDisplay.textContent = timelineFrame.toString();
    //         // Afficher le delta depuis le début de l'époque en dizaines d'années uniquement
    //         if (infoTimeDisplay && currentEpochStartYears !== null) {
    //             const deltaYears = years - currentEpochStartYears;
    //             const deltaInTens = Math.floor(deltaYears / 10) * 10; // Arrondir à la dizaine
    //             const newText = deltaInTens > 0 ? `+${deltaInTens} ans` : '+0 ans';
    //             // Ne modifier le texte que s'il a changé pour éviter le clignotement
    //             if (infoTimeDisplay.textContent !== newText) {
    //                 infoTimeDisplay.textContent = newText;
    //             }
    //         }
    //     }
    // }
    // Si calculationInProgress = true, on ne fait rien (pas d'incrémentation, pas de mise à jour de timelineLastUpdate)
    // pour que le tic reprenne immédiatement après la fin du calcul

    requestAnimationFrame(updateTimeline);
}

// Fonction pour formater les années avec Ma (millions d'années)
// Format : -4500 Ma (exemple : -4500 millions d'années)
// Les valeurs positives sont considérées comme des dates dans le passé (affichées avec "-")
function formatYears(years) {
    if (years === 0) return '0 ans';

    const MEGA = 1e6;    // 1 million

    // Les valeurs positives représentent des dates dans le passé, donc on les affiche avec "-"
    // Les valeurs négatives sont déjà dans le bon format (futur, rare)
    const isPast = years > 0; // Dates positives = passé
    const yearsAbs = Math.abs(years);

    // Convertir en millions d'années
    const millions = yearsAbs / MEGA;

    // Formater avec 0 décimales si entier, sinon avec décimales
    let result;
    if (millions % 1 === 0) {
        result = millions.toString();
    } else {
        // Afficher avec décimales si nécessaire (max 1 décimale)
        result = millions.toFixed(1).replace(/\.?0+$/, ''); // Enlever les zéros inutiles
    }

    // Ajouter le signe "-" si c'est dans le passé (years > 0)
    if (isPast) {
        result = '-' + result;
    }

    return result + ' Ma';
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
            // Température effective sans effet de serre (référence) ~255K (Terre)
            // Calculée dynamiquement selon l'albedo et l'intensité solaire de l'époque
            const temp_eff_0 = (typeof window.getEffectiveTemperatureNoGreenhouse === 'function')
                ? window.getEffectiveTemperatureNoGreenhouse()
                : 255.0;
            // Température de surface calculée par dichotomie (équilibre radiatif avec CO2 uniquement)
            // Note: Les 15°C réels incluent aussi vapeur d'eau, nuages, etc. - ce modèle ne prend que le CO2
            const temp_surface = temperature(0); // Température au sol (z=0) ajustée par dichotomie
            const temp_surface_c = temp_surface - 273.15;
            // Calculer ΔT° à partir du forçage radiatif (calibration)
            // ΔT° = différence par rapport à 255K (sans CO2)
            // On calcule d'abord les forçages, puis on calcule delta_temp
            // (sera calculé après les forçages)
            let delta_temp = 0; // Sera calculé après

            // Ajouter temp_surface et temp_surface_c à plotData pour que updatePlot puisse les utiliser
            plotData.temp_surface = temp_surface; // Température de surface en K (cohérence avec courbes)
            plotData.temp_surface_c = temp_surface_c;

            // Récupérer l'albedo et la couverture nuageuse depuis les résultats
            const albedo = plotData.current.albedo !== undefined ? plotData.current.albedo : null;
            const cloud_coverage = plotData.current.cloud_coverage !== undefined ? plotData.current.cloud_coverage : null;

            // Calculer les forçages radiatifs séparés
            const forcing_CO2 = typeof window.calculateCO2Forcing === 'function'
                ? window.calculateCO2Forcing(plotData.co2_ppm * 1e-6)
                : 0;

            // Calculer le forcing H2O avec la nouvelle fonction calculateH2OParameters
            let forcing_H2O = 0;
            let h2o_vapor_percent = 0;
            if (typeof window.waterVaporEnabled !== 'undefined' && window.waterVaporEnabled && typeof window.calculateH2OParameters === 'function') {
                // Récupérer l'eau de base de l'époque
                h2o_vapor_percent = (typeof window.h2oVaporPercent !== 'undefined') ? window.h2oVaporPercent : 0;
                
                // Ajouter l'eau totale des météorites
                const h2o_from_meteorites = (typeof window.h2oTotalFromMeteorites !== 'undefined') ? window.h2oTotalFromMeteorites : 0;
                const h2o_total_percent = h2o_vapor_percent + h2o_from_meteorites;
                
                // Calculer la répartition vapeur/glace selon la température
                const h2o_params = window.calculateH2OParameters(temp_surface, h2o_total_percent, cloud_coverage);
                forcing_H2O = h2o_params.greenhouse_forcing;
                
                // 🔒 TOUJOURS mettre à jour h2oIceFractionFromCalculation pour l'affichage
                // (déjà fait dans calculateH2OParameters, mais on force la mise à jour pour être sûr)
                if (typeof window !== 'undefined') {
                    window.h2oIceFractionFromCalculation = h2o_params.ice_fraction || 0;
                }
                
                // Mettre à jour la composition atmosphérique (H2O est déjà mis à jour dans calculateH2OParameters)
            }
            
            // Mettre à jour la composition atmosphérique avec CO2 et CH4
            if (typeof window !== 'undefined' && window.atmosphericComposition) {
                window.atmosphericComposition.CO2 = plotData.co2_ppm * 1e-6;
                window.atmosphericComposition.CH4 = plotData.ch4_ppm * 1e-6;
            }

            // Calculer le forcing CH4
            const forcing_CH4 = (typeof window.methaneEnabled !== 'undefined' && window.methaneEnabled && plotData.ch4_ppm > 0 && typeof window.calculateCH4Forcing === 'function')
                ? window.calculateCH4Forcing(plotData.ch4_ppm * 1e-6)
                : 0;

            const forcing_Albedo = typeof window.calculateAlbedoForcing === 'function' && albedo !== null
                ? window.calculateAlbedoForcing(albedo)
                : 0;

            // Forçage total
            const forcing_total = forcing_CO2 + forcing_H2O + forcing_CH4 + forcing_Albedo;

            // Calculer ΔT° = différence de température par rapport à la référence sans CO2
            // ΔT° = T° actuelle - T° référence (sans effet de serre)
            // C'est la différence directe de température, plus claire et compréhensible
            const TEMP_REF_NO_CO2 = temp_eff_0; // Température effective sans CO2 (référence dynamique)
            delta_temp = temp_surface - TEMP_REF_NO_CO2;

            // Calculer ΔT° par rapport à la température optimale habitable (15°C = 288K)
            const TEMP_HABITABLE_OPTIMAL = 288; // 15°C (Référence terrestre actuelle)
            const TEMP_HABITABLE_MIN = 253; // -20°C
            const TEMP_HABITABLE_MAX = 323; // 50°C
            const delta_temp_habitable = temp_surface - TEMP_HABITABLE_OPTIMAL;
            const life_viable = temp_surface >= TEMP_HABITABLE_MIN && temp_surface <= TEMP_HABITABLE_MAX;

            updateDisplay({
                state: currentState,
                co2_ppm: plotData.co2_ppm,
                ch4_ppm: plotData.ch4_ppm,
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
                forcing_CH4: forcing_CH4,
                forcing_Albedo: forcing_Albedo,
                albedo: albedo,
                cloud_coverage: cloud_coverage,
                h2o_vapor_percent: h2o_vapor_percent
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
    const era = (window.getGeologicalEra || function () { return { volcanoFactor: 1.0, co2PerVolcano: 150 }; })(currentYears);

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

            // Logger les résultats finaux avec les états
            if (typeof window.logCalculationPhase === 'function') {
                window.logCalculationPhase('CALCULATION COMPLETE', {
                    T0: data.T0 ? data.T0.toFixed(2) : 'N/A',
                    temp_surface_c: data.temp_surface_c ? data.temp_surface_c.toFixed(2) : 'N/A',
                    total_flux: data.total_flux ? data.total_flux.toFixed(2) : 'N/A',
                    albedo: data.albedo ? data.albedo.toFixed(3) : 'N/A',
                    cloud_coverage: data.cloud_coverage ? (data.cloud_coverage * 100).toFixed(1) + '%' : 'N/A'
                });
            }

            // Gérer la géothermie selon la température finale
            // Off (gris) seulement si 0K (corps noir), sinon on
            const btnNoyau = document.getElementById('btn-noyau');
            if (btnNoyau && data.T0 !== undefined) {
                const tempK = data.T0;
                if (tempK === 0 || tempK < 1) {
                    // 0K = corps noir : géothermie off (gris)
                    btnNoyau.classList.add('disabled');
                    btnNoyau.disabled = true;
                    btnNoyau.style.opacity = '0.3';
                    btnNoyau.style.filter = 'grayscale(100%)';
                } else {
                    // Température > 0K : géothermie on (actif)
                    btnNoyau.classList.remove('disabled');
                    btnNoyau.disabled = false;
                    btnNoyau.style.opacity = '1';
                    btnNoyau.style.filter = 'grayscale(0%)';
                }
            }

            plotData.current = data;

            // Les scénarios de référence sont déjà calculés dans calculateInitialData
            // Juste s'assurer qu'ils sont stockés
            if (cache_280ppm) plotData.flux_280ppm = cache_280ppm;
            if (cache_420ppm) plotData.flux_420ppm = cache_420ppm;

            const temp_eff = plotData.current.effective_temperature;
            // Température effective sans effet de serre (référence) ~255K (Terre)
            // Calculée dynamiquement selon l'albedo et l'intensité solaire de l'époque
            const temp_eff_0 = (typeof window.getEffectiveTemperatureNoGreenhouse === 'function')
                ? window.getEffectiveTemperatureNoGreenhouse()
                : 255.0;
            // Température de surface calculée par dichotomie (équilibre radiatif avec CO2 uniquement)
            // Note: Les 15°C réels incluent aussi vapeur d'eau, nuages, etc. - ce modèle ne prend que le CO2
            const temp_surface = temperature(0); // Température au sol (z=0) ajustée par dichotomie
            const temp_surface_c = temp_surface - 273.15;
            // Calculer ΔT° à partir du forçage radiatif (calibration)
            // ΔT° = différence par rapport à 255K (sans CO2)
            // On calcule d'abord les forçages, puis on calcule delta_temp
            // (sera calculé après les forçages)
            let delta_temp = 0; // Sera calculé après

            // Ajouter temp_surface et temp_surface_c à plotData pour que updatePlot puisse les utiliser
            plotData.temp_surface = temp_surface; // Température de surface en K (cohérence avec courbes)
            plotData.temp_surface_c = temp_surface_c;

            // Récupérer l'albedo et la couverture nuageuse depuis les résultats
            const albedo = plotData.current.albedo !== undefined ? plotData.current.albedo : null;
            const cloud_coverage = plotData.current.cloud_coverage !== undefined ? plotData.current.cloud_coverage : null;

            // Calculer les forçages radiatifs séparés
            const forcing_CO2 = typeof window.calculateCO2Forcing === 'function'
                ? window.calculateCO2Forcing(plotData.co2_ppm * 1e-6)
                : 0;

            // Calculer le forcing H2O avec la nouvelle fonction calculateH2OParameters
            let forcing_H2O = 0;
            let h2o_vapor_percent = 0;
            if (typeof window.waterVaporEnabled !== 'undefined' && window.waterVaporEnabled && typeof window.calculateH2OParameters === 'function') {
                // Récupérer l'eau de base de l'époque
                h2o_vapor_percent = (typeof window.h2oVaporPercent !== 'undefined') ? window.h2oVaporPercent : 0;
                
                // Ajouter l'eau totale des météorites
                const h2o_from_meteorites = (typeof window.h2oTotalFromMeteorites !== 'undefined') ? window.h2oTotalFromMeteorites : 0;
                const h2o_total_percent = h2o_vapor_percent + h2o_from_meteorites;
                
                // Calculer la répartition vapeur/glace selon la température
                const h2o_params = window.calculateH2OParameters(temp_surface, h2o_total_percent, cloud_coverage);
                forcing_H2O = h2o_params.greenhouse_forcing;
                
                // 🔒 TOUJOURS mettre à jour h2oIceFractionFromCalculation pour l'affichage
                // (déjà fait dans calculateH2OParameters, mais on force la mise à jour pour être sûr)
                if (typeof window !== 'undefined') {
                    window.h2oIceFractionFromCalculation = h2o_params.ice_fraction || 0;
                }
                
                // Mettre à jour la composition atmosphérique (H2O est déjà mis à jour dans calculateH2OParameters)
            }
            
            // Mettre à jour la composition atmosphérique avec CO2 et CH4
            if (typeof window !== 'undefined' && window.atmosphericComposition) {
                window.atmosphericComposition.CO2 = plotData.co2_ppm * 1e-6;
                window.atmosphericComposition.CH4 = plotData.ch4_ppm * 1e-6;
            }

            // Calculer le forcing CH4
            const forcing_CH4 = (typeof window.methaneEnabled !== 'undefined' && window.methaneEnabled && plotData.ch4_ppm > 0 && typeof window.calculateCH4Forcing === 'function')
                ? window.calculateCH4Forcing(plotData.ch4_ppm * 1e-6)
                : 0;

            const forcing_Albedo = typeof window.calculateAlbedoForcing === 'function' && albedo !== null
                ? window.calculateAlbedoForcing(albedo)
                : 0;

            // Forçage total
            const forcing_total = forcing_CO2 + forcing_H2O + forcing_CH4 + forcing_Albedo;

            // Calculer ΔT° = différence de température par rapport à la référence sans CO2
            // ΔT° = T° actuelle - T° référence (sans effet de serre)
            // C'est la différence directe de température, plus claire et compréhensible
            const TEMP_REF_NO_CO2 = temp_eff_0; // Température effective sans CO2 (référence dynamique)
            delta_temp = temp_surface - TEMP_REF_NO_CO2;

            // Calculer ΔT° par rapport à la température optimale habitable (15°C = 288K)
            const TEMP_HABITABLE_OPTIMAL = 288; // 15°C (Référence terrestre actuelle)
            const TEMP_HABITABLE_MIN = 253; // -20°C
            const TEMP_HABITABLE_MAX = 323; // 50°C
            const delta_temp_habitable = temp_surface - TEMP_HABITABLE_OPTIMAL;
            const life_viable = temp_surface >= TEMP_HABITABLE_MIN && temp_surface <= TEMP_HABITABLE_MAX;

            updateDisplay({
                state: currentState,
                co2_ppm: plotData.co2_ppm,
                ch4_ppm: plotData.ch4_ppm,
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
                forcing_CH4: forcing_CH4,
                forcing_Albedo: forcing_Albedo,
                albedo: albedo,
                cloud_coverage: cloud_coverage,
                h2o_vapor_percent: h2o_vapor_percent
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
        const co2UnitEl = co2NumberEl ? co2NumberEl.nextElementSibling : null;
        if (co2NumberEl) {
            if (ppm > 10000) {
                // Afficher en % si > 10000 ppm (10000 ppm = 1%)
                const percent = (ppm / 10000).toFixed(1);
                co2NumberEl.textContent = percent;
                if (co2UnitEl && co2UnitEl.classList.contains('info-unit')) {
                    co2UnitEl.textContent = '%';
                }
            } else {
                // Afficher en ppm si <= 10000
                co2NumberEl.textContent = ppm.toString();
                if (co2UnitEl && co2UnitEl.classList.contains('info-unit')) {
                    co2UnitEl.textContent = 'ppm';
                }
            }
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

    // === DEBUG: Afficher toutes les valeurs du flux diagram ===
    if (data) {
        // Récupérer l'époque et la date
        let epochName = '--';
        let epochDate = '--';
        if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch) {
                epochName = currentEpoch.name || window.currentEpochName;
                // Formater la date depuis startYears
                if (currentEpoch.startYears !== undefined) {
                    const years = currentEpoch.startYears;
                    epochDate = formatYears(years);
                } else if (window.configOrganigramme && window.configOrganigramme.timeline) {
                    const timelineEpoch = window.configOrganigramme.timeline.find(item =>
                        item.type === 'epoch' && (item.id === window.currentEpochName || item.name === window.currentEpochName)
                    );
                    if (timelineEpoch && timelineEpoch.date) {
                        epochDate = timelineEpoch.date;
                    }
                }
            }
        }

        console.log('=== FLUX DIAGRAM VALUES ===');
        console.log('Époque:', epochName);
        console.log('Date:', epochDate);
        console.log('CO2:', data.co2_ppm !== undefined ? `${Math.round(data.co2_ppm)} ppm` : '--');
        console.log('H2O Vapeur:', data.h2o_vapor_percent !== undefined ? `${data.h2o_vapor_percent.toFixed(1)}%` : '--');
        console.log('CH4:', data.ch4_ppm !== undefined ? `${Math.round(data.ch4_ppm)} ppm` : '--');
        console.log('---');
        console.log('Forcing CO2:', data.forcing_CO2 !== undefined ? `${data.forcing_CO2.toFixed(2)} W/m²` : '--');
        console.log('Forcing H2O:', data.forcing_H2O !== undefined ? `${data.forcing_H2O.toFixed(2)} W/m²` : '--');
        console.log('Forcing CH4:', data.forcing_CH4 !== undefined ? `${data.forcing_CH4.toFixed(2)} W/m²` : '--');
        console.log('Forcing Albedo:', data.forcing_Albedo !== undefined ? `${data.forcing_Albedo.toFixed(2)} W/m²` : '--');
        if (data.forcing_Albedo < 0 && data.temp_surface > 373) {
             console.log('  ℹ️ Note: Négatif car les nuages refroidissent par rapport au magma sombre (Albédo Ref < Actuel)');
        }
        console.log('Forcing Total:', data.forcing !== undefined ? `${data.forcing.toFixed(2)} W/m²` : '--');
        
        // EDS Réel (Calculé depuis le transfert radiatif)
        // EDS = Flux Surface (σT⁴) - Flux Sortant (au sommet)
        const STEFAN_BOLTZMANN = 5.670374419e-8;
        const flux_surface_real = STEFAN_BOLTZMANN * Math.pow(data.temp_surface, 4);
        // Récupérer le flux total sortant (si disponible dans les données brutes plotData.current)
        const flux_top_real = (plotData.current && plotData.current.total_flux) ? plotData.current.total_flux : null;
        
        if (flux_top_real !== null) {
            const eds_real = flux_surface_real - flux_top_real;
            console.log('---');
            console.log('🌡️ BILAN RADIATIF (EDS RÉEL) 🌡️');
            console.log(`Flux Surface (σT⁴): ${flux_surface_real.toFixed(2)} W/m² (${(flux_surface_real/1e6).toFixed(2)} MW/m²)`);
            console.log(`Flux Sortant (Top): ${flux_top_real.toFixed(2)} W/m² (${(flux_top_real/1e6).toFixed(2)} MW/m²)`);
            console.log(`Effet de Serre (EDS): ${eds_real.toFixed(2)} W/m² (${(eds_real/1e6).toFixed(4)} MW/m²)`);
            console.log(`Part piégée: ${((eds_real/flux_surface_real)*100).toFixed(2)}%`);
        } else {
             console.log('---');
             console.log('EDS Réel: Données de flux sortant non disponibles');
        }

        console.log('---');

        // Section Albedo avec détails
        console.log('Albedo:', data.albedo !== undefined ? `${(data.albedo * 100).toFixed(1)}%` : '--');

        // Récupérer les données d'albedo détaillées depuis l'époque courante
        let albedoComponents = [];
        console.log('[updateDisplay] 🔍 DEBUG ALBEDO COMPONENTS - Début');
        console.log('[updateDisplay] 🔍 currentEpochName:', typeof window !== 'undefined' ? window.currentEpochName : 'window undefined');
        console.log('[updateDisplay] 🔍 getGeologicalPeriodByName disponible:', typeof window !== 'undefined' && typeof window.getGeologicalPeriodByName === 'function');
        if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            console.log('[updateDisplay] 🔍 currentEpoch:', currentEpoch ? 'trouvé' : 'non trouvé');
            if (currentEpoch) {
                const cloud_cov = data.cloud_coverage !== undefined ? Math.round(data.cloud_coverage * 100) : 0;
                const magma_cov = Math.round((currentEpoch.magma_coverage || 0) * 100);
                const ocean_cov = Math.round((currentEpoch.ocean_coverage || 0) * 100);
                const forest_cov = Math.round((currentEpoch.forest_coverage || 0) * 100);
                const desert_cov = Math.round((currentEpoch.desert_coverage || 0) * 100);

                // Calculer la couverture de glace (similaire à organigramme.js)
                // Calculer la couverture de glace (incluant la glace additionnelle des météorites)
                let ice_cov = 0;
                const isCorpsNoir = window.currentEpochName === 'Corps noir';
                const h2o_enabled = (typeof window !== 'undefined' && window.waterVaporEnabled !== undefined)
                    ? window.waterVaporEnabled
                    : (currentEpoch.h2o_enabled !== false);
                
                // Récupérer la glace calculée depuis calculateWaterPartition (si disponible)
                let ice_coverage = 0;
                console.log('[updateDisplay] 🔍 DEBUG GLACE - Début calcul ice_coverage');
                console.log('[updateDisplay] 🔍 h2oIceFractionFromCalculation:', typeof window !== 'undefined' ? window.h2oIceFractionFromCalculation : 'window undefined');
                console.log('[updateDisplay] 🔍 temp_surface:', data.temp_surface);
                console.log('[updateDisplay] 🔍 calculateWaterPartition disponible:', typeof window !== 'undefined' && typeof window.calculateWaterPartition === 'function');
                
                // 🔒 PRIORITÉ 1 : Utiliser la valeur calculée par calculateAlbedo (la plus récente et précise)
                if (typeof window !== 'undefined' && window.h2oIceFractionFromCalculation !== undefined) {
                    ice_coverage = Math.min(1, Math.max(0, window.h2oIceFractionFromCalculation));
                    console.log('[updateDisplay] ✅ PRIORITÉ 1: Utilisation de h2oIceFractionFromCalculation =', ice_coverage, '(', (ice_coverage * 100).toFixed(1), '%)');
                } 
                // 🔒 PRIORITÉ 2 : Recalculer avec calculateWaterPartition si pas de valeur disponible
                else if (data.temp_surface !== undefined && typeof window !== 'undefined' && typeof window.calculateWaterPartition === 'function') {
                    const h2o_vapor_percent = (typeof window.h2oVaporPercent !== 'undefined') ? window.h2oVaporPercent : 0;
                    const h2o_from_meteorites = (typeof window.h2oTotalFromMeteorites !== 'undefined') ? window.h2oTotalFromMeteorites : 0;
                    const h2o_total_percent = h2o_vapor_percent + h2o_from_meteorites;
                    console.log('[updateDisplay] 🔍 PRIORITÉ 2: h2o_vapor_percent =', h2o_vapor_percent, '%, h2o_from_meteorites =', h2o_from_meteorites, '%, h2o_total_percent =', h2o_total_percent, '%');
                    if (h2o_total_percent > 0) {
                        const h2o_total_fraction = h2o_total_percent / 100;
                        // Récupérer les paramètres de l'époque courante
                        let epochParams = {};
                        if (window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
                            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
                            if (currentEpoch) {
                                epochParams = {
                                    pressure_atm: currentEpoch.atmospheric_pressure || 1.0,
                                    molar_mass_air: currentEpoch.molar_mass_air || 0.029,
                                    gravity: currentEpoch.gravity || 9.81,
                                    ocean_coverage: currentEpoch.ocean_coverage || 0.7
                                };
                            }
                        }
                        console.log('[updateDisplay] 🔍 Appel calculateWaterPartition avec T=', data.temp_surface, 'K, h2o_total_fraction=', h2o_total_fraction);
                        const waterPartition = window.calculateWaterPartition(data.temp_surface, h2o_total_fraction, epochParams);
                        ice_coverage = waterPartition.ice_fraction || 0;
                        console.log('[updateDisplay] ✅ PRIORITÉ 2: Recalcul avec calculateWaterPartition =', ice_coverage, '(', (ice_coverage * 100).toFixed(1), '%)');
                        // Mettre à jour pour les prochains appels
                        window.h2oIceFractionFromCalculation = ice_coverage;
                    } else {
                        console.log('[updateDisplay] ⚠️ PRIORITÉ 2: h2o_total_percent = 0, pas de calcul');
                    }
                } 
                // 🔒 PRIORITÉ 3 : Calcul classique basé sur la température (fallback)
                else if (data.temp_surface !== undefined) {
                    console.log('[updateDisplay] 🔍 PRIORITÉ 3: Calcul classique basé sur température');
                    // Calcul classique de la glace basé sur la température (si pas de calcul H2O)
                    const T_surface_C = data.temp_surface - 273.15;
                    if (T_surface_C < 0 && T_surface_C > -100) {
                        ice_coverage = Math.min(1, 1 - Math.exp(T_surface_C / 3));

                        // Réduire selon l'effet volcanique
                        const volcanoIceReduction = (typeof window !== 'undefined' && window.volcanoIceReduction !== undefined)
                            ? window.volcanoIceReduction / 100 : 0;
                        ice_coverage = Math.max(0, ice_coverage - volcanoIceReduction);

                        // Réduire selon le flux géothermique
                        const geo_flux = currentEpoch.geothermal_flux || 0.087;
                        const geo_flux_reduction = Math.min(1, geo_flux / 10);
                        ice_coverage = Math.max(0, ice_coverage * (1 - geo_flux_reduction));
                        console.log('[updateDisplay] ✅ PRIORITÉ 3: Calcul classique =', ice_coverage, '(', (ice_coverage * 100).toFixed(1), '%)');
                    } else {
                        console.log('[updateDisplay] ⚠️ PRIORITÉ 3: Température hors limites pour calcul classique');
                    }
                } else {
                    console.log('[updateDisplay] ⚠️ Aucune méthode disponible pour calculer la glace');
                }
                ice_cov = Math.round(ice_coverage * 100);
                console.log('[updateDisplay] 🧊 FIN: ice_coverage =', ice_coverage, '(', (ice_coverage * 100).toFixed(1), '%), ice_cov =', ice_cov, '%');

                const cloud_alb = (currentEpoch.cloud_albedo || 0.40).toFixed(2);
                const magma_alb = (currentEpoch.magma_albedo || 0.05).toFixed(2);
                const ocean_alb = (currentEpoch.ocean_albedo || 0.08).toFixed(2);
                const forest_alb = (currentEpoch.forest_albedo || 0.12).toFixed(2);
                const desert_alb = (currentEpoch.desert_albedo || 0.30).toFixed(2);
                const ice_alb = (currentEpoch.ice_albedo || 0.70).toFixed(2);

                const LOGOS = (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS : {};
                const desert_icon = LOGOS.DESERT || 'fonts/pics/desert.png';
                albedoComponents = [
                    { emoji: LOGOS.CLOUD || '⛅', coverage: cloud_cov, albedo: cloud_alb },
                    { emoji: LOGOS.VOLCANO || '🌋', coverage: magma_cov, albedo: magma_alb },
                    { emoji: LOGOS.OCEAN || '🌊', coverage: ocean_cov, albedo: ocean_alb },
                    { emoji: LOGOS.FOREST || '🌳', coverage: forest_cov, albedo: forest_alb },
                    { emoji: desert_icon, coverage: desert_cov, albedo: desert_alb },
                    { emoji: LOGOS.ICE || '🧊', coverage: ice_cov, albedo: ice_alb }
                ];
                console.log('[updateDisplay] ✅ albedoComponents rempli avec', albedoComponents.length, 'composantes');
                console.log('[updateDisplay] 🔍 ice_cov dans albedoComponents:', ice_cov, '%');
            } else {
                console.log('[updateDisplay] ⚠️ currentEpoch non trouvé, albedoComponents reste vide');
            }
        } else {
            console.log('[updateDisplay] ⚠️ Conditions non remplies pour remplir albedoComponents');
        }

        // Afficher les composantes d'albedo
        console.log('[updateDisplay] 🔍 Affichage albedoComponents: length =', albedoComponents.length);
        if (albedoComponents.length > 0) {
            albedoComponents.forEach(comp => {
                console.log(`${comp.emoji} ${comp.coverage}% x${comp.albedo}`);
            });
        } else {
            // Fallback si pas d'époque
            console.log('[updateDisplay] ⚠️ FALLBACK: albedoComponents vide, utilisation du fallback');
        }

        console.log('---');
        console.log('Temp Surface:', data.temp_surface !== undefined ? `${(data.temp_surface - 273.15).toFixed(1)}°C (${data.temp_surface.toFixed(1)}K)` : '--');
        console.log('Temp Effective:', data.temp_eff !== undefined ? `${(data.temp_eff - 273.15).toFixed(1)}°C (${data.temp_eff.toFixed(1)}K)` : '--');
        console.log('===========================');
    }
}

function updateLegend(data) {
    // Créer la légende avec les motifs de traits
    const grid = document.getElementById('legend-planck-grid');
    if (grid && window.PLANCK_TEMPERATURES) {
        grid.innerHTML = '';

        // Configuration de la grille : déjà définie dans le CSS

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
                const tempF = ((T - 273.15) * 9 / 5 + 32).toFixed(0);
                tempFBelow.textContent = `${tempF}°F`;
                patternContainer.appendChild(tempFBelow);
            }

            patternContainer.appendChild(svgContainer);

            // K à côté (normal) - toujours afficher .0K même si entier
            const labelSpan = document.createElement('span');
            labelSpan.className = 'legend-text';
            // Couleur gérée par CSS (.legend-section * { color: white !important; })
            labelSpan.textContent = `${T.toFixed(1)}K`;

            item.appendChild(patternContainer);
            item.appendChild(labelSpan);
            grid.appendChild(item);
        });

        // Forcer le rendu MathJax après insertion
        if (window.MathJax && window.MathJax.typesetPromise) {
            setTimeout(() => {
                window.MathJax.typesetPromise([grid]).catch(() => { });
            }, 100);
        }
    }

    // Ajouter les légendes pour les courbes d'équilibre (corps noir pointillé et courbe réelle pleine)
    const equilibreCurvesContainer = document.getElementById('legend-equilibre-curves');
    if (equilibreCurvesContainer && data && data.current && data.current.effective_temperature) {
        equilibreCurvesContainer.innerHTML = '';

        const T = data.current.effective_temperature;
        const tempC = (T - 273.15).toFixed(0);
        const tempF = ((T - 273.15) * 9 / 5 + 32).toFixed(0);

        // Calculer la couleur dynamique basée sur la température de surface (pour harmoniser avec le plot)
        let dynamicColor = 'cyan';
        if (data.current && typeof data.current.temp_surface === 'number') {
            const tempSurfaceC = data.current.temp_surface - 273.15;
            if (typeof window.tempSurfaceToColor === 'function') {
                dynamicColor = window.tempSurfaceToColor(tempSurfaceC);
            }
        }

        // Créer deux éléments de légende : un pour le corps noir (pointillé 'dot') et un pour la courbe réelle (pleine 'solid')
        const patterns = [
            { name: 'dot', label: 'Corps noir' },
            { name: 'solid', label: 'Courbe réelle' }
        ];

        patterns.forEach((patternInfo) => {
            const item = document.createElement('div');
            item.className = 'legend-equilibre-item';

            // Créer le SVG avec le pattern approprié (couleur dynamique)
            const dashArray = typeof window.getDashArray === 'function'
                ? window.getDashArray(patternInfo.name)
                : (patternInfo.name === 'dot' ? '1,3' : 'none');
            const dashAttr = dashArray !== 'none' ? `stroke-dasharray="${dashArray}"` : '';
            const patternSVG = `<svg width="50" height="5" style="vertical-align: middle; display: inline-block; margin-right: 8px;">
                <line x1="2" y1="2.5" x2="48" y2="2.5" stroke="${dynamicColor}" stroke-width="2" ${dashAttr}/>
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
                tempCAbove.style.color = dynamicColor;
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
                tempFBelow.style.color = dynamicColor;
                tempFBelow.textContent = `${tempF}°F`;
                patternContainer.appendChild(tempFBelow);
            }

            patternContainer.appendChild(svgContainer);

            // K à côté (normal) - toujours afficher .0K même si entier
            const labelSpan = document.createElement('span');
            labelSpan.className = 'legend-text';
            labelSpan.style.color = dynamicColor;
            labelSpan.textContent = `${T.toFixed(1)}K`;

            item.appendChild(patternContainer);
            item.appendChild(labelSpan);
            equilibreCurvesContainer.appendChild(item);
        });

        // Remplacer les spans CSS par des SVG pour harmoniser les pointillés dans l'intégrale
        const dottedSpan = document.querySelector('.legend-line-dotted');
        const solidSpan = document.querySelector('.legend-line-solid');

        if (dottedSpan) {
            // Créer un SVG avec le même pattern que la légende (dot avec stroke-dasharray="1,3")
            const dashArray = typeof window.getDashArray === 'function' ? window.getDashArray('dot') : '1,3';
            dottedSpan.innerHTML = `<svg width="30" height="2" style="vertical-align: middle; display: inline-block;">
                <line x1="0" y1="1" x2="30" y2="1" stroke="${dynamicColor}" stroke-width="2" stroke-dasharray="${dashArray}"/>
            </svg>`;
            // Supprimer le style CSS border qui n'est plus nécessaire
            dottedSpan.style.border = 'none';
        }

        if (solidSpan) {
            // Créer un SVG avec une ligne pleine
            solidSpan.innerHTML = `<svg width="30" height="2" style="vertical-align: middle; display: inline-block;">
                <line x1="0" y1="1" x2="30" y2="1" stroke="${dynamicColor}" stroke-width="2"/>
            </svg>`;
            // Supprimer le style CSS border qui n'est plus nécessaire
            solidSpan.style.border = 'none';
        }
    }
}

// Fonction pour obtenir le style CSS de bordure selon le pattern
function getDashStyleForPattern(pattern) {
    switch (pattern) {
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

    // 🔒 Si setEpoch est appelé depuis un bouton époque (pas depuis un événement),
    // s'assurer que maximiseData est false pour utiliser la config de l'époque
    // (maximiseData ne sera true que si un événement l'a défini avant d'appeler setEpoch)
    const isEventCall = (typeof window !== 'undefined' && window.maximiseData === true);
    if (!isEventCall) {
        // Réinitialiser maximiseData si ce n'est pas un appel depuis un événement
        if (typeof window !== 'undefined') {
            window.maximiseData = false;
        }
    }

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

    // 🔒 Stocker l'ancienne époque AVANT de la changer (pour conserver l'eau des météorites)
    const previousEpoch = (typeof window.currentEpochName !== 'undefined') ? window.currentEpochName : 'Corps noir';
    
    // Stocker le nom de l'époque globalement pour updateFluxLabels
    window.currentEpochName = epochName;
    
    // 🔒 CONSERVER l'eau totale des météorites lors du passage de "Corps noir" à une autre époque
    // (elle sera ajustée plus tard pour ne pas dépasser 100% au total)
    // Ne réinitialiser que si on change d'époque ET qu'on ne vient pas de "Corps noir"
    if (epochName !== 'Corps noir' && previousEpoch !== 'Corps noir' && typeof window.h2oTotalFromMeteorites !== 'undefined') {
        // Réinitialiser seulement si on change d'époque normale (pas depuis Corps noir)
        window.h2oTotalFromMeteorites = 0;
    }
    // Si on vient de "Corps noir", conserver h2oTotalFromMeteorites (sera ajusté plus tard)
    
    // Mettre à jour les boutons d'action selon l'époque
    if (typeof window.updateEpochActions === 'function') {
        window.updateEpochActions();
    }

    // Mettre à jour le logo de la Terre avec l'image de l'époque
    // Modifier la configuration du noeud terre et recréer la cellule
    const terreNode = window.configOrganigramme.nodes.find(n => n.id === 'terre');
    if (terreNode && terreNode.epoch && Array.isArray(terreNode.epoch)) {
        // Trouver la configuration de l'époque courante
        const epochConfig = terreNode.epoch.find(e => e.epochName === epochName);

        if (epochConfig) {
            // Recréer la cellule terre avec la configuration de l'époque
            const oldCell = document.getElementById('cell-terre');
            if (oldCell && typeof window.createCell === 'function') {
                const parent = oldCell.parentElement;
                oldCell.remove();

                const newCell = window.createCell(
                    terreNode.x,
                    terreNode.y,
                    epochConfig.radius,
                    epochConfig.fillColor,
                    epochConfig.strokeColor,
                    epochConfig.logo,
                    terreNode.left,
                    terreNode.right,
                    terreNode.top,
                    terreNode.bottom,
                    terreNode.tooltip,
                    terreNode.radiation,
                    null, // rectangleOptions
                    null, // fillImage
                    terreNode.id,
                    terreNode.zIndex,
                    terreNode.logoScale,
                    terreNode.logoOffsetY,
                    epochConfig.strokeSize
                );

                parent.appendChild(newCell);
            }
        }
    }

    // Mettre à jour les radiations du noyau selon l'époque
    if (typeof window.recreateNoyauRadiation === 'function') {
        window.recreateNoyauRadiation();
    }

    // Recréer les radiations de la terre (car le rayon peut avoir changé)
    if (typeof window.recreateTerreRadiation === 'function') {
        window.recreateTerreRadiation();
    }

    // Recalculer les positions des flèches et étiquettes car le rayon de la terre a changé
    if (typeof window.generateArrows === 'function') {
        window.generateArrows();
    }

    disableButtons(); // Désactiver les boutons

    // Mettre à jour la timeline pour correspondre au début de l'époque
    timelineFrame = Math.floor(epoch.startYears / YEARS_PER_FRAME);

    // Stocker le début de l'époque pour calculer le delta
    currentEpochStartYears = epoch.startYears;

    // Mettre à jour la date de début affichée
    const epochStartTimeDisplay = document.getElementById('epoch-start-time');
    if (epochStartTimeDisplay) {
        const formattedYears = formatYears(epoch.startYears);
        epochStartTimeDisplay.textContent = formattedYears;
    }

    // Afficher le nom de l'époque dans la timeline
    const epochNameDisplay = document.getElementById('epoch-name');
    if (epochNameDisplay) {
        // Pour "Corps noir", utiliser un nom plus descriptif
        let displayName = epoch.name;
        if (epoch.name === 'Corps noir') {
            displayName = 'État initial';
        }
        epochNameDisplay.textContent = displayName;
    }

    // Afficher le nom de l'époque dans la div de température
    const epochNameTempDisplay = document.getElementById('epoch-name-temp');
    if (epochNameTempDisplay) {
        // Récupérer le nom depuis la timeline de configOrganigramme
        let displayName = epoch.name;
        if (window.configOrganigramme && window.configOrganigramme.timeline) {
            // Chercher l'epoch dans la timeline par nom (plus fiable que par id)
            const timelineEpoch = window.configOrganigramme.timeline.find(item =>
                item.type === 'epoch' && item.name === epochName
            );
            if (timelineEpoch) {
                displayName = timelineEpoch.name;
            }
        }
        epochNameTempDisplay.textContent = displayName;
    }

    // Réinitialiser "+0 ans" quand on clique sur une époque
    const infoTimeDisplay = document.getElementById('info-time');
    if (infoTimeDisplay) {
        infoTimeDisplay.textContent = '+0 ans';
    }

    updateTimeline();

    // Forcer la mise à jour des labels de flux (Soleil, Noyau, etc.) avec les paramètres de la nouvelle époque
    if (typeof window.updateFluxLabels === 'function') {
        window.updateFluxLabels(window.plotData || {});
    }

    // Appliquer les conditions initiales
    // En époque "Corps noir", tout est désactivé (température ~206.1K, pas de noyau différencié)
    const isCorpsNoir = epoch.name === 'Corps noir';
    const tempK = isCorpsNoir ? 0 : null; // 0K = corps noir (pas de noyau différencié)

    // Gérer la géothermie (noyau) : off (gris) seulement si 0K (corps noir), sinon on
    const btnNoyau = document.getElementById('btn-noyau');
    if (btnNoyau) {
        if (isCorpsNoir || tempK === 0) {
            // Corps noir : géothermie off (gris)
            btnNoyau.classList.add('disabled');
            btnNoyau.disabled = true;
            btnNoyau.style.opacity = '0.3';
            btnNoyau.style.filter = 'grayscale(100%)';
        } else {
            // Autres époques : géothermie on (actif)
            btnNoyau.classList.remove('disabled');
            btnNoyau.disabled = false;
            btnNoyau.style.opacity = '1';
            btnNoyau.style.filter = 'grayscale(0%)';
        }
    }

    // 1. CO2
    // 🔒 Convertir les quantités (kg) en ppm pour compatibilité avec le code existant
    // Récupérer la masse atmosphérique totale de l'époque (ou utiliser la valeur moderne par défaut)
    const total_atmosphere_mass_kg = epoch.total_atmosphere_mass_kg || (typeof window !== 'undefined' && window.EARTH_ATMOSPHERE_MASS_KG) || 5.15e18;
    
    // Convertir co2_kg en fraction molaire puis en ppm
    let defaultCO2_ppm = 0;
    if (!isCorpsNoir && epoch.co2_kg !== undefined && epoch.co2_kg > 0) {
        if (typeof window !== 'undefined' && typeof window.co2KgToFraction === 'function') {
            const co2_fraction = window.co2KgToFraction(epoch.co2_kg, total_atmosphere_mass_kg);
            defaultCO2_ppm = co2_fraction * 1e6; // Convertir fraction en ppm
        } else {
            // Fallback : approximation simple
            const MOLAR_MASS_AIR = epoch.molar_mass_air || 0.029;
            const moles_CO2 = epoch.co2_kg / 0.044; // MOLAR_MASS_CO2
            const moles_total = total_atmosphere_mass_kg / MOLAR_MASS_AIR;
            defaultCO2_ppm = (moles_CO2 / moles_total) * 1e6;
        }
    }
    
    // 🔒 Si maximiseData (appel depuis un événement), prendre le max entre la valeur sauvegardée et la valeur par défaut
    // Sinon (appel depuis un bouton époque), utiliser la config de l'époque
    if (typeof window !== 'undefined' && window.maximiseData) {
        const savedCO2 = (typeof window.savedCO2 !== 'undefined') ? window.savedCO2 : 0;
        plotData.co2_ppm = Math.max(savedCO2, defaultCO2_ppm);
        console.log(`[setEpoch] maximiseData CO2: sauvegardé=${savedCO2.toFixed(1)}ppm, défaut=${defaultCO2_ppm.toFixed(1)}ppm, max=${plotData.co2_ppm.toFixed(1)}ppm`);
    } else {
        // Comportement normal : utiliser la config de l'époque
        plotData.co2_ppm = defaultCO2_ppm;
    }
    const co2_fraction = plotData.co2_ppm * 1e-6;
    currentState = 3; // Utiliser state 3 comme base pour les valeurs personnalisées

    // Mettre à jour le bouton CO2
    const btnCo2 = document.getElementById('btn-co2');
    if (btnCo2) {
        if (isCorpsNoir || defaultCO2_ppm === 0) {
            // Forcer en off/gris si 0% ou Corps noir
            btnCo2.classList.remove('checked');
            if (isCorpsNoir) {
                btnCo2.classList.add('disabled');
                btnCo2.disabled = true;
            } else {
                btnCo2.classList.remove('disabled');
                btnCo2.disabled = false;
            }
        } else {
            btnCo2.classList.remove('disabled');
            btnCo2.disabled = false;
            btnCo2.classList.add('checked');
        }
    }

    // 2. H2O
    // 🔒 L'état H2O est déterminé par la présence d'eau (h2o_kg > 0) et l'état du bouton, pas par la config
    if (typeof window.waterVaporEnabled !== 'undefined') {
        // H2O peut être activé si : pas Corps noir ET il y a de l'eau (h2o_kg > 0)
        const hasWater = !isCorpsNoir && epoch.h2o_kg > 0;
        // Si l'époque a de l'eau, activer H2O par défaut (l'utilisateur peut désactiver via le bouton)
        window.waterVaporEnabled = hasWater;
        
        // 🔒 Si maximiseData (appel depuis un événement), prendre le max entre l'eau sauvegardée et les valeurs par défaut de l'époque
        // Sinon (appel depuis un bouton époque), utiliser la config de l'époque
        // Note: h2o_kg sera utilisé via calculations_h2o.js pour calculer les 3 états (vapeur/liquide/glace)
        // Pour l'instant, on utilise h2o_vapor_percent comme fallback si h2o_kg n'est pas disponible
        const h2o_default = epoch.h2o_vapor_percent || 0; // DEPRECATED: Sera remplacé par calcul depuis h2o_kg
        
        if (typeof window !== 'undefined' && window.maximiseData) {
            // Prendre le max entre l'eau totale sauvegardée et la valeur par défaut de l'époque
            const savedH2O = (typeof window.savedH2O !== 'undefined') ? window.savedH2O : 0;
            const h2o_total_max = Math.max(savedH2O, h2o_default);
            
            // Répartir : base = valeur par défaut, météorites = le reste (max 100% total)
            window.h2oVaporPercent = h2o_default;
            window.h2oTotalFromMeteorites = Math.max(0, Math.min(100 - h2o_default, h2o_total_max - h2o_default));
            
            console.log(`[setEpoch] maximiseData H2O: sauvegardé=${savedH2O.toFixed(1)}%, défaut=${h2o_default.toFixed(1)}%, max=${h2o_total_max.toFixed(1)}%`);
            console.log(`[setEpoch] Résultat: base=${window.h2oVaporPercent.toFixed(1)}%, météorites=${window.h2oTotalFromMeteorites.toFixed(1)}%, total=${(window.h2oVaporPercent + window.h2oTotalFromMeteorites).toFixed(1)}%`);
            
            // Réinitialiser le flag après utilisation
            window.maximiseData = false;
        } else {
            // Comportement normal : utiliser les valeurs par défaut de l'époque
            window.h2oVaporPercent = h2o_default;
            
            // 🔒 Ajuster l'eau des météorites si on vient de "Corps noir" pour ne pas dépasser 100% au total
            // (seulement si on n'utilise pas maximiseData, donc si on clique directement sur un bouton époque)
            if (previousEpoch === 'Corps noir' && typeof window.h2oTotalFromMeteorites !== 'undefined' && window.h2oTotalFromMeteorites > 0) {
                const h2o_base = window.h2oVaporPercent || 0;
                const h2o_meteorites = window.h2oTotalFromMeteorites || 0;
                const h2o_total = h2o_base + h2o_meteorites;
                
                if (h2o_total > 100) {
                    // Ajuster l'eau des météorites pour que la somme ne dépasse pas 100%
                    window.h2oTotalFromMeteorites = Math.max(0, 100 - h2o_base);
                    console.log(`[setEpoch] Ajustement eau météorites: ${h2o_meteorites.toFixed(1)}% → ${window.h2oTotalFromMeteorites.toFixed(1)}% (base: ${h2o_base.toFixed(1)}%, total: ${(h2o_base + window.h2oTotalFromMeteorites).toFixed(1)}%)`);
                } else {
                    console.log(`[setEpoch] Eau conservée: base=${h2o_base.toFixed(1)}%, météorites=${h2o_meteorites.toFixed(1)}%, total=${h2o_total.toFixed(1)}%`);
                }
            } else if (previousEpoch !== 'Corps noir') {
                // Si on change d'époque normale (pas depuis Corps noir), réinitialiser l'eau des météorites
                window.h2oTotalFromMeteorites = 0;
            }
        }
        
        window.cloudCoverage = epoch.cloud_coverage || 0; // Couverture nuageuse
    }

    // Mettre à jour l'affichage H2O
    const h2oStatusElement = document.getElementById('h2o-status-synthese');
    if (h2oStatusElement) {
        h2oStatusElement.textContent = (!isCorpsNoir && epoch.h2o_kg > 0 && window.waterVaporEnabled) ? 'Activé' : 'Désactivé';
    }

    // Mettre à jour le bouton H2O
    const btnH2O = document.getElementById('btn-h2o');
    if (btnH2O) {
        if (isCorpsNoir || epoch.h2o_kg === 0) {
            // Forcer en off/gris si désactivé ou Corps noir
            btnH2O.classList.remove('checked');
            if (isCorpsNoir) {
                btnH2O.classList.add('disabled');
                btnH2O.disabled = true;
            } else {
                btnH2O.classList.remove('disabled');
                btnH2O.disabled = false;
            }
        } else {
            btnH2O.classList.remove('disabled');
            btnH2O.disabled = false;
            // Synchroniser le bouton avec window.waterVaporEnabled (état déterminé par la présence d'eau)
            if (window.waterVaporEnabled) {
                btnH2O.classList.add('checked');
            } else {
                btnH2O.classList.remove('checked');
            }
        }
    }

    const btn = document.getElementById('btn-cloud');
    if (btn) {
        if (!isCorpsNoir && epoch.h2o_kg > 0) {
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
    // 🔒 Convertir ch4_kg en ppm
    let defaultCH4_ppm = 0;
    if (!isCorpsNoir && epoch.ch4_kg !== undefined && epoch.ch4_kg > 0) {
        if (typeof window !== 'undefined' && typeof window.ch4KgToFraction === 'function') {
            const ch4_fraction = window.ch4KgToFraction(epoch.ch4_kg, total_atmosphere_mass_kg);
            defaultCH4_ppm = ch4_fraction * 1e6; // Convertir fraction en ppm
        } else {
            // Fallback : approximation simple
            const MOLAR_MASS_AIR = epoch.molar_mass_air || 0.029;
            const moles_CH4 = epoch.ch4_kg / 0.016; // MOLAR_MASS_CH4
            const moles_total = total_atmosphere_mass_kg / MOLAR_MASS_AIR;
            defaultCH4_ppm = (moles_CH4 / moles_total) * 1e6;
        }
    }
    
    // 🔒 Si maximiseData (appel depuis un événement), prendre le max entre la valeur sauvegardée et la valeur par défaut
    // Sinon (appel depuis un bouton époque), utiliser la config de l'époque
    if (typeof window !== 'undefined' && window.maximiseData) {
        const savedCH4 = (typeof window.savedCH4 !== 'undefined') ? window.savedCH4 : 0;
        plotData.ch4_ppm = Math.max(savedCH4, defaultCH4_ppm);
        console.log(`[setEpoch] maximiseData CH4: sauvegardé=${savedCH4.toFixed(1)}ppm, défaut=${defaultCH4_ppm.toFixed(1)}ppm, max=${plotData.ch4_ppm.toFixed(1)}ppm`);
    } else {
        // Comportement normal : utiliser la config de l'époque
        plotData.ch4_ppm = defaultCH4_ppm;
    }
    // Activer CH4 si la concentration est > 0
    if (typeof window.methaneEnabled !== 'undefined') {
        window.methaneEnabled = !isCorpsNoir && (defaultCH4_ppm > 0);
    }

    // Mettre à jour le bouton CH4
    const btnMethane = document.getElementById('btn-methane');
    if (btnMethane) {
        if (isCorpsNoir || !epoch.ch4_ppm || epoch.ch4_ppm === 0) {
            // Forcer en off/gris si 0% ou Corps noir
            btnMethane.classList.remove('checked');
            if (isCorpsNoir) {
                btnMethane.classList.add('disabled');
                btnMethane.disabled = true;
            } else {
                btnMethane.classList.remove('disabled');
                btnMethane.disabled = false;
            }
        } else {
            btnMethane.classList.remove('disabled');
            btnMethane.disabled = false;
            btnMethane.classList.add('checked');
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

    // Fonction pour mettre à jour les boutons d'action selon l'époque
    window.updateEpochActions = function () {
        const eventsLogos = document.getElementById('timeline-events-logos');
        if (!eventsLogos) return;

        eventsLogos.innerHTML = ''; // Vider les boutons existants

        const currentEpochName = window.currentEpochName || 'Corps noir';

        if (currentEpochName === 'Corps noir') {
            // Action 1 : Météorites de glace (augmente la glace à la surface, donc l'albedo)
            const iceMeteorBtn = document.createElement('img');
            iceMeteorBtn.src = 'fonts/pics/ice_meteorite.png';
            iceMeteorBtn.alt = 'Météorite de glace';
            iceMeteorBtn.className = 'timeline-event-logo';
            // 🔒 Le tooltip sera ajouté automatiquement depuis l'attribut alt
            iceMeteorBtn.addEventListener('click', () => {
                // Ajouter de l'eau totale (la répartition vapeur/glace sera calculée selon la température)
                const currentH2O = (typeof window.h2oTotalFromMeteorites !== 'undefined' && window.h2oTotalFromMeteorites !== null) ? window.h2oTotalFromMeteorites : 0;
                const newH2O = Math.min(100, currentH2O + 5); // +5% d'eau totale par météorite, max 100%
                window.h2oTotalFromMeteorites = newH2O;
                
                console.log(`[Météorite glace] Eau totale: ${currentH2O.toFixed(1)}% → ${newH2O.toFixed(1)}%`);
                
                // 🔒 FORCER le recalcul en réinitialisant la valeur mise en cache
                // Sinon, calculateAlbedo réutilise l'ancienne valeur de h2oIceFractionFromCalculation
                if (typeof window !== 'undefined') {
                    window.h2oIceFractionFromCalculation = undefined;
                }
                
                // 🔒 Ajouter +1000 ans (100 frames) à chaque clic sur météorite glace
                for (let i = 0; i < 100; i++) {
                    if (typeof window.incrementTimeline === 'function') {
                        window.incrementTimeline();
                    }
                }
                
                // Recalculer avec le CO2 actuel (ne pas changer le CO2, juste recalculer avec la nouvelle eau)
                if (typeof window.updateCO2LevelDirect === 'function' && plotData.co2_ppm !== undefined) {
                    const current_co2_fraction = plotData.co2_ppm * 1e-6;
                    window.updateCO2LevelDirect(current_co2_fraction);
                }
            });
            eventsLogos.appendChild(iceMeteorBtn);

            // Action 2 : Impact majeur (création de la lune, passe à l'époque suivante)
            const bigImpactBtn = document.createElement('img');
            bigImpactBtn.src = 'fonts/pics/big_impact.png';
            bigImpactBtn.alt = 'Impact majeur - Crée la lune';
            bigImpactBtn.className = 'timeline-event-logo';
            // 🔒 Le tooltip sera ajouté automatiquement depuis l'attribut alt
            bigImpactBtn.addEventListener('click', () => {
                // 🔒 Sauvegarder les valeurs actuelles avant le changement d'époque
                if (typeof window !== 'undefined') {
                    // Sauvegarder eau (base + météorites)
                    const h2o_base = (typeof window.h2oVaporPercent !== 'undefined') ? window.h2oVaporPercent : 0;
                    const h2o_meteorites = (typeof window.h2oTotalFromMeteorites !== 'undefined') ? window.h2oTotalFromMeteorites : 0;
                    window.savedH2O = h2o_base + h2o_meteorites;
                    
                    // Sauvegarder CO2
                    window.savedCO2 = (typeof plotData !== 'undefined' && plotData.co2_ppm !== undefined) ? plotData.co2_ppm : 0;
                    
                    // Sauvegarder CH4
                    window.savedCH4 = (typeof plotData !== 'undefined' && plotData.ch4_ppm !== undefined) ? plotData.ch4_ppm : 0;
                    
                    console.log(`[big_impact] Sauvegarde: H2O=${window.savedH2O.toFixed(1)}%, CO2=${window.savedCO2.toFixed(1)}ppm, CH4=${window.savedCH4.toFixed(1)}ppm`);
                    
                    // Flag pour maximiser les données
                    window.maximiseData = true;
                }
                // Passer à l'époque suivante (Hadéen)
                if (typeof window.setEpoch === 'function') {
                    window.setEpoch('Hadéen');
                }
            });
            eventsLogos.appendChild(bigImpactBtn);
        } else if (currentEpochName === 'Hadéen') {
            // Actions pour l'Hadéen : évolution temporelle vers l'Archéen
            // Après l'impact, la Terre se refroidit progressivement sur 200-500 Ma
            
            // Action 1 : Avancer dans le temps (refroidissement progressif)
            const timeAdvanceBtn = document.createElement('button');
            timeAdvanceBtn.textContent = '⏩ +50 Ma';
            timeAdvanceBtn.className = 'timeline-event-button';
            timeAdvanceBtn.alt = 'Avancer de 50 Ma - Refroidissement progressif';
            timeAdvanceBtn.addEventListener('click', () => {
                // Avancer de 50 Ma (5000 frames de 10 ans)
                for (let i = 0; i < 5000; i++) {
                    if (typeof window.incrementTimeline === 'function') {
                        window.incrementTimeline();
                    }
                }
                // Recalculer avec les nouvelles conditions (refroidissement, apport d'eau possible)
                if (typeof window.updateCO2LevelDirect === 'function' && plotData.co2_ppm !== undefined) {
                    const current_co2_fraction = plotData.co2_ppm * 1e-6;
                    window.updateCO2LevelDirect(current_co2_fraction);
                }
            });
            eventsLogos.appendChild(timeAdvanceBtn);
            
            // Action 2 : Apport d'eau supplémentaire (météorites continuent de tomber)
            const waterAdditionBtn = document.createElement('img');
            waterAdditionBtn.src = 'fonts/pics/ice_meteorite.png';
            waterAdditionBtn.alt = 'Apport d\'eau - Météorites continuent de tomber';
            waterAdditionBtn.className = 'timeline-event-logo';
            waterAdditionBtn.addEventListener('click', () => {
                // Ajouter de l'eau totale (en kg, pas en %)
                // TODO: Convertir h2oTotalFromMeteorites en kg et l'ajouter à epoch.h2o_kg
                // Pour l'instant, on garde le système en % pour compatibilité
                const currentH2O = (typeof window.h2oTotalFromMeteorites !== 'undefined' && window.h2oTotalFromMeteorites !== null) ? window.h2oTotalFromMeteorites : 0;
                const newH2O = Math.min(100, currentH2O + 2); // +2% d'eau totale par apport
                window.h2oTotalFromMeteorites = newH2O;
                
                console.log(`[Hadéen - Apport eau] Eau totale: ${currentH2O.toFixed(1)}% → ${newH2O.toFixed(1)}%`);
                
                // Forcer le recalcul
                if (typeof window !== 'undefined') {
                    window.h2oIceFractionFromCalculation = undefined;
                }
                
                // Recalculer
                if (typeof window.updateCO2LevelDirect === 'function' && plotData.co2_ppm !== undefined) {
                    const current_co2_fraction = plotData.co2_ppm * 1e-6;
                    window.updateCO2LevelDirect(current_co2_fraction);
                }
            });
            eventsLogos.appendChild(waterAdditionBtn);
        }
        // Ajouter d'autres actions pour d'autres époques si nécessaire
    };

    // Mettre à jour les actions au chargement
    if (typeof window.updateEpochActions === 'function') {
        window.updateEpochActions();
    }

    // Sélectionner "Corps noir" par défaut
    const corpsNoirButton = document.querySelector('.epoch-btn[data-epoch="Corps noir"]');
    if (corpsNoirButton) {
        corpsNoirButton.classList.add('selected');
    }

    // Initialiser l'époque globale par défaut
    window.currentEpochName = 'Corps noir';

    // Initialiser l'époque par défaut (Corps noir)
    if (typeof window.getGeologicalPeriodByName === 'function') {
        const defaultEpoch = window.getGeologicalPeriodByName('Corps noir');
        if (defaultEpoch) {
            currentEpochStartYears = defaultEpoch.startYears;
        }
    }

    // Initialiser le nom de l'époque dans la div de température
    const epochNameTempDisplay = document.getElementById('epoch-name-temp');
    if (epochNameTempDisplay) {
        // Récupérer le nom depuis la timeline de configOrganigramme
        let displayName = 'Corps noir';
        if (window.configOrganigramme && window.configOrganigramme.timeline) {
            const timelineEpoch = window.configOrganigramme.timeline.find(item =>
                item.type === 'epoch' && item.id === 'corps-noir'
            );
            if (timelineEpoch) {
                displayName = timelineEpoch.name;
            }
        }
        epochNameTempDisplay.textContent = displayName;
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

    // Initialiser les event listeners sur les boutons du flux
    if (typeof window.initFluxButtonListeners === 'function') {
        // Attendre un peu pour que les boutons soient créés
        setTimeout(() => {
            window.initFluxButtonListeners();
        }, 100);
    }

    // Créer les radiations de la terre (doit être fait après l'initialisation car le radius dépend de l'époque)
    if (typeof window.recreateTerreRadiation === 'function') {
        window.recreateTerreRadiation();
    }

    // Ajouter un gestionnaire de clic sur la température pour cycler les unités
    const syntheseTempEl = document.querySelector('.synthese_Temp');
    if (syntheseTempEl) {
        syntheseTempEl.style.cursor = 'pointer';
        syntheseTempEl.addEventListener('click', cycleTemperatureUnit);
    }

    // Initialiser l'horloge au chargement
    setTimeout(() => {
        const infoTimeDisplay = document.getElementById('info-time');
        if (infoTimeDisplay) {
            infoTimeDisplay.textContent = '+0 ans';
            updateTimeline(); // Forcer une mise à jour immédiate (affichage seulement, pas d'incrémentation)
        }
        // NE PAS démarrer l'horloge automatiquement - elle s'incrémentera uniquement lors des calculs/clics
    }, 100);
});

