#!/usr/bin/env python3
# File: CO2/scripts/bench_headless/courbe_modele.py
# Desc: Lance courbe_modele.js dans le banc headless et écrit CO2/static/histoire/courbe_modele.js
#       (la courbe du MODÈLE affichée par CO2/histoire.html à côté de celle de la littérature).
#       À relancer après tout changement de physique ou de config : la page affiche la date et le bary.
# Version 1.0.0
# Date: 2026-09-23
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import json, os, subprocess, sys, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, '..', '..', 'static', 'histoire', 'courbe_modele.js'))
r = subprocess.run([sys.executable, os.path.join(HERE, 'run.py'), 'courbe_modele.js', '--var', '__COURBE__', '--timeout', '5000'],
                   capture_output=True, text=True, cwd=os.path.join(HERE, '..', '..'))
txt = r.stdout
if 'ERREUR' in txt or '{' not in txt:
    sys.stderr.write(txt[-3000:] + r.stderr[-2000:]); sys.exit(1)
data = json.loads(txt[txt.index('\n{') + 1:] if '\n{' in txt else txt[txt.index('{'):])
data['genere'] = datetime.date.today().isoformat()
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('// File: CO2/static/histoire/courbe_modele.js\n'
            '// Desc: COURBE DU MODÈLE — ENGENDRÉE par CO2/scripts/bench_headless/courbe_modele.py, ne pas éditer.\n'
            '//       Chaîne de clics de l\'interface (T° conservée d\'une époque à l\'autre), t en années avant 2025.\n'
            '// Copyright 2026 DNAvatar.org - Arnaud Maignan\n'
            'window.HISTOIRE = window.HISTOIRE || {};\n'
            'window.HISTOIRE.modele = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
print('✅', os.path.relpath(OUT), len(data['points']), 'points, bary', data['bary'])
