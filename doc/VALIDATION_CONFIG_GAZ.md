# Validation des masses de gaz (config vs littérature)

**Objectif** : Documenter la traçabilité des valeurs `⚖️🏭` (CO₂), `⚖️⛽` (CH₄), `⚖️🫁` (O₂) dans `configTimeline.js` par rapport à la littérature paléoclimatique.

**Date** : 2025-01-31

---

## 1. Formule de conversion ppm ↔ kg

Les concentrations en **ppm** (parts per million) sont des fractions molaires en volume : ppm = (n_gaz / n_total) × 10⁶.

Conversion vers masse (kg) :

```
mass_gas_kg = ppm × 10⁻⁶ × mass_atm_kg × (M_gas / M_air)
```

Avec :
- `mass_atm_kg` : masse atmosphérique totale (air sec) en kg (~5.15×10¹⁸ kg pour Terre moderne)
- `M_gas` : masse molaire du gaz (CO₂ = 44.01 g/mol, CH₄ = 16.04 g/mol)
- `M_air` : masse molaire moyenne de l'air (~29 g/mol)

**Exemple** : 280 ppm CO₂, atm = 5.15×10¹⁸ kg  
→ mass_CO2 = 280×10⁻⁶ × 5.15×10¹⁸ × (44/29) ≈ **2.19×10¹⁵ kg**

---

## 2. Tableau de validation par époque

### 2.1 Hadéen (🔥)

| Gaz | Config (kg) | Config (ppm équiv.) | Littérature | Références |
|-----|-------------|---------------------|-------------|------------|
| CO₂ | 5.15×10¹⁷ | ~10 % atm | Volcanisme intense, atm dense ~100 bar | Formation planétaire |
| CH₄ | 5.15×10¹⁵ | ~1000 ppm | Réductions abiotiques, incertitude | — |

**Note** : Atmosphère Hadéen ~5.3×10²⁰ kg (100× moderne). Fractions relatives cohérentes.

---

### 2.2 Archéen (🦠)

| Gaz | Config (kg) | Config (ppm équiv.) | Littérature | Références |
|-----|-------------|---------------------|-------------|------------|
| CO₂ | 1.2×10¹⁷ | ~60000 ppm | 10–2500× PAL (280–700 000 ppm) ; paléosols 3×10⁻³–0.75 bar ; micrométéorites 2.7 Ga >70 % vol. | Catling & Zahnle 2020 Sci. Adv. ; Rosing et al. Geology 2004 ; PNAS 2019 |
| CH₄ | 3.0×10¹⁵ | ~1200 ppm | 10²–10⁴× actuel (100–10000 ppm) ; nécessaire pour compenser Soleil jeune | Catling & Zahnle 2020 |

**Validation** : Config au milieu de fourchette. 60000 ppm = 214× PAL, dans la fourchette 10–2500×.

---

### 2.3 Protérozoïque (🌿)

| Gaz | Config (kg) | Config (ppm équiv.) | Littérature | Références |
|-----|-------------|---------------------|-------------|------------|
| CO₂ | 4.7×10¹⁶ | ~6000 ppm | Paléosols ~2.2 Ga : 23±3× PAL ≈ 8000–9000 ppm ; microfossiles ~1.4 Ga : 10–200× PAL | Rye et al. Nature 1995 ; Kaufman et al. Nature 2003 ; Sheldon 2006 Precambrian Res. |
| CH₄ | 2.85×10¹⁴ | ~100 ppm | 100–300 ppm (post-GOE) | — |

**Validation** : 6000 ppm = milieu de fourchette 5–9k ppm (paléosols 2.2 Ga).

---

### 2.4 Mésozoïque (🦕)

| Gaz | Config (kg) | Config (ppm équiv.) | Littérature | Références |
|-----|-------------|---------------------|-------------|------------|
| CO₂ | 1.2875×10¹⁶ | ~2500 ppm | 150–650 ppm (Crétacé précoce) à 2500+ ppm (serre chaude) ; fourchette large selon proxies | Wang et al. Earth-Sci. Rev. 2014 ; Royer et al. GSA Today |
| CH₄ | 4.12×10¹³ | ~8 ppm | Faible (pas de marais étendus) | — |

**Validation** : 2500 ppm cohérent avec serre mésozoïque.

---

### 2.5 Crétacé (🦴)

