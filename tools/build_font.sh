#!/bin/bash
# Génération de la police CO2CustomIcons. À lancer depuis la racine du projet.
# Les scripts Python sont dans tools/, les fichiers générés vont dans fonts/.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🔧 Vérification de FontForge..."
if ! command -v fontforge >/dev/null 2>&1; then
    echo "⚠️  FontForge non installé"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        command -v brew >/dev/null 2>&1 && brew install fontforge || { echo "❌ Homebrew requis: https://brew.sh/"; exit 1; }
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        (command -v apt-get >/dev/null 2>&1 && sudo apt-get update && sudo apt-get install -y fontforge) || \
        (command -v yum >/dev/null 2>&1 && sudo yum install -y fontforge) || { echo "❌ Gestionnaire de paquets non reconnu"; exit 1; }
    else
        echo "❌ OS non supporté: $OSTYPE"; exit 1
    fi
fi
echo "✅ FontForge installé"

echo "📄 Génération du script FontForge et du mapping..."
if [ ! -f "tools/generate_font_auto.sfd" ]; then
    python3 tools/create_custom_font.py
fi

echo "🎨 Création de la police TTF..."
cd fonts
fontforge -script ../tools/generate_font_auto.sfd
cd "$ROOT"

if [ -f "fonts/CO2CustomIcons.ttf" ]; then
    echo "✅ Police générée: fonts/CO2CustomIcons.ttf ($(ls -lh fonts/CO2CustomIcons.ttf | awk '{print $5}'))"
else
    echo "⚠️  Échec de la génération. Vérifier les erreurs ci-dessus."
    exit 1
fi
