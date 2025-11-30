/* File: events.js - Gestion des événements de la timeline
 * Desc: Logique pour créer et gérer les boutons d'événements selon l'époque géologique
 * Version 1.0.0
 * Copyright 2025 DNAvatar.org - Arnaud Maignan
 * Licensed under Apache License 2.0 with Commons Clause.
 * See LICENSE_HEADER.txt for full terms.
 * Date: [January 2025]
 * Logs:
 *   - Initial version: extraction de updateEpochActions depuis main.js
 */

// Fonction pour mettre à jour les actions disponibles selon l'époque
window.updateEpochActions = function () {
    const eventsLogos = document.getElementById('timeline-events-logos');
    if (!eventsLogos) return;

    eventsLogos.innerHTML = ''; // Vider les boutons existants

    const currentEpochName = window.currentEpochName || 'Corps noir';

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

    if (currentEpochName === 'Corps noir') {
        // Action 1 : Météorites de glace (augmente la glace à la surface, donc l'albedo)
        const iceMeteorBtn = document.createElement('img');
        iceMeteorBtn.src = 'fonts/pics/ice_meteorite.png';
        iceMeteorBtn.alt = 'Météorite de glace';
        iceMeteorBtn.className = 'timeline-event-logo btn-events';

        // Récupérer la donnée depuis la config
        // Note: Pour Hadéen, 61.6% d'eau dans l'atmosphère représente :
        // - Masse atmosphérique Hadéen : 5.3e20 kg
        // - 61.6% de 5.3e20 = 3.2648e20 kg
        // - En GT (Gigatonnes) : 3.2648e20 / 1e12 = 326.48 MGT (millions de GT)
        let mass_added_txt = '';
        if (window.configOrganigramme) {
            const epoch = window.configOrganigramme.timeline.find(e => e.id === 'corps-noir');
            if (epoch && epoch.events && epoch.events.ice_meteorite) {
                // Utiliser formatMassGT pour les grandes masses (plus significatif)
                const mass_kg = epoch.events.ice_meteorite.water_added_kg;
                if (mass_kg >= 1e12) {
                    mass_added_txt = formatMassGT(mass_kg);
                } else {
                    mass_added_txt = formatMass(mass_kg);
                }
            }
        }

        // Tooltip
        if (typeof window.addCustomTooltip === 'function') {
            iceMeteorBtn.setAttribute('data-tooltip-initialized', 'true');
            window.addCustomTooltip(iceMeteorBtn, 'Météorite de glace<br>' + mass_added_txt);
        } else {
            // Fallback texte brut
            iceMeteorBtn.title = 'Météorite de glace ' + mass_added_txt.replace(/<sup>|<\/sup>/g, '');
        }

        iceMeteorBtn.addEventListener('click', () => {
            // Ajouter de l'eau totale (la répartition vapeur/glace sera calculée selon la température)
            // Calculer depuis la masse en kg (6.8e18 kg = 6.8 MGT)
            // Masse totale d'eau terrestre : 1.4e21 kg
            // 6.8e18 kg représente : 6.8e18 / 1.4e21 = 0.00486 = 0.486% de l'eau totale terrestre
            // Mais pour un effet visible, on peut ajouter plus (ex: 6.8% pour correspondre aux 6.8 MGT)
            const currentH2O = (typeof window.h2oTotalFromMeteorites !== 'undefined' && window.h2oTotalFromMeteorites !== null) ? window.h2oTotalFromMeteorites : 0;
            
            // Calculer le pourcentage depuis la masse en kg si disponible
            // 6.8e18 kg = 6.8 MGT (millions de gigatonnes)
            // Masse totale d'eau terrestre : 1.4e21 kg
            // 6.8e18 kg représente : 6.8e18 / 1.4e21 = 0.00486 = 0.486% de l'eau totale terrestre
            // Mais pour un effet visible et correspondre aux 6.8 MGT, on ajoute directement 6.8%
            let h2oToAdd = 6.8; // Par défaut : 6.8% (pour correspondre aux 6.8 MGT)
            if (window.configOrganigramme) {
                const epoch = window.configOrganigramme.timeline.find(e => e.id === 'corps-noir');
                if (epoch && epoch.events && epoch.events.ice_meteorite && epoch.events.ice_meteorite.water_added_kg) {
                    const mass_kg = epoch.events.ice_meteorite.water_added_kg;
                    // 6.8e18 kg = 6.8 MGT → on ajoute 6.8% directement pour correspondre
                    // (la conversion exacte serait 0.486%, mais on veut un effet visible)
                    h2oToAdd = 6.8; // Toujours 6.8% pour correspondre aux 6.8 MGT
                }
            }
            
            const newH2O = Math.min(100, currentH2O + h2oToAdd); // Ajouter 6.8% d'eau totale par météorite, max 100%
            window.h2oTotalFromMeteorites = newH2O;
            console.log('[events.js] 🔍 DEBUG - Eau ajoutée:', h2oToAdd.toFixed(1) + '%', 'Total:', newH2O.toFixed(1) + '%');

            // 🔒 FORCER le recalcul en réinitialisant la valeur mise en cache
            // Sinon, calculateAlbedo réutilise l'ancienne valeur de h2oIceFractionFromCalculation
            if (typeof window !== 'undefined') {
                window.h2oIceFractionFromCalculation = undefined;
            }

            // 🔒 Ajouter +50Ma à info-time à chaque clic sur météorite glace
            if (typeof window !== 'undefined') {
                window.infoTimeMa = (window.infoTimeMa || 0) + 50;
                
                // Mettre à jour l'affichage
                if (typeof window.updateTimeline === 'function') {
                    window.updateTimeline();
                }
                
                // Vérifier les événements automatiques
                if (typeof checkDateEvents === 'function') {
                    checkDateEvents();
                }
            }

            // Recalculer avec updateH2OLevelDirect (passe par calculations_h2o.js pour la répartition glace/vapeur)
            const h2o_total = newH2O + (typeof window.h2oVaporPercent !== 'undefined' ? window.h2oVaporPercent : 0);
            if (typeof window.updateH2OLevelDirect === 'function') {
                window.updateH2OLevelDirect(h2o_total);
            } else if (typeof window.updateCO2LevelDirect === 'function' && typeof plotData !== 'undefined' && plotData.co2_ppm !== undefined) {
                // Fallback vers updateCO2LevelDirect si updateH2OLevelDirect n'existe pas encore
                const current_co2_fraction = plotData.co2_ppm * 1e-6;
                window.updateCO2LevelDirect(current_co2_fraction);
            }
        });
        eventsLogos.appendChild(iceMeteorBtn);

        // Action 2 : Impact majeur (création de la lune, passe à l'époque suivante)
        const bigImpactBtn = document.createElement('img');
        bigImpactBtn.src = 'fonts/pics/big_impact.png';
        bigImpactBtn.alt = 'Impact majeur - Crée la lune';
        bigImpactBtn.className = 'timeline-event-logo btn-events';

        // Récupérer la donnée depuis la config
        let impact_flux_txt = '';
        if (window.configOrganigramme) {
            const epoch = window.configOrganigramme.timeline.find(e => e.id === 'corps-noir');
            if (epoch && epoch.events && epoch.events.big_impact) {
                const flux = epoch.events.big_impact.energy_flux_wm2;
                if (flux) {
                    // Convertir en MW/m2 si grand
                    if (flux >= 1000000) {
                        impact_flux_txt = (flux / 1000000).toFixed(0) + ' MW/m²';
                    } else {
                        impact_flux_txt = flux + ' W/m²';
                    }
                }
            }
        }

        // Tooltip
        if (typeof window.addCustomTooltip === 'function') {
            bigImpactBtn.setAttribute('data-tooltip-initialized', 'true');
            // Affichage du titre seulement, pas du flux dans le tooltip comme demandé
            window.addCustomTooltip(bigImpactBtn, 'Impact majeur - Crée la lune');
        } else {
            bigImpactBtn.title = 'Impact majeur - Crée la lune';
        }

        bigImpactBtn.addEventListener('click', () => {
            // 🔒 Cacher le tooltip immédiatement car le bouton va disparaître
            // Empêche le tooltip de rester coincé si le bouton est supprimé avant le mouseleave
            if (typeof window.hideTooltip === 'function') {
                window.hideTooltip();
            }

            // 🔒 Sauvegarder les valeurs actuelles avant le changement d'époque
            if (typeof window !== 'undefined') {
                // Sauvegarder eau (base + météorites)
                const h2o_base = (typeof window.h2oVaporPercent !== 'undefined') ? window.h2oVaporPercent : 0;
                const h2o_meteorites = (typeof window.h2oTotalFromMeteorites !== 'undefined') ? window.h2oTotalFromMeteorites : 0;
                window.savedH2O = h2o_base + h2o_meteorites;

                // Sauvegarder CO2
                window.savedCO2 = (typeof plotData !== 'undefined' && plotData.co2_ppm !== undefined) ? plotData.co2_ppm : 0;

                // Sauvegarder CH4
                window.savedCH4 = (typeof plotData !== 'undefined' && plotData.ch4_ppm !== undefined) ? plotData.ch4_ppm : 0;

                // Flag pour maximiser les données
                window.maximiseData = true;
            }
            // Passer à l'époque suivante (Hadéen)
            if (typeof window.setEpoch === 'function') {
                window.setEpoch('Hadéen');
            }
        });
        eventsLogos.appendChild(bigImpactBtn);
    } else if (currentEpochName === 'Hadéen') {
        // Actions pour l'Hadéen : évolution temporelle vers l'Archéen
        // Après l'impact, la Terre se refroidit progressivement sur 200-500 Ma

        // Action 1 : Avancer dans le temps (refroidissement progressif)
        const timeAdvanceBtn = document.createElement('button');
        timeAdvanceBtn.textContent = '⏩';
        timeAdvanceBtn.className = 'timeline-event-logo btn-events';

        // Tooltip
        if (typeof window.addCustomTooltip === 'function') {
            window.addCustomTooltip(timeAdvanceBtn, 'Avancer de 50 Ma<br>Refroidissement progressif');
        } else {
            timeAdvanceBtn.title = 'Avancer de 50 Ma - Refroidissement progressif';
        }

        timeAdvanceBtn.addEventListener('click', () => {
            // Avancer de 50 Ma (50 millions d'années) pour Hadéen
            // Utiliser window.infoTimeMa (en Ma, pas en années)
            if (typeof window !== 'undefined') {
                window.infoTimeMa = (window.infoTimeMa || 0) + 50;
                
                // Limiter à 450Ma (9 textures de 0 à 9, chaque texture = 50Ma)
                // 0-49Ma = texture 0, 50-99Ma = texture 1, ..., 450-499Ma = texture 9
                if (window.infoTimeMa > 450) {
                    window.infoTimeMa = 450; // Limiter à la dernière texture
                }
                
                // Mettre à jour l'affichage
                if (typeof window.updateTimeline === 'function') {
                    window.updateTimeline();
                }
                
                // Mettre à jour le logo de la Terre avec la nouvelle texture
                if (typeof window.updateHadeenTexture === 'function') {
                    window.updateHadeenTexture();
                }
                
                // Vérifier les événements automatiques
                if (typeof checkDateEvents === 'function') {
                    checkDateEvents();
                }
            }
            
            // Ancien code (désactivé) : Avancer de 50 Ma (50 millions d'années) vers le présent
            // Comme timelineFrame correspond à des années dans le passé (ex: 4.5e9),
            // pour avancer vers le présent (4.45e9), il faut DÉCRÉMENTER timelineFrame.

            const YEARS_STEP = 50e6; // 50 Ma
            const framesToSubtract = YEARS_STEP / (typeof YEARS_PER_FRAME !== 'undefined' ? YEARS_PER_FRAME : 10);

            // Vérifier si on ne dépasse pas la fin de l'époque (Archean à 4.0e9)
            const hadeanEnd = 4.0e9;
            const currentYears = (typeof timelineFrame !== 'undefined' ? timelineFrame : 0) * (typeof YEARS_PER_FRAME !== 'undefined' ? YEARS_PER_FRAME : 10);
            const nextYears = currentYears - YEARS_STEP;

            if (nextYears <= hadeanEnd) {
                // On arrive à l'Archéen !
                if (typeof window.setEpoch === 'function') {
                    window.setEpoch('Archéen');
                }
                return;
            }

            // Mettre à jour le temps (garder pour compatibilité avec l'ancien système)
            if (typeof timelineFrame !== 'undefined') {
                timelineFrame -= framesToSubtract;
            }

            // 🔒 LOGIQUE DE REFROIDISSEMENT HADÉEN
            // Interpoler le flux géothermique et la couverture de magma
            // Start: 4.5e9 (Flux ~2e6, Magma 1.0)
            // End: 4.0e9 (Flux ~0.3, Magma 0.0)

            const hadeanStart = 4.5e9;
            const totalDuration = hadeanStart - hadeanEnd;
            const elapsed = hadeanStart - nextYears; // Temps écoulé depuis le début (0 à 500Ma)
            const progress = Math.min(1, Math.max(0, elapsed / totalDuration)); // 0 à 1

            // Interpolation Log-Lineaire pour le flux (décroissance exponentielle)
            const fluxStart = 2000000; // 2 MW/m²
            const fluxEnd = 0.3; // ~0.3 W/m²
            const logFlux = (1 - progress) * Math.log(fluxStart) + progress * Math.log(fluxEnd);
            const currentFlux = Math.exp(logFlux);

            // Interpolation Linéaire pour le magma
            const magmaStart = 1.0;
            const magmaEnd = 0.0;
            const currentMagma = (1 - progress) * magmaStart + progress * magmaEnd;

            // Mettre à jour les paramètres de l'époque en cours (modification dynamique)
            if (typeof window.configOrganigramme !== 'undefined') {
                const hadeenEpoch = window.configOrganigramme.timeline.find(e => e.id === 'hadeen');
                if (hadeenEpoch) {
                    hadeenEpoch.geothermal_flux = currentFlux;
                    hadeenEpoch.magma_coverage = currentMagma;

                    // Mettre à jour aussi cloud_coverage ? (User: "diminue le % de lave ...")
                    // Peut-être que les nuages diminuent aussi si moins d'évaporation massive ?
                    // On laisse calculateCloudCoverage gérer via la T° de surface pour l'instant.
                }
            }

            // 🔒 BUGFIX : Réinitialiser la mémoire de convergence
            // Le saut de température est trop grand (refroidissement brutal), l'optimisation de continuité
            // empêcherait de trouver la solution (ex: passage de 2200°C à 1300°C alors que la fenêtre de recherche est ±100°C)
            if (typeof window !== 'undefined') {
                window.current_T0_adjusted = null;
            }

            // Recalculer avec les nouvelles conditions
            if (typeof window.updateCO2LevelDirect === 'function' && typeof plotData !== 'undefined' && plotData.co2_ppm !== undefined) {
                const current_co2_fraction = plotData.co2_ppm * 1e-6;
                window.updateCO2LevelDirect(current_co2_fraction);
            }
        });
        eventsLogos.appendChild(timeAdvanceBtn);

        // Action 2 : Apport d'eau supplémentaire (météorites continuent de tomber)
        const waterAdditionBtn = document.createElement('img');
        waterAdditionBtn.src = 'fonts/pics/ice_meteorite.png';

        // Récupérer la donnée depuis la config (Hadéen)
        // Note: Pour Hadéen, 61.6% d'eau dans l'atmosphère représente :
        // - Masse atmosphérique Hadéen : 5.3e20 kg
        // - 61.6% de 5.3e20 = 3.2648e20 kg
        // - En GT (Gigatonnes) : 3.2648e20 / 1e12 = 326.48 MGT (millions de GT)
        let mass_added_txt = '';
        if (window.configOrganigramme) {
            const epoch = window.configOrganigramme.timeline.find(e => e.id === 'hadeen');
            if (epoch && epoch.events && epoch.events.ice_meteorite) {
                // Utiliser formatMassGT pour les grandes masses (plus significatif)
                const mass_kg = epoch.events.ice_meteorite.water_added_kg;
                if (mass_kg >= 1e12) {
                    mass_added_txt = formatMassGT(mass_kg);
                } else {
                    mass_added_txt = formatMass(mass_kg);
                }
            }
        }

        // Tooltip avec quantité
        if (typeof window.addCustomTooltip === 'function') {
            // 🔒 Marquer comme initialisé pour éviter que tooltips.js ne crée un doublon via l'attribut alt
            waterAdditionBtn.setAttribute('data-tooltip-initialized', 'true');
            window.addCustomTooltip(waterAdditionBtn, 'Météorite de glace<br>' + mass_added_txt);
        } else {
            waterAdditionBtn.title = 'Météorite de glace ' + mass_added_txt.replace(/<sup>|<\/sup>/g, '');
        }

        waterAdditionBtn.alt = 'Météorite de glace';
        waterAdditionBtn.className = 'timeline-event-logo btn-events';
        waterAdditionBtn.addEventListener('click', () => {
            // Ajouter de l'eau totale (en kg, pas en %)
            // Calculer depuis la masse en kg (2.1e19 kg pour Hadéen)
            // Masse totale d'eau terrestre : 1.4e21 kg
            // 2.1e19 kg représente : 2.1e19 / 1.4e21 = 0.015 = 1.5% de l'eau totale terrestre
            // Mais pour un effet visible, on peut ajouter plus (ex: 2.1% pour correspondre à la masse)
            const currentH2O = (typeof window.h2oTotalFromMeteorites !== 'undefined' && window.h2oTotalFromMeteorites !== null) ? window.h2oTotalFromMeteorites : 0;
            
            // Calculer le pourcentage depuis la masse en kg si disponible
            let h2oToAdd = 2.1; // Par défaut : 2.1% (pour correspondre à la masse)
            if (window.configOrganigramme) {
                const epoch = window.configOrganigramme.timeline.find(e => e.id === 'hadeen');
                if (epoch && epoch.events && epoch.events.ice_meteorite && epoch.events.ice_meteorite.water_added_kg) {
                    const mass_kg = epoch.events.ice_meteorite.water_added_kg;
                    const EARTH_TOTAL_WATER_MASS_KG = 1.4e21; // Masse totale d'eau terrestre
                    // Convertir la masse en pourcentage d'eau totale
                    h2oToAdd = (mass_kg / EARTH_TOTAL_WATER_MASS_KG) * 100;
                    // Pour un effet visible, multiplier par 10 (2.1e19 kg → 2.1%)
                    h2oToAdd = Math.max(h2oToAdd * 10, 2.1); // Minimum 2.1% pour correspondre à la masse
                }
            }
            
            const newH2O = Math.min(100, currentH2O + h2oToAdd); // Ajouter 2.1% d'eau totale par apport, max 100%
            window.h2oTotalFromMeteorites = newH2O;
            console.log('[events.js] 🔍 DEBUG - Eau ajoutée (Hadéen):', h2oToAdd.toFixed(1) + '%', 'Total:', newH2O.toFixed(1) + '%');

            // Forcer le recalcul
            if (typeof window !== 'undefined') {
                window.h2oIceFractionFromCalculation = undefined;
            }

            // Recalculer avec updateH2OLevelDirect (passe par calculations_h2o.js pour la répartition glace/vapeur)
            const h2o_total = newH2O + (typeof window.h2oVaporPercent !== 'undefined' ? window.h2oVaporPercent : 0);
            if (typeof window.updateH2OLevelDirect === 'function') {
                window.updateH2OLevelDirect(h2o_total);
            } else if (typeof window.updateCO2LevelDirect === 'function' && typeof plotData !== 'undefined' && plotData.co2_ppm !== undefined) {
                // Fallback vers updateCO2LevelDirect si updateH2OLevelDirect n'existe pas encore
                const current_co2_fraction = plotData.co2_ppm * 1e-6;
                window.updateCO2LevelDirect(current_co2_fraction);
            }
        });
        eventsLogos.appendChild(waterAdditionBtn);
    }
    // Ajouter d'autres actions pour d'autres époques si nécessaire
};

