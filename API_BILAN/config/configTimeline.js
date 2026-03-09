// File: API_BILAN/config/configTimeline.js - Configuration de la timeline (chronologie des époques)
// Desc: Données de configuration pour la timeline et les événements interactifs
// Version 1.2.4
// Date: [June 08, 2025] [HH:MM UTC+1]
// logs :
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.2.1: add sulfate proxy mass ⚖️🌫 for 🚂/📱 and disable verbose debug flags
// - v1.2.2: paramètres solveur issus de static/tuning/model_tuning.js (source unique tuning)
// - v1.2.3: fallback synchrone des paramètres solveur si window.TUNING non chargé
// - v1.2.4: 🦴 = Paléozoïque (541–252 Ma), ordre chrono Protérozoïque → Paléozoïque → Mésozoïque → Cénozoïque
// - v1.2.5: baryByGroupDefault (CLOUD_SW/SCIENCE/SOLVER %) pour init DATA['🎚️'].baryByGroup dans initDATA.js
//
// ============================================================================
// DÉFINITION DE LA CHRONOLOGIE (TIMELINE)
// ============================================================================
// Structure : array d'objets { '📅': '⚫' | '🔥' | '🦠' | '🦕' | '🦴' | '🦣' | '🚂' | '📱', '▶': number, '◀': number, ... }
// Les icônes des boutons d'événements sont définies dans events.tic_time.icon et events.meteor.icon
//
// Réfs 🌡️🧮 (temp. surface) : Kienert & Feulner Clim. Past 9:1841 (2013) ; Charnay 2017 ; PNAS 2018 ;
// Clouds/Faint Young Sun Copernicus 2011 ; Astrobiology 2014. Valeurs au DÉBUT de chaque époque (parcours temporel à venir).
// Réfs masses gaz (⚖️🏭, ⚖️⛽) : doc/VALIDATION_CONFIG_GAZ.md
const timeline = [
    {
        '📅': '⚫', // Corps noir
        '▶': 5.0e9, // Départ
        '◀': 4.5e9, // Fin
        // 🌡️🧮 : ~255 K équilibre corps noir (σT⁴ = S/4)
        '🌡️🧮': 255,
        '🧲🔬': 0.3,
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
        // 🔒 Corps noir : pas de désert, albedo = 0 (corps noir absorbe tout)
        '🍰🪩🏜️': 0.0,  // Forcer couverture désert à 0 (pas de désert pour corps noir)
        '🪩🍰': {
            '🪩🍰🌍': 0.0  // Override coefficient albedo terres à 0 (corps noir absorbe tout)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        // Note: geothermal_flux sera calculé à partir de core_temperature et geothermal_diffusion_factor
        // Simulation parameters - Quantités en kg (pas de ppm/%)
        '⚖️🏭': 0, // co2_kg (Quantité de CO2 en kg)
        '⚖️⛽': 0, // ch4_kg (Quantité de CH4 en kg)
        '⚖️💧': 0, // h2o_kg (Quantité totale d'eau en kg)
        '⚖️🫁': 0, // o2_kg (Quantité de O2 en kg)
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
        '📅': '🔥', // Hadéen — début, juste après impact formant la Lune (ordre 100–1000 ans)
        '▶': 4.5e9,
        '◀': 4.0e9,
        // 🌡️🧮 : océan de magma ~2000–2500 K (surface en fusion)
        '🌡️🧮': 2450,
        '🧲🔬': 1.7,//596,
        '🔋☀️': 2.871e26, // Puissance totale du soleil (W) - 75% de 3.828e26 W
        '🔋🌕': 1.23e21, // core_power_watts (Puissance géothermique totale calculée depuis 🧲🌕 = 2 MW/m² et R = 7008.1 km)
        // Flux géothermique colossal (2 MW/m²) pour maintenir la surface en fusion (~2400K)
        // Phase immédiate post-impact (océan de magma rayonnant) ; le temps peut avancer dans la simu
        '🧲🌕': 2000000, // geothermal_flux (W/m²) - hardcodé pour cette époque
        '📐': 7008.1, // Rayon de la planète en km
        '🍎': 9.8, // Gravité en m/s²
        '📏🌊': 100.0, // Profondeur moyenne océan de magma en km (Hadéen)
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
        '⚖️🫁': 0, // o2_kg
        // Note: Les % (co2_ppm, ch4_ppm, h2o_vapor_percent) seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés via calculations_h2o.js et calculations_atm.js
        magma_coverage: 1.0, // Spécifique Hadéen - TODO: trouver logo combo
        volcanoFactor: 10.0, // Spécifique Hadéen - TODO: trouver logo combo
        // Événements interactifs
        // Hadéen dure 500 Ma (▶ 4.5 Ga → ◀ 4.0 Ga). Courbes : T° = 🌡️🧮 + 🔺🌡️💫×tic ; 🧲🌕 = ▶→◀ ; gaz fixes.
        '🕰': {
            '💫': {
                '🔺⏳': 50,       // durée d'un tic en Ma (500 Ma / 10 tics ≈ 50 Ma/tic)
                '🔺🌡️💫': -300, // delta T° par tic (K) — refroidissement linéaire
                '🔺🧲🌕💫': {
                    '▶': 2000000, // flux géothermique début (W/m²)
                    '◀': 0.3     // flux géothermique fin (W/m²) — interpolation selon tic
                }
            },
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg (~10% de l'eau initiale)
                // deltaTemp: -3 // Inutile, déclenche aussi 📿💫++
            }
        }
    },
    {
        '📅': '🦠', // Archéen — début (4 Ga) = Archéen précoce
        '▶': 4.0e9,
        '◀': 2.5e9,
        // 🌡️🧮 : 288 K (15°C cible indicative). Lit. 281–303 K plausible (Charnay 2017, Kienert 2013).
        // 288 K = état stable documenté (Clim. Past 9:1841, Astrobiology 2014). Parcours temporel à venir.
        '🌡️🧮': 288,
        '🌡️📚': [281, 303], // Fourchette littérature (K) — disclaimer si T simulée hors plage
        '🧲🔬': 0.01,  // Précision stricte (tol ~0.4 W/m²) pour stabilité anim même époque
        '🔋☀️': 3.0624e26, // Puissance totale du soleil (W) - 80% de 3.828e26 W
        '🔋🌕': 1.5e14, // core_power_watts (Puissance géothermique totale ~150 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 4.7, // Profondeur moyenne océans en km (Archéen, moins d'eau)
        '🐚': 1.0, // Facteur relief sous-marin 
        // Surfaces géologiques (Couche A - géologie/relief)
        '🗻': {
            '🍰🗻🌊': 0.80, // Surface océanique potentielle (80% - moins de continents qu'aujourd'hui)
            '🍰🗻🏔': 0.05, // Hautes terres (5% - peu de relief élevé)
            '🍰🗻🌍': 0.15  // Terres basses (15% - premiers continents)
        },
        // Note: molar_mass_air sera calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg) via calculations.js
        '⚖️🫧': 1.0e19, // Masse atmosphère (Atmosphère dense ~2 bar)
        // Simulation parameters - Quantités en kg (lit. 1000×–10000× PAL ; 40k ppm calibré ~15°C)
        '⚖️🏭': 8.0e16, // co2_kg (~40000 ppm, calibré équilibre ~15°C, commit 5ecb155)
        '⚖️⛽': 2.0e15, // ch4_kg (~800 ppm, lit. 100–10000 ppm)
        '⚖️💧': 1.8e21, // h2o_kg (~129% actuel, litt. Harvard océans +26%)
        '⚖️🫁': 0, // o2_kg
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
        // 🌡️🧮 : ~280–290 K (lit. Protérozoïque)
        '🌡️🧮': 285,
        '🧲🔬': 0.01,
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
        '⚖️🫧': 5.15e18, // Masse atmosphère (~1 bar). Lit. 2.7 Ga: pression possiblement <0.5 bar.
        // Lit. Proterozoic: CO2 10–200× actuel; paléosols ~2.2 Ga: 8000–9000 ppm. CH4 100–300 ppm.
        '⚖️🏭': 4.7e16,  // co2_kg (~6000 ppm, milieu de fourchette lit. 5–9k ppm)
        '⚖️⛽': 2.85e14,  // ch4_kg (~100 ppm, lit. 100–300 ppm)
        '⚖️💧': 1.19e21, // h2o_kg (~85% de 1.4e21 kg)
        '⚖️🫁': 0,       // o2_kg (GOE ~2.4 Ga puis O2 bas pendant le Protérozoïque)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg
                // deltaTemp: -2 // Inutile, déclenche aussi 📿💫++
            }
        }
    },
    // 🦴 = Paléozoïque (541–252 Ma) : même niveau que Mésozoïque/Cénozoïque (ères), zéro chevauchement.
    // Ordre chronologique : … Protérozoïque → Paléozoïque → Mésozoïque → Cénozoïque …
    {
        '📅': '🦴', // Paléozoïque (541–252 Ma)
        '▶': 541e6,
        '◀': 252e6,
        // 🌡️🧮 : ~285–295 K (lit. Paléozoïque : Ordovicien–Dévonien chaud, Carbonifère–Permien glaciations)
        '🌡️🧮': 290,
        '🧲🔬': 0.01,
        '🔋☀️': 3.6e26, // Puissance soleil (~94% actuel)
        '🔋🌕': 6.5e13, // core_power_watts
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.6, // Profondeur océans (Paléozoïque)
        '🐚': 1.0,
        '🗻': {
            '🍰🗻🌊': 0.78,
            '🍰🗻🏔': 0.06,
            '🍰🗻🌍': 0.16
        },
        '⚖️🫧': 5.15e18,
        // CO2 Paléozoïque : élevé début (Ordovicien–Dévonien), plus bas Carbonifère–Permien ; valeur représentative
        '⚖️🏭': 1.2e16,  // co2_kg (~2300 ppm)
        '⚖️⛽': 3e13,
        '⚖️💧': 1.3e21,
        '⚖️🫁': 0,
        '🕰': {
            '☄️': { '🔺⚖️💧☄️': 1.0e18 }
        }
    },
    {
        '📅': '🦕', // Mésozoïque (252–66 Ma) — texture fonds/00200Ma.png (ancien 250Ma), événement 50 Ma
        '▶': 252e6,
        '◀': 66e6,
        // 🌡️🧮 : ~295–305 K (lit. Mésozoïque)
        '🌡️🧮': 298,
        '🧲🔬': 0.1,
        '🔋☀️': 3.75144e26, // Puissance totale du soleil (W) - 98% de 3.828e26 W
        '🔋🌕': 6.0e13, // core_power_watts (Puissance géothermique totale ~60 TW)
        '📐': 6371, // Rayon de la planète en km
        '🍎': 9.81, // Gravité en m/s²
        '📏🌊': 3.7, // Profondeur moyenne océans en km (Mésozoïque)
        '🐚': 1.0, // Facteur relief sous-marin
        '🗻': {
            '🍰🗻🌊': 0.71,
            '🍰🗻🏔': 0.09,
            '🍰🗻🌍': 0.20
        },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 1.2875e16, // co2_kg (~2500 ppm)
        '⚖️⛽': 4.12e13,
        '⚖️💧': 1.33e21,
        '⚖️🫁': 0,
        '🕰': {
            '💫': { '🔺🌡️💫': -2, '🔺⏳': 86400, '🔺🧲🌕💫': { '▶': 0, '◀': 0 } }, // Événement 50 Ma
            '🎇': { '⏩': '🦣' } // Big impact (K-Pg) → Cénozoïque
        }
    },
    {
        '📅': '🦣', // Cénozoïque
        '▶': 66e6,
        '◀': 0,
        // 🌡️🧮 : ~288–295 K (lit. Cénozoïque). Refroidissement → 1800 via baisse CO2 (lit. Anagnostou Nature 2016).
        '🌡️🧮': 291,
        // Override glace (patch debug) : flag OVERRIDES.useEpochIceFixed (boolean) + valeur OVERRIDES['⛄'] (ex. 0.085).
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
        // Simulation parameters - Quantités en kg. Lit. EECO ~1000-1400 ppm ; Paléocène ~600-800 ppm.
        '⚖️🏭': 5.15e15, // co2_kg (~1000 ppm, Paléocène/Eocène — baisse CO2 explique refroidissement → 1800)
        '⚖️⛽': 3.605e12, // ch4_kg (~0.7 ppm)
        '⚖️💧': 1.4e21, // h2o_kg (100% de 1.4e21 kg)
        '⚖️🫁': 1.0815e18, // o2_kg (~21% de l'atmosphère moderne)
        // Note: Les % seront calculés via calculations_atm.js
        // Note: cloud_coverage, ocean_coverage, ice_coverage seront calculés dynamiquement
        '🕰': {
            '☄️': {
                '🔺⚖️💧☄️': 1.0e18, // water_added_kg
                // deltaTemp: -1 // Inutile, déclenche aussi 📿💫++
            }
        }
    },
    // Transition Éocène-Oligocène (EOT) — 33,9 Ma : passage Serre → Glacière (avant 1800). Logo 🏔 (alphabet).
    {
        '📅': '🏔',
        '▶': 33.9e6,
        '◀': 23e6,
        '🌡️🧮': 285,
        '🧲🔬': 0.05,
        '🔋☀️': 3.82e26,
        '🔋🌕': 4.6e13,
        '📐': 6371,
        '🍎': 9.81,
        '📏🌊': 3.7,
        '🐚': 1.0,
        '🗻': { '🍰🗻🌊': 0.71, '🍰🗻🏔': 0.09, '🍰🗻🌍': 0.20 },
        '⚖️🫧': 5.15e18,
        '⚖️🏭': 2.06e15,
        '⚖️⛽': 3.6e12,
        '⚖️💧': 1.4e21,
        '⚖️🫁': 1.08e18,
        '⚖️🌫': 1e12,
        '⚖️💨': 3.97e18,
        '🕰': {}
    },
    {
        '📅': '🚂', // 1800
        '▶': 1800,
        '◀': 2025,
        // 🌡️🧮 : ~287 K (14°C, pré-industriel)
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
        '⚖️🫁': 1.0815e18, // o2_kg (~21% de l'atmosphère moderne)
        '⚖️🌫': 1.5e12, // sulfate_kg (CCN naturels uniquement : sel marin, aérosols volcaniques ; pas de pollution industrielle en 1800)
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
        // 🌡️🧮 : ~288.8 K (15.6–16°C, record chaud 2025)
        '🌡️🧮': 288.8,
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
        // Note: 🍰🪩🏜️, 🍰🪩🌳, 🍰🪩🌍 sont maintenant calculés dynamiquement dans calculateAlbedo()
        '⚖️🫧': 5.15e18, // Masse atmosphère (air sec ~1 bar, comme Industriel)
        // Simulation parameters - Quantités en kg
        '⚖️🏭': 3.3e15,   // ~420-450 ppm CO2 2025
        '⚖️⛽': 5.5e12,
        '⚖️💧': 1.4e21, // h2o_kg (100% de 1.4e21 kg)
        '⚖️🫁': 1.18e18, // O2 ~23% masse air sec
        '⚖️🌫': 8.0e13, // sulfate_kg (proxy CCN moderne)
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

// Paramètres de calcul (convergence radiatif)
// Convention de source :
// - [OBS/CALIB] : valeur issue d'observations/littérature ou calibration sur observations
// - [EQ/NUM]    : valeur de schéma numérique, solveur ou stratégie de convergence
window.CONFIG_COMPUTE = window.CONFIG_COMPUTE || {};

// Valeurs par défaut des jauges fine-tuning (% ). Utilisées uniquement à l'init de DATA['🎚️'].baryByGroup (initDATA.js). DATA seule ref ensuite.
window.CONFIG_COMPUTE.baryByGroupDefault = { CLOUD_SW: 100, SCIENCE: 100, SOLVER: 100 };

// ===================== [OBS/CALIB] =====================
// Bins spectaux (N utilisé). 500 = courbe propre ; 100 donne courbe moins précise et convergence ~1.2°C (artefact). 🔬🌈 dans [N_min, N_max].
// N_min : optionnel (spectralBinsMinFromHITRAN). Réf. scripts/hitran_spectral_bin_bounds.py.
// 2000 = courbe spectrale lisse. Réduire à 1000 si crash Brave code 5 (RAM).
window.CONFIG_COMPUTE.maxSpectralBinsConvergence = 2000;            // [OBS/CALIB]
window.CONFIG_COMPUTE.initSpectralBinsConvergence = 200;            // [OBS/CALIB] N initial (anim : 200 → … → max ; passe finale à max après convergence)
// spectralMaxMB : si défini, pas de passe finale à maxBins si grille dépasserait ce seuil (évite Brave code 5). Ex. 25.
window.CONFIG_COMPUTE.spectralMaxMB = null;                         // [OBS/CALIB] null = pas de plafond ; 25 = skip passe finale si > 25 MB
window.CONFIG_COMPUTE.spectralBinsMinFromHITRAN = null;            // [OBS/CALIB]
// true = répartition homogène (poids ∝ largeur région → même densité bins/μm partout) ; false = grille d'origine (converge bien).
window.CONFIG_COMPUTE.spectralGridHomogeneous = true;             // [OBS/CALIB]
// Pondération physique du spin-up : cycles_effectifs = cycles × f(⚖️🫧) × f(⚖️💧). Refs confirmés >= 1 au set.
var CLIMATE_SPINUP_ATM_MASS_REF_KG = 1e18;
var CLIMATE_SPINUP_WATER_MASS_REF_KG = 1e20;
window.CONFIG_COMPUTE.climateSpinupAtmMassRefKg = Math.max(1, CLIMATE_SPINUP_ATM_MASS_REF_KG);   // [OBS/CALIB]
window.CONFIG_COMPUTE.climateSpinupWaterMassRefKg = Math.max(1, CLIMATE_SPINUP_WATER_MASS_REF_KG); // [OBS/CALIB]
// Temps caractéristique fonte calotte pour l'héritage glaciaire (ans)
window.CONFIG_COMPUTE.tauGlaceAns = 50000;                         // [OBS/CALIB]
// Pressure broadening (spectroscopie) : σ_eff = σ × √(P/P_ref), utile à P>1 bar.
window.CONFIG_COMPUTE.pressureBroadening = true;                   // [OBS/CALIB]

// ===================== [EQ/NUM] =====================
window.CONFIG_COMPUTE.maxRadiatifIters = 101;                      // [EQ/NUM]
// Plafond T en Search (K). null = pas de plafond (test).
window.CONFIG_COMPUTE.maxSearchT_K = null;                         // [EQ/NUM]
// Tolérances cycle eau (changement albedo/vapor pour relancer tour radiatif)
window.CONFIG_COMPUTE.cycleTolAlbedo = 1e-4;                       // [EQ/NUM]
window.CONFIG_COMPUTE.cycleTolVapor = 1e-6;                        // [EQ/NUM]
// Spin-up climatologique avant solver radiatif (cycles eau/albédo à glace verrouillée). Confirmé >= 0 entier.
window.CONFIG_COMPUTE.climateSpinupCycles = Math.max(0, Math.floor(8)); // [EQ/NUM]
// Cycles eau/albédo par pas radiatif (1 = même résultat visu/scie 16.4°C 2025 ; 2 = visu peut dériver albédo → 15.2°C)
window.CONFIG_COMPUTE.maxWaterAlbedoCyclesPerStep = 1;             // [EQ/NUM]
// Cycles eau/albédo à l'Init uniquement (T fixe)
window.CONFIG_COMPUTE.maxWaterAlbedoCyclesAtInit = 1;              // [EQ/NUM]
// Rampe glace en convergence : step nominal et step renforcé sur les premières itérations Search
window.CONFIG_COMPUTE.iceCoverageRampMaxStep = 0.004;              // [EQ/NUM]
window.CONFIG_COMPUTE.iceCoverageRampEarlyIters = 10;              // [EQ/NUM]
window.CONFIG_COMPUTE.iceCoverageRampMaxStepEarly = 0.001;         // [EQ/NUM]

// Catégorie à part : overrides debug/patch (pas dans CONFIG_COMPUTE).
window.OVERRIDES = window.OVERRIDES || {};
// true = utiliser OVERRIDES['⛄'] (valeur override glace). Valeur ex. Cénozoïque : 0.085.
window.OVERRIDES.useEpochIceFixed = true;
window.OVERRIDES['⛄'] = 0.085;

const SOLVER_TUNING = (window.TUNING && window.TUNING.SOLVER)
    ? window.TUNING.SOLVER
    : {
        TOL_MIN_WM2: 0.05,
        MAX_SEARCH_STEP_K: 100,
        MAX_SEARCH_STEP_LARGE_K: 150,
        LARGE_DELTA_FACTOR: 10
    };
// Borne min tolérance flux (W/m²) : évite convergence impossible sous bruit numérique.
window.CONFIG_COMPUTE.tolMinWm2 = SOLVER_TUNING.TOL_MIN_WM2; // [EQ/NUM]
// Search : ΔT proportionnel à Δ (formule Δ/(4σT³)). Cap max uniquement.
window.CONFIG_COMPUTE.maxSearchStepK = SOLVER_TUNING.MAX_SEARCH_STEP_K; // [EQ/NUM]
window.CONFIG_COMPUTE.maxSearchStepLargeK = SOLVER_TUNING.MAX_SEARCH_STEP_LARGE_K; // [EQ/NUM]
window.CONFIG_COMPUTE.largeDeltaFactor = SOLVER_TUNING.LARGE_DELTA_FACTOR; // [EQ/NUM]
window.CONFIG_COMPUTE.searchStepScaleMax = 200;                    // [EQ/NUM]
// Bornes dichotomie Init
window.CONFIG_COMPUTE.bornesMinK = 250;                            // [EQ/NUM]
window.CONFIG_COMPUTE.bornesMaxK = 4000;                           // [EQ/NUM]

// ===================== [OUTIL/DEBUG/UI] =====================
// Log diagnostic EDS (h2o_eds_scale, bins, delta_z, n_layers, earth_flux, OLR, EDS)
window.CONFIG_COMPUTE.logEdsDiagnostic = false;
// Lissage visuel du spectre (affichage uniquement, pas la physique/OLR)
window.CONFIG_COMPUTE.plotSmoothEnable = true;
window.CONFIG_COMPUTE.plotSmoothSigmaBins = 8.0;//5.6;
// Logs diagnostics
window.CONFIG_COMPUTE.logIceFixedDiagnostic = false;
window.CONFIG_COMPUTE.logCloudProxyDiagnostic = false;
window.CONFIG_COMPUTE.logIrisDiagnostic = false;

