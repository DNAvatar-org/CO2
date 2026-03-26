# Vapeur d'eau vs Nuages — Distinction physique et architecture

## Référence : Schmidt et al. 2010 (contribution EDS terrestre)

| Composant | État | Contribution EDS | Comportement physique |
|-----------|------|------------------|------------------------|
| Vapeur d'eau | Gaz | ~50 % | Absorbe sur des raies spectrales précises |
| Nuages | Gouttelettes / Glace | ~25 % | Absorbe "en bloc" (corps gris/noir) et diffuse |
| CO₂ | Gaz | ~20 % | Absorbe sur bandes clés (ex: 15 µm) |
| Autres (CH₄, O₃) | Gaz | ~5 % | Complémentaire |

**Total H₂O (vapeur + nuages) ≈ 75 %**, pas 93 %.

### Plage IR : vapeur ≠ nuages

| Composant | Phase | Plage / forme IR |
|-----------|--------|-------------------|
| **Vapeur** (ex. 0,8 % H2O en masse, ~400–4000 ppm) | Gaz | **Bandes spectrales** : 6,3 µm (vibration), ~17 µm, continuum fenêtre 8–12 µm. Raies et bandes précises (HITRAN). |
| **Nuages** (gouttes, glace) | Liquide / solide | **Absorption large bande** : type corps gris/noir sur tout le LW (≈ 4–100 µm). Pas de raies fines ; absorption + diffusion. |

Donc la vapeur ne se « répartit pas en 2 morceaux » : il y a **deux contributeurs distincts** — (1) la **vapeur** (gaz, bandes 6,3 / 17 µm + continuum) et (2) les **nuages** (condensé, IR large bande). Leurs plages IR ne sont pas les mêmes (vapeur = bandes, nuages = continuum). Dans Schmidt, vapeur ~50 % et nuages ~25 % sont alloués séparément.

---

## Architecture actuelle du modèle

### 1. Vapeur d'eau (gaz) — dans l'EDS IR

- **Variable** : `DATA['💧']['🍰🫧💧']` (fraction de vapeur au niveau de la mer)
- **Profil vertical** : `waterVaporFractionAtZ(z)` = r₀ × exp(-z/H_H2O)
- **Calcul spectral** : `API_BILAN/radiative/calculations.js` → `kappa_H2O = crossSectionH2O(λ) × n_H2O`
- **Bandes** : 6.3 µm et 17 µm (`crossSectionH2O`)
- **Contribution EDS** : via `sum_blocked_H2O` (tau_H2O / tau_tot × flux absorbé)

### 2. Nuages — EDS IR (ajout ultérieur)

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

### Méthode Schmidt 2010 (littérature)

Schmidt et al. (2010), J. Geophys. Res., doi:10.1029/2010JD014287 : ils **ne font pas** (tau_i/tau_tot)×flux. Ils utilisent le module radiatif GISS ModelE pour des **expériences** : retrait de chaque absorbeur (H2O, nuages, CO2, …), puis absorption avec un seul absorbeur. Ils obtiennent ainsi "single-factor removal" et "single-factor addition", puis **allouent les chevauchements** : "Given an overlap between two absorbers, an obvious allocation is to **split the difference**, i.e., if 5% of the net LW radiation could be absorbed either by water vapor or CO2, then **each is allocated 2.5%**." Résultat : H2O ~50 %, nuages ~25 %, CO2 ~19 %, autres ~7 %. Les nuages sont inclus dans leur EDS (notre modèle ne les compte pas en IR).

### Ce n’est pas le même % (Schmidt vs nous)

**Deux définitions différentes — pas une erreur de calcul.**

| Définition | Schmidt (littérature) | Nous (tau-ratio) |
|------------|------------------------|------------------|
| **Question** | « Si on **retire** le CO₂, de combien baisse l’absorption LW totale ? » (effet marginal) | « À chaque λ, quelle **fraction** de l’épaisseur optique est due au CO₂ ? » (répartition proportionnelle) |
| **Méthode** | Expériences : run **sans** CO₂ → ΔG ; run **sans** H₂O → ΔG ; puis allocation des chevauchements. | À chaque (couche, λ) : pct_CO2 = τ_CO2 / τ_tot × flux absorbé, puis normalisation à 100 %. |
| **Résultat type** | CO₂ ~20 % (retirer CO₂ fait chuter G d’environ 20 %) | CO₂ ~4 % (τ_CO2 ≪ τ_H2O à la plupart des λ) |

Donc **4 % (nous) et 20 % (Schmidt) ne sont pas le même indicateur** : l’un est une part proportionnelle de τ, l’autre une contribution marginale (retrait). La physique du transfert radiatif (et donc la **température d’équilibre T**) est la même ; seul le **diagnostic** « qui a quel % de l’EDS » change selon la définition. Aucun « ajustement » de T avec des expériences : T vient du bilan de flux ; les expériences servent uniquement à **définir** les parts pour l’affichage.

