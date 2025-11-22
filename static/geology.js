// ============================================================================
// File: geology.js - Époques géologiques et volcanisme
// Desc: En français, dans l'architecture, je suis le module de géologie
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: geological eras and volcanic activity
// ============================================================================

// Définition des époques géologiques avec facteur multiplicatif pour les volcans
// Au début de la Terre, il y avait beaucoup plus de volcanisme
const GEOLOGICAL_ERAS = [
    { name: 'Corps noir', startYears: 5.0e9, endYears: 4.5e9, volcanoFactor: 0.0, co2PerVolcano: 0 }, // Avant formation de la Lune (4,5 Ga), pas de différenciation, pas de volcans
    { name: 'Hadéen', startYears: 4.5e9, endYears: 4.0e9, volcanoFactor: 10.0, co2PerVolcano: 500 }, // Après formation de la Lune : volcanisme intense
    { name: 'Archéen', startYears: 4.0e9, endYears: 2.5e9, volcanoFactor: 5.0, co2PerVolcano: 300 },  // Volcanisme très actif
    { name: 'Protérozoïque', startYears: 2.5e9, endYears: 541e6, volcanoFactor: 2.0, co2PerVolcano: 200 }, // Volcanisme modéré
    { name: 'Phanérozoïque', startYears: 541e6, endYears: 0, volcanoFactor: 1.0, co2PerVolcano: 150 }  // Époque actuelle : volcanisme normal
];

// Événements géologiques majeurs qui séparent les époques
const GEOLOGICAL_EVENTS = [
    {
        name: 'Formation de la Lune',
        dateYears: 4.5e9, // 4,5 milliards d'années
        description: 'Impact géant avec Théia : différenciation du noyau, réchauffement du noyau, création du champ magnétique terrestre',
        effects: {
            coreDifferentiation: true, // Noyau différencié (fer-nickel)
            magneticField: true, // Champ magnétique créé
            coreHeating: true, // Réchauffement du noyau par l\'impact
            volcanismEnabled: true // Volcanisme possible après différenciation
        }
    },
    {
        name: 'Solidification de la croûte',
        dateYears: 3.5e9, // 3,5 milliards d'années
        description: 'Croûte terrestre suffisamment solidifiée, fin de la période de croûte molle',
        effects: {
            crustSolidified: true // Croûte solide
        }
    },
    {
        name: 'Grande Oxydation',
        dateYears: 2.5e9, // 2,5 milliards d'années
        description: 'Apparition de l\'oxygène dans l\'atmosphère, déclin du méthane',
        effects: {
            oxygenAtmosphere: true, // Oxygène dans l\'atmosphère
            methaneDecline: true // Déclin du méthane
        }
    },
    {
        name: 'Explosion cambrienne',
        dateYears: 541e6, // 541 millions d\'années
        description: 'Apparition de la vie complexe, diversification rapide',
        effects: {
            complexLife: true // Vie complexe
        }
    },
    {
        name: 'Extinction Crétacé-Paléogène',
        dateYears: 66e6, // 66 millions d\'années
        description: 'Impact d\'astéroïde, extinction des dinosaures',
        effects: {
            massExtinction: true // Extinction massive
        }
    }
];

