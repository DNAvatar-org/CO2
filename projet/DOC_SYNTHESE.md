# Synthèse documentation — Mise à jour 2025-02-04

## Ce qui a été mis à jour

| Fichier | Modifications |
|---------|---------------|
| **README.md** | Tableau contenu corrigé, ajout scie_compute.html, test_computeRadiativeTransfer, référence static/compute/ |
| **ANALYSE_REBRANCHEMENT_INDEX.md** | Architecture actuelle (visu_radiatif, scie_radiatif, loader_panels), chemins doc/scie_compute.html |
| **VARIABLES_FLUX.md** | Contexte : vue Visuel vs Scientifique, renvoi vers FORMULES_FLUX.md |
| **EPOQUES_RECAP.md** | Tableau emojis configTimeline (⚫🔥🦠🥟🦕🦴🦣🚂📱), source de vérité |
| **PRECISION_CALCULS_RADIATIF.md** | Fichiers concernés (calculations_flux.js), scripts HITRAN absents |
| **static/compute/FORMULES_FLUX.md** | Convention Δ : flux_entrant - flux_sortant (correction) |

## Mises à jour supplémentaires (2025-02-04)

| Fichier | Modifications |
|---------|---------------|
| **PARAMETRES_EPOQUES.html** | ✅ Aligné avec configTimeline.js — tableau correspondance, valeurs config par époque |
| **ANALYSE_PERFORMANCE.html** | ✅ Références numéros de ligne retirées (non disponibles), ajout computeRadiativeTransfer |
| **RAPPORT_CONFIG_TIMELINE_VS_LITTERATURE.md** | ✅ Créé — synthèse config vs littérature (temp, soleil, masses gaz) |
| **PRECISION_CALCULS_RADIATIF.md** | ✅ Scripts HITRAN : supprimés par l'auteur, params validés vs littérature |

## Fichiers potentiellement redondants ou inutiles

| Fichier | Statut | Action suggérée |
|---------|--------|-----------------|
| **doc/test_computeRadiativeTransfer.html** | Backup (NE PAS TOUCHER) | Garder comme référence, ne pas modifier |
| **doc/css/test_computeRadiativeTransfer.css** | Backup | Idem |
| **VARIABLES_FLUX.md** vs **FORMULES_FLUX.md** | Complémentaires | VARIABLES = plotData (Visuel), FORMULES = DATA (Scientifique). Pas doublon. |
| **FORMULES.md** (doc/) vs **FORMULES_FLUX.md** (static/compute/) | Différents | FORMULES.md = formules math (Planck, atmosphère). FORMULES_FLUX = flux 🧲 détaillés. |
| **doc/API/ALGORITHME_CALCULS.md** | Décrit simulateRadiativeTransfer + computeRadiativeTransfer | Vue conceptuelle + correspondance code (API_BILAN/convergence, radiative). |
| **epoquesGeologiques.txt** | Données brutes | À vérifier si utilisé ou doublon de configTimeline |

## Doublons identifiés

- **Emojis époques** : EPOQUES_RECAP.md avait des choix historiques (🐚 Archéen) ; configTimeline utilise 🦠. Tableau de correspondance ajouté.
- **Convention Δ** : FORMULES_FLUX.md avait flux_sortant - flux_entrant ; le code utilise flux_entrant - flux_sortant. Corrigé.