**Si on ajoute les nuages en EDS** : total = vapeur + nuages + CO₂ + CH₄. Le dénominateur augmente → **le % CO₂ (tau-ratio) baisse encore** (ex. 4 % → ~3 %). On s’éloigne de 20 % parce que 20 % chez Schmidt est un **autre** % (marginal), pas le tau-ratio.

### Expériences retrait/ajout : précision ou hack ?

**Pas un hack.** C’est la **définition standard** en climatologie pour « contribution à l’effet de serre » quand il y a **chevauchements spectraux** (H₂O et CO₂ absorbent dans les mêmes bandes).  
- **Problème** : si on utilise (τ_i/τ_tot), un absorbeur dominant (H₂O) prend presque tout le crédit dans les bandes partagées → CO₂ sous-estimé en % affiché.  
- **Approche Schmidt** : on mesure l’effet **réel** de chaque acteur : « retirer le CO₂ fait baisser G de combien ? » → nombre directement interprétable (sensibilité au CO₂).  
- **En résumé** : les expériences retrait/ajout ne « corrigent » pas la physique ; elles **définissent** un % cohérent (contribution marginale). On pourra plus tard **implémenter les mêmes expériences** (colonnes sans CO₂, sans H₂O, etc.) pour : (1) afficher ce %-là en plus du tau-ratio ; (2) **vérifier** si notre physique est correcte (comparer ΔG à la littérature quand on retire le CO₂ — si notre ΔG est du même ordre que Schmidt, le calcul de T et des flux est cohérent ; si le % tau-ratio reste à 4 %, c’est la définition qui diffère, pas forcément le code).

### Attribution EDS : les trois notions (τ, overlap, références)

Trois choix conceptuels, souvent confondus :

| Notion | Description | Qui l’utilise |
|--------|-------------|----------------|
| **1. Attribution par τ** | À chaque (couche, λ), on répartit le flux absorbé proportionnellement aux épaisseurs optiques : part_X = τ_X/τ_tot. Pas de proportion en moles seules : c’est τ = σ×n×Δz qui compte (σ = section efficace, n = densité). | **Nous** (et toute méthode « tau-weighted »). |
| **2. Overlap H₂O–CO₂ (bande 15–17 µm)** | Dans la plage où H₂O et CO₂ absorbent ensemble, il faut décider à qui « attribuer » cette absorption. Deux options classiques : **(A)** tout attribuer au CO₂ (bande 15 µm = bande CO₂) → **KT97** (Kiehl & Trenberth 1997, BAMS) ; **(B)** partager l’overlap de façon neutre (« split the difference » : chacun reçoit la moitié du crédit de la partie commune) → **Schmidt et al. 2010**, JGR. | **Nous** : (B) partage réaliste (Schmidt). **KT97** : (A) bande 15 µm → 100 % CO₂. |
| **3. Définition du % affiché** | **(A)** Part locale de l’absorption = τ_X/τ_tot (une seule passe). **(B)** Contribution marginale = « si on retire le gaz, de combien baisse G ? » (expériences retrait/ajout). | **Nous** : (A). **Schmidt** : (B) → leurs ~20 % CO₂, ~50 % H₂O. |

**Clarification Schmidt vs KT97**

- **Schmidt 2010** ne met **pas** 100 % de l’overlap sur le CO₂. Ils appliquent « split the difference » sur les chevauchements (comme nous). Leur ~20 % CO₂ vient des **expériences** (retrait CO₂ → ΔG), pas d’une attribution par bande.
- **KT97** : répartition **par bande spectrale** ; la bande 15 µm est comptée **entièrement** comme CO₂ (même où H₂O absorbe) → d’où ~32 W/m² CO₂ dans leur décomposition. C’est la méthode « 100 % CO₂ sur la bande commune ».

**Notre choix actuel (implémenté)**

- Attribution **par τ** (τ_X/τ_tot) à chaque (couche, λ).
- Overlap H₂O–CO₂ : **partage réaliste** (split the difference, Schmidt 2010) — on ne favorise ni H₂O ni CO₂ sur la plage commune.
- Affichage : **répartition réaliste** (probabilité proportionnelle à τ après partage de l’overlap). Réf. Schmidt et al. 2010, J. Geophys. Res., doi:10.1029/2010JD014287 ; KT97 BAMS 1997 pour la comparaison bande 15 µm.

### Notre méthode actuelle vs littérature

Ancienne méthode : `(tau_i/tau_tot) × flux_absorbé` → tout le crédit du chevauchement au gaz dominant → H2O% ~90 %. **Correction (alignée Schmidt)** : à chaque (couche, λ), chevauchement H2O–CO2 = min(τ_H2O, τ_CO2) ; on partage l’overlap (« split the difference ») : H2O += (τ_H2O − overlap/2)/τ_tot × abs_flux, CO2 += (τ_CO2 + overlap/2)/τ_tot × abs_flux. Total = 100 %. Implémenté dans `calculations.js`. **Pourquoi H2O% reste élevé (~63–88 %) et pas ~50 % ?** Le partage ne concerne que le **chevauchement** = min(τ_H2O, τ_CO2) à chaque λ. Quand τ_H2O ≫ τ_CO2 (souvent le cas), overlap = τ_CO2 est petit → on ne transfère que peu de crédit vers CO2. Schmidt 2010 obtient ~50 % H₂O en (1) faisant des **expériences GCM** (retrait de chaque absorbeur) et (2) en incluant les **nuages** (~25 %) dans l’EDS ; notre EDS ne compte que les gaz (vapeur, CO₂, CH₄). Pour s’approcher de la littérature il faudrait soit des expériences "sans H2O / sans CO2", soit modéliser l’absorption IR des nuages.

