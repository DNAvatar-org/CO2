# Système de boutons ergonomiques (ergo_button)

Système réutilisable de boutons circulaires avec états `checked`/`selected`/`unselected` et effets visuels.

## Installation

Ajoutez les fichiers CSS et JS dans votre HTML :

```html
<link rel="stylesheet" href="static/ergo_button.css">
<script src="static/ergo_button.js"></script>
```

## Structure HTML requise

```html
<div class="ergo-button-cell" id="my-button">
    <div class="ergo-button-circle" style="width: 50px; height: 50px;">
        <!-- Votre contenu (logo, emoji, etc.) -->
        <span style="font-size: 32px;">🌱</span>
    </div>
    <!-- Autres éléments (labels, etc.) -->
</div>
```

**Important** :
- La cellule doit avoir la classe `ergo-button-cell`
- Le cercle cliquable doit avoir la classe `ergo-button-circle`
- Le cercle doit avoir une taille définie (width/height) et être positionné en `absolute`

## Utilisation JavaScript

### Initialisation basique

```javascript
initErgoButtons();
```

### Initialisation avec options

```javascript
initErgoButtons({
    cellSelector: '.ergo-button-cell',  // Sélecteur des cellules (défaut)
    circleSelector: '.ergo-button-circle',  // Sélecteur des cercles (défaut)
    checkedByDefault: true,  // Boutons checked par défaut (défaut: false)
    onToggle: function(checked, cell, event) {
        // Callback appelé lors du toggle
        console.log('Bouton', cell.id, 'est maintenant', checked ? 'checked' : 'unchecked');
    },
    onInit: function(cell, isChecked) {
        // Callback appelé lors de l'initialisation
        console.log('Bouton', cell.id, 'initialisé, checked:', isChecked);
    }
});
```

### Fonctions utilitaires

```javascript
// Vérifier si un bouton est checked
const isChecked = isErgoButtonChecked(cell);

// Définir l'état checked
setErgoButtonChecked(cell, true);  // checked
setErgoButtonChecked(cell, false); // unchecked

// Toggle l'état
const newState = toggleErgoButton(cell);
```

## États CSS

- **Par défaut** : Bouton gris avec contour blanc
- **`.checked`** : Bouton coloré avec contour vert (glow)
- **`.selected`** : Identique à `.checked` (pour compatibilité)
- **`.unselected`** : Bouton gris (état par défaut)

## Effets visuels

- **Hover sur unselected** : Le bouton passe en couleur (contour blanc reste)
- **Hover sur checked/selected** : Le bouton passe en noir et blanc (contour vert reste)
- **Transition** : Animations fluides (0.3s ease)

## Exemple complet

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="static/ergo_button.css">
</head>
<body>
    <div class="ergo-button-cell" id="btn-co2" style="position: relative; width: 100px; height: 100px;">
        <div class="ergo-button-circle" style="width: 50px; height: 50px; top: 25px; left: 25px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">🌱</span>
        </div>
        <div style="position: absolute; bottom: 0; left: 0; right: 0; text-align: center;">CO₂</div>
    </div>

    <script src="static/ergo_button.js"></script>
    <script>
        initErgoButtons({
            checkedByDefault: true,
            onToggle: function(checked, cell) {
                console.log('CO2 button toggled:', checked);
            }
        });
    </script>
</body>
</html>
```

## Notes

- Le système utilise `pointer-events` pour limiter la zone cliquable au cercle uniquement
- Les enfants du cercle ont `pointer-events: none` pour éviter les conflits
- Le cercle doit être positionné en `absolute` pour fonctionner correctement
- Les transitions CSS sont gérées automatiquement

