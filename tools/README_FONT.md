# Création d'une police TTF personnalisée avec les emojis

Ce script génère une police TTF personnalisée en copiant les emojis utilisés dans le projet vers la plage **Private Use Area** (U+E000 à U+F8FF).

## Fichiers générés

- `CO2CustomIcons_mapping.json` : Mapping des emojis vers les codes PUA (dans fonts/)
- `tools/generate_font.sfd` : Script FontForge version manuelle
- `tools/generate_font_auto.sfd` : Script FontForge généré par create_custom_font.py
- `CO2CustomIcons.css` : CSS avec les classes (dans fonts/)

## Utilisation avec FontForge

### 1. Installer FontForge

```bash
# macOS
brew install fontforge

# Linux
sudo apt-get install fontforge

# Windows
# Télécharger depuis https://fontforge.org/
```

### 2. Exécuter le script FontForge

```bash
cd fonts && fontforge -script ../tools/generate_font.sfd
# ou pour la version auto : fontforge -script ../tools/generate_font_auto.sfd
```

Cela créera une police de base avec les glyphes vides dans la plage PUA.

### 3. Remplir les glyphes avec les emojis

Ouvrir FontForge et pour chaque glyphe :

**Option A : Copier depuis une police système**
1. Ouvrir une police système qui contient l'emoji (ex: Apple Color Emoji, Noto Color Emoji)
2. Sélectionner le glyphe de l'emoji
3. Copier (Ctrl+C / Cmd+C)
4. Dans votre police, sélectionner le glyphe PUA correspondant
5. Coller (Ctrl+V / Cmd+V)

**Option B : Importer un SVG**
1. Exporter l'emoji en SVG depuis un outil en ligne
2. Dans FontForge, sélectionner le glyphe PUA
3. File > Import > Import SVG

### 4. Générer la police TTF

Dans FontForge :
1. File > Generate Fonts
2. Choisir TTF
3. Sauvegarder comme `CO2CustomIcons.ttf`

## Utilisation dans le projet

Une fois la police générée :

1. Placer `CO2CustomIcons.ttf` dans le dossier `static/`
2. Utiliser le CSS généré ou ajouter dans `style.css` :

```css
@font-face {
    font-family: 'CO2CustomIcons';
    src: url('../CO2CustomIcons.ttf') format('truetype');
    unicode-range: U+E000-U+F8FF;
}
```

3. Utiliser les classes CSS ou directement les caractères PUA :

```html
<!-- Avec classe CSS -->
<span class="icon-emoji_0">🏐</span>

<!-- Ou directement avec le caractère PUA -->
<span style="font-family: 'CO2CustomIcons';">󠀀</span>
```

## Mapping des emojis

Le fichier `CO2CustomIcons_mapping.json` contient le mapping complet :

```json
{
  "🏐": {
    "pua": "U+E000",
    "pua_char": "󠀀",
    "name": "emoji_0"
  },
  ...
}
```

## Avantages

- ✅ Tous les emojis dans une seule police
- ✅ Codes UTF-8 non utilisés (Private Use Area)
- ✅ Modifiable dans FontForge
- ✅ Contrôle total sur l'apparence
- ✅ Pas de dépendance aux polices système

## Notes

- La plage PUA (U+E000-U+F8FF) contient 6144 caractères disponibles
- Actuellement, 43 emojis sont mappés (beaucoup de place restante)
- Les emojis peuvent être modifiés individuellement dans FontForge
- La police peut être partagée sans problème de compatibilité

