# Données d'évolution du noyau terrestre et flux géothermique

## Résumé des recherches scientifiques

### Flux géothermique par époque

| Époque | Période | Flux géothermique | Facteur vs aujourd'hui |
|--------|---------|-------------------|------------------------|
| **Corps noir** | > 4.5 Ga | 0 W/m² | 0× (pas de noyau différencié) |
| **Hadéen précoce** | 4.5-4.4 Ga | ~140 W/m² | 1600× |
| **Hadéen tardif** | 4.4-4.0 Ga | ~10-20 W/m² | 115-230× |
| **Archéen précoce** | 4.0-3.0 Ga | ~0.3 W/m² | 3.5× |
| **Archéen tardif** | 3.0-2.5 Ga | ~0.2 W/m² | 2.3× |
| **Protérozoïque** | 2.5-0.541 Ga | ~0.15 W/m² | 1.7× |
| **Phanérozoïque** | 0.541 Ga-aujourd'hui | ~0.087 W/m² | 1× (aujourd'hui) |

### Températures

- **Aujourd'hui** : Noyau ~5700 K
- **Hadéen précoce** : Surface ~1800-2000 K (océan magmatique)
- **Archéen** : Manteau +200°C plus chaud qu'aujourd'hui

### Sources scientifiques

1. Flux Hadéen initial : ~140 W/m² (NIH study)
2. Flux Archéen début : 3× flux actuel
3. Flux Protérozoïque début : 2× flux actuel
4. Flux actuel : 0.087 W/m² (valeur standard)

### Facteurs influençant le flux géothermique

1. **Chaleur primordiale** : De l'accrétion et formation du noyau
2. **Radioactivité** : Décroissance des isotopes (U-238, U-235, Th-232, K-40)
3. **Différenciation du noyau** : Impact Théia (formation de la Lune, 4.5 Ga)

### Visualisation du rayonnement (radiation circles)

Pour représenter visuellement l'intensité du flux géothermique dans le diagramme :

```javascript
// Formule proposée pour maxRadius du rayonnement du noyau
maxRadius = baseRadius * Math.sqrt(geothermal_flux / current_flux)
// où baseRadius = 75 (valeur actuelle pour 0.087 W/m²)
// current_flux = 0.087 W/m²

// Calculs par époque :
// Corps noir : 0 → maxRadius = 0 (pas de rayonnement)
// Hadéen : 140 W/m² → maxRadius = 75 * √1609 = ~3000 (!)
// Archéen : 0.3 W/m² → maxRadius = 75 * √3.45 = ~140
// Protérozoïque : 0.15 W/m² → maxRadius = 75 * √1.72 = ~98
// Aujourd'hui : 0.087 W/m² → maxRadius = 75
```

**Note** : L'Hadéen précoce nécessite un traitement spécial car le flux est si élevé qu'il déborderait du diagramme!

## Proposition d'implémentation

Ajouter à `GEOLOGICAL_PERIODS` dans `geology.js` :

```javascript
{
    name: 'Corps noir',
    // ... champs existants ...
    core_temperature_k: null, // Pas de noyau différencié
    geothermal_flux: 0,
    core_radiation_intensity: 0
},
{
    name: 'Hadéen',
    // ... champs existants ...
    core_temperature_k: 6000, // Estimation (noyau très jeune)
    geothermal_flux: 20, // W/m² (valeur tardive, 10-20)
    core_radiation_intensity: 16 // facteur visuel (racine carrée de 230)
},
// etc.
```
