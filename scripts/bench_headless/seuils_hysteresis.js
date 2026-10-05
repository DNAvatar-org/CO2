// File: CO2/scripts/bench_headless/seuils_hysteresis.js
// Desc: MESURE des quatre frontières du Cryogénien par dichotomie sur le CO₂, sur la CHAÎNE DE CLICS
//       (frise 🪸 puis tous les tictimes, T° et glace conservées) — la procédure de l'encadré « ÉPOQUES
//       D'HYSTÉRÉSIS » (configTimeline.js) et de README.md. À relancer après tout changement de physique.
//       Les frontières se cherchent DANS L'ORDRE de la chaîne (chacune dépend des précédentes) :
//         F1 entrée Sturtien : CO₂ de 1a (= ⛄) le plus BAS qui garde 1a chaud à l'arrivée de 🪸 ; puis 🗻 → ⛄ gelé
//         F2 sortie Sturtien : CO₂ de 1b le plus BAS qui fait sortir 1b (T > 0, glace < 0,1) depuis ⛄ gelé
//         F3 entrée Marinoen : CO₂ de 🏂 le plus HAUT qui gèle 🏂 à l'arrivée (1b restant chaud à ses 💫)
//         F4 sortie Marinoen : CO₂ de 1c le plus BAS qui fait sortir 1c depuis 🏂 gelé
//       Précision relative 5e-4 (0,05 %). Le TIMELINE n'est modifié qu'EN MÉMOIRE (page headless) :
//       le résultat s'écrit ensuite à la main dans la config, avec sa mesure en commentaire.
//       Écrit window.__SEUILS__ ; window.__PROG__ suit l'avancement.
// Version 1.0.0
// Date: 2026-09-24
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__='start'; window.__SEUILS__=null; window.__ERR__=null;
(async () => { try {
  const api=window.getBilanRadiatifAPI(function(){}), D=window.DATA, C=window.CONST;
  const ppmCO2 = () => +(D['🫧']['🍰🫧🏭']/C.M_CO2 / (1/D['🫧']['🧪'] - D['💧']['🍰🫧💧']/C.M_H2O) * 1e6).toFixed(2);
  const reset = () => { for (const k of ['🔺⚖️🏭','🔺⚖️🌊🏭','🔺⚖️🌳🏭','📿💫','📿☄️','📿🕰','🔺🍰⚽','🔺⚖️💧']) D['📜'][k]=0; };
  const TLid = id => window.TIMELINE.find(e => e['📅'] === id);
  const nextId = id => { const k = window.TIMELINE.findIndex(e => e['📅'] === id); for (let n = k + 1; n < window.TIMELINE.length; n++) if (window.TIMELINE[n]['📅']) return window.TIMELINE[n]['📅']; return null; };
  const passer = async (id) => {
    for (const k of ['📿💫','📿☄️','📿🕰','🔺⚖️🏭','🔺⚖️🌊🏭','🔺⚖️🌳🏭']) D['📜'][k]=0;
    D['📜']['🔘🕰']='';
    await api.run({ epochId:id, animEnabled:true });
  };
  const etat = (etape) => { const s=api.snapshot(); return { etape, ep:s.epochId, T:+s.T_C.toFixed(2), glace:+(+s.ice.mass_now).toFixed(3), ppm:ppmCO2() }; };
  // Même traversée que bench19 / courbe_modele : un clic = 📿 += 1, voile éventuel, temps += 🔺⏳.
  const traverser = async (id, notes) => {
    const EP = TLid(id), W = EP['🕰'] || {};
    const dur = Math.abs(EP['◀'] - EP['▶']) / 1e6;
    const clics = Array.isArray(W.order) ? W.order.slice() : null;
    const racine = W['💫'];
    let t = 0, n = 0;
    while (n < 50) {
      const seule = Object.keys(W).filter(k => W[k] && typeof W[k]['🔺⏳'] === 'number');
      const key = clics ? clics[n] : (racine ? '💫' : seule[0]);
      const cfg = W[key]; if (!cfg) throw new Error('clic introuvable '+id+' '+key);
      n++;
      D['📜']['📿💫'] = (D['📜']['📿💫'] || 0) + 1;
      if ((key === '💫' || key === '⛰') && racine && Object.prototype.hasOwnProperty.call(racine, '🍰⚽')) D['📜']['🔺🍰⚽'] = Number(racine['🍰⚽']);
      if ((key === '🗻' || key === '🌋') && Number.isFinite(cfg['🔺🍰⚽'])) D['📜']['🔺🍰⚽'] = Math.min(0.95, (D['📜']['🔺🍰⚽'] || 0) + cfg['🔺🍰⚽']);
      t += cfg['🔺⏳'];
      if (t >= dur - 1e-9) { const nx = nextId(id); await passer(nx); notes.push(etat(id+' →'+key+' '+nx)); return nx; }
      D['📜']['🔘🕰'] = key;
      await api.run({ epochId:id, animEnabled:true });
      notes.push(etat(id+' '+key+' #'+n));
    }
    throw new Error('traversée sans fin : '+id);
  };
  // Chaîne depuis la frise 🪸 jusqu'à l'ARRIVÉE dans `jusqua` (incluse). Renvoie toutes les notes.
  const chaine = async (jusqua) => {
    reset(); D['📜']['🔺🍰⚽']=0;
    await api.run({ epochId:'🪸', animEnabled:false });
    const notes=[etat('🪸 frise')];
    let id='🪸';
    while (id !== jusqua) id = await traverser(id, notes);
    return notes;
  };
  const arrivee = (notes, ep) => notes.find(n => n.ep === ep);   // premier état vu dans l'époque = arrivée
  const chaud = n => n.T > 0 && n.glace < 0.5, gele = n => n.T < -30 && n.glace > 0.8, sorti = n => n.T > 0 && n.glace < 0.1;
  const poser = (ids, kg) => { for (const id of ids) TLid(id)['⚖️🏭'] = kg; };

  // Dichotomie : pred(kg) vrai d'un côté, faux de l'autre. Cherche la frontière à 5e-4 près, en log.
  // cote = 'bas' : on veut le plus BAS kg où pred est vrai (pred vrai au-dessus) ; 'haut' : le plus HAUT.
  const dicho = async (nom, ids, pred, cote) => {
    const k0 = TLid(ids[0])['⚖️🏭'];
    const test = async (kg) => { poser(ids, kg); const r = await pred(); window.__PROG__ = nom+' '+kg.toExponential(5)+' → '+r.ok; return r; };
    let r0 = await test(k0), lo, hi;          // lo : pred faux ; hi : pred vrai (côté 'bas') — inverse pour 'haut'
    const vraiEnMontant = cote === 'bas';
    let a = k0, b = k0, ra = r0, rb = r0, pas = 1.3, n = 0;
    if (r0.ok === vraiEnMontant) { while (rb.ok === vraiEnMontant) { a = b; ra = rb; b = b / pas; rb = await test(b); if (++n > 40) throw new Error(nom+' : pas de bascule vers le bas'); } lo = b; hi = a; }
    else { while (ra.ok !== vraiEnMontant) { b = a; rb = ra; a = a * pas; ra = await test(a); if (++n > 40) throw new Error(nom+' : pas de bascule vers le haut'); } lo = b; hi = a; }
    // lo < hi ; pred(lo) = !vraiEnMontant, pred(hi) = vraiEnMontant
    while (hi / lo - 1 > 5e-4) {
      const m = Math.sqrt(lo * hi), rm = await test(m);
      if (rm.ok === vraiEnMontant) hi = m; else lo = m;
    }
    const garde = vraiEnMontant ? hi : lo;     // la valeur du côté où pred est vrai
    const rg = await test(garde);
    return { nom, kg: +garde.toPrecision(8), ok: rg.ok, notes: rg.notes, dernierAutreCote: +(vraiEnMontant ? lo : hi).toPrecision(8) };
  };

  const out = {};
  // F1 : 1a chaud à l'arrivée, et ⛄ gelé après 🗻.
  out.F1 = await dicho('F1 1a=⛄', ['hysteresis 1a', '⛄'], async () => {
    const notes = await chaine('⛄'); const a = arrivee(notes, 'hysteresis 1a'), b = arrivee(notes, '⛄');
    return { ok: chaud(a), notes, geleApres: gele(b) };
  }, 'bas');
  // F2 : 1b sorti à l'arrivée (depuis ⛄ gelé).
  out.F2 = await dicho('F2 1b', ['hysteresis 1b'], async () => {
    const notes = await chaine('hysteresis 1b'); return { ok: sorti(arrivee(notes, 'hysteresis 1b')), notes };
  }, 'bas');
  // F3 : 🏂 gelé à l'arrivée ; plus le CO₂ de 🏂 est haut, moins il gèle → on veut le plus HAUT qui gèle.
  out.F3 = await dicho('F3 🏂', ['🏂'], async () => {
    const notes = await chaine('🏂'); return { ok: gele(arrivee(notes, '🏂')), notes };
  }, 'haut');
  // F4 : 1c sorti à l'arrivée (depuis 🏂 gelé), puis 🪼 chaud.
  out.F4 = await dicho('F4 1c', ['hysteresis 1c'], async () => {
    const notes = await chaine('🪼'); return { ok: sorti(arrivee(notes, 'hysteresis 1c')) && chaud(arrivee(notes, '🪼')), notes };
  }, 'bas');
  window.__SEUILS__ = out; window.__PROG__='done';
} catch(e){ window.__ERR__=String(e&&e.stack||e); window.__PROG__='error'; } })(); 'x'
