# File: CO2/scripts/paleogeo/paleodem_zones.py
# Desc: Table zonale de paléogéographie pour le moteur : pour chaque carte PaleoDEM (Scotese & Wright 2018, 1° × 1°, tous les
#       5 Ma de 0 à 540 Ma, CC-BY 4.0) et chaque bande de latitude (0–30°, 30–60°, 60–90°, par hémisphère), la part de CONTINENT
#       (socle au-dessus de −1 000 m, milieu du creux de l'hypsométrie entre continents et bassins) et l'altitude moyenne de ce
#       socle (m). La carte actuelle donne le socle SOUS la glace (Antarctique de l'Ouest à −800 m) : c'est ce qu'il faut à un
#       modèle de calotte. Écrit API_BILAN/data/paleogeo_zones.js.
#       Usage : python3 -I paleodem_zones.py <dossier des CSV PaleoDEM> <sortie .js>
#       Données : https://www.earthbyte.org/paleodem-resource-scotese-and-wright-2018/ (PaleoDEMS_long_lat_elev_csv_v2.zip)
# Version 1.1.0
# - v1.1.0 (2026-10-14): haut_m, x_haut, x_continent — hautes terres (quart le plus haut) et latitudes moyennes du continent.
# Date: [October 14, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import sys, os, re, glob, math, json

SEUIL_CONTINENT_M = -1000
BANDES = [('S_pol', -90, -60), ('S_mid', -60, -30), ('S_trop', -30, 0), ('N_trop', 0, 30), ('N_mid', 30, 60), ('N_pol', 60, 90)]

def bande(lat):
    for nom, a, b in BANDES:
        if a <= lat < b or (lat == 90 and nom == 'N_pol'):
            return nom

tables = {}
for f in glob.glob(os.path.join(sys.argv[1], 'Map*.csv')):
    age = int(re.search(r'_(\d+)Ma', f).group(1))
    acc = {n: [0.0, 0.0, 0.0] for n, _, _ in BANDES}       # aire, aire continent, Σ aire · altitude du socle
    cellules = {n: [] for n, _, _ in BANDES}                # (altitude, aire) des cellules de continent
    for ligne in open(f):
        if not (ligne[0].isdigit() or ligne[0] == '-'): continue
        lon, lat, z = map(float, ligne.split(','))
        if z >= 9000: continue                               # code de remplissage
        w = max(math.cos(math.radians(lat)), math.cos(math.radians(89.5)))
        a = acc[bande(lat)]
        a[0] += w
        if z > SEUIL_CONTINENT_M:
            a[1] += w; a[2] += w * z
            cellules[bande(lat)].append((z, w, abs(math.sin(math.radians(lat)))))
    # Hautes terres : altitude moyenne du QUART le plus haut du continent de la bande (là où naissent les calottes).
    # Latitudes (|sin φ|) moyennes du continent et des hautes terres : où se trouvent la terre et la calotte qui y naît.
    hauts = {}
    for n, L in cellules.items():
        L.sort(reverse=True); tot = sum(w for _, w, _ in L); cum = 0.0; sz = 0.0; sx = 0.0
        for z, w, x in L:
            if cum >= tot / 4: break
            pris = min(w, tot / 4 - cum); cum += pris; sz += pris * z; sx += pris * x
        xc = sum(w * x for _, w, x in L) / tot if tot > 0 else None
        hauts[n] = (round(sz / cum) if cum > 0 else 0, round(sx / cum, 4) if cum > 0 else None, round(xc, 4) if xc is not None else None)
    tables[age] = (acc, hauts)

ages = sorted(tables)
sortie = {'ages_Ma': ages, 'continent': {}, 'socle_m': {}, 'haut_m': {}, 'x_haut': {}, 'x_continent': {}}
MILIEU = {'S_pol': 0.933, 'N_pol': 0.933, 'S_mid': 0.683, 'N_mid': 0.683, 'S_trop': 0.25, 'N_trop': 0.25}   # sans continent : milieu de la bande
for n, _, _ in BANDES:
    sortie['continent'][n] = [round(tables[a][0][n][1] / tables[a][0][n][0], 3) for a in ages]
    sortie['socle_m'][n] = [round(tables[a][0][n][2] / tables[a][0][n][1]) if tables[a][0][n][1] > 0 else 0 for a in ages]
    sortie['haut_m'][n] = [tables[a][1][n][0] for a in ages]
    sortie['x_haut'][n] = [tables[a][1][n][1] if tables[a][1][n][1] is not None else MILIEU[n] for a in ages]
    sortie['x_continent'][n] = [tables[a][1][n][2] if tables[a][1][n][2] is not None else MILIEU[n] for a in ages]

entete = """// File: API_BILAN/data/paleogeo_zones.js
// Desc: Paléogéographie zonale par époque, CALCULÉE (CO2/scripts/paleogeo/paleodem_zones.py) depuis les PaleoDEM de Scotese &
//       Wright 2018 (PALEOMAP Paleodigital Elevation Models for the Phanerozoic, doi:10.5281/zenodo.5460860, CC-BY 4.0) :
//       part de CONTINENT (socle > −1 000 m), altitude moyenne du socle [m] et des HAUTES TERRES (quart le plus haut du continent,
//       là où naissent les calottes) [m], et leurs latitudes moyennes |sin φ| (x_haut, x_continent), par bande et par hémisphère,
//       tous les 5 Ma de 0 à 540 Ma. Lu par physics/calottes.js. Ne pas éditer à la main : régénérer.
// Version 1.0.0
// Date: [October 14, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
'use strict';
window.PALEOGEO = """
open(sys.argv[2], 'w', encoding='utf-8').write(entete + json.dumps(sortie, ensure_ascii=False) + ';\n')
print(len(ages), 'cartes →', sys.argv[2])
