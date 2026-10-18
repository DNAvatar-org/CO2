# File: CO2/scripts/ber90_tables.py
# Desc: Écrit static/astronomie_ber90.js (tables de la solution astronomique de Berger & Loutre 1991, ± 3 Ma) depuis
#       scripts/sources/berger_loutre1991_BER90.IN.gz — le fichier d'entrée de la solution, tel que distribué par le paquet
#       R palinsol 1.0 (M. Crucifix, UCLouvain ; CRAN, inst/extdata/BER90.IN.gz, https://github.com/mcrucifix/palinsol).
#       Seule source : relancer après l'avoir changé. Usage : python3 scripts/ber90_tables.py   (depuis CO2/ ; numpy)
#       Berger, A. & Loutre, M. F. (1991), Insolation values for the climate of the last 10 million years, Quaternary
#       Science Reviews, 10, 297-317, doi:10.1016/0277-3791(91)90033-Q
#
#       Fichier : une ligne d'en-tête (nombres de termes réservés, ε* 23,33340950°, ψ̄ 50,41726176 ″/an, ζ 1,60075265°), le
#       système d'excentricité (80 termes : M, g ″/an, β °), le système d'inclinaison (80, inutile ici), l'obliquité
#       (6320 termes : A ″, f ″/an, φ °, période) et la précession générale (9559 : F ″, f′ ″/an, δ °, période) — les
#       nombres réels de termes, rappelés en fin de fichier. Une ligne de l'obliquité y est coupée au milieu d'un nombre
#       (terme 2506 : « 96.6 » / « 74 ») : recollée.
#
#       TRONCATURE : les termes d'obliquité et de précession d'amplitude < SEUIL ″ sont écartés (calcul 5 fois plus rapide :
#       le graphe d'Histoire refait des centaines de points à chaque glisser). L'erreur introduite, contre la série
#       complète, est MESURÉE ici sur ± 3 Ma et écrite dans l'en-tête du fichier engendré.
# Version 1.0.0
# Copyright 2026 DNAvatar.org - Arnaud Maignan
# Date: [October 16, 2026]
import gzip
import json
import math
import pathlib

import numpy as np

ICI = pathlib.Path(__file__).resolve().parent
SOURCE = ICI / 'sources' / 'berger_loutre1991_BER90.IN.gz'
CIBLE = ICI.parent / 'static' / 'astronomie_ber90.js'
SEUIL = 0.5   # ″

lignes = gzip.open(SOURCE, 'rt', encoding='ascii').read().splitlines()
entete = lignes[0].split()
EPS_ETOILE, PSI_BAR, ZETA = float(entete[4]), float(entete[6]), float(entete[7])
excentricite = [[float(x) for x in l.split()[1:4]] for l in lignes[1:81]]
assert len(excentricite) == 80

corps, fus, k = lignes[161:], [], 0
while k < len(corps):
    if len(corps[k].split()) == 4 and k + 1 < len(corps) and len(corps[k + 1].split()) == 2:
        fus.append(corps[k].rstrip() + corps[k + 1].lstrip())   # nombre coupé en fin de ligne
        k += 2
        continue
    fus.append(corps[k])
    k += 1
termes = [l.split() for l in fus if len(l.split()) == 5 and l.split()[0].isdigit()]
debut_precession = next(i for i in range(1, len(termes)) if termes[i][0] == '1')
obliquite = [[float(x) for x in t[1:4]] for t in termes[:debut_precession]]
precession = [[float(x) for x in t[1:4]] for t in termes[debut_precession:]]
assert (len(obliquite), len(precession)) == (6320, 9559), (len(obliquite), len(precession))
for bloc in (termes[:debut_precession], termes[debut_precession:]):
    assert [int(t[0]) for t in bloc] == list(range(1, len(bloc) + 1)), 'numérotation non continue'

# --- erreur de la troncature, contre la série complète (insolation 65° N au solstice, S0 1361 ; obliquité)
SEC, D = math.pi / (180 * 3600), math.pi / 180
E = np.array(excentricite)


def orbite(t, obl, pre):
    eps = EPS_ETOILE + np.sum(obl[:, 0] / 3600 * np.cos(obl[:, 1] * SEC * t + obl[:, 2] * D))
    es = np.sum(E[:, 0] * np.sin(E[:, 1] * SEC * t + E[:, 2] * D))
    ec = np.sum(E[:, 0] * np.cos(E[:, 1] * SEC * t + E[:, 2] * D))
    psi = PSI_BAR * SEC * t + ZETA * D + np.sum(pre[:, 0] * SEC * np.sin(pre[:, 1] * SEC * t + pre[:, 2] * D))
    return eps * D, math.hypot(es, ec), (math.atan2(es, ec) + psi + math.pi) % (2 * math.pi)


def insolation(o):
    eps, e, varpi = o
    rho = (1 - e * e) / (1 + e * math.cos(math.pi / 2 - varpi))
    a, b = math.sin(65 * D) * math.sin(eps), math.cos(65 * D) * math.cos(eps)
    h0 = math.acos(min(max(-a / b, -1), 1))
    return 1361 / (math.pi * rho * rho) * (h0 * a + b * math.sin(h0))


O, P = np.array(obliquite), np.array(precession)
Ot, Pt = O[np.abs(O[:, 0]) >= SEUIL], P[np.abs(P[:, 0]) >= SEUIL]
dq, de = 0.0, 0.0
for t in np.arange(-3e6, 3e6 + 1, 7919.0):
    plein, tronque = orbite(t, O, P), orbite(t, Ot, Pt)
    dq = max(dq, abs(insolation(plein) - insolation(tronque)))
    de = max(de, abs(plein[0] - tronque[0]) / D)

tables = {'excentricite': excentricite, 'obliquite': Ot.tolist(), 'precession': Pt.tolist(),
          'epsEtoile': EPS_ETOILE, 'psiBar': PSI_BAR, 'zeta': ZETA}
CIBLE.write_text("""// File: static/astronomie_ber90.js
// Desc: Tables de la solution astronomique de Berger & Loutre (1991), valide à ± 3 Ma autour de 1950 — ENGENDRÉ par
//       scripts/ber90_tables.py depuis scripts/sources/berger_loutre1991_BER90.IN.gz (via palinsol 1.0, M. Crucifix),
//       ne pas éditer. Chaque terme : [amplitude, vitesse (″/an), phase (°)] — excentricite (M sans unité, 80 termes),
//       obliquite (A en ″), precession (F en ″) ; epsEtoile (°), psiBar (″/an), zeta (°).
//       Troncature : termes d'amplitude < %s ″ écartés — obliquité %d / 6320 termes, précession %d / 9559 ; erreur mesurée
//       sur ± 3 Ma contre la série complète : insolation 65° N au solstice ≤ %.3f W/m², obliquité ≤ %.4f°.
//       Berger & Loutre (1991), Quaternary Science Reviews, 10, 297-317, doi:10.1016/0277-3791(91)90033-Q
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
""" % (SEUIL, len(Ot), len(Pt), dq, de) + 'window.BER90 = ' + json.dumps(tables, separators=(',', ':')) + ';\n', encoding='utf-8')
print('écrit', CIBLE, 'obliquité', len(Ot), 'précession', len(Pt), 'erreur insolation %.3f W/m², obliquité %.4f°' % (dq, de),
      '%d ko' % (CIBLE.stat().st_size // 1024))
