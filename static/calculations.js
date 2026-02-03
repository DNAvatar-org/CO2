// File: calculations.js - Calculs de transfert radiatif
// Desc: Module de calculs radiatifs
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.


function temperatureAtZ(z) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const z_trop = window.calculateTropopauseHeight();
    const Gamma = EPOCH.lapse_rate ? EPOCH.lapse_rate : -(EPOCH['🍎'] / CONST.CP_AIR);
    const T_trop = DATA['🧮']['🧮🌡️'] + Gamma * z_trop;

    if (z < z_trop) {
        return DATA['🧮']['🧮🌡️'] + Gamma * z;
    } else {
        return T_trop;
    }
}


function crossSectionCO2(wavelength) {
    const CONST = window.CONST;
    const exponent = -22.5 - 24 * Math.abs((wavelength - CONST.LAMBDA_CO2_CENTER) / CONST.LAMBDA_CO2_CENTER);
    return Math.pow(10, exponent);
}

function waterVaporMixingRatio(z, r0_override = null) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const r0 = r0_override !== null ? r0_override : DATA['💧']['🍰🫧💧'];
    const H_H2O = (CONST.R_GAS * DATA['🧮']['🧮🌡️']) / (CONST.M_H2O * EPOCH['🍎']);

    return r0 * Math.exp(-z / H_H2O);
}

function crossSectionH2O(wavelength) {
    const CONST = window.CONST;
    const sigma1 = Math.pow(10, -20 - 15 * Math.abs((wavelength - CONST.LAMBDA_H2O_1) / CONST.LAMBDA_H2O_1));
    const sigma2 = Math.pow(10, -21 - 18 * Math.abs((wavelength - CONST.LAMBDA_H2O_2) / CONST.LAMBDA_H2O_2));
    return Math.max(sigma1, sigma2);
}

function waterVaporFractionAtZ(z) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    if (!DATA['🔘']['🔘💧📛']) return 0;

    // 🔒 Ne pas appeler calculateWaterPartition ici : appelé une fois par le caller (calculateH2OParameters avant calculateFluxForT0)
    const H_H2O = (CONST.R_GAS * DATA['🧮']['🧮🌡️']) / (CONST.M_H2O * EPOCH['🍎']);
    return DATA['💧']['🍰🫧💧'] * Math.exp(-z / H_H2O);
}

// ============================================================================
// MÉTHANE (CH4)
// ============================================================================

// Section efficace d'absorption CH4 (approximation)
function crossSectionCH4(wavelength) {
    const CONST = window.CONST;
    const sigma1 = Math.pow(10, -20 - 16 * Math.abs((wavelength - CONST.LAMBDA_CH4_1) / CONST.LAMBDA_CH4_1));
    const sigma2 = Math.pow(10, -21 - 17 * Math.abs((wavelength - CONST.LAMBDA_CH4_2) / CONST.LAMBDA_CH4_2));
    return Math.max(sigma1, sigma2);
}

function methaneFractionAtZ(z) {
    const DATA = window.DATA;
    if (!DATA['🔘']['🔘⛽📛']) return 0;
    if (!DATA['🫧']['🍰🫧⛽']) return 0;
    return DATA['🫧']['🍰🫧⛽'];
}

function evaporationRate() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    return CONST.EVAPORATION_E0 * Math.exp((DATA['🧮']['🧮🌡️'] - CONST.EVAPORATION_T_REF) / CONST.EVAPORATION_T_SCALE);
}


