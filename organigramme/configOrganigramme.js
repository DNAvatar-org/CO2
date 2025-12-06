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

// ============================================================================
// RÉFÉRENCE UNIQUE DES LOGOS
// ============================================================================
// Source unique de référence pour tous les logos utilisés dans l'application
// Utilisé à la fois dans le flux (organigramme) et dans le graphique (plot)
const LOGOS = {
    CO2: '🏭',      // CO2 : usine (émissions industrielles)
    CH4: '⛽',       // CH4 : pompe à essence (combustibles fossiles, pets de vache)
    H2O: '💧',      // H2O : goutte d'eau
    O2: '🌫',       // O2 : brouillard/air
    WEIGHT: '🐳',   // Poids : baleine (masse)
    DENSITY: '💨',  // Densité : vent
    ALTITUDE: '🚀', // Altitude : fusée
    ANIMATION: '🎬', // Animation : caméra
    TROPOPAUSE: '🛩', // Tropopause : avion
    GREENHOUSE_FORCING: '♻', // Greenhouse forcing : recyclage
    CLOUD_ALBEDO: '🌤', // Cloud albedo contribution : soleil avec nuage
    MAX_VAPOR: '🌧', // Max vapor fraction : pluie
    ALBEDO: '🪞',   // Albédo : miroir
    EDS: '📛',      // EDS : Forçage radiatif (Radiative Forcing)
    TEMP: '🌡️',     // TEMP : Température
    PHASE: '⚧',     // Phase : symbole transgenre (phase de convergence)
    T0: '🚩',        // T0 : drapeau (température initiale)
    SIGNE_DELTA_FIRST: '🔺', // SigneDeltaFirst : triangle rouge (signe du premier delta)
    BIG_IMPACT: '🎇', // Big impact : feu d'artifice (événement d'impact majeur)
    TIC_TIME: '🕓', // TicTime : horloge (événement d'avancement temporel)
    GEOTHERMAL_FLUX: '🌕', // Geothermal flux : lune (flux géothermique)
    FLUX_START: '▶', // Flux start : flèche droite (valeur de départ)
    FLUX_END: '◀', // Flux end : flèche gauche (valeur de fin)
    ENERGY_FLUX: '♨', // Energy flux : sources chaudes (W/m² - généralisé pour tous les flux énergétiques)
    DESERT: 'fonts/pics/desert.png',   // Désert : dunes de sable (utilisé dans albedo breakdown)
    VOLCANO: '🌋',  // Volcan : magma (utilisé dans albedo breakdown)
    OCEAN: '🌊',    // Océan : vagues (utilisé dans albedo breakdown)
    FOREST: '🌳',   // Forêt : arbre (utilisé dans albedo breakdown)
    ICE: '🧊',      // Glace : glaçon (utilisé dans albedo breakdown)
    CLOUD: '⛅'     // Nuages : nuage avec soleil (utilisé dans albedo breakdown)
};

// Objet pour mapper les logos emoji vers les fichiers images
// Utilisé quand un logo emoji doit être remplacé par une image
const logosImages = {
    '🎇': 'big_impact.png',  // Big impact utilise une image
    // Ajouter d'autres mappings si nécessaire
    // Exemple: '🌋': 'volcano.png' si on veut remplacer l'emoji par une image
};

// Exposer globalement pour utilisation dans plot.js
if (typeof window !== 'undefined') {
    window.LOGOS = LOGOS;
    window.logosImages = logosImages;
}

