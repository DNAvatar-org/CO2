# Analyse de précision des calculs radiatifs

**Objectif** : Identifier les sources potentielles de décalage entre la température simulée (12.3°C) et la cible Archéen (15°C).

**Date** : 2025-01-31

---

## 1. Paramètres actuels du modèle

| Paramètre | Valeur | Fichier |
|-----------|--------|---------|
| Résolution spectrale (🔬🌈) | 150 bins | `configTimeline.js` → `CONFIG_COMPUTE.maxSpectralBinsConvergence` |
| Plage spectrale | 0.1 μm – 100 μm | `calculations.js` |
| Pas spectral effectif | ~0.67 μm/bin | (100−0.1)/149 |
| Résolution verticale troposphère | 50 m | `calculations.js` delta_z_troposphere |
| Résolution verticale stratosphère | 250–500 m (selon FPS) | `calculations.js` |
| Précision convergence (🧲🔬) Archéen | 1.0 K | `configTimeline.js` |
| Tolérance flux | 4σT³ × precision_K ≈ 5.3 W/m² à 285 K | `calculations.js` |

---

## 2. Sources potentielles de décalage

### 2.1 Absence de pressure broadening (priorité élevée)

**Problème** : Les sections efficaces σ(λ) sont **indépendantes de la pression**. À 2 bars (Archéen), l’élargissement par pression (pressure broadening) augmente l’absorption dans les ailes des raies.

**Impact estimé** : À 2 bar, l’absorption peut être sous-estimée de ~10–30 % par rapport à un modèle avec broadening. L’EDS serait donc trop faible → température simulée trop basse.

**Référence** : HITRAN fournit des données σ(λ, T, P). Les modèles radiatifs (LBLRTM, etc.) utilisent des profils de largeur de raie ∝ P.

**Piste de correction** : Introduire un facteur de scaling des sections efficaces en fonction de P/P_ref, par exemple σ_eff(λ,z) = σ(λ) × √(P(z)/P_ref) pour un broadening de type Lorentz.

---

### 2.2 Formules de section efficace (approximations empiriques)

**Formules actuelles** (`calculations.js`, `physics.js`) :

- **CO₂** : σ = 10^(-22.5 - 24×|(λ−15μm)/15μm|) → pic ~3.2×10⁻²³ m²
- **H₂O** : max(10^(-20-15×|…|), 10^(-21-18×|…|)) aux bandes 6.3 μm et 17 μm
- **CH₄** : max(10^(-20-16×|…|), 10^(-21-17×|…|)) aux bandes 7.7 μm et 3.3 μm

**Limites** :
- Pas de données HITRAN/PNNL
- Bande CO₂ à 15 μm : largeur et intensité intégrée approximatives
- Pas de dépendance en température (forme des bandes)
- Recouvrements de bandes (CO₂/H₂O vers 15 μm, CH₄/H₂O vers 7.7 μm) : le modèle additionne les τ, ce qui est correct pour l’épaisseur optique totale

**Impact** : Erreur possible de l’ordre de 10–30 % sur l’EDS selon la qualité des approximations.

---

### 2.3 Résolution spectrale (150 bins)

**Problème** : 150 bins sur ~100 μm → ~0.67 μm/bin. Les bandes étroites (largeur ~1–5 μm) peuvent être mal échantillonnées.

**Exemple** : Bande CO₂ 15 μm (largeur ~10 μm) : ~15 bins. Le pic peut être lissé si le centre de bin ne coïncide pas avec le maximum.

**Impact** : Modéré. Une augmentation à 300–500 bins améliorerait la précision au prix du temps de calcul.

---

### 2.4 Résolution verticale

- Troposphère : 50 m (correct pour une échelle de hauteur ~8 km)
- Stratosphère : 250–500 m selon `precisionFactor` (FPS)

À 2 bar, l’échelle de hauteur H = RT/(Mg) est plus petite qu’à 1 bar (H ∝ T, P0 plus élevé). Une résolution plus fine en bas de l’atmosphère pourrait améliorer la précision.

---

### 2.5 Précision de convergence

- **Archéen** : `🧲🔬` = 1.0 K → tolérance ≈ 5.3 W/m² à 285 K
- La convergence est atteinte quand |Δ| ≤ tolérance
- Un écart résiduel de 0.2 W/m² (comme indiqué dans les logs) est négligeable

La convergence n’est pas la cause du décalage de ~2.7 K.

---

## 3. Ordre de grandeur des sections efficaces

Comparaison avec la littérature (HITRAN, PNNL) :

| Gaz | Bande | σ_peak typique (m²/molécule) | Modèle actuel (pic) |
|-----|-------|------------------------------|----------------------|
| CO₂ | 15 μm | ~10⁻²¹ – 10⁻²⁰ | ~3×10⁻²³ |
| H₂O | 6.3 μm | ~10⁻²¹ – 10⁻²⁰ | ~10⁻²⁰ |
| CH₄ | 7.7 μm | ~10⁻²¹ | ~10⁻²⁰ |

La section efficace CO₂ du modèle est environ 10–100× plus faible que les valeurs typiques. Cela pourrait expliquer une sous-estimation de l’EDS.

**À vérifier** : Les unités et la définition exacte de σ dans le code (m²/molécule vs cm²/molécule, etc.).

---

## 4. Recommandations

### Priorité 1 – Vérifier les sections efficaces CO₂
- Comparer avec HITRAN/PNNL pour la bande 15 μm
- Ajuster l’exposant ou le préfacteur si nécessaire

### Priorité 2 – Ajouter le pressure broadening
- Facteur de scaling : σ_eff = σ × f(P/P_ref), avec f(1)=1
- Pour un broadening Lorentzien : f(P) ∝ √P en première approximation

### Priorité 3 – Augmenter la résolution spectrale (optionnel)
- Passer à 300 bins pour les époques à haute pression
- Ou utiliser une grille adaptative plus fine dans les bandes d’absorption

### Priorité 4 – Test de sensibilité
- Faire varier `maxSpectralBinsConvergence` (50, 150, 300) et comparer T finale
- Tester un facteur de pressure broadening manuel pour l’Archéen

---

## 5. Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `static/calculations.js` | `crossSectionCO2`, `crossSectionH2O`, `crossSectionCH4`, `calculateFluxForT0` |
| `static/physics.js` | `LAMBDA_CO2_CENTER`, `LAMBDA_H2O_1/2`, `LAMBDA_CH4_1/2` |
| `static/timeline/configTimeline.js` | `maxSpectralBinsConvergence`, `🧲🔬` par époque |
| `static/calculations_atm.js` | `airNumberDensityAtZ`, `pressureAtZ` |

---

## 6. Références

- HITRAN : https://hitran.org/
- HITRAN Cross-Sections : https://hitran.org/xsc/
- PNNL CO₂ spectra : https://vpl.astro.washington.edu/spectra/co2.htm
- Pressure broadening : Goody & Yung, *Atmospheric Radiation* (1989)
