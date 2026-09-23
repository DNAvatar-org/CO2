#!/usr/bin/env python3
# File: CO2/scripts/params_doc/generate.py
# Desc: Engendre API_BILAN/demo/parametres.html DEPUIS LE CODE. Pour chaque symbole du dico et
#       chaque constante nommée : son unité (déduite de l'alphabet, pas écrite à la main), sa
#       description, sa formule, et TOUTES les lignes du modèle où elle est écrite ou lue.
#       Refuse d'écrire si une clé 🍰 ne dit pas de quoi elle est une proportion.
# Version 1.1.1
# Date: 2026-09-23
# logs :
#   - v1.1.1: trois angles morts qui fabriquaient de faux « 0 lect. » — API_BILAN/*.js à la racine
#     (api.js, tuning.js…) et demo/js/ n'étaient pas balayés, et un accès ["clé"] entre guillemets
#     doubles (organigramme.js) n'était pas reconnu. 🧲📛⛅ (lue par api.js), 🍰🪩⚽ et 🍰🪩💧
#     (organigramme), 🍰🫧📿🌈 (epoch_bench_run.js) passaient pour mortes. Et les noms de constantes
#     en minuscules (CONV.molar_mass_air_ref, lue 8 fois) n'étaient pas reconnus.
#   - v1.1.0: plus AUCUNE unité inconnue. Les constantes (CONST · CONV · EARTH · CLOUD_SW) prennent
#     valeur ET unité à leur définition — l'unité entre crochets en tête du commentaire, `// [K]` —
#     et la génération échoue si une seule manque. ⚾ est un angle (°) ; 🔁 🖼 🌙 🔘 📝 sont des clés
#     d'interface, déclarées comme telles (texte, objet) au lieu de « unité inconnue ». Avant, la
#     valeur n'était lue que sur une ligne `X = v;` : les 20 CLOUD_SW (objet littéral d'initDATA) et
#     les deux points triples (trouvés d'abord dans dico.js) sortaient vides.
# Copyright 2026 DNAvatar.org - Arnaud Maignan
# Licensed under Apache License 2.0 with Commons Clause.
import io, os, re, sys, glob, html, json
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
API  = os.path.join(ROOT, 'API_BILAN')
OUT  = os.path.join(API, 'demo', 'parametres.html')

# ─── LA RÈGLE DE L'ALPHABET (source : API_BILAN/data/alphabet.js) ─────────────
# 1ᵉʳ caractère = unité. Pour 🍰, le 2ᵉ dit de quoi c'est une proportion.
UNITE_1 = {
    '📿':'# (cardinal)', '📏':'km', '⚖️':'kg', '🎈':'atm', '🌡️':'K', '🔋':'W',
    '🍎':'m/s²', '🧲':'W/m²', '🧪':'kg/mol', '🍰':'sans dimension [0,1]',
    '🔬':'# (cardinal — résolution : nombre de pas)', '🪩':'W/W (réflectance : flux réfléchi / incident)',
    '☁️':'sans dimension [0,1] (index de formation nuageuse)', '📛':'W/m²', '⏳':'s⁻¹',
    '💭':'Pa/Pa (seuil d\'humidité relative)',
    # 🧮 = « calcul courant » : c'est un PRÉFIXE, l'unité est portée par le caractère suivant.
    '🔄':'# (compteur d\'itérations / de cycles)',
    '⚧':'texte — phase Init / Search / Dicho (pas une grandeur)',
    '☯':'signe −1 / 0 / +1 (sans dimension)',
    '⚾':'° (angle : obliquité ε)',
    # Clés d'INTERFACE : pas des grandeurs physiques, mais leur type est déclaré, jamais « inconnu ».
    '📝':'texte (pas une grandeur)',
    '🖼':'texte — chemin d\'image de texture (pas une grandeur)',
    '🌙':'texte — chemin d\'image de carte de nuit (pas une grandeur)',
    '🔘':'texte — identifiant du bouton cliqué, ☄️ ou 💫 (pas une grandeur)',
}
# Préfixe d'ÉTAT : 🔁 = « imposé par l'état de cycle courant » ; l'unité est portée par la suite.
PREFIXE_ETAT = {'🔁': 'état de cycle 🕰.🔁', '🧮': 'valeur courante du calcul'}
# Préfixe de VARIATION : 🔺 = Δ de la grandeur qui suit, dans SON unité (🔺⚖️🏭 → Δ kg).
PREFIXE_DELTA = '🔺'
# 🔁⚖️ n'est pas UNE masse mais un objet { ⚖️… : kg } — la suite de la clé le dit.
CONTENEUR = {'🔁⚖️': 'objet { ⚖️… : kg } — masses imposées par l\'état de cycle'}
NATURE_2 = {   # pour les clés 🍰… : de quoi est-ce une proportion ?
    '🫧':'massique, de l\'atmosphère (kg/kg)',
    '💧':'massique, de l\'eau totale (kg/kg)',
    '🧪':'MOLAIRE (mol/mol)',
    '🪩':'de surface — albédo (m²/m²)',
    '🗻':'de surface — géologie (m²/m²)',
    '📛':'d\'énergie — effet de serre (W/W)',
    '⚽':'obstruction du voile SW (sans dimension)',
}
# Composés d'unités, sans emoji nouveau
UNITE_COMPOSEE = {'🧲⚖️':'kg/m²/s (flux de MASSE)'}

