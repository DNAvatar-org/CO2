# File: CO2/scripts/paleogeo/paleodem_zones.py
# Desc: Table zonale de paléogéographie pour le moteur : pour chaque carte PaleoDEM (Scotese & Wright 2018, 1° × 1°, tous les
#       5 Ma de 0 à 540 Ma, CC-BY 4.0) et chaque bande de latitude (0–30°, 30–60°, 60–90°, par hémisphère), la part de CONTINENT
#       (socle au-dessus de −1 000 m, milieu du creux de l'hypsométrie entre continents et bassins), la part ÉMERGÉE (socle
#       au-dessus de la mer) et le continent de la bande découpé en CELLULES : TRANCHES de latitude de 5° × CLASSES de socle (bornes
#       SOCLE_BORNES_M), avec l'aire, la latitude et le socle moyens de chaque cellule. Ce sont les deux variables dont dépend le
#       bilan de masse d'un point dans le moteur (zonal : latitude et altitude) ; le moteur (physics/calottes.js) range les cellules
#       par le bilan du sol nu et y pose ses calottes, des dômes plastiques sur un socle à l'équilibre d'Airy,
#         τ = ρ_i g H |∇z_s|, z_s = socle déchargé + (1 − ρ_i/ρ_m) H  ⇒  H = √(2 τ s / (ρ_i g (1 − ρ_i/ρ_m))),
#       s = distance à la marge (Nye 1952 ; solution de |∇(H²)| = constante, nulle sur la marge) ; un dôme de rayon R = √(S/π)
#       a le volume V = (8π/15) C R^(5/2), C = √(2 τ / (ρ_i g (1 − ρ_i/ρ_m))) : V ∝ S^(5/4). Le seuil τ est fermé ici sur le
#       volume et l'aire posés de l'Antarctique par la loi du dôme (celle du moteur) et écrit dans la table : le moteur le lit tel
#       quel. Il faut au moteur le socle SANS glace, déchargé. Or les PaleoDEM portent l'Antarctique au socle actuel CHARGÉ par sa
#       glace (copies tournées du socle de 0 Ma) et le Groenland à la SURFACE de sa glace. Une seule règle pour les deux calottes,
#       MÊME CROÛTE : la glace de 0 Ma est retirée cellule par cellule (ANTARCTIQUE, GROENLAND, DÉCHARGE) et, sur les cartes qui
#       copient la carte de 0 Ma, l'empreinte transportée par la rotation reçoit ce socle déchargé (RECALAGE).
#       Écrit API_BILAN/data/paleogeo_zones.js.
#       Usage : python3 -I paleodem_zones.py <dossier des CSV PaleoDEM> <sortie .js>
#       Données : https://www.earthbyte.org/paleodem-resource-scotese-and-wright-2018/ (PaleoDEMS_long_lat_elev_csv_v2.zip)
# Version 1.6.2
# - v1.6.2 (2026-10-31): maille des trapèzes jusqu'au pôle (poids nul au pôle) ; seuil du continent écrit dans la table
#   (socle_continent_m).
# - v1.6.1 (2026-10-30): parts écrites en cent-millièmes par plus grands restes : la somme d'une bande est celle des parts
#   exactes (terre d'avant 540 Ma = 1, continent ≤ 1).
# Date: [October 31, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import sys, os, re, glob, math, json
import numpy as np

# ── Constantes du moteur, LUES dans son code (une seule référence) ────────────────────────────────────────────────────────────
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'API_BILAN')
source = lambda chemin: open(os.path.join(API, chemin), encoding='utf-8').read()
nombre = lambda motif, texte: float(re.search(motif, texte).group(1))
PHYSICS, CALOTTES, TIMELINE = source('physics/physics.js'), source('physics/calottes.js'), source('config/configTimeline.js')
RHO_GLACE = nombre(r'CONST\.RHO_GLACE\s*=\s*([\d.]+)', PHYSICS)     # CONST.RHO_GLACE
RHO_EAU_MER = nombre(r'CONST\.RHO_EAU_MER\s*=\s*([\d.]+)', PHYSICS)  # CONST.RHO_EAU_MER — ❔ valeur de surface pour toute la colonne
RHO_MANTEAU = nombre(r'RHO_MANTEAU:\s*([\d.]+)', CALOTTES)          # CALOTTES.K.RHO_MANTEAU
ACTUEL = TIMELINE[TIMELINE.index("'📅': '📱'"):]                    # époque 📱
R_KM = nombre(r"'📐':\s*([\d.]+)", ACTUEL)
G = nombre(r"'🍎':\s*([\d.]+)", ACTUEL)
# Glace posée actuelle MESURÉE : volume et aire de chaque calotte. Aires : CALOTTES_ACTUELLES (part de la bande polaire,
# configTimeline.js) × aire d'une bande 60–90° — Antarctique : Bedmap2 (Fretwell et al. 2013, The Cryosphere 7:375, tab. 7) ;
# Groenland : inlandsis sans les glaciers et calottes locales (Citterio & Ahlstrøm 2013, The Cryosphere 7:445).
# Zones du moteur (EARTH.ZONES, physics.js : bornes en x = sin φ, écrites 0, 1 ou Math.sin(Math.PI / n)) : latitudes exactes [°].
LAT_BORNE = {'0': 0.0, '1': 90.0}
def degres(x):
    """Borne d'EARTH.ZONES (texte JS) → latitude [°] ; une écriture inconnue crashe (KeyError qui la nomme)."""
    n = re.fullmatch(r'Math\.sin\(Math\.PI / (\d+)\)', x.strip())
    return LAT_BORNE[x.strip()] if n is None else 180 / int(n.group(1))
ZONES = [(c, degres(a), degres(b)) for c, a, b in
         re.findall(r"\{ cle: '(\w+)', x0: (.+?), x1: (.+?) \}", re.search(r'EARTH\.ZONES = \[(.*?)\];', PHYSICS, re.S).group(1))]
