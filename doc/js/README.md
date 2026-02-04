# doc/js/ - Scripts spécifiques aux pages doc/

## Stratégie de compatibilité avec test_computeRadiativeTransfer.html

**Règle** : Les pages `doc/test_computeRadiativeTransfer.html` et `doc/scie_compute.html` chargent des scripts communs depuis `../static/`. Si des modifications dans ces scripts communs cassent `test_computeRadiativeTransfer.html`, la solution est :

1. **Ne pas retirer** de comportement des JS communs sans alternative
2. **Si retrait nécessaire** (ex: pour sync index ↔ scie) : ajouter le comportement original dans `doc/js/test_computeRadiativeTransfer.js` et charger ce fichier uniquement dans `test_computeRadiativeTransfer.html`
3. **Code sync/iframe** : toujours garder avec `if (window.CO2_EVENTS)` ou `if (window !== window.top)` pour ne pas s'exécuter en contexte standalone

## Fichiers

| Fichier | Usage |
|---------|-------|
| `test_computeRadiativeTransfer.js` | Overrides / restauration de comportement pour la page de test backup. Chargé par `test_computeRadiativeTransfer.html` après les scripts communs. |

## Scripts chargés par test_computeRadiativeTransfer.html

- Scripts communs : `../static/` (calculations, compute, physics, etc.)
- **Ne charge pas** : main.js, loader_panels.js, sync_panels.js, event_bus.js
- **Charge** : `doc/js/test_computeRadiativeTransfer.js` (overrides si besoin)
