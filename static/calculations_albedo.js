// File: calculations_albedo.js - Calculs albedo et couverture nuageuse
// Desc: En français, dans l'architecture, je suis le module de calculs d'albedo
// Version 1.2.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
// - epochId Archéen : 🦠 (🌋 réservé actions). Archéen utilise clouds modernes pour ~15°C.
//
// FORMULES ALBEDO :
// 🍰🪩📿 = Σ(🍰🪩❀ × 🪩🍰❀) pour ❀ ∈ {🌋,🌊,🌳,🌍,🏜️,🧊} + contribution_glace + contribution_nuages
//   où contribution_glace = (🪩🍰🧊 - albedo_base) × 🍰💧🧊 × 0.5
//   et contribution_nuages = albedo × (1 - 🍰🪩⛅) + 🪩🍰⛅ × 🍰🪩⛅
// 🍰🪩🌋 = volcano_coverage = f(T, flux_geo) : Hadéen=1.0, sinon min(1.0, flux_geo/10000)
// 🍰🪩🌊 = ocean_coverage = (ocean_volume_m3 / (📏🌊 × 1000)) × 🐚 / (4π × 📐²)
//   où ocean_volume_m3 = (⚖️💧 × 🍰💧🌊) / 1000
// 🍰🪩🌳 = forest_coverage = f(T, ocean_coverage) : si T<30°C et ocean>0.1 alors min(0.5, ocean × (1-T/30))
// 🍰🪩🌍 = land_coverage = max(0, 1.0 - ocean - ice - forest) (continents, prairies, sols humides, albedo ~0.18)
// 🍰🪩🏜️ = desert_coverage = 1.0 - (🌋 + 🌊 + 🌳 + 🌍 + 🧊) (zones arides, albedo ~0.30)
// 🍰🪩🧊 = ice_coverage = min(0.9, 🍰💧🧊 × 0.9)
// 🍰🪩⛅ = cloud_coverage = C_max × ☁️ où C_max ≈ 0.7 et ☁️ = CloudFormationIndex

// ============================================================================
// COEFFICIENTS D'ALBÉDO PAR TYPE DE SURFACE
// ============================================================================
// Coefficients d'albédo déplacés dans CONST (propriétés physiques constantes)
// Utiliser CONST.ALBEDO_REFLECTOR_COEFF depuis physics.js

// ============================================================================
// FONCTION : CALCULER LES SURFACES GÉOLOGIQUES (COUCHE A)
// ============================================================================
// 🔒 NOUVEAU PIPELINE : Géologie → Surfaces → Stocks → Climat → Albedo
// Cette fonction fixe les surfaces à partir de la géologie/relief (quasi constants)
// Les surfaces déterminent ensuite les stocks d'eau, pas l'inverse

function calculateGeologySurfaces() {
    const DATA = window.DATA;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    
    // Lire depuis les configs epoch - DOIT EXISTER (crash si manquant)
    const ocean_basin_fraction = EPOCH['🗻']['🍰🗻🌊'];
    const highlands_fraction = EPOCH['🗻']['🍰🗻🏔'];
    const lowlands_fraction = EPOCH['🗻']['🍰🗻🌍'];
    
    // Vérifier que la somme est cohérente (doit être ≤ 1.0)
    const total = ocean_basin_fraction + lowlands_fraction + highlands_fraction;
    if (total > 1.0) {
        console.warn(`⚠️ [calculateGeologySurfaces] Somme > 1.0 (${total}), normalisation...`);
        const scale = 1.0 / total;
        ocean_basin_fraction *= scale;
        lowlands_fraction *= scale;
        highlands_fraction *= scale;
    }
    
    // Stocker les surfaces géologiques dans DATA
    // Ces valeurs sont fixes (géologie) et déterminent les stocks d'eau
    DATA['🗻']['🍰🗻🌊'] = ocean_basin_fraction;  // Surface océanique potentielle
    DATA['🗻']['🍰🗻🏔'] = highlands_fraction;     // Hautes terres (zones de glace potentielles)
    DATA['🗻']['🍰🗻🌍'] = lowlands_fraction;      // Terres basses (zones de forêts/continents)
    
    return true;
}

// ============================================================================
// FONCTION : CALCULER L'INDEX DE FORMATION NUAGEUSE (☁️)
// ============================================================================
// 🔒 REFONTE NUAGES : Les nuages ne sont pas un réservoir d'eau, mais un phénomène optique + dynamique
// ☁️ = CloudFormationIndex ∈ [0, 1] : potentiel de condensation (ni masse ni surface)
//
// FORMULE EXPLICITE :
// ☁️ = clamp((🍰🫧💧 / CONST.H2O_VAPOR_REF) × f(T_surface, 📏🫧🛩) × (1 + CONST.ALPHA_OCEAN × 🍰🪩🌊) × CONST.SCALE_CLOUD, 0, 1)
//
// Où :
//   CONST.H2O_VAPOR_REF = 0.01 (1%, référence Terre tempérée)
//   CONST.ALPHA_OCEAN = 0.3 (effet océan / convection)
//   f(T_surface, 📏🫧🛩) = fonction thermodynamique (température + tropopause)
//
// Exemple Terre moderne (2025) :
//   🍰🫧💧 = 0.0108 (1.08%), CONST.H2O_VAPOR_REF = 0.01 (1%) → vapor_ratio = 1.075
//   T = 288K (15°C), 📏🫧🛩 = 8.45 km → f(T, 📏🫧🛩) ≈ 0.771
//   🍰🪩🌊 = 0.71 → ocean_effect = 1 + 0.3 × 0.71 = 1.213
//   CONST.SCALE_CLOUD = 0.4
//   ☁️ = clamp(1.075 × 0.771 × 1.213 × 0.4, 0, 1) = clamp(0.402, 0, 1) = 0.402

