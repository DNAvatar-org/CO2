// File: CO2/scripts/bench_headless/bench19.js
// Desc: Les 19 époques depuis leur graine (animEnabled:false), comparées à BENCH_LIT_BY_EPOCH_ID,
//       PUIS un tictime unique sur chaque époque qui en a un — sauf les trois hystérésis, qui n'en ont
//       qu'un et le jouent comme événement. Le tictime reproduit le chemin du clic de l'interface
//       (events.js → sync_panels.js) : 📿💫 += 1, getEpochDateConfig, getNoyau, puis calcul animé
//       qui repart de l'état convergé. C'est lui qui fait basculer 🦣 (état de cycle 🔁) : sans lui,
//       le banc ne teste que la graine.
//       PUIS les PASSAGES d'hystérésis (v1.2.0) : une époque d'hystérésis est une CONFIG FRONTIÈRE,
//       jugée sur la bascule qu'elle provoque en venant de l'époque précédente — jamais sur sa graine.
//       Voir l'encadré « ÉPOQUES D'HYSTÉRÉSIS » dans API_BILAN/config/configTimeline.js.
//       Écrit window.__R6__ (époques) et window.__PASSAGES__ ; window.__PROG__ suit l'avancement.
//       Balayage : poser window.__BENCH_BARYS__ = [55, 56, …] AVANT d'injecter ce script.
// Version 1.3.0
// Date: 2026-09-23
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__='start'; window.__R6__=[]; window.__ERR__=null;
(async () => {
 try {
  const api=window.getBilanRadiatifAPI(function(){}), D=window.DATA, C=window.CONST;
  const LIT=window.BENCH_LIT_BY_EPOCH_ID;
  const barys = Array.isArray(window.__BENCH_BARYS__) ? window.__BENCH_BARYS__ : [null];
  // ppm en AIR SEC, comme les mesures (NOAA, carottes) : x = (w/M_CO₂) / (1/M_air − w_H₂O/M_H₂O)
  const ppmCO2 = () => +(D['🫧']['🍰🫧🏭']/C.M_CO2 / (1/D['🫧']['🧪'] - D['💧']['🍰🫧💧']/C.M_H2O) * 1e6).toFixed(1);
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
  // ─── PASSAGES D'HYSTÉRÉSIS : on REJOUE LES CLICS, comme l'interface ────────────────────
  // v1.3.0 (2026-09-23) : la v1.2 sautait les tictimes À L'INTÉRIEUR des époques (graine de 🪸 → 1a
  // directement). Or dans l'interface on clique 💫 dans 🪸 (590 Ma par clic) et 🔀 fait glisser les
  // masses vers celles de 1a : on arrive dans 1a depuis un 🪸 déjà refroidi. Même chose pour le 💫
  // de ⛄ avant 🌋. Un clic = ce que font events.js (advanceGeologicTicOrder) puis sync_panels.js :
  //   📿💫 += 1 (voile éventuel), temps += 🔺⏳ ;  si fin d'époque → setEpoch(suivante) : compteurs à
  //   zéro, calcul ANIMÉ depuis la T° et la glace courantes ;  sinon calcul animé sur place.
  // Critère de l'utilisateur : la convergence au CLIC (tictime) et à la FRISE (graine) doivent être
  // les mêmes. La frise ne sert qu'à arriver vite, en partant de la bonne T°.
  window.__PASSAGES__ = [];
  const TLid = id => window.TIMELINE.find(e => e['📅'] === id);
  const nextId = id => { const k = window.TIMELINE.findIndex(e => e['📅'] === id); for (let n = k + 1; n < window.TIMELINE.length; n++) if (window.TIMELINE[n]['📅']) return window.TIMELINE[n]['📅']; return null; };
  const passer = async (id) => {
    for (const k of ['📿💫','📿☄️','📿🕰','🔺⚖️🏭','🔺⚖️🌊🏭','🔺⚖️🌳🏭']) D['📜'][k]=0;
    D['📜']['🔘🕰']='';
    await api.run({ epochId:id, animEnabled:true });
  };
  const note = (chaine, etape) => {
    const s=api.snapshot();
    const r={ pct: D['🎚️'].baryByGroup.ATM, chaine, etape, ep:s.epochId, T:+s.T_C.toFixed(2),
      glace:+(+s.ice.mass_now).toFixed(3), ppm:ppmCO2() };
    window.__PASSAGES__.push(r); return r;
  };
  // Clique à travers l'époque `id` jusqu'à en sortir. Renvoie l'id de l'époque d'arrivée.
  const traverser = async (chaine, id) => {
    const EP = TLid(id), W = EP['🕰'] || {};
    const dur = Math.abs(EP['◀'] - EP['▶']) / 1e6;
    const clics = Array.isArray(W.order) ? W.order.slice() : null;
    const racine = W['💫'];
    let t = 0, n = 0;
    while (n < 50) {
      // Sans order : 💫 si l'époque en a un, sinon son unique action (hysteresis 2 n'a que ⛰).
      const seule = Object.keys(W).filter(k => W[k] && typeof W[k]['🔺⏳'] === 'number');
      const key = clics ? clics[n] : (racine ? '💫' : seule[0]);
      if (!key) return null;
      const cfg = W[key]; if (!cfg) return null;
      n++;
      D['📜']['📿💫'] = (D['📜']['📿💫'] || 0) + 1;
      if ((key === '💫' || key === '⛰') && racine && Object.prototype.hasOwnProperty.call(racine, '🍰⚽')) D['📜']['🔺🍰⚽'] = Number(racine['🍰⚽']);
      if ((key === '🗻' || key === '🌋') && Number.isFinite(cfg['🔺🍰⚽'])) D['📜']['🔺🍰⚽'] = Math.min(0.95, (D['📜']['🔺🍰⚽'] || 0) + cfg['🔺🍰⚽']);
      t += cfg['🔺⏳'];
      if (t >= dur - 1e-9) {
        const nx = nextId(id);
        window.__PROG__ = 'clic '+id+' '+key+' → '+nx; await passer(nx);
        note(chaine, id+' →'+key+' '+nx);
        return nx;
      }
      D['📜']['🔘🕰'] = key;
      window.__PROG__ = 'clic '+id+' '+key+' #'+n; await api.run({ epochId:id, animEnabled:true });
      note(chaine, id+' '+key+' #'+n+' ('+t+' Ma)');
    }
    return null;
  };
  const passages = async (pct) => {
    // Chaîne Snowball : frise sur 🪸, puis on clique jusqu'à 🪼.
    reset(); D['📜']['🔺🍰⚽']=0;
    window.__PROG__='chaîne 🪸'; await api.run({ epochId:'🪸', animEnabled:false }); note('Snowball', '🪸 frise');
    let id='🪸';
    while (id && id !== '🍄') id = await traverser('Snowball', id);
    // Chaîne EOT : frise sur 🐊, puis clics jusqu'à 🦣.
    reset(); D['📜']['🔺🍰⚽']=0;
    window.__PROG__='chaîne 🐊'; await api.run({ epochId:'🐊', animEnabled:false }); note('EOT', '🐊 frise');
    id='🐊';
    while (id && id !== '🦣') id = await traverser('EOT', id);
    // CRITÈRE : FRISE = CLIC. Pour chaque hystérésis (et ⛄), la T° convergée depuis la graine (frise) doit
    // égaler celle de l'ARRIVÉE par clic. Sinon la graine est sur la mauvaise branche, ou la config n'est
    // pas à la frontière que le clic traverse.
    for (const h of ['hysteresis 1a', '⛄', 'hysteresis 1b', 'hysteresis 2']) {
      const arr = window.__PASSAGES__.find(p => p.pct === D['🎚️'].baryByGroup.ATM && p.ep === h);
      const fr  = window.__R6__.find(r => r.pct === D['🎚️'].baryByGroup.ATM && r.ep === h);
      if (arr && fr) window.__PASSAGES__.push({ pct: arr.pct, chaine: 'frise = clic', etape: h,
        T_frise: fr.T, T_clic: arr.T, ecart: +(fr.T - arr.T).toFixed(2), ok: Math.abs(fr.T - arr.T) < 0.5 });
    }
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
      // Graine d'une hystérésis : pas une cible de littérature — elle doit donner la même T° que le clic
      // (critère « frise = clic » en fin de passages).
      if (/^hysteresis/.test(id)) row.graineHysteresis = true;
      window.__R6__.push(row);
    }
    await passages(pct);
  }
  window.__R6__.push({ passages: window.__PASSAGES__ });
  window.__PROG__='done';
 } catch(e){ window.__ERR__=String(e&&e.stack||e); window.__PROG__='error'; }
})();
'launched'
