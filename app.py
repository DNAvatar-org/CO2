#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Application Flask - Interface web complète avec calculs en JavaScript
Tous les calculs et graphiques sont maintenant en JavaScript
"""

from flask import Flask, render_template, send_from_directory

app = Flask(__name__, static_folder='static')

@app.route('/')
def index():
    """Page principale avec l'interface web complète"""
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Servir les fichiers statiques (JS, CSS)"""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    print("Démarrage du serveur Flask sur http://localhost:5000")
    print("Tous les calculs sont maintenant en JavaScript dans le navigateur")
    print("Ouvrez votre navigateur et allez sur http://localhost:5000")
    app.run(debug=True, port=5000, use_reloader=False)

