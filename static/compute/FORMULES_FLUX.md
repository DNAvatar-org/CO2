# Formules détaillées des flux (🧲)

Documentation complète des formules de calcul pour chaque flux dans `DATA['🧲']`.

## Valeurs d'exemple

```javascript
🧲 = {
    '🧲☀️🔽': 304.59,  // Flux solaire absorbé
    '🧲🌕🔽': 0.09,    // Flux géothermique
    '🧲🌑🔼': 501.45,  // Flux sortant (σT⁴)
    '🧲🌈🔼': 219.67,  // Courbe spectrale (flux au sommet atmosphère)
    '🧲🪩🔼': 35.69,   // Flux réfléchi par albedo
    '🔺🧲': -85.01     // Déséquilibre flux (entrant - sortant)
}
```

---

## 1. 🧲☀️🔽 - Flux solaire absorbé

**Formule :**
```
🧲☀️🔽 = 🧲☀️🎱 × (1 - 🍰🪩📿)
```

**Détail :**
- `🧲☀️🎱` = Flux solaire géométrique moyen (W/m²) = `🧲☀️ / 4` où `🧲☀️` = flux solaire à 1 UA
- `🍰🪩📿` = Albedo total (fraction 0-1)
- `(1 - 🍰🪩📿)` = Fraction du flux solaire non réfléchi (absorbé)

**Exemple avec valeurs réelles :**
```
🧲☀️🔽 = 🧲☀️🎱 × (1 - 🍰🪩📿)
      = 340.28 × (1 - 0.1049)
      = 340.28 × 0.8951
      = 304.59 W/m² ✓
```

**Code source :** `calculations_albedo.js:calculateSolarFluxAbsorbed()`
```javascript
const solar_flux_average_wm = DATA['☀️']['🧲☀️🎱'];
const solar_flux_reflected_wm = solar_flux_average_wm * albedo;
const solar_flux_absorbed_wm = solar_flux_average_wm - solar_flux_reflected_wm;
```

---

## 2. 🧲🌕🔽 - Flux géothermique

**Formule :**
```
🧲🌕🔽 = DATA['🌕']['🧲🌕']
```

**Détail :**
- Flux géothermique constant depuis la configuration de l'époque
- Valeur typique : ~0.09 W/m² (Terre moderne)
- Peut varier selon l'époque (Hadéen : beaucoup plus élevé)

**Exemple avec valeurs réelles :**
```
🧲🌕🔽 = 0.09 W/m²
```

**Code source :** `calculations_flux.js` - lu directement depuis `DATA['🌕']['🧲🌕']`

---

## 3. 🧲🌑🔼 - Flux sortant (corps noir)

**Formule :**
```
🧲🌑🔼 = σ × T⁴
```

