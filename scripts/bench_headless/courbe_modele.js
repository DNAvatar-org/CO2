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
// Version 2.0.1
// - v2.0.1 (2026-10-13): jauges séparées — `pct` et `bary` portent tout baryByGroup.
// Date: 2026-10-12
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__='start'; window.__COURBE__=null; window.__ERR__=null;
(async () => { try {
  const MODE = window.__MODE__ || 'clics';
  if (MODE !== 'clics' && MODE !== 'frise') throw new Error('__MODE__ inconnu : ' + MODE);
  const api=window.getBilanRadiatifAPI(function(){}), D=window.DATA, C=window.CONST;
  const ppmCO2 = () => +(D['🫧']['🍰🫧🏭']/C.M_CO2 / (1/D['🫧']['🧪'] - D['💧']['🍰🫧💧']/C.M_H2O) * 1e6).toFixed(1);
  window.__PASSAGES__ = [];
  const TLid = id => window.TIMELINE.find(e => e['📅'] === id);
  // État de l'intérieur (geology/interieur.js) : T potentielle °C, flux W/m², puissance TW, date de solidification.
  const interieur = () => { const N = D['🌕']; return { Tint: N['🌡️🌕'] > 0 ? +(N['🌡️🌕'] - 273.15).toFixed(1) : null,   // null avant l'intérieur (⚫)
      geo: +(+N['🧲🌕']).toPrecision(4),
      TW: +(N['🔋🌕'] / 1e12).toFixed(2), solidif: N['📅🧊🌕'] > 0 ? Math.round(N['📅🧊🌕']) : null }; };
  const note = (chaine, etape, cle, dt, mode) => {
    const s=api.snapshot();
    const r={ pct: JSON.stringify(D['🎚️'].baryByGroup), chaine, etape, cle, dt, mode: mode || 'clic', ep:s.epochId, T:+s.T_C.toFixed(2),
      glace:+(+s.ice.mass_now).toFixed(3), ppm:ppmCO2(), ...interieur() };
    const E = TLid(s.epochId), dt0 = D['📜']['📅'];
    r.t = Math.round(E['▶'] > E['◀'] ? dt0 : 2025 - dt0);   // années avant 2025
    r.st = s.status;
    window.__PASSAGES__.push(r); return r;
  };
  // Clic sur la frise : graine de l'époque, compteurs à zéro (CLICS.frise, comme setEpoch).
  const frise = async (id) => {
    window.CLICS.frise(id);
    window.__PROG__='frise '+id; await api.run({ epochId:id, animEnabled:false });
    note(MODE, 'frise '+id, null, null, 'frise');
  };
  await frise('⚫');
  // Que des clics (mécanique : CLICS, API_BILAN/convergence/clics.js) jusqu'au ⛽ 2000 → 2025 de 📱.
  // Mode 'frise' : à chaque nouvelle époque, clic sur la frise au lieu d'y arriver avec l'état.
  while (!(D['📜']['🗿'] === '📱' && D['📜']['📿💫'] === 1)) {
    const depuis = D['📜']['🗿'];
    const key = window.CLICS.prochaineAction();
    const t0 = D['📜']['⏳'];
    const r = window.CLICS.jouer(key);
    const dt = D['📜']['⏳'] - t0;   // durée du clic (Ma)
    if (r.passage !== null && MODE === 'frise') { await frise(r.passage); continue; }
    if (r.passage !== null) window.CLICS.passer(r.passage);
    window.__PROG__ = 'clic '+depuis+' '+key+(r.passage !== null ? ' → '+r.passage : '');
    await api.run({ epochId: D['📜']['🗿'], animEnabled:true });
    note(MODE, r.passage !== null ? depuis+' →'+key+' '+r.passage : depuis+' '+key+' ('+(+D['📜']['⏳'].toFixed(4))+' Ma écoulés)', key, dt);
  }
  const pts = window.__PASSAGES__.map(({ pct, chaine, ...p }) => p);
  window.__COURBE__ = { mode: MODE, bary: JSON.parse(JSON.stringify(D['🎚️'].baryByGroup)), points: pts };
  window.__PROG__='done';
} catch(e){ window.__ERR__=String(e&&e.stack||e); window.__PROG__='error'; } })(); 'x'
