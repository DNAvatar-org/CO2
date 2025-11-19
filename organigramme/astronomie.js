// File: astronomie.js - Cycles de Milankovitch
// Desc: Calcul des paramètres astronomiques (excentricité, obliquité, précession) pour l'effet Milankovitch
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [January 2025]
// Logs:
//   - Initial version: implémentation des cycles de Milankovitch basés sur la date de création de la Terre

/**
 * Date de création de la Terre (t0 de référence)
 * Environ 4.54 milliards d'années avant aujourd'hui
 */
const EARTH_FORMATION_YEAR = -4540000000; // Années avant aujourd'hui (négatif = passé)

/**
 * Année actuelle (référence)
 */
const CURRENT_YEAR = 0; // 0 = aujourd'hui, valeurs négatives = passé

/**
 * Cycles de Milankovitch
 */

/**
 * Excentricité de l'orbite terrestre
 * Cycles principaux : ~100,000 ans et ~400,000 ans
 * Valeur actuelle : ~0.0167 (quasi-circulaire)
 * Variation : 0.0005 à 0.0607
 * 
 * @param {number} yearsFromNow - Années depuis aujourd'hui (négatif = passé)
 * @returns {number} Excentricité (0 = cercle parfait, 1 = parabole)
 */
function calculateEccentricity(yearsFromNow = 0) {
    const t = yearsFromNow - EARTH_FORMATION_YEAR; // Temps depuis la création de la Terre
    
    // Cycle principal de 100,000 ans
    const cycle100k = 100000;
    const phase100k = (t % cycle100k) / cycle100k * 2 * Math.PI;
    
    // Cycle secondaire de 400,000 ans
    const cycle400k = 400000;
    const phase400k = (t % cycle400k) / cycle400k * 2 * Math.PI;
    
    // Valeur de base (excentricité moyenne)
    const baseEccentricity = 0.0167;
    
    // Amplitude des variations
    const amplitude100k = 0.02;
    const amplitude400k = 0.01;
    
    // Calcul de l'excentricité avec les deux cycles
    const ecc = baseEccentricity 
        + amplitude100k * Math.sin(phase100k)
        + amplitude400k * Math.sin(phase400k);
    
    // Limiter entre les valeurs min/max observées
    return Math.max(0.0005, Math.min(0.0607, ecc));
}

/**
 * Obliquité (inclinaison de l'axe de rotation)
 * Cycle principal : ~41,000 ans
 * Valeur actuelle : ~23.44°
 * Variation : 22.1° à 24.5°
 * 
 * @param {number} yearsFromNow - Années depuis aujourd'hui (négatif = passé)
 * @returns {number} Obliquité en degrés
 */
function calculateObliquity(yearsFromNow = 0) {
    const t = yearsFromNow - EARTH_FORMATION_YEAR; // Temps depuis la création de la Terre
    
    // Cycle principal de 41,000 ans
    const cycle41k = 41000;
    const phase = (t % cycle41k) / cycle41k * 2 * Math.PI;
    
    // Valeur moyenne
    const meanObliquity = 23.44; // degrés
    
    // Amplitude de variation
    const amplitude = 1.2; // degrés
    
    // Calcul de l'obliquité
    const obliquity = meanObliquity + amplitude * Math.sin(phase);
    
    // Limiter entre les valeurs min/max observées
    return Math.max(22.1, Math.min(24.5, obliquity));
}

/**
 * Précession des équinoxes
 * Cycles principaux : ~23,000 ans et ~19,000 ans
 * Angle de précession (longitude du périhélie)
 * 
 * @param {number} yearsFromNow - Années depuis aujourd'hui (négatif = passé)
 * @returns {number} Angle de précession en degrés (0-360)
 */
function calculatePrecession(yearsFromNow = 0) {
    const t = yearsFromNow - EARTH_FORMATION_YEAR; // Temps depuis la création de la Terre
    
    // Cycle principal de 23,000 ans
    const cycle23k = 23000;
    const phase23k = (t % cycle23k) / cycle23k * 2 * Math.PI;
    
    // Cycle secondaire de 19,000 ans
    const cycle19k = 19000;
    const phase19k = (t % cycle19k) / cycle19k * 2 * Math.PI;
    
    // Angle de base
    const baseAngle = 0; // degrés
    
    // Amplitude des variations
    const amplitude23k = 180; // degrés
    const amplitude19k = 90; // degrés
    
    // Calcul de l'angle de précession
    const precession = baseAngle 
        + amplitude23k * Math.sin(phase23k)
        + amplitude19k * Math.sin(phase19k);
    
    // Normaliser entre 0 et 360 degrés
    return ((precession % 360) + 360) % 360;
}

/**
 * Calcul complet des paramètres de Milankovitch pour une année donnée
 * 
 * @param {number} yearsFromNow - Années depuis aujourd'hui (négatif = passé)
 * @returns {Object} Objet contenant excentricité, obliquité et précession
 */
function calculateMilankovitchParameters(yearsFromNow = 0) {
    return {
        eccentricity: calculateEccentricity(yearsFromNow),
        obliquity: calculateObliquity(yearsFromNow),
        precession: calculatePrecession(yearsFromNow),
        year: yearsFromNow,
        timeSinceFormation: yearsFromNow - EARTH_FORMATION_YEAR
    };
}

/**
 * Calcul de l'insolation solaire (énergie reçue) en fonction des paramètres de Milankovitch
 * Formule simplifiée basée sur l'excentricité et la précession
 * 
 * @param {number} eccentricity - Excentricité de l'orbite
 * @param {number} obliquity - Obliquité en degrés
 * @param {number} precession - Angle de précession en degrés
 * @param {number} latitude - Latitude pour le calcul (défaut: 65°N, zone sensible aux glaciations)
 * @returns {number} Insolation relative (facteur multiplicatif)
 */
function calculateInsolation(eccentricity, obliquity, precession, latitude = 65) {
    // Conversion en radians
    const obliquityRad = obliquity * Math.PI / 180;
    const precessionRad = precession * Math.PI / 180;
    const latitudeRad = latitude * Math.PI / 180;
    
    // Facteur d'excentricité (distance Terre-Soleil)
    // Plus l'excentricité est élevée, plus la variation saisonnière est importante
    const eccentricityFactor = 1 + eccentricity * 0.1;
    
    // Facteur d'obliquité (angle d'incidence solaire)
    const obliquityFactor = Math.sin(obliquityRad) * Math.sin(latitudeRad);
    
    // Facteur de précession (timing des saisons par rapport au périhélie)
    const precessionFactor = 1 + 0.1 * Math.cos(precessionRad);
    
    // Insolation relative (simplifiée)
    const insolation = eccentricityFactor * (1 + obliquityFactor) * precessionFactor;
    
    return insolation;
}

/**
 * Export des fonctions (si utilisé comme module)
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EARTH_FORMATION_YEAR,
        CURRENT_YEAR,
        calculateEccentricity,
        calculateObliquity,
        calculatePrecession,
        calculateMilankovitchParameters,
        calculateInsolation
    };
}

