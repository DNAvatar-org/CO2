// File: API_BILAN/config/model_tuning.js - Parametres de fine-tuning du modele
// Desc: En francais, dans l'architecture, je suis la source unique des coefficients empiriques/calibres.
// Version 1.0.0
// Date: [June 08, 2025] [HH:MM UTC+1]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.0: extraction des coefficients calibres cloud SW + solveur numerique depuis calculations_albedo.js/configTimeline.js

window.TUNING = window.TUNING || {};

// Parametres calibres pour la couverture nuageuse SW (proxy CCN + efficacite optique).
window.TUNING.CLOUD_SW = {
    CCN_BASE: 0.15,
    CCN_O2_WEIGHT: 0.85,
    BIOMASS_GAIN: 4.0,
    ANTHRO_RISE_START_YEAR: 1900,
    ANTHRO_RISE_WINDOW_YEARS: 80,
    ANTHRO_RISE_MAX: 0.25,
    ANTHRO_DECAY_START_YEAR: 1980,
    ANTHRO_DECAY_WINDOW_YEARS: 40,
    ANTHRO_DECAY_MAX: 0.15,
    SULFATE_BOOST_SCALE: 500,
    SULFATE_BOOST_MAX: 0.35,
    MODERN_REF_O2: 0.21,
    MODERN_REF_FOREST: 0.03,
    PRESSURE_FACTOR_MAX: 1.2,
    OXIDATION_BASE: 0.3,
    OXIDATION_O2_GAIN: 4.0,
    TEMP_FACTOR_MIN: 0.6,
    TEMP_FACTOR_MAX: 1.3,
    TEMP_FACTOR_REF_K: 288,
    OPTICAL_EFF_BASE: 1.10,
    OPTICAL_EFF_CCN_GAIN: 0.45,
    OXIDATION_SOFT_BASE: 0.85,
    OXIDATION_SOFT_GAIN: 0.15,
    CLOUD_FRACTION_BASE: 0.19,
    CLOUD_FRACTION_INDEX_GAIN: 0.11,
    CLOUD_FRACTION_MAX: 0.75
};

// Parametres numeriques (stabilite et vitesse du solveur).
window.TUNING.SOLVER = {
    TOL_MIN_WM2: 0.05,
    MAX_SEARCH_STEP_K: 100,
    MAX_SEARCH_STEP_LARGE_K: 150,
    LARGE_DELTA_FACTOR: 10
};
