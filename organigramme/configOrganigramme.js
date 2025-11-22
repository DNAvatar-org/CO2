// File: configOrganigramme.js - Configuration du diagramme de flux énergétique
// Desc: Données de configuration (nœuds et arcs) pour le diagramme de flux énergétique
// Version 1.1.0
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: extraction des données de configuration depuis organigramme.js
//   - Added dataId mapping for dynamic label updates

// Configuration de base
const radius = 40; // Cercles plus petits (par défaut)
const centerX = 185; // Centre horizontal du diagramme (328px / 2)
const centerY = 200; // Centre vertical du diagramme (640px / 2)
const earthCenterY = centerY + 100; // Centre vertical de la Terre et éléments concentriques
const arrowMarginTop = 10; // Marge en haut des flèches
const arrowMarginBottom = 15; // Marge en bas des flèches
const cellHeight = 110;
const cellHalfHeight = cellHeight / 2; // 55px

const radiusTerre = 100;
const radiusAtmosphere = 160;
const circleMiddleRadius = (radiusTerre + radiusAtmosphere) / 2;
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

// Configuration du rayonnement dynamique du noyau
const coreRadiationConfig = {
    referenceFlux: 0.087,      // W/m² - Flux géothermique actuel (référence)
    baseMaxRadius: 35,         // px - Rayon absolu depuis le centre pour le flux actuel
    logScale: 29,              // Facteur d'échelle: Hadéen atteint 100px (rayon de la Terre)
    minCircles: 4,             // Nombre minimal de cercles
    maxCircles: 12,            // Nombre maximal de cercles
    minStrokeSize: 1,          // px - Épaisseur minimale des traits
    maxStrokeSize: 4,          // px - Épaisseur maximale des traits
    defaultCircles: 8,         // Nombre de cercles par défaut
    defaultStrokeSize: 2       // Épaisseur par défaut
};


