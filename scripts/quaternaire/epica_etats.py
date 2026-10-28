# File: CO2/scripts/quaternaire/epica_etats.py
# Desc: États 🔁 des chemins du Quaternaire (API_BILAN/config/configTimeline.js, 🦣 🕰.🛤) : masses de CO₂ et de CH₄ des carottes
#       antarctiques à la date où chaque clic arrive — moyenne des mesures à ± 1 ka, interpolation linéaire entre les deux mesures
#       voisines quand il n'y en a aucune. Âges des fichiers « avant 1950 » + 75 = avant 2025. Masses : fraction molaire d'air sec
#       (N₂ 1 PAL et O₂ de 🦣, plus le CO₂ et le CH₄ eux-mêmes) × masse molaire.
#       Sources (CO2/scripts/sources/, copies de NOAA NCEI) :
#         · antarctica2015co2composite.txt — CO₂, composite de Bereiter et al. 2015 (GRL 42:542), AICC2012
#           (sha256 de57b3967758725b9650717a71bd665ebc87e23d41d3d3ad05c9095a6e7e393f) ;
#         · edc-ch4-2008.txt — CH₄, EPICA Dome C, Loulergue et al. 2008 (Nature 453:383), EDC3
#           (sha256 f4740dd8f69a50da3d6c0edd18dbc0afd8cc078a69360d697fe5349cc0887eaf).
#       Usage (depuis CO2/scripts) : python3 -I quaternaire/epica_etats.py sources/antarctica2015co2composite.txt sources/edc-ch4-2008.txt
#       Imprime les lignes de 🔁 à recopier dans la config (chemin 🐾 : 800 → 20 ka par 20 ka ; chemin 🦘 : 21 ka) et deux contrôles.
# Version 1.0.0
# Date: [October 26, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import sys

co2 = [tuple(map(float, l.split()[:2])) for l in open(sys.argv[1]) if l[:1] in '-0123456789' and len(l.split()) == 3]
ch4 = [(float(p[1]), float(p[2])) for p in (l.split() for l in open(sys.argv[2])) if len(p) == 5 and p[4] in ('b', 'g')]
M_N2, M_O2, M_CO2, M_CH4 = 28.0134e-3, 31.9988e-3, 44.0095e-3, 16.0425e-3   # [kg/mol]
N2_KG, O2_KG = 3.878e18, 1.0815e18      # N2_1PAL_KG et ⚖️🫁 de 🦣 (configTimeline.js)

def mesure(serie, age_b2k):
    """(valeur, nombre de mesures à ± 1 ka) ; 0 mesure : interpolation entre les deux voisines."""
    a = age_b2k - 75
    v = [c for t, c in serie if abs(t - a) <= 1000]
    if v: return sum(v) / len(v), len(v)
    s = sorted(serie)
    i = max(k for k in range(len(s)) if s[k][0] <= a)
    (t0, c0), (t1, c1) = s[i], s[i + 1]
    return c0 + (c1 - c0) * (a - t0) / (t1 - t0), 0

def ligne(age):
    c, nc = mesure(co2, age); m, nm = mesure(ch4, age)
    x1, x2 = c * 1e-6, m * 1e-9
    n = (N2_KG / M_N2 + O2_KG / M_O2) / (1 - x1 - x2)   # moles d'air sec
    note = (' — CO₂ interpolé (aucune mesure à ± 1 ka)' if nc == 0 else '') + (' — CH₄ interpolé (aucune mesure à ± 1 ka)' if nm == 0 else '')
    return "{ '⚖️🏭': %.4e, '⚖️🐄': %.4e }" % (x1 * n * M_CO2, x2 * n * M_CH4), '%6s : %s ppm / %d ppb%s' % (
        '%d ka' % round(age / 1e3), ('%.1f' % c).replace('.', ','), round(m), note)

print('// contrôles : 240 ka', ligne(240e3), '— 21 ka', ligne(21e3))
print('// 🐾')
for k in range(40):
    corps, com = ligne(800e3 - 20e3 * k)
    print('                        ' + corps + (',' if k < 39 else ' ') + '   // ' + com)
print('// 🦘')
corps, com = ligne(21e3)
print('                        ' + corps + '    // ' + com)
