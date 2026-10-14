// File: CO2/scripts/bench_headless/scenarios.js
// Desc: Sonde par scénarios : époques choisies, config modifiée EN MÉMOIRE (remise après chaque), jauges optionnelles ; bilan
//       détaillé (albédos, nuages, bilan méridien, calottes). Poser AVANT : window.__SCEN__ = [{ nom, ep, cfg: { clé: valeur | 'x<facteur>' },
//       bary: { FROID: … } }]. Usage : (echo "window.__SCEN__=[…];"; cat scenarios.js) > /tmp/s.js ; python3 run.py /tmp/s.js --timeout 900
// Version 1.0.0
// Date: [October 14, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Scénarios : window.__SCEN__ = [{ nom, ep, cfg: {clé: valeur ou 'xF' facteur}, bary: {...} }]. Config remise après chaque.
window.__PROG__='start'; window.__R6__=[]; window.__ERR__=null;
(async()=>{try{ const api=window.getBilanRadiatifAPI(function(){}), D=window.DATA, H=window._hystDiag, C=window.CONST;
 const bary0=JSON.parse(JSON.stringify(D['🎚️'].baryByGroup));
 for (const sc of window.__SCEN__) {
  const E=window.TIMELINE.find(e=>e['📅']===sc.ep), sauve={};
  for (const k in (sc.cfg||{})) { sauve[k]=E[k]; E[k]= (typeof sc.cfg[k]==='string') ? E[k]*parseFloat(sc.cfg[k].slice(1)) : sc.cfg[k]; }
  window.TUNING.applyTuningPayload({ baryByGroup: Object.assign({}, bary0, sc.bary||{}) });
  window.__PROG__='scen '+sc.nom; window.CLICS.frise(sc.ep); await api.run({ epochId:sc.ep, animEnabled:false });
  window.__R6__.push({ nom:sc.nom, ep:sc.ep, T:+(D['🧮']['🧮🌡️']-273.15).toFixed(2), A:+D['🪩']['🍰🪩📿'].toFixed(3), glace:+D['🪩']['🍰🪩🧊'].toFixed(3),
    A_bas:+H.albedoCielBas.toFixed(3), P:+D['🫧']['🎈'].toFixed(3), ppm:+(D['🫧']['🍰🫧🏭']*1e6*D['🫧']['🧪']/C.M_CO2).toFixed(0), dF0:D['🧮']['🧲🔺⏮'], T2:+H.meridien.T2.toFixed(2), dTp:+H.meridien.dT.pol.toFixed(1), dTm:+H.meridien.dT.mid.toFixed(1), dTt:+H.meridien.dT.trop.toFixed(1), aP:+H.meridien.coAlbedo.pol.toFixed(3), aT:+H.meridien.coAlbedo.trop.toFixed(3), cal:+H.calotteSurface.toFixed(3), aS:+H.meridien.calottes.S_pol.a.toFixed(3), aN:+H.meridien.calottes.N_pol.a.toFixed(3), aSm:+H.meridien.calottes.S_mid.a.toFixed(3), aNm:+H.meridien.calottes.N_mid.a.toFixed(3), H_S:+H.meridien.calottes.S_pol.H.toFixed(0), Ts_S:+(H.meridien.calottes.S_pol.Ts-273.15).toFixed(1), acc_S:+H.meridien.calottes.S_pol.accumulation.toFixed(0) });
  for (const k in sauve) E[k]=sauve[k];
 }
 window.TUNING.applyTuningPayload({ baryByGroup: bary0 });
 window.__PROG__='done'; }catch(e){window.__ERR__=String(e.stack);window.__PROG__='error';}})(); 'launched'