ACTUELLES = re.search(r'const CALOTTES_ACTUELLES = \{([^}]*)\}', TIMELINE).group(1)
_, POL_BAS, POL_HAUT = ZONES[-1]                                 # zone polaire : la dernière (équateur → pôle)
A_POLAIRE_KM2 = 2 * math.pi * R_KM ** 2 * (math.sin(math.radians(POL_HAUT)) - math.sin(math.radians(POL_BAS)))
A_ANTARCTIQUE_KM2 = nombre(r'S_pol:\s*([\d.]+)', ACTUELLES) * A_POLAIRE_KM2
A_GROENLAND_KM2 = nombre(r'N_pol:\s*([\d.]+)', ACTUELLES) * A_POLAIRE_KM2
V_ANTARCTIQUE_KM3 = 26.54e6     # Bedmap2 (Fretwell et al. 2013, tab. 7), plates-formes exclues
V_GROENLAND_KM3 = 2.99e6        # BedMachine v3 (Morlighem et al. 2017, GRL 44:11051) : « total ice volume of 2.99 ± 0.02 10⁶ km³ »
ISO = RHO_GLACE / RHO_MANTEAU   # rebond d'Airy par mètre de glace retirée
PLASTIQUE = 2 / (RHO_GLACE * G * (1 - ISO))   # [m/Pa] loi plastique sur socle d'Airy : H² = PLASTIQUE · τ · s
def volume_dome_km3(tau, aire_km2):
    """Volume [km³] du dôme plastique d'aire S sur socle d'Airy : (8π/15) √(PLASTIQUE τ) R^(5/2), R = √(S/π) [m]."""
    return 8 * math.pi / 15 * math.sqrt(PLASTIQUE * tau) * math.sqrt(aire_km2 * 1e6 / math.pi) ** 2.5 / 1e9

SEUIL_CONTINENT_M = -1000
SEUIL_CHARGEE = 0.6             # corrélation après recalage : copie du socle de 0 Ma (0,70–0,85 de 5 à 80 Ma) ou reconstruction (≤ 0,50)
AGE_MAX_RECALAGE = 120          # au-delà, aucune carte n'est touchée
# Bandes : chaque zone dans chaque hémisphère (noms de CALOTTES.BANDES), du pôle Sud au pôle Nord.
BANDES = [('S_' + c, -b, -a) for c, a, b in reversed(ZONES)] + [('N_' + c, a, b) for c, a, b in ZONES]
# Cellules d'une bande : TRANCHES de latitude d'égale largeur (5°) × classes de socle (bornes [m], classe k : borne k−1 < z ≤
# borne k ; la classe d'au-dessus de 0 m est la première émergée) — résolution : 5° de latitude valent ~2 K de T₂ P₂ et ±250 m
# de socle ~±1,6 K de l'adiabatique, l'écart que le bilan d'une cellule résout.
TRANCHES = 6
SOCLE_BORNES_M = [-200, 0, 250, 500, 1000, 1500, 2500]
NCLASSES = len(SOCLE_BORNES_M) + 1

# ── Grille ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
LAT, LON = np.arange(-90, 91), np.arange(-180, 181)
LA, LO = np.meshgrid(LAT, LON, indexing='ij')
CELLULE_KM2 = (math.pi / 180 * R_KM) ** 2                       # cellule de 1° × 1° à l'équateur (× cos φ)
vecteur = lambda la, lo: np.stack([np.cos(np.radians(la)) * np.cos(np.radians(lo)), np.cos(np.radians(la)) * np.sin(np.radians(lo)),
                                   np.sin(np.radians(la))], -1)
P = vecteur(LA, LO)                                              # (181, 361, 3) : position de chaque cellule

def lire(f):
    """Grille 181 × 361 (lat −90..90, lon −180..180) d'une carte : z [m], NaN hors du fichier et sur le code de remplissage
    (z ≥ 9 000) ; present = cellule écrite dans le fichier. Le méridien ±180 a deux colonnes (−180 et +180) sur les cartes de
    361 colonnes, la seule −180 sur celles de 360 (150 à 395 Ma) : deux demi-échantillons ou un échantillon du même méridien."""
    t = np.array([l.split(',') for l in open(f) if l[0].isdigit() or l[0] == '-'], dtype=float)
    i, j = np.rint(t[:, 1] + 90).astype(int), np.rint(t[:, 0] + 180).astype(int)   # latitudes arrondies (équateur à −1e-14)
    present = np.zeros(LA.shape, bool); present[i, j] = True
    assert present.sum() == len(t), f'{f} : cellule écrite deux fois'
    z = np.full(LA.shape, np.nan); z[i, j] = np.where(t[:, 2] < 9000, t[:, 2], np.nan)
    return z, present

# Aire d'une maille de la grille, en cellules de 1° × 1° à l'équateur : la règle des TRAPÈZES en latitude, celle des limites de
# bandes et de tranches (LIGNES, tranches : une ligne frontière compte pour moitié de chaque côté) — poids cos φ à chaque ligne,
# et au pôle ½ cos 90° = 0 : l'aire autour du pôle est portée par les lignes voisines. Une ligne polaire au poids cos 89,5° (une
# bande de 1° centrée sur 89,5°, qui dépasse le pôle) comptait en plus une calotte que les trapèzes comptent déjà : +4 % sur la
# tranche 85–90° de chaque bande polaire, une part de terre de 1,04 sous l'Antarctique.
MAILLE = np.where(np.abs(LA) == 90, 0.0, np.cos(np.radians(LA)))

def poids(present):
    """Aire de chaque cellule [km²] : MAILLE (trapèzes en latitude, 0 au pôle) ; méridien ±180 par la règle des trapèzes — ½ à
    chaque colonne quand la carte a les deux, 1 à −180 quand elle est seule. Le poids se lit sur la grille, pas sur les valeurs."""
    w = MAILLE * CELLULE_KM2 * present
    deux = present[:, 0] & present[:, 360]
    w[deux, 0] /= 2; w[deux, 360] /= 2
    return w

