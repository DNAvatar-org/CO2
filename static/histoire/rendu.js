// File: CO2/static/histoire/rendu.js
// Desc: Dessin : grille, glaciations datées (bandes), littérature (série continue −5000 Ma → 2025 avec sa
//       bande d'incertitude, médiane en pointillés par-dessus), deux courbes du MODÈLE en segments de point à point —
//       graine t° continue (chaîne de clics, orange, pleine) et graine t° imposée (frise de chaque époque, violette,
//       tirets) —, insolation d'été à 65° N sur son axe à droite, logos d'époque en bandeau au début de leur époque.
//       H.survol() donne la source de ce qui est sous le curseur.
// Version 1.10.1
// Date: 2026-10-28
// logs :
//   - v1.10.1 (2026-10-28): insolation d'été à 65° N jusqu'à la base de l'Holocène seulement.
//   - v1.10.0 (2026-10-26): insolation d'été à 65° N (La2004, 2 derniers Ma, tirets or, échelle propre centrée sur la courbe
//     violette, axe à droite et bouton afficher / masquer) à la place de l'effet orbital direct en °C.
//   - v1.9.2 (2026-10-22): légende — histoire, clictimes, époques + graine, mesures de la session.
//   - v1.9.1 (2026-10-18): courbe verte = tous tes clics hors run (frise puis tictimes).
//   - v1.9.0 (2026-10-16): effet orbital direct sur la température moyenne du globe (°C, tirets or, astronomie.js) ;
//     légende sur plusieurs lignes si elle ne tient pas.
//   - v1.6.5 (2026-10-16): point vert = le dernier calcul de l'interface (H.dernier), dans la légende.
//   - v1.6.4 (2026-10-15): légende sur une ligne, centrée en X, en bas (au-dessus des dates de l'axe).
//   - v1.6.3 (2026-10-15): courbe verte = tes calculs sur 📱 (H.scenario), légende à quatre lignes.
//   - v1.6.2 (2026-10-15): survol d'un point du modèle = « T calculée », statut si non convergé ; noms des courbes = d'où vient la graine.
//   - v1.6.1: sources et série lues dans litterature.js (L.segments, L.serie), plus construites ici.
//   - v1.6.0: modèles en segments de biais d'un point au suivant (plus d'escalier).
//   - v1.5.1: légende réduite à trois lignes (littérature, graine t° continue, graine t° imposée).
//   - v1.5.0: les deux modèles (clics orange plein, frise violette en tirets) ; médiane de la littérature en pointillés,
//     tracée en dernier pour laisser voir les modèles derrière.
//   - v1.4.1: bande ± 1σ (PhanDA et Snyder interpolés par L.unSigma ; KT2018 recalculé à 16–84 %).
//   - v1.4.0: série précambrienne unique (L.precambrien).
//   - v1.3.2: repères ponctuels en boîtes retirés (illisibles) ; glaciations en fine bande sous les logos, plus pleine hauteur.
//   - v1.3.1: Cryogénien (L.cryogenien, fourchettes publiées des snowballs) à la place de KT2018 sur 717,5 → 632,2 Ma.
//   - v1.3.0: littérature continue jusqu'à −5000 Ma (ancres hadéennes + KT2018), raccords signalés au survol ;
//     modèle en ESCALIER (l'état d'un clic tient jusqu'au suivant), survol = clic joué, sa durée, et l'état de
//     l'intérieur (T potentielle, flux, puissance — API_BILAN/geology/interieur.js).
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HISTOIRE;
    const COUL = { lit: '#66fcf1', litBande: 'rgba(102, 252, 241, 0.15)', mod: '#ff9f43', frise: '#d980fa', scen: '#7bed9f', glace: 'rgba(160, 200, 255, 0.45)',
                   grille: 'rgba(69, 162, 158, 0.15)', texte: 'rgba(69, 162, 158, 0.6)', insol: '#f1c40f' };
    const px = t => (H.vue.xOffset - t) * H.vue.xScale;
    const py = T => H.vue.height / 2 - (T - H.vue.yOffset) * H.vue.yScale;
    let zones = [];   // zones survolables : { x0, x1, y0, y1, texte }
    const A = window.astronomie;   // insolation d'été à 65° N (table INSOL, courbe insolation65N)
    let cibles = [];  // logos cliquables : { x0, x1, y0, y1, id } — l'époque à lancer, comme la frise
    const LEGENDE = [[COUL.lit, '··· histoire'], [COUL.mod, '— clictimes'], [COUL.frise, '- - époques + graine'],
        [COUL.scen, '— mesures de la session'], [COUL.scen, '● dernier calcul'], [COUL.insol, '- - insolation d\'été 65° N (W/m², à droite)']];
    const LEG_ECART = 24;   // px entre deux entrées de la légende
    // Formats du survol de l'insolation, créés une fois : toLocaleString avec options en recrée un à chaque appel
    // (≈ 40 µs la paire, ≈ 20 ms par image pour les ≈ 500 zones d'une vue large ; ≈ 1 µs ainsi).
    const FMT_W = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const FMT_AN = new Intl.NumberFormat('fr-FR', { useGrouping: 'min2' });   // « an 1901 », « an −2 548 189 »

    // Insolation d'été à 65° N (A.insolation65N, solution La2004) sur les 2 derniers Ma seulement : la courbe cyan ne résout
    // les cycles glaciaires qu'avec Snyder 2016 (pas de 1 ka) ; avant, l'insolation n'a rien à quoi se comparer. Une passe aux
    // nœuds de 1 ka (≈ 2 000 évaluations) en fait la table : sa moyenne est posée sur la courbe violette, son étendue règle
    // l'échelle de l'axe de droite, et la courbe la lit par interpolation de Lagrange cubique. La passe se fait au PREMIER
    // tracé lisible (insolation65N), pas au chargement de l'iframe Histoire, qui se charge avec l'index. Elle s'arrête à la
    // base de l'Holocène (▶ de 🛖, configTimeline.js) : passé les cycles glaciaires, elle n'éclaire plus rien.
    const INSOL_DEBUT = H.litterature.AN - H.litterature.snyder[0][0];
    const INSOL_FIN = window.TIMELINE.find((e) => e['📅'] === window.CHARS.HOLOCENE)['▶'];
    const INSOL_PX_MIN = 40;   // [px] largeur du domaine sous laquelle il n'est qu'un trait : ni courbe, ni axe, ni bouton
    let INSOL = null;          // la table, construite au premier tracé lisible
    let boutonInsol = null;    // { x0, x1, y0, y1 } du bouton afficher / masquer au dernier rendu ; null quand il n'est pas dessiné
    H.insolVisible = true;
    function tableInsol() {
        const n = Math.ceil((INSOL_FIN - INSOL_DEBUT) / 1000), pas = (INSOL_FIN - INSOL_DEBUT) / n, W = [];
        for (let k = 0; k <= n; k++) W.push(A.insolation65N(INSOL_DEBUT + pas * k));
        return { debut: INSOL_DEBUT, fin: INSOL_FIN, pas, W, min: Math.min(...W), max: Math.max(...W),
            moyenne: W.reduce((a, w) => a + w, 0) / W.length };
    }

    /** Insolation d'été à 65° N (W/m²) en année calendaire de [INSOL.debut ; INSOL.fin] : polynôme de Lagrange sur les
     *  4 nœuds de la table qui entourent l'année (décalés aux deux bouts). */
    function insolationTable(an) {
        const u = (an - INSOL.debut) / INSOL.pas, k0 = Math.min(Math.max(Math.floor(u) - 1, 0), INSOL.W.length - 4);
        let w = 0;
        for (let i = 0; i < 4; i++) {
            let l = INSOL.W[k0 + i];
            for (let j = 0; j < 4; j++) if (j !== i) l *= (u - k0 - j) / (i - j);
            w += l;
        }
        return w;
    }

    function drawGrid(ctx) {
        const v = H.vue;
        const span = v.width / v.xScale, raw = span / 6;
        let xStep = Math.pow(10, Math.floor(Math.log10(raw)));
        if (raw / xStep > 5) xStep *= 5; else if (raw / xStep > 2) xStep *= 2;
        ctx.strokeStyle = COUL.grille; ctx.fillStyle = COUL.texte; ctx.font = '11px monospace'; ctx.textAlign = 'left';
        for (let t = Math.ceil((v.xOffset - span) / xStep) * xStep; t <= v.xOffset; t += xStep) {
            const x = px(t);
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, v.height); ctx.stroke();
            let label;
            if (t >= 1e9) label = '−' + (t / 1e9).toFixed(t % 1e9 === 0 ? 0 : 2) + ' Ga';
            else if (t >= 1e6) label = '−' + (t / 1e6).toFixed(t % 1e6 === 0 ? 0 : 1) + ' Ma';
            else if (t >= 10000) label = '−' + (t / 1000).toFixed(1) + ' ka';
            else label = String(Math.round(H.AN_PRESENT - t));
            ctx.fillText(label, x + 5, v.height - 20);
        }
        const tspan = v.height / v.yScale, rawY = tspan / 8;
        let yStep = Math.pow(10, Math.max(Math.floor(Math.log10(rawY)), 0));
        if (rawY / yStep > 5) yStep *= 5; else if (rawY / yStep > 2) yStep *= 2;
        for (let T = Math.ceil((v.yOffset - tspan / 2) / yStep) * yStep; T <= v.yOffset + tspan / 2; T += yStep) {
            const y = py(T);
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(v.width, y); ctx.stroke();
            ctx.fillText(T + '°C', 5, y - 5);
        }
        const y0 = py(0);
        if (y0 > 0 && y0 < v.height) {
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(v.width, y0); ctx.stroke(); ctx.setLineDash([]);
        }
    }

    /** Série [t, lo, mid, hi] : bande lo–hi. */
    function bande(ctx, rows, couleur) {
        ctx.beginPath();
        rows.forEach((r, i) => { const x = px(r[0]), y = py(r[3]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        for (let i = rows.length - 1; i >= 0; i--) ctx.lineTo(px(rows[i][0]), py(rows[i][1]));
        ctx.closePath(); ctx.fillStyle = couleur; ctx.fill();
    }

    /** Série [t, lo, mid, hi] : médiane en pointillés (les modèles restent visibles dessous). */
    function mediane(ctx, rows, couleur) {
        ctx.beginPath(); ctx.strokeStyle = couleur; ctx.lineWidth = 2; ctx.setLineDash([2, 4]); ctx.lineCap = 'round';
        rows.forEach((r, i) => { const x = px(r[0]), y = py(r[2]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
    }

    /**
     * Un modèle : un segment de biais d'un point calculé au suivant (deux points à la même date = saut vertical).
     * `tirets` : motif de ctx.setLineDash ([] = trait plein).
     */
    function courbe(ctx, M, couleur, tirets, nom) {
        const v = H.vue;
        const pts = M.points.slice().sort((a, b) => b.t - a.t);
        ctx.strokeStyle = couleur; ctx.lineWidth = 2; ctx.setLineDash(tirets); ctx.beginPath();
        pts.forEach((p, i) => { const x = px(p.t), y = py(p.T); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = couleur;
        for (const p of pts) {
            const x = px(p.t), y = py(p.T);
            if (x < -5 || x > v.width + 5) continue;
            ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fill();
            const pas = p.dt == null ? '' : ' (+' + (p.dt >= 1 ? p.dt.toFixed(p.dt % 1 ? 2 : 0) + ' Ma' : Math.round(p.dt * 1e6).toLocaleString('fr-FR') + ' ans') + ')';
            zones.push({ x0: x - 5, x1: x + 5, y0: y - 5, y1: y + 5,
                texte: nom + ' — ' + p.etape + pas + ' : T calculée ' + p.T.toFixed(1) + ' °C'
                    + (p.st === 'converged' ? '' : ' (⚠️ non convergé : ' + p.st + ', dernière valeur)') + ', glace ' + Math.round(p.glace * 100) + ' %, CO₂ ' + Math.round(p.ppm) + ' ppm'
                    + (p.Tint > 0 ? ' — intérieur ' + Math.round(p.Tint) + ' °C, ' + (p.geo >= 10 ? Math.round(p.geo).toLocaleString('fr-FR') : p.geo.toFixed(3)) + ' W/m² (' + p.TW.toLocaleString('fr-FR') + ' TW)' : '') });
        }
    }

    /** Valeur à t (années avant L.AN) d'une courbe du modèle, en segments de point à point comme courbe() ; sur un saut
     *  vertical (deux points à la même date), la valeur d'après. */
    function valeurModele(M, t) {
        const pts = M.points;   // ordre chronologique : t décroissant
        let i = 0;
        while (i + 2 < pts.length && pts[i + 1].t >= t) i++;
        const a = pts[i], b = pts[i + 1];
        if (!(a.t >= t && t >= b.t)) throw new Error('[rendu] t = ' + t + ' ans hors de la courbe ' + M.mode);
        return a.t === b.t ? b.T : a.T + (b.T - a.T) * (a.t - t) / (a.t - b.t);
    }

    /** Insolation d'été à 65° N (W/m² ; insolation journalière moyenne au solstice d'été boréal, Berger 1978) : l'obliquité
     *  et la précession ne changent pas l'énergie annuelle du globe, elles la répartissent, et c'est l'été des hautes
     *  latitudes qui fait fondre les calottes. Tirets or, un point tous les 2 px et au moins un par nœud de la table, sur SA
     *  PROPRE ÉCHELLE, que le zoom en °C ne touche pas : l'étendue de la table occupe la hauteur [haut ; bas] (px), sa moyenne
     *  est posée sur la courbe violette (sa moyenne sur la partie visible du domaine) ; axe à droite, et dessous le bouton qui
     *  affiche ou masque la courbe (H.insolVisible). */
    function insolation65N(ctx, haut, bas) {
        const v = H.vue, AN = H.litterature.AN;
        boutonInsol = null;
        if ((INSOL_FIN - INSOL_DEBUT) * v.xScale < INSOL_PX_MIN) return;   // vue large : les 2 Ma tiennent en un trait
        const debut = Math.max(AN - v.xOffset, INSOL_DEBUT), fin = Math.min(AN - (v.xOffset - v.width / v.xScale), INSOL_FIN);
        if (debut >= fin) return;
        if (INSOL === null) INSOL = tableInsol();
        let somme = 0;
        for (let k = 0; k <= 32; k++) somme += valeurModele(H.modeleFrise, AN - (debut + (fin - debut) * k / 32));
        const yc = py(somme / 33), k = (bas - haut) / (INSOL.max - INSOL.min);
        const y = (w) => yc - (w - INSOL.moyenne) * k;
        const xAxe = v.width - 10;
        // Bouton afficher / masquer, sous la graduation la plus basse (gardé au-dessus de la légende).
        const yb = Math.min(y(INSOL.min) + 10, bas);
        boutonInsol = { x0: xAxe - 52, x1: xAxe, y0: yb, y1: yb + 16 };
        ctx.strokeStyle = COUL.insol; ctx.fillStyle = COUL.insol; ctx.font = '11px monospace'; ctx.lineWidth = 1;
        ctx.strokeRect(boutonInsol.x0, boutonInsol.y0, boutonInsol.x1 - boutonInsol.x0, boutonInsol.y1 - boutonInsol.y0);
        ctx.textAlign = 'center';
        ctx.fillText('65° N ' + (H.insolVisible ? '◉' : '○'), (boutonInsol.x0 + boutonInsol.x1) / 2, yb + 12);
        ctx.textAlign = 'left';
        zones.push({ x0: boutonInsol.x0, x1: boutonInsol.x1, y0: boutonInsol.y0, y1: boutonInsol.y1,
            texte: (H.insolVisible ? 'Masquer' : 'Afficher') + ' l\'insolation d\'été à 65° N' });
        if (!H.insolVisible) return;
        // Un point tous les 2 px, et jamais moins d'un par nœud de la table (1 ka) : l'insolation suit la précession
        // (19–23 ka). Vue large, un point tous les 2 px en prendrait moins de deux par cycle et dessinerait un cycle qui
        // n'existe pas ; la table entière, elle, remplit l'enveloppe de la série.
        const n = Math.max(2, Math.ceil((px(AN - fin) - px(AN - debut)) / 2), Math.ceil((fin - debut) / INSOL.pas));
        ctx.strokeStyle = COUL.insol; ctx.lineWidth = 1.6; ctx.setLineDash([5, 3]); ctx.beginPath();
        let xZone = -Infinity;   // une zone de survol tous les 4 px au plus
        for (let i = 0; i <= n; i++) {
            const an = debut + (fin - debut) * i / n, w = insolationTable(an), x = px(AN - an), yw = y(w);
            if (i === 0) ctx.moveTo(x, yw); else ctx.lineTo(x, yw);
            if (x - xZone < 4) continue;
            xZone = x;
            zones.push({ x0: x - 6, x1: x + 6, y0: yw - 6, y1: yw + 6,
                texte: 'Insolation d\'été à 65° N : ' + FMT_W.format(w)
                    + ' W/m² — an ' + FMT_AN.format(Math.round(an)).replace('-', '−') + ' (' + A.SOLUTION_NOM + ')' });
        }
        ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
        // Axe de droite : graduations rondes, tous les 10 W/m² si elles restent à 24 px l'une de l'autre, sinon tous les 20.
        const pas = k * 10 >= 24 ? 10 : 20;
        ctx.strokeStyle = COUL.insol; ctx.fillStyle = COUL.insol; ctx.font = '11px monospace'; ctx.textAlign = 'right';
        ctx.beginPath(); ctx.moveTo(xAxe, y(INSOL.max)); ctx.lineTo(xAxe, y(INSOL.min));
        for (let w = Math.ceil(INSOL.min / pas) * pas; w <= INSOL.max; w += pas) {
            ctx.moveTo(xAxe - 5, y(w)); ctx.lineTo(xAxe, y(w));
            ctx.fillText(String(w), xAxe - 8, y(w) + 4);
        }
        ctx.stroke();
        ctx.fillText('W/m² 65° N', xAxe, y(INSOL.max) - 8);
        ctx.textAlign = 'left';
    }

    /** Le point (x, y) est-il sur le bouton qui affiche ou masque l'insolation ? (interaction.js : clic et curseur) */
    H.surBoutonInsolation = (x, y) => boutonInsol !== null && x >= boutonInsol.x0 && x <= boutonInsol.x1 && y >= boutonInsol.y0 && y <= boutonInsol.y1;

    /** Légende rangée en autant de lignes qu'il faut pour tenir dans la largeur : { lignes: [[indices de LEGENDE]], largeurs }. */
    function rangerLegende(ctx) {
        ctx.font = '12px Tahoma';
        const largeurs = LEGENDE.map((l) => ctx.measureText(l[1]).width), place = H.vue.width - 2 * LEG_ECART;
        const lignes = [[]];
        LEGENDE.forEach((l, i) => {
            const ligne = lignes[lignes.length - 1];
            const largeur = ligne.reduce((a, k) => a + largeurs[k] + LEG_ECART, 0) + largeurs[i];
            if (ligne.length > 0 && largeur > place) lignes.push([i]); else ligne.push(i);
        });
        return { lignes, largeurs };
    }

    /** Ligne de base de la ligne r de la légende, sur nb lignes : la dernière à v.height − 40, juste au-dessus des dates. */
    const yLegende = (r, nb) => H.vue.height - 40 - 16 * (nb - 1 - r);

    H.render = function (ctx) {
        const v = H.vue, L = H.litterature;
        zones = [];
        cibles = [];
        ctx.clearRect(0, 0, v.width, v.height);
        drawGrid(ctx);

        // Glaciations globales datées : une fine bande sous les noms d'époque du bandeau (y 110 / 124), dates seulement. Leur
        // température est portée par la courbe de la littérature (L.cryogenien) ; pleine hauteur, elle se lisait comme une
        // incertitude infinie.
        const hBande = 13, yBande = 130;
        for (const g of L.glaciations) {
            const x0 = px(g.t0), x1 = px(g.t1);
            if (x1 < 0 || x0 > v.width) continue;
            ctx.fillStyle = COUL.glace; ctx.fillRect(x0, yBande, Math.max(x1 - x0, 2), hBande);
            ctx.fillStyle = 'rgba(220,235,255,0.95)'; ctx.font = '10px Tahoma'; ctx.textAlign = 'left';
            ctx.fillText('❄ ' + g.label, x0 + 3, yBande + 10);
            zones.push({ x0, x1: Math.max(x1, x0 + 2), y0: yBande, y1: yBande + hBande, texte: '❄ ' + g.label + ' — ' + g.src });
        }

        // Littérature : la courbe cyan (litterature.js, L.segments → L.serie), celle-là même où le banc lit sa graine et sa
        // fourchette.
        const SEG = L.segments, lit = L.serie;
        bande(ctx, lit, COUL.litBande);
        const fmt = r => r[2].toFixed(1) + ' °C [' + r[1].toFixed(1) + ' ; ' + r[3].toFixed(1) + ']';
        SEG.forEach((g, s) => {
            const pas = Math.max(1, Math.floor(g.rows.length / 400));   // survol : pas besoin des 2000 points de Snyder
            g.rows.forEach((r, k) => {
                if (k % pas) return;
                const x = px(r[0]);
                if (x >= 0 && x <= v.width) zones.push({ x0: x - 4, x1: x + 4, y0: py(r[3]) - 4, y1: py(r[1]) + 4, texte: fmt(r) + ' — ' + g.src(r) });
            });
            // Raccord avec la source suivante, ou entre deux ancres hadéennes éloignées : trait droit, aucune donnée.
            const trous = [];
            for (let k = 1; k < g.rows.length; k++) if (g.rows[k - 1][4] !== g.rows[k][4]) trous.push([g.rows[k - 1], g.rows[k], g.src(g.rows[k - 1]), g.src(g.rows[k])]);
            const suiv = SEG[s + 1];
            if (suiv && g.rows.length && suiv.rows.length) {
                const a = g.rows[g.rows.length - 1], b = suiv.rows[0];
                trous.push([a, b, g.src(a), suiv.src(b)]);
            }
            for (const [a, b, sa, sb] of trous) {
                const x0 = px(a[0]), x1 = px(b[0]);
                if (x1 - x0 < 8 || x1 < 0 || x0 > v.width) continue;
                zones.push({ x0: x0 + 4, x1: x1 - 4, y0: py(Math.max(a[3], b[3])), y1: py(Math.min(a[1], b[1])),
                    texte: 'Raccord, aucune donnée entre ' + fmt(a) + ' (' + sa + ') et ' + fmt(b) + ' (' + sb + ') : trait droit' });
            }
        });
        // Insolation d'été à 65° N, derrière les modèles : sa hauteur utile va de sous la bande des glaciations (18 px pour
        // le titre de l'axe) au-dessus de la légende (12 px de texte, 8 px d'écart).
        const leg = rangerLegende(ctx);
        insolation65N(ctx, yBande + hBande + 18, yLegende(0, leg.lignes.length) - 20);
        // Modèles : chaîne de clics (courbe_modele.py, orange plein) puis frise à chaque époque (courbe_modele.py frise,
        // violette en tirets : l'orange se voit entre les tirets). La médiane de la littérature, en pointillés, passe
        // par-dessus les deux.
        courbe(ctx, H.modele, COUL.mod, [], 'Clictimes (graine = T du calcul précédent)');
        courbe(ctx, H.modeleFrise, COUL.frise, [8, 6], 'Époques + graine (graine = courbe cyan à ▶)');
        courbe(ctx, H.scenario, COUL.scen, [], 'Mesure de la session (graine : courbe cyan à la frise, puis T du calcul précédent)');
        mediane(ctx, lit, COUL.lit);
        // Le dernier calcul de l'interface (main.js, histoire:calcul) : gros point vert cerclé, par-dessus tout.
        if (H.dernier !== null) {
            const p = H.dernier, x = px(p.t), y = py(p.T);
            ctx.fillStyle = COUL.scen; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x, y, 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
            zones.push({ x0: x - 8, x1: x + 8, y0: y - 8, y1: y + 8,
                texte: 'Dernier calcul — ' + p.etape + ' : T calculée ' + p.T.toFixed(1) + ' °C'
                    + (p.st === 'converged' ? '' : ' (⚠️ non convergé : ' + p.st + ')') + ', glace ' + Math.round(p.glace * 100) + ' %, CO₂ ' + Math.round(p.ppm) + ' ppm' });
        }

        // Logos : bandeau en haut, au DÉBUT de leur époque (▶ du TIMELINE).
        ctx.textAlign = 'center';
        H.listeEpoques.forEach((e, i) => {
            const x = px(e.t);
            if (x < -20 || x > v.width + 20) return;
            ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([2, 4]);
            ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, v.height - 50); ctx.stroke(); ctx.setLineDash([]);
            ctx.font = '22px sans-serif'; ctx.fillText(e.logo, x, 95);
            if (e.clic !== null) cibles.push({ x0: x - 14, x1: x + 14, y0: 70, y1: 100, id: e.clic });
            ctx.font = '10px Tahoma'; ctx.fillStyle = '#c5c6c7';
            ctx.fillText(e.nom, x, i % 2 ? 124 : 110);   // noms alternés : les époques proches ne se chevauchent pas
        });

        // Légende (rangerLegende) : centrée en X, en bas (au-dessus des dates de l'axe, à v.height − 20), la dernière ligne
        // juste au-dessus des dates, les autres au-dessus d'elle.
        ctx.textAlign = 'left'; ctx.font = '12px Tahoma';
        leg.lignes.forEach((ligne, r) => {
            let xLeg = (v.width - ligne.reduce((a, k) => a + leg.largeurs[k], 0) - LEG_ECART * (ligne.length - 1)) / 2;
            const yLeg = yLegende(r, leg.lignes.length);
            ligne.forEach((k) => {
                ctx.fillStyle = LEGENDE[k][0]; ctx.fillText(LEGENDE[k][1], xLeg, yLeg);
                xLeg += leg.largeurs[k] + LEG_ECART;
            });
        });
    };

    /** Époque dont le logo est sous (x, y), ou null. */
    H.cible = function (x, y) {
        const c = cibles.find((z) => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1);
        return c === undefined ? null : c.id;
    };

    /** Texte de la zone sous (x, y), ou null. */
    H.survol = function (x, y) {
        for (let i = zones.length - 1; i >= 0; i--) {
            const z = zones[i];
            if (x >= z.x0 && x <= z.x1 && y >= Math.min(z.y0, z.y1) && y <= Math.max(z.y0, z.y1)) return z.texte;
        }
        return null;
    };
})();
