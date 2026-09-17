/* File: timeline.js - Gestion de la timeline et de l'horloge
 * Desc: En français, dans l'architecture, je suis le module de gestion de la timeline
 * Version 1.0.29
 * Date: 2026-09-17
* logs :
 * - v1.0.29: timelineYearsToMa(years, isForward) remplace timelineDeltaYearsToStartMa — années calendaires (🛖🚂📱, libellés
 *   −10000/1800/2000/2100) → +y/1e6 : échelle monotone. Avant, 1800/2000 CE étaient lus « avant présent » → Holocène +8000 ans
 *   (an −2000) affiché sur 2000, puis curseur qui remontait à 1800 au passage 🚂.
 * - v1.0.28: updateTimeline — fin d'époque : appel direct tryEpochEndSkipAfterEvent (verrou déplacé dans events.js, relâché par setEpoch).
 * - v1.0.27: animateTimelineCursorToEpoch — callback direct si le curseur est déjà sur la cible (fin d'époque atteinte par événements,
 *   ex. ☄️ Hadéen → −4000 Ma : updateTimeline a déjà placé le curseur sur ▶ Archéen → pas de transitionend → SKIP bloqué) + filet setTimeout.
 * - v1.0.26: getTimelineCurrentYears — Number(▶/◀/infoTimeMa) avant arithmétique (évite concat chaîne « -10000 »+8000 → an 2000 CE / mauvais fonds).
 * - v1.0.25: curseur frise = getTimelineCurrentMa() (aligné getTimelineCurrentYears / texture). L’ancien
 *   startMa ± infoTimeMa pour forward est faux si ▶ < 0 (🛖 Holocène −10⁴ a) → barre figée en haut, PNG suit pourtant la date.
 * - v1.0.24: window.getTimelineCurrentYears — même date que le curseur pour getPlanetTexturePathFromEpoch (évite 00000Ma.png en fin 🦣 / 🛖 via event).
 * - v1.0.23: effectiveTimelineEndSlackMa — slack 0,05 Ma trop grand pour époques CE (dur ~1e−4 Ma) → faux SKIP immédiat vers 📱 ; min(0,05, dur×1%).
 * - v1.0.22: window.togglePlotAnim défini ici (source unique) — pages sans loader_panels (ex. scie_compute.html) ; fallback setEpoch / window.selectEpoch.
 * - v1.0.21: ▶ négatif (🛖 −10⁴ a BP) — timelineDeltaYearsToStartMa ; parseTimelineDateText accepte libellés « −10000 » (Ma curseur).
 * - v1.0.20: updateEpochActions depuis updateTimeline seulement si configOrganigramme.timeline est déjà fusionné (initAfterLoad) — évite race rAF avant loader_panels.
 * - v1.0.19: fin d'époque — slack TIMELINE_END_SLACK_MA (arrondi + float) ; SKIP via tryEpochEndSkipAfterEvent dans updateTimeline (latch) si date ≥ fin sans clic.
 * - v1.0.18: TIMELINE_EPOCH_BOUNDS + getCurrentEpochDurationMa + isPastCurrentEpochEndMa (date frise vs ◀) ; refresh au début de updateTimeline ; export getEpochAtTimelineIndex.
 * - v1.0.17: updateEpochActions — clé de rafraîchissement inclut 🕰.order (TIMELINE) quand défini, sinon getActionForDate.
 * - v1.0.16: getEpochAtTimelineIndex — évite crash epoch undefined (▶) si 👉 hors TIMELINE ou état transitoire (scie_compute)
 * - v1.0.1: synthèse température = nom époque + info-time (ex. Hadéen +0 Ma)
 * - v1.0.2: dates négatives avec signe - (info-time et epoch-start en -X Ma)
 * - v1.0.3: échelle d’époque construite depuis TIMELINE ; curseurs > .. < positionnés par calcul (alignés y0 sur zone texte)
 * - v1.0.4: calcul Y des curseurs via getBoundingClientRect ; conteneur d’échelle étiré sur toute la frise
 * - v1.0.5: logs de géométrie pour -5000 Ma, 2050 et curseurs ; retour à un espacement fixe du conteneur
 * - v1.0.6: logs de diagnostic ajoutés avant calcul pour identifier l’étape qui bloque la frise
 * - v1.0.7: lecture des dates réelles de la frise sans effacer les boutons epoch-btn
 * - v1.0.8: padding 10px conteneur ; curseurs alignés sur centre du texte (.epoch-date) au lieu de la div
 * - v1.0.9: const DATA = DATA, const TIMELINE = TIMELINE en tête des fonctions (cf window_MAJUSCULE_creater_filler.txt)
 * - v1.0.10: fix crash _ticCfg undefined (findIndex=-1 ou clé 🔘🕰 absente de 🕰)
 * - v1.0.11: info-time en (+N ans) pour époques récentes (▶<1e6), sinon (+X Ma)
 * - v1.0.12: animation curseur timeline vers époque suivante (main action 🎞) : getTimelineCursorTopForEpochIndex, animateTimelineCursorToEpoch
 * - v1.0.13: garde updateEpochActions si events.js pas encore chargé
 * - v1.0.14: pdOnce → pdTrace(fn,file,msg) ; diagnostic timeline sans erreur factice (scie sans .visu_epochs-container)
 * - v1.0.15: PALEOMAP (#cell-credits-paleomap) visible seulement si date courante ∈ [−750, −2] Ma (0 Ma exclu)
 * Copyright 2025 DNAvatar.org - Arnaud Maignan
 * Licensed under Apache License 2.0 with Commons Clause.
* See https://commonsclause.com/ for full terms.
* Ā unit : non Aristotelicisme via UTF8.
* "La carte c'est le territoire, le territoire c'est le code."
* UTF8 est la sémantique pour CODE & UI
* Ā unit : non Aristotelicisme via UTF8.
* "La carte c'est le territoire, le territoire c'est le code."
* UTF8 est la sémantique pour CODE & UI
* Ā unit : non Aristotelicisme via UTF8.
* "La carte c'est le territoire, le territoire c'est le code."
* UTF8 est la sémantique pour CODE & UI
 *   - Initial version: extraction du code timeline depuis main.js
 */

