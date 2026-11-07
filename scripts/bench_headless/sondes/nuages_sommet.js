// File: CO2/scripts/bench_headless/sondes/nuages_sommet.js
// Desc: SONDE des effets des nuages par type de SOMMET (classes exclusives comme CloudSat/CALIPSO, Hang 2016 table 5.1) sur 📱 à la
//       température mesurée : le mélange des sous-colonnes étant linéaire en chaque fraction, la classe « haut » = fH·(X(fH=1) − clair),
//       « moyen » = (1−fH)·fM·(X(fH=0, fM=1) − clair), « bas » = (1−fH)(1−fM)·fB·(X(0, 0, fB=1) − clair).
//       Usage : python3 scripts/bench_headless/run.py scripts/bench_headless/sondes/nuages_sommet.js --timeout 1800
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Date: [November 7, 2026]
window.__PROG__ = 'start'; window.__R6__ = []; window.__ERR__ = null;
(async () => { try {
    const api = window.getBilanRadiatifAPI(function () {}), D = window.DATA;
    window.CLICS.frise('📱'); await api.run({ epochId: '📱', animEnabled: false });
    const T0 = D['📜']['🌡️🧮'], N = window.EARTH.NUAGES, CS = D['🎚️'].CLOUD_SW, f0 = { b: CS.F_BAS, m: N.F_MOYEN, h: CS.F_HAUT };
    const pin = (T) => { D['🧮']['🧮🌡️'] = T; D['🧮']['🧮🌡️⏮'] = T; D['🧮']['🧮🌡️🚩'] = T; };
    const evaluer = async (figer) => { pin(T0); window.ATM.calculateAtmosphereComposition(); window.ATM.updateAtmosphereHeightFromCurrentT();
        window.H2O._lastH2OParamsCache = null; window.H2O.calculateH2OParameters(); window.ALBEDO.calculateAlbedo(); pin(T0);
        await window.calculateFluxForT0(null, figer); };
    for (let k = 0; k < 4; k++) await evaluer(false);
    const S = D['☀️']['🧲☀️🎱'];
    const etat = async (b, m, h) => { CS.F_BAS = b; N.F_MOYEN = m; CS.F_HAUT = h; await evaluer(true);
        const col = window.RADIATIVE.colonneNuageuse();
        const r = { sw: S * D['🪩']['🍰🪩📿'], olr: D['📊'].total_flux, fB: col.fBas, fM: col.fMoyen, fH: col.fHaut };
        CS.F_BAS = f0.b; N.F_MOYEN = f0.m; CS.F_HAUT = f0.h; return r; };
    const r2 = (x) => +x.toFixed(2), r3 = (x) => +x.toFixed(3);
    window.__PROG__ = 'tous'; const tous = await etat(f0.b, f0.m, f0.h);
    window.__PROG__ = 'clair'; const clair = await etat(0, 0, 0);
    window.__PROG__ = 'haut'; const H = await etat(f0.b, f0.m, 1);
    window.__PROG__ = 'moyen'; const M = await etat(f0.b, 0.999, 0);
    window.__PROG__ = 'bas'; const B = await etat(1, 0, 0);
    const fB = tous.fB, fM = tous.fM, fH = tous.fH;
    const cl = { haut: fH, moyen: (1 - fH) * fM, bas: (1 - fH) * (1 - fM) * fB };
    const eff = (X, c) => ({ couv: r3(c), SW: r2(-c * (X.sw - clair.sw) / (X === M ? 0.999 : 1) * 1), LW: r2(c * (clair.olr - X.olr)) });
    const out = { T_C: r2(T0 - window.CONST.T0_WATER), fractions: { fB: r3(fB), fM: r3(fM), fH: r3(fH) },
        haut: eff(H, cl.haut), moyen: eff(M, cl.moyen), bas: eff(B, cl.bas),
        total: { couv: r3(cl.haut + cl.moyen + cl.bas), SW: r2(-(tous.sw - clair.sw)), LW: r2(clair.olr - tous.olr) } };
    window.__R6__.push(out); window.__PROG__ = 'done';
} catch (e) { window.__ERR__ = String(e && e.stack || e); window.__PROG__ = 'error'; } })();
'launched'
