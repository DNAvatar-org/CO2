# File: CO2/scripts/audit_constantes.py
# Desc: AUDIT des constantes du moteur : chaque constante nommée (CONST.X = …, EARTH.X = …, et les champs en MAJUSCULES à valeur
#       numérique des objets de physics/ config/ radiative/ albedo/ …) doit avoir un STATUT — une entrée de
#       API_BILAN/data/episteme.js (cible ou texte qui la nomme) ou une carte de API_BILAN/doc/equation.html qui la nomme.
#       Liste celles qui n'en ont pas. Lecture statique, aucun calcul ; à lancer avant chaque commit d'API_BILAN.
#       Usage : python3 scripts/audit_constantes.py [--tout]   (--tout : liste aussi celles qui ont un statut)
# Version 1.0.0
# Date: [November 6, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import os
import re
import sys

RACINE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "API_BILAN")
DOSSIERS = ["physics", "radiative", "albedo", "atmosphere", "h2o", "co2", "land", "ocean", "geology", "aerosols",
            "convergence", "spectroscopy", "config", "workers"]
# CONST.X = 1.2 ; EARTH.X = 3 ; « X: 1.2, » dans un objet (nom en MAJUSCULES, valeur numérique littérale)
MOTIFS = [re.compile(r"^\s*(?:CONST|EARTH|CONV)\.([A-Z][A-Z0-9_]+)\s*=\s*(-?[0-9][0-9._e+-]*)"),
          re.compile(r"^\s*([A-Z][A-Z0-9_]{2,})\s*:\s*(-?[0-9][0-9._e+-]*)\s*,?\s*(//.*)?$")]


def constantes():
    for d in DOSSIERS:
        for base, _, fichiers in os.walk(os.path.join(RACINE, d)):
            for f in sorted(fichiers):
                if not f.endswith(".js"):
                    continue
                chemin = os.path.join(base, f)
                for n, ligne in enumerate(open(chemin, encoding="utf-8"), 1):
                    for m in MOTIFS:
                        r = m.match(ligne)
                        if r:
                            yield os.path.relpath(chemin, RACINE), n, r.group(1), r.group(2)
                            break


def main():
    tout = "--tout" in sys.argv
    statuts = open(os.path.join(RACINE, "data", "episteme.js"), encoding="utf-8").read()
    cartes = open(os.path.join(RACINE, "doc", "equation.html"), encoding="utf-8").read()
    sans, avec = [], []
    for fichier, n, nom, val in constantes():
        (avec if (nom in statuts or nom in cartes) else sans).append((fichier, n, nom, val))
    for fichier, n, nom, val in sans:
        print("SANS STATUT  %s:%d  %s = %s" % (fichier, n, nom, val))
    if tout:
        for fichier, n, nom, val in avec:
            print("statut       %s:%d  %s = %s" % (fichier, n, nom, val))
    print("— %d constantes, %d sans statut (ni dans data/episteme.js, ni dans doc/equation.html)" % (len(sans) + len(avec), len(sans)))


if __name__ == "__main__":
    main()
