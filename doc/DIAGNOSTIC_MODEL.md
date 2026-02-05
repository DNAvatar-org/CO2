# Diagnostic modèle radiatif — Points à traiter

## 1. Chevauchement spectral H₂O/CO₂ (Band Saturation)

**Problème** : H2O 93%, CO2 2% au lieu de ~50% / ~20% (Schmidt 2010).

**Cause** : Bande H₂O 17 µm chevauche CO₂ 15 µm. L'attribution `(tau_H2O/tau_tot) × flux_absorbé` donne trop de crédit à H₂O si ses sections efficaces surestiment l'absorption.

**Correction actuelle** : `getH2OVaporEDSScale()` (T, P, vapor, CO2) — formule physique, pas de hack par époque.

**Correction idéale** : Modéliser explicitement le chevauchement (attribution marginale par λ, ou correlated-k).

---

## 2. Fraction nuageuse (cloud_frac) trop faible

**Problème** : cloud_frac ≈ 30% au lieu de ~67% (Terre moderne).

**Conséquence** : Albédo trop faible, solar_absorbed trop élevé.

**Statut** : cloud_frac est calculé (calculateCloudFormationIndex, calculateAlbedo). L'algo peut être ajusté.

---

## 3. Runaway glace (Feedback Loop)

**Problème** : Glace disparaît instantanément entre Init et Cycle0 (ice 0.049 → 0.000).

**Conséquence** : Choc thermique, albédo chute (0.29 → 0.27), +8 W/m² brutal.

**Action** : Seuil de fonte trop binaire ou timestep trop grand. Adoucir la transition.
