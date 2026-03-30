// File: texture_epochs_preview.js - Aperçu canvas des textures procédurales par époque TIMELINE
// Desc: En français, dans l’architecture, je suis un outil de debug visuel séparé de plate_editor (draw ⚫, 🔥, etc.).
// Version 1.0.1
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [Mar 29, 2026] [20:00 UTC+1]
// Logs:
// - v1.0.0: preview séparée ⚫ (bary t), 🔥 (bary magma), 🦠 (mer archéenne placeholder)
// - v1.0.1: ⚫ via window.TEXTURES['⚫'] (texture.js) ; fBm preview = TextureNoise

(function () {
    'use strict';

    var W = 256;
    var H = 128;

    function lerp(a, b, t) {
        return a + t * (b - a);
    }

    function getTN() {
        if (!window.TextureNoise || typeof window.TextureNoise.fbm2 !== 'function') {
            throw new Error('texture_epochs_preview.js : inclure texture.js avant ce script.');
        }
        return window.TextureNoise;
    }

    /** Délègue à texture.js — TEXTURES['⚫'] */
    function rgbaBlackBody(width, height, primitiveIceT, perlinSeed) {
        if (!window.TEXTURES || typeof window.TEXTURES['⚫'] !== 'function') {
            throw new Error('texture_epochs_preview.js : TEXTURES[⚫] manquant (texture.js).');
        }
        return window.TEXTURES['⚫'](width, height, {
            primitiveIceT: primitiveIceT,
            perlinSeed: perlinSeed != null ? perlinSeed : 137
        });
    }

    /**
     * Hadéen 🔥 — preview locale (pas encore TEXTURES['🔥']).
     * bary T = 0 lave vive, T = 1 croûte plus sombre ; utilise TextureNoise.fbm2.
     */
    function rgbaHadeanMagma(width, height, baryT, seed) {
        var TN = getTN();
        var u = Math.max(0, Math.min(1, Number(baryT) || 0));
        var perm = TN.makePermutation512((seed || 241) >>> 0);
        var rgba = new Uint8ClampedArray(width * height * 4);
        var py, px, pi, lat, lon, n, n2, flow, hot, r, g, b;
        for (py = 0; py < height; py++) {
            lat = 90 - (py + 0.5) / height * 180;
            for (px = 0; px < width; px++) {
                lon = (px + 0.5) / width * 360 - 180;
                pi = (py * width + px) * 4;
                n = TN.fbm2(lon * 0.09 + 3.1, lat * 0.09 - 1.2, perm, 4);
                n2 = TN.fbm2(lon * 0.22 + 10, lat * 0.18, perm, 2);
                flow = 0.5 + 0.5 * Math.sin(lon * 0.04 + lat * 0.07 + n * 2.1);
                hot = Math.max(0, n * 0.5 + 0.5) * flow;
                var cool = u * 85;
                r = Math.round(lerp(255, 40, u) * hot + (1 - hot) * lerp(120, 25, u) - cool * 0.4);
                g = Math.round(lerp(90, 18, u) * hot + (1 - hot) * lerp(35, 12, u) - cool * 0.35);
                b = Math.round(lerp(25, 8, u) * hot + (1 - hot) * lerp(12, 6, u) + n2 * 15 * (1 - u));
                r = Math.max(0, Math.min(255, r));
                g = Math.max(0, Math.min(255, g));
                b = Math.max(0, Math.min(255, b));
                rgba[pi] = r;
                rgba[pi + 1] = g;
                rgba[pi + 2] = b;
                rgba[pi + 3] = 255;
            }
        }
        return rgba;
    }

    /** Archéen 🦠 — eau + bruit (placeholder) */
    function rgbaArcheanSea(width, height, seed) {
        var TN = getTN();
        var perm = TN.makePermutation512((seed || 311) >>> 0);
        var rgba = new Uint8ClampedArray(width * height * 4);
        var py, px, pi, lat, lon, d, n;
        for (py = 0; py < height; py++) {
            lat = 90 - (py + 0.5) / height * 180;
            for (px = 0; px < width; px++) {
                lon = (px + 0.5) / width * 360 - 180;
                pi = (py * width + px) * 4;
                n = TN.fbm2(lon * 0.14 + 1, lat * 0.14, perm, 3);
                d = 0.35 + n * 0.12;
                rgba[pi] = Math.round(8 + d * 35);
                rgba[pi + 1] = Math.round(45 + d * 70);
                rgba[pi + 2] = Math.round(95 + d * 85);
                rgba[pi + 3] = 255;
            }
        }
        return rgba;
    }

    function injectStyles() {
        if (document.getElementById('texture-epochs-preview-style')) return;
        var st = document.createElement('style');
        st.id = 'texture-epochs-preview-style';
        st.textContent = [
            '#texture-epochs-preview { padding: 16px 20px 40px; max-width: 1200px; margin: 0 auto; }',
            '#texture-epochs-preview h1 { font-size: 18px; font-weight: 600; color: #7fdbca; margin: 0 0 8px 0; }',
            '#texture-epochs-preview .tx-intro { font-size: 12px; color: #888; margin-bottom: 24px; line-height: 1.45; }',
            '#texture-epochs-preview .tx-block {',
            '  margin-bottom: 32px;',
            '  padding: 16px;',
            '  border: 1px solid #333;',
            '  border-radius: 8px;',
            '  background: #161616;',
            '}',
            '#texture-epochs-preview .tx-block h2 {',
            '  margin: 0 0 4px 0;',
            '  font-size: 16px;',
            '  color: #ddd;',
            '  letter-spacing: 0.02em;',
            '}',
            '#texture-epochs-preview .tx-block .tx-desc {',
            '  font-size: 11px; color: #777; margin: 0 0 14px 0; line-height: 1.4;',
            '}',
            '#texture-epochs-preview .tx-row {',
            '  display: flex;',
            '  flex-wrap: wrap;',
            '  gap: 14px;',
            '  align-items: flex-end;',
            '}',
            '#texture-epochs-preview .tx-cell {',
            '  text-align: center;',
            '}',
            '#texture-epochs-preview .tx-cell .tx-t {',
            '  font-size: 11px; color: #9cf; font-family: ui-monospace, monospace; margin-bottom: 6px;',
            '}',
            '#texture-epochs-preview .tx-cell canvas {',
            '  display: block;',
            '  image-rendering: pixelated;',
            '  border: 1px solid #444;',
            '  border-radius: 4px;',
            '}',
            '#texture-epochs-preview .tx-cell .tx-cap { font-size: 10px; color: #666; margin-top: 4px; max-width: ' + W + 'px; }'
        ].join('\n');
        document.head.appendChild(st);
    }

    function blit(canvas, rgba, w, h) {
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        var img = ctx.createImageData(w, h);
        img.data.set(rgba);
        ctx.putImageData(img, 0, 0);
    }

    function cell(tLabel, caption) {
        var wrap = document.createElement('div');
        wrap.className = 'tx-cell';
        var tl = document.createElement('div');
        tl.className = 'tx-t';
        tl.textContent = tLabel;
        wrap.appendChild(tl);
        var cv = document.createElement('canvas');
        wrap.appendChild(cv);
        if (caption) {
            var c = document.createElement('div');
            c.className = 'tx-cap';
            c.textContent = caption;
            wrap.appendChild(c);
        }
        return { wrap: wrap, canvas: cv };
    }

    function addBaryRow(container, title, emoji, desc, steps, drawFn) {
        var block = document.createElement('div');
        block.className = 'tx-block';
        var h2 = document.createElement('h2');
        h2.textContent = emoji + ' ' + title;
        block.appendChild(h2);
        var p = document.createElement('p');
        p.className = 'tx-desc';
        p.textContent = desc;
        block.appendChild(p);
        var row = document.createElement('div');
        row.className = 'tx-row';
        var i;
        for (i = 0; i < steps.length; i++) {
            var t = steps[i];
            var c = cell('t = ' + t, i === 0 ? 'borne gauche (bary 0)' : (i === steps.length - 1 ? 'borne droite (bary 1)' : ''));
            row.appendChild(c.wrap);
            blit(c.canvas, drawFn(t), W, H);
        }
        block.appendChild(row);
        container.appendChild(block);
    }

    function run(root) {
        getTN();
        injectStyles();
        var el = root || document.getElementById('texture-epochs-preview');
        if (!el) {
            el = document.createElement('div');
            el.id = 'texture-epochs-preview';
            document.body.appendChild(el);
        }
        el.innerHTML = '';
        var h1 = document.createElement('h1');
        h1.textContent = 'Textures TIMELINE — draw séparés (debug)';
        el.appendChild(h1);
        var intro = document.createElement('p');
        intro.className = 'tx-intro';
        intro.innerHTML =
            'Chaque bloc = une époque. Les colonnes sont l’évolution <strong>barycentrique</strong> t ∈ [0,1] entre les bornes du segment (comme la jauge TRANSITION de l’éditeur). ' +
            '⚫ = <code>window.TEXTURES[\'⚫\']</code> dans <code>texture.js</code> (même code que l’éditeur). 🔥 et 🦠 = previews locales (🔥 utilisera <code>TextureNoise.fbm2</code>).';
        el.appendChild(intro);

        var barySteps = [0, 0.25, 0.5, 0.75, 1];

        addBaryRow(
            el,
            'Corps noir — segment ⚫→🔥 (glace / contraste)',
            '⚫',
            'primitiveIceT = t sur toute la jauge (~500 Ma côté TIMELINE). t=0 : détails sombres discrets ; t=1 : blanchiment type glace déposée.',
            barySteps,
            function (t) {
                return rgbaBlackBody(W, H, t, 137);
            }
        );

        addBaryRow(
            el,
            'Hadéen — refroidissement magma (preview locale)',
            '🔥',
            'bary T = 0 : lave plus vive ; T = 1 : croûte plus sombre. À rapprocher plus tard du pipeline biome isHadean de plate_renderer.',
            barySteps,
            function (t) {
                return rgbaHadeanMagma(W, H, t, 241);
            }
        );

        var blockArc = document.createElement('div');
        blockArc.className = 'tx-block';
        blockArc.innerHTML = '<h2>🦠 Archéen — mer (placeholder)</h2><p class="tx-desc">Une tuile statique pour repère visuel ; pas de bary sur un seul état dans ce fichier.</p>';
        var rowA = document.createElement('div');
        rowA.className = 'tx-row';
        var c1 = cell('fixe', 'eau + fbm');
        blit(c1.canvas, rgbaArcheanSea(W, H, 311), W, H);
        rowA.appendChild(c1.wrap);
        blockArc.appendChild(rowA);
        el.appendChild(blockArc);
    }

    window.TextureEpochsPreview = {
        run: run,
        rgbaBlackBody: rgbaBlackBody,
        rgbaHadeanMagma: rgbaHadeanMagma,
        rgbaArcheanSea: rgbaArcheanSea,
        PREVIEW_W: W,
        PREVIEW_H: H
    };

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { run(document.getElementById('texture-epochs-preview')); });
        } else {
            run(document.getElementById('texture-epochs-preview'));
        }
    }
})();
