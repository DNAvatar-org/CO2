#!/usr/bin/env python3
# File: CO2/scripts/bench_headless/courbe_modele.py
# Desc: Joue la chaîne de clics du modèle dans le banc headless et en garde l'historique, pour que
#       CO2/histoire.html n'ait RIEN à recalculer au chargement. Deux modes :
#         python3 CO2/scripts/bench_headless/courbe_modele.py          (= clics)
#             frise ⚫ puis que des tictimes, l'état arrive d'une époque à l'autre
#             → CO2/static/histoire/courbe_modele.js        (window.HISTOIRE.modele)
#             → _logs/courbe_clics.tsv (au fil de l'eau)
#         python3 CO2/scripts/bench_headless/courbe_modele.py frise
#             à chaque époque : clic sur la frise (graine), puis ses tictimes
#             → CO2/static/histoire/courbe_modele_frise.js  (window.HISTOIRE.modeleFrise)
#             → _logs/courbe_frise.tsv (au fil de l'eau)
#       Le journal _logs/courbe_<mode>.tsv est supprimé au début de chaque lancement (nouvelle session), puis
#       écrit UNE LIGNE PAR CLIC dès qu'il est calculé ; recréé (avec son en-tête) s'il disparaît en route.
#       À relancer après tout changement de physique ou de config (le code n'est pas figé).
# Version 1.2.0
# Date: 2026-09-24
# logs :
#   - v1.2.0: avancement affiché en direct ; journal TSV dans _logs/, écrit ligne à ligne pendant le calcul.
#   - v1.1.0: mode frise ; journal TSV lisible (un clic par ligne, ordre chronologique).
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import json, os, subprocess, sys, datetime, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
MODE = sys.argv[1] if len(sys.argv) > 1 else 'clics'
if MODE not in ('clics', 'frise'):
    sys.exit('mode inconnu : ' + MODE + ' (clics | frise)')
HIST = os.path.abspath(os.path.join(HERE, '..', '..', 'static', 'histoire'))
OUT_JS = os.path.join(HIST, 'courbe_modele.js' if MODE == 'clics' else 'courbe_modele_frise.js')
VAR = 'modele' if MODE == 'clics' else 'modeleFrise'
OUT_TSV = os.path.abspath(os.path.join(HERE, '..', '..', '..', '_logs', 'courbe_' + MODE + '.tsv'))

COLS = [('t_Ma', lambda p: '%.6g' % (p['t'] / 1e6)), ('epoque', lambda p: p['ep']), ('mode', lambda p: p['mode']),
        ('clic', lambda p: p.get('cle') or ''), ('dt_Ma', lambda p: '' if p.get('dt') is None else '%.6g' % p['dt']),
        ('T_C', lambda p: '%.2f' % p['T']), ('glace', lambda p: '%.3f' % p['glace']), ('CO2_ppm', lambda p: '%.1f' % p['ppm']),
        ('T_interieur_C', lambda p: '' if p['Tint'] is None else '%.1f' % p['Tint']), ('flux_W_m2', lambda p: '%.4g' % p['geo']),
        ('P_TW', lambda p: '%.2f' % p['TW']), ('statut', lambda p: p['st']), ('etape', lambda p: p['etape'])]
ENTETE = '# ' + MODE + ' — ' + datetime.datetime.now().isoformat(timespec='seconds') + '\n' + '\t'.join(c for c, _ in COLS) + '\n'

def journal(p):
    """Une ligne par clic, tout de suite. Fichier (et dossier) recréés s'ils manquent."""
    os.makedirs(os.path.dirname(OUT_TSV), exist_ok=True)
    neuf = not os.path.exists(OUT_TSV)
    with open(OUT_TSV, 'a', encoding='utf-8') as f:
        if neuf:
            f.write(ENTETE)
        f.write('\t'.join(g(p) for _, g in COLS) + '\n')

if os.path.exists(OUT_TSV):
    os.remove(OUT_TSV)
print('📝', os.path.relpath(OUT_TSV), '— une ligne par clic, au fil de l\'eau', flush=True)

js = "window.__MODE__ = '" + MODE + "';\n" + open(os.path.join(HERE, 'courbe_modele.js'), encoding='utf-8').read()
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
    f.write(js); tmp = f.name
# Sortie de run.py lue au fil de l'eau : « … » = époque et clic en cours ; « § » = un clic calculé (JSON).
lignes = []
try:
    p = subprocess.Popen([sys.executable, '-u', os.path.join(HERE, 'run.py'), tmp, '--var', '__COURBE__',
                          '--timeout', '5000', '--stream', '__PASSAGES__'],
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=os.path.join(HERE, '..', '..'))
    for l in p.stdout:
        if l.startswith('…'):
            print(l.rstrip(), flush=True)
        elif l.startswith('§'):
            journal(json.loads(l[1:]))
        else:
            lignes.append(l)
    p.wait()
finally:
    os.unlink(tmp)
txt = ''.join(lignes)
if 'ERREUR' in txt or '{' not in txt:
    sys.stderr.write(txt[-3000:]); sys.exit(1)
data = json.loads(txt[txt.index('\n{') + 1:] if '\n{' in txt else txt[txt.index('{'):])
data['genere'] = datetime.date.today().isoformat()

with open(OUT_JS, 'w', encoding='utf-8') as f:
    f.write('// File: CO2/static/histoire/' + os.path.basename(OUT_JS) + '\n'
            '// Desc: COURBE DU MODÈLE (mode ' + MODE + ') — ENGENDRÉE par CO2/scripts/bench_headless/courbe_modele.py'
            + ('' if MODE == 'clics' else ' frise') + ', ne pas éditer.\n'
            '//       t en années avant 2025 ; un point par clic, dans l\'ordre chronologique.\n'
            '// Copyright 2026 DNAvatar.org - Arnaud Maignan\n'
            'window.HISTOIRE = window.HISTOIRE || {};\n'
            'window.HISTOIRE.' + VAR + ' = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
print('✅', os.path.relpath(OUT_JS), '+', os.path.relpath(OUT_TSV), '—', len(data['points']), 'points, bary', data['bary'])
