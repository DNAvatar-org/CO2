# Debug convergence T° — post-Hadéen ne converge pas vers 🌡️🧮

## 1. Constat (logs debug_convergence_20260219)

| Epoch | T° finale simulée | 🌡️🧮 (config) | Écart |
|-------|-------------------|---------------|-------|
| ⚫ Corps noir | -18.1°C | 255 K (~-18°C) | OK |
| 🔥 Hadéen | 2211.5°C | 2450 K (~2177°C) | OK (proche) |
| 🦠 Archéen | **-2.1°C** | **288 K (15°C)** | **-17°C** |
| 🥟 Protérozoïque | 1.4°C | 285 K (12°C) | -10.6°C |
| 🦕 Mésozoïque | 4.5°C | 285 K (12°C) | -7.5°C |
| 🦴 Paléozoïque | 5.6°C | 285 K (12°C) | -6.4°C |
| 🦣 Cénozoïque | 4.4°C | 285 K (12°C) | -7.6°C |
| 🚂 Industriel | 2.2°C | 285 K (12°C) | -9.8°C |
| 📱 Aujourd'hui | **4.1°C** | **288 K (15.7°C)** | **-11.6°C** |

**Problème** : À partir de l’Archéen, les T° convergent vers ~2–6°C au lieu des 12–15°C attendus. OLR trop élevé → Δ < 0 → dichotomie refroidit.

---

## 2. Philosophies (codeLogs / commentHeaders des derniers fichiers)

### API_BILAN/convergence/calculations_flux.js
- Init atmosphere from epoch T (🌡️🧮) in both anim/non-anim so same equilibrium (Hadéen)
- Phase Init cycle eau : utiliser T_epoch (pas T_solver) pour mêmes conditions initiales anim/sans anim
- updateConvergenceBounds() : bornes Init basées sur 🧮🌡️ et ☯ (pas 📅🌡️🧮) pour anim Hadéen

### API_BILAN/radiative/calculations.js
- kappa_H2O × H2O_VAPOR_EDS_SCALE (évite masquage CO2)
- Attribution EDS Schmidt 2010 : overlap H2O–CO2 partagé réaliste
- Stratosphère delta_z_real = z_range[i]-z_range[i-1] (pas constante)
- **τ nuages LW** : ☁️ (CloudFormationIndex) + CLOUD_LW_TAU_REF=10 (lit. stratus/cumulus 5–20). Avant : 🍰🪩⛅ × 1 → τ quasi nul.

### static/sync_panels.js
- T0 init quand anim+T<=0 ; displayConvergence no-op parent
- runComputeInParent appelle getEnabledStates() avant calcul (source de vérité anim = bouton visu)

### API_BILAN/physics/physics.js
- getH2OVaporEDSScale() — formule T,P,vapor,CO2 (pas d’époque)
- Credence (%) + Plage lit. en commentaire pour params tunables

### API_BILAN/albedo/calculations_albedo.js
- Archéen utilise clouds modernes pour ~15°C

---

## 3. Diagnostic (SENS_CONVERGENCE_ET_VALEURS.md)

**Cause identifiée** : À 15,7°C, Δ ≈ -35 W/m² (OLR trop élevé). La dichotomie converge vers la T où |Δ| ≤ tol → ~4,5°C.

**Chaîne** : OLR trop élevé à 15,7°C (273 vs ~238) → trop peu d’absorption IR ; EDS ~104,5 W/m² vs litt. ~155–165.

**Pistes à creuser** (ordre doc, voir SENS_CONVERGENCE_ET_VALEURS.md) :
1. **delta_z** / nombre de couches
2. **κ/τ** (cross-sections HITRAN, intégration verticale)
3. **getH2OVaporEDSScale** (≥400 ppm → scale=1 ; <400 → scale<1)
4. **Bande 15 µm CO2** (sous-résolution ou κ_CO2 trop faible)

**Credences** : getH2OVaporEDSScale ~60 % ; 🔬🌈 ~70 % ; HITRAN ~90 % ; delta_z ~70 % ; CLOUD_LW_TAU_REF ~55 %.

---

## 4. Ordre de vérification suggéré (doc)

1. **getH2OVaporEDSScale** (ne pas trop réduire H₂O)
2. **Résolution 🔬🌈** (500 bins = courbe propre, convergence ~4,5°C)
3. **Sections HITRAN** (T_ref, P_ref, plages ν)
4. **delta_z** / nombre de couches

---

## 5. Synthèse : Config vs calculé + littérature

