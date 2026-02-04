# Rapport : configTimeline.js vs littérature scientifique

**Objectif** : Validation du processus de configuration des époques géologiques — traçabilité des paramètres (🌡️🧮, 🔋☀️, ⚖️🏭, etc.) par rapport à la littérature.

**Date** : 2025-02-04

**Source de vérité** : `static/timeline/configTimeline.js`

---

## 1. Paramètres validés

### 1.1 Masses de gaz (CO₂, CH₄, O₂)

Voir **doc/VALIDATION_CONFIG_GAZ.md** pour la traçabilité détaillée des masses `⚖️🏭`, `⚖️⛽`, `⚖️🌫` par époque.

### 1.2 Température de surface (🌡️🧮)

| Époque | Config (K) | Littérature | Références |
|-------|------------|-------------|------------|
| Corps noir ⚫ | 255 | ~255 K (σT⁴ = S/4) | Équilibre corps noir |
| Hadéen 🔥 | 2450 | 2000–2500 K (océan magma) | Formation planétaire |
| Archéen 🦠 | 288 | 281–303 K plausible (Charnay 2017, Kienert 2013) | Clim. Past 9:1841 ; Astrobiology 2014 |
| Protérozoïque 🌿 | 285 | ~280–290 K | Lit. Protérozoïque |
| Mésozoïque 🦕 | 298 | ~295–305 K | Lit. Mésozoïque |
| Crétacé 🦴 | 301 | Serre chaude +6 à +8°C | Wang et al. 2014 |
| Cénozoïque 🦣 | 291 | 288–295 K, refroidissement | Anagnostou Nature 2016 |
| 1800 🚂 | 287 | ~14°C pré-industriel | IPCC |
| 2025 📱 | 288.8 | Record chaud 2025 | Observations |

### 1.3 Puissance solaire (🔋☀️)

| Époque | Config (% actuel) | Référence |
|--------|-------------------|-----------|
| Corps noir | 70 % | Soleil jeune |
| Hadéen | 75 % | Faint Young Sun |
| Archéen | 80 % | Faint Young Sun |
| Protérozoïque | 90 % | Évolution stellaire |
| Mésozoïque | 98 % | — |
| Crétacé | 99 % | — |
| Cénozoïque → 2025 | 99.5–100 % | Valeur actuelle 3.828×10²⁶ W |

**Réf.** : Clouds/Faint Young Sun Copernicus 2011 ; Astrobiology 2014

### 1.4 Flux géothermique (🧲🌕)

| Époque | Config (W/m²) | Contexte |
|--------|---------------|----------|
| Hadéen | 2×10⁶ | Océan de magma, refroidissement linéaire |
| Archéen → 2025 | 0.09–2 (typ.) | Décroissance depuis formation |

---

## 2. Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `static/timeline/configTimeline.js` | Source unique des paramètres |
| `doc/VALIDATION_CONFIG_GAZ.md` | Détail masses gaz vs littérature |
| `doc/PARAMETRES_EPOQUES.html` | Tableau paramètres (aligné config) |

---

## 3. Checklist de mise à jour

Lors de toute modification de `configTimeline.js` :

- [ ] Vérifier cohérence avec VALIDATION_CONFIG_GAZ (masses gaz)
- [ ] Citer référence littérature pour nouvelle valeur
- [ ] Mettre à jour ce rapport et PARAMETRES_EPOQUES.html
- [ ] Vérifier formule ppm ↔ kg si atmosphère non standard