// ============================================================================
// HORLOGE / TIMELINE — pas de const DATA/TIMELINE ici (évite redeclaration avec main.js)
// ============================================================================
let timelineFrame = 0; // Nombre de frames écoulées
const YEARS_PER_FRAME = 10; // 1 frame = 10 ans (tic automatique toutes les secondes = +10 ans)
// Note : Pour les sources industrielles ou volcaniques, on peut espérer un étalement dans le temps
let timelineRunning = true; // État de l'horloge (activée - tics automatiques de +10 ans/seconde)
let timelineLastUpdate = performance.now();
const TIMELINE_UPDATE_INTERVAL = 1000; // Mise à jour toutes les 1000ms (1 seconde = 10 ans) - UNIQUEMENT si pas de calcul en cours
let currentEpochStartYears = null; // Stocker le début de l'époque actuelle pour calculer le delta

// Variable globale pour le temps écoulé dans l'époque (commence toujours à 0 Ma)
window.infoTimeMa = 0; // Temps écoulé depuis le début de l'époque (en millions d'années, Ma)

/**
 * Années config → Ma frise (échelle MONOTONE). Deux conventions selon le sens de l'époque :
 *  - géologique (▶ > ◀) : années AVANT présent (positives) → −y/1e6 (ex. 🦣 ◀ 10 000 → −0,01 Ma) ;
 *  - forward (▶ < ◀, 🛖 🚂 📱) : années CALENDAIRES signées → +y/1e6 (−10000 → −0,01 ; 1800 → +0,0018 ; 2100 → +0,0021).
 * Avant : le signe seul décidait → 1800/2000 CE lus « avant présent » (−0,0018/−0,002) : échelle non monotone et
 * l'an −2000 (Holocène +8000 ans) tombait sur la position de 2000 CE.
 */
function timelineYearsToMa(years, isForward) {
    if (years == null || !Number.isFinite(years)) return NaN;
    return isForward ? years / 1e6 : -(years / 1e6);
}
function timelineEpochIsForward(epoch) {
    return Number(epoch['▶']) < Number(epoch['◀']);
}
// textureIndex = infoTimeMa / 50 (calculé automatiquement, chaque texture = 50Ma)
// Accessible via window.textureIndex ou via epochConfig.lightDistance pour Hadéen

// Variables de tracking pour détecter les changements
window.lastTicTime = undefined; // Dernière valeur de ticTime (infoTimeMa / 50)
window.lastIceLevel = undefined; // Dernière valeur de h2oIceFractionFromCalculation

/** Décalage vertical (px) des curseurs ⏵ ⏴ : positif = descendre, négatif = monter. À ajuster à l’œil. */
const TIMELINE_CURSOR_OFFSET_PX = 2;

if (typeof window.pdTrace === 'undefined') {
    window.pdTrace = function (fn, file, msg) {
        console.log('🔍 [' + fn + '][' + file + '] ' + msg);
    };
}
if (typeof window.pd === 'undefined') {
    window.pd = function (fn, file, msg) {
        console.error('❌ [' + fn + '][' + file + '] ' + msg);
    };
}

/** Log diagnostic une fois par clé (pdTrace, pas pd — ce n’est pas une erreur). */
function pdOnce(key, fn, file, msg) {
    if (!window._pdOnceFlags) {
        window._pdOnceFlags = {};
    }
    if (!window._pdOnceFlags[key]) {
        window._pdOnceFlags[key] = true;
        if (typeof window.pdTrace === 'function') window.pdTrace(fn, file, msg);
    }
}

/** TIMELINE[DATA['📜']['👉']] si index valide ; sinon null (pas de lecture ▶ sur undefined). */
function getEpochAtTimelineIndex() {
    const DATA = window.DATA;
    const TIMELINE = window.TIMELINE;
    if (!DATA || !DATA['📜'] || !TIMELINE || !TIMELINE.length) return null;
    const idx = DATA['📜']['👉'];
    if (idx == null || idx < 0 || idx >= TIMELINE.length) return null;
    const epoch = TIMELINE[idx];
    return epoch || null;
}

