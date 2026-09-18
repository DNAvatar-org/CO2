// File: modal.js - Système de modale/alerte personnalisée
// Desc: Module pour afficher des alertes avec texte sélectionnable et pages HTML dans des popups
// Version 1.1.1
// - v1.1.1: .page-modal-box.tall height 90vh (Bibliographie sans message resize restait à 460 px).
// Date: [June 08, 2025] [HH:MM UTC+1]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See https://commonsclause.com/ for full terms.
// ¬Ā (/nʌl nʌl eɪ/) (/nɔ̃ a ma.kʁɔ̃/) : ¬¬Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
//   - Added openPageModal function to display HTML pages in iframe popups

(function(global) {
    // Injecter le CSS nécessaire
    const style = document.createElement('style');
    style.textContent = `
        .custom-alert-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            backdrop-filter: blur(2px);
        }

        .custom-alert-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            max-width: 500px;
            width: 90%;
            text-align: left;
            color: #333;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            border: 1px solid #ccc;
            animation: custom-alert-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .custom-alert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }

        .custom-alert-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #d32f2f; /* Rouge erreur par défaut */
            margin: 0;
        }

        .custom-alert-close {
            cursor: pointer;
            font-size: 1.2em;
            color: #999;
            line-height: 1;
        }

        .custom-alert-close:hover {
            color: #333;
        }

        .custom-alert-message {
            margin-bottom: 20px;
            line-height: 1.5;
            white-space: pre-wrap; /* Conserver les sauts de ligne */
            font-size: 0.95em;
            user-select: text !important; /* Forcer la sélection */
            -webkit-user-select: text !important;
            cursor: text;
            max-height: 300px;
            overflow-y: auto;
            padding-right: 5px;
        }

        .custom-alert-buttons {
            text-align: right;
            margin-top: 15px;
        }

        .custom-alert-btn {
            padding: 8px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 500;
            transition: background 0.2s, transform 0.1s;
        }

        .custom-alert-btn:hover {
            background: #0056b3;
            transform: translateY(-1px);
        }

        .custom-alert-btn:active {
            transform: translateY(1px);
        }

        @keyframes custom-alert-pop {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }

        .page-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            backdrop-filter: blur(2px);
        }

        .page-modal-box {
            border-radius: 8px;
            border: 1px solid #444;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            max-width: 90%;
            max-height: 90vh;
            width: 90%;
            height: calc(400px + 60px);
            display: flex;
            flex-direction: column;
            animation: custom-alert-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            overflow: hidden;
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        .page-modal-box.tall {
            height: 90vh; /* pages longues sans message resize (Bibliographie) */
            max-height: 95vh;
            width: 95%;
            max-width: 1400px;
        }

        .page-modal-box::-webkit-scrollbar {
            display: none;
        }

        body.mode-dark .page-modal-box {
            background: #222;
            border: 1px solid #444;
        }

        .page-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #1a1a1a;
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
            flex-shrink: 0;
        }

        .page-modal-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #e0e0e0;
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .page-modal-close {
            cursor: pointer;
            font-size: 1.5em;
            color: #888;
            line-height: 1;
            padding: 0 5px;
            transition: color 0.2s;
        }

        .page-modal-close:hover {
            color: #e0e0e0;
        }

        .page-modal-iframe-container {
            flex: 1;
            overflow: hidden;
            position: relative;
            width: 100%;
            min-height: 0;
            background: #0d0d0d;
        }

        .page-modal-iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: #0d0d0d;
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            overflow: hidden;
        }

        .page-modal-iframe::-webkit-scrollbar {
            display: none;
        }

        .page-modal-iframe {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    `;
    document.head.appendChild(style);

    /**
     * Affiche une alerte modale personnalisée avec texte sélectionnable
     * @param {string} message - Le message à afficher (peut contenir \n)
     * @param {string} title - Le titre de l'alerte (défaut: "Alerte")
     * @param {Function} onClose - Callback optionnel à la fermeture
     */
    function showSelectableAlert(message, title = "Alerte", onClose = null) {
        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay';
        
        // Fermer si on clique sur l'overlay (hors de la boîte)
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeAlert();
            }
        });

        // Créer la boîte
        const box = document.createElement('div');
        box.className = 'custom-alert-box';
        
        // Header
        const header = document.createElement('div');
        header.className = 'custom-alert-header';
        
        const titleEl = document.createElement('h3');
        titleEl.className = 'custom-alert-title';
        titleEl.textContent = title;
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'custom-alert-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = closeAlert;
        
        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        
        // Message
        const msgEl = document.createElement('div');
        msgEl.className = 'custom-alert-message';
        msgEl.textContent = message;
        
        // Boutons
        const buttons = document.createElement('div');
        buttons.className = 'custom-alert-buttons';
        
        const okBtn = document.createElement('button');
        okBtn.className = 'custom-alert-btn';
        okBtn.textContent = 'OK';
        okBtn.onclick = closeAlert;
        
        buttons.appendChild(okBtn);
        
        // Assemblage
        box.appendChild(header);
        box.appendChild(msgEl);
        box.appendChild(buttons);
        overlay.appendChild(box);
        
        document.body.appendChild(overlay);
        
        // Focus sur le bouton OK pour accessibilité
        okBtn.focus();

        function closeAlert() {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            if (typeof onClose === 'function') {
                onClose();
            }
        }
    }

    // Variable globale pour suivre la popup ouverte (une seule à la fois)
    let currentPageModal = null;

    /**
     * Ouvre une page HTML dans une popup avec iframe (une seule popup à la fois)
     * @param {string} url - L'URL de la page à charger
     * @param {string} title - Le titre de la popup (défaut: "Popup")
     * @param {Function} onClose - Callback optionnel à la fermeture
     * @param {string} size - Taille de la modal: "normal" (défaut) ou "tall" (plus grande en hauteur)
     */
    function openPageModal(url, title = "Popup", onClose = null, size = "normal") {
        // Fermer la popup précédente si elle existe
        if (currentPageModal && currentPageModal.closePageModal) {
            currentPageModal.closePageModal();
        }

        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.className = 'page-modal-overlay';
        currentPageModal = overlay;
        
        // Container pour l'iframe
        const iframeContainer = document.createElement('div');
        iframeContainer.className = 'page-modal-iframe-container';
        
        // Iframe
        const iframe = document.createElement('iframe');
        iframe.className = 'page-modal-iframe';
        iframe.src = url;
        iframe.setAttribute('loading', 'lazy');
        // Styles inline pour éviter le flash de la barre de scroll sur l'iframe
        iframe.style.overflow = 'hidden';
        iframe.style.msOverflowStyle = 'none';
        iframe.style.scrollbarWidth = 'none';
        
        // Écouter les messages postMessage de l'iframe pour ajuster la hauteur
        // Utiliser la même logique que test_computeRadiativeTransfer.html
        const handleResizeMessage = function(event) {
            if (event.data && event.data.type === 'resize-iframe' && currentPageModal === overlay) {
                const height = event.data.height;
                if (height && height > 0) {
                    // Utiliser exactement la hauteur demandée (comme dans test*.html)
                    iframeContainer.style.height = height + 'px';
                    // Ajuster la hauteur totale de la modal box en ajoutant la hauteur du header
                    const headerHeight = header.offsetHeight;
                    box.style.height = (height + headerHeight) + 'px';
                }
            }
        };
        window.addEventListener('message', handleResizeMessage);
        
        // Fonction de fermeture (définie avant utilisation)
        const originalClosePageModal = function() {
            window.removeEventListener('message', handleResizeMessage);
            if (currentPageModal === overlay && document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                currentPageModal = null;
            }
            if (typeof onClose === 'function') {
                onClose();
            }
        };
        
        // Fermer si on clique sur l'overlay (hors de la boîte)
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                originalClosePageModal();
            }
        });

        // Créer la boîte
        const box = document.createElement('div');
        box.className = 'page-modal-box' + (size === 'tall' ? ' tall' : '');
        // Styles inline pour éviter le flash de la barre de scroll
        box.style.overflow = 'hidden';
        box.style.msOverflowStyle = 'none';
        box.style.scrollbarWidth = 'none';
        
        // Header
        const header = document.createElement('div');
        header.className = 'page-modal-header';
        
        const titleEl = document.createElement('h3');
        titleEl.className = 'page-modal-title';
        titleEl.textContent = title;
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'page-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function() {
            originalClosePageModal();
        };
        
        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        
        iframeContainer.appendChild(iframe);
        
        // Assemblage
        box.appendChild(header);
        box.appendChild(iframeContainer);
        overlay.appendChild(box);
        
        document.body.appendChild(overlay);

        // Exposer la fonction de fermeture sur l'overlay pour pouvoir la fermer depuis l'extérieur
        overlay.closePageModal = originalClosePageModal;
    }

    // Exposer globalement
    global.showSelectableAlert = showSelectableAlert;
    global.openPageModal = openPageModal;

})(typeof window !== 'undefined' ? window : this);


