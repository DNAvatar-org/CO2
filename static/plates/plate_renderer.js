// plate_renderer.js — Pipeline image-based pour les plaques tectoniques
// Chaque plaque = Float32Array (heightmap individuelle, equirectangulaire)
// Composition = rotation + addition pixel par pixel
// Niveau de la mer = seuil réglable
// v1.2.1 — biome : 4 bandes ; climateLatNoiseMul + params albédo pour la répartition latitudinale
// v1.2.2 — seaLevel≤0 : pas de biomes/océan/montagnes/glace ; RGB = luminance normalisée du heightmap (texture PNG composée)
// v1.2.3 — ⚫ corps noir : seaLevel≤0 + blackBodyPrimitive → texture procédurale (perlin, rayures, cratères) ; glace 5000→4500 Ma (primitiveIceT)
// v1.2.4 — Perlin/fBm + TEXTURES['⚫'] dans texture.js (charger texture.js avant ce fichier)
// v1.2.5 — couleurs + texture fine des 4 biomes = TextureBiomes dans texture.js
//
// Pipeline :
//   1. generatePlateImage(plate, w, h) → Float32Array (une fois)
//   2. composePlates(plateImages, positions, w, h) → Float32Array
//   3. heightmapToBiome(composed, w, h, {seaLevel, ...}) → Uint8ClampedArray RGBA (si seaLevel≤0 → PNG ou TEXTURES['⚫'] via texture.js)

