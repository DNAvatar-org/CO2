// ============================================================================
// File: main.js - Logique principale de la simulation
// Desc: En français, dans l'architecture, je suis le module principal de simulation
// Version 1.1.78
// Date: [May 06, 2026]
//
// - v1.1.78: updateHadeenTexture — retrait if(typeof window) / if(oldCell) superflus ; window.ORG.createCell direct.
// - v1.1.77: updateHadeenTexture — window.ORG.createCell (FUNCS_ORGANIGRAMME n’existe que dans setEpoch ; crash hors scope).
// - v1.1.76: updateLegend albedoComponents — sans atm : ice_coverage depuis 💧.🍰💧🧊 avant RUNTIME.h2oIceFractionFromCalculation (aligné organigramme.js v1.0.94).
// - v1.1.75: setEpoch — après DATA['📜']['👉']/🗿, syncEpochFromTimelinePointer() (bouton époque passe id ⚫ ; terre.epoch attend « Corps Noir »).
// - v1.1.74: légende plot — libellés explicites (.../---/___) + °C en petit au-dessus de chaque style de trait.
// - v1.1.73: updateLegend — 3 lignes (pointillés / tirets / plein) + libellé texte à droite uniquement ; plus de °C/°F/K ni T sol·eff sur les items ; toujours 3 courbes affichées.
// - v1.1.72: doc organigram-buttons — wraps DETAILS/OBS uniquement ; SKIP #plot-anim-toggle n'embarque plus cette classe (organigramme.js v1.0.81).
// - v1.1.71: wraps DETAILS/OBS — classe organigram-buttons (même jeton que #plot-anim-toggle, organigramme.js).
// - v1.1.68: toggles ⚗/🛰 — classe unique organigram-logo (homogénéité avec événements timeline, organigramme.css).
// - v1.1.67: updateLegend — HTML visu_radiatif sans bloc Puissance dissipée / ∫ ; retrait injection SVG + sélecteur couleur allégé (style.css sans .legend-line-*).
// - v1.1.66: setEpoch — reset 📜._timelineVeilPulse01 / 📜._veilTimelinePulseActive (impulsion voile TIMELINE lue dans compute.js v1.0.14).
// - v1.1.65 : fix ReferenceError updatePlot — tous les appels directs updatePlot(...) → window.PLOT.updatePlot(...) (plot.js n’expose plus de global homonyme ; ordre loader plot avant main).
// - v1.1.64 : migration namespaces (PLOT.updatePlot, PLOT.updateSpectralVisualization, PLOT.tempSurfaceToColor, ORG.updateFluxLabels, ORG.createCell…) + UI_STATE (waterVaporEnabled, methaneEnabled, maximiseData, savedCO2/CH4/H2O) + RUNTIME_STATE (calculationConverged, calculationTimeouts, spectralConverged, spectralPrecisionTarget, showSpectralBackground, h2oVaporPercent, h2oTotalFromMeteorites, h2oIceFractionFromCalculation, currentEpochName, fps, volcanoH2OBonus). Retrait typeof===function défensifs (crash-first).
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
//
// - v1.1.63 : badge flou — icônes 🔺🌡️🔻 + 🧩 (sans points) ; grille 1fr + justify space-between sur les lignes d’icônes
// - v1.1.62 : badge flou — grille 2 colonnes : gauche 🔺🌡️🔻. + jauge (largeur = ligne icônes) ; droite 🧩 . + % sous puzzle
// - v1.1.61 : badge flou titre — mini-jauge (range) sur la ligne % à la place des tirets « ------ »
// - v1.1.60 : #title-flou-scientifique-slot — libellé 🔺🌡️🔻. 🧩 . + ligne ------ % (badge flou scientifique)
// - v1.1.59 : resolveOrganigramTerreEpochName — switch (true) + in ; applyBary : accès direct DATA['📜']['🗿'] ; retrait if window.top (regle-branchement-crash-first)
// - v1.1.58 : setEpoch / applyBaryToGraphiqueOnly — alias terre.epoch / noyau.radiation : Boule de neige (TIMELINE) -> Protérozoïque (config organigramme), sinon pas de recréation Three.js
// - v1.1.57 : log [visu pictos] — marqueurs spectraux graphe = .organigram-picto-inactived seulement Corps Noir (plot.js v1.0.52) ; Géométrie = CSS hide-*
// - v1.1.54 : runMainInit — garde si #plot-anim-toggle-checkbox absent (addEventListener sur null)
// - v1.1.53 : [1] config — console.log visibilité pictos (hide-organigram-* + .organigram-picto-inactived)
// - v1.1.52 : setEpoch fin — syncPlotContainerOrganigramHideClasses (retrait .organigram-picto-inactived sur [ ] plot hors Corps Noir)
// - v1.1.51 : syncPlotContainerOrganigramHideClasses appelle updateSpectralBandIndicatorsGhostOnly (fantôme spectre hors Corps Noir)
// - v1.1.50 : syncPlotContainerOrganigramHideClasses — memes hide-organigram-* sur .plot-container-wrapper que #flux-diagram (spectre plot.js)
// - v1.1.49 : badge Flou scientifique (🧩) dans #title-flou-scientifique-slot (.title-container), plus dans #flux-diagram
// - v1.1.48 : légende équilibre — ligne « Corps noir (sol) » tirets (Planck T_surface, plot.js v1.0.30)
// - v1.1.47 : légende équilibre — Corps noir (pointillé) = T_eff ; Courbe réelle (pleine) = T_surface (cohérence ∫ / plot.js tooltip)
// - v1.1.1 : retrait precisionFactor/fpsPrecisionFactor (FPS.js v1.2.0 remplace Précision par Mémoire)
// - v1.1.2 : updateHadeenTexture : nouvelle cellule insérée derrière l'ancienne, retrait ancienne au three:ready (évite disparition texture)
// - v1.1.3 : setEpoch : même pattern insertBefore+three:ready si planetEffect ; _logStep helper console.groupCollapsed
// - v1.1.4 : const MAJUSCULE = window.MAJUSCULE en entrée de chaque fonction (données vivantes, comme imports)
// - v1.1.5 : updateDisplay bloc albedo : logosOrEmpty au lieu de const LOGOS = LOGOS (TDZ) ; pas de window.MAJUSCULE hors init
// - v1.1.6 : Three.js pause avant changement texture (setEpoch/updateHadeenTexture), play au compute:done (loader_panels)
// - v1.1.7 : debug logs setEpoch (trace appelant [3]) + log début appel
// - v1.1.8 : fix "un nextEpoch en trop" — message scie ne réécrit plus DATA[📿💫] du parent ; bary:changed passe keepTimeMa:true ; setEpoch early-return respecte keepTimeMa
// - v1.1.39 : selection timeline supports epoch-text (hidden epochs) like epoch-btn
// - v1.1.44 : setEpoch(..., { keepTimeMa: true }) — applyBaryToGraphiqueOnly + return (évite 2e sync:state run + 2e [4] après bary iframe)
// - v1.1.43 : traces runMainInit / mini-slider / bary → pdTrace (pd = erreurs uniquement)
// - v1.1.42 : _logStep / _logStepEnd déplacés vers debug.js v1.0.6 (ordre avant configOrganigramme — [1] config = groupe dès le load)
// - v1.1.41 : applyBaryToGraphiqueOnly — retrait groupe 🎨 vide (groupCollapsed+End) ; log ligne unique si DEBUG_SYNC_PANELS
// - v1.1.40 : setEpoch fallback resolves hidden epochs from TIMELINE when geology lookup fails
// - v1.1.9 : applyBaryToGraphiqueOnly : early-return ne bloque plus sur !baryEpochs[epoch] ; +generateArrows +cellAlbedo (parité avec setEpoch full body)
// - v1.1.10 : setEpoch : restauration log [2] (supprimé) ; events.js Hadéen handler réordonné (voir events.js v1.2.3)
// - v1.1.11 : setEpoch stocke _lastPlanetTexturePath=logoPath ; applyBaryToGraphiqueOnly skip si même path (fix double Three.js)
// - v1.1.12 : updateHadeenTexture utilise getEffectiveNodesConfig(bary) pour radius/exobase/colors interpolés + stocke _lastPlanetTexturePath
// - v1.1.13 : setEpoch "même époque" seulement si currentEpochName===epochName (fix transition ticTime → [1][2][4] exécutés)
// - v1.1.14 : suppression court-circuit "même époque" — rechargement complet à chaque setEpoch
// - v1.1.15 : titre CONFIGURATION (styles SCENARIO/EPOQUES) au-dessus du bouton organigramme
// - v1.1.16 : classe organigram-config-heading (font timeline 04B_03, marge bas, sans trait)
// - v1.1.17 : libellé organigramme « CONFIG. » (plus court)
// - v1.1.18 : libellé organigramme « PILOTAGE » (remplace CONFIG.)
// - v1.1.19 : badge albedo_percent (#organigram-config-wrap, à droite de ⚗)
// - v1.1.20 : badge fine_tuning_cloud_bary (🧩 nuages) dans la même ligne — retiré du bouton albédo
// - v1.1.21 : updateThreePlayIndicator idempotent — recrée wrap/⚗/%/🧩 si partiellement absents
// - v1.1.22 : garde updateEpochActions si events.js pas encore chargé
// - v1.1.23 : albedo_percent retiré du PILOTAGE — de retour sur le bouton albédo (configOrganigramme)
// - v1.1.24 : bouton ⚗ sans title natif ni alt détaillé distinct (évite 2e tooltip après 2s)
// - v1.1.25 : bouton ⚗ garde tooltip court + alt détaillé après 2s via aria-label long (sans title natif)
// - v1.1.26 : badge 🧩 compact sur 3 lignes + mini-slider 4ch ; réglage CLOUD_SW en visu_ (compute au relâchement)
// - v1.1.27 : badge 🧩 court = "Flou scientifique" ; détail uniquement dans l'alt déplié
// - v1.1.28 : mini-slider visu_ envoie le même payload sync:tuning complet que scie_ (état commun + compute cohérent)
// - v1.1.28 : badge 🧩 sorti de #organigram-config-wrap — enfant direct de #flux-diagram (sibling du wrap)
// - v1.1.29 : input slider bary — mise à jour directe .organigram-bary-pct (plus d'updateFluxLabels qui détache le slider)
// - v1.1.30 : mini-slider visu_ force DATA['🎚️'].baryByGroup.CLOUD_SW + fillDataTuningFromBary avant sync/run (évite reset implicite à 100%)
// - v1.1.31 : logs debug mini-slider (input/change) + payload tuning juste avant appel run
// - v1.1.32 : mini-slider visu_ interpole localement FINE_TUNING_BOUNDS -> DATA['🎚️'] (fallback robuste si fillDataTuningFromBary indisponible)
// - v1.1.33 : trace setters DATA['🎚️'] (bary CLOUD_SW + CLOUD_FRACTION_BASE) + set explicite CLOUD_FRACTION_BASE au slider
// - v1.1.34 : payload mini-slider reconstruit depuis bary+FINE_TUNING_BOUNDS (source DATA), puis réinjecté avant run
// - v1.1.35 : création badge 🧩 — % et slider alignés sur DATA['🎚️'].baryByGroup.CLOUD_SW (plus de 100% figé jusqu'à updateFluxLabels)
// - v1.1.36 : wrap OBSERVATIONS (titre + 🛰) comme PILOTAGE ; toggle hide-organigram-observation-metrics sur #flux-diagram
// - v1.1.37 : booléens window.organigramObservation*PictoHidden (géométrie, EDS/reemis, albédo-btn) synchronisés au 🛰
// - v1.1.46 : organigramme titre « DETAILS » (ex PILOTAGE) ; OBSERVATIONS fermées par défaut (🛰 off → surtout Terre visible)
// - v1.1.45 : libellé 🐊 → « Éocène » (titre court)
// - v1.1.38 : libellé d’époque 🐊 → « Hyperthermie éocène » (plus « Terre étouffe (PETM) »)
//
// NOTE ASYNC (v1.1.0) — exceptions à la règle sync :
//   1. requestAnimationFrame dans processResult (×3) : différer d'1 frame pour que le DOM
//      soit à jour avant d'appeler updateSpectralVisualization. Strictement nécessaire.
//   2. setTimeout(100) dans plot.js/drawSpectralVisualization : le draw canvas 2000 bins
//      bloque le main thread ; le setTimeout laisse Plotly finir avant de peindre le canvas.
//      C'est le seul timeout métier autorisé par exception à _REGLE_SYNC_SCRIPTS.
// ============================================================================
// MAJUSCULE : const MAJUSCULE = window.MAJUSCULE en entrée de chaque fonction (comme imports).
// Données vivantes, lues à chaque appel. Pas de const au niveau fichier (évite redéclaration si script 2×).
// ============================================================================
// DRAW FLUX — séquence de dessin différé (1 RAF + setTimeout dans plot.js)
// Async autorisé par exception : voir NOTE ASYNC en tête de fichier.
// ============================================================================
function _drawFluxAndUnpause(plotData) {
    window.RUNTIME_STATE.showSpectralBackground = true;
    requestAnimationFrame(function () {  // 1 RAF : laisse le DOM se mettre à jour
        const fresh = window.RADIATIVE.getSpectralResultFromDATA();
        if (fresh.lambda_range && fresh.upward_flux) {
            plotData.lambda_range = fresh.lambda_range;
            plotData.lambda_weights = fresh.lambda_weights;
            plotData.current = fresh;
        }
        window.PLOT.updatePlot(plotData);
        const canvas = document.getElementById('spectral-visualization');
        if (canvas) {
            canvas.style.setProperty('display', 'block', 'important');
            canvas.style.setProperty('visibility', 'visible', 'important');
            canvas.style.setProperty('opacity', '1', 'important');
            canvas.style.setProperty('z-index', '10000', 'important');
            canvas.style.setProperty('position', 'absolute', 'important');
        }
        try {
            window.PLOT.updateSpectralVisualization(plotData.current);
        } catch (err) {
            console.error('❌ [drawFlux]', err);
        }
    });
}

// _logStep / _logStepEnd : voir static/debug.js v1.0.6 (définis avant configOrganigramme.js)

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