// Définition des périodes géologiques détaillées avec conditions initiales et emojis
// Basé sur epoquesGeologiques.txt
const GEOLOGICAL_PERIODS = [
    {
        name: 'Corps noir',
        startYears: 5.0e9,
        endYears: 4.5e9,
        emoji: '⚫',
        co2_ppm: 0,
        ch4_ppm: 0,
        h2o_enabled: false,
        cloud_coverage: 0,
        core_temperature_k: null,
        geothermal_flux: 0,
        albedo_base: 0.0, // Corps noir pur : aucune réflexion
        // Composantes d'albedo (en % de couverture)
        ocean_albedo: 0.08, ocean_coverage: 0,      // Océans : 0.05-0.10
        forest_albedo: 0.12, forest_coverage: 0,    // Forêts : 0.05-0.20
        desert_albedo: 0.30, desert_coverage: 0,    // Déserts : ~0.30
        ice_albedo: 0.70, ice_coverage: 0,          // Glace : 0.40-0.90
        cloud_albedo: 0.40,                        // Nuages : 0.30-0.95 (déjà dans cloud_coverage)
        description: 'État initial : corps noir pur, avant formation de la Lune (4,5 Ga), pas de noyau différencié, pas d\'atmosphère, température ~206.1K'
    },
    {
        name: 'Hadéen',
        startYears: 4.5e9,
        endYears: 4.0e9,
        emoji: '🌕',
        co2_ppm: 7000,
        ch4_ppm: 100,
        h2o_enabled: false, // Pas d'eau dans l'atmosphère selon données scientifiques
        cloud_coverage: 0,   // Pas de nuages sans eau
        core_temperature_k: 6000,
        geothermal_flux: 15,
        albedo_base: 0.05, // Magma en fusion : albedo très faible (similaire à lave actuelle ~0.04-0.05)
        // Composantes d'albedo (en fraction 0-1 pour couverture, albedo en 0-1)
        ocean_albedo: 0.08, ocean_coverage: 0,      // Pas d'océans (magma)
        forest_albedo: 0.12, forest_coverage: 0,    // Pas de forêts
        desert_albedo: 0.30, desert_coverage: 0,     // Pas de déserts (magma)
        ice_albedo: 0.70, ice_coverage: 0,           // Pas de glace (températures élevées)
        cloud_albedo: 0.40,                          // Nuages : 0.30-0.95 (déjà dans cloud_coverage)
        magma_albedo: 0.05, magma_coverage: 1.0,     // Magma en fusion : ~0.04-0.05, 100% de couverture
        description: 'Atmosphère dense, peu d\'O₂, beaucoup de CO₂, températures élevées (>50°C)'
    },
    {
        name: 'Archéen',
        startYears: 4.0e9,
        endYears: 2.5e9,
        emoji: '🦠',
        co2_ppm: 5000,
        ch4_ppm: 80,
        h2o_enabled: true,
        cloud_coverage: 0.7,
        core_temperature_k: 5900,
        geothermal_flux: 0.3,
        albedo_base: 0.12, // Premiers océans, peu de continents : albedo faible mais supérieur à Hadéen
        // Composantes d'albedo (en fraction 0-1 pour couverture, albedo en 0-1)
        ocean_albedo: 0.08, ocean_coverage: 0.80,    // Premiers océans
        forest_albedo: 0.12, forest_coverage: 0,     // Pas de forêts
        desert_albedo: 0.30, desert_coverage: 0.05,  // Peu de continents
        ice_albedo: 0.70, ice_coverage: 0,           // Pas de glace
        cloud_albedo: 0.40,                          // Nuages : 0.30-0.95 (déjà dans cloud_coverage)
        description: 'Atmosphère dense, peu d\'O₂, beaucoup de CO₂, précipitations abondantes'
    },
    {
        name: 'Protérozoïque',
        startYears: 2.5e9,
        endYears: 541e6,
        emoji: '🌿',
        co2_ppm: 2000,
        ch4_ppm: 25,
        h2o_enabled: true,
        cloud_coverage: 0.4,
        core_temperature_k: 5850,
        geothermal_flux: 0.15,
        albedo_base: 0.20, // Plus de continents, début de végétation : albedo intermédiaire
        // Composantes d'albedo (en fraction 0-1 pour couverture, albedo en 0-1)
        ocean_albedo: 0.08, ocean_coverage: 0.70,     // Océans
        forest_albedo: 0.12, forest_coverage: 0.05,  // Début de végétation
        desert_albedo: 0.30, desert_coverage: 0.15,   // Plus de continents
        ice_albedo: 0.70, ice_coverage: 0,            // Glace calculée dynamiquement
        cloud_albedo: 0.40,                           // Nuages : 0.30-0.95 (déjà dans cloud_coverage)
        description: 'Déclin progressif du CO₂, apparition de glaciations'
    },
    {
        name: 'Cryogénien',
        startYears: 720e6,
        endYears: 635e6,
        emoji: '❄️',
        co2_ppm: 1000,
        ch4_ppm: 15,
        h2o_enabled: true,
        cloud_coverage: 0.3,
        core_temperature_k: 5800,
        geothermal_flux: 0.12,
        albedo_base: 0.25, // Terre glacée : albedo élevé (la glace sera ajoutée par calculateAlbedo)
        // Composantes d'albedo (en fraction 0-1 pour couverture, albedo en 0-1)
        ocean_albedo: 0.08, ocean_coverage: 0,       // Océans gelés
        forest_albedo: 0.12, forest_coverage: 0,     // Pas de forêts
        desert_albedo: 0.30, desert_coverage: 0,     // Pas de déserts
        ice_albedo: 0.70, ice_coverage: 1.0,         // Terre entièrement glacée
        cloud_albedo: 0.40,                          // Nuages : 0.30-0.95 (déjà dans cloud_coverage)
        description: 'Boule de neige - Terre entièrement glacée'
    },
    {
        name: 'Mésozoïque',
        startYears: 252e6,
        endYears: 66e6,
        emoji: '🦕',
        co2_ppm: 2500,
        ch4_ppm: 8,
        h2o_enabled: true,
        cloud_coverage: 0.5,
        core_temperature_k: 5750,
        geothermal_flux: 0.10,
        albedo_base: 0.28, // Végétation abondante, océans : proche de la valeur moderne
        // Composantes d'albedo (en fraction 0-1 pour couverture, albedo en 0-1)
        ocean_albedo: 0.08, ocean_coverage: 0.70,     // Océans
        forest_albedo: 0.12, forest_coverage: 0.20,    // Végétation abondante
        desert_albedo: 0.30, desert_coverage: 0.10,   // Quelques déserts
        ice_albedo: 0.70, ice_coverage: 0,            // Peu de glace
        cloud_albedo: 0.40,                           // Nuages : 0.30-0.95 (déjà dans cloud_coverage)
        description: 'CO₂ élevé, périodes chaudes, peu de glaces'
    },
    {
        name: 'Crétacé',
        startYears: 145e6,
        endYears: 66e6,
        emoji: '🦴',
        co2_ppm: 3000,
        ch4_ppm: 10,
        h2o_enabled: true,
        cloud_coverage: 0.5,
        core_temperature_k: 5740,
        geothermal_flux: 0.095,
        albedo_base: 0.28, // Similaire au Mésozoïque : végétation, océans
        // Composantes d'albedo (en fraction 0-1 pour couverture, albedo en 0-1)
        ocean_albedo: 0.08, ocean_coverage: 0.70,     // Océans
        forest_albedo: 0.12, forest_coverage: 0.20,   // Végétation
        desert_albedo: 0.30, desert_coverage: 0.10,   // Quelques déserts
        ice_albedo: 0.70, ice_coverage: 0,            // Peu de glace
        cloud_albedo: 0.40,                           // Nuages : 0.30-0.95 (déjà dans cloud_coverage)
        description: 'Températures +6 à +8°C, CO₂ très élevé, peu de glace'
    },
    {
        name: 'Cénozoïque',
        startYears: 66e6,
        endYears: 0,
        emoji: '🦣',
        co2_ppm: 280,
        ch4_ppm: 0.7,
        h2o_enabled: true,
        cloud_coverage: 0.4,
        core_temperature_k: 5700,
        geothermal_flux: 0.087,
        albedo_base: 0.30, // Valeur moderne : océans, continents, végétation
        // Composantes d'albedo (en fraction 0-1 pour couverture, albedo en 0-1)
        ocean_albedo: 0.08, ocean_coverage: 0.70,     // Océans
        forest_albedo: 0.12, forest_coverage: 0.15,   // Forêts
        desert_albedo: 0.30, desert_coverage: 0.10,   // Déserts
        ice_albedo: 0.70, ice_coverage: 0.05,          // Glace (calculée dynamiquement)
        cloud_albedo: 0.40,                            // Nuages : 0.30-0.95 (déjà dans cloud_coverage)
        description: 'Forte chute du CO₂, alternance glaces/interglaciaires'
    },
    {
        name: 'Aujourd\'hui',
        startYears: 0,
        endYears: -1,
        emoji: '🌈',
        co2_ppm: 420,
        ch4_ppm: 1.9,
        h2o_enabled: true,
        cloud_coverage: 0.4,
        core_temperature_k: 5700,
        geothermal_flux: 0.087,
        albedo_base: 0.30, // Valeur moderne mesurée par satellites (IPCC)
        // Composantes d'albedo (en fraction 0-1 pour couverture, albedo en 0-1) - valeurs modernes
        ocean_albedo: 0.08, ocean_coverage: 0.70,     // Océans : 0.05-0.10
        forest_albedo: 0.12, forest_coverage: 0.15,   // Forêts : 0.05-0.20
        desert_albedo: 0.30, desert_coverage: 0.10,   // Déserts : ~0.30
        ice_albedo: 0.70, ice_coverage: 0.05,          // Glace : 0.40-0.90 (calculée dynamiquement)
        cloud_albedo: 0.40,                            // Nuages : 0.30-0.95 (déjà dans cloud_coverage)
        description: 'État actuel de la Terre (2024)'
    }
];

