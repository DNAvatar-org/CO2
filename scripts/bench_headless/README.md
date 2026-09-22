# Banc headless API_BILAN

Fait tourner le modèle sans interface, pour mesurer. C'est l'outil qui a servi à tous les
diagnostics de `API_BILAN/doc/` : bench 19 époques, sondes λ / ΔF, balayages de jauges,
reproduction du chemin de la visu pour la sortie du snowball.

```bash
python3 scripts/bench_headless/run.py bench19.js
```

Écrit un JSON sur la sortie standard. Aucune dépendance pip : `cdp.py` est un client
Chrome DevTools minimal (WebSocket brut).

## Écrire une mesure

Un script injecté doit :
- poser `window.__PROG__ = 'done'` (ou `'error'`) en fin ;
- déposer son résultat dans une variable `window.__XXX__`, nommée par `--var` ;
- en cas d'exception, poser `window.__ERR__`.

`bench19.js` sert de modèle.

## Deux pièges qui coûtent une heure

**Le cache de Chrome.** Sans le `?cacheBust` de `host.html`, Chrome sert les JS du cache et on
mesure le code d'AVANT sa modification. C'est déjà arrivé — un bench annoncé « rien n'a bougé »
qui tournait sur l'ancien fichier.

**Les workers spectraux.** `__SPECTRAL_WORKER_SCRIPT__` pointe volontairement sur une autre
origine pour que `new Worker()` lève une SecurityError : `worker_pool.js` bascule alors sur son
repli blob. Sans ça les workers se chargent en 404 silencieux et la convergence ne finit jamais.

## Ce que le banc NE teste pas

`animEnabled:false` relance chaque époque depuis sa propre graine. **L'hystérésis n'est donc pas
testée** : pour la sortie du snowball il faut enchaîner ⛄ puis `hysteresis 1b` en `animEnabled:true`,
ce qui conserve l'état gelé.
