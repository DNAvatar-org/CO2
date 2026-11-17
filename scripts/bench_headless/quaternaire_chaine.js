// File: CO2/scripts/bench_headless/quaternaire_chaine.js
// Desc: Sonde des calottes le long d'une chaîne de clics : frises de contrôle (window.__FRISES__), puis pour chaque départ
//       (window.__DEPARTS__) frise et clics jusqu'à l'arrivée sur window.__FIN__. Un point par calcul : T, CO₂, CH₄, obliquité de
//       l'orbite (📜⚾), glace, albédo, T₂, aire de glace par hémisphère (millions de km²) et, par bande, la calotte portée avant le clic,
//       celle du calcul, son équilibre, son temps de réaction, Ts [K] tel que le rend CALOTTES.calculer (null hors d'un monde à
//       océan), le recul de sa marge depuis la mer d₀ (km), et son socle : temps de rebond τ_b (ka), sous-pas intégrés, écart
//       maximal à l'équilibre d'Airy (m). Écrit window.__Q__ (à lire avec --stream __Q__).
//       REPRISE : l'état au départ de chaque clic (DATA entier et puits de carbone, comme la progression du F5,
//       static/ui/progression.js) est écrit dans le flux ({ reprise }) tous les REPRISE_PAS clics et quand une erreur arrête la
//       chaîne ; reprise.py en refait une sonde qui repart de là (window.__REPRISE__ : un seul départ, pas de frise).
//       Usage : (echo "window.__FRISES__=['🚂']; window.__DEPARTS__=['🏔']; window.__FIN__='📱';"; cat quaternaire_chaine.js) > q.js
//               python3 run.py q.js --var __PROG__ --stream __Q__ --timeout 7200 > q.out   (🦣 : 159 clics 🐾 de 25 à 40 min)
//               python3 reprise.py q.out q.js > q2.js   (après un arrêt : repart du dernier état gardé)
// Version 1.2.0
// Date: [November 15, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__='start'; window.__Q__=[]; window.__ERR__=null;
(async () => { try {
  const api = window.getBilanRadiatifAPI(function(){}), D = window.DATA, C = window.CONST, HD = window._hystDiag;
  const ppm = (cle, M) => D['🫧'][cle] / M / (1 / D['🫧']['🧪'] - D['💧']['🍰🫧💧'] / C.M_H2O) * 1e6;
  const r = (v, n) => +(+v).toFixed(n);
  const note = (chaine, etape, avant, t0) => {
    const ep = D['📜']['🗿'];
    const m = HD.meridien, cal = {};
    let nord = 0, sud = 0;
    for (const b of window.CALOTTES.BANDES) {
      const c = m.calottes[b.cle];
      cal[b.cle] = { avant: r(avant[b.cle], 4), a: r(c.a, 4), aEq: r(c.aEq, 4), tau_ka: r(c.tau / 1e3, 1), Ts: c.Ts,
        acc: r(c.accumulation, 0), fonte: r(c.fonte, 0), H: r(c.H, 0), z: r(c.z, 0), marge: r(c.marge, 1),
        tauSocle_ka: r(c.tauSocle / 1e3, 2), sousPas: c.sousPas, ecart_m: r(c.ecart_m, 0) };
      if (b.h > 0) nord += c.a * window.CALOTTES.aireBande(b) / 1e12; else sud += c.a * window.CALOTTES.aireBande(b) / 1e12;   // [m²] → [Mkm²]
    }
    window.__Q__.push({ chaine, etape, ep, age: Math.round(window.INTERIEUR.ageCourant()), s: Math.round((Date.now() - t0) / 1000),
      T: r(D['🧮']['🧮🌡️'] - C.T0_WATER, 2), co2: r(ppm('🍰🫧🏭', C.M_CO2), 1), ch4: r(ppm('🍰🫧🐄', C.M_CH4), 3),
      eps: r(D['📜']['⚾'], 3), glace: r(D['💧']['🍰💧🧊'], 4), alb: r(D['🪩']['🍰🪩📿'], 4), T2: r(m.T2, 2),
      Tpol: r(D['🧮']['🧮🌡️'] - m.dT.pol - C.T0_WATER, 1), nordMkm2: r(nord, 2), sudMkm2: r(sud, 2),
      abs: { pol: [r(m.absorbe.pol.neige, 3), r(m.absorbe.pol.glace, 3)], mid: [r(m.absorbe.mid.neige, 3), r(m.absorbe.mid.glace, 3)] },
      cal, st: D['🧮']['🧮🛑'] });
  };
  const REPRISE_PAS = 20;
  /** L'état au départ d'un clic : DATA entier et les puits de carbone, hors DATA (static/ui/progression.js). */
  const etat = () => ({ DATA: structuredClone(D), puits: { ocean: window.OCEAN_SINK.boxesKg(), terre: window.LAND_SINK.etat() } });
  let reprise = null, nClics = 0;
  const garder = (chaine) => { reprise = Object.assign({ chaine: chaine }, etat()); };
  try {
  if (window.__REPRISE__ !== undefined) {
    // Reprise : l'état gardé remis (comme PROGRESSION.poser), puis les clics continuent depuis son 📜.
    const R = window.__REPRISE__;
    window.OCEAN_SINK.poserBoxesKg(R.puits.ocean);
    window.LAND_SINK.poser(R.puits.terre);
    for (const k of Object.keys(R.DATA)) D[k] = R.DATA[k];   // 📜 porte l'époque et le curseur des clics ; api.run la prépare
    window.__FRISES__ = []; window.__DEPARTS__ = [];
    await clics(R.chaine);
  }
  for (const f of (window.__FRISES__ || [])) {
    const t0 = Date.now();
    window.CLICS.frise(f);
    const avant = Object.assign({}, D['🗻']['🍰🗻🧊']);
    window.__PROG__ = 'frise ' + f;
    await api.run({ epochId: f, animEnabled: false, precisionK: 0 });
    note('frise', 'frise ' + f, avant, t0);
  }
  for (const dep of (window.__DEPARTS__ || [])) {
    let t0 = Date.now();
    window.CLICS.frise(dep);
    let avant = Object.assign({}, D['🗻']['🍰🗻🧊']);
    window.__PROG__ = dep + ' frise';
    await api.run({ epochId: dep, animEnabled: false, precisionK: 0 });
    note(dep, 'frise ' + dep, avant, t0);
    await clics(dep);
  }
  } catch (e) { if (reprise !== null) window.__Q__.push({ reprise: reprise }); throw e; }
  async function clics(dep) {
    let t0, avant;
    while (D['📜']['🗿'] !== window.__FIN__) {
      garder(dep);
      if (++nClics % REPRISE_PAS === 0) window.__Q__.push({ reprise: reprise });
      t0 = Date.now();
      const depuis = D['📜']['🗿'];
      const key = window.CLICS.prochaineAction();
      const res = window.CLICS.jouer(key);
      if (res.passage !== null) window.CLICS.passer(res.passage);
      avant = Object.assign({}, D['🗻']['🍰🗻🧊']);
      window.__PROG__ = dep + ' : ' + depuis + ' ' + key + (res.passage !== null ? ' → ' + res.passage : '') + ' ' + D['📜']['📿💫'];
      await api.run({ epochId: D['📜']['🗿'], animEnabled: true, precisionK: 0 });
      note(dep, depuis + ' ' + key + (res.passage !== null ? ' → ' + res.passage : '') + ' (📿💫 ' + D['📜']['📿💫'] + ')', avant, t0);
    }
  }
  window.__PROG__ = 'done';
} catch (e) { window.__ERR__ = String(e && e.stack || e); window.__PROG__ = 'error'; } })(); 'x'
