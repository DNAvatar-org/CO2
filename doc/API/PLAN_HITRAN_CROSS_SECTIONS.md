# Plan : sections efficaces HITRAN (vraies données, pas interpolation)

**Objectif** : Remplacer les formules empiriques (gaussiennes) dans `crossSectionCO2`, `crossSectionH2O`, `crossSectionCH4` par des sections efficaces calculées à partir des **données HITRAN** (lignes + Q(T), S(T), γ(T,P), Voigt), selon la méthode décrite dans `doc/HITRAN.txt`.

**Référence** : `doc/HITRAN.txt` (formules S(T), γ(T,P), lineshape Voigt, conseils implémentation).

---

## 1. Compréhension de la demande

- **Actuel** : `API_BILAN/physics/physics.js` définit des constantes (CO2_SIGMA_*, etc.) ; `API_BILAN/radiative/calculations.js` expose `crossSectionCO2(λ)`, `crossSectionH2O(λ)`, `crossSectionCH4(λ)` — formules gaussiennes en λ, **sans** dépendance T/P dans la forme (un simple `pressureBroadening = √(P/P_ref)` est appliqué côté κ).
- **Cible** : Sections efficaces **σ(λ, T, P)** dérivées des **lignes HITRAN** : pour chaque ligne, intensité S(T), largeur γ(T,P), lineshape (Voigt), somme sur les lignes proches de λ. Pas d’interpolation empirique ; utilisation des équations du fichier HITRAN.txt.

---

## 2. Plan d’attaque

### Phase 1 : Données (Python + hitran-api)

1. **Script Python** (ex. `scripts/hitran_fetch_lines.py` ou `doc/scripts/`) :
   - Utiliser **HAPI** (`hitran-api`) pour récupérer les lignes CO₂, H₂O, CH₄ dans les **bandes utiles** (LW 4–25 µm ≈ 400–2500 cm⁻¹) :
     - CO₂ : ~500–800 cm⁻¹ (15 µm)
     - H₂O : ~500–700 cm⁻¹ (17 µm), ~1500–1800 cm⁻¹ (6,3 µm)
     - CH₄ : ~1000–1400 cm⁻¹ (7,7 µm), ~2800–3200 cm⁻¹ (3,3 µm)
   - Exporter les paramètres de lignes nécessaires (ν, S, E'', γ_air, γ_self, n_air, n_self, δ_air, etc.) en **JSON** (ou CSV) pour chargement en JS. Format compact (pas les 160 caractères HITRAN bruts si pas besoin).
   - Option : sous-échantillonner les lignes (pas toutes) pour limiter la taille du fichier et le temps de calcul JS.

2. **Partition Q(T)** : HITRAN fournit des polynômes ou tables Q(T). Soit les exporter pour les 3 molécules (JSON), soit implémenter les formules Q(T) en JS si disponibles dans la doc HAPI/HITRAN.

### Phase 2 : Calcul σ(λ, T, P) en JS (méthode HITRAN.txt)

3. **Chargement des lignes** : Au chargement de l’app (ou du module calcul), charger les JSON de lignes (CO2, H2O, CH4). Une seule fois, pas à chaque pas radiatif.

4. **Fonctions de scaling** (dans `API_BILAN/physics/physics.js` ou un module dédié `hitran_utils.js`) :
   - **Q(T)** : fonction de partition (lecture table ou formule).
   - **S(T)** : intensité de ligne selon HITRAN.txt (S(T_ref), Q(T), E'', ν_ij, c₂).
   - **γ(T, P)** : Lorentz total = P × [X_self γ_self(T) + X_air γ_air(T)], avec γ(T) = γ(T_ref) × (T_ref/T)^n.
   - **γ_D(ν, T, M)** : Doppler (HITRAN.txt).
   - **Voigt(Δν, γ_L, γ_D)** : lineshape (lib JS type numeric.js ou implémentation Voigt/Faddeeva).

