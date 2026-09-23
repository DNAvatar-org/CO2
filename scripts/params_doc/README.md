# 🔎 Paramètres — la page engendrée depuis le code

```bash
python3 CO2/scripts/params_doc/generate.py
```

Écrit `API_BILAN/demo/parametres.html`, liée au footer du site après 📖 Dictionnaire.
**Ne jamais éditer le HTML à la main** : il est réécrit à chaque exécution.

## Ce qu'elle montre

Pour chaque clé du dictionnaire et chaque constante nommée (`CONST` · `CONV` · `EARTH` ·
`CLOUD_SW`), repliable :

- **son unité, DÉDUITE du symbole** — jamais recopiée à la main ;
- sa description et sa formule (depuis `dico.js`) ;
- **toutes les lignes où elle est écrite**, et **toutes celles où elle est lue**, en
  `fichier:ligne` avec le code ;
- un avertissement si elle n'apparaît nulle part — code mort.

Périmètre : `API_BILAN/` (le moteur) **et** `CO2/static/`, `CO2/organigramme/` (l'interface).
Les deux, sinon la page crie au loup : les `CONST.LAMBDA_*` ne sont lues que par le tracé.

## Le contrôle qui fait échouer la génération

Le script **refuse d'écrire** si une clé `🍰` ne dit pas de quoi elle est une proportion —
c'est-à-dire si son 2ᵉ caractère n'est pas une nature connue :

```
🫧 massique (atmosphère) · 💧 massique (eau) · 🧪 MOLAIRE
🪩 🗻 de surface · 📛 d'énergie · ⚽ obstruction
```

Il sort en code 1, nomme la clé fautive, et n'écrit rien.

**Pourquoi ce contrôle existe** : la confusion massique/molaire a produit **trois bugs distincts**
dans ce modèle — `ln_H2O`, `computePWV`, `calculateMolarMassAir` — parce que `🍰🧮🌧` était une
fraction molaire rangée au milieu de fractions massiques, sans que le symbole le dise. Elle a été
renommée `🍰🧪🌧` le 2026-09-23. Ce contrôle est là pour qu'il n'y ait pas de quatrième fois.

Vérifié : remettre l'ancien nom fait bien échouer la génération.

## Aucune unité inconnue (v1.1.0, 2026-09-23)

Le script échoue aussi, code 1, si :

- une **clé** a un 1ᵉʳ caractère que `UNITE_1` ne connaît pas. Les préfixes `🔺` (Δ), `🧮` (calcul
  courant) et `🔁` (état de cycle) laissent l'unité au caractère suivant ; les clés d'interface
  (📝 🖼 🌙 🔘 ⚧ ☯ 🔄) sont typées (texte, signe, compteur) — jamais « inconnues » ;
- une **constante** n'a pas son unité entre crochets en tête du commentaire de sa définition :

```js
CONST.T_TRIPLE_WATER = 273.16;      // [K] point triple de l'eau (IAPWS)
CLOUD_SW: { CCN_BASE: 0.15,         // [sans dimension (proxy CCN relatif)]
```

Définitions lues dans `physics/physics.js` (CONST · CONV · EARTH) et dans le bloc `CLOUD_SW` de
`data/initDATA.js` — une constante par ligne. La valeur est **évaluée** (`10 * CONV.SECONDS_PER_DAY
= 864000`) ; pour les CLOUD_SW pilotées par le barycentre, la page donne aussi la plage
`fine_tuning_bounds.js` qui écrase le défaut au chargement.

## Où vit la règle

`API_BILAN/data/alphabet.js`, bloc « LA RÈGLE DE L'ALPHABET ». Le script en est le gardien, pas la
source : si une nature manque, c'est soit la clé qui est mal nommée, soit `NATURE_2` du script qui
doit apprendre une nature nouvelle — et dans ce cas il faut d'abord l'ajouter à l'alphabet.
