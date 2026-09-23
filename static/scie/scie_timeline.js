// File: CO2/static/scie/scie_timeline.js - Frise des époques (horizontale ou verticale)
// Desc: La FRISE et la sélection d'époque. État réel à la date d'extraction, à ne pas confondre avec l'intention :
//       — createEpochButton(id, orientation, hidden) et createGraduation savent faire 'horizontal' ET 'vertical' ;
//       — generateHorizontalTimeline() ne dessine RIEN aujourd'hui : il choisit l'époque par défaut et appelle
//         selectEpoch(). La frise horizontale est donc à écrire, pas à réutiliser ;
//       — createEpochButton(id, orientation, hidden) et createGraduation savent faire 'horizontal' ET 'vertical' :
//         ce sont les briques de cette frise à venir. Sans appelant pour l'instant, c'est assumé et temporaire.
// Version 1.0.1
// Date: [September 19, 2026]
// logs :
//   - v1.0.1: generateVerticalTimeline() retiré — il visait .visu_epochs-container, absent de cette page,
//     et personne ne l'appelait. La frise verticale du panneau Visuel est construite ailleurs
//     (organigramme/timeline.js + organigramme.js) : c'était un doublon dormant.
//   - v1.0.0: extraction depuis le <script> en ligne de CO2/html/scie_compute.html (1810 lignes d'un bloc).
//     Découpage par responsabilité, à code IDENTIQUE : seule l'indentation change. Les fichiers restent des
//     scripts classiques chargés dans l'ordre des dépendances — la page garde son chargement synchrone.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

// ============================================================================
// UTILITAIRES PARTAGÉS POUR TIMELINE (verticale et horizontale)
// ============================================================================

// Créer un bouton d'époque (utilitaire partagé)
// hidden=true => rendu texte (epoch-text) mais cliquable.
function createEpochButton(epochId, orientation, isHidden) {
    if (isHidden) {
        const el = document.createElement('button');
        el.className = orientation === 'horizontal' ? 'epoch-text-horizontal' : 'epoch-text';
        el.setAttribute('data-epoch', epochId);
        el.textContent = epochId;
        return el;
    }
    const button = document.createElement('button');
    button.className = orientation === 'horizontal' ? 'epoch-btn-horizontal' : 'epoch-btn';
    button.setAttribute('data-epoch', epochId);
    
    // Le logo est directement l'emoji
    button.textContent = epochId;
    button.style.fontFamily = "'Apple Color Emoji', 'Noto Color Emoji', 'EmojiFont', 'Segoe UI Emoji', sans-serif";
    
    // Ajouter le tooltip personnalisé avec description depuis DESC
    if (window.CHARS_DESC && window.CHARS_DESC[epochId]) {
        // Utiliser addCustomTooltip si disponible, sinon title
        if (typeof addCustomTooltip === 'function') {
            addCustomTooltip(button, window.CHARS_DESC[epochId]);
        } else {
            button.title = window.CHARS_DESC[epochId];
        }
    }
    
    return button;
}

// Créer une graduation (utilitaire partagé)
function createGraduation(dateText, orientation) {
    const graduation = document.createElement('div');
    graduation.className = orientation === 'horizontal' ? 'epoch-date-item-horizontal' : 'epoch-date-item';
    
    const date = document.createElement('span');
    date.className = orientation === 'horizontal' ? 'epoch-date-horizontal' : 'epoch-date';
    date.textContent = dateText;
    
    graduation.appendChild(date);
    return graduation;
}

// Formater une date en Ma depuis les années (▶ = years, convention géo: -X Ma = X Ma avant présent)
function formatDateMa(years) {
    const millions = Math.abs(years) / 1e6;
    if (millions >= 1) {
        const sign = years > 0 ? '-' : '';
        return `${sign}${millions.toFixed(0)}Ma`;
    }
    return years >= 0 ? `+${years}` : `${years}`;
}

// ============================================================================
// GÉNÉRATION TIMELINE HORIZONTALE
// 3 lignes : noms (entre les |), | logos, dates (sous les |)
// ============================================================================
var EPOCH_NAME_MAP = window.CHARS_DESC || {};
function generateHorizontalTimeline() {
    if (!window.TIMELINE) return;
    const epochItems = window.TIMELINE.filter(item => item && item['📅']);
    const defaultEpoch = epochItems.find(item => item['📅'] === '⚫')
        || epochItems.find(item => !item.hidden)
        || epochItems[0];
    if (defaultEpoch) selectEpoch(defaultEpoch['📅']);
}

