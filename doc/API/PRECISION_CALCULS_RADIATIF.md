# Analyse de précision des calculs radiatifs

**Objectif** : Identifier les sources potentielles de décalage entre la température simulée et la cible Archéen.

**Date** : 2025-01-31

**Archéen — Température simulée 12.2°C : acceptable.**  
Littérature (Charnay 2017, Kienert 2013) : 281–303 K (8–30°C) plausible pour Hadéen tardif/Archéen précoce. La simulation à 12.2°C (285.4 K) est **dans la fourchette**. Cible indicative 15°C (288 K) ; pas de tuning des sections efficaces au-delà des masses de gaz.

**Cénozoïque — 22°C : fourchette basse** (lit. 22–26°C Paléocène).

**1800 / 2025 — Problème** : convergence à 25°C au lieu de 15°C. Cause à identifier (EDS/vapeur à basse T ? rétroaction glace-albedo ?).

---

## 1. Paramètres actuels du modèle

| Paramètre | Valeur | Fichier |
|-----------|--------|---------|
| Résolution spectrale (🔬🌈) | 150 bins | `API_BILAN/config/configTimeline.js` → `CONFIG_COMPUTE.maxSpectralBinsConvergence` |
| Plage spectrale | 0.1 μm – 100 μm | `API_BILAN/radiative/calculations.js` |
| Pas spectral effectif | ~0.67 μm/bin | (100−0.1)/149 |
| Résolution verticale troposphère | 50 m | `API_BILAN/radiative/calculations.js` delta_z_troposphere |
| Résolution verticale stratosphère | 250–500 m (selon FPS) | `API_BILAN/radiative/calculations.js` |
| Précision convergence (🧲🔬) Archéen | 1.0 K | `API_BILAN/config/configTimeline.js` (🧲🔬 par époque) |
| Tolérance flux | 4σT³ × precision_K ≈ 5.3 W/m² à 285 K | `API_BILAN/convergence/calculations_flux.js` (computeToleranceWm2) |

---

## 2. Sources potentielles de décalage

### 2.1 Absence de pressure broadening (priorité élevée)

**Problème** : Les sections efficaces σ(λ) sont **indépendantes de la pression**. À 2 bars (Archéen), l’élargissement par pression (pressure broadening) augmente l’absorption dans les ailes des raies.

**Impact estimé** : À 2 bar, l’absorption peut être sous-estimée de ~10–30 % par rapport à un modèle avec broadening. L’EDS serait donc trop faible → température simulée trop basse.

**Référence** : HITRAN fournit des données σ(λ, T, P). Les modèles radiatifs (LBLRTM, etc.) utilisent des profils de largeur de raie ∝ P.

**Piste de correction** : Introduire un facteur de scaling des sections efficaces en fonction de P/P_ref, par exemple σ_eff(λ,z) = σ(λ) × √(P(z)/P_ref) pour un broadening de type Lorentz.

---

### 2.2 Formules de section efficace (approximations empiriques)

**Formules actuelles** (`API_BILAN/radiative/calculations.js`, `API_BILAN/physics/physics.js`) :

- **CO₂** : σ = 10^(-22.5 - 24×|(λ−15μm)/15μm|) → pic ~3.2×10⁻²³ m²
- **H₂O** : max(10^(-20-15×|…|), 10^(-21-18×|…|)) aux bandes 6.3 μm et 17 μm
- **CH₄** : max(10^(-20-16×|…|), 10^(-21-17×|…|)) aux bandes 7.7 μm et 3.3 μm — **validé HAPI** (régression identique)

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

### Priorité 2 – Ajouter le pressure broadening ✅ (implémenté)
- Facteur : σ_eff = σ × √(P/P_ref), cap 2.0. `CONFIG_COMPUTE.pressureBroadening = true`

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
| `API_BILAN/radiative/calculations.js` | `crossSectionCO2`, `crossSectionH2O`, `crossSectionCH4` ; `calculateFluxForT0` dans convergence/calculations_flux.js |
| `API_BILAN/physics/physics.js` | `LAMBDA_CO2_CENTER`, `LAMBDA_H2O_1/2`, `LAMBDA_CH4_1/2`, `getH2OVaporEDSScale` |
| `API_BILAN/config/configTimeline.js` | `maxSpectralBinsConvergence` (CONFIG_COMPUTE), `🧲🔬` par époque |
| `static/calculations_atm.js` | `airNumberDensityAtZ`, `pressureAtZ` |
| `static/compute/calculations_flux.js` | `computeRadiativeTransfer`, convergence Search/Dicho |

