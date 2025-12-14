// File: calculations_albedo.js - Calculs albedo et couverture nuageuse
// Desc: En français, dans l'architecture, je suis le module de calculs d'albedo
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: déplacement calculateAlbedo et calculateCloudCoverage depuis calculations.js

// ============================================================================
// COEFFICIENTS D'ALBÉDO PAR TYPE DE SURFACE
// ============================================================================
// Coefficients d'albédo déplacés dans CONST (propriétés physiques constantes)
// Utiliser CONST.ALBEDO_REFLECTOR_COEFF depuis physics.js

// ============================================================================
// FONCTION : CALCULER L'ALBEDO DYNAMIQUE
// ============================================================================

// Fonction pour calculer l'albedo dynamique basé sur la glace et les nuages
// Modélisation créative inspirée de :
// - "Ice-Albedo Feedback in Climate Models" (approximation simplifiée)
// - Modèles de rétroaction glace-albedo (Budyko, 1969; Sellers, 1969)
// - Paramétrisation nuageuse simplifiée pour visualisation pédagogique
function calculateAlbedo(T_surface_K, h2o_enabled, geothermal_flux = null) {
    // Utiliser DATA et CONST directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    const T_surface_C = T_surface_K - 273.15;
    
    // Récupérer l'albedo de base de l'époque courante depuis DATA
    // Calculer dynamiquement depuis les composantes (océan, glace, etc.)
    let albedo_base = 0.3; // Valeur par défaut
    
    const epoch = DATA['📅'];
    
    // Calculer dynamiquement depuis les composantes si disponibles
    // Utiliser DATA['💧'] directement (source unique de vérité)
    const ice_fraction_base = DATA['💧']['🍰💧🧊'];
    const ocean_coverage = DATA['💧']['🍰💧🌊'];
        
    // Calculer l'albedo pondéré selon les couvertures en utilisant CONST.ALBEDO_REFLECTOR_COEFF
    // D'abord déterminer les couvertures : volcan, océan, forêt, désert, glace
    
    // Volcan : en Hadéen (température très élevée) ou si flux géothermique très élevé
    let volcano_coverage = 0;
    const epochId = DATA['📜']['🗿'];
    const isHadeen = epochId === '🔥';
        if (isHadeen || (geothermal_flux && geothermal_flux > 1000)) {
            // En Hadéen : volcan = 100%, désert = 0%
            volcano_coverage = isHadeen ? 1.0 : Math.min(1.0, geothermal_flux / 10000);
                }
                
        // Forêt : apparaît quand T < 30°C et qu'il y a de l'eau (océan > 0)
        let forest_coverage = 0;
        if (T_surface_C < 30 && ocean_coverage > 0.1 && !isHadeen) {
            forest_coverage = Math.min(0.5, ocean_coverage * (1 - T_surface_C / 30));
                }
                
        // Désert : ne pas calculer comme "surface restante" par défaut
        // Le désert vient des coquillages (époques spécifiques), pas du corps noir
        // Soit il est défini dans la config, soit on le laisse à 0 pour le moment
        let desert_coverage = 0;
        // TODO: Si desert_coverage est défini dans epoch.config, l'utiliser ici
        // Pour l'instant, on laisse à 0 (pas de désert par défaut)
        
        // Calculer l'albedo pondéré avec les coefficients
        // Note: Pour Hadéen, volcano_coverage = 1.0, donc albedo_base = 1.0 * 0.05 = 0.05
        // Les nuages seront ajoutés ensuite (contribution additive)
        let weighted_albedo = 0;
        let total_coverage = 0;
        const coeff = CONST['🪞🍰'];
        
        // Albedo de surface (moyenne pondérée des couvertures)
        // Utiliser les clés emoji directement : '🪞🍰🌋', '🪞🍰🌊', etc.
        if (volcano_coverage > 0) {
            weighted_albedo += volcano_coverage * coeff['🪞🍰🌋'];
            total_coverage += volcano_coverage;
        }
        if (ocean_coverage > 0) {
            weighted_albedo += ocean_coverage * coeff['🪞🍰🌊'];
            total_coverage += ocean_coverage;
        }
        if (forest_coverage > 0) {
            weighted_albedo += forest_coverage * coeff['🪞🍰🌳'];
            total_coverage += forest_coverage;
        }
        if (desert_coverage > 0) {
            weighted_albedo += desert_coverage * coeff['🪞🍰🏖'];
            total_coverage += desert_coverage;
        }
        if (ice_fraction_base > 0) {
            weighted_albedo += ice_fraction_base * coeff['🪞🍰🧊'];
            total_coverage += ice_fraction_base;
        }
        
    // L'albedo de base est la moyenne pondérée
    if (total_coverage > 0) {
        albedo_base = weighted_albedo / total_coverage;
    } else {
        // Si aucune couverture n'est définie (total_coverage = 0), albedo = 0
        // Exemple : "corps noir" sans atmosphère, sans océan, sans rien
        albedo_base = 0;
    }
    
    let albedo = albedo_base;

    // Contribution de la glace (albedo augmente avec le froid)
    // Modélisation : transition progressive de l'albedo terrestre vers l'albedo glaciaire
    // Référence conceptuelle : rétroaction glace-albedo (modèles simplifiés de climat)
    // Si température < 0°C, il y a de la glace
    // À -2.2°C, on veut beaucoup de glace (fraction élevée)
    // ⚠️ MODIFICATION POUR GAMEPLAY : Les volcans réduisent la glace (réchauffement, fonte)
    const volcanoIceReduction = (typeof window !== 'undefined' && window.volcanoIceReduction !== undefined)
        ? window.volcanoIceReduction / 100
        : 0; // Réduction en fraction (0 à 1)

    // Récupérer le flux géothermique (si non fourni, calculer depuis core_temperature et geothermal_diffusion_factor)
    let geo_flux = geothermal_flux;
    if (geo_flux === null || geo_flux === undefined) {
        if (window.currentEpochName) {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch) {
                // 🔒 Utiliser calculateGeothermalFlux si disponible (nouveau système)
                if (window.calculateGeothermalFlux && 
                    typeof currentEpoch.core_temperature === 'number' && 
                    typeof currentEpoch.geothermal_diffusion_factor === 'number') {
                    geo_flux = window.calculateGeothermalFlux(currentEpoch.core_temperature, currentEpoch.geothermal_diffusion_factor);
                } 
                // Fallback : utiliser geothermal_flux directement (ancien système, DEPRECATED)
                else if (typeof currentEpoch.geothermal_flux === 'number') {
                    geo_flux = currentEpoch.geothermal_flux;
                }
            }
        }
        // Valeur par défaut si toujours null
        if (geo_flux === null || geo_flux === undefined) {
            geo_flux = 0.087; // Valeur moderne par défaut (W/m²)
        }
    }

    const ice_albedo = 0.7; // Albedo moyen de la glace (approximation créative)
    let ice_fraction = 0;
    let vapor_fraction = null; // 🔒 Pour calcul nuages
    
    // Calculer la glace depuis l'eau totale disponible (météorites + eau de base)
    // Utiliser calculateWaterPartition pour déterminer la répartition vapeur/glace selon la température
    const h2o_from_meteorites = (typeof window !== 'undefined' && window.h2oTotalFromMeteorites !== undefined)
        ? window.h2oTotalFromMeteorites : 0; // Eau totale des météorites en pourcentage
    const h2o_base = (typeof window !== 'undefined' && window.h2oVaporPercent !== undefined)
        ? window.h2oVaporPercent : 0; // Eau de base de l'époque en pourcentage
    const h2o_total_percent = h2o_base + h2o_from_meteorites;
    
    // Log supprimé (non essentiel)
    
    // Si on a de l'eau totale disponible, calculer la répartition vapeur/liquide/glace
    if (h2o_total_percent > 0 && typeof window !== 'undefined' && typeof window.calculateWaterPartition === 'function') {
        const h2o_total_fraction = h2o_total_percent / 100;
        
        // Récupérer les paramètres de l'époque courante (si disponibles)
        let epochParams = {};
        if (window.currentEpochName) {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch) {
            // Calculer pressure_atm et molar_mass_air depuis les composants
            const pressure_atm = window.calculatePressureAtm(currentEpoch);
            const molar_mass_air = window.calculateMolarMassAir(currentEpoch);
            
            epochParams = {
                pressure_atm: pressure_atm,
                molar_mass_air: molar_mass_air,
                gravity: currentEpoch.gravity,
                ocean_coverage: currentEpoch.ocean_coverage
            };
            
            }
        }
        
        const waterPartition = window.calculateWaterPartition(T_surface_K, h2o_total_fraction, epochParams);
        ice_fraction = waterPartition.ice_fraction; // Utiliser la glace calculée
        vapor_fraction = waterPartition.vapor_fraction; // 🔒 Récupérer la vapeur pour les nuages
        
        // Stocker la glace calculée pour les logs (toujours mettre à jour avec la nouvelle valeur)
        // 🔒 TOUJOURS recalculer et stocker la nouvelle valeur (ne pas réutiliser l'ancienne)
        window.h2oIceFractionFromCalculation = ice_fraction;
    } else if (h2o_total_percent > 0 && T_surface_C < 0) {
        // 🔒 CORRECTION : Ne calculer la glace que s'il y a de l'eau disponible
        // Calcul classique de la glace basé sur la température (si pas de calcul H2O mais qu'il y a de l'eau)
        // Albedo de la glace : ~0.6-0.9 selon l'épaisseur (valeur moyenne choisie pour visualisation)
        // Note : Le blanc (glace) ne fait pas totalement miroir, il y a une rediffusion vers le bas
        // Plus il fait froid, plus il y a de glace
        // Utiliser une fonction qui monte rapidement : à -2.2°C, on veut ~70% de la surface du globe couverte de glace
        // Fonction exponentielle pour avoir beaucoup de glace dès -2.2°C
        // À -2.2°C : fraction = 1 - exp(-2.2/3) ≈ 0.7 (70% de la surface du globe couverte de glace)
        // À -10°C : fraction ≈ 0.97 (97% de la surface du globe couverte de glace)
        ice_fraction = Math.min(1, 1 - Math.exp(T_surface_C / 3)); // Fraction de surface couverte de glace (0 à 1)

        // ⚠️ MODIFICATION POUR GAMEPLAY : Réduire la glace selon l'effet volcanique
        // Les volcans réchauffent et font fondre la glace
        ice_fraction = Math.max(0, ice_fraction - volcanoIceReduction);

        // ⚠️ NOUVEAU : Réduire la glace selon le flux géothermique
        // Le flux géothermique réchauffe la surface et fait fondre la glace
        // 15 W/m² est énorme et devrait empêcher la formation de glace
        // Formule : réduction proportionnelle au flux géothermique
        // À 0 W/m² : pas de réduction
        // À 15 W/m² : réduction maximale (fonte complète de la glace)
        // Utiliser une fonction qui réduit la glace progressivement avec le flux
        // Seuil : au-delà de 10 W/m², la glace fond complètement
        const geo_flux_reduction = Math.min(1, geo_flux / 10); // Réduction de 0 à 1 selon le flux (seuil à 10 W/m²)
        ice_fraction = Math.max(0, ice_fraction * (1 - geo_flux_reduction));
    }
    
    // Limiter la glace à 100% de la surface (physiquement, on ne peut pas avoir plus de 100% de glace)
    // Note: window.h2oIceFractionFromCalculation est mis à jour dans le bloc calculateWaterPartition ci-dessus
    ice_fraction = Math.min(1.0, Math.max(0, ice_fraction));
    
    if (ice_fraction > 0) {
        // Transition progressive : albedo = base + (glace - base) * fraction_glace
        // Utiliser l'albedo de base de l'époque (déjà récupéré plus haut)
        albedo = albedo_base + (ice_albedo - albedo_base) * ice_fraction;
    }

    // Contribution des nuages (H2O activé)
    // IMPORTANT : Les nuages sont toujours ajoutés si DATA['💧']['🍰💧⛅'] est défini, même si h2o_enabled est false
    // car DATA['💧']['🍰💧⛅'] représente la couverture nuageuse calculée, indépendamment de l'état du bouton
    let cloud_fraction = 0;
    const h2o_cloud_key = '🍰💧⛅';  // Clé emoji directe selon dico.js
    if (window.DATA && window.DATA['💧'] && window.DATA['💧'][h2o_cloud_key] !== undefined) {
        cloud_fraction = window.DATA['💧'][h2o_cloud_key]; // Déjà en fraction (< 1.0)
    } else if (h2o_enabled) {
        // Fallback : calculer avec calculateCloudCoverage si DATA['💧'] n'est pas encore disponible
        cloud_fraction = calculateCloudCoverage(T_surface_K, h2o_enabled, vapor_fraction);
    }

    // Toujours ajouter la contribution des nuages si cloud_fraction > 0
    // (pas de seuil minimum, car DATA['💧'][h2o_cloud_key] est déjà calculé avec précision)
    if (cloud_fraction > 0) {
        const coeff = window.CONST['🪞🍰'];
        const cloud_albedo_coeff = coeff['🪞🍰⛅']; // Coefficient d'albédo des nuages
        
        // Contribution des nuages : albedo_nuages × couverture_nuageuse
        // Les nuages sont dans l'atmosphère, donc ils ajoutent leur contribution à l'albedo de surface
        const cloud_contribution = cloud_albedo_coeff * cloud_fraction;
        albedo = albedo + cloud_contribution;
    }

    // Clamper entre 0.0 (corps noir) et 0.9 (valeurs physiques raisonnables)
    // Permettre 0.0 pour le corps noir, mais limiter à 0.9 maximum
    const final_albedo = Math.max(0.0, Math.min(0.9, albedo));
    
    // Récupérer les couvertures depuis DATA['💧'] (source unique de vérité)
    let ocean_coverage_display = DATA['💧']['🍰💧🌊'];
    let ice_coverage_display = DATA['💧']['🍰💧🧊'];
    const cloud_coverage_display = DATA['💧']['🍰💧⛅'];
    
    // NOTE : Effet de l'obliquité (inclinaison axiale) sur l'albedo de la glace
    // L'obliquité détermine l'angle d'incidence solaire sur la glace polaire :
    // - Obliquité élevée (24.5°) → pôles plus face au soleil en été → plus de fonte → moins de glace persistante → albedo plus faible
    // - Obliquité faible (22.1°) → pôles moins face au soleil → moins de fonte → plus de glace persistante → albedo plus élevé
    // Cependant, pour une température moyenne annuelle globale :
    // - L'obliquité varie peu (22.1° à 24.5°, écart de 2.4°)
    // - L'effet principal est saisonnier, pas annuel
    // - Pour des époques anciennes (> 1 Ma), d'autres facteurs dominent (CO2, albedo, volcanisme)
    // - Pour des époques récentes (< 500 ka), l'effet peut être significatif mais reste faible comparé à la température
    // CONCLUSION : L'effet de l'obliquité sur l'albedo de la glace est probablement négligeable pour la plupart des époques
    // Si nécessaire, on peut ajouter : obliquity_factor = 1.0 - (obliquity - 23.44) / 23.44 * 0.1 (max ±10% d'ajustement)
    
    // Calculer les couvertures (même logique que pour albedo_base)
    const epochId_display = DATA['📜']['🗿'];
    const isHadeen_display = epochId_display === '🔥';
        
    // Volcan : en Hadéen = 100%, sinon selon flux géothermique
    let volcano_coverage_display = 0;
    if (isHadeen_display) {
        volcano_coverage_display = 1.0;
    } else if (geothermal_flux && geothermal_flux > 1000) {
        volcano_coverage_display = Math.min(1.0, geothermal_flux / 10000);
    }
    
    // Forêt : apparaît quand T < 30°C et qu'il y a de l'eau (océan > 0)
    let forest_coverage_display = 0;
    if (T_surface_C < 30 && ocean_coverage_display > 0.1 && !isHadeen_display) {
        forest_coverage_display = Math.min(0.5, ocean_coverage_display * (1 - T_surface_C / 30));
    }
    
    // Désert : calculer comme surface restante si les autres couvertures ne somment pas à 1.0
    // Le désert apparaît dans les zones sèches (pas d'océan, pas de forêt, pas de glace)
    let desert_coverage_display = 0;
    const other_coverages = volcano_coverage_display + ocean_coverage_display + forest_coverage_display + ice_coverage_display;
    if (other_coverages < 1.0) {
        desert_coverage_display = 1.0 - other_coverages;
    }
    
    // Normaliser les couvertures pour que la somme = 1.0
    // Les couvertures sont : volcan, océan, forêt, désert, glace (nuages sont séparés, pas une couverture de surface)
    const total_surface_coverage = volcano_coverage_display + ocean_coverage_display + forest_coverage_display + desert_coverage_display + ice_coverage_display;
    if (total_surface_coverage > 0 && Math.abs(total_surface_coverage - 1.0) > 0.01) {
        const scale = 1.0 / total_surface_coverage;
        volcano_coverage_display *= scale;
        ocean_coverage_display *= scale;
        forest_coverage_display *= scale;
        desert_coverage_display *= scale;
        ice_coverage_display *= scale;
    }
    
    // Mettre à jour DATA directement (source unique de vérité)
    DATA['🪞']['🍰🪞📿'] = final_albedo;  // Albedo total
    DATA['🪞']['🍰🪞🌋'] = volcano_coverage_display;  // Volcan
    DATA['🪞']['🍰🪞🌊'] = ocean_coverage_display;  // Océan
    DATA['🪞']['🍰🪞🌳'] = forest_coverage_display;  // Forêt
    DATA['🪞']['🍰🪞🏖'] = desert_coverage_display;  // Désert
    DATA['🪞']['🍰🪞🧊'] = ice_coverage_display;  // Glace
    DATA['🪞']['🍰🪞⛅'] = cloud_coverage_display;  // Nuages (pas une couverture de surface, mais une couverture atmosphérique)
    
    // Albedo stocké dans DATA['🪞'] (source unique de vérité)
    // window.albedo supprimé, utiliser DATA['🪞'] directement
    
    return final_albedo;
}

