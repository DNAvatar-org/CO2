/* File: events.js - Gestion des événements de la timeline
 * Desc: Logique pour créer et gérer les boutons d'événements selon l'époque géologique
 * Version 1.2.0
 * Date: [January 2025]
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
 */

// Core globals requis : addCustomTooltip, hideTooltip, setEpoch, getEpochDateConfig, getNoyau, runComputeInParent, updateTimeline, updateHadeenTexture, updateH2OLevelDirect, getLogoImageSrc, configOrganigramme, DATA.
// Module plot optionnel : géré par window.PLOT_PANEL_READY (main.js), accès en blocs if (window.PLOT_PANEL_READY) { ... window.plotData ... }.

// Fonction pour mettre à jour les actions disponibles selon l'époque
window.updateEpochActions = function () {
    const eventsLogos = document.getElementById('timeline-events-logos');
    if (!eventsLogos) return;

    eventsLogos.innerHTML = ''; // Vider les boutons existants

    const currentEpochName = window.currentEpochName || 'Corps noir';
    const getEpochConfigById = (id) => (window.configOrganigramme && window.configOrganigramme.timeline)
        ? window.configOrganigramme.timeline.find(e => e.type === 'epoch' && e.id === id) : null;

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

    switch (window.DATA && window.DATA['📜'] && window.DATA['📜']['🗿'] != null ? window.DATA['📜']['🗿'] : '') {
    case '⚫': {
        // Action 1 : Météorites de glace (augmente la glace à la surface, donc l'albedo)
        const iceMeteorBtn = document.createElement('img');
        iceMeteorBtn.src = window.getLogoImageSrc('☄️') || 'fonts/pics/ice_meteorite.png';
        iceMeteorBtn.alt = 'Météorite de glace';
        iceMeteorBtn.className = 'timeline-event-logo btn-events';

        let mass_added_txt = '';
        const epochConfig = getEpochConfigById('⚫');
        if (epochConfig && epochConfig['🕰'] && epochConfig['🕰']['☄️']) {
            const mass_kg = epochConfig['🕰']['☄️']['🔺⚖️💧☄️'];
            if (mass_kg >= 1e12) {
                mass_added_txt = formatMassGT(mass_kg);
            } else {
                mass_added_txt = formatMass(mass_kg);
            }
        }

        iceMeteorBtn.setAttribute('data-tooltip-initialized', 'true');
        window.addCustomTooltip(iceMeteorBtn, 'Météorite de glace<br>' + mass_added_txt);

        iceMeteorBtn.addEventListener('click', () => {
            const currentH2O = window.h2oTotalFromMeteorites != null ? window.h2oTotalFromMeteorites : 0;
            const EARTH_TOTAL_WATER_MASS_KG = 1.4e21;
            const mass_kg = (epochConfig && epochConfig['🕰'] && epochConfig['🕰']['☄️'])
                ? epochConfig['🕰']['☄️']['🔺⚖️💧☄️']
                : 2e19;
            const h2oToAdd = (mass_kg / EARTH_TOTAL_WATER_MASS_KG) * 100;
            const newH2O = Math.min(100, currentH2O + h2oToAdd);
            window.h2oTotalFromMeteorites = newH2O;

            window.h2oIceFractionFromCalculation = undefined;
            window.isIceChange = true;
            window.lastIceLevel = undefined;

            window.infoTimeMa = (window.infoTimeMa || 0) + 50;
            window.DATA['📜']['📿💫'] = (window.DATA['📜']['📿💫'] || 0) + 1;
            window.getEpochDateConfig();
            window.getNoyau();
            window.runComputeInParent();

            window.updateTimeline();
            checkDateEvents();

            const h2o_total = newH2O + (window.h2oVaporPercent != null ? window.h2oVaporPercent : 0);
            window.updateH2OLevelDirect(h2o_total);
        });
        eventsLogos.appendChild(iceMeteorBtn);

        // Action 2 : Impact majeur (création de la lune, passe à l'époque suivante)
        const bigImpactBtn = document.createElement('img');
        bigImpactBtn.src = window.getLogoImageSrc('🎇') || 'fonts/pics/big_impact.png';
        bigImpactBtn.alt = 'Impact majeur - Crée la lune';
        bigImpactBtn.className = 'timeline-event-logo btn-events';

        // Récupérer la donnée depuis la config
        let impact_flux_txt = '';
        const epochCorpsNoir = getEpochConfigById('⚫');
        if (epochCorpsNoir && epochCorpsNoir['🕰'] && epochCorpsNoir['🕰']['🎇']) {
            const flux = epochCorpsNoir['🕰']['🎇']['🧲☀️'];
            if (flux != null) {
                impact_flux_txt = flux >= 1000000 ? (flux / 1000000).toFixed(0) + ' MW/m²' : flux + ' W/m²';
            }
        }

        bigImpactBtn.setAttribute('data-tooltip-initialized', 'true');
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
            window.setEpoch('Hadéen');
        });
        eventsLogos.appendChild(bigImpactBtn);
        break; }
    case '🔥': {
        // Actions pour l'Hadéen : évolution temporelle vers l'Archéen
        // Après l'impact, la Terre se refroidit progressivement sur 200-500 Ma

        // Action 1 : Avancer dans le temps (refroidissement progressif) — icône et libellé depuis l'alphabet (TicTime)
        const timeAdvanceBtn = document.createElement('button');
        timeAdvanceBtn.textContent = window.CHARS.TIC_TIME;
        timeAdvanceBtn.className = 'timeline-event-logo btn-events';
        window.addCustomTooltip(timeAdvanceBtn, window.CHARS_DESC['💫']);

        timeAdvanceBtn.addEventListener('click', () => {
            // Sauvegarder l'angle de rotation AVANT de mettre à jour la texture
            const cellTerre = document.getElementById('cell-terre');
            if (cellTerre) {
                const canvas = cellTerre.querySelector('canvas');
                if (canvas && canvas._threeJSData && canvas._threeJSData.sphere) {
                    const savedRotationY = canvas._threeJSData.sphere.rotation.y;
                    window.savedPlanetRotationY = savedRotationY;
                    // Log supprimé (non essentiel)
                }
            }
            
            window.infoTimeMa = (window.infoTimeMa || 0) + 50;
            if (window.infoTimeMa > 450) window.infoTimeMa = 450;
            window.updateTimeline();
            window.updateHadeenTexture();
            applyHadeenFluxFromConfig();
            if (window.PLOT_PANEL_READY) {
                const current_co2_fraction = window.plotData.co2_ppm * 1e-6;
                window.updateCO2LevelDirect(current_co2_fraction);
            }
            checkDateEvents();
        });
        eventsLogos.appendChild(timeAdvanceBtn);

        // Action 2 : Apport d'eau supplémentaire (météorites continuent de tomber)
        const waterAdditionBtn = document.createElement('img');
        waterAdditionBtn.src = window.getLogoImageSrc('☄️') || 'fonts/pics/ice_meteorite.png';

        let mass_added_txt = '';
        const epochHadeen = getEpochConfigById('🔥');
        if (epochHadeen && epochHadeen['🕰'] && epochHadeen['🕰']['☄️']) {
            const mass_kg = epochHadeen['🕰']['☄️']['🔺⚖️💧☄️'];
            if (mass_kg >= 1e12) mass_added_txt = formatMassGT(mass_kg);
            else mass_added_txt = formatMass(mass_kg);
        }

        waterAdditionBtn.setAttribute('data-tooltip-initialized', 'true');
        window.addCustomTooltip(waterAdditionBtn, 'Météorite de glace<br>' + mass_added_txt);
        waterAdditionBtn.alt = 'Météorite de glace';
        waterAdditionBtn.className = 'timeline-event-logo btn-events';
        waterAdditionBtn.addEventListener('click', () => {
            const currentH2O = window.h2oTotalFromMeteorites != null ? window.h2oTotalFromMeteorites : 0;
            const EARTH_TOTAL_WATER_MASS_KG = 1.4e21;
            const mass_kg_h = (epochHadeen && epochHadeen['🕰'] && epochHadeen['🕰']['☄️']) ? epochHadeen['🕰']['☄️']['🔺⚖️💧☄️'] : 1e18;
            let h2oToAdd = (mass_kg_h / EARTH_TOTAL_WATER_MASS_KG) * 100;
            h2oToAdd = Math.max(h2oToAdd * 10, 2.1);

            const newH2O = Math.min(100, currentH2O + h2oToAdd);
            window.h2oTotalFromMeteorites = newH2O;
            window.h2oIceFractionFromCalculation = undefined;

            window.infoTimeMa = (window.infoTimeMa || 0) + 50;
            if (window.infoTimeMa > 450) window.infoTimeMa = 450;
            applyHadeenFluxFromConfig();
            window.updateTimeline();
            window.updateHadeenTexture();
            checkDateEvents();

            const h2o_total = newH2O + (window.h2oVaporPercent != null ? window.h2oVaporPercent : 0);
            window.updateH2OLevelDirect(h2o_total);
        });
        eventsLogos.appendChild(waterAdditionBtn);
        break; }
    default: {
        // Pour toutes les autres époques : boutons depuis 🕰 (comme dans scie_compute)
        const epoch = window.configOrganigramme && window.configOrganigramme.timeline
            ? window.configOrganigramme.timeline.find(e => e.type === 'epoch' && (e.name === currentEpochName || e.id === window.DATA['📜']['🗿']))
            : null;
        if (epoch && epoch['🕰']) {
            const getImagePath = (p) => (p.startsWith('http') || p.startsWith('/')) ? p : (p.indexOf('fonts/') === 0 ? '../' + p : 'fonts/pics/' + p.split(/[/\\]/).pop());
            if (epoch['🕰']['💫']) {
                const ticBtn = document.createElement('button');
                ticBtn.type = 'button';
                ticBtn.className = 'icon-button btn-events timeline-event-logo';
                ticBtn.textContent = window.CHARS.TIC_TIME;
                window.addCustomTooltip(ticBtn, window.CHARS_DESC['💫']);
                ticBtn.addEventListener('click', () => {
                    window.DATA['📜']['📿💫'] = (window.DATA['📜']['📿💫'] || 0) + 1;
                    window.getEpochDateConfig();
                    window.getNoyau();
                    window.runComputeInParent();
                });
                eventsLogos.appendChild(ticBtn);
            }
            if (epoch['🕰']['☄️']) {
                const meteorBtn = document.createElement('img');
                meteorBtn.src = window.getLogoImageSrc('☄️') || getImagePath('fonts/pics/ice_meteorite.png');
                meteorBtn.alt = 'Météorite';
                meteorBtn.className = 'timeline-event-logo btn-events';
                meteorBtn.title = 'Météorite de glace';
                meteorBtn.addEventListener('click', () => {
                    window.DATA['📜']['📿💫'] = (window.DATA['📜']['📿💫'] || 0) + 1;
                    window.getEpochDateConfig();
                    window.getNoyau();
                    window.runComputeInParent();
                });
                eventsLogos.appendChild(meteorBtn);
            }
            if (epoch['🕰']['🎇'] && epoch['🕰']['🎇']['⏩']) {
                const targetId = epoch['🕰']['🎇']['⏩'];
                const idToName = { '⚫': 'Corps noir', '🔥': 'Hadéen', '🦠': 'Archéen', '🦕': 'Mésozoïque', '🦴': 'Paléozoïque', '🦣': 'Cénozoïque', '🏔': 'EOT (33,9 Ma)', '🚂': 'Industriel', '📱': 'Aujourd\'hui' };
                const targetName = idToName[targetId] || targetId;
                const bigImpactBtn = document.createElement('img');
                bigImpactBtn.src = window.getLogoImageSrc('🎇') || getImagePath('fonts/pics/big_impact.png');
                bigImpactBtn.alt = 'Impact majeur';
                bigImpactBtn.className = 'timeline-event-logo btn-events';
                bigImpactBtn.title = 'Impact majeur';
                bigImpactBtn.addEventListener('click', () => {
                    window.setEpoch(targetName);
                });
                eventsLogos.appendChild(bigImpactBtn);
            }
        }
        break; }
    }
};

// Fonction pour vérifier les événements automatiques selon la date
function checkDateEvents() {
    const currentEpoch = window.currentEpochName || '';
    const infoTimeMa = window.infoTimeMa || 0;
    if (currentEpoch !== 'Corps noir' || infoTimeMa <= 500) return;

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