/** Même convention que updateTimeline (curseur frise) : Ma négatifs, ▶ en années (config), infoTimeMa en Ma. */
function getTimelineCurrentYears() {
    const epoch = getEpochAtTimelineIndex();
    if (!epoch || epoch['▶'] == null) return null;
    const startY = Number(epoch['▶']);
    if (!Number.isFinite(startY)) return null;
    const endY = epoch['◀'] != null ? Number(epoch['◀']) : NaN;
    const isForwardEpoch =
        Number.isFinite(endY) && startY < endY;
    const rawInfo = window.infoTimeMa;
    const infoTimeMa = Number(rawInfo);
    const infoSafe = Number.isFinite(infoTimeMa) ? infoTimeMa : 0;
    const elapsedYears = infoSafe * 1e6;
    const cy = isForwardEpoch ? startY + elapsedYears : startY - elapsedYears;
    return Number.isFinite(cy) ? cy : null;
}

window.getTimelineCurrentYears = getTimelineCurrentYears;

/** Même convention que updateTimeline (curseur frise) : Ma négatifs, ▶/◀ en années (config), infoTimeMa en Ma. */
function getTimelineCurrentMa() {
    const currentYears = getTimelineCurrentYears();
    if (currentYears == null || !Number.isFinite(currentYears)) return null;
    return timelineYearsToMa(currentYears, timelineEpochIsForward(getEpochAtTimelineIndex()));
}

/** Tolérance Ma max : géologique long ; pour durées courtes (CE) voir effectiveTimelineEndSlackMa. */
const TIMELINE_END_SLACK_MA = 0.05;

/**
 * Slack comparé à la durée d'époque : 0,05 Ma OK si dur ≫ 0,05 ; sinon cap à 1 % de dur (évite « fin d'époque » toujours vraie sur 🚂/📱).
 */
function effectiveTimelineEndSlackMa(durMa) {
    if (durMa == null || !Number.isFinite(durMa) || durMa <= 0) return TIMELINE_END_SLACK_MA;
    return Math.min(TIMELINE_END_SLACK_MA, durMa * 0.01);
}

/** Durée |▶−◀| en Ma pour l'époque sous 👉 (toutes conventions ▶/◀). */
function getCurrentEpochDurationMa() {
    const epoch = getEpochAtTimelineIndex();
    if (!epoch || epoch['▶'] == null || epoch['◀'] == null) return null;
    return Math.abs(epoch['◀'] - epoch['▶']) / 1e6;
}

/** Liste des bornes par entrée TIMELINE (chargement / chaque updateTimeline) — comparaison avec getTimelineCurrentMa(). */
function refreshTimelineEpochBounds() {
    const TIMELINE = window.TIMELINE;
    if (!TIMELINE || !TIMELINE.length) {
        window.TIMELINE_EPOCH_BOUNDS = [];
        return;
    }
    window.TIMELINE_EPOCH_BOUNDS = TIMELINE.map(function (row, idx) {
        if (!row || row['📅'] == null || row['▶'] == null || row['◀'] == null) return null;
        const forward = timelineEpochIsForward(row);
        const startMa = timelineYearsToMa(row['▶'], forward);
        const endMa = timelineYearsToMa(row['◀'], forward);
        return { idx: idx, id: row['📅'], startMa: startMa, endMa: endMa, forward: forward };
    }).filter(Boolean);
}

/**
 * Date courante frise au-delà de la fin d'époque (◀) : même règle que le curseur (forward vs géologique).
 * Géologique : test aussi infoTimeMa ≥ dur − slack (sinon « +500 Ma » à l’écran mais pas encore fin au test Ma strict).
 */
function isPastCurrentEpochEndMa() {
    const epoch = getEpochAtTimelineIndex();
    if (!epoch || epoch['▶'] == null || epoch['◀'] == null) {
        return false;
    }
    const forward = epoch['▶'] < epoch['◀'];
    const dur = getCurrentEpochDurationMa();
    const slack = effectiveTimelineEndSlackMa(dur != null && Number.isFinite(dur) ? dur : null);
    const infoTimeMa = typeof window.infoTimeMa === 'number' ? window.infoTimeMa : 0;
    if (!forward && dur != null && Number.isFinite(dur) && infoTimeMa >= dur - slack) {
        return true;
    }
    const currentYears = getTimelineCurrentYears();
    if (currentYears == null || !Number.isFinite(currentYears)) {
        return false;
    }
    if (forward) {
        return currentYears >= epoch['◀'] - (slack * 1e6);
    }
    return currentYears <= epoch['◀'] + (slack * 1e6);
}

const PALEOMAP_CREDITS_MIN_MA = -750;
const PALEOMAP_CREDITS_MAX_MA = -2;

