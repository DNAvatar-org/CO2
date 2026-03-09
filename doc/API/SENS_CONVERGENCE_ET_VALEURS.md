# Sens de 🧮🛑 et liste des valeurs erronées / incohérentes

## 1. Que signifie `🧮🛑 = 'converged'` ?

**Définition (calculations_flux.js)** : la boucle radiatif s’arrête avec `🧮🛑 = 'converged'` lorsque :

```text
|🔺🧲| ≤ 🧲🔬
```

- **🔺🧲** : déséquilibre radiatif (W/m²) = flux entrant − flux sortant. À l’équilibre physique on veut **🔺🧲 ≈ 0**.
- **🧲🔬** : tolérance en W/m², **pas** une précision en K. Elle est calculée par `computeToleranceWm2(T, precision_K)` :
  - **tol = max(4 σ T³ × precision_K, tolMinWm2)**
  - `precision_K` vient de l’époque (ex. 0.01 K → tol ≈ 0,055 W/m² à 288 K).

Donc **`'converged'` = "on a considéré que le bilan était assez proche de zéro"** (|Δ| ≤ tol). Ce n’est pas "équilibre parfait" (Δ = 0).

**Incohérence possible dans un log** : si tu vois en même temps `🔺🧲 = 5,93` et `🧲🔬 = 0,055` et `🧮🛑 = 'converged'`, alors **5,93 ≤ 0,055 est faux**. Donc soit :
- le log mélange deux instants (ex. affichage d’un état intermédiaire alors que 🧮🛑 vient du dernier arrêt),  
- soit à l’instant où on a mis `converged`, la tolérance utilisée était en fait **≥ 5,93** (ex. `precision_K` plus grand pour cette époque, donc tolérance en W/m² plus grande).

---

## 2. Convention des flux (🧲)

```text
🔺🧲 = flux_entrant − flux_sortant = (🧲☀️🔽 + 🧲🌕🔽) − 🧲🌈🔼
```

- **🧲☀️🔽** : flux solaire absorbé (W/m²). Litt. Terre ~238 (S/4 × (1−albédo)).
- **🧲🌕🔽** : flux géothermique (W/m²), négligeable (~0,09).
- **🧲🌈🔼** : flux sortant au sommet (OLR, W/m²). À l’équilibre doit égaler flux_entrant (~238).
- **🧲🌑🔼** : σT⁴ (surface corps noir), pas le flux au sommet.
- **🧲🪩🔼** : flux réfléchi (albédo × incident).

Si 🔺🧲 = 5,93 alors (238,27 + 0,09) − 🧲🌈🔼 = 5,93 → **🧲🌈🔼 = 232,43**. À l’équilibre il faudrait 🧲🌈🔼 ≈ 238,36. Donc **🧲🌈🔼 est trop faible de 5,93 W/m²** (trop de piégeage IR = flux sortant sous-estimé ou EDS surestimé dans le calcul spectral).

### 2.1 Diagnostic : 🔺🧲 ≠ 0 — quelles valeurs 🧲 sont fausses ?

**À l’équilibre radiatif (TOA)** : flux entrant = flux sortant ⇒ **🔺🧲 = (🧲☀️🔽 + 🧲🌕🔽) − 🧲🌈🔼 ≈ 0**. Si 🔺🧲 n’est pas proche de 0, le déséquilibre vient d’une mauvaise valeur parmi les trois termes.

| Terme | Rôle | Valeur litt. / équilibre | Si 🔺🧲 &gt; 0 (trop de flux entrant) | Si 🔺🧲 &lt; 0 (trop de flux sortant) |
|-------|------|---------------------------|----------------------------------------|----------------------------------------|
| 🧲☀️🔽 | Solaire absorbé | ~238 W/m² (S/4×(1−a)) | En général OK (vérifier albédo) | En général OK |
| 🧲🌕🔽 | Géothermique | ~0,1 W/m² | Négligeable | Négligeable |
| **🧲🌈🔼** | OLR (flux sortant TOA) | ≈ flux_entrant (~238) à l’équilibre | **Trop faible** (trop d’absorption IR) | **Trop élevé** (pas assez d’absorption IR) |

- **🔺🧲 &gt; 0** (ex. +5,93) : 🧲🌈🔼 trop bas → trop de piégeage IR dans le modèle (EDS trop fort ou bug intégration).
- **🔺🧲 &lt; 0** (ex. −15,93) : 🧲🌈🔼 trop haut → pas assez d’absorption IR (τ trop faibles, ou résolution/grille).

**Référence littérature (Terre, équilibre)** : KT97, Schmidt — flux entrant ~238 W/m², OLR ~238 W/m², 🧲🌑🔼 = σT⁴ (surface) ~390–400 W/m², 🧲🪩🔼 = albédo × S/4 ~100 W/m² si a≈0,3. Les seules grandeurs à comparer pour l’équilibre sont **🧲☀️🔽**, **🧲🌈🔼** et **🔺🧲** ; 🧲🌑🔼 et 🧲🪩🔼 sont des diagnostics surface/albédo, pas la cause du déséquilibre.