def lire(p):
    return io.open(p, encoding='utf-8').read()

def bloc(src, nom):
    """Extrait l'objet littéral `const <nom> = { … };`."""
    i = src.index('const %s = {' % nom)
    j = src.index('\n};', i)
    return src[i:j]

def paires(txt):
    """'clé': 'valeur' → dict, en tolérant les apostrophes échappées."""
    out = {}
    for m in re.finditer(r"'([^']{1,14})'\s*:\s*'((?:[^'\\]|\\.)*)'", txt):
        out[m.group(1)] = m.group(2).replace("\\'", "'")
    return out

def unite_de(cle):
    if cle in CONTENEUR: return CONTENEUR[cle], None
    if cle.startswith(PREFIXE_DELTA) and len(cle) > 1:
        u, nat = unite_de(cle[1:])
        return ('Δ ' + u) if not u.startswith('⚠️') else u, nat
    for p, quoi in PREFIXE_ETAT.items():
        if cle.startswith(p) and len(cle) > len(p):
            u, nat = unite_de(cle[len(p):])
            return u + ' — ' + quoi, nat
    for comp, u in UNITE_COMPOSEE.items():
        if cle.startswith(comp): return u, None
    c1 = cle[0]
    # ⚖️ / 🌡️ / 🏜️ portent un sélecteur de variante : on teste les 2 premiers caractères d'abord
    for n in (2, 1):
        if cle[:n] in UNITE_1: c1 = cle[:n]; break
    u = UNITE_1.get(c1)
    if c1 != '🍰':
        return (u or '⚠️ unité inconnue'), None
    reste = cle[len(c1):]
    for n in (2, 1):
        if reste[:n] in NATURE_2:
            return 'sans dimension [0,1]', NATURE_2[reste[:n]]
    return 'sans dimension [0,1]', None      # → le contrôle échouera

# ─── 1. les définitions ───────────────────────────────────────────────────────
alpha = lire(os.path.join(API, 'data', 'alphabet.js'))
dico  = lire(os.path.join(API, 'data', 'dico.js'))
CHARS_DESC = paires(bloc(alpha, 'CHARS_DESC'))
DESC = paires(bloc(dico, 'DESC'))
FORM = paires(bloc(dico, 'FORM'))
familles = {}
for m in re.finditer(r"'([^']{1,6})'\s*:\s*\[([^\]]*)\]", bloc(dico, 'KEYS')):
    familles[m.group(1)] = re.findall(r"'([^']+)'", m.group(2))