// Fonction pour obtenir une période géologique par son nom
function getGeologicalPeriodByName(periodName) {
    return GEOLOGICAL_PERIODS.find(p => p.name === periodName);
}

// Fonction pour obtenir la période géologique selon les années
function getGeologicalPeriod(yearsAgo) {
    // Parcourir les périodes de la plus récente à la plus ancienne
    for (const period of GEOLOGICAL_PERIODS) {
        if (yearsAgo >= period.endYears && yearsAgo < period.startYears) {
            return period;
        }
    }

    // Si yearsAgo < 0 (futur), retourner la période actuelle
    if (yearsAgo < 0) {
        return GEOLOGICAL_PERIODS[GEOLOGICAL_PERIODS.length - 1]; // Cénozoïque
    }

    // Si yearsAgo >= 5.0e9, retourner Corps noir (avant formation de la Terre)
    // Si yearsAgo >= 4.6e9, retourner Corps noir (jusqu'à formation de la Terre)
    if (yearsAgo >= GEOLOGICAL_PERIODS[0].endYears) {
        return GEOLOGICAL_PERIODS[0]; // Corps noir
    }

    // Par défaut, retourner la période actuelle
    return GEOLOGICAL_PERIODS[GEOLOGICAL_PERIODS.length - 1];
}

