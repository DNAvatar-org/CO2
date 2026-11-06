# File: CO2/scripts/hitran_complete_lines.py
# Desc: Complète les raies HITRAN du moteur (API_BILAN/data/hitran_lines_*.js) sur toute la grille 0–10 000 cm⁻¹ et écrit les
#       fonctions de partition TIPS (API_BILAN/data/hitran_tips.js). Lit des fichiers .par (format HITRAN 160 caractères) déjà
#       téléchargés, un par tranche, nommés <MOL>_<numin>_<numax>.par, et les tables q<id>.txt.
# Version 1.0.0
# Date: [November 6, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan
"""
Téléchargement (isotopologue principal, comme hitran_fetch_lines.py ; ids globaux HITRAN : H₂O 1, CO₂ 7, O₃ 16, CH₄ 32) :
  https://hitran.org/lbl/api?iso_ids_list=<id>&numin=<a>&numax=<b>&head=False&fixwidth=0&sep=%5Bcomma%5D&request_params=par_line
  https://hitran.org/data/Q/q<id>.txt          (TIPS 2021 : T [K], Q(T))
Tranches lues : H₂O 0–100 et 2000–10 000 ; CO₂ 2500–10 000 (aucune raie sous 158 cm⁻¹ : pas de dipôle permanent) ; O₃ 0–4000 ;
CH₄ 0–900, 1600–2600, 3400–10 000 ; gardées jusqu'à NU_MAX. Les raies déjà dans les fichiers du moteur ne sont pas touchées.

Seuil : par tranche de 100 cm⁻¹, les raies NOUVELLES sont gardées par intensité décroissante jusqu'à 99,5 % de l'intensité de la
tranche à 296 K (les plus faibles, qui portent le dernier 0,5 %, sont laissées : le poids des fichiers lus par le navigateur).

Usage : python3 scripts/hitran_complete_lines.py <dossier des .par et q*.txt>
"""

import glob
import json
import os
import sys

PART = 0.995
# [cm⁻¹] Borne haute des raies NOUVELLES par molécule. O₃ ne vit que dans la stratosphère (200–300 K) : au-delà de 2500 cm⁻¹ son
# émission est négligeable et le flux montant de la surface aussi (< 1 % à 288 K). CH₄ : ses trous comblés jusqu'à 3400 cm⁻¹ ; au-delà
# ses bandes ne comptent qu'au-dessus de ~1000 K, où il ne survit pas (pyrolyse). H₂O et CO₂ : toute la grille thermique.
NU_MAX = {"H2O": 10000, "CO2": 10000, "O3": 2500, "CH4": 3400}
CHAMPS = ["nu", "sw", "elower", "gamma_air", "gamma_self", "n_air", "delta_air"]
TIPS = {"H2O": 1, "CO2": 7, "O3": 16, "CH4": 32}


def lire_par(fichier):
    raies = []
    for l in open(fichier):
        if len(l) < 67 or not l[:2].strip().isdigit():
            continue
        raies.append({"nu": round(float(l[3:15]), 6), "sw": float(l[15:25]), "elower": float(l[45:55]),
                      "gamma_air": float(l[35:40]), "gamma_self": float(l[40:45]), "n_air": float(l[55:59]),
                      "delta_air": float(l[59:67])})
    return raies


def seuil(raies):
    """Par tranche de 100 cm⁻¹ : une bande faible garde ses raies (ce sont elles qui ferment une fenêtre), la plus forte ne les
    efface pas. Renvoie les raies gardées et la plus petite intensité gardée."""
    tranches = {}
    for r in raies:
        tranches.setdefault(int(r["nu"] // 100), []).append(r)
    gardees = []
    for t in tranches.values():
        t.sort(key=lambda r: -r["sw"])
        total, cumul = sum(r["sw"] for r in t), 0.0
        for r in t:
            if cumul >= PART * total:
                break
            gardees.append(r)
            cumul += r["sw"]
    return gardees, (min(r["sw"] for r in gardees) if gardees else 0)


def main():
    src = sys.argv[1]
    racine = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data = os.path.join(racine, "API_BILAN", "data")
    for mol in ["H2O", "CO2", "O3", "CH4"]:
        nouvelles = [r for f in sorted(glob.glob(os.path.join(src, mol + "_*.par"))) for r in lire_par(f) if r["nu"] <= NU_MAX[mol]]
        gardees, s_min = seuil(nouvelles)
        chemin = os.path.join(data, "hitran_lines_" + mol + ".js")
        anciennes = []
        if os.path.exists(chemin):
            t = open(chemin).read()
            anciennes = json.loads(t[t.index("=") + 1:t.rindex(";")])
        # Les tranches téléchargées ne recouvrent pas les anciennes : aucune raie n'est en double.
        deja = set(r["nu"] for r in anciennes)
        assert not any(r["nu"] in deja for r in gardees), mol + " : raie déjà présente"
        toutes = sorted(anciennes + gardees, key=lambda r: r["nu"])
        with open(chemin, "w") as f:
            f.write("window.HITRAN_LINES_" + mol + "=" + json.dumps([{k: r[k] for k in CHAMPS} for r in toutes], separators=(",", ":")) + ";\n")
        print("%s : %d raies (+%d nouvelles, S ≥ %.2e, %.1f %% de leur intensité) → %s" % (mol, len(toutes), len(gardees), s_min, 100 * PART, chemin))
    q = {}
    for mol, i in TIPS.items():
        rows = [l.split() for l in open(os.path.join(src, "q%d.txt" % i)) if l.strip()]
        q[mol] = {"T0": int(rows[0][0]), "Q": [float(r[1]) for r in rows]}
    with open(os.path.join(data, "hitran_tips.js"), "w") as f:
        f.write("// TIPS 2021 (Gamache et al. 2021, JQSRT 271:107713) : Q(T) de l'isotopologue principal, pas de 1 K à partir de T0 ;\n"
                "// hitran.org/data/Q/q<id>.txt, écrit par CO2/scripts/hitran_complete_lines.py.\n")
        f.write("window.HITRAN_TIPS=" + json.dumps(q, separators=(",", ":")) + ";\n")
    print("TIPS → hitran_tips.js : " + ", ".join("%s %d–%d K" % (m, q[m]["T0"], q[m]["T0"] + len(q[m]["Q"]) - 1) for m in q))


if __name__ == "__main__":
    main()
