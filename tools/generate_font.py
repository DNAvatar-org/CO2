#!/usr/bin/env python3
# File: generate_font.py - Générer la police CO2CustomIcons avec FontForge
# Desc: Script Python pour créer la police TTF avec les emojis dans la plage PUA
# Version 1.0.0
# Copyright 2025 DNAvatar.org - Arnaud Maignan
# Licensed under Apache License 2.0 with Commons Clause.
# See LICENSE_HEADER.txt for full terms.
# Date: [January 2025]
# Logs:
#   - Initial creation: generate TTF font with FontForge Python API

import fontforge
import json
from pathlib import Path

# Script dans tools/ ; données et sortie dans fonts/
FONTS_DIR = Path(__file__).resolve().parent.parent / 'fonts'
mapping_file = FONTS_DIR / 'CO2CustomIcons_mapping.json'
with open(mapping_file, 'r', encoding='utf-8') as f:
    mapping_data = json.load(f)

# Créer une nouvelle police
font = fontforge.font()

# Définir les métadonnées
font.fontname = "CO2CustomIcons-Regular"
font.familyname = "CO2 Custom Icons"
font.fullname = "CO2 Custom Icons Regular"
font.copyright = "Copyright 2025 DNAvatar.org - Arnaud Maignan"

# Pour chaque emoji dans le mapping
for emoji, info in mapping_data['mapping'].items():
    pua_code = int(info['pua'], 16)  # Convertir U+E000 en 57344
    name = info['name']
    
    # Créer le glyphe
    glyph = font.createChar(pua_code, name)
    glyph.unicode = pua_code
    
    # Le glyphe sera vide - à remplir manuellement ou depuis une police source
    print(f"✅ Créé glyphe {name} (U+{info['pua']}) pour {emoji}")

# Générer la police TTF
output_file = FONTS_DIR / 'CO2CustomIcons.ttf'
font.generate(str(output_file))
print(f"\n✅ Police générée: {output_file}")

# Sauvegarder aussi le fichier SFD
sfd_file = FONTS_DIR / 'CO2CustomIcons.sfd'
font.save(str(sfd_file))
print(f"✅ Fichier SFD sauvegardé: {sfd_file}")

