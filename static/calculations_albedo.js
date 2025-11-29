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
// FONCTION : CALCULER L'ALBEDO DYNAMIQUE
// ============================================================================

// Fonction pour calculer l'albedo dynamique basé sur la glace et les nuages
// Modélisation créative inspirée de :
// - "Ice-Albedo Feedback in Climate Models" (approximation simplifiée)
// - Modèles de rétroaction glace-albedo (Budyko, 1969; Sellers, 1969)
// - Paramétrisation nuageuse simplifiée pour visualisation pédagogique
function calculateAlbedo(T_surface_K, h2o_enabled, geothermal_flux = null) {
    const T_surface_C = T_surface_K - 273.15;
    
    // Récupérer l'albedo de base de l'époque courante
    // Calculer depuis les composantes détaillées ou utiliser albedo_base de l'époque
    let albedo_base = null; // Pas de valeur par défaut, on doit toujours avoir une époque
    let epochName = 'default';
    
    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            epochName = currentEpoch.name || window.currentEpochName;
            
            // Si l'époque a des composantes détaillées, calculer l'albedo de base comme moyenne pondérée
            if (currentEpoch.ocean_coverage !== undefined || currentEpoch.magma_coverage !== undefined) {
                let total_coverage = 0;
                let weighted_albedo = 0;
                
                // Magma (Hadéen uniquement)
                if (currentEpoch.magma_coverage !== undefined && currentEpoch.magma_albedo !== undefined) {
                    const magma_cov = currentEpoch.magma_coverage; // Déjà en fraction (0-1)
                    weighted_albedo += currentEpoch.magma_albedo * magma_cov;
                    total_coverage += magma_cov;
                }
                
                // Océans
                if (currentEpoch.ocean_coverage !== undefined && currentEpoch.ocean_albedo !== undefined) {
                    const ocean_cov = currentEpoch.ocean_coverage; // Déjà en fraction (0-1)
                    weighted_albedo += currentEpoch.ocean_albedo * ocean_cov;
                    total_coverage += ocean_cov;
                }
                
                // Forêts
                if (currentEpoch.forest_coverage !== undefined && currentEpoch.forest_albedo !== undefined) {
                    const forest_cov = currentEpoch.forest_coverage; // Déjà en fraction (0-1)
                    weighted_albedo += currentEpoch.forest_albedo * forest_cov;
                    total_coverage += forest_cov;
                }
                
                // Déserts
                if (currentEpoch.desert_coverage !== undefined && currentEpoch.desert_albedo !== undefined) {
                    const desert_cov = currentEpoch.desert_coverage; // Déjà en fraction (0-1)
                    weighted_albedo += currentEpoch.desert_albedo * desert_cov;
                    total_coverage += desert_cov;
                }
                
                // Si total_coverage > 0, utiliser la moyenne pondérée, sinon utiliser albedo_base
                if (total_coverage > 0) {
                    albedo_base = weighted_albedo / total_coverage;
                } else if (typeof currentEpoch.albedo_base === 'number') {
                    albedo_base = currentEpoch.albedo_base;
                }
            } else if (typeof currentEpoch.albedo_base === 'number') {
                // Sinon, utiliser directement albedo_base
                albedo_base = currentEpoch.albedo_base;
            }
        }
    }
    
    // Si albedo_base est toujours null, utiliser la dernière époque comme fallback
    if (albedo_base === null && typeof window !== 'undefined' && window.GEOLOGICAL_PERIODS) {
        const lastEpoch = window.GEOLOGICAL_PERIODS[window.GEOLOGICAL_PERIODS.length - 1];
        if (lastEpoch) {
            // Calculer depuis les composantes ou utiliser albedo_base
            if (lastEpoch.ocean_coverage !== undefined || lastEpoch.magma_coverage !== undefined) {
                let total_coverage = 0;
                let weighted_albedo = 0;
                
                if (lastEpoch.magma_coverage !== undefined && lastEpoch.magma_albedo !== undefined) {
                    weighted_albedo += lastEpoch.magma_albedo * lastEpoch.magma_coverage;
                    total_coverage += lastEpoch.magma_coverage;
                }
                if (lastEpoch.ocean_coverage !== undefined && lastEpoch.ocean_albedo !== undefined) {
                    weighted_albedo += lastEpoch.ocean_albedo * lastEpoch.ocean_coverage;
                    total_coverage += lastEpoch.ocean_coverage;
                }
                if (lastEpoch.forest_coverage !== undefined && lastEpoch.forest_albedo !== undefined) {
                    weighted_albedo += lastEpoch.forest_albedo * lastEpoch.forest_coverage;
                    total_coverage += lastEpoch.forest_coverage;
                }
                if (lastEpoch.desert_coverage !== undefined && lastEpoch.desert_albedo !== undefined) {
                    weighted_albedo += lastEpoch.desert_albedo * lastEpoch.desert_coverage;
                    total_coverage += lastEpoch.desert_coverage;
                }
                
                if (total_coverage > 0) {
                    albedo_base = weighted_albedo / total_coverage;
                } else if (typeof lastEpoch.albedo_base === 'number') {
                    albedo_base = lastEpoch.albedo_base;
                }
            } else if (typeof lastEpoch.albedo_base === 'number') {
                albedo_base = lastEpoch.albedo_base;
            }
        }
    }
    
    // Si toujours null, erreur (ne devrait jamais arriver si les époques sont bien configurées)
    if (albedo_base === null) {
        console.error('[ALBEDO] Erreur : impossible de déterminer albedo_base, aucune époque trouvée');
        albedo_base = 0.3; // Dernier recours uniquement pour éviter un crash
    }
    
    let albedo = albedo_base;
    console.log(`[ALBEDO] Début calcul: T=${T_surface_K.toFixed(2)}K (${T_surface_C.toFixed(2)}°C), h2o=${h2o_enabled}, geo_flux=${geothermal_flux}, albedo_base=${albedo_base.toFixed(3)} (époque: ${epochName})`);

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
        if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch) {
                // 🔒 Utiliser calculateGeothermalFlux si disponible (nouveau système)
                if (typeof window.calculateGeothermalFlux === 'function' && 
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
    
    // Si on a de l'eau totale disponible, calculer la répartition vapeur/liquide/glace
    if (h2o_total_percent > 0 && typeof window !== 'undefined' && typeof window.calculateWaterPartition === 'function') {
        const h2o_total_fraction = h2o_total_percent / 100;
        
        // Récupérer les paramètres de l'époque courante (si disponibles)
        let epochParams = {};
        if (window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch) {
                epochParams = {
                    pressure_atm: currentEpoch.atmospheric_pressure, // Peut être undefined -> doit être géré dans waterPartition
                    molar_mass_air: currentEpoch.molar_mass_air,
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
        if (typeof window !== 'undefined') {
            window.h2oIceFractionFromCalculation = ice_fraction;
        }
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
        console.log(`[ALBEDO] Contribution glace: ice_fraction=${ice_fraction.toFixed(3)}, ice_percent=${(ice_fraction * 100).toFixed(1)}%, albedo_base=${albedo_base.toFixed(3)}, albedo=${albedo.toFixed(3)}`);
    }

    // Contribution des nuages (H2O activé)
    // Modélisation : ajout d'un albedo nuageux moyen lorsque H2O est activé
    // Référence conceptuelle : paramétrisation nuageuse simplifiée (modèles climatiques simplifiés)
    // Note : Les nuages noirs (épais, sombres) n'ont pas d'albedo significatif
    // Note : Sur les nuages, la réflexion/absorption ne passe pas très bien dans les deux sens,
    // mais ce ne sont pas les mêmes fréquences, donc pas les mêmes absorption/miroir/radiation
    // Note : La couverture nuageuse est proportionnelle/croissante avec la température au sol
    // (plus il fait chaud, plus il y a d'évaporation et donc de nuages)
    // TODO : Justifier ce choix de modélisation (couverture nuageuse vs température, altitude, etc.)
    if (h2o_enabled) {
        // Utiliser la fonction dédiée pour calculer la couverture nuageuse
        const cloud_fraction = calculateCloudCoverage(T_surface_K, h2o_enabled, vapor_fraction);

        // Seuil minimum : ne pas appliquer l'albedo nuageux si la couverture est trop faible (< 5%)
        // Cela évite que 1% de nuages ait un impact drastique sur l'albedo
        if (cloud_fraction >= 0.05) {
            // Albedo des nuages : ~0.3-0.6 selon la couverture nuageuse (valeur moyenne choisie)
            const cloud_albedo = 0.4; // Albedo moyen des nuages (approximation créative)

            // Diviser par 2 car les nuages noirs ne réfléchissent pas (ou très peu)
            // Ajuster la contribution pour qu'elle soit proportionnelle à la couverture nuageuse
            // mais avec un effet plus doux pour les faibles couvertures
            const cloud_contribution = (cloud_albedo * cloud_fraction) / 2;
            albedo = albedo + cloud_contribution;
            console.log(`[ALBEDO] Contribution nuages: cloud_fraction=${cloud_fraction.toFixed(3)}, cloud_contribution=${cloud_contribution.toFixed(3)}, albedo=${albedo.toFixed(3)}`);
        }
        // Si cloud_fraction < 5%, on n'ajoute pas de contribution nuageuse à l'albedo
    }

    // Clamper entre 0.0 (corps noir) et 0.9 (valeurs physiques raisonnables)
    // Permettre 0.0 pour le corps noir, mais limiter à 0.9 maximum
    const final_albedo = Math.max(0.0, Math.min(0.9, albedo));
    console.log(`[ALBEDO] Résultat final: ${final_albedo.toFixed(3)} (${(final_albedo * 100).toFixed(1)}%)`);
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
    if (typeof window !== 'undefined' && typeof window.estimateCloudCoverage === 'function') {
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
            if (typeof window.calculateWaterPartition === 'function') {
                // Estimation rapide (paramètres par défaut)
                const wp = window.calculateWaterPartition(T_surface_K, h2o_total_percent / 100);
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
// ✅ SCIENTIFIQUEMENT CERTAIN : 
// - La formule F = S_0 * (1 - A) / 4 est la base de l'équilibre radiatif terrestre
// - La division par 4 vient de la géométrie sphérique : surface 4πr² vs section πr² (facteur 4)
// - Cette formule est utilisée dans tous les modèles climatiques (IPCC, GCM)
function calculateSolarFluxAbsorbed(T_surface_K, h2o_enabled, geothermal_flux = null) {
    const albedo = calculateAlbedo(T_surface_K, h2o_enabled, geothermal_flux);
    const SOLAR_CONSTANT = window.SOLAR_CONSTANT || 1366;
    const flux_absorbed = SOLAR_CONSTANT * (1 - albedo) / 4; // Divisé par 4 car la surface de la sphère (4πr²) est 4 fois la section (πr²)
    return flux_absorbed;
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

