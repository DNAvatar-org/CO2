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
// Utilise DATA directement (pas de paramètres)
function calculateT0(dateConfig) {
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    if (!DATA['📜']['🌡️⏳'] || DATA['📜']['🌡️⏳'] <= 0) {
        console.error(`📛 [calculateT0@calculations_flux.js] ❌ t0_config invalide: ${DATA['📜']['🌡️⏳']}`);
        return null;
    }
    
    // Logique selon la sémantique :
    // (!🔘🎬) => ⏳🌡️🚩 = 🌡️⏳  (si animation désactivée, T0 calculé = T0 config)
    // (🔘🎬) => ⏳🌡️🚩 = 🌡️🏮     (si animation activée, T0 calculé = old_T0)
    let adjustment = 0;
    if (DATA['📜']['🔺🌡️💫']) adjustment += DATA['📜']['🔺🌡️💫'] * DATA['📜']['📿💫'];
    
    DATA['⏳']['⏳🌡️🚩'] = (DATA['🔘']['🔘🎬'] ? DATA['⏳']['🌡️🏮'] : DATA['📜']['🌡️⏳']) + adjustment;        // T0 calculé (température)
    
    if (DATA['⏳']['⏳🌡️🚩'] <= 0) {
        console.error(`📛 [calculateT0@calculations_flux.js] ❌ T0 invalide: ${DATA['⏳']['⏳🌡️🚩']}`);
        return null;
    }
    
    // Initialiser DATA directement (sera complété dans computeRadiativeTransfer)
    DATA['⏳']['⏳⚧'] = 'None';       // Phase (None/Search/Dicho)
    DATA['⏳']['⏳☯'] = 0;           // direction (signe: -1, 0, 1 - pas d'unité physique)
    DATA['🧲']['🧲☀️🔽'] = 0;         // Flux solaire absorbé (W/m²)
    DATA['🧲']['🧲🌕🔽'] = 0;         // Flux géothermique (W/m²)
    DATA['🧲']['🧲🌑🔼'] = 0;            // Flux sortant (W/m²)
    DATA['🧲']['🔺🧲'] = 0;           // Delta flux (W/m²)
    DATA['⏳']['🧲🔬'] = 0;            // Tolérance (W/m²)
    
    // Log T0
    console.log(`🌡️ T0 [calculateT0@calculations_flux.js]`);
    console.log(`T0 initial: ${DATA['⏳']['⏳🌡️🚩'].toFixed(2)}K`);
    
    return DATA['⏳']['⏳🌡️🚩'];
}

// Fonction pour réinitialiser les variables lors d'un changement de date
function newDate() {
    Phase = "Search";
    signeDeltaFirst = 0;
}

// Fonction helper pour récupérer les valeurs de gaz depuis DATA
function getGasValuesFromConfig() {
    const DATA = window.DATA;
    
    let CO2_ppm = 0;
    let CH4_ppm = 0;
    let H2O_percent = 0;
            
            // Convertir co2_kg, ch4_kg, h2o_kg en ppm/%
    if (DATA['🐳']['🐳🏭'] > 0 && DATA['🐳']['🐳📿']) {
        const molar_mass_air = window.calculateMolarMassAir();
        const co2_fraction = window.co2KgToFraction(DATA['🐳']['🐳🏭'], DATA['🐳']['🐳📿'], molar_mass_air);
                CO2_ppm = co2_fraction * 1e6;
            }
    if (DATA['🐳']['🐳⛽'] > 0 && DATA['🐳']['🐳📿']) {
        const molar_mass_air = window.calculateMolarMassAir();
        const ch4_fraction = window.ch4KgToFraction(DATA['🐳']['🐳⛽'], DATA['🐳']['🐳📿'], molar_mass_air);
                CH4_ppm = ch4_fraction * 1e6;
            }
    if (DATA['🐳']['🐳💧'] > 0 && DATA['🐳']['🐳📿']) {
        H2O_percent = (DATA['🐳']['🐳💧'] / DATA['🐳']['🐳📿']) * 100;
    }
    
    return { CO2_ppm, CH4_ppm, H2O_percent, co2_kg: DATA['🐳']['🐳🏭'], ch4_kg: DATA['🐳']['🐳⛽'], h2o_kg: DATA['🐳']['🐳💧'] };
}

