// File: static/ui/apercu_epoque.js - Survol d'une époque de la frise : sa config et sa graine, sans calcul
// Desc: Au survol, DATA prend la config de l'époque (CLICS.frise + api.prepare : tout ce qui précède la convergence,
//       aucun transfert radiatif) ; la T° affichée est la graine 🌡️🧮. Au rollout, DATA est rendu tel qu'il était.
// Version 1.0.0
// Date: 2026-10-18
// Copyright 2026 DNAvatar.org - Arnaud Maignan

window.APERCU_EPOQUE = (function () {
    'use strict';

    /** État d'avant le survol : [catégorie, objet d'origine, copie de ses champs]. null = pas d'aperçu en cours.
     *  Copie d'un seul niveau : la préparation REMPLACE les sous-objets (calottes, previous), elle ne les modifie pas ;
     *  on remet donc les objets d'origine à leur place (même référence) et leurs champs à leur valeur. */
    let avant = null;
    let animAvant = null;

    function sauver(D) {
        return Object.keys(D).map(function (k) { return [k, D[k], Object.assign({}, D[k])]; });
    }

    function rendre(D, etat) {
        etat.forEach(function (e) {
            const k = e[0], objet = e[1], copie = e[2];
            D[k] = objet;
            Object.keys(objet).forEach(function (c) { if (!(c in copie)) delete objet[c]; });
            Object.assign(objet, copie);
        });
    }

    /** Ce qui se lit sans spectre : bandeau T° / pression / couleur, et l'organigramme. */
    function afficher() {
        window.projectSynthese(window.DATA);
        window.ORG.updateFluxLabels('ProcessFinished');
    }

    return {
        /** Un calcul en cours écrit dans DATA : pas d'aperçu par-dessus. */
        montrer: function (epochId) {
            if (window.SYNC_STATE.calculationInProgress) return;
            avant = sauver(window.DATA);
            animAvant = window.SYNC_STATE.animEnabled;
            window.CLICS.frise(epochId);
            window.getBilanRadiatifAPI(function () {}).prepare({ epochId: epochId, animEnabled: false });
            afficher();
        },

        /** Rollout, ou clic (pointerdown, avant que le clic ne lance le vrai calcul). */
        cacher: function () {
            if (avant === null) return;   // pas d'aperçu posé (calcul en cours au survol, ou déjà rendu au clic)
            rendre(window.DATA, avant);
            window.SYNC_STATE.animEnabled = animAvant;
            avant = null;
            afficher();
        }
    };
})();
