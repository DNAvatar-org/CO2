#!/usr/bin/env python3
# File: create_custom_font.py - Créer une police TTF personnalisée avec les emojis
# Desc: Script pour créer une police TTF avec les emojis du projet dans la plage Private Use Area
# Version 1.0.0
# Copyright 2025 DNAvatar.org - Arnaud Maignan
# Licensed under Apache License 2.0 with Commons Clause.
# See https://commonsclause.com/ for full terms.
# Date: [January 2025]
# Logs:
#   - Initial creation: extract emojis and create TTF font
#   - 🌿 → paleozoic, 🥟 → proterozoic ; ❄️ → quaternary (noms glyphes police)

import re
import json
from pathlib import Path
from collections import OrderedDict

# Script dans tools/ ; lecture projet, écriture fonts/ et tools/ (scripts .sfd)
ROOT = Path(__file__).resolve().parent.parent
FONTS_DIR = ROOT / 'fonts'
TOOLS_DIR = ROOT / 'tools'

# Plage Private Use Area: U+E000 à U+F8FF (6144 caractères disponibles)
PUA_START = 0xE000

def extract_emojis_from_codebase():
    """Extrait tous les emojis uniques du codebase avec leurs noms descriptifs"""
    emojis = OrderedDict()
    
    # Dictionnaire de mapping emoji -> nom anglais (sera enrichi depuis le code)
    emoji_names = {
        # Époques géologiques
        '⚫': 'black_body',
        '🌕': 'hadean',
        '🦠': 'archean',
        '🥟': 'proterozoic',
        '🌿': 'paleozoic',
        '❄️': 'quaternary',
        '🦕': 'mesozoic',
        '🦣': 'cenozoic',
        '🌈': 'today',
        # Diagramme de flux
        '🌞': 'sun',
        '🎱': 'geometry',
        '🏐': 'albedo',
        '🛰': 'space',
        '🌍': 'surface',
        '🌕': 'core',
        '🫁': 'atmosphere',
        '🌵': 'co2',
        '💧': 'h2o',
        '🐄': 'methane',
        '🔂': 'reemitted',
        '📛': 'radiative_forcing',
        # Boutons
        '🌋': 'volcano',
        '☄️': 'comet',
        # Interface
        '🌡️': 'temperature',
        '🎛️': 'controls',
        '🎚': 'gauges',
        '🔘': 'button',
        '📅': 'date',
    }
    
    # Emojis depuis logos.txt avec noms depuis le fichier
    logos_file = ROOT / 'doc' / 'logos.txt'
    if logos_file.exists():
        content = logos_file.read_text(encoding='utf-8')
        emoji_pattern = re.compile(r'([\U0001F300-\U0001F9FF\U00002600-\U000027BF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002700-\U000027BF]+)\s+([A-Za-z0-9\s]+)')
        for match in emoji_pattern.finditer(content):
            emoji = match.group(1)
            label = match.group(2).strip()
            if emoji not in emojis:
                # Convertir le label en nom de variable (snake_case)
                name = re.sub(r'[^A-Za-z0-9]+', '_', label.lower()).strip('_')
                emoji_names[emoji] = name
                emojis[emoji] = {
                    'name': name,
                    'label': label,
                    'original': emoji,
                    'unicode': [ord(c) for c in emoji],
                    'source': 'logos.txt'
                }
    
    # Emojis depuis geology.js avec noms depuis les commentaires
    geology_file = ROOT / 'static' / 'geology.js'
    if geology_file.exists():
        content = geology_file.read_text(encoding='utf-8')
        # Pattern: emoji: '🌕', // Comment ou name: 'Hadéen'
        pattern = re.compile(r"emoji:\s*'([^']+)'[^/]*//\s*([^\n]+)|name:\s*'([^']+)'[^e]*emoji:\s*'([^']+)'")
        for match in pattern.finditer(content):
            if match.group(1):  # Format emoji: '🌕', // comment
                emoji = match.group(1)
                comment = match.group(2).strip()
                if emoji not in emojis:
                    # Extraire le nom de l'époque depuis le commentaire ou le contexte
                    epoch_name_match = re.search(r"name:\s*'([^']+)'", content[:match.start()][-200:])
                    if epoch_name_match:
                        epoch_name = epoch_name_match.group(1)
                        name = re.sub(r'[^A-Za-z0-9]+', '_', epoch_name.lower()).strip('_')
                    else:
                        name = emoji_names.get(emoji, f'epoch_{len(emojis)}')
                    emojis[emoji] = {
                        'name': name,
                        'label': comment if comment else epoch_name if 'epoch_name' in locals() else '',
                        'original': emoji,
                        'unicode': [ord(c) for c in emoji],
                        'source': 'geology.js'
                    }
    
    # Emojis depuis configOrganigramme.js avec noms depuis id et tooltip
    config_file = ROOT / 'organigramme' / 'configOrganigramme.js'
    if config_file.exists():
        content = config_file.read_text(encoding='utf-8')
        # Pattern: id: 'soleil', logo: '🌞', ... tooltip: 'Soleil'
        pattern = re.compile(r"id:\s*'([^']+)'[^l]*logo:\s*'([^']+)'[^t]*tooltip:\s*'([^']*)'")
        for match in pattern.finditer(content):
            node_id = match.group(1)
            emoji = match.group(2)
            tooltip = match.group(3)
            if emoji not in emojis:
                name = node_id  # Utiliser l'id comme nom
                emojis[emoji] = {
                    'name': name,
                    'label': tooltip if tooltip else node_id,
                    'original': emoji,
                    'unicode': [ord(c) for c in emoji],
                    'source': 'configOrganigramme.js'
                }
            elif 'source' in emojis[emoji] and emojis[emoji]['source'] == 'logos.txt':
                # Mettre à jour avec l'id si plus spécifique
                emojis[emoji]['name'] = node_id
    
    # Emojis depuis index.html avec noms depuis title et data-epoch
    index_file = ROOT / 'index.html'
    if index_file.exists():
        content = index_file.read_text(encoding='utf-8')
        # Pattern: title="..." ou data-epoch="..." suivi de l'emoji
        patterns = [
            (r'title="([^"]*)"[^>]*>([\U0001F300-\U0001F9FF\U00002600-\U000027BF]+)<', 'title'),
            (r'data-epoch="([^"]*)"[^>]*>([\U0001F300-\U0001F9FF\U00002600-\U000027BF]+)<', 'epoch'),
        ]
        for pattern, attr_type in patterns:
            for match in re.finditer(pattern, content):
                attr_value = match.group(1)
                emoji = match.group(2)
                if emoji not in emojis:
                    name = re.sub(r'[^A-Za-z0-9]+', '_', attr_value.lower()).strip('_')
                    emojis[emoji] = {
                        'name': name,
                        'label': attr_value,
                        'original': emoji,
                        'unicode': [ord(c) for c in emoji],
                        'source': f'index.html ({attr_type})'
                    }
                elif 'name' not in emojis[emoji] or emojis[emoji]['name'].startswith(('emoji_', 'epoch_', 'logo_', 'ui_')):
                    # Améliorer le nom si générique
                    name = re.sub(r'[^A-Za-z0-9]+', '_', attr_value.lower()).strip('_')
                    emojis[emoji]['name'] = name
                    emojis[emoji]['label'] = attr_value
    
    # Assigner des noms par défaut pour les emojis sans nom
    for emoji, info in emojis.items():
        if 'name' not in info or info['name'].startswith(('emoji_', 'epoch_', 'logo_', 'ui_')):
            # Utiliser le mapping par défaut ou générer un nom
            if emoji in emoji_names:
                info['name'] = emoji_names[emoji]
            else:
                # Nom générique basé sur l'unicode
                info['name'] = f'icon_{info["unicode"][0]:04X}'
    
    return emojis

