# Diagnostic modèle radiatif — Points à traiter

## 1. Affichage 📛 (H2O % / CO₂ %) vs Schmidt 2010

**Ce n'est pas un problème** : ce n'est pas la même grandeur. Notre affichage (🍰📛💧, 🍰📛🏭) = tau-ratio (part τ_X/τ_tot) ; Schmidt = attribution marginale (effet retrait sur G). Comparer 4 % à 20 % = confusion d'indicateur, pas un bug. Voir VAPEUR_VS_NUAGES.md (même dossier doc/API/).

**Note (définition)** : Les 50 % / 20 % de Schmidt sont une **attribution marginale** (effet de retrait de chaque absorbeur sur G), pas la même grandeur que notre affichage **tau-ratio** (🍰📛💧, 🍰📛🏭). Comparer 4 % (nous) à 20 % (Schmidt) serait une confusion d’indicateur ; voir VAPEUR_VS_NUAGES.md (même dossier doc/API/).

**Cause** : Bande H₂O 17 µm chevauche CO₂ 15 µm. L'attribution `(tau_H2O/tau_tot) × flux_absorbé` donne trop de crédit à H₂O si ses sections efficaces surestiment l'absorption.

**Correction actuelle** : `getH2OVaporEDSScale()` (T, P, vapor, CO2) — formule physique, pas de hack par époque. Partage overlap H2O–CO2 "split the difference" dans `API_BILAN/radiative/calculations.js`.

**Correction idéale** : Modéliser explicitement le chevauchement (attribution marginale par λ, ou correlated-k) ; ou expériences retrait/ajout pour afficher un % type Schmidt en plus du tau-ratio.

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
