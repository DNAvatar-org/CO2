// File: configOrganigramme.js - Configuration du diagramme de flux énergétique
// Desc: Données de configuration (nœuds et arcs) pour le diagramme de flux énergétique
// Version 1.1.67
// - v1.1.67: la Géométrie peut se rapprocher du Soleil (N.geometrie.distPct, glissé : zoom_terre.js).
// - v1.1.66: TERRE_ECRAN.miroir (page embarquée ?miroir, static/ui/embarque.js) : l'organigramme en symétrie d'axe vertical,
//   à droite de la Terre — angles à l'écran θ → π − θ (versEcran, depuisEcran, angleEcran pour la Géométrie).
// - v1.1.65: ondes de l'effet de serre : du bouton EDS jusqu'à la surface.
// - v1.1.64: ondes de la surface (émission, réfléchi) : secteur resserré au zoom, elles gardent leur taille de ×1.
// - v1.1.63: TERRE_ECRAN.horizon (caméra de l'ISS) : le cercle est l'horizon, angles resserrés sur l'arc visible (versEcran).
// - v1.1.62: Géométrie à 45° en haut à droite du Soleil ; albédo sans obstacles (ni 🛰 CERES ni Géométrie). Disposition par
//   défaut relevée sur la mise en page voulue (onglet ISS) : Soleil et CERES à gauche, DSCOVR (OBSERVATIONS) en haut à
//   gauche, EDS en bas à gauche, albédo entre le Soleil et la Terre, éventail des gaz en bas. EVENEMENT et SKIP : dans
//   le bandeau du bas, après ⚗ DETAILS (plus de x, y). DSCOVR glissé (−2,404 rad, 151 %) ; hauteur de l'atmosphère sous la
//   puissance éjectée (milieu de albedo → espace2) ; puissance émise par la surface au début de la flèche du noyau. Géométrie : angle autour du Soleil, glissable ;
//   SYNTHESE_SUR_TERRE (T° et pression sur la Terre). Soleil et CERES évitent Energies / Atmosphère (à gauche, mi-hauteur).
//   Disposition par défaut relevée sur la mise en page voulue (2026-10-17) : Soleil, Géométrie à sa droite, satellites,
//   EDS, albédo, éventail des gaz à 120 %, T° et pression.
// - v1.1.61: Soleil par défaut 2,68 rad / 198 % ; EDS par défaut à gauche, sous l'atmosphère (2,584 rad, 149 %) ; point de liaison à +20° de l'axe Terre → DSCOVR.
// - v1.1.60: onglet ISS — le Soleil sur le vrai Soleil quand il est à l'écran ; vue Terre–Lune : boutons, satellites et Soleil
//   autour de l'orbite de la Lune à l'écran (TERRE_ECRAN.orbite, rayonVers).
// - v1.1.59: point de liaison noyau / émission à la surface décalé de 20° de l'axe Terre → DSCOVR ; l'émission en part droit au satellite.
// - v1.1.58: disposition par défaut autour de la Terre (Soleil, albédo, satellites, éventail des gaz) relevée sur la mise en page voulue de l'onglet ISS.
// Date: [October 16, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// logs :
// - v1.1.55: nœud 🗺 crédits PALEOMAP retiré (texte du pied de page, index.html) ; Soleil déplaçable (zoom_terre.js),
//   Géométrie au bord de son rayonnement.
// - v1.1.54: TERRE_ECRAN (centre cx, cy et rayon R de la Terre à l'écran) = paramètres des placements autour d'elle
//   (accesseurs parametrerParLeRayon) ; molette : zoom_terre.js ; onglet ISS : la Terre de la page ISS.
//   Les boutons autour de la Terre (cercle + textes des cases autour) butent sur les bords de #flux-diagram et sur les
//   éléments de leur bornesPar (🛰 OBSERVATIONS, Géométrie) ; satellites près du cercle ; LONGUEUR_MIN_FLECHE ;
//   albédo à −45° (à droite du 🛰 du haut) ; ondes rouges de la Terre jusqu'au satellite DSCOVR.
// - v1.1.53: textures PALEOMAP 540, 380, 340, 295, 55, 20 Ma ajoutées ; 33 et 17 Ma retirées (copies d'autres dates).
// - v1.1.52: espace2 = trou sous le 🛰 jumeau bas (comme espace1 sous le 🛰 haut). Terre et satellites recentrés sur la hauteur réelle de l'organigramme ; Soleil, EVENEMENT, SKIP fixes.
// - v1.1.51: ACTION_BY_DATE / getActionForDate / getCurrentDateKey retirés : la séquence des clics est la config
//   de l'API (🕰.order, lue par CLICS). La table ne se déclenchait d'ailleurs jamais sur 🔥 (4510 − k×100 Ma).
// - v1.1.50: retrait du tooltip « Terre » sur le nœud terre (rollover jugé inutile sur le globe Three.js).
// - v1.1.49: TEXTURE_DATES_MA / _YEAR alignées sur les fichiers RÉELLEMENT présents dans fonds/ (base du repli « texture la plus proche »).
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
//   - Initial version: extraction des données de configuration depuis organigramme.js
//   - Added dataId mapping for dynamic label updates

// ============================================================================
// RÉFÉRENCE DES LOGOS (déplacée vers alphabet.js)
// ============================================================================
// ⚠️ IMPORTANT : Les logos sont maintenant définis dans static/compute/alphabet.js
// Ce fichier utilise window.CHARS (ou window.LOGOS pour compatibilité) et window.charsImages définis dans alphabet.js
// Assurez-vous que alphabet.js est chargé avant configOrganigramme.js

// Constante locale pour utiliser CHARS
const LOGOS = window.CHARS;

// ============================================================================
// TEXTURES Three.js — CO2/fonds/*.png par dates (la carte c'est le territoire)
// ============================================================================
// ⚠️ charsImages (alphabet.js) ne touche JAMAIS aux textures !
// Le chemin texture se déduit toujours de la date : getPlanetTexturePathFromEpoch(▶, infoTimeMa) (organigramme.js).
// Liste pour préchargement éventuel : dérivée des dates (Ma ou années), pas des noms d’époques.
// Convention : '-' + 5 chiffres + Ma.png (temps géologique) ; années : ('_' si y≥0, '-' si y<0) + 6 chiffres + a.png.
function fondsTexturePathFromSignedYear(y) {
    const yR = Math.round(Number(y));
    const p = String(Math.abs(yR)).padStart(6, "0");
    const pref = yR < 0 ? "-" : "_";
    return "fonds/" + pref + p + "a.png";
}
// INVENTAIRE RÉEL du dossier fonds/ (v2026-09-18) : ces listes DOIVENT correspondre aux fichiers présents.
// La texture affichée = la plus PROCHE de la date courante dans ces listes (organigramme.js), donc jamais de 404 :
// une date sans image exacte (ex. 2050) retombe sur l'image la plus proche (2000). Ajouter un fichier = l'ajouter ici.
// 2 et 1 Ma : les deux états stables du Quaternaire (glaciaire / interglaciaire), cf. 🕰.🔁 '🖼'.
// Phanérozoïque : cartes PALEOMAP (Scotese) nettoyées (cartes_work/PALEOMAP_clean), nommées à LEUR date de
// reconstruction ; chaque clic de 🕰.order tombe à moins de 5 Ma de l'une d'elles.
const TEXTURE_DATES_MA = [5000, 4900, 4800, 4700, 4600, 4500, 4400, 4300, 4200, 4100, 4000, 3500,
    3000, 2500, 1910, 1320, 1000, 750, 720, 690, 600, 540, 420, 380, 340, 295, 280, 250, 150, 100, 66, 55, 50,
    35, 20, 2, 1];
/** Années signées (BP négatif, CE positif) — aligné getTimelineCurrentYears. */
const TEXTURE_DATES_YEAR = [-10000, -6000, -5000, -3000, -2000, 1800, 2000];
const TEXTURES_THREEJS = [
    ...TEXTURE_DATES_MA.map((ma) => "fonds/-" + String(ma).padStart(5, "0") + "Ma.png"),
    ...TEXTURE_DATES_YEAR.map((y) => fondsTexturePathFromSignedYear(y)),
];

