// File: CO2/static/histoire/rendu.js
// Desc: Dessin : grille, glaciations datées (bandes), littérature (série continue −5000 Ma → 2025 avec sa
//       bande d'incertitude, repères ponctuels en boîtes), courbe du MODÈLE (orange, en escalier), logos d'époque en
//       bandeau au début de leur époque. H.survol() donne la source de ce qui est sous le curseur.
// Version 1.3.0
// Date: 2026-09-24
// logs :
//   - v1.3.0: littérature continue jusqu'à −5000 Ma (ancres hadéennes + KT2018), raccords signalés au survol ;
//     modèle en ESCALIER (l'état d'un clic tient jusqu'au suivant), survol = clic joué, sa durée, et l'état de
//     l'intérieur (T potentielle, flux, puissance — API_BILAN/geology/interieur.js).
//   - v1.2.0: Quaternaire de Snyder 2016 (cycles glaciaires mesurés) raccordé à PhanDA et à l'instrumental.
//   - v1.1.0: littérature sourcée (litterature.js) au lieu de la courbe de Gemini ; courbe du modèle.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HISTOIRE;
    const COUL = { lit: '#66fcf1', litBande: 'rgba(102, 252, 241, 0.15)', mod: '#ff9f43', glace: 'rgba(160, 200, 255, 0.22)',
                   rep: 'rgba(102, 252, 241, 0.35)', grille: 'rgba(69, 162, 158, 0.15)', texte: 'rgba(69, 162, 158, 0.6)' };
    const px = t => (H.vue.xOffset - t) * H.vue.xScale;
    const py = T => H.vue.height / 2 - (T - H.vue.yOffset) * H.vue.yScale;
    let zones = [];   // zones survolables : { x0, x1, y0, y1, texte }

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

    /** Série [t, lo, mid, hi] : bande lo–hi + médiane. */
    function serie(ctx, rows, couleur, bande) {
        if (rows.length < 2) return;
        ctx.beginPath();
        rows.forEach((r, i) => { const x = px(r[0]), y = py(r[3]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        for (let i = rows.length - 1; i >= 0; i--) ctx.lineTo(px(rows[i][0]), py(rows[i][1]));
        ctx.closePath(); ctx.fillStyle = bande; ctx.fill();
        ctx.beginPath(); ctx.strokeStyle = couleur; ctx.lineWidth = 2;
        rows.forEach((r, i) => { const x = px(r[0]), y = py(r[2]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
    }

    H.render = function (ctx) {
        const v = H.vue, L = H.litterature;
        zones = [];
        ctx.clearRect(0, 0, v.width, v.height);
        drawGrid(ctx);

        // Glaciations globales datées : bandes verticales, sans température.
        for (const g of L.glaciations) {
            const x0 = px(g.t0), x1 = px(g.t1);
            if (x1 < 0 || x0 > v.width) continue;
            ctx.fillStyle = COUL.glace; ctx.fillRect(x0, 0, Math.max(x1 - x0, 2), v.height);
            ctx.fillStyle = 'rgba(160,200,255,0.7)'; ctx.font = '11px Tahoma'; ctx.textAlign = 'left';
            ctx.fillText('❄ ' + g.label, x0 + 4, v.height - 40);
            zones.push({ x0, x1: Math.max(x1, x0 + 2), y0: 0, y1: v.height, texte: '❄ ' + g.label + ' — ' + g.src });
        }

        // Littérature : une seule série continue de −5000 Ma à 2025, bande d'incertitude comprise.
        // Hadéen (ancres sourcées) → KT2018 (Précambrien) → PhanDA → Snyder 2016 (Quaternaire, 1 ka) → instrumental.
        const tSnyder = L.snyder[0][0];
        const SEG = [
            { rows: L.hadeen, src: r => r[4] },
            { rows: L.kt2018, src: () => 'Krissansen-Totton, Arney & Catling 2018, PNAS 115:4105 (2,5–97,5 %) — modèle du cycle du carbone contraint par proxys' },
            { rows: L.phanda.filter(r => r[0] > tSnyder), src: () => 'PhanDA (Judd et al. 2024)' },
            { rows: L.snyder, src: () => 'Snyder 2016, Nature 538:226 (2,5–97,5 %)' },
            { rows: L.instrumental, src: () => 'mesures instrumentales (Copernicus, GISTEMP, Jones 1999)' }
        ];
        const lit = [].concat(...SEG.map(g => g.rows));
        serie(ctx, lit, COUL.lit, COUL.litBande);
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
        // Repères ponctuels : boîte [t0 ; t1] × [lo ; hi].
        for (const r of L.reperes) {
            const x0 = px(r.t0), x1 = Math.max(px(r.t1), x0 + 3), y0 = py(r.hi), y1 = py(r.lo);
            if (x1 < 0 || x0 > v.width) continue;
            ctx.fillStyle = COUL.rep; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            ctx.strokeStyle = COUL.lit; ctx.lineWidth = 1; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
            ctx.fillStyle = COUL.lit; ctx.font = '11px Tahoma'; ctx.textAlign = 'left';
            ctx.fillText(r.label, x1 + 4, Math.max(12, y0 + 10));
            zones.push({ x0, x1, y0, y1, texte: r.label + ' [' + r.lo + ' ; ' + r.hi + ' °C] — ' + r.src });
        }

        // Modèle : chaîne de clics (courbe_modele.js) en ESCALIER. Un clic calcule l'état à sa date, et cet
        // état tient jusqu'au clic suivant : palier horizontal, puis saut vertical au clic. Rien n'est
        // interpolé entre deux clics — une pente dirait que le modèle a calculé ce qu'il n'a pas calculé.
        const M = H.modeleFrise;   // courbe_modele.py frise : graine à chaque époque, puis ses clics
        if (M && M.points && M.points.length) {
            const pts = M.points.slice().sort((a, b) => b.t - a.t);
            ctx.strokeStyle = COUL.mod; ctx.lineWidth = 2; ctx.beginPath();
            pts.forEach((p, i) => {
                const x = px(p.t), y = py(p.T);
                if (!i) { ctx.moveTo(x, y); return; }
                ctx.lineTo(x, py(pts[i - 1].T));   // palier du clic précédent jusqu'à ce clic
                ctx.lineTo(x, y);                  // saut du clic
            });
            ctx.lineTo(px(H.T_MIN_AGO), py(pts[pts.length - 1].T));   // dernier état jusqu'à 2025
            ctx.stroke();
            ctx.fillStyle = COUL.mod;
            for (const p of pts) {
                const x = px(p.t), y = py(p.T);
                if (x < -5 || x > v.width + 5) continue;
                ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fill();
                const pas = p.dt == null ? '' : ' (+' + (p.dt >= 1 ? p.dt.toFixed(p.dt % 1 ? 2 : 0) + ' Ma' : Math.round(p.dt * 1e6).toLocaleString('fr-FR') + ' ans') + ')';
                zones.push({ x0: x - 5, x1: x + 5, y0: y - 5, y1: y + 5,
                    texte: 'Modèle — ' + p.etape + pas + ' : ' + p.T.toFixed(1) + ' °C, glace ' + Math.round(p.glace * 100) + ' %, CO₂ ' + Math.round(p.ppm) + ' ppm'
                        + (p.Tint > 0 ? ' — intérieur ' + Math.round(p.Tint) + ' °C, ' + (p.geo >= 10 ? Math.round(p.geo).toLocaleString('fr-FR') : p.geo.toFixed(3)) + ' W/m² (' + p.TW.toLocaleString('fr-FR') + ' TW)' : '') });
            }
        }

        // Logos : bandeau en haut, au DÉBUT de leur époque (▶ du TIMELINE).
        ctx.textAlign = 'center';
        H.listeEpoques.forEach((e, i) => {
            const x = px(e.t);
            if (x < -20 || x > v.width + 20) return;
            ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([2, 4]);
            ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, v.height - 50); ctx.stroke(); ctx.setLineDash([]);
            ctx.font = '22px sans-serif'; ctx.fillText(e.logo, x, 95);
            ctx.font = '10px Tahoma'; ctx.fillStyle = '#c5c6c7';
            ctx.fillText(e.nom, x, i % 2 ? 124 : 110);   // noms alternés : les époques proches ne se chevauchent pas
        });

        // Légende
        ctx.textAlign = 'right'; ctx.font = '12px Tahoma';
        ctx.fillStyle = COUL.lit; ctx.fillText('— littérature (médiane, bande 5–95 %)', v.width - 15, 25);
        ctx.fillStyle = COUL.mod;
        ctx.fillText(M ? '— modèle (frise à chaque époque puis clics, escalier, bary ' + M.bary + ' %, ' + M.genere + ')' : '— modèle : courbe_modele_frise.js absent (python3 CO2/scripts/bench_headless/courbe_modele.py frise)', v.width - 15, 42);
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
