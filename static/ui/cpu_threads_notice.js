// File: CO2/static/ui/cpu_threads_notice.js - Avertissement « parallélisme réduit par le navigateur »
// Desc: Le pool de workers spectraux dimensionne sur navigator.hardwareConcurrency (worker_pool.js : N−1).
//       Certains navigateurs annoncent MOINS de cœurs qu'il n'y en a — Brave randomise la valeur (défense
//       anti-empreinte dite « farbling »), d'autres la plafonnent. Le calcul tourne alors sur moins de
//       threads sans que rien ne le signale. Ce module le dit à chaque chargement — mais UNIQUEMENT sur les
//       navigateurs concernés : Chrome, Edge, Safari annoncent le vrai nombre de cœurs, ils ne voient jamais rien.
// Version 1.1.0
// Date: [September 18, 2026]
// logs :
//   - v1.1.0: alerte à CHAQUE chargement (plus de mémorisation localStorage) — c'est un état du navigateur,
//     pas une nouvelle : tant qu'on reste sous Brave, l'info reste vraie et le rappel est utile.
//   - v1.0.0: création. Détection Brave (navigator.brave.isBrave), seuil bas générique, mémorisation localStorage.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

// Contrat : script classique, chargé après static/ui/modal.js (window.showSelectableAlert).

(function (global) {
    'use strict';

    /** En dessous, le parallélisme est clairement bridé quelle que soit la machine. */
    var SEUIL_BAS = 4;

    function nbThreads() {
        var n = global.navigator ? global.navigator.hardwareConcurrency : 0;
        return (typeof n === 'number' && n > 0) ? n : 0;
    }

    /** Promesse<boolean> — l'API officielle de Brave, absente partout ailleurs. */
    function estBrave() {
        var nav = global.navigator;
        if (!nav || !nav.brave || typeof nav.brave.isBrave !== 'function') return Promise.resolve(false);
        return nav.brave.isBrave().then(function (v) { return !!v; }).catch(function () { return false; });
    }

    /** Nom du navigateur, pour le texte seulement — jamais pour décider d'un comportement. */
    function nomNavigateur(brave) {
        if (brave) return 'Brave';
        var ua = (global.navigator && global.navigator.userAgent) || '';
        if (/Firefox\//.test(ua)) return 'Firefox';
        if (/Edg\//.test(ua)) return 'Edge';
        if (/OPR\//.test(ua)) return 'Opera';
        if (/Chrome\//.test(ua)) return 'Chrome';
        if (/Safari\//.test(ua)) return 'Safari';
        return 'ce navigateur';
    }

    function texte(brave, n, nom) {
        var pool = Math.max(1, n - 1);
        var lignes = [
            nom + ' annonce ' + n + ' thread' + (n > 1 ? 's' : '') + ' — le calcul spectral ouvre donc '
                + pool + ' worker' + (pool > 1 ? 's' : '') + '.',
            ''
        ];
        if (brave) {
            lignes.push(
                'Brave ne dit pas le vrai nombre de cœurs : sa protection anti-empreinte (« farbling ») renvoie',
                'une valeur tirée au hasard, inférieure au nombre réel et différente d\'une session à l\'autre.',
                'Le calcul tourne donc sur moins de threads qu\'il ne pourrait, et le temps de convergence varie',
                'sans raison d\'une fois sur l\'autre.',
                '',
                'Deux sorties :',
                '  • ouvrir cette page dans Chrome ou Edge, qui annoncent le nombre réel de cœurs logiques ;',
                '  • ou, dans Brave : bouclier du site → « Bloquer le fingerprinting » → désactivé, puis recharger.'
            );
        } else {
            lignes.push(
                'C\'est peu pour un calcul spectral. Si la machine a davantage de cœurs, c\'est le navigateur',
                'qui plafonne la valeur — Chrome et Edge annoncent le nombre réel de cœurs logiques.'
            );
        }
        return lignes.join('\n');
    }

    /** Infobulle du compteur « CPU: N threads » du panneau spectral (plot.js la crée). */
    function enrichirIndicateur(brave, n, nom) {
        var el = document.querySelector('.plot-threads-info');
        if (!el) return false;
        var detail = 'navigator.hardwareConcurrency = ' + n + ' (' + nom + ') — le pool spectral ouvre '
            + Math.max(1, n - 1) + ' worker(s).';
        if (brave) {
            detail += '\nBrave randomise cette valeur (anti-empreinte « farbling ») : elle est inférieure au nombre '
                + 'réel de cœurs et change à chaque session. Chrome et Edge annoncent le nombre réel.';
        }
        el.setAttribute('data-tooltip', 'CPU: ' + n + ' threads');
        el.setAttribute('data-alt2sec', detail);
        if (typeof global.addTooltipFromAttribute === 'function' && !el.hasAttribute('data-tooltip-initialized')) {
            global.addTooltipFromAttribute(el);
            el.setAttribute('data-tooltip-initialized', 'true');
        }
        return true;
    }

    function demarrer() {
        var n = nbThreads();
        if (!n) return;
        estBrave().then(function (brave) {
            var nom = nomNavigateur(brave);
            // L'indicateur est créé par plot.js au premier tracé : on réessaie quelques secondes.
            var essais = 0;
            (function attendreIndicateur() {
                if (enrichirIndicateur(brave, n, nom) || ++essais > 20) return;
                global.setTimeout(attendreIndicateur, 1000);
            })();

            // Chrome, Edge, Safari… annoncent le vrai nombre de cœurs : rien à signaler, jamais.
            if (!brave && n > SEUIL_BAS) return;
            if (typeof global.showSelectableAlert !== 'function') return;
            global.showSelectableAlert(texte(brave, n, nom), 'Parallélisme réduit par le navigateur');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', demarrer);
    } else {
        demarrer();
    }

    global.CPU_THREADS_NOTICE = { nbThreads: nbThreads, estBrave: estBrave };

})(typeof window !== 'undefined' ? window : this);