**Détail :**
- `σ` = Constante de Stefan-Boltzmann = `5.670374419e-8` W/(m²·K⁴)
- `T` = Température de surface en Kelvin (`DATA['🧮']['🧮🌡️']`)
- Flux émis par la surface (corps noir théorique à température T)
- **⚠️ Important :** Ce n'est PAS le flux qui sort au sommet de l'atmosphère (c'est `🧲🌈🔼`)
- **⚠️ Ne pas comparer directement à 🧲☀️🔽+🧲🌕🔽** car l'effet de serre fait que la surface émet plus que ce qui sort

**Exemple avec valeurs réelles :**
```
Si T = 287.15 K (14°C) :
🧲🌑🔼 = σ × T⁴
      = 5.670374419e-8 × (287.15)⁴
      = 5.670374419e-8 × 6,789,000,000
      ≈ 384.8 W/m²

Si T = 301.15 K (28°C) :
🧲🌑🔼 = 5.670374419e-8 × (301.15)⁴
      = 5.670374419e-8 × 8,225,000,000
      ≈ 466.3 W/m²

Avec T ≈ 303.5 K (30.35°C) :
🧲🌑🔼 = 5.670374419e-8 × (303.5)⁴
      = 5.670374419e-8 × 8,844,000,000
      ≈ 501.45 W/m² ✓
```

**Code source :** `calculations_flux.js`
```javascript
const flux_sortant_surface = CONST.STEFAN_BOLTZMANN * Math.pow(DATA['🧮']['🧮🌡️'], 4);
```

**Note :** Pour une intégration spectrale complète (0→∞), on aurait :
```
🧲🌑🔼 = ∫[0→∞] π × B_λ(T) × dλ = σT⁴
```

---

## 4. 🧲🌈🔼 - Flux spectral sortant (au sommet atmosphère)

**Formule :**
```
🧲🌈🔼 = Σ[λ=0.1→100μm] I_λ(z_max) × Δλ
```

**Détail :**
- Aire sous courbe spectrale réelle (émission au sommet atmosphère, après transfert radiatif couche par couche avec concentrations atmosphériques)
- Calculé via transfert radiatif spectral : pour chaque couche z et chaque λ, calcul de l'épaisseur optique τ_λ(z) avec concentrations CO₂, CH₄, H₂O, O₂, N₂, puis transmission exp(-τ) et émission (1-exp(-τ))×π×B_λ(T)
- Intégration finale au sommet : `🧲🌈🔼 = Σ[λ] upward_flux[z_max][λ] × Δλ`
- **En équilibre :** `🧲🌈🔼 ≈ 🧲☀️🔽 + 🧲🌕🔽`

**Exemple avec valeurs réelles :**
```
🧲🌈🔼 = 221.49 W/m²
```

**Code source :** `calculations.js:calculateFluxForT0()`
- Calcul spectral avec intégration sur λ ∈ [0.1μm, 100μm]
- Transfert couche par couche avec absorption/émission
- Résultat : `spectral_result.total_flux` (flux au sommet)

**Relation avec l'effet de serre :**
```
EDS = 🧲🌑🔼 - 🧲🌈🔼
    = 501.45 - 219.67
    = 281.78 W/m²
```
L'effet de serre réduit le flux sortant de 281.78 W/m².

---

## 5. 🧲🪩🔼 - Flux réfléchi par albedo

**Formule :**
```
🧲🪩🔼 = 🧲☀️🎱 - 🧲☀️🔽 = 🧲☀️🎱 × 🍰🪩📿
```

**Détail :**
- `🧲☀️🎱` = Flux solaire géométrique moyen (W/m²)
- `🍰🪩📿` = Albedo total (fraction 0-1)
- Flux solaire réfléchi par la surface et l'atmosphère (non absorbé)
- Formule équivalente : `🧲🪩🔼 = 🧲☀️🎱 - 🧲☀️🔽` (flux incident - flux absorbé)

**Exemple avec valeurs réelles :**
```
🧲🪩🔼 = 🧲☀️🎱 × 🍰🪩📿
      = 340.28 × 0.1049
      = 35.69 W/m² ✓
```

**Code source :** `calculations_flux.js`
```javascript
const albedo_flux = solar_flux_incident * albedo_value;
```

**Vérification :**
```
🧲☀️🔽 + 🧲🪩🔼 = 🧲☀️🎱
304.59 + 35.69 = 340.28 ✓
```

---

## 6. 🔺🧲 - Déséquilibre flux

**Formule :**
```
🔺🧲 = 🧲☀️🔽 + 🧲🌕🔽 - 🧲🌈🔼
```

**Détail :**
- Déséquilibre flux (flux entrant - flux sortant)
- Différence entre flux entrant total et flux sortant (au sommet)
- **En équilibre :** `🔺🧲 ≈ 0`
- **Si `🔺🧲 > 0`** : la planète reçoit plus d'énergie qu'elle n'en perd → réchauffement
- **Si `🔺🧲 < 0`** : la planète perd plus d'énergie qu'elle n'en reçoit → refroidissement

**Exemple avec valeurs réelles :**
```
🔺🧲 = 🧲☀️🔽 + 🧲🌕🔽 - 🧲🌈🔼
     = 290.23 + 0.09 - 221.49
     = 290.32 - 221.49
     = 68.83 W/m²
```

**Interprétation :**
- `🔺🧲 = 68.83 W/m²` signifie que la planète reçoit 68.83 W/m² de plus qu'elle n'en perd
- La température va donc augmenter jusqu'à atteindre l'équilibre (`🔺🧲 ≈ 0`)

**Code source :** `calculations_flux.js`
```javascript
const flux_entrant = flux_solaire_absorbe + flux_geothermique;
const delta_equilibre = flux_entrant - flux_sortant_effectif;  // Δ>0→réchauffer, Δ<0→refroidir
```

---

## Bilan énergétique complet

### Flux entrants (↓)
```
Flux entrant total = 🧲☀️🔽 + 🧲🌕🔽
                  = 304.59 + 0.09
                  = 304.68 W/m²
```

### Flux sortants (↑)
```
Flux sortant total = 🧲🌈🔼 + 🧲🪩🔼
                   = 219.67 + 35.69
                   = 255.36 W/m²
```

### Bilan
```
🔺🧲 = Flux entrant - Flux sortant (au sommet)
     = (🧲☀️🔽 + 🧲🌕🔽) - 🧲🌈🔼
     = 304.68 - 255.36
     = +49.32 W/m² (réchauffement)
```

**Note :** Convention : `🔺🧲 = flux_entrant - flux_sortant = (🧲☀️🔽 + 🧲🌕🔽) - 🧲🌈🔼`. Δ>0 → réchauffement.
- `🧲🌈🔼` est le flux au sommet de l'atmosphère (après EDS)
- `🧲🪩🔼` est le flux réfléchi (perte solaire, pas dans le bilan IR)

---

## Relations importantes

### 1. Conservation de l'énergie solaire
```
🧲☀️🎱 = 🧲☀️🔽 + 🧲🪩🔼
340.28 = 304.59 + 35.69 ✓
```

### 2. Effet de serre
```
EDS = 🧲🌑🔼 - 🧲🌈🔼
    = 501.45 - 219.67
    = 281.78 W/m²
```

### 3. Équilibre flux
```
En équilibre : 🧲🌈🔼 = 🧲☀️🔽 + 🧲🌕🔽
             219.67 ≈ 304.68 (pas encore à l'équilibre)
```

### 4. Température d'équilibre (corps noir sans EDS)
```
T_équilibre = (🧲☀️🔽 / σ)^(1/4)
            = (304.59 / 5.670374419e-8)^(1/4)
            ≈ 270.5 K (-2.65°C)
```

### 5. Température effective (avec EDS)
```
T_effective = (🧲🌈🔼 / σ)^(1/4)
            = (219.67 / 5.670374419e-8)^(1/4)
            ≈ 248.5 K (-24.65°C)
```

### 6. Température de surface réelle
```
T_surface = (🧲🌑🔼 / σ)^(1/4)
          = (501.45 / 5.670374419e-8)^(1/4)
          ≈ 303.5 K (30.35°C)
```

---

## Répartition EDS (📛)

**🧲📛** = EDS total (W/m²) = 🧲🌑🔼 − 🧲🌈🔼

**Répartition (en W/m² retournés par EDS, normalisé, 🍰📛 ∈ [0, 1])** (Σ = 1) :

| Symbole   | Signification        | Exemple |
|-----------|----------------------|---------|
| 🍰📛🏭     | Part EDS CO₂         | ~0.02   |
| 🍰📛💧     | Part EDS H₂O (vapeur)| ~0.92   |
| 🍰📛⛽     | Part EDS CH₄         | ~0.06   |
| 🍰📛⛅     | Part EDS nuages      | ~0.01   |

- **🍰📛⛅** : part de l’effet de serre due à l’absorption IR des nuages (corps gris, τ_nuage par couche ; même couverture 🍰🪩⛅ que l’albédo).
- **🔺📛💧** : ΔF H₂O affichage (W/m², convention), distinct de la répartition EDS.
- **Comparaison littérature** : Ces parts (tau-ratio avec partage overlap H2O–CO2) ne sont pas directement comparables aux % d’attribution Schmidt (expériences retrait/ajout) ; voir doc/VAPEUR_VS_NUAGES.md.

---

## τ nuages LW (épaisseur optique IR)

**Formule utilisée :** `τ_cloud_total = CLOUD_LW_TAU_REF × 🍰🪩⛅` (corps gris, réparti sur la troposphère).

**Justification scientifique :**

- **Émissivité IR des nuages d'eau :** ε = 1 − exp(−τ), avec τ ∝ LWP (liquid water path). Références : Stephens (1978), *Radiation Profiles in Extended Water Clouds. II: Parameterization Schemes*, J. Atmos. Sci. **35**, 2123 ; Chylek & Ramaswamy (1982), *Simple Approximation for Infrared Emissivity of Water Clouds*, J. Atmos. Sci. **39**, 171 (ε = 1 − exp(−βkW), β ≈ 1.66).
- **τ broadband LW typique** pour nuages overcast : plage ~ 0,5–2 (émissivité effective ~ 0,4–0,9). On ne dispose pas de LWP dans le modèle, seulement de la couverture nuageuse 🍰🪩⛅ (0–1).
- **Choix CLOUD_LW_TAU_REF = 1 :** τ_total = couverture × 1. Ainsi, couverture 100 % → τ = 1 (ε ≈ 0,63) ; 30 % → τ = 0,3. Cohérent avec la littérature (τ overcast ~ 1–2). Une valeur ref = 5 donnerait τ_overcast = 5 (ε ≈ 0,99), trop opaque pour un modèle simplifié.

---

## Constantes utilisées

- **σ (Stefan-Boltzmann)** : `5.670374419e-8` W/(m²·K⁴)
- **🧲☀️ (Flux solaire à 1 UA)** : Variable selon l'époque (actuel : ~1361 W/m²)
- **🧲☀️🎱 (Flux solaire moyen)** : `🧲☀️ / 4` ≈ 340 W/m² (Terre moderne)

---

## Notes importantes

1. **🧲🌑🔼 ≠ 🧲🌈🔼** : Le flux émis par la surface (`🧲🌑🔼`) est plus grand que le flux qui sort au sommet (`🧲🌈🔼`) à cause de l'effet de serre.

2. **🔺🧲 < 0** : La planète se réchauffe jusqu'à atteindre l'équilibre (`🔺🧲 ≈ 0`).

3. **🧲🪩🔼** : Le flux réfléchi n'est pas un "flux sortant" au sens strict, c'est une perte d'énergie solaire.

4. **En équilibre** : `🧲🌈🔼 = 🧲☀️🔽 + 🧲🌕🔽` (le flux qui sort au sommet = le flux qui entre).

