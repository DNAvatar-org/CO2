// File: configOrganigramme.js - Configuration du diagramme de flux énergétique
// Desc: Données de configuration (nœuds et arcs) pour le diagramme de flux énergétique
// Version 1.1.27
// Date: [Apr 15, 2026] [12:00 UTC+1]
// logs :
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
//   - Initial version: extraction des données de configuration depuis organigramme.js
//   - Added dataId mapping for dynamic label updates
//   - v1.1.1: albedo-btn affiche le barycentre fine-tuning cloud sous 🪩 (🧩🔺n%🔻)
//   - v1.1.2: [1] config (époque initiale) avant build organigramme pour ordre synchrone 1 → 2 texture
//   - v1.1.19: [0] organigramme 📜 init (+ _logStepEnd) — [1] config uniquement dans setEpoch ; _logStep depuis debug.js
//   - v1.1.3: [1] log via _logStep (console.groupCollapsed) si défini
//   - v1.1.4: baryEpochs + getEffectiveNodesConfig(epochName, bary) pour interpolation graphique (appliqué via IO_LISTENER côté CO2)
//   - v1.1.5: bary=1 → config époque suivante (bary=0 d'après) ; interpolation fillColor/strokeColor (parseRgba/parseHex/interpolateColor)
//   - v1.1.6: baryEpochs Hadeen end-state = Archeen start (bary in [0,1[ ; frontiere coherente)
//   - v1.1.7: LABEL_POSITIONS txtDD (avant début flèche) et txtFF (après bout flèche) pour arcs
//   - v1.1.8: TEXTURES_THREEJS dérivé des dates (TEXTURE_DATES_MA / TEXTURE_DATES_YEAR) ; epochTextures supprimé (chemin = getPlanetTexturePathFromEpoch)
//   - v1.1.9: ACTION_BY_EPOCH (date → 2e bouton ☄️|🎇|💫) pour barre ACTION en haut de la timeline
//   - v1.1.10: ACTION_BY_DATE (plages fromMa/toMa, fromYear/toYear) + getActionForDate(startYears, infoTimeMa) — entrée = date, pas epoch
//   - v1.1.11: albedo_percent retiré du bouton albedo — affiché dans #organigram-config-wrap (main.js)
//   - v1.1.12: fine_tuning_cloud_bary retiré du bouton albedo — même bandeau (main.js)
//   - v1.1.14: EOT / 🏔 dans terre.epoch et noyau.radiation ; v1.1.15: 🐊 ⛰ + libellé « Grande Coupure »
//   - v1.1.16: ❄️ Quaternaire (2 Ma) — terre + noyau + TEXTURE_DATES_MA / ACTION_BY_DATE
//   - v1.1.17: espace1 — titre OBSERVATIONS déplacé vers main.js (wrap comme PILOTAGE), plus de top sur le nœud satellite
//   - v1.1.20: 🐊 epochName « Éocène » (titre court)
//   - v1.1.22: retrait domSlot timeline — logos + 🎞 dans visu_radiatif.html (.title-scenario-row)
//   - v1.1.23: nœud domSlot timeline-scenario-logos seul (#timeline-events-logos créé/déplacé par organigramme, plus dans visu_radiatif)
//   - v1.1.24: nœud domSlot timeline-scenario-anim (#plot-anim-toggle button créé par organigramme, plus dans visu_radiatif)
//   - v1.1.25: domSlot logos + 🎞 dans #flux-diagram (x/y directs, pas de wrapper ; hors title-container)
//   - v1.1.26: domSlot timeline-scenario-logos : slotEventLogoPx (côté picto px) + slotMinWidth (zone min)
//   - v1.1.27: methane logoOffsetY 2 + logoScale 0.4 (createCell applique le scale au PNG charsImages)
//   - v1.1.18: 🐊 epochName « Hyperthermie éocène » (remplace Terre étouffe (PETM))
//   - v1.1.13: albedo_percent de retour en top du bouton albédo (grille [1,2])

// ============================================================================
// RÉFÉRENCE DES LOGOS (déplacée vers alphabet.js)
// ============================================================================
// ⚠️ IMPORTANT : Les logos sont maintenant définis dans static/compute/alphabet.js
// Ce fichier utilise window.CHARS (ou window.LOGOS pour compatibilité) et window.charsImages définis dans alphabet.js
// Assurez-vous que alphabet.js est chargé avant configOrganigramme.js

