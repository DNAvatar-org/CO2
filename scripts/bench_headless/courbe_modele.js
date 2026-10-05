// File: CO2/scripts/bench_headless/courbe_modele.js
// Desc: Courbe de température DU MODÈLE pour CO2/histoire.html : frise sur ⚫, puis la chaîne de CLICS
//       complète ⚫ → 🔥 → 🦠 → … → 2025 (mêmes tictimes que l'interface, T° conservée d'une époque à
//       l'autre, aucune remise à zéro entre époques). Chaque convergence donne un point (années avant 2025,
//       T °C, glace, époque, clic joué, durée 🔺⏳ du clic). La page trace un ESCALIER : l'état d'un clic
//       tient jusqu'au clic suivant, rien n'est interpolé entre deux clics.
//       Deux modes (window.__MODE__, posé par courbe_modele.py) :
//         · 'clics' : UNE frise (⚫), puis que des clics — l'état arrive d'une époque à l'autre ;
//         · 'frise' : à CHAQUE nouvelle époque, clic sur la frise (graine de l'époque), puis ses tictimes.
//       Écrit window.__COURBE__ (points dans l'ordre chronologique). Lancé par courbe_modele.py.
// Version 1.2.0
// Date: 2026-09-24
// logs :
//   - v1.2.0: mode 'frise' (graine à chaque époque, puis ses tictimes) à côté du mode 'clics' ; un seul
//     journal chronologique (note), chaque point porte son mode ('frise' | 'clic').
//   - v1.1.0: ⚫ et 🔥 joués au CLIC (order ☄️ 💫 ☄️ 💫 🎇 ; 💫 de 🔥 compte 📿💫 comme tout tic, ce qui
//     fait baisser le flux du noyau — events.js v1.2.39) au lieu d'une frise isolée chacun ; plus de reset entre ⚫, 🔥 et 🦠 ; chaque point
//     porte son clic (cle, etape) et sa durée (dt, Ma) ; et l'état de l'intérieur (Tint °C, geo W/m², TW,
//     solidif = âge de solidification de l'océan de magma — geology/interieur.js).
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__='start'; window.__COURBE__=null; window.__ERR__=null;
(async () => { try {
  const MODE = window.__MODE__ || 'clics';
  if (MODE !== 'clics' && MODE !== 'frise') throw new Error('__MODE__ inconnu : ' + MODE);
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
  // État de l'intérieur (geology/interieur.js) : T potentielle °C, flux W/m², puissance TW, date de solidification.
  const interieur = () => { const N = D['🌕']; return { Tint: N['🌡️🌕'] > 0 ? +(N['🌡️🌕'] - 273.15).toFixed(1) : null,   // null avant l'intérieur (⚫)
      geo: +(+N['🧲🌕']).toPrecision(4),
      TW: +(N['🔋🌕'] / 1e12).toFixed(2), solidif: N['📅🧊🌕'] > 0 ? Math.round(N['📅🧊🌕']) : null }; };
  const note = (chaine, etape, cle, dt, mode) => {
    const s=api.snapshot();
    const r={ pct: D['🎚️'].baryByGroup.ATM, chaine, etape, cle, dt, mode: mode || 'clic', ep:s.epochId, T:+s.T_C.toFixed(2),
      glace:+(+s.ice.mass_now).toFixed(3), ppm:ppmCO2(), ...interieur() };
    const E = TLid(s.epochId), dt0 = D['📜']['📅'];
    r.t = Math.round(E['▶'] > E['◀'] ? dt0 : 2025 - dt0);   // années avant 2025
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
      // ☄️ compte 📿☄️ (eau des météorites : getMasses fait ⚖️💧 += 🔺⚖️💧☄️ × 📿☄️) ; 🎇 ne fait que passer.
      if (key === '☄️') D['📜']['📿☄️'] = (D['📜']['📿☄️'] || 0) + 1;
      else if (key !== '🎇') D['📜']['📿💫'] = (D['📜']['📿💫'] || 0) + 1;
      if ((key === '💫' || key === '⛰') && racine && Object.prototype.hasOwnProperty.call(racine, '🍰⚽')) D['📜']['🔺🍰⚽'] = Number(racine['🍰⚽']);
      if ((key === '🗻' || key === '🌋') && Number.isFinite(cfg['🔺🍰⚽'])) D['📜']['🔺🍰⚽'] = Math.min(0.95, (D['📜']['🔺🍰⚽'] || 0) + cfg['🔺🍰⚽']);
      t += cfg['🔺⏳'];
      if (key === '🎇' || t >= dur - 1e-9) {
        const nx = key === '🎇' && cfg['⏩'] ? cfg['⏩'] : nextId(id);
        if (MODE === 'frise') return nx;   // la boucle principale clique sur la frise de nx
        window.__PROG__ = 'clic '+id+' '+key+' → '+nx; await passer(nx);
        note(chaine, id+' →'+key+' '+nx, key, cfg['🔺⏳']);
        return nx;
      }
      D['📜']['🔘🕰'] = key;
      window.__PROG__ = 'clic '+id+' '+key+' #'+n; await api.run({ epochId:id, animEnabled:true });
      note(chaine, id+' '+key+' #'+n+' ('+(+t.toFixed(4))+' Ma écoulés)', key, cfg['🔺⏳']);
    }
    return null;
  };

  // Clic sur la frise : graine de l'époque, compteurs à zéro (comme setEpoch).
  const frise = async (id) => {
    reset(); D['📜']['🔘🕰']='';
    window.__PROG__='frise '+id; await api.run({ epochId:id, animEnabled:false });
    note(MODE, 'frise '+id, null, null, 'frise');
  };
  await frise('⚫');
  let id = '⚫';
  while (id && id !== '📱') {
    id = await traverser(MODE, id);
    if (id && MODE === 'frise') await frise(id);
  }
  if (id !== '📱') throw new Error('chaîne de clics interrompue avant 📱');
  // 📱 : un clic ⛽ de la tranche 2000 → 2025
  const W = TLid('📱')['🕰'], cfg = W['2000']['⛽'];
  D['📜']['🔺⚖️🏭'] += cfg['🔺⚖️🏭']; window.CO2.advanceCarbonSinks(cfg['🔺⏳']*1e6, cfg['🔺⚖️🏭']);
  D['📜']['📿💫'] += 1; D['📜']['🔘🕰'] = '⛽';
  window.__PROG__='clic 📱 ⛽'; await api.run({ epochId:'📱', animEnabled:true });
  note(MODE, '📱 ⛽ #1 (2000 → 2025)', '⛽', cfg['🔺⏳']);
  const pts = window.__PASSAGES__.map(({ pct, chaine, ...p }) => p);
  window.__COURBE__ = { mode: MODE, bary: D['🎚️'].baryByGroup.ATM, points: pts };
  window.__PROG__='done';
} catch(e){ window.__ERR__=String(e&&e.stack||e); window.__PROG__='error'; } })(); 'x'