---

## 3. Liste des valeurs erronées / incohérentes, par ordre de calcul

Ordre du pipeline. Référence littérature : COMPARAISON_LITTERATURE_16C.md, flux Terre ~238 W/m² absorbé / OLR ~238 à l’équilibre, EDS ~60 % H₂O / 20–25 % CO₂.

### 3.1 🧲 (flux)

| # | Variable | Valeur log | Litt. / équilibre | Problème |
|---|----------|------------|-------------------|----------|
| 1 | 🧲☀️🔽 | 238,267 | ~238 W/m² | OK. |
| 2 | 🧲🌕🔽 | 0,090 | ~0,1 W/m² | OK. |
| 3 | 🧲🌑🔼 | 394,458 | σT⁴ à 288,8 K ≈ 394,5 | OK (corps noir surface). |
| 4 | **🧲🌈🔼** | **232,431** | À l’équilibre ≈ 238,36 | **Trop faible de 5,93 W/m²** → trop de piégeage IR (ou pas assez d’émission au sommet). C’est la cause directe de 🔺🧲 > 0. |
| 5 | 🧲🪩🔼 | 102,015 | albédo × incident | OK si albédo ~0,30. |
| 6 | **🔺🧲** | **5,927** | ≈ 0 à l’équilibre | **Incohérent** : déséquilibre non nul (conséquence de 🧲🌈🔼 trop bas). |

### 3.2 🧮 (état convergence / T)

| # | Variable | Valeur log | Litt. / attendu | Problème |
|---|----------|------------|-----------------|----------|
| 1 | 🧮🌡️ | 288,800 K (15,65°C) | 288 K ~15°C | OK. |
| 2 | 🧲🔬 | 0,055 | Tolérance W/m² (4σT³×precision_K) | OK si precision_K≈0,01. Incohérent avec "converged" si Δ=5,93 au même instant. |
| 3 | 🔬🌈, 🔬🫧 | 150, 622 | Bins spectaux / couches | Paramètres calcul, pas à comparer litt. |
| 4 | 🧮🌡️🔽, 🧮🌡️🔼 | 288,8 ; 289,885 | Bornes Search | OK. |
| 5 | 🌡️ (dans 🧮) | 282,618 K (9,5°C) | Rempli depuis main.js (data.temp_surface) — peut être T d’un autre panneau / source, pas 🧮🌡️. | Cohérence avec 🧮🌡️=288,8 K à vérifier selon le flux d’affichage. |
| 6 | 🧮🛑 | 'converged' | — | Peut être valeur précédente ; trompeur si Δ=5,93. |

### 3.3 📛 (EDS) — et comparaison Schmidt

**Notre calcul des % (calculations.js)**  
- Une seule passe de transfert radiatif.  
- À chaque (couche, λ) : on attribue le flux absorbé `abs_flux` aux gaz/nuages par **part de τ** dans le τ total, avec **partage d’overlap H2O–CO2** : `overlap = min(τ_H2O, τ_CO2)`, H2O reçoit `(τ_H2O − overlap/2)/τ_tot × abs_flux`, CO2 reçoit `(τ_CO2 + overlap/2)/τ_tot × abs_flux`, nuages `τ_cloud/τ_tot × abs_flux`.  
- **pct = sum_blocked_X / sum_blocked** → répartition **locale, pondérée par τ** de l’absorption (overlap H2O–CO2 partagé de façon réaliste, Schmidt « split the difference »).

**Schmidt et al. (2010, JGR)**  
- Métrique : **G = flux LW surface − flux LW TOA** (~155 W/m²).  
- **Plusieurs expériences** : retrait d’un absorbeur, un seul absorbeur, etc.  
- **Attribution des overlaps** : Schmidt applique “split the difference” aux chevauchements ; chez eux le % est défini par **changements de G** (expériences retrait), chez nous par **absorption locale** (τ_X/τ_tot après partage de l’overlap).  
- Résultat **all-sky** : H₂O ~50 %, nuages ~25 %, CO₂ ~19 %, reste ~7 %.

**Conclusion : ce n’est pas le même %**  
- **Schmidt 20 % CO₂** = part **attribuée** à CO₂ dans G après expériences multi-run et partage des overlaps (effet marginal).  
- **Notre 3,8 % CO₂** = part de l’**absorption** attribuée à CO₂ par **τ_local / τ_tot** (avec partage overlap H2O–CO2).  
- Dans notre atmosphère τ_H2O ≫ τ_CO2 presque partout (vapeur ~0,8 %, CO2 ~400 ppm) → une répartition “tau-weighted” donne logiquement peu au CO2 et beaucoup à H2O. Ce n’est pas une erreur de calcul, c’est une **définition différente** ; comparer 3,8 % à 20 % serait une **confusion d’interprétation**.