// Constante locale pour utiliser CHARS
const LOGOS = window.CHARS;

// ============================================================================
// TEXTURES Three.js — CO2/fonds/*.png par dates (la carte c'est le territoire)
// ============================================================================
// ⚠️ charsImages (alphabet.js) ne touche JAMAIS aux textures !
// Le chemin texture se déduit toujours de la date : getPlanetTexturePathFromEpoch(▶, infoTimeMa) (organigramme.js).
// Liste pour préchargement éventuel : dérivée des dates (Ma ou années), pas des noms d’époques.
// Convention : 5 chiffres + "Ma.png" (ex. 05000Ma.png) ou 6 chiffres + "a.png" (ex. 001800a.png).
const TEXTURE_DATES_MA = [5000, 4500, 4100, 3700, 3300, 2900, 2500, 2300, 225, 150, 100, 200, 66, 50, 35, 33, 2];
const TEXTURE_DATES_YEAR = [1800, 2025];
const TEXTURES_THREEJS = [
    ...TEXTURE_DATES_MA.map((ma) => "fonds/" + String(ma).padStart(5, "0") + "Ma.png"),
    ...TEXTURE_DATES_YEAR.map((y) => "fonds/" + String(y).padStart(6, "0") + "a.png"),
];

// Configuration de base
const radius = 40; // Cercles plus petits (par défaut)
const centerX = 183; // Centre horizontal du diagramme (328px / 2)
const centerY = 215; // Centre vertical du diagramme (640px / 2)
const earthCenterY = centerY + 100; // Centre vertical de la Terre et éléments concentriques
const arrowMarginTop = 10; // Marge en haut des flèches
const arrowMarginBottom = 15; // Marge en bas des flèches
const cellHeight = 110;
const cellHalfHeight = cellHeight / 2; // 55px

const radiusTerre = 90;
const radiusAtmosphere = 175;
const circleMiddleRadius = (radiusTerre*2 + radiusAtmosphere) / 3;
// 4 tailles d'espacement pour les flèches
const spacingSizes = {
    short: 10,    // Court (par défaut, pas de label)
    medium: 45,   // Moyen (si label présent)
    long: 100,     // Long
    extraLong: 120 // Très long
};

// Constantes de Z-Index pour l'architecture en couches
const Z_LAYERS = {
    ARROW: 10,
    ARROW_LABEL: 11, // Au-dessus des flèches
    NODE: 20,        // Conteneur des nœuds (au-dessus des flèches et étiquettes)
    RADIATION: 100,  // Au-dessus des nœuds
    BUTTON: 200      // Au-dessus de tout
};

const Z_NODE_INTERNAL = {
    CIRCLE: 1,
    LOGO: 10,
    LABEL: 20
};

// Constantes de positionnement des étiquettes sur les flèches
const LABEL_POSITIONS = {
    txtDD: -0.1,       // Avant le début de la flèche (départ)
    txtD: 0.2,      // 20% - Début de la flèche
    txtF: 0.93,     // 93% - Fin de la flèche
    txtFF: 1.1,    // Après le bout de la flèche (arrivée)
};

// Z-index spécifiques pour chaque nœud
const NODE_Z_INDEX = {
    SOLEIL: 12,        // Soleil (derrière geometrie)
    GEOMETRIE: 13,     // Géométrie (petit nœud)
    ESPACE1: 14,       // Satellite espace1
    ALBEDO: 10,        // Albédo (derrière la Terre)
    NOYAU: 20,         // Noyau (au centre de la Terre)
    SURFACE: 15,       // Terre/Surface
    ESPACE2: 14,       // Satellite espace2
    REEMIS: 25,        // Réémis (devant tout)
    // Boutons
    CO2: 200,
    METHANE: 200,
    H2O: 200,
    ALBEDO_BTN: 200
};

