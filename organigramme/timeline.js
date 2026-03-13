/* File: timeline.js - Gestion de la timeline et de l'horloge
 * Desc: En français, dans l'architecture, je suis le module de gestion de la timeline
 * Version 1.0.10
 * Date: [June 08, 2025] [HH:MM UTC+1]
* logs :
 * - v1.0.1: synthèse température = nom époque + info-time (ex. Hadéen +0 Ma)
 * - v1.0.2: dates négatives avec signe - (info-time et epoch-start en -X Ma)
 * - v1.0.3: échelle d’époque construite depuis TIMELINE ; curseurs > .. < positionnés par calcul (alignés y0 sur zone texte)
 * - v1.0.4: calcul Y des curseurs via getBoundingClientRect ; conteneur d’échelle étiré sur toute la frise
 * - v1.0.5: logs de géométrie pour -5000 Ma, 2050 et curseurs ; retour à un espacement fixe du conteneur
 * - v1.0.6: logs de diagnostic ajoutés avant calcul pour identifier l’étape qui bloque la frise
 * - v1.0.7: lecture des dates réelles de la frise sans effacer les boutons epoch-btn
 * - v1.0.8: padding 10px conteneur ; curseurs alignés sur centre du texte (.epoch-date) au lieu de la div
 * - v1.0.9: const DATA = window.DATA, const TIMELINE = window.TIMELINE en tête des fonctions (cf window_MAJUSCULE_creater_filler.txt)
 * - v1.0.10: fix crash _ticCfg undefined (findIndex=-1 ou clé 🔘🕰 absente de 🕰)
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
// HORLOGE / TIMELINE
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
// textureIndex = infoTimeMa / 50 (calculé automatiquement, chaque texture = 50Ma)
// Accessible via window.textureIndex ou via epochConfig.lightDistance pour Hadéen

// Variables de tracking pour détecter les changements
window.lastTicTime = undefined; // Dernière valeur de ticTime (infoTimeMa / 50)
window.lastIceLevel = undefined; // Dernière valeur de h2oIceFractionFromCalculation

/** Décalage vertical (px) des curseurs ⏵ ⏴ : positif = descendre, négatif = monter. À ajuster à l’œil. */
const TIMELINE_CURSOR_OFFSET_PX = 2;

if (typeof window.pd === 'undefined') {
    window.pd = function (message) {
        console.log(message);
    };
}

function pdOnce(key, message) {
    if (!window._pdOnceFlags) {
        window._pdOnceFlags = {};
    }
    if (!window._pdOnceFlags[key]) {
        window._pdOnceFlags[key] = true;
        window.pd(message);
    }
}

/** Libellé d’une date de l’échelle : "-5000 Ma" ou "2025", "2050" pour les années récentes */
function formatScaleLabel(ma) {
    if (ma < -0.0005) {
        return Math.round(ma) + ' Ma';
    }
    return String(Math.round(ma * 1e6));
}

function ensureTimelineCursor(container, id, className, symbol) {
    let cursor = document.getElementById(id);
    if (!cursor) {
        cursor = document.createElement('span');
        cursor.id = id;
        cursor.className = 'timeline-cursor ' + className;
        cursor.setAttribute('aria-hidden', 'true');
        cursor.textContent = symbol;
        container.appendChild(cursor);
        pdOnce('timeline-create-' + id, '❌ [ensureTimelineCursor][timeline.js] created ' + id);
    }
    return cursor;
}

function parseTimelineDateText(text) {
    const trimmed = text.trim();
    if (trimmed.endsWith('Ma')) {
        return Number(trimmed.replace('Ma', '').trim());
    }
    return Number(trimmed) / 1e6;
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
            '❌ [buildEpochScale][timeline.js] missing container=' + !!container +
            ' timeline=' + !!TIMELINE
        );
        return;
    }
    const oldScaleRows = container.querySelectorAll('.epoch-scale-row');
    for (let i = 0; i < oldScaleRows.length; i++) {
        oldScaleRows[i].remove();
    }
    const cursorLeft = ensureTimelineCursor(container, 'timeline-cursor-left', 'timeline-cursor-left', '⏵');
    const cursorRight = ensureTimelineCursor(container, 'timeline-cursor-right', 'timeline-cursor-right', '⏴');
    container.appendChild(cursorLeft);
    container.appendChild(cursorRight);
    const entries = getTimelineDateEntries(container);
    window._epochScaleBuilt = true;
    if (entries.length === 0) {
        pdOnce('timeline-build-empty', '❌ [buildEpochScale][timeline.js] rows=0');
    } else {
        pdOnce(
            'timeline-build-ok',
            '❌ [buildEpochScale][timeline.js] rows=' + entries.length +
            ' first=' + entries[0].text +
            ' last=' + entries[entries.length - 1].text
        );
    }
}

