// File: API_BILAN/data/dico.js - Dictionnaire des clés (combinaisons de caractères)
// Desc: Définit toutes les clés (combinaisons de caractères) et leurs descriptions
// Version 1.0.3
// Date: [January 2025]
// logs :
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.
// Ā unit : non Aristotelicisme via UTF8.
// "La carte c'est le territoire, le territoire c'est le code."
// UTF8 est la sémantique pour CODE & UI
// - v1.0.1: KEYS/DESC 📛 + 🍰📛⛅ (EDS nuages), DESC 🧲📛/🍰📛❀
// - v1.0.2: FORM sync with runtime code for 🎈 (dry+vapor mass) and 🍰🪩⛅ (cloud optical proxy)
// - v1.0.3: add sulfate keys in DATA (⚖️🌫, 🍰🫧🌫) + CCN formula mention sulfate term
// - v1.0.4: DATA['🎚️'] init ici (source unique) ; baryByGroup depuis CONFIG_COMPUTE.baryByGroupDefault, DATA seule ref
// - v1.0.5: SOLVER init avec TOL_MIN_WM2/MAX_SEARCH_STEP_K/etc. (éviter tol=NaN si compute avant fillDataTuningFromBary)
// - v1.0.6: init DATA déplacée dans initDATA.js (chargé après dico.js) ; KEYS exposé pour initDATA

// ============================================================================
// OBJET KEYS (toutes les clés regroupées) - Utilise directement les emojis
// ============================================================================
const KEYS = {
    // États activés
    '🔘': ['🔘💧📛', '🔘⛽📛', '🔘🏭📛', '🔘🪩', '🔘🎞'],
    // Configuration de date / Événements
    '📜': ['🌡️🧮', '📿☄️', '🔺⚖️💧☄️', '🔺🌡️💫', '🔺🧲🌕💫', '🔘🕰', '🧲🔬'],
    // Date Époque
    '📅': ['🌡️🧮','📿💫', '🔺⏳'],
    // Masses
    '⚖️': ['⚖️💧', '⚖️🫧', '⚖️🏭', '⚖️⛽', '⚖️🫁', '⚖️🌫', '⚖️💨'],
    // Composition atmosphérique
    '🫧': ['🎈', '🧪', '📏🫧🧿', '📏🫧🛩', '🍰🫧🏭', '🍰🫧⛽', '🍰🫧🫁', '🍰🫧🌫', '🍰🫧💨', '🍰🫧📿🌈', '🍰🫧🏭🌈', '🍰🫧💧🌈', '🍰🫧⛽🌈', '🍰💭'],
    // Cycle de l'eau
    '💧': ['🍰💧🧊', '🍰💧🌊', '🍰🧮🌧', '🍰🫧💧', '🍰🫧☔', '🍰⚖️💦', '💭☔', '⏳☔'],
    // Albédo
    '🪩': ['🍰🪩📿', '🍰🪩🌋', '🍰🪩🏜️', '🍰🪩🌳', '🍰🪩🌊', '🍰🪩🧊', '🍰🪩⛅', '🍰🪩🌍', '☁️'],
    // Flux (W/m²) ; ΔF = convention affichage (climate.js), pas calcul T
    '🧲': ['🧲☀️🔽', '🧲🌕🔽', '🧲🌑🔼', '🧲🌈🔼', '🧲🪩🔼', '🔺🧲'],
    // Convergence
    '🧮': ['🧮🌡️', '🧮⚧', '🧮☯', '🧲🔬', '🔬🌈', '🔬🫧', '🧮🔄', '🧮🔄☀️', '🧮🔄🌊'],
    // Soleil
    '☀️': ['🧲☀️', '🧲☀️🎱', '🔋☀️'],
    // Noyau
    '🌕': ['🧲🌕', '🔋🌕'],
    // EDS breakdown (🧲📛, 🍰📛❀, 🧲📛❀) ; 🔺📛❀ = diagnostic ΔF (convention affichage, pas calcul T)
    '📛': ['🧲📛', '🧲📛🏭', '🧲📛💧', '🧲📛⛽', '🧲📛⛅', '🍰📛🏭', '🍰📛💧', '🍰📛⛽', '🍰📛⛅', '🔺📛💧', '🔺📛🏭', '🔺📛⛽', '🔺📿📛'],
    // Géologie (Surfaces géologiques - Couche A)
    '🗻': ['🍰🗻🌊', '🍰🗻🏔', '🍰🗻🌍'],
    // Constantes physiques
    '💎': ['🎈┴💧', '🌡️┴💧']
};