// Configuration de base
const radius = 40; // Cercles plus petits (par défaut)
const centerX = 183; // Centre horizontal du diagramme (328px / 2)
const centerY = 215; // Centre vertical du diagramme (640px / 2)
// Terre recentrée dans la hauteur réelle de l'organigramme (panel visu − titre − gap), lue à la construction.
// Conçu pour 545 px (ancien panel 670 − titre 120 − 5) : Terre à 315, centrée sur [85, H]. Jamais plus haut
// que 315 (au-dessus, l'atmosphère mord le Soleil).
const earthCenterY0 = centerY + 100;
const EARTH_BAND_TOP = 85;
const fluxDiagramH = document.getElementById('visu-panel').clientHeight
    - document.querySelector('#visu-panel .title-container').offsetHeight
    - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--visu-gap'));
const earthCenterY = Math.max(earthCenterY0, (EARTH_BAND_TOP + fluxDiagramH) / 2); // Centre vertical de la Terre et éléments concentriques
const earthShiftY = earthCenterY - earthCenterY0; // Décalage des éléments liés à la Terre posés sur centerY
const arrowMarginTop = 10; // Marge en haut des flèches
const arrowMarginBottom = 15; // Marge en bas des flèches
// --- nœud.radiation (organigramme.js, setArcClipPath / resolveRadiationArcParams) :
//     • Pas d’échelle log sur les arcs : rayons = pixels linéaires (node.radius → maxRadius par cercle).
//     • openingAngle / angleFinal = angle **masqué** (découpé au clip) ; secteur **visible** = 360° − cette valeur (ex. 345 → faisceau ~15°).
//     • rotation (°) = orientation du secteur visible (0 = droite, 90 = bas, comme atan2 à l'écran). Autour de la Terre, elle
//       suit la flèche que l'onde accompagne, recalculée à chaque dessin (parametrerParLeRayon) : pas de valeur écrite ici.
//     • angleInit = même grandeur que openingAngle (**ouverture masquée** au 1er frame), uniquement pour animer vers openingAngle ; ce n’est **pas** un déphasage / bearing supplémentaire. Au repos = rendu identique à une config sans angleInit.
//     • Flèches entre cercles concentriques (noyau → terre → albedo) : leur direction vient d'un décalage d'un pixel des centres
//       du noyau et de l'albedo, sur l'axe Terre → DSCOVR (parametrerParLeRayon).
//     • radius = alias maxRadius si absent. Si angleFinal et openingAngle diffèrent, angleFinal prime.
const cellHeight = 110;
const cellHalfHeight = cellHeight / 2; // 55px

const radiusTerre = 90;
// La Terre à l'écran, dans le repère de #flux-diagram (coin intérieur) : centre (cx, cy) et rayon R [px] — LES paramètres
// des placements autour d'elle. Molette : R (organigramme/zoom_terre.js) ; onglet ISS : centre et rayon de la Terre de la
// page ISS (message iss:terre, static/ui/onglets_graphe.js). Les longueurs écrites dans nodes et baryEpochs sont le dessin à
// R = radiusTerre, centre (centerX, earthCenterY) ; parametrerParLeRayon (plus bas) en fait des fonctions de TERRE_ECRAN.
// Cercle d'atmosphère (albedo) et sa radiation : dr = dR / 5 (le globe gagne 5 px, eux 1 px) — sans jamais passer sous le
// globe : la flèche Terre → atmosphère garde LONGUEUR_MIN_FLECHE (+ 8 px de marge à l'arrivée, generateArrows).
// Les boutons autour butent sur les bords de cadreEl : #flux-diagram, ou la zone de l'onglet en pleine page.
// soleilVrai : le Soleil de la page ISS à l'écran, { x, y } dans le repère de #flux-diagram, ou null (hors de l'image, caché par
// la Terre, hors onglet ISS) : le Soleil de l'organigramme s'y pose ; sinon il garde sa place (dessinée, glissée à la souris,
// retenue en cookie). orbite : vue Terre–Lune de la page ISS, l'orbite de la Lune à l'écran (demi-diamètres conjugués
// { ax, ay, bx, by } [px]) — le « cercle » autour duquel se posent boutons, satellites et Soleil ; sinon null (rayonVers).
// horizon : caméra de l'ISS — le cercle est l'horizon de la haute atmosphère (centre et R : le sien, loin à droite de l'écran,
// caméra tournée, la Terre à droite), dont seul un arc se voit : { haut, k, rTerre } — les angles des boutons (theta, vue
// Terre) sont resserrés sur cet arc autour de haut (l'angle du point sous le Soleil) : la gauche de la Terre (θ = π) va à haut,
// sa droite (θ = 0) aux bouts de l'arc, le haut en haut et le bas en bas (versEcran ; depuisEcran,
// l'inverse) ; rTerre : rayon d'une Terre ordinaire [px], l'échelle des écarts au cercle et des longueurs (k, ecart).
// Sinon null.
// miroir : l'organigramme en symétrie d'axe vertical (page embarquée ?miroir, static/ui/embarque.js) — tout ce qui est à gauche
// de la Terre passe à sa droite : les angles des boutons (theta), lus dans la disposition d'origine, sont retournés à l'écran
// (θ → π − θ) ; le point d'horizon de la caméra de l'ISS est à droite de la Terre (θ = 0 à l'écran).

// boule : la Terre est une vraie boule 3D (onglet ISS) — le globe de l'organigramme vaut R à toute époque (exobase
// comprise) ; le cercle d'atmosphère la dépasse un peu, R + la flèche Terre → atmosphère la plus courte
// (LONGUEUR_MIN_FLECHE + 8 px de marge d'arrivée), sa radiation garde son écart au cercle.
// T° et pression de surface posées SUR la Terre (onglet ISS, zoom_terre.js) : angle theta [rad, y vers le bas] et distance
// au centre k [fraction du rayon R] — relevés sur le point de lumière de la Terre ISS à sa vue de départ.
window.SYNTHESE_SUR_TERRE = { theta: 2.300, k: 0.54 };
const TERRE_ECRAN = window.TERRE_ECRAN = {
    R: radiusTerre,
    cx: centerX,
    cy: earthCenterY,
    cadreEl: document.getElementById('flux-diagram'),
    soleilVrai: null,
    orbite: null,
    horizon: null,
    // Terre de référence { cx, cy, R } : onglet ISS, la Terre au zoom ×1 (T° et pression, place à gauche : zoom_terre.js) ;
    // ailleurs, la Terre elle-même
    ref: { cx: centerX, cy: earthCenterY, R: radiusTerre },
    boule: false,
    miroir: window.EMBARQUE.miroir,
    k() { return (this.horizon === null ? this.R : this.horizon.rTerre) / radiusTerre; },
    /** Angle d'un bouton (theta, autour de la Terre) → angle à l'écran autour du centre : le même, ou resserré sur l'arc
     *  d'horizon visible (caméra de l'ISS). depuisEcran : l'inverse (glisser à la souris). */
    versEcran(theta) {
        const h = this.horizon, t = this.angleEcran(theta), pivot = this.miroir ? 0 : Math.PI;   // la gauche de la Terre, retournée
        return h === null ? t : h.haut + h.k * Math.atan2(Math.sin(t - pivot), Math.cos(t - pivot));
    },
    depuisEcran(a) {
        const h = this.horizon, pivot = this.miroir ? 0 : Math.PI;
        return this.angleEcran(h === null ? a : pivot + Math.atan2(Math.sin(a - h.haut), Math.cos(a - h.haut)) / h.k);
    },
    /** Un angle de la disposition → à l'écran : le même, ou retourné par le miroir (π − a) ; sa propre inverse. */
    angleEcran(a) { return this.miroir ? Math.PI - a : a; },
    drCercle() { return Math.max(radiusTerre * (this.k() - 1) / 5, this.R + LONGUEUR_MIN_FLECHE + 8 - radiusAtmosphere); },
    /** Bords de cadreEl { g, d, h, b } dans le repère de #flux-diagram [px]. */
    cadre() {
        const f = document.getElementById('flux-diagram'), fr = f.getBoundingClientRect(), r = this.cadreEl.getBoundingClientRect();
        const ox = fr.left + f.clientLeft, oy = fr.top + f.clientTop;
        return { g: r.left - ox, d: r.right - ox, h: r.top - oy, b: r.bottom - oy };
    }
};
const radiusAtmosphere = 175;
const circleMiddleRadius = (radiusTerre*2 + radiusAtmosphere) / 3;
// 4 tailles d'espacement pour les flèches
const spacingSizes = {
    short: 10,    // Court (par défaut, pas de label)
    medium: 45,   // Moyen (si label présent)
    long: 100,     // Long
    extraLong: 120 // Très long
};
// Longueur minimale d'une flèche [px], pointe (8 px) comprise : une flèche que le zoom de la Terre raccourcit ou retourne
// est dessinée à cette longueur, dans sa direction (organigramme.js, generateArrows).
const LONGUEUR_MIN_FLECHE = 20;