**Chaîne de cause (déséquilibre)**  
- **📛 (EDS) trop fort** → **🧲🌈🔼** (flux sortant) trop faible → **🔺🧲 > 0**.  
- Si le modèle donne trop d’absorption (vapeur, nuages, ou facteur vapeur `getH2OVaporEDSScale`), EDS monte et 🧲🌈🔼 baisse.

| # | Variable | Valeur log | Litt. / définition | Problème |
|---|----------|------------|---------------------|----------|
| 1 | 🧲📛 | 159,960 | EDS = 🧲🌑🔼 − 🧲🌈🔼 ≈ 162 | Petit écart arrondi. |
| 2 | 🍰📛🏭 | 0,038 (3,8 %) | **Notre** part τ (CO2). Schmidt ~19 % = attribution G (autre méthode) | Pas directement comparable ; 3,8 % cohérent avec τ_CO2 ≪ τ_H2O dans notre modèle. |
| 3 | 🍰📛💧 | 0,884 (88,4 %) | **Notre** part τ (H2O). Schmidt ~50 % = attribution G | Idem : définition différente ; facteur vapeur (h2o_eds_scale) et nuages récemment ajoutés peuvent augmenter la part H2O. |
| 4 | 🍰📛⛽ | 0,076 (7,6 %) | CH₄ trace | OK. |
| 5 | 🍰📛⛅ | 0,003 (0,3 %) | Nuages (récemment ajoutés en EDS) | À confronter à tau_cloud et couverture. |
| 6 | 🔺📛💧 | 27,086 W/m² | **Diagnostic ΔF H₂O** (affichage, convention) : α×ln(q/q_ref)×temp_factor. Pas l’EDS : EDS = flux bloqué actuel (état) ; ΔF = convention affichage (grandeur différente, même unité). | Indicatif ; pas à comparer à 🧲📛💧 (part EDS H₂O en W/m²). |

### 3.4 Autres blocs (🫧, 💧, 🪩)

- **🫧** : 🍰🫧📿🌈, 🍰🫧🏭🌈, 🍰🫧💧🌈, 🍰🫧⛽🌈 = 0 → soit calcul EDS/spectral pas encore fait à cet instant, soit remplis ailleurs ; 📛 montre bien une répartition (CO₂/H₂O/CH₄/nuages).
- **💧** : cohérent avec litt. (précipitation P=W/τ ~2,1 mm/j).
- **🪩** : albédo 0,30 cohérent ~0,29 Terre.

---

## 4. Résumé ordre de calcul et valeurs erronées

1. **Config** (precision_K) → si trop grand, "converged" accepté avec Δ trop grand.  
2. **📛 (EDS) trop fort** → **🧲🌈🔼** trop faible (232,43 au lieu de ~238) → **🔺🧲** = 5,93 (cause : trop d’absorption, pas assez de flux sortant).  
3. **🔺🧲** = 5,93 → conséquence (non équilibre).  
4. **📛 %** : **🍰📛🏭** (3,8 %) et **🍰📛💧** (88,4 %) ne sont **pas** les mêmes grandeurs que Schmidt (20 % CO₂, 50 % H₂O) : nous on calcule une répartition **tau-weighted** de l’absorption (une passe) ; Schmidt une **attribution de G** après expériences multi-run et partage des overlaps. Pas d’erreur de calcul, **interprétation différente**.  
5. **🧮🛑** = 'converged' → peut être valeur précédente ; trompeur si Δ=5,93.

---

## 5. Valeurs comparables à la littérature (pour valider ou infirmer)

**Même grandeur physique, mêmes unités** → on peut comparer pour infirmer (ou valider) le modèle. Réf. doc/COMPARAISON_LITTERATURE_16C.md.