# ─── 2. le code : où chaque chose est écrite et lue ───────────────────────────
# Le moteur ET l'interface : une constante lue seulement par le tracé n'est pas morte.
# Sans ça la page crie au loup — les CONST.LAMBDA_* ne sont lues que par CO2/static/courbes/plot.js.
CO2D = os.path.join(ROOT, 'CO2')
FICHIERS = sorted(set(
    [f for f in glob.glob(os.path.join(API, '*.js')) + glob.glob(os.path.join(API, '*', '*.js'))
     + glob.glob(os.path.join(API, '*', '*', '*.js'))
     if 'hitran_lines' not in f]
    + [f for f in glob.glob(os.path.join(CO2D, 'static', '**', '*.js'), recursive=True)
       + glob.glob(os.path.join(CO2D, 'organigramme', '*.js'))
       + glob.glob(os.path.join(CO2D, 'scripts', '**', '*.js'), recursive=True)
       + glob.glob(os.path.join(CO2D, 'tools', '*.js'))
       # Scripts INLINE des pages : sans eux, une constante appelée seulement depuis un <script>
       # d'index.html ou d'une modale passerait pour morte. C'est le genre de faux positif qui
       # discrédite la page entière.
       + glob.glob(os.path.join(CO2D, '*.html'))
       + glob.glob(os.path.join(CO2D, 'html', '*.html'))
       + glob.glob(os.path.join(API, 'demo', '*.html'))
     if os.sep + 'lib' + os.sep not in f]
) - {OUT})
# ⚠️ OUT exclu explicitement : la page engendrée contient le NOM de chaque constante, donc se
# lire soi-même faisait passer tout le code mort pour vivant. Faux négatif silencieux, trouvé en
# vérifiant que CONV.ALPHA_OCEAN était « lu » — il l'était, dans parametres.html de la veille.
lignes = {}
for f in FICHIERS:
    lignes[os.path.relpath(f, ROOT)] = lire(f).split('\n')

def usages(motif, est_ecriture):
    """[(fichier, no, texte)] — commentaires exclus."""
    out = []
    for rel, ls in lignes.items():
        for i, l in enumerate(ls, 1):
            s = l.strip()
            if not s or s.startswith('//') or s.startswith('*') or s.startswith('/*'): continue
            if motif not in l: continue
            apres = l.split(motif, 1)[1][:6]
            ecrit = bool(re.match(r"\s*(=[^=]|\+=|-=|\*=|/=)", apres))
            if ecrit == est_ecriture: out.append((rel, i, s[:190]))
    return out

CONSTANTES = defaultdict(list)
for rel, ls in lignes.items():
    for i, l in enumerate(ls, 1):
        s = l.strip()
        if not s or s.startswith('//') or s.startswith('*'): continue
        for m in re.finditer(r'\b(CONST|CONV|EARTH)\.([A-Za-z_][A-Za-z0-9_]*)\b', l):
            CONSTANTES[m.group(1) + '.' + m.group(2)].append((rel, i, s[:190]))
        for m in re.finditer(r"CLOUD_SW\.([A-Z_][A-Z0-9_]*)\b", l):
            CONSTANTES['CLOUD_SW.' + m.group(1)].append((rel, i, s[:190]))

# ─── 3. le CONTRÔLE : une clé 🍰 doit dire de quoi elle est une proportion ────
fautes = []
toutes = sorted({k for ks in familles.values() for k in ks})
sans_unite = [k for k in toutes if '❀' not in k and unite_de(k)[0].startswith('⚠️')]
for k in toutes:
    if not k.startswith('🍰'): continue
    if '❀' in k: continue                      # gabarit générique, pas une clé réelle
    _, nature = unite_de(k)
    if nature is None:
        fautes.append(k)
# ─── 3 bis. le CONTRÔLE : aucune clé, aucune constante sans unité ───────────
# Une unité « inconnue » n'existe pas : soit le symbole la dit, soit la définition la déclare.
DEFS = {}      # 'CONST.X' → (fichier, no, expr, unité, commentaire)
def _defs_physics():
    rel = os.path.relpath(os.path.join(API, 'physics', 'physics.js'), ROOT)
    for i, l in enumerate(lignes[rel], 1):
        m = re.match(r'^(CONST|CONV|EARTH)\.([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$', l)
        if not m: continue
        nom = m.group(1) + '.' + m.group(2)
        if nom in DEFS: continue
        reste = m.group(3)
        expr, com = (reste.split('//', 1) + [''])[:2]
        u = re.match(r'\s*\[([^\]]+)\]\s*(.*)', com)
        DEFS[nom] = (rel, i, expr.strip().rstrip(';').strip(), u.group(1) if u else None,
                     (u.group(2) if u else com).strip())