| Piste | Config ou calculé | Variable / emplacement | Littérature |
|------|-------------------|------------------------|-------------|
| **1. getH2OVaporEDSScale** | **Calculé** | `physics.js` : formule T, P, vapor, CO2 → scale = 0.5 × f_T × f_P × f_v. Appliqué à κ_H2O dans `calculations.js` (3 endroits). | **Non validé**. Credence ~60 %. Dérivé du chevauchement 15–17 µm (H2O/CO2). Réf. Schmidt 2010 pour allocation overlap (split the difference), pas pour la formule scale. Plage lit. 0.3–1.0. |
| **2. Résolution 🔬🌈** | **Config** | `configTimeline.js` : `maxSpectralBinsConvergence = 500`. Optionnel : `spectralBinsMinFromHITRAN` (ex. 150). Entrée → `DATA['🧮']['🔬🌈']`. | Plage lit. 100–1000+ (LBL 200–500 typique). 500 = courbe propre, convergence ~4,5°C. N_min dérivable via `getSpectralBinBoundsFromHITRAN` (scripts/hitran_spectral_bin_bounds.py). |
| **3. κ/τ HITRAN** (T_ref, P_ref, plages ν) | **Calculé** (constantes en dur) | `hitran.js` : `HITRAN_T_REF_K = 296`, `HITRAN_P_REF_ATM = 1`. `calculations.js` : `T_ref = HITRAN.T_REF_K`, `P_ref = CONST.STANDARD_ATMOSPHERE_PA`. Plages ν : `hitran_lines_CO2/H2O/CH4.js` (fetch via scripts). `pressureBroadening` : config (`configTimeline.js`). | **HITRAN DB** ~90 % credence. doc/HITRAN.txt. T_ref lit. 273–300 K ; P_ref 0.5–2 atm. |
| **4. delta_z / couches** | **Calculé** (constante en dur) | `calculations.js` L102 : `delta_z = 30` (troposphère). Stratosphère : `delta_z_stratosphere = max(100, (delta_z*5)/precisionFactor)`. `precisionFactor` = `getPrecisionFactorFromFPS()` (FPS modifie stratosphère, pas troposphère). n_layers dérivé de z_range. | Credence ~70 %. Plage lit. 20–100 m (LBL 20–50 m, GCM ~100 m). 30 m après fix delta_z_real. |
| **Bande 15 µm CO2** | **Config (affichage)** | `physics.js` : `CONST.LAMBDA_CO2_CENTER = 15e-6` (marqueur plot). Sections efficaces : **HITRAN** (`hitran_lines_CO2.js`) — pas de bande fixe, LBL par raies. | Bande 15 µm = bande vibrationnelle CO2 standard (litt. bien établie). Sous-résolution ou κ_CO2 trop faible → EDS CO2 insuffisant. |

### Réponses directes

- **delta_z** : déjà serré (30 m). Stratosphère plus grossière (100 m min). Pas dans config.
- **κ/τ** : calculé via HITRAN ; T_ref/P_ref dans `hitran.js` (pas config). FPS ne modifie pas les bins λ, seulement la résolution verticale stratosphère.
- **getH2OVaporEDSScale** : calculé, **pas validé** par la littérature (formule empirique overlap H2O–CO2).
- **Bande 15 µm** : centre dans config (affichage) ; σ(λ) vient de HITRAN (LBL).

---

## 6. Correction appliquée (v1.0.8)

**Bug principal** : τ nuages LW quasi nul (🍰🪩⛅ ≈ 0.05–0.30 × 1 → τ_total ≈ 0.05–0.30, réparti sur ~400 couches → τ/layer ≈ 0.0001).

**Fix v1** : ☁️ + CLOUD_LW_TAU_REF=10 → runaway H₂O (T 33°C, EDS_H₂O 210 W/m²). **Fix v2** : CLOUD_LW_TAU_REF=1.5, h2o_eds_scale=0.70 (CO2≥400 ppm). Cible : EDS_H₂O ~72 W/m², EDS_nuages ~25 W/m², T_eq 13–17°C.

**☁️** : Formule réelle = Sundqvist (1 - (1-RH)^0.6) × 🍰💭. Pas 🍰🫧💧🌈 (doc calculations_albedo.js).

**Bug secondaire** (non corrigé) : CO₂ sous-estimé par aliasing spectral. Piste : grille condensée 5–25 µm ou 2000+ bins.

---

## 7. Références

- doc/SENS_CONVERGENCE_ET_VALEURS.md
- doc/COMPARAISON_LITTERATURE_16C.md
- doc/VAPEUR_VS_NUAGES.md (getH2OVaporEDSScale, overlap H2O–CO2)
- configTimeline.js : 🌡️🧮 par epoch, 40k ppm Archéen calibré ~15°C (commit 5ecb155)
