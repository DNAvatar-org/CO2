# Régression convergence T° — analyse et pistes de correction

**Date** : 2025-02-06  
**Commit de référence** : `5ecb155` (fix: H2O EDS scale par époque, computeSearchIncrement DT, 1800/Archéen OK)

## Contexte

Les températures convergentes sont systématiquement **sous** les cibles config :
- Archéen : 7.8°C (cible 15°C) — était ~12°C acceptable (PRECISION_CALCULS_RADIATIF.md)
- Mésozoïque : 13.6°C (cible 25°C) — écart ~11°C
- Industriel : 13°C (cible 14°C) — proche

## Commit de référence 5ecb155

- **Message** : "fix: H2O EDS scale par époque, computeSearchIncrement DT, 1800/Archéen OK"
- **Fichiers** : calculations.js, calculations_flux.js, physics.js, debug.js, doc/VAPEUR_VS_NUAGES.md

## Différences critiques (5ecb155 → HEAD)

### 1. computeSearchIncrement (calculations_flux.js)

**5ecb155 (version qui fonctionnait)** :
```javascript
const DT = Math.abs(DATA['🧮']['🧮🌡️'] - DATA['📅']['🌡️🧮']);
const pow = 2 + DT / 1500.0;
const res = Math.sign(delta) * Math.pow(Math.abs(delta), 1 / pow);
```

**HEAD (actuel)** :
```javascript
const sigmaT3 = 4 * CONST.STEFAN_BOLTZMANN * Math.pow(T_K, 3);
let res = delta / sigmaT3;
// + cap maxSearchStepK, maxSearchStepLargeK, cap 80K si T>2000
```

**Impact** : La formule physique ΔT = Δ/(4σT³) peut converger trop lentement ou avec un pas mal adapté. La formule 5ecb155 utilisait |Δ|^(1/pow) avec pow dépendant de |T - T_cible| — comportement non linéaire qui pouvait mieux s'adapter.

### 2. initForConfig T initial (calculations_flux.js)

**5ecb155** :
```javascript
DATA['🧮']['🧮🌡️'] = EPOCH['🌡️🧮'] + DATA['📜']['🔺🌡️💫'] * DATA['📜']['📿💫'];
```

**HEAD** :
```javascript
const T_epoch = EPOCH['🌡️🧮'] + ...;
if (animEnabled) {
    DATA['🧮']['🧮🌡️'] = T_solver_init;
} else if (Math.abs(T_solver_init - T_epoch) > 20) {
    DATA['🧮']['🧮🌡️'] = T_solver_init;
} else {
    DATA['🧮']['🧮🌡️'] = T_epoch;
}
```

**Impact** : Le choix de T initial peut envoyer le solver vers une mauvaise branche ou ralentir la convergence.

### 3. Tolérance flux (calculations_flux.js)

**5ecb155** : `DATA['🧮']['🧲🔬'] = 4 * σ * T³ * precision_K` (direct)

**HEAD** : `computeToleranceWm2(T, precision_K)` avec `tolMinWm2` (borne min ~0.05–0.1 W/m²)

**Impact** : Si tolMinWm2 est trop élevé, on peut considérer "convergé" trop tôt (delta reste > tol min).

### 4. calculations.js — Search phase

**5ecb155** : `T0_adjustment = -delta_equilibre / sensitivity` puis cap ±50K

**HEAD** : Idem, mais `showDichotomySteps && isVisuPanelActive()` — peut masquer l'affichage.

**Note** : simulateRadiativeTransfer (calculations.js) a sa propre boucle Search/Dicho. calculations_flux.js a runRadiatifOnly avec computeSearchIncrement. Les deux chemins existent (visu vs scie?).

## Recommandations

1. **Restauration computeSearchIncrement** : Tester le revert vers la formule 5ecb155 (pow = 2 + DT/1500).
2. **Vérifier tolMinWm2** : Si 0.05–0.1 W/m² est trop grand pour Archéen (flux ~300 W/m²), réduire ou désactiver.
3. **initForConfig** : Comparer T_solver_init vs T_epoch au chargement — s'assurer que la T initiale est cohérente.
4. **Branche régression** : Créer `git checkout -b fix/regression-convergence-T 5ecb155` puis cherry-pick les corrections utiles (boutons, spectre) sans les changements computeSearchIncrement/initForConfig.

## Fichiers à comparer

| Fichier | Lignes clés |
|---------|-------------|
| calculations_flux.js | computeSearchIncrement, initForConfig, calculateT0, computeToleranceWm2 |
| calculations.js | Boucle Search (T0_adjustment), tolerance_current |
| physics.js | getH2OVaporEDSScale (5ecb155) |
| calculations_albedo.js | 0384abe clouds modernes Archéen |
