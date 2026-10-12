/* File: events.js - Gestion des événements de la timeline
 * Desc: Logique pour créer et gérer les boutons d'événements selon l'époque géologique
 * Version 1.3.1
 *   - v1.3.1: jouerClic passe en animation (tictime : T conservée) — après un clic sur la frise, les clics d'événement
 *     repartaient de la graine.
 * Date: 2026-10-12
 * Copyright 2026 DNAvatar.org - Arnaud Maignan
* logs :
 *   - v1.3.0: l'EFFET d'un clic vient de CLICS.jouer (API_BILAN/convergence/clics.js), la mécanique que joue aussi
 *     le banc : un seul gestionnaire jouerClic au lieu de 9 copies (☄️ ×4, 🎇 ×2, volcans ×2, tics ×5), qui ne
 *     s'accordaient pas (☄️ de 🔥 sans calcul et eau d'affichage ×10 « min 2,1 % », 🔺⚖️💧 jamais lu, voile
 *     posé par l'un et pas par l'autre). Passage d'époque = ce que rend CLICS.jouer : fin de
 *     tryEpochEndSkipAfterEvent, du clamp à « marge » TIMELINE_END_SLACK_MA (règle différente du moteur), du verrou
 *     et de checkDateEvents. 📱 : tranche = CLICS.trancheActive(). Ici ne reste que la présentation.
 *     Le bouton proposé = CLICS.prochaineAction (🕰.order de la config API) : fin de ACTION_BY_DATE (CO2).
 *   - v1.2.41: pas de clic affiché à 1 décimale (formatStepLabel partout, météorites comprises).
 *   - v1.2.40: plus aucune écriture de flux géothermique (applyHadeenFluxFromConfig retirée) : l'intérieur a une
 *     histoire thermique (API_BILAN/geology/interieur.js), le clic ne fait qu'avancer la date.
 *   - v1.2.39: clic tic de 🔥 — compte 📿💫 (clicTicHadeen, un seul gestionnaire au lieu de 4 copies) : le flux du
 *     noyau baisse linéairement ▶ → ◀ (getNoyau) et la T° de l'Hadéen redescend à chaque clic. getEpochConfigById
 *     rend l'entrée TIMELINE (référence unique) et non plus une copie d'epochIndex() : le geothermal_flux qu'on y
 *     écrivait se perdait (copie depuis février : { ...item } du loader, puis epochIndex). Plus d'interpolation log.
 *   - v1.2.38: getEpochConfigById lit window.epochIndex() (API) au lieu de configOrganigramme.timeline — une
 *     dépendance de moins à l'organigramme pour les pages qui n'en ont pas. getActionForDate y reste (c'est du rendu).
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

// Core globals requis : addCustomTooltip, hideTooltip, togglePlotAnim (passage animé), updateTimeline,
// updateHadeenTexture, getLogoImageSrc, configOrganigramme, CLICS, IO_LISTENER, DATA, TIMELINE.

/** Titre de la cellule d'événements (#cell-timeline-scenario-logos) : « EVENEMENT », ou « FIN DE SIMULATION »
 *  quand 📱 a atteint ◀ (2100) et n'a plus rien à proposer. */
function setEventsHeading(text) {
    const h = document.querySelector('#cell-timeline-scenario-logos .flux-label.organigram-config-heading');
    if (h.innerHTML !== text) h.innerHTML = text;
}

/**
 * Tooltip d'un bouton d'événement, avec alt2sec VIVANT.
 * Le récit dépend de l'état courant (📿💫, masses, date) : il ne peut pas être figé à la création du bouton,
 * sinon une époque à plusieurs clics (🦣 : glaciaire → interglaciaire → glaciaire) raconte le premier clic
 * pour tous les suivants. buildEventAlt2sec est donc rejoué à chaque survol, avant que tooltips.js ne lise
 * data-alt2sec (il le lit dans son setTimeout, après le mouseenter).
 */
function addEventTooltip(el, eventKey, shortText) {
    el.setAttribute('data-event-key', eventKey);
    window.addCustomTooltip(el, shortText, window.buildEventAlt2sec(window.DATA['📜']['🗿'], eventKey));
    const refresh = function () {
        const txt = window.buildEventAlt2sec(window.DATA['📜']['🗿'], eventKey);
        if (txt) el.setAttribute('data-alt2sec', txt);
        else el.removeAttribute('data-alt2sec');
    };
    el.addEventListener('mouseenter', refresh);
    el.addEventListener('focus', refresh);
}

/** Pas d'un clic : +N ans sur l'échelle récente, sinon +X Ma (1 décimale). */
function formatStepLabel(stepMa) {
    if (stepMa < 0.001) return '+' + Math.round(stepMa * 1e6) + ' ans';
    if (stepMa < 1) return '+' + Math.round(stepMa * 1e3) + ' ka';
    return '+' + (Math.round(stepMa * 10) / 10) + ' Ma';
}

/** Masse en kg, notation scientifique : +6.8x10<sup>18</sup> kg. */
function formatMass(mass_kg) {
    const parts = mass_kg.toExponential(1).split('e');
    return '+' + parts[0] + 'x10<sup>' + parts[1].replace('+', '') + '</sup> kg';
}

