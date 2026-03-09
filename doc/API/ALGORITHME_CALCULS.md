# Algorithme des Calculs - Structure avec Labels/Goto

## Vue d'ensemble

Ce document décrit la **structure conceptuelle** de l'algorithme (étapes, ordre, boucles). Le pseudocode en LABEL/goto est une vue simplifiée ; l'implémentation réelle n'utilise pas de goto.

**Points d'entrée actuels :**
- **`computeRadiativeTransfer(callback)`** — Chemin principal (API) : `API_BILAN/api.js` appelle `initForConfig()` puis `computeRadiativeTransfer(dispatcher)`. Implémentation dans `API_BILAN/convergence/calculations_flux.js` (async, phases Init → Search → Dicho, cycle eau, franchissements 0°C/T_boil). C'est le chemin utilisé par l'interface (sync_panels, scie_compute).
- **`simulateRadiativeTransfer()`** — Chemin legacy (sync) : `API_BILAN/radiative/calculations.js`, appelé par `static/ui/main.js` dans certains contextes. Boucle dichotomie propre, pas de cycle eau/albédo itératif.

Les deux chemins partagent : lecture config époque (DATA, TIMELINE), calcul flux pour une T donnée (`calculateFluxForT0`), convergence vers équilibre radiatif (flux_entrant ≈ flux_sortant).

1. **Boucle extérieure** (conceptuelle) : Changements d'époque, événements (météorites, ticTime), recalculs
2. **Boucle intérieure** : Itérations de convergence (Search puis dichotomie) pour trouver T0

---

## Structure de l'algorithme

### BOUCLE EXTÉRIEURE (simulateRadiativeTransfer)

