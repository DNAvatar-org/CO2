// File: tooltips.js - Système centralisé de tooltips
// Desc: Gestion unifiée des tooltips avec délai de 0.5s et styles cohérents
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version: centralisation des tooltips avec délai 0.5s et bords 90°

(function() {
    'use strict';

    // ============================================================================
    // CONFIGURATION
    // ============================================================================
    const TOOLTIP_DELAY = 500; // 0.5 secondes (500ms)
    const TOOLTIP_FADE_OUT = 200; // Durée du fade-out en ms

    // ============================================================================
    // STYLES CSS (injectés dynamiquement)
    // ============================================================================
    const TOOLTIP_STYLES = `
        .flux-custom-tooltip {
            position: fixed;
            background: rgba(10, 14, 39, 0.95);
            color: #fff;
            padding-left: 5px;
            padding-right: 5px;
            border-radius: 0px !important; /* Bords 90° non arrondis */
            font-size: 12px;
            font-family: 'Tahoma', 'Roboto', 'Verdana', sans-serif;
            font-weight: normal;
            pointer-events: none;
            z-index: 99999 !important;
            white-space: normal;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 250px;
            text-align: left;
            line-height: 1.5;
            word-wrap: break-word;
        }
    `;

    // Injecter les styles dans le document
    function injectStyles() {
        if (document.getElementById('tooltips-styles')) return; // Déjà injecté

        const styleSheet = document.createElement('style');
        styleSheet.id = 'tooltips-styles';
        styleSheet.textContent = TOOLTIP_STYLES;
        document.head.appendChild(styleSheet);
    }

    // ============================================================================
    // FONCTION PRINCIPALE : Ajouter un tooltip à un élément
    // ============================================================================
    /**
     * Ajoute un tooltip personnalisé à un élément
     * @param {HTMLElement} element - L'élément auquel ajouter le tooltip
     * @param {string} text - Le texte du tooltip (peut contenir du HTML)
     */
    function addTooltip(element, text) {
        if (!element || !text || text.trim() === '') return; // Ne pas créer de tooltip si le texte est vide

        // Injecter les styles si nécessaire
        injectStyles();

        let tooltipTimeout = null;
        let tooltipElement = null;
        let lastMouseEvent = null; // Stocker le dernier événement de souris

        // Créer l'élément tooltip
        const createTooltip = () => {
            if (tooltipElement) return; // Déjà créé

            tooltipElement = document.createElement('div');
            tooltipElement.className = 'flux-custom-tooltip';
            tooltipElement.innerHTML = text; // Utiliser innerHTML pour supporter les balises HTML comme <br>
            document.body.appendChild(tooltipElement);
        };

        // Fonction pour positionner le tooltip à partir d'un événement de souris
        const positionTooltip = (e) => {
            if (!tooltipElement) return;

            // Utiliser la position actuelle de la souris (depuis l'événement ou depuis l'élément)
            let mouseX, mouseY;
            if (e && e.clientX !== undefined && e.clientY !== undefined) {
                // Utiliser la position de l'événement
                mouseX = e.clientX;
                mouseY = e.clientY;
            } else {
                // Fallback : utiliser le centre de l'élément
                const rect = element.getBoundingClientRect();
                mouseX = rect.left + rect.width / 2;
                mouseY = rect.top;
            }

            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;

            // Offset pour éviter que le tooltip soit sous la souris (15px à droite et 15px au-dessus)
            const offsetX = 15;
            const offsetY = -15;

            // Position horizontale : à droite de la souris
            tooltipElement.style.left = (mouseX + offsetX + scrollX) + 'px';

            // Vérifier si le tooltip dépasserait en haut de l'écran
            const estimatedTooltipHeight = 50;
            const wouldOverflowTop = (mouseY + offsetY) < estimatedTooltipHeight + 20;

            if (wouldOverflowTop) {
                // Positionner en bas de la souris
                tooltipElement.style.top = (mouseY - offsetY + scrollY) + 'px';
                tooltipElement.style.transform = 'translate(0, 0)';
            } else {
                // Positionner au-dessus de la souris (comportement par défaut)
                tooltipElement.style.top = (mouseY + offsetY + scrollY) + 'px';
                tooltipElement.style.transform = 'translate(0, -100%)';
            }
        };

        // Afficher le tooltip
        const showTooltip = (e) => {
            // Stocker le dernier événement de souris
            if (e) {
                lastMouseEvent = e;
            }

            // Annuler le timeout précédent si présent
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }

            // Délai de 0.5s avant d'afficher (dès le premier rollover)
            tooltipTimeout = setTimeout(() => {
                if (!tooltipElement) {
                    createTooltip();
                }

                // 🔒 Utiliser la position actuelle de la souris (dernier événement stocké ou position actuelle)
                // Si on a un dernier événement, l'utiliser, sinon créer un événement simulé avec la position actuelle
                let positionEvent = lastMouseEvent;
                
                // Si pas d'événement stocké, essayer de récupérer la position actuelle depuis l'élément
                if (!positionEvent) {
                    const rect = element.getBoundingClientRect();
                    positionEvent = {
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2
                    };
                }

                // Positionner le tooltip avec la position actuelle
                positionTooltip(positionEvent);

                tooltipElement.style.opacity = '1';
                tooltipElement.style.visibility = 'visible';
            }, TOOLTIP_DELAY); // 0.5 secondes
        };

        // Cacher le tooltip
        const hideTooltip = () => {
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
            if (tooltipElement) {
                tooltipElement.style.opacity = '0';
                tooltipElement.style.visibility = 'hidden';
            }
        };

        // Supprimer le tooltip du DOM
        const removeTooltip = () => {
            if (tooltipElement && tooltipElement.parentNode) {
                tooltipElement.parentNode.removeChild(tooltipElement);
                tooltipElement = null;
            }
        };

        // Ajouter les événements
        element.addEventListener('mouseenter', (e) => {
            lastMouseEvent = e; // Stocker la position initiale
            showTooltip(e);
        });
        element.addEventListener('mouseleave', () => {
            hideTooltip();
            lastMouseEvent = null; // Réinitialiser
            // Supprimer après l'animation de fade-out
            setTimeout(removeTooltip, TOOLTIP_FADE_OUT);
        });
        element.addEventListener('mousemove', (e) => {
            // Toujours mettre à jour la dernière position de la souris
            lastMouseEvent = e;
            
            // Si le tooltip est déjà visible, mettre à jour sa position immédiatement
            if (tooltipElement && tooltipElement.style.visibility === 'visible') {
                positionTooltip(e);
            }
        });
    }

    // ============================================================================
    // FONCTION UTILITAIRE : Ajouter un tooltip depuis un attribut alt ou title
    // ============================================================================
    /**
     * Ajoute un tooltip à un élément en utilisant son attribut alt ou title
     * @param {HTMLElement} element - L'élément auquel ajouter le tooltip
     */
    function addTooltipFromAttribute(element) {
        if (!element) return;
        // Priorité : alt > title > data-tooltip
        const text = element.getAttribute('alt') || 
                     element.getAttribute('title') || 
                     element.getAttribute('data-tooltip');
        if (text && text.trim() !== '') {
            // Retirer l'attribut title pour éviter le tooltip natif (garder alt pour accessibilité)
            if (element.hasAttribute('title')) {
                element.removeAttribute('title');
            }
            addTooltip(element, text);
        }
    }

    // ============================================================================
    // FONCTION AUTOMATIQUE : Scanner et ajouter des tooltips à tous les éléments
    // ============================================================================
    /**
     * Scanne le document et ajoute automatiquement des tooltips aux éléments avec alt/title
     * @param {HTMLElement|Document} root - Élément racine à scanner (par défaut: document)
     */
    function autoInitTooltips(root = document) {
        // Scanner tous les éléments avec alt, title ou data-tooltip
        const elements = root.querySelectorAll('[alt], [title], [data-tooltip]');
        elements.forEach(element => {
            // Ne pas traiter les éléments qui ont déjà un tooltip
            if (!element.hasAttribute('data-tooltip-initialized')) {
                addTooltipFromAttribute(element);
                element.setAttribute('data-tooltip-initialized', 'true');
            }
        });
    }

    // ============================================================================
    // EXPOSITION GLOBALE
    // ============================================================================
    if (typeof window !== 'undefined') {
        window.addTooltip = addTooltip;
        window.addTooltipFromAttribute = addTooltipFromAttribute;
        window.autoInitTooltips = autoInitTooltips;
        window.hideTooltip = hideTooltip; // Exposer pour masquage manuel (ex: au clic si l'élément disparaît)
    }

    // ============================================================================
    // INITIALISATION AUTOMATIQUE
    // ============================================================================
    // Injecter les styles dès le chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectStyles();
            // Scanner automatiquement les tooltips après le chargement
            autoInitTooltips();
        });
    } else {
        injectStyles();
        // Scanner automatiquement les tooltips si le DOM est déjà chargé
        autoInitTooltips();
    }

    // Observer les mutations du DOM pour ajouter automatiquement des tooltips aux nouveaux éléments
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Scanner les nouveaux éléments et leurs enfants
                        // 🔒 Vérifier si le tooltip est déjà initialisé pour éviter les doublons
                        if (!node.hasAttribute('data-tooltip-initialized') && 
                            node.hasAttribute && 
                            (node.hasAttribute('alt') || node.hasAttribute('title') || node.hasAttribute('data-tooltip'))) {
                            addTooltipFromAttribute(node);
                            node.setAttribute('data-tooltip-initialized', 'true');
                        }
                        // Scanner aussi les enfants
                        if (node.querySelectorAll) {
                            const children = node.querySelectorAll('[alt], [title], [data-tooltip]');
                            children.forEach(child => {
                                if (!child.hasAttribute('data-tooltip-initialized')) {
                                    addTooltipFromAttribute(child);
                                    child.setAttribute('data-tooltip-initialized', 'true');
                                }
                            });
                        }
                    }
                });
            });
        });

        // Observer les changements dans le document
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }
    }

})();

