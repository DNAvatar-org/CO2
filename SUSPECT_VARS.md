# Variables suspectes `window.texteEnMinuscule`

## Variables qui devraient être dans `DATA` ou supprimées

### 🌬️ Atmosphère / Composition
- ✅ `window.albedo` → `DATA['🪞']` **FAIT** (calculations_albedo.js)
- ✅ `window.albedoReflectorCoeff` → `CONST.ALBEDO_REFLECTOR_COEFF` **FAIT** (déplacé dans physics.js - constantes physiques)
- `window.atmosphericComposition` → `DATA['🌬']`
- ✅ `window.soleil` → `DATA['☀️']` **FAIT** (supprimé de compute.js, utilise DATA directement)

### 💧 H2O / Eau
- ✅ `window.h2o` → `DATA['💧']` **FAIT** (calculations_albedo.js)
- `window.h2oVaporPercent` → `DATA['💧']['🍰⏳🌧']` (fraction, pas %)
- `window.h2oTotalFromMeteorites` → `DATA['📜']['🔺⚖️💧☄️']` ou calculé
- `window.h2oIceFractionFromCalculation` → `DATA['💧']['🍰💧🧊']`

### 🌡️ Température / Époque
- ✅ `window.currentEpochIndex` → `DATA['📜']['👉']` **FAIT** (test_computeRadiativeTransfer.html)
- ⚠️ `window.currentEpochName` → `DATA['📜']['🗿']` (logo) ou `DATA['📅']['📅']` **EN COURS** (fait dans test_computeRadiativeTransfer.html, reste dans calculations_albedo.js, calculations.js, main.js, plot.js)
- ⚠️ `window.epoch` → `DATA['📅']` **EN COURS** (reste dans calculations.js)
- `window.current_T0_adjusted` → `DATA['⏳']['🌡️']`
- `window.infoTimeMa` → `DATA['📜']['📿💫']` ou calculé depuis timeline

### 🧲 Flux / Forçage
- `window.flux` → `DATA['🧲']`
- `window.flux_diff_max` → À vérifier (calculé ou dans DATA ?)
- `window.flux_diff_min` → À vérifier (calculé ou dans DATA ?)
- ⚠️ `window.enabledStates` → `DATA['🔘']` **EN COURS** (reste dans calculations.js)

### ⚙️ Configuration / Paramètres
- `window.maximiseData` → À vérifier (flag de config ?)
- `window.savedCO2` → `DATA['📜']['⚖️🏭']` ou backup ?
- `window.savedCH4` → `DATA['📜']['⚖️⛽']` ou backup ?
- `window.savedH2O` → `DATA['📜']['⚖️💧']` ou backup ?
- `window.convergencePrecision_K` → `DATA['⏳']['🧲🔬']`

### 🌋 Volcanisme / Bonus
- `window.volcanoIceReduction` → `DATA['📜']` ou calculé ?
- `window.volcanoH2OBonus` → `DATA['📜']` ou calculé ?

### 📊 Plot / Affichage
- `window.plotData` → À vérifier (données d'affichage ou calcul ?)
- `window.currentBlackBodyColor` → Calculé depuis `DATA['⏳']['🌡️']`
- `window.currentMeteoriteCount` → `DATA['📜']['📿☄️']`

### 🔘 États / Flags
- `window.methaneEnabled` → `DATA['🔘']['🔘⛽📛']`
- `window.waterVaporEnabled` → `DATA['🔘']['🔘💧📛']`
- `window.isAnim` → `DATA['🔘']['🔘🎬']`
- `window.isAlbedo` → `DATA['🔘']['🔘🪞']`
- `window.isCO2_eds` → `DATA['🔘']['🔘🏭📛']`
- `window.isCH4_eds` → `DATA['🔘']['🔘⛽📛']`
- `window.isH2O_eds` → `DATA['🔘']['🔘💧📛']`

### 📐 Configuration Organigramme
- `window.configOrganigramme` → OK (config statique)
- `window.timeline` → `window.TIMELINE` (déjà corrigé)

### ⚠️ Variables à analyser plus en détail
- `window.charsImages` → OK (config statique)
- `window.astronomie` → OK (module)
- `window.planckFunction` → OK (fonction utilitaire)
- `window.fps*` → OK (système FPS)
- `window.timelineFrame` → À vérifier
- `window.timelineLastUpdate` → À vérifier
- `window.timelineRunning` → À vérifier

## État d'avancement

### ✅ Terminé
1. ✅ **`window.soleil`** supprimé - utilise `DATA['☀️']` directement
2. ✅ **`window.albedo`** supprimé - utilise `DATA['🪞']` directement
3. ✅ **`window.h2o`** remplacé par `DATA['💧']` dans `calculations_albedo.js`
4. ✅ **`window.currentEpochIndex`** remplacé par `DATA['📜']['👉']` dans `test_computeRadiativeTransfer.html`

### ⚠️ En cours
1. ⚠️ **`window.currentEpochName`** - Fait dans `test_computeRadiativeTransfer.html`, reste dans :
   - `calculations_albedo.js` (3 occurrences)
   - `calculations.js` (20+ occurrences)
   - `main.js` (10+ occurrences)
   - `plot.js` / `courbes/plot.js` (10+ occurrences)

2. ⚠️ **`window.epoch`** - Reste dans `calculations.js` (20+ occurrences)

3. ⚠️ **`window.enabledStates`** - Reste dans `calculations.js` (3 occurrences)

### 📋 À faire
1. **Remplacer `window.currentEpochName`** dans les fichiers restants
2. **Remplacer `window.epoch`** par `DATA['📅']` dans `calculations.js`
3. **Remplacer `window.enabledStates`** par `DATA['🔘']` dans `calculations.js`
4. **Remplacer `window.h2o*`** (h2oVaporPercent, h2oTotalFromMeteorites, etc.)
5. **Remplacer les flags** (`window.methaneEnabled`, `window.waterVaporEnabled`, etc.)

## Fichiers modifiés
- ✅ `static/compute/compute.js` - Supprimé `window.soleil = DATA['☀️']`
- ✅ `static/calculations_albedo.js` - Supprimé `window.albedo`, remplacé `window.h2o` par `DATA['💧']`
- ✅ `static/compute/test_computeRadiativeTransfer.html` - Remplacé `window.currentEpochIndex` et `window.currentEpochName`

## Fichiers à modifier
- ⚠️ `static/calculations.js` - `window.currentEpochName`, `window.epoch`, `window.enabledStates`
- ⚠️ `static/calculations_albedo.js` - `window.currentEpochName` (3 occurrences)
- ⚠️ `static/main.js` - `window.currentEpochName` (10+ occurrences)
- ⚠️ `static/plot.js` - `window.currentEpochName` (10+ occurrences)
- ⚠️ `static/courbes/plot.js` - `window.currentEpochName` (10+ occurrences)
