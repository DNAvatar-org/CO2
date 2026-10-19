// File: CO2/static/ui/scenario_hote.js
// Desc: Page embarquée avec les émissions de son hôte (?emis=<kg>, static/ui/embarque.js) : plus de balade dans les
//       époques (ni frise ni ÉVÉNEMENT / SKIP, index-shell.css). On est aujourd'hui — 📱, plus les émissions MESURÉES
//       2000–2025 (le ⛽ de sa tranche 2000) — puis jusqu'à la borne de la frise (TIMELINE_FUTUR ◀ = 2300, aujourd'hui
//       + ~300 ans) avec, pour seul CO₂ ajouté, celui de l'hôte (CLICS.emettre, puits compris) : pour DNA Tamagoshi, les
//       déplacements du joueur, qu'il calibre lui-même. Deux calculs : l'époque (sa graine de 2000), puis l'émission.
//       Prête au bout du premier scénario (EMBARQUE.pret) ; de nouvelles émissions (message co2:emissions) le rejouent,
//       à la fin du calcul en cours s'il y en a un.
// Version 1.0.0
// Date: 2026-10-19
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.SCENARIO_HOTE = (function () {
    'use strict';

    /** attente (avant le premier calcul de la page) → epoque (calcul de 📱) → emission (calcul de l'émission) → fait */
    let etape = 'attente';
    let kg = window.EMBARQUE.emissions;   // [kg CO₂] de l'hôte, émis d'aujourd'hui à la borne de la frise
    let rejouer = false, premier = true;

    /** Clic sur la frise : 📱, sa graine (2000), sans rien hériter — puis le calcul */
    function lancer() {
        etape = 'epoque';
        rejouer = false;
        window.setEpochFromEpochButton('📱');
    }

    window.IO_LISTENER.on('compute:done', function () {
        switch (etape) {
            case 'epoque':
                // un clic d'événement : la T° présente est gardée (events.js jouerClic)
                window.DATA['🔘']['🔘🎞'] = true;
                window.CLICS.jouer('⛽');   // 2000 → 2025 : les émissions mesurées (GCB), aujourd'hui
                window.CLICS.emettre(kg, window.TIMELINE_FUTUR['◀'] - window.CLICS.date());
                etape = 'emission';
                window.IO_LISTENER.emit('config:applyThenCompute', { button: '⛽' });
                break;
            case 'emission':
                etape = 'fait';
                if (premier) { premier = false; window.EMBARQUE.pret(); }
                if (rejouer) lancer();
                break;
        }
    }, 'scenario_hote');

    return {
        /** Premier calcul de la page fait (loader_panels.js, onglet ISS ouvert) : le scénario */
        demarrer: lancer,
        /** Nouvelles émissions de l'hôte [kg CO₂] : rejouées tout de suite, ou à la fin du calcul en cours */
        emettre: function (k) {
            kg = k;
            if (etape === 'fait') lancer();
            else rejouer = etape !== 'attente';
        }
    };
})();