// Constantes de Z-Index pour l'architecture en couches
const Z_LAYERS = {
    ARROW: 10,
    ARROW_LABEL: 50, // Au-dessus des flèches et de #cell-terre (32) pour les libellés ; sous RADIATION (100).
    NODE: 20,        // Plancher nœuds « classiques » ; libellés de flèches ARROW_LABEL (50) au-dessus ; Terre 32
    RADIATION: 100,  // Au-dessus des nœuds
    BUTTON: 200      // Au-dessus de tout
};

const Z_NODE_INTERNAL = {
    CIRCLE: 1,
    LOGO: 10,
    LABEL: 20
};

// Constantes de positionnement des étiquettes sur les flèches
const LABEL_POSITIONS = {
    txtDD: -0.1,       // Avant le début de la flèche (départ)
    txtD: 0.2,      // 20% - Début de la flèche
    txtF: 0.93,     // 93% - Fin de la flèche
    txtFF: 1.1,    // Après le bout de la flèche (arrivée)
};

// Z-index spécifiques pour chaque nœud
const NODE_Z_INDEX = {
    SOLEIL: 12,        // Soleil (derrière geometrie)
    GEOMETRIE: 13,     // Géométrie (petit nœud)
    ESPACE1: 14,       // Satellite espace1
    ALBEDO: 10,        // Albédo (derrière la Terre)
    NOYAU: 34,         // Noyau (au-dessus du globe Terre, sous RADIATION)
    SURFACE: 32,       // Terre/Surface (au-dessus des flèches, z max arc 30)
    ESPACE2: 14,       // Satellite espace2
    REEMIS: 36,        // Réémis / EDS (au-dessus du globe Terre)
    // Boutons
    CO2: 200,
    METHANE: 200,
    H2O: 200,
    ALBEDO_BTN: 200
};

// Z-index spécifiques pour les flèches (pour gérer les cas où elles doivent passer devant/derrière des nœuds)
const ARROW_Z_INDEX = {
    DEFAULT: 10,           // Flèches normales (derrière #cell-terre z 32)
    SOLEIL_GEOMETRIE: 10,  // Soleil -> Géométrie
    GEOMETRIE_ALBEDO: 10,  // Géométrie -> Albédo (jaune)
    GEOMETRIE_SURFACE: 10, // Géométrie -> Surface (jaune)
    ALBEDO_ESPACE1: 10,    // Albédo -> Espace1 (réfléchi)
    NOYAU_SURFACE: 22,     // Noyau -> Surface (sous le globe Terre z 32)
    SURFACE_ALBEDO: 22,    // Surface -> Albédo (rouge, sous le globe)
    ALBEDO_ESPACE2: 22,    // Albédo -> Espace2 (orange, sous le globe)
    REEMIS_SURFACE: 26     // Réémis -> Surface (rouge, sous le globe et EDS z 36)
};

