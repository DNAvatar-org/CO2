#!/usr/bin/env python3
# File: tools/server.py - Serveur HTTP sur le port 8000 (http://localhost:8000/index.html)
# Desc: Sert le projet. Sans COOP/COEP pour permettre scripts/fonts cross-origin (signature, Plotly CDN).
#       Workers utilisent Transferable, pas SharedArrayBuffer → pas besoin de COEP.
# Version 1.2.0
# Copyright 2025 DNAvatar.org - Arnaud Maignan
# Licensed under Apache License 2.0 with Commons Clause.
# Date: March 08, 2026
# Logs:
# - v1.1.0 Add Cross-Origin-Opener-Policy + Cross-Origin-Embedder-Policy headers for SharedArrayBuffer
# - v1.2.0 Retrait COOP/COEP : bloque scripts externes (dnavatar.org, cdn.plot.ly) ; workers = Transferable
import http.server
import socketserver
import os

PORT = 8000
# Servir depuis la racine du projet (répertoire parent de tools/)
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(_root)

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        print("Serveur sur http://localhost:{}/ (racine: {})".format(PORT, _root))
        httpd.serve_forever()
