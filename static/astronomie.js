// File: astronomie.js - Cycles de Milankovitch
// Desc: Calcul des paramètres astronomiques (excentricité, obliquité, précession) pour l'effet Milankovitch
// Version 2.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - v2.0.0: Ajout calcul distance Terre-Soleil, intensité solaire, et effets sur le climat
//   - v1.0.0: Initial version: implémentation des cycles de Milankovitch basés sur la date de création de la Terre

/**
 * CONSTANTES ASTRONOMIQUES
 */

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
 * Unité Astronomique (UA) - Constante de référence fixe
 * 
 * L'UA est une unité de mesure définie par l'Union Astronomique Internationale (2012) :
 * 1 UA = 149,597,870,700 mètres exactement (≈ 1.496 × 10^11 m)
 * 
 * IMPORTANT : L'UA est une CONSTANTE de référence, pas la distance réelle !
 * 
 * RELATION DISTANCE / EXCENTRICITÉ / ÉPOQUES :
 * 
 * 1. La distance MOYENNE (demi-grand axe) reste toujours ≈ 1 UA (constante)
 *    - Peu importe l'époque, la distance moyenne Terre-Soleil ≈ 1 UA
 * 
 * 2. La distance RÉELLE varie avec l'EXCENTRICITÉ (pas directement avec les époques)
 *    - Si excentricité = 0 : orbite circulaire → distance constante = 1 UA
 *    - Si excentricité = 0.01 : distance varie de 0.99 UA à 1.01 UA
 *    - Si excentricité = 0.06 : distance varie de 0.94 UA à 1.06 UA
 * 
 * 3. L'excentricité varie avec les ÉPOQUES (via les cycles de Milankovitch)
 *    - Cycles de 100,000 ans et 400,000 ans
 *    - Donc indirectement, la distance réelle varie avec les époques
 *    - Mais c'est l'excentricité qui est la cause directe de la variation
 * 
 * Exemple concret :
 * - Époque A : excentricité = 0.01 → distance varie de 0.99 UA à 1.01 UA
 * - Époque B : excentricité = 0.05 → distance varie de 0.95 UA à 1.05 UA
 * - La distance moyenne reste toujours ≈ 1 UA dans les deux cas
 */
const ASTRONOMICAL_UNIT = 149597870700; // mètres (valeur exacte de la définition)
const ASTRONOMICAL_UNIT_KM = ASTRONOMICAL_UNIT / 1000; // ≈ 149,597,870.7 km

/**
 * Constante solaire actuelle (intensité du rayonnement solaire)
 * Valeur actuelle : ~1361 W/m² (au sommet de l'atmosphère)
 * Note: Cette valeur varie légèrement avec l'activité solaire, mais pas avec les cycles de Milankovitch
 * Les cycles de Milankovitch modifient la DISTRIBUTION de cette énergie, pas sa valeur totale
 */
const SOLAR_CONSTANT = 1361; // W/m²

/**
 * CYCLES DE MILANKOVITCH
 * 
 * Les cycles de Milankovitch sont des variations périodiques des paramètres orbitaux de la Terre
 * qui modifient la quantité et la distribution de l'énergie solaire reçue.
 * 
 * Il y a 5 cycles principaux au total :
 * 
 * 1. EXCENTRICITÉ (2 cycles) : Variation de la forme de l'orbite (elliptique ↔ circulaire)
 *    - Cycle 1 : ~100,000 ans (cycle principal)
 *    - Cycle 2 : ~400,000 ans (cycle secondaire, modulation du cycle principal)
 *    - Effet : Modifie la distance Terre-Soleil (périhélie/aphélie)
 *    - Impact : Variation de l'intensité solaire reçue selon la position sur l'orbite
 *    - Valeur actuelle : ~0.0167 (quasi-circulaire)
 *    - Variation : 0.0005 à 0.0607
 * 
 * 2. OBLIQUITÉ (1 cycle) : Variation de l'inclinaison de l'axe de rotation
 *    - Cycle : ~41,000 ans
 *    - Effet : Modifie l'intensité des saisons
 *    - Impact : Plus l'obliquité est élevée, plus les saisons sont marquées
 *    - Valeur actuelle : ~23.44°
 *    - Variation : 22.1° à 24.5°
 * 
 * 3. PRÉCESSION (2 cycles) : Rotation de l'axe de rotation (comme une toupie)
 *    - Cycle 1 : ~23,000 ans (cycle principal)
 *    - Cycle 2 : ~19,000 ans (cycle secondaire)
 *    - Effet : Change quand les saisons se produisent par rapport au périhélie
 *    - Impact : Détermine quel hémisphère reçoit plus d'énergie en été
 *    - Les deux cycles se combinent pour créer une précession effective de ~21,000 ans
 * 
 * TOTAL : 5 cycles (2 pour excentricité + 1 pour obliquité + 2 pour précession)
 * 
 * Ces cycles se combinent pour créer des périodes de glaciations :
 * - Quand plusieurs cycles se synchronisent (excentricité faible + obliquité faible + précession défavorable),
 *   l'hémisphère nord reçoit moins d'énergie en été, favorisant l'accumulation de glace
 * 
 * IMPORTANT : Validité temporelle des cycles de Milankovitch
 * - Pertinents sur des échelles de 10,000 à 500,000 ans
 * - Au-delà d'1 million d'années, d'autres facteurs deviennent dominants :
 *   * Évolution du soleil (luminosité croissante)
 *   * Tectonique des plaques (configuration des continents)
 *   * Volcanisme majeur
 *   * Impacts de météorites
 * - Pour les époques géologiques très anciennes (Hadéen, Archéen), 
 *   les cycles de Milankovitch ont un impact limité comparé aux autres facteurs
 */