def create_font_mapping(emojis):
    """Crée un mapping des emojis vers la plage Private Use Area"""
    mapping = {}
    current_pua = PUA_START
    
    for emoji, info in emojis.items():
        # Assigner un code PUA pour chaque emoji
        pua_code = current_pua
        mapping[emoji] = {
            'pua': pua_code,
            'pua_hex': f'U+{pua_code:04X}',
            'pua_char': chr(pua_code),
            'name': info['name'],
            'original': emoji,
            'original_unicode': info['unicode']
        }
        current_pua += 1
        
        # Vérifier qu'on ne dépasse pas la plage PUA
        if current_pua > 0xF8FF:
            print(f"⚠️  Attention: Plus de place dans la plage PUA!")
            break
    
    return mapping

def generate_fontforge_script(mapping, output_file):
    """Génère un script FontForge pour créer la police"""
    script_content = f"""# FontForge script généré automatiquement
# File: generate_font.sfd
# Pour créer la police: fontforge -script generate_font.sfd

# Créer une nouvelle police
New()

# Définir les métadonnées
SetFontNames("CO2CustomIcons", "CO2 Custom Icons", "Regular", "Regular", "DNAvatar.org", "2025")
SetTTFName(0x409, 1, "CO2 Custom Icons")
SetTTFName(0x409, 2, "Regular")
SetTTFName(0x409, 4, "CO2 Custom Icons Regular")
SetTTFName(0x409, 6, "CO2CustomIcons-Regular")

# Pour chaque emoji, créer un glyphe dans la plage PUA
"""
    
    for emoji, info in mapping.items():
        pua_code = info['pua']
        pua_hex = info['pua_hex']
        name = info['name']
        original_emoji = info['original']
        
        script_content += f"""
# Emoji: {original_emoji} -> {pua_hex} ({name})
NewGlyph({pua_code})
Select({pua_code})
GlyphInfo("Unicode", {pua_code})
# Note: Il faudra importer manuellement le glyphe SVG pour {original_emoji}
# ou utiliser Select({pua_code}) puis Paste() après avoir copié l'emoji depuis une autre police
"""
    
    script_content += """
# Générer la police TTF
Generate("CO2CustomIcons.ttf")
Save("CO2CustomIcons.sfd")
"""
    
    output_path = TOOLS_DIR / output_file
    output_path.write_text(script_content, encoding='utf-8')
    print(f"✅ Script FontForge généré: {output_path}")