function calculateFluxForT0() {
    const DATA = window.DATA;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    // 🔒 Partition eau déjà mise à jour par le caller (calculateH2OParameters avant chaque calculateFluxForT0 dans la boucle radiatif)
    DATA['📊'] = {};
    
    const delta_z = 50;
    const lambda_min = 0.1e-6;
    const lambda_max = 100e-6;
    const delta_lambda = 0.1e-6;
    const z_max = DATA['🫧']['📏🫧🧿'] * 1000; // km → m
    
    let precisionFactor = window.getPrecisionFactorFromFPS();
    precisionFactor = Number.isFinite(precisionFactor) && precisionFactor > 0 ? Math.min(precisionFactor, 5) : 1;
    if (precisionFactor > 5 && window.DEBUG_OOM) console.warn('[OOM] precisionFactor plafonné à 5 (était ' + precisionFactor + ') pour limiter le nombre de couches verticales');

    // Ajuster delta_z et delta_lambda (toujours à la valeur de base, pas de réduction)
    // Note : delta_z sous tropopause reste constant (pas d'optimisation)
    //const final_delta_lambda = delta_lambda; // Toujours utiliser delta_lambda de base (précision maximale)

    // ⚡ OPTIMISATION : Créer les grilles avec précision adaptative
    // Pour lambda : regrouper en plages de moyennes pour accélérer
    // Pour z : précision fine sous tropopause, grossière au-dessus
    
    
    // Calculer la tropopause pour déterminer les zones de précision (hauteur d'échelle H = R*T/(M*g))
    const z_trop_raw = window.calculateTropopauseHeight();
    const limit_std_atmosphere_z = 120000;
    const z_trop_precalc = Math.min(z_trop_raw, Math.min(z_max, limit_std_atmosphere_z));
    if (z_trop_raw > limit_std_atmosphere_z && window.DEBUG_OOM) console.warn('[OOM] tropopause plafonnée à ' + limit_std_atmosphere_z + ' m (H brut=' + (z_trop_raw / 1000).toFixed(0) + ' km) pour éviter grille OOM');

    // Créer la grille lambda avec regroupement adaptatif (sauf si fullSpectre)
    const lambda_range = [];
    const lambda_weights = []; // Poids pour les moyennes pondérées

    // 💧 Résolution spectrale : DATA['🧮']['🔬🌈'] = target (entrée) puis lambda_range.length (sortie)
    const lambda_span = lambda_max - lambda_min;

    {
        const expected_points = Math.max(2, Math.min(DATA['🧮']['🔬🌈'], 10000));
        const effective_delta = lambda_span / (expected_points - 1);

        // Créer exactement le bon nombre de points, en forçant lambda_max comme dernier élément
        for (let i = 0; i < expected_points; i++) {
            let lambda;
            if (i === expected_points - 1) {
                lambda = lambda_max;
            } else {
                lambda = lambda_min + i * effective_delta;
            }
            lambda_range.push(lambda);
            lambda_weights.push(1.0);
        }
        if (lambda_range.length !== expected_points) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE: lambda_range.length (${lambda_range.length}) != expected (${expected_points})`);
            throw new Error(`lambda_range.length (${lambda_range.length}) != expected (${expected_points})`);
        }
        if (Math.abs(lambda_range[lambda_range.length - 1] - lambda_max) > effective_delta * 0.0001) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE: dernier élément != lambda_max`);
            throw new Error(`Dernier élément lambda_range != lambda_max`);
        }
        
        // Log pour debug
    }

    // Largeur de bin réelle pour l'intégration : Σ π B_λ Δλ doit utiliser le pas de la grille, pas delta_lambda fixe
    // Sinon avec 50 bins (pas ~2 µm) on multipliait par 0.1 µm → flux total ~20× trop faible (visible/IR mal compté)
    const effective_delta_lambda = lambda_range.length > 1 ? (lambda_range[lambda_range.length - 1] - lambda_range[0]) / (lambda_range.length - 1) : lambda_span;

    // Créer la grille z à partir des hauteurs calculées (📏🫧🧿, tropopause). Si tout à 0 → z_max=1e-6, tropo=0 → une couche en une passe.
    const z_range = [];
    const delta_z_troposphere = delta_z;
    const raw_stratosphere = (delta_z * 5) / precisionFactor;
    const delta_z_stratosphere = Math.max(100, raw_stratosphere);
    if (raw_stratosphere < 100 && window.DEBUG_OOM) console.warn('[OOM] delta_z_stratosphere plafonné à 100 m (était ' + raw_stratosphere.toFixed(1) + ' m) pour éviter grille OOM');
    const delta_z_exosphere = (z_max > 120000) ? 5000 : delta_z_stratosphere;

    if (z_trop_precalc > 0) {
        for (let z = 0; z < z_trop_precalc; z += delta_z_troposphere) {
            z_range.push(z);
        }
        // S'assurer que la tropopause est incluse
        if (z_range.length === 0 || z_range[z_range.length - 1] < z_trop_precalc) {
            z_range.push(z_trop_precalc);
        }
    } else {
        // Tropopause à z=0 ou négative : commencer par z=0
        z_range.push(0);
    }

    const limit_std_atmosphere = 120000;
    let current_z_max_loop = Math.min(z_max, limit_std_atmosphere);
    for (let z = z_trop_precalc + delta_z_stratosphere; z < current_z_max_loop; z += delta_z_stratosphere) {
        z_range.push(z);
    }

    // Si atmosphère massive, continuer au-delà de 120km avec un pas plus grand
    if (z_max > limit_std_atmosphere) {
        // S'assurer d'inclure la limite 120km
        if (z_range[z_range.length - 1] < limit_std_atmosphere) {
            z_range.push(limit_std_atmosphere);
        }

        for (let z = limit_std_atmosphere + delta_z_exosphere; z < z_max; z += delta_z_exosphere) {
            z_range.push(z);
        }
    }

    // S'assurer que z_max est inclus
    if (z_range.length === 0) {
        z_range.push(0);
    } else if (z_range[z_range.length - 1] < z_max) {
        z_range.push(z_max);
    }

    // ⚠️ IMPORTANT : S'assurer que lambda_range est complètement construit avant de créer upward_flux
    // Vérifier la cohérence des longueurs
    if (lambda_range.length !== lambda_weights.length) {
        console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE : Longueurs incompatibles - lambda_range: ${lambda_range.length}, lambda_weights: ${lambda_weights.length}`);
        throw new Error(`Longueurs incompatibles : lambda_range (${lambda_range.length}) != lambda_weights (${lambda_weights.length})`);
    }

    // Initialiser les tableaux avec la longueur finale de lambda_range
    const final_lambda_length = lambda_range.length;
    const num_couches = z_range.length;
    const num_plages_spectre = final_lambda_length;
    const total_cases = num_couches * num_plages_spectre;
    if (window.DEBUG_OOM && typeof console !== 'undefined') {
        const estMB = (final_lambda_length * num_couches * 5 * 8) / 1e6;
        console.log('[OOM] calculateFluxForT0 about to allocate grid', { bins: final_lambda_length, layers: num_couches, estMB: estMB.toFixed(1) + ' MB' });
    }
    const upward_flux = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));
    const optical_thickness = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));
    const emitted_flux = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));
    const absorbed_flux = Array(z_range.length).fill(0).map(() => Array(final_lambda_length).fill(0));
    let sum_blocked_CO2 = 0, sum_blocked_H2O = 0, sum_blocked_CH4 = 0;

    // Log du calcul spectral (désactivé pour réduire la taille des logs)
    // console.log(`📊 [calculateFluxForT0@calculations.js] Calcul spectral:`);
    // console.log(`   Nombre de couches atmosphériques: ${num_couches}`);
    // console.log(`   Nombre de plages spectrales: ${num_plages_spectre}`);
    // console.log(`   Produit (cases calculées): ${total_cases}`);

    // Condition limite : flux émis par la surface
    // ⚡ OPTIMISATION : Tenir compte des poids lambda pour les plages regroupées
    if (lambda_range.length !== lambda_weights.length) {
        console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE avant earth_flux: lambda_range.length (${lambda_range.length}) != lambda_weights.length (${lambda_weights.length})`);
        throw new Error(`Longueurs incompatibles avant earth_flux: lambda_range (${lambda_range.length}) != lambda_weights (${lambda_weights.length})`);
    }
    const T_surf_flux = DATA['🧮']['🧮🌡️'];
    const earth_flux = lambda_range.map((lambda, idx) => {
        if (lambda_weights[idx] === undefined) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE: lambda_weights[${idx}] manquant pour lambda_range[${idx}] = ${lambda}`);
            throw new Error(`lambda_weights[${idx}] requis`);
        }
        const B = window.planckFunction(lambda, T_surf_flux);
        return Math.PI * B * effective_delta_lambda * lambda_weights[idx];
    });

    const lambda_9um = 9e-6; // 9 microns en mètres
    const flux_below_9um = earth_flux.filter((flux, idx) => lambda_range[idx] < lambda_9um).reduce((sum, f) => sum + f, 0);
    const flux_total = earth_flux.reduce((sum, f) => sum + f, 0);

    // ⚡ OPTIMISATION : Calculer tropopause une seule fois
    const z_trop = window.calculateTropopauseHeight();
    const Gamma = -0.0065; // Gradient de température, K/m

    const T_trop = DATA['🧮']['🧮🌡️'] + Gamma * z_trop;

    // Trouver l'index de la tropopause dans z_range
    let i_trop = z_range.length; // Par défaut, pas de tropopause (tout avant)
    for (let i = 0; i < z_range.length; i++) {
        if (z_range[i] >= z_trop) {
            i_trop = i;
            break;
        }
    }

    // ⚡ OPTIMISATION : Précalculer B_λ(T_trop) pour toutes les λ (après tropopause)
    const planck_trop = lambda_range.map(lambda =>
                window.planckFunction(lambda, T_trop)
    );

    // ⚡ OPTIMISATION : Précalculer les sections efficaces (dépendent uniquement de λ)
    const cross_section_CO2 = lambda_range.map(lambda => crossSectionCO2(lambda));
    const cross_section_H2O = lambda_range.map(lambda => crossSectionH2O(lambda));
    const cross_section_CH4 = lambda_range.map(lambda => crossSectionCH4(lambda));

    // h2o_enabled et ch4_enabled sont déjà lus depuis DATA au début de la fonction

    // Log supprimé (non essentiel)

    // Vérifier que earth_flux a la bonne longueur
    if (earth_flux.length !== lambda_range.length) {
        console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE: earth_flux.length (${earth_flux.length}) != lambda_range.length (${lambda_range.length})`);
        throw new Error(`Longueurs incompatibles: earth_flux (${earth_flux.length}) != lambda_range (${lambda_range.length})`);
    }
    let flux_in = [...earth_flux];

    // 🔒 Caps numériques : tau≥0 (évite transmission=∞, em_flux=-∞) ; flux/bande borné (évite sum→∞)
    const TAU_EFF_MIN = 0;
    const TAU_EFF_MAX = 700;   // exp(-700) ≈ 0
    const MAX_FLUX_PER_BAND = 1e15;

    // 🔒 LOG : Vérifier les densités numériques à z=0 (première couche)
    const z_log = 0;
        const n_air_log = window.airNumberDensityAtZ(z_log);
    // Logs désactivés pour réduire la taille
    
    // ⚡ OPTIMISATION : Boucle avant tropopause (T varie avec z)
    for (let i = 0; i < i_trop; i++) {
        const z = z_range[i];
        const T = DATA['🧮']['🧮🌡️'] + Gamma * z; // Calcul direct, sans appel à temperature()
        // ⚡ OPTIMISATION : Calculer les densités numériques une seule fois par altitude (pas dans la boucle lambda)
        const n_air = window.airNumberDensityAtZ(z);
        const n_CO2 = n_air * DATA['🫧']['🍰🫧🏭'];
        const n_H2O = n_air * waterVaporFractionAtZ(z);
        const n_CH4 = n_air * methaneFractionAtZ(z);

        // ⚠️ IMPORTANT : Sous tropopause, on garde delta_z constant = 50m (PAS D'OPTIMISATION)
        // On utilise directement delta_z_troposphere, pas de calcul de delta_z_real
        const delta_z_real = delta_z_troposphere;

        // Vérifier que flux_in et upward_flux[i] ont la bonne longueur avant la boucle
        if (flux_in.length !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE dans boucle troposphère i=${i}: flux_in.length (${flux_in.length}) != lambda_range.length (${lambda_range.length})`);
            throw new Error(`Longueurs incompatibles dans boucle troposphère: flux_in (${flux_in.length}) != lambda_range (${lambda_range.length})`);
        }
        if (upward_flux[i].length !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE dans boucle troposphère i=${i}: upward_flux[${i}].length (${upward_flux[i].length}) != lambda_range.length (${lambda_range.length})`);
            throw new Error(`Longueurs incompatibles dans boucle troposphère: upward_flux[${i}] (${upward_flux[i].length}) != lambda_range (${lambda_range.length})`);
        }

        // Calculer pour chaque longueur d'onde
        for (let j = 0; j < lambda_range.length; j++) {
            if (j >= flux_in.length || j >= upward_flux[i].length) {
                console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE troposphère: j=${j}, flux_in.length=${flux_in.length}, upward_flux[${i}].length=${upward_flux[i].length}, lambda_range.length=${lambda_range.length}`);
                throw new Error(`Index j=${j} hors limites`);
            }

            const lambda = lambda_range[j];

            // ⚡ OPTIMISATION : Utiliser les sections efficaces précalculées
            // Absorption CO2
            const kappa_CO2 = isFinite(n_CO2) && isFinite(cross_section_CO2[j]) ? cross_section_CO2[j] * n_CO2 : 0;

            // Absorption H2O
            const kappa_H2O = isFinite(n_H2O) && isFinite(cross_section_H2O[j]) ? cross_section_H2O[j] * n_H2O : 0;

            // Absorption CH4
            const kappa_CH4 = isFinite(n_CH4) && isFinite(cross_section_CH4[j]) ? cross_section_CH4[j] * n_CH4 : 0;

            // Debug: analyser l'absorption H2O dans la zone < 9μm (une fois par itération, pour quelques longueurs d'onde clés)
            if (i === 0 && (j === 0 || j === Math.floor(lambda_range.length / 4) || j === Math.floor(lambda_range.length / 2))) {
                const lambda_um = lambda * 1e6;
            }

            // Coefficient d'absorption total (CO2 + H2O + CH4)
            const kappa = kappa_CO2 + kappa_H2O + kappa_CH4;

            const tau_raw = kappa * delta_z_real;
            optical_thickness[i][j] = (Number.isFinite(tau_raw) && tau_raw >= 0) ? Math.min(tau_raw, TAU_EFF_MAX) : 0;

            // 🔒 Corps noir = pas d'absorption (CO2=0 ET H2O réellement absent ET CH4 réellement absent)
            // Vérifier les valeurs réelles, pas seulement les boutons
            const has_absorption = (DATA['🫧']['🍰🫧🏭'] > 0) || (n_H2O > 1e-10) || (n_CH4 > 1e-10);
            if (!has_absorption) {
                // Pas d'absorption : corps noir pur, flux passe sans modification (clamp pour éviter overflow en somme)
                upward_flux[i][j] = Math.max(-MAX_FLUX_PER_BAND, Math.min(MAX_FLUX_PER_BAND, flux_in[j]));
                emitted_flux[i][j] = 0;
                absorbed_flux[i][j] = 0;
            } else {
                // Transfert radiatif dans la couche (Formule exacte avec exponentielle)
                // I_out = I_in * exp(-tau) + B(T) * (1 - exp(-tau))
                const tau = Math.max(TAU_EFF_MIN, Math.min(TAU_EFF_MAX, optical_thickness[i][j]));
                const transmission = Math.exp(-tau);
                const emissivity = 1 - transmission; // Kirchhoff: epsilon = 1 - transmission, ∈ [0,1]

                // 1. Flux absorbé
                const abs_flux = flux_in[j] * (1 - transmission);

                // 2. Flux émis
                // F_émis = (1 - exp(-tau)) × π × B_λ(T_couche) × Δλ × poids (Δλ = pas réel de la grille)
                const em_flux = emissivity * Math.PI * window.planckFunction(lambda, T) * effective_delta_lambda * lambda_weights[j];

                // 3. Flux sortant + clamp pour éviter overflow de la somme totale
                let out = flux_in[j] * transmission + em_flux;
                if (!Number.isFinite(out)) out = flux_in[j];
                upward_flux[i][j] = Math.max(-MAX_FLUX_PER_BAND, Math.min(MAX_FLUX_PER_BAND, out));

                // Stocker les valeurs pour la visualisation
                emitted_flux[i][j] = em_flux;
                absorbed_flux[i][j] = abs_flux;

                // Attribution EDS par gaz (tau_i/tau × flux absorbé)
                const tau_CO2 = Math.max(0, kappa_CO2 * delta_z_real);
                const tau_H2O = Math.max(0, kappa_H2O * delta_z_real);
                const tau_CH4 = Math.max(0, kappa_CH4 * delta_z_real);
                const tau_tot = tau_CO2 + tau_H2O + tau_CH4;
                if (tau_tot > 1e-20) {
                    sum_blocked_CO2 += (tau_CO2 / tau_tot) * abs_flux;
                    sum_blocked_H2O += (tau_H2O / tau_tot) * abs_flux;
                    sum_blocked_CH4 += (tau_CH4 / tau_tot) * abs_flux;
                }
            }

            flux_in[j] = upward_flux[i][j];
        }
    }

    // ⚡ OPTIMISATION : Boucle après tropopause (T constante = T_trop, B_λ précalculé)
    for (let i = i_trop; i < z_range.length; i++) {
        const z = z_range[i];
        // ⚡ OPTIMISATION : Calculer les densités numériques une seule fois par altitude (pas dans la boucle lambda)
        const n_air = window.airNumberDensityAtZ(z);
        const n_CO2 = n_air * DATA['🫧']['🍰🫧🏭'];
        const n_H2O = n_air * waterVaporFractionAtZ(z);
        const n_CH4 = n_air * methaneFractionAtZ(z);

        // ⚡ OPTIMISATION : Calculer delta_z réel pour cette couche (précision grossière au-dessus)
        const delta_z_real = i > i_trop ? z - z_range[i - 1] : delta_z_stratosphere;

        // Vérifier que flux_in et upward_flux[i] ont la bonne longueur avant la boucle
        if (flux_in.length !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE dans boucle stratosphère i=${i}: flux_in.length (${flux_in.length}) != lambda_range.length (${lambda_range.length})`);
            throw new Error(`Longueurs incompatibles dans boucle stratosphère: flux_in (${flux_in.length}) != lambda_range (${lambda_range.length})`);
        }
        if (upward_flux[i].length !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE dans boucle stratosphère i=${i}: upward_flux[${i}].length (${upward_flux[i].length}) != lambda_range.length (${lambda_range.length})`);
            throw new Error(`Longueurs incompatibles dans boucle stratosphère: upward_flux[${i}] (${upward_flux[i].length}) != lambda_range (${lambda_range.length})`);
        }

        // Calculer pour chaque longueur d'onde
        for (let j = 0; j < lambda_range.length; j++) {
            if (j >= flux_in.length || j >= upward_flux[i].length) {
                console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE stratosphère: j=${j}, flux_in.length=${flux_in.length}, upward_flux[${i}].length=${upward_flux[i].length}, lambda_range.length=${lambda_range.length}`);
                throw new Error(`Index j=${j} hors limites`);
            }

            const lambda = lambda_range[j];

            // ⚡ OPTIMISATION : Utiliser les sections efficaces précalculées
            // Absorption CO2
            const kappa_CO2 = isFinite(n_CO2) && isFinite(cross_section_CO2[j]) ? cross_section_CO2[j] * n_CO2 : 0;

            // Absorption H2O
            const kappa_H2O = isFinite(n_H2O) && isFinite(cross_section_H2O[j]) ? cross_section_H2O[j] * n_H2O : 0;

            // Absorption CH4
            const kappa_CH4 = isFinite(n_CH4) && isFinite(cross_section_CH4[j]) ? cross_section_CH4[j] * n_CH4 : 0;

            // Coefficient d'absorption total (CO2 + H2O + CH4)
            const kappa = kappa_CO2 + kappa_H2O + kappa_CH4;

            const tau_raw_s = kappa * delta_z_real;
            optical_thickness[i][j] = (Number.isFinite(tau_raw_s) && tau_raw_s >= 0) ? Math.min(tau_raw_s, TAU_EFF_MAX) : 0;

            // 🔒 Corps noir = pas d'absorption (CO2=0 ET H2O réellement absent ET CH4 réellement absent)
            // Vérifier les valeurs réelles, pas seulement les boutons
            const has_absorption = (DATA['🫧']['🍰🫧🏭'] > 0) || (n_H2O > 1e-10) || (n_CH4 > 1e-10);
            if (!has_absorption) {
                // Pas d'absorption : corps noir pur, flux passe sans modification (clamp pour éviter overflow en somme)
                upward_flux[i][j] = Math.max(-MAX_FLUX_PER_BAND, Math.min(MAX_FLUX_PER_BAND, flux_in[j]));
                emitted_flux[i][j] = 0;
                absorbed_flux[i][j] = 0;
            } else {
                // Transfert radiatif dans la couche (Formule exacte avec exponentielle)
                const tau = Math.max(TAU_EFF_MIN, Math.min(TAU_EFF_MAX, optical_thickness[i][j]));
                const transmission = Math.exp(-tau);
                const emissivity = 1 - transmission;

                // 1. Flux absorbé
                const abs_flux = flux_in[j] * (1 - transmission);

                // 2. Flux émis
                // ⚡ OPTIMISATION : Utiliser B_λ(T_trop) précalculé ; Δλ = pas réel de la grille
                const em_flux = emissivity * Math.PI * planck_trop[j] * effective_delta_lambda * lambda_weights[j];

                // 3. Flux sortant + clamp pour éviter overflow de la somme totale
                let out_s = flux_in[j] * transmission + em_flux;
                if (!Number.isFinite(out_s)) out_s = flux_in[j];
                upward_flux[i][j] = Math.max(-MAX_FLUX_PER_BAND, Math.min(MAX_FLUX_PER_BAND, out_s));

                // Stocker les valeurs pour la visualisation
                emitted_flux[i][j] = em_flux;
                absorbed_flux[i][j] = abs_flux;

                // Attribution EDS par gaz (tau_i/tau × flux absorbé)
                const tau_CO2_s = Math.max(0, kappa_CO2 * delta_z_real);
                const tau_H2O_s = Math.max(0, kappa_H2O * delta_z_real);
                const tau_CH4_s = Math.max(0, kappa_CH4 * delta_z_real);
                const tau_tot_s = tau_CO2_s + tau_H2O_s + tau_CH4_s;
                if (tau_tot_s > 1e-20) {
                    sum_blocked_CO2 += (tau_CO2_s / tau_tot_s) * abs_flux;
                    sum_blocked_H2O += (tau_H2O_s / tau_tot_s) * abs_flux;
                    sum_blocked_CH4 += (tau_CH4_s / tau_tot_s) * abs_flux;
                }
            }

            flux_in[j] = upward_flux[i][j];
        }
    }

    // Log supprimé (non essentiel)

    // Calculer le flux total au sommet
    // Vérifier que upward_flux n'est pas vide avant d'appeler reduce
    // Vérifier la longueur de upward_flux avant de retourner
    if (upward_flux.length > 0) {
        const topFluxLength = upward_flux[upward_flux.length - 1].length;
        if (topFluxLength !== lambda_range.length) {
            console.error(`[calculateFluxForT0] ❌ ERREUR CRITIQUE FINALE: upward_flux[top].length (${topFluxLength}) != lambda_range.length (${lambda_range.length})`);
        }
    }
    
    // 🔒 CRASH si upward_flux invalide (pas de fallback)
    if (!upward_flux || upward_flux.length === 0 || !upward_flux[upward_flux.length - 1]) {
        throw new Error('[calculateFluxForT0] upward_flux est vide ou invalide');
    }
    const total_flux = upward_flux[upward_flux.length - 1].reduce((sum, val) => sum + val, 0);
    const earth_flux_total = earth_flux.reduce((sum, val) => sum + val, 0);
    const EDS = earth_flux_total - total_flux;
    const sum_blocked = sum_blocked_CO2 + sum_blocked_H2O + sum_blocked_CH4;
    // pct ∈ [0, 1] (répartition absorption brute par gaz ; pas contribution nette EDS)
    const pct = (v) => (sum_blocked > 1e-20 && Number.isFinite(v)) ? v / sum_blocked : 0;
    const eds_breakdown = {
        EDS_Wm2: EDS,
        CO2: { pct: pct(sum_blocked_CO2) },
        H2O: { pct: pct(sum_blocked_H2O) },
        CH4: { pct: pct(sum_blocked_CH4) }
    };

    // Log du delta (flux sortant - flux entrant initial)
    const delta_spectral = total_flux - earth_flux_total;
    // Log désactivé pour réduire la taille des logs
    // console.log(`📊 [calculateFluxForT0@calculations.js] Résultat calcul spectral:`);
    // console.log(`   Flux entrant initial (surface): ${earth_flux_total.toFixed(2)} W/m²`);
    // console.log(`   Flux sortant final (sommet atm): ${total_flux.toFixed(2)} W/m²`);
    // console.log(`   Delta (sortant - entrant): ${delta_spectral.toFixed(2)} W/m²`);

    // Debug: analyser le flux < 9μm au sommet de l'atmosphère
    const top_flux = upward_flux[upward_flux.length - 1];
    const lambda_9um_top = 9e-6;
    const top_flux_below_9um = top_flux.filter((flux, idx) => lambda_range[idx] < lambda_9um_top).reduce((sum, f) => sum + f, 0);
    const top_flux_total = top_flux.reduce((sum, f) => sum + f, 0);

    // 🔒 Stocker les résultats dans DATA (crash si DATA['📊'] n'existe pas)
    DATA['📊'].total_flux = total_flux;
    DATA['📊'].eds_breakdown = eds_breakdown;
    DATA['📊'].lambda_range = lambda_range;
    DATA['📊'].lambda_weights = lambda_weights;
    DATA['📊'].z_range = z_range;
    DATA['📊'].upward_flux = upward_flux;
    DATA['📊'].optical_thickness = optical_thickness;
    DATA['📊'].emitted_flux = emitted_flux;
    DATA['📊'].absorbed_flux = absorbed_flux;
    DATA['📊'].earth_flux = earth_flux;
    
    // Mettre à jour les résolutions dans DATA['🧮'] (crash si DATA['🧮'] n'existe pas)
    DATA['🧮']['🔬🌈'] = lambda_range.length;
    DATA['🧮']['🔬🫧'] = z_range.length;

    return true; // Succès
}

