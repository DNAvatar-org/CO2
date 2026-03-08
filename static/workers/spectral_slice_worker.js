// File: spectral_slice_worker.js - Tranche spectrale pour parallélisation (découpage bande λ)
// Desc: Tranche (lambda_range, layers) → transfert radiatif → total_flux_slice + upward_flux (toutes couches).
// Version 0.1.0 | Copyright 2025 DNAvatar.org - Arnaud Maignan | Apache 2.0 + Commons Clause.
// Logs: v0.1.0 découpe bande spectrale, planck inline, boucles trop/strat

'use strict';

var PLANCK_H = 6.62607015e-34;
var C_LIGHT = 2.998e8;
var BOLTZMANN_KB = 1.380649e-23;
var MAX_PLANCK_SAFE = 1e20;

function planck(lambda, T) {
    if (!Number.isFinite(lambda) || !Number.isFinite(T) || lambda <= 0 || T <= 0) return 0;
    var term1 = (2 * PLANCK_H * C_LIGHT * C_LIGHT) / Math.pow(lambda, 5);
    var term2 = Math.exp((PLANCK_H * C_LIGHT) / (lambda * BOLTZMANN_KB * T)) - 1;
    var B = (term2 > 0) ? term1 / term2 : 0;
    return (Number.isFinite(B) && B >= 0) ? Math.min(B, MAX_PLANCK_SAFE) : 0;
}

var TAU_EFF_MIN = 0;
var TAU_EFF_MAX = 700;
var MAX_FLUX_PER_BAND = 1e15;

function runSlice(p) {
    var lambda_range = p.lambda_range;
    var lambda_weights = p.lambda_weights;
    var cross_section_CO2 = p.cross_section_CO2;
    var cross_section_H2O = p.cross_section_H2O;
    var cross_section_CH4 = p.cross_section_CH4;
    var earth_flux = p.earth_flux;
    var layers = p.layers;
    var i_trop = p.i_trop;
    var h2o_eds_scale = p.h2o_eds_scale;
    var tau_cloud_per_layer = p.tau_cloud_per_layer || 0;
    var effective_delta_lambda = p.effective_delta_lambda;
    var T_surf = p.T_surf;
    var nL = lambda_range.length;
    var nZ = layers.length;

    var flux_in = earth_flux.slice();
    var upward_flux = [];
    for (var i = 0; i < nZ; i++) upward_flux.push(new Array(nL).fill(0));

    var sum_blocked_CO2 = 0, sum_blocked_H2O = 0, sum_blocked_CH4 = 0, sum_blocked_clouds = 0;

    for (var i = 0; i < nZ; i++) {
        var L = layers[i];
        var n_air = L.n_air, n_CO2 = L.n_CO2, n_H2O = L.n_H2O, n_CH4 = L.n_CH4;
        var T = L.T;
        var delta_z_real = L.delta_z_real;
        var sigma_broad = L.pressureBroadening;
        var is_trop = (i < i_trop);
        var tau_cloud_layer = is_trop ? tau_cloud_per_layer : 0;

        for (var j = 0; j < nL; j++) {
            var lambda = lambda_range[j];
            var kappa_CO2 = (Number.isFinite(n_CO2) && cross_section_CO2[j] != null) ? cross_section_CO2[j] * sigma_broad * n_CO2 : 0;
            var kappa_H2O_raw = (Number.isFinite(n_H2O) && cross_section_H2O[j] != null) ? cross_section_H2O[j] * sigma_broad * n_H2O : 0;
            var kappa_H2O = kappa_H2O_raw * h2o_eds_scale;
            var kappa_CH4 = (Number.isFinite(n_CH4) && cross_section_CH4[j] != null) ? cross_section_CH4[j] * sigma_broad * n_CH4 : 0;
            var kappa = kappa_CO2 + kappa_H2O + kappa_CH4;
            var tau_raw = kappa * delta_z_real + tau_cloud_layer;
            var tau = (Number.isFinite(tau_raw) && tau_raw >= 0) ? Math.min(Math.max(tau_raw, TAU_EFF_MIN), TAU_EFF_MAX) : 0;
            var transmission = Math.exp(-tau);
            var emissivity = 1 - transmission;

            var has_absorption = (n_CO2 > 0) || (n_H2O > 1e-10) || (n_CH4 > 1e-10) || (tau_cloud_layer > 1e-10);
            if (!has_absorption) {
                upward_flux[i][j] = Math.max(-MAX_FLUX_PER_BAND, Math.min(MAX_FLUX_PER_BAND, flux_in[j]));
            } else {
                var em_flux = emissivity * Math.PI * planck(lambda, T) * effective_delta_lambda * lambda_weights[j];
                var out = flux_in[j] * transmission + em_flux;
                if (!Number.isFinite(out)) out = flux_in[j];
                upward_flux[i][j] = Math.max(-MAX_FLUX_PER_BAND, Math.min(MAX_FLUX_PER_BAND, out));
                var tau_CO2 = Math.max(0, kappa_CO2 * delta_z_real);
                var tau_H2O = Math.max(0, kappa_H2O * delta_z_real);
                var tau_CH4 = Math.max(0, kappa_CH4 * delta_z_real);
                sum_blocked_CO2 += flux_in[j] * (1 - Math.exp(-tau_CO2));
                sum_blocked_H2O += flux_in[j] * (1 - Math.exp(-tau_H2O));
                sum_blocked_CH4 += flux_in[j] * (1 - Math.exp(-tau_CH4));
                sum_blocked_clouds += flux_in[j] * (1 - Math.exp(-tau_cloud_layer));
            }
            flux_in[j] = upward_flux[i][j];
        }
    }

    var topFlux = upward_flux[nZ - 1];
    var total_flux_slice = topFlux.reduce(function (s, v) { return s + v; }, 0);
    return {
        id: p.id,
        total_flux_slice: total_flux_slice,
        upward_flux: upward_flux,
        sum_blocked_CO2: sum_blocked_CO2,
        sum_blocked_H2O: sum_blocked_H2O,
        sum_blocked_CH4: sum_blocked_CH4,
        sum_blocked_clouds: sum_blocked_clouds
    };
}

self.onmessage = function (e) {
    var msg = e.data;
    if (msg && msg.type === 'slice') {
        try {
            var result = runSlice(msg);
            self.postMessage({ type: 'sliceResult', result: result });
        } catch (err) {
            self.postMessage({ type: 'sliceError', id: msg.id, error: String(err) });
        }
    }
};
