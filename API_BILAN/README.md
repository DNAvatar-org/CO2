# API_BILAN

API de calcul du bilan radiatif (sans rendu). Entrée : partie epoch (epochId, etc.). Sortie : calculs intermédiaires par **callback synchrone** via une **pile de listeners** (côté API on ajoute des fonctions à appeler à chaque pas).

Chargeable depuis `index.html`, `visu_radiatif.html` ou `scie_compute.html`. Fonctions regroupées dans `window.FUNC_API_BILAN`.

## Entrée / sortie

- **Entrée** : une **config** `{ epochId?, animEnabled?, ticTime?, tuning? }` **ou** un **identifiant d’époque** (string, ex. `'⚫'`). Si seul un identifiant est passé, c’est celui passé en paramètre qui est utilisé ; sinon `config.epochId` ou, à défaut, `FUNC_API_BILAN.defaultEpochId` (`'⚫'`).
- **Sortie** : callback `(event, payload)` passé à la création de l’instance.
  - `event` : `'convergenceStep'` | `'cycleCalcul'` | `'ProcessFinished'`.
  - Le récepteur dispatch pour le rendu (visu + scie ou contexte local).

## Pile de callbacks (callback stack)

Comme on branche un listener : côté API on ajoute à une **pile de fonctions** à appeler. À chaque pas de calcul intermédiaire, la pile est appelée de façon **synchrone** (toutes les fonctions, dans l’ordre).

- **Fichier** : `callback_stack.js` (charger avant `api.js`).
- **API** : `FUNC_API_BILAN.callbackStack.push(fn)`, `.pop()`, `.run(event, payload)`, `.length()`.
- Lors de `api.run()` : l’API push le receiver sur la pile et passe à `computeRadiativeTransfer` un dispatcher qui appelle `callbackStack.run(event, payload)`. Les fonctions de calcul (dans API_BILAN) appellent le callback qu’on leur passe ; ce dispatcher fait remonter les events à toute la pile. Aucun appel supplémentaire à `callbackStack.run()` dans le code de calcul n’est nécessaire.

## Ce qui ne concerne que l’API (à terme dans API_BILAN)

À réfléchir pour regroupement / déplacement :

