/* File: events.js - Gestion des événements de la timeline
 * Desc: Logique pour créer et gérer les boutons d'événements selon l'époque géologique
 * Version 1.2.4
 * Date: [March 14, 2026]
* logs :
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
 *   - Initial version: extraction de updateEpochActions depuis main.js
 *   - Corps noir météorite: config via 🕰.☄️, id époque DATA['📜']['🗿'], getEpochDateConfig + runComputeInParent + 📿💫
 *   - switch(epochId) ⚫/🔥/default; config unique ▶/◀/🔺🧲🌕💫; getEpochConfigById; applyHadeenFluxFromConfig; plus de corps-noir/hadeen
 *   - TicTime logo comme action pour toutes les époques; météorite de glace uniquement Corps noir (⚫) et Hadéen (🔥)
 *   - ⚫ sans TicTime (Météorite + Impact uniquement); default (Archéen+) TicTime affiché sans condition 🕰.💫
 *   - v1.2.3: 💫 alt/tooltip = vraie valeur (formatStepLabel), tooltip une seule ligne (plus de <br>)
 *   - v1.2.3: Hadeen ticTime handler : check transition (infoTimeMa>=500) AVANT updateHadeenTexture/updateCO2Level
 *   - v1.2.4: DATA[📜][bary] = infoTimeMa/500 après chaque tic Hadéen (interpolation visuelle radius/exobase/noyau)
 *   - v1.2.5: 2 boutons uniquement (🎞 + un selon date) ; ACTION_BY_DATE + getActionForDate(startYears, infoTimeMa) ; bloc ACTION en haut timeline
 */

// Core globals requis : addCustomTooltip, hideTooltip, setEpoch, getEpochDateConfig, getNoyau, runComputeInParent, updateTimeline, updateHadeenTexture, updateH2OLevelDirect, getLogoImageSrc, configOrganigramme, DATA.
// Module plot optionnel : géré par window.PLOT_PANEL_READY (main.js), accès en blocs if (window.PLOT_PANEL_READY) { ... window.plotData ... }.