function calculateCloudFormationIndex() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    // 🔒 FORMULE : ☁️ = clamp((🍰🫧💧 / CONST.H2O_VAPOR_REF) × f(T_surface, 📏🫧🛩) × (1 + CONST.ALPHA_OCEAN × 🍰🪩🌊) × CONST.SCALE_CLOUD, 0, 1)
    // où :
    //   🍰🫧💧 = fraction massique de vapeur d'eau dans l'atmosphère
    //   CONST.H2O_VAPOR_REF = 0.01 (1%, référence Terre tempérée)
    //   f(T_surface, 📏🫧🛩) = fonction thermodynamique (température + tropopause)
    //   CONST.ALPHA_OCEAN = 0.3 (effet océan / convection)
    //   🍰🪩🌊 = couverture océanique
    
    const h2o_vapor_fraction = DATA['💧']['🍰🫧💧'];
    const h2o_vapor_ref = CONST.H2O_VAPOR_REF;
    const T_surface_K = DATA['🧮']['🧮🌡️'];
    const tropopause_km = DATA['🫧']['📏🫧🛩'];
    const ocean_coverage = DATA['🪩']['🍰🪩🌊'];
    const alpha_ocean = CONST.ALPHA_OCEAN;
    const phase = DATA['🧮']['🧮⚧'];

    // 🔒 CALCUL DE 🍰🫧☔ (Humidité relative moyenne globale)
    // FORMULE : 🍰🫧☔ = clamp(🍰🫧💧 / ((CONST.M_H2O / 🧪) × 🍰🧮🌧), 0, 1)
    // où :
    //   🍰🫧💧 = fraction massique de vapeur d'eau dans l'atmosphère
    //   CONST.M_H2O = masse molaire de H2O (0.01802 kg/mol)
    //   🧪 = masse molaire de l'air (DATA['🫧']['🧪'])
    //   🍰🧮🌧 = fraction molaire maximale de vapeur saturante (P_sat / P_total)
    //   (CONST.M_H2O / 🧪) × 🍰🧮🌧 = fraction massique saturante q_sat
    //   🍰🫧☔ = q / q_sat = humidité relative (RH)
    const M_H2O = CONST.M_H2O;
    const M_air = DATA['🫧']['🧪'];
    const max_vapor_fraction = DATA['💧']['🍰🧮🌧'];
    const mass_ratio = M_H2O / M_air;
    const q_sat = mass_ratio * max_vapor_fraction;  // Fraction massique saturante
    const relative_humidity = q_sat > 0 ? Math.max(0, Math.min(1, h2o_vapor_fraction / q_sat)) : 0;
    DATA['💧']['🍰🫧☔'] = relative_humidity;
    
    // 🔒 CALCUL DE 💭☔ (Seuil critique précipitations)
    // FORMULE : 💭☔ = clamp(0.75 + 0.05 × (🧮🌡️ - CONST.EVAPORATION_T_REF) / CONST.EVAPORATION_T_SCALE, 0.7, 0.95)
    const temp_K = DATA['🧮']['🧮🌡️'];
    const temp_diff = temp_K - CONST.EVAPORATION_T_REF;
    const temp_factor = temp_diff / CONST.EVAPORATION_T_SCALE;
    const precip_threshold = Math.max(0.7, Math.min(0.95, 0.75 + 0.05 * temp_factor));
    DATA['💧']['💭☔'] = precip_threshold;

    // 🔒 CALCUL DE 🍰💭 (CCN - Efficacité condensation nuageuse)
    // FORMULE : 🍰💭 = clamp(0.4 + 0.6 × (⚖️🌫 / 1.08e18 + ⚖️⛽ / 5.2e12), 0.3, 1.0)
    const O2_mass = DATA['⚖️']['⚖️🌫'];
    const CH4_mass = DATA['⚖️']['⚖️⛽'];
    const O2_ratio = O2_mass / 1.08e18;
    const CH4_ratio = CH4_mass / 5.2e12;
    const ccn_efficiency = Math.max(0.3, Math.min(1.0, 0.4 + 0.6 * (O2_ratio + CH4_ratio)));
    DATA['🫧']['🍰💭'] = ccn_efficiency;
    
    // 🔒 FORMULE SUNDQVIST : ☁️ = (1 - Math.pow(1 - min(🍰🫧☔, 1), 0.6)) × 🍰💭
    // Exposant 0.6 (Sundqvist 1989) au lieu de 0.5 (sqrt) pour donner des valeurs plus réalistes
    const rh_clamped = Math.min(relative_humidity, 1);
    const cloud_formation_index = (1 - Math.pow(1 - rh_clamped, 0.6)) * ccn_efficiency;
    
    // Clamp entre 0 et 1
    const clamped_index = Math.max(0, Math.min(1, cloud_formation_index));
    
    // Stocker dans DATA
    DATA['🪩']['☁️'] = clamped_index;
    
    // 🔒 CALCUL DE ⏳☔ (Inverse du temps de vie moyen de la vapeur excédentaire)
    // ⏳☔ = 1 / τ_vapeur où τ_vapeur est le temps de vie moyen de la vapeur excédentaire (en s)
    // Plus ⏳☔ est grand, plus la vapeur excédentaire est rapidement précipitée
    // FORMULE : ⏳☔ = 5e-4 s⁻¹ (inverse d'un temps de vie de ~2000 s ≈ 33 min)
    DATA['💧']['⏳☔'] = 5e-4;
    
    // 🔒 INITIALISATION DE 🔺⏳ (Pas de temps fixe = 1 jour)
    // FORMULE : 🔺⏳ = 86400 s (1 jour)
    DATA['📅']['🔺⏳'] = 86400;
    
    // 🔒 CALCUL DE 🍰⚖️💦 (Précipitation critiques en kg/m²/s)
    // 🍰⚖️💦 représente la fraction massique de vapeur d'eau retirée par seconde quand l'humidité relative dépasse le seuil critique
    // FORMULE : 🍰⚖️💦 = max(0, (🍰🫧☔ - 💭☔) × 🍰🫧💧 × ⏳☔) × (masse_vapeur_par_m²)
    // Unités : (sans dimension) × (sans dimension) × (s⁻¹) × (kg/m²) = kg/m²/s
    const rh_excess = relative_humidity - precip_threshold;
    const fraction_rate = Math.max(0, rh_excess * h2o_vapor_fraction * DATA['💧']['⏳☔']); // s⁻¹ (fraction par seconde)
    // Convertir en kg/m²/s : multiplier par la masse de vapeur par m²
    const atm_mass_total = DATA['⚖️']['⚖️🫧'];
    const planet_radius_km = window.TIMELINE[DATA['📜']['👉']]['📐'];
    const planet_surface_m2 = 4 * Math.PI * Math.pow(planet_radius_km * 1000, 2);
    const vapor_mass_per_m2 = (DATA['💧']['🍰🫧💧'] * atm_mass_total) / planet_surface_m2; // kg/m²
    const precipitation_rate = fraction_rate * vapor_mass_per_m2; // kg/m²/s
    DATA['💧']['🍰⚖️💦'] = precipitation_rate;

    return clamped_index;
}

