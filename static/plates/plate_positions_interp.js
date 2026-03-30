// plate_positions_interp.js — Interpolation linéaire des positions plaques (dLat, dLon, rotDeg) + seaLevel
// interpolatePlatePositionsBetweenKeys : segments TIMELINE successifs (éditeur, pas de saut vers 0 Ma).
// interpolatePlatePositionsAtMa : ancres 0–250 Ma (usage ponctuel / debug).
// O(k) par appel, k = nombre de plaques (~9).

(function () {
    'use strict';

    var PLATE_IDS = ['AF', 'EU', 'AS', 'NA', 'SA', 'AN', 'AU', 'IN', 'AR'];

    /** Ancres temps croissant (Ma avant présent) → clé d’époque dans PLATE_POSITIONS (même noms que DATA / TIMELINE). */
    var ANCHORS_ASC = [
        { ma: 0, key: '📱' },
        { ma: 2, key: '❄️' },
        { ma: 28, key: '🏔' },
        { ma: 34, key: '⛰' },
        { ma: 50, key: '🐊' },
        { ma: 66, key: '🦣' },
        { ma: 250, key: '🦕' }
    ];

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function plateTriple(posEpoch, id) {
        var o = posEpoch && posEpoch[id];
        if (!o) return { dLat: 0, dLon: 0, rotDeg: 0 };
        return {
            dLat: Number(o.dLat) || 0,
            dLon: Number(o.dLon) || 0,
            rotDeg: Number(o.rotDeg) || 0
        };
    }

    function mixTwoEpochs(PP, keyA, keyB, t) {
        var ea = PP[keyA];
        var eb = PP[keyB];
        if (!ea && !eb) return null;
        ea = ea || {};
        eb = eb || {};
        var slA = ea.seaLevel != null ? Number(ea.seaLevel) : (eb.seaLevel != null ? Number(eb.seaLevel) : 0.25);
        var slB = eb.seaLevel != null ? Number(eb.seaLevel) : (ea.seaLevel != null ? Number(ea.seaLevel) : 0.25);
        var out = { seaLevel: lerp(slA, slB, t) };
        var i, id, pa, pb;
        for (i = 0; i < PLATE_IDS.length; i++) {
            id = PLATE_IDS[i];
            pa = plateTriple(ea, id);
            pb = plateTriple(eb, id);
            out[id] = {
                dLat: lerp(pa.dLat, pb.dLat, t),
                dLon: lerp(pa.dLon, pb.dLon, t),
                rotDeg: lerp(pa.rotDeg, pb.rotDeg, t)
            };
        }
        return out;
    }

    /**
     * @param {number} ma — millions d’années avant le présent (0 = 📱 ; 250 = fin de fenêtre, géométrie 🦕)
     * @returns {object|null} — { seaLevel, AF: {dLat,dLon,rotDeg}, ... } ou null si PLATE_POSITIONS absent.
     *   (seaLevel = valeur interpolée entre ancres ; l’éditeur HTML n’impose pas ce seuil — curseur manuel.)
     */
    function interpolatePlatePositionsAtMa(ma) {
        var PP = window.PLATE_POSITIONS;
        if (!PP) return null;
        var m = Math.max(0, Math.min(250, Number(ma) || 0));
        var n = ANCHORS_ASC.length;
        var first = ANCHORS_ASC[0];
        var last = ANCHORS_ASC[n - 1];
        if (m <= first.ma) {
            return mixTwoEpochs(PP, first.key, first.key, 0);
        }
        if (m >= last.ma) {
            return mixTwoEpochs(PP, last.key, last.key, 0);
        }
        var lo = 0;
        var hi = n - 1;
        while (hi - lo > 1) {
            var mid = (lo + hi) >> 1;
            if (ANCHORS_ASC[mid].ma <= m) lo = mid; else hi = mid;
        }
        var A = ANCHORS_ASC[lo];
        var B = ANCHORS_ASC[hi];
        var u = (m - A.ma) / (B.ma - A.ma);
        return mixTwoEpochs(PP, A.key, B.key, u);
    }

    /**
     * Interpolation linéaire positions + seaLevel entre deux clés TIMELINE (t ∈ [0,1] : gauche → droite).
     * O(k). Conservé pour l’éditeur (segments successifs, pas de retour arbitraire vers 0 Ma).
     */
    function interpolatePlatePositionsBetweenKeys(PP, keyA, keyB, t) {
        if (!PP) return null;
        t = Math.max(0, Math.min(1, Number(t) || 0));
        return mixTwoEpochs(PP, keyA, keyB, t);
    }

    window.PLATE_POSITION_ANCHORS_MA = ANCHORS_ASC.slice();
    window.interpolatePlatePositionsAtMa = interpolatePlatePositionsAtMa;
    window.interpolatePlatePositionsBetweenKeys = interpolatePlatePositionsBetweenKeys;
})();
