// File: configOrganigramme.js - Configuration du diagramme de flux énergétique
// Desc: Données de configuration (nœuds et arcs) pour le diagramme de flux énergétique
// Version 1.0.0
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: extraction des données de configuration depuis organigramme.js

// Configuration de base
const radius = 40; // Cercles plus petits (par défaut)
const centerX = 174; // Centre horizontal du diagramme (328px / 2)
const centerY = 200; // Centre vertical du diagramme (640px / 2)
const earthCenterY = centerY+80; // Centre vertical de la Terre et éléments concentriques
const arrowMarginTop = 10; // Marge en haut des flèches
const arrowMarginBottom = 15; // Marge en bas des flèches
const cellHeight = 110;
const cellHalfHeight = cellHeight / 2; // 55px

// 4 tailles d'espacement pour les flèches
const spacingSizes = {
    short: 10,    // Court (par défaut, pas de label)
    medium: 45,   // Moyen (si label présent)
    long: 100,     // Long
    extraLong: 120 // Très long
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
    { id: 'soleil', logo: '🌞', x: centerX-120, y: centerY-135, radius, fillColor: 'rgba(255, 193, 7, 0)', strokeColor: 'yellow', strokeSize: 1, left: [], right: [], top: ['3.8×10²⁶ W'], bottom: ['6.24×10⁷ W/m²'], tooltip: 'Soleil', radiation: { numCircles: 8, maxRadius: 170, openingAngle: 0, color: 'yellow' }, logoScale: 1.0, logoOffsetY: 1 },

    { id: 'geometrie', logo: '🎱', x: centerX+45, y: centerY-145, radius: 20, fillColor: 'rgba(255, 255, 0, 0)', strokeColor: 'yellow', strokeSize: 1, left: [], right: ['1361 W/m²'], top: [], bottom: [], tooltip: 'Geometrie', radiation: null, zIndex: 11, logoScale: 1.1, logoOffsetY: 2 },//{ numCircles: 8, maxRadius: 200, openingAngle: 315, rotation: 105, color: 'white' }

    { id: 'espace1', logo: '', x: centerX+130, y: centerY-200, radius, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [], right: [], top: '', bottom: '', tooltip: 'Espace<br>Observation', radiation: null },

    { id: 'albedo', logo: '🏐', x: centerX+0.75, y: earthCenterY+2, radius: 160, fillColor: 'rgba(0, 200, 255, 0.2)', strokeColor: 'white', strokeSize: 1, left: [], right: [], top: [], bottom: [], tooltip: 'Albédo', radiation: { numCircles: 8, maxRadius: 250, openingAngle: 345, color: 'white', rotation: 295 }, zIndex: 10, logoScale: 0.1 },

    { id: 'noyau', logo: '🌕', x: centerX-2, y: earthCenterY-1, radius: 30, fillColor: 'rgba(255, 69, 0, 0.5)', strokeSize: 7, strokeColor: '#ff5500', left: [], right: [], top: ['Géothermie'], bottom: '~5700 K', tooltip: 'Noyau', radiation: { numCircles: 8, maxRadius: 75, openingAngle: 0 } , zIndex: 20, logoScale: 0.8 },

    { id: 'surface', logo: '🌍', x: centerX, y: earthCenterY, radius: 100, fillColor: 'rgba(0, 200, 255, 0.3)', strokeColor: '#00eeff', strokeSize: 1, left: [], right: [], top: '', bottom: '', tooltip: 'Surface', radiation: { numCircles: 8, maxRadius: 200, openingAngle: 340, color: 'red' }, zIndex: 15, logoScale: 0.95, logoOffsetY: 5 },
    
    { id: 'effetSerre', logo: '', x: centerX - 125, y: earthCenterY, radius, fillImage: '', strokeColor: '', left: [], right: [], top: '', bottom: '', tooltip: 'Effet de Serre', radiation: null, rectangle: { width: 130, height: 200, factors: [//Athmosphère<br>Effet de Serre
        { icon: '🌵', label: 'CO₂', formula: 'CO₂' },
        { icon: '💧', label: 'H₂O', formula: 'H₂O', align: 'center' },
        { icon: '⛽', label: 'CH₄', formula: 'CH₄' }
    ]} },

    { id: 'espace2', logo: '🛰', x: centerX+80, y: centerY+300, radius, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [], right: [], top: 'Observation', bottom: '', tooltip: 'Espace', radiation: null },

    { id: 'reemis', logo: '📛', zIndex: 25, x: centerX - 45, y: earthCenterY+140, radius: 10, logoScale: 1.0, fillColor: 'rgba(255, 0, 0, 0)', strokeColor: 'red', strokeSize: 1, left: ['Forçage<br>Radiatif'], right: ['0.00<br>W/m²'], top: '', bottom: '', tooltip: 'Réémis', radiation: { numCircles: 8, maxRadius: 75, openingAngle: 310, color: 'red', strokeSize: 2 } }
];

// Définition du graphe : arcs (flèches)
const arcs = [
    { from: 'soleil', to: 'geometrie', label: { name: '', txt1: '', txt2: '1UA' } },
    { from: 'geometrie', to: 'albedo', label: { name: '340.25<br>W/m²', txt1: '' } },
    { from: 'geometrie', to: 'surface', label: { name: 'Albédo: ⛅50% + ❄️20%', txt2: '102.08 W/m²' } },
    { from: 'albedo', to: 'espace1', label: { name: '238.18<br>W/m²', txt1: '', txt2: '' } },
    { from: 'noyau', to: 'surface', label: { name: '0.087<br>W/m²', txt2: '' } }, 
    { from: 'surface', to: 'albedo', label: { name: '', txt1: '102.08<br>W/m²' }, color: 'red' }, 
    { from: 'albedo', to: 'espace2', label: { name: '', txt1: ''}, color: '#ff5500' },
    { from: 'reemis', to: 'surface', label: { name: '', size: '', txt1: '', relatif:'bottom' } }
];

