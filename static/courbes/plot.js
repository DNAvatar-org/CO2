// ============================================================================
// File: plot.js - Gestion du graphique avec Plotly.js
// Desc: En français, dans l'architecture, je suis le module de visualisation graphique
// Version 1.0.66
// Date: [May 06, 2026] [16:00 UTC+1]
// logs :
// - v1.0.66: resolvePlotTimelineEpoch — 👉 / 🗿 avant nom UI (fix « Corps Noir » vs CHARS_DESC « Corps noir » dans configOrganigramme.timeline).
// - v1.0.65: nettoyage crash-first — retrait des gardes `typeof window/...` défensifs autour des APIs UI contractuelles (fonts, logos, sync classes, listeners, état spectral).
// - v1.0.64: retrait readouts T sol. / T eff. (K °C °F) sur le graphe — températures restent dans le bandeau titre ; légende courbes = main.js updateLegend
// - v1.0.63: alt zones captation spectre — sans Min/Max ni λ/bin ; molécules « Label captation [a - b] μm » ; nuages « Nuages (corps gris) absorption sur tout le spectre [4 - 50] μm » ; retrait propriété minMax des bandes
// - v1.0.62: FLUX.plotMaxYScienceTraces / plotMaxYPlanckSurfaceSol (snapshot échelle) ; PLOT.logPlotScaleAfterCompute → DEBUG.log si DEBUG_PLOT_LOG (plot_debug.js)
// - v1.0.61: callback post-react — drawSpectralVisualization seulement si canvas._lastData défini (évite TypeError upward_flux quand aucun flux encore mis en cache)
// - v1.0.60: window.FLUX initialisé une fois avec PLOT ; accès directs FLUX dans updatePlot/callback (plus de if (!FLUX) / && FLUX)
// - v1.0.59: indicateurs EDS / bandes après Plotly.react (Y réel) ; FLUX.plotYMaxLuminance ; invalidateSpectralYLuminanceCache ; callback resize — drawSpectral saut si FLUX.skipSpectralFluxRedrawOnce (flux refait par updateSpectralVisualization)
// - v1.0.58: échelle Y spectre — pic Planck(T sol) tirets ≈ 90% hauteur (Y_AXIS_PEAK_FRACTION_SOL 0.9) ; max Y auto sans courbes Planck ref. blanches ; plancher y_max ≥ max(planck sol)/0.9
// - v1.0.57: namespace PLOT (source unique) : updatePlot, updateSpectralVisualization, updatePlotAltitudeAxis, tempToColor, tempSurfaceToColor, debugZIndex, debugPlotlyStructure, updateSpectralBandIndicatorsGhostOnly. Migration lectures/écritures UI_STATE/RUNTIME_STATE (fps, showSpectralBackground, spectralConverged, spectralPrecisionTarget, currentEpochName).
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.1: H2O 17μm borne ajoutée (fallback si CONST absent), bornes repositionnées sous axe
// - v1.0.2: Bornes et spectre collés juste sous l'axe (bottom 65px, canvas étendu marge 75px)
// - v1.0.3: Resize artificiel après Plotly.react, spectre +1px, bornes -5px
// - v1.0.4: displaylogo: false, showLink: false pour masquer branding Plotly
// - v1.0.5: drawSpectralVisualization return early si rect invalide (panel masqué) ; switchTab visu → resize
// - v1.0.6: Bornes H2O/CH4/CO2 alignées via Plotly.c2p (plus de décalage selon largeur div)
// - v1.0.7: lastGoodYMaxLuminance pendant dichotomie ; width/height explicites pour éviter dezoom
// - v1.0.8: exponentformat power (pas SI/T) ; pas de resize pendant calcul ; guard targetRect invalide
// - v1.0.9: échelle ×10¹²/×10¹³/k par époque ; Planck(T_config) à 30% ; valeurs entières ; fixe jusqu'à convergence
// - v1.0.10: courbe colorée à 65% (dépasse milieu) ; tickformat 1.25 max 5 chars ; séparateur .
// - v1.0.11: Pendant dichotomie, garder width/height du canvas (pas rect) pour éviter saut barre spectre
// - v1.0.11: Pendant dichotomie, réappliquer top/left depuis _lastTop/_lastLeft (éviter saut Y si échelle change)
// - v1.0.11: Toujours resizeCanvasToPlot après Plotly.react (relayout peut bouger même si échelle fixe)
// - v1.0.12: MutationObserver sur plot-container appelle resizeCanvasToPlot quand Plotly modifie le DOM
// - v1.0.13: updatePlotAltitudeAxis(atm_height_km) pour mettre à jour yaxis2 à chaque cycle
// - v1.0.14: updatePlotAltitudeAxis uniquement en ProcessFinished ; tickvals 0-200km pour échelle >500
// - v1.0.23: Courbe pointillée corps noir à T effective (pas T surface) pour même fenêtre que courbe pleine
// - v1.0.24: rendu spectral séquencé: non-anim=FINAL seul, anim=chaque cycle; suppression redraw différé doublon depuis updatePlot
// - v1.0.56: échelle Y spectre — sommet courbe T sol ≈ 3/4 hauteur plot (facteur 0.75 au lieu de 0.65)
// - v1.0.55: paire H₂O (6.3 / 17 μm) — écart vertical entre marqueurs > taille police (spectralPairGroup + pairGapPx)
// - v1.0.54: bandes partageant le même bin grille (ex. H₂O 17 μm + CO₂15 μm → [12,17]) — décalage vertical empilé pour voir les deux pictos
// - v1.0.53: fond alpha entre [ ] = même couleur que crochets (band.color hex/rgb) ; repli Hz2RGB si color vide
// - v1.0.52: spectralIndicatorsGhostActive — fantôme marqueurs spectraux UNIQUEMENT si époque « Corps Noir » (ne pas réintroduire hide-* : grisait Hadéen/Archéen/etc.)
// - v1.0.51: annule v1.0.50 — (historique) Corps Noir OU hide-* ; supplanté par v1.0.52 pour logos [ ] / EDS / Terre sur le graphe
// - v1.0.49: fond entre crochets des plages spectrales = Hz2RGB (wavelengthToColorReal au λ centre) ; band.color reste crochets/texte
// - v1.0.48: fantôme spectre via classe .organigram-picto-inactived (organigramme.css) ; retrait inline filter/opacity
// - v1.0.47: fantôme spectre en inline (Corps Noir OU hide-organigram-* sur #flux-diagram) + updateSpectralBandIndicatorsGhostOnly (main.js)
// - v1.0.46: fin drawAbsorptionBandIndicators : syncPlotContainerOrganigramHideClasses (classes hide-* sur .plot-container-wrapper alignées #flux-diagram)
// - v1.0.45: époque Corps Noir : indicateurs spectraux [ ] + marqueurs EDS/Terre en grayscale + opacity 0.3 (traitement « invisibles » provisoire)
// - v1.0.44: bandes CH₄ : couleur crochets + fond alpha rgb(0,118,114) #007672
// - v1.0.43: bandes [ ] : crochets derrière le picto (z-index) ; tailles défaut img/emoji 18 px (comme avant grossissement)
// - v1.0.42: bandes [ ] : PNG (charsImages) plus grands que UTF‑8 ; tailles via CONFIG_COMPUTE spectralBandLogoImgPx / EmojiPx / ImgPxByEmoji
// - v1.0.41: bande Nuages EDS (fullSpan) : Y juste au-dessus du marqueur spectral EDS (même λ CONFIG) ; repli haut graphe si pas de Y EDS
// - v1.0.40: visu_ bandes spectrales : si image définie (charsImages), rendu image partout (CH4/CO2/H2O/nuages), sinon emoji
// - v1.0.39: marqueur espace = Terre (logo continents 🌍) pas Soleil ; EDS Δ/4 ; nuages en haut du graphe + z-index au-dessus d’EDS
// - v1.0.38: Soleil Y = ½·Planck(T_eff) à λ (milieu y=0 et courbe espace) ; EDS Y = Y_sol + (Y_eff−Y_sol)/3 sur l’axe luminance
// - v1.0.37: marqueurs EDS/Soleil ×2 ; EDS à 2/3 entre Planck(sol) et Planck(T_eff) ; Soleil à mi-intervalle (y/2) entre les deux
// - v1.0.36: bandes spectrales : logos ×1,5 (18px) ; fond rgba entre [ ] à la couleur des crochets
// - v1.0.35: indicateurs [ ] : Y = moyenne Planck(T sol) et Planck(T_eff espace) au λ centre (milieu des 2 courbes) ; repli si incomplet
// - v1.0.34: indicateurs [ ] bandes H₂O/CH₄/CO₂/nuages : Y = Planck(T sol) au λ centre de la bande (fallback bottom si axe pas prêt)
// - v1.0.33: EDS/Soleil à λ configurable (défaut 10 μm) ; Y = Planck(T sol) et Planck(T_eff) à cette λ (coords axe Plotly)
// - v1.0.32: EDS + Soleil (image ☀️ charsImages) sur l’axe ~12 μm ; CONFIG_COMPUTE spectralBandIndicatorLiftPx pour monter les [ ]
// - v1.0.31: encadrés T sol / T eff avec logos 📛 (EDS) et ☀️ sous les valeurs (style .plot-temp-readouts)
// - v1.0.30: corps noir Planck à T_surface (tirets), couleur = même logique que courbe spectrale (tempSurfaceToColor / currentBlackBodyColor)
// - v1.0.29: tooltip OLR (courbe pleine) = T_eff comme corps noir pointillé (∫ cohérent), pas T_surface (évite ~4°C vs ~−29°C)
// - v1.0.28: hidden epoch support (ex: hysteresis 1) fallback to window.TIMELINE when configOrganigramme.timeline is filtered
// - v1.0.25: bridge draw ack: publie plot:drawn + met à jour _lastDrawnCycleToken après draw (sync API visu_)
// - v1.0.26: bridge draw ack branché sur window.VISUALWAIT.markDrawn (fonctions window rangées)
// - v1.0.27: supprime VISUALWAIT.markDrawn + IO_LISTENER.emit('plot:drawn') — appel direct, pas de pile
// - v1.0.16: Indicateur nuages EDS (corps gris) sur barre spectre : fullSpan 4–50 μm, LOGOS.CLOUDS
// - v1.0.15: remove misleading pd() [BUG] traces in updatePlotAltitudeAxis and resizeCanvasToPlot
// - v1.0.17: lissage gaussien visuel du flux (createFluxTrace) ; ne touche pas aux intégrales/OLR
// - v1.0.18: retrait garde CONFIG_COMPUTE défensive sur lissage (règle crash, pas fallback silencieux)
// - v1.0.19: plotSmoothSigmaBins obligatoire (accès direct, pas de garde/fallback)
// - v1.0.20: lissage visuel par moyenne glissante centrée (fenêtre en bins via plotSmoothSigmaBins, ex 20)
// - v1.0.21: indicateurs d'absorption en crochets colorés [ ] (plus de bande transparente arrondie)
// - v1.0.22: nuages full-span (logo + crochets) décalés au-dessus de l'axe spectral
// - v1.0.23: [ ] sur la même ligne que le picto ( [ logo ] )
// - v1.0.24: [ ] alignés sur les bornes de bins (SPECTRAL_GRID_BOUNDS_UM) = bandes code bar du fond
// ============================================================================

// ============================================================================
// GESTION DU GRAPHIQUE AVEC PLOTLY.JS
// ============================================================================

// Marges du graphique Plotly (communes à initPlot et updatePlot)
// va avec .plot-container-wrapper { padding: 0; !!! Important ne pas changer !!!
const PLOT_MARGINS = { l: 70, r: 75, t: 0, b: 75 }; // Marges ajustées pour éviter le débordement

/** Pic cible sur l’axe Y (luminance) : Planck(T sol) en tirets colorés ≈ cette fraction de la hauteur utile [0, y_max]. */
const Y_AXIS_PEAK_FRACTION_SOL = 0.9;

// Préserver l'échelle Y pendant l'animation/dichotomie (éviter dezoom entre cycles)
let lastGoodYMaxLuminance = 40;
let lastEpochForScale = null; // Reset quand l'époque change
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

var CONST = window.CONST; /* var pour éviter redeclaration avec main.js */

// Namespace PLOT : source unique des fonctions exposées par plot.js.
var PLOT = window.PLOT = window.PLOT || {};
window.FLUX = window.FLUX || {};

/** Invalide le cache d’échelle Y (dichotomie / dernier bon max) pour forcer le recalcul au prochain updatePlot (ex. fin de calcul). */
PLOT.invalidateSpectralYLuminanceCache = function invalidateSpectralYLuminanceCache() {
    lastGoodYMaxLuminance = null;
    window.FLUX.yAxisRecalcOnNextFinish = true;
};

/** Fin de calcul (sync_panels) : écrit dans _logs/plot.txt via DEBUG.log si ?debugPlot=1 (plot_debug.js). */
PLOT.logPlotScaleAfterCompute = function logPlotScaleAfterCompute() {
    if (window.DEBUG_PLOT_LOG !== true) return;
    const F = window.FLUX;
    const payload = {
        epoch: window.RUNTIME_STATE.currentEpochName,
        maxYScienceTraces: F.plotMaxYScienceTraces,
        maxYPlanckSurfaceSol: F.plotMaxYPlanckSurfaceSol,
        yMaxLuminanceAxis: F.plotYMaxLuminance,
        plotAxisYPx: F.plotAxisYPx,
        plotAxisXPx: F.plotAxisXPx
    };
    window.DEBUG.log('[plotScale@finCalcul] ' + JSON.stringify(payload));
};

/**
 * Entrée epoch dans configOrganigramme.timeline alignée sur DATA['📜']['👉'] ou 🗿.
 * Évite l’échec du .find par nom quand CHARS_DESC dit « Corps noir » et RUNTIME_STATE « Corps Noir ».
 */
