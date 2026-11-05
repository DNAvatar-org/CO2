// File: CO2/static/ui/etats_gardes.js
// Desc: Les états gardés d'un chargement à l'autre (l'état de l'hôte : embarque.js garderEtat ; la progression de la page
//       seule : progression.js), dans IndexedDB plutôt que localStorage : localStorage est UN pour tout le site (toutes
//       les pages de dnavatar.org, ou de localhost:8001 en local, se partagent ~5 millions de caractères) et ces états
//       y pèsent des centaines de Ko — plein, setItem lançait QuotaExceededError. IndexedDB a la place d'une part du
//       disque.
//       IndexedDB ne se lit qu'en asynchrone : lire() part avec les fetch du démarrage (loader_panels.js, le même
//       Promise.all) — une fois là, tout est en mémoire et se lit en synchrone (get). Écrire (put, effacer) : la
//       mémoire tout de suite, la base derrière ; un échec (base pleine, refusée) se dit en console, sans arrêter le
//       bilan — ce ne sont que des calculs déjà faits, refaits au prochain chargement.
//       Les états d'avant (localStorage co2_embarque_etat, co2_progression) passent dans la base et sont effacés de
//       localStorage : la place rendue aux autres pages.
//       Valeurs : des chaînes JSON, comme dans localStorage (mêmes règles : Infinity → null, undefined omis).
// Version 1.0.0
// Date: 2026-11-05
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.ETATS_GARDES = (function () {
    'use strict';
    const BASE = 'co2_etats', MAGASIN = 'etats';
    /** Les clés gardées (et celles de localStorage d'avant, du même nom) */
    const CLES = ['co2_embarque_etat', 'co2_progression'];
    /** cle → chaîne JSON, ou absente ; rempli par lire() */
    const valeurs = {};
    /** La base ouverte, ou null : pas d'IndexedDB (refusée, navigation privée) — les états vivent alors le temps de la page */
    let db = null;

    function ouvrir() {
        return new Promise(function (ok, ko) {
            const rq = indexedDB.open(BASE, 1);
            rq.onupgradeneeded = function () { rq.result.createObjectStore(MAGASIN); };
            rq.onsuccess = function () { ok(rq.result); };
            rq.onerror = function () { ko(rq.error); };
        });
    }
    /** Une transaction sur le magasin : f(magasin), fini → ok */
    function transaction(mode, f) {
        return new Promise(function (ok, ko) {
            const tx = db.transaction(MAGASIN, mode);
            f(tx.objectStore(MAGASIN));
            tx.oncomplete = function () { ok(); };
            tx.onerror = tx.onabort = function () { ko(tx.error); };
        });
    }
    function echec(quoi) { return function (err) { console.error('[ETATS_GARDES] ' + quoi, err); }; }

    return {
        /** Au démarrage (loader_panels.js, avec ses fetch) : la base ouverte, ses états en mémoire, ceux de localStorage
         *  d'avant passés dedans. Ne rejette jamais : sans base, le bilan démarre sans état gardé. */
        lire: function () {
            return ouvrir().then(function (d) {
                db = d;
                return transaction('readonly', function (m) {
                    CLES.forEach(function (k) { const rq = m.get(k); rq.onsuccess = function () { if (rq.result !== undefined) valeurs[k] = rq.result; }; });
                });
            }).then(function () {
                // localStorage d'avant : plus récent que rien, jamais que la base (qui ne l'a pas encore)
                const anciens = CLES.filter(function (k) { return localStorage.getItem(k) !== null; });
                anciens.forEach(function (k) { if (valeurs[k] === undefined) valeurs[k] = localStorage.getItem(k); });
                if (anciens.length === 0) return null;
                return transaction('readwrite', function (m) {
                    anciens.forEach(function (k) { m.put(valeurs[k], k); });
                }).then(function () { anciens.forEach(function (k) { localStorage.removeItem(k); }); });
            }).catch(echec('lecture'));
        },
        /** La chaîne JSON gardée sous cle, ou null (après lire) */
        get: function (cle) { return valeurs[cle] === undefined ? null : valeurs[cle]; },
        /** Garde la chaîne JSON s sous cle */
        put: function (cle, s) {
            valeurs[cle] = s;
            if (db !== null) transaction('readwrite', function (m) { m.put(s, cle); }).catch(echec('écriture de ' + cle));
        },
        /** Efface cle */
        effacer: function (cle) {
            delete valeurs[cle];
            if (db !== null) transaction('readwrite', function (m) { m.delete(cle); }).catch(echec('effacement de ' + cle));
        }
    };
})();
