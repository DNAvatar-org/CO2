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

function computeRadiativeTransfer() {
    const DATA = window.DATA;
    // Récupérer l'époque directement depuis TIMELINE avec l'index depuis DATA
    const epochIndex = DATA['📜']['👉'];
    const EPOCH = window.TIMELINE[epochIndex];
    
    // 0. Calculer les valeurs du soleil et du noyau
    window.getSoleil();
    window.getNoyau();
    getEpochDateConfig();
    
    // 🎥:true prev_T0:180.00K (-93.1°C) 🌡️:255.00K (-18.1°C), ☄️:0, 🌡️☄️:-3.5K, 💫:0, 🌡️💫:0K
    if (!calculateT0()) return Promise.reject(new Error('T0 invalide'));
    
    // 🔒 CONST doit être défini (crash si manquant)
    const CONST = window.CONST;
    // Logs désactivés pour réduire la taille
    window.calculateAtmosphereComposition();
    
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
        // donc on utilise uniquement DATA['💧']['🍰🫧💧'] qui est déjà calculé
    // 🔒 NOUVEAU : calculateH2OParameters() utilise maintenant les surfaces géologiques
    window.calculateH2OParameters();
    
    // 4. Calculer l'albedo initial avec T0 initial (pour Configuration - ne changera plus)
    window.calculateAlbedo();
    
    // 🔒 En mode config uniquement, DATA['💧'] et DATA['🪩'] ne changent pas après le calcul initial
    // Donc on peut utiliser directement DATA['💧'] et DATA['🪩'] dans l'affichage, pas besoin de _initial
    
    // 🔒 Ne pas appeler displayResults ici pour éviter les boucles infinies
    // displayResults sera appelé une seule fois à la fin
    
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
    
    // 🔒 Calculer les flux AVANT le return pour que DATA['🧲'] soit rempli en mode config
    // 🔒 🧲🌑🔼 dans Config = σT⁴ avec T = température ACTUELLE (DATA['🧮']['🧮🌡️']), pas EPOCH['🌡️🧮']
    // Car on calcule avec la température actuelle, pas celle de l'époque
    const flux_sortant_surface_init = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
    let flux_sortant_effectif_init = spectral_result_init.total_flux;
    const spectral_flux_init = spectral_result_init.total_flux_by_wavelength ? 
        spectral_result_init.total_flux_by_wavelength.reduce((sum, val) => sum + val, 0) : 
        flux_sortant_effectif_init;
    const albedo_flux_init = solar_flux_incident_init * DATA['🪩']['🍰🪩📿'];
    const delta_equilibre_init = flux_entrant_init - flux_sortant_effectif_init;
    
    // Mettre à jour les résolutions depuis spectral_result_init
    DATA['🧮']['🔬🌈'] = spectral_result_init.lambda_range ? spectral_result_init.lambda_range.length : 0;
    DATA['🧮']['🔬🫧'] = spectral_result_init.z_range ? spectral_result_init.z_range.length : 0;
    
    // Mettre à jour DATA['🧲'] pour l'état initial (APRÈS tous les ajustements)
    DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_init;
    DATA['🧲']['🧲🌕🔽'] = geothermal_flux_init;
    DATA['🧲']['🧲🌑🔼'] = flux_sortant_surface_init;
    DATA['🧲']['🧲🌈🔼'] = spectral_flux_init;
    DATA['🧲']['🧲🪩🔼'] = albedo_flux_init;
    DATA['🧲']['🔺🧲'] = delta_equilibre_init;
    DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * EPOCH['🧲🔬'];
    
    // Sauvegarder les valeurs initiales de l'atmosphère (pour Configuration - ne changera plus)
    // ⚠️ ATTENTION : Cette valeur sera mise à jour APRÈS la phase Init pour inclure 🍰🫧💧 calculé
    // Pour l'instant, on initialise avec les valeurs de base (🍰🫧💧 sera mis à jour plus tard)
    DATA['🫧_initial'] = JSON.parse(JSON.stringify(DATA['🫧'])); // Copie profonde
    
    // 🔒 MODE CONFIG UNIQUEMENT : Ne pas lancer la convergence, juste afficher la config
    // ⚠️ IMPORTANT : Les flux doivent être calculés AVANT le return
    // Ne pas appeler displayResults ici pour éviter les boucles infinies
    // displayResults sera appelé depuis runTest() après computeRadiativeTransfer()
    
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
    
    // 🔒 spectral_result_init doit exister (crash si manquant)
    
    // Stocker l'état initial dans l'historique
    const temp_C_init = DATA['🧮']['🧮🌡️'] - 273.15;
    const albedo_init = JSON.parse(JSON.stringify(DATA['🪩']));
    
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
        '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
        '💧': JSON.parse(JSON.stringify(DATA['💧'])),
        '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
        '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
        '📛': JSON.parse(JSON.stringify(DATA['📛']))
    };
    
    DATA['🧮']['previous'].push({
        outerIter: 0,
        innerIter: 0,
        temperature_K: DATA['🧮']['🧮🌡️'],
        temperature_C: temp_C_init,
        delta_equilibre: delta_equilibre_init,
        phase: 'Init',
        data_snapshot: data_snapshot_init
    });
    
    // ========================================================================
    // PHASE INIT : Cycle de l'eau pour initialiser 🍰🫧💧 correctement
    // ========================================================================
    if (DATA['🧮']['🧮⚧'] === 'Init') {
        // Accélérer la convergence avec 🔺⏳×10
        DATA['📅']['🔺⏳'] = 86400 * 10; // 10 jours pour accélérer
        
        // Itérer le cycle de l'eau jusqu'à convergence
        for (let initIter = 0; initIter < 5; initIter++) {
            window.calculateH2OParameters();
            window.calculatePrecipitationFeedback();
            
            const vapor_before = DATA['💧']['🍰🫧💧'];
            window.calculateH2OParameters();
            const vapor_after = DATA['💧']['🍰🫧💧'];
            const delta_vapor = Math.abs(vapor_after - vapor_before);
            
            if (delta_vapor < 0.001) {
                break;
            }
        }
        
        // Revenir à 🔺⏳ normal (1 jour)
        DATA['📅']['🔺⏳'] = 86400;
        
        // 🔒 Mettre à jour DATA['🫧_initial'] APRÈS la phase Init pour inclure 🍰🫧💧 calculé
        // (pour que la Configuration affiche la bonne valeur)
        DATA['🫧_initial'] = JSON.parse(JSON.stringify(DATA['🫧']));
    }
    
    // ========================================================================
    // BOUCLE EXTERNE : Cycle de l'eau (partition, précipitation, albedo, nuages)
    // BOUCLE INTERNE : Convergence radiatif (ajustement T jusqu'à équilibre)
    // ========================================================================
    DATA['🧮']['🧮☯'] = Math.sign(delta_equilibre_init);
    DATA['🧮']['🧮⚧'] = 'Search';
    DATA['🧮']['🧮🔄'] = 0;
    DATA['🧮']['🧮🔄🌊'] = 0; // Compteur boucle externe (Init = 0, premier cycle = 1)
    DATA['🧮']['🧮🔄☀️'] = 0; // Compteur boucle interne
    
    DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'] - 50; // T0_min
    DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'] + 50; // T0_max
    DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️']; // T0_prev
    DATA['🧮']['🧲🔺⏮'] = delta_equilibre_init; // deltaFluxOld
    
    // Accélérer la convergence avec 🔺⏳×10 au début
    DATA['📅']['🔺⏳'] = 86400 * 10; // 10 jours pour accélérer
    
    // ========================================================================
    // BOUCLE EXTERNE : Cycle de l'eau
    // ========================================================================
    while (DATA['🧮']['🧮🔄🌊'] < 10) {
        DATA['🧮']['🧮🔄🌊']++;
        
        // 1. Partition eau (vapeur potentielle, glace, océan)
        // 🔒 IMPORTANT : Ne recalculer que si ce n'est pas la première itération après Init
        // Car Init a déjà calculé les paramètres H2O
        if (DATA['🧮']['🧮🔄🌊'] > 1) {
            window.calculateH2OParameters();
            window.getEnabledStates();
            window.calculateAlbedo();
        }
        
        // 2. Boucle radiatif interne (convergence T jusqu'à équilibre)
        DATA['🧮']['🧮🔄☀️'] = 0;
        let innerConverged = false;
        let firstIterationSaved = false;
        
        while (DATA['🧮']['🧮🔄☀️'] < 20 && !innerConverged) {
            DATA['🧮']['🧮🔄☀️']++;
        
        // IMPORTANT: Pour la première itération (iteration=1), on calcule d'abord les flux avec T=287K (état Init)
        // puis on fait l'ajustement APRÈS le calcul des flux, pour que l'état Init soit visible avec T=287K
        // L'ajustement se fera à la fin de la première itération, après avoir calculé les flux
        
            // BOUCLE INTERNE : Convergence radiatif
            // 🔒 IMPORTANT : Recalculer H2O et albedo dans la boucle interne car ils dépendent de T
            // Mais on ne fait PAS le feedback précipitation ici (seulement dans le cycle externe)
            // Cela permet de converger la température avec des paramètres qui suivent T
            window.calculateH2OParameters();
            window.getEnabledStates();
            window.calculateAlbedo();
            
            window.calculateFluxForT0();
            window.calculateRadiativeCapacities();
            
            const spectral_result = window.getSpectralResultFromDATA();
            
            DATA['🧲']['🧲☀️🔽'] = window.calculateSolarFluxAbsorbed();
            DATA['🧲']['🧲🌕🔽'] = DATA['🌕']['🧲🌕'];
            DATA['🧲']['🧲🌑🔼'] = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
            DATA['🧲']['🧲🌈🔼'] = spectral_result.total_flux;
            DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
            DATA['🧲']['🔺🧲'] = DATA['🧲']['🧲☀️🔽'] + DATA['🧲']['🧲🌕🔽'] - DATA['🧲']['🧲🌈🔼'];
            
            DATA['🧮']['🔬🌈'] = spectral_result.lambda_range.length;
            DATA['🧮']['🔬🫧'] = spectral_result.z_range.length;
            DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * EPOCH['🧲🔬'];
            
            DATA['📛']['📛🏭'] = window.calculateCO2Forcing(DATA['🫧']['🍰🫧🏭']);
            DATA['📛']['📛⛽'] = window.calculateCH4Forcing(DATA['🫧']['🍰🫧⛽']);
            DATA['📛']['📿📛'] = DATA['📛']['📛🏭'] + DATA['📛']['📛⛽'] + DATA['📛']['📛💧'];
        DATA['📛']['📛🏭'] = window.calculateCO2Forcing(DATA['🫧']['🍰🫧🏭']);
        DATA['📛']['📛⛽'] = window.calculateCH4Forcing(DATA['🫧']['🍰🫧⛽']);
        DATA['📛']['📿📛'] = DATA['📛']['📛🏭'] + DATA['📛']['📛⛽'] + DATA['📛']['📛💧'];
        
        // 🔒 RECALCULER LA TOLÉRANCE AVANT LE TEST DE CONVERGENCE avec la température actuelle
        // Tolérance (test d'arrêt) : tolerance = 4σT³ × precision_K (dérivée de F = σT⁴)
        DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * EPOCH['🧲🔬'];
        
            // Détecter changement de signe pour passer en Phase="Dicho"
            if (DATA['🧮']['🧮☯'] !== 0 && DATA['🧲']['🔺🧲'] * DATA['🧮']['🧮☯'] < 0) {
                DATA['🧮']['🧮⚧'] = 'Dicho';
                if (DATA['🧮']['🧮☯'] < 0 && Math.sign(DATA['🧲']['🔺🧲']) > 0) {
                    DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️⏮'];
                    DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
                } else if (DATA['🧮']['🧮☯'] > 0 && Math.sign(DATA['🧲']['🔺🧲']) < 0) {
                    DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                    DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️⏮'];
                }
            }
            DATA['🧮']['🧮🌡️⏮'] = DATA['🧮']['🧮🌡️'];
            
            if (DATA['🧮']['🧮🔄☀️'] === 1) {
                DATA['🧮']['🧮⚧'] = 'Search';
            } else {
                DATA['🧮']['🧮☯'] = Math.sign(DATA['🧲']['🔺🧲']);
                if (DATA['🧮']['🧮⚧'] !== 'Dicho') {
                    DATA['🧮']['🧮⚧'] = 'Search';
                }
            }
        
            // 🔒 Sauvegarder dans l'historique seulement pour la première itération
            const isFirstIteration = DATA['🧮']['🧮🔄☀️'] === 1;
            
            if (isFirstIteration) {
                const data_snapshot = {
                    '🧮': (() => {
                        const data = { ...DATA['🧮'] };
                        delete data.previous;
                        return JSON.parse(JSON.stringify(data));
                    })(),
                    '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                    '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                    '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                    '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
                    '📛': JSON.parse(JSON.stringify(DATA['📛']))
                };
                DATA['🧮']['previous'].push({
                    outerIter: DATA['🧮']['🧮🔄🌊'],
                    innerIter: DATA['🧮']['🧮🔄☀️'],
                    temperature_K: DATA['🧮']['🧮🌡️'],
                    temperature_C: DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS,
                    delta_equilibre: DATA['🧲']['🔺🧲'],
                    phase: DATA['🧮']['🧮⚧'],
                    data_snapshot: data_snapshot
                });
                
                if (window.displayConvergence) {
                    window.displayConvergence();
                }
            }
            
            // Test convergence interne
            if (Math.abs(DATA['🧲']['🔺🧲']) <= DATA['🧮']['🧲🔬']) {
                innerConverged = true;
            }
            
            // Sauvegarder la dernière itération (convergence ou max itérations)
            if (innerConverged || DATA['🧮']['🧮🔄☀️'] >= 20) {
                // Ne sauvegarder que si ce n'est pas déjà la première itération
                if (!isFirstIteration || innerConverged) {
                    const data_snapshot = {
                        '🧮': (() => {
                            const data = { ...DATA['🧮'] };
                            delete data.previous;
                            return JSON.parse(JSON.stringify(data));
                        })(),
                        '🫧': JSON.parse(JSON.stringify(DATA['🫧'])),
                        '💧': JSON.parse(JSON.stringify(DATA['💧'])),
                        '🪩': JSON.parse(JSON.stringify(DATA['🪩'])),
                        '🧲': JSON.parse(JSON.stringify(DATA['🧲'])),
                        '📛': JSON.parse(JSON.stringify(DATA['📛']))
                    };
                    DATA['🧮']['previous'].push({
                        outerIter: DATA['🧮']['🧮🔄🌊'],
                        innerIter: DATA['🧮']['🧮🔄☀️'],
                        temperature_K: DATA['🧮']['🧮🌡️'],
                        temperature_C: DATA['🧮']['🧮🌡️'] - CONST.KELVIN_TO_CELSIUS,
                        delta_equilibre: DATA['🧲']['🔺🧲'],
                        phase: DATA['🧮']['🧮⚧'],
                        data_snapshot: data_snapshot
                    });
                    if (window.displayConvergence) {
                        window.displayConvergence();
                    }
                }
                if (innerConverged) {
                    break;
                }
            }
            
            // Ajuster T selon la phase
            if (DATA['🧮']['🧮⚧'] === 'Search') {
                const delta_to_use = DATA['🧮']['🧮🔄☀️'] === 1 ? delta_equilibre_init : DATA['🧲']['🔺🧲'];
                const sensitivity = DATA['🧮']['🧲🔬'] / EPOCH['🧲🔬'];
                DATA['🧮']['🧮🌡️'] += delta_to_use / sensitivity;
                DATA['🧮']['🧮🌡️'] = Math.max(100, Math.min(3000, DATA['🧮']['🧮🌡️']));
            } else if (DATA['🧮']['🧮⚧'] === 'Dicho') {
                if (DATA['🧲']['🔺🧲'] > 0 && DATA['🧮']['🧮🌡️'] < DATA['🧮']['🧮🌡️🔼']) {
                    DATA['🧮']['🧮🌡️🔼'] = DATA['🧮']['🧮🌡️'];
                } else if (DATA['🧲']['🔺🧲'] < 0 && DATA['🧮']['🧮🌡️'] > DATA['🧮']['🧮🌡️🔽']) {
                    DATA['🧮']['🧮🌡️🔽'] = DATA['🧮']['🧮🌡️'];
                }
                if (DATA['🧮']['🧮🌡️🔽'] >= DATA['🧮']['🧮🌡️🔼']) {
                    const T0_center = DATA['🧮']['🧮🌡️'];
                    const delta_T = Math.max(1.0, Math.abs(DATA['🧲']['🔺🧲']) / 100);
                    if (DATA['🧲']['🔺🧲'] > 0) {
                        DATA['🧮']['🧮🌡️🔼'] = T0_center;
                        DATA['🧮']['🧮🌡️🔽'] = Math.max(100, T0_center - delta_T * 2);
                    } else {
                        DATA['🧮']['🧮🌡️🔽'] = T0_center;
                        DATA['🧮']['🧮🌡️🔼'] = Math.min(3000, T0_center + delta_T * 2);
                    }
                }
                DATA['🧮']['🧮🌡️'] = (DATA['🧮']['🧮🌡️🔽'] + DATA['🧮']['🧮🌡️🔼']) / 2;
            }
        }
        
        // 3. Calcul feedback précipitation (après RH et ☁️)
        window.calculatePrecipitationFeedback();
        
        // 4. Recalculer albedo et nuages avec nouvelle vapeur
        window.calculateAlbedo();
        window.calculateCloudFormationIndex();
        
        // 🔒 ÉTAPE CRITIQUE : Recalculer les flux radiatifs APRÈS le feedback précipitation
        // car les paramètres (vapeur, albedo, nuages) ont changé, donc 🔺🧲 doit être recalculé
        const flux_solaire_absorbe_after = window.calculateSolarFluxAbsorbed();
        const geothermal_flux_after = DATA['🌕']['🧲🌕'];
        const flux_entrant_after = flux_solaire_absorbe_after + geothermal_flux_after;
        
        window.calculateFluxForT0();
        window.calculateRadiativeCapacities();
        const spectral_result_after = window.getSpectralResultFromDATA();
        const flux_sortant_surface_after = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
        const flux_sortant_effectif_after = spectral_result_after.total_flux;
        
        // Mettre à jour les flux dans DATA
        DATA['🧲']['🧲☀️🔽'] = flux_solaire_absorbe_after;
        DATA['🧲']['🧲🌕🔽'] = geothermal_flux_after;
        DATA['🧲']['🧲🌑🔼'] = flux_sortant_surface_after;
        DATA['🧲']['🧲🌈🔼'] = flux_sortant_effectif_after;
        DATA['🧲']['🧲🪩🔼'] = DATA['☀️']['🧲☀️🎱'] * DATA['🪩']['🍰🪩📿'];
        DATA['🧲']['🔺🧲'] = flux_entrant_after - flux_sortant_effectif_after;
        
        // Recalculer la tolérance avec la température actuelle
        DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * EPOCH['🧲🔬'];
        
        // 5. Ajuster température selon déséquilibre radiatif (seulement si la boucle interne n'a pas convergé)
        // Si la boucle interne a convergé, 🔺🧲 devrait être proche de zéro, donc pas besoin d'ajustement
        // Si la boucle interne n'a pas convergé, on ajuste légèrement la température pour la prochaine itération
        if (innerConverged) {
            // La boucle interne a convergé : vérifier si on peut arrêter
            if (Math.abs(DATA['🧲']['🔺🧲']) < DATA['🧮']['🧲🔬'] && Math.abs(DATA['🧲']['🔺🧲'] - DATA['🧮']['🧲🔺⏮']) < 0.01) {
                // Revenir à 🔺⏳ normal si convergence partielle
                if (DATA['📅']['🔺⏳'] > 86400) {
                    DATA['📅']['🔺⏳'] = 86400;
                }
                break;
            }
            // Même si la boucle interne a convergé, si 🔺🧲 change encore (à cause du cycle de l'eau),
            // on ajuste très légèrement la température
            const dT = DATA['🧲']['🔺🧲'] * 0.1; // Réduire le facteur de 0.8 à 0.1 pour éviter les oscillations
            DATA['🧮']['🧮🌡️'] += dT;
            DATA['🧮']['🧮🌡️'] = Math.max(100, Math.min(3000, DATA['🧮']['🧮🌡️']));
        } else {
            // La boucle interne n'a pas convergé : ajuster la température plus agressivement
            // mais toujours avec un facteur réduit pour éviter les oscillations
            const dT = DATA['🧲']['🔺🧲'] * 0.2; // Réduire le facteur de 0.8 à 0.2
            DATA['🧮']['🧮🌡️'] += dT;
            DATA['🧮']['🧮🌡️'] = Math.max(100, Math.min(3000, DATA['🧮']['🧮🌡️']));
        }
        DATA['🧮']['🧲🔺⏮'] = DATA['🧲']['🔺🧲'];
        
        // Réduire 🔺⏳ progressivement après quelques itérations
        if (DATA['🧮']['🧮🔄🌊'] > 3 && DATA['📅']['🔺⏳'] > 86400) {
            DATA['📅']['🔺⏳'] = 86400; // Revenir à 1 jour
        }
    }
    
    window.getEnabledStates();
    DATA['📛']['📛🏭'] = window.calculateCO2Forcing(DATA['🫧']['🍰🫧🏭']);
    DATA['📛']['📛⛽'] = window.calculateCH4Forcing(DATA['🫧']['🍰🫧⛽']);
    DATA['📛']['📿📛'] = DATA['📛']['📛🏭'] + DATA['📛']['📛⛽'] + DATA['📛']['📛💧'];
    DATA['🧮']['🧲🔬'] = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 3) * EPOCH['🧲🔬'];
    DATA['🧮']['🧮🔄'] = DATA['🧮']['🧮🔄🌊'];
    return true;
}

// Exposer les fonctions globalement
// Note: getEpochDateConfig est déjà exposé dans compute.js
window.calculateT0 = calculateT0;
window.computeRadiativeTransfer = computeRadiativeTransfer;
window.newDate = newDate;

