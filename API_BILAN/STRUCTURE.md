# Structure des calculs – catégories, étapes, fichiers JS

Document de référence pour déplacer et ranger les JS de calcul dans `API_BILAN/`. Seuls les modules **calcul pur** (sans DOM / Plotly / canvas) sont concernés.

---

## 1. Types de calculs (catégories)

| Catégorie | Rôle | Sortie / usage |
|-----------|------|----------------|
| **Config & entrée epoch** | Timeline, époques, tuning, structure DATA | TIMELINE, DATA initialisé, 🎚️ |
| **Physique fondamentale** | Constantes, lois, conventions (ΔF, EDS) | CONST, EARTH, climate |
| **Spectroscopie** | Ligne-à-ligne (HITRAN), sections efficaces | τ(λ,T,P), Q(T), S(T), Voigt |
| **Atmosphère** | Pression, structure verticale, fractions (CO2, H2O, …) | 📏🫧, 🎈, niveaux, M_dry |
| **Albedo & nuages** | Albedo surface, glace, CCN, couverture nuageuse | 🍰🪩, ☁️, 🍰🪩⛅ |
| **H2O (vapeur & cycle)** | Vapeur, précipitations, partition liquide/vapeur | 🍰🫧💧, cycle eau |
| **Transfert radiatif** | Flux spectral, EDS, OLR, température effective | flux entrant/sortant, Δ |
| **Orchestration & convergence** | Init run, cycle eau, Search/Dicho, callbacks | convergenceStep, cycleCalcul, ProcessFinished |

---

## 2. Étapes du pipeline (ordre logique)

1. **Entrée** : config (epochId, tuning, …) → choix d’époque, application tuning.
2. **Init données** : TIMELINE + KEYS → DATA (initDATA), masses depuis epoch (getMasses).
3. **Physique / climat** : CONST, constante solaire, conventions (physics, climate).
4. **Atmosphère** : calculateAtmosphereProperties, updateLevelsConfig, hauteur, pression.
5. **Albedo & H2O** : calculateAlbedo, calculateH2OParameters, nuages, glace (calculs couplés).
6. **Cycle eau** (itératif) : cycleDeLeau → albedo + vapeur jusqu’à convergence ou max iter.
7. **Flux radiatif** : grille λ, τ, EDS, flux entrant/sortant (calculations.js).
8. **Convergence** : Search / Dicho sur T pour équilibrer flux (calculations_flux.js), callbacks à chaque pas.

---

## 3. Fichiers JS par catégorie (et par étape)

### Config & entrée epoch

| Fichier actuel | Rôle | Étape |
|----------------|------|--------|
| `static/timeline/configTimeline.js` | TIMELINE (époques, 📅, masses, 🌡️🧮, …) | 1 – Entrée |
| `static/tuning/model_tuning.js` | applyTuningPayload, lien tuning ↔ DATA | 1 |
| `static/tuning/model_tuning_biblio.js` | Références / bornes tuning | 1 |
| `static/tuning/fine_tuning_bounds.js` | Bornes fine-tuning (SOLVER, CLOUD_SW, …) | 1 |
| `static/compute/alphabet.js` | CHARS, getLogo, getLogoKey (sémantique clés) | 2 – Init |
| `static/compute/dico.js` | KEYS (structure des clés DATA) | 2 |
| `static/compute/initDATA.js` | Création DATA depuis KEYS + 🎚️ | 2 |

### Physique fondamentale

| Fichier actuel | Rôle | Étape |
|----------------|------|--------|
| `static/physics.js` | CONST, EARTH, CONV, getH2OVaporEDSScale, lois physiques | 3 |
| `static/climate.js` | Constante solaire, ΔF convention, zone habitable | 3 |

### Spectroscopie (LBL)

| Fichier actuel | Rôle | Étape |
|----------------|------|--------|
| `static/hitran.js` | Q(T), S(T), γ(T,P), Voigt, crossSection*FromLines | 4–7 |
| `static/data/hitran_lines_CO2.js` | Lignes HITRAN CO2 | données |
| `static/data/hitran_lines_H2O.js` | Lignes HITRAN H2O | données |
| `static/data/hitran_lines_CH4.js` | Lignes HITRAN CH4 | données |

### Atmosphère

| Fichier actuel | Rôle | Étape |
|----------------|------|--------|
| `static/calculations_atm.js` | calculateAtmosphereProperties, updateLevelsConfig, updateAtmosphereHeightFromCurrentT | 4, 5 |

### Albedo & nuages

| Fichier actuel | Rôle | Étape |
|----------------|------|--------|
| `static/calculations_albedo.js` | calculateAlbedo, calculateCloudFormationIndex, glace, CCN | 5, 6 |

### H2O (vapeur & cycle)

| Fichier actuel | Rôle | Étape |
|----------------|------|--------|
| `static/calculations_h2o.js` | calculateH2OParameters, calculatePrecipitationFeedback, partition vapeur/liquide | 5, 6 |

### Transfert radiatif (flux)