// ============================================================================
// FONCTION : CALCULER L'ALBEDO DYNAMIQUE
// ============================================================================

// Fonction pour calculer l'albedo dynamique basé sur la glace et les nuages
// Modélisation créative inspirée de :
// - "Ice-Albedo Feedback in Climate Models" (approximation simplifiée)
// - Modèles de rétroaction glace-albedo (Budyko, 1969; Sellers, 1969)
// - Paramétrisation nuageuse simplifiée pour visualisation pédagogique
function calculateAlbedo() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const T_surface_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
    const phase = DATA['🧮']['🧮⚧'];
    // 🔒 ÉTAPE 1 : Calculer les surfaces géologiques (fixes, déterminées par la géologie)
    calculateGeologySurfaces();
    
    // 🔒 ÉTAPE 1.5 : Calculer volcano_coverage depuis la température de base de l'époque
    // À 2100°C (2373K), tout est lave → volcano_coverage = 1.0
    // Transition progressive : T < 1000K → 0, T > 2373K → 1.0
    const volcano_coverage = Math.max(0, Math.min(1.0, (DATA['📅']['🌡️🧮'] - CONST.T_LAVA_START) / (CONST.T_LAVA_COMPLETE - CONST.T_LAVA_START)));
    
    // 🔒 ÉTAPE 2 : Calculer la couverture océanique réelle depuis la géologie + stocks d'eau
    // La surface océanique est limitée par la géologie ET par la quantité d'eau disponible
    // Si volcano_coverage = 1.0, alors ocean_coverage = 0 (pas de mer possible)
    const planet_surface_m2 = 4 * Math.PI * EPOCH['📐'] * EPOCH['📐'];
    
    // Volume maximum que peut contenir le bassin océanique
    const ocean_basin_surface_m2 = DATA['🗻']['🍰🗻🌊'] * planet_surface_m2;
    const ocean_volume_max_m3 = (ocean_basin_surface_m2 / EPOCH['🐚']) * EPOCH['📏🌊'] * 1000;
    const ocean_mass_max_kg = ocean_volume_max_m3 * CONST.RHO_WATER;
    
    // Masse d'eau océanique réelle = min(stock_total, capacité_bassin)
    const ocean_mass_actual_kg = Math.min(DATA['⚖️']['⚖️💧'], ocean_mass_max_kg);
    
    // Surface océanique réelle (peut être < bassin si pas assez d'eau)
    const ocean_volume_actual_m3 = ocean_mass_actual_kg / CONST.RHO_WATER;
    const ocean_surface_actual_m2 = (ocean_volume_actual_m3 / EPOCH['📏🌊'] / 1000) * EPOCH['🐚'];
    const ocean_coverage_base = Math.min(DATA['🗻']['🍰🗻🌊'], Math.max(0.0, ocean_surface_actual_m2 / planet_surface_m2));
    
    // Réduire ocean_coverage proportionnellement à volcano_coverage
    const ocean_coverage = ocean_coverage_base * (1.0 - volcano_coverage);
    
    // 🔒 Stocker ocean_coverage dans DATA AVANT calculateCloudFormationIndex()
    // calculateCloudFormationIndex() a besoin de DATA['🪩']['🍰🪩🌊'] pour calculer ☁️
    DATA['🪩']['🍰🪩🌊'] = ocean_coverage;
    
    let albedo_base = 0.0;
    
    // 🔒 ÉTAPE 3 : Calculer la couverture de glace depuis les hautes terres + climat
    // FORMULE CORRIGÉE : 🍰🪩🧊 = min(🗻.🍰🗻🏔, max(0, 0.1 × (CONST.T_NO_POLAR_ICE_C + CONST.KELVIN_TO_CELSIUS - 🧮🌡️) / CONST.T_NO_POLAR_ICE_C))
    // La glace est limitée par la surface disponible (hautes terres) ET par la température
    // En 2025 : T ≈ 15°C (288.8K), il y a ~10% de glace polaire (Groenland ~3% + Antarctique ~7%)
    // Si T > 20°C (CONST.T_NO_POLAR_ICE_C), il n'y a plus de glace polaire
    // Si T = 0°C, glace maximale = 0.1 × (T_NO_POLAR_ICE_C + KELVIN_TO_CELSIUS - KELVIN_TO_CELSIUS) / T_NO_POLAR_ICE_C = 0.1
    // Correction : Utiliser un facteur plus élevé pour avoir ~10% à 15°C
    // À 15°C : 0.1 × (293.15 - 288.8) / 20 = 0.02175 (trop faible)
    // Pour avoir 0.1 à 15°C : facteur = 0.1 / ((293.15 - 288.8) / 20) = 0.46
    const temp_K = DATA['🧮']['🧮🌡️'];
    const T_no_ice_K = CONST.T_NO_POLAR_ICE_C + CONST.KELVIN_TO_CELSIUS;
    const ice_temp_factor = Math.max(0, (T_no_ice_K - temp_K) / CONST.T_NO_POLAR_ICE_C);
    const ice_fraction_base = Math.min(DATA['🗻']['🍰🗻🏔'], 0.46 * ice_temp_factor);
    
    // 🔒 volcano_coverage déjà calculé plus haut (ligne ~200)
    
    // 🔒 ÉTAPE 4 : Calculer forêts/déserts/terres depuis l'indice d'humidité climatique (H)
    // NOUVEAU SYSTÈME : Répartition automatique 🌳 / 🏜️ / 🌍 basée sur température et précipitations
    // Les biomes dépendent uniquement de température et pluie, robuste pour d'autres planètes
    //
    // 1. Calculer précipitations annuelles P_ann (mm/an)
    // P_ann ∝ 🍰🧮🌧 × 🍰🪩🌊 × F_conv × facteur_échelle
    // Où 🍰🧮🌧 = max vapor fraction (potentiel de précipitation)
    //    🍰🪩🌊 = couverture océanique (source d'évaporation)
    //    F_conv = facteur de convection (fonction de température)
    // 🔒 CORRECTION : Le facteur d'échelle était trop faible
    // Sur Terre : 🍰🧮🌧 ≈ 0.017, 🍰🪩🌊 ≈ 0.71, F_conv ≈ 1.0
    // P_ann_base = 0.017 × 0.71 × 1.0 = 0.01207
    // Pour obtenir H ≈ 1.0 à 15°C : H = P_ann / (1000 × exp(0.05 × 15)) = P_ann / 2117
    // Donc P_ann ≈ 2117 mm/an pour H = 1.0
    // Facteur d'échelle : 2117 / 0.01207 ≈ 175000
    // Mais on veut H ≈ 1.0-1.2 pour avoir des forêts, donc facteur ≈ 200000
    const max_vapor_fraction = DATA['💧']['🍰🧮🌧'] || 0;
    const F_conv = Math.max(0.1, Math.min(2.0, 1.0 + (T_surface_C - 15) / 50));  // Facteur convection (T optimal ~15°C)
    const P_ann_base = max_vapor_fraction * ocean_coverage * F_conv;
    const P_ann = P_ann_base * 200000;  // Conversion en mm/an (facteur d'échelle corrigé)

    // 🔒 ÉTAPE 4 : Calculer ☁️ (index de formation nuageuse) AVANT de calculer les biomes
    // calculateCloudFormationIndex() calcule aussi 🍰🫧☔ (humidité relative) nécessaire pour les biomes
    window.calculateCloudFormationIndex();
    
    // 🔒 ÉTAPE 5 : Calculer les terres disponibles (🍰🪩🌍_)
    // FORMULE : 🍰🪩🌍_ = 1 - 🍰🗻🌊 - 🍰🪩🧊
    // Terres disponibles = surface totale - océans - glace
    const land_available = Math.max(0, 1.0 - DATA['🗻']['🍰🗻🌊'] - ice_fraction_base);
    
    // 🔒 ÉTAPE 6 : Calculer forêts 🌳
    // FORMULE : 🍰🪩🌳 = min(🍰🪩🌍_, 🗻.🍰🗻🌍 × clamp((🧮🌡️_C - 0) / 30, 0, 1) × clamp((🍰🫧☔ - 0.5) / 0.3, 0, 1) × clamp((1 - ☁️), 0, 1) × 0.6)
    // Dépend de : température (optimum 0-30°C), humidité relative (RH > 0.5-0.8), nuages (moins de forêts si trop de nuages)
    const temp_C = T_surface_C;
    const relative_humidity = DATA['💧']['🍰🫧☔'];
    const cloud_index = DATA['🪩']['☁️'];
    const temp_factor_forest = Math.max(0, Math.min(1, (temp_C - 0) / 30)); // Optimum thermique 0-30°C
    const humidity_factor_forest = Math.max(0, Math.min(1, (relative_humidity - 0.5) / 0.3)); // Besoin RH > 0.5-0.8
    const cloud_factor_forest = Math.max(0, Math.min(1, 1 - cloud_index)); // Moins de forêts si trop de nuages
    const forest_potential = DATA['🗻']['🍰🗻🌍'] * temp_factor_forest * humidity_factor_forest * cloud_factor_forest * 0.6;
    const forest_coverage = Math.min(land_available, forest_potential);
    
    // 🔒 ÉTAPE 7 : Calculer déserts 🏜️
    // FORMULE CORRIGÉE : 🍰🪩🏜️ = 🍰🪩🌍_ × (base_aridité + variabilité_régionale)
    // Les déserts sont des zones régionales avec conditions locales très différentes de la moyenne globale
    // En 2025 : Sahara a P_ann < 200 mm/an et RH < 0.3, mais moyenne globale P_ann ≈ 2600 mm/an et RH ≈ 0.83
    // Correction : Utiliser un facteur de variabilité régionale pour avoir ~20% de déserts même si moyenne globale est humide
    // Base : déserts si conditions moyennes sont arides
    const precip_factor_desert = Math.max(0, 1 - Math.min(1, P_ann / 1000)); // P_ann < 1000 mm/an → désert
    const humidity_factor_desert = Math.max(0, 1 - Math.min(1, relative_humidity / 0.6)); // RH < 0.6 → désert
    const desert_base = land_available * precip_factor_desert * humidity_factor_desert;
    
    // Variabilité régionale : même si moyenne globale est humide, il y a toujours des zones arides
    // Facteur basé sur la température (plus chaud → plus de variabilité) et l'inverse de l'humidité
    // En 2025 : ~20% de déserts sur les terres (Sahara, Gobi, etc.) même si moyenne globale est humide
    // Sur les terres disponibles (0.20), on veut ~0.06 de déserts (30% des terres)
    const temp_variability = Math.max(0.5, Math.min(1, (temp_C - 5) / 10)); // Plus de variabilité si T > 5°C, minimum 0.5
    const humidity_variability = Math.max(0.5, 1 - relative_humidity * 0.6); // Plus de variabilité si RH faible, minimum 0.5
    const VARIABILITY_FACTOR = 0.6; // 60% des terres disponibles peuvent être arides (pondéré par les facteurs)
    const variability_term = land_available * VARIABILITY_FACTOR * temp_variability * humidity_variability;
    
    // Si EPOCH['🍰🪩🏜️'] est défini (même si = 0.0), l'utiliser directement (override pour cas particuliers comme Corps noir)
    // Utiliser ?? au lieu de || car 0.0 est falsy mais est une valeur valide qu'on veut utiliser
    const desert_coverage = EPOCH['🍰🪩🏜️'] ?? Math.min(land_available, desert_base + variability_term);
    
    // 🔒 ÉTAPE 8 : Calculer terres restantes 🌍
    // FORMULE : 🍰🪩🌍 = 🍰🪩🌍_ - 🍰🪩🌳 - 🍰🪩🏜️
    // 🌍 absorbe automatiquement : steppes, prairies, toundras, montagnes
    const total_land_coverage = Math.max(0, land_available - forest_coverage - desert_coverage);
    
    // 🔒 VÉRIFICATION : Les surfaces SECHES doivent sommer à 1 (sans H2O, sans nuages)
    // 🍰🪩🌊 + 🍰🪩🌳 + 🍰🪩🧊 + 🍰🪩🏜️ + 🍰🪩🌍 + 🍰🪩🌋 = 1
    // Les nuages ⛅ restent hors somme (fraction optique, pas surface au sol)
    // 🔒 H2O (glace) est calculé séparément pour l'albedo, mais ice_fraction_base est dans la somme des surfaces
    const surface_sum = volcano_coverage + ocean_coverage + forest_coverage + ice_fraction_base + total_land_coverage + desert_coverage;
    if (Math.abs(surface_sum - 1.0) > 0.01) {
        console.warn(`⚠️ [calculateAlbedo] Somme des surfaces = ${surface_sum.toFixed(4)} (attendu: 1.0) | 🌋=${volcano_coverage.toFixed(3)} 🌊=${ocean_coverage.toFixed(3)} 🌳=${forest_coverage.toFixed(3)} 🧊=${ice_fraction_base.toFixed(3)} 🌍=${total_land_coverage.toFixed(3)} 🏜️=${desert_coverage.toFixed(3)}`);
    }
    
    // Stocker toutes les surfaces dans DATA['🪩'] (SURFACES SECHES, sans H2O)
    DATA['🪩']['🍰🪩🌋'] = volcano_coverage;
    DATA['🪩']['🍰🪩🌊'] = ocean_coverage;
    DATA['🪩']['🍰🪩🌳'] = forest_coverage;
    DATA['🪩']['🍰🪩🧊'] = ice_fraction_base;
    DATA['🪩']['🍰🪩🌍'] = total_land_coverage;
    DATA['🪩']['🍰🪩🏜️'] = desert_coverage;
    
    // 🔒 ALBEDO BASE : Calculer depuis les surfaces SECHES uniquement
    // Fusionner les coefficients : EPOCH peut override certains coefficients (ex: Corps noir)
    const albedo_coeff = { ...CONST['🪩🍰'], ...(EPOCH['🪩🍰'] || {}) };
    let weighted_albedo = 0;
    
    if (albedo_coeff) {
        weighted_albedo += (isFinite(volcano_coverage) ? volcano_coverage : 0) * albedo_coeff['🪩🍰🌋'];
        weighted_albedo += (isFinite(ocean_coverage) ? ocean_coverage : 0) * albedo_coeff['🪩🍰🌊'];
        weighted_albedo += (isFinite(forest_coverage) ? forest_coverage : 0) * albedo_coeff['🪩🍰🌳'];
        weighted_albedo += (isFinite(total_land_coverage) ? total_land_coverage : 0) * albedo_coeff['🪩🍰🌍'];
        weighted_albedo += (isFinite(desert_coverage) ? desert_coverage : 0) * albedo_coeff['🪩🍰🏜️'];
        weighted_albedo += (isFinite(ice_fraction_base) ? ice_fraction_base : 0) * albedo_coeff['🪩🍰🧊'];
    }
    
    albedo_base = isFinite(weighted_albedo) ? weighted_albedo : 0;
    
    let albedo = albedo_base;

    // 🔒 CONTRIBUTION H2O (GLACE) : Calculée séparément, n'affecte PAS la somme des surfaces
    // ice_fraction = fraction du stock d'eau (0-1), PAS fraction de surface
    const ice_albedo = CONST['🪩🍰']['🪩🍰🧊'];
    const ice_fraction_stock = Math.min(1.0, Math.max(0, DATA['💧']['🍰💧🧊']));
    
    // 🔒 Contribution glace à l'albedo : utilise ice_fraction_stock (fraction du stock), pas ice_fraction_base (surface)
    const ice_impact_factor = 0.5;
    const ice_albedo_contribution = (ice_albedo - albedo_base) * ice_fraction_stock * ice_impact_factor;
    albedo = albedo_base + ice_albedo_contribution;

    // Contribution des nuages (H2O activé)
    // 🔒 REFONTE : Les nuages ne sont pas un stock d'eau, mais un phénomène optique
    // 🍰🪩⛅ n'est pas une proportion de surface au sol, mais une fraction optique moyenne vue par le Soleil
    //
    // FORMULE EXPLICITE :
    // 🍰🪩⛅ = C_max × eta_cloud × ☁️
    //
    // Où :
    //   C_max = 0.65 × pressure_factor (plafond physique ajusté par pression)
    //   eta_cloud = 0.40 × temp_factor_optique (efficacité optique ajustée par température)
    //   ☁️ = CloudFormationIndex (calculé par calculateCloudFormationIndex())
    //
    // Exemple Terre 1800 :
    //   P0 = 1.0 atm → pressure_factor = 1.0 → C_max = 0.65
    //   T = 14°C → temp_factor_optique ≈ 1.0 → eta_cloud = 0.40
    //   ☁️ = 1.0
    //   🍰🪩⛅ = 0.65 × 0.40 × 1.0 = 0.26
    //
    // Les nuages saturent vite : au-delà d'un certain seuil d'humidité, c'est l'optique — pas l'eau — qui limite leur effet
    let cloud_fraction = 0;
    if (DATA['🔘']['🔘💧📛'] && DATA['💧']['🍰🫧💧'] > 0) {
        // 🔒 calculateCloudFormationIndex() a déjà été appelé plus haut (ligne ~262)
        // On réutilise DATA['🪩']['☁️'] déjà calculé
        const cloud_index = DATA['🪩']['☁️'];
        if (window.DEBUG_ANALYSE) {
            console.log('[calculateAlbedo][calculations_albedo.js] cloud_index=' + cloud_index.toFixed(4) + ' epochId=' + (DATA['📜'] && DATA['📜']['🗿'] ? DATA['📜']['🗿'] : '?'));
        }
        // Calculer C_max et eta_cloud depuis l'époque et les propriétés atmosphériques
        // C_max : plafond physique dépend de l'époque (structure verticale) et de la pression
        // eta_cloud : efficacité optique dépend de l'époque (CCN - Cloud Condensation Nuclei) et de la température
        
        const epochId = DATA['📜']['🗿'];  // ID de l'époque (🔥, 🌋, 🌊, etc.)
        
        // Facteur dynamique f_dyn selon l'époque (structure verticale)
        // Hadéen : nuages hauts dominants → couverture optique moindre
        let f_dyn = 1.0;  // Moderne (par défaut)
        if (epochId === '🔥') {
            // Hadéen : 0.4 - 0.6
            f_dyn = 0.5;
        } else if (epochId === '🦠') {
            // Archéen : clouds modernes (f_dyn=1) pour ~15°C ; 🌋 réservé actions
            f_dyn = 1.0;
        }
        // Ajustement par pression (plus de pression = plus de nuages possibles)
        const P0_atm = DATA['🫧']['🎈'];  // Pression au sol (en atmosphères)
        const P_ref_atm = 1.0;  // Pression de référence (1 atm = Terre standard)
        const pressure_factor = Math.min(1.5, Math.max(0.5, P0_atm / P_ref_atm));  // Facteur de pression (clampé)
        const C_max_base = 0.65;  // Base moderne
        const C_max = C_max_base * f_dyn * pressure_factor;  // Plafond physique ajusté par époque et pression
        
        // Facteur CCN (Cloud Condensation Nuclei) selon l'époque
        // Hadéen : peu de CCN (poussières volcaniques) → efficacité optique faible
        // Archéen : CCN modérés → efficacité modérée
        // Moderne : CCN abondants (aérosols, pollution) → efficacité maximale
        let f_CCN = 1.0;  // Moderne (par défaut)
        if (epochId === '🔥') {
            // Hadéen : 0.15 - 0.30
            f_CCN = 0.225;
        } else if (epochId === '🦠') {
            // Archéen : idem, clouds modernes
            f_CCN = 1.0;
        }
        const eta_0 = 0.40;  // Base moderne
        // Ajustement température (plus chaud = nuages plus efficaces optiquement)
        const T_surface_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;
        const temp_factor_optique = Math.min(1.2, Math.max(0.7, 1.0 + (T_surface_C - 15) / 100));  // Ajustement température
        const eta_cloud = eta_0 * f_CCN * temp_factor_optique;  // Efficacité optique ajustée par époque et température
        
        // Calculer la couverture nuageuse optique depuis l'index
        // 🍰🪩⛅ = couverture optique effective (pas un ratio de masse ni un index normalisé)
        // Pour 1800 (moderne) : 🍰🪩⛅ devrait être entre 0.20 et 0.30
        // Formule corrigée : 🍰🪩⛅ = C_max × ☁️ où C_max est le plafond physique
        // Pour moderne : C_max = 0.65, ☁️ ≈ 1.0 → 🍰🪩⛅ ≈ 0.65 (trop élevé)
        // Correction : 🍰🪩⛅ = 0.20 + (0.30 - 0.20) × ☁️ pour obtenir 0.20-0.30
        // Mais on garde C_max pour les autres époques (Hadéen, Archéen)
        // Pour moderne : 🍰🪩⛅ = 0.20 + 0.10 × ☁️ (si ☁️ = 1.0 → 0.30, si ☁️ = 0.0 → 0.20)
        if (epochId === '🔥') {
            // Hadéen seul : C_max × ☁️ ; Archéen (🦠) utilise formule moderne ci-dessous
            cloud_fraction = C_max * cloud_index;
        } else {
            // Moderne : 🍰🪩⛅ entre 0.20 et 0.30 selon ☁️
            cloud_fraction = 0.20 + 0.10 * cloud_index;
        }
        
        // Stocker la couverture nuageuse dans DATA['🪩']
        DATA['🪩']['🍰🪩⛅'] = cloud_fraction;
    } else {
        DATA['🪩']['🍰🪩⛅'] = 0;
    }

    // 🔒 FORMULE ALBEDO CORRIGÉE :
    // 🍰🪩📿 = 🍰🪩⛅ × 🪩🍰⛅ + Σ(🍰🪩❀ × 🪩🍰❀) | ❀ ∈ { 🌋,🌊,🌳,🏜️,🧊 }
    // Les nuages contribuent directement à l'albédo avec leur propre coefficient
    const cloud_albedo_coeff = albedo_coeff['🪩🍰⛅'];
    const cloud_albedo_contribution = cloud_fraction * cloud_albedo_coeff;
    albedo = albedo + cloud_albedo_contribution;

    const final_albedo = isFinite(albedo) ? Math.max(0.0, Math.min(0.9, albedo)) : 0;
    
    // 🔒 Facteur corps noir : si pas assez d'eau pour 10m de profondeur, réduire l'albedo
    // Calculer le volume d'eau disponible (m³)
    const water_volume_m3 = DATA['⚖️']['⚖️💧'] / CONST.RHO_WATER;
    
    // Surface totale de la planète (m²) - réutiliser celle calculée ligne 217
    
    // Volume minimal requis pour 10 mètres de profondeur (m³)
    const min_depth_m = 10; // 10 mètres minimum
    const min_volume_required_m3 = planet_surface_m2 * min_depth_m;
    
    // Ratio : si ratio < 1, pas assez d'eau pour 10m de profondeur
    // Si ratio = 0 (pas d'eau), blackbody_factor = 0 (corps noir)
    const water_ratio = min_volume_required_m3 > 0 ? water_volume_m3 / min_volume_required_m3 : 0;
    
    // blackbody_factor : 0 si pas d'eau, 1 si assez d'eau pour 10m
    const blackbody_factor = Math.min(1, Math.max(0, water_ratio));
    
    // Appliquer au final_albedo
    const final_albedo_with_water = final_albedo * blackbody_factor;
    
    // 🔒 Les surfaces sont déjà stockées plus haut (lignes 249-254)
    // ice_fraction_base est la surface de glace, ice_fraction_stock est la fraction du stock d'eau
    DATA['🪩']['🍰🪩📿'] = final_albedo_with_water;
    DATA['🪩']['🍰🪩⛅'] = isFinite(cloud_fraction) ? cloud_fraction : 0;
    if (window.DEBUG_ANALYSE) {
        console.log('[calculateAlbedo][calculations_albedo.js] albedo_final=' + final_albedo_with_water.toFixed(4) + ' cloud_frac=' + (isFinite(cloud_fraction) ? cloud_fraction.toFixed(4) : '0'));
    }
    return final_albedo;
}

