# Audit window. + minuscule (convention : MAJUSCULE = objet, pas scalaire)

Pour lister toutes les utilisations de `window.` suivi d’un identifiant **en minuscule** (ou camelCase commençant par minuscule), utiliser :

## Regex (JavaScript / ripgrep)

```regex
window\.[a-z][a-zA-Z0-9_]*
```

- `window\.` : littéral
- `[a-z]` : première lettre **minuscule** (exclut PLOT_AXIS_X_PX, DATA, CONST…)
- `[a-zA-Z0-9_]*` : suite alphanumérique ou underscore

## Exemples de commandes

**ripgrep (rg) :**
```bash
rg 'window\.[a-z][a-zA-Z0-9_]*' --glob '*.js' -o
```

**grep :**
```bash
grep -Eon 'window\.[a-z][a-zA-Z0-9_]*' **/*.js
```

**Avec chemins (depuis la racine du projet) :**
```bash
grep -rn 'window\.[a-z][a-zA-Z0-9_]*' /chemin/vers/CO2 --include='*.js'
```

## Note

Certains `window.xxx` en minuscule sont légitimes (ex. API exposée volontairement en minuscule). L’audit sert à repérer ceux qui devraient être une propriété d’un objet MAJUSCULE (ex. `window.FLUX.plotAxisXPx` au lieu de `window.plotAxisXPx`).
