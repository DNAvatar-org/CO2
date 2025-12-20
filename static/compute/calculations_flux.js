// ============================================================================
// File: static/compute/calculations_flux.js - Calculs de flux radiatif
// Desc: En français, dans l'architecture, je suis le module de calculs de flux radiatif
// Version 1.2.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [January 2025]
// Logs:
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
// old_T0, T0, Phase, signeDeltaFirst sont dans DATA['🧮'], flux_entrant est calculé localement

// Fonctions getAnimState() et getEpochDateConfig() : définies dans compute.js (chargé avant ce fichier)
// window.epoch est utilisé directement (pas de fonction getEpochConfig)
// On utilise les fonctions globales définies dans compute.js

//Calcule T0 initial :: (🎬) => T0=prev_T0 : T0=🌡️, puis T0 += ☄️*🌡️☄️ + 💫*🌡️💫
function calculateT0() {
    const DATA = window.DATA;
    
    // Calculer T0 initial : si animation activée, garder T0 actuel (pas de config)
    if (DATA['🔘']['🔘🎬']) {
        // Animation activée : T0 ne change pas (garde la température actuelle)
        DATA['🧮']['🧮🌡️🚩'] = DATA['🧮']['🧮🌡️'];
    } else {
        // Animation désactivée : T0 = 📅.🌡️🧮 (température attendue de l'époque) + ajustements
    const adjustment = DATA['📜']['🔺🌡️💫'] * DATA['📜']['📿💫'];
        DATA['🧮']['🧮🌡️🚩'] = DATA['📅']['🌡️🧮'] + adjustment;
    }
    
    if (DATA['🧮']['🧮🌡️🚩'] <= 0) {
        console.error(`📛 [calculateT0@calculations_flux.js] ❌ T0 invalide: ${DATA['🧮']['🧮🌡️🚩']}`);
        return false;
    }
    
    // Initialiser DATA directement (sera complété dans computeRadiativeTransfer)
    const epochIndex = DATA['📜']['👉'];
    const EPOCH = window.TIMELINE[epochIndex];
    DATA['🧮']['🧮⚧'] = 'Init'; // Phase d'initialisation
    DATA['🧮']['🧮☯'] = 0;
    DATA['🧮']['🧮🔄'] = 0; // Réinitialiser le compteur d'itérations
    DATA['🧲']['🧲☀️🔽'] = 0;
    DATA['🧲']['🧲🌕🔽'] = 0;
    DATA['🧲']['🧲🌑🔼'] = 0;
    DATA['🧲']['🧲🌈🔼'] = 0;
    DATA['🧲']['🧲🪩🔼'] = 0;
    DATA['🧲']['🔺🧲'] = 0;
    DATA['🧮']['🧲🔬'] = EPOCH['🧲🔬'];
    
    // IMPORTANT: On met toujours à jour DATA['🧮']['🧮🌡️'] avec la valeur calculée
    // Si animation activée (🔘🎬 = true) : T0_base a été lu depuis DATA['🧮']['🧮🌡️'] (ligne 43)
    // Si animation désactivée (🔘🎬 = false) : T0 = DATA['📅']['🌡️🧮'] + adjustment (ligne 47)
    // On doit mettre à jour DATA['🧮']['🧮🌡️'] pour que la convergence utilise cette nouvelle valeur
    // Pour la convergence, c'est TOUJOURS DATA['🧮']['🧮🌡️'] qui est utilisé
    DATA['🧮']['🧮🌡️'] = DATA['🧮']['🧮🌡️🚩'];
    
    // Logs désactivés pour réduire la taille
    // console.log(`🌡️ T0 [calculateT0@calculations_flux.js]`);
    // console.log(`T0 initial: ${DATA['🧮']['🧮🌡️'].toFixed(2)}K`);
    
    return true;
}

//Réinitialise les variables lors d'un changement de date
function newDate() {
    DATA['🧮']['🧮⚧'] = "Search";
    DATA['🧮']['🧮☯'] = 0;
}

