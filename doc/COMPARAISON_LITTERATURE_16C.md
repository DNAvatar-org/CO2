# Comparaison avec la littérature — État à 16,1°C

Comparaison des variables du modèle (cycle eau, atmosphère, albédo) à **16,1°C** avec les ordres de grandeur et références pour la **Terre** à température globale similaire (~15–16°C).

---

## 1. Cycle de l'eau (💧)

| Variable modèle | Signification | Valeur @16,1°C | Littérature / Terre | Références |
|-----------------|---------------|----------------|---------------------|------------|
| **🍰💧🧊** | Fraction glace (réservoir eau) | 0,028 (2,8 %) | ~2–3 % (glace permanente + saisonnière) | IPCC, cryosphère globale |
| **🍰💧🌊** | Fraction océan (réservoir eau) | 0,972 (97,2 %) | ~97 % du réservoir eau liquide/solide | Cohérent (océan dominant) |
| **🍰🧮🌧** | Pression vapeur saturante relative (Clausius–Clapeyron) | 0,017 | À 16°C : q_sat ≈ 10,6 g/kg (saturation) | Wallace & Hobbs; tables NWS mixing ratio |
| **🍰🫧💧** | Fraction massique vapeur (q) | 0,008 (0,8 % ≈ 8 g/kg) | 0,25 % masse en moyenne globale; 1 % au niveau mer en air humide; 8 g/kg ≈ 75 % RH à 15°C | Wikipedia Atmosphere of Earth; saturation 15°C ≈ 10,6 g/kg |
| **🍰🫧☔** | Humidité relative (q / q_sat) | 0,767 (76,7 %) | Global surface RH très variable; 70–80 % typique régions humides | HadISDH, Climate Data Guide |
| **🍰⚖️💦** | Précipitation (kg/m²/s) | ~2,9×10⁻⁵ (P = W/τ) | Global mean ~2,5–3 mm/jour ≈ 2,9–3,5×10⁻⁵ kg/m²/s | GPCP, NASA GPM (~2,7 mm/jour souvent cité) |
| **💭☔** | Seuil RH précipitations | 0,753 | Schémas type Sundqvist : seuil 0,7–0,9 | Paramètre modèle |
| **⏳☔** | 1 / τ_global (s⁻¹) | ~1,16×10⁻⁶ | τ_vapeur ~ 8–10 j → 1/τ ~ 1×10⁻⁶ s⁻¹ (global) | Nature Rev. Earth Env. 2021; HESS 2017 |

**Synthèse eau :**  
- **Vapeur (0,8 %, 76,7 % RH)** : cohérent avec air humide à 16°C (saturation 10,6 g/kg → 8 g/kg ≈ 75 % RH).  
- **Précipitation** : formule **P = W/τ** avec τ = 10 j (litt. 8–10 j) ; rampe (RH − 💭☔)/0,2 au seuil. Donne ~2,5–3 mm/jour pour colonne vapeur typique (~25 kg/m²), aligné avec GPCP ~2,7 mm/jour.

---

## 2. Atmosphère (🫧)

| Variable modèle | Signification | Valeur @16,1°C | Littérature / Terre | Références |
|-----------------|---------------|----------------|---------------------|------------|
| **🎈** | Pression (atm) | 0,978 | 1 atm (1013,25 hPa) standard | Définition |
| **🧪** | Masse molaire (kg/mol) | 0,029 | 28,946–28,964 g/mol (air sec); diminue si humide | Wikipedia, Allen (2002) |
| **📏🫧🧿** | « Ligne de Kármán » (altitude P = 0,01 Pa) (km) | 140 | Kármán = 100 km; niveau 0,01 Pa plus haut (thermosphère) | Wikipedia Scale height; Kármán line |
| **📏🫧🛩** | Tropopause (km) | 8,513 | 6–10 km (pôles), 16–18 km (équateur); échelle de hauteur ~8,5 km | Wikipedia Tropopause; Scale height ~8,5 km |
| **🍰🫧🏭** | Fraction CO₂ | 6,34×10⁻⁴ | ~412 ppm (0,0412 %) | Wikipedia, NOAA |
| **🍰🫧⛽** | Fraction CH₄ | 1,06×10⁻⁶ | ~1,8 ppm | Wikipedia |
| **🍰🫧🫁** | Fraction O₂ | 0,227 (22,7 %) | 20,95 % (volume) | Wikipedia Atmosphere of Earth |
| **🍰🫧💨** | Fraction N₂ | 0,763 (76,3 %) | 78,08 % | Id. |
| **🍰🫧📿🌈** | Capacité radiative IR totale (norm.) | 0,867 | — | Indicateur modèle (0–1) |
| **🍰🫧🏭🌈** | Capacité radiative IR CO₂ (⟨1−e⁻τ⟩ pondérée IR) | 0,060 | — | Pas une « part EDS » ; attribution type Schmidt = 🍰📛🏭 (📛) |
| **🍰🫧💧🌈** | Capacité radiative IR H₂O | 0,623 | H₂O dominant effet de serre IR | Littérature EDS |
| **🍰🫧⛽🌈** | Capacité radiative IR CH₄ | 0,185 | — | Trace gas |
| **🍰💭** | CCN / efficacité condensation nuageuse | 1,000 | — | Paramètre 0,3–1,0 |