// Z-index spécifiques pour les flèches (pour gérer les cas où elles doivent passer devant/derrière des nœuds)
const ARROW_Z_INDEX = {
    DEFAULT: 10,           // Flèches normales (derrière les nœuds)
    SOLEIL_GEOMETRIE: 10,  // Soleil -> Géométrie
    GEOMETRIE_ALBEDO: 10,  // Géométrie -> Albédo (jaune)
    GEOMETRIE_SURFACE: 10, // Géométrie -> Surface (jaune)
    ALBEDO_ESPACE1: 10,    // Albédo -> Espace1 (réfléchi)
    NOYAU_SURFACE: 22,     // Noyau -> Surface (devant la Terre, z-index 15)
    SURFACE_ALBEDO: 22,    // Surface -> Albédo (rouge, devant la Terre)
    ALBEDO_ESPACE2: 22,    // Albédo -> Espace2 (orange, devant la Terre)
    REEMIS_SURFACE: 26     // Réémis -> Surface (rouge, devant tout)
};

// Configuration du rayonnement dynamique du noyau
// Définition du graphe : nœuds (cellules)
// Le soleil émet ~3.8×10²⁶ W dans toutes les directions (4π stéradians)
// Surface sphère à 1 UA (distance Terre-Soleil) = 4π × (1.5×10¹¹ m)² ≈ 2.83×10²³ m²
// (PAS la surface de la Terre qui est ~5.1×10¹⁴ m², mais la sphère sur laquelle l'énergie se répartit)
// 3.8×10²⁶ W / 2.83×10²³ m² ≈ 1361 W/m² (constante solaire sur surface perpendiculaire au rayonnement)
// 340.25 W/m² = 1361/4 (moyennisation sur toute la surface terrestre)
// Explication : La Terre est une sphère. Vu du Soleil, seule la face éclairée est visible (disque de rayon R, surface = πR²)
// Mais la surface totale de la Terre est 4πR². En moyenne : 1361 × (πR²) / (4πR²) = 1361/4
const nodes = [
    { id: 'soleil', logo: [LOGOS.SUN_ORIGIN, { text: '3.8×10<sup><b>26</b></sup> W ', dataId: 'solar_power_total' }], align: 'zorder', x: centerX - 140, y: centerY - 155, radius, fillColor: 'rgba(255, 193, 7, 0)', strokeColor: 'yellow', strokeSize: 1, strokeStyle: 'solid', left: [], right: [{ text: '62.4<br>MW/m²', dataId: 'solar_surface_mw' }], top: [], bottom: [], tooltip: 'Soleil', radiation: { numCircles: 8, maxRadius: 170, openingAngle: 0, color: 'yellow' }, zIndex: 12, logoScale: 1.0, logoOffsetY: 1 },

    { id: 'geometrie', logo: 'fonts/pics/geometrie.png', x: centerX + 65, y: centerY - 155, radius: 20, fillColor: 'rgba(255, 255, 0, 0)', strokeColor: 'yellow', strokeSize: 0, left: [{ text: '1361<br>W/m²', dataId: 'solar_1UA_mw' }], right: [], top: ['Géométrie'], bottom: [], tooltip: 'Geometrie', radiation: null, zIndex: 13, logoScale: 0.8 },

    { id: 'espace1', logo: '', logoScale: 1.2, x: centerX + 150, y: centerY - 170, radius: 20, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [], right: [], top: [], bottom: '', tooltip: 'CERES', radiation: null, zIndex: 14 },

    {//albedo cellule — cercle extérieur toujours blanc alpha 0.5, sans fill
        // Astuce direction flèche : centre décentré (x,y + petit offset) pour que le vecteur albedo→espace1 donne la bonne direction (sinon même centre que terre = ambiguïté). Voir aussi noyau (centerX - 0.2, earthCenterY - 0.1).
        id: 'albedo',
        logo: '',
        planetEffect: false,
        x: centerX + 0.8,
        y: earthCenterY + 1.0,
        radius: radiusAtmosphere,
        fillColor: 'rgba(0, 0, 0, 0)',
        strokeColor: 'rgba(255, 255, 255, 0.5)',
        strokeSize: 1, 
        strokeStyle: [10, 5, 2, 5, 2, 5],
        left: [], right: [], top: [], bottom: [], tooltip: '',
        radiation: { numCircles: 8, maxRadius: 270, openingAngle: 345, color: 'white', rotation: 299 },
        zIndex: 10,
        logoScale: 0.1
    },

    {//noyau cellule — centre décentré (x-0.2, y-0.1) pour direction des flèches, même astuce que albedo (voir commentaire albedo).
        id: 'noyau',
        logo: [{ text: '4.44 x 10^13 W', dataId: 'core_temperature' }],//'🌕',
        x: centerX - 0.2,
        y: earthCenterY - 0.1,
        radius: 30,
        fillColor: 'rgba(255, 69, 0, 0)',
        strokeSize: 0,
        strokeColor: 'rgba(255, 69, 0, 0)',//'#ff5500',
        left: [],
        right: [],
        top: [],
        bottom: [],
        tooltip: 'Noyau - Géothermie',
        radiation: [
            {
                epochName: 'Corps Noir',
                numCircles: 0,
                maxRadius: 0,
                strokeSize: 0,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Hadéen',
                numCircles: 6,
                maxRadius: 100,
                strokeSize: 0,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Archéen',
                numCircles: 6,
                maxRadius: 70,
                strokeSize: 0,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Protérozoïque',
                numCircles: 3,
                maxRadius: 70,
                strokeSize: 0,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Mésozoïque',
                numCircles: 2,
                maxRadius: 50,
                strokeSize: 0,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Cénozoïque',
                numCircles: 2,
                maxRadius: 50,
                strokeSize: 0,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Éocène',
                numCircles: 2,
                maxRadius: 52,
                strokeSize: 0,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'hysteresis 2',
                numCircles: 2,
                maxRadius: 45,
                strokeSize: 0,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Grande Coupure',
                numCircles: 1,
                maxRadius: 30,
                strokeSize: 0,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Quaternaire',
                numCircles: 2,
                maxRadius: 38,
                strokeSize: 0,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            }
        ],
        zIndex: 20,
        logoScale: 0.8,
        logoOffsetY: 2
    },

    {//terre cellule
        id: 'terre',
        x: centerX,
        y: earthCenterY,
        epoch: [
            {
                epochName: 'Corps Noir',
                logo: LOGOS.CORPS_NOIR,
                planetEffect: true,
                luxSaturation: 1.0,
                lightDistance: '7-{$ticTime}/3',
                radius: radiusTerre * 0.8,
                radiusExobase: radiusTerre*0.81 ,
                fillColor: 'rgba(0, 0, 0, 0)',
                strokeColor: '#666666',
                strokeSize: 0,
            },
            {
                epochName: 'Hadéen',
                logo: LOGOS.HADEEN,
                planetEffect: true,
                luxSaturation: 3.0,
                lightDistance: 0,
                radius: radiusTerre * 1.1,
                radiusExobase: radiusTerre * 1.6,
                strokeColor: '#FF4500',
                fillColor: 'rgba(255, 69, 0, 0.5)',
                strokeSize: 0,
            },
            {
                epochName: 'Archéen',
                logo: LOGOS.ARCHEEN,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.15,
                fillColor: 'rgba(255, 215, 0, 0.5)',
                strokeColor: '#FFD700',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Protérozoïque',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 191, 255, 0.5)',
                strokeColor: '#00FA9A',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Mésozoïque',
                logo: LOGOS.GLOBE_AMERICAS,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Paléozoïque',
                logo: LOGOS.GLOBE_ASIA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Cénozoïque',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Éocène',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'hysteresis 2',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Grande Coupure',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Quaternaire',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(180, 220, 255, 0.5)',
                strokeColor: '#B0E0E6',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Industriel',
                logo: LOGOS.TODAY,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Aujourd\'hui',
                logo: LOGOS.MODERN,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 255, 255, 0.5)',
                strokeColor: '#E0FFFF',
                strokeSize: 0,
                planetEffect: true
            }
        ],
        left: [],
        right: [],
        top: '',
        bottom: '',
        tooltip: 'Terre',
        radiation: { numCircles: 8, maxRadius: 200, openingAngle: 340, color: 'red' },
        zIndex: 15
    },

    { id: 'espace2', logo: LOGOS.SATELLITE, logoScale: 1.2, x: centerX + 170, y: centerY + 310, radius: 20, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [{ text: 'Observation', dataId: 'observation_label' }], right: [], top: '', bottom: '', tooltip: 'DSCOVR au L1', radiation: null, zIndex: 14 },
    //📛
    { id: 'reemis', logo: LOGOS.EDS, zIndex: 25, x: centerX, y: earthCenterY + 170, radius: 20, logoScale: 0.7, fillColor: 'rgba(255, 0, 0, 0)', strokeColor: 'rgba(255, 0, 0, 0)', strokeSize: 1, left: [], right: '', top: '', bottom: { text: 'Effet de<br>Serre', dataId: 'forcing_label' }, tooltip: 'Effet de Serre', radiation: { numCircles: 8, maxRadius: 75, openingAngle: 310, color: 'red', strokeSize: 2 } },

    { id: 'co2', type: 'button', readOnly: true, logo: LOGOS.CO2, logoOffsetY: 0, x: centerX - circleMiddleRadius * 0.7, y: earthCenterY - circleMiddleRadius * 0.7, left: [{ text: '0 ppm', dataId: 'co2_percent' }, { text: '0 W/m²', dataId: 'co2_forcing_wm' }], right: [], top: '', bottom: '', tooltip: 'CO₂', radius: 25, logoScale: 0.7, zIndex: 200, fillColor: 'rgba(255, 255, 255, 0.7)', strokeColor: 'rgba(0, 0, 0, 0)' },

    { id: 'methane', type: 'button', readOnly: true, logo: LOGOS.CH4, logoOffsetY: 2, x: centerX - circleMiddleRadius * 0.7, y: earthCenterY + circleMiddleRadius * 0.7, left: [{ text: '0 ppm', dataId: 'ch4_percent' }, { text: '0<br>W/m²', dataId: 'ch4_forcing_wm' }], right: [], top: '', bottom: '', tooltip: 'CH₄', zIndex: 200, radius: 35, logoScale: 0.7, logoOffsetY: 2, fillColor: 'rgba(255, 255, 255, 0.7)', strokeColor: 'rgba(0, 0, 0, 0)' },

    { id: 'h2o', type: 'button', readOnly: true, logo: LOGOS.H2O, x: centerX - circleMiddleRadius, y: earthCenterY, left: [], right: [], top: [{ text: '0%', dataId: 'h2o_percent' }], bottom: [{ text: '0 W/m²', dataId: 'h2o_forcing_wm' }], tooltip: 'H₂O', zIndex: 200, radius: 20, logoScale: 0.8, fillColor: 'rgba(255, 255, 255, 0.7)', strokeColor: 'rgba(0, 0, 0, 0)' },

    /* domSlot : logos + 🎞 dans #flux-diagram — positionnés directement (pas de wrapper) ; absents de visu_radiatif.html */
    {
        id: 'timeline-scenario-logos',
        type: 'domSlot',
        mountId: 'timeline-events-logos',
        appendParentSelector: '#flux-diagram',
        x: centerX,
        y: earthCenterY - circleMiddleRadius * 1.4,
        zIndex: 220,
        slotMinWidth: 500,
        slotEventLogoPx: 100,
        domClass: 'timeline-events-logos'
    },

    { // 🎞
        id: 'timeline-scenario-anim',
        type: 'button',
        readOnly: true,
        logo: '🎞',
        x: centerX - 100,
        y: earthCenterY + circleMiddleRadius * 1.8,
        zIndex: 221,
        radius: 15,
        logoScale: 0.8,
        left: [],
        right: [],
        top: [],
        bottom: [],
        tooltip: 'Prochaine époque',
        fillColor: 'rgba(255, 255, 255, 0.7)',
        strokeColor: 'rgba(0, 0, 0, 0)'
    },

    { id: 'albedo-btn', type: 'button', readOnly: true, logo: LOGOS.ALBEDO, logoOffsetY: 5, x: centerX + circleMiddleRadius * 0.69, y: earthCenterY - circleMiddleRadius * 1.2, left: [], right: [{ text: '🌊5%<br>🌳5%<br>🏜️30%<br>🧊40%<br>⛅30%', dataId: 'albedo_percents' }], top: [{ text: '0%', dataId: 'albedo_percent' }], bottom: [], tooltip: 'Albédo', zIndex: 200, radius: 20, logoScale: 0.9, fillColor: 'rgba(255, 255, 255, 0.7)', strokeColor: 'rgba(0, 0, 0, 0)' },

    { id: 'credits-paleomap', type: 'button', readOnly: false, logo: '🗺',  x: centerX + 170, y: centerY + 180, radius: 18, logoScale: 1.1, fillColor: 'rgba(30,30,30,0.55)', strokeColor: 'rgba(180,180,180,0.4)', strokeSize: 1, left: [], right: [], top: [{ text: 'PALEOMAP'}], bottom: [{ text: 'C.R. Scotese'}], tooltip: 'Crédits cartographiques', zIndex: 200 }
];

