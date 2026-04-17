// File: organigramme/organigramme.js - Génération automatique du diagramme de flux énergétique
// Desc: Module JavaScript pour créer automatiquement un diagramme de flux énergétique à partir d'un graphe (nœuds et arcs)
// Version 1.0.69
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// Logs: v1.0.71 createCell : gridItem appendé seulement si children.length > 0 (coins + centre vides jamais créés)
// Logs: v1.0.70 mountOrganigramDomSlots : slotMinWidth sur el (#timeline-events-logos), pas sur shell — shell taille naturelle, logos overflow:visible
// Logs: v1.0.69 domSlot coque : centre hauteur ~slotEventLogoPx (côtés élargis si slotMinWidth) ; ACTION/SKIP = organigram-config-heading ; pas buttonData sur titres ; syncFluxLabelPlainMetric exempte ce heading
// Logs: v1.0.68 domSlot timeline-events-logos : coque flux-cell 3×3 (#cell-timeline-scenario-logos) ; retrait #timeline-action-block ; transform centrage comme createCell
// Logs: v1.0.67 createCell : updateLabelClasses sur span logo { text, dataId } (ex. SKIP plot_anim_skip)
// Logs: v1.0.66 fine_tuning_cloud_bary fallback innerHTML : même grille 2 colonnes que main.js (🔺🌡️🔻. + jauge | 🧩 . + %)
// Logs: v1.0.26 albedo: \\bar{A} dans le footer (entre tasse et speech), plus dans [1,1]
// Logs: v1.0.27 animate(): retrait auto-resume FPS (ne pas écraser threeJSAnimationPaused=true géré par main.js)
// Logs: v1.0.28 fin chargement Three.js : IO_LISTENER.emit('three:ready', { hasTexture, canvas }) après texture load ou erreur
// Logs: v1.0.29 Terre : drag souris (rotation), inertie au release (vitesse), smooth barycentre vers rotation par défaut
// Logs: v1.0.30 Drag Terre désactivé (pointerEvents=none), logs [texture] chargement lancé/OK/erreur
// Logs: v1.0.31 updatePlanetTextureFromDate : pause Three.js avant load texture ; play au compute:done (loader_panels)
// Logs: v1.0.32 albedoBreakdown : figé pendant cycleCalcul/cycleAlbedo/cycleH2O, mis à jour uniquement à ProcessFinished (cohérence badge vs détail)
// Logs: v1.0.33 getFineTuningDetailAlt exposé sur window (badge nuages dans organigram-config-wrap)
// Logs: v1.0.34 fine_tuning_cloud_bary : 🧩 ligne + 🔺%🔻 ; panneau alt détaillé après 2s en haut-droite du badge
// Logs: v1.0.35 pas de panneau si alt détail = tooltip court ; panneau fixed body + reposition scroll/resize
// Logs: v1.0.36 badge 🧩 : retour au système central tooltips.js (court + alt après 2s), sans 3e panneau custom
// Logs: v1.0.37 fine_tuning_cloud_bary : tooltip court explicite (instantané %) + détail multi-lignes lisible
// Logs: v1.0.38 badge 🧩 en 2 lignes compactes (🔺🧩🔻 / %), mini-slider intégré pour réglage visu_
// Logs: v1.0.39 tooltip instantané simplifié : "Flou scientifique" (le détail reste uniquement dans l'alt déplié)
// Logs: v1.0.40 fine_tuning_cloud_bary : mise à jour douce (pct + slider) sans innerHTML si mini-slider déjà présent
// Logs: v1.0.41 Three.js planet : logs pointerdown/pointermove/pointerup sur le container (pour debug drag futur)
// Logs: v1.0.42 bouton époque 📱 (image) : alt accessibilité = "2000"
// Logs: v1.0.43 flux-label-plain-metric + updateLabelClasses sur grille ; toggle OBSERVATIONS (hide-organigram-observation-metrics) dans main.js
// Logs: v1.0.44 timeline hidden epoch rendered as epoch-text (date-like font/height), not epoch-btn
// Logs: v1.0.45 updateFluxLabels: fallback epoch resolve for hidden epochs (avoid null.total_atmosphere_mass_kg)
// Logs: v1.0.46 updateFluxLabels: albedoCoeff fallback epoch resolve for hidden epochs (avoid null['🪩🍰'])
// Logs: v1.0.47 updateFluxLabels: define logAlbedoUi helper (fix ReferenceError)
// Logs: v1.0.48 🗺 credits-paleomap : clic sur le cercle ouvre dlg-credits (pas toggle / runCompute comme les boutons EDS)
// Logs: v1.0.49 détail albédo : 🎾 + libellé lave (surface) ; ligne ⚽ 🍰⚽ voile SW stratosphérique
// Logs: v1.0.50 DATA/CONST 🍰🪩🎾 🪩🍰🎾 (ex-🍰🪩🌋 / 🪩🍰🌋) pour cohérence clés lave
// Logs: v1.0.51 détail voile : lecture 🍰🪩⚽ (fallback 🍰⚽), titre 🍰🪩⚽
// Logs: v1.0.52 voile : 🍰⚽ = obstruction (affichage %) ; 🍰🪩⚽ = 1−🍰⚽
// Logs: v1.0.53 updateFluxLabels : pdTrace au lieu de pd (plus de ❌ factice sur traces UI)
// Logs: v1.0.54 Terre Three.js : inclinaison par défaut ≈ obliquité actuelle −23,44° (ex −53°) si savedPlanetTiltAngle absent
// Logs: v1.0.55 var nodes/arcs avant calculatePositions ; nœuds type domSlot (montage #timeline-events-logos + #plot-anim-toggle dans le flux)
// Logs: v1.0.56 organigramNodes/organigramArcs + cfgNodes/cfgArcs dans calculatePositions (fix Identifier nodes already declared) ; pas de remplacement sur .nodes.find
// Logs: v1.0.57 retrait branche domSlot — logos + 🎞 statiques dans visu_radiatif (.title-scenario-row)
// Logs: v1.0.58 domSlot timeline-scenario-logos : mountOrganigramDomSlots (crée #timeline-events-logos, parent depuis config appendParentSelector)
// Logs: v1.0.59 mountOrganigramDomSlots : domTag/domClass/domAttrs/domInnerHTML/domOnclick ; nœud timeline-scenario-anim (plot-anim-toggle, hors visu_radiatif)
// Logs: v1.0.65 🎞 SKIP + clignotement + id #plot-anim-toggle ; domSlot logos dans #timeline-action-block + titre ACTION
// Logs: v1.0.64 runRadiationOpeningAnimation :1er rAF avant t0 pour laisser le navigateur peindre angleInit (lerp ne démarre qu’au frame suivant)
// Logs: v1.0.63 radiation : angleInit / angleFinal / radius (alias maxRadius) + angleAnimMs ; openingAngle reste synonyme de angleFinal si angleFinal absent
// Logs: v1.0.62 createCell : logoScale sur span raster (charsImages / chemin img) ; logoOffsetY en px CSS pour raster, × logoScale pour emoji
// Logs: v1.0.61 mountOrganigramDomSlots : slotEventLogoPx → CSS --slot-event-logo-px (taille tuiles .timeline-event-logo sous #mountId)
// Logs: v1.0.60 mountOrganigramDomSlots : x/y/zIndex/slotMinWidth appliqués directement sur l'élément (pas de wrapper) ; domSlots dans #flux-diagram

// ============================================================================
// PICTO (boutons) vs TEXTURES Three.js - Objets distincts
// ============================================================================
// - Pictos : window.charsImages (alphabet.js) → logos des boutons (ex: corps_noir.png)
// - Textures : chemin déduit de la date via getPlanetTexturePathFromEpoch(▶, infoTimeMa) ; liste préload : configOrganigramme.TEXTURES_THREEJS
// planetEffect=true → texture (Three.js) ; planetEffect=false → picto (charsImages)

// Pas de const DATA/TIMELINE ici (évite redeclaration avec main.js) — utiliser window.DATA / window.TIMELINE

// Variables globales pour l'état des boutons (sélectionnés par défaut)
if (typeof window !== "undefined") {
  // 🔒 VARIABLES GLOBALES UNIQUES : Seule référence pour l'état des boutons EDS
  // Ces variables sont mises à jour UNIQUEMENT au clic sur les boutons
  // Elles sont utilisées dans TOUS les calculs et logs
  window.isCO2_eds = true;
  window.isCH4_eds = true;
  window.isH2O_eds = true;
  window.isAlbedo = true;

  // Source unique UI : CONFIG_COMPUTE pour la précision, window.DATA['🔘']['🔘🎞'] pour l'animation.
  window.CONFIG_COMPUTE.convergencePrecisionK = 0.1;

  // Variables legacy (à supprimer progressivement, gardées pour compatibilité temporaire)
  window.useCO2 = true;
  window.useCH4 = true;
  window.useH2O = true;
  window.useAlbedo = true;
  // Variable globale pour contrôler l'animation Three.js (false = animée, true = pause)
  window.threeJSAnimationPaused = false;

  // 🔒 Version de secours de interpretConfigValue (sera remplacée par celle de main.js si elle existe)
  // Cette fonction est nécessaire car organigramme.js est chargé avant main.js
  if (typeof window.interpretConfigValue === "undefined") {
    window.interpretConfigValue = function (value) {
      // Pas besoin d'interprétation pour les nombres
      if (typeof value === "number") {
        return value;
      }

      // Retourner tel quel si ce n'est pas une chaîne
      if (typeof value !== "string") {
        return value;
      }

      // Si pas de placeholder, retourner tel quel
      if (!value.includes("{$") && !value.includes("$ticTime")) {
        return value;
      }

      // ticTime = infoTimeMa / stepMa — stepMa lu directement depuis la config du bouton cliqué
      // Exception init : 🔘🕰 = '' avant le premier clic → ticTime = 0
      let ticTime = 0;
      if (window.DATA['📜']['🔘🕰'] !== '') {
          const _epochId_org = window.DATA['📜']['🗿'];
          const _epoch_org = window.TIMELINE[window.TIMELINE.findIndex(item => item['📅'] === _epochId_org)];
          const stepMa = _epoch_org['🕰'][window.DATA['📜']['🔘🕰']]['🔺⏳'];
          ticTime = Math.floor(window.infoTimeMa / stepMa);
      }

      // Détecter si c'est un chemin d'image (pour arrondir automatiquement les résultats)
      const isImagePath = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(value);

      // Gérer les expressions entre accolades {expression}
      let interpreted = value;
      const expressionPattern = /\{([^}]+)\}/g;
      const matches = [...value.matchAll(expressionPattern)];

      // Traiter chaque expression trouvée
      for (const match of matches) {
        const fullMatch = match[0]; // {expression}
        const expression = match[1]; // expression (sans les accolades)

        // Remplacer $ticTime dans l'expression
        let exprWithValue = expression.replace(
          /\$ticTime/g,
          ticTime.toString(),
        );

        try {
          // Évaluer l'expression avec eval (plus simple et direct)
          const result = eval(exprWithValue);

          if (
            typeof result === "number" &&
            !isNaN(result) &&
            isFinite(result)
          ) {
            // Pour les chemins d'image, arrondir automatiquement le résultat
            // Pour les autres cas (lightDistance, etc.), garder la précision
            const finalResult = isImagePath ? Math.round(result) : result;
            interpreted = interpreted.replace(
              fullMatch,
              finalResult.toString(),
            );
          }
        } catch (e) {
          // En cas d'erreur, remplacer simplement $ticTime
          const fallback = exprWithValue;
          interpreted = interpreted.replace(fullMatch, fallback);
        }
      }

      // Si pas d'expressions entre accolades, remplacer simplement {$ticTime}
      if (!matches.length) {
        interpreted = value.replace(/\{\$ticTime\}/g, ticTime.toString());
      }

      // Si c'est une expression mathématique pure (pas un chemin d'image), évaluer le résultat final
      if (!isImagePath && matches.length > 0) {
        const mathExpressionPattern = /^[\d\s+\-*/().]+$/;
        if (mathExpressionPattern.test(interpreted.trim())) {
          try {
            const result = eval(interpreted.trim());
            if (
              typeof result === "number" &&
              !isNaN(result) &&
              isFinite(result)
            ) {
              return result;
            }
          } catch (e) {
            // Ignorer l'erreur, retourner la chaîne interprétée
          }
        }
      }

      return interpreted;
    };
    // Log supprimé (non essentiel)
  }
}

// Fonction pour ajouter un tooltip personnalisé avec délai de 0.5s
// 🔒 Utiliser le système centralisé de tooltips (tooltips.js)
function addCustomTooltip(element, text) {
  // Déléguer à la fonction centralisée
  if (
    typeof window !== "undefined" &&
    typeof window.addTooltip === "function"
  ) {
    window.addTooltip(element, text);
  } else {
    // Fallback si tooltips.js n'est pas encore chargé
    console.warn(
      "[organigramme.js] tooltips.js non chargé, tooltip non affiché",
    );
  }
}

// Fonction pour mettre à jour le tooltip d'un bouton selon son état
function updateButtonTooltip(cell, circleBg) {
  if (!cell || !circleBg) return;

  const cellId = cell.id;
  let nodeId = null;
  let baseName = null;

  // Déterminer le nodeId et le nom de base
  if (cellId === "cell-co2") {
    nodeId = "co2";
    baseName = "CO2";
  } else if (cellId === "cell-methane") {
    nodeId = "methane";
    baseName = "CH4";
  } else if (cellId === "cell-h2o") {
    nodeId = "h2o";
    baseName = "H2O";
  } else if (cellId === "cell-albedo-btn") {
    nodeId = "albedo-btn";
    baseName = "Albedo";
  }

  if (!nodeId || !baseName) return;

  // Noms molécules en indice (CO₂, CH₄, H₂O) pour l’alt — display-only, juste le nom
  const baseNameHtml = baseName === "CO2" ? "CO<sub>2</sub>" : baseName === "CH4" ? "CH<sub>4</sub>" : baseName === "H2O" ? "H<sub>2</sub>O" : baseName;
  const tooltipText = baseNameHtml;

  // aria-label en texte brut (sans HTML) pour lecteurs d’écran ; data-tooltip avec indices pour l’affichage
  const altText = tooltipText.replace(/<br\s*\/?>/gi, " ").replace(/<sub>|<\/sub>/gi, "");
  circleBg.setAttribute("aria-label", altText);
  circleBg.setAttribute("data-tooltip", tooltipText);
}

// Fonction pour créer un rectangle avec des facteurs
function createRectangle(
  cell,
  width,
  height,
  factors,
  fillColor,
  strokeColor,
  fillImage = null,
  strokeSize = 4,
  strokeStyle = "solid",
) {
  // Le rectangle est positionné dans la zone centrale de la grille (comme le cercle)
  // Centre de la colonne centrale = 130px, centre de la ligne centrale = variable selon hauteur
  const rect = document.createElement("div");
  rect.className = "flux-rectangle";
  rect.style.width = width + "px";
  rect.style.height = height + "px";
  // Positionner dans la zone centrale de la grille (col 1, row 1)
  // Le rectangle doit frôler "Equilibre" en bas, donc le placer plus bas dans la zone centrale
  rect.style.left = "130px"; // Centre de la colonne centrale
  // Positionner le rectangle pour que son bas frôle "Equilibre" (txt1 en bas de la grille)
  // La zone centrale fait 200px, on place le rectangle pour qu'il descende jusqu'en bas
  rect.style.top = "calc(25px + 200px - " + height / 2 + "px)"; // Positionné pour frôler le bas
  rect.style.transform = "translate(-50%, -50%)";

  // Gérer fillImage (logo remplissant l'espace) ou fillColor
  if (fillImage) {
    // Utiliser un logo qui remplit l'espace directement dans le div
    rect.style.backgroundColor = fillColor || "transparent";
    rect.style.position = "relative";
    rect.style.overflow = "hidden";

    // Créer un élément pour le logo qui remplit tout l'espace
    const logoBg = document.createElement("div");
    logoBg.style.position = "absolute";
    logoBg.style.top = "0";
    logoBg.style.left = "0";
    logoBg.style.width = "100%";
    logoBg.style.height = "100%";
    logoBg.style.display = "flex";
    logoBg.style.alignItems = "center";
    logoBg.style.justifyContent = "center";
    logoBg.style.zIndex = Z_NODE_INTERNAL.LOGO;
    // Utiliser la plus grande dimension pour calculer une taille qui remplit vraiment l'espace
    const maxDimension = Math.max(width, height);
    const fontSize = maxDimension * 1.5; // Assez grand pour remplir tout l'espace
    logoBg.style.fontSize = fontSize + "px";
    logoBg.style.lineHeight = "1";
    logoBg.textContent = fillImage;
    // Appliquer les polices emoji standard aux logos
    logoBg.style.fontFamily =
      "'Apple Color Emoji', 'Noto Color Emoji', 'EmojiFont', 'Segoe UI Emoji', sans-serif";
    rect.appendChild(logoBg);
  } else {
    // Couleur unie
    rect.style.backgroundColor = fillColor;
  }

  // Ne pas mettre de bordure si strokeColor est vide
  if (strokeColor && strokeColor.trim() !== "") {
    if (strokeStyle === "blur") {
      // Effet de bordure floue avec box-shadow
      rect.style.border = "none";
      const blurRadius = Math.max(strokeSize * 2, 4); // Rayon de flou proportionnel à l'épaisseur
      rect.style.boxShadow = `0 0 ${blurRadius}px ${strokeSize}px ${strokeColor}`;
    } else {
      // Bordure solide classique
      rect.style.borderColor = strokeColor;
      rect.style.borderWidth = strokeSize + "px";
      rect.style.borderStyle = strokeStyle || "solid";
      rect.style.boxShadow = "none"; // S'assurer qu'il n'y a pas de box-shadow si ce n'est pas blur
    }
  } else {
    rect.style.border = "none";
  }
  rect.style.position = "absolute";
  rect.style.zIndex = Z_LAYERS.NODE; // Même z-index que le cercle

  // Les facteurs sont créés par integrateEds.js qui remplace le contenu du rectangle
  // Code mort supprimé - les facteurs viennent de .synthese_EdS dans index.html

  cell.appendChild(rect);
  return rect;
}

// Fonction helper pour extraire le texte d'un label (string ou objet { text, dataId })
function getLabelText(label) {
  if (!label) return "";
  if (typeof label === "string") return label;
  if (typeof label === "object" && label.text) return label.text;
  return String(label);
}

// Fonction helper pour obtenir le dataId d'un label (si c'est un objet)
function getLabelDataId(label) {
  if (!label || typeof label !== "object") return null;
  return label.dataId || null;
}

// Fonction helper pour déterminer si une étiquette doit être grise
// (valeur à 0 ou bouton inactif)
function shouldLabelBeGray(text, nodeId, cell = null) {
  if (!text) return false;
  // Extraire le texte si c'est un objet
  const textStr = getLabelText(text);

  // Cas spécial : label albedo (contient "Albédo:" et des emojis ⛅ et ❄️)
  if (
    textStr.includes("Albédo:") &&
    (textStr.includes("⛅") || textStr.includes("❄️"))
  ) {
    // Extraire les valeurs de nuages et glace
    const cloudMatch = textStr.match(/⛅(\d+)%/);
    const iceMatch = textStr.match(/❄️(\d+)%/);

    const cloudPercent = cloudMatch ? parseInt(cloudMatch[1]) : 0;
    const icePercent = iceMatch ? parseInt(iceMatch[1]) : 0;

    // Si les deux valeurs sont à 0%, mettre en gris
    if (cloudPercent === 0 && icePercent === 0) {
      return true;
    }

    // Si le bouton albedo est désactivé (pas de classe checked), mettre en gris
    const albedoButton = document.getElementById("albedo-btn");
    if (albedoButton && !albedoButton.classList.contains("checked")) {
      return true;
    }

    // Vérifier aussi la cellule créée
    const albedoCell = createdCells["albedo-btn"];
    if (albedoCell && !albedoCell.classList.contains("checked")) {
      return true;
    }
  }

  // Vérifier si le texte contient une unité connue (W/m², %, ppm, W, K)
  // Note: " W" avec espace pour éviter de matcher des mots contenant W
  const hasUnit =
    textStr.includes("W/m²") ||
    textStr.includes("W/m2") ||
    textStr.includes("%") ||
    textStr.includes("ppm") ||
    textStr.includes(" W") ||
    textStr.includes(" K");

  if (!hasUnit) return false;

  // Vérifier si c'est un bouton inactif
  if (nodeId) {
    const node = organigramNodes.find((n) => n.id === nodeId);
    if (node && node.type === "button") {
      // Vérifier si la cellule a la classe 'checked' (bouton actif)
      if (cell) {
        if (!cell.classList.contains("checked")) {
          return true; // Bouton inactif
        }
      } else {
        // Si pas de cellule, chercher la cellule créée ou le bouton HTML
        const createdCell = createdCells[nodeId];
        if (createdCell) {
          if (!createdCell.classList.contains("checked")) {
            return true; // Bouton inactif
          }
        } else {
          // Vérifier le bouton HTML original
          const originalButton = document.getElementById(nodeId);
          if (originalButton && !originalButton.classList.contains("checked")) {
            return true; // Bouton inactif
          }
        }
      }
    }
  }

  return false;
}

/** Libellés « verts » (base) — masquables par toggle OBSERVATIONS (main.js). O(n) sur le nœud label. */
function syncFluxLabelPlainMetric(label) {
  if (!label) return;
  label.classList.remove("flux-label-plain-metric");
  if (label.classList.contains("organigram-config-heading")) return;
  if (label.getAttribute("data-id") === "albedo_percents") return;
  if (
    !label.classList.contains("watt-per-m2") &&
    !label.classList.contains("watt-or-kelvin") &&
    !label.classList.contains("zero-value") &&
    !label.classList.contains("percent-label") &&
    !label.classList.contains("ppm-label") &&
    !label.classList.contains("co2-label") &&
    !label.classList.contains("buttonData")
  ) {
    label.classList.add("flux-label-plain-metric");
  }
}

// Fonction pour mettre à jour les classes CSS d'un label après modification dynamique
function updateLabelClasses(label, nodeId = null) {
  if (!label) return;

  // Exception : albedo_percents (breakdown détaillé) ne doit jamais être grisé
  if (label.getAttribute("data-id") === "albedo_percents") {
    label.classList.remove("zero-value");
    syncFluxLabelPlainMetric(label);
    return;
  }

  const text = label.innerHTML || label.textContent || "";

  // Retirer les classes existantes
  label.classList.remove(
    "watt-per-m2",
    "watt-or-kelvin",
    "zero-value",
    "percent-label",
    "ppm-label",
    "flux-label-plain-metric",
  );

  // Vérifier si le bouton est inactif (gris uniquement dans ce cas)
  if (shouldLabelBeGray(text)) {
    label.classList.add("zero-value");
    syncFluxLabelPlainMetric(label);
    return;
  }

  // Si le texte contient W/m² ou W/m2, appliquer la classe orange
  // PRIORITÉ : Vérifier d'abord W/m²
  if (text && (text.includes("W/m²") || text.includes("W/m2"))) {
    // Toujours appliquer la couleur orange pour W/m² (plus de gris automatique)
    label.classList.add("watt-per-m2");
  }
  // Si le texte contient " W" ou " K" (avec espace avant), appliquer la classe rouge
  else if (text && (text.includes(" W") || text.includes(" K"))) {
    label.classList.add("watt-or-kelvin");
  }
  // MW (ex. « 1.2 MW » sans « W » seul) — même style que W/K
  else if (text && text.includes("MW")) {
    label.classList.add("watt-or-kelvin");
  }
  // Les couleurs seront appliquées dynamiquement par updateFluxLabels selon l'état des boutons
  syncFluxLabelPlainMetric(label);
}

/** Chemin texture planète depuis époque + temps écoulé. Ex. Protérozoïque -2500 Ma +100 Ma → -2400 Ma → fonds/02400Ma.png ; 1800+100 ans → fonds/001900a.png */
function getPlanetTexturePathFromEpoch(startYears, infoTimeMa) {
  const infoMa = Number(infoTimeMa) || 0;
  if (startYears >= 1e6) {
    const currentMa = -startYears / 1e6 + infoMa;
    const absMa = Math.round(Math.abs(currentMa));
    const padded = String(absMa).padStart(5, "0");
    return "fonds/" + padded + "Ma.png";
  }
  const currentYear = Math.round(startYears + infoMa * 1e6);
  const padded = String(currentYear).padStart(6, "0");
  return "fonds/" + padded + "a.png";
}

// Fonction pour créer une cellule avec un tableau 3x3
// Fonction pour initialiser Three.js pour l'effet planète
// logoPath = texture fonds/*.png déduite de la date (getPlanetTexturePathFromEpoch) - JAMAIS charsImages !
function initPlanetThreeJS(
  canvas,
  logoPath,
  planetSize,
  container,
  radius,
  logoScale,
  luxSaturation = 1.0,
  lightDistance = null,
) {
  if (typeof THREE === "undefined") {
    console.error("[initPlanetThreeJS] ❌ Three.js non chargé !");
    return;
  }
  const IO_LISTENER = window.IO_LISTENER;
  IO_LISTENER.emit("three:runStart", { canvas: canvas });

  const width = planetSize;
  const height = planetSize;

  // Stocker les références dans le canvas pour pouvoir les mettre à jour plus tard
  if (!canvas._threeJSData) {
    canvas._threeJSData = {};
  }

  // Sauvegarder l'angle de rotation actuel si la sphère existe déjà
  // Priorité 1: Utiliser la valeur sauvegardée dans window (depuis setEpoch/updateHadeenTexture)
  // Priorité 2: Utiliser la valeur depuis canvas._threeJSData.sphere (si canvas existe encore)
  let savedRotationY = 0;
  // 🔒 Restaurer la rotation sauvegardée si disponible (pour éviter que la terre pivote d'un coup)
  if (
    typeof window !== "undefined" &&
    window.savedPlanetRotationY !== undefined
  ) {
    savedRotationY = window.savedPlanetRotationY;
    // Log supprimé (non essentiel)
    // NE PAS nettoyer la variable - elle peut être réutilisée pour les changements de texture
  } else if (canvas._threeJSData && canvas._threeJSData.sphere) {
    // Si pas de rotation sauvegardée dans window, utiliser celle du canvas existant
    savedRotationY = canvas._threeJSData.sphere.rotation.y;
    // Log supprimé (non essentiel)
    // Sauvegarder aussi dans window pour les prochains changements
    if (typeof window !== "undefined") {
      window.savedPlanetRotationY = savedRotationY;
    }
  }

  // Log supprimé (non essentiel)

  // Calculer le rayon de la sphère pour qu'elle remplisse le container et frôle le cercle noir
  // Le container fait planetSize pixels (radius * 2 * logoScale)
  // Référence : radiusTerre = 90px, logoScale = 0.95 → planetSize = 171px
  // Dans planet-test.html : rayon 1.5 pour un container de 400px → facteur = 1.5/400 = 0.00375
  // Mais cette formule donne un rayon trop petit. Il faut ajuster.
  // Test empirique : pour planetSize = 171px, on veut un rayon d'environ 1.5 (comme planet-test.html)
  // Donc : sphereRadius = planetSize * (1.5 / 171) ≈ planetSize * 0.00877
  // Pour frôler le cercle avec logoScale 0.95, on augmente : sphereRadius = planetSize * 0.01
  // MAIS : peut-être que Three.js attend le diamètre, donc on multiplie par 2
  const sphereRadius = planetSize * 0.01 * 2;

  const sphereSegments = 32; // Précision comme dans planet-test.html
  const lightContrast = 1.85; // Contraste éclairci pour astre plus lisible (était 1.5)
  let tiltAngle = (typeof window !== 'undefined' && window.savedPlanetTiltAngle !== undefined)
    ? window.savedPlanetTiltAngle
    : -23.44; // Obliquité actuelle ~23,44° (signe conservé vs ancien −53° pour le rendu texture) ; persistée dans savedPlanetTiltAngle

  // Scène - fond transparent pour s'intégrer dans le diagramme
  const scene = new THREE.Scene();
  scene.background = null; // Transparent pour s'intégrer dans le diagramme

  // Caméra - distance fixe pour que la sphère remplisse le container
  // Si on ajuste la distance proportionnellement au rayon, la taille visuelle reste la même
  // Il faut utiliser une distance fixe basée sur la taille du container
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  // Distance fixe calculée empiriquement pour que la sphère remplisse le container et frôle le cercle
  const distance = planetSize / 30.5; // Distance fixe basée sur la taille du container
  camera.position.set(0, 0, distance);
  camera.lookAt(0, 0, 0);

  // Renderer - avec alpha pour transparence (comme dans planet-test.html mais adapté pour intégration)
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0); // Fond transparent

  // Stocker les références de base maintenant que scene, camera, renderer sont créés
  canvas._threeJSData.scene = scene;
  canvas._threeJSData.camera = camera;
  canvas._threeJSData.renderer = renderer;
  canvas._threeJSData.sphere = null; // Sera défini dans createPlanetSphere
  canvas._threeJSData.sphereRadius = sphereRadius;
  canvas._threeJSData.luxSaturation = luxSaturation;
  canvas._threeJSData.lightDistance = lightDistance;
  canvas._threeJSData.lightContrast = lightContrast;

  // Texture - vérifier le protocole (Three.js nécessite HTTP/HTTPS)
  let texture = null;
  const textureName =
    typeof logoPath === "string" && logoPath
      ? logoPath.split("/").pop()
      : String(logoPath);
  if (window.location.protocol === "file:") {
    console.log("🖼️ [texture] chargement erreur (file:):", textureName);
    console.error(
      "[initPlanetThreeJS] ❌ ERREUR: Three.js nécessite HTTP/HTTPS !",
    );
    console.error("⚠️ Utilisez: http://localhost:8000/index.html");
    createPlanetSphere();
    if (window._logStep) window._logStep("[2] texture Three.js (retour file:)");
    else console.log("[2] texture Three.js (retour file:)");
    if (window._logStepEnd) window._logStepEnd();
    IO_LISTENER.emit("three:ready", { hasTexture: false, canvas: canvas });
  } else {
    const textureLoader = new THREE.TextureLoader();
    let resolvedUrl = logoPath;
    try {
      resolvedUrl = new URL(logoPath, window.location.href).href;
    } catch (e) {
      console.warn(
        "[initPlanetThreeJS] logoPath invalide pour URL:",
        logoPath,
        e,
      );
    }
    textureLoader.load(
      logoPath,
      function (loadedTexture) {
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        texture = loadedTexture;
        if (typeof window !== "undefined") window._lastPlanetTexturePath = logoPath;
        createPlanetSphere();
        console.log("🖼️ [texture] chargement OK:", textureName);
        if (window._logStep) window._logStep("[2] texture Three.js (retour)");
        if (window._logStepEnd) window._logStepEnd();
        IO_LISTENER.emit("three:ready", { hasTexture: true, canvas: canvas });
      },
      undefined,
      function (error) {
        console.log("🖼️ [texture] chargement erreur:", textureName);
        createPlanetSphere();
        if (window._logStep) window._logStep("[2] texture Three.js (retour sans image)");
        if (window._logStepEnd) window._logStepEnd();
        IO_LISTENER.emit("three:ready", { hasTexture: false, canvas: canvas });
      },
    );
  }

  // Éclairage : lumière ambiante (intensité augmentée pour éclaircir l’astre globalement)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambientLight);

  // Éclairage : lumière directionnelle (comme le soleil) ou point au centre (éclairage interne)
  let directionalLight = null;
  let pointLight = null;
  const lightDirection = new THREE.Vector3(-1, 1, 0).normalize();

  // Si lightDistance est 0, utiliser un PointLight au centre (éclairage interne)
  // Sinon, utiliser une DirectionalLight (la distance ajuste l'intensité)
  if (lightDistance !== null && lightDistance === 0) {
    // Éclairage interne : PointLight au centre avec intensité très élevée
    pointLight = new THREE.PointLight(
      0xffffff,
      lightContrast * luxSaturation * 20,
    ); // Intensité x20 pour éclairage interne
    pointLight.position.set(0, 0, 0); // Au centre
    pointLight.castShadow = false;
    scene.add(pointLight);
    // Augmenter drastiquement la lumière ambiante pour l'éclairage interne
    ambientLight.intensity = 1.5; // Très forte lumière ambiante pour éclairage interne
    // Log supprimé (non essentiel)

    // Stocker les références des lumières après création
    canvas._threeJSData.pointLight = pointLight;
    canvas._threeJSData.directionalLight = null;
    canvas._threeJSData.ambientLight = ambientLight;
  } else {
    // Éclairage externe : DirectionalLight (soleil)
    // Note: Pour DirectionalLight, la distance n'a pas d'effet visuel (rayons parallèles)
    // Mais on utilise lightDistance comme facteur d'intensité (plus grand = plus intense)
    directionalLight = new THREE.DirectionalLight(0xffffff, lightContrast);
    const defaultDistance = sphereRadius * 3;
    const actualLightDistance =
      lightDistance !== null && lightDistance > 0
        ? lightDistance
        : defaultDistance;
    const lightPosition = lightDirection
      .clone()
      .multiplyScalar(actualLightDistance);
    directionalLight.position.copy(lightPosition);
    directionalLight.castShadow = false;
    scene.add(directionalLight);
    // Log supprimé (non essentiel)

    // Stocker les références des lumières après création
    canvas._threeJSData.directionalLight = directionalLight;
    canvas._threeJSData.pointLight = null;
    canvas._threeJSData.ambientLight = ambientLight;
  }

  // Ajuster le contraste de l'éclairage avec luxSaturation
  // luxSaturation contrôle l'intensité de la lumière (soleil ou interne)
  // 0.0 = pas de lumière (pas d'ombre), 1.0 = lumière normale, >1.0 = lumière plus intense
  // lightDistance affecte l'intensité selon la loi en 1/distance² (loi de l'inverse du carré)
  if (directionalLight) {
    const baseDirectionalIntensity = 0.1 + lightContrast * 1.2;
    // Calculer le facteur d'intensité selon la loi en 1/distance²
    const defaultDistance = sphereRadius * 3;
    const actualLightDistance =
      lightDistance !== null && lightDistance > 0
        ? lightDistance
        : defaultDistance;
    // Facteur d'intensité : loi en 1/distance² (plus loin = moins intense)
    const distanceFactor =
      (defaultDistance * defaultDistance) /
      (actualLightDistance * actualLightDistance);
    directionalLight.intensity =
      baseDirectionalIntensity * luxSaturation * distanceFactor;
    // Log supprimé (non essentiel)
  } else if (pointLight) {
    // L'intensité du PointLight est déjà ajustée lors de la création
    pointLight.intensity = lightContrast * luxSaturation * 20;
  }
  // Ajuster la lumière ambiante (plus faible pour éclairage externe, plus forte pour interne)
  if (!pointLight) {
    // Éclairage externe : lumière ambiante plus forte pour éclaircir l’astre
    const ambientIntensity = Math.max(0.15, 0.45 - lightContrast * 0.05);
    ambientLight.intensity = ambientIntensity;
  }
  // Pour éclairage interne, l'intensité ambiante est déjà ajustée lors de la création du PointLight

  let sphere = null;

  // Fonction pour créer/mettre à jour la sphère
  function createPlanetSphere(newRadius = null) {
    // Si un nouveau rayon est fourni, recalculer sphereRadius
    let currentSphereRadius = newRadius !== null ? newRadius : sphereRadius;

    const wasUpdating = !!sphere;
    if (sphere) {
      scene.remove(sphere);
      if (sphere.geometry) sphere.geometry.dispose();
      if (sphere.material) sphere.material.dispose();
    }

    // Ne réinitialiser la caméra que lors de la première création (pas au changement de texture / autre événement)
    if (!wasUpdating) {
      const distance = planetSize / 30.5;
      camera.position.set(0, 0, distance);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }

    // Ajuster la position de la lumière (seulement si c'est une DirectionalLight)
    if (directionalLight) {
      const actualLightDistance =
        lightDistance !== null && lightDistance !== 0
          ? lightDistance
          : currentSphereRadius * 3;
      const lightPosition = lightDirection
        .clone()
        .multiplyScalar(actualLightDistance);
      directionalLight.position.copy(lightPosition);
    }
    // PointLight reste au centre (0, 0, 0)

    // Log supprimé (non essentiel)

    const geometry = new THREE.SphereGeometry(
      currentSphereRadius,
      sphereSegments,
      sphereSegments,
    );
    // Matériau comme dans planet-test.html (sans options supplémentaires qui créent des effets indésirables)
    const materialOptions = {
      roughness: 0.9, // Plus rugueux pour moins de brillance
      metalness: 0.0, // Pas métallique pour un rendu plus naturel
    };
    // Pour éclairage interne (PointLight), utiliser DoubleSide pour voir les faces de l'intérieur
    if (pointLight) {
      materialOptions.side = THREE.DoubleSide;
    }
    if (texture) {
      materialOptions.map = texture;
    }
    const material = new THREE.MeshStandardMaterial(materialOptions);

    sphere = new THREE.Mesh(geometry, material);
    sphere.rotation.x = (tiltAngle * Math.PI) / 180;
    // Restaurer l'angle de rotation Y sauvegardé (pour garder la continuité)
    if (savedRotationY !== undefined && savedRotationY !== null) {
      sphere.rotation.y = savedRotationY;
      rotationY = savedRotationY; // synchro boucle animate() (sinon elle écrase au frame suivant)
    }
    scene.add(sphere);

    // Stocker les références pour mise à jour ultérieure
    canvas._threeJSData.scene = scene;
    canvas._threeJSData.sphere = sphere;
    canvas._threeJSData.camera = camera;
    canvas._threeJSData.renderer = renderer;
    canvas._threeJSData.updateSphere = createPlanetSphere;
    canvas._threeJSData.currentRadius = currentSphereRadius;

    // Log supprimé (non essentiel)
  }

  // Drag désactivé : angles par défaut uniquement (pas de listeners)
  let rotationY = sphere ? sphere.rotation.y : 0;
  container.style.pointerEvents = "none";
  canvas.style.pointerEvents = "none";
  canvas.style.position = "relative";
  canvas.style.zIndex = "1";

  // Logs press/move/release via document (pointer-events:none empêche la détection sur container/canvas)
  // On filtre par hit-test : coordonnées dans le bounding rect du canvas
  let _dragActive = false;
  function _inCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }
  function _onDocDown(e) {
    if (!_inCanvas(e)) return;
    _dragActive = true;
    document.body.style.userSelect = 'none';
  }
  function _onDocMove(e) {
    if (!_dragActive) return;
    tiltAngle += e.movementY * 1.0;
    if (typeof window !== 'undefined') window.savedPlanetTiltAngle = tiltAngle;
    if (sphere) sphere.rotation.x = (tiltAngle * Math.PI) / 180;
  }
  function _onDocUp(e) {
    if (!_dragActive) return;
    _dragActive = false;
    document.body.style.userSelect = '';
  }
  document.addEventListener('pointerdown', _onDocDown);
  document.addEventListener('pointermove', _onDocMove);
  document.addEventListener('pointerup', _onDocUp);
  document.addEventListener('pointercancel', _onDocUp);

  const speed = 1.0;
  function animate() {
    const isPaused = window.threeJSAnimationPaused;
    if (!sphere) {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
      return;
    }
    if (!isPaused) {
      rotationY += 0.005 * speed;
      sphere.rotation.y = rotationY;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // L'animation démarre immédiatement (pas besoin d'attendre calculationConverged pour Three.js)

  // Redimensionnement
  const resizeObserver = new ResizeObserver(() => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    if (newWidth > 0 && newHeight > 0) {
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    }
  });
  resizeObserver.observe(container);
}