function updatePaleomapCreditsVisibility() {
    const cell = document.getElementById('cell-credits-paleomap');
    if (!cell) return;
    const ma = getTimelineCurrentMa();
    if (ma == null || !Number.isFinite(ma)) {
        cell.style.display = 'none';
        return;
    }
    const show = ma >= PALEOMAP_CREDITS_MIN_MA && ma <= PALEOMAP_CREDITS_MAX_MA;
    cell.style.display = show ? '' : 'none';
}

/** Libellé d’une date de l’échelle : "-5000 Ma" ou "2025", "2050" pour les années récentes */
function formatScaleLabel(ma) {
    if (ma < -0.0005) {
        return Math.round(ma) + ' Ma';
    }
    return String(Math.round(ma * 1e6));
}

function ensureTimelineCursor(container, id, symbol) {
    let cursor = document.getElementById(id);
    if (!cursor) {
        cursor = document.createElement('span');
        cursor.id = id;
        cursor.className = 'timeline-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.textContent = symbol;
        container.insertBefore(cursor, container.firstChild);
    } else if (cursor.parentNode === container && cursor !== container.firstChild) {
        container.insertBefore(cursor, container.firstChild);
    }
    return cursor;
}

function parseTimelineDateText(text) {
    const trimmed = text.trim();
    if (trimmed.endsWith('Ma')) {
        return Number(trimmed.replace('Ma', '').trim());
    }
    // Libellé sans « Ma » = année calendaire signée (−10000, 1800, 2000, 2100) → même règle que timelineYearsToMa forward
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return NaN;
    return timelineYearsToMa(n, true);
}

function getTimelineDateEntries(container) {
    const dateSpans = container.querySelectorAll('.epoch-date-item-vertical .epoch-date');
    const entries = [];
    for (let i = 0; i < dateSpans.length; i++) {
        const span = dateSpans[i];
        const item = span.closest('.epoch-date-item-vertical');
        const text = span.textContent.trim();
        const ma = parseTimelineDateText(text);
        entries.push({
            item: item,
            span: span,
            text: text,
            ma: ma,
        });
    }
    return entries;
}

/** Prépare la frise existante : conserve les boutons, enlève seulement nos anciennes lignes de debug, et garantit les curseurs. */
function buildEpochScale() {
    const TIMELINE = window.TIMELINE;
    const container = document.querySelector('.visu_epochs-container');
    if (!container || !TIMELINE) {
        pdOnce(
            'timeline-build-missing',
            'buildEpochScale',
            'timeline.js',
            'missing container=' + !!container + ' timeline=' + !!TIMELINE
        );
        return;
    }
    const oldScaleRows = container.querySelectorAll('.epoch-scale-row');
    for (let i = 0; i < oldScaleRows.length; i++) {
        oldScaleRows[i].remove();
    }
    ensureTimelineCursor(container, 'timeline-cursor', '⏵ ———— ⏴');
    const entries = getTimelineDateEntries(container);
    window._epochScaleBuilt = true;
}

/** Position Y (px) du centre du texte, relatif au padding-edge du conteneur. rows = .epoch-date (span).
 * Échelle monotone croissante, fin = 2100 (+0.0021). Quand currentMa tombe sur un point (ex. 2000 = +0.002),
 * on prend le segment le plus récent qui le contient (ex. [2000,2100]) pour que le curseur soit sur la bonne ligne. */
function getCursorTopPx(container, rows, scaleMa, currentMa) {
    const containerRect = container.getBoundingClientRect();
    const paddingTop = parseFloat(getComputedStyle(container).paddingTop) || 0;

    function toPaddingTop(rect) {
        return (rect.top - containerRect.top) + rect.height / 2 - paddingTop;
    }

    // Échelle : scaleMa[0] = plus ancien (-5000), scaleMa[last] = plus récent (+0.0021 = 2100). Monotone croissante (timelineYearsToMa).
    if (currentMa <= scaleMa[0]) {
        return toPaddingTop(rows[0].getBoundingClientRect());
    }
    // Dernière ligne uniquement quand on est exactement sur la fin (2100). Pas "currentMa <= scaleMa[last]" : ça serait vrai pour -4500 aussi.
    const lastMa = scaleMa[scaleMa.length - 1];
    if (Math.abs(currentMa - lastMa) < 1e-9) {
        return toPaddingTop(rows[rows.length - 1].getBoundingClientRect());
    }

    // Parcourir de la fin vers le début : sur une borne (ex. 2000) on prend [2000,2100] → curseur sur 2000
    let i = scaleMa.length - 2;
    for (; i >= 0; i--) {
        const maMin = Math.min(scaleMa[i], scaleMa[i + 1]);
        const maMax = Math.max(scaleMa[i], scaleMa[i + 1]);
        if (currentMa >= maMin && currentMa <= maMax) {
            break;
        }
    }
    if (i < 0) {
        i = 0;
    }

    const r0 = rows[i].getBoundingClientRect();
    const r1 = rows[i + 1].getBoundingClientRect();
    const ma0 = scaleMa[i];
    const ma1 = scaleMa[i + 1];
    const t = (ma1 === ma0) ? 0 : (currentMa - ma0) / (ma1 - ma0);
    const center0 = toPaddingTop(r0);
    const center1 = toPaddingTop(r1);
    return center0 + t * (center1 - center0);
}

