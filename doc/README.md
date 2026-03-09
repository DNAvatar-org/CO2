# Documentation CO2 / Bilan Radiatif

Documentation centrée sur **config, données, formules, validation** (API / époques / calculs).  
Docs **projet** (architecture, rangement, refactor, synthèse) : **<code>../projet/</code>**.  
Docs **autorités** (littérature, validation config) : **<code>doc/autorités/</code>**.

## Contenu

| Fichier / dossier | Description |
|-------------------|-------------|
| **API/** | Documentation technique API / modèle : algorithme, convergence, formules, variables, précision, EDS/albédo, vapeur/nuages, debug, plan HITRAN, régression, diagnostic. Voir **API/README.md**. |
| **autorités/** | Littérature scientifique, validation config (RAPPORT_CONFIG_TIMELINE_VS_LITTERATURE, COMPARAISON_LITTERATURE_16C, VALIDATION_CONFIG_GAZ) |
| **PARAMETRES_EPOQUES.html** | Paramètres des époques (aligné API_BILAN/config/configTimeline.js) |
| **EPOQUES_RECAP.md** | Récapitulatif des époques et choix des emojis |
| **epoquesGeologiques.txt** | Dates de séparation des périodes géologiques |
| **grammar.txt** | Lexique unités et éléments (🔘, 📿, 🌡️, etc.) |
| **ANALYSE_PERFORMANCE.html** | Analyse de performance des algorithmes (+ workers) |
| **REFS_LITTERATURE_ET_TUNING.md** | Index : littérature vs config, bornes tuning (pointe vers autorités/ et API_BILAN/config) |
| **test_computeRadiativeTransfer.html** | Backup de test (NE PAS TOUCHER) |

## Fichiers supprimés (nettoyage 2025-01)

- SETUP_GITHUB.md — projet RadiativeForcing, chemins obsolètes
- algo.txt — remplacé par doc/API/ALGORITHME_CALCULS.md
- logos.txt — chemins obsolètes, infos dans configTimeline
- mermaid-simulation.html — démo non utilisée
- patterns-demo.html — démo patterns SVG
- World_algo.html — simulateur alternatif non utilisé
- RadiativeForcing.py — script Python standalone (référence vidéo YouTube)