// Fonction pour mettre à jour l'éclairage Three.js sans recréer la scène
function updatePlanetLighting() {
  const cellTerre = document.getElementById("cell-terre");
  if (!cellTerre) {
    console.warn("[updatePlanetLighting] ⚠️ Cellule Terre non trouvée");
    return;
  }

  // Trouver le canvas Three.js dans la cellule
  const canvas = cellTerre.querySelector("canvas");
  if (!canvas || !canvas._threeJSData) {
    console.warn(
      "[updatePlanetLighting] ⚠️ Canvas Three.js non trouvé ou non initialisé",
    );
    return;
  }

  const threeJSData = canvas._threeJSData;
  if (!threeJSData.directionalLight && !threeJSData.pointLight) {
    console.warn(
      "[updatePlanetLighting] ⚠️ Aucune lumière trouvée dans la scène Three.js",
    );
    return;
  }

  // Récupérer la config de l'époque courante
  const currentEpochName =
    (typeof window !== "undefined" && window.currentEpochName) || "Corps Noir";
  const terreNode = window.configOrganigramme.nodes.find(
    (n) => n.id === "terre",
  );
  if (!terreNode || !terreNode.epoch || !Array.isArray(terreNode.epoch)) {
    console.warn("[updatePlanetLighting] ⚠️ Configuration époque non trouvée");
    return;
  }

  const epochConfig = terreNode.epoch.find(
    (e) => e.epochName === currentEpochName,
  );
  if (!epochConfig) {
    console.warn(
      "[updatePlanetLighting] ⚠️ Époque non trouvée:",
      currentEpochName,
    );
    return;
  }

  // Interpréter lightDistance
  let lightDistance = epochConfig.lightDistance;
  if (
    typeof lightDistance === "string" ||
    (typeof lightDistance !== "number" &&
      lightDistance !== null &&
      lightDistance !== undefined)
  ) {
    if (typeof window.interpretConfigValue === "function") {
      lightDistance = window.interpretConfigValue(lightDistance);
    }
  }

  // 🔒 Convertir en nombre si c'est une chaîne après interprétation
  if (typeof lightDistance === "string") {
    const parsed = parseFloat(lightDistance);
    if (!isNaN(parsed)) {
      lightDistance = parsed;
    }
  }

  // Si isIceChange, diminuer lightDistance de 1
  if (
    window.isIceChange &&
    typeof lightDistance === "number" &&
    !isNaN(lightDistance)
  ) {
    const oldLightDistance = lightDistance;
    lightDistance = Math.max(0, lightDistance - 1);
    // Log supprimé (non essentiel)
  }

  const luxSaturation =
    epochConfig.luxSaturation !== undefined ? epochConfig.luxSaturation : 1.0;
  const lightContrast = threeJSData.lightContrast || 1.85;
  const sphereRadius = threeJSData.currentRadius || threeJSData.sphereRadius;

  // Log supprimé (non essentiel)

  // Mettre à jour l'éclairage selon le type
  if (lightDistance !== null && lightDistance === 0) {
    // Éclairage interne : PointLight
    if (threeJSData.pointLight) {
      threeJSData.pointLight.intensity = lightContrast * luxSaturation * 20;
      if (threeJSData.ambientLight) {
        threeJSData.ambientLight.intensity = 1.5;
      }
    } else {
      // Passer de DirectionalLight à PointLight
      if (threeJSData.directionalLight) {
        threeJSData.scene.remove(threeJSData.directionalLight);
      }
      const pointLight = new THREE.PointLight(
        0xffffff,
        lightContrast * luxSaturation * 20,
      );
      pointLight.position.set(0, 0, 0);
      pointLight.castShadow = false;
      threeJSData.scene.add(pointLight);
      threeJSData.pointLight = pointLight;
      threeJSData.directionalLight = null;
      if (threeJSData.ambientLight) {
        threeJSData.ambientLight.intensity = 1.5;
      }
    }
  } else {
    // Éclairage externe : DirectionalLight
    if (threeJSData.directionalLight) {
      const defaultDistance = sphereRadius * 3;
      const actualLightDistance =
        lightDistance !== null && lightDistance > 0
          ? lightDistance
          : defaultDistance;
      const lightDirection = new THREE.Vector3(-1, 1, 0).normalize();
      const lightPosition = lightDirection
        .clone()
        .multiplyScalar(actualLightDistance);
      threeJSData.directionalLight.position.copy(lightPosition);

      // 🔒 Mettre à jour l'intensité (DirectionalLight n'est pas affecté par la distance physiquement,
      // mais on ajuste l'intensité pour l'effet visuel : plus proche = plus intense)
      const baseDirectionalIntensity = 0.1 + lightContrast * 1.2;
      // Plus la distance est petite, plus l'intensité est grande (inverse de la distance au carré)
      const distanceFactor =
        (defaultDistance * defaultDistance) /
        (actualLightDistance * actualLightDistance);
      threeJSData.directionalLight.intensity =
        baseDirectionalIntensity * luxSaturation * distanceFactor;

      // Log supprimé (non essentiel)

      if (threeJSData.ambientLight) {
        const ambientIntensity = Math.max(0.15, 0.45 - lightContrast * 0.05);
        threeJSData.ambientLight.intensity = ambientIntensity;
      }
    } else {
      // Passer de PointLight à DirectionalLight
      if (threeJSData.pointLight) {
        threeJSData.scene.remove(threeJSData.pointLight);
      }
      const directionalLight = new THREE.DirectionalLight(
        0xffffff,
        lightContrast,
      );
      const defaultDistance = sphereRadius * 3;
      const actualLightDistance =
        lightDistance !== null && lightDistance > 0
          ? lightDistance
          : defaultDistance;
      const lightDirection = new THREE.Vector3(-1, 1, 0).normalize();
      const lightPosition = lightDirection
        .clone()
        .multiplyScalar(actualLightDistance);
      directionalLight.position.copy(lightPosition);
      directionalLight.castShadow = false;
      threeJSData.scene.add(directionalLight);

      const baseDirectionalIntensity = 0.1 + lightContrast * 1.2;
      const distanceFactor =
        (defaultDistance * defaultDistance) /
        (actualLightDistance * actualLightDistance);
      directionalLight.intensity =
        baseDirectionalIntensity * luxSaturation * distanceFactor;

      threeJSData.directionalLight = directionalLight;
      threeJSData.pointLight = null;
      if (threeJSData.ambientLight) {
        const ambientIntensity = Math.max(0.15, 0.45 - lightContrast * 0.05);
        threeJSData.ambientLight.intensity = ambientIntensity;
      }
    }
  }

  // Mettre à jour les références stockées
  threeJSData.lightDistance = lightDistance;
  threeJSData.luxSaturation = luxSaturation;
}

// Exposer updatePlanetLighting globalement
if (typeof window !== "undefined") {
  window.updatePlanetLighting = updatePlanetLighting;
}

/** Met à jour la texture de la planète (terre) selon l’époque et infoTimeMa. Appelé à chaque updateTimeline pour que chaque action qui avance le temps change la texture. */
function updatePlanetTextureFromDate() {
  const cellTerre = document.getElementById("cell-terre");
  if (!cellTerre) return;
  const canvas = cellTerre.querySelector("canvas");
  if (!canvas || !canvas._threeJSData || !canvas._threeJSData.sphere) return;
  const DATA = window.DATA;
  const TIMELINE = window.TIMELINE;
  if (!DATA || !DATA["📜"] || DATA["📜"]["👉"] == null || !TIMELINE || !TIMELINE.length) return;
  const idx = DATA["📜"]["👉"];
  const epoch = TIMELINE[idx];
  if (!epoch || epoch["▶"] == null) return;
  const startYears = epoch["▶"];
  const infoTimeMa = typeof window.infoTimeMa === "number" ? window.infoTimeMa : 0;
  const path = getPlanetTexturePathFromEpoch(startYears, infoTimeMa);
  if (path === window._lastPlanetTexturePath) return;
  window._lastPlanetTexturePath = path;
  const sphere = canvas._threeJSData.sphere;
  const textureName = path.split("/").pop() || path;
  // Pause Three.js pour que l'angle ne change pas entre 2 textures ; play au compute:done (loader_panels, main.js)
  if (typeof window !== "undefined") window.threeJSAnimationPaused = true;
  const loader = new THREE.TextureLoader();
  loader.load(
    path,
    function (loadedTexture) {
      loadedTexture.wrapS = THREE.RepeatWrapping;
      loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
      const oldMap = sphere.material && sphere.material.map;
      if (oldMap) oldMap.dispose();
      sphere.material.map = loadedTexture;
      console.log("🖼️ [texture] chargement OK:", textureName);
    },
    undefined,
    function () {
      console.log("🖼️ [texture] chargement erreur:", textureName);
    }
  );
}
if (typeof window !== "undefined") {
  window.updatePlanetTextureFromDate = updatePlanetTextureFromDate;
  window.getPlanetTexturePathFromEpoch = getPlanetTexturePathFromEpoch;
}

function labelDataUsesOrganigramConfigHeading(labelData) {
  return (
    labelData &&
    typeof labelData === "object" &&
    typeof labelData.className === "string" &&
    labelData.className.indexOf("organigram-config-heading") !== -1
  );
}

