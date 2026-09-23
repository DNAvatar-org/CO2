#!/usr/bin/env python3
# File: CO2/scripts/params_doc/generate.py
# Desc: Engendre API_BILAN/demo/parametres.html DEPUIS LE CODE. Pour chaque symbole du dico et
#       chaque constante nommée : son unité (déduite de l'alphabet, pas écrite à la main), sa
#       description, sa formule, et TOUTES les lignes du modèle où elle est écrite ou lue.
#       Refuse d'écrire si une clé 🍰 ne dit pas de quoi elle est une proportion.
# Version 1.0.0
# Date: 2026-09-23
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
    '🔺':'Δ (même unité que le scalaire)', '🔬':'tolérance', '🪩':'sans dimension [0,1]',
    '☁️':'sans dimension [0,1]', '📛':'W/m²', '🧮':'—', '💭':'—', '⏳':'s⁻¹',
}
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
    [f for f in glob.glob(os.path.join(API, '*', '*.js')) + glob.glob(os.path.join(API, '*', '*', '*.js'))
     if 'hitran_lines' not in f and os.sep + 'demo' + os.sep not in f]
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
        for m in re.finditer(r'\b(CONST|CONV|EARTH)\.([A-Z_][A-Z0-9_]*)\b', l):
            CONSTANTES[m.group(1) + '.' + m.group(2)].append((rel, i, s[:190]))
        for m in re.finditer(r"CLOUD_SW\.([A-Z_][A-Z0-9_]*)\b", l):
            CONSTANTES['CLOUD_SW.' + m.group(1)].append((rel, i, s[:190]))

# ─── 3. le CONTRÔLE : une clé 🍰 doit dire de quoi elle est une proportion ────
fautes = []
toutes = sorted({k for ks in familles.values() for k in ks})
for k in toutes:
    if not k.startswith('🍰'): continue
    if '❀' in k: continue                      # gabarit générique, pas une clé réelle
    _, nature = unite_de(k)
    if nature is None:
        fautes.append(k)
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
        ecr = usages("['%s']" % k, True)
        lec = usages("['%s']" % k, False)
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
for nom in sorted(CONSTANTES):
    us = CONSTANTES[nom]
    defs = [u for u in us if re.search(re.escape(nom) + r'\s*=[^=]', u[2])]
    lect = [u for u in us if u not in defs]
    val = ''
    if defs:
        m = re.search(re.escape(nom) + r'\s*=\s*([^;]+);', defs[0][2])
        if m: val = m.group(1).strip()[:60]
    parts.append('<details class="k const"><summary><code>%s</code>'
                 '<span class="val">%s</span><span class="cnt">%d lect.</span></summary>'
                 % (esc(nom), esc(val), len(lect)))
    parts.append(bloc_usages('Définie ici', defs, 'ecr'))
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
