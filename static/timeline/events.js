/* File: events.js - Gestion des événements de la timeline
 * Desc: Logique pour créer et gérer les boutons d'événements selon l'époque géologique
 * Version 1.2.30
 * Date: [May 07, 2026]
* logs :
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
    if (runPopOrder) runPopOrder();
    goNextEpochViaSkip();
    return true;
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
        const _hasEmissions = Object.keys(whRoot).some(function(k) { return !isNaN(Number(k)); });
        const orderArr = Array.isArray(whRoot.order) ? whRoot.order : null;
        const orderedActionCount = orderArr !== null ? orderArr.length : null;
        const directActionCount = ['☄️', '🎇', '🌋', '💫', '🏔', '⛰'].filter(function(k) { return whRoot[k] != null; }).length;
        const actionCount = orderedActionCount !== null ? orderedActionCount : directActionCount;
        const hideSkip = _hasEmissions || actionCount <= 1;
        animToggleBtn.classList.toggle('plot-anim-toggle--scenario-hidden', hideSkip);
        animToggleBtn.style.removeProperty('visibility');
    }

    if (!eventsLogos) return;

    eventsLogos.innerHTML = '';

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
    
    // Fonction utilitaire pour formater la masse en GT (Gigatonnes)
    // 1 GT = 1e12 kg = 10¹² kg
    const formatMassGT = (mass_kg) => {
        if (!mass_kg || mass_kg <= 0) return '';
        const mass_GT = mass_kg / 1e12; // Conversion kg -> GT
        if (mass_GT >= 1e6) {
            // Millions de GT
            const millionsGT = (mass_GT / 1e6).toFixed(1).replace(/\.?0+$/, '');
            return `+${millionsGT} MGT`;
        } else if (mass_GT >= 1e3) {
            // Milliers de GT
            const milliersGT = (mass_GT / 1e3).toFixed(1).replace(/\.?0+$/, '');
            return `+${milliersGT} kGT`;
        } else {
            // GT simples
            const gt = mass_GT.toFixed(1).replace(/\.?0+$/, '');
            return `+${gt} GT`;
        }
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
            const actions = _tlEpoch['🕰'][activeYr];

            if (actions) {
                for (const [emoji, cfg] of Object.entries(actions)) {
                    const co2kg = cfg['🔺⚖️🏭'] || 0;
                    const dtYr = (cfg['🔺⏳'] || 0.000025) * 1e6;
                    const dtYrDisp = Math.round(dtYr);
                    // Gt d’affichage : co2kg/1e9 (ex. 850e9 kg → 850 Gt) — /1e12 donnait ~0 pour ces deltas
                    const gtDisp = Math.round(co2kg / 1e9);

                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'icon-button btn-events organigram-logo btn-year-indexed organigram-action-logo';
                    btn.textContent = emoji;
                    const altText = '+' + dtYrDisp + 'ans +' + gtDisp + 'Gt CO2';
                    btn.alt = altText;
                    if (window.addCustomTooltip) window.addCustomTooltip(btn, emoji + ' ' + altText);

                    btn.addEventListener('click', () => {
                        window.hideTooltip();
                        const D = window.DATA;
                        // CO₂ : delta pending consommé par getMasses()
                        D['📜']['🔺⚖️🏭'] = co2kg;
                        // Temps (📿💫 = compteur universel)
                        D['📜']['📿💫'] = (D['📜']['📿💫'] || 0) + 1;
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

    if (_tlEpoch && whRoot && Array.isArray(whRoot.order) && whRoot.order.length) {
        const wh = whRoot;
        const ticRootResolved = resolveGeologicTicFromWh(wh);
        const ticCfgRoot = ticRootResolved.ticCfg;
        /** Une entrée consommée dans 🕰.order : un seul shift si la tête correspond à l’action réellement jouée (pas de boucle sur 🔘🕰 à chaque frame). */
        const popOrderAfterAction = (actedKey) => {
            const ord = _tlEpoch['🕰'] && _tlEpoch['🕰'].order;
            if (!Array.isArray(ord) || ord.length === 0) return;
            if (ord[0] !== actedKey) return;
            ord.shift();
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

        const act = wh.order[0];
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
                window.addCustomTooltip(iceMeteorBtn, 'Météorite de glace<br>' + mass_added_txt + '<br>+' + stepMaM + ' Ma par clic');
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
                window.addCustomTooltip(bigImpactBtn, 'Impact majeur - Crée la lune');
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
            } else if (act === '🌋') {
                const stepVeil = cfg['🔺🍰⚽'];
                const stepMaVolc = cfg['🔺⏳'];
                const volcBtn = document.createElement('button');
                volcBtn.type = 'button';
                volcBtn.className = 'icon-button btn-events organigram-logo organigram-action-logo';
                volcBtn.textContent = '🌋';
                const pctStr = (stepVeil * 100).toFixed(1);
                volcBtn.alt = "Hiver volcanique : l'écran de poussière bloque 2% du rayonnement solaire. (+30 Ma)";
                window.addCustomTooltip(volcBtn, "Hiver volcanique : l'écran de poussière bloque 2% du rayonnement solaire. (+30 Ma)");
                volcBtn.addEventListener('click', () => {
                    window.hideTooltip();
                    const D = window.DATA;
                    D['📜']['🔺🍰⚽'] = Math.min(0.95, D['📜']['🔺🍰⚽'] + stepVeil);
                    advanceGeologicTicOrder(D, stepMaVolc, '🌋');
                });
                eventsLogos.appendChild(volcBtn);
            } else if (act === '💫') {
                const stepMaT = (ticCfgRoot && typeof ticCfgRoot['🔺⏳'] === 'number') ? ticCfgRoot['🔺⏳'] : 100;
                const stepLabel = formatStepLabel(stepMaT);
                const ticBtn = document.createElement('button');
                ticBtn.type = 'button';
                ticBtn.className = 'icon-button btn-events organigram-logo organigram-action-logo';
                ticBtn.textContent = '💫';
                ticBtn.alt = stepLabel;
                window.addCustomTooltip(ticBtn, stepLabel + ' par clic');
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
                const stepMaT = (cfg && typeof cfg['🔺⏳'] === 'number') ? cfg['🔺⏳'] : 100;
                const stepLabel = formatStepLabel(stepMaT);
                const ticBtn = document.createElement('button');
                ticBtn.type = 'button';
                ticBtn.className = 'icon-button btn-events organigram-logo organigram-action-logo';
                ticBtn.textContent = '🏔';
                ticBtn.alt = stepLabel;
                window.addCustomTooltip(ticBtn, stepLabel + ' par clic');
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
                const stepMaT = (cfg && typeof cfg['🔺⏳'] === 'number') ? cfg['🔺⏳'] : 100;
                const stepLabel = formatStepLabel(stepMaT);
                const ticBtn = document.createElement('button');
                ticBtn.type = 'button';
                ticBtn.className = 'icon-button btn-events organigram-logo organigram-action-logo';
                ticBtn.textContent = '⛰';
                ticBtn.alt = stepLabel;
                window.addCustomTooltip(ticBtn, stepLabel + ' par clic');
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
            window.addCustomTooltip(iceMeteorBtn, 'Météorite de glace<br>' + mass_added_txt + '<br>+' + stepMa + ' Ma par clic');
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
        window.addCustomTooltip(bigImpactBtn, 'Impact majeur - Crée la lune');
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
            // Géologique (repli ACTION_BY_DATE) : 🌋 + tic temps 💫 / 🏔 / ⛰ (config)
            const wh = whRoot;
            const volcCfg = wh['🌋'];
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
                volcBtn.textContent = '🌋';
                const pctStr = (stepVeil * 100).toFixed(1);
                volcBtn.alt = "Hiver volcanique : l'écran de poussière bloque 2% du rayonnement solaire. (+30 Ma)";
                window.addCustomTooltip(volcBtn, "Hiver volcanique : l'écran de poussière bloque 2% du rayonnement solaire. (+30 Ma)");
                volcBtn.addEventListener('click', () => {
                    window.hideTooltip();
                    const D = window.DATA;
                    D['📜']['🔺🍰⚽'] = Math.min(0.95, D['📜']['🔺🍰⚽'] + stepVeil);
                    advanceGeologicTic(D, stepMaVolc, '🌋');
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
                window.addCustomTooltip(ticBtn, stepLabel + ' par clic');
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