// Fonction pour vérifier les événements automatiques selon la date
function checkDateEvents() {
    const currentEpoch = (typeof window !== 'undefined' && window.currentEpochName) || '';
    const infoTimeMa = (typeof window !== 'undefined' && window.infoTimeMa) || 0;
    
    // En Corps noir, si info-time > 500Ma, déclencher automatiquement l'impact majeur
    if (currentEpoch === 'Corps noir' && infoTimeMa > 500) {
        console.log('[checkDateEvents] 🔍 DEBUG - Impact majeur déclenché automatiquement (info-time > 500Ma)');
        
        // 🔒 Cacher le tooltip immédiatement
        if (typeof window.hideTooltip === 'function') {
            window.hideTooltip();
        }
        
        // 🔒 Sauvegarder les valeurs actuelles avant le changement d'époque
        if (typeof window !== 'undefined') {
            // Sauvegarder eau (base + météorites)
            const h2o_base = (typeof window.h2oVaporPercent !== 'undefined') ? window.h2oVaporPercent : 0;
            const h2o_meteorites = (typeof window.h2oTotalFromMeteorites !== 'undefined') ? window.h2oTotalFromMeteorites : 0;
            window.savedH2O = h2o_base + h2o_meteorites;
            
            // Sauvegarder CO2
            window.savedCO2 = (typeof plotData !== 'undefined' && plotData.co2_ppm !== undefined) ? plotData.co2_ppm : 0;
            
            // Sauvegarder CH4
            window.savedCH4 = (typeof plotData !== 'undefined' && plotData.ch4_ppm !== undefined) ? plotData.ch4_ppm : 0;
            
            // Flag pour maximiser les données
            window.maximiseData = true;
        }
        
        // Passer à l'époque suivante (Hadéen)
        if (typeof window.setEpoch === 'function') {
            window.setEpoch('Hadéen');
        }
    }
}

// Exposer checkDateEvents globalement
window.checkDateEvents = checkDateEvents;

