// File: CO2/static/ui/bench_pilote.js
// Desc: Le BANC dans l'index n'est qu'un flag : window.BENCH.suite ∈ 'no' | 'epoque' | 'tictime' dit quoi faire à la FIN
//       d'un calcul de l'interface (runComputeInParent, sync_panels.js) — rien, un vrai clic sur la frise de l'époque
//       suivante, ou un vrai clic sur l'action suivante (jouerClic, passages compris). L'interface bouge donc comme sous
//       la souris (organigramme, frise, curseur) ; seule la vue spectrale est absente (onglet Bench par-dessus).
//       Chaque calcul envoie sa ligne au tableau de l'iframe Bench (API_BILAN/demo/epoch_bench.html, mode encart :
//       js/epoch_bench_encart.js) — run ou pas : hors run ('no', défaut), chaque calcul de l'utilisateur (frise,
//       tictime) y ajoute aussi sa ligne et son état, sans clic suivant ni courbe d'Histoire.
//       Chargé AVANT le moteur et sync_panels (loader_panels.js, before) : ceux-ci l'appellent sans test.
// Version 1.3.5
// - v1.3.5: tranches de 📱 hors run : courbe d'Histoire à part (scenario), repartie à l'arrivée en 2000, plus l'orange.
// - v1.3.4: étape d'un tictime = temps écoulé dans l'époque (📜⏳ : « 🛢 (+75 a) »), cumulé clic après clic.
// - v1.3.3: hors run, chaque tranche de 25 ans jouée sur 📱 prolonge la courbe orange d'Histoire (histoire:prolonger).
// - v1.3.2: la ligne porte la date de l'état calculé (CLICS.date()) : elle avance à chaque tictime.
// - v1.3.1: étape d'un tictime = sa durée de config (📜🔺⏳ : « ⛽ (+25 a) »), plus le temps écoulé en Ma.
// - v1.3.0: hors run aussi, chaque calcul ajoute sa ligne au tableau (et garde son état) ; les courbes d'Histoire,
//   seulement pendant un run.
// - v1.2.0: la courbe du modèle de l'onglet Histoire est vidée au lancement puis retracée à chaque calcul
//   (HISTOIRE.pointModele, static/histoire/point_modele.js) — Époques : violette, Tictimes : orange.
// - v1.1.0: l'état de fin de chaque calcul est gardé (BENCH.etats) ; clic sur une ligne → BENCH.voir le recharge.
// Date: 2026-10-15
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';

    const BENCH = {
        suite: 'no',      // 'no' | 'epoque' | 'tictime'
        n: 0,             // calculs du run
        t0: 0,
        tPrecC: null,     // T° convergée du calcul précédent : T° initiale d'un tictime
        pas: { init: null, last: null, path: [] },
        etats: {},        // rowKey → { DATA (copie), result } : l'état de fin de chaque calcul, que BENCH.voir recharge
        courbe: null,     // courbe d'Histoire retracée par le run : 'modeleFrise' (Époques, violette) | 'modele' (Tictimes, orange)
        clic: null        // { depuis, cle, dt } : le clic d'action qui a lancé le calcul (null = clic sur la frise)
    };

    /** L'onglet Histoire (iframe) : sa courbe du modèle est retracée point par point pendant le run. */
    function posterHistoire(msg) {
        document.getElementById('histoire-iframe').contentWindow.postMessage(msg, '*');
    }

    function poster(msg) {
        document.getElementById('bench-iframe').contentWindow.postMessage(msg, '*');
    }

    /** Ce que le tableau lit d'un pas de convergence (epoch_bench_format.js : fmtRadInitAndPath, updateRow). */
    function pasUtile(p) {
        return { phase: p.phase, delta_equilibre: p.delta_equilibre, temperature_C: p.temperature_C };
    }

    /** Durée d'un clic (Ma, 📜🔺⏳ — celle de la config) dans l'unité qui la rend lisible : 25 a, 10 ka, 16 Ma. */
    function duree(ma) {
        if (ma >= 1) return (+ma.toFixed(2)) + ' Ma';
        if (ma >= 1e-3) return (+(ma * 1e3).toFixed(2)) + ' ka';
        return Math.round(ma * 1e6) + ' a';
    }

    /** Une ligne de tableau : de quoi faire createRow / updateRow dans l'iframe (époque relue dans son TIMELINE). */
    function ligneCourante() {
        const D = window.DATA, H = D['📜'];
        const EP = window.TIMELINE[H['👉']];
        const anim = D['🔘']['🔘🎞'];
        return {
            rowKey: 'clic' + BENCH.n,
            epochId: EP['📅'],
            etape: !anim ? 'frise' : H['🔘🕰'] === '' ? 'arrivée' : H['🔘🕰'] + ' (+' + duree(H['⏳']) + ')',   // '' : passage d'époque ; durée cumulée dans l'époque (📜⏳)
            tInitC: anim ? BENCH.tPrecC : EP['🌡️🧮'] - 273.15,
            date: window.CLICS.date()   // date de l'état calculé (2025, 2050… sur 📱)
        };
    }

    /** Lancement depuis l'iframe (bouton ▶ Époques / ▶ Tictimes) : le flag, puis le premier vrai clic, frise ⚫. */
    BENCH.lancer = function (mode) {
        BENCH.suite = mode;
        BENCH.n = 0;
        BENCH.t0 = Date.now();
        BENCH.tPrecC = null;
        BENCH.etats = {};
        BENCH.clic = null;
        BENCH.courbe = mode === 'epoque' ? 'modeleFrise' : 'modele';
        posterHistoire({ type: 'histoire:courbe', courbe: BENCH.courbe, mode: mode === 'epoque' ? 'frise' : 'clics',
            bary: structuredClone(window.DATA['🎚️'].baryByGroup) });
        window.setEpochFromEpochButton(window.TIMELINE[0]['📅']);
    };

    BENCH.arreter = function () {
        BENCH.suite = 'no';
        poster({ type: 'bench:fin', resume: BENCH.n + ' calculs', t0: BENCH.t0 });
    };

    /** Début d'un calcul (runComputeInParent) : pas remis à zéro ; en banc, la ligne « en cours » dans l'iframe. */
    BENCH.debutCalcul = function () {
        BENCH.pas = { init: null, last: null, path: [] };
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
        BENCH.etats[ligne.rowKey] = { DATA: structuredClone(D), result: result };
        BENCH.tPrecC = D['🧮']['🧮🌡️'] - 273.15;
        // Hors run (clic de l'utilisateur sur la frise, un tictime…) : la ligne et son état. Les courbes du modèle d'Histoire
        // ne sont retracées que par un run. Sur 📱, les calculs de l'utilisateur ont LEUR courbe (H.scenario) : l'arrivée
        // en 2000 (frise ou passage, ⏳ = 0) la fait repartir, chaque tranche de 25 ans la prolonge (Histoire retire les
        // points de même date ou plus tardifs : rejouer une tranche la remplace). Jamais mêlée à l'orange, autre histoire.
        if (BENCH.suite === 'no') {
            if (result !== null && window.CLICS.parTranche()) {
                const debut = H['⏳'] === 0;
                posterHistoire({ type: debut ? 'histoire:scenario' : 'histoire:prolonger', courbe: 'scenario',
                    point: debut ? window.HISTOIRE.pointModele('arrivée ' + H['🗿'], null, null, 'frise')
                                 : window.HISTOIRE.pointModele(H['🗿'] + ' ' + H['🔘🕰'], H['🔘🕰'], H['🔺⏳'], 'clic') });
            }
            return;
        }
        // Point de la courbe d'Histoire (calcul interrompu : pas de point, sa T° n'est pas un état convergé).
        if (result !== null) {
            const C = BENCH.clic;
            const point = C === null
                ? window.HISTOIRE.pointModele('frise ' + H['🗿'], null, null, 'frise')
                : window.HISTOIRE.pointModele(C.depuis !== H['🗿'] ? C.depuis + ' →' + C.cle + ' ' + H['🗿'] : C.depuis + ' ' + C.cle, C.cle, C.dt, 'clic');
            posterHistoire({ type: 'histoire:point', courbe: BENCH.courbe, point: point });
        }

        if (BENCH.suite === 'epoque') {
            const i = H['👉'] + 1;
            if (i >= window.TIMELINE.length) { BENCH.arreter(); return; }
            window.setEpochFromEpochButton(window.TIMELINE[i]['📅']);
            return;
        }
        // 'tictime' : jusqu'au ⛽ 2000 → 2025 de 📱, comme le banc autonome (epoch_bench_chain.js).
        if (H['🗿'] === '📱' && H['📿💫'] === 1) { BENCH.arreter(); return; }
        const cle = window.CLICS.prochaineAction();
        BENCH.clic = { depuis: H['🗿'], cle: cle, dt: window.CLICS.pas(cle) };
        window.jouerClic(cle);
    };

    /** Clic sur une ligne du tableau : l'interface (organigramme, frise, spectre) reprend l'état de fin de ce calcul,
     *  sans recalcul. DATA garde son identité : ses groupes sont remplacés par une copie de ceux de la ligne. */
    BENCH.voir = function (rowKey) {
        if (window.SYNC_STATE.calculationInProgress) throw new Error('[BENCH.voir] ' + rowKey + ' : un calcul tourne, l\'état ne peut pas être rechargé');
        const E = BENCH.etats[rowKey];
        const copie = structuredClone(E.DATA);
        for (const k of Object.keys(copie)) window.DATA[k] = copie[k];
        window.afficherCalcul(E.result);
    };

    // L'iframe Bench (mode encart) parle : lancer, passer le calcul en cours (⏭), arrêter, voir une ligne.
    window.addEventListener('message', function (e) {
        if (e.data.type === 'bench:lancer') BENCH.lancer(e.data.mode);
        if (e.data.type === 'bench:passer') window.ABORT_COMPUTE = true;
        if (e.data.type === 'bench:arreter') BENCH.arreter();
        if (e.data.type === 'bench:voir') BENCH.voir(e.data.rowKey);
    });

    window.BENCH = BENCH;
})();
