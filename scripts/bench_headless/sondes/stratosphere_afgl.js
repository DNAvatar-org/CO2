// File: CO2/scripts/bench_headless/sondes/stratosphere_afgl.js
// Desc: SONDE du poids de la STRATOSPHÈRE simplifiée du modèle : un même profil AFGL (Anderson et al. 1986, tropical et été des
//       latitudes moyennes) passé dans le transfert, en ciel clair, avec :
//         V0 sa vraie stratosphère ;  V1 isotherme à la température de sa tropopause, ozone réel ;
//         V2 isotherme à la tropopause, ozone de la même colonne mais mélangé à rapport constant au-dessus de la tropopause ;
//         V3 comme V2, isotherme à la température d'équilibre de la stratosphère du modèle (📱).
//       Tropopause : plus bas niveau au-dessus de 5 km où le gradient tombe sous 2 K/km (définition OMM). CO₂ 364 ppm ; H₂O, CH₄,
//       N₂O des tables. V0 − V2 = ce que la stratosphère simplifiée retire à l'OLR.
//       Usage : python3 scripts/bench_headless/run.py scripts/bench_headless/sondes/stratosphere_afgl.js --timeout 3600
// Version 1.0.0
// Date: [November 6, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__ = 'start'; window.__R6__ = []; window.__ERR__ = null;
const AFGL = {"tropical":{"z":[0.0,1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0,12.0,13.0,14.0,15.0,16.0,17.0,18.0,19.0,20.0,21.0,22.0,23.0,24.0,25.0,27.5,30.0,32.5,35.0,37.5,40.0,42.5,45.0,47.5,50.0,55.0,60.0,65.0,70.0,75.0,80.0,85.0,90.0,95.0,100.0,105.0,110.0,115.0,120.0],"p":[1013.0,904.0,805.0,715.0,633.0,559.0,492.0,432.0,378.0,329.0,286.0,247.0,213.0,182.0,156.0,132.0,111.0,93.7,78.9,66.6,56.5,48.0,40.9,35.0,30.0,25.7,17.63,12.2,8.52,6.0,4.26,3.05,2.2,1.59,1.16,0.854,0.456,0.239,0.121,0.058,0.026,0.011,0.0044,0.00172,0.000688,0.000289,0.00013,6.47e-05,3.6e-05,2.25e-05],"t":[299.7,293.7,287.7,283.7,277.0,270.3,263.6,257.0,250.3,243.6,237.0,230.1,223.6,217.0,210.3,203.7,197.0,194.8,198.8,202.7,206.7,210.7,214.6,217.0,219.2,221.4,227.0,232.3,237.7,243.1,248.5,254.0,259.4,264.8,269.6,270.2,263.4,253.1,236.0,218.9,201.8,184.8,177.1,177.0,184.3,190.7,212.0,241.6,299.7,380.0],"H2O":[25900.0,19500.0,15300.0,8600.0,4440.0,3350.0,2100.0,1290.0,764.0,410.0,191.0,73.1,29.1,9.9,6.22,4.0,3.0,2.9,2.75,2.6,2.6,2.65,2.8,2.9,3.2,3.25,3.6,4.0,4.3,4.6,4.9,5.2,5.5,5.7,5.9,6.0,6.0,6.0,5.4,4.5,3.3,2.1,1.3,0.85,0.54,0.4,0.34,0.28,0.24,0.2],"O3":[0.0287,0.0315,0.0334,0.035,0.0356,0.0377,0.0399,0.0422,0.0447,0.05,0.0559,0.0661,0.0781,0.0929,0.105,0.126,0.144,0.25,0.5,0.95,1.4,1.8,2.4,3.4,4.3,5.4,7.8,9.3,9.85,9.7,8.8,7.5,5.9,4.5,3.45,2.8,1.8,1.1,0.65,0.3,0.18,0.33,0.5,0.52,0.5,0.4,0.2,0.05,0.005,0.0005],"N2O":[0.32,0.32,0.32,0.32,0.32,0.32,0.32,0.32,0.32,0.32,0.318,0.314,0.31,0.305,0.3,0.294,0.288,0.278,0.267,0.253,0.237,0.219,0.205,0.197,0.188,0.176,0.159,0.142,0.117,0.0928,0.0669,0.0451,0.0275,0.0159,0.00938,0.00475,0.003,0.00207,0.00151,0.00115,0.000889,0.000706,0.000572,0.000471,0.000393,0.000332,0.000284,0.000244,0.000212,0.000185],"CH4":[1.7,1.7,1.7,1.7,1.7,1.7,1.7,1.7,1.7,1.69,1.69,1.68,1.66,1.65,1.63,1.61,1.58,1.55,1.52,1.48,1.42,1.36,1.27,1.19,1.12,1.06,0.987,0.914,0.83,0.746,0.662,0.564,0.461,0.363,0.277,0.21,0.165,0.15,0.15,0.15,0.15,0.15,0.15,0.14,0.13,0.12,0.11,0.095,0.06,0.03]},"\u00e9t\u00e9 latitudes moyennes":{"z":[0.0,1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0,12.0,13.0,14.0,15.0,16.0,17.0,18.0,19.0,20.0,21.0,22.0,23.0,24.0,25.0,27.5,30.0,32.5,35.0,37.5,40.0,42.5,45.0,47.5,50.0,55.0,60.0,65.0,70.0,75.0,80.0,85.0,90.0,95.0,100.0,105.0,110.0,115.0,120.0],"p":[1013.0,902.0,802.0,710.0,628.0,554.0,487.0,426.0,372.0,324.0,281.0,243.0,209.0,179.0,153.0,130.0,111.0,95.0,81.2,69.5,59.5,51.0,43.7,37.6,32.2,27.7,19.1,13.2,9.3,6.52,4.64,3.33,2.41,1.76,1.29,0.951,0.515,0.272,0.139,0.067,0.03,0.012,0.00448,0.00164,0.000625,0.000258,0.000117,6.11e-05,3.56e-05,2.27e-05],"t":[294.2,289.7,285.2,279.2,273.2,267.2,261.2,254.7,248.2,241.7,235.3,228.8,222.3,215.8,215.7,215.7,215.7,215.7,216.8,217.9,219.2,220.4,221.6,222.8,223.9,225.1,228.5,233.7,239.0,245.2,251.3,257.5,263.7,269.9,275.2,275.7,269.3,257.1,240.1,218.1,196.1,174.1,165.1,165.0,178.3,190.5,222.2,262.4,316.8,380.0],"H2O":[18800.0,13800.0,9680.0,5980.0,3810.0,2230.0,1510.0,1020.0,646.0,413.0,247.0,95.6,29.4,8.0,5.0,3.4,3.3,3.2,3.15,3.2,3.3,3.45,3.6,3.85,4.0,4.2,4.45,4.7,4.85,4.95,5.0,5.1,5.3,5.45,5.5,5.5,5.35,5.0,4.4,3.7,2.95,2.1,1.33,0.85,0.54,0.4,0.34,0.28,0.24,0.2],"O3":[0.0302,0.0334,0.0369,0.0422,0.0482,0.0551,0.0641,0.0776,0.0913,0.111,0.13,0.179,0.223,0.3,0.44,0.5,0.6,0.7,1.0,1.5,2.0,2.4,2.9,3.4,4.0,4.8,6.0,7.0,8.1,8.9,8.7,7.55,5.9,4.5,3.5,2.8,1.8,1.3,0.8,0.4,0.19,0.2,0.57,0.75,0.7,0.4,0.2,0.05,0.005,0.0005],"N2O":[0.32,0.32,0.32,0.32,0.32,0.32,0.32,0.32,0.32,0.316,0.31,0.299,0.294,0.286,0.28,0.272,0.261,0.242,0.217,0.184,0.161,0.132,0.115,0.104,0.0962,0.0896,0.0801,0.067,0.0496,0.037,0.0252,0.0174,0.0116,0.00767,0.00532,0.00322,0.00203,0.0014,0.00102,0.000777,0.000626,0.000517,0.000435,0.000373,0.000324,0.000284,0.000252,0.000226,0.000204,0.000185],"CH4":[1.7,1.7,1.7,1.7,1.7,1.69,1.67,1.65,1.63,1.62,1.58,1.54,1.51,1.48,1.45,1.42,1.39,1.36,1.32,1.28,1.22,1.15,1.07,0.973,0.88,0.789,0.705,0.632,0.559,0.501,0.445,0.392,0.339,0.287,0.238,0.194,0.157,0.15,0.15,0.15,0.15,0.15,0.15,0.14,0.13,0.12,0.11,0.095,0.06,0.03]}};   // z [km], p [hPa], t [K], gaz [ppmv]
(async () => { try {
    const api = window.getBilanRadiatifAPI(function () {}), D = window.DATA, C = window.CONST;
    window.CLICS.frise('📱'); await api.run({ epochId: '📱', animEnabled: false });
    const Tmodele = D['🫧']['🌡️🫧🛩'][0], co2 = 364e-6, bins = 2000;   // Tmodele : 1ʳᵉ couche, celle de la tropopause
    window.CONFIG_COMPUTE.maxSpectralBinsConvergence = bins;
    let A = null;
    const interp = (zkm, f, log) => {
        let i = 0; while (i < f.length - 2 && A.z[i + 1] < zkm) i++;
        const u = Math.max(0, Math.min(1, (zkm - A.z[i]) / (A.z[i + 1] - A.z[i])));
        const g = (x) => Math.log(Math.max(x, 1e-30));
        return log ? Math.exp(g(f[i]) + u * (g(f[i + 1]) - g(f[i]))) : f[i] + u * (f[i + 1] - f[i]);
    };
    const variante = (B, mode) => {
        // tropopause OMM : premier niveau ≥ 5 km où −dT/dz < 2 K/km
        let it = B.z.findIndex((z, i) => z >= 5 && i + 1 < B.z.length && (B.t[i] - B.t[i + 1]) / (B.z[i + 1] - z) < 2);
        const zt = B.z[it], Tt = B.t[it];
        const V = { z: B.z, p: B.p, t: B.t.slice(), H2O: B.H2O, N2O: B.N2O, CH4: B.CH4, O3: B.O3.slice() };
        if (mode >= 1) V.t = B.t.map((t, i) => B.z[i] >= zt ? (mode === 3 ? Tmodele : Tt) : t);
        if (mode >= 2) {
            // même colonne d'O₃ au-dessus de la tropopause, rapport de mélange constant (colonne ∝ Σ x·n·dz = x·p_t/(m g))
            let col = 0, air = 0;
            for (let i = it; i + 1 < B.z.length; i++) {
                const dz = (B.z[i + 1] - B.z[i]) * 1000, n = B.p[i] * 100 / (C.BOLTZMANN_KB * B.t[i]);
                col += B.O3[i] * n * dz; air += n * dz;
            }
            const x = col / air;
            V.O3 = B.O3.map((o, i) => B.z[i] >= zt ? x : o);
        }
        return { V: V, zt: zt, Tt: Tt };
    };
    const profilOrigine = window.profilAtmosphere;
    window.profilAtmosphere = (z_range) => ({ iTrop: z_range.length, couches: z_range.map((z, i) => {
        const zkm = z / 1000, T = interp(zkm, A.t), P = interp(zkm, A.p, true) * 100, n = P / (C.BOLTZMANN_KB * T);
        const xv = interp(zkm, A.H2O, true) * 1e-6, dz = (i + 1 < z_range.length) ? z_range[i + 1] - z : z - z_range[i - 1];
        return window.coucheWorker(T, P, n, co2 * (1 - xv) * n, xv * n, interp(zkm, A.CH4, true) * 1e-6 * n, interp(zkm, A.O3, true) * 1e-6 * n,
            interp(zkm, A.N2O, true) * 1e-6 * n, xv, dz, 0);
    }) });
    const r = (x) => +x.toFixed(2);
    for (const nom of Object.keys(AFGL)) {
        const B = AFGL[nom], res = { profil: nom, Ts: B.t[0] };
        for (const mode of [0, 1, 2, 3]) {
            const v = variante(B, mode); A = v.V; window.__PROG__ = nom + ' V' + mode;
            D['🧮']['🧮🌡️'] = B.t[0]; D['🧮']['🔬🌈'] = bins;
            await window.calculateFluxForT0(null, true);
            res['V' + mode] = r(D['📊'].total_flux); res.zt = v.zt; res.Tt = v.Tt;
        }
        res.Tmodele = r(Tmodele); res.V0_moins_V2 = r(res.V0 - res.V2); res.V0_moins_V3 = r(res.V0 - res.V3);
        window.__R6__.push(res);
    }
    window.profilAtmosphere = profilOrigine;
    window.__PROG__ = 'done';
} catch (e) { window.__ERR__ = String(e && e.stack || e); window.__PROG__ = 'error'; } })();
'launched'