/** Position Y (px) du centre du texte, relatif au padding-edge du conteneur. rows = .epoch-date (span). */
function getCursorTopPx(container, rows, scaleMa, currentMa) {
    const containerRect = container.getBoundingClientRect();
    const paddingTop = parseFloat(getComputedStyle(container).paddingTop) || 0;

    function toPaddingTop(rect) {
        return (rect.top - containerRect.top) + rect.height / 2 - paddingTop;
    }

    if (currentMa <= scaleMa[0]) {
        return toPaddingTop(rows[0].getBoundingClientRect());
    }
    if (currentMa >= scaleMa[scaleMa.length - 1]) {
        return toPaddingTop(rows[rows.length - 1].getBoundingClientRect());
    }

    let i = 0;
    for (; i < scaleMa.length - 1; i++) {
        if (currentMa >= scaleMa[i] && currentMa <= scaleMa[i + 1]) {
            break;
        }
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
    const container = document.querySelector('.visu_epochs-container');
    const frise = document.querySelector('.visu_timeline-frise-with-cursors');
    const cursorLeft = document.getElementById('timeline-cursor-left');
    const cursorRight = document.getElementById('timeline-cursor-right');
    if (!container) {
        pdOnce('timeline-geometry-no-container', '❌ [logTimelineGeometry][timeline.js] missing container=false');
        return;
    }
    const entries = getTimelineDateEntries(container);
    let rowStartEntry = null;
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].text === '-5000 Ma') {
            rowStartEntry = entries[i];
            break;
        }
    }
    const rowEndEntry = entries[entries.length - 1];

    if (!frise || !rowStartEntry || !rowEndEntry || !cursorLeft || !cursorRight) {
        pdOnce(
            'timeline-geometry-missing',
            '❌ [logTimelineGeometry][timeline.js] missing container=' + !!container +
            ' frise=' + !!frise +
            ' rowStart=' + !!rowStartEntry +
            ' rowEnd=' + !!rowEndEntry +
            ' left=' + !!cursorLeft +
            ' right=' + !!cursorRight
        );
        return;
    }

    const friseRect = frise.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const rowStartRect = rowStartEntry.item.getBoundingClientRect();
    const rowStartTextRect = rowStartEntry.span.getBoundingClientRect();
    const rowEndRect = rowEndEntry.item.getBoundingClientRect();
    const rowEndTextRect = rowEndEntry.span.getBoundingClientRect();
    const cursorLeftRect = cursorLeft.getBoundingClientRect();
    const cursorRightRect = cursorRight.getBoundingClientRect();

    const message =
        '❌ [logTimelineGeometry][timeline.js] ' +
        'frise(top=' + friseRect.top.toFixed(1) + ',h=' + friseRect.height.toFixed(1) + ') ' +
        'container(top=' + containerRect.top.toFixed(1) + ',h=' + containerRect.height.toFixed(1) + ') ' +
        '-5000div(top=' + rowStartRect.top.toFixed(1) + ',h=' + rowStartRect.height.toFixed(1) + ',cy=' + (rowStartRect.top + rowStartRect.height / 2).toFixed(1) + ',rel=' + ((rowStartRect.top - containerRect.top) + rowStartRect.height / 2).toFixed(1) + ') ' +
        '-5000txt(top=' + rowStartTextRect.top.toFixed(1) + ',h=' + rowStartTextRect.height.toFixed(1) + ',cy=' + (rowStartTextRect.top + rowStartTextRect.height / 2).toFixed(1) + ') ' +
        'lastDiv(top=' + rowEndRect.top.toFixed(1) + ',h=' + rowEndRect.height.toFixed(1) + ',cy=' + (rowEndRect.top + rowEndRect.height / 2).toFixed(1) + ',txt=' + rowEndEntry.text + ') ' +
        'lastTxt(top=' + rowEndTextRect.top.toFixed(1) + ',h=' + rowEndTextRect.height.toFixed(1) + ',cy=' + (rowEndTextRect.top + rowEndTextRect.height / 2).toFixed(1) + ') ' +
        'leftCursor(top=' + cursorLeftRect.top.toFixed(1) + ',h=' + cursorLeftRect.height.toFixed(1) + ',cy=' + (cursorLeftRect.top + cursorLeftRect.height / 2).toFixed(1) + ',styleTop=' + cursorLeft.style.top + ') ' +
        'rightCursor(top=' + cursorRightRect.top.toFixed(1) + ',h=' + cursorRightRect.height.toFixed(1) + ',cy=' + (cursorRightRect.top + cursorRightRect.height / 2).toFixed(1) + ',styleTop=' + cursorRight.style.top + ')';

    if (window._timelineGeomLastMessage !== message) {
        window._timelineGeomLastMessage = message;
        window.pd(message);
    }
}

