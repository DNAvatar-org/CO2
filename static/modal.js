// File: modal.js - Système de modale/alerte personnalisée
// Desc: Module pour afficher des alertes avec texte sélectionnable
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [June 08, 2025] [HH:MM UTC+1]

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

        body.mode-dark .custom-alert-box {
            background: #222;
            color: #eee;
            border: 1px solid #444;
        }

        .custom-alert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }

        body.mode-dark .custom-alert-header {
            border-bottom: 1px solid #444;
        }

        .custom-alert-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #d32f2f; /* Rouge erreur par défaut */
            margin: 0;
        }

        body.mode-dark .custom-alert-title {
            color: #ff5252;
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

    // Exposer globalement
    global.showSelectableAlert = showSelectableAlert;

})(typeof window !== 'undefined' ? window : this);

