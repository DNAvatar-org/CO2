# File: CO2/scripts/quaternaire/epica_etats.py
# Desc: États 🔁 des chemins du Quaternaire (API_BILAN/config/configTimeline.js, 🦣 🕰.🛤) : masses de CO₂ et de CH₄ des carottes
#       antarctiques à la date où chaque clic arrive — moyenne des mesures à ± 1 ka, interpolation linéaire entre les deux mesures
#       voisines quand il n'y en a aucune. La fenêtre (± 1 ka) reste plus courte que le demi-pas de 🐾 (crash sinon) : deux clics
#       voisins ne moyennent jamais la même mesure. Âges des fichiers « avant 1950 » (AN_REFERENCE d'astronomie.js) + (AN_PRESENT − 1950) =
#       avant AN_PRESENT (config/configTimeline.js). Masses : fraction molaire d'air sec (N₂ 1 PAL et O₂ de 🦣, plus le CO₂ et le CH₄
#       eux-mêmes) × masse molaire. Constantes LUES dans le moteur (une seule référence) : masses molaires CONST.M_* de
#       physics/physics.js ; N2_1PAL_KG, ⚖️🫁 de 🦣, AN_PRESENT, BASE_HOLOCENE_AN et les dates du chemin 🐾 (CAROTTES_AGE,
#       PAS_CAROTTES_AN) dans config/configTimeline.js ; AN_REFERENCE.
#       Sources (CO2/scripts/sources/, copies de NOAA NCEI) :
#         · antarctica2015co2composite.txt — CO₂, composite de Bereiter et al. 2015 (GRL 42:542), AICC2012
#           (sha256 de57b3967758725b9650717a71bd665ebc87e23d41d3d3ad05c9095a6e7e393f) ;
#         · edc-ch4-2008.txt — CH₄, EPICA Dome C, Loulergue et al. 2008 (Nature 453:383), EDC3
#           (sha256 f4740dd8f69a50da3d6c0edd18dbc0afd8cc078a69360d697fe5349cc0887eaf).
#       Usage (depuis CO2/scripts) : python3 -I quaternaire/epica_etats.py sources/antarctica2015co2composite.txt sources/edc-ch4-2008.txt
#       Imprime les lignes de 🔁 à recopier dans la config — chemin 🐾 : de CAROTTES_AGE par pas de PAS_CAROTTES_AN jusqu'au dernier
#       qui reste dans 🦣 (800 → 15 ka par 5 ka, 158 états ; le clic suivant passe à 🛖) ; chemin 🦘 : 21 ka — et deux contrôles.
# Version 1.2.0
# - v1.2.0 (2026-10-30): chemin 🐾 par pas de 5 ka ; ses dates lues dans la config.
# - v1.1.0 (2026-10-29): masses molaires, N₂, O₂ et origines des âges lus dans le moteur (regex) ; âge avant AN_PRESENT.
# - v1.0.0 (2026-10-26): états 🔁 des deux chemins du Quaternaire.
# Date: [October 30, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import sys, os, re, math