function resolvePlotTimelineEpoch() {
    const tl = window.configOrganigramme && window.configOrganigramme.timeline;
    if (!Array.isArray(tl)) {
        throw new Error('[resolvePlotTimelineEpoch] configOrganigramme.timeline indisponible');
    }
    const pr = window.DATA && window.DATA['📜'];
    if (pr && pr['👉'] != null) {
        const idxRaw = pr['👉'];
        const idx = typeof idxRaw === 'number' ? idxRaw : Number(idxRaw);
        if (Number.isFinite(idx) && idx >= 0 && idx < tl.length) {
            const row = tl[idx];
            if (row && row.type === 'epoch') {
                return row;
            }
        }
    }
    if (pr && pr['🗿'] != null) {
        const eid = pr['🗿'];
        const byId = tl.find(function (e) {
            return e.type === 'epoch' && e.id === eid;
        });
        if (byId) {
            return byId;
        }
    }
    const name = window.RUNTIME_STATE.currentEpochName;
    const byName = tl.find(function (e) {
        if (e.type !== 'epoch') {
            return false;
        }
        if (e.name === name || e.id === name) {
            return true;
        }
        return e.id === '⚫' && name === 'Corps Noir';
    });
    if (byName) {
        return byName;
    }
    throw new Error(
        "[resolvePlotTimelineEpoch] Époque '" + name + "' introuvable dans timeline (👉 / 🗿 / nom)",
    );
}

