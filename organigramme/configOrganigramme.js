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
    ALBEDO: '🪞',   // Albédo : miroir
    DESERT: 'fonts/pics/desert.png',   // Désert : dunes de sable (utilisé dans albedo breakdown)
    VOLCANO: '🌋',  // Volcan : magma (utilisé dans albedo breakdown)
    OCEAN: '🌊',    // Océan : vagues (utilisé dans albedo breakdown)
    FOREST: '🌳',   // Forêt : arbre (utilisé dans albedo breakdown)
    ICE: '🧊',      // Glace : glaçon (utilisé dans albedo breakdown)
    CLOUD: '⛅'     // Nuages : nuage avec soleil (utilisé dans albedo breakdown)
};

// Exposer globalement pour utilisation dans plot.js
if (typeof window !== 'undefined') {
    window.LOGOS = LOGOS;
}

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
const radiusAtmosphere = 170;
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
    { id: 'soleil', logo: '🌞', x: centerX - 140, y: centerY - 155, radius, fillColor: 'rgba(255, 193, 7, 0)', strokeColor: 'yellow', strokeSize: 1, left: [], right: [{ text: '62.4<br>MW/m²', dataId: 'solar_surface_mw' }], top: [], bottom: [{ text: '3.8×10<sup><b>26</b></sup> W ', dataId: 'solar_power_total' }], tooltip: 'Soleil', radiation: { numCircles: 8, maxRadius: 170, openingAngle: 0, color: 'yellow' }, zIndex: 12, logoScale: 1.0, logoOffsetY: 1 },

    { id: 'geometrie', logo: 'fonts/pics/geometrie.png', x: centerX + 65, y: centerY - 155, radius: 20, fillColor: 'rgba(255, 255, 0, 0)', strokeColor: 'yellow', strokeSize: 0, left: [{ text: '1361<br>W/m²', dataId: 'solar_1UA_mw' }], right: [], top: ['Géométrie'], bottom: [], tooltip: 'Geometrie', radiation: null, zIndex: 13, logoScale: 0.8 },

    { id: 'espace1', logo: '🛰', logoScale: 0.5, x: centerX + 150, y: centerY - 170, radius: 50, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [], right: [], top: '', bottom: '', tooltip: 'Espace<br>Observation', radiation: null, zIndex: 14 },

    { id: 'albedo', logo: LOGOS.ALBEDO, x: centerX + 0.7, y: earthCenterY + 1.0, radius: radiusAtmosphere, fillColor: 'rgba(0, 200, 255, 0.2)', strokeColor: 'white', strokeSize: 1, left: [], right: [], top: [], bottom: [], tooltip: '', radiation: { numCircles: 8, maxRadius: 270, openingAngle: 345, color: 'white', rotation: 299 }, zIndex: 10, logoScale: 0.1 },

    {
        id: 'noyau',
        logo: '🌕',
        x: centerX - 0.2,
        y: earthCenterY - 0.1,
        radius: 30,
        fillColor: 'rgba(255, 69, 0, 0)',
        strokeSize: 1,
        strokeColor: '#ff5500',
        left: [],
        right: [],
        top: [],
        bottom: [{ text: '4.44 x 10^13 W', dataId: 'core_temperature' }],
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
                strokeSize: 2,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Protérozoïque',
                numCircles: 3,
                maxRadius: 70,
                strokeSize: 2,
                openingAngle: 0,
                rotation: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Mésozoïque',
                numCircles: 2,
                maxRadius: 50,
                strokeSize: 2,
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
                logo: 'fonts/pics/corps_noir.png',
                radius: radiusTerre * 0.8,
                fillColor: 'rgba(0, 0, 0, 0.3)',
                strokeColor: '#000000',
                strokeSize: 1
            },
            {
                epochName: 'Hadéen',
                logo: 'fonts/pics/hadeen.png',
                radius: radiusTerre * 1.1,
                fillColor: 'rgba(255, 69, 0, 0.3)',
                strokeColor: '#ff4500',
                strokeSize: 1
            },
            {
                epochName: 'Archéen',
                logo: 'fonts/pics/archeen.png',
                radius: radiusTerre,
                fillColor: 'rgba(255, 140, 0, 0.3)', // Orange/jaune : début de l'oxygène mais encore réductrice
                strokeColor: '#ff8c00',
                strokeSize: 1
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
                logo: '🌏',
                radius: radiusTerre,
                fillColor: 'rgba(0, 200, 255, 0.3)',
                strokeColor: '#00eeff',
                strokeSize: 1
            }
        ],
        left: [],
        right: [],
        top: '',
        bottom: '',
        tooltip: 'Terre',
        radiation: { numCircles: 8, maxRadius: 200, openingAngle: 340, color: 'red' },
        zIndex: 15,
        logoScale: 0.95,
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
    { from: 'noyau', to: 'terre', zIndex: 30, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'core_flux_wm' }, txtF: '' } },
    { from: 'terre', to: 'albedo', zIndex: 22, label: { name: { text: '0×10<sup><b>17</b></sup> W', dataId: 'surface_flux_emitted_watts' }, txtF: { text: '0 km', dataId: 'atm_height_km' }, txtD: { text: '0×10<sup><b>17</b></sup> W/m²', dataId: 'surface_flux_emitted_wm' } }, color: 'red' },//tout doit etre retourné
    { from: 'albedo', to: 'espace2', zIndex: 22, label: { name: { text: '0×10<sup><b>17</b></sup> W', dataId: 'flux_ejected_watts' } }, color: '#ff5500' },
    { from: 'reemis', to: 'terre', zIndex: 26, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'forcing_total' }, txtD: '' }, color: '#ff0000' },
];