5. **Nouvelles fonctions de section efficace** :
   - `crossSectionCO2FromLines(λ, T, P)` : pour chaque ligne CO₂ dans une fenêtre ±(5–10 γ) autour de ν = 1/λ, calculer S(T), γ_L, γ_D, Voigt, sommer. Retourner σ(λ, T, P) en m²/molécule (ou unité cohérente avec l’actuel).
   - Idem `crossSectionH2OFromLines(λ, T, P)`, `crossSectionCH4FromLines(λ, T, P)`.
   - **Interface** : Soit on remplace directement `crossSectionCO2(λ)` par une signature `crossSectionCO2(λ, T, P)` et on adapte tous les appels (calculs par couche avec T(z), P(z)), soit on garde temporairement un wrapper σ(λ) = σ(λ, T_ref, P_ref) pour ne pas casser le flux actuel, puis on introduit T,P par couche.

6. **Intégration dans `API_BILAN/radiative/calculations.js`** :
   - Remplacer les appels `lambda_range.map(lambda => crossSectionCO2(lambda))` par un calcul qui utilise T, P **par couche** (boucle sur z, puis sur λ, avec σ(λ, T(z), P(z))). Sinon, en première étape : précalculer une grille σ(λ) à T_ref, P_ref à partir des lignes (équivalent “vraies données” mais sans encore la dépendance T/P par couche).
   - Même logique pour H2O et CH4. Adapter `getSpectralResultFromDATA` si elle appelle les mêmes cross-sections.

### Phase 3 : Ordre et tests

7. **Ordre recommandé** : CO₂ (moins de lignes, bande 15 µm) → CH₄ → H₂O (plus complexe, continuum optionnel plus tard).
8. **Validation** : Comparer σ(λ) intégré sur une bande (ex. 500–800 cm⁻¹ CO₂) à des valeurs littérature / PNNL / HAPI cross-sections précalculées.
9. **Performance** : Si le calcul “sum over lines” par (λ, T, P) est trop coûteux, envisager des **tables précalculées** σ(λ, T, P) sur une grille (T, P) réduite, générées par le script Python (HAPI + LBL), puis chargées et interpolées en JS.

---

## 3. Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `doc/HITRAN.txt` | Méthode (Q, S, γ, Voigt, conseils). |
| `static/physics.js` | Constantes actuelles (à garder en fallback ou supprimer selon choix). |
| `static/calculations.js` | `crossSectionCO2`, `crossSectionH2O`, `crossSectionCH4` ; boucles qui utilisent les sections efficaces ; `getSpectralResultFromDATA`. |
| Nouveau : script Python | Fetch HAPI, export lignes (JSON/CSV). |
| **`static/hitran.js`** | Q(T), S(T), γ(T,P), γ_D, Voigt (réf. doc/HITRAN.txt). |
| Nouveau (optionnel) : JSON chargé | Données de lignes (CO2, H2O, CH4). |
| Intégration dans `calculations.js` ou module dédié | `crossSectionCO2FromLines`, etc. |

---

## 4. TODO (suivi)

- [x] **HITRAN-1** : Script Python `scripts/hitran_fetch_lines.py` (hitran-api) : fetch lignes CO₂, H₂O, CH₄, export `static/data/hitran_lines_CO2.json`, `hitran_lines_H2O.json`, `hitran_lines_CH4.json` (ν, sw, elower, gamma_air, gamma_self, n_air, delta_air).
- [ ] **HITRAN-2** : Implémenter en JS : Q(T), S(T), γ(T,P), γ_D, Voigt (réf. HITRAN.txt).
- [x] **HITRAN-3** : `crossSectionCO2/H2O/CH4FromLines(λ, T, P)` dans hitran.js, chargement via `hitran_lines_*.js` (window.HITRAN_LINES_*), `crossSectionCO2/H2O/CH4` dans calculations.js utilisent HITRAN à T_ref/P_ref.
- [ ] **HITRAN-4** : Idem CH₄ (lignes + export + JS).
- [ ] **HITRAN-5** : Idem H₂O (lignes + export + JS ; continuum MT_CKD optionnel).
- [ ] **HITRAN-6** : Validation (comparaison σ intégré vs littérature / HAPI) et vérif perf (nombre de lignes, temps par pas radiatif).

---

*Ce document sert de plan d’attaque et de TODO pour le remplacement des formules empiriques par des sections efficaces HITRAN.*
