# Références : littérature vs config par époque, bornes du tuning

**Source unique** pour retrouver où sont documentées les données littéraires et les bornes de tuning.

---

## 1. Données littéraires vs config par époque

| Fichier | Rôle |
|---------|------|
| **API_BILAN/config/configTimeline.js** | Source de vérité des paramètres par époque (🌡️🧮, 🔋☀️, ⚖️🏭, etc.) |
| **doc/autorités/RAPPORT_CONFIG_TIMELINE_VS_LITTERATURE.md** | Synthèse config vs littérature (température, soleil, masses gaz, flux géothermique) |
| **doc/autorités/COMPARAISON_LITTERATURE_16C.md** | Comparaison variables du modèle @ 16,1°C avec ordres de grandeur Terre (cycle eau, atmosphère, albédo) |
| **doc/autorités/VALIDATION_CONFIG_GAZ.md** | Traçabilité masses gaz (⚖️🏭, ⚖️⛽, ⚖️🫁) par époque vs littérature |
| **doc/EPOQUES_RECAP.md** | Récap époques et choix des emojis (⚫🔥🦠🌿…) |
| **doc/PARAMETRES_EPOQUES.html** | Tableau paramètres (aligné configTimeline) |

---

## 2. Bornes du tuning (fine-tuning)

| Fichier | Rôle |
|---------|------|
| **API_BILAN/config/fine_tuning_bounds.js** | Bornes min / max / default par cible (CLOUD_SW, SOLVER, etc.) — `window.FINE_TUNING_BOUNDS` |
| **API_BILAN/config/model_tuning.js** | Paramètres nominaux du modèle (CLOUD_SW, SOLVER, etc.) |
| **API_BILAN/config/model_tuning_biblio.js** | Références biblio associées aux paramètres de tuning |

---

*Créé 2025-03-08 — à mettre à jour si déplacement de fichiers.*