// Configuration du rayonnement dynamique du noyau
// Définition du graphe : nœuds (cellules)
// Le soleil émet ~3.8×10²⁶ W dans toutes les directions (4π stéradians)
// Surface sphère à 1 UA (distance Terre-Soleil) = 4π × (1.5×10¹¹ m)² ≈ 2.83×10²³ m²
// (PAS la surface de la Terre qui est ~5.1×10¹⁴ m², mais la sphère sur laquelle l'énergie se répartit)
// 3.8×10²⁶ W / 2.83×10²³ m² ≈ 1361 W/m² (constante solaire sur surface perpendiculaire au rayonnement)
// 340.25 W/m² = 1361/4 (moyennisation sur toute la surface terrestre)
// Explication : La Terre est une sphère. Vu du Soleil, seule la face éclairée est visible (disque de rayon R, surface = πR²)
// Mais la surface totale de la Terre est 4πR². En moyenne : 1361 × (πR²) / (4πR²) = 1361/4
const nodes = [
    {//soleil
     id: 'soleil', bornesPar: ['titre-bilan', 'titre-affichages'], logo: [LOGOS.SUN_ORIGIN, { text: '3.8×10<sup><b>26</b></sup> W ', dataId: 'solar_power_total' }], align: 'zorder', theta: -2.765, rayonPct: 197, radius, fillColor: 'rgba(255, 193, 7, 0)', strokeColor: 'yellow', strokeSize: 1, strokeStyle: 'solid', left: [], right: [{ text: '62.4<br>MW/m²', dataId: 'solar_surface_mw' }], top: [], bottom: [], tooltip: 'Soleil', radiation: { numCircles: 8, maxRadius: 170, openingAngle: 0, color: 'yellow' }, zIndex: 12, logoScale: 1.0, logoOffsetY: 1 
    },

    {//geometrie
     // angle : autour du Soleil [rad, y vers le bas : −π/4 = haut droite]
     id: 'geometrie', angle: 0.041, logo: 'fonts/pics/geometrie.png', radius: 20, fillColor: 'rgba(255, 255, 0, 0)', strokeColor: 'yellow', strokeSize: 0, left: [{ text: '1361<br>W/m²', dataId: 'solar_1UA_mw' }], right: [], top: ['Géométrie'], bottom: [], tooltip: 'Geometrie', radiation: null, zIndex: 13, logoScale: 0.8 
    },

    {//espace1
     id: 'espace1', bornesPar: ['titre-affichages'], logo: '', logoScale: 1.2, theta: -2.970, rayonPct: 149, radius: 20, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: [], right: [], top: [], bottom: '', tooltip: 'CERES', radiation: null, zIndex: 14 
    },

    {//albedo cellule — cercle extérieur toujours blanc alpha 0.5, sans fill
        // centre décalé d'un pixel vers DSCOVR (parametrerParLeRayon) : il donne la direction de la flèche terre → albedo
        id: 'albedo',
        logo: '',
        planetEffect: false,
        x: centerX,
        y: earthCenterY,
        radius: radiusAtmosphere,
        fillColor: 'rgba(0, 0, 0, 0)',
        strokeColor: 'rgba(255, 255, 255, 0.5)',
        strokeSize: 1, 
        strokeStyle: [10, 5, 2, 5, 2, 5],
        left: [], right: [], top: [], bottom: [], tooltip: '',
        // 8 cercles, de la surface jusqu'à CERES (rayonDepart, maxRadius : parametrerParLeRayon) ; en angle le clip ne laisse
        // que 360−345 = 15° visibles (faisceau étroit).
        radiation: { numCircles: 8, maxRadius: 270, openingAngle: 345, color: 'white' },
        zIndex: 10,
        logoScale: 0.1
    },

    {//noyau cellule — centre décalé d'un demi-pixel à l'opposé de DSCOVR (parametrerParLeRayon) : la flèche noyau → terre
     // est sur l'axe Terre → DSCOVR, comme terre → albedo → DSCOVR
        id: 'noyau',
        logo: [{ text: '4.44 x 10^13 W', dataId: 'core_temperature' }],//'🌕',
        x: centerX,
        y: earthCenterY,
        radius: 30,
        fillColor: 'rgba(255, 69, 0, 0)',
        strokeSize: 0,
        strokeColor: 'rgba(255, 69, 0, 0)',//'#ff5500',
        left: [],
        right: [],
        top: [],
        bottom: [],
        tooltip: 'Noyau - Géothermie',
        radiation: [
            {
                epochName: 'Corps Noir',
                numCircles: 0,
                maxRadius: 0,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Hadéen',
                numCircles: 6,
                maxRadius: 100,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Archéen',
                numCircles: 6,
                maxRadius: 70,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Protérozoïque',
                numCircles: 3,
                maxRadius: 70,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Pré-sturtienne', // hysteresis 1a
                numCircles: 3,
                maxRadius: 70,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Snowball Sturtien', // ⛄ (ex « Plein Snowball »)
                numCircles: 3,
                maxRadius: 68,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Sortie Sturtienne', // hysteresis 1b (v-2026-09-24)
                numCircles: 3,
                maxRadius: 65,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Snowball Marinoen', // 🏂 (v-2026-09-24)
                numCircles: 3,
                maxRadius: 68,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Sortie Marinoen', // hysteresis 1c (v-2026-09-24)
                numCircles: 3,
                maxRadius: 65,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Paléozoïque marin',
                numCircles: 2,
                maxRadius: 58,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Paléozoïque terrestre',
                numCircles: 2,
                maxRadius: 55,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Extinction permienne',
                numCircles: 2,
                maxRadius: 52,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Mésozoïque',
                numCircles: 2,
                maxRadius: 50,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Cénozoïque',
                numCircles: 2,
                maxRadius: 50,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Éocène',
                numCircles: 2,
                maxRadius: 52,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Eocène-Oligocène', // hysteresis 2
                numCircles: 2,
                maxRadius: 45,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Grande Coupure',
                numCircles: 1,
                maxRadius: 30,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Quaternaire',
                numCircles: 2,
                maxRadius: 38,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            },
            {
                epochName: 'Holocène',
                numCircles: 1,
                maxRadius: 32,
                strokeSize: 0,
                openingAngle: 0,
                color: '#ff9800'
            }
        ],
        zIndex: 34,
        logoScale: 0.8,
        logoOffsetY: 2
    },

    {//terre cellule
        id: 'terre',
        x: centerX,
        y: earthCenterY,
        epoch: [
            {
                epochName: 'Corps Noir',
                logo: LOGOS.CORPS_NOIR,
                planetEffect: true,
                luxSaturation: 1.0,
                lightDistance: '7-{$ticTime}/3',
                radius: radiusTerre * 0.8,
                // Exobase ~ surface + ε px : anneau d’atmosphère présent pour la géométrie / flèches, invisible (albédo z < Terre).
                radiusExobase: radiusTerre * 0.8 + 0.25,
                fillColor: 'rgba(0, 0, 0, 0)',
                strokeColor: '#666666',
                strokeSize: 0,
            },
            {
                epochName: 'Hadéen',
                logo: LOGOS.HADEEN,
                planetEffect: true,
                luxSaturation: 3.0,
                lightDistance: 0,
                radius: radiusTerre * 1.1,
                radiusExobase: radiusTerre * 1.6,
                strokeColor: '#FF4500',
                fillColor: 'rgba(255, 69, 0, 0.5)',
                strokeSize: 0,
            },
            {
                epochName: 'Archéen',
                logo: LOGOS.ARCHEEN,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.15,
                fillColor: 'rgba(255, 215, 0, 0.5)',
                strokeColor: '#FFD700',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Protérozoïque',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 191, 255, 0.5)',
                strokeColor: '#00FA9A',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Pré-sturtienne', // hysteresis 1a (entrée Snowball)
                logo: LOGOS.SNOWBALL_ENTRY,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.06,
                fillColor: 'rgba(200, 230, 255, 0.55)',
                strokeColor: '#B0E0E6',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Snowball Sturtien', // ⛄ (ex « Plein Snowball »)
                logo: LOGOS.SNOWBALL,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.05,
                fillColor: 'rgba(230, 245, 255, 0.7)',
                strokeColor: '#E0FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Sortie Sturtienne', // hysteresis 1b (v-2026-09-24)
                logo: LOGOS.CRYO_INTERLUDE,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(100, 180, 220, 0.5)',
                strokeColor: '#5FAFD0',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Snowball Marinoen', // 🏂 (v-2026-09-24)
                logo: LOGOS.SNOWBALL_MARINOAN,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.05,
                fillColor: 'rgba(230, 245, 255, 0.7)',
                strokeColor: '#E0FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Sortie Marinoen', // hysteresis 1c (v-2026-09-24)
                logo: LOGOS.SNOWBALL_EXIT,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(100, 180, 220, 0.5)',
                strokeColor: '#5FAFD0',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Paléozoïque marin',
                logo: LOGOS.GLOBE_ASIA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Paléozoïque terrestre',
                logo: LOGOS.GLOBE_ASIA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(80, 200, 160, 0.5)',
                strokeColor: '#50C8A0',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Extinction permienne',
                logo: LOGOS.PERMIAN_TRIASSIC,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(180, 80, 60, 0.45)',
                strokeColor: '#B0503C',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Mésozoïque',
                logo: LOGOS.GLOBE_AMERICAS,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Cénozoïque',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Éocène',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Eocène-Oligocène', // hysteresis 2
                logo: LOGOS.EOCENE_OLIGOCENE,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(150, 200, 240, 0.5)',
                strokeColor: '#96C8F0',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Grande Coupure',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Quaternaire',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(180, 220, 255, 0.5)',
                strokeColor: '#B0E0E6',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Holocène',
                logo: LOGOS.GLOBE_AFRICA,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(150, 220, 180, 0.5)',
                strokeColor: '#96DCB4',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Industriel',
                logo: LOGOS.TODAY,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 200, 255, 0.5)',
                strokeColor: '#00FFFF',
                strokeSize: 0,
                planetEffect: true
            },
            {
                epochName: 'Aujourd\'hui',
                logo: LOGOS.MODERN,
                radius: radiusTerre,
                radiusExobase: radiusTerre * 1.08,
                fillColor: 'rgba(0, 255, 255, 0.5)',
                strokeColor: '#E0FFFF',
                strokeSize: 0,
                planetEffect: true
            }
        ],
        left: [],
        right: [],
        top: '',
        bottom: '',
        tooltip: '',
        radiation: { numCircles: 8, maxRadius: 200, openingAngle: 340, color: 'red' },
        zIndex: 32
    },

    {//espace2
     id: 'espace2', bornesPar: [], logo: '', logoScale: 1.2, theta: -2.382, rayonPct: 147, radius: 20, fillColor: 'rgba(255, 255, 255, 0)', strokeColor: '', left: '', right: [], top: '', bottom: '', tooltip: 'DSCOVR au L1', radiation: null, zIndex: 14 
    },
    // EDS : angleInit anime l’ouverture masquée 210→340 (secteur visible 150°→20°), pas la direction. Le faisceau vise la Terre (rotation : parametrerParLeRayon).
    {//📛 reemis
     id: 'reemis', bornesPar: ['observation-config-wrap-bas'], logo: LOGOS.EDS, zIndex: 36, theta: 2.701, rayonPct: 148, radius: 20, logoScale: 0.7, fillColor: 'rgba(255, 0, 0, 0)', strokeColor: 'rgba(255, 0, 0, 0)', strokeSize: 1, left: [], right: '', top: '', bottom: { text: 'Effet de<br>Serre', dataId: 'forcing_label' }, tooltip: 'Effet de Serre', radiation: { numCircles: 8, maxRadius: 100, angleInit: 210, openingAngle: 340, color: 'red', strokeSize: 2 } 
    },

    {//co2
    id: 'co2', bornesPar: [], type: 'button', readOnly: true, logo: LOGOS.CO2, logoOffsetY: 0, theta: 2.943, rayonPct: 120, left: [], right: [], top: [{ text: '0 ppm', dataId: 'co2_percent' }], bottom: [{ text: '0 W/m²', dataId: 'co2_forcing_wm' }], tooltip: 'CO₂', radius: 25, logoScale: 0.7, zIndex: 200, fillColor: 'transparent', strokeColor: 'rgba(0, 0, 0, 0)' 
    },

    {//methane
    id: 'methane', bornesPar: [], type: 'button', readOnly: true, logo: LOGOS.CH4, logoOffsetY: 2, theta: 2.147, rayonPct: 120, left: [{ text: '0 ppm', dataId: 'ch4_percent' }], right: [], top: '', bottom: [{ text: '0<br>W/m²', dataId: 'ch4_forcing_wm' }], tooltip: 'CH₄', zIndex: 200, radius: 35, logoScale: 0.7, logoOffsetY: 2, fillColor: 'transparent', strokeColor: 'rgba(0, 0, 0, 0)' 
    },

    {//h2o
    id: 'h2o', bornesPar: [], type: 'button', readOnly: true, logo: LOGOS.H2O, theta: 2.545, rayonPct: 120, left: [{ text: '0%', dataId: 'h2o_percent' }], right: [], top: '', bottom: [{ text: '0 W/m²', dataId: 'h2o_forcing_wm' }], tooltip: 'H₂O', zIndex: 200, radius: 20, logoScale: 0.8, fillColor: 'transparent', strokeColor: 'rgba(0, 0, 0, 0)' 
    },//end h2o

    {//domSlot action
        id: 'timeline-scenario-logos',
        type: 'domSlot',
        mountId: 'timeline-events-logos',
        appendParentSelector: '#bandeau-bas-ligne',   // rangée du bas, après ⚗ DETAILS (html/visu_radiatif.html)
        top: [{ text: 'EVENEMENT', className: 'organigram-config-heading organigram-unified-title' }],
        zIndex: 220,
        slotMinWidth: 500,
        slotEventLogoPx: 100,
        domClass: 'timeline-events-logos'
    },

    { // 🎞 + SKIP (cellule id #plot-anim-toggle, flux-cell + span .organigram-logo — organigramme.js) : rangée du bas, après
      // EVENEMENT (main.js poserBandeauBas)
        id: 'timeline-scenario-anim',
        type: 'button',
        readOnly: true,
        logo: '🎞',
        zIndex: 221,
        radius: 15,
        logoScale: 0.8,
        left: [],
        right: [],
        top: [{ text: 'SKIP', dataId: 'plot_anim_skip', className: 'organigram-config-heading organigram-unified-title' }],
        bottom: [],
        tooltip: 'Prochaine époque (SKIP)',
        fillColor: 'transparent',
        strokeColor: 'rgba(0, 0, 0, 0)'
    },

    {//albedo-btn
     id: 'albedo-btn', bornesPar: [], type: 'button', readOnly: true, logo: LOGOS.ALBEDO, logoOffsetY: 5, theta: -2.955, rayonPct: 105, left: [], right: [{ text: '🌊5%<br>🌳5%<br>🏜️30%<br>🧊40%<br>⛅30%', dataId: 'albedo_percents' }], top: [{ text: '0%', dataId: 'albedo_percent' }], bottom: [], tooltip: 'Albédo', zIndex: 200, radius: 25, logoScale: 0.7, fillColor: 'transparent', strokeColor: 'rgba(0, 0, 0, 0)' 
    }
];

