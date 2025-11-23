// ============================================================================
// File: calculations_geology.js
// Desc: Fonctions de calcul géologique basées sur la configuration centralisée
// ============================================================================

// Constantes pour la croûte molle (identiques à geology.js)
const CRUST_MOLTEN_START = 4.6e9;  // Début : formation de la Terre (4.6 Ga)
const CRUST_MOLTEN_END = 3.5e9;    // Fin : croûte solidifiée (3.5 Ga)
const CRUST_MOLTEN_FACTOR_MAX = 100; // Facteur maximum (x100) au tout début
const CRUST_MOLTEN_FACTOR_MIN = 10;  // Facteur minimum (x10) à la fin de la période

// Fonction pour obtenir une période géologique par son nom depuis configOrganigramme
function getGeologicalPeriodByName(periodName) {
    if (typeof window.configOrganigramme === 'undefined' || !window.configOrganigramme.timeline) {
        console.error("configOrganigramme.timeline n'est pas chargé");
        return null;
    }

    // Chercher dans la timeline (filtrer les séparateurs)
    const epoch = window.configOrganigramme.timeline.find(item =>
        item.type === 'epoch' && (item.name === periodName || item.id === periodName)
    );

    if (epoch) {
        // Ajouter un alias pour compatibilité avec l'ancien code qui attendait core_temperature_k
        return {
            ...epoch,
            core_temperature_k: epoch.core_temperature
        };
    }
    return null;
}

// Fonction pour obtenir la période géologique selon les années
function getGeologicalPeriod(yearsAgo) {
    if (typeof window.configOrganigramme === 'undefined' || !window.configOrganigramme.timeline) {
        return null;
    }

    // Filtrer pour ne garder que les époques
    const epochs = window.configOrganigramme.timeline.filter(item => item.type === 'epoch');

    // Parcourir les périodes (supposées ordonnées chronologiquement ou inversement ?)
    // Dans configOrganigramme, elles sont de la plus ancienne à la plus récente (Corps noir -> Aujourd'hui)
    // Mais startYears/endYears sont définis (ex: Hadéen start=4.5e9, end=4.0e9)

    // On cherche la période où yearsAgo est entre startYears et endYears
    // Attention : endYears peut être -1 pour "Aujourd'hui"

    for (const epoch of epochs) {
        // Vérifier si startYears et endYears sont définis
        if (typeof epoch.startYears === 'number' && typeof epoch.endYears === 'number') {
            // Cas normal : startYears > endYears (passé vers présent)
            if (yearsAgo <= epoch.startYears && yearsAgo > epoch.endYears) {
                return {
                    ...epoch,
                    core_temperature_k: epoch.core_temperature
                };
            }
            // Cas "Aujourd'hui" : endYears = -1, startYears = 0
            // Si yearsAgo est très petit (futur ou présent)
            if (epoch.endYears === -1 && yearsAgo <= epoch.startYears && yearsAgo >= 0) {
                return {
                    ...epoch,
                    core_temperature_k: epoch.core_temperature
                };
            }
        }
    }

    // Si non trouvé, retourner la dernière époque (Aujourd'hui) par défaut
    const currentEpoch = epochs[epochs.length - 1];
    return {
        ...currentEpoch,
        core_temperature_k: currentEpoch.core_temperature
    };
}

// Fonction pour calculer le facteur de croûte terrestre molle
function getMoltenCrustFactor(yearsAgo) {
    // Si on est avant la période de croûte molle, pas d'effet
    if (yearsAgo < CRUST_MOLTEN_END) {
        return 1.0; // Pas de croûte molle
    }

    // Si on est après le début de la Terre, facteur maximum
    if (yearsAgo >= CRUST_MOLTEN_START) {
        return CRUST_MOLTEN_FACTOR_MAX; // x100 au tout début
    }

    // Interpolation linéaire entre le début (x100) et la fin (x10)
    const progress = (yearsAgo - CRUST_MOLTEN_END) / (CRUST_MOLTEN_START - CRUST_MOLTEN_END);
    const factor = CRUST_MOLTEN_FACTOR_MIN + (CRUST_MOLTEN_FACTOR_MAX - CRUST_MOLTEN_FACTOR_MIN) * (1 - progress);

    return factor;
}

// Fonction pour obtenir l'époque géologique et le facteur volcanique selon les années
// Remplace l'ancienne getGeologicalEra de geology.js
function getGeologicalEra(years) {
    const yearsAgo = years;
    const period = getGeologicalPeriod(yearsAgo);

    if (period) {
        const moltenCrustFactor = getMoltenCrustFactor(yearsAgo);
        // Utiliser le volcanoFactor défini dans la config
        const baseVolcanoFactor = period.volcanoFactor || 1.0;

        return {
            ...period,
            volcanoFactor: baseVolcanoFactor * moltenCrustFactor,
            moltenCrustFactor: moltenCrustFactor
        };
    }

    // Fallback
    return {
        name: 'Phanérozoïque',
        volcanoFactor: 1.0,
        moltenCrustFactor: 1.0
    };
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.getGeologicalPeriodByName = getGeologicalPeriodByName;
    window.getGeologicalPeriod = getGeologicalPeriod;
    window.getMoltenCrustFactor = getMoltenCrustFactor;
    window.getGeologicalEra = getGeologicalEra;
}
