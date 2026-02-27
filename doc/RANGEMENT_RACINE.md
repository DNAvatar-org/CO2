# Rangement racine — trucs simples et évidents

## Ce que veut dire "static" ici

**static/** = dossier où sont les **fichiers servis tels quels** par l’app : JS, CSS, libs, données (hitran_lines_*.js, etc.). Ce n’est pas une norme : c’est une convention du projet.  
Les CSS ne sont **pas obligés** d’être tous dans static : on peut avoir du CSS à côté du HTML qui l’utilise (ex. `html/css/`, `equation.css` à côté de `equation.html`). Actuellement : `static/style.css`, `static/planet-effect.css`, `organigramme/organigramme.css`, `equation.css` à la racine, `html/css/scie_compute.css`. Donc "tout en static" n’est pas la règle — on peut garder une répartition par contexte (visu, scie, equation, organigramme).

---

## Évidents à faire en premier (sans casser l’app)

### 1. Polices à la racine → fonts/

| Fichier racine | Action |
|----------------|--------|
| `04B_03__.TTF` | Déplacer → `fonts/` |
| `ProggyDotted Regular.ttf` | Déplacer → `fonts/` |

À vérifier : les chemins dans le projet qui pointent vers ces TTF (CSS, JS). Si tout passe par `fonts/` ou par nom de fichier, aucun changement de code.

### 2. Fichiers texte / doc à la racine → doc/

| Fichier racine | Action |
|----------------|--------|
| `ALPHABET_ET_DICO.txt` | → `doc/` (aucune ref dans le code) |
| `ORDRE_APPEL_FONCTIONS.txt` | → `doc/` |
| `ALGORITHME_CALCULS.md` | → `doc/` |
| `SUSPECT_VARS.md` | → `doc/` |
| `_REGLE_JS_CRASH.md` | → `doc/` (ou garder à la racine si règle projet) |
| `debug_convergence_20260219T151932.txt` | → `doc/debug/` ou supprimer si plus utile |

Garder **README.md** à la racine (convention).

### 3. Données HITRAN à la racine → doc/hitran/ (+ scripts dedans si tu veux)

Fichiers concernés :  
`hitran_*.data`, `hitran_*.header`, `H2O_test.data`, `H2O_test.header`.

- L’app en ligne utilise **static/data/hitran_lines_*.js** (pas ces .data/.header).
- Ces fichiers servent aux **scripts Python** (`scripts/hitran_fetch_lines.py`, `scripts/hitran_spectral_bin_bounds.py`) et à la doc.

Proposition simple :

- Créer **doc/hitran/**.
- Y déplacer : tous les `hitran_*.data`, `hitran_*.header`, `H2O_test.data`, `H2O_test.header`.
- Soit déplacer **scripts/** dans **doc/hitran/scripts/** (tout le rep HITRAN dans doc),  
  soit garder **scripts/** à la racine et adapter les chemins dans les .py pour pointer vers `doc/hitran/` (ex. `../doc/hitran/`).

Comme ça : un seul "rep HITRAN" (doc + data + scripts optionnels).

### 4. equation.css

Actuellement : **equation.html** (racine) charge `equation.css` (racine).  
Si plus tard tu déplaces **equation.html** dans **html/**, mettre **equation.css** dans **html/css/** (ou à côté de equation.html) et mettre à jour le `href` dans equation.html. Pour l’instant, rien obligatoire à la racine.

### 5. fond.png

Référencé dans **static/style.css** : `url('../fond.png')` (depuis static, parent = racine).  
Pour alléger la racine : déplacer **fond.png** dans **static/** (ex. `static/fond.png`) et dans style.css mettre `url('fond.png')` ou `url('img/fond.png')` si tu crées `static/img/`. Simple et évident.

---

## Récap "évidents"

| Où | Quoi |
|----|------|
| **fonts/** | TTF actuellement à la racine |
| **doc/** | .txt et .md de doc (sauf README à la racine) |
| **doc/debug/** | Gros logs debug (ou à supprimer) |
| **doc/hitran/** | hitran_*.data/header, H2O_test.* ; optionnel : scripts/ dedans |
| **static/** (ou static/img/) | fond.png + mettre à jour style.css |

Pas touché dans cette phase : index.html, visu_radiatif.html, scie_radiatif.html, equation.html, Algorithmes.html, test_milankovitch.html, test_interpreter.js — à ranger dans une phase suivante (ex. avec doc/RANGEMENT_HTML.md).

---

## Ordre conseillé

1. Créer **doc/hitran/** et **doc/debug/**.
2. Déplacer TTF → fonts/.
3. Déplacer .txt et .md (sauf README) → doc/ ou doc/debug/.
4. Déplacer hitran_*.data/header et H2O_test.* → doc/hitran/.
5. Déplacer fond.png → static/ (ou static/img/) et corriger style.css.
6. (Optionnel) Déplacer scripts/ dans doc/hitran/scripts/ et adapter les chemins dans les .py.

Commencer par 1–3 : rien ne casse l’app, juste du rangement de fichiers.
