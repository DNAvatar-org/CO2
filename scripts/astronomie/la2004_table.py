# File: CO2/scripts/astronomie/la2004_table.py
# Desc: Table de l'orbite de la Terre pour CO2/static/astronomie.js : la solution La2004 (Laskar et al. 2004, A&A 428:261),
#       fichier INSOLN.LA2004.BTL.ASC (redistribué par le paquet R palinsol de M. Crucifix, inst/extdata, licence MIT) :
#       une ligne par ka, de l'an 2000 (t = 0) à −51 Ma ; colonnes t [ka], excentricité e, obliquité ε [rad], longitude du
#       périhélie ϖ [rad] (héliocentrique, depuis l'équinoxe mobile). Écrit CO2/static/astronomie_la04.js en entiers :
#       e × 1e6, ε × 1e6 [µrad], ϖ × 1e4 [1e-4 rad] — erreurs d'arrondi 5e-7, 5e-7 rad (0,1″), 5e-5 rad (0,003°).
#       Usage (depuis CO2/scripts) : python3 -I astronomie/la2004_table.py sources/INSOLN.LA2004.BTL.ASC.gz ../static/astronomie_la04.js
#       Données : CO2/scripts/sources/INSOLN.LA2004.BTL.ASC.gz, copie de https://github.com/mcrucifix/palinsol
#       (inst/extdata, 1 559 846 octets, sha256 78a8e53fcdaaf381ed1dce1ce6046da08ee4b41f19ecd7dcdb5aef5d9e729b35).
# Version 1.0.0
# Date: [October 26, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import sys, gzip, json

lignes = [l.split() for l in gzip.open(sys.argv[1], 'rt') if l.strip()]
t = [float(l[0]) for l in lignes]
# Le fichier va de 0 à −51 000 ka par pas de 1 ka, sans trou : la table n'en garde que les valeurs, l'indice EST l'âge en ka.
assert all(abs(t[i] + i) < 1e-9 for i in range(len(t))), 'INSOLN : pas de 1 ka depuis t = 0 attendu'
e = [round(float(l[1].replace('D', 'E')) * 1e6) for l in lignes]
eps = [round(float(l[2].replace('D', 'E')) * 1e6) for l in lignes]
varpi = [round(float(l[3].replace('D', 'E')) * 1e4) for l in lignes]

entete = """// File: CO2/static/astronomie_la04.js
// Desc: Orbite de la Terre, solution La2004 (Laskar et al. 2004, A&A 428:261, doi:10.1051/0004-6361:20041335), au pas de 1 ka
//       de l'an 2000 (indice 0) à −51 Ma (indice 51 000) : excentricité e × 1e6, obliquité ε × 1e6 [rad], longitude du périhélie
//       ϖ × 1e4 [rad] (héliocentrique, depuis l'équinoxe mobile ; astronomie.js y ajoute π). Fichier INSOLN.LA2004.BTL.ASC du
//       paquet palinsol (M. Crucifix). Écrit par CO2/scripts/astronomie/la2004_table.py : ne pas éditer à la main, régénérer.
// Version 1.0.0
// Date: [October 26, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
'use strict';
window.LA2004 = """
sortie = {'pasAns': 1000, 'e1e6': e, 'eps1e6': eps, 'varpi1e4': varpi}
open(sys.argv[2], 'w', encoding='utf-8').write(entete + json.dumps(sortie, separators=(',', ':')) + ';\n')
print(len(e), 'lignes (0 →', t[-1], 'ka) →', sys.argv[2])