// Définition du graphe : arcs (flèches)
// Les labels peuvent être des strings (statiques) ou des objets avec { text, dataId } (dynamiques)
const arcs = [
    { from: 'soleil', to: 'geometrie', zIndex: 10, label: { name: { text: '1UA', dataId: 'distance_1ua' }, txtD: '', txtF: '' }, color: '#ffff00'},
    { from: 'geometrie', to: 'albedo', zIndex: 10, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'solar_flux_average_wm' }, txtF: ''}, color: '#ffff00' },//{ text: '0%', dataId: 'passing_albedo_percent' }
    { from: 'geometrie', to: 'terre', zIndex: 10, label: { name: '', txtF: [ { text: '0×10<sup><b>17</b></sup> W/m²', dataId: 'solar_flux_absorbed_wm' }], txtFF: [ { text: '0×10<sup><b>17</b></sup> W', dataId: 'solar_flux_absorbed_watts' } ]}, color: '#ffff00' },
    
    // Flèche grise (réfléchi → CERES). Direction = vecteur albedo→espace1 : albedo (centerX+0.8, earthCenterY+1), espace1 (centerX+150, centerY-170) → angle ≈ -61° (à 60° au-dessus de l’horizontale). Pour décaler : fromCenterOffset: { x, y } sur l’arc.
    { from: 'albedo', to: 'espace1', zIndex: 10, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'solar_flux_reflected_wm' }, txtD: '', txtF: '' }, color: '#bbbb99' },
    { from: 'noyau', to: 'terre', zIndex: 30, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'core_flux_wm' }, txtF: '' }, color: '#ff0000' },
    // Astuce centre décentré : le nœud 'albedo' a (x+0.8, y+1) pour que la flèche ROUGE terre→albedo ait la bonne direction. Vecteur = (idDep.x, idDep.y)→(idDest.x, idDest.y) dans organigramme.js.
    { from: 'terre', to: 'albedo', zIndex: 22, label: { name: '', txtDD: { text: '0×10<sup><b>17</b></sup> W', dataId: 'surface_flux_emitted_watts' }, txtF: { text: '0 km', dataId: 'atm_height_km' }, txtD: { text: '0×10<sup><b>17</b></sup> W/m²', dataId: 'surface_flux_emitted_wm' } }, color: 'red' },
    { from: 'albedo', to: 'espace2', zIndex: 22, label: { name: { text: '0×10<sup><b>17</b></sup> W', dataId: 'flux_ejected_watts' } }, color: '#ff0000' },
    { from: 'reemis', to: 'terre', zIndex: 26, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'forcing_total' }, txtD: '' }, color: '#ff0000' },
];



