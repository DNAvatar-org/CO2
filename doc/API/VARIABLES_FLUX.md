# Variables disponibles dans le flux énergétique

**Contexte** : Ce document décrit les variables de la **vue Visuel** (index.html, plotData, organigramme). Pour la vue **Scientifique** (html/scie_compute.html), les données sont dans `DATA` (voir doc/API/FORMULES.md et doc/API/SENS_CONVERGENCE_ET_VALEURS.md).

## Variables globales (window)

### Constantes
- `window.SOLAR_CONSTANT` : 1366 W/m² (constante solaire) — ou depuis DATA['☀️'] selon époque
- `window.waterVaporEnabled` : boolean (H2O activé/désactivé)
- `window.methaneEnabled` : boolean (CH4 activé/désactivé)

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
- **top** : `{h2o_percent}%`
  - h2o_percent : calculé depuis vapeur d'eau ou 0 si désactivé
- **bottom** : `{forcing_H2O} W/m²`
  - forcing_H2O : `window.calculateH2OForcing(window.waterVaporEnabled, plotData.current.cloud_coverage)`

#### Albédo
- **top** : `{forcing_albedo} W/m²`
  - forcing_albedo : `window.calculateAlbedoForcing(plotData.current.albedo)`
- **bottom** : `{albedo_percent}%`
  - albedo_percent : `plotData.current.albedo * 100`

