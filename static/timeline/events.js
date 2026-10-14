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
 * Copyright 2025 DNAvatar.org - Arnaud Maignan
 * Licensed under Apache License 2.0 with Commons Clause.
* See https://commonsclause.com/ for full terms.

 *   - Initial version: extraction de updateEpochActions depuis main.js
 *   - Corps noir météorite: config via 🕰.☄️, id époque DATA['📜']['🗿'], getEpochDateConfig + runComputeInParent + 📿☄️
 *   - switch(epochId) ⚫/🔥/default; config unique ▶/◀/🔺🧲🌕💫; getEpochConfigById; applyHadeenFluxFromConfig; plus de corps-noir/hadeen
 *   - TicTime logo comme action pour toutes les époques; météorite de glace uniquement Corps noir (⚫) et Hadéen (🔥)
 *   - ⚫ sans TicTime (Météorite + Impact uniquement); default (Archéen+) TicTime affiché sans condition 🕰.💫
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