// Définition du graphe : arcs (flèches)
// Les labels peuvent être des strings (statiques) ou des objets avec { text, dataId } (dynamiques)
const arcs = [
    { from: 'soleil', to: 'geometrie', zIndex: 10, label: { name: { text: '1UA', dataId: 'distance_1ua' }, txtD: '', txtF: '' }, color: '#ffff00'},
    { from: 'geometrie', to: 'albedo', zIndex: 10, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'solar_flux_average_wm' }, txtF: ''}, color: '#ffff00' },//{ text: '0%', dataId: 'passing_albedo_percent' }
    { from: 'geometrie', to: 'terre', zIndex: 10, label: { name: '', txtF: [ { text: '0×10<sup><b>17</b></sup> W/m²', dataId: 'solar_flux_absorbed_wm' }], txtFF: [ { text: '0×10<sup><b>17</b></sup> W', dataId: 'solar_flux_absorbed_watts' } ]}, color: '#ffff00' },
    
    // Flèche grise (réfléchi → CERES) : direction = vecteur albedo → espace1 ; le faisceau blanc de l'albedo la suit.
    { from: 'albedo', to: 'espace1', zIndex: 10, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'solar_flux_reflected_wm' }, txtD: '', txtF: '' }, color: '#bbbb99' },
    // txtD : la puissance émise par la surface, au début de la flèche qui part du centre de la Terre
    { from: 'noyau', to: 'terre', zIndex: 30, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'core_flux_wm' }, txtD: { text: '0×10<sup><b>17</b></sup> W', dataId: 'surface_flux_emitted_watts' }, txtF: '' }, color: '#ff0000' },
    // Flèche ROUGE terre→albedo : direction = décalage du centre de l'albedo, vers DSCOVR (parametrerParLeRayon).
    { from: 'terre', to: 'albedo', zIndex: 22, label: { name: '', txtD: { text: '0×10<sup><b>17</b></sup> W/m²', dataId: 'surface_flux_emitted_wm' } }, color: 'red' },
    // name en tableau : empilés au milieu de la flèche, la hauteur de l'atmosphère sous la puissance éjectée
    { from: 'albedo', to: 'espace2', zIndex: 22, label: { name: [{ text: '0×10<sup><b>17</b></sup> W', dataId: 'flux_ejected_watts' }, { text: '0 km', dataId: 'atm_height_km' }] }, color: '#ff0000' },
    { from: 'reemis', to: 'terre', zIndex: 26, label: { name: { text: '0×10<sup><b>17</b></sup><br>W/m²', dataId: 'forcing_total' }, txtD: '' }, color: '#ff0000' },
];



// Barycentre graphique : valeurs de fin (bary=1) = époque suivante (bary=0 d'après). Interpolation visuelle côté CO2 via IO_LISTENER.
const baryEpochs = {
    // Hadéen → Archéen : bary in [0,1[ ; end-state = Archéen start (cohérence frontière)
    'Hadéen': {
        terre: { radius: radiusTerre, radiusExobase: radiusTerre * 1.15, fillColor: 'rgba(255, 215, 0, 0.5)', strokeColor: '#FFD700' },
        noyau: { radiation: { numCircles: 6, maxRadius: 70 } }
    },
    'Archéen': {
        terre: { radius: 85, radiusExobase: 103.5, fillColor: 'rgba(0, 191, 255, 0.5)', strokeColor: '#00FA9A' },
        noyau: { radiation: { numCircles: 4, maxRadius: 60 } }
    }
};

/** Placements autour de la Terre = fonctions de TERRE_ECRAN (centre cx, cy et rayon R) : accesseurs posés sur les objets
 *  mêmes (la valeur écrite plus haut, à R = radiusTerre et au centre (centerX, earthCenterY), reste dans la fermeture ;
 *  aucune copie). EVENEMENT, SKIP et crédits ne dépendent pas de la Terre.
 *  - terre, noyau, albedo : centrés sur (cx, cy) (noyau et albedo gardent leur décalage < 1 px, pour la direction des
 *    flèches) ; rayons du globe, de son exobase et des radiations × R / radiusTerre ; cercle d'atmosphère : drCercle.
 *  - boutons autour (reemis, co2, methane, h2o, albedo-btn), satellites (espace1, espace2) et Soleil (en haut à gauche du
 *    cercle, déplaçable) : en polaire autour du globe, jamais à l'intérieur du cercle ; la Géométrie au-dessus du Soleil,
 *    au bord de son rayonnement, theta [rad, y vers le bas] et
 *    rayonPct = distance en % du rayon du cercle d'atmosphère. Leur EMPRISE (cercle et textes non vides des cases autour,
 *    n.emprise = { g, d, h, b } : débord du centre [px], mesurée par zoom_terre.js) bute sur les bords de
 *    TERRE_ECRAN.cadre(), et ne touche pas leurs obstacles (n.obstacles : boîtes visibles des éléments de bornesPar,
 *    mesurées par zoom_terre.js) : le bouton glisse sur son cercle jusqu'à l'angle libre le plus proche (à défaut, il
 *    s'arrête sur son rayon avant l'obstacle). Les flèches suivent : elles lisent les mêmes x, y. */