// Barycentre graphique : valeurs de fin (bary=1) = époque suivante (bary=0 d'après). Interpolation visuelle côté CO2 via IO_LISTENER.
const baryEpochs = {
    // Hadéen → Archéen : bary in [0,1[ ; end-state = Archéen start (cohérence frontière)
    'Hadéen': {
        terre: { radius: radiusTerre, radiusExobase: radiusTerre * 1.15, fillColor: 'rgba(255, 215, 0, 0.5)', strokeColor: '#FFD700' },
        noyau: { radiation: { numCircles: 6, maxRadius: 70 } }
    },
    'Archéen': {
        terre: { radius: 85, radiusExobase: 103.5, fillColor: 'rgba(0, 191, 255, 0.5)', strokeColor: '#00FA9A' },
        noyau: { radiation: { numCircles: 4, maxRadius: 60 } }
    }
};

function interpolateNum(startVal, endVal, bary) {
    if (typeof endVal !== 'number' || !Number.isFinite(endVal)) return startVal;
    const s = (typeof startVal === 'number' && Number.isFinite(startVal)) ? startVal : endVal;
    const t = Math.max(0, Math.min(1, Number(bary) || 0));
    return s + t * (endVal - s);
}

function parseRgba(str) {
    if (typeof str !== 'string') return null;
    const m = str.trim().match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i);
    if (m) return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10), m[4] != null ? parseFloat(m[4]) : 1];
    return null;
}

