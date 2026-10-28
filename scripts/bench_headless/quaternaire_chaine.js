// File: CO2/scripts/bench_headless/quaternaire_chaine.js
// Desc: Sonde des calottes le long d'une chaîne de clics : frises de contrôle (window.__FRISES__), puis pour chaque départ
//       (window.__DEPARTS__) frise et clics jusqu'à l'arrivée sur window.__FIN__. Un point par calcul : T, CO₂, CH₄, obliquité de
//       l'orbite, glace, albédo, T₂, aire de glace par hémisphère (millions de km²) et, par bande, la calotte portée avant le clic,
//       celle du calcul, son équilibre, son temps de réaction, sa marge (°), et son socle : temps de rebond τ_b (ka), sous-pas
//       intégrés, écart maximal à l'équilibre d'Airy (m). Écrit window.__Q__ (à lire avec --stream __Q__).
//       Usage : (echo "window.__FRISES__=['🚂']; window.__DEPARTS__=['🏔']; window.__FIN__='📱';"; cat quaternaire_chaine.js) > /tmp/q.js
//               python3 run.py /tmp/q.js --var __Q__ --timeout 4000 --stream __Q__
// Version 1.1.0
// - v1.1.0 (2026-10-28): socle des calottes par bande (tauSocle_ka, sousPas, ecart_m).
// Date: [October 28, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__='start'; window.__Q__=[]; window.__ERR__=null;
(async () => { try {
  const api = window.getBilanRadiatifAPI(function(){}), D = window.DATA, C = window.CONST, HD = window._hystDiag;
  const ppm = (cle, M) => D['🫧'][cle] / M / (1 / D['🫧']['🧪'] - D['💧']['🍰🫧💧'] / C.M_H2O) * 1e6;
  const r = (v, n) => +(+v).toFixed(n);
  const R = 6371e3, aireBande = { pol: 2*Math.PI*R*R*(1-Math.sin(Math.PI/3))/1e12, mid: 2*Math.PI*R*R*(Math.sin(Math.PI/3)-0.5)/1e12, trop: 2*Math.PI*R*R*0.5/1e12 };
  const note = (chaine, etape, avant, t0) => {
    const ep = D['📜']['🗿'], E = window.TIMELINE.find(e => e['📅'] === ep);
    const m = HD.meridien, cal = {};
    let nord = 0, sud = 0;
    for (const b of window.CALOTTES.BANDES) {
      const c = m.calottes[b.cle];
      cal[b.cle] = { avant: r(avant[b.cle], 4), a: r(c.a, 4), aEq: r(c.aEq, 4), tau_ka: r(c.tau / 1e3, 1), Ts: r(c.Ts - 273.15, 1),
        acc: r(c.accumulation, 0), fonte: r(c.fonte, 0), H: r(c.H, 0), z: r(c.z, 0), marge: r(c.marge, 1),
        tauSocle_ka: r(c.tauSocle / 1e3, 2), sousPas: c.sousPas, ecart_m: r(c.ecart_m, 0) };
      if (b.h > 0) nord += c.a * aireBande[b.zone]; else sud += c.a * aireBande[b.zone];
    }
    window.__Q__.push({ chaine, etape, ep, age: Math.round(window.INTERIEUR.ageCourant(D)), s: Math.round((Date.now() - t0) / 1000),
      T: r(D['🧮']['🧮🌡️'] - 273.15, 2), co2: r(ppm('🍰🫧🏭', C.M_CO2), 1), ch4: r(ppm('🍰🫧🐄', C.M_CH4), 3),
      eps: r(window.EARTH.obliquiteCourante(E), 3), glace: r(D['💧']['🍰💧🧊'], 4), alb: r(D['🪩']['🍰🪩📿'], 4), T2: r(m.T2, 2),
      Tpol: r(D['🧮']['🧮🌡️'] - m.dT.pol - 273.15, 1), nordMkm2: r(nord, 2), sudMkm2: r(sud, 2),
      abs: { pol: [r(m.absorbe.pol.neige, 3), r(m.absorbe.pol.glace, 3)], mid: [r(m.absorbe.mid.neige, 3), r(m.absorbe.mid.glace, 3)] },
      cal, st: D['🧮']['🧮🛑'] });
  };
  for (const f of (window.__FRISES__ || [])) {
    const t0 = Date.now();
    window.CLICS.frise(f);
    const avant = Object.assign({}, D['🗻']['🍰🗻🧊']);
    window.__PROG__ = 'frise ' + f;
    await api.run({ epochId: f, animEnabled: false });
    note('frise', 'frise ' + f, avant, t0);
  }
  for (const dep of (window.__DEPARTS__ || [])) {
    let t0 = Date.now();
    window.CLICS.frise(dep);
    let avant = Object.assign({}, D['🗻']['🍰🗻🧊']);
    window.__PROG__ = dep + ' frise';
    await api.run({ epochId: dep, animEnabled: false });
    note(dep, 'frise ' + dep, avant, t0);
    while (D['📜']['🗿'] !== window.__FIN__) {
      t0 = Date.now();
      const depuis = D['📜']['🗿'];
      const key = window.CLICS.prochaineAction();
      const res = window.CLICS.jouer(key);
      if (res.passage !== null) window.CLICS.passer(res.passage);
      avant = Object.assign({}, D['🗻']['🍰🗻🧊']);
      window.__PROG__ = dep + ' : ' + depuis + ' ' + key + (res.passage !== null ? ' → ' + res.passage : '') + ' ' + D['📜']['📿💫'];
      await api.run({ epochId: D['📜']['🗿'], animEnabled: true });
      note(dep, depuis + ' ' + key + (res.passage !== null ? ' → ' + res.passage : '') + ' (📿💫 ' + D['📜']['📿💫'] + ')', avant, t0);
    }
  }
  window.__PROG__ = 'done';
} catch (e) { window.__ERR__ = String(e && e.stack || e); window.__PROG__ = 'error'; } })(); 'x'