(function () {
    'use strict';

    var DEG2RAD = Math.PI / 180;
    var TN = window.TextureNoise;
    var TB = window.TextureBiomes;
    if (!TN || typeof TN.fbm2 !== 'function' || !window.TEXTURES || typeof window.TEXTURES['⚫'] !== 'function') {
        throw new Error('plate_renderer.js : charger texture.js avant ce script (TextureNoise + TEXTURES[⚫]).');
    }
    if (!TB || typeof TB.landRgbBand !== 'function' || typeof TB.compositeLandFineTexture !== 'function') {
        throw new Error('plate_renderer.js : texture.js doit exposer TextureBiomes (biomes terre).');
    }
    // PNG : [LOW, PEAK] ↔ float [0, maxH] ; (PEAK, 255] ↔ jusqu’à maxH * (1 + SUPER_MUL) — les blancs au-delà de #888 comptent
    var PLATE_GRAY_LOW = 28;
    var PLATE_GRAY_PEAK = 136;
    var PLATE_GRAY_SUPER_MUL = 1;

    // ─── Géométrie sphérique ───

    function latLonToVec3(lat, lon) {
        var phi = (90 - lat) * DEG2RAD;
        var theta = (lon + 180) * DEG2RAD;
        return {
            x: Math.sin(phi) * Math.cos(theta),
            y: Math.cos(phi),
            z: Math.sin(phi) * Math.sin(theta)
        };
    }

    function vec3ToLatLon(v) {
        var r = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        var lat = 90 - Math.acos(v.y / r) / DEG2RAD;
        var lon = Math.atan2(v.z, v.x) / DEG2RAD - 180;
        return [lat, lon > 180 ? lon - 360 : lon < -180 ? lon + 360 : lon];
    }

    function rotatePoint(lat, lon, axisLat, axisLon, angleDeg) {
        if (angleDeg === 0) return [lat, lon];
        var p = latLonToVec3(lat, lon);
        var axis = latLonToVec3(axisLat, axisLon);
        var al = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
        var ax = axis.x / al, ay = axis.y / al, az = axis.z / al;
        var angle = angleDeg * DEG2RAD;
        var cos = Math.cos(angle), sin = Math.sin(angle);
        var dot = ax * p.x + ay * p.y + az * p.z;
        var cx = ay * p.z - az * p.y;
        var cy = az * p.x - ax * p.z;
        var cz = ax * p.y - ay * p.x;
        return vec3ToLatLon({
            x: p.x * cos + cx * sin + ax * dot * (1 - cos),
            y: p.y * cos + cy * sin + ay * dot * (1 - cos),
            z: p.z * cos + cz * sin + az * dot * (1 - cos)
        });
    }

    // ─── Point-in-polygon 3D (winding number) ───

    function pointInPolygon3D(px, py, pz, verts3D) {
        var n = verts3D.length;
        var totalAngle = 0;
        for (var i = 0; i < n; i++) {
            var a = verts3D[i];
            var b = verts3D[(i + 1) % n];
            var dotAP = a.x * px + a.y * py + a.z * pz;
            var dotBP = b.x * px + b.y * py + b.z * pz;
            var pax = a.x - dotAP * px, pay = a.y - dotAP * py, paz = a.z - dotAP * pz;
            var pbx = b.x - dotBP * px, pby = b.y - dotBP * py, pbz = b.z - dotBP * pz;
            var la = Math.sqrt(pax * pax + pay * pay + paz * paz);
            var lb = Math.sqrt(pbx * pbx + pby * pby + pbz * pbz);
            if (la < 1e-10 || lb < 1e-10) return true;
            var cosA = (pax * pbx + pay * pby + paz * pbz) / (la * lb);
            cosA = cosA > 1 ? 1 : cosA < -1 ? -1 : cosA;
            var cx = pay * pbz - paz * pby, cy = paz * pbx - pax * pbz, cz = pax * pby - pay * pbx;
            var sign = cx * px + cy * py + cz * pz;
            var angle = Math.acos(cosA);
            totalAngle += sign >= 0 ? angle : -angle;
        }
        if (Math.abs(totalAngle) <= Math.PI) return false;
        // Garde anti-antipode : rejeter si point est côté opposé au centroïde
        var gcx = 0, gcy = 0, gcz = 0;
        for (var j = 0; j < n; j++) { gcx += verts3D[j].x; gcy += verts3D[j].y; gcz += verts3D[j].z; }
        var dotPC = px * gcx + py * gcy + pz * gcz;
        return dotPC > 0;
    }

    // ─── Chamfer distance transform (2-pass) ───
    // mask: Uint8Array (1=pixel à traiter, 0=frontière)
    // Retourne Float32Array avec distance en pixels depuis la frontière

    function chamferDistance(mask, w, h) {
        var dist = new Float32Array(w * h);
        var INF = w + h;
        var i, y, x, d;
        for (i = 0; i < mask.length; i++) dist[i] = mask[i] ? INF : 0;
        // Forward (haut-gauche → bas-droite)
        for (y = 0; y < h; y++) {
            for (x = 0; x < w; x++) {
                i = y * w + x;
                if (dist[i] === 0) continue;
                d = dist[i];
                if (y > 0) {
                    d = Math.min(d, dist[(y - 1) * w + x] + 1);
                    if (x > 0) d = Math.min(d, dist[(y - 1) * w + (x - 1)] + 1.414);
                    if (x < w - 1) d = Math.min(d, dist[(y - 1) * w + (x + 1)] + 1.414);
                }
                if (x > 0) d = Math.min(d, dist[y * w + (x - 1)] + 1);
                dist[i] = d;
            }
        }
        // Backward (bas-droite → haut-gauche)
        for (y = h - 1; y >= 0; y--) {
            for (x = w - 1; x >= 0; x--) {
                i = y * w + x;
                if (dist[i] === 0) continue;
                d = dist[i];
                if (y < h - 1) {
                    d = Math.min(d, dist[(y + 1) * w + x] + 1);
                    if (x > 0) d = Math.min(d, dist[(y + 1) * w + (x - 1)] + 1.414);
                    if (x < w - 1) d = Math.min(d, dist[(y + 1) * w + (x + 1)] + 1.414);
                }
                if (x < w - 1) d = Math.min(d, dist[y * w + (x + 1)] + 1);
                dist[i] = d;
            }
        }
        return dist;
    }

    // ─── Génération d'une image de plaque depuis son polygone ───
    // Retourne Float32Array (w×h) avec gradient :
    //   intérieur : baseH × (0.4 … 1.0) selon distance au bord (bande large)
    //   extérieur : plateau continental 0 … baseH×0.4 dans une bande de shelfPx

    function generatePlateImage(plate, width, height) {
        var baseH = plate.height;
        var verts3D = plate.vertices.map(function (v) { return latLonToVec3(v[0], v[1]); });

        // 1. Masque binaire
        var mask = new Uint8Array(width * height);
        for (var py = 0; py < height; py++) {
            var lat = 90 - (py + 0.5) / height * 180;
            for (var px = 0; px < width; px++) {
                var lon = (px + 0.5) / width * 360 - 180;
                var p = latLonToVec3(lat, lon);
                if (pointInPolygon3D(p.x, p.y, p.z, verts3D)) {
                    mask[py * width + px] = 1;
                }
            }
        }

        // 2. Distance depuis le bord vers l'intérieur
        var insideDist = chamferDistance(mask, width, height);

        // 3. Distance depuis le bord vers l'extérieur (plateau continental)
        var inverseMask = new Uint8Array(width * height);
        for (var i = 0; i < mask.length; i++) inverseMask[i] = mask[i] ? 0 : 1;
        var outsideDist = chamferDistance(inverseMask, width, height);

        // 4. Trouver distance max intérieure pour normalisation
        var maxInside = 0;
        for (var i = 0; i < insideDist.length; i++) {
            if (insideDist[i] > maxInside && insideDist[i] < width) maxInside = insideDist[i];
        }

        // 5. Construire l'image avec gradient
        var img = new Float32Array(width * height);
        var coastWidth = Math.max(8, maxInside * 0.62);  // gradient intérieur plus étalé (~62% de la profondeur)
        var shelfPx = Math.max(6, maxInside * 0.34);     // plateau continental plus large

        for (var i = 0; i < mask.length; i++) {
            if (mask[i]) {
                // Intérieur : gradient du bord (0.4×baseH) vers le centre (1.0×baseH)
                var dNorm = Math.min(1, insideDist[i] / coastWidth);
                img[i] = baseH * (0.4 + 0.6 * dNorm);
            } else if (outsideDist[i] < shelfPx && outsideDist[i] > 0) {
                // Plateau continental : rampe de baseH×0.4 → 0
                var shelfNorm = 1 - outsideDist[i] / shelfPx;
                img[i] = baseH * 0.4 * shelfNorm;
            }
            // sinon : 0 (océan profond)
        }

        return img;
    }

    // ─── Translation simple d'une image de plaque (dLat/dLon) ───
    // dLat > 0 = nord, dLon > 0 = est. Wrap longitude, clamp latitude.

    function translatePlateImage(src, width, height, dLat, dLon) {
        if (dLat === 0 && dLon === 0) return src;
        var dst = new Float32Array(width * height);
        var dyPx = Math.round(dLat / 180 * height);
        var dxPx = Math.round(dLon / 360 * width);
        for (var py = 0; py < height; py++) {
            var srcY = py + dyPx;
            if (srcY < 0 || srcY >= height) continue;
            for (var px = 0; px < width; px++) {
                var srcX = ((px - dxPx) % width + width) % width;
                dst[py * width + px] = src[srcY * width + srcX];
            }
        }
        return dst;
    }

    function translatePlateUint8(src, width, height, dLat, dLon) {
        if (dLat === 0 && dLon === 0) return src;
        var dst = new Uint8Array(width * height);
        var dyPx = Math.round(dLat / 180 * height);
        var dxPx = Math.round(dLon / 360 * width);
        for (var py = 0; py < height; py++) {
            var srcY = py + dyPx;
            if (srcY < 0 || srcY >= height) continue;
            for (var px = 0; px < width; px++) {
                var srcX = ((px - dxPx) % width + width) % width;
                dst[py * width + px] = src[srcY * width + srcX];
            }
        }
        return dst;
    }

    function translatePoint(lat, lon, dLat, dLon) {
        var newLat = Math.max(-90, Math.min(90, lat + dLat));
        var newLon = lon + dLon;
        while (newLon > 180) newLon -= 360;
        while (newLon < -180) newLon += 360;
        return [newLat, newLon];
    }

    // ─── Rotation d'une image de plaque (Rodrigues, conservé) ───

    function rotatePlateImage(src, width, height, rotLat, rotLon, rotDeg) {
        if (rotLat === 0 && rotLon === 0 && rotDeg === 0) return src;
        var dst = new Float32Array(width * height);
        for (var py = 0; py < height; py++) {
            var lat = 90 - (py + 0.5) / height * 180;
            for (var px = 0; px < width; px++) {
                var lon = (px + 0.5) / width * 360 - 180;
                // Rotation inverse pour trouver le pixel source
                var srcLL = rotatePoint(lat, lon, rotLat, rotLon, -rotDeg);
                var srcY = (90 - srcLL[0]) / 180 * height;
                var srcX = (srcLL[1] + 180) / 360 * width;
                // Wrap longitude, clamp latitude
                srcX = ((srcX % width) + width) % width;
                srcY = Math.max(0, Math.min(height - 1, srcY));
                // Nearest neighbor
                var si = Math.floor(srcY) * width + Math.floor(srcX);
                dst[py * width + px] = src[Math.min(si, src.length - 1)];
            }
        }
        return dst;
    }

    // Même géométrie que rotatePlateImage, valeurs 0–255 (luminance texture PNG exportée)
    function rotatePlateUint8(src, width, height, rotLat, rotLon, rotDeg) {
        if (rotLat === 0 && rotLon === 0 && rotDeg === 0) return src;
        var dst = new Uint8Array(width * height);
        for (var py = 0; py < height; py++) {
            var lat = 90 - (py + 0.5) / height * 180;
            for (var px = 0; px < width; px++) {
                var lon = (px + 0.5) / width * 360 - 180;
                var srcLL = rotatePoint(lat, lon, rotLat, rotLon, -rotDeg);
                var srcY = (90 - srcLL[0]) / 180 * height;
                var srcX = (srcLL[1] + 180) / 360 * width;
                srcX = ((srcX % width) + width) % width;
                srcY = Math.max(0, Math.min(height - 1, srcY));
                var si = Math.floor(srcY) * width + Math.floor(srcX);
                dst[py * width + px] = src[Math.min(si, src.length - 1)];
            }
        }
        return dst;
    }

    // ─── Centroïde sphérique d'un polygone ───
    // vertices: [[lat,lon], ...] → {lat, lon} moyenne cartésienne → re-projetée

    function computeCentroid(vertices) {
        var sx = 0, sy = 0, sz = 0;
        for (var i = 0; i < vertices.length; i++) {
            var v = latLonToVec3(vertices[i][0], vertices[i][1]);
            sx += v.x; sy += v.y; sz += v.z;
        }
        var n = vertices.length || 1;
        var ll = vec3ToLatLon({ x: sx / n, y: sy / n, z: sz / n });
        return { lat: ll[0], lon: ll[1] };
    }

    // ─── Déplacement d'un point : great-circle centroid→cible + rotation propre ───
    // centroidFrom = {lat,lon} du centroïde original de la plaque
    // dLat, dLon = décalage souhaité (UI)
    // rotDeg = rotation propre autour du centroïde déplacé
    //
    // Méthode : une seule rotation R₁ qui envoie centroidFrom → centroidTo,
    // puis rotation R₂ autour de centroidTo d'angle rotDeg.
    // R₁ : axe = cross(vecFrom, vecTo), angle = angle entre les deux.
    // Si from≈to, R₁ = identité.

    function movePlatePoint(lat, lon, centroidFrom, dLat, dLon, rotDeg) {
        var cToLat = centroidFrom.lat + dLat;
        var cToLon = centroidFrom.lon + dLon;
        // clamp target latitude
        if (cToLat > 90) cToLat = 90;
        if (cToLat < -90) cToLat = -90;
        // wrap target longitude
        while (cToLon > 180) cToLon -= 360;
        while (cToLon < -180) cToLon += 360;

        var result = [lat, lon];

        // R₁ : great-circle from centroidFrom to centroidTo
        var vFrom = latLonToVec3(centroidFrom.lat, centroidFrom.lon);
        var vTo = latLonToVec3(cToLat, cToLon);

        // cross product = axis of rotation
        var cx = vFrom.y * vTo.z - vFrom.z * vTo.y;
        var cy = vFrom.z * vTo.x - vFrom.x * vTo.z;
        var cz = vFrom.x * vTo.y - vFrom.y * vTo.x;
        var crossLen = Math.sqrt(cx * cx + cy * cy + cz * cz);

        if (crossLen > 1e-12) {
            // angle between the two vectors
            var dot = vFrom.x * vTo.x + vFrom.y * vTo.y + vFrom.z * vTo.z;
            var angleDeg = Math.acos(Math.max(-1, Math.min(1, dot))) / DEG2RAD;
            // axis in lat/lon
            var axisLL = vec3ToLatLon({ x: cx / crossLen, y: cy / crossLen, z: cz / crossLen });
            result = rotatePoint(result[0], result[1], axisLL[0], axisLL[1], angleDeg);
        }

        // R₂ : rotation propre autour du centroïde déplacé
        if (rotDeg && rotDeg !== 0) {
            result = rotatePoint(result[0], result[1], cToLat, cToLon, rotDeg);
        }

        return result;
    }

    // ─── Déplacement d'une image Float32 entière ───

    function movePlateImage(src, width, height, centroidFrom, dLat, dLon, rotDeg) {
        if (dLat === 0 && dLon === 0 && (!rotDeg || rotDeg === 0)) return src;
        var dst = new Float32Array(width * height);
        // Précalcul du centroïde cible et de la rotation inverse
        var cToLat = Math.max(-90, Math.min(90, centroidFrom.lat + dLat));
        var cToLon = centroidFrom.lon + dLon;
        while (cToLon > 180) cToLon -= 360;
        while (cToLon < -180) cToLon += 360;

        // Axe et angle R₁ inverse (cible→source)
        var vFrom = latLonToVec3(centroidFrom.lat, centroidFrom.lon);
        var vTo = latLonToVec3(cToLat, cToLon);
        var cx = vFrom.y * vTo.z - vFrom.z * vTo.y;
        var cy = vFrom.z * vTo.x - vFrom.x * vTo.z;
        var cz = vFrom.x * vTo.y - vFrom.y * vTo.x;
        var crossLen = Math.sqrt(cx * cx + cy * cy + cz * cz);
        var hasR1 = crossLen > 1e-12;
        var r1AxisLat, r1AxisLon, r1Angle;
        if (hasR1) {
            var dot = vFrom.x * vTo.x + vFrom.y * vTo.y + vFrom.z * vTo.z;
            r1Angle = Math.acos(Math.max(-1, Math.min(1, dot))) / DEG2RAD;
            var axLL = vec3ToLatLon({ x: cx / crossLen, y: cy / crossLen, z: cz / crossLen });
            r1AxisLat = axLL[0];
            r1AxisLon = axLL[1];
        }

        for (var py = 0; py < height; py++) {
            var lat = 90 - (py + 0.5) / height * 180;
            for (var px = 0; px < width; px++) {
                var lon = (px + 0.5) / width * 360 - 180;
                // Inverse : R₂⁻¹ puis R₁⁻¹
                var pt = [lat, lon];
                if (rotDeg && rotDeg !== 0) {
                    pt = rotatePoint(pt[0], pt[1], cToLat, cToLon, -rotDeg);
                }
                if (hasR1) {
                    pt = rotatePoint(pt[0], pt[1], r1AxisLat, r1AxisLon, -r1Angle);
                }
                var srcY = (90 - pt[0]) / 180 * height;
                var srcX = (pt[1] + 180) / 360 * width;
                srcX = ((srcX % width) + width) % width;
                srcY = Math.max(0, Math.min(height - 1, srcY));
                var si = Math.floor(srcY) * width + Math.floor(srcX);
                dst[py * width + px] = src[Math.min(si, src.length - 1)];
            }
        }
        return dst;
    }

    // ─── Même chose pour Uint8 (texture luma) ───

    function movePlateUint8(src, width, height, centroidFrom, dLat, dLon, rotDeg) {
        if (dLat === 0 && dLon === 0 && (!rotDeg || rotDeg === 0)) return src;
        var dst = new Uint8Array(width * height);
        var cToLat = Math.max(-90, Math.min(90, centroidFrom.lat + dLat));
        var cToLon = centroidFrom.lon + dLon;
        while (cToLon > 180) cToLon -= 360;
        while (cToLon < -180) cToLon += 360;

        var vFrom = latLonToVec3(centroidFrom.lat, centroidFrom.lon);
        var vTo = latLonToVec3(cToLat, cToLon);
        var cx = vFrom.y * vTo.z - vFrom.z * vTo.y;
        var cy = vFrom.z * vTo.x - vFrom.x * vTo.z;
        var cz = vFrom.x * vTo.y - vFrom.y * vTo.x;
        var crossLen = Math.sqrt(cx * cx + cy * cy + cz * cz);
        var hasR1 = crossLen > 1e-12;
        var r1AxisLat, r1AxisLon, r1Angle;
        if (hasR1) {
            var dot = vFrom.x * vTo.x + vFrom.y * vTo.y + vFrom.z * vTo.z;
            r1Angle = Math.acos(Math.max(-1, Math.min(1, dot))) / DEG2RAD;
            var axLL = vec3ToLatLon({ x: cx / crossLen, y: cy / crossLen, z: cz / crossLen });
            r1AxisLat = axLL[0];
            r1AxisLon = axLL[1];
        }

        for (var py = 0; py < height; py++) {
            var lat = 90 - (py + 0.5) / height * 180;
            for (var px = 0; px < width; px++) {
                var lon = (px + 0.5) / width * 360 - 180;
                var pt = [lat, lon];
                if (rotDeg && rotDeg !== 0) {
                    pt = rotatePoint(pt[0], pt[1], cToLat, cToLon, -rotDeg);
                }
                if (hasR1) {
                    pt = rotatePoint(pt[0], pt[1], r1AxisLat, r1AxisLon, -r1Angle);
                }
                var srcY = (90 - pt[0]) / 180 * height;
                var srcX = (pt[1] + 180) / 360 * width;
                srcX = ((srcX % width) + width) % width;
                srcY = Math.max(0, Math.min(height - 1, srcY));
                var si = Math.floor(srcY) * width + Math.floor(srcX);
                dst[py * width + px] = src[Math.min(si, src.length - 1)];
            }
        }
        return dst;
    }

    // ─── Composition de toutes les plaques ───
    // plateImages: { id: Float32Array }
    // positions: { id: { dLat, dLon, rotDeg } }
    // plates: window.PLATES (pour les vertices → centroïde)
    // Retourne Float32Array (somme de toutes les plaques)

    function composePlates(plateImages, positions, width, height, plates) {
        var result = new Float32Array(width * height);
        for (var id in plateImages) {
            if (!plateImages.hasOwnProperty(id)) continue;
            var pos = positions[id] || { dLat: 0, dLon: 0, rotDeg: 0 };
            var dLat = pos.dLat || 0;
            var dLon = pos.dLon || 0;
            var rotDeg = pos.rotDeg || 0;
            var centroid = (plates && plates[id] && plates[id].vertices)
                ? computeCentroid(plates[id].vertices)
                : { lat: 0, lon: 0 };
            var rotated = movePlateImage(plateImages[id], width, height, centroid, dLat, dLon, rotDeg);
            for (var i = 0; i < result.length; i++) {
                result[i] += rotated[i];
            }
        }
        return result;
    }

    /** Délègue à texture.js — TEXTURES['⚫'] */
    function heightmapToBlackBodyPrimitive(width, height, params) {
        return window.TEXTURES['⚫'](width, height, params);
    }

    // ─── Mode texture seule (seaLevel ≤ 0) : globe = luminance du heightmap composé (PNG), sans sémantique plaques ───
    function heightmapToPngTextureOnly(heightmap, width, height) {
        var rgba = new Uint8ClampedArray(width * height * 4);
        var maxH = 0;
        var i;
        for (i = 0; i < heightmap.length; i++) if (heightmap[i] > maxH) maxH = heightmap[i];
        var inv = maxH > 1e-12 ? 1 / maxH : 0;
        for (i = 0; i < heightmap.length; i++) {
            var t = Math.min(1, Math.max(0, heightmap[i] * inv));
            var v = Math.round(t * 255);
            var pi = i * 4;
            rgba[pi] = v;
            rgba[pi + 1] = v;
            rgba[pi + 2] = v;
            rgba[pi + 3] = 255;
        }
        return rgba;
    }

    // ─── Biome : heightmap composée → RGBA ───

    function heightmapToBiome(heightmap, width, height, params) {
        params = params || {};
        var seaLevel = params.seaLevel != null ? Number(params.seaLevel) : 0.25;
        if (seaLevel <= 0) {
            if (params.blackBodyPrimitive) {
                var iceTbb = params.primitiveIceT != null
                    ? Math.max(0, Math.min(1, Number(params.primitiveIceT)))
                    : NaN;
                if (iceTbb !== iceTbb) {
                    var maRef = params.epochRefMa;
                    if (maRef != null && maRef >= 4500 && maRef <= 5000) {
                        iceTbb = (5000 - maRef) / 500;
                    } else {
                        iceTbb = 0;
                    }
                }
                return heightmapToBlackBodyPrimitive(width, height, {
                    perlinSeed: params.perlinSeed != null ? params.perlinSeed : 137,
                    primitiveIceT: iceTbb
                });
            }
            return heightmapToPngTextureOnly(heightmap, width, height);
        }
        var iceFraction = params.iceFraction != null ? params.iceFraction : 0;
        var vegetation = params.vegetation != null ? params.vegetation : 0.3;
        var isHadean = params.isHadean || false;

        var iceLatThreshold;
        if (params.iceLatThreshold != null) {
            iceLatThreshold = params.iceLatThreshold;
        } else {
            iceLatThreshold = iceFraction > 0 ? 90 - (iceFraction * 200) : 999;
        }

        var latWaveAmp = params.latWaveAmp != null ? params.latWaveAmp : 7;
        var perlinAmpDeg = params.perlinAmpDeg != null ? params.perlinAmpDeg : 11;
        var perlinScale = params.perlinScale != null ? params.perlinScale : 0.032;
        var perlinOct = params.perlinOctaves != null ? params.perlinOctaves : 3;
        var perlinSeed = params.perlinSeed != null ? params.perlinSeed : 137;
        var tropicalEdge = params.tropicalEdge != null ? params.tropicalEdge : 24;
        var aridSpan = params.aridSpan != null ? params.aridSpan : 11;
        var temperateEnd = params.temperateEnd != null ? params.temperateEnd : 54;
        var edgeBlendDeg = params.edgeBlendDeg != null ? params.edgeBlendDeg : 7;
        var climateLatNoiseMul = params.climateLatNoiseMul != null ? params.climateLatNoiseMul : 1;
        var southPoleWhiteBelowLat = params.southPoleWhiteBelowLat != null ? params.southPoleWhiteBelowLat : null;
        var northIceCapFromLat = params.northIceCapFromLat != null ? params.northIceCapFromLat : null;
        var disableSymmetricPolarIce = !!params.disableSymmetricPolarIce;
        var usePolarPlateTexture = !!params.usePolarPlateTexture;
        var polarTextureThreshold = params.polarTextureThreshold != null ? params.polarTextureThreshold : 30;
        var southPolarTextureThreshold = params.southPolarTextureThreshold != null
            ? params.southPolarTextureThreshold
            : polarTextureThreshold;
        var southPolarLatCutoff = params.southPolarLatCutoff != null ? params.southPolarLatCutoff : 0;
        var northPolarLatFloor = params.northPolarLatFloor != null ? params.northPolarLatFloor : 48;
        var northEdgeBaseLat = params.northEdgeBaseLat != null ? params.northEdgeBaseLat : 61;
        var northEdgeWarpAmp = params.northEdgeWarpAmp != null ? params.northEdgeWarpAmp : 12;
        var northPoleDiskBaseLat = params.northPoleDiskBaseLat != null ? params.northPoleDiskBaseLat : 81.2;
        var northPoleDiskFractAmp = params.northPoleDiskFractAmp != null ? params.northPoleDiskFractAmp : 1.65;
        var northPoleDiskBlendSouth = params.northPoleDiskBlendSouth != null ? params.northPoleDiskBlendSouth : 6;
        var northPoleDiskBlendNorth = params.northPoleDiskBlendNorth != null ? params.northPoleDiskBlendNorth : 1.8;
        var northPolarIceLumaStops = params.northPolarIceLumaStops;
        var northEdgeSoftBand = params.northEdgeSoftBand != null ? params.northEdgeSoftBand : 8;
        var northIceLatFadeLo = params.northIceLatFadeLo != null ? params.northIceLatFadeLo : 52;
        var northIceLatFadeHi = params.northIceLatFadeHi != null ? params.northIceLatFadeHi : 71;
        var northIceSpeckleMin = params.northIceSpeckleMin != null ? params.northIceSpeckleMin : 0.1;
        var northIceSpeckleMax = params.northIceSpeckleMax != null ? params.northIceSpeckleMax : 0.94;
        var northMoutonBandSouth = params.northMoutonBandSouth != null ? params.northMoutonBandSouth : 80.5;
        var northMoutonBandNorth = params.northMoutonBandNorth != null ? params.northMoutonBandNorth : 84.8;
        var northPoleNoMoutonLat = params.northPoleNoMoutonLat != null ? params.northPoleNoMoutonLat : 86.5;
        var northMoutonBandEdgeDeg = params.northMoutonBandEdgeDeg != null ? params.northMoutonBandEdgeDeg : 0.65;

        var mountPlateGrayPeak = params.mountPlateGrayPeak != null ? params.mountPlateGrayPeak : PLATE_GRAY_PEAK;
        var mountBlendGrayLo = params.mountBlendGrayLo != null ? params.mountBlendGrayLo : 4;
        var mountBlendGrayHi = params.mountBlendGrayHi != null ? params.mountBlendGrayHi : 2;
        var mountLandBlendLo = params.mountLandBlendLo != null ? params.mountLandBlendLo : 0.28;
        var mountLandBlendHi = params.mountLandBlendHi != null ? params.mountLandBlendHi : 0.62;
        var mountStop1 = params.mountStop1 != null ? params.mountStop1 : 0.36;
        var mountStop2 = params.mountStop2 != null ? params.mountStop2 : 0.7;
        var mg = params.mountRgbGrayGreen;
        var mountRgbGrayGreen = (mg && mg.length >= 3) ? mg : [118, 132, 122];
        var mb = params.mountRgbBrown;
        var mountRgbBrown = (mb && mb.length >= 3) ? mb : [176, 158, 136];
        var my = params.mountRgbYellowGray;
        var mountRgbYellowGray = (my && my.length >= 3) ? my : [214, 206, 172];
        var ms = params.mountRgbSnow;
        var mountRgbSnow = (ms && ms.length >= 3) ? ms : [252, 251, 255];

        var perm = TN.makePermutation512(perlinSeed);

        var rgba = new Uint8ClampedArray(width * height * 4);

        // Max hauteur pour normaliser les reliefs terrestres
        var maxH = 0;
        for (var i = 0; i < heightmap.length; i++) if (heightmap[i] > maxH) maxH = heightmap[i];
        var landRange = Math.max(0.01, maxH - seaLevel);

        function smoothstepBio(e0, e1, x) {
            var tt = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
            return tt * tt * (3 - 2 * tt);
        }

        for (var py = 0; py < height; py++) {
            var lat = 90 - (py + 0.5) / height * 180;
            for (var px = 0; px < width; px++) {
                var idx = py * width + px;
                var h = heightmap[idx];
                var pi = idx * 4;
                var r, g, b;

                if (!usePolarPlateTexture && southPoleWhiteBelowLat != null && lat < southPoleWhiteBelowLat) {
                    rgba[pi] = 252;
                    rgba[pi + 1] = 253;
                    rgba[pi + 2] = 255;
                    rgba[pi + 3] = 255;
                    continue;
                }

                if (h < seaLevel) {
                    var depth = Math.min(1, (seaLevel - h) / Math.max(0.01, seaLevel));
                    var oxS = (px + 0.5) / width * 360 - 180;
                    var onxS = oxS * perlinScale * 1.4;
                    var onyS = lat * perlinScale * 1.4;
                    // Couche 1 : grandes masses d'eau (courants, dorsales)
                    var nOc1 = TN.fbm2(onxS + 200.5, onyS + 130.3, perm, 2);
                    // Couche 2 : détail fin (surface)
                    var nOc2 = TN.fbm2(onxS * 5.5 + 310.7, onyS * 5.5 + 270.1, perm, 2);
                    var ocTex = nOc1 * 0.22 + nOc2 * 0.12;
                    r = Math.round(Math.min(255, Math.max(0, (5 + (1 - depth) * 30) * (1 + ocTex))));
                    g = Math.round(Math.min(255, Math.max(0, (20 + (1 - depth) * 60) * (1 + ocTex))));
                    b = Math.round(Math.min(255, Math.max(0, (80 + (1 - depth) * 80) * (1 + ocTex * 0.4))));
                    if (!usePolarPlateTexture && northIceCapFromLat != null && lat > northIceCapFromLat) {
                        var bIceN = smoothstepBio(northIceCapFromLat, 88, lat);
                        r = Math.round(r * (1 - bIceN) + 248 * bIceN);
                        g = Math.round(g * (1 - bIceN) + 251 * bIceN);
                        b = Math.round(b * (1 - bIceN) + 255 * bIceN);
                    }
                } else if (isHadean) {
                    var d = Math.min(1, (h - seaLevel) / landRange);
                    r = Math.round(180 + d * 75);
                    g = Math.round(60 + d * 40);
                    b = Math.round(10 + d * 10);
                } else {
                    var lon = (px + 0.5) / width * 360 - 180;
                    var lonRad = lon * DEG2RAD;
                    var latRad = lat * DEG2RAD;
                    var latW = lat + latWaveAmp * (
                        Math.sin(lonRad * 2) + 0.58 * Math.sin(lonRad * 2.4 + latRad * 1.65)
                    );
                    var nx = lon * perlinScale;
                    var ny = lat * perlinScale;
                    var n = TN.fbm2(nx + 1.7, ny - 0.9, perm, perlinOct);
                    var nEdge = TN.fbm2(nx * 1.85 + 9.2, ny * 1.4 - 3.1, perm, 2);
                    var L = Math.abs(latW) + n * perlinAmpDeg * climateLatNoiseMul;

                    // Calcul anticipé de landH pour le boost aridity intérieur
                    var landH = Math.min(1, Math.max(0, (h - seaLevel) / landRange));
                    // Continental interior (loin des côtes = plus sec) : élargit la bande aride
                    var interiorFactor = Math.max(0, (landH - 0.3) / 0.5);

                    var e1 = tropicalEdge + nEdge * 4.5;
                    var e2 = e1 + aridSpan * (1 + interiorFactor * 1.4) + nEdge * 3.2;
                    var e3 = temperateEnd + n * 3.5;
                    var blend = edgeBlendDeg + Math.abs(nEdge) * 2.2;

                    // Smoothsteps FORWARD (0→1 quand L franchit chaque seuil)
                    var fA = smoothstepBio(e1 - blend, e1 + blend, L);
                    var fT = smoothstepBio(e2 - blend, e2 + blend, L);
                    var fB = smoothstepBio(e3 - blend, e3 + blend, L);
                    // Poids partitionnés : somme = 1
                    var wTr = 1 - fA;
                    var wAr = fA * (1 - fT);
                    var wTe = fA * fT * (1 - fB);
                    var wBo = fA * fT * fB;

                    var veg = vegetation;
                    var trRgb = TB.landRgbBand('tropical', params.biomeTropicalRgb, veg);
                    var arRgb = TB.landRgbBand('arid', params.biomeAridRgb, veg);
                    var teRgb = TB.landRgbBand('temperate', params.biomeTemperateRgb, veg);
                    var boRgb = TB.landRgbBand('boreal', params.biomeBorealRgb, veg);
                    var cTr = trRgb[0];
                    var cTg = trRgb[1];
                    var cTb = trRgb[2];
                    var cAr = arRgb[0];
                    var cAg = arRgb[1];
                    var cAb = arRgb[2];
                    var cTr2 = teRgb[0];
                    var cTg2 = teRgb[1];
                    var cTb2 = teRgb[2];
                    var cBr = boRgb[0];
                    var cBg = boRgb[1];
                    var cBb = boRgb[2];

                    var r0 = wTr * cTr + wAr * cAr + wTe * cTr2 + wBo * cBr;
                    var g0 = wTr * cTg + wAr * cAg + wTe * cTg2 + wBo * cBg;
                    var b0 = wTr * cTb + wAr * cAb + wTe * cTb2 + wBo * cBb;

                    // ── Texture fine par biome (TextureBiomes / TEXTURES 🌴🏜️🌾🌲) ──
                    var texN = TB.compositeLandFineTexture(wTr, wAr, wTe, wBo, nx, ny, perm, TN.fbm2);
                    var tex = 1 + texN;
                    r0 = Math.min(255, Math.max(0, r0 * tex));
                    g0 = Math.min(255, Math.max(0, g0 * tex));
                    b0 = Math.min(255, Math.max(0, b0 * tex));

                    // PNG #888888 = 136 = PLATE_GRAY_PEAK : au-dessus = montagne (gris-vert → marron → jaune → blanc)
                    var grayEquiv;
                    if (maxH <= 1e-9) {
                        grayEquiv = PLATE_GRAY_LOW;
                    } else if (h <= maxH) {
                        grayEquiv = PLATE_GRAY_LOW + (h / maxH) * (PLATE_GRAY_PEAK - PLATE_GRAY_LOW);
                    } else {
                        var uSup = (h - maxH) / Math.max(1e-9, maxH * PLATE_GRAY_SUPER_MUL);
                        uSup = uSup > 1 ? 1 : uSup < 0 ? 0 : uSup;
                        grayEquiv = PLATE_GRAY_PEAK + uSup * (255 - PLATE_GRAY_PEAK);
                    }
                    var wGray = smoothstepBio(
                        mountPlateGrayPeak - mountBlendGrayLo,
                        mountPlateGrayPeak + mountBlendGrayHi,
                        grayEquiv
                    );
                    var wLand = smoothstepBio(mountLandBlendLo, mountLandBlendHi, landH);
                    var wMount = wGray > wLand ? wGray : wLand;
                    var mountNormGray = grayEquiv > mountPlateGrayPeak
                        ? (grayEquiv - mountPlateGrayPeak) / (255 - mountPlateGrayPeak)
                        : 0;
                    var mountNormLand = 0;
                    if (landH > mountLandBlendLo) {
                        var spanL = 1 - mountLandBlendLo;
                        mountNormLand = spanL > 0.02 ? (landH - mountLandBlendLo) / spanL : 0;
                    }
                    mountNormGray = mountNormGray > 1 ? 1 : mountNormGray < 0 ? 0 : mountNormGray;
                    mountNormLand = mountNormLand > 1 ? 1 : mountNormLand < 0 ? 0 : mountNormLand;
                    var mountNorm = mountNormGray > mountNormLand ? mountNormGray : mountNormLand;
                    var s1 = mountStop1 > 0.05 ? mountStop1 : 0.05;
                    var s2 = mountStop2 > s1 + 0.05 ? mountStop2 : s1 + 0.05;
                    var cGr = mountRgbGrayGreen[0], cGg = mountRgbGrayGreen[1], cGb = mountRgbGrayGreen[2];
                    var cBr = mountRgbBrown[0], cBg = mountRgbBrown[1], cBb = mountRgbBrown[2];
                    var cYr = mountRgbYellowGray[0], cYg = mountRgbYellowGray[1], cYb = mountRgbYellowGray[2];
                    var cSr = mountRgbSnow[0], cSg = mountRgbSnow[1], cSb = mountRgbSnow[2];
                    var rrM;
                    var ggM;
                    var bbM;
                    if (mountNorm <= s1) {
                        var uu = s1 > 0 ? mountNorm / s1 : 0;
                        rrM = cGr + (cBr - cGr) * uu;
                        ggM = cGg + (cBg - cGg) * uu;
                        bbM = cGb + (cBb - cGb) * uu;
                    } else if (mountNorm <= s2) {
                        var uu2 = (mountNorm - s1) / (s2 - s1);
                        rrM = cBr + (cYr - cBr) * uu2;
                        ggM = cBg + (cYg - cBg) * uu2;
                        bbM = cBb + (cYb - cBb) * uu2;
                    } else {
                        var uu3 = s2 < 1 ? (mountNorm - s2) / (1 - s2) : 0;
                        rrM = cYr + (cSr - cYr) * uu3;
                        ggM = cYg + (cSg - cYg) * uu3;
                        bbM = cYb + (cSb - cYb) * uu3;
                    }
                    r = r0 + wMount * (rrM - r0);
                    g = g0 + wMount * (ggM - g0);
                    b = b0 + wMount * (bbM - b0);
                    r = Math.round(Math.min(255, Math.max(0, r)));
                    g = Math.round(Math.min(255, Math.max(0, g)));
                    b = Math.round(Math.min(255, Math.max(0, b)));

                    var iceN = TN.fbm2(nx * 0.55 + 30, ny * 0.55 + 11, perm, 2) * 6;
                    var iceTh = iceLatThreshold + iceN;
                    if (!disableSymmetricPolarIce && iceLatThreshold < 500 && L > iceTh - 4) {
                        var blendI = smoothstepBio(iceTh - 4, iceTh + 14, L);
                        r = Math.round(r * (1 - blendI) + 240 * blendI);
                        g = Math.round(g * (1 - blendI) + 245 * blendI);
                        b = Math.round(b * (1 - blendI) + 255 * blendI);
                    }
                }

                if (!usePolarPlateTexture && northIceCapFromLat != null && lat > northIceCapFromLat && h >= seaLevel) {
                    var bN = smoothstepBio(northIceCapFromLat, 87, lat);
                    r = Math.round(r * (1 - bN) + 250 * bN);
                    g = Math.round(g * (1 - bN) + 252 * bN);
                    b = Math.round(b * (1 - bN) + 255 * bN);
                }

                if (usePolarPlateTexture) {
                    var lonPx = (px + 0.5) / width * 360 - 180;
                    var anL = params.anSouthLumaRot;
                    if (anL && lat < southPolarLatCutoff) {
                        if (anL[idx] >= southPolarTextureThreshold) {
                            r = 252;
                            g = 253;
                            b = 255;
                        }
                    }
                    var nLm = params.northLumaRotMax;
                    var wPlate = 0;
                    var tDisk = 0;
                    if (lat >= northPolarLatFloor && lat > 0) {
                        var latFadeNorth = smoothstepBio(northIceLatFadeLo, northIceLatFadeHi, lat);
                        var spA = 0.5 + 0.5 * TN.fbm2(lonPx * 0.086 + 18.3, lat * 0.098 - 3.7, perm, 4);
                        var spB = 0.5 + 0.5 * TN.fbm2(lonPx * 0.168 + 6.1, lat * 0.152 + 1.4, perm, 3);
                        var spC = 0.5 + 0.5 * TN.fbm2(lonPx * 0.034 - 22, lat * 0.041 + 9.2, perm, 2);
                        var speckleRaw = northIceSpeckleMin +
                            (northIceSpeckleMax - northIceSpeckleMin) * (0.38 * spA + 0.35 * spB + 0.27 * spC);
                        var wMouton = smoothstepBio(
                            northMoutonBandSouth,
                            northMoutonBandSouth + northMoutonBandEdgeDeg,
                            lat
                        ) * (1 - smoothstepBio(
                            northMoutonBandNorth - northMoutonBandEdgeDeg,
                            northMoutonBandNorth,
                            lat
                        ));
                        if (lat >= northPoleNoMoutonLat) wMouton = 0;
                        var speckleEffect = 1 + wMouton * (speckleRaw - 1);
                        var northTransparency = latFadeNorth * speckleEffect;

                        if (nLm && nLm.length === width * height) {
                            var nxf = lonPx * 0.062 + 1.8;
                            var nyf = lat * 0.078 - 0.6;
                            var wobN = TN.fbm2(nxf, nyf, perm, 3) * northEdgeWarpAmp;
                            wobN += 2.6 * Math.sin(lonPx * DEG2RAD * 2.05);
                            wobN += 1.5 * Math.sin((lonPx * 0.017 + lat * 0.031) * 2.5);
                            var edgeN = northEdgeBaseLat + wobN;
                            var edgeSoft = smoothstepBio(edgeN - northEdgeSoftBand, edgeN + northEdgeSoftBand * 0.45, lat);
                            var gvN = nLm[idx];
                            var wLuma = 0;
                            if (northPolarIceLumaStops && northPolarIceLumaStops.length >= 4) {
                                var s0 = northPolarIceLumaStops[0];
                                var s1 = northPolarIceLumaStops[1];
                                var s2 = northPolarIceLumaStops[2];
                                var s3 = northPolarIceLumaStops[3];
                                wLuma += smoothstepBio(s0, s1, gvN) * 0.38;
                                wLuma += smoothstepBio(s1, s2, gvN) * 0.34;
                                wLuma += smoothstepBio(s2, s3, gvN) * 0.28;
                                if (wLuma > 1) wLuma = 1;
                            } else {
                                var loI = params.northPolarIceLumaLo != null ? params.northPolarIceLumaLo : 34;
                                var hiI = params.northPolarIceLumaHi != null ? params.northPolarIceLumaHi : 56;
                                wLuma = smoothstepBio(loI, hiI, gvN);
                            }
                            wPlate = wLuma * edgeSoft * northTransparency;
                        }

                        if (params.northPoleDiskEnable !== false) {
                            var dfx = lonPx * 0.11 + 31.2;
                            var dfy = lat * 0.095 + 6.8;
                            var diskFr = TN.fbm2(dfx, dfy, perm, 3) * northPoleDiskFractAmp;
                            diskFr += 0.95 * TN.fbm2(lonPx * 0.22 - 8, lat * 0.2 + 2.1, perm, 2);
                            var poleBoundary = northPoleDiskBaseLat + diskFr;
                            var blendS = northPoleDiskBlendSouth;
                            var blendN = northPoleDiskBlendNorth;
                            var diskStep = smoothstepBio(
                                poleBoundary - blendS,
                                poleBoundary + blendN,
                                lat
                            );
                            var rimIn = poleBoundary - blendS * 1.12;
                            var rimOut = poleBoundary + blendN * 0.62;
                            var wDiskFract = smoothstepBio(rimIn - 1.35, rimIn + 0.55, lat) *
                                (1 - smoothstepBio(rimOut - 0.5, rimOut + 1.05, lat));
                            var speckleDisk = 1 + wDiskFract * (speckleRaw - 1);
                            tDisk = diskStep * latFadeNorth * speckleDisk;
                        }

                        var wIceTot = 1 - (1 - wPlate) * (1 - tDisk);
                        if (wIceTot > 0) {
                            r = Math.round(r * (1 - wIceTot) + 248 * wIceTot);
                            g = Math.round(g * (1 - wIceTot) + 250 * wIceTot);
                            b = Math.round(b * (1 - wIceTot) + 255 * wIceTot);
                        }
                    }
                }

                rgba[pi] = r; rgba[pi + 1] = g; rgba[pi + 2] = b; rgba[pi + 3] = 255;
            }
        }
        return rgba;
    }

    /**
     * Aperçu éditeur : bande dominante parmi les 4 climats (même L que heightmapToBiome).
     */
    function heightmapToClimateBandOverlay(heightmap, width, height, params) {
        params = params || {};
        var seaLevel = params.seaLevel != null ? Number(params.seaLevel) : 0.25;
        if (seaLevel <= 0) {
            return new Uint8ClampedArray(width * height * 4);
        }
        var vegetation = params.vegetation != null ? params.vegetation : 0.3;
        var isHadean = params.isHadean || false;
        var alpha = params.climateBandOverlayAlpha != null ? params.climateBandOverlayAlpha : 0.42;
        if (alpha < 0) alpha = 0;
        if (alpha > 1) alpha = 1;
        var aByte = Math.round(255 * alpha);

        var latWaveAmp = params.latWaveAmp != null ? params.latWaveAmp : 7;
        var perlinAmpDeg = params.perlinAmpDeg != null ? params.perlinAmpDeg : 11;
        var perlinScale = params.perlinScale != null ? params.perlinScale : 0.032;
        var perlinOct = params.perlinOctaves != null ? params.perlinOctaves : 3;
        var perlinSeed = params.perlinSeed != null ? params.perlinSeed : 137;
        var tropicalEdge = params.tropicalEdge != null ? params.tropicalEdge : 24;
        var aridSpan = params.aridSpan != null ? params.aridSpan : 11;
        var temperateEnd = params.temperateEnd != null ? params.temperateEnd : 54;
        var edgeBlendDeg = params.edgeBlendDeg != null ? params.edgeBlendDeg : 7;
        var climateLatNoiseMul = params.climateLatNoiseMul != null ? params.climateLatNoiseMul : 1;

        var perm = TN.makePermutation512(perlinSeed);
        var rgba = new Uint8ClampedArray(width * height * 4);

        function smoothstepBio(e0, e1, x) {
            var tt = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
            return tt * tt * (3 - 2 * tt);
        }

        for (var py = 0; py < height; py++) {
            var lat = 90 - (py + 0.5) / height * 180;
            for (var px = 0; px < width; px++) {
                var idx = py * width + px;
                var pi = idx * 4;
                var h = heightmap[idx];
                if (h < seaLevel || isHadean) {
                    rgba[pi + 3] = 0;
                    continue;
                }
                var lon = (px + 0.5) / width * 360 - 180;
                var lonRad = lon * DEG2RAD;
                var latRad = lat * DEG2RAD;
                var latW = lat + latWaveAmp * (
                    Math.sin(lonRad * 2) + 0.58 * Math.sin(lonRad * 2.4 + latRad * 1.65)
                );
                var nx = lon * perlinScale;
                var ny = lat * perlinScale;
                var n = TN.fbm2(nx + 1.7, ny - 0.9, perm, perlinOct);
                var nEdge = TN.fbm2(nx * 1.85 + 9.2, ny * 1.4 - 3.1, perm, 2);
                var L = Math.abs(latW) + n * perlinAmpDeg * climateLatNoiseMul;

                var e1 = tropicalEdge + nEdge * 4.5;
                var e2 = e1 + aridSpan + nEdge * 3.2;
                var e3 = temperateEnd + n * 3.5;
                var blend = edgeBlendDeg + Math.abs(nEdge) * 2.2;

                // Smoothsteps FORWARD (0→1 quand L franchit chaque seuil)
                var fA = smoothstepBio(e1 - blend, e1 + blend, L);
                var fT = smoothstepBio(e2 - blend, e2 + blend, L);
                var fB = smoothstepBio(e3 - blend, e3 + blend, L);
                var wTr = 1 - fA;
                var wAr = fA * (1 - fT);
                var wTe = fA * fT * (1 - fB);
                var wBo = fA * fT * fB;

                var veg = vegetation;
                var trRgbO = TB.landRgbBand('tropical', params.biomeTropicalRgb, veg);
                var arRgbO = TB.landRgbBand('arid', params.biomeAridRgb, veg);
                var teRgbO = TB.landRgbBand('temperate', params.biomeTemperateRgb, veg);
                var boRgbO = TB.landRgbBand('boreal', params.biomeBorealRgb, veg);
                var cTr = trRgbO[0];
                var cTg = trRgbO[1];
                var cTb = trRgbO[2];
                var cAr = arRgbO[0];
                var cAg = arRgbO[1];
                var cAb = arRgbO[2];
                var cTr2 = teRgbO[0];
                var cTg2 = teRgbO[1];
                var cTb2 = teRgbO[2];
                var cBr = boRgbO[0];
                var cBg = boRgbO[1];
                var cBb = boRgbO[2];

                var im = 0; var wm = wTr;
                if (wAr > wm) { im = 1; wm = wAr; }
                if (wTe > wm) { im = 2; wm = wTe; }
                if (wBo > wm) { im = 3; }

                if (im === 0) {
                    rgba[pi] = cTr; rgba[pi + 1] = cTg; rgba[pi + 2] = cTb;
                } else if (im === 1) {
                    rgba[pi] = cAr; rgba[pi + 1] = cAg; rgba[pi + 2] = cAb;
                } else if (im === 2) {
                    rgba[pi] = cTr2; rgba[pi + 1] = cTg2; rgba[pi + 2] = cTb2;
                } else {
                    rgba[pi] = cBr; rgba[pi + 1] = cBg; rgba[pi + 2] = cBb;
                }
                rgba[pi + 3] = aByte;
            }
        }
        return rgba;
    }

    // ─── Grayscale ───

    function heightmapToGrayscale(heightmap, width, height) {
        var rgba = new Uint8ClampedArray(width * height * 4);
        var maxH = 0;
        for (var i = 0; i < heightmap.length; i++) if (heightmap[i] > maxH) maxH = heightmap[i];
        var inv = maxH > 0 ? 1 / maxH : 0;
        for (var i = 0; i < heightmap.length; i++) {
            var t = Math.min(1, Math.max(0, heightmap[i] * inv));
            var v = Math.round(t * 255);
            rgba[i * 4] = v; rgba[i * 4 + 1] = v; rgba[i * 4 + 2] = v; rgba[i * 4 + 3] = 255;
        }
        return rgba;
    }

    // ─── PNG export/import ───

    function ctx2dRead(canvas) {
        return canvas.getContext('2d', { willReadFrequently: true });
    }

    // Convertit un Float32Array plate image en canvas grayscale (pour export PNG)
    function plateImageToCanvas(plateImage, width, height, maxH) {
        var canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        var ctx = ctx2dRead(canvas);
        var imgData = ctx.createImageData(width, height);
        var inv = maxH > 0 ? 1 / maxH : 0;
        var span = PLATE_GRAY_PEAK - PLATE_GRAY_LOW;
        var spanHi = 255 - PLATE_GRAY_PEAK;
        for (var i = 0; i < plateImage.length; i++) {
            var h = plateImage[i];
            var v;
            if (h <= maxH) {
                var t = Math.min(1, Math.max(0, h * inv));
                v = Math.round(PLATE_GRAY_LOW + t * span);
            } else {
                var extra = maxH > 0 ? (h - maxH) / (maxH * PLATE_GRAY_SUPER_MUL) : 1;
                extra = Math.min(1, Math.max(0, extra));
                v = Math.round(PLATE_GRAY_PEAK + extra * spanHi);
            }
            imgData.data[i * 4] = v;
            imgData.data[i * 4 + 1] = v;
            imgData.data[i * 4 + 2] = v;
            imgData.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas;
    }

    // Charge un canvas/image grayscale en Float32Array
    function canvasToPlateImage(canvas, maxH) {
        var ctx = ctx2dRead(canvas);
        var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        var result = new Float32Array(canvas.width * canvas.height);
        var span = PLATE_GRAY_PEAK - PLATE_GRAY_LOW;
        var spanHi = 255 - PLATE_GRAY_PEAK;
        for (var i = 0; i < result.length; i++) {
            var g = data[i * 4];
            if (g <= PLATE_GRAY_PEAK) {
                var t = span > 0 ? (g - PLATE_GRAY_LOW) / span : 0;
                t = Math.min(1, Math.max(0, t));
                result[i] = t * maxH;
            } else {
                var u = spanHi > 0 ? (g - PLATE_GRAY_PEAK) / spanHi : 1;
                u = Math.min(1, Math.max(0, u));
                result[i] = maxH * (1 + PLATE_GRAY_SUPER_MUL * u);
            }
        }
        return result;
    }

    // Charge une image (URL) → { heightmap, luma } (luma = canal R brut PNG, pour seuil texture ex. 30)
    function loadPlateImageFromURL(url, width, height, maxH) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                var ctx = ctx2dRead(canvas);
                ctx.drawImage(img, 0, 0, width, height);
                var data = ctx.getImageData(0, 0, width, height).data;
                var luma = new Uint8Array(width * height);
                var i;
                for (i = 0; i < luma.length; i++) luma[i] = data[i * 4];
                resolve({
                    heightmap: canvasToPlateImage(canvas, maxH),
                    luma: luma
                });
            };
            img.onerror = function () { reject(new Error('Cannot load ' + url)); };
            img.src = url;
        });
    }

    // ─── Antialiasing : box blur séparable sur RGBA ───
    // radius = 1 → 3x3, radius = 2 → 5x5
    // Préserve le canal alpha. Wrap longitude (X), clamp latitude (Y).

    function blurRGBA(src, width, height, radius) {
        if (!radius || radius < 1) return src;
        radius = Math.round(radius);
        var len = width * height * 4;
        var tmp = new Uint8ClampedArray(len);
        var dst = new Uint8ClampedArray(len);
        var size = 2 * radius + 1;

        // Passe horizontale : src → tmp
        for (var py = 0; py < height; py++) {
            for (var px = 0; px < width; px++) {
                var r = 0, g = 0, b = 0, a = 0;
                for (var k = -radius; k <= radius; k++) {
                    // wrap longitude
                    var sx = ((px + k) % width + width) % width;
                    var si = (py * width + sx) * 4;
                    r += src[si]; g += src[si + 1]; b += src[si + 2]; a += src[si + 3];
                }
                var di = (py * width + px) * 4;
                tmp[di]     = r / size;
                tmp[di + 1] = g / size;
                tmp[di + 2] = b / size;
                tmp[di + 3] = a / size;
            }
        }

        // Passe verticale : tmp → dst
        for (var py2 = 0; py2 < height; py2++) {
            for (var px2 = 0; px2 < width; px2++) {
                var r2 = 0, g2 = 0, b2 = 0, a2 = 0;
                for (var k2 = -radius; k2 <= radius; k2++) {
                    // clamp latitude
                    var sy = Math.max(0, Math.min(height - 1, py2 + k2));
                    var si2 = (sy * width + px2) * 4;
                    r2 += tmp[si2]; g2 += tmp[si2 + 1]; b2 += tmp[si2 + 2]; a2 += tmp[si2 + 3];
                }
                var di2 = (py2 * width + px2) * 4;
                dst[di2]     = r2 / size;
                dst[di2 + 1] = g2 / size;
                dst[di2 + 2] = b2 / size;
                dst[di2 + 3] = a2 / size;
            }
        }
        return dst;
    }

    // ─── Export ───

    window.PlateRenderer = {
        latLonToVec3: latLonToVec3,
        vec3ToLatLon: vec3ToLatLon,
        rotatePoint: rotatePoint,
        pointInPolygon3D: pointInPolygon3D,
        generatePlateImage: generatePlateImage,
        translatePlateImage: translatePlateImage,
        translatePlateUint8: translatePlateUint8,
        translatePoint: translatePoint,
        rotatePlateImage: rotatePlateImage,
        rotatePlateUint8: rotatePlateUint8,
        computeCentroid: computeCentroid,
        movePlatePoint: movePlatePoint,
        movePlateImage: movePlateImage,
        movePlateUint8: movePlateUint8,
        composePlates: composePlates,
        heightmapToBiome: heightmapToBiome,
        heightmapToPngTextureOnly: heightmapToPngTextureOnly,
        heightmapToClimateBandOverlay: heightmapToClimateBandOverlay,
        heightmapToGrayscale: heightmapToGrayscale,
        plateImageToCanvas: plateImageToCanvas,
        canvasToPlateImage: canvasToPlateImage,
        loadPlateImageFromURL: loadPlateImageFromURL,
        blurRGBA: blurRGBA
    };

})();
