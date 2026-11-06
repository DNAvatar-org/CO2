// File: CO2/scripts/bench_headless/sondes/rtmip_mls.js
// Desc: SONDE de référence ciel clair : le transfert infrarouge du modèle sur le profil AFGL « été des latitudes moyennes »
//       (Anderson et al. 1986, AFGL-TR-86-0110, table 1b ; copie CSV du paquet joseki, nollety/joseki src/joseki/data/afgl_1986)
//       contre les forçages raie par raie de RTMIP (Collins et al. 2006, J. Geophys. Res. 111:D14317, table 8, sommet « TOM »,
//       moyenne ± écart-type des codes LBL) : surface 294 K d'émissivité 1, sans nuages, sans CH₄ ni N₂O, forçages INSTANTANÉS.
//         2a−1a CO₂ 287 → 369 ppm : 1,01 ± 0,02 W/m²     2b−1a CO₂ 287 → 574 : 2,80 ± 0,06     4a−2b H₂O × 1,2 : 3,78 ± 0,09
//       Le profil du modèle est remplacé (window.profilAtmosphere) par AFGL interpolé sur la grille verticale du transfert ;
//       la stratosphère n'est pas ajustée (sonde). Deux résolutions spectrales : 2000 et 6000 points.
//       Usage : python3 scripts/bench_headless/run.py scripts/bench_headless/sondes/rtmip_mls.js --timeout 3600
// Version 1.0.0
// Date: [November 6, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__ = 'start'; window.__R6__ = []; window.__ERR__ = null;
const AFGL_MLS = {"z":[0.0,1.0,2.0,3.0,4.0,5.0,6.0,7.0,8.0,9.0,10.0,11.0,12.0,13.0,14.0,15.0,16.0,17.0,18.0,19.0,20.0,21.0,22.0,23.0,24.0,25.0,27.5,30.0,32.5,35.0,37.5,40.0,42.5,45.0,47.5,50.0,55.0,60.0,65.0,70.0,75.0,80.0,85.0,90.0,95.0,100.0,105.0,110.0,115.0,120.0],"p":[1013.0,902.0,802.0,710.0,628.0,554.0,487.0,426.0,372.0,324.0,281.0,243.0,209.0,179.0,153.0,130.0,111.0,95.0,81.2,69.5,59.5,51.0,43.7,37.6,32.2,27.7,19.1,13.2,9.3,6.52,4.64,3.33,2.41,1.76,1.29,0.951,0.515,0.272,0.139,0.067,0.03,0.012,0.00448,0.00164,0.000625,0.000258,0.000117,6.11e-05,3.56e-05,2.27e-05],"t":[294.2,289.7,285.2,279.2,273.2,267.2,261.2,254.7,248.2,241.7,235.3,228.8,222.3,215.8,215.7,215.7,215.7,215.7,216.8,217.9,219.2,220.4,221.6,222.8,223.9,225.1,228.5,233.7,239.0,245.2,251.3,257.5,263.7,269.9,275.2,275.7,269.3,257.1,240.1,218.1,196.1,174.1,165.1,165.0,178.3,190.5,222.2,262.4,316.8,380.0],"H2O":[18800.0,13800.0,9680.0,5980.0,3810.0,2230.0,1510.0,1020.0,646.0,413.0,247.0,95.6,29.4,8.0,5.0,3.4,3.3,3.2,3.15,3.2,3.3,3.45,3.6,3.85,4.0,4.2,4.45,4.7,4.85,4.95,5.0,5.1,5.3,5.45,5.5,5.5,5.35,5.0,4.4,3.7,2.95,2.1,1.33,0.85,0.54,0.4,0.34,0.28,0.24,0.2],"O3":[0.0302,0.0334,0.0369,0.0422,0.0482,0.0551,0.0641,0.0776,0.0913,0.111,0.13,0.179,0.223,0.3,0.44,0.5,0.6,0.7,1.0,1.5,2.0,2.4,2.9,3.4,4.0,4.8,6.0,7.0,8.1,8.9,8.7,7.55,5.9,4.5,3.5,2.8,1.8,1.3,0.8,0.4,0.19,0.2,0.57,0.75,0.7,0.4,0.2,0.05,0.005,0.0005]};   // z [km], p [hPa], t [K], H2O et O3 [ppmv]
(async () => { try {
    const api = window.getBilanRadiatifAPI(function () {}), D = window.DATA, C = window.CONST;
    window.CLICS.frise('📱'); await api.run({ epochId: '📱', animEnabled: false });
    const A = AFGL_MLS, nA = A.z.length;
    const interp = (zkm, f, log) => {
        let i = 0; while (i < nA - 2 && A.z[i + 1] < zkm) i++;
        const u = Math.max(0, Math.min(1, (zkm - A.z[i]) / (A.z[i + 1] - A.z[i])));
        return log ? Math.exp(Math.log(f[i]) + u * (Math.log(f[i + 1]) - Math.log(f[i]))) : f[i] + u * (f[i + 1] - f[i]);
    };
    let co2 = 287e-6, h2oMult = 1, pwv = 0;
    const profilOrigine = window.profilAtmosphere;
    window.profilAtmosphere = (z_range) => {
        pwv = 0;
        const couches = z_range.map((z, i) => {
            const zkm = z / 1000, T = interp(zkm, A.t), P = interp(zkm, A.p, true) * 100;
            const n = P / (C.BOLTZMANN_KB * T), xv = interp(zkm, A.H2O, true) * 1e-6 * h2oMult, xo = interp(zkm, A.O3, true) * 1e-6;
            const dz = (i + 1 < z_range.length) ? z_range[i + 1] - z : z - z_range[i - 1];
            pwv += xv * n * dz * C.M_H2O * C.BOLTZMANN_KB / C.R_GAS;
            return window.coucheWorker(T, P, n, co2 * (1 - xv) * n, xv * n, 0, xo * n, 0, xv, dz, 0);   // RTMIP : ni CH₄ ni N₂O
        });
        return { couches: couches, iTrop: z_range.length };
    };
    D['🧮']['🧮🌡️'] = A.t[0];
    for (const bins of [2000, 6000]) {
        window.CONFIG_COMPUTE.maxSpectralBinsConvergence = bins; D['🧮']['🔬🌈'] = bins;
        const olr = {};
        for (const [cas, c, h] of [['1a', 287e-6, 1], ['2a', 369e-6, 1], ['2b', 574e-6, 1], ['4a', 574e-6, 1.2]]) {
            co2 = c; h2oMult = h; window.__PROG__ = bins + ' ' + cas;
            D['🧮']['🧮🌡️'] = A.t[0]; D['🧮']['🔬🌈'] = bins;
            await window.calculateFluxForT0(null, true);
            olr[cas] = D['📊'].total_flux;
            if (cas === '1a') olr.pwv1a = pwv;
        }
        const r = (x) => +x.toFixed(3);
        window.__R6__.push({ bins: bins, nbins: D['📊'].lambda_range.length, olr1a: r(olr['1a']), pwv_kg_m2: r(olr.pwv1a), sigmaT4: r(C.STEFAN_BOLTZMANN * Math.pow(A.t[0], 4)),
            forcages: [
                { cas: '2a-1a CO2 287->369', modele: r(olr['1a'] - olr['2a']), lbl: 1.01, sd: 0.02 },
                { cas: '2b-1a CO2 287->574', modele: r(olr['1a'] - olr['2b']), lbl: 2.80, sd: 0.06 },
                { cas: '4a-2b H2O x1.2', modele: r(olr['2b'] - olr['4a']), lbl: 3.78, sd: 0.09 }] });
    }
    window.profilAtmosphere = profilOrigine;
    window.__PROG__ = 'done';
} catch (e) { window.__ERR__ = String(e && e.stack || e); window.__PROG__ = 'error'; } })();
'launched'
