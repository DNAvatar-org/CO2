// File: organigramme.js - Génération automatique du diagramme de flux énergétique
// Desc: Module JavaScript pour créer automatiquement un diagramme de flux énergétique à partir d'un graphe (nœuds et arcs)
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: extraction du code de génération du diagramme depuis demo_flux_energetique_01.html

// Fonction pour créer un rectangle avec des facteurs
function createRectangle(cell, width, height, factors, fillColor, strokeColor, fillImage = null) {
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
        rect.style.borderWidth = '4px';
        rect.style.borderStyle = 'solid';
    } else {
        rect.style.border = 'none';
    }
    rect.style.position = 'absolute';
    rect.style.zIndex = 1; // Même z-index que le cercle
    
    factors.forEach(factor => {
        const factorDiv = document.createElement('div');
        factorDiv.className = 'flux-rectangle-factor';
        factorDiv.innerHTML = `<span>${factor.icon}</span><span>${factor.label}</span>`;
        factorDiv.style.position = 'relative';
        factorDiv.style.zIndex = '1'; // Au-dessus du logo
        rect.appendChild(factorDiv);
    });
    
    cell.appendChild(rect);
    return rect;
}

// Fonction pour créer une cellule avec un tableau 3x3
function createCell(x, y, radius, fillColor, strokeColor, logo, left = [], right = [], top = null, bottom = null, tooltip = null, radiationOptions = null, rectangleOptions = null, fillImage = null) {
    const container = document.getElementById('flux-diagram');
    
    // Cellule principale avec grille 3x3
    // Le cercle est en arrière-plan, la grille par-dessus pour que les textes se superposent
    const cell = document.createElement('div');
    // Utiliser flux-cellRect si rectangle présent pour avoir une hauteur plus grande
    cell.className = rectangleOptions ? 'flux-cellRect' : 'flux-cell';
    // Positionner le coin supérieur gauche de la grille, puis utiliser transform pour centrer précisément
    cell.style.left = x + 'px';
    cell.style.top = y + 'px';
    cell.style.transform = 'translate(-50%, -50%)'; // Centre la grille sur (x, y), donc le centre de [1,1] est à (x, y)
    
    // Cercle en arrière-plan (derrière le tableau)
    // Le centre de la case centrale [1,1] est à (130px, 55px) dans la grille
    // Avec transform: translate(-50%, -50%) sur la grille, ce centre sera à (x, y)
    const circleBg = document.createElement('div');
    circleBg.className = 'flux-circle-bg';
    const circleSize = radius * 2;
    circleBg.style.width = circleSize + 'px';
    circleBg.style.height = circleSize + 'px';
    // Positionner le cercle au centre de la grille
    // Centre horizontal : 130px (centre de la colonne centrale)
    // Centre vertical : 55px (centre de la cellule = 110px / 2)
    circleBg.style.left = '130px'; // Centre de la colonne centrale
    circleBg.style.top = '55px'; // Centre de la cellule (110px / 2)
    circleBg.style.transform = 'translate(-50%, -50%)'; // Centre le cercle sur (130, 55)
    // Ne pas créer le cercle si un rectangle est présent
    if (!rectangleOptions) {
        circleBg.style.backgroundColor = fillColor;
        // Ne pas mettre de bordure si strokeColor est vide
        if (!strokeColor || strokeColor.trim() === '') {
            circleBg.style.border = 'none';
        } else {
            circleBg.style.borderColor = strokeColor;
            circleBg.style.borderWidth = '4px';
            circleBg.style.borderStyle = 'solid';
        }
        circleBg.textContent = logo;
        
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
                console.error('Erreur lors de la copie:', err);
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
            gridItem.style.zIndex = 2; // Au-dessus du cercle
            
            // [1,1] = Vide (le logo est dans le cercle en arrière-plan)
            // Les autres cases contiennent les étiquettes
            // [1,0] = Top (haut)
            if (col === 1 && row === 0 && top) {
                const label = document.createElement('div');
                label.className = 'flux-label flux-label-blue';
                label.innerHTML = top; // Utiliser innerHTML pour interpréter les balises <br>
                gridItem.appendChild(label);
            }
            // [1,2] = Bottom (bas)
            if (col === 1 && row === 2 && bottom) {
                const label = document.createElement('div');
                label.className = 'flux-label flux-label-blue';
                label.innerHTML = bottom; // Utiliser innerHTML pour interpréter les balises <br>
                gridItem.appendChild(label);
            }
            // [0,1] = Left (gauche)
            if (col === 0 && row === 1 && left && left.length > 0) {
                const labelContainer = document.createElement('div');
                labelContainer.style.display = 'flex';
                labelContainer.style.flexDirection = 'column';
                labelContainer.style.gap = '4px';
                labelContainer.style.alignItems = 'flex-end'; // À gauche (col === 0)
                labelContainer.style.justifyContent = 'center'; // Centrer verticalement dans la ligne centrale
                
                left.forEach(text => {
                    const label = document.createElement('div');
                    label.className = 'flux-label flux-label-blue';
                    label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
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
                
                right.forEach(text => {
                    const label = document.createElement('div');
                    label.className = 'flux-label flux-label-blue';
                    label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
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
        const { numCircles = 8, maxRadius, openingAngle = 270, rotation = 270 } = radiationOptions;
        // Vérifier que maxRadius est défini
        if (maxRadius !== null && maxRadius !== undefined) {
            for (let i = 1; i <= numCircles; i++) {
                const progress = i / numCircles;
                const arcRadius = radius + (maxRadius - radius) * progress;
                createArc(x, y, arcRadius, 0.3 + (progress * 0.2), openingAngle, rotation);
            }
        }
    }
    
    // Créer le rectangle avec les facteurs si demandé
    if (rectangleOptions) {
        const { width, height, factors } = rectangleOptions;
        // Utiliser fillImage depuis le nœud racine (passé en paramètre)
        createRectangle(cell, width, height, factors, fillColor, strokeColor, fillImage);
    }
    
    return cell;
}

// Fonction pour créer une étiquette de flèche avec des divs
function createArrowLabel(x, y, labels) {
    const container = document.getElementById('flux-diagram');
    const labelContainer = document.createElement('div');
    labelContainer.style.position = 'absolute';
    labelContainer.style.left = x + 'px';
    labelContainer.style.top = y + 'px';
    labelContainer.style.zIndex = '200'; // Au-dessus de tout
    
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
    
    const createLabel = (text, offsetX, offsetY, isName = false, size = null) => {
        if (!text) return;
        const label = document.createElement('div');
        label.className = 'flux-label flux-label-blue'; // Tous les textes des flèches en bleu
        label.innerHTML = text; // Utiliser innerHTML pour interpréter les balises <br>
        label.style.position = 'absolute';
        label.style.left = offsetX + 'px';
        label.style.top = offsetY + 'px';
        label.style.transform = 'translate(-50%, -50%)';
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
        labelContainer.appendChild(label);
    };
    
    // Récupérer la taille depuis labelObj.size
    const labelSize = labelObj.size || null;
    
    // txt2 (au-dessus)
    if (labelObj.txt2) {
        createLabel(labelObj.txt2, 0, -25, false, labelSize);
    }
    
    // Nom (au centre)
    if (labelObj.name) {
        createLabel(labelObj.name, 0, 0, true, labelSize);
    }
    
    // txt1 (en dessous par défaut, ou au-dessus si relatif: 'top')
    if (labelObj.txt1) {
        const txt1OffsetY = labelObj.relatif === 'top' ? -25 : 25;
        createLabel(labelObj.txt1, 0, txt1OffsetY, false, labelSize);
    }
    
    // txt3 (à gauche) et txt4 (à droite)
    if (labelObj.txt3) {
        createLabel(labelObj.txt3, -60, 0, false);
    }
    if (labelObj.txt4) {
        createLabel(labelObj.txt4, 60, 0, false);
    }
    
    container.appendChild(labelContainer);
    
    // Calculer le centre visuel en fonction des labels présents
    // Les labels sont centrés avec transform: translate(-50%, -50%)
    // Leur centre est donc exactement à leur position offsetY
    let centerY = 0;
    let count = 0;
    
    if (labelObj.txt2) { centerY += -25; count++; }
    if (labelObj.name) { 
        centerY += 0; // Le centre du label name est toujours à offsetY = 0
        count++; 
    }
    if (labelObj.txt1) {
        const txt1OffsetY = labelObj.relatif === 'top' ? -25 : 25;
        centerY += txt1OffsetY;
        count++;
    }
    
    // Centre visuel moyen (simple moyenne des positions)
    const centerOffsetY = count > 0 ? centerY / count : 0;
    
    // Positionner le labelContainer pour que son centre visuel soit à (x, y)
    labelContainer.style.left = x + 'px';
    labelContainer.style.top = (y + centerOffsetY) + 'px';
    labelContainer.style.transform = 'translate(-50%, -50%)';
    
    return labelContainer;
}

// Fonction pour créer une flèche avec des divs
function createArrow(x1, y1, x2, y2) {
    const container = document.getElementById('flux-diagram');
    const arrow = document.createElement('div');
    arrow.className = 'flux-arrow';
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    arrow.style.position = 'absolute';
    arrow.style.left = x1 + 'px';
    arrow.style.top = y1 + 'px';
    arrow.style.width = length + 'px';
    arrow.style.height = '3px';
    arrow.style.transformOrigin = '0 50%';
    arrow.style.transform = `rotate(${angle}deg)`;
    
    // Pointe de flèche à la fin de la flèche (point d'arrivée)
    const arrowhead = document.createElement('div');
    arrowhead.style.position = 'absolute';
    arrowhead.style.right = '-8px';
    arrowhead.style.top = '50%';
    arrowhead.style.transform = 'translateY(-50%)';
    arrowhead.style.width = '0';
    arrowhead.style.height = '0';
    // La pointe pointe vers la droite par défaut, elle sera tournée avec la flèche
    arrowhead.style.borderLeft = '8px solid #667eea';
    arrowhead.style.borderTop = '5px solid transparent';
    arrowhead.style.borderBottom = '5px solid transparent';
    arrow.appendChild(arrowhead);
    
    container.appendChild(arrow);
    return arrow;
}

// Fonction pour créer une sphère concentrique
function createSphere(cx, cy, r, opacity) {
    const container = document.getElementById('flux-diagram');
    const sphere = document.createElement('div');
    sphere.className = 'flux-sphere';
    sphere.style.left = (cx - r) + 'px';
    sphere.style.top = (cy - r) + 'px';
    sphere.style.width = (r * 2) + 'px';
    sphere.style.height = (r * 2) + 'px';
    sphere.style.opacity = opacity;
    container.appendChild(sphere);
    return sphere;
}

// Fonction pour créer un arc de cercle (comme createSphere mais avec ouverture)
function createArc(cx, cy, r, opacity, openingAngle = 0, rotation = 270) {
    const container = document.getElementById('flux-diagram');
    const arc = document.createElement('div');
    arc.className = 'flux-sphere'; // Utilise la même classe que createSphere
    
    // Positionner comme createSphere
    arc.style.left = (cx - r) + 'px';
    arc.style.top = (cy - r) + 'px';
    arc.style.width = (r * 2) + 'px';
    arc.style.height = (r * 2) + 'px';
    arc.style.border = '2px dashed #ff9800'; // Style directement dans le HTML
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
    
    // Séparer les arcs normaux et les arcs avec arriveAtBottom
    const normalArcs = arcs.filter(arc => !arc.arriveAtBottom);
    const bottomArcs = arcs.filter(arc => arc.arriveAtBottom);
    
    // Fonction récursive pour calculer les positions (sans les cycles bottomArcs)
    function calculateY(nodeId, visited = new Set(), ignoreBottomArcs = true) {
        if (visited.has(nodeId)) {
            return nodeMap[nodeId].y || 50;
        }
        visited.add(nodeId);
        
        const node = nodeMap[nodeId];
        if (node.y !== null && ignoreBottomArcs) return node.y;
        
        // Trouver tous les arcs entrants normaux
        const incomingArcs = (ignoreBottomArcs ? normalArcs : arcs).filter(arc => arc.to === nodeId);
        let maxY = node.y || 50;
        
        if (incomingArcs.length > 0) {
            incomingArcs.forEach(arc => {
                const sourceY = calculateY(arc.from, new Set(visited), ignoreBottomArcs);
                const arcSpacing = arc.label ? spacingSizes.medium : spacingSizes.short;
                // Bas de la source + espacement + haut de destination = centre destination
                const newY = sourceY + cellHalfHeight + arcSpacing + cellHalfHeight;
                if (newY > maxY) maxY = newY;
            });
        }
        
        if (ignoreBottomArcs || node.y === null) {
            node.y = maxY;
        }
        return maxY;
    }
    
    // Calculer toutes les positions normales d'abord
    nodes.forEach(node => {
        if (node.y === null) {
            calculateY(node.id, new Set(), true);
        }
    });
    
    // Ensuite, traiter les arcs avec arriveAtBottom (positionner la source en dessous de la destination)
    bottomArcs.forEach(arc => {
        const destNode = nodeMap[arc.to];
        const sourceNode = nodeMap[arc.from];
        if (destNode && sourceNode && destNode.y !== null) {
            const arcSpacing = arc.label ? spacingSizes.medium : spacingSizes.short;
            // Source doit être en dessous de destination : bas de destination + espacement + haut de source = centre source
            const newSourceY = destNode.y + cellHalfHeight + arcSpacing + cellHalfHeight;
            if (sourceNode.y === null || newSourceY > sourceNode.y) {
                sourceNode.y = newSourceY;
            }
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
        
        // Angle en radians puis en degrés
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
            // Cercle : point sur le bord selon l'angle
            x1 = idDep.x + radius * Math.cos(angleRad);
            y1 = idDep.y + radius * Math.sin(angleRad);
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
        const hasTop = idDest.top && idDest.top.trim() !== '';
        const hasBottom = idDest.bottom && idDest.bottom.trim() !== '';
        
        
        if (isGoingUp && isVerticalEnough) {
            // Flèche vers le haut (assez verticale)
            if (hasBottom) {
                // Arriver au bas de la grille (où se trouve txt1)
                const gridY = idDest.y + cellHalfHeight;
                // Calculer l'intersection depuis (x1, y1) vers le centre, avec y = gridY
                if (Math.abs(Vect.y) > 0.001) {
                    const t = (gridY - y1) / Vect.y;
                    x2 = x1 + Vect.x * t;
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
                    // Cercle : intersection avec le bord bas
                    const bottomY = idDest.y + radius;
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
        } else if (isGoingDown && isVerticalEnough) {
            // Flèche vers le bas (assez verticale)
            if (hasTop) {
                // Arriver au haut de la grille (où se trouve top)
                const gridY = idDest.y - cellHalfHeight;
                // Calculer l'intersection depuis (x1, y1) vers le centre, avec y = gridY
                if (Math.abs(Vect.y) > 0.001) {
                    const t = (gridY - y1) / Vect.y;
                    x2 = x1 + Vect.x * t;
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
                    // Cercle : intersection avec le bord selon l'angle inverse
                    const reverseAngle = angleRad + Math.PI;
                    x2 = idDest.x + radius * Math.cos(reverseAngle);
                    y2 = idDest.y + radius * Math.sin(reverseAngle);
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
                    // Fallback
                    const reverseAngle = angleRad + Math.PI;
                    x2 = idDest.x + halfWidth * Math.cos(reverseAngle);
                    y2 = idDest.y + halfHeight * Math.sin(reverseAngle);
                }
            } else {
                // Flèche horizontale ou autre : arriver au bord du cercle
                const isHorizontal = absAngle < 45 || absAngle > 135;
                if (isHorizontal && !idDest.rectangle) {
                    // Arriver au bord du cercle pour les flèches horizontales
                    // Calculer l'intersection avec le bord selon l'angle inverse
                    const reverseAngle = angleRad + Math.PI;
                    x2 = idDest.x + radius * Math.cos(reverseAngle);
                    y2 = idDest.y + radius * Math.sin(reverseAngle);
                } else {
                    // Cercle : intersection avec le bord selon l'angle inverse
                    const reverseAngle = angleRad + Math.PI;
                    x2 = idDest.x + radius * Math.cos(reverseAngle);
                    y2 = idDest.y + radius * Math.sin(reverseAngle);
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
        const unitX = realLength > 0.001 ? realDx / realLength : 0;
        const unitY = realLength > 0.001 ? realDy / realLength : 0;
        
        // Déplacer les points le long de la direction par la marge
        // Pour raccourcir la flèche, on doit déplacer le point d'arrivée dans la direction opposée au vecteur
        // Utiliser une marge fixe en pixels au lieu d'un pourcentage de la longueur
        // Cela garantit que les flèches ne touchent jamais le cercle, même pour des flèches longues
        // Pour les rectangles, utiliser une marge plus grande car ils sont plus grands
        const marginPixels = idDest.rectangle ? 20 : 8; // Marge plus grande pour les rectangles
        const marginEnd = arrivesAtCenter ? 0 : marginPixels;
        const finalX1 = x1 + unitX * 0;
        const finalY1 = y1 + unitY * 0;
        // Pour reculer depuis le bord du cercle, on doit aller dans la direction opposée au vecteur
        // Donc on soustrait la marge : x2 - unitX * marginEnd (car unitX pointe vers le cercle)
        const finalX2 = x2 - unitX * marginEnd;
        const finalY2 = y2 - unitY * marginEnd;
        
        
        const arrow = createArrow(finalX1, finalY1, finalX2, finalY2);
        
        
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
            const hasTopLabel = idDep.top && idDep.top.trim() !== '';
            const hasBottomLabel = idDep.bottom && idDep.bottom.trim() !== '';
            
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
            
            // Calculer le milieu de la partie visible
            const midX = (visibleX1 + visibleX2) / 2;
            const midY = (visibleY1 + visibleY2) / 2;
            createArrowLabel(midX, midY, arc.label);
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
        node.top || null,
        node.bottom || null,
        node.tooltip || null,
        radiationOptions,
        node.rectangle || null,
        node.fillImage || null
    );
});

// Générer automatiquement les flèches
generateArrows();

