#!/usr/bin/env python3
# File: CO2/scripts/mesures/hadcrut5_annuel.py
# Desc: Grilles mensuelles HadCRUT5 (Met Office Hadley Centre / CRU, 5°, anomalies à 1961–1990) → moyennes ANNUELLES
#       1850–2025 dans CO2/static/mesures/anomalies_hadcrut5.js : la version analysée (cases vides remplies par
#       interpolation statistique) et la version non remplie (cases qui contiennent des mesures). Une année d'une case :
#       moyenne de ses mois présents, s'il y en a au moins MOIS_MIN (la moitié) — des anomalies n'ont pas de cycle
#       saisonnier, une année incomplète n'est que plus bruitée. Lecture par ncdump (paquet netcdf), sans netCDF4 ni h5py.
#         python3 -I scripts/mesures/hadcrut5_annuel.py <analysis.nc> <noninfilled.nc> static/mesures/anomalies_hadcrut5.js
# Version 1.0.0
# Date: [November 03, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan

import base64
import re
import subprocess
import sys

import numpy as np

AN0, AN1 = 1850, 2025      # années complètes publiées (le fichier court jusqu'au dernier mois paru)
MOIS_MIN = 6
PAS = 0.1                  # [K] un cran de l'entier stocké
ABSENT = -128


def lire(nc):
    """tas_mean (time, latitude, longitude) en K, NaN où ncdump écrit _ ; ainsi que latitudes, longitudes et attributs utiles."""
    txt = subprocess.run(['ncdump', '-v', 'tas_mean,latitude,longitude', '-p', '9,17', nc],
                         capture_output=True, text=True, check=True).stdout
    entete, donnees = txt.split('data:', 1)
    dims = {k: int(v) for k, v in re.findall(r'\b(time|latitude|longitude) = (\d+) ;', entete)}

    def tableau(nom):
        corps = donnees.split(' ' + nom + ' =', 1)[1].split(';', 1)[0]
        return np.array([np.nan if t == '_' else float(t) for t in re.split(r'[,\s]+', corps.strip())])

    tas = tableau('tas_mean').reshape(dims['time'], dims['latitude'], dims['longitude'])
    version = re.search(r':version = "([^"]+)"', entete).group(1)
    construit = re.search(r'Data set built at: (\d{4}-\d{2}-\d{2})', entete).group(1)
    return tas, tableau('latitude'), tableau('longitude'), version, construit


def annuel(tas):
    """Moyennes annuelles AN0..AN1, NaN si moins de MOIS_MIN mois. Le mois 0 du fichier est janvier AN0."""
    n = AN1 - AN0 + 1
    m = tas[:n * 12].reshape(n, 12, tas.shape[1], tas.shape[2])
    present = np.sum(~np.isnan(m), axis=1)
    somme = np.nansum(m, axis=1)
    return np.where(present >= MOIS_MIN, somme / np.maximum(present, 1), np.nan)


def encoder(a):
    """int8 en crans de PAS (ABSENT = sans donnée), en base64."""
    q = np.round(a / PAS)
    assert np.nanmax(np.abs(q)) <= 127, 'anomalie hors de ±12,7 K : changer PAS'
    q = np.where(np.isnan(q), ABSENT, q).astype(np.int8)
    return base64.b64encode(q.tobytes()).decode('ascii')


def main(nc_analyse, nc_mesure, sortie):
    tas_a, lat, lon, version, construit = lire(nc_analyse)
    tas_m, lat_m, lon_m, version_m, _ = lire(nc_mesure)
    assert version == version_m and np.array_equal(lat, lat_m) and np.array_equal(lon, lon_m)
    assert lat[0] == -87.5 and lat[-1] == 87.5 and lon[0] == -177.5 and lon[-1] == 177.5
    assert tas_a.shape[0] >= (AN1 - AN0 + 1) * 12, 'le fichier ne couvre pas ' + str(AN1)
    a, m = annuel(tas_a), annuel(tas_m)
    with open(sortie, 'w', encoding='utf-8') as f:
        f.write(f"""// File: CO2/static/mesures/anomalies_hadcrut5.js
// Desc: Anomalies ANNUELLES de température de surface {version} ({AN0}–{AN1}), écart à la moyenne 1961–1990 de chaque case :
//       air à 2 m sur les terres (CRUTEM5), eau de surface en mer (HadSST4). Grille 5° : {len(lat)} latitudes du sud au nord ×
//       {len(lon)} longitudes de −177,5° à 177,5°, années à la suite. Entiers int8 en crans de {PAS} K ({ABSENT} : sans donnée),
//       en base64. analyse : cases vides remplies par interpolation statistique ; mesure : cases qui contiennent des mesures.
//       Une année : moyenne des mois présents, au moins {MOIS_MIN}. Engendré par CO2/scripts/mesures/hadcrut5_annuel.py
//       depuis {version}.analysis.anomalies.ensemble_mean.nc et {version}.noninfilled.anomalies.ensemble_mean.nc
//       (jeu construit le {construit}) — ne pas éditer à la main.
// Données : © Crown copyright, Met Office Hadley Centre / Climatic Research Unit (UEA), Open Government Licence v3.0 ;
//       Morice et al. 2021, JGR Atmospheres 126, e2019JD032361.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.HADCRUT5 = {{
    version: '{version}', construit: '{construit}', reference: [1961, 1990],
    an0: {AN0}, an1: {AN1}, nLat: {len(lat)}, nLon: {len(lon)}, pas: {PAS}, absent: {ABSENT}, moisMin: {MOIS_MIN},
    analyse: '{encoder(a)}',
    mesure: '{encoder(m)}'
}};
""")
    for nom, x in (('analyse', a), ('mesure', m)):
        print(nom, 'min/max', np.nanmin(x), np.nanmax(x), 'cases', [int(np.sum(~np.isnan(x[y - AN0]))) for y in (1850, 1900, 1950, 2000, 2025)])


if __name__ == '__main__':
    main(*sys.argv[1:4])
