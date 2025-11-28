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

            // 1. Mise à jour de la variable globale pour les calculs physiques (calculations.js)
            const solarConstant = this.SOLAR_CONSTANT_REF * intensity;
            if (typeof window !== 'undefined') {
                window.SOLAR_CONSTANT = solarConstant;
            }

            // 2. Calculs dérivés pour l'affichage
            const solarPowerTotal = this.SOLAR_POWER_REF * intensity;
            const solarSurfaceFluxMW = (solarPowerTotal / this.SOLAR_SURFACE_AREA) / 1e6; // MW/m²

            // 3. Mise à jour du DOM (Flux Diagram)
            // Utiliser updateLabel avec les valeurs numériques pour utiliser les templates de la config
            if (typeof window !== 'undefined' && typeof window.updateLabel === 'function') {
                // Utiliser updateLabel qui utilise automatiquement le template depuis la config
                window.updateLabel('solar_surface_mw', solarSurfaceFluxMW);
                window.updateLabel('solar_power_total', solarPowerTotal);
                window.updateLabel('solar_1UA_mw', solarConstant);
            } else {
                // Fallback si updateLabel n'est pas disponible (ne devrait pas arriver)
                this._updateLabel('solar_surface_mw', `${solarSurfaceFluxMW.toFixed(1)}<br>MW/m²`);
                this._updateLabel('solar_power_total', `${(solarPowerTotal / 1e26).toFixed(1)}×10<sup><b>26</b></sup> W`);
                this._updateLabel('solar_1UA_mw', `${solarConstant.toFixed(0)}<br>W/m²`);
            }

            console.log(`[FluxManager] Solar updated: intensity=${intensity}, constant=${solarConstant.toFixed(0)} W/m²`);
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

            // Note: calculations.js lit souvent directement depuis l'époque, 
            // mais on pourrait aussi stocker ça globalement si besoin.
            if (typeof window !== 'undefined') {
                window.GEOTHERMAL_FLUX = flux;
            }

            // Utiliser updateLabel qui utilise automatiquement le template depuis la config
            if (typeof window !== 'undefined' && typeof window.updateLabel === 'function') {
                window.updateLabel('core_flux_wm', flux);
            } else {
                // Fallback si updateLabel n'est pas disponible
                const decimals = flux < 0.1 && flux > 0 ? 3 : 1;
                this._updateLabel('core_flux_wm', `${flux.toFixed(decimals)}<br>W/m²`);
            }
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

            // Utiliser updateLabel qui utilise automatiquement le template depuis la config
            if (typeof window !== 'undefined' && typeof window.updateLabel === 'function') {
                window.updateLabel('core_temperature', totalPower <= 0 ? 0 : totalPower);
            } else {
                // Fallback si updateLabel n'est pas disponible
                if (totalPower <= 0) {
                    this._updateLabel('core_temperature', '0 W');
                } else {
                    const exponent = Math.floor(Math.log10(totalPower));
                    const mantissa = totalPower / Math.pow(10, exponent);
                    this._updateLabel('core_temperature', `${mantissa.toFixed(2)}×10<sup><b>${exponent}</b></sup> W`);
                }
            }
        },

        /**
         * Met à jour tous les flux en fonction d'une époque donnée
         * @param {string} epochName - Nom ou ID de l'époque
         */
        updateAllFluxes: function (epochName) {
            if (typeof window.getGeologicalPeriodByName !== 'function') {
                console.error('[FluxManager] getGeologicalPeriodByName not found');
                return;
            }

            const epoch = window.getGeologicalPeriodByName(epochName);
            if (!epoch) {
                console.error('[FluxManager] Epoch not found:', epochName);
                return;
            }

            // Valeurs par défaut si non définies
            const solarIntensity = typeof epoch.solar_intensity === 'number' ? epoch.solar_intensity : 1.0;
            
            let geothermalFlux = 0.087; // Défaut Terre actuelle
            if (typeof epoch.geothermal_flux === 'number') {
                geothermalFlux = epoch.geothermal_flux;
            } else if (epoch.core_temperature === 0) {
                // Cas explicite : pas de noyau (ex: Corps Noir)
                geothermalFlux = 0;
            }
            
            const planetRadius = typeof epoch.planet_radius === 'number' ? epoch.planet_radius : 6371000;

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
