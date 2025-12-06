// ============================================================================
// File: static/compute/calculations_flux.js - Calculs de flux radiatif
// Desc: En français, dans l'architecture, je suis le module de calculs de flux radiatif
// Version 1.2.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: calculs de flux radiatif simplifiés
//   - Updated getGasValuesFromConfig to return kg values (co2_kg, ch4_kg, h2o_kg) from config
//   - Fixed computeRadiativeTransfer to calculate h2o_total_percent from h2o_kg config + meteorites
//   - Fixed computeRadiativeTransfer to use h2o_total_percent instead of h2o_total_MT
//   - Moved to static/compute/ and updated to use window.LOGOS
// ============================================================================

// ============================================================================
// FONCTIONS DE CALCUL DE FLUX RADIATIF
// ============================================================================

// 🔒 VARIABLES GLOBALES : window.enabledStates (créé par getEnabledStates()) remplace isH2O_eds, isCO2_eds, etc.
// Ces variables sont mises à jour UNIQUEMENT au clic sur les boutons (dans organigramme.js)
// Ne PAS vérifier directement le DOM, utiliser ces variables globales

// Fonction helper pour récupérer les logos : définie dans compute.js (chargé avant ce fichier)
// On utilise window.getLogo() exposé depuis compute.js

// Variables d'état : déclarées dans compute.js (chargé avant ce fichier)
// On utilise les variables globales définies dans compute.js
// old_T0, T0, Phase, signeDeltaFirst, flux_entrant sont accessibles depuis compute.js

// Fonctions getAnimState() et getEpochDateConfig() : définies dans compute.js (chargé avant ce fichier)
// window.epoch est utilisé directement (pas de fonction getEpochConfig)
// On utilise les fonctions globales définies dans compute.js

// (🎬) => T0=🏮 : T0=🌡️, puis T0 += ☄️*🌡️☄️ + 💫*🌡️💫
// dateConfig utilise maintenant les logos complets selon grammar.txt
function calculateT0(dateConfig) {
    // Récupérer old_T0 depuis '🌡️🏮📜' (peut être une string "180.00K" ou null)
    const old_T0_str = dateConfig['🌡️🏮📜'];
    let old_T0_val = null;
    if (old_T0_str && typeof old_T0_str === 'string') {
        // Parser "180.00K" -> 180.00
        const match = old_T0_str.match(/^([\d.]+)K?$/);
        if (match) {
            old_T0_val = parseFloat(match[1]);
        }
    } else if (old_T0_str && typeof old_T0_str === 'number') {
        old_T0_val = old_T0_str;
    }
    
    // Récupérer t0_config depuis '⏳🌡️'
    const t0_config = dateConfig['⏳🌡️'];
    
    // Récupérer les autres valeurs avec les nouveaux logos
    const meteoriteCount = dateConfig['🎓☄️📜'] ?? 0;
    const deltaMeteorite = dateConfig['🔺🌡️☄️📜'] ?? 0;
    const ticTime = dateConfig['🎓💫📜'] ?? 0;
    const deltaTicTime_per_tic = dateConfig['🔺🌡️💫📜'] ?? 0;
    
    if (!t0_config || t0_config <= 0) {
        console.error(`${window.getLogo('EDS')} [calculateT0@calculations_flux.js] ❌ t0_config invalide: ${t0_config}`);
        return null;
    }
    
    // (🎬) => T0=🏮 : T0=🌡️
    // 🏮 = window.old_T0 ou old_T0_val depuis dateConfig
    let baseTemp;
    const prev_T0 = old_T0_val || window.old_T0;
    if (prev_T0 > 0) {
        baseTemp = prev_T0; // 🎬 => T0=🏮
    } else {
        baseTemp = t0_config; // T0=🌡️
    }
    
    // T0 += ☄️*🌡️☄️ + 💫*🌡️💫
    let adjustment = 0;
    if (deltaMeteorite) adjustment += deltaMeteorite * meteoriteCount;
    if (deltaTicTime_per_tic) adjustment += deltaTicTime_per_tic * ticTime;
    
    const T0 = baseTemp + adjustment;
    
    if (T0 <= 0) {
        console.error(`${window.getLogo('EDS')} [calculateT0@calculations_flux.js] ❌ T0 invalide: ${T0}`);
        return null;
    }
    
    // Initialiser window.fluxState (sera complété dans computeRadiativeTransfer)
    window.fluxState = {
        '🚩': T0,
        '⚧': 'None',
        '🔺': 0,
        '♨🔽': 0,
        '♨🔼': 0,
        '♨🔺': 0,
        '📏': 0
    };
    
    // Log T0
    console.log(`🌡️ T0 [calculateT0@calculations_flux.js]`);
    console.log(`T0 initial: ${T0.toFixed(2)}K`);
    
    return T0;
}

