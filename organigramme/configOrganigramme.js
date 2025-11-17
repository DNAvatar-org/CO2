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
const radius = 40; // Cercles plus petits
const centerX = 130; // Centre horizontal du diagramme
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
    { id: 'soleil', x: centerX-70, y: 60, radius, fillColor: 'rgba(255, 193, 7, 0)', strokeColor: '#ffee55', logo: '🌞', left: [], right: [], top: '3.8×10²⁶ W', bottom: '6.24×10⁷ W/m²', tooltip: 'Soleil', radiation: { numCircles: 8, maxRadius: null, openingAngle: 0 } },
    { id: 'geometrie', x: centerX-70, y: 200, radius, fillColor: 'rgba(255, 255, 0, 0.1)', strokeColor: '#555500', logo: '🎱', left: ["1361<br>W/m²"], right: [], top: '', bottom: '', tooltip: 'Geometrie' },
    { id: 'albedo', x: centerX+80, y: 160, radius, fillColor: 'rgba(255, 255, 255, 0.05)', strokeColor: '#333333', logo: '🪞', left: [], right: ["Albédo"], top: '', bottom: '⛅50% + ❄️20%', tooltip: 'Albédo', radiation: null },
    { id: 'espace1', x: centerX+110 , y: 25, radius, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', logo: '🛰', left: [], right: [], top: '', bottom: 'Observation', tooltip: 'Espace', radiation: null },
    { id: 'noyau', x: centerX-60 , y: 300, radius, fillColor: 'rgba(255, 69, 0, 0.5)', strokeColor: '#ff4500', logo: '🌋', left: ['Noyau'], right: [], top: 'Géothermie', bottom: '~5700 K', tooltip: 'Noyau', radiation: null },
    { id: 'surface', x: centerX + 90, y: 300, radius, fillColor: 'rgba(0, 0, 255, 0.2', strokeColor: '#111177', logo: '🌍', left: [], right: [], top: '', bottom: '', tooltip: 'Surface', radiation: null },
    { id: 'effetSerre', x: centerX - 60, y: 500, radius, fillImage: '🌫', strokeColor: '', logo: '', left: [], right: [], top: 'Athmosphère<br>Effet de Serre', bottom: '', tooltip: 'Effet de Serre', radiation: null, rectangle: { width: 100, height: 200, factors: [
        { icon: '🌵', label: 'CO₂' },
        { icon: '💧', label: 'Eau' },
        { icon: '⛽', label: 'Méthane' }
    ]} },
    { id: 'espace2', x: centerX + 100, y: 600, radius, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', logo: '🛰', left: [], right: [], top: 'Observation', bottom: '', tooltip: 'Espace', radiation: null },
    { id: 'reemis', x: centerX + 90, y: 480, radius, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', logo: '🔂', left: [], right: ['Forçage<br>Radiatif'], top: '', bottom: '0.00 W/m²', tooltip: 'Réémis', radiation: { numCircles: 8, maxRadius: null, openingAngle: 270 } }
];

// Définition du graphe : arcs (flèches)
const arcs = [
    { from: 'soleil', to: 'geometrie', label: { name: '1UA', txt1: '' } },
    { from: 'geometrie', to: 'albedo', label: { name: '340.25<br>W/m²' } },
    { from: 'albedo', to: 'espace1', label: { name: '238.18 W/m²', txt1: '' } },
    { from: 'albedo', to: 'surface', label: { name: '102.08 W/m²', txt1: '' } },
    { from: 'noyau', to: 'surface', label: { name: '0.087<br>W/m²', txt1: '' } }, 
    { from: 'surface', to: 'effetSerre', label: { name: 'IR<br>σT⁴', txt1: '' } },
    { from: 'effetSerre', to: 'espace2', label: { name: '102.08<br>W/m²', txt1: ''} },
    { from: 'effetSerre', to: 'reemis' },
    { from: 'reemis', to: 'surface', arriveAtBottom: true, label: { name: '📛', size: 'bigger', txt1: '102.08 W/m²', relatif:'bottom' } }
];

