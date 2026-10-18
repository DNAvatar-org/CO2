// File: CO2/static/histoire/rendu.js
// Desc: Dessin : grille, glaciations datées (bandes), littérature (série continue −5000 Ma → 2025 avec sa
//       bande d'incertitude, médiane en pointillés par-dessus), deux courbes du MODÈLE en segments de point à point —
//       graine t° continue (chaîne de clics, orange, pleine) et graine t° imposée (frise de chaque époque, violette,
//       tirets) —, logos d'époque en bandeau au début de leur époque. H.survol() donne la source de ce qui est sous le curseur.
// Version 1.9.0
// Date: 2026-10-16
// logs :
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
                   grille: 'rgba(69, 162, 158, 0.15)', texte: 'rgba(69, 162, 158, 0.6)' };
    const px = t => (H.vue.xOffset - t) * H.vue.xScale;
    const py = T => H.vue.height / 2 - (T - H.vue.yOffset) * H.vue.yScale;
    let zones = [];   // zones survolables : { x0, x1, y0, y1, texte }
    const A = window.astronomie;   // effet orbital direct (effetOrbital)
    let cibles = [];  // logos cliquables : { x0, x1, y0, y1, id } — l'époque à lancer, comme la frise

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

    /** Effet orbital direct sur la température moyenne du globe (astronomie.js effetOrbitalGlobalK : excentricité, Planck
     *  sans rétroaction), sur l'axe des °C, autour de la médiane de la littérature en 1950 (année de référence de l'écart),
     *  tirets or ; un point tous les 2 px (80 termes : pas besoin de série). */
    function effetOrbital(ctx) {
        const v = H.vue, L = H.litterature, AN = L.AN;
        const debut = Math.max(AN - v.xOffset, A.AN_REFERENCE - A.VALIDITE_ANS);
        const fin = Math.min(AN - (v.xOffset - v.width / v.xScale), A.AN_REFERENCE + A.VALIDITE_ANS, AN);   // pas après la littérature
        if (debut >= fin) return;
        const T1950 = L.a(AN - A.AN_REFERENCE)[2];
        const n = Math.max(2, Math.ceil((px(AN - fin) - px(AN - debut)) / 2));
        ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 3]); ctx.beginPath();
        for (let k = 0; k <= n; k++) {
            const an = debut + (fin - debut) * k / n, dT = A.effetOrbitalGlobalK(an), x = px(AN - an), y = py(T1950 + dT);
            if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            if (k % 6 === 0) zones.push({ x0: x - 6, x1: x + 6, y0: y - 6, y1: y + 6,
                texte: 'Effet orbital direct : ' + (dT >= 0 ? '+' : '') + dT.toFixed(3) + ' °C par rapport à 1950 (excentricité seule, Planck sans rétroaction ; '
                    + A.SOLUTION_NOM + ') — an ' + Math.round(an).toLocaleString('fr-FR') });
        }
        ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
    }

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
        // Modèles : chaîne de clics (courbe_modele.py, orange plein) puis frise à chaque époque (courbe_modele.py frise,
        // violette en tirets : l'orange se voit entre les tirets). La médiane de la littérature, en pointillés, passe
        // par-dessus les deux.
        effetOrbital(ctx);
        courbe(ctx, H.modele, COUL.mod, [], 'Chaîne de clics (graine = T du calcul précédent)');
        courbe(ctx, H.modeleFrise, COUL.frise, [8, 6], 'Frise (graine = courbe cyan à ▶)');
        courbe(ctx, H.scenario, COUL.scen, [], 'Tes clics sur 📱 (graine = T du calcul précédent)');
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

        // Légende : centrée en X, en bas (au-dessus des dates de l'axe, à v.height − 20) ; en autant de lignes qu'il faut
        // pour tenir dans la largeur, la dernière juste au-dessus des dates, les autres au-dessus d'elle.
        ctx.textAlign = 'left'; ctx.font = '12px Tahoma';
        const legende = [[COUL.lit, '··· littérature'], [COUL.mod, '— graine t° continue'],
            [COUL.frise, '- - graine t° imposée'], [COUL.scen, '— tes clics sur 📱'], [COUL.scen, '● dernier calcul'], ['#f1c40f', '- - effet orbital direct (°C)']];
        const ecart = 24, largeurs = legende.map((l) => ctx.measureText(l[1]).width), place = v.width - 2 * ecart;
        const lignes = [[]];
        legende.forEach((l, i) => {
            const ligne = lignes[lignes.length - 1];
            const largeur = ligne.reduce((a, k) => a + largeurs[k] + ecart, 0) + largeurs[i];
            if (ligne.length > 0 && largeur > place) lignes.push([i]); else ligne.push(i);
        });
        lignes.forEach((ligne, r) => {
            let xLeg = (v.width - ligne.reduce((a, k) => a + largeurs[k], 0) - ecart * (ligne.length - 1)) / 2;
            const yLeg = v.height - 40 - 16 * (lignes.length - 1 - r);
            ligne.forEach((k) => {
                ctx.fillStyle = legende[k][0]; ctx.fillText(legende[k][1], xLeg, yLeg);
                xLeg += largeurs[k] + ecart;
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