function logTimelineGeometry() {
    // Log désactivé (était frise/container/cursor positions)
    return;
}

/** Retourne la position top (px) du curseur pour le début de l'époque à l'index donné (sans changer DATA). */
function getTimelineCursorTopForEpochIndex(epochIdx) {
    const TIMELINE = window.TIMELINE;
    const container = document.querySelector('.visu_epochs-container');
    if (!container || !TIMELINE || epochIdx < 0 || epochIdx >= TIMELINE.length) return null;
    const epoch = TIMELINE[epochIdx];
    if (!epoch || epoch['📅'] == null) return null;
    const entries = getTimelineDateEntries(container);
    if (!entries.length) return null;
    const scaleMa = [];
    const textRows = [];
    for (let r = 0; r < entries.length; r++) {
        scaleMa.push(entries[r].ma);
        textRows.push(entries[r].span);
    }
    const startMa = timelineYearsToMa(epoch['▶'], timelineEpochIsForward(epoch));
    return getCursorTopPx(container, textRows, scaleMa, startMa) + TIMELINE_CURSOR_OFFSET_PX;
}

/** Anime le curseur de la timeline vers l'époque à l'index donné, puis appelle callback (synchrone à la fin de l'animation). */
window.animateTimelineCursorToEpoch = function (epochIdx, durationMs, callback) {
    const targetTop = getTimelineCursorTopForEpochIndex(epochIdx);
    const cursor = document.getElementById('timeline-cursor');
    if (targetTop == null || !cursor) {
        if (typeof callback === 'function') callback();
        return;
    }
    // Curseur déjà sur la cible (fin d'époque atteinte par événements : ◀ courant = ▶ suivant) :
    // aucune transition CSS → pas de transitionend → setEpoch jamais appelé + _timelineCursorAnimating bloqué à true.
    const currentTop = parseFloat(cursor.style.top);
    if (Number.isFinite(currentTop) && Math.abs(currentTop - targetTop) < 0.5) {
        cursor.style.setProperty('top', targetTop + 'px');
        cursor.setAttribute('data-timeline-top', String(Math.round(targetTop)));
        if (typeof callback === 'function') callback();
        return;
    }
    const duration = durationMs > 0 ? durationMs : 400;
    window._timelineCursorAnimating = true;
    cursor.style.transition = 'top ' + (duration / 1000) + 's ease-out';
    cursor.style.setProperty('top', targetTop + 'px');
    cursor.setAttribute('data-timeline-top', String(Math.round(targetTop)));
    let done = false;
    let fallbackTimer = null;
    const onEnd = function () {
        if (done) return;
        done = true;
        clearTimeout(fallbackTimer);
        cursor.removeEventListener('transitionend', onEnd);
        cursor.style.transition = '';
        window._timelineCursorAnimating = false;
        if (typeof callback === 'function') callback();
    };
    cursor.addEventListener('transitionend', onEnd);
    // transitionend non garanti (onglet masqué, curseur caché, top non animable) → filet après la durée prévue.
    fallbackTimer = setTimeout(onEnd, duration + 150);
};

