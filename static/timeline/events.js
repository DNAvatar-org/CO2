/* File: events.js - Gestion des événements de la timeline
 * Desc: Logique pour créer et gérer les boutons d'événements selon l'époque géologique
 * Version 1.2.37
 * Date: [September 18, 2026]
* logs :
 *   - v1.2.37: formatMassGT — vrais préfixes SI sur la tonne (Gt/Tt/Pt/Et). « kGT » et « MGT » empilaient deux
 *     préfixes, ce qui ne veut rien dire : les 3,2e17 kg d'une météorite de glace s'affichaient « +320 kGT »
 *     au lieu de « +320 Tt » (kilo × giga = téra, pas méga).
 *   - v1.2.36: 🕰.order n'est PLUS consommé par shift() — curseur 📿🕰 dans DATA['📜'] (remis à 0 par setEpoch).
 *     Le shift amputait la config pour de bon : revenir sur une époque déjà parcourue (reclic frise) proposait
 *     les événements décalés et la séquence ne repartait jamais entière. timeline.js : signature de rafraîchissement
 *     sur le curseur. Titre de la cellule d'événements : « FIN DE SIMULATION » quand 📱 a atteint ◀ (2100),
 *     « EVENEMENT » dès qu'un bouton revient.
 *   - v1.2.35: addEventTooltip — alt2sec des boutons d'événement recomposé À CHAQUE SURVOL (il était figé à la création
 *     du bouton, donc identique pour tous les clics d'une époque : 🦣 racontait son 1er clic 4 fois) ; 🎇 en a un aussi.
 *     SKIP (🎞) — epochEventCount() : visible dès que l'époque demande PLUS D'UN CLIC (tics 🔺⏳ sur |◀−▶| compris,
 *     pas seulement le nombre de boutons) → réapparaît sur 🦠 🪸 🦕 🏔 🦣 🛖 🚂 ; reste masqué sur les hystérésis (1 clic).
 *   - v1.2.34: alt2sec sur les boutons d'événements (window.buildEventAlt2sec, static/texts/epochs_alt2sec.js).
 *   - v1.2.33: 📱 ⛽/🛢 — cumul 📜🔺⚖️🏭 (+=) au lieu d'un delta jamais consommé ; infoTimeMa avance de 🔺⏳ (frise figée à 2000) ;
 *     plus de boutons une fois ◀ (2100) atteint.
 *   - v1.2.32: tryEpochEndSkipAfterEvent — verrou _timelineEpochEndSkipLatch posé ICI (plus seulement dans updateTimeline) : le handler
 *     d'événement et updateTimeline lançaient chacun un SKIP pour la même fin d'époque → double setEpoch → 2 calculs concurrents.
 *   - v1.2.31: actions volcan 🗻/🌋 — effets dans la config de l'époque suivante (⛄ voile, 1b CO₂ + 🌫️❄️) ; retrait écriture CONFIG_COMPUTE.iceMudballAlbedo et du hook CO₂ TODO.
 *   - v1.2.30: 🕰.⛰ — alias tic temps (comme 💫 / 🏔) pour compute + UI order / ACTION_BY_DATE.
 *   - v1.2.29: 🕰.🏔 — alias du tic temps (même rôle que 💫 pour compute / 📿💫) ; repli ACTION_BY_DATE + 🕰.order ; compteur SKIP inclut 🏔.
 *   - v1.2.28: clampInfoTimeMaToGeologicEpochDuration — aussi époques forward (▶<◀, ex. 🛖 −10⁴→1800) : |◀−▶|/1e6 + slack
 *     aligné effectiveTimelineEndSlackMa ; sinon 💫 dépassait 1800 (000500a.png puis années incohérentes sans SKIP anim).
 *   - v1.2.27: updateEpochActions — lectures directes DATA/configOrganigramme/TIMELINE ; SKIP toggle sans garde whRoot&& redondante sur 🕰.
 *   - v1.2.26: export tryEpochEndSkipAfterEvent pour timeline.js ; clamp infoTimeMa avec TIMELINE_END_SLACK_MA (timeline.js v1.0.19).
 *   - v1.2.25: retrait gardes typeof window.* sur helpers timeline (contrat de chargement : timeline.js avant events.js).
 *   - v1.2.24: Fin d'époque — isPastCurrentEpochEndMa (timeline.js) + TIMELINE_EPOCH_BOUNDS ; clamp infoTimeMa sur |▶−◀|/1e6 ; plus de seuil 500 Ma codé en dur pour 🔥/⚫.
 *   - v1.2.23: Toute transition d'époque après action événementielle → goNextEpochViaSkip() (togglePlotAnim), plus de setEpoch direct dans ces chemins ; helper centralisé.
 *   - v1.2.22: Corps Noir fin de temps (≥500 Ma) — même effet que SKIP (togglePlotAnim) au lieu de setEpoch('Hadéen') direct (curseur timeline + 🔘🎞 + époque suivante TIMELINE).
 *   - v1.2.21: 💫 Hadéen (🔥) — toujours config:applyThenCompute après tic (plus de garde PLOT_PANEL_READY : chaque événement = un run).
 *   - v1.2.20: clic ☄️ — incrémenter 📿☄️ (pas 📿💫) pour que getMasses fasse ⚖️💧 += 🔺⚖️💧☄️×📿☄️ (albédo glace ⚫).
 *   - v1.2.19: boutons scénario #timeline-events-logos — classe unique organigram-logo (retrait timeline-event-logo + organigram-unified-logo) ; styles organigramme.css.
 *   - v1.2.18: SKIP — classe plot-anim-toggle--scenario-hidden (display:none !important) si 📱 ou 🕰.order.length===1 ; retire visibility inline.
 *   - v1.2.17: SKIP (#plot-anim-toggle) — visibility avant guard eventsLogos ; masqué si 🕰.order.length===1 (sinon visible) ; 📱 year-indexed inchangé.
 *   - v1.2.16: organigramme 🕰.order — un seul bouton (tête de file) ; shift après action si clé === order[0] ; repli si order vide.
 *   - v1.2.15: 🕰.order sur TIMELINE — plusieurs boutons dans l’ordre ; SKIP (#plot-anim-toggle) masqué si order.length===1 ; compute ignore la clé order.
 * Copyright 2025 DNAvatar.org - Arnaud Maignan
 * Licensed under Apache License 2.0 with Commons Clause.
* See https://commonsclause.com/ for full terms.

 *   - Initial version: extraction de updateEpochActions depuis main.js
 *   - Corps noir météorite: config via 🕰.☄️, id époque DATA['📜']['🗿'], getEpochDateConfig + runComputeInParent + 📿☄️
 *   - switch(epochId) ⚫/🔥/default; config unique ▶/◀/🔺🧲🌕💫; getEpochConfigById; applyHadeenFluxFromConfig; plus de corps-noir/hadeen
 *   - TicTime logo comme action pour toutes les époques; météorite de glace uniquement Corps noir (⚫) et Hadéen (🔥)
 *   - ⚫ sans TicTime (Météorite + Impact uniquement); default (Archéen+) TicTime affiché sans condition 🕰.💫
 *   - v1.2.3: 💫 alt/tooltip = vraie valeur (formatStepLabel), tooltip une seule ligne (plus de <br>)
 *   - v1.2.3: Hadeen ticTime handler : check transition (infoTimeMa>=500) AVANT updateHadeenTexture/updateCO2Level
 *   - v1.2.4: DATA[📜][bary] = infoTimeMa/500 après chaque tic Hadéen (interpolation visuelle radius/exobase/noyau)
 *   - v1.2.5: 2 boutons uniquement (🎞 + un selon date) ; ACTION_BY_DATE + getActionForDate(startYears, infoTimeMa) ; bloc ACTION en haut timeline
 *   - v1.2.6: 📱 year-indexed — bucket UI par intervalle [y, y_next) sur 📅 brut (sans Math.round) pour éviter ⛽+🛢 alors qu’on est encore < 2025
 *   - v1.2.7: 📱 tooltips year-indexed depuis 🔺⏳/🔺⚖️🏭 (+Nans +MGt CO2, co2kg/1e9) — plus de yr0→yr1 depuis 📅 (échelle géologique hors 📱)
 *   - v1.2.8: 📱 bucket scénario — 📅 hors [▶,◀] (résidu géologique) → année via ▶+📿💫×pas, sinon repli ▶ ; évite bucket 2075 (350Gt+🛢) au lieu de 2000 (850Gt)
 *   - v1.2.11: idToName 🐊 « Éocène »
 *   - v1.2.9: idToName 🐊 « Hyperthermie éocène »
 *   - v1.2.10: idToName 🥟 Protérozoïque ; check fin d'époque dans handler 💫 → setEpoch(suivant) auto
 *   - v1.2.12: géologique — 🕰.🌋 (voile SW 📜🔺🍰⚽) même si ACTION_BY_DATE reste 💫 ; tic 💫 seulement si 🕰.💫 ou pas seulement 🌋
 *   - v1.2.13: 🌋 + 🔺⏳ (Ma) même chemin temps/fin d’époque que 💫 ; TIMELINE[epochId]['🕰'] accès direct (contrat) ; 📜🔺🍰⚽ non reset par setEpoch → voile survit au changement d’époque
 *   - v1.2.14: clic 💫 — si 🕰.💫 définit 🍰⚽, copie dans 📜🔺🍰⚽ (ex. 0) puis _veilTimelinePulseActive=false pour ré-autoriser impulsion racine EPOCH['🔺🍰⚽'] au prochain 📿💫===0
 */