// Masse en tonnes, avec un VRAI préfixe SI — les préfixes ne s'empilent pas : « kGt » n'existe pas
// (kilo × giga = téra, donc l'ancien « 320 kGT » se dit 320 Tt). 1 Gt = 10⁹ t = 10¹² kg.
//   Gt gigatonne 10¹² kg · Tt tératonne 10¹⁵ kg · Pt pétatonne 10¹⁸ kg · Et exatonne 10²¹ kg
function formatMassGT(mass_kg) {
    const paliers = [
        { seuil: 1e21, unite: 'Et' },
        { seuil: 1e18, unite: 'Pt' },
        { seuil: 1e15, unite: 'Tt' },
        { seuil: 1e12, unite: 'Gt' }
    ];
    for (const p of paliers) {
        if (mass_kg >= p.seuil) return '+' + (mass_kg / p.seuil).toFixed(1).replace(/\.?0+$/, '') + ' ' + p.unite;
    }
    return '+' + (mass_kg / 1e9).toFixed(1).replace(/\.?0+$/, '') + ' Mt';
}

/**
 * LE clic d'action de l'interface. L'effet sur l'état est celui de CLICS.jouer (le même que le banc) ;
 * ici seulement ce qui est propre à l'écran : bulle, axe Y, frise, texture, rendu des boutons, et le calcul
 * (config:applyThenCompute → runComputeInParent, en animation : T° présente conservée).
 * Fin d'époque atteinte (ou ⏩ de 🎇) : passage animé (togglePlotAnim → setEpoch → CLICS.passer → calcul).
 */
function jouerClic(key) {
    window.hideTooltip();
    window.FLUX.yAxisRecalcOnNextFinish = true;
    // Un clic d'événement est un tictime : la T présente est conservée (animation), comme au banc. Seul le clic sur
    // la frise repart de la graine (setEpochFromEpochButton remet 🔘🎞 à false).
    window.DATA['🔘']['🔘🎞'] = true;
    const r = window.CLICS.jouer(key);
    if (r.passage !== null) {
        // Plus de bouton pendant l'animation du curseur (~400 ms) : un second clic rejouerait sur l'époque quittée.
        document.getElementById('timeline-events-logos').innerHTML = '';
        window.togglePlotAnim();
        return;
    }
    window.IO_LISTENER.emit('config:applyThenCompute', { button: key });
    window.updateTimeline();
    window.updateHadeenTexture();
    window.updateEpochActions();
}

/** Un bouton d'action (rendu seul ; le clic va à jouerClic). */
function boutonAction(key, cfg) {
    let el;
    let court;
    if (key === '☄️' || key === '🎇') {
        el = document.createElement('img');
        el.src = window.getLogoImageSrc(key);
        el.className = 'btn-events organigram-logo organigram-action-logo';
        if (key === '☄️') {
            const m = cfg['🔺⚖️💧☄️'];
            court = 'Météorite de glace<br>' + (m >= 1e12 ? formatMassGT(m) : formatMass(m)) + '<br>' + formatStepLabel(window.CLICS.pas(key)) + ' pour ce clic';
            el.alt = 'Météorite de Glace ' + formatStepLabel(window.CLICS.pas(key));
        } else {
            court = 'Impact majeur - Crée la lune';
            el.alt = '';
        }
    } else {
        el = document.createElement('button');
        el.type = 'button';
        el.className = 'icon-button btn-events organigram-logo organigram-action-logo';
        el.textContent = key;
        if (window.CLICS.TICS.includes(key)) {
            el.alt = formatStepLabel(window.CLICS.pas(key));
            court = el.alt + ' pour ce clic';
        } else {
            // 🗻 / 🌋 : bulle = DESC du logo dans l'Alphabet (source unique), pas de texte par action.
            el.alt = window.CHARS_DESC[key];
            court = el.alt;
        }
    }
    addEventTooltip(el, key, court);
    el.addEventListener('click', function () { jouerClic(key); });
    return el;
}

/** Bouton d'une tranche 📱 (⛽ 🛢 🪾) : +N ans, +M Gt CO₂. */
function boutonTranche(key, cfg) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'icon-button btn-events organigram-logo btn-year-indexed organigram-action-logo';
    el.textContent = key;
    el.alt = '+' + Math.round(cfg['🔺⏳'] * 1e6) + 'ans +' + Math.round(cfg['🔺⚖️🏭'] / 1e12) + 'Gt CO2';
    addEventTooltip(el, key, key + ' ' + el.alt);
    el.addEventListener('click', function () { jouerClic(key); });
    return el;
}

/**
 * Les boutons d'action de l'époque courante — affichage seul, la séquence est la config de l'API :
 *  - 📱 : les actions de la tranche active (CLICS.trancheActive), « FIN DE SIMULATION » passé ◀ ;
 *  - sinon : l'action suivante de 🕰.order (CLICS.prochaineAction).
 */
window.updateEpochActions = function () {
    window.refreshTimelineEpochBounds();
    const eventsLogos = document.getElementById('timeline-events-logos');
    const W = window.TIMELINE[window.DATA['📜']['👉']]['🕰'];
    const parTranche = window.CLICS.parTranche();

    // 🎞 SKIP : masqué sur 📱 (pas d'époque suivante) et quand l'époque se traverse en un clic.
    document.getElementById('plot-anim-toggle').classList.toggle('plot-anim-toggle--scenario-hidden', parTranche || W.order.length <= 1);

    eventsLogos.innerHTML = '';
    eventsLogos.classList.toggle('year-indexed', parTranche);
    setEventsHeading('EVENEMENT');

    if (parTranche) {
        const tranche = window.CLICS.trancheActive();
        if (tranche === null) {
            setEventsHeading('FIN DE SIMULATION');
            return;
        }
        Object.keys(tranche).forEach(function (k) { eventsLogos.appendChild(boutonTranche(k, tranche[k])); });
        return;
    }
    const act = window.CLICS.prochaineAction();
    if (act !== undefined) eventsLogos.appendChild(boutonAction(act, W[act]));
};
