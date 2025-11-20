// File: organigramme.js - Génération automatique du diagramme de flux énergétique
// Desc: Module JavaScript pour créer automatiquement un diagramme de flux énergétique à partir d'un graphe (nœuds et arcs)
// Version 1.0.0
// © 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: extraction du code de génération du diagramme depuis demo_flux_energetique_01.html

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
        logoBg.style.zIndex = '0';
        // Utiliser la plus grande dimension pour calculer une taille qui remplit vraiment l'espace
        const maxDimension = Math.max(width, height);
        const fontSize = maxDimension * 1.5; // Assez grand pour remplir tout l'espace
        logoBg.style.fontSize = fontSize + 'px';
        logoBg.style.lineHeight = '1';
        logoBg.textContent = fillImage;
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
    rect.style.zIndex = 1; // Même z-index que le cercle
    
    // Les facteurs sont créés par integrateEds.js qui remplace le contenu du rectangle
    // Code mort supprimé - les facteurs viennent de .synthese_EdS dans index.html
    
    cell.appendChild(rect);
    return rect;
}

// Fonction pour créer une cellule avec un tableau 3x3
function createCell(x, y, radius, fillColor, strokeColor, logo, left = [], right = [], top = [], bottom = [], tooltip = null, radiationOptions = null, rectangleOptions = null, fillImage = null, nodeId = null, zIndex = null, logoScale = 1.4, logoOffsetY = 0, strokeSize = 4) {
    const container = document.getElementById('flux-diagram');
    
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
    
    // Appliquer le z-index personnalisé si fourni
    if (zIndex !== null && zIndex !== undefined) {
        cell.style.zIndex = zIndex;
    }
    
    // Adapter la grille à la taille du cercle OU du logo (le plus grand)
    const hasCircle = strokeColor && strokeColor.trim() !== '';
    // Calcul initial pour les dimensions par défaut
    const circleDiameterInit = hasCircle ? (radius * 2) : 0;
    let centralCellSize = hasCircle ? circleDiameterInit : (radius * logoScale);
    let totalHeight = 25 + centralCellSize + 20;
    let totalWidth = 100 + centralCellSize + 100;
    
    if (!rectangleOptions) {
        // Case centrale = max(diamètre du cercle, taille du logo) - s'adapte à la vraie taille
        const circleDiameter = hasCircle ? (radius * 2) : 0;
        // Si cercle visible : logoScale est relatif au diamètre, sinon relatif au radius
        const logoSize = hasCircle ? (circleDiameter * logoScale) : (radius * logoScale);
        centralCellSize = Math.max(circleDiameter, logoSize); // Pas de minimum, s'adapte à la taille réelle
        
        // Adapter la grille en hauteur ET en largeur au contenu central
        cell.style.gridTemplateRows = `25px ${centralCellSize}px 20px`;
        cell.style.gridTemplateColumns = `100px ${centralCellSize}px 100px`; // Colonne centrale = taille du logo/cercle
        
        // Ajuster les dimensions de la cellule
        totalHeight = 25 + centralCellSize + 20;
        totalWidth = 100 + centralCellSize + 100;
        cell.style.height = totalHeight + 'px';
        cell.style.width = totalWidth + 'px';
        
    }
    
    // Positionner le coin supérieur gauche de la grille, puis utiliser transform pour centrer précisément
    // Compensation pour la structure asymétrique de la grille (25px top vs 20px bottom)
    // Le décalage vertical est : (25 - 20) / 2 = 2.5px
    const verticalOffset = 2.5; // Décalage pour compenser l'asymétrie de la grille
    
    // Position du centre de la cellule sans offset : y + totalHeight/2
    const cellCenterY = y;
    // Position du centre du logo dans la cellule : 25 + centralCellSize/2
    const logoCenterInCell = 25 + centralCellSize / 2;
    // Écart entre centre cellule et centre logo : logoCenterInCell - totalHeight/2
    const naturalOffset = logoCenterInCell - totalHeight / 2;
    
    
    // Le verticalOffset compense l'asymétrie de la grille (top 25px vs bottom 20px)
    // logoOffsetY sera appliqué séparément au logo lui-même (ligne 200)
    const totalVerticalOffset = verticalOffset;
    
    cell.style.left = x + 'px';
    cell.style.top = y + 'px';
    cell.style.transform = `translate(-50%, calc(-50% - ${totalVerticalOffset}px))`; // Centre le LOGO (pas la cellule) sur (x, y)
    
    if (nodeId === 'reemis' || nodeId === 'surface') {
    }
    
    // Cercle en arrière-plan (derrière le tableau)
    // Le centre de la case centrale [1,1] doit être au centre de la grille dynamique
    // Avec transform: translate(-50%, -50%) sur la grille, ce centre sera à (x, y)
    const circleBg = document.createElement('div');
    circleBg.className = 'flux-circle-bg';
    const circleSize = radius * 2;
    circleBg.style.width = circleSize + 'px';
    circleBg.style.height = circleSize + 'px';
    // Appliquer le même z-index que la cellule pour que le cercle soit au même niveau
    if (zIndex !== null && zIndex !== undefined) {
        circleBg.style.zIndex = zIndex;
    }
    // Positionner le cercle au centre de la grille
    // Centre horizontal : 100px (col gauche) + (centralCellSize / 2)
    // Centre vertical : 25px (top) + (centralCellSize / 2)
    const centerX = 100 + (centralCellSize / 2); // Centre exact de la colonne centrale
    const centerY = 25 + (centralCellSize / 2); // Centre exact de la case centrale
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
        // Ne pas mettre de bordure si strokeColor est vide
        if (!strokeColor || strokeColor.trim() === '') {
            circleBg.style.border = 'none';
        } else {
            circleBg.style.borderColor = strokeColor;
            circleBg.style.borderWidth = strokeSize + 'px';
            circleBg.style.borderStyle = 'solid';
        }
        // Wrapper le logo dans un span pour appliquer l'offset sans bouger le cercle
        const logoSpan = document.createElement('span');
        logoSpan.textContent = logo;
        logoSpan.style.display = 'inline-block';
        // Appliquer logoOffsetY au logo lui-même, scalé proportionnellement
        if (logoOffsetY !== 0) {
            const scaledLogoOffsetY = logoOffsetY * logoScale;
            logoSpan.style.transform = `translateY(${scaledLogoOffsetY}px)`;
        }
        circleBg.appendChild(logoSpan);
        // Taille du logo : si cercle visible, relatif au diamètre; sinon relatif au radius
        const logoFontSize = hasCircle ? (radius * 2 * logoScale) : (radius * logoScale);
        circleBg.style.fontSize = logoFontSize + 'px';
        
        // Gestionnaire de clic pour copier le logo dans le presse-papier
        circleBg.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(logo).then(() => {
                // Feedback visuel temporaire (agrandissement)
                const originalTransform = circleBg.style.transform;
                circleBg.style.transform = 'translate(-50%, -50%) scale(1.5)';
                setTimeout(() => {
                    circleBg.style.transform = originalTransform;
                }, 200);
            }).catch(err => {
            });
        });
        
        cell.appendChild(circleBg);
    }
    
    // Ajouter tooltip sur la cellule si présent
    if (tooltip) {
        cell.title = tooltip;
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
            gridItem.style.zIndex = 1000; // Étiquettes TOUJOURS au-dessus de tout (flèches max ~26)
            
            // [1,1] = Vide (le logo est dans le cercle en arrière-plan)
            // Les autres cases contiennent les étiquettes
            // [1,0] = Top (haut)
            if (col === 1 && row === 0 && top && top.length > 0) {
                const labelContainer = document.createElement('div');
                // Si 2 éléments, aligner en bas pour entourer le trait du cercle, sinon centrer
                labelContainer.className = 'flux-label-container ' + (top.length === 2 ? 'flux-label-container-bottom' : 'flux-label-container-center');
                
                top.forEach(text => {
                    const label = document.createElement('div');
                    label.className = 'flux-label';
                    label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
                    label.style.position = 'relative'; // Créer un stacking context
                    label.style.zIndex = '1001'; // Encore plus haut que le container
                    labelContainer.appendChild(label);
                });
                
                gridItem.appendChild(labelContainer);
            }
            // [1,2] = Bottom (bas)
            if (col === 1 && row === 2 && bottom && bottom.length > 0) {
                const labelContainer = document.createElement('div');
                // Si 2 éléments, aligner en haut pour entourer le trait du cercle, sinon centrer
                labelContainer.className = 'flux-label-container ' + (bottom.length === 2 ? 'flux-label-container-top' : 'flux-label-container-center');
                
                bottom.forEach(text => {
                    const label = document.createElement('div');
                    label.className = 'flux-label';
                    label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
                    label.style.position = 'relative'; // Créer un stacking context
                    label.style.zIndex = '1001'; // Encore plus haut que le container
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
                labelContainer.style.zIndex = '1000'; // TOUJOURS au-dessus des flèches
                
                left.forEach(text => {
                    const label = document.createElement('div');
                    label.className = 'flux-label';
                    label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
                    label.style.position = 'relative'; // Créer un stacking context
                    label.style.zIndex = '1001'; // Encore plus haut que le container
                    labelContainer.appendChild(label);
                });
                
                gridItem.appendChild(labelContainer);
            }
            // [2,1] = Right (droite)
            if (col === 2 && row === 1 && right && right.length > 0) {
                const labelContainer = document.createElement('div');
                labelContainer.style.display = 'flex';
                labelContainer.style.flexDirection = 'column';
                labelContainer.style.gap = '4px';
                labelContainer.style.alignItems = 'flex-start'; // À droite (col === 2)
                labelContainer.style.justifyContent = 'center'; // Centrer verticalement dans la ligne centrale
                labelContainer.style.position = 'relative'; // Créer un stacking context
                labelContainer.style.zIndex = '1000'; // TOUJOURS au-dessus des flèches
                
                right.forEach(text => {
                    const label = document.createElement('div');
                    label.className = 'flux-label';
                    label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
                    label.style.position = 'relative'; // Créer un stacking context
                    label.style.zIndex = '1001'; // Encore plus haut que le container
                    labelContainer.appendChild(label);
                });
                
                gridItem.appendChild(labelContainer);
            }
            // Les 4 coins sont vides (pas de contenu)
            
            cell.appendChild(gridItem);
        }
    }
    
    container.appendChild(cell);
    
    // Créer les cercles de rayonnement si demandé
    if (radiationOptions) {
        const { numCircles = 8, maxRadius, openingAngle = 270, rotation = 270, color = '#ff9800', strokeSize = 2 } = radiationOptions;
        // Vérifier que maxRadius est défini
        if (maxRadius !== null && maxRadius !== undefined) {
            // Log pour déboguer
            if (nodeId === 'albedo' || nodeId === 'surface') {
            }
            // Créer un groupe pour ces radiations avec la couleur définie
            const radiationGroup = document.createElement('div');
            radiationGroup.className = 'flux-radiation-group';
            radiationGroup.style.color = color; // Les .flux-sphere hériteront via currentColor
            // Hériter du z-index du nœud pour que les radiations soient au même niveau
            if (zIndex !== null && zIndex !== undefined) {
                radiationGroup.style.zIndex = zIndex;
            }
            
            const mainContainer = document.getElementById('flux-diagram');
            let container = mainContainer.querySelector('.flux-radiation-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'flux-radiation-container';
                mainContainer.appendChild(container);
            }
            container.appendChild(radiationGroup);
            
            for (let i = 1; i <= numCircles; i++) {
                const progress = i / numCircles;
                const arcRadius = radius + (maxRadius - radius) * progress;
                const arc = createArc(x, y, arcRadius, 0.3 + (progress * 0.2), openingAngle, rotation, radiationGroup);
                // Forcer la bordure complète en inline style pour garantir la couleur et l'épaisseur
                arc.style.border = `${strokeSize}px dashed ${color}`;
            }
        }
    }
    
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
            txt1: labels[1] || null,
            txt2: labels[2] || null,
            txt3: labels[3] || null,
            txt4: labels[4] || null
        };
    } else {
        labelObj = labels;
    }
    
    const createLabel = (text, posX, posY, isName = false, size = null) => {
        if (!text) return;
        const label = document.createElement('div');
        label.className = 'flux-label'; // Tous les textes des flèches
        label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
        label.style.position = 'absolute';
        label.style.left = posX + 'px';
        label.style.top = posY + 'px';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.zIndex = '1000'; // TOUJOURS au-dessus des flèches (z-index max ~26)
        // Si le texte contient <br>, permettre les retours à la ligne mais pas le wrapping automatique
        if (text.includes('<br>')) {
            label.style.whiteSpace = 'normal';
            label.style.width = 'max-content'; // Largeur selon le contenu, pas de wrapping
            label.style.maxWidth = 'none'; // Pas de limite de largeur
        }
        // Si size est 'bigger' ET que c'est le name (pas txt1), agrandir le texte 2 fois et retirer border/fond
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
    };
    
    // Récupérer la taille depuis labelObj.size
    const labelSize = labelObj.size || null;
    
    // txt1 : au début de la flèche (15% du chemin)
    if (labelObj.txt1) {
        const pos1X = x1 + (x2 - x1) * 0.15;
        const pos1Y = y1 + (y2 - y1) * 0.15;
        createLabel(labelObj.txt1, pos1X, pos1Y, false, labelSize);
    }
    
    // name : au milieu de la flèche (50%)
    if (labelObj.name) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        createLabel(labelObj.name, midX, midY, true, labelSize);
    }
    
    // txt2 : entre le milieu et la fin (75% du chemin)
    if (labelObj.txt2) {
        const pos2X = x1 + (x2 - x1) * 0.75;
        const pos2Y = y1 + (y2 - y1) * 0.75;
        createLabel(labelObj.txt2, pos2X, pos2Y, false, labelSize);
    }
    
    // txt3 (à gauche) et txt4 (à droite) - relatifs au milieu
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    if (labelObj.txt3) {
        createLabel(labelObj.txt3, midX - 60, midY, false);
    }
    if (labelObj.txt4) {
        createLabel(labelObj.txt4, midX + 60, midY, false);
    }
}

