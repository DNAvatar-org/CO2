// File: CO2/static/mesures/controle_anomalies.js
// Desc: Terre en fond — « Températures mesurées », sous Temps de la page ISS : dépliée, la carte des anomalies HadCRUT5 de
//       l'année de la frise remplace celle de l'époque (onglets_graphe.js cartesEpoque, message iss:cartes) ; repliée, la carte
//       de l'époque revient. Visible seulement quand l'année de la frise a des mesures (1850–2025) : la date est celle de
//       l'application, on ne la choisit pas ici. Jauge verticale : opacité de la couche des mesures sur la Terre. Version
//       interpolée ou mesurée seule, légende des classes, part de la surface renseignée ; ⓘ ouvre la popup « comment se mesure
//       cette carte » (index.html).
// Version 1.0.0
// Date: [November 03, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HADCRUT5, C = window.CARTE_ANOMALIES;
    const boite = document.getElementById('anomalies-mesures');
    const tete = document.getElementById('anomalies-bascule');
    const annee = document.getElementById('anomalies-annee');
    const bilan = document.getElementById('anomalies-bilan');
    const popup = document.getElementById('anomalies-popup');
    const jauge = document.getElementById('anomalies-opacite');
    const jaugeValeur = document.getElementById('anomalies-opacite-valeur');

    /** Année de la frise, arrondie à la plus proche : celle des mesures montrées. */
    const anneeMesures = () => Math.round(window.ONGLETS_GRAPHE.anneeFrise());
    const dansMesures = () => anneeMesures() >= H.an0 && anneeMesures() <= H.an1;
    const version = () => document.querySelector('input[name="anomalies-version"]:checked').value;
    const opacite = () => Number(jauge.value) / 100;   // la jauge est en %

    // Lu par onglets_graphe.js (cartesEpoque, notIRISS) : sur la Terre si dépliée et si l'année de la frise a des mesures ;
    // la texture (data: URI) de cette année, calculée à l'envoi.
    window.ANOMALIES_MESUREES = {
        allumee: false,
        montree: () => window.ANOMALIES_MESUREES.allumee && dansMesures(),
        url: () => C.texture(C.champ(version(), anneeMesures()), opacite())
    };
    const A = window.ANOMALIES_MESUREES;

    // Textes de la popup tirés des données : version, période de référence, mois minimum d'une année.
    const TEXTES = { version: H.version, reference: H.reference.join('–'), moisMin: String(H.moisMin) };
    document.querySelectorAll('[data-hadcrut]').forEach((e) => { e.textContent = TEXTES[e.dataset.hadcrut]; });
    /** Nombre à la française, signé : +1,19 / −0,42. */
    const signe = (x, decimales) => (x < 0 ? '−' : '+') + Math.abs(x).toFixed(decimales).replace('.', ',');

    // Légende : une case par classe, les bornes aux jointures, la case grise « sans donnée » ; la période de référence lue
    // dans les données.
    const n = C.COULEURS.length;
    document.getElementById('anomalies-legende').innerHTML =
        '<div class="anomalies-classes">' + C.COULEURS.map((c) => '<span style="background:' + c + '"></span>').join('') + '</div>'
        + '<div class="anomalies-bornes">' + C.BORNES.map((b, i) => '<span style="left:' + (100 * (i + 1) / n) + '%">'
            + String(b).replace('.', ',').replace('-', '−') + '</span>').join('') + '</div>'
        + '<div class="anomalies-unite"><span class="anomalies-vide"></span> sans donnée · °C, écart à ' + H.reference.join('–') + '</div>';

    /** L'année montrée et ce que sa carte couvre. */
    function ecrireBilan() {
        const c = C.champ(version(), anneeMesures());
        annee.textContent = String(anneeMesures());
        bilan.textContent = 'Surface renseignée ' + Math.round(100 * c.couverture) + ' % · moyenne de ces cases '
            + signe(c.moyenne, 2) + ' °C';
    }
    /** Visible ou non selon l'année de la frise ; sur la Terre, son bilan. */
    function majBoite() {
        boite.classList.toggle('dans-mesures', dansMesures());
        if (A.montree()) ecrireBilan();
    }

    tete.addEventListener('click', () => {
        A.allumee = !A.allumee;
        tete.classList.toggle('deplie', A.allumee);
        boite.classList.toggle('allumee', A.allumee);
        popup.hidden = true;
        majBoite();
        window.ONGLETS_GRAPHE.chargerISS();   // dépliée : la carte des mesures ; repliée : celle de l'époque
    });
    document.querySelectorAll('input[name="anomalies-version"]').forEach((r) => r.addEventListener('change', () => {
        majBoite();
        window.ONGLETS_GRAPHE.chargerISS();
    }));
    jaugeValeur.textContent = jauge.value + ' %';
    jauge.addEventListener('input', () => {
        jaugeValeur.textContent = jauge.value + ' %';
        window.ONGLETS_GRAPHE.chargerISS();
    });
    // Chaque calcul (clic sur la frise) : l'année a pu changer ; la carte suit par chargerISS (onglets_graphe.js).
    window.IO_LISTENER.on('compute:done', majBoite, 'controle_anomalies');
    // Sous Temps, au pas de la pile Energies / Atmosphère / Temps (gap de .titre-affichages, index-shell.css) : son rectangle en
    // px de la page ISS (iss:fenetres, rects[0]), ramené à cette page ; il bouge quand Temps se déplie ou que la pile glisse.
    window.addEventListener('message', (e) => {
        if (e.data.type !== 'iss:fenetres') return;
        const i = document.getElementById('iss-iframe').getBoundingClientRect(), t = e.data.rects[0];
        boite.style.left = (i.left + t.x) + 'px';
        boite.style.top = (i.top + t.y + t.h + parseFloat(getComputedStyle(document.getElementById('titre-affichages')).rowGap)) + 'px';
    });
    document.getElementById('anomalies-info').addEventListener('click', () => { popup.hidden = !popup.hidden; });
    document.getElementById('anomalies-popup-fermer').addEventListener('click', () => { popup.hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') popup.hidden = true; });
})();