# Lignes de latitude frontières entre deux bandes (−60, −30, 0, 30, 60) : une demi-ligne de chaque côté (trapèzes).
FRONTIERES = [b for _, _, b in BANDES[:-1]]
LIGNES = {n: (((LAT >= a) & (LAT <= b)) * np.where(np.isin(LAT, FRONTIERES), 0.5, 1.0))[:, None] for n, a, b in BANDES}

def composante(permis, graine):
    """Cellules de `permis` reliées à `graine` par leurs côtés (méridien ±180 raccordé, chaque pôle est un point)."""
    m = graine & permis
    while True:
        v = m.copy()
        v[1:] |= m[:-1]; v[:-1] |= m[1:]
        v[:, 1:] |= m[:, :-1]; v[:, :-1] |= m[:, 1:]
        v[:, 0] |= m[:, 360] | m[:, 359]; v[:, 360] |= m[:, 0] | m[:, 1]
        v[:, 1] |= m[:, 360]; v[:, 359] |= m[:, 0]
        v[0] |= m[0].any(); v[-1] |= m[-1].any()
        v &= permis
        if (v == m).all(): return m
        m = v

def marge(m):
    """Milieux des côtés de cellule qui séparent m du reste : (N, 3) vecteurs unitaires."""
    pts = [vecteur(LAT[i] + 0.5, LON[j]) for i, j in np.argwhere(m[:-1] != m[1:])]
    pts += [vecteur(LAT[i], LON[j] + 0.5) for i, j in np.argwhere(m[:, :-1] != m[:, 1:])]
    pts += [vecteur(LAT[i], 180.0) for i in np.nonzero(m[:, 0] != m[:, 360])[0]]
    return np.array(pts)

def distance_km(points, cibles):
    """Distance de grand cercle de chaque point à la cible la plus proche."""
    return np.concatenate([np.arccos(np.clip((points[k:k + 1000] @ cibles.T).max(1), -1, 1))
                           for k in range(0, len(points), 1000)]) * R_KM

def distances(continent):
    """Distance [km] de chaque cellule du continent à son bord, la mer (0 ailleurs). Le rivage se lit sur une grille où le
    méridien ±180 est la colonne −180 (la colonne +180, absente des cartes de 360 colonnes, est le même méridien) et où chaque
    pôle est un point (continent si l'une de ses cellules l'est) : ni le méridien ±180 ni un pôle ne sont des rivages."""
    m = continent.copy()
    m[:, 360] = m[:, 0]
    m[0], m[-1] = m[0].any(), m[-1].any()
    D = np.zeros(LA.shape)
    D[continent] = distance_km(P[continent], marge(m))
    return D

def racine(f, bas, haut):
    """Zéro de f croissante sur [bas, haut], par bisection."""
    for _ in range(60):
        milieu = (bas + haut) / 2
        bas, haut = (bas, milieu) if f(milieu) > 0 else (milieu, haut)
    return (bas + haut) / 2

def rotation(a, b, g):
    """Rotation rigide : x de a°, puis y de b°, puis z de g°."""
    a, b, g = np.radians([a, b, g])
    Rx = np.array([[1, 0, 0], [0, np.cos(a), -np.sin(a)], [0, np.sin(a), np.cos(a)]])
    Ry = np.array([[np.cos(b), 0, np.sin(b)], [0, 1, 0], [-np.sin(b), 0, np.cos(b)]])
    Rz = np.array([[np.cos(g), -np.sin(g), 0], [np.sin(g), np.cos(g), 0], [0, 0, 1]])
    return Rz @ Ry @ Rx

def plus_proche(Q, present):
    """Indices (i, j) de la cellule la plus proche de chaque vecteur de Q ; méridien ±180 : la colonne +180 si la carte l'a."""
    la = np.degrees(np.arcsin(np.clip(Q[..., 2], -1, 1))); lo = np.degrees(np.arctan2(Q[..., 1], Q[..., 0]))
    i, j = np.rint(la + 90).astype(int), np.rint(lo + 180).astype(int)
    return i, np.where(present[i, j], j, j % 360)

VOISINS = np.array([d for d in np.ndindex(3, 3, 3) if d != (1, 1, 1)]) - 1   # les 26 voisins d'un point de l'espace des angles
PAS_MIN = 0.125                                                   # [°] pas le plus fin de la recherche par motifs

def recaler(src, z_src, w_src, z, present, grilles, departs):
    """Rotation rigide qui maximise la corrélation pondérée (w_src : aire) entre z_src aux points src et la carte z. Grilles
    (centre (x, y, z), demi-étendue x/y, demi-étendue z, pas, en degrés), puis recherche par motifs depuis les `departs` meilleurs
    points de chaque grille et ses `departs` plus hauts pics (points qui dépassent leurs 26 voisins : d'autres bassins) — r, lu à
    la plus proche cellule, est rugueux : on va au meilleur des 26 voisins au pas courant tant qu'il améliore r, puis le pas est
    divisé par deux, jusqu'à PAS_MIN. Rend les angles, (r, Δz̄ carte − 0 Ma, pente de la carte sur 0 Ma) et r sans rotation."""
    def ecart(R):
        v = z[plus_proche(src @ R.T, present)]
        ok = ~np.isnan(v)                                        # cellule sans donnée (remplissage) : hors de la corrélation
        x, y, w = z_src[ok], v[ok], w_src[ok]
        mx, my = np.average(x, weights=w), np.average(y, weights=w)
        cxy, cxx, cyy = (np.average(p * q, weights=w) for p, q in ((x - mx, y - my), (x - mx, x - mx), (y - my, y - my)))
        return cxy / math.sqrt(cxx * cyy), my - mx, cxy / cxx
    r = lambda angles: ecart(rotation(*angles))[0]
    debuts = []
    for (a0, b0, g0), exy, ez, pas in grilles:
        xy, zz = np.arange(-exy, exy + pas / 2, pas), np.arange(-ez, ez + pas / 2, pas)
        points = np.array([(a, b, g) for g in g0 + zz for a in a0 + xy for b in b0 + xy])
        rs = np.array([r(p) for p in points])
        cube = rs.reshape(len(zz), len(xy), len(xy))
        bord = np.pad(cube, 1, constant_values=-np.inf)
        pic = np.all([cube >= bord[1 + i:1 + i + cube.shape[0], 1 + j:1 + j + cube.shape[1], 1 + k:1 + k + cube.shape[2]]
                      for i, j, k in VOISINS], 0).ravel()
        haut = np.argsort(-rs, kind='stable')
        debuts += [(rs[k], points[k], pas / 2) for k in np.concatenate([haut[:departs], haut[pic[haut]][:departs]])]
    fins = []
    for r0, p, pas in debuts:
        while pas >= PAS_MIN:
            voisins = p + pas * VOISINS
            rv = np.array([r(v) for v in voisins])
            k = np.argmax(rv)
            if rv[k] > r0: r0, p = rv[k], voisins[k]
            else: pas /= 2
        fins.append((r0, p))
    _, (a, b, g) = max(fins, key=lambda f: f[0])                 # à r égal, le premier départ (meilleur point des grilles)
    return (a, b, g), ecart(rotation(a, b, g)), ecart(np.eye(3))[0]