// Core globals requis : addCustomTooltip, hideTooltip, togglePlotAnim (SKIP), getEpochAtTimelineIndex, getCurrentEpochDurationMa, isPastCurrentEpochEndMa, getEpochDateConfig, getNoyau, runComputeInParent, updateTimeline, updateHadeenTexture, updateH2OLevelDirect, getLogoImageSrc, configOrganigramme, DATA.
// Module plot optionnel : géré par window.PLOT_PANEL_READY (main.js), accès en blocs if (window.PLOT_PANEL_READY) { ... window.plotData ... }.

/** Transition vers l'époque suivante comme un clic SKIP (#plot-anim-toggle) — loader_panels.togglePlotAnim. */
function goNextEpochViaSkip() {
    window.togglePlotAnim();
}

/** Borne infoTimeMa sur la durée d’ép |◀−▶|/1e6 Ma : forward (🛖, 🚂, 📱…) et géologique (▶>◀). Snap fin dans le slack (aligné isPastCurrentEpochEndMa). */
function clampInfoTimeMaToGeologicEpochDuration() {
    const epoch = window.getEpochAtTimelineIndex();
    if (!epoch || epoch['▶'] == null || epoch['◀'] == null) return;
    const dur = Math.abs(epoch['◀'] - epoch['▶']) / 1e6;
    if (!Number.isFinite(dur) || dur <= 0) return;
    const slackFn = typeof window.effectiveTimelineEndSlackMa === 'function' ? window.effectiveTimelineEndSlackMa : null;
    const slack = slackFn ? slackFn(dur) : (window.TIMELINE_END_SLACK_MA != null ? window.TIMELINE_END_SLACK_MA : 0.05);
    if (window.infoTimeMa >= dur - slack) window.infoTimeMa = dur;
    else if (window.infoTimeMa > dur) window.infoTimeMa = dur;
}

/**
 * Après mise à jour du temps : si la date frise (getTimelineCurrentMa) dépasse la fin d'époque, SKIP.
 * @param {function} [runPopOrder] appelé avant SKIP si fourni (ex. popOrderAfterAction('💫')).
 */
function tryEpochEndSkipAfterEvent(runPopOrder) {
    clampInfoTimeMaToGeologicEpochDuration();
    if (!window.isPastCurrentEpochEndMa()) return false;
    const TIMELINE = window.TIMELINE;
    const DATA = window.DATA;
    if (!TIMELINE || !TIMELINE.length || !DATA || !DATA['📜']) return false;
    const epochId = DATA['📜']['🗿'];
    const idxCur = TIMELINE.findIndex(function (e) { return e['📅'] === epochId; });
    if (idxCur < 0 || idxCur + 1 >= TIMELINE.length) return false;
    // Une fin d'époque = UNE transition. Appelants multiples (handler d'événement + updateTimeline) pendant
    // l'animation curseur (~400 ms, setEpoch pas encore fait) → sans verrou : 2 SKIP → 2 setEpoch → 2 calculs.
    // Verrou posé ici (point d'entrée unique), relâché par setEpoch (main.js) à l'arrivée sur l'époque suivante.
    if (window._timelineEpochEndSkipLatch) return true;
    window._timelineEpochEndSkipLatch = true;
    if (runPopOrder) runPopOrder();
    goNextEpochViaSkip();
    return true;
}

/** Titre de la cellule d'événements (#cell-timeline-scenario-logos) : « EVENEMENT », ou « FIN DE SIMULATION »
 *  quand 📱 a atteint ◀ (2100) et n'a plus rien à proposer. Repasse à EVENEMENT dès qu'un bouton revient
 *  (reclic sur l'époque 📱 → setEpoch remet 📿💫/📅 à 2000). */
function setEventsHeading(text) {
    const h = document.querySelector('#cell-timeline-scenario-logos .flux-label.organigram-config-heading');
    if (h && h.innerHTML !== text) h.innerHTML = text;
}

/**
 * Curseur de 🕰.order : combien d'entrées ont déjà été jouées dans l'époque courante.
 * Vit dans DATA['📜']['📿🕰'] (remis à 0 par setEpoch, comme 📿💫/📿☄️) et NON dans la config :
 * un shift() sur 🕰.order amputait la séquence pour de bon, donc revenir sur une époque déjà
 * parcourue proposait les événements décalés (⚫ : 2 clics joués → il ne restait que 3 actions).
 */
