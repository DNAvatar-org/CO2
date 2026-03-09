// File: API_BILAN/spectroscopy/hitran.js - Formules HITRAN (Q(T), S(T), γ(T,P), Voigt)
// Desc: En français, module de calcul LBL selon doc/HITRAN.txt (sections efficaces à partir des lignes).
// Version 1.1.1
// Date: 2025-02-06
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - Initial: Q(T), S(T), γ_air/γ_self, γ_L total, γ_D, Voigt (réf. doc/HITRAN.txt).
// - v1.1: crossSectionCO2/H2O/CH4FromLines(λ,T,P), getLinesInRange, données window.HITRAN_LINES_*.
// - v1.2: getSpectralBinBoundsFromHITRAN(λ_min,λ_max,T,P) → { stepMax_m, nMin } pour bornes bins.
// - v1.1.1: partitionFunctionQ(T,molecule) approx par molécule (CO2/H2O/CH4), crossSectionFromLines passe molecule
// - v1.3: getSpectralRegionBoundsFromHITRAN(λ_min,λ_max) → { bounds_m, weights } pour grille adaptative (bornes = plages réelles des lignes).

(function (global) {
    'use strict';

    var CONST = global.CONST;
    if (!CONST) {
        console.error('[hitran.js] CONST non défini (charger physics.js avant hitran.js)');
    }

    // --- Constantes HITRAN (doc/HITRAN.txt) ---
    // Credence T_ref/P_ref: ~90%. Plage lit. T_ref 273–300 K (HITRAN 296 K standard) ; P_ref 0.5–2 atm.
    var HITRAN_C2_CMK = 1.4388;           // c₂ = hc/k ≈ 1.4388 cm·K
    var HITRAN_T_REF_K = 296;             // T_ref typique HITRAN (K). Plage lit. 273–300 K.
    var HITRAN_P_REF_ATM = 1;             // 1 atm. Plage lit. 0.5–2 atm.
    var PA_PER_ATM = 101325;
    var SQRT_LN2 = Math.sqrt(Math.LN2);
    var SQRT_PI = Math.sqrt(Math.PI);

    /**
     * Longueur d'onde λ (m) → nombre d'onde ν (cm⁻¹).
     * ν = 1/λ_cm avec λ_cm = λ_m × 100 ⇒ ν = 1/(λ_m × 100) = 0.01/λ_m.
     */
    function wavelengthToWavenumber(lambda_m) {
        return 0.01 / lambda_m;
    }

    /**
     * Nombre d'onde ν (cm⁻¹) → longueur d'onde λ (m).
     * λ_cm = 1/ν ⇒ λ_m = λ_cm/100 = 0.01/ν.
     */
    function wavenumberToWavelength(nu_cm) {
        return 0.01 / nu_cm;
    }

    /**
     * Pression P (Pa) → P (atm).
     */
    function pressurePaToAtm(P_Pa) {
        return P_Pa / PA_PER_ATM;
    }

    /**
     * Fonction de partition Q(T) (approximation compacte par molécule).
     * Suffisant pour 200–400 K et diagnostic ; évite le placeholder Q=1 constant.
     */
    function partitionFunctionQ(T_K, molecule) {
        var x = T_K / HITRAN_T_REF_K;
        if (molecule === 'CO2') return 286.09 * x;
        if (molecule === 'H2O') return 174.58 * Math.pow(x, 1.5);
        if (molecule === 'CH4') return 590.40 * Math.pow(x, 1.5);
        return 1;
    }

    /**
     * Intensité de ligne S(T) (cm⁻¹/(molécule·cm⁻²)) à partir de S(T_ref).
     * S(T) = S(T_ref) * (Q_ref/Q(T)) * exp(-c2*E''*(1/T - 1/T_ref)) * (1 - exp(-c2*ν/T)) / (1 - exp(-c2*ν/T_ref))
     * Réf. doc/HITRAN.txt.
     */
    function lineIntensityS(T_K, S_ref, Q_ref, Q_T, E_lower_cm, nu_ij_cm, T_ref_K) {
        var c2 = HITRAN_C2_CMK;
        var ratioQ = Q_ref / Q_T;
        var expBoltzmann = Math.exp(-c2 * E_lower_cm * (1 / T_K - 1 / T_ref_K));
        var expNuRef = Math.exp(-c2 * nu_ij_cm / T_ref_K);
        var expNuT = Math.exp(-c2 * nu_ij_cm / T_K);
        var ratioStimulated = (1 - expNuT) / (1 - expNuRef);
        return S_ref * ratioQ * expBoltzmann * ratioStimulated;
    }

    /**
     * Largeur Lorentz air : γ_air(T) = γ_air(T_ref) * (T_ref/T)^n_air. (cm⁻¹/atm)
     */
    function gammaLorentzAir(T_K, gamma_air_ref, n_air, T_ref_K) {
        return gamma_air_ref * Math.pow(T_ref_K / T_K, n_air);
    }

    /**
     * Largeur Lorentz self : γ_self(T) = γ_self(T_ref) * (T_ref/T)^n_self. (cm⁻¹/atm)
     */
    function gammaLorentzSelf(T_K, gamma_self_ref, n_self, T_ref_K) {
        return gamma_self_ref * Math.pow(T_ref_K / T_K, n_self);
    }

    /**
     * Largeur Lorentz totale : γ_L = P * [X_self*γ_self(T) + X_air*γ_air(T)].
     * P en atm, X_self + X_air = 1. Résultat en cm⁻¹.
     */
    function gammaLorentzTotal(P_atm, gamma_air_T, gamma_self_T, X_self, X_air) {
        return P_atm * (X_self * gamma_self_T + X_air * gamma_air_T);
    }

    /**
     * Largeur Doppler (HWHM) en cm⁻¹ : γ_D ≈ 3.58e-7 * ν * √(T/M).
     * ν en cm⁻¹, T en K, M en kg/mol. Réf. doc/HITRAN.txt.
     */
    function gammaDoppler(nu_cm, T_K, M_kg_mol) {
        return 3.58e-7 * nu_cm * Math.sqrt(T_K / M_kg_mol);
    }

    /**
     * Réel de la Faddeeva w(z), z = x + i*y. Approximation rationnelle (style Humlíček).
     * Utilisée pour Voigt normalisée : V(Δν) = Re(w(z)) / (γ_D * √π), z = (Δν + i*γ_L)/γ_D.
     */
    function faddeevaRe(x, y) {
        if (y < 1e-12) return Math.exp(-x * x);
        var s = Math.abs(x) + y;
        if (s > 15) return y / (x * x + y * y);
        var a = 1 / (4 * SQRT_PI);
        var b = [0.5, 1.5, 2.5, 3.5];
        var reW = 0;
        for (var i = 0; i < 4; i++) {
            var d = (b[i] - x) * (b[i] - x) + y * y;
            reW += a * (b[i] - x) / d;
        }
        return reW;
    }

    /**
     * Profil Voigt normalisé : ∫ f(Δν) dν = 1.
     * f(Δν) = Re(w(z)) / (γ_D * √π), z = (Δν + i*γ_L)/γ_D.
     * Δν, γ_L, γ_D en cm⁻¹. Retourne f en 1/cm⁻¹.
     */
    function voigtNormalized(delta_nu_cm, gamma_L_cm, gamma_D_cm) {
        if (gamma_D_cm < 1e-15 * gamma_L_cm) {
            return (gamma_L_cm / Math.PI) / (delta_nu_cm * delta_nu_cm + gamma_L_cm * gamma_L_cm);
        }
        if (gamma_L_cm < 1e-15 * gamma_D_cm) {
            var x = delta_nu_cm / gamma_D_cm;
            return Math.exp(-x * x) / (gamma_D_cm * SQRT_PI);
        }
        var x = delta_nu_cm / gamma_D_cm;
        var y = gamma_L_cm / gamma_D_cm;
        var reW = faddeevaRe(x, y);
        return reW / (gamma_D_cm * SQRT_PI);
    }

    /**
     * Contribution d'une ligne à la section efficace σ(ν) en cm²/molécule.
     * σ_line = S(T) * f(ν - ν_i) avec f = Voigt normalisée.
     * delta_nu = ν - ν_line (cm⁻¹), autres paramètres déjà scalés (S en cm⁻¹/(mol·cm⁻²), f en 1/cm⁻¹ → σ en cm²/mol).
     */
    function lineCrossSectionCm2(S_T, delta_nu_cm, gamma_L_cm, gamma_D_cm) {
        var f = voigtNormalized(delta_nu_cm, gamma_L_cm, gamma_D_cm);
        return S_T * f;
    }

    /**
     * Convertit σ en cm²/molécule → m²/molécule (pour cohérence avec calculations.js).
     */
    function sigmaCm2ToM2(sigma_cm2) {
        return sigma_cm2 * 1e-4;
    }

    // --- Sections efficaces à partir des lignes (données window.HITRAN_LINES_CO2 / H2O / CH4) ---
    var HALF_WINDOW_CM = 5;
    var _sortedCache = { CO2: null, H2O: null, CH4: null };

    function getSortedLines(key) {
        var cache = _sortedCache[key];
        if (cache) return cache;
        var raw = global["HITRAN_LINES_" + key];
        var arr = raw.slice(0);
        arr.sort(function (a, b) { return a.nu - b.nu; });
        _sortedCache[key] = arr;
        return arr;
    }

    function binarySearchGe(arr, nu_cm) {
        var lo = 0;
        var hi = arr.length;
        while (lo < hi) {
            var mid = (lo + hi) >>> 1;
            if (arr[mid].nu < nu_cm) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    function getLinesInRange(sorted, nu_cm, halfWindowCm) {
        var nuMin = nu_cm - halfWindowCm;
        var nuMax = nu_cm + halfWindowCm;
        var i0 = binarySearchGe(sorted, nuMin);
        var i1 = binarySearchGe(sorted, nuMax + 1e-9);
        var out = [];
        for (var i = i0; i < i1; i++) out.push(sorted[i]);
        return out;
    }

    /**
     * Section efficace σ(λ, T, P) en m²/molécule à partir des lignes (réf. doc/HITRAN.txt).
     * lines = tableau de lignes { nu, sw, elower, gamma_air, gamma_self, n_air, delta_air }.
     * X_self = fraction molaire du gaz (0 pour CO2/CH4 en air, >0 pour H2O humide). n_self non dans JSON → on utilise n_air.
     */
    function crossSectionFromLines(lines, lambda_m, T_K, P_Pa, M_kg_mol, X_self, molecule) {
        var nu_cm = wavelengthToWavenumber(lambda_m);
        var inRange = getLinesInRange(lines, nu_cm, HALF_WINDOW_CM);
        var Q_ref = partitionFunctionQ(HITRAN_T_REF_K, molecule);
        var Q_T = partitionFunctionQ(T_K, molecule);
        var P_atm = pressurePaToAtm(P_Pa);
        var X_air = 1 - X_self;
        var sum_cm2 = 0;
        for (var k = 0; k < inRange.length; k++) {
            var line = inRange[k];
            var S_T = lineIntensityS(T_K, line.sw, Q_ref, Q_T, line.elower, line.nu, HITRAN_T_REF_K);
            var g_air_T = gammaLorentzAir(T_K, line.gamma_air, line.n_air, HITRAN_T_REF_K);
            var g_self_T = gammaLorentzSelf(T_K, line.gamma_self, line.n_air, HITRAN_T_REF_K);
            var gamma_L = gammaLorentzTotal(P_atm, g_air_T, g_self_T, X_self, X_air);
            var gamma_D = gammaDoppler(line.nu, T_K, M_kg_mol);
            var delta_nu = nu_cm - line.nu;
            sum_cm2 += lineCrossSectionCm2(S_T, delta_nu, gamma_L, gamma_D);
        }
        return sigmaCm2ToM2(sum_cm2);
    }

    function crossSectionCO2FromLines(lambda_m, T_K, P_Pa) {
        var lines = getSortedLines("CO2");
        return crossSectionFromLines(lines, lambda_m, T_K, P_Pa, CONST.M_CO2, 0, 'CO2');
    }

    function crossSectionH2OFromLines(lambda_m, T_K, P_Pa, X_self) {
        var lines = getSortedLines("H2O");
        var x = X_self;
        if (x === undefined) x = 0;
        return crossSectionFromLines(lines, lambda_m, T_K, P_Pa, CONST.M_H2O, x, 'H2O');
    }

    function crossSectionCH4FromLines(lambda_m, T_K, P_Pa) {
        var lines = getSortedLines("CH4");
        return crossSectionFromLines(lines, lambda_m, T_K, P_Pa, CONST.M_CH4, 0, 'CH4');
    }

    /**
     * Bornes min/max de bins spectaux dérivées des largeurs de raie HITRAN (CO2, H2O, CH4).
     * Parcourt les lignes dans [lambda_min_m, lambda_max_m], estime la largeur (γ_L + γ_D) en cm⁻¹,
     * convertit en Δλ (m), garde le min → step_max_m. N_min = span / step_max_m.
     * T_K, P_Pa : référence pour γ (ex. 296 K, 1 atm). Retourne { stepMax_m, nMin } ou null si lignes indisponibles.
     */
    function getSpectralBinBoundsFromHITRAN(lambda_min_m, lambda_max_m, T_K, P_Pa) {
        if (!CONST || !global.HITRAN_LINES_CO2) return null;
        var nu_max_cm = wavelengthToWavenumber(lambda_min_m);
        var nu_min_cm = wavelengthToWavenumber(lambda_max_m);
        if (nu_min_cm >= nu_max_cm) return null;
        var P_atm = pressurePaToAtm(P_Pa);
        var step_min_m = Infinity;
        var gases = [
            { key: 'CO2', M: CONST.M_CO2, X_self: 0 },
            { key: 'H2O', M: CONST.M_H2O, X_self: 0.01 },
            { key: 'CH4', M: CONST.M_CH4, X_self: 0 }
        ];
        for (var g = 0; g < gases.length; g++) {
            var lines = getSortedLines(gases[g].key);
            if (!lines || lines.length === 0) continue;
            var X_air = 1 - gases[g].X_self;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.nu < nu_min_cm || line.nu > nu_max_cm) continue;
                var g_air_T = gammaLorentzAir(T_K, line.gamma_air, line.n_air, HITRAN_T_REF_K);
                var g_self_T = gammaLorentzSelf(T_K, line.gamma_self, line.n_air, HITRAN_T_REF_K);
                var gamma_L = gammaLorentzTotal(P_atm, g_air_T, g_self_T, gases[g].X_self, X_air);
                var gamma_D = gammaDoppler(line.nu, T_K, gases[g].M);
                var halfWidth_cm = gamma_L + gamma_D;
                var lambda_m = wavenumberToWavelength(line.nu);
                var delta_lambda_m = 100 * lambda_m * lambda_m * halfWidth_cm;
                if (delta_lambda_m > 0 && delta_lambda_m < step_min_m) step_min_m = delta_lambda_m;
            }
        }
        if (!isFinite(step_min_m) || step_min_m <= 0) return null;
        var span_m = lambda_max_m - lambda_min_m;
        var nMin = Math.max(2, Math.ceil(span_m / step_min_m));
        return { stepMax_m: step_min_m, nMin: nMin };
    }

    /**
     * Bornes de régions spectrales dérivées des plages réelles des lignes HITRAN (CO2, H2O, CH4).
     * Chaque gaz donne un intervalle [min λ, max λ] où il a des lignes ; on fusionne et trie pour obtenir
     * une liste de bornes. Les poids sont proportionnels au nombre de lignes dans chaque région (plus de lignes → résolution plus fine).
     * Retourne { bounds_m: number[], weights: number[] } ou null si lignes indisponibles.
     */
    function getSpectralRegionBoundsFromHITRAN(lambda_min_m, lambda_max_m) {
        if (!global.HITRAN_LINES_CO2) return null;
        var nu_max_cm = wavelengthToWavenumber(lambda_min_m);
        var nu_min_cm = wavelengthToWavenumber(lambda_max_m);
        if (nu_min_cm >= nu_max_cm) return null;
        var endpoints = [lambda_min_m, lambda_max_m];
        var gases = ['CO2', 'H2O', 'CH4'];
        for (var g = 0; g < gases.length; g++) {
            var lines = getSortedLines(gases[g]);
            if (!lines || lines.length === 0) continue;
            var nu_min = Infinity;
            var nu_max = -Infinity;
            for (var i = 0; i < lines.length; i++) {
                var nu = lines[i].nu;
                if (nu < nu_min_cm || nu > nu_max_cm) continue;
                if (nu < nu_min) nu_min = nu;
                if (nu > nu_max) nu_max = nu;
            }
            if (!isFinite(nu_min) || !isFinite(nu_max)) continue;
            var lam_min = wavenumberToWavelength(nu_max);
            var lam_max = wavenumberToWavelength(nu_min);
            endpoints.push(lam_min);
            endpoints.push(lam_max);
        }
        endpoints.sort(function (a, b) { return a - b; });
        var bounds_m = [endpoints[0]];
        for (var j = 1; j < endpoints.length; j++) {
            if (endpoints[j] - bounds_m[bounds_m.length - 1] > 1e-12) bounds_m.push(endpoints[j]);
        }
        if (bounds_m.length < 2) return null;
        var nRegions = bounds_m.length - 1;
        var weights = [];
        for (var r = 0; r < nRegions; r++) {
            var r_min = bounds_m[r];
            var r_max = bounds_m[r + 1];
            var nu_r_max = wavelengthToWavenumber(r_min);
            var nu_r_min = wavelengthToWavenumber(r_max);
            var count = 0;
            for (var g = 0; g < gases.length; g++) {
                var lines = getSortedLines(gases[g]);
                if (!lines) continue;
                for (var i = 0; i < lines.length; i++) {
                    var nu = lines[i].nu;
                    if (nu >= nu_r_min && nu <= nu_r_max) count++;
                }
            }
            weights.push(count > 0 ? count : 1);
        }
        var sumW = weights.reduce(function (s, w) { return s + w; }, 0);
        for (var r = 0; r < weights.length; r++) weights[r] = weights[r] / sumW;
        return { bounds_m: bounds_m, weights: weights };
    }

    // Export global (pas de optional chaining, pas de return dans garde)
    global.HITRAN = global.HITRAN || {};
    global.HITRAN.C2_CMK = HITRAN_C2_CMK;
    global.HITRAN.T_REF_K = HITRAN_T_REF_K;
    global.HITRAN.P_REF_ATM = HITRAN_P_REF_ATM;
    global.HITRAN.wavelengthToWavenumber = wavelengthToWavenumber;
    global.HITRAN.wavenumberToWavelength = wavenumberToWavelength;
    global.HITRAN.pressurePaToAtm = pressurePaToAtm;
    global.HITRAN.partitionFunctionQ = partitionFunctionQ;
    global.HITRAN.lineIntensityS = lineIntensityS;
    global.HITRAN.gammaLorentzAir = gammaLorentzAir;
    global.HITRAN.gammaLorentzSelf = gammaLorentzSelf;
    global.HITRAN.gammaLorentzTotal = gammaLorentzTotal;
    global.HITRAN.gammaDoppler = gammaDoppler;
    global.HITRAN.voigtNormalized = voigtNormalized;
    global.HITRAN.lineCrossSectionCm2 = lineCrossSectionCm2;
    global.HITRAN.sigmaCm2ToM2 = sigmaCm2ToM2;
    global.HITRAN.faddeevaRe = faddeevaRe;
    global.HITRAN.crossSectionFromLines = crossSectionFromLines;
    global.HITRAN.crossSectionCO2FromLines = crossSectionCO2FromLines;
    global.HITRAN.crossSectionH2OFromLines = crossSectionH2OFromLines;
    global.HITRAN.crossSectionCH4FromLines = crossSectionCH4FromLines;
    global.HITRAN.getSpectralBinBoundsFromHITRAN = getSpectralBinBoundsFromHITRAN;
    global.HITRAN.getSpectralRegionBoundsFromHITRAN = getSpectralRegionBoundsFromHITRAN;

})(typeof window !== 'undefined' ? window : this);