// Configuration de base
const radius = 40; // Cercles plus petits (par défaut)
const centerX = 183; // Centre horizontal du diagramme (328px / 2)
const centerY = 200; // Centre vertical du diagramme (640px / 2)
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
    txtD: 0.2,      // 5% - Début de la flèche
    txtF: 0.93,      // 93% - Fin de la flèche
    txtF_albedo: 1.15 // 115% - Exception pour albedo (petite flèche jaune)
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
    { id: 'soleil', logo: ['🌞',{ text: '3.8×10<sup><b>26</b></sup> W ', dataId: 'solar_power_total' }], align: 'zorder', x: centerX - 140, y: centerY - 155, radius, fillColor: 'rgba(255, 193, 7, 0)', strokeColor: 'yellow', strokeSize: 1, strokeStyle: 'solid', left: [], right: [{ text: '62.4<br>MW/m²', dataId: 'solar_surface_mw' }], top: [], bottom: [], tooltip: 'Soleil', radiation: { numCircles: 8, maxRadius: 170, openingAngle: 0, color: 'yellow' }, zIndex: 12, logoScale: 1.0, logoOffsetY: 1 },

    { id: 'geometrie', logo: 'fonts/pics/geometrie.png', x: centerX + 65, y: centerY - 155, radius: 20, fillColor: 'rgba(255, 255, 0, 0)', strokeColor: 'yellow', strokeSize: 0, left: [{ text: '1361<br>W/m²', dataId: 'solar_1UA_mw' }], right: [], top: ['Géométrie'], bottom: [], tooltip: 'Geometrie', radiation: null, zIndex: 13, logoScale: 0.8 },

    { id: 'espace1', logo: '🛰', logoScale: 0.5, x: centerX + 150, y: centerY - 170, radius: 50, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [], right: [], top: '', bottom: '', tooltip: 'Espace<br>Observation', radiation: null, zIndex: 14 },

    { id: 'albedo', logo: '', planetEffect: false, x: centerX + 0.7, y: earthCenterY + 1.0, radius: radiusAtmosphere, fillColor: 'rgba(0, 200, 255, 0.2)', strokeColor: 'white', strokeSize: 1, left: [], right: [], top: [], bottom: [], tooltip: '', radiation: { numCircles: 8, maxRadius: 270, openingAngle: 345, color: 'white', rotation: 299 }, zIndex: 10, logoScale: 0.1 },

    {
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
                epochName: 'Corps noir',
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
                strokeSize: 3,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Archéen',
                numCircles: 6,
                maxRadius: 70,
                strokeSize: 1,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Protérozoïque',
                numCircles: 3,
                maxRadius: 70,
                strokeSize: 1,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Mésozoïque',
                numCircles: 2,
                maxRadius: 50,
                strokeSize: 1,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            }
        ],
        zIndex: 20,
        logoScale: 0.8,
        logoOffsetY: 2
    },

    {
        id: 'terre',
        x: centerX,
        y: earthCenterY,
        epoch: [
            {
                epochName: 'Corps noir',
                logo: 'fonts/pics/text_noir.png',//'fonts/pics/corps_noir.png',
                planetEffect: true,
                luxSaturation: 1.0,
                lightDistance: '7-{$ticTime}/3', // Expression interprétée dynamiquement
                radius: radiusTerre * 0.8,
                fillColor: 'rgba(0, 0, 0, 0)',
                strokeColor: '#000000',
                strokeSize: 1
            },
            {
                epochName: 'Hadéen',
                logo: 'fonts/pics/text_hadeen{$ticTime}.png', // Sera remplacé dynamiquement selon textureIndex
                planetEffect: true,
                luxSaturation: 3.0,
                lightDistance: 0, // 0 = éclairage interne (PointLight au centre)
                // textureIndex est calculé automatiquement: window.textureIndex = Math.floor(window.infoTimeMa / 50)
                // On peut aussi stocker textureIndex directement dans lightDistance (0-9) si on veut forcer une texture
                radius: radiusTerre * 1.1,
                fillColor: 'rgba(255, 69, 0, 0.3)',
                strokeColor: '#ff4500',
                strokeSize: 1
            },
            {
                epochName: 'Archéen',
                logo: 'fonts/pics/text_archeen{$ticTime/3}.png', // $ticTime/3 sera arrondi automatiquement pour les images
                radius: radiusTerre,
                fillColor: 'rgba(255, 140, 0, 0.3)', // Orange/jaune : début de l'oxygène mais encore réductrice
                strokeColor: '#ff8c00',
                strokeSize: 1,
                planetEffect: true // Activer l'effet planète avec rotation lente
            },
            {
                epochName: 'Protérozoïque',
                logo: '🌍',
                radius: radiusTerre,
                fillColor: 'rgba(0, 191, 255, 0.3)', // Cyan/bleu clair : Grande Oxydation, apparition de l'oxygène
                strokeColor: '#00bfff',
                strokeSize: 1
            },
            {
                epochName: 'Mésozoïque',
                logo: '🌎',
                radius: radiusTerre,
                fillColor: 'rgba(0, 200, 255, 0.3)',
                strokeColor: '#00c8ff',
                strokeSize: 1
            },
            {
                epochName: 'Crétacé',
                logo: '🌏',
                radius: radiusTerre,
                fillColor: 'rgba(0, 200, 255, 0.3)',
                strokeColor: '#00c8ff',
                strokeSize: 1
            },
            {
                epochName: 'Cénozoïque',
                logo: '🌍',
                radius: radiusTerre,
                fillColor: 'rgba(0, 200, 255, 0.3)',
                strokeColor: '#00c8ff',
                strokeSize: 1
            },
            {
                epochName: 'Aujourd\'hui',
                logo: 'fonts/pics/text_today.png',
                radius: radiusTerre,
                fillColor: 'rgba(0, 200, 255, 0.3)',
                strokeColor: '#00eeff',
                strokeSize: 1,
                planetEffect: true // Activer l'effet planète avec rotation lente
            }
        ],
        left: [],
        right: [],
        top: '',
        bottom: '',
        tooltip: 'Terre',
        radiation: { numCircles: 8, maxRadius: 200, openingAngle: 340, color: 'red' },
        zIndex: 15,
        logoScale: 0.9,
        logoOffsetY: 7
    },

    { id: 'espace2', logo: '🛰', logoScale: 0.5, x: centerX + 150, y: centerY + 310, radius: 50, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [{ text: 'Observation', dataId: 'observation_label' }], right: [], top: '', bottom: '', tooltip: 'Espace', radiation: null, zIndex: 14 },
    
    { id: 'reemis', logo: '📛', zIndex: 25, x: centerX, y: earthCenterY + 160, radius: 20, logoScale: 0.7, fillColor: 'rgba(255, 0, 0, 0)', strokeColor: 'rgba(255, 0, 0, 0)', strokeSize: 1, left: [], right: '', top: '', bottom: { text: 'Effet de<br>Serre', dataId: 'forcing_label' }, tooltip: 'Effet de Serre', radiation: { numCircles: 8, maxRadius: 75, openingAngle: 310, color: 'red', strokeSize: 2 } },

    { id: 'co2', type: 'button', logo: LOGOS.CO2, logoOffsetY: 0, x: centerX - circleMiddleRadius * 0.7, y: earthCenterY - circleMiddleRadius * 0.7, left: [{ text: '0 ppm', dataId: 'co2_percent' }, { text: '0 W/m²', dataId: 'co2_forcing_wm' }], right: [], top: '', bottom: '', tooltip: 'CO₂', radius: 25, logoScale: 0.7, zIndex: 200, fillColor: 'rgba(255, 255, 255, 0.7)', strokeColor: 'rgba(0, 0, 0, 0)' },

    { id: 'methane', type: 'button', logo: LOGOS.CH4, x: centerX - circleMiddleRadius * 0.7, y: earthCenterY + circleMiddleRadius * 0.7, left: [{ text: '0 ppm', dataId: 'ch4_percent' }, { text: '0<br>W/m²', dataId: 'ch4_forcing_wm' }], right: [], top: '', bottom: '', tooltip: 'CH₄', zIndex: 200, radius: 25, logoScale: 0.7, fillColor: 'rgba(255, 255, 255, 0.7)', strokeColor: 'rgba(0, 0, 0, 0)' },

    { id: 'h2o', type: 'button', logo: LOGOS.H2O, x: centerX - circleMiddleRadius, y: earthCenterY, left: [], right: [], top: [{ text: '0%', dataId: 'h2o_percent' }], bottom: [{ text: '0 W/m²', dataId: 'h2o_forcing_wm' }], tooltip: 'H₂O', zIndex: 200, radius: 20, logoScale: 0.8, fillColor: 'rgba(255, 255, 255, 0.7)', strokeColor: 'rgba(0, 0, 0, 0)' },

    { id: 'albedo-btn', type: 'button', logo: LOGOS.ALBEDO, logoOffsetY: 5, x: centerX + circleMiddleRadius * 0.6, y: earthCenterY - circleMiddleRadius * 0.85, left: [], right: [{ text: '🌊5%<br>🌳5%<br>🏜️30%<br>🧊40%<br>⛅30%', dataId: 'albedo_percents' }], top: [{ text: '0%', dataId: 'albedo_percent' }], bottom: [], tooltip: 'Albédo', zIndex: 200, radius: 20, logoScale: 0.8, fillColor: 'rgba(255, 255, 255, 0.7)', strokeColor: 'rgba(0, 0, 0, 0)' }
];