function getSpectralResultFromDATA() {
    const DATA = window.DATA;
    return {
        total_flux: DATA['📊'].total_flux,
        lambda_range: DATA['📊'].lambda_range,
        lambda_weights: DATA['📊'].lambda_weights,
        z_range: DATA['📊'].z_range,
        upward_flux: DATA['📊'].upward_flux,
        optical_thickness: DATA['📊'].optical_thickness,
        emitted_flux: DATA['📊'].emitted_flux,
        absorbed_flux: DATA['📊'].absorbed_flux,
        earth_flux: DATA['📊'].earth_flux
    };
}

window.getSpectralResultFromDATA = getSpectralResultFromDATA;

// ============================================================================
// FONCTION : CALCULER LES CAPACITÉS RADIATIVE IR (🍰🫧❀🌈)
// ============================================================================
// Calcule les capacités radiative IR normalisées pour H2O, CO2, CH4
// depuis les données spectrales stockées dans DATA['📊']
//
// FORMULE :
// 🍰🫧❀🌈 = ⟨ 1 - e^{-τ_❀(λ)} ⟩_{IR}
//          = ∫_{λ∈IR} ∫_{z=0}^{z_max} (1 - e^{-τ_❀(λ,z)}) · w(λ) dz dλ
//            ─────────────────────────────────────────────────────────────
//            ∫_{λ∈IR} w(λ) dλ
//
// où :
//   τ_❀(λ,z) = ∫_{z'=0}^{z} κ_❀(λ,z') dz' (épaisseur optique intégrée)
//   κ_❀(λ,z) = σ_❀(λ) × n_❀(z) (coefficient d'absorption)
//   w(λ) = poids radiatif (Planck à T_surface)
//
// Résultat normalisé ∈ [0,1], valable à toutes les époques
function calculateRadiativeCapacities() {
    const DATA = window.DATA;
    const CONST = window.CONST;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    
    // 🔒 Initialiser toutes les capacités radiatives à 0
    DATA['🫧']['🍰🫧🏭🌈'] = 0;
    DATA['🫧']['🍰🫧💧🌈'] = 0;
    DATA['🫧']['🍰🫧⛽🌈'] = 0;
    DATA['🫧']['🍰🫧📿🌈'] = 0;
    
    // 🔒 CRASH si données manquantes (pas de fallback) - utiliser DATA directement
    // 🔒 FILTRER sur l'IR uniquement (λ > 0.7 μm = 0.7e-6 m)
    // L'IR commence à ~0.7-1 μm, on prend 0.7 μm comme limite
    const lambda_IR_min = 0.7e-6; // 0.7 μm en mètres
    const lambda_IR_indices = [];
    for (let j = 0; j < DATA['📊'].lambda_range.length; j++) {
        if (DATA['📊'].lambda_range[j] >= lambda_IR_min) {
            lambda_IR_indices.push(j);
        }
    }
    
    // Calculer le poids radiatif (Planck à T_surface) pour chaque longueur d'onde IR
    const lambda_weights_IR = lambda_IR_indices.map(idx => {
        return planckFunction(DATA['📊'].lambda_range[idx], DATA['🧮']['🧮🌡️']);
    });
    
    // Intégrale du poids radiatif sur IR (pour normalisation)
    const delta_lambda = DATA['📊'].lambda_range.length > 1 ? (DATA['📊'].lambda_range[DATA['📊'].lambda_range.length - 1] - DATA['📊'].lambda_range[0]) / (DATA['📊'].lambda_range.length - 1) : 1e-6;
    const weight_integral = lambda_weights_IR.reduce((sum, w) => sum + w, 0) * delta_lambda;
    
    // Précalculer les sections efficaces pour toutes les longueurs d'onde (calcul répétitif → garder const)
    const cross_section_CO2 = DATA['📊'].lambda_range.map(lambda => crossSectionCO2(lambda));
    const cross_section_H2O = DATA['📊'].lambda_range.map(lambda => crossSectionH2O(lambda));
    const cross_section_CH4 = DATA['📊'].lambda_range.map(lambda => crossSectionCH4(lambda));
    
    // Initialiser les intégrales pondérées
    let integral_H2O = 0;
    let integral_CO2 = 0;
    let integral_CH4 = 0;
    
    // Calculer la densité numérique de l'air à chaque altitude
    const Gamma = -0.0065; // Gradient de température, K/m
    const airNumberDensity = (z) => {
        const T = DATA['🧮']['🧮🌡️'] + Gamma * z;
        const P = DATA['🫧']['🎈'] * CONST.STANDARD_ATMOSPHERE_PA * Math.exp(-z / (CONST.R_GAS * T / (EPOCH['🍎'] * CONST.molar_mass_air_ref)));
        return P / (CONST.BOLTZMANN_KB * T);
    };
    
    // Pour chaque longueur d'onde IR uniquement
    for (let idx = 0; idx < lambda_IR_indices.length; idx++) {
        const j = lambda_IR_indices[idx];
        const w_lambda = lambda_weights_IR[idx];
        
        // Initialiser les épaisseurs optiques intégrées pour cette longueur d'onde
        let tau_H2O_lambda = 0;
        let tau_CO2_lambda = 0;
        let tau_CH4_lambda = 0;
        
        // Intégrer sur toutes les couches pour cette longueur d'onde
        for (let i = 0; i < DATA['📊'].z_range.length - 1; i++) {
            const z = DATA['📊'].z_range[i];
            const delta_z = DATA['📊'].z_range[i + 1] - DATA['📊'].z_range[i];
            
            // Densités numériques à cette altitude
            const n_air = window.airNumberDensityAtZ(z);
            const n_CO2 = n_air * DATA['🫧']['🍰🫧🏭'];
            const n_H2O = n_air * waterVaporFractionAtZ(z);
            const n_CH4 = n_air * methaneFractionAtZ(z);
            
            // Coefficients d'absorption pour cette longueur d'onde et cette altitude
            const kappa_CO2 = isFinite(n_CO2) && isFinite(cross_section_CO2[j]) ? cross_section_CO2[j] * n_CO2 : 0;
            const kappa_H2O = isFinite(n_H2O) && isFinite(cross_section_H2O[j]) ? cross_section_H2O[j] * n_H2O : 0;
            const kappa_CH4 = isFinite(n_CH4) && isFinite(cross_section_CH4[j]) ? cross_section_CH4[j] * n_CH4 : 0;
            
            // Épaisseur optique pour cette couche
            const delta_tau_CO2 = kappa_CO2 * delta_z;
            const delta_tau_H2O = kappa_H2O * delta_z;
            const delta_tau_CH4 = kappa_CH4 * delta_z;
            
            // Accumuler les épaisseurs optiques intégrées
            tau_CO2_lambda += delta_tau_CO2;
            tau_H2O_lambda += delta_tau_H2O;
            tau_CH4_lambda += delta_tau_CH4;
        }
        
        // Calculer (1 - exp(-tau)) pour chaque gaz
        const transmittance_CO2 = 1 - Math.exp(-tau_CO2_lambda);
        const transmittance_H2O = 1 - Math.exp(-tau_H2O_lambda);
        const transmittance_CH4 = 1 - Math.exp(-tau_CH4_lambda);
        
        // Accumuler les intégrales pondérées
        integral_CO2 += transmittance_CO2 * w_lambda * delta_lambda;
        integral_H2O += transmittance_H2O * w_lambda * delta_lambda;
        integral_CH4 += transmittance_CH4 * w_lambda * delta_lambda;
    }
    
    // Normaliser par l'intégrale du poids radiatif
    // 🔒 Si weight_integral = 0 (corps noir, pas d'IR), les capacités restent à 0
    if (weight_integral > 0) {
        DATA['🫧']['🍰🫧🏭🌈'] = Math.max(0, Math.min(1, integral_CO2 / weight_integral));
        DATA['🫧']['🍰🫧💧🌈'] = Math.max(0, Math.min(1, integral_H2O / weight_integral));
        DATA['🫧']['🍰🫧⛽🌈'] = Math.max(0, Math.min(1, integral_CH4 / weight_integral));
        DATA['🫧']['🍰🫧📿🌈'] = DATA['🫧']['🍰🫧🏭🌈'] + DATA['🫧']['🍰🫧💧🌈'] + DATA['🫧']['🍰🫧⛽🌈'];
    }
    // Sinon, les valeurs restent à 0 (déjà initialisées)
    
    return true;
}

window.calculateRadiativeCapacities = calculateRadiativeCapacities;

