# File: CO2/scripts/bench_headless/reprise.py
# Desc: Reprise d'une chaîne arrêtée (quaternaire_chaine.js) : lit la sortie de run.py (lignes « § » du flux __Q__), prend le
#       dernier état gardé ({ reprise } : DATA et puits au départ d'un clic) et écrit sur la sortie standard la même sonde
#       précédée de window.__REPRISE__ — elle repart de ce clic au lieu de refaire la chaîne depuis la frise.
#       Usage : python3 reprise.py q.out q.js > q2.js ; python3 run.py q2.js --var __PROG__ --stream __Q__ --timeout 7200 > q2.out
# Version 1.0.0
# Date: [November 15, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import json, sys

dernier = None
n = 0
for ligne in open(sys.argv[1], encoding='utf-8'):
    if ligne.startswith('§'):
        el = json.loads(ligne[1:])
        if 'reprise' in el:
            dernier = el['reprise']
        else:
            n += 1
if dernier is None:
    raise SystemExit('aucun état gardé dans ' + sys.argv[1])
p = dernier['DATA']['📜']
sys.stderr.write('reprise : chaîne %s, époque %s, %d points déjà écrits\n' % (dernier['chaine'], p['🗿'], n))
sys.stdout.write('window.__REPRISE__=' + json.dumps(dernier, ensure_ascii=False) + ';\n')
sys.stdout.write(open(sys.argv[2], encoding='utf-8').read())