/**
 * Excentricité de l'orbite terrestre
 * Cycles principaux : ~100,000 ans et ~400,000 ans
 * Valeur actuelle : ~0.0167 (quasi-circulaire)
 * Variation : 0.0005 à 0.0607
 * 
 * L'excentricité détermine la forme de l'orbite :
 * - e = 0 : cercle parfait (distance constante = 1 UA)
 * - e > 0 : ellipse (distance varie entre périhélie et aphélie)
 * 
 * IMPORTANT : C'est l'excentricité qui fait varier la distance réelle !
 * - La distance moyenne reste toujours ≈ 1 UA (demi-grand axe)
 * - Mais la distance réelle varie selon : distance = 1 UA × (1 ± e)
 * 
 * Exemples selon l'excentricité :
 * - e = 0.01 → distance varie de 0.99 UA à 1.01 UA
 * - e = 0.05 → distance varie de 0.95 UA à 1.05 UA
 * - e = 0.06 → distance varie de 0.94 UA à 1.06 UA (maximum observé)
 * 
 * L'excentricité varie avec les époques (cycles de Milankovitch),
 * donc la distance réelle varie indirectement avec les époques.
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
 * Obliquité (inclinaison de l'axe de rotation de la Terre)
 * Cycle principal : ~41,000 ans
 * Valeur actuelle : ~23.44°
 * Variation : 22.1° à 24.5°
 * 
 * L'obliquité est l'ANGLE DE L'AXE (l'ouverture) :
 * - C'est l'angle entre l'axe de rotation de la Terre et la perpendiculaire au plan orbital
 * - Actuellement : ~23.44° (l'axe est incliné de 23.44° par rapport à la verticale)
 * 
 * Effets sur le climat :
 * - Plus l'obliquité est ÉLEVÉE → saisons plus marquées (été plus chaud, hiver plus froid)
 * - Plus l'obliquité est FAIBLE → saisons plus douces (été moins chaud, hiver moins froid)
 * - Impact important : détermine l'intensité des saisons
 * 
 * Exemple : Si obliquité = 0° (axe vertical) → pas de saisons (toujours équinoxe)
 *           Si obliquité = 30° (axe très incliné) → saisons très marquées
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
 * La précession est la ROTATION DE L'AXE (comme une toupie) :
 * - C'est l'étoile pointée, la pointe de la toupie qui tourne
 * - L'axe de rotation de la Terre décrit un cercle complet en ~26,000 ans
 * - Actuellement, l'axe pointe vers l'étoile Polaire (Polaris)
 * - Dans ~13,000 ans, il pointera vers Vega
 * 
 * Effets sur le climat :
 * - La précession détermine QUAND les saisons se produisent par rapport au périhélie/aphélie
 * - Si l'été (hémisphère nord) coïncide avec le périhélie → été plus chaud
 * - Si l'été coïncide avec l'aphélie → été plus froid
 * 
 * Impact sur 100 ans :
 * - Sur 100 ans, la précession change de ~1.4° (360° / 26,000 ans × 100 ans)
 * - Effet très faible sur 100 ans (cycle de 23,000 ans)
 * - Mais sur des milliers d'années, l'effet devient significatif
 * - C'est la combinaison avec l'excentricité qui crée les variations importantes
 * 
 * Exemple concret :
 * - Actuellement : périhélie en janvier (hiver hémisphère nord)
 * - Dans ~13,000 ans : périhélie en juillet (été hémisphère nord)
 * - Si excentricité élevée : différence importante entre été chaud et hiver froid
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
 * @returns {Object} Objet contenant tous les paramètres orbitaux et leurs effets
 */
