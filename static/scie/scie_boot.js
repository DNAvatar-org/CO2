// File: CO2/static/scie/scie_boot.js - Garde-fous de chargement et outils de base de la page
// Desc: En français, dans l'architecture, je suis le SAS D'ENTRÉE de la page Scientifique : je vérifie que les
//       ressources critiques sont là (un dico.js manquant ne doit pas donner une page à moitié vivante), je
//       capture les erreurs, je fabrique les logos de l'alphabet et je tiens le pont vers la page parente.
// Version 1.0.0
// Date: [September 19, 2026]
// logs :
//   - v1.0.0: extraction depuis le <script> en ligne de CO2/html/scie_compute.html (1810 lignes d'un bloc).
//     Découpage par responsabilité, à code IDENTIQUE : seule l'indentation change. Les fichiers restent des
//     scripts classiques chargés dans l'ordre des dépendances — la page garde son chargement synchrone.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

// Vérifier ressources critiques (ex: dico.js manquant → ERR_SOCKET_NOT_CONNECTED)
(function checkCritical() {
    var key = 'co2_reload_attempts';
    var maxAttempts = 2;
    var attempts = parseInt(sessionStorage.getItem(key) || '0', 10);
    function ok() {
        if (!window.DATA || !window.DATA['⚖️'] || !window.TIMELINE || !window.CONST) return false;
        sessionStorage.setItem(key, '0');
        return true;
    }
    if (ok()) return;
    if (attempts >= maxAttempts) {
        console.warn('Ressources manquantes (DATA, TIMELINE, CONST) après ' + maxAttempts + ' tentatives. Vérifier la console.');
        sessionStorage.setItem(key, '0');
        return;
    }
    sessionStorage.setItem(key, String(attempts + 1));
    console.warn('Ressources manquantes, rechargement (' + (attempts + 1) + '/' + maxAttempts + ')...');
    location.reload();
})();

// Capturer toute erreur non gérée pour éviter plantage silencieux (ex: Hadéen)
window.onerror = function (msg, url, line, col, err) {
    console.error('❌ Erreur non gérée:', msg, url, line, col, err && err.stack);
    return false;
};
window.addEventListener('unhandledrejection', function (e) {
    console.error('❌ Promise rejetée non gérée:', e.reason, e.reason && e.reason.stack);
});

// Fonction helper pour construire les clés de logos dans le HTML (utilise window.getLogoKey si disponible)
function getLogoKeyHTML(...names) {
    if (typeof window !== 'undefined' && window.getLogoKey) {
        return window.getLogoKey(...names);
    }
    if (typeof window === 'undefined' || !window.LOGOS) {
        return '';
    }
    return names.map(name => window.LOGOS[name] || '').join('');
}

function getLogoHTML(name) {
    if (typeof window !== 'undefined' && window.getLogo) {
        return window.getLogo(name);
    }
    if (typeof window === 'undefined' || !window.LOGOS) {
        return '';
    }
    return window.LOGOS[name] || '';
}

// Synchronisation parent ↔ iframe (epoch, anim, ticTime, tuning pour reproductibilité run scie vs visu)
// Retourne la clé tic active : '🛢' si year-indexed (📱) ou clé '🛢' présente, '💫' sinon
function getTicKey(ep) {
    if (!ep || !ep['🕰']) return '💫';
    if (Object.keys(ep['🕰']).some(function(k) { return !isNaN(Number(k)); })) return '🛢';
    return (ep['🕰']['🛢']) ? '🛢' : '💫';
}

function emitSyncToParent() {
    if (window === window.top) return;
    const DATA = window.DATA;
    const epochId = (DATA && DATA['📜'] && DATA['📜']['🗿']) || '⚫';
    // 📿💫 = compteur de temps universel (barycentre + affichage)
    const ticTime = (DATA && DATA['📜'] && DATA['📜']['📿💫'] != null) ? DATA['📜']['📿💫'] : 0;
    const bary = (DATA && DATA['📜'] && DATA['📜']['bary'] != null && Number.isFinite(DATA['📜']['bary'])) ? DATA['📜']['bary'] : undefined;
    const animBtn = document.getElementById('anim-toggle');
    const animEnabled = animBtn
        ? animBtn.classList.contains('selected')
        : !!(DATA && DATA['🔘'] && DATA['🔘']['🔘🎞']);
    const h2oTotalFromMeteorites = (typeof window.RUNTIME_STATE.h2oTotalFromMeteorites !== 'undefined') ? window.RUNTIME_STATE.h2oTotalFromMeteorites : 0;
    const payload = { epochId, animEnabled, ticTime, h2oTotalFromMeteorites };
    if (bary !== undefined) payload.bary = bary;
    if (DATA && DATA['🎚️']) {
        const T = DATA['🎚️'];
        payload.tuning = {
            baryByGroup: {
                ATM: T.baryByGroup.ATM,
                CLOUD_SW: T.baryByGroup.ATM,
                SCIENCE: T.baryByGroup.ATM,
                SOLVER: T.baryByGroup.SOLVER,
                HYSTERESIS: T.baryByGroup.HYSTERESIS
            },
            CLOUD_SW: T.CLOUD_SW,
            SOLVER: T.SOLVER,
            updates: []
        };
    }
    window.parent.postMessage({ type: 'sync:state', payload: payload }, '*');
}




// Intercepter console.log pour afficher dans la page
const originalLog = console.log;
const originalError = console.error;
// Logs désactivés - la div de logs a été supprimée
// console.log et console.error utilisent les fonctions originales

function clearLog() {
    // Logs désactivés - la div de logs a été supprimée
}

function toggleAnim() {
    // 🎞 = "prochaine époque en animation" (comme visu) — pas un toggle on/off
    if (window !== window.top) {
        window.parent.postMessage({ type: 'action:nextEpoch' }, '*');
    } else if (typeof window.togglePlotAnim === 'function') {
        window.togglePlotAnim();
    }
}

// Fonction helper pour convertir les chemins relatifs en chemins absolus depuis la racine
// Depuis static/compute/, on doit remonter de 2 niveaux pour atteindre la racine
function getImagePath(relativePath) {
    if (!relativePath) return relativePath;
    // Si le chemin commence déjà par http:// ou https:// ou /, le retourner tel quel
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('/')) {
        return relativePath;
    }
    // Depuis doc/ : remonter d'un niveau pour atteindre la racine
    return '../' + relativePath;
}
