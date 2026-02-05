# Vapeur d'eau vs Nuages — Distinction physique et architecture

## Référence : Schmidt et al. 2010 (contribution EDS terrestre)

| Composant | État | Contribution EDS | Comportement physique |
|-----------|------|------------------|------------------------|
| Vapeur d'eau | Gaz | ~50 % | Absorbe sur des raies spectrales précises |
| Nuages | Gouttelettes / Glace | ~25 % | Absorbe "en bloc" (corps gris/noir) et diffuse |
| CO₂ | Gaz | ~20 % | Absorbe sur bandes clés (ex: 15 µm) |
| Autres (CH₄, O₃) | Gaz | ~5 % | Complémentaire |

**Total H₂O (vapeur + nuages) ≈ 75 %**, pas 93 %.

---

## Architecture actuelle du modèle

### 1. Vapeur d'eau (gaz) — dans l'EDS IR

- **Variable** : `DATA['💧']['🍰🫧💧']` (fraction de vapeur au niveau de la mer)
- **Profil vertical** : `waterVaporFractionAtZ(z)` = r₀ × exp(-z/H_H2O)
- **Calcul spectral** : `calculations.js` → `kappa_H2O = crossSectionH2O(λ) × n_H2O`
- **Bandes** : 6.3 µm et 17 µm (`crossSectionH2O`)
- **Contribution EDS** : via `sum_blocked_H2O` (tau_H2O / tau_tot × flux absorbé)

### 2. Nuages — hors EDS IR

- **Variables** : `DATA['🪩']['☁️']` (index formation), `DATA['🪩']['🍰🪩⛅']` (couverture)
- **Calcul** : `calculateCloudFormationIndex()` → `calculateAlbedo()`
- **Effet** : **uniquement albédo SW** (réflexion solaire)
- **Pas d’absorption IR** : les nuages ne sont **pas** inclus dans `kappa` du transfert radiatif

### 3. Conclusion : pas d’amalgame vapeur + nuages dans l’EDS

Le H2O% ≈ 93 % dans les logs provient **uniquement de la vapeur** (gaz).  
Les nuages ne sont pas comptés dans l’EDS IR.

---

## Cause probable du bug de convergence

1. **Sur-estimation de la vapeur** : les coefficients `H2O_SIGMA_*` ou la largeur des bandes font absorber trop de flux IR.
2. **Chevauchement spectral** : la bande H₂O à 17 µm chevauche la bande CO₂ à 15 µm → effet de masquage.
3. **Effet de masquage** : si H₂O absorbe trop, le CO₂ ne peut plus influencer le flux sortant.

### Chevauchement spectral — explication

À chaque λ, tau_total = tau_H2O + tau_CO2 + tau_CH4 (Beer-Lambert, additif). L'attribution EDS utilise `(tau_H2O/tau_tot) × flux_absorbé`. Dans les bandes partagées (15–17 µm), si les sections efficaces H2O surestiment l'absorption, H2O "vole" le crédit au CO2. Le facteur `getH2OVaporEDSScale()` (T, P, vapor, CO2) corrige cette sur-estimation sans hack par époque.

---

## Corrections proposées

### A. Réduire l’absorption de la vapeur (priorité) — ✅ Implémenté

- `getH2OVaporEDSScale()` dans `physics.js` — **dérivé de T, P, vapor, CO2** (pas d'époque).
- **CO2 > 1%** : scale = 1.0 (atmosphère riche, ex. Hadéen).
- **CO2 ≤ 1%** : `scale = 0.5 × f_T × f_P × f_v` clamp [0.2, 1] — corrige chevauchement H2O/CO2 15–17 µm.
- Réf Terre (288K, 1 atm, ~1% vapor) → ~0.5. Archéen (CO2 ~0.8%, 8000 ppm) → ~0.48 (scale ~0.5, pas 1.0).
- **Impact Archéen** : avec scale ~0.48, T simulée ~8°C (fourchette basse lit. 8–30°C). Avec scale=1.0 (CO2>1%), on obtiendrait ~15°C — la convergence à 15°C était conditionnelle (CO2 élevé ou tuning).
- Appliqué : `kappa_H2O *= getH2OVaporEDSScale()` dans `calculations.js` (3 endroits).

### B. Nuages comme absorbeurs IR (optionnel, plus tard)

- Les nuages devraient absorber en corps gris/noir à des altitudes données.
- À implémenter séparément du calcul vapeur.

### C. Calcul EDS par couche (optionnel)

- CO₂ : bien mélangé sur toute la colonne.
- Vapeur : surtout en bas (troposphère).
- Nuages : à des altitudes spécifiques.

---

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `static/calculations.js` | `kappa_H2O`, `waterVaporFractionAtZ`, `eds_breakdown` |
| `static/physics.js` | `H2O_SIGMA_*`, `LAMBDA_H2O_*` |
| `static/calculations_albedo.js` | Nuages → albédo uniquement |
| `static/climate.js` | `calculateH2OForcing` (vapeur + nuages en forçage simplifié, pas spectral) |
