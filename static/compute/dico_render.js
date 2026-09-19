// File: CO2/static/compute/dico_render.js - Lexique HTML du dictionnaire des clés
// Desc: En français, dans l'architecture, je suis la VUE du dictionnaire : la grille du lexique, avec la
//       valeur courante de chaque clé lue dans DATA. Les définitions (KEYS, DESC, FORM, KEYS_ALT0SEC) ne
//       sont plus ici : elles vivent dans API_BILAN/data/dico.js, que je lis par window. Chargé après lui.
// Version 1.0.0
// Date: [September 19, 2026]
// logs :
//   - v1.0.0: extraction depuis CO2/static/compute/dico.js v1.0.21, code identique.
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

// Contrat : script classique, chargé APRÈS API_BILAN/data/dico.js (window.KEYS / DESC / FORM / KEYS_ALT0SEC).

// FORM et KEYS_ALT0SEC sont déjà des liaisons globales posées par API_BILAN/data/dico.js : les
// redéclarer ici avec const casserait le script entier (« Identifier already declared » — les scripts
// classiques partagent la même portée lexicale globale). On les lit telles quelles.

// ============================================================================
// FONCTION : CRÉER LE DICO (utilise DATA directement, pas de paramètres)
// ============================================================================
function createDicoHtml() {
    if (typeof window === 'undefined') {
        console.error('[createDico] window non défini');
        return '';
    }
    
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const DESC = window.DESC;
    // KEYS est défini localement dans ce fichier
    
    // Fonction helper : DESC visible ; alt0sec = KEYS_ALT0SEC → FORM → DESC
    const createDicoEntry = (key, desc, categoryLogo) => {
        const formCat = (typeof FORM !== 'undefined' && FORM[categoryLogo]) ? FORM[categoryLogo] : null;
        const formText = (formCat && formCat[key]) ? String(formCat[key]) : '';
        const alt0Explicit = (typeof KEYS_ALT0SEC !== 'undefined' && KEYS_ALT0SEC[key]) ? KEYS_ALT0SEC[key] : '';
        const alt0 = alt0Explicit || formText || desc || '';
        const tipAttr = alt0
            ? ' data-tooltip="' + String(alt0).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '"'
            : '';
        return `<div class="legend-item"${tipAttr}><span class="logo">${key}</span><span class="description">${desc}</span></div>`;
    };
    
    // Catégories avec leurs logos et noms (utilise directement les emojis)
    const categories = [
        {
            logo: '📜',
            name: 'Config Événements'
        },
        {
            logo: '📅',
            name: 'Date Époque'
        },
        {
            logo: '🌕',
            name: 'Noyau'
        },
        {
            logo: '☀️',
            name: 'Soleil'
        },
        {
            logo: '🪩',
            name: 'Albédo'
        },
        {
            logo: '⚖️',
            name: 'Masses'
        },
        {
            logo: '🫧',
            name: 'Atmosphère'
        },
        {
            logo: '💧',
            name: 'Cycle de l\'eau'
        },
        {
            logo: '🧮',
            name: 'Convergence'
        },
        {
            logo: '🧲',
            name: 'Flux (W/m²)'
        },
        {
            logo: '🪩🍰',
            name: 'Albédo matériau'
        }
    ];
    
    // Générer le HTML pour chaque catégorie
    const categoryHTMLs = categories.map(category => {
        // 🔒 CORRECTION : Parcourir DESC directement, pas seulement KEYS
        // Cela permet d'afficher les clés mathématiques (avec ❀) qui sont dans DESC mais pas dans KEYS
        if (!DESC[category.logo]) return '';
        
        // Récupérer toutes les clés depuis DESC (source de vérité pour l'affichage)
        const descKeys = Object.keys(DESC[category.logo]);
        
        const items = descKeys
            .map(fullKey => {
                const desc = DESC[category.logo][fullKey];
                // Ignorer les variables dont la description commence par "!" (variables internes aux calculs)
                if (!desc || desc.startsWith('!')) return '';
                return createDicoEntry(fullKey, desc, category.logo);
            })
            .filter(item => item !== '') // Retirer les entrées vides
            .join('');
        
        return `
            <h3 class="legend-title">${category.logo} ${category.name}</h3>
            ${items}
        `;
    });
    
    // Organiser en colonnes (11 catégories → 5 colonnes : 3, 2, 2, 2, 2)
    const col1 = categoryHTMLs.slice(0, 3).join('');
    const col2 = categoryHTMLs.slice(3, 5).join('');
    const col3 = categoryHTMLs.slice(5, 7).join('');
    const col4 = categoryHTMLs.slice(7, 9).join('');
    const col5 = categoryHTMLs.slice(9, 11).join('');
    
    return `
        <div class="legend-grid">
            <div class="legend-column">
                ${col1}
            </div>
            <div class="legend-column">
                ${col2}
            </div>
            <div class="legend-column">
                ${col3}
            </div>
            <div class="legend-column">
                ${col4}
            </div>
            <div class="legend-column">
                ${col5}
            </div>
        </div>
    `;
}

// ============================================================================
// EXPOSITION GLOBALE — rendu seulement
// ============================================================================
window.createDicoHtml = createDicoHtml;
