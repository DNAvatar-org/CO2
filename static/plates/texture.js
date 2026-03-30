// File: texture.js - Noyau Perlin / fBm + registre TEXTURES par symbole TIMELINE
// Desc: En français, dans l’architecture, je centralise le bruit et les générateurs RGBA nommés (⚫, …) pour repérage clair des shaders.
// Version 1.1.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See LICENSE_HEADER.txt for full terms.
// Date: [Mar 29, 2026] [22:15 UTC+1]
// Logs:
// - v1.0.0: TextureNoise (perlin/fBm) + TEXTURES['⚫'] ; doc 🌍/🔥 dans plate_renderer
// - v1.1.0: TextureBiomes (4 bandes terre : RVB défaut + fBm fin) ; TEXTURES 🌴🏜️🌾🌲 pour repère édition

(function () {
    'use strict';

    function _fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    function _lerp(a, b, t) {
        return a + t * (b - a);
    }
    function _grad2(h, x, y) {
        h &= 3;
        return (h & 1 ? -x : x) + (h & 2 ? -2 * y : 2 * y);
    }

    function makePermutation512(seed) {
        var p = new Uint8Array(256);
        var i;
        for (i = 0; i < 256; i++) p[i] = i;
        var s = (seed >>> 0) || 1;
        for (i = 255; i > 0; i--) {
            s = (s * 1664525 + 1013904223) >>> 0;
            var j = s % (i + 1);
            var t = p[i];
            p[i] = p[j];
            p[j] = t;
        }
        var out = new Uint8Array(512);
        for (i = 0; i < 256; i++) {
            out[i] = out[i + 256] = p[i];
        }
        return out;
    }

    function perlin2(x, y, perm) {
        var xi = Math.floor(x) & 255;
        var yi = Math.floor(y) & 255;
        var xf = x - Math.floor(x);
        var yf = y - Math.floor(y);
        var u = _fade(xf);
        var v = _fade(yf);
        var aa = perm[xi] + yi;
        var ab = aa + 1;
        var ba = perm[xi + 1] + yi;
        var bb = ba + 1;
        return _lerp(
            _lerp(_grad2(perm[aa], xf, yf), _grad2(perm[ba], xf - 1, yf), u),
            _lerp(_grad2(perm[ab], xf, yf - 1), _grad2(perm[bb], xf - 1, yf - 1), u),
            v
        );
    }

    /** fBm 2D — O(octaves) par échantillon */
    function fbm2(x, y, perm, octaves) {
        octaves = octaves || 3;
        var f = 0;
        var amp = 1;
        var norm = 0;
        var i;
        for (i = 0; i < octaves; i++) {
            f += amp * perlin2(x, y, perm);
            norm += amp;
            x *= 2;
            y *= 2;
            amp *= 0.5;
        }
        return norm > 0 ? f / norm : 0;
    }

    window.TextureNoise = {
        makePermutation512: makePermutation512,
        perlin2: perlin2,
        fbm2: fbm2
    };

    /**
     * RVB 0–255 par bande climatique (terre hors montagne/océan).
     * Même valeurs que l’ancien calibrage albedo_test_epochs — modifier ici pour tout le pipeline.
     */
    var DEFAULT_BIOME_RGB = {
        tropical: [10, 100, 20],
        arid: [250, 200, 0],
        temperate: [100, 160, 40],
        boreal: [140, 140, 100]
    };

    /**
     * Poids du bruit fin par biome dans heightmapToBiome (r0,g0,b0 *= 1 + texN).
     * O(1) par appel ; fBm interne O(octaves).
     */
    var BIOME_FINE_WEIGHTS = { tropical: 0.38, arid: 0.45, temperate: 0.22, boreal: 0.48 };

    /**
     * @param {'tropical'|'arid'|'temperate'|'boreal'} bandId
     * @param {number[]|null|undefined} overrideRgb — ex. params.biomeTropicalRgb
     * @param {number} vegetation — 0..1
     * @returns {number[]} [r,g,b] entiers 0–255
     */
    function landRgbBand(bandId, overrideRgb, vegetation) {
        var veg = vegetation != null ? vegetation : 0.3;
        var o = overrideRgb;
        if (o && o.length >= 3) {
            return [Math.round(o[0]), Math.round(o[1]), Math.round(o[2])];
        }
        var dry = 1 - veg * 0.5;
        if (bandId === 'tropical') {
            return [
                Math.round(40 + (1 - veg) * 120),
                Math.round(100 + veg * 60),
                Math.round(30 + (1 - veg) * 30)
            ];
        }
        if (bandId === 'arid') {
            return [
                Math.round(180 * dry + 80 * (1 - dry)),
                Math.round(160 * dry + 120 * (1 - dry)),
                Math.round(100 * dry + 50 * (1 - dry))
            ];
        }
        if (bandId === 'temperate') {
            return [
                Math.round(80 + (1 - veg) * 60),
                Math.round(120 + veg * 40),
                Math.round(50 + (1 - veg) * 20)
            ];
        }
        if (bandId === 'boreal') {
            return [
                Math.round(120 + (1 - veg) * 40),
                Math.round(130 + veg * 20),
                100
            ];
        }
        return DEFAULT_BIOME_RGB.tropical.slice();
    }

    /**
     * Bruit procédural « texture » par bande (même formules que plate_renderer avant extraction).
     * @param {function(number,number,Uint8Array,number): number} fbm2 — ex. TextureNoise.fbm2
     */
    function fineTextureTropical(nx, ny, perm, fbm2) {
        var nxT = nx * 6.5;
        var nyT = ny * 6.5;
        return fbm2(nxT + 50.3, nyT + 31.7, perm, 2);
    }
    function fineTextureArid(nx, ny, perm, fbm2) {
        return fbm2(nx * 2.5 + 80.1, ny * 9.0 + 44.2, perm, 2);
    }
    function fineTextureTemperate(nx, ny, perm, fbm2) {
        return fbm2(nx * 2.0 + 21.4, ny * 6.0 + 73.6, perm, 2);
    }
    function fineTextureBoreal(nx, ny, perm, fbm2) {
        var tBoRaw = fbm2(nx * 10.5 + 112.5, ny * 10.5 + 91.3, perm, 3);
        return (Math.abs(tBoRaw) - 0.28) * 1.6;
    }

    /**
     * @returns {number} texN tel que couleur *= (1 + texN)
     */
    function compositeLandFineTexture(wTr, wAr, wTe, wBo, nx, ny, perm, fbm2) {
        var w = BIOME_FINE_WEIGHTS;
        return wTr * fineTextureTropical(nx, ny, perm, fbm2) * w.tropical +
            wAr * fineTextureArid(nx, ny, perm, fbm2) * w.arid +
            wTe * fineTextureTemperate(nx, ny, perm, fbm2) * w.temperate +
            wBo * fineTextureBoreal(nx, ny, perm, fbm2) * w.boreal;
    }

    window.TextureBiomes = {
        bandIds: ['tropical', 'arid', 'temperate', 'boreal'],
        defaultRgb: DEFAULT_BIOME_RGB,
        fineWeights: BIOME_FINE_WEIGHTS,
        landRgbBand: landRgbBand,
        compositeLandFineTexture: compositeLandFineTexture,
        fineTextureTropical: fineTextureTropical,
        fineTextureArid: fineTextureArid,
        fineTextureTemperate: fineTextureTemperate,
        fineTextureBoreal: fineTextureBoreal
    };

    /**
     * TEXTURES['⚫'] — Corps noir (TIMELINE).
     * @param {number} width
     * @param {number} height
     * @param {{ primitiveIceT?: number, perlinSeed?: number }} params
     * @returns {Uint8ClampedArray} RGBA équirectangulaire
     */
    function TEXTURE_CORPS_NOIR(width, height, params) {
        params = params || {};
        var iceT = params.primitiveIceT != null ? Math.max(0, Math.min(1, Number(params.primitiveIceT))) : 0;
        var seed = params.perlinSeed != null ? params.perlinSeed : 137;
        var perm = makePermutation512(seed);
        var rgba = new Uint8ClampedArray(width * height * 4);
        var GOLD = 2.39996322972865332;
        var py, px, pi, lat, lon, sx, sy, f, f2, stripes, bowlSum, k, ang, cx, cy, d, rk, t, ridge, micro, speck;
        var bright, baseR, baseG, baseB, iceMix, r, g, b;
        var contrastBoost = 1 + iceT * 1.35;
        var iceLift = iceT * 95;
        for (py = 0; py < height; py++) {
            lat = 90 - (py + 0.5) / height * 180;
            for (px = 0; px < width; px++) {
                lon = (px + 0.5) / width * 360 - 180;
                pi = (py * width + px) * 4;
                sx = lon * 0.105;
                sy = lat * 0.105;
                f = fbm2(sx + 2.14, sy - 1.31, perm, 4);
                f2 = fbm2(sx * 5.8 + 19.7, sy * 5.8 - 6.4, perm, 2);
                stripes =
                    Math.abs(Math.sin(lon * 0.068 + lat * 0.041)) *
                    Math.abs(Math.sin(lon * 0.019 - lat * 0.088 + f * 0.4));
                bowlSum = 0;
                for (k = 0; k < 18; k++) {
                    ang = k * GOLD;
                    cx = Math.cos(ang) * (10.5 + (k % 4) * 2.8);
                    cy = Math.sin(ang) * (6.8 + (k % 3) * 2.2);
                    d = Math.sqrt((lon - cx) * (lon - cx) + (lat - cy) * (lat - cy));
                    rk = 2.8 + (k % 5) * 0.75;
                    if (d < rk) {
                        t = d / rk;
                        bowlSum += (1 - t) * (1 - t) * (0.28 + 0.14 * f2);
                    }
                }
                ridge = Math.max(0, f) * (16 + iceT * 38);
                micro = Math.max(0, f2) * (10 + stripes * 24);
                speck = Math.pow(Math.max(0, f * 0.5 + 0.5), 7) * (22 + iceT * 48);
                bright = (ridge + micro + speck + bowlSum * (38 + iceT * 72)) * contrastBoost;
                bright = Math.min(235, bright + iceLift * (0.25 + stripes * 0.45 + bowlSum * 0.35));
                baseR = 1 + iceT * 10;
                baseG = 2 + iceT * 14;
                baseB = 5 + iceT * 22;
                iceMix = iceT * Math.min(1, bright / 85);
                r = baseR + bright * (1 - iceMix) + iceMix * (208 + f * 28);
                g = baseG + bright * 0.92 * (1 - iceMix) + iceMix * (222 + f * 22);
                b = baseB + bright * 0.88 * (1 - iceMix) + iceMix * (238 + f * 14);
                rgba[pi] = Math.round(Math.max(0, Math.min(255, r)));
                rgba[pi + 1] = Math.round(Math.max(0, Math.min(255, g)));
                rgba[pi + 2] = Math.round(Math.max(0, Math.min(255, b)));
                rgba[pi + 3] = 255;
            }
        }
        return rgba;
    }

    TEXTURE_CORPS_NOIR.textureKey = '⚫';
    TEXTURE_CORPS_NOIR.about =
        'TIMELINE corps noir : fBm (4+2 oct), rayures sin, 18 cratères, primitiveIceT = phase glace 0→1.';

    /**
     * Registre : une clé = un générateur ou une entrée doc (pour savoir quoi modifier).
     * - ⚫ : implémenté ici (RGBA complet).
     * - 🌍 : logique biome/océan/glace = heightmapToBiome + heightmapToClimateBandOverlay dans plate_renderer.js (utilise TextureNoise.fbm2).
     * - 🔥 : rampe magma Hadéen (isHadean) dans plate_renderer.js — pas encore de fBm dédié surface.
     */
    function biomeEntry(emoji, bandId, labelFr, textureNote) {
        return {
            textureKey: emoji,
            bandId: bandId,
            labelFr: labelFr,
            colorRgb: DEFAULT_BIOME_RGB[bandId],
            fineWeight: BIOME_FINE_WEIGHTS[bandId],
            about: labelFr + '. RVB défaut (modifier TextureBiomes.defaultRgb.' + bandId + ') : [' +
                DEFAULT_BIOME_RGB[bandId].join(', ') + ']. ' + textureNote,
            rgbaEquirect: null
        };
    }

    window.TEXTURES = {
        '⚫': TEXTURE_CORPS_NOIR,
        '🌍': {
            textureKey: '🌍',
            about: 'Pipeline complet terre/océan/glace : heightmapToBiome + heightmapToClimateBandOverlay (plate_renderer). Couleurs + fBm fin = TextureBiomes + TEXTURES 🌴🏜️🌾🌲.',
            rgbaEquirect: null
        },
        '🔥': {
            textureKey: '🔥',
            about: 'Hadéen : teintes magma dans plate_renderer.js (branche isHadean de heightmapToBiome). À extraire ici si besoin de fBm surface.',
            rgbaEquirect: null
        },
        '🌴': biomeEntry('🌴', 'tropical', 'Tropical (forêt / canopée)', 'fBm blobs denses : TextureBiomes.fineTextureTropical.'),
        '🏜️': biomeEntry('🏜️', 'arid', 'Aride (désert)', 'fBm dunes E–O : TextureBiomes.fineTextureArid.'),
        '🌾': biomeEntry('🌾', 'temperate', 'Tempéré (plaine / prairie)', 'fBm doux horizontal : TextureBiomes.fineTextureTemperate.'),
        '🌲': biomeEntry('🌲', 'boreal', 'Boréal (taïga / forêt froide)', 'fBm haute fréq ridgée (galets) : TextureBiomes.fineTextureBoreal.')
    };

    /** Liste des clés pour console / UI */
    window.TEXTURE_REGISTRY_KEYS = Object.keys(window.TEXTURES);
})();