(function parametrerParLeRayon() {
    const longueur = (o, cle) => {
        const v = o[cle];
        Object.defineProperty(o, cle, { enumerable: true, get: () => v * TERRE_ECRAN.k() });
    };
    const longueurDuCercle = (o, cle) => {
        const v = o[cle];
        Object.defineProperty(o, cle, { enumerable: true,
            get: () => TERRE_ECRAN.boule ? TERRE_ECRAN.R + LONGUEUR_MIN_FLECHE + 8 + (v - radiusAtmosphere) : v + TERRE_ECRAN.drCercle() });
    };
    // Globe (rayon, exobase) : × R / radiusTerre selon l'époque ; boule (onglet ISS) : R, le bord de la Terre 3D.
    const rayonDuGlobe = (o, cle) => {
        const v = o[cle];
        Object.defineProperty(o, cle, { enumerable: true, get: () => TERRE_ECRAN.boule ? TERRE_ECRAN.R : v * TERRE_ECRAN.k() });
    };
    const surLeCentre = (n) => {
        const dx = n.x - centerX, dy = n.y - earthCenterY;
        Object.defineProperty(n, 'x', { enumerable: true, get: () => TERRE_ECRAN.cx + dx });
        Object.defineProperty(n, 'y', { enumerable: true, get: () => TERRE_ECRAN.cy + dy });
    };
    const borne = (v, min, max) => Math.min(max, Math.max(min, v));
    // Valeurs de t où c + v·t est entre min et max (v = 0 : toujours ou jamais).
    const intervalle = (c, v, min, max) => v === 0
        ? (c >= min && c <= max ? [-Infinity, Infinity] : [Infinity, -Infinity])
        : [Math.min((min - c) / v, (max - c) / v), Math.max((min - c) / v, (max - c) / v)];
    const autourDeLaTerre = (n) => {
        n.emprise = { g: n.radius, d: n.radius, h: n.radius, b: n.radius };
        n.obstacles = [];
        // distance au centre du globe [px] : sur le cercle d'atmosphère ou au-delà, jamais dedans
        const rayon = (a) => TERRE_ECRAN.distanceAutour(a, n.rayonPct);
        // Centre du bouton hors de chaque obstacle grossi de son emprise = son emprise ne touche pas l'obstacle.
        const libre = (x, y) => n.obstacles.every((o) =>
            x <= o.g - n.emprise.d || x >= o.d + n.emprise.g || y <= o.h - n.emprise.b || y >= o.b + n.emprise.h);
        // Sur son cercle : son angle s'il est libre, sinon l'angle libre le plus proche, degré par degré, jusqu'à 90° de
        // chaque côté (un bouton contre un 🛰 se pousse de côté), position calée aux bords du cadre d'abord — un
        // bord ne doit pas le repousser dans l'obstacle. Aucun angle libre : il s'arrête sur son rayon, avant l'obstacle.
        const centre = () => {
            const e = n.emprise, rho = rayon(n.theta), c = TERRE_ECRAN.cadre(), T = TERRE_ECRAN;
            const vx = Math.cos(T.versEcran(n.theta)), vy = Math.sin(T.versEcran(n.theta));   // theta lu à chaque fois : le Soleil se déplace
            const dansLeCadre = (x, y) => ({ x: borne(x, c.g + e.g, c.d - e.d), y: borne(y, c.h + e.h, c.b - e.b) });
            for (let d = 0; d <= 90; d++) {
                for (const sens of (d === 0 ? [0] : [1, -1])) {
                    const a = n.theta + sens * d * Math.PI / 180;
                    const e = T.versEcran(a);
                    const p = dansLeCadre(T.cx + rayon(a) * Math.cos(e), T.cy + rayon(a) * Math.sin(e));
                    if (libre(p.x, p.y)) return p;
                }
            }
            let t = rho;
            n.obstacles.forEach((o) => {
                const [x1, x2] = intervalle(T.cx, vx, o.g - e.d, o.d + e.g);
                const [y1, y2] = intervalle(T.cy, vy, o.h - e.b, o.b + e.h);
                const entree = Math.max(x1, y1), sortie = Math.min(x2, y2);
                if (entree < sortie && entree >= 0) t = Math.min(t, entree);
            });
            return dansLeCadre(T.cx + vx * t, T.cy + vy * t);
        };
        Object.defineProperty(n, 'x', { enumerable: true, configurable: true, get: () => centre().x });
        Object.defineProperty(n, 'y', { enumerable: true, configurable: true, get: () => centre().y });
    };
    const N = Object.fromEntries(nodes.map((n) => [n.id, n]));
    // Rayon du « cercle » autour duquel se posent boutons, satellites et Soleil, dans la direction theta [px] : le cercle
    // d'atmosphère, ou (vue Terre–Lune de la page ISS) l'ellipse de l'orbite de la Lune à l'écran — de demi-diamètres
    // conjugués a, b, son point dans la direction d = (cos theta, sin theta) est à 1 / |[a b]⁻¹ d| du centre.
    TERRE_ECRAN.rayonVers = (theta) => {
        const o = TERRE_ECRAN.orbite;
        if (o === null) return N.albedo.radius;
        const c = Math.cos(theta), s = Math.sin(theta);
        return Math.abs(o.ax * o.by - o.bx * o.ay) / Math.hypot(o.by * c - o.bx * s, o.ax * s - o.ay * c);
    };
    // Distance au centre d'un bouton à rayonPct dans la direction theta [px], jamais dans le cercle : au-delà du « cercle »,
    // l'écart que rayonPct donne au-delà du cercle d'atmosphère (identique à rayonPct % du cercle d'atmosphère hors vue
    // Terre–Lune). rayonPctDe : l'inverse (glisser à la souris).
    // Échelle de l'écart : le cercle d'atmosphère ; caméra de l'ISS, celui d'une Terre ordinaire (l'horizon fait des milliers
    // de pixels de rayon).
    TERRE_ECRAN.ecart = () => TERRE_ECRAN.horizon === null ? N.albedo.radius : TERRE_ECRAN.horizon.rTerre + LONGUEUR_MIN_FLECHE + 8;
    TERRE_ECRAN.distanceAutour = (theta, rayonPct) => TERRE_ECRAN.rayonVers(theta) + (Math.max(rayonPct, 100) / 100 - 1) * TERRE_ECRAN.ecart();
    TERRE_ECRAN.rayonPctDe = (theta, distance) => 100 * (1 + (distance - TERRE_ECRAN.rayonVers(theta)) / TERRE_ECRAN.ecart());
    N.terre.epoch.forEach((e) => { rayonDuGlobe(e, 'radius'); rayonDuGlobe(e, 'radiusExobase'); });
    // Ondes rouges de la Terre (émission, orientées vers l'atmosphère, côté DSCOVR) : elles s'arrêtent au satellite.
    Object.defineProperty(N.terre.radiation, 'maxRadius', { enumerable: true,
        get: () => Math.hypot(N.espace2.x - N.terre.x, N.espace2.y - N.terre.y) });
    longueurDuCercle(N.albedo, 'radius');
    // Ondes blanches (réfléchi, vers CERES) : comme les rouges, de la surface jusqu'au satellite.
    Object.defineProperty(N.albedo.radiation, 'rayonDepart', { enumerable: true, get: () => getNodeProperty(N.terre, 'radius') });
    Object.defineProperty(N.albedo.radiation, 'maxRadius', { enumerable: true,
        get: () => Math.hypot(N.espace1.x - N.albedo.x, N.espace1.y - N.albedo.y) });
    N.noyau.radiation.forEach((r) => longueur(r, 'maxRadius'));
    // Ondes de l'effet de serre (renvoi vers la surface) : du bouton EDS jusqu'à la surface, pas au-delà.
    Object.defineProperty(N.reemis.radiation, 'maxRadius', { enumerable: true,
        get: () => Math.hypot(N.reemis.x - N.terre.x, N.reemis.y - N.terre.y) - getNodeProperty(N.terre, 'radius') });
    surLeCentre(N.terre);
    // Point de liaison à la surface (fin de la flèche noyau → terre, départ de l'émission terre → albedo → espace2) : décalé
    // le long de la surface de DECALAGE_LIAISON depuis l'axe Terre → DSCOVR (sens horaire à l'écran) ; le noyau y monte en
    // rayon, l'émission en part tout droit vers le satellite et passe le cercle d'atmosphère en Q.
    const DECALAGE_LIAISON = 20 * Math.PI / 180;   // [rad, y vers le bas : positif = sens horaire à l'écran]
    const liaison = () => {
        const T = TERRE_ECRAN, R = getNodeProperty(N.terre, 'radius'), Ra = getNodeProperty(N.albedo, 'radius');
        // décalage compté comme les angles des boutons (resserré sur l'arc visible en caméra de l'ISS, TERRE_ECRAN.versEcran)
        const phi = T.versEcran(T.depuisEcran(Math.atan2(N.espace2.y - T.cy, N.espace2.x - T.cx)) + DECALAGE_LIAISON);
        const P = { x: T.cx + R * Math.cos(phi), y: T.cy + R * Math.sin(phi) };
        const l = Math.hypot(N.espace2.x - P.x, N.espace2.y - P.y);
        const w = { x: (N.espace2.x - P.x) / l, y: (N.espace2.y - P.y) / l };
        // |P + t w − centre| = Ra, racine positive (P est dans le cercle d'atmosphère)
        const dw = (P.x - T.cx) * w.x + (P.y - T.cy) * w.y;
        const t = -dw + Math.sqrt(dw * dw - R * R + Ra * Ra);
        return { phi, P, w, Q: { x: P.x + t * w.x, y: P.y + t * w.y } };
    };
    // Centres décalés de moins d'un pixel, qui donnent la direction des flèches entre cercles concentriques : noyau un
    // demi-pixel avant le centre, vers le point de liaison ; albedo un pixel après, sur la ligne liaison → DSCOVR.
    const decale = (n, d, u) => {
        Object.defineProperty(n, 'x', { enumerable: true, get: () => TERRE_ECRAN.cx + d * u().x });
        Object.defineProperty(n, 'y', { enumerable: true, get: () => TERRE_ECRAN.cy + d * u().y });
    };
    decale(N.noyau, -0.5, () => { const { phi } = liaison(); return { x: Math.cos(phi), y: Math.sin(phi) }; });
    decale(N.albedo, 1, () => liaison().w);
    const arc = (de, vers) => arcs.find((a) => a.from === de && a.to === vers);
    arc('terre', 'albedo').trace = () => { const { P, Q } = liaison(); return { x1: P.x, y1: P.y, x2: Q.x, y2: Q.y }; };
    arc('albedo', 'espace2').trace = () => {
        const { Q, w } = liaison();
        return { x1: Q.x, y1: Q.y, x2: N.espace2.x - N.espace2.radius * w.x, y2: N.espace2.y - N.espace2.radius * w.y };
    };
    // Satellites (espace1 : CERES, espace2 : DSCOVR, sous les 🛰 OBSERVATIONS) et Soleil : autour du cercle d'atmosphère,
    // comme les boutons, tous à gauche de la Terre (la page ISS laisse cette place, iss:marges) ; glissés à la souris
    // (zoom_terre.js) ; le Soleil évite le titre, posé par-dessus (bornesPar).
    ['espace1', 'espace2', 'soleil'].forEach((id) => autourDeLaTerre(N[id]));
    // CO₂, H₂O, CH₄ : un éventail. CH₄ en est le pied (son angle : glisser CH₄ tourne l'éventail), H₂O à un écart, CO₂ à deux
    // (glisser l'un ou l'autre ouvre ou referme l'éventail) ; une seule distance pour les trois. theta et rayonPct sont des
    // accesseurs sur l'éventail : le glisser générique (zoom_terre.js) les écrit comme pour les autres boutons.
    const eventail = { pied: N.methane.theta, ecart: N.h2o.theta - N.methane.theta, rayonPct: N.methane.rayonPct };
    const tourner = (v) => { eventail.pied = v; };
    // écart au pied ramené dans ]−π, π], partagé entre les rangs
    const ouvrir = (rang) => (v) => { eventail.ecart = Math.atan2(Math.sin(v - eventail.pied), Math.cos(v - eventail.pied)) / rang; };
    [['methane', 0, tourner], ['h2o', 1, ouvrir(1)], ['co2', 2, ouvrir(2)]].forEach(([id, rang, poser]) => {
        Object.defineProperty(N[id], 'theta', { enumerable: true, get: () => eventail.pied + rang * eventail.ecart, set: poser });
        Object.defineProperty(N[id], 'rayonPct', { enumerable: true,
            get: () => eventail.rayonPct, set: (v) => { eventail.rayonPct = v; } });
    });
    ['reemis', 'co2', 'methane', 'h2o', 'albedo-btn'].forEach((id) => autourDeLaTerre(N[id]));
    // Ondes : leur secteur suit la flèche qu'elles accompagnent, recalculé à chaque dessin [°, 0 = droite, 90 = bas].
    const angleVers = (de, vers) => Math.atan2(vers.y - de.y, vers.x - de.x) * 180 / Math.PI;
    const orienter = (rad, de, vers) => Object.defineProperty(rad, 'rotation', { enumerable: true, get: () => angleVers(de, vers) });
    orienter(N.terre.radiation, N.terre, N.espace2);    // émission de la surface → DSCOVR
    orienter(N.albedo.radiation, N.albedo, N.espace1);  // réfléchi → CERES
    // Ondes de la surface (émission, réfléchi), concentriques à la vraie Terre : quand on zoome (onglet ISS), le cercle devient
    // immense — leur secteur visible se resserre comme les angles des pictos (TERRE_ECRAN.horizon.k), l'onde garde son arc de ×1.
    const secteurDeZoomUn = (rad) => {
        const v = rad.openingAngle;   // angle masqué [°] : secteur visible = 360 − v
        Object.defineProperty(rad, 'openingAngle', { enumerable: true,
            get: () => 360 - (360 - v) * (TERRE_ECRAN.horizon === null ? 1 : TERRE_ECRAN.horizon.k) });
    };
    secteurDeZoomUn(N.terre.radiation);
    secteurDeZoomUn(N.albedo.radiation);
    orienter(N.reemis.radiation, N.reemis, N.terre);    // effet de serre → surface
    N.noyau.radiation.forEach((r) => orienter(r, N.noyau, N.terre));   // géothermie → surface, vers le point de liaison
    // Le Soleil : sur le vrai Soleil quand la page ISS le montre (TERRE_ECRAN.soleilVrai, onglet ISS), sinon à sa place
    // (theta, rayonPct : dessinée, glissée à la souris, retenue en cookie).
    const placePropre = { x: Object.getOwnPropertyDescriptor(N.soleil, 'x').get, y: Object.getOwnPropertyDescriptor(N.soleil, 'y').get };
    Object.defineProperty(N.soleil, 'x', { enumerable: true,
        get: () => TERRE_ECRAN.soleilVrai === null ? placePropre.x() : TERRE_ECRAN.soleilVrai.x });
    Object.defineProperty(N.soleil, 'y', { enumerable: true,
        get: () => TERRE_ECRAN.soleilVrai === null ? placePropre.y() : TERRE_ECRAN.soleilVrai.y });
    // Géométrie autour du Soleil, à son angle (N.geometrie.angle, glissé à la souris), à la limite de son rayonnement (son
    // dernier cercle) ou plus près (N.geometrie.distPct : % de ce rayon, 100 par défaut, glissé lui aussi) ; son logo tourné
    // du même angle, la face éclairée vers le Soleil (zoom_terre.js).
    const distGeometrie = () => N.soleil.radiation.maxRadius * (N.geometrie.distPct ?? 100) / 100;
    Object.defineProperty(N.geometrie, 'x', { enumerable: true,
        get: () => N.soleil.x + distGeometrie() * Math.cos(TERRE_ECRAN.angleEcran(N.geometrie.angle)) });
    Object.defineProperty(N.geometrie, 'y', { enumerable: true,
        get: () => N.soleil.y + distGeometrie() * Math.sin(TERRE_ECRAN.angleEcran(N.geometrie.angle)) });
    Object.values(baryEpochs).forEach((b) => {
        rayonDuGlobe(b.terre, 'radius');
        rayonDuGlobe(b.terre, 'radiusExobase');
        longueur(b.noyau.radiation, 'maxRadius');
    });
})();

