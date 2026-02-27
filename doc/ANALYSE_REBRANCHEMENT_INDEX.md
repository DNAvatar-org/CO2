# Analyse : Architecture index.html et moteurs de calcul

**Objectif** : Documenter l'architecture actuelle (onglets Visuel/Scientifique) et les deux moteurs de calcul.

**Date** : 2025-02-03 (mise à jour 2025-02-04)

---

## 1. Architecture actuelle (implémentée)

### 1.1 Structure index.html

- **Onglets** : Visuel | Scientifique (tabs-bar)
- **loader_panels.js** : charge `visu_radiatif.html` et `scie_radiatif.html` dans les panels
- **visu-panel** : contenu visuel (organigramme, plot, planète, flux)
- **scie-panel** : iframe vers `html/scie_compute.html` (config, convergence, timeline horizontale)
- **event_bus.js** : `compute:done` → slots visu + scie (si implémenté)

### 1.2 Deux chemins de calcul distincts

| Page | Moteur | Fichier | Point d'entrée |
|------|--------|---------|----------------|
| **Visuel** (index.html) | `simulateRadiativeTransfer()` | calculations.js | `updateCO2LevelDirect()` / `updateH2OLevelDirect()` |
| **Scientifique** (html/scie_compute.html) | `computeRadiativeTransfer()` | calculations_flux.js | `runTest()` → `initForConfig()` + `computeRadiativeTransfer()` |

### 1.2 Flux index.html (actuel)

```
setEpoch(epochName)
  → updateLevelsConfig()  // plotData.co2_ppm, ch4_ppm, h2oVaporPercent
  → updateCO2LevelDirect(co2_fraction)

updateCO2LevelDirect(co2_fraction)
  → setTimeout → simulateRadiativeTransfer(co2_fraction, { CH4_fraction })
  → Promise.then(processResult)
  → processResult(data)  // data = { T0, total_flux, albedo, cloud_coverage, ... }
  → plotData.current = data
  → updatePlot(), updateLegend(), updateFluxLabels(), etc.
```

### 1.3 Flux Scientifique (html/scie_compute.html)

```
runTest()
  → initializeGlobals()  // DATA['📅'], DATA['📜'], etc.
  → getEpochDateConfig()
  → initForConfig()      // Config sans calcul radiatif
  → DATA['🧮']['previous'] = []
  → computeRadiativeTransfer()  // = runRadiatifOnly()
  → displayConvergence()
  → displayResults()
```

**Note** : `doc/test_computeRadiativeTransfer.html` est un backup (NE PAS TOUCHER). La vue scientifique active est `html/scie_compute.html` chargée en iframe.

### 1.4 Format attendu par processResult (index.html)

```javascript
{
  T0: number,              // Température surface (K)
  temp_surface: number,    // Alias
  temp_surface_c: number,  // °C
  total_flux: number,      // Flux au sommet atmosphère (W/m²)
  effective_temperature: number,
  albedo: number,
  cloud_coverage: number,
  lambda_range, lambda_weights, z_range,
  upward_flux, optical_thickness, emitted_flux, absorbed_flux, earth_flux
}
```

---

## 2. Différences clés entre les deux moteurs

| Aspect | simulateRadiativeTransfer | computeRadiativeTransfer |
|--------|---------------------------|---------------------------|
| **Entrée** | co2_fraction, options | DATA (pré-rempli par initForConfig) |
| **Cycle eau** | Intégré dans calculations.js | cycleDeLeau() + crossing 0°C/T_boil |
| **Convergence** | Dichotomie / Search dans calculations.js | runRadiatifOnly() (Search + Dicho) |
| **Sortie** | Retourne objet via resolve() | Écrit dans DATA['🧮'], DATA['🧲'], DATA['📛'], DATA['📊'] |
| **Spectre** | calculateFluxForT0() → DATA['📊'] | Idem (même calculateFluxForT0) |

---

## 3. Dépendances partagées (à ne pas casser)

Les deux chemins utilisent :

