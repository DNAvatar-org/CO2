// File: static/compute/initDATA.js - Initialisation de l'objet DATA
// Desc: Crée DATA depuis KEYS (dico.js) et 🎚️ ; chargé après dico.js. Source unique d'init.
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [February 2025]
// Logs:
// - v1.0.0: extraction init DATA depuis dico.js (KEYS → DATA, puis 🎚️)

(function () {
    'use strict';
    var KEYS = window.KEYS;
    var DATA = {};
    var categoryKey, category, keysArray, fullKey;
    for (categoryKey in KEYS) {
        category = KEYS[categoryKey];
        DATA[categoryKey] = {};
        keysArray = Array.isArray(category) ? category : Object.values(category);
        for (fullKey of keysArray) {
            if (fullKey.startsWith('🔘')) {
                DATA[categoryKey][fullKey] = false;
            } else if (fullKey.includes('⚧')) {
                DATA[categoryKey][fullKey] = '';
            } else if (fullKey.includes('☯')) {
                DATA[categoryKey][fullKey] = 0;
            } else if (fullKey === '🔺🧲🌕💫') {
                DATA[categoryKey][fullKey] = { '▶': 0, '◀': 0 };
            } else {
                DATA[categoryKey][fullKey] = 0.0;
            }
        }
    }
    var _baryDefault = { CLOUD_SW: 100, SCIENCE: 100, SOLVER: 0 };
    var _solverDefault = { TOL_MIN_WM2: 0.05, MAX_SEARCH_STEP_K: 100, MAX_SEARCH_STEP_LARGE_K: 150, LARGE_DELTA_FACTOR: 10, DELTA_T_ACCELERATION_DAYS: 10 };  // 10 j (litt. 8–10 j)
    var _cloudSwDefault = {
        CCN_BASE: 0.15, CCN_O2_WEIGHT: 0.85, BIOMASS_GAIN: 4.0,
        ANTHRO_RISE_START_YEAR: 1900, ANTHRO_RISE_WINDOW_YEARS: 80, ANTHRO_RISE_MAX: 0.25,
        ANTHRO_DECAY_START_YEAR: 1980, ANTHRO_DECAY_WINDOW_YEARS: 40, ANTHRO_DECAY_MAX: 0.15,
        SULFATE_BOOST_SCALE: 500, SULFATE_BOOST_MAX: 0.35,
        MODERN_REF_O2: 0.21, MODERN_REF_FOREST: 0.03,
        PRESSURE_FACTOR_MAX: 1.2, OXIDATION_BASE: 0.3, OXIDATION_O2_GAIN: 4.0,
        TEMP_FACTOR_MIN: 0.6, TEMP_FACTOR_MAX: 1.3, TEMP_FACTOR_REF_K: 288,
        OPTICAL_EFF_BASE: 1.10, OPTICAL_EFF_CCN_GAIN: 0.45,
        OXIDATION_SOFT_BASE: 0.85, OXIDATION_SOFT_GAIN: 0.15,
        CLOUD_FRACTION_BASE: 0.19, CLOUD_FRACTION_INDEX_GAIN: 0.11, CLOUD_FRACTION_MAX: 0.75
    };
    DATA['🎚️'] = {
        baryByGroup: { CLOUD_SW: _baryDefault.CLOUD_SW, SCIENCE: _baryDefault.SCIENCE, SOLVER: _baryDefault.SOLVER },
        CLOUD_SW: _cloudSwDefault,
        SOLVER: { TOL_MIN_WM2: _solverDefault.TOL_MIN_WM2, MAX_SEARCH_STEP_K: _solverDefault.MAX_SEARCH_STEP_K, MAX_SEARCH_STEP_LARGE_K: _solverDefault.MAX_SEARCH_STEP_LARGE_K, LARGE_DELTA_FACTOR: _solverDefault.LARGE_DELTA_FACTOR, DELTA_T_ACCELERATION_DAYS: _solverDefault.DELTA_T_ACCELERATION_DAYS }
    };
    window.DATA = DATA;
})();
