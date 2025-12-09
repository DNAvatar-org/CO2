# Structure complète de `ALL_DATA`

`ALL_DATA` est l'objet central qui contient toutes les données de l'application. Il remplace tous les objets globaux précédents (`window.enabledStates`, `window.dateConfig`, `window.masses`, `window.soleil`, `window.fluxState`, `window.epoch`).

## Architecture générale

```javascript
window.ALL_DATA = {
    // États activés (booleans)
    ENABLED_STATES: { ... },
    
    // Configuration des événements et dates
    DATE_CONFIG: { ... },
    
    // Masses en kg
    MASSES: { ... },
    
    // Composition atmosphérique
    ATM: { ... },
    
    // Cycle de l'eau (répartition)
    H2O: { ... },
    
    // Albédo (valeurs 0-1)
    ALBEDO: { ... },
    
    // Flux radiatifs (W/m²)
    FLUX: { ... },
    
    // Paramètres de convergence
    CONVERGENCE: { ... },
    
    // Valeurs solaires
    SOLEIL: { ... },
    
    // Valeurs géothermiques (noyau)
    NOYAU: { ... },
    
    // Constantes physiques
    CONSTANTS: { ... },
    
    // Configuration de l'époque courante
    EPOCH: { ... }
};
```

## Détail de chaque catégorie

### `ALL_DATA.ENABLED_STATES`
États activés/désactivés (booleans). Les clés sont initialement des logos, puis remplacées par des valeurs booléennes.

```javascript
ENABLED_STATES: {
    'H2O_EDS': '📛💧',      // → boolean (H2O EDS on/off)
    'CH4_EDS': '📛⛽',      // → boolean (CH4 EDS on/off)
    'CO2_EDS': '📛🏭',      // → boolean (CO2 EDS on/off)
    'ALBEDO': '📛🪞',       // → boolean (Albedo on/off)
    'ANIMATION': '🔘🎬'     // → boolean (Animation on/off)
}
```

### `ALL_DATA.DATE_CONFIG`
Configuration des événements et dates. Les clés sont initialement des logos, puis remplacées par des valeurs.

```javascript
DATE_CONFIG: {
    'OLD_T0': '🌡️🏮',                    // → number (old_T0 en K, backup température)
    'T0_CONFIG': '🌡️⏳',                 // → number (T0 attendu en K, température config)
    'METEORITE_COUNT': '🎓☄️',            // → number (Nombre de météorites)
    'DELTA_WATER_METEORITE': '🔺🐳💧☄️',  // → number (Masse d'eau / météorite en kg)
    'TIC_TIME_COUNT': '🎓🕰',             // → number (Nombre de ticTime)
    'DELTA_TEMP_TIC_TIME': '🔺🌡️🕰',     // → number (Delta température / ticTime en K)
    'DELTA_FLUX_GEOTHERMAL_TIC_TIME': '🔺🧲🌕🕰'  // → object | null ({'▶': start, '◀': end} en W/m²)
}
```

### `ALL_DATA.MASSES`
Masses en kg. Les clés sont initialement des logos, puis remplacées par des valeurs numériques.

```javascript
MASSES: {
    'CO2': '🐳🏭',      // → number (Masse CO2 en kg)
    'CH4': '🐳⛽',      // → number (Masse CH4 en kg)
    'H2O': '🐳💧',     // → number (Masse H2O en kg)
    'O2': '🐳🌫',      // → number (Masse O2 en kg)
    'TOTAL': '🐳📿'    // → number (Masse totale atmosphère en kg)
}
```

### `ALL_DATA.ATM`
Composition atmosphérique. Les clés sont initialement des logos, puis remplacées par des valeurs.

```javascript
ATM: {
    'ALTITUDE': '📏🌬🚀',        // → number (Ligne de Kármán en m)
    'TROPOPAUSE': '📏🌬🛩',      // → number (Tropopause en m)
    'CO2': '🥒🌬🏭',            // → number (CO2 en %)
    'H2O': '🥒🌬💧',            // → number (H2O en %)
    'CH4': '🥒🌬⛽',            // → number (CH4 en %)
    'O2': '🥒🌬🌫',             // → number (O2 en %)
    'N2': '🥒🌬⚗'              // → number (N2 en %)
}
```

### `ALL_DATA.H2O`
Cycle de l'eau (répartition). Les clés sont initialement des logos, puis remplacées par des valeurs en %.

