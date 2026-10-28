# File: CO2/scripts/paleogeo/paleodem_zones.py
# Desc: Table zonale de paléogéographie pour le moteur : pour chaque carte PaleoDEM (Scotese & Wright 2018, 1° × 1°, tous les
#       5 Ma de 0 à 540 Ma, CC-BY 4.0) et chaque bande de latitude (0–30°, 30–60°, 60–90°, par hémisphère), la part de CONTINENT
#       (socle au-dessus de −1 000 m, milieu du creux de l'hypsométrie entre continents et bassins), l'altitude moyenne de ce
#       socle et des hautes terres, et leurs latitudes. Le moteur pose LUI-MÊME ses calottes et leur charge (physics/calottes.js :
#       socle enfoncé de ρ_i/ρ_m · h) : il lui faut le socle SANS glace, déchargé. Or les PaleoDEM portent l'Antarctique au socle
#       actuel CHARGÉ par sa glace (copies tournées du socle de 0 Ma) et le Groenland à la SURFACE de sa glace. Une seule règle
#       pour les deux calottes, MÊME CROÛTE : la glace de 0 Ma est retirée cellule par cellule (ANTARCTIQUE, GROENLAND,
#       DÉCHARGE) et, sur les cartes qui copient la carte de 0 Ma, l'empreinte transportée par la rotation reçoit ce socle
#       déchargé (RECALAGE).
#       Écrit API_BILAN/data/paleogeo_zones.js.
#       Usage : python3 -I paleodem_zones.py <dossier des CSV PaleoDEM> <sortie .js>
#       Données : https://www.earthbyte.org/paleodem-resource-scotese-and-wright-2018/ (PaleoDEMS_long_lat_elev_csv_v2.zip)
# Version 1.4.0
# - v1.4.0 (2026-10-26): même croûte pour les deux calottes ; glace antarctique fermée sur le volume ET l'aire posés (τ effectif,
#   recul de la marge) ; recharge d'eau d'Airy ; recalage par recherche par motifs ; ex-aequo du quart haut à la même fraction.
# - v1.3.0 (2026-10-26): glace antarctique par cellule (Nye), cartes chargées par recalage, Groenland déchargé, trapèzes ; numpy.
# - v1.2.0 (2026-10-26): rebond d'Airy de l'Antarctique sur les cartes au socle chargé.
# Date: [October 26, 2026]
# Copyright 2026 DNAvatar.org - Arnaud Maignan
import sys, os, re, glob, math, json
import numpy as np

