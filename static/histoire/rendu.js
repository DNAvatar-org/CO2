// File: CO2/static/histoire/rendu.js
// Desc: Dessin : grille, glaciations datées (bandes), littérature (PhanDA 5–95 % + médiane, mesures
//       instrumentales, repères ponctuels en boîtes), courbe du MODÈLE (orange), logos d'époque en
//       bandeau au début de leur époque. H.survol() donne la source de ce qui est sous le curseur.
// Version 1.1.0
// Date: 2026-09-23
// logs :
//   - v1.1.0: littérature sourcée (litterature.js) au lieu de la courbe de Gemini ; courbe du modèle.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HISTOIRE;
    const COUL = { lit: '#66fcf1', litBande: 'rgba(102, 252, 241, 0.15)', mod: '#ff9f43', glace: 'rgba(160, 200, 255, 0.10)',
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

        // Littérature : PhanDA puis instrumental (même série, raccordée), bande 5–95 %.
        serie(ctx, L.phanda.concat(L.instrumental), COUL.lit, COUL.litBande);
        for (const r of L.phanda.concat(L.instrumental)) {
            const x = px(r[0]);
            if (x >= 0 && x <= v.width) zones.push({ x0: x - 4, x1: x + 4, y0: py(r[3]) - 4, y1: py(r[1]) + 4,
                texte: r[2].toFixed(1) + ' °C [' + r[1].toFixed(1) + ' ; ' + r[3].toFixed(1) + '] — ' +
                       (r[0] > 20000 ? 'PhanDA (Judd et al. 2024)' : 'mesures instrumentales (Copernicus, GISTEMP, Jones 1999)') });
        }
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

        // Modèle : chaîne de clics (courbe_modele.js), points reliés.
        const M = H.modele;
        if (M && M.points && M.points.length) {
            const pts = M.points.slice().sort((a, b) => b.t - a.t);
            ctx.strokeStyle = COUL.mod; ctx.lineWidth = 2; ctx.beginPath();
            pts.forEach((p, i) => { const x = px(p.t), y = py(p.T); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
            ctx.stroke();
            ctx.fillStyle = COUL.mod;
            for (const p of pts) {
                const x = px(p.t), y = py(p.T);
                if (x < -5 || x > v.width + 5) continue;
                ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fill();
                zones.push({ x0: x - 5, x1: x + 5, y0: y - 5, y1: y + 5,
                    texte: 'Modèle ' + p.ep + ' : ' + p.T.toFixed(1) + ' °C, glace ' + Math.round(p.glace * 100) + ' %, CO₂ ' + Math.round(p.ppm) + ' ppm' });
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
        ctx.fillText(M ? '— modèle (chaîne de clics, bary ' + M.bary + ' %, ' + M.genere + ')' : '— modèle : courbe_modele.js absent', v.width - 15, 42);
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
