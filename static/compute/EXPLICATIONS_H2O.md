# Explications des concepts H2O

## 1. 🌧 Max vapor fraction (`max_vapor_fraction`)

**Réponse :** Oui, c'est le taux **maximum** d'humidité (vapeur d'eau) possible dans l'atmosphère avant condensation, selon la température et la pression (loi de Clausius-Clapeyron).

- **Pas** le taux avant de passer en océan (`🌊`)
- C'est la **saturation** : au-delà, la vapeur se condense en nuages (`⛅`) ou en liquide (`🌊`)
- Formule : `max_vapor_fraction = calculateMaxH2OVaporFraction(temp_K)`
- À 2450K (Hadéen), la saturation est très élevée (~100%), donc `🌧=100`

## 2. 🌤 Cloud albedo contribution vs 🍰🪩⛅

**Réponse :** Ce sont **deux choses différentes** :

- **`🌤` Cloud albedo contribution** : Contribution **numérique** des nuages à l'albedo total (en W/m² ou fraction)
  - Formule : `cloud_coverage × cloud_albedo_coeff × (1 - 0.2 × cloud_coverage)`
  - Exemple : si `cloud_coverage = 0.1` et `cloud_albedo_coeff = 0.5` → `🌤 = 0.1 × 0.5 × 0.98 = 0.049`

- **`🍰🪩⛅` Cloud albedo proportion** : **Pourcentage** de couverture nuageuse dans l'albedo
  - C'est la **couverture** nuageuse (0-100%), pas la contribution
  - Utilisé dans `window.albedo` pour afficher les proportions de surface

**Relation :** `🌤` est calculé **depuis** `🍰🪩⛅` (cloud coverage) qui est lui-même calculé depuis `☁️` (CloudFormationIndex) dans `calculateCloudFormationIndex()`

## 3. 🌴 Greenhouse forcing

**Réponse :** C'est l'**effet de serre** de la vapeur d'eau (H2O), **pas** les arbres.

- **Forçage radiatif** : capacité de H2O à absorber le rayonnement infrarouge émis par la surface terrestre
- Formule logarithmique : `ΔF = 6.0 × ln(C/C₀)` où C est la concentration de H2O
- **Feedback positif** : plus il fait chaud → plus de vapeur → plus d'effet de serre → encore plus chaud
- À 2450K avec 0% H2O → `🌴=0` (pas de vapeur, pas d'effet de serre)

## 4. Calcul spectral

Le calcul **spectral** (par longueur d'onde) est dans `static/calculations.js` dans `calculateFluxForT0()`.

Dans `computeRadiativeTransfer()`, on utilise une **version simplifiée** :
- `calculateSolarFluxAbsorbed()` : flux solaire absorbé (intègre albedo et greenhouse)
- `calculateH2OGreenhouseForcing()` : forçage radiatif de H2O (formule logarithmique, pas spectral)

Pour le calcul spectral complet, il faut utiliser `simulateRadiativeTransfer()` dans `calculations.js`.

## 5. Pourquoi h2o est calculé 2 fois ?

**Problème identifié :** `calculateH2OParameters()` est appelé :
1. Avant la boucle (ligne ~212) - **SUPPRIMÉ**
2. Dans la boucle (ligne 283) - **CORRECT**

**Correction :** Supprimé l'appel avant la boucle, h2o est maintenant calculé uniquement dans la boucle avec `T0_current`.

## 6. Pourquoi T0 ne change pas entre les itérations ?

**Problème identifié :** 
- `Phase` était initialisé à `'None'` au lieu de `'Search'`
- La logique d'ajustement de T0 n'était jamais exécutée

**Correction :**
- `Phase` initialisé à `'Search'` pour commencer l'ajustement
- Limite de T0 augmentée de 1000K à 3000K pour Hadéen (2450K)

**Logique :**
- `🔺🧲 > 0` (flux_sortant > flux_entrant) → T0 doit **diminuer**
- `🔺🧲 < 0` (flux_sortant < flux_entrant) → T0 doit **augmenter**
- Ajustement : `delta_T = -delta_equilibre / (4σT³)`