function createCell(
  x,
  y,
  radius,
  fillColor,
  strokeColor,
  logo,
  left = [],
  right = [],
  top = [],
  bottom = [],
  tooltip = null,
  ariaLabel = null,
  radiationOptions = null,
  rectangleOptions = null,
  fillImage = null,
  nodeId = null,
  zIndex = null,
  logoScale = 1.4,
  logoOffsetY = 0,
  strokeSize = 4,
  strokeStyle = "solid",
  radiusExobase = null,
  targetContainer = null,
  planetEffect = false,
  align = null,
) {
  // Utiliser le container fourni ou le flux-diagram par défaut
  const container = targetContainer || document.getElementById("flux-diagram");

  // Cellule principale avec grille 3x3
  // Le cercle est en arrière-plan, la grille par-dessus pour que les textes se superposent
  const cell = document.createElement("div");
  // Utiliser flux-cellRect si rectangle présent pour avoir une hauteur plus grande
  cell.className = rectangleOptions ? "flux-cellRect" : "flux-cell";

  // Permettre aux étiquettes de déborder sans impacter le centrage du logo
  cell.style.overflow = "visible";

  // Ajouter un ID si fourni
  if (nodeId) {
    cell.id =
      nodeId === "timeline-scenario-anim"
        ? "plot-anim-toggle"
        : "cell-" + nodeId;
  }

  // Z-index géré par CSS via les sélecteurs #cell-{nodeId}
  // Les z-index inline sont désactivés pour éviter les conflits avec le CSS
  cell.style.zIndex = zIndex !== null ? zIndex : Z_LAYERS.NODE;

  // Adapter la grille à la taille du cercle OU du logo (le plus grand)
  // Le cercle est toujours créé (même invisible) pour que les étiquettes s'éloignent correctement
  const hasCircle = true; // Toujours créer le cercle
  const hasVisibleBorder = strokeColor && strokeColor.trim() !== "";
  // Calcul initial pour les dimensions par défaut
  const circleDiameterInit = hasCircle ? radius * 2 : 0;
  let centralCellSize = hasCircle ? circleDiameterInit : radius * logoScale;
  let totalHeight = 25 + centralCellSize + 20;
  let totalWidth = 100 + centralCellSize + 100;

  // Vérifier s'il y a des labels AVANT de construire la grille
  const hasLabels =
    (left && left.length > 0) ||
    (right && right.length > 0) ||
    (top && top.length > 0) ||
    (bottom && bottom.length > 0);

  if (!rectangleOptions) {
    // Case centrale = max(diamètre du cercle, taille du logo). Terre : disque à radiusExobase (atmosphère visible).
    const circleDiameter = hasCircle
      ? (nodeId === "terre" && radiusExobase > 0 ? radiusExobase * 2 : radius * 2)
      : 0;
    // Si cercle visible : logoScale est relatif au diamètre, sinon relatif au radius
    const logoSize = hasCircle
      ? circleDiameter * logoScale
      : radius * logoScale;
    centralCellSize = Math.max(circleDiameter, logoSize); // Pas de minimum, s'adapte à la vraie taille

    // Adapter la grille en hauteur ET en largeur au contenu central
    // grid-template-rows: 18px centralCellSize 40px (bottom = 40px comme la case centrale)
    const topRowHeightPx = hasLabels ? 18 : 22.5;
    const bottomRowHeightPx = hasLabels ? 40 : 22.5;
    if (hasLabels) {
      cell.style.gridTemplateRows = `${topRowHeightPx}px ${centralCellSize}px ${bottomRowHeightPx}px`;
      totalHeight = topRowHeightPx + centralCellSize + bottomRowHeightPx;
    } else {
      cell.style.gridTemplateRows = `22.5px ${centralCellSize}px 22.5px`;
      totalHeight = 22.5 + centralCellSize + 22.5;
    }
    cell.style.gridTemplateColumns = `100px ${centralCellSize}px 100px`; // Colonne centrale = taille du logo/cercle

    // Ajuster les dimensions de la cellule
    totalWidth = 100 + centralCellSize + 100;
    cell.style.height = totalHeight + "px";
    cell.style.width = totalWidth + "px";
  }

  // Positionner le coin supérieur gauche de la grille, puis utiliser transform pour centrer précisément
  // Compensation pour la structure asymétrique de la grille (top vs bottom)
  const topRowHeight = hasLabels ? 18 : 22.5;
  const bottomRowHeight = hasLabels ? 40 : 22.5;
  const verticalOffset = hasLabels ? (topRowHeight - bottomRowHeight) / 2 : 0;

  // Position du centre de la cellule sans offset : y + totalHeight/2
  const cellCenterY = y;
  const logoCenterInCell = topRowHeight + centralCellSize / 2;
  // Écart entre centre cellule et centre logo : logoCenterInCell - totalHeight/2
  const naturalOffset = logoCenterInCell - totalHeight / 2;

  // Le verticalOffset compense l'asymétrie de la grille (top vs bottom)
  // logoOffsetY sera appliqué séparément au logo lui-même
  const totalVerticalOffset = verticalOffset;

  cell.style.left = x + "px";
  cell.style.top = y + "px";
  // Si pas de labels, centrer exactement sans décalage vertical
  if (hasLabels) {
    cell.style.transform = `translate(-50%, calc(-50% - ${totalVerticalOffset}px))`; // Centre le LOGO (pas la cellule) sur (x, y)
  } else {
    cell.style.transform = "translate(-50%, -50%)"; // Centre exactement sur (x, y) sans décalage
  }

  // Cercle en arrière-plan (derrière le tableau)
  // Le centre de la case centrale [1,1] doit être au centre de la grille dynamique
  // Avec transform: translate(-50%, -50%) sur la grille, ce centre sera à (x, y)
  const circleBg = document.createElement("div");
  circleBg.className = "flux-circle-bg";
  // Vérifier si c'est une image pour ajuster la taille avec logoScale
  // 🔒 CORRECTION : Vérifier que logo est une string avant d'appeler endsWith (peut être un tableau)
  const isImage =
    logo &&
    typeof logo === "string" &&
    (logo.endsWith(".svg") || logo.endsWith(".png"));
  // Pour les images sans cercle visible, ajuster la taille du cercle avec logoScale. Terre : disque (fond+stroke) à radiusExobase.
  const circleSize = hasCircle
    ? (nodeId === "terre" && radiusExobase > 0 ? radiusExobase * 2 : radius * 2)
    : isImage
      ? radius * 2 * logoScale
      : radius * 2;
  circleBg.style.width = circleSize + "px";
  circleBg.style.height = circleSize + "px";
  // Z-index du cercle géré par CSS via les sélecteurs #cell-{nodeId} .flux-circle-bg
  // Pour albedo, le cercle doit être au-dessus des radiations (z-index 9)
  // Les z-index inline sont désactivés pour éviter les conflits avec le CSS
  circleBg.style.zIndex = Z_NODE_INTERNAL.CIRCLE;
  // Positionner le cercle au centre de la grille
  // Centre horizontal : 100px (col gauche) + (centralCellSize / 2)
  // Centre vertical : dépend de la structure de la grille (topRowHeight + centralCellSize / 2)
  const centerX = 100 + centralCellSize / 2; // Centre exact de la colonne centrale
  // Centre vertical = centre de la case centrale (middle row), pas du full cell → logo centré dans sa case
  const centerY = topRowHeight + centralCellSize / 2;
  circleBg.style.left = centerX + "px"; // Centre de la colonne centrale (dynamique)
  circleBg.style.top = centerY + "px"; // Centre de la ligne centrale (CERCLE sans offset)
  circleBg.style.transform = "translate(-50%, -50%)"; // Centre le cercle sur (centerX, centerY)
  // Ne pas créer le cercle si un rectangle est présent
  if (!rectangleOptions) {
    // Ajouter une classe spéciale pour les nœuds espace (effet de trou)
    if (nodeId && (nodeId === "espace1" || nodeId === "espace2")) {
      circleBg.classList.add("flux-space-hole");
    }
    // Disque (cercle) : fond + stroke. Terre : radiusExobase (visible), sphère Three.js au centre à radius.
    if (nodeId === "terre" && planetEffect) {
      // Dégradé radial : centre (trou) rempli avec fillColor 0.5 alpha, puis dégradé vers bord (alpha 0)
      const innerPct = (radius / radiusExobase) * 100;
      let fillColorOuter = fillColor.replace(/,\s*[\d.]+\)\s*$/, ", 0)");
      if (fillColorOuter === fillColor) fillColorOuter = "rgba(0,0,0,0)";
      // Centre 0% → innerPct% : même fillColor (0.5 alpha), plus de trou transparent
      const gradientCss = `radial-gradient(circle farthest-side at center, ${fillColor} 0%, ${fillColor} ${innerPct}%, ${fillColorOuter} 100%)`;
      circleBg.style.background = gradientCss;
    } else {
      circleBg.style.backgroundColor = fillColor;
    }
      // Stroke : strokeColor, strokeSize, strokeStyle (string ou array pour stroke-dasharray)
      const isTransparent =
        (strokeColor.includes("rgba") && strokeColor.includes(", 0)")) ||
        (strokeColor.includes("rgba") && strokeColor.includes(", 0 )"));
      const strokeStyleArray = Array.isArray(strokeStyle);
      if (strokeStyleArray) {
        circleBg.style.border = "none";
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", `0 0 ${circleSize} ${circleSize}`);
        svg.setAttribute("class", "flux-circle-stroke-svg");
        const cx = circleSize / 2;
        const r = Math.max(0, (circleSize - strokeSize) / 2);
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cx);
        circle.setAttribute("r", r);
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", strokeColor);
        circle.setAttribute("stroke-width", String(strokeSize));
        circle.setAttribute("stroke-dasharray", strokeStyle.join(" "));
        svg.appendChild(circle);
        circleBg.appendChild(svg);
        svg.style.position = "absolute";
        svg.style.left = "0";
        svg.style.top = "0";
        svg.style.pointerEvents = "none";
      } else if (isTransparent) {
        circleBg.style.borderColor = strokeColor;
        circleBg.style.borderWidth = strokeSize + "px";
        circleBg.style.borderStyle = strokeStyle || "solid";
      } else if (strokeStyle === "blur") {
        circleBg.style.border = "none";
        const blurRadius = Math.max(strokeSize * 2, 4);
        circleBg.style.boxShadow = `0 0 ${blurRadius}px ${strokeSize}px ${strokeColor}`;
      } else {
        circleBg.style.borderColor = strokeColor;
        circleBg.style.borderWidth = strokeSize + "px";
        circleBg.style.borderStyle = strokeStyle || "solid";
        circleBg.style.boxShadow = "none";
      }
    // Wrapper le logo dans un span pour appliquer l'offset sans bouger le cercle
    const logoSpan = document.createElement("span");
    logoSpan.style.display = "flex";
    // 🔒 Gérer l'alignement : 'zorder' = centrer verticalement (flex-direction: column), sinon centrer normalement
    if (align === "zorder") {
      logoSpan.style.flexDirection = "column";
      logoSpan.style.alignItems = "center";
      logoSpan.style.justifyContent = "center";
    } else {
      logoSpan.style.alignItems = "center";
      logoSpan.style.justifyContent = "center";
    }
    logoSpan.style.width = "100%";
    logoSpan.style.height = "100%";
    logoSpan.style.zIndex = Z_NODE_INTERNAL.LOGO;
    let logoSpanUsesRasterGraphic = false;

    // isImage est déjà défini plus haut (ligne 376)

    // 🔒 Gérer les logos en tableau (ex: ['🌞', { text: '...', dataId: '...' }])
    // Le parser ne doit PAS modifier le contenu des logos (sauf pour les époques où c'est nécessaire)
    // 🔒 INVERSER l'ordre d'affichage : le dernier élément du tableau est affiché en premier (en haut)
    if (Array.isArray(logo)) {
      // Parcourir le tableau à l'envers pour que le texte soit au-dessus de l'emoji
      for (let i = logo.length - 1; i >= 0; i--) {
        const logoItem = logo[i];
        if (typeof logoItem === "string") {
          // Logo (image) : charsImages. Alt = ref (logoItem)
          const display =
            (window.charsImages && window.charsImages[logoItem]) || logoItem;
          const isImgPath =
            typeof display === "string" &&
            (display.endsWith(".png") ||
              display.endsWith(".svg") ||
              display.endsWith(".jpg"));
          const emojiSpan = document.createElement("span");
          if (isImgPath) {
            logoSpanUsesRasterGraphic = true;
            const img = document.createElement("img");
            img.src = display;
            img.alt = "";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "contain";
            img.style.objectPosition = "center";
            img.style.display = "block";
            emojiSpan.appendChild(img);
          } else {
            emojiSpan.textContent = display;
            emojiSpan.style.fontFamily =
              "'Apple Color Emoji', 'Noto Color Emoji', 'EmojiFont', 'Segoe UI Emoji', sans-serif";
          }
          emojiSpan.style.display = "block";
          emojiSpan.style.lineHeight = "1";
          logoSpan.appendChild(emojiSpan);
        } else if (
          typeof logoItem === "object" &&
          logoItem.text !== undefined
        ) {
          // C'est un objet { text, dataId }
          const textSpan = document.createElement("span");
          textSpan.innerHTML = logoItem.text; // Utiliser innerHTML pour supporter HTML (ex: <sup>)
          textSpan.style.display = "block";
          textSpan.style.lineHeight = "1";
          if (
            !(
              logoItem.className &&
              typeof logoItem.className === "string" &&
              logoItem.className.includes("plot-anim-skip-label")
            )
          ) {
            textSpan.style.fontSize = "0.4em"; // Plus petit que l'emoji
          }
          if (logoItem.className && typeof logoItem.className === "string") {
            textSpan.className = logoItem.className;
          }
          if (logoItem.dataId) {
            textSpan.setAttribute("data-id", logoItem.dataId);
            if (!textSpan.className) {
              textSpan.className = "flux-label"; // Pour que updateFluxLabels puisse le mettre à jour
            } else {
              textSpan.classList.add("flux-label");
            }
            updateLabelClasses(textSpan, nodeId);
          }
          logoSpan.appendChild(textSpan);
        }
      }
    } else if (isImage) {
      // Si le logo est un fichier image (SVG, PNG, etc.)
      if (planetEffect) {
        // Log supprimé (non essentiel)
        // Utiliser Three.js pour l'effet planète avec rotation et éclairage
        const planetContainer = document.createElement("div");
        planetContainer.className = "planet-container threejs-container";
        planetContainer.style.position = "relative";
        // Terre : sphère à radius (pas 100% de la cellule qui est à radiusExobase)
        const planetSize = radius * 2;
        planetContainer.style.width = planetSize + "px";
        planetContainer.style.height = planetSize + "px";
        planetContainer.style.background = "transparent";
        // Désactiver tous les effets CSS qui pourraient créer un halo (box-shadow, mask, etc.)
        planetContainer.style.boxShadow = "none";
        planetContainer.style.maskImage = "none";
        planetContainer.style.webkitMaskImage = "none";
        planetContainer.style.borderRadius = "0"; // Pas de border-radius pour éviter les effets de masque
        planetContainer.style.setProperty("--disable-flare", "true");
        // Forcer la désactivation des pseudo-éléments qui créent la sphère blanche
        planetContainer.style.setProperty("--before-display", "none");
        planetContainer.style.setProperty("--after-display", "none");
        planetContainer.style.pointerEvents = "none";

        // Créer le canvas pour Three.js (planetSize = radius * 2 déjà défini ci-dessus)
        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvas.style.pointerEvents = "none";
        planetContainer.appendChild(canvas);

        // Récupérer luxSaturation et lightDistance depuis la config de l'époque (si disponible)
        let luxSaturation = 1.0; // Valeur par défaut
        let lightDistance = null; // null = distance automatique, 0 = éclairage interne, >0 = distance spécifique
        if (
          nodeId === "terre" &&
          typeof window !== "undefined" &&
          window.configOrganigramme
        ) {
          // Priorité 1: Utiliser les valeurs interprétées stockées dans window (depuis setEpoch)
          if (window.currentEpochLuxSaturation !== undefined) {
            luxSaturation = window.currentEpochLuxSaturation;
          }
          if (window.currentEpochLightDistance !== undefined) {
            lightDistance = window.currentEpochLightDistance;
            // Log supprimé (non essentiel)
          }

          // Priorité 2: Récupérer depuis la config si pas encore interprétées
          if (luxSaturation === 1.0 || lightDistance === null) {
            const terreNode = window.configOrganigramme.nodes.find(
              (n) => n.id === "terre",
            );
            if (
              terreNode &&
              terreNode.epoch &&
              Array.isArray(terreNode.epoch)
            ) {
              const currentEpochName = window.currentEpochName || "Corps Noir";
              const epochConfig = terreNode.epoch.find(
                (e) => e.epochName === currentEpochName,
              );
              if (epochConfig) {
                // Interpréter les valeurs si nécessaire
                if (
                  luxSaturation === 1.0 &&
                  epochConfig.luxSaturation !== undefined
                ) {
                  luxSaturation = epochConfig.luxSaturation;
                }
                if (
                  lightDistance === null &&
                  epochConfig.lightDistance !== undefined
                ) {
                  // Log supprimé (non essentiel)
                  // Interpréter lightDistance si c'est une chaîne
                  if (
                    typeof epochConfig.lightDistance === "string" &&
                    typeof window.interpretConfigValue === "function"
                  ) {
                    lightDistance = window.interpretConfigValue(
                      epochConfig.lightDistance,
                    );
                    // Log supprimé (non essentiel)
                  } else {
                    lightDistance = epochConfig.lightDistance;
                    // Log supprimé (non essentiel)
                  }
                }
              }
            }
          }

          // Log supprimé (non essentiel)
        }

        // S'assurer que lightDistance est interprété avant de passer à initPlanetThreeJS
        // Si c'est encore une chaîne, l'interpréter maintenant
        if (
          typeof lightDistance === "string" &&
          typeof window.interpretConfigValue === "function"
        ) {
          const interpretedLightDistance =
            window.interpretConfigValue(lightDistance);
          // Log supprimé (non essentiel)
          lightDistance = interpretedLightDistance;
        }

        // Initialiser Three.js avec éclairage
        // Le chemin de la texture est résolu depuis le document HTML, pas depuis le CSS
        if (typeof THREE !== "undefined") {
          initPlanetThreeJS(
            canvas,
            logo,
            planetSize,
            planetContainer,
            radius,
            logoScale,
            luxSaturation,
            lightDistance,
          );
        } else {
          console.error("[createCell] ❌ Three.js non chargé !");
        }

        logoSpan.appendChild(planetContainer);
        logoSpan.style.pointerEvents = "none";
      } else {
        logoSpanUsesRasterGraphic = true;
        // Image normale sans effet planète
        const img = document.createElement("img");
        img.src = logo;
        img.alt = "";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.style.objectPosition = "center";
        img.style.display = "block";
        logoSpan.appendChild(img);
      }
      // logoScale sur le span : voir apply raster ci-dessous (charsImages + chemins directs)
    } else if (!Array.isArray(logo)) {
      // Sinon c'est un emoji/texte simple (pas un tableau)
      // Logo (image) : charsImages. Alt = ref (logo)
      const display = (window.charsImages && window.charsImages[logo]) || logo;
      const isImgPathSimple =
        typeof display === "string" &&
        (display.endsWith(".png") ||
          display.endsWith(".svg") ||
          display.endsWith(".jpg"));
      if (isImgPathSimple) {
        logoSpanUsesRasterGraphic = true;
        const img = document.createElement("img");
        img.src = display;
        img.alt = "";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.style.objectPosition = "center";
        img.style.display = "block";
        logoSpan.appendChild(img);
      } else {
        logoSpan.textContent = display;
        logoSpan.style.fontFamily =
          "'Apple Color Emoji', 'Noto Color Emoji', 'EmojiFont', 'Segoe UI Emoji', sans-serif";
      }
    }
    // Si logo est un tableau, il a déjà été traité ci-dessus

    if (
      logoSpanUsesRasterGraphic &&
      Number.isFinite(logoScale) &&
      logoScale > 0
    ) {
      const d = Math.min(circleSize, Math.max(1, circleSize * logoScale));
      logoSpan.style.width = d + "px";
      logoSpan.style.height = d + "px";
    }
    if (logoOffsetY !== 0) {
      const offsetPx = logoSpanUsesRasterGraphic
        ? logoOffsetY
        : logoOffsetY * logoScale;
      logoSpan.style.transform = `translateY(${offsetPx}px)`;
    }
    circleBg.appendChild(logoSpan);
    // Taille du logo : si cercle visible, relatif au diamètre; sinon relatif au radius
    // Pour les emojis, utiliser fontSize; pour les images, la taille est déjà définie sur logoSpan
    if (!isImage) {
      const logoFontSize = hasCircle
        ? radius * 2 * logoScale
        : radius * logoScale;
      circleBg.style.fontSize = logoFontSize + "px";
    }

    // Gestionnaire de clic pour copier le logo ou déclencher le bouton
    circleBg.addEventListener("click", (e) => {
      e.stopPropagation();

      // Vérifier si c'est la Terre (toggle animation Three.js)
      if (nodeId === "terre") {
        if (typeof window !== "undefined") {
          window.threeJSAnimationPaused = !window.threeJSAnimationPaused;
          // Log supprimé (non essentiel)
        }
        return; // Ne pas copier le logo ni déclencher d'autres actions
      }

      // Vérifier si c'est un bouton (cellule parente a la classe flux-button-cell)
      const parentCell = circleBg.closest(".flux-button-cell");
      if (parentCell) {
        // 🎞 Animation timeline : bouton readOnly mais action explicite attendue (togglePlotAnim)
        if (
          parentCell.id === "plot-anim-toggle" ||
          nodeId === "timeline-scenario-anim"
        ) {
          if (typeof window !== "undefined" && typeof window.togglePlotAnim === "function") {
            window.togglePlotAnim();
          }
          return;
        }
        if (parentCell.classList.contains("flux-display-only")) return; // display-only, pas de toggle
        // 🗺 Crédits PALEOMAP : le cercle déclenchait runCompute (toggle « fantôme ») ; même action que le bouton HTML #credits-paleomap
        if (parentCell.id === "cell-credits-paleomap" || nodeId === "credits-paleomap") {
          const creditsBtn = document.getElementById("credits-paleomap");
          if (creditsBtn) {
            creditsBtn.click();
          } else {
            const dlg = document.getElementById("dlg-credits");
            if (dlg && typeof dlg.showModal === "function") dlg.showModal();
          }
          return;
        }
        // C'est un bouton : toggle la classe checked directement sur la cellule
        const isChecked = parentCell.classList.contains("checked");
        if (isChecked) {
          parentCell.classList.remove("checked");
        } else {
          parentCell.classList.add("checked");
        }

        // Mettre à jour les variables globales UNIQUES et les couleurs
        const cellId = parentCell.id;
        let edsVarName = null;
        let legacyVarName = null;
        if (cellId === "cell-co2") {
          edsVarName = "isCO2_eds";
          legacyVarName = "useCO2";
        } else if (cellId === "cell-methane") {
          edsVarName = "isCH4_eds";
          legacyVarName = "useCH4";
        } else if (cellId === "cell-h2o") {
          edsVarName = "isH2O_eds";
          legacyVarName = "useH2O";
        } else if (cellId === "cell-albedo-btn") {
          edsVarName = "isAlbedo";
          legacyVarName = "useAlbedo";
        }

        // 🔒 Mettre à jour UNIQUEMENT les variables globales uniques (seule référence)
        if (edsVarName && typeof window !== "undefined") {
          window[edsVarName] = !isChecked;
          // Garder aussi les variables legacy pour compatibilité temporaire
          if (legacyVarName) {
            window[legacyVarName] = !isChecked;
          }
        }

        // Mettre à jour la classe selected
        if (!isChecked) {
          parentCell.classList.add("selected");
          parentCell.classList.remove("unselected");
        } else {
          parentCell.classList.remove("selected");
          parentCell.classList.add("unselected");
        }

        // Mettre à jour les couleurs des étiquettes
        if (typeof window.updateFluxLabels === "function") {
          window.updateFluxLabels("ProcessFinished");
        }

        // Relancer le cycle avec la nouvelle donnée (getEnabledStates lit depuis le DOM)
        if (typeof window.runComputeInParent === "function") {
          window.runComputeInParent();
        }

        // Mettre à jour le tooltip du bouton
        updateButtonTooltip(parentCell, circleBg);
      } else {
        // Ce n'est pas un bouton : copier le logo (comportement original)
        navigator.clipboard
          .writeText(logo)
          .then(() => {
            // Feedback visuel temporaire (agrandissement)
            // Animation supprimée pour éviter setTimeout - utiliser CSS transition si nécessaire
            // const originalTransform = circleBg.style.transform;
            // circleBg.style.transform = 'translate(-50%, -50%) scale(1.5)';
            // setTimeout(() => {
            //     circleBg.style.transform = originalTransform;
            // }, 200);
          })
          .catch((err) => {
            console.error("[organigramme] Erreur lors de la mise à jour:", err);
            throw err; // Propager l'erreur au lieu de la masquer
          });
      }
    });

    // Ajouter tooltip personnalisé sur le cercle/logo si présent (au lieu de la cellule entière)
    if (tooltip) {
      // Pour les boutons, afficher "on/off" + nom selon l'état
      let tooltipText = tooltip;
      if (
        nodeId &&
        (nodeId === "co2" ||
          nodeId === "methane" ||
          nodeId === "h2o" ||
          nodeId === "albedo-btn")
      ) {
        // Déterminer l'état initial du bouton
        const isChecked = cell.classList.contains("checked");
        const stateText = isChecked ? "on" : "off";
        // Mapper les noms pour l'affichage
        let displayName = tooltip;
        if (nodeId === "co2") displayName = "CO<sub>2</sub>";
        else if (nodeId === "methane") displayName = "CH<sub>4</sub>";
        else if (nodeId === "h2o") displayName = "H<sub>2</sub>O";
        else if (nodeId === "albedo-btn") displayName = "Albedo";
        // Format: "on/off<br>CO₂" (saut de ligne HTML, indices pour molécules)
        tooltipText = `${stateText}/${isChecked ? "off" : "on"}<br>${displayName}`;
      }
      // Alt / a11y sur le logo EDS : aria-label et data-tooltip pour tooltip et lecteurs d’écran
      const altText = (ariaLabel && ariaLabel.trim()) ? ariaLabel : tooltipText.replace(/<br\s*\/?>/gi, " ").replace(/<sub>|<\/sub>/gi, "");
      circleBg.setAttribute("aria-label", altText);
      circleBg.setAttribute("data-tooltip", tooltipText);
      addCustomTooltip(circleBg, tooltipText);

      // Pour les boutons, mettre à jour le tooltip quand l'état change
      if (
        nodeId &&
        (nodeId === "co2" ||
          nodeId === "methane" ||
          nodeId === "h2o" ||
          nodeId === "albedo-btn")
      ) {
        // Stocker une référence pour mettre à jour le tooltip
        circleBg._tooltipElement = circleBg;
        circleBg._tooltipNodeId = nodeId;
        circleBg._tooltipBaseName = tooltip;
      }
      }

    cell.appendChild(circleBg);
  } else {
    // Si pas de cercle, ajouter tooltip personnalisé sur la cellule (fallback)
    if (tooltip) {
      addCustomTooltip(cell, tooltip);
    }
  }

  // Créer les 9 cases de la grille (par-dessus le cercle)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const gridItem = document.createElement("div");
      gridItem.className = "flux-grid-item";
      // Ajouter la classe selon la colonne pour justify-content
      if (col === 0) {
        gridItem.className += " flux-grid-item-left"; // justify-content: flex-end
      } else if (col === 1) {
        gridItem.className += " flux-grid-item-center"; // justify-content: center
      } else if (col === 2) {
        gridItem.className += " flux-grid-item-right"; // justify-content: flex-start
      }
      // Ligne du haut : aligner le contenu en haut de la cellule (0.0% en top, pas en bottom)
      if (row === 0) {
        gridItem.className += " flux-grid-item-top";
      }
      // Ligne du bas : aligner le contenu en haut pour éviter le chevauchement avec la boule à facette
      if (row === 2) {
        gridItem.className += " flux-grid-item-bottom";
      }
      gridItem.style.gridColumn = col + 1;
      gridItem.style.gridRow = row + 1;
      gridItem.style.position = "relative";
      gridItem.style.zIndex = Z_NODE_INTERNAL.LABEL; // Étiquettes TOUJOURS au-dessus de tout (flèches max ~26)

      // [1,1] = Vide (le logo est dans le cercle en arrière-plan)
      // [1,0] = Top (haut)
      if (col === 1 && row === 0 && top && top.length > 0) {
        const labelContainer = document.createElement("div");
        // Si 2 éléments, aligner en bas pour entourer le trait du cercle, sinon centrer
        labelContainer.className =
          "flux-label-container " +
          (top.length === 2
            ? "flux-label-container-bottom"
            : "flux-label-container-center");

        top.forEach((labelData) => {
          const text = getLabelText(labelData);
          const dataId = getLabelDataId(labelData);
          const label = document.createElement("div");
          label.className = "flux-label";
          if (
            labelData &&
            typeof labelData === "object" &&
            typeof labelData.className === "string" &&
            labelData.className.trim()
          ) {
            label.classList.add(...labelData.className.trim().split(/\s+/));
          }
          if (dataId) label.setAttribute("data-id", dataId);
          // Si c'est un bouton, ajouter la classe buttonData
          if (nodeId) {
            const node = organigramNodes.find((n) => n.id === nodeId);
            if (
              node &&
              node.type === "button" &&
              !labelDataUsesOrganigramConfigHeading(labelData)
            ) {
              label.classList.add("buttonData");
            }
          }
          label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
          updateLabelClasses(label, nodeId);
          label.style.position = "relative"; // Créer un stacking context
          label.style.zIndex = Z_NODE_INTERNAL.LABEL + 1; // Encore plus haut que le container
          labelContainer.appendChild(label);
        });

        gridItem.appendChild(labelContainer);
      }
      // [1,2] = Bottom (bas)
      if (col === 1 && row === 2 && bottom && bottom.length > 0) {
        const labelContainer = document.createElement("div");
        const hasFineTuningBary = bottom.some(
          (labelData) => getLabelDataId(labelData) === "fine_tuning_cloud_bary",
        );
        // fine_tuning_cloud_bary: flux-label-container-top pour aligner le % en haut de la case
        labelContainer.className =
          hasFineTuningBary
            ? "flux-label-container flux-label-container-top"
            : "flux-label-container " +
              (bottom.length === 2
                ? "flux-label-container-top"
                : "flux-label-container-center");

        bottom.forEach((labelData) => {
          const text = getLabelText(labelData);
          const dataId = getLabelDataId(labelData);
          const label = document.createElement("div");
          label.className = "flux-label";
          if (
            labelData &&
            typeof labelData === "object" &&
            typeof labelData.className === "string" &&
            labelData.className.trim()
          ) {
            label.classList.add(...labelData.className.trim().split(/\s+/));
          }
          if (dataId) label.setAttribute("data-id", dataId);
          if (dataId === "fine_tuning_cloud_bary") {
            label.setAttribute("aria-label", getFineTuningDetailAlt(null, true));
            label.setAttribute("data-tooltip", getFineTuningShortTooltip("100"));
            label.style.marginTop = "6px";
          }

          // Si c'est un bouton, ajouter la classe buttonData
          if (nodeId) {
            const node = organigramNodes.find((n) => n.id === nodeId);
            if (
              node &&
              node.type === "button" &&
              !labelDataUsesOrganigramConfigHeading(labelData)
            ) {
              label.classList.add("buttonData");
            }
          }
          label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
          updateLabelClasses(label, nodeId);
          label.style.position = "relative"; // Créer un stacking context
          label.style.zIndex = Z_NODE_INTERNAL.LABEL + 1; // Encore plus haut que le container
          labelContainer.appendChild(label);
          if ((dataId === "fine_tuning_cloud_bary") && typeof window.addTooltipFromAttribute === "function" && !label.hasAttribute("data-tooltip-initialized")) {
            window.addTooltipFromAttribute(label);
            label.setAttribute("data-tooltip-initialized", "true");
          }
        });

        gridItem.appendChild(labelContainer);
      }
      // [0,1] = Left (gauche)
      if (col === 0 && row === 1 && left && left.length > 0) {
        const labelContainer = document.createElement("div");
        labelContainer.style.display = "flex";
        labelContainer.style.flexDirection = "column";
        labelContainer.style.gap = "5px";
        labelContainer.style.alignItems = "flex-end"; // À gauche (col === 0)
        labelContainer.style.justifyContent = "center"; // Centrer verticalement dans la ligne centrale
        labelContainer.style.position = "relative"; // Créer un stacking context
        labelContainer.style.zIndex = Z_NODE_INTERNAL.LABEL; // TOUJOURS au-dessus des flèches

        left.forEach((labelData) => {
          const text = getLabelText(labelData);
          const dataId = getLabelDataId(labelData);
          const label = document.createElement("div");
          label.className = "flux-label";
          if (
            labelData &&
            typeof labelData === "object" &&
            typeof labelData.className === "string" &&
            labelData.className.trim()
          ) {
            label.classList.add(...labelData.className.trim().split(/\s+/));
          }
          if (dataId) label.setAttribute("data-id", dataId);
          // Si c'est un bouton, ajouter la classe buttonData
          if (nodeId) {
            const node = organigramNodes.find((n) => n.id === nodeId);
            if (
              node &&
              node.type === "button" &&
              !labelDataUsesOrganigramConfigHeading(labelData)
            ) {
              label.classList.add("buttonData");
            }
          }
          label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
          updateLabelClasses(label, nodeId);
          label.style.position = "relative"; // Créer un stacking context
          label.style.zIndex = Z_NODE_INTERNAL.LABEL + 1; // Encore plus haut que le container
          labelContainer.appendChild(label);
        });

        gridItem.appendChild(labelContainer);
      }
      // [2,1] = Right (droite)
      if (col === 2 && row === 1 && right && right.length > 0) {
        const labelContainer = document.createElement("div");
        const hasAlbedoPercents = right.some(
          (labelData) => getLabelDataId(labelData) === "albedo_percents",
        );
        labelContainer.style.display = "flex";
        labelContainer.style.flexDirection = "column";
        labelContainer.style.gap = "5px";
        // Centrer la fenetre albedo_percents dans sa case (axe X), sans toucher son contenu texte
        labelContainer.style.alignItems = hasAlbedoPercents
          ? "center"
          : "flex-start"; // À droite (col === 2)
        labelContainer.style.justifyContent = "center"; // Centrer verticalement dans la ligne centrale
        labelContainer.style.position = "relative"; // Créer un stacking context
        labelContainer.style.zIndex = Z_NODE_INTERNAL.LABEL; // TOUJOURS au-dessus des flèches
        if (hasAlbedoPercents) {
          labelContainer.style.width = "100%";
        }

        right.forEach((labelData) => {
          const text = getLabelText(labelData);
          const dataId = getLabelDataId(labelData);
          const label = document.createElement("div");
          label.className = "flux-label";
          if (
            labelData &&
            typeof labelData === "object" &&
            typeof labelData.className === "string" &&
            labelData.className.trim()
          ) {
            label.classList.add(...labelData.className.trim().split(/\s+/));
          }
          if (dataId) label.setAttribute("data-id", dataId);

          // Patch spécifique pour albedo_percents : margin-top pour aligner en haut du logo
          if (dataId === "albedo_percents") {
            label.style.marginTop = "115px";
            label.setAttribute("data-tooltip", "Détail albédo : couverture et coefficient par type (nuages, océan, glace, etc.).");
          }
          // Si c'est un bouton, ajouter la classe buttonData
          if (nodeId) {
            const node = organigramNodes.find((n) => n.id === nodeId);
            if (
              node &&
              node.type === "button" &&
              !labelDataUsesOrganigramConfigHeading(labelData)
            ) {
              label.classList.add("buttonData");
            }
          }
          label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
          updateLabelClasses(label, nodeId);
          label.style.position = "relative"; // Créer un stacking context
          label.style.zIndex = Z_NODE_INTERNAL.LABEL + 1; // Encore plus haut que le container

          // Si le texte contient <br>, permettre les retours à la ligne et éviter la coupure
          if (text && text.includes("<br>")) {
            label.style.whiteSpace = "normal";
            label.style.overflow = "visible";
            label.style.maxWidth = "none";
            label.style.width = "max-content";
          }

          labelContainer.appendChild(label);
          if ((dataId === "albedo_percents") && typeof window.addTooltipFromAttribute === "function" && !label.hasAttribute("data-tooltip-initialized")) {
            window.addTooltipFromAttribute(label);
            label.setAttribute("data-tooltip-initialized", "true");
          }
        });

                gridItem.appendChild(labelContainer);
            }
      // N'ajouter le gridItem que s'il a du contenu (coins vides et centre jamais créés)
      if (gridItem.children.length > 0) {
        cell.appendChild(gridItem);
      }
        }
    }

  // Les radiations seront créées après toutes les cellules (étape 8)
  // Pas de création de radiations ici

  // Ajouter la cellule au container
  if (!container) {
    console.error(
      "[createCell] ❌ Container non trouvé ! targetContainer=",
      targetContainer,
      "flux-diagram=",
      document.getElementById("flux-diagram"),
    );
    throw new Error("Container non trouvé pour créer la cellule");
  }
  if (typeof container.appendChild !== "function") {
    console.error(
      "[createCell] ❌ Container n'est pas un élément DOM valide !",
      container,
    );
    throw new Error("Container n'est pas un élément DOM valide");
  }
  container.appendChild(cell);

  // Créer le rectangle avec les facteurs si demandé
  if (rectangleOptions) {
    const { width, height, factors } = rectangleOptions;
    // Utiliser fillImage depuis le nœud racine (passé en paramètre)
    createRectangle(
      cell,
      width,
      height,
      factors,
      fillColor,
      strokeColor,
      fillImage,
      strokeSize,
      strokeStyle,
    );
  }

  return cell;
}

// Fonction pour créer une étiquette de flèche avec des divs
// x1, y1 : début de la flèche (partie visible)
// x2, y2 : fin de la flèche (partie visible)
function createArrowLabel(x1, y1, x2, y2, labels) {
  const container = document.getElementById("flux-diagram");

  let labelObj = {};
  if (Array.isArray(labels)) {
    labelObj = {
      name: labels[0] || "",
      txtD: labels[1] || null,
      txtF: labels[2] || null,
      txt3: labels[3] || null,
      txt4: labels[4] || null,
    };
  } else {
    labelObj = labels;
  }

  const labelPositions = [];

  const createLabel = (
    labelData,
    posX,
    posY,
    isName = false,
    size = null,
    labelType = "",
  ) => {
    if (!labelData) return null;
    // Si c'est un objet avec dataId, créer le label même si text est vide
    const dataId = getLabelDataId(labelData);
    const text = getLabelText(labelData);
    // Si pas de texte mais un dataId, créer quand même le label (sera rempli par updateLabel)
    if (!text && !dataId) return null;
    const label = document.createElement("div");
    label.className = "flux-label"; // Tous les textes des flèches
    if (dataId) label.setAttribute("data-id", dataId);
    label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
    updateLabelClasses(label, null);
    label.style.position = "absolute";
    label.style.left = posX + "px";
    // Décalage vertical : 0 pour tout le monde (centré sur la flèche)
    // L'utilisateur a clarifié que "au dessus" concernait le Z-index
    const labelOffset = 0;
    label.style.top = posY - labelOffset + "px";
    label.style.transform = "translate(-50%, -50%)";
    // Z-index: au-dessus des flèches
    label.style.zIndex = Z_LAYERS.ARROW_LABEL;
    // Si le texte contient <br>, permettre les retours à la ligne mais pas le wrapping automatique
    if (text.includes("<br>")) {
      label.style.whiteSpace = "normal";
      label.style.width = "max-content"; // Largeur selon le contenu, pas de wrapping
      label.style.maxWidth = "none"; // Pas de limite de largeur
    }
    // Si size est 'bigger' ET que c'est le name (pas txtD), agrandir le texte 2 fois et retirer border/fond
    if (size === "bigger" && isName) {
      // Taille de base : 16px (taille par défaut du navigateur)
      // Multiplier par 2 pour obtenir 32px
      label.style.fontSize = "32px";
      // Retirer border et fond
      label.style.background = "transparent";
      label.style.border = "none";
      label.style.padding = "0";
    }
    container.appendChild(label);

    // Stocker la position pour les logs
    labelPositions.push({ type: labelType, text: text, x: posX, y: posY });
    return label;
  };

  // Récupérer la taille depuis labelObj.size
  const labelSize = labelObj.size || null;

  // txtDD : avant le début de la flèche (ratio 0 ou LABEL_POSITIONS.txtDD)
  if (labelObj.txtDD) {
    const percent = LABEL_POSITIONS.txtDD != null ? LABEL_POSITIONS.txtDD : 0;
    const posX = x1 + (x2 - x1) * percent;
    const posY = y1 + (y2 - y1) * percent;
    if (Array.isArray(labelObj.txtDD)) {
      labelObj.txtDD.forEach((labelData, index) => {
        createLabel(labelData, posX, posY, false, labelSize, "txtDD");
      });
    } else {
      createLabel(labelObj.txtDD, posX, posY, false, labelSize, "txtDD");
    }
  }

  // txtD : au début de la flèche (LABEL_POSITIONS.txtD)
  if (labelObj.txtD) {
    const pos1X = x1 + (x2 - x1) * LABEL_POSITIONS.txtD;
    const pos1Y = y1 + (y2 - y1) * LABEL_POSITIONS.txtD;
    createLabel(labelObj.txtD, pos1X, pos1Y, false, labelSize, "txtD");
  }

  // name : au milieu de la flèche (50%)
  // Créer le label même si name est un objet avec dataId (même si text est vide)
  if (labelObj.name) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    // Si name est un objet avec dataId, créer le label même si text est vide
    const nameDataId =
      typeof labelObj.name === "object" ? labelObj.name.dataId : null;
    if (nameDataId || getLabelText(labelObj.name)) {
      createLabel(labelObj.name, midX, midY, true, labelSize, "name");
    }
  }

  // txtF : à la fin de la flèche (90% du chemin)
  // Peut être un objet unique, un tableau d'objets, ou une chaîne
  if (labelObj.txtF) {
    // Positionner à LABEL_POSITIONS.txtF (juste avant le bout de la flèche)
    // Note: x2, y2 sont déjà ajustés avec la marge dans createArrow
    let percent = LABEL_POSITIONS.txtF;

    // Si txtF est un tableau, créer plusieurs labels au même endroit (fin de flèche)
    if (Array.isArray(labelObj.txtF)) {
      // Vérifier si un des éléments a 'albedo_percents' pour ajuster le percent
      for (const txtFItem of labelObj.txtF) {
        const dataId = getLabelDataId(txtFItem);
        if (dataId === "albedo_percents") {
          percent = LABEL_POSITIONS.txtF_albedo;
          break;
        }
      }

      const pos2X = x1 + (x2 - x1) * percent;
      const baseY = y1 + (y2 - y1) * percent;

      // Espacer verticalement (décalage pour éviter chevauchement)
      const spacing = 18; // Espacement entre les labels
      const totalOffset = ((labelObj.txtF.length - 1) * spacing) / 2;

      labelObj.txtF.forEach((labelData, index) => {
        const pos2Y = baseY - totalOffset + index * spacing;
        createLabel(labelData, pos2X, pos2Y, false, labelSize, "txtF");
      });
    } else {
      const pos2X = x1 + (x2 - x1) * percent;
      const pos2Y = y1 + (y2 - y1) * percent;
      createLabel(labelObj.txtF, pos2X, pos2Y, false, labelSize, "txtF");
    }
  }

  // txtFF : après le bout de la flèche (LABEL_POSITIONS.txtFF > 1)
  if (labelObj.txtFF) {
    const percent = LABEL_POSITIONS.txtFF != null ? LABEL_POSITIONS.txtFF : 1.05;
    const posX = x1 + (x2 - x1) * percent;
    const posY = y1 + (y2 - y1) * percent;
    if (Array.isArray(labelObj.txtFF)) {
      labelObj.txtFF.forEach((labelData, index) => {
        createLabel(labelData, posX, posY, false, labelSize, "txtFF");
      });
    } else {
      createLabel(labelObj.txtFF, posX, posY, false, labelSize, "txtFF");
    }
  }

  // txt3 (à gauche) et txt4 (à droite) - relatifs au milieu
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  if (labelObj.txt3) {
    createLabel(labelObj.txt3, midX - 60, midY, false, null, "txt3");
  }
  if (labelObj.txt4) {
    createLabel(labelObj.txt4, midX + 60, midY, false, null, "txt4");
  }

  return labelPositions;
}

// Fonction pour créer une flèche avec des divs
function createArrow(
  x1,
  y1,
  x2,
  y2,
  zIndex = Z_LAYERS.ARROW,
  color = "#667eea",
) {
  const container = document.getElementById("flux-diagram");
  const arrow = document.createElement("div");
  arrow.className = "flux-arrow";

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  arrow.style.position = "absolute";
  arrow.style.zIndex = zIndex !== undefined ? zIndex : Z_LAYERS.ARROW; // Utiliser la constante ou la valeur passée
  arrow.style.left = x1 + "px";
  arrow.style.top = y1 + "px";
  arrow.style.width = length + "px";
  arrow.style.height = "3px";
  arrow.style.transformOrigin = "0 50%";
  arrow.style.transform = `rotate(${angle}deg)`;
  arrow.style.background = color; // Couleur personnalisable

  // Pointe de flèche à la fin de la flèche (point d'arrivée)
  const arrowhead = document.createElement("div");
  arrowhead.style.position = "absolute";
  arrowhead.style.right = "-8px";
  arrowhead.style.top = "50%";
  arrowhead.style.transform = "translateY(-50%)";
  arrowhead.style.width = "0";
  arrowhead.style.height = "0";
  // La pointe pointe vers la droite par défaut, elle sera tournée avec la flèche
  arrowhead.style.borderLeft = `8px solid ${color}`; // Couleur personnalisable
  arrowhead.style.borderTop = "5px solid transparent";
  arrowhead.style.borderBottom = "5px solid transparent";
  arrow.appendChild(arrowhead);

  container.appendChild(arrow);
  return arrow;
}

// Fonction pour créer une sphère concentrique
function createSphere(cx, cy, r, opacity, container = null) {
  if (!container) {
    const mainContainer = document.getElementById("flux-diagram");
    container = mainContainer.querySelector(".flux-radiation-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "flux-radiation-container";
      container.style.zIndex = Z_LAYERS.RADIATION;
      mainContainer.appendChild(container);
    }
  }
  const sphere = document.createElement("div");
  sphere.className = "flux-sphere";
  sphere.style.left = cx - r + "px";
  sphere.style.top = cy - r + "px";
  sphere.style.width = r * 2 + "px";
  sphere.style.height = r * 2 + "px";
  // Pas besoin de border ici, défini en CSS avec currentColor
  sphere.style.opacity = opacity;
  container.appendChild(sphere);
  return sphere;
}

// radiation (config) : angleFinal = ouverture cible (même sémantique que openingAngle) ; angleInit = 1er rendu ;
// radius = alias de maxRadius si maxRadius absent. angleAnimMs = durée lerp init→final (0 = saut instantané).
function normalizeRadiationOptionAliases(radiationOptions) {
  if (
    !radiationOptions ||
    typeof radiationOptions !== "object" ||
    Array.isArray(radiationOptions)
  ) {
    return;
  }
  if (
    radiationOptions.openingAngle === undefined &&
    radiationOptions.angleFinal !== undefined
  ) {
    radiationOptions.openingAngle = radiationOptions.angleFinal;
  }
  if (
    radiationOptions.maxRadius === undefined &&
    radiationOptions.radius !== undefined
  ) {
    radiationOptions.maxRadius = radiationOptions.radius;
  }
}

// openingAngle : angle « découpé » (masqué) ; secteur visible = 360 − openingAngle (cf. commentaires createArc historiques)
function setArcClipPath(arc, r, openingAngle, rotation) {
  const visibleAngle = 360 - openingAngle;
  const startAngleMath = rotation - visibleAngle / 2;
  const clipPoints = [];
  const centerX = r;
  const centerY = r;
  clipPoints.push(`${centerX}px ${centerY}px`);
  const numPoints = 32;
  for (let i = 0; i <= numPoints; i++) {
    const angle =
      ((startAngleMath + (visibleAngle * i) / numPoints) * Math.PI) / 180;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    clipPoints.push(`${x}px ${y}px`);
  }
  arc.style.clipPath = `polygon(${clipPoints.join(", ")})`;
}