// Fonction helper pour récupérer les valeurs de gaz depuis DATA
// Fonction supprimée : getGasValuesFromConfig() n'était pas utilisée
// Les valeurs sont directement dans DATA['🫧'] après calculateAtmosphereComposition()

async function computeRadiativeTransfer() {
    const DATA = window.DATA;
    // Récupérer l'époque directement depuis TIMELINE avec l'index depuis DATA
    const epochIndex = DATA['📜']['👉'];
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
    
    // 🎥:true prev_T0:180.00K (-93.1°C) 🌡️:255.00K (-18.1°C), ☄️:0, 🌡️☄️:-3.5K, 💫:0, 🌡️💫:0K
    if (!calculateT0()) return Promise.reject(new Error('T0 invalide'));
    
    // 🔒 CONST doit être défini (crash si manquant)
    const CONST = window.CONST;
    // Logs désactivés pour réduire la taille
    window.calculateAtmosphereComposition();
    if (window.displayResults) window.displayResults(null); // Mettre à jour la config après calculateAtmosphereComposition
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Logs désactivés pour réduire la taille
    // console.log(`🌍 [calculateAtmosphereComposition@calculations_atm.js]`);
    // console.log(`atm=${JSON.stringify(DATA['🫧'], null, 2)}`);
    
    // 🔒 ÉTAPE 0 : Calculer les surfaces géologiques (fixes, déterminées par la géologie)
    // DOIT être appelé AVANT calculateH2OParameters() et calculateAlbedo()
    if (window.calculateGeologySurfaces) {
        window.calculateGeologySurfaces();
    }
    
    // 3. Calculer les paramètres H2O (vapeur, glace, nuages) avec T0 initial
    // IMPORTANT: Ces valeurs sont calculées avec la température ACTUELLE (qui peut venir de l'époque précédente si animation)
    // Note: h2oTotalFromMeteorites dépend de la température et peut rester de la glace,
        // donc on utilise uniquement DATA['🫧']['🍰🫧💧'] qui est déjà calculé
    // 🔒 NOUVEAU : calculateH2OParameters() utilise maintenant les surfaces géologiques
    window.calculateH2OParameters();
    
    // Sauvegarder les valeurs initiales de h2o (pour Configuration - ne changera plus)
    DATA['💧_initial'] = JSON.parse(JSON.stringify(DATA['💧'])); // Copie profonde
    
    // 4. Calculer l'albedo initial avec T0 initial (pour Configuration - ne changera plus)
    window.calculateAlbedo();
    
    // Sauvegarder l'albedo initial dans DATA['🪩_initial'] (pour Configuration)
    // Cette valeur ne changera plus dans Configuration
    DATA['🪩_initial'] = JSON.parse(JSON.stringify(DATA['🪩'])); // Copie profonde
    
    if (window.displayResults) window.displayResults(null); // Mettre à jour la config après calculateH2OParameters et albedo initial
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Note: h2o et albedo seront recalculés dans la boucle d'itération avec DATA['🧮']['🧮🌡️'] (pour Convergence)
    
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
    
    // ========================================================================
    // PHASE INIT : Initialisation avant la boucle d'itération
    // ========================================================================
    DATA['🧮']['🧮⚧'] = 'Init';
    DATA['🧮']['🧮🔄'] = 0;
    DATA['🧮']['previous'] = []; // Historique des itérations (tableau)
    
    // Calculer le flux initial pour avoir un état de référence
    // IMPORTANT: Pour être cohérent avec Configuration, on utilise l'albedo déjà calculé ligne 135
    // Au lieu de recalculer l'albedo (qui pourrait être différent), on utilise directement DATA['🪩']
    const geothermal_flux_init = DATA['🌕']['🧲🌕'];
    // Utiliser l'albedo de Configuration (déjà calculé ligne 135) pour garantir la cohérence
    const solar_flux_incident_init = DATA['☀️']['🧲☀️🎱'];
    const albedo_init_value = DATA['🪩']['🍰🪩📿']; // Utiliser l'albedo de Configuration
    const flux_solaire_absorbe_init = solar_flux_incident_init * (1 - albedo_init_value);
    const flux_entrant_init = flux_solaire_absorbe_init + geothermal_flux_init;
    
    // Calcul spectral initial (utilise DATA['🧮']['🧮🌡️'] qui peut être ajustée)
    // 🔒 DOIT être appelé AVANT calculateRadiativeCapacities() pour initialiser DATA['📊']
    if (!window.calculateFluxForT0()) {
        console.error(`📛 [computeRadiativeTransfer@calculations_flux.js] ❌ ERREUR CRITIQUE : calculateFluxForT0() initial a échoué`);
        return Promise.reject(new Error('calculateFluxForT0() initial a échoué'));
    }
    const spectral_result_init = window.getSpectralResultFromDATA();
    
    // 5. Calculer les capacités radiatives IR (🍰🫧❀🌈) et ☁️ à l'init
    // Ces valeurs sont nécessaires pour l'affichage dans Configuration
    // 🔒 DOIT être appelé APRÈS calculateFluxForT0() pour que DATA['📊'] soit rempli
    if (window.calculateRadiativeCapacities) {
        window.calculateRadiativeCapacities();
    }
    
    // Sauvegarder les valeurs initiales de l'atmosphère (pour Configuration - ne changera plus)
    // Cette valeur doit être sauvegardée APRÈS tous les calculs initiaux (y compris calculateRadiativeCapacities)
    DATA['🫧_initial'] = JSON.parse(JSON.stringify(DATA['🫧'])); // Copie profonde
    
    // 5. Calculer les capacités radiatives IR (🍰🫧❀🌈) et ☁️ à l'init
    // Ces valeurs sont nécessaires pour l'affichage dans Configuration
    // 🔒 DOIT être appelé APRÈS calculateFluxForT0() pour que DATA['📊'] soit rempli
    if (window.calculateRadiativeCapacities) {
        window.calculateRadiativeCapacities();
    }
    
    // Sauvegarder les valeurs initiales de l'atmosphère (pour Configuration - ne changera plus)
    // Cette valeur doit être sauvegardée APRÈS tous les calculs initiaux (y compris calculateRadiativeCapacities)
    DATA['🫧_initial'] = JSON.parse(JSON.stringify(DATA['🫧'])); // Copie profonde
    // 🔒 spectral_result_init doit exister (crash si manquant)
    
    // 🔒 🧲🌑🔼 dans Config = σT⁴ avec T = température de l'époque (🌡️🧮)
    const flux_sortant_surface_init = CONST.STEFAN_BOLTZMANN * Math.pow(EPOCH['🌡️🧮'], 4);
    let flux_sortant_effectif_init = spectral_result_init.total_flux;
    const spectral_flux_init = spectral_result_init.total_flux_by_wavelength ? 
        spectral_result_init.total_flux_by_wavelength.reduce((sum, val) => sum + val, 0) : 
        flux_sortant_effectif_init;
    const albedo_flux_init = solar_flux_incident_init * DATA['🪩']['🍰🪩📿'];
    const delta_equilibre_init = flux_entrant_init - flux_sortant_effectif_init;
    
    // Mettre à jour les résolutions depuis spectral_result_init
    DATA['🧮']['🔬🌈'] = spectral_result_init.lambda_range ? spectral_result_init.lambda_range.length : 0;
    DATA['🧮']['🔬🫧'] = spectral_result_init.z_range ? spectral_result_init.z_range.length : 0;
    
    // Stocker l'état initial dans l'historique
    const temp_C_init = DATA['🧮']['🧮🌡️'] - 273.15;
    const albedo_init = JSON.parse(JSON.stringify(DATA['🪩']));
    
    // Mettre à jour DATA['🧲'] pour l'état initial (APRÈS tous les ajustements)
    DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_init;
    DATA['🧲']['🧲🌕🔽'] = geothermal_flux_init;
    DATA['🧲']['🧲🌑🔼'] = flux_sortant_surface_init;
    DATA['🧲']['🧲🌈🔼'] = spectral_flux_init;
    DATA['🧲']['🧲🪩🔼'] = albedo_flux_init;
    DATA['🧲']['🔺🧲'] = delta_equilibre_init;
    DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * EPOCH['🧲🔬'];
    
    // 🔒 SAUVEGARDE DES VALEURS INITIALES (pour Configuration - ne changera plus JAMAIS)
    // Ces valeurs sont figées et ne doivent jamais être modifiées après cette ligne
    DATA['🧲_initial'] = JSON.parse(JSON.stringify(DATA['🧲'])); // Copie profonde
    // Protection : empêcher toute modification ultérieure (optionnel, pour debug)
    Object.freeze(DATA['🧲_initial']);
    
    // Snapshot initial pour comparaison
    const data_snapshot_init = {
        '🧮': (() => {
            const data = { ...DATA['🧮'] };
            delete data.previous; // Exclure previous (récursif)
            return JSON.parse(JSON.stringify(data));
        })(),
        '💧': JSON.parse(JSON.stringify(DATA['💧'])),
        '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
        '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
        '📛': JSON.parse(JSON.stringify(DATA['📛']))
    };
    
    DATA['🧮']['previous'].push({
        iteration: 0,
        temperature_K: DATA['🧮']['🧮🌡️'],
        temperature_C: temp_C_init,
        flux_entrant: flux_entrant_init,
        flux_sortant_surface: flux_sortant_surface_init,
        flux_sortant_effectif: flux_sortant_effectif_init,
        delta_equilibre: delta_equilibre_init,
        tolerance: EPOCH['🧲🔬'],
        phase: 'Init',
        signe: 0,
        albedo: albedo_init,
        data_snapshot: data_snapshot_init
    });
    
    // ========================================================================
    // BOUCLE D'ITÉRATION : Ajuster T0 jusqu'à convergence
    // ========================================================================
    // Initialiser les variables d'itération
    // IMPORTANT: Si animation activée (🔘🎬), on garde la température actuelle pour continuité
    // Si animation désactivée, on réinitialise tout depuis la config
    // Sauvegarder le delta_equilibre_init pour l'utiliser dans la première itération
    const delta_equilibre_init_saved = delta_equilibre_init;
    // 🔒 Initialiser T0_min et T0_max dès le début (pas de null)
    let T0_min = DATA['🧮']['🧮🌡️'] - 50;
    let T0_max = DATA['🧮']['🧮🌡️'] + 50;
    let T0_prev = DATA['🧮']['🧮🌡️'];
    DATA['🧮']['🧮☯'] = 0;
    DATA['🧮']['🧮⚧'] = 'Search'; // Passer en phase Search pour les itérations suivantes
    DATA['🧮']['🧮🔄'] = 0; // Réinitialiser le compteur d'itérations
    // IMPORTANT: Ne PAS réinitialiser l'historique ici car l'état Init vient d'être ajouté (ligne 268)
    // L'historique a déjà été initialisé ligne 175, et l'état Init a été ajouté ligne 268
    const max_iterations = 20;
    let iteration = 0;
    
    // Logs désactivés pour réduire la taille
    // console.log(`🔄 [computeRadiativeTransfer@calculations_flux.js] Début itération`);
    // console.log(`   Précision demandée: ${precision_K}K`);
    // console.log(`   T0 initial: ${DATA['🧮']['🧮🌡️'].toFixed(2)}K`);
    
    // Boucle d'itération
    while (iteration < max_iterations) {
        iteration++;
        
        // IMPORTANT: Pour la première itération (iteration=1), on calcule d'abord les flux avec T=287K (état Init)
        // puis on fait l'ajustement APRÈS le calcul des flux, pour que l'état Init soit visible avec T=287K
        // L'ajustement se fera à la fin de la première itération, après avoir calculé les flux
        
        // Recalculer les paramètres H2O avec la température actuelle (qui est encore 287K pour iteration=1)
        window.calculateH2OParameters();
        
        // Mettre à jour les états activés depuis les boutons
        window.getEnabledStates();
        
        // Calculer flux solaire absorbé (albedo + réflexion)
        const geothermal_flux = DATA['🌕']['🧲🌕'];
        window.calculateAlbedo();
        const flux_solaire_absorbe = window.calculateSolarFluxAbsorbed();
        
        // Flux entrant = somme exacte de solaire + géothermique
        const flux_entrant = flux_solaire_absorbe + geothermal_flux;
        
        // ========================================================================
        // ÉTAPE 5 : Calculer flux sortant (corps noir : σT⁴ ou spectral si disponible)
        // ========================================================================
        // Flux sortant = flux ÉMIS PAR LA SURFACE (avant EDS) = σT⁴ (ou earth_flux_total du calcul spectral)
        let flux_sortant_surface = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
        let flux_sortant_effectif = flux_sortant_surface;
        
        // Utiliser le calcul spectral
        // 🔒 T0 est déjà dans DATA['🧮']['🧮🌡️'] depuis la boucle d'itération
        window.calculateFluxForT0();
        
        // Calculer les capacités radiative IR depuis les données spectrales
        window.calculateRadiativeCapacities();
        
        // 🔒 spectral_result doit exister (crash si manquant)
        const spectral_result = window.getSpectralResultFromDATA();
        
        // 🧲🌑🔼 = σT⁴ avec T = DATA['🧮']['🧮🌡️'] (température actuelle)
        flux_sortant_surface = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
                        flux_sortant_effectif = spectral_result.total_flux;
        const spectral_flux = spectral_result.total_flux_by_wavelength ? 
            spectral_result.total_flux_by_wavelength.reduce((sum, val) => sum + val, 0) : 
            flux_sortant_effectif;
        
        DATA['🧮']['🔬🌈'] = spectral_result.lambda_range ? spectral_result.lambda_range.length : 0;
        DATA['🧮']['🔬🫧'] = spectral_result.z_range ? spectral_result.z_range.length : 0;
        const albedo_flux = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
                    
        const delta_equilibre = flux_entrant - flux_sortant_effectif;
        DATA['📛']['📛🏭'] = window.calculateCO2Forcing(DATA['🫧']['🍰🫧🏭']);
        DATA['📛']['📛⛽'] = window.calculateCH4Forcing(DATA['🫧']['🍰🫧⛽']);
        DATA['📛']['📿📛'] = DATA['📛']['📛🏭'] + DATA['📛']['📛⛽'] + DATA['📛']['📛💧'];
        
        // 🔒 RECALCULER LA TOLÉRANCE AVANT LE TEST DE CONVERGENCE avec la température actuelle
        // Tolérance (test d'arrêt) : tolerance = 4σT³ × precision_K (dérivée de F = σT⁴)
        DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * EPOCH['🧲🔬'];
        
        DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe;  // Flux solaire absorbé (séparé)
        DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];     // Flux géothermique (séparé)
        DATA['🧲']['🧲🌑🔼'] = flux_sortant_surface;     // Flux sortant surface (AVANT EDS)
        DATA['🧲']['🧲🌈🔼'] = spectral_flux;             // Flux spectral (courbe spectrale)
        DATA['🧲']['🧲🪩🔼'] = albedo_flux;               // Flux réfléchi par l'albedo
        // 🔒 CORRECTION SÉMANTIQUE : 🔺🧲 = flux_entrant - flux_sortant
        DATA['🧲']['🔺🧲'] = flux_entrant - flux_sortant_effectif;
        
        // 7. Détecter changement de signe pour passer en Phase="Dicho"
        if (DATA['🧮']['🧮☯'] !== 0) {
            const signeDelta = Math.sign(delta_equilibre);
            if (delta_equilibre * DATA['🧮']['🧮☯'] < 0) {
                DATA['🧮']['🧮⚧'] = 'Dicho';
                if (DATA['🧮']['🧮☯'] < 0 && signeDelta > 0) {
                    T0_min = T0_prev;
                    T0_max = DATA['🧮']['🧮🌡️'];
                } else if (DATA['🧮']['🧮☯'] > 0 && signeDelta < 0) {
                    T0_min = DATA['🧮']['🧮🌡️'];
                    T0_max = T0_prev;
                } else {
                    if (signeDelta > 0) {
                        T0_max = DATA['🧮']['🧮🌡️'];
                        T0_min = Math.max(100, DATA['🧮']['🧮🌡️'] - 50);
                    } else {
                        T0_min = DATA['🧮']['🧮🌡️'];
                        T0_max = Math.min(3000, DATA['🧮']['🧮🌡️'] + 50);
                    }
                }
            }
        }
        T0_prev = DATA['🧮']['🧮🌡️']; // Sauvegarder pour la prochaine itération
        
        if (iteration === 1) {
            // Première itération (après Init) : 🧮☯ a déjà été initialisé au début de la boucle avec le signe de Init
            // Ne PAS le réinitialiser avec le signe actuel, garder le signe de Init
            // DATA['🧮']['🧮☯'] est déjà correct (initialisé avec le signe de 🔺🧲 de Init)
            DATA['🧮']['🧮⚧'] = 'Search';
            // console.log(`   🔍 Première itération Search : 🧮☯=${DATA['🧮']['🧮☯']} (depuis Init), 🔺🧲=${delta_equilibre.toFixed(2)} W/m²`);
        } else {
            // Itération suivante : mettre à jour le signe (reste en Search si pas de changement de signe détecté)
            DATA['🧮']['🧮☯'] = Math.sign(delta_equilibre);
            // Rester en Search si pas de changement de signe détecté
            if (DATA['🧮']['🧮⚧'] !== 'Dicho') {
                DATA['🧮']['🧮⚧'] = 'Search';
            }
        }
        
        // Mettre à jour le compteur d'itérations
        DATA['🧮']['🧮🔄'] = iteration;
        
        // Logs désactivés pour réduire la taille
        // console.log(`   Itération ${iteration}: T0=${DATA['🧮']['🧮🌡️'].toFixed(2)}K, flux_entrant=${flux_entrant.toFixed(2)} W/m², flux_sortant_surface=${flux_sortant_surface > 1000 ? flux_sortant_surface.toExponential(2) : flux_sortant_surface.toFixed(2)} W/m², flux_sortant_effectif=${flux_sortant_effectif > 1000 ? flux_sortant_effectif.toExponential(2) : flux_sortant_effectif.toFixed(2)} W/m², delta=${delta_equilibre > 1000 ? delta_equilibre.toExponential(2) : delta_equilibre.toFixed(2)} W/m², tolerance=${tolerance.toFixed(2)} W/m²`);
        // console.log(`   fluxState={'🌡️':${DATA['🧮']['🧮🌡️'].toFixed(2)}, '🧮⚧':'${DATA['🧮']['🧮⚧']}', '🧮☯':${DATA['🧮']['🧮☯']}, '🧲☀️🔽':${flux_solaire_absorbe.toFixed(2)}, '🧲🌕🔽':${geothermal_flux > 1000 ? geothermal_flux.toExponential(2) : geothermal_flux.toFixed(2)}, '🧲🌑🔼':${flux_sortant_surface > 1000 ? flux_sortant_surface.toExponential(2) : flux_sortant_surface.toFixed(2)}, '🔺🧲':${delta_equilibre > 1000 ? delta_equilibre.toExponential(2) : delta_equilibre.toFixed(2)}, '🧲🔬':${tolerance.toFixed(2)}}`);
        
        // Stocker l'état de cette itération dans l'historique avec température en °C et albedo
        const temp_C = DATA['🧮']['🧮🌡️'] - 273.15;
        const albedo_iteration = JSON.parse(JSON.stringify(DATA['🪩']));
        // Snapshot des DATA qui changent (pour comparaison avec l'itération précédente)
        const data_snapshot = {
            '🧮': (() => {
                const data = { ...DATA['🧮'] };
                delete data.previous; // Exclure previous (récursif)
                return JSON.parse(JSON.stringify(data));
            })(),
            '💧': JSON.parse(JSON.stringify(DATA['💧'])),
            '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
            '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
            '📛': JSON.parse(JSON.stringify(DATA['📛']))
        };
        
        // Sauvegarder cette itération dans l'historique
        const iteration_data = {
            iteration: iteration,
            temperature_K: DATA['🧮']['🧮🌡️'],
            temperature_C: temp_C,
            flux_entrant: flux_entrant,
            flux_sortant_surface: flux_sortant_surface,
            flux_sortant_effectif: flux_sortant_effectif,
            delta_equilibre: delta_equilibre,
            tolerance: EPOCH['🧲🔬'],
            phase: DATA['🧮']['🧮⚧'],
            signe: DATA['🧮']['🧮☯'],
            albedo: albedo_iteration,
            data_snapshot: data_snapshot
        };
        DATA['🧮']['previous'].push(iteration_data);
        
        // Log parcimonieux : seulement toutes les 5 itérations ou à la convergence
        if (iteration % 5 === 0 || Math.abs(delta_equilibre) <= DATA['🧮']['🧲🔬']) {
            console.log(`🔍 [itération ${iteration}] T=${temp_C.toFixed(2)}°C, phase=${DATA['🧮']['🧮⚧']}, Δ=${delta_equilibre.toFixed(2)} W/m², historique=${DATA['🧮']['previous'].length} itérations`);
        }
        
        // Mettre à jour l'affichage de convergence après chaque itération
        if (window.displayConvergence) {
            window.displayConvergence();
            await new Promise(resolve => setTimeout(resolve, 10)); // Permettre au DOM de se mettre à jour
        }
        
        // 8. Test d'arrêt : |delta_equilibre| <= tolerance
        if (Math.abs(delta_equilibre) <= DATA['🧮']['🧲🔬']) {
            // console.log(`   ✅ Convergence atteinte après ${iteration} itérations`);
            // console.log(`   T0 final: ${DATA['🧮']['🧮🌡️'].toFixed(2)}K (${(DATA['🧮']['🧮🌡️'] - 273.15).toFixed(2)}°C)`);
            // console.log(`   Équilibre: |${delta_equilibre.toFixed(2)}| W/m² <= ${tolerance.toFixed(2)} W/m²`);
            break;
        }
        
        // 8. Ajuster T0 selon la phase
        if (DATA['🧮']['🧮⚧'] === 'Search') {
            // Phase Search : ajustement direct proportionnel au delta
            // IMPORTANT: Pour la première itération (iteration=1), utiliser le delta_equilibre_init_saved
            // Pour les itérations suivantes, utiliser le delta_equilibre actuel
            const delta_to_use = (iteration === 1) ? delta_equilibre_init_saved : delta_equilibre;
            // Sensibilité : dF/dT = 4σT³, donc dT = dF / (4σT³)
            // 🔺🧲 = flux_entrant - flux_sortant
            // Si 🔺🧲 > 0 : flux_entrant > flux_sortant → on se réchauffe → augmenter T
            // Si 🔺🧲 < 0 : flux_entrant < flux_sortant → on se refroidit → diminuer T
            // 🔒 Réutiliser DATA['🧮']['🧲🔬'] / EPOCH['🧲🔬'] au lieu de recalculer
            const sensitivity = DATA['🧮']['🧲🔬'] / EPOCH['🧲🔬'];
            const delta_T = delta_to_use / sensitivity;
            DATA['🧮']['🧮🌡️'] += delta_T;
            DATA['🧮']['🧮🌡️'] = Math.max(100, Math.min(3000, DATA['🧮']['🧮🌡️']));
        } else if (DATA['🧮']['🧮⚧'] === 'Dicho') {
            // Phase Dicho : dichotomie entre T0_min et T0_max
            // Mettre à jour les bornes selon le signe du delta
            if (delta_equilibre > 0) {
                if (DATA['🧮']['🧮🌡️'] < T0_max) {// Trop chaud : réduire T0_max
                    T0_max = DATA['🧮']['🧮🌡️'];
                }
            } else {
                if (DATA['🧮']['🧮🌡️'] > T0_min) {// Trop froid : augmenter T0_min
                    T0_min = DATA['🧮']['🧮🌡️'];
                }
            }
            
            // Vérifier que l'intervalle est valide
            if (T0_min >= T0_max) {
                // Forcer un intervalle valide autour de la température actuelle
                const T0_center = DATA['🧮']['🧮🌡️'];
                const delta_T = Math.max(1.0, Math.abs(delta_equilibre) / 100);
                
                if (delta_equilibre > 0) {
                    T0_max = T0_center;
                    T0_min = Math.max(100, T0_center - delta_T * 2);
                } else {
                    T0_min = T0_center;
                    T0_max = Math.min(3000, T0_center + delta_T * 2);
                }
                
                // Vérifier à nouveau
                if (T0_min >= T0_max) {
                    console.error(`   ❌ Impossible de créer un intervalle valide, arrêt`);
                    break;
                }
            }
            DATA['🧮']['🧮🌡️'] = (T0_min + T0_max) / 2;
            
            // Vérifier que la température change vraiment
            if (Math.abs(T0_max - T0_min) < 0.01) {
                console.warn(`⚠️ [computeRadiativeTransfer@calculations_flux.js] Dichotomie bloquée : T0 ne change pas`);
                break;
            }
        }
        
        // IMPORTANT : Recalculer h2o et albedo à la fin du cycle (après ajustement de T0)
        // pour le cycle suivant - garantit la cohérence avec le nouveau T0
        if (iteration < max_iterations) { // Pas besoin de recalculer si c'est la dernière itération
            window.getEnabledStates();
            window.calculateH2OParameters();
            window.calculateAlbedo();
        }
    }
    
    if (iteration >= max_iterations) {
        console.warn(`   ⚠️ Maximum d'itérations atteint (${max_iterations})`);
    }
    
    // Calculer le flux final (séparer solaire et géothermique)
    // IMPORTANT : flux_sortant_final = flux émis par la surface (AVANT EDS) = σT⁴
    // Pour l'équilibre, on utilise le flux_sortant_effectif (après EDS) depuis la dernière itération
    window.getEnabledStates();
    
    // Calculer et stocker les forçages radiatifs finaux
    DATA['📛']['📛🏭'] = window.calculateCO2Forcing(DATA['🫧']['🍰🫧🏭']);
    DATA['📛']['📛⛽'] = window.calculateCH4Forcing(DATA['🫧']['🍰🫧⛽']);
    DATA['📛']['📿📛'] = DATA['📛']['📛🏭'] + DATA['📛']['📛⛽'] + DATA['📛']['📛💧'];
    
    // Mettre à jour DATA avec les valeurs finales
    DATA['🧲']['🧲☀️🔽'] = window.calculateSolarFluxAbsorbed();
    DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
    DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
    DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * EPOCH['🧲🔬'];
    DATA['🧮']['🧮🔄'] = iteration;
    return Promise.resolve(true);
}

// Exposer les fonctions globalement
// Note: getEpochDateConfig est déjà exposé dans compute.js
window.calculateT0 = calculateT0;
window.computeRadiativeTransfer = computeRadiativeTransfer;
window.newDate = newDate;

