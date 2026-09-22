// Les 19 époques depuis leur graine (animEnabled:false), comparées à BENCH_LIT_BY_EPOCH_ID.
// Écrit window.__R6__ ; window.__PROG__ suit l'avancement.
window.__PROG__='start'; window.__R6__=[]; window.__ERR__=null;
(async () => {
 try {
  const api=window.getBilanRadiatifAPI(function(){}), D=window.DATA, C=window.CONST;
  const LIT=window.BENCH_LIT_BY_EPOCH_ID;
  for (const EP of window.TIMELINE) {
    if (!EP['📅']) continue;
    const id=EP['📅'];
    D['📜']['🔺⚖️🏭']=0; D['📜']['🌊🔺⚖️🏭']=0; D['📜']['🌳🔺⚖️🏭']=0; D['📜']['📿💫']=0; D['📜']['📿☄️']=0;
    window.__PROG__='bench '+id;
    await api.run({ epochId:id, animEnabled:false });
    const s=api.snapshot(), lit=LIT[id];
    const ppm=D['🫧']['🍰🫧🏭']*1e6*D['🫧']['🧪']/C.M_CO2;
    window.__R6__.push({ ep:id, T:+s.T_C.toFixed(2), litT: lit?lit.tC.join('–'):'—',
      dansFourchette: lit ? (s.T_C>=lit.tC[0] && s.T_C<=lit.tC[1]) : null,
      ppm:+ppm.toFixed(1), st:s.status });
  }
  window.__PROG__='done';
 } catch(e){ window.__ERR__=String(e&&e.stack||e); window.__PROG__='error'; }
})();
'launched'
