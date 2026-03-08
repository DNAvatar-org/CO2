#!/usr/bin/env python3
# Lance le serveur HTTP sur le port 8000 (http://localhost:8000/index.html)
import http.server
import socketserver
import os

PORT = 8000
# Servir depuis le répertoire du script (racine du projet)
os.chdir(os.path.dirname(os.path.abspath(__file__)))
Handler = http.server.SimpleHTTPRequestHandler

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("Serveur sur http://localhost:{}/".format(PORT))
        httpd.serve_forever()
