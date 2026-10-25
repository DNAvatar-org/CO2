// File: CO2/static/ui/scenario_hote.js
// Desc: Page embarquée avec les émissions de son hôte (?emis=<kg>, static/ui/embarque.js) : plus de balade dans les
//       époques (ni frise ni ÉVÉNEMENT / SKIP, index-shell.css). On est aujourd'hui — 📱, plus les émissions MESURÉES
//       2000–2025 (le ⛽ de sa tranche 2000) — puis jusqu'à la borne de la frise (TIMELINE_FUTUR ◀ = 2300, aujourd'hui
//       + ~300 ans) avec, pour seul CO₂ ajouté, celui de l'hôte (CLICS.emettre, puits compris) : pour DNA Tamagoshi, les
//       déplacements du joueur, qu'il calibre lui-même. Deux calculs : l'époque (sa graine de 2000), puis l'émission.
//       Prête au bout du premier scénario (EMBARQUE.pret) ; de nouvelles émissions (message co2:emissions) le rejouent,
//       à la fin du calcul en cours s'il y en a un. Chaque scénario fini, son résultat va à l'hôte (message co2:bilan :
//       ppm de CO₂ — le chiffre de l'organigramme, sync_panels.js projectToVisu —, °C de surface, année atteinte) :
//       l'hôte écrit le même chiffre que l'organigramme.
// Version 1.2.1
// - 1.2.1 : l'état gardé remis au premier calcul fait (demarrer), plus à sa place (loader_panels.js) : ce calcul, le ⚫
//   que main.js clique au démarrage, était déjà parti et tournait ensuite sur l'état remis (calottes de 2300 à −5 Ga)
// - 1.2.0 : l'état de fin gardé (EMBARQUE.garderEtat) ; restaurer — au chargement, mêmes émissions : DATA remis sans calcul,
//   l'organigramme redessiné, co2:bilan et co2:pret tout de suite
// - 1.1.0 : co2:bilan { ppm, tC, annee } à l'hôte, à la fin de chaque scénario
// Date: 2026-10-21
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

    /** Le résultat à l'hôte, comme l'organigramme l'écrit (sync_panels.js projectToVisu : fraction molaire × 1e6) */
    function bilan() {
        const D = window.DATA;
        window.parent.postMessage({ type: 'co2:bilan',
            ppm: window.ATM.co2KgToFraction(D['⚖️']['⚖️🏭'], D['⚖️']['⚖️🫧'], D['🫧']['🧪']) * 1e6,
            tC: D['🧮']['🧮🌡️'] - window.CONST.KELVIN_TO_CELSIUS,
            annee: window.CLICS.date() }, '*');
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
                window.EMBARQUE.garderEtat(kg, window.DATA);   // le prochain chargement, mêmes émissions : sans calcul
                bilan();
                if (premier) { premier = false; window.EMBARQUE.pret(); }
                if (rejouer) lancer();
                break;
        }
    }, 'scenario_hote');

    /** L'état gardé de mes émissions (EMBARQUE.etatGarde) remis dans DATA (ses groupes, comme BENCH.voir), l'époque relue
     *  de la frise, l'organigramme redessiné, puis l'interface comme à la fin d'un calcul (afficherCalcul). Seulement
     *  quand aucun calcul n'est en cours : un calcul qui tournerait après repartirait de son époque (api.js prepare) sur
     *  ces calottes, datées de la borne de la frise. */
    function restaurer() {
        const E = window.EMBARQUE.etatGarde, D = window.DATA;
        for (const k of Object.keys(E.DATA)) D[k] = E.DATA[k];
        D['📅'] = window.TIMELINE[D['📜']['👉']];
        window.syncEpochFromTimelinePointer();   // 🗿 et le nom de l'époque (RUNTIME_STATE.currentEpochName) depuis 👉
        window.ORG.recreateNoyauRadiation();
        window.ORG.recreateTerreRadiation();
        window.ORG.generateArrows();
        etape = 'fait';   // son compute:done (afficherCalcul) n'est pas un pas du scénario
        window.afficherCalcul(true);
    }

    return {
        /** Premier calcul de la page fait (le ⚫ du démarrage ; loader_panels.js, onglet ISS ouvert) : le scénario — ou,
         *  l'état gardé de ces émissions (pas de voyage depuis), remis sans scénario : le résultat à l'hôte et la page prête */
        demarrer: function () {
            if (window.EMBARQUE.etatGarde === null || window.EMBARQUE.etatGarde.kg !== kg) { lancer(); return; }
            restaurer();
            bilan();
            premier = false;
            window.EMBARQUE.pret();
        },
        /** Nouvelles émissions de l'hôte [kg CO₂] : rejouées tout de suite, ou à la fin du calcul en cours */
        emettre: function (k) {
            kg = k;
            if (etape === 'fait') lancer();
            else rejouer = etape !== 'attente';
        }
    };
})();