// Fonction helper pour afficher une courbe temporaire pendant la dichotomie
function displayDichotomyStep(CO2_fraction, T0_test, result, iteration, isInitial = false, options = {}) {
    const DATA = window.DATA;
    const CONST = window.CONST;
    // Récupérer H2O et CH4 pour le log
    // 🔒 CORRECTION : Utiliser DATA['💧']['🍰🫧💧'] comme source unique de vérité
    const h2o_total = DATA['💧']['🍰🫧💧'] * 100; // Fraction → %
    const ch4_ppm = (options && options.CH4_fraction) ? options.CH4_fraction * 1e6 : 0;
    
    // Log supprimé : affichage uniquement du mode (dichotomie/exponentielle) dans la boucle principale
    // if (iteration === 0 || isInitial) {
    //     console.log(`📛 [displayDichotomyStep@calculations.js] iter=${iteration} T0=${T0_test.toFixed(2)}K 🏭=${(CO2_fraction * 1e6).toFixed(0)}ppm 💧=${h2o_total.toFixed(1)}% ⛽=${ch4_ppm.toFixed(0)}ppm`);
    // }
    if (typeof window === 'undefined') return;

    // Créer un objet plotData temporaire pour l'affichage
    // ✅ SCIENTIFIQUEMENT CERTAIN : Loi de Stefan-Boltzmann T = (F/σ)^(1/4)
    // - Cette loi décrit la température effective d'un corps noir en équilibre radiatif
    // - Dérivée de la loi de Planck, elle est exacte pour un corps noir
    // - La constante σ = 5.67×10⁻⁸ W/(m²·K⁴) est une constante fondamentale
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;

    // ⚠️ DIFFÉRENCE ENTRE effective_temperature ET temp_surface :
    // - effective_temperature (temp_eff) = (flux_total / σ)^0.25
    //   → Température du corps noir équivalent qui émettrait le même flux total vers l'espace
    //   → Le flux émis vers l'espace vient de différentes altitudes (plus froid en altitude)
    // - temp_surface (T0_test) = Température réelle au sol calculée par dichotomie
    //   → Équilibre le bilan énergétique : flux solaire absorbé = flux terrestre émis
    //   → Dans une atmosphère avec effet de serre, la surface est plus chaude que la température effective
    //   → C'est l'effet de serre : la surface est plus chaude que ce que le flux émis vers l'espace suggère
    //   → La différence (temp_surface - effective_temperature) mesure l'intensité de l'effet de serre
    // 
    const h2o_enabled = DATA['🔘']['🔘💧📛'];
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const geo_flux = EPOCH['🧲🌕'];
    const ch4_enabled = DATA['🔘']['🔘⛽📛'];
    const CH4_fraction = DATA['🫧']['🍰🫧⛽'];

    // ⚠️ CAS PARTICULIER : Corps noir (pas d'atmosphère, albedo = 0)
    //   → Pas d'effet de serre, donc temp_surface = effective_temperature
    //   → Le flux émis par la surface passe directement vers l'espace sans absorption
    //   → On utilise temp_surface directement pour éviter les erreurs numériques
    const isBlackBody = (CO2_fraction === 0 || CO2_fraction === null) && !h2o_enabled && (!ch4_enabled || !CH4_fraction);
    const temp_eff = isBlackBody
        ? T0_test  // Corps noir : utiliser directement temp_surface (formule analytique exacte)
        : Math.pow(result.total_flux / STEFAN_BOLTZMANN, 0.25);  // Avec atmosphère : calculer depuis flux_total
    // Calculer la température terrestre en °C à partir de T0_test (température au sol en K)
    const temp_surface_c = T0_test - CONST.KELVIN_TO_CELSIUS;
    const temp_eff_0 = 255.0; // Température effective sans CO2 (référence 255K)
    const albedo = result.albedo;
    const cloud_coverage = result.cloud_coverage;

    // Calculer les forçages radiatifs séparés
    const forcing_CO2 = window.calculateCO2Forcing(CO2_fraction);
    const forcing_H2O = window.calculateH2OForcing(h2o_enabled, cloud_coverage);
    const forcing_Albedo = (albedo !== null) ? window.calculateAlbedoForcing(albedo) : 0;

    // Forçage total
    const forcing_total = forcing_CO2 + forcing_H2O + forcing_Albedo;

    // Calculer ΔT° = différence de température par rapport à la référence (255K sans CO2)
    // ΔT° = T° actuelle - T° référence (255K)
    // C'est la différence directe de température, plus claire et compréhensible
    const TEMP_REF_NO_CO2 = 255.0; // Température effective sans CO2 (référence)
    const delta_temp = T0_test - TEMP_REF_NO_CO2;

    // Calculer ΔT° par rapport à la température optimale habitable (15°C = 288K)
    // ΔT° habitable = T° actuelle - T° optimale habitable
    const delta_temp_habitable = T0_test - TEMP_HABITABLE_OPTIMAL;

    // Déterminer si la vie est possible (température dans la zone habitable)
    const life_viable = T0_test >= TEMP_HABITABLE_MIN && T0_test <= TEMP_HABITABLE_MAX;

    // Mettre à jour les informations à chaque étape
    window.updateDisplay({
            state: window.currentState, // Plantera si n'existe pas
            co2_ppm: CO2_fraction * 1e6,
            temp_surface: T0_test,
            temp_surface_c: temp_surface_c,
            temp_eff: temp_eff,
            temp_eff_c: temp_eff - CONST.KELVIN_TO_CELSIUS,
            delta_temp: delta_temp,
            delta_temp_habitable: delta_temp_habitable,
            life_viable: life_viable,
            forcing: forcing_total,
            forcing_CO2: forcing_CO2,
            forcing_H2O: forcing_H2O,
            forcing_Albedo: forcing_Albedo,
            albedo: albedo,
            cloud_coverage: cloud_coverage
        });

    // Mettre à jour les labels du flux pendant le calcul
    window.updateFluxLabels({
            T0: T0_test,
            temp_surface: T0_test,
            total_flux: result.total_flux,
            albedo: albedo,
            cloud_coverage: cloud_coverage,
            co2_ppm: CO2_fraction * 1e6,
            ch4_ppm: ch4_ppm
        });

    // 🔒 Mettre à jour la couleur avec la température actuelle (à chaque étape de dichotomie)
    const color_current = window.tempSurfaceToColor(temp_surface_c);
    window.updateBlackBodyColor(color_current);
    const legendEquilibre = document.querySelector('.legend-equilibre');
    if (legendEquilibre) legendEquilibre.style.color = color_current;

    const tempPlotData = {
        lambda_range: result.lambda_range,
        lambda_weights: result.lambda_weights, // ⚡ Nécessaire pour normalisation correcte du flux
        z_range: result.z_range,
        current: {
            upward_flux: result.upward_flux,
            effective_temperature: temp_eff,
            emitted_flux: result.emitted_flux,
            absorbed_flux: result.absorbed_flux,
            earth_flux: result.earth_flux,
            lambda_range: result.lambda_range, // Nécessaire pour updateSpectralVisualization
            lambda_weights: result.lambda_weights, // ⚡ Nécessaire pour updateSpectralVisualization
            z_range: result.z_range, // Nécessaire pour updateSpectralVisualization
            albedo: albedo,
            cloud_coverage: cloud_coverage
        },
        co2_ppm: CO2_fraction * 1e6,
        temp_surface: T0_test, // Température de surface réelle (K) pour cohérence avec affichage
        temp_surface_c: temp_surface_c // Température de surface en °C pour mise à jour de la couleur en temps réel
    };

    // Mettre à jour le graphique
    window.updatePlot(tempPlotData);

    // Mettre à jour la visualisation spectrale
    setTimeout(() => {
        const canvas = document.getElementById('spectral-visualization');
        if (canvas) {
            canvas.style.setProperty('display', 'block', 'important');
            canvas.style.setProperty('visibility', 'visible', 'important');
            canvas.style.setProperty('opacity', '1', 'important');
            canvas.style.setProperty('z-index', '0', 'important');
            canvas.style.setProperty('position', 'absolute', 'important');
        }
        if (tempPlotData.current) window.updateSpectralVisualization(tempPlotData.current);
    }, 100);

    // Mettre à jour le statut
    if (typeof document !== 'undefined') {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            if (isInitial) {
                statusEl.textContent = `[Dichotomie] Étape initiale: T0 = ${T0_test.toFixed(2)} K, flux = ${result.total_flux.toFixed(2)} W/m²`;
            } else {
                statusEl.textContent = `[Dichotomie] Itération ${iteration}: T0 = ${T0_test.toFixed(2)} K, flux = ${result.total_flux.toFixed(2)} W/m²`;
            }
        }
    }
}

// Fonction helper pour récupérer l'état du bouton "anim"
// Retourne un seul boolean depuis la variable globale unique (seule référence)
// Fonction supprimée : utiliser directement window.enabledStates[window.ENABLED_STATES.ANIMATION.key]

