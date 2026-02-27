# Proposition de rangement des HTML

## Principe

- **html/** : tous les HTML **utilisés par l’app** (injectés, iframes, modales).
- **Racine** : uniquement **index.html** (point d’entrée).
- **doc/** : HTML d’**exploration** ou de doc (tests, rapports, tableaux).
- **static/** : pas de HTML d’app ; uniquement assets (JS, CSS, fonts, libs).

---

## Inventaire actuel

| Fichier | Emplacement | Rôle | Référencé par |
|--------|-------------|------|----------------|
| index.html | racine | Point d’entrée app | — |
| visu_radiatif.html | racine | Fragment → #visu-panel | loader_panels.js (fetch) |
| scie_radiatif.html | racine | Fragment + iframe scie | loader_panels.js (fetch) |
| scie_compute.html | **html/** | Vue scie (iframe) | scie_radiatif.html (src iframe) |
| alphabet.html | static/compute/ | Contenu modal Alphabet | index.html (openPageModal), alphabet.js (resolveImagePath) |
| dico.html | static/compute/ | Contenu modal Dico | index.html (openPageModal) |
| equation.html | racine | Page modale Équations | index.html (openPageModal) |
| Algorithmes.html | racine | Page modale Algorithmes | index.html (openPageModal) |
| test_milankovitch.html | racine | Test / exploration | — |
| test_computeRadiativeTransfer.html | doc/ | Backup test | doc (exploration) |
| PARAMETRES_EPOQUES.html | doc/ | Doc tableau | exploration |
| ANALYSE_PERFORMANCE.html | doc/ | Doc analyse | Algorithmes.html (référence) |

---

## Proposition de structure cible

```
CO2/
├── index.html                    # Seul HTML à la racine (entrée)
├── html/                         # Tous les HTML de l’app
│   ├── scie_compute.html         # (déjà en place)
│   ├── visu_radiatif.html        # fragment visu
│   ├── scie_radiatif.html        # fragment scie
│   ├── alphabet.html             # contenu modal Alphabet
│   ├── dico.html                 # contenu modal Dico
│   ├── equation.html             # modale Équations
│   ├── algorithmes.html          # modale Algorithmes (minuscule cohérent)
│   └── css/
│       └── scie_compute.css
├── doc/                          # Exploration / doc uniquement
│   ├── test_computeRadiativeTransfer.html
│   ├── PARAMETRES_EPOQUES.html
│   ├── ANALYSE_PERFORMANCE.html
│   └── … (md, etc.)
├── static/
│   ├── compute/                  # Plus d’HTML, seulement JS/CSS
│   │   ├── alphabet.js
│   │   ├── dico.js
│   │   ├── calculations_flux.js
│   │   └── …
│   └── …
└── fonts/                        # Inchangé (référencé par alphabet, organigramme)
```

**Tests / exploration** : `test_milankovitch.html` peut rester à la racine (accès direct) ou aller dans `doc/` selon usage.

---

## Impact sémantique et modifications

### 1. Ce qui ne change pas

- **doc/** : reste “exploration / doc”. Pas de lien fort avec l’app.
- **index.html** : reste le seul point d’entrée à la racine.
- **fonts/** : toujours à la racine du projet ; les chemins relatifs depuis `html/` seront `../fonts/`.

### 2. Fragments visu / scie (déjà partiellement fait pour scie)

| Action | Fichier | Modification |
|--------|---------|--------------|
| Déplacer | visu_radiatif.html | racine → html/ |
| Déplacer | scie_radiatif.html | racine → html/ |
| Mettre à jour | loader_panels.js | `fetch('visu_radiatif.html')` → `fetch('html/visu_radiatif.html')`, idem pour scie_radiatif |

Sémantique : “tout le contenu HTML de l’app vit sous html/”. Les scripts restent dans static/, seul le chemin de fetch change.

### 3. Modales (alphabet, dico, equation, algorithmes)

| Action | Fichier | Modification |
|--------|---------|--------------|
| Déplacer | alphabet.html, dico.html | static/compute/ → html/ |
| Déplacer | equation.html, Algorithmes.html | racine → html/ |
| Mettre à jour | index.html | openPageModal('./static/compute/alphabet.html') → openPageModal('html/alphabet.html'), idem dico, equation, Algorithmes |
| Adapter | static/compute/alphabet.js | Dans `resolveImagePath`, ajouter le cas “page servie depuis html/” : si `base.includes('/html/')` alors préfixe `../` (fonts à la racine = `../fonts/...`) |

Option Algorithmes : garder la référence vers `doc/ANALYSE_PERFORMANCE.html` (iframe ou lien) ; doc reste le réservoir de contenu “doc/exploration”.

### 4. Risques évités

- **Pas de HTML d’app dans doc/** : doc = exploration uniquement, pas de dépendance de l’app vers doc pour les écrans.
- **Pas de HTML dans static/** : static = assets (JS, CSS, données), pas de pages ; les chemins relatifs (ex. fonts) se raisonnent depuis `html/`.
- **Un seul point d’entrée** : tout passe par index.html ; les autres HTML sont des fragments ou des modales/iframes.

---

## Ordre de mise en œuvre recommandé

1. **Déjà fait** : scie_compute.html + css dans html/.
2. **Phase 2** : fragments visu/scie  
   - Déplacer visu_radiatif.html et scie_radiatif.html dans html/.  
   - Mettre à jour loader_panels.js (fetch vers html/).
3. **Phase 3** : modales  
   - Déplacer alphabet.html, dico.html vers html/.  
   - Mettre à jour index.html (openPageModal → html/).  
   - Adapter alphabet.js (resolveImagePath pour base contenant `/html/`).
4. **Phase 4** : equation + algorithmes  
   - Déplacer equation.html et Algorithmes.html vers html/.  
   - Mettre à jour index.html.  
   - Si Algorithmes inclut ou lie doc/ANALYSE_PERFORMANCE.html, garder ce lien (doc reste source de contenu doc).
5. **Nettoyage** : supprimer les anciens fichiers à la racine et dans static/compute/ après vérification.

---

## Résumé

- **Rangement cohérent** : app = html/ + index à la racine ; exploration = doc/ ; assets = static/ (+ fonts à la racine).
- **Sémantique préservée** : pas de mélange app/doc, chemins explicites (html/…, ../fonts/…), un seul point d’entrée.
- **Limite** : `resolveImagePath` dans alphabet.js doit connaître `html/` en plus de `static/compute/` pour que alphabet.html fonctionne depuis html/.
