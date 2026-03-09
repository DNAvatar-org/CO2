# Rangement projet — HTML, racine, static

Regroupe les propositions de **RANGEMENT_HTML.md** et **RANGEMENT_RACINE.md**. Une partie est déjà en place (html/, static/css/, static/img/fond.png, fonts/ à la racine).

---

## 1. Principe HTML et structure

- **html/** : HTML utilisés par l’app (injectés, iframes, modales). Déjà : scie_compute.html, visu_radiatif.html, scie_radiatif.html, equation.html, Algorithmes.html. CSS : static/css/ (equation, scie_compute, etc.).
- **Racine** : index.html (point d’entrée). server.* → **tools/** (tools/server.py, tools/server.sh).
- **doc/** : exploration / doc (tests, rapports, tableaux).
- **static/** : assets (JS, CSS, img, lib). Pas de HTML d’app ; alphabet.html, dico.html dans static/compute/ pour modales.

### Inventaire HTML (état actuel)

| Fichier | Emplacement | Rôle |
|--------|-------------|------|
| index.html | racine | Point d’entrée |
| visu_radiatif.html, scie_radiatif.html | html/ | Fragments (loader_panels fetch) |
| scie_compute.html | html/ | Vue scie (iframe) |
| equation.html, Algorithmes.html | html/ | Modales |
| alphabet.html, dico.html | static/compute/ | Modales Alphabet / Dico |
| test_computeRadiativeTransfer.html | doc/ | Backup test |
| PARAMETRES_EPOQUES.html, ANALYSE_PERFORMANCE.html | doc/ | Doc / exploration |

---

## 2. Rangement racine et static

- **static/** = fichiers servis tels quels (JS, CSS, libs, données). Convention du projet.
- **fonts/** : à la racine ; polices (04B_03, ProggyDotted) ; référencées depuis static/css/style.css par `../../fonts/`.
- **fonds/** : PNG par époque (00066Ma, 4300Ma, …).
- **fond.png** : dans **static/img/fond.png** ; style.css → `url('../img/fond.png')` depuis static/css/.

### Fichiers doc / texte

- .txt et .md de doc → **doc/** (sauf README.md à la racine). Docs API (algorithme, formules, convergence, etc.) → **doc/API/** ; ALGORITHME_CALCULS.md, SENS_CONVERGENCE, FORMULES, etc. dans doc/API/.
- **doc/hitran/** : données HITRAN (.data, .header) si présentes ; l’app utilise API_BILAN/data/hitran_lines_*.js.

### Références utiles

- Littérature vs config époques, bornes tuning : **doc/REFS_LITTERATURE_ET_TUNING.md**.

---

## 3. Ordre de mise en œuvre (ce qui reste éventuel)

1. Déjà fait : visu/scie dans html/, CSS dans static/css/, fond dans static/img/, server dans tools/.
2. Optionnel : déplacer alphabet.html, dico.html de static/compute/ vers html/ et adapter openPageModal + resolveImagePath (alphabet.js).
3. Optionnel : déplacer scripts HITRAN / données brutes vers doc/hitran/ si besoin.

*Dernière mise à jour : 2025-03-08 — fusion RANGEMENT_HTML + RANGEMENT_RACINE.*
