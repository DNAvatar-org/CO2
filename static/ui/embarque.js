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
// Version 1.3.0
// - 1.3.0: co2:pose — la disposition de l'hôte appliquée ET redessinée (le redessin passe à la trame suivante, zoom_terre.js
//   changer), la page le dit à l'hôte : il ne la montre qu'alors (flèches et rayonnements déjà autour de SA Terre).
// - 1.2.0: ?emis=<kg> — les émissions de l'hôte (EMBARQUE.emissions) : static/ui/scenario_hote.js, plus de frise ; message
//   co2:emissions pour les mettre à jour.
// - 1.1.0: message co2:hote de l'hôte { haut, disposition } — la hauteur à laisser libre en haut à gauche (sous son titre :
//   la frise et le nom d'époque y descendent, --hote-haut) et la place des boutons autour de SA Terre (angle à l'écran en
//   degrés, y vers le bas, et rayonPct : configOrganigramme.js) ; l'hôte l'envoie une fois la page prête, puis à chaque mise en page.
//   Energies / Atmosphère en bas, sous la Terre de l'hôte (--terre-cx, de son iss:terre).
// Date: 2026-10-20
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const p = new URLSearchParams(location.search);
    /** EMBARQUE.hote : le nom de la page hôte, ou null (page seule) ; EMBARQUE.miroir : organigramme à droite de la Terre */
    window.EMBARQUE = {
        hote: p.get('hote'),
        miroir: p.has('miroir'),
        /** Émissions de l'hôte [kg CO₂] (?emis) : le scénario aujourd'hui → 2300 (scenario_hote.js) ; null : pas de scénario */
        emissions: p.has('emis') ? Number(p.get('emis')) : null,
        /** La page est prête (onglet ISS ouvert, scénario fait s'il y en a un) : l'hôte peut la montrer */
        pret: function () { window.parent.postMessage({ type: 'co2:pret' }, '*'); }
    };
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
        // le redessin se fait à la trame suivante (zoom_terre.js changer) : posée une trame après, l'hôte peut la montrer
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { window.parent.postMessage({ type: 'co2:pose' }, '*'); });
        });
    }
    // la Terre de l'hôte (iss:terre relayé) : son abscisse pour Energies / Atmosphère, posés dessous (--terre-cx, index-shell.css)
    window.addEventListener('message', function (e) {
        if (e.source === window.parent && e.data.type === 'co2:hote') appliquerHote(e.data);
        if (e.source === window.parent && e.data.type === 'co2:emissions') window.SCENARIO_HOTE.emettre(e.data.kg);
        if (e.source === window.parent && e.data.type === 'iss:terre') document.documentElement.style.setProperty('--terre-cx', e.data.cx + 'px');
    });
})();