// Sélectionner une époque (utilise l'index directement)
function selectEpoch(epochId) {
    // Trouver l'index de l'époque dans TIMELINE
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    if (epochIndex < 0) {
        console.error(`[selectEpoch] Époque ${epochId} non trouvée`);
        return;
    }

    // Clic frise : même contrat que setEpochFromEpochButton (loader_panels) — pas d’anim multi-pas.
    window.DATA['🔘']['🔘🎞'] = false;
    window.infoTimeMa = 0;
    window._timelineEpochEndSkipLatch = false;
    var _plotAnimCb = document.getElementById('plot-anim-toggle-checkbox');
    if (_plotAnimCb) _plotAnimCb.checked = false;
    
    // Mettre à jour DATA['📅'] avec l'objet epoch complet (source unique de vérité)
    if (!window.DATA['📜']) window.DATA['📜'] = {};
    window.DATA['📅'] = window.TIMELINE[epochIndex];
    window.DATA['📜']['👉'] = epochIndex;
    window.DATA['📜']['🗿'] = epochId; // Logo de l'époque (emoji), pas la description
    
    // Mettre à jour les boutons
    document.querySelectorAll('.epoch-btn-horizontal, .epoch-text-horizontal').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-epoch') === epochId) btn.classList.add('selected');
    });
    
    // Mettre à jour la date de l'époque (depuis '▶')
    updateTimelineDisplay();
    
    // Mettre à jour les actions (boutons d'événements)
    updateEpochActions();
    
    // Réinitialiser le temps et les accumulateurs
    if (typeof window !== 'undefined' && window.DATA) {
        if (!window.DATA['📜']) window.DATA['📜'] = {};
        window.DATA['📜']['📿💫'] = 0;
        window.DATA['📜']['🔺⚖️🏭'] = 0; window.DATA['📜']['🔺⚖️🌊🏭'] = 0; window.DATA['📜']['🔺⚖️🌳🏭'] = 0;
        window.DATA['📜']['🔺⚖️💧'] = 0;
        window.DATA['📜']['🔺🍰⚽'] = 0;
        const logEl = document.getElementById('co2-action-log');
        if (logEl) logEl.textContent = '';
        updateTimelineDisplay();
    }
    emitSyncToParent();
}
window.selectEpoch = selectEpoch;

// Mettre à jour l'affichage de la timeline (📅 date courante, début époque, nom)
function updateTimelineDisplay() {
    const infoTimeDisplay = document.getElementById('info-time');
    const ticDurationEl = document.getElementById('tic-duration');
    const epochStartTime = document.getElementById('epoch-start-time');
    const epochNameEl = document.getElementById('epoch-name');
    const DATA = window.DATA;
    const EPOCH = (DATA && DATA['📜'] != null && window.TIMELINE) ? window.TIMELINE[DATA['📜']['👉']] : null;
    if (!EPOCH || !DATA) return;

    // Detect time direction
    const epochEnd = typeof EPOCH['◀'] === 'number' ? EPOCH['◀'] : null;
    const isForward = EPOCH['▶'] != null && epochEnd != null && EPOCH['▶'] < epochEnd;

    // Nom d'époque
    if (epochNameEl) {
        const eId = (DATA['📜'] && DATA['📜']['🗿']) || (EPOCH && EPOCH['📅']);
        epochNameEl.textContent = EPOCH_NAME_MAP[eId] || eId || '';
    }

    // Date courante — source unique : DATA['📜']['📅'] (mis à jour par getEpochDateConfig)
    // Fallback sur EPOCH['▶'] si 📅 pas encore calculé (avant premier getEpochDateConfig)
    const dateYears = (DATA['📜'] && DATA['📜']['📅'] != null)
        ? DATA['📜']['📅']
        : (EPOCH['▶'] != null ? EPOCH['▶'] : null);
    if (infoTimeDisplay) {
        if (dateYears != null) {
            if (isForward) {
                infoTimeDisplay.textContent = Math.round(dateYears) + ' CE';
            } else {
                infoTimeDisplay.textContent = (dateYears / 1e6).toFixed(0) + ' Ma';
            }
        } else {
            infoTimeDisplay.textContent = '...';
        }
    }

    // Date de début d'époque (EPOCH['▶'])
    if (epochStartTime && EPOCH['▶'] != null) {
        if (isForward) {
            epochStartTime.textContent = Math.round(EPOCH['▶']) + ' CE';
        } else {
            epochStartTime.textContent = (EPOCH['▶'] / 1e6).toFixed(0) + ' Ma';
        }
    }

    // Durée d'un tic (💫 géologique ou 🛢 scénario)
    if (ticDurationEl) {
        const ticK = getTicKey(EPOCH);
        const ticCfg = EPOCH['🕰'] && EPOCH['🕰'][ticK];
        if (ticCfg && ticCfg['🔺⏳'] != null) {
            ticDurationEl.textContent = `1 tic = ${ticCfg['🔺⏳']} Ma`;
            ticDurationEl.style.display = '';
        } else {
            ticDurationEl.style.display = 'none';
        }
    }
}
