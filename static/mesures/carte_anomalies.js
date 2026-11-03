// File: CO2/static/mesures/carte_anomalies.js
// Desc: Carte des anomalies de température MESURÉES (window.HADCRUT5, anomalies_hadcrut5.js) en texture de globe :
//       équirectangulaire, longitude −180° à gauche, nord en haut, comme les cartes de la Terre ISS. Une case de 5° = un aplat
//       de sa classe de couleur, sans lissage (la case est la donnée) ; une case sans donnée, la Terre en gris assombri. Cette
//       couche est posée sur la Terre de l'an 2000 avec l'opacité choisie (0 : la Terre seule, 1 : les mesures seules).
// Version 1.0.0
// Date: [November 03, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
(function () {
    'use strict';
    const H = window.HADCRUT5;
    const N = H.nLat * H.nLon;
    // Les deux versions, décodées une fois : int8 en crans de H.pas, H.absent = sans donnée.
    const GRILLES = {
        analyse: Int8Array.from(atob(H.analyse), (c) => c.charCodeAt(0)),
        mesure: Int8Array.from(atob(H.mesure), (c) => c.charCodeAt(0))
    };
    // Classes [°C] : bornes à pas croissants (les petits écarts restent lisibles, les grands saturent) ; palette divergente
    // RdBu de ColorBrewer à 11 classes, du bleu (plus froid que 1961–1990) au rouge (plus chaud).
    const BORNES = [-4, -2, -1, -0.5, -0.2, 0.2, 0.5, 1, 2, 4];
    const COULEURS = ['#053061', '#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582', '#d6604d', '#b2182b', '#67001f'];
    const RVB = COULEURS.map((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
    const classe = (v) => BORNES.filter((b) => v >= b).length;

    // Texture : 20 px par case.
    const LARGEUR = 1440, HAUTEUR = 720;
    const PX_CASE = LARGEUR / H.nLon;
    const VIDE = 0.55;   // une case sans donnée : la Terre en gris assombri, pour que la glace ne passe pas pour un écart nul
    const QUALITE_JPEG = 0.92;
    const AN_GEOGRAPHIE = 2000;   // la Terre sous les mesures : la texture de l'an 2000 (fonds/, configOrganigramme.js)
    const toile = document.createElement('canvas');
    toile.width = LARGEUR; toile.height = HAUTEUR;
    const ctx = toile.getContext('2d', { willReadFrequently: true });
    // La Terre de l'an 2000 aux pixels de la texture (RVBA) : posée quand l'image est chargée (même site, le canevas reste
    // lisible).
    let terre = null;
    const fond = new Image();
    fond.onload = () => {
        ctx.drawImage(fond, 0, 0, LARGEUR, HAUTEUR);
        terre = ctx.getImageData(0, 0, LARGEUR, HAUTEUR).data;
    };
    fond.src = fondsTexturePathFromSignedYear(AN_GEOGRAPHIE);

    /** Latitude du centre de la rangée j [°], du sud au nord. */
    const latitude = (j) => -90 + (j + 0.5) * 180 / H.nLat;

    /** Anomalie de l'année par case [°C] (NaN : sans donnée), part de la surface de la Terre renseignée, et moyenne des cases
     *  renseignées pondérée par leur surface (cos φ) — pas la moyenne mondiale publiée, qui compte aussi les cases vides. */
    function champ(version, an) {
        const g = GRILLES[version], valeurs = new Float32Array(N);
        let surface = 0, couverte = 0, somme = 0;
        for (let k = 0; k < N; k++) {
            const q = g[(an - H.an0) * N + k], poids = Math.cos(latitude(Math.floor(k / H.nLon)) * Math.PI / 180);
            surface += poids;
            valeurs[k] = q === H.absent ? NaN : q * H.pas;
            if (q !== H.absent) { couverte += poids; somme += poids * valeurs[k]; }
        }
        return { valeurs: valeurs, couverture: couverte / surface, moyenne: somme / couverte };
    }

    /** La texture d'un champ posé sur la Terre avec l'opacité donnée (0 à 1), en data: URI JPEG (lue par THREE.TextureLoader
     *  de la page ISS). */
    function texture(c, opacite) {
        const image = ctx.createImageData(LARGEUR, HAUTEUR), p = image.data;
        const couleurCase = Array.from(c.valeurs, (v) => (Number.isNaN(v) ? null : RVB[classe(v)]));   // null : sans donnée
        for (let y = 0; y < HAUTEUR; y++) {
            const rangee = (H.nLat - 1 - Math.floor(y / PX_CASE)) * H.nLon;
            for (let x = 0; x < LARGEUR; x++) {
                const i = 4 * (y * LARGEUR + x), rvb = couleurCase[rangee + Math.floor(x / PX_CASE)];
                const gris = VIDE * (0.2126 * terre[i] + 0.7152 * terre[i + 1] + 0.0722 * terre[i + 2]);
                for (let canal = 0; canal < 3; canal++) {
                    p[i + canal] = opacite * (rvb === null ? gris : rvb[canal]) + (1 - opacite) * terre[i + canal];
                }
                p[i + 3] = 255;
            }
        }
        ctx.putImageData(image, 0, 0);
        return toile.toDataURL('image/jpeg', QUALITE_JPEG);
    }

    window.CARTE_ANOMALIES = { BORNES: BORNES, COULEURS: COULEURS, champ: champ, texture: texture };
})();