function interpolateNum(startVal, endVal, bary) {
    if (typeof endVal !== 'number' || !Number.isFinite(endVal)) return startVal;
    const s = (typeof startVal === 'number' && Number.isFinite(startVal)) ? startVal : endVal;
    const t = Math.max(0, Math.min(1, Number(bary) || 0));
    return s + t * (endVal - s);
}

function parseRgba(str) {
    if (typeof str !== 'string') return null;
    const m = str.trim().match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i);
    if (m) return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10), m[4] != null ? parseFloat(m[4]) : 1];
    return null;
}

function parseHex(str) {
    if (typeof str !== 'string') return null;
    const s = str.trim().replace(/^#/, '');
    if (s.length === 6) return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
    if (s.length === 3) return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16)];
    return null;
}

function interpolateColor(startStr, endStr, t) {
    if (t >= 1) return endStr;
    if (t <= 0) return startStr;
    const startRgba = parseRgba(startStr);
    const endRgba = parseRgba(endStr);
    if (startRgba && endRgba) {
        const a = startRgba.length > 3 ? startRgba[3] : 1;
        const b = endRgba.length > 3 ? endRgba[3] : 1;
        return 'rgba(' + Math.round(startRgba[0] + t * (endRgba[0] - startRgba[0])) + ',' +
            Math.round(startRgba[1] + t * (endRgba[1] - startRgba[1])) + ',' +
            Math.round(startRgba[2] + t * (endRgba[2] - startRgba[2])) + ',' +
            (a + t * (b - a)).toFixed(2) + ')';
    }
    const startHex = parseHex(startStr);
    const endHex = parseHex(endStr);
    if (startHex && endHex) {
        const r = Math.round(startHex[0] + t * (endHex[0] - startHex[0]));
        const g = Math.round(startHex[1] + t * (endHex[1] - startHex[1]));
        const b = Math.round(startHex[2] + t * (endHex[2] - startHex[2]));
        return '#' + [r, g, b].map(function (x) { return ('0' + Math.max(0, Math.min(255, x)).toString(16)).slice(-2); }).join('');
    }
    return t >= 0.5 ? endStr : startStr;
}

