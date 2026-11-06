// File: CO2/scripts/bench_headless/sondes/nuages_types.js
// Desc: SONDE des effets des nuages PAR TYPE (bas, moyens, hauts) sur 📱 à la température mesurée (graine 📜🌡️🧮) : chaque type
//       retiré seul (sa fraction à 0), effets SW et LW au sommet, et la vue ISCCP de l'état (simulateur, contre data/isccp_h_2010.js).
//       Usage : python3 scripts/bench_headless/run.py scripts/bench_headless/sondes/nuages_types.js --timeout 1800
// Version 1.0.0
// Date: [November 6, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__ = 'start'; window.__R6__ = []; window.__ERR__ = null;
(async () => { try {
    const api = window.getBilanRadiatifAPI(function () {}), D = window.DATA, IS = window.ISCCP_H_2010;
    window.CLICS.frise('📱'); await api.run({ epochId: '📱', animEnabled: false });
    const T0 = D['📜']['🌡️🧮'], N = window.EARTH.NUAGES, CS = D['🎚️'].CLOUD_SW, f0 = { b: CS.F_BAS, m: N.F_MOYEN, h: CS.F_HAUT };
    const pin = (T) => { D['🧮']['🧮🌡️'] = T; D['🧮']['🧮🌡️⏮'] = T; D['🧮']['🧮🌡️🚩'] = T; };
    const evaluer = async (figer) => { pin(T0); window.ATM.calculateAtmosphereComposition(); window.ATM.updateAtmosphereHeightFromCurrentT();
        window.H2O._lastH2OParamsCache = null; window.H2O.calculateH2OParameters(); window.ALBEDO.calculateAlbedo(); pin(T0);
        await window.calculateFluxForT0(null, figer); };
    for (let k = 0; k < 4; k++) await evaluer(false);                // stratosphère à l'équilibre, nuages complets
    const S = D['☀️']['🧲☀️🎱'];
    const etat = async (b, m, h) => { CS.F_BAS = b; N.F_MOYEN = m; CS.F_HAUT = h; await evaluer(true);
        const r = { sw: S * D['🪩']['🍰🪩📿'], olr: D['📊'].total_flux }; CS.F_BAS = f0.b; N.F_MOYEN = f0.m; CS.F_HAUT = f0.h; return r; };
    const tous = await etat(f0.b, f0.m, f0.h);
    const vu = window.NUAGES_ISCCP.vusDenHaut(window.RADIATIVE.colonneNuageuse());
    const r = (x) => +x.toFixed(2), types = [];
    for (const [nom, b, m, h] of [['bas', 0, f0.m, f0.h], ['moyens', f0.b, 0, f0.h], ['hauts', f0.b, f0.m, 0], ['tous', 0, 0, 0]]) {
        window.__PROG__ = 'sans ' + nom;
        const e = await etat(b, m, h);
        types.push({ type: nom, effetSW: r(e.sw - tous.sw), effetLW: r(e.olr - tous.olr) });
    }
    const niv = (L) => ({ modele: [r(vu.niveaux[L].a * 100) / 100, r(vu.niveaux[L].tau)], isccp: [IS.niveaux[L].a, IS.niveaux[L].tau],
        classes_modele: vu.niveaux[L].classes.map((c) => [r(c.a * 1000) / 1000, r(c.tau)]), classes_isccp: IS.niveaux[L].classes.map((c) => [c.a, c.tau]) });
    window.__R6__.push({ T_C: r(T0 - window.CONST.T0_WATER), fractions: f0, types: types, vu: { total: [r(vu.total.a * 100) / 100, IS.total.a], L: niv('L'), M: niv('M'), H: niv('H') } });
    window.__PROG__ = 'done';
} catch (e) { window.__ERR__ = String(e && e.stack || e); window.__PROG__ = 'error'; } })();
'launched'