// ============================================================================
// FONCTION : CALCULER LA COUVERTURE NUAGEUSE
// ============================================================================

// Fonction pour calculer la couverture nuageuse (fraction de surface couverte vue depuis le ciel)
function calculateCloudCoverage(T_surface_K, h2o_enabled, vapor_fraction_override = null) {
    if (!h2o_enabled) {
        // ⚠️ MODIFICATION POUR GAMEPLAY : Les volcans peuvent créer des nuages même si H2O désactivé
        // Les volcans émettent de la vapeur d'eau et des particules qui forment des nuages
        const volcanoBonus = (typeof window !== 'undefined' && window.volcanoH2OBonus !== undefined)
            ? window.volcanoH2OBonus / 100
            : 0;
        if (volcanoBonus > 0) {
            return Math.min(1, volcanoBonus); // Bonus volcanique en fraction (0 à 1)
        }
        return 0; // Pas de nuages si H2O désactivé et pas de volcans
    }

    // 🔒 CORRECTION : Vérifier la disponibilité de l'eau
    // Si on utilise estimateCloudCoverage (plus précis), on a besoin de la fraction de vapeur
    if (window.estimateCloudCoverage) {
        let vapor_fraction = vapor_fraction_override;
        
        // Si pas fourni, essayer de le calculer ou de l'estimer
        if (vapor_fraction === null) {
            // Récupérer l'eau totale
            const h2o_from_meteorites = (window.h2oTotalFromMeteorites !== undefined) ? window.h2oTotalFromMeteorites : 0;
            const h2o_base = (window.h2oVaporPercent !== undefined) ? window.h2oVaporPercent : 0;
            const h2o_total_percent = h2o_base + h2o_from_meteorites;
            
            if (h2o_total_percent <= 0.01) {
                // Pas d'eau = pas de nuages (sauf volcans)
                 const volcanoBonus = (window.volcanoH2OBonus !== undefined) ? window.volcanoH2OBonus / 100 : 0;
                 return Math.min(1, volcanoBonus);
            }
            
            // Si on a de l'eau, estimer la part de vapeur
            if (window.calculateWaterPartition) {
                // Construire epochParams avec les paramètres physiques nécessaires
                let epochParams = {};
                if (window.currentEpochName) {
                    const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
                    if (currentEpoch) {
                        // Calculer pressure_atm et molar_mass_air depuis les composants
                        const pressure_atm = window.calculatePressureAtm(currentEpoch);
                        const molar_mass_air = window.calculateMolarMassAir(currentEpoch);
                        
                        epochParams = {
                            pressure_atm: pressure_atm, // Calculé depuis total_atmosphere_mass_kg, gravity, planet_radius
                            molar_mass_air: molar_mass_air, // Calculé depuis les composants (n2_kg, o2_kg, co2_kg, ch4_kg)
                            gravity: currentEpoch.gravity,
                            ocean_coverage: currentEpoch.ocean_coverage
                        };
                    }
                }
                const wp = window.calculateWaterPartition(T_surface_K, h2o_total_percent / 100, epochParams);
                vapor_fraction = wp.vapor_fraction;
            } else {
                // Fallback : tout est vapeur si > 100°C, sinon fraction
                vapor_fraction = (T_surface_K > 373) ? h2o_total_percent / 100 : (h2o_total_percent / 100) * 0.5;
            }
        }
        
        // Utiliser la fonction d'estimation plus précise
        let cloud_cov = window.estimateCloudCoverage(T_surface_K, vapor_fraction);
        
        // Ajouter le bonus volcanique
        const volcanoBonus = (typeof window !== 'undefined' && window.volcanoH2OBonus !== undefined)
            ? window.volcanoH2OBonus / 100
            : 0;
            
        return Math.min(1, cloud_cov + volcanoBonus);
    }

    const T_surface_C = T_surface_K - 273.15;

    // ⚠️ MODIFICATION POUR GAMEPLAY : Bonus volcanique sur la couverture nuageuse
    // Les volcans émettent de la vapeur d'eau et des particules qui augmentent la couverture nuageuse
    const volcanoBonus = (typeof window !== 'undefined' && window.volcanoH2OBonus !== undefined)
        ? window.volcanoH2OBonus / 100
        : 0; // Bonus en fraction (0 à 1)

    // À très basse température (< -20°C), l'air est très sec, peu de nuages possibles
    // Nuages blancs (cirrus, stratus) : nécessitent de la vapeur d'eau, peu probables à très basse température
    // Nuages noirs (orageux) : encore moins probables à très basse température
    // À des températures très froides, la couverture nuageuse doit être proche de 0

    if (T_surface_C < -20) {
        // Très froid : presque pas de nuages (air très sec)
        // Fonction décroissante exponentielle : à -60°C ≈ 0%, à -20°C = 5%
        // Calcul à -60°C : 0.05 * exp(0.1 * (-60 - (-20))) = 0.05 * exp(-4) ≈ 0.0009 ≈ 0%
        const T_cold = -20; // Seuil de froid
        const cloud_at_cold = 0.05; // 5% à -20°C
        const decay_rate = 0.1; // Taux de décroissance
        let cloud_fraction = cloud_at_cold * Math.exp(decay_rate * (T_surface_C - T_cold));

        // ⚠️ MODIFICATION POUR GAMEPLAY : Ajouter le bonus volcanique même par temps très froid
        cloud_fraction = Math.min(1, Math.max(0, cloud_fraction) + volcanoBonus);

        return cloud_fraction;
    } else if (T_surface_C < 0) {
        // Froid mais pas extrême : quelques nuages possibles (nuages blancs)
        // Interpolation entre -20°C (5%) et 0°C (20%)
        const cloud_at_0 = 0.2; // 20% à 0°C
        const cloud_at_cold = 0.05; // 5% à -20°C
        let cloud_fraction = cloud_at_cold + (cloud_at_0 - cloud_at_cold) * ((T_surface_C - (-20)) / 20);

        // ⚠️ MODIFICATION POUR GAMEPLAY : Ajouter le bonus volcanique
        cloud_fraction = Math.min(1, cloud_fraction + volcanoBonus);

        return cloud_fraction;
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

        // Appliquer une limitation à 60% pour éviter l'emballement thermique
        // (compromis entre réalisme physique et stabilité numérique)
        let final_fraction = Math.min(cloud_fraction_max_limited, physical_fraction);

        // ⚠️ MODIFICATION POUR GAMEPLAY : Ajouter le bonus volcanique (les volcans augmentent la couverture nuageuse)
        final_fraction = Math.min(1, final_fraction + volcanoBonus);

        return final_fraction;
    }
}

