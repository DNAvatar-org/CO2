/**
 * Données provisoires : cycles albédo (sortie type calculateAlbedo) par époque
 * de l’éditeur de plaques. À remplacer par lecture API / physicsAll quand câblé.
 *
 * Manque : 🌿350 Ma — aucune ligne fournie ; copie Paléozoïque 500 Ma (placeholder).
 * Non utilisés pour les bandes ici : 🍰🪩📿 (albédo moyen planète), 🍰🪩🌋 (0 partout),
 * 🍰🪩⛅ / ☁️ (nuages — pas de calque nuage sur la texture sol/océan de l’éditeur).
 */
(function () {
    'use strict';

    var ROW_500MA = {
        '🍰🪩📿': 0.211,
        '🍰🪩🌋': 0,
        '🍰🪩🏜️': 0.113,
        '🍰🪩🌳': 0.091,
        '🍰🪩🌊': 0.708,
        '🍰🪩🧊': 0,
        '🍰🪩⛅': 0.236,
        '🍰🪩🌍': 0.089,
        '☁️': 0.417
    };

    window.ALBEDO_TEST_EPOCHS = {
        '🌿500': ROW_500MA,
        '🌿350': Object.assign({}, ROW_500MA),
        '🦕250': {
            '🍰🪩📿': 0.205,
            '🍰🪩🌋': 0,
            '🍰🪩🏜️': 0.114,
            '🍰🪩🌳': 0.092,
            '🍰🪩🌊': 0.705,
            '🍰🪩🧊': 0,
            '🍰🪩⛅': 0.219,
            '🍰🪩🌍': 0.09,
            '☁️': 0.417
        },
        '🦕150': {
            '🍰🪩📿': 0.205,
            '🍰🪩🌋': 0,
            '🍰🪩🏜️': 0.114,
            '🍰🪩🌳': 0.092,
            '🍰🪩🌊': 0.705,
            '🍰🪩🧊': 0,
            '🍰🪩⛅': 0.219,
            '🍰🪩🌍': 0.09,
            '☁️': 0.417
        },
        '🦣': {
            '🍰🪩📿': 0.276,
            '🍰🪩🌋': 0,
            '🍰🪩🏜️': 0.083,
            '🍰🪩🌳': 0.06,
            '🍰🪩🌊': 0.71,
            '🍰🪩🧊': 0.072,
            '🍰🪩⛅': 0.348,
            '🍰🪩🌍': 0.075,
            '☁️': 0.429
        },
        '🐊': {
            '🍰🪩📿': 0.258,
            '🍰🪩🌋': 0,
            '🍰🪩🏜️': 0.111,
            '🍰🪩🌳': 0.088,
            '🍰🪩🌊': 0.71,
            '🍰🪩🧊': 0,
            '🍰🪩⛅': 0.361,
            '🍰🪩🌍': 0.092,
            '☁️': 0.429
        },
        '⛰': {
            '🍰🪩📿': 0.285,
            '🍰🪩🌋': 0,
            '🍰🪩🏜️': 0.074,
            '🍰🪩🌳': 0.052,
            '🍰🪩🌊': 0.71,
            '🍰🪩🧊': 0.095,
            '🍰🪩⛅': 0.344,
            '🍰🪩🌍': 0.069,
            '☁️': 0.43
        },
        '🏔': {
            '🍰🪩📿': 0.318,
            '🍰🪩🌋': 0,
            '🍰🪩🏜️': 0.033,
            '🍰🪩🌳': 0.023,
            '🍰🪩🌊': 0.71,
            '🍰🪩🧊': 0.187,
            '🍰🪩⛅': 0.33,
            '🍰🪩🌍': 0.046,
            '☁️': 0.423
        },
        '❄️': {
            '🍰🪩📿': 0.307,
            '🍰🪩🌋': 0,
            '🍰🪩🏜️': 0.055,
            '🍰🪩🌳': 0.036,
            '🍰🪩🌊': 0.71,
            '🍰🪩🧊': 0.141,
            '🍰🪩⛅': 0.335,
            '🍰🪩🌍': 0.058,
            '☁️': 0.422
        },
        '📱': {
            '🍰🪩📿': 0.302,
            '🍰🪩🌋': 0,
            '🍰🪩🏜️': 0.066,
            '🍰🪩🌳': 0.044,
            '🍰🪩🌊': 0.71,
            '🍰🪩🧊': 0.112,
            '🍰🪩⛅': 0.352,
            '🍰🪩🌍': 0.069,
            '☁️': 0.433
        }
    };

    /** Calibrage éditeur (mer + texture pôles) — ajustable ici */
    var CAL_SEA_MODERN = 0.25;
    /** Sud AN : plus haut = moins de blanc ; nord = rampes northPolarIceLumaStops */
    var CAL_SOUTH_POLAR_TEX_THRESHOLD = 56;
    var CAL_POLAR_TEX_THRESHOLD = 46;

    /**
     * 4 bandes (RVB 0–255) : biome, overlay, légende. La répartition latitudinale = tropicalEdge, aridSpan, temperateEnd, edgeBlendDeg, climateLatNoiseMul.
     */
    var CLIMATE_BAND_TROPICAL_RGB = [10, 100, 20];
    var CLIMATE_BAND_ARID_RGB = [250, 200, 0];
    var CLIMATE_BAND_TEMPERATE_RGB = [100, 160, 40];
    var CLIMATE_BAND_BOREAL_RGB = [140, 140, 100];

    /**
     * Heuristiques pour l’éditeur (heightmapToBiome) — pas une inversion physique exacte.
     * Biome : 4 bandes (tropical, aride, tempéré, boréal).
     * - seaLevel : 🌊 sauf 📱 / ❄️ → CAL_SEA_MODERN (0.25).
     * - 📱 & ❄️ : Sud AN (seuil + lat) ; Nord max(NA,EU,AS) + rampes luma + disque pôle doux.
     */
    function biomeParamsFromAlbedoTest(row, epochKey) {
        if (!row) return {};
        var seed = 137;
        if (epochKey) {
            var i;
            for (i = 0; i < epochKey.length; i++) {
                seed = (seed + epochKey.charCodeAt(i) * (i + 7)) % 999983;
            }
        }
        var ocean = row['🍰🪩🌊'];
        var ice = row['🍰🪩🧊'];
        var forest = row['🍰🪩🌳'];
        var desert = row['🍰🪩🏜️'];
        var landOther = row['🍰🪩🌍'];
        var landSum = forest + desert + landOther + 1e-9;
        var rf = forest / landSum;
        var df = desert / landSum;
        var gf = landOther / landSum;

        var seaLevel = 0.06 + (ocean != null ? ocean : 0.71) * 0.39;
        if (epochKey === '📱' || epochKey === '❄️') {
            seaLevel = CAL_SEA_MODERN;
        }

        var iceLatThreshold = 999;
        var disableSymmetricPolarIce = false;
        var southPoleWhiteBelowLat = null;
        var northIceCapFromLat = null;
        var usePolarPlateTexture = false;
        var polarTextureThreshold = CAL_POLAR_TEX_THRESHOLD;
        var southPolarTextureThreshold = CAL_SOUTH_POLAR_TEX_THRESHOLD;
        var southPolarLatCutoff = -62;
        var northPolarLatFloor = 48;
        var northEdgeBaseLat = 59.5;
        var northEdgeWarpAmp = 9;
        if (epochKey === '📱' || epochKey === '❄️') {
            disableSymmetricPolarIce = true;
            usePolarPlateTexture = true;
        } else if (ice != null && ice > 0.001) {
            iceLatThreshold = 90 - Math.sqrt(Math.min(1, ice * 2.1)) * 50;
        }

        var vegetation = Math.max(0.08, Math.min(0.92, rf / (rf + df + 0.12)));
        var biomeTropicalRgb = CLIMATE_BAND_TROPICAL_RGB.slice();
        var biomeAridRgb = CLIMATE_BAND_ARID_RGB.slice();
        var biomeTemperateRgb = CLIMATE_BAND_TEMPERATE_RGB.slice();
        var biomeBorealRgb = CLIMATE_BAND_BOREAL_RGB.slice();

        // Calibrage physique : tropiques ~0-20°, aride ~10°, tempéré jusqu'à ~55-65°
        var tropicalEdge = 12 + 8 * Math.min(1, rf / 0.25);        // 12–20°
        var aridSpan = 5 + 7 * Math.min(1, df / 0.3);              // 5–12°
        var temperateEnd = 52 + 12 * gf + 6 * (1 - df);            // ~55–65°

        return {
            seaLevel: seaLevel,
            iceLatThreshold: iceLatThreshold,
            disableSymmetricPolarIce: disableSymmetricPolarIce,
            southPoleWhiteBelowLat: southPoleWhiteBelowLat,
            northIceCapFromLat: northIceCapFromLat,
            usePolarPlateTexture: usePolarPlateTexture,
            polarTextureThreshold: polarTextureThreshold,
            southPolarTextureThreshold: southPolarTextureThreshold,
            northPolarIceLumaStops: [34, 42, 50, 58],
            northEdgeSoftBand: 8,
            northIceLatFadeLo: 52,
            northIceLatFadeHi: 70,
            northIceSpeckleMin: 0.1,
            northIceSpeckleMax: 0.92,
            northMoutonBandSouth: 80.5,
            northMoutonBandNorth: 84.8,
            northPoleNoMoutonLat: 86.5,
            northMoutonBandEdgeDeg: 0.65,
            northPoleDiskEnable: true,
            northPoleDiskBaseLat: 77.2,
            northPoleDiskFractAmp: 1.65,
            northPoleDiskBlendSouth: 6,
            northPoleDiskBlendNorth: 1.8,
            southPolarLatCutoff: southPolarLatCutoff,
            northPolarLatFloor: northPolarLatFloor,
            northEdgeBaseLat: northEdgeBaseLat,
            northEdgeWarpAmp: northEdgeWarpAmp,
            // Montagnes : gris PNG >136 OU landH (relief mer→max) ; composePlates somme les plaques → landH indispensable.
            mountPlateGrayPeak: 136,
            mountBlendGrayLo: 4,
            mountBlendGrayHi: 2,
            mountLandBlendLo: 0.38,
            mountLandBlendHi: 0.72,
            mountStop1: 0.36,
            mountStop2: 0.7,
            mountRgbGrayGreen: [118, 132, 122],
            mountRgbBrown: [176, 158, 136],
            mountRgbYellowGray: [214, 206, 172],
            mountRgbSnow: [252, 251, 255],
            biomeTropicalRgb: biomeTropicalRgb,
            biomeAridRgb: biomeAridRgb,
            biomeTemperateRgb: biomeTemperateRgb,
            biomeBorealRgb: biomeBorealRgb,
            climateBandOverlayAlpha: 0.42,
            climateLatNoiseMul: 0.28,
            vegetation: vegetation,
            tropicalEdge: tropicalEdge,
            aridSpan: aridSpan,
            temperateEnd: temperateEnd,
            latWaveAmp: 3.5,
            perlinAmpDeg: 9,
            perlinScale: 0.03,
            perlinOctaves: 3,
            perlinSeed: seed,
            edgeBlendDeg: 4.5
        };
    }

    window.biomeParamsFromAlbedoTest = biomeParamsFromAlbedoTest;
    /** Mêmes tableaux que CLIMATE_BAND_* — édition console puis rafraîchir l’époque. */
    window.BILAN_CLIMATE_BAND_RGB = {
        tropical: CLIMATE_BAND_TROPICAL_RGB,
        arid: CLIMATE_BAND_ARID_RGB,
        temperate: CLIMATE_BAND_TEMPERATE_RGB,
        boreal: CLIMATE_BAND_BOREAL_RGB
    };
})();
