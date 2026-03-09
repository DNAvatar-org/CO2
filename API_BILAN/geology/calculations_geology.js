// ============================================================================
// File: API_BILAN/geology/calculations_geology.js
// Desc: Fonctions de calcul géologique basées sur la configuration centralisée
// ============================================================================

// Constantes pour la croûte molle (identiques à geology.js)
const CRUST_MOLTEN_START = 4.6e9;  // Début : formation de la Terre (4.6 Ga)
const CRUST_MOLTEN_END = 3.5e9;    // Fin : croûte solidifiée (3.5 Ga)
const CRUST_MOLTEN_FACTOR_MAX = 100; // Facteur maximum (x100) au tout début
const CRUST_MOLTEN_FACTOR_MIN = 10;  // Facteur minimum (x10) à la fin de la période

/**
 * Calcule le flux géothermique d'une époque
 * Priorité : geothermal_flux > core_power_watts > (core_temperature * factor)
 */
function computeFluxFromEpoch(epoch) {
    if (!epoch) return 0;
    
    // 1. Valeur explicite (ex: Hadéen avec flux forcé)
    // 🔒 Utiliser la valeur dynamique si elle a été mise à jour dans l'objet (ex: refroidissement Hadéen)
    if (typeof epoch.geothermal_flux === 'number') {
        return epoch.geothermal_flux;
    }
    
    // 2. Calcul depuis la puissance totale (Watts) - NOUVELLE MÉTHODE
    if (typeof epoch.core_power_watts === 'number') {
        // Surface terrestre
        // Convertir le rayon de km en mètres pour les calculs
        const radius_km = epoch['📐'];
        if (!radius_km) {
            console.warn("[geology] 📐 manquant pour calculer surface_area, flux=0");
            return 0;
        }
        const radius_m = radius_km * 1000;
        const surface = 4 * Math.PI * Math.pow(radius_m, 2);
        return epoch.core_power_watts / surface;
    }
    
    // 3. Calcul depuis la température du noyau (Legacy)
    if (typeof epoch.core_temperature === 'number' && typeof epoch.geothermal_diffusion_factor === 'number') {
        const CONVERSION_CONSTANT = 0.00457;
        return epoch.core_temperature * epoch.geothermal_diffusion_factor * CONVERSION_CONSTANT;
    }
    
    return 0;
}

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
        // Mapper les clés TIMELINE (🔋🌕, 📐, ⚖️🫧, 🍎, 🧲🌕) vers les noms attendus par computeFluxFromEpoch et updateFluxLabels
        const epochWithMappings = {
            ...epoch,
            geothermal_flux: (typeof epoch.geothermal_flux === 'number') ? epoch.geothermal_flux : epoch['🧲🌕'],
            core_power_watts: (typeof epoch.core_power_watts === 'number') ? epoch.core_power_watts : epoch['🔋🌕'],
            planet_radius: (typeof epoch.planet_radius === 'number') ? epoch.planet_radius : (epoch['📐'] != null ? epoch['📐'] * 1000 : undefined),
            total_atmosphere_mass_kg: (typeof epoch.total_atmosphere_mass_kg === 'number') ? epoch.total_atmosphere_mass_kg : epoch['⚖️🫧'],
            gravity: (typeof epoch.gravity === 'number') ? epoch.gravity : epoch['🍎']
        };
        const flux = computeFluxFromEpoch(epochWithMappings);
        return {
            ...epochWithMappings,
            core_temperature_k: epoch.core_temperature, // Legacy compat
            geothermal_flux: (typeof flux === 'number' && flux > 0) ? flux : epochWithMappings.geothermal_flux
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

    // Parcourir les périodes
    let selectedEpoch = null;
    
    for (const epoch of epochs) {
        if (typeof epoch.startYears === 'number' && typeof epoch.endYears === 'number') {
            if (yearsAgo <= epoch.startYears && yearsAgo > epoch.endYears) {
                selectedEpoch = epoch;
                break;
            }
            if (epoch.endYears === -1 && yearsAgo <= epoch.startYears && yearsAgo >= 0) {
                selectedEpoch = epoch;
                break;
            }
        }
    }

    // Si non trouvé, retourner la dernière époque (Aujourd'hui) par défaut
    if (!selectedEpoch) {
        selectedEpoch = epochs[epochs.length - 1];
    }
    
    // Hydrater avec le flux calculé
    const flux = computeFluxFromEpoch(selectedEpoch);
    
    return {
        ...selectedEpoch,
        core_temperature_k: selectedEpoch.core_temperature,
        geothermal_flux: flux
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

/**
 * Calcule le flux géothermique en surface à partir de la température du noyau et d'un facteur de diffusion
 * DEPRECATED: Utiliser computeFluxFromEpoch à la place
 * @returns {number} Flux géothermique en W/m²
 */
function calculateGeothermalFlux(core_temperature_K, geothermal_diffusion_factor) {
    // Legacy support
    const CONVERSION_CONSTANT = 0.00457;
    return core_temperature_K * geothermal_diffusion_factor * CONVERSION_CONSTANT;
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.getGeologicalPeriodByName = getGeologicalPeriodByName;
    window.getGeologicalPeriod = getGeologicalPeriod;
    window.getMoltenCrustFactor = getMoltenCrustFactor;
    window.getGeologicalEra = getGeologicalEra;
    window.calculateGeothermalFlux = calculateGeothermalFlux;
}
