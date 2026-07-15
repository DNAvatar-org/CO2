// ============================================================================
// galaxy_background.js — Fond plein écran : skysphère galaxie (carte céleste).
// ----------------------------------------------------------------------------
// Grande sphère (rayon 600) texturée sur sa face INTERNE (BackSide) avec la carte
// equirectangulaire _galaxie.jpg (2048×1024, ratio 2:1 → 0 distorsion). Sphère STATIQUE,
// inclinée de l'obliquité (~23,44°) pour orienter les pôles célestes.
//
// INTERACTION = ORBIT-CAMERA (pas de rotation de la sphère, pas d'animation autonome) :
//   la caméra tourne sur sa propre sphère (azimut ← dx, élévation ← dy) et regarde le centre.
//   Le handler de drag de la Terre (organigramme.js) appelle GALAXY_BG.orbit(dx, dy) à chaque
//   pointermove → le fond ne bouge QUE pendant le drag. L'auto-rotation de la Terre ne
//   l'appelle pas → fond figé au repos.
//
// Remplace l'ancien fond statique img/fond.png (cf. style.css body). Autonome :
// dégrade proprement (fond noir CSS) si THREE ou la texture manquent.
//
// Réglages live via window.GALAXY_BG : orbit(dx,dy), setFov(deg), setObliquity(deg),
// setDragSpeed(radParPx), reset().
// ============================================================================
(function () {
  'use strict';

  var TEX_URL = 'static/img/_galaxie.jpg';
  var SPHERE_RADIUS = 600;
  var CAM_RADIUS = 1;               // caméra ~au centre ; seule la direction compte
  var DEFAULT_FOV = 75;             // « focale » de départ
  var DEFAULT_TILT_DEG = -23.44;    // obliquité (orientation des pôles célestes)
  var DRAG_RAD_PER_PX = 0.005;      // sensibilité orbite (rad / pixel de drag)
  var EPS = 0.001;

  function start() {
    var THREE = window.THREE;
    if (!THREE) { console.warn('[galaxy-bg] THREE.js non chargé — fond noir CSS conservé.'); return; }
    var canvas = document.getElementById('galaxy-bg');
    if (!canvas) { console.warn('[galaxy-bg] <canvas id="galaxy-bg"> absent.'); return; }

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x05060a, 1);

    var scene = new THREE.Scene();

    // Caméra qui orbite le centre (angles azimut/élévation ← dx/dy) et regarde (0,0,0).
    var camera = new THREE.PerspectiveCamera(DEFAULT_FOV, window.innerWidth / window.innerHeight, 0.1, 2000);
    var azimuth = 0;            // ← dx
    var polar = Math.PI / 2;   // ← dy (π/2 = équateur, regard horizontal au départ)
    var dragSpeed = DRAG_RAD_PER_PX;

    function placeCamera() {
      var sp = Math.sin(polar), cp = Math.cos(polar);
      camera.position.set(CAM_RADIUS * sp * Math.sin(azimuth), CAM_RADIUS * cp, CAM_RADIUS * sp * Math.cos(azimuth));
      camera.lookAt(0, 0, 0);
    }

    // Grande sphère statique, texture sur la face INTERNE (BackSide), inclinée de l'obliquité.
    var texUrl = new URL(TEX_URL, document.baseURI).href;
    var texture = new THREE.TextureLoader().load(
      texUrl,
      function () { render(); },
      undefined,
      function () { console.warn('[galaxy-bg] texture introuvable : ' + texUrl); }
    );
    if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    else if ('encoding' in texture && THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;

    var geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 64, 40);
    var material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
    var sphere = new THREE.Mesh(geometry, material);
    sphere.rotation.x = DEFAULT_TILT_DEG * Math.PI / 180; // pôles célestes ↔ axe incliné
    scene.add(sphere);

    function render() { renderer.render(scene, camera); }

    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    }

    placeCamera();
    resize();
    window.addEventListener('resize', resize);
    render();

    // API — orbit() appelé par le drag Terre (organigramme.js) ; réglages en console.
    window.GALAXY_BG = {
      // Orbite la caméra depuis les deltas du drag (dx horizontal → azimut, dy vertical → élévation).
      orbit: function (dx, dy) {
        azimuth -= dx * dragSpeed;
        polar -= dy * dragSpeed;
        if (polar < EPS) polar = EPS; else if (polar > Math.PI - EPS) polar = Math.PI - EPS;
        placeCamera();
        render();
      },
      setDragSpeed: function (v) { dragSpeed = v; },
      setFov: function (deg) { camera.fov = deg; camera.updateProjectionMatrix(); render(); },
      setObliquity: function (deg) { sphere.rotation.x = deg * Math.PI / 180; render(); },
      reset: function () { azimuth = 0; polar = Math.PI / 2; placeCamera(); render(); },
      camera: camera, sphere: sphere, renderer: renderer
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
