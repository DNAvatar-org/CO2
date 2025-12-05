// File: static/timeline/configTimeline.js - Configuration de la timeline (chronologie des époques)
// Desc: Données de configuration pour la timeline et les événements interactifs
// Version 1.1.0
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: extraction de la timeline depuis configOrganigramme.js
//   - Moved to static/timeline/config.js (alongside timeline.js)

// ============================================================================
// DÉFINITION DE LA CHRONOLOGIE (TIMELINE)
// ============================================================================
// Structure : array d'objets { type: 'epoch' | 'separator', ... }
// Les icônes des boutons d'événements sont définies dans events.tic_time.icon et events.ice_meteorite.icon
const timeline = [
    {
        type: 'epoch',
        id: 'corps-noir',
        name: 'Corps noir',
        date: '-5000 Ma',
        startYears: 5.0e9,
        endYears: 4.5e9,
        t0: 255,
        precision: 0.1,
        // temp: '1200°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: 'fonts/pics/corps_noir.png',
        title: 'Corps noir - État étalon<br>(Remplace la phase d\'accrétion)',
        solar_intensity: 0.70,
        core_temperature: 0, // Pas de noyau (K)
        geothermal_diffusion_factor: 0.0, // Facteur de diffusion du noyau vers la surface (0-1) - Corps noir : pas de noyau
        planet_radius: 6371000*0.8, // Rayon de la planète en mètres (Terre : 6371 km)
        gravity: 8.3, // Gravité en m/s²
        total_atmosphere_mass_kg: 0, // Pas d'atmosphère
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Note: geothermal_flux sera calculé à partir de core_temperature et geothermal_diffusion_factor
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        co2_kg: 0, // Quantité de CO2 en kg
        ch4_kg: 0, // Quantité de CH4 en kg
        h2o_kg: 0, // Quantité totale d'eau en kg (vapeur + liquide + glace)
        n2_kg: 0, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        cloud_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.0,
        ocean_coverage: 0, forest_coverage: 0, desert_coverage: 0, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 0.0,
        // Événements interactifs
        events: {
            ice_meteorite: {
                water_added_kg: 2.0e19, // ~10^20 kg (100 fois plus pour un effet visible)
                deltaTemp: -3.5 // Refroidissement par météorite (K)
            },
            big_impact: {
                energy_flux_wm2: 2000000 // 2 MW/m² (correspond au flux géothermique de l'Hadéen)
            }
        }
    },
    {
        type: 'separator',
        date: '-4500 Ma'
    },
    {
        type: 'epoch',
        id: 'hadeen',
        name: 'Hadéen',
        date: '-4500 Ma',
        startYears: 4.5e9,
        endYears: 4.0e9,
        t0: 2450,
        precision: 1,
        // temp: '46.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: 'fonts/pics/hadeen.png',
        title: 'Hadéen - Terre en formation, océan de magma (Atmosphère dense)',
        solar_intensity: 0.75,
        core_temperature: 6000, // Température du noyau en K
        // geothermal_diffusion_factor: 0.0073, // REMPLACÉ par un flux explicite
        // Flux géothermique colossal (2 000 000 W/m²) pour maintenir la surface en fusion (~2400K)
        // Correspond à la phase immédiate post-impact (océan de magma rayonnant)
        geothermal_flux: 2000000, 
        planet_radius: 6371000*1.1, // Rayon de la planète en mètres
        gravity: 10.3, // Gravité en m/s²
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        total_atmosphere_mass_kg: 5.3e20, // Atmosphère très dense (~100 bar, principalement CO2/H2O)
        // Note: geothermal_flux = core_temperature * geothermal_diffusion_factor * 0.00457
        // Hadéen: ~0.20 W/m² (6000K * 0.0073 * 0.00457 ≈ 0.20 W/m²)
        // D'après Grok: ~0.20-0.25 W/m² à la surface pour Hadéen
        // 🔒 Température initiale : t0 + deltaTemp * nombre_météorites (voir calculations.js)
        // Juste après l'impact : 10⁵ à 10⁷ W/m², >4000-6000K (roche vaporisée)
        // Post-impact (vrai Hadéen) : 1000 → 100 W/m² en décroissance, 2500K → 500K
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        // Conversion approximative: 10% CO2 ≈ 5.15e17 kg (10% de 5.15e18 kg atmosphère)
        co2_kg: 5.15e17, // Quantité de CO2 en kg (~10% de l'atmosphère moderne)
        ch4_kg: 5.15e15, // Quantité de CH4 en kg (~1000 ppm)
        h2o_kg: 2.1e20, // Quantité totale d'eau en kg (~15% de 1.4e21 kg)
        n2_kg: 1.0e18, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        cloud_coverage: 0.1, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.05,
        ocean_coverage: 0, forest_coverage: 0, desert_coverage: 0, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        magma_coverage: 1.0, // Spécifique Hadéen
        volcanoFactor: 10.0,
        // Événements interactifs
        events: {
            tic_time: {
                deltaTemp: -300, // Refroidissement par ticTime (K) - refroidissement rapide en Hadéen
                icon: '🕓', // Emoji du bouton d'avancement temporel
                // Décroissance du flux géothermique (non-linéaire, exponentielle)
                geothermal_flux: {
                    start: 2000000, // 2 MW/m² au début (post-impact)
                    end: 0.3, // ~0.3 W/m² à la fin (500Ma)
                    // Décroissance exponentielle : flux(t) = start * (end/start)^(t/total)
                    // Après 50Ma : flux(50) ≈ 0.4 MW/m² (400000 W/m²)
                    // Formule : flux = start * exp(ln(end/start) * progress)
                }
            },
            ice_meteorite: {
                water_added_kg: 1.0e18, // ~10% de l'eau initiale (2.1e20) pour effet
                deltaTemp: -3 // Refroidissement par météorite (K) - refroidissement rapide en Hadéen
            }
        }
    },
    {
        type: 'separator',
        date: '-4000 Ma'
    },
    {
        type: 'epoch',
        id: 'archeen',
        name: 'Archéen',
        date: '-4000 Ma',
        startYears: 4.0e9,
        endYears: 2.5e9,
        t0: 311, // ~38°C - Température initiale pour convergence rapide
        precision: 0.1,
        // temp: '38.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: 'fonts/pics/archeen.png',
        title: 'Archéen (-4000 à -2500 Ma)',
        solar_intensity: 0.80,
        core_power_watts: 1.5e14, // Puissance géothermique totale (~150 TW)
        // core_temperature: 5500, // DEPRECATED
        // geothermal_diffusion_factor: 0.00009, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        total_atmosphere_mass_kg: 1.0e19, // Atmosphère dense (~2 bar, CO2/N2)
        // Note: geothermal_flux ≈ 0.29 W/m² (1.5e14 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 2.575e16, // Quantité de CO2 en kg (~5000 ppm)
        ch4_kg: 4.12e14, // Quantité de CH4 en kg (~80 ppm)
        h2o_kg: 8.4e20, // Quantité totale d'eau en kg (~60% de 1.4e21 kg)
        n2_kg: 3.0e18, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.6, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.12,
        ocean_coverage: 0.80, forest_coverage: 0, desert_coverage: 0.05, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 5.0,
        events: {
            ice_meteorite: {
                water_added_kg: 1.0e18, // Quantité d'eau ajoutée par météorite
                deltaTemp: -5 // Refroidissement par météorite (K) - refroidissement modéré en Archéen
            }
        }
    },
    {
        type: 'separator',
        date: '-2500 Ma'
    },
    {
        type: 'epoch',
        id: 'proterozoique',
        name: 'Protérozoïque',
        date: '-2500 Ma',
        startYears: 2.5e9,
        endYears: 541e6,
        t0: 285, // ~12°C - Température initiale pour convergence rapide
        precision: 0.1,
        // temp: '12.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: '🦠',
        title: 'Protérozoïque (-2500 à -541 Ma)',
        solar_intensity: 0.90,
        core_power_watts: 1.0e14, // Puissance géothermique totale (~100 TW)
        // core_temperature: 5000, // DEPRECATED
        // geothermal_diffusion_factor: 0.00004, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        total_atmosphere_mass_kg: 5.15e18, // Atmosphère proche de l'actuelle (~1 bar)
        // Note: geothermal_flux ≈ 0.2 W/m² (1.0e14 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 1.03e16, // Quantité de CO2 en kg (~2000 ppm)
        ch4_kg: 1.2875e14, // Quantité de CH4 en kg (~25 ppm)
        h2o_kg: 1.19e21, // Quantité totale d'eau en kg (~85% de 1.4e21 kg)
        n2_kg: 3.5e18, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.6, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.20,
        ocean_coverage: 0.70, forest_coverage: 0.05, desert_coverage: 0.15, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 2.0,
        events: {
            ice_meteorite: {
                water_added_kg: 1.0e18, // Quantité d'eau ajoutée par météorite
                deltaTemp: -2 // Refroidissement par météorite (K) - refroidissement léger en Protérozoïque
            }
        }
    },
    {
        type: 'separator',
        date: '-397 Ma'
    },
    {
        type: 'epoch',
        id: 'mesozoique',
        name: 'Mésozoïque',
        date: '-250 Ma',
        startYears: 252e6,
        endYears: 66e6,
        t0: 298, // ~25°C - Température initiale pour convergence rapide
        precision: 0.1,
        // temp: '25.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: '🦕',
        title: 'Mésozoïque (-252 à -66 Ma)',
        solar_intensity: 0.98,
        core_power_watts: 6.0e13, // Puissance géothermique totale (~60 TW)
        // core_temperature: 4500, // DEPRECATED
        // geothermal_diffusion_factor: 0.000022, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        total_atmosphere_mass_kg: 5.15e18, // Atmosphère standard (~1 bar)
        // Note: geothermal_flux ≈ 0.12 W/m² (6.0e13 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 1.2875e16, // Quantité de CO2 en kg (~2500 ppm)
        ch4_kg: 4.12e13, // Quantité de CH4 en kg (~8 ppm)
        h2o_kg: 1.33e21, // Quantité totale d'eau en kg (~95% de 1.4e21 kg)
        n2_kg: 4.0e18, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.6, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.28,
        ocean_coverage: 0.70, forest_coverage: 0.20, desert_coverage: 0.10, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 1.0,
        events: {
            ice_meteorite: {
                water_added_kg: 1.0e18, // Quantité d'eau ajoutée par météorite
                deltaTemp: -1.5 // Refroidissement par météorite (K) - refroidissement léger en Mésozoïque
            }
        }
    },
    {
        type: 'separator',
        date: '-145 Ma'
    },
    {
        type: 'epoch',
        id: 'cretace',
        name: 'Crétacé',
        date: '-145 Ma',
        startYears: 145e6,
        endYears: 66e6,
        t0: 301, // ~28°C - Température initiale pour convergence rapide
        precision: 0.1,
        // temp: '28.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: '🦴',
        title: 'Crétacé (-145 à -66 Ma)',
        solar_intensity: 0.99,
        core_power_watts: 5.5e13, // Puissance géothermique totale (~55 TW)
        // core_temperature: 4300, // DEPRECATED
        // geothermal_diffusion_factor: 0.000022, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        total_atmosphere_mass_kg: 5.15e18, // Atmosphère standard (~1 bar)
        // Note: geothermal_flux ≈ 0.11 W/m² (5.5e13 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 1.545e16, // Quantité de CO2 en kg (~3000 ppm)
        ch4_kg: 5.15e13, // Quantité de CH4 en kg (~10 ppm)
        h2o_kg: 1.372e21, // Quantité totale d'eau en kg (~98% de 1.4e21 kg)
        n2_kg: 4.0e18, // Quantité de N2 en kg (non affiché dans le flux diagram)
        o2_kg: 0, // Quantité de O2 en kg (non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.6, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.28,
        ocean_coverage: 0.70, forest_coverage: 0.20, desert_coverage: 0.10, ice_coverage: 0, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 1.0,
        events: {
            ice_meteorite: {
                water_added_kg: 1.0e18, // Quantité d'eau ajoutée par météorite
                deltaTemp: -1 // Refroidissement par météorite (K) - refroidissement très léger en Crétacé
            }
        }
    },
    {
        type: 'separator',
        date: '-66 Ma'
    },
    {
        type: 'epoch',
        id: 'cenozoique',
        name: 'Cénozoïque',
        date: '-66 Ma',
        startYears: 66e6,
        endYears: 0,
        t0: 291, // ~18°C - Température initiale pour convergence rapide
        precision: 0.1,
        // temp: '18.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: '🦣',
        title: 'Cénozoïque (-66 Ma à aujourd\'hui)',
        solar_intensity: 0.995,
        core_power_watts: 5.0e13, // Puissance géothermique totale (~50 TW)
        // core_temperature: 4100, // DEPRECATED
        // geothermal_diffusion_factor: 0.000022, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        total_atmosphere_mass_kg: 5.15e18, // Atmosphère standard (~1 bar)
        // Note: geothermal_flux ≈ 0.1 W/m² (5.0e13 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 1.443e15, // Quantité de CO2 en kg (~280 ppm)
        ch4_kg: 3.605e12, // Quantité de CH4 en kg (~0.7 ppm)
        h2o_kg: 1.4e21, // Quantité totale d'eau en kg (100% de 1.4e21 kg)
        n2_kg: 4.017e18, // Quantité de N2 en kg (~78% de l'atmosphère moderne, non affiché dans le flux diagram)
        o2_kg: 1.0815e18, // Quantité de O2 en kg (~21% de l'atmosphère moderne, non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.4, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.30,
        ocean_coverage: 0.70, forest_coverage: 0.15, desert_coverage: 0.10, ice_coverage: 0.05, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 1.0,
        events: {
            ice_meteorite: {
                water_added_kg: 1.0e18, // Quantité d'eau ajoutée par météorite
                deltaTemp: -1 // Refroidissement par météorite (K) - refroidissement très léger en Cénozoïque
            }
        }
    },
    {
        type: 'separator',
        date: '1800'
    },
    {
        type: 'epoch',
        id: 'pre-industriel',
        name: '1800',
        date: '-1800',
        startYears: 1800,
        endYears: -1,
        t0: 287, // ~14°C - Température initiale pour convergence rapide
        precision: 0.01,
        // temp: '14.0°C', // DEPRECATED: Valeur de référence non utilisée dans les calculs
        logo: '🐘',
        title: '1800 - Pré-industriel',
        solar_intensity: 1.00,
        core_power_watts: 4.6e13, // Puissance géothermique totale (~46 TW)
        // core_temperature: 4000, // DEPRECATED
        // geothermal_diffusion_factor: 0.000022, // DEPRECATED
        planet_radius: 6371000, // Rayon de la planète en mètres
        gravity: 9.81, // Gravité en m/s²
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        total_atmosphere_mass_kg: 5.15e18, // Atmosphère standard (~1 bar)
        // Note: geothermal_flux ≈ 0.09 W/m² (4.6e13 / 5.1e14)
        // Simulation parameters - Quantités en kg
        co2_kg: 1.443e15, // Quantité de CO2 en kg (~280 ppm, niveau pré-industriel)
        ch4_kg: 3.605e12, // Quantité de CH4 en kg (~0.7 ppm, niveau pré-industriel)
        h2o_kg: 1.4e21, // Quantité totale d'eau en kg (100% de 1.4e21 kg)
        n2_kg: 4.017e18, // Quantité de N2 en kg (~78% de l'atmosphère moderne, non affiché dans le flux diagram)
        o2_kg: 1.0815e18, // Quantité de O2 en kg (~21% de l'atmosphère moderne, non affiché dans le flux diagram)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        cloud_coverage: 0.4, // DEPRECATED: Sera calculé dynamiquement
        albedo_base: 0.30,
        ocean_coverage: 0.70, forest_coverage: 0.15, desert_coverage: 0.10, ice_coverage: 0.05, // DEPRECATED: Sera calculé dynamiquement
        volcanoFactor: 1.0,
        events: {
            ice_meteorite: {
                water_added_kg: 1.0e18, // Quantité d'eau ajoutée par météorite
                deltaTemp: -0.5 // Refroidissement par météorite (K) - refroidissement très léger en 1800
            }
        }
    }
];

// Exposer la timeline globalement pour accès depuis main.js et autres modules
if (typeof window !== 'undefined') {
    window.configTimeline = { timeline };
    // Pour compatibilité avec l'ancien code qui utilise window.configOrganigramme.timeline
    if (window.configOrganigramme) {
        window.configOrganigramme.timeline = timeline;
    }
}