# ── Constantes du moteur, LUES dans son code (une seule référence) ────────────────────────────────────────────────────────────
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'API_BILAN')
source = lambda chemin: open(os.path.join(API, chemin), encoding='utf-8').read()
nombre = lambda motif, texte: float(re.search(motif, texte).group(1))
PHYSICS, CALOTTES, TIMELINE = source('physics/physics.js'), source('physics/calottes.js'), source('config/configTimeline.js')
RHO_GLACE = nombre(r'RHO_GLACE:\s*([\d.]+)', PHYSICS)          # EARTH.NUAGES.RHO_GLACE
RHO_EAU = nombre(r'CONST\.RHO_WATER\s*=\s*([\d.]+)', PHYSICS)   # CONST.RHO_WATER — ⚠️ eau DOUCE : le moteur n'a pas d'eau de mer
RHO_MANTEAU = nombre(r'RHO_MANTEAU:\s*([\d.]+)', CALOTTES)      # CALOTTES.K.RHO_MANTEAU
TAU0_PA = nombre(r'TAU0_PA:\s*([\d.e]+)', CALOTTES)             # CALOTTES.K.TAU0_PA — comparé au τ effectif, pas utilisé
ACTUEL = TIMELINE[TIMELINE.index("'📅': '📱'"):]                # époque 📱
R_KM = nombre(r"'📐':\s*([\d.]+)", ACTUEL)
G = nombre(r"'🍎':\s*([\d.]+)", ACTUEL)
# Glace posée actuelle MESURÉE : volume et aire de chaque calotte. Aires : CALOTTES_ACTUELLES (part de la bande polaire,
# configTimeline.js) × aire d'une bande 60–90° — Antarctique : Bedmap2 (Fretwell et al. 2013, The Cryosphere 7:375, tab. 7) ;
# Groenland : inlandsis sans les glaciers et calottes locales (Citterio & Ahlstrøm 2013, The Cryosphere 7:445).
ACTUELLES = re.search(r'const CALOTTES_ACTUELLES = \{([^}]*)\}', TIMELINE).group(1)
A_POLAIRE_KM2 = 2 * math.pi * R_KM ** 2 * (1 - math.sin(math.radians(60)))
A_ANTARCTIQUE_KM2 = nombre(r'S_pol:\s*([\d.]+)', ACTUELLES) * A_POLAIRE_KM2
A_GROENLAND_KM2 = nombre(r'N_pol:\s*([\d.]+)', ACTUELLES) * A_POLAIRE_KM2
V_ANTARCTIQUE_KM3 = 26.54e6     # Bedmap2 (Fretwell et al. 2013, tab. 7), plates-formes exclues
V_GROENLAND_KM3 = 2.99e6        # BedMachine v3 (Morlighem et al. 2017, GRL 44:11051) : « total ice volume of 2.99 ± 0.02 10⁶ km³ »
ISO = RHO_GLACE / RHO_MANTEAU   # rebond d'Airy par mètre de glace retirée

SEUIL_CONTINENT_M = -1000
SEUIL_CHARGEE = 0.6             # corrélation après recalage : copie du socle de 0 Ma (0,70–0,85 de 5 à 80 Ma) ou reconstruction (≤ 0,50)
AGE_MAX_RECALAGE = 120          # au-delà, aucune carte n'est touchée
BANDES = [('S_pol', -90, -60), ('S_mid', -60, -30), ('S_trop', -30, 0), ('N_trop', 0, 30), ('N_mid', 30, 60), ('N_pol', 60, 90)]

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

def poids(present):
    """Aire de chaque cellule [km²] : cos φ (ligne polaire : demi-degré) ; méridien ±180 par la règle des trapèzes — ½ à
    chaque colonne quand la carte a les deux, 1 à −180 quand elle est seule. Le poids se lit sur la grille, pas sur les valeurs."""
    w = np.maximum(np.cos(np.radians(LA)), np.cos(np.radians(89.5))) * CELLULE_KM2 * present
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

def racine(f, bas, haut):
    """Zéro de f croissante sur [bas, haut], par bisection."""
    for _ in range(60):
        milieu = (bas + haut) / 2
        bas, haut = (bas, milieu) if f(milieu) > 0 else (milieu, haut)
    return (bas + haut) / 2

def quart_haut(z, w):
    """Part de chaque cellule (aire w) prise dans le quart le plus haut du continent : 1 au-dessus du seuil, 0 en dessous, et
    les cellules ex-aequo au seuil à la même fraction — le résultat ne dépend pas de l'ordre du tri."""
    niveaux, groupe = np.unique(-z, return_inverse=True)        # altitudes distinctes, de la plus haute à la plus basse
    W = np.bincount(groupe, weights=w, minlength=len(niveaux))  # aire de chaque altitude
    return np.clip((w.sum() / 4 - (np.cumsum(W) - W)) / W, 0, 1)[groupe]

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
print(f'moteur : ρ_i {RHO_GLACE:.0f}, ρ_eau {RHO_EAU:.0f} (douce), ρ_m {RHO_MANTEAU:.0f} kg/m³ ; g {G} m/s² ; R {R_KM:.0f} km ; '
      f'τ₀ {TAU0_PA / 1e3:.0f} kPa')
Z0, PRESENT0 = CARTES[0]
W0 = poids(PRESENT0)
VALIDE0 = ~np.isnan(Z0)
AIRE0 = W0 * VALIDE0

