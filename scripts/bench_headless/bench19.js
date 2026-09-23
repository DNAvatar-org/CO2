// File: CO2/scripts/bench_headless/bench19.js
// Desc: Les 19 époques depuis leur graine (animEnabled:false), comparées à BENCH_LIT_BY_EPOCH_ID,
//       PUIS un tictime unique sur chaque époque qui en a un — sauf les trois hystérésis, qui n'en ont
//       qu'un et le jouent comme événement. Le tictime reproduit le chemin du clic de l'interface
//       (events.js → sync_panels.js) : 📿💫 += 1, getEpochDateConfig, getNoyau, puis calcul animé
//       qui repart de l'état convergé. C'est lui qui fait basculer 🦣 (état de cycle 🔁) : sans lui,
//       le banc ne teste que la graine.
//       Écrit window.__R6__ ; window.__PROG__ suit l'avancement.
//       Balayage : poser window.__BENCH_BARYS__ = [55, 56, …] AVANT d'injecter ce script.
// Version 1.1.0
// Date: 2026-09-23
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__='start'; window.__R6__=[]; window.__ERR__=null;
(async () => {
 try {
  const api=window.getBilanRadiatifAPI(function(){}), D=window.DATA, C=window.CONST;
  const LIT=window.BENCH_LIT_BY_EPOCH_ID;
  const barys = Array.isArray(window.__BENCH_BARYS__) ? window.__BENCH_BARYS__ : [null];
  const ppmCO2 = () => +(D['🫧']['🍰🫧🏭']*1e6*D['🫧']['🧪']/C.M_CO2).toFixed(1);
  const reset = () => {
    for (const k of ['🔺⚖️🏭','🔺⚖️🌊🏭','🔺⚖️🌳🏭','📿💫','📿☄️','📿🕰','🔺🍰⚽','🔺⚖️💧']) D['📜'][k]=0;
  };
  // Un tictime, tel que le joue l'interface. Renvoie le bouton joué, ou null si l'époque n'en a pas.
  const tic = (EP) => {
    const W = EP['🕰'] || {};
    if (W['💫']) {
      const cfg = W['💫'];
      D['📜']['📿💫'] += 1;
      if (Object.prototype.hasOwnProperty.call(cfg, '🍰⚽')) D['📜']['🔺🍰⚽'] = Number(cfg['🍰⚽']);
      D['📜']['🔘🕰'] = '💫';
      return '💫';
    }
    // 📱 : actions indexées par année — la première tranche (2000 → 2025)
    const years = Object.keys(W).filter(k => /^\d+$/.test(k)).sort((a,b)=>a-b);
    if (years.length) {
      const [btn, cfg] = Object.entries(W[years[0]])[0];
      const co2kg = cfg['🔺⚖️🏭'] || 0, dtYr = (cfg['🔺⏳'] || 0.000025) * 1e6;
      D['📜']['🔺⚖️🏭'] += co2kg;
      window.CO2.advanceCarbonSinks(dtYr, co2kg);
      D['📜']['📿💫'] += 1;
      D['📜']['🔘🕰'] = btn;
      return years[0] + ' ' + btn;
    }
    return null;
  };
  for (const pct of barys) {
    if (pct !== null) window.TUNING.applyTuningPayload({ baryByGroup: { ATM: pct } });
    for (const EP of window.TIMELINE) {
      if (!EP['📅']) continue;
      const id=EP['📅'], lit=LIT[id];
      reset();
      window.__PROG__='bench '+(pct!==null?pct+' ':'')+id;
      await api.run({ epochId:id, animEnabled:false });
      let s=api.snapshot();
      const row = { pct: D['🎚️'].baryByGroup.ATM, ep:id, T:+s.T_C.toFixed(3), litT: lit?lit.tC:null,
        dansFourchette: lit ? (s.T_C>=lit.tC[0] && s.T_C<=lit.tC[1]) : null, ppm:ppmCO2(), st:s.status };
      if (!/^hysteresis/.test(id)) {
        const b = tic(EP);
        if (b) {
          window.__PROG__='tic '+(pct!==null?pct+' ':'')+id;
          window.COMPUTE.getEpochDateConfig(); window.COMPUTE.getNoyau();
          if (D['📜']['🗿'] !== id) { row.tic = b; row.ticErr = 'transition vers '+D['📜']['🗿']; }
          else {
            await api.run({ epochId:id, animEnabled:true });
            s=api.snapshot();
            Object.assign(row, { tic:b, T_tic:+s.T_C.toFixed(3), ppm_tic:ppmCO2(), st_tic:s.status,
              dansFourchette_tic: lit ? (s.T_C>=lit.tC[0] && s.T_C<=lit.tC[1]) : null });
          }
        }
      }
      window.__R6__.push(row);
    }
  }
  window.__PROG__='done';
 } catch(e){ window.__ERR__=String(e&&e.stack||e); window.__PROG__='error'; }
})();
'launched'