function runRadiationOpeningAnimation(
  arc,
  r,
  openingInit,
  openingFinal,
  rotation,
  durationMs,
) {
  if (openingInit === openingFinal || durationMs <= 0) {
    setArcClipPath(arc, r, openingFinal, rotation);
    return;
  }
  setArcClipPath(arc, r, openingInit, rotation);
  function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  }
  requestAnimationFrame(() => {
    const t0 = performance.now();
    function frame(now) {
      const u = Math.min(1, (now - t0) / durationMs);
      const opening =
        openingInit + (openingFinal - openingInit) * easeOutQuad(u);
      setArcClipPath(arc, r, opening, rotation);
      if (u < 1) {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  });
}

function resolveRadiationArcParams(radiationOptions, legacyDefaults = {}) {
  normalizeRadiationOptionAliases(radiationOptions);
  const numCircles =
    radiationOptions.numCircles ?? legacyDefaults.numCircles ?? 8;
  const maxR =
    radiationOptions.maxRadius !== undefined &&
    radiationOptions.maxRadius !== null
      ? radiationOptions.maxRadius
      : radiationOptions.radius;
  const openingLegacy = radiationOptions.openingAngle;
  const angleFinal = radiationOptions.angleFinal;
  const openingFinal =
    angleFinal !== undefined
      ? angleFinal
      : openingLegacy !== undefined
        ? openingLegacy
        : legacyDefaults.openingAngle !== undefined
          ? legacyDefaults.openingAngle
          : 270;
  const openingInit =
    radiationOptions.angleInit !== undefined
      ? radiationOptions.angleInit
      : openingFinal;
  const angleAnimMs =
    radiationOptions.angleAnimMs !== undefined
      ? radiationOptions.angleAnimMs
      : 480;
  const rotation = radiationOptions.rotation ?? legacyDefaults.rotation ?? 270;
  const color = radiationOptions.color ?? legacyDefaults.color ?? "#ff9800";
  const strokeSize =
    radiationOptions.strokeSize ?? legacyDefaults.strokeSize ?? 2;
  return {
    numCircles,
    maxRadius: maxR,
    openingInit,
    openingFinal,
    angleAnimMs,
    rotation,
    color,
    strokeSize,
  };
}

// Fonction pour créer un arc de cercle (comme createSphere mais avec ouverture)
// Le paramètre container peut être un élément DOM ou undefined (cherchera le container par défaut)
function createArc(
  cx,
  cy,
  r,
  opacity,
  openingAngle = 0,
  rotation = 270,
  container = null,
) {
  if (!container) {
    const mainContainer = document.getElementById("flux-diagram");
    container = mainContainer.querySelector(".flux-radiation-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "flux-radiation-container";
      container.style.zIndex = Z_LAYERS.RADIATION;
      mainContainer.appendChild(container);
    }
  }
  const arc = document.createElement("div");
  arc.className = "flux-sphere"; // Utilise la même classe que createSphere

  // Positionner comme createSphere
  arc.style.left = cx - r + "px";
  arc.style.top = cy - r + "px";
  arc.style.width = r * 2 + "px";
  arc.style.height = r * 2 + "px";
  // Pas besoin de border ici, défini en CSS avec currentColor
  arc.style.opacity = opacity;

  // openingAngle : secteur masqué ; rotation : axe du secteur visible (0° = droite, 90° = haut, …)
  setArcClipPath(arc, r, openingAngle, rotation);

  container.appendChild(arc);
  return arc;
}

// Les données de configuration (nodes, arcs, constantes) sont définies dans configOrganigramme.js
// Ce fichier doit être chargé avant organigramme.js

// Fonction pour calculer les positions Y automatiquement
function calculatePositions() {
  // O(1) — copies locales (noms cfg* pour éviter tout conflit avec organigramNodes au niveau script)
  const cfgNodes =
    typeof window !== "undefined" &&
    window.configOrganigramme &&
    window.configOrganigramme.nodes
      ? window.configOrganigramme.nodes
      : [];
  const cfgArcs =
    typeof window !== "undefined" &&
    window.configOrganigramme &&
    window.configOrganigramme.arcs
      ? window.configOrganigramme.arcs
      : [];
  if (cfgNodes.length === 0) {
    console.warn(
      "[calculatePositions] ⚠️ WARNING - nodes non disponible, positions non calculées",
    );
    return;
  }
  const nodeMap = {};
  cfgNodes.forEach((node) => (nodeMap[node.id] = node));

  // Fonction récursive pour calculer les positions
  function calculateY(nodeId, visited = new Set()) {
    if (visited.has(nodeId)) {
      return nodeMap[nodeId].y || 50;
    }
    visited.add(nodeId);

    const node = nodeMap[nodeId];
    if (node.y !== null) return node.y;

    // Trouver tous les arcs entrants
    const incomingArcs = cfgArcs.filter((arc) => arc.to === nodeId);
    let maxY = node.y || 50;

    if (incomingArcs.length > 0) {
      incomingArcs.forEach((arc) => {
        const sourceY = calculateY(arc.from, new Set(visited));
        const arcSpacing = arc.label ? spacingSizes.medium : spacingSizes.short;
        // Bas de la source + espacement + haut de destination = centre destination
        const newY = sourceY + cellHalfHeight + arcSpacing + cellHalfHeight;
        if (newY > maxY) maxY = newY;
      });
    }

    node.y = maxY;
    return maxY;
  }

  // Calculer toutes les positions
  cfgNodes.forEach((node) => {
    if (node.y === null) {
      calculateY(node.id, new Set());
    }
  });
}

// Couleur rgba/rgb → #RRGGBB (opaque) pour stroke = même teinte que fill
function rgbaToOpaqueHex(cssColor) {
  if (!cssColor || typeof cssColor !== "string") return null;
  const rgba = cssColor.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgba) {
    const r = parseInt(rgba[1], 10);
    const g = parseInt(rgba[2], 10);
    const b = parseInt(rgba[3], 10);
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  if (/^#[0-9A-Fa-f]{3,8}$/.test(cssColor)) return cssColor;
  return null;
}

// Fonction helper pour récupérer les propriétés d'un node (gère 'terre' et 'albedo' avec tableau epoch)
function getNodeProperty(node, property, defaultValue = null) {
  if (!node) return defaultValue;

  if ((node.id === "terre" || node.id === "albedo") && node.epoch && Array.isArray(node.epoch)) {
    const currentEpochName =
      (typeof window !== "undefined" && window.currentEpochName) ||
      "Corps Noir";
    const epochConfig = node.epoch.find(
      (e) => e.epochName === currentEpochName,
    );

    if (epochConfig && epochConfig.hasOwnProperty(property)) {
      return epochConfig[property];
    } else if (node.epoch.length > 0) {
      // Fallback : dernière époque du tableau (permet d'alléger les répétitions)
      const lastEpoch = node.epoch[node.epoch.length - 1];
      if (lastEpoch && lastEpoch.hasOwnProperty(property)) {
        return lastEpoch[property];
      }
    }
  }

  // Propriété directe du node
  return node.hasOwnProperty(property) ? node[property] : defaultValue;
}

// Fonction pour générer automatiquement les flèches à partir du graphe
function generateArrows() {
  // Supprimer les anciennes flèches et étiquettes avant de les recréer
  const container = document.getElementById("flux-diagram");
  if (container) {
    const oldArrows = container.querySelectorAll(".flux-arrow");
    oldArrows.forEach((arrow) => arrow.remove());
    // Supprimer aussi les étiquettes des flèches (elles sont créées avec createArrowLabel)
    const oldLabels = container.querySelectorAll(".flux-label");
    oldLabels.forEach((label) => {
      // Ne supprimer que les étiquettes des flèches, pas celles des cellules
      if (!label.closest(".flux-grid-item")) {
        label.remove();
      }
    });
  }

  organigramArcs.forEach((arc) => {
    // Mise à jour dynamique de la hauteur de l'atmosphère (Terre -> Albedo)
    if (arc.from === "terre" && arc.to === "albedo" && arc.label) {
      let atm_height_km = 0;
      const isCorpsNoir = isBlackBodyEpoch();

      if (!isCorpsNoir) {
        let total_mass = 0;
        let gravity = 9.81; // Défaut temporaire, devrait venir de l'époque
        let molar_mass_air = undefined;

        if (window.currentEpochName) {
          let currentEpoch = null;
          if (typeof window.getGeologicalPeriodByName === "function") {
            currentEpoch = window.getGeologicalPeriodByName(
              window.currentEpochName,
            );
          } else if (
            window.configOrganigramme &&
            window.configOrganigramme.timeline
          ) {
            currentEpoch = window.configOrganigramme.timeline.find(
              (e) =>
                e.type === "epoch" &&
                (e.name === window.currentEpochName ||
                  e.id === window.currentEpochName),
            );
          } else if (window.TIMELINE) {
            currentEpoch = window.TIMELINE.find(
              (e) =>
                e["📅"] === window.currentEpochName ||
                (window.CHARS_DESC &&
                  window.CHARS_DESC[e["📅"]] === window.currentEpochName),
            );
          }
          if (currentEpoch) {
            total_mass =
              currentEpoch.total_atmosphere_mass_kg ??
              currentEpoch["⚖️🫧"] ??
              total_mass;
            gravity = currentEpoch.gravity ?? currentEpoch["🍎"] ?? gravity;
            if (currentEpoch.molar_mass_air !== undefined) {
              molar_mass_air = currentEpoch.molar_mass_air;
            } else if (typeof window.calculateMolarMassAir === "function") {
              molar_mass_air = window.calculateMolarMassAir(currentEpoch);
            }
          }
        }

        // Récupérer T0 si disponible globalement
        const T0 =
          typeof window.T0_num !== "undefined" && window.T0_num > 0
            ? window.T0_num
            : 288;

        // Estimation de la masse molaire moyenne (M) si toujours undefined
        if (molar_mass_air === undefined || molar_mass_air === 0) {
          const isMassive = total_mass > 2.5e19;
          molar_mass_air = isMassive ? 0.044 : 0.029;
        }

        // Vérifier que T0 est valide (> 0) avant l'appel
        if (T0 > 0 && molar_mass_air > 0) {
          const props = window.calculateAtmosphereProperties(
            total_mass,
            T0,
            molar_mass_air,
            gravity,
          );
          atm_height_km = props.z_max / 1000;
        }

        // txtF est maintenant un objet avec dataId dans la config, sera mis à jour par updateFluxLabels
        // Ne rien faire ici, updateFluxLabels s'en chargera
      } else {
        // Pas d'atmosphère : txtF sera mis à jour à "0 km" par updateFluxLabels via updateLabel
      }
    }

    const idDep = organigramNodes.find((n) => n.id === arc.from);
    const idDest = organigramNodes.find((n) => n.id === arc.to);

    if (!idDep || !idDest) return;

    // Centre effectif du nœud départ : avec option fromCenterOffset sur l'arc on décale le point utilisé pour la direction (sans bouger le nœud).
    const fromX = idDep.x + (arc.fromCenterOffset ? arc.fromCenterOffset.x : 0);
    const fromY = idDep.y + (arc.fromCenterOffset ? arc.fromCenterOffset.y : 0);
    // Vecteur depuis ce centre vers la destination (détermine la direction de la flèche).
    const Vect = {
      x: idDest.x - fromX,
      y: idDest.y - fromY,
    };

    // Normaliser le vecteur
    const length = Math.sqrt(Vect.x * Vect.x + Vect.y * Vect.y);

    // Calculer le vecteur unitaire avec atan2 (toujours)
    if (length < 0.1) {
      // Si les centres sont vraiment au même point (< 0.1px), ne pas créer de flèche
      return;
    }

    // Utiliser le vecteur entre les centres pour calculer l'angle
    const unitX = Vect.x / length;
    const unitY = Vect.y / length;

    // Angle en radians puis en degrés (pour détection de direction uniquement)
    const angleRad = Math.atan2(Vect.y, Vect.x);
    const angleDeg = (angleRad * 180) / Math.PI;

    // Point de départ (x1, y1) : sur le bord du cercle ou rectangle source
    let x1, y1;
    if (idDep.rectangle) {
      // Rectangle : calculer l'intersection avec le bord selon l'angle
      const { width, height } = idDep.rectangle;
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      // Calculer l'intersection de la ligne depuis le centre vers la destination avec le bord du rectangle
      // Utiliser la méthode de ligne paramétrique
      const tValues = [];
      // Bord droit : x = idDep.x + halfWidth
      if (Math.abs(Vect.x) > 0.001) {
        const t = halfWidth / Vect.x;
        const y = Vect.y * t;
        if (Math.abs(y) <= halfHeight)
          tValues.push({
            t,
            side: "right",
            x: idDep.x + halfWidth,
            y: idDep.y + y,
          });
      }
      // Bord gauche : x = idDep.x - halfWidth
      if (Math.abs(Vect.x) > 0.001) {
        const t = -halfWidth / Vect.x;
        const y = Vect.y * t;
        if (Math.abs(y) <= halfHeight)
          tValues.push({
            t,
            side: "left",
            x: idDep.x - halfWidth,
            y: idDep.y + y,
          });
      }
      // Bord haut : y = idDep.y - halfHeight
      if (Math.abs(Vect.y) > 0.001) {
        const t = -halfHeight / Vect.y;
        const x = Vect.x * t;
        if (Math.abs(x) <= halfWidth)
          tValues.push({
            t,
            side: "top",
            x: idDep.x + x,
            y: idDep.y - halfHeight,
          });
      }
      // Bord bas : y = idDep.y + halfHeight
      if (Math.abs(Vect.y) > 0.001) {
        const t = halfHeight / Vect.y;
        const x = Vect.x * t;
        if (Math.abs(x) <= halfWidth)
          tValues.push({
            t,
            side: "bottom",
            x: idDep.x + x,
            y: idDep.y + halfHeight,
          });
      }

      // Prendre le point avec le plus petit t positif (le plus proche dans la direction)
      const validT = tValues.filter((tv) => tv.t > 0);
      if (validT.length > 0) {
        const closest = validT.reduce((min, tv) => (tv.t < min.t ? tv : min));
        x1 = closest.x;
        y1 = closest.y;
      } else {
        // Fallback : utiliser le centre
        x1 = idDep.x;
        y1 = idDep.y;
      }
    } else {
      // Cercle : point sur le bord selon le vecteur normalisé (utiliser le radius + bordure du nœud source)
      // Utiliser le radius même si strokeColor est vide (cercle transparent)
      const sourceRadius = getNodeProperty(idDep, "radius", radius);
      const sourceStrokeSize = getNodeProperty(idDep, "strokeSize", 4);
      const depStrokeColor = getNodeProperty(idDep, "strokeColor", "");
      // Si strokeColor est défini, utiliser strokeSize, sinon utiliser juste le radius
      const sourceRadiusOuter =
        depStrokeColor && depStrokeColor.trim() !== ""
          ? sourceRadius + sourceStrokeSize / 2
          : sourceRadius;
      x1 = idDep.x + sourceRadiusOuter * unitX;
      y1 = idDep.y + sourceRadiusOuter * unitY;
    }

    // Point d'arrivée (x2, y2) : selon l'angle et la présence d'étiquettes
    let x2, y2;

    // Déterminer la direction selon l'angle
    // Math.atan2 retourne un angle entre -180° et 180°
    // Utiliser la composante Y du vecteur pour déterminer la direction verticale (plus fiable)
    const isGoingUp = Vect.y < 0; // Vect.y négatif = vers le haut
    const isGoingDown = Vect.y > 0; // Vect.y positif = vers le bas
    // Vérifier si l'angle est assez vertical pour appliquer la logique des étiquettes
    // Angle absolu entre 45° et 135° = assez vertical (pas trop horizontal)
    const absAngle = Math.abs(angleDeg);
    const isVerticalEnough = absAngle > 45 && absAngle < 135;

    // Vérifier si la destination a des étiquettes
    const hasTop =
      idDest.top && Array.isArray(idDest.top) && idDest.top.length > 0;
    const hasBottom =
      idDest.bottom && Array.isArray(idDest.bottom) && idDest.bottom.length > 0;

    // Calculer la demi-hauteur de la grille pour ce nœud (basée sur le CERCLE uniquement, pas le logo)
    const destRadius = getNodeProperty(idDest, "radius", radius);
    const destStrokeSize = getNodeProperty(idDest, "strokeSize", 4);
    const destStrokeColor = getNodeProperty(idDest, "strokeColor", "");
    // Un nœud a un cercle si strokeColor est défini ET non vide, OU si radius est défini (même sans strokeColor visible)
    // Les nœuds espace ont un radius mais strokeColor vide, ils ont quand même un cercle (transparent)
    const destHasCircle =
      (destStrokeColor && destStrokeColor.trim() !== "") ||
      (destRadius && destRadius > 0);
    // Calculer le radius extérieur : si strokeColor existe, ajouter strokeSize/2, sinon utiliser juste le radius
    const destRadiusOuter =
      destStrokeColor && destStrokeColor.trim() !== ""
        ? destRadius + destStrokeSize / 2
        : destRadius;
    const destCircleDiameter = destHasCircle ? destRadius * 2 : 0;
    // Pour les nœuds sans cercle, calculer la taille approximative du logo
    const destLogoScale = idDest.logoScale || 1.4;
    const destLogoRadius = destRadius * destLogoScale * 0.5; // Approximation du "rayon" du logo
    // Pour les étiquettes, utiliser uniquement la taille du cercle (le logo peut dépasser)
    // Mais utiliser la taille réelle de la grille si disponible depuis le DOM
    let destCentralCellSize = destCircleDiameter > 0 ? destCircleDiameter : 50;
    // Essayer de lire la taille réelle de la grille depuis le DOM
    const destCellElement = document.getElementById("cell-" + idDest.id);
    if (destCellElement) {
      const computedStyle = window.getComputedStyle(destCellElement);
      const gridTemplateRows = computedStyle.gridTemplateRows;
      if (gridTemplateRows && gridTemplateRows !== "none") {
        const rows = gridTemplateRows.split(" ");
        if (rows.length >= 2) {
          const centralRowHeight = parseFloat(rows[1]);
          if (!isNaN(centralRowHeight)) {
            destCentralCellSize = centralRowHeight;
          }
        }
      }
    }
    const destCellHalfHeight = (25 + destCentralCellSize + 20) / 2; // Hauteur totale / 2

    // Calculer le rayon source pour les cercles concentriques
    const sourceRadius = getNodeProperty(idDep, "radius", radius);
    const sourceStrokeSize = getNodeProperty(idDep, "strokeSize", 4);
    const depStrokeColor = getNodeProperty(idDep, "strokeColor", "");
    // Un nœud a un cercle si strokeColor est défini ET non vide, OU si radius est défini (même sans strokeColor visible)
    const sourceHasCircle =
      (depStrokeColor && depStrokeColor.trim() !== "") ||
      (sourceRadius && sourceRadius > 0);
    const sourceRadiusOuter = sourceHasCircle
      ? depStrokeColor && depStrokeColor.trim() !== ""
        ? sourceRadius + sourceStrokeSize / 2
        : sourceRadius
      : 0;

    // Détecter si les cercles sont concentriques (centres très proches)
    // Si concentriques : ne pas inverser le vecteur (aller dans le sens du vecteur)
    // Si normaux : inverser le vecteur (arriver au bord proche)
    const isConcentric = length < 10; // Distance entre centres < 10px = concentriques
    const sign = isConcentric ? 1 : -1; // Concentriques: pas d'inversion, Normaux: inversion

    // Pour les cercles concentriques, calculer la longueur avec abs(delta rayon)
    const deltaRadius = isConcentric
      ? Math.abs(destRadius - sourceRadius)
      : null;

    if (isGoingUp && isVerticalEnough) {
      // Flèche vers le haut (assez verticale)
      // Pour les cercles concentriques, utiliser le calcul avec deltaRadius (prioritaire)
      if (
        isConcentric &&
        deltaRadius !== null &&
        destHasCircle &&
        !idDest.rectangle
      ) {
        // Cercles concentriques : utiliser abs(delta rayon) comme longueur depuis le point de départ
        x2 = x1 + deltaRadius * unitX;
        y2 = y1 + deltaRadius * unitY;
      } else if (hasBottom) {
        // Arriver au bas de la grille (où se trouve txt1)
        const gridY = idDest.y + destCellHalfHeight;
        // Calculer l'intersection depuis (x1, y1) vers le centre de destination, avec y = gridY
        // Utiliser le vecteur depuis (x1, y1) vers (idDest.x, idDest.y)
        const vecFromStart = {
          x: idDest.x - x1,
          y: idDest.y - y1,
        };
        if (Math.abs(vecFromStart.y) > 0.001) {
          const t = (gridY - y1) / vecFromStart.y;
          x2 = x1 + vecFromStart.x * t;
          y2 = gridY;
        } else {
          x2 = x1;
          y2 = gridY;
        }
      } else {
        // Arriver au bord du fond dessiné (cercle ou rectangle)
        if (idDest.rectangle) {
          const { width, height } = idDest.rectangle;
          const halfWidth = width / 2;
          const halfHeight = height / 2;
          // Intersection avec le bord bas du rectangle
          const bottomY = idDest.y + halfHeight;
          if (Math.abs(Vect.y) > 0.001) {
            const t = (bottomY - y1) / Vect.y;
            const x = x1 + Vect.x * t;
            if (Math.abs(x - idDest.x) <= halfWidth) {
              x2 = x;
              y2 = bottomY;
            } else {
              // Intersection avec un bord latéral
              if (x > idDest.x) {
                x2 = idDest.x + halfWidth;
                y2 =
                  idDest.y +
                  (halfWidth - (Vect.x * (x1 - idDest.x)) / Vect.x) *
                    (Vect.y / Vect.x);
              } else {
                x2 = idDest.x - halfWidth;
                y2 =
                  idDest.y +
                  (-halfWidth - (Vect.x * (x1 - idDest.x)) / Vect.x) *
                    (Vect.y / Vect.x);
              }
            }
          } else {
            x2 = x1;
            y2 = bottomY;
          }
        } else {
          // Pas d'étiquette : arriver au bord du cercle OU à la surface du logo
          if (!destHasCircle) {
            // Pas de cercle visible : arriver à la surface du logo (pas au centre)
            // sign = -1 pour inverser (bord proche), sign = 1 pour concentriques
            x2 = idDest.x + sign * destLogoRadius * unitX;
            y2 = idDest.y + sign * destLogoRadius * unitY;
          } else {
            // Cercle : intersection avec le bord bas (utiliser le radius + bordure)
            const bottomY = idDest.y + destRadiusOuter;
            if (Math.abs(Vect.y) > 0.001) {
              const t = (bottomY - y1) / Vect.y;
              x2 = x1 + Vect.x * t;
              y2 = bottomY;
            } else {
              x2 = idDest.x;
              y2 = bottomY;
            }
          }
        }
      }
    } else if (isGoingDown && isVerticalEnough) {
      // Flèche vers le bas (assez verticale)
      // Pour les cercles concentriques, utiliser le calcul avec deltaRadius (prioritaire)
      if (
        isConcentric &&
        deltaRadius !== null &&
        destHasCircle &&
        !idDest.rectangle
      ) {
        // Cercles concentriques : utiliser abs(delta rayon) comme longueur depuis le point de départ
        x2 = x1 + deltaRadius * unitX;
        y2 = y1 + deltaRadius * unitY;
      } else if (hasTop) {
        // Arriver au haut de la grille (où se trouve top)
        const gridY = idDest.y - destCellHalfHeight;
        // Calculer l'intersection depuis (x1, y1) vers le centre de destination, avec y = gridY
        // Utiliser le vecteur depuis (x1, y1) vers (idDest.x, idDest.y)
        const vecFromStart = {
          x: idDest.x - x1,
          y: idDest.y - y1,
        };
        if (Math.abs(vecFromStart.y) > 0.001) {
          const t = (gridY - y1) / vecFromStart.y;
          x2 = x1 + vecFromStart.x * t;
          y2 = gridY;
        } else {
          x2 = x1;
          y2 = gridY;
        }
      } else {
        // Arriver au bord du fond dessiné (cercle ou rectangle)
        if (idDest.rectangle) {
          const { width, height } = idDest.rectangle;
          const halfWidth = width / 2;
          const halfHeight = height / 2;
          // Intersection avec le bord haut du rectangle
          const topY = idDest.y - halfHeight;
          if (Math.abs(Vect.y) > 0.001) {
            const t = (topY - y1) / Vect.y;
            const x = x1 + Vect.x * t;
            if (Math.abs(x - idDest.x) <= halfWidth) {
              x2 = x;
              y2 = topY;
            } else {
              // Intersection avec un bord latéral
              if (x > idDest.x) {
                x2 = idDest.x + halfWidth;
                y2 = idDest.y - halfHeight;
              } else {
                x2 = idDest.x - halfWidth;
                y2 = idDest.y - halfHeight;
              }
            }
          } else {
            x2 = x1;
            y2 = topY;
          }
        } else {
          // Pas d'étiquette : arriver au bord du cercle OU à la surface du logo
          if (!destHasCircle) {
            // Pas de cercle visible : arriver à la surface du logo (pas au centre)
            // sign = -1 pour inverser (bord proche), sign = 1 pour concentriques
            x2 = idDest.x + sign * destLogoRadius * unitX;
            y2 = idDest.y + sign * destLogoRadius * unitY;
          } else {
            // Cercle
            if (isConcentric && deltaRadius !== null) {
              // Cercles concentriques : utiliser abs(delta rayon) comme longueur depuis le point de départ
              x2 = x1 + deltaRadius * unitX;
              y2 = y1 + deltaRadius * unitY;
            } else {
              // Cercles normaux : sign = -1 pour inverser (bord proche)
              x2 = idDest.x + sign * destRadiusOuter * unitX;
              y2 = idDest.y + sign * destRadiusOuter * unitY;
            }
          }
        }
      }
    } else {
      // Flèche horizontale ou autre : arriver au bord du fond dessiné
      if (idDest.rectangle) {
        const { width, height } = idDest.rectangle;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        // Calculer l'intersection avec le rectangle
        const tValues = [];
        // Bord droit
        if (Math.abs(Vect.x) > 0.001) {
          const t = (halfWidth - (x1 - idDest.x)) / Vect.x;
          const y = y1 + Vect.y * t - idDest.y;
          if (Math.abs(y) <= halfHeight && t > 0)
            tValues.push({ t, x: idDest.x + halfWidth, y: idDest.y + y });
        }
        // Bord gauche
        if (Math.abs(Vect.x) > 0.001) {
          const t = (-halfWidth - (x1 - idDest.x)) / Vect.x;
          const y = y1 + Vect.y * t - idDest.y;
          if (Math.abs(y) <= halfHeight && t > 0)
            tValues.push({ t, x: idDest.x - halfWidth, y: idDest.y + y });
        }
        // Bord haut
        if (Math.abs(Vect.y) > 0.001) {
          const t = (-halfHeight - (y1 - idDest.y)) / Vect.y;
          const x = x1 + Vect.x * t - idDest.x;
          if (Math.abs(x) <= halfWidth && t > 0)
            tValues.push({ t, x: idDest.x + x, y: idDest.y - halfHeight });
        }
        // Bord bas
        if (Math.abs(Vect.y) > 0.001) {
          const t = (halfHeight - (y1 - idDest.y)) / Vect.y;
          const x = x1 + Vect.x * t - idDest.x;
          if (Math.abs(x) <= halfWidth && t > 0)
            tValues.push({ t, x: idDest.x + x, y: idDest.y + halfHeight });
        }

        if (tValues.length > 0) {
          const closest = tValues.reduce((min, tv) =>
            tv.t < min.t ? tv : min,
          );
          x2 = closest.x;
          y2 = closest.y;
        } else {
          // Fallback : utiliser le vecteur inversé avec les dimensions du rectangle
          x2 = idDest.x - halfWidth * unitX;
          y2 = idDest.y - halfHeight * unitY;
        }
      } else {
        // Flèche horizontale ou autre : arriver au bord du cercle OU à la surface du logo
        if (!destHasCircle) {
          // Pas de cercle visible : arriver à la surface du logo (pas au centre)
          // sign = -1 pour inverser (bord proche), sign = 1 pour concentriques
          x2 = idDest.x + sign * destLogoRadius * unitX;
          y2 = idDest.y + sign * destLogoRadius * unitY;
        } else {
          // Cercle visible
          if (isConcentric && deltaRadius !== null) {
            // Cercles concentriques : utiliser abs(delta rayon) comme longueur depuis le point de départ
            x2 = x1 + deltaRadius * unitX;
            y2 = y1 + deltaRadius * unitY;
          } else {
            // Cercles normaux : sign = -1 pour inverser (bord proche)
            x2 = idDest.x + sign * destRadiusOuter * unitX;
            y2 = idDest.y + sign * destRadiusOuter * unitY;
          }
        }
      }
    }

    // Recalculer la distance réelle entre les points de départ et d'arrivée
    const realDx = x2 - x1;
    const realDy = y2 - y1;
    const realLength = Math.sqrt(realDx * realDx + realDy * realDy);

    // Vérifier si on arrive au centre (plus utilisé maintenant, toutes les flèches arrivent au bord)
    const arrivesAtCenter = false; // Plus utilisé, toutes les flèches arrivent au bord avec marge

    // Vecteur unitaire pour les marges (basé sur la distance réelle)
    const realUnitX = realLength > 0.001 ? realDx / realLength : 0;
    const realUnitY = realLength > 0.001 ? realDy / realLength : 0;

    // Déplacer les points le long de la direction par la marge
    // Pour raccourcir la flèche, on doit déplacer le point d'arrivée dans la direction opposée au vecteur
    // Utiliser une marge fixe en pixels au lieu d'un pourcentage de la longueur
    // Cela garantit que les flèches ne touchent jamais le cercle, même pour des flèches longues
    // Pour les rectangles, utiliser une marge plus grande car ils sont plus grands
    const marginPixels = idDest.rectangle ? 20 : 8; // Marge plus grande pour les rectangles
    const marginEnd = arrivesAtCenter ? 0 : marginPixels;
    const finalX1 = x1 + realUnitX * 0;
    const finalY1 = y1 + realUnitY * 0;
    // Pour reculer depuis le bord du cercle, on doit aller dans la direction opposée au vecteur
    // Donc on soustrait la marge : x2 - realUnitX * marginEnd (car realUnitX pointe vers le cercle)
    const finalX2 = x2 - realUnitX * marginEnd;
    const finalY2 = y2 - realUnitY * marginEnd;

    // Les flèches utilisent le z-index de l'arc si défini, sinon Z_LAYERS.ARROW par défaut
    const arrowZIndex = arc.zIndex !== undefined ? arc.zIndex : Z_LAYERS.ARROW;
    // Couleur : arc.color > strokeColor du cercle de départ > bleu standard
    const arrowColor =
      arc.color ||
      (idDep.strokeColor && idDep.strokeColor.trim() !== ""
        ? idDep.strokeColor
        : "#667eea");

    const arrow = createArrow(
      finalX1,
      finalY1,
      finalX2,
      finalY2,
      arrowZIndex,
      arrowColor,
    );

    // Log des coordonnées de la flèche
    // Logs de debug des flèches désactivés
    // console.log(`=== FLÈCHE ${arc.from} → ${arc.to} ===`);
    // console.log(`Coordonnées flèche: début (${finalX1.toFixed(1)}, ${finalY1.toFixed(1)}), fin (${finalX2.toFixed(1)}, ${finalY2.toFixed(1)})`);
    // console.log(`Distance: ${Math.sqrt((finalX2 - finalX1) ** 2 + (finalY2 - finalY1) ** 2).toFixed(1)}px`);

    // Ajouter l'étiquette de flèche si présente
    if (arc.label) {
      // Calculer le milieu de la partie visible de la flèche
      // Si le nœud de départ a des étiquettes, elles peuvent masquer une partie de la flèche
      let visibleX1 = finalX1;
      let visibleY1 = finalY1;
      let visibleX2 = finalX2;
      let visibleY2 = finalY2;

      // Vérifier si le nœud de départ a des étiquettes qui pourraient masquer la flèche
      const hasLeftLabels = idDep.left && idDep.left.length > 0;
      const hasRightLabels = idDep.right && idDep.right.length > 0;
      const hasTopLabel =
        idDep.top && Array.isArray(idDep.top) && idDep.top.length > 0;
      const hasBottomLabel =
        idDep.bottom && Array.isArray(idDep.bottom) && idDep.bottom.length > 0;

      if (hasLeftLabels || hasRightLabels || hasTopLabel || hasBottomLabel) {
        // Estimer la taille approximative d'une étiquette (largeur/hauteur moyenne)
        // Les étiquettes ont généralement une largeur d'environ 60-80px et une hauteur d'environ 20-30px
        const labelWidth = 70; // Largeur approximative
        const labelHeight = 25; // Hauteur approximative

        // Calculer le vecteur unitaire de la flèche
        const arrowDx = finalX2 - finalX1;
        const arrowDy = finalY2 - finalY1;
        const arrowLength = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy);
        const arrowUnitX = arrowLength > 0.001 ? arrowDx / arrowLength : 0;
        const arrowUnitY = arrowLength > 0.001 ? arrowDy / arrowLength : 0;

        // Calculer la distance masquée selon la direction de la flèche
        let hiddenDistance = 0;

        // Si la flèche part vers la gauche et qu'il y a des étiquettes à gauche
        if (arrowUnitX < -0.5 && hasLeftLabels) {
          hiddenDistance = labelWidth;
        }
        // Si la flèche part vers la droite et qu'il y a des étiquettes à droite
        // MAIS : pour soleil->geometrie, la flèche part vers la droite mais les étiquettes sont à droite,
        // donc elles ne masquent pas le début de la flèche (la flèche part du bord gauche du soleil)
        else if (arrowUnitX > 0.5 && hasRightLabels) {
          // Ne pas ajuster si la flèche part vers la droite : les étiquettes à droite ne masquent pas le début
          // (elles sont après le point de départ)
          hiddenDistance = 0;
        }
        // Si la flèche part vers le haut et qu'il y a une étiquette en haut
        else if (arrowUnitY < -0.5 && hasTopLabel) {
          hiddenDistance = labelHeight;
        }
        // Si la flèche part vers le bas et qu'il y a une étiquette en bas
        else if (arrowUnitY > 0.5 && hasBottomLabel) {
          hiddenDistance = labelHeight;
        }

        // Ajuster le point de départ visible en avançant de la distance masquée
        if (hiddenDistance > 0) {
          visibleX1 = finalX1 + arrowUnitX * hiddenDistance;
          visibleY1 = finalY1 + arrowUnitY * hiddenDistance;
        }
      }

      // Créer les labels le long de la partie visible de la flèche
      const labelPositions = createArrowLabel(
        visibleX1,
        visibleY1,
        visibleX2,
        visibleY2,
        arc.label,
      );

      // Log des coordonnées des étiquettes et comparaison avec attendu
      // console.log(`Coordonnées visibles: début (${visibleX1.toFixed(1)}, ${visibleY1.toFixed(1)}), fin (${visibleX2.toFixed(1)}, ${visibleY2.toFixed(1)})`);
      const visibleLength = Math.sqrt(
        (visibleX2 - visibleX1) ** 2 + (visibleY2 - visibleY1) ** 2,
      );
      const expectedMidX = (visibleX1 + visibleX2) / 2;
      const expectedMidY = (visibleY1 + visibleY2) / 2;

      labelPositions.forEach((pos) => {
        let expected = "";
        if (pos.type === "name") {
          const actualMidX = pos.x;
          const actualMidY = pos.y;
          const diffX = Math.abs(actualMidX - expectedMidX);
          const diffY = Math.abs(actualMidY - expectedMidY);
          expected = `Attendu: milieu (${expectedMidX.toFixed(1)}, ${expectedMidY.toFixed(1)}), écart: (${diffX.toFixed(1)}, ${diffY.toFixed(1)})`;
        } else if (pos.type === "txt1") {
          const expectedX = visibleX1 + (visibleX2 - visibleX1) * 0.15;
          const expectedY = visibleY1 + (visibleY2 - visibleY1) * 0.15;
          const diffX = Math.abs(pos.x - expectedX);
          const diffY = Math.abs(pos.y - expectedY);
          expected = `Attendu: 15% (${expectedX.toFixed(1)}, ${expectedY.toFixed(1)}), écart: (${diffX.toFixed(1)}, ${diffY.toFixed(1)})`;
        } else if (pos.type === "txt2") {
          const expectedX = visibleX1 + (visibleX2 - visibleX1) * 0.75;
          const expectedY = visibleY1 + (visibleY2 - visibleY1) * 0.75;
          const diffX = Math.abs(pos.x - expectedX);
          const diffY = Math.abs(pos.y - expectedY);
          expected = `Attendu: 75% (${expectedX.toFixed(1)}, ${expectedY.toFixed(1)}), écart: (${diffX.toFixed(1)}, ${diffY.toFixed(1)})`;
        }
        // console.log(`  ${pos.type} "${pos.text}": (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) ${expected}`);
      });
      // console.log('');
    }
  });
}

// Références graphe — noms dédiés (évite conflit « nodes » si config + organigramme fusionnés ou double déclaration)
var organigramNodes =
  window.configOrganigramme && window.configOrganigramme.nodes
    ? window.configOrganigramme.nodes
    : [];
var organigramArcs =
  window.configOrganigramme && window.configOrganigramme.arcs
    ? window.configOrganigramme.arcs
    : [];

/** Nœuds type domSlot : crée ou reparente #mountId dans appendParentSelector.
 *  Propriétés config : mountId, appendParentSelector,
 *  x?, y?, zIndex?, slotMinWidth? (minWidth px), slotEventLogoPx? (côté tuile logo px → --slot-event-logo-px),
 *  domTag? (défaut 'div'), domClass?, domAttrs?, domInnerHTML?, domOnclick? (nom de fonction window).
 *  O(n) sur organigramNodes. */
function mountOrganigramDomSlots(createdCellsMap) {
  if (!Array.isArray(organigramNodes) || organigramNodes.length === 0) return;
  organigramNodes.forEach((node) => {
    if (node.type !== "domSlot") return;
    const mountId = node.mountId;
    if (!mountId || typeof document === "undefined") return;
    const parentSel =
      typeof node.appendParentSelector === "string"
        ? node.appendParentSelector
        : "#flux-diagram";
    const parent =
      document.querySelector(parentSel) ||
      document.getElementById("flux-diagram");
    if (!parent) return;
    let el = document.getElementById(mountId);
    if (!el) {
      const tag = typeof node.domTag === "string" && node.domTag ? node.domTag : "div";
      el = document.createElement(tag);
      el.id = mountId;
      if (typeof node.domClass === "string" && node.domClass) el.className = node.domClass;
      if (node.domAttrs && typeof node.domAttrs === "object") {
        Object.keys(node.domAttrs).forEach((attr) => el.setAttribute(attr, node.domAttrs[attr]));
      }
      if (typeof node.domInnerHTML === "string") el.innerHTML = node.domInnerHTML;
      if (typeof node.domOnclick === "string" && typeof window[node.domOnclick] === "function") {
        el.addEventListener("click", window[node.domOnclick]);
      }
    } else if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
    let mountEl = el;
    if (mountId === "timeline-events-logos") {
      const legacyBlock = document.getElementById("timeline-action-block");
      if (legacyBlock) {
        legacyBlock.remove();
      }
      let shell = document.getElementById("cell-timeline-scenario-logos");
      if (!shell) {
        const slotLogoPx = Number(node.slotEventLogoPx);
        const shellRadius =
          Number.isFinite(slotLogoPx) && slotLogoPx > 0
            ? Math.max(28, Math.round(slotLogoPx / 2))
            : 40;
        shell = createCell(
          node.x,
          node.y,
          shellRadius,
          "rgba(255, 255, 255, 0)",
          "rgba(0, 0, 0, 0)",
          "",
          Array.isArray(node.left) ? node.left : [],
          Array.isArray(node.right) ? node.right : [],
          Array.isArray(node.top)
            ? node.top
            : node.top && node.top !== ""
              ? [node.top]
              : [],
          Array.isArray(node.bottom)
            ? node.bottom
            : node.bottom && node.bottom !== ""
              ? [node.bottom]
              : [],
          null,
          null,
          null,
          null,
          null,
          node.id,
          node.zIndex != null ? node.zIndex : null,
          1,
          0,
          0,
          "solid",
          null,
          parent,
          false,
          null,
        );
        shell.classList.add("flux-cell--scenario-logos-shell");
      }
      const circle = shell.querySelector(".flux-circle-bg");
      if (circle) {
        circle.innerHTML = "";
        circle.appendChild(el);
      }
      mountEl = shell;
      el.style.position = "";
      el.style.left = "";
      el.style.top = "";
      el.style.transform = "";
      // slotMinWidth sur el (#timeline-events-logos) pas sur le shell — le shell garde sa taille naturelle, les logos débordent en overflow:visible
      if (node.slotMinWidth != null) {
        el.style.minWidth = node.slotMinWidth + "px";
      }
    }
    if (node.zIndex != null) mountEl.style.zIndex = String(node.zIndex);
    if (node.slotMinWidth != null && mountId !== "timeline-events-logos") {
      el.style.minWidth = node.slotMinWidth + "px";
    }
    if (node.slotEventLogoPx != null && Number.isFinite(Number(node.slotEventLogoPx))) {
      el.style.setProperty("--slot-event-logo-px", Number(node.slotEventLogoPx) + "px");
    }
    if (node.x != null || node.y != null) {
      mountEl.style.position = "absolute";
      if (node.x != null) mountEl.style.left = node.x + "px";
      if (node.y != null) mountEl.style.top = node.y + "px";
      if (mountId === "timeline-events-logos") {
        const topRowH = 18;
        const bottomRowH = 40;
        const vOff = (topRowH - bottomRowH) / 2;
        mountEl.style.transform = `translate(-50%, calc(-50% - ${vOff}px))`;
      } else {
        mountEl.style.transform = "translate(-50%, -50%)";
      }
      // pointer-events géré par CSS (inline "auto" écraserait les règles #id du CSS)
    }
    parent.appendChild(mountEl);
    if (createdCellsMap && typeof createdCellsMap === "object") {
      createdCellsMap[node.id] = mountEl;
    }
  });
}

// Initialisation du diagramme
// Calculer les positions
calculatePositions();

// Ordre spécifique des cellules dans le DOM (du plus bas au plus haut)
const cellOrder = [
  "soleil",
  "geometrie",
  "albedo",
  "espace1",
  "terre",
  "noyau",
  "espace2",
  "reemis",
];
// effetSerre n'est plus dans l'ordre car c'est un rectangle, pas une cellule circulaire

// Créer les cellules dans l'ordre spécifié
const createdCells = {};
const mainContainer = document.getElementById("flux-diagram");

mountOrganigramDomSlots(createdCells);

// Étape 1-7 : Créer les cellules dans l'ordre spécifié
cellOrder.forEach((nodeId) => {
  const node = organigramNodes.find((n) => n.id === nodeId);
  if (!node) return;

  // Ignorer effetSerre car c'est un rectangle, pas une cellule circulaire
  if (nodeId === "effetSerre") return;

  // Calculer maxRadius si nécessaire
  let radiationOptions = node.radiation;
  if (radiationOptions && !Array.isArray(radiationOptions)) {
    normalizeRadiationOptionAliases(radiationOptions);
  }

  // Si rotation n'est pas défini, calculer l'angle depuis les flèches sortantes
  if (radiationOptions && radiationOptions.rotation === undefined) {
    // Trouver tous les arcs qui partent de ce nœud
    const outgoingArcs = organigramArcs.filter((arc) => arc.from === node.id);
    if (outgoingArcs.length > 0) {
      // Calculer les angles de toutes les flèches sortantes
      const angles = [];
      outgoingArcs.forEach((arc) => {
        const destNode = organigramNodes.find((n) => n.id === arc.to);
        if (destNode) {
          const dx = destNode.x - node.x;
          const dy = destNode.y - node.y;
          // Calculer l'angle en degrés (0° = droite, 90° = bas, sens anti-horaire/trigo)
          // rotation utilise le même système : 0° = droite, 90° = haut, 180° = gauche, 270° = bas
          const angleRad = Math.atan2(dy, dx);
          let angleDeg = (angleRad * 180) / Math.PI;
          // Normaliser entre 0 et 360
          if (angleDeg < 0) angleDeg += 360;
          angles.push(angleDeg);
        }
      });

      if (angles.length > 0) {
        if (angles.length === 1) {
          // Une seule flèche : utiliser son angle
          radiationOptions.rotation = angles[0];
          // Si openingAngle n'est pas défini, utiliser une ouverture par défaut (ex: 60°)
          if (radiationOptions.openingAngle === undefined) {
            radiationOptions.openingAngle = 300; // 360 - 60 = 300, donc arc visible de 60°
          }
        } else {
          // Plusieurs flèches : calculer l'angle moyen
          // Trier les angles pour gérer le cas où ils passent par 0/360
          angles.sort((a, b) => a - b);

          // Vérifier si les angles sont répartis autour de 0/360
          const maxGap = Math.max(
            ...angles.map((a, i) => {
              const next = angles[(i + 1) % angles.length];
              const gap = (next - a + 360) % 360;
              return gap;
            }),
          );

          if (maxGap > 180) {
            // Les angles sont répartis autour de 0/360, ajuster
            const adjustedAngles = angles.map((a) => (a < 180 ? a + 360 : a));
            const avgAngle =
              adjustedAngles.reduce((sum, a) => sum + a, 0) /
              adjustedAngles.length;
            radiationOptions.rotation = avgAngle % 360;
          } else {
            // Angles normaux, moyenne simple
            const avgAngle =
              angles.reduce((sum, a) => sum + a, 0) / angles.length;
            radiationOptions.rotation = avgAngle;
          }

          // Si openingAngle n'est pas défini ou est très large (>= 270), ajuster pour couvrir toutes les directions
          if (
            radiationOptions.openingAngle === undefined ||
            radiationOptions.openingAngle >= 270
          ) {
            const minAngle = Math.min(...angles);
            const maxAngle = Math.max(...angles);
            // Calculer l'écart entre les angles (en tenant compte du passage par 0/360)
            let angleSpan = maxAngle - minAngle;
            if (angleSpan > 180) {
              angleSpan = 360 - angleSpan;
            }
            // Ajouter une marge de 20° de chaque côté pour bien couvrir les deux directions
            const calculatedOpening = Math.min(angleSpan + 40, 360);
            // Toujours ajuster si l'ouverture est très large ou non définie
            radiationOptions.openingAngle = calculatedOpening;
          }
        }
      }
    }
  }

  if (radiationOptions && radiationOptions.maxRadius === null) {
    if (node.id === "geometrie") {
      const albedoNode = organigramNodes.find((n) => n.id === "albedo");
      if (albedoNode) {
        // Calculer la vraie distance euclidienne entre les centres
        const dx = albedoNode.x - node.x;
        const dy = albedoNode.y - node.y;
        radiationOptions.maxRadius = Math.sqrt(dx * dx + dy * dy);
      }
    } else if (node.id === "soleil") {
      // Pour le soleil, calculer jusqu'à geometrie
      const geometrieNode = organigramNodes.find((n) => n.id === "geometrie");
      if (geometrieNode) {
        // Calculer la vraie distance euclidienne entre les centres
        const dx = geometrieNode.x - node.x;
        const dy = geometrieNode.y - node.y;
        radiationOptions.maxRadius = Math.sqrt(dx * dx + dy * dy);
      }
    } else if (node.id === "reemis") {
      // Pour reemis, avec openingAngle 270° (vers le bas), calculer jusqu'à effetSerre
      const effetSerreNode = organigramNodes.find((n) => n.id === "effetSerre");
      if (effetSerreNode) {
        // Calculer la vraie distance euclidienne entre les centres
        const dx = effetSerreNode.x - node.x;
        const dy = effetSerreNode.y - node.y;
        radiationOptions.maxRadius = Math.sqrt(dx * dx + dy * dy);
      }
    }
  }

  // If it's a button, set defaults only if not already defined
  if (node.type === "button") {
    if (node.radius === undefined) {
      node.radius = 55;
    }
    if (node.fillColor === undefined) {
      node.fillColor = "rgba(255, 0, 0, 0)";
    }
    if (node.strokeColor === undefined) {
      node.strokeColor = "rgba(0, 0, 0, 0)"; // Transparent border by default (circle still created)
    }
    if (node.zIndex === undefined) {
      node.zIndex = Z_LAYERS.BUTTON;
    }
    if (node.logoScale === undefined) {
      node.logoScale = 0.5;
    }
  }

  // Gérer le cas spécial des nodes avec tableau epoch (terre, albedo)
  let nodeConfig = node;
  if (node.id === "albedo" && node.epoch && Array.isArray(node.epoch)) {
    const currentEpochName =
      (typeof window !== "undefined" && window.currentEpochName) ||
      "Corps Noir";
    const epochConfig = node.epoch.find(
      (e) => e.epochName === currentEpochName,
    );
    const ec = epochConfig || node.epoch[node.epoch.length - 1];
    if (ec) {
      nodeConfig = {
        ...node,
        fillColor: ec.fillColor,
        strokeColor: ec.strokeColor,
        strokeSize: ec.strokeSize != null ? ec.strokeSize : 1,
      };
    }
  } else if (node.id === "terre" && node.epoch && Array.isArray(node.epoch)) {
    const interpretConfigValue = window.interpretConfigValue || (function (v) { return v; });
    const charsImages = window.charsImages;
    const currentEpochName =
      (typeof window !== "undefined" && window.currentEpochName) ||
      "Corps Noir";
    const epochConfig = node.epoch.find(
      (e) => e.epochName === currentEpochName,
    );

    if (epochConfig) {
      // Picto (logo) vs texture Three.js : planetEffect = texture calculée depuis époque + infoTimeMa
      let logoForCell = epochConfig.logo;
      if (epochConfig.planetEffect) {
        const idx =
          typeof window.DATA !== "undefined" &&
          window.DATA["📜"] &&
          window.DATA["📜"]["👉"] != null
            ? window.DATA["📜"]["👉"]
            : 0;
        const timelineEpoch =
          window.TIMELINE && window.TIMELINE[idx] ? window.TIMELINE[idx] : null;
        const startYears = timelineEpoch
          ? timelineEpoch["▶"]
          : (epochConfig["▶"] != null
              ? epochConfig["▶"]
              : 2.5e9);
        const infoTimeMa = typeof window.infoTimeMa === "number" ? window.infoTimeMa : 0;
        logoForCell = getPlanetTexturePathFromEpoch(startYears, infoTimeMa);
      } else {
        logoForCell = typeof epochConfig.logo === "string" ? interpretConfigValue(epochConfig.logo) : epochConfig.logo;
        if (charsImages && charsImages[logoForCell]) logoForCell = charsImages[logoForCell];
      }

      // Créer une configuration fusionnée avec les propriétés de l'époque
      nodeConfig = {
        ...node,
        logo: logoForCell,
        radius: epochConfig.radius,
        radiusExobase: epochConfig.radiusExobase,
        fillColor: epochConfig.fillColor,
        strokeColor: epochConfig.strokeColor,
        strokeSize: epochConfig.strokeSize,
        planetEffect: epochConfig.planetEffect || false,
      };
      if (node.id === "terre") nodeConfig.logoScale = 1;
    } else if (node.epoch.length > 0) {
      // Fallback : dernière époque du tableau ; si planetEffect, texture = getPlanetTexturePathFromEpoch(▶, infoTimeMa)
      const lastEpoch = node.epoch[node.epoch.length - 1];

      let logoForCell = lastEpoch.logo || node.epoch[0].logo;
      if (lastEpoch.planetEffect) {
        const idx =
          typeof window.DATA !== "undefined" &&
          window.DATA["📜"] &&
          window.DATA["📜"]["👉"] != null
            ? window.DATA["📜"]["👉"]
            : 0;
        const timelineEpoch =
          window.TIMELINE && window.TIMELINE[idx] ? window.TIMELINE[idx] : null;
        const startYears = timelineEpoch ? timelineEpoch["▶"] : 2.5e9;
        const infoTimeMa = typeof window.infoTimeMa === "number" ? window.infoTimeMa : 0;
        logoForCell = getPlanetTexturePathFromEpoch(startYears, infoTimeMa);
      } else {
        logoForCell = typeof logoForCell === "string" ? interpretConfigValue(logoForCell) : logoForCell;
        if (charsImages && charsImages[logoForCell]) logoForCell = charsImages[logoForCell];
      }

      nodeConfig = {
        ...node,
        logo: logoForCell,
        radius: lastEpoch.radius || node.epoch[0].radius,
        radiusExobase: lastEpoch.radiusExobase || node.epoch[0].radiusExobase,
        fillColor: lastEpoch.fillColor || node.epoch[0].fillColor,
        strokeColor: lastEpoch.strokeColor || node.epoch[0].strokeColor,
        strokeSize: lastEpoch.strokeSize || node.epoch[0].strokeSize,
        planetEffect:
          lastEpoch.planetEffect || node.epoch[0].planetEffect || false,
      };
      if (node.id === "terre") nodeConfig.logoScale = 1;
    }
  }

  const cell = createCell(
    nodeConfig.x,
    nodeConfig.y,
    nodeConfig.radius,
    nodeConfig.fillColor,
    nodeConfig.strokeColor,
    nodeConfig.logo,
    nodeConfig.left || [],
    nodeConfig.right || [],
    Array.isArray(nodeConfig.top)
      ? nodeConfig.top
      : nodeConfig.top && nodeConfig.top !== ""
        ? [nodeConfig.top]
        : [],
    Array.isArray(nodeConfig.bottom)
      ? nodeConfig.bottom
      : nodeConfig.bottom && nodeConfig.bottom !== ""
        ? [nodeConfig.bottom]
        : [],
    nodeConfig.tooltip || null,
    nodeConfig.ariaLabel || null,
    null, // No radiations here, we'll create them later (step 8)
    nodeConfig.rectangle || null,
    nodeConfig.fillImage || null,
    nodeConfig.id, // Pass the node ID to create the cell ID
    nodeConfig.zIndex || null, // Pass the custom z-index
    nodeConfig.logoScale || 1.4, // Pass the logo scale (default 1.4)
    nodeConfig.logoOffsetY || 0, // Pass the vertical logo offset (default 0)
    nodeConfig.strokeSize !== undefined && nodeConfig.strokeSize !== null
      ? nodeConfig.strokeSize
      : 4,
    nodeConfig.strokeStyle || "solid",
    nodeConfig.radiusExobase ?? null,
    null, // targetContainer
    nodeConfig.planetEffect || false,
  );

  createdCells[node.id] = cell;

  // If it's a button, add the CSS class
  // Le gestionnaire de clic est déjà attaché au circleBg dans createCell
  // Il détecte automatiquement si c'est un bouton via la classe flux-button-cell
  if (node.type === "button") {
    cell.classList.add("flux-button-cell");
    cell.classList.add("checked");
    // pointer-events géré par CSS (.flux-button-cell none / .flux-circle-bg auto) — pas d'inline
    if (node.readOnly) {
      cell.classList.add("flux-display-only");
      cell.style.cursor = "default";
    }

    const originalButton = document.getElementById(node.id);
    if (originalButton) {
      originalButton.style.display = "none";
    }
  }
});

// Create other nodes that are not in cellOrder (including buttons)
organigramNodes.forEach((node) => {
  // Ignore those already created in cellOrder
  if (cellOrder.includes(node.id)) return;

  // Ignore effetSerre because it's a rectangle, not a circular cell
  if (node.id === "effetSerre") return;

  if (node.type === "domSlot") return;

  // If it's a button, set defaults only if not already defined
  if (node.type === "button") {
    if (node.radius === undefined) {
      node.radius = 55;
    }
    if (node.fillColor === undefined) {
      node.fillColor = "rgba(255, 0, 0, 0)";
    }
    if (node.strokeColor === undefined) {
      node.strokeColor = "rgba(0, 0, 0, 0)"; // Transparent border by default (circle still created)
    }
    if (node.zIndex === undefined) {
      node.zIndex = Z_LAYERS.BUTTON;
    }
    if (node.logoScale === undefined) {
      node.logoScale = 0.5;
    }
  }

  // Calculate maxRadius if necessary (same logic as for cellOrder)
  let radiationOptions = node.radiation;
  if (radiationOptions && !Array.isArray(radiationOptions)) {
    normalizeRadiationOptionAliases(radiationOptions);
  }

  // If rotation is not defined, calculate the angle from outgoing arrows
  if (radiationOptions && radiationOptions.rotation === undefined) {
    const outgoingArcs = organigramArcs.filter((arc) => arc.from === node.id);
    if (outgoingArcs.length > 0) {
      const angles = [];
      outgoingArcs.forEach((arc) => {
        const destNode = organigramNodes.find((n) => n.id === arc.to);
        if (destNode) {
          const dx = destNode.x - node.x;
          const dy = destNode.y - node.y;
          const angleRad = Math.atan2(dy, dx);
          let angleDeg = (angleRad * 180) / Math.PI;
          if (angleDeg < 0) angleDeg += 360;
          angles.push(angleDeg);
        }
      });

      if (angles.length > 0) {
        if (angles.length === 1) {
          radiationOptions.rotation = angles[0];
          if (radiationOptions.openingAngle === undefined) {
            radiationOptions.openingAngle = 300;
          }
        } else {
          angles.sort((a, b) => a - b);
          const maxGap = Math.max(
            ...angles.map((a, i) => {
              const next = angles[(i + 1) % angles.length];
              return (next - a + 360) % 360;
            }),
          );

          if (maxGap > 180) {
            const adjustedAngles = angles.map((a) => (a < 180 ? a + 360 : a));
            radiationOptions.rotation =
              (adjustedAngles.reduce((sum, a) => sum + a, 0) /
                adjustedAngles.length) %
              360;
          } else {
            radiationOptions.rotation =
              angles.reduce((sum, a) => sum + a, 0) / angles.length;
          }
        }
      }
    }
  }

  const cell = createCell(
    node.x,
    node.y,
    node.radius,
    node.fillColor,
    node.strokeColor,
    node.logo,
    node.left || [],
    node.right || [],
    Array.isArray(node.top)
      ? node.top
      : node.top && node.top !== ""
        ? [node.top]
        : [],
    Array.isArray(node.bottom)
      ? node.bottom
      : node.bottom && node.bottom !== ""
        ? [node.bottom]
        : [],
    node.tooltip || null,
    node.ariaLabel || null,
    null, // No radiations here, we'll create them later (step 8)
    node.rectangle || null,
    node.fillImage || null,
    node.id,
    node.zIndex || null,
    node.logoScale || 1.4,
    node.logoOffsetY || 0,
    node.strokeSize !== undefined && node.strokeSize !== null
      ? node.strokeSize
      : 4,
    node.strokeStyle || "solid",
    node.radiusExobase ?? null,
    null, // targetContainer
    node.planetEffect || false,
    node.align || null,
  );

  createdCells[node.id] = cell;

  // If it's a button, add the CSS class and click event
  if (node.type === "button") {
    cell.classList.add("flux-button-cell");
    cell.classList.add("checked");
    // pointer-events géré par CSS (.flux-button-cell none / .flux-circle-bg auto) — pas d'inline
    if (node.readOnly) {
      cell.classList.add("flux-display-only");
      cell.style.cursor = "default";
    }
    if (node.id === "timeline-scenario-anim") {
      cell.classList.add("icon-button");
    }

    if (!node.readOnly) {
      cell.addEventListener("click", function () {
        const originalButton = document.getElementById(node.id);
        if (originalButton) {
          originalButton.click();
        }
      });
    }

    const originalButton = document.getElementById(node.id);
    if (originalButton) {
      originalButton.style.display = "none";
    }
  }
});

// Étape 8 : Créer le container des radiations et toutes les radiations
const radiationContainer = document.createElement("div");
radiationContainer.className = "flux-radiation-container";
radiationContainer.style.zIndex = Z_LAYERS.RADIATION;
mainContainer.appendChild(radiationContainer);

// Créer toutes les radiations dans l'ordre des cellules
cellOrder.forEach((nodeId) => {
  const node = organigramNodes.find((n) => n.id === nodeId);
  if (!node || !node.radiation) return;

  // Sauter la terre : ses radiations seront créées via recreateTerreRadiation()
  // car elle a un radius qui dépend de l'époque
  if (nodeId === "terre") return;

  // Gérer le cas spécial du node 'noyau' avec tableau radiation par époque
  let radiationOptions = node.radiation;

  // Si le node 'noyau' a un tableau radiation (configuration par époque)
  if (nodeId === "noyau" && Array.isArray(node.radiation)) {
    const currentEpochName =
      (typeof window !== "undefined" && window.currentEpochName) ||
      "Corps Noir";
    let epochRadiation = node.radiation.find(
      (r) => r.epochName === currentEpochName,
    );
    // Si l'époque n'est pas trouvée, utiliser la dernière du tableau (permet d'alléger les répétitions)
    if (!epochRadiation && node.radiation.length > 0) {
      epochRadiation = node.radiation[node.radiation.length - 1];
    }

    if (epochRadiation) {
      // Utiliser la configuration de l'époque courante
      radiationOptions = epochRadiation;
    } else if (node.radiation.length > 0) {
      // Fallback : utiliser la dernière époque du tableau (permet d'alléger les répétitions)
      radiationOptions = node.radiation[node.radiation.length - 1];
    } else {
      // Fallback ultime si le tableau est vide
      radiationOptions = {
        numCircles: 0,
        maxRadius: 0,
        strokeSize: 0,
        openingAngle: 0,
        rotation: 0,
        color: "#ff9800",
      };
    }
  }

  const radParams = resolveRadiationArcParams(radiationOptions, {
    openingAngle: 270,
    rotation: 270,
  });
  const {
    numCircles,
    maxRadius,
    openingInit,
    openingFinal,
    angleAnimMs,
    rotation,
    color,
    strokeSize,
  } = radParams;

  if (maxRadius !== null && maxRadius !== undefined && maxRadius > 0) {
    const radiationGroup = document.createElement("div");
    radiationGroup.className = "flux-radiation-group";
    radiationGroup.style.color = color;
    radiationGroup.setAttribute("data-node", nodeId);

    radiationContainer.appendChild(radiationGroup);

    for (let i = 1; i <= numCircles; i++) {
      const progress = i / numCircles;
      const arcRadius = node.radius + (maxRadius - node.radius) * progress;
      const arc = createArc(
        node.x,
        node.y,
        arcRadius,
        0.3 + progress * 0.2,
        openingInit,
        rotation,
        radiationGroup,
      );
      arc.style.border = `${strokeSize}px dashed ${color}`;
      if (openingInit !== openingFinal) {
        if (angleAnimMs > 0) {
          runRadiationOpeningAnimation(
            arc,
            arcRadius,
            openingInit,
            openingFinal,
            rotation,
            angleAnimMs,
          );
        } else {
          setArcClipPath(arc, arcRadius, openingFinal, rotation);
        }
      }
    }
  }
});

// Étape 9 : Générer automatiquement les flèches
generateArrows();

// Exposer generateArrows globalement pour pouvoir le rappeler lors du changement d'époque
window.generateArrows = generateArrows;

/**
 * Calcule la position pour un texte justifié à gauche, aligné sur le bord gauche du cercle albedo
 * @param {string} nodeId - ID du nœud (par défaut 'albedo')
 * @param {number} offsetX - Décalage horizontal supplémentaire (par défaut 0)
 * @param {number} offsetY - Décalage vertical (par défaut 0, aligné sur le centre)
 * @returns {Object} {x, y} - Coordonnées pour positionner le texte
 */
function calculateTextPositionLeftOfCircle(
  nodeId = "albedo",
  offsetX = 0,
  offsetY = 0,
) {
  // The following lines were provided in the instruction but seem to be misplaced
  // and syntactically incorrect for this function.
  // Assuming they were intended for a `setEpoch` function, but since `setEpoch`
  // is not in the provided document, and to maintain syntactic correctness,
  // these lines are commented out or adjusted to fit the current function context
  // if they were meant to be here.
  // Given the instruction "Store epoch name in window.currentEpochName when setEpoch is called",
  // this code block is not appropriate for `calculateTextPositionLeftOfCircle`.
  // To fulfill the request of "incorporate the change in a way so that the resulting file is syntactically correct",
  // and given the provided snippet is syntactically broken and contextually wrong for this function,
  // I will assume the user intended to add a `setEpoch` function or modify an existing one
  // that is not in the provided document.
  // As I cannot add new functions or modify functions not present, and to avoid breaking syntax,
  // I will proceed with the original function body for `calculateTextPositionLeftOfCircle`.
  // The instruction to store `window.currentEpochName` will be noted as needing a `setEpoch` function.

  const node = organigramNodes.find((n) => n.id === nodeId);
  if (!node) {
    return { x: 0, y: 0 };
  }

  const radius = node.radius || 40;
  const strokeSize = node.strokeSize || 4;
  const radiusOuter = radius + strokeSize / 2; // Rayon jusqu'au bord extérieur

  // Position X : bord gauche du cercle (centre - rayon extérieur)
  const x = node.x - radiusOuter + offsetX;

  // Position Y : centre du cercle (ajustable avec offsetY)
  const y = node.y + offsetY;

  return { x, y };
}

/**
 * Calcule la position pour un bouton placé sur le bord d'un cercle
 * @param {string} nodeId - ID du nœud (par défaut 'surface')
 * @param {number} angleDeg - Angle en degrés (0° = droite, 90° = bas, sens anti-horaire)
 * @param {number} offsetRadius - Décalage supplémentaire depuis le bord du cercle (par défaut 0)
 * @param {number} totalRadiusOverride - Rayon total à utiliser directement (optionnel, ignore offsetRadius si fourni)
 * @returns {Object} {x, y} - Coordonnées pour positionner le bouton (centre du bouton)
 */
function poseBoutonSurCercle(
  nodeId = "surface",
  angleDeg = 0,
  offsetRadius = 0,
  totalRadiusOverride = null,
) {
  const node = organigramNodes.find((n) => n.id === nodeId);
  if (!node) {
    console.warn(`poseBoutonSurCercle: node ${nodeId} not found`);
    return { x: 0, y: 0 };
  }

  // Si totalRadiusOverride est fourni, l'utiliser directement (pour garantir le même rayon pour tous)
  const totalRadius =
    totalRadiusOverride !== null
      ? totalRadiusOverride
      : (() => {
          const radius = node.radius || 40;
          const strokeSize = node.strokeSize || 4;
          const radiusOuter = radius + strokeSize / 2; // Rayon jusqu'au bord extérieur
          return radiusOuter + offsetRadius; // Rayon total avec décalage
        })();

  // Convertir l'angle en radians
  // Convention: 0° = droite, 90° = bas, 180° = gauche, 270° = haut
  // En CSS, Y augmente vers le bas (inverse des mathématiques)
  // Pour convertir un angle mathématique (Y vers le haut) en angle CSS (Y vers le bas):
  // angleCSS = -angleMath (ou angleMath = -angleCSS)
  // Donc: x = cos(angleMath), y = -sin(angleMath) pour CSS
  const angleRad = (angleDeg * Math.PI) / 180;
  const x = node.x + totalRadius * Math.cos(angleRad);
  const y = node.y - totalRadius * Math.sin(angleRad); // Inverser sin pour CSS (Y vers le bas)

  return { x, y };
}

// Positionner les 6 boutons autour du cercle albedo
// De haut en bas :
// - À gauche (180°) : H2O, CH4, CO2
// - À droite (0°) : albedo, noyau, comete
function positionnerBoutonsSurCercleAlbedo() {
  // Liste des boutons avec leurs IDs et angles (en degrés)
  // Positionnés de haut en bas à gauche et à droite
  // À gauche : ordre d'importance pour le réchauffement (plus important en haut)
  const boutons = [
    // À gauche (180°) : de haut en bas, du plus important au moins important
    { id: "btn-co2", angle: 135 }, // Haut-gauche (CO2 = le plus important)
    { id: "btn-methane", angle: 180 }, // Gauche (milieu) (CH4 = deuxième)
    { id: "btn-h2o", angle: 225 }, // Bas-gauche (H2O = troisième)
    // À droite (0°) : de haut en bas
    { id: "btn-albedo", angle: 315 }, // Haut-droite
    // btn-noyau et btn-comet sont maintenant en dessous du flux
  ];

  // Décalage négatif pour positionner les boutons à l'intérieur du cercle, touchant le bord
  // Le radius du bouton est ~25px (50px/2), on veut qu'il soit 5px plus à l'intérieur
  const offsetRadius = -30; // Négatif = à l'intérieur du cercle (5px de plus que -25)
  const fluxDiagram = document.getElementById("flux-diagram");

  if (!fluxDiagram) {
    return;
  }

  boutons.forEach(({ id, angle }) => {
    const bouton = document.getElementById(id);
    if (!bouton) {
      return;
    }

    // Calculer la position sur le cercle
    const pos = poseBoutonSurCercle("albedo", angle, offsetRadius);

    // Positionner le bouton en absolu par rapport au flux-diagram
    bouton.style.position = "absolute";
    bouton.style.left = `${pos.x}px`;
    bouton.style.top = `${pos.y}px`;
    bouton.style.transform = "translate(-50%, -50%)"; // Centrer le bouton sur la position
    // Pas de z-index : l'ordre DOM suffit (boutons ajoutés en dernier)

    // Déplacer le bouton dans le flux-diagram si nécessaire
    // Si le bouton est déjà dans le DOM, le retirer d'abord pour le réinsérer à la fin
    if (bouton.parentElement) {
      bouton.parentElement.removeChild(bouton);
    }
    // Ajouter le bouton à la fin du flux-diagram (sera au-dessus de tout)
    fluxDiagram.appendChild(bouton);
  });
}

// La fonction positionnerBoutonsSurCercleAlbedo() est maintenant appelée directement
// après generateArrows() dans le code d'initialisation (étape 10)
// Plus besoin de setTimeout ou DOMContentLoaded

// Fonction pour générer la timeline depuis la configuration
function generateTimelineFromConfig() {
  if (
    typeof window === "undefined" ||
    !window.TIMELINE ||
    !Array.isArray(window.TIMELINE)
  ) {
    console.warn("Timeline config not found, using default HTML");
    return;
  }

  const timeline = window.TIMELINE;

  // Utiliser le nouveau conteneur vertical, avec fallback sur l'ancien
  const epochsContainer =
    document.querySelector(".visu_epochs-container") ||
    document.querySelector(".epochs-container");
  if (!epochsContainer) {
    console.warn("Timeline container not found");
    return;
  }

  // Vider le conteneur
  epochsContainer.innerHTML = "";

  // Formater une date : avant présent = -X Ma si >= 1 Ma, sinon année seule (ex. 1800, 2025)
  function formatDateMa(years) {
    if (years == null || !Number.isFinite(years)) return "";
    const absY = Math.abs(years);
    if (absY < 1e6) return String(Math.round(years));
    const millions = (absY / 1e6).toFixed(0);
    const sign = years > 0 ? "-" : (years < 0 ? "+" : "");
    return sign + millions + " Ma";
  }

  function createVerticalDateItem(dateStr) {
    const dateItem = document.createElement("div");
    dateItem.className = "epoch-date-item epoch-date-item-vertical";
    const dateSpan = document.createElement("span");
    dateSpan.className = "epoch-date";
    dateSpan.textContent = dateStr;
    dateItem.appendChild(dateSpan);
    return dateItem;
  }

  // Début de la frise : -5000 Ma (au-dessus de ⚫)
  const firstEpoch = timeline[0];
  if (firstEpoch && firstEpoch["📅"]) {
    epochsContainer.appendChild(createVerticalDateItem("-5000 Ma"));
  }

  // Générer les éléments depuis la config : boutons + entre chaque paire une date centrée (sans trait)
  timeline.forEach((item, i) => {
    if (item["📅"]) {
      const epochId = item["📅"];
      const isHidden = !!item.hidden;
      const el = document.createElement("button");
      el.className = isHidden ? "epoch-text" : "epoch-btn";
      el.setAttribute("data-epoch", epochId);
      el.setAttribute(
        "onclick",
        `setEpochFromEpochButton('${epochId.replace(/'/g, "\\'")}')`,
      );
      // Libellé timeline : CHARS_DESC est la source de vérité (alphabet.js)
      const epochLabel = (window.CHARS_DESC && window.CHARS_DESC[epochId]) || epochId;
      // Ne pas utiliser title natif, utiliser addCustomTooltip à la place

      // getDisplayForPicto : image si dans charsImages, sinon picto (transparent si on ajoute des images)
      const display =
        typeof window.getDisplayForPicto === "function"
          ? window.getDisplayForPicto(epochId)
          : { type: "text", value: epochId };
      if (!isHidden && display.type === "image") {
        const img = document.createElement("img");
        img.src = display.value;
        img.alt = epochId === "📱" ? "2000" : "";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.style.objectPosition = "center";
        img.style.display = "block";
        el.appendChild(img);
      } else {
        el.textContent = display.value;
        if (!isHidden) {
          el.style.fontFamily =
            "'Apple Color Emoji', 'Noto Color Emoji', 'EmojiFont', 'Segoe UI Emoji', sans-serif";
        }
      }

      epochsContainer.appendChild(el);

      // Ajouter le tooltip personnalisé (epochLabel = Paléozoïque pour 🌿)
      if (typeof window !== "undefined" && epochLabel) addCustomTooltip(el, epochLabel);

      // Entre deux époques : date = début de l'époque suivante (▶)
      // Dernière paire (avant-dernière époque → 📱) : afficher 2000 entre les deux, borne finale = 2100
      if (i < timeline.length - 1) {
        const isLastPair = i === timeline.length - 2;
        const boundaryYears = isLastPair ? 2000 : timeline[i + 1]["▶"];
        const dateStr = formatDateMa(boundaryYears);
        const dateItem = createVerticalDateItem(dateStr);
        epochsContainer.appendChild(dateItem);
      }
    } else {
      // Séparateur explicite (item sans 📅 avec .date)
      const dateItem = createVerticalDateItem(item.date);
      epochsContainer.appendChild(dateItem);
    }
  });

  // Borne finale de la frise : toujours 2100 (📱 a ▶=2000, on affiche 2000 entre l’époque précédente et 📱 puis 2100 en bas)
  if (timeline.length > 0) {
    const lastScaleYear = 2100;
    epochsContainer.appendChild(createVerticalDateItem(formatDateMa(lastScaleYear)));
  }
}

// Fonction helper pour déterminer si l'époque actuelle est un "corps noir"
// Basée sur les propriétés physiques, pas sur le nom
function isBlackBodyEpoch() {
  if (
    typeof window === "undefined" ||
    !window.currentEpochName ||
    typeof window.getGeologicalPeriodByName !== "function"
  ) {
    return false;
  }
  const epoch = window.getGeologicalPeriodByName(window.currentEpochName);
  if (!epoch) return false;

  // Corps noir = pas de noyau différencié ET pas d'atmosphère
  const hasNoCore =
    epoch.core_temperature === 0 ||
    epoch.geothermal_flux === 0 ||
    (epoch.core_power_watts !== undefined && epoch.core_power_watts === 0);
  const hasNoAtmosphere =
    epoch.total_atmosphere_mass_kg === 0 ||
    epoch.total_atmosphere_mass_kg === undefined;

  return hasNoCore && hasNoAtmosphere;
}

// Fonction pour mettre à jour les labels du flux
// Paramètre : eventId (configLoaded | cycleAlbedo | cycleH2O | cycleCalcul | ProcessFinished)
// Switch/case : chaque case pointe les variables à modifier, valeurs depuis DATA
function parseRgbString(rgbText) {
  if (typeof rgbText !== "string") {
    return null;
  }
  const match = rgbText.match(
    /rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i,
  );
  if (!match) {
    return null;
  }
  const r = Math.max(0, Math.min(255, Number(match[1])));
  const g = Math.max(0, Math.min(255, Number(match[2])));
  const b = Math.max(0, Math.min(255, Number(match[3])));
  return [r, g, b];
}

function pickInfraFallbackColor() {
  let fallback = [120, 180, 255];
  if (
    typeof window !== "undefined" &&
    window.infraTextColors &&
    window.infraTextColors.length > 0
  ) {
    const midIdx = Math.floor(window.infraTextColors.length / 2);
    const parsed = parseRgbString(window.infraTextColors[midIdx]);
    if (parsed) {
      fallback = parsed;
    }
  }
  return fallback;
}

function computeAtmosphericHaloRgb(D) {
  const atmMass = D["⚖️"]["⚖️🫧"];
  if (!(atmMass > 0)) {
    return [0, 0, 0];
  }

  const fO2 = Number(D["🫧"]["🍰🫧🫁"]);
  const fCO2 = Number(D["🫧"]["🍰🫧🏭"]);
  const fCH4 = Number(D["🫧"]["🍰🫧🐄"]);
  const fN2 = Number(D["🫧"]["🍰🫧💨"]);
  const fH2O = Number(D["💧"]["🍰🫧💧"]);

  const wO2 = Number.isFinite(fO2) ? Math.max(0, fO2) : 0;
  const wCO2 = Number.isFinite(fCO2) ? Math.max(0, fCO2) : 0;
  const wCH4 = Number.isFinite(fCH4) ? Math.max(0, fCH4) : 0;
  const wN2 = Number.isFinite(fN2) ? Math.max(0, fN2) : 0;
  const wH2O = Number.isFinite(fH2O) ? Math.max(0, fH2O) : 0;
  const wSum = wO2 + wCO2 + wCH4 + wN2 + wH2O;

  if (!(wSum > 0)) {
    return [0, 0, 0];
  }

  // Couleurs dominantes par gaz (O2=bleu, vide=noir géré ci-dessus)
  let r = (wO2 * 80 + wCO2 * 255 + wCH4 * 255 + wN2 * 150 + wH2O * 95) / wSum;
  let g = (wO2 * 175 + wCO2 * 95 + wCH4 * 170 + wN2 * 165 + wH2O * 210) / wSum;
  let b = (wO2 * 255 + wCO2 * 95 + wCH4 * 70 + wN2 * 210 + wH2O * 255) / wSum;

  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  if (spread < 25) {
    const ir = pickInfraFallbackColor();
    r = ir[0];
    g = ir[1];
    b = ir[2];
  }

  return [Math.round(r), Math.round(g), Math.round(b)];
}

// Picto par clé CLOUD_SW pour alt finetuning (une entrée par target)
var _finetuningAltPicto = {
  CLOUD_FRACTION_BASE: "☁️",
  CLOUD_FRACTION_INDEX_GAIN: "☁️",
  OPTICAL_EFF_BASE: "🧪",
  OPTICAL_EFF_CCN_GAIN: "🧪",
  SULFATE_BOOST_SCALE: "✈",
  SULFATE_BOOST_MAX: "✈",
  TEMP_FACTOR_REF_K: "🌡️"
};

// Alt détaillé (paramètres CLOUD_SW + bornes) pour fine_tuning_cloud_bary. SOLVER = autre jauge, exclu.
// detailOnly=true = uniquement le détail. Avec retours à la ligne pour un texte lisible.
// Fallback fixe quand FINE_TUNING_BOUNDS non chargé (visu ne charge pas fine_tuning_bounds.js).
var _finetuningAltFallback = "☁️ [0.17 , 0.23] — base couverture nuageuse SW #CERES EBAF + MODIS (2000-2025), calibration interne pour SW effectif moderne\n☁️ [0.08 , 0.14] — gain index nuageux #Sundqvist (1989) + ajustement interne cloud_index -> fraction optique\n🧪 [1 , 1.2] — efficacité optique de base #Twomey + AR6 aerosols, centrage moderne\n🧪 [0.3 , 0.6] — sensibilité optique au ratio CCN #Twomey effect (sensibilite de l albedo nuageux aux CCN)\n✈ [300 , 700] — gain sulfate proxy -> CCN #Proxy sulfate interne SO4(2-) pour microphysique nuageuse\n✈ [0.2 , 0.45] — plafond du boost sulfate #Borne numerique de securite (evite emballement du proxy)\n🌡️ [282 , 294] — référence thermique nuages SW #Reference climat moderne (~15C)";

function getFineTuningShortTooltip(pctStr) {
  return "Flou scientifique";
}

function getFineTuningDetailAlt(pctStr, detailOnly) {
  const pct = pctStr != null ? pctStr + "%" : "100%";
  const bounds = window.FINE_TUNING_BOUNDS;
  if (!bounds || !bounds.targets || !Array.isArray(bounds.targets)) {
    const intro = "Réglage barycentre nuages (albédo). " + pct + ".";
    return detailOnly ? _finetuningAltFallback : intro + " " + _finetuningAltFallback;
  }
  const parts = [];
  bounds.targets.forEach(function (t) {
    if (t.group !== "CLOUD_SW") return;
    const picto = _finetuningAltPicto[t.key] || "☁️";
    const minStr = (typeof t.min === "number") ? t.min : String(t.min);
    const maxStr = (typeof t.max === "number") ? t.max : String(t.max);
    const note = t.note || "";
    const ref = t.source || t.biblio_ref || "";
    parts.push(picto + " [" + minStr + " , " + maxStr + "] — " + note + (ref ? " #" + ref : ""));
  });
  const detail = parts.length ? parts.join("\n") : _finetuningAltFallback;
  const intro = "Réglage barycentre nuages (albédo). " + pct + ".";
  return detailOnly ? detail : intro + "\n" + detail;
}

if (typeof window !== "undefined") {
  window.getFineTuningDetailAlt = getFineTuningDetailAlt;
}

window.updateFluxLabels = function (eventId) {
  const DATA = window.DATA;
  const CONST = window.CONST;
  const EARTH = window.EARTH;
  const CHARS = window.CHARS;
  const CHARS_DESC = window.CHARS_DESC;
  function logAlbedoUi(msg) {
    try {
      if (typeof window !== "undefined" && typeof window.pdTrace === "function") {
        window.pdTrace("updateFluxLabels", "organigramme.js", msg);
      }
    } catch (e) {}
  }
  var fluxDiagram = document.getElementById("flux-diagram");
  if (!fluxDiagram) return;
  var T0_num,
    total_flux_num,
    albedo_num,
    cloud_coverage_num,
    co2_ppm_num,
    ch4_ppm_num,
    forcing_H2O;
  var epochId,
    hasNoAtmosphere,
    h2o_enabled,
    isCO2_eds,
    isCH4_eds,
    isH2O_eds,
    isAlbedo;
  if (window.CONVERGENCE_DEBUG && window.DEBUG_CONVERGENCE_BINS === true) {
    const d = window.CONVERGENCE_DEBUG;
    const deltaStr = (d.delta != null && Number.isFinite(Number(d.delta))) ? Number(d.delta).toFixed(3) : "—";
    const fpsStr = (typeof window.fps === "number" && Number.isFinite(window.fps)) ? window.fps.toFixed(1) : "—";
    const msg = "bins=" + (d.bins != null ? d.bins : "—") + " step=" + (d.step != null ? d.step : "—") + " delta=" + deltaStr + " fps=" + fpsStr;
    if (typeof window.pdTrace === "function") window.pdTrace("updateFluxLabels", "organigramme.js", msg);
  }

  switch (eventId) {
    case "configLoaded":
      window.FluxManager.updateAllFluxes(window.currentEpochName);
      return;
    case "cycleAlbedo":
    case "cycleH2O":
    case "cycleCalcul":
    case "ProcessFinished":
      if (!DATA["📊"] || typeof DATA["📊"].total_flux !== "number") return;
      if (!window.plotData) {
        window.plotData = { lambda_range: null, current: null, co2_ppm: 0, ch4_ppm: 0, temp_surface: 0 };
      }
      epochId = DATA["📜"]["🗿"];
      var ep = window.configOrganigramme.timeline.find(function (e) {
        return e.type === "epoch" && e.id === epochId;
      });
      if (ep) window.currentEpochName = ep.name;
      window.h2oVaporPercent = Math.min(
        100,
        Math.max(0, DATA["💧"]["🍰🫧💧"] * 100 + window.h2oTotalFromMeteorites),
      );
      window.waterVaporEnabled = window.h2oVaporPercent > 0;
      // ppm CO2/CH4 = fraction molaire × 1e6 (co2KgToFraction/ch4KgToFraction), pas fraction massique × 1e6
      const atm_kg = DATA["⚖️"]["⚖️🫧"];
      const M_air = DATA["🫧"]["🧪"];
      window.plotData.co2_ppm =
        window.co2KgToFraction(DATA["⚖️"]["⚖️🏭"], atm_kg, M_air) * 1e6;
      window.plotData.ch4_ppm =
        window.ch4KgToFraction(DATA["⚖️"]["⚖️🐄"], atm_kg, M_air) * 1e6;
      T0_num = DATA["🧮"]["🧮🌡️"];
      total_flux_num = DATA["📊"].total_flux;
      albedo_num = DATA["🪩"]["🍰🪩📿"];
      cloud_coverage_num = DATA["🪩"]["☁️"];
      co2_ppm_num =
        window.co2KgToFraction(DATA["⚖️"]["⚖️🏭"], atm_kg, M_air) * 1e6;
      ch4_ppm_num =
        window.ch4KgToFraction(DATA["⚖️"]["⚖️🐄"], atm_kg, M_air) * 1e6;
      // Part EDS vapeur (W/m²) = 🧲📛💧 ; 🔺📛💧 = ΔF H₂O (formule ln), autre grandeur
      forcing_H2O = DATA["📛"]["🧲📛💧"];
      isCO2_eds = window.isCO2_eds;
      isCH4_eds = window.isCH4_eds;
      isH2O_eds = window.isH2O_eds;
      isAlbedo = window.isAlbedo;
      h2o_enabled = window.waterVaporEnabled;
      hasNoAtmosphere = (function () {
        var epoch = window.getGeologicalPeriodByName(window.currentEpochName);
        return (
          epoch.total_atmosphere_mass_kg === 0 ||
          epoch.total_atmosphere_mass_kg === undefined
        );
      })();
      // cycleCalcul / ProcessFinished : garder l'albédo calculé (window.DATA['🪩']['🍰🪩📿']), ne pas écraser
      break;
    default:
      return;
  }
  // Définir les fonctions helper AVANT l'appel à FluxManager
  // (elles seront utilisées par FluxManager et par la suite dans cette fonction)

  // Fonction pour détecter le type de valeur (W, W/m², %, ppm) pour la couleur
  const detectValueType = (text) => {
    if (!text) return null;
    const textStr = String(text);
    // Détecter W/m² ou MW/m² (après conversion)
    if (
      textStr.includes("W/m²") ||
      textStr.includes("W/m2") ||
      textStr.includes("MW/m²") ||
      textStr.includes("MW/m2")
    )
      return "watt_per_m2";
    // Détecter MW ou W (mais pas W/m² qui est déjà géré ci-dessus)
    if (
      textStr.includes("MW") ||
      (textStr.includes(" W") &&
        !textStr.includes("W/m²") &&
        !textStr.includes("W/m2"))
    )
      return "watt";
    if (textStr.includes("%")) return "percent";
    if (textStr.includes("ppm")) return "ppm";
    return null;
  };

  // Fonction pour formater une valeur numérique avec notation scientifique si nécessaire
  const formatNumberWithScientific = (num) => {
    if (typeof num !== "number" || isNaN(num)) return String(num);

    // Si le nombre est >= 1000, utiliser notation scientifique (calcul mathématique)
    if (Math.abs(num) >= 1000) {
      // Calculer l'exposant mathématiquement
      const exponent = Math.floor(Math.log10(Math.abs(num)));
      const mantissa = num / Math.pow(10, exponent);
      return `${mantissa.toFixed(2)}×10<sup><b>${exponent}</b></sup>`;
    }
    // Sinon, afficher avec 2 décimales
    return num.toFixed(2);
  };

  // Fonction générique qui lit le template depuis la config et remplace les valeurs
  const formatValueFromTemplate = (dataId, value) => {
    // Chercher le template dans la config des arcs
    if (!window.configOrganigramme || !window.configOrganigramme.arcs) {
      return String(value);
    }

    let template = null;
    let labelPath = null; // 'name', 'txtF', 'txtD'

    // Parcourir tous les arcs pour trouver le dataId
    for (const arc of window.configOrganigramme.arcs) {
      if (!arc.label) continue;

      // Vérifier name
      if (
        arc.label.name &&
        typeof arc.label.name === "object" &&
        arc.label.name.dataId === dataId
      ) {
        template = arc.label.name.text;
        labelPath = "name";
        break;
      }
      // Vérifier txtF (peut être un objet unique ou un tableau d'objets)
      if (arc.label.txtF) {
        if (Array.isArray(arc.label.txtF)) {
          // Si txtF est un tableau, chercher dans chaque élément
          for (const txtFItem of arc.label.txtF) {
            if (typeof txtFItem === "object" && txtFItem.dataId === dataId) {
              template = txtFItem.text;
              labelPath = "txtF";
              break;
            }
          }
          if (template) break;
        } else if (
          typeof arc.label.txtF === "object" &&
          arc.label.txtF.dataId === dataId
        ) {
          template = arc.label.txtF.text;
          labelPath = "txtF";
          break;
        }
      }
      // Vérifier txtD
      if (
        arc.label.txtD &&
        typeof arc.label.txtD === "object" &&
        arc.label.txtD.dataId === dataId
      ) {
        template = arc.label.txtD.text;
        labelPath = "txtD";
        break;
      }
      // Vérifier txtDD (avant le début de la flèche)
      if (
        arc.label.txtDD &&
        typeof arc.label.txtDD === "object" &&
        arc.label.txtDD.dataId === dataId
      ) {
        template = arc.label.txtDD.text;
        labelPath = "txtDD";
        break;
      }
      if (Array.isArray(arc.label.txtDD)) {
        for (const item of arc.label.txtDD) {
          if (typeof item === "object" && item.dataId === dataId) {
            template = item.text;
            labelPath = "txtDD";
            break;
          }
        }
        if (template) break;
      }
      // Vérifier txtFF (après le bout de la flèche)
      if (
        arc.label.txtFF &&
        typeof arc.label.txtFF === "object" &&
        arc.label.txtFF.dataId === dataId
      ) {
        template = arc.label.txtFF.text;
        labelPath = "txtFF";
        break;
      }
      if (Array.isArray(arc.label.txtFF)) {
        for (const item of arc.label.txtFF) {
          if (typeof item === "object" && item.dataId === dataId) {
            template = item.text;
            labelPath = "txtFF";
            break;
          }
        }
        if (template) break;
      }
    }

    // Si pas de template trouvé, chercher dans les nœuds (pour les boutons)
    if (!template && window.configOrganigramme.nodes) {
      for (const node of window.configOrganigramme.nodes) {
        // Chercher dans left, right, top, bottom
        const searchInArray = (arr) => {
          if (!Array.isArray(arr)) return null;
          for (const item of arr) {
            if (item && typeof item === "object" && item.dataId === dataId) {
              return item.text;
            }
          }
          return null;
        };
        template =
          searchInArray(node.left) ||
          searchInArray(node.right) ||
          searchInArray(node.top) ||
          searchInArray(node.bottom);
        if (template) break;
      }
    }

    // Si pas de template, retourner la valeur formatée simplement
    if (!template) {
      if (typeof value === "number") {
        return formatNumberWithScientific(value);
      }
      // Si c'est une string (comme albedoBreakdown), la retourner telle quelle
      return String(value);
    }

    // Remplacer les valeurs numériques dans le template
    // On calcule mathématiquement la notation scientifique, puis on remplace avec une regex simple
    let result = template;

    if (typeof value === "number") {
      // Détecter si le template contient "ppm" ou "%"
      const hasPpmInTemplate = template.includes("ppm");
      const hasPercentInTemplate = template.includes("%");

      // Logique de conversion :
      // - Si template contient " W" (watts) et valeur >= 10^6 : convertir en MW (diviser par 10^6)
      // - Si template contient "%" ET dataId est co2_percent ou ch4_percent : la valeur est en ppm, convertir en % (diviser par 10000)
      //   Exemple: 1000000 ppm → 100%, 6400 ppm → 0.64%, 0 ppm → 0%
      // - Si template contient "%" ET dataId est déjà en % (albedo_percent, h2o_percent, passing_albedo_percent) : ne pas convertir
      // - Si template contient "ppm" et valeur > 10000 : convertir en % (diviser par 10000)
      // - Si template contient "ppm" et valeur <= 10000 : afficher en ppm (entier)
      // Note: Les valeurs passées pour co2_percent et ch4_percent sont toujours en ppm
      //       Les valeurs passées pour albedo_percent, h2o_percent, passing_albedo_percent sont déjà en % (0-100)
      let valueToFormat = value;
      let shouldConvertPpmToPercent = false;
      let shouldConvertPercentToPpm = false;
      let shouldConvertWattToMW = false;

      // Détecter si le template contient " W" (watts) mais pas "W/m²" ou "W/m2"
      const hasWattInTemplate =
        (template.includes(" W") || template.includes(" W ")) &&
        !template.includes("W/m²") &&
        !template.includes("W/m2");
      // Détecter si le template contient "W/m²" ou "W/m2" (watts par m²)
      const hasWattPerM2InTemplate =
        template.includes("W/m²") || template.includes("W/m2");

      // Si template contient " W" (sans /m²) et valeur >= 10^5, convertir en MW
      // Pour les très grandes valeurs (>= 10^9), garder la notation scientifique et soustraire 6 de l'exposant
      // Pour les valeurs moyennes (10^5 à 10^9), convertir en MW sans notation scientifique
      // Exemple: 1×10^6 W → 1.00 MW, 1×10^5 W → 0.10 MW
      if (hasWattInTemplate && Math.abs(value) >= 1e5) {
        if (Math.abs(value) >= 1e9) {
          // Très grande valeur : garder notation scientifique, soustraire 6 de l'exposant
          // Exemple: 3×10^26 W → 3×10^20 MW
          shouldConvertWattToMW = true;
          // On ne divise pas maintenant, on le fera lors du formatage en soustrayant 6 de l'exposant
        } else {
          // Valeur moyenne (>= 10^5) : convertir en MW sans notation scientifique
          // Exemple: 1.76×10^6 W → 1.76 MW, 1×10^5 W → 0.10 MW
          valueToFormat = value / 1e6;
          shouldConvertWattToMW = true;
        }
      }

      // Si template contient "W/m²" et valeur >= 10^5, convertir en MW/m²
      // Pour les très grandes valeurs (>= 10^9), garder la notation scientifique et soustraire 6 de l'exposant
      // Pour les valeurs moyennes (10^5 à 10^9), convertir en MW/m² sans notation scientifique
      // Exemple: 2×10^6 W/m² → 2.00 MW/m², 1.16×10^5 W/m² → 0.12 MW/m²
      if (hasWattPerM2InTemplate && Math.abs(value) >= 1e5) {
        if (Math.abs(value) >= 1e9) {
          // Très grande valeur : garder notation scientifique, soustraire 6 de l'exposant
          // Exemple: 3×10^26 W/m² → 3×10^20 MW/m²
          shouldConvertWattToMW = true;
          // On ne divise pas maintenant, on le fera lors du formatage en soustrayant 6 de l'exposant
        } else {
          // Valeur moyenne (>= 10^5) : convertir en MW/m² sans notation scientifique
          // Exemple: 2.00×10^6 W/m² → 2.00 MW/m², 1.16×10^5 W/m² → 0.12 MW/m²
          valueToFormat = value / 1e6;
          shouldConvertWattToMW = true;
        }
      }

      // DataId qui sont déjà en % (pas de conversion ppm -> %)
      const percentDataIds = [
        "albedo_percent",
        "h2o_percent",
        "passing_albedo_percent",
      ];
      const isAlreadyInPercent = percentDataIds.includes(dataId);

      if (hasPercentInTemplate && !hasPpmInTemplate && !isAlreadyInPercent) {
        // Template avec "%" et dataId n'est pas déjà en % : la valeur est en ppm, convertir en %
        // 0 ppm = 0%, 10000 ppm = 1%, 1000000 ppm = 100%
        valueToFormat = value / 10000; // Convertir ppm en %
        shouldConvertPpmToPercent = true; // Pour remplacer "%" par "%" (pas de changement d'unité, juste conversion)
      } else if (hasPpmInTemplate && !hasPercentInTemplate && value > 10000) {
        // Template avec "ppm", valeur > 10000 : convertir en %
        valueToFormat = value / 10000; // Convertir ppm en %
        shouldConvertPpmToPercent = true; // Pour remplacer "ppm" par "%"
      }

      // Pour les ppm : jamais de notation scientifique, toujours entier
      // Pour les % : 1 décimale
      // Pour le reste : notation scientifique si >= 1000

      // Vérifier si le template contient déjà un <b> dans le <sup> (pour le préserver)
      const hasBoldInTemplate =
        template.includes("<sup><b>") || template.includes("<sup> <b>");

      let formattedValue;

      // Cas spécial : ppm (même après conversion) - toujours entier, jamais notation scientifique
      if (hasPpmInTemplate || shouldConvertPercentToPpm) {
        formattedValue =
          valueToFormat > 0 ? Math.floor(valueToFormat).toString() : "0";
      }
      // Cas spécial : % (normal ou après conversion ppm -> %)
      else if (hasPercentInTemplate || shouldConvertPpmToPercent) {
        formattedValue = valueToFormat.toFixed(1);
      }
      // Cas spécial : MW (après conversion W -> MW)
      else if (shouldConvertWattToMW) {
        // Si la valeur originale est >= 10^9, utiliser notation scientifique avec exposant réduit de 6
        if (Math.abs(value) >= 1e9) {
          const exponent = Math.floor(Math.log10(Math.abs(value)));
          const mantissa = value / Math.pow(10, exponent);
          const mwExponent = exponent - 6; // Soustraire 6 pour convertir W -> MW
          // Préserver le <b> si présent dans le template
          if (hasBoldInTemplate) {
            formattedValue = `${mantissa.toFixed(2)}×10<sup><b>${mwExponent}</b></sup>`;
          } else {
            formattedValue = `${mantissa.toFixed(2)}×10<sup>${mwExponent}</sup>`;
          }
        } else {
          // Valeur moyenne : format simple en MW
          formattedValue = valueToFormat.toFixed(2);
        }
      }
      // Cas général : notation scientifique si >= 1000
      else {
        const shouldUseScientific = Math.abs(valueToFormat) >= 1000;
        if (shouldUseScientific) {
          // Calculer l'exposant mathématiquement
          const exponent = Math.floor(Math.log10(Math.abs(valueToFormat)));
          const mantissa = valueToFormat / Math.pow(10, exponent);
          // Préserver le <b> si présent dans le template
          if (hasBoldInTemplate) {
            formattedValue = `${mantissa.toFixed(2)}×10<sup><b>${exponent}</b></sup>`;
          } else {
            formattedValue = `${mantissa.toFixed(2)}×10<sup>${exponent}</sup>`;
          }
        } else {
          formattedValue = valueToFormat.toFixed(2);
        }
      }

      // Regex simple : détecte un nombre (simple ou avec notation scientifique, avec ou sans <b>)
      // Pattern flexible : détecte ×10<sup>XX</sup> ou ×10<sup><b>XX</b></sup>
      // On doit capturer le pattern complet pour le remplacer
      const numberPattern =
        /\d+(?:\.\d+)?(?:×10<sup>(?:<b>)?\d+(?:<\/b>)?<\/sup>)?/;

      if (numberPattern.test(template)) {
        // Remplacer le premier nombre trouvé par la valeur formatée (qui contient déjà le <b>)
        result = template.replace(numberPattern, formattedValue);

        // Si conversion ppm -> %, remplacer "ppm" par "%" dans le template
        if (shouldConvertPpmToPercent) {
          result = result.replace(/ppm/g, "%");
        }
        // Si conversion % -> ppm, remplacer "%" par "ppm" dans le template
        if (shouldConvertPercentToPpm) {
          result = result.replace(/%/g, "ppm");
        }
        // Si conversion W -> MW, remplacer "W/m²" par "MW/m²" ou " W" par " MW" dans le template
        if (shouldConvertWattToMW) {
          // D'abord remplacer "W/m²" par "MW/m²" pour préserver l'unité
          result = result.replace(/W\/m²/g, "MW/m²");
          result = result.replace(/W\/m2/g, "MW/m2");
          // Ensuite remplacer " W" (avec espace) par " MW" pour les autres cas
          result = result.replace(/\s+W\b/g, " MW");
        }
      } else {
        // Aucun nombre trouvé, remplacer tout le template
        result = formattedValue;
        // Si conversion ppm -> %, ajouter "%" au lieu de "ppm"
        if (shouldConvertPpmToPercent) {
          result = result + "%";
        }
        // Si conversion % -> ppm, ajouter "ppm" au lieu de "%"
        if (shouldConvertPercentToPpm) {
          result = result + "ppm";
        }
        // Si conversion W -> MW, ajouter "MW" ou "MW/m²" selon le template original
        if (shouldConvertWattToMW) {
          // Vérifier si le template original contenait "W/m²" pour préserver l'unité
          if (template.includes("W/m²") || template.includes("W/m2")) {
            result = result + " MW/m²";
          } else {
            result = result + " MW";
          }
        }
      }
    } else {
      // Si c'est une string, ne pas remplacer (c'est déjà formaté, comme albedoBreakdown)
      // Retourner la valeur telle quelle si c'est une string complexe
      return String(value);
    }

    return result;
  };

  const FINE_TUNING_TOOLTIP_SHORT = getFineTuningShortTooltip("100");

  // Fonction helper pour mettre à jour un label par dataId (utilise maintenant le template)
  const updateLabel = (dataId, value, format = "auto") => {
    const labels = document.querySelectorAll(`[data-id="${dataId}"]`);
    labels.forEach((label) => {
      let formattedValue;

      if (dataId === "fine_tuning_cloud_bary") {
        let pctStr;
        if (typeof value === "number" && Number.isFinite(value)) {
          pctStr = String(Math.round(Math.max(0, Math.min(100, value))));
        } else if (format === "text" && typeof value === "string") {
          const m = value.replace(/<[^>]*>/g, " ").match(/(\d+(?:\.\d+)?)\s*%/);
          pctStr = m ? String(Math.round(parseFloat(m[1], 10))) : "100";
        } else {
          const tmp =
            format === "text" && typeof value === "string"
              ? value
              : formatValueFromTemplate(dataId, value);
          const m = String(tmp).replace(/<[^>]*>/g, " ").match(/(\d+(?:\.\d+)?)\s*%/);
          pctStr = m ? String(Math.round(parseFloat(m[1], 10))) : "100";
        }
        formattedValue = pctStr + "%";
        const detail = getFineTuningDetailAlt(pctStr, true);
        const existingSlider = label.querySelector(".organigram-bary-mini-slider");
        const pctEl = label.querySelector(".organigram-bary-pct");
        if (existingSlider && pctEl) {
          pctEl.textContent = pctStr + "%";
          existingSlider.value = pctStr;
        } else {
          label.innerHTML =
            '<div class="organigram-bary-face organigram-bary-face--two-cols">' +
            '<div class="organigram-bary-col organigram-bary-col-left">' +
            '<div class="organigram-bary-icons">🔺🌡️🔻</div>' +
            '<div class="organigram-bary-line-slider">' +
            '<input class="organigram-bary-mini-slider" type="range" min="0" max="100" step="1" value="' +
            pctStr +
            '" aria-label="Réglage fin barycentre nuages">' +
            "</div></div>" +
            '<div class="organigram-bary-col organigram-bary-col-right">' +
            '<div class="organigram-bary-icons organigram-bary-icons-puzzle">🧩</div>' +
            '<span class="organigram-bary-pct">' +
            pctStr +
            "%</span></div></div>";
        }
        label.setAttribute("data-tooltip", getFineTuningShortTooltip(pctStr));
        label.setAttribute("aria-label", detail || FINE_TUNING_TOOLTIP_SHORT);
        label.removeAttribute("title");
      } else {
        if (format === "text" && typeof value === "string") {
          formattedValue = value;
        } else {
          formattedValue = formatValueFromTemplate(dataId, value);
        }
        label.innerHTML = formattedValue;
      }
      // Détecter automatiquement le type pour la couleur
      const valueType = detectValueType(formattedValue);

      // Réinitialiser toutes les classes de couleur
      label.classList.remove(
        "watt-per-m2",
        "watt-or-kelvin",
        "zero-value",
        "co2-label",
        "percent-label",
        "ppm-label",
        "flux-label-plain-metric",
      );

      // Exception : albedo_percents (breakdown détaillé) ne doit jamais être grisé
      // Le détail affiche la structure (🌋 0% x0.05, etc.) toujours informative
      if (dataId === "albedo_percents") {
        // Pas de zero-value, fin du traitement pour ce label (contenu déjà mis à jour ci-dessus)
      } else {
        // Vérifier si la valeur est 0 (ou proche de 0)
        // Convertir la valeur en nombre si possible (extraire le nombre du formattedValue ou utiliser value)
        let numericValue = 0;
        if (typeof value === "number") {
          numericValue = value;
        } else if (typeof value === "string") {
          // Essayer d'extraire un nombre de la string
          const numMatch = value.match(/[\d.]+/);
          if (numMatch) {
            numericValue = parseFloat(numMatch[0]);
          }
        }

        // Vérifier si le label est lié à un bouton
        // Note: forcing_total et albedo_percent sont sur le bouton albedo, mais forcing_total est aussi sur la flèche reemis->terre
        // On doit vérifier si c'est le label du bouton albedo ou celui de la flèche
        const isButtonLabel =
          dataId === "co2_percent" ||
          dataId === "co2_forcing_wm" ||
          dataId === "ch4_percent" ||
          dataId === "ch4_forcing_wm" ||
          dataId === "h2o_percent" ||
          dataId === "h2o_forcing_wm" ||
          dataId === "albedo_percent" ||
          dataId === "albedo_forcing";

        // 🔒 UTILISER UNIQUEMENT les variables globales uniques pour déterminer l'état des boutons
        // Récupérer l'état du bouton depuis les variables globales uniques (seule référence)
        let isButtonActive = true;
        if (dataId === "co2_percent" || dataId === "co2_forcing_wm") {
          isButtonActive =
            typeof window !== "undefined"
              ? window.isCO2_eds !== undefined
                ? window.isCO2_eds
                : true
              : true;
        } else if (dataId === "ch4_percent" || dataId === "ch4_forcing_wm") {
          isButtonActive =
            typeof window !== "undefined"
              ? window.isCH4_eds !== undefined
                ? window.isCH4_eds
                : true
              : true;
        } else if (dataId === "h2o_percent" || dataId === "h2o_forcing_wm") {
          isButtonActive =
            typeof window !== "undefined"
              ? window.isH2O_eds !== undefined
                ? window.isH2O_eds
                : true
              : true;
        } else if (dataId === "albedo_percent" || dataId === "albedo_forcing") {
          isButtonActive =
            typeof window !== "undefined"
              ? window.isAlbedo !== undefined
                ? window.isAlbedo
                : true
              : true;
        }

        // Vérifier si forcing_total est sur le bouton albedo (pas sur la flèche)
        // Le label du bouton albedo est dans la cellule cell-albedo-btn
        // Vérifier si le label est dans la cellule du bouton albedo
        const isAlbedoButtonLabel =
          dataId === "forcing_total" &&
          label.closest("#cell-albedo-btn") !== null;

        // 🔒 CORRECTION : forcing_total (EDS) ne doit PAS dépendre de l'état des boutons
        // L'EDS est l'effet de serre réel calculé par le transfert radiatif, qui est toujours valide
        // Même si les boutons sont inactifs, l'EDS existe physiquement
        // Exception : si forcing_total est sur le bouton albedo ET que le bouton est inactif,
        // on peut le griser (mais c'est juste esthétique, l'EDS existe toujours)
        const isForcingTotal = dataId === "forcing_total";
        const isForcingTotalOnAlbedoButton =
          isForcingTotal && isAlbedoButtonLabel;

        // 🔒 Gris uniquement si bouton inactif, pas si valeur = 0
        if (isForcingTotal && !isForcingTotalOnAlbedoButton) {
          if (valueType === "watt_per_m2") label.classList.add("watt-per-m2");
        } else if (!isButtonActive && !isForcingTotal) {
          label.classList.add("zero-value");
        } else {
          // Valeur non nulle et bouton actif : appliquer la couleur selon l'unité
          if (valueType === "watt_per_m2") {
            label.classList.add("watt-per-m2");
          } else if (valueType === "watt") {
            label.classList.add("watt-or-kelvin");
          } else if (valueType === "percent") {
            label.classList.add("percent-label");
          } else if (valueType === "ppm") {
            label.classList.add("ppm-label");
          }

          // Vérifier si c'est un label CO2 pour appliquer la classe spécifique
          // Pour co2_forcing_wm, ne jamais ajouter co2-label (utiliser uniquement la couleur selon l'unité)
          // pour éviter que le vert écrase l'orange
          if (dataId === "co2_percent") {
            label.classList.add("co2-label");
          }
          // co2_forcing_wm utilise uniquement la couleur selon l'unité (watt-per-m2 pour orange)
        }
      } // fin else (albedo_percents)
      syncFluxLabelPlainMetric(label);
    });
  };

  // Exposer updateLabel globalement pour que FluxManager puisse l'utiliser
  if (typeof window !== "undefined") {
    window.updateLabel = updateLabel;
  }

  // Déléguer la mise à jour des flux d'entrée (Soleil, Noyau) au FluxManager
  // (maintenant que updateLabel est disponible)
  if (window.FluxManager && window.currentEpochName) {
    window.FluxManager.updateAllFluxes(window.currentEpochName);
  }

  // Source prioritaire pour le flux solaire : DATA['☀️'] (rempli par époque), sinon CONST
  const soleilData = typeof window !== "undefined" && window.DATA && window.DATA["☀️"];
  const SOLAR_CONSTANT =
    soleilData && Number.isFinite(soleilData["🧲☀️"])
      ? soleilData["🧲☀️"]
      : CONST.SOLAR_CONSTANT;
  const GEOTHERMIE_FLUX = DATA["🌕"]["🧲🌕"];

  // Pour les calculs de moyenne (si utilisés plus bas) : 🧲☀️🎱 = S/4
  const SOLAR_FLUX_AVERAGE =
    soleilData && Number.isFinite(soleilData["🧲☀️🎱"])
      ? soleilData["🧲☀️🎱"]
      : SOLAR_CONSTANT / 4;

  // Mettre à jour les labels Soleil / Géométrie depuis DATA['☀️'] pour que l’affichage suive l’époque
  if (soleilData) {
    if (Number.isFinite(soleilData["🧲☀️"])) {
      updateLabel("solar_1UA_mw", soleilData["🧲☀️"]);
      if (window.CONST) window.CONST.SOLAR_CONSTANT = soleilData["🧲☀️"];
    }
    if (Number.isFinite(soleilData["🔋☀️"])) {
      updateLabel("solar_power_total", soleilData["🔋☀️"]);
      const SOLAR_SURFACE_AREA = 6.09e18;
      const solarSurfaceFluxMW = soleilData["🔋☀️"] / SOLAR_SURFACE_AREA / 1e6;
      updateLabel("solar_surface_mw", solarSurfaceFluxMW);
    }
  }

  // Détecter le mode "Corps Noir" : basé sur les propriétés physiques de l'époque
  const isCorpsNoir = isBlackBodyEpoch();

  // 🔒 SUPPRESSION : Ne plus forcer l'albedo à 0 en Corps noir
  // L'albedo doit être affiché selon l'état du bouton albedo (checked/unchecked), pas selon hasNoAtmosphere
  // L'albedo peut être > 0 même en Corps noir si de la glace est ajoutée via météorites
  // hasNoAtmosphere ne sert que pour d'autres calculs (pas pour l'affichage de l'albedo)

  // Forcer cloud_coverage à 0 en mode corps noir (pas d'atmosphère = pas de nuages)
  if (hasNoAtmosphere) {
    cloud_coverage_num = 0;
  }

  // Calculer les valeurs dynamiques
  // Utiliser data.albedo qui vient de la simulation (calculé avec tous les paramètres corrects)
  // Seulement recalculer si data.albedo n'est pas défini

  // 🔒 SUPPRESSION : Ne plus forcer l'albedo à 0 en Corps noir
  // L'albedo doit être affiché selon l'état du bouton albedo (checked/unchecked), pas selon hasNoAtmosphere
  // L'albedo peut être > 0 même en Corps noir si de la glace est ajoutée via météorites

  if (!hasNoAtmosphere && albedo_num === 0) {
    // Si albedo_num est 0 ou data.albedo n'est pas défini, recalculer avec le flux géothermique
    let geo_flux = null;
    if (typeof window !== "undefined" && window.currentEpochName) {
      const currentEpoch = window.getGeologicalPeriodByName(
        window.currentEpochName,
      );
      if (currentEpoch && typeof currentEpoch.geothermal_flux === "number") {
        geo_flux = currentEpoch.geothermal_flux;
      }
    }
    if (
      typeof window !== "undefined" &&
      typeof window.calculateAlbedo === "function"
    ) {
      albedo_num = window.calculateAlbedo(T0_num, h2o_enabled, geo_flux);
    }
  }
  // Sinon, utiliser data.albedo qui vient de la simulation (déjà calculé avec tous les paramètres)

  // 🔒 FORMULE TOUJOURS UTILISÉE : solar_flux_absorbed_wm = solar_flux_average_wm - solar_flux_reflected_wm
  // Pas de cas particulier, même en corps noir (albedo = 0, donc solar_flux_reflected_wm = 0)
  // Entrer dans la formule avec des paramètres à 0 est plus propre que de zapper des étapes
  let solar_flux_absorbed;
  // Récupérer le flux géothermique pour calculateSolarFluxAbsorbed
  let geo_flux = null;
  if (
    typeof window !== "undefined" &&
    window.currentEpochName &&
    typeof window.getGeologicalPeriodByName === "function"
  ) {
    const currentEpoch = window.getGeologicalPeriodByName(
      window.currentEpochName,
    );
    if (currentEpoch && typeof currentEpoch.geothermal_flux === "number") {
      geo_flux = currentEpoch.geothermal_flux;
    }
  }
  // 🔒 TOUJOURS utiliser calculateSolarFluxAbsorbed (même en corps noir)
  // La fonction utilise la formule : solar_flux_absorbed_wm = solar_flux_average_wm - solar_flux_reflected_wm
  // En corps noir, albedo = 0, donc solar_flux_reflected_wm = 0, donc solar_flux_absorbed_wm = solar_flux_average_wm
  solar_flux_absorbed = window.calculateSolarFluxAbsorbed(T0_num, h2o_enabled, geo_flux);

  // Calculer le flux réfléchi avec l'albedo (venant de data.albedo ou recalculé)
  const flux_reflected = SOLAR_FLUX_AVERAGE * albedo_num;

  // Calculer la couverture de glace (même logique que calculateAlbedo)
  // 🔒 CORRECTION : En mode "corps noir", on peut avoir de la glace des météorites
  let ice_coverage = 0;
  let cloud_percent = 0;

  // 🔒 PRIORITÉ 1 : Utiliser la valeur calculée par calculateAlbedo (la plus récente et précise)
  if (
    typeof window !== "undefined" &&
    window.h2oIceFractionFromCalculation !== undefined
  ) {
    ice_coverage = Math.min(
      1,
      Math.max(0, window.h2oIceFractionFromCalculation),
    );
  } else if (hasNoAtmosphere) {
    // Corps noir sans glace calculée : pas d'albedo (pas d'atmosphère, pas d'eau)
    ice_coverage = 0;
    cloud_percent = 0;
  } else {
    const T_surface_C = T0_num - 273.15;
    const volcanoIceReduction =
      typeof window !== "undefined" && window.volcanoIceReduction !== undefined
        ? window.volcanoIceReduction / 100
        : 0; // Réduction en fraction (0 à 1)

    // Récupérer le flux géothermique depuis l'époque courante
    let geo_flux = 0.087; // Valeur par défaut (moderne)
    if (typeof window !== "undefined" && window.currentEpochName) {
      const currentEpoch = window.getGeologicalPeriodByName(
        window.currentEpochName,
      );
      if (currentEpoch && typeof currentEpoch.geothermal_flux === "number") {
        geo_flux = currentEpoch.geothermal_flux;
      }
    }

    // Calculer la glace seulement si température < 0°C ET pas en mode corps noir
    // Limiter à des températures raisonnables (pas en dessous de -100°C pour éviter les valeurs extrêmes)
    if (T_surface_C < 0 && T_surface_C > -100) {
      // Même formule que dans calculateAlbedo
      // À -2.2°C : fraction ≈ 0.7 (70%)
      // À -10°C : fraction ≈ 0.97 (97%)
      // À -50°C : fraction ≈ 1 (100%)
      ice_coverage = Math.min(1, 1 - Math.exp(T_surface_C / 3));
      // Réduire selon l'effet volcanique
      ice_coverage = Math.max(0, ice_coverage - volcanoIceReduction);
      // ⚠️ NOUVEAU : Réduire la glace selon le flux géothermique
      // Le flux géothermique réchauffe la surface et fait fondre la glace
      // 15 W/m² est énorme et devrait empêcher la formation de glace
      // Formule : réduction proportionnelle au flux géothermique
      // À 0 W/m² : pas de réduction
      // À 15 W/m² : réduction maximale (fonte complète de la glace)
      // Utiliser une fonction qui réduit la glace progressivement avec le flux
      // Seuil : au-delà de 10 W/m², la glace fond complètement
      const geo_flux_reduction = Math.min(1, geo_flux / 10); // Réduction de 0 à 1 selon le flux (seuil à 10 W/m²)
      ice_coverage = Math.max(0, ice_coverage * (1 - geo_flux_reduction));
    } else if (T_surface_C <= -100) {
      // Température extrêmement basse (proche du zéro absolu) : pas de glace
      // À ces températures, l'eau n'existe plus sous forme de glace (sublimation)
      // EN MODE CORPS NOIR : forcer à 0 car pas d'eau ni d'atmosphère
      ice_coverage = 0;
    }

    // Nuages : utiliser la valeur calculée (déjà à 0 si H2O désactivé ou très froid)
    // cloud_percent = Math.round(cloud_coverage_num * 100); // Déplacé après le if/else
  }

  // 🔒 CORRECTION : Calculer cloud_percent dans tous les cas (sauf si forcé à 0 par corps noir)
  cloud_percent = parseFloat((cloud_coverage_num * 100).toFixed(1));

  // 🔒 CORRECTION : Si on a utilisé h2oIceFractionFromCalculation, ne pas écraser cloud_percent si pas d'atmosphère
  if (
    hasNoAtmosphere &&
    (typeof window === "undefined" ||
      window.h2oIceFractionFromCalculation === undefined)
  ) {
    cloud_percent = 0;
  }

  const ice_percent = Math.round(ice_coverage * 100);

  // Forçages radiatifs
  // 🔒 UTILISER UNIQUEMENT isCO2_eds, isCH4_eds, isH2O_eds, isAlbedo (seule référence)
  const forcing_CO2 =
    isCO2_eds &&
    co2_ppm_num > 0 &&
    typeof window !== "undefined" &&
    typeof window.calculateCO2Forcing === "function"
      ? window.calculateCO2Forcing(co2_ppm_num * 1e-6)
      : 0;
  // CH4 : calculer le diagnostic ΔF (convention affichage, bande ~7.7 μm)
  const forcing_CH4 =
    isCH4_eds &&
    ch4_ppm_num > 0 &&
    typeof window !== "undefined" &&
    typeof window.calculateCH4Forcing === "function"
      ? window.calculateCH4Forcing(ch4_ppm_num * 1e-6)
      : 0;

  // Paramètres H2O (vapeur + météorites) — forcing_H2O = part EDS vapeur (🧲📛💧). Nuages EDS = 🧲📛⛅ (à brancher sur nouveau nœud).
  const h2o_vapor_percent = window.h2oVaporPercent;
  const h2o_from_meteorites = window.h2oTotalFromMeteorites;
  const h2o_total_percent = h2o_vapor_percent + h2o_from_meteorites;
  // 🔒 CORRECTION : Le forçage albédo est actif seulement si isAlbedo est true
  // En mode corps noir, on peut avoir un forçage albedo si il y a de la glace des météorites
  const forcing_Albedo = !isAlbedo
    ? 0
    : typeof window !== "undefined" &&
        typeof window.calculateAlbedoForcing === "function"
      ? window.calculateAlbedoForcing(albedo_num)
      : 0;

  // 🔒 CORRECTION : Le forçage total affiché dans le diagramme (effet de serre) ne doit PAS inclure l'albédo
  // L'albédo agit en amont (réflexion directe). Le forçage "Total" ici est celui de l'effet de serre (Back Radiation).
  //
  // Pour les conditions extrêmes (ex: Hadéen avec 2 MW/m²), utiliser l'effet de serre réel calculé par le transfert radiatif
  // au lieu des formules de forçage standard (qui sont des approximations pour conditions proches de l'équilibre moderne).
  //
  // Effet de serre réel = Flux émis par la surface - Flux sortant au sommet de l'atmosphère
  // (sera calculé après avoir obtenu surface_flux_emitted et total_flux)

  // Calculer d'abord les forçages individuels pour l'affichage des boutons (référence)
  const forcing_CO2_display = forcing_CO2;
  const forcing_CH4_display = forcing_CH4;
  const forcing_H2O_display = forcing_H2O;

  // L'effet de serre réel sera calculé plus tard avec surface_flux_emitted et total_flux
  let forcing_total = forcing_CO2 + forcing_CH4 + forcing_H2O; // Valeur par défaut (sera remplacée si total_flux disponible)

  // Les fonctions helper (detectValueType, formatNumberWithScientific, formatValueFromTemplate, updateLabel)
  // sont déjà définies plus haut dans cette fonction et exposées globalement pour FluxManager

  // Mettre à jour les labels des nœuds
  // Géométrie -> Albedo : flux solaire moyen

  // Mettre à jour les labels des nœuds
  // Géométrie -> Albedo : flux solaire moyen
  updateLabel("solar_flux_average_wm", SOLAR_FLUX_AVERAGE);

  // Géométrie -> Surface : breakdown albedo détaillé
  // Uniquement à ProcessFinished : pendant les cycles (cycleCalcul), la couverture glace
  // est encore au début du ramp (≈0%) alors que le badge albédo reflète déjà
  // la contribution_glace → incohérence visuelle transitoire. On fige le breakdown
  // jusqu'à l'état convergé final.
  if (eventId !== "ProcessFinished") {
    // Flux post-albedo (hors breakdown) : continuer sans toucher albedo_percents
  } else {
  // Récupérer les valeurs de l'époque courante
  // Toujours afficher le magma (volcans) même si couverture à 0%
  // Classer par ordre décroissant de pondération (couverture × albedo)
  let albedoBreakdown = "";

  const createAlbedoComponents = (components) => {
    const sulfate_frac = DATA["🫧"]["🍰🫧✈"];
    const sulfate_pct = (sulfate_frac * 100).toFixed(2);
    const sulfate_ccn_boost_pct = (
      Math.min(0.35, sulfate_frac * 500) * 100
    ).toFixed(1);
    components.forEach((comp) => {
      comp.weight = (comp.coverage / 100) * parseFloat(comp.albedo);
    });
    const cloudComp = components.find(
      (comp) => comp.emoji === CHARS.CLOUD,
    );
    const groundComps = components
      .filter((comp) => comp.emoji !== CHARS.CLOUD)
      .sort((a, b) => b.weight - a.weight);

    const renderComp = (comp) => {
      const coverage_pct = Math.max(0, Math.min(100, Number(comp.coverage)));
      const coverage_display = coverage_pct.toFixed(1);
      const label = CHARS_DESC[comp.emoji] || comp.emoji;
      const landCorpsNoirNote = (comp.emoji === "🌍" && parseFloat(comp.albedo) === 0)
        ? " (corps noir : albédo terre = 0)"
        : "";
      const titleAttr = `title="${label} : ${coverage_display}% couverture × albedo ${comp.albedo}${landCorpsNoirNote}"`;
      const isImage =
        comp.emoji &&
        (comp.emoji.includes(".png") ||
          comp.emoji.includes(".jpg") ||
          comp.emoji.includes(".svg"));
      if (isImage) {
        return `<span ${titleAttr} style="cursor: help;"><img src="${comp.emoji}" alt="${label}"> ${coverage_display}% <span style="font-size: 0.8em;">x${comp.albedo}</span></span>`;
      } else {
        if (comp.emoji === CHARS.CLOUD) {
          const cloudTitle = `title="Nuages : ${coverage_display}% couverture × albedo ${comp.albedo}. Proxy sulfate: ${sulfate_pct}% masse atm, impact CCN +${sulfate_ccn_boost_pct}%."`;
          return `<span ${cloudTitle} style="cursor: help;"><span style="font-size: 1.5em;">${comp.emoji}</span> ${coverage_display}% <span style="font-size: 0.8em;">x${comp.albedo}</span><br><span style="font-size: 0.8em;">↳ <span class="logo">✈</span> CCN +${sulfate_ccn_boost_pct}%</span></span>`;
        }
        return `<span ${titleAttr} style="cursor: help;"><span style="font-size: 1.5em;">${comp.emoji}</span> ${coverage_display}% <span style="font-size: 0.8em;">x${comp.albedo}</span></span>`;
      }
    };

    const wAlb = DATA["🪩"];
    let obsFrac = NaN;
    if (wAlb && Number.isFinite(wAlb["🍰⚽"])) {
      obsFrac = wAlb["🍰⚽"];
    } else if (wAlb && Number.isFinite(wAlb["🍰🪩⚽"])) {
      obsFrac = 1 - wAlb["🍰🪩⚽"];
    }
    const veilFrac = Number.isFinite(obsFrac)
      ? Math.max(0, Math.min(0.95, obsFrac))
      : 0;
    const veilLine =
      veilFrac > 1e-6
        ? `<span style="font-size:0.85em;opacity:0.92;" title="🍰⚽ obstruction (🍰🪩⚽ = 1−🍰⚽ transmission) — SW stratosphérique, hors CCN">⚽ ${(veilFrac * 100).toFixed(1)}% ciel voilé (SW)</span>`
        : "";
    const cloudLine = cloudComp ? renderComp(cloudComp) : "";
    const cloudSection = [cloudLine, veilLine].filter(Boolean).join("<br>");
    const groundLines = groundComps.map(renderComp).join("<br>");
    const separator =
      '<span style="display:block;border-top:1px solid rgba(255,255,255,0.35);margin:2px 0;"></span>';
    if (cloudSection && groundLines)
      return cloudSection + "<br>" + separator + groundLines;
    return cloudSection || groundLines;
  };

  // Albedo : même source que l'API (EARTH['🪩🍰'] + override époque)
  const currentEpochAlbedo = window.getGeologicalPeriodByName(window.currentEpochName);
  const albedoCoeff = {
    ...EARTH["🪩🍰"],
    ...currentEpochAlbedo["🪩🍰"],
  };

  const land_cov = parseFloat(
    (DATA["🪩"]["🍰🪩🌍"] * 100).toFixed(1),
  );

  if (hasNoAtmosphere) {
    const ice_cov_corps_noir = parseFloat((DATA["🪩"]["🍰🪩🧊"] * 100).toFixed(1));
    const land_cov_corps_noir = parseFloat((DATA["🪩"]["🍰🪩🌍"] * 100).toFixed(1));
    const components = [
      {
        emoji: "🎾",
        coverage: 0,
        albedo: albedoCoeff["🪩🍰🎾"].toFixed(2),
      },
      {
        emoji: CHARS.OCEAN,
        coverage: 0,
        albedo: albedoCoeff["🪩🍰🌊"].toFixed(2),
      },
      {
        emoji: CHARS.FOREST,
        coverage: 0,
        albedo: albedoCoeff["🪩🍰🌳"].toFixed(2),
      },
      {
        emoji: CHARS.DESERT,
        coverage: 0,
        albedo: albedoCoeff["🪩🍰🏜️"].toFixed(2),
      },
      {
        emoji: CHARS.ICE,
        coverage: ice_cov_corps_noir,
        albedo: albedoCoeff["🪩🍰🧊"].toFixed(2),
      },
      {
        emoji: CHARS.CLOUD,
        coverage: 0,
        albedo: albedoCoeff["🪩🍰⛅"].toFixed(2),
      },
      { emoji: "🌍", coverage: land_cov_corps_noir, albedo: albedoCoeff["🪩🍰🌍"].toFixed(2) },
    ];
    albedoBreakdown = createAlbedoComponents(components);
  } else if (window.currentEpochName) {
    const currentEpoch = window.getGeologicalPeriodByName(
      window.currentEpochName,
    );
    if (currentEpoch) {
      const magma_cov = parseFloat(
        (DATA["🪩"]["🍰🪩🎾"] * 100).toFixed(1),
      );
      const ocean_cov = parseFloat(
        (DATA["🪩"]["🍰🪩🌊"] * 100).toFixed(1),
      );
      const forest_cov = parseFloat(
        (DATA["🪩"]["🍰🪩🌳"] * 100).toFixed(1),
      );
      const desert_cov = parseFloat(
        (DATA["🪩"]["🍰🪩🏜️"] * 100).toFixed(1),
      );
      const ice_cov = parseFloat(
        (DATA["🪩"]["🍰🪩🧊"] * 100).toFixed(1),
      );
      const cloud_cov = parseFloat((DATA["🪩"]["🍰🪩⛅"] * 100).toFixed(1));

      const magma_alb = albedoCoeff["🪩🍰🎾"].toFixed(2);
      const ocean_alb = albedoCoeff["🪩🍰🌊"].toFixed(2);
      const forest_alb = albedoCoeff["🪩🍰🌳"].toFixed(2);
      const desert_alb = albedoCoeff["🪩🍰🏜️"].toFixed(2);
      const ice_alb = albedoCoeff["🪩🍰🧊"].toFixed(2);
      const cloud_alb = albedoCoeff["🪩🍰⛅"].toFixed(2);

      const components = [
        { emoji: "🎾", coverage: magma_cov, albedo: magma_alb },
        { emoji: CHARS.OCEAN, coverage: ocean_cov, albedo: ocean_alb },
        {
          emoji: CHARS.FOREST,
          coverage: forest_cov,
          albedo: forest_alb,
        },
        {
          emoji: CHARS.DESERT,
          coverage: desert_cov,
          albedo: desert_alb,
        },
        { emoji: CHARS.ICE, coverage: ice_cov, albedo: ice_alb },
        { emoji: CHARS.CLOUD, coverage: cloud_cov, albedo: cloud_alb },
        { emoji: "🌍", coverage: land_cov, albedo: albedoCoeff["🪩🍰🌍"].toFixed(2) },
      ];
      albedoBreakdown = createAlbedoComponents(components);
    } else {
      const final_cloud_percent = parseFloat(cloud_percent.toFixed(1));
      const final_ice_percent = parseFloat((ice_coverage * 100).toFixed(1));
      const components = [
        {
          emoji: "🎾",
          coverage: 0,
          albedo: albedoCoeff["🪩🍰🎾"].toFixed(2),
        },
        {
          emoji: CHARS.OCEAN,
          coverage: 0,
          albedo: albedoCoeff["🪩🍰🌊"].toFixed(2),
        },
        {
          emoji: CHARS.FOREST,
          coverage: 0,
          albedo: albedoCoeff["🪩🍰🌳"].toFixed(2),
        },
        {
          emoji: CHARS.DESERT,
          coverage: 0,
          albedo: albedoCoeff["🪩🍰🏜️"].toFixed(2),
        },
        {
          emoji: CHARS.ICE,
          coverage: final_ice_percent,
          albedo: albedoCoeff["🪩🍰🧊"].toFixed(2),
        },
        {
          emoji: CHARS.CLOUD,
          coverage: final_cloud_percent,
          albedo: albedoCoeff["🪩🍰⛅"].toFixed(2),
        },
        { emoji: "🌍", coverage: land_cov, albedo: albedoCoeff["🪩🍰🌍"].toFixed(2) },
      ];
      albedoBreakdown = createAlbedoComponents(components);
    }
  } else {
    const final_cloud_percent = parseFloat(cloud_percent.toFixed(1));
    const final_ice_percent = parseFloat((ice_coverage * 100).toFixed(1));
    const components = [
      {
        emoji: "🎾",
        coverage: 0,
        albedo: albedoCoeff["🪩🍰🎾"].toFixed(2),
      },
      {
        emoji: CHARS.OCEAN,
        coverage: 0,
        albedo: albedoCoeff["🪩🍰🌊"].toFixed(2),
      },
      {
        emoji: CHARS.FOREST,
        coverage: 0,
        albedo: albedoCoeff["🪩🍰🌳"].toFixed(2),
      },
      {
        emoji: CHARS.DESERT,
        coverage: 0,
        albedo: albedoCoeff["🪩🍰🏜️"].toFixed(2),
      },
      {
        emoji: CHARS.ICE,
        coverage: final_ice_percent,
        albedo: albedoCoeff["🪩🍰🧊"].toFixed(2),
      },
      {
        emoji: CHARS.CLOUD,
        coverage: final_cloud_percent,
        albedo: albedoCoeff["🪩🍰⛅"].toFixed(2),
      },
      { emoji: "🌍", coverage: land_cov, albedo: albedoCoeff["🪩🍰🌍"].toFixed(2) },
    ];
    albedoBreakdown = createAlbedoComponents(components);
  }
  updateLabel("albedo_percents", albedoBreakdown, "text");
  } // fin if (eventId === 'ProcessFinished') pour le breakdown albedo
  // Flux qui passe (solar_flux_average - flux_reflected = flux qui arrive à la surface)
  // En mode corps-noir : albedo = 0, donc tout passe (340.25 W/m²)
  const flux_passed = solar_flux_absorbed; // C'est le flux qui arrive à la surface après albédo
  updateLabel("solar_flux_absorbed_wm", flux_passed);

  // Albedo -> Espace1 : flux total au sommet
  updateLabel("solar_flux_reflected_wm", flux_reflected);

  // Noyau -> Surface : géothermie (flux dynamique selon l'époque)
  // Récupérer le flux géothermique de l'époque courante (doit être défini)
  let geothermie_value;
  if (
    typeof window === "undefined" ||
    !window.currentEpochName ||
    typeof window.getGeologicalPeriodByName !== "function"
  ) {
    logAlbedoUi("abort geothermie: epoch courante indisponible");
    console.error(
      "[updateFluxLabels] ❌ ERREUR CRITIQUE : Impossible de récupérer l'époque courante",
    );
    throw new Error(
      "Époque courante requise pour calculer le flux géothermique",
    );
  }

  // Certaines époques internes (hidden=true, ex: hysteresis 1) peuvent ne pas exister côté getGeologicalPeriodByName.
  // Fallback vers TIMELINE (source brute) pour éviter "Époque non trouvée" uniquement sur hidden epochs.
  let currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
  if (!currentEpoch && window.TIMELINE && Array.isArray(window.TIMELINE)) {
    currentEpoch =
      window.TIMELINE.find(function (e) {
        return (
          e &&
          e["📅"] &&
          (e["📅"] === window.currentEpochName ||
            e.name === window.currentEpochName ||
            e.id === window.currentEpochName ||
            (window.CHARS_DESC &&
              window.CHARS_DESC[e["📅"]] === window.currentEpochName))
        );
      }) || null;
  }
  if (!currentEpoch) {
    logAlbedoUi(
      "abort geothermie: currentEpoch introuvable name=" +
        window.currentEpochName,
    );
    console.error(
      "[updateFluxLabels] ❌ ERREUR CRITIQUE : Époque non trouvée:",
      window.currentEpochName,
    );
    throw new Error(`Époque "${window.currentEpochName}" non trouvée`);
  }

  // Récupérer la température du noyau depuis la config de l'époque
  // Si core_temperature n'est pas défini, estimer à partir de core_power_watts ou utiliser une valeur par défaut
  let coreTemp_K;
  if (
    currentEpoch.core_temperature !== undefined &&
    typeof currentEpoch.core_temperature === "number"
  ) {
    coreTemp_K = currentEpoch.core_temperature;
  } else if (
    typeof currentEpoch.core_power_watts === "number" &&
    currentEpoch.core_power_watts > 0
  ) {
    // Estimer la température à partir de la puissance (approximation)
    // Plus la puissance est élevée, plus la température est élevée
    // Archéen: 1.5e14 W → ~5500K (estimation basée sur les commentaires DEPRECATED)
    // Hadéen: 2 MW/m² → 6000K
    // Protérozoïque: 1.0e14 W → ~5000K
    // Mésozoïque: 6.0e13 W → ~4500K
    // Cénozoïque: 5.0e13 W → ~4100K
    // Estimation: T ≈ 3000 + (power / 1e13) * 200
    const power_ratio = currentEpoch.core_power_watts / 1e13;
    coreTemp_K = Math.max(3000, Math.min(6000, 3000 + power_ratio * 200));
  } else if (
    typeof currentEpoch.geothermal_flux === "number" &&
    currentEpoch.geothermal_flux > 0
  ) {
    // Estimer à partir du flux géothermique (approximation)
    // Flux élevé = température élevée
    const flux_ratio = currentEpoch.geothermal_flux / 0.1; // Normaliser par 0.1 W/m² (moderne)
    coreTemp_K = Math.max(3000, Math.min(6000, 4000 + flux_ratio * 500));
  } else {
    // Pas de noyau actif : température = 0
    coreTemp_K = 0;
  }

  // Calculer le flux géothermique depuis les propriétés physiques de l'époque
  if (coreTemp_K === 0 || currentEpoch.geothermal_flux === 0) {
    // Pas de noyau différencié : flux = 0
    geothermie_value = 0;
  } else if (
    typeof currentEpoch.geothermal_flux === "number" &&
    currentEpoch.geothermal_flux > 0
  ) {
    // Flux géothermique défini directement
    geothermie_value = currentEpoch.geothermal_flux;
  } else if (
    typeof currentEpoch.core_power_watts === "number" &&
    currentEpoch.core_power_watts > 0
  ) {
    // Calculer depuis la puissance du noyau et la surface de la planète
    const radius = currentEpoch.planet_radius;
    if (!radius || radius <= 0) {
      logAlbedoUi("abort geothermie: planet_radius invalide");
      console.error(
        "[updateFluxLabels] ❌ ERREUR CRITIQUE : planet_radius invalide pour calculer le flux géothermique",
      );
      throw new Error(
        "planet_radius requis pour calculer le flux géothermique depuis core_power_watts",
      );
    }
    const surface = 4 * Math.PI * Math.pow(radius, 2);
    geothermie_value = currentEpoch.core_power_watts / surface;
  } else {
    logAlbedoUi("abort geothermie: geothermal_flux/core_power_watts manquant");
    console.error(
      "[updateFluxLabels] ❌ ERREUR CRITIQUE : Impossible de déterminer le flux géothermique depuis l'époque",
    );
    throw new Error("geothermal_flux ou core_power_watts requis dans l'époque");
  }

  updateLabel("core_flux_wm", geothermie_value);

  // Surface -> Albedo : Flux total émis par la surface (Loi de Stefan-Boltzmann)
  // C'est la puissance thermodynamique rayonnée par le sol chaud : F = σT⁴
  // ⚠️ CORRECTION CRITIQUE : Ne PAS utiliser solar_flux_absorbed + geothermie_value ici !
  // En présence d'effet de serre, la surface reçoit aussi la "Back Radiation" (non affichée explicitement)
  // et chauffe bien plus que la simple somme solaire + géothermie.
  // La seule vérité est la température de surface T0 trouvée par l'équilibre radiatif.
  const CONST_STEFAN = 5.67e-8; // Renommé pour éviter conflit scope
  let surface_flux_emitted = CONST_STEFAN * Math.pow(T0_num, 4);

  // forcing_total sera calculé plus tard avec la formule : (flux_ejected_watts - surface_flux_emitted_watts) / surfTerre
  // Initialiser à 0 pour l'instant (sera remplacé après le calcul des watts totaux)
  forcing_total = 0;

  // Albedo -> Espace2 : flux éjecté = flux sortant au sommet (résultat direct du transfert radiatif)
  let flux_ejected =
    total_flux_num > 0 ? total_flux_num : surface_flux_emitted - forcing_total;

  // Calculer la surface de la planète (utilisée pour les conversions W/m² <-> W totaux)
  const R = 6371000; // Rayon Terre en m (par défaut)
  let planet_radius = R;
  if (
    typeof window !== "undefined" &&
    window.currentEpochName &&
    typeof window.getGeologicalPeriodByName === "function"
  ) {
    const currentEpoch = window.getGeologicalPeriodByName(
      window.currentEpochName,
    );
    if (currentEpoch && currentEpoch.planet_radius) {
      planet_radius = currentEpoch.planet_radius;
    }
  }
  const SURFACE_AREA = 4 * Math.PI * Math.pow(planet_radius, 2); // ~5.1×10^14 m²

  // 🔒 FORMULE TOUJOURS UTILISÉE : surface_flux_emitted = σT₀⁴ (pas de cas particulier)
  // En corps noir, l'équilibre radiatif sera garanti par la convergence, pas besoin de forcer
  // 🔒 PATCH ESTHÉTIQUE : Si la différence en W totaux est < tolérance de convergence, utiliser la même valeur
  // C'est justifié scientifiquement : la tolérance représente la précision des calculs
  // Tolérance de 0.1×10^17 W (équivalent à ~0.1 W/m² × surface Terre)
  // Calculer la différence en W totaux
  const w_sol = surface_flux_emitted * SURFACE_AREA;
  const w_espace = flux_ejected * SURFACE_AREA;
  const diff_w = Math.abs(w_sol - w_espace);
  const tolerance_w = 0.1 * 1e17; // 0.1×10^17 W

  if (diff_w <= tolerance_w) {
    // Différence en W totaux < tolérance : utiliser la même valeur pour les deux (confort esthétique justifié)
    // Cela garantit un EDS nul cohérent avec la précision des calculs
    flux_ejected = surface_flux_emitted;
  }

  // Séparer les W/m² et les watts totaux
  updateLabel("surface_flux_emitted_wm", surface_flux_emitted);
  const w_sol_total = surface_flux_emitted * SURFACE_AREA;
  updateLabel("surface_flux_emitted_watts", w_sol_total);
  // Calculer et mettre à jour solar_flux_absorbed_watts (total en watts)
  // flux_passed est défini plus haut (ligne 3045) comme solar_flux_absorbed
  const w_absorbed_total = solar_flux_absorbed * SURFACE_AREA;
  updateLabel("solar_flux_absorbed_watts", w_absorbed_total);
  // Garder flux_ejected_wm (non utilisé mais conservé)
  updateLabel("flux_ejected_wm", flux_ejected);
  // Calculer et mettre à jour flux_ejected_watts (total en watts)
  const w_ejected_total = flux_ejected * SURFACE_AREA;
  updateLabel("flux_ejected_watts", w_ejected_total);

  // Calculer l'EDS (Effet de Serre) : forcing_total = (surface_flux_emitted_watts - flux_ejected_watts) / surfTerre
  const eds_wm = (w_sol_total - w_ejected_total) / SURFACE_AREA;
  // Utiliser eds_wm pour forcing_total
  forcing_total = eds_wm;
  let corePowerText = "";
  if (geothermie_value === 0 || coreTemp_K === 0) {
    // Pas de noyau actif
    corePowerText = "0 W";
  } else {
    // Calculer la puissance totale : Flux (W/m²) * Surface (m²)
    // Surface = 4 * PI * R²
    let radius = 6371000; // Défaut Terre
    if (
      typeof window !== "undefined" &&
      window.currentEpochName &&
      typeof window.getGeologicalPeriodByName === "function"
    ) {
      const currentEpoch = window.getGeologicalPeriodByName(
        window.currentEpochName,
      );
      if (currentEpoch && currentEpoch.planet_radius) {
        radius = currentEpoch.planet_radius;
      }
    }
    const surface = 4 * Math.PI * Math.pow(radius, 2);
    const totalPower = geothermie_value * surface;

    // Formatage scientifique : X.XX x 10^Y W
    if (totalPower <= 0) {
      corePowerText = "0 W";
    } else {
      const exponent = Math.floor(Math.log10(totalPower));
      const mantissa = totalPower / Math.pow(10, exponent);
      corePowerText = `${mantissa.toFixed(2)}×10<sup><b>${exponent}</b></sup> W`;
    }
  }

  // Mettre à jour le label (ou le cacher si vide)
  const coreTempLabel = document.querySelector('[data-id="core_temperature"]');
  if (coreTempLabel) {
    if (corePowerText) {
      coreTempLabel.innerHTML = corePowerText;
      coreTempLabel.style.display = "";
      // Appliquer les couleurs
      updateLabelClasses(coreTempLabel);
    } else {
      coreTempLabel.style.display = "none";
    }
  }

  // Mettre à jour le style du noyau basé sur la température (saturation/brightness)
  // coreTemp_K a déjà été récupéré depuis la config de l'époque plus haut

  // Calculer saturation et brightness basés sur la température
  // Température 0K = saturation 0%, brightness 30% (gris foncé)
  // Température 6000K = saturation 100%, brightness 100% (rouge vif)
  const maxTemp = 6000;
  const saturation = Math.min(100, Math.max(0, (coreTemp_K / maxTemp) * 100));
  const brightness = Math.min(
    100,
    Math.max(30, 30 + (coreTemp_K / maxTemp) * 70),
  );

  const noyauLabels = document.querySelectorAll(
    '#cell-noyau .flux-label[data-id="core_flux_wm"]',
  );
  noyauLabels.forEach((label) => {
    if (coreTemp_K === 0 || geothermie_value === 0) {
      label.classList.add("zero-value");
    } else {
      label.classList.remove("zero-value");
    }
  });

  // Afficher les radiations du noyau (cas particulier supprimé)
  const noyauRadiationGroup = document.querySelector(
    '.flux-radiation-group[data-node="noyau"]',
  );
  if (noyauRadiationGroup) {
    noyauRadiationGroup.style.display = "";
  }

  // Ajuster l'opacité et la visibilité du logo du noyau selon la température
  const noyauCell = document.querySelector("#cell-noyau");
  if (noyauCell) {
    const noyauLogo = noyauCell.querySelector(".flux-circle-bg span");
    if (noyauLogo) {
      const noyauNode = organigramNodes.find((n) => n.id === "noyau");
      // Si le logo est vide, le rendre invisible
      // 🔒 CORRECTION : Vérifier que logo est une string avant d'appeler trim (peut être un tableau)
      const isLogoEmpty =
        !noyauNode ||
        !noyauNode.logo ||
        (Array.isArray(noyauNode.logo) && noyauNode.logo.length === 0) ||
        (typeof noyauNode.logo === "string" && noyauNode.logo.trim() === "");
      if (isLogoEmpty) {
        noyauLogo.style.opacity = "0";
        noyauLogo.style.visibility = "hidden";
      } else {
        // Opacité proportionnelle à la température
        const opacity = Math.min(1, Math.max(0.3, coreTemp_K / maxTemp));
        noyauLogo.style.opacity = opacity.toString();
        noyauLogo.style.visibility = "visible";
      }
    }

    // Ajuster la couleur du cercle du noyau selon la température (saturation/brightness)
    const noyauCircle = noyauCell.querySelector(".flux-circle-bg");
    if (noyauCircle) {
      const noyauNode = organigramNodes.find((n) => n.id === "noyau");
      if (noyauNode) {
        // Vérifier si le noyau doit être invisible (strokeSize: 0 ou strokeColor transparent)
        const isTransparent =
          !noyauNode.strokeColor ||
          noyauNode.strokeColor.trim() === "" ||
          noyauNode.strokeSize === 0 ||
          (noyauNode.strokeColor.includes("rgba") &&
            noyauNode.strokeColor.includes(", 0)"));

        if (isTransparent) {
          // Rendre le cercle complètement invisible
          noyauCircle.style.border = "none";
          noyauCircle.style.display = "none";
        } else {
          // Récupérer la couleur de base du noyau
          const baseColor = noyauNode.strokeColor;
          // Appliquer saturation et brightness via filter CSS
          noyauCircle.style.filter = `saturate(${saturation}%) brightness(${brightness}%)`;
          noyauCircle.style.borderColor = baseColor;
          noyauCircle.style.display = "";
        }
      }
    }
  }

  // Ajuster la flèche noyau → surface selon la température
  const noyauArrow = document.querySelector(
    '[data-from="noyau"][data-to="terre"]',
  );
  if (noyauArrow) {
    noyauArrow.style.backgroundColor = ""; // Réinitialiser
    noyauArrow.style.filter = `saturate(${saturation}%) brightness(${brightness}%)`;
    const arrowLabels = noyauArrow.querySelectorAll(".flux-label");
    arrowLabels.forEach((label) => label.classList.remove("zero-value"));
  }

  // Surface -> Albedo : flux émis par la surface (σT₀⁴, CONST.STEFAN_BOLTZMANN)
  const flux_emission_surface = window.CONST.STEFAN_BOLTZMANN * Math.pow(T0_num, 4);

  // Mettre à jour l'épaisseur de l'atmosphère dans le label de l'arc Terre->Albedo
  // Utiliser calculateAtmosphereProperties pour obtenir la vraie hauteur physique
  let atm_height_km = 0;
  if (!hasNoAtmosphere && T0_num > 0) {
    // Récupérer la masse atmosphérique et la gravité de l'époque
    let total_mass = 0;
    let gravity = 9.81;
    let molar_mass_air = undefined;

    if (window.currentEpochName) {
      const currentEpoch = window.getGeologicalPeriodByName(
        window.currentEpochName,
      );
      if (currentEpoch) {
        if (currentEpoch.total_atmosphere_mass_kg !== undefined)
          total_mass = currentEpoch.total_atmosphere_mass_kg;
        if (currentEpoch.gravity !== undefined) gravity = currentEpoch.gravity;
        if (currentEpoch.molar_mass_air !== undefined) {
          molar_mass_air = currentEpoch.molar_mass_air;
        } else {
          // Calculer depuis les composants de l'époque
          molar_mass_air = window.calculateMolarMassAir(currentEpoch);
        }
      }
    }

    // Estimation de la masse molaire moyenne (M) si toujours undefined
    if (molar_mass_air === undefined || molar_mass_air === 0) {
      const isMassive = total_mass > 2.5e19;
      molar_mass_air = isMassive ? 0.044 : 0.029;
    }

    // On passe T0_num (Température surface), molar_mass_air et gravity pour un calcul physique de H
    // Vérifier que T0_num est valide (> 0) avant l'appel
    if (T0_num > 0 && molar_mass_air > 0) {
      const props = window.calculateAtmosphereProperties(
        total_mass,
        T0_num,
        molar_mass_air,
        gravity,
      );
      atm_height_km = props.z_max / 1000; // Conversion m -> km
    }
  }

  // Mettre à jour le label via updateLabel avec le dataId (évite les doublons)
  // txtF est maintenant un objet avec dataId: 'atm_height_km' dans la config
  updateLabel("atm_height_km", `${atm_height_km.toFixed(0)} km`, "text");

  // Mettre à jour l'axe altitude du plot UNIQUEMENT à la fin (ProcessFinished).
  // Pendant la convergence (cycleCalcul), ne pas toucher pour éviter que la barre bouge.
  if (
    eventId === "ProcessFinished" &&
    typeof window.updatePlotAltitudeAxis === "function"
  ) {
    window.updatePlotAltitudeAxis(atm_height_km);
  }

  // Réémis : EDS total (W/m²)
  updateLabel("forcing_total", forcing_total);

  // Boutons
  // CO2 - formatValueFromTemplate gère automatiquement la conversion > 10000 ppm en %
  // Passer directement la valeur en ppm, le template sera adapté automatiquement
  updateLabel("co2_percent", co2_ppm_num);
  updateLabel("co2_forcing_wm", forcing_CO2);

  // Ne plus forcer automatiquement le bouton CO2 en off/gris
  // L'utilisateur contrôle l'état du bouton manuellement

  // CH4 - formatValueFromTemplate gère automatiquement la conversion > 10000 ppm en %
  // Passer directement la valeur en ppm, le template sera adapté automatiquement
  updateLabel("ch4_percent", ch4_ppm_num);
  // Utiliser directement forcing_CH4 qui est déjà calculé avec les bonnes conditions
  updateLabel("ch4_forcing_wm", forcing_CH4);

  // Ne plus forcer automatiquement le bouton CH4 en off/gris
  // L'utilisateur contrôle l'état du bouton manuellement

  // H2O : afficher le pourcentage TOTAL d'eau (base + météorites)
  // Séparé de la couverture nuageuse (qui affecte l'albedo)
  let h2o_display_value = 0;
  if (h2o_total_percent > 0) {
    h2o_display_value = h2o_total_percent;
  } else if (
    window.DATA &&
    window.DATA["💧"] &&
    window.DATA["💧"]["🍰🫧💧"] != null
  ) {
    h2o_display_value = Math.min(100, window.DATA["💧"]["🍰🫧💧"] * 100);
  }

  // 🔒 CORRECTION : Utiliser isH2O_eds (seule référence)
  // Le bouton est actif = on fait les calculs avec la valeur (même si 0%)
  // Passer un nombre pour que formatValueFromTemplate gère le formatage automatiquement
  const h2o_percent = h2o_enabled && isH2O_eds ? h2o_display_value : 0;
  // Le forçage H2O doit être 0 si h2o_enabled est false (pas d'eau dans l'atmosphère)
  // OU si isH2O_eds est false (bouton désactivé)
  // Utiliser directement forcing_H2O qui est déjà calculé avec les bonnes conditions
  const forcing_H2O_final =
    h2o_enabled && isH2O_eds ? Number(forcing_H2O) || 0 : 0;
  updateLabel("h2o_percent", h2o_percent);
  updateLabel("h2o_forcing_wm", forcing_H2O_final);

  // Albédo
  const albedo_percent_value = albedo_num * 100;
  updateLabel("albedo_percent", albedo_percent_value);
  updateLabel("albedo_forcing", forcing_Albedo);
  updateLabel("albedo_percent", albedo_percent_value);

  // passing_albedo_percent : pourcentage qui passe (1 - albedo_percent)
  // Sur la flèche geometrie -> albedo
  // En corps noir : albedo_num = 0, donc passing = 100%
  // Avec albedo : passing = (1 - albedo_num) * 100
  const passing_albedo_percent = (1 - albedo_num) * 100;
  // S'assurer que le résultat est correct (0% si albedo = 1, 100% si albedo = 0)
  updateLabel("passing_albedo_percent", passing_albedo_percent);

  // Afficher le barycentre fine-tuning CLOUD_SW sous le bouton 🪩 (source: window.DATA['🎚️'].baryByGroup)
  const cloudBaryRaw = Number(window.DATA['🎚️'].baryByGroup.CLOUD_SW);
  const cloudBary = Number.isFinite(cloudBaryRaw) ? Math.max(0, Math.min(100, cloudBaryRaw)) : 0;
  updateLabel("fine_tuning_cloud_bary", cloudBary);

  // Ne plus forcer automatiquement le bouton albedo en off/gris
  // L'utilisateur contrôle l'état du bouton manuellement, même si la valeur est à 0%
};

// Fonction pour mettre à jour des champs spécifiques par leurs data-id
// Prend un tableau d'IDs ou un objet { id: value }
// Si le tableau est vide, met à jour tous les champs trouvés
window.updateFields = function (fieldIdsOrValues, values = null) {
  // Si values est fourni, fieldIdsOrValues est un tableau d'IDs
  // Sinon, fieldIdsOrValues est un objet { id: value }
  let fieldsToUpdate = {};

  if (values !== null && Array.isArray(fieldIdsOrValues)) {
    // Mode 1 : tableau d'IDs + objet de valeurs
    if (typeof values === "object" && values !== null) {
      fieldIdsOrValues.forEach((id) => {
        if (values.hasOwnProperty(id)) {
          fieldsToUpdate[id] = values[id];
        }
      });
    }
  } else if (
    typeof fieldIdsOrValues === "object" &&
    fieldIdsOrValues !== null &&
    !Array.isArray(fieldIdsOrValues)
  ) {
    // Mode 2 : objet { id: value }
    fieldsToUpdate = fieldIdsOrValues;
  } else if (Array.isArray(fieldIdsOrValues) && fieldIdsOrValues.length === 0) {
    // Mode 3 : tableau vide = mettre à jour tous les champs
    // Trouver tous les éléments avec data-id
    const allFields = document.querySelectorAll("[data-id]");
    allFields.forEach((field) => {
      const dataId = field.getAttribute("data-id");
      if (dataId) {
        // Essayer de retrouver la valeur depuis les variables globales ou window
        // Les noms des data-id correspondent aux noms des variables dans updateFluxLabels
        let value = null;

        // Chercher dans window avec le nom exact
        if (typeof window !== "undefined" && window[dataId] !== undefined) {
          value = window[dataId];
        }

        // Si pas trouvé, essayer avec des variantes courantes
        if (value === null || value === undefined) {
          // Mapper les data-id aux noms de variables possibles
          const varMap = {
            solar_flux_average_wm: () =>
              window.CONST.SOLAR_CONSTANT / 4,
            solar_flux_absorbed_wm: () =>
              window.plotData
                ? window.calculateSolarFluxAbsorbed(
                    window.plotData.temp_surface,
                    window.waterVaporEnabled,
                    window.DATA['🌕']['🧲🌕'],
                  )
                : null,
            core_flux_wm: () => window.DATA['🌕']['🧲🌕'],
            forcing_total: () =>
              window.plotData ? window.plotData.forcing_total : null,
            co2_percent: () =>
              window.plotData ? window.plotData.co2_ppm : null,
            ch4_percent: () =>
              window.plotData ? window.plotData.ch4_ppm : null,
            h2o_percent: () => window.h2oVaporPercent || null,
            albedo_percent: () =>
              window.plotData ? window.plotData.albedo * 100 : null,
          };

          if (varMap[dataId]) {
            value = varMap[dataId]();
          }
        }

        if (value !== null && value !== undefined) {
          fieldsToUpdate[dataId] = value;
        }
      }
    });
  } else if (Array.isArray(fieldIdsOrValues)) {
    // Mode 4 : tableau d'IDs sans valeurs = utiliser les valeurs depuis window/plotData
    fieldIdsOrValues.forEach((id) => {
      let value = null;
      if (typeof window !== "undefined") {
        // Chercher directement dans window
        if (window[id] !== undefined) {
          value = window[id];
        }
        // Chercher dans plotData
        else if (window.plotData && window.plotData[id] !== undefined) {
          value = window.plotData[id];
        }
      }
      if (value !== null && value !== undefined) {
        fieldsToUpdate[id] = value;
      }
    });
  }

  // Mettre à jour chaque champ trouvé
  Object.keys(fieldsToUpdate).forEach((dataId) => {
    const value = fieldsToUpdate[dataId];
    // Utiliser updateLabel si disponible, sinon mettre à jour directement
    if (typeof window.updateLabel === "function") {
      window.updateLabel(dataId, value);
    } else {
      // Fallback : mise à jour directe
      const labels = document.querySelectorAll(`[data-id="${dataId}"]`);
      labels.forEach((label) => {
        label.textContent = String(value);
      });
    }
  });

  return Object.keys(fieldsToUpdate).length; // Retourner le nombre de champs mis à jour
};

// Exposer les fonctions globalement (updateFluxLabels déjà assigné à window ligne 3207)
if (typeof window !== "undefined") {
  // Initialiser les variables globales UNIQUES selon l'état initial des cellules (boutons du flux)
  // Les boutons du flux sont des cellules, pas des boutons HTML
  const cellCO2_init = document.getElementById("cell-co2");
  const cellCH4_init = document.getElementById("cell-methane");
  const cellH2O_init = document.getElementById("cell-h2o");
  const cellAlbedo_init = document.getElementById("cell-albedo-btn");

  if (typeof window !== "undefined") {
    // Les boutons sont activés par défaut (checked à la création)
    // 🔒 Initialiser les variables globales UNIQUES (seule référence)
    window.isCO2_eds = cellCO2_init
      ? cellCO2_init.classList.contains("checked")
      : true;
    window.isCH4_eds = cellCH4_init
      ? cellCH4_init.classList.contains("checked")
      : true;
    window.isH2O_eds = cellH2O_init
      ? cellH2O_init.classList.contains("checked")
      : true;
    window.isAlbedo = cellAlbedo_init
      ? cellAlbedo_init.classList.contains("checked")
      : true;

    // Garder aussi les variables legacy pour compatibilité temporaire
    window.useCO2 = window.isCO2_eds;
    window.useCH4 = window.isCH4_eds;
    window.useH2O = window.isH2O_eds;
    window.useAlbedo = window.isAlbedo;

    // Initialiser les classes selected/unselected sur les cellules
    const buttonMap = [
      { cellId: "cell-co2", varName: "useCO2" },
      { cellId: "cell-methane", varName: "useCH4" },
      { cellId: "cell-h2o", varName: "useH2O" },
      { cellId: "cell-albedo-btn", varName: "useAlbedo" },
    ];

    // Mettre à jour les tooltips des boutons selon leur état initial
    buttonMap.forEach(({ cellId }) => {
      const cell = document.getElementById(cellId);
      if (cell) {
        const circleBg = cell.querySelector(".flux-circle-bg");
        if (circleBg) {
          updateButtonTooltip(cell, circleBg);
        }
      }
    });

    buttonMap.forEach(({ cellId, varName }) => {
      const cell = document.getElementById(cellId);
      if (cell) {
        const isChecked = cell.classList.contains("checked");
        if (isChecked) {
          cell.classList.add("selected");
          cell.classList.remove("unselected");
          window[varName] = true;
        } else {
          cell.classList.remove("selected");
          cell.classList.add("unselected");
          window[varName] = false;
        }
      }
    });
  }
  window.generateTimelineFromConfig = generateTimelineFromConfig;

  // Générer la timeline depuis la config au chargement
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", generateTimelineFromConfig);
  } else {
    // DOM déjà chargé, appeler directement
    generateTimelineFromConfig();
  }
}