function parseHex(str) {
    if (typeof str !== 'string') return null;
    const s = str.trim().replace(/^#/, '');
    if (s.length === 6) return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
    if (s.length === 3) return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16)];
    return null;
}

function interpolateColor(startStr, endStr, t) {
    if (t >= 1) return endStr;
    if (t <= 0) return startStr;
    const startRgba = parseRgba(startStr);
    const endRgba = parseRgba(endStr);
    if (startRgba && endRgba) {
        const a = startRgba.length > 3 ? startRgba[3] : 1;
        const b = endRgba.length > 3 ? endRgba[3] : 1;
        return 'rgba(' + Math.round(startRgba[0] + t * (endRgba[0] - startRgba[0])) + ',' +
            Math.round(startRgba[1] + t * (endRgba[1] - startRgba[1])) + ',' +
            Math.round(startRgba[2] + t * (endRgba[2] - startRgba[2])) + ',' +
            (a + t * (b - a)).toFixed(2) + ')';
    }
    const startHex = parseHex(startStr);
    const endHex = parseHex(endStr);
    if (startHex && endHex) {
        const r = Math.round(startHex[0] + t * (endHex[0] - startHex[0]));
        const g = Math.round(startHex[1] + t * (endHex[1] - startHex[1]));
        const b = Math.round(startHex[2] + t * (endHex[2] - startHex[2]));
        return '#' + [r, g, b].map(function (x) { return ('0' + Math.max(0, Math.min(255, x)).toString(16)).slice(-2); }).join('');
    }
    return t >= 0.5 ? endStr : startStr;
}

