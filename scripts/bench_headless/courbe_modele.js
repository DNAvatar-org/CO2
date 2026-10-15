// File: CO2/scripts/bench_headless/courbe_modele.js
// Desc: Courbe de température DU MODÈLE pour CO2/histoire.html : frise sur ⚫, puis la chaîne de CLICS
//       complète ⚫ → 🔥 → 🦠 → … → 2025 (mêmes tictimes que l'interface, T° conservée d'une époque à
//       l'autre, aucune remise à zéro entre époques). Chaque convergence donne un point (années avant 2025,
//       T °C, glace, époque, clic joué, durée 🔺⏳ du clic). La page relie les points par des segments.
//       Deux modes (window.__MODE__, posé par courbe_modele.py) :
//         · 'clics' : UNE frise (⚫), puis que des clics — l'état arrive d'une époque à l'autre (graine t° continue) ;
//         · 'frise' : le clic sur la frise de CHAQUE époque du TIMELINE, et rien d'autre (graine t° imposée).
//       Écrit window.__COURBE__ (points dans l'ordre chronologique). Lancé par courbe_modele.py.
// Version 2.2.0
// - v2.2.0 (2026-10-15): points fabriqués par CO2/static/histoire/point_modele.js (partagé avec le banc de l'index).
// - v2.1.0 (2026-10-14): mode frise = la graine de chaque époque seulement (plus ses tictimes).
// - v2.0.1 (2026-10-13): jauges séparées — `pct` et `bary` portent tout baryByGroup.
// Date: 2026-10-12
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__='start'; window.__COURBE__=null; window.__ERR__=null;
(async () => { try {
  const MODE = window.__MODE__ || 'clics';
  if (MODE !== 'clics' && MODE !== 'frise') throw new Error('__MODE__ inconnu : ' + MODE);
  const api=window.getBilanRadiatifAPI(function(){}), D=window.DATA;
  window.__PASSAGES__ = [];
  // Un point : CO2/static/histoire/point_modele.js (la même fabrique que le banc de l'index).
  const note = (etape, cle, dt, mode) => window.__PASSAGES__.push(window.HISTOIRE.pointModele(etape, cle, dt, mode || 'clic'));
  // Clic sur la frise : graine de l'époque, compteurs à zéro (CLICS.frise, comme setEpoch).
  const frise = async (id) => {
    window.CLICS.frise(id);
    window.__PROG__='frise '+id; await api.run({ epochId:id, animEnabled:false });
    note('frise '+id, null, null, 'frise');
  };
  if (MODE === 'frise') {
    for (const E of window.TIMELINE) await frise(E['📅']);
  } else {
    await frise('⚫');
    // Que des clics (mécanique : CLICS, API_BILAN/convergence/clics.js) jusqu'au ⛽ 2000 → 2025 de 📱.
    while (!(D['📜']['🗿'] === '📱' && D['📜']['📿💫'] === 1)) {
      const depuis = D['📜']['🗿'];
      const key = window.CLICS.prochaineAction();
      const t0 = D['📜']['⏳'];
      const r = window.CLICS.jouer(key);
      const dt = D['📜']['⏳'] - t0;   // durée du clic (Ma)
      if (r.passage !== null) window.CLICS.passer(r.passage);
      window.__PROG__ = 'clic '+depuis+' '+key+(r.passage !== null ? ' → '+r.passage : '');
      await api.run({ epochId: D['📜']['🗿'], animEnabled:true });
      note(r.passage !== null ? depuis+' →'+key+' '+r.passage : depuis+' '+key+' ('+(+D['📜']['⏳'].toFixed(4))+' Ma écoulés)', key, dt);
    }
  }
  window.__COURBE__ = { mode: MODE, bary: JSON.parse(JSON.stringify(D['🎚️'].baryByGroup)), points: window.__PASSAGES__ };
  window.__PROG__='done';
} catch(e){ window.__ERR__=String(e&&e.stack||e); window.__PROG__='error'; } })(); 'x'