| Contenu | Rôle | Note |
|--------|------|------|
| **Partie epoch en entrée** | Déjà : config.epochId → DATA['📅'], DATA['📜'] | Reste dans api.js |
| **Pile de callbacks** | Déjà : callback_stack.js | Dans API_BILAN |
| **static/compute/** | alphabet, dico, initDATA, compute.js, **calculations_flux.js** | Calcul pur ; déplacer dans API_BILAN = bundle autonome. Modifier les fonctions pour appeler la pile en plus du callback si besoin. |
| **model_tuning.js** | Tuning (tuning par epoch / config) | Dépendance calcul ; peut vivre dans API_BILAN ou rester chargé avant. |
| **Data / initDATA** | Structure DATA, init depuis epoch | Si l’API doit être autonome, initDATA (et données minimales) dans API_BILAN. |

Les fichiers **static/calculations_*.js**, **physics.js**, **climate.js**, **hitran.js**, **flux_manager.js**, **event_bus.js** sont des dépendances de calcul ; soit on les charge avant l’API (comme aujourd’hui), soit on les déplace/copie dans API_BILAN pour un bundle unique.

## Données (API_BILAN/data/)

- **alphabet.js**, **dico.js**, **initDATA.js** — sémantique et structure DATA.
- **hitran_lines_CO2.js**, **hitran_lines_H2O.js**, **hitran_lines_CH4.js** — utilisés par le calcul (chargés en `<script>`, exposent `window.HITRAN_LINES_*` pour `spectroscopy/hitran.js`).
- **hitran_lines_*.json** — même contenu que les .js ; pas chargés par le code actuel. Utiles comme source, pour outillage ou chargement `fetch()` futur. Conservés dans l’API pour centraliser.

## Config & entrée epoch (dans API_BILAN)

Les fichiers **Config & entrée epoch** sont dans `API_BILAN/config/` :

- `config/configTimeline.js` — TIMELINE (époques)
- `config/model_tuning.js`, `config/model_tuning_biblio.js` — TUNING
- `config/fine_tuning_bounds.js` — FINE_TUNING_BOUNDS

Le loader principal charge ces scripts depuis `API_BILAN/config/`. Les pages autonomes (ex. `html/scie_compute.html`) peuvent continuer à charger les anciens chemins `static/tuning/` et `static/timeline/` ou être mis à jour vers `API_BILAN/config/`.

## Dépendances (ordre de chargement)

Le loader principal (`static/loader_panels.js`) charge dans l’ordre :

1. **API_BILAN/config/** — model_tuning, model_tuning_biblio, configTimeline
2. **API_BILAN/data/** — alphabet, dico, initDATA, hitran_lines_CO2/H2O/CH4
3. organigramme/configOrganigramme, static/event_bus
4. **API_BILAN/convergence/compute.js**, static/flux_manager
5. static/tooltips, modal, patterns
6. **API_BILAN/physics/** — physics, (log_display), hitran data, **API_BILAN/spectroscopy/hitran**, **API_BILAN/physics/climate**
7. **API_BILAN/atmosphere/**, **API_BILAN/albedo/** — calculations_atm, calculations_albedo
8. organigramme/organigramme
9. **API_BILAN/geology/**, **API_BILAN/h2o/**, **API_BILAN/radiative/**, **API_BILAN/convergence/calculations_flux**
10. **API_BILAN/callback_stack.js**, **API_BILAN/api.js**, **API_BILAN/receiver.js**
11. static/shell, FPS, plot, layout, integrateEds, events, timeline, main

Tout le **calcul** (sans DOM/Plotly) est sous API_BILAN (config, data, physics, spectroscopy, atmosphere, albedo, h2o, radiative, convergence, geology) ; flux_manager et le reste restent en static/ (affichage ou partagés).

## Usage

```js
var FUNC = window.FUNC_API_BILAN;
var receiver = FUNC.createReceiver({ dispatchVisu: true, dispatchScie: true });
var api = new FUNC.BilanRadiatifAPI(receiver);
// Entrée : config complète ou identifiant d'époque seul
api.run({ epochId: '⚫', animEnabled: false }).then(function (result) { ... });
api.run('🦠');  // identifiant seul = époque utilisée
api.run();      // sans argument = FUNC_API_BILAN.defaultEpochId ('⚫')
```

Compatibilité : `window.BilanRadiatifAPI` et `window.createBilanRadiatifReceiver` restent exposés.

## Workers (API_BILAN/workers/)

- **spectral_slice_worker.js** — tranche spectrale (parallélisation bande λ). Les constantes Planck/Boltzmann/c sont dans `CONST` (physics) ; le main thread doit passer `constants: { PLANCK_H, SPEED_OF_LIGHT, BOLTZMANN_KB, MAX_PLANCK_SAFE }` (depuis `window.CONST`) dans chaque message `slice` pour éviter de dupliquer. Si absentes, le worker utilise des fallbacks.
- **compute_worker.js** — stub pour déporter le calcul (cycles) hors du main thread.

Création du worker : `new Worker('API_BILAN/workers/spectral_slice_worker.js')` (ou chemin relatif depuis la page).

## Fichiers

- **callback_stack.js** : pile de listeners, `push` / `pop` / `run(event, payload)`.
- **api.js** : `FUNC_API_BILAN.BilanRadiatifAPI(callback)`, `run(configOrEpochId)` → Promise ; `defaultEpochId` = défaut si aucun argument. Branche le callback sur la pile et passe un dispatcher à `computeRadiativeTransfer`.
- **receiver.js** : `FUNC_API_BILAN.createReceiver(options)` → callback pour dispatch visu/scie.
- **STRUCTURE.md** : catégories de calculs, étapes du pipeline, liste des JS par catégorie, proposition de rangement dans `API_BILAN/` (config, data, physics, spectroscopy, atmosphere, albedo, h2o, radiative, convergence).
- **README.md** : ce fichier.
