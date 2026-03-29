// plate_renderer.js — Rendu des plaques sur canvas equirectangulaire + heightmap
// Convertit les plaques 3D en heightmap 2D, puis en texture biome
// Réutilisable dans l'éditeur ET dans l'organigramme

(function () {
    'use strict';

    const DEG2RAD = Math.PI / 180;

    // ─── Géométrie sphérique ───

    function latLonToVec3(lat, lon) {
        const phi = (90 - lat) * DEG2RAD;
        const theta = (lon + 180) * DEG2RAD;
        return {
            x: Math.sin(phi) * Math.cos(theta),
            y: Math.cos(phi),
            z: Math.sin(phi) * Math.sin(theta)
        };
    }

    function vec3ToLatLon(v) {
        const r = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        const lat = 90 - Math.acos(v.y / r) / DEG2RAD;
        const lon = Math.atan2(v.z, v.x) / DEG2RAD - 180;
        return [lat, lon > 180 ? lon - 360 : lon < -180 ? lon + 360 : lon];
    }

    function rotatePoint(lat, lon, axisLat, axisLon, angleDeg) {
        if (angleDeg === 0) return [lat, lon];
        const p = latLonToVec3(lat, lon);
        const axis = latLonToVec3(axisLat, axisLon);
        const al = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
        const ax = axis.x / al, ay = axis.y / al, az = axis.z / al;
        const angle = angleDeg * DEG2RAD;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const dot = ax * p.x + ay * p.y + az * p.z;
        const cx = ay * p.z - az * p.y;
        const cy = az * p.x - ax * p.z;
        const cz = ax * p.y - ay * p.x;
        return vec3ToLatLon({
            x: p.x * cos + cx * sin + ax * dot * (1 - cos),
            y: p.y * cos + cy * sin + ay * dot * (1 - cos),
            z: p.z * cos + cz * sin + az * dot * (1 - cos)
        });
    }

    // ─── Point-in-polygon sphérique (winding number 3D) ───
    // Fonctionne sur la sphère : pas de bug antiméridien ni polaire

    function pointInPolygon3D(px, py, pz, verts3D) {
        var n = verts3D.length;
        var totalAngle = 0;
        for (var i = 0; i < n; i++) {
            var a = verts3D[i];
            var b = verts3D[(i + 1) % n];
            // Projeter A et B sur le plan tangent en P
            var dotAP = a.x * px + a.y * py + a.z * pz;
            var dotBP = b.x * px + b.y * py + b.z * pz;
            var pax = a.x - dotAP * px, pay = a.y - dotAP * py, paz = a.z - dotAP * pz;
            var pbx = b.x - dotBP * px, pby = b.y - dotBP * py, pbz = b.z - dotBP * pz;
            var la = Math.sqrt(pax * pax + pay * pay + paz * paz);
            var lb = Math.sqrt(pbx * pbx + pby * pby + pbz * pbz);
            if (la < 1e-10 || lb < 1e-10) return true; // P sur un vertex
            var cosA = (pax * pbx + pay * pby + paz * pbz) / (la * lb);
            cosA = cosA > 1 ? 1 : cosA < -1 ? -1 : cosA;
            // Signe via produit vectoriel projeté sur P
            var cx = pay * pbz - paz * pby;
            var cy = paz * pbx - pax * pbz;
            var cz = pax * pby - pay * pbx;
            var sign = cx * px + cy * py + cz * pz;
            var angle = Math.acos(cosA);
            totalAngle += sign >= 0 ? angle : -angle;
        }
        if (Math.abs(totalAngle) <= Math.PI) return false;

        // Garde anti-antipode : un polygone qui fait le tour en longitude
        // (ex: Antarctique) donne un faux winding ±2π au pôle opposé.
        // On vérifie que P est du même côté que le centroïde du polygone.
        var gcx = 0, gcy = 0, gcz = 0;
        for (var j = 0; j < n; j++) {
            gcx += verts3D[j].x; gcy += verts3D[j].y; gcz += verts3D[j].z;
        }
        var gl = Math.sqrt(gcx * gcx + gcy * gcy + gcz * gcz);
        if (gl > 0.01) {
            gcx /= gl; gcy /= gl; gcz /= gl;
            var dotPC = px * gcx + py * gcy + pz * gcz;
            // Vertex le plus éloigné du centroïde
            var minDotCV = 1;
            for (var j = 0; j < n; j++) {
                var d = gcx * verts3D[j].x + gcy * verts3D[j].y + gcz * verts3D[j].z;
                if (d < minDotCV) minDotCV = d;
            }
            // P plus loin que le vertex le plus éloigné → faux positif antipodal
            if (dotPC < minDotCV) return false;
        }
        return true;
    }

    // ─── Heightmap : rendu des plaques sur canvas ───

    function renderHeightmap(width, height, plates, positions, options) {
        options = options || {};
        var oceanFloor = options.oceanFloor != null ? options.oceanFloor : 0.1;
        var heightmap = new Float32Array(width * height);
        heightmap.fill(oceanFloor);

        // Pré-calculer les vertices 3D rotés pour chaque plaque
        var plateDefs = [];
        for (var id in plates) {
            if (!plates.hasOwnProperty(id)) continue;
            var plate = plates[id];
            var pos = positions[id] || { rotLat: 0, rotLon: 0, rotDeg: 0 };
            var verts3D = plate.vertices.map(function (v) {
                var rll = rotatePoint(v[0], v[1], pos.rotLat, pos.rotLon, pos.rotDeg);
                return latLonToVec3(rll[0], rll[1]);
            });
            plateDefs.push({ height: plate.height, verts3D: verts3D });
        }

        // Rasteriser : pour chaque pixel, tester chaque plaque en 3D
        for (var py = 0; py < height; py++) {
            var lat = 90 - (py / height) * 180;
            // Pôles : un seul point 3D pour toute la ligne
            if (Math.abs(lat) > 89.5) {
                var pPole = latLonToVec3(lat > 0 ? 90 : -90, 0);
                var rowH = oceanFloor;
                for (var k = 0; k < plateDefs.length; k++) {
                    if (pointInPolygon3D(pPole.x, pPole.y, pPole.z, plateDefs[k].verts3D)) {
                        rowH += plateDefs[k].height;
                    }
                }
                for (var px = 0; px < width; px++) {
                    heightmap[py * width + px] = rowH;
                }
                continue;
            }
            for (var px = 0; px < width; px++) {
                var lon = (px / width) * 360 - 180;
                var p = latLonToVec3(lat, lon);
                var idx = py * width + px;
                for (var k = 0; k < plateDefs.length; k++) {
                    if (pointInPolygon3D(p.x, p.y, p.z, plateDefs[k].verts3D)) {
                        heightmap[idx] += plateDefs[k].height;
                    }
                }
            }
        }

        return heightmap;
    }

    // ─── Biome : heightmap + latitude → couleur ───

    function heightmapToBiome(heightmap, width, height, params) {
        params = params || {};
        const iceFraction = params.iceFraction != null ? params.iceFraction : 0;
        const vegetation = params.vegetation != null ? params.vegetation : 0.3;
        const isHadean = params.isHadean || false;

        const rgba = new Uint8ClampedArray(width * height * 4);
        const iceLatThreshold = iceFraction > 0 ? 90 - (iceFraction * 200) : 999;

        for (let py = 0; py < height; py++) {
            const lat = 90 - (py / height) * 180;
            const absLat = Math.abs(lat);

            for (let px = 0; px < width; px++) {
                const idx = py * width + px;
                const h = heightmap[idx];
                const pi = idx * 4;

                let r, g, b;

                if (h < 0.35) {
                    const d = h / 0.35;
                    r = Math.round(5 + d * 15);
                    g = Math.round(20 + d * 40);
                    b = Math.round(80 + d * 60);
                } else if (h < 0.45) {
                    const d = (h - 0.35) / 0.1;
                    r = Math.round(20 + d * 30);
                    g = Math.round(60 + d * 80);
                    b = Math.round(140 + d * 40);
                } else if (isHadean) {
                    const d = Math.min(1, (h - 0.45) / 0.5);
                    r = Math.round(180 + d * 75);
                    g = Math.round(60 + d * 40);
                    b = Math.round(10 + d * 10);
                } else {
                    const landH = Math.min(1, (h - 0.45) / 0.55);

                    if (landH > 0.8) {
                        r = 220; g = 220; b = 225;
                    } else if (landH > 0.5) {
                        const m = (landH - 0.5) / 0.3;
                        r = Math.round(140 + m * 60);
                        g = Math.round(110 + m * 50);
                        b = Math.round(80 + m * 40);
                    } else {
                        if (absLat < 25) {
                            const veg = vegetation;
                            r = Math.round(40 + (1 - veg) * 120);
                            g = Math.round(100 + veg * 60);
                            b = Math.round(30 + (1 - veg) * 30);
                        } else if (absLat < 35) {
                            const dryness = 1 - vegetation * 0.5;
                            r = Math.round(180 * dryness + 80 * (1 - dryness));
                            g = Math.round(160 * dryness + 120 * (1 - dryness));
                            b = Math.round(100 * dryness + 50 * (1 - dryness));
                        } else if (absLat < 55) {
                            r = Math.round(80 + (1 - vegetation) * 60);
                            g = Math.round(120 + vegetation * 40);
                            b = Math.round(50 + (1 - vegetation) * 20);
                        } else {
                            r = Math.round(120 + (1 - vegetation) * 40);
                            g = Math.round(130 + vegetation * 20);
                            b = Math.round(100);
                        }
                    }

                    if (absLat > iceLatThreshold && h > 0.35) {
                        const iceBlend = Math.min(1, (absLat - iceLatThreshold) / 15);
                        r = Math.round(r * (1 - iceBlend) + 240 * iceBlend);
                        g = Math.round(g * (1 - iceBlend) + 245 * iceBlend);
                        b = Math.round(b * (1 - iceBlend) + 255 * iceBlend);
                    }
                }

                rgba[pi] = r;
                rgba[pi + 1] = g;
                rgba[pi + 2] = b;
                rgba[pi + 3] = 255;
            }
        }

        return rgba;
    }

    // ─── Utilitaire : rendu heightmap en grayscale ───

    function heightmapToGrayscale(heightmap, width, height) {
        const rgba = new Uint8ClampedArray(width * height * 4);
        let maxH = 0;
        for (let i = 0; i < heightmap.length; i++) {
            if (heightmap[i] > maxH) maxH = heightmap[i];
        }
        const scale = maxH > 0 ? 255 / maxH : 1;
        for (let i = 0; i < heightmap.length; i++) {
            const v = Math.min(255, Math.round(heightmap[i] * scale));
            rgba[i * 4] = v;
            rgba[i * 4 + 1] = v;
            rgba[i * 4 + 2] = v;
            rgba[i * 4 + 3] = 255;
        }
        return rgba;
    }

    // ─── Debug : tester un point contre une plaque ───
    // Usage console : PlateRenderer.debugPoint(lat, lon, 'AU')
    function debugPoint(lat, lon, plateId) {
        var plates = window.PLATES;
        var positions = window.PLATE_POSITIONS;
        var epoch = window._currentEpoch || '📱';
        var pos = (positions[epoch] || {})[plateId] || { rotLat: 0, rotLon: 0, rotDeg: 0 };
        var plate = plates[plateId];
        if (!plate) { console.log('Plaque inconnue:', plateId); return; }

        var verts3D = plate.vertices.map(function (v) {
            var rll = rotatePoint(v[0], v[1], pos.rotLat, pos.rotLon, pos.rotDeg);
            return latLonToVec3(rll[0], rll[1]);
        });

        var p = latLonToVec3(lat, lon);
        console.log('Test point:', lat, lon, '→ 3D:', p);
        console.log('Epoch:', epoch, 'Pos:', pos);
        console.log('Verts 3D:', verts3D.map(function(v,i) {
            var ll = vec3ToLatLon(v);
            return i + ': [' + ll[0].toFixed(1) + ',' + ll[1].toFixed(1) + '] → (' +
                v.x.toFixed(4) + ',' + v.y.toFixed(4) + ',' + v.z.toFixed(4) + ')';
        }));

        var n = verts3D.length;
        var totalAngle = 0;
        for (var i = 0; i < n; i++) {
            var a = verts3D[i];
            var b = verts3D[(i + 1) % n];
            var dotAP = a.x*p.x + a.y*p.y + a.z*p.z;
            var dotBP = b.x*p.x + b.y*p.y + b.z*p.z;
            var pax = a.x - dotAP*p.x, pay = a.y - dotAP*p.y, paz = a.z - dotAP*p.z;
            var pbx = b.x - dotBP*p.x, pby = b.y - dotBP*p.y, pbz = b.z - dotBP*p.z;
            var la = Math.sqrt(pax*pax + pay*pay + paz*paz);
            var lb = Math.sqrt(pbx*pbx + pby*pby + pbz*pbz);
            var cosA = (la < 1e-10 || lb < 1e-10) ? 1 : (pax*pbx + pay*pby + paz*pbz) / (la*lb);
            cosA = cosA > 1 ? 1 : cosA < -1 ? -1 : cosA;
            var cx = pay*pbz - paz*pby, cy = paz*pbx - pax*pbz, cz = pax*pby - pay*pbx;
            var sign = cx*p.x + cy*p.y + cz*p.z;
            var angle = Math.acos(cosA);
            var signed = sign >= 0 ? angle : -angle;
            totalAngle += signed;
            console.log('Edge ' + i + '→' + ((i+1)%n) + ': dotAP=' + dotAP.toFixed(4) +
                ' dotBP=' + dotBP.toFixed(4) + ' la=' + la.toFixed(6) + ' lb=' + lb.toFixed(6) +
                ' cosA=' + cosA.toFixed(4) + ' sign=' + sign.toFixed(6) + ' angle=' + (signed*180/Math.PI).toFixed(2) +
                '° cumul=' + (totalAngle*180/Math.PI).toFixed(2) + '°');
        }
        var inside = Math.abs(totalAngle) > Math.PI;
        console.log('Total angle: ' + (totalAngle*180/Math.PI).toFixed(2) + '° → ' + (inside ? 'INSIDE' : 'OUTSIDE'));
        return inside;
    }

    // ─── Export ───

    window.PlateRenderer = {
        latLonToVec3: latLonToVec3,
        vec3ToLatLon: vec3ToLatLon,
        rotatePoint: rotatePoint,
        pointInPolygon3D: pointInPolygon3D,
        renderHeightmap: renderHeightmap,
        heightmapToBiome: heightmapToBiome,
        heightmapToGrayscale: heightmapToGrayscale,
        debugPoint: debugPoint
    };

})();