// Fonction pour obtenir la couleur par défaut du body (vert)
function getDefaultTextColor() {
    if (document.body) {
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
PLOT.tempSurfaceToColor = function (tempC) {
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

// Fonction de couleur basée sur la température (palette avec couleurs très distinctes)
// Exposer globalement pour être accessible depuis main.js
PLOT.tempToColor = function tempToColor(temp, temp_min = 180, temp_max = 315) {
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
PLOT.debugZIndex = function () {
    const canvas = document.getElementById('spectral-visualization');
    const title = document.querySelector('.plot-overlay-title');
    const plotContainer = document.getElementById('plot-container');

    // Debug z-index désactivé
};

// Fonction de debug pour inspecter la structure DOM de Plotly
PLOT.debugPlotlyStructure = function () {
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
        autosize: true, // Éviter reset width/height à chaque Plotly.react (cycle)
        xaxis: {
            anchor: 'y',
            side: 'bottom',
            title: {
                text: "Longueur d'onde (μm)",
                standoff: 20,
                font: getPlotlyFont(14, getDefaultTextColor())
            },
            tickfont: getPlotlyFont(12, getDefaultTextColor()),
            range: [0, 50],
            fixedrange: true,
            showgrid: false,
            showline: false,
            zeroline: false,
            showticklabels: true,
            ticks: 'outside',
            ticklen: 0,
            tickwidth: 0
        },
        yaxis: {
            title: {
                text: "Luminance spectrale (W·m⁻²·μm⁻¹·sr⁻¹) ×10¹³",
                font: getPlotlyFont(14, getDefaultTextColor())
            },
            range: [0, 40],
            fixedrange: true,
            tickformat: ',.0f',
            side: 'left',
            tickfont: getPlotlyFont(12, getDefaultTextColor()),
            titlefont: getPlotlyFont(14, getDefaultTextColor()),
            showgrid: true,
            gridcolor: 'rgba(0, 0, 0, 0.5)',
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
                y: 0, // Position de la tropopause (sera mise à jour dynamiquement dans updatePlot)
                visible: false, // Cachée par défaut, sera mise à jour dans updatePlot
                text: 'Stratosphère<br>--<br>Troposphère',
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
        displaylogo: false,
        showLink: false,
        scrollZoom: false,
        doubleClick: false,
        dragmode: false
    }).then(() => {
        // Redimensionner le graphique Plotly à la bonne taille SI visible
        const plotEl = document.getElementById('plot-container');
        // offsetParent est null si l'élément (ou un parent) est en display: none
        if (plotEl && plotEl.offsetParent !== null) {
            Plotly.Plots.resize(plotEl);
        }

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
const RESIZE_DEBOUNCE_MS = 1000;
// Fonction qui contient l'appel setTimeout(resizeEvent) — log à l'entrée pour tracer les appels
function debouncedResizeCanvas() {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function resizeEvent() {
        resizeTimeout = null;
        const plotEl = document.getElementById('plot-container');
        if (plotEl && typeof Plotly !== 'undefined') {
            Plotly.Plots.resize(plotEl);
            // Forcer le relayout des axes en verticale (position/marges recalculées)
            const w = plotEl.offsetWidth;
            const h = plotEl.offsetHeight;
            if (w > 0 && h > 0) {
                Plotly.relayout(plotEl, { width: w, height: h });
            }
        }
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
    }, RESIZE_DEBOUNCE_MS);
}

// Flag pour éviter les appels multiples simultanés
let resizeCanvasInProgress = false;
let resizeCanvasRetryCount = 0;
let resizeCanvasPendingCallback = null; // Si appel bloqué, retry après fin
const MAX_RETRY_COUNT = 5;

function resizeCanvasToPlot(callback) {
    // Si déjà en cours : planifier retry pour ne pas perdre les mises à jour (anim)
    if (resizeCanvasInProgress) {
        resizeCanvasPendingCallback = callback;
        if (!resizeCanvasToPlot._pendingTimer) {
            resizeCanvasToPlot._pendingTimer = setTimeout(() => {
                resizeCanvasToPlot._pendingTimer = null;
                const cb = resizeCanvasPendingCallback;
                resizeCanvasPendingCallback = null;
                if (cb) resizeCanvasToPlot(cb);
            }, 50); // Après le double rAF du resize en cours (~33ms)
        }
        return;
    }

    const canvas = document.getElementById('spectral-visualization');
    const plotContainer = document.getElementById('plot-container');
    if (!canvas || !plotContainer) return;

    resizeCanvasInProgress = true;

    // requestAnimationFrame : capturer le DOM après le paint de Plotly (plus réactif que setTimeout 100ms)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
        // Trouver spécifiquement ".nsewdrag.drag.cursor-pointer" pour calibrer le canvas
        const targetElement = plotContainer.querySelector('.nsewdrag.drag.cursor-pointer');
        const wrapper = plotContainer.parentElement;

        if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            if (targetRect.width < 50 || targetRect.height < 50) {
                resizeCanvasInProgress = false;
                if (resizeCanvasRetryCount < MAX_RETRY_COUNT) {
                    resizeCanvasRetryCount++;
                    setTimeout(() => { resizeCanvasToPlot(callback); }, 150);
                } else {
                    resizeCanvasRetryCount = 0;
                }
                return;
            }
            const marginBottomPx = 75;
            const paddingX = 5;
            const width = Math.round(targetRect.width) + (paddingX * 2);
            const height = Math.round(targetRect.height) + marginBottomPx;

            // Positionner le canvas : même Y, left - 5px pour être derrière le 0
            let leftPx;
            let topPx;
            if (wrapper) {
                const wrapperRect = wrapper.getBoundingClientRect();
                leftPx = Math.round((targetRect.left - wrapperRect.left) - paddingX);
                topPx = Math.round(targetRect.top - wrapperRect.top); // Même Y
            } else {
                const plotRect = plotContainer.getBoundingClientRect();
                leftPx = Math.round((targetRect.left - plotRect.left) - paddingX);
                topPx = Math.round(targetRect.top - plotRect.top); // Même Y
            } 
            // Pendant la dichotomie : ne pas modifier top/left (targetRect change à chaque cycle).
            // Garder _lastTop/_lastLeft pour éviter que le spectre bouge.
            const skipReposition = window.SYNC_STATE.calculationInProgress;
            if (!skipReposition) {
                canvas.style.setProperty('left', leftPx + 'px', 'important');
                canvas.style.setProperty('top', topPx + 'px', 'important');
                canvas.style.removeProperty('transform');
            }
            canvas._lastTop = (skipReposition ? canvas._lastTop : (topPx + 'px'));
            canvas._lastLeft = (skipReposition ? canvas._lastLeft : (leftPx + 'px'));

            const dimsUnchanged = (canvas._lastWidth === width && canvas._lastHeight === height && canvas._lastLeftPx === leftPx && canvas._lastTopPx === topPx);

            if (!skipReposition) {
                canvas._lastWidth = width;
                canvas._lastHeight = height;
                canvas._lastLeftPx = leftPx;
                canvas._lastTopPx = topPx;
            }
            const useWidth = skipReposition ? (canvas._lastWidth || width) : width;
            const useHeight = skipReposition ? (canvas._lastHeight || height) : height;

            if (!skipReposition && !dimsUnchanged) {
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
                canvas.width = width;
                canvas.height = height;
                setTimeout(() => { drawAbsorptionBandIndicators(); }, 50);
            }
            // FLUX = objet (déf pixels, politique axe Y). Propriétés scalaires en camelCase.
            // Politique Y : (1) Clic action (TicTime/météorite) → events.js pose yAxisRecalcOnNextFinish = true.
            // (2) Au prochain ProcessFinished, updatePlot force recalc Y (pas lastGoodYMaxLuminance). (3) Courbe trop plate
            // → optionnel FLUX.minYMaxLuminance (plancher) pour ne pas écraser l'axe ; sinon défaut 0.5.
            window.FLUX.plotAxisXPx = Math.max(24, Math.floor(useWidth));
            window.FLUX.plotAxisYPx = Math.max(24, Math.floor(useHeight));
            canvas.style.setProperty('z-index', '1', 'important');

            const rect = canvas.getBoundingClientRect();
            const displayHeight = Math.floor(rect.height) || useHeight;
            const resFactor = displayHeight / useHeight;
            drawSpectrumBarOnlyWithSize(useWidth, useHeight, resFactor);

            resizeCanvasInProgress = false;
            resizeCanvasRetryCount = 0; // Réinitialiser le compteur en cas de succès

            // Exécuter le callback (redessin complet) si fourni
            if (callback && typeof callback === 'function') {
                callback();
            }
            // Si un appel a été bloqué pendant qu'on travaillait, le traiter maintenant
            if (resizeCanvasPendingCallback) {
                const cb = resizeCanvasPendingCallback;
                resizeCanvasPendingCallback = null;
                if (resizeCanvasToPlot._pendingTimer) {
                    clearTimeout(resizeCanvasToPlot._pendingTimer);
                    resizeCanvasToPlot._pendingTimer = null;
                }
                resizeCanvasToPlot(cb);
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
        });
    });
}

/**
 * Met à jour l'axe altitude (yaxis2) du plot à la fin du calcul. Appelé depuis updateFluxLabels(ProcessFinished).
 * Pendant la convergence : ne pas appeler (la barre reste stable).
 * À la fin : range + tickvals pour plus de précision en bas (0–200 km) quand l'échelle est grande.
 */
PLOT.updatePlotAltitudeAxis = function (atm_height_km) {
    const plotContainer = document.getElementById('plot-container');
    if (!plotContainer || typeof Plotly === 'undefined') return;
    if (!plotContainer._fullLayout) return;
    const z_max = Number(atm_height_km);
    if (!Number.isFinite(z_max) || z_max < 0) return;
    const rangeMax = Math.max(1, Math.ceil(z_max * 1.05));
    const relayout = { 'yaxis2.range': [0, rangeMax] };
    if (rangeMax > 500) {
        const tickvals = [0, 50, 100, 200, 400, 600, 800, 1000, 1200, 1500, 1800].filter(v => v <= rangeMax);
        if (tickvals[tickvals.length - 1] < rangeMax) tickvals.push(Math.round(rangeMax));
        relayout['yaxis2.tickmode'] = 'array';
        relayout['yaxis2.tickvals'] = tickvals;
    } else {
        relayout['yaxis2.tickmode'] = 'linear';
        relayout['yaxis2.dtick'] = rangeMax / 8;
    }
    Plotly.relayout(plotContainer, relayout);
};

// Ajouter l'écouteur d'événement resize
window.addEventListener('resize', debouncedResizeCanvas);

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
    const axisMarginB = 75; // PLOT_MARGINS.b - spectre collé juste sous l'axe

    // Barre spectrale : collée juste sous l'axe (dans la marge), +1px pour affiner
    const spectrumBarY = height - axisMarginB - 1;
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
    if (window.globalFontFamily) {
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
// Fonction pour dessiner les indicateurs de bandes d'absorption sur le spectre
// CO2 : ~15 μm (principale), pic à ~11 μm
// CH4 : ~7.7 μm (principale), pic à ~23 μm
// H2O : ~6.3 μm (principale), nombreuses bandes entre 5–8 μm
/**
 * Marqueurs spectraux sur le graphe ([ ], EDS, Terre) : .organigram-picto-inactived seulement en époque « Corps Noir ».
 *
 * NE PAS réintroduire hide-organigram-* ici : avec DETAILS / OBSERVATIONS off par défaut, ça forçait gris+alpha sur Hadéen, Archéen, etc.
 * Le picto Géométrie sur #flux-diagram reste géré par organigramme.css (hide-organigram-observation-metrics), pas par cette fonction.
 */
function spectralIndicatorsGhostActive() {
    return typeof window !== 'undefined' && window.RUNTIME_STATE.currentEpochName === 'Corps Noir';
}

function applySpectralIndicatorsGhostStyle(el) {
    if (!el) return;
    const on = spectralIndicatorsGhostActive();
    el.classList.toggle('organigram-picto-inactived', on);
    el.style.removeProperty('filter');
    el.style.removeProperty('opacity');
}

PLOT.updateSpectralBandIndicatorsGhostOnly = function updateSpectralBandIndicatorsGhostOnly() {
    const wrap = document.querySelector('.plot-container-wrapper');
    if (!wrap) return;
    wrap.querySelectorAll('.absorption-band-indicator, .spectral-eds-marker').forEach(applySpectralIndicatorsGhostStyle);
};

function drawAbsorptionBandIndicators() {
    const plotContainerWrapper2 = document.querySelector('.plot-container-wrapper');
    if (!plotContainerWrapper2) return;

    // Supprimer les anciens indicateurs s'ils existent
    const oldIndicators = plotContainerWrapper2.querySelectorAll('.absorption-band-indicator, .spectral-eds-sun-markers, .spectral-eds-marker');
    oldIndicators.forEach(ind => ind.remove());

    const canvas = document.getElementById('spectral-visualization');
    const plotContainer = document.getElementById('plot-container');
    if (!canvas || !plotContainer || typeof Plotly === 'undefined') return;

    // Utiliser l'API interne Plotly (c2p) pour convertir données → pixels
    // Évite le décalage des bornes H2O/CH4/CO2 quand la largeur de la div change
    const axisMarginBottom = 75; // PLOT_MARGINS.b
    const markersOffsetBelowAxis = -15; // px sous l'axe (bandes moléculaires)
    const markerOffsetAboveAxis = 4; // px au-dessus de l'axe (bande nuages full-span)
    // Monter toute la rangée [ ] (CONFIG_COMPUTE.spectralBandIndicatorLiftPx, défaut plot si absent)
    const bracketLiftPx = (window.CONFIG_COMPUTE && Number.isFinite(Number(window.CONFIG_COMPUTE.spectralBandIndicatorLiftPx)))
        ? Number(window.CONFIG_COMPUTE.spectralBandIndicatorLiftPx)
        : 14;

    const plotRect = plotContainer.getBoundingClientRect();
    const wrapperRect = plotContainerWrapper2.getBoundingClientRect();
    const plotLeftFromWrapper = plotRect.left - wrapperRect.left;

    // Fonction helper : utilise Plotly._fullLayout.xaxis.c2p si dispo, sinon fallback
    let getXPosition;
    const gd = plotContainer;
    const xaxis = gd._fullLayout && gd._fullLayout.xaxis;
    if (xaxis && typeof xaxis.c2p === 'function') {
        /* c2p retourne des coord. relatives à la zone de tracé (cartesian), pas au conteneur → ajouter marge gauche */
        getXPosition = (lambda_um) => {
            const xInPaper = xaxis.c2p(lambda_um);
            return plotLeftFromWrapper + PLOT_MARGINS.l + xInPaper;
        };
    } else {
        const graph_max_um = 50;
        const graph_min_um = 0;
        const PLOT_MARGINS_LOCAL = { l: 70, r: 75 };
        const plotWidth = plotRect.width - PLOT_MARGINS_LOCAL.l - PLOT_MARGINS_LOCAL.r;
        getXPosition = (lambda_um) => {
            const normalizedX = (lambda_um - graph_min_um) / (graph_max_um - graph_min_um);
            return plotLeftFromWrapper + PLOT_MARGINS_LOCAL.l + normalizedX * plotWidth;
        };
    }

    // Indicateurs de bandes d'absorption (H2O, CO2, CH4 = bandes spectrales ; nuages = corps gris, tout le LW)
    // Utiliser la référence unique des logos depuis configOrganigramme.js
    const LOGOS = window.LOGOS || {
        CO2: '🏭',
        CH4: '🐄',
        H2O: '💧',
        ALBEDO: '🪩',
        CLOUDS: '☁️'
    };
    if (!LOGOS.CLOUDS) LOGOS.CLOUDS = '☁️';
    const getLogoImageSrc = window.getLogoImageSrc;
    const resolveLogoImg = (logo) => (getLogoImageSrc ? getLogoImageSrc(logo) : null);

    // Bornes des bins de la grille spectrale (calculations.js buildAdaptiveLambdaGrid) — les [ ] alignés dessus = bandes "code bar" du fond.
    const SPECTRAL_GRID_BOUNDS_UM = [0.1, 4, 4.6, 7, 8, 12, 17, 25, 50];
    function getGridSegmentForLambda(lambda_um) {
        for (let i = 0; i < SPECTRAL_GRID_BOUNDS_UM.length - 1; i++) {
            if (lambda_um >= SPECTRAL_GRID_BOUNDS_UM[i] && lambda_um <= SPECTRAL_GRID_BOUNDS_UM[i + 1]) {
                return [SPECTRAL_GRID_BOUNDS_UM[i], SPECTRAL_GRID_BOUNDS_UM[i + 1]];
            }
        }
        return null;
    }

    // H2O : 6.3 μm et 17 μm ; CO2 : 11 μm et 15 μm ; CH4 : 7.7 μm et 23 μm ; Nuages EDS : corps gris (tout LW 4–50 μm)
    const CONST = window.CONST || {};
    const LAMBDA_H2O_1_UM = (CONST.LAMBDA_H2O_1 != null) ? CONST.LAMBDA_H2O_1 * 1e6 : 6.3;
    const LAMBDA_H2O_2_UM = (CONST.LAMBDA_H2O_2 != null) ? CONST.LAMBDA_H2O_2 * 1e6 : 17;
    const LAMBDA_CH4_1_UM = (CONST.LAMBDA_CH4_1 != null) ? CONST.LAMBDA_CH4_1 * 1e6 : 7.7;
    const LAMBDA_CO2_UM = (CONST.LAMBDA_CO2_CENTER != null) ? CONST.LAMBDA_CO2_CENTER * 1e6 : 15;
    const absorptionBands = [
        // color = crochets + fond alpha entre [ ] (v1.0.53) ; si '' → repli Hz2RGB au λ centre
        { lambda: LAMBDA_H2O_1_UM, halfWidthUm: 1, logo: LOGOS.H2O, logoImg: resolveLogoImg(LOGOS.H2O), label: 'H₂O', color: '#0099ff', spectralPairGroup: 'h2o', spectralPairIndex: 0 },
        { lambda: LAMBDA_H2O_2_UM, halfWidthUm: 1.5, logo: LOGOS.H2O, logoImg: resolveLogoImg(LOGOS.H2O), label: 'H₂O', color: '#0099ff', spectralPairGroup: 'h2o', spectralPairIndex: 1 },
        { lambda: LAMBDA_CH4_1_UM, halfWidthUm: 1, logo: LOGOS.CH4, logoImg: resolveLogoImg(LOGOS.CH4), label: 'CH₄', color: '#00ff99' },
        { lambda: 11, halfWidthUm: 1, logo: LOGOS.CO2, logoImg: resolveLogoImg(LOGOS.CO2), label: 'CO₂', color: '#ffff00' },
        { lambda: LAMBDA_CO2_UM, halfWidthUm: 2, logo: LOGOS.CO2, logoImg: resolveLogoImg(LOGOS.CO2), label: 'CO₂', color: '#ffff00' },
        { lambda: 23, halfWidthUm: 1.5, logo: LOGOS.CH4, logoImg: resolveLogoImg(LOGOS.CH4), label: 'CH₄', color: '#00ff99' },
        // Nuages EDS : LW 4–50 μm. SW = calculateAlbedo.
        { lambda: 27, halfWidthUm: 23, logo: LOGOS.CLOUDS, logoImg: resolveLogoImg(LOGOS.CLOUDS), label: 'Nuages', color: 'rgb(185, 185, 205)', fullSpan: true }
    ];

    const P_atm = (window.DATA && window.DATA['🫧'] && window.DATA['🫧']['🎈'] != null) ? window.DATA['🫧']['🎈'] : 1;
    const widthFactor = window.CONFIG_COMPUTE.pressureBroadening ? Math.min(2, Math.sqrt(Math.max(0.1, P_atm))) : 1;

    const PHYS = window.PHYS;
    const pdPlot = window.plotData;
    let TSurf = null;
    if (pdPlot) {
        if (pdPlot.temp_surface != null && Number.isFinite(pdPlot.temp_surface)) TSurf = pdPlot.temp_surface;
        else if (pdPlot.temp_surface_c != null && Number.isFinite(pdPlot.temp_surface_c) && CONST.KELVIN_TO_CELSIUS != null) {
            TSurf = pdPlot.temp_surface_c + CONST.KELVIN_TO_CELSIUS;
        }
    }
    const Teff = (pdPlot && pdPlot.current && pdPlot.current.effective_temperature != null && Number.isFinite(pdPlot.current.effective_temperature))
        ? pdPlot.current.effective_temperature : null;

    const epNamePlot = window.RUNTIME_STATE.currentEpochName;
    const scaleFactorPlot = (epNamePlot === 'Corps Noir' ? 1e12 : 1e13);
    function scaleYLocal(raw) {
        return raw / scaleFactorPlot;
    }

    function scaledYToWrapperTopPx(yScaled) {
        const ya = gd._fullLayout && gd._fullLayout.yaxis;
        if (!ya || yScaled == null || !Number.isFinite(yScaled)) return null;
        const r = ya.range;
        if (!r || r.length < 2) return null;
        const lo = Math.min(r[0], r[1]);
        const hi = Math.max(r[0], r[1]);
        if (hi <= lo) return null;
        const t = (hi - yScaled) / (hi - lo);
        const len = ya._length;
        const off = ya._offset;
        if (!Number.isFinite(len) || len <= 0 || !Number.isFinite(off)) return null;
        const yFromTopPlotDiv = off + t * len;
        return (plotRect.top - wrapperRect.top) + yFromTopPlotDiv;
    }

    function clampYToAxisRange(yScaled) {
        const ya = gd._fullLayout && gd._fullLayout.yaxis;
        if (!ya || yScaled == null || !Number.isFinite(yScaled) || !ya.range) return yScaled;
        const lo = Math.min(ya.range[0], ya.range[1]);
        const hi = Math.max(ya.range[0], ya.range[1]);
        return Math.max(lo, Math.min(hi, yScaled));
    }

    function planckScaledYAtLambdaUm(lambdaUm, T_K) {
        if (!PHYS || typeof PHYS.planckFunction !== 'function' || T_K == null || !Number.isFinite(T_K)) return null;
        const lamM = Number(lambdaUm) * 1e-6;
        if (!Number.isFinite(lamM) || lamM <= 0) return null;
        const raw = Math.PI * PHYS.planckFunction(lamM, T_K) * 1e6;
        return scaleYLocal(raw);
    }

    /** Borne haute de l’axe y luminance (pixel « haut » du tracé via scaledYToWrapperTopPx) */
    function yAxisLuminanceHi() {
        const ya = gd._fullLayout && gd._fullLayout.yaxis;
        if (!ya || !ya.range || ya.range.length < 2) return null;
        return Math.max(ya.range[0], ya.range[1]);
    }

    const bandRowBottomPx = axisMarginBottom + markersOffsetBelowAxis + bracketLiftPx;
    const fallbackTopFromWrapperTop = Math.max(0, (plotRect.top - wrapperRect.top) + (plotRect.height * 0.28));

    /** rgb(r,g,b) → rgba(...,a) (utilisé ailleurs si besoin ; fond des plages = bandFillRgbaFromLambdaUm) */
    function bracketRgbToRgba(rgbStr, alpha) {
        if (!rgbStr || typeof rgbStr !== 'string') return `rgba(120, 120, 130, ${alpha})`;
        const m = rgbStr.trim().match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*$/i);
        if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
        return rgbStr;
    }

    /** Repli : fond entre [ ] quand band.color absente ou non parsable (Hz2RGB au λ centre). */
    function bandFillRgbaFromLambdaUm(lambdaUm, alpha) {
        const lamM = Number(lambdaUm) * 1e-6;
        if (!Number.isFinite(lamM) || lamM <= 0) return `rgba(120, 120, 130, ${alpha})`;
        const [r, g, b] = wavelengthToColorReal(lamM);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /** Fond alpha aligné sur la couleur des crochets (#hex ou rgb) ; sinon bandFillRgbaFromLambdaUm(λ). */
    function bandBracketColorToFillRgba(colorStr, alpha, lambdaUmFallback) {
        if (colorStr && typeof colorStr === 'string') {
            const s = colorStr.trim();
            if (s.length) {
                if (s[0] === '#') {
                    const hex = s.slice(1);
                    let r; let g; let b;
                    if (hex.length === 3) {
                        r = parseInt(hex[0] + hex[0], 16);
                        g = parseInt(hex[1] + hex[1], 16);
                        b = parseInt(hex[2] + hex[2], 16);
                    } else if (hex.length === 6) {
                        r = parseInt(hex.slice(0, 2), 16);
                        g = parseInt(hex.slice(2, 4), 16);
                        b = parseInt(hex.slice(4, 6), 16);
                    } else {
                        return bandFillRgbaFromLambdaUm(lambdaUmFallback, alpha);
                    }
                    if ([r, g, b].every((x) => Number.isFinite(x))) {
                        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    }
                }
                const m = s.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*$/i);
                if (m) {
                    return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
                }
            }
        }
        return bandFillRgbaFromLambdaUm(lambdaUmFallback, alpha);
    }

    const bracketFs = 18;
    const rowH = 18;
    const fillBetweenAlpha = 0.26;
    const CFG_SPEC = window.CONFIG_COMPUTE || {};
    const spectralBandLogoImgPxDefault = Number.isFinite(Number(CFG_SPEC.spectralBandLogoImgPx))
        ? Number(CFG_SPEC.spectralBandLogoImgPx)
        : 18;
    const spectralBandLogoEmojiPx = Number.isFinite(Number(CFG_SPEC.spectralBandLogoEmojiPx))
        ? Number(CFG_SPEC.spectralBandLogoEmojiPx)
        : 18;
    const spectralBandLogoImgPxByEmoji = CFG_SPEC.spectralBandLogoImgPxByEmoji;
    function spectralBandImgPxForLogo(logoChar) {
        if (spectralBandLogoImgPxByEmoji && logoChar != null
            && Object.prototype.hasOwnProperty.call(spectralBandLogoImgPxByEmoji, logoChar)) {
            const v = Number(spectralBandLogoImgPxByEmoji[logoChar]);
            if (Number.isFinite(v) && v > 0) {
                return v;
            }
        }
        return spectralBandLogoImgPxDefault;
    }

    const lambdaEdsSunUm = Math.max(0.1, Math.min(50, (window.CONFIG_COMPUTE && Number.isFinite(Number(window.CONFIG_COMPUTE.spectralEdsSunLambdaUm)))
        ? Number(window.CONFIG_COMPUTE.spectralEdsSunLambdaUm)
        : 10));
    const stackLiftPx = (window.CONFIG_COMPUTE && Number.isFinite(Number(window.CONFIG_COMPUTE.spectralEdsSunStackLiftPx)))
        ? Number(window.CONFIG_COMPUTE.spectralEdsSunStackLiftPx)
        : 26;
    const ySurfScaledEds = (TSurf != null) ? planckScaledYAtLambdaUm(lambdaEdsSunUm, TSurf) : null;
    const yEffScaledEds = (Teff != null) ? planckScaledYAtLambdaUm(lambdaEdsSunUm, Teff) : null;
    let yEdsScaledForBands = null;
    if (ySurfScaledEds != null && Number.isFinite(ySurfScaledEds)) {
        if (yEffScaledEds != null && Number.isFinite(yEffScaledEds)) {
            yEdsScaledForBands = ySurfScaledEds + (1 / 4) * (yEffScaledEds - ySurfScaledEds);
        } else {
            yEdsScaledForBands = ySurfScaledEds;
        }
    }
    let topEdsForCloudBand = null;
    if (yEdsScaledForBands != null) {
        const yEdsClampedBands = clampYToAxisRange(yEdsScaledForBands);
        topEdsForCloudBand = scaledYToWrapperTopPx(yEdsClampedBands);
        if (topEdsForCloudBand == null) {
            topEdsForCloudBand = (plotRect.top - wrapperRect.top) + Math.max(8, plotRect.height - bandRowBottomPx - stackLiftPx - 40);
        }
    }
    const edsSpectralMarkerFontPx = 30;
    const cloudBandAboveEdsGapPx = 6;

    /** Étendue μm alignée sur la grille spectrale (ou plein spectre si fullSpan). */
    function absorptionBandGridExtents(band) {
        let leftUm;
        let rightUm;
        if (band.fullSpan) {
            leftUm = 4;
            rightUm = 50;
        } else {
            const segment = getGridSegmentForLambda(band.lambda);
            if (segment) {
                leftUm = segment[0];
                rightUm = segment[1];
            } else {
                const halfW = (band.halfWidthUm != null ? band.halfWidthUm : 1) * widthFactor;
                leftUm = Math.max(0.1, band.lambda - halfW);
                rightUm = Math.min(50, band.lambda + halfW);
            }
        }
        return { leftUm, rightUm };
    }

    function absorptionBandStackKey(band, leftUm, rightUm) {
        return band.fullSpan ? 'fullSpan' : String(leftUm) + '-' + String(rightUm);
    }

    const spectralBandStackStepPx = 28;
    const stackTotals = Object.create(null);
    absorptionBands.forEach(band => {
        const { leftUm, rightUm } = absorptionBandGridExtents(band);
        const k = absorptionBandStackKey(band, leftUm, rightUm);
        stackTotals[k] = (stackTotals[k] || 0) + 1;
    });
    const stackIndexNext = Object.create(null);

    absorptionBands.forEach(band => {
        const { leftUm, rightUm } = absorptionBandGridExtents(band);
        const xLeft = getXPosition(leftUm);
        const xRight = getXPosition(rightUm);
        const barWidthPx = Math.max(22, xRight - xLeft);

        const logoEmojiPx = spectralBandLogoEmojiPx;
        const logoImgPx = band.logoImg ? spectralBandImgPxForLogo(band.logo) : logoEmojiPx;
        const rowBand = Math.max(rowH, band.logoImg ? logoImgPx : logoEmojiPx);
        const bracketFsBand = Math.max(bracketFs, Math.min(24, Math.round(rowBand * 0.95)));

        const altText = band.fullSpan
            ? `Nuages (corps gris) absorption sur tout le spectre [${leftUm} - ${rightUm}] μm`
            : `${band.label} captation [${leftUm.toFixed(1)} - ${rightUm.toFixed(1)}] μm`;

        // Créer un indicateur de plage [ ... ] + logo centré (sans fond, pour éviter l'artefact visuel)
        const indicator = document.createElement('div');
        indicator.className = 'absorption-band-indicator';
        indicator.style.position = 'absolute';
        indicator.style.left = `${xLeft}px`;
        indicator.style.width = `${barWidthPx}px`;
        // Y : nuages = exception ; sinon Planck au λ de la bande (pas au milieu du bin — évite même hauteur pour 15 vs 17 μm)
        const lambdaPhysicsUm = band.fullSpan ? (leftUm + rightUm) / 2 : band.lambda;
        let topBand = null;
        if (band.fullSpan) {
            if (topEdsForCloudBand != null && Number.isFinite(topEdsForCloudBand)) {
                const halfEds = edsSpectralMarkerFontPx / 2;
                const halfRow = rowBand / 2;
                topBand = topEdsForCloudBand + halfEds + cloudBandAboveEdsGapPx - halfRow;
            } else {
                const yHi = yAxisLuminanceHi();
                if (yHi != null) {
                    const yClamped = clampYToAxisRange(yHi);
                    const px = scaledYToWrapperTopPx(yClamped);
                    if (px != null && Number.isFinite(px)) {
                        topBand = px - 6;
                    }
                }
                if (topBand == null || !Number.isFinite(topBand)) {
                    topBand = Math.max(0, (plotRect.top - wrapperRect.top) + 2);
                }
            }
        } else {
            const ySol = (TSurf != null) ? planckScaledYAtLambdaUm(lambdaPhysicsUm, TSurf) : null;
            const yEspace = (Teff != null) ? planckScaledYAtLambdaUm(lambdaPhysicsUm, Teff) : null;
            let yMid = null;
            if (ySol != null && yEspace != null) {
                yMid = (ySol + yEspace) / 2;
            } else if (ySol != null) {
                yMid = ySol;
            } else if (yEspace != null) {
                yMid = yEspace;
            }
            if (yMid != null) {
                const yClamped = clampYToAxisRange(yMid);
                topBand = scaledYToWrapperTopPx(yClamped);
            }
        }
        if (topBand != null && Number.isFinite(topBand)) {
            const sk = absorptionBandStackKey(band, leftUm, rightUm);
            const st = stackTotals[sk] || 1;
            let si = stackIndexNext[sk] || 0;
            stackIndexNext[sk] = si + 1;
            topBand += (si - (st - 1) / 2) * spectralBandStackStepPx;
            if (band.spectralPairGroup === 'h2o' && (band.spectralPairIndex === 0 || band.spectralPairIndex === 1)) {
                const pairGapPx = Math.max(bracketFsBand, rowBand, bracketFs) + 2;
                topBand += (band.spectralPairIndex - 0.5) * pairGapPx;
            }
            indicator.style.top = `${topBand}px`;
            indicator.style.bottom = 'auto';
            indicator.style.transform = 'translateY(-50%)';
        } else {
            const markerOffset = band.fullSpan ? markerOffsetAboveAxis : (markersOffsetBelowAxis + bracketLiftPx);
            indicator.style.bottom = `${axisMarginBottom + markerOffset}px`;
            indicator.style.top = '';
            indicator.style.transform = '';
        }
        indicator.style.background = 'transparent';
        indicator.style.borderRadius = '4px';
        indicator.style.fontSize = `${bracketFsBand}px`;
        indicator.style.zIndex = band.fullSpan ? '1005' : '1000';
        indicator.style.pointerEvents = 'auto';
        indicator.style.cursor = 'default';
        indicator.style.display = 'flex';
        indicator.style.alignItems = 'center';
        indicator.style.justifyContent = 'center';
        indicator.style.color = band.color;
        indicator.style.textShadow = '0 0 2px rgba(0, 0, 0, 0.8)';
        indicator.style.height = `${rowBand}px`;
        indicator.style.lineHeight = `${rowBand}px`;

        const fillRgba = bandBracketColorToFillRgba(band.color, fillBetweenAlpha, lambdaPhysicsUm);
        // PNG (charsImages) : taille CONFIG (défaut > emoji) ; emoji : spectralBandLogoEmojiPx
        let logoHTML = '';
        if (band.logoImg) {
            logoHTML = `<img src="${band.logoImg}" alt="${altText}" title="${altText}" style="width: ${logoImgPx}px; height: ${logoImgPx}px; display: block; margin: 0 auto; object-fit: contain; vertical-align: middle;">`;
        } else {
            logoHTML = `<span role="img" aria-label="${altText}" title="${altText}" style="font-size:${logoEmojiPx}px;line-height:${rowBand}px;">${band.logo}</span>`;
        }
        // [ ] sous le picto : crochets z-index 0 ; bloc fond+picto z-index 2 (picto au-dessus du fond)
        indicator.innerHTML = `<span aria-hidden="true" style="position:absolute;left:0;top:50%;transform:translateY(-50%);color:${band.color};font-weight:700;font-size:${bracketFsBand}px;line-height:${rowBand}px;z-index:0;">[</span>` +
            `<span style="position:relative;z-index:2;display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:${rowBand}px;">` +
            `<span aria-hidden="true" style="position:absolute;left:6px;right:6px;top:50%;transform:translateY(-50%);height:${rowBand}px;background:${fillRgba};border-radius:3px;z-index:0;pointer-events:none;"></span>` +
            `<span style="position:relative;z-index:1;display:flex;align-items:center;justify-content:center;">${logoHTML}</span></span>` +
            `<span aria-hidden="true" style="position:absolute;right:0;top:50%;transform:translateY(-50%);color:${band.color};font-weight:700;font-size:${bracketFsBand}px;line-height:${rowBand}px;z-index:0;">]</span>`;

        applySpectralIndicatorsGhostStyle(indicator);
        plotContainerWrapper2.appendChild(indicator);
    });

    // EDS + Terre (λ fixe spectralEdsSunUm) : Y EDS = sol + Δ/4 ; Y Terre = ½·Planck(T_eff) (échelle traces, sémantique Y inversée vs « ciel »)
    let edsSunColor = getDefaultTextColor();
    if (typeof window !== 'undefined' && window.currentBlackBodyColor) {
        edsSunColor = window.currentBlackBodyColor;
    } else if (window.plotData && typeof window.plotData.temp_surface_c === 'number') {
        edsSunColor = PLOT.tempSurfaceToColor(window.plotData.temp_surface_c);
    }

    const xAxisMark = getXPosition(lambdaEdsSunUm);

    const ySurfScaled = ySurfScaledEds;
    const yEffScaled = yEffScaledEds;
    /** EDS : près de Planck(sol) ; descend d’un quart de l’écart sol ↔ espace sur l’axe Y */
    const yEdsScaled = yEdsScaledForBands;
    /** Soleil : 0,5 × ordonnée Planck(T_eff) à ce λ (= milieu entre y=0 et courbe espace, « y/2 ») */
    let ySunScaled = null;
    if (yEffScaled != null && Number.isFinite(yEffScaled)) {
        ySunScaled = yEffScaled / 2;
    }

    function placeSpectralMarker(extraClass, titleText, topPx) {
        const topUse = (topPx != null && Number.isFinite(topPx)) ? topPx : fallbackTopFromWrapperTop;
        const el = document.createElement('div');
        el.className = `spectral-eds-marker ${extraClass}`;
        el.style.position = 'absolute';
        el.style.left = `${xAxisMark}px`;
        el.style.top = `${topUse}px`;
        el.style.transform = 'translate(-50%, -50%)';
        el.style.zIndex = '1001';
        el.style.pointerEvents = 'none';
        el.style.lineHeight = '1';
        el.title = titleText;
        return el;
    }

    if (yEdsScaled != null) {
        const yEdsClamped = clampYToAxisRange(yEdsScaled);
        let topEds = scaledYToWrapperTopPx(yEdsClamped);
        if (topEds == null) {
            topEds = (plotRect.top - wrapperRect.top) + Math.max(8, plotRect.height - bandRowBottomPx - stackLiftPx - 40);
        }
        const divEds = placeSpectralMarker('spectral-eds-marker--eds', 'EDS — Planck(sol) + (Planck(eff)−Planck(sol))/4 à ' + lambdaEdsSunUm + ' μm', topEds);
        divEds.style.fontSize = edsSpectralMarkerFontPx + 'px';
        divEds.style.color = edsSunColor;
        divEds.style.fontFamily = 'var(--font-emoji, \'Apple Color Emoji\', \'Noto Color Emoji\', \'Segoe UI Emoji\', sans-serif)';
        divEds.style.textShadow = '0 0 2px rgba(0,0,0,0.85)';
        divEds.textContent = (window.LOGOS && window.LOGOS.EDS) || (window.CHARS && window.CHARS.EDS) || '📛';
        applySpectralIndicatorsGhostStyle(divEds);
        plotContainerWrapper2.appendChild(divEds);
    }

    if (ySunScaled != null) {
        const ySunClamped = clampYToAxisRange(ySunScaled);
        let topSun = scaledYToWrapperTopPx(ySunClamped);
        if (topSun == null) {
            topSun = (plotRect.top - wrapperRect.top) + Math.max(8, plotRect.height - bandRowBottomPx - 8);
        }
        const divEarth = placeSpectralMarker('spectral-eds-marker--earth', 'Terre (émission vue de l’espace) — ½·Planck(T_eff) à ' + lambdaEdsSunUm + ' μm ; axe Y sémantique inversé vs intuition « ciel »', topSun);
        const earthEmoji = (window.LOGOS && window.LOGOS.GLOBE_AFRICA) || (window.LOGOS && window.LOGOS.GLOBE_AMERICAS) || (window.LOGOS && window.LOGOS.GLOBE_ASIA) || '🌍';
        const earthSrc = window.getLogoImageSrc(earthEmoji);
        if (earthSrc) {
            const img = document.createElement('img');
            img.src = earthSrc;
            img.alt = 'Terre';
            img.width = 40;
            img.height = 40;
            img.style.display = 'block';
            img.style.objectFit = 'contain';
            img.style.filter = 'drop-shadow(0 0 1px rgba(0,0,0,0.9))';
            divEarth.appendChild(img);
        } else {
            divEarth.style.fontSize = '32px';
            divEarth.style.color = edsSunColor;
            divEarth.style.fontFamily = 'var(--font-emoji, \'Apple Color Emoji\', \'Noto Color Emoji\', \'Segoe UI Emoji\', sans-serif)';
            divEarth.textContent = earthEmoji;
        }
        applySpectralIndicatorsGhostStyle(divEarth);
        plotContainerWrapper2.appendChild(divEarth);
    }

    window.syncPlotContainerOrganigramHideClasses();
}

PLOT.updatePlot = function updatePlot(data) {
    const traces = [];
    let maxYPlanckSurfaceSol = 0;

    if (!data.lambda_range) return;

    const lambda_range = data.lambda_range;
    const epochName = window.RUNTIME_STATE.currentEpochName;
    const isHadeen = (epochName === 'Hadéen');
    const scaleFactor = (epochName === 'Corps Noir' ? 1e12 : 1e13);
    const scaleLabel = (epochName === 'Corps Noir' ? ' ×10¹²' : ' ×10¹³');
    const scaleY = (y) => y / scaleFactor;

    if (epochName !== lastEpochForScale) {
        lastEpochForScale = epochName;
        lastGoodYMaxLuminance = null;
    }
    const lambda_planck = lambda_range.map(l => l * 1e6); // Convertir en μm
    // ⚡ Même formule que calculations.js : effective_delta_lambda = (λ_max - λ_min) / (n-1)
    const lambda_span = lambda_range.length > 1 ? lambda_range[lambda_range.length - 1] - lambda_range[0] : 1e-6;
    const effective_delta_lambda_base = lambda_range.length > 1 ? lambda_span / (lambda_range.length - 1) : 1e-6;
    if (!data.lambda_weights) {
        console.error('[updatePlot] ❌ ERREUR CRITIQUE : lambda_weights manquant');
        throw new Error('lambda_weights requis dans data');
    }
    const lambda_weights = data.lambda_weights;

    // Fonction helper pour créer une trace de flux observé (absorption)
    function createFluxTrace(flux_data, co2_ppm, temp_eff, color, label) {
        // ⚡ CORRECTION : Normaliser avec la largeur effective de chaque point
        // Le flux calculé utilise delta_lambda * lambda_weights[j] dans calculations.js
        // Donc on doit diviser par la même valeur pour obtenir W/m²/μm
        const topFlux = flux_data.upward_flux[flux_data.upward_flux.length - 1];
        
        // Vérifier que les longueurs correspondent
        if (topFlux.length !== lambda_range.length) {
            console.error(`[updatePlot] ❌ ERREUR CRITIQUE : Longueurs incompatibles - topFlux: ${topFlux.length}, lambda_range: ${lambda_range.length}, lambda_weights: ${lambda_weights.length}`);
            // Ajuster la longueur de topFlux pour correspondre à lambda_range (tronquer ou compléter)
            if (topFlux.length > lambda_range.length) {
                console.warn(`[updatePlot] ⚠️ Troncature de topFlux de ${topFlux.length} à ${lambda_range.length} éléments`);
                topFlux.length = lambda_range.length;
            } else {
                console.error(`[updatePlot] ❌ ERREUR : topFlux (${topFlux.length}) < lambda_range (${lambda_range.length})`);
                throw new Error(`Longueurs incompatibles : topFlux (${topFlux.length}) < lambda_range (${lambda_range.length})`);
            }
        }
        if (lambda_weights.length !== lambda_range.length) {
            console.error(`[updatePlot] ❌ ERREUR CRITIQUE : Longueurs incompatibles - lambda_weights: ${lambda_weights.length}, lambda_range: ${lambda_range.length}`);
            throw new Error(`Longueurs incompatibles : lambda_weights (${lambda_weights.length}) != lambda_range (${lambda_range.length})`);
        }
        
        const flux = topFlux
            .map((f, idx) => {
                if (lambda_weights[idx] === undefined) {
                    console.error(`[updatePlot] ❌ ERREUR CRITIQUE : lambda_weights[${idx}] manquant`);
                    throw new Error(`lambda_weights[${idx}] requis`);
                }
                const band_width_m = effective_delta_lambda_base * lambda_weights[idx];
                const raw = (f / band_width_m) * 1e6;
                return scaleY(raw);
            });

        // Lissage visuel uniquement (affichage), sans impact sur les calculs physiques.
        // Fenêtre centrée en nombre de bins (ex: 20 = moyenne sur 20 points).
        function movingAverageSmooth(values, windowBinsRaw) {
            const n = values.length;
            const windowBins = Math.max(1, Math.round(windowBinsRaw));
            const before = Math.floor((windowBins - 1) / 2);
            const after = windowBins - 1 - before;
            return values.map(function (_, i) {
                const start = Math.max(0, i - before);
                const end = Math.min(n - 1, i + after);
                let sum = 0;
                let count = 0;
                for (let j = start; j <= end; j++) {
                    sum += values[j];
                    count++;
                }
                return sum / count;
            });
        }
        const smoothEnabled = window.CONFIG_COMPUTE.plotSmoothEnable;
        const smoothWindowBins = window.CONFIG_COMPUTE.plotSmoothSigmaBins;
        const fluxDisplay = smoothEnabled ? movingAverageSmooth(flux, smoothWindowBins) : flux;
        // Tooltip : 0 ppm = libellé générique ; sinon T_eff = température du corps noir de même ∫ que cette OLR (cohérent avec courbe pointillée)
        let hoverText;
        if (co2_ppm === 0) {
            hoverText = "Courbe d'équilibre d'émission de la terre";
        } else if (temp_eff) {
            const tempC = (temp_eff - CONST.KELVIN_TO_CELSIUS).toFixed(1);
            hoverText = `OLR spectrale (même aire ∫ que corps noir pointillé), T_eff ${temp_eff.toFixed(1)} K (${tempC}°C)`;
        } else {
            hoverText = "Courbe d'équilibre d'émission de la terre";
        }

        return {
            x: lambda_planck,
            y: fluxDisplay,
            type: 'scatter',
            mode: 'lines',
            name: label,
            line: { color: color, width: 2 },
            hovertemplate: hoverText + '<extra></extra>'
        };
    }

    function createPlanckTrace(T, label, color, showInLegend = false, dashPattern = 'dash') {
        const planck = data.lambda_range.map(l => {
            if (typeof PHYS.planckFunction !== 'function') {
                console.error('[updatePlot] ❌ ERREUR CRITIQUE : planckFunction non disponible');
                throw new Error('planckFunction requise');
            }
            const raw = Math.PI * PHYS.planckFunction(l, T) * 1e6;
            return scaleY(raw);
        });
        // Utiliser la couleur fournie (noir pour les références, couleur de l'absorption pour la courbe courante)
        const lineColor = color || 'black';

        // Tooltip : "Courbe d'émission du corps noir" avec température (le corps noir est par définition à l'équilibre)
        const tempC = (T - CONST.KELVIN_TO_CELSIUS).toFixed(1);
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

    // 1. Afficher uniquement les courbes utiles colorées (sans étalons blancs)
    let T_current_display = null; // Pour l'affichage de la température de surface (rouge)
    let T_effective_display = null; // Pour l'affichage de la température effective (cyan)
    let color_current = 'red'; // Par défaut, pour la légende de température
    if (data.current) {
        // Récupérer temp_surface_c depuis data pour l'affichage (cohérence avec le flux)
        const temp_surface_c = data.temp_surface_c;

        // Utiliser temp_surface (T0) pour les courbes ET l'affichage (cohérence totale)
        // temp_surface est la température réelle au sol (T0_test), calculée par dichotomie pour équilibrer le bilan énergétique
        // effective_temperature est la température du corps noir équivalent qui émettrait le même flux total vers l'espace
        // La différence vient de l'effet de serre : le flux émis vers l'espace vient de différentes altitudes (plus froid en altitude)
        // Dans une atmosphère avec effet de serre, la surface est plus chaude que la température effective
        // Récupérer temp_surface depuis data (T0_test en K) ou calculer depuis temp_surface_c
        const T_surface = (data.temp_surface !== undefined) ? data.temp_surface :
            (temp_surface_c !== undefined ? temp_surface_c + CONST.KELVIN_TO_CELSIUS : data.current.effective_temperature);
        const T_current = T_surface; // Utiliser la température de surface pour les courbes (cohérence avec affichage)
        // Pour l'affichage dans le graphique, utiliser la même température que les courbes (cohérence totale)
        T_current_display = T_current;

        // Température effective (sommet atm.) pour affichage cyan uniquement ; courbes = T surface (cohérence organigramme)
        T_effective_display = data.current.effective_temperature;

        // Déterminer la couleur selon la température terrestre (T° Terrestre)
        // 🔒 Priorité 1 : Utiliser window.currentBlackBodyColor si défini (couleur anticipée avec t0)
        // Cette couleur est mise à jour dans setEpoch avant les calculs, et dans finalizeResults après convergence
        if (typeof window !== 'undefined' && window.currentBlackBodyColor) {
            color_current = window.currentBlackBodyColor;
        } else if (temp_surface_c !== undefined) {
            color_current = PLOT.tempSurfaceToColor(temp_surface_c);
        } else {
            // Fallback : utiliser l'ancienne logique basée sur le ppm
            if (data.co2_ppm === 0) color_current = 'cyan';
            else if (Math.abs(data.co2_ppm - 280) < 1) color_current = 'green';
            else if (Math.abs(data.co2_ppm - 420) < 1) color_current = 'gray';
        }

        // Corps noir au sol : Planck(T_surface), tirets — même couleur dynamique que la courbe spectrale (pas les étalons blancs)
        const _teffForDup = T_effective_display;
        const _skipSurfacePlanckDup = (_teffForDup != null && Number.isFinite(_teffForDup) && Number.isFinite(T_surface)
            && Math.abs(T_surface - _teffForDup) <= 0.25);
        if (Number.isFinite(T_surface) && !_skipSurfacePlanckDup) {
            const planck_surface = createPlanckTrace(T_surface, `Planck sol ${data.co2_ppm.toFixed(0)} ppm`, color_current, false, 'dash');
            planck_surface.line.width = 2;
            const tempCSurf = (T_surface - CONST.KELVIN_TO_CELSIUS).toFixed(1);
            planck_surface.hovertemplate = `Corps noir au sol : ${T_surface.toFixed(1)} K (${tempCSurf}°C)<extra></extra>`;
            planck_surface.y.forEach((v) => { if (v > maxYPlanckSurfaceSol) maxYPlanckSurfaceSol = v; });
            traces.push(planck_surface);
        }

        const tempHoverOlrEquiv = (T_effective_display != null && Number.isFinite(T_effective_display))
            ? T_effective_display
            : T_current;
        const trace_absorption = createFluxTrace(data.current, data.co2_ppm, tempHoverOlrEquiv, color_current,
            `${data.co2_ppm.toFixed(0)} ppm (absorption)`);
        trace_absorption.showlegend = false; // Pas dans la légende
        traces.push(trace_absorption);

        // Courbe pointillée = corps noir à la T° effective (même fenêtre que la courbe pleine, plancher thermodynamique)
        const color_effective = color_current;

        const planck_current = createPlanckTrace(T_effective_display, `Planck effective ${data.co2_ppm.toFixed(0)} ppm`, color_effective, false, 'dot');
        planck_current.line.width = 2; // En gras
        planck_current.line.color = color_effective; // Même couleur que la courbe pleine
        traces.push(planck_current);
        
        // 🔒 Mettre à jour la couleur globale de la courbe du corps noir (accessible partout)
        if (typeof window !== 'undefined' && typeof window.updateBlackBodyColor === 'function') {
            window.updateBlackBodyColor(color_effective);
        }
    }

    // 2. Ajouter une trace invisible pour forcer la création de l'axe yaxis2 (altitude)
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

    // 3. Ajouter une ligne horizontale pour la tropopause (calculée dynamiquement)
    // Calculer la tropopause en fonction de T0 (température de surface)
    // T0 = température de surface (cohérence organigramme / légende) pour tropopause et annotations
    let T0;
    let has_temperature = false;
    if (data.temp_surface !== undefined) {
        T0 = data.temp_surface;
        has_temperature = true;
    } else if (data.temp_surface_c !== undefined) {
        T0 = data.temp_surface_c + CONST.KELVIN_TO_CELSIUS;
        has_temperature = true;
    } else if (data.current && data.current.T0 !== undefined) {
        T0 = data.current.T0;
        has_temperature = true;
    } else if (data.current && data.current.effective_temperature !== undefined) {
        T0 = data.current.effective_temperature;
        has_temperature = true;
    }

    // Calculer la tropopause dynamiquement (seulement si T0 est disponible)
    let z_trop_m;
    let z_trop_km;
    let delta_T_trop_strato = null; // Différence de température entre tropopause et stratosphère
    if (has_temperature) {
        if (window.RUNTIME_STATE.currentEpochName === 'Corps Noir') {
            z_trop_m = 0;
            z_trop_km = 0;
        } else {
            z_trop_m = window.ATM.calculateTropopauseHeight();
            z_trop_km = z_trop_m / 1000; // Convertir en km
            
            // Calculer la différence de température entre tropopause et stratosphère
            // Gradient de température : Gamma = -0.0065 K/m (par défaut)
            let Gamma = -0.0065;
            if (window.RUNTIME_STATE.currentEpochName && window.GEOLOGY) {
                const currentEpoch = window.GEOLOGY.getGeologicalPeriodByName(window.RUNTIME_STATE.currentEpochName);
                if (currentEpoch) {
                    if (typeof currentEpoch.lapse_rate === 'number') {
                        Gamma = currentEpoch.lapse_rate;
                    } else if (currentEpoch.gravity || currentEpoch['🍎']) {
                        Gamma = -0.0065 * ((currentEpoch.gravity || currentEpoch['🍎']) / 9.81);
                    }
                }
            }
            // La différence entre surface et tropopause : T0 - T_trop = -Gamma * z_trop
            delta_T_trop_strato = -Gamma * z_trop_m; // Différence en Kelvin
        }
    } else {
        // Pas de température disponible (initialisation) : pas de tropopause à afficher
        z_trop_km = null;
    }
    
    // Exposer z_trop_km et delta_T globalement pour drawSpectralVisualization
    if (z_trop_km !== null) {
        window.current_z_trop_km = z_trop_km;
        window.current_delta_T_trop_strato = delta_T_trop_strato;
    }

    // Calculer z_max_km pour l'axe Y (dynamique selon l'époque et la physique)
    let z_max_km;
    let scale_height_m;
    let has_atmosphere = true; // Flag pour détecter le cas "pas d'atmosphère"

    const currentEpoch = resolvePlotTimelineEpoch();

    const total_atmosphere_mass_kg = currentEpoch['⚖️🫧'];
    if (total_atmosphere_mass_kg === undefined) {
        console.error('[updatePlot] ❌ ERREUR CRITIQUE : ⚖️🫧 non défini pour l\'époque:', window.RUNTIME_STATE.currentEpochName);
        throw new Error(`⚖️🫧 non défini pour l'époque '${window.RUNTIME_STATE.currentEpochName}'`);
    }

    if (total_atmosphere_mass_kg === 0) {
        has_atmosphere = false;
        z_max_km = 0.001; // Très petit pour éviter les calculs inutiles (1 mètre)
    } else {
        const gravityVal = currentEpoch.gravity !== undefined ? currentEpoch.gravity : currentEpoch['🍎'];
        if (gravityVal === undefined || gravityVal <= 0) {
            console.error('[updatePlot] ❌ ERREUR CRITIQUE : gravity non défini pour l\'époque:', window.RUNTIME_STATE.currentEpochName);
            throw new Error(`gravity non défini pour l'époque '${window.RUNTIME_STATE.currentEpochName}'`);
        }
        // Calculer molar_mass_air depuis les composants si non défini dans la config
        let molar_mass_air = currentEpoch.molar_mass_air;
        if (molar_mass_air === undefined) {
            molar_mass_air = window.ATM.calculateMolarMassAir(currentEpoch);
        }
        // Fallback si toujours undefined ou 0
        if (molar_mass_air === undefined || molar_mass_air === 0) {
            // Estimation basée sur la masse atmosphérique (Hadéen = CO2 dense, moderne = N2/O2)
            const isMassive = total_atmosphere_mass_kg > 2.5e19;
            molar_mass_air = isMassive ? 0.044 : 0.029;
        }

        // T0 peut être indisponible lors de l'initialisation (pendant la dichotomie)
        // Utiliser initial_temperature_K de la config de l'époque comme fallback
        let T0_to_use = T0;
        if (!has_temperature) {
            // Récupérer initial_temperature_K depuis la config de l'époque
            if (currentEpoch && typeof currentEpoch.initial_temperature_K === 'number' && currentEpoch.initial_temperature_K > 0) {
                T0_to_use = currentEpoch.initial_temperature_K;
            } else {
                // Fallback : estimation T_eff = (S/4·(1-A)/σ)^0.25 (CONST = physics.js)
                const CONST = window.CONST;
                const albedo_est = 0.3;
                const flux_absorbed = (CONST.SOLAR_CONSTANT / 4) * (1 - albedo_est);
                T0_to_use = Math.pow(flux_absorbed / CONST.STEFAN_BOLTZMANN, 0.25);
            }
        }
        const props = window.ATM.calculateAtmosphereProperties(total_atmosphere_mass_kg, T0_to_use, molar_mass_air, gravityVal);
        z_max_km = props.z_max / 1000;
        scale_height_m = props.scale_height;
    }

    // Détecter si on a une atmosphère nulle ou quasi-nulle (Corps noir)
    const isNoAtmosphere = z_max_km < 0.1; // Seuil : moins de 100m = pas d'atmosphère


    // Mettre à jour la trace invisible pour l'échelle
    // Note: On doit modifier la trace existante ou s'assurer qu'elle est créée avec les bonnes valeurs
    // Comme on recrée 'traces' à chaque fois ici, on ajuste juste la création de la trace axe altitude ci-dessus/dessous.

    // CORRECTION: La trace invisible a été créée AVANT ce bloc (lignes ~861). 
    // On doit la retrouver et la modifier, ou mieux, déplacer sa création APRÈS ce calcul.
    // Pour minimiser les diffs risqués, on va chercher la trace "Axe altitude" dans le tableau traces et la modifier.
    const axisTrace = traces.find(t => t.name === 'Axe altitude');
    if (axisTrace) {
        axisTrace.y = [0, z_max_km];
    } else {
        // Si pas trouvée (ex: créée plus bas dans une autre version), on la crée ici
        traces.push({
            x: [0, 0], // Points invisibles à x=0
            y: [0, z_max_km], // De 0 à z_max_km
            type: 'scatter',
            mode: 'lines',
            name: 'Axe altitude',
            line: { color: 'rgba(0,0,0,0)', width: 0 }, // Invisible
            showlegend: false,
            hoverinfo: 'skip',
            yaxis: 'y2' // Utiliser l'axe secondaire (altitude)
        });
    }
    // ⚠️ IMPORTANT : Ne pas écraser z_max_km si on a détecté "pas d'atmosphère"
    // Pendant la convergence (calculationInProgress) : garder une échelle FIXE pour éviter que la barre
    // bouge à chaque cycle. data.z_range varie (300→1830 km). On fixe au premier appel de la dichotomie.
    const isDichotomy = typeof window !== 'undefined' && window.SYNC_STATE.calculationInProgress;
    if (has_atmosphere) {
        if (isDichotomy) {
            if (window._dichotomyZMaxKm != null && Number.isFinite(window._dichotomyZMaxKm)) {
                z_max_km = window._dichotomyZMaxKm;
            } else {
                window._dichotomyZMaxKm = z_max_km; // Premier appel : figer l'échelle
            }
        } else {
            window._dichotomyZMaxKm = null; // Reset à la fin
            if (data.z_range && data.z_range.length > 0) {
                const z_max = data.z_range[data.z_range.length - 1];
                z_max_km = z_max / 1000;
            } else {
            // z_range non disponible (init) — même entrée epoch que le bloc z_max (👉 / TIMELINE)
            if (currentEpoch) {
                const total_atmosphere_mass_kg = currentEpoch['⚖️🫧']; // Nom plus explicite

                const gravity = currentEpoch.gravity !== undefined ? currentEpoch.gravity : (currentEpoch['🍎'] !== undefined ? currentEpoch['🍎'] : 9.81);

                let molar_mass = currentEpoch.molar_mass_air;
                if (molar_mass === undefined) {
                    molar_mass = window.ATM.calculateMolarMassAir(currentEpoch);
                }
                if (molar_mass === undefined) {
                    if (total_atmosphere_mass_kg > 2.5e19) molar_mass = 0.044;
                    else molar_mass = 0.029;
                }

                // T0 peut être indisponible lors de l'initialisation (pendant la dichotomie)
                // Utiliser initial_temperature_K de la config de l'époque comme fallback
                let T0_to_use_fallback = T0;
                if (!has_temperature) {
                    // Récupérer initial_temperature_K depuis la config de l'époque
                    if (currentEpoch && typeof currentEpoch.initial_temperature_K === 'number' && currentEpoch.initial_temperature_K > 0) {
                        T0_to_use_fallback = currentEpoch.initial_temperature_K;
                    } else {
                        // Fallback : estimation T_eff = (S/4·(1-A)/σ)^0.25 (CONST = physics.js)
                        const CONST = window.CONST;
                        const albedo_est = 0.3;
                        const flux_absorbed = (CONST.SOLAR_CONSTANT / 4) * (1 - albedo_est);
                        T0_to_use_fallback = Math.pow(flux_absorbed / CONST.STEFAN_BOLTZMANN, 0.25);
                    }
                }
                const props = window.ATM.calculateAtmosphereProperties(total_atmosphere_mass_kg, T0_to_use_fallback, molar_mass, gravity);
                z_max_km = props.z_max / 1000;
            }
        }
        }
    } else {
    }

    // EXPOSER GLOBALEMENT pour drawSpectralVisualization (si besoin) ou stocker dans data
    // Pour l'instant, on passe z_max_km et z_trop_km via l'objet data ou une variable globale si drawSpectralVisualization en a besoin
    // Mais drawSpectralVisualization recalcule ses propres échelles
    if (typeof window !== 'undefined') {
        window.current_z_trop_km = z_trop_km; // Exposer pour autres fonctions (peut être null)
    }

    // Ajouter la ligne de tropopause seulement si z_trop_km est disponible
    if (z_trop_km !== null) {
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
    }

    // Utiliser z_trop_km pour l'annotation (peut être null si pas de température)
    const annotation_z_trop_km = z_trop_km;
    
    // Préparer le texte de l'annotation avec la différence de température calculée
    // Plotly n'interprète pas le HTML complexe, on utilise du texte simple avec <br>
    let annotation_text = 'Stratosphère<br>--<br>Troposphère';
    if (annotation_z_trop_km !== null && delta_T_trop_strato !== null) {
        annotation_text = `Stratosphère<br>${delta_T_trop_strato.toFixed(1)} K<br>Troposphère`;
    }

    // --- CALCUL ÉCHELLE Y : pic Planck(T sol) tirets ≈ Y_AXIS_PEAK_FRACTION_SOL hauteur ; max Y hors Planck ref. blancs (sinon 315 K écrase l’échelle) ; après action on recalc au ProcessFinished (FLUX.yAxisRecalcOnNextFinish) ---
    // Si la courbe réelle est <20% du max actuel (changement d'ordre de grandeur), recalculer l'échelle
    let maxYInTraces = 0;
    traces.forEach(t => {
        if (t.yaxis === 'y2') return;
        const lc = t.line && t.line.color;
        if (typeof lc === 'string' && lc.toLowerCase() === 'white') return;
        t.y.forEach(v => { if (v > maxYInTraces) maxYInTraces = v; });
    });
    const minY = Number.isFinite(window.FLUX.minYMaxLuminance) ? window.FLUX.minYMaxLuminance : 0.5;
    const isConverged = (typeof window.RUNTIME_STATE.spectralConverged !== 'undefined' && window.RUNTIME_STATE.spectralConverged);
    const forceRecalcY = window.FLUX.yAxisRecalcOnNextFinish;
    const forcedRecalcThisPass = !!forceRecalcY;
    let y_max_luminance;

    if (lastGoodYMaxLuminance != null && !isConverged && !forceRecalcY) {
        y_max_luminance = lastGoodYMaxLuminance;
    } else {
        if (forceRecalcY) window.FLUX.yAxisRecalcOnNextFinish = false;
        let T_est = 255;
        if (window.GEOLOGY) {
            const ep = window.GEOLOGY.getGeologicalPeriodByName(epochName);
            if (ep && typeof ep['🌡️🧮'] === 'number') T_est = ep['🌡️🧮'];
        } else if (window.TIMELINE) {
            const item = window.TIMELINE.find(e => e['📅'] && (e.name === epochName || (e.epochName === epochName)));
            if (item && typeof item['🌡️🧮'] === 'number') T_est = item['🌡️🧮'];
        }
        if (epochName === 'Hadéen' && T_est === 255) T_est = 2450;
        let maxPlanck = 0;
        if (typeof PHYS.planckFunction === 'function') {
            data.lambda_range.forEach(l => {
                const v = Math.PI * PHYS.planckFunction(l, T_est) * 1e6;
                if (v > maxPlanck) maxPlanck = v;
            });
        }
        const maxScaled = scaleY(maxPlanck);
        let y_raw = maxScaled / Y_AXIS_PEAK_FRACTION_SOL;
        if (y_raw < 5) {
            y_max_luminance = Math.max(0.5, Math.ceil(y_raw * 2) / 2);
        } else if (y_raw < 100) {
            y_max_luminance = Math.max(5, Math.ceil(y_raw / 5) * 5);
        } else {
            y_max_luminance = Math.ceil(y_raw / 100) * 100;
        }
        y_max_luminance = Math.max(minY, y_max_luminance);
        lastGoodYMaxLuminance = y_max_luminance;
    }
    // Ordre de grandeur : données <20% du max de l'échelle → recalculer l'échelle
    if (maxYInTraces < 0.2 * y_max_luminance) {
        y_max_luminance = Math.max(minY, maxYInTraces / Y_AXIS_PEAK_FRACTION_SOL);
        lastGoodYMaxLuminance = y_max_luminance;
    }
    if (maxYPlanckSurfaceSol > 0) {
        const yFloorSol = maxYPlanckSurfaceSol / Y_AXIS_PEAK_FRACTION_SOL;
        if (yFloorSol > y_max_luminance) {
            y_max_luminance = yFloorSol;
            lastGoodYMaxLuminance = y_max_luminance;
        }
    }
    // Recalage forcé (fin de calcul/changement d'époque) : ancrer explicitement Planck sol à ~90% de la hauteur.
    if (forcedRecalcThisPass && maxYPlanckSurfaceSol > 0) {
        y_max_luminance = Math.max(minY, maxYPlanckSurfaceSol / Y_AXIS_PEAK_FRACTION_SOL);
        lastGoodYMaxLuminance = y_max_luminance;
    }

    const dtick_luminance = y_max_luminance / 8;

    window.FLUX.plotYMaxLuminance = y_max_luminance;
    window.FLUX.plotMaxYScienceTraces = maxYInTraces;
    window.FLUX.plotMaxYPlanckSurfaceSol = maxYPlanckSurfaceSol;

    // Verrouiller width/height depuis le conteneur pour éviter que Plotly "oublie" entre les cycles
    const plotContainerEl = document.getElementById('plot-container');
    const plotWrapperEl = document.querySelector('.plot-container-wrapper');
    const containerEl = plotContainerEl || plotWrapperEl;
    const w = containerEl ? Math.floor(containerEl.clientWidth) : 0;
    const h = containerEl ? Math.floor(containerEl.clientHeight) : 0;
    const useExplicitSize = (w > 0 && h > 0);

    // Construire la config yaxis2 séparément pour être sûr
    const yaxis2Config = {
        title: {
            text: has_atmosphere ? "Altitude (km)" : "Pas d'atmosphère",
            font: getPlotlyFont(14, getDefaultTextColor())
        },
        overlaying: 'y',
        side: 'right', // Altitude à droite
        range: [0, z_max_km], // Dynamique (très petit si pas d'atmosphère)
        fixedrange: true, // Désactiver le zoom
        position: 1, // Position à 1 (droite)
        tickmode: 'linear',
        dtick: has_atmosphere ? (z_max_km / 8) : (z_max_km / 4),
        tickfont: getPlotlyFont(12, getDefaultTextColor()),
        titlefont: getPlotlyFont(14, getDefaultTextColor()),
        showline: true,
        linecolor: 'rgba(0, 0, 0, 0.5)',
        linewidth: 1,
        mirror: 'ticks',
        showgrid: false,
        zeroline: false,
        visible: true,
        showticklabels: has_atmosphere // Cacher les graduations si pas d'atmosphère
    };


    const updateLayout = {
        autosize: !useExplicitSize,
        ...(useExplicitSize && { width: w, height: h }),
        margin: PLOT_MARGINS,
        xaxis: {
            range: [0, 50],
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
            range: [0, y_max_luminance],
            fixedrange: true,
            tickformat: (v) => {
                const n = Number(v);
                if (!Number.isFinite(n)) return '';
                if (isHadeen) return (n / 1000).toFixed(1) + 'K';
                if (n >= 1000) return n.toFixed(0);
                if (n >= 10) return n.toFixed(1);
                return n.toFixed(2);
            },
            title: {
                text: "Luminance spectrale (W·m⁻²·μm⁻¹·sr⁻¹)" + scaleLabel,
                font: getPlotlyFont(14, getDefaultTextColor())
            },
            side: 'left',
            tickfont: getPlotlyFont(12, getDefaultTextColor()),
            titlefont: getPlotlyFont(14, getDefaultTextColor()),
            showgrid: true,
            gridcolor: 'rgba(0, 0, 0, 0.5)',
            gridwidth: 1,
            showline: true,
            linecolor: 'rgba(0, 0, 0, 0.5)',
            linewidth: 1,
            mirror: 'ticks',
            dtick: dtick_luminance,
            tickmode: 'linear'
        },
        yaxis2: yaxis2Config,
        plot_bgcolor: PLOT_BACKGROUND_COLOR, // Fond de la zone de dessin (configurable)
        paper_bgcolor: PLOT_BACKGROUND_COLOR, // Fond du papier (configurable)
        annotations: [
            {
                x: STRATOSPHERE_ANNOTATION_X, // Position X configurable (en coordonnées paper)
                y: annotation_z_trop_km !== null ? annotation_z_trop_km : 0, // Position de la tropopause (en km, axe altitude)
                visible: annotation_z_trop_km !== null, // Cacher si pas de tropopause
                text: annotation_text,
                showarrow: false,
                xref: 'paper', // Coordonnées relatives au graphique
                yref: 'y2', // Utiliser l'axe altitude (droite)
                xanchor: 'left', // Aligné à gauche du texte (donc à droite de l'axe, séparé des pointillés)
                yanchor: 'middle',
                align: 'left', // Justifié à gauche
                font: getPlotlyFont(9, STRATOSPHERE_ANNOTATION_COLOR), // Couleur configurable
                visible: has_atmosphere && annotation_z_trop_km !== null // Cacher si pas d'atmosphère ou pas de température
            },
        ]
    };

    // T sol / T eff : valeurs dans le bandeau titre (.synthese_Temp) — pas de bloc sur le graphe (main.js updateLegend pour les styles de courbes)
    const plotContainerForTemps = document.getElementById('plot-container');
    if (plotContainerForTemps) {
        const oldReadouts = plotContainerForTemps.querySelector('.plot-temp-readouts');
        const oldCyan = plotContainerForTemps.querySelector('.temp-display-cyan');
        if (oldReadouts) oldReadouts.remove();
        if (oldCyan) oldCyan.remove();
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
        const text = 'via lunettes infrarouge logarithmique';
        const infraShort = "zoom sur les fréquences réelles pour les rendre visibles";
        const infraLong = "λ_visible (nm) = 3000 / ((1598.5/(log10(λ_réel×10^6)+2.026) − 30)/100)";
        infraText.setAttribute('data-tooltip', infraShort);
        infraText.setAttribute('aria-label', infraLong);

        // Utiliser les couleurs précalculées si disponibles, sinon calculer maintenant
        if (!window.infraTextColors) {
            // Première fois : calculer et stocker les couleurs
            const canvas = document.getElementById('spectral-visualization');
            if (canvas) {
                const canvasWidth = canvas.width;
                const charWidth = 5; // Largeur approximative d'un caractère en pixels (police monospace)
                const textLeft = 85; // Position left du texte selon le CSS

                window.infraTextColors = [];
                // Le texte doit aller du violet (0.38 μm) au rouge vif (20 μm)
                // Le "v" de "via" commence sur le violet, la fin du texte finit à 20 μm
                const graph_min_um = 0;
                const graph_max_um = 50;
                const charWidthCanvas = 5;
                const effectiveWidth = canvasWidth - (charWidthCanvas * 2);

                // Plage de longueurs d'onde pour le texte : 2.0 μm à 20 μm (rouge vif)
                // Commencer à 2.0 μm pour que le "v" soit sur le bleu vif (visible, pas violet)
                // (1 μm minimum pour wavelengthToColorReal, 2.0 μm pour avoir une couleur bleue claire visible)
                const text_min_um = 2.0;   // Début à 2.0 micromètres (bleu vif visible)
                const text_max_um = 20;    // Rouge vif (20 micromètres)

                // Calculer les positions X correspondantes sur le canvas
                const text_min_normalizedX = text_min_um / graph_max_um;
                const text_max_normalizedX = text_max_um / graph_max_um;
                const text_min_X = charWidthCanvas + text_min_normalizedX * effectiveWidth;
                const text_max_X = charWidthCanvas + text_max_normalizedX * effectiveWidth;

                // Longueur totale du texte en pixels
                const textLengthPx = text.length * charWidth;
                // Position de départ pour que le premier caractère soit à text_min_X
                const adjustedTextLeft = text_min_X;

                for (let i = 0; i < text.length; i++) {
                    // Position X du caractère dans le texte (0 à textLengthPx)
                    const charPositionInText = i * charWidth;
                    // Normaliser entre 0 et 1 dans la plage du texte
                    const normalizedInText = charPositionInText / textLengthPx;
                    // Mapper à la plage de longueurs d'onde (0.38 μm à 20 μm)
                    const lambda_um = text_min_um + normalizedInText * (text_max_um - text_min_um);
                    const lambda_m = lambda_um * 1e-6;

                    // Obtenir la couleur pour cette longueur d'onde
                    const lambda_min = 0.1e-6;
                    const lambda_max = 100e-6;
                    const [r, g, b] = wavelengthToColor(lambda_m, lambda_min, lambda_max);

                    window.infraTextColors.push(`rgb(${r}, ${g}, ${b})`);
                }
            }
        }

        // Appliquer les couleurs précalculées
        if (window.infraTextColors && window.infraTextColors.length === text.length) {
            let html = '';
            for (let i = 0; i < text.length; i++) {
                html += `<span style="color: ${window.infraTextColors[i]};">${text[i]}</span>`;
            }
            infraText.innerHTML = html;
        } else {
            // Fallback si pas de couleurs précalculées
            infraText.textContent = text;
        }

        plotContainerWrapper.appendChild(infraText);

        /* Zone sous l'axe (40–50 μm) : CPU / threads (pour futur worker) */
        let threadsEl = plotContainerWrapper.querySelector('.plot-threads-info');
        if (!threadsEl) {
            threadsEl = document.createElement('div');
            threadsEl.className = 'plot-threads-info';
            plotContainerWrapper.appendChild(threadsEl);
        }
        const n = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : '?';
        threadsEl.textContent = 'CPU: ' + n + ' threads';
    }

    // Indicateurs [ ] / EDS / Terre : après Plotly.react uniquement (gd._fullLayout.yaxis.range = échelle courante ;
    // un appel avant react plaçait les logos sur l’ancien Y ; si seule l’échelle Y change, dimsUnchanged ne relançait pas drawAbsorptionBandIndicators depuis resizeCanvasToPlot).

        Plotly.react('plot-container', traces, updateLayout).then(() => {
        hideXAxisLine();
        // Toujours repositionner après Plotly : le plot peut bouger (relayout) même si l'échelle est fixe
        resizeCanvasToPlot(() => {
            drawAbsorptionBandIndicators();
            const skipFluxOnce = window.FLUX.skipSpectralFluxRedrawOnce;
            if (skipFluxOnce) {
                window.FLUX.skipSpectralFluxRedrawOnce = false;
            }
            const c = document.getElementById('spectral-visualization');
            // drawSpectralVisualization exige data.upward_flux : sans _lastData (premier plot / ordre d’appels), updateSpectralVisualization fournira le flux ensuite.
            if (!skipFluxOnce && c._lastData) {
                requestAnimationFrame(() => drawSpectralVisualization(c, c._lastData));
            }
        });
        
        // Mettre à jour le DOM de l'annotation tropopause pour réduire l'espacement
        // Plotly crée les annotations dans le DOM après le rendu
        setTimeout(() => {
            const plotContainer = document.getElementById('plot-container');
            if (plotContainer) {
                // Chercher l'annotation de la tropopause dans le DOM Plotly
                const annotationElements = plotContainer.querySelectorAll('.annotation-text');
                if (annotationElements.length > 0) {
                    // La première annotation devrait être la tropopause (stratosphère/troposphère)
                    // Chercher celle qui contient "Stratosphère"
                    for (let elem of annotationElements) {
                        if (elem.textContent && elem.textContent.includes('Stratosphère')) {
                            // Réduire l'espacement entre les lignes
                            elem.style.lineHeight = '0.8';
                            // Trouver la ligne du milieu (la température) et la rendre plus petite
                            const lines = elem.querySelectorAll('tspan');
                            if (lines.length >= 3) {
                                // La ligne du milieu (index 1) est la température
                                lines[1].style.fontSize = '0.9em';
                            }
                            break;
                        }
                    }
                }
            }
        }, 100);

        // Observer le parent pour détecter quand Plotly modifie le DOM
        const plotContainer = document.getElementById('plot-container');
        const canvas = document.getElementById('spectral-visualization');
        const plotContainerWrapper = document.querySelector('.plot-container-wrapper');

        if (plotContainer && canvas && plotContainerWrapper && !plotContainer._plotlyObserver) {
            let rafId = null;
            // Observer plot-container uniquement (pas le wrapper) pour éviter boucle quand on modifie le canvas
            const plotlyObserver = new MutationObserver(() => {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                    rafId = null;
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
                        // Ne pas appeler resizeCanvasToPlot ici : drawAbsorptionBandIndicators modifie
                        // plot-container → boucle MutationObserver → clignotement
                    }
                });
            });
            plotlyObserver.observe(plotContainer, {
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
                // Pas de redraw ici: updateSpectralVisualization est appelé explicitement
                // par les étapes de calcul ; éviter d'empiler des draws retardés.
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

    const lmin = 380;
    const lviolet = 440;
    const lblue = 490;
    const lcyan = 510;
    const lgreen = 580;
    const lorange = 645;
    const lred = 789;
    const effacement_fin = 20;

    if (lambda_nm >= lmin && lambda_nm < lviolet) {
        // Violet (380-440 nm)
        attenuation = 0.3 + 0.7 * (lambda_nm - lmin) / (lviolet - lmin);
        attenuation = Math.max(0, Math.min(1, (lviolet - lambda_nm) / (lviolet - lmin)));
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
        attenuation = Math.max(0, Math.min(1, (lred - effacement_fin - lambda_nm) / (lred - effacement_fin - lorange)));
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
    const effacement_debut = 30;
    const hz = 1598.5 / (log_lambda + 2.026);
    // hz= 789 -> ... -> ... -> 429 (en THz)
    // vis.789        ->        429 THz Delta=360
    // vis.380        ->        700 nm Delta=320

    // Conversion THz → unités de 10^14 Hz
    // 789 THz = 789 × 10^12 Hz = 7.89 × 10^14 Hz
    const freq_10_14 = (hz - effacement_debut) / 100;

    return Hz2RGB(freq_10_14);
}

// Variable globale pour choisir l'algorithme de conversion couleur
// true = algorithme log (wavelengthToColorReal), false = algorithme if (wavelengthToRGB)
window.useLogColorAlgorithm = true;

// Fonction principale : utilise l'algorithme sélectionné
function wavelengthToColor(lambda_m, lambda_range_min, lambda_range_max) {
    if (window.useLogColorAlgorithm) {
        // Algorithme log (mon graph) : conversion logarithmique complète
        return wavelengthToColorReal(lambda_m, lambda_range_min, lambda_range_max);
    } else {
        // Algorithme if (ton graph) : if pour le visible, log pour l'IR, noir pour l'UV
        const lambda_um = lambda_m * 1e6;
        const lambda_nm = lambda_m * 1e9;

        // Avant l'UV (< 380 nm) : toujours noir
        if (lambda_nm < 380) {
            return [0, 0, 0];
        }

        // Si dans le spectre visible (380-789 nm), utiliser les if
        if (lambda_nm >= 380 && lambda_nm <= 789) {
            const [r, g, b] = wavelengthToRGB(lambda_nm);
            // S'assurer qu'il n'y a pas de valeurs négatives
            return [Math.max(0, r), Math.max(0, g), Math.max(0, b)];
        }

        // Pour l'IR (lambda_nm > 789), utiliser la conversion log
        // mais condensée : log_lambda = log10(lambda_um), hz = 1598.5 / (log_lambda + 2.026)
        if (lambda_um <= 1) {
            return [0, 0, 0]; // Point singulier : invisible
        }

        const log_lambda = Math.log10(lambda_um);
        const effacement_debut = 30;
        const hz = 1598.5 / (log_lambda + 2.026);
        const freq_10_14 = (hz - effacement_debut) / 100;

        return Hz2RGB(freq_10_14);
    }
}

// Variable globale pour suivre l'état de convergence et la précision cible
window.RUNTIME_STATE.spectralPrecisionTarget = 'auto'; // 'auto', 'low', 'medium', 'high', 'max'
window.RUNTIME_STATE.spectralConverged = false;

// Écouter l'événement de convergence pour ajuster la précision
window.addEventListener('calculationConverged', (event) => {
        window.FLUX.yAxisRecalcOnNextFinish = true;
        // Convergence atteinte : vérifier le FPS pour décider de la précision finale
        const currentFPS = window.RUNTIME_STATE.fps;
        if (currentFPS > 55) {
            // FPS stable : cibler la précision maximale (pixel par pixel)
            window.RUNTIME_STATE.spectralConverged = true;
            window.RUNTIME_STATE.spectralPrecisionTarget = 'max';
        } else if (currentFPS > 45) {
            // FPS bon : précision haute
            window.RUNTIME_STATE.spectralConverged = true;
            window.RUNTIME_STATE.spectralPrecisionTarget = 'high';
        } else {
            window.RUNTIME_STATE.spectralConverged = true;
            window.RUNTIME_STATE.spectralPrecisionTarget = 'medium';
        }

        // Redessiner avec la nouvelle précision si on a des données
        const canvas = document.getElementById('spectral-visualization');
        if (canvas && canvas._lastData) {
            setTimeout(() => {
                PLOT.updateSpectralVisualization(canvas._lastData);
            }, 100);
        }
    });

// Fonction pour créer la visualisation spectrale
PLOT.updateSpectralVisualization = function (data) {
    // 🔒 CORRECTION : Le canvas doit TOUJOURS être visible
    // showSpectralBackground contrôle seulement si on redessine ou non (pas la visibilité)
    const canvas = document.getElementById('spectral-visualization');
    if (!canvas) {
        return;
    }
    if (data && data.upward_flux && data.lambda_range && data.z_range) {
        canvas._lastData = data;
    }

    // 🔒 FORCER la visibilité du canvas (toujours visible, même si showSpectralBackground = false)
    canvas.style.setProperty('display', 'block', 'important');
    canvas.style.setProperty('visibility', 'visible', 'important');
    canvas.style.setProperty('opacity', '1', 'important');

    if (window.RUNTIME_STATE.showSpectralBackground === false) {
        return;
    }
    if (!data || !data.upward_flux || !data.lambda_range || !data.z_range) {
        return;
    }
    const maxBins = window.CONFIG_COMPUTE.maxSpectralBinsConvergence;
    const currentBins = data.lambda_range.length;
    const isFinal = (currentBins >= maxBins);
    const isAnimMode = window.DATA['🔘']['🔘🎞'];
    if (!isAnimMode && !isFinal) {
        return; // hors animation: n'afficher que le flux final
    }
    if (!isAnimMode && isFinal) {
        const finalSig = String(currentBins) + ':' + String(data.upward_flux.length);
        if (canvas._lastFinalSig === finalSig) {
            return; // éviter les FINAL doublons
        }
        canvas._lastFinalSig = finalSig;
    }
    if (isAnimMode && !isFinal) {
        // En mode animation, afficher chaque cycle intermédiaire, y compris répétitions bins=100.
        canvas._lastFinalSig = null;
    }
    if (isAnimMode && isFinal) {
        canvas._lastFinalSig = null;
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

    // Ne pas appeler resizeCanvasToPlot ici - elle est déjà appelée au resize et à l'init
    // Le canvas devrait déjà être dimensionné correctement

    // Marquer la résolution dessinée (pour la logique intermédiaire premier/suivant)
    canvas._lastDrawnBins = currentBins;

    // Dessin immédiat : ordre synchrone des étapes de calcul/draw (pas de file setTimeout)
    drawSpectralVisualization(canvas, data);
};

function drawSpectralVisualization(canvas, data) {
    // 🔒 CORRECTION : showSpectralBackground contrôle seulement le redessin, pas la visibilité
    // Le canvas doit toujours être visible, même si showSpectralBackground = false
    // Si false, on ne redessine pas (mais le canvas reste visible avec les dernières données)
    if (typeof window !== 'undefined' && window.RUNTIME_STATE.showSpectralBackground === false) {
        // Ne pas redessiner si FPS trop bas ou anim désactivé (mais canvas reste visible)
        return;
    }
    
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const isDichotomy = typeof window !== 'undefined' && window.SYNC_STATE.calculationInProgress;
    let width;
    let height;
    if (isDichotomy) {
        if (canvas._lastTop != null && canvas._lastLeft != null) {
            canvas.style.setProperty('top', canvas._lastTop, 'important');
            canvas.style.setProperty('left', canvas._lastLeft, 'important');
        }
        if (canvas.width > 0 && canvas.height > 0) {
            width = canvas.width;
            height = canvas.height;
        } else {
            canvas._lastData = data;
            return;
        }
    } else if (!rect.width || !rect.height) {
        canvas._lastData = data;
        return;
    } else {
        width = Math.floor(rect.width);
        height = Math.floor(rect.height);
    }

    // Ajuster la résolution du canvas pour correspondre à la taille visible
    // Réduire la résolution si retina (devicePixelRatio > 1) pour améliorer les performances
    if (window.devicePixelRatio === undefined) {
        console.error('[drawSpectralVisualization] ❌ ERREUR CRITIQUE : window.devicePixelRatio non défini');
        throw new Error('window.devicePixelRatio requis');
    }
    const devicePixelRatio = window.devicePixelRatio;

    // isDichotomy déjà défini plus haut (éviter recalcul)

    // Adapter la précision en fonction du FPS et de l'état de convergence
    // Le canvas écoute l'événement 'calculationConverged' pour savoir quand augmenter la précision
    const currentFPS = window.RUNTIME_STATE.fps;
    const isConverged = window.RUNTIME_STATE.spectralConverged;
    const precisionTarget = window.RUNTIME_STATE.spectralPrecisionTarget;

    let resolutionFactor;
    if (isDichotomy) {
        resolutionFactor = 4; // Pendant la dichotomie (utilisé pour spectrumBarHeight)
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

    if (!isDichotomy) {
        // Réduire la résolution pour améliorer les performances (hors anim)
        width = Math.floor(width / resolutionFactor);
        height = Math.floor(height / resolutionFactor);

        // Ajuster la taille interne du canvas si nécessaire
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        // Ajuster le style pour que le canvas s'affiche à la bonne taille (upscale si nécessaire)
        canvas.style.width = (width * resolutionFactor) + 'px';
        canvas.style.height = (height * resolutionFactor) + 'px';
    } else {
        width = canvas.width;
        height = canvas.height;
    }

    // La barre doit toujours faire 20px en pixels d'affichage
    // Le canvas interne est réduit, puis agrandi par CSS avec resolutionFactor
    // Donc on doit diviser par resolutionFactor pour obtenir 20px d'affichage final
    const spectrumBarHeight = Math.max(1, Math.floor(20 / resolutionFactor)); // 20px d'affichage
    const charWidth = 5; // 5px de chaque côté pour être derrière le 0 et le 50 μm
    const axisMarginB = 75; // PLOT_MARGINS.b - zone sous l'axe (spectre + bornes)

    // Zone de visualisation : jusqu'à l'axe (pas dans la marge)
    const visualizationHeight = height - axisMarginB;
    const spectrumBarY = height - axisMarginB - 1; // Barre collée sous l'axe

    // Nettoyer le canvas SANS la barre spectrale (éviter clignotement)
    ctx.clearRect(0, 0, width, spectrumBarY);

    const upward_flux = data.upward_flux;
    // earth_flux est optionnel (peut être null)
    const earth_flux = data.earth_flux !== undefined ? data.earth_flux : null;
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
    if (allFluxes.length === 0) {
        console.error('[drawSpectralVisualization] ❌ ERREUR CRITIQUE : allFluxes vide');
        throw new Error('allFluxes ne peut pas être vide');
    }
    const minFlux = allFluxes[p1Index] !== undefined ? allFluxes[p1Index] : allFluxes[0];
    const maxFlux = allFluxes[p99Index] !== undefined ? allFluxes[p99Index] : allFluxes[allFluxes.length - 1];
    const fluxRange = maxFlux - minFlux;

    // Plage de l'axe X du graphique : 0 à 50 μm
    const graph_min_um = 0;
    const graph_max_um = 50;

    // Calculer l'altitude max pour normaliser
    if (!z_range || z_range.length === 0) {
        console.error('[drawSpectralVisualization] ❌ ERREUR CRITIQUE : z_range vide ou invalide');
        throw new Error('z_range requis et non vide');
    }
    const z_max = z_range[z_range.length - 1];
    const z_max_km = z_max / 1000; // En km

    // Mapper chaque pixel Y à une altitude spécifique (0 à z_max)
    // Pour avoir une correspondance directe entre pixel Y et altitude
    // Le canvas est inversé : y=0 (haut canvas) = z_max (haut atmosphère)
    // y=H (bas canvas) = z=0 (sol)
    const altitudePerPixel = z_max / visualizationHeight; // Altitude en mètres par pixel

    // Constantes pour le calcul de la densité (approximation exponentielle)
    // ⚡ CORRECTION : Ajuster H en fonction de la masse atmosphérique si disponible
    let H = 8500; // Échelle de hauteur standard en mètres (environ 8.5 km)

    // Essayer de récupérer H depuis les propriétés atmosphériques globales
    // On a besoin de la masse totale pour ça, qu'on peut trouver dans configOrganigramme
    let has_atmosphere = true; // Flag pour détecter le cas "pas d'atmosphère"

    const currentEpoch = resolvePlotTimelineEpoch();
    const total_mass = currentEpoch['⚖️🫧'];
    if (total_mass === 0 || total_mass === undefined) {
        has_atmosphere = false;
    } else {
        const props = window.ATM.calculateAtmosphereProperties();
        H = props.scale_height;
    }


    const P0 = CONV.STANDARD_ATMOSPHERE_PA; // Pression au niveau de la mer en Pa

    // ... suite du code de rendu canvas ...

    /* Bloc supprimé car z_trop_km est déjà calculé plus haut
    // Calculer la tropopause pour déterminer les zones de précision
    let z_trop_km = 11; // Valeur par défaut
    // Essayer de récupérer la tropopause calculée dans updatePlot si disponible
    if (typeof window.current_z_trop_km !== 'undefined') {
        z_trop_km = window.current_z_trop_km;
    } else if (typeof window.calculateTropopauseHeight === 'function') {
        // Sinon recalculer avec une température par défaut
        z_trop_km = window.calculateTropopauseHeight() / 1000;
    }
    */

    // Calculer la tropopause pour déterminer les zones de précision et l'annotation
    // let z_trop_km = 11; // DEJA DÉCLARÉ PLUS HAUT - On commente pour éviter la redéclaration
    /*
    let z_trop_km = 11; // Valeur par défaut
    // Essayer de récupérer la tropopause calculée dans updatePlot si disponible
    if (typeof window.current_z_trop_km !== 'undefined') {
        z_trop_km = window.current_z_trop_km;
    } else if (typeof window.calculateTropopauseHeight === 'function') {
        // Sinon recalculer avec une température par défaut
        z_trop_km = window.calculateTropopauseHeight() / 1000;
    }
    */

    const annotation_z_trop_km = window.current_z_trop_km;
    const delta_T_trop_strato = window.current_delta_T_trop_strato;
    
    // Préparer le texte de l'annotation avec la différence de température calculée
    // Plotly n'interprète pas le HTML complexe, on utilise du texte simple avec <br>
    let annotation_text = 'Stratosphère<br>--<br>Troposphère';
    if (annotation_z_trop_km !== null && delta_T_trop_strato !== null) {
        annotation_text = `Stratosphère<br>${delta_T_trop_strato.toFixed(1)} K<br>Troposphère`;
    }

    const updateLayout = {
        autosize: true, // Préserver dimensions (éviter reset à chaque cycle)
        margin: PLOT_MARGINS, // Marges du graphique (variable commune)
        xaxis: {
            // ... configuration axe X inchangée ...
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
            fixedrange: true,
            tickformat: ',.0f',
            title: {
                text: "Luminance spectrale (W·m⁻²·μm⁻¹·sr⁻¹) ×10¹³",
                font: getPlotlyFont(14, getDefaultTextColor())
            },
            side: 'left',
            tickfont: getPlotlyFont(12, getDefaultTextColor()),
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
            range: [0, z_max_km], // ⚡ UTILISATION CORRECTE : z_max_km est défini dans cette portée
            fixedrange: true, // Désactiver le zoom
            position: 1, // Position à 1 (droite)
            // Aligner les ticks avec l'axe Y principal
            // yaxis: 0-40 (8 divisions de 5)
            // yaxis2 doit aussi avoir 8 divisions
            tickmode: 'linear',
            dtick: z_max_km / 8, // Calculer dynamiquement pour avoir 8 intervalles (alignés avec yaxis)
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
                y: annotation_z_trop_km !== null ? annotation_z_trop_km : 0, // Position de la tropopause (en km, axe altitude)
                visible: annotation_z_trop_km !== null, // Cacher si pas de tropopause
                text: annotation_text,
                showarrow: false,
                xref: 'paper', // Coordonnées relatives au graphique
                yref: 'y2', // Utiliser l'axe altitude (droite)
                xanchor: 'left', // Aligné à gauche du texte (donc à droite de l'axe, séparé des pointillés)
                yanchor: 'middle',
                align: 'left', // Justifié à gauche
                font: getPlotlyFont(9, STRATOSPHERE_ANNOTATION_COLOR), // Couleur configurable
                visible: has_atmosphere && annotation_z_trop_km !== null // Cacher si pas d'atmosphère ou pas de température
            },
        ]
    };

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

    // Cache des couleurs par x (la couleur ne dépend que de x, pas de y)
    const colorCache = new Map();

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
            // Utiliser le cache : la couleur ne dépend que de lambdaIndex (lambda), pas de y
            let colorRGB;
            if (colorCache.has(lambdaIndex)) {
                colorRGB = colorCache.get(lambdaIndex);
            } else {
                colorRGB = wavelengthToColor(lambda, lambda_range[0], lambda_range[lambda_range.length - 1]);
                colorCache.set(lambdaIndex, colorRGB);
            }
            const [r, g, b] = colorRGB;

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