// ============================================================================
// FONCTION : CALCULER LE FLUX SOLAIRE ABSORBÉ
// ============================================================================

// Fonction pour calculer le flux solaire absorbé avec albedo dynamique
// ✅ FORMULE TOUJOURS UTILISÉE : solar_flux_absorbed_wm = solar_flux_average_wm - solar_flux_reflected_wm
// - Pas de cas particulier, même en corps noir (albedo = 0, donc solar_flux_reflected_wm = 0)
// - Entrer dans la formule avec des paramètres à 0 est plus propre que de zapper des étapes
// - La division par 4 vient de la géométrie sphérique : surface 4πr² vs section πr² (facteur 4)
function calculateSolarFluxAbsorbed(T_surface_K, h2o_enabled, geothermal_flux = null) {
    const albedo = calculateAlbedo(T_surface_K, h2o_enabled, geothermal_flux);
    
    // Utiliser DATA['☀️']['🧲☀️🎱'] comme source unique (flux solaire moyen sphérique, AVANT albedo)
    // Par définition : 🧲☀️🎱 = 🧲☀️📜 / 4 (rapporté au rayon au sol pour les m²)
    let solar_flux_average_wm;
    if (window.DATA && window.DATA['☀️'] && window.DATA['☀️']['🧲☀️🎱'] !== undefined) {
        // Utiliser DATA['☀️']['🧲☀️🎱'] directement (source unique)
        solar_flux_average_wm = window.DATA['☀️']['🧲☀️🎱'];
    } else {
        // Fallback : calculer depuis window.SOLAR_CONSTANT ou valeur par défaut
        const SOLAR_CONSTANT = window.SOLAR_CONSTANT || 1366;
        solar_flux_average_wm = SOLAR_CONSTANT / 4;
    }
    
    // 🔒 FORMULE TOUJOURS UTILISÉE : solar_flux_absorbed_wm = solar_flux_average_wm - solar_flux_reflected_wm
    // = solar_flux_average_wm × (1 - albedo)
    const solar_flux_reflected_wm = solar_flux_average_wm * albedo; // Flux réfléchi (peut être 0 si albedo = 0)
    const solar_flux_absorbed_wm = solar_flux_average_wm - solar_flux_reflected_wm; // Flux absorbé
    
    return solar_flux_absorbed_wm;
}