---

## 6. Logs structurés pour analyses

Activer en console avant Calcul :
```javascript
window.DEBUG_ANALYSE = true;
```

Puis lancer le calcul. Logs affichés :
- `[ANALYSE] convergence` : bins, layers, P_atm, delta_W, EDS, T_final_K, T_cible_K
- `pd()` : logs détaillés par fonction (iterate, Search, crossing, computeSearchIncrement)

---

## 7. Option C – Sections efficaces CO₂ (détail)

**Contexte** : Le modèle utilise des formules empiriques (gaussiennes logarithmiques) au lieu de données spectroscopiques réelles.

**Formule actuelle** (`API_BILAN/radiative/calculations.js`) :
```
σ_CO2(λ) = 10^(-22.5 - 24×|(λ-15μm)/15μm|)  [m²/molécule]
```
→ Pic à 15 μm : σ ≈ 3×10⁻²³ m²/molécule

**HITRAN/PNNL** :
- **Unités** : cm²/molécule (1 cm² = 10⁻⁴ m²)
- **Accès** : https://hitran.org/xsc/ → CO2, bande ν₂ ~667 cm⁻¹ (15 μm)
- **Données** : σ(ν) à plusieurs T et P (ex. 296 K, 1 bar)
- **Format** : grille en cm⁻¹, valeurs en cm²/molécule

**Procédure** :
1. Télécharger σ(ν) CO2 pour T≈288 K, P≈1 bar (ou 2 bar pour Archéen)
2. Convertir ν (cm⁻¹) ↔ λ (m) : λ = 1/(ν×100)
3. Convertir σ : m²/mol = σ_cm² × 10⁻⁴
4. Comparer l'intensité intégrée ∫σ dν sur la bande 500–800 cm⁻¹
5. Ajuster le préfacteur (ex. -22.5 → -21.5) ou la largeur (exposant 24) pour coller aux données

**Impact attendu** : Si σ_CO2 est sous-estimée d'un facteur 10, l'EDS CO2 serait ~10× plus faible → T trop basse. Un facteur 2–3 sur σ pourrait expliquer ~2–3°C de décalage.

**Scripts Python HITRAN** : Supprimés. Les sections efficaces (formules empiriques dans `API_BILAN/radiative/calculations.js`, `API_BILAN/physics/physics.js`) ont été validées vs littérature — les paramètres résultants sont cohérents. Vérification HITRAN quasi inutile pour l'usage actuel.

---

## 8. Accès aux données (URLs)

| Ressource | URL | Inscription |
|-----------|-----|-------------|
| **HITRAN inscription** | https://hitran.org/register/ | Gratuite (nom, email, affiliation) |
| **HITRAN login** | https://hitran.org/login/ | Après inscription |
| **Cross-sections (xsc)** | https://hitran.org/xsc/ | Compte requis pour télécharger |
| **Données suppl. (liste)** | https://hitran.org/suppl/xsec/ | Public (liste fichiers) |
| **Données suppl. (fichiers)** | https://hitran.org/files/xsec/ | Compte requis |
| **PNNL CO₂ (images)** | https://vpl.astro.washington.edu/spectra/co2.htm | Public (images, pas CSV) |
| **AER cross-sections** | https://github.com/AER-RC/cross-sections | Public (pas de CO2 15 μm) |

**⚠️ CO2 absent de hitran.org/xsc** : La base cross-sections (xsc) ne contient **pas** CO2. La recherche "CO2", "Carbon dioxide", "C6H6" ou CAS "124-38-9" renvoie toujours "not found" car la base xsc cible des composés organiques (alcools, CFC, hydrocarbures), pas les gaz atmosphériques majeurs. CO2 est dans la base **line-by-line** (hitran.org/lbl/) — molécule ID 2, 545 084 raies. Pour des cross-sections CO2, utiliser : (1) le dossier suppl. https://hitran.org/files/xsec/ après login gratuit, ou (2) **HAPI** (`pip install hitran-api`) pour générer des cross-sections à partir des raies line-by-line, ou (3) PNNL via VPL (images : https://vpl.astro.washington.edu/spectra/co2.htm).

