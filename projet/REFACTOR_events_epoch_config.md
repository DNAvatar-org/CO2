# Rapport refactor – events.js : switch époque et config unique

**Refactor terminé** (2025-02-25)  
**Fichiers concernés :** `static/timeline/events.js`, `API_BILAN/config/configTimeline.js`

---

## 1. Problème : répétition et if multiples

- **Switch manquant** : les branches par époque sont faites avec `if (currentEpochName === 'Corps noir')` puis `else if (currentEpochName === 'Hadéen')` puis `else`. À remplacer par un **switch sur l’id d’époque** (`DATA['📜']['🗿']` : `'⚫'`, `'🔥'`, etc.) pour une seule source de vérité et une structure plus lisible.
- **Valeurs Hadéen en dur** : `4.5e9`, `4.0e9`, `2000000`, `0.3` sont répétées dans events.js alors qu’elles existent déjà dans **configTimeline.js** :
  - `'▶': 4.5e9`, `'◀': 4.0e9` (début/fin Hadéen en années)
  - `'🕰': { '💫': { '🔺🧲🌕💫': { '▶': 2000000, '◀': 0.3 } } }` (flux géothermique début/fin)
- **Ids incohérents** : la timeline construite dans `loader_panels.js` utilise l’**id emoji** (`id: epochId` → `'⚫'`, `'🔥'`). Dans events.js on trouvait encore `e.id === 'corps-noir'` et `e.id === 'hadeen'` qui ne matchent jamais → répétition de logique et risque de bugs.

---

## 2. Scan des occurrences (avant refactor)

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

**Source unique config (API_BILAN/config/configTimeline.js) :**

- Corps noir : `'📅': '⚫'`, `'▶': 5.0e9`, `'◀': 4.5e9`, `'🕰': { '☄️': { '🔺⚖️💧☄️': 2e19 }, '🎇': { '⏩': '🔥' } }`
- Hadéen    : `'📅': '🔥'`, `'▶': 4.5e9`, `'◀': 4.0e9`, `'🕰': { '💫': { '🔺⏳': 50, '🔺🧲🌕💫': { '▶': 2000000, '◀': 0.3 } }, '☄️': { '🔺⚖️💧☄️': 1e18 } }`

---

## 3. Actions réalisées

- **Switch (epochId)** avec cases `'⚫'`, `'🔥'` et `default`.
- Helper **getEpochConfigById(epochId)** et **applyHadeenFluxFromConfig()** ; flux et bornes Hadéen lus depuis config (▶, ◀, 🕰.💫.🔺🧲🌕💫).
- Tous les `e.id === 'corps-noir'` remplacés par `e.id === '⚫'` ; tous les `e.id === 'hadeen'` par `e.id === '🔥'`.
- Hadéen météorite : masse depuis `epoch['🕰']['☄️']['🔺⚖️💧☄️']` (config unique).

---

## 4. Statut

- **Validé** : switch(epochId), config unique, ids emoji ⚫/🔥 partout dans `static/timeline/events.js`.
- **Validé** : Config source de vérité dans `API_BILAN/config/configTimeline.js`.

---

## 5. Résumé

- **Switch** : une seule structure `switch (epochId)` pour Corps noir / Hadéen / autres.
- **Config unique** : toutes les valeurs numériques d’époque (▶, ◀, flux début/fin, masse eau météorite) viennent de **API_BILAN/config/configTimeline.js** via l’objet epoch (id emoji), sans duplication dans events.js.
- **Ids** : partout utiliser l’id emoji (`'⚫'`, `'🔥'`) comme dans le loader et la config.