function updateTimeline() {
    const DATA = window.DATA;
    const TIMELINE = window.TIMELINE;
    refreshTimelineEpochBounds();
    // Mettre à jour l'affichage (toujours, même si timelineRunning = false)
    const timelineDisplay = document.getElementById('timeline-display');
    const frameDisplay = document.getElementById('frame-display');
    const infoTimeDisplay = document.getElementById('info-time');

    const years = timelineFrame * YEARS_PER_FRAME;

    // Formater les années avec M (Mega) et M̅ (Milliard avec barre)
    const formattedYears = formatYears(years);

    if (timelineDisplay) {
        timelineDisplay.innerHTML = `<span class="timeline-hourglass">📅</span> ${formattedYears}`;
    }

    if (frameDisplay) {
        frameDisplay.textContent = timelineFrame.toString();
    }

    // Mettre à jour l'horloge dans la zone horloge
    // Échelle adaptée : en 1800/2100 afficher (+N ans), sinon (+X Ma)
    if (infoTimeDisplay) {
        const infoTimeMa = window.infoTimeMa;
        const epoch = getEpochAtTimelineIndex();
        const isRecentEpoch = epoch && typeof epoch['▶'] === 'number' && epoch['▶'] < 1e6;
        let newText;
        if (isRecentEpoch) {
            const years = Math.round(infoTimeMa * 1e6);
            newText = '+' + years + ' ans';
        } else {
            const deltaMa = Math.abs(infoTimeMa).toFixed(1).replace(/\.?0+$/, '');
            newText = '+' + deltaMa + ' Ma';
        }
        if (infoTimeDisplay.textContent !== newText) {
            infoTimeDisplay.textContent = newText;
        }
    }

    // Curseurs ⏴ ⏵ : même div que les dates d’époque, positionnement par calcul (y0 aligné sur la zone texte)
    const cursor = document.getElementById('timeline-cursor');
    const container = document.querySelector('.visu_epochs-container');
    if (!container || !window.DATA['📜'] || !window.TIMELINE) {
        pdOnce(
            'timeline-update-missing',
            'updateTimeline',
            'timeline.js',
            'missing container=' + !!container + ' data=' + !!window.DATA['📜'] + ' timeline=' + !!window.TIMELINE
        );
    } else {
        if (!window._epochScaleBuilt || !cursor) {
            buildEpochScale();
        }
        const cursor2 = document.getElementById('timeline-cursor');
        const entries = getTimelineDateEntries(container);
        if (!cursor2) {
            pdOnce('timeline-cursors-still-missing', 'updateTimeline', 'timeline.js', 'cursor still missing after build');
        } else if (entries.length === 0) {
            pdOnce('timeline-rows-empty', 'updateTimeline', 'timeline.js', 'rows.length=0');
        } else {
            const scaleMa = [];
            const textRows = [];
            const scaleTexts = [];
            for (let r = 0; r < entries.length; r++) {
                scaleMa.push(entries[r].ma);
                textRows.push(entries[r].span);
                scaleTexts.push(entries[r].text);
            }
            const idx = DATA['📜']['👉'];
            const epoch = getEpochAtTimelineIndex();
            if (!epoch) {
                pdOnce('timeline-epoch-missing-cursor', 'updateTimeline', 'timeline.js',
                    'TIMELINE[' + String(idx) + '] absent ou 👉 hors plage (len=' + String(TIMELINE.length) + ')');
            } else {
                const startMa = timelineYearsToMa(epoch['▶'], timelineEpochIsForward(epoch));
                const currentMa = getTimelineCurrentMa();
                if (currentMa == null || !Number.isFinite(currentMa)) {
                    pdOnce('timeline-cursor-current-ma-null', 'updateTimeline', 'timeline.js',
                        'getTimelineCurrentMa invalide epoch=' + String(epoch['📅']));
                } else {
                    const topPx = getCursorTopPx(container, textRows, scaleMa, currentMa) + TIMELINE_CURSOR_OFFSET_PX;
                    if (!window._timelineCursorAnimating) {
                        cursor2.style.setProperty('top', topPx + 'px');
                        cursor2.setAttribute('data-timeline-top', String(Math.round(topPx)));
                    }
                    logTimelineGeometry();
                    const epochId = epoch['📅'];
                    const epochStartYears = epoch['▶'];
                    if (epochId === '📱' || epochId === '🚂' || (typeof epochStartYears === 'number' && epochStartYears >= 1800)) {
                        if (!window._lastCursorDebug || window._lastCursorDebug !== epochStartYears) {
                            window._lastCursorDebug = epochStartYears;
                            if (typeof window.pdTrace === 'function') {
                                window.pdTrace('curseurs', 'timeline.js',
                                    'epochId=' + epochId + ' epochStartYears(▶)=' + epochStartYears +
                                    ' startMa=' + startMa.toFixed(6) + ' currentMa=' + currentMa.toFixed(6) +
                                    ' scaleMa[0]=' + scaleMa[0].toFixed(6) + ' scaleMa[last]=' + scaleMa[scaleMa.length - 1].toFixed(6) +
                                    ' scaleTexts=' + scaleTexts.join(',') + ' topPx=' + topPx.toFixed(1) + ' idx=' + idx);
                            }
                        }
                    } else {
                        window._lastCursorDebug = null;
                    }
                }
            }
        }
    }

    // textureIndex = infoTimeMa / stepMa — stepMa lu depuis la config du bouton cliqué (fallback si époque sans 🕰[ticKey], ex. Corps noir + 💫)
    if (window.DATA['📜']['🔘🕰'] === '') {
        window.textureIndex = 0;
    } else {
        const _epochId_tl = window.DATA['📜']['🗿'];
        const _idx_tl = window.TIMELINE.findIndex(item => item['📅'] === _epochId_tl);
        const _epoch_tl = _idx_tl >= 0 ? window.TIMELINE[_idx_tl] : null;
        const _ticKey = window.DATA['📜']['🔘🕰'];
        const _ticCfg = _epoch_tl && _epoch_tl['🕰'] && _epoch_tl['🕰'][_ticKey];
        const stepMa = _ticCfg && typeof _ticCfg['🔺⏳'] === 'number' ? _ticCfg['🔺⏳'] : 100;
        window.textureIndex = stepMa > 0 ? Math.floor(window.infoTimeMa / stepMa) : 0;
    }

    const currentTicTime = window.textureIndex;
    const currentIceLevel = window.RUNTIME_STATE.h2oIceFractionFromCalculation;

    window.isTextChange = (window.lastTicTime !== undefined && window.lastTicTime !== currentTicTime);
    if (window.isTextChange || window.lastTicTime === undefined) {
        window.lastTicTime = currentTicTime;
    }

    window.isIceChange = (window.lastIceLevel !== undefined && Math.abs(window.lastIceLevel - currentIceLevel) > 0.001);
    if (window.isIceChange || window.lastIceLevel === undefined) {
        window.lastIceLevel = currentIceLevel;
    }

    if (window.isTextChange) {
        window.updateHadeenTexture();
    } else if (window.isIceChange) {
        window.updatePlanetLighting();
    }
    window.updatePlanetTextureFromDate && window.updatePlanetTextureFromDate();

    // Mettre à jour les boutons ACTION : 🕰.order (TIMELINE) si présent, sinon date → getActionForDate (organigramme).
    const epochAct = getEpochAtTimelineIndex();
    const cfgOrg = window.configOrganigramme;
    // Prérequis updateEpochActions : configOrganigramme.timeline = TIMELINE.map(...) vient de loader_panels initAfterLoad (pas encore au 1er tick rAF).
    if (epochAct && cfgOrg && cfgOrg.timeline) {
        const wh = epochAct['🕰'];
        let sig;
        if (wh && Array.isArray(wh.order) && wh.order.length) {
            sig = (epochAct['📅'] || '') + '|' + wh.order.join(',');
        } else {
            const actionKey = cfgOrg.getActionForDate(epochAct['▶'], window.infoTimeMa) || '💫';
            sig = (epochAct['📅'] || '') + '|' + actionKey;
        }
        if (window._lastEpochActionKey !== sig) {
            window._lastEpochActionKey = sig;
            if (typeof window.updateEpochActions === 'function') {
                window.updateEpochActions();
            }
        }
    }

    updatePaleomapCreditsVisibility();

    // Frise à la fin d'époque (◀) : même SKIP que les événements — évite d'exiger un clic alors que l'UI affiche déjà +durée Ma.
    if (window.tryEpochEndSkipAfterEvent && window.isPastCurrentEpochEndMa) {
        // Verrou « une transition par fin d'époque » géré dans tryEpochEndSkipAfterEvent (events.js v1.2.32).
        if (window.isPastCurrentEpochEndMa()) window.tryEpochEndSkipAfterEvent(null);
    }

    // 🔒 DÉSACTIVÉ : Ne plus incrémenter automatiquement de +10 ans toutes les secondes
    // L'incrémentation se fait uniquement lors des clics sur boutons (météorite glace, etc.)
    // if (timelineRunning && !calculationInProgress) {
    //     const currentTime = performance.now();
    //     const elapsed = currentTime - timelineLastUpdate;
    //
    //     // Incrémenter les frames selon l'intervalle (1 seconde = 10 ans)
    //     if (elapsed >= TIMELINE_UPDATE_INTERVAL) {
    //         timelineFrame++;
    //         timelineLastUpdate = currentTime;
    //         const years = timelineFrame * YEARS_PER_FRAME;
    //         // Mettre à jour l'affichage immédiatement après l'incrémentation
    //         const formattedYears = formatYears(years);
    //         if (timelineDisplay) timelineDisplay.innerHTML = `<span class="timeline-hourglass">📅</span> ${formattedYears}`;
    //         if (frameDisplay) frameDisplay.textContent = timelineFrame.toString();
    //         // Afficher le delta depuis le début de l'époque en dizaines d'années uniquement
    //         if (infoTimeDisplay && currentEpochStartYears !== null) {
    //             const deltaYears = years - currentEpochStartYears;
    //             const deltaInTens = Math.floor(deltaYears / 10) * 10; // Arrondir à la dizaine
    //             const newText = deltaInTens > 0 ? `+${deltaInTens} ans` : '+0 ans';
    //             // Ne modifier le texte que s'il a changé pour éviter le clignotement
    //             if (infoTimeDisplay.textContent !== newText) {
    //                 infoTimeDisplay.textContent = newText;
    //             }
    //         }
    //     }
    // }
    // Si calculationInProgress = true, on ne fait rien (pas d'incrémentation, pas de mise à jour de timelineLastUpdate)
    // pour que le tic reprenne immédiatement après la fin du calcul

    requestAnimationFrame(updateTimeline);
}

