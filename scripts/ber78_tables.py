# File: CO2/scripts/ber78_tables.py
# Desc: Écrit static/astronomie_ber78.js (tables de la solution astronomique de Berger 1978) depuis
#       scripts/sources/berger1978_INSOL.IN — le fichier d'entrée d'origine du programme de Berger (« 1978 BERGER
#       SOLUTION »), tel que distribué par le paquet R palinsol 1.0 (M. Crucifix, UCLouvain ; CRAN, inst/extdata/INSOL.IN,
#       https://github.com/mcrucifix/palinsol ; données : doi:10.5281/zenodo.7198111). Seule source : relancer après l'avoir
#       changé. Usage : python3 scripts/ber78_tables.py   (depuis CO2/)
#       Berger, A. L. (1978), Long-term variations of daily insolation and Quaternary climatic changes, J. Atmos. Sci., 35,
#       2362-2367, doi:10.1175/1520-0469(1978)035<2362:LTVODI>2.0.CO;2
# Version 1.0.0
# Copyright 2026 DNAvatar.org - Arnaud Maignan
# Date: [October 16, 2026]
import json
import pathlib

ICI = pathlib.Path(__file__).resolve().parent
SOURCE = ICI / 'sources' / 'berger1978_INSOL.IN'
CIBLE = ICI.parent / 'static' / 'astronomie_ber78.js'

# Blocs du fichier, dans l'ordre (6 lignes de commentaire « C » en tête, une ligne de paramètres du programme à la fin) :
#   Table 4 — excentricité et longitude du périhélie : 19 termes   (rang, M, g ″/an, β °)
#   Table 1 — obliquité : 47 termes                                  (rang, A ″, f ″/an, φ °, période an)
#   Table 5 — précession générale en longitude : 78 termes          (rang, F ″, f′ ″/an, δ °, période an)
BLOCS = [('table4', 19), ('table1', 47), ('table5', 78)]

lignes = [l for l in SOURCE.read_text(encoding='ascii').splitlines() if l.strip() and not l.startswith('C')]
tables, i = {}, 0
for nom, n in BLOCS:
    bloc = []
    for l in lignes[i:i + n]:
        c = l.split()
        assert int(c[0]) >= 1, (nom, l)
        bloc.append([float(c[1]), float(c[2]), float(c[3])])   # amplitude, vitesse ″/an, phase °
    assert len(bloc) == n, (nom, len(bloc))
    tables[nom] = bloc
    i += n
assert len(lignes) == i + 1, 'INSOL.IN : il reste ' + str(len(lignes) - i) + ' lignes après les trois tables'

entete = """// File: static/astronomie_ber78.js
// Desc: Tables de la solution astronomique de Berger (1978) — ENGENDRÉ par scripts/ber78_tables.py depuis
//       scripts/sources/berger1978_INSOL.IN (entrée d'origine du programme de Berger, via palinsol 1.0, M. Crucifix),
//       ne pas éditer. Chaque terme : [amplitude, vitesse (″/an), phase (°)] — table4 : excentricité (M sans unité),
//       table1 : obliquité (A en ″), table5 : précession générale (F en ″).
//       Berger, A. L. (1978), J. Atmos. Sci., 35, 2362-2367, doi:10.1175/1520-0469(1978)035<2362:LTVODI>2.0.CO;2
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
"""
CIBLE.write_text(entete + 'window.BER78 = ' + json.dumps(tables, separators=(',', ':')) + ';\n', encoding='utf-8')
print('écrit', CIBLE, {k: len(v) for k, v in tables.items()})