# ── DÉCHARGE (règle commune aux deux calottes) ──────────────────────────────────────────────────────────────────────────────
# Retirer une glace posée H d'un socle chargé b : rebond d'Airy u = b + ρ_i/ρ_m · H. Un socle qui reste sous la mer se recharge
# de la colonne d'eau qui remplace la glace (Airy) : z = u / (1 − ρ_eau/ρ_m). Les cellules sans glace posée (mer libre,
# plates-formes flottantes) portent déjà leur eau : intactes. ⚠️ ρ_eau DOUCE du moteur, l'eau de mer n'y est pas.
def decharger(b, H):
    u = b + ISO * H
    return np.where((H > 0) & (u < 0), u / (1 - RHO_EAU / RHO_MANTEAU), u)

# ── ANTARCTIQUE (carte de 0 Ma, socle chargé b) ──────────────────────────────────────────────────────────────────────────────
# Continent : composante du pôle Sud, au sud de 60° S, des cellules qui ne sont pas l'océan ouvert (cellules ≤ −1 000 m reliées
# à la mer du Sud par 50° S). Elle comprend les FOSSES INTÉRIEURES (≤ −1 000 m sous la glace, non reliées à l'océan) : elles font
# partie du continent déchargé. Épaisseur : profil plastique d'une calotte (Nye 1952, la loi de physics/calottes.js) depuis une
# marge reculée de d₀ vers l'intérieur, s(d) = √(2 τ (d − d₀) / (ρ_i g)), d = distance de grand cercle au bord du continent ;
# H = s − b là où la glace est posée (ρ_i H > ρ_eau · (−b) : ⚠️ ρ_eau DOUCE du moteur). Deux inconnues, τ effectif et d₀, fermées
# sur deux mesures de Bedmap2 : le volume posé Σ H·aire et l'aire posée. ⚠️ L'aire passe de contrôle à entrée : on ne sait pas
# faire autrement — retirer la glace actuelle d'une carte de données demande de savoir où elle est posée, et la carte ne le dit
# pas (le socle à −1 000 m borne aussi le plateau continental libre de glace et les plates-formes flottantes). ⚠️ τ et d₀
# uniformes : une marge à distance constante du bord, un seul seuil de cisaillement sur tout le continent.
OCEAN0 = composante(VALIDE0 & (Z0 <= SEUIL_CONTINENT_M), LA == -50)
ANT = composante(VALIDE0 & ~OCEAN0 & (LA < -60), LA == -90)
FOSSES = ANT & (Z0 <= SEUIL_CONTINENT_M)
D_KM = np.zeros(LA.shape); D_KM[ANT] = distance_km(P[ANT], marge(ANT))

def glace(tau, d0):
    """Épaisseur posée [m] du profil de Nye au seuil τ [Pa], marge reculée de d0 [km] (0 hors du continent, sur l'eau, sous le socle)."""
    H = np.sqrt(2 * tau * np.maximum(D_KM - d0, 0) * 1e3 / (RHO_GLACE * G)) - Z0
    return np.where(ANT & (H > 0) & (RHO_GLACE * H > -RHO_EAU * Z0), H, 0.0)

