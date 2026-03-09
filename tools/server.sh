#!/usr/bin/env bash
# Lance le serveur HTTP depuis la racine du projet (répertoire parent de tools/)
# Usage: ./tools/server.sh  ou  depuis la racine: bash tools/server.sh
# Ex. http://localhost:8000/index.html
cd "$(dirname "$0")/.." && python3 -m http.server 8000