def generate_mapping_json(mapping, output_file):
    """Génère un fichier JSON avec le mapping emoji -> PUA"""
    json_data = {
        'font_name': 'CO2CustomIcons',
        'pua_start': f'U+{PUA_START:04X}',
        'mapping': {}
    }
    
    for emoji, info in mapping.items():
        json_data['mapping'][emoji] = {
            'pua': info['pua_hex'],
            'pua_char': info['pua_char'],
            'name': info['name'],
            'original_unicode': [f'U+{u:04X}' for u in info['original_unicode']]
        }
    
    output_path = FONTS_DIR / output_file
    output_path.write_text(json.dumps(json_data, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"✅ Mapping JSON généré: {output_path}")

def generate_css_fallback(mapping, output_file):
    """Génère un fichier CSS avec les fallbacks pour utiliser la police"""
    css_content = """/* CSS pour utiliser la police personnalisée CO2CustomIcons */
/* Les emojis sont mappés dans la plage Private Use Area (U+E000-U+F8FF) */

@font-face {
    font-family: 'CO2CustomIcons';
    src: url('CO2CustomIcons.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    unicode-range: U+E000-U+F8FF; /* Plage Private Use Area */
}

/* Classes utilitaires pour chaque emoji */
"""
    
    for emoji, info in mapping.items():
        pua_char = info['pua_char']
        name = info['name']
        css_content += f"""
.icon-{name}::before {{
    font-family: 'CO2CustomIcons';
    content: '{pua_char}';
    /* Fallback vers l'emoji original si la police n'est pas chargée */
}}
"""
    
    output_path = FONTS_DIR / output_file
    output_path.write_text(css_content, encoding='utf-8')
    print(f"✅ CSS de fallback généré: {output_path}")

def main():
    print("🔍 Extraction des emojis du codebase...")
    emojis = extract_emojis_from_codebase()
    print(f"✅ {len(emojis)} emojis uniques trouvés:")
    for i, emoji in enumerate(emojis.keys(), 1):
        print(f"  {i}. {emoji}")
    
    print("\n📝 Création du mapping vers Private Use Area...")
    mapping = create_font_mapping(emojis)
    print(f"✅ Mapping créé pour {len(mapping)} emojis")
    
    print("\n📄 Génération des fichiers...")
    generate_mapping_json(mapping, 'CO2CustomIcons_mapping.json')
    generate_fontforge_script(mapping, 'generate_font_auto.sfd')
    generate_css_fallback(mapping, 'CO2CustomIcons.css')
    
    print("\n✅ Terminé!")
    print("\n📋 Prochaines étapes:")
    print("  1. Installer FontForge: brew install --cask fontforge (macOS)")
    print("  2. Exécuter le script automatique: ./tools/build_font.sh (depuis la racine du projet)")
    print("     OU manuellement: cd fonts && fontforge -script generate_font_auto.sfd")
    print("  3. La police CO2CustomIcons.ttf sera générée dans fonts/")
    print(f"\n💡 Le mapping est disponible dans: CO2CustomIcons_mapping.json")

if __name__ == '__main__':
    main()