volume_km3 = lambda tau, d0: (glace(tau, d0) * AIRE0).sum() / 1e3
aire_km2 = lambda tau, d0: AIRE0[glace(tau, d0) > 0].sum()
tau_ferme = lambda d0: racine(lambda tau: volume_km3(tau, d0) - V_ANTARCTIQUE_KM3, 1e3, 1e6)
D0_KM = racine(lambda d0: A_ANTARCTIQUE_KM2 - aire_km2(tau_ferme(d0), d0), 0, D_KM.max())
TAU_EFFECTIF = tau_ferme(D0_KM)
H_ANT = glace(TAU_EFFECTIF, D0_KM)
pose = H_ANT > 0
A_POSEE = AIRE0[pose].sum()
SOCLE_ANT0 = decharger(Z0, H_ANT)                                # socle déchargé de 0 Ma (lu sur ANT)
QUART = quart_haut(Z0[ANT], AIRE0[ANT]) * AIRE0[ANT]             # quart le plus haut du socle chargé
H_QUART = np.average(H_ANT[ANT], weights=QUART)
SOUS_MER = ANT & pose & (Z0 + ISO * H_ANT < 0)                   # posé, resté sous la mer après rebond : rechargé d'eau
print(f'Antarctique 0 Ma : continent {AIRE0[ANT].sum() / 1e6:.3f} Mkm² (fosses intérieures {AIRE0[FOSSES].sum() / 1e6:.3f}, '
      f'z̄ {np.average(Z0[FOSSES], weights=AIRE0[FOSSES]):.0f} m), au nord jusqu\'à {LAT[np.nonzero(ANT.any(1))[0].max()]}° ; '
      f'distance au bord ≤ {D_KM.max():.0f} km')
print(f'  fermé sur Bedmap2 : τ effectif {TAU_EFFECTIF / 1e3:.2f} kPa (moteur τ₀ {TAU0_PA / 1e3:.0f} kPa), marge reculée d₀ {D0_KM:.1f} km '
      f'→ volume posé {volume_km3(TAU_EFFECTIF, D0_KM) / 1e6:.4f}e6 km³ ({V_ANTARCTIQUE_KM3 / 1e6:.2f}e6), aire posée '
      f'{A_POSEE / 1e6:.4f}e6 km² ({A_ANTARCTIQUE_KM2 / 1e6:.4f}e6)')
print(f'  H̄ {np.average(H_ANT[pose], weights=AIRE0[pose]):.0f} m (V/A {V_ANTARCTIQUE_KM3 / A_ANTARCTIQUE_KM2 * 1e3:.0f}), '
      f'H max {H_ANT.max():.0f} m ; quart le plus haut du socle chargé (z̄ {np.average(Z0[ANT], weights=QUART):.0f} m) : '
      f'H̄ {H_QUART:.0f} m, rebond {ISO * H_QUART:.0f} m')
print(f'  socle moyen du continent : chargé {np.average(Z0[ANT], weights=AIRE0[ANT]):.0f} m → rebond '
      f'{np.average(Z0[ANT] + ISO * H_ANT[ANT], weights=AIRE0[ANT]):.1f} m → recharge d\'eau '
      f'{np.average(SOCLE_ANT0[ANT], weights=AIRE0[ANT]):.1f} m (posé sous la mer après rebond : {AIRE0[SOUS_MER].sum() / 1e6:.3f} Mkm²) ; '
      f'rebond max {ISO * H_ANT.max():.0f} m ; continent encore ≤ −1 000 m : {AIRE0[ANT & (SOCLE_ANT0 <= SEUIL_CONTINENT_M)].sum() / 1e6:.3f} Mkm²')

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

# ── Table ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
def zones(z, w, continent):
    """Par bande : aire, aire du continent, Σ aire·socle, et pour les hautes terres (quart le plus haut du continent, là où naissent
    les calottes) Σ aire·z, Σ aire·|sin φ|, aire ; Σ aire·|sin φ| du continent."""
    out = {}
    for n, _, _ in BANDES:
        wb = w * LIGNES[n] * ~np.isnan(z)
        c = continent & (wb > 0)
        zc, wc, xc = z[c], wb[c], np.abs(np.sin(np.radians(LA[c])))
        pris = wc * quart_haut(zc, wc)
        out[n] = (wb.sum(), wc.sum(), (wc * zc).sum(), (pris * zc).sum(), (pris * xc).sum(), pris.sum(), (wc * xc).sum())
    return out

tables = {}
for age, (z, present) in CARTES.items():
    zu = np.where(EMPREINTE[age], SOCLE_U[age], z)
    tables[age] = zones(zu, poids(present), ~np.isnan(zu) & ((zu > SEUIL_CONTINENT_M) | EMPREINTE[age]))