function calculateCloudCoverage() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    if (!DATA['🔘']['🔘💧📛']) {
        return 0;
    }

    // 🔒 REFONTE : calculateCloudCoverage() est maintenant DEPRECATED
    // Utiliser calculateCloudFormationIndex() + 🍰🪩⛅ = C_max × ☁️ à la place
    // Cette fonction est conservée pour compatibilité mais ne devrait plus être utilisée
    const T_surface_C = DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS;

    if (T_surface_C < -20) {
        const T_cold = -20;
        const cloud_at_cold = 0.05;
        const decay_rate = 0.1; // Taux de décroissance
        const cloud_fraction = cloud_at_cold * Math.exp(decay_rate * (T_surface_C - T_cold));
        return Math.min(1, Math.max(0, cloud_fraction));
    } else if (T_surface_C < 0) {
        // Froid mais pas extrême : quelques nuages possibles (nuages blancs)
        // Interpolation entre -20°C (5%) et 0°C (20%)
        const cloud_at_0 = 0.2; // 20% à 0°C
        const cloud_at_cold = 0.05; // 5% à -20°C
        const cloud_fraction = cloud_at_cold + (cloud_at_0 - cloud_at_cold) * ((T_surface_C - (-20)) / 20);
        return Math.min(1, cloud_fraction);
    } else {
        // Température positive : couverture nuageuse proportionnelle à la température
        // Plus il fait chaud, plus il y a d'évaporation et donc de nuages
        // Référence : Climat tropical humide (30-35°C) → 70-80% de couverture nuageuse moyenne
        // Limitation : Utiliser une saturation douce pour éviter l'emballement thermique
        const cloud_fraction_min = 0.2; // Couverture minimale à 0°C (20%)
        const cloud_fraction_max_physical = 0.75; // Couverture maximale physique pour climat tropical humide (75%)
        const cloud_fraction_max_limited = 0.6; // Limite appliquée pour éviter l'emballement (60%)
        const T_ref_max = 30; // Température de référence maximale (°C)

        // Calculer la valeur physique (réaliste pour climat tropical humide)
        // À 0°C = 20%, à 30°C = 75% (référence : zones tropicales humides)
        let physical_fraction;
        if (T_surface_C >= T_ref_max) {
            // Au-delà de 30°C : saturation à la valeur physique maximale (75%)
            physical_fraction = cloud_fraction_max_physical;
        } else {
            // Interpolation linéaire entre 0°C et 30°C
            physical_fraction = cloud_fraction_min + (cloud_fraction_max_physical - cloud_fraction_min) *
                (T_surface_C / T_ref_max);
        }

        let final_fraction = Math.min(cloud_fraction_max_limited, physical_fraction);
        return Math.min(1, final_fraction);
    }
}