// ============================================================================
// OBJET DESC (toutes les descriptions) - Structure hiérarchique (2 niveaux)
// Utilise directement les emojis
// ============================================================================
const DESC = {
    '🔘': {
        '🔘💧📛': 'H₂O EDS on/off',
        '🔘⛽📛': 'CH₄ EDS on/off',
        '🔘🏭📛': 'CO₂ EDS on/off',
        '🔘🪩': 'Albedo on/off',
        '🔘🎞': 'Animation on/off',
    },
    '📜': {
        '🌡️🧮': 't° attendu (t° config)',
        '📿☄️': 'Nombre de météore',
        '🔺⚖️💧☄️': 'Masse H₂O / météore',
        '🔺🌡️💫': 'Delta t° / ticTime',
        '🔺🧲🌕💫': 'Delta Geoth / ticTime',
        '🔘🕰': 'Bouton cliqué (☄️ ou 💫)',
        '🧲🔬': 'Précision Flux',
    },
    '📅': {
        '🌡️🧮': 't° attendue',
        '📿💫': 'Nombre de ticTime',
        '🔺⏳': 'Durée équilibre précipitation (s)',
    },
    '☀️': {
        '🧲☀️': 'Flux solaire à 1 UA',
        '🧲☀️🎱': 'Flux moyen sphérique',
        '🔋☀️': 'Puissance totale du soleil',
    },
    '🪩': {
        '🍰🪩📿': 'Albedo total',
        '🍰🪩🌋': 'Volcan',
        '🍰🪩🏜️': 'Désert',
        '🍰🪩🌳': 'Forêt',
        '🍰🪩🌊': 'Océan',
        '🍰🪩🧊': 'Glace',
        '🍰🪩⛅': 'Nuages',
        '🍰🪩🌍': 'Continents',
    },
    '🫧': {
        '🎈': 'Pression atmosphérique',
        '🧪': '!Masse molaire (kg/mol)',
        '📏🫧🧿': 'Ligne de Kármán',
        '📏🫧🛩': 'Tropopause',
        '🍰🫧❀': 'Prop.Rad.EDS<sub>❀∈{🏭, ⛽, 🫁, 💨}</sub>',
        '🍰🫧🏭': '!CO₂',
        '🍰🫧⛽': '!CH₄',
        '🍰🫧🫁': '!O₂ (🫁) [clé historique 🫁]',
        '🍰🫧🌫': 'SO₄²⁻ (🌫) - proxy CCN',
        '🍰🫧💨': '!N₂',
        '🍰🫧❀🌈': 'Cap.Rad.IR<sub>❀∈{🏭, ⛽, 💧}</sub>',
        '🍰🫧📿🌈': 'Σ(🍰🫧❀🌈)<sub>❀∈{🏭,⛽,💧}</sub>',
        '🍰🫧🏭🌈': '!Capacité radiative IR de CO₂',
        '🍰🫧💧🌈': 'Cap.Rad.IR H₂O atm.',
        '🍰🫧⛽🌈': '!Capacité radiative IR de CH₄',
        '🍰💭': 'CCN - Eff.Cond nuageuse [0.3,1.0]',
    },
    '⚖️': {
        '⚖️❀': 'Masse<sub>❀∈{🏭, ⛽, 🫁, 💨}</sub> (+ ⚖️🌫 proxy sulfate)',
        '⚖️💧': 'Masse H₂O totale',
        '⚖️🫧': 'Masse atmosphère sec',
        '⚖️🏭': '!Masse CO₂',
        '⚖️⛽': '!Masse CH₄',
        '⚖️🫁': '!Masse O₂ (🫁) [clé historique 🫁]',
        '⚖️🌫': 'Masse SO₄²⁻ (🌫) [proxy CCN]',
        '⚖️💨': '!Masse N₂',
    },
    '💧': {
        '🍰💧🧊': 'Glace',
        '🍰💧🌊': 'Océan',
        '🍰🧮🌧': 'Fraction de vapeur max',
        '🍰🫧💧': 'Fraction massique de vapeur',
        '🍰🫧☔': 'Humidité relative moyenne [0,1]',
        '☁️': 'Index de formation nuageuse [0,1]',
        '💭☔': 'Seuil critique précipitations [0.7,0.9]',
        '⏳☔': '1/τ_global (s⁻¹), τ ~10 j litt.',
        '🍰⚖️💦': 'Taux précipitation (kg/m²/s), P=W/τ',
    },
    '🧲': {
        '🧲☀️🔽': 'Flux solaire absorbé',
        '🧲🌕🔽': 'Flux géothermique',
        '🧲🌑🔼': 'Flux sortant (σT⁴)',
        '🧲🌈🔼': 'Courbe spectrale',
        '🧲🪩🔼': 'Flux réfléchi',
        '🔺🧲': 'Delta flux',
    },
    '🧮': {
        '🧮🌡️': 'Temp. (t° courante)',
        '🧮⚧': 'Phase (Init/Search/Dicho)',
        '🧮☯': 'Direction (+/-)',
        '🧲🔬': '!Précision en Flux',
        '🔬🌈': 'Résolution spectrale (🔺λ)',
        '🔬🫧': 'Résolution atm. (🔺z)',
        '🧮🔄': 'Complexité O(🔬🌈×🔬🫧)',
        '🧮🔄☀️': 'Cycle radiatif (crossings 0°C/T_boil)',
        '🧮🔄🌊': 'Cycle eau (0=init, 1+=après crossing)',
    },
    '🌕': {
        '🧲🌕': 'Flux géothermique',
        '🔋🌕': 'Puissance du noyau',
    },
    '📛': {
        '🧲📛': 'EDS (effet de serre) W/m² = 🧲🌑🔼 − 🧲🌈🔼. OLR = 🧲🌈🔼 = flux IR sortant au sommet ; EDS = flux « bloqué » par l’atmosphère. EDS insuffisant ⟺ OLR trop élevé (même T surface).',
        '🧲📛🏭': 'EDS CO₂ W/m² (part retenue par CO₂)',
        '🧲📛💧': 'EDS H₂O W/m² (part retenue par vapeur)',
        '🧲📛⛽': 'EDS CH₄ W/m² (part retenue par CH₄)',
        '🧲📛⛅': 'EDS nuages W/m² (part retenue par nuages)',
        '🍰📛🏭': 'Part EDS CO₂ [0,1]',
        '🍰📛💧': 'Part EDS H₂O (vapeur) [0,1]',
        '🍰📛⛽': 'Part EDS CH₄ [0,1]',
        '🍰📛⛅': 'Part EDS nuages [0,1]',
        '🔺📛💧': 'ΔF H₂O affichage (W/m², convention)',
        '🔺📛🏭': 'ΔF CO₂ affichage (W/m², convention)',
        '🔺📛⛽': 'ΔF CH₄ affichage (W/m², convention)',
        '🔺📿📛': 'ΔF total affichage (W/m², convention)',
    },
    '🗻': {
        '🍰🗻🌊': 'Surface océanique potentielle (bassin océanique, géologie)',
        '🍰🗻🏔': 'Surface hautes terres (zones de glace potentielles, géologie)',
        '🍰🗻🌍': 'Surface terres basses (zones de forêts/continents, géologie)',
    }
};