def _defs_cloud_sw():
    rel = os.path.relpath(os.path.join(API, 'data', 'initDATA.js'), ROOT)
    ls = lignes[rel]
    i0 = next(i for i, l in enumerate(ls) if re.match(r'\s*CLOUD_SW:\s*\{', l))
    for i in range(i0 + 1, len(ls)):
        l = ls[i]
        if re.match(r'\s*\},?\s*$', l): break
        m = re.match(r'\s*([A-Z_][A-Z0-9_]*)\s*:\s*([^,/]+?),?\s*(//.*)?$', l)
        if not m: continue
        com = (m.group(3) or '')[2:]
        u = re.match(r'\s*\[([^\]]+)\]\s*(.*)', com)
        DEFS['CLOUD_SW.' + m.group(1)] = (rel, i + 1, m.group(2).strip(), u.group(1) if u else None,
                                          (u.group(2) if u else com).strip())
_defs_physics(); _defs_cloud_sw()
FONCTIONS = {n for n, d in DEFS.items() if d[2].startswith('function')}
for n in list(FONCTIONS):
    if DEFS[n][3] is None:                                         # méthodes (EARTH.zoneAnnualInsolation…)
        DEFS.pop(n); FONCTIONS.discard(n); CONSTANTES.pop(n, None)
for n in DEFS:
    CONSTANTES.setdefault(n, [])   # une constante définie et jamais nommée ailleurs doit apparaître
const_sans_unite = sorted(n for n, d in DEFS.items() if not d[3])
const_sans_def = sorted(n for n in CONSTANTES if n not in DEFS)

def valeur(nom, pile=()):
    """Évalue l'expression de définition (littéral, ou arithmétique sur d'autres constantes)."""
    if nom not in DEFS or nom in pile: return None
    e = DEFS[nom][2]
    if e in ('true', 'false'): return e
    def sub(m):
        v = valeur(m.group(0), pile + (nom,))
        return repr(v) if isinstance(v, float) else 'None'
    e2 = re.sub(r'\b(?:CONST|CONV|EARTH)\.[A-Za-z_][A-Za-z0-9_]*', sub, e)
    e2 = e2.replace('Math.PI', repr(3.141592653589793)).replace('Math.pow', 'pow')
    if 'None' in e2 or not re.fullmatch(r'[0-9eE+\-*/(). ,pow]+', e2): return None
    try: return float(eval(e2, {'__builtins__': {}}, {'pow': pow}))
    except Exception: return None

BORNES = {}    # CLOUD_SW interpolées par le barycentre : clé → (min, max)
_ftb = lire(os.path.join(API, 'config', 'fine_tuning_bounds.js'))
for m in re.finditer(r"group:\s*'CLOUD_SW',\s*key:\s*'([A-Z_0-9]+)'(.*?)\}", _ftb, re.S):
    mn = re.search(r'\bmin:\s*([-0-9.eE]+)', m.group(2)); mx = re.search(r'\bmax:\s*([-0-9.eE]+)', m.group(2))
    if mn and mx: BORNES['CLOUD_SW.' + m.group(1)] = (mn.group(1), mx.group(1))

if sans_unite or const_sans_unite or const_sans_def:
    sys.stderr.write("\n❌ CONTRÔLE D'UNITÉ ÉCHOUÉ — une unité inconnue n'existe pas.\n")
    for k in sans_unite:
        sys.stderr.write("     clé %s : 1ᵉʳ caractère absent de UNITE_1 (alphabet.js le déclare-t-il ?)\n" % k)
    for n in const_sans_unite:
        d = DEFS[n]; sys.stderr.write("     %s (%s:%d) : pas de `// [unité]` en tête du commentaire\n" % (n, d[0], d[1]))
    for n in const_sans_def:
        sys.stderr.write("     %s : lue mais jamais définie (physics.js / initDATA.js CLOUD_SW)\n" % n)
    sys.stderr.write("Rien n'a été écrit.\n\n")
    sys.exit(1)

if fautes:
    sys.stderr.write(
        "\n❌ CONTRÔLE D'UNITÉ ÉCHOUÉ — %d clé(s) 🍰 ne disent pas de quoi elles sont une proportion :\n"
        % len(fautes))
    for k in fautes:
        sys.stderr.write("     %s   (2ᵉ caractère inconnu ; natures admises : %s)\n"
                         % (k, ' '.join(NATURE_2)))
    sys.stderr.write("\nRègle : API_BILAN/data/alphabet.js, bloc « LA RÈGLE DE L'ALPHABET ».\n"
                     "Soit la clé est mal nommée, soit il manque une nature dans NATURE_2 de ce script.\n"
                     "Rien n'a été écrit.\n\n")
    sys.exit(1)

# ─── 4. le rendu ──────────────────────────────────────────────────────────────
def esc(x): return html.escape(str(x))