function getEffectiveNodesConfig(epochName, bary) {
    if (!epochName || !baryEpochs[epochName]) return nodes;
    const b = baryEpochs[epochName];
    const t = Math.max(0, Math.min(1, Number(bary) || 0));
    const out = nodes.map(function (node) {
        const endNode = b[node.id];
        if (!endNode) return node;
        if (node.epoch && Array.isArray(node.epoch)) {
            const idx = node.epoch.findIndex(function (e) { return e.epochName === epochName; });
            if (idx < 0) return node;
            const entry = node.epoch[idx];
            const nextEntry = node.epoch[idx + 1];
            const endFlat = endNode.radius !== undefined || endNode.fillColor ? endNode : null;
            if (endFlat) {
                const interp = {};
                for (const k in entry) interp[k] = entry[k];
                if (t >= 1 && nextEntry) {
                    for (const k in nextEntry) interp[k] = nextEntry[k];
                } else {
                    if (typeof endFlat.radius === 'number') interp.radius = interpolateNum(entry.radius, endFlat.radius, t);
                    if (typeof endFlat.radiusExobase === 'number') interp.radiusExobase = interpolateNum(entry.radiusExobase, endFlat.radiusExobase, t);
                    if (endFlat.fillColor != null) interp.fillColor = interpolateColor(entry.fillColor || '', endFlat.fillColor, t);
                    if (endFlat.strokeColor != null) interp.strokeColor = interpolateColor(entry.strokeColor || '', endFlat.strokeColor, t);
                }
                return { ...node, epoch: node.epoch.map(function (e) { return e.epochName === epochName ? interp : e; }) };
            }
        }
        if (node.radiation && Array.isArray(node.radiation) && endNode.radiation) {
            const idx = node.radiation.findIndex(function (r) { return r.epochName === epochName; });
            if (idx < 0) return node;
            const entry = node.radiation[idx];
            const nextEntry = node.radiation[idx + 1];
            const endR = endNode.radiation;
            const interp = { ...entry };
            if (t >= 1 && nextEntry) {
                for (const k in nextEntry) interp[k] = nextEntry[k];
            } else {
                if (typeof endR.numCircles === 'number') interp.numCircles = Math.round(interpolateNum(entry.numCircles, endR.numCircles, t));
                if (typeof endR.maxRadius === 'number') interp.maxRadius = interpolateNum(entry.maxRadius, endR.maxRadius, t);
            }
            return { ...node, radiation: node.radiation.map(function (r) { return r.epochName === epochName ? interp : r; }) };
        }
        return node;
    });
    return out;
}

// Exposer la configuration globalement pour accès depuis main.js
// Note: timeline est chargée depuis API_BILAN/config/configTimeline.js
window.configOrganigramme = {
    nodes, arcs, TEXTURES_THREEJS, baryEpochs, getEffectiveNodesConfig
};
// La timeline sera ajoutée par loader_panels initAfterLoad (configOrganigramme.timeline = TIMELINE.map(...))
// [0] organigramme : init DATA['📜'] / currentEpochName AVANT build (setEpoch ouvre seul le groupe [1] config)
if (window.DATA && window.TIMELINE && window.TIMELINE.length) {
    var firstEpoch = window.TIMELINE[0];
    var firstId = firstEpoch['📅'];
    if (!window.DATA['📜']) window.DATA['📜'] = {};
    window.DATA['📜']['🗿'] = firstId;
    window.DATA['📜']['👉'] = 0;
    window.DATA['📜']['🔘🕰'] = '';
    window.DATA['📜']['📿☄️'] = 0;    // compteur dédié bouton ☄️ (init à 0)
    window.DATA['📜']['📿💫'] = 0;    // compteur dédié bouton 💫 (init à 0)
    window.DATA['📜']['🔺⚖️💧'] = 0;   // eau cumulée des météorites de l'époque (CLICS.jouer)
    window.RUNTIME_STATE.currentEpochName = firstId === '⚫' ? 'Corps Noir' : (window.CHARS_DESC && window.CHARS_DESC[firstId]) || firstId;
    // [0] = init DATA['📜'] ; fermer le groupe tout de suite (sinon tout console.log jusqu'au setEpoch s'affiche dans [0])
    if (window._logStep) {
        window._logStep('[0] organigramme 📜 init ' + firstId);
        console.log('[0] currentEpochName=', window.RUNTIME_STATE.currentEpochName);
        if (window._logStepEnd) window._logStepEnd();
    } else if (typeof console !== 'undefined' && console.debug) {
        console.debug('[configOrganigramme] 📜 init', firstId);
    }
}