- `calculations.js` : `calculateFluxForT0()`, `getSpectralResultFromDATA()`, `temperatureAtZ()`
- `calculations_h2o.js` : `calculateH2OParameters()`, `calculatePrecipitationFeedback()`
- `calculations_albedo.js` : `calculateAlbedo()`
- `calculations_atm.js` : `calculateAtmosphereComposition()`
- `compute.js` : `getMasses()`, `getEpochDateConfig()`, `getEnabledStates()`
- `physics.js` : CONST
- `configTimeline.js` : TIMELINE

**html/scie_compute.html** charge ces scripts avec des chemins relatifs depuis `doc/` (ex: `../static/calculations.js`).

---

## 4. Synchronisation plotData ↔ DATA

### 4.1 Chaîne actuelle (simulateRadiativeTransfer)

- `simulateRadiativeTransfer()` **ne prend pas de paramètres** : il lit `DATA['🫧']['🍰🫧🏭']` directement (ligne 862 calculations.js).
- `DATA['🫧']` est rempli par `calculateAtmosphereComposition()` qui lit `DATA['⚖️']`.
- `DATA['⚖️']` est rempli par `getMasses()` qui lit `EPOCH` (TIMELINE).
- `getMasses()` est appelé depuis `getEpochDateConfig()` (compute.js), lui-même appelé depuis `initForConfig()` (calculations_flux.js).
- **index.html** : `setEpoch` appelle `updateLevelsConfig()` puis `updateCO2LevelDirect()`. `updateLevelsConfig` a besoin de `DATA['⚖️']['⚖️🫧']` et `DATA['🫧']['🧪']` → ces valeurs doivent exister avant. L’origine de la première initialisation de DATA reste à tracer (organigramme, flux_manager, ou premier calcul).

### 4.2 Pour computeRadiativeTransfer depuis index.html

| Source (index) | Cible (DATA) | Comment |
|----------------|--------------|---------|
| plotData.co2_ppm | DATA['⚖️']['⚖️🏭'] ou DATA['🫧']['🍰🫧🏭'] | Convertir ppm → masse ou fraction avant initForConfig |
| plotData.ch4_ppm | DATA['⚖️']['⚖️⛽'] ou DATA['🫧']['🍰🫧⛽'] | Idem |
| h2oVaporPercent + h2oTotalFromMeteorites | DATA['⚖️']['⚖️💧'] | getMasses lit EPOCH ; override possible si on modifie EPOCH ou DATA avant getMasses |
| DATA['📜']['👉'], DATA['📜']['🗿'] | setEpoch initialise | Déjà fait dans setEpoch |

**Option A** : Modifier `getMasses()` pour accepter un override depuis plotData (si co2_ppm défini, convertir en masse et écraser EPOCH['⚖️🏭']).

**Option B** : Appeler `getMasses()` puis `calculateAtmosphereComposition()`, puis **écraser** `DATA['🫧']['🍰🫧🏭']` et `DATA['🫧']['🍰🫧⛽']` avec les fractions issues de plotData avant `initForConfig()`.

---

## 5. Plan d'action proposé

### Phase 1 : Adapter sans toucher au test

1. **Créer `runComputeForIndex()`** dans `main.js` (ou dans un module dédié) :
   - Sync plotData/window → DATA (CO2, CH4, H2O, époque)
   - Appeler `initForConfig()`
   - Appeler `cycleDeLeau(true)` (premier cycle eau)
   - Appeler `computeRadiativeTransfer()` (async)
   - Transformer DATA → format `final_result_obj` pour processResult
   - Retourner Promise qui resolve avec cet objet

2. **Créer `dataFromComputeToPlotData()`** :
   - DATA['🧮']['🧮🌡️'] → T0, temp_surface, temp_surface_c
   - getSpectralResultFromDATA() → total_flux, lambda_range, etc.
   - DATA['🪩']['🍰🪩📿'] → albedo
   - DATA['🪩']['☁️'] ou équivalent → cloud_coverage