// ============================================================================
// CYCLE DE CROÛTE TERRESTRE MOLLE
// ============================================================================
// Pendant les premières centaines de millions d'années après la formation de la Terre,
// la croûte était encore très chaude et molle, permettant un volcanisme extrêmement intense.
// Ce facteur multiplie le nombre de volcans par clic (x10 ou x100).

const CRUST_MOLTEN_START = 4.6e9;  // Début : formation de la Terre (4.6 Ga)
const CRUST_MOLTEN_END = 3.5e9;    // Fin : croûte solidifiée (3.5 Ga)
const CRUST_MOLTEN_FACTOR_MAX = 100; // Facteur maximum (x100) au tout début
const CRUST_MOLTEN_FACTOR_MIN = 10;  // Facteur minimum (x10) à la fin de la période

// Fonction pour calculer le facteur de croûte terrestre molle
// Retourne un facteur multiplicatif pour le nombre de volcans (1.0 = pas d'effet, 100 = x100)
function getMoltenCrustFactor(yearsAgo) {
    // Si on est avant la période de croûte molle, pas d'effet
    if (yearsAgo < CRUST_MOLTEN_END) {
        return 1.0; // Pas de croûte molle
    }

    // Si on est après le début de la Terre, facteur maximum
    if (yearsAgo >= CRUST_MOLTEN_START) {
        return CRUST_MOLTEN_FACTOR_MAX; // x100 au tout début
    }

    // Interpolation linéaire entre le début (x100) et la fin (x10)
    // Plus on s'éloigne du début, plus le facteur diminue
    const progress = (yearsAgo - CRUST_MOLTEN_END) / (CRUST_MOLTEN_START - CRUST_MOLTEN_END);
    const factor = CRUST_MOLTEN_FACTOR_MIN + (CRUST_MOLTEN_FACTOR_MAX - CRUST_MOLTEN_FACTOR_MIN) * (1 - progress);

    return factor;
}