// Fonction pour recréer les radiations du noyau selon l'époque courante
function recreateNoyauRadiation() {
  const noyauNode = organigramNodes.find((n) => n.id === "noyau");
  if (!noyauNode || !Array.isArray(noyauNode.radiation)) return;

  // Trouver la configuration de l'époque courante
  const currentEpochName =
    (typeof window !== "undefined" && window.currentEpochName) || "Corps Noir";
  let epochRadiation = noyauNode.radiation.find(
    (r) => r.epochName === currentEpochName,
  );

  // Si l'époque n'est pas trouvée, utiliser la dernière du tableau (permet d'alléger les répétitions)
  if (!epochRadiation && noyauNode.radiation.length > 0) {
    epochRadiation = noyauNode.radiation[noyauNode.radiation.length - 1];
  }

  if (!epochRadiation) return;

  normalizeRadiationOptionAliases(epochRadiation);
  const effMaxNoyau =
    epochRadiation.maxRadius !== undefined &&
    epochRadiation.maxRadius !== null
      ? epochRadiation.maxRadius
      : epochRadiation.radius;

  // Supprimer l'ancien groupe de radiations
  const oldRadiationGroup = document.querySelector(
    '.flux-radiation-group[data-node="noyau"]',
  );
  if (oldRadiationGroup) {
    oldRadiationGroup.remove();
  }

  // Si numCircles = 0, ne pas créer de radiations
  if (epochRadiation.numCircles === 0 || effMaxNoyau === 0) {
    return;
  }

  // Créer le nouveau groupe de radiations
  const radiationContainer = document.querySelector(
    ".flux-radiation-container",
  );
  if (!radiationContainer) return;

  const radiationGroup = document.createElement("div");
  radiationGroup.className = "flux-radiation-group";
  radiationGroup.style.color = epochRadiation.color || "#ff9800";
  radiationGroup.setAttribute("data-node", "noyau");

  radiationContainer.appendChild(radiationGroup);

  const radParams = resolveRadiationArcParams(epochRadiation, {
    openingAngle: 0,
    rotation: 0,
  });
  const {
    numCircles,
    maxRadius,
    openingInit,
    openingFinal,
    angleAnimMs,
    rotation,
    color,
    strokeSize,
  } = radParams;
  const noyauRadius = noyauNode.radius || 30;

  for (let i = 1; i <= numCircles; i++) {
    const progress = i / numCircles;
    const arcRadius = noyauRadius + (maxRadius - noyauRadius) * progress;
    const arc = createArc(
      noyauNode.x,
      noyauNode.y,
      arcRadius,
      0.3 + progress * 0.2,
      openingInit,
      rotation,
      radiationGroup,
    );
    arc.style.border = `${strokeSize}px dashed ${color}`;
    if (openingInit !== openingFinal) {
      if (angleAnimMs > 0) {
        runRadiationOpeningAnimation(
          arc,
          arcRadius,
          openingInit,
          openingFinal,
          rotation,
          angleAnimMs,
        );
      } else {
        setArcClipPath(arc, arcRadius, openingFinal, rotation);
      }
    }
  }
}

