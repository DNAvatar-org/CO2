# Structure complète de `DATA`

`DATA` est l'objet central qui contient toutes les données de l'application. Il utilise des emojis comme clés pour une meilleure lisibilité.

## Architecture générale

```javascript
window.DATA = {
    // États activés (booleans)
    '🔘': { ... },
    
    // Configuration de date / Événements
    '📜': { ... },
    
    // Date Époque
    '📅': { ... },
    
    // Masses en kg
    '⚖️': { ... },
    
    // Composition atmosphérique
    '🫧': { ... },
    
    // Cycle de l'eau (répartition)
    '💧': { ... },
    
    // Albédo (valeurs 0-1)
    '🪩': { ... },
    
    // Flux (W/m²)
    '🧲': { ... },
    
    // Paramètres de convergence
    '🧮': { ... },
    
    // Valeurs solaires
    '☀️': { ... },
    
    // Valeurs géothermiques (noyau)
    '🌕': { ... },
    
    // EDS (breakdown par gaz ; ΔF = convention affichage)
    '📛': { ... },
    
    // Géologie (Surfaces géologiques - Couche A)
    '🗻': { ... }
};
```

## Détail de chaque catégorie

### `DATA['🔘']` - États activés
États activés/désactivés (booleans).

```javascript
'🔘': {
    '🔘💧📛': boolean,  // H2O EDS on/off
    '🔘⛽📛': boolean,  // CH4 EDS on/off
    '🔘🏭📛': boolean,  // CO2 EDS on/off
    '🔘🪩': boolean,    // Albedo on/off
    '🔘🎬': boolean     // Animation on/off
}
```

### `DATA['📜']` - Configuration de date / Événements
Configuration des événements et dates.

```javascript
'📜': {
    '🌡️🧮': number,           // T0 attendu (t° config)
    '📿☄️': number,           // Nombre de météore
    '🔺⚖️💧☄️': number,       // Masse d'eau / météore
    '🔺🌡️💫': number,         // Delta t° / ticTime
    '🔺🧲🌕💫': object | null, // Delta Geoth / ticTime ({'▶': start, '◀': end})
    '🧲🔬': number,           // Précision Flux
    '👉': number,             // Index
    '🗿': string              // Logo
}
```

### `DATA['📅']` - Date Époque
Configuration de l'époque courante.

```javascript
'📅': {
    '🌡️🧮': number,  // T° attendue
    '📿💫': number    // Nombre de ticTime
}
```

### `DATA['⚖️']` - Masses
Masses en kg.

```javascript
'⚖️': {
    '⚖️🏭': number,  // Masse CO2
    '⚖️⛽': number,  // Masse CH4
    '⚖️💧': number,  // Masse H2O
    '⚖️🫁': number,  // Masse O2
    '⚖️🫧': number   // Masse atmosphère (kg) = ⚖️🏭 + ⚖️⛽ + ⚖️🫁 + ⚖️💨
}
```

### `DATA['🫧']` - Composition atmosphérique
Composition atmosphérique (fractions et propriétés).

```javascript
'🫧': {
    '🎈': number,        // Pression atmosphérique (bar)
    '🧪': number,        // Masse molaire air (kg/mol)
    '📏🫧🧿': number,    // Ligne de Kármán (km)
    '📏🫧🛩': number,    // Tropopause (km)
    '🍰🫧🏭': number,    // CO2 (fraction)
    '🍰🫧💧': number,    // H2O - Proportion radiative EDS de H₂O dans l'atmosphère (pas un stock global)
    '🍰🫧⛽': number,    // CH4 (fraction)
    '🍰🫧🫁': number,   // O2 (fraction)
    '🍰🫧💨': number,    // N2 (fraction)
    '☁️': number         // CloudFormationIndex - Potentiel de condensation (ni masse ni surface, mais index de formation nuageuse) ∈ [0, 1]
}
```

### `DATA['💧']` - Cycle de l'eau
Cycle de l'eau (répartition en fractions).

```javascript
'💧': {
    '🍰💧🧊': number,  // Glace (fraction)
    '🍰💧🌊': number,   // Océan - Fraction de l'eau liquide dans le stock total d'eau
    '🍰🧮🌧': number    // Max vapor fraction
}
```

**Note importante** : `🍰💧⛅` a été supprimé. Les nuages ne sont pas un réservoir d'eau mais un phénomène optique + dynamique. Voir `☁️` ci-dessous.

### `DATA['🪩']` - Albédo
Albédo (valeurs 0-1) et couvertures de surface.

```javascript
'🪩': {
    '🍰🪩📿': number,  // Albedo total
    '🍰🪩🌋': number, // Volcan (couverture)
    '🍰🪩🏜️': number, // Désert (couverture)
    '🍰🪩🌳': number, // Forêt (couverture)
    '🍰🪩🌊': number, // Océan (couverture)
    '🍰🪩🧊': number, // Glace (couverture)
    '🍰🪩⛅': number,  // Nuages (fraction optique) = C_max × η_cloud × ☁️ où C_max = 0.65, η_cloud = 0.40. Fraction optique moyenne vue par le Soleil, pas proportion de surface au sol.
    '🍰🪩🌍': number  // Terres (couverture)
}
```

**Note importante** : `🍰🪩⛅` est calculé depuis `☁️` (CloudFormationIndex) : `🍰🪩⛅ = C_max × ☁️` où `C_max ≈ 0.7` (plafond planétaire).

### `DATA['🧲']` - Flux (W/m²)
Flux en W/m² (entrant, sortant, déséquilibre).