// ============================================================================
// SYSTÈME DE VOLCANS (effet sur H2O et glace)
// ============================================================================
// Variable globale pour suivre l'effet cumulatif des volcans
// Chaque volcan augmente H2O de 1% et diminue la glace de 1%
let volcanoH2OBonus = 0; // Bonus H2O en % (0 à 100)
let volcanoIceReduction = 0; // Réduction de glace en % (0 à 100)

// Exposer globalement pour les calculs (const en entrée = lecture courante window)
if (typeof window !== 'undefined') {
    (function () {
        const SYNC_STATE = window.SYNC_STATE;
        window.RUNTIME_STATE.volcanoH2OBonus = 0;
        window.volcanoIceReduction = 0;
        window.isDebugPhases = false;
        SYNC_STATE.calculationInProgress = false; // Exposé pour plot.js (resizeCanvasToPlot skipReposition pendant dichotomie)
    })();
}

// ============================================================================
// UNITÉ DE TEMPÉRATURE (cycle °C → °F → K)
// ============================================================================
let temperatureUnit = 'C'; // 'C', 'F', ou 'K'
let currentTempCelsius = null; // Stocker la température en Celsius

function convertTemperature(tempC, unit) {
    const CONST = window.CONST;
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
    const CONST = window.CONST;
    const DATA = window.DATA;
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
    // Couleur dynamique (tempSurfaceToColor) sur tout .synthese_Temp (col-left dates + col-right T°/pression).
    // Le thermomètre 🌡️ garde sa couleur Wien via style.color !important (cf. plus haut) → pas écrasé.
    if (syntheseTempEl) {
        if (currentTempCelsius !== null) {
            syntheseTempEl.style.setProperty('color', window.PLOT.tempSurfaceToColor(currentTempCelsius), 'important');
        } else {
            syntheseTempEl.style.removeProperty('color');
        }
    }
    if (tempUnitEl) {
        tempUnitEl.textContent = getTemperatureUnitSymbol(temperatureUnit);
    }
    // Mettre à jour la pression au sol depuis DATA si disponible
    const pressureValEl = document.getElementById('pressure-surface-synthese');
    if (pressureValEl && DATA && DATA['🫧'] && DATA['🫧']['🎈'] != null) {
        const P = DATA['🫧']['🎈'];
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
    const era = window.GEOLOGY ? window.GEOLOGY.getGeologicalEra(yearsAgo) : { name: 'Phanérozoïque', volcanoFactor: 1.0 };
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
    const SYNC_STATE = window.SYNC_STATE;
    SYNC_STATE.calculationInProgress = true;
    // Réinitialiser les flags de convergence
    if (typeof window !== 'undefined') {
        window.RUNTIME_STATE.calculationConverged = false;
        window.RUNTIME_STATE.spectralConverged = false;
        window.RUNTIME_STATE.spectralPrecisionTarget = 'auto';
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
    const SYNC_STATE = window.SYNC_STATE;
    const YEARS_PER_FRAME = window.YEARS_PER_FRAME;
    SYNC_STATE.calculationInProgress = false;
    
    // Activer l'animation de la planète après la fin des calculs
    // Chercher toutes les textures de planète et retirer la classe "paused"
    const planetTextures = document.querySelectorAll('.planet-texture[data-planet-texture="true"]');
    planetTextures.forEach(texture => {
        texture.classList.remove('paused');
    });
    const currentYears = window.timelineFrame * YEARS_PER_FRAME;
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
                        if (typeof window.UI_STATE.waterVaporEnabled !== 'undefined' && window.UI_STATE.waterVaporEnabled) {
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
 * - {$ticTime} : remplacé par Math.floor(window.infoTimeMa / DATA['📜']['🔺⏳'])
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
    const DATA = window.DATA;
    const TIMELINE = window.TIMELINE;
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
    
    // ticTime = infoTimeMa / stepMa — stepMa lu directement depuis la config du bouton cliqué
    // Exception init : 🔘🕰 = '' avant le premier clic → ticTime = 0
    let ticTime = 0;
    if (DATA['📜']['🔘🕰'] !== '') {
        const _epochId_icv = DATA['📜']['🗿'];
        const _epoch_icv = TIMELINE[TIMELINE.findIndex(item => item['📅'] === _epochId_icv)];
        const stepMa = _epoch_icv['🕰'][DATA['📜']['🔘🕰']]['🔺⏳'];
        ticTime = Math.floor(window.infoTimeMa / stepMa);
    }

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
            window.RUNTIME_STATE.fps = fps;
        }

        window.updateFPSDisplay(fps);
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
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
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
    const initBins = (CONFIG_COMPUTE.initSpectralBinsConvergence != null && Number.isFinite(CONFIG_COMPUTE.initSpectralBinsConvergence))
        ? CONFIG_COMPUTE.initSpectralBinsConvergence
        : CONFIG_COMPUTE.maxSpectralBinsConvergence;
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
    window.PLOT.updatePlot(tempPlotData);

    // Ne pas calculer les scénarios de référence (280ppm et 420ppm)
    // Commencer directement à 0 ppm par défaut sans calculer

    // Afficher les courbes de référence (Planck uniquement)
    updateLegend(plotData);
    window.PLOT.updatePlot(plotData);

    // 🔒 NOTE: Le calcul sera lancé par setEpoch("Corps noir") appelé avant calculateInitialData
    // Pas besoin d'appeler updateCO2Level ici, cela créerait un appel en double
    // Les valeurs sont déjà initialisées par updateLevelsConfig dans setEpoch
}

function updateCO2Level(state) {
    const DATA = window.DATA;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const LOGOS = window.LOGOS;
    const CONST = window.CONST;
    const logoEDS = '📛'; // EDS (effet de serre)
    const logoCO2 = (typeof window !== 'undefined' && LOGOS && LOGOS.CO2) ? LOGOS.CO2 : '🏭';
    const logoH2O = (typeof window !== 'undefined' && LOGOS && LOGOS.H2O) ? LOGOS.H2O : '💧';
    const logoCH4 = (typeof window !== 'undefined' && LOGOS && LOGOS.CH4) ? LOGOS.CH4 : '🐄';
    
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
    
    // H2O : vapeur (window) + météorites dérivé de TIMELINE (🔺⚖️💧☄️ = water_added_kg dans config)
    const h2o_percent = (typeof window !== 'undefined' && window.RUNTIME_STATE.h2oVaporPercent !== undefined) ? window.RUNTIME_STATE.h2oVaporPercent : 0;
    const h2o_meteorites = (DATA['📜']['🔺⚖️💧☄️'] * DATA['📜']['📿☄️'] / CONFIG_COMPUTE.earthTotalWaterMassKg) * 100;
    const h2o_total = h2o_percent + h2o_meteorites;
    const ch4_ppm = (plotData && plotData.ch4_ppm !== undefined) ? plotData.ch4_ppm : 0;

    document.getElementById('status').textContent = `Calcul pour ${plotData.co2_ppm.toFixed(0)} ppm...`;

    setTimeout(() => {
        // Reset du marqueur de résolution intermédiaire (nouveau calcul)
        const _sv = document.getElementById('spectral-visualization');
        if (_sv) _sv._lastDrawnBins = 0;
        // Récupérer CH4_fraction depuis plotData (défini par setEpoch ou par défaut 0)
        const ch4_ppm = plotData.ch4_ppm || 0;
        const ch4_fraction = ch4_ppm * 1e-6;
        const result = window.RADIATIVE.simulateRadiativeTransfer(co2_fraction, {
            CH4_fraction: ch4_fraction
        });
        const processResult = (data) => {
            const logo = (typeof window !== 'undefined' && LOGOS && LOGOS.CO2) ? LOGOS.CO2 : '🏭';
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
            const temp_eff_0 = (window.CLIMATE && window.CLIMATE.getEffectiveTemperatureNoGreenhouse)
                ? window.CLIMATE.getEffectiveTemperatureNoGreenhouse()
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
            const forcing_CO2 = (window.CLIMATE && window.CLIMATE.calculateCO2Forcing)
                ? window.CLIMATE.calculateCO2Forcing(plotData.co2_ppm * 1e-6)
                : 0;

            // Calculer le forcing H2O avec la nouvelle fonction calculateH2OParameters
            let forcing_H2O = 0;
            let h2o_vapor_percent = 0;
            if (window.UI_STATE.waterVaporEnabled) {
                // Récupérer l'eau de base de l'époque
                h2o_vapor_percent = (typeof window.RUNTIME_STATE.h2oVaporPercent !== 'undefined') ? window.RUNTIME_STATE.h2oVaporPercent : 0;

                // Ajouter l'eau totale des météorites
                const h2o_from_meteorites = (DATA['📜']['🔺⚖️💧☄️'] * DATA['📜']['📿☄️'] / CONFIG_COMPUTE.earthTotalWaterMassKg) * 100;
                const h2o_total_percent = h2o_vapor_percent + h2o_from_meteorites;

                // Calculer la répartition vapeur/glace selon la température
                const h2o_params = window.H2O.calculateH2OParameters(temp_surface, h2o_total_percent, cloud_coverage);
                forcing_H2O = h2o_params.greenhouse_forcing;

                // 🔒 TOUJOURS mettre à jour h2oIceFractionFromCalculation pour l'affichage
                // (déjà fait dans calculateH2OParameters, mais on force la mise à jour pour être sûr)
                if (typeof window !== 'undefined') {
                    window.RUNTIME_STATE.h2oIceFractionFromCalculation = h2o_params.ice_fraction || 0;
                }

                // Mettre à jour la composition atmosphérique (H2O est déjà mis à jour dans calculateH2OParameters)
            }

            // Mettre à jour la composition atmosphérique avec CO2 et CH4
            if (typeof window !== 'undefined' && window.atmosphericComposition) {
                window.atmosphericComposition.CO2 = plotData.co2_ppm * 1e-6;
                window.atmosphericComposition.CH4 = plotData.ch4_ppm * 1e-6;
            }

            // Calculer le forcing CH4
            const forcing_CH4 = (window.UI_STATE.methaneEnabled && plotData.ch4_ppm > 0 && window.CLIMATE && window.CLIMATE.calculateCH4Forcing)
                ? window.CLIMATE.calculateCH4Forcing(plotData.ch4_ppm * 1e-6)
                : 0;

            const forcing_Albedo = (window.CLIMATE && window.CLIMATE.calculateAlbedoForcing && albedo !== null)
                ? window.CLIMATE.calculateAlbedoForcing(albedo)
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
            window.PLOT.updatePlot(plotData);
            _drawFluxAndUnpause(plotData);
            document.getElementById('status').textContent = 'Prêt';
            enableButtons();
        };

        if (result instanceof Promise) {
            result.then(processResult);
        } else {
            processResult(result);
        }
    }, 100);
}

function setIceberg() {
    const SYNC_STATE = window.SYNC_STATE;
    if (SYNC_STATE.calculationInProgress) return; // Bloquer si calcul en cours
    // Forcer à 0 ppm
    currentState = 0;
    plotData.co2_ppm = 0;
    incrementTimeline(); // +100 ans
    disableButtons(); // Désactiver les boutons
    updateCO2Level(0); // 0 ppm
}

function setPreindustrial() {
    const SYNC_STATE = window.SYNC_STATE;
    if (SYNC_STATE.calculationInProgress) return; // Bloquer si calcul en cours
    incrementTimeline(); // +100 ans
    disableButtons(); // Désactiver les boutons
    updateCO2Level(1); // 280 ppm
}

function setCurrent() {
    const SYNC_STATE = window.SYNC_STATE;
    if (SYNC_STATE.calculationInProgress) return; // Bloquer si calcul en cours
    incrementTimeline(); // +100 ans
    disableButtons(); // Désactiver les boutons
    updateCO2Level(2); // 420 ppm
}

// Fonction pour ajouter du CO2 via une comète/météorite de glace
function addCometCO2() {
    const SYNC_STATE = window.SYNC_STATE;
    if (SYNC_STATE.calculationInProgress) return; // Bloquer si calcul en cours

    const COMET_CO2_ADDITION = 0.1; // +0.1 ppm par comète
    const COMET_H2O_ADDITION = 0.1; // +0.1% H2O par comète
    const current_ppm = plotData.co2_ppm;
    const new_ppm = current_ppm + COMET_CO2_ADDITION;
    const new_fraction = new_ppm * 1e-6;

    // Activer H2O si ce n'est pas déjà fait
    if (!window.UI_STATE.waterVaporEnabled) {
        window.UI_STATE.waterVaporEnabled = true;
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
        window.RUNTIME_STATE.volcanoH2OBonus = volcanoH2OBonus;
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
    const SYNC_STATE = window.SYNC_STATE;
    if (SYNC_STATE.calculationInProgress) return; // Bloquer si calcul en cours
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
    const SYNC_STATE = window.SYNC_STATE;
    const YEARS_PER_FRAME = window.YEARS_PER_FRAME;
    if (SYNC_STATE.calculationInProgress) return; // Bloquer si calcul en cours

    // ⚠️ MODIFICATION POUR GAMEPLAY : Un volcan ajoute une quantité de CO2 selon l'époque géologique
    // Au début de la Terre (Hadéen/Archéen), les volcans étaient beaucoup plus gros et nombreux
    // Calculer l'époque actuelle selon le temps écoulé
    const currentYears = window.timelineFrame * YEARS_PER_FRAME;
    const era = window.GEOLOGY.getGeologicalEra(currentYears);

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
        window.RUNTIME_STATE.volcanoH2OBonus = volcanoH2OBonus;
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
    if (typeof window !== 'undefined' && window.RUNTIME_STATE.calculationTimeouts) {
        window.RUNTIME_STATE.calculationTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        window.RUNTIME_STATE.calculationTimeouts = [];
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
    const DATA = window.DATA;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const IO_LISTENER = window.IO_LISTENER;
    const LOGOS = window.LOGOS;
    const CONST = window.CONST;
    const logoEDS = '📛'; // EDS (effet de serre)
    const logoCO2 = (typeof window !== 'undefined' && LOGOS && LOGOS.CO2) ? LOGOS.CO2 : '🏭';
    const logoH2O = (typeof window !== 'undefined' && LOGOS && LOGOS.H2O) ? LOGOS.H2O : '💧';
    const logoCH4 = (typeof window !== 'undefined' && LOGOS && LOGOS.CH4) ? LOGOS.CH4 : '🐄';
    
    // H2O : vapeur (window) + météorites depuis TIMELINE (DATA['📜'])
    const h2o_percent = (typeof window !== 'undefined' && window.RUNTIME_STATE.h2oVaporPercent !== undefined) ? window.RUNTIME_STATE.h2oVaporPercent : 0;
    const h2o_meteorites = (DATA['📜']['🔺⚖️💧☄️'] * DATA['📜']['📿☄️'] / CONFIG_COMPUTE.earthTotalWaterMassKg) * 100;
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

    // Le flag anim vit dans DATA['🔘']['🔘🎞'] ; ici on ne garde que l'annulation locale
    window.cancelCalculation = false;

    const timeoutId = setTimeout(() => {
        if (window.cancelCalculation) {
            return;
        }
        const _sv2 = document.getElementById('spectral-visualization');
        if (_sv2) _sv2._lastDrawnBins = 0;
        const ch4_ppm = plotData.ch4_ppm || 0;
        const ch4_fraction = ch4_ppm * 1e-6;
        const result = window.RADIATIVE.simulateRadiativeTransfer(co2_fraction, {
            CH4_fraction: ch4_fraction
        });
        currentCalculationPromise = result;

        const processResult = (data) => {
            const logo = (typeof window !== 'undefined' && LOGOS && LOGOS.CO2) ? LOGOS.CO2 : '🏭';
            // Vérifier si le calcul a été annulé
            if (window.cancelCalculation) {
                return;
            }
            if (data) IO_LISTENER.emit('compute:done', { DATA: DATA, result: data });

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
            const temp_eff_0 = (window.CLIMATE && window.CLIMATE.getEffectiveTemperatureNoGreenhouse)
                ? window.CLIMATE.getEffectiveTemperatureNoGreenhouse()
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
            const forcing_CO2 = (window.CLIMATE && window.CLIMATE.calculateCO2Forcing)
                ? window.CLIMATE.calculateCO2Forcing(plotData.co2_ppm * 1e-6)
                : 0;

            // Calculer le forcing H2O avec la nouvelle fonction calculateH2OParameters
            let forcing_H2O = 0;
            let h2o_vapor_percent = 0;
            if (window.UI_STATE.waterVaporEnabled) {
                // Récupérer l'eau de base de l'époque
                h2o_vapor_percent = (typeof window.RUNTIME_STATE.h2oVaporPercent !== 'undefined') ? window.RUNTIME_STATE.h2oVaporPercent : 0;

                // Ajouter l'eau totale des météorites
                const h2o_from_meteorites = (DATA['📜']['🔺⚖️💧☄️'] * DATA['📜']['📿☄️'] / CONFIG_COMPUTE.earthTotalWaterMassKg) * 100;
                const h2o_total_percent = h2o_vapor_percent + h2o_from_meteorites;

                // Calculer la répartition vapeur/glace selon la température
                const h2o_params = window.H2O.calculateH2OParameters(temp_surface, h2o_total_percent, cloud_coverage);
                forcing_H2O = h2o_params.greenhouse_forcing;

                // 🔒 TOUJOURS mettre à jour h2oIceFractionFromCalculation pour l'affichage
                // (déjà fait dans calculateH2OParameters, mais on force la mise à jour pour être sûr)
                if (typeof window !== 'undefined') {
                    window.RUNTIME_STATE.h2oIceFractionFromCalculation = h2o_params.ice_fraction || 0;
                }

                // Mettre à jour la composition atmosphérique (H2O est déjà mis à jour dans calculateH2OParameters)
            }

            // Mettre à jour la composition atmosphérique avec CO2 et CH4
            if (typeof window !== 'undefined' && window.atmosphericComposition) {
                window.atmosphericComposition.CO2 = plotData.co2_ppm * 1e-6;
                window.atmosphericComposition.CH4 = plotData.ch4_ppm * 1e-6;
            }

            // Calculer le forcing CH4
            const forcing_CH4 = (window.UI_STATE.methaneEnabled && plotData.ch4_ppm > 0 && window.CLIMATE && window.CLIMATE.calculateCH4Forcing)
                ? window.CLIMATE.calculateCH4Forcing(plotData.ch4_ppm * 1e-6)
                : 0;

            const forcing_Albedo = (window.CLIMATE && window.CLIMATE.calculateAlbedoForcing && albedo !== null)
                ? window.CLIMATE.calculateAlbedoForcing(albedo)
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
            window.PLOT.updatePlot(plotData);
            _drawFluxAndUnpause(plotData);
            document.getElementById('status').textContent = 'Prêt';
            enableButtons();
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
    const DATA = window.DATA;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const LOGOS = window.LOGOS;
    const logoEDS = '📛'; // EDS (effet de serre)
    const logoCO2 = (typeof window !== 'undefined' && LOGOS && LOGOS.CO2) ? LOGOS.CO2 : '🏭';
    const logoH2O = (typeof window !== 'undefined' && LOGOS && LOGOS.H2O) ? LOGOS.H2O : '💧';
    const logoCH4 = (typeof window !== 'undefined' && LOGOS && LOGOS.CH4) ? LOGOS.CH4 : '🐄';
    
    // Récupérer les valeurs pour le log
    const co2_ppm = (data && data.co2_ppm !== undefined) ? data.co2_ppm : 0;
    const h2o_percent = (typeof window !== 'undefined' && window.RUNTIME_STATE.h2oVaporPercent !== undefined) ? window.RUNTIME_STATE.h2oVaporPercent : 0;
    const h2o_meteorites = (DATA['📜']['🔺⚖️💧☄️'] * DATA['📜']['📿☄️'] / CONFIG_COMPUTE.earthTotalWaterMassKg) * 100;
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
        } else if (typeof window.UI_STATE.waterVaporEnabled !== 'undefined') {
            // Si pas de données, afficher selon l'état H2O
            h2oStatusElement.textContent = window.UI_STATE.waterVaporEnabled ? '-- %' : '0 %';
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
        if (typeof window !== 'undefined' && window.RUNTIME_STATE.currentEpochName) {
            const currentEpoch = window.GEOLOGY.getGeologicalPeriodByName(window.RUNTIME_STATE.currentEpochName);
            if (currentEpoch) {
                epochName = currentEpoch.name || window.RUNTIME_STATE.currentEpochName;
                // Formater la date depuis startYears ou ▶ (avant présent = afficher avec -)
                const years = currentEpoch.startYears ?? currentEpoch['▶'];
                if (years != null && Number.isFinite(years)) {
                    const yearsForDisplay = years > 0 ? -years : years;
                    epochDate = formatYears(yearsForDisplay);
                } else if (window.configOrganigramme && window.configOrganigramme.timeline) {
                    const timelineEpoch = window.configOrganigramme.timeline.find(item =>
                        item.type === 'epoch' && (item.id === window.RUNTIME_STATE.currentEpochName || item.name === window.RUNTIME_STATE.currentEpochName)
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

            if (window.RUNTIME_STATE.currentEpochName) {
                const currentEpoch = window.GEOLOGY.getGeologicalPeriodByName(window.RUNTIME_STATE.currentEpochName);
                if (currentEpoch) {
                    if (currentEpoch['⚖️🫧'] !== undefined) total_mass_log = currentEpoch['⚖️🫧'];
                    if (currentEpoch.gravity !== undefined) gravity_log = currentEpoch.gravity;
                    // Calculer molar_mass_air depuis les composants si non défini
                    M_avg_log = window.ATM.calculateMolarMassAir(currentEpoch);
                }
            }

            if (M_avg_log === undefined) {
                if (total_mass_log > 2.5e19) M_avg_log = 0.044;
                else M_avg_log = 0.029;
            }

            const T0_log = data.temp_surface || 288;

            const props = window.ATM.calculateAtmosphereProperties(total_mass_log, T0_log, M_avg_log, gravity_log);

            const tropo_m = window.ATM.calculateTropopauseHeight();
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
        if (typeof window !== 'undefined' && window.RUNTIME_STATE.currentEpochName) {
            const currentEpoch = window.GEOLOGY.getGeologicalPeriodByName(window.RUNTIME_STATE.currentEpochName);
            if (currentEpoch) {
                const cloud_cov = data.cloud_coverage !== undefined ? Math.round(data.cloud_coverage * 100) : 0;
                const magma_cov = Math.round((currentEpoch.magma_coverage || 0) * 100);
                const ocean_cov = Math.round((currentEpoch.ocean_coverage || 0) * 100);
                const forest_cov = Math.round((currentEpoch.forest_coverage || 0) * 100);
                const desert_cov = Math.round((currentEpoch.desert_coverage || 0) * 100);

                // Calculer la couverture de glace (similaire à organigramme.js)
                // Calculer la couverture de glace (incluant la glace additionnelle des météorites)
                let ice_cov = 0;
                const noAtmosphere =
                    currentEpoch.total_atmosphere_mass_kg === 0 ||
                    currentEpoch.total_atmosphere_mass_kg === undefined;
                const h2o_enabled = (typeof window !== 'undefined' && window.UI_STATE.waterVaporEnabled !== undefined)
                    ? window.UI_STATE.waterVaporEnabled
                    : (currentEpoch.h2o_enabled !== false);

                // Récupérer la glace calculée depuis calculateWaterPartition (si disponible)
                let ice_coverage = 0;

                // Sans atmosphère : même source que H2O partition (💧.🍰💧🧊), pas RUNTIME.h2oIceFractionFromCalculation (fraction climat pleine sphère).
                if (noAtmosphere) {
                    ice_coverage = Math.min(1, Math.max(0, DATA['💧']['🍰💧🧊']));
                } else if (typeof window !== 'undefined' && window.RUNTIME_STATE.h2oIceFractionFromCalculation !== undefined) {
                    ice_coverage = Math.min(1, Math.max(0, window.RUNTIME_STATE.h2oIceFractionFromCalculation));
                }
                // Recalculer avec calculateWaterPartition si pas de valeur disponible
                else if (data.temp_surface !== undefined) {
                    // 🔒 CORRECTION : calculateWaterPartition() lit directement depuis DATA, pas besoin de calculer h2o_total_percent
                    const h2o_total_fraction = DATA['⚖️']['⚖️🫧'] > 0 ? (DATA['⚖️']['⚖️💧'] / DATA['⚖️']['⚖️🫧']) : 0;
                    if (h2o_total_fraction > 0) {
                        // 🔒 CORRECTION : calculateWaterPartition() n'a pas de paramètres, elle lit depuis DATA
                        // Mettre à jour DATA['🧮']['🧮🌡️'] avant d'appeler calculateWaterPartition() (source unique, pas de clé 🌡️ redondante)
                        DATA['🧮']['🧮🌡️'] = data.temp_surface;
                        window.H2O.calculateWaterPartition();
                        const waterPartition = {
                            vapor_fraction: DATA['💧']['🍰🫧💧'],
                            ice_fraction: DATA['💧']['🍰💧🧊'],
                            liquid_fraction: DATA['💧']['🍰💧🌊']
                        };
                        ice_coverage = waterPartition.ice_fraction || 0;
                        window.RUNTIME_STATE.h2oIceFractionFromCalculation = ice_coverage;
                    } else {
                        // Même sans eau, appeler calculateWaterPartition pour obtenir 0 partout
                        // 🔒 CORRECTION : calculateWaterPartition() n'a pas de paramètres, elle lit depuis DATA
                        // Mettre à jour DATA['🧮']['🧮🌡️'] avant d'appeler calculateWaterPartition() (source unique)
                        DATA['🧮']['🧮🌡️'] = data.temp_surface;
                        window.H2O.calculateWaterPartition();
                        const waterPartition = {
                            vapor_fraction: DATA['💧']['🍰🫧💧'],
                            ice_fraction: DATA['💧']['🍰💧🧊'],
                            liquid_fraction: DATA['💧']['🍰💧🌊']
                        };
                        ice_coverage = waterPartition.ice_fraction || 0;
                        window.RUNTIME_STATE.h2oIceFractionFromCalculation = ice_coverage;

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

                // Défaut albedo logos (ordre fixe, synchrone) ; fusion avec LOGOS une seule fois
                const ALBEDO_LOGO_DEFAULT = { CLOUD: '⛅', VOLCANO: '🌋', OCEAN: '🌊', FOREST: '🌳', DESERT: 'fonts/pics/desert.png', ICE: '🧊' };
                const logosForAlbedo = Object.assign({}, ALBEDO_LOGO_DEFAULT, LOGOS);
                albedoComponents = [
                    { emoji: logosForAlbedo.CLOUD, coverage: cloud_cov, albedo: cloud_alb },
                    { emoji: logosForAlbedo.VOLCANO, coverage: magma_cov, albedo: magma_alb },
                    { emoji: logosForAlbedo.OCEAN, coverage: ocean_cov, albedo: ocean_alb },
                    { emoji: logosForAlbedo.FOREST, coverage: forest_cov, albedo: forest_alb },
                    { emoji: logosForAlbedo.DESERT, coverage: desert_cov, albedo: desert_alb },
                    { emoji: logosForAlbedo.ICE, coverage: ice_cov, albedo: ice_alb }
                ];
            }
        }
    }
}

function updateLegend(data) {
    const CONST = window.CONST;
    // Ajouter les légendes pour les courbes d'équilibre (corps noir pointillé et courbe réelle pleine)
    const equilibreCurvesContainer = document.getElementById('legend-equilibre-curves');
    const T_surface = (data && data.temp_surface !== undefined) ? data.temp_surface : (data && data.current && data.current.T0 !== undefined) ? data.current.T0 : (data && data.temp_surface_c !== undefined) ? data.temp_surface_c + CONST.KELVIN_TO_CELSIUS : null;
    if (equilibreCurvesContainer && data && T_surface != null) {
        equilibreCurvesContainer.innerHTML = '';

        const T_eff_legend = (data.current && data.current.effective_temperature != null && Number.isFinite(data.current.effective_temperature))
            ? data.current.effective_temperature
            : T_surface;
        const tempSurfaceC = T_surface - CONST.KELVIN_TO_CELSIUS;
        const dynamicColor = window.PLOT.tempSurfaceToColor(tempSurfaceC);

        const patterns = [
            { name: 'dot', label: "Corps noir au sol", temperatureK: T_surface },
            { name: 'dash', label: "Corps noir sortie atmosphère", temperatureK: T_eff_legend },
            { name: 'solid', label: "Rayonnement réel vers l'espace", temperatureK: T_surface }
        ];

        patterns.forEach((patternInfo) => {
            const item = document.createElement('div');
            item.className = 'legend-equilibre-item';

            const dashArray = typeof window.getDashArray === 'function'
                ? window.getDashArray(patternInfo.name)
                : (patternInfo.name === 'dot' ? '1,3' : patternInfo.name === 'dash' ? '6,4' : 'none');
            const dashAttr = dashArray !== 'none' ? `stroke-dasharray="${dashArray}"` : '';
            const patternSVG = `<svg width="50" height="5" aria-hidden="true">
                <line x1="2" y1="2.5" x2="48" y2="2.5" stroke="${dynamicColor}" stroke-width="2" ${dashAttr}/>
            </svg>`;

            const lineWrap = document.createElement('div');
            lineWrap.className = 'legend-equilibre-line';
            lineWrap.innerHTML = patternSVG;
            const tempAbove = document.createElement('span');
            tempAbove.className = 'legend-equilibre-temp';
            tempAbove.style.color = dynamicColor;
            tempAbove.textContent = `${(patternInfo.temperatureK - CONST.KELVIN_TO_CELSIUS).toFixed(1)}°C`;
            lineWrap.appendChild(tempAbove);

            const labelSpan = document.createElement('span');
            labelSpan.className = 'legend-text';
            labelSpan.style.color = dynamicColor;
            labelSpan.textContent = patternInfo.label;

            item.appendChild(lineWrap);
            item.appendChild(labelSpan);
            equilibreCurvesContainer.appendChild(item);
        });

        // 🔒 Appliquer la couleur dynamique à tous les textes de la section legend-equilibre
        const legendEquilibre = document.querySelector('.legend-equilibre');
        if (legendEquilibre) {
            // Appliquer la couleur aux textes statiques (hors des éléments déjà colorés)
            const staticTexts = legendEquilibre.querySelectorAll('br, span:not(.legend-equilibre-item *)');
            staticTexts.forEach(el => {
                if (!el.closest('.legend-equilibre-item')) {
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

/**
 * TIMELINE (name / id) vs terre.epoch[].epochName : ex. Boule de neige / emoji neige sans entrée dédiée dans configOrganigramme.
 * Sans alias, setEpoch ne recrée pas #cell-terre (Three.js reste sur l'époque précédente).
 */
function resolveOrganigramTerreEpochName(epochDisplayName, epochEmojiId) {
    var ORGANIGRAM_TERRE_EPOCH_ALIAS = {
        'Boule de neige': 'Protérozoïque',
        '\u26c4': 'Protérozoïque'
    };
    switch (true) {
        case epochDisplayName in ORGANIGRAM_TERRE_EPOCH_ALIAS:
            return ORGANIGRAM_TERRE_EPOCH_ALIAS[epochDisplayName];
        case epochEmojiId in ORGANIGRAM_TERRE_EPOCH_ALIAS:
            return ORGANIGRAM_TERRE_EPOCH_ALIAS[epochEmojiId];
        default:
            return epochDisplayName;
    }
}

// Applique le bary au graphique (visu uniquement) : log + recrée cellule terre + noyau. Appelé après compute:done via IO_LISTENER.
function applyBaryToGraphiqueOnly() {
    const DATA = window.DATA;
    const TIMELINE = window.TIMELINE;
    const IO_LISTENER = window.IO_LISTENER;
    const FUNCS_ORGANIGRAMME = window.ORG;
    const epochName = window.RUNTIME_STATE.currentEpochName;
    const bary = DATA['📜']['bary'] || 0;
    const effectiveNodes = window.configOrganigramme.getEffectiveNodesConfig(epochName, bary);
    const terreNode = effectiveNodes.find(n => n.id === 'terre');
    const noyauNode = effectiveNodes.find(n => n.id === 'noyau');
    if (!terreNode || !terreNode.epoch || !Array.isArray(terreNode.epoch)) {
        console.warn('❌ [applyBaryToGraphiqueOnly][main.js] terreNode/epoch manquant, skip');
        return;
    }
    if (!noyauNode || !noyauNode.radiation || !Array.isArray(noyauNode.radiation)) {
        console.warn('❌ [applyBaryToGraphiqueOnly][main.js] noyauNode/radiation manquant, skip');
        return;
    }
    var terreLookup = resolveOrganigramTerreEpochName(epochName, DATA['📜']['🗿']);
    const terreEpochEntry = terreNode.epoch.find(e => e.epochName === terreLookup) || terreNode.epoch[terreNode.epoch.length - 1];
    const noyauRadEntry = noyauNode.radiation.find(r => r.epochName === terreLookup) || noyauNode.radiation[noyauNode.radiation.length - 1];
    if (!terreEpochEntry) {
        console.warn('❌ [applyBaryToGraphiqueOnly][main.js] terreEpochEntry introuvable, skip epoch=' + epochName);
        return;
    }
    if (window.DEBUG_SYNC_PANELS === true) {
        console.log('[DBG applyBaryToGraphiqueOnly] bary=' + bary + ' r=' + terreEpochEntry.radius + ' exobase=' + terreEpochEntry.radiusExobase + ' noyau.maxR=' + (noyauRadEntry && noyauRadEntry.maxRadius));
    }
    const epochConfig = terreEpochEntry;
    const oldCell = document.getElementById('cell-terre');
    const parent = oldCell.parentElement;
    const canvas = oldCell.querySelector('canvas');
    if (canvas && canvas._threeJSData && canvas._threeJSData.sphere) window.savedPlanetRotationY = canvas._threeJSData.sphere.rotation.y;
    let logoPath;
    if (epochConfig.planetEffect) {
        logoPath = window.getPlanetTexturePathFromEpoch(TIMELINE[DATA['📜']['👉']]['▶'], window.infoTimeMa);
        if (logoPath === window._lastPlanetTexturePath) {
            // Même texture déjà chargée (setEpoch vient de créer la cellule) → pas de recréation
            FUNCS_ORGANIGRAMME.recreateNoyauRadiation();
            FUNCS_ORGANIGRAMME.recreateTerreRadiation();
            FUNCS_ORGANIGRAMME.generateArrows();
            document.getElementById('cell-albedo').style.display = '';
            return;
        }
        window._lastPlanetTexturePath = logoPath;
    } else {
        logoPath = interpretConfigValue(epochConfig.logo);
    }
    let lightDistance = epochConfig.lightDistance;
    if (typeof lightDistance === 'string') lightDistance = interpretConfigValue(lightDistance);
    if (window.isIceChange && typeof lightDistance === 'number') lightDistance = Math.max(0, lightDistance - 1);
    window.currentEpochLuxSaturation = epochConfig.luxSaturation !== undefined ? epochConfig.luxSaturation : 1.0;
    window.currentEpochLightDistance = lightDistance;
    window.threeJSAnimationPaused = true;
    IO_LISTENER.emit('three:runStart');
    const newCell = FUNCS_ORGANIGRAMME.createCell(
        terreNode.x, terreNode.y, epochConfig.radius, epochConfig.fillColor, epochConfig.strokeColor,
        logoPath, terreNode.left, terreNode.right, terreNode.top, terreNode.bottom, terreNode.tooltip, terreNode.ariaLabel || null,
        terreNode.radiation, null, null, terreNode.id, terreNode.zIndex, 1, 0, epochConfig.strokeSize, terreNode.strokeStyle || 'solid',
        epochConfig.radiusExobase ?? null, null, epochConfig.planetEffect || false
    );
    if (epochConfig.planetEffect) {
        parent.insertBefore(newCell, oldCell);
        const newCanvas = newCell.querySelector('canvas');
        var _onThreeReady = function (payload) {
            if (payload && payload.canvas === newCanvas) {
                IO_LISTENER.off('three:ready', _onThreeReady);
                if (oldCell.parentElement) oldCell.remove();
            }
        };
        IO_LISTENER.on('three:ready', _onThreeReady, 'main.js:applyBaryOnly');
        setTimeout(function () {
            IO_LISTENER.off('three:ready', _onThreeReady);
            if (oldCell.parentElement) oldCell.remove();
        }, 3000);
    } else {
        oldCell.remove();
        parent.appendChild(newCell);
    }
    newCell.querySelectorAll('.planet-texture[data-planet-texture="true"]').forEach(t => t.classList.add('paused'));
    FUNCS_ORGANIGRAMME.recreateNoyauRadiation();
    FUNCS_ORGANIGRAMME.recreateTerreRadiation();
    FUNCS_ORGANIGRAMME.generateArrows();
    document.getElementById('cell-albedo').style.display = '';
}

// Fonction pour activer/désactiver la vapeur d'eau
// Fonction pour appliquer les conditions initiales d'une époque géologique
function setEpoch(epochName, options) {
    const DATA = window.DATA;
    const TIMELINE = window.TIMELINE;
    const SYNC_STATE = window.SYNC_STATE;
    const IO_LISTENER = window.IO_LISTENER;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const FUNCS_ORGANIGRAMME = window.ORG;
    // Étape bary graphique après compute:done (IO_LISTENER) — applique bary + log 🎨 sans changer d'époque
    if (options && options.applyBaryOnly) {
        applyBaryToGraphiqueOnly();
        return;
    }
    // Iframe scie renvoie le bary (message sync:state) → bary:changed ; ne pas refaire un setEpoch complet ni relancer un calcul.
    if (options && options.keepTimeMa === true) {
        applyBaryToGraphiqueOnly();
        return;
    }
    // data-epoch sur le DOM = id (emoji) ; résoudre tout de suite pour détecter "déjà sur cette époque"
    // Map name→id inversée depuis CHARS_DESC (source de vérité) + surcharges alias
    const _cd = window.CHARS_DESC || {};
    const epochNameToEmojiForButton = Object.entries(_cd).reduce(function(m, e) { m[e[1]] = e[0]; return m; }, {
        'Hyperthermie éocène': '🐊', 'Prélude glaciaire': 'hysteresis 2', 'EOT (33,9 Ma)': '🏔'
    });
    const epochIdForButton = epochNameToEmojiForButton[epochName] || epochName;
    console.log('[DBG setEpoch] appelé avec=' + epochName + ' (id=' + epochIdForButton + ') DATA[🗿]=' + (DATA['📜'] && DATA['📜']['🗿']) + ' 📿💫=' + (DATA['📜'] && DATA['📜']['📿💫']) + ' currentEpochName=' + window.RUNTIME_STATE.currentEpochName);
    if (window._logStep) window._logStep('[1] config ' + epochName);
    else console.log('[1] config', epochName);
    {
        const flux = document.getElementById('flux-diagram');
        const hideArrows = flux && flux.classList.contains('hide-organigram-arrows');
        const hideObs = flux && flux.classList.contains('hide-organigram-observation-metrics');
        const corpsNoir = epochName === 'Corps Noir';
        console.log(
            '[visu pictos] Pour afficher pictos et mesures : retirer sur #flux-diagram hide-organigram-arrows (DETAILS ON, bouton ⚗) et hide-organigram-observation-metrics (OBSERVATIONS ON, bouton 🛰).',
            'Etat courant : hide-organigram-arrows=' + hideArrows + ', hide-organigram-observation-metrics=' + hideObs + '.',
            'Graphe [ ] / EDS / Terre : .organigram-picto-inactived seulement si Corps Noir (pas hide-*). Picto Géométrie organigramme : gris si hide-organigram-observation-metrics (CSS). Corps Noir=' + corpsNoir + '.',
            'Masquage visibility:hidden des cellules #cell-co2, #cell-methane, #cell-h2o : règles CSS #flux-diagram.hide-organigram-arrows.',
        );
    }
    // 🔒 Cacher le tooltip immédiatement lors du changement d'époque
    // Empêche le tooltip de rester affiché après le changement
    if (typeof window !== 'undefined' && typeof window.hideTooltip === 'function') {
        window.hideTooltip();
    }
    
    // 🔄 Remettre infoTimeMa à 0 lors du changement d'époque
    // IMPORTANT: Doit être fait AVANT l'interprétation du logo pour que ticTime = 0
    if (typeof window !== 'undefined') {
        window.infoTimeMa = 0;
        window._lastPlanetTexturePath = null;
        // Nouvelle époque : reset compteurs boutons et dernier bouton cliqué
        DATA['📜']['📿☄️'] = 0;
        DATA['📜']['📿💫'] = 0;
        DATA['📜']['bary'] = 0;
        DATA['📜']['🔘🕰'] = '';
    }
    
    if (window._logStep) window._logStep('[2] reset epoch (infoTimeMa→0, tics→0)');
    else console.log('[2] reset epoch');
    if (window._logStepEnd) window._logStepEnd();

    if (SYNC_STATE.calculationInProgress) {
        cancelCurrentCalculation();
        enableButtons();
    }

    // 🔒 Si setEpoch est appelé depuis un bouton époque (pas depuis un événement),
    // s'assurer que maximiseData est false pour utiliser la config de l'époque
    // (maximiseData ne sera true que si un événement l'a défini avant d'appeler setEpoch)
    const isEventCall = (window.UI_STATE.maximiseData === true);
    if (!isEventCall) {
        // Réinitialiser maximiseData si ce n'est pas un appel depuis un événement
        if (typeof window !== 'undefined') {
            window.UI_STATE.maximiseData = false;
        }
    }

    // Gérer la sélection unique (boutons radio)
    const allEpochButtons = document.querySelectorAll('.epoch-btn, .epoch-text');
    allEpochButtons.forEach(btn => {
        btn.classList.remove('selected');
    });
    const clickedButton = document.querySelector(`.epoch-btn[data-epoch="${epochIdForButton}"], .epoch-text[data-epoch="${epochIdForButton}"]`);
    if (clickedButton) {
        clickedButton.classList.add('selected');
    }

    // Récupérer les conditions de l'époque depuis geology.js (crash-first: si absent, l'erreur doit être visible)
    const epoch = window.GEOLOGY.getGeologicalPeriodByName(epochName) || window.GEOLOGY.getGeologicalPeriodByName(epochIdForButton);

    // 🔒 Stocker l'ancienne époque AVANT de la changer
    const previousEpoch = window.RUNTIME_STATE.currentEpochName;

    // 🔒 INITIALISER DATA['📜']['👉'] et DATA['📜']['🗿'] pour que calculations_albedo.js puisse accéder à l'époque
    // DATA existe toujours (dico.js, ordre synchrone).
    // Nom UI (RUNTIME_STATE.currentEpochName) : syncEpochFromTimelinePointer après 👉 — pas epochName brut (ex. bouton → id ⚫ vs « Corps Noir » en config terre.epoch).
    if (typeof TIMELINE !== 'undefined') {
        if (!DATA['📜']) {
            DATA['📜'] = {};
        }
        // Trouver l'index de l'époque par son emoji (id) ou son nom
        // Map name→id depuis CHARS_DESC (source de vérité) + alias
        const _cdInv = Object.entries(window.CHARS_DESC || {}).reduce(function(m, e) { m[e[1]] = e[0]; return m; }, {
            'Hyperthermie éocène': '🐊', 'Prélude glaciaire': 'hysteresis 2', 'EOT (33,9 Ma)': '🏔'
        });
        // epoch.id devrait être défini depuis getGeologicalPeriodByName (timeline transformée)
        // Sinon, utiliser le mapping ou le nom directement
        const epochId = epoch.id || _cdInv[epochName] || epochName;
        const epochIndex = TIMELINE.findIndex(item => {
            if (item['📅']) {
                return item['📅'] === epochId;
            }
            // Si la timeline a été transformée, chercher par id ou name
            return (item.id === epochId || item.name === epochName);
        });
        
        if (epochIndex >= 0) {
            DATA['📜']['👉'] = epochIndex;
            DATA['📜']['🗿'] = epochId;
            // Initialiser aussi DATA['📅'] avec l'objet epoch complet
            DATA['📅'] = TIMELINE[epochIndex];
            if (typeof window.syncEpochFromTimelinePointer !== 'function') {
                throw new Error('[setEpoch] syncEpochFromTimelinePointer manquant (charger organigramme.js avant main.js)');
            }
            window.syncEpochFromTimelinePointer();
        } else {
            throw new Error(`[setEpoch] Époque ${epochName} (${epochId}) non trouvée dans TIMELINE`);
        }
    } else {
        throw new Error('[setEpoch] TIMELINE indéfini');
    }
    
    // Source unique de précision UI : CONFIG_COMPUTE.convergencePrecisionK
    if (typeof epoch.precision === 'number' && epoch.precision > 0) {
        CONFIG_COMPUTE.convergencePrecisionK = epoch.precision;
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
        if (!found) {
            console.warn(`${logoEpoch} 🛠 ⚠️ [setEpoch@main.js] 🎚=${CONFIG_COMPUTE.convergencePrecisionK}° => Aucun bouton radio`);
        }
    }

    // Anticiper la couleur avec 🌡️🧮 dès le clic sur l'époque (AVANT les calculs)
    var T0_anticipated = epoch['🌡️🧮'];
    var tempC_anticipated = T0_anticipated - CONST.KELVIN_TO_CELSIUS;
    var color_anticipated = window.PLOT.tempSurfaceToColor(tempC_anticipated);
    window.updateBlackBodyColor(color_anticipated);

    var legendEquilibre = document.querySelector('.legend-equilibre');
    if (legendEquilibre) legendEquilibre.style.color = color_anticipated;

    var currentPlotData = window.plotData || plotData;
    if (currentPlotData) {
        var tempPlotData = Object.assign({}, currentPlotData, {
            temp_surface: T0_anticipated,
            temp_surface_c: tempC_anticipated
        });
        window.PLOT.updatePlot(tempPlotData);
        window.updateLegend(tempPlotData);
    }

    // 🔒 RÉINITIALISER l'eau totale des météorites lors du changement d'époque
    // (utiliser uniquement les valeurs de la config de l'époque, ne pas garder le surplus de l'époque précédente)
    if (epochName !== previousEpoch && typeof window.RUNTIME_STATE.h2oTotalFromMeteorites !== 'undefined') {
        window.RUNTIME_STATE.h2oTotalFromMeteorites = 0;
    }

    // Mettre à jour les boutons d'action selon l'époque
    if (typeof window.updateEpochActions === 'function') {
        window.updateEpochActions();
    }

    // Mettre à jour le logo de la Terre avec l'image de l'époque (bary appliqué aux data graphiques si défini)
    const bary = (DATA['📜'] && DATA['📜']['bary'] != null && Number.isFinite(DATA['📜']['bary'])) ? DATA['📜']['bary'] : 0;
    const effectiveNodes = (window.configOrganigramme.getEffectiveNodesConfig && window.configOrganigramme.getEffectiveNodesConfig(epoch.name || epochName, bary)) || window.configOrganigramme.nodes;
    const terreNode = effectiveNodes.find(n => n.id === 'terre');
    const configEpochName = epoch.name || epochName;
    const terreOrganigramKey = resolveOrganigramTerreEpochName(configEpochName, epoch.id);
    // Log graphique (visu uniquement, pas scie_) : bary + toutes les valeurs effectives
    if (window === window.top && window.configOrganigramme.baryEpochs && window.configOrganigramme.baryEpochs[configEpochName]) {
        const noyauNode = effectiveNodes.find(function (n) { return n.id === 'noyau'; });
        const terreEpochEntry = terreNode && terreNode.epoch ? terreNode.epoch.find(function (e) { return e.epochName === terreOrganigramKey; }) : null;
        const noyauRadEntry = noyauNode && Array.isArray(noyauNode.radiation) ? noyauNode.radiation.find(function (r) { return r.epochName === terreOrganigramKey; }) : null;
        const graphiqueValues = {
            bary: bary,
            terre: terreEpochEntry ? { radius: terreEpochEntry.radius, radiusExobase: terreEpochEntry.radiusExobase, fillColor: terreEpochEntry.fillColor, strokeColor: terreEpochEntry.strokeColor, strokeSize: terreEpochEntry.strokeSize, planetEffect: terreEpochEntry.planetEffect } : null,
            noyau: noyauRadEntry ? { numCircles: noyauRadEntry.numCircles, maxRadius: noyauRadEntry.maxRadius, openingAngle: noyauRadEntry.openingAngle, color: noyauRadEntry.color } : null
        };
        console.groupCollapsed('🎨 Graphique (visu) — bary + valeurs effectives');
        console.log('bary', bary);
        console.log('valeurs effectives', graphiqueValues);
        console.groupEnd();
    }
    if (terreNode && terreNode.epoch && Array.isArray(terreNode.epoch)) {
        const epochConfig = terreNode.epoch.find(e => e.epochName === terreOrganigramKey);

        if (epochConfig) {
            // Recréer la cellule terre avec la configuration de l'époque
            const oldCell = document.getElementById('cell-terre');
            if (oldCell) {
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
                
                // planetEffect = texture calculée (getPlanetTexturePathFromEpoch) ; sinon logo (picto) interprété
                let logoPath;
                if (epochConfig.planetEffect && typeof window.getPlanetTexturePathFromEpoch === 'function') {
                    const idx = DATA['📜'] && DATA['📜']['👉'] != null ? DATA['📜']['👉'] : 0;
                    const tlEpoch = TIMELINE && TIMELINE[idx] ? TIMELINE[idx] : null;
                    const startYears = tlEpoch && tlEpoch['▶'] != null ? tlEpoch['▶'] : 2.5e9;
                    const infoTimeMa = typeof window.infoTimeMa === 'number' ? window.infoTimeMa : 0;
                    logoPath = window.getPlanetTexturePathFromEpoch(startYears, infoTimeMa);
                } else {
                    logoPath = interpretConfigValue(epochConfig.logo);
                }
                window._lastPlanetTexturePath = logoPath;
                
                // Si le logo contient encore {$ticTime} après interprétation, c'est une erreur
                if (typeof logoPath === 'string' && logoPath.includes('{$ticTime}')) {
                    console.warn('[setEpoch] ⚠️ WARNING - Logo contient encore {$ticTime} après interprétation:', logoPath);
                }
                
                // Interpréter lightDistance (peut contenir des expressions comme "10-{$ticTime}" ou "7-{$ticTime}/2")
                let lightDistance = epochConfig.lightDistance;
                if (typeof lightDistance === 'string' || (typeof lightDistance !== 'number' && lightDistance !== null && lightDistance !== undefined)) {
                    lightDistance = interpretConfigValue(lightDistance);
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

                const newCell = FUNCS_ORGANIGRAMME.createCell(
                    terreNode.x,
                    terreNode.y,
                    epochConfig.radius,
                    epochConfig.fillColor,
                    epochConfig.strokeColor,
                    logoPath,
                    terreNode.left,
                    terreNode.right,
                    terreNode.top,
                    terreNode.bottom,
                    terreNode.tooltip,
                    terreNode.ariaLabel || null,
                    terreNode.radiation,
                    null,
                    null,
                    terreNode.id,
                    terreNode.zIndex,
                    1, // logoScale (facteur retiré de la config terre)
                    0, // logoOffsetY
                    epochConfig.strokeSize,
                    terreNode.strokeStyle || 'solid',
                    epochConfig.radiusExobase ?? null,
                    null,
                    epochConfig.planetEffect || false
                );

                if (epochConfig.planetEffect) {
                    // 🔒 Pas de trou : nouvelle cellule insérée DERRIÈRE l'ancienne, ancienne retirée au three:ready
                    // Pause Three.js pour que l'angle ne change pas entre 2 textures ; play au compute:done (loader_panels)
                    window.threeJSAnimationPaused = true;
                    IO_LISTENER.emit('three:runStart');
                    parent.insertBefore(newCell, oldCell);
                    const newCanvas = newCell.querySelector('canvas');
                    var _swapTimeoutId = null;
                    var _onThreeReady = function (payload) {
                        if (payload && payload.canvas === newCanvas) {
                            IO_LISTENER.off('three:ready', _onThreeReady);
                            if (_swapTimeoutId !== null) clearTimeout(_swapTimeoutId);
                            if (oldCell.parentElement) oldCell.remove();
                            window.threeJSAnimationPaused = false;
                        }
                    };
                    IO_LISTENER.on('three:ready', _onThreeReady, 'main.js:setEpoch');
                    _swapTimeoutId = setTimeout(function () {
                        _swapTimeoutId = null;
                        IO_LISTENER.off('three:ready', _onThreeReady);
                        if (oldCell.parentElement) oldCell.remove();
                    }, 3000);
                } else {
                    // Pas de Three.js : swap direct sans attente
                    oldCell.remove();
                    parent.appendChild(newCell);
                }
                
                // Remettre l'animation en pause lors du changement d'époque (les calculs vont commencer)
                const planetTextures = newCell.querySelectorAll('.planet-texture[data-planet-texture="true"]');
                planetTextures.forEach(texture => {
                    texture.classList.add('paused');
                });
            }
        }
    }

    // Ne plus cacher #cell-albedo en Corps noir : le disque albedo (cercle + stroke) reste visible, couleurs par config (albedo.epoch)
    const cellAlbedo = document.getElementById('cell-albedo');
    if (cellAlbedo) {
        cellAlbedo.style.display = '';
    }

    // [3] DOM organigramme (halos, values, flèches)
    FUNCS_ORGANIGRAMME.recreateNoyauRadiation();
    FUNCS_ORGANIGRAMME.recreateTerreRadiation();
    FUNCS_ORGANIGRAMME.generateArrows();
    if (window._logStep) window._logStep('[3] DOM organigramme');
    else console.log('[3] DOM organigramme');
    if (window._logStepEnd) window._logStepEnd();

    disableButtons();

    // Réinitialiser timelineFrame à 0 pour chaque nouvelle époque
    // Les années ajoutées par les actions seront comptées depuis 0
    if (typeof window !== 'undefined' && window.timelineFrame !== undefined) {
        window.timelineFrame = 0;
    }

    // Stocker le début de l'époque pour référence (affichage de la date de début)
    currentEpochStartYears = epoch.startYears ?? epoch['▶'];

    // Mettre à jour la date de début affichée (▶ = début en années dans config, "avant présent" = afficher avec -)
    const epochStartTimeDisplay = document.getElementById('epoch-start-time');
    if (epochStartTimeDisplay) {
        const years = epoch.startYears ?? epoch['▶'];
        // Les années de début d'époque sont "avant présent" : afficher avec un - (ex. -5000 Ma)
        const yearsForDisplay = (typeof years === 'number' && years > 0) ? -years : years;
        epochStartTimeDisplay.textContent = formatYears(yearsForDisplay);
    }

    // Afficher le nom de l'époque (dans synthese_Temp divGlass)
    const epochNameDisplay = document.getElementById('epoch-name');
    if (epochNameDisplay) {
        epochNameDisplay.textContent = epoch.name;
    }

    // Réinitialiser "+0 Ma" quand on clique sur une époque
    const infoTimeDisplay = document.getElementById('info-time');
    if (infoTimeDisplay) {
        infoTimeDisplay.textContent = '+0 Ma';
    }

    // TicTime à 0 et sync vers scie pour que l’iframe ait ticTime=0
    SYNC_STATE.ticTime = 0;
    window.syncToScie({ ticTime: 0 });

    // Note: infoTimeMa a déjà été remis à 0 au début de setEpoch (avant l'interprétation du logo)
    
    // Vérifier les événements automatiques après le changement d'époque
    if (typeof checkDateEvents === 'function') {
        checkDateEvents();
    }

    updateTimeline();

    // 🔒 Mettre à jour DATA['⚖️'] (masses) AVANT updateFluxLabels pour que calculateAlbedo ait les bonnes valeurs (océan, etc.)
    if (window.COMPUTE && window.COMPUTE.getMasses) {
        window.COMPUTE.getMasses();
    }

    // Forcer la mise à jour des labels de flux (Soleil, Noyau, etc.) avec les paramètres de la nouvelle époque
    // Utiliser plotData.current si disponible (résultats du calcul), sinon plotData
    window.ORG.updateFluxLabels('ProcessFinished');

    // Appliquer les conditions initiales
    // En époque "Corps noir", tout est désactivé (température ~206.1K, pas de noyau différencié)
    const isCorpsNoir = epoch.name === 'Corps Noir';
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
        molar_mass_air = window.ATM.calculateMolarMassAir(epoch);
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
    if (window.ALBEDO && window.ALBEDO.updateLevelsConfig) {
        window.ALBEDO.updateLevelsConfig();
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
    if (typeof window.UI_STATE.waterVaporEnabled !== 'undefined') {
        // H2O peut être activé si : pas Corps noir ET il y a de l'eau (h2o_kg > 0)
        const hasWater = !isCorpsNoir && epoch.h2o_kg > 0;
        // Si l'époque a de l'eau, activer H2O par défaut (l'utilisateur peut désactiver via le bouton)
        window.UI_STATE.waterVaporEnabled = hasWater;

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

        if (window.UI_STATE.maximiseData) {
            // Prendre le max entre l'eau totale sauvegardée et la valeur par défaut de l'époque
            const savedH2O = window.UI_STATE.savedH2O;
            const h2o_total_max = Math.max(savedH2O, h2o_default);

            // Répartir : base = valeur par défaut, météorites = le reste (max 100% total)
            window.RUNTIME_STATE.h2oVaporPercent = h2o_default;
            window.RUNTIME_STATE.h2oTotalFromMeteorites = Math.max(0, Math.min(100 - h2o_default, h2o_total_max - h2o_default));


            // Réinitialiser le flag après utilisation
            window.UI_STATE.maximiseData = false;
        } else {
            // Comportement normal : utiliser les valeurs par défaut de l'époque
            window.RUNTIME_STATE.h2oVaporPercent = h2o_default;

            // 🔒 RÉINITIALISER l'eau des météorites lors du changement d'époque
            // (utiliser uniquement les valeurs de la config, ne pas garder le surplus de l'époque précédente)
            if (epochName !== previousEpoch) {
                window.RUNTIME_STATE.h2oTotalFromMeteorites = 0;
            }
        }

        window.cloudCoverage = epoch.cloud_coverage || 0; // Couverture nuageuse
    }

    // Mettre à jour l'affichage H2O
    const h2oStatusElement = document.getElementById('h2o-status-synthese');
    if (h2oStatusElement) {
        h2oStatusElement.textContent = (!isCorpsNoir && epoch.h2o_kg > 0 && window.UI_STATE.waterVaporEnabled) ? 'Activé' : 'Désactivé';
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
            // Synchroniser le bouton avec window.UI_STATE.waterVaporEnabled (état déterminé par la présence d'eau)
            if (window.UI_STATE.waterVaporEnabled) {
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
    window.UI_STATE.methaneEnabled = !isCorpsNoir && (defaultCH4_ppm_for_buttons > 0);

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

    // ⚠️ Important : ne PAS déclencher un calcul ici.
    // Le calcul est déclenché une seule fois via emit('sync:state', run:true) plus bas,
    // sinon on lance 2 runs (updateCO2LevelDirect → runComputeInParent, puis sync:state → runComputeInParent).

    // Synchroniser l'état avec l'iframe scie (epoch, anim, ticTime, bary pour graphique)
    const epochId = (DATA && DATA['📜'] && DATA['📜']['🗿']) || epoch.id || epochName;
    const ticTime = (DATA && DATA['📜'] && DATA['📜']['📿💫'] != null) ? DATA['📜']['📿💫'] : 0;
    const animEnabled = DATA['🔘']['🔘🎞'];
    const barySync = (DATA && DATA['📜'] && DATA['📜']['bary'] != null && Number.isFinite(DATA['📜']['bary'])) ? DATA['📜']['bary'] : undefined;
    if (typeof window.syncPlotContainerOrganigramHideClasses === 'function') {
        window.syncPlotContainerOrganigramHideClasses();
    }
    IO_LISTENER.emit('sync:state', { epochId: epochId, animEnabled: !!animEnabled, ticTime: ticTime, bary: barySync, run: true });
}


// Fonction pour mettre à jour le niveau H2O directement (similaire à updateCO2LevelDirect)
function updateH2OLevelDirect(h2o_total_percent) {
    const IO_LISTENER = window.IO_LISTENER;
    const logoEDS = '📛'; // EDS (effet de serre)
    const logoCO2 = (typeof window !== 'undefined' && LOGOS && LOGOS.CO2) ? LOGOS.CO2 : '🏭';
    const logoH2O = (typeof window !== 'undefined' && LOGOS && LOGOS.H2O) ? LOGOS.H2O : '💧';
    const logoCH4 = (typeof window !== 'undefined' && LOGOS && LOGOS.CH4) ? LOGOS.CH4 : '🐄';
    
    // Récupérer CO2 et CH4 depuis plotData
    const co2_ppm = (plotData && plotData.co2_ppm !== undefined) ? plotData.co2_ppm : 0;
    const ch4_ppm = (plotData && plotData.ch4_ppm !== undefined) ? plotData.ch4_ppm : 0;
    
    // Annuler tout calcul en cours avant de commencer un nouveau
    cancelCurrentCalculation();

    // Mettre à jour window.RUNTIME_STATE.h2oTotalFromMeteorites
    // h2o_total_percent = h2o_base + h2o_meteorites
    const h2o_base = (typeof window.RUNTIME_STATE.h2oVaporPercent !== 'undefined') ? window.RUNTIME_STATE.h2oVaporPercent : 0;
    const h2o_meteorites = Math.max(0, h2o_total_percent - h2o_base);
    window.RUNTIME_STATE.h2oTotalFromMeteorites = Math.min(100, h2o_meteorites); // Limiter à 100%

    // 🔒 FORCER le recalcul en réinitialisant la valeur mise en cache
    if (typeof window !== 'undefined') {
        window.RUNTIME_STATE.h2oIceFractionFromCalculation = undefined;
    }

    if (typeof window.runComputeInParent === 'function' && document.getElementById('scie-iframe')) {
        window.runComputeInParent();
        return;
    }

    document.getElementById('status').textContent = `Calcul pour ${h2o_total_percent.toFixed(1)}% H2O...`;

    window.cancelCalculation = false; // Réinitialiser le flag d'annulation

    const timeoutId = setTimeout(() => {
        // Vérifier si le calcul a été annulé avant de commencer
        if (window.cancelCalculation) {
            return;
        }

        const _sv3 = document.getElementById('spectral-visualization');
        if (_sv3) _sv3._lastDrawnBins = 0;
        const co2_ppm = plotData.co2_ppm;
        const co2_fraction = co2_ppm * 1e-6;
        const ch4_ppm = plotData.ch4_ppm;
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
        
        const result = window.RADIATIVE.simulateRadiativeTransfer(co2_fraction, {
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
            if (data) IO_LISTENER.emit('compute:done', { DATA: DATA, result: data });

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
            const temp_eff_0 = (window.CLIMATE && window.CLIMATE.getEffectiveTemperatureNoGreenhouse)
                ? window.CLIMATE.getEffectiveTemperatureNoGreenhouse()
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
            const forcing_CO2 = (window.CLIMATE && window.CLIMATE.calculateCO2Forcing)
                ? window.CLIMATE.calculateCO2Forcing(plotData.co2_ppm * 1e-6)
                : 0;

            // Calculer le forcing H2O avec la nouvelle fonction calculateH2OParameters
            let forcing_H2O = 0;
            let h2o_vapor_percent = 0;
            if (window.UI_STATE.waterVaporEnabled) {
                // Récupérer l'eau de base de l'époque
                h2o_vapor_percent = (typeof window.RUNTIME_STATE.h2oVaporPercent !== 'undefined') ? window.RUNTIME_STATE.h2oVaporPercent : 0;

                // Ajouter l'eau totale des météorites
                const h2o_from_meteorites = (DATA['📜']['🔺⚖️💧☄️'] * DATA['📜']['📿☄️'] / CONFIG_COMPUTE.earthTotalWaterMassKg) * 100;
                const h2o_total_percent_calc = h2o_vapor_percent + h2o_from_meteorites;

                // Calculer la répartition vapeur/glace selon la température
                const h2o_params = window.H2O.calculateH2OParameters(temp_surface, h2o_total_percent_calc, cloud_coverage);
                forcing_H2O = h2o_params.greenhouse_forcing;

                // 🔒 TOUJOURS mettre à jour h2oIceFractionFromCalculation pour l'albedo
                if (typeof window !== 'undefined') {
                    window.RUNTIME_STATE.h2oIceFractionFromCalculation = h2o_params.ice_fraction || 0;
                }
            }

            // Mettre à jour la composition atmosphérique avec CO2 et CH4
            if (typeof window !== 'undefined' && window.atmosphericComposition) {
                window.atmosphericComposition.CO2 = plotData.co2_ppm * 1e-6;
                window.atmosphericComposition.CH4 = plotData.ch4_ppm * 1e-6;
            }

            // Calculer le forcing CH4
            const forcing_CH4 = (window.UI_STATE.methaneEnabled && plotData.ch4_ppm > 0 && window.CLIMATE && window.CLIMATE.calculateCH4Forcing)
                ? window.CLIMATE.calculateCH4Forcing(plotData.ch4_ppm * 1e-6)
                : 0;

            const forcing_Albedo = (window.CLIMATE && window.CLIMATE.calculateAlbedoForcing && albedo !== null)
                ? window.CLIMATE.calculateAlbedoForcing(albedo)
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
            window.PLOT.updatePlot(plotData);
            
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
            window.ORG.updateFluxLabels('ProcessFinished');
            _drawFluxAndUnpause(plotData);
            document.getElementById('status').textContent = 'Prêt';
            enableButtons();
        };

        result.then(processResult).catch((error) => {
            console.error('[updateH2OLevelDirect] ❌ ERREUR lors du calcul:', error);
            enableButtons();
        });
    }, 50);

    // Ajouter ce timeout à la liste pour pouvoir l'annuler
    currentCalculationTimeouts.push(timeoutId);
}

// Exposer updateH2OLevelDirect globalement
window.updateH2OLevelDirect = updateH2OLevelDirect;

function toggleWaterVapor() {
    if (SYNC_STATE.calculationInProgress) return; // Bloquer si calcul en cours

    // Vérifier si on est en époque Corps noir (tout désactivé)
    const btnH2O = document.getElementById('btn-h2o');
    if (btnH2O && btnH2O.classList.contains('disabled')) {
        return; // Ne rien faire si désactivé
    }

    window.UI_STATE.waterVaporEnabled = !window.UI_STATE.waterVaporEnabled;

    if (btnH2O) {
        if (window.UI_STATE.waterVaporEnabled) {
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
        h2oStatusElement.textContent = window.UI_STATE.waterVaporEnabled ? '-- %' : '0 %';
    }

    const btn = document.getElementById('btn-cloud');
    if (btn) {
        if (window.UI_STATE.waterVaporEnabled) {
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
    const DATA = window.DATA;
    const CONFIG_COMPUTE = window.CONFIG_COMPUTE;
    const FUNCS_ORGANIGRAMME = window.ORG;
    if (typeof window.pdTrace === 'function') window.pdTrace('runMainInit', 'main.js', 'enter readyState=' + document.readyState);
    // Play Three.js après flux:lastDrawn (toujours play pour la planète, DATA['🔘']['🔘🎞'] = autre chose)
    window.IO_LISTENER.on('flux:lastDrawn', function () {
        window.threeJSAnimationPaused = false;
        window.updateThreePlayIndicator();
        if (typeof window.updateObservationIndicator === 'function') window.updateObservationIndicator();
        console.log('[main.js][flux:lastDrawn] Three.js play');
    }, 'main.js:threePlay');

    // Recevoir sync:state depuis l'iframe scie (bary → appliquer au graphique via configOrganigramme.getEffectiveNodesConfig)
    window.addEventListener('message', function (e) {
        if (!e.data || e.data.type !== 'sync:state' || !e.data.payload) return;
        const p = e.data.payload;
        if (!window.DATA) return;
        if (!window.DATA['📜']) window.DATA['📜'] = {};
        // NE PAS écraser DATA['📿💫'] depuis la réponse scie : le parent est seul source de vérité
        // (sinon race condition : scie envoie ticTime:0 → reset du compteur parent → "un nextEpoch en trop")
        if (p.bary !== undefined && Number.isFinite(p.bary)) {
            window.DATA['📜']['bary'] = p.bary;
            if (window.IO_LISTENER) window.IO_LISTENER.emit('bary:changed', { bary: p.bary, epochId: p.epochId });
        }
    });
    window.IO_LISTENER.on('bary:changed', function (arg) {
        // keepTimeMa:true → early-return ne réinitialise pas infoTimeMa (le bary ne change pas la position temporelle)
        if (window.RUNTIME_STATE.currentEpochName && typeof window.setEpoch === 'function') window.setEpoch(window.RUNTIME_STATE.currentEpochName, { keepTimeMa: true });
    }, 'main.js:baryGraphique');
    // Après compute:done : appliquer bary au graphique (visu) + log 🎨
    window.IO_LISTENER.on('compute:done', function () {
        if (window === window.top && window.RUNTIME_STATE.currentEpochName && typeof window.setEpoch === 'function') {
            console.log('[main.js] 🎨 bary:apply (après compute:done)');
            window.setEpoch(window.RUNTIME_STATE.currentEpochName, { applyBaryOnly: true });
        }
    }, 'main.js:baryAfterCompute');
    // 🔒 Légende des emojis (affichée une seule fois au démarrage)
    if (!window._logLegendShown) {
        window._logLegendShown = true;
    }
    
    // Attendre que le DOM soit complètement rendu avant de lancer les calculs
    // Utiliser requestAnimationFrame pour s'assurer que le navigateur a eu le temps de rendre
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // DOM : 200ms pour laisser navigateur finaliser le rendu avant init listeners FPS
                setTimeout(() => {
                window.addEventListener('fpsLevelChanged', (event) => {
                    const { fps, level } = event.detail;
                    window.fpsLevel = level;
                    
                    // Contrôler l'affichage selon le niveau FPS
                    // 🔒 Le bouton "anim" contrôle directement showDichotomySteps, on ne le modifie pas ici
                    // On contrôle seulement l'animation de la planète selon le FPS
                    const animEnabled = (DATA && DATA['🔘'] && DATA['🔘']['🔘🎞']);
                    
                    // Three.js n'est plus piloté par le FPS (rotation continue)
                    // showSpectralBackground n'est PAS contrôlé par le FPS
                    // → géré uniquement par les draw sequences (processResult / sync_panels)
                });
                
                window.fpsLevel = 'rapide';
                window.RUNTIME_STATE.showSpectralBackground = true;
                
                // Bouton ⚗ : afficher/masquer détails (flèches, textes) et boutons d'action de l'organigramme — off par défaut
                window.organigramArrowsVisible = false;
                /** Métriques / libellés verts : par défaut masqués (🛰 off) pour ne montrer que la Terre ; ON = hide-organigram-observation-metrics retirée */
                window.organigramObservationMetricsVisible = false;
                /** true = pictogramme masqué (🛰 OFF) — #cell-geometrie, #cell-reemis (EDS), #cell-albedo-btn */
                window.organigramObservationGeometriePictoHidden = true;
                window.organigramObservationEdsPictoHidden = true;
                window.organigramObservationAlbedoBtnPictoHidden = true;
                window.syncOrganigramObservationPictoHiddenFlags = function () {
                    var h = !window.organigramObservationMetricsVisible;
                    window.organigramObservationGeometriePictoHidden = h;
                    window.organigramObservationEdsPictoHidden = h;
                    window.organigramObservationAlbedoBtnPictoHidden = h;
                };
                /** Memes noms de classe que #flux-diagram (DETAILS / OBSERVATIONS) pour .plot-container-wrapper — styles spectraux organigramme.css */
                window.syncPlotContainerOrganigramHideClasses = function () {
                    var fd = document.getElementById('flux-diagram');
                    var plotWrap = document.querySelector('.plot-container-wrapper');
                    if (fd && plotWrap) {
                        plotWrap.classList.toggle('hide-organigram-arrows', fd.classList.contains('hide-organigram-arrows'));
                        plotWrap.classList.toggle('hide-organigram-observation-metrics', fd.classList.contains('hide-organigram-observation-metrics'));
                    }
                    if (typeof window.PLOT.updateSpectralBandIndicatorsGhostOnly === 'function') {
                        window.PLOT.updateSpectralBandIndicatorsGhostOnly();
                    }
                };
                window.updateObservationIndicator = function () {
                    var fluxObs = document.getElementById('flux-diagram');
                    if (!fluxObs) return;
                    var wrapObs = document.getElementById('observation-config-wrap');
                    if (!wrapObs) {
                        wrapObs = document.createElement('div');
                        wrapObs.id = 'observation-config-wrap';
                        wrapObs.className = 'organigram-buttons';
                        fluxObs.appendChild(wrapObs);
                    }
                    wrapObs.classList.add('organigram-buttons');
                    var obsTitle = wrapObs.querySelector('.organigram-config-heading');
                    if (!obsTitle) {
                        obsTitle = document.createElement('span');
                        obsTitle.className = 'organigram-config-heading organigram-unified-title';
                        wrapObs.appendChild(obsTitle);
                    }
                    obsTitle.classList.add('organigram-unified-title');
                    obsTitle.textContent = 'OBSERVATIONS';
                    var obsRow = wrapObs.querySelector('.organigram-config-row');
                    if (!obsRow) {
                        obsRow = document.createElement('div');
                        obsRow.className = 'organigram-config-row';
                        wrapObs.appendChild(obsRow);
                    }
                    var obsBtn = document.getElementById('observation-metrics-toggle');
                    if (!obsBtn) {
                        obsBtn = document.createElement('button');
                        obsBtn.id = 'observation-metrics-toggle';
                        obsBtn.type = 'button';
                        obsRow.appendChild(obsBtn);
                    }
                    obsBtn.className = 'icon-button organigram-logo' + (window.organigramObservationMetricsVisible ? ' selected' : '');
                    obsBtn.setAttribute('data-tooltip', 'On/Off données chiffrées');
                    obsBtn.removeAttribute('aria-label');
                    obsBtn.removeAttribute('title');
                    obsBtn.textContent = '🛰';
                    fluxObs.classList.toggle('hide-organigram-observation-metrics', !window.organigramObservationMetricsVisible);
                    window.syncOrganigramObservationPictoHiddenFlags();
                    window.syncPlotContainerOrganigramHideClasses();
                    if (obsBtn.dataset.boundClick !== '1') {
                        obsBtn.addEventListener('click', function () {
                            window.organigramObservationMetricsVisible = !window.organigramObservationMetricsVisible;
                            var fd = document.getElementById('flux-diagram');
                            if (fd) fd.classList.toggle('hide-organigram-observation-metrics', !window.organigramObservationMetricsVisible);
                            obsBtn.classList.toggle('selected', window.organigramObservationMetricsVisible);
                            window.syncOrganigramObservationPictoHiddenFlags();
                            window.syncPlotContainerOrganigramHideClasses();
                        });
                        obsBtn.dataset.boundClick = '1';
                    }
                };
                window.updateThreePlayIndicator = function () {
                    var flux = document.getElementById('flux-diagram');
                    if (!flux) return;
                    var wrap = document.getElementById('organigram-config-wrap');
                    if (!wrap) {
                        wrap = document.createElement('div');
                        wrap.id = 'organigram-config-wrap';
                        wrap.className = 'organigram-buttons';
                        flux.appendChild(wrap);
                    }
                    wrap.classList.add('organigram-buttons');
                    var cfgTitle = wrap.querySelector('.organigram-config-heading');
                    if (!cfgTitle) {
                        cfgTitle = document.createElement('span');
                        cfgTitle.className = 'organigram-config-heading organigram-unified-title';
                        wrap.appendChild(cfgTitle);
                    }
                    cfgTitle.classList.add('organigram-unified-title');
                    cfgTitle.textContent = 'DETAILS';

                    var cfgRow = wrap.querySelector('.organigram-config-row');
                    if (!cfgRow) {
                        cfgRow = document.createElement('div');
                        cfgRow.className = 'organigram-config-row';
                        wrap.appendChild(cfgRow);
                    }

                    var el = document.getElementById('three-play-indicator');
                    if (!el) {
                        el = document.createElement('button');
                        el.id = 'three-play-indicator';
                    }
                    el.type = 'button';
                    el.className = 'icon-button organigram-logo' + (window.organigramArrowsVisible ? ' selected' : '');
                    el.setAttribute('data-tooltip', 'On/Off détails Effet de Serre et Albédo');
                    el.removeAttribute('aria-label');
                    el.removeAttribute('title');
                    el.textContent = '⚗';

                    var staleAlb = cfgRow.querySelector('.organigram-albedo-percent-badge');
                    if (staleAlb) staleAlb.remove();

                    var flouSlot = document.getElementById('title-flou-scientifique-slot');
                    var baryFt = flouSlot && flouSlot.querySelector('.organigram-fine-tuning-bary-badge');
                    if (!baryFt) {
                        baryFt = flux.querySelector('.organigram-fine-tuning-bary-badge');
                    }
                    var pctFromData = 100;
                    var TftBary = window.DATA && window.DATA['🎚️'];
                    if (TftBary && TftBary.baryByGroup) {
                        var rawBB = Number(TftBary.baryByGroup.ATM);
                        pctFromData = Number.isFinite(rawBB) ? Math.max(0, Math.min(100, Math.round(rawBB))) : 0;
                    }
                    function htmlFlouBaryBadge(pct) {
                        return '<div class="organigram-bary-face organigram-bary-face--two-cols">' +
                            '<div class="organigram-bary-col organigram-bary-col-left">' +
                            '<div class="organigram-bary-icons">🔺🌡️🔻</div>' +
                            '<div class="organigram-bary-line-slider">' +
                            '<input class="organigram-bary-mini-slider" type="range" min="0" max="100" step="1" value="' + pct + '" aria-label="Réglage fin barycentre nuages">' +
                            '</div></div>' +
                            '<div class="organigram-bary-col organigram-bary-col-right">' +
                            '<div class="organigram-bary-icons organigram-bary-icons-puzzle">🧩</div>' +
                            '<span class="organigram-bary-pct">' + pct + '%</span></div>' +
                            '</div>';
                    }
                    if (!baryFt) {
                        baryFt = document.createElement('div');
                        baryFt.className = 'flux-label buttonData percent-label organigram-fine-tuning-bary-badge';
                        baryFt.setAttribute('data-id', 'fine_tuning_cloud_bary');
                        baryFt.setAttribute('data-tooltip', 'Flou scientifique');
                        baryFt.innerHTML = htmlFlouBaryBadge(pctFromData);
                    } else if (
                        !baryFt.querySelector('.organigram-bary-face--two-cols') ||
                        baryFt.querySelector('.organigram-bary-dash') ||
                        !baryFt.querySelector('.organigram-bary-col-left .organigram-bary-mini-slider')
                    ) {
                        var slLegacy = baryFt.querySelector('.organigram-bary-mini-slider');
                        var pvLegacy = (slLegacy && Number.isFinite(Number(slLegacy.value))) ? Math.max(0, Math.min(100, Math.round(Number(slLegacy.value)))) : pctFromData;
                        baryFt.innerHTML = htmlFlouBaryBadge(pvLegacy);
                        baryFt.removeAttribute('data-tooltip-initialized');
                    } else {
                        baryFt.querySelectorAll('.organigram-bary-pct').forEach(function (nodePct) {
                            nodePct.textContent = pctFromData + '%';
                        });
                        var slSync = baryFt.querySelector('.organigram-bary-mini-slider');
                        if (slSync) slSync.value = String(pctFromData);
                    }
                    if (typeof window.getFineTuningDetailAlt === 'function') {
                        baryFt.setAttribute('aria-label', window.getFineTuningDetailAlt(null, true));
                    } else {
                        baryFt.setAttribute('aria-label', 'Réglage barycentre nuages (albédo).');
                    }
                    if (typeof window.addTooltipFromAttribute === 'function' && !baryFt.hasAttribute('data-tooltip-initialized')) {
                        window.addTooltipFromAttribute(baryFt);
                        baryFt.setAttribute('data-tooltip-initialized', 'true');
                    }

                    cfgRow.appendChild(el);
                    if (flouSlot) {
                        flouSlot.appendChild(baryFt);
                    } else {
                        flux.appendChild(baryFt);
                    }

                    var diagram = document.getElementById('flux-diagram');
                    if (diagram) diagram.classList.toggle('hide-organigram-arrows', !window.organigramArrowsVisible);
                    window.syncPlotContainerOrganigramHideClasses();
                    if (el.dataset.boundClick !== '1') {
                        el.addEventListener('click', function () {
                            window.organigramArrowsVisible = !window.organigramArrowsVisible;
                            var diagramEl = document.getElementById('flux-diagram');
                            if (diagramEl) diagramEl.classList.toggle('hide-organigram-arrows', !window.organigramArrowsVisible);
                            el.classList.toggle('selected', window.organigramArrowsVisible);
                            window.syncPlotContainerOrganigramHideClasses();
                        });
                        el.dataset.boundClick = '1';
                    }
                };
                const animCb = document.getElementById('plot-anim-toggle-checkbox');
                if (animCb) {
                    animCb.addEventListener('change', (e) => {
                        DATA['🔘']['🔘🎞'] = e.target.checked;
                    });
                }
                window.updateThreePlayIndicator();
                window.updateObservationIndicator();
                if (document.body && document.body.dataset.ftBarySliderBound !== '1') {
                    function interpolateFromBaryToSnapshot() {
                        var T = window.DATA && window.DATA['🎚️'] ? window.DATA['🎚️'] : null;
                        var bounds = window.FINE_TUNING_BOUNDS && Array.isArray(window.FINE_TUNING_BOUNDS.targets)
                            ? window.FINE_TUNING_BOUNDS.targets
                            : [];
                        if (!T || !T.baryByGroup) return null;
                        var cloudSw = Object.assign({}, T.CLOUD_SW || {});
                        var solver = Object.assign({}, T.SOLVER || {});
                        for (var i = 0; i < bounds.length; i++) {
                            var target = bounds[i];
                            if (!target || !target.group || !target.key) continue;
                            var baryKey = target.baryGroup || target.group;
                            var p = Number(T.baryByGroup[baryKey]);
                            var alpha = Number.isFinite(p) ? Math.max(0, Math.min(1, p / 100)) : 1;
                            var min = Number(target.min);
                            var max = Number(target.max);
                            if (!Number.isFinite(min) || !Number.isFinite(max)) continue;
                            var v = min + (max - min) * alpha;
                            if (target.group === 'CLOUD_SW') cloudSw[target.key] = v;
                            if (target.group === 'SOLVER') solver[target.key] = v;
                        }
                        return { CLOUD_SW: cloudSw, SOLVER: solver };
                    }

                    function installFineTuningSetTrace() {
                        if (document.body.dataset.ftBarySetTraceInstalled === '1') return;
                        var T = window.DATA && window.DATA['🎚️'] ? window.DATA['🎚️'] : null;
                        if (!T || !T.baryByGroup || !T.CLOUD_SW) return;
                        try {
                            var baryVal = T.baryByGroup.CLOUD_SW;
                            Object.defineProperty(T.baryByGroup, 'CLOUD_SW', {
                                configurable: true,
                                enumerable: true,
                                get: function () { return baryVal; },
                                set: function (v) {
                                    baryVal = v;
                                    console.log('[DBG SET][DATA.🎚️.baryByGroup.CLOUD_SW] <=', v);
                                    console.trace('[DBG TRACE][SET baryByGroup.CLOUD_SW]');
                                    if (typeof window.pdTrace === 'function') window.pdTrace('set:baryByGroup.CLOUD_SW', 'main.js', 'value=' + v);
                                }
                            });
                        } catch (e) {
                            console.warn('[DBG SET] install baryByGroup.CLOUD_SW failed', e);
                        }
                        try {
                            var cloudBaseVal = T.CLOUD_SW.CLOUD_FRACTION_BASE;
                            Object.defineProperty(T.CLOUD_SW, 'CLOUD_FRACTION_BASE', {
                                configurable: true,
                                enumerable: true,
                                get: function () { return cloudBaseVal; },
                                set: function (v) {
                                    cloudBaseVal = v;
                                    console.log('[DBG SET][DATA.🎚️.CLOUD_SW.CLOUD_FRACTION_BASE] <=', v, 'bary=', T.baryByGroup && T.baryByGroup.CLOUD_SW);
                                    console.trace('[DBG TRACE][SET CLOUD_FRACTION_BASE]');
                                    if (typeof window.pdTrace === 'function') window.pdTrace('set:CLOUD_FRACTION_BASE', 'main.js', 'value=' + v + ' bary=' + (T.baryByGroup && T.baryByGroup.CLOUD_SW));
                                }
                            });
                        } catch (e2) {
                            console.warn('[DBG SET] install CLOUD_FRACTION_BASE failed', e2);
                        }
                        document.body.dataset.ftBarySetTraceInstalled = '1';
                        console.log('[DBG main] setters trace installés pour DATA[🎚️]');
                    }

                    installFineTuningSetTrace();

                    function forceApplyCloudSwBary(percentRaw) {
                        var T = window.DATA && window.DATA['🎚️'] ? window.DATA['🎚️'] : null;
                        var raw = Number(percentRaw);
                        var pct = Number.isFinite(raw) ? Math.max(0, Math.min(100, Math.round(raw))) : 100;
                        if (!T || !T.baryByGroup) return pct;
                        T.baryByGroup.ATM = pct;
                        T.baryByGroup.CLOUD_SW = pct;
                        T.baryByGroup.SCIENCE = pct;
                        var bounds = window.FINE_TUNING_BOUNDS && Array.isArray(window.FINE_TUNING_BOUNDS.targets)
                            ? window.FINE_TUNING_BOUNDS.targets
                            : [];
                        var cloudBaseTarget = null;
                        for (var bi = 0; bi < bounds.length; bi++) {
                            var bt = bounds[bi];
                            if (bt && bt.group === 'CLOUD_SW' && bt.key === 'CLOUD_FRACTION_BASE') {
                                cloudBaseTarget = bt;
                                break;
                            }
                        }
                        if (cloudBaseTarget && T.CLOUD_SW) {
                            var min0 = Number(cloudBaseTarget.min);
                            var max0 = Number(cloudBaseTarget.max);
                            if (Number.isFinite(min0) && Number.isFinite(max0)) {
                                var alpha0 = pct / 100;
                                T.CLOUD_SW.CLOUD_FRACTION_BASE = min0 + (max0 - min0) * alpha0;
                                console.log('[DBG main] forceApplyCloudSwBary direct-set CLOUD_FRACTION_BASE=' + T.CLOUD_SW.CLOUD_FRACTION_BASE + ' (min=' + min0 + ', max=' + max0 + ', pct=' + pct + ')');
                                if (typeof window.pdTrace === 'function') window.pdTrace('forceApplyCloudSwBary', 'main.js', 'CLOUD_FRACTION_BASE=' + T.CLOUD_SW.CLOUD_FRACTION_BASE + ' pct=' + pct);
                            }
                        }
                        if (window.TUNING && window.TUNING.fillDataTuningFromBary) {
                            window.TUNING.fillDataTuningFromBary();
                        } else {
                            // Fallback local: reproduit la logique d'interpolation depuis FINE_TUNING_BOUNDS.
                            for (var i = 0; i < bounds.length; i++) {
                                var target = bounds[i];
                                if (!target || !target.group || !target.key) continue;
                                if (!T[target.group]) continue;
                                var baryKey = target.baryGroup || target.group;
                                var p = Number(T.baryByGroup[baryKey]);
                                var alpha = Number.isFinite(p) ? Math.max(0, Math.min(1, p / 100)) : 1;
                                var min = Number(target.min);
                                var max = Number(target.max);
                                if (!Number.isFinite(min) || !Number.isFinite(max)) continue;
                                T[target.group][target.key] = min + (max - min) * alpha;
                            }
                            // v1.2.0 : SOLVER n'est plus dans DATA. Source unique = window.CONFIG_COMPUTE (configTimeline.js v1.4.13).
                        }
                        return pct;
                    }
                    function buildCloudSwTuningPayload(runFlag) {
                        var T = window.DATA && window.DATA['🎚️'] ? window.DATA['🎚️'] : null;
                        if (!T || !T.baryByGroup) return null;
                        var snap = interpolateFromBaryToSnapshot();
                        if (snap) {
                            T.CLOUD_SW = Object.assign({}, snap.CLOUD_SW);
                        }
                        return {
                            baryByGroup: {
                                ATM: T.baryByGroup.ATM,
                                CLOUD_SW: T.baryByGroup.ATM,
                                SCIENCE: T.baryByGroup.ATM,
                                HYSTERESIS: T.baryByGroup.HYSTERESIS
                            },
                            CLOUD_SW: Object.assign({}, T.CLOUD_SW),
                            updates: [],
                            run: runFlag === true
                        };
                    }
                    document.body.addEventListener('input', function (e) {
                        var el = e.target;
                        if (!el || !el.classList || !el.classList.contains('organigram-bary-mini-slider')) return;
                        var pct = forceApplyCloudSwBary(el.value);
                        var payload = buildCloudSwTuningPayload(false);
                        console.log('[DBG main] visu mini-slider input pct=' + pct + ' run=false');
                        if (typeof window.pdTrace === 'function') window.pdTrace('miniSliderInput', 'main.js', 'pct=' + pct + ' run=false');
                        if (payload && typeof window.applyTuningFromScie === 'function') {
                            if (window.SYNC_STATE) window.SYNC_STATE.lastRunRequestSource = 'visu:mini-slider:input';
                            window.applyTuningFromScie(payload);
                        }
                        // Mise à jour directe du texte % dans le badge (sans updateFluxLabels/updateLabel
                        // qui remplacerait innerHTML et détacherait le slider — cassant les events suivants)
                        document.querySelectorAll('[data-id="fine_tuning_cloud_bary"] .organigram-bary-pct').forEach(function (el) {
                            el.textContent = pct + '%';
                        });
                    });
                    document.body.addEventListener('change', function (e) {
                        var el = e.target;
                        if (!el || !el.classList || !el.classList.contains('organigram-bary-mini-slider')) return;
                        var pct = forceApplyCloudSwBary(el.value);
                        var payload = buildCloudSwTuningPayload(true);
                        console.log('[DBG main] visu mini-slider change pct=' + pct + ' run=true');
                        if (typeof window.pdTrace === 'function') window.pdTrace('miniSliderChange', 'main.js', 'pct=' + pct + ' run=true');
                        if (payload) {
                            console.log('[DBG main] visu mini-slider payload bary=' + payload.baryByGroup.CLOUD_SW + ' CLOUD_FRACTION_BASE=' + payload.CLOUD_SW.CLOUD_FRACTION_BASE);
                            if (typeof window.pdTrace === 'function') window.pdTrace('miniSliderChange', 'main.js', 'payload.bary=' + payload.baryByGroup.CLOUD_SW + ' CLOUD_FRACTION_BASE=' + payload.CLOUD_SW.CLOUD_FRACTION_BASE);
                        }
                        if (payload && typeof window.applyTuningFromScie === 'function') {
                            if (window.SYNC_STATE) window.SYNC_STATE.lastRunRequestSource = 'visu:mini-slider:change';
                            window.applyTuningFromScie(payload);
                        } else if (typeof window.runComputeInParent === 'function' && document.getElementById('scie-iframe')) {
                            window.runComputeInParent();
                        } else if (typeof calculateInitialData === 'function') {
                            calculateInitialData();
                        }
                    });
                    document.body.dataset.ftBarySliderBound = '1';
                }

                // 🔒 Initialiser la précision de convergence depuis les radio buttons (variable globale unique)
                const precisionRadios = document.querySelectorAll('input[name="precision-convergence"]');
                if (precisionRadios.length > 0) {
                    // Trouver le bouton radio checked
                    const checkedRadio = Array.from(precisionRadios).find(r => r.checked);
                    if (checkedRadio && checkedRadio.value) {
                        CONFIG_COMPUTE.convergencePrecisionK = parseFloat(checkedRadio.value);
                    }
                    
                    // Écouter les changements pour mettre à jour la variable globale unique
                    precisionRadios.forEach(radio => {
                        radio.addEventListener('change', (e) => {
                            if (e.target.checked) {
                                // 🔒 Mettre à jour la variable globale unique (seule référence)
                                // Si l'utilisateur change la précision, la config ne doit plus être prise en compte
                                CONFIG_COMPUTE.convergencePrecisionK = parseFloat(e.target.value);
                            }
                        });
                    });
                }
                
                const corpsNoirBtn = document.querySelector('.epoch-btn[data-epoch="⚫"]');
                if (corpsNoirBtn) corpsNoirBtn.click();
                
                window.addEventListener('calculationConverged', () => {
                    const planetTextures = document.querySelectorAll('.planet-texture[data-planet-texture="true"]');
                    planetTextures.forEach(function (texture) { texture.classList.remove('paused'); });
                });
    
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

    // Initialiser le nom de l'époque au chargement (même nom que l'époque chargée, ex. Corps Noir)
    const epochNameDisplay = document.getElementById('epoch-name');
    if (epochNameDisplay) {
        epochNameDisplay.textContent = window.RUNTIME_STATE.currentEpochName || 'Corps Noir';
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

    // Initialiser les event listeners sur les boutons du flux (DOM : 100ms pour injection organigramme)
    setTimeout(() => {
        FUNCS_ORGANIGRAMME.initFluxButtonListeners();
    }, 100);

    // Créer les radiations de la terre (doit être fait après l'initialisation car le radius dépend de l'époque)
    FUNCS_ORGANIGRAMME.recreateTerreRadiation();

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
    const IO_LISTENER = window.IO_LISTENER;
    const DATA = window.DATA;
    const TIMELINE = window.TIMELINE;
    if (window.RUNTIME_STATE.currentEpochName !== 'Hadéen') return;
    
    // Récupérer la config de l'époque et interpréter le logo
    const terreNode = window.configOrganigramme.nodes.find(n => n.id === 'terre');
    if (!terreNode || !terreNode.epoch || !Array.isArray(terreNode.epoch)) return;
    
    const epochConfig = terreNode.epoch.find(e => e.epochName === 'Hadéen');
    if (!epochConfig) return;

    // Valeurs bary-interpolées (radius, exobase, fillColor, strokeColor convergent vers Archéen)
    const _bary = DATA['📜']['bary'];
    const effectiveNodes = window.configOrganigramme.getEffectiveNodesConfig('Hadéen', _bary);
    const effectiveTerre = effectiveNodes.find(n => n.id === 'terre');
    const effectiveEpoch = effectiveTerre.epoch.find(e => e.epochName === 'Hadéen');

    // planetEffect = texture calculée (getPlanetTexturePathFromEpoch) ; sinon logo (picto)
    let newLogoPath;
    if (epochConfig.planetEffect) {
        newLogoPath = window.getPlanetTexturePathFromEpoch(TIMELINE[DATA['📜']['👉']]['▶'], window.infoTimeMa);
    } else {
        newLogoPath = interpretConfigValue(epochConfig.logo);
    }

    // Interpréter lightDistance
    let lightDistance = epochConfig.lightDistance;
    if (typeof lightDistance === 'string') {
        lightDistance = interpretConfigValue(lightDistance);
    }
    
    // Si isIceChange, diminuer lightDistance de 1
    if (window.isIceChange && typeof lightDistance === 'number') {
        lightDistance = Math.max(0, lightDistance - 1);
    }
    
    window.currentEpochLuxSaturation = epochConfig.luxSaturation !== undefined ? epochConfig.luxSaturation : 1.0;
    window.currentEpochLightDistance = lightDistance;

    // Recréer la cellule Terre avec la nouvelle texture
    // 🔒 Ne pas enlever l'ancienne cellule avant que la nouvelle texture soit prête :
    // on insère la nouvelle derrière l'ancienne, on attend three:ready, puis on retire l'ancienne
    // pour éviter que la texture disparaisse (flash noir) pendant le chargement.
    const oldCell = document.getElementById('cell-terre');
    console.log('[recreateTerre] three:runStart (sans canvas) — caller: ' + (new Error().stack.split('\n')[2] || '?').trim());
    window.threeJSAnimationPaused = true;
    IO_LISTENER.emit('three:runStart');
    const canvas = oldCell.querySelector('canvas');
    let savedRotationY = 0;
    if (canvas && canvas._threeJSData && canvas._threeJSData.sphere) {
        savedRotationY = canvas._threeJSData.sphere.rotation.y;
        window.savedPlanetRotationY = savedRotationY;
    } else if (window.savedPlanetRotationY !== undefined) {
        savedRotationY = window.savedPlanetRotationY;
    }

    const parent = oldCell.parentElement;
    const newCell = window.ORG.createCell(
            terreNode.x,
            terreNode.y,
            effectiveEpoch.radius,
            effectiveEpoch.fillColor,
            effectiveEpoch.strokeColor,
            newLogoPath,
            terreNode.left,
            terreNode.right,
            terreNode.top,
            terreNode.bottom,
            terreNode.tooltip,
            terreNode.ariaLabel || null,
            terreNode.radiation,
            null,
            null,
            terreNode.id,
            terreNode.zIndex,
            1,
            0,
            effectiveEpoch.strokeSize,
            terreNode.strokeStyle || 'solid',
            effectiveEpoch.radiusExobase ?? null,
            null,
            effectiveEpoch.planetEffect || false
        );
    window._lastPlanetTexturePath = newLogoPath;
    parent.insertBefore(newCell, oldCell);
    const newCanvas = newCell.querySelector('canvas');
    var timeoutId = null;
    var onThreeReady = function (payload) {
        if (payload && payload.canvas === newCanvas) {
            IO_LISTENER.off('three:ready', onThreeReady);
            if (timeoutId !== null) clearTimeout(timeoutId);
            oldCell.remove();
            window.threeJSAnimationPaused = false;
        }
    };
    IO_LISTENER.on('three:ready', onThreeReady, 'main.js');
    timeoutId = setTimeout(function () {
        timeoutId = null;
        IO_LISTENER.off('three:ready', onThreeReady);
        oldCell.remove();
    }, 3000);
}

// Exposer updateHadeenTexture et interpretConfigValue globalement
window.updateHadeenTexture = updateHadeenTexture;
window.interpretConfigValue = interpretConfigValue;

/** Debug : run par epoch, log entrée (config epoch) + sortie (convergence) dans fichier txt. */
window.runDebugLogMode = function () {
    const TIMELINE = window.TIMELINE;
    console.log('[runDebugLogMode] appele');
    var timeline = TIMELINE;
    if (!timeline || !Array.isArray(timeline)) {
        console.error('[runDebugLogMode] TIMELINE absent');
        return;
    }
    var epochs = timeline.filter(function (e) { return e && e['📅'] && !e.hidden; });
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