// Fonction pour formater les années avec Ma (millions d'années)
// Format : -4500 Ma (exemple : -4500 millions d'années)
// Les valeurs positives sont considérées comme des dates dans le passé (affichées avec "-")
function formatYears(years) {
    if (years === 0) {
        return '0 ans';
    }
    const absYears = Math.abs(years);
    // Années récentes (< 10 000) : afficher comme année (ex. 2025, 1800)
    if (absYears < 10000) {
        return String(Math.round(absYears));
    }
    // Convertir en millions d'années
    const millions = absYears / 1e6;
    // Si >= 1 million, afficher en Ma
    if (millions >= 1) {
        const sign = years < 0 ? '-' : '';
        const millionsFormatted = millions.toFixed(1).replace(/\.?0+$/, '');
        return `${sign}${millionsFormatted} Ma`;
    }
    // Sinon, afficher en milliers d'années (Ka)
    const milliers = absYears / 1e3;
    if (milliers >= 1) {
        const sign = years < 0 ? '-' : '';
        const milliersFormatted = milliers.toFixed(0);
        return `${sign}${milliersFormatted} Ka`;
    }
    return `${years < 0 ? '-' : ''}${Math.round(absYears)} ans`;
}

// Fonction pour incrémenter le temps de 10 ans (lors des clics sur boutons)
// Note : Les tics automatiques ajoutent aussi +10 ans/seconde
function incrementTimeline() {
    timelineFrame++;
    updateTimeline();
}

