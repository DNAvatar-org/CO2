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
//       Balayage : poser window.__BENCH_BARYS__ = [{ FROID: 35, CHAUD: 50 }, …] AVANT d'injecter ce script
//       (jeux de jauges partiels, appliqués par TUNING.applyTuningPayload ; voir FINE_TUNING_BOUNDS.jauges).
// Version 2.1.0
// Date: 2026-10-12
// logs :
//   - v2.1.0 (2026-10-13): jauges séparées FROID / CHAUD / SUBTIL / HYSTERESIS ; `pct` = étiquette des jauges.
//   - v2.0.0: clics par CLICS (API_BILAN/convergence/clics.js), plus de copie de la mécanique ici.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.__PROG__='start'; window.__R6__=[]; window.__ERR__=null;
(async () => {
 try {
  const api=window.getBilanRadiatifAPI(function(){}), D=window.DATA, C=window.CONST;
  const LIT=window.BENCH_LIT_BY_EPOCH_ID;
  // Balayage des jauges : window.__BENCH_BARYS__ = [{ FROID: 35, … }, …] posé avant l'injection ; sinon réglage courant.
  const barys = ('__BENCH_BARYS__' in window) ? window.__BENCH_BARYS__ : [null];
  // Étiquette du réglage courant, ex. « FROID 35 · CHAUD 50 · SUBTIL 50 · HYSTERESIS 100 ».
  const etiquette = () => Object.keys(window.FINE_TUNING_BOUNDS.jauges).map(k => k + ' ' + D['🎚️'].baryByGroup[k]).join(' · ');
  // ppm en AIR SEC, comme les mesures (NOAA, carottes) : x = (w/M_CO₂) / (1/M_air − w_H₂O/M_H₂O)
  const ppmCO2 = () => +(D['🫧']['🍰🫧🏭']/C.M_CO2 / (1/D['🫧']['🧪'] - D['💧']['🍰🫧💧']/C.M_H2O) * 1e6).toFixed(1);
  // Un tictime, tel que le joue l'interface : le premier clic de la séquence de l'époque (🕰.order de la config ;
  // 📱 : ⛽ de la tranche 2000). Mécanique : CLICS (API_BILAN/convergence/clics.js).
  const tic = () => {
    const key = window.CLICS.prochaineAction();
    return { key, r: window.CLICS.jouer(key) };
  };
  // ─── PASSAGES D'HYSTÉRÉSIS : on REJOUE LES CLICS, comme l'interface ────────────────────
  // Critère de l'utilisateur : la convergence au CLIC (tictime) et à la FRISE (graine) doivent être
  // les mêmes. La frise ne sert qu'à arriver vite, en partant de la bonne T°.
  window.__PASSAGES__ = [];
  const note = (chaine, etape) => {
    const s=api.snapshot();
    const r={ pct: etiquette(), chaine, etape, ep:s.epochId, T:+s.T_C.toFixed(2),
      glace:+(+s.ice.mass_now).toFixed(3), ppm:ppmCO2() };
    window.__PASSAGES__.push(r); return r;
  };
  // Clics depuis l'époque courante jusqu'à arriver sur `fin` (une ligne par clic).
  const cliquerJusqua = async (chaine, fin) => {
    while (D['📜']['🗿'] !== fin) {
      const depuis = D['📜']['🗿'];
      const key = window.CLICS.prochaineAction();
      const r = window.CLICS.jouer(key);
      if (r.passage !== null) window.CLICS.passer(r.passage);
      window.__PROG__ = 'clic '+depuis+' '+key+(r.passage !== null ? ' → '+r.passage : '');
      await api.run({ epochId: D['📜']['🗿'], animEnabled:true });
      note(chaine, r.passage !== null ? depuis+' →'+key+' '+r.passage : depuis+' '+key+' ('+(+D['📜']['⏳'].toFixed(4))+' Ma écoulés)');
    }
  };
  const passages = async (pct) => {
    // Chaîne Snowball : frise sur 🪸, puis on clique jusqu'à 🍄.
    window.CLICS.frise('🪸');
    window.__PROG__='chaîne 🪸'; await api.run({ epochId:'🪸', animEnabled:false }); note('Snowball', '🪸 frise');
    await cliquerJusqua('Snowball', '🍄');
    // Chaîne EOT : frise sur 🐊, puis clics jusqu'à 🦣.
    window.CLICS.frise('🐊');
    window.__PROG__='chaîne 🐊'; await api.run({ epochId:'🐊', animEnabled:false }); note('EOT', '🐊 frise');
    await cliquerJusqua('EOT', '🦣');
    // CRITÈRE : FRISE = CLIC. Pour chaque hystérésis (et ⛄), la T° convergée depuis la graine (frise) doit
    // égaler celle de l'ARRIVÉE par clic. Sinon la graine est sur la mauvaise branche, ou la config n'est
    // pas à la frontière que le clic traverse.
    for (const h of ['hysteresis 1a', '⛄', 'hysteresis 1b', '🏂', 'hysteresis 1c', 'hysteresis 2']) {
      const arr = window.__PASSAGES__.find(p => p.pct === etiquette() && p.ep === h);
      const fr  = window.__R6__.find(r => r.pct === etiquette() && r.ep === h);
      if (arr && fr) window.__PASSAGES__.push({ pct: arr.pct, chaine: 'frise = clic', etape: h,
        T_frise: fr.T, T_clic: arr.T, ecart: +(fr.T - arr.T).toFixed(2), ok: Math.abs(fr.T - arr.T) < 0.5 });
    }
  };
  for (const pct of barys) {
    if (pct !== null) window.TUNING.applyTuningPayload({ baryByGroup: pct });
    for (const EP of window.TIMELINE) {
      const id=EP['📅'], lit=LIT[id];
      window.CLICS.frise(id);
      window.__PROG__='bench '+(pct!==null?etiquette()+' ':'')+id;
      await api.run({ epochId:id, animEnabled:false });
      let s=api.snapshot();
      const row = { pct: etiquette(), ep:id, T:+s.T_C.toFixed(3), litT: lit.tC,
        dansFourchette: s.T_C>=lit.tC[0] && s.T_C<=lit.tC[1], ppm:ppmCO2(), st:s.status };
      if (!/^hysteresis/.test(id)) {
        const t = tic();
        window.__PROG__='tic '+(pct!==null?etiquette()+' ':'')+id;
        if (t.r.passage !== null) { row.tic = t.key; row.ticErr = 'transition vers '+t.r.passage; }
        else {
          await api.run({ epochId:id, animEnabled:true });
          s=api.snapshot();
          Object.assign(row, { tic:t.key, T_tic:+s.T_C.toFixed(3), ppm_tic:ppmCO2(), st_tic:s.status,
            dansFourchette_tic: s.T_C>=lit.tC[0] && s.T_C<=lit.tC[1] });
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