// Fonction pour mettre à jour les actions disponibles selon l'époque
// Un seul 2e bouton (après 🎞) : déterminé par configOrganigramme.ACTION_BY_EPOCH[epochId] → '☄️' | '🎇' | '💫'
window.updateEpochActions = function () {
    const eventsLogos = document.getElementById('timeline-events-logos');
    if (!eventsLogos) return;

    eventsLogos.innerHTML = '';

    const currentEpochName = window.currentEpochName || 'Corps Noir';
    const getEpochConfigById = (id) => (window.configOrganigramme && window.configOrganigramme.timeline)
        ? window.configOrganigramme.timeline.find(e => e.type === 'epoch' && e.id === id) : null;
    const epochId = window.DATA && window.DATA['📜'] && window.DATA['📜']['🗿'] != null ? window.DATA['📜']['🗿'] : '';
    const timelineEpoch = getEpochConfigById(epochId);
    const startYears = timelineEpoch && timelineEpoch['▶'] != null ? timelineEpoch['▶'] : 5e9;
    const infoTimeMa = (window.infoTimeMa != null ? window.infoTimeMa : 0);

    // 🎞 "prochaine époque" invisible si l'époque a un scénario d'émissions 🏭📊 (📱 et futurs)
    // ⚠️ On ne peut PAS utiliser ▶ >= 2000 : les époques géologiques ont ▶ = 5e9, 4.5e9… (années écoulées, >> 2000)
    const animToggleBtn = document.getElementById('plot-anim-toggle');
    if (animToggleBtn) {
        const _tlEpochVis = window.TIMELINE ? window.TIMELINE.find(function(e) { return e['📅'] === epochId; }) : null;
        const _hasEmissions = _tlEpochVis && _tlEpochVis['🏭📊'] && Array.isArray(_tlEpochVis['🏭📊'].tranches);
        animToggleBtn.style.visibility = _hasEmissions ? 'hidden' : '';
    }
    const getActionForDate = (window.configOrganigramme && window.configOrganigramme.getActionForDate) || (() => '💫');
    const actionId = getActionForDate(startYears, infoTimeMa);

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

    // Un seul 2e bouton : actionId = ☄️ | 🎇 | 💫 (ACTION_BY_EPOCH)
    if (actionId === '☄️') {
        const epochConfig = getEpochConfigById(epochId);
        if (epochConfig && epochConfig['🕰'] && epochConfig['🕰']['☄️']) {
            const iceMeteorBtn = document.createElement('img');
            iceMeteorBtn.src = window.getLogoImageSrc('☄️') || 'fonts/pics/ice_meteorite.png';
            iceMeteorBtn.alt = '';
            iceMeteorBtn.className = 'timeline-event-logo btn-events';
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
                window.h2oTotalFromMeteorites = newH2O;
                window.h2oIceFractionFromCalculation = undefined;
                window.isIceChange = true;
                window.lastIceLevel = undefined;
                DATA['📜']['📿☄️'] += 1;
                window.infoTimeMa += stepMa;
                window.getNoyau();
                if (!window.FLUX) window.FLUX = {};
                window.FLUX.yAxisRecalcOnNextFinish = true;
                window.IO_LISTENER.emit('config:applyThenCompute', { button: '☄️' });
                window.updateTimeline();
                checkDateEvents();
                const h2o_total = newH2O + (window.h2oVaporPercent != null ? window.h2oVaporPercent : 0);
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
                    window.h2oTotalFromMeteorites = newH2O;
                    window.h2oIceFractionFromCalculation = undefined;
                    DATA['📜']['📿☄️'] += 1;
                    window.infoTimeMa = Math.min(500, window.infoTimeMa + stepMa);
                    applyHadeenFluxFromConfig();
                    if (!window.FLUX) window.FLUX = {};
                    window.FLUX.yAxisRecalcOnNextFinish = true;
                    window.updateTimeline();
                    window.updateHadeenTexture();
                    checkDateEvents();
                    if (window.infoTimeMa >= 500) window.setEpoch('Archéen');
                    const h2o_total = newH2O + (window.h2oVaporPercent != null ? window.h2oVaporPercent : 0);
                    window.updateH2OLevelDirect(h2o_total);
                });
            }
            eventsLogos.appendChild(iceMeteorBtn);
        }
    } else if (actionId === '🎇') {
        const epochConfig = getEpochConfigById(epochId);
        const targetFromConfig = epochConfig && epochConfig['🕰'] && epochConfig['🕰']['🎇'] && epochConfig['🕰']['🎇']['⏩'];
        const idToName = { '⚫': 'Corps Noir', '🔥': 'Hadéen', '🦠': 'Archéen', '🦕': 'Mésozoïque', '🌿': 'Paléozoïque', '🦣': 'Cénozoïque', '🏔': 'EOT (33,9 Ma)', '🚂': 'Industriel', '📱': 'Aujourd\'hui' };
        const targetName = targetFromConfig ? (idToName[epochConfig['🕰']['🎇']['⏩']] || epochConfig['🕰']['🎇']['⏩']) : 'Hadéen';
        const bigImpactBtn = document.createElement('img');
        bigImpactBtn.src = window.getLogoImageSrc('🎇') || 'fonts/pics/big_impact.png';
        bigImpactBtn.alt = '';
        bigImpactBtn.className = 'timeline-event-logo btn-events';
        window.addCustomTooltip(bigImpactBtn, 'Impact majeur - Crée la lune');
        bigImpactBtn.addEventListener('click', () => {
            window.hideTooltip();
            const h2o_base = window.h2oVaporPercent != null ? window.h2oVaporPercent : 0;
            const h2o_meteorites = window.h2oTotalFromMeteorites != null ? window.h2oTotalFromMeteorites : 0;
            window.savedH2O = h2o_base + h2o_meteorites;
            if (window.PLOT_PANEL_READY) {
                window.savedCO2 = window.plotData.co2_ppm;
                window.savedCH4 = window.plotData.ch4_ppm;
            } else {
                window.savedCO2 = 0;
                window.savedCH4 = 0;
            }
            window.maximiseData = true;
            window.setEpoch(targetName);
        });
        eventsLogos.appendChild(bigImpactBtn);
    } else {
        // 💫/🛢 TicTime — détection dynamique : 🛢 pour 📱 (scénario émissions), 💫 pour géologiques
        const epoch = window.configOrganigramme && window.configOrganigramme.timeline
            ? window.configOrganigramme.timeline.find(e => e.type === 'epoch' && (e.name === currentEpochName || e.id === epochId))
            : null;
        // Cherche la clé tic active (🛢 ou 💫) dans l'époque TIMELINE réelle
        const _tlEpoch = window.TIMELINE ? window.TIMELINE.find(e => e['📅'] === epochId) : null;
        const _ticKey = (_tlEpoch && _tlEpoch['🕰'] && _tlEpoch['🕰']['🛢']) ? '🛢' : '💫';
        const ticCfg = _tlEpoch && _tlEpoch['🕰'] && _tlEpoch['🕰'][_ticKey] ? _tlEpoch['🕰'][_ticKey] : null;
        const stepMa = ticCfg && typeof ticCfg['🔺⏳'] === 'number' ? ticCfg['🔺⏳'] : 100;
        const _ctrKey = '📿' + _ticKey; // '📿🛢' ou '📿💫'
        {
            const stepLabel = formatStepLabel(stepMa);
            const ticBtn = document.createElement('button');
            ticBtn.type = 'button';
            ticBtn.className = 'icon-button btn-events timeline-event-logo';
            ticBtn.textContent = _ticKey; // '🛢' pour 📱, '💫' pour géologiques
            // Calcule le label Gt pour le prochain tic (🛢) ou le pas Ma (💫)
            const buildGtAlt = () => {
                if (_tlEpoch && _tlEpoch['🏭📊'] && Array.isArray(_tlEpoch['🏭📊'].tranches)) {
                    const tics = (window.DATA && window.DATA['📜'] && window.DATA['📜'][_ctrKey] != null) ? window.DATA['📜'][_ctrKey] : 0;
                    const dtYr = stepMa * 1e6;
                    const curYr = (_tlEpoch['▶'] || 0) + tics * dtYr;
                    const nextYr = curYr + dtYr;
                    let totalGt = 0;
                    for (const tr of _tlEpoch['🏭📊'].tranches) {
                        if (curYr < tr.to && nextYr > tr.from) {
                            const overlap = Math.min(nextYr, tr.to) - Math.max(curYr, tr.from);
                            const span = tr.to - tr.from;
                            totalGt += span > 0 ? tr.Gt * overlap / span : tr.Gt;
                        }
                    }
                    if (totalGt > 0) return '+' + Math.round(totalGt) + ' Gt CO\u2082';
                }
                return stepLabel;
            };
            ticBtn.alt = buildGtAlt();
            window.addCustomTooltip(ticBtn, ticBtn.alt + ' (' + stepLabel + ' par clic)');
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
                    window.infoTimeMa = (window.infoTimeMa || 0) + stepMa;
                    if (window.infoTimeMa > 500) window.infoTimeMa = 500;
                    window.DATA['📜']['bary'] = window.infoTimeMa / 500;
                    if (window.infoTimeMa >= 500) {
                        window.setEpoch('Archéen');
                        return;
                    }
                    window.updateTimeline();
                    window.updateHadeenTexture();
                    applyHadeenFluxFromConfig();
                    if (window.PLOT_PANEL_READY) {
                        const current_co2_fraction = window.plotData.co2_ppm * 1e-6;
                        window.updateCO2LevelDirect(current_co2_fraction);
                    }
                    checkDateEvents();
                });
            } else {
                ticBtn.addEventListener('click', () => {
                    window.hideTooltip();
                    const D = window.DATA;
                    // Incrémente le bon counter (📿🛢 ou 📿💫) selon l'époque
                    if (D['📜'][_ctrKey] == null || !Number.isFinite(D['📜'][_ctrKey])) D['📜'][_ctrKey] = 0;
                    D['📜'][_ctrKey] += 1;
                    window.infoTimeMa += stepMa;
                    ticBtn.alt = buildGtAlt(); // met à jour le label Gt pour la prochaine période
                    if (window.addCustomTooltip) window.addCustomTooltip(ticBtn, ticBtn.alt + ' (' + stepLabel + ' par clic)');
                    window.getNoyau();
                    if (!window.FLUX) window.FLUX = {};
                    window.FLUX.yAxisRecalcOnNextFinish = true;
                    window.IO_LISTENER.emit('config:applyThenCompute', { button: _ticKey });
                    window.updateTimeline();
                });
            }
            eventsLogos.appendChild(ticBtn);
        }
    }
};

// Fonction pour vérifier les événements automatiques selon la date
function checkDateEvents() {
    const currentEpoch = window.currentEpochName || '';
    const infoTimeMa = window.infoTimeMa || 0;
    if (currentEpoch !== 'Corps Noir' || infoTimeMa < 500) return;

    window.hideTooltip();
    const h2o_base = window.h2oVaporPercent != null ? window.h2oVaporPercent : 0;
    const h2o_meteorites = window.h2oTotalFromMeteorites != null ? window.h2oTotalFromMeteorites : 0;
    window.savedH2O = h2o_base + h2o_meteorites;
    if (window.PLOT_PANEL_READY) {
        window.savedCO2 = window.plotData.co2_ppm;
        window.savedCH4 = window.plotData.ch4_ppm;
    } else {
        window.savedCO2 = 0;
        window.savedCH4 = 0;
    }
    window.maximiseData = true;
    window.setEpoch('Hadéen');
}

// Exposer checkDateEvents globalement
window.checkDateEvents = checkDateEvents;