```javascript
function simulateRadiativeTransfer(CO2_fraction, options = {}) {
    // ============================================
    // ÉTAPE 1 : LECTURE DES DATA CONFIG (si changement d'époque)
    // ============================================
    LABEL_READ_CONFIG:
    {
        // 1.1. Récupérer l'époque actuelle
        const currentEpochName = window.currentEpochName || 'Corps noir';
        const currentEpoch = getGeologicalPeriodByName(currentEpochName);
        
        // 1.2. Vérifier si changement d'époque (comparer avec epoch précédente)
        if (epochChanged) {
            // 1.2.1. Réinitialiser les variables globales
            // 1.2.2. Charger les paramètres de l'époque :
            //   - t0 (température initiale)
            //   - CO2, CH4, H2O (fractions)
            //   - geothermal_flux
            //   - events (météorites, ticTime)
            //   - albedo_base
            //   - etc.
            
            }
    }
    
    // ============================================
    // ÉTAPE 2 : CALCULS INIT DES DATA INIT
    // ============================================
    LABEL_INIT_DATA:
    {
        // 2.1. Calculer ticTime = infoTimeMa / 50
        const ticTime = Math.floor(window.infoTimeMa / 50);
        
        // 2.2. Calculer meteoriteCount depuis h2oTotalFromMeteorites
        const meteoriteCount = calculateMeteoriteCount(currentEpoch);
        
        // 2.3. Récupérer l'état du bouton "anim" (controle l'affichage des étapes)
        // 🔒 UTILISER UNIQUEMENT la variable globale unique window.isAnim (seule référence)
        // Cette variable est initialisée depuis la config UNIQUEMENT au changement d'époque (setEpoch)
        // Si l'utilisateur change le bouton anim, la config ne l'écrase plus
        // La boucle principale ne relit PAS la config, elle utilise la valeur courante
        const showDichotomySteps = typeof window !== 'undefined' && window.isAnim !== undefined
            ? window.isAnim
            : true; // Fallback par défaut
        
        // 2.4. Calculer T0_initial_config :
        //   - Si prev_T0 existe : utiliser prev_T0 directement (déjà convergé)
        //   - Sinon : baseTemp (t0 ou initial_temperature_K) + deltas
        //     * deltaTemp_ticTime * ticTime
        //   ⚠️ NOTE : Le calcul peut dépendre de showDichotomySteps (anim enabled/disabled)
        //   Si anim est désactivé, on peut utiliser une stratégie plus directe (à implémenter)
        const T0_initial_config = calculateInitialTemperature(
            currentEpoch, 
            prev_T0, 
            meteoriteCount, 
            ticTime,
            showDichotomySteps  // Passer l'état du bouton anim
        );
        
        // 2.5. Anticiper la couleur avec T0_initial_config
        updateAnticipatedColor(T0_initial_config);
    }
    
    // ============================================
    // ÉTAPE 3 : CALCUL DE L'ATM, PRESSION, CYCLE EAU, ALBEDO
    // ============================================
    LABEL_CALCUL_ATMOSPHERE:
    {
        // 3.1. Calculer les propriétés atmosphériques
        //   - calculateAtmosphereProperties(total_atmosphere_mass_kg, T0, molar_mass_air, gravity)
        //   - z_max, scale_height, pressure_atm
        
        // 3.2. Calculer le cycle de l'eau (si H2O activé)
        //   - calculateH2OParameters(T0, pressure_atm, ...)
        //   - h2o_vapor_percent, h2o_ice_fraction
        
        // 3.3. Calculer l'albedo
        //   - calculateAlbedo(T0, ice_coverage, cloud_coverage, ...)
        //   - albedo_num, albedoBreakdown
        
        // 3.4. Calculer le flux solaire absorbé
        //   - calculateSolarFluxAbsorbed(T0, h2o_enabled, geo_flux)
        //   - solar_flux_absorbed_wm = solar_flux_average_wm - solar_flux_reflected_wm
    }
    
    // ============================================
    // ÉTAPE 4 : MAJ DES GRADUATIONS DU GRAPH
    // ============================================
    LABEL_UPDATE_GRAPH:
    {
        // 🔒 REGROUPER TOUTES LES GRADUATIONS ICI (même si différentes selon l'époque)
        // 4.1. Mettre à jour les graduations selon l'époque
        //   - z_max (hauteur atmosphérique)
        //   - T_range (plage de températures)
        //   - lambda_range (plage de longueurs d'onde)
        if (typeof window.updatePlotGraduations === 'function') {
            window.updatePlotGraduations(currentEpoch);
        }
        
        // 4.2. Mettre à jour les traces du graphique si nécessaire
    }
    
    // ============================================
    // ÉTAPE 5 : BOUCLE INTÉRIEURE - CONVERGENCE T0
    // ============================================
    LABEL_CONVERGENCE_LOOP:
    {
        // 5.1. Initialiser les variables de convergence
        let T0_current = T0_initial_config;
        let previousT0_for_convergence = null;
        let iter = 0;
        let T0_min, T0_max;
        let exponentialPhase = false;
        
        // 5.2. Lire la précision de convergence depuis la variable globale unique
        // 🔒 UTILISER UNIQUEMENT window.convergencePrecision_K (seule référence)
        // Cette variable est initialisée depuis la config UNIQUEMENT au changement d'époque (setEpoch)
        // Si l'utilisateur change la précision, la config ne l'écrase plus
        // La boucle principale ne relit PAS la config, elle utilise la valeur courante
        const precision_K = typeof window !== 'undefined' && window.convergencePrecision_K !== undefined
            ? window.convergencePrecision_K
            : 0.1; // Fallback par défaut
        
        // 5.3. Calculer la tolérance initiale
        const tolerance_initial = calculateTolerance(T0_initial_config, precision_K);
        
        // 5.4. BOUCLE ITÉRATIVE
        LABEL_ITERATION:
        {
            // 5.4.1. Calculer le flux pour T0_current
            const result = calculateFluxForT0(CO2_fraction, T0_current, options);
            
            // 5.4.2. Calculer delta_equilibre = flux_sortant - flux_entrant
            const delta_equilibre = result.total_flux - (solar_flux_absorbed + geo_flux);
            
            // 5.4.3. Recalculer la tolérance avec T0_current (pour précision adaptative)
            const tolerance_current = calculateTolerance(T0_current, precision_K);
            
            // 5.4.4. Vérifier la convergence
            const converged_by_flux = Math.abs(delta_equilibre) <= tolerance_current;
            const delta_T = previousT0_for_convergence !== null 
                ? Math.abs(T0_current - previousT0_for_convergence) 
                : Infinity;
            // Convergence par température : seulement si équilibre presque atteint
            const converged_by_temp = previousT0_for_convergence !== null 
                && delta_T <= precision_K 
                && Math.abs(delta_equilibre) <= tolerance_current * 10;
            
            // 5.4.5. Si convergence atteinte
            if (converged_by_flux || converged_by_temp || iter > 20) {
                // Recalculer avec spectre complet pour précision finale
                const final_result = calculateFluxForT0(CO2_fraction, T0_current, { ...options, fullSpectre: true });
                
                // Finaliser les résultats
                finalizeResults(final_result, T0_current, CO2_fraction);
                
                // Stocker prev_T0 pour le prochain calcul
                prev_T0 = T0_current;
                
                // Sortir de la boucle intérieure
                goto LABEL_END_CONVERGENCE;
            }
            
            // 5.4.6. Calculer le nouvel ajustement de T0
            // Phase exponentielle (première itération si delta_equilibre grand)
            if (iter === 0 && Math.abs(delta_equilibre) > tolerance_current) {
                exponentialPhase = true;
                // Initialiser T0_min et T0_max selon le signe de delta_equilibre
                if (delta_equilibre < 0) {
                    // On émet moins qu'on reçoit → augmenter T
                    T0_min = T0_current;
                    T0_max = T0_min + Math.abs(delta_equilibre) / 3000;
                } else {
                    // On émet trop → diminuer T
                    T0_max = T0_current;
                    T0_min = T0_max - Math.abs(delta_equilibre) / 3000;
                }
            }
            
            // Phase dichotomie (après phase exponentielle ou si flux_diff > 0)
            if (!exponentialPhase) {
                // Ajuster T0_min ou T0_max selon le signe de delta_equilibre
                if (delta_equilibre < 0) {
                    T0_min = T0_current;
                } else {
                    T0_max = T0_current;
                }
                // Nouveau T0 = (T0_min + T0_max) / 2
                T0_current = (T0_min + T0_max) / 2;
            } else {
                // Phase exponentielle : incrémenter progressivement
                const increment = exponentialIncrement * (delta_equilibre < 0 ? 1 : -1);
                T0_current += increment;
                exponentialIncrement *= 2; // Double l'incrément à chaque itération
                
                // Détecter le changement de signe pour passer en dichotomie
                if (lastFluxDiffSign !== null && 
                    ((delta_equilibre < 0 && lastFluxDiffSign > 0) || 
                     (delta_equilibre > 0 && lastFluxDiffSign < 0))) {
                    exponentialPhase = false;
                    // T0_min et T0_max sont déjà définis
                }
                lastFluxDiffSign = delta_equilibre < 0 ? -1 : (delta_equilibre > 0 ? 1 : 0);
            }
            
            // 5.4.7. Mettre à jour previousT0_for_convergence
            previousT0_for_convergence = T0_current;
            
            // 5.4.8. Afficher l'étape si demandé
            if (window.showDichotomySteps) {
                displayDichotomyStep(CO2_fraction, T0_current, result, iter);
            }
            
            // 5.4.9. Incrémenter l'itération
            iter++;
            
            // 5.4.10. Retour à LABEL_ITERATION (boucle intérieure)
            goto LABEL_ITERATION;
        }
        
        LABEL_END_CONVERGENCE:
        {
            // Sortie de la boucle intérieure
        }
    }
    
    // ============================================
    // ÉTAPE 6 : FIN DU CALCUL
    // ============================================
    LABEL_END:
    {
        // 6.1. Mettre à jour l'organigramme avec les résultats finaux
        updateFluxLabels(final_result, T0_current);
        
        // 6.2. Mettre à jour le graphique spectral
        updateSpectralVisualization();
        
        // 6.3. Retourner les résultats
        return {
            T0: T0_current,
            result: final_result,
            prev_T0: T0_current
        };
    }
}
```

