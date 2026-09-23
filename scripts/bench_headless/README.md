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

## Le tictime (depuis le 2026-09-23)

Chaque époque est mesurée deux fois : à sa graine (`T`), puis après **un** tictime (`T_tic`),
joué exactement comme le clic de l'interface (`📿💫 += 1` → `getEpochDateConfig` → `getNoyau` →
calcul animé qui repart de l'état convergé). Pour 📱, c'est le bouton ⛽ de la tranche 2000
(émissions + puits `advanceCarbonSinks`), donc `T_tic` est l'an 2025. Les trois `hysteresis …`
n'en ont pas : leur unique action est l'événement de bascule lui-même.

Pourquoi : c'est le tictime qui applique l'état de cycle `🔁` (🦣 glaciaire/interglaciaire). Sans
lui, la bascule de 🦣 n'était jamais testée — seule la graine l'était.

Balayage du barycentre : poser `window.__BENCH_BARYS__ = [55, 56, …]` en tête du script injecté.

## Ce que le banc NE teste pas

`animEnabled:false` relance chaque époque depuis sa propre graine. **L'hystérésis n'est donc pas
testée** : pour la sortie du snowball il faut enchaîner ⛄ puis `hysteresis 1b` en `animEnabled:true`,
ce qui conserve l'état gelé.