// ============================================================================
// OBJET FORM (formules de calcul) - Structure hiérarchique (2 niveaux)
// ============================================================================
const FORM = {
    '🧲': {
        '🧲☀️🔽': '🧲☀️🎱 × (1 - 🍰🪩📿) = Flux solaire absorbé',
        '🧲🌕🔽': 'Flux géothermique (constant)',
        '🧲🌑🔼': 'σ × T⁴ = Flux émis par la surface (corps noir théorique à température T). Formule: 🧲🌑🔼 = σT⁴ où σ = 5.670374419e-8 W/(m²·K⁴). Pour T=303.5K: ≈501 W/m². ⚠️ Ce n\'est PAS le flux qui sort au sommet (c\'est 🧲🌈🔼). ⚠️ Ne pas comparer directement à 🧲☀️🔽+🧲🌕🔽 car l\'effet de serre fait que la surface émet plus que ce qui sort.',
        '🧲🌈🔼': 'Σ[λ=0.1→100μm] I_λ(z_max) × Δλ = Aire sous courbe spectrale réelle (émission au sommet atmosphère). Δλ = (λ_max−λ_min)/(N−1) = pas réel de la grille (effective_delta_lambda), pas 0.1 μm fixe. Transfert radiatif: τ_λ(z), transmission exp(-τ), émission (1-exp(-τ))×π×B_λ(T). Intégration: 🧲🌈🔼 = Σ[λ] upward_flux[z_max][λ]. En équilibre: 🧲🌈🔼 ≈ 🧲☀️🔽+🧲🌕🔽',
        '🧲🪩🔼': '🧲☀️🎱 - 🧲☀️🔽 = 🧲☀️🎱 × 🍰🪩📿 = Flux réfléchi par albedo',
        '🔺🧲': '🧲☀️🔽 + 🧲🌕🔽 - 🧲🌈🔼 = déséquilibre flux (entrant - sortant). Δ>0→réchauffer, Δ<0→refroidir. En équilibre: 🔺🧲 ≈ 0',
        '_explication_equilibre': 'Corps noir (70% soleil): 🧲☀️🔽 devrait être ~238 W/m² (pas 341.50) → équilibre à T≈255K',
        '_temperature_equilibre_corps_noir': 'T_équilibre = (S/4σ)^(1/4) = (952/4σ)^(1/4) ≈ 255K (-18°C) pour corps noir pur (S=70% actuel)',
        '_bug_flux_solaire': 'BUG: Si 🧲☀️🔽=341.50 W/m² au lieu de 238 W/m² → code utilise soleil actuel (100%) au lieu de 70%',
        '_effet_serre': 'Avec EDS: surface émet plus (T_surface > T_effective) mais atmosphère bloque → 🧲🌈🔼 < 🧲🌑🔼',
        '_evolution_soleil': 'Soleil jeune (4.5 Ga): 🔋☀️ = 70% actuel (2.68e26 W vs 3.83e26 W) - Faint Young Sun Paradox',
        '_faint_young_sun': 'Paradoxe: Soleil 30% moins lumineux mais Terre pas gelée → EDS plus fort (CO₂, CH₄) compensait',
        '_flux_entrant': '🧲☀️🔽 + 🧲🌕🔽 = Flux entrant total',
        '_formule_planck': 'B_λ(T) = (2hc²/λ⁵) / (exp(hc/λkT) - 1)',
        '_formule_stefan': 'F = σT⁴ ≈ 239.7 W/m² pour T=255K (intégration complète 0→∞)',
        '_note_spectrale': 'Calcul spectral: intégration sur λ ∈ [0.1μm, 100μm] avec Δλ=0.1μm'
    },
    '🧮': {
        '🧮🌡️': 'T° courante (K)',
        '🧮⚧': 'Phase (Init/Search/Dicho)',
        '🧮☯': 'Direction Search (+/-)',
        '🧲🔬': '!Précision en Flux',
        '🔬🌈': 'Résolution spectrale',
        '🔬🫧': 'Résolution atmosphérique',
        '🧮🔄': 'Complexité O(🔬🌈×🔬🫧)',
        '🧮🔄☀️': 'Cycle radiatif (nombre de crossings 0°C/T_boil)',
        '🧮🔄🌊': 'Cycle eau (0=après init, 1+=après crossing)',
        '🧮🌡️🚩': 'T° initiale (T0)'
    },
    '☀️': {
        '🧲☀️': '🔋☀️ / (4π × (1 UA)²) = Flux solaire à 1 UA (W/m²)',
        '🧲☀️🎱': '🧲☀️ / 4 (Surf.Éclairée/Surf.Tot = πR²/4πR² = 1/4)',
        '🔋☀️': 'Puissance totale du soleil (W)'
    },
    '🌕': {
        '🧲🌕': '🔋🌕 / (4π × R²) = Flux géothermique (W/m²), où R = rayon planète (m)',
        '🔋🌕': 'Puissance totale du noyau (W)'
    },
    '🫧': {
        '🎈': 'P = ((⚖️🫧 + m_vapeur) × 🍎) / (4π×(📐×1000)²) / CONV.STANDARD_ATMOSPHERE_PA, avec m_vapeur = ⚖️🫧×🍰🫧💧/(1-🍰🫧💧) - Pression atmosphérique (air sec + vapeur)',
        '🧪': '!Masse molaire (kg/mol)',
        '📏🫧🧿': 'H × ln(P₀ / P_limit) où H = RT/(Mg) [von Kármán] - Ligne de Kármán (altitude où P = 0.01 Pa)',
        '📏🫧🛩': 'RT/(Mg) [équation hydrostatique] - Tropopause (échelle de hauteur atmosphérique)',
        '🍰🫧❀': 'Proportion radiative EDS - ∀ ❀ ∈ {🏭, ⛽, 🫁, 💨}',
        '🍰🫧❀🌈': 'Capacité radiative IR de ❀ - ∀ ❀ ∈ {🏭, ⛽, 💧}',
        '🍰🫧📿🌈': 'Σ(🍰🫧❀🌈) - ∀ ❀ ∈ {🏭, ⛽, 💧} (pour normalisation)',
        '🍰🫧🌫': '⚖️🌫 / ⚖️🫧 (proxy sulfate pour microphysique nuageuse, hors normalisation air sec)',
        '🍰💭': 'clamp(0.4 + 0.5×(⚖️🫁/1.08e18 + ⚖️⛽/5.2e12) + 0.1×(⚖️🌫/1.0e14), 0.3, 1.0) - CCN - Eff.Cond nuageuse [0.3,1.0]'
    },
    '💧': {
        '🍰💧🧊': 'Si T < ❄️ alors toute l\'eau restante (après vapeur) est glace, sinon glace polaire (10% à 0°C → 0% à 20°C) - ❄️ = 271.15K - (P-1)×1.0',
        '🍰💧🌊': 'Océan',
        '🍰🧮🌧': '🎈🌧 / 🎈<br>🎈🌧 = 🎈┴💧 × exp(L_v/R_v × (1/🌡️┴💧 - 1/🧮🌡️)) [Clausius-Clapeyron]<br>🎈┴💧 = 611.2 Pa, 🌡️┴💧 = 273.15 K,<br>L_v = 2.5e6 J/kg (chaleur latente vaporisation H2O), R_v = 461.5 J/(kg·K) = R/M_H2O, 🧮🌡️ = température actuelle',
        '🍰🫧💧': 'max(0, min(🍰🧮🌧 × (CONST.M_H2O / 🧪), ⚖️💧 / ⚖️🫧) - (🍰⚖️💦 × (4 × π × (📐 × 1000)²) × 🔺⏳) / ⚖️🫧) - Fraction massique de vapeur',
        '🍰🫧☔': 'clamp(🍰🫧💧 / ((CONST.M_H2O / 🧪) × 🍰🧮🌧), 0, 1) [Clausius-Clapeyron] - Humidité relative globale (q / q_sat en fraction massique)',
        '☁️': '(1 - Math.pow(1 - min(🍰🫧☔, 1), 0.6)) × 🍰💭 - Schéma Sundqvist classique (couverture nuageuse à partir de RH) × (🍰💭) – nuages plus minces = optiquement moins actifs',
        '💭☔': 'clamp(0.75 + 0.05 × (🧮🌡️ - EARTH.EVAPORATION_T_REF) / EARTH.EVAPORATION_T_SCALE, 0.7, 0.95) - Seuil critique précipitations [0.7,0.9]',
        '⏳☔': '1/τ_global (s⁻¹), τ_global = 10 j (litt. 8–10 j, Nature Rev. Earth Env. 2021; HESS 2017)',
        '🍰⚖️💦': 'W/τ_global × ramp(RH−💭☔, 0.2) quand RH > 💭☔ ; W = masse_vapeur_par_m² (kg/m²) ; P = W/τ (litt. ~2,7 mm/j GPCP) - Taux précipitation (kg/m²/s)'
    },
    '📅': {
        '🔺⏳': '86400 s (1 jour) - Durée équilibre précipitation'
    },
    '🪩': {
        '🍰🪩📿': '🍰🪩🌋 × CONST.🪩🍰.🪩🍰🌋 + 🍰🪩🌊 × CONST.🪩🍰.🪩🍰🌊 + 🍰🪩🌳 × CONST.🪩🍰.🪩🍰🌳 + 🍰🪩🏜️ × CONST.🪩🍰.🪩🍰🏜️ + 🍰🪩🧊 × CONST.🪩🍰.🪩🍰🧊 + 🍰🪩⛅ × CONST.🪩🍰.🪩🍰⛅ + 🍰🪩🌍 × CONST.🪩🍰.🪩🍰🌍',
        '🍰🪩🌋': 'volcano_coverage = f(T, flux_geo) : Hadéen=1.0, sinon min(1.0, flux_geo/10000)',
        '🍰🪩🌊': '(🍰💧🌊 × ⚖️💧 / CONST.RHO_WATER) / (📏🌊 × 1000) / (4 × π × (📐 × 1000)²)',
        '🍰🪩🌳': 'min(🍰🪩🌍_, 🗻.🍰🗻🌍 × clamp((🧮🌡️_C - 0)/30, 0, 1) × clamp((🍰🫧☔ - 0.5)/0.3, 0, 1) × clamp((1 - ☁️), 0, 1) × 0.6) où 🍰🪩🌍_ = 1 - 🍰🗻🌊 - 🍰🪩🧊 - Forêts dépendent de température (optimum 0-30°C), humidité relative (RH > 0.5-0.8) et nuages (moins de forêts si trop de nuages)',
        '🍰🪩🏜️': '🍰🪩🌍_ × (base_aridité + variabilité_régionale) où base_aridité = max(0, 1 - min(1, P_ann/1000)) × max(0, 1 - min(1, 🍰🫧☔/0.6)) et variabilité_régionale = 0.6 × max(0.5, min(1, (🧮🌡️_C-5)/10)) × max(0.5, 1-🍰🫧☔×0.6) - Déserts basés sur précipitations (P_ann < 1000 mm/an) et humidité relative (RH < 0.6) avec variabilité régionale',
        '🍰🪩🌍': 'land_coverage = L - 🍰🪩🌳 - 🍰🪩🏜️ où L = terre libre de glace. Absorbe automatiquement : steppes, prairies, toundras, montagnes (albedo ~0.18)',
        '🍰🪩🧊': 'min(🗻.🍰🗻🏔, EARTH.ICE_FORMULA_MAX_FRACTION × (T_NO_POLAR_ICE_K - 🧮🌡️) / T_NO_POLAR_ICE_RANGE_K) - Glace polaire (0% si T > T_NO_POLAR_ICE_K)',
        '🍰🪩⛅': 'cloud_fraction = clamp((0.19 + 0.11×☁️) × cloud_optical_efficiency, 0, 0.75), avec cloud_optical_efficiency = (1.10 + 0.45×(ccn_ratio-1)) × pressure_factor × oxidation_soft_factor × temp_factor',
        '_contribution_glace': 'contribution_glace = (🪩🍰🧊 - albedo_base) × 🍰💧🧊 × 0.5',
        '_contribution_nuages': 'contribution_nuages = albedo × (1 - 🍰🪩⛅) + 🪩🍰⛅ × 🍰🪩⛅'
    },
    '🗻': {
        '🍰🗻🌊': 'Surface océanique potentielle (bassin océanique, géologie)',
        '🍰🗻🏔': 'Surface hautes terres (zones de glace potentielles, géologie)',
        '🍰🗻🌍': 'Surface terres basses (zones de forêts/continents, géologie)'
    },
    '💎': {
        '🎈┴💧': 'Pression au point triple de l\'eau (611.2 Pa)',
        '🌡️┴💧': 'Température au point triple de l\'eau (273.15 K, 0°C)'
    },
    '🗻': {
        '🍰🗻🌊': 'Surface océanique potentielle (bassin océanique) = f(époque) : Hadéen=1.0, Archéen=0.80, Moderne=0.71',
        '🍰🗻🏔': 'Surface hautes terres (zones de glace potentielles) = f(époque) : Hadéen=0.0, Archéen=0.05, Moderne=0.09',
        '🍰🗻🌍': 'Surface terres basses (zones de forêts/continents) = f(époque) : Hadéen=0.0, Archéen=0.15, Moderne=0.20',
        '_note': '🗻 = Géologie (Couche A) : surfaces fixes déterminées par la géologie/relief, indépendantes des stocks d\'eau'
    },
    '⚖️': {
        '⚖️❀': 'Masse ❀ - ∀ ❀ ∈ {🏭, ⛽, 🫁, 💨} (+ ⚖️🌫 proxy sulfate)',
        '⚖️💧': 'Masse H2O totale',
        '⚖️🫧': 'Masse atmosphère sec = ⚖️🏭 + ⚖️⛽ + ⚖️🫁 + ⚖️💨 (sans vapeur d\'eau ; ⚖️🌫 = proxy CCN séparé)'
    }
};


