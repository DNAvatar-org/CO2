// File: CO2/static/ui/embarque.js
// Desc: La page embarquée par-dessus la Terre d'une autre (?hote=<nom>, ex. ?hote=tamagoshi : DNA Tamagoshi, sa Terre aux
//       créatures) : l'onglet ISS SANS sa page ISS — la Terre est celle de l'hôte, qui relaie ses messages iss:terre en
//       coordonnées de cette page (onglets_graphe.js poserTerreISS) et reçoit les cartes de l'époque (message co2:cartes, au
//       lieu de iss:cartes) pour les poser sur sa Terre. Restent la frise et l'organigramme, Energies et Atmosphère dépliés ;
//       ni onglets, ni fenêtres, ni pied de page, ni fond : transparente, la souris ne la prend que sur ses boutons
//       (index-shell.css, html.embarque). Prête (ISS ouverte au premier calcul, loader_panels.js), elle le dit à l'hôte
//       (co2:pret). ?miroir : l'organigramme en symétrie d'axe vertical, à DROITE de la Terre (configOrganigramme.js
//       TERRE_ECRAN.miroir, html.miroir). Chargé dans <head>, avant tout le reste : la config de l'organigramme le lit à sa
//       construction.
// Version 1.5.1
// - 1.5.1 (2026-10-28): ETAT_VERSION 2 — DATA porte le socle des calottes (🔺📏🗻🧊) : un état gardé sans lui est recalculé.
// Date: 2026-10-28
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const p = new URLSearchParams(location.search);
    /** L'état de l'organigramme gardé d'un chargement à l'autre (garderEtat) ; sa version : à monter si le moteur change */
    const ETAT_CLE = 'co2_embarque_etat', ETAT_VERSION = 2;
    /** EMBARQUE.hote : le nom de la page hôte, ou null (page seule) ; EMBARQUE.miroir : organigramme à droite de la Terre */
    window.EMBARQUE = {
        hote: p.get('hote'),
        miroir: p.has('miroir'),
        /** Émissions de l'hôte [kg CO₂] (?emis) : le scénario aujourd'hui → 2300 (scenario_hote.js) ; null : pas de scénario */
        emissions: p.has('emis') ? Number(p.get('emis')) : null,
        /** Energies (watts) et Atmosphère (détails) de l'organigramme, dépliés au départ (?energies=0, ?atmosphere=0 : repliés) */
        energies: p.get('energies') !== '0',
        atmosphere: p.get('atmosphere') !== '0',
        /** L'état gardé de l'organigramme pour ces émissions { kg, v, DATA } (garderEtat), ou null : à recalculer */
        etatGarde: null,
        /** Garde l'état de l'organigramme (DATA, fin du scénario) pour les émissions kg : le prochain chargement le remet */
        garderEtat: function (kg, DATA) {
            localStorage.setItem(ETAT_CLE, JSON.stringify({ kg: kg, v: ETAT_VERSION, DATA: DATA }));
        },
        /** La page est prête (onglet ISS ouvert, scénario fait s'il y en a un) : l'hôte peut la montrer */
        pret: function () { window.parent.postMessage({ type: 'co2:pret' }, '*'); }
    };
    // l'état gardé, s'il est celui de mes émissions (pas de voyage depuis) et de ce moteur
    if (window.EMBARQUE.emissions !== null) {
        const s = localStorage.getItem(ETAT_CLE), e = s === null ? null : JSON.parse(s);
        if (e !== null && e.kg === window.EMBARQUE.emissions && e.v === ETAT_VERSION) window.EMBARQUE.etatGarde = e;
    }
    document.documentElement.classList.toggle('embarque', window.EMBARQUE.hote !== null);
    document.documentElement.classList.toggle('miroir', window.EMBARQUE.miroir);

    /** co2:hote { haut [px], disposition: { id: { angle [° à l'écran, y vers le bas], rayonPct } } } : l'éventail CO₂ / H₂O / CH₄
     *  se règle par methane (son pied) puis co2 (son ouverture), dans cet ordre (configOrganigramme.js). Reçu après co2:pret :
     *  l'organigramme existe. */
    function appliquerHote(m) {
        const T = window.TERRE_ECRAN, N = window.configOrganigramme.nodes;
        document.documentElement.style.setProperty('--hote-haut', m.haut + 'px');
        Object.keys(m.disposition).forEach(function (id) {
            const n = N.find(function (x) { return x.id === id; }), d = m.disposition[id];
            n.theta = T.depuisEcran(d.angle * Math.PI / 180);
            n.rayonPct = d.rayonPct;
        });
        window.ONGLETS_GRAPHE.placer();
        window.ZOOM_TERRE.redessiner();
        window.dispatchEvent(new Event('resize'));   // la disposition validée : tout ce qui suit le cadre se remet en page
        // le redessin se fait à la trame suivante (zoom_terre.js changer) : posée une trame après, l'hôte peut la montrer
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { window.parent.postMessage({ type: 'co2:pose' }, '*'); });
        });
    }
    /** co2:affichage { energies, atmosphere } : Energies (watts) et Atmosphère (détails) dépliés ou repliés (main.js), puis
     *  l'organigramme remis en page */
    function affichage(m) {
        window.afficherWattsOrganigramme(m.energies);
        window.afficherDetailsOrganigramme(m.atmosphere);
        window.dispatchEvent(new Event('resize'));
    }
    // la Terre de l'hôte (iss:terre relayé) : son abscisse pour Energies / Atmosphère, posés dessous (--terre-cx, index-shell.css)
    window.addEventListener('message', function (e) {
        if (e.source === window.parent && e.data.type === 'co2:hote') appliquerHote(e.data);
        if (e.source === window.parent && e.data.type === 'co2:affichage') affichage(e.data);
        if (e.source === window.parent && e.data.type === 'co2:emissions') window.SCENARIO_HOTE.emettre(e.data.kg);
        if (e.source === window.parent && e.data.type === 'iss:terre') document.documentElement.style.setProperty('--terre-cx', e.data.cx + 'px');
    });
})();