| Bloc | Variable | Ton log @15,7°C | Littérature (même grandeur) | Verdict |
|------|----------|-----------------|-----------------------------|---------|
| **💧** | 🍰💧🧊 | 0,022 (2,2 %) | ~2–3 % glace (IPCC) | OK |
| **💧** | 🍰💧🌊 | 0,978 | ~97 % océan | OK |
| **💧** | 🍰🫧💧 | 0,009 (0,9 % ≈ 9 g/kg) | 0,25 % global ; 1 % air humide ; 8 g/kg ≈ 75 % RH (Wallace & Hobbs) | OK (air humide) |
| **💧** | 🍰🫧☔ | 0,799 (79,9 % RH) | 70–80 % typique (HadISDH) | OK |
| **💧** | 🍰⚖️💦 | 2,466e-5 kg/m²/s (~2,1 mm/j) | ~2,7 mm/j (GPCP) ≈ 3,1e-5 kg/m²/s | OK (ordre 2–3 mm/j) |
| **💧** | ⏳☔ | 1,157e-6 s⁻¹ | τ ~ 8–10 j → 1/τ ~ 1,2e-6 s⁻¹ (Nature Rev. Earth Env. 2021) | OK |
| **🫧** | 🎈 | 0,978 | 1 atm (1013 hPa) | OK |
| **🫧** | 🧪 | 0,029 | ~0,029 kg/mol (Wikipedia, Allen) | OK |
| **🫧** | 📏🫧🛩 | 8,454 km | 6–10 km (pôles), 16–18 km (équateur), échelle ~8,5 km | OK |
| **🫧** | 🍰🫧🏭 | 6,348e-4 (fraction massique) → ~420 ppmv | ~412 ppm actuel (NOAA) ; litt. en ppmv | OK (époque 2025) |
| **🫧** | 🍰🫧🫁, 🍰🫧💨 | 0,227 ; 0,764 | O₂ ~21 %, N₂ ~78 % | OK |
| **🪩** | 🍰🪩📿 | 0,30 (30 %) | ~0,29 (29 %) (Stephens, EPIC) | OK |
| **🪩** | ☁️ | 0,618 (61,8 %) | ~60–70 % (ISCCP) | OK |
| **🧲** | 🧲☀️🔽 | 238,267 W/m² | ~238 (S/4×(1−albédo)) | OK |
| **🧲** | 🧲🌈🔼 | 232,431 W/m² | À l'équilibre ≈ 238 W/m² (OLR = flux entrant) | **Écart** : trop faible → déséquilibre |
| **🧲** | 🔺🧲 | 5,927 W/m² | À l'équilibre ≈ 0 | **Écart** : non équilibre |
| **🧲** | 🧲📛 | 159,960 W/m² | G (surface − TOA) ~155 W/m² (KT97, Schmidt) | OK (ordre 155–160) |
| **🧮** | 🧮🌡️ | 288,8 K (15,65°C) | État ~15–16°C cible | OK |

**Note CO₂** : 🍰🫧🏭 est une **fraction massique** (CO2_kg / atm_total) ; la littérature donne des **ppmv** (fraction molaire × 10⁶). Conversion : ppmv ≈ 🍰🫧🏭 × (M_air/M_CO2) × 10⁶ ≈ 🍰🫧🏭 × 0,66 × 10⁶ ; donc 6,35e-4 → ~420 ppmv, cohérent avec config 2025 (~420 ppm) et NOAA ~412 ppm.

**Comparables en W/m²** : nos **parts EDS** (🍰📛🏭, 🍰📛💧, …) sont des **proportions** de l’EDS total ; les **W/m² retenus par composant** = 🧲📛 × 🍰📛❀ (CO2, H2O, CH4, nuages) sont en **W/m²** et **comparables à la littérature** quand elle donne des contributions EDS en W/m² (ex. KT97, contributions par gaz). Logs : `[EDS W/m²][calculations_flux.js] total=… CO2=… H2O=…` à la convergence ; debug : `EDS W/m²: total=… CO2=… H2O=…`.

**EDS vs diagnostic ΔF** : **EDS** (🧲📛) = flux bloqué actuellement par l’atmosphère (état), en W/m². **ΔF** (ex. 🔺📛💧) = convention affichage (climate.js), pas utilisé pour le calcul de T ; formule type α×ln(C/C_ref). Même unité W/m², grandeur différente : 🔺📛💧 n’est pas la part EDS H₂O. Le mot **« radiatif »** (transfert radiatif, équilibre radiatif, boucle radiatif) désigne la physique ; c’est l’expression **« forçage radiatif »** qui est la convention ΔF (affichage), retirée des libellés.

**Non comparables (définition différente)** : les **%** 🍰📛🏭, 🍰📛💧, etc. (tau-ratio) vs % Schmidt ; 🍰🫧❀🌈 (capacités IR) ; 🔺📛💧 (diagnostic affichage, pas part EDS).

---

## 5.1 2025 vs littérature — snapshot et mauvaises valeurs

Snapshot typique à convergence (époque 2025) :

- **🧮** : 🧮🌡️=288,8 K (15,65°C), 🧮🛑='converged', 🧲🔺⏮=5,927
- **🧲** : 🧲☀️🔽=238,27, 🧲🌕🔽=0,09, 🧲🌑🔼=394,46, **🧲🌈🔼=232,43**, **🔺🧲=5,93**
- **📛** (output convergence sans 🔺📛💧) : 🧲📛=159,96 ; 🧲📛🏭=6,04, 🧲📛💧=141,37, 🧲📛⛽=12,14, 🧲📛⛅=0,42