function computeRadiativeTransfer(options = {}) {
    // Réinitialiser l'historique des itérations
    window.fluxStateHistory = [];
    
    // Récupérer l'époque directement depuis timeline avec l'index (pas de copie)
    const EPOCH = window.timeline[window.currentEpochIndex];
    
    // 0. Calculer les valeurs du soleil et du noyau
    window.getSoleil();
    window.getNoyau();
    
    getEpochDateConfig();
    // 🎥:true 🏮:180.00K (-93.1°C) 🌡️:255.00K (-18.1°C), ☄️:0, 🌡️☄️:-3.5K, 💫:0, 🌡️💫:0K
    if (!calculateT0()) return Promise.reject(new Error('T0 invalide'));
    
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const CONST = window.CONST;
    
    // 2. Passer par calculations_atm.js pour avoir la densité et les %/ppm utilisés pour EDS
    // calculateCompositionFromLogoConfig() utilise DATA directement (pas de paramètres)
    window.calculateCompositionFromLogoConfig();
    
    // Log composition atmosphérique
    console.log(`🌍 [calculateCompositionFromLogoConfig@calculations_atm.js]`);
    // Utiliser les clés emoji directement
    const atm_altitude_key = '📏🌬🧿';
    const atm_tropopause_key = '📏🌬🛩';
    const atm_o2_key = '🍰🌬🌫';
    const atm_co2_key = '🍰🌬🏭';
    const atm_h2o_key = '🍰🌬💧';
    const atm_ch4_key = '🍰🌬⛽';
    console.log(`atm={'${atm_altitude_key}':${DATA['🌬'][atm_altitude_key].toFixed(0)}, '${atm_tropopause_key}':${DATA['🌬'][atm_tropopause_key].toFixed(0)}, '${atm_o2_key}':${DATA['🌬'][atm_o2_key].toFixed(3)}, '${atm_co2_key}':${DATA['🌬'][atm_co2_key].toFixed(3)}, '${atm_h2o_key}':${DATA['🌬'][atm_h2o_key].toFixed(6)}, '${atm_ch4_key}':${DATA['🌬'][atm_ch4_key].toFixed(3)}}`);
    
    // 2. Passer par calculations_h2o.js pour les trucs de l'albedo
    // calculateH2OParameters attend un pourcentage, DATA['🌬']['🍰🌬💧'] est déjà en %
    const h2o_total_percent = DATA['🌬'][atm_h2o_key] + window.h2oTotalFromMeteorites;
    
    // Calculer les paramètres H2O (vapeur, glace, nuages) avec T0 initial
    // calculateH2OParameters va créer window.h2o automatiquement
    const h2o_params = window.calculateH2OParameters(DATA['⏳']['⏳🌡️🚩'], h2o_total_percent, null);
    
    // Note: h2o et albedo seront calculés dans la boucle d'itération avec T0_current
    
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
    
    // Initialiser les variables d'itération
    let T0_current = DATA['⏳']['⏳🌡️🚩'];
    let T0_min = null;
    let T0_max = null;
    let signeDeltaFirst = 0;  // Sera initialisé à la première itération
    let Phase = 'Search';  // Commencer en phase Search pour ajuster T0
    const max_iterations = 3; // 3 itérations pour test
    let iteration = 0;
    
    // Récupérer la précision de convergence depuis window.convergencePrecision_K ou depuis l'époque
    const precision_K = window.convergencePrecision_K !== undefined ? window.convergencePrecision_K : EPOCH['🧲🔬'];
    
    console.log(`🔄 [computeRadiativeTransfer@calculations_flux.js] Début itération`);
    console.log(`   Précision demandée: ${precision_K}K`);
    console.log(`   T0 initial: ${T0_current.toFixed(2)}K`);
    
    // Boucle d'itération
    while (iteration < max_iterations) {
        iteration++;
        
        // ========================================================================
        // CYCLE : Informations sur l'itération
        // ========================================================================
        // Selon grammar.txt : 🎓⏳ (cardinal + compute), 🌡️⏳ (température + compute), 🌡️🔬📜 (température + tolerance + config)
        window.step0_cycle = {
            [window.getLogoKey('CARDINAL', 'COMPUTE')]: iteration,  // Numéro du cycle (cardinal + compute origin)
            [window.getLogoKey('TEMP', 'COMPUTE')]: T0_current,  // Température de départ (température + compute origin)
            [window.getLogoKey('COMPUTE', 'PHASE')]: Phase,  // Phase actuelle (compute + phase)
            [window.getLogoKey('TEMP', 'TOLERANCE', 'CONFIG')]: precision_K  // Précision demandée (température + tolerance + config origin)
        };
        
        // ========================================================================
        // ÉTAPE 1 : Recalculer H2O avec le nouveau T0_current
        // ========================================================================
        // Recalculer les paramètres H2O avec T0_current (crée window.h2o)
        window.calculateH2OParameters(T0_current, DATA['🌬']['🍰🌬💧'] + window.h2oTotalFromMeteorites, null);
        
        // Note: step1_h2o supprimé car redondant :
        // - '🥒🌬💧' est déjà dans atm['🥒🌬💧'] (source unique)
        // - '🌡️⏳' est déjà dans step0_cycle['🌡️⏳'] (source unique)
        
        // ========================================================================
        // ÉTAPE 2 : Calculer flux solaire absorbé (albedo + réflexion)
        // ========================================================================
        // IMPORTANT : Utiliser window.calculateSolarFluxAbsorbed() comme fonction commune
        // pour garantir la cohérence avec le calcul final (même fonction, même logique)
        const h2o_enabled = window.getEnabledStates()[window.getLogo('H2O_EDS')];
        
        // Récupérer le flux géothermique (depuis DATA['🌕']['🧲🌕'])
        const geothermal_flux = DATA['🌕']['🧲🌕'];
        
        // Calculer albedo (crée window.albedo) - nécessaire pour step2_solar
        window.calculateAlbedo(T0_current, h2o_enabled, geothermal_flux);
        
        // Utiliser la fonction commune calculateSolarFluxAbsorbed() (source unique)
        const flux_solaire_absorbe = window.calculateSolarFluxAbsorbed(T0_current, h2o_enabled, geothermal_flux);
        
        // Récupérer les valeurs pour step2_solar depuis DATA (sources uniques)
        const solar_flux_reflected_wm = DATA['☀️']['🧲☀️🎱'] * DATA['🪞']['🍰🪞📿'];
        
        // Objet étape 2 : Flux solaire
        // IMPORTANT : Utilise window.calculateSolarFluxAbsorbed() pour garantir la cohérence
        // Note: Utilise DATA.SOLEIL et DATA.ALBEDO comme sources uniques
        window.step2_solar = {
            '🧲☀️': DATA['☀️']['🧲☀️'],  // Constante solaire à 1 UA (W/m²)
            '🧲☀️🎱': DATA['☀️']['🧲☀️🎱'],  // Flux moyen sphérique (W/m²)
            '🍰🪞📿': DATA['🪞']['🍰🪞📿'],  // Albedo total
            '🧲🪞🔼': solar_flux_reflected_wm,  // Flux réfléchi (W/m²)
            '🧲☀️🔽': flux_solaire_absorbe  // Flux absorbé (W/m²)
        };
        
        // ========================================================================
        // ÉTAPE 3 : Flux géothermique
        // ========================================================================
        // Objet étape 3 : Géothermique
        window.step3_geothermal = {
            '🧲🌕🔽': geothermal_flux  // Flux géothermique (W/m²)
        };
        
        // ========================================================================
        // ÉTAPE 4 : Flux entrant total
        // ========================================================================
        // Flux entrant = somme exacte de solaire + géothermique
        const flux_entrant = flux_solaire_absorbe + geothermal_flux;
        
        // Log de débogage pour vérifier le calcul
        console.log(`   🔍 [DEBUG step4] flux_solaire_absorbe=${flux_solaire_absorbe.toFixed(2)} W/m², flux_geothermique=${geothermal_flux > 1000 ? geothermal_flux.toExponential(2) : geothermal_flux.toFixed(2)} W/m², flux_entrant=${flux_entrant > 1000 ? flux_entrant.toExponential(2) : flux_entrant.toFixed(2)} W/m²`);
        
        // Objet étape 4 : Flux entrant
        window.step4_fluxIn = {
            '🧲☀️🔽': flux_solaire_absorbe,  // Flux solaire absorbé (W/m²)
            '🧲🌕🔽': geothermal_flux,     // Flux géothermique (W/m²)
            [window.getLogoKey('ENERGY_FLUX', 'FLUX_IN')]: flux_entrant  // Flux entrant total = solaire + géothermique (W/m²)
        };
        
        // ========================================================================
        // ÉTAPE 5 : Calculer flux sortant (corps noir : σT⁴ ou spectral si disponible)
        // ========================================================================
        // IMPORTANT : Le flux sortant dans step5_fluxOut est le flux ÉMIS PAR LA SURFACE (avant EDS)
        // C'est le flux corps noir : σT⁴ (ou earth_flux_total du calcul spectral)
        let flux_sortant_surface = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
        let flux_sortant_effectif = flux_sortant_surface; // Par défaut, égal au flux surface (pas d'EDS)
        let spectral_info = null;
        
        // Utiliser le calcul spectral
        const enabledStates = window.getEnabledStates();
        const ch4_enabled = enabledStates[window.getLogo('CH4_EDS')];
        // Récupérer les pourcentages depuis DATA['🌬']
        const CO2_percent = DATA['🌬']['🍰🌬🏭'];
        const CH4_percent = DATA['🌬']['🍰🌬⛽'];
        const H2O_percent = DATA['🌬']['🍰🌬💧'];
        const co2_fraction = CO2_percent / 100;
        const ch4_fraction = CH4_percent / 100;
        
        // Récupérer total_mass depuis DATA et z_max depuis DATA
        const total_mass = DATA['🐳']['🐳📿'];
        const z_max_km = DATA['🌬']['📏🌬🧿'];
        const z_max = z_max_km * 1000; // Convertir km en mètres
        
        const spectral_result = window.calculateFluxForT0(co2_fraction, T0_current, {
            h2o_enabled: h2o_enabled,
            ch4_enabled: ch4_enabled,
            ch4_fraction: ch4_fraction,
            z_max: z_max,  // Passer z_max en mètres
            total_atmosphere_mass_kg: total_mass  // Passer total_mass pour calculateAtmosphereProperties
        });
        
        // Flux émis par la surface (AVANT EDS) = earth_flux_total
        const earth_flux_total = spectral_result.earth_flux.reduce((sum, val) => sum + val, 0);
        flux_sortant_surface = earth_flux_total;
        
        // Flux sortant effectif (APRÈS EDS) = total_flux au sommet de l'atmosphère
        flux_sortant_effectif = spectral_result.total_flux;
        
        // Calculer les contributions des gaz (réémis vers la terre = EDS)
        const num_couches = spectral_result.z_range.length;
        const num_plages_spectre = spectral_result.lambda_range.length;
        const total_cases = num_couches * num_plages_spectre;
        
        // Calculer les contributions par gaz depuis optical_thickness et emitted_flux
        // Note: Le flux émis est proportionnel à l'épaisseur optique de chaque gaz
        let contribution_CO2 = 0;
        let contribution_H2O = 0;
        let contribution_CH4 = 0;
        
        // Pour chaque couche et chaque longueur d'onde, calculer la contribution de chaque gaz
        for (let i = 0; i < spectral_result.emitted_flux.length; i++) {
            for (let j = 0; j < spectral_result.emitted_flux[i].length; j++) {
                const em_flux = spectral_result.emitted_flux[i][j];
                const tau_total = spectral_result.optical_thickness[i][j];
                
                if (tau_total > 0 && em_flux > 0) {
                    // Calculer les épaisseurs optiques individuelles (approximation)
                    // En réalité, il faudrait les stocker séparément dans calculateFluxForT0
                    const tau_CO2 = co2_fraction > 0 ? tau_total * (co2_fraction / (co2_fraction + ch4_fraction + (h2o_enabled ? H2O_percent/100 : 0) + 0.001)) : 0;
                    const tau_H2O = h2o_enabled && H2O_percent > 0 ? tau_total * ((H2O_percent/100) / (co2_fraction + ch4_fraction + H2O_percent/100 + 0.001)) : 0;
                    const tau_CH4 = ch4_enabled && ch4_fraction > 0 ? tau_total * (ch4_fraction / (co2_fraction + ch4_fraction + (h2o_enabled ? H2O_percent/100 : 0) + 0.001)) : 0;
                    
                    // Répartition du flux émis selon les épaisseurs optiques
                    if (tau_CO2 > 0) contribution_CO2 += em_flux * (tau_CO2 / tau_total);
                    if (tau_H2O > 0) contribution_H2O += em_flux * (tau_H2O / tau_total);
                    if (tau_CH4 > 0) contribution_CH4 += em_flux * (tau_CH4 / tau_total);
                }
            }
        }
        
        // Selon grammar.txt : 🎓⏳🌬 (cardinal + compute + atmosphère), 🎓⏳🌈 (cardinal + compute + spectre), 🎓⏳🌬🌈 (cardinal + compute + atmosphère + spectre)
        // 🎓⏳🌬 = nombre de couches atmosphériques calculées (ex: 1060 couches)
        // 🎓⏳🌈 = nombre de plages spectrales (longueurs d'onde) (ex: 1000 plages)
        // 🎓⏳🌬🌈 = total de cases calculées = couches × plages spectrales (ex: 1 060 000 cases)
        spectral_info = {
            [window.getLogoKey('CARDINAL', 'COMPUTE', 'ATMOSPHERE')]: num_couches,  // Nombre de couches atmosphériques (cardinal + compute + atmosphère)
            [window.getLogoKey('CARDINAL', 'COMPUTE', 'SPECTRAL')]: num_plages_spectre,  // Nombre de plages spectrales (cardinal + compute + spectre)
            [window.getLogoKey('CARDINAL', 'COMPUTE', 'ATMOSPHERE', 'SPECTRAL')]: total_cases,  // Total cases calculées = couches × plages (cardinal + compute + atmosphère + spectre)
            [window.getLogoKey('ENERGY_FLUX', 'CO2', 'EDS')]: contribution_CO2,  // Contribution CO2 réémis vers la Terre (EDS) - flux + CO2 + EDS (W/m²)
            [window.getLogoKey('ENERGY_FLUX', 'H2O', 'EDS')]: contribution_H2O,  // Contribution H2O réémis vers la Terre (EDS) - flux + H2O + EDS (W/m²)
            [window.getLogoKey('ENERGY_FLUX', 'CH4', 'EDS')]: contribution_CH4  // Contribution CH4 réémis vers la Terre (EDS) - flux + CH4 + EDS (W/m²)
        };
        
        // Objet étape 5 : Flux sortant
        // Selon grammar.txt : 🌡️⏳ (température + compute), 🧲🔼 (flux sortant)
        // IMPORTANT : 🧲🔼 = flux émis par la surface (AVANT EDS), pas le flux effectif après EDS
        window.step5_fluxOut = {
            [window.getLogoKey('TEMP', 'COMPUTE')]: T0_current,  // Température (K) - température + compute origin
            [window.getLogoKey('ENERGY_FLUX', 'FLUX_CN', 'FLUX_OUT')]: flux_sortant_surface  // Flux sortant surface (W/m²)
        };
        
        // Ajouter les infos spectrales si disponibles
        if (spectral_info) {
            window.step5_spectral = spectral_info;
        }
        
        // ========================================================================
        // ÉTAPE 6 : Delta équilibre
        // ========================================================================
        // IMPORTANT : Pour l'équilibre, on compare flux_entrant avec flux_sortant_effectif (après EDS)
        // Le flux_sortant_surface est affiché pour information (corps noir pur)
        const delta_equilibre = flux_sortant_effectif - flux_entrant;
        
        // Objet étape 6 : Delta
        // IMPORTANT : 🧲🔼 dans step6_delta = flux_sortant_effectif (après EDS) pour l'équilibre
        window.step6_delta = {
            [window.getLogoKey('ENERGY_FLUX', 'FLUX_CN', 'FLUX_OUT')]: flux_sortant_effectif,  // Flux sortant effectif (après EDS)
            [window.getLogoKey('ENERGY_FLUX', 'FLUX_IN')]: flux_entrant,  // Flux entrant
            [window.getLogoKey('DELTA', 'ENERGY_FLUX')]: delta_equilibre  // Delta (sortant effectif - entrant)
        };
        
        // ========================================================================
        // ÉTAPE 7 : Tolérance (test d'arrêt)
        // ========================================================================
        // tolerance = 4σT³ × precision_K (dérivée de F = σT⁴)
        const tolerance = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
        DATA['⏳']['🧲🔬'] = tolerance;
        
        // Objet étape 7 : Tolérance
        // Selon grammar.txt : 🌡️⏳ (température + compute), 🌡️🔬📜 (précision config), 🧲🔬 (tolérance)
        window.step7_tolerance = {
            [window.getLogoKey('TEMP', 'COMPUTE')]: T0_current,  // Température (K) - température + compute origin
            [window.getLogoKey('TEMP', 'TOLERANCE', 'CONFIG')]: precision_K,  // Précision demandée (K) - température + tolerance + config origin
            '🧲🔬': tolerance  // Tolérance calculée (W/m²) - flux + tolerance
        };
        
        // ========================================================================
        // CONCLUSION : Résumé de l'itération
        // ========================================================================
        // Selon grammar.txt : 🔘 (boolean), 🌡️⏳ (température + compute), 🔺🧲 (delta flux), 🧲🔬 (tolérance), ⏳⚧ (phase), ⏳🍴 (signeDeltaFirst)
        window.step8_conclusion = {
            [window.getLogo('BOOLEAN') + '✅']: Math.abs(DATA['🧲']['🔺🧲']) <= DATA['⏳']['🧲🔬'],  // Convergence atteinte ? (boolean) - ✅ n'est pas dans LOGOS, ajouté manuellement
            [window.getLogoKey('TEMP', 'COMPUTE')]: T0_current,  // Température finale du cycle (température + compute origin)
            [window.getLogoKey('DELTA', 'ENERGY_FLUX')]: DATA['🧲']['🔺🧲'],  // Delta équilibre (delta + flux)
            '🧲🔬': DATA['⏳']['🧲🔬'],  // Tolérance (flux + tolerance)
            '⏳⚧': Phase,  // Phase finale (compute + phase)
            '⏳☯': signeDeltaFirst  // Direction (compute + direction)
        };
        
        // 8. Mettre à jour DATA avec les valeurs de l'itération (séparer solaire et géothermique)
        // IMPORTANT : 🧲🔼 dans DATA = flux_sortant_surface (AVANT EDS) pour cohérence avec step5_fluxOut
        DATA['⏳']['⏳🌡️🚩'] = T0_current;
        DATA['⏳']['⏳⚧'] = Phase;
        DATA['⏳']['⏳☯'] = signeDeltaFirst;
        DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe;  // Flux solaire absorbé (séparé)
        DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];     // Flux géothermique (séparé)
        DATA['🧲']['🧲🌑🔼'] = flux_sortant_surface;     // Flux sortant surface (AVANT EDS)
        DATA['🧲']['🔺🧲'] = flux_sortant_effectif - flux_entrant;        // Delta flux (sortant effectif - entrant) - utilise flux_sortant_effectif
        
        // Ajouter une copie de DATA et des étapes à l'historique
        window.fluxStateHistory.push({
            fluxState: JSON.parse(JSON.stringify({
                '⏳🌡️🚩': DATA['⏳']['⏳🌡️🚩'],
                '⏳⚧': DATA['⏳']['⏳⚧'],
                '⏳☯': DATA['⏳']['⏳☯'],
                '🧲☀️🔽': DATA['🧲']['🧲☀️🔽'],
                '🧲🌕🔽': DATA['🧲']['🧲🌕🔽'],
                '🧲🌑🔼': DATA['🧲']['🧲🌑🔼'],
                '🔺🧲': DATA['🧲']['🔺🧲'],
                '🧲🔬': DATA['⏳']['🧲🔬']
            })),
            step0_cycle: JSON.parse(JSON.stringify(window.step0_cycle)),
            // step1_h2o supprimé : redondant (🍰🌬💧 dans atm, 🌡️⏳ dans step0_cycle)
            step2_solar: JSON.parse(JSON.stringify(window.step2_solar)),
            step3_geothermal: JSON.parse(JSON.stringify(window.step3_geothermal)),
            step4_fluxIn: JSON.parse(JSON.stringify(window.step4_fluxIn)),
            step5_fluxOut: JSON.parse(JSON.stringify(window.step5_fluxOut)),
            step5_spectral: JSON.parse(JSON.stringify(window.step5_spectral)),
            step6_delta: JSON.parse(JSON.stringify(window.step6_delta)),
            step7_tolerance: JSON.parse(JSON.stringify(window.step7_tolerance)),
            step8_conclusion: JSON.parse(JSON.stringify(window.step8_conclusion))
        });
        
        // Log des étapes intermédiaires
        // Note: Étape 1 - H2O supprimée (redondante : 🥒🌬💧 dans atm, 🌡️⏳ dans step0_cycle)
        console.log(`   📊 Étape 2 - Flux solaire: step2_solar=${JSON.stringify(window.step2_solar)}`);
        console.log(`   📊 Étape 3 - Géothermique: step3_geothermal=${JSON.stringify(window.step3_geothermal)}`);
        console.log(`   📊 Étape 4 - Flux entrant: step4_fluxIn=${JSON.stringify(window.step4_fluxIn)}`);
        console.log(`   📊 Étape 5 - Flux sortant: step5_fluxOut=${JSON.stringify(window.step5_fluxOut)}`);
        console.log(`   📊 Étape 6 - Delta: step6_delta=${JSON.stringify(window.step6_delta)}`);
        console.log(`   📊 Étape 7 - Tolérance: step7_tolerance=${JSON.stringify(window.step7_tolerance)}`);
        
        // Log de l'itération avec fluxState complet
        // IMPORTANT : flux_sortant_surface = flux émis par la surface (AVANT EDS), flux_sortant_effectif = flux après EDS
        console.log(`   Itération ${iteration}: T0=${T0_current.toFixed(2)}K, flux_entrant=${flux_entrant.toFixed(2)} W/m², flux_sortant_surface=${flux_sortant_surface > 1000 ? flux_sortant_surface.toExponential(2) : flux_sortant_surface.toFixed(2)} W/m², flux_sortant_effectif=${flux_sortant_effectif > 1000 ? flux_sortant_effectif.toExponential(2) : flux_sortant_effectif.toFixed(2)} W/m², delta=${delta_equilibre > 1000 ? delta_equilibre.toExponential(2) : delta_equilibre.toFixed(2)} W/m², tolerance=${tolerance.toFixed(2)} W/m²`);
        console.log(`   fluxState={'⏳🌡️🚩':${T0_current.toFixed(2)}, '⏳⚧':'${Phase}', '⏳☯':${signeDeltaFirst.toFixed(2)}, '🧲☀️🔽':${flux_solaire_absorbe.toFixed(2)}, '🧲🌕🔽':${geothermal_flux > 1000 ? geothermal_flux.toExponential(2) : geothermal_flux.toFixed(2)}, '🧲🌑🔼':${flux_sortant_surface > 1000 ? flux_sortant_surface.toExponential(2) : flux_sortant_surface.toFixed(2)}, '🔺🧲':${delta_equilibre > 1000 ? delta_equilibre.toExponential(2) : delta_equilibre.toFixed(2)}, '🧲🔬':${tolerance.toFixed(2)}}`);
        // Utiliser DATA directement pour les logs
        if (window.h2o) {
            console.log(`   h2o=${JSON.stringify(window.h2o)}`);
        }
        console.log(`   albedo=${JSON.stringify(DATA['🪞'])}`);
        
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
                // T0_min sera initialisé à la première itération avec changement de signe
                if (T0_min === null) T0_min = T0_current;
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
            const T0_avant = T0_current;
            T0_current += delta_T;
            
            // Limiter T0 à des valeurs physiques raisonnables (Hadéen peut atteindre 2500K+)
            const T0_limite = Math.max(100, Math.min(3000, T0_current));
            if (T0_limite !== T0_current) {
                console.log(`   ⚠️ T0 limité: ${T0_current.toFixed(2)}K → ${T0_limite.toFixed(2)}K`);
            }
            T0_current = T0_limite;
            
            // Log de l'ajustement
            console.log(`   🔧 Ajustement T0 (Phase=Search): T0=${T0_avant.toFixed(2)}K, sensitivity=${sensitivity.toFixed(2)} W/(m²·K), delta_T=${delta_T.toFixed(2)}K → T0_new=${T0_current.toFixed(2)}K`);
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
        
        // 9. T0 est dans DATA['⏳']['⏳🌡️🚩'], pas besoin de window.T0
        
        // 10. IMPORTANT : Recalculer h2o et albedo à la fin du cycle (après ajustement de T0)
        // pour le cycle suivant - garantit la cohérence avec le nouveau T0
        if (iteration < max_iterations) { // Pas besoin de recalculer si c'est la dernière itération
            const enabledStates_next = window.getEnabledStates();
            const h2o_enabled_next = enabledStates_next[window.getLogo('H2O_EDS')];
            
            // Recalculer h2o avec le nouveau T0_current pour le prochain cycle
            // Utiliser DATA['🌬']['🍰🌬💧'] pour le pourcentage H2O (déjà en %)
            const h2o_total_percent_next = DATA['🌬']['🍰🌬💧'] + window.h2oTotalFromMeteorites;
            window.calculateH2OParameters(T0_current, h2o_total_percent_next, null);
            
            // Recalculer albedo avec le nouveau T0_current pour le prochain cycle
            window.calculateAlbedo(T0_current, h2o_enabled_next, DATA['🌕']['🧲🌕']);
            
            console.log(`   🔄 Recalcul h2o et albedo pour cycle suivant (T0=${T0_current.toFixed(2)}K)`);
        }
    }
    
    if (iteration >= max_iterations) {
        console.warn(`   ⚠️ Maximum d'itérations atteint (${max_iterations})`);
    }
    
    // T0 est dans DATA['⏳']['⏳🌡️🚩'], pas besoin de window.T0
    
    // Calculer le flux final (séparer solaire et géothermique)
    // IMPORTANT : flux_sortant_final = flux émis par la surface (AVANT EDS) = σT⁴
    // Pour l'équilibre, on utilise le flux_sortant_effectif (après EDS) depuis la dernière itération
    const enabledStates_final = window.getEnabledStates();
    const h2o_enabled_final = enabledStates_final[window.getLogo('H2O_EDS')];
    const flux_solaire_absorbe_final = window.calculateSolarFluxAbsorbed(T0_current, h2o_enabled_final, DATA['🌕']['🧲🌕']);
    const flux_geothermique_final = DATA['🌕']['🧲🌕'];
    const flux_entrant_final = flux_solaire_absorbe_final + flux_geothermique_final;
    const flux_sortant_surface_final = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);  // Flux émis par la surface (AVANT EDS)
    // Note: ALL, CONVERGENCE et FLUX sont déjà déclarés au début de computeRadiativeTransfer
    
    // Utiliser le delta_equilibre de la dernière itération (qui utilise flux_sortant_effectif)
    const delta_equilibre_final = DATA['🧲']['🔺🧲'];
    const tolerance_final = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
    
    // Mettre à jour DATA avec les valeurs finales (séparer solaire et géothermique)
    // IMPORTANT : 🧲🔼 dans DATA = flux_sortant_surface (AVANT EDS) pour cohérence avec step5_fluxOut
    DATA['⏳']['⏳🌡️🚩'] = T0_current;
    DATA['⏳']['⏳⚧'] = Phase;
    DATA['⏳']['⏳☯'] = signeDeltaFirst;
    DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_final;  // Flux solaire absorbé (séparé)
    DATA['🧲']['🧲🌕🔽'] = flux_geothermique_final;     // Flux géothermique (séparé)
    DATA['🧲']['🧲🌑🔼'] = flux_sortant_surface_final;    // Flux sortant surface (AVANT EDS)
    DATA['🧲']['🔺🧲'] = delta_equilibre_final;        // Delta flux (utilise flux_sortant_effectif pour équilibre)
    DATA['⏳']['🧲🔬'] = tolerance_final;                // Tolérance (précision pour test d'arrêt) - 🔬 selon grammar.txt
    
    // Créer window.flux (pour l'affichage simplifié)
    // IMPORTANT : 🧲🔼 = flux émis par la surface (AVANT EDS), pas le flux effectif après EDS
    window.flux = { 
        '🧲☀️🔽': flux_solaire_absorbe_final,  // Flux solaire absorbé
        '🧲🌕🔽': flux_geothermique_final,     // Flux géothermique
        '🧲🌑🔼': flux_sortant_surface_final     // Flux sortant surface (AVANT EDS)
    };
    
    // Log flux radiatif final
    console.log(`☀️ [computeRadiativeTransfer@calculations_flux.js]`);
    console.log(`flux=${JSON.stringify(window.flux)}`);
    
    // Retourner les résultats
    return Promise.resolve({
        T0: DATA['⏳']['⏳🌡️🚩'],
        h2o_result: window.h2o,
        albedo_result: window.flux,
        atm_result: {},
        atm_composition: DATA, // Utiliser DATA directement (source unique)
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