function calculateSolarFluxAbsorbed() {
    const DATA = window.DATA;
    // 🔒 CRASH si calculateAlbedo() échoue (pas de fallback)
    const albedo = calculateAlbedo();
    const solar_flux_average_wm = DATA['☀️']['🧲☀️🎱'];
    const solar_flux_reflected_wm = solar_flux_average_wm * albedo;
    const solar_flux_absorbed_wm = solar_flux_average_wm - solar_flux_reflected_wm;
    return solar_flux_absorbed_wm;
}

if (typeof window !== 'undefined') {
    window.calculateAlbedo = calculateAlbedo;
    window.calculateCloudCoverage = calculateCloudCoverage; // DEPRECATED: utiliser calculateCloudFormationIndex() + 🍰🪩⛅
    window.calculateCloudFormationIndex = calculateCloudFormationIndex; // Nouvelle fonction
    window.calculateSolarFluxAbsorbed = calculateSolarFluxAbsorbed;
    window.calculateGeologySurfaces = calculateGeologySurfaces;
}

function updateLevelsConfig() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = DATA['📅'];
    const total_atmosphere_mass_kg = DATA['⚖️']['⚖️🫧'];
    const molar_mass_air = DATA['🫧']['🧪'];
    const isCorpsNoir = DATA['📜']['🗿'] === '⚫';
    
    // Initialiser CO2 depuis EPOCH
    let co2_ppm = 0;
    if (!isCorpsNoir && EPOCH['⚖️🏭'] > 0) {
        const co2_fraction = window.co2KgToFraction(EPOCH['⚖️🏭'], total_atmosphere_mass_kg, molar_mass_air);
        co2_ppm = co2_fraction * 1e6;
    }
    
    // Initialiser CH4 depuis EPOCH
    let ch4_ppm = 0;
    if (!isCorpsNoir && EPOCH['⚖️⛽'] > 0) {
        const ch4_fraction = window.ch4KgToFraction(EPOCH['⚖️⛽'], total_atmosphere_mass_kg, molar_mass_air);
        ch4_ppm = ch4_fraction * 1e6;
    }
    
    // Initialiser H2O depuis EPOCH
    let h2o_percent = 0;
    if (EPOCH['⚖️💧'] > 0) {
        h2o_percent = (EPOCH['⚖️💧'] / total_atmosphere_mass_kg) * 100;
    }
    
    // Si maximiseData (appel depuis un événement), prendre le max entre la valeur sauvegardée et la valeur par défaut
    if (window.maximiseData) {
        const savedCO2 = window.savedCO2 || 0;
        const savedCH4 = window.savedCH4 || 0;
        const savedH2O = window.savedH2O || 0;
        co2_ppm = Math.max(savedCO2, co2_ppm);
        ch4_ppm = Math.max(savedCH4, ch4_ppm);
        h2o_percent = Math.max(savedH2O, h2o_percent);
    }
    
    // Mettre à jour plotData
    if (typeof plotData !== 'undefined') {
        plotData.co2_ppm = co2_ppm;
        plotData.ch4_ppm = ch4_ppm;
    }
    
    // Mettre à jour window.h2oVaporPercent
    window.h2oVaporPercent = h2o_percent;
    window.h2oTotalFromMeteorites = 0;
    
    console.log(`📛 🛠 [updateLevelsConfig@calculations_albedo.js] 🏭=${co2_ppm.toFixed(0)}ppm 💧=${h2o_percent.toFixed(1)}% ⛽=${ch4_ppm.toFixed(0)}ppm`);
}

// Exposer globalement pour utilisation dans main.js
window.updateLevelsConfig = updateLevelsConfig;