// Fonction pour obtenir l'époque géologique et le facteur volcanique selon les années
function getGeologicalEra(years) {
    // years = années depuis maintenant (0 = maintenant, positif = passé)
    // Si timelineFrame = 0, on est à "maintenant" (0 ans dans le passé)
    // Si timelineFrame augmente, on remonte dans le temps (années dans le passé)
    const yearsAgo = years; // Années dans le passé depuis maintenant

    // Parcourir les époques de la plus récente à la plus ancienne
    for (const era of GEOLOGICAL_ERAS) {
        // Les époques sont définies en années avant maintenant
        // startYears = début de l'époque (plus ancien, ex: 4.6 Ga)
        // endYears = fin de l'époque (plus récent, ex: 4.0 Ga)
        // Si on est entre endYears et startYears, on est dans cette époque
        if (yearsAgo >= era.endYears && yearsAgo < era.startYears) {
            // Calculer le facteur de croûte terrestre molle
            const moltenCrustFactor = getMoltenCrustFactor(yearsAgo);

            // Multiplier le facteur volcanique de l'époque par le facteur de croûte molle
            return {
                ...era,
                volcanoFactor: era.volcanoFactor * moltenCrustFactor,
                moltenCrustFactor: moltenCrustFactor // Exposer aussi le facteur pour debug
            };
        }
    }

    // Si yearsAgo < 0 (futur) ou très récent, retourner l'époque actuelle
    // Si yearsAgo >= 5.0e9 (avant la formation de la Terre), retourner Corps noir
    if (yearsAgo < 0) {
        return GEOLOGICAL_ERAS[GEOLOGICAL_ERAS.length - 1]; // Phanérozoïque (actuel)
    }
    if (yearsAgo >= GEOLOGICAL_ERAS[0].startYears) {
        const era = GEOLOGICAL_ERAS[0]; // Corps noir (avant formation de la Terre, pas de différenciation)
        // Pas de facteur de croûte molle pour Corps noir (pas de volcans)
        return {
            ...era,
            volcanoFactor: 0.0, // Pas de volcans
            moltenCrustFactor: 1.0
        };
    }

    // Par défaut, retourner l'époque actuelle (Phanérozoïque)
    return GEOLOGICAL_ERAS[GEOLOGICAL_ERAS.length - 1];
}

// Fonction pour obtenir l'événement géologique le plus proche d'une date
function getGeologicalEvent(yearsAgo) {
    // Trouver l'événement le plus proche (dans le passé)
    let closestEvent = null;
    let minDiff = Infinity;

    for (const event of GEOLOGICAL_EVENTS) {
        const diff = Math.abs(yearsAgo - event.dateYears);
        if (diff < minDiff && yearsAgo >= event.dateYears) {
            minDiff = diff;
            closestEvent = event;
        }
    }

    return closestEvent;
}

// Fonction pour obtenir tous les événements entre deux dates
function getGeologicalEventsBetween(startYears, endYears) {
    return GEOLOGICAL_EVENTS.filter(event =>
        event.dateYears >= endYears && event.dateYears < startYears
    );
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.GEOLOGICAL_ERAS = GEOLOGICAL_ERAS;
    window.getGeologicalEra = getGeologicalEra;
    window.getMoltenCrustFactor = getMoltenCrustFactor;
    window.GEOLOGICAL_PERIODS = GEOLOGICAL_PERIODS;
    window.getGeologicalPeriod = getGeologicalPeriod;
    window.getGeologicalPeriodByName = getGeologicalPeriodByName;
    window.GEOLOGICAL_EVENTS = GEOLOGICAL_EVENTS;
    window.getGeologicalEvent = getGeologicalEvent;
    window.getGeologicalEventsBetween = getGeologicalEventsBetween;
}

