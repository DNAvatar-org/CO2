// File: static/timeline/configTimeline.js - Configuration de la timeline (chronologie des époques)
// Desc: Données de configuration pour la timeline et les événements interactifs
// Version 1.2.0
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//
// ============================================================================
// DÉFINITION DE LA CHRONOLOGIE (TIMELINE)
// ============================================================================
// Structure : array d'objets { '📅': '⚫' | '🔥' | '🦠' | '🦕' | '🦴' | '🦣' | '🚂' | '📱', '▶': number, '◀': number, ... }
// Les icônes des boutons d'événements sont définies dans events.tic_time.icon et events.meteor.icon
const timeline = [
    {
        '📅': '⚫', // Corps noir
        '▶': 5.0e9, // Départ
        '◀': 4.5e9, // Fin
        '🌡️🧮': 255,
        '🧲🔬': 0.1,
        '🔋☀️': 2.6796e26, // Puissance totale du soleil (W) - 70% de 3.828e26 W
        '🔋🌕': 0, // core_temperature (Pas de noyau en K)
        '🍰🧲🌕': 0.0, // geothermal_diffusion_factor (Facteur de diffusion du noyau vers la surface 0-1)
        '📐': 5096.8, // Rayon de la planète en km (Terre : 6371 km)
        '🍎': 8.3, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (valeur par défaut, pas d'eau pour cette époque)
        '🐚': 1.0, // Facteur relief sous-marin (1.0 = pas de modification)
        '⚖️🫧': 0, // Masse atmosphère (Pas d'atmosphère)
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.0,  // Surface océanique potentielle (0% - pas d'eau)
            '🍰🗻🏔': 0.0,  // Hautes terres (0% - pas de relief)
            '🍰🗻🌍': 1.0   // Terres basses (100% - surface rocheuse)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Note: geothermal_flux sera calculé à partir de core_temperature et geothermal_diffusion_factor
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        '⚖️🏭': 0, // co2_kg (Quantité de CO2 en kg)
        '⚖️⛽': 0, // ch4_kg (Quantité de CH4 en kg)
        '⚖️💧': 0, // h2o_kg (Quantité totale d'eau en kg)
        '⚖️🌫': 0, // o2_kg (Quantité de O2 en kg)
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        // Événements interactifs
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 2.0e19, // water_added_kg (~10^20 kg)
                // deltaTemp: -3.5 // Inutile, déclenche aussi 📿💫++
            },
            '🎇': {
                '⏩': '🔥' // Transition vers Hadéen
            }
        }
    },
    {
        '📅': '🔥', // Hadéen
        '▶': 4.5e9,
        '◀': 4.0e9,
        '🌡️🧮': 2450,
        '🧲🔬': 1,
        '🔋☀️': 2.871e26, // Puissance totale du soleil (W) - 75% de 3.828e26 W
        '🔋🌕': 1.23e21, // core_power_watts (Puissance géothermique totale calculée depuis 🧲🌕 = 2 MW/m² et R = 7008.1 km)
        // Flux géothermique colossal (2 000 000 W/m²) pour maintenir la surface en fusion (~2400K)
        // Correspond à la phase immédiate post-impact (océan de magma rayonnant)
        '🧲🌕': 2000000, // geothermal_flux (W/m²) - hardcodé pour cette époque
        '📐': 7008.1, // Rayon de la planète en km
        '🍎': 10.3, // Gravité en m/s²
        '📏🌊': 10.0, // Profondeur moyenne océan de magma en km (Hadéen)
        '🐚': 1.0, // Facteur relief sous-marin
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 1.0,  // Surface océanique potentielle (100% - océan de magma)
            '🍰🗻🏔': 0.0,  // Hautes terres (0% - pas de continents stables)
            '🍰🗻🌍': 0.0   // Terres basses (0% - pas de continents)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 5.3e20, // Masse atmosphère (Atmosphère très dense ~100 bar)
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        '⚖️🏭': 5.15e17, // co2_kg (~10% de l'atmosphère moderne)
        '⚖️⛽': 5.15e15, // ch4_kg (~1000 ppm)
        '⚖️💧': 2.1e20, // h2o_kg (~15% de 1.4e21 kg)
        '⚖️🌫': 0, // o2_kg
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        magma_coverage: 1.0, // Spécifique Hadéen - TODO: trouver logo combo
        volcanoFactor: 10.0, // Spécifique Hadéen - TODO: trouver logo combo
        // Événements interactifs
        '🕰': {
            '💫': {
                '🔺🌡️💫': -300, // deltaTemp (Refroidissement par ticTime en K)
                '🔺🧲🌕💫': {
                    '▶': 2000000, // start (2 MW/m² au début)
                    '◀': 0.3 // end (~0.3 W/m² à la fin)
                }
            },
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg (~10% de l'eau initiale)
                // deltaTemp: -3 // Inutile, déclenche aussi 📿💫++
            }
        }
    },
    {
        '📅': '🦠', // Archéen
        '▶': 4.0e9,
        '◀': 2.5e9,
        '🌡️🧮': 311,
        '🧲🔬': 0.1,
        '🔋☀️': 3.0624e26, // Puissance totale du soleil (W) - 80% de 3.828e26 W
        '🔋🌕': 1.5e14, // core_power_watts (Puissance géothermique totale ~150 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.5, // Profondeur moyenne océans en km (Archéen, moins d'eau)
        '🐚': 1.0, // Facteur relief sous-marin
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.80, // Surface océanique potentielle (80% - moins de continents qu'aujourd'hui)
            '🍰🗻🏔': 0.05, // Hautes terres (5% - peu de relief élevé)
            '🍰🗻🌍': 0.15  // Terres basses (15% - premiers continents)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 1.0e19, // Masse atmosphère (Atmosphère dense ~2 bar)
        // Simulation parameters - Quantités en kg
        '⚖️🏭': 2.575e16, // co2_kg (~5000 ppm)
        '⚖️⛽': 4.12e14, // ch4_kg (~80 ppm)
        '⚖️💧': 8.4e20, // h2o_kg (~60% de 1.4e21 kg)
        '⚖️🌫': 0, // o2_kg
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg
                // deltaTemp: -5 // Inutile, déclenche aussi 📿💫++
            }
        }
    },
    {
        '📅': '🌿', // Protérozoïque
        '▶': 2.5e9,
        '◀': 541e6,
        '🌡️🧮': 285,
        '🧲🔬': 0.1,
        '🔋☀️': 3.4452e26, // Puissance totale du soleil (W) - 90% de 3.828e26 W
        '🔋🌕': 1.0e14, // core_power_watts (Puissance géothermique totale ~100 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.6, // Profondeur moyenne océans en km (Protérozoïque)
        '🐚': 1.0, // Facteur relief sous-marin
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.75, // Surface océanique potentielle (75% - continents en formation)
            '🍰🗻🏔': 0.08, // Hautes terres (8% - relief modéré)
            '🍰🗻🌍': 0.17  // Terres basses (17% - continents émergents)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 5.15e18, // Masse atmosphère (Atmosphère proche de l'actuelle ~1 bar)
        // Simulation parameters - Quantités en kg
        '⚖️🏭': 1.03e16, // co2_kg (~2000 ppm)
        '⚖️⛽': 1.2875e14, // ch4_kg (~25 ppm)
        '⚖️💧': 1.19e21, // h2o_kg (~85% de 1.4e21 kg)
        '⚖️🌫': 0, // o2_kg
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg
                // deltaTemp: -2 // Inutile, déclenche aussi 📿💫++
            }
        }
    },
    {
        '📅': '🦕', // Mésozoïque
        '▶': 252e6,
        '◀': 66e6,
        '🌡️🧮': 298,
        '🧲🔬': 0.1,
        '🔋☀️': 3.75144e26, // Puissance totale du soleil (W) - 98% de 3.828e26 W
        '🔋🌕': 6.0e13, // core_power_watts (Puissance géothermique totale ~60 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (Mésozoïque)
        '🐚': 1.0, // Facteur relief sous-marin
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.71, // Surface océanique potentielle (71% - distribution moderne)
            '🍰🗻🏔': 0.09, // Hautes terres (9% - relief moderne)
            '🍰🗻🌍': 0.20  // Terres basses (20% - continents modernes)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 5.15e18, // Masse atmosphère (Atmosphère standard ~1 bar)
        // Simulation parameters - Quantités en kg
        '⚖️🏭': 1.2875e16, // co2_kg (~2500 ppm)
        '⚖️⛽': 4.12e13, // ch4_kg (~8 ppm)
        '⚖️💧': 1.33e21, // h2o_kg (~95% de 1.4e21 kg)
        '⚖️🌫': 0, // o2_kg
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg
                // deltaTemp: -1.5 // Inutile, déclenche aussi 📿💫++
            }
        }
    },
    {
        '📅': '🦴', // Crétacé
        '▶': 145e6,
        '◀': 66e6,
        '🌡️🧮': 301,
        '🧲🔬': 0.1,
        '🔋☀️': 3.78972e26, // Puissance totale du soleil (W) - 99% de 3.828e26 W
        '🔋🌕': 5.5e13, // core_power_watts (Puissance géothermique totale ~55 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (Crétacé)
        '🐚': 1.0, // Facteur relief sous-marin
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.71, // Surface océanique potentielle (71% - distribution moderne)
            '🍰🗻🏔': 0.09, // Hautes terres (9% - relief moderne)
            '🍰🗻🌍': 0.20  // Terres basses (20% - continents modernes)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 5.15e18, // Masse atmosphère (Atmosphère standard ~1 bar)
        // Simulation parameters - Quantités en kg
        '⚖️🏭': 1.545e16, // co2_kg (~3000 ppm)
        '⚖️⛽': 5.15e13, // ch4_kg (~10 ppm)
        '⚖️💧': 1.372e21, // h2o_kg (~98% de 1.4e21 kg)
        '⚖️🌫': 0, // o2_kg
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg
                // deltaTemp: -1 // Inutile, déclenche aussi 📿💫++
            }
        }
    },
    {
        '📅': '🦣', // Cénozoïque
        '▶': 66e6,
        '◀': 0,
        '🌡️🧮': 291,
        '🧲🔬': 0.1,
        '🔋☀️': 3.80886e26, // Puissance totale du soleil (W) - 99.5% de 3.828e26 W
        '🔋🌕': 5.0e13, // core_power_watts (Puissance géothermique totale ~50 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (Cénozoïque)
        '🐚': 1.0, // Facteur relief sous-marin
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.71, // Surface océanique potentielle (71% - distribution moderne)
            '🍰🗻🏔': 0.09, // Hautes terres (9% - relief moderne)
            '🍰🗻🌍': 0.20  // Terres basses (20% - continents modernes)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 5.15e18, // Masse atmosphère (Atmosphère standard ~1 bar)
        // Simulation parameters - Quantités en kg
        '⚖️🏭': 1.443e15, // co2_kg (~280 ppm)
        '⚖️⛽': 3.605e12, // ch4_kg (~0.7 ppm)
        '⚖️💧': 1.4e21, // h2o_kg (100% de 1.4e21 kg)
        '⚖️🌫': 1.0815e18, // o2_kg (~21% de l'atmosphère moderne)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg
                // deltaTemp: -1 // Inutile, déclenche aussi 📿💫++
            }
        }
    },
    {
        '📅': '🚂', // 1800
        '▶': 1800,
        '◀': 2025,
        '🌡️🧮': 287,
        '🧲🔬': 0.01,
        '🔋☀️': 3.828e26, // Puissance totale du soleil (W) - 100% (valeur actuelle)
        '🔋🌕': 4.6e13, // core_power_watts (Puissance géothermique totale ~46 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (Terre moderne)
        '🐚': 1.0, // Facteur relief sous-marin (1.0 = pas de modification)
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.71, // Surface océanique potentielle (71% - distribution moderne)
            '🍰🗻🏔': 0.09, // Hautes terres (9% - relief moderne)
            '🍰🗻🌍': 0.20  // Terres basses (20% - continents modernes)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 5.15e18, // Masse atmosphère (Atmosphère standard ~1 bar)
        // Simulation parameters - Quantités en kg
        '⚖️🏭': 1.443e15, // co2_kg (~280 ppm, niveau pré-industriel)
        '⚖️⛽': 3.605e12, // ch4_kg (~0.7 ppm, niveau pré-industriel)
        '⚖️💧': 1.4e21, // h2o_kg (100% de 1.4e21 kg)
        '⚖️🌫': 1.0815e18, // o2_kg (~21% de l'atmosphère moderne)
        '⚖️💨': 3.97e18, // n2_kg (~78% de l'atmosphère moderne, calculé comme reste pour atteindre 5.15e18)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg
                // deltaTemp: -0.5 // Inutile, déclenche aussi 📿💫++
            }
        }
    },
    {
        '📅': '📱', // 2025
        '▶': 2025,
        '◀': -1,
        '🌡️🧮': 288.8,  // ~15.6-16°C moyenne 2025 (record chaud)
        '🧲🔬': 0.010,
        '🔋☀️': 3.828e26, // Puissance totale du soleil (W) - 100% (valeur actuelle)
        '🔋🌕': 4.6e13, // core_power_watts (Puissance géothermique totale ~46 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (Terre moderne)
        '🐚': 1.0, // Facteur relief sous-marin (1.0 = pas de modification)
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.71, // Surface océanique potentielle (71% - distribution moderne)
            '🍰🗻🏔': 0.09, // Hautes terres (9% - relief moderne)
            '🍰🗻🌍': 0.20  // Terres basses (20% - continents modernes)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Note: 🍰🪩🏖, 🍰🪩🌳, 🍰🪩🌍 sont maintenant calculés dynamiquement dans calculateAlbedo()
        // ⚖️🫧 sera calculé automatiquement comme somme de l'air sec (⚖️🏭 + ⚖️⛽ + ⚖️🌫 + ⚖️💨) = ~5.05e18 kg
        // Note: La vapeur d'eau (~1.3e16 kg) n'est pas incluse dans ⚖️🫧
        // Simulation parameters - Quantités en kg
        '⚖️🏭': 3.3e15,   // ~420-450 ppm CO2 2025
        '⚖️⛽': 5.5e12,
        '⚖️💧': 1.4e21, // h2o_kg (100% de 1.4e21 kg)
        '⚖️🌫': 1.18e18, // O2 ~23% masse air sec
        '⚖️💨': 3.97e18, // n2_kg (~78% de l'atmosphère moderne, calculé comme reste pour atteindre 5.15e18)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg
                // deltaTemp: -0.5 // Inutile, déclenche aussi 📿💫++
            }
        }
    }
];

window.TIMELINE = timeline;


