#!/usr/bin/env python3
# File: tools/server.py - Serveur HTTP sur le port 8000 (http://localhost:8000/index.html)
# Lance depuis la racine du projet (répertoire parent de tools/)
import http.server
import socketserver
import os

PORT = 8000
# Servir depuis la racine du projet (répertoire parent de tools/)
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(_root)
Handler = http.server.SimpleHTTPRequestHandler

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("Serveur sur http://localhost:{}/ (racine: {})".format(PORT, _root))
        httpd.serve_forever()