print('cartes antarctiques déchargées (Ma) :', CHARGEES, '; Groenland déchargé (Ma) :', list(GROENLAND_SURFACE_MA))

ages = sorted(tables)
sortie = {'ages_Ma': ages, 'continent': {}, 'socle_m': {}, 'haut_m': {}, 'x_haut': {}, 'x_continent': {}}
MILIEU = {'S_pol': 0.933, 'N_pol': 0.933, 'S_mid': 0.683, 'N_mid': 0.683, 'S_trop': 0.25, 'N_trop': 0.25}   # bande sans continent
for n, _, _ in BANDES:
    t = [tables[a][n] for a in ages]
    sortie['continent'][n] = [round(A_c / A, 3) for A, A_c, *_ in t]
    sortie['socle_m'][n] = [round(sz / A_c) if A_c > 0 else 0 for _, A_c, sz, *_ in t]
    sortie['haut_m'][n] = [round(hz / ha) if ha > 0 else 0 for _, _, _, hz, _, ha, _ in t]
    sortie['x_haut'][n] = [round(hx / ha, 4) if ha > 0 else MILIEU[n] for _, _, _, _, hx, ha, _ in t]
    sortie['x_continent'][n] = [round(cx / A_c, 4) if A_c > 0 else MILIEU[n] for _, A_c, *_, cx in t]

liste = lambda L: ', '.join(str(a) for a in L)
virgule = lambda x, f: format(x, f).replace('.', ',')
entete = f"""// File: API_BILAN/data/paleogeo_zones.js
// Desc: Paléogéographie zonale par époque, CALCULÉE (CO2/scripts/paleogeo/paleodem_zones.py) depuis les PaleoDEM de Scotese &
//       Wright 2018 (PALEOMAP Paleodigital Elevation Models for the Phanerozoic, doi:10.5281/zenodo.5460860, CC-BY 4.0) :
//       part de CONTINENT (socle > −1 000 m), altitude moyenne du socle [m] et des HAUTES TERRES (quart le plus haut du continent,
//       là où naissent les calottes, ex-aequo au seuil à la même fraction) [m], et leurs latitudes moyennes |sin φ| (x_haut,
//       x_continent), par bande et par hémisphère, tous les 5 Ma de 0 à 540 Ma.
//       Socle SANS glace, même croûte pour les deux calottes : la glace de 0 Ma est retirée cellule par cellule (rebond d'Airy,
//       recharge d'eau des socles restés sous la mer, ⚠️ eau douce du moteur) et, sur les cartes qui copient la carte de 0 Ma
//       (recalage en rotation), l'empreinte transportée de la calotte reçoit ce socle déchargé (⚠️ relief de la carte remplacé) :
//         Antarctique — profil de Nye, τ effectif {virgule(TAU_EFFECTIF / 1e3, '.1f')} kPa et marge reculée de {D0_KM:.0f} km fermés sur le volume et
//         l'aire posés de Bedmap2 (⚠️ l'aire est une entrée) : {liste(CHARGEES)} Ma ;
//         Groenland — socle chargé uniforme fermé sur BedMachine v3 (⚠️) : {liste(GROENLAND_SURFACE_MA)} Ma.
//       Lu par physics/calottes.js. Ne pas éditer à la main : régénérer.
// Version 1.3.0
// - v1.3.0 (2026-10-26): même croûte pour les deux calottes ; glace antarctique fermée sur le volume et l'aire ; recharge d'eau.
// - v1.2.0 (2026-10-26): glace antarctique par cellule, cartes chargées par recalage, Groenland déchargé, trapèzes.
// - v1.1.0 (2026-10-26): Antarctique déchargé (rebond d'Airy).
// Date: [October 26, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
'use strict';
window.PALEOGEO = """
open(sys.argv[2], 'w', encoding='utf-8').write(entete + json.dumps(sortie, ensure_ascii=False) + ';\n')
print(len(ages), 'cartes →', sys.argv[2])
