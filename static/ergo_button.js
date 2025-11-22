/* File: ergo_button.js - Système de boutons ergonomiques réutilisables
 * Desc: Logique JavaScript pour des boutons circulaires avec états checked/selected/unselected
 * Version 1.0.0
 * Copyright 2025 DNAvatar.org - Arnaud Maignan
 * Licensed under Apache License 2.0 with Commons Clause.
 * See LICENSE_HEADER.txt for full terms.
 * Date: [June 08, 2025] [HH:MM UTC+1]
 * Logs:
 *   - Initial version: extraction du système de boutons du diagramme de flux
 */

/**
 * Initialise les boutons ergonomiques
 * @param {Object} options - Options de configuration
 * @param {string} options.cellSelector - Sélecteur CSS pour les cellules de boutons (défaut: '.ergo-button-cell')
 * @param {string} options.circleSelector - Sélecteur CSS pour les cercles cliquables (défaut: '.ergo-button-circle')
 * @param {Function} options.onToggle - Callback appelé lors du toggle (checked, cell, event)
 * @param {Function} options.onInit - Callback appelé lors de l'initialisation (cell, isChecked)
 * @param {boolean} options.checkedByDefault - Si true, les boutons sont checked par défaut (défaut: false)
 */
function initErgoButtons(options = {}) {
    const {
        cellSelector = '.ergo-button-cell',
        circleSelector = '.ergo-button-circle',
        onToggle = null,
        onInit = null,
        checkedByDefault = false
    } = options;

    const cells = document.querySelectorAll(cellSelector);

    cells.forEach(cell => {
        const circle = cell.querySelector(circleSelector);
        
        if (!circle) {
            console.warn('[ergo_button] Cercle introuvable dans la cellule:', cell);
            return;
        }

        // Initialiser l'état checked si nécessaire
        if (checkedByDefault && !cell.classList.contains('checked')) {
            cell.classList.add('checked');
        }

        // Initialiser l'état selected/unselected selon l'état checked
        const isChecked = cell.classList.contains('checked');
        if (isChecked) {
            cell.classList.add('selected');
            cell.classList.remove('unselected');
        } else {
            cell.classList.remove('selected');
            cell.classList.add('unselected');
        }

        // Appeler le callback d'initialisation
        if (typeof onInit === 'function') {
            onInit(cell, isChecked);
        }

        // Ajouter le gestionnaire de clic
        circle.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Toggle la classe checked
            const wasChecked = cell.classList.contains('checked');
            if (wasChecked) {
                cell.classList.remove('checked');
                cell.classList.remove('selected');
                cell.classList.add('unselected');
            } else {
                cell.classList.add('checked');
                cell.classList.add('selected');
                cell.classList.remove('unselected');
            }

            const isNowChecked = !wasChecked;

            // Appeler le callback de toggle
            if (typeof onToggle === 'function') {
                onToggle(isNowChecked, cell, e);
            }
        });
    });
}

/**
 * Récupère l'état checked d'un bouton
 * @param {HTMLElement} cell - La cellule du bouton
 * @returns {boolean} True si le bouton est checked
 */
function isErgoButtonChecked(cell) {
    return cell && cell.classList.contains('checked');
}

/**
 * Définit l'état checked d'un bouton
 * @param {HTMLElement} cell - La cellule du bouton
 * @param {boolean} checked - True pour checked, false pour unchecked
 */
function setErgoButtonChecked(cell, checked) {
    if (!cell) return;
    
    if (checked) {
        cell.classList.add('checked');
        cell.classList.add('selected');
        cell.classList.remove('unselected');
    } else {
        cell.classList.remove('checked');
        cell.classList.remove('selected');
        cell.classList.add('unselected');
    }
}

/**
 * Toggle l'état checked d'un bouton
 * @param {HTMLElement} cell - La cellule du bouton
 * @returns {boolean} Le nouvel état checked
 */
function toggleErgoButton(cell) {
    if (!cell) return false;
    
    const isChecked = cell.classList.contains('checked');
    setErgoButtonChecked(cell, !isChecked);
    return !isChecked;
}

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
    window.initErgoButtons = initErgoButtons;
    window.isErgoButtonChecked = isErgoButtonChecked;
    window.setErgoButtonChecked = setErgoButtonChecked;
    window.toggleErgoButton = toggleErgoButton;
}

