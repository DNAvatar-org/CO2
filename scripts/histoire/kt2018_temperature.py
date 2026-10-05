#!/usr/bin/env python3
# File: CO2/scripts/histoire/kt2018_temperature.py
# Desc: Reproduit la Fig. 3 de Krissansen-Totton, Arney & Catling 2018 (PNAS 115:4105) — température
#       moyenne de surface de 4,0 Ga à aujourd'hui, percentiles 2,5 / 50 / 97,5 % — avec LEUR code
#       (github.com/joshuakt/early-earth-carbon-cycle), et imprime les lignes `kt2018` de
#       CO2/static/histoire/litterature.js (âges > 485 Ma : après, c'est PhanDA).
#       Paramètres et plages = main_code_parallel.py par défaut (10 000 tirages, chimie du carbone
#       dépendant de T, sans CH₄) : exactement la figure publiée, rien de réglé ici.
#       Le code de 2018 est en Python 2 : on le clone, on remplace `pylab` par numpy (shim) et le seul
#       `print` de model_functions_reformate.py. Pré-requis : numpy, scipy (un venv suffit).
#         python3 -m venv /tmp/kt && /tmp/kt/bin/pip install numpy scipy
#         /tmp/kt/bin/python CO2/scripts/histoire/kt2018_temperature.py [N=10000]
# Version 1.0.0
# Date: 2026-09-24
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import os, sys, subprocess, tempfile
from concurrent.futures import ProcessPoolExecutor
import numpy

REPO = 'https://github.com/joshuakt/early-earth-carbon-cycle.git'
KT = os.path.join(tempfile.gettempdir(), 'early-earth-carbon-cycle')
T_PHANDA = 485e6   # PhanDA commence à 482 Ma : KT2018 s'arrête avant


def preparer():
    if not os.path.isdir(KT):
        subprocess.run(['git', 'clone', '-q', '--depth', '1', REPO, KT], check=True)
    with open(os.path.join(KT, 'pylab.py'), 'w') as f:
        f.write('from numpy import log10, exp, log, roots\n')
    p = os.path.join(KT, 'model_functions_reformate.py')
    s = open(p).read()
    a = 'print "WARNING: NO PHYSIAL STEADY STATE EXISTS! DIC is negative"'
    if a in s:
        open(p, 'w').write(s.replace(a, 'print("WARNING: NO PHYSIAL STEADY STATE EXISTS! DIC is negative")'))
    os.chdir(KT)
    sys.path.insert(0, KT)
    numpy.save('options_array.npy', numpy.array([8, 1, 0]))   # threads, Carbon_chem = 1, Methane_on = 0


def tirage(seed):
    """Un tirage Monte-Carlo : plages de main_code_parallel.py ; même rejet (non physique, masse non conservée)."""
    import warnings
    warnings.simplefilter('ignore')
    from model_functions_reformate import Forward_Model
    u = numpy.random.RandomState(seed).uniform
    for _ in range(20):
        F_outgass = u(6e12, 10e12); n = u(1.0, 2.5); alt_frac = u(0.5, 1.5); tdep_weath = u(10., 40.)
        climp = u(0.1, 0.5); W = u(2e4, 1e6); lfrac = u(0.1, 0.75); growth_timing = u(2.0, 3.0)
        carb_exp = u(0.1, 0.5); sed_thick = u(0.2, 1.0); F_carbw = u(7e12, 14e12); CWF = u(0.1, 0.999)
        deep_grad = u(0.8, 1.4); coef_for_diss = u(0.0, 0.5); beta = u(0.0, 2.0); mm = u(1.0, 2.0)
        n_out = u(0.0, 0.73); Ebas = u(60000., 100000.)
        try:
            out, imb = Forward_Model(W, F_outgass, n, climp, tdep_weath, .45e12, alt_frac, 0.01, lfrac, carb_exp,
                                     sed_thick, F_carbw, 0.0, CWF, deep_grad, coef_for_diss, beta, n_out, mm,
                                     growth_timing, 0.0, Ebas)
        except Exception:
            continue
        if numpy.isnan(out[7][98]) or out[14][98] < 0.0 or abs(imb) > 0.2:
            continue
        return numpy.array(out[4]), numpy.array(out[17])   # âge (années), T de surface (K)
    return None


if __name__ == '__main__':
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    preparer()
    with ProcessPoolExecutor(8) as ex:
        res = [r for r in ex.map(tirage, range(1, N + 1)) if r is not None]
    age = res[0][0]
    p = numpy.percentile(numpy.array([r[1] for r in res]), [2.5, 50, 97.5], axis=0) - 273.15
    print('// %d tirages retenus sur %d' % (len(res), N))
    for i in range(len(age) - 1, -1, -1):
        if age[i] > T_PHANDA:
            print('        [%.4e, %.2f, %.2f, %.2f],' % (age[i], p[0][i], p[1][i], p[2][i]))