| Fichier actuel | Rôle | Étape |
|----------------|------|--------|
| `static/calculations.js` | Flux spectral, EDS, OLR, température effective, attribution gaz/nuages | 7 |
| `static/flux_manager.js` | Gestion flux + mise à jour affichage (à scinder : partie calcul vs UI) | 7 / hors API si UI seule |

### Orchestration & convergence

| Fichier actuel | Rôle | Étape |
|----------------|------|--------|
| `static/compute/compute.js` | getMasses, getEpochDateConfig, getEnabledStates (DOM), helpers | 2, 4, 6 (getEnabledStates = DOM) |
| `static/compute/calculations_flux.js` | initForConfig, cycleDeLeau, computeRadiativeTransfer, Search/Dicho, callbacks | 6, 8 |

### Optionnel / secondaire

| Fichier actuel | Rôle |
|----------------|------|
| `static/calculations_geology.js` | Géologie (si utilisé par le bilan) |
| `static/event_bus.js` | Events (compute:progress, compute:done) – peut rester côté app ou être utilisé par l’API pour notifier la pile |

---

## 4. Fichiers à ne pas déplacer (ou à adapter)

- **DOM / rendu** : `getEnabledStates` dans compute.js lit `document.getElementById('cell-co2')` etc. → pour l’API : passer les états en config ou depuis DATA déjà rempli par l’UI.
- **flux_manager.js** : partie affichage → garder hors API_BILAN ou extraire une partie “calcul seulement”.
- **alphabet.js** : getLogo/getLogoKey peuvent toucher au DOM → à vérifier ; la sémantique (CHARS, clés) est pure.
- **scie_convergence.js**, **sync_panels.js**, **loader_panels.js**, **main.js**, **plot.js**, **organigramme**, etc. : UI / chargement → restent hors API_BILAN.

---

## 5. Proposition de rangement dans API_BILAN/

```
API_BILAN/
├── api.js                 # Déjà : entrée API, run(config), callback stack
├── callback_stack.js      # Déjà : pile de callbacks synchrones
├── receiver.js            # Déjà : dispatch visu/scie
├── README.md
├── STRUCTURE.md           # Ce fichier
│
├── config/                # Config & entrée epoch
│   ├── configTimeline.js  # (depuis static/timeline/)
│   ├── model_tuning.js    # (depuis static/tuning/)
│   ├── model_tuning_biblio.js
│   └── fine_tuning_bounds.js
│
├── data/                  # Structure DATA & sémantique
│   ├── alphabet.js        # (depuis static/compute/)
│   ├── dico.js
│   ├── initDATA.js
│   └── hitran_lines_*.js  # (depuis static/data/) ou lien
│
├── physics/               # Physique fondamentale
│   ├── physics.js         # (depuis static/)
│   └── climate.js
│
├── spectroscopy/          # Spectroscopie LBL
│   └── hitran.js          # (depuis static/)
│
├── atmosphere/            # Atmosphère
│   └── calculations_atm.js
│
├── albedo/                # Albedo & nuages
│   └── calculations_albedo.js
│
├── h2o/                   # Vapeur & cycle eau
│   └── calculations_h2o.js
│
├── radiative/             # Transfert radiatif (flux)
│   ├── calculations.js    # flux spectral, EDS
│   └── flux_core.js       # (optionnel : extrait calcul-only de flux_manager.js)
│
├── convergence/           # Orchestration & convergence
│   ├── compute.js         # getMasses, getEpochDateConfig ; getEnabledStates → config ou stub
│   └── calculations_flux.js
│
└── optional/
    └── calculations_geology.js
```

Ordre de chargement suggéré (pour le loader) :

1. config/ (timeline, tuning)
2. data/ (alphabet, dico, initDATA)
3. event_bus (si gardé global)
4. physics/
5. data/hitran_lines_*.js + spectroscopy/hitran.js
6. climate
7. atmosphere, albedo, h2o
8. radiative (calculations.js)
9. convergence (compute.js, calculations_flux.js)
10. callback_stack.js, api.js, receiver.js

---

## 6. Résumé par “genre” de calcul

| Genre | Catégories concernées | Fichiers principaux |
|-------|------------------------|----------------------|
| **Entrée** | Config & epoch | configTimeline, model_tuning*, fine_tuning_bounds |
| **Données** | Config & data | alphabet, dico, initDATA, hitran_lines_* |
| **Lois de base** | Physique, climat | physics.js, climate.js |
| **Spectre** | Spectroscopie | hitran.js |
| **Colonne atm.** | Atmosphère | calculations_atm.js |
| **Surface / nuages** | Albedo, H2O | calculations_albedo.js, calculations_h2o.js |
| **Flux** | Transfert radiatif | calculations.js |
| **Boucle T** | Orchestration & convergence | compute.js, calculations_flux.js |

Une fois les fichiers déplacés, mettre à jour les chemins dans `loader_panels.js` (ou le script de chargement utilisé) et s’assurer que les `window.*` et les données (HITRAN) sont résolus (chemins relatifs ou bundle).