// Définition de la chronologie (timeline)
// Structure : array d'objets { type: 'epoch' | 'separator', ... }
const timeline = [
    {
        type: 'epoch',
        id: 'corps-noir',
        name: 'Corps noir',
        date: '-5000 Ma',
        startYears: 5.0e9,
        endYears: 4.5e9,
        // temp: '1200°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: 'fonts/pics/corps_noir.png',
        title: 'Corps noir - État étalon<br>(Remplace la phase d\'accrétion)',
        solar_intensity: 0.70,
        core_temperature: 0, // Pas de noyau (K)
        geothermal_diffusion_factor: 0.0, // Facteur de diffusion du noyau vers la surface (0-1) - Corps noir : pas de noyau
        planet_radius: 6371000, // Rayon de la planète en mètres (Terre : 6371 km)
        gravity: 9.81, // Gravité en m/s²
        total_atmosphere_mass_kg: 0, // Pas d'atmosphère
        // Note: geothermal_flux sera calculé à partir de core_temperature et geothermal_diffusion_factor
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        co2_kg: 0, // Quantité de CO2 en kg
        ch4_kg: 0, // Quantité de CH4 en kg
        h2o_kg: 0, // Quantité totale d'eau en kg (vapeur + liquide + glace)
        n2_kg: 0, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        cloud_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.0,
        ocean_coverage: 0, forest_coverage: 0, desert_coverage: 0, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 0.0,
        // Événements interactifs
        events: {
            ice_meteorite: {
                water_added_kg: 6.8e18 // ~10^19 kg (valeur arbitraire pour l'exemple)
            },
            big_impact: {
                energy_flux_wm2: 2000000 // 2 MW/m² (correspond au flux géothermique de l'Hadéen)
            }
        }
    },
    {
        type: 'separator',
        date: '-4500 Ma'
    },
    {
        type: 'epoch',
        id: 'hadeen',
        name: 'Hadéen',
        date: '-4500 Ma',
        startYears: 4.5e9,
        endYears: 4.0e9,
        // temp: '46.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: 'fonts/pics/hadeen.png',
        title: 'Hadéen - Terre en formation, océan de magma (Atmosphère dense)',
        solar_intensity: 0.75,
        core_temperature: 6000, // Température du noyau en K
        // geothermal_diffusion_factor: 0.0073, // REMPLACÉ par un flux explicite
        // Flux géothermique colossal (2 000 000 W/m²) pour maintenir la surface en fusion (~2400K)
        // Correspond à la phase immédiate post-impact (océan de magma rayonnant)
        geothermal_flux: 2000000, 
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        total_atmosphere_mass_kg: 5.3e20, // Atmosphère très dense (~100 bar, principalement CO2/H2O)
        // Note: geothermal_flux = core_temperature * geothermal_diffusion_factor * 0.00457
        // Hadéen: ~0.20 W/m² (6000K * 0.0073 * 0.00457 ≈ 0.20 W/m²)
        // D'après Grok: ~0.20-0.25 W/m² à la surface pour Hadéen
        initial_temperature_K: 2469.65, // 2196.5°C - Valeur proche de l'équilibre pour convergence rapide
        // Juste après l'impact : 10⁵ à 10⁷ W/m², >4000-6000K (roche vaporisée)
        // Post-impact (vrai Hadéen) : 1000 → 100 W/m² en décroissance, 2500K → 500K
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        // Conversion approximative: 10% CO2 ≈ 5.15e17 kg (10% de 5.15e18 kg atmosphère)
        co2_kg: 5.15e17, // Quantité de CO2 en kg (~10% de l'atmosphère moderne)
        ch4_kg: 5.15e15, // Quantité de CH4 en kg (~1000 ppm)
        h2o_kg: 2.1e20, // Quantité totale d'eau en kg (~15% de 1.4e21 kg)
        n2_kg: 1.0e18, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        cloud_coverage: 0.1, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.05,
        ocean_coverage: 0, forest_coverage: 0, desert_coverage: 0, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        magma_coverage: 1.0, // Spécifique Hadéen
        volcanoFactor: 10.0,
        // Événements interactifs
        events: {
            ice_meteorite: {
                water_added_kg: 2.1e19 // ~10% de l'eau initiale (2.1e20) pour effet visible
            }
        }
    },
    {
        type: 'separator',
        date: '-4000 Ma'
    },
    {
        type: 'epoch',
        id: 'archeen',
        name: 'Archéen',
        date: '-4000 Ma',
        startYears: 4.0e9,
        endYears: 2.5e9,
        // temp: '38.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: 'fonts/pics/archeen.png',
        title: 'Archéen (-4000 à -2500 Ma)',
        solar_intensity: 0.80,
        core_power_watts: 1.5e14, // Puissance géothermique totale (~150 TW)
        // core_temperature: 5500, // DEPRECATED
        // geothermal_diffusion_factor: 0.00009, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        total_atmosphere_mass_kg: 1.0e19, // Atmosphère dense (~2 bar, CO2/N2)
        // Note: geothermal_flux ≈ 0.29 W/m² (1.5e14 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 2.575e16, // Quantité de CO2 en kg (~5000 ppm)
        ch4_kg: 4.12e14, // Quantité de CH4 en kg (~80 ppm)
        h2o_kg: 8.4e20, // Quantité totale d'eau en kg (~60% de 1.4e21 kg)
        n2_kg: 3.0e18, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.6, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.12,
        ocean_coverage: 0.80, forest_coverage: 0, desert_coverage: 0.05, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 5.0
    },
    {
        type: 'separator',
        date: '-2500 Ma'
    },
    {
        type: 'epoch',
        id: 'proterozoique',
        name: 'Protérozoïque',
        date: '-2500 Ma',
        startYears: 2.5e9,
        endYears: 541e6,
        // temp: '12.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: '🦠',
        title: 'Protérozoïque (-2500 à -541 Ma)',
        solar_intensity: 0.90,
        core_power_watts: 1.0e14, // Puissance géothermique totale (~100 TW)
        // core_temperature: 5000, // DEPRECATED
        // geothermal_diffusion_factor: 0.00004, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        total_atmosphere_mass_kg: 5.15e18, // Atmosphère proche de l'actuelle (~1 bar)
        // Note: geothermal_flux ≈ 0.2 W/m² (1.0e14 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 1.03e16, // Quantité de CO2 en kg (~2000 ppm)
        ch4_kg: 1.2875e14, // Quantité de CH4 en kg (~25 ppm)
        h2o_kg: 1.19e21, // Quantité totale d'eau en kg (~85% de 1.4e21 kg)
        n2_kg: 3.5e18, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.6, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.20,
        ocean_coverage: 0.70, forest_coverage: 0.05, desert_coverage: 0.15, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 2.0
    },
    {
        type: 'separator',
        date: '-397 Ma'
    },
    {
        type: 'epoch',
        id: 'mesozoique',
        name: 'Mésozoïque',
        date: '-250 Ma',
        startYears: 252e6,
        endYears: 66e6,
        // temp: '25.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: '🦕',
        title: 'Mésozoïque (-252 à -66 Ma)',
        solar_intensity: 0.98,
        core_power_watts: 6.0e13, // Puissance géothermique totale (~60 TW)
        // core_temperature: 4500, // DEPRECATED
        // geothermal_diffusion_factor: 0.000022, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        total_atmosphere_mass_kg: 5.15e18, // Atmosphère standard (~1 bar)
        // Note: geothermal_flux ≈ 0.12 W/m² (6.0e13 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 1.2875e16, // Quantité de CO2 en kg (~2500 ppm)
        ch4_kg: 4.12e13, // Quantité de CH4 en kg (~8 ppm)
        h2o_kg: 1.33e21, // Quantité totale d'eau en kg (~95% de 1.4e21 kg)
        n2_kg: 4.0e18, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.6, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.28,
        ocean_coverage: 0.70, forest_coverage: 0.20, desert_coverage: 0.10, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 1.0
    },
    {
        type: 'separator',
        date: '-145 Ma'
    },
    {
        type: 'epoch',
        id: 'cretace',
        name: 'Crétacé',
        date: '-145 Ma',
        startYears: 145e6,
        endYears: 66e6,
        // temp: '28.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: '🦴',
        title: 'Crétacé (-145 à -66 Ma)',
        solar_intensity: 0.99,
        core_power_watts: 5.5e13, // Puissance géothermique totale (~55 TW)
        // core_temperature: 4300, // DEPRECATED
        // geothermal_diffusion_factor: 0.000022, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        total_atmosphere_mass_kg: 5.15e18, // Atmosphère standard (~1 bar)
        // Note: geothermal_flux ≈ 0.11 W/m² (5.5e13 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 1.545e16, // Quantité de CO2 en kg (~3000 ppm)
        ch4_kg: 5.15e13, // Quantité de CH4 en kg (~10 ppm)
        h2o_kg: 1.372e21, // Quantité totale d'eau en kg (~98% de 1.4e21 kg)
        n2_kg: 4.0e18, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.6, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.28,
        ocean_coverage: 0.70, forest_coverage: 0.20, desert_coverage: 0.10, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 1.0
    },
    {
        type: 'separator',
        date: '-66 Ma'
    },
    {
        type: 'epoch',
        id: 'cenozoique',
        name: 'Cénozoïque',
        date: '-66 Ma',
        startYears: 66e6,
        endYears: 0,
        // temp: '18.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: '🦣',
        title: 'Cénozoïque (-66 Ma à aujourd\'hui)',
        solar_intensity: 0.995,
        core_power_watts: 5.0e13, // Puissance géothermique totale (~50 TW)
        // core_temperature: 4100, // DEPRECATED
        // geothermal_diffusion_factor: 0.000022, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        total_atmosphere_mass_kg: 5.15e18, // Atmosphère standard (~1 bar)
        // Note: geothermal_flux ≈ 0.1 W/m² (5.0e13 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 1.443e15, // Quantité de CO2 en kg (~280 ppm)
        ch4_kg: 3.605e12, // Quantité de CH4 en kg (~0.7 ppm)
        h2o_kg: 1.4e21, // Quantité totale d'eau en kg (100% de 1.4e21 kg)
        n2_kg: 4.017e18, // Quantité de N2 en kg (~78% de l'atmosphère moderne, non affiché dans le flux diagram)
        o2_kg: 1.0815e18, // Quantité de O2 en kg (~21% de l'atmosphère moderne, non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.4, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.30,
        ocean_coverage: 0.70, forest_coverage: 0.15, desert_coverage: 0.10, ice_coverage: 0.05, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 1.0
    },
    {
        type: 'separator',
        date: '1800'
    },
    {
        type: 'epoch',
        id: 'pre-industriel',
        name: '1800',
        date: '-1800',
        startYears: 1800,
        endYears: -1,
        // temp: '14.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: '🐘',
        title: '1800 - Pré-industriel',
        solar_intensity: 1.00,
        core_power_watts: 4.6e13, // Puissance géothermique totale (~46 TW)
        // core_temperature: 4000, // DEPRECATED
        // geothermal_diffusion_factor: 0.000022, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        total_atmosphere_mass_kg: 5.15e18, // Atmosphère standard (~1 bar)
        // Note: geothermal_flux ≈ 0.09 W/m² (4.6e13 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 1.443e15, // Quantité de CO2 en kg (~280 ppm, niveau pré-industriel)
        ch4_kg: 3.605e12, // Quantité de CH4 en kg (~0.7 ppm, niveau pré-industriel)
        h2o_kg: 1.4e21, // Quantité totale d'eau en kg (100% de 1.4e21 kg)
        n2_kg: 4.017e18, // Quantité de N2 en kg (~78% de l'atmosphère moderne, non affiché dans le flux diagram)
        o2_kg: 1.0815e18, // Quantité de O2 en kg (~21% de l'atmosphère moderne, non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.4, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.30,
        ocean_coverage: 0.70, forest_coverage: 0.15, desert_coverage: 0.10, ice_coverage: 0.05, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 1.0
    }
];

// Exposer la configuration globalement pour accès depuis main.js
window.configOrganigramme = { nodes, arcs, timeline };