```javascript
'🧲': {
    '🧲☀️🔽': number,  // Flux solaire absorbé
    '🧲🌕🔽': number, // Flux géothermique
    '🧲🌑🔼': number, // Flux sortant (σT⁴)
    '🧲🌈🔼': number, // Courbe spectrale
    '🧲🪩🔼': number, // Flux réfléchi
    '🔺🧲': number    // Delta flux
}
```

### `DATA['🧮']` - Convergence
Paramètres de convergence et température.

```javascript
'🧮': {
    '🌡️': number,     // T0 (t° courante)
    '🧮⚧': string,    // Phase (Init/Search/Dicho)
    '🧮☯': number,    // Direction (+/-)
    '🧲🔬': number,   // Précision en Flux
    '🔬🌈': number,   // Résolution spectrale
    '🔬🫧': number,   // Résolution atmosphérique
    '🧮🔄': number    // Nombre d'itérations (O(🔬🌈×🔬🫧))
}
```

### `DATA['☀️']` - Soleil
Valeurs solaires.

```javascript
'☀️': {
    '🧲☀️': number,     // Flux solaire à 1 UA
    '🧲☀️🎱': number,  // Flux solaire géométrique (1 UA / 4)
    '🔋☀️': number     // Puissance totale du soleil
}
```

### `DATA['🌕']` - Noyau
Valeurs géothermiques (noyau).

```javascript
'🌕': {
    '🧲🌕': number,  // Flux géothermique
    '🔋🌕': number   // Puissance totale du noyau
}
```

### `DATA['📛']` - EDS (breakdown par gaz)
EDS en W/m² et parts par gaz ; 🔺📛❀ = diagnostic ΔF (convention affichage, climate.js).

```javascript
'📛': {
    '🔺📛💧': number,  // ΔF H₂O affichage (W/m², convention)
    '🔺📛🏭': number,  // ΔF CO₂ affichage (W/m², convention)
    '🔺📛⛽': number,  // ΔF CH₄ affichage (W/m², convention)
    '🔺📿📛': number   // ΔF total affichage (W/m², convention)
}
```

### `DATA['🗻']` - Géologie
Surfaces géologiques (Couche A) - surfaces fixes déterminées par la géologie/relief.

```javascript
'🗻': {
    '🍰🗻🌊': number,  // Surface océanique potentielle (bassin océanique)
    '🍰🗻🏔': number,  // Surface hautes terres (zones de glace potentielles)
    '🍰🗻🌍': number   // Surface terres basses (zones de forêts/continents)
}
```

## Conventions de nommage

### Préfixes des clés

- `🍰` = Proportion (fraction 0-1)
- `🔺` = Delta (différence)
- `📏` = Distance/hauteur
- `🧲` = Flux (W/m²)
- `🔋` = Puissance (W)
- `🔬` = Résolution/précision
- `📿` = Total/somme

### Structure hiérarchique

`DATA` utilise une structure hiérarchique à 2 niveaux :
- **Niveau 1** : Catégorie (emoji unique, ex: `'🫧'`, `'🪩'`)
- **Niveau 2** : Clé complète (combinaison d'emojis, ex: `'🍰🫧💧'`)

### Accès aux données

```javascript
// Accès direct
const h2o_fraction = DATA['💧']['🍰🫧💧'];
const albedo_total = DATA['🪩']['🍰🪩📿'];

// Vérification d'existence
if (DATA['🫧'] && DATA['💧']['🍰🫧💧'] !== undefined) {
    // ...
}
```

## Objets associés

### `DESC` - Descriptions
`window.DESC` contient les descriptions de toutes les clés, avec la même structure hiérarchique que `DATA`.

```javascript
window.DESC = {
    '🫧': {
        '🍰🫧💧': 'H2O',
        '🍰🫧🏭': 'CO2',
        // ...
    },
    // ...
};
```

### `FORM` - Formules
`window.FORM` contient les formules de calcul pour chaque clé.

```javascript
window.FORM = {
    '🫧': {
        '🍰🫧🏭': '⚖️🏭 / ⚖️🫧',
        '🍰🫧💧': '⚖️💧_vapeur / ⚖️🫧',
        // ...
    },
    // ...
};
```

## Notes importantes

1. **Source unique** : `DATA` est la source unique de vérité. Tous les calculs lisent depuis et écrivent dans `DATA`.

2. **Pas de fallback** : Ne pas utiliser `||` pour les valeurs par défaut. L'application doit planter si une valeur est `undefined`.

3. **Initialisation** : `DATA` est initialisé automatiquement dans `dico.js` avec des valeurs par défaut (0.0 pour les nombres, false pour les booléens, '' pour les strings).

4. **Mise à jour** : Les valeurs sont mises à jour par les fonctions de calcul (ex: `calculateAtmosphereComposition()`, `calculateAlbedo()`, etc.).

5. **Géologie (Couche A)** : `DATA['🗻']` contient les surfaces géologiques fixes, déterminées par l'époque. Ces surfaces contraignent ensuite les stocks d'eau, pas l'inverse.

## Pipeline de calcul

L'ordre correct de calcul suit la logique physique :

1. **Géologie** → `DATA['🗻']` : Surfaces fixes (bassin océanique, hautes terres, terres basses)
2. **Stocks** → `DATA['💧']` : Répartition de l'eau (vapeur, glace, océan) contrainte par les surfaces
3. **Climat** → `DATA['🧮']` : Température et convergence
4. **Albedo** → `DATA['🪩']` : Albedo total et couvertures de surface
5. **Flux** → `DATA['🧲']` : Flux radiatifs et équilibre