| Variable | Modèle 2025 | Litt. 2025 | Verdict |
|----------|-------------|------------|---------|
| 🧮🌡️ | 288,8 K (15,65°C) | ~15–16°C | OK |
| 🧲☀️🔽 + 🧲🌕🔽 | 238,36 W/m² | ~238 W/m² | OK |
| **🧲🌈🔼** | **232,43 W/m²** | **~238 W/m² (OLR équilibre)** | **Mauvais : trop faible** |
| **🔺🧲** | **5,93 W/m²** | **≈ 0 (équilibre)** | **Mauvais : déséquilibre** |
| 🧲📛 | 159,96 W/m² | G ~155–160 W/m² (KT97) | OK |
| 🍰🫧🏭 → ppmv | ~420 ppmv | ~412 ppm (NOAA) | OK |
| 🍰🪩📿, ☁️ | 30 %, 62 % | ~29 %, 60–70 % | OK |

**EDS W/m² par composant (🧲📛🏭, 🧲📛💧, 🧲📛⛽, 🧲📛⛅) vs littérature** :

Même grandeur physique : flux (W/m²) retenus / réémis vers la surface. La différence 6 vs 32 W/m² (CO₂) vient de la **méthode d’attribution** : nous on répartit le flux absorbé à chaque (couche, λ) par τ_i/τ_tot (tau-ratio) ; KT97 donne des contributions type clear-sky ou marginale (effet retrait d’un gaz). Quand τ_H₂O ≫ τ_CO₂ sur beaucoup de longueurs d’onde, le tau-ratio donne peu au CO₂ ; une mesure marginale (« retirer le CO₂ ») donne un effet plus grand.

| Composant | Modèle 2025 (W/m²) | Littérature (W/m²) | Note |
|-----------|---------------------|--------------------|------|
| 🧲📛🏭 (CO₂) | ~6 | KT97 clear-sky : CO₂ ~32 | Écart : notre attribution tau-ratio (τ_CO₂/τ_tot) donne peu car τ_H₂O ≫ τ_CO₂ ; KT97 ~32 = ordre de grandeur contribution marginale/clear-sky. |
| 🧲📛💧 (H₂O) | ~141 | KT97 clear-sky : H₂O ~75 ; total G ~155 | Nous 141, litt. 75–155. H₂O dominant, cohérent. |
| 🧲📛⛽ (CH₄) | ~12 | Trace, quelques W/m² | OK ordre de grandeur. |
| 🧲📛⛅ (nuages) | ~0,4 | KT97 : nuages ~+30 W/m² sur G | Nous τ nuages faible (0,3 %) ; litt. nuages ~20–30 % de G. À confronter si on augmente τ_cloud. |

**Pourquoi 6 W/m² (nous) vs 32 W/m² (KT97) pour le CO₂ ? — Même flux, répartition différente**

Nous on calcule bien le **flux réémis** (bloqué) et on le répartit à chaque (couche, λ) par **τ_CO₂/τ_tot**, **τ_H₂O/τ_tot**, etc. Donc à 15 µm où H₂O et CO₂ absorbent, si τ_H₂O ≫ τ_CO₂ on attribue l’essentiel à H₂O → notre part CO₂ reste ~6 W/m².

KT97 (BAMS 1997) ne font **pas** « si on enlève le CO₂, il manque 32 W/m² ». Ils **répartissent** l’absorption LW clear-sky total (125 W/m²) entre gaz : 75 W/m² H₂O, 32 W/m² CO₂. Leur méthode est une **répartition par bande spectrale** : la bande 15 µm est considérée comme « bande CO₂ », donc l’absorption dans cette bande est **attribuée au CO₂** (même quand H₂O absorbe aussi dans la même bande). Nous, à 15 µm on partage au prorata de τ (τ_CO₂/τ_tot, τ_H₂O/τ_tot) → CO₂ n’a qu’une petite part. Eux, toute la bande 15 µm → CO₂ → 32 W/m².

En résumé : **même flux physique** (ce qui est bloqué), **règle d’attribution** différente — par **bande** (KT97 : bande CO₂ = tout au CO₂) vs par **τ à chaque λ** (nous : part = τ_CO₂/τ_tot). D’où 32 vs 6. Ce n’est pas un effet marginal « retirer le CO₂ » ; c’est une autre façon de répartir les 125 W/m² entre gaz.

**Mauvaises valeurs identifiées (2025)** :

1. **🧲🌈🔼 = 232,43 W/m²** — À l’équilibre, OLR ≈ flux entrant ≈ 238 W/m². Valeur trop faible → trop de flux absorbé (EDS trop fort).
2. **🔺🧲 = 5,93 W/m²** — Résidu de bilan ; à l’équilibre on attend ≈ 0. Conséquence directe de 🧲🌈🔼 trop faible.

**Chaîne de cause (🔺🧲 > 0)** : **📛 (EDS) trop fort** → atmosphère absorbe trop (vapeur, nuages, ou facteur `getH2OVaporEDSScale`) → **🧲🌈🔼** trop faible → **🔺🧲 > 0**. Pistes : réduire l’absorption IR (scale vapeur, τ nuages, ou paramètres spectaux) pour que 🧲🌈🔼 remonte vers ~238 et 🔺🧲 vers 0.