3. **Remplacer l'appel** dans `updateCO2LevelDirect` et `updateH2OLevelDirect` :
   - Au lieu de `simulateRadiativeTransfer(...)`, appeler `runComputeForIndex()`
   - Le reste (processResult, updatePlot, etc.) reste inchangé

### Phase 2 : Gestion de l'annulation

- `simulateRadiativeTransfer` peut être annulé via `window.cancelCalculation`
- `computeRadiativeTransfer` utilise `window.ABORT_COMPUTE`
- S'assurer que `cancelCurrentCalculation()` met aussi `ABORT_COMPUTE = true`

### Phase 3 : Overlay de calcul

- index.html a `#calculation-overlay` (masqué pendant calcul)
- `finalizeResults` dans calculations.js le cache à la fin
- `computeRadiativeTransfer` ne gère pas cet overlay → l'afficher au début de `runComputeForIndex`, le cacher à la fin

---

## 6. Points de vigilance

### 6.1 html/scie_compute.html (vue Scientifique)

- **Ne charge pas main.js** → aucune modification dans main.js ne l'affecte
- **Charge** : debug.js, alphabet.js, dico.js, configOrganigramme.js, configTimeline.js, timeline.js, events.js, physics.js, climate.js, FPS.js, calculations.js, calculations_h2o.js, calculations_albedo.js, calculations_atm.js, compute.js, calculations_flux.js
- **N'a pas** : organigramme (pas de .ergo-button-cell), pas de cell-h2o
- `getEnabledStates()` dans compute.js : cherche `.ergo-button-cell`, `.flux-button-cell` → dans scie_compute, ces éléments n'existent pas → DATA['🔘'] garde des valeurs par défaut (ou undefined).

### 6.2 Éléments DOM requis par calculations_flux / compute

- `getEnabledStates()` : `.ergo-button-cell`, `.flux-button-cell`, `#anim-toggle`
- index.html a ces éléments ; test_computeRadiativeTransfer a `#anim-toggle` et `plot-anim-toggle-checkbox` (créé dynamiquement)

### 6.3 Ordre de chargement des scripts (index.html)

```
configTimeline, alphabet, dico, configOrganigramme,
flux_manager, tooltips, modal, patterns, physics, climate,
calculations_atm, calculations_albedo, organigramme, calculations_geology,
calculations_h2o, calculations, compute, calculations_flux,
FPS, plot, layout, integrateEds, debug, events, timeline, main
```

L'ordre est correct : `calculations_flux` est chargé avant `main.js`.

---

## 7. Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Données CO2/CH4/H2O mal synchronisées | Tester avec époque 1800 (280 ppm) et comparer T finale |
| getEnabledStates() retourne des valeurs différentes | Vérifier que DATA['🔘'] est cohérent entre les deux pages |
| Overlay jamais caché si erreur | try/finally dans runComputeForIndex pour cacher l'overlay |
| Annulation ne fonctionne pas | Exposer ABORT_COMPUTE dans cancelCurrentCalculation |
| Spectre non mis à jour | Appeler updateSpectralVisualization avec getSpectralResultFromDATA() après compute |

---

## 8. Checklist avant implémentation

- [ ] Vérifier comment les sliders CO2/H2O/CH4 modifient les données (ppm vs masses)
- [ ] Vérifier que getMasses() / calculateAtmosphereComposition() peuvent utiliser des valeurs "overridées" depuis plotData
- [ ] Tester html/scie_compute.html après toute modification de calculations_flux.js ou compute.js
- [ ] S'assurer que calculateFluxForT0 (calculations.js) et calculateFluxForT0 (calculations_flux.js ?) sont la même fonction — ils appellent tous deux window.calculateFluxForT0 qui est dans calculations.js

---

## 9. Résumé

**Stratégie** : Créer un pont `runComputeForIndex()` qui :
1. Prépare DATA depuis plotData/window
2. Appelle initForConfig + cycleDeLeau(true) + computeRadiativeTransfer
3. Convertit le résultat DATA → format processResult
4. Retourne une Promise pour compatibilité avec le code existant

