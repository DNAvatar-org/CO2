// File: configOrganigramme.js - Configuration du diagramme de flux énergétique
// Desc: Données de configuration (nœuds et arcs) pour le diagramme de flux énergétique
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: extraction des données de configuration depuis organigramme.js

// Configuration de base
const radius = 40; // Cercles plus petits (par défaut)
const centerX = 164; // Centre horizontal du diagramme (328px / 2)
const centerY = 320; // Centre vertical du diagramme (640px / 2)
const earthCenterY = centerY+110; // Centre vertical de la Terre et éléments concentriques
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
    { id: 'soleil', logo: '🌞', x: centerX-115, y: centerY-265, radius, fillColor: 'rgba(255, 193, 7, 0)', strokeColor: 'yellow', strokeSize: 1, left: [], right: ['6.24×10⁷<br>W/m²'], top: '', bottom: '3.8×10²⁶ W', tooltip: 'Soleil', radiation: { numCircles: 8, maxRadius: 170, openingAngle: 0, color: 'yellow' } },

    { id: 'geometrie', logo: '🎱', x: centerX+85, y: centerY-265, radius: 30, fillColor: 'rgba(255, 255, 0, 0)', strokeColor: '#000000', left: [], right: [], top: '1361 W/m²', bottom: 'Geometrie', tooltip: 'Geometrie', radiation: { numCircles: 5, maxRadius: 200, openingAngle: 340, rotation: 105, color: 'white' }, zIndex: 10, logoScale: 2.0, logoOffsetY: 1 },

    { id: 'espace1', logo: '🛰', x: centerX+120, y: centerY-160, radius, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [], right: [], top: 'Observation', bottom: '', tooltip: 'Espace', radiation: null },

    { id: 'albedo', logo: '🏐', x: centerX, y: earthCenterY, radius: 160, fillColor: 'rgba(0, 200, 255, 0.2)', strokeColor: 'white', left: [], right: [], top: 'Albédo: ⛅50% + ❄️20%', bottom: '', tooltip: 'Albédo', radiation: { numCircles: 5, maxRadius: 250, openingAngle: 340, rotation: 295, color: 'white' }, zIndex: 10, logoScale: 1.0 },

    { id: 'noyau', logo: '🌋', x: centerX-2, y: earthCenterY, radius: 30, fillColor: 'rgba(255, 69, 0, 0.5)', strokeColor: '#ff4500', left: [], right: [], top: 'Géothermie', bottom: '~5700 K', tooltip: 'Noyau', radiation: null, zIndex: 20 },

    { id: 'surface', logo: '🌍', x: centerX, y: earthCenterY, radius: 130, fillColor: 'rgba(0, 200, 255, 0.3)', strokeColor: '#00eeff', strokeSize: 1, left: [], right: [], top: '102.08 W/m²', bottom: '', tooltip: 'Surface', radiation: null, zIndex: 15, logoScale: 1.9, logoOffsetY: 4.5 },

    { id: 'effetSerre', logo: '', x: centerX - 70, y: centerY+500, radius, fillImage: '🌫', strokeColor: '', left: [], right: [], top: 'Athmosphère<br>Effet de Serre', bottom: '', tooltip: 'Effet de Serre', radiation: null, rectangle: { width: 130, height: 200, factors: [
        { icon: '🌵', label: 'CO₂' },
        { icon: '💧', label: 'Eau' },
        { icon: '⛽', label: 'Méthane' }
    ]} },

    { id: 'espace2', logo: '🛰', x: centerX + 135, y: centerY+600, radius, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [], right: [], top: 'Observation', bottom: '', tooltip: 'Espace', radiation: null },

    { id: 'reemis', logo: '🔂', x: centerX + 90, y: centerY+480, radius, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [], right: ['Forçage<br>Radiatif'], top: '', bottom: '0.00 W/m²', tooltip: 'Réémis', radiation: { numCircles: 8, maxRadius: null, openingAngle: 310 } }
];

// Définition du graphe : arcs (flèches)
const arcs = [
    { from: 'soleil', to: 'geometrie', color: 'yellow', label: { name: '1UA', txt1: '', txt2: '' } },
    { from: 'geometrie', to: 'albedo', color: 'yellow', label: { name: '340.25<br>W/m²', txt1: '' } },
    { from: 'albedo', to: 'espace1', label: { name: '238.18 W/m²', txt1: '', txt2: '' } },
    //{ from: 'albedo', to: 'surface', label: { name: '', txt1: '' } },
    { from: 'noyau', to: 'surface', color: 'red', label: { name: '', txt2: '0.087<br>W/m²' } }, 
    { from: 'surface', to: 'effetSerre', label: { name: 'IR<br>σT⁴', txt1: '' } },
    { from: 'effetSerre', to: 'espace2', label: { name: 'Y102.08<br>W/m²', txt1: ''} },
    { from: 'effetSerre', to: 'reemis' },
    { from: 'reemis', to: 'surface', arriveAtBottom: true, label: { name: '📛', size: 'bigger', txt1: '102.08 W/m²', relatif:'bottom' } }
];

