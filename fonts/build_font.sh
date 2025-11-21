#!/bin/bash
# Script pour installer FontForge et générer la police TTF automatiquement

set -e

echo "🔧 Vérification de FontForge..."

if ! command -v fontforge >/dev/null 2>&1; then
    echo "⚠️  FontForge non installé"
    echo "📦 Installation de FontForge..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew >/dev/null 2>&1; then
            brew install fontforge
        else
            echo "❌ Homebrew non installé. Installez-le depuis https://brew.sh/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get >/dev/null 2>&1; then
            sudo apt-get update
            sudo apt-get install -y fontforge
        elif command -v yum >/dev/null 2>&1; then
            sudo yum install -y fontforge
        else
            echo "❌ Gestionnaire de paquets non reconnu"
            exit 1
        fi
    else
        echo "❌ Système d'exploitation non supporté: $OSTYPE"
        exit 1
    fi
fi

echo "✅ FontForge installé"
echo "📝 Génération de la police..."

# Aller dans le répertoire fonts
cd "$(dirname "$0")"

# Générer le script FontForge automatique si nécessaire
if [ ! -f "generate_font_auto.sfd" ]; then
    echo "📄 Génération du script FontForge..."
    python3 create_custom_font.py
fi

# Exécuter FontForge
echo "🎨 Création de la police TTF..."
fontforge -script generate_font_auto.sfd

if [ -f "CO2CustomIcons.ttf" ]; then
    echo "✅ Police générée avec succès: CO2CustomIcons.ttf"
    echo "📊 Taille: $(ls -lh CO2CustomIcons.ttf | awk '{print $5}')"
    echo ""
    echo "💡 Vous pouvez maintenant:"
    echo "   1. Ouvrir CO2CustomIcons.ttf dans FontForge pour modifier les glyphes"
    echo "   2. Utiliser la police dans votre projet avec @font-face"
    echo "   3. Voir le mapping dans CO2CustomIcons_mapping.json"
else
    echo "⚠️  La police n'a pas été générée. Vérifiez les erreurs ci-dessus."
    exit 1
fi

