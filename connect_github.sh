#!/bin/bash
# Script pour connecter le repo local à GitHub
# Usage: ./connect_github.sh VOTRE-USERNAME

if [ -z "$1" ]; then
    echo "❌ Usage: ./connect_github.sh VOTRE-USERNAME"
    echo "   Exemple: ./connect_github.sh dnavatar"
    exit 1
fi

USERNAME=$1
REPO_NAME="RadiativeForcing"

echo "🔗 Connexion au repo GitHub..."
echo "   URL: https://github.com/$USERNAME/$REPO_NAME.git"
echo ""

# Vérifier si le remote existe déjà
if git remote get-url origin 2>/dev/null; then
    echo "⚠️  Un remote 'origin' existe déjà."
    read -p "Voulez-vous le remplacer ? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        git remote remove origin
    else
        echo "❌ Annulé."
        exit 1
    fi
fi

# Ajouter le remote
git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git"

echo "✅ Remote ajouté !"
echo ""
echo "📤 Pour pousser le code, exécutez :"
echo "   git push -u origin main"
echo ""
echo "💡 Ou utilisez GitHub Desktop : File → Add Local Repository → Publish"

