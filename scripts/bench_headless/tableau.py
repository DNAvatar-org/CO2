# File: CO2/scripts/bench_headless/tableau.py
# Desc: Tableau des colonnes choisies d'une sortie de run.py : python3 tableau.py sortie.json col1,col2,…
# Version 1.0.0
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import json,sys
s=open(sys.argv[1]).read(); d=json.loads(s[s.index('\n[')+1:])
cols=sys.argv[2].split(',') if len(sys.argv)>2 else ['ep','T','lit','S4','Sabs','Fint','OLR','A','A_sol','A_clair','A_bas','A_haut','f_nuage','tauSW','W_gm2','ccn','glace','ocean','desert','alb_glace','P_atm','ppmCO2','EDS','T_pol']
print(' '.join(f'{c:>8}' for c in cols))
for r in d: print(' '.join(f'{str(r.get(c)):>8}'[:12] for c in cols))