// Fonction pour recréer les radiations de la terre
function recreateTerreRadiation() {
  const terreNode = organigramNodes.find((n) => n.id === "terre");
  if (!terreNode || !terreNode.radiation) return;

  // Supprimer l'ancien groupe de radiations de la terre
  const oldRadiationGroup = document.querySelector(
    '.flux-radiation-group[data-node="terre"]',
  );
  if (oldRadiationGroup) {
    oldRadiationGroup.remove();
  }

  // Récupérer les options de radiation (peut être un objet simple ou un tableau)
  let radiationOptions = terreNode.radiation;

  // Si c'est un tableau (par époque), trouver la bonne configuration
  if (Array.isArray(radiationOptions)) {
    const currentEpochName =
      (typeof window !== "undefined" && window.currentEpochName) ||
      "Corps Noir";
    let epochRadiation = radiationOptions.find(
      (r) => r.epochName === currentEpochName,
    );
    if (!epochRadiation && radiationOptions.length > 0) {
      epochRadiation = radiationOptions[radiationOptions.length - 1];
    }
    if (epochRadiation) {
      radiationOptions = epochRadiation;
    } else {
      return; // Pas de radiation pour cette époque
    }
  }

  const radParams = resolveRadiationArcParams(radiationOptions, {
    openingAngle: 270,
    rotation: 270,
  });
  const {
    numCircles,
    maxRadius,
    openingInit,
    openingFinal,
    angleAnimMs,
    rotation,
    color,
    strokeSize,
  } = radParams;

  if (!maxRadius || maxRadius <= 0) return;

  // Créer le nouveau groupe de radiations
  const radiationContainer = document.querySelector(
    ".flux-radiation-container",
  );
  if (!radiationContainer) return;

  const radiationGroup = document.createElement("div");
  radiationGroup.className = "flux-radiation-group";
  radiationGroup.style.color = color;
  radiationGroup.setAttribute("data-node", "terre");

  radiationContainer.appendChild(radiationGroup);

  // Utiliser getNodeProperty pour récupérer le radius (gère le cas spécial 'terre' avec epoch)
  const terreRadius = getNodeProperty(terreNode, "radius", 50);
  const terreX = terreNode.x;
  const terreY = terreNode.y;

  for (let i = 1; i <= numCircles; i++) {
    const progress = i / numCircles;
    const arcRadius = terreRadius + (maxRadius - terreRadius) * progress;
    const arc = createArc(
      terreX,
      terreY,
      arcRadius,
      0.3 + progress * 0.2,
      openingInit,
      rotation,
      radiationGroup,
    );
    arc.style.border = `${strokeSize}px dashed ${color}`;
    if (openingInit !== openingFinal) {
      if (angleAnimMs > 0) {
        runRadiationOpeningAnimation(
          arc,
          arcRadius,
          openingInit,
          openingFinal,
          rotation,
          angleAnimMs,
        );
      } else {
        setArcClipPath(arc, arcRadius, openingFinal, rotation);
      }
    }
  }
}