**Synthèse atmosphère :**  
- **Pression, O₂, N₂** : très proches de la Terre (pression ~1 atm, O₂ ~21 %, N₂ ~78 %; le modèle sans Argon donne O₂+N₂ ≈ 99 %).  
- **CO₂** : 6,34×10⁻⁴ ≈ 634 ppm en fraction molaire; si l’époque cible est « actuelle », 408–420 ppm est plus courant — à interpréter selon l’époque configurée.  
- **Tropopause 8,5 km** : dans la fourchette moyennes latitudes / échelle de hauteur (~8,5 km).  
- **Hauteur 140 km** : cohérent avec une limite haute d’atmosphère (niveau ~0,01 Pa), au-delà de la ligne de Kármán (100 km).
- **🍰🫧❀🌈 vs 📛** : Les 🍰🫧❀🌈 sont des **capacités radiatives IR** (⟨1−e⁻τ⟩ pondérée), pas des parts EDS. La répartition EDS (CO₂ ~20 %, H₂O ~50 % en littérature Schmidt) correspond à notre **📛** (🍰📛🏭, 🍰📛💧), répartition **tau-ratio** (une passe), différente de l'attribution marginale Schmidt ; voir doc/VAPEUR_VS_NUAGES.md.

---

## 3. Albédo (🪩)

| Variable modèle | Signification | Valeur @16,1°C | Littérature / Terre | Références |
|-----------------|---------------|----------------|---------------------|------------|
| **🍰🪩📿** | Albédo planétaire total | 0,292 (29,2 %) | ~0,29 (29 %) | Stephens et al.; Frontiers EPIC; Earth’s albedo ~0,29 |
| **🍰🪩🌋** | Volcan | 0 | — | — |
| **🍰🪩🏜️** | Désert | 0,071 | Albédo désert ~0,25–0,40 | — |
| **🍰🪩🌳** | Forêt | 0,025 | — | — |
| **🍰🪩🌊** | Océan | 0,71 | Poids surface océan dans moyenne | — |
| **🍰🪩🧊** | Glace | 0,073 | Contribution glace | — |
| **🍰🪩⛅** | Nuages (coefficient) | 0,257 | Nuages = principal contributeur albédo (~88 % de l’albédo planétaire) | Donohoe & Battisti; Stephens |
| **🍰🪩🌍** | Continents | 0,121 | — | — |
| **☁️** | Couverture / indice nuageux | 0,575 (57,5 %) | Couverture nuageuse globale ~60–70 % | ISCCP, satellites |

**Synthèse albédo :**  
- **Albédo total 29,2 %** : en très bon accord avec la valeur terrestre ~29 %.  
- **Nuages (☁️ 57,5 %, 🍰🪩⛅ 0,26)** : dans la gamme de la couverture nuageuse globale et du rôle dominant des nuages sur l’albédo.

---

## 4. Références citées

- **Atmosphere of Earth** (composition, N₂, O₂, Ar, CO₂, H₂O) : Wikipedia, NOAA.  
- **Water vapor** : Wallace & Hobbs, *Atmospheric Science*; saturation 15°C ≈ 10,6 g/kg (tables NWS / Arizona).  
- **Precipitation** : GPCP, NASA GPM; global mean ~2,7 mm/day.  
- **Planetary albedo** : Stephens et al., *J. Climate*; Donohoe & Battisti; Frontiers EPIC.  
- **Tropopause / scale height** : Wikipedia Tropopause, Scale height; UCAR.  
- **Relative humidity** : HadISDH, Climate Data Guide (UCAR).

---

## 5. Résumé

- **Cycle de l’eau** : vapeur (0,8 %, RH 77 %) et glace/ocean (2,8 % / 97,2 %) sont cohérents avec un climat terrestre ~16°C; les précipitations du modèle (🍰⚖️💦) sont plus faibles que la moyenne globale, ce qui peut correspondre à un flux de seuil dans le schéma.  
- **Atmosphère** : pression, O₂, N₂, tropopause et albédo total sont très proches de la Terre; CO₂ à interpréter selon l’époque (ppm).  
- **Albédo** : 29,2 % et rôle des nuages (☁️, 🍰🪩⛅) alignés avec la littérature (~29 %, nuages dominants).

*Document généré pour comparaison modèle CO2 / DNAvatar — état à 16,1°C.*