// Définition du graphe : nœuds (cellules)
// Le soleil émet ~3.8×10²⁶ W dans toutes les directions (4π stéradians)
// Surface sphère à 1 UA (distance Terre-Soleil) = 4π × (1.5×10¹¹ m)² ≈ 2.83×10²³ m²
// (PAS la surface de la Terre qui est ~5.1×10¹⁴ m², mais la sphère sur laquelle l'énergie se répartit)
// 3.8×10²⁶ W / 2.83×10²³ m² ≈ 1361 W/m² (constante solaire sur surface perpendiculaire au rayonnement)
// 340.25 W/m² = 1361/4 (moyennisation sur toute la surface terrestre)
// Explication : La Terre est une sphère. Vu du Soleil, seule la face éclairée est visible (disque de rayon R, surface = πR²)
// Mais la surface totale de la Terre est 4πR². En moyenne : 1361 × (πR²) / (4πR²) = 1361/4
const nodes = [
    { id: 'soleil', logo: '🌞', x: centerX - 140, y: centerY - 155, radius, fillColor: 'rgba(255, 193, 7, 0)', strokeColor: 'yellow', strokeSize: 1, left: [], right: [{ text: '62.4<br>MW/m²', dataId: 'solar_surface_mw' }], top: [], bottom: [{ text: '3.8×10<sup>26</sup> W ', dataId: 'solar_power_total' }], tooltip: 'Soleil', radiation: { numCircles: 8, maxRadius: 170, openingAngle: 0, color: 'yellow' }, logoScale: 1.0, logoOffsetY: 1 },

    { id: 'geometrie', logo: '🎱', x: centerX + 65, y: centerY - 155, radius: 20, fillColor: 'rgba(255, 255, 0, 0)', strokeColor: 'yellow', strokeSize: 1, left: [{ text: '1361<br>W/m²', dataId: 'solar_1UA_mw' }], right: [], top: [], bottom: [], tooltip: 'Geometrie', radiation: null, zIndex: 11, logoScale: 1.1, logoOffsetY: 2 },

    { id: 'espace1', logo: '', x: centerX + 150, y: centerY - 200, radius, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [], right: [], top: '', bottom: '', tooltip: 'Espace<br>Observation', radiation: null },

    { id: 'albedo', logo: '🪞', x: centerX + 0.7, y: earthCenterY + 1.0, radius: radiusAtmosphere, fillColor: 'rgba(0, 200, 255, 0.2)', strokeColor: 'white', strokeSize: 1, left: [], right: [], top: [], bottom: [], tooltip: '', radiation: { numCircles: 8, maxRadius: 250, openingAngle: 345, color: 'white', rotation: 297 }, zIndex: 10, logoScale: 0.1 },

    { id: 'noyau', logo: '🌕', x: centerX - 2, y: earthCenterY - 1, radius: 30, fillColor: 'rgba(255, 69, 0, 0)', strokeSize: 7, strokeColor: '#ff5500', left: [], right: [], top: [], bottom: [{ text: '~5700 K ', dataId: 'core_temperature' }], tooltip: 'Noyau - Géothermie', radiation: { numCircles: 8, maxRadius: 75, openingAngle: 0 }, zIndex: 20, logoScale: 0.8 },

    { id: 'surface', logo: '🌍', x: centerX, y: earthCenterY, radius: radiusTerre, fillColor: 'rgba(0, 200, 255, 0.3)', strokeColor: '#00eeff', strokeSize: 1, left: [], right: [], top: '', bottom: '', tooltip: 'Terre', radiation: { numCircles: 8, maxRadius: 200, openingAngle: 340, color: 'red' }, zIndex: 15, logoScale: 0.95, logoOffsetY: 5 },

    { id: 'espace2', logo: '🛰', x: centerX + 140, y: centerY + 300, radius, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [{ text: 'Observation', dataId: 'observation_label' }], right: [], top: '', bottom: '', tooltip: 'Espace', radiation: null },

    { id: 'reemis', logo: '📛', zIndex: 25, x: centerX - 45, y: earthCenterY + 140, radius: 10, logoScale: 1.0, fillColor: 'rgba(255, 0, 0, 0)', strokeColor: 'red', strokeSize: 1, left: [{ text: 'Forçage<br>Radiatif', dataId: 'forcing_label' }], right: [{ text: '0.00<br>W/m²', dataId: 'forcing_total' }], top: '', bottom: '', tooltip: 'Réémis', radiation: { numCircles: 8, maxRadius: 75, openingAngle: 310, color: 'red', strokeSize: 2 } },

    // Boutons
    //+circleMiddleRadius*Math.cos(135*Math.PI/180)
    //+circleMiddleRadius*Math.sin(135*Math.PI/180)
    //type: 'button',

    { id: 'co2', type: 'button', logo: '🌱', x: centerX - circleMiddleRadius * 0.7, y: earthCenterY - circleMiddleRadius * 0.7, left: [{ text: '0%', dataId: 'co2_percent' }, { text: '0 W/m²', dataId: 'co2_forcing' }], right: [], top: '', bottom: '', tooltip: 'CO₂', radius: 10, logoScale: 1.0 },
    { id: 'methane', type: 'button', logo: '⛽', x: centerX - circleMiddleRadius * 0.7, y: earthCenterY + circleMiddleRadius * 0.7, left: [{ text: '0%', dataId: 'ch4_percent' }, { text: '0 W/m²', dataId: 'ch4_forcing' }], right: [], top: '', bottom: '', tooltip: 'CH₄' },
    { id: 'h2o', type: 'button', logo: '💧', x: centerX - circleMiddleRadius, y: earthCenterY, left: [], right: [], top: [{ text: '0%', dataId: 'h2o_percent' }], bottom: [{ text: '0 W/m²', dataId: 'h2o_forcing' }], tooltip: 'H₂O' },
    { id: 'albedo-btn', type: 'button', logo: '🪞', x: centerX + circleMiddleRadius, y: earthCenterY, left: [], right: [], top: [{ text: '0 W/m²', dataId: 'forcing_total' }], bottom: [{ text: '0%', dataId: 'forcing_percent' }], tooltip: 'Albédo' }
];

