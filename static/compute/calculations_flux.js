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
// old_T0, T0, Phase, signeDeltaFirst sont dans DATA['⏳'], flux_entrant est calculé localement

// Fonctions getAnimState() et getEpochDateConfig() : définies dans compute.js (chargé avant ce fichier)
// window.epoch est utilisé directement (pas de fonction getEpochConfig)
// On utilise les fonctions globales définies dans compute.js

//Calcule T0 initial :: (🎬) => T0=🏮 : T0=🌡️, puis T0 += ☄️*🌡️☄️ + 💫*🌡️💫
function calculateT0() {
    const DATA = window.DATA;
    
    // Calculer T0 initial dans DATA['⏳']['⏳🌡️🚩'] temporairement
    const adjustment = DATA['📜']['🔺🌡️💫'] * DATA['📜']['📿💫'];
    
    const epochId = DATA['📅']['📅'];
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    const EPOCH = window.TIMELINE[epochIndex];
    const T0_base = DATA['🔘']['🔘🎬'] ? DATA['⏳']['🌡️'] : EPOCH['🌡️⏳'];
    DATA['⏳']['⏳🌡️🚩'] = T0_base + adjustment;
    
    if (DATA['⏳']['⏳🌡️🚩'] <= 0) {
        console.error(`📛 [calculateT0@calculations_flux.js] ❌ T0 invalide: ${DATA['⏳']['⏳🌡️🚩']}`);
        return false;
    }
    
    // Initialiser DATA directement (sera complété dans computeRadiativeTransfer)
    DATA['⏳']['⏳⚧'] = 'init'; // Phase d'initialisation
    DATA['⏳']['⏳☯'] = 0;
    DATA['🧲']['🧲☀️🔽'] = 0;
    DATA['🧲']['🧲🌕🔽'] = 0;
    DATA['🧲']['🧲🌑🔼'] = 0;
    DATA['🧲']['🔺🧲'] = 0;
    DATA['⏳']['🧲🔬'] = EPOCH['🧲🔬'];
    
    // À la fin : DATA['⏳']['🌡️'] = DATA['⏳']['⏳🌡️🚩']
    DATA['⏳']['🌡️'] = DATA['⏳']['⏳🌡️🚩'];
    
    console.log(`🌡️ T0 [calculateT0@calculations_flux.js]`);
    console.log(`T0 initial: ${DATA['⏳']['🌡️'].toFixed(2)}K`);
    
    return true;
}

//Réinitialise les variables lors d'un changement de date
function newDate() {
    DATA['⏳']['⏳⚧'] = "Search";
    DATA['⏳']['⏳☯'] = 0;
}

// Fonction helper pour récupérer les valeurs de gaz depuis DATA
// Fonction supprimée : getGasValuesFromConfig() n'était pas utilisée
// Les valeurs sont directement dans DATA['🌬'] après calculateAtmosphereComposition()