**Chaîne de cause (🔺🧲 < 0)** : **🧲🌈🔼 trop élevé** (OLR &gt; flux entrant) → **EDS insuffisant** (pas assez de flux bloqué) → **🔺🧲 < 0**. OLR et EDS sont liés : OLR = émission_surface − EDS ; donc EDS insuffisant ⟺ OLR trop élevé (même T). Pistes ci‑dessous.

**Où peut être l’erreur si EDS insuffisant alors que concentrations, pression, albédo sont validés ?**

Tout est calculé à partir des entrées (🍰🫧🏭, 🍰🫧💧, 🪩, etc.) ; si EDS est trop faible, l’erreur est dans la **chaîne qui produit τ** (puis absorption) :

| Maillon | Où | Effet si sous‑évalué → EDS trop faible |
|--------|-----|----------------------------------------|
| **Sections efficaces** | `calculations.js` → HITRAN (crossSection*FromLines) | σ(λ, T_ref, P_ref) trop faibles ou bandes HITRAN trop étroites / mal échantillonnées. |
| **getH2OVaporEDSScale** | `physics.js` ; appliqué à κ_H2O dans `calculations.js` | Scale &lt; 1 réduit κ_H2O → moins d’absorption vapeur. Si scale trop bas (ex. ~0,5), EDS H₂O baisse. |
| **Résolution spectrale** | 🔬🌈 (nombre de bins λ) | Peu de bins → raies étroites manquées → τ intégré trop faible. Augmenter 🔬🌈 pour tester. |
| **Pas vertical** | `delta_z` 50 m troposphère ; couches stratosphère | Couches trop épaisses → τ par couche sous‑estimé (linéaire en Δz) ou trop peu de couches. |
| **Pressure broadening** | `calculations.js` : σ × √(P/P_ref), cap 2.0 | Si P réel &gt; P_ref et cap trop bas, σ_eff sous‑évalué. |
| **Nuages LW** | τ_cloud = couverture × CLOUD_LW_TAU_REF | CLOUD_LW_TAU_REF = 1 ; si couverture ou τ nuages sous‑estimés, EDS nuages trop faible (souvent &lt; 1 %). |

Ordre de vérification suggéré : (1) **getH2OVaporEDSScale** (ne pas trop réduire H₂O) ; (2) **résolution 🔬🌈** (ex. 150 → 300 ou 500) ; (3) **sections HITRAN** (T_ref, P_ref, plages ν) ; (4) **delta_z** / nombre de couches.

**Credences** : getH2OVaporEDSScale ~60 % (physics.js) ; 🔬🌈 ~70 % (calculations.js, configTimeline) ; HITRAN T_ref/P_ref ~90 % (hitran.js) ; delta_z ~70 % (calculations.js) ; CLOUD_LW_TAU_REF ~55 % (calculations.js).

**Log diagnostic** : `CONFIG_COMPUTE.logEdsDiagnostic = true` affiche à chaque calculateFluxForT0 : `[EDS] h2o_eds_scale=… bins=… delta_z=… n_layers=… earth_flux=… OLR=… EDS=…`. À l’Init, `[Init diagnostic]` affiche flux_in, OLR, Δ, h2o_eds_scale, bins, n_layers, delta_z (sans activer logEdsDiagnostic). **Seuil CO2 getH2OVaporEDSScale** : ≥ 400 ppm (0.0004) → scale=1 (pas de réduction κ_H2O) pour que 2025 @15°C soit proche de l’équilibre ; &lt; 400 ppm → scale &lt; 1 (credence ~60 %).

**Stabilité en précision** : En troposphère **et** en stratosphère, l’épaisseur réelle de chaque couche doit être utilisée pour τ (delta_z_real = z_range[i+1] − z_range[i] en troposphère, z_range[i] − z_range[i−1] en stratosphère), pas une constante delta_z. Sinon la dernière couche (épaisseur &lt; delta_z) ou la première couche stratosphère surévalue/sous‑évalue τ → résultat divergent (Δ -10 vs -44). Corrigé dans calculations.js : avec l’épaisseur réelle, augmenter bins ou diminuer delta_z doit améliorer la convergence (τ = intégrale κ dz cohérente).

