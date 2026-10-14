// File: CO2/scripts/bench_headless/bilan_vs_T.js
// Desc: Bilan ΔF(T) = solaire absorbé + intérieur − OLR à température IMPOSÉE sur une époque (branches chaude / froide, équilibres).
//       Poser AVANT : window.__EP__ = '🪸' ; window.__TS__ = [-10, -5, 0, 5, 10] (°C).
// Version 1.0.0
// Date: [October 14, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Balayage ΔF(T) à T imposée sur une époque : window.__EP__, window.__TS__ (°C).
window.__PROG__='start'; window.__R6__=[]; window.__ERR__=null;
(async () => { try {
  const api=window.getBilanRadiatifAPI(function(){}), D=window.DATA, K=273.15;
  const id=window.__EP__; window.CLICS.frise(id);
  await api.run({ epochId:id, animEnabled:false });
  const pin=(T)=>{ D['🧮']['🧮🌡️']=T; D['🧮']['🧮🌡️⏮']=T; D['🧮']['🧮🌡️🚩']=T; };
  for (const TC of window.__TS__) {
    window.__PROG__='T '+TC;
    pin(TC+K); window.ATM.calculateAtmosphereComposition(); window.ATM.updateAtmosphereHeightFromCurrentT();
    window.H2O._lastH2OParamsCache=null; window.H2O.calculateH2OParameters(); window.ALBEDO.calculateAlbedo(); pin(TC+K);
    await window.calculateFluxForT0();
    const H=window._hystDiag, A=D['🪩'], OLR=D['📊'].total_flux, S=D['☀️']['🧲☀️🎱']*(1-A['🍰🪩📿']);
    window.__R6__.push({ T:TC, dF:+(S+D['🌕']['🧲🌕']-OLR).toFixed(2), Sabs:+S.toFixed(1), OLR:+OLR.toFixed(1), A:+A['🍰🪩📿'].toFixed(3),
      A_sol:+H.preCloudAlbedo.toFixed(3), A_clair:+H.albedoCielClair.toFixed(3), A_bas:+H.albedoCielBas.toFixed(3),
      glace:+A['🍰🪩🧊'].toFixed(3), alb_glace:+H.iceAlbedoEff.toFixed(3), tauSW:+H.tauNuageSW.toFixed(1), W:+(1000*H.eauNuage).toFixed(0),
      r_ens:+H.rapportEnsoleillementGlace.toFixed(3) });
  }
  window.__PROG__='done';
} catch(e){ window.__ERR__=String(e&&e.stack||e); window.__PROG__='error'; } })();
'launched'
