// File: tooltips.js - Système centralisé de tooltips
// Desc: Gestion unifiée des tooltips (délai 0 = immédiat)
// Version 1.0.2
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
// - TOOLTIP_DELAY=0 (immédiat), texte dynamique via data-tooltip/title au show
// - aria-label/alt affiché après 2s dans élément séparé (style fond clair, vrai alt)

(function() {
    'use strict';

    // ============================================================================
    // CONFIGURATION
    // ============================================================================
    const TOOLTIP_DELAY = 0; // Immédiat (tooltip court)
    const TOOLTIP_ALT_DELAY = 2000; // Délai avant d'afficher le détail (aria-label/alt) en ms
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
        /* Alt = détail (aria-label), style type tooltip natif du navigateur */
        .flux-custom-tooltip-alt {
            background: #f5f5dc !important;
            color: #1a1a1a !important;
            border: 1px solid #999 !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
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
    // SINGLETON TOOLTIP ELEMENT
    // ============================================================================
    let globalTooltipElement = null;
    let globalAltTooltipElement = null; // Détail (aria-label), style fond clair "vrai alt"
    let globalTooltipTimeout = null;
    let globalTooltipAltTimeout = null; // Timeout pour afficher le détail après 2s

    // Créer l'élément tooltip global (singleton)
    function getOrCreateGlobalTooltip() {
        if (!globalTooltipElement) {
            globalTooltipElement = document.createElement('div');
            globalTooltipElement.className = 'flux-custom-tooltip';
            document.body.appendChild(globalTooltipElement);
        }
        return globalTooltipElement;
    }

    // Créer l'élément alt global (détail, style natif)
    function getOrCreateGlobalAltTooltip() {
        if (!globalAltTooltipElement) {
            globalAltTooltipElement = document.createElement('div');
            globalAltTooltipElement.className = 'flux-custom-tooltip flux-custom-tooltip-alt';
            document.body.appendChild(globalAltTooltipElement);
        }
        return globalAltTooltipElement;
    }

    // Fonction pour cacher le tooltip global (court + alt)
    function hideGlobalTooltip() {
        if (globalTooltipTimeout) {
            clearTimeout(globalTooltipTimeout);
            globalTooltipTimeout = null;
        }
        if (globalTooltipAltTimeout) {
            clearTimeout(globalTooltipAltTimeout);
            globalTooltipAltTimeout = null;
        }
        if (globalTooltipElement) {
            globalTooltipElement.style.opacity = '0';
            globalTooltipElement.style.visibility = 'hidden';
        }
        if (globalAltTooltipElement) {
            globalAltTooltipElement.style.opacity = '0';
            globalAltTooltipElement.style.visibility = 'hidden';
        }
    }

    // ============================================================================
    // FONCTION PRINCIPALE : Ajouter un tooltip à un élément
    // ============================================================================
    /**
     * Ajoute un tooltip personnalisé à un élément
     * @param {HTMLElement} element - L'élément auquel ajouter le tooltip
     * @param {string} text - Texte court (affiché en premier)
     * @param {string} [longText] - Texte détaillé (affiché après TOOLTIP_ALT_DELAY)
     */
    function addTooltip(element, text, longText) {
        if (!element || !text || text.trim() === '') return; // Ne pas créer de tooltip si le texte est vide

        // Injecter les styles si nécessaire
        injectStyles();

        let lastMouseEvent = null; // Stocker le dernier événement de souris

        // Fonction pour positionner le tooltip à partir d'un événement de souris
        const positionTooltip = (e) => {
            const tooltip = getOrCreateGlobalTooltip();
            
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
            tooltip.style.left = (mouseX + offsetX + scrollX) + 'px';

            // Vérifier si le tooltip dépasserait en haut de l'écran
            const estimatedTooltipHeight = 50;
            const wouldOverflowTop = (mouseY + offsetY) < estimatedTooltipHeight + 20;

            if (wouldOverflowTop) {
                // Positionner en bas de la souris
                tooltip.style.top = (mouseY - offsetY + scrollY) + 'px';
                tooltip.style.transform = 'translate(0, 0)';
            } else {
                // Positionner au-dessus de la souris (comportement par défaut)
                tooltip.style.top = (mouseY + offsetY + scrollY) + 'px';
                tooltip.style.transform = 'translate(0, -100%)';
            }
        };

        // Afficher le tooltip
        const showTooltip = (e) => {
            // Stocker le dernier événement de souris
            if (e) {
                lastMouseEvent = e;
            }

            // Annuler le timeout précédent si présent
            if (globalTooltipTimeout) {
                clearTimeout(globalTooltipTimeout);
                globalTooltipTimeout = null;
            }

            // Annuler un éventuel délai alt précédent
            if (globalTooltipAltTimeout) {
                clearTimeout(globalTooltipAltTimeout);
                globalTooltipAltTimeout = null;
            }
            // UX : TOOLTIP_DELAY avant affichage (éviter flash au survol rapide)
            globalTooltipTimeout = setTimeout(() => {
                const tooltip = getOrCreateGlobalTooltip();
                // Texte dynamique : data-tooltip / title mis à jour (ex. updateLabel) pris en compte à l'affichage
                const displayText = (element.getAttribute && (element.getAttribute('data-tooltip') || element.getAttribute('title'))) || text;
                const detailText = (element.getAttribute && (element.getAttribute('aria-label') || element.getAttribute('alt'))) || longText;
                tooltip.innerHTML = displayText || text; // Mettre à jour le contenu (court)

                // 🔒 Utiliser la position actuelle de la souris (dernier événement stocké ou position actuelle)
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

                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';

                // Après TOOLTIP_ALT_DELAY, afficher le détail dans l'élément "alt" (fond clair, vrai alt)
                if (detailText && detailText.trim() !== '' && detailText !== (displayText || text)) {
                    globalTooltipAltTimeout = setTimeout(() => {
                        const currentDetail = element.getAttribute('aria-label') || element.getAttribute('alt');
                        if (currentDetail && tooltip.style.visibility === 'visible') {
                            const altEl = getOrCreateGlobalAltTooltip();
                            altEl.innerHTML = currentDetail.replace(/\n/g, '<br>');
                            const ev = lastMouseEvent || { clientX: element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2, clientY: element.getBoundingClientRect().top };
                            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                            const offsetX = 15;
                            const offsetY = -15;
                            const mouseY = ev.clientY;
                            const wouldOverflowTop = (mouseY + offsetY) < 70;
                            altEl.style.left = (ev.clientX + offsetX + scrollX) + 'px';
                            // Alterner : tooltip court au-dessus → alt en dessous ; tooltip en dessous → alt au-dessus
                            if (wouldOverflowTop) {
                                altEl.style.top = (mouseY + offsetY + scrollY) + 'px';
                                altEl.style.transform = 'translate(0, -100%)';
                            } else {
                                altEl.style.top = (mouseY - offsetY + scrollY) + 'px';
                                altEl.style.transform = 'translate(0, 0)';
                            }
                            altEl.style.opacity = '1';
                            altEl.style.visibility = 'visible';
                        }
                        globalTooltipAltTimeout = null;
                    }, TOOLTIP_ALT_DELAY);
                }
            }, TOOLTIP_DELAY);
        };

        // Ajouter les événements
        element.addEventListener('mouseenter', (e) => {
            lastMouseEvent = e; // Stocker la position initiale
            showTooltip(e);
        });
        element.addEventListener('mouseleave', () => {
            hideGlobalTooltip();
            lastMouseEvent = null; // Réinitialiser
        });
        element.addEventListener('mousemove', (e) => {
            lastMouseEvent = e;
            const tooltip = getOrCreateGlobalTooltip();
            const altEl = globalAltTooltipElement;
            if (tooltip && tooltip.style.visibility === 'visible') {
                positionTooltip(e);
            }
            if (altEl && altEl.style.visibility === 'visible') {
                const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                const offsetX = 15;
                const offsetY = -15;
                const wouldOverflowTop = (e.clientY + offsetY) < 70;
                altEl.style.left = (e.clientX + offsetX + scrollX) + 'px';
                if (wouldOverflowTop) {
                    altEl.style.top = (e.clientY + offsetY + scrollY) + 'px';
                    altEl.style.transform = 'translate(0, -100%)';
                } else {
                    altEl.style.top = (e.clientY - offsetY + scrollY) + 'px';
                    altEl.style.transform = 'translate(0, 0)';
                }
            }
        });
    }

    /**
     * Ajoute un tooltip depuis les attributs d'un élément (alt, title, data-tooltip)
     * @param {HTMLElement} element - L'élément à traiter
     */
    function addTooltipFromAttribute(element) {
        const shortText = element.getAttribute('data-tooltip') || element.getAttribute('title');
        const longText = element.getAttribute('aria-label') || element.getAttribute('alt');
        const text = shortText || longText;
        
        if (text && text.trim() !== '') {
            // Nettoyer le title par défaut pour éviter le tooltip natif du navigateur
            if (element.hasAttribute('title')) {
                element.removeAttribute('title');
            }
            // Court en premier ; détail (aria-label/alt) après 2s si présent
            addTooltip(element, (shortText || text).replace(/\n/g, '<br>'), longText ? longText.replace(/\n/g, '<br>') : null);
        }
    }

    /**
     * Initialise automatiquement tous les tooltips de la page
     */
    function autoInitTooltips() {
        const elements = document.querySelectorAll('[alt], [title], [data-tooltip]');
        elements.forEach(el => {
            if (!el.hasAttribute('data-tooltip-initialized')) {
                addTooltipFromAttribute(el);
                el.setAttribute('data-tooltip-initialized', 'true');
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
        window.hideTooltip = hideGlobalTooltip; // Exposer la fonction globale de masquage
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