**Pas spectral (HITRAN)** : Le nombre de bins λ (🔬🌈) est aujourd’hui fixé par `maxSpectralBinsConvergence` (ex. 150, 300). En LBL (line‑by‑line), le **pas minimum en longueur d’onde** devrait idéalement être piloté par HITRAN : largeur de raie (Doppler γ_D, Lorentz γ_L) pour ne pas sous‑échantillonner les pics d’absorption. Ici grille uniforme 0,1–100 µm avec N bins ; si N trop faible, les raies étroites sont mal capturées → τ intégré trop faible → EDS insuffisant (🔺🧲 &lt; 0). Voir doc/HITRAN.txt (lineshape Voigt, γ(T,P)). **HITRAN n’a pas la même précision pour les 3 gaz** : chaque molécule (CO2, H2O, CH4) a ses propres largeurs de raie (γ_L, γ_D) par ligne ; le pas idéal pourrait être dérivé par gaz puis prendre le plus contraignant. **Paramètre 🔬🌈** : on peut le garder et préciser qu’il serait idéalement **rempli par HITRAN** (N min ou pas max) ; **le choix d’évolution** : dériver un pas max ou un N min depuis les largeurs de raie HITRAN (ce qui ferait disparaître ou dériver le paramètre actuel). **Nuages EDS** : corps gris (τ uniforme en λ), pas de longueur d’onde ; ils n’entrent pas dans le critère de pas spectral HITRAN.

**Nuages : LW vs SW (albédo)** : **LW** = τ_cloud corps gris dans le transfert radiatif (barre 4–50 µm en visu). **SW** = dans `calculateAlbedo()`, 🍰🪩📿 = … + 🍰🪩⛅ × 🪩🍰⛅ (contribution nuages à l’albédo). La **petite zone de flux** : visible qui traverse → frappe glace/désert/sol → renvoie en visible → **bloqué par les nuages** avant de s’échapper. Cette partie est bien prise en compte **via l’albédo** (pas un terme EDS séparé) : plus de nuages → albédo planétaire plus élevé → moins de flux absorbé ; le coefficient 🪩🍰⛅ et la couverture 🍰🪩⛅ agrègent réflexion nuages + blocage du visible réfléchi par la surface. Donc oui, cette zone est incluse côté SW (albédo) ; côté EDS % on n’attribue que le LW (τ_cloud) aux nuages.

**Pas spectral : N min / pas max, HITRAN, précision**  
- **Const calculés ou T/P-dépendants ?** Un **pas max** (ou **N min**) dérivé de HITRAN peut être : (a) **CONST** issues d’une analyse une fois des largeurs de raie sur la plage spectrale (pire cas γ_L, γ_D), ou (b) **dépendants de l’altitude / T (et P)** si on veut un LBL strict (γ_L(P,T), γ_D(T) varient avec la couche).  
- **Même précision pour les 3 gaz ?** Oui, c’est une idée respectable : une **seule grille** qui résout le plus fin nécessaire (max sur les 3 gaz et les raies) ; HITRAN ne « découpe » pas avec une seule précision — ce sont des paramètres **par raie** (ν, S, γ_L, γ_D) ; la précision de la grille, c’est **notre** choix quand on échantillonne σ(λ).  
- **maxSpectralBinsConvergence** : aujourd’hui c’est le **N utilisé** (nombre de bins), pas un N_min explicite. Si on introduit un vrai **N_min** (dérivé HITRAN) et un **N_max** (plafond perf), on aurait N = clamp(N_souhaité, N_min, N_max) ; le **max** peut vivre dans CONFIG_COMPUTE ; si FPS ≪ on peut baisser N pour la perf mais **s’arrêter à N_min** (ne pas descendre en dessous de 1/N_max en pas équivalent). Actuellement FPS modifie la précision **verticale** (stratosphère via `getPrecisionFactorFromFPS`), pas le nombre de bins λ.  
- **Précisions qui changent les résultats** : `maxWaterAlbedoCyclesPerStep` (ex. 20) et autres paramètres de précision (bins, delta_z, cycle eau/albédo) peuvent faire varier légèrement les résultats (convergence, Δ) même si en théorie la physique ne devrait pas en dépendre ; à garder en tête pour comparer runs ou debug.

**Courbe spectrale chahutée** : Si la courbe cyan est très irrégulière, c’est **réaliste** (structure spectrale, raies d’absorption) ; pas de souci. Pas de lissage artificiel.

**Nuages (bornes spectre)** : Ils couvrent tout le spectre LW (corps gris). Un seul indicateur full span (4–50 μm) suffit.

**Convergence vers ~4,5°C au lieu de 15,7°C** : À 15,7°C on a Δ ≈ -35 W/m² (OLR trop élevé → modèle refroidit). La dichotomie converge vers la T où |Δ| ≤ tol, donc vers ~4,5°C. **Cause** : OLR trop élevé à 15,7°C (273 vs ~238) → trop peu d’absorption IR ; EDS ~104,5 W/m² vs litt. ~155–165. **Bins** : 100 donne courbe moins précise et convergence ~1,2°C (artefact) ; 500 = courbe propre, convergence ~4,5°C. Pistes à creuser : delta_z, κ/τ (cross-sections, intégration verticale), nombre de couches, ou autre physique pour rapprocher OLR de ~238 à 15,7°C.

