// File: organigramme.js - Génération automatique du diagramme de flux énergétique
// Desc: Module JavaScript pour créer automatiquement un diagramme de flux énergétique à partir d'un graphe (nœuds et arcs)
// Version 1.0.2
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: extraction du code de génération du diagramme depuis demo_flux_energetique_01.html
//   - Added custom tooltip system with 0.5s delay
//   - Added selected/unselected state management for flux buttons and label colors

// Variables globales pour l'état des boutons (sélectionnés par défaut)
if (typeof window !== 'undefined') {
    window.useCO2 = true;
    window.useCH4 = true;
    window.useH2O = true;
    window.useAlbedo = true;
}

// Fonction pour ajouter un tooltip personnalisé avec délai de 0.5s
// 🔒 Utiliser le système centralisé de tooltips (tooltips.js)
function addCustomTooltip(element, text) {
    // Déléguer à la fonction centralisée
    if (typeof window !== 'undefined' && typeof window.addTooltip === 'function') {
        window.addTooltip(element, text);
    } else {
        // Fallback si tooltips.js n'est pas encore chargé
        console.warn('[organigramme.js] tooltips.js non chargé, tooltip non affiché');
    }
}

// Fonction pour mettre à jour le tooltip d'un bouton selon son état
function updateButtonTooltip(cell, circleBg) {
    if (!cell || !circleBg) return;
    
    const cellId = cell.id;
    let nodeId = null;
    let baseName = null;
    
    // Déterminer le nodeId et le nom de base
    if (cellId === 'cell-co2') {
        nodeId = 'co2';
        baseName = 'CO2';
    } else if (cellId === 'cell-methane') {
        nodeId = 'methane';
        baseName = 'CH4';
    } else if (cellId === 'cell-h2o') {
        nodeId = 'h2o';
        baseName = 'H2O';
    } else if (cellId === 'cell-albedo-btn') {
        nodeId = 'albedo-btn';
        baseName = 'Albedo';
    }
    
    if (!nodeId || !baseName) return;
    
    // Déterminer l'état actuel
    const isChecked = cell.classList.contains('checked');
    const stateText = isChecked ? 'on' : 'off';
    // Format: "on/off<br>CO2" (saut de ligne HTML pour séparer l'état du nom)
    const tooltipText = `${stateText}/${isChecked ? 'off' : 'on'}<br>${baseName}`;
    
    // Mettre à jour le tooltip via l'attribut alt ou data-tooltip
    if (circleBg.hasAttribute('alt')) {
        circleBg.setAttribute('alt', tooltipText);
    } else if (circleBg.hasAttribute('data-tooltip')) {
        circleBg.setAttribute('data-tooltip', tooltipText);
    } else {
        // Ajouter l'attribut alt pour que tooltips.js le détecte
        circleBg.setAttribute('alt', tooltipText);
    }
    
    // Si tooltips.js est chargé, forcer la mise à jour
    if (typeof window !== 'undefined' && typeof window.addTooltip === 'function') {
        // Retirer l'ancien tooltip et en ajouter un nouveau
        const existingTooltip = circleBg.querySelector('.flux-custom-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        window.addTooltip(circleBg, tooltipText);
    }
}

// Fonction pour créer un rectangle avec des facteurs
function createRectangle(cell, width, height, factors, fillColor, strokeColor, fillImage = null, strokeSize = 4) {
    // Le rectangle est positionné dans la zone centrale de la grille (comme le cercle)
    // Centre de la colonne centrale = 130px, centre de la ligne centrale = variable selon hauteur
    const rect = document.createElement('div');
    rect.className = 'flux-rectangle';
    rect.style.width = width + 'px';
    rect.style.height = height + 'px';
    // Positionner dans la zone centrale de la grille (col 1, row 1)
    // Le rectangle doit frôler "Equilibre" en bas, donc le placer plus bas dans la zone centrale
    rect.style.left = '130px'; // Centre de la colonne centrale
    // Positionner le rectangle pour que son bas frôle "Equilibre" (txt1 en bas de la grille)
    // La zone centrale fait 200px, on place le rectangle pour qu'il descende jusqu'en bas
    rect.style.top = 'calc(25px + 200px - ' + (height / 2) + 'px)'; // Positionné pour frôler le bas
    rect.style.transform = 'translate(-50%, -50%)';

    // Gérer fillImage (logo remplissant l'espace) ou fillColor
    if (fillImage) {
        // Utiliser un logo qui remplit l'espace directement dans le div
        rect.style.backgroundColor = fillColor || 'transparent';
        rect.style.position = 'relative';
        rect.style.overflow = 'hidden';

        // Créer un élément pour le logo qui remplit tout l'espace
        const logoBg = document.createElement('div');
        logoBg.style.position = 'absolute';
        logoBg.style.top = '0';
        logoBg.style.left = '0';
        logoBg.style.width = '100%';
        logoBg.style.height = '100%';
        logoBg.style.display = 'flex';
        logoBg.style.alignItems = 'center';
        logoBg.style.justifyContent = 'center';
        logoBg.style.zIndex = Z_NODE_INTERNAL.LOGO;
        // Utiliser la plus grande dimension pour calculer une taille qui remplit vraiment l'espace
        const maxDimension = Math.max(width, height);
        const fontSize = maxDimension * 1.5; // Assez grand pour remplir tout l'espace
        logoBg.style.fontSize = fontSize + 'px';
        logoBg.style.lineHeight = '1';
        logoBg.textContent = fillImage;
        // Appliquer les polices emoji standard aux logos
        logoBg.style.fontFamily = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
        rect.appendChild(logoBg);
    } else {
        // Couleur unie
        rect.style.backgroundColor = fillColor;
    }

    // Ne pas mettre de bordure si strokeColor est vide
    if (strokeColor && strokeColor.trim() !== '') {
        rect.style.borderColor = strokeColor;
        rect.style.borderWidth = strokeSize + 'px';
        rect.style.borderStyle = 'solid';
    } else {
        rect.style.border = 'none';
    }
    rect.style.position = 'absolute';
    rect.style.zIndex = Z_LAYERS.NODE; // Même z-index que le cercle

    // Les facteurs sont créés par integrateEds.js qui remplace le contenu du rectangle
    // Code mort supprimé - les facteurs viennent de .synthese_EdS dans index.html

    cell.appendChild(rect);
    return rect;
}

// Fonction helper pour extraire le texte d'un label (string ou objet { text, dataId })
function getLabelText(label) {
    if (!label) return '';
    if (typeof label === 'string') return label;
    if (typeof label === 'object' && label.text) return label.text;
    return String(label);
}

// Fonction helper pour obtenir le dataId d'un label (si c'est un objet)
function getLabelDataId(label) {
    if (!label || typeof label !== 'object') return null;
    return label.dataId || null;
}

// Fonction helper pour déterminer si une étiquette doit être grise
// (valeur à 0 ou bouton inactif)
function shouldLabelBeGray(text, nodeId, cell = null) {
    if (!text) return false;
    // Extraire le texte si c'est un objet
    const textStr = getLabelText(text);

    // Cas spécial : label albedo (contient "Albédo:" et des emojis ⛅ et ❄️)
    if (textStr.includes('Albédo:') && (textStr.includes('⛅') || textStr.includes('❄️'))) {
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
        const albedoButton = document.getElementById('albedo-btn');
        if (albedoButton && !albedoButton.classList.contains('checked')) {
            return true;
        }

        // Vérifier aussi la cellule créée
        const albedoCell = createdCells['albedo-btn'];
        if (albedoCell && !albedoCell.classList.contains('checked')) {
            return true;
        }
    }

    // Vérifier si le texte contient une unité connue (W/m², %, ppm, W, K)
    // Note: " W" avec espace pour éviter de matcher des mots contenant W
    const hasUnit = textStr.includes('W/m²') || textStr.includes('W/m2') || 
                   textStr.includes('%') || textStr.includes('ppm') || 
                   textStr.includes(' W') || textStr.includes(' K');

    if (!hasUnit) return false;

    // Extraire la valeur numérique (peut être "0", "0.00", "0.0", etc.)
    // Supprimer les balises HTML et extraire les nombres
    const textWithoutHTML = textStr.replace(/<[^>]*>/g, '').trim();
    // Chercher un nombre (peut être négatif, avec décimales)
    // Pattern amélioré pour capturer "0.00", "0.0", "0", etc.
    const numberMatch = textWithoutHTML.match(/(-?\d+\.?\d*)/);
    if (numberMatch) {
        const value = parseFloat(numberMatch[1]);
        // Si la valeur est 0 (ou très proche de 0), mettre en gris
        if (Math.abs(value) < 0.001) {
            return true;
        }
    }

    // Vérifier si c'est un bouton inactif
    if (nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (node && node.type === 'button') {
            // Vérifier si la cellule a la classe 'checked' (bouton actif)
            if (cell) {
                if (!cell.classList.contains('checked')) {
                    return true; // Bouton inactif
                }
            } else {
                // Si pas de cellule, chercher la cellule créée ou le bouton HTML
                const createdCell = createdCells[nodeId];
                if (createdCell) {
                    if (!createdCell.classList.contains('checked')) {
                        return true; // Bouton inactif
                    }
                } else {
                    // Vérifier le bouton HTML original
                    const originalButton = document.getElementById(nodeId);
                    if (originalButton && !originalButton.classList.contains('checked')) {
                        return true; // Bouton inactif
                    }
                }
            }
        }
    }

    return false;
}

// Fonction pour mettre à jour les classes CSS d'un label après modification dynamique
function updateLabelClasses(label, nodeId = null) {
    if (!label) return;

    const text = label.innerHTML || label.textContent || '';

    // Retirer les classes existantes
    label.classList.remove('watt-per-m2', 'watt-or-kelvin', 'zero-value', 'percent-label', 'ppm-label');

    // Vérifier si la valeur doit être grise (0 ou négligeable)
    if (shouldLabelBeGray(text)) {
        label.classList.add('zero-value');
        return; // Priorité au gris
    }

    // Sinon, si le texte contient W/m² ou W/m2, appliquer la classe orange
    // PRIORITÉ : Vérifier d'abord W/m²
    if (text && (text.includes('W/m²') || text.includes('W/m2'))) {
        // Toujours appliquer la couleur orange pour W/m² (plus de gris automatique)
        label.classList.add('watt-per-m2');
    }
    // Si le texte contient " W" ou " K" (avec espace avant), appliquer la classe rouge
    else if (text && (text.includes(' W') || text.includes(' K'))) {
        label.classList.add('watt-or-kelvin');
    }
    // Les couleurs seront appliquées dynamiquement par updateFluxLabels selon l'état des boutons
}

// Fonction pour créer une cellule avec un tableau 3x3
function createCell(x, y, radius, fillColor, strokeColor, logo, left = [], right = [], top = [], bottom = [], tooltip = null, radiationOptions = null, rectangleOptions = null, fillImage = null, nodeId = null, zIndex = null, logoScale = 1.4, logoOffsetY = 0, strokeSize = 4, targetContainer = null) {
    // Utiliser le container fourni ou le flux-diagram par défaut
    const container = targetContainer || document.getElementById('flux-diagram');

    // Cellule principale avec grille 3x3
    // Le cercle est en arrière-plan, la grille par-dessus pour que les textes se superposent
    const cell = document.createElement('div');
    // Utiliser flux-cellRect si rectangle présent pour avoir une hauteur plus grande
    cell.className = rectangleOptions ? 'flux-cellRect' : 'flux-cell';

    // Permettre aux étiquettes de déborder sans impacter le centrage du logo
    cell.style.overflow = 'visible';

    // Ajouter un ID si fourni
    if (nodeId) {
        cell.id = 'cell-' + nodeId;
    }

    // Z-index géré par CSS via les sélecteurs #cell-{nodeId}
    // Les z-index inline sont désactivés pour éviter les conflits avec le CSS
    cell.style.zIndex = zIndex !== null ? zIndex : Z_LAYERS.NODE;

    // Adapter la grille à la taille du cercle OU du logo (le plus grand)
    // Le cercle est toujours créé (même invisible) pour que les étiquettes s'éloignent correctement
    const hasCircle = true; // Toujours créer le cercle
    const hasVisibleBorder = strokeColor && strokeColor.trim() !== '';
    // Calcul initial pour les dimensions par défaut
    const circleDiameterInit = hasCircle ? (radius * 2) : 0;
    let centralCellSize = hasCircle ? circleDiameterInit : (radius * logoScale);
    let totalHeight = 25 + centralCellSize + 20;
    let totalWidth = 100 + centralCellSize + 100;

    // Vérifier s'il y a des labels AVANT de construire la grille
    const hasLabels = (left && left.length > 0) || (right && right.length > 0) ||
        (top && top.length > 0) || (bottom && bottom.length > 0);

    if (!rectangleOptions) {
        // Case centrale = max(diamètre du cercle, taille du logo) - s'adapte à la vraie taille
        const circleDiameter = hasCircle ? (radius * 2) : 0;
        // Si cercle visible : logoScale est relatif au diamètre, sinon relatif au radius
        const logoSize = hasCircle ? (circleDiameter * logoScale) : (radius * logoScale);
        centralCellSize = Math.max(circleDiameter, logoSize); // Pas de minimum, s'adapte à la vraie taille

        // Adapter la grille en hauteur ET en largeur au contenu central
        // Si pas de labels, utiliser une grille symétrique pour centrer parfaitement le logo
        if (hasLabels) {
            cell.style.gridTemplateRows = `25px ${centralCellSize}px 20px`;
            totalHeight = 25 + centralCellSize + 20;
        } else {
            // Grille symétrique : moyenne de 25 et 20 = 22.5px pour top et bottom
            cell.style.gridTemplateRows = `22.5px ${centralCellSize}px 22.5px`;
            totalHeight = 22.5 + centralCellSize + 22.5;
        }
        cell.style.gridTemplateColumns = `100px ${centralCellSize}px 100px`; // Colonne centrale = taille du logo/cercle

        // Ajuster les dimensions de la cellule
        totalWidth = 100 + centralCellSize + 100;
        cell.style.height = totalHeight + 'px';
        cell.style.width = totalWidth + 'px';

    }

    // Positionner le coin supérieur gauche de la grille, puis utiliser transform pour centrer précisément
    // Compensation pour la structure asymétrique de la grille (25px top vs 20px bottom)
    // Le décalage vertical est : (25 - 20) / 2 = 2.5px
    // Mais seulement si des labels sont présents (sinon grille symétrique, pas besoin de compensation)
    const verticalOffset = hasLabels ? 2.5 : 0; // Décalage pour compenser l'asymétrie de la grille seulement si labels présents

    // Position du centre de la cellule sans offset : y + totalHeight/2
    const cellCenterY = y;
    // Position du centre du logo dans la cellule : dépend de la structure de la grille
    const topRowHeight = hasLabels ? 25 : 22.5;
    const logoCenterInCell = topRowHeight + centralCellSize / 2;
    // Écart entre centre cellule et centre logo : logoCenterInCell - totalHeight/2
    const naturalOffset = logoCenterInCell - totalHeight / 2;


    // Le verticalOffset compense l'asymétrie de la grille (top 25px vs bottom 20px)
    // logoOffsetY sera appliqué séparément au logo lui-même (ligne 200)
    const totalVerticalOffset = verticalOffset;

    cell.style.left = x + 'px';
    cell.style.top = y + 'px';
    // Si pas de labels, centrer exactement sans décalage vertical
    if (hasLabels) {
        cell.style.transform = `translate(-50%, calc(-50% - ${totalVerticalOffset}px))`; // Centre le LOGO (pas la cellule) sur (x, y)
    } else {
        cell.style.transform = 'translate(-50%, -50%)'; // Centre exactement sur (x, y) sans décalage
    }

    // Cercle en arrière-plan (derrière le tableau)
    // Le centre de la case centrale [1,1] doit être au centre de la grille dynamique
    // Avec transform: translate(-50%, -50%) sur la grille, ce centre sera à (x, y)
    const circleBg = document.createElement('div');
    circleBg.className = 'flux-circle-bg';
    const circleSize = radius * 2;
    circleBg.style.width = circleSize + 'px';
    circleBg.style.height = circleSize + 'px';
    // Z-index du cercle géré par CSS via les sélecteurs #cell-{nodeId} .flux-circle-bg
    // Pour albedo, le cercle doit être au-dessus des radiations (z-index 9)
    // Les z-index inline sont désactivés pour éviter les conflits avec le CSS
    circleBg.style.zIndex = Z_NODE_INTERNAL.CIRCLE;
    // Positionner le cercle au centre de la grille
    // Centre horizontal : 100px (col gauche) + (centralCellSize / 2)
    // Centre vertical : dépend de la structure de la grille (topRowHeight + centralCellSize / 2)
    const centerX = 100 + (centralCellSize / 2); // Centre exact de la colonne centrale
    const centerY = topRowHeight + (centralCellSize / 2); // Centre exact de la case centrale (topRowHeight déjà déclaré plus haut)
    circleBg.style.left = centerX + 'px'; // Centre de la colonne centrale (dynamique)
    circleBg.style.top = centerY + 'px'; // Centre de la ligne centrale (CERCLE sans offset)
    circleBg.style.transform = 'translate(-50%, -50%)'; // Centre le cercle sur (centerX, centerY)
    // Ne pas créer le cercle si un rectangle est présent
    if (!rectangleOptions) {
        // Ajouter une classe spéciale pour les nœuds espace (effet de trou)
        if (nodeId && (nodeId === 'espace1' || nodeId === 'espace2')) {
            circleBg.classList.add('flux-space-hole');
        }
        circleBg.style.backgroundColor = fillColor;
        // Toujours créer le cercle, mais rendre la bordure invisible si strokeColor est vide ou transparent
        // Le cercle est nécessaire pour que les étiquettes s'éloignent correctement du logo
        if (!strokeColor || strokeColor.trim() === '') {
            circleBg.style.border = 'none';
        } else {
            // Vérifier si la couleur est transparente (alpha = 0)
            const isTransparent = strokeColor.includes('rgba') && strokeColor.includes(', 0)') ||
                strokeColor.includes('rgba') && strokeColor.includes(', 0 )');
            if (isTransparent) {
                // Bordure transparente mais présente pour l'espacement
                circleBg.style.borderColor = strokeColor;
                circleBg.style.borderWidth = strokeSize + 'px';
                circleBg.style.borderStyle = 'solid';
            } else {
                circleBg.style.borderColor = strokeColor;
                circleBg.style.borderWidth = strokeSize + 'px';
                circleBg.style.borderStyle = 'solid';
            }
        }
        // Wrapper le logo dans un span pour appliquer l'offset sans bouger le cercle
        const logoSpan = document.createElement('span');
        logoSpan.style.display = 'flex';
        logoSpan.style.alignItems = 'center';
        logoSpan.style.justifyContent = 'center';
        logoSpan.style.width = '100%';
        logoSpan.style.height = '100%';
        logoSpan.style.zIndex = Z_NODE_INTERNAL.LOGO;

        // Vérifier si c'est une image (PNG, SVG) ou un emoji
        const isImage = logo && (logo.endsWith('.svg') || logo.endsWith('.png'));

        // Si le logo est un fichier image (SVG, PNG, etc.)
        if (isImage) {
            const img = document.createElement('img');
            img.src = logo;
            img.alt = nodeId || 'logo';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.objectPosition = 'center';
            img.style.display = 'block';
            logoSpan.appendChild(img);
        } else {
            // Sinon c'est un emoji/texte
            logoSpan.textContent = logo;
            // Appliquer les polices emoji standard aux logos
            logoSpan.style.fontFamily = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
        }

        // Appliquer logoOffsetY uniquement aux emojis (pas aux images PNG/SVG)
        // Le patch pour descendre les emojis ne doit pas s'appliquer aux images
        if (logoOffsetY !== 0 && !isImage) {
            const scaledLogoOffsetY = logoOffsetY * logoScale;
            logoSpan.style.transform = `translateY(${scaledLogoOffsetY}px)`;
        }
        circleBg.appendChild(logoSpan);
        // Taille du logo : si cercle visible, relatif au diamètre; sinon relatif au radius
        const logoFontSize = hasCircle ? (radius * 2 * logoScale) : (radius * logoScale);
        circleBg.style.fontSize = logoFontSize + 'px';

        // Gestionnaire de clic pour copier le logo ou déclencher le bouton
        circleBg.addEventListener('click', (e) => {
            e.stopPropagation();

            // Vérifier si c'est un bouton (cellule parente a la classe flux-button-cell)
            const parentCell = circleBg.closest('.flux-button-cell');
            if (parentCell) {
                // C'est un bouton : toggle la classe checked directement sur la cellule
                const isChecked = parentCell.classList.contains('checked');
                if (isChecked) {
                    parentCell.classList.remove('checked');
                } else {
                    parentCell.classList.add('checked');
                }

                // Mettre à jour les variables globales et les couleurs
                const cellId = parentCell.id;
                let varName = null;
                if (cellId === 'cell-co2') varName = 'useCO2';
                else if (cellId === 'cell-methane') varName = 'useCH4';
                else if (cellId === 'cell-h2o') varName = 'useH2O';
                else if (cellId === 'cell-albedo-btn') varName = 'useAlbedo';

                if (varName && typeof window !== 'undefined') {
                    window[varName] = !isChecked;
                }

                // Mettre à jour la classe selected
                if (!isChecked) {
                    parentCell.classList.add('selected');
                    parentCell.classList.remove('unselected');
                } else {
                    parentCell.classList.remove('selected');
                    parentCell.classList.add('unselected');
                }

                // Mettre à jour les couleurs des étiquettes
                if (typeof window.updateFluxLabels === 'function') {
                    window.updateFluxLabels(window.plotData || {});
                }
                
                // Mettre à jour le tooltip du bouton
                updateButtonTooltip(parentCell, circleBg);
            } else {
                // Ce n'est pas un bouton : copier le logo (comportement original)
                navigator.clipboard.writeText(logo).then(() => {
                    // Feedback visuel temporaire (agrandissement)
                    // Animation supprimée pour éviter setTimeout - utiliser CSS transition si nécessaire
                    // const originalTransform = circleBg.style.transform;
                    // circleBg.style.transform = 'translate(-50%, -50%) scale(1.5)';
                    // setTimeout(() => {
                    //     circleBg.style.transform = originalTransform;
                    // }, 200);
                }).catch(err => {
                });
            }
        });

        // Ajouter tooltip personnalisé sur le cercle/logo si présent (au lieu de la cellule entière)
        if (tooltip) {
            // Pour les boutons, afficher "on/off" + nom selon l'état
            let tooltipText = tooltip;
            if (nodeId && (nodeId === 'co2' || nodeId === 'methane' || nodeId === 'h2o' || nodeId === 'albedo-btn')) {
                // Déterminer l'état initial du bouton
                const isChecked = cell.classList.contains('checked');
                const stateText = isChecked ? 'on' : 'off';
                // Mapper les noms pour l'affichage
                let displayName = tooltip;
                if (nodeId === 'co2') displayName = 'CO2';
                else if (nodeId === 'methane') displayName = 'CH4';
                else if (nodeId === 'h2o') displayName = 'H2O';
                else if (nodeId === 'albedo-btn') displayName = 'Albedo';
                // Format: "on/off<br>CO2" (saut de ligne HTML)
                tooltipText = `${stateText}/${isChecked ? 'off' : 'on'}<br>${displayName}`;
            }
            addCustomTooltip(circleBg, tooltipText);
            
            // Pour les boutons, mettre à jour le tooltip quand l'état change
            if (nodeId && (nodeId === 'co2' || nodeId === 'methane' || nodeId === 'h2o' || nodeId === 'albedo-btn')) {
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
            const gridItem = document.createElement('div');
            gridItem.className = 'flux-grid-item';
            // Ajouter la classe selon la colonne pour justify-content
            if (col === 0) {
                gridItem.className += ' flux-grid-item-left'; // justify-content: flex-end
            } else if (col === 1) {
                gridItem.className += ' flux-grid-item-center'; // justify-content: center
            } else if (col === 2) {
                gridItem.className += ' flux-grid-item-right'; // justify-content: flex-start
            }
            gridItem.style.gridColumn = col + 1;
            gridItem.style.gridRow = row + 1;
            gridItem.style.position = 'relative';
            gridItem.style.zIndex = Z_NODE_INTERNAL.LABEL; // Étiquettes TOUJOURS au-dessus de tout (flèches max ~26)

            // [1,1] = Vide (le logo est dans le cercle en arrière-plan)
            // Les autres cases contiennent les étiquettes
            // [1,0] = Top (haut)
            if (col === 1 && row === 0 && top && top.length > 0) {
                const labelContainer = document.createElement('div');
                // Si 2 éléments, aligner en bas pour entourer le trait du cercle, sinon centrer
                labelContainer.className = 'flux-label-container ' + (top.length === 2 ? 'flux-label-container-bottom' : 'flux-label-container-center');

                top.forEach(labelData => {
                    const text = getLabelText(labelData);
                    const dataId = getLabelDataId(labelData);
                    const label = document.createElement('div');
                    label.className = 'flux-label';
                    if (dataId) label.setAttribute('data-id', dataId);
                    // Si c'est un bouton, ajouter la classe buttonData
                    if (nodeId) {
                        const node = nodes.find(n => n.id === nodeId);
                        if (node && node.type === 'button') {
                            label.classList.add('buttonData');
                        }
                    }
                    // Sinon, si le texte contient W/m² ou W/m2, ajouter la classe watt-per-m2
                    // PRIORITÉ : Vérifier d'abord W/m² pour ne pas qu'il soit capturé comme " W"
                    if (text && (text.includes('W/m²') || text.includes('W/m2'))) {
                        // Toujours appliquer la couleur orange pour W/m² (plus de gris automatique)
                        label.classList.add('watt-per-m2');
                    }
                    // Si le texte contient " W" ou " K" (avec espace avant), ajouter la classe rouge
                    // Cela capture aussi "×10... W"
                    else if (text && (text.includes(' W') || text.includes(' K'))) {
                        label.classList.add('watt-or-kelvin');
                    }
                    // Les couleurs seront appliquées dynamiquement par updateFluxLabels selon l'état des boutons
                    label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
                    label.style.position = 'relative'; // Créer un stacking context
                    label.style.zIndex = Z_NODE_INTERNAL.LABEL + 1; // Encore plus haut que le container
                    labelContainer.appendChild(label);
                });

                gridItem.appendChild(labelContainer);
            }
            // [1,2] = Bottom (bas)
            if (col === 1 && row === 2 && bottom && bottom.length > 0) {
                const labelContainer = document.createElement('div');
                // Si 2 éléments, aligner en haut pour entourer le trait du cercle, sinon centrer
                labelContainer.className = 'flux-label-container ' + (bottom.length === 2 ? 'flux-label-container-top' : 'flux-label-container-center');

                bottom.forEach(labelData => {
                    const text = getLabelText(labelData);
                    const dataId = getLabelDataId(labelData);
                    const label = document.createElement('div');
                    label.className = 'flux-label';
                    if (dataId) label.setAttribute('data-id', dataId);
                    // Si c'est un bouton, ajouter la classe buttonData
                    if (nodeId) {
                        const node = nodes.find(n => n.id === nodeId);
                        if (node && node.type === 'button') {
                            label.classList.add('buttonData');
                        }
                    }
                    // Sinon, si le texte contient W/m² ou W/m2, ajouter la classe watt-per-m2
                    // PRIORITÉ : Vérifier d'abord W/m² pour ne pas qu'il soit capturé comme " W"
                    if (text && (text.includes('W/m²') || text.includes('W/m2'))) {
                        // Toujours appliquer la couleur orange pour W/m² (plus de gris automatique)
                        label.classList.add('watt-per-m2');
                    }
                    // Si le texte contient " W" ou " K" (avec espace avant), ajouter la classe rouge
                    // Cela capture aussi "×10... W"
                    else if (text && (text.includes(' W') || text.includes(' K'))) {
                        label.classList.add('watt-or-kelvin');
                    }
                    // Les couleurs seront appliquées dynamiquement par updateFluxLabels selon l'état des boutons
                    label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
                    label.style.position = 'relative'; // Créer un stacking context
                    label.style.zIndex = Z_NODE_INTERNAL.LABEL + 1; // Encore plus haut que le container
                    labelContainer.appendChild(label);
                });

                gridItem.appendChild(labelContainer);
            }
            // [0,1] = Left (gauche)
            if (col === 0 && row === 1 && left && left.length > 0) {
                const labelContainer = document.createElement('div');
                labelContainer.style.display = 'flex';
                labelContainer.style.flexDirection = 'column';
                labelContainer.style.gap = '4px';
                labelContainer.style.alignItems = 'flex-end'; // À gauche (col === 0)
                labelContainer.style.justifyContent = 'center'; // Centrer verticalement dans la ligne centrale
                labelContainer.style.position = 'relative'; // Créer un stacking context
                labelContainer.style.zIndex = Z_NODE_INTERNAL.LABEL; // TOUJOURS au-dessus des flèches

                left.forEach(labelData => {
                    const text = getLabelText(labelData);
                    const dataId = getLabelDataId(labelData);
                    const label = document.createElement('div');
                    label.className = 'flux-label';
                    if (dataId) label.setAttribute('data-id', dataId);
                    // Si c'est un bouton, ajouter la classe buttonData
                    if (nodeId) {
                        const node = nodes.find(n => n.id === nodeId);
                        if (node && node.type === 'button') {
                            label.classList.add('buttonData');
                        }
                    }
                    // Sinon, si le texte contient W/m² ou W/m2, ajouter la classe watt-per-m2
                    // PRIORITÉ : Vérifier d'abord W/m² pour ne pas qu'il soit capturé comme " W"
                    if (text && (text.includes('W/m²') || text.includes('W/m2'))) {
                        // Toujours appliquer la couleur orange pour W/m² (plus de gris automatique)
                        label.classList.add('watt-per-m2');
                    }
                    // Si le texte contient " W" ou " K" (avec espace avant), ajouter la classe rouge
                    // Cela capture aussi "×10... W"
                    else if (text && (text.includes(' W') || text.includes(' K'))) {
                        label.classList.add('watt-or-kelvin');
                    }
                    // Les couleurs seront appliquées dynamiquement par updateFluxLabels selon l'état des boutons
                    label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
                    label.style.position = 'relative'; // Créer un stacking context
                    label.style.zIndex = Z_NODE_INTERNAL.LABEL + 1; // Encore plus haut que le container
                    labelContainer.appendChild(label);
                });

                gridItem.appendChild(labelContainer);
            }
            // [2,1] = Right (droite)
            if (col === 2 && row === 1 && right && right.length > 0) {
                const labelContainer = document.createElement('div');
                labelContainer.style.display = 'flex';
                labelContainer.style.flexDirection = 'column';
                labelContainer.style.alignItems = 'flex-start'; // À droite (col === 2)
                labelContainer.style.justifyContent = 'center'; // Centrer verticalement dans la ligne centrale
                labelContainer.style.position = 'relative'; // Créer un stacking context
                labelContainer.style.zIndex = Z_NODE_INTERNAL.LABEL; // TOUJOURS au-dessus des flèches

                right.forEach(labelData => {
                    const text = getLabelText(labelData);
                    const dataId = getLabelDataId(labelData);
                    const label = document.createElement('div');
                    label.className = 'flux-label';
                    if (dataId) label.setAttribute('data-id', dataId);

                    // Patch spécifique pour albedo_percents : margin-top pour aligner en haut du logo
                    if (dataId === 'albedo_percents') {
                        label.style.marginTop = '115px';
                    }
                    // Si c'est un bouton, ajouter la classe buttonData
                    if (nodeId) {
                        const node = nodes.find(n => n.id === nodeId);
                        if (node && node.type === 'button') {
                            label.classList.add('buttonData');
                        }
                    }
                    // Sinon, si le texte contient W/m² ou W/m2, ajouter la classe watt-per-m2
                    // PRIORITÉ : Vérifier d'abord W/m² pour ne pas qu'il soit capturé comme " W"
                    if (text && (text.includes('W/m²') || text.includes('W/m2'))) {
                        // Toujours appliquer la couleur orange pour W/m² (plus de gris automatique)
                        label.classList.add('watt-per-m2');
                    }
                    // Si le texte contient " W" ou " K" (avec espace avant), ajouter la classe rouge
                    // Cela capture aussi "×10... W"
                    else if (text && (text.includes(' W') || text.includes(' K'))) {
                        label.classList.add('watt-or-kelvin');
                    }
                    // Les couleurs seront appliquées dynamiquement par updateFluxLabels selon l'état des boutons
                    label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
                    label.style.position = 'relative'; // Créer un stacking context
                    label.style.zIndex = Z_NODE_INTERNAL.LABEL + 1; // Encore plus haut que le container

                    // Si le texte contient <br>, permettre les retours à la ligne et éviter la coupure
                    if (text && text.includes('<br>')) {
                        label.style.whiteSpace = 'normal';
                        label.style.overflow = 'visible';
                        label.style.maxWidth = 'none';
                        label.style.width = 'max-content';
                    }

                    labelContainer.appendChild(label);
                });

                gridItem.appendChild(labelContainer);
            }
            // Les 4 coins sont vides (pas de contenu)

            cell.appendChild(gridItem);
        }
    }

    // Les radiations seront créées après toutes les cellules (étape 8)
    // Pas de création de radiations ici

    // Ajouter la cellule au container
    container.appendChild(cell);

    // Créer le rectangle avec les facteurs si demandé
    if (rectangleOptions) {
        const { width, height, factors } = rectangleOptions;
        // Utiliser fillImage depuis le nœud racine (passé en paramètre)
        createRectangle(cell, width, height, factors, fillColor, strokeColor, fillImage, strokeSize);
    }

    return cell;
}

// Fonction pour créer une étiquette de flèche avec des divs
// x1, y1 : début de la flèche (partie visible)
// x2, y2 : fin de la flèche (partie visible)
function createArrowLabel(x1, y1, x2, y2, labels) {
    const container = document.getElementById('flux-diagram');

    let labelObj = {};
    if (Array.isArray(labels)) {
        labelObj = {
            name: labels[0] || '',
            txtD: labels[1] || null,
            txtF: labels[2] || null,
            txt3: labels[3] || null,
            txt4: labels[4] || null
        };
    } else {
        labelObj = labels;
    }

    const labelPositions = [];

    const createLabel = (labelData, posX, posY, isName = false, size = null, labelType = '') => {
        if (!labelData) return null;
        const text = getLabelText(labelData);
        const dataId = getLabelDataId(labelData);
        const label = document.createElement('div');
        label.className = 'flux-label'; // Tous les textes des flèches
        if (dataId) label.setAttribute('data-id', dataId);
        // Cas spécial : label albedo (contient "Albédo:" et des emojis)
        if (text && text.includes('Albédo:') && (text.includes('⛅') || text.includes('❄️'))) {
            if (shouldLabelBeGray(text, null, null)) {
                label.classList.add('zero-value');
            }
        }
        // Sinon, si le texte contient W/m² ou W/m2, ajouter la classe watt-per-m2 (sauf si valeur 0)
        // PRIORITÉ : Vérifier d'abord W/m²
        if (text && (text.includes('W/m²') || text.includes('W/m2'))) {
            if (shouldLabelBeGray(text, null, null)) {
                // Valeur à 0 : ajouter zero-value pour forcer le gris
                label.classList.add('zero-value');
            } else {
                label.classList.add('watt-per-m2');
            }
        }
        // Si le texte contient " W" ou " K" (avec espace avant), ajouter la classe rouge
        else if (text && (text.includes(' W') || text.includes(' K'))) {
            label.classList.add('watt-or-kelvin');
        }
        // Si le texte contient % et valeur 0, s'assurer qu'il est gris
        if (text && text.includes('%') && shouldLabelBeGray(text, null, null)) {
            label.classList.add('zero-value');
        }
        label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
        label.style.position = 'absolute';
        label.style.left = posX + 'px';
        // Décalage vertical : 0 pour tout le monde (centré sur la flèche)
        // L'utilisateur a clarifié que "au dessus" concernait le Z-index
        const labelOffset = 0;
        label.style.top = (posY - labelOffset) + 'px';
        label.style.transform = 'translate(-50%, -50%)';
        // Z-index: au-dessus des flèches
        label.style.zIndex = Z_LAYERS.ARROW_LABEL;
        // Si le texte contient <br>, permettre les retours à la ligne mais pas le wrapping automatique
        if (text.includes('<br>')) {
            label.style.whiteSpace = 'normal';
            label.style.width = 'max-content'; // Largeur selon le contenu, pas de wrapping
            label.style.maxWidth = 'none'; // Pas de limite de largeur
        }
        // Si size est 'bigger' ET que c'est le name (pas txtD), agrandir le texte 2 fois et retirer border/fond
        if (size === 'bigger' && isName) {
            // Taille de base : 16px (taille par défaut du navigateur)
            // Multiplier par 2 pour obtenir 32px
            label.style.fontSize = '32px';
            // Retirer border et fond
            label.style.background = 'transparent';
            label.style.border = 'none';
            label.style.padding = '0';
        }
        container.appendChild(label);

        // Stocker la position pour les logs
        labelPositions.push({ type: labelType, text: text, x: posX, y: posY });
        return label;
    };

    // Récupérer la taille depuis labelObj.size
    const labelSize = labelObj.size || null;

    // txtD : au début de la flèche (LABEL_POSITIONS.txtD)
    if (labelObj.txtD) {
        const pos1X = x1 + (x2 - x1) * LABEL_POSITIONS.txtD;
        const pos1Y = y1 + (y2 - y1) * LABEL_POSITIONS.txtD;
        createLabel(labelObj.txtD, pos1X, pos1Y, false, labelSize, 'txtD');
    }

    // name : au milieu de la flèche (50%)
    if (labelObj.name) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        createLabel(labelObj.name, midX, midY, true, labelSize, 'name');
    }

    // txtF : à la fin de la flèche (90% du chemin)
    if (labelObj.txtF) {
        // Positionner à LABEL_POSITIONS.txtF (juste avant le bout de la flèche)
        // Note: x2, y2 sont déjà ajustés avec la marge dans createArrow
        let percent = LABEL_POSITIONS.txtF;

        // Exception pour 'albedo_percents' (petite flèche jaune)
        // L'utilisateur signale que le milieu n'est pas sur le chapeau
        if (labelObj.txtF.dataId === 'albedo_percents') {
            percent = LABEL_POSITIONS.txtF_albedo; // Pousser encore plus loin pour celle-ci
        }

        const pos2X = x1 + (x2 - x1) * percent;
        const pos2Y = y1 + (y2 - y1) * percent;
        createLabel(labelObj.txtF, pos2X, pos2Y, false, labelSize, 'txtF');
    }

    // txt3 (à gauche) et txt4 (à droite) - relatifs au milieu
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    if (labelObj.txt3) {
        createLabel(labelObj.txt3, midX - 60, midY, false, null, 'txt3');
    }
    if (labelObj.txt4) {
        createLabel(labelObj.txt4, midX + 60, midY, false, null, 'txt4');
    }

    return labelPositions;
}

// Fonction pour créer une flèche avec des divs
function createArrow(x1, y1, x2, y2, zIndex = Z_LAYERS.ARROW, color = '#667eea') {
    const container = document.getElementById('flux-diagram');
    const arrow = document.createElement('div');
    arrow.className = 'flux-arrow';

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    arrow.style.position = 'absolute';
    arrow.style.zIndex = zIndex !== undefined ? zIndex : Z_LAYERS.ARROW; // Utiliser la constante ou la valeur passée
    arrow.style.left = x1 + 'px';
    arrow.style.top = y1 + 'px';
    arrow.style.width = length + 'px';
    arrow.style.height = '3px';
    arrow.style.transformOrigin = '0 50%';
    arrow.style.transform = `rotate(${angle}deg)`;
    arrow.style.background = color; // Couleur personnalisable

    // Pointe de flèche à la fin de la flèche (point d'arrivée)
    const arrowhead = document.createElement('div');
    arrowhead.style.position = 'absolute';
    arrowhead.style.right = '-8px';
    arrowhead.style.top = '50%';
    arrowhead.style.transform = 'translateY(-50%)';
    arrowhead.style.width = '0';
    arrowhead.style.height = '0';
    // La pointe pointe vers la droite par défaut, elle sera tournée avec la flèche
    arrowhead.style.borderLeft = `8px solid ${color}`; // Couleur personnalisable
    arrowhead.style.borderTop = '5px solid transparent';
    arrowhead.style.borderBottom = '5px solid transparent';
    arrow.appendChild(arrowhead);

    container.appendChild(arrow);
    return arrow;
}

// Fonction pour créer une sphère concentrique
function createSphere(cx, cy, r, opacity, container = null) {
    if (!container) {
        const mainContainer = document.getElementById('flux-diagram');
        container = mainContainer.querySelector('.flux-radiation-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'flux-radiation-container';
            container.style.zIndex = Z_LAYERS.RADIATION;
            mainContainer.appendChild(container);
        }
    }
    const sphere = document.createElement('div');
    sphere.className = 'flux-sphere';
    sphere.style.left = (cx - r) + 'px';
    sphere.style.top = (cy - r) + 'px';
    sphere.style.width = (r * 2) + 'px';
    sphere.style.height = (r * 2) + 'px';
    // Pas besoin de border ici, défini en CSS avec currentColor
    sphere.style.opacity = opacity;
    container.appendChild(sphere);
    return sphere;
}

// Fonction pour créer un arc de cercle (comme createSphere mais avec ouverture)
// Le paramètre container peut être un élément DOM ou undefined (cherchera le container par défaut)
function createArc(cx, cy, r, opacity, openingAngle = 0, rotation = 270, container = null) {
    if (!container) {
        const mainContainer = document.getElementById('flux-diagram');
        container = mainContainer.querySelector('.flux-radiation-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'flux-radiation-container';
            container.style.zIndex = Z_LAYERS.RADIATION;
            mainContainer.appendChild(container);
        }
    }
    const arc = document.createElement('div');
    arc.className = 'flux-sphere'; // Utilise la même classe que createSphere

    // Positionner comme createSphere
    arc.style.left = (cx - r) + 'px';
    arc.style.top = (cy - r) + 'px';
    arc.style.width = (r * 2) + 'px';
    arc.style.height = (r * 2) + 'px';
    // Pas besoin de border ici, défini en CSS avec currentColor
    arc.style.opacity = opacity;

    // Calculer le clip-path pour masquer l'ouverture
    // openingAngle est l'angle d'ouverture (ex: 270°)
    // rotation est l'angle de départ de l'ouverture (0° = droite, 90° = haut, 180° = gauche, 270° = bas)
    // Si openingAngle = 270° et rotation = 270°, alors 270° sont ouverts vers le bas, l'arc visible de 90° est en haut
    const visibleAngle = 360 - openingAngle;
    // L'arc visible commence à rotation - (visibleAngle / 2) et se termine à rotation + (visibleAngle / 2)
    // Mais on doit convertir en coordonnées mathématiques (0° = droite, sens anti-horaire)
    const startAngleMath = rotation - (visibleAngle / 2);

    // Créer un clip-path polygon pour masquer l'ouverture
    const clipPoints = [];
    const centerX = r;
    const centerY = r;

    // Point central
    clipPoints.push(`${centerX}px ${centerY}px`);

    // Points autour du cercle pour créer le masque (arc visible en bas)
    const numPoints = 32;
    for (let i = 0; i <= numPoints; i++) {
        const angle = (startAngleMath + (visibleAngle * i / numPoints)) * Math.PI / 180;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        clipPoints.push(`${x}px ${y}px`);
    }

    arc.style.clipPath = `polygon(${clipPoints.join(', ')})`;

    container.appendChild(arc);
    return arc;
}

// Les données de configuration (nodes, arcs, constantes) sont définies dans configOrganigramme.js
// Ce fichier doit être chargé avant organigramme.js

// Fonction pour calculer les positions Y automatiquement
function calculatePositions() {
    const nodeMap = {};
    nodes.forEach(node => nodeMap[node.id] = node);

    // Fonction récursive pour calculer les positions
    function calculateY(nodeId, visited = new Set()) {
        if (visited.has(nodeId)) {
            return nodeMap[nodeId].y || 50;
        }
        visited.add(nodeId);

        const node = nodeMap[nodeId];
        if (node.y !== null) return node.y;

        // Trouver tous les arcs entrants
        const incomingArcs = arcs.filter(arc => arc.to === nodeId);
        let maxY = node.y || 50;

        if (incomingArcs.length > 0) {
            incomingArcs.forEach(arc => {
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
    nodes.forEach(node => {
        if (node.y === null) {
            calculateY(node.id, new Set());
        }
    });
}

// Fonction helper pour récupérer les propriétés d'un node (gère le cas spécial 'terre' avec tableau epoch)
function getNodeProperty(node, property, defaultValue = null) {
    if (!node) return defaultValue;

    // Cas spécial pour le node 'terre' avec tableau epoch
    if (node.id === 'terre' && node.epoch && Array.isArray(node.epoch)) {
        const currentEpochName = (typeof window !== 'undefined' && window.currentEpochName) || 'Corps noir';
        const epochConfig = node.epoch.find(e => e.epochName === currentEpochName);

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
    const container = document.getElementById('flux-diagram');
    if (container) {
        const oldArrows = container.querySelectorAll('.flux-arrow');
        oldArrows.forEach(arrow => arrow.remove());
        // Supprimer aussi les étiquettes des flèches (elles sont créées avec createArrowLabel)
        const oldLabels = container.querySelectorAll('.flux-label');
        oldLabels.forEach(label => {
            // Ne supprimer que les étiquettes des flèches, pas celles des cellules
            if (!label.closest('.flux-grid-item')) {
                label.remove();
            }
        });
    }

    arcs.forEach(arc => {
        // PATCH: Calcul dynamique de la hauteur de l'atmosphère pour l'arc terre->albedo
        // Ceci écrase la valeur "0 km" de la config AVANT le dessin pour garantir l'affichage correct
        if (arc.from === 'terre' && arc.to === 'albedo' && arc.label) {
            let atm_height_km = 0;
            const isCorpsNoir = (typeof window !== 'undefined' && window.currentEpochName === 'Corps noir');
            
            if (!isCorpsNoir && typeof window.calculateAtmosphereProperties === 'function') {
                let total_mass = 5.15e18; // Terre actuelle
                if (typeof window.getGeologicalPeriodByName === 'function' && window.currentEpochName) {
                    const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
                    if (currentEpoch && currentEpoch.total_atmosphere_mass_kg) {
                        total_mass = currentEpoch.total_atmosphere_mass_kg;
                    }
                }
                
                // Récupérer T0 si disponible globalement
                const T0 = (typeof window.T0_num !== 'undefined') ? window.T0_num : 288;
                
                const isMassive = total_mass > 2.5e19;
                const M_avg = isMassive ? 0.044 : 0.029;
                
                const props = window.calculateAtmosphereProperties(total_mass, T0, M_avg);
                atm_height_km = props.z_max / 1000;
                
                // Mettre à jour directement l'objet arc pour le rendu à venir
                if (typeof arc.label === 'object') {
                    arc.label.name = `${atm_height_km.toFixed(0)} km`;
                }
            } else {
                 if (typeof arc.label === 'object') {
                    arc.label.name = '0 km';
                }
            }
        }

        const idDep = nodes.find(n => n.id === arc.from);
        const idDest = nodes.find(n => n.id === arc.to);

        if (!idDep || !idDest) return;

        // Vecteur depuis le centre du départ vers le centre de la destination
        const Vect = {
            x: idDest.x - idDep.x,
            y: idDest.y - idDep.y
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
        const angleDeg = angleRad * 180 / Math.PI;

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
                const t = (halfWidth) / Vect.x;
                const y = Vect.y * t;
                if (Math.abs(y) <= halfHeight) tValues.push({ t, side: 'right', x: idDep.x + halfWidth, y: idDep.y + y });
            }
            // Bord gauche : x = idDep.x - halfWidth
            if (Math.abs(Vect.x) > 0.001) {
                const t = (-halfWidth) / Vect.x;
                const y = Vect.y * t;
                if (Math.abs(y) <= halfHeight) tValues.push({ t, side: 'left', x: idDep.x - halfWidth, y: idDep.y + y });
            }
            // Bord haut : y = idDep.y - halfHeight
            if (Math.abs(Vect.y) > 0.001) {
                const t = (-halfHeight) / Vect.y;
                const x = Vect.x * t;
                if (Math.abs(x) <= halfWidth) tValues.push({ t, side: 'top', x: idDep.x + x, y: idDep.y - halfHeight });
            }
            // Bord bas : y = idDep.y + halfHeight
            if (Math.abs(Vect.y) > 0.001) {
                const t = (halfHeight) / Vect.y;
                const x = Vect.x * t;
                if (Math.abs(x) <= halfWidth) tValues.push({ t, side: 'bottom', x: idDep.x + x, y: idDep.y + halfHeight });
            }

            // Prendre le point avec le plus petit t positif (le plus proche dans la direction)
            const validT = tValues.filter(tv => tv.t > 0);
            if (validT.length > 0) {
                const closest = validT.reduce((min, tv) => tv.t < min.t ? tv : min);
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
            const sourceRadius = getNodeProperty(idDep, 'radius', radius);
            const sourceStrokeSize = getNodeProperty(idDep, 'strokeSize', 4);
            const depStrokeColor = getNodeProperty(idDep, 'strokeColor', '');
            // Si strokeColor est défini, utiliser strokeSize, sinon utiliser juste le radius
            const sourceRadiusOuter = (depStrokeColor && depStrokeColor.trim() !== '')
                ? sourceRadius + (sourceStrokeSize / 2)
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
        const hasTop = idDest.top && Array.isArray(idDest.top) && idDest.top.length > 0;
        const hasBottom = idDest.bottom && Array.isArray(idDest.bottom) && idDest.bottom.length > 0;

        // Calculer la demi-hauteur de la grille pour ce nœud (basée sur le CERCLE uniquement, pas le logo)
        const destRadius = getNodeProperty(idDest, 'radius', radius);
        const destStrokeSize = getNodeProperty(idDest, 'strokeSize', 4);
        const destStrokeColor = getNodeProperty(idDest, 'strokeColor', '');
        // Un nœud a un cercle si strokeColor est défini ET non vide, OU si radius est défini (même sans strokeColor visible)
        // Les nœuds espace ont un radius mais strokeColor vide, ils ont quand même un cercle (transparent)
        const destHasCircle = (destStrokeColor && destStrokeColor.trim() !== '') || (destRadius && destRadius > 0);
        // Calculer le radius extérieur : si strokeColor existe, ajouter strokeSize/2, sinon utiliser juste le radius
        const destRadiusOuter = (destStrokeColor && destStrokeColor.trim() !== '')
            ? destRadius + (destStrokeSize / 2)
            : destRadius;
        const destCircleDiameter = destHasCircle ? (destRadius * 2) : 0;
        // Pour les nœuds sans cercle, calculer la taille approximative du logo
        const destLogoScale = idDest.logoScale || 1.4;
        const destLogoRadius = destRadius * destLogoScale * 0.5; // Approximation du "rayon" du logo
        // Pour les étiquettes, utiliser uniquement la taille du cercle (le logo peut dépasser)
        // Mais utiliser la taille réelle de la grille si disponible depuis le DOM
        let destCentralCellSize = destCircleDiameter > 0 ? destCircleDiameter : 50;
        // Essayer de lire la taille réelle de la grille depuis le DOM
        const destCellElement = document.getElementById('cell-' + idDest.id);
        if (destCellElement) {
            const computedStyle = window.getComputedStyle(destCellElement);
            const gridTemplateRows = computedStyle.gridTemplateRows;
            if (gridTemplateRows && gridTemplateRows !== 'none') {
                const rows = gridTemplateRows.split(' ');
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
        const sourceRadius = getNodeProperty(idDep, 'radius', radius);
        const sourceStrokeSize = getNodeProperty(idDep, 'strokeSize', 4);
        const depStrokeColor = getNodeProperty(idDep, 'strokeColor', '');
        // Un nœud a un cercle si strokeColor est défini ET non vide, OU si radius est défini (même sans strokeColor visible)
        const sourceHasCircle = (depStrokeColor && depStrokeColor.trim() !== '') || (sourceRadius && sourceRadius > 0);
        const sourceRadiusOuter = sourceHasCircle
            ? ((depStrokeColor && depStrokeColor.trim() !== '') ? (sourceRadius + (sourceStrokeSize / 2)) : sourceRadius)
            : 0;

        // Détecter si les cercles sont concentriques (centres très proches)
        // Si concentriques : ne pas inverser le vecteur (aller dans le sens du vecteur)
        // Si normaux : inverser le vecteur (arriver au bord proche)
        const isConcentric = length < 10; // Distance entre centres < 10px = concentriques
        const sign = isConcentric ? 1 : -1; // Concentriques: pas d'inversion, Normaux: inversion

        // Pour les cercles concentriques, calculer la longueur avec abs(delta rayon)
        const deltaRadius = isConcentric ? Math.abs(destRadius - sourceRadius) : null;


        if (isGoingUp && isVerticalEnough) {
            // Flèche vers le haut (assez verticale)
            // Pour les cercles concentriques, utiliser le calcul avec deltaRadius (prioritaire)
            if (isConcentric && deltaRadius !== null && destHasCircle && !idDest.rectangle) {
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
                    y: idDest.y - y1
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
                                y2 = idDest.y + (halfWidth - Vect.x * (x1 - idDest.x) / Vect.x) * (Vect.y / Vect.x);
                            } else {
                                x2 = idDest.x - halfWidth;
                                y2 = idDest.y + (-halfWidth - Vect.x * (x1 - idDest.x) / Vect.x) * (Vect.y / Vect.x);
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
            if (isConcentric && deltaRadius !== null && destHasCircle && !idDest.rectangle) {
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
                    y: idDest.y - y1
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
                    if (Math.abs(y) <= halfHeight && t > 0) tValues.push({ t, x: idDest.x + halfWidth, y: idDest.y + y });
                }
                // Bord gauche
                if (Math.abs(Vect.x) > 0.001) {
                    const t = (-halfWidth - (x1 - idDest.x)) / Vect.x;
                    const y = y1 + Vect.y * t - idDest.y;
                    if (Math.abs(y) <= halfHeight && t > 0) tValues.push({ t, x: idDest.x - halfWidth, y: idDest.y + y });
                }
                // Bord haut
                if (Math.abs(Vect.y) > 0.001) {
                    const t = (-halfHeight - (y1 - idDest.y)) / Vect.y;
                    const x = x1 + Vect.x * t - idDest.x;
                    if (Math.abs(x) <= halfWidth && t > 0) tValues.push({ t, x: idDest.x + x, y: idDest.y - halfHeight });
                }
                // Bord bas
                if (Math.abs(Vect.y) > 0.001) {
                    const t = (halfHeight - (y1 - idDest.y)) / Vect.y;
                    const x = x1 + Vect.x * t - idDest.x;
                    if (Math.abs(x) <= halfWidth && t > 0) tValues.push({ t, x: idDest.x + x, y: idDest.y + halfHeight });
                }

                if (tValues.length > 0) {
                    const closest = tValues.reduce((min, tv) => tv.t < min.t ? tv : min);
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
        const arrowColor = arc.color || (idDep.strokeColor && idDep.strokeColor.trim() !== '' ? idDep.strokeColor : '#667eea');


        const arrow = createArrow(finalX1, finalY1, finalX2, finalY2, arrowZIndex, arrowColor);

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
            const hasTopLabel = idDep.top && Array.isArray(idDep.top) && idDep.top.length > 0;
            const hasBottomLabel = idDep.bottom && Array.isArray(idDep.bottom) && idDep.bottom.length > 0;

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
            const labelPositions = createArrowLabel(visibleX1, visibleY1, visibleX2, visibleY2, arc.label);

            // Log des coordonnées des étiquettes et comparaison avec attendu
            // console.log(`Coordonnées visibles: début (${visibleX1.toFixed(1)}, ${visibleY1.toFixed(1)}), fin (${visibleX2.toFixed(1)}, ${visibleY2.toFixed(1)})`);
            const visibleLength = Math.sqrt((visibleX2 - visibleX1) ** 2 + (visibleY2 - visibleY1) ** 2);
            const expectedMidX = (visibleX1 + visibleX2) / 2;
            const expectedMidY = (visibleY1 + visibleY2) / 2;

            labelPositions.forEach(pos => {
                let expected = '';
                if (pos.type === 'name') {
                    const actualMidX = pos.x;
                    const actualMidY = pos.y;
                    const diffX = Math.abs(actualMidX - expectedMidX);
                    const diffY = Math.abs(actualMidY - expectedMidY);
                    expected = `Attendu: milieu (${expectedMidX.toFixed(1)}, ${expectedMidY.toFixed(1)}), écart: (${diffX.toFixed(1)}, ${diffY.toFixed(1)})`;
                } else if (pos.type === 'txt1') {
                    const expectedX = visibleX1 + (visibleX2 - visibleX1) * 0.15;
                    const expectedY = visibleY1 + (visibleY2 - visibleY1) * 0.15;
                    const diffX = Math.abs(pos.x - expectedX);
                    const diffY = Math.abs(pos.y - expectedY);
                    expected = `Attendu: 15% (${expectedX.toFixed(1)}, ${expectedY.toFixed(1)}), écart: (${diffX.toFixed(1)}, ${diffY.toFixed(1)})`;
                } else if (pos.type === 'txt2') {
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

// Initialisation du diagramme
// Calculer les positions
calculatePositions();

// Ordre spécifique des cellules dans le DOM (du plus bas au plus haut)
const cellOrder = ['soleil', 'geometrie', 'albedo', 'espace1', 'terre', 'noyau', 'espace2', 'reemis'];
// effetSerre n'est plus dans l'ordre car c'est un rectangle, pas une cellule circulaire

// Créer les cellules dans l'ordre spécifié
const createdCells = {};
const mainContainer = document.getElementById('flux-diagram');

// Étape 1-7 : Créer les cellules dans l'ordre spécifié
cellOrder.forEach(nodeId => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Ignorer effetSerre car c'est un rectangle, pas une cellule circulaire
    if (nodeId === 'effetSerre') return;

    // Calculer maxRadius si nécessaire
    let radiationOptions = node.radiation;

    // Si rotation n'est pas défini, calculer l'angle depuis les flèches sortantes
    if (radiationOptions && radiationOptions.rotation === undefined) {
        // Trouver tous les arcs qui partent de ce nœud
        const outgoingArcs = arcs.filter(arc => arc.from === node.id);
        if (outgoingArcs.length > 0) {
            // Calculer les angles de toutes les flèches sortantes
            const angles = [];
            outgoingArcs.forEach(arc => {
                const destNode = nodes.find(n => n.id === arc.to);
                if (destNode) {
                    const dx = destNode.x - node.x;
                    const dy = destNode.y - node.y;
                    // Calculer l'angle en degrés (0° = droite, 90° = bas, sens anti-horaire/trigo)
                    // rotation utilise le même système : 0° = droite, 90° = haut, 180° = gauche, 270° = bas
                    const angleRad = Math.atan2(dy, dx);
                    let angleDeg = angleRad * 180 / Math.PI;
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
                    const maxGap = Math.max(...angles.map((a, i) => {
                        const next = angles[(i + 1) % angles.length];
                        const gap = (next - a + 360) % 360;
                        return gap;
                    }));

                    if (maxGap > 180) {
                        // Les angles sont répartis autour de 0/360, ajuster
                        const adjustedAngles = angles.map(a => a < 180 ? a + 360 : a);
                        const avgAngle = adjustedAngles.reduce((sum, a) => sum + a, 0) / adjustedAngles.length;
                        radiationOptions.rotation = avgAngle % 360;
                    } else {
                        // Angles normaux, moyenne simple
                        const avgAngle = angles.reduce((sum, a) => sum + a, 0) / angles.length;
                        radiationOptions.rotation = avgAngle;
                    }

                    // Si openingAngle n'est pas défini ou est très large (>= 270), ajuster pour couvrir toutes les directions
                    if (radiationOptions.openingAngle === undefined || radiationOptions.openingAngle >= 270) {
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
        if (node.id === 'geometrie') {
            const albedoNode = nodes.find(n => n.id === 'albedo');
            if (albedoNode) {
                // Calculer la vraie distance euclidienne entre les centres
                const dx = albedoNode.x - node.x;
                const dy = albedoNode.y - node.y;
                radiationOptions.maxRadius = Math.sqrt(dx * dx + dy * dy);
            }
        } else if (node.id === 'soleil') {
            // Pour le soleil, calculer jusqu'à geometrie
            const geometrieNode = nodes.find(n => n.id === 'geometrie');
            if (geometrieNode) {
                // Calculer la vraie distance euclidienne entre les centres
                const dx = geometrieNode.x - node.x;
                const dy = geometrieNode.y - node.y;
                radiationOptions.maxRadius = Math.sqrt(dx * dx + dy * dy);
            }
        } else if (node.id === 'reemis') {
            // Pour reemis, avec openingAngle 270° (vers le bas), calculer jusqu'à effetSerre
            const effetSerreNode = nodes.find(n => n.id === 'effetSerre');
            if (effetSerreNode) {
                // Calculer la vraie distance euclidienne entre les centres
                const dx = effetSerreNode.x - node.x;
                const dy = effetSerreNode.y - node.y;
                radiationOptions.maxRadius = Math.sqrt(dx * dx + dy * dy);
            }
        }
    }

    // If it's a button, set defaults only if not already defined
    if (node.type === 'button') {
        if (node.radius === undefined) {
            node.radius = 55;
        }
        if (node.fillColor === undefined) {
            node.fillColor = 'rgba(255, 0, 0, 0)';
        }
        if (node.strokeColor === undefined) {
            node.strokeColor = 'rgba(0, 0, 0, 0)'; // Transparent border by default (circle still created)
        }
        if (node.zIndex === undefined) {
            node.zIndex = Z_LAYERS.BUTTON;
        }
        if (node.logoScale === undefined) {
            node.logoScale = 0.5;
        }
    }

    // Gérer le cas spécial du node 'terre' avec tableau epoch
    let nodeConfig = node;
    if (node.id === 'terre' && node.epoch && Array.isArray(node.epoch)) {
        // Trouver la configuration de l'époque courante
        const currentEpochName = (typeof window !== 'undefined' && window.currentEpochName) || 'Corps noir';
        const epochConfig = node.epoch.find(e => e.epochName === currentEpochName);

        if (epochConfig) {
            // Créer une configuration fusionnée avec les propriétés de l'époque
            nodeConfig = {
                ...node,
                logo: epochConfig.logo,
                radius: epochConfig.radius,
                fillColor: epochConfig.fillColor,
                strokeColor: epochConfig.strokeColor,
                strokeSize: epochConfig.strokeSize
            };
        } else if (node.epoch.length > 0) {
            // Fallback : utiliser la dernière époque du tableau (permet d'alléger les répétitions)
            const lastEpoch = node.epoch[node.epoch.length - 1];
            nodeConfig = {
                ...node,
                logo: lastEpoch.logo || node.epoch[0].logo,
                radius: lastEpoch.radius || node.epoch[0].radius,
                fillColor: lastEpoch.fillColor || node.epoch[0].fillColor,
                strokeColor: lastEpoch.strokeColor || node.epoch[0].strokeColor,
                strokeSize: lastEpoch.strokeSize || node.epoch[0].strokeSize
            };
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
        Array.isArray(nodeConfig.top) ? nodeConfig.top : (nodeConfig.top && nodeConfig.top !== '' ? [nodeConfig.top] : []),
        Array.isArray(nodeConfig.bottom) ? nodeConfig.bottom : (nodeConfig.bottom && nodeConfig.bottom !== '' ? [nodeConfig.bottom] : []),
        nodeConfig.tooltip || null,
        null, // No radiations here, we'll create them later (step 8)
        nodeConfig.rectangle || null,
        nodeConfig.fillImage || null,
        nodeConfig.id, // Pass the node ID to create the cell ID
        nodeConfig.zIndex || null, // Pass the custom z-index
        nodeConfig.logoScale || 1.4, // Pass the logo scale (default 1.4)
        nodeConfig.logoOffsetY || 0, // Pass the vertical logo offset (default 0)
        nodeConfig.strokeSize || 4 // Pass the border thickness (default 4px)
    );

    createdCells[node.id] = cell;

    // If it's a button, add the CSS class
    // Le gestionnaire de clic est déjà attaché au circleBg dans createCell
    // Il détecte automatiquement si c'est un bouton via la classe flux-button-cell
    if (node.type === 'button') {
        cell.classList.add('flux-button-cell');
        // Ajouter la classe checked par défaut pour que les boutons soient sélectionnés
        cell.classList.add('checked');
        cell.style.pointerEvents = 'auto';

        // Hide the original HTML button if it exists
        const originalButton = document.getElementById(node.id);
        if (originalButton) {
            originalButton.style.display = 'none';
        }
    }
});

// Create other nodes that are not in cellOrder (including buttons)
nodes.forEach(node => {
    // Ignore those already created in cellOrder
    if (cellOrder.includes(node.id)) return;

    // Ignore effetSerre because it's a rectangle, not a circular cell
    if (node.id === 'effetSerre') return;

    // If it's a button, set defaults only if not already defined
    if (node.type === 'button') {
        if (node.radius === undefined) {
            node.radius = 55;
        }
        if (node.fillColor === undefined) {
            node.fillColor = 'rgba(255, 0, 0, 0)';
        }
        if (node.strokeColor === undefined) {
            node.strokeColor = 'rgba(0, 0, 0, 0)'; // Transparent border by default (circle still created)
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

    // If rotation is not defined, calculate the angle from outgoing arrows
    if (radiationOptions && radiationOptions.rotation === undefined) {
        const outgoingArcs = arcs.filter(arc => arc.from === node.id);
        if (outgoingArcs.length > 0) {
            const angles = [];
            outgoingArcs.forEach(arc => {
                const destNode = nodes.find(n => n.id === arc.to);
                if (destNode) {
                    const dx = destNode.x - node.x;
                    const dy = destNode.y - node.y;
                    const angleRad = Math.atan2(dy, dx);
                    let angleDeg = angleRad * 180 / Math.PI;
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
                    const maxGap = Math.max(...angles.map((a, i) => {
                        const next = angles[(i + 1) % angles.length];
                        return (next - a + 360) % 360;
                    }));

                    if (maxGap > 180) {
                        const adjustedAngles = angles.map(a => a < 180 ? a + 360 : a);
                        radiationOptions.rotation = (adjustedAngles.reduce((sum, a) => sum + a, 0) / adjustedAngles.length) % 360;
                    } else {
                        radiationOptions.rotation = angles.reduce((sum, a) => sum + a, 0) / angles.length;
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
        Array.isArray(node.top) ? node.top : (node.top && node.top !== '' ? [node.top] : []),
        Array.isArray(node.bottom) ? node.bottom : (node.bottom && node.bottom !== '' ? [node.bottom] : []),
        node.tooltip || null,
        null, // No radiations here, we'll create them later (step 8)
        node.rectangle || null,
        node.fillImage || null,
        node.id,
        node.zIndex || null,
        node.logoScale || 1.4,
        node.logoOffsetY || 0,
        node.strokeSize || 4
    );

    createdCells[node.id] = cell;

    // If it's a button, add the CSS class and click event
    if (node.type === 'button') {
        cell.classList.add('flux-button-cell');
        // Ajouter la classe checked par défaut pour que les boutons soient sélectionnés
        cell.classList.add('checked');
        cell.style.pointerEvents = 'auto';

        // Add a click handler to the cell
        cell.addEventListener('click', function () {
            const originalButton = document.getElementById(node.id);
            if (originalButton) {
                originalButton.click();
            }
        });

        // Hide the original HTML button if it exists
        const originalButton = document.getElementById(node.id);
        if (originalButton) {
            originalButton.style.display = 'none';
        }
    }
});

// Étape 8 : Créer le container des radiations et toutes les radiations
const radiationContainer = document.createElement('div');
radiationContainer.className = 'flux-radiation-container';
radiationContainer.style.zIndex = Z_LAYERS.RADIATION;
mainContainer.appendChild(radiationContainer);

// Créer toutes les radiations dans l'ordre des cellules
cellOrder.forEach(nodeId => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.radiation) return;

    // Sauter la terre : ses radiations seront créées via recreateTerreRadiation() 
    // car elle a un radius qui dépend de l'époque
    if (nodeId === 'terre') return;

    // Gérer le cas spécial du node 'noyau' avec tableau radiation par époque
    let radiationOptions = node.radiation;

    // Si le node 'noyau' a un tableau radiation (configuration par époque)
    if (nodeId === 'noyau' && Array.isArray(node.radiation)) {
        const currentEpochName = (typeof window !== 'undefined' && window.currentEpochName) || 'Corps noir';
        let epochRadiation = node.radiation.find(r => r.epochName === currentEpochName);
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
                color: '#ff9800'
            };
        }
    }

    let { numCircles = 8, maxRadius, openingAngle = 270, rotation = 270, color = '#ff9800', strokeSize = 2 } = radiationOptions;

    if (maxRadius !== null && maxRadius !== undefined && maxRadius > 0) {
        const radiationGroup = document.createElement('div');
        radiationGroup.className = 'flux-radiation-group';
        radiationGroup.style.color = color;
        radiationGroup.setAttribute('data-node', nodeId);

        radiationContainer.appendChild(radiationGroup);

        for (let i = 1; i <= numCircles; i++) {
            const progress = i / numCircles;
            const arcRadius = node.radius + (maxRadius - node.radius) * progress;
            const arc = createArc(node.x, node.y, arcRadius, 0.3 + (progress * 0.2), openingAngle, rotation, radiationGroup);
            arc.style.border = `${strokeSize}px dashed ${color}`;
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
function calculateTextPositionLeftOfCircle(nodeId = 'albedo', offsetX = 0, offsetY = 0) {
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

    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
        return { x: 0, y: 0 };
    }

    const radius = node.radius || 40;
    const strokeSize = node.strokeSize || 4;
    const radiusOuter = radius + (strokeSize / 2); // Rayon jusqu'au bord extérieur

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
function poseBoutonSurCercle(nodeId = 'surface', angleDeg = 0, offsetRadius = 0, totalRadiusOverride = null) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
        console.warn(`poseBoutonSurCercle: node ${nodeId} not found`);
        return { x: 0, y: 0 };
    }

    // Si totalRadiusOverride est fourni, l'utiliser directement (pour garantir le même rayon pour tous)
    const totalRadius = totalRadiusOverride !== null ? totalRadiusOverride : (() => {
        const radius = node.radius || 40;
        const strokeSize = node.strokeSize || 4;
        const radiusOuter = radius + (strokeSize / 2); // Rayon jusqu'au bord extérieur
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
        { id: 'btn-co2', angle: 135 },       // Haut-gauche (CO2 = le plus important)
        { id: 'btn-methane', angle: 180 },   // Gauche (milieu) (CH4 = deuxième)
        { id: 'btn-h2o', angle: 225 },       // Bas-gauche (H2O = troisième)
        // À droite (0°) : de haut en bas
        { id: 'btn-albedo', angle: 315 }     // Haut-droite
        // btn-noyau et btn-comet sont maintenant en dessous du flux
    ];

    // Décalage négatif pour positionner les boutons à l'intérieur du cercle, touchant le bord
    // Le radius du bouton est ~25px (50px/2), on veut qu'il soit 5px plus à l'intérieur
    const offsetRadius = -30; // Négatif = à l'intérieur du cercle (5px de plus que -25)
    const fluxDiagram = document.getElementById('flux-diagram');

    if (!fluxDiagram) {
        return;
    }

    boutons.forEach(({ id, angle }) => {
        const bouton = document.getElementById(id);
        if (!bouton) {
            return;
        }

        // Calculer la position sur le cercle
        const pos = poseBoutonSurCercle('albedo', angle, offsetRadius);

        // Positionner le bouton en absolu par rapport au flux-diagram
        bouton.style.position = 'absolute';
        bouton.style.left = `${pos.x}px`;
        bouton.style.top = `${pos.y}px`;
        bouton.style.transform = 'translate(-50%, -50%)'; // Centrer le bouton sur la position
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
    if (typeof timeline === 'undefined' || !Array.isArray(timeline)) {
        console.warn('Timeline config not found, using default HTML');
        return;
    }

    // Utiliser le nouveau conteneur vertical, avec fallback sur l'ancien
    const epochsContainer = document.querySelector('.epochs-container-vertical') || document.querySelector('.epochs-container');
    if (!epochsContainer) {
        console.warn('Timeline container not found');
        return;
    }

    // Vider le conteneur
    epochsContainer.innerHTML = '';

    // Générer les éléments depuis la config
    timeline.forEach(item => {
        if (item.type === 'epoch') {
            // Créer un bouton d'époque
            const button = document.createElement('button');
            button.className = 'epoch-btn';
            button.setAttribute('data-epoch', item.name);
            button.setAttribute('onclick', `setEpoch('${item.name.replace(/'/g, "\\'")}')`);
            // Ne pas utiliser title natif, utiliser addCustomTooltip à la place

            // Si le logo est un fichier image (SVG, PNG, etc.)
            if (item.logo && (item.logo.endsWith('.svg') || item.logo.endsWith('.png'))) {
                const img = document.createElement('img');
                img.src = item.logo;
                img.alt = item.name;
                img.style.width = '24px';
                img.style.height = '24px';
                img.style.objectFit = 'contain';
                img.style.display = 'block';
                img.style.margin = '0 auto';
                img.style.pointerEvents = 'none'; // Pour que le clic passe au bouton
                button.appendChild(img);
            } else {
                // Sinon c'est un emoji/texte
                button.textContent = item.logo;
                // Appliquer les polices emoji standard aux logos
                button.style.fontFamily = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
            }

            epochsContainer.appendChild(button);

            // Ajouter le tooltip personnalisé avec délai de 0.5s
            if (item.title && item.title.trim() !== '') {
                addCustomTooltip(button, item.title);
            }
        } else if (item.type === 'separator') {
            // Afficher la date entre les logos (sans le "|")
            const dateItem = document.createElement('div');
            dateItem.className = 'epoch-date-item';
            
            const date = document.createElement('span');
            date.className = 'epoch-date';
            date.textContent = item.date;
            
            dateItem.appendChild(date);
            epochsContainer.appendChild(dateItem);
        }
    });
}

// Fonction pour mettre à jour les labels du flux avec les valeurs calculées
// Appelée pendant le déroulement de l'algorithme (dichotomie)
window.updateFluxLabels = function (data) {
    if (!data) return;

    // Déléguer la mise à jour des flux d'entrée (Soleil, Noyau) au FluxManager
    if (window.FluxManager && window.currentEpochName) {
        window.FluxManager.updateAllFluxes(window.currentEpochName);
    }

    // Récupérer les valeurs calculées (avec vérifications pour null/undefined)
    const T0 = (data.T0 !== null && data.T0 !== undefined) ? data.T0 : (data.temp_surface !== null && data.temp_surface !== undefined ? data.temp_surface : 0);
    const total_flux = (data.total_flux !== null && data.total_flux !== undefined) ? data.total_flux : 0;
    let albedo = (data.albedo !== null && data.albedo !== undefined) ? data.albedo : 0;
    // Récupérer les valeurs depuis plotData (valeurs d'époque) si disponibles, sinon depuis data
    const cloud_coverage = (data.cloud_coverage !== null && data.cloud_coverage !== undefined) ? data.cloud_coverage : 0;
    // Utiliser plotData pour les valeurs d'époque (CO2, CH4, H2O)
    const plotData_co2 = (typeof window !== 'undefined' && window.plotData && window.plotData.co2_ppm !== undefined) ? window.plotData.co2_ppm : 0;
    const plotData_ch4 = (typeof window !== 'undefined' && window.plotData && window.plotData.ch4_ppm !== undefined) ? window.plotData.ch4_ppm : 0;
    const co2_ppm = (data.co2_ppm !== null && data.co2_ppm !== undefined) ? data.co2_ppm : plotData_co2;
    const ch4_ppm = (data.ch4_ppm !== null && data.ch4_ppm !== undefined) ? data.ch4_ppm : plotData_ch4;
    // H2O : vérifier l'état du bouton (on/off)
    const h2o_enabled = typeof window !== 'undefined' && window.waterVaporEnabled;
    // Vérifier l'état de tous les boutons (on/off) via les cellules du flux (pas les boutons HTML)
    // Les boutons du flux sont des cellules avec la classe 'flux-button-cell'
    const cellCO2 = document.getElementById('cell-co2');
    const cellCH4 = document.getElementById('cell-methane');
    const cellH2O = document.getElementById('cell-h2o');
    const cellAlbedo = document.getElementById('cell-albedo-btn');

    // Vérifier l'état via les cellules ET les variables globales (fallback)
    const co2_button_checked = (cellCO2 && cellCO2.classList.contains('checked')) ||
        (typeof window !== 'undefined' && window.useCO2 === true);
    const ch4_button_checked = (cellCH4 && cellCH4.classList.contains('checked')) ||
        (typeof window !== 'undefined' && window.useCH4 === true);
    const h2o_button_checked = (cellH2O && cellH2O.classList.contains('checked')) ||
        (typeof window !== 'undefined' && window.useH2O === true);
    const albedo_button_checked = (cellAlbedo && cellAlbedo.classList.contains('checked')) ||
        (typeof window !== 'undefined' && window.useAlbedo === true);

    const h2o_final_enabled = h2o_enabled && h2o_button_checked;

    // S'assurer que toutes les valeurs numériques sont bien des nombres
    const T0_num = Number(T0) || 0;
    const total_flux_num = Number(total_flux) || 0;
    let albedo_num = Number(albedo) || 0;
    let cloud_coverage_num = Number(cloud_coverage) || 0;
    const co2_ppm_num = Number(co2_ppm) || 0;
    const ch4_ppm_num = Number(ch4_ppm) || 0;

    // Récupérer les constantes mises à jour par FluxManager pour les calculs locaux si besoin
    const SOLAR_CONSTANT = window.SOLAR_CONSTANT || 1361;
    const GEOTHERMIE_FLUX = window.GEOTHERMAL_FLUX || 0.087;

    // Pour les calculs de moyenne (si utilisés plus bas)
    const SOLAR_FLUX_AVERAGE = SOLAR_CONSTANT / 4;

    // Détecter le mode "Corps noir" : utiliser le nom de l'époque stocké globalement
    // En mode Corps noir, on désactive tous les éléments atmosphériques
    // Utiliser une comparaison insensible à la casse et aux espaces
    const currentName = (typeof window !== 'undefined' && window.currentEpochName) ? window.currentEpochName.trim() : '';
    const isCorpsNoir = currentName === 'Corps noir' || currentName === 'Corps Noir';
    
    // Debug de détection
    // console.log(`[updateFluxLabels] isCorpsNoir=${isCorpsNoir} (currentName="${currentName}")`);

    // En mode "corps noir", utiliser data.albedo s'il est défini (peut avoir de la glace des météorites)
    // Sinon, forcer l'albedo à 0 (pas d'atmosphère, pas d'eau, pas de glace)
    if (isCorpsNoir) {
        // 🔒 CORRECTION : Utiliser data.albedo s'il est défini (peut avoir de la glace des météorites)
        if (albedo !== null && albedo !== undefined && albedo > 0) {
            albedo_num = albedo;
            console.log(`[updateFluxLabels] Mode corps noir avec glace: albedo_num=${albedo_num.toFixed(3)} (data.albedo=${albedo})`);
        } else {
            albedo_num = 0; // Corps noir sans glace : pas d'albedo
            console.log(`[updateFluxLabels] Mode corps noir sans glace: albedo_num=0`);
        }
        // Forcer aussi cloud_coverage à 0 en mode corps noir
        cloud_coverage_num = 0;
    }

    // Calculer les valeurs dynamiques
    // Utiliser data.albedo qui vient de la simulation (calculé avec tous les paramètres corrects)
    // Seulement recalculer si data.albedo n'est pas défini ou si on est en mode corps noir
    console.log(`[updateFluxLabels] Albedo initial: data.albedo=${albedo}, albedo_num=${albedo_num}, isCorpsNoir=${isCorpsNoir}`);

    if (isCorpsNoir) {
        // 🔒 CORRECTION : Ne pas écraser si on a déjà utilisé data.albedo (peut avoir de la glace)
        if (albedo_num === 0 && albedo !== null && albedo !== undefined && albedo > 0) {
            albedo_num = albedo;
            console.log(`[updateFluxLabels] Mode corps noir: utilisation de data.albedo=${albedo_num.toFixed(3)} (glace des météorites)`);
        } else if (albedo_num === 0) {
            console.log(`[updateFluxLabels] Mode corps noir: albedo_num=0 (pas de glace)`);
        }
    } else if (albedo_num === 0 || albedo === null || albedo === undefined) {
        // Si albedo_num est 0 ou data.albedo n'est pas défini, recalculer avec le flux géothermique
        let geo_flux = null;
        if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch && typeof currentEpoch.geothermal_flux === 'number') {
                geo_flux = currentEpoch.geothermal_flux;
            }
        }
        if (typeof window !== 'undefined' && typeof window.calculateAlbedo === 'function') {
            albedo_num = window.calculateAlbedo(T0_num, h2o_enabled, geo_flux);
            console.log(`[updateFluxLabels] Albedo recalculé: ${albedo_num.toFixed(3)} (T0=${T0_num.toFixed(2)}K, h2o=${h2o_enabled}, geo_flux=${geo_flux})`);
        }
    } else {
        console.log(`[updateFluxLabels] Utilisation de data.albedo: ${albedo_num.toFixed(3)}`);
    }
    // Sinon, utiliser data.albedo qui vient de la simulation (déjà calculé avec tous les paramètres)

    let solar_flux_absorbed;
    if (isCorpsNoir) {
        solar_flux_absorbed = SOLAR_FLUX_AVERAGE;
    } else {
        // Récupérer le flux géothermique pour calculateSolarFluxAbsorbed
        let geo_flux = null;
        if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch && typeof currentEpoch.geothermal_flux === 'number') {
                geo_flux = currentEpoch.geothermal_flux;
            }
        }
        solar_flux_absorbed = typeof window !== 'undefined' && typeof window.calculateSolarFluxAbsorbed === 'function'
            ? window.calculateSolarFluxAbsorbed(T0_num, h2o_enabled, geo_flux)
            : SOLAR_FLUX_AVERAGE * (1 - albedo_num);
    }

    // Calculer le flux réfléchi avec l'albedo (venant de data.albedo ou recalculé)
    const flux_reflected = SOLAR_FLUX_AVERAGE * albedo_num;
    console.log(`[updateFluxLabels] Flux réfléchi: ${SOLAR_FLUX_AVERAGE.toFixed(2)} * ${albedo_num.toFixed(3)} = ${flux_reflected.toFixed(2)} W/m²`);

    // Calculer la couverture de glace (même logique que calculateAlbedo)
    // 🔒 CORRECTION : En mode "corps noir", on peut avoir de la glace des météorites
    let ice_coverage = 0;
    let cloud_percent = 0;

    // 🔒 PRIORITÉ 1 : Utiliser la valeur calculée par calculateAlbedo (la plus récente et précise)
    if (typeof window !== 'undefined' && window.h2oIceFractionFromCalculation !== undefined) {
        ice_coverage = Math.min(1, Math.max(0, window.h2oIceFractionFromCalculation));
        console.log(`[updateFluxLabels] 🔍 Utilisation de h2oIceFractionFromCalculation = ${ice_coverage.toFixed(3)} (${(ice_coverage * 100).toFixed(1)}%)`);
    } else if (isCorpsNoir) {
        // Corps noir sans glace calculée : pas d'albedo (pas d'atmosphère, pas d'eau)
        ice_coverage = 0;
        cloud_percent = 0;
        console.log(`[updateFluxLabels] 🔍 Mode corps noir sans glace: ice_coverage = 0`);
    } else {
        const T_surface_C = T0_num - 273.15;
        const volcanoIceReduction = (typeof window !== 'undefined' && window.volcanoIceReduction !== undefined)
            ? window.volcanoIceReduction / 100
            : 0; // Réduction en fraction (0 à 1)

        // Récupérer le flux géothermique depuis l'époque courante
        let geo_flux = 0.087; // Valeur par défaut (moderne)
        if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch && typeof currentEpoch.geothermal_flux === 'number') {
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
    cloud_percent = Math.round(cloud_coverage_num * 100);
    
    // 🔒 CORRECTION : Si on a utilisé h2oIceFractionFromCalculation, ne pas écraser cloud_percent en mode corps noir
    if (isCorpsNoir && (typeof window === 'undefined' || window.h2oIceFractionFromCalculation === undefined)) {
        cloud_percent = 0;
    }
    
    const ice_percent = Math.round(ice_coverage * 100);
    console.log(`[updateFluxLabels] 🧊 FIN: ice_coverage = ${ice_coverage.toFixed(3)} (${(ice_coverage * 100).toFixed(1)}%), ice_percent = ${ice_percent}%`);

    // Forçages radiatifs
    // Utiliser les états des boutons déjà calculés pour déterminer si les forçages sont actifs
    const forcing_CO2 = (co2_button_checked && co2_ppm_num > 0) && typeof window !== 'undefined' && typeof window.calculateCO2Forcing === 'function'
        ? window.calculateCO2Forcing(co2_ppm_num * 1e-6)
        : 0;
    // CH4 : calculer le forçage radiatif (bande d'absorption à ~7.7 μm et pic à ~23 μm)
    const forcing_CH4 = (ch4_button_checked && ch4_ppm_num > 0) && typeof window !== 'undefined' && typeof window.calculateCH4Forcing === 'function'
        ? window.calculateCH4Forcing(ch4_ppm_num * 1e-6)
        : 0;

    // Calculer les paramètres H2O (vapeur + nuages) avec la nouvelle fonction
    const h2o_vapor_percent = (typeof window !== 'undefined' && window.h2oVaporPercent !== undefined) ? window.h2oVaporPercent : 0;
    let h2o_params = null;
    let forcing_H2O = 0;

    if (h2o_button_checked && h2o_final_enabled && typeof window !== 'undefined' && typeof window.calculateH2OParameters === 'function') {
        // Calculer avec la température actuelle et le pourcentage de vapeur
        h2o_params = window.calculateH2OParameters(T0_num, h2o_vapor_percent, cloud_coverage_num);
        forcing_H2O = h2o_params.greenhouse_forcing;

        // Mettre à jour cloud_coverage avec la valeur calculée (si pas forcée)
        if (cloud_coverage_num === 0 || cloud_coverage_num === null) {
            cloud_coverage_num = h2o_params.cloud_coverage;
        }

        console.log('[H2O PARAMS]', {
            vapor_percent: h2o_vapor_percent,
            cloud_coverage: cloud_coverage_num,
            greenhouse_forcing: forcing_H2O,
            cloud_albedo_contribution: h2o_params.cloud_albedo_contribution
        });
    }
    // 🔒 CORRECTION : Le forçage albédo est actif seulement si le bouton est checked
    // En mode corps noir, on peut avoir un forçage albedo si il y a de la glace des météorites
    const forcing_Albedo = (!albedo_button_checked) ? 0 : (typeof window !== 'undefined' && typeof window.calculateAlbedoForcing === 'function'
        ? window.calculateAlbedoForcing(albedo_num)
        : 0);
    
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

    // Fonction helper pour mettre à jour un label par dataId
    const updateLabel = (dataId, value, format = 'auto') => {
        const labels = document.querySelectorAll(`[data-id="${dataId}"]`);
        labels.forEach(label => {
            let formattedValue = value;

            // Si c'est déjà une string, l'utiliser directement (pour '--', '0', etc.)
            if (typeof value === 'string') {
                if (format === 'text') {
                    formattedValue = value;
                } else if (format === 'watt' || format === 'watt_simple') {
                    // Si c'est une string avec W/m², l'utiliser directement
                    formattedValue = value.includes('W/m²') || value.includes('W/m2') ? value : value + (format === 'watt' ? '<br>W/m²' : ' W/m²');
                } else if (format === 'percent' || format === 'percent_simple') {
                    // Si c'est une string avec %, l'utiliser directement
                    formattedValue = value.includes('%') ? value : value + '%';
                } else if (format === 'ppm' || format === 'ppm_simple') {
                    // Si c'est une string avec ppm, l'utiliser directement
                    formattedValue = value.includes('ppm') ? value : value + ' ppm';
                } else {
                    formattedValue = value;
                }
            } else if (typeof value === 'number') {
                // C'est un nombre, formater selon le format demandé
                if (format === 'watt') {
                    // Formatage intelligent pour les grands nombres (MW, kW)
                    if (Math.abs(value) >= 1000000) {
                        formattedValue = (value / 1000000).toFixed(2) + '<br>MW/m²';
                    } else if (Math.abs(value) >= 1000) {
                        formattedValue = (value / 1000).toFixed(2) + '<br>kW/m²';
                    } else {
                        formattedValue = value.toFixed(2) + '<br>W/m²';
                    }
                } else if (format === 'percent') {
                    formattedValue = value.toFixed(0) + '%';
                } else if (format === 'watt_simple') {
                    // Formatage intelligent pour les grands nombres (MW, kW) - simple (sans <br>)
                    if (Math.abs(value) >= 1000000) {
                        formattedValue = (value / 1000000).toFixed(2) + ' MW/m²';
                    } else if (Math.abs(value) >= 1000) {
                        formattedValue = (value / 1000).toFixed(2) + ' kW/m²';
                    } else {
                        formattedValue = value.toFixed(2) + ' W/m²';
                    }
                } else if (format === 'watt_total_dual') {
                    // ⚠️ NOUVEAU FORMAT : Affiche W/m² (moyenne sphère) ET Watts Totaux (Conservation Énergie)
                    // Format: "VAL W/m²<br>(VAL_TOT W)" en plus petit
                    
                    // 1. Partie W/m²
                    let wm2_part = '';
                    if (Math.abs(value) >= 1000000) {
                        wm2_part = (value / 1000000).toFixed(2) + ' MW/m²';
                    } else if (Math.abs(value) >= 1000) {
                        wm2_part = (value / 1000).toFixed(2) + ' kW/m²';
                    } else {
                        wm2_part = value.toFixed(2) + ' W/m²';
                    }
                    
                    // 2. Partie Watts Totaux
                    // Surface Terre = 4 * PI * R^2
                    // R par défaut = 6371000m
                    // Mais on devrait idéalement récupérer le R de l'époque... 
                    // Approximation : R constant pour l'affichage conservation énergie
                    const R = 6371000;
                    const SURFACE_AREA = 4 * Math.PI * Math.pow(R, 2); // ~5.1e14 m2
                    const total_watts = value * SURFACE_AREA;
                    
                    // Formatage scientifique propre : X.XX × 10^YY
                    const expStr = total_watts.toExponential(2);
                    const [mantissa, exponent] = expStr.split('e');
                    // Nettoyer l'exposant (+26 -> 26)
                    const cleanExp = exponent.replace('+', '');
                    const watts_part = `${mantissa}×10<sup>${cleanExp}</sup> W`;
                    
                    // Combiner : W/m² en grand, Watts en petit et italique
                    formattedValue = `${wm2_part}<br><span style="font-size: 0.8em; font-style: italic; opacity: 0.8;">(${watts_part})</span>`;
                    
                } else if (format === 'percent_simple') {
                    formattedValue = value.toFixed(0) + '%';
                } else if (format === 'ppm' || format === 'ppm_simple') {
                    formattedValue = value.toFixed(0) + ' ppm';
                } else {
                    formattedValue = value.toFixed(2);
                }
            } else {
                // Autre type, convertir en string
                formattedValue = String(value);
            }

            label.innerHTML = formattedValue;

            // Réinitialiser toutes les classes de couleur
            label.classList.remove('watt-per-m2', 'watt-or-kelvin', 'zero-value', 'co2-label', 'percent-label', 'ppm-label');

            // Vérifier si le label est lié à un bouton
            // Note: forcing_total et albedo_percent sont sur le bouton albedo, mais forcing_total est aussi sur la flèche reemis->terre
            // On doit vérifier si c'est le label du bouton albedo ou celui de la flèche
            const isButtonLabel = dataId === 'co2_percent' || dataId === 'co2_forcing' ||
                dataId === 'ch4_percent' || dataId === 'ch4_forcing' ||
                dataId === 'h2o_percent' || dataId === 'h2o_forcing' ||
                dataId === 'albedo_percent' || dataId === 'albedo_forcing';

            // Vérifier si forcing_total est sur le bouton albedo (pas sur la flèche)
            // Le label du bouton albedo est dans la cellule cell-albedo-btn
            // Vérifier si le label est dans la cellule du bouton albedo
            const isAlbedoButtonLabel = dataId === 'forcing_total' &&
                (label.closest('#cell-albedo-btn') !== null);

            // Si c'est un label lié à un bouton, vérifier si le bouton est actif
            let shouldApplyColors = true;
            if (isButtonLabel || isAlbedoButtonLabel) {
                const useCO2 = typeof window !== 'undefined' ? window.useCO2 : false;
                const useCH4 = typeof window !== 'undefined' ? window.useCH4 : false;
                const useH2O = typeof window !== 'undefined' ? window.useH2O : false;
                const useAlbedo = typeof window !== 'undefined' ? window.useAlbedo : false;

                let isActive = false;
                if (dataId === 'co2_percent' || dataId === 'co2_forcing') {
                    isActive = useCO2;
                } else if (dataId === 'ch4_percent' || dataId === 'ch4_forcing') {
                    isActive = useCH4;
                } else if (dataId === 'h2o_percent' || dataId === 'h2o_forcing') {
                    isActive = useH2O;
                } else if (dataId === 'albedo_percent' || dataId === 'albedo_forcing' || isAlbedoButtonLabel) {
                    isActive = useAlbedo;
                }
                shouldApplyColors = isActive;
            }

            // Appliquer les couleurs selon l'algorithme existant : W/m² en orange, % en bleu, le reste en défaut (vert)
            if (shouldApplyColors) {
                // D'abord vérifier " W " ou " K " (rouge) - inclut le cas notation scientifique "×10... W"
                // Attention : " W/m²" contient " W" mais ne doit pas être rouge. On vérifie d'abord W/m².
                
                // 1. W/m² (orange) - Prioritaire pour éviter confusion avec W
                if (formattedValue.includes('W/m²') || formattedValue.includes('W/m2')) {
                    if (shouldLabelBeGray(formattedValue)) {
                        label.classList.add('zero-value');
                    } else {
                        label.classList.add('watt-per-m2');
                    }
                }
                // 2. W ou K (rouge) - Y compris avec notation scientifique
                else if (formattedValue.includes(' W') || formattedValue.includes(' K')) {
                    if (shouldLabelBeGray(formattedValue)) {
                        label.classList.add('zero-value');
                    } else {
                        label.classList.add('watt-or-kelvin');
                    }
                }
                // 3. Sinon, vérifier % (bleu clair)
                else if (formattedValue.includes('%')) {
                    if (shouldLabelBeGray(formattedValue)) {
                        label.classList.add('zero-value');
                    } else {
                        label.classList.add('percent-label');
                    }
                }
                // Sinon, vérifier ppm (bleu clair, comme les %)
                else if (formattedValue.includes('ppm')) {
                    if (shouldLabelBeGray(formattedValue)) {
                        label.classList.add('zero-value');
                    } else {
                        label.classList.add('ppm-label');
                    }
                }
                // Sinon, couleur par défaut (vert pour CO2)
                else if (dataId === 'co2_percent' || dataId === 'co2_forcing') {
                    label.classList.add('co2-label');
                }
            } else {
                // Bouton inactif : appliquer le style "zero-value" (gris)
                label.classList.add('zero-value');
            }
        });
    };

    // Mettre à jour les labels des nœuds
    // Géométrie -> Albedo : flux solaire moyen
    updateLabel('solar_flux_average_wm', SOLAR_FLUX_AVERAGE, 'watt');

    // Géométrie -> Surface : breakdown albedo détaillé
    // Récupérer les valeurs de l'époque courante
    // Toujours afficher le magma (volcans) même si couverture à 0%
    // Classer par ordre décroissant de pondération (couverture × albedo)
    let albedoBreakdown = '';

    // Fonction helper pour créer et trier les composantes
    const createAlbedoComponents = (components) => {
        // Calculer la pondération pour chaque composante (couverture × albedo)
        components.forEach(comp => {
            comp.weight = (comp.coverage / 100) * parseFloat(comp.albedo);
        });
        // Trier par ordre décroissant de pondération
        components.sort((a, b) => b.weight - a.weight);
        // Construire la chaîne HTML
        return components.map(comp => {
            // Arrondir le pourcentage à un entier et limiter à 99% maximum
            const coverage_int = Math.min(99, Math.round(comp.coverage));
            // Si c'est un chemin d'image (contient .png, .jpg, etc.), utiliser une balise <img>
            const isImage = comp.emoji && (comp.emoji.includes('.png') || comp.emoji.includes('.jpg') || comp.emoji.includes('.svg'));
            if (isImage) {
                return `<img src="${comp.emoji}" style="width: 1.8em; height: 1.8em; vertical-align: middle; display: inline-block;" alt="desert"> ${coverage_int}% <span style="font-size: 0.8em;">x${comp.albedo}</span>`;
            } else {
                return `<span style="font-size: 1.5em;">${comp.emoji}</span> ${coverage_int}% <span style="font-size: 0.8em;">x${comp.albedo}</span>`;
            }
        }).join('<br>');
    };

    if (isCorpsNoir) {
        // 🔒 CORRECTION : Corps noir peut avoir de la glace des météorites
        // Utiliser ice_coverage calculé au lieu de forcer à 0
        const ice_cov_corps_noir = Math.round(ice_coverage * 100);
        console.log(`[updateFluxLabels] 🔍 Corps noir: utilisation de ice_coverage = ${ice_coverage.toFixed(3)}, ice_cov = ${ice_cov_corps_noir}%`);
        const components = [
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.VOLCANO : '🌋', coverage: 0, albedo: '0.05' },
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.OCEAN : '🌊', coverage: 0, albedo: '0.08' },
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.FOREST : '🌳', coverage: 0, albedo: '0.12' },
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.DESERT : '🏜️', coverage: 0, albedo: '0.30' },
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.ICE : '🧊', coverage: ice_cov_corps_noir, albedo: '0.70' },
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.CLOUD : '⛅', coverage: 0, albedo: '0.40' }
        ];
        albedoBreakdown = createAlbedoComponents(components);
    } else if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            // Récupérer les valeurs de couverture de l'époque
            const magma_cov = Math.round((currentEpoch.magma_coverage || 0) * 100);
            const ocean_cov = Math.round((currentEpoch.ocean_coverage || 0) * 100);
            const forest_cov = Math.round((currentEpoch.forest_coverage || 0) * 100);
            const desert_cov = Math.round((currentEpoch.desert_coverage || 0) * 100);
            // Pour la glace, utiliser la valeur calculée dynamiquement (ice_coverage)
            // 🔒 CORRECTION : S'assurer qu'on utilise bien la valeur calculée
            const ice_cov = Math.round(ice_coverage * 100);
            console.log(`[updateFluxLabels] 🔍 Création albedoBreakdown: ice_coverage = ${ice_coverage.toFixed(3)}, ice_cov = ${ice_cov}%`);
            // Pour les nuages, utiliser la valeur calculée dynamiquement (cloud_percent)
            // Arrondir à un entier
            const cloud_cov = Math.round(cloud_percent);

            // Récupérer les albedos de chaque composante
            const magma_alb = (currentEpoch.magma_albedo || 0.05).toFixed(2);
            const ocean_alb = (currentEpoch.ocean_albedo || 0.08).toFixed(2);
            const forest_alb = (currentEpoch.forest_albedo || 0.12).toFixed(2);
            const desert_alb = (currentEpoch.desert_albedo || 0.30).toFixed(2);
            const ice_alb = (currentEpoch.ice_albedo || 0.70).toFixed(2);
            const cloud_alb = (currentEpoch.cloud_albedo || 0.40).toFixed(2);

            // Créer le tableau des composantes avec leurs valeurs
            const components = [
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.VOLCANO : '🌋', coverage: magma_cov, albedo: magma_alb },
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.OCEAN : '🌊', coverage: ocean_cov, albedo: ocean_alb },
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.FOREST : '🌳', coverage: forest_cov, albedo: forest_alb },
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.DESERT : '🏜️', coverage: desert_cov, albedo: desert_alb },
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.ICE : '🧊', coverage: ice_cov, albedo: ice_alb },
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.CLOUD : '⛅', coverage: cloud_cov, albedo: cloud_alb }
            ];
            albedoBreakdown = createAlbedoComponents(components);
        } else {
            // Fallback si époque non trouvée
            const final_cloud_percent = Math.round(cloud_percent);
            const final_ice_percent = Math.round(ice_coverage * 100);
            const components = [
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.VOLCANO : '🌋', coverage: 0, albedo: '0.05' },
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.OCEAN : '🌊', coverage: 0, albedo: '0.08' },
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.FOREST : '🌳', coverage: 0, albedo: '0.12' },
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.DESERT : '🏜️', coverage: 0, albedo: '0.30' },
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.ICE : '🧊', coverage: final_ice_percent, albedo: '0.70' },
                { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.CLOUD : '⛅', coverage: final_cloud_percent, albedo: '0.40' }
            ];
            albedoBreakdown = createAlbedoComponents(components);
        }
    } else {
        // Fallback si pas d'époque
        const final_cloud_percent = Math.round(cloud_percent);
        const final_ice_percent = Math.round(ice_coverage * 100);
        const components = [
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.VOLCANO : '🌋', coverage: 0, albedo: '0.05' },
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.OCEAN : '🌊', coverage: 0, albedo: '0.08' },
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.FOREST : '🌳', coverage: 0, albedo: '0.12' },
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.DESERT : '🏜️', coverage: 0, albedo: '0.30' },
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.ICE : '🧊', coverage: final_ice_percent, albedo: '0.70' },
            { emoji: (typeof window !== 'undefined' && window.LOGOS) ? window.LOGOS.CLOUD : '⛅', coverage: final_cloud_percent, albedo: '0.40' }
        ];
        albedoBreakdown = createAlbedoComponents(components);
    }
    updateLabel('albedo_percents', albedoBreakdown, 'text');
    // Flux qui passe (solar_flux_average - flux_reflected = flux qui arrive à la surface)
    // En mode corps-noir : albedo = 0, donc tout passe (340.25 W/m²)
    const flux_passed = solar_flux_absorbed; // C'est le flux qui arrive à la surface après albédo
    updateLabel('solar_flux_absorbed_wm', flux_passed, 'watt_simple');

    // Albedo -> Espace1 : flux total au sommet
    updateLabel('solar_flux_reflected_wm', flux_reflected, 'watt');

    // Noyau -> Surface : géothermie (flux dynamique selon l'époque)
    // Récupérer le flux géothermique de l'époque courante
    let geothermie_value = GEOTHERMIE_FLUX; // Valeur par défaut (0.087 W/m²)

    if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
        const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
        if (currentEpoch) {
            if (typeof currentEpoch.geothermal_flux === 'number') {
                geothermie_value = currentEpoch.geothermal_flux;
            } else if (currentEpoch.core_temperature === 0) {
                // Si core_temperature est explicitement 0 (ex: Corps Noir), flux = 0
                geothermie_value = 0;
            }
        }
    }

    // En mode corps noir, forcer à 0 (pas de noyau différencié)
    if (isCorpsNoir) {
        geothermie_value = 0;
    }

    updateLabel('core_flux_wm', geothermie_value, 'watt');

    // Surface -> Albedo : Flux total émis par la surface (Loi de Stefan-Boltzmann)
    // C'est la puissance thermodynamique rayonnée par le sol chaud : F = σT⁴
    // ⚠️ CORRECTION CRITIQUE : Ne PAS utiliser solar_flux_absorbed + geothermie_value ici !
    // En présence d'effet de serre, la surface reçoit aussi la "Back Radiation" (non affichée explicitement)
    // et chauffe bien plus que la simple somme solaire + géothermie.
    // La seule vérité est la température de surface T0 trouvée par l'équilibre radiatif.
    const CONST_STEFAN = 5.67e-8; // Renommé pour éviter conflit scope
    const surface_flux_emitted = CONST_STEFAN * Math.pow(T0_num, 4);
    updateLabel('surface_flux_emitted_wm', surface_flux_emitted, 'watt_total_dual'); // MODIFIÉ : Affichage dual

    // 🔒 CORRECTION : Calculer l'effet de serre réel à partir du transfert radiatif
    // Le transfert radiatif (calculations.js) calcule déjà le flux sortant au sommet (total_flux)
    // en fonction du flux émis par la surface ET de la composition de l'atmosphère (CO2, CH4, H2O).
    // 
    // Effet de serre = Flux émis par la surface - Flux sortant au sommet (OLR)
    // Si total_flux est disponible (résultat du transfert radiatif), l'utiliser pour l'effet de serre réel
    if (total_flux > 0 && surface_flux_emitted > 0) {
        // L'effet de serre est la différence entre ce que le sol émet et ce qui sort réellement
        const greenhouse_effect_real = surface_flux_emitted - total_flux;
        
        // En théorie, surface_flux_emitted >= total_flux (sauf si l'atmosphère génère de l'énergie ex-nihilo ou transitoire)
        // On autorise les valeurs négatives transitoires mais on logge l'anomalie
        forcing_total = greenhouse_effect_real;
        console.log(`[updateFluxLabels] Effet de serre réel (transfert radiatif): ${forcing_total.toFixed(2)} W/m² (surface=${surface_flux_emitted.toFixed(2)} W/m², sortant=${total_flux.toFixed(2)} W/m²)`);
    }

    // Albedo -> Espace2 : flux éjecté = flux sortant au sommet (résultat direct du transfert radiatif)
    const flux_ejected = total_flux > 0 ? total_flux : (surface_flux_emitted - forcing_total); // Fallback si total_flux non disponible
    updateLabel('flux_ejected_wm', flux_ejected, 'watt_total_dual'); // MODIFIÉ : Affichage dual
    let corePowerText = '';
    if (isCorpsNoir) {
        // En mode corps noir : pas de noyau actif
        corePowerText = '0 W';
    } else {
        // Calculer la puissance totale : Flux (W/m²) * Surface (m²)
        // Surface = 4 * PI * R²
        let radius = 6371000; // Défaut Terre
        if (typeof window !== 'undefined' && window.currentEpochName && typeof window.getGeologicalPeriodByName === 'function') {
             const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
             if (currentEpoch && currentEpoch.planet_radius) {
                 radius = currentEpoch.planet_radius;
             }
        }
        const surface = 4 * Math.PI * Math.pow(radius, 2);
        const totalPower = geothermie_value * surface;
        
        // Formatage scientifique : X.XX x 10^Y W
        if (totalPower <= 0) {
            corePowerText = '0 W';
        } else {
            const exponent = Math.floor(Math.log10(totalPower));
            const mantissa = totalPower / Math.pow(10, exponent);
            corePowerText = `${mantissa.toFixed(2)}×10<sup>${exponent}</sup> W`;
        }
    }

    // Mettre à jour le label (ou le cacher si vide)
    const coreTempLabel = document.querySelector('[data-id="core_temperature"]');
    if (coreTempLabel) {
        if (corePowerText) {
            coreTempLabel.innerHTML = corePowerText;
            coreTempLabel.style.display = '';
            // Appliquer les couleurs
            updateLabelClasses(coreTempLabel);
        } else {
            coreTempLabel.style.display = 'none';
        }
    }


    // Mettre à jour le label du noyau pour qu'il soit gris si corps noir
    const noyauLabels = document.querySelectorAll('#cell-noyau .flux-label[data-id="core_flux_wm"]');
    noyauLabels.forEach(label => {
        if (isCorpsNoir) {
            label.classList.add('zero-value');
        } else {
            label.classList.remove('zero-value');
        }
    });

    // Cacher/afficher les radiations du noyau selon l'époque
    const noyauRadiationGroup = document.querySelector('.flux-radiation-group[data-node="noyau"]');
    if (noyauRadiationGroup) {
        if (isCorpsNoir) {
            // Corps noir: pas de noyau différencié, donc pas de radiation
            noyauRadiationGroup.style.display = 'none';
        } else {
            // Autres époques: afficher les radiations
            noyauRadiationGroup.style.display = '';
        }
    }


    // Cacher le logo du noyau en mode corps noir (pas de noyau différencié)
    const noyauCell = document.querySelector('#cell-noyau');
    if (noyauCell) {
        const noyauLogo = noyauCell.querySelector('.flux-circle-bg span');
        if (noyauLogo) {
            if (isCorpsNoir) {
                noyauLogo.style.opacity = '0';
                noyauLogo.style.visibility = 'hidden';
            } else {
                noyauLogo.style.opacity = '1';
                noyauLogo.style.visibility = 'visible';
            }
        }

        // Griser le cercle du noyau en mode corps noir
        const noyauCircle = noyauCell.querySelector('.flux-circle-bg');
        if (noyauCircle) {
            const noyauNode = nodes.find(n => n.id === 'noyau');
            if (isCorpsNoir) {
                noyauCircle.style.borderColor = '#666'; // Gris
            } else {
                // Réappliquer la couleur depuis la configuration
                const strokeColor = noyauNode ? (noyauNode.strokeColor || '#ff5500') : '#ff5500';
                noyauCircle.style.borderColor = strokeColor;
            }
        }
    }

    // Griser la flèche noyau → surface en mode corps noir
    const noyauArrow = document.querySelector('[data-from="noyau"][data-to="terre"]');
    if (noyauArrow) {
        if (isCorpsNoir) {
            noyauArrow.style.backgroundColor = '#666'; // Gris
            // Griser aussi les labels de cette flèche
            const arrowLabels = noyauArrow.querySelectorAll('.flux-label');
            arrowLabels.forEach(label => label.classList.add('zero-value'));
        } else {
            noyauArrow.style.backgroundColor = ''; // Réinitialiser
            const arrowLabels = noyauArrow.querySelectorAll('.flux-label');
            arrowLabels.forEach(label => label.classList.remove('zero-value'));
        }
    }

    // Surface -> Albedo : flux émis par la surface (approximation avec Stefan-Boltzmann)
    const STEFAN_BOLTZMANN = 5.670374419e-8;
    const flux_emission_surface = isCorpsNoir ? 0 : STEFAN_BOLTZMANN * Math.pow(T0_num, 4);
    
    // Mettre à jour l'épaisseur de l'atmosphère dans le label de l'arc Terre->Albedo
    // Utiliser calculateAtmosphereProperties pour obtenir la vraie hauteur physique
    let atm_height_km = 0;
    if (!isCorpsNoir && typeof window.calculateAtmosphereProperties === 'function') {
        // Récupérer la masse atmosphérique de l'époque
        let total_mass = 5.15e18; // Terre actuelle
        if (typeof window.getGeologicalPeriodByName === 'function' && window.currentEpochName) {
            const currentEpoch = window.getGeologicalPeriodByName(window.currentEpochName);
            if (currentEpoch && currentEpoch.total_atmosphere_mass_kg) {
                total_mass = currentEpoch.total_atmosphere_mass_kg;
            }
        }
        
        // Estimation de la masse molaire moyenne (M)
        // Si atmosphère massive (Hadéen), dominée par CO2 (44g/mol) -> 0.044
        // Sinon Terre actuelle (Air) -> 0.029
        // On utilise le seuil défini dans calculations_atm.js (2.5e19)
        const isMassive = total_mass > 2.5e19;
        const M_avg = isMassive ? 0.044 : 0.029;
        
        // On passe T0_num (Température surface) et M_avg pour un calcul physique de H
        const props = window.calculateAtmosphereProperties(total_mass, T0_num, M_avg);
        atm_height_km = props.z_max / 1000; // Conversion m -> km
    }
    
    // Mise à jour directe du DOM pour le label 'name' de l'arc terre->albedo
    const terreAlbedoArrow = document.querySelector('[data-from="terre"][data-to="albedo"]');
    if (terreAlbedoArrow) {
        // Chercher le label qui contient "km" ou qui est positionné comme le nom
        // On cherche parmi tous les flux-label celui qui n'est PAS une valeur numérique de flux (qui aurait un dataId ou une classe spécifique)
        // Le label "0 km" est généralement le premier ou celui qui contient "km"
        const labels = terreAlbedoArrow.querySelectorAll('.flux-label');
        let nameLabel = null;
        
        labels.forEach(label => {
            if (label.textContent.includes('km')) {
                nameLabel = label;
            }
        });
        
        // Fallback : si pas trouvé par "km", c'est peut-être "0 km" initialement donc on cherche le texte exact "0 km"
        if (!nameLabel) {
            labels.forEach(label => {
                if (label.textContent.trim() === '0 km') {
                    nameLabel = label;
                }
            });
        }

        if (nameLabel) {
            nameLabel.textContent = `${atm_height_km.toFixed(0)} km`;
            // Couleur par défaut (vert/défaut), retirer les classes spécifiques
            // nameLabel.className = 'flux-label'; // Ne pas changer la classe pour ne pas casser le style
            
            // Ajouter un tooltip explicatif
            if (typeof window.addTooltip === 'function') {
                const tooltipText = isCorpsNoir 
                    ? "Pas d'atmosphère" 
                    : `Hauteur effective de l'atmosphère<br>(99.99% de la masse)`;
                
                // Réattacher le tooltip proprement
                // On doit cloner pour supprimer les event listeners précédents si on change le texte/tooltip souvent
                // Mais ici c'est une mise à jour simple, on peut juste mettre à jour l'attribut title si on utilisait title
                // Comme addTooltip utilise des events, le plus propre est de recréer le tooltip
                
                // Note: addTooltip attache des événements mouseenter/mouseleave.
                // Si on le rappelle sur le même élément, on risque d'empiler les listeners.
                // On va cloner le noeud pour nettoyer les listeners
                const newLabel = nameLabel.cloneNode(true);
                if (nameLabel.parentNode) {
                    nameLabel.parentNode.replaceChild(newLabel, nameLabel);
                    window.addTooltip(newLabel, tooltipText);
                }
            }
        } else {
            console.warn('[organigramme] ⚠️ Label "km" non trouvé dans terre->albedo', labels);
        }
    }

    // Réémis : forçage radiatif total
    updateLabel('forcing_total', forcing_total, 'watt');

    // Boutons
    // CO2 - afficher en % si > 10000 ppm, sinon en ppm
    let co2_ppm_display, co2_format;
    if (co2_ppm_num > 10000) {
        co2_ppm_display = (co2_ppm_num / 10000).toFixed(1);
        co2_format = 'percent';
    } else {
        co2_ppm_display = co2_ppm_num > 0 ? co2_ppm_num.toFixed(0) : '0';
        co2_format = 'ppm_simple';
    }
    updateLabel('co2_percent', co2_ppm_display, co2_format);
    updateLabel('co2_forcing', forcing_CO2, 'watt_simple');

    // Ne plus forcer automatiquement le bouton CO2 en off/gris
    // L'utilisateur contrôle l'état du bouton manuellement

    // CH4 - afficher directement en ppm (pas de conversion en %)
    const ch4_ppm_display = ch4_ppm_num > 0 ? ch4_ppm_num.toFixed(0) : '0';
    updateLabel('ch4_percent', ch4_ppm_display, 'ppm_simple');
    // Utiliser directement forcing_CH4 qui est déjà calculé avec les bonnes conditions
    updateLabel('ch4_forcing', forcing_CH4, 'watt_simple');

    // Ne plus forcer automatiquement le bouton CH4 en off/gris
    // L'utilisateur contrôle l'état du bouton manuellement

    // H2O : afficher le pourcentage de vapeur d'eau (effet de serre)
    // Séparé de la couverture nuageuse (qui affecte l'albedo)
    // 🔒 Utiliser la fraction de vapeur calculée (h2o_params) si disponible, sinon le total
    let h2o_display_value = 0;
    if (h2o_params && h2o_params.vapor_fraction !== undefined) {
        h2o_display_value = h2o_params.vapor_fraction * 100;
    } else {
        h2o_display_value = h2o_vapor_percent;
    }

    const h2o_percent = (h2o_enabled && h2o_button_checked && h2o_display_value > 0)
        ? h2o_display_value.toFixed(1)
        : '0';
    // Le forçage H2O doit être 0 si h2o_enabled est false (pas d'eau dans l'atmosphère)
    // Utiliser directement forcing_H2O qui est déjà calculé avec les bonnes conditions
    const forcing_H2O_final = h2o_enabled ? forcing_H2O : 0;
    updateLabel('h2o_percent', h2o_percent, 'percent_simple');
    updateLabel('h2o_forcing', forcing_H2O_final, 'watt_simple');

    // Albédo
    const albedo_percent_value = albedo_num * 100;
    updateLabel('albedo_percent', albedo_percent_value, 'percent_simple');
    updateLabel('albedo_forcing', forcing_Albedo, 'watt_simple');
    // Les labels du bouton albedo utilisent forcing_total et albedo_percent
    // albedo_percent : pourcentage total d'albedo (somme des %), pas le détail
    updateLabel('albedo_percent', albedo_percent_value, 'percent_simple');

    // passing_albedo_percent : pourcentage qui passe (1 - albedo_percent)
    // Sur la flèche geometrie -> albedo
    const passing_albedo_percent = (1 - albedo_num) * 100;
    updateLabel('passing_albedo_percent', passing_albedo_percent, 'percent_simple');

    // Ne plus forcer automatiquement le bouton albedo en off/gris
    // L'utilisateur contrôle l'état du bouton manuellement, même si la valeur est à 0%
}

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
    window.updateFluxLabels = updateFluxLabels;

    // Initialiser les variables globales selon l'état initial des cellules (boutons du flux)
    // Les boutons du flux sont des cellules, pas des boutons HTML
    const cellCO2_init = document.getElementById('cell-co2');
    const cellCH4_init = document.getElementById('cell-methane');
    const cellH2O_init = document.getElementById('cell-h2o');
    const cellAlbedo_init = document.getElementById('cell-albedo-btn');

    if (typeof window !== 'undefined') {
        // Les boutons sont activés par défaut (voir createCell ligne 1822)
        window.useCO2 = cellCO2_init ? cellCO2_init.classList.contains('checked') : true;
        window.useCH4 = cellCH4_init ? cellCH4_init.classList.contains('checked') : true;
        window.useH2O = cellH2O_init ? cellH2O_init.classList.contains('checked') : true;
        window.useAlbedo = cellAlbedo_init ? cellAlbedo_init.classList.contains('checked') : true;

        // Initialiser les classes selected/unselected sur les cellules
        const buttonMap = [
            { cellId: 'cell-co2', varName: 'useCO2' },
            { cellId: 'cell-methane', varName: 'useCH4' },
            { cellId: 'cell-h2o', varName: 'useH2O' },
            { cellId: 'cell-albedo-btn', varName: 'useAlbedo' }
        ];
        
        // Mettre à jour les tooltips des boutons selon leur état initial
        buttonMap.forEach(({ cellId }) => {
            const cell = document.getElementById(cellId);
            if (cell) {
                const circleBg = cell.querySelector('.flux-circle-bg');
                if (circleBg) {
                    updateButtonTooltip(cell, circleBg);
                }
            }
        });

        buttonMap.forEach(({ cellId, varName }) => {
            const cell = document.getElementById(cellId);
            if (cell) {
                const isChecked = cell.classList.contains('checked');
                if (isChecked) {
                    cell.classList.add('selected');
                    cell.classList.remove('unselected');
                    window[varName] = true;
                } else {
                    cell.classList.remove('selected');
                    cell.classList.add('unselected');
                    window[varName] = false;
                }
            }
        });
    }
    window.generateTimelineFromConfig = generateTimelineFromConfig;

    // Générer la timeline depuis la config au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', generateTimelineFromConfig);
    } else {
        // DOM déjà chargé, appeler directement
        generateTimelineFromConfig();
    }
}

// Fonction pour recréer les radiations du noyau selon l'époque courante
function recreateNoyauRadiation() {
    const noyauNode = nodes.find(n => n.id === 'noyau');
    if (!noyauNode || !Array.isArray(noyauNode.radiation)) return;

    // Trouver la configuration de l'époque courante
    const currentEpochName = (typeof window !== 'undefined' && window.currentEpochName) || 'Corps noir';
    let epochRadiation = noyauNode.radiation.find(r => r.epochName === currentEpochName);

    // Si l'époque n'est pas trouvée, utiliser la dernière du tableau (permet d'alléger les répétitions)
    if (!epochRadiation && noyauNode.radiation.length > 0) {
        epochRadiation = noyauNode.radiation[noyauNode.radiation.length - 1];
    }

    if (!epochRadiation) return;

    // Supprimer l'ancien groupe de radiations
    const oldRadiationGroup = document.querySelector('.flux-radiation-group[data-node="noyau"]');
    if (oldRadiationGroup) {
        oldRadiationGroup.remove();
    }

    // Si numCircles = 0, ne pas créer de radiations
    if (epochRadiation.numCircles === 0 || epochRadiation.maxRadius === 0) {
        return;
    }

    // Créer le nouveau groupe de radiations
    const radiationContainer = document.querySelector('.flux-radiation-container');
    if (!radiationContainer) return;

    const radiationGroup = document.createElement('div');
    radiationGroup.className = 'flux-radiation-group';
    radiationGroup.style.color = epochRadiation.color || '#ff9800';
    radiationGroup.setAttribute('data-node', 'noyau');

    radiationContainer.appendChild(radiationGroup);

    // Créer les cercles de radiation
    const { numCircles, maxRadius, openingAngle = 0, rotation = 0, color = '#ff9800', strokeSize = 2 } = epochRadiation;
    // Utiliser getNodeProperty pour récupérer le radius (gère le cas spécial 'terre' avec epoch)
    const noyauRadius = noyauNode.radius || 30;

    for (let i = 1; i <= numCircles; i++) {
        const progress = i / numCircles;
        const arcRadius = noyauRadius + (maxRadius - noyauRadius) * progress;
        const arc = createArc(noyauNode.x, noyauNode.y, arcRadius, 0.3 + (progress * 0.2), openingAngle, rotation, radiationGroup);
        arc.style.border = `${strokeSize}px dashed ${color}`;
    }
}

// Fonction pour recréer les radiations de la terre
function recreateTerreRadiation() {
    const terreNode = nodes.find(n => n.id === 'terre');
    if (!terreNode || !terreNode.radiation) return;

    // Supprimer l'ancien groupe de radiations de la terre
    const oldRadiationGroup = document.querySelector('.flux-radiation-group[data-node="terre"]');
    if (oldRadiationGroup) {
        oldRadiationGroup.remove();
    }

    // Récupérer les options de radiation (peut être un objet simple ou un tableau)
    let radiationOptions = terreNode.radiation;

    // Si c'est un tableau (par époque), trouver la bonne configuration
    if (Array.isArray(radiationOptions)) {
        const currentEpochName = (typeof window !== 'undefined' && window.currentEpochName) || 'Corps noir';
        let epochRadiation = radiationOptions.find(r => r.epochName === currentEpochName);
        if (!epochRadiation && radiationOptions.length > 0) {
            epochRadiation = radiationOptions[radiationOptions.length - 1];
        }
        if (epochRadiation) {
            radiationOptions = epochRadiation;
        } else {
            return; // Pas de radiation pour cette époque
        }
    }

    const { numCircles = 8, maxRadius, openingAngle = 270, rotation = 270, color = '#ff9800', strokeSize = 2 } = radiationOptions;

    if (!maxRadius || maxRadius <= 0) return;

    // Créer le nouveau groupe de radiations
    const radiationContainer = document.querySelector('.flux-radiation-container');
    if (!radiationContainer) return;

    const radiationGroup = document.createElement('div');
    radiationGroup.className = 'flux-radiation-group';
    radiationGroup.style.color = color;
    radiationGroup.setAttribute('data-node', 'terre');

    radiationContainer.appendChild(radiationGroup);

    // Utiliser getNodeProperty pour récupérer le radius (gère le cas spécial 'terre' avec epoch)
    const terreRadius = getNodeProperty(terreNode, 'radius', 50);
    const terreX = terreNode.x;
    const terreY = terreNode.y;

    for (let i = 1; i <= numCircles; i++) {
        const progress = i / numCircles;
        const arcRadius = terreRadius + (maxRadius - terreRadius) * progress;
        const arc = createArc(terreX, terreY, arcRadius, 0.3 + (progress * 0.2), openingAngle, rotation, radiationGroup);
        arc.style.border = `${strokeSize}px dashed ${color}`;
    }
}

// Fonction pour initialiser les event listeners sur les boutons du flux
function initFluxButtonListeners() {
    // Mapping des cellules vers leurs variables globales
    // Les boutons sont des cellules du diagramme, pas des boutons HTML
    const buttonMap = [
        { cellId: 'cell-co2', varName: 'useCO2', nodeId: 'co2' },
        { cellId: 'cell-methane', varName: 'useCH4', nodeId: 'methane' },
        { cellId: 'cell-h2o', varName: 'useH2O', nodeId: 'h2o' },
        { cellId: 'cell-albedo-btn', varName: 'useAlbedo', nodeId: 'albedo-btn' }
    ];

    buttonMap.forEach(({ cellId, varName, nodeId }) => {
        const cell = document.getElementById(cellId);
        const circleBg = cell ? cell.querySelector('.flux-circle-bg') : null;

        if (cell && circleBg) {
            // Initialiser l'état selected/unselected selon l'état checked
            const isChecked = cell.classList.contains('checked');
            if (isChecked) {
                cell.classList.add('selected');
                cell.classList.remove('unselected');
            } else {
                cell.classList.remove('selected');
                cell.classList.add('unselected');
            }

            // Initialiser la variable globale
            if (typeof window !== 'undefined') {
                window[varName] = isChecked;
            }
        }
    });
}

// Exposer createCell globalement pour accès depuis main.js
window.createCell = createCell;
window.recreateNoyauRadiation = recreateNoyauRadiation;
window.recreateTerreRadiation = recreateTerreRadiation;
window.initFluxButtonListeners = initFluxButtonListeners;
