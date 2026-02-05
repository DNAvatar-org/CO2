# Audit setTimeout — justification de chaque usage

Objectif : minimiser l'asynchrone, documenter les cas où setTimeout est **obligatoire**.

## Légende
- **OBLIGATOIRE** : nécessaire (API externe, yield event loop, etc.)
- **DOM** : attente du rendu DOM / layout
- **UX** : délai volontaire pour l'expérience utilisateur
- **À REVOIR** : candidat pour suppression ou remplacement synchrone

---

## static/main.js
| Ligne | Délai | Raison |
|-------|-------|--------|
| 738 | ? | **À REVOIR** — calcul scénario, vérifier si synchrone possible |
| 867, 887 | ? | **DOM** — Plotly doit finir le rendu avant updateSpectralVisualization |
| 1128, 2653 | ? | **OBLIGATOIRE** — délai avant calcul pour permettre annulation (clic Stop) |
| 1309, 1329 | ? | **DOM** — idem Plotly |
| 1791 | ? | **DOM** — MathJax.typesetPromise, attendre fin rendu LaTeX |
| 2876, 2896 | ? | **DOM** — Plotly |
| 3015 | 200ms | **DOM** — RAF+RAF+setTimeout : laisser navigateur finaliser le rendu avant init listeners |
| 3158, 3171 | 100ms | **OBLIGATOIRE** — boucle de vérification FPS (réessayer si 30<FPS<60) |
| 3239 | 100ms | **DOM** — boutons flux créés par organigramme, délai pour injection HTML |
| 3257 | 100ms | **DOM** — info-time et updateTimeline, même batch que ci-dessus |

---

## static/loader_panels.js
| Ligne | Délai | Raison |
|-------|-------|--------|
| 179-182 | RAF×2 | **DOM** — pas de setTimeout, RAF suffit pour laisser setEpoch s'exécuter avant runComputeInParent |
| 206 | 500ms | **UX** — rollover Tipeee : délai avant affichage hover (éviter flash) |

---

## static/integrateEds.js
| Ligne | Délai | Raison |
|-------|-------|--------|
| 18 | 100ms | **DOM** — retry : cell-effetSerre ou synthese_EdS pas encore injectés (visu_radiatif.html) |
| 68, 71 | 500ms | **DOM** — organigramme génère le DOM dynamiquement, 500ms pour laisser generateNodes/Arrows finir |

---

## static/compute/calculations_flux.js
| Ligne | Délai | Raison |
|-------|-------|--------|
| 250, 264, 270 | 0ms | **OBLIGATOIRE** — `await new Promise(r=>setTimeout(r,0))` : yield event loop pour que Stop soit cliquable |
| 317, 470, 478, 599, 776, 783, 906, 911 | 0ms | **OBLIGATOIRE** — idem, boucle de convergence longue |

---

## static/calculations.js
| Ligne | Délai | Raison |
|-------|-------|--------|
| 837, 1016 | ? | **DOM** — Plotly / canvas spectral |
| 1245, 1559, 1675, 1680, 1683, 1691 | 100-500ms | **UX** — affichage progressif dichotomie (dots, iterate) |
| 1829, 1847, 1932 | ? | **DOM** — Plotly |

---

## static/courbes/plot.js, static/plot.js
| Usage | Raison |
|-------|--------|
| 50ms hideXAxisLine | **DOM** — réappliquer masquage après interaction Plotly |
| 100ms resizeTimeout | **DOM** — debounce resize, laisser layout se stabiliser |
| 0ms (callback) | **DOM** — Plotly finit de rendre |
| 1435, 1502 | **DOM** — Plotly crée annotations après rendu |
| 1473 debounceTimer | **DOM** — debounce recalculation canvas |
| 1710, 1764, 1804 | **DOM** — z-index, Plotly modifie le DOM |

---

## static/layout.js
| Ligne | Délai | Raison |
|-------|-------|--------|
| 144 | 100ms | **DOM** — debounce resize, éviter recalculs multiples pendant redimensionnement |

---

## static/tooltips.js
| Ligne | Délai | Raison |
|-------|-------|--------|
| 158 | ? | **UX** — délai avant affichage tooltip au survol (éviter flash) |

---

## static/FPS/FPS.js
| Ligne | Délai | Raison |
|-------|-------|--------|
| 381, 410 | 0ms | **DOM** — Plotly.Plots.resize après changement d'état |

---

## index.html
| Ligne | Délai | Raison |
|-------|-------|--------|
| 50 | 500ms | **DOM** — MathJax rendu LaTeX, puis ajout code source sélectionnable |

---

## Recommandations
1. **Event/slot** : remplacer les setTimeout(500) d'attente DOM par un événement `organigramme:ready` ou `panels:injected`.
2. **Pile d'init** : centraliser l'ordre dans un superviseur (ex. `initQueue.push(fn)`) pour éviter les délais arbitraires.
3. **RAF** : préférer `requestAnimationFrame` à `setTimeout(0)` quand c'est du rendu.
4. **calculations_flux** : les `setTimeout(r,0)` sont nécessaires pour la réactivité du bouton Stop — garder.
