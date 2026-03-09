// ============================================================================
// File: main.js - Logique principale de la simulation
// Desc: En français, dans l'architecture, je suis le module principal de simulation
// Version 1.0.0
// Date: [January 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
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
    
    // Flag pour contrôler l'affichage des phases de debug
    window.isDebugPhases = false; // Désactiver les logs de phase pour nettoyer // Mettre à false pour désactiver les logs de phases
    window.calculationInProgress = false; // Exposé pour plot.js (resizeCanvasToPlot skipReposition pendant dichotomie)
}

var CONST = window.CONST; /* var pour éviter redeclaration avec plot.js */

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
            return tempC + CONST.KELVIN_TO_CELSIUS;
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
            const tempK = currentTempCelsius + CONST.KELVIN_TO_CELSIUS;
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
    // Mettre à jour la pression au sol depuis DATA si disponible
    const pressureValEl = document.getElementById('pressure-surface-synthese');
    if (pressureValEl && window.DATA && window.DATA['🫧'] && window.DATA['🫧']['🎈'] != null) {
        const P = window.DATA['🫧']['🎈'];
        pressureValEl.textContent = Number.isFinite(P) ? '🎈 ' + P.toFixed(2) + ' atm' : '🎈 -- atm';
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
    window.calculationInProgress = true;
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
    window.calculationInProgress = false;
    
    // Activer l'animation de la planète après la fin des calculs
    // Chercher toutes les textures de planète et retirer la classe "paused"
    const planetTextures = document.querySelectorAll('.planet-texture[data-planet-texture="true"]');
    planetTextures.forEach(texture => {
        texture.classList.remove('paused');
    });
    const currentYears = (window.timelineFrame || 0) * (window.YEARS_PER_FRAME || 10);
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
    if (typeof window !== 'undefined' && window.timelineLastUpdate !== undefined) {
        window.timelineLastUpdate = performance.now();
    }
}

// ============================================================================
// HORLOGE / TIMELINE
// ============================================================================
// Code déplacé dans timeline.js

// ============================================================================
// INTERPRÉTEUR DE CONFIGURATION DYNAMIQUE
// ============================================================================
/**
 * Interprète une valeur de configuration en remplaçant les variables dynamiques
 * Variables supportées:
 * - {$ticTime} : remplacé par Math.floor(window.infoTimeMa / 50)
 * 
 * Expressions mathématiques supportées:
 * - '10-{$ticTime}' : calculé comme 10 - ticTime
 * - '7-{$ticTime}/2' : calculé comme 7 - (ticTime / 2)
 * - Toute expression mathématique valide après remplacement de {$ticTime}
 * 
 * @param {string|number} value - Valeur à interpréter (peut être une chaîne avec {$ticTime} ou un nombre)
 * @returns {number|string} - Valeur interprétée (nombre si expression mathématique, chaîne sinon)
 */
function interpretConfigValue(value) {
    // Pas besoin d'interprétation pour les nombres
    if (typeof value === 'number') {
        return value;
    }
    
    // Retourner tel quel si ce n'est pas une chaîne
    if (typeof value !== 'string') {
        return value;
    }
    
    // Si pas de placeholder, retourner tel quel
    if (!value.includes('{$') && !value.includes('$ticTime')) {
        return value;
    }
    
    // S'assurer que window.infoTimeMa est défini (initialiser à 0 si nécessaire)
    if (typeof window.infoTimeMa === 'undefined') {
        window.infoTimeMa = 0;
    }
    
    // Calculer ticTime = infoTimeMa / 50
    const ticTime = Math.floor((window.infoTimeMa || 0) / 50);

    // Détecter si c'est un chemin d'image (pour arrondir automatiquement les résultats)
    const isImagePath = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(value);
    
    // Gérer les expressions entre accolades {expression}
    // Exemple: "text_archeen{$ticTime/3}.png" → "text_archeen2.png"
    // 1. Trouver toutes les expressions entre accolades
    // 2. Remplacer $ticTime dans chaque expression
    // 3. Évaluer l'expression
    // 4. Remplacer l'expression complète par le résultat (arrondi si image)
    
    let interpreted = value;
    
    // Pattern pour trouver {expression} où expression peut contenir $ticTime et fonctions Math
    // Note: Le pattern doit capturer les accolades ET l'expression à l'intérieur
    const expressionPattern = /\{([^}]+)\}/g;
    const matches = [...value.matchAll(expressionPattern)];
    
    // Traiter chaque expression trouvée
    for (const match of matches) {
        const fullMatch = match[0]; // {expression}
        const expression = match[1]; // expression (sans les accolades)
        
        // Remplacer $ticTime dans l'expression
        let exprWithValue = expression.replace(/\$ticTime/g, ticTime.toString());
        
        try {
            // Évaluer l'expression avec eval (plus simple et direct)
            const result = eval(exprWithValue);
            
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                // Pour les chemins d'image, arrondir automatiquement le résultat
                // Pour les autres cas (lightDistance, etc.), garder la précision
                const finalResult = isImagePath ? Math.round(result) : result;
                interpreted = interpreted.replace(fullMatch, finalResult.toString());
            }
        } catch (e) {
            // Si l'évaluation échoue, utiliser le fallback
            const fallback = exprWithValue;
            interpreted = interpreted.replace(fullMatch, fallback);
        }
    }
    
    // Si pas d'expressions entre accolades, remplacer simplement {$ticTime}
    if (!matches.length) {
        interpreted = value.replace(/\{\$ticTime\}/g, ticTime.toString());
    }
    
    // Si c'est une expression mathématique pure (pas une image), évaluer le résultat final
    if (!isImagePath) {
        // Vérifier si le résultat est une expression mathématique pure
        const mathExpressionPattern = /^[\d\s+\-*/().]+$/;
        if (mathExpressionPattern.test(interpreted.trim())) {
            try {
                const result = eval(interpreted.trim());
                if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                    return result;
                }
            } catch (e) {
                // Ignorer l'erreur, retourner la chaîne interprétée
            }
        }
    }
    
    return interpreted;
}

// Variables de tracking pour détecter les changements
window.lastTicTime = undefined; // Dernière valeur de ticTime (infoTimeMa / 50)
window.lastIceLevel = undefined; // Dernière valeur de h2oIceFractionFromCalculation

// Variable globale pour la couleur de la courbe du corps noir (accessible partout)
window.currentBlackBodyColor = 'cyan'; // Couleur par défaut

/**
 * Met à jour la couleur globale de la courbe du corps noir et les variables CSS
 * @param {string} color - Couleur au format string (rgb, nom, etc.)
 */
window.updateBlackBodyColor = function(color) {
    if (!color) return;
    
    // Stocker la couleur globalement
    window.currentBlackBodyColor = color;
    
    // Convertir la couleur en rgba pour les variables CSS
    let r, g, b;
    
    if (typeof color === 'string') {
        // Si c'est un nom de couleur (cyan, red, etc.) ou rgb(...), le convertir en RGB
        if (color.startsWith('rgb')) {
            // Extraire directement depuis rgb(r, g, b) ou rgba(r, g, b, a)
            const match = color.match(/\d+/g);
            if (match && match.length >= 3) {
                r = parseInt(match[0]);
                g = parseInt(match[1]);
                b = parseInt(match[2]);
            } else {
                // Fallback : cyan par défaut
                r = 0;
                g = 255;
                b = 255;
            }
        } else {
            // Si c'est un nom de couleur (cyan, red, etc.), le convertir en RGB
            const temp = document.createElement('div');
            temp.style.color = color;
            document.body.appendChild(temp);
            const computed = window.getComputedStyle(temp).color;
            document.body.removeChild(temp);

            // Extraire les valeurs RGB depuis "rgb(r, g, b)" ou "rgba(r, g, b, a)"
            const match = computed.match(/\d+/g);
            if (match && match.length >= 3) {
                r = parseInt(match[0]);
                g = parseInt(match[1]);
                b = parseInt(match[2]);
    } else {
                // Fallback : cyan par défaut
                r = 0;
                g = 255;
                b = 255;
            }
        }
    } else if (Array.isArray(color) && color.length >= 3) {
        // Si c'est un tableau [r, g, b]
        r = color[0];
        g = color[1];
        b = color[2];
    } else {
        // Fallback : cyan par défaut
        r = 0;
        g = 255;
        b = 255;
    }
    
    // Mettre à jour les variables CSS pour les pulsations des boutons événements
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.style.setProperty('--event-pulse-white-mid', `rgba(${r}, ${g}, ${b}, 0.7)`);
        document.documentElement.style.setProperty('--event-pulse-white-shadow-max', `rgba(${r}, ${g}, ${b}, 0.4)`);
    }
};

// Code timeline déplacé dans timeline.js

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

        // Mettre à jour le graphique FPS (précision 0% → 0.0x, 100% → 2.0x)
        if (typeof window !== 'undefined' && typeof window.updateFPSDisplay === 'function') {
            const precisionFactor = (typeof getPrecisionFactorFromFPS === 'function')
                ? getPrecisionFactorFromFPS()
                : 0;
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
    ch4_ppm: 0, // Concentration de CH4 en ppm (initialisée à 0)
    temp_surface: 0 // Température de surface initialisée à 0
};