// ============================================================================
// FONCTION : CRÉER LE DICO (utilise DATA directement, pas de paramètres)
// ============================================================================
function createDicoHtml() {
    if (typeof window === 'undefined') {
        console.error('[createDico] window non défini');
        return '';
    }
    
    // Utiliser DATA directement (pas de paramètres)
    const DATA = window.DATA;
    const DESC = window.DESC;
    // KEYS est défini localement dans ce fichier
    
    // Fonction helper pour créer une entrée
    const createDicoEntry = (key, desc) => {
        return `<div class="legend-item"><span class="logo">${key}</span><span class="description">${desc}</span></div>`;
    };
    
    // Catégories avec leurs logos et noms (utilise directement les emojis)
    const categories = [
        {
            logo: '🔘',
            name: 'États activés'
        },
        {
            logo: '📜',
            name: 'Config Événements'
        },
        {
            logo: '📅',
            name: 'Date Époque'
        },
        {
            logo: '🌕',
            name: 'Noyau'
        },
        {
            logo: '☀️',
            name: 'Soleil'
        },
        {
            logo: '🪩',
            name: 'Albédo'
        },
        {
            logo: '⚖️',
            name: 'Masses'
        },
        {
            logo: '🫧',
            name: 'Atmosphère'
        },
        {
            logo: '💧',
            name: 'Cycle de l\'eau'
        },
        {
            logo: '🧮',
            name: 'Convergence'
        },
        {
            logo: '🧲',
            name: 'Flux (W/m²)'
        }
    ];
    
    // Générer le HTML pour chaque catégorie
    const categoryHTMLs = categories.map(category => {
        // 🔒 CORRECTION : Parcourir DESC directement, pas seulement KEYS
        // Cela permet d'afficher les clés mathématiques (avec ❀) qui sont dans DESC mais pas dans KEYS
        if (!DESC[category.logo]) return '';
        
        // Récupérer toutes les clés depuis DESC (source de vérité pour l'affichage)
        const descKeys = Object.keys(DESC[category.logo]);
        
        const items = descKeys
            .map(fullKey => {
                const desc = DESC[category.logo][fullKey];
                // Ignorer les variables dont la description commence par "!" (variables internes aux calculs)
                if (!desc || desc.startsWith('!')) return '';
                return createDicoEntry(fullKey, desc);
            })
            .filter(item => item !== '') // Retirer les entrées vides
            .join('');
        
        return `
            <h3 class="legend-title">${category.logo} ${category.name}</h3>
            ${items}
        `;
    });
    
    // Organiser en colonnes (répartir les 11 catégories en 5 colonnes)
    // Répartition équilibrée : 3, 2, 2, 2, 2 (total = 11)
    const col1 = categoryHTMLs.slice(0, 3).join('');
    const col2 = categoryHTMLs.slice(3, 6).join('');
    const col3 = categoryHTMLs.slice(6, 8).join('');
    const col4 = categoryHTMLs.slice(8, 10).join('');
    const col5 = categoryHTMLs.slice(10, 11).join('');
    
    return `
        <div class="legend-grid">
            <div class="legend-column">
                ${col1}
            </div>
            <div class="legend-column">
                ${col2}
            </div>
            <div class="legend-column">
                ${col3}
            </div>
            <div class="legend-column">
                ${col4}
            </div>
            <div class="legend-column">
                ${col5}
            </div>
        </div>
    `;
}

// ============================================================================
// EXPOSITION GLOBALE (DESC, FORM, createDicoHtml ; KEYS pour initDATA.js ; DATA par initDATA.js)
// ============================================================================
window.KEYS = KEYS;
window.DESC = DESC;
window.FORM = FORM;
window.createDicoHtml = createDicoHtml;