# ── Constantes du moteur, LUES dans son code ──────────────────────────────────────────────────────────────────────────────
ICI = os.path.dirname(os.path.abspath(__file__))
source = lambda chemin: open(os.path.join(ICI, '..', '..', chemin), encoding='utf-8').read()
nombre = lambda motif, texte: float(re.search(motif, texte).group(1))
PHYSICS, TIMELINE = source('../API_BILAN/physics/physics.js'), source('../API_BILAN/config/configTimeline.js')
ASTRONOMIE = source('static/astronomie.js')
M_N2, M_O2, M_CO2, M_CH4 = (nombre(r'CONST\.M_%s\s*=\s*([\d.]+)' % g, PHYSICS) for g in ('N2', 'O2', 'CO2', 'CH4'))   # [kg/mol]
N2_KG = nombre(r'const N2_1PAL_KG\s*=\s*([\d.e+]+)', TIMELINE)                                   # [kg] N₂ 1 PAL
QUATERNAIRE = TIMELINE[TIMELINE.index("'📅': '🦣'"):]
O2_KG = nombre(r"'⚖️🫁':\s*([\d.e+]+)", QUATERNAIRE)                                               # [kg] ⚖️🫁 de 🦣
AN_PRESENT = nombre(r'window\.AN_PRESENT\s*=\s*(\d+)', TIMELINE)                                  # [an] origine des âges du moteur
AN_REFERENCE = nombre(r'const AN_REFERENCE\s*=\s*(\d+)', ASTRONOMIE)                              # [an] « avant 1950 » des carottes
BASE_HOLOCENE_AN = nombre(r'const BASE_HOLOCENE_AN\s*=\s*(-?\d+)', TIMELINE)                     # [an calendaire] ◀ de 🦣
CAROTTES_AGE = nombre(r'const CAROTTES_AGE\s*=\s*([\d.e+]+)', TIMELINE)                          # [an] premier état de 🐾
PAS_CAROTTES_AN = nombre(r'const PAS_CAROTTES_AN\s*=\s*(\d+)', TIMELINE)                         # [an] pas de 🐾
FENETRE = 1e3                                                                                      # [an] moyenne à ± FENETRE
if not FENETRE < PAS_CAROTTES_AN / 2:
    raise SystemExit('fenêtre ± %g ans ≥ demi-pas de 🐾 (%g ans) : deux clics voisins moyenneraient les mêmes mesures' % (FENETRE, PAS_CAROTTES_AN / 2))

co2 = [tuple(map(float, l.split()[:2])) for l in open(sys.argv[1]) if l[:1] in '-0123456789' and len(l.split()) == 3]
ch4 = [(float(p[1]), float(p[2])) for p in (l.split() for l in open(sys.argv[2])) if len(p) == 5 and p[4] in ('b', 'g')]

def mesure(serie, age):
    """(valeur, nombre de mesures à ± FENETRE) à l'âge (années avant AN_PRESENT) ; 0 mesure : interpolation entre les deux voisines."""
    a = age - (AN_PRESENT - AN_REFERENCE)   # années avant 1950, l'âge des fichiers
    v = [c for t, c in serie if abs(t - a) <= FENETRE]
    if v: return sum(v) / len(v), len(v)
    s = sorted(serie)
    i = max(k for k in range(len(s)) if s[k][0] <= a)
    (t0, c0), (t1, c1) = s[i], s[i + 1]
    return c0 + (c1 - c0) * (a - t0) / (t1 - t0), 0

def ligne(age):
    c, nc = mesure(co2, age); m, nm = mesure(ch4, age)
    x1, x2 = c * 1e-6, m * 1e-9
    n = (N2_KG / M_N2 + O2_KG / M_O2) / (1 - x1 - x2)   # moles d'air sec
    aucune = ' interpolé (aucune mesure à ± %g ka)' % (FENETRE / 1e3)
    note = (' — CO₂' + aucune if nc == 0 else '') + (' — CH₄' + aucune if nm == 0 else '')
    return "{ '⚖️🏭': %.4e, '⚖️🐄': %.4e }" % (x1 * n * M_CO2, x2 * n * M_CH4), '%6s : %s ppm / %d ppb%s' % (
        '%d ka' % round(age / 1e3), ('%.1f' % c).replace('.', ','), round(m), note)

print('// contrôles : 240 ka', ligne(240e3), '— 21 ka', ligne(21e3))
# 🐾 : les états des clics qui restent dans 🦣 — le premier (CAROTTES_AGE), puis N_PAS_CAROTTES pas de PAS_CAROTTES_AN (même
# formule que la config ; elle crashe si le nombre d'états ne suit pas sa séquence) ; le clic suivant passe à 🛖.
N_PAS = math.ceil((CAROTTES_AGE - (AN_PRESENT - BASE_HOLOCENE_AN)) / PAS_CAROTTES_AN) - 1
print('// 🐾 : %d états' % (N_PAS + 1))
for k in range(N_PAS + 1):
    corps, com = ligne(CAROTTES_AGE - PAS_CAROTTES_AN * k)
    print('                        ' + corps + (',' if k < N_PAS else ' ') + '   // ' + com)
print('// 🦘')
corps, com = ligne(21e3)
print('                        ' + corps + '    // ' + com)