function orderCursor() {
    const D = window.DATA;
    const n = (D && D['📜']) ? Number(D['📜']['📿🕰']) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Tooltip d'un bouton d'événement, avec alt2sec VIVANT.
 * Le récit dépend de l'état courant (📿💫, masses, date) : il ne peut pas être figé à la création du bouton,
 * sinon une époque à plusieurs clics (🦣 : glaciaire → interglaciaire → glaciaire) raconte le premier clic
 * pour tous les suivants. buildEventAlt2sec est donc rejoué à chaque survol, avant que tooltips.js ne lise
 * data-alt2sec (il le lit dans son setTimeout, après le mouseenter).
 */
function addEventTooltip(el, epochId, eventKey, shortText) {
    el.setAttribute('data-event-key', eventKey);
    window.addCustomTooltip(el, shortText, window.buildEventAlt2sec(epochId, eventKey));
    const refresh = function () {
        const id = (window.DATA && window.DATA['📜']) ? window.DATA['📜']['🗿'] : epochId;
        const txt = window.buildEventAlt2sec(id, eventKey);
        if (txt) el.setAttribute('data-alt2sec', txt);
        else el.removeAttribute('data-alt2sec');
    };
    el.addEventListener('mouseenter', refresh);
    el.addEventListener('focus', refresh);
}

/**
 * Nombre de clics que demande l'époque pour être traversée — ce qui décide de l'affichage du SKIP (🎞).
 * 🕰.order → longueur de la file. Sinon : max(boutons d'action, tics nécessaires pour couvrir |◀−▶| au pas 🔺⏳),
 * car une époque à un seul bouton 💫 peut demander plusieurs clics (🦠 3 × 500 Ma, 🦣 4 × 0,5 Ma, 🛖 3 × 4 ka).
 * Les hystérésis valent 1 (un seul événement, un seul clic) : pas de SKIP.
 */
function epochEventCount(tlEpoch) {
    const wh = tlEpoch ? tlEpoch['🕰'] : null;
    if (!wh) return 0;
    if (Array.isArray(wh.order)) return wh.order.length;
    const directCount = ['☄️', '🎇', '🗻', '🌋', '💫', '🏔', '⛰']
        .filter(function (k) { return wh[k] != null; }).length;
    let ticCount = 0;
    const ticKey = ['💫', '🏔', '⛰', '🌋'].find(function (k) {
        return wh[k] && Number.isFinite(Number(wh[k]['🔺⏳'])) && Number(wh[k]['🔺⏳']) > 0;
    });
    const durMa = (Number.isFinite(Number(tlEpoch['▶'])) && Number.isFinite(Number(tlEpoch['◀'])))
        ? Math.abs(Number(tlEpoch['◀']) - Number(tlEpoch['▶'])) / 1e6 : null;
    if (ticKey && durMa !== null && durMa > 0) {
        ticCount = Math.ceil(durMa / Number(wh[ticKey]['🔺⏳']) - 1e-9);
    }
    return Math.max(directCount, ticCount);
}

// Fonction pour mettre à jour les actions disponibles selon l'époque
// Après 🎞 : ☄️ / 🎇 / 💫 selon 🕰.order (TIMELINE) — une seule action visible (order[0]), queue consommée au clic ; sinon ACTION_BY_DATE ; géologique sans order : 🕰.🌋 + 🕰.💫.
window.updateEpochActions = function () {
    window.refreshTimelineEpochBounds();
    const eventsLogos = document.getElementById('timeline-events-logos');
    const animToggleBtn = document.getElementById('plot-anim-toggle');

    const currentEpochName = window.RUNTIME_STATE.currentEpochName;
    const getEpochConfigById = (id) =>
        window.configOrganigramme.timeline.find((e) => e.type === 'epoch' && e.id === id);
    const epochId = window.DATA['📜']['🗿'];
    const timelineEpoch = getEpochConfigById(epochId);
    const startYears = timelineEpoch['▶'];
    const infoTimeMa = window.infoTimeMa;

    // 🎞 SKIP : masqué si 📱 (buckets année sous 🕰) ; masqué si une seule action restante dans 🕰.order (length === 1) ; affiché sinon.
    const _tlEpoch = window.TIMELINE.find((e) => e['📅'] === epochId);
    const whRoot = _tlEpoch['🕰'];
    if (animToggleBtn) {
        // 📱 : buckets année (⛽/🛢) — pas d'époque suivante à rejoindre, SKIP sans objet.
        const _hasEmissions = Object.keys(whRoot).some(function(k) { return !isNaN(Number(k)); });
        const hideSkip = _hasEmissions || epochEventCount(_tlEpoch) <= 1;
        animToggleBtn.classList.toggle('plot-anim-toggle--scenario-hidden', hideSkip);
        animToggleBtn.style.removeProperty('visibility');
    }

    if (!eventsLogos) return;

    eventsLogos.innerHTML = '';
    setEventsHeading('EVENEMENT');

    // Applique le flux géothermique Hadéen depuis la config (▶/◀ années, 🔺🧲🌕💫 flux début/fin)
    const applyHadeenFluxFromConfig = () => {
        const ep = getEpochConfigById('🔥');
        if (!ep || !ep['🕰'] || !ep['🕰']['💫'] || !ep['🕰']['💫']['🔺🧲🌕💫']) return;
        const startYears = ep['▶'];
        const endYears = ep['◀'];
        const totalDuration = (startYears != null && endYears != null) ? startYears - endYears : 5e8;
        const geo = ep['🕰']['💫']['🔺🧲🌕💫'];
        const fluxStart = geo['▶'] != null ? geo['▶'] : 2000000;
        const fluxEnd = geo['◀'] != null ? geo['◀'] : 0.3;
        const elapsed = (window.infoTimeMa != null ? window.infoTimeMa : 0) * 1e6;
        const progress = Math.min(1, Math.max(0, elapsed / totalDuration));
        const logFlux = (1 - progress) * Math.log(fluxStart) + progress * Math.log(fluxEnd);
        ep.geothermal_flux = Math.exp(logFlux);
    };

    // Échelle récente (1800, 2100) : afficher +N ans ; sinon +X Ma
    const formatStepLabel = (stepMa) => {
        if (stepMa == null || !Number.isFinite(stepMa)) return '';
        if (stepMa < 0.001) return '+' + Math.round(stepMa * 1e6) + ' ans';
        return '+' + stepMa + ' Ma';
    };

    /** Tic temps géologique : 💫 (défaut), ou 🏔 / ⛰ (alias TIMELINE) — même 🔺⏳ / 📿💫 côté compute.js. */
    const GEologic_TIC_KEYS = ['💫', '🏔', '⛰'];
    const resolveGeologicTicFromWh = (wh) => {
        if (!wh || typeof wh !== 'object') return { ticKey: null, ticCfg: null };
        for (let i = 0; i < GEologic_TIC_KEYS.length; i++) {
            const k = GEologic_TIC_KEYS[i];
            const c = wh[k];
            if (c != null && typeof c === 'object') return { ticKey: k, ticCfg: c };
        }
        return { ticKey: null, ticCfg: null };
    };

    // Fonction utilitaire pour formater la masse
    const formatMass = (mass_kg) => {
        if (!mass_kg || mass_kg <= 0) return '';
        const expStr = mass_kg.toExponential(1); // ex: 6.8e+18
        // Remplacer e+18 par x10<sup>18</sup>
        const [base, exp] = expStr.split('e');
        // Nettoyer l'exposant (+18 -> 18)
        const cleanExp = exp.replace('+', '');
        return `+${base}x10<sup>${cleanExp}</sup> kg`;
    };
    
    // Masse en tonnes, avec un VRAI préfixe SI — les préfixes ne s'empilent pas : « kGt » n'existe pas
    // (kilo × giga = téra, donc l'ancien « 320 kGT » se dit 320 Tt). 1 Gt = 10⁹ t = 10¹² kg.
    //   Gt gigatonne 10¹² kg · Tt tératonne 10¹⁵ kg · Pt pétatonne 10¹⁸ kg · Et exatonne 10²¹ kg
    const formatMassGT = (mass_kg) => {
        if (!mass_kg || mass_kg <= 0) return '';
        const paliers = [
            { seuil: 1e21, unite: 'Et' },   // exatonne
            { seuil: 1e18, unite: 'Pt' },   // pétatonne
            { seuil: 1e15, unite: 'Tt' },   // tératonne
            { seuil: 1e12, unite: 'Gt' },   // gigatonne
        ];
        for (const p of paliers) {
            if (mass_kg >= p.seuil) {
                const v = (mass_kg / p.seuil).toFixed(1).replace(/\.?0+$/, '');
                return `+${v} ${p.unite}`;
            }
        }
        const mt = (mass_kg / 1e9).toFixed(1).replace(/\.?0+$/, '');
        return `+${mt} Mt`;
    };

    // 📱 Buckets par année (clés numériques sous 🕰), prioritaire sur order / ACTION_BY_DATE
    if (_tlEpoch && whRoot) {
        const _isYearIndexed = Object.keys(whRoot).some(function(k) { return !isNaN(Number(k)); });
        if (_isYearIndexed) {
            // 📱 year-indexed : boutons par tranche d'année (⛽, 🛢, 🛳…)
            // Année pour buckets : 📅 seulement s’il est dans [▶, ◀] (ère moderne) ; sinon ▶ + 📿💫×pas (comme physicsAll) puis repli ▶
            // Sinon un 📅 géologique (≫2100) tombait dans [2075,∞) → ⛽ 350Gt + 🛢 au lieu du scénario 2000 (850Gt, ⛽ seul)
            eventsLogos.classList.add('year-indexed');
            const D = window.DATA;
            const yearKeys = Object.keys(_tlEpoch['🕰'])
                .filter(k => !isNaN(Number(k)))
                .map(Number)
                .sort((a, b) => a - b);
            const epochStart = (_tlEpoch['▶'] != null && Number.isFinite(_tlEpoch['▶'])) ? _tlEpoch['▶'] : (yearKeys[0] || 2000);
            const epochEnd = (_tlEpoch['◀'] != null && Number.isFinite(_tlEpoch['◀'])) ? _tlEpoch['◀'] : (yearKeys[yearKeys.length - 1] || 2100);
            const winLo = epochStart - 0.5;
            const winHi = epochEnd + 200;
            const rawYr = (D['📜'] && D['📜']['📅'] != null && Number.isFinite(D['📜']['📅'])) ? D['📜']['📅'] : epochStart;
            let curYrForBucket = rawYr;
            if (!(curYrForBucket >= winLo && curYrForBucket <= winHi)) {
                const k0 = yearKeys[0];
                const firstActs = (k0 != null) ? (_tlEpoch['🕰'][k0] || _tlEpoch['🕰'][String(k0)]) : null;
                const firstCfg = firstActs && typeof firstActs === 'object' ? Object.values(firstActs)[0] : null;
                const stepYr = (firstCfg && typeof firstCfg['🔺⏳'] === 'number') ? firstCfg['🔺⏳'] * 1e6 : 25;
                const tic = (D['📜'] && Number.isFinite(D['📜']['📿💫'])) ? D['📜']['📿💫'] : 0;
                curYrForBucket = epochStart + tic * stepYr;
                if (!(curYrForBucket >= winLo && curYrForBucket <= winHi)) curYrForBucket = epochStart;
            }
            let activeYr = yearKeys[0];
            if (yearKeys.length && Number.isFinite(curYrForBucket)) {
                if (curYrForBucket < yearKeys[0]) {
                    activeYr = yearKeys[0];
                } else {
                    for (let i = 0; i < yearKeys.length; i++) {
                        const yStart = yearKeys[i];
                        const yEnd = (i + 1 < yearKeys.length) ? yearKeys[i + 1] : Infinity;
                        if (curYrForBucket >= yStart && curYrForBucket < yEnd) {
                            activeYr = yStart;
                            break;
                        }
                    }
                }
            }
            // Fin de frise (◀ = 2100) atteinte : plus d'action (pas d'époque suivante, sinon on injecterait au-delà de ◀)
            const actions = (curYrForBucket >= epochEnd) ? null : _tlEpoch['🕰'][activeYr];
            if (!actions) setEventsHeading('FIN DE SIMULATION');

            if (actions) {
                for (const [emoji, cfg] of Object.entries(actions)) {
                    const co2kg = cfg['🔺⚖️🏭'] || 0;
                    const dtYr = (cfg['🔺⏳'] || 0.000025) * 1e6;
                    const dtYrDisp = Math.round(dtYr);
                    // Gt d’affichage : kg/1e12 (config v1.4.80 en kg réels : 850e12 kg = 850 GtCO₂)
                    const gtDisp = Math.round(co2kg / 1e12);

                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'icon-button btn-events organigram-logo btn-year-indexed organigram-action-logo';
                    btn.textContent = emoji;
                    const altText = '+' + dtYrDisp + 'ans +' + gtDisp + 'Gt CO2';
                    btn.alt = altText;
                    // alt2sec (bulle longue) : récit de l'événement, static/texts/epochs_alt2sec.js
                    addEventTooltip(btn, epochId, emoji, emoji + ' ' + altText);

                    btn.addEventListener('click', () => {
                        window.hideTooltip();
                        const D = window.DATA;
                        // CO₂ : CUMUL lu par getMasses() (racine époque + 📜🔺⚖️🏭)
                        D['📜']['🔺⚖️🏭'] += co2kg;
                        // Puits océan + forêts sur la durée du clic (une fois par événement)
                        window.CO2.advanceCarbonSinks(dtYr, co2kg);
                        // Temps (📿💫 = compteur universel ; date = ▶ + 📿💫 × 🔺⏳, compute.js)
                        D['📜']['📿💫'] += 1;
                        window.infoTimeMa += dtYr / 1e6;
                        // Physique
                        window.COMPUTE.getEpochDateConfig();
                        window.COMPUTE.getNoyau();
                        if (!window.FLUX) window.FLUX = {};
                        window.FLUX.yAxisRecalcOnNextFinish = true;
                        window.IO_LISTENER.emit('config:applyThenCompute', { button: emoji });
                        window.updateTimeline();
                        // Re-render (nouvelle année → nouveaux boutons)
                        window.updateEpochActions();
                    });

                    eventsLogos.appendChild(btn);
                }
            }
            return;
        }
    }

    if (_tlEpoch && whRoot && Array.isArray(whRoot.order) && orderCursor() < whRoot.order.length) {
        const wh = whRoot;
        const ticRootResolved = resolveGeologicTicFromWh(wh);
        const ticCfgRoot = ticRootResolved.ticCfg;
        /** Une entrée consommée dans 🕰.order : le curseur 📿🕰 avance d'un cran si la tête de file correspond à
         *  l'action réellement jouée (pas de boucle sur 🔘🕰 à chaque frame). La CONFIG n'est pas touchée : revenir
         *  sur l'époque (clic sur la frise) remet 📿🕰 à 0 dans setEpoch et la séquence repart entière. */
        const popOrderAfterAction = (actedKey) => {
            const ord = _tlEpoch['🕰'] && _tlEpoch['🕰'].order;
            if (!Array.isArray(ord)) return;
            const cur = orderCursor();
            if (cur >= ord.length || ord[cur] !== actedKey) return;
            window.DATA['📜']['📿🕰'] = cur + 1;
        };
        const advanceGeologicTicOrder = (D, stepMa, buttonKey) => {
            if (D['📜']['📿💫'] == null || !Number.isFinite(D['📜']['📿💫'])) D['📜']['📿💫'] = 0;
            D['📜']['📿💫'] += 1;
            if ((buttonKey === '💫' || buttonKey === '🏔' || buttonKey === '⛰') && ticCfgRoot && Object.prototype.hasOwnProperty.call(ticCfgRoot, '🍰⚽')) {
                D['📜']['🔺🍰⚽'] = Number(ticCfgRoot['🍰⚽']);
                D['📜']['_veilTimelinePulseActive'] = false;
            }
            window.infoTimeMa += stepMa;
            clampInfoTimeMaToGeologicEpochDuration();
            if (tryEpochEndSkipAfterEvent(function () { popOrderAfterAction(buttonKey); })) return;
            window.COMPUTE.getEpochDateConfig();
            window.COMPUTE.getNoyau();
            if (!window.FLUX) window.FLUX = {};
            window.FLUX.yAxisRecalcOnNextFinish = true;
            window.IO_LISTENER.emit('config:applyThenCompute', { button: buttonKey });
            popOrderAfterAction(buttonKey);
            window.updateTimeline();
        };

        const act = wh.order[orderCursor()];
        {
            const cfg = wh[act];
            if (act === '☄️') {
                const mass_kg = cfg['🔺⚖️💧☄️'];
                const stepMaM = cfg['🔺⏳'];
                const iceMeteorBtn = document.createElement('img');
                iceMeteorBtn.src = window.getLogoImageSrc('☄️') || 'fonts/pics/ice_meteorite.png';
                iceMeteorBtn.alt = '';
                iceMeteorBtn.className = 'btn-events organigram-logo organigram-action-logo';
                const mass_added_txt = mass_kg >= 1e12 ? formatMassGT(mass_kg) : formatMass(mass_kg);
                const iceMeteorAlt = 'Météorite de Glace (+' + stepMaM + ' Ma)';
                addEventTooltip(iceMeteorBtn, epochId, '☄️', 'Météorite de glace<br>' + mass_added_txt + '<br>+' + stepMaM + ' Ma par clic');
                iceMeteorBtn.alt = iceMeteorAlt;
                if (epochId === '⚫') {
                    iceMeteorBtn.addEventListener('click', () => {
                        window.hideTooltip();
                        const DATA = window.DATA;
                        const earthTotalWaterKg = window.CONFIG_COMPUTE.earthTotalWaterMassKg;
                        const currentH2O = (DATA['💧']['☄️'] != null) ? DATA['💧']['☄️'] : 0;
                        const h2oToAdd = (mass_kg / earthTotalWaterKg) * 100;
                        const newH2O = Math.min(100, currentH2O + h2oToAdd);
                        DATA['💧']['☄️'] = newH2O;
                        window.RUNTIME_STATE.h2oTotalFromMeteorites = newH2O;
                        window.RUNTIME_STATE.h2oIceFractionFromCalculation = undefined;
                        window.isIceChange = true;
                        window.lastIceLevel = undefined;
                        DATA['📜']['🔺⚖️💧'] = (DATA['📜']['🔺⚖️💧'] || 0) + mass_kg;
                        DATA['📜']['📿☄️'] = (DATA['📜']['📿☄️'] || 0) + 1;
                        window.infoTimeMa += stepMaM;
                        window.COMPUTE.getEpochDateConfig();
                        window.COMPUTE.getNoyau();
                        if (!window.FLUX) window.FLUX = {};
                        window.FLUX.yAxisRecalcOnNextFinish = true;
                        window.IO_LISTENER.emit('config:applyThenCompute', { button: '☄️' });
                        window.updateTimeline();
                        checkDateEvents();
                        const h2o_total = newH2O + (window.RUNTIME_STATE.h2oVaporPercent != null ? window.RUNTIME_STATE.h2oVaporPercent : 0);
                        window.updateH2OLevelDirect(h2o_total);
                        popOrderAfterAction('☄️');
                    });
                } else {
                    iceMeteorBtn.addEventListener('click', () => {
                        window.hideTooltip();
                        const DATA = window.DATA;
                        const earthTotalWaterKg = window.CONFIG_COMPUTE.earthTotalWaterMassKg;
                        const currentH2O = (DATA['💧']['☄️'] != null) ? DATA['💧']['☄️'] : 0;
                        let h2oToAdd = (mass_kg / earthTotalWaterKg) * 100;
                        h2oToAdd = Math.max(h2oToAdd * 10, 2.1);
                        const newH2O = Math.min(100, currentH2O + h2oToAdd);
                        DATA['💧']['☄️'] = newH2O;
                        window.RUNTIME_STATE.h2oTotalFromMeteorites = newH2O;
                        window.RUNTIME_STATE.h2oIceFractionFromCalculation = undefined;
                        DATA['📜']['🔺⚖️💧'] = (DATA['📜']['🔺⚖️💧'] || 0) + mass_kg;
                        DATA['📜']['📿☄️'] = (DATA['📜']['📿☄️'] || 0) + 1;
                        const durMaM = window.getCurrentEpochDurationMa();
                        if (durMaM == null || !Number.isFinite(durMaM)) throw new Error('[events.js] getCurrentEpochDurationMa requis pour ☄️ après 🔥');
                        window.infoTimeMa = Math.min(durMaM, window.infoTimeMa + stepMaM);
                        applyHadeenFluxFromConfig();
                        if (!window.FLUX) window.FLUX = {};
                        window.FLUX.yAxisRecalcOnNextFinish = true;
                        window.updateTimeline();
                        window.updateHadeenTexture();
                        checkDateEvents();
                        if (tryEpochEndSkipAfterEvent(function () { popOrderAfterAction('☄️'); })) return;
                        const h2o_total = newH2O + (window.RUNTIME_STATE.h2oVaporPercent != null ? window.RUNTIME_STATE.h2oVaporPercent : 0);
                        window.updateH2OLevelDirect(h2o_total);
                        popOrderAfterAction('☄️');
                    });
                }
                eventsLogos.appendChild(iceMeteorBtn);
            } else if (act === '🎇') {
                const targetFromConfig = cfg['⏩'];
                const bigImpactBtn = document.createElement('img');
                bigImpactBtn.src = window.getLogoImageSrc('🎇') || 'fonts/pics/big_impact.png';
                bigImpactBtn.alt = '';
                bigImpactBtn.className = 'btn-events organigram-logo organigram-action-logo';
                addEventTooltip(bigImpactBtn, epochId, '🎇', 'Impact majeur - Crée la lune');
                bigImpactBtn.addEventListener('click', () => {
                    window.hideTooltip();
                    if (targetFromConfig) {
                        const h2o_base = window.RUNTIME_STATE.h2oVaporPercent != null ? window.RUNTIME_STATE.h2oVaporPercent : 0;
                        const h2o_meteorites = window.RUNTIME_STATE.h2oTotalFromMeteorites != null ? window.RUNTIME_STATE.h2oTotalFromMeteorites : 0;
                        window.UI_STATE.savedH2O = h2o_base + h2o_meteorites;
                        if (window.PLOT_PANEL_READY) {
                            window.UI_STATE.savedCO2 = window.plotData.co2_ppm;
                            window.UI_STATE.savedCH4 = window.plotData.ch4_ppm;
                        } else {
                            window.UI_STATE.savedCO2 = 0;
                            window.UI_STATE.savedCH4 = 0;
                        }
                        window.UI_STATE.maximiseData = true;
                        popOrderAfterAction('🎇');
                        goNextEpochViaSkip();
                    } else {
                        advanceGeologicTicOrder(window.DATA, cfg['🔺⏳'], '🎇');
                    }
                });
                eventsLogos.appendChild(bigImpactBtn);
            } else if (act === '🗻' || act === '🌋') {
                // [ACTIONS VOLCAN config-driven v-2026-07-16] DEUX logos distincts, sens OPPOSÉS, chacun décrit par
                // sa DESC dans l'Alphabet (CHARS_DESC) — plus aucun tooltip hardcodé :
                //   🗻 (sur 1a) = entrée : voile sulfate SW ; 🌋 (sur ⛄) = sortie : CO₂ + glace sale.
                // [v1.2.31 v-2026-09-15] Les EFFETS physiques sont dans la config de l'époque SUIVANTE (choix ergonomique
                // assumé) : voile = racine 🔺🍰⚽ de ⛄ ; CO₂ + glace sale = ⚖️🏭 et 🌫️❄️ de hysteresis 1b. Le clic fait
                // avancer le temps (🔺⏳) → époque suivante en animation (T° présente conservée). Seul un voile déclaré
                // sur l'event lui-même (🔺🍰⚽) est encore appliqué ici (générique, pas d'if(epoch==)).
                const stepVeil = cfg['🔺🍰⚽'];        // voile SW optionnel porté par l'event (fraction)
                const stepMaVolc = cfg['🔺⏳'];
                const volcBtn = document.createElement('button');
                volcBtn.type = 'button';
                volcBtn.className = 'icon-button btn-events organigram-logo organigram-action-logo';
                volcBtn.textContent = act;
                // Tooltip = DESC du logo dans l'Alphabet (source unique), pas de texte hardcodé par action.
                const tip = (window.CHARS_DESC && window.CHARS_DESC[act]) ? window.CHARS_DESC[act] : act;
                volcBtn.alt = tip;
                addEventTooltip(volcBtn, epochId, act, tip);
                volcBtn.addEventListener('click', () => {
                    window.hideTooltip();
                    const D = window.DATA;
                    if (Number.isFinite(stepVeil)) {
                        D['📜']['🔺🍰⚽'] = Math.min(0.95, (D['📜']['🔺🍰⚽'] || 0) + stepVeil);
                    }
                    advanceGeologicTicOrder(D, stepMaVolc, act);
                });
                eventsLogos.appendChild(volcBtn);
            } else if (act === '💫') {
                const ticKey = act;
                const stepMaT = (ticCfgRoot && typeof ticCfgRoot['🔺⏳'] === 'number') ? ticCfgRoot['🔺⏳'] : 100;
                const stepLabel = formatStepLabel(stepMaT);
                const ticBtn = document.createElement('button');
                ticBtn.type = 'button';
                ticBtn.className = 'icon-button btn-events organigram-logo organigram-action-logo';
                ticBtn.textContent = '💫';
                ticBtn.alt = stepLabel;
                addEventTooltip(ticBtn, epochId, ticKey || '💫', stepLabel + ' par clic');
                if (epochId === '🔥') {
                    ticBtn.addEventListener('click', () => {
                        window.hideTooltip();
                        if (!window.FLUX) window.FLUX = {};
                        window.FLUX.yAxisRecalcOnNextFinish = true;
                        const cellTerre = document.getElementById('cell-terre');
                        if (cellTerre) {
                            const canvas = cellTerre.querySelector('canvas');
                            if (canvas && canvas._threeJSData && canvas._threeJSData.sphere) {
                                window.savedPlanetRotationY = canvas._threeJSData.sphere.rotation.y;
                            }
                        }
                        const durMaT = window.getCurrentEpochDurationMa();
                        if (durMaT == null || !Number.isFinite(durMaT)) throw new Error('[events.js] getCurrentEpochDurationMa requis pour 💫 🔥');
                        window.infoTimeMa = (window.infoTimeMa || 0) + stepMaT;
                        if (window.infoTimeMa > durMaT) window.infoTimeMa = durMaT;
                        window.DATA['📜']['bary'] = durMaT > 0 ? window.infoTimeMa / durMaT : 0;
                        if (tryEpochEndSkipAfterEvent(function () { popOrderAfterAction('💫'); })) return;
                        window.updateTimeline();
                        window.updateHadeenTexture();
                        applyHadeenFluxFromConfig();
                        window.COMPUTE.getEpochDateConfig();
                        window.COMPUTE.getNoyau();
                        if (!window.FLUX) window.FLUX = {};
                        window.FLUX.yAxisRecalcOnNextFinish = true;
                        window.IO_LISTENER.emit('config:applyThenCompute', { button: '💫' });
                        checkDateEvents();
                        popOrderAfterAction('💫');
                    });
                } else {
                    ticBtn.addEventListener('click', () => {
                        window.hideTooltip();
                        advanceGeologicTicOrder(window.DATA, stepMaT, '💫');
                    });
                }
                eventsLogos.appendChild(ticBtn);
            } else if (act === '🏔') {
                const ticKey = act;
                const stepMaT = (cfg && typeof cfg['🔺⏳'] === 'number') ? cfg['🔺⏳'] : 100;
                const stepLabel = formatStepLabel(stepMaT);
                const ticBtn = document.createElement('button');
                ticBtn.type = 'button';
                ticBtn.className = 'icon-button btn-events organigram-logo organigram-action-logo';
                ticBtn.textContent = '🏔';
                ticBtn.alt = stepLabel;
                addEventTooltip(ticBtn, epochId, ticKey || '💫', stepLabel + ' par clic');
                if (epochId === '🔥') {
                    ticBtn.addEventListener('click', () => {
                        window.hideTooltip();
                        if (!window.FLUX) window.FLUX = {};
                        window.FLUX.yAxisRecalcOnNextFinish = true;
                        const cellTerre = document.getElementById('cell-terre');
                        if (cellTerre) {
                            const canvas = cellTerre.querySelector('canvas');
                            if (canvas && canvas._threeJSData && canvas._threeJSData.sphere) {
                                window.savedPlanetRotationY = canvas._threeJSData.sphere.rotation.y;
                            }
                        }
                        const durMaT = window.getCurrentEpochDurationMa();
                        if (durMaT == null || !Number.isFinite(durMaT)) throw new Error('[events.js] getCurrentEpochDurationMa requis pour 🏔 🔥');
                        window.infoTimeMa = (window.infoTimeMa || 0) + stepMaT;
                        if (window.infoTimeMa > durMaT) window.infoTimeMa = durMaT;
                        window.DATA['📜']['bary'] = durMaT > 0 ? window.infoTimeMa / durMaT : 0;
                        if (tryEpochEndSkipAfterEvent(function () { popOrderAfterAction('🏔'); })) return;
                        window.updateTimeline();
                        window.updateHadeenTexture();
                        applyHadeenFluxFromConfig();
                        window.COMPUTE.getEpochDateConfig();
                        window.COMPUTE.getNoyau();
                        if (!window.FLUX) window.FLUX = {};
                        window.FLUX.yAxisRecalcOnNextFinish = true;
                        window.IO_LISTENER.emit('config:applyThenCompute', { button: '🏔' });
                        checkDateEvents();
                        popOrderAfterAction('🏔');
                    });
                } else {
                    ticBtn.addEventListener('click', () => {
                        window.hideTooltip();
                        advanceGeologicTicOrder(window.DATA, stepMaT, '🏔');
                    });
                }
                eventsLogos.appendChild(ticBtn);
            } else if (act === '⛰') {
                const ticKey = act;
                const stepMaT = (cfg && typeof cfg['🔺⏳'] === 'number') ? cfg['🔺⏳'] : 100;
                const stepLabel = formatStepLabel(stepMaT);
                const ticBtn = document.createElement('button');
                ticBtn.type = 'button';
                ticBtn.className = 'icon-button btn-events organigram-logo organigram-action-logo';
                ticBtn.textContent = '⛰';
                ticBtn.alt = stepLabel;
                addEventTooltip(ticBtn, epochId, ticKey || '💫', stepLabel + ' par clic');
                if (epochId === '🔥') {
                    ticBtn.addEventListener('click', () => {
                        window.hideTooltip();
                        if (!window.FLUX) window.FLUX = {};
                        window.FLUX.yAxisRecalcOnNextFinish = true;
                        const cellTerre = document.getElementById('cell-terre');
                        if (cellTerre) {
                            const canvas = cellTerre.querySelector('canvas');
                            if (canvas && canvas._threeJSData && canvas._threeJSData.sphere) {
                                window.savedPlanetRotationY = canvas._threeJSData.sphere.rotation.y;
                            }
                        }
                        const durMaT = window.getCurrentEpochDurationMa();
                        if (durMaT == null || !Number.isFinite(durMaT)) throw new Error('[events.js] getCurrentEpochDurationMa requis pour ⛰ 🔥');
                        window.infoTimeMa = (window.infoTimeMa || 0) + stepMaT;
                        if (window.infoTimeMa > durMaT) window.infoTimeMa = durMaT;
                        window.DATA['📜']['bary'] = durMaT > 0 ? window.infoTimeMa / durMaT : 0;
                        if (tryEpochEndSkipAfterEvent(function () { popOrderAfterAction('⛰'); })) return;
                        window.updateTimeline();
                        window.updateHadeenTexture();
                        applyHadeenFluxFromConfig();
                        window.COMPUTE.getEpochDateConfig();
                        window.COMPUTE.getNoyau();
                        if (!window.FLUX) window.FLUX = {};
                        window.FLUX.yAxisRecalcOnNextFinish = true;
                        window.IO_LISTENER.emit('config:applyThenCompute', { button: '⛰' });
                        checkDateEvents();
                        popOrderAfterAction('⛰');
                    });
                } else {
                    ticBtn.addEventListener('click', () => {
                        window.hideTooltip();
                        advanceGeologicTicOrder(window.DATA, stepMaT, '⛰');
                    });
                }
                eventsLogos.appendChild(ticBtn);
            }
        }
        return;
    }

    const getActionForDate = (window.configOrganigramme && window.configOrganigramme.getActionForDate) || (function() { return '💫'; });
    const actionId = getActionForDate(startYears, infoTimeMa) || '💫';

    if (actionId === '☄️') {
        const epochConfig = getEpochConfigById(epochId);
        if (epochConfig && epochConfig['🕰'] && epochConfig['🕰']['☄️']) {
            const iceMeteorBtn = document.createElement('img');
            iceMeteorBtn.src = window.getLogoImageSrc('☄️') || 'fonts/pics/ice_meteorite.png';
            iceMeteorBtn.alt = '';
            iceMeteorBtn.className = 'btn-events organigram-logo organigram-action-logo';
            const mass_kg = epochConfig['🕰']['☄️']['🔺⚖️💧☄️'];
            const mass_added_txt = mass_kg >= 1e12 ? formatMassGT(mass_kg) : formatMass(mass_kg);
            const stepMa = epochConfig['🕰']['☄️']['🔺⏳'];
            const iceMeteorAlt = 'Météorite de Glace (+' + stepMa + ' Ma)';
            addEventTooltip(iceMeteorBtn, epochId, '☄️', 'Météorite de glace<br>' + mass_added_txt + '<br>+' + stepMa + ' Ma par clic');
            iceMeteorBtn.alt = iceMeteorAlt;
            if (epochId === '⚫') {
                iceMeteorBtn.addEventListener('click', () => {
                window.hideTooltip();
                const DATA = window.DATA;
                const earthTotalWaterKg = window.CONFIG_COMPUTE.earthTotalWaterMassKg;
                const currentH2O = (DATA['💧']['☄️'] != null) ? DATA['💧']['☄️'] : 0;
                const h2oToAdd = (mass_kg / earthTotalWaterKg) * 100;
                const newH2O = Math.min(100, currentH2O + h2oToAdd);
                DATA['💧']['☄️'] = newH2O;
                window.RUNTIME_STATE.h2oTotalFromMeteorites = newH2O;
                window.RUNTIME_STATE.h2oIceFractionFromCalculation = undefined;
                window.isIceChange = true;
                window.lastIceLevel = undefined;
                DATA['📜']['🔺⚖️💧'] = (DATA['📜']['🔺⚖️💧'] || 0) + mass_kg;
                DATA['📜']['📿☄️'] = (DATA['📜']['📿☄️'] || 0) + 1;
                window.infoTimeMa += stepMa;
                window.COMPUTE.getEpochDateConfig();
                window.COMPUTE.getNoyau();
                if (!window.FLUX) window.FLUX = {};
                window.FLUX.yAxisRecalcOnNextFinish = true;
                window.IO_LISTENER.emit('config:applyThenCompute', { button: '☄️' });
                window.updateTimeline();
                checkDateEvents();
                const h2o_total = newH2O + (window.RUNTIME_STATE.h2oVaporPercent != null ? window.RUNTIME_STATE.h2oVaporPercent : 0);
                window.updateH2OLevelDirect(h2o_total);
                });
            } else {
                iceMeteorBtn.addEventListener('click', () => {
                    window.hideTooltip();
                    const DATA = window.DATA;
                    const earthTotalWaterKg = window.CONFIG_COMPUTE.earthTotalWaterMassKg;
                    const currentH2O = (DATA['💧']['☄️'] != null) ? DATA['💧']['☄️'] : 0;
                    let h2oToAdd = (mass_kg / earthTotalWaterKg) * 100;
                    h2oToAdd = Math.max(h2oToAdd * 10, 2.1);
                    const newH2O = Math.min(100, currentH2O + h2oToAdd);
                    DATA['💧']['☄️'] = newH2O;
                    window.RUNTIME_STATE.h2oTotalFromMeteorites = newH2O;
                    window.RUNTIME_STATE.h2oIceFractionFromCalculation = undefined;
                    DATA['📜']['🔺⚖️💧'] = (DATA['📜']['🔺⚖️💧'] || 0) + mass_kg;
                    DATA['📜']['📿☄️'] = (DATA['📜']['📿☄️'] || 0) + 1;
                    const durMaIce = window.getCurrentEpochDurationMa();
                    if (durMaIce == null || !Number.isFinite(durMaIce)) throw new Error('[events.js] getCurrentEpochDurationMa requis pour ☄️ 🔥 (ACTION_BY_DATE)');
                    window.infoTimeMa = Math.min(durMaIce, window.infoTimeMa + stepMa);
                    applyHadeenFluxFromConfig();
                    if (!window.FLUX) window.FLUX = {};
                    window.FLUX.yAxisRecalcOnNextFinish = true;
                    window.updateTimeline();
                    window.updateHadeenTexture();
                    checkDateEvents();
                    if (tryEpochEndSkipAfterEvent(null)) return;
                    const h2o_total = newH2O + (window.RUNTIME_STATE.h2oVaporPercent != null ? window.RUNTIME_STATE.h2oVaporPercent : 0);
                    window.updateH2OLevelDirect(h2o_total);
                });
            }
            eventsLogos.appendChild(iceMeteorBtn);
        }
    } else if (actionId === '🎇') {
        const bigImpactBtn = document.createElement('img');
        bigImpactBtn.src = window.getLogoImageSrc('🎇') || 'fonts/pics/big_impact.png';
        bigImpactBtn.alt = '';
        bigImpactBtn.className = 'btn-events organigram-logo organigram-action-logo';
        addEventTooltip(bigImpactBtn, epochId, '🎇', 'Impact majeur - Crée la lune');
        bigImpactBtn.addEventListener('click', () => {
            window.hideTooltip();
            const h2o_base = window.RUNTIME_STATE.h2oVaporPercent != null ? window.RUNTIME_STATE.h2oVaporPercent : 0;
            const h2o_meteorites = window.RUNTIME_STATE.h2oTotalFromMeteorites != null ? window.RUNTIME_STATE.h2oTotalFromMeteorites : 0;
            window.UI_STATE.savedH2O = h2o_base + h2o_meteorites;
            if (window.PLOT_PANEL_READY) {
                window.UI_STATE.savedCO2 = window.plotData.co2_ppm;
                window.UI_STATE.savedCH4 = window.plotData.ch4_ppm;
            } else {
                window.UI_STATE.savedCO2 = 0;
                window.UI_STATE.savedCH4 = 0;
            }
            window.UI_STATE.maximiseData = true;
            goNextEpochViaSkip();
        });
        eventsLogos.appendChild(bigImpactBtn);
    } else {
            // Géologique (repli ACTION_BY_DATE) : action volcan 🗻/🌋 + tic temps 💫 / 🏔 / ⛰ (config)
            const wh = whRoot;
            const volcAct = (wh['🗻'] && wh['🗻']['🔺🍰⚽'] != null) ? '🗻' : (wh['🌋'] != null ? '🌋' : null);
            const volcCfg = volcAct ? wh[volcAct] : null;
            const ticResolved = resolveGeologicTicFromWh(wh);
            const ticKey = ticResolved.ticKey;
            const ticCfg = ticResolved.ticCfg;
            const showTicBtn = (volcCfg == null) || (ticCfg != null);

            const advanceGeologicTic = (D, stepMa, buttonKey) => {
                if (D['📜']['📿💫'] == null || !Number.isFinite(D['📜']['📿💫'])) D['📜']['📿💫'] = 0;
                D['📜']['📿💫'] += 1;
                if ((buttonKey === '💫' || buttonKey === '🏔' || buttonKey === '⛰') && ticCfg && Object.prototype.hasOwnProperty.call(ticCfg, '🍰⚽')) {
                    D['📜']['🔺🍰⚽'] = Number(ticCfg['🍰⚽']);
                    D['📜']['_veilTimelinePulseActive'] = false;
                }
                window.infoTimeMa += stepMa;
                clampInfoTimeMaToGeologicEpochDuration();
                if (tryEpochEndSkipAfterEvent(null)) return;
                window.COMPUTE.getEpochDateConfig();
                window.COMPUTE.getNoyau();
                if (!window.FLUX) window.FLUX = {};
                window.FLUX.yAxisRecalcOnNextFinish = true;
                window.IO_LISTENER.emit('config:applyThenCompute', { button: buttonKey });
                window.updateTimeline();
            };

            if (volcCfg) {
                const stepVeil = volcCfg['🔺🍰⚽'];
                const stepMaVolc = volcCfg['🔺⏳'];
                const volcBtn = document.createElement('button');
                volcBtn.type = 'button';
                volcBtn.className = 'icon-button btn-events organigram-logo organigram-action-logo';
                volcBtn.textContent = volcAct;
                // Tooltip = DESC du logo (Alphabet CHARS_DESC), pas de texte hardcodé (cf. handler order-based).
                const tip = (window.CHARS_DESC && window.CHARS_DESC[volcAct]) ? window.CHARS_DESC[volcAct] : volcAct;
                volcBtn.alt = tip;
                addEventTooltip(volcBtn, epochId, volcAct, tip);
                volcBtn.addEventListener('click', () => {
                    window.hideTooltip();
                    const D = window.DATA;
                    if (Number.isFinite(stepVeil)) D['📜']['🔺🍰⚽'] = Math.min(0.95, (D['📜']['🔺🍰⚽'] || 0) + stepVeil);
                    advanceGeologicTic(D, stepMaVolc, volcAct);
                });
                eventsLogos.appendChild(volcBtn);
            }
            if (showTicBtn) {
                const stepMa = (ticCfg && typeof ticCfg['🔺⏳'] === 'number') ? ticCfg['🔺⏳'] : 100;
                const stepLabel = formatStepLabel(stepMa);
                const ticBtn = document.createElement('button');
                ticBtn.type = 'button';
                ticBtn.className = 'icon-button btn-events organigram-logo organigram-action-logo';
                ticBtn.textContent = ticKey || '💫';
                ticBtn.alt = stepLabel;
                addEventTooltip(ticBtn, epochId, ticKey || '💫', stepLabel + ' par clic');
                if (epochId === '🔥') {
                    ticBtn.addEventListener('click', () => {
                        window.hideTooltip();
                        if (!window.FLUX) window.FLUX = {};
                        window.FLUX.yAxisRecalcOnNextFinish = true;
                        const cellTerre = document.getElementById('cell-terre');
                        if (cellTerre) {
                            const canvas = cellTerre.querySelector('canvas');
                            if (canvas && canvas._threeJSData && canvas._threeJSData.sphere) {
                                window.savedPlanetRotationY = canvas._threeJSData.sphere.rotation.y;
                            }
                        }
                        const durMaTb = window.getCurrentEpochDurationMa();
                        if (durMaTb == null || !Number.isFinite(durMaTb)) throw new Error('[events.js] getCurrentEpochDurationMa requis pour tic temps 🔥 (ACTION_BY_DATE)');
                        window.infoTimeMa = (window.infoTimeMa || 0) + stepMa;
                        if (window.infoTimeMa > durMaTb) window.infoTimeMa = durMaTb;
                        window.DATA['📜']['bary'] = durMaTb > 0 ? window.infoTimeMa / durMaTb : 0;
                        if (tryEpochEndSkipAfterEvent(null)) return;
                        window.updateTimeline();
                        window.updateHadeenTexture();
                        applyHadeenFluxFromConfig();
                        window.COMPUTE.getEpochDateConfig();
                        window.COMPUTE.getNoyau();
                        if (!window.FLUX) window.FLUX = {};
                        window.FLUX.yAxisRecalcOnNextFinish = true;
                        window.IO_LISTENER.emit('config:applyThenCompute', { button: ticKey || '💫' });
                        checkDateEvents();
                    });
                } else {
                    ticBtn.addEventListener('click', () => {
                        window.hideTooltip();
                        advanceGeologicTic(window.DATA, stepMa, ticKey || '💫');
                    });
                }
                eventsLogos.appendChild(ticBtn);
            }
    }
};

// Fonction pour vérifier les événements automatiques selon la date
function checkDateEvents() {
    const currentEpoch = window.RUNTIME_STATE.currentEpochName || '';
    if (currentEpoch !== 'Corps Noir') return;
    if (!window.isPastCurrentEpochEndMa()) return;

    window.hideTooltip();
    const h2o_base = window.RUNTIME_STATE.h2oVaporPercent != null ? window.RUNTIME_STATE.h2oVaporPercent : 0;
    const h2o_meteorites = window.RUNTIME_STATE.h2oTotalFromMeteorites != null ? window.RUNTIME_STATE.h2oTotalFromMeteorites : 0;
    window.UI_STATE.savedH2O = h2o_base + h2o_meteorites;
    if (window.PLOT_PANEL_READY) {
        window.UI_STATE.savedCO2 = window.plotData.co2_ppm;
        window.UI_STATE.savedCH4 = window.plotData.ch4_ppm;
    } else {
        window.UI_STATE.savedCO2 = 0;
        window.UI_STATE.savedCH4 = 0;
    }
    window.UI_STATE.maximiseData = true;
    goNextEpochViaSkip();
}

// Exposer checkDateEvents globalement
window.checkDateEvents = checkDateEvents;

window.tryEpochEndSkipAfterEvent = tryEpochEndSkipAfterEvent;
window.epochOrderCursor = orderCursor;


