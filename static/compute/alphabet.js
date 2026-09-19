// File: API_BILAN/data/alphabet.js - Alphabet des caractères (logos)
// Desc: Définit les caractères (logos) de base et leurs descriptions
// Version 1.0.17
// Date: [September 17, 2026]
// logs :
// - v1.0.17: caractères 🔁 (cycles par tic), 🖼 (texture d'état) et ⚾ (obliquité) dans la colonne Événements.
// - v1.0.16: EPOCH_ALT2SEC retiré (récits d'époques → static/texts/epochs_alt2sec.js).
// - v1.0.15: createAlphabetHtml — Époques sur 2 colonnes (grille 6 colonnes, classe legend-grid--alphabet).
// - v1.0.14: 💀 « Limite P/T » → « Extinction permienne » (plus explicite, tient sur une ligne de titre).
// - v1.0.13: CHARS_DESC ⚗ → « Affiche les concentrations » (bouton DETAILS organigramme)
// - v1.0.12: retrait BOOLEAN 🔘 « Calculé (Boolean) » de l'alphabet (obsolète)
// - v1.0.11: EPOCH_ALT2SEC — alt2sec tooltips frise (ex. hysteresis 1a / Sturtienne, analogie surfusion).
// - v1.0.10: CHARS_DESC ⚫ « Corps Noir » (N majuscule) — même libellé que syncEpochFromTimelinePointer / terre.epoch / GEOLOGY.getGeologicalPeriodByName(window.RUNTIME_STATE.currentEpochName).
// - v1.0.9: CHARS.SULFATE + CHARS_DESC — U+2708 U+FE0F (emoji ✈️, police emoji) ; aligné configsAll
// - v1.0.8: timeline étendue (19 époques) — renames 🥟→🪸, ❄️→🦣, 🦣→🦤, scission 🌿→🪼/🍄/💀 ; nouveaux ⛈ 🐧 🛖 ; hysteresis 1→1a + ajout 1b
// - v1.0.7: charsImages CH4 -> fonts/pics/ch4.png (picto texte)
// - v1.0.6: CHARS_DESC 🐊 « Éocène »
// - v1.0.5: CHARS_DESC 🎾 Lave, ⚽ voile SW ; VOLCANO 🌋 inchangé (actions)
// - v1.0.3: IIFE + __alphabetModuleLoaded (évite SyntaxError CHARS redeclared si double chargement) ; resolveImagePath pour pages sous /html/*.html → ../fonts/
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI

