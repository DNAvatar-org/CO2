// File: hitran.js - Formules HITRAN (Q(T), S(T), γ(T,P), Voigt)
// Desc: En français, module de calcul LBL selon doc/HITRAN.txt (sections efficaces à partir des lignes).
// Version 1.1.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: 2025-02-06
// Logs:
// - Initial: Q(T), S(T), γ_air/γ_self, γ_L total, γ_D, Voigt (réf. doc/HITRAN.txt).
// - v1.1: crossSectionCO2/H2O/CH4FromLines(λ,T,P), getLinesInRange, données window.HITRAN_LINES_*.

(function (global) {
    'use strict';

    var CONST = global.CONST;
    if (!CONST) {
        console.error('[hitran.js] CONST non défini (charger physics.js avant hitran.js)');
    }

    // --- Constantes HITRAN (doc/HITRAN.txt) ---
    var HITRAN_C2_CMK = 1.4388;           // c₂ = hc/k ≈ 1.4388 cm·K
    var HITRAN_T_REF_K = 296;             // T_ref typique HITRAN (K)
    var HITRAN_P_REF_ATM = 1;             // 1 atm
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
     * Fonction de partition Q(T). HITRAN fournit polynômes/tables.
     * Placeholder : retourne 1 (sera remplacé par tables ou formules par isotopologue quand lignes chargées).
     */
    function partitionFunctionQ(T_K) {
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
    function crossSectionFromLines(lines, lambda_m, T_K, P_Pa, M_kg_mol, X_self) {
        var nu_cm = wavelengthToWavenumber(lambda_m);
        var inRange = getLinesInRange(lines, nu_cm, HALF_WINDOW_CM);
        var Q_ref = partitionFunctionQ(HITRAN_T_REF_K);
        var Q_T = partitionFunctionQ(T_K);
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
        return crossSectionFromLines(lines, lambda_m, T_K, P_Pa, CONST.M_CO2, 0);
    }

    function crossSectionH2OFromLines(lambda_m, T_K, P_Pa, X_self) {
        var lines = getSortedLines("H2O");
        var x = X_self;
        if (x === undefined) x = 0;
        return crossSectionFromLines(lines, lambda_m, T_K, P_Pa, CONST.M_H2O, x);
    }

    function crossSectionCH4FromLines(lambda_m, T_K, P_Pa) {
        var lines = getSortedLines("CH4");
        return crossSectionFromLines(lines, lambda_m, T_K, P_Pa, CONST.M_CH4, 0);
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

})(typeof window !== 'undefined' ? window : this);