def transporter(champ, R, present0):
    """Champ de la carte de 0 Ma porté sur la grille d'une carte tournée de R (plus proche cellule de 0 Ma)."""
    return champ[plus_proche(P @ R, present0)]                   # P @ R = Rᵀ appliquée à chaque position

# ── Lecture ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
FICHIERS = {int(re.search(r'_(\d+)Ma', f).group(1)): f for f in glob.glob(os.path.join(sys.argv[1], 'Map*.csv'))}
CARTES = {age: lire(f) for age, f in sorted(FICHIERS.items())}
print(f'moteur : ρ_i {RHO_GLACE:.0f}, ρ_eau de mer {RHO_EAU_MER:.0f}, ρ_m {RHO_MANTEAU:.0f} kg/m³ ; g {G} m/s² ; R {R_KM:.0f} km')
Z0, PRESENT0 = CARTES[0]
W0 = poids(PRESENT0)
VALIDE0 = ~np.isnan(Z0)
AIRE0 = W0 * VALIDE0

# ── DÉCHARGE (règle commune aux deux calottes) ──────────────────────────────────────────────────────────────────────────────
# Retirer une glace posée H d'un socle chargé b : rebond d'Airy u = b + ρ_i/ρ_m · H. Un socle qui reste sous la mer se recharge
# de la colonne d'eau de mer qui remplace la glace (Airy) : z = u / (1 − ρ_eau/ρ_m). Les cellules sans glace posée (mer libre,
# plates-formes flottantes) portent déjà leur eau : intactes.
def decharger(b, H):
    u = b + ISO * H
    return np.where((H > 0) & (u < 0), u / (1 - RHO_EAU_MER / RHO_MANTEAU), u)

# ── GROENLAND (carte de 0 Ma : surface s de l'inlandsis) ────────────────────────────────────────────────────────────────────
# Terre : composante des cellules z > 0 qui contient (−40°, 72°), coupée au détroit de Nares (côté Ellesmere). Inlandsis : les
# cellules de surface la plus haute jusqu'à l'aire mesurée. Socle chargé UNIFORME b̄ fermé sur le volume mesuré : b̄ = s̄ − V/A,
# H = s − b̄, socle déchargé par la règle commune (⚠️ socle chargé uniforme : la répartition sous la glace n'est pas connue
# cellule par cellule ; le volume, donc le socle moyen, est exact).
NARES = (LO < -73) | ((LA >= 80) & (LO < -67)) | ((LA >= 81) & (LO < -64)) | ((LA >= 82) & (LO < -61))
GROENLAND = composante(VALIDE0 & (Z0 > 0) & ~NARES, (LA == 72) & (LO == -40))
ordre = np.argsort(-Z0[GROENLAND], kind='stable')
cumul = np.cumsum(AIRE0[GROENLAND][ordre])
dans = np.zeros(GROENLAND.sum(), bool); dans[ordre[cumul - AIRE0[GROENLAND][ordre] < A_GROENLAND_KM2]] = True
INLANDSIS = np.zeros(LA.shape, bool); INLANDSIS[GROENLAND] = dans
A_INL = AIRE0[INLANDSIS].sum()
S_INL = np.average(Z0[INLANDSIS], weights=AIRE0[INLANDSIS])
B_GROENLAND = S_INL - V_GROENLAND_KM3 / A_INL * 1e3
H_GR = np.where(INLANDSIS, Z0 - B_GROENLAND, 0.0)
assert H_GR[INLANDSIS].min() > 0, 'inlandsis : surface sous le socle chargé moyen'
SOCLE_GR0 = decharger(B_GROENLAND, H_GR)                         # socle déchargé de 0 Ma (lu sur INLANDSIS)
print(f'Groenland 0 Ma : terre {AIRE0[GROENLAND].sum() / 1e6:.3f} Mkm² ; inlandsis {A_INL / 1e6:.4f} Mkm² (mesuré {A_GROENLAND_KM2 / 1e6:.4f}), '
      f's ≥ {Z0[INLANDSIS].min():.0f} m, s̄ {S_INL:.0f} m ; b̄ = {B_GROENLAND:.0f} m ; H {H_GR[INLANDSIS].min():.0f}–{H_GR.max():.0f} m '
      f'(H̄ {V_GROENLAND_KM3 / A_INL * 1e3:.0f}) ; socle déchargé z̄_u {np.average(SOCLE_GR0[INLANDSIS], weights=AIRE0[INLANDSIS]):.0f} m, '
      f'min {SOCLE_GR0[INLANDSIS].min():.0f} m')

