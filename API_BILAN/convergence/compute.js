// ============================================================================
// File: API_BILAN/convergence/compute.js - Module de calcul de transfert radiatif
// Desc: En français, dans l'architecture, je suis le module principal de calcul de transfert radiatif
// Version 1.0.1
// Date: [January 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.1: add sulfate mass key ⚖️🌫 in DATA init from epoch (proxy CCN, separate from dry-air mass)
// ============================================================================

// ============================================================================
// FONCTION HELPER : getLogo() et getLogoKey() sont maintenant dans alphabet.js
// On utilise window.getLogo et window.getLogoKey exposés par alphabet.js
// Accès direct (plantera si n'existe pas, comme demandé)

// ============================================================================
// VARIABLES GLOBALES D'ÉTAT
// ============================================================================

// T0 est dans DATA['🧮']['🧮🌡️'], pas besoin de variable globale
// Phase est dans DATA['🧮']['🧮⚧'], pas besoin de variable globale
// signeDeltaFirst est dans DATA['🧮']['🧮☯'], pas besoin de variable globale
// flux_entrant est calculé localement dans computeRadiativeTransfer, pas besoin de variable globale

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

// CONST est maintenant centralisé dans physics.js
// Plus besoin d'initialisation ici, CONST sera créé une seule fois dans physics.js

//Récupère les états activés (utilise DATA directement)
function getEnabledStates() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;

    // Source unique : organigramme flux-button-cell (cell-co2, cell-methane, cell-h2o, cell-albedo-btn)
    const co2Cell = document.getElementById('cell-co2');
    const ch4Cell = document.getElementById('cell-methane');
    const h2oCell = document.getElementById('cell-h2o');
    const albedoCell = document.getElementById('cell-albedo-btn');

    DATA['🔘']['🔘💧📛'] = h2oCell ? h2oCell.classList.contains('checked') : true;
    DATA['🔘']['🔘⛽📛'] = ch4Cell ? ch4Cell.classList.contains('checked') : true;
    DATA['🔘']['🔘🏭📛'] = co2Cell ? co2Cell.classList.contains('checked') : true;
    DATA['🔘']['🔘🪩'] = albedoCell ? albedoCell.classList.contains('checked') : true;
    // Anim : source de vérité = DATA (bouton animation est normal, pas on/off)
    DATA['🔘']['🔘🎞'] = DATA['🔘']['🔘🎞'] != null ? DATA['🔘']['🔘🎞'] : false;
    
    // Retourner true car DATA a été modifié
    return true;
}

//Calcule les masses en tenant compte des événements (meteor, etc.) :: utilise DATA directement
function getMasses() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    //const CONST = window.CONST;
    
    // Récupérer l'époque directement depuis TIMELINE avec l'index depuis DATA
    const epochId = DATA['📜']['🗿'];
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    const EPOCH = window.TIMELINE[epochIndex];
    let h2o_kg = EPOCH['⚖️💧'] || 0;
    
    // Appliquer les événements
    const meteoriteCount = DATA['📜']['📿☄️'] || 0;
    const deltaWater = DATA['📜']['🔺⚖️💧☄️'] || 0;
    h2o_kg += deltaWater * meteoriteCount;
    
    // Mettre à jour DATA directement
    // 🔒 Protection contre undefined : traiter comme 0
    DATA['⚖️']['⚖️🏭'] = isFinite(EPOCH['⚖️🏭']) ? EPOCH['⚖️🏭'] : 0;
    DATA['⚖️']['⚖️⛽'] = isFinite(EPOCH['⚖️⛽']) ? EPOCH['⚖️⛽'] : 0;
    DATA['⚖️']['⚖️💧'] = h2o_kg;
    DATA['⚖️']['⚖️🫁'] = isFinite(EPOCH['⚖️🫁']) ? EPOCH['⚖️🫁'] : 0;
    DATA['⚖️']['⚖️💨'] = isFinite(EPOCH['⚖️💨']) ? EPOCH['⚖️💨'] : 0;  // N2 depuis EPOCH
    DATA['⚖️']['⚖️🌫'] = isFinite(EPOCH['⚖️🌫']) ? EPOCH['⚖️🌫'] : 0;  // Sulfate (proxy CCN), séparé de l'air sec
    
    // ⚖️🫧 = masse atmosphérique totale (air sec, sans vapeur d'eau)
    // Si EPOCH définit ⚖️🫧, l'utiliser, sinon calculer comme somme des gaz
    if (EPOCH['⚖️🫧'] !== undefined && isFinite(EPOCH['⚖️🫧'])) {
        DATA['⚖️']['⚖️🫧'] = EPOCH['⚖️🫧'];
        // Si ⚖️💨 non défini, N₂ implicite = reste pour atteindre ⚖️🫧 (évite M_dry faux → vapeur/albédo erronés)
        if (!isFinite(EPOCH['⚖️💨']) || EPOCH['⚖️💨'] === undefined) {
            DATA['⚖️']['⚖️💨'] = Math.max(0, DATA['⚖️']['⚖️🫧'] - (DATA['⚖️']['⚖️🏭'] + DATA['⚖️']['⚖️⛽'] + DATA['⚖️']['⚖️🫁']));
        }
    } else {
        // ⚖️🫧 = somme de tous les gaz atmosphériques (CO2, CH4, O2, N2)
        DATA['⚖️']['⚖️🫧'] = DATA['⚖️']['⚖️🏭'] + DATA['⚖️']['⚖️⛽'] + DATA['⚖️']['⚖️🫁'] + DATA['⚖️']['⚖️💨'];
    }
    
    // Logs désactivés pour réduire la taille
    // console.log(`📋 [getMasses@compute.js]`);
    // console.log(`masses=${JSON.stringify(DATA['⚖️'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

