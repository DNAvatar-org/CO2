// File: CO2/static/ui/bench_pilote.js
// Desc: Le BANC dans l'index n'est qu'un flag : window.BENCH.suite ∈ 'no' | 'epoque' | 'tictime' dit quoi faire à la FIN
//       d'un calcul de l'interface (runComputeInParent, sync_panels.js) — rien, un vrai clic sur la frise de l'époque
//       suivante, ou un vrai clic sur l'action suivante (jouerClic, passages compris). L'interface bouge donc comme sous
//       la souris (organigramme, frise, curseur) ; seule la vue spectrale est absente (onglet Bench par-dessus).
//       Chaque calcul envoie sa ligne au tableau de l'iframe Bench (API_BILAN/demo/epoch_bench.html, mode encart :
//       js/epoch_bench_encart.js). 'no' par défaut : l'usage normal de l'interface n'est pas touché.
//       Chargé AVANT le moteur et sync_panels (loader_panels.js, before) : ceux-ci l'appellent sans test.
// Version 1.0.0
// Date: 2026-10-15
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';

    const BENCH = {
        suite: 'no',      // 'no' | 'epoque' | 'tictime'
        n: 0,             // calculs du run
        t0: 0,
        tPrecC: null,     // T° convergée du calcul précédent : T° initiale d'un tictime
        pas: { init: null, last: null, path: [] }
    };

    function poster(msg) {
        document.getElementById('bench-iframe').contentWindow.postMessage(msg, '*');
    }

    /** Ce que le tableau lit d'un pas de convergence (epoch_bench_format.js : fmtRadInitAndPath, updateRow). */
    function pasUtile(p) {
        return { phase: p.phase, delta_equilibre: p.delta_equilibre, temperature_C: p.temperature_C };
    }

    /** Une ligne de tableau : de quoi faire createRow / updateRow dans l'iframe (époque relue dans son TIMELINE). */
    function ligneCourante() {
        const D = window.DATA, H = D['📜'];
        const EP = window.TIMELINE[H['👉']];
        const anim = D['🔘']['🔘🎞'];
        return {
            rowKey: 'clic' + BENCH.n,
            epochId: EP['📅'],
            etape: !anim ? 'frise' : H['🔘🕰'] === '' ? 'arrivée' : H['🔘🕰'] + ' (' + (+H['⏳'].toFixed(4)) + ' Ma)',   // '' : passage d'époque
            tInitC: anim ? BENCH.tPrecC : EP['🌡️🧮'] - 273.15
        };
    }

    /** Lancement depuis l'iframe (bouton ▶ Époques / ▶ Tictimes) : le flag, puis le premier vrai clic, frise ⚫. */
    BENCH.lancer = function (mode) {
        BENCH.suite = mode;
        BENCH.n = 0;
        BENCH.t0 = Date.now();
        BENCH.tPrecC = null;
        window.setEpochFromEpochButton(window.TIMELINE[0]['📅']);
    };

    BENCH.arreter = function () {
        BENCH.suite = 'no';
        poster({ type: 'bench:fin', resume: BENCH.n + ' calculs', t0: BENCH.t0 });
    };

    /** Début d'un calcul (runComputeInParent) : pas remis à zéro ; en banc, la ligne « en cours » dans l'iframe. */
    BENCH.debutCalcul = function () {
        BENCH.pas = { init: null, last: null, path: [] };
        if (BENCH.suite === 'no') return;
        BENCH.n++;
        poster({ type: 'bench:debut', ligne: ligneCourante(), avance: window.DATA['📜']['👉'] / window.TIMELINE.length });
    };

    /** Pas de convergence (onEngineEvent) : même tri que le banc autonome (epoch_bench_run.js, benchOnEvent). */
    BENCH.surPas = function (p) {
        const P = BENCH.pas;
        if (p.phase === 'Init') { P.init = pasUtile(p); P.path.push(p.temperature_C); }
        if (p.phase === 'Search' || p.phase === 'Dicho') {
            P.last = pasUtile(p);
            if (Math.abs(P.path[P.path.length - 1] - p.temperature_C) > 1e-5) P.path.push(p.temperature_C);
        }
    };

    /** Fin d'un calcul (runComputeInParent, après la mise à jour de l'interface ; result null = interrompu) : la ligne
     *  part vers l'iframe, puis le flag décide du clic suivant. */
    BENCH.apresCalcul = function (result) {
        if (BENCH.suite === 'no') return;
        const D = window.DATA, H = D['📜'], P = BENCH.pas;
        window.RADIATIVE.calculateRadiativeCapacities();
        const ligne = ligneCourante();
        ligne.initStep = P.init;
        ligne.lastStep = P.last === null ? P.init : P.last;
        ligne.status = result === null ? 'abort' : D['🧮']['🧮🛑'];
        ligne.path = P.path;
        ligne.convAtmSnap = {
            co2Frac: D['🫧']['🍰🫧🏭'], ch4Frac: D['🫧']['🍰🫧🐄'], h2oFrac: D['💧']['🍰🫧💧'], albedo: D['🪩']['🍰🪩📿'],
            Mair: D['🫧']['🧪'], capCO2IR: D['🫧']['🍰🫧🏭🌈'], capH2OIR: D['🫧']['🍰🫧💧🌈'], capSumIR: D['🫧']['🍰🫧📿🌈']
        };
        poster({ type: 'bench:ligne', ligne: ligne });
        BENCH.tPrecC = D['🧮']['🧮🌡️'] - 273.15;

        if (BENCH.suite === 'epoque') {
            const i = H['👉'] + 1;
            if (i >= window.TIMELINE.length) { BENCH.arreter(); return; }
            window.setEpochFromEpochButton(window.TIMELINE[i]['📅']);
            return;
        }
        // 'tictime' : jusqu'au ⛽ 2000 → 2025 de 📱, comme le banc autonome (epoch_bench_chain.js).
        if (H['🗿'] === '📱' && H['📿💫'] === 1) { BENCH.arreter(); return; }
        window.jouerClic(window.CLICS.prochaineAction());
    };

    // L'iframe Bench (mode encart) parle : lancer, passer le calcul en cours (⏭), arrêter.
    window.addEventListener('message', function (e) {
        if (e.data.type === 'bench:lancer') BENCH.lancer(e.data.mode);
        if (e.data.type === 'bench:passer') window.ABORT_COMPUTE = true;
        if (e.data.type === 'bench:arreter') BENCH.arreter();
    });

    window.BENCH = BENCH;
})();