// Fonction pour réinitialiser les variables lors d'un changement de date
function newDate() {
    Phase = "Search";
    signeDeltaFirst = 0;
}

// Fonction helper pour récupérer les valeurs de gaz depuis la config de l'époque ou options
function getGasValuesFromConfig(options = {}) {
    // Si options fourni, utiliser options
    if (options.CO2_percent !== undefined || options.CH4_percent !== undefined || options.H2O_percent !== undefined) {
        return {
            CO2_ppm: (options.CO2_percent || 0),
            CH4_ppm: (options.CH4_percent || 0),
            H2O_percent: (options.H2O_percent || 0),
            // Valeurs en kg si disponibles dans options
            co2_kg: options.co2_kg || 0,
            ch4_kg: options.ch4_kg || 0,
            h2o_kg: options.h2o_kg || 0
        };
    }
    
    // Sinon, récupérer depuis la config de l'époque
    let CO2_ppm = 0;
    let CH4_ppm = 0;
    let H2O_percent = 0;
    let co2_kg = 0;
    let ch4_kg = 0;
    let h2o_kg = 0;
    
    if (window?.currentEpochName && window.getGeologicalPeriodByName) {
        const epoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (epoch) {
            // Récupérer les valeurs en kg directement depuis la config
            co2_kg = epoch.co2_kg || 0;
            ch4_kg = epoch.ch4_kg || 0;
            h2o_kg = epoch.h2o_kg || 0;
            
            // Convertir co2_kg, ch4_kg, h2o_kg en ppm/%
            if (co2_kg > 0 && window.co2KgToFraction && epoch.total_atmosphere_mass_kg) {
                const molar_mass_air = window.calculateMolarMassAir ? window.calculateMolarMassAir(epoch) : 0.029;
                const co2_fraction = window.co2KgToFraction(co2_kg, epoch.total_atmosphere_mass_kg, molar_mass_air);
                CO2_ppm = co2_fraction * 1e6;
            }
            if (ch4_kg > 0 && window.ch4KgToFraction && epoch.total_atmosphere_mass_kg) {
                const molar_mass_air = window.calculateMolarMassAir ? window.calculateMolarMassAir(epoch) : 0.029;
                const ch4_fraction = window.ch4KgToFraction(ch4_kg, epoch.total_atmosphere_mass_kg, molar_mass_air);
                CH4_ppm = ch4_fraction * 1e6;
            }
            if (h2o_kg > 0 && epoch.total_atmosphere_mass_kg) {
                H2O_percent = (h2o_kg / epoch.total_atmosphere_mass_kg) * 100;
            }
        }
    }
    
    return { CO2_ppm, CH4_ppm, H2O_percent, co2_kg, ch4_kg, h2o_kg };
}