function simulateRadiativeTransfer() {
    const DATA = window.DATA;
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    
    const CO2_fraction = DATA['🫧']['🍰🫧🏭'];
    const CH4_fraction = DATA['🫧']['🍰🫧⛽'];
    
    // 🔒 Vérifier que window.plotData existe et initialiser temp_surface si nécessaire
    if (typeof window.plotData === 'undefined') {
        window.plotData = { temp_surface: 0 };
    }
    if (typeof window.plotData.temp_surface === 'undefined') {
        window.plotData.temp_surface = 0;
    }
    
    const prev_T0 = window.plotData.temp_surface;
    
    const t0_config = EPOCH['🌡️🧮'];
    const animEnabled = DATA['🔘']['🔘🎬'];
    const baseTemp = animEnabled ? (prev_T0 > 0 ? prev_T0 : t0_config) : t0_config;
    
    const meteoriteCount = DATA['📜']['📿☄️'];
    const ticTime = DATA['📜']['📿💫'];
    const deltaTicTime_per_tic = DATA['📜']['🔺🌡️💫'];
    
    const adjustment = deltaTicTime_per_tic * ticTime;
    const T0_initial = baseTemp + adjustment;

    const _fmt = (v) => (v == null) ? '?' : (typeof v === 'number' && (Math.abs(v) >= 1e3 || (Math.abs(v) < 0.001 && v !== 0)) ? v.toExponential(2) : Number(v).toFixed(4));
    console.log(`[${animEnabled ? 'anim' : 'sans anim'}] simulateRadiativeTransfer: prev_T0=${prev_T0.toFixed(1)}K t0_config=${t0_config.toFixed(1)}K baseTemp=${baseTemp.toFixed(1)}K T0_initial=${T0_initial.toFixed(1)}K`);
    console.log(`[${animEnabled ? 'anim' : 'sans anim'}] simulateRadiativeTransfer: 🧪=${_fmt(DATA['🫧']['🧪'])} 🍰🫧💧=${_fmt(DATA['💧'] && DATA['💧']['🍰🫧💧'])} 🍰🫧🏭=${_fmt(DATA['🫧']['🍰🫧🏭'])} 📏🫧🛩=${_fmt(DATA['🫧']['📏🫧🛩'])} 🍰🪩📿=${_fmt(DATA['🪩'] && DATA['🪩']['🍰🪩📿'])}`);

    if (T0_initial <= 0) {
        throw new Error(`T0_initial invalide: ${T0_initial}`);
    }
    
    const CO2_ppm = CO2_fraction * 1e6;
    const CH4_ppm = CH4_fraction * 1e6;
    const H2O_percent = DATA['💧']['🍰🧮🌧'] * 100;
    

    const lambda_min = 0.1e-6;
    const lambda_max = 100e-6;
    // 🔒 Utiliser le même pas constant que dans calculateFluxForT0() pour cohérence
    // DATA['🧮']['🔬🌈'] contient le nombre d'éléments (length), pas le pas
    // Le pas est toujours 0.1e-6 (comme dans calculateFluxForT0 ligne 97)
    const delta_lambda = 0.1e-6;
    
    // 🔒 SUPPRIMÉ : logCalculationPhase inutile
    
    // 🔒 Anticiper la couleur avec T0_initial dès le début
    
        const tempC_anticipated = T0_initial - CONST.KELVIN_TO_CELSIUS;
        const color_anticipated = window.tempSurfaceToColor(tempC_anticipated);
        window.updateBlackBodyColor(color_anticipated);
        
        // Mettre à jour legend-equilibre avec la couleur anticipée
        const legendEquilibre = document.querySelector('.legend-equilibre'); // Plantera si n'existe pas
        if (legendEquilibre) {
            legendEquilibre.style.color = color_anticipated;
    }

    

    // Dichotomie pour trouver T0 qui donne flux_total = flux_solaire_absorbé
    // 🔒 Ajuster les bornes selon la température initiale (peut être très élevée pour Hadéen)
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const cellH2O_check = document.getElementById('cell-h2o'); // Plantera si n'existe pas
    const h2o_enabled_check = cellH2O_check && cellH2O_check.classList.contains('checked');

    // Si T0_initial est très élevé (ex: Hadéen post-impact), utiliser un intervalle plus large
    // 🔒 OPTIMISATION : Réduire l'intervalle si on part d'une T0 précédente connue (continuité)
    const prev_T0_for_range = window.plotData.temp_surface; // Plantera si n'existe pas
    const range_factor = (prev_T0_for_range !== null && prev_T0_for_range > 0) ? 0.5 : 1.0; // Réduire intervalle de 50% si continuité
    const INITIAL_RANGE = ((T0_initial > 1000) ? 200 : 50) * range_factor; // Intervalle adaptatif

    let T0_min = Math.max(200, T0_initial - INITIAL_RANGE); // Borne inférieure, minimum 200K
    // Borne supérieure : permettre jusqu'à 3000K pour Hadéen (juste après impact)
    const T0_max_limit = (T0_initial > 1000) ? 3000 : (h2o_enabled_check ? 400 : 350);
    let T0_max = Math.min(T0_max_limit, T0_initial + INITIAL_RANGE);
    let T0 = T0_initial;
    
    // 🔒 Calculer la tolérance depuis la précision de convergence (variable globale unique)
    // 🔒 IMPORTANT : tolerance (convergence) ≠ precision (échantillonnage atmosphère)
    // - tolerance : seuil de convergence pour delta_equilibre (flux_sortant - flux_entrant) en W/m²
    // - precision : taille des échantillons d'atmosphère (delta_z_stratosphere) contrôlée par precisionFactor (FPS)
    // 
    // 🔒 CALCUL DE TOLÉRANCE : tolerance = 4 * σ * T³ * precision_K
    // Explication :
    // - F = σT⁴ (loi de Stefan-Boltzmann, F = flux en W/m², T = température en K)
    // - dF/dT = 4σT³ (dérivée)
    // - Donc ΔF = 4σT³ × ΔT
    // - Pour une précision de precision_K en K, la tolérance en W/m² est : tolerance = 4σT³ × precision_K
    // Exemples :
    //   - À 255K avec precision_K=0.1K → tolerance = 4×5.67e-8×255³×0.1 ≈ 0.38 W/m²
    //   - À 255K avec precision_K=1K → tolerance = 4×5.67e-8×255³×1 ≈ 3.8 W/m²
    //   - À 255K avec precision_K=10K → tolerance = 4×5.67e-8×255³×10 ≈ 38 W/m²
    // Note : 1 K = 1 °C (même delta, juste décalage de 273.15), donc 0.1° = 0.1 K
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
    
    const precision_K = DATA['🧮']['🧲🔬'];
    
    // Convertir la précision en K en tolérance de base en W/m² : ΔF = 4 * σ * T³ * ΔT
    // La tolérance sera recalculée à chaque itération avec T0_current (car la sensibilité change avec T)
    // Note : La précision est déjà initialisée dans setEpoch (log 🕰 🛠 [setEpoch@main.js] 🎚=0.1° 🔘 selected)
    // Note : La tolérance sera recalculée à chaque itération avec T0_current pour une précision correcte
    const tolerance_base = 4 * STEFAN_BOLTZMANN * Math.pow(T0_initial, 3) * precision_K;
    
    const max_iterations = 20;
    let iteration = 0;
    let result = null;

    // 🔒 GESTION DE L'OVERLAY DE CALCUL
    // Afficher l'overlay au début du calcul (si mode asynchrone)
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.setTimeout) {
        const overlay = document.getElementById('calculation-overlay');
        if (overlay) {
            overlay.style.display = 'flex'; // Afficher (flex pour centrer)
            // Reset des points
            const dots = document.getElementById('calculation-dots');
            if (dots) dots.textContent = '';
        }
    }

    // Vérifier si on doit afficher les étapes (seulement pour les calculs interactifs)
    // 🔒 Le bouton "anim" contrôle directement window.showDichotomySteps
    const shouldDisplaySteps = typeof window !== 'undefined' && window.showDichotomySteps;

    if (shouldDisplaySteps) {
        // Créer un lambda_range temporaire pour afficher les courbes Planck avant la dichotomie
        // (utiliser les variables déjà déclarées ci-dessus)
        const temp_lambda_range = [];
        for (let lambda = lambda_min; lambda < lambda_max; lambda += delta_lambda) {
            temp_lambda_range.push(lambda);
        }

        // Afficher les courbes Planck de référence avant la dichotomie
        if (typeof window !== 'undefined' && window.updatePlot && typeof window.PLANCK_TEMPERATURES !== 'undefined') {
            // Créer lambda_weights pour temp_lambda_range (poids unitaire pour pas constant)
            const temp_lambda_weights = temp_lambda_range.map(() => 1.0);
            
            // Créer un plotData temporaire avec seulement les courbes Planck
            const tempPlotData = {
                lambda_range: temp_lambda_range,
                lambda_weights: temp_lambda_weights, // ⚡ Nécessaire pour updatePlot
                current: null,
                co2_ppm: CO2_fraction * 1e6
            };
            window.updatePlot(tempPlotData);

            // S'assurer que la visualisation spectrale reste visible même sans nouvelles données
            setTimeout(() => {
                const canvas = document.getElementById('spectral-visualization');
                if (canvas) {
                    canvas.style.setProperty('display', 'block', 'important');
                    canvas.style.setProperty('visibility', 'visible', 'important');
                    canvas.style.setProperty('opacity', '1', 'important');
                    canvas.style.setProperty('z-index', '1', 'important');
                    canvas.style.setProperty('position', 'absolute', 'important');
                }
            }, 100);
        }
    } else {
        // Pour les calculs de référence, pas d'affichage graphique
    }
    
    // 🔒 IMPORTANT : Mettre à jour DATA['🧮']['🧮🌡️'] AVANT le calcul initial aussi !
    DATA['🧮']['🧮🌡️'] = T0_initial;
    DATA['🧮']['🧮⚧'] = 'Search'; // Éviter Init (cycle eau complet) ; recalcul vapeur à chaque T
    // 🔒 Résolution spectrale uniforme (test) ; init → doit exister
    DATA['🧮']['🔬🌈'] = window.CONFIG_COMPUTE.maxSpectralBinsConvergence;
    window.calculateH2OParameters();
    // Calculer la courbe initiale
    const calc_success_init = calculateFluxForT0();
    if (!calc_success_init) {
        console.error('[performDichotomy] calculateFluxForT0() initial a échoué');
        return;
    }
    result = getSpectralResultFromDATA();
    if (!result) {
        console.error('[performDichotomy] Impossible de récupérer les résultats depuis DATA');
        return;
    }
    

    // Afficher la courbe initiale (avant dichotomie) seulement si demandé
    // 🔒 Réutiliser shouldDisplaySteps déjà calculé ci-dessus (peut avoir changé via bouton anim)
    if (shouldDisplaySteps) {
        displayDichotomyStep(DATA['🫧']['🍰🫧🏭'], T0_initial, result, 0, true, options);
    }

    // Reset des flux diff min/max pour la nouvelle dichotomie asynchrone
    window.flux_diff_min = -1e9;
    window.flux_diff_max = 1e9;

    return new Promise((resolve) => {
            let isCancelled = false;
            const timeoutIds = [];

            const performDichotomy = () => {
                // Vérifier si annulé
                if (window.cancelCalculation || isCancelled) {
                    return;
                }

                let T0_current = T0_initial;
                let iter = 0;
                let final_result = result;

                // 🔒 Initialiser les bornes pour la dichotomie classique
                // Ces bornes seront mises à jour par la phase exponentielle ou la dichotomie classique
                let T0_min = T0_initial - 50; // Borne inférieure initiale
                let T0_max = T0_initial + 50; // Borne supérieure initiale

                // 🔒 Algorithme simplifié : Phase="Search" puis Phase="Dicho"
                // Phase="Search" : T0 -= Delta équilibre jusqu'à changement de signe
                // Phase="Dicho" : T0 = (old_T0 + T0) / 2
                let Phase = "Search";
                let signeDeltaFirst = 0;
                let old_T0 = T0_initial;
                let previousT0_for_convergence = null; // T0 précédente pour vérifier la convergence en température

                // 🔒 LOG : Début de la convergence
                console.log(`🚀 [performDichotomy] Début convergence - T0_initial = ${T0_initial.toFixed(2)}K (${(T0_initial - CONST.KELVIN_TO_CELSIUS).toFixed(2)}°C)`);
                console.log(`🚀 [performDichotomy] DATA['🧮']['🧮🌡️'] avant = ${DATA['🧮']['🧮🌡️'].toFixed(2)}K`);

                const iterate = () => {
                    // Vérifier si annulé avant chaque itération
                    if (window.cancelCalculation || isCancelled) {
                        return;
                    }

                    // 🔒 LOG : Début de l'itération
                    console.log(`\n🔄 [iterate ${iter}] ========== DÉBUT ITÉRATION ${iter} ==========`);
                    console.log(`🔄 [iterate ${iter}] T0_current = ${T0_current.toFixed(2)}K (${(T0_current - CONST.KELVIN_TO_CELSIUS).toFixed(2)}°C)`);
                    console.log(`🔄 [iterate ${iter}] DATA['🧮']['🧮🌡️'] avant mise à jour = ${DATA['🧮']['🧮🌡️'].toFixed(2)}K`);

                    if (iter >= max_iterations) {
                        // Maximum d'itérations atteint
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            if (typeof window !== 'undefined') {
                                window.DEBUG_CONVERGENCE = false;
                            }
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
                        }
                        return;
                    }

                    const shouldDisplaySteps = window.showDichotomySteps;
                    DATA['🧮']['🧮🌡️'] = T0_current;
                    window.calculateH2OParameters();
                    // Toujours recalculer pour avoir les valeurs à jour (le delta doit changer avec T0_current)
                    const calc_success = calculateFluxForT0();
                    if (!calc_success) {
                        console.error('[iterate] calculateFluxForT0() a échoué');
                        return;
                    }
                    final_result = getSpectralResultFromDATA();
                    if (!final_result) {
                        console.error('[iterate] Impossible de récupérer les résultats depuis DATA');
                        return;
                    }
                    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
                    const geo_flux = EPOCH.geothermal_flux || null;
                    // 🔒 CORRECTION : Utiliser DATA directement, pas le bouton
                    const solar_flux_absorbed = window.calculateSolarFluxAbsorbed();

                    // 🔒 CORRECTION CRITIQUE : Inclure le flux géothermique dans le bilan énergétique !
                    // Équilibre : Flux Sortant = Flux Solaire Absorbé + Flux Géothermique
                    const total_flux_in = solar_flux_absorbed + (geo_flux || 0);
                    const flux_diff = final_result.total_flux - total_flux_in;
                    
                    // 🔒 ÉQUILIBRE RADIATIF : Les aires sous les courbes affichées doivent être égales
                    // Sur le graphique :
                    // - Courbe pointillée (...) = Planck à T_effective = σT_eff⁴
                    // - Courbe pleine (___) = émission réelle spectrale = total_flux
                    // Légende : "∫ ...= ∫___" signifie équilibre des aires sous ces deux courbes
                    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
                    
                    // Calculer la température effective du corps noir (T° de la courbe pointillée affichée)
                    // T_eff = (total_flux / σ)^0.25
                    // 🔒 TOUJOURS calculer depuis total_flux (pas d'initialisation à T0)
                    const real_emission_flux = final_result.total_flux;
                    const T_effective = Math.pow(real_emission_flux / STEFAN_BOLTZMANN, 0.25);
                    
                    // Aire sous courbe pointillée (Planck à T_effective) : σT_eff⁴
                    const planck_effective_flux = STEFAN_BOLTZMANN * Math.pow(T_effective, 4);
                    
                    // Delta aire (équilibre des courbes affichées) : différence entre les aires sous les deux courbes
                    // ⚠️ IMPORTANT : delta_aire est TOUJOURS ~0 par définition mathématique !
                    // T_effective est calculé depuis real_emission_flux : T_eff = (real_emission_flux / σ)^0.25
                    // Donc planck_effective_flux = σT_eff⁴ = real_emission_flux (par construction)
                    // delta_aire = planck_effective_flux - real_emission_flux ≈ 0 (vérification de cohérence, pas de convergence)
                    // C'est l'équilibre mentionné dans la légende "∫ ...= ∫___"
                    const delta_aire = planck_effective_flux - real_emission_flux;
                    
                    // Delta équilibrage (pour convergence) : flux_sortant - flux_entrant
                    // C'est CE delta qui tend vers 0 pour la convergence (équilibre énergétique global)
                    const delta_equilibre = flux_diff;
                    
                    // 🔒 CORRECTION : Recalculer la tolérance à chaque itération avec T0_current
                    // La sensibilité change avec la température : ΔF = 4 * σ * T³ * ΔT
                    // À 255K, 10K = 37.6 W/m², mais à 2470K, 10K = beaucoup plus grand (≈33000 W/m²)
                    // Il faut recalculer la tolérance avec T0_current pour une précision correcte
                    const tolerance_current = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
                    
                    // Delta EDS (Effet de Serre) : différence entre corps noir théorique à T0 et émission réelle
                    // Ce delta NE TEND PAS vers 0, c'est l'effet de serre (normal qu'il reste élevé)
                    // C'est la différence entre ce que la surface émet (σT0⁴) et ce qui sort réellement
                    const blackbody_flux_T0 = STEFAN_BOLTZMANN * Math.pow(T0_current, 4);
                    const delta_eds = blackbody_flux_T0 - real_emission_flux;
                    
                    // 🔒 CALCUL DIRECT D'AJUSTEMENT DE T0 (pour information/debug)
                    // Relation approximative : dT/dF ≈ 1/(4σT³) où F est le flux
                    // Pour un delta_equilibre donné, l'ajustement de T0 serait approximativement :
                    // T0_ajusté ≈ T0 - delta_equilibre / (4σT0³)
                    // Facteur de conversion : 4σT0³ (sensibilité de la température au flux)
                    // ⚠️ PROTECTION : Cette formule n'est valide que pour de petits ajustements
                    // Quand T0 est très basse, le dénominateur devient très petit et l'ajustement devient absurde
                    let T0_adjustment_direct = 0;
                    let T0_ajuste_theorique = T0_current;
                    if (T0_current > 50) { // Seulement si T0 > 50K (éviter les valeurs absurdes)
                        const sensitivity_factor = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3);
                        if (Math.abs(sensitivity_factor) > 1e-10) { // Éviter division par zéro
                            T0_adjustment_direct = -delta_equilibre / sensitivity_factor;
                            // Limiter l'ajustement à ±1000K pour éviter les valeurs absurdes
                            T0_adjustment_direct = Math.max(-1000, Math.min(1000, T0_adjustment_direct));
                            T0_ajuste_theorique = T0_current + T0_adjustment_direct;
                        }
                    }
                    
                    // Signe * sqrt(abs(delta)) pour l'équilibrage (utiliser delta_equilibre pour la phase exponentielle)
                    // C'est le delta qui doit tendre vers 0, pas delta_aire (qui est toujours ~0 par définition)
                    // 🔒 CORRECTION : Si delta_equilibre < 0, on émet moins qu'on reçoit → il faut AUGMENTER T
                    // Donc signe×√|delta| négatif signifie qu'on doit augmenter T (incrément positif)
                    const sqrt_delta = Math.sqrt(Math.abs(delta_equilibre));
                    const signe_sqrt = delta_equilibre >= 0 ? 1 : -1; // Signe pour l'affichage
                    const sqrt_delta_signed = signe_sqrt * sqrt_delta;
                    
                    // 🔒 Afficher le log en commençant par Delta équilibre (valeur utilisée pour le calcul)
                    // Delta équilibre (→0) : flux_sortant - flux_entrant (convergence énergétique globale)
                    // Delta aire (→0) : équilibre des aires sous les courbes affichées (pointillée vs pleine) - TOUJOURS ~0 par définition
                    // Delta EDS : effet de serre (ne tend PAS vers 0, c'est normal)
                    // T0 ajusté théorique : calcul direct T0 - delta_equilibre/(4σT0³) pour référence
                    // Tolérance actuelle : recalculée avec T0_current (change avec la température)
                    const tolerance_status = Math.abs(delta_equilibre) <= tolerance_current ? '✅' : '🧮';
                    
                    // ⚠️ Vérifier si delta_equilibre est anormalement grand
                    if (Math.abs(delta_equilibre) > 10000) {
                        console.warn(`⚠️ [calculations.js] Delta équilibre anormalement grand: ${delta_equilibre.toFixed(2)} W/m² (flux_sortant=${final_result.total_flux.toFixed(2)} W/m², flux_entrant=${total_flux_in.toFixed(2)} W/m²)`);
                    }
                    
                    // Fonction pour log Delta équilibre
                    window.logDeltaEquilibre();
                    
                    // Afficher le calcul direct seulement si l'ajustement est raisonnable (T0 > 50K et ajustement < 100K)
                    // ⚠️ Cette formule linéaire n'est valide que pour de petits ajustements (ΔT << T)
                    // À 100K avec delta_equilibre = -233 W/m², l'ajustement serait -1013K (absurde)
                    // On n'affiche que si l'ajustement est < 100K (approximation valide)
                    if (T0_current > 50 && Math.abs(T0_adjustment_direct) > 0.01 && Math.abs(T0_adjustment_direct) < 100) {
                        const sensitivity_factor = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3);
                        console.log(`   📊 Calcul direct: T0_ajusté = T0 - delta_equilibre/(4σT0³) = ${T0_current.toFixed(2)}K - ${delta_equilibre.toFixed(2)}/(4σ×${T0_current.toFixed(2)}³) = ${T0_ajuste_theorique.toFixed(2)}K (ajustement: ${T0_adjustment_direct > 0 ? '+' : ''}${T0_adjustment_direct.toFixed(2)}K, sensibilité: ${sensitivity_factor.toFixed(2)} W/m²/K)`);
                    }
                    
                    // 🔒 Mettre à jour la couleur de legend-equilibre avec la température actuelle (pendant les calculs)
                    if (typeof window !== 'undefined' && typeof window.tempSurfaceToColor === 'function') {
                        const tempC_current = T0_current - CONST.KELVIN_TO_CELSIUS;
                        const color_current = window.tempSurfaceToColor(tempC_current);
                        const legendEquilibre = document.querySelector('.legend-equilibre'); // Plantera si n'existe pas
                        if (legendEquilibre) {
                            legendEquilibre.style.color = color_current;
                        }
                    }
                    
                    // 🔒 Ajouter un point à chaque cycle/phase de calcul (exponentielle ou dichotomie)
                    // Avec une pause de 0.1s pour permettre l'affichage de la courbe
                    if (typeof document !== 'undefined') {
                        const dots = document.getElementById('calculation-dots');
                        if (dots) {
                            // Ajouter le point avec un délai de 0.1s pour permettre l'affichage
                            setTimeout(() => {
                                dots.innerHTML += '.';
                            }, 100);
                        }
                    }
                    
                    // 🔒 Vérifier la convergence IMMÉDIATEMENT après le calcul (avant phase exponentielle/dichotomie)
                    // Deux critères de convergence :
                    // 1. Delta équilibre en W/m² : |delta_equilibre| <= tolerance_current (recalculé avec T0_current)
                    // 2. Variation de température : |T0_current - previousT0_for_convergence| <= precision_K
                    // Si l'un des deux est satisfait, on converge (précision en température OU en flux)
                    // 🔒 CORRECTION : Ne pas vérifier la convergence par température à la première itération (iter === 0)
                    // car previousT0_for_convergence = T0_initial = T0_current, donc |ΔT| = 0 toujours
                    // Utiliser previousT0_for_convergence AVANT de le mettre à jour (pour comparer avec l'itération précédente)
                    // previousT0_for_convergence est null à la première itération, donc on ne vérifie pas la convergence par température
                    const delta_T_convergence = previousT0_for_convergence !== null ? Math.abs(T0_current - previousT0_for_convergence) : Infinity;
                    const converged_by_flux = Math.abs(delta_equilibre) <= tolerance_current;
                    // 🔒 CORRECTION : La convergence par température est un critère secondaire
                    // Elle ne doit se déclencher QUE si l'équilibre radiatif est déjà atteint (ou presque)
                    // Si delta_equilibre est encore élevé, on continue même si la température ne bouge plus
                    const converged_by_temp = previousT0_for_convergence !== null && delta_T_convergence <= precision_K && Math.abs(delta_equilibre) <= tolerance_current * 10; // Seulement si on a une valeur précédente ET que l'équilibre est presque atteint
                    
                    if (converged_by_flux || converged_by_temp) {
                        if (converged_by_temp && !converged_by_flux) {
                            console.log(`[DICHOTOMIE] ✅ Convergence par précision température: |ΔT| = ${delta_T_convergence.toFixed(2)}K <= ${precision_K}K (delta_equilibre: ${delta_equilibre.toFixed(2)} W/m², tolerance: ${tolerance_current.toFixed(2)} W/m²)`);
                        }
                        // 🔒 SUPPRIMÉ : logCalculationPhase inutile

                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.calculateH2OParameters();
                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const calc_success_conv = calculateFluxForT0();
                        if (!calc_success_conv) {
                            console.error('[Convergence] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Convergence] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }

                        // Déclencher un événement de convergence
                        window.calculationConverged = true;
                        window.dispatchEvent(new CustomEvent('calculationConverged', {
                            detail: { T0: T0_current, iteration: iter + 1 }
                        }));
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            if (typeof window !== 'undefined') {
                                window.DEBUG_CONVERGENCE = false;
                            }
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
                        }
                        return;
                    }
                    
                    // 🔒 Algorithme simplifié : Phase="Search" puis Phase="Dicho"
                    // Phase="Search" : T0 -= Delta équilibre jusqu'à changement de signe
                    // Phase="Dicho" : T0 = (old_T0 + T0) / 2
                    
                    // Initialiser signeDeltaFirst à la première itération
                    if (iter === 0) {
                        signeDeltaFirst = delta_equilibre < 0 ? -1 : (delta_equilibre > 0 ? 1 : 0);
                        old_T0 = T0_current;
                    }
                    
                    // Vérifier changement de signe : passer en Phase="Dicho"
                    const signeDelta = delta_equilibre < 0 ? -1 : (delta_equilibre > 0 ? 1 : 0);
                    if (Phase === "Search" && signeDeltaFirst !== 0 && signeDeltaFirst !== signeDelta) {
                        Phase = "Dicho";
                        // Initialiser les bornes pour la dichotomie
                        if (signeDeltaFirst < 0) {
                            // On était en dessous, maintenant au-dessus
                            T0_min = old_T0;
                            T0_max = T0_current;
                        } else {
                            // On était au-dessus, maintenant en dessous
                            T0_min = T0_current;
                            T0_max = old_T0;
                        }
                    }
                    
                    // Appliquer l'algorithme selon la phase
                    if (Phase === "Search") {
                        // Phase="Search" : T0 -= Delta équilibre
                        old_T0 = T0_current;
                        // 🔒 CORRECTION : L'ajustement doit être proportionnel, pas direct
                        // Si delta_equilibre est positif (on émet trop), on doit diminuer T
                        // Si delta_equilibre est négatif (on émet pas assez), on doit augmenter T
                        // Relation : dF/dT = 4σT³, donc dT = dF / (4σT³)
                        const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
                        const sensitivity = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3);
                        let T0_adjustment = -delta_equilibre / sensitivity;
                        // 🔒 Limiter l'ajustement pour éviter des sauts trop importants (max ±50K par itération)
                        const T0_adjustment_unlimited = T0_adjustment;
                        T0_adjustment = Math.max(-50, Math.min(50, T0_adjustment));
                        T0_current = T0_current + T0_adjustment;
                        // 🔒 Protection : éviter les températures négatives ou trop basses
                        T0_current = Math.max(200, T0_current);
                        console.log(`📈 [Search] T0=${old_T0.toFixed(2)}K → ${T0_current.toFixed(2)}K`);
                        console.log(`   Delta équilibre = ${delta_equilibre.toFixed(2)} W/m²`);
                        console.log(`   Sensibilité = ${sensitivity.toFixed(2)} W/m²/K`);
                        console.log(`   Ajustement théorique = ${T0_adjustment_unlimited.toFixed(2)}K`);
                        console.log(`   Ajustement limité = ${T0_adjustment.toFixed(2)}K`);
                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.calculateH2OParameters();
                        // Recalculer avec la nouvelle T0
                        const calc_success_search = calculateFluxForT0();
                        if (!calc_success_search) {
                            console.error('[Search] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Search] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }
                        // Recalculer delta_equilibre avec la nouvelle T0
                        const solar_flux_absorbed_new = calculateSolarFluxAbsorbed(T0_current, DATA['🔘']['🔘💧📛'], geo_flux);
                        const total_flux_in_new = solar_flux_absorbed_new + (geo_flux || 0);
                        delta_equilibre = final_result.total_flux - total_flux_in_new;
                        // Recalculer tolerance_current avec la nouvelle T0
                        tolerance_current = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
                    } else if (Phase === "Dicho") {
                        // Phase="Dicho" : T0 = (old_T0 + T0) / 2
                        old_T0 = T0_current;
                        T0_current = (T0_min + T0_max) / 2;
                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.calculateH2OParameters();
                        // Recalculer avec la nouvelle T0
                        const calc_success_dicho = calculateFluxForT0();
                        if (!calc_success_dicho) {
                            console.error('[Dicho] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Dicho] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }
                        // Recalculer delta_equilibre avec la nouvelle T0
                        const solar_flux_absorbed_new = calculateSolarFluxAbsorbed(T0_current, DATA['🔘']['🔘💧📛'], geo_flux);
                        const total_flux_in_new = solar_flux_absorbed_new + (geo_flux || 0);
                        delta_equilibre = final_result.total_flux - total_flux_in_new;
                        // Recalculer tolerance_current avec la nouvelle T0
                        tolerance_current = 4 * STEFAN_BOLTZMANN * Math.pow(T0_current, 3) * precision_K;
                        // Mettre à jour les bornes selon le signe de delta_equilibre
                        if (delta_equilibre < 0) {
                            // On émet moins qu'on reçoit → augmenter T (T0_min = T0_current)
                            T0_min = T0_current;
                        } else {
                            // On émet trop → diminuer T (T0_max = T0_current)
                            T0_max = T0_current;
                        }
                        // Continuer normalement (le dessin sera fait dans la boucle principale)
                        window.incrementTimeline();
                        // Ne pas faire setTimeout ici, continuer normalement pour passer par le dessin
                        // (pas de return, on continue dans la boucle)
                    }
                    
                    // 🔒 Vérifier la convergence AVANT de continuer (peu importe la phase)
                    // 🔒 CALCUL DE TOLÉRANCE : tolerance = 4 * σ * T³ * precision_K
                    // Explication : F = σT⁴ (loi de Stefan-Boltzmann)
                    // dF/dT = 4σT³ (dérivée)
                    // Donc ΔF = 4σT³ × ΔT
                    // Pour une précision de precision_K en K, la tolérance en W/m² est 4σT³ × precision_K
                    // Exemple : à 255K avec precision_K=0.1K → tolerance = 4×5.67e-8×255³×0.1 ≈ 0.38 W/m²
                    // Deux critères de convergence :
                    // 1. Delta équilibre en W/m² : |delta_equilibre| <= tolerance_current (recalculé avec T0_current)
                    // 2. Variation de température : |T0_current - previousT0_for_convergence| <= precision_K
                    // 🔒 CORRECTION : Ne pas vérifier la convergence par température à la première itération
                    // previousT0_for_convergence est null à la première itération, donc on ne vérifie pas la convergence par température
                    const delta_T_convergence_check = previousT0_for_convergence !== null ? Math.abs(T0_current - previousT0_for_convergence) : Infinity;
                    const converged_by_flux_check = Math.abs(delta_equilibre) <= tolerance_current;
                    // 🔒 CORRECTION : La convergence par température est un critère secondaire
                    // Elle ne doit se déclencher QUE si l'équilibre radiatif est déjà atteint (ou presque)
                    // Si delta_equilibre est encore élevé, on continue même si la température ne bouge plus
                    const converged_by_temp_check = previousT0_for_convergence !== null && delta_T_convergence_check <= precision_K && Math.abs(delta_equilibre) <= tolerance_current * 10; // Seulement si on a une valeur précédente ET que l'équilibre est presque atteint
                    
                    if (converged_by_flux_check || converged_by_temp_check) {
                        if (converged_by_temp_check && !converged_by_flux_check) {
                            console.log(`[DICHOTOMIE] ✅ Convergence par précision température: |ΔT| = ${delta_T_convergence_check.toFixed(2)}K <= ${precision_K}K (delta_equilibre: ${delta_equilibre.toFixed(2)} W/m², tolerance: ${tolerance_current.toFixed(2)} W/m²)`);
                        }
                        // 🔒 SUPPRIMÉ : logCalculationPhase inutile

                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.calculateH2OParameters();
                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const calc_success_conv = calculateFluxForT0();
                        if (!calc_success_conv) {
                            console.error('[Convergence] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Convergence] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }

                        // Déclencher un événement de convergence pour permettre l'augmentation de précision
                        if (typeof window !== 'undefined') {
                            window.calculationConverged = true;
                            // Déclencher un événement personnalisé
                            if (window.dispatchEvent) {
                                window.dispatchEvent(new CustomEvent('calculationConverged', {
                                    detail: { T0: T0_current, iteration: iter + 1 }
                                }));
                            }
                        }
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            if (typeof window !== 'undefined') {
                                window.DEBUG_CONVERGENCE = false;
                            }
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
                        }
                        return;
                    }

                    // S'assurer que T0_min et T0_max sont bien définis pour la dichotomie
                    if (Phase === "Dicho" && (T0_min === undefined || T0_max === undefined || T0_min >= T0_max)) {
                        // Si les bornes ne sont pas définies, les initialiser
                        if (flux_diff > 0) {
                            // On émet trop, diminuer T0
                            T0_max = T0_current;
                            T0_min = Math.max(200, T0_current - 100); // Borne inférieure
                        } else {
                            // On émet pas assez, augmenter T0
                            T0_min = T0_current;
                            T0_max = Math.min(3000, T0_current + 100); // Borne supérieure
                        }
                    }

                    // 🔒 CASSER LA DOUBLE BOUCLE : incrémenter, dessiner, puis vérifier conditions
                    iter++;
                    
                    // Afficher chaque étape de la dichotomie seulement si demandé
                    // 🔒 Vérifier shouldDisplaySteps à chaque itération (peut changer via bouton anim)
                    const shouldDisplayStepsIter = typeof window !== 'undefined' && window.showDichotomySteps;
                    
                    // 🔒 Vérifier conditions de sortie AVANT de dessiner (pour éviter de dessiner inutilement)
                    // 🔒 IMPORTANT : tolerance_current est pour la convergence (delta_equilibre), pas pour delta_aire
                    // delta_aire est toujours ~0 par définition (T_effective est calculé depuis total_flux)
                    // On utilise delta_equilibre pour la convergence, pas delta_aire
                    // tolerance_current est recalculé à chaque itération avec T0_current pour une précision correcte
                    // Deux critères de convergence : flux OU température
                    // 🔒 CORRECTION : Ne pas vérifier la convergence par température à la première itération
                    // Utiliser previousT0_for_convergence AVANT de le mettre à jour (pour comparer avec l'itération précédente)
                    // previousT0_for_convergence est null à la première itération, donc on ne vérifie pas la convergence par température
                    const delta_T_final = previousT0_for_convergence !== null ? Math.abs(T0_current - previousT0_for_convergence) : Infinity;
                    const converged_by_flux_final = Math.abs(delta_equilibre) < tolerance_current;
                    // 🔒 CORRECTION : La convergence par température est un critère secondaire
                    // Elle ne doit se déclencher QUE si l'équilibre radiatif est déjà atteint (ou presque)
                    // Si delta_equilibre est encore élevé, on continue même si la température ne bouge plus
                    const converged_by_temp_final = previousT0_for_convergence !== null && delta_T_final <= precision_K && Math.abs(delta_equilibre) <= tolerance_current * 10; // Seulement si on a une valeur précédente ET que l'équilibre est presque atteint
                    
                    if (iter > 20 || converged_by_flux_final || converged_by_temp_final) {
                        // Condition de sortie atteinte
                        if (iter > 20) {
                            console.log('[calculations.js] ⚠️ Maximum d\'itérations atteint (20)');
                        } else if (converged_by_temp_final && !converged_by_flux_final) {
                            console.log(`[calculations.js] ✅ Convergence par précision température: |ΔT| = ${delta_T_final.toFixed(2)}K <= ${precision_K}K (delta_equilibre: ${delta_equilibre.toFixed(2)} W/m², tolerance: ${tolerance_current.toFixed(2)} W/m²)`);
                        } else {
                            console.log(`[calculations.js] ✅ Convergence atteinte (delta_equilibre: ${Math.abs(delta_equilibre).toFixed(4)} < tolerance: ${tolerance_current.toFixed(4)} W/m² à T=${T0_current.toFixed(2)}K)`);
                        }
                        
                        // 🔒 SUPPRIMÉ : logCalculationPhase inutile

                        // 🔒 Mettre à jour DATA['🧮']['🧮🌡️'] AVANT d'appeler calculateFluxForT0()
                        DATA['🧮']['🧮🌡️'] = T0_current;
                        window.calculateH2OParameters();
                        // Convergence atteinte : recalculer avec spectre complet pour précision finale
                        const calc_success_conv = calculateFluxForT0();
                        if (!calc_success_conv) {
                            console.error('[Convergence] calculateFluxForT0() a échoué');
                            return;
                        }
                        final_result = getSpectralResultFromDATA();
                        if (!final_result) {
                            console.error('[Convergence] Impossible de récupérer les résultats depuis DATA');
                            return;
                        }

                        // Déclencher un événement de convergence
                        window.calculationConverged = true;
                        window.dispatchEvent(new CustomEvent('calculationConverged', {
                            detail: { T0: T0_current, iteration: iter }
                        }));
                        if (!isCancelled) {
                            // 🔒 Désactiver les logs de debug après convergence
                            if (typeof window !== 'undefined') {
                                window.DEBUG_CONVERGENCE = false;
                            }
                            finalizeResults(final_result, T0_current, DATA['🫧']['🍰🫧🏭'], resolve);
                        }
                        return;
                    }
                    
                    // Mettre à jour previousT0_for_convergence pour la prochaine itération (APRÈS vérification de convergence)
                    // Si on continue, on met à jour pour la prochaine comparaison
                    previousT0_for_convergence = T0_current;
                    
                    // 🔒 Dessiner après avoir vérifié qu'on continue (utiliser requestAnimationFrame pour laisser le navigateur rendre)
                    if (shouldDisplayStepsIter && !isCancelled) {
                        displayDichotomyStep(DATA['🫧']['🍰🫧🏭'], T0_current, final_result, iter, false, options);
                        
                        // 🔒 Utiliser requestAnimationFrame pour laisser le navigateur dessiner avant de continuer
                        // Double RAF pour s'assurer que le rendu est fait
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                // Continuer après que le navigateur ait eu le temps de rendre
                                setTimeout(() => {
                                    iterate();
                                }, 50); // Petit délai supplémentaire pour laisser le temps de rendre
                            });
                        });
                        return; // Sortir pour laisser le temps de rendre
                    }

                    // Mettre à jour les labels du flux pendant le calcul
                    {
                        // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked)
                        const cellH2O_iter = document.getElementById('cell-h2o'); // Plantera si n'existe pas
                        // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
                        const h2o_enabled = cellH2O_iter && cellH2O_iter.classList.contains('checked');

                        // 🔒 UTILISER geo_flux (variable locale déjà calculée correctement ci-dessus)
                        // au lieu de le recalculer (potentiellement mal) via getGeologicalPeriodByName
                        // let geo_flux = null; ... REMOVED

                        const albedo = window.calculateAlbedo();
                        const cloud_coverage = DATA['🪩']['🍰🪩⛅'];
                        const co2_ppm = DATA['🫧']['🍰🫧🏭'] * 1e6;
                        const ch4_ppm = DATA['🫧']['🍰🫧⛽'] * 1e6;

                        // Mettre à jour les labels avec les valeurs actuelles
                        window.updateFluxLabels({
                            T0: T0_current,
                            temp_surface: T0_current,
                            total_flux: final_result.total_flux,
                            albedo: albedo,
                            cloud_coverage: cloud_coverage,
                            co2_ppm: co2_ppm,
                            ch4_ppm: ch4_ppm,
                            geo_flux: geo_flux, // Passer geo_flux explicitement
                            planet_radius: (options && options.planet_radius) ? options.planet_radius : 6371000
                        });
                    }

                    // 🔒 Vérification de convergence déjà faite plus haut (après incrément et dessin)

                    if (flux_diff > 0) {
                        // Flux trop élevé, diminuer T0
                        // 🔒 Mettre à jour T0_max seulement si on n'a pas encore de borne supérieure valide
                        if (T0_max > T0_current || T0_max === T0_initial + 50) {
                            T0_max = T0_current;
                        }

                        // ⚡ OPTIMISATION : Méthode Regula Falsi (Fausse Position) au lieu de Dichotomie simple
                        // Au lieu de prendre le milieu (T_min + T_max)/2, on utilise l'erreur relative
                        // pour estimer où le zéro se trouve probablement.
                        // Comme Flux ~ T^4, la fonction est monotone et convexe/concave, donc très prédictible.

                        // Sauvegarder la différence de flux pour les bornes (si disponible)
                        if (typeof window.flux_diff_min === 'undefined') window.flux_diff_min = -1e9; // Valeur très négative par défaut
                        if (typeof window.flux_diff_max === 'undefined') window.flux_diff_max = 1e9;  // Valeur très positive par défaut

                        window.flux_diff_max = flux_diff;

                        // Si on a des bornes valides avec des signes opposés, utiliser Regula Falsi
                        if (window.flux_diff_min < 0 && window.flux_diff_max > 0) {
                            // Formule de la sécante : x = a - f(a) * (b - a) / (f(b) - f(a))
                            // Ici a = T0_min, b = T0_max
                            const delta = (T0_max - T0_min);
                            const df = (window.flux_diff_max - window.flux_diff_min);

                            // Interpolation linéaire
                            let T0_next = T0_min - window.flux_diff_min * (delta / df);

                            // 🔒 SÉCURITÉ : Garder une marge par rapport aux bords (éviter stagnation)
                            // Ne pas aller trop près des bornes (min 10% de l'intervalle)
                            const safety_margin = delta * 0.1;
                            T0_next = Math.max(T0_min + safety_margin, Math.min(T0_max - safety_margin, T0_next));

                            T0_current = T0_next;
                        } else {
                            // Fallback Dichotomie classique si pas assez d'infos
                            T0_current = (T0_min + T0_max) / 2;
                        }
                    } else {
                        // Flux trop faible, augmenter T0 (dichotomie classique)
                        T0_min = T0_current;

                        // Sauvegarder la différence de flux
                        if (typeof window.flux_diff_min === 'undefined') window.flux_diff_min = -1e9;
                        if (typeof window.flux_diff_max === 'undefined') window.flux_diff_max = 1e9;

                        window.flux_diff_min = flux_diff;

                        // Si on a des bornes valides avec des signes opposés, utiliser Regula Falsi
                        if (window.flux_diff_min < 0 && window.flux_diff_max > 0) {
                            const delta = (T0_max - T0_min);
                            const df = (window.flux_diff_max - window.flux_diff_min);

                            let T0_next = T0_min - window.flux_diff_min * (delta / df);

                            // 🔒 SÉCURITÉ
                            const safety_margin = delta * 0.1;
                            T0_next = Math.max(T0_min + safety_margin, Math.min(T0_max - safety_margin, T0_next));

                            T0_current = T0_next;
                        } else {
                            T0_current = (T0_min + T0_max) / 2;
                        }
                    }

                    // Incrémenter le temps à chaque itération de dichotomie
                    window.incrementTimeline();

                    // Mettre à jour l'overlay (barre de progression avec .)
                    const dots = document.getElementById('calculation-dots');
                    if (dots) {
                        setTimeout(() => { dots.innerHTML += '.'; }, 100);
                    }

                    // Continuer avec un délai pour permettre la visualisation
                    if (shouldDisplaySteps && !isCancelled) {
                        const timeoutId = setTimeout(iterate, 100); // Délai de 0.1s pour visualiser chaque étape
                        timeoutIds.push(timeoutId);
                    } else if (!isCancelled) {
                        const timeoutId = setTimeout(iterate, 0); // Pas de délai si pas d'affichage (calculs de référence)
                        timeoutIds.push(timeoutId);
                    }
                };

                iterate();
            };

            const initialTimeoutId = setTimeout(performDichotomy, 500); // Attendre 500ms après l'affichage initial
            timeoutIds.push(initialTimeoutId);

            if (!window.calculationTimeouts) {
                window.calculationTimeouts = [];
            }
            window.calculationTimeouts.push(...timeoutIds);
        });
}

