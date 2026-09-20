# File: gfad_young_forest_fraction.py - Part de forêt « jeune » depuis GFADv1.1 (une fois, puis en dur)
# Desc: Agrège la distribution mondiale d'âge des peuplements (Poulter et al. 2019, GFADv1.1) en UN scalaire :
#       la fraction de surface forestière de moins de youngMaxYears ans. Même esprit que
#       hitran_spectral_bin_bounds.py : on exécute une fois, on copie le nombre dans configTimeline.js.
#       Le NetCDF (30 Mo zippé, 513 Mo décompressé) n'entre PAS dans le dépôt — le modèle est 0D,
#       il ne consomme qu'un scalaire, pas une grille 0,5°.
# Version 1.0.0
# Copyright 2026 DNAvatar.org - Arnaud Maignan
# Licensed under Apache License 2.0 with Commons Clause.
# Date: 2026-09-20
# Logs:
# - Initial: lecture GFAD_V1-1*.nc, pondération par aire de maille sphérique, cumul des classes d'âge.

"""
Usage (depuis la racine du projet CO2) :

  python3 -m venv .venv && ./.venv/bin/pip install netCDF4 numpy
  curl -L -o GFAD_V1-1.zip https://hs.pangaea.de/model/Poulter-etal_2018/GFAD_V1-1.zip
  unzip GFAD_V1-1.zip
  ./.venv/bin/python scripts/gfad_young_forest_fraction.py GFAD_V1-1/

  (Python système Homebrew = externally managed, PEP 668 : le venv est obligatoire.)

Source : Poulter, B. et al. (2019), The global forest age dataset and its uncertainties (GFADv1.1),
PANGAEA, doi:10.1594/PANGAEA.897392, licence CC-BY-4.0. Année de référence 2000-2010 — c'est
exactement l'instant initial de l'époque 📱 (▶ = 2000).

⚠️ L'attribut `license` EMBARQUÉ dans le NetCDF date de 2018 et dit « not to be reproduced or
downloaded without contacting Ben Poulter (until a publication is in press) ». La page PANGAEA,
elle, publie le jeu sous CC-BY-4.0. On n'en redistribue de toute façon qu'un scalaire agrégé.

Structure du fichier : variable `age` (Class, PFT, lat, lon) = fraction de la maille couverte par
ce type de végétation dans cette classe d'âge. 15 classes de 10 ans (1-10, 11-20, … 141-150),
4 types (résineux persistants / caducs, feuillus caducs / persistants), grille 0,5°.

Sortie : la fraction cumulée sous youngMaxYears, pour le fichier central et ses deux bornes.
Copier dans configTimeline.js CONFIG_COMPUTE.CARBON_SINKS.landYoungFraction0.
"""

import sys
import numpy as np
import netCDF4 as nc

EARTH_RADIUS_M = 6371.0088e3
CLASS_WIDTH_YEARS = 10          # GFADv1.1 : classes de 10 ans
YOUNG_MAX_YEARS = 30            # fenêtre « jeune » = forte réponse au CO₂ (Tang 2014 : NPP culmine 10-40 ans)


def per_class_area_m2(path):
    """Surface forestière mondiale par classe d'âge (m²), pondérée par l'aire réelle des mailles."""
    ds = nc.Dataset(path)
    age = np.ma.filled(ds.variables['age'][:].astype('f8'), 0.0)
    age[age < 0] = 0.0                                   # _FillValue -9999
    lat = ds.variables['lat'][:]
    # Aire d'une maille 0,5° : R²·Δλ·(sin φ_haut − sin φ_bas). Ne PAS utiliser cos(φ) seul :
    # l'erreur atteint 0,5 % aux hautes latitudes, là où il y a justement la forêt boréale.
    dlon = np.deg2rad(0.5)
    cell = np.abs((EARTH_RADIUS_M ** 2) * dlon
                  * (np.sin(np.deg2rad(lat + 0.25)) - np.sin(np.deg2rad(lat - 0.25))))
    return (age * cell[None, None, :, None]).sum(axis=(1, 2, 3))


def main(folder):
    n_young = YOUNG_MAX_YEARS // CLASS_WIDTH_YEARS
    print(f"Fraction de forêt de moins de {YOUNG_MAX_YEARS} ans (classes 1 à {n_young})\n")
    for label, name in [('central    ', 'GFAD_V1-1.nc'),
                        ('borne basse', 'GFAD_V1-1_lowerbound.nc'),
                        ('borne haute', 'GFAD_V1-1_upperbound.nc')]:
        area = per_class_area_m2(f'{folder.rstrip("/")}/{name}')
        total = area.sum()
        # Les fichiers de borne n'ont pas toujours 15 classes : on cumule ce qui existe.
        young = area[:n_young].sum()
        print(f'  {label} : {young / total:7.2%}   '
              f'({len(area)} classes, surface forestière totale {total / 1e10:.0f} Mha)')
    print('\n→ landYoungFraction0 = la valeur centrale. Les deux bornes donnent l\'incertitude'
          '\n  du jeu de données lui-même (assignation d\'âge plus jeune / plus vieille).')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'GFAD_V1-1')