// Démarrer l'horloge
if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    requestAnimationFrame(updateTimeline);
}

function startTimeline() {
    timelineRunning = true;
    timelineLastUpdate = performance.now();
    updateTimeline();
}

function pauseTimeline() {
    timelineRunning = false;
}

// Exposer les variables et fonctions globalement
if (typeof window !== 'undefined') {
    // Exposer les variables pour main.js
    window.timelineFrame = timelineFrame;
    window.YEARS_PER_FRAME = YEARS_PER_FRAME;
    window.timelineRunning = timelineRunning;
    window.timelineLastUpdate = timelineLastUpdate;
    window.TIMELINE_UPDATE_INTERVAL = TIMELINE_UPDATE_INTERVAL;
    window.currentEpochStartYears = currentEpochStartYears;
    
    // Exposer les fonctions
    window.updateTimeline = updateTimeline;
    window.incrementTimeline = incrementTimeline;
    window.startTimeline = startTimeline;
    window.pauseTimeline = pauseTimeline;
    window.formatYears = formatYears;
    window.getTimelineCurrentMa = getTimelineCurrentMa;
    window.getEpochAtTimelineIndex = getEpochAtTimelineIndex;
    window.getCurrentEpochDurationMa = getCurrentEpochDurationMa;
    window.refreshTimelineEpochBounds = refreshTimelineEpochBounds;
    window.isPastCurrentEpochEndMa = isPastCurrentEpochEndMa;
    window.TIMELINE_END_SLACK_MA = TIMELINE_END_SLACK_MA;
    window.effectiveTimelineEndSlackMa = effectiveTimelineEndSlackMa;
    window.updatePaleomapCreditsVisibility = updatePaleomapCreditsVisibility;

    /** Nom display pour setEpoch / shell (CHARS_DESC / epochName). */
    function timelineNextEpochDisplayName(nextItem, nextId) {
        return nextItem.name || (typeof window.epochName === 'function' && window.epochName(nextId)) || nextId;
    }

    /**
     * 🎞 SKIP : anim on + époque suivante TIMELINE (était loader_panels seul → absent sur scie_compute / html sans index).
     * shell + syncToScie : chemins index ; sinon setEpoch ou selectEpoch (page scie doit exposer window.selectEpoch).
     */
    window.togglePlotAnim = function () {
        if (typeof window.hideTooltip === 'function') window.hideTooltip();
        window.DATA['🔘']['🔘🎞'] = true;
        var cb = document.getElementById('plot-anim-toggle-checkbox');
        if (cb) cb.checked = true;

        var applyNextEpoch = function (idx, nextName, useShell) {
            var TIMELINE = window.TIMELINE;
            var nextId = TIMELINE[idx]['📅'];
            if (typeof window.animateTimelineCursorToEpoch === 'function') {
                window.animateTimelineCursorToEpoch(idx, 400, function () {
                    if (useShell && window.shell && window.shell.setEpoch) window.shell.setEpoch(nextName);
                    else if (typeof window.setEpoch === 'function') window.setEpoch(nextName);
                    else window.selectEpoch(nextId);
                });
            } else {
                if (useShell && window.shell && window.shell.setEpoch) window.shell.setEpoch(nextName);
                else if (typeof window.setEpoch === 'function') window.setEpoch(nextName);
                else window.selectEpoch(nextId);
            }
        };

        var advanceFromTimeline = function (useShell) {
            var DATA = window.DATA;
            var TIMELINE = window.TIMELINE;
            var cur = DATA['📜']['👉'];
            if (typeof cur !== 'number') cur = 0;
            var idx = cur + 1;
            while (idx < TIMELINE.length && !TIMELINE[idx]['📅']) idx++;
            if (idx >= TIMELINE.length) idx = 0;
            while (idx < TIMELINE.length && !TIMELINE[idx]['📅']) idx++;
            var nextItem = TIMELINE[idx];
            var nextId = nextItem['📅'];
            var nextName = timelineNextEpochDisplayName(nextItem, nextId);
            applyNextEpoch(idx, nextName, useShell);
        };

        if (window.shell && window.shell.setState) {
            window.shell.setState({ animEnabled: true });
            advanceFromTimeline(true);
        } else if (typeof window.syncToScie === 'function') {
            window.syncToScie({ animEnabled: true });
            advanceFromTimeline(false);
        } else {
            advanceFromTimeline(false);
        }
    };
}

// Fonction pour réinitialiser la timeline
function resetTimeline() {
    timelineFrame = 0;
    timelineRunning = false;
    if (typeof window !== 'undefined') {
        window.infoTimeMa = 0;
        window.timelineFrame = 0;
        window.timelineRunning = false;
    }
}

// Exposer resetTimeline globalement
if (typeof window !== 'undefined') {
    window.resetTimeline = resetTimeline;
}

