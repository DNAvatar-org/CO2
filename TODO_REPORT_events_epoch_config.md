# Rapport TODO – events.js : switch époque et config unique

**Date:** 2025-02-25  
**Fichiers concernés:** `static/events.js`, `static/timeline/configTimeline.js`  
**Versions:** events.js 1.1.0, configTimeline.js 1.2.4

---

## 1. Problème : répétition et if multiples

- **Switch manquant** : les branches par époque sont faites avec `if (currentEpochName === 'Corps noir')` puis `else if (currentEpochName === 'Hadéen')` puis `else`. À remplacer par un **switch sur l’id d’époque** (`DATA['📜']['🗿']` : `'⚫'`, `'🔥'`, etc.) pour une seule source de vérité et une structure plus lisible.
- **Valeurs Hadéen en dur** : `4.5e9`, `4.0e9`, `2000000`, `0.3` sont répétées dans events.js alors qu’elles existent déjà dans **configTimeline.js** :
  - `'▶': 4.5e9`, `'◀': 4.0e9` (début/fin Hadéen en années)
  - `'🕰': { '💫': { '🔺🧲🌕💫': { '▶': 2000000, '◀': 0.3 } } }` (flux géothermique début/fin)
- **Ids incohérents** : la timeline construite dans `loader_panels.js` utilise l’**id emoji** (`id: epochId` → `'⚫'`, `'🔥'`). Dans events.js on trouve encore `e.id === 'corps-noir'` et `e.id === 'hadeen'` qui ne matchent jamais → répétition de logique et risque de bugs.

---

## 2. Scan des occurrences

| Fichier     | Ligne(s) | Problème |
|------------|----------|----------|
| events.js  | 56       | `if (currentEpochName === 'Corps noir')` → à mettre dans `switch(epochId)` case `'⚫'` |
| events.js  | 108–112  | `currentEpochName === 'Hadéen'` + `hadeanStart = 4.5e9`, `hadeanEnd = 4.0e9` → lire `epoch['▶']`, `epoch['◀']` et flux depuis config |
| events.js  | 139      | `e.id === 'corps-noir'` → `e.id === '⚫'` (ou epochId courant) |
| events.js  | 175      | `else if (currentEpochName === 'Hadéen')` → case `'🔥'` dans le switch |
| events.js  | 203–212  | `e.id === 'hadeen'` + flux/totalDuration en dur → id `'🔥'` + config `🕰.💫.🔺🧲🌕💫` et `▶`/`◀` |
| events.js  | 234      | `e.id === 'hadeen'` → `e.id === '🔥'` |
| events.js  | 259      | `e.id === 'hadeen'` → `e.id === '🔥'` |
| events.js  | 277–285  | `e.id === 'hadeen'` + `hadeanStart`/`hadeanEnd`/flux en dur → id `'🔥'` + config |

**Source unique config (configTimeline.js) :**

- Corps noir : `'📅': '⚫'`, `'▶': 5.0e9`, `'◀': 4.5e9`, `'🕰': { '☄️': { '🔺⚖️💧☄️': 2e19 }, '🎇': { '⏩': '🔥' } }`
- Hadéen    : `'📅': '🔥'`, `'▶': 4.5e9`, `'◀': 4.0e9`, `'🕰': { '💫': { '🔺⏳': 50, '🔺🧲🌕💫': { '▶': 2000000, '◀': 0.3 } }, '☄️': { '🔺⚖️💧☄️': 1e18 } }`

---

## 3. Actions TODO (catégorisées)

- **À faire**
  - Remplacer la chaîne `if / else if / else` sur l’époque par un **switch (epochId)** avec cases `'⚫'`, `'🔥'` et `default`.
  - Introduire une fonction helper (ex. `getEpochConfigById(epochId)`) qui retourne l’entrée timeline pour un `epochId` (éviter de répéter `configOrganigramme.timeline.find(...)`).
  - Pour toute mise à jour du flux géothermique Hadéen : lire **début/fin d’époque** dans `epoch['▶']` et `epoch['◀']`, et **flux début/fin** dans `epoch['🕰']['💫']['🔺🧲🌕💫']['▶']` et `['◀']` (plus de 4.5e9, 4.0e9, 2000000, 0.3 en dur).
  - Remplacer tous les `e.id === 'corps-noir'` par `e.id === '⚫'` (ou usage de l’epoch courant via `DATA['📜']['🗿']`).
  - Remplacer tous les `e.id === 'hadeen'` par `e.id === '🔥'`.
  - Pour Hadéen, météorite de glace : lire la masse dans **config emoji** `epoch['🕰']['☄️']['🔺⚖️💧☄️']` (comme pour Corps noir), plus de `epoch.events.ice_meteorite`.

- **À vérifier**
  - Après refactor, s’assurer qu’il n’y a plus de référence à `'corps-noir'` ou `'hadeen'` dans events.js (grep).
  - Vérifier que `updateHadeenTexture` (main.js) et autres usages de la config Hadéen restent cohérents avec cette même config (pas de double définition des bornes).

---

## 4. Statut (après correctifs)

- **Validé** : switch(epochId) avec cases `'⚫'`, `'🔥'`, default.
- **Validé** : Helper `getEpochConfigById(id)` et `applyHadeenFluxFromConfig()` ; flux et bornes Hadéen lus depuis config (▶, ◀, 🕰.💫.🔺🧲🌕💫).
- **Validé** : Plus aucune référence à `'corps-noir'` ou `'hadeen'` dans events.js ; ids emoji ⚫/🔥 partout.
- **Validé** : Hadéen météorite : masse depuis 🕰.☄️.🔺⚖️💧☄️ (config unique).

---

## 5. Résumé

- **Switch** : une seule structure `switch (epochId)` pour Corps noir / Hadéen / autres.
- **Config unique** : toutes les valeurs numériques d’époque (▶, ◀, flux début/fin, masse eau météorite) viennent de **configTimeline.js** via l’objet epoch (id emoji), sans duplication dans events.js.
- **Ids** : partout utiliser l’id emoji (`'⚫'`, `'🔥'`) comme dans `loader_panels` et la config.
