// File: CO2/static/ui/progression.js
// Desc: La progression calculée, gardée d'un chargement à l'autre (F5) : l'état au DÉPART du dernier calcul de
//       l'interface hors run — DATA entier (📜 y porte l'époque, l'horloge, le curseur des clics, et le clic déjà joué),
//       et les puits de carbone, hors DATA — puis la courbe verte d'Histoire, les messages histoire:calcul depuis le
//       dernier clic sur la frise (bench_pilote.js). Dans IndexedDB (etats_gardes.js) : DATA pèse ~235 Ko en JSON, loin des
//       4 Ko d'un cookie, et localStorage, partagé par tout le site, n'avait plus la place. Au chargement, le ⚫ que main.js clique est écarté avant son premier pas (ABORT_COMPUTE) ; à sa place, le
//       dernier calcul est refait depuis son état de départ : Science, le spectre, l'organigramme montrent ce calcul-là.
//       Le curseur de la frise suit 📜 (organigramme/timeline.js updateTimeline). Un clic sur la frise ⚫, l'état du
//       démarrage, efface la progression. Page seule : embarquée, l'hôte a son état gardé (embarque.js garderEtat), remis
//       par poser (scenario_hote.js).
// Version 1.4.0
// - 1.4.0 : gardée dans IndexedDB (ETATS_GARDES, etats_gardes.js), plus localStorage — plein (tout le site s'y partage
//           ~5 millions de caractères), setItem lançait QuotaExceededError.
// - 1.3.0 : au chargement, le ⚫ écarté et le dernier calcul refait depuis son état de départ (plus l'état d'arrivée remis).
// - 1.2.0 : les puits de carbone gardés avec DATA (réservoirs, stocks) : le calcul refait absorbe le même CO₂.
// Date: 2026-11-05
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.PROGRESSION = (function () {
    'use strict';
    const CLE = 'co2_progression';
    /** Les messages histoire:calcul depuis le dernier départ (clic sur la frise), dans l'ordre : Histoire en refait la
     *  courbe verte et son dernier point (static/histoire/main.js). null avant le premier calcul de la page. */
    let calculs = null;
    /** L'état au départ du calcul en cours { DATA, puits } : gardé à sa fin, c'est lui que le prochain chargement refait */
    let depart = null;
    /** La progression du chargement précédent, à refaire à la place du ⚫ écarté ; null : aucune, ou déjà refaite */
    let aRefaire = null;

    /** La progression gardée par le chargement précédent { v, depart, calculs }, ou null : aucune, ou gardée par un autre
     *  moteur (EMBARQUE.etatVersion, la version de l'état gardé) */
    function gardee() {
        const s = window.ETATS_GARDES.get(CLE), g = s === null ? null : JSON.parse(s);
        return g !== null && g.v === window.EMBARQUE.etatVersion ? g : null;
    }

    /** L'état des puits de carbone, hors DATA (leur découpage en réservoirs et stocks, que DATA ne porte qu'en totaux :
     *  ocean/sinks_ocean.js, land/sinks_land.js) : sans lui, le calcul refait n'absorberait pas le même CO₂ */
    function puits() {
        return { ocean: window.OCEAN_SINK.boxesKg(), terre: window.LAND_SINK.etat() };
    }

    /** L'époque remise, en tête et sur la frise, comme setEpoch la pose à un clic sur la frise (main.js, qui lance aussi un
     *  calcul) : son bouton sélectionné, son nom, sa date de début (▶, comptée avant le présent). La date atteinte et le
     *  temps écoulé suivent 📜 (organigramme/timeline.js updateTimeline). */
    function montrerEpoque() {
        const DATA = window.DATA, GEOLOGY = window.GEOLOGY;
        const id = DATA['📜']['🗿'], E = GEOLOGY.getGeologicalPeriodByName(id);
        document.querySelectorAll('.epoch-btn, .epoch-text').forEach(function (b) { b.classList.toggle('selected', b.dataset.epoch === id); });
        document.getElementById('epoch-name').textContent = E.name;
        document.getElementById('epoch-start-time').textContent = window.formatYears(E.startYears > 0 ? -E.startYears : E.startYears);
    }

    /** Un état gardé remis dans DATA : ses groupes (comme BENCH.voir ; l'époque DATA['📅'] suit 📜👉), le nom de l'époque
     *  relu de la frise et montré, la glace que lit l'éclairage de la Terre (la copie que fait le moteur,
     *  h2o/calculations_h2o.js), l'organigramme redessiné. Seulement quand aucun calcul n'est en cours : un calcul qui
     *  tournerait après repartirait de son époque (api.js prepare) sur cet état. */
    function poserEtat(E) {
        const DATA = window.DATA, ORG = window.ORG, RUNTIME_STATE = window.RUNTIME_STATE;
        for (const k of Object.keys(E)) DATA[k] = E[k];
        window.syncEpochFromTimelinePointer();   // 🗿 et le nom de l'époque (RUNTIME_STATE.currentEpochName) depuis 👉
        montrerEpoque();
        RUNTIME_STATE.h2oIceFractionFromCalculation = DATA['💧']['🍰💧🧊'];
        ORG.recreateNoyauRadiation();
        ORG.recreateTerreRadiation();
        ORG.generateArrows();
    }

    /** La progression gardée refaite à la place du ⚫ écarté : les puits et l'état au départ de son dernier calcul, la
     *  page Science sur son époque (sync:state sans calcul, comme setEpoch), la courbe verte jusqu'au point d'avant, puis
     *  ce calcul relancé ; sa fin (calcul) redonne le dernier point et garde de nouveau la progression. */
    function refaire(G) {
        const DATA = window.DATA, IO_LISTENER = window.IO_LISTENER;
        calculs = G.calculs.slice(0, -1);
        window.OCEAN_SINK.poserBoxesKg(G.depart.puits.ocean);
        window.LAND_SINK.poser(G.depart.puits.terre);
        poserEtat(G.depart.DATA);
        IO_LISTENER.emit('sync:state', { epochId: DATA['📜']['🗿'], animEnabled: DATA['🔘']['🔘🎞'], ticTime: DATA['📜']['📿💫'] });
        const histoire = document.getElementById('histoire-iframe').contentWindow;
        calculs.forEach(function (m) { histoire.postMessage(m, '*'); });
        window.ABORT_COMPUTE = false;
        window.runComputeInParent();
    }

    return {
        /** Un état gardé remis sans calcul, l'interface comme à la fin d'un calcul (afficherCalcul) : l'état de l'hôte
         *  (scenario_hote.js restaurer) */
        poser: function (E) {
            poserEtat(E);
            window.afficherCalcul(true);
        },
        /** Début d'un calcul (bench_pilote.js debutCalcul) : son état de départ, gardé à sa fin. Le premier de la page (le
         *  ⚫ que main.js clique) : avec une progression gardée, il est écarté — le moteur s'arrête avant son premier pas
         *  (ABORT_COMPUTE) — et interrompu() refait la progression à sa place. Rend true pour le calcul écarté. */
        debut: function () {
            if (window.EMBARQUE.hote !== null) return false;   // embarquée : l'hôte a son état gardé
            if (calculs === null) {
                calculs = [];
                aRefaire = gardee();
                if (aRefaire !== null) { window.ABORT_COMPUTE = true; return true; }
            }
            depart = { DATA: structuredClone(window.DATA), puits: puits() };
            return false;
        },
        /** Un calcul interrompu (bench_pilote.js apresCalcul) : le ⚫ écarté au chargement → la progression refaite, et
         *  true ; false pour un calcul abandonné au profit d'un plus récent (rien à refaire). */
        interrompu: function () {
            if (aRefaire === null) return false;
            const G = aRefaire;
            aRefaire = null;
            refaire(G);
            return true;
        },
        /** Un calcul de l'interface hors run, son message Histoire envoyé (bench_pilote.js apresCalcul) : la progression
         *  gardée — l'état à son départ et la courbe verte. La frise ⚫ est l'état du démarrage : rien à garder. */
        calcul: function (msg) {
            if (window.EMBARQUE.hote !== null) return;
            calculs = msg.depart ? [msg] : calculs.concat([msg]);
            if (msg.depart && msg.point.ep === window.TIMELINE[0]['📅']) { window.ETATS_GARDES.effacer(CLE); return; }
            window.ETATS_GARDES.put(CLE, JSON.stringify({ v: window.EMBARQUE.etatVersion, depart: depart, calculs: calculs }));
        }
    };
})();