async function computeRadiativeTransfer() {
    const DATA = window.DATA;
    // Récupérer l'époque directement depuis TIMELINE avec l'index depuis DATA
    const epochId = DATA['📅']['📅'];
    const epochIndex = window.TIMELINE.findIndex(item => item['📅'] === epochId);
    const EPOCH = window.TIMELINE[epochIndex];
    
    // 0. Calculer les valeurs du soleil et du noyau
    window.getSoleil();
    if (window.displayResults) window.displayResults(null); // Mettre à jour la config après getSoleil
    await new Promise(resolve => setTimeout(resolve, 10)); // Permettre au DOM de se mettre à jour
    
    window.getNoyau();
    if (window.displayResults) window.displayResults(null); // Mettre à jour la config après getNoyau
    await new Promise(resolve => setTimeout(resolve, 10));
    
    getEpochDateConfig();
    if (window.displayResults) window.displayResults(null); // Mettre à jour la config après getEpochDateConfig
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // 🎥:true 🏮:180.00K (-93.1°C) 🌡️:255.00K (-18.1°C), ☄️:0, 🌡️☄️:-3.5K, 💫:0, 🌡️💫:0K
    if (!calculateT0()) return Promise.reject(new Error('T0 invalide'));
    
    const CONST = window.CONST;
    window.calculateAtmosphereComposition();
    if (window.displayResults) window.displayResults(null); // Mettre à jour la config après calculateAtmosphereComposition
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Log composition atmosphérique
    console.log(`🌍 [calculateAtmosphereComposition@calculations_atm.js]`);
    console.log(`atm=${JSON.stringify(DATA['🌬'], null, 2)}`);
    
    // 3. Calculer les paramètres H2O (vapeur, glace, nuages) avec T0 initial
    // Note: h2oTotalFromMeteorites dépend de la température et peut rester de la glace,
    // donc on utilise uniquement DATA['🌬']['🍰🌬💧'] qui est déjà calculé
    window.calculateH2OParameters();
    
    // 4. Calculer l'albedo initial avec T0 initial (pour Configuration - ne changera plus)
    const h2o_enabled_initial = DATA['🔘']['🔘💧📛'];
    const geothermal_flux_initial = DATA['🌕']['🧲🌕'];
    window.calculateAlbedo(DATA['⏳']['🌡️'], h2o_enabled_initial, geothermal_flux_initial);
    
    // Sauvegarder l'albedo initial dans DATA['🪞_initial'] (pour Configuration)
    // Cette valeur ne changera plus dans Configuration
    DATA['🪞_initial'] = JSON.parse(JSON.stringify(DATA['🪞'])); // Copie profonde
    
    if (window.displayResults) window.displayResults(null); // Mettre à jour la config après calculateH2OParameters et albedo initial
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Note: h2o et albedo seront recalculés dans la boucle d'itération avec DATA['⏳']['🌡️'] (pour Convergence)
    
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
    let T0_min = null;
    let T0_max = null;
    DATA['⏳']['⏳☯'] = 0;
    DATA['⏳']['⏳⚧'] = 'Search';
    const max_iterations = 20;
    let iteration = 0;
    
    const precision_K = EPOCH['🧲🔬'];
    
    // Initialiser l'historique des itérations
    DATA['⏳']['history'] = []; // Réinitialiser à chaque nouveau calcul
    
    console.log(`🔄 [computeRadiativeTransfer@calculations_flux.js] Début itération`);
    console.log(`   Précision demandée: ${precision_K}K`);
    console.log(`   T0 initial: ${DATA['⏳']['🌡️'].toFixed(2)}K`);
    
    // Boucle d'itération
    while (iteration < max_iterations) {
        iteration++;
        
        // Recalculer les paramètres H2O
        window.calculateH2OParameters();
        
        // Mettre à jour les états activés depuis les boutons
        window.getEnabledStates();
        
        // Calculer flux solaire absorbé (albedo + réflexion)
        const h2o_enabled = DATA['🔘']['🔘💧📛'];
        const geothermal_flux = DATA['🌕']['🧲🌕'];
        window.calculateAlbedo(DATA['⏳']['🌡️'], h2o_enabled, geothermal_flux);
        const flux_solaire_absorbe = window.calculateSolarFluxAbsorbed(DATA['⏳']['🌡️'], h2o_enabled, geothermal_flux);
        
        // Flux entrant = somme exacte de solaire + géothermique
        const flux_entrant = flux_solaire_absorbe + geothermal_flux;
        
        // ========================================================================
        // ÉTAPE 5 : Calculer flux sortant (corps noir : σT⁴ ou spectral si disponible)
        // ========================================================================
        // Flux sortant = flux ÉMIS PAR LA SURFACE (avant EDS) = σT⁴ (ou earth_flux_total du calcul spectral)
        let flux_sortant_surface = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['⏳']['🌡️'], 4);
        let flux_sortant_effectif = flux_sortant_surface;
        
        // Utiliser le calcul spectral
        const ch4_enabled = DATA['🔘']['🔘⛽📛'];
        // Récupérer les fractions depuis DATA['🌬'] (déjà en fraction < 1.0, pas en %)
        const co2_fraction = DATA['🌬']['🍰🌬🏭'];
        const ch4_fraction = DATA['🌬']['🍰🌬⛽'];
        const h2o_fraction = DATA['🌬']['🍰🌬💧'];
        
        // Récupérer total_mass depuis DATA et z_max depuis DATA
        const total_mass = DATA['⚖️']['⚖️📿'];
        const z_max_km = DATA['🌬']['📏🌬🧿'];
        let z_max = z_max_km * 1000; // Convertir km en mètres
        
        // Si z_max est 0 ou NaN, utiliser une valeur minimale
        if (!z_max || isNaN(z_max) || z_max <= 0) {
            console.warn(`📛 [computeRadiativeTransfer@calculations_flux.js] ⚠️ z_max invalide (${z_max}m), utilisation de 1m par défaut`);
            z_max = 1; // 1 mètre minimum
        }
        
        // Construire physParams depuis DATA pour calculateFluxForT0
        const epochId_loop = DATA['📅']['📅'];
        const epochIndex_loop = window.TIMELINE.findIndex(item => item['📅'] === epochId_loop);
        const EPOCH_loop = window.TIMELINE[epochIndex_loop];
        const physParams = {
            total_atmosphere_mass_kg: total_mass,
            gravity: EPOCH_loop['🍎'],
            planet_radius: EPOCH_loop['📐'] * 1000, // Convertir km en mètres
            molar_mass_air: DATA['🌬']['🧪'],
            temperature_K: DATA['⏳']['🌡️'],
            pressure_atm: DATA['🌬']['🎈'],
            ocean_coverage: DATA['💧']['🍰💧🌊']
        };
        
        const spectral_result = window.calculateFluxForT0(co2_fraction, DATA['⏳']['🌡️'], {
            h2o_enabled: h2o_enabled,
            ch4_enabled: ch4_enabled,
            ch4_fraction: ch4_fraction,
            z_max: z_max,  // Passer z_max en mètres
            total_atmosphere_mass_kg: total_mass,  // Passer total_mass pour calculateAtmosphereProperties
            physParams: physParams  // Passer physParams explicitement
        });
        
        // Vérifier si calculateFluxForT0 a retourné null (erreur)
        if (!spectral_result || !spectral_result.earth_flux) {
            console.error(`📛 [computeRadiativeTransfer@calculations_flux.js] ❌ calculateFluxForT0 a retourné null pour T0=${DATA['⏳']['🌡️']}K, z_max=${z_max}m`);
            return Promise.reject(new Error(`calculateFluxForT0 a retourné null (z_max=${z_max}m, total_mass=${total_mass}kg)`));
        }
        
        // Flux émis par la surface (AVANT EDS) = earth_flux_total
        const earth_flux_total = spectral_result.earth_flux.reduce((sum, val) => sum + val, 0);
        flux_sortant_surface = earth_flux_total;
        
        // Flux sortant effectif (APRÈS EDS) = total_flux au sommet de l'atmosphère
        flux_sortant_effectif = spectral_result.total_flux;
        
        // Flux spectral (courbe spectrale) = somme des flux par longueur d'onde
        // Si total_flux_by_wavelength n'existe pas, utiliser flux_sortant_effectif
        const spectral_flux = spectral_result.total_flux_by_wavelength ? 
            spectral_result.total_flux_by_wavelength.reduce((sum, val) => sum + val, 0) : 
            flux_sortant_effectif;
        
        // Flux réfléchi par l'albedo = flux solaire incident × albedo
        const solar_flux_incident = DATA['☀️']['🧲☀️🎱'];
        const albedo_flux = solar_flux_incident * DATA['🪞']['🍰🪞📿'];
        
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
                
                // Calculer les épaisseurs optiques individuelles (approximation)
                const h2o_fraction_used = h2o_enabled ? h2o_fraction : 0;
                const denominator = co2_fraction + ch4_fraction + h2o_fraction_used + 0.001;
                const tau_CO2 = tau_total * (co2_fraction / denominator);
                const tau_H2O = tau_total * (h2o_fraction / (co2_fraction + ch4_fraction + h2o_fraction + 0.001));
                const tau_CH4 = tau_total * (ch4_fraction / denominator);
                
                // Répartition du flux émis selon les épaisseurs optiques
                contribution_CO2 += em_flux * (tau_CO2 / tau_total);
                contribution_H2O += em_flux * (tau_H2O / tau_total);
                contribution_CH4 += em_flux * (tau_CH4 / tau_total);
            }
        }
        
        // Delta équilibre : comparer flux_entrant avec flux_sortant_effectif (après EDS)
        const delta_equilibre = flux_sortant_effectif - flux_entrant;
        
        // Calculer et stocker tous les forçages radiatifs dans DATA['📛']
        // Forçage CO2
        const forcing_CO2 = window.calculateCO2Forcing(co2_fraction);
        DATA['📛']['📛🏭'] = forcing_CO2;
        
        // Forçage CH4
        const forcing_CH4 = window.calculateCH4Forcing(ch4_fraction);
        DATA['📛']['📛⛽'] = forcing_CH4;
        
        // Forçage H2O (déjà calculé dans calculateH2OParameters)
        const forcing_H2O = DATA['📛']['📛💧'];
        
        // Forçage total (EDS) = somme des forçages des gaz à effet de serre uniquement
        DATA['📛']['📿📛'] = forcing_CO2 + forcing_CH4 + forcing_H2O;
        
        // Tolérance (test d'arrêt) : tolerance = 4σT³ × precision_K (dérivée de F = σT⁴)
        const tolerance = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['⏳']['🌡️'], 3) * precision_K;
        DATA['⏳']['🧲🔬'] = tolerance;
        // DATA['⏳']['⏳⚧'] et DATA['⏳']['⏳☯'] sont déjà mis à jour dans la boucle
        DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe;  // Flux solaire absorbé (séparé)
        DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];     // Flux géothermique (séparé)
        DATA['🧲']['🧲🌑🔼'] = flux_sortant_surface;     // Flux sortant surface (AVANT EDS)
        DATA['🧲']['🧲🌈🔼'] = spectral_flux;             // Flux spectral (courbe spectrale)
        DATA['🧲']['🧲🪞🔼'] = albedo_flux;               // Flux réfléchi par l'albedo
        DATA['🧲']['🔺🧲'] = flux_sortant_effectif - flux_entrant;
        
        // Log de l'itération
        console.log(`   Itération ${iteration}: T0=${DATA['⏳']['🌡️'].toFixed(2)}K, flux_entrant=${flux_entrant.toFixed(2)} W/m², flux_sortant_surface=${flux_sortant_surface > 1000 ? flux_sortant_surface.toExponential(2) : flux_sortant_surface.toFixed(2)} W/m², flux_sortant_effectif=${flux_sortant_effectif > 1000 ? flux_sortant_effectif.toExponential(2) : flux_sortant_effectif.toFixed(2)} W/m², delta=${delta_equilibre > 1000 ? delta_equilibre.toExponential(2) : delta_equilibre.toFixed(2)} W/m², tolerance=${tolerance.toFixed(2)} W/m²`);
        console.log(`   fluxState={'🌡️':${DATA['⏳']['🌡️'].toFixed(2)}, '⏳⚧':'${DATA['⏳']['⏳⚧']}', '⏳☯':${DATA['⏳']['⏳☯']}, '🧲☀️🔽':${flux_solaire_absorbe.toFixed(2)}, '🧲🌕🔽':${geothermal_flux > 1000 ? geothermal_flux.toExponential(2) : geothermal_flux.toFixed(2)}, '🧲🌑🔼':${flux_sortant_surface > 1000 ? flux_sortant_surface.toExponential(2) : flux_sortant_surface.toFixed(2)}, '🔺🧲':${delta_equilibre > 1000 ? delta_equilibre.toExponential(2) : delta_equilibre.toFixed(2)}, '🧲🔬':${tolerance.toFixed(2)}}`);
        
        // Stocker l'état de cette itération dans l'historique avec température en °C et albedo
        const temp_C = DATA['⏳']['🌡️'] - 273.15;
        // Sauvegarder l'albedo de cette itération (pour Convergence)
        const albedo_iteration = JSON.parse(JSON.stringify(DATA['🪞']));
        // Sauvegarder un snapshot des DATA qui changent (pour afficher les changements dans Convergence)
        const data_snapshot = {
            '⏳': JSON.parse(JSON.stringify(DATA['⏳'])),
            '💧': JSON.parse(JSON.stringify(DATA['💧'])),
            '🪞': JSON.parse(JSON.stringify(DATA['🪞'])),
            '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
            '📛': JSON.parse(JSON.stringify(DATA['📛']))
        };
        DATA['⏳']['history'].push({
            iteration: iteration,
            temperature_K: DATA['⏳']['🌡️'],
            temperature_C: temp_C,
            flux_entrant: flux_entrant,
            flux_sortant_surface: flux_sortant_surface,
            flux_sortant_effectif: flux_sortant_effectif,
            delta_equilibre: delta_equilibre,
            tolerance: tolerance,
            phase: DATA['⏳']['⏳⚧'],
            signe: DATA['⏳']['⏳☯'],
            albedo: albedo_iteration, // Albedo de cette itération
            data_snapshot: data_snapshot // Snapshot des DATA qui changent
        });
        
        // Log DATA à chaque itération (formaté avec retours à la ligne)
        console.log(`📊 [itération ${iteration}] DATA:`);
        console.log(`⏳=${JSON.stringify(DATA['⏳'], null, 2)}`);
        console.log(`💧=${JSON.stringify(DATA['💧'], null, 2)}`);
        console.log(`🪞=${JSON.stringify(DATA['🪞'], null, 2)}`);
        console.log(`🧲=${JSON.stringify(DATA['🧲'], null, 2)}`);
        
        // Mettre à jour l'affichage de convergence après chaque itération
        if (window.displayConvergence) {
            window.displayConvergence();
            await new Promise(resolve => setTimeout(resolve, 10)); // Permettre au DOM de se mettre à jour
        }
        
        // 8. Test d'arrêt : |delta_equilibre| <= tolerance
        if (Math.abs(delta_equilibre) <= tolerance) {
            console.log(`   ✅ Convergence atteinte après ${iteration} itérations`);
            console.log(`   T0 final: ${DATA['⏳']['🌡️'].toFixed(2)}K (${(DATA['⏳']['🌡️'] - 273.15).toFixed(2)}°C)`);
            console.log(`   Équilibre: |${delta_equilibre.toFixed(2)}| W/m² <= ${tolerance.toFixed(2)} W/m²`);
            break;
        }
        
        // 7. Détecter changement de signe pour passer en Phase="Dicho"
        if (DATA['⏳']['⏳☯'] !== 0) {
            const signeDelta = Math.sign(delta_equilibre);
            if (DATA['⏳']['⏳☯'] !== signeDelta) {
                // Changement de signe détecté → passer en dichotomie
                DATA['⏳']['⏳⚧'] = 'Dicho';
                // T0_min sera initialisé à la première itération avec changement de signe
                if (T0_min === null) T0_min = DATA['⏳']['🌡️'];
                if (T0_max === null) T0_max = DATA['⏳']['🌡️'];
                console.log(`   🔀 Changement de signe détecté → Phase=Dicho (T0_min=${T0_min.toFixed(2)}K, T0_max=${T0_max.toFixed(2)}K)`);
            }
        } else {
            // Première itération : initialiser signeDeltaFirst
            DATA['⏳']['⏳☯'] = Math.sign(delta_equilibre);
        }
        
        // 8. Ajuster T0 selon la phase
        if (DATA['⏳']['⏳⚧'] === 'Search') {
            // Phase Search : ajustement direct proportionnel au delta
            // Sensibilité : dF/dT = 4σT³, donc dT = dF / (4σT³)
            const sensitivity = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['⏳']['🌡️'], 3);
            const delta_T = -delta_equilibre / sensitivity;
            const T0_avant = DATA['⏳']['🌡️'];
            DATA['⏳']['🌡️'] += delta_T;
            
            // Limiter T0 à des valeurs physiques raisonnables
            const T0_limite = Math.max(100, Math.min(3000, DATA['⏳']['🌡️']));
            if (T0_limite !== DATA['⏳']['🌡️']) {
                console.log(`   ⚠️ T0 limité: ${DATA['⏳']['🌡️'].toFixed(2)}K → ${T0_limite.toFixed(2)}K`);
            }
            DATA['⏳']['🌡️'] = T0_limite;
            
            console.log(`   🔧 Ajustement T0 (Phase=Search): T0=${T0_avant.toFixed(2)}K, sensitivity=${sensitivity.toFixed(2)} W/(m²·K), delta_T=${delta_T.toFixed(2)}K → T0_new=${DATA['⏳']['🌡️'].toFixed(2)}K`);
        } else if (DATA['⏳']['⏳⚧'] === 'Dicho') {
            // Phase Dicho : méthode de dichotomie
            if (delta_equilibre > 0) {
                T0_max = DATA['⏳']['🌡️'];
            } else {
                T0_min = DATA['⏳']['🌡️'];
            }
            DATA['⏳']['🌡️'] = (T0_min + T0_max) / 2;
        }
        
        // 9. T0 est dans DATA['⏳']['🌡️'], pas besoin de window.T0
        
        // 10. IMPORTANT : Recalculer h2o et albedo à la fin du cycle (après ajustement de T0)
        // pour le cycle suivant - garantit la cohérence avec le nouveau T0
        if (iteration < max_iterations) { // Pas besoin de recalculer si c'est la dernière itération
            window.getEnabledStates();
            const h2o_enabled_next = DATA['🔘']['🔘💧📛'];
            
            // Recalculer h2o avec le nouveau T0 pour le prochain cycle
            // Utiliser DATA['🌬']['🍰🌬💧'] pour le pourcentage H2O (déjà en %)
            // Note: DATA['🌬']['🍰🌬💧'] est déjà à jour, h2oTotalFromMeteorites dépend de la température
            window.calculateH2OParameters();
            
            // Recalculer albedo avec le nouveau T0 pour le prochain cycle
            window.calculateAlbedo(DATA['⏳']['🌡️'], h2o_enabled_next, DATA['🌕']['🧲🌕']);
            
            console.log(`   🔄 Recalcul h2o et albedo pour cycle suivant (T0=${DATA['⏳']['🌡️'].toFixed(2)}K)`);
        }
    }
    
    if (iteration >= max_iterations) {
        console.warn(`   ⚠️ Maximum d'itérations atteint (${max_iterations})`);
    }
    
    // T0 est dans DATA['⏳']['🌡️'], pas besoin de window.T0
    
    // Calculer le flux final (séparer solaire et géothermique)
    // IMPORTANT : flux_sortant_final = flux émis par la surface (AVANT EDS) = σT⁴
    // Pour l'équilibre, on utilise le flux_sortant_effectif (après EDS) depuis la dernière itération
    window.getEnabledStates();
    const h2o_enabled_final = DATA['🔘']['🔘💧📛'];
    const flux_solaire_absorbe_final = window.calculateSolarFluxAbsorbed(DATA['⏳']['🌡️'], h2o_enabled_final, DATA['🌕']['🧲🌕']);
    const flux_geothermique_final = DATA['🌕']['🧲🌕'];
    const flux_entrant_final = flux_solaire_absorbe_final + flux_geothermique_final;
    const flux_sortant_surface_final = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['⏳']['🌡️'], 4);
    
    const delta_equilibre_final = DATA['🧲']['🔺🧲'];
    const tolerance_final = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['⏳']['🌡️'], 3) * precision_K;
    
    // Calculer et stocker les forçages radiatifs finaux
    const co2_fraction_final = DATA['🌬']['🍰🌬🏭'];
    const ch4_fraction_final = DATA['🌬']['🍰🌬⛽'];
    
    const forcing_CO2_final = window.calculateCO2Forcing(co2_fraction_final);
    const forcing_CH4_final = window.calculateCH4Forcing(ch4_fraction_final);
    const forcing_H2O_final = DATA['📛']['📛💧'];
    
    DATA['📛']['📛🏭'] = forcing_CO2_final;
    DATA['📛']['📛⛽'] = forcing_CH4_final;
    // Forçage total (EDS) = somme des forçages des gaz à effet de serre uniquement
    DATA['📛']['📿📛'] = forcing_CO2_final + forcing_CH4_final + forcing_H2O_final;
    
    // Mettre à jour DATA avec les valeurs finales
    DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_final;
    DATA['🧲']['🧲🌕🔽'] = flux_geothermique_final;
    DATA['🧲']['🧲🌑🔼'] = flux_sortant_surface_final;
    DATA['🧲']['🔺🧲'] = delta_equilibre_final;
    DATA['⏳']['🧲🔬'] = tolerance_final;
    
    // Stocker le nombre d'itérations dans DATA
    DATA['⏳']['⏳🔄'] = iteration;
    
    // Log flux radiatif final (formaté avec retours à la ligne)
    console.log(`☀️ [computeRadiativeTransfer@calculations_flux.js]`);
    console.log(`flux=${JSON.stringify(DATA['🧲'], null, 2)}`);
    console.log(`iterations=${iteration}`);
    
    // Tout est dans DATA, retourner true pour succès
    return Promise.resolve(true);
}

// Exposer les fonctions globalement
// Note: getEpochDateConfig est déjà exposé dans compute.js
// window.epoch est utilisé directement (pas de fonction getEpochConfig)
if (typeof window !== 'undefined') {
    window.calculateT0 = calculateT0;
    window.computeRadiativeTransfer = computeRadiativeTransfer;
    window.newDate = newDate;
}