function updateTimeline() {
    const DATA = window.DATA;
    const TIMELINE = window.TIMELINE;
    // Mettre à jour l'affichage (toujours, même si timelineRunning = false)
    const timelineDisplay = document.getElementById('timeline-display');
    const frameDisplay = document.getElementById('frame-display');
    const infoTimeDisplay = document.getElementById('info-time');
    const epochNameTempDisplay = document.getElementById('epoch-name-temp');
    const currentEpoch = (typeof window !== 'undefined' && window.currentEpochName) || '';

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
    // Toujours utiliser window.infoTimeMa (commence toujours à 0 Ma)
    if (infoTimeDisplay) {
        const infoTimeMa = window.infoTimeMa;
        let newText;
        // Afficher en Ma avec signe : négatif = "-X Ma", zéro = "0 Ma", positif = "+X Ma"
        const deltaMa = Math.abs(infoTimeMa).toFixed(1).replace(/\.?0+$/, '');
        newText = '+' + deltaMa + ' Ma';
        
        // Ne modifier le texte que s'il a changé pour éviter le clignotement
        if (infoTimeDisplay.textContent !== newText) {
            infoTimeDisplay.textContent = newText;
        }
        if (epochNameTempDisplay && currentEpoch) {
            const syntheseLabel = currentEpoch + '\n' + newText;
            if (epochNameTempDisplay.textContent !== syntheseLabel) {
                epochNameTempDisplay.textContent = syntheseLabel;
            }
        }
    }

    // Curseurs ⏴ ⏵ : même div que les dates d’époque, positionnement par calcul (y0 aligné sur la zone texte)
    const cursorLeft = document.getElementById('timeline-cursor-left');
    const cursorRight = document.getElementById('timeline-cursor-right');
    const container = document.querySelector('.visu_epochs-container');
    if (!container || !DATA['📜'] || !TIMELINE) {
        pdOnce(
            'timeline-update-missing',
            '❌ [updateTimeline][timeline.js] missing container=' + !!container +
            ' data=' + !!DATA['📜'] +
            ' timeline=' + !!TIMELINE
        );
    } else {
        if (!window._epochScaleBuilt || !cursorLeft || !cursorRight) {
            buildEpochScale();
        }
        const cursorLeft2 = document.getElementById('timeline-cursor-left');
        const cursorRight2 = document.getElementById('timeline-cursor-right');
        const entries = getTimelineDateEntries(container);
        if (!cursorLeft2 || !cursorRight2) {
            pdOnce('timeline-cursors-still-missing', '❌ [updateTimeline][timeline.js] cursors still missing after build');
        } else if (entries.length === 0) {
            pdOnce('timeline-rows-empty', '❌ [updateTimeline][timeline.js] rows.length=0');
        } else {
            const scaleMa = [];
            const textRows = [];
            for (let r = 0; r < entries.length; r++) {
                scaleMa.push(entries[r].ma);
                textRows.push(entries[r].span);
            }
            const idx = DATA['📜']['👉'];
            const epoch = TIMELINE[idx];
            const startMa = -(epoch['▶'] / 1e6);
            const currentMa = startMa + window.infoTimeMa;
            const topPx = getCursorTopPx(container, textRows, scaleMa, currentMa) + TIMELINE_CURSOR_OFFSET_PX;
            cursorLeft2.style.setProperty('top', topPx + 'px');
            cursorRight2.style.setProperty('top', topPx + 'px');
            cursorLeft2.setAttribute('data-timeline-top', String(Math.round(topPx)));
            logTimelineGeometry();
        }
    }
    
    // textureIndex = infoTimeMa / stepMa — stepMa lu directement depuis la config du bouton cliqué
    // Exception init : 🔘🕰 = '' avant le premier clic → textureIndex = 0 (infoTimeMa = 0 aussi)
    if (DATA['📜']['🔘🕰'] === '') {
        window.textureIndex = 0;
    } else {
        const _epochId_tl = DATA['📜']['🗿'];
        const _idx_tl = TIMELINE.findIndex(item => item['📅'] === _epochId_tl);
        const _epoch_tl = _idx_tl >= 0 ? TIMELINE[_idx_tl] : null;
        const _ticKey = DATA['📜']['🔘🕰'];
        const _ticCfg = _epoch_tl && _epoch_tl['🕰'] && _epoch_tl['🕰'][_ticKey];
        if (_ticCfg) {
            window.textureIndex = Math.floor(window.infoTimeMa / _ticCfg['🔺⏳']);
        }
        if (!_ticCfg) console.error('[updateTimeline][timeline.js] _ticCfg undefined epochId=' + _epochId_tl + ' ticKey=' + _ticKey);
    }

    const currentTicTime = window.textureIndex;
    const currentIceLevel = window.h2oIceFractionFromCalculation;

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
    
    // Convertir en millions d'années
    const millions = Math.abs(years) / 1e6;
    
    // Si >= 1 million, afficher en Ma
    if (millions >= 1) {
        const sign = years < 0 ? '-' : '';
        // Arrondir à 1 décimale, mais enlever les zéros inutiles
        const millionsFormatted = millions.toFixed(1).replace(/\.?0+$/, '');
        return `${sign}${millionsFormatted} Ma`;
    }
    
    // Sinon, afficher en milliers d'années (Ka)
    const milliers = Math.abs(years) / 1e3;
    if (milliers >= 1) {
        const sign = years < 0 ? '-' : '';
        const milliersFormatted = milliers.toFixed(0);
        return `${sign}${milliersFormatted} Ka`;
    }
    
    // Sinon, afficher en années
    return `${years < 0 ? '-' : ''}${Math.abs(years)} ans`;
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