function calculateMilankovitchParameters(yearsFromNow = 0) {
    const eccentricity = calculateEccentricity(yearsFromNow);
    const obliquity = calculateObliquity(yearsFromNow);
    const precession = calculatePrecession(yearsFromNow);
    
    // Calcul des distances périhélie/aphélie
    const distances = calculatePerihelionAphelion(eccentricity);
    
    // Calcul des intensités solaires aux distances extrêmes
    const intensityPerihelion = calculateSolarIntensity(distances.perihelion);
    const intensityAphelion = calculateSolarIntensity(distances.aphelion);
    const intensityMean = calculateSolarIntensity(1.0); // À 1 UA
    
    return {
        // Paramètres orbitaux
        eccentricity: eccentricity,
        obliquity: obliquity,
        precession: precession,
        
        // Distances Terre-Soleil
        distancePerihelion: distances.perihelion, // UA
        distanceAphelion: distances.aphelion,     // UA
        distanceVariation: distances.variation,   // UA
        
        // Intensités solaires
        solarIntensityPerihelion: intensityPerihelion, // W/m²
        solarIntensityAphelion: intensityAphelion,     // W/m²
        solarIntensityMean: intensityMean,              // W/m² (à 1 UA)
        solarIntensityVariation: intensityPerihelion - intensityAphelion, // W/m²
        
        // Métadonnées
        year: yearsFromNow,
        timeSinceFormation: yearsFromNow - EARTH_FORMATION_YEAR
    };
}

/**
 * Calcul de la distance Terre-Soleil en fonction de l'excentricité et de la position sur l'orbite
 * 
 * La distance réelle varie selon :
 * - L'excentricité de l'orbite (forme : cercle ↔ ellipse)
 * - La position sur l'orbite (périhélie = plus proche, aphélie = plus loin)
 * 
 * Note : Le demi-grand axe (distance moyenne) est toujours ≈ 1 UA,
 * mais la distance réelle varie autour de cette moyenne.
 * 
 * @param {number} eccentricity - Excentricité de l'orbite (0-1)
 * @param {number} trueAnomaly - Anomalie vraie (angle sur l'orbite, 0-360°)
 *                                0° = périhélie (plus proche), 180° = aphélie (plus loin)
 * @returns {number} Distance en UA (Unités Astronomiques)
 */
function calculateEarthSunDistance(eccentricity, trueAnomaly = 0) {
    // Conversion en radians
    const nu = trueAnomaly * Math.PI / 180;
    
    // Formule de l'ellipse : r = a(1-e²) / (1 + e·cos(ν))
    // où a = demi-grand axe = 1 UA (distance moyenne, constante)
    // e = excentricité (varie selon les époques)
    // ν = anomalie vraie (position sur l'orbite)
    const a = 1.0; // UA (distance moyenne, toujours la même)
    const numerator = a * (1 - eccentricity * eccentricity);
    const denominator = 1 + eccentricity * Math.cos(nu);
    const distanceUA = numerator / denominator;
    
    return distanceUA;
}

/**
 * Conversion de UA en mètres
 * 
 * @param {number} distanceUA - Distance en UA
 * @returns {number} Distance en mètres
 */
function convertUAtoMeters(distanceUA) {
    return distanceUA * ASTRONOMICAL_UNIT;
}

/**
 * Conversion de UA en kilomètres
 * 
 * @param {number} distanceUA - Distance en UA
 * @returns {number} Distance en kilomètres
 */
function convertUAtoKilometers(distanceUA) {
    return distanceUA * ASTRONOMICAL_UNIT_KM;
}

/**
 * Calcul de la distance minimale (périhélie) et maximale (aphélie) en fonction de l'excentricité
 * 
 * Le demi-grand axe (distance moyenne) est toujours ≈ 1 UA, mais :
 * - Si excentricité = 0 : orbite circulaire, distance constante = 1 UA
 * - Si excentricité = 0.01 : distance varie de 0.99 UA à 1.01 UA
 * - Si excentricité = 0.06 : distance varie de 0.94 UA à 1.06 UA (maximum observé)
 * 
 * @param {number} eccentricity - Excentricité de l'orbite (0-1)
 * @returns {Object} {
 *   perihelion: distance minimale en UA,
 *   aphelion: distance maximale en UA,
 *   perihelion_km: distance minimale en km,
 *   aphelion_km: distance maximale en km,
 *   variation: variation totale en UA,
 *   meanDistance: distance moyenne en UA (toujours ≈ 1 UA)
 * }
 */