---

## Points d'entrée pour les boucles

### Boucle extérieure (recalculs)
- **Changement d'époque** → `goto LABEL_READ_CONFIG`
- **Événement météorite** → `goto LABEL_INIT_DATA`
- **Événement ticTime** → `goto LABEL_INIT_DATA`
- **Changement CO2/H2O/CH4** → `goto LABEL_CALCUL_ATMOSPHERE`

### Boucle intérieure (convergence)
- **Nouvelle itération** → `goto LABEL_ITERATION`
- **Convergence atteinte** → `goto LABEL_END_CONVERGENCE`

---

## Ordre d'exécution typique

1. **Premier calcul** :
   ```
   LABEL_READ_CONFIG → LABEL_INIT_DATA → LABEL_CALCUL_ATMOSPHERE 
   → LABEL_UPDATE_GRAPH → LABEL_CONVERGENCE_LOOP → LABEL_END
   ```

2. **Ajout de météorite** :
   ```
   LABEL_INIT_DATA → LABEL_CALCUL_ATMOSPHERE → LABEL_CONVERGENCE_LOOP → LABEL_END
   ```

3. **Changement d'époque** :
   ```
   LABEL_READ_CONFIG → LABEL_INIT_DATA → LABEL_CALCUL_ATMOSPHERE 
   → LABEL_UPDATE_GRAPH → LABEL_CONVERGENCE_LOOP → LABEL_END
   ```

