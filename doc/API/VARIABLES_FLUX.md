# Variables disponibles dans le flux énergétique

**Contexte** : Ce document décrit les variables de la **vue Visuel** (index.html, plotData, organigramme). Pour la vue **Scientifique** (html/scie_compute.html), les données sont dans `DATA` (voir doc/API/FORMULES.md et doc/API/SENS_CONVERGENCE_ET_VALEURS.md).

## Variables globales (window)

### Constantes
- `window.SOLAR_CONSTANT` : 1366 W/m² (constante solaire) — ou depuis DATA['☀️'] selon époque
- `window.UI_STATE.waterVaporEnabled` : boolean (H2O activé/désactivé)
- `window.UI_STATE.methaneEnabled` : boolean (CH4 activé/désactivé)

### Fonctions de calcul
- `window.calculateCO2Forcing(CO2_fraction)` : Diagnostic ΔF CO2 (W/m², convention affichage, climate.js)
- `window.calculateH2OForcing(h2o_enabled, cloud_coverage)` : Diagnostic ΔF H2O (W/m², convention affichage)
- `window.calculateAlbedoForcing(albedo)` : Diagnostic ΔF albédo (W/m², convention affichage)
- `window.calculateSolarFluxAbsorbed(T_surface_K, h2o_enabled)` : Flux solaire absorbé (W/m²)

## Variables dans plotData

### Concentrations
- `plotData.co2_ppm` : CO2 en ppm (parties par million)
- `plotData.ch4_ppm` : CH4 en ppm

### Résultats de calcul (plotData.current)
- `plotData.current.total_flux` : Flux total au sommet de l'atmosphère (W/m²)
- `plotData.current.albedo` : Albedo (0-1, 0% à 100%)
- `plotData.current.cloud_coverage` : Couverture nuageuse (0-1, 0% à 100%)
- `plotData.current.effective_temperature` : Température effective (K)
- `plotData.current.T0` : Température de surface (K)

## Mapping des étiquettes du flux

### Soleil
- **bottom** : `3.8×10²⁶ W` (fixe)
- **right** : `62.4 MW/m²` (fixe, calculé depuis constante solaire)

### Géométrie
- **left** : `1361 W/m²` (window.SOLAR_CONSTANT)
- **right** : `340.25 W/m²` (SOLAR_CONSTANT / 4)

### Albedo (flèche geometrie → surface)
- **name** : `Albédo: ⛅{cloud}% + ❄️{ice}%`
  - cloud : `plotData.current.cloud_coverage * 100`
  - ice : calculé depuis température/albedo
- **txt2** : `{flux_reflechi} W/m²`
  - flux_reflechi : `SOLAR_CONSTANT / 4 * albedo`

### Albedo → Espace1
- **name** : `{flux_emission} W/m²`
  - flux_emission : `plotData.current.total_flux` (flux au sommet)

### Noyau → Surface
- **name** : `0.087 W/m²` (fixe, géothermie)

### Surface → Albedo
- **txt1** : `{flux_emission_surface} W/m²`
  - flux_emission_surface : calculé depuis température surface (loi de Stefan-Boltzmann)

### Réémis
- **left** : `Forçage Radiatif` (fixe)
- **right** : `{forcing_total} W/m²`
  - forcing_total : `calculateCO2Forcing() + calculateH2OForcing() + calculateAlbedoForcing()`

### Boutons

#### CO2
- **left[0]** : `{co2_percent}%`
  - co2_percent : `plotData.co2_ppm / 10000` (approximation) ou calcul précis
- **left[1]** : `{forcing_CO2} W/m²`
  - forcing_CO2 : `window.calculateCO2Forcing(plotData.co2_ppm * 1e-6)`

#### CH4
- **left[0]** : `{ch4_percent}%`
  - ch4_percent : `plotData.ch4_ppm / 10000` (approximation)
- **left[1]** : `{forcing_CH4} W/m²`
  - forcing_CH4 : calculé depuis CH4 (si disponible)

#### H2O
- **top** : `{h2o_percent}%` — **fraction MOLAIRE** depuis le 2026-09-22 (organigramme v1.0.117),
  comme les badges CO₂ et CH₄. Avant c'était une fraction MASSIQUE, donc l'eau se lisait ~1,6×
  trop basse et les trois voisins ne parlaient pas la même langue (📱 : 0,667 % massique =
  1,07 % molaire). Conversion : `x_molaire = 🍰🫧💧 × 🧪 / M_H2O`, où 🧪 est la masse molaire de
  l'air de l'époque — elle change (atmosphère de CO₂, de N₂…), donc le facteur n'est pas constant.
  - **Bascule automatique en ppm sous 0,1 %** (`shouldConvertPercentToPpm`). Sur les 19 époques,
    une seule bascule : ⛄ Plein Snowball, **42 ppm**. Le seuil n'est volontairement PAS l'inverse
    exact du sens ppm → % (qui bascule à 10 000 ppm = 1 %) : la vapeur vit autour de 1 % molaire,
    un seuil à 1 % afficherait 🚂 en « 9936 ppm » et 📱 juste à côté en « 1.1 % ».
  - h2o_percent : calculé depuis vapeur d'eau ou 0 si désactivé. ⚠️ `RUNTIME_STATE.h2oVaporPercent`
    reste, lui, une fraction MASSIQUE ×100 : d'autres consommateurs la lisent telle quelle
    (main.js `calculateH2OParameters`, sync_panels, postMessage des panneaux). Le badge recalcule
    sa propre valeur molaire — on ne change pas la sémantique d'une variable partagée pour un
    problème d'affichage.
- **bottom** : `{forcing_H2O} W/m²`
  - forcing_H2O : `window.calculateH2OForcing(window.UI_STATE.waterVaporEnabled, plotData.current.cloud_coverage)`
  - ⚠️ Un EDS non nul avec un pourcentage affiché à 0,0 n'est PAS une incohérence : c'était l'arrondi.
    À ⛄, 42 ppmv d'air saturé (RH = 1 à −56 °C) rendent ~5 W/m² — ce sont les premiers ppm d'eau
    qui portent le plus, les centres de bande saturant ensuite.

#### Albédo
- **top** : `{forcing_albedo} W/m²`
  - forcing_albedo : `window.calculateAlbedoForcing(plotData.current.albedo)`
- **bottom** : `{albedo_percent}%`
  - albedo_percent : `plotData.current.albedo * 100`