# ── ANTARCTIQUE (carte de 0 Ma, socle chargé b) ──────────────────────────────────────────────────────────────────────────────
# Continent : composante du pôle Sud, au sud de 60° S, des cellules qui ne sont pas l'océan ouvert (cellules ≤ −1 000 m reliées
# à la mer du Sud par 50° S). Elle comprend les FOSSES INTÉRIEURES (≤ −1 000 m sous la glace, non reliées à l'océan) : elles font
# partie du continent déchargé. Le continent de la carte de 0 Ma tel que le moteur le lit (même croûte : l'Antarctique et
# l'inlandsis sont du continent) ne dépend pas de la glace. Le seuil τ est fermé par la loi du MOTEUR, le dôme plastique :
# V = (8π/15) C R^(5/2), R = √(S/π), sur le volume et l'aire posés de Bedmap2 — une équation, une inconnue. ⚠️ L'aire passe de
# contrôle à entrée : sans elle, le dôme n'a pas de taille (le socle à −1 000 m borne aussi le plateau continental libre de glace
# et les plates-formes flottantes, la carte ne dit pas où la glace est posée). ❔ τ uniforme : un seul seuil de cisaillement
# sur tout le continent (fleuves de glace et plates-formes compris : un τ EFFECTIF).
# Glace retirée de la carte (DÉCHARGE) : la même loi et le même τ sur l'empreinte réelle, H = √(2 τ s / (ρ_i g (1 − ρ_i/ρ_m))),
# s = D − d₀ : une calotte marine a sa marge le long de la côte, à d₀ du bord du continent (D : distance de grand cercle à la
# mer), posée là où la glace ne flotte pas (ρ_i H > ρ_eau · (−b), eau de mer) ; d₀ fermé sur l'aire posée. Le volume retiré
# n'est pas fermé : il mesure (🎯) l'écart entre le dôme du moteur et l'empreinte réelle.
OCEAN0 = composante(VALIDE0 & (Z0 <= SEUIL_CONTINENT_M), LA == -50)
ANT = composante(VALIDE0 & ~OCEAN0 & (LA < -60), LA == -90)
FOSSES = ANT & (Z0 <= SEUIL_CONTINENT_M)
CONTINENT0 = VALIDE0 & ((Z0 > SEUIL_CONTINENT_M) | ANT | INLANDSIS)
D0_KM = distances(CONTINENT0)
TAU_PA = (V_ANTARCTIQUE_KM3 / volume_dome_km3(1.0, A_ANTARCTIQUE_KM2)) ** 2      # V ∝ √τ : fermé exactement

def epaisseur(tau, D, d0):
    """Épaisseur [m] de la loi plastique sur socle d'Airy au seuil τ [Pa], distance à la mer D et recul de la marge d0 [km]."""
    return np.sqrt(PLASTIQUE * tau * np.maximum(D - d0, 0) * 1e3)

def glace(tau, d0):
    """Épaisseur posée [m] sur l'Antarctique (0 hors du continent, sur l'eau)."""
    H = epaisseur(tau, D0_KM, d0)
    return np.where(ANT & (H > 0) & (RHO_GLACE * H > -RHO_EAU_MER * Z0), H, 0.0)

volume_km3 = lambda tau, d0: (glace(tau, d0) * AIRE0).sum() / 1e3
aire_km2 = lambda tau, d0: AIRE0[glace(tau, d0) > 0].sum()
D0_RECUL_KM = racine(lambda d0: A_ANTARCTIQUE_KM2 - aire_km2(TAU_PA, d0), 0, D0_KM[ANT].max())
H_ANT = glace(TAU_PA, D0_RECUL_KM)
pose = H_ANT > 0
A_POSEE = AIRE0[pose].sum()
V_RETIRE_KM3 = volume_km3(TAU_PA, D0_RECUL_KM)
SOCLE_ANT0 = decharger(Z0, H_ANT)                                # socle déchargé de 0 Ma (lu sur ANT)
SOUS_MER = ANT & pose & (Z0 + ISO * H_ANT < 0)                   # posé, resté sous la mer après rebond : rechargé d'eau
print(f'Antarctique 0 Ma : continent {AIRE0[ANT].sum() / 1e6:.3f} Mkm² (fosses intérieures {AIRE0[FOSSES].sum() / 1e6:.3f}, '
      f'z̄ {np.average(Z0[FOSSES], weights=AIRE0[FOSSES]):.0f} m), au nord jusqu\'à {LAT[np.nonzero(ANT.any(1))[0].max()]}° ; '
      f'distance à la mer ≤ {D0_KM[ANT].max():.0f} km')
print(f'  τ fermé par le dôme sur Bedmap2 : {TAU_PA / 1e3:.2f} kPa → {volume_dome_km3(TAU_PA, A_ANTARCTIQUE_KM2) / 1e6:.4f}e6 km³ '
      f'({V_ANTARCTIQUE_KM3 / 1e6:.2f}e6) sur {A_ANTARCTIQUE_KM2 / 1e6:.4f}e6 km², rayon {math.sqrt(A_ANTARCTIQUE_KM2 / math.pi):.0f} km')
print(f'  glace retirée (même loi, même τ, empreinte réelle) : marge reculée d₀ {D0_RECUL_KM:.1f} km, aire posée '
      f'{A_POSEE / 1e6:.4f}e6 km² → 🎯 {V_RETIRE_KM3 / 1e6:.3f}e6 km³ ({100 * (V_RETIRE_KM3 / V_ANTARCTIQUE_KM3 - 1):+.1f} % de Bedmap2) ; '
      f'au-delà de d₀ mais à flot : {AIRE0[ANT & (D0_KM > D0_RECUL_KM) & ~pose].sum() / 1e6:.3f} Mkm²')