**Bornes bins via HITRAN** : `getSpectralBinBoundsFromHITRAN(λ_min, λ_max, T, P)` retourne **{ stepMax_m, nMin }** :
- **stepMax_m** : pas max en longueur d’onde (m) pour ne pas sous‑échantillonner la raie la plus fine (min des largeurs γ_L+γ_D converties en Δλ sur la plage).
- **nMin** : nombre minimal de bins = span / stepMax_m. Pour rester dans les bornes HITRAN, il faut **🔬🌈 ≥ nMin** (sinon les raies étroites sont mal résolues).
- **Borne supérieure** : N_max = choix perf (ex. 10000), pas donné par HITRAN.

Donc **les bornes pour 🔬🌈 sont : N_min ≤ 🔬🌈 ≤ N_max**, avec N_min dérivé de HITRAN. On peut appeler `getSpectralBinBoundsFromHITRAN` **une fois** (ex. en console : `HITRAN.getSpectralBinBoundsFromHITRAN(0.1e-6, 100e-6, 296, 101325)`), récupérer `nMin`, puis **entrer cette valeur en dur** dans `CONFIG_COMPUTE.spectralBinsMinFromHITRAN` pour que le calcul clamp 🔬🌈 au-dessus de cette borne.

**Nuages dans le flux** : **Le plus physique** : garder la **couverture nuageuse dans le transfert** (τ_cloud par couche), pas en EDS additif à la fin. Les nuages absorbent/émettent en traversant les couches ; les mettre en additif ignorerait altitude et physique du transfert. Donc **garder τ_cloud dans le flux**.

**Affichage spectral (évolution)** : **TODO** : 3 courbes (H2O, CO2, CH4) + somme + trait nuages. À faire plus tard.

**Chevauchements (overlaps)** : On traite explicitement l’overlap **H2O–CO2** (Schmidt « split the difference »). **CH4** et **nuages** sont inclus dans τ_tot avec attribution proportionnelle (τ_X/τ_tot) sans partage d’overlap pair à pair (CH4–H2O, CH4–CO2, nuages–gaz) ; les autres chevauchements sont donc gérés par la répartition en parts de τ, pas par une règle dédiée comme pour H2O–CO2.

**Normalisation à l’intégration** : Pas de division par le nombre de couches. Le transfert radiatif **propage** le flux couche par couche (flux_in → couche → flux_out) ; OLR = somme sur λ du flux au sommet (Σ_j upward_flux[top][j]). Chaque bande j contribue π B_λ Δλ (ou transmis+émis) ; la somme donne l’intégrale sur λ, sans facteur 1/n_layers.

**Répartition EDS (ex. 500 bins, 420 ppm)** : CO₂ ~13 %, H₂O ~87 %, CH₄ ~0 %, Nuages &lt; 1 %. Les parts 🍰📛 sont en **W/m² retournés par EDS, normalisées** (τ‑weighted + partage overlap H2O–CO2). Cette répartition **dépend du nombre de bins** : plus de bins → meilleure résolution spectrale → τ par bande et attribution changent. Avec 634 ppm (≈ 1,5× pré‑ind.), la colonne CO₂ est plus opaque ; et **getH2OVaporEDSScale** réduit κ_H₂O (souvent ~0,5), donc la part effective de la vapeur baisse. Une répartition 33/66 est cohérente avec ces entrées (plus de poids CO₂ qu’à 420 ppm et scale vapeur &lt; 1).

Vérifier aussi que la convergence déclare `converged` seulement lorsque |🔺🧲| ≤ 🧲🔬 (sinon l’état affiché peut être un intermédiaire non équilibré).

---

## Convention : Credence, plage littérature, écart-type (tuning)

Pour éviter de patcher en aveugle, chaque **paramètre ou formule tunable** a en commentaire dans le code (au début de la fonction ou à côté de la constante) :

- **Credence** : niveau de confiance dans la formule/valeur (ex. ~60 %, ~95 %). &lt; 100 % = susceptible d’être ajusté si bug de convergence ou écart à la littérature.
- **Plage littérature** : intervalle de valeurs trouvées en lit. ou équivalent (ex. 0.3–1.0 pour un facteur, 4–6.5 W/m² pour un coefficient).
- **Écart-type indicatif** (si pertinent) : σ pour tuner sans se re-questionner à chaque run (ex. σ ≈ 0.15 → plage raisonnable ±1σ).

**Où c’est documenté** : `physics.js` (getH2OVaporEDSScale, albédos, H2O_VAPOR_REF, SCALE_CLOUD) — physique uniquement ; `climate.js` (convention ΔF CO2/CH4, affichage) ; `calculations.js` (delta_z, CLOUD_LW_TAU_REF). ΔF et constantes convention affichage ne sont pas dans physics.js (climate.js).

**ΔF et la référence 280** : ΔF = diagnostic affichage (climate.js). C₀ = 280 (IPCC) ; les flux **réels** (EDS, OLR) sont en W/m² sans référence.