// ============================================================================
// EXPOSITION GLOBALE
// ============================================================================

if (typeof window !== 'undefined') {
    // Sauvegarder les fonctions originales avant de les exposer
    // (pour éviter les conflits avec les wrappers dans calculations.js)
    const originalCalculateAlbedo = calculateAlbedo;
    const originalCalculateCloudCoverage = calculateCloudCoverage;
    const originalCalculateSolarFluxAbsorbed = calculateSolarFluxAbsorbed;
    
    // Exposer les fonctions avec un nom unique pour éviter les conflits
    window._calculateAlbedoOriginal = originalCalculateAlbedo;
    window._calculateCloudCoverageOriginal = originalCalculateCloudCoverage;
    window._calculateSolarFluxAbsorbedOriginal = originalCalculateSolarFluxAbsorbed;
    
    // Exposer aussi avec les noms standards (pour compatibilité)
    window.calculateAlbedo = originalCalculateAlbedo;
    window.calculateCloudCoverage = originalCalculateCloudCoverage;
    window.calculateSolarFluxAbsorbed = originalCalculateSolarFluxAbsorbed;
}

// ============================================================================
// FONCTION : METTRE À JOUR LES NIVEAUX DEPUIS LA CONFIG DE L'ÉPOQUE
// ============================================================================

// Fonction pour initialiser les niveaux de CO2, H2O, CH4 depuis la config de l'époque
// Appelée depuis setEpoch pour initialiser les valeurs depuis la config
// Initialise les niveaux depuis DATA et EPOCH (utilise DATA directement, pas de paramètres)
function updateLevelsConfig() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = DATA['📅'];
    const total_atmosphere_mass_kg = DATA['⚖️']['⚖️📿'];
    const molar_mass_air = DATA['🌬']['🧪'];
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

