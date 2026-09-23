// File: CO2/scripts/bench_headless/courbe_modele.js
// Desc: Courbe de température DU MODÈLE pour CO2/histoire.html : frise sur ⚫ et 🔥, puis la chaîne de
//       CLICS complète de 🦠 jusqu'à 2025 (mêmes tictimes que l'interface, T° conservée d'une époque à
//       l'autre). Chaque convergence donne un point (années avant 2025, T °C, glace, époque).
//       Écrit window.__COURBE__. Lancé par courbe_modele.py, qui écrit CO2/static/histoire/courbe_modele.js.
// Version 1.0.0
// Date: 2026-09-23
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__='start'; window.__COURBE__=null; window.__ERR__=null;
(async () => { try {
  const api=window.getBilanRadiatifAPI(function(){}), D=window.DATA, C=window.CONST;
  const ppmCO2 = () => +(D['🫧']['🍰🫧🏭']/C.M_CO2 / (1/D['🫧']['🧪'] - D['💧']['🍰🫧💧']/C.M_H2O) * 1e6).toFixed(1);
  const reset = () => { for (const k of ['🔺⚖️🏭','🔺⚖️🌊🏭','🔺⚖️🌳🏭','📿💫','📿☄️','📿🕰','🔺🍰⚽','🔺⚖️💧']) D['📜'][k]=0; };
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
    const E = TLid(s.epochId), dt = D['📜']['📅'];
    r.t = Math.round(E['▶'] > E['◀'] ? dt : 2025 - dt);   // années avant 2025
    r.st = s.status;
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

  const AN = 2025, pts = [];
  const point = (mode) => {
    const s = api.snapshot(), ep = s.epochId, E = TLid(ep), date = D['📜']['📅'];
    const ago = (E['▶'] > E['◀']) ? date : AN - date;
    pts.push({ t: Math.round(ago), T: +s.T_C.toFixed(2), glace: +(+s.ice.mass_now).toFixed(3), ppm: ppmCO2(), ep, mode, st: s.status });
  };
  // ⚫ et 🔥 : frise seulement (leurs clics ☄️ 🎇 sont des événements d'eau/impact, pas des tictimes)
  for (const id of ['⚫', '🔥']) { reset(); window.__PROG__='frise '+id; await api.run({ epochId:id, animEnabled:false }); point('frise'); }
  // 🦠 → … → 📱 : frise sur 🦠 puis tous les clics
  reset(); window.__PROG__='frise 🦠'; await api.run({ epochId:'🦠', animEnabled:false }); point('frise');
  let id = '🦠';
  while (id && id !== '📱') id = await traverser('courbe', id);
  for (const p of window.__PASSAGES__) pts.push({ t: p.t, T: p.T, glace: p.glace, ppm: p.ppm, ep: p.ep, mode: 'clic', st: p.st });
  // 📱 : un clic ⛽ de la tranche 2000 → 2025
  const W = TLid('📱')['🕰'], cfg = W['2000']['⛽'];
  D['📜']['🔺⚖️🏭'] += cfg['🔺⚖️🏭']; window.CO2.advanceCarbonSinks(cfg['🔺⏳']*1e6, cfg['🔺⚖️🏭']);
  D['📜']['📿💫'] += 1; D['📜']['🔘🕰'] = '⛽';
  window.__PROG__='clic 📱 ⛽'; await api.run({ epochId:'📱', animEnabled:true }); point('clic');
  window.__COURBE__ = { bary: D['🎚️'].baryByGroup.ATM, points: pts };
  window.__PROG__='done';
} catch(e){ window.__ERR__=String(e&&e.stack||e); window.__PROG__='error'; } })(); 'x'