function getEffectiveNodesConfig(epochName, bary) {
    if (!epochName || !baryEpochs[epochName]) return nodes;
    const b = baryEpochs[epochName];
    const t = Math.max(0, Math.min(1, Number(bary) || 0));
    const out = nodes.map(function (node) {
        const endNode = b[node.id];
        if (!endNode) return node;
        if (node.epoch && Array.isArray(node.epoch)) {
            const idx = node.epoch.findIndex(function (e) { return e.epochName === epochName; });
            if (idx < 0) return node;
            const entry = node.epoch[idx];
            const nextEntry = node.epoch[idx + 1];
            const endFlat = endNode.radius !== undefined || endNode.fillColor ? endNode : null;
            if (endFlat) {
                const interp = {};
                for (const k in entry) interp[k] = entry[k];
                if (t >= 1 && nextEntry) {
                    for (const k in nextEntry) interp[k] = nextEntry[k];
                } else {
                    if (typeof endFlat.radius === 'number') interp.radius = interpolateNum(entry.radius, endFlat.radius, t);
                    if (typeof endFlat.radiusExobase === 'number') interp.radiusExobase = interpolateNum(entry.radiusExobase, endFlat.radiusExobase, t);
                    if (endFlat.fillColor != null) interp.fillColor = interpolateColor(entry.fillColor || '', endFlat.fillColor, t);
                    if (endFlat.strokeColor != null) interp.strokeColor = interpolateColor(entry.strokeColor || '', endFlat.strokeColor, t);
                }
                return { ...node, epoch: node.epoch.map(function (e) { return e.epochName === epochName ? interp : e; }) };
            }
        }
        if (node.radiation && Array.isArray(node.radiation) && endNode.radiation) {
            const idx = node.radiation.findIndex(function (r) { return r.epochName === epochName; });
            if (idx < 0) return node;
            const entry = node.radiation[idx];
            const nextEntry = node.radiation[idx + 1];
            const endR = endNode.radiation;
            const interp = { ...entry };
            if (t >= 1 && nextEntry) {
                for (const k in nextEntry) interp[k] = nextEntry[k];
            } else {
                if (typeof endR.numCircles === 'number') interp.numCircles = Math.round(interpolateNum(entry.numCircles, endR.numCircles, t));
                if (typeof endR.maxRadius === 'number') interp.maxRadius = interpolateNum(entry.maxRadius, endR.maxRadius, t);
            }
            return { ...node, radiation: node.radiation.map(function (r) { return r.epochName === epochName ? interp : r; }) };
        }
        return node;
    });
    return out;
}