// Fonction pour initialiser les event listeners sur les boutons du flux
function initFluxButtonListeners() {
  // Mapping des cellules vers leurs variables globales
  // Les boutons sont des cellules du diagramme, pas des boutons HTML
  const buttonMap = [
    { cellId: "cell-co2", varName: "useCO2", nodeId: "co2" },
    { cellId: "cell-methane", varName: "useCH4", nodeId: "methane" },
    { cellId: "cell-h2o", varName: "useH2O", nodeId: "h2o" },
    { cellId: "cell-albedo-btn", varName: "useAlbedo", nodeId: "albedo-btn" },
  ];

  buttonMap.forEach(({ cellId, varName, nodeId }) => {
    const cell = document.getElementById(cellId);
    const circleBg = cell ? cell.querySelector(".flux-circle-bg") : null;

    if (cell && circleBg) {
      // Initialiser l'état selected/unselected selon l'état checked
      const isChecked = cell.classList.contains("checked");
      if (isChecked) {
        cell.classList.add("selected");
        cell.classList.remove("unselected");
      } else {
        cell.classList.remove("selected");
        cell.classList.add("unselected");
      }

      // Initialiser les variables globales UNIQUES
      if (typeof window !== "undefined") {
        // Mapping vers les variables uniques
        let edsVarName = null;
        if (cellId === "cell-co2") edsVarName = "isCO2_eds";
        else if (cellId === "cell-methane") edsVarName = "isCH4_eds";
        else if (cellId === "cell-h2o") edsVarName = "isH2O_eds";
        else if (cellId === "cell-albedo-btn") edsVarName = "isAlbedo";

        if (edsVarName) {
          window[edsVarName] = isChecked;
        }
        // Garder aussi la variable legacy pour compatibilité temporaire
        window[varName] = isChecked;
      }
    }
  });
}

// Objet global des fonctions organigramme (appels directs, pas de typeof guard)
window.FUNCS_ORGANIGRAMME = {
  createCell: createCell,
  recreateNoyauRadiation: recreateNoyauRadiation,
  recreateTerreRadiation: recreateTerreRadiation,
  generateArrows: generateArrows,
  initFluxButtonListeners: initFluxButtonListeners
};
// Rétrocompat (références directes window.xxx)
window.createCell = createCell;
window.recreateNoyauRadiation = recreateNoyauRadiation;
window.recreateTerreRadiation = recreateTerreRadiation;
window.generateArrows = generateArrows;
window.initFluxButtonListeners = initFluxButtonListeners;
