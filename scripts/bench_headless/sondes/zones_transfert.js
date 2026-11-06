// File: CO2/scripts/bench_headless/sondes/zones_transfert.js
// Desc: SONDE « un transfert par zone » : OLR = Σ_z f_z OLR_z, chaque zone du bilan méridien (EARTH.ZONES) à sa température de
//       surface T̄ − dT_z (MERIDIEN.ecarts), avec l'humidité que la physique du modèle donne à cette température
//       (calculateH2OParameters), contre la colonne unique de la surface moyenne et contre CERES (data/controles_mesures.js).
//       📱 à la T mesurée (graine 📜🌡️🧮) ; ciel clair (fractions de nuages à 0) et tous ciels ; stratosphère figée (sonde).
//       Usage : python3 scripts/bench_headless/run.py scripts/bench_headless/sondes/zones_transfert.js --timeout 1800
// Version 1.0.0
// Date: [November 6, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__ = 'start'; window.__R6__ = []; window.__ERR__ = null;
(async () => { try {
    const api = window.getBilanRadiatifAPI(function () {}), D = window.DATA, C = window.CONST, M = window.CONTROLES_MESURES;
    window.CLICS.frise('📱'); await api.run({ epochId: '📱', animEnabled: false });
    const T0 = D['📜']['🌡️🧮'], N = window.EARTH.NUAGES, CS = D['🎚️'].CLOUD_SW, f0 = { b: CS.F_BAS, m: N.F_MOYEN, h: CS.F_HAUT };
    const pin = (T) => { D['🧮']['🧮🌡️'] = T; D['🧮']['🧮🌡️⏮'] = T; D['🧮']['🧮🌡️🚩'] = T; };
    const preparer = (T) => { pin(T); window.ATM.calculateAtmosphereComposition(); window.ATM.updateAtmosphereHeightFromCurrentT();
        window.H2O._lastH2OParamsCache = null; window.H2O.calculateH2OParameters(); };
    for (let k = 0; k < 4; k++) { preparer(T0); window.ALBEDO.calculateAlbedo(); pin(T0); await window.calculateFluxForT0(); }   // état global, stratosphère à l'équilibre
    const dT = window.MERIDIEN.ecarts();
    const olr = async (T, clair) => {
        if (clair) { CS.F_BAS = 0; N.F_MOYEN = 0; CS.F_HAUT = 0; }
        preparer(T); pin(T); await window.calculateFluxForT0(null, true);
        CS.F_BAS = f0.b; N.F_MOYEN = f0.m; CS.F_HAUT = f0.h;
        const pr = window.RADIATIVE.profilAtmosphere(D['📊'].z_range); let pwv = 0;
        for (const c of pr.couches) pwv += c.n_H2O * c.delta_z_real * C.M_H2O * C.BOLTZMANN_KB / C.R_GAS;
        return { olr: D['📊'].total_flux, pwv: pwv };
    };
    const r = (x) => +x.toFixed(2), zones = [];
    let clair = 0, tous = 0, pwv = 0;
    for (const z of window.EARTH.ZONES) {
        const Tz = T0 - dT[z.cle]; window.__PROG__ = 'zone ' + z.cle;
        const c = await olr(Tz, true), t = await olr(Tz, false);
        clair += z.f * c.olr; tous += z.f * t.olr; pwv += z.f * c.pwv;
        zones.push({ zone: z.cle, f: r(z.f), T_C: r(Tz - C.T0_WATER), olrClair: r(c.olr), olrTous: r(t.olr), pwv: r(c.pwv) });
    }
    const gc = await olr(T0, true), gt = await olr(T0, false);
    window.__R6__.push({ T_C: r(T0 - C.T0_WATER), zones: zones,
        zones_olrClair: r(clair), zones_olrTous: r(tous), zones_pwv: r(pwv),
        colonne_olrClair: r(gc.olr), colonne_olrTous: r(gt.olr), colonne_pwv: r(gc.pwv),
        ceres_olrClair_modele: r(M.ceres.olrClair + M.cielClairModele.dOlrClair), ceres_olr: M.ceres.olr });
    window.__PROG__ = 'done';
} catch (e) { window.__ERR__ = String(e && e.stack || e); window.__PROG__ = 'error'; } })();
'launched'