**Fichiers à modifier** :
- `static/main.js` : updateCO2LevelDirect, updateH2OLevelDirect, + nouvelle fonction runComputeForIndex
- Éventuellement `static/calculations.js` : garder simulateRadiativeTransfer pour calculateInitialData (scénarios 280/420 ppm) si utilisé, sinon migrer aussi

**Fichiers à ne pas modifier** :
- `doc/test_computeRadiativeTransfer.html` (backup, NE PAS TOUCHER)
- `static/compute/calculations_flux.js` (sauf si besoin d'ajustements mineurs)
- `static/compute/compute.js`

---

## 10. Event/Slots pour synchronisation plotData ↔ DATA

**Idée** : Séparer le moteur des rendus graphiques via un bus d'événements.

```
MOTEUR (calculations_flux, compute)
  │
  ├─ emit('data:sync', { source: 'plotData', co2_ppm, ch4_ppm, h2o_total })
  │     → slot : injecte dans DATA avant initForConfig
  │
  ├─ emit('compute:start')
  ├─ emit('compute:progress', { phase, iteration, ... })
  ├─ emit('compute:done', { DATA })
  │     → slot visu_ : processResult → updatePlot, updateLegend, flux
  │     → slot scie_ : displayConvergence, displayResults
  │
  └─ emit('compute:abort')
```

**Implémentation minimale** :
```javascript
// event_bus.js (ou dans main.js)
window.CO2_EVENTS = {
  on: function(name, fn) { /* ... */ },
  emit: function(name, payload) { /* ... */ }
};
// Sync plotData → DATA : slot sur 'data:sync'
// Rendu visu : slot sur 'compute:done'
// Rendu scie : slot sur 'compute:done'
```

---

## 11. Architecture cible : index.html avec onglets

**Principe** : index.html encapsule 2 vues en onglets, moteur unique, remplissage simultané.

### 11.1 Structure

```
index.html
├── Barre onglets : [ Visuel | Scientifique ]
├── #visu-panel (onglet Visuel)
│   └── Contenu actuel index (organigramme, plot, planète, flux…)
│       → préfixe visu_ sur les IDs (visu-plot-container, visu-flux-diagram…)
├── #scie-panel (onglet Scientifique)
│   └── Clone de test_computeRadiativeTransfer (config, convergence, lexique…)
│       → préfixe scie_ sur les IDs (scie-config, scie-convergence…)
└── Frise timeline (partagée, 1 seule instance)
    → ID unique : timeline-frise ou main-timeline (pas de doublon)
```

### 11.2 Règles (état actuel)

- **doc/test_computeRadiativeTransfer.html** : backup, NE PAS TOUCHER.
- **Visuel** : contenu dans `visu_radiatif.html`, injecté dans `#visu-panel`.
- **Scientifique** : `html/scie_compute.html` chargé en iframe dans `#scie-panel`.
- **Frise** : présente sur les 2 vues → attention aux collisions d’IDs. Une seule frise, noms explicites.
- **Moteur** : émet des events ; les 2 panneaux écoutent et se mettent à jour en parallèle.

### 11.3 Fichiers

| Fichier | Rôle |
|---------|------|
| `index.html` | Container, onglets, chargement des 2 panneaux |
| `visu_radiatif.html` | Fragment HTML panneau Visuel |
| `scie_radiatif.html` | Fragment avec iframe vers html/scie_compute.html |
| `html/scie_compute.html` | Vue scientifique (config, convergence, timeline) |
| `static/loader_panels.js` | Charge visu + scie, scripts applicatifs |
| `static/event_bus.js` | Bus compute:done vers slots visu + scie |

### 11.4 Ordre d’implémentation

1. ✅ Structure index.html avec onglets + 2 divs.
2. ✅ Contenu visuel dans visu_radiatif.html, injecté dans #visu-panel.
3. ✅ #scie-panel avec iframe vers html/scie_compute.html.
4. Brancher le moteur sur le bus d’events.
5. ✅ Slots visu + scie sur compute:done.
