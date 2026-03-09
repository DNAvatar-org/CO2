// File: API_BILAN/config/fine_tuning_bounds.js - Bornes de fine-tuning min/max
// Desc: En français, dans l'architecture, je définis les bornes d'essais (min, moyenne, max) pour calibrer sans sortir des plages visées.
// Version 1.3.2
// Date: [June 08, 2025] [HH:MM UTC+1]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.0: cible CLOUD_SW.CLOUD_FRACTION_BASE avec 3 points d'essai (min/moy/max)
// - v1.1.0: plusieurs paramètres CLOUD_SW avec bornes min/max pour essais batch
// - v1.2.0: biblio intégrée dans chaque target (source + effet + référence)
// - v1.3.0: couverture complète biblio CLOUD_SW + SOLVER (toutes entrées avec bornes)
// - v1.3.1: default (nominal) par target ; 100% jauge = default (OPTICAL_EFF_CCN_GAIN etc. pris en compte)
// - v1.3.2: baryGroup SCIENCE pour CLOUD_FRACTION_INDEX_GAIN + OPTICAL_EFF_CCN_GAIN (jauge Science ⚗)

window.FINE_TUNING_BOUNDS = {
    targets: [
        {
            group: 'CLOUD_SW',
            key: 'CLOUD_FRACTION_BASE',
            min: 0.17,
            max: 0.23,
            default: 0.19,
            unit: 'fraction',
            note: 'base couverture nuageuse SW',
            source: 'CERES EBAF + MODIS (2000-2025), calibration interne pour SW effectif moderne',
            effect: 'negative',
            biblio_ref: 'CLOUD_FRACTION_BASE'
        },
        {
            group: 'CLOUD_SW',
            key: 'CLOUD_FRACTION_INDEX_GAIN',
            baryGroup: 'SCIENCE',
            min: 0.08,
            max: 0.14,
            default: 0.11,
            unit: 'ratio',
            note: 'gain index nuageux',
            source: 'Sundqvist (1989) + ajustement interne cloud_index -> fraction optique',
            effect: 'negative',
            biblio_ref: 'CLOUD_FRACTION_INDEX_GAIN'
        },
        {
            group: 'CLOUD_SW',
            key: 'OPTICAL_EFF_BASE',
            min: 1.00,
            max: 1.20,
            default: 1.10,
            unit: 'ratio',
            note: 'efficacité optique de base',
            source: 'Twomey + AR6 aerosols, centrage moderne',
            effect: 'negative',
            biblio_ref: 'OPTICAL_EFF_BASE'
        },
        {
            group: 'CLOUD_SW',
            key: 'OPTICAL_EFF_CCN_GAIN',
            baryGroup: 'SCIENCE',
            min: 0.30,
            max: 0.60,
            default: 0.45,
            unit: 'ratio',
            note: 'sensibilité optique au ratio CCN',
            source: 'Twomey effect (sensibilite de l albedo nuageux aux CCN)',
            effect: 'negative',
            biblio_ref: 'OPTICAL_EFF_CCN_GAIN'
        },
        {
            group: 'CLOUD_SW',
            key: 'SULFATE_BOOST_SCALE',
            min: 300,
            max: 700,
            default: 500,
            unit: 'scale',
            note: 'gain sulfate proxy -> CCN',
            source: 'Proxy sulfate interne SO4(2-) pour microphysique nuageuse',
            effect: 'negative',
            biblio_ref: 'SULFATE_BOOST_SCALE'
        },
        {
            group: 'CLOUD_SW',
            key: 'SULFATE_BOOST_MAX',
            min: 0.20,
            max: 0.45,
            default: 0.35,
            unit: 'ratio',
            note: 'plafond du boost sulfate',
            source: 'Borne numerique de securite (evite emballement du proxy)',
            effect: 'negative',
            biblio_ref: 'SULFATE_BOOST_MAX'
        },
        {
            group: 'CLOUD_SW',
            key: 'TEMP_FACTOR_REF_K',
            min: 282,
            max: 294,
            default: 288,
            unit: 'K',
            note: 'référence thermique nuages SW',
            source: 'Reference climat moderne (~15C)',
            effect: 'mixed',
            biblio_ref: 'TEMP_FACTOR_REF_K'
        },
        {
            group: 'SOLVER',
            key: 'TOL_MIN_WM2',
            min: 0.03,
            max: 0.10,
            default: 0.05,
            unit: 'W/m²',
            note: 'tolérance flux minimale',
            source: 'Choix numerique de convergence (stabilite/temps de calcul)',
            effect: 'neutral_on_physics',
            biblio_ref: 'TOL_MIN_WM2'
        },
        {
            group: 'SOLVER',
            key: 'MAX_SEARCH_STEP_K',
            min: 60,
            max: 140,
            default: 100,
            unit: 'K',
            note: 'pas Search max',
            source: 'Choix numerique solveur Search',
            effect: 'neutral_on_physics',
            biblio_ref: 'MAX_SEARCH_STEP_K'
        },
        {
            group: 'SOLVER',
            key: 'MAX_SEARCH_STEP_LARGE_K',
            min: 100,
            max: 200,
            default: 150,
            unit: 'K',
            note: 'pas Search large',
            source: 'Choix numerique solveur Search (grands deltas)',
            effect: 'neutral_on_physics',
            biblio_ref: 'MAX_SEARCH_STEP_LARGE_K'
        },
        {
            group: 'SOLVER',
            key: 'LARGE_DELTA_FACTOR',
            min: 6,
            max: 16,
            default: 10,
            unit: 'ratio',
            note: 'seuil bascule grand delta',
            source: 'Seuil de bascule vers cap large du pas Search',
            effect: 'neutral_on_physics',
            biblio_ref: 'LARGE_DELTA_FACTOR'
        }
    ]
};
