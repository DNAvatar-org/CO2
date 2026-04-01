// ============================================================================
// File: flux_manager.js
// Desc: Gestion centralisée des flux (valeurs et affichage)
// ============================================================================

(function (global) {
    const FluxManager = {
        // Constantes de référence
        SOLAR_CONSTANT_REF: 1361, // W/m² (valeur actuelle)
        SOLAR_SURFACE_AREA: 6.09e18, // m²
        SOLAR_POWER_REF: 3.828e26, // W

        /**
         * Met à jour l'intensité solaire et les affichages associés
         * @param {number} intensity - Facteur d'intensité (ex: 1.0 pour aujourd'hui, 0.7 pour Hadéen)
         */
        setSolarIntensity: function (intensity) {
            if (typeof intensity !== 'number') {
                console.warn('[FluxManager] Solar intensity is not a number:', intensity);
                return;
            }

            // 1. Source unique : CONST (physics.js)
            const solarConstant = this.SOLAR_CONSTANT_REF * intensity;
            window.CONST.SOLAR_CONSTANT = solarConstant;

            // 2. Calculs dérivés pour l'affichage
            const solarPowerTotal = this.SOLAR_POWER_REF * intensity;
            const solarSurfaceFluxMW = (solarPowerTotal / this.SOLAR_SURFACE_AREA) / 1e6; // MW/m²

            // 3. Mise à jour du DOM (Flux Diagram)
            window.updateLabel('solar_surface_mw', solarSurfaceFluxMW);
            window.updateLabel('solar_power_total', solarPowerTotal);
            window.updateLabel('solar_1UA_mw', solarConstant);

            // Log désactivé (trop verbeux)
            // if (window.isDebugPhases) {
            //     console.log(`[FluxManager] Solar updated: intensity=${intensity}, constant=${solarConstant.toFixed(0)} W/m²`);
            // }
        },

        /**
         * Met à jour le flux géothermique et son affichage
         * @param {number} flux - Flux en W/m²
         */
        setGeothermalFlux: function (flux) {
            if (typeof flux !== 'number') {
                console.warn('[FluxManager] Geothermal flux is not a number:', flux);
                return;
            }

            // Source unique : DATA['🌕']['🧲🌕']
            if (!window.DATA['🌕']) window.DATA['🌕'] = {};
            window.DATA['🌕']['🧲🌕'] = flux;

            window.updateLabel('core_flux_wm', flux);
        },

        /**
         * Met à jour la puissance totale du noyau et son affichage
         * @param {number} flux - Flux géothermique en W/m²
         * @param {number} radius - Rayon de la planète en m
         */
        setCorePower: function (flux, radius) {
            if (typeof flux !== 'number' || typeof radius !== 'number') {
                 this._updateLabel('core_temperature', '0 W');
                 return;
            }
            
            const surface = 4 * Math.PI * Math.pow(radius, 2);
            const totalPower = flux * surface;
            window.updateLabel('core_temperature', totalPower <= 0 ? 0 : totalPower);
        },

        /**
         * Met à jour tous les flux en fonction d'une époque donnée
         * @param {string} epochName - Nom ou ID de l'époque
         */
        updateAllFluxes: function (epochName) {
            // Certaines époques internes (hidden=true, ex: hystérésis) peuvent ne pas exister côté getGeologicalPeriodByName.
            // Fallback vers window.TIMELINE (source brute) pour éviter null.solar_intensity.
            let epoch = (typeof window.getGeologicalPeriodByName === 'function') ? window.getGeologicalPeriodByName(epochName) : null;
            if (!epoch && window.TIMELINE && Array.isArray(window.TIMELINE)) {
                epoch = window.TIMELINE.find(e => e && e['📅'] && (e['📅'] === epochName || e.name === epochName || e.id === epochName)) || null;
            }
            if (!epoch) {
                console.error('[FluxManager] ❌ ERREUR CRITIQUE : Époque non trouvée:', epochName);
                throw new Error(`Époque "${epochName}" non trouvée`);
            }
            const solarIntensity = epoch.solar_intensity != null ? epoch.solar_intensity : 1.0;
            const geothermalFlux = epoch.core_temperature === 0 ? 0 : (epoch.geothermal_flux != null ? epoch.geothermal_flux : 0.087);
            const planetRadius = epoch.planet_radius != null ? epoch.planet_radius : 6371000;

            // Appliquer les mises à jour
            this.setSolarIntensity(solarIntensity);
            this.setGeothermalFlux(geothermalFlux);
            this.setCorePower(geothermalFlux, planetRadius);
        },

        /**
         * Helper privé pour mettre à jour le HTML d'un élément par data-id
         */
        _updateLabel: function (dataId, htmlContent) {
            const element = document.querySelector(`[data-id="${dataId}"]`);
            if (element) {
                element.innerHTML = htmlContent;
            } else {
                // Debug léger, ne pas spammer si l'élément n'est pas encore créé
                // console.debug(`[FluxManager] Element with data-id="${dataId}" not found`);
            }
        }
    };

    // Exposer globalement
    global.FluxManager = FluxManager;

})(typeof window !== 'undefined' ? window : this);