(function () {
    'use strict';
    if (typeof window !== 'undefined' && window.__alphabetModuleLoaded) return;
    if (typeof window !== 'undefined') window.__alphabetModuleLoaded = true;

// ============================================================================
// DÉFINITION DES CARACTÈRES (CHARS)
// ============================================================================
// Source unique de référence pour tous les caractères (logos) utilisés dans l'application
const CHARS = {
    CO2: '🏭',      // CO2 : usine (émissions industrielles)
    CH4: '🐄',       // CH4 : pompe à essence (combustibles fossiles, pets de vache)
    H2O: '💧',      // H2O : goutte d'eau
    GEOTHERMAL_FLUX: '🌕', // Geothermal flux : lune (flux géothermique)
    FLUX_START: '▶', // Flux start : flèche droite (valeur de départ)
    FLUX_END: '◀', // Flux end : flèche gauche (valeur de fin)
    ENERGY_FLUX: '🧲', // Energy flux : sources chaudes (W/m²)
    O2: '🫁',       // O2 : poumons (affichage)
    N2: '💨',       // N2 : vent (azote/air)
    SULFATE: '\u2708\uFE0F',  // SO₄ proxy — présentation emoji (U+2708 + VS16)
    WEIGHT: '⚖️',   // Poids : balance (masse)
    DENSITY: '💨',  // Densité : vent
    ALTITUDE: '🧿', // Altitude : galaxie (Ligne de Kármán, frontière atmosphère/espace)
    ANIMATION: '🎞', // Animation : film
    TROPOPAUSE: '🛩', // Tropopause : avion
    GREENHOUSE_FORCING: '♻', // Greenhouse forcing : recyclage
    CLOUD_ALBEDO: '🌤', // Cloud albedo contribution : soleil avec nuage
    MAX_VAPOR: '🌧', // Max vapor fraction : pluie
    ALBEDO: '🪩',   // Albédo : miroir
    EDS: '📛',      // EDS (effet de serre) ; ΔF = convention affichage
    TEMP: '🌡️',     // TEMP : Température
    PHASE: '⚧',     // Phase : symbole transgenre (phase de convergence)
    T0: '🚩',        // T0 : drapeau (température initiale)
    DIRECTION: '☯', // Direction : yin-yang (direction du delta)
    BIG_IMPACT: '🎇', // Big impact : feu d'artifice (événement d'impact majeur)
    TIC_TIME: '💫',      // TicTime : étoile (événement d'avancement temporel)
    EMISSIONS: '🛢',     // Scénario émissions CO₂ (époque moderne, remplace 💫 pour 📱)
    SATELLITE: '🛰', // Satellite : satellite (événement)
    FLUX_CN: '🌑', // Flux sortant : lune noire (rayonnement corps noir sortant)
    TOLERANCE: '🔬', // Tolérance : précision pour le test d'arrêt
    DESERT: '🏜️',   // Désert : plage (utilisé dans albedo breakdown)
    VOLCANO_VEIL: '🗻', // Volcan (action-1a) : voile atmosphérique — assombrit le Soleil (événement)
    VOLCANO: '🌋',  // Volcan (action-1b) : +CO₂ + noircissement glace (événement)
    OCEAN: '🌊',    // Océan : vagues (utilisé dans albedo breakdown)
    FOREST: '🌳',   // Forêt : arbre (utilisé dans albedo breakdown)
    ICE: '🧊',      // Glace : glaçon (utilisé dans albedo breakdown)
    CLOUD: '⛅',     // Nuages : nuage avec soleil (utilisé dans albedo breakdown)
    CLOUD_FORMATION: '☁️', // Potentiel de condensation nuageuse
    COMPUTE: '🧮',  // Compute : sablier (pour les valeurs de convergence)
    GREENHOUSE_FORCING_ALT: '🌴',  // Greenhouse forcing alternatif : palmier
    CARDINAL: '📿', // Cardinal : 🎓
    DELTA: '🔺',    // Delta : triangle
    METER: '📏',    // Mètre : règle
    PROPORTION: '🍰', // Proportion : 🍰 🧩
    POWER: '🔋',    // Puissance : batterie (Watts)
    SUN_ORIGIN: '☀️', // Soleil
    GEOMETRY_ORIGIN: '🎱', // Géometrie : boule de billard
    SPECTRAL: '🌈', // Spectre : arc-en-ciel
    ATMOSPHERE: '🫧', // Atmosphère : vent
    CONFIG: '📜',   // Config : parchemin
    METEORITE_COUNT: '☄️', // Nombre de météorites
    FLUX_IN: '🔽',  // Flux entrant (réception, +)
    FLUX_OUT: '🔼', // Flux sortant (émission, -)
    // Époques géologiques
    EPOCH: '📜',    // Époque : parchemin
    CORPS_NOIR: '⚫', // Corps Noir (libellé UI = CHARS_DESC['⚫'])
    HADEEN: '🔥',   // Hadéen : feu/lave
    ARCHEEN: '🦠',  // Archéen : microbe unicellulaire
    PROTEROZOIC: '🪸', // Protérozoïque (2500–750 Ma) : corail (multicellularité, eucaryotes)
    HYSTERESIS_1A: 'hysteresis 1a', // Sturtienne (750–720 Ma) — bascule albédo↓ (id stable, logo ☃)
    SNOWBALL_ENTRY: '☃', // Entrée Sturtienne (alias affichage hyst 1a)
    SNOWBALL: '⛄',  // Plein Snowball (720–690 Ma) : accumulation CO₂ sous glace
    HYSTERESIS_1B: 'hysteresis 1b', // Sortie Marinoen (690–600 Ma) — hyst 1b (id stable, logo ⛈)
    SNOWBALL_EXIT: '⛈', // Sortie Marinoen (alias affichage hyst 1b) : déglaciation brutale, pluies acides
    PALEOZOIC_MARINE: '🪼', // Paléozoïque marin (600–420 Ma) : méduse (vie marine, explosion cambrienne)
    PALEOZOIC_LAND: '🍄', // Paléozoïque terrestre (420–280 Ma) : champignon (Prototaxites, forêts Dévonien)
    PERMIAN_TRIASSIC: '💀', // Extinction permienne (280–250 Ma) : crise Permien-Trias −252 Ma, Trapps sibériens
    MESOZOIC: '🦕', // Mésozoïque (250–66 Ma) : dinosaure sauropode
    CENOZOIC: '🦤', // Cénozoïque (66–50 Ma) : dodo (recovery post-K/Pg, radiation oiseaux)
    PETM_HOUSE: '🐊', // Éocène (50–35 Ma), pic thermique type PETM
    HYSTERESIS_2: 'hysteresis 2', // Eocène-Oligocène (35–33 Ma) — hyst 2 (id stable, logo 🐧)
    EOCENE_OLIGOCENE: '🐧', // Eocène-Oligocène (alias affichage hyst 2) : calotte Antarctique
    EOT: '🏔',      // Grande Coupure (33–2 Ma) : Himalaya, altération silicates
    QUATERNARY: '🦣', // Quaternaire (2 Ma–10 ka) : mammouth (Pléistocène, glaciations)
    HOLOCENE: '🛖', // Holocène (10 ka–1800) : agriculture, villages
    TODAY: '🚂',    // Industriel (1800–2000) : train
    MODERN: '📱',   // Aujourd'hui (2000–2100) : smartphone
    EVENTS: '🕰',   // Événements : horloge
    CYCLE: '🔁',    // Cycles : états successifs appliqués par tic (🕰.🔁, ex. glaciaire/interglaciaire)
    TEXTURE: '🖼',  // Texture de la planète imposée (suite 🕰.🖼, parcourue par les tics)
    NIGHTMAP: '🌙', // Carte de nuit superposée (🕰.🌙) : lumières des villes côté ombre
    OBLIQUITY: '⚾', // Obliquité ε de l'axe terrestre (degrés) — Milankovitch
    TRANSITION: '⏩', // Transition : flèche rapide
    DATE: '📅',     // Date : calendrier
    PLANET_RADIUS: '📐', // Rayon de la planète : équerre
    GRAVITY: '🍎',  // Gravité : pomme (gravité)
    MOLAR_MASS_AIR: '🧪', // Masse molaire de l'air : flacon (chimie)
    ALEMBIC: '⚗',  // Alembic (chimie / science)
    PRESSURE: '🎈', // Pression : ballon (pression)
    INDEX_EPOCH: '👉', // Index de l'époque : pointeur
    LOGO_EPOCH: '🗿', // Logo/Nom de l'époque : statue
    TRIPLE_POINT: '┴', // Point triple : pont (P,T au point triple)
    GLOBE_AFRICA: '🌍',   // Globe Afrique (terre Protérozoïque, Cénozoïque)
    GLOBE_AMERICAS: '🌎', // Globe Amériques (terre Mésozoïque)
    GLOBE_ASIA: '🌏',     // Globe Asie (terre Paléozoïque)
};

// Logo (emoji) -> image pour affichage des PICTO (boutons, frise).
// ⚠️ charsImages ne touche JAMAIS aux textures Three.js !
// Les textures Three.js (fonds/*.png) : chemin déduit de la date (getPlanetTexturePathFromEpoch) ; liste préload : configOrganigramme.TEXTURES_THREEJS.
const charsImages = {
    '☀️': 'fonts/pics/sun.png',           // Soleil
    //'⚫': 'fonts/pics/corps_noir.png',    // Corps noir
    '🎇': 'fonts/pics/big_impact.png',    // Big impact
    '☄️': 'fonts/pics/ice_meteorite.png', // Météorite de glace
    //'🔥': 'fonts/pics/hadeen.png',           // Feu
    '🐄': 'fonts/pics/ch4.png',           // CH4 (picto texte ; spectre + organigramme)
};

// ============================================================================
// DESCRIPTIONS DES CARACTÈRES (CHARS_DESC) - Utilise directement les emojis
// ============================================================================
const CHARS_DESC = {
    // Unités
    '📿': 'Cardinal (#)',
    '🍰': 'Proportion ([0,1])',
    '📏': 'Longueur (km)',
    '⚖️': 'Masse (kg)',
    '🎈': 'Pression (atm)',
    '🌡️': 't° (K)',
    '🔋': 'Puissance (W)',
    '🔽': 'Réception (+)',
    '🔼': 'Émission (-)',
    '🍎': 'Gravité (m/s²)',
    '🧲': 'Flux (W/m²)',
    '🧪': 'Masse molaire (kg/mol)',
    '┴': 'Point triple (🎈,🌡️)',
    '⚧': 'Phase (Init/Search/Dicho)',
    '☯': 'Direction Search (+/-)',
    // Éléments
    '💧': 'H₂O',
    '🐄': 'CH₄',
    '🏭': 'CO₂',
    '🫁': 'O₂',
    '✈': 'SO₄²⁻ (aérosols sulfate)',
    '🧊': 'Glace',
    '⛅': 'Nuages',
    '🌊': 'Océan',
    '🎾': 'Lave',
    '⚽': 'Voile SW stratosphérique',
    '🏜️': 'Désert',
    '🌳': 'Forêt',
    '🌍': 'Continents',
    '🫧': 'Atmosphère',
    '☀️': 'Soleil',
    '🎱': 'Géometrie',
    '🌈': 'Spectre',
    // Calculs
    '🧮': 'Calculs O(🧲🔬x🔬🌈x🔬🫧)',
    '🎞': 'Animation',
    '🔺': 'Delta (*)',
    '🔬': 'Tolérance (précision)',
    '🚩': 'T0 (t° initiale)',
    '🪩': 'Albédo',
    '🌕': 'Géothermie',
    '📛': 'EDS (effet de serre)',
    '🌑': 'Flux sortant (σT⁴)',
    '☁️': 'Index formation nuageuse [0,1]',
    // Événements
    '💫': 'TicTime',
    '🛢': 'Scénario émissions',
    '☄️': 'Météorite de glace',
    '🗻': 'Volcan — voile atmosphérique',
    '🌋': 'Volcan — CO₂ + noircissement de la glace',
    '🛰': 'Satellite',
    '🌧': 'Saturation H₂O',
    '🎇': 'Big impact',
    '▶': 'Début',
    '◀': 'Fin',
    '🧿': 'Ligne de Kármán',
    '🛩': 'Tropopause',
    // Autres
    '💨': 'N₂',
    // Époques géologiques
    '📜': 'Époque (Ma)',
    '👉': 'Index',
    '🗿': 'Logo',
    '⚫': 'Corps Noir',
    '🔥': 'Hadéen',
    '🦠': 'Archéen',
    '🪸': 'Protérozoïque',
    '☃': 'Sturtienne',
    '⛄': 'Plein Snowball',
    '⛈': 'Sortie Marinoen',
    '🪼': 'Paléozoïque marin',
    '🍄': 'Paléozoïque terrestre',
    '💀': 'Extinction permienne',
    '🦕': 'Mésozoïque',
    '🦤': 'Cénozoïque',
    '🐊': 'Éocène',
    '🐧': 'Eocène-Oligocène',
    '⛰': 'Montagne (relief)',
    'hysteresis 1a': 'Sturtienne',
    'hysteresis 1b': 'Sortie Marinoen',
    'hysteresis 2': 'Eocène-Oligocène',
    '🏔': 'Grande Coupure',
    '🦣': 'Quaternaire',
    '🛖': 'Holocène',
    '🚂': 'Industriel',
    '📱': 'Aujourd\'hui',
    '🕰': 'Événements',
    '🔁': 'Cycles (états par tic)',
    '🖼': 'Texture planète (suite)',
    '🌙': 'Carte de nuit (superposée)',
    '⚾': 'Obliquité ε (°)',
    '⏩': 'Transition',
    '📅': 'Date (Ma)',
    '📐': 'Rayon planète',
    '🍎': 'Gravité (m/s²)',
    '┴': 'Point triple (🎈,🌡️)',
    '⚗': 'Affiche les concentrations'
};

// alt2sec des époques : déplacé dans static/texts/epochs_alt2sec.js (récit + chiffres lus à la source).

// ============================================================================
// FONCTION : CRÉER L'ALPHABET (LEXIQUE)
// ============================================================================

function createAlphabetHtml() {
    if (typeof CHARS === 'undefined') console.error('[createAlphabet] CHARS non défini');
    // Colonne 1 : Unités
    const charsCol1 = [
        'CARDINAL', 'PROPORTION', 'METER', 'WEIGHT', 'PRESSURE', 'TEMP', 'POWER', 'FLUX_IN', 'FLUX_OUT', 'GRAVITY', 'ENERGY_FLUX', 'MOLAR_MASS_AIR', 'ALEMBIC', 'TRIPLE_POINT'
    ];
    
    // Colonne 2 : Éléments
    const charsCol2 = [
        'H2O', 'CH4', 'CO2', 'O2', 'N2', 'SULFATE', 'ICE', 'CLOUD', 'OCEAN', 'DESERT', 'FOREST', 'ATMOSPHERE', 'SUN_ORIGIN', 'SPECTRAL'
    ];
    
    // Colonne 3 : Calculs
    const charsCol3 = [
        'COMPUTE', 'ANIMATION', 'PHASE', 'DELTA', 'TOLERANCE', 'DIRECTION', 'T0', 'ALBEDO', 'GEOTHERMAL_FLUX', 'EDS', 'GEOMETRY_ORIGIN', 'FLUX_CN', 'MAX_VAPOR', 'CLOUD_FORMATION'
    ];
    
    // Colonne 4 : Événements
    const charsCol4 = [
        'DATE', 'TIC_TIME', 'EVENTS', 'CYCLE', 'TEXTURE', 'NIGHTMAP', 'OBLIQUITY', 'TRANSITION', 'BIG_IMPACT', 'METEORITE_COUNT', 'VOLCANO_VEIL', 'VOLCANO', 'FLUX_START', 'FLUX_END', 'PLANET_RADIUS', 'TROPOPAUSE', 'ALTITUDE', 'SATELLITE', 'INDEX_EPOCH'
    ];
    
    // Colonne 5 : Époques et autres logos
    const charsCol5 = [
        'EPOCH', 'INDEX_EPOCH', 'LOGO_EPOCH', 'CORPS_NOIR', 'HADEEN', 'ARCHEEN', 'PROTEROZOIC', 'SNOWBALL_ENTRY', 'SNOWBALL', 'SNOWBALL_EXIT', 'PALEOZOIC_MARINE', 'PALEOZOIC_LAND', 'PERMIAN_TRIASSIC', 'MESOZOIC', 'CENOZOIC', 'PETM_HOUSE', 'EOCENE_OLIGOCENE', 'EOT', 'QUATERNARY', 'HOLOCENE', 'TODAY', 'MODERN'
    ];
    
    // Descriptions personnalisées pour certains caractères
    const customDescriptions = {
        'TIC_TIME': 'TicTime',
        'T0': 'T0 (t° initiale)'
    };
    
    // Fonction helper pour créer une div avec caractère et description
    // Réf = emoji (toujours en premier, utilisé dans calculs/code). Image = affichage optionnel entre parenthèses.
    const createCharDiv = (charName) => {
        const char = CHARS[charName];
        const description = CHARS_DESC[char] || charName;
        
        if (!char || char === '') return '';
        
        const hasImage = charsImages[char] && (charsImages[char].endsWith('.png') || charsImages[char].endsWith('.svg') || charsImages[char].endsWith('.jpg'));
        const imgInParens = hasImage ? ' (' + getDisplayChar(char) + ')' : '';
        const logoClass = char === '⚗' ? 'logo logo-alembic' : 'logo';
        
        return `<div class="legend-item"><span class="${logoClass}">${char}</span><span class="description">${description}${imgInParens}</span></div>`;
    };
    
    // Filtrer les divs vides avant de les joindre
    const col1_filtered = charsCol1.map(createCharDiv).filter(div => div !== '').join('');
    const col2_filtered = charsCol2.map(createCharDiv).filter(div => div !== '').join('');
    const col3_filtered = charsCol3.map(createCharDiv).filter(div => div !== '').join('');
    const col4_filtered = charsCol4.map(createCharDiv).filter(div => div !== '').join('');
    // Époques sur 2 colonnes (22 lignes → 11 + 11) : plus de barre de scroll dans la popup
    const col5_items = charsCol5.map(createCharDiv).filter(div => div !== '');
    const col5_half = Math.ceil(col5_items.length / 2);
    const col5a_filtered = col5_items.slice(0, col5_half).join('');
    const col5b_filtered = col5_items.slice(col5_half).join('');
    
    return `
        <div class="legend-grid legend-grid--alphabet">
            <div class="legend-column">
                <h3 class="legend-title">Unités</h3>
                ${col1_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Éléments</h3>
                ${col2_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Calculs</h3>
                ${col3_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Événements</h3>
                ${col4_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">Époques</h3>
                ${col5a_filtered}
            </div>
            <div class="legend-column">
                <h3 class="legend-title">&nbsp;</h3>
                ${col5b_filtered}
            </div>
        </div>
    `;
}

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

//Récupère un logo (emoji) depuis son nom
function getLogo(name) {
    return CHARS[name] || '';
}

//Combine plusieurs noms de logos en une seule clé emoji
function getLogoKey(...names) {
    return names.map(name => CHARS[name] || '').join('');
}

// Résout le chemin image (depuis static/compute/ -> ../../fonts/... ; depuis html/*.html -> ../fonts/...)
function resolveImagePath(path) {
    if (!path) return path;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path;
    if (typeof window.getImagePath === 'function') return window.getImagePath(path);
    const base = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
    const inCompute = base.includes('/static/compute/') || base.includes('static\\compute\\') || base.endsWith('alphabet.html');
    if (inCompute) {
        return '../..' + (path.startsWith('/') ? path : '/' + path);
    }
    // scie_compute.html, etc. : page sous CO2/html/ → fonts/ est CO2/fonts/ (un niveau au-dessus)
    const inHtmlFolder = /\/html\//.test(base) && /\.html$/i.test(base);
    if (inHtmlFolder) {
        return '../' + (path.startsWith('/') ? path.slice(1) : path);
    }
    return path;
}

// Mapping DATA key -> affichage (image path ou emoji). Alt = ref (CHARS).
function getDisplayChar(dataKey) {
    const imgPath = charsImages[dataKey];
    if (imgPath && (imgPath.endsWith('.png') || imgPath.endsWith('.svg') || imgPath.endsWith('.jpg'))) {
        const src = resolveImagePath(imgPath);
        const alt = CHARS_DESC[dataKey] || dataKey;
        return '<img src="' + src + '" alt="' + alt + '" style="height:1.4em;vertical-align:middle">';
    }
    return dataKey;
}

// Retourne l'URL src pour afficher un logo en image (events, timeline, etc.).
// Source unique : charsImages. Retourne null si pas d'image.
function getLogoImageSrc(emoji) {
    const path = charsImages[emoji];
    if (!path || !(path.endsWith('.png') || path.endsWith('.svg') || path.endsWith('.jpg'))) return null;
    return resolveImagePath(path);
}

// Retourne l'affichage pour un picto : image si dans charsImages, sinon le picto.
// Utilisé pour les boutons (frise, etc.) - transparent si on ajoute des images dans charsImages.
// Retourne { type: 'image', value: src } ou { type: 'text', value: picto }
function getDisplayForPicto(picto) {
    const src = getLogoImageSrc(picto);
    if (src) return { type: 'image', value: src };
    return { type: 'text', value: picto };
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

window.CHARS = CHARS;
window.LOGOS = CHARS; // Alias pour compatibilité (configOrganigramme, organigramme)
window.CHARS_DESC = CHARS_DESC;
// Source unique pour mapper id époque (emoji ou 'hysteresis Xy') → nom français.
// Remplace les anciennes tables idToName dispersées (events.js, etc.).
window.epochName = function (id) {
    return (CHARS_DESC[id] !== undefined) ? CHARS_DESC[id] : id;
};
window.charsImages = charsImages;
window.createAlphabetHtml = createAlphabetHtml;
window.getLogo = getLogo;
window.getLogoKey = getLogoKey;
window.getDisplayChar = getDisplayChar;
window.getLogoImageSrc = getLogoImageSrc;
window.getDisplayForPicto = getDisplayForPicto;
// Init graphique : remplir [data-char] depuis CHARS (visu, etc.)
window.initCharsForDisplay = function () {
    if (!window.CHARS) return;
    document.querySelectorAll('[data-char]').forEach(function (el) {
        var key = el.getAttribute('data-char');
        if (key && window.CHARS[key]) el.textContent = window.CHARS[key];
    });
};

})();