// Fonction pour finaliser les résultats (mode asynchrone)
function finalizeResults(final_result, final_T0, CO2_fraction, resolve) {
    const logo = '🏭'; // Emoji CO2 depuis dico.js
    console.log(`${logo} [finalizeResults@calculations.js] T0=${final_T0.toFixed(2)}K flux=${final_result.total_flux.toFixed(2)}W/m²`);
    // 🔒 Réactiver l'affichage du spectre à la fin des calculs (même si FPS était bas pendant)
    if (typeof window !== 'undefined') {
        window.showSpectralBackground = true;
    }
    
    // Cacher l'overlay de calcul
    if (typeof document !== 'undefined') {
        const overlay = document.getElementById('calculation-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Stocker la T0 ajustée

    // Utiliser les résultats de la dernière itération
    const { lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux } = final_result;

    // Note importante : Ce modèle ne prend en compte QUE le CO2
    // Les 15°C réels de la Terre incluent aussi :
    // - Vapeur d'eau (H2O) : effet de serre majeur
    // - Méthane (CH4), protoxyde d'azote (N2O), etc.
    // - Nuages : effet de serre très important
    // Donc les températures calculées ici seront plus basses que la réalité
    //
    // Vérification avec la littérature :
    // - T_eff sans effet de serre : ~255 K (-18°C) ✓ (cohérent)
    // - T0 à 0 ppm : 255.28 K (-18.0°C) ✓
    // - T0 à 280 ppm : 266.21 K (-6.9°C) - effet de serre du CO2 seul
    // - T0 à 420 ppm : 266.80 K (-6.3°C) - effet de serre du CO2 seul
    // - Différence 420-280 ppm : 0.59 K (modèle complet) vs ~1.74 K (formule simplifiée)

    // Calculer le flux total au sommet de l'atmosphère
    const total_flux = upward_flux[upward_flux.length - 1].reduce((sum, val) => sum + val, 0);

    // Calculer l'albedo dynamique et la couverture nuageuse
    // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked) au lieu de se fier uniquement à window.waterVaporEnabled
    const cellH2O = document.getElementById('cell-h2o'); // Plantera si n'existe pas
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const h2o_enabled = cellH2O && cellH2O.classList.contains('checked');
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const geo_flux = EPOCH.geothermal_flux || (window.calculateGeothermalFlux ? window.calculateGeothermalFlux(EPOCH.core_temperature, EPOCH.geothermal_diffusion_factor) : null);
    // Récupérer CH4 pour détecter le cas du corps noir
    const ch4_enabled = (typeof window !== 'undefined' && window.methaneEnabled !== undefined)
        ? window.methaneEnabled
        : false;
    // Dans finalizeResults, on n'a pas accès direct à CH4_fraction depuis options
    // On suppose que si ch4_enabled est false, alors CH4_fraction est null ou 0
    const CH4_fraction = null; // Approximation : sera vérifié via ch4_enabled

    // ✅ SCIENTIFIQUEMENT CERTAIN : Température effective (loi de Stefan-Boltzmann)
    // - T_eff = (F/σ)^(1/4) où F est le flux radiatif total et σ la constante de Stefan-Boltzmann
    // - Cette formule est exacte pour un corps noir en équilibre radiatif
    // - Pour la Terre sans effet de serre : T_eff ≈ 255K (-18°C) - valeur bien établie
    // ⚠️ CAS PARTICULIER : Corps noir (pas d'atmosphère, albedo = 0)
    //   → Pas d'effet de serre, donc temp_surface = effective_temperature
    //   → On utilise final_T0 directement pour éviter les erreurs numériques
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
    const isBlackBody = (CO2_fraction === 0 || CO2_fraction === null) && !h2o_enabled && (!ch4_enabled || !CH4_fraction);
    const effective_temperature = isBlackBody
        ? final_T0  // Corps noir : utiliser directement temp_surface (formule analytique exacte)
        : Math.pow(total_flux / STEFAN_BOLTZMANN, 0.25);  // Avec atmosphère : calculer depuis flux_total

    // 🔒 FORCER le recalcul de la glace avant de calculer l'albedo
    if (h2o_enabled) {
        const h2o_total_percent = DATA['💧']['🍰🫧💧'] * 100;
        if (h2o_total_percent > 0) {
            const h2o_params = window.calculateH2OParameters(final_T0, h2o_total_percent, null);
            window.h2oIceFractionFromCalculation = h2o_params.ice_fraction;
        }
    }

    const albedo = window.calculateAlbedo();
    const cloud_coverage = DATA['🪩']['🍰🪩⛅'];
    
    // Log albedo
    console.log(`🌍 Albedo: ${(albedo * 100).toFixed(1)}%`);

    // Calculer EDS (Effet de Serre) = Flux Surface - Flux Sortant
    const flux_surface = STEFAN_BOLTZMANN * Math.pow(final_T0, 4);
    const eds = flux_surface - total_flux;
    
    // 🔒 Mettre à jour la couleur avec la température finale (après convergence)
    const tempC_final = final_T0 - CONST.KELVIN_TO_CELSIUS;
    const color_final = window.tempSurfaceToColor(tempC_final);
    window.updateBlackBodyColor(color_final);
    const legendEquilibre_f = document.querySelector('.legend-equilibre');
    if (legendEquilibre_f) legendEquilibre_f.style.color = color_final;
    
    // Log EDS et T° finale
    console.log(`🔥 EDS: ${eds.toFixed(1)} W/m²`);
    console.log(`🌡️ T° finale: ${final_T0.toFixed(2)}K (${(final_T0 - CONST.KELVIN_TO_CELSIUS).toFixed(1)}°C)`);

    if (!window.plotData) window.plotData = {};
    window.plotData.temp_surface = final_T0;
    window.plotData.temp_surface_c = final_T0 - CONST.KELVIN_TO_CELSIUS;
    DATA['🧮']['🧮🌡️'] = final_T0;

    const final_result_obj = {
        lambda_range: lambda_range,
        lambda_weights: lambda_weights, // ⚡ Nécessaire pour normalisation correcte dans plot.js
        z_range: z_range,
        upward_flux: upward_flux,
        optical_thickness: optical_thickness,
        emitted_flux: emitted_flux,
        absorbed_flux: absorbed_flux,
        earth_flux: earth_flux,
        total_flux: total_flux,
        effective_temperature: effective_temperature,
        albedo: albedo,
        cloud_coverage: cloud_coverage,
        T0: final_T0, // 🔒 Température de surface (K) - nécessaire pour updateH2OLevelDirect
        temp_surface: final_T0, // 🔒 Alias pour compatibilité
        temp_surface_c: final_T0 - CONST.KELVIN_TO_CELSIUS // 🔒 Température de surface (°C) - nécessaire pour updateH2OLevelDirect
    };

    window.showSpectralBackground = true;
    window.spectralConverged = true;
    window.spectralPrecisionTarget = 'max';
    
    {
        // 🔒 Utiliser un délai plus long pour s'assurer que updatePlot a fini
        setTimeout(() => {
            const canvas = document.getElementById('spectral-visualization');
            if (canvas) {
                // 🔒 FORCER la visibilité du canvas avec !important
                canvas.style.setProperty('display', 'block', 'important');
                canvas.style.setProperty('visibility', 'visible', 'important');
                canvas.style.setProperty('opacity', '1', 'important');
                canvas.style.setProperty('z-index', '1', 'important');
                canvas.style.setProperty('position', 'absolute', 'important');
            }
            // Créer un objet avec les données nécessaires pour la visualisation
            const spectralData = {
                upward_flux: upward_flux,
                lambda_range: lambda_range,
                z_range: z_range
            };
            window.showSpectralBackground = true;
            window.updateSpectralVisualization(spectralData);
            setTimeout(() => {
                const canvasCheck = document.getElementById('spectral-visualization');
                if (canvasCheck && (canvasCheck.style.display === 'none' || canvasCheck.style.visibility === 'hidden' || canvasCheck.style.opacity === '0')) {
                    console.warn('[finalizeResults] ⚠️ Canvas spectral caché après mise à jour, réactivation...');
                    canvasCheck.style.setProperty('display', 'block', 'important');
                    canvasCheck.style.setProperty('visibility', 'visible', 'important');
                    canvasCheck.style.setProperty('opacity', '1', 'important');
                    window.updateSpectralVisualization(spectralData);
                }
            }, 300);
        }, 250); // Délai plus long pour laisser updatePlot finir
    }

    resolve(final_result_obj);
}

// Fonction pour finaliser les résultats (mode synchrone)
function finalizeResultsSync(result, T0, lambda_range, lambda_weights, z_range, upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux, CO2_fraction) {
    const logo = '🏭'; // Emoji CO2 depuis dico.js
    console.log(`${logo} [finalizeResultsSync@calculations.js] T0=${T0.toFixed(2)}K emitted=${emitted_flux.toFixed(2)}W/m² absorbed=${absorbed_flux.toFixed(2)}W/m²`);
    // Calculer le flux total au sommet de l'atmosphère
    const total_flux = upward_flux[upward_flux.length - 1].reduce((sum, val) => sum + val, 0);

    // Récupérer h2o_enabled pour calculer l'albedo dynamique et la couverture nuageuse
    // 🔒 Vérifier l'état réel du bouton H2O (checked/unchecked) au lieu de se fier uniquement à window.waterVaporEnabled
    const cellH2O = document.getElementById('cell-h2o'); // Plantera si n'existe pas
    // 🔒 SEUL l'état du bouton compte pour déterminer si H2O est activé (pas de booléens en trop)
    const h2o_enabled = cellH2O && cellH2O.classList.contains('checked');
    const EPOCH = window.TIMELINE[DATA['📜']['👉']];
    const geo_flux = EPOCH.geothermal_flux || (window.calculateGeothermalFlux ? window.calculateGeothermalFlux(EPOCH.core_temperature, EPOCH.geothermal_diffusion_factor) : null);
    const solar_flux_absorbed = calculateSolarFluxAbsorbed(T0, h2o_enabled, geo_flux);
    if (h2o_enabled) {
        const h2o_total_percent = DATA['💧']['🍰🫧💧'] * 100;
        if (h2o_total_percent > 0) {
            const h2o_params = window.calculateH2OParameters(T0, h2o_total_percent, null);
            window.h2oIceFractionFromCalculation = h2o_params.ice_fraction;
        }
    }
    
    const albedo = calculateAlbedo(T0, h2o_enabled, geo_flux);
    const cloud_coverage = DATA['🪩']['🍰🪩⛅'];
    
    // Log albedo
    console.log(`🌍 Albedo: ${(albedo * 100).toFixed(1)}%`);
    
    const tempC_final_sync = T0 - CONST.KELVIN_TO_CELSIUS;
    const color_final_sync = window.tempSurfaceToColor(tempC_final_sync);
    window.updateBlackBodyColor(color_final_sync);
    const legendEquilibre_sync = document.querySelector('.legend-equilibre');
    if (legendEquilibre_sync) legendEquilibre_sync.style.color = color_final_sync;

    const ch4_enabled = window.methaneEnabled;
    // Dans finalizeResultsSync, on n'a pas accès direct à CH4_fraction depuis options
    // On suppose que si ch4_enabled est false, alors CH4_fraction est null ou 0
    const CH4_fraction = null; // Approximation : sera vérifié via ch4_enabled

    // ✅ SCIENTIFIQUEMENT CERTAIN : Température effective (loi de Stefan-Boltzmann)
    // - T_eff = (F/σ)^(1/4) où F est le flux radiatif total et σ la constante de Stefan-Boltzmann
    // - Cette formule est exacte pour un corps noir en équilibre radiatif
    // - Pour la Terre sans effet de serre : T_eff ≈ 255K (-18°C) - valeur bien établie
    // ⚠️ CAS PARTICULIER : Corps noir (pas d'atmosphère, albedo = 0)
    //   → Pas d'effet de serre, donc temp_surface = effective_temperature
    //   → On utilise T0 directement pour éviter les erreurs numériques
    const isBlackBody = (CO2_fraction === 0 || CO2_fraction === null) && !h2o_enabled && (!ch4_enabled || !CH4_fraction);
    const effective_temperature = isBlackBody
        ? T0  // Corps noir : utiliser directement temp_surface (formule analytique exacte)
        : Math.pow(total_flux / STEFAN_BOLTZMANN, 0.25);  // Avec atmosphère : calculer depuis flux_total

    // Calculer EDS (Effet de Serre) = Flux Surface - Flux Sortant
    const STEFAN_BOLTZMANN = CONST.STEFAN_BOLTZMANN;
    const flux_surface = STEFAN_BOLTZMANN * Math.pow(T0, 4);
    const eds = flux_surface - total_flux;
    
    // Log EDS et T° finale
    console.log(`🔥 EDS: ${eds.toFixed(1)} W/m²`);
    console.log(`🌡️ T° finale: ${T0.toFixed(2)}K (${(T0 - CONST.KELVIN_TO_CELSIUS).toFixed(1)}°C)`);

    if (!window.plotData) window.plotData = {};
    window.plotData.temp_surface = T0;
    window.plotData.temp_surface_c = T0 - CONST.KELVIN_TO_CELSIUS;
    DATA['🧮']['🧮🌡️'] = T0;

    window.showSpectralBackground = true;
    window.spectralConverged = true;
    window.spectralPrecisionTarget = 'max';
    setTimeout(() => {
                const canvas = document.getElementById('spectral-visualization');
                if (canvas) {
                    canvas.style.setProperty('display', 'block', 'important');
                    canvas.style.setProperty('visibility', 'visible', 'important');
                    canvas.style.setProperty('opacity', '1', 'important');
                    canvas.style.setProperty('z-index', '1', 'important');
                    canvas.style.setProperty('position', 'absolute', 'important');
                }
                // Créer un objet avec les données nécessaires pour la visualisation
                const spectralData = {
                    upward_flux: upward_flux,
                    lambda_range: lambda_range,
                    z_range: z_range
                };
                // 🔒 Recalculer avec précision maximale (1px) à la fin
                window.updateSpectralVisualization(spectralData);
    }, 150);

    return {
        lambda_range: lambda_range,
        lambda_weights: lambda_weights, // ⚡ Nécessaire pour normalisation correcte dans plot.js
        z_range: z_range,
        upward_flux: upward_flux,
        optical_thickness: optical_thickness,
        emitted_flux: emitted_flux,
        absorbed_flux: absorbed_flux,
        earth_flux: earth_flux,
        total_flux: total_flux,
        effective_temperature: effective_temperature,
        albedo: albedo,
        cloud_coverage: cloud_coverage,
        T0: T0, // 🔒 Température de surface (K) - nécessaire pour updateH2OLevelDirect
        temp_surface: T0, // 🔒 Alias pour compatibilité
        temp_surface_c: T0 - CONST.KELVIN_TO_CELSIUS // 🔒 Température de surface (°C) - nécessaire pour updateH2OLevelDirect
    };
}

// ============================================================================
// EXPORT POUR UTILISATION
// ============================================================================

window.temperatureAtZ = temperatureAtZ;
window.simulateRadiativeTransfer = simulateRadiativeTransfer;