// Définition du graphe : arcs (flèches)
// Les labels peuvent être des strings (statiques) ou des objets avec { text, dataId } (dynamiques)
const arcs = [
    { from: 'soleil', to: 'geometrie', label: { name: { text: '1UA', dataId: 'distance_1ua' }, txtD: '', txtF: '' } },
    { from: 'geometrie', to: 'albedo', label: { name: { text: '0.0<br>W/m²', dataId: 'solar_flux_average_wm' }, txtF: { text: 'Albédo: ⛅50% + ❄️20%', dataId: 'albedo_percents' } } },
    { from: 'geometrie', to: 'surface', label: { name: '', txtF: { text: '0.0 W/m²', dataId: 'solar_flux_absorbed_wm' } } },
    { from: 'albedo', to: 'espace1', label: { name: { text: '0.0<br>W/m²', dataId: 'solar_flux_reflected_wm' }, txtD: '', txtF: '' } },
    { from: 'noyau', to: 'surface', label: { name: { text: '0.0<br>W/m²', dataId: 'core_flux_wm' }, txtF: '' } },
    { from: 'surface', to: 'albedo', label: { name: '', txtD: { text: '0.0<br>W/m²', dataId: 'solar_flux_absorbed_wm' } }, color: 'red' },//tout doit etre retourné
    { from: 'albedo', to: 'espace2', label: { name: '', txtD: '' }, color: '#ff5500' },
    { from: 'reemis', to: 'surface', label: { name: '', size: '', txtD: '', relatif: 'bottom' } }
];

// Définition de la chronologie (timeline)
// Structure : array d'objets { type: 'epoch' | 'separator', ... }
const timeline = [
    {
        type: 'epoch',
        id: 'corps-noir',
        name: 'Corps noir',
        logo: 'assets/icons/corps_noir.svg',
        title: 'Corps noir - État initial (206.1K), avant formation de la Terre, pas de noyau différencié, pas d\'atmosphère'
    },
    {
        type: 'separator',
        date: '-4500 Ma'
    },
    {
        type: 'epoch',
        id: 'hadeen',
        name: 'Hadéen',
        logo: 'assets/icons/hadeen.svg',
        title: 'Hadéen (-4500 à -4000 Ma)'
    },
    {
        type: 'separator',
        date: '-4000 Ma'
    },
    {
        type: 'epoch',
        id: 'archeen',
        name: 'Archéen',
        logo: 'assets/icons/archeen.svg',
        title: 'Archéen (-4000 à -2500 Ma)'
    },
    {
        type: 'separator',
        date: '-2500 Ma'
    },
    {
        type: 'epoch',
        id: 'proterozoique',
        name: 'Protérozoïque',
        logo: '🌿',
        title: 'Protérozoïque (-2500 à -541 Ma)'
    },
    {
        type: 'separator',
        date: '-397 Ma'
    },
    {
        type: 'epoch',
        id: 'mesozoique',
        name: 'Mésozoïque',
        logo: '🦕',
        title: 'Mésozoïque (-252 à -66 Ma)'
    },
    {
        type: 'separator',
        date: '-199 Ma'
    },
    {
        type: 'epoch',
        id: 'cretace',
        name: 'Crétacé',
        logo: '🦴',
        title: 'Crétacé (-145 à -66 Ma)'
    },
    {
        type: 'separator',
        date: '-66 Ma'
    },
    {
        type: 'epoch',
        id: 'cenozoique',
        name: 'Cénozoïque',
        logo: '🦣',
        title: 'Cénozoïque (-66 Ma à aujourd\'hui)'
    },
    {
        type: 'separator',
        date: 'aujourd\'hui'
    },
    {
        type: 'epoch',
        id: 'aujourdhui',
        name: 'Aujourd\'hui',
        logo: '🌈',
        title: 'État d\'aujourd\'hui'
    }
];
