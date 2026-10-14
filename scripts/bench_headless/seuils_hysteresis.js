// File: CO2/scripts/bench_headless/seuils_hysteresis.js
// Desc: MESURE des frontières du Cryogénien par dichotomie, CO₂ ET CH₄ descendus ENSEMBLE dans leurs fourchettes de la
//       littérature (window.BENCH_LIT_BY_EPOCH_ID : x = min + s (max − min), s ∈ [0, 1], ppm d'air sec), critère
//       « frise = clic » : l'état attendu doit tenir au CLIC FRISE sur l'époque ET à l'arrivée par la CHAÎNE DE CLICS
//       (frise 🪸 puis tous les clics, T° et glace conservées). Dans l'ordre de la chaîne (chacune dépend des précédentes) :
//         F1 ☃ = ⛄ : s le plus BAS où ☃ est chaud ; vérification 🗻 → ⛄ gelé, puis ⛄ encore gelé après 💫 (voile retiré)
//         F2 1b     : s le plus BAS où 1b est sorti (T > 0, glace < 0,1), depuis ⛄ gelé
//         F3 🏂     : s le plus HAUT où 🏂 est gelé (T < −30, glace > 0,8)
//         F4 1c     : s le plus BAS où 1c est sorti depuis 🏂 gelé, et 🪼 chaud ensuite
//       BORNÉ : s reste dans [0, 1] (pas d'extrapolation hors des fourchettes). Les deux bouts sont mesurés d'abord : même
//       verdict aux deux → pas de frontière dans les fourchettes, on le dit et la config n'est pas touchée ; sinon
//       window.__NB_PAS__ bisections (défaut 12 : 1/4096 de la fourchette). Le clic frise, un seul calcul, est testé avant
//       la chaîne. Frontières à mesurer : window.__FRONTIERES__ (défaut ['F1','F2','F3','F4']). Chaque frontière trouvée est
//       posée EN MÉMOIRE avant la suivante ; le fichier de config n'est jamais modifié — reporter ensuite à la main dans
//       configTimeline.js, mesure en commentaire. Résultats : window.__SEUILS__ ; chaque essai : window.__ESSAIS__ (--stream).
//       Doc : API_BILAN/doc/HYSTERESIS_FRONTIERES.md.
// Version 2.0.0
// - v2.0.0 (2026-10-14): CO₂ + CH₄ dans les fourchettes, critère frise = clic, s borné à [0, 1] (v1 : CO₂ seul, chaîne seule,
//   encadrement jusqu'à 40 pas ×1,3 hors fourchette).
// Date: 2026-10-14
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__='start'; window.__SEUILS__=null; window.__ESSAIS__=[]; window.__ERR__=null;
(async () => { try {
  const api=window.getBilanRadiatifAPI(function(){}), D=window.DATA, C=window.CONST, LIT=window.BENCH_LIT_BY_EPOCH_ID;
  const NB_PAS = window.__NB_PAS__ || 12;
  const FRONTIERES = window.__FRONTIERES__ || ['F1', 'F2', 'F3', 'F4'];
  const TLid = id => window.TIMELINE.find(e => e['📅'] === id);
  const ppm = () => { const m=D['⚖️'], n=m['⚖️🏭']/C.M_CO2+m['⚖️🐄']/C.M_CH4+m['⚖️🫁']/C.M_O2+m['⚖️💨']/C.M_N2;
    return [+(m['⚖️🏭']/C.M_CO2/n*1e6).toFixed(1), +(m['⚖️🐄']/C.M_CH4/n*1e6).toFixed(2)]; };
  const etat = (etape) => { const s=api.snapshot(), p=ppm();
    return { etape, ep:s.epochId, T:+s.T_C.toFixed(2), glace:+(+s.ice.mass_now).toFixed(3), co2:p[0], ch4:p[1] }; };
  const chaud = n => n.T > 0 && n.glace < 0.5, gele = n => n.T < -30 && n.glace > 0.8, sorti = n => n.T > 0 && n.glace < 0.1;

  // CO₂ et CH₄ de la fourchette de `ref` au paramètre s, posés (en mémoire) sur toutes les époques `ids` : mêmes ppm d'air
  // sec, masses calculées avec le N₂ et l'O₂ de chaque époque.
  const poser = (ids, ref, s) => {
    const L = LIT[ref], xc = (L.co2[0] + s * (L.co2[1] - L.co2[0])) * 1e-6, xm = (L.ch4[0] + s * (L.ch4[1] - L.ch4[0])) * 1e-6;
    for (const id of ids) { const E = TLid(id), nt = (E['⚖️💨']/C.M_N2 + E['⚖️🫁']/C.M_O2) / (1 - xc - xm);
      E['⚖️🏭'] = xc * nt * C.M_CO2; E['⚖️🐄'] = xm * nt * C.M_CH4; }
    return { co2_ppm: +(xc*1e6).toFixed(2), ch4_ppm: +(xm*1e6).toFixed(3), co2_kg: TLid(ids[0])['⚖️🏭'], ch4_kg: TLid(ids[0])['⚖️🐄'] };
  };
  const clic = async () => { const key=window.CLICS.prochaineAction(), r=window.CLICS.jouer(key); if (r.passage!==null) window.CLICS.passer(r.passage);
    await api.run({ epochId: D['📜']['🗿'], animEnabled:true }); return key; };
  // Clic frise sur `id` : la graine de l'époque, un calcul.
  const frise = async (id) => { window.CLICS.frise(id); await api.run({ epochId:id, animEnabled:false }); return etat('frise '+id); };
  // Chaîne depuis la frise 🪸 jusqu'à l'ARRIVÉE dans `jusqua` (incluse) ; arrivee(ep) = premier état vu dans ep.
  const chaine = async (jusqua) => {
    window.CLICS.frise('🪸'); await api.run({ epochId:'🪸', animEnabled:false });
    const notes=[etat('frise 🪸')];
    while (D['📜']['🗿'] !== jusqua) { const depuis=D['📜']['🗿'], key=await clic(); notes.push(etat(depuis+' '+key)); }
    return notes;
  };
  const arrivee = (notes, ep) => notes.find(n => n.ep === ep);

  // Une frontière : ids (époques qui portent les gaz), ref (fourchette), cible (époque jugée), verdict(frise, chaîne) → bool,
  // cote 'bas' (verdict vrai au-dessus : on garde le s le plus BAS) ou 'haut' (vrai en dessous : le plus HAUT).
  const frontiere = async (nom, ids, ref, cible, jusqua, verdictFrise, verdictChaine, cote) => {
    const sauve = ids.map(id => [TLid(id)['⚖️🏭'], TLid(id)['⚖️🐄']]);
    const essai = async (s) => {
      const g = poser(ids, ref, s); window.__PROG__ = nom+' s='+s;
      const f = await frise(cible), okF = verdictFrise(f);
      let ok = okF, notes = null;
      if (okF) { notes = await chaine(jusqua); ok = verdictChaine(notes); }
      const e = { nom, s, co2:g.co2_ppm, ch4:g.ch4_ppm, ok, frise:f, chaine: notes && arrivee(notes, cible) };
      window.__ESSAIS__.push(e); return e;
    };
    const vraiEnHaut = cote === 'bas';
    const e0 = await essai(0), e1 = await essai(1);
    if (e0.ok === e1.ok) {
      ids.forEach((id, i) => { TLid(id)['⚖️🏭'] = sauve[i][0]; TLid(id)['⚖️🐄'] = sauve[i][1]; });
      return { nom, frontiere: false, verdictPartout: e0.ok, bouts: [e0, e1] };
    }
    if (e1.ok !== vraiEnHaut) throw new Error(nom+' : le verdict est dans le mauvais sens (vrai à s=0, faux à s=1 pour un côté '+cote+')');
    let lo = 0, hi = 1;                                 // côté 'bas' : faux à lo, vrai à hi ; côté 'haut' : vrai à lo, faux à hi
    for (let i = 0; i < NB_PAS; i++) { const m = (lo + hi) / 2, e = await essai(m); if (e.ok === vraiEnHaut) hi = m; else lo = m; }
    const garde = vraiEnHaut ? hi : lo, autre = vraiEnHaut ? lo : hi;
    const eg = await essai(garde);
    return { nom, frontiere: true, s: garde, gaz: poser(ids, ref, garde), ok: eg.ok, autreCote: { s: autre, gaz: poser(ids, ref, autre) },
      essai: eg, _poser: () => poser(ids, ref, garde) };
  };

  const out = {};
  const finir = (r) => { if (r.frontiere) r._poser(); delete r._poser; return r; };   // la frontière reste posée pour la suite
  if (FRONTIERES.includes('F1')) {
    out.F1 = finir(await frontiere('F1 ☃=⛄', ['hysteresis 1a', '⛄'], 'hysteresis 1a', 'hysteresis 1a', 'hysteresis 1a',
      chaud, notes => chaud(arrivee(notes, 'hysteresis 1a')), 'bas'));
    // Vérification : 🗻 → ⛄ gelé, puis 💫 (voile retiré) → ⛄ encore gelé = hystérésis.
    await chaine('hysteresis 1a'); await clic(); const v1 = etat('🗻 → ⛄'); await clic(); const v2 = etat('⛄ 💫');
    out.F1.verification = { avecVoile: v1, sansVoile: v2, ok: gele(v1) && gele(v2) };
  }
  if (FRONTIERES.includes('F2')) out.F2 = finir(await frontiere('F2 1b', ['hysteresis 1b'], 'hysteresis 1b', 'hysteresis 1b', 'hysteresis 1b',
    sorti, notes => gele(arrivee(notes, '⛄')) && sorti(arrivee(notes, 'hysteresis 1b')), 'bas'));
  if (FRONTIERES.includes('F3')) out.F3 = finir(await frontiere('F3 🏂', ['🏂'], '🏂', '🏂', '🏂',
    gele, notes => gele(arrivee(notes, '🏂')), 'haut'));
  if (FRONTIERES.includes('F4')) out.F4 = finir(await frontiere('F4 1c', ['hysteresis 1c'], 'hysteresis 1c', 'hysteresis 1c', '🪼',
    sorti, notes => gele(arrivee(notes, '🏂')) && sorti(arrivee(notes, 'hysteresis 1c')) && chaud(arrivee(notes, '🪼')), 'bas'));
  window.__SEUILS__ = out; window.__PROG__='done';
} catch(e){ window.__ERR__=String(e&&e.stack||e); window.__PROG__='error'; } })(); 'x'