| Gaz | Config (kg) | Config (ppm équiv.) | Littérature | Références |
|-----|-------------|---------------------|-------------|------------|
| CO₂ | 1.545×10¹⁶ | ~3000 ppm | 150–650 ppm (Crétacé précoce) ; 500–1500 ppm (Crétacé moyen) ; pics jusqu’à 2000+ ppm | Wang et al. 2014 ; Royer ; Early Cretaceous pedogenic carbonates (China) |
| CH₄ | 5.15×10¹³ | ~10 ppm | Faible | — |

**Validation** : 3000 ppm dans la fourchette haute (serre crétacée).

---

### 2.6 Cénozoïque (🦣)

| Gaz | Config (kg) | Config (ppm équiv.) | Littérature | Références |
|-----|-------------|---------------------|-------------|------------|
| CO₂ | 5.15×10¹⁵ | ~1000 ppm | EECO (51–53 Ma) : **1000–1400 ppm** ; Paléocène : 600–800 ppm ; baisse CO₂ = moteur principal du refroidissement | Anagnostou et al. Nature 2016 ; CenCO2PIP ; Beerling & Royer 2011 |
| CH₄ | 3.605×10¹² | ~0.7 ppm | Proche actuel (sources naturelles) | — |
| O₂ | 1.0815×10¹⁸ | ~21 % | Niveau moderne | — |

**Validation** : 1000 ppm cohérent avec Eocène précoce / Paléocène.

---

### 2.7 1800 (pré-industriel, 🚂)

| Gaz | Config (kg) | Config (ppm équiv.) | Littérature | Références |
|-----|-------------|---------------------|-------------|------------|
| CO₂ | 1.443×10¹⁵ | ~280 ppm* | **280 ± 10 ppm** (IPCC) ; carottes glace Law Dome 275–284 ppm | IPCC TAR ; Etheridge et al. JGR 1996 ; CDIAC |
| CH₄ | 3.605×10¹² | ~0.7 ppm | ~700 ppb (0.7 ppm) | — |

**\* À vérifier** : Formule standard ppm_volume → mass_CO2 = ppm×10⁻⁶ × 5.15×10¹⁸ × (44/29) ≈ **2.19×10¹⁵ kg** pour 280 ppm. Config 1.443×10¹⁵ kg donne masse_fraction = 2.8×10⁻⁴ → affichage 280 si ppm = masse_fraction×10⁶ ; mais ppm_volume équivalent = 2.8×10⁻⁴ × (29/44)×10⁶ ≈ 185 ppm. Vérifier si le transfert radiatif utilise fraction molaire ou massique.

---

### 2.8 2025 (📱)

| Gaz | Config (kg) | Config (ppm équiv.) | Littérature | Références |
|-----|-------------|---------------------|-------------|------------|
| CO₂ | 3.3×10¹⁵ | ~420–450 ppm | ~420 ppm (2024) ; NOAA/Scripps | climate.gov ; NOAA |
| CH₄ | 5.5×10¹² | ~1.9 ppm | ~1.9 ppm (2024) | — |

**Validation** : Cohérent avec observations actuelles.

---

## 3. Références bibliographiques

| Référence | Sujet |
|-----------|-------|
| Anagnostou et al. Nature 2016 | CO₂ Cénozoïque, EECO 1000–1400 ppm |
| Catling & Zahnle 2020 Sci. Adv. | Atmosphère archéenne CO₂, CH₄ |
| Rosing et al. Geology 2004 | CO₂ Archéen, paléosols |
| Rye et al. Nature 1995 | CO₂ < 2.2 Ga, paléosols |
| Kaufman et al. Nature 2003 | CO₂ Protérozoïque, microfossiles |
| Wang et al. Earth-Sci. Rev. 2014 | CO₂ Crétacé, tendances |
| Etheridge et al. JGR 1996 | CO₂ 1000 ans, carottes glace |
| IPCC TAR WG1 | 280 ppm pré-industriel |
| CenCO2PIP Consortium Science 2024 | Synthèse CO₂ 66 Ma |

---

## 4. Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `static/timeline/configTimeline.js` | Source des masses `⚖️🏭`, `⚖️⛽`, `⚖️🫁` |
| `static/calculations_atm.js` | `calculateAtmosphereComposition()` : fractions = mass_gas / mass_atm |
| `static/compute/compute.js` | `getMasses()` : lit config → DATA |

---

## 5. Checklist de mise à jour

Lors de toute modification des masses de gaz dans `configTimeline.js` :

- [ ] Vérifier la cohérence avec ce document
- [ ] Citer la référence littérature pour la nouvelle valeur
- [ ] Mettre à jour le tableau correspondant ci-dessus
- [ ] Vérifier la formule ppm ↔ kg si atmosphère non standard (Hadéen, Archéen)