print(f'  H̄ {np.average(H_ANT[pose], weights=AIRE0[pose]):.0f} m (V/A {V_ANTARCTIQUE_KM3 / A_ANTARCTIQUE_KM2 * 1e3:.0f}), '
      f'H max {H_ANT.max():.0f} m ; surface au-dessus du socle déchargé (1 − ρ_i/ρ_m) H̄ {(1 - ISO) * np.average(H_ANT[pose], weights=AIRE0[pose]):.0f} m')
print(f'  socle moyen du continent : chargé {np.average(Z0[ANT], weights=AIRE0[ANT]):.0f} m → rebond '
      f'{np.average(Z0[ANT] + ISO * H_ANT[ANT], weights=AIRE0[ANT]):.1f} m → recharge d\'eau '
      f'{np.average(SOCLE_ANT0[ANT], weights=AIRE0[ANT]):.1f} m (posé sous la mer après rebond : {AIRE0[SOUS_MER].sum() / 1e6:.3f} Mkm²) ; '
      f'rebond max {ISO * H_ANT.max():.0f} m ; continent encore ≤ −1 000 m : {AIRE0[ANT & (SOCLE_ANT0 <= SEUIL_CONTINENT_M)].sum() / 1e6:.3f} Mkm²')

# 🎯 Groenland : le dôme du moteur, même loi et même τ, à l'aire mesurée de l'inlandsis ; comparé à BedMachine, rien n'y est fermé.
V_GR_PREDIT_KM3 = volume_dome_km3(TAU_PA, A_GROENLAND_KM2)
print(f'  🎯 Groenland, dôme de même loi et même τ sur {A_GROENLAND_KM2 / 1e6:.4f}e6 km² : {V_GR_PREDIT_KM3 / 1e6:.3f}e6 km³ '
      f'(BedMachine {V_GROENLAND_KM3 / 1e6:.2f}e6, {100 * (V_GR_PREDIT_KM3 / V_GROENLAND_KM3 - 1):+.0f} %)')

# ── RECALAGE et MÊME CROÛTE ──────────────────────────────────────────────────────────────────────────────────────────────────
# Une carte qui copie la carte de 0 Ma (tournée de quelques degrés par la reconstruction) porte la même croûte : l'empreinte de
# la calotte de 0 Ma, transportée par la rotation (plus proche cellule), y reçoit le socle déchargé de 0 Ma transporté ; hors
# de l'empreinte, la carte est intacte. ⚠️ Le relief propre de la carte sous l'empreinte est remplacé (15–25 Ma : basses terres
# antarctiques relevées par la reconstruction).
# Antarctique : rotation rigide (3 angles) qui maximise la corrélation pondérée par l'aire entre le continent de 0 Ma (socle
# chargé, fosses comprises) et la carte : grille grossière (pas de 4°) et grille fine (pas de 1°) autour de la rotation de la carte
# précédente (le pic de corrélation d'une copie est large d'environ 1°), puis recherche par motifs jusqu'à 1/8°. Copie si
# r ≥ SEUIL_CHARGEE ; au-delà de 80 Ma, Scotese passe de la copie du socle actuel à une reconstruction (⚠️ marche entre 80 et
# 85 Ma : propriété des PaleoDEM). Empreinte : tout le continent, fosses intérieures comprises (elles restent du continent).
# Groenland : les cartes de 5 et 10 Ma montrent la surface de l'inlandsis (recalées sur 0 Ma, pente 0,75–0,87) ; dès 15 Ma, le
# socle (intactes ; 15 et 20 Ma imprimées en preuve : plus basses de 850 à 1 950 m et plus plates que la surface de 0 Ma, pente
# 0,43–0,52). Empreinte : l'inlandsis.
EMPREINTE = {age: np.zeros(LA.shape, bool) for age in CARTES}   # cellules qui reçoivent le socle déchargé de 0 Ma
SOCLE_U = {age: np.full(LA.shape, np.nan) for age in CARTES}    # ce socle [m]

def meme_croute(age, empreinte0, socle0, R):
    e = transporter(empreinte0, R, PRESENT0)
    EMPREINTE[age] |= e
    SOCLE_U[age] = np.where(e, transporter(socle0, R, PRESENT0), SOCLE_U[age])
    return e

CHARGEES, precedente = [], (0, 0, 0)
print('recalage antarctique (r fixe → r tourné, rotation x/y/z, Δz̄ carte − 0 Ma, pente ; empreinte : z̄ carte → socle déchargé) :')
for age in [a for a in CARTES if a <= AGE_MAX_RECALAGE]:
    z, present = CARTES[age]
    (a, b, g), (r, dz, pente), r_fixe = recaler(P[ANT], Z0[ANT], AIRE0[ANT], z, present,
                                                ([(0, 0, 0), 20, 40, 4], [precedente, 5, 5, 1]), 6)
    precedente = (a, b, g)
    chargee = r >= SEUIL_CHARGEE
    print(f'  {age:3d} Ma  r {r_fixe:.3f} → {r:.3f}  ({a:+7.3f}° {b:+7.3f}° {g:+7.3f}°)  Δz̄ {dz:+5.0f} m  pente {pente:.2f}  '
          f'{"CHARGÉE" if chargee else "non chargée"}', end='')
    if chargee:
        e = meme_croute(age, ANT, SOCLE_ANT0, rotation(a, b, g)) & ~np.isnan(z)
        w = poids(present)[e]
        print(f'  empreinte {w.sum() / 1e6:.3f} Mkm² : {np.average(z[e], weights=w):+5.0f} → {np.average(SOCLE_U[age][e], weights=w):+5.0f} m', end='')
        CHARGEES.append(age)
    print()
