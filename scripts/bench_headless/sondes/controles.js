// File: CO2/scripts/bench_headless/sondes/controles.js
// Desc: SONDE « contrôles 📱 » : le modèle en face des mesures de API_BILAN/data/controles_mesures.js (CERES EBAF, eau
//       précipitable) et de data/isccp_h_2010.js (nuages vus d'en haut), à deux états de 📱 :
//         · « équilibre » : la température que le modèle trouve ;
//         · « T mesurée » : surface imposée à la graine de l'époque (📜🌡️🧮, milieu de la fourchette mesurée), stratosphère
//           laissée à son équilibre (4 transferts) — l'écart de flux y dit ce qui manque ou déborde, sans rétroaction.
//       Ciel clair « modèle » : nuages retirés de toutes les colonnes (fractions F_BAS, F_MOYEN, F_HAUT à 0, albédo et transfert
//       refaits), à comparer à CERES + correction de Kato et al. 2013 (CONTROLES_MESURES.cielClairModele).
//       Usage : python3 scripts/bench_headless/run.py scripts/bench_headless/sondes/controles.js --timeout 1800
// Version 1.0.0
// Date: [November 6, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__ = 'start'; window.__R6__ = []; window.__ERR__ = null;
(async () => { try {
    const api = window.getBilanRadiatifAPI(function () {}), D = window.DATA, C = window.CONST;
    const M = window.CONTROLES_MESURES, CE = M.ceres, KC = M.cielClairModele, IS = window.ISCCP_H_2010;
    const N = window.EARTH.NUAGES, CS = D['🎚️'].CLOUD_SW;
    window.CLICS.frise('📱'); await api.run({ epochId: '📱', animEnabled: false });
    const T_eq = D['🧮']['🧮🌡️'], T_mes = D['📜']['🌡️🧮'];
    const pin = (T) => { D['🧮']['🧮🌡️'] = T; D['🧮']['🧮🌡️⏮'] = T; D['🧮']['🧮🌡️🚩'] = T; };
    const evaluer = async (T, figer) => {
        pin(T); window.ATM.calculateAtmosphereComposition(); window.ATM.updateAtmosphereHeightFromCurrentT();
        window.H2O._lastH2OParamsCache = null; window.H2O.calculateH2OParameters(); window.ALBEDO.calculateAlbedo(); pin(T);
        await window.calculateFluxForT0(null, figer);
    };
    const etat = async (nom, T) => {
        for (let k = 0; k < 4; k++) await evaluer(T, false);          // la stratosphère converge à T fixée
        const S = D['☀️']['🧲☀️🎱'], A = D['🪩']['🍰🪩📿'], olr = D['📊'].total_flux;
        const pr = window.RADIATIVE.profilAtmosphere(D['📊'].z_range);
        let pwv = 0; for (const c of pr.couches) pwv += c.n_H2O * c.delta_z_real * C.M_H2O * C.BOLTZMANN_KB / C.R_GAS;
        const vu = D['🪩']['🪩👁'];
        const f0 = { b: CS.F_BAS, m: N.F_MOYEN, h: CS.F_HAUT };
        CS.F_BAS = 0; N.F_MOYEN = 0; CS.F_HAUT = 0;
        await evaluer(T, true);                                        // ciel clair « modèle », même stratosphère
        const Ac = D['🪩']['🍰🪩📿'], olrC = D['📊'].total_flux;
        CS.F_BAS = f0.b; N.F_MOYEN = f0.m; CS.F_HAUT = f0.h;
        await evaluer(T, true);
        const r = (x) => +x.toFixed(2);
        const lignes = [
            ['OLR tous ciels', olr, CE.olr],
            ['SW réfléchi', S * A, CE.swReflechi],
            ['albédo planétaire', A, CE.swReflechi / CE.solaire],
            ['OLR ciel clair (modèle)', olrC, CE.olrClair + KC.dOlrClair],
            ['SW clair réfléchi (modèle)', S * Ac, CE.swClair + KC.dSwClair],
            ['effet nuages LW', olrC - olr, CE.creLW + KC.dOlrClair],     // (olrClair + dOlrClair) − olr
            ['effet nuages SW', S * Ac - S * A, CE.creSW + KC.dSwClair],   // (swClair + dSwClair) − swReflechi
            ['eau précipitable kg/m²', pwv, (M.eauPrecipitable.min + M.eauPrecipitable.max) / 2],
            ['nuages vus total', vu.total.a, IS.total.a],
            ['nuages vus bas', vu.niveaux.L.a, IS.niveaux.L.a],
            ['nuages vus moyens', vu.niveaux.M.a, IS.niveaux.M.a],
            ['nuages vus hauts', vu.niveaux.H.a, IS.niveaux.H.a],
            ['τ vus hauts', vu.niveaux.H.tau, IS.niveaux.H.tau]
        ];
        window.__R6__.push({ etat: nom, T_C: r(T - C.T0_WATER), S: r(S), Tstrato: D['🫧']['🌡️🫧🛩'].map(r),
            controles: lignes.map(([q, mod, mes]) => ({ q, modele: r(mod), mesure: r(mes), ecart: r(mod - mes) })) });
    };
    await etat('T mesurée', T_mes);
    await etat('équilibre', T_eq);
    window.__PROG__ = 'done';
} catch (e) { window.__ERR__ = String(e && e.stack || e); window.__PROG__ = 'error'; } })();
'launched'