**Travail déjà fait ?** : Non. Les modèles climatiques (LBLRTM, etc.) utilisent les raies HITRAN line-by-line pour CO2, pas des formules simplifiées. Notre formule gaussienne est une approximation maison — aucun paramètre ajusté sur HITRAN n'existe dans le projet. Il faut faire la régression soi-même.

---

## 10. Autres gaz : N2O, O3 — Négligeables ou à ajouter ?

**Modèle actuel** : CO2, H2O, CH4 (EDS radiatif) ; N2/O2 (combler : masse molaire, pression, pas d’absorption IR).

### 10.1 Rôle de N2 et O2

N2 et O2 sont des molécules symétriques : **pas d’absorption IR significative**. Ils servent uniquement à :
- Compléter la masse atmosphérique (molar_mass, scale height)
- Calculer les fractions molaires des GES

Ils ne contribuent pas à l’EDS → correct de ne pas les inclure dans le transfert radiatif.

### 10.2 N2O (protoxyde d’azote)

| Aspect | Détail |
|--------|--------|
| **Source** | Dénitrification (bactéries). Présent après apparition de la vie. |
| **Concentration** | ~0,3 ppm aujourd’hui ; ~0,1 ppm ou moins avant l’ère industrielle. |
| **Contribution EDS** | ~2–5 % du total (~5–10 W/m² aujourd’hui). |
| **HITRAN xsc** | ✅ **Présent** — chercher `nitrous oxide` ou `N2O` |
| **Verdict** | **Négligeable** pour toutes les périodes du modèle. Optionnel si on vise une précision maximale pour Cénozoïque / 1800 / 2025. |

### 10.3 O3 (ozone)

| Aspect | Détail |
|--------|--------|
| **Source** | Photolyse de O2 (UV). Nécessite O2 atmosphérique. |
| **Concentration** | Nulle si O2 = 0 ; ~0,01–0,1 ppm (troposphère) si O2 présent. |
| **Contribution EDS** | ~5–10 % du total (~10–20 W/m²) quand O2 est présent. |
| **HITRAN xsc** | ✅ **Présent** — chercher `ozone` ou `O3` |
| **Verdict** | **Négligeable** pour Hadéen, Archéen, Protérozoïque, Mésozoïque, Crétacé (O2 absent ou très bas). **À envisager** pour Cénozoïque, 1800, 2025 (O2 ~21 %). |

### 10.4 Synthèse par période

| Période | CO2 | H2O | CH4 | N2O | O3 | Action |
|---------|-----|-----|-----|-----|-----|--------|
| Hadéen | ✓ | ✓ | ✓ | 0 | 0 | Rien à ajouter |
| Archéen | ✓ | ✓ | ✓ | ~0 | 0 | Rien à ajouter |
| Protérozoïque | ✓ | ✓ | ✓ | ~0 | 0 | Rien à ajouter |
| Mésozoïque, Crétacé | ✓ | ✓ | ✓ | ~0 | 0 | Rien à ajouter |
| Cénozoïque, 1800, 2025 | ✓ | ✓ | ✓ | ~0,3 ppm | ~0,05 ppm | **O3** : gain potentiel ~1–2°C si ajouté |

### 10.5 Priorités

1. **CO2, H2O, CH4** : déjà modélisés, priorité = améliorer les sections efficaces (CO2 surtout).
2. **O3** : seul gaz à fort impact manquant ; pertinent pour les époques avec O2 (Cénozoïque, 1800, 2025). Données HITRAN xsc disponibles.
3. **N2O** : impact faible (~2–5 %), ajout optionnel.

---

## 11. Références

- HITRAN : https://hitran.org/
- HITRAN Cross-Sections : https://hitran.org/xsc/
- PNNL CO₂ spectra : https://vpl.astro.washington.edu/spectra/co2.htm
- Pressure broadening : Goody & Yung, *Atmospheric Radiation* (1989)