// Fonction pour créer une flèche avec des divs
function createArrow(x1, y1, x2, y2, zIndex = 1, color = '#667eea') {
    const container = document.getElementById('flux-diagram');
    const arrow = document.createElement('div');
    arrow.className = 'flux-arrow';
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    arrow.style.position = 'absolute';
    arrow.style.zIndex = zIndex; // Flèches en dessous des étiquettes (z-index 200)
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

// Fonction pour générer automatiquement les flèches à partir du graphe
function generateArrows() {
    arcs.forEach(arc => {
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
            // Si pas de strokeColor, partir du centre (pas de cercle visible)
            if (idDep.strokeColor && idDep.strokeColor.trim() !== '') {
                const sourceRadius = idDep.radius || radius;
                const sourceStrokeSize = idDep.strokeSize || 4;
                const sourceRadiusOuter = sourceRadius + (sourceStrokeSize / 2);
                x1 = idDep.x + sourceRadiusOuter * unitX;
                y1 = idDep.y + sourceRadiusOuter * unitY;
            } else {
                // Pas de cercle visible, partir du centre du logo
                x1 = idDep.x;
                y1 = idDep.y;
            }
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
        const destRadius = idDest.radius || radius;
        const destStrokeSize = idDest.strokeSize || 4;
        const destRadiusOuter = destRadius + (destStrokeSize / 2); // Radius jusqu'au bord extérieur de la bordure
        const destHasCircle = idDest.strokeColor && idDest.strokeColor.trim() !== '';
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
        const sourceRadius = idDep.radius || radius;
        const sourceStrokeSize = idDep.strokeSize || 4;
        const sourceHasCircle = idDep.strokeColor && idDep.strokeColor.trim() !== '';
        const sourceRadiusOuter = sourceHasCircle ? (sourceRadius + (sourceStrokeSize / 2)) : 0;
        
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
        
        // Les flèches sont toujours juste en dessous de la grid de départ (donc en dessous des étiquettes)
        const sourceZIndex = idDep.zIndex || 1;
        // Flèche juste en dessous de la grid de départ (sourceZIndex - 1)
        // Minimum 1 pour éviter z-index 0 ou négatif
        const arrowZIndex = Math.max(1, sourceZIndex - 1);
        // Couleur : arc.color > strokeColor du cercle de départ > bleu standard
        const arrowColor = arc.color || (idDep.strokeColor && idDep.strokeColor.trim() !== '' ? idDep.strokeColor : '#667eea');
        
        
        const arrow = createArrow(finalX1, finalY1, finalX2, finalY2, arrowZIndex, arrowColor);
        
        
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
                else if (arrowUnitX > 0.5 && hasRightLabels) {
                    hiddenDistance = labelWidth;
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
            createArrowLabel(visibleX1, visibleY1, visibleX2, visibleY2, arc.label);
        }
    });
}

// Initialisation du diagramme
// Calculer les positions
calculatePositions();

// Créer les cellules
const createdCells = {};
nodes.forEach(node => {
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
    
    createdCells[node.id] = createCell(
        node.x, 
        node.y, 
        node.radius, 
        node.fillColor, 
        node.strokeColor, 
        node.logo, 
        node.left || [],
        node.right || [],
        Array.isArray(node.top) ? node.top : (node.top ? [node.top] : []),
        Array.isArray(node.bottom) ? node.bottom : (node.bottom ? [node.bottom] : []),
        node.tooltip || null,
        radiationOptions,
        node.rectangle || null,
        node.fillImage || null,
        node.id, // Passer l'ID du noeud pour créer l'ID de la cellule
        node.zIndex || null, // Passer le z-index personnalisé
        node.logoScale || 1.4, // Passer le scale du logo (défaut 1.4)
        node.logoOffsetY || 0, // Passer l'offset vertical du logo (défaut 0)
        node.strokeSize || 4 // Passer l'épaisseur de la bordure (défaut 4px)
    );
});

// Générer automatiquement les flèches
generateArrows();

/**
 * Calcule la position pour un texte justifié à gauche, aligné sur le bord gauche du cercle albedo
 * @param {string} nodeId - ID du nœud (par défaut 'albedo')
 * @param {number} offsetX - Décalage horizontal supplémentaire (par défaut 0)
 * @param {number} offsetY - Décalage vertical (par défaut 0, aligné sur le centre)
 * @returns {Object} {x, y} - Coordonnées pour positionner le texte
 */
function calculateTextPositionLeftOfCircle(nodeId = 'albedo', offsetX = 0, offsetY = 0) {
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
 * @param {string} nodeId - ID du nœud (par défaut 'albedo')
 * @param {number} angleDeg - Angle en degrés (0° = droite, 90° = bas, sens anti-horaire)
 * @param {number} offsetRadius - Décalage supplémentaire depuis le bord du cercle (par défaut 0)
 * @returns {Object} {x, y} - Coordonnées pour positionner le bouton (centre du bouton)
 */
function poseBoutonSurCercle(nodeId = 'albedo', angleDeg = 0, offsetRadius = 0) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
        return { x: 0, y: 0 };
    }
    
    const radius = node.radius || 40;
    const strokeSize = node.strokeSize || 4;
    const radiusOuter = radius + (strokeSize / 2); // Rayon jusqu'au bord extérieur
    const totalRadius = radiusOuter + offsetRadius; // Rayon total avec décalage
    
    // Convertir l'angle en radians
    const angleRad = (angleDeg * Math.PI) / 180;
    
    // Calculer la position sur le cercle
    // 0° = droite (cos=1, sin=0)
    // 90° = bas (cos=0, sin=1)
    const x = node.x + totalRadius * Math.cos(angleRad);
    const y = node.y + totalRadius * Math.sin(angleRad);
    
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
        bouton.style.zIndex = '1000';
        
        // Déplacer le bouton dans le flux-diagram si nécessaire
        if (bouton.parentElement !== fluxDiagram) {
            fluxDiagram.appendChild(bouton);
        }
    });
}

// Appeler la fonction après la génération du diagramme
if (typeof window !== 'undefined') {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(positionnerBoutonsSurCercleAlbedo, 100);
        });
    } else {
        setTimeout(positionnerBoutonsSurCercleAlbedo, 100);
    }
}