//Récupère la configuration de l'époque (utilise DATA directement)
function getEpochDateConfig() {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    const epochId = DATA['📜']['🗿'];
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    const EPOCH = window.TIMELINE[epochIndex];
    
    let meteoriteCount = 0;
    let ticTime = 0;
    let deltaTicTime_per_tic = null;
    let water_added_kg = 0;
    // Calculer le nombre de météorites
    const h2oTotalFromMeteorites = window.h2oTotalFromMeteorites || 0;
    meteoriteCount = 0;
    water_added_kg = 0;
    if (EPOCH['🕰'] && EPOCH['🕰']['☄️']) {
        const mass_kg = EPOCH['🕰']['☄️']['🔺⚖️💧☄️'];
        const h2oPerMeteorite = (mass_kg / CONST.EARTH_TOTAL_WATER_MASS_KG) * 100;
        const h2oPerMeteoriteAdjusted = Math.max(h2oPerMeteorite * 10, 2.1);
        meteoriteCount = Math.floor(h2oTotalFromMeteorites / h2oPerMeteoriteAdjusted);
        water_added_kg = mass_kg;
    }
    
    ticTime = (DATA['📜'] && DATA['📜']['📿💫'] != null) ? DATA['📜']['📿💫'] : Math.floor((window.infoTimeMa || 0) / 50);
    
    // Vérifier si 💫 existe dans les événements (certaines époques n'ont pas de ticTime)
    if (EPOCH['🕰']['💫']) {
        deltaTicTime_per_tic = EPOCH['🕰']['💫']['🔺🌡️💫'];
        DATA['📜']['🔺🧲🌕💫'] = {
            '▶': EPOCH['🕰']['💫']['🔺🧲🌕💫']['▶'],
            '◀': EPOCH['🕰']['💫']['🔺🧲🌕💫']['◀']
        };
        DATA['📜']['🔺⏳'] = EPOCH['🕰']['💫']['🔺⏳'] != null ? EPOCH['🕰']['💫']['🔺⏳'] : 50;
    } else {
        DATA['📜']['🔺⏳'] = 50;
        // Pas de ticTime pour cette époque
        deltaTicTime_per_tic = 0;
        DATA['📜']['🔺🧲🌕💫'] = { '▶': 0, '◀': 0 };
    }
    
    // Mettre à jour DATA directement (source unique de vérité)
    DATA['📜']['🌡️🧮'] = EPOCH['🌡️🧮'];
    DATA['📅']['🌡️🧮'] = EPOCH['🌡️🧮'];                  // Température attendue de l'époque
    DATA['📅']['📿💫'] = ticTime || 0;                    // Nombre de ticTime
    DATA['📜']['📿☄️'] = meteoriteCount || 0;              // Nombre de météorites
    DATA['📜']['🔺⚖️💧☄️'] = water_added_kg || 0;               // Masse d'eau ajoutée / météorite
    DATA['📜']['📿💫'] = ticTime || 0;                     // Nombre de ticTime
    DATA['📜']['🔺🌡️💫'] = deltaTicTime_per_tic || 0;     // Delta température / ticTime
    DATA['📜']['🧲🔬'] = (typeof EPOCH['🧲🔬'] === 'number' && Number.isFinite(EPOCH['🧲🔬'])) ? EPOCH['🧲🔬'] : 0.01;  // Précision convergence (K) ; défaut 0.01 si époque sans 🧲🔬
    DATA['📜']['👉'] = epochIndex;                         // Index de l'époque
    DATA['📜']['🗿'] = epochId;                            // Logo de l'époque (emoji)
    
    // Calculer les masses avec getMasses() (met à jour DATA directement)
    getMasses();
    
    // Logs désactivés pour réduire la taille
    // console.log(`💫🛠 [getEpochDateConfig@compute.js]`);
    // console.log(`dateConfig=${JSON.stringify(DATA['📜'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

//Calcule les valeurs du soleil (utilise DATA directement)
function getSoleil() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    if (!DATA || !DATA['📜'] || !window.TIMELINE) return false;
    const epochId = DATA['📜']['🗿'];
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    const EPOCH = epochIndex >= 0 ? window.TIMELINE[epochIndex] : null;
    if (!EPOCH || EPOCH['🔋☀️'] == null) return false;
    if (!DATA['☀️']) DATA['☀️'] = {};
    DATA['☀️']['🔋☀️'] = EPOCH['🔋☀️'];
    
    // Calculer la constante solaire à 1 UA depuis la puissance totale
    // Relation: P = S * 4πr² où P est la puissance totale, S est la constante solaire, r = 1 UA = 1.496e11 m
    // Donc: S = P / (4π * (1 UA)²)
    DATA['☀️']['🧲☀️'] = DATA['☀️']['🔋☀️'] / (4 * Math.PI * CONV.AU_M * CONV.AU_M);
    
    // Flux solaire à 1 UA / 4 (moyenne sphérique, AVANT albedo)
    // 🎱 représente la géométrie (division par 4 pour la moyenne sphérique)
    DATA['☀️']['🧲☀️🎱'] = DATA['☀️']['🧲☀️'] / 4;
    
    // console.log(`☀️ [getSoleil@compute.js]`);
    // console.log(`soleil=${JSON.stringify(DATA['☀️'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

//Calcule les valeurs du noyau géothermique (utilise DATA directement)
function getNoyau() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    if (!DATA || !DATA['📜'] || !window.TIMELINE) return false;
    const epochId = DATA['📜']['🗿'];
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    const EPOCH = epochIndex >= 0 ? window.TIMELINE[epochIndex] : null;
    if (!EPOCH) return false;
    if (!DATA['🌕']) DATA['🌕'] = {};
    // Flux géothermique en W/m² (depuis TIMELINE)
    if (EPOCH['🕰'] && EPOCH['🕰']['💫'] && EPOCH['🕰']['💫']['🔺🧲🌕💫']) {
        const geo = EPOCH['🕰']['💫']['🔺🧲🌕💫'];
        const tic = (DATA['📜'] && DATA['📜']['📿💫'] != null) ? DATA['📜']['📿💫'] : 0;
        const durationMa = (DATA['📜'] && DATA['📜']['🔺⏳'] != null) ? DATA['📜']['🔺⏳'] : 50;
        const spanYears = Math.max(0, (EPOCH['▶'] || 0) - (EPOCH['◀'] || 0));
        const maxTics = durationMa > 0 && spanYears > 0 ? Math.max(1, Math.floor((spanYears / 1e6) / durationMa)) : 1;
        const f = Math.min(1, tic / maxTics);
        DATA['🌕']['🧲🌕'] = (geo['▶'] != null && geo['◀'] != null) ? geo['▶'] + f * (geo['◀'] - geo['▶']) : (geo['▶'] != null ? geo['▶'] : EPOCH['🧲🌕']);
    } else if (EPOCH['🧲🌕'] !== undefined) {
        // Flux directement dans l'époque (ex: Hadéen)
        DATA['🌕']['🧲🌕'] = EPOCH['🧲🌕'];
    } else {
        // Calculer depuis la puissance du noyau si disponible
        if (EPOCH['🔋🌕'] !== undefined) {
            const planet_radius_m = EPOCH['📐'] * 1000;
            const surface_area = 4 * Math.PI * Math.pow(planet_radius_m, 2);
            DATA['🌕']['🧲🌕'] = surface_area > 0 ? EPOCH['🔋🌕'] / surface_area : 0.087;
        } else {
            // Valeur par défaut moderne : ~0.087 W/m²
            DATA['🌕']['🧲🌕'] = 0.087;
        }
    }
    
    // Puissance totale du noyau (en Watts) - depuis 🔋🌕
    DATA['🌕']['🔋🌕'] = EPOCH['🔋🌕'];
    
    // console.log(`🌕 [getNoyau@compute.js]`);
    // console.log(`noyau=${JSON.stringify(DATA['🌕'])}`);
    
    // Retourner true car DATA a été modifié
    return true;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================
var COMPUTE = window.COMPUTE = window.COMPUTE || {};
COMPUTE.getEpochDateConfig = getEpochDateConfig;
COMPUTE.getDateConfig = getEpochDateConfig;
COMPUTE.getMasses = getMasses;
COMPUTE.getEnabledStates = getEnabledStates;
COMPUTE.getSoleil = getSoleil;
COMPUTE.getNoyau = getNoyau;
window.getEpochDateConfig = getEpochDateConfig;
window.getDateConfig = getEpochDateConfig;
window.getMasses = getMasses;
window.getEnabledStates = getEnabledStates;
window.getSoleil = getSoleil;
window.getNoyau = getNoyau;
// T0 est dans DATA['🧮']['🧮🌡️'], pas besoin de window.T0
// getLogo et getLogoKey sont exposés par alphabet.js

