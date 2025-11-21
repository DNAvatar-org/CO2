# Police personnalisée CO2CustomIcons

Ce dossier contient tous les fichiers nécessaires pour créer et utiliser la police personnalisée avec les emojis du projet.

## Structure

```
fonts/
├── create_custom_font.py      # Script Python pour extraire les emojis et générer les fichiers
├── generate_font.sfd          # Script FontForge (version manuelle)
├── generate_font_auto.sfd     # Script FontForge (version automatique avec copie depuis police système)
├── build_font.sh              # Script bash pour installer FontForge et générer la police
├── README_FONT.md             # Documentation détaillée
├── CO2CustomIcons_mapping.json # Mapping des emojis vers les codes PUA
├── CO2CustomIcons.css         # CSS avec classes pour utiliser la police
├── CO2CustomIcons.ttf         # Police TTF générée (à créer)
└── CO2CustomIcons.sfd         # Fichier source FontForge (à créer)
```

## Utilisation rapide

### 1. Générer la police automatiquement

```bash
cd fonts
./build_font.sh
```

Ce script va :
- Installer FontForge si nécessaire
- Générer le script FontForge automatique
- Créer la police TTF avec les emojis copiés depuis une police système

### 2. Générer manuellement

```bash
cd fonts
python3 create_custom_font.py
fontforge -script generate_font_auto.sfd
```

### 3. Utiliser la police dans le projet

Une fois `CO2CustomIcons.ttf` généré, ajoutez dans `static/style.css` :

```css
@font-face {
    font-family: 'CO2CustomIcons';
    src: url('../fonts/CO2CustomIcons.ttf') format('truetype');
    unicode-range: U+E000-U+F8FF; /* Plage Private Use Area */
}
```

## Mapping des emojis

Le fichier `CO2CustomIcons_mapping.json` contient le mapping complet de chaque emoji vers son code dans la plage Private Use Area (U+E000-U+F8FF).

Exemple :
```json
{
  "🌵": {
    "pua": "U+E002",
    "pua_char": "󠀂",
    "name": "co2",
    "original_unicode": ["U+1F335"]
  }
}
```

## Modification des emojis

Pour modifier un emoji dans la police :

1. Ouvrir `CO2CustomIcons.sfd` dans FontForge
2. Sélectionner le glyphe correspondant (voir le mapping JSON)
3. Modifier le glyphe
4. Générer la police : `File > Generate Fonts > TTF`

## Notes

- Les emojis sont mappés dans la plage Private Use Area (6144 caractères disponibles)
- Actuellement, 33 emojis sont mappés
- Les noms sont en anglais et basés sur leur usage dans le code
- La police peut être partagée sans problème de compatibilité