GROENLAND_SURFACE_MA = (0, 5, 10)
print('recalage du Groenland :')
for age in GROENLAND_SURFACE_MA + (15, 20):
    z, present = CARTES[age]
    (a, b, g), (r, dz, pente), r_fixe = recaler(P[GROENLAND], Z0[GROENLAND], AIRE0[GROENLAND], z, present,
                                                ([(0, 0, 0), 6, 6, 1],), 6)
    print(f'  {age:3d} Ma  r {r_fixe:.3f} → {r:.3f}  ({a:+7.3f}° {b:+7.3f}° {g:+7.3f}°)  Δz̄ {dz:+5.0f} m  pente {pente:.2f}'
          f'{"  → socle déchargé de 0 Ma" if age in GROENLAND_SURFACE_MA else "  (socle : intacte)"}')
    if age in GROENLAND_SURFACE_MA:
        meme_croute(age, INLANDSIS, SOCLE_GR0, rotation(a, b, g))

# ── CELLULES : TRANCHES DE LATITUDE × CLASSES DE SOCLE ──────────────────────────────────────────────────────────────────────
# Tranche j d'une bande : |φ| entre φ_bas + j Δ et φ_bas + (j + 1) Δ, Δ = largeur de la bande / TRANCHES ; une ligne de latitude
# frontière de deux tranches compte pour moitié dans chacune (trapèzes, comme LIGNES), chaque pôle est un point : la somme des
# tranches d'une bande est sa ligne LIGNES. Cellule (j, k) → indice j · NCLASSES + k, k la classe de socle.
def tranches(n, a, b):
    s, bas, pas = (1 if n[0] == 'N' else -1), min(abs(a), abs(b)), abs(b - a) / TRANCHES
    sL, out = s * LAT, []
    for j in range(TRANCHES):
        s0, s1 = bas + j * pas, bas + (j + 1) * pas
        out.append((((sL > s0) & (sL < s1)) + np.where((sL == s0) | (sL == s1), np.where(np.abs(LAT) == 90, 1.0, 0.5), 0.0))[:, None])
    assert np.allclose(sum(out), LIGNES[n]), f'{n} : la somme des tranches n\'est pas la bande'
    return out
TR = {n: tranches(n, a, b) for n, a, b in BANDES}

def cellules(zu, continent, w0, n):
    """Continent de la bande n en cellules : aire [km²], aire · |sin φ| et aire · socle de chaque cellule ; aire valide de la bande."""
    k = np.digitize(zu, SOCLE_BORNES_M, right=True)
    A, X, Z = (np.zeros(TRANCHES * NCLASSES) for _ in range(3))
    for j, p in enumerate(TR[n]):
        w = w0 * p * ~np.isnan(zu)
        c = continent & (w > 0)
        sl = slice(j * NCLASSES, (j + 1) * NCLASSES)
        A[sl] = np.bincount(k[c], weights=w[c], minlength=NCLASSES)
        X[sl] = np.bincount(k[c], weights=(w * np.abs(np.sin(np.radians(LA))))[c], minlength=NCLASSES)
        Z[sl] = np.bincount(k[c], weights=(w * zu)[c], minlength=NCLASSES)
    return A, X, Z, (w0 * LIGNES[n] * ~np.isnan(zu)).sum()

tables = {}
for age, (z, present) in CARTES.items():
    zu = np.where(EMPREINTE[age], SOCLE_U[age], z)
    continent = ~np.isnan(zu) & ((zu > SEUIL_CONTINENT_M) | EMPREINTE[age])
    if age == 0: assert (continent == CONTINENT0).all(), 'continent de 0 Ma : celui de la fermeture'
    w0 = poids(present)
    tables[age] = {n: cellules(zu, continent, w0, n) for n, _, _ in BANDES}

# Contrôle de lecture, carte de 0 Ma : aire [Mkm²], socle moyen [m] et part du Groenland (sa terre, inlandsis compris) de chaque
# cellule des bandes polaires — la place de la calotte nord, c'est le moteur qui la choisit par le bilan.
print('cellules de 0 Ma (aire Mkm², socle m, part du Groenland) ; classes de socle ≤', SOCLE_BORNES_M, 'm :')
for n in ('N_pol', 'S_pol'):
    A, X, Z, _ = tables[0][n]
    gr = cellules(np.where(EMPREINTE[0], SOCLE_U[0], Z0), CONTINENT0 & GROENLAND, W0, n)[0]
    for j in range(TRANCHES):
        sl = slice(j * NCLASSES, (j + 1) * NCLASSES)
        print(f'  {n} tranche {j} : ' + ' '.join(f'{a / 1e6:5.2f} {z / a:5.0f} {100 * g / a:3.0f}%' if a > 0 else '      —        '
                                                 for a, z, g in zip(A[sl], Z[sl], gr[sl])))

# Avant la première carte (540 Ma) : la terre émergée de toutes les bandes de cette carte, mise ensemble, par classe de socle (❔ lue
# par le moteur avec la terre de l'époque, à la latitude du milieu de chaque bande : sans carte, la terre est à la fois continent
# et terre émergée).
AGE_MAX = max(CARTES)
z, present = CARTES[AGE_MAX]
w0 = poids(present) * ~np.isnan(z)
emerge = ~np.isnan(z) & (z > 0)
k = np.digitize(z, SOCLE_BORNES_M, right=True)
A = np.bincount(k[emerge], weights=w0[emerge], minlength=NCLASSES)
Z = np.bincount(k[emerge], weights=(w0 * z)[emerge], minlength=NCLASSES)
AVANT = {'part': A / A.sum(), 'socle_m': np.divide(Z, A, out=np.zeros(NCLASSES), where=A > 0)}
print(f'avant {AGE_MAX} Ma : terre émergée de la carte de {AGE_MAX} Ma, toutes bandes, par classe de socle :',
      ' '.join(f'{p:.3f}' for p in AVANT['part']))
print('cartes antarctiques déchargées (Ma) :', CHARGEES, '; Groenland déchargé (Ma) :', list(GROENLAND_SURFACE_MA))

