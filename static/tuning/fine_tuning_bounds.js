// File: fine_tuning_bounds.js - Bornes de fine-tuning min/max
// Desc: En français, dans l'architecture, je définis les bornes d'essais (min, moyenne, max) pour calibrer sans sortir des plages visées.
// Version 1.2.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
// - v1.0.0: cible CLOUD_SW.CLOUD_FRACTION_BASE avec 3 points d'essai (min/moy/max)
// - v1.1.0: plusieurs paramètres CLOUD_SW avec bornes min/max pour essais batch
// - v1.2.0: biblio intégrée dans chaque target (source + effet + référence)

window.FINE_TUNING_BOUNDS = {
    targets: [
        {
            group: 'CLOUD_SW',
            key: 'CLOUD_FRACTION_BASE',
            min: 0.17,
            max: 0.23,
            unit: 'fraction',
            note: 'base couverture nuageuse SW',
            source: 'CERES EBAF + MODIS (2000-2025), calibration interne pour SW effectif moderne',
            effect: 'negative',
            biblio_ref: 'CLOUD_FRACTION_BASE'
        },
        {
            group: 'CLOUD_SW',
            key: 'OPTICAL_EFF_BASE',
            min: 1.00,
            max: 1.20,
            unit: 'ratio',
            note: 'efficacité optique de base',
            source: 'Twomey + AR6 aerosols, centrage moderne',
            effect: 'negative',
            biblio_ref: 'OPTICAL_EFF_BASE'
        },
        {
            group: 'CLOUD_SW',
            key: 'OPTICAL_EFF_CCN_GAIN',
            min: 0.30,
            max: 0.60,
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
            unit: 'scale',
            note: 'gain sulfate proxy -> CCN',
            source: 'Proxy sulfate interne SO4(2-) pour microphysique nuageuse',
            effect: 'negative',
            biblio_ref: 'SULFATE_BOOST_SCALE'
        }
    ]
};