// Définition du graphe : arcs (flèches)
// Les labels peuvent être des strings (statiques) ou des objets avec { text, dataId } (dynamiques)
const arcs = [
    { from: 'soleil', to: 'geometrie', zIndex: 10, label: { name: { text: '1UA', dataId: 'distance_1ua' }, txtD: '', txtF: '' }},
    { from: 'geometrie', to: 'albedo', zIndex: 10, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'solar_flux_average_wm' }, txtF:  { text: '0%', dataId: 'passing_albedo_percent' }} },
    { from: 'geometrie', to: 'terre', zIndex: 10, label: { name: '', txtF: [ { text: '0×10<sup><b>17</b></sup> W', dataId: 'solar_flux_absorbed_watts' }, { text: '0×10<sup><b>17</b></sup> W/m²', dataId: 'solar_flux_absorbed_wm' } ] } },
    { from: 'albedo', to: 'espace1', zIndex: 10, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'solar_flux_reflected_wm' }, txtD: '', txtF: '' } },
    { from: 'noyau', to: 'terre', zIndex: 30, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'core_flux_wm' }, txtF: '' }, color: '#ff0000' },
    { from: 'terre', to: 'albedo', zIndex: 22, label: { name: { text: '0×10<sup><b>17</b></sup> W', dataId: 'surface_flux_emitted_watts' }, txtF: { text: '0 km', dataId: 'atm_height_km' }, txtD: { text: '0×10<sup><b>17</b></sup> W/m²', dataId: 'surface_flux_emitted_wm' } }, color: 'red' },//tout doit etre retourné
    { from: 'albedo', to: 'espace2', zIndex: 22, label: { name: { text: '0×10<sup><b>17</b></sup> W', dataId: 'flux_ejected_watts' } }, color: '#ff5500' },
    { from: 'reemis', to: 'terre', zIndex: 26, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'forcing_total' }, txtD: '' }, color: '#ff0000' },
];



// Exposer la configuration globalement pour accès depuis main.js
// Note: timeline est maintenant chargée depuis static/timeline/configTimeline.js
window.configOrganigramme = { nodes, arcs };
// La timeline sera ajoutée par static/timeline/configTimeline.js si elle est chargée après
if (typeof window !== 'undefined' && window.configTimeline && window.configTimeline.timeline) {
    window.configOrganigramme.timeline = window.configTimeline.timeline;
}