function computeRadiativeTransfer(options = {}) {
    // Sauvegarder T0 actuel dans window.old_T0 avant le calcul
    window.old_T0 = window.T0;
    
    // 0. Calculer les valeurs du soleil et du noyau
    if (window.getSoleil) window.getSoleil();
    if (window.getNoyau) window.getNoyau();
    
    const dateConfig = getEpochDateConfig();
    // 🎥:true 🏮:180.00K (-93.1°C) 🌡️:255.00K (-18.1°C), ☄️:0, 🌡️☄️:-3.5K, 💫:0, 🌡️💫:0K
    window.T0 = calculateT0(dateConfig);
    if (!window.T0) return Promise.reject(new Error('T0 invalide'));
    
    // 1. Récupérer les masses depuis window.masses (calculé par getMasses() dans getEpochDateConfig())
    const epoch = window.epoch; // window.epoch = timeline[2*k]
    const masses = window.masses || {
        '🏭🐳': epoch?.co2_kg || 0,
        '⛽🐳': epoch?.ch4_kg || 0,
        '💧🐳': epoch?.h2o_kg || 0,
        '🌫🐳': epoch?.o2_kg || 0,
        '🐳': epoch?.total_atmosphere_mass_kg || 0
    };
    
    // 2. Passer par calculations_atm.js pour avoir la densité et les %/ppm utilisés pour EDS
    // calculateCompositionFromLogoConfig() prend dateConfig (avec logos incluant les masses) et retourne les fractions molaires
    const total_atmosphere_mass_kg = masses['🐳'] || epoch?.total_atmosphere_mass_kg || 0;
    const dateConfigWithMasses = { ...dateConfig, ...masses };
    const atmComposition = window.calculateCompositionFromLogoConfig 
        ? window.calculateCompositionFromLogoConfig(dateConfigWithMasses, total_atmosphere_mass_kg, epoch)
        : dateConfigWithMasses; // Fallback si pas disponible
    
    // Extraire les valeurs depuis atmComposition (avec logos complets selon grammar.txt)
    // atm={'📏🌬🚀':1300, '📏🌬🛩':30, '🥒🌬🌫':0.0, '🥒🌬🏭':0.703, '🥒🌬💧':0.000701158, '🥒🌬⛽':0.00019}
    const CO2_percent = atmComposition['🥒🌬🏭'] || 0;
    const CH4_percent = atmComposition['🥒🌬⛽'] || 0;
    const H2O_percent = atmComposition['🥒🌬💧'] || 0;
    const O2_percent = atmComposition['🥒🌬🌫'] || 0;
    const altitude_km = atmComposition['📏🌬🚀'] || 0;
    const tropopause_km = atmComposition['📏🌬🛩'] || 0;
    
    // Log composition atmosphérique
    console.log(`🌍 [calculateCompositionFromLogoConfig@calculations_atm.js]`);
    console.log(`atm={'📏🌬🚀':${altitude_km.toFixed(0)}, '📏🌬🛩':${tropopause_km.toFixed(0)}, '🥒🌬🌫':${O2_percent.toFixed(3)}, '🥒🌬🏭':${CO2_percent.toFixed(3)}, '🥒🌬💧':${H2O_percent.toFixed(6)}, '🥒🌬⛽':${CH4_percent.toFixed(3)}}`);
    
    // 2. Passer par calculations_h2o.js pour les trucs de l'albedo
    // calculateH2OParameters attend un pourcentage, H2O_percent est déjà en %
    const h2o_from_meteorites = window.h2oTotalFromMeteorites || 0; // Déjà en %
    const h2o_total_percent = H2O_percent + h2o_from_meteorites;
    
    // Calculer les paramètres H2O (vapeur, glace, nuages) avec T0 initial
    // calculateH2OParameters va créer window.h2o automatiquement
    const h2o_params = window.calculateH2OParameters ? window.calculateH2OParameters(window.T0, h2o_total_percent, null) : {
        vapor_fraction: 0,
        ice_fraction: 0,
        cloud_coverage: 0,
        greenhouse_forcing: 0,
        cloud_albedo_contribution: 0,
        max_vapor_fraction: 0
    };
    
    // Calculer albedo initial avec T0 initial (pour l'affichage)
    // calculateSolarFluxAbsorbed appelle calculateAlbedo qui crée window.albedo
    if (window.calculateSolarFluxAbsorbed) {
        const geo_flux_init = epoch?.geothermal_flux || null;
        const enabledStates = window.getEnabledStates ? window.getEnabledStates() : {};
        const h2o_enabled = enabledStates[window.getLogo('H2O_EDS')] || false;
        window.calculateSolarFluxAbsorbed(window.T0, h2o_enabled, geo_flux_init);
    }

    // window.h2o est déjà créé dans calculateH2OParameters
    
    // ============================================================================
    // ITÉRATION DE CALCUL DE FLUX vs CORPS NOIR
    // ============================================================================
    // Principe : Équilibre radiatif entre flux entrant (solaire) et flux sortant (corps noir)
    //
    // 1. CORPS NOIR (rayonnement thermique) :
    //    - Loi de Stefan-Boltzmann : F = σT⁴
    //    - σ = 5.670374419e-8 W/(m²·K⁴) (constante de Stefan-Boltzmann)
    //    - Le flux sortant est le rayonnement émis par la surface terrestre
    //    - Pour une sphère : surface = 4πR², mais le flux est déjà en W/m²
    //
    // 2. AIRES (surfaces d'échange) :
    //    - Surface terrestre : A_surface = 4πR² ≈ 5.1×10¹⁴ m² (R = 6371 km)
    //    - Le flux est en W/m², donc on travaille directement avec des densités de flux
    //    - Pas besoin de multiplier par la surface pour l'équilibre énergétique
    //
    // 3. TEST D'ARRÊT :
    //    - Précision demandée : precision_K (en K, ex: 0.1K)
    //    - Dérivée de F = σT⁴ : dF/dT = 4σT³
    //    - Pour une variation ΔT = precision_K, la variation de flux est : ΔF = 4σT³ × precision_K
    //    - Tolérance réelle : tolerance = 4σT³ × precision_K (en W/m²)
    //    - Exemple : à T=255K avec precision_K=0.1K → tolerance = 4×5.67e-8×255³×0.1 ≈ 0.38 W/m²
    //    - Condition d'arrêt : |flux_sortant - flux_entrant| <= tolerance
    
    const STEFAN_BOLTZMANN = window.STEFAN_BOLTZMANN || 5.670374419e-8;
    const geo_flux = epoch?.geothermal_flux || null;
    const precision_K = window.convergencePrecision_K || 0.1; // Précision en K (défaut: 0.1K)
    
    // Initialiser les variables d'itération
    let T0_current = window.T0;
    let T0_min = null;
    let T0_max = null;
    let signeDeltaFirst = window.fluxState?.['🔺'] || 0;
    let Phase = window.fluxState?.['⚧'] || 'Search';
    const max_iterations = 2; // Limité à 2 pour test
    let iteration = 0;
    
    // S'assurer que window.fluxState est initialisé avec T0 initial
    if (!window.fluxState || window.fluxState['🚩'] !== T0_current) {
        window.fluxState = {
            '🚩': T0_current,
            '⚧': Phase,
            '🔺': signeDeltaFirst,
            '♨🔽': 0,
            '♨🔼': 0,
            '♨🔺': 0,
            '📏': 0
        };
    }
    
    console.log(`🔄 [computeRadiativeTransfer@calculations_flux.js] Début itération`);
    console.log(`   Précision demandée: ${precision_K}K`);
    console.log(`   T0 initial: ${T0_current.toFixed(2)}K`);
    
    // Boucle d'itération
    while (iteration < max_iterations) {
        iteration++;
        
        // 1. Recalculer H2O avec le nouveau T0_current (car T0 change à chaque itération)
        const H2O_percent_iter = H2O_percent; // Déjà en %
        const h2o_from_meteorites_iter = window.h2oTotalFromMeteorites || 0; // Déjà en %
        const h2o_total_percent_iter = H2O_percent_iter + h2o_from_meteorites_iter;
        
        // Recalculer les paramètres H2O avec T0_current (crée window.h2o)
        if (window.calculateH2OParameters) {
            window.calculateH2OParameters(T0_current, h2o_total_percent_iter, null);
        }
        
        // 2. Calculer flux entrant (solaire absorbé) - cela appelle calculateAlbedo qui crée window.albedo
        const enabledStates = window.getEnabledStates ? window.getEnabledStates() : {};
        const h2o_enabled = enabledStates[window.getLogo('H2O_EDS')] || false;
        let flux_entrant = window.calculateSolarFluxAbsorbed ? window.calculateSolarFluxAbsorbed(T0_current, h2o_enabled, geo_flux) : 238;
        if (geo_flux) flux_entrant += geo_flux;
        
        // 3. Calculer flux sortant (corps noir : σT⁴)
        // Le corps noir émet un flux selon la loi de Stefan-Boltzmann
        const flux_sortant = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
        
        // 4. Calculer delta_equilibre = flux_sortant - flux_entrant
        const delta_equilibre = flux_sortant - flux_entrant;
        
        // 5. Calculer la tolérance (test d'arrêt réel)
        // tolerance = 4σT³ × precision_K (dérivée de F = σT⁴)
        const tolerance = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
        
        // 6. Mettre à jour window.fluxState avec les valeurs de l'itération
        window.fluxState = {
            '🚩': T0_current,
            '⚧': Phase,
            '🔺': signeDeltaFirst,
            '♨🔽': flux_entrant,
            '♨🔼': flux_sortant,
            '♨🔺': delta_equilibre,
            '📏': tolerance
        };
        
        // 7. Log de l'itération avec h2o et albedo mis à jour
        console.log(`   Itération ${iteration}: T0=${T0_current.toFixed(2)}K, flux_entrant=${flux_entrant.toFixed(2)} W/m², flux_sortant=${flux_sortant.toFixed(2)} W/m², delta=${delta_equilibre.toFixed(2)} W/m², tolerance=${tolerance.toFixed(2)} W/m²`);
        if (window.h2o) {
            const h2oLogo = window.getLogo('H2O');
            console.log(`   h2o={'${h2oLogo}':${(window.h2o[h2oLogo] || 0).toFixed(0)}, '🥒💧🧊':${(window.h2o['🥒💧🧊'] || 0).toFixed(0)}, '🥒💧⛅':${(window.h2o['🥒💧⛅'] || 0).toFixed(0)}, '🥒💧🌊':${(window.h2o['🥒💧🌊'] || 0).toFixed(0)}, '🌴':${(window.h2o['🌴'] || 0).toFixed(0)}, '🌤':${(window.h2o[window.getLogo('CLOUD_ALBEDO')] || 0).toFixed(4)}, '🌧':${(window.h2o[window.getLogo('MAX_VAPOR')] || 0).toFixed(0)}}`);
        }
        if (window.albedo) {
                    const desertLogo = window.getLogo('DESERT');
                    console.log(`   albedo={'🪞':${(window.albedo['🪞'] || 0).toFixed(2)}, '🌊':${(window.albedo['🌊'] || 0).toFixed(2)}, '🌳':${(window.albedo['🌳'] || 0).toFixed(2)}, '${desertLogo}':${(window.albedo[desertLogo] || 0).toFixed(2)}, '🧊':${(window.albedo['🧊'] || 0).toFixed(2)}, '⛅':${(window.albedo['⛅'] || 0).toFixed(2)}}`);
        }
        
        // 8. Test d'arrêt : |delta_equilibre| <= tolerance
        if (Math.abs(delta_equilibre) <= tolerance) {
            console.log(`   ✅ Convergence atteinte après ${iteration} itérations`);
            console.log(`   T0 final: ${T0_current.toFixed(2)}K (${(T0_current - 273.15).toFixed(2)}°C)`);
            console.log(`   Équilibre: |${delta_equilibre.toFixed(2)}| W/m² <= ${tolerance.toFixed(2)} W/m²`);
            break;
        }
        
        // 7. Détecter changement de signe pour passer en Phase="Dicho"
        if (signeDeltaFirst !== 0) {
            const signeDelta = Math.sign(delta_equilibre);
            if (signeDeltaFirst !== signeDelta) {
                // Changement de signe détecté → passer en dichotomie
                Phase = 'Dicho';
                if (T0_min === null) T0_min = window.old_T0;
                if (T0_max === null) T0_max = T0_current;
                console.log(`   🔀 Changement de signe détecté → Phase=Dicho (T0_min=${T0_min.toFixed(2)}K, T0_max=${T0_max.toFixed(2)}K)`);
            }
        } else {
            // Première itération : initialiser signeDeltaFirst
            signeDeltaFirst = Math.sign(delta_equilibre);
        }
        
        // 8. Ajuster T0 selon la phase
        if (Phase === 'Search') {
            // Phase Search : ajustement direct proportionnel au delta
            // Sensibilité : dF/dT = 4σT³, donc dT = dF / (4σT³)
            const sensitivity = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3);
            const delta_T = -delta_equilibre / sensitivity; // Négatif car si flux_sortant > flux_entrant, T0 doit diminuer
            T0_current += delta_T;
            
            // Limiter T0 à des valeurs physiques raisonnables
            T0_current = Math.max(100, Math.min(1000, T0_current));
        } else if (Phase === 'Dicho') {
            // Phase Dicho : méthode de dichotomie
            if (delta_equilibre > 0) {
                // T0 trop élevé → réduire T0_max
                T0_max = T0_current;
            } else {
                // T0 trop bas → augmenter T0_min
                T0_min = T0_current;
            }
            T0_current = (T0_min + T0_max) / 2;
        }
        
        // 9. Mettre à jour window.T0 pour la prochaine itération
        window.T0 = T0_current;
    }
    
    if (iteration >= max_iterations) {
        console.warn(`   ⚠️ Maximum d'itérations atteint (${max_iterations})`);
    }
    
    // Mettre à jour window.T0 avec la valeur convergée
    window.T0 = T0_current;
    
    // Calculer le flux final
    const enabledStates_final = window.getEnabledStates ? window.getEnabledStates() : {};
    const h2o_enabled_final = enabledStates_final[window.getLogo('H2O_EDS')] || false;
    let flux_entrant_final = window.calculateSolarFluxAbsorbed ? window.calculateSolarFluxAbsorbed(T0_current, h2o_enabled_final, geo_flux) : 238;
    if (geo_flux) flux_entrant_final += geo_flux;
    const flux_sortant_final = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
    const delta_equilibre_final = flux_sortant_final - flux_entrant_final;
    const tolerance_final = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
    
    // Mettre à jour window.fluxState avec les valeurs finales
    window.fluxState = {
        '🚩': T0_current,
        '⚧': Phase,
        '🔺': signeDeltaFirst,
        '♨🔽': flux_entrant_final,
        '♨🔼': flux_sortant_final,
        '♨🔺': delta_equilibre_final,
        '📏': tolerance_final
    };
    
    // Créer window.flux (pour l'affichage)
    window.flux = { 
        '☀️': flux_entrant_final,
        '🌑': flux_sortant_final  // Flux sortant (corps noir)
    };
    
    // Log flux radiatif final
    console.log(`☀️ [calculateSolarFluxAbsorbed@calculations_albedo.js]`);
    console.log(`flux={'☀️':${flux_entrant_final.toFixed(2)}, '🌑':${flux_sortant_final.toFixed(2)}}`);
    
    // Retourner les résultats
    return Promise.resolve({
        T0: window.T0,
        h2o_result: window.h2o || {},
        albedo_result: window.flux || {},
        atm_result: {},
        atm_composition: window.atm || {},
        Phase: Phase,
        signeDeltaFirst: signeDeltaFirst,
        iterations: iteration
    });
}

// Exposer les fonctions globalement
// Note: getEpochDateConfig est déjà exposé dans compute.js
// window.epoch est utilisé directement (pas de fonction getEpochConfig)
if (typeof window !== 'undefined') {
    window.calculateT0 = calculateT0;
    window.computeRadiativeTransfer = computeRadiativeTransfer;
    window.newDate = newDate;
}