# ── Table ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
UNITE = 100000   # parts écrites en cent-millièmes de la bande (1e-5)
def repartir(parts):
    """Parts d'une bande (ou de la terre d'avant) écrites en multiples de 1/UNITE dont la somme est celle des parts exactes, arrondie à
    1/UNITE : plus grands restes (Hamilton). Arrondir chaque part seule ne garde pas la somme (terre d'avant à 1,00052, continent
    d'une bande pleine à 1,0002 : mer négative) ; la somme d'une bande ne dépasse donc jamais 1."""
    x = np.asarray(parts, dtype=float) * UNITE
    n = np.floor(x).astype(int)
    reste = int(round(x.sum())) - int(n.sum())
    n[np.argsort(-(x - n), kind='stable')[:reste]] += 1
    assert n.sum() == round(x.sum()) and (n >= 0).all(), 'répartition'
    return [int(k) if k % UNITE == 0 else k / UNITE for k in n.tolist()]

ages = sorted(tables)
sortie = {'ages_Ma': ages, 'tau_Pa': round(TAU_PA), 'tranches': TRANCHES, 'socle_continent_m': SEUIL_CONTINENT_M,
          'socle_bornes_m': SOCLE_BORNES_M,
          'aire': {}, 'lat_deg': {}, 'socle_m': {}}
for n, _, _ in BANDES:
    t = [tables[a][n] for a in ages]
    # cellule vide (aire écrite nulle) : aire 0, latitude et socle 0 (sans objet)
    sortie['aire'][n] = [repartir(A / tot) for A, X, Z, tot in t]
    sortie['lat_deg'][n] = [[round(math.degrees(math.asin(x / a)), 1) if e > 0 else 0 for a, x, e in zip(A, X, E)]
                            for (A, X, Z, tot), E in zip(t, sortie['aire'][n])]
    sortie['socle_m'][n] = [[round(z / a) if e > 0 else 0 for a, z, e in zip(A, Z, E)] for (A, X, Z, tot), E in zip(t, sortie['aire'][n])]
sortie['avant'] = {'part': repartir(AVANT['part']), 'socle_m': [round(v) for v in AVANT['socle_m']]}
assert sum(round(v * UNITE) for v in sortie['avant']['part']) == UNITE, 'terre d’avant : somme ≠ 1'

liste = lambda L: ', '.join(str(a) for a in L)
virgule = lambda x, f: format(x, f).replace('.', ',')
entete = f"""// File: API_BILAN/data/paleogeo_zones.js
// Desc: Paléogéographie zonale par époque, CALCULÉE (CO2/scripts/paleogeo/paleodem_zones.py) depuis les PaleoDEM de Scotese &
//       Wright 2018 (PALEOMAP Paleodigital Elevation Models for the Phanerozoic, doi:10.5281/zenodo.5460860, CC-BY 4.0), tous les
//       5 Ma de 0 à {AGE_MAX} Ma, par bande et par hémisphère : le CONTINENT (socle > socle_continent_m = {SEUIL_CONTINENT_M} m) en
//       cellules, {TRANCHES} tranches de latitude d'égale largeur × {NCLASSES} classes de socle (socle_bornes_m : classe k entre les
//       bornes k − 1 et k, la première au-dessus de socle_continent_m, la classe d'au-dessus de 0 m est la première ÉMERGÉE) ;
//       cellule (j, k) à l'indice j · {NCLASSES} + k, tranche 0 du côté de l'équateur :
//       aire (part de la bande, en cent-millièmes par plus grands restes : la somme d'une bande est celle des parts exactes ; maille
//       de la grille de 1° par les trapèzes en latitude, cos φ, nulle au pôle),
//       latitude [°] et socle [m] moyens (cellule vide : 0, 0, 0). Continent et terre émergée d'une bande sont les sommes de ses
//       cellules. Avant {AGE_MAX} Ma (avant) : la terre émergée de toutes les bandes de la carte de {AGE_MAX} Ma, part (somme 1) et socle
//       moyen de chaque classe.
//       tau_Pa : seuil de la loi plastique sur socle d'Airy des calottes, dôme de rayon R = √(S/π), V = (8π/15) C R^(5/2),
//       C = √(2 τ / (ρ_i g (1 − ρ_i/ρ_m))), fermé sur le volume et l'aire posés de l'Antarctique (Bedmap2 ; ⚠️ l'aire est une
//       entrée ; ❔ τ effectif, uniforme) ; 🎯 le même dôme donne au Groenland {virgule(V_GR_PREDIT_KM3 / 1e6, '.2f')}e6 km³
//       (BedMachine v3 : 2,99e6).
//       Socle SANS glace, même croûte pour les deux calottes : la glace de 0 Ma est retirée cellule par cellule (rebond d'Airy,
//       recharge d'eau de mer des socles restés sous la mer ; Antarctique : même loi et même τ sur son empreinte, marge à
//       {D0_RECUL_KM:.0f} km du bord du continent, {virgule(V_RETIRE_KM3 / 1e6, '.2f')}e6 km³) et, sur les cartes qui copient la carte de 0 Ma
//       (recalage en rotation), l'empreinte transportée de la calotte reçoit ce socle déchargé (⚠️ relief de la carte remplacé) :
//       Antarctique {liste(CHARGEES)} Ma ; Groenland (socle chargé uniforme fermé sur BedMachine v3, ⚠️) {liste(GROENLAND_SURFACE_MA)} Ma.
//       Lu par physics/calottes.js. Ne pas éditer à la main : régénérer.
// Version 1.5.2
// - v1.5.2 (2026-10-31): maille des trapèzes jusqu'au pôle (tranche 85–90° à son aire) ; seuil du continent (socle_continent_m).
// - v1.5.1 (2026-10-30): parts en cent-millièmes par plus grands restes (terre d'avant de somme 1, continent ≤ 1).
// Date: [October 31, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
'use strict';
window.PALEOGEO = """
open(sys.argv[2], 'w', encoding='utf-8').write(entete + json.dumps(sortie, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(len(ages), 'cartes →', sys.argv[2], f'({os.path.getsize(sys.argv[2]) / 1e3:.0f} ko)')