---

## Notes importantes

- **prev_T0** : Température finale du calcul précédent, utilisée comme base pour éviter de réappliquer les deltas
- **T0_initial_config** : Température initiale pour le calcul actuel (peut être prev_T0 ou baseTemp + deltas)
- **Convergence par température** : Critère secondaire, ne se déclenche QUE si l'équilibre radiatif est presque atteint
- **Tolérance adaptative** : Recalculée à chaque itération avec T0_current pour une précision correcte

---

## Correspondance avec le code (référence rapide)

| Concept doc | Implémentation (API path) |
|-------------|----------------------------|
| Lecture config époque | `initForConfig()` → `COMPUTE.getEpochDateConfig()`, `calculateT0()` ; époque = `DATA['📜']['🗿']`, index = `DATA['📜']['👉']` |
| Précision convergence | `DATA['📜']['🧲🔬']` (K) ; tolérance flux (W/m²) = `computeToleranceWm2(T, precision_K)` via `DATA['🎚️'].SOLVER` |
| T courante / prev | `DATA['🧮']['🧮🌡️']`, `DATA['🧮']['🧮🌡️⏮']` ; pas de variable globale `prev_T0` |
| Delta équilibre | **Code :** `🔺🧲 = flux_entrant - flux_sortant` (Δ>0 ⇒ réchauffer, Δ<0 ⇒ refroidir). Le doc utilise parfois l’opposé (sortant − entrant) ; le sens des ajustements reste le même. |
| Phases convergence | Init → Search (incrément ∝ Δ/(4σT³)) → au changement de signe de Δ → Dicho (milieu de [🔽,🔼]) ; `DATA['🧮']['🧮⚧']` = Init / Search / Dicho |
| Fichiers | Config : `API_BILAN/config/configTimeline.js`, `API_BILAN/convergence/compute.js` ; boucle : `API_BILAN/convergence/calculations_flux.js` ; radiatif : `API_BILAN/radiative/calculations.js` |