```javascript
H2O: {
    'ICE': '🍰💧🧊',           // → number (Glace en %)
    'CLOUD': '🍰💧⛅',          // → number (Nuages en %)
    'OCEAN': '🍰💧🌊',         // → number (Océan en %)
    'MAX_VAPOR': '⏳🌧'        // → number (Max vapor fraction en %)
}
```

### `ALL_DATA.ALBEDO`
Albédo (valeurs 0-1). Les clés sont initialement des logos, puis remplacées par des valeurs.

```javascript
ALBEDO: {
    'TOTAL': '🥒🪞📿',          // → number (Albedo total, 0-1)
    'VOLCANO': '🥒🪞🌋',        // → number (Volcan, 0-1)
    'DESERT': '🥒🪞🏜',         // → number (Désert, 0-1)
    'FOREST': '🥒🪞🌲',         // → number (Forêt, 0-1)
    'OCEAN': '🥒🪞🌊',          // → number (Océan, 0-1)
    'ICE': '🥒🪞🧊',            // → number (Glace, 0-1)
    'CLOUD': '🥒🪞⛅'           // → number (Nuages, 0-1)
}
```

### `ALL_DATA.FLUX`
Flux radiatifs en W/m². Les clés sont initialement des logos, puis remplacées par des valeurs.

```javascript
FLUX: {
    'SOLAR_ABSORBED': '🧲☀️⬇️',      // → number (Flux solaire absorbé en W/m²)
    'GEOTHERMAL_IN': '🧲🌕⬇️',       // → number (Flux géothermique en W/m²)
    'OUT': '🧲🌑🔼',                 // → number (Flux sortant (σT⁴) en W/m²)
    'SPECTRAL_OUT': '🧲🌈🔼',        // → number (Courbe spectrale en W/m²)
    'DELTA': '🔺🧲',                // → number (Delta flux en W/m²)
    'REFLECTED': '🧲☀️🪞'            // → number (Flux réfléchi en W/m²)
}
```

### `ALL_DATA.CONVERGENCE`
Paramètres de convergence. Les clés sont initialement des logos, puis remplacées par des valeurs.

```javascript
CONVERGENCE: {
    'OLD_T0': '🌡️🏮',              // → number (old_T0 en K, backup température)
    'T0': '🌡️⏳',                   // → number (T0 en K, température initiale)
    'PHASE': '🔍',                  // → string (Phase: 'Search' | 'Dicho')
    'DIRECTION': '🔀',              // → string (Direction: '+' | '-')
    'TOLERANCE': '🧲🔬',            // → number (Précision en Flux en W/m²)
    'SPECTRAL_SAMPLING': '🎓🌈',    // → number (Résolution spectrale)
    'ATMOSPHERE_SAMPLING': '🎓🌬'   // → number (Résolution atmosphérique)
}
```

### `ALL_DATA.SOLEIL`
Valeurs solaires. Les clés sont initialement des logos, puis remplacées par des valeurs.

```javascript
SOLEIL: {
    'CONSTANT': '🧲☀️📜',           // → number (Constante solaire à 1 UA en W/m²)
    'GEOMETRY_ORIGIN': '🧲☀️🎱',    // → number (Flux solaire géométrique (1 UA / 4) en W/m²)
    'SUN_ORIGIN': '🧲☀️🌞',         // → number (Flux solaire à la surface du soleil en W/m²)
    'POWER': '🔋☀️📜'              // → number (Puissance totale du soleil en W)
}
```

### `ALL_DATA.NOYAU`
Valeurs géothermiques (noyau). Les clés sont initialement des logos, puis remplacées par des valeurs.

```javascript
NOYAU: {
    'FLUX': '🧲🌕📜',               // → number (Flux géothermique en W/m²)
    'POWER': '🔋🌕📜'               // → number (Puissance totale du noyau en W)
}
```

### `ALL_DATA.CONSTANTS`
Constantes physiques (ne changent jamais).

```javascript
CONSTANTS: {
    'STEFAN_BOLTZMANN': 5.670374419e-8,      // W/(m²·K⁴) - constante de Stefan-Boltzmann
    'SOLAR_CONSTANT_REF': 1361,               // W/m² - constante solaire à 1 UA
    'SOLAR_POWER_REF': 3.828e26,              // W - puissance totale du soleil
    'SOLAR_SURFACE_AREA': 6.09e18,            // m² - surface du soleil
    'EARTH_RADIUS_REF': 6371000,              // m - rayon terrestre de référence
    'EARTH_TOTAL_WATER_MASS_KG': 1.4e21       // kg - masse totale d'eau terrestre
}
```