def bloc_usages(titre, lst, classe):
    if not lst: return ''
    h = ['<div class="u %s"><b>%s</b> <span class="n">%d</span><ul>' % (classe, titre, len(lst))]
    for rel, no, txt in lst[:60]:
        h.append('<li><code class="loc">%s:%d</code><code class="src">%s</code></li>' % (esc(rel), no, esc(txt)))
    if len(lst) > 60: h.append('<li class="plus">… %d de plus</li>' % (len(lst) - 60))
    h.append('</ul></div>')
    return ''.join(h)

parts = []
total_cles = 0
for fam, cles in familles.items():
    fam_desc = CHARS_DESC.get(fam, '')
    parts.append('<h2>%s <span class="fd">%s</span></h2>' % (esc(fam), esc(fam_desc)))
    for k in cles:
        if '❀' in k:
            parts.append('<details class="k gabarit"><summary><code>%s</code> <span class="g">gabarit générique — ∀ ❀</span></summary>'
                         '<div class="d">%s</div></details>' % (esc(k), esc(DESC.get(k, ''))))
            continue
        total_cles += 1
        unite, nature = unite_de(k)
        ecr = usages("['%s']" % k, True) + usages('["%s"]' % k, True)
        lec = usages("['%s']" % k, False) + usages('["%s"]' % k, False)
        parts.append('<details class="k"><summary><code>%s</code>'
                     '<span class="unit">%s</span>%s'
                     '<span class="cnt">%d écr. / %d lect.</span></summary>'
                     % (esc(k), esc(unite),
                        ('<span class="nat">%s</span>' % esc(nature)) if nature else '',
                        len(ecr), len(lec)))
        if DESC.get(k):  parts.append('<div class="d">%s</div>' % DESC[k])
        if FORM.get(k):  parts.append('<div class="f"><b>Formule :</b> %s</div>' % FORM[k])
        parts.append(bloc_usages('Écrite ici', ecr, 'ecr'))
        parts.append(bloc_usages('Lue ici', lec, 'lec'))
        if not ecr and not lec:
            parts.append('<div class="mort">⚠️ Aucune occurrence dans le code du modèle — clé morte ?</div>')
        parts.append('</details>')

parts.append('<h2>Constantes nommées <span class="fd">CONST · CONV · EARTH · CLOUD_SW</span></h2>')
def fmt(v):
    if isinstance(v, str): return v
    if v is None: return '?'
    a = abs(v)
    if a != 0 and (a < 1e-3 or a >= 1e6): return ('%.6g' % v).replace('e+0', 'e').replace('e+', 'e').replace('e-0', 'e-')
    return ('%.6g' % v)

for nom in sorted(CONSTANTES):
    d = DEFS[nom]
    fich, no, expr, unite, com = d
    us = [u for u in CONSTANTES[nom] if not (u[0] == fich and u[1] == no)]
    ecr = [u for u in us if re.search(re.escape(nom) + r'\s*=[^=]', u[2])]
    lect = [u for u in us if u not in ecr]
    if nom in FONCTIONS:
        val = 'fonction'
    else:
        v = valeur(nom)
        val = fmt(v)
        if v is not None and not re.fullmatch(r'[-0-9.eE+]+', expr) and expr not in ('true', 'false'):
            val = '%s = %s' % (expr[:50], fmt(v))
    parts.append('<details class="k const"><summary><code>%s</code>'
                 '<span class="val">%s</span><span class="unit">%s</span>%s<span class="cnt">%d lect.</span></summary>'
                 % (esc(nom), esc(val), esc(unite),
                    ('<span class="nat">🎚️ barycentre : %s → %s</span>' % BORNES[nom]) if nom in BORNES else '',
                    len(lect)))
    if com: parts.append('<div class="d">%s</div>' % esc(com))
    if nom in BORNES:
        parts.append('<div class="f"><b>Valeur effective :</b> interpolée par le barycentre entre %s (0 %%) et %s (100 %%), '
                     'depuis <code>config/fine_tuning_bounds.js</code>. La valeur ci-dessus est le défaut d\'initDATA, écrasé au chargement.</div>' % BORNES[nom])
    parts.append(bloc_usages('Définie ici', [(fich, no, lignes[fich][no - 1].strip()[:190])], 'ecr'))
    parts.append(bloc_usages('Réécrite ici', ecr, 'ecr'))
    parts.append(bloc_usages('Lue ici', lect, 'lec'))
    if not lect:
        parts.append('<div class="mort">⚠️ Définie mais jamais lue — code mort.</div>')
    parts.append('</details>')

