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

## Les passages d'hystérésis (depuis le 2026-09-23, v1.2.0)

Une époque `hysteresis …` est une **config frontière** : les conditions où le climat bascule
facilement. Elle ne se juge **pas** sur sa graine (la T° de 1b depuis sa graine ne veut rien dire),
mais sur le **passage** qu'elle provoque en venant de l'époque précédente, T° et glace conservées :

| passage | étapes | attendu |
|---|---|---|
| entrée Snowball | 🪸 → 1a → (🗻) ⛄ | 1a chaud, ⛄ gelé (T < −30, glace > 0,8) |
| sortie Snowball | ⛄ → (💫🌋) 1b → 🪼 | 1b sorti (T > 0, glace < 0,1), 🪼 reste chaud |
| glaciation EOT | 🐊 → 2 → (⛰) 🏔 | la glace augmente |

Les seuils se trouvent par dichotomie scriptée sur le CO₂, et la config se pose **sur** le seuil :
quasi pas de changement de ppm, une T° radicalement différente. Le 2026-09-24 (bary 62 %, vraies
dates, deux glaciations) : entrée Sturtien 1a = ⛄ 72,1 ppm ; sortie 1b 10 262,5 ppm ; entrée Marinoen
🏂 2 556,7 ppm (le voile de 🏂 bascule) ; sortie 1c 9 797,1 ppm. hysteresis 2 : aucune bascule (pas
de calotte continentale). ⚠️ Toujours mesurer sur la CHAÎNE DE CLICS complète : un chemin raccourci
avait donné 3 419 ppm pour 1a, faux au vrai clic.

**Chrome resté ouvert** : un script interrompu peut laisser un Chrome headless sur le port 9333 ; la
mesure suivante tournait alors dans SON onglet, avec le TIMELINE qu'il avait modifié en mémoire.
Depuis `run.py` v1.1.0, on ne s'attache qu'à l'onglet portant son propre `?cb=`. Encadré complet : `API_BILAN/config/configTimeline.js`,
« ÉPOQUES D'HYSTÉRÉSIS ».

### La dichotomie : `seuils_hysteresis.js` (depuis le 2026-09-24)

```bash
python3 scripts/bench_headless/run.py seuils_hysteresis.js --var __SEUILS__ --timeout 3000
```

Mesure les quatre frontières (F1 entrée Sturtien = CO₂ de 1a et ⛄, F2 sortie 1b, F3 entrée Marinoen
🏂, F4 sortie 1c) sur la chaîne de clics depuis la frise 🪸, dans l'ordre, à 0,05 % près. Ne touche au
TIMELINE qu'en mémoire : on reporte ensuite les valeurs dans la config, avec la mesure en commentaire.
À relancer après TOUT changement de physique — le 2026-09-24, passer le flux intérieur des valeurs
posées à la main (~0,15 W/m²) au bilan d'énergie (~0,07 W/m², `API_BILAN/geology/interieur.js`) a suffi
à laisser la Terre en boule de neige jusqu'à aujourd'hui.

### v1.3.0 : on rejoue les clics, et frise = clic

Les passages rejouent **tous** les tictimes, comme l'interface : frise sur l'époque d'avant, puis chaque
💫 (🔀 fait glisser les masses vers l'époque suivante pendant ces clics), puis 🗻 / 🌋 / ⛰. Un chemin
raccourci (graine → époque suivante) donne un autre seuil : c'est ce qui a fait croire, le 2026-09-23,
que ⛄ tombait à −62 °C alors qu'au vrai clic il restait à 0 °C.

Critère final **frise = clic** : pour 1a, ⛄, 1b et hysteresis 2, la T° depuis la graine doit égaler la
T° d'arrivée par clic (écart < 0,5 °C). La graine d'une hystérésis est la T° d'ARRIVÉE du clic (1a :
10,4 °C, l'état de 🪸 après ses 💫), pas la T° convergée : à la frontière, c'est elle qui choisit la branche.

## Ce que le banc NE teste pas

La section « époques » relance chaque époque depuis sa graine (`animEnabled:false`) : elle ne dit rien
des hystérésis — c'est le rôle de la section « passages » ci-dessus.