// Exposer plotData sur window pour que calculations.js et events.js y accèdent
window.plotData = plotData;
window.PLOT_PANEL_READY = true; // Module plot chargé (events.js utilise ce flag en blocs)

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
    // 🔒 S'assurer que plotData est exposé sur window et initialisé
    if (typeof window.plotData === 'undefined') {
        window.plotData = plotData;
    }
    // Initialiser temp_surface si elle n'existe pas
    if (typeof window.plotData.temp_surface === 'undefined') {
        window.plotData.temp_surface = 0;
    }
    
    initPlot();
    document.getElementById('status').textContent = 'Initialisation...';

    // Créer une grille lambda cohérente avec le compute. Si plotData.current a déjà un flux (ex. après runComputeInParent), garder sa résolution pour éviter topFlux/lambda incohérents.
    const lambda_min = 0.1e-6;
    const lambda_max = 100e-6;
    plotData.lambda_range = [];
    plotData.lambda_weights = []; // ⚡ Nécessaire pour updatePlot
    const initBins = (window.CONFIG_COMPUTE.initSpectralBinsConvergence != null && Number.isFinite(window.CONFIG_COMPUTE.initSpectralBinsConvergence))
        ? window.CONFIG_COMPUTE.initSpectralBinsConvergence
        : window.CONFIG_COMPUTE.maxSpectralBinsConvergence;
    const currentTopFluxLen = (plotData.current && plotData.current.upward_flux && plotData.current.upward_flux.length > 0)
        ? plotData.current.upward_flux[plotData.current.upward_flux.length - 1].length
        : 0;
    const expected_points = Math.max(2, Math.min(currentTopFluxLen > 0 ? currentTopFluxLen : initBins, 10000));
    const effective_delta = expected_points > 1 ? (lambda_max - lambda_min) / (expected_points - 1) : (lambda_max - lambda_min);
    for (let i = 0; i < expected_points; i++) {
        const lambda = (i === expected_points - 1) ? lambda_max : lambda_min + i * effective_delta;
        plotData.lambda_range.push(lambda);
        plotData.lambda_weights.push(1.0);
    }
    // Vérification
    if (plotData.lambda_range.length !== expected_points) {
        console.error(`[calculateInitialData] ❌ ERREUR CRITIQUE: lambda_range.length (${plotData.lambda_range.length}) != expected (${expected_points})`);
        throw new Error(`lambda_range.length (${plotData.lambda_range.length}) != expected (${expected_points})`);
    }

    // Afficher les courbes Planck de référence avant les calculs
    const tempPlotData = {
        lambda_range: plotData.lambda_range,
        lambda_weights: plotData.lambda_weights, // ⚡ Nécessaire pour updatePlot
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

    // 🔒 NOTE: Le calcul sera lancé par setEpoch("Corps noir") appelé avant calculateInitialData
    // Pas besoin d'appeler updateCO2Level ici, cela créerait un appel en double
    // Les valeurs sont déjà initialisées par updateLevelsConfig dans setEpoch
}

function updateCO2Level(state) {
    const logoEDS = '📛'; // EDS (effet de serre)
    const logoCO2 = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CO2) ? window.LOGOS.CO2 : '🏭';
    const logoH2O = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.H2O) ? window.LOGOS.H2O : '💧';
    const logoCH4 = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CH4) ? window.LOGOS.CH4 : '⛽';
    
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
    
    // Récupérer les valeurs H2O et CH4 depuis plotData pour le log
    const h2o_percent = (typeof window !== 'undefined' && window.h2oVaporPercent !== undefined) ? window.h2oVaporPercent : 0;
    const h2o_meteorites = (typeof window !== 'undefined' && window.h2oTotalFromMeteorites !== undefined) ? window.h2oTotalFromMeteorites : 0;
    const h2o_total = h2o_percent + h2o_meteorites;
    const ch4_ppm = (plotData && plotData.ch4_ppm !== undefined) ? plotData.ch4_ppm : 0;
    
    console.log(`${logoEDS} [updateCO2Level@main.js] 🏭=${plotData.co2_ppm.toFixed(0)}ppm 💧=${h2o_total.toFixed(1)}% ⛽=${ch4_ppm.toFixed(0)}ppm`);

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
            const logo = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CO2) ? window.LOGOS.CO2 : '🏭';
            console.log(`${logo} [processResult@main.js] T0=${data?.T0?.toFixed(2) || 'N/A'}K flux=${data?.total_flux?.toFixed(2) || 'N/A'}W/m²`);
            plotData.current = data;
            if (data.lambda_range && data.lambda_weights) {
                plotData.lambda_range = data.lambda_range;
                plotData.lambda_weights = data.lambda_weights;
            }

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
            const temp_surface = temperatureAtZ(0);
            const temp_surface_c = temp_surface - CONST.KELVIN_TO_CELSIUS;
            // Calculer ΔT° (calibration)
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
                temp_eff_c: temp_eff - CONST.KELVIN_TO_CELSIUS,
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
            // Dernier redraw plot + spectre quand le DOM est libre (affichage fin 2000 bins)
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    const fresh = (typeof window.getSpectralResultFromDATA === 'function') ? window.getSpectralResultFromDATA() : null;
                    if (fresh && fresh.lambda_range && fresh.upward_flux) {
                        plotData.lambda_range = fresh.lambda_range;
                        plotData.lambda_weights = fresh.lambda_weights;
                        plotData.current = fresh;
                    }
                    updatePlot(plotData);
                    const canvas = document.getElementById('spectral-visualization');
                    if (canvas) {
                        canvas.style.setProperty('display', 'block', 'important');
                        canvas.style.setProperty('visibility', 'visible', 'important');
                        canvas.style.setProperty('opacity', '1', 'important');
                        canvas.style.setProperty('z-index', '10000', 'important');
                        canvas.style.setProperty('position', 'absolute', 'important');
                    }
                    window.updateSpectralVisualization(plotData.current);
                });
            });
            document.getElementById('status').textContent = 'Prêt';
            // 🔒 PROTECTION : S'assurer que showSpectralBackground reste à true après les calculs
            if (typeof window !== 'undefined') {
                window.showSpectralBackground = true;
            }
            // Réinitialiser les flags de convergence après l'affichage final (après un délai pour laisser le temps à la précision max)
            // 🔒 NE PAS réinitialiser showSpectralBackground (il doit rester à true)
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.spectralConverged = false;
                    window.spectralPrecisionTarget = 'auto';
                    // 🔒 S'assurer que showSpectralBackground reste à true même après réinitialisation
                    window.showSpectralBackground = true;
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
    const currentYears = (window.timelineFrame || 0) * (window.YEARS_PER_FRAME || 10);
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