// Deuxième bouton ACTION en haut de la timeline : entrée = date (clé = même date que les images fonds/NNNNNa.png ou NNNNNMa.png).
// Clé = Ma (5000, 4900, … 33, 66, 150, 250, 500, …) ou année (1800, 2025). Valeur = '☄️' | '🎇' | '💫'.
// Tu remplis les valeurs après ; défaut si clé absente = '💫'.
const ACTION_BY_DATE = {
    // Ma (cf. fonds/05000Ma.png …)
    5000: '☄️', 4900: '💫', 4800: '☄️', 4700: '💫', 4600: '🎇',
    4500: '☄️', 4400: '💫', 4300: '☄️', 4200: '💫', 4100: '☄️',
    4000: '💫', 3500: '💫', 3000: '💫', 2500: '💫', 2000: '💫',
    1500: '💫', 1000: '💫', 750: '💫', 600: '💫', 500: '💫', 250: '💫', 150: '💫',
    66: '💫', 50: '💫', 35: '💫', 33: '💫', 2: '💫',
    // Années (cf. fonds/001800a.png, 002025a.png)
    1800: '💫', 2025: '💫'
};

/** Retourne la date courante (même calcul que la texture) : Ma ou année selon startYears. */
function getCurrentDateKey(startYears, infoTimeMa) {
    const info = Number(infoTimeMa) || 0;
    if (startYears >= 1e6) {
        return Math.round(startYears / 1e6 - info);
    }
    return Math.round(startYears + info * 1e6);
}

/** Retourne '☄️' | '🎇' | '💫' pour la date courante (startYears, infoTimeMa). Lookup ACTION_BY_DATE[dateKey]. */
function getActionForDate(startYears, infoTimeMa) {
    const key = getCurrentDateKey(startYears, infoTimeMa);
    const action = (window.configOrganigramme && window.configOrganigramme.ACTION_BY_DATE) ? window.configOrganigramme.ACTION_BY_DATE[key] : undefined;
    return (action === '☄️' || action === '🎇' || action === '💫') ? action : '💫';
}

// Exposer la configuration globalement pour accès depuis main.js
// Note: timeline est chargée depuis API_BILAN/config/configTimeline.js
window.configOrganigramme = {
    nodes, arcs, TEXTURES_THREEJS, baryEpochs, getEffectiveNodesConfig,
    ACTION_BY_DATE, getCurrentDateKey, getActionForDate
};
// La timeline sera ajoutée par loader_panels initAfterLoad (configOrganigramme.timeline = TIMELINE.map(...))
// [0] organigramme : init DATA['📜'] / currentEpochName AVANT build (setEpoch ouvre seul le groupe [1] config)
if (window.DATA && window.TIMELINE && window.TIMELINE.length) {
    var firstEpoch = window.TIMELINE[0];
    var firstId = firstEpoch['📅'];
    if (!window.DATA['📜']) window.DATA['📜'] = {};
    window.DATA['📜']['🗿'] = firstId;
    window.DATA['📜']['👉'] = 0;
    window.DATA['📜']['🔘🕰'] = '';
    window.DATA['📜']['📿☄️'] = 0;    // compteur dédié bouton ☄️ (init à 0)
    window.DATA['📜']['📿💫'] = 0;    // compteur dédié bouton 💫 (init à 0)
    window.DATA['📜']['🔺⚖️💧☄️'] = 0; // masse H₂O par météorite (init à 0, rempli par getEpochDateConfig)
    window.currentEpochName = firstId === '⚫' ? 'Corps Noir' : (window.CHARS_DESC && window.CHARS_DESC[firstId]) || firstId;
    // [0] = init DATA['📜'] seulement ; [1] config réservé à setEpoch (main.js) pour un seul groupe « officiel »
    // Groupe laissé ouvert : le prochain _logStep (ex. [1] config dans setEpoch) referme — pas de _logStepEnd ici (évite fermeture « depuis un autre fichier »)
    if (window._logStep) {
        window._logStep('[0] organigramme 📜 init ' + firstId);
    } else if (typeof console !== 'undefined' && console.debug) {
        console.debug('[configOrganigramme] 📜 init', firstId);
    }
}