function calculatePerihelionAphelion(eccentricity) {
    const a = 1.0; // UA (demi-grand axe = distance moyenne, constante)
    const perihelion = a * (1 - eccentricity); // Distance minimale (périhélie)
    const aphelion = a * (1 + eccentricity);    // Distance maximale (aphélie)
    
    return {
        perihelion: perihelion, // UA
        aphelion: aphelion,     // UA
        perihelion_km: convertUAtoKilometers(perihelion), // km
        aphelion_km: convertUAtoKilometers(aphelion),      // km
        variation: aphelion - perihelion, // Variation totale en UA
        meanDistance: a // Distance moyenne (toujours 1 UA)
    };
}

/**
 * Calcul de l'intensité solaire reçue en fonction de la distance Terre-Soleil
 * Loi en 1/r² (inverse du carré de la distance)
 * 
 * @param {number} distanceUA - Distance Terre-Soleil en UA
 * @returns {number} Intensité solaire en W/m²
 */
function calculateSolarIntensity(distanceUA) {
    // Loi en 1/r² : l'intensité est inversement proportionnelle au carré de la distance
    // À 1 UA, l'intensité = SOLAR_CONSTANT
    const intensity = SOLAR_CONSTANT / (distanceUA * distanceUA);
    return intensity;
}

/**
 * Calcul de l'insolation solaire (énergie reçue) en fonction des paramètres de Milankovitch
 * Formule basée sur l'excentricité, l'obliquité et la précession
 * 
 * @param {number} eccentricity - Excentricité de l'orbite
 * @param {number} obliquity - Obliquité en degrés
 * @param {number} precession - Angle de précession en degrés
 * @param {number} latitude - Latitude pour le calcul (défaut: 65°N, zone sensible aux glaciations)
 * @param {number} season - Saison : 0=équinoxe, 90=solstice été, 180=équinoxe, 270=solstice hiver
 * @returns {number} Insolation en W/m²
 */
function calculateInsolation(eccentricity, obliquity, precession, latitude = 65, season = 0) {
    // Conversion en radians
    const obliquityRad = obliquity * Math.PI / 180;
    const precessionRad = precession * Math.PI / 180;
    const latitudeRad = latitude * Math.PI / 180;
    const seasonRad = season * Math.PI / 180;
    
    // 1. Effet de l'excentricité sur la distance Terre-Soleil
    // La précession détermine quand les saisons se produisent par rapport au périhélie
    // Si précession = 0°, le périhélie coïncide avec l'équinoxe d'automne (hémisphère nord)
    const trueAnomaly = (season + precession) % 360;
    const distanceUA = calculateEarthSunDistance(eccentricity, trueAnomaly);
    const solarIntensity = calculateSolarIntensity(distanceUA);
    
    // 2. Effet de l'obliquité sur l'angle d'incidence solaire
    // L'obliquité détermine l'intensité des saisons
    // Angle d'incidence = fonction de l'obliquité, de la latitude et de la saison
    const declination = obliquityRad * Math.sin(seasonRad); // Déclinaison solaire
    const hourAngle = 0; // Midi (angle horaire = 0)
    const solarElevation = Math.asin(
        Math.sin(latitudeRad) * Math.sin(declination) +
        Math.cos(latitudeRad) * Math.cos(declination) * Math.cos(hourAngle)
    );
    
    // Facteur d'obliquité : plus l'angle d'élévation est élevé, plus l'insolation est forte
    const obliquityFactor = Math.max(0, Math.sin(solarElevation));
    
    // 3. Calcul de l'insolation totale
    // L'insolation dépend de l'intensité solaire ET de l'angle d'incidence
    const insolation = solarIntensity * obliquityFactor;
    
    return insolation;
}

/**
 * Export des fonctions (si utilisé comme module)
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EARTH_FORMATION_YEAR,
        CURRENT_YEAR,
        ASTRONOMICAL_UNIT,
        ASTRONOMICAL_UNIT_KM,
        SOLAR_CONSTANT,
        calculateEccentricity,
        calculateObliquity,
        calculatePrecession,
        calculateEarthSunDistance,
        calculatePerihelionAphelion,
        calculateSolarIntensity,
        calculateMilankovitchParameters,
        calculateInsolation,
        convertUAtoMeters,
        convertUAtoKilometers
    };
}

// Export global (pour utilisation dans le navigateur)
if (typeof window !== 'undefined') {
    window.astronomie = {
        EARTH_FORMATION_YEAR,
        CURRENT_YEAR,
        ASTRONOMICAL_UNIT,
        ASTRONOMICAL_UNIT_KM,
        SOLAR_CONSTANT,
        calculateEccentricity,
        calculateObliquity,
        calculatePrecession,
        calculateEarthSunDistance,
        calculatePerihelionAphelion,
        calculateSolarIntensity,
        calculateMilankovitchParameters,
        calculateInsolation,
        convertUAtoMeters,
        convertUAtoKilometers
    };
}