### `ALL_DATA.EPOCH`
Configuration de l'époque courante (depuis `configTimeline.js`). Structure complète :

```javascript
EPOCH: {
    // Identifiants
    'id': string,                    // Ex: 'corps-noir', 'hadeen', 'cenozoique'
    'name': string,                  // Ex: 'Corps noir', 'Hadéen', 'Cénozoïque'
    'date': string,                  // Ex: '-5000 Ma', '-4500 Ma', '-66 Ma'
    'startYears': number,            // Années depuis aujourd'hui (positif = passé)
    'endYears': number,              // Années depuis aujourd'hui
    
    // Température
    't0': number,                    // Température initiale en K
    'precision': number,             // Précision de convergence en K
    
    // Soleil
    'solar_intensity': number,       // Intensité solaire relative (1.0 = actuel)
    
    // Planète
    'planet_radius': number,         // Rayon de la planète en m (varie selon l'époque)
    'gravity': number,               // Gravité en m/s²
    
    // Atmosphère
    'total_atmosphere_mass_kg': number,  // Masse totale atmosphère en kg
    'co2_kg': number,                // Masse CO2 en kg
    'ch4_kg': number,                // Masse CH4 en kg
    'h2o_kg': number,                // Masse H2O en kg
    'o2_kg': number,                 // Masse O2 en kg
    'n2_kg': number,                 // Masse N2 en kg
    
    // Géothermie
    'geothermal_flux': number,       // Flux géothermique en W/m² (optionnel)
    'core_power_watts': number,      // Puissance totale du noyau en W (optionnel)
    'core_temperature': number,      // Température du noyau en K (optionnel, DEPRECATED)
    'geothermal_diffusion_factor': number,  // Facteur de diffusion (optionnel, DEPRECATED)
    
    // Événements
    'events': {
        'meteor': {
            'water_added_kg': number  // Masse d'eau ajoutée par météorite en kg
        },
        'tic_time': {
            'deltaTemp': number,      // Delta température par ticTime en K
            'geothermal_flux': {      // Flux géothermique variable (optionnel)
                'start': number,      // Valeur initiale en W/m²
                'end': number         // Valeur finale en W/m²
            }
        },
        'ice_meteorite': {           // (optionnel)
            'water_added_kg': number,
            'deltaTemp': number
        }
    }
}
```

## `ALL_DESC` - Descriptions

`ALL_DESC` a la même structure que `ALL_DATA`, mais contient les descriptions (strings) au lieu des valeurs :

```javascript
window.ALL_DESC = {
    ENABLED_STATES: {
        'H2O_EDS': 'H2O EDS on/off',
        'CH4_EDS': 'CH4 EDS on/off',
        'CO2_EDS': 'CO2 EDS on/off',
        'ALBEDO': 'Albedo on/off',
        'ANIMATION': 'Animation on/off'
    },
    DATE_CONFIG: {
        'OLD_T0': 'old_T0 (backup t°)',
        'T0_CONFIG': 'T0 attendu (t° config)',
        'METEORITE_COUNT': 'Nombre de météore',
        // ... etc
    },
    // ... même structure que ALL_DATA
};
```

## Notes importantes

1. **Clés logo vs valeurs** : Les propriétés de `ALL_DATA` sont initialement des clés logo (strings comme `'🐳🏭'`), puis sont remplacées par les valeurs réelles (numbers, booleans, etc.) lors des calculs.

2. **Accès direct** : Utiliser `ALL_DATA.CATEGORY.KEY` directement, pas `ALL_DATA[CATEGORY.KEY.key]`.

3. **Pas de fallback** : Ne pas utiliser `||` pour les valeurs par défaut. L'application doit planter si une valeur est `undefined`.

4. **Source unique** : `ALL_DATA` est la source unique de vérité. Tous les calculs lisent depuis et écrivent dans `ALL_DATA`.

5. **Wrappers** : Au début de chaque fonction, utiliser :
   ```javascript
   const ALL_DATA = window.ALL_DATA;
   const ALL_DESC = window.ALL_DESC;
   ```

6. **EPOCH dynamique** : `ALL_DATA.EPOCH` est mis à jour quand l'utilisateur change d'époque. Il contient toutes les données de configuration de l'époque courante.