---

## Corrections proposées

### A. Réduire l’absorption de la vapeur (priorité) — ✅ Implémenté

- `getH2OVaporEDSScale()` dans `physics.js` — **dérivé de T, P, vapor, CO2** (pas d'époque).
- **CO2 > 1%** : scale = 1.0 (atmosphère riche, ex. Hadéen).
- **CO2 ≤ 1%** : `scale = 0.5 × f_T × f_P × f_v` clamp [0.2, 1] — corrige chevauchement H2O/CO2 15–17 µm.
- Réf Terre (288K, 1 atm, ~1% vapor) → ~0.5. Archéen (CO2 ~0.8%, 8000 ppm) → ~0.48 (scale ~0.5, pas 1.0).
- **Impact Archéen** : avec scale ~0.48, T simulée ~8°C (fourchette basse lit. 8–30°C). Avec scale=1.0 (CO2>1%), on obtiendrait ~15°C — la convergence à 15°C était conditionnelle (CO2 élevé ou tuning).
- Appliqué : `kappa_H2O *= getH2OVaporEDSScale()` dans `calculations.js` (3 endroits).

### B. Nuages dans l’EDS — nouveau calcul, nouveau champ

**Nuages pour EDS ≠ nuages pour albédo**
- **Albedo** : nuages déjà calculés (☁️, 🍰🪩⛅) → **réflexion SW** (courtes longueurs d’onde). Utilisés dans `calculateAlbedo()`.
- **EDS** : absorption **LW** (IR). Aujourd’hui les nuages ne sont **pas** dans le transfert radiatif IR → **nouveau calcul** (κ_nuage, τ_nuage par couche/λ, ou corps gris par couche).

**Nouveau champ EDS**
- Oui : ajouter un champ **nuages** dans le breakdown EDS (ex. `🍰📛⛅` pour « part EDS nuages »). Logo : **⛅** (nuage) — déjà utilisé en albédo (🍰🪩⛅) ; en EDS on aurait 🍰📛⛅ = pct nuages dans l’EDS. Structure actuelle : 📛 = { 🧲📛, 🍰📛🏭, 🍰📛💧, 🍰📛🐄 } ; à étendre avec 🍰📛⛅ quand l’absorption IR nuages sera implémentée.

**Problème des parts (Schmidt vs nous)**
- **Schmidt** : vapeur ~50 %, nuages ~25 %, CO₂ ~20 %, autres ~5 % (total 100 %).
- **Nous** (sans nuages EDS) : vapeur ~88 %, CO₂ ~4 %, CH₄ ~8 % (total 100 %).
- Pour tendre vers Schmidt **sans** tricher :
  1. **Ajouter** l’absorption IR des nuages (nouveau calcul) → on aura 4 contributeurs : vapeur, nuages, CO₂, CH₄. Total = 100 %.
  2. Le **dénominateur** total augmente (on ajoute `sum_blocked_clouds`), donc **vapeur% baisse** (ex. 88 % → ~60 % si nuages prennent ~25 %). Les 88 % actuels ne « deviennent » pas 50 %+25 % par magie : une fois les nuages comptés, la part **vapeur** = `sum_blocked_H2O / (sum_H2O + sum_clouds + sum_CO2 + sum_CH4)` baisse car le total augmente.
  3. **CO₂ à 20 %** : avec notre attribution (ratio τ par λ), CO₂ reste faible (τ_CO2 ≪ τ_H2O à la plupart des λ). Pour avoir ~20 % comme Schmidt il faudrait soit (a) des **expériences** type « sans CO₂ / sans H₂O » (single-factor removal) pour réallouer, soit (b) accepter que notre répartition (tau-ratio) donne CO₂ ~4 % et documenter la différence avec la littérature. On ne peut pas « forcer » 20 % CO₂ sans changer la méthode d’attribution ou la physique.

**En résumé**
- Les **88 % vapeur** actuels = uniquement le gaz (0,8 % H2O en masse). Ils ne « deviennent » pas 50 %+25 % : on **ajoute** un terme nuages (nouveau calcul LW) ; alors vapeur% baisse (ex. ~50–60 %) et on affiche nuages% (ex. ~20–25 %). Pour approcher 50 % vapeur et 20 % CO₂ il faudrait en plus une attribution de type Schmidt (expériences retrait/ajout), pas seulement ajouter les nuages.

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
| `static/climate.js` | `calculateH2OForcing` (diagnostic ΔF affichage, vapeur + nuages, pas spectral) |