CSS = """
body{font-family:"Palatino Linotype",Georgia,serif;max-width:1100px;margin:1.5em auto;padding:0 1em;color:#e0e0e0;background:#1a1a1a}
h1{border-bottom:2px solid #666;color:#f0f0f0}
h2{margin-top:1.8em;border-bottom:1px solid #555;color:#9ecbff;font-size:1.15em}
.fd{color:#999;font-weight:400;font-size:.8em}
.intro{background:#23272b;border-left:3px solid #5a9;padding:.7em 1em;border-radius:3px;font-size:.92em}
.intro code{color:#ffd479}
details.k{margin:.25em 0;padding:.25em .5em;background:#222629;border-left:3px solid #456;border-radius:3px}
details.k[open]{background:#262a2e;border-left-color:#5a9}
details.k.const{border-left-color:#764}
details.k.gabarit{opacity:.65;border-left-color:#444}
summary{cursor:pointer;list-style:none;display:flex;flex-wrap:wrap;align-items:center;gap:.6em}
summary::-webkit-details-marker{display:none}
summary code{font-family:"Courier New",monospace;color:#ffd479;font-size:1.05em;min-width:9em}
.unit{color:#7fc4ff;font-size:.82em}
.nat{color:#9d9;font-size:.82em}
.val{color:#c9b;font-size:.82em;font-family:"Courier New",monospace}
.cnt{margin-left:auto;color:#888;font-size:.78em}
.d{margin:.4em 0;color:#cfcfcf;font-size:.9em}
.f{margin:.4em 0;color:#b8d8b8;font-size:.86em;background:#1e2320;padding:.4em .6em;border-radius:3px}
.u{margin:.5em 0}
.u b{font-size:.84em;color:#aaa}
.u .n{color:#666;font-size:.78em}
.u ul{margin:.2em 0;padding-left:1em;list-style:none}
.u li{margin:.12em 0;font-size:.8em;display:flex;gap:.6em;align-items:baseline}
.loc{color:#7fc4ff;font-family:"Courier New",monospace;white-space:nowrap;min-width:19em}
.src{color:#bbb;font-family:"Courier New",monospace;white-space:pre-wrap;word-break:break-word}
.ecr .loc{color:#ffb86c}
.plus{color:#777;font-style:italic}
.mort{color:#ff7b7b;font-size:.85em;margin:.3em 0}
"""

doc = """<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🔎 Paramètres</title><style>%s</style></head><body>
<h1>🔎 Paramètres du modèle — où chacun est écrit, où il est lu</h1>
<div class="intro">
<p><b>Cette page est engendrée depuis le code</b>, par
<code>CO2/scripts/params_doc/generate.py</code>. Rien n'y est écrit à la main : si une ligne
change dans <code>API_BILAN/</code>, elle change ici. Ne pas l'éditer.</p>
<p><b>Les unités ne sont pas recopiées, elles sont DÉDUITES du symbole.</b> C'est la règle de
l'alphabet : le premier caractère donne l'unité, et pour <code>🍰</code> (sans dimension) le
deuxième dit de quoi c'est une proportion — massique, molaire, de surface, d'énergie.
Le générateur <b>refuse d'écrire</b> si une clé <code>🍰</code> ne le dit pas : c'est ce contrôle
qui empêche le retour de la confusion massique/molaire, qui a produit trois bugs distincts
(<code>ln_H2O</code>, <code>computePWV</code>, <code>calculateMolarMassAir</code>).</p>
<p>%d clés du dictionnaire · %d constantes nommées · %d fichiers balayés — <code>API_BILAN/</code> le moteur, <code>CO2/static/</code>, <code>CO2/organigramme/</code> et les scripts <i>inline</i> des pages HTML.</p>
</div>
%s
</body></html>""" % (CSS, total_cles, len(CONSTANTES), len(lignes), '\n'.join(parts))

io.open(OUT, 'w', encoding='utf-8').write(doc)
print("✅ %s" % os.path.relpath(OUT, ROOT))
print("   %d clés · %d constantes · %d fichiers · contrôle d'unité PASSÉ" % (total_cles, len(CONSTANTES), len(lignes)))