// Fonction pour mettre à jour les niveaux EDS (CO2, H2O, CH4) et lancer le calcul
// ⚠️ NOTE: Le nom "updateCO2LevelDirect" est trompeur - cette fonction gère les 3 gaz (CO2, H2O, CH4)
// Elle met à jour CO2 explicitement, mais utilise aussi H2O et CH4 depuis plotData/window
// TODO: Renommer en updateEDSLevels ou updateLevelsDirect pour refléter qu'elle utilise les 3 gaz
function updateCO2LevelDirect(co2_fraction) {
    const logoEDS = '📛'; // EDS (effet de serre)
    const logoCO2 = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CO2) ? window.LOGOS.CO2 : '🏭';
    const logoH2O = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.H2O) ? window.LOGOS.H2O : '💧';
    const logoCH4 = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CH4) ? window.LOGOS.CH4 : '⛽';
    
    // Récupérer les valeurs H2O et CH4 depuis plotData/window (déjà initialisées par updateLevelsConfig)
    const h2o_percent = (typeof window !== 'undefined' && window.h2oVaporPercent !== undefined) ? window.h2oVaporPercent : 0;
    const h2o_meteorites = (typeof window !== 'undefined' && window.h2oTotalFromMeteorites !== undefined) ? window.h2oTotalFromMeteorites : 0;
    const h2o_total = h2o_percent + h2o_meteorites;
    const ch4_ppm = (plotData && plotData.ch4_ppm !== undefined) ? plotData.ch4_ppm : 0;
    
    // ⚠️ NOTE: Le nom de la fonction est trompeur - elle gère les 3 gaz (CO2, H2O, CH4), pas seulement CO2
    // Annuler tout calcul en cours avant de commencer un nouveau
    cancelCurrentCalculation();

    plotData.co2_ppm = co2_fraction * 1e6;

    if (typeof window.runComputeInParent === 'function' && document.getElementById('scie-iframe')) {
        window.runComputeInParent();
        return;
    }

    document.getElementById('status').textContent = `Calcul pour ${plotData.co2_ppm.toFixed(0)} ppm...`;

    // Activer l'affichage des étapes de dichotomie pour le calcul courant
    // 🔒 Vérifier le bouton anim pour s'assurer que showDichotomySteps est correct
    // Vérifier d'abord le checkbox caché, puis le bouton
    const animToggleCheck = typeof document !== 'undefined' 
        ? (document.getElementById('plot-anim-toggle-checkbox') || document.getElementById('plot-anim-toggle'))
        : null;
    const animEnabledCheck = animToggleCheck && animToggleCheck.checked;
    
    if (typeof window !== 'undefined') {
        // Le bouton anim contrôle directement showDichotomySteps
        window.showDichotomySteps = animEnabledCheck !== false; // true par défaut si bouton pas encore initialisé
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
            const logo = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CO2) ? window.LOGOS.CO2 : '🏭';
            console.log(`${logo} [processResult@main.js] T0=${data?.T0?.toFixed(2) || 'N/A'}K flux=${data?.total_flux?.toFixed(2) || 'N/A'}W/m²`);
            // Vérifier si le calcul a été annulé
            if (window.cancelCalculation) {
                return;
            }
            if (window.CO2_EVENTS && data) {
                window.CO2_EVENTS.emit('compute:done', { DATA: window.DATA, result: data });
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
            if (data.lambda_range && data.lambda_weights) {
                plotData.lambda_range = data.lambda_range;
                plotData.lambda_weights = data.lambda_weights;
            }

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
            const temp_surface = temperatureAtZ(0);
            const temp_surface_c = temp_surface - CONST.KELVIN_TO_CELSIUS;
            // Calculer ΔT° (calibration)
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
                temp_eff_c: temp_eff - CONST.KELVIN_TO_CELSIUS,
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
            // Dernier redraw plot + spectre quand le DOM est libre (affichage fin 2000 bins)
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    const fresh = (typeof window.getSpectralResultFromDATA === 'function') ? window.getSpectralResultFromDATA() : null;
                    if (fresh && fresh.lambda_range && fresh.upward_flux) {
                        plotData.lambda_range = fresh.lambda_range;
                        plotData.lambda_weights = fresh.lambda_weights;
                        plotData.current = fresh;
                    }
                    updatePlot(plotData);
                    const canvas = document.getElementById('spectral-visualization');
                    if (canvas) {
                        canvas.style.setProperty('display', 'block', 'important');
                        canvas.style.setProperty('visibility', 'visible', 'important');
                        canvas.style.setProperty('opacity', '1', 'important');
                        canvas.style.setProperty('z-index', '10000', 'important');
                        canvas.style.setProperty('position', 'absolute', 'important');
                    }
                    window.updateSpectralVisualization(plotData.current);
                });
            });
            document.getElementById('status').textContent = 'Prêt';
            // 🔒 PROTECTION : S'assurer que showSpectralBackground reste à true après les calculs
            if (typeof window !== 'undefined') {
                window.showSpectralBackground = true;
            }
            // Réinitialiser les flags de convergence après l'affichage final (après un délai pour laisser le temps à la précision max)
            // 🔒 NE PAS réinitialiser showSpectralBackground (il doit rester à true)
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.spectralConverged = false;
                    window.spectralPrecisionTarget = 'auto';
                    // 🔒 S'assurer que showSpectralBackground reste à true même après réinitialisation
                    window.showSpectralBackground = true;
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
    const logoEDS = '📛'; // EDS (effet de serre)
    const logoCO2 = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CO2) ? window.LOGOS.CO2 : '🏭';
    const logoH2O = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.H2O) ? window.LOGOS.H2O : '💧';
    const logoCH4 = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CH4) ? window.LOGOS.CH4 : '⛽';
    
    // Récupérer les valeurs pour le log
    const co2_ppm = (data && data.co2_ppm !== undefined) ? data.co2_ppm : 0;
    const h2o_percent = (typeof window !== 'undefined' && window.h2oVaporPercent !== undefined) ? window.h2oVaporPercent : 0;
    const h2o_meteorites = (typeof window !== 'undefined' && window.h2oTotalFromMeteorites !== undefined) ? window.h2oTotalFromMeteorites : 0;
    const h2o_total = h2o_percent + h2o_meteorites;
    const ch4_ppm = (data && data.ch4_ppm !== undefined) ? data.ch4_ppm : (plotData && plotData.ch4_ppm !== undefined) ? plotData.ch4_ppm : 0;
    
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
        const pressureValEl = document.getElementById('pressure-surface-synthese');
        if (pressureValEl) pressureValEl.textContent = '🎈 -- atm';
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

    if (data) {
        // Récupérer l'époque et la date
        let epochName = '--';
        let epochDate = '--';
        if (typeof window !== 'undefined' && window.currentEpochName) {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch) {
                epochName = currentEpoch.name || window.currentEpochName;
                // Formater la date depuis startYears ou ▶
                const years = currentEpoch.startYears ?? currentEpoch['▶'];
                if (years != null && Number.isFinite(years)) {
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


        // --- LOG ATMOSPHERE & TROPOPAUSE ---
        if (typeof window !== 'undefined') {
            let total_mass_log = 0;
            let M_avg_log = undefined;
            let gravity_log = 9.81; // Défaut temporaire

            if (window.currentEpochName) {
                const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
                if (currentEpoch) {
                    if (currentEpoch['⚖️🫧'] !== undefined) total_mass_log = currentEpoch['⚖️🫧'];
                    if (currentEpoch.gravity !== undefined) gravity_log = currentEpoch.gravity;
                    // Calculer molar_mass_air depuis les composants si non défini
                    M_avg_log = window.calculateMolarMassAir(currentEpoch);
                }
            }

            // Si M_avg non définie, estimation
            if (M_avg_log === undefined) {
                if (total_mass_log > 2.5e19) M_avg_log = 0.044;
                else M_avg_log = 0.029;
            }

            const T0_log = data.temp_surface || 288;

            const props = window.calculateAtmosphereProperties(total_mass_log, T0_log, M_avg_log, gravity_log);
            // console.log('Atmosphere Height:', `${(props.z_max / 1000).toFixed(0)} km`);

            if (typeof window.calculateTropopauseHeight === 'function') {
                const tropo_m = window.calculateTropopauseHeight();
                // console.log('Tropopause Height:', `${(tropo_m / 1000).toFixed(1)} km`);
            }
        }

        // EDS Réel (Calculé depuis le transfert radiatif)
        // EDS = Flux Surface (σT⁴) - Flux Sortant (au sommet)
        const STEFAN_BOLTZMANN = 5.670374419e-8;
        const flux_surface_real = STEFAN_BOLTZMANN * Math.pow(data.temp_surface, 4);
        // Récupérer le flux total sortant (si disponible dans les données brutes plotData.current)
        const flux_top_real = (plotData.current && plotData.current.total_flux) ? plotData.current.total_flux : null;

        if (flux_top_real !== null) {
            const eds_real = flux_surface_real - flux_top_real;
        }

        // Récupérer les données d'albedo détaillées depuis l'époque courante
        let albedoComponents = [];
        if (typeof window !== 'undefined' && window.currentEpochName) {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
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

                // 🔒 PRIORITÉ 1 : Utiliser la valeur calculée par calculateAlbedo (la plus récente et précise)
                if (typeof window !== 'undefined' && window.h2oIceFractionFromCalculation !== undefined) {
                    ice_coverage = Math.min(1, Math.max(0, window.h2oIceFractionFromCalculation));
                }
                // 🔒 PRIORITÉ 2 : Recalculer avec calculateWaterPartition si pas de valeur disponible
                else if (data.temp_surface !== undefined && typeof window !== 'undefined' && typeof window.calculateWaterPartition === 'function') {
                    // 🔒 CORRECTION : calculateWaterPartition() lit directement depuis DATA, pas besoin de calculer h2o_total_percent
                    const DATA = window.DATA;
                    const h2o_total_fraction = DATA['⚖️']['⚖️🫧'] > 0 ? (DATA['⚖️']['⚖️💧'] / DATA['⚖️']['⚖️🫧']) : 0;
                    if (h2o_total_fraction > 0) {
                        // 🔒 CORRECTION : calculateWaterPartition() n'a pas de paramètres, elle lit depuis DATA
                        // Mettre à jour DATA['🧮']['🧮🌡️'] avant d'appeler calculateWaterPartition() (source unique, pas de clé 🌡️ redondante)
                        window.DATA['🧮']['🧮🌡️'] = data.temp_surface;
                        window.calculateWaterPartition();
                        const waterPartition = {
                            vapor_fraction: window.DATA['💧']['🍰🫧💧'],
                            ice_fraction: window.DATA['💧']['🍰💧🧊'],
                            liquid_fraction: window.DATA['💧']['🍰💧🌊']
                        };
                        ice_coverage = waterPartition.ice_fraction || 0;
                        // Mettre à jour pour les prochains appels
                        window.h2oIceFractionFromCalculation = ice_coverage;
                    } else {
                        // Même sans eau, appeler calculateWaterPartition pour obtenir 0 partout
                        // 🔒 CORRECTION : calculateWaterPartition() n'a pas de paramètres, elle lit depuis DATA
                        // Mettre à jour DATA['🧮']['🧮🌡️'] avant d'appeler calculateWaterPartition() (source unique)
                        window.DATA['🧮']['🧮🌡️'] = data.temp_surface;
                        window.calculateWaterPartition();
                        const waterPartition = {
                            vapor_fraction: window.DATA['💧']['🍰🫧💧'],
                            ice_fraction: window.DATA['💧']['🍰💧🧊'],
                            liquid_fraction: window.DATA['💧']['🍰💧🌊']
                        };
                        ice_coverage = waterPartition.ice_fraction || 0;
                        window.h2oIceFractionFromCalculation = ice_coverage;
                    }
                }
                // 🔒 PRIORITÉ 3 : Calcul classique basé sur la température (fallback)
                else if (data.temp_surface !== undefined) {
                    // Calcul classique de la glace basé sur la température (si pas de calcul H2O)
                    const T_surface_C = data.temp_surface - CONST.KELVIN_TO_CELSIUS;
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
                        } else {
                    }
                } else {
                }
                ice_cov = Math.round(ice_coverage * 100);

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
            }
        }
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
            // 🔒 Les lignes de référence (courbes étalons) restent blanches
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
                // 🔒 Les textes des courbes étalons restent blancs
                tempCAbove.style.color = 'white';
                tempCAbove.textContent = `${(T - CONST.KELVIN_TO_CELSIUS).toFixed(0)}°C`;
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
                // 🔒 Les textes des courbes étalons restent blancs
                tempFBelow.style.color = 'white';
                const tempF = ((T - CONST.KELVIN_TO_CELSIUS) * 9 / 5 + 32).toFixed(0);
                tempFBelow.textContent = `${tempF}°F`;
                patternContainer.appendChild(tempFBelow);
            }

            patternContainer.appendChild(svgContainer);

            // K à côté (normal) - toujours afficher .0K même si entier
            const labelSpan = document.createElement('span');
            labelSpan.className = 'legend-text';
            // 🔒 Les textes des courbes étalons restent blancs (géré par CSS)
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
    const T_surface = (data && data.temp_surface !== undefined) ? data.temp_surface : (data && data.current && data.current.T0 !== undefined) ? data.current.T0 : (data && data.temp_surface_c !== undefined) ? data.temp_surface_c + CONST.KELVIN_TO_CELSIUS : null;
    if (equilibreCurvesContainer && data && T_surface != null) {
        equilibreCurvesContainer.innerHTML = '';

        const T = T_surface;
        const tempC = (T - CONST.KELVIN_TO_CELSIUS).toFixed(1);
        const tempF = ((T - CONST.KELVIN_TO_CELSIUS) * 9 / 5 + 32).toFixed(1);

        // 🔒 Calculer la couleur dynamique basée sur la température de surface (cohérence avec le plot)
        // Priorité : temp_surface_c (donnée réelle) > current > window.currentBlackBodyColor
        const tempSurfaceC = T - CONST.KELVIN_TO_CELSIUS;
        let dynamicColor = 'cyan';
        if (typeof window.tempSurfaceToColor === 'function') {
            dynamicColor = window.tempSurfaceToColor(tempSurfaceC);
        } else if (typeof window !== 'undefined' && window.currentBlackBodyColor) {
            dynamicColor = window.currentBlackBodyColor;
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
        
        // 🔒 Appliquer la couleur dynamique à tous les textes de la section legend-equilibre
        const legendEquilibre = document.querySelector('.legend-equilibre');
        if (legendEquilibre) {
            // Appliquer la couleur aux textes statiques (hors des éléments déjà colorés)
            const staticTexts = legendEquilibre.querySelectorAll('br, span:not(.legend-line-dotted):not(.legend-line-solid):not(.legend-equilibre-item *)');
            staticTexts.forEach(el => {
                // Ne pas appliquer aux éléments qui ont déjà une couleur spécifique
                if (!el.closest('.legend-equilibre-item') && !el.classList.contains('legend-line-dotted') && !el.classList.contains('legend-line-solid')) {
                    el.style.color = dynamicColor;
                }
            });
            
            // Appliquer la couleur au conteneur principal si nécessaire
            legendEquilibre.style.color = dynamicColor;
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
    const logoEpoch = '🕰';
    console.log(logoEpoch + ' ' + epochName);
    
    // 🔒 Légende des emojis (affichée une seule fois au premier appel)
    if (typeof window !== 'undefined' && !window._logLegendShown) {
        console.log('📋 Légende: 🕰 Époque | 📛 EDS | 🏭 CO2 | 💧 H2O | ⛽ CH4 | 🪩 Albédo | 🧊 Glace | ⛅ Nuages | 🛠 Config | 🎚 Précision | ⏸️ Pause | 🔄 Reset | ✅ OK | ⚠️ Warning | ❌ Error');
        window._logLegendShown = true;
    }
    
    // 🔒 Cacher le tooltip immédiatement lors du changement d'époque
    // Empêche le tooltip de rester affiché après le changement
    if (typeof window !== 'undefined' && typeof window.hideTooltip === 'function') {
        window.hideTooltip();
    }
    
    // Mettre en pause l'animation Three.js lors du changement d'époque
    if (typeof window !== 'undefined') {
        window.threeJSAnimationPaused = true;
        // Three.js pause
    }
    
    // 🔄 Remettre infoTimeMa à 0 lors du changement d'époque
    // IMPORTANT: Doit être fait AVANT l'interprétation du logo pour que ticTime = 0
    if (typeof window !== 'undefined') {
        window.infoTimeMa = 0;
        // infoTimeMa=0
    }
    
    // Log supprimé (non essentiel)
    
    if (calculationInProgress) {
        cancelCurrentCalculation();
        enableButtons();
    }

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

    // data-epoch sur le DOM = id (emoji), pas le nom ; résoudre pour sélectionner le bon bouton
    const epochNameToEmojiForButton = {
        'Corps noir': '⚫', 'Hadéen': '🔥', 'Archéen': '🦠', 'Mésozoïque': '🦕',
        'Paléozoïque': '🦴', 'Cénozoïque': '🦣', 'Industriel': '🚂', 'Aujourd\'hui': '📱'
    };
    const epochIdForButton = epochNameToEmojiForButton[epochName] || epochName;
    const clickedButton = document.querySelector(`.epoch-btn[data-epoch="${epochIdForButton}"]`);
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

    // 🔒 Stocker l'ancienne époque AVANT de la changer
    const previousEpoch = (typeof window.currentEpochName !== 'undefined') ? window.currentEpochName : 'Corps noir';

    // Stocker le nom de l'époque globalement pour updateFluxLabels
    window.currentEpochName = epochName;
    
    // 🔒 INITIALISER DATA['📜']['👉'] et DATA['📜']['🗿'] pour que calculations_albedo.js puisse accéder à l'époque
    // DATA existe toujours (dico.js, ordre synchrone).
    if (typeof window.TIMELINE !== 'undefined') {
        if (!window.DATA['📜']) {
            window.DATA['📜'] = {};
        }
        // Trouver l'index de l'époque par son emoji (id) ou son nom
        // Mapper le nom de l'époque vers l'emoji si nécessaire
        const epochNameToEmojiMap = {
            'Corps noir': '⚫',
            'Hadéen': '🔥',
            'Archéen': '🦠',
            'Mésozoïque': '🦕',
            'Paléozoïque': '🦴',
            'Cénozoïque': '🦣',
            'Industriel': '🚂',
            'Aujourd\'hui': '📱'
        };
        // epoch.id devrait être défini depuis getGeologicalPeriodByName (timeline transformée)
        // Sinon, utiliser le mapping ou le nom directement
        const epochId = epoch.id || epochNameToEmojiMap[epochName] || epochName;
        const epochIndex = window.TIMELINE.findIndex(item => {
            if (item['📅']) {
                return item['📅'] === epochId;
            }
            // Si la timeline a été transformée, chercher par id ou name
            return (item.id === epochId || item.name === epochName);
        });
        
        if (epochIndex >= 0) {
            window.DATA['📜']['👉'] = epochIndex;
            window.DATA['📜']['🗿'] = epochId;
            // Initialiser aussi DATA['📅'] avec l'objet epoch complet
            window.DATA['📅'] = window.TIMELINE[epochIndex];
        } else {
            console.error(`[setEpoch] ⚠️ Époque ${epochName} (${epochId}) non trouvée dans TIMELINE`);
        }
    }
    
    // 🔒 INITIALISER les variables globales uniques depuis la config UNIQUEMENT au changement d'époque
    // Si l'utilisateur a déjà modifié ces valeurs, elles ne seront pas écrasées (mais au changement d'époque, on repart de la config)
    if (typeof window !== 'undefined') {
        // Initialiser la précision de convergence depuis la config de l'époque
        if (typeof epoch.precision === 'number' && epoch.precision > 0) {
            window.convergencePrecision_K = epoch.precision;
            // 🔒 Mettre à jour le bouton radio correspondant (sélectionner celui qui correspond à la précision de la config)
            const precisionRadios = document.querySelectorAll('input[name="precision-convergence"]');
            let found = false;
            precisionRadios.forEach(radio => {
                if (Math.abs(parseFloat(radio.value) - epoch.precision) < 0.01) {
                    radio.checked = true;
                    found = true;
                } else {
                    radio.checked = false;
                }
            });
            if (found) {
                console.log(`${logoEpoch} 🛠 [setEpoch@main.js] 🎚=${window.convergencePrecision_K}° 🔘 selected`);
            } else {
                console.warn(`${logoEpoch} 🛠 ⚠️ [setEpoch@main.js] 🎚=${window.convergencePrecision_K}° => Aucun bouton radio`);
            }
        }
        
        // Initialiser isAnim depuis la config (par défaut true, peut être modifié par l'utilisateur)
        // Note: isAnim n'est pas dans la config, donc on garde la valeur actuelle ou true par défaut
        if (window.isAnim === undefined) {
            window.isAnim = true;
        }
    }

    // 🔒 Anticiper la couleur avec t0 dès le clic sur l'époque (AVANT les calculs)
    if (typeof epoch.t0 === 'number' && epoch.t0 > 0 && typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function' && typeof window.updateBlackBodyColor === 'function') {
        // Calculer ticTime = infoTimeMa / 50 (pour ajustement temporel)
        const ticTime = (typeof window.infoTimeMa !== 'undefined') ? Math.floor((window.infoTimeMa || 0) / 50) : 0;
        
        // Calculer la température initiale
        const T0_anticipated = epoch.t0;
        const tempC_anticipated = T0_anticipated - CONST.KELVIN_TO_CELSIUS;
        const color_anticipated = window.tempSurfaceToColor(tempC_anticipated);
        window.updateBlackBodyColor(color_anticipated);
        
        // Mettre à jour legend-equilibre avec la couleur anticipée
        const legendEquilibre = typeof document !== 'undefined' ? document.querySelector('.legend-equilibre') : null;
        if (legendEquilibre) {
            legendEquilibre.style.color = color_anticipated;
        }
        
        // 🔒 FORCER la mise à jour immédiate du plot et de la légende avec la couleur anticipée
        // (même si les données ne sont pas encore mises à jour, la couleur doit changer tout de suite)
        const currentPlotData = (typeof window !== 'undefined' && window.plotData) ? window.plotData : plotData;
        if (typeof window.updatePlot === 'function' && currentPlotData) {
            // Créer un plotData temporaire avec la température anticipée pour forcer la couleur
            const tempPlotData = {
                ...currentPlotData,
                temp_surface: T0_anticipated,
                temp_surface_c: tempC_anticipated
            };
            window.updatePlot(tempPlotData);
        }
        if (typeof window.updateLegend === 'function' && currentPlotData) {
            // Créer un plotData temporaire avec la température anticipée pour forcer la couleur
            const tempPlotData = {
                ...currentPlotData,
                temp_surface: T0_anticipated,
                temp_surface_c: tempC_anticipated
            };
            window.updateLegend(tempPlotData);
        }
    }

    // 🔒 RÉINITIALISER l'eau totale des météorites lors du changement d'époque
    // (utiliser uniquement les valeurs de la config de l'époque, ne pas garder le surplus de l'époque précédente)
    if (epochName !== previousEpoch && typeof window.h2oTotalFromMeteorites !== 'undefined') {
        window.h2oTotalFromMeteorites = 0;
    }

    // Mettre à jour les boutons d'action selon l'époque
    if (typeof window.updateEpochActions === 'function') {
        window.updateEpochActions();
    }

    // Mettre à jour le logo de la Terre avec l'image de l'époque
    // Modifier la configuration du noeud terre et recréer la cellule
    const terreNode = window.configOrganigramme.nodes.find(n => n.id === 'terre');
    if (terreNode && terreNode.epoch && Array.isArray(terreNode.epoch)) {
        // Trouver la configuration : config utilise epochName (ex: 'Corps noir'), pas l'emoji (ex: '⚫')
        const configEpochName = epoch.name || epochName;
        const epochConfig = terreNode.epoch.find(e => e.epochName === configEpochName);

        if (epochConfig) {
            // Recréer la cellule terre avec la configuration de l'époque
            const oldCell = document.getElementById('cell-terre');
            if (oldCell && typeof window.createCell === 'function') {
                const parent = oldCell.parentElement;
                
                // Log supprimé (non essentiel)
                
                // Sauvegarder l'angle de rotation AVANT de supprimer la cellule
                const canvas = oldCell.querySelector('canvas');
                let savedRotationY = 0;
                if (canvas && canvas._threeJSData && canvas._threeJSData.sphere) {
                    savedRotationY = canvas._threeJSData.sphere.rotation.y;
                    // 🔒 Stocker dans window pour que initPlanetThreeJS puisse le récupérer
                    // (pour éviter que la terre pivote d'un coup lors du changement d'époque)
                    if (typeof window !== 'undefined') {
                        window.savedPlanetRotationY = savedRotationY;
                    }
                } else if (typeof window !== 'undefined' && window.savedPlanetRotationY !== undefined) {
                    // Si pas de sphere mais qu'on a déjà une rotation sauvegardée, la conserver
                    savedRotationY = window.savedPlanetRotationY;
                }
                
                oldCell.remove();
                
                // Interpréter les valeurs dynamiques : texture (text_*.png) si planetEffect, sinon logo (picto)
                let logoPath = (epochConfig.planetEffect && epochConfig.texture)
                    ? interpretConfigValue(epochConfig.texture)
                    : interpretConfigValue(epochConfig.logo);
                
                // Si le logo contient encore {$ticTime} après interprétation, c'est une erreur
                if (typeof logoPath === 'string' && logoPath.includes('{$ticTime}')) {
                    console.warn('[setEpoch] ⚠️ WARNING - Logo contient encore {$ticTime} après interprétation:', logoPath);
                }
                
                // Interpréter lightDistance (peut contenir des expressions comme "10-{$ticTime}" ou "7-{$ticTime}/2")
                let lightDistance = epochConfig.lightDistance;
                // Log supprimé (non essentiel)
                if (typeof lightDistance === 'string' || (typeof lightDistance !== 'number' && lightDistance !== null && lightDistance !== undefined)) {
                    lightDistance = interpretConfigValue(lightDistance);
                    // Log supprimé (non essentiel)
                }
                
                // Si isIceChange, diminuer lightDistance de 1
                if (window.isIceChange && typeof lightDistance === 'number') {
                    lightDistance = Math.max(0, lightDistance - 1);
                }
                
                // Stocker les valeurs interprétées dans window pour que createCell puisse les récupérer
                if (typeof window !== 'undefined') {
                    window.currentEpochLuxSaturation = epochConfig.luxSaturation !== undefined ? epochConfig.luxSaturation : 1.0;
                    window.currentEpochLightDistance = lightDistance;
                }

                const newCell = window.createCell(
                    terreNode.x,
                    terreNode.y,
                    epochConfig.radius,
                    epochConfig.fillColor,
                    epochConfig.strokeColor,
                    logoPath, // Utiliser le logo interprété
                    terreNode.left,
                    terreNode.right,
                    terreNode.top,
                    terreNode.bottom,
                    terreNode.tooltip,
                    terreNode.ariaLabel || null,
                    terreNode.radiation,
                    null, // rectangleOptions
                    null, // fillImage
                    terreNode.id,
                    terreNode.zIndex,
                    terreNode.logoScale,
                    terreNode.logoOffsetY,
                    epochConfig.strokeSize,
                    terreNode.strokeStyle || 'solid', // strokeStyle
                    null, // targetContainer
                    epochConfig.planetEffect || false // planetEffect
                );

                parent.appendChild(newCell);
                
                // Log supprimé (non essentiel)
                
                // Remettre l'animation en pause lors du changement d'époque (les calculs vont commencer)
                const planetTextures = newCell.querySelectorAll('.planet-texture[data-planet-texture="true"]');
                planetTextures.forEach(texture => {
                    texture.classList.add('paused');
                });
            }
        }
    }

    // Cacher/montrer la sphère albedo (bleutée/blanche qui pulse) selon l'époque
    // C'est une sphère éclairée en haut à gauche, transparente à 50%, peut-être bleutée mais surtout blanche
    // Joli effet à garder sous le coude pour d'autres époques, mais pas pour "Corps noir"
    const cellAlbedo = document.getElementById('cell-albedo');
    if (cellAlbedo) {
        if (epochName === 'Corps noir') {
            // Cacher la sphère albedo en Corps noir (sphère bleutée/blanche qui pulse)
            cellAlbedo.style.display = 'none';
        } else {
            // Afficher la sphère albedo pour les autres époques
            cellAlbedo.style.display = '';
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

    // Réinitialiser timelineFrame à 0 pour chaque nouvelle époque
    // Les années ajoutées par les actions seront comptées depuis 0
    if (typeof window !== 'undefined' && window.timelineFrame !== undefined) {
        window.timelineFrame = 0;
    }

    // Stocker le début de l'époque pour référence (affichage de la date de début)
    currentEpochStartYears = epoch.startYears ?? epoch['▶'];

    // Mettre à jour la date de début affichée (▶ = début en années dans config)
    const epochStartTimeDisplay = document.getElementById('epoch-start-time');
    if (epochStartTimeDisplay) {
        const years = epoch.startYears ?? epoch['▶'];
        epochStartTimeDisplay.textContent = formatYears(years);
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

    // Réinitialiser "+0 Ma" quand on clique sur une époque
    const infoTimeDisplay = document.getElementById('info-time');
    if (infoTimeDisplay) {
        infoTimeDisplay.textContent = '+0 Ma';
    }
    
    // Note: infoTimeMa a déjà été remis à 0 au début de setEpoch (avant l'interprétation du logo)
    
    // Vérifier les événements automatiques après le changement d'époque
    if (typeof checkDateEvents === 'function') {
        checkDateEvents();
    }

    updateTimeline();

    // 🔒 Mettre à jour DATA['⚖️'] (masses) AVANT updateFluxLabels pour que calculateAlbedo ait les bonnes valeurs (océan, etc.)
    if (typeof window.getMasses === 'function') {
        window.getMasses();
    }

    // Forcer la mise à jour des labels de flux (Soleil, Noyau, etc.) avec les paramètres de la nouvelle époque
    // Utiliser plotData.current si disponible (résultats du calcul), sinon plotData
    if (typeof window.updateFluxLabels === 'function') {
        const dataForLabels = (window.plotData && window.plotData.current) ? window.plotData : (window.plotData || {});
        window.updateFluxLabels('ProcessFinished');
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
    const total_atmosphere_mass_kg = epoch['⚖️🫧'];
    if (total_atmosphere_mass_kg === undefined) {
        console.error("[main] ⚖️🫧 manquant pour calculer la composition, arrêt.", epoch.name);
        return; // Arrêter le calcul
    }

    // Calculer molar_mass_air depuis les composants de l'époque si non défini
    let molar_mass_air = epoch.molar_mass_air;
    if (molar_mass_air === undefined && typeof window !== 'undefined') {
        molar_mass_air = window.calculateMolarMassAir(epoch);
    }
    // Fallback si toujours undefined ou 0
    if (molar_mass_air === undefined || molar_mass_air === 0) {
        // Estimation basée sur la masse atmosphérique (Hadéen = CO2 dense, moderne = N2/O2)
        const isMassive = total_atmosphere_mass_kg > 2.5e19;
        molar_mass_air = isMassive ? 0.044 : 0.029;
    }

    // 🔒 INITIALISER les niveaux depuis la config de l'époque (CO2, H2O, CH4)
    // Appeler updateLevelsConfig depuis calculations_albedo.js pour initialiser les valeurs
    // Cette fonction remplace les calculs manuels de co2_ppm, ch4_ppm, h2o_percent
    if (typeof window !== 'undefined' && typeof window.updateLevelsConfig === 'function') {
        window.updateLevelsConfig();
    }
    
    // Récupérer les valeurs depuis plotData (mises à jour par updateLevelsConfig) pour les boutons
    const defaultCO2_ppm_for_buttons = (plotData && plotData.co2_ppm !== undefined) ? plotData.co2_ppm : 0;
    const defaultCH4_ppm_for_buttons = (plotData && plotData.ch4_ppm !== undefined) ? plotData.ch4_ppm : 0;
    
    currentState = 3; // Utiliser state 3 comme base pour les valeurs personnalisées

    // Mettre à jour le bouton CO2
    const btnCo2 = document.getElementById('btn-co2');
    if (btnCo2) {
        if (isCorpsNoir || defaultCO2_ppm_for_buttons === 0) {
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
        let h2o_default = epoch.h2o_vapor_percent || 0;

        // 🔒 Calculer depuis h2o_kg si disponible et si h2o_vapor_percent n'est pas défini
        if (h2o_default === 0 && epoch.h2o_kg > 0 && epoch['⚖️🫧'] > 0) {
            // Estimation fraction molaire
            // H2O = 18 g/mol
            // Reste = 44 g/mol (CO2 dominant) ou 29 (Air)
            // Si Hadéen, reste probablement CO2/N2 lourd
            const mass_h2o = epoch.h2o_kg;
            const mass_total = epoch['⚖️🫧'];
            const mass_rest = Math.max(0, mass_total - mass_h2o);

            const mol_h2o = mass_h2o / 18.015;
            // Estimation masse molaire du reste (si CO2 dominant = 44, si N2 = 28)
            // Pour Hadéen, on suppose un mélange lourd
            const mol_rest = mass_rest / 44.01;

            const fraction_molaire = mol_h2o / (mol_h2o + mol_rest);
            h2o_default = fraction_molaire * 100; // En pourcent

        }

        if (typeof window !== 'undefined' && window.maximiseData) {
            // Prendre le max entre l'eau totale sauvegardée et la valeur par défaut de l'époque
            const savedH2O = (typeof window.savedH2O !== 'undefined') ? window.savedH2O : 0;
            const h2o_total_max = Math.max(savedH2O, h2o_default);

            // Répartir : base = valeur par défaut, météorites = le reste (max 100% total)
            window.h2oVaporPercent = h2o_default;
            window.h2oTotalFromMeteorites = Math.max(0, Math.min(100 - h2o_default, h2o_total_max - h2o_default));


            // Réinitialiser le flag après utilisation
            window.maximiseData = false;
        } else {
            // Comportement normal : utiliser les valeurs par défaut de l'époque
            window.h2oVaporPercent = h2o_default;

            // 🔒 RÉINITIALISER l'eau des météorites lors du changement d'époque
            // (utiliser uniquement les valeurs de la config, ne pas garder le surplus de l'époque précédente)
            if (epochName !== previousEpoch) {
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
    // Activer CH4 si la concentration est > 0
    // (defaultCH4_ppm_for_buttons est déjà déclaré plus haut)
    if (typeof window.methaneEnabled !== 'undefined') {
        window.methaneEnabled = !isCorpsNoir && (defaultCH4_ppm_for_buttons > 0);
    }

    // Mettre à jour le bouton CH4
    const btnMethane = document.getElementById('btn-methane');
    if (btnMethane) {
        if (isCorpsNoir || !defaultCH4_ppm_for_buttons || defaultCH4_ppm_for_buttons === 0) {
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
    // Utiliser les valeurs depuis plotData (mises à jour par updateLevelsConfig ci-dessus)
    const co2_fraction_from_config = (plotData && plotData.co2_ppm !== undefined) ? plotData.co2_ppm * 1e-6 : 0;
    if (typeof window.updateCO2LevelDirect === 'function') {
        window.updateCO2LevelDirect(co2_fraction_from_config);
    }

    // Synchroniser l'état avec l'iframe scie (epoch, anim, ticTime)
    if (window.CO2_EVENTS) {
        const epochId = (window.DATA && window.DATA['📜'] && window.DATA['📜']['🗿']) || epoch.id || epochName;
        const ticTime = (window.DATA && window.DATA['📜'] && window.DATA['📜']['📿💫'] != null) ? window.DATA['📜']['📿💫'] : 0;
        const animEnabled = (window.DATA && window.DATA['🔘'] && window.DATA['🔘']['🔘🎞']) || window.isAnim;
        window.CO2_EVENTS.emit('sync:state', { epochId: epochId, animEnabled: !!animEnabled, ticTime: ticTime });
    }
}


// Fonction pour mettre à jour le niveau H2O directement (similaire à updateCO2LevelDirect)
function updateH2OLevelDirect(h2o_total_percent) {
    const logoEDS = '📛'; // EDS (effet de serre)
    const logoCO2 = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CO2) ? window.LOGOS.CO2 : '🏭';
    const logoH2O = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.H2O) ? window.LOGOS.H2O : '💧';
    const logoCH4 = (typeof window !== 'undefined' && window.LOGOS && window.LOGOS.CH4) ? window.LOGOS.CH4 : '⛽';
    
    // Récupérer CO2 et CH4 depuis plotData
    const co2_ppm = (plotData && plotData.co2_ppm !== undefined) ? plotData.co2_ppm : 0;
    const ch4_ppm = (plotData && plotData.ch4_ppm !== undefined) ? plotData.ch4_ppm : 0;
    
    console.log(`${logoEDS} [updateH2OLevelDirect@main.js] 🏭=${co2_ppm.toFixed(0)}ppm 💧=${h2o_total_percent.toFixed(1)}% ⛽=${ch4_ppm.toFixed(0)}ppm`);
    // Annuler tout calcul en cours avant de commencer un nouveau
    cancelCurrentCalculation();

    // Mettre à jour window.h2oTotalFromMeteorites
    // h2o_total_percent = h2o_base + h2o_meteorites
    const h2o_base = (typeof window.h2oVaporPercent !== 'undefined') ? window.h2oVaporPercent : 0;
    const h2o_meteorites = Math.max(0, h2o_total_percent - h2o_base);
    window.h2oTotalFromMeteorites = Math.min(100, h2o_meteorites); // Limiter à 100%

    // 🔒 FORCER le recalcul en réinitialisant la valeur mise en cache
    if (typeof window !== 'undefined') {
        window.h2oIceFractionFromCalculation = undefined;
    }

    if (typeof window.runComputeInParent === 'function' && document.getElementById('scie-iframe')) {
        window.runComputeInParent();
        return;
    }

    document.getElementById('status').textContent = `Calcul pour ${h2o_total_percent.toFixed(1)}% H2O...`;

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
        // 🔒 Récupérer CO2_fraction et CH4_fraction depuis plotData (PRÉSERVER les valeurs existantes)
        const co2_ppm = (plotData.co2_ppm !== undefined && plotData.co2_ppm !== null) ? plotData.co2_ppm : 0;
        const co2_fraction = co2_ppm * 1e-6;
        const ch4_ppm = (plotData.ch4_ppm !== undefined && plotData.ch4_ppm !== null) ? plotData.ch4_ppm : 0;
        const ch4_fraction = ch4_ppm * 1e-6;
        
        // Vérification critique avant le calcul
        if (co2_ppm === 0 && ch4_ppm === 0 && h2o_total_percent === 0) {
            console.error('[updateH2OLevelDirect] ❌ ERREUR CRITIQUE - Tous les gaz sont à 0:', {
                co2_ppm,
                ch4_ppm,
                h2o_total_percent
            });
            enableButtons();
            return;
        }
        
        const result = window.simulateRadiativeTransfer(co2_fraction, {
            CH4_fraction: ch4_fraction
        });
        currentCalculationPromise = result;

        const processResult = (data) => {
            // 🔍 Vérification critique des données reçues
            if (!data || typeof data !== 'object' || data.T0 === undefined || data.temp_surface === undefined) {
                console.error('[updateH2OLevelDirect] ❌ ERREUR CRITIQUE - Données invalides:', data);
                enableButtons();
                return;
            }

            // Vérifier si le calcul a été annulé
            if (window.cancelCalculation) {
                return;
            }
            if (window.CO2_EVENTS && data) {
                window.CO2_EVENTS.emit('compute:done', { DATA: window.DATA, result: data });
            }

            // Retirer ce timeout de la liste
            const index = currentCalculationTimeouts.indexOf(timeoutId);
            if (index > -1) {
                currentCalculationTimeouts.splice(index, 1);
            }

            // Vérification critique des valeurs de sortie
            if (!data.T0 || data.T0 === 0 || !data.total_flux || data.total_flux === 0) {
                console.error('[updateH2OLevelDirect] ❌ ERREUR CRITIQUE - Calcul invalide:', {
                    T0: data.T0,
                    total_flux: data.total_flux,
                    co2_ppm: plotData.co2_ppm,
                    ch4_ppm: plotData.ch4_ppm,
                    h2o_total_percent: h2o_total_percent
                });
                enableButtons();
                return;
            }

            // Gérer la géothermie selon la température finale
            const btnNoyau = document.getElementById('btn-noyau');
            if (btnNoyau && data.T0 !== undefined) {
                const tempK = data.T0;
                if (tempK === 0 || tempK < 1) {
                    btnNoyau.classList.add('disabled');
                    btnNoyau.disabled = true;
                    btnNoyau.style.opacity = '0.3';
                    btnNoyau.style.filter = 'grayscale(100%)';
                } else {
                    btnNoyau.classList.remove('disabled');
                    btnNoyau.disabled = false;
                    btnNoyau.style.opacity = '1';
                    btnNoyau.style.filter = 'grayscale(0%)';
                }
            }

            plotData.current = data;
            if (data.lambda_range && data.lambda_weights) {
                plotData.lambda_range = data.lambda_range;
                plotData.lambda_weights = data.lambda_weights;
            }

            if (!data.T0) {
                console.error('[updateH2OLevelDirect] ❌ ERREUR - data.T0 manquant');
                enableButtons();
                return;
            }

            // Les scénarios de référence sont déjà calculés dans calculateInitialData
            if (cache_280ppm) plotData.flux_280ppm = cache_280ppm;
            if (cache_420ppm) plotData.flux_420ppm = cache_420ppm;

            const temp_eff = plotData.current.effective_temperature;
            const temp_eff_0 = (typeof window.getEffectiveTemperatureNoGreenhouse === 'function')
                ? window.getEffectiveTemperatureNoGreenhouse()
                : 255.0;
            
            const temp_surface = data.T0;
            if (!temp_surface) {
                console.error('[updateH2OLevelDirect] ❌ ERREUR - Impossible de calculer temp_surface');
                enableButtons();
                return;
            }
            
            const temp_surface_c = temp_surface - CONST.KELVIN_TO_CELSIUS;
            
            let delta_temp = 0;

            // Ajouter temp_surface et temp_surface_c à plotData
            plotData.temp_surface = temp_surface;
            plotData.temp_surface_c = temp_surface_c;

            // Récupérer l'albedo, la couverture nuageuse et le flux total depuis les résultats
            const albedo = plotData.current.albedo !== undefined ? plotData.current.albedo : null;
            const cloud_coverage = plotData.current.cloud_coverage !== undefined ? plotData.current.cloud_coverage : null;
            const total_flux = plotData.current.total_flux !== undefined ? plotData.current.total_flux : (data.total_flux !== undefined ? data.total_flux : 0);

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
                const h2o_total_percent_calc = h2o_vapor_percent + h2o_from_meteorites;

                // Calculer la répartition vapeur/glace selon la température
                const h2o_params = window.calculateH2OParameters(temp_surface, h2o_total_percent_calc, cloud_coverage);
                forcing_H2O = h2o_params.greenhouse_forcing;

                // 🔒 TOUJOURS mettre à jour h2oIceFractionFromCalculation pour l'albedo
                if (typeof window !== 'undefined') {
                    window.h2oIceFractionFromCalculation = h2o_params.ice_fraction || 0;
                }
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
            const TEMP_REF_NO_CO2 = temp_eff_0;
            delta_temp = temp_surface - TEMP_REF_NO_CO2;

            // Calculer ΔT° par rapport à la température optimale habitable (15°C = 288K)
            const TEMP_HABITABLE_OPTIMAL = 288;
            const TEMP_HABITABLE_MIN = 253;
            const TEMP_HABITABLE_MAX = 323;
            const delta_temp_habitable = temp_surface - TEMP_HABITABLE_OPTIMAL;
            const life_viable = temp_surface >= TEMP_HABITABLE_MIN && temp_surface <= TEMP_HABITABLE_MAX;

            updateDisplay({
                state: currentState,
                co2_ppm: plotData.co2_ppm,
                ch4_ppm: plotData.ch4_ppm,
                temp_surface: temp_surface,
                temp_surface_c: temp_surface_c,
                temp_eff: temp_eff,
                temp_eff_c: temp_eff - CONST.KELVIN_TO_CELSIUS,
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
            
            // 🔒 Mettre à jour plotData.current avec les résultats du calcul pour que updateFluxLabels puisse les utiliser
            if (typeof window.plotData === 'undefined') {
                window.plotData = {};
            }
            window.plotData.current = {
                T0: temp_surface,
                temp_surface: temp_surface,
                temp_surface_c: temp_surface_c,
                total_flux: total_flux,
                albedo: albedo,
                cloud_coverage: cloud_coverage,
                co2_ppm: plotData.co2_ppm,
                ch4_ppm: plotData.ch4_ppm
            };
            
            // 🔒 Mettre à jour les labels de flux (y compris h2o_percent) après le calcul
            // Utiliser plotData.current si disponible (résultats du calcul), sinon plotData
            if (typeof window.updateFluxLabels === 'function') {
                const dataForLabels = (window.plotData && window.plotData.current) ? window.plotData : (window.plotData || {});
                window.updateFluxLabels('ProcessFinished');
            }
            
            // Mettre à jour la visualisation spectrale après un délai
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
            // 🔒 PROTECTION : S'assurer que showSpectralBackground reste à true après les calculs
            if (typeof window !== 'undefined') {
                window.showSpectralBackground = true;
            }
            // Réinitialiser les flags de convergence après l'affichage final
            // 🔒 NE PAS réinitialiser showSpectralBackground (il doit rester à true)
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.spectralConverged = false;
                    window.spectralPrecisionTarget = 'auto';
                    // 🔒 S'assurer que showSpectralBackground reste à true même après réinitialisation
                    window.showSpectralBackground = true;
                }
            }, 2000);
            enableButtons(); // Réactiver les boutons quand la courbe est stabilisée
        };

        // Gérer le résultat (Promise ou valeur directe)
        if (result && typeof result.then === 'function') {
            result.then(processResult).catch((error) => {
                console.error('[updateH2OLevelDirect] ❌ ERREUR lors du calcul:', error);
                enableButtons();
            });
        } else {
            processResult(result);
        }
    }, 50);

    // Ajouter ce timeout à la liste pour pouvoir l'annuler
    currentCalculationTimeouts.push(timeoutId);
}

// Exposer updateH2OLevelDirect globalement
window.updateH2OLevelDirect = updateH2OLevelDirect;

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

function runMainInit() {
    if (typeof window.pd === 'function') window.pd('runMainInit', 'main.js', 'enter readyState=' + document.readyState);
    // 🔒 Légende des emojis (affichée une seule fois au démarrage)
    if (typeof window !== 'undefined' && !window._logLegendShown) {
        console.log('📋 Légende: 🕰 Époque | 📛 EDS | 🏭 CO2 | 💧 H2O | ⛽ CH4 | 🪩 Albédo | 🧊 Glace | ⛅ Nuages | 🛠 Config | 🎚 Précision | ⏸️ Pause | 🔄 Reset | ✅ OK | ⚠️ Warning | ❌ Error');
        window._logLegendShown = true;
    }
    
    // Attendre que le DOM soit complètement rendu avant de lancer les calculs
    // Utiliser requestAnimationFrame pour s'assurer que le navigateur a eu le temps de rendre
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // DOM : 200ms pour laisser navigateur finaliser le rendu avant init listeners FPS
                setTimeout(() => {
                // 🔒 Écouter les événements FPS pour contrôler précision, affichage et animation
                window.addEventListener('fpsLevelChanged', (event) => {
                    const { fps, level, precisionFactor } = event.detail;
                    
                    // Stocker le niveau et la précision globalement
                    window.fpsLevel = level;
                    window.fpsPrecisionFactor = precisionFactor;
                    
                    // Contrôler l'affichage selon le niveau FPS
                    // 🔒 Le bouton "anim" contrôle directement showDichotomySteps, on ne le modifie pas ici
                    // On contrôle seulement l'animation de la planète selon le FPS
                    const animEnabled = (window.DATA && window.DATA['🔘'] && window.DATA['🔘']['🔘🎞']);
                    
                    if (level === 'warning' || level === 'aïe' || level === 'lent') {
                        // FPS bas : arrêter l'animation de la planète (même si anim activé, on arrête pour performance)
                        if (typeof window !== 'undefined') {
                            window.threeJSAnimationPaused = true;
                        }
                    } else {
                        // FPS correct : relancer l'animation si le bouton anim est activé
                        if (animEnabled && typeof window !== 'undefined') {
                            window.threeJSAnimationPaused = false;
                        }
                    }
                    
                    // Contrôler l'affichage du fond coloré (spectral visualization)
                    // Désactiver si FPS < 20
                    if (level === 'warning' || level === 'aïe') {
                        window.showSpectralBackground = false;
                    } else {
                        window.showSpectralBackground = true;
                    }
                });
                
                // Initialiser les variables globales pour le contrôle FPS
                if (typeof window !== 'undefined') {
                    window.showSpectralBackground = true; // Par défaut, afficher le fond coloré
                    window.fpsLevel = 'rapide'; // Niveau par défaut
                    window.fpsPrecisionFactor = 1.0; // Précision par défaut
                }
                
                // Anim : source de vérité = DATA['🔘']['🔘🎞'] (bouton animation = bouton normal, pas toggle)
                const animCb = document.getElementById('plot-anim-toggle-checkbox');
                if (typeof window !== 'undefined') {
                    window.isAnim = (window.DATA && window.DATA['🔘'] && window.DATA['🔘']['🔘🎞']) || false;
                    window.showDichotomySteps = window.isAnim;
                }
                if (animCb) {
                    animCb.addEventListener('change', (e) => {
                        const enabled = e.target.checked;
                        if (typeof window !== 'undefined' && window.DATA && window.DATA['🔘']) {
                            window.DATA['🔘']['🔘🎞'] = enabled;
                            window.isAnim = enabled;
                            window.showDichotomySteps = enabled;
                            if (!enabled) {
                                window.threeJSAnimationPaused = true;
                            } else if (window.fpsLevel && window.fpsLevel !== 'warning' && window.fpsLevel !== 'aïe' && window.fpsLevel !== 'lent') {
                                // Si on réactive et que le FPS est correct, relancer l'animation
                                window.threeJSAnimationPaused = false;
                            }
                        }
                    });
                }
                
                // 🔒 Initialiser la précision de convergence depuis les radio buttons (variable globale unique)
                const precisionRadios = document.querySelectorAll('input[name="precision-convergence"]');
                if (precisionRadios.length > 0 && typeof window !== 'undefined') {
                    // Trouver le bouton radio checked
                    const checkedRadio = Array.from(precisionRadios).find(r => r.checked);
                    if (checkedRadio && checkedRadio.value) {
                        window.convergencePrecision_K = parseFloat(checkedRadio.value);
                    }
                    
                    // Écouter les changements pour mettre à jour la variable globale unique
                    precisionRadios.forEach(radio => {
                        radio.addEventListener('change', (e) => {
                            if (e.target.checked && typeof window !== 'undefined') {
                                // 🔒 Mettre à jour la variable globale unique (seule référence)
                                // Si l'utilisateur change la précision, la config ne doit plus être prise en compte
                                window.convergencePrecision_K = parseFloat(e.target.value);
                                console.log(`[UI] Précision convergence modifiée: ${window.convergencePrecision_K}K`);
                            }
                        });
                    });
                }
                
                const corpsNoirBtn = document.querySelector('.epoch-btn[data-epoch="⚫"]');
                if (corpsNoirBtn) corpsNoirBtn.click();
                
                // Écouter l'événement 'calculationConverged' pour activer l'animation de la planète
                window.addEventListener('calculationConverged', () => {
        // 🔒 Attendre que le FPS revienne à >=60FPS avant de relancer l'animation
        // Le garde-fou dans animate() gère aussi <30FPS pour arrêter automatiquement
        let attempts = 0;
        const maxAttempts = 100; // Maximum 10 secondes (100 * 100ms)
        
        const checkFPSAndResume = () => {
            attempts++;
            const currentFPS = (typeof window !== 'undefined' && window.fps) ? window.fps : 0;
            
            if (currentFPS >= 60) {
                // FPS >= 60 : relancer l'animation Three.js
                if (typeof window !== 'undefined') {
                    window.threeJSAnimationPaused = false;
                    console.log('[main.js] ▶️ Animation Three.js relancée (FPS:', currentFPS.toFixed(1), ')');
                }
            } else if (currentFPS < 30) {
                // FPS < 30 : s'assurer que l'animation est bien arrêtée
                if (typeof window !== 'undefined') {
                    window.threeJSAnimationPaused = true;
                    console.log('[main.js] ⏸️ Animation Three.js arrêtée (FPS trop bas:', currentFPS.toFixed(1), ')');
                    }
                // Ne plus réessayer si FPS trop bas
                return;
            } else if (attempts < maxAttempts) {
                // FPS entre 30 et 60 : réessayer dans 100ms
                setTimeout(checkFPSAndResume, 100);
                        } else {
                // Timeout : forcer la reprise si FPS > 30 (même si < 60)
                if (currentFPS > 30) {
                if (typeof window !== 'undefined') {
                        window.threeJSAnimationPaused = false;
                        console.log('[main.js] ▶️ Animation Three.js relancée (timeout, FPS:', currentFPS.toFixed(1), ')');
                    }
                }
            }
        };
        
        // Vérifier le FPS immédiatement et continuer à vérifier si nécessaire
        setTimeout(checkFPSAndResume, 100);
        
        // Activer l'animation de la planète après la convergence des calculs
        const planetTextures = document.querySelectorAll('.planet-texture[data-planet-texture="true"]');
        planetTextures.forEach(texture => {
            texture.classList.remove('paused');
        });
    });
    
    // 🔒 S'assurer que currentEpochName est initialisé avant calculateInitialData
    if (typeof window.currentEpochName === 'undefined') {
        window.currentEpochName = 'Corps noir';
    }
    
    calculateInitialData();
    // Initialiser l'horloge (mais NE PAS la démarrer automatiquement)
    resetTimeline();

    // Fonction updateEpochActions est maintenant dans events.js

    // Mettre à jour les actions au chargement
    if (typeof window.updateEpochActions === 'function') {
        window.updateEpochActions();
    }

    // 🔒 setEpoch("Corps noir") a déjà été appelé plus haut (avant calculateInitialData)
    // Ici on fait juste les initialisations complémentaires si nécessaire
    // (setEpoch a déjà initialisé les variables globales et sélectionné le bouton)

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
        // DOM : boutons flux créés par organigramme (injection HTML asynchrone). 100ms pour injection.
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

    // Initialiser l'horloge au chargement (même batch que initFluxButtonListeners)
    setTimeout(() => {
        const infoTimeDisplay = document.getElementById('info-time');
        if (infoTimeDisplay) {
            infoTimeDisplay.textContent = '+0 Ma';
            updateTimeline(); // Forcer une mise à jour immédiate (affichage seulement, pas d'incrémentation)
        }
        // NE PAS démarrer l'horloge automatiquement - elle s'incrémentera uniquement lors des calculs/clics
    }, 100);
    
            }, 200); // Délai de 200ms pour laisser le temps au DOM de se construire
        });
    });
}
// DOMContentLoaded peut déjà être passé (loader charge scripts après fetch) → exécuter immédiatement si tel est le cas
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', runMainInit);
} else {
    runMainInit();
}

// Fonction pour mettre à jour la texture Hadéen selon infoTimeMa
function updateHadeenTexture() {
    const currentEpoch = (typeof window !== 'undefined' && window.currentEpochName) || '';
    if (currentEpoch !== 'Hadéen') return;
    
    // Récupérer la config de l'époque et interpréter le logo
    const terreNode = window.configOrganigramme.nodes.find(n => n.id === 'terre');
    if (!terreNode || !terreNode.epoch || !Array.isArray(terreNode.epoch)) return;
    
    const epochConfig = terreNode.epoch.find(e => e.epochName === 'Hadéen');
    if (!epochConfig) return;
    
    // Texture (text_*.png) si planetEffect, sinon logo (picto)
    const newLogoPath = (epochConfig.planetEffect && epochConfig.texture)
        ? interpretConfigValue(epochConfig.texture)
        : interpretConfigValue(epochConfig.logo);
    
    // Interpréter lightDistance aussi
    let lightDistance = epochConfig.lightDistance;
    if (typeof lightDistance === 'string' || (typeof lightDistance !== 'number' && lightDistance !== null && lightDistance !== undefined)) {
        lightDistance = interpretConfigValue(lightDistance);
    }
    
    // Si isIceChange, diminuer lightDistance de 1
    if (window.isIceChange && typeof lightDistance === 'number') {
        lightDistance = Math.max(0, lightDistance - 1);
    }
    
    // Stocker les valeurs interprétées pour createCell
    if (typeof window !== 'undefined') {
        window.currentEpochLuxSaturation = epochConfig.luxSaturation !== undefined ? epochConfig.luxSaturation : 1.0;
        window.currentEpochLightDistance = lightDistance;
    }
    
    // Recréer la cellule Terre avec la nouvelle texture
    const oldCell = document.getElementById('cell-terre');
    if (oldCell && typeof window.createCell === 'function') {
        // 🔒 Sauvegarder l'angle de rotation AVANT de supprimer la cellule
        // (pour éviter que la terre pivote d'un coup lors du changement de texture)
        const canvas = oldCell.querySelector('canvas');
        let savedRotationY = 0;
        if (canvas && canvas._threeJSData && canvas._threeJSData.sphere) {
            savedRotationY = canvas._threeJSData.sphere.rotation.y;
            // 🔒 Stocker dans window pour que initPlanetThreeJS puisse le récupérer
            // (pour éviter que la terre pivote d'un coup lors du changement de texture)
            if (typeof window !== 'undefined') {
                window.savedPlanetRotationY = savedRotationY;
            }
        } else if (typeof window !== 'undefined' && window.savedPlanetRotationY !== undefined) {
            // Si pas de sphere mais qu'on a déjà une rotation sauvegardée, la conserver
            savedRotationY = window.savedPlanetRotationY;
        }
        
        const parent = oldCell.parentElement;
        oldCell.remove();
        
        const newCell = window.createCell(
            terreNode.x,
            terreNode.y,
            epochConfig.radius,
            epochConfig.fillColor,
            epochConfig.strokeColor,
            newLogoPath, // Utiliser le logo interprété
            terreNode.left,
            terreNode.right,
            terreNode.top,
            terreNode.bottom,
            terreNode.tooltip,
            terreNode.ariaLabel || null,
            terreNode.radiation,
            null, // rectangleOptions
            null, // fillImage
            terreNode.id,
            terreNode.zIndex,
            terreNode.logoScale,
            terreNode.logoOffsetY,
            epochConfig.strokeSize,
            terreNode.strokeStyle || 'solid',
            null, // targetContainer
            epochConfig.planetEffect || false
        );
        
        parent.appendChild(newCell);
    }
}

// Exposer updateHadeenTexture et interpretConfigValue globalement
window.updateHadeenTexture = updateHadeenTexture;
window.interpretConfigValue = interpretConfigValue;

/** Debug : run par epoch, log entrée (config epoch) + sortie (convergence) dans fichier txt. */
window.runDebugLogMode = function () {
    console.log('[runDebugLogMode] appele');
    var timeline = window.TIMELINE;
    if (!timeline || !Array.isArray(timeline)) {
        console.error('[runDebugLogMode] TIMELINE absent');
        return;
    }
    var epochs = timeline.filter(function (e) { return e && e['📅']; });
    if (epochs.length === 0) {
        console.error('[runDebugLogMode] Aucune époque');
        return;
    }
    var btn = document.getElementById('plot-debug-log');
    if (btn) btn.disabled = true;
    var logLines = [];
    logLines.push('# Debug log - run par epoch');
    logLines.push('# Date: ' + new Date().toISOString());
    logLines.push('');

    function getConvergenceContentFromIframe() {
        var iframe = document.getElementById('scie-iframe');
        if (!iframe || !iframe.contentDocument) return '(iframe non accessible)';
        var el = iframe.contentDocument.getElementById('convergence-content');
        return el ? (el.innerText || el.textContent || el.innerHTML || '(vide)') : '(convergence-content absent)';
    }

    function next(i) {
        if (i >= epochs.length) {
            var blob = new Blob([logLines.join('\n')], { type: 'text/plain;charset=utf-8' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'debug_convergence_' + new Date().toISOString().slice(0, 19).replace(/[:-]/g, '') + '.txt';
            a.click();
            URL.revokeObjectURL(a.href);
            if (btn) btn.disabled = false;
            console.log('[runDebugLogMode] Fichier téléchargé');
            return;
        }
        var epoch = epochs[i];
        var epochId = epoch['📅'];
        logLines.push('=== EPOCH ' + (i + 1) + '/' + epochs.length + ' : ' + epochId + ' ===');
        logLines.push('');
        logLines.push('--- Entrée : config epoch (JS) ---');
        try {
            logLines.push(JSON.stringify(epoch, null, 2));
        } catch (e) {
            logLines.push('(erreur stringify: ' + e.message + ')');
        }
        logLines.push('');
        if (typeof window.setEpoch === 'function') window.setEpoch(epochId);
        var run = window.runComputeInParent ? window.runComputeInParent() : Promise.resolve(null);
        (run && typeof run.then === 'function' ? run : Promise.resolve(run)).then(function () {
            return new Promise(function (r) { setTimeout(r, 200); });
        }).then(function () {
            logLines.push('--- Convergence (contenu panel) ---');
            logLines.push(getConvergenceContentFromIframe());
            logLines.push('');
            logLines.push('');
            next(i + 1);
        }).catch(function (e) {
            logLines.push('--- Erreur ---');
            logLines.push(String(e && e.message ? e.message : e));
            logLines.push('');
            next(i + 1);
        });
    }
    next(0);
};
