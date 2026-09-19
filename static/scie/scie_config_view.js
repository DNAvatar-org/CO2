// File: CO2/static/scie/scie_config_view.js - Affichage de la configuration et des formules
// Desc: L'AFFICHAGE DE LA CONFIGURATION : je transforme les objets de config en tableaux lisibles (json2html) et
//       je développe les formules d'albédo et de flux. Je ne fais que MONTRER — c'est ce découpage qui permet
//       à API_BILAN d'en dériver une version où les champs deviennent éditables.
// Version 1.0.0
// Date: [September 19, 2026]
// logs :
//   - v1.0.0: extraction depuis le <script> en ligne de CO2/html/scie_compute.html (1810 lignes d'un bloc).
//     Découpage par responsabilité, à code IDENTIQUE : seule l'indentation change. Les fichiers restent des
//     scripts classiques chargés dans l'ordre des dépendances — la page garde son chargement synchrone.
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

// Fonction pour calculer et afficher la formule de l'albedo
function calculateAlbedoFormula(albedo, albedoReflectorCoeff) {
    if (!albedo || !albedoReflectorCoeff) return '';
    
    const elements = ['🌋', '🌊', '🌳', '🏜️', '🧊', '⛅'];
    let total = 0;
    
    // Calculer le total
    elements.forEach(element => {
        const coverage_key = `🍰🪩${element}`;
        const coeff_key = `🪩🍰${element}`; // CORRECTION: clé correcte pour CONST['🪩🍰']
        const coverage = albedo[coverage_key] || 0;
        const coeff = albedoReflectorCoeff[coeff_key] || 0;
        total += coverage * coeff;
    });
    
    // essais graphique, ne modifie pas la formule : 
    const variableChar = '❀';//❉✪✩⛬✤ //<i></i>
    const elementsStr = elements.join(',');
    const formula = `🍰🪩📿<span style="font-size: 10px;"> = Σ(</span>🍰🪩<span style="font-size: 10px;">${variableChar} × </span>🪩🍰<span style="font-size: 10px;">${variableChar}</span><span style="font-size: 10px;">) | ${variableChar} <strong style="font-size: 1.1em;">∈</strong> { </span>${elementsStr}<span style="font-size: 10px;"> }</span>`;
    
    // Formater albedoReflectorCoeff pour l'affichage
    const formatNumber = (value) => {
        if (typeof value !== 'number') return value;
        return value.toFixed(3);
    };
    const formatValue = (value) => {
        if (typeof value === 'number') return formatNumber(value);
        if (typeof value === 'string') return `'${value}'`;
        return String(value);
    };
    const coeffEntries = Object.entries(albedoReflectorCoeff).map(([k, v]) => `'${k}':${formatValue(v)}`);
    const coeffStr = `{${coeffEntries.join(', ')}}`;
    
    // Formule simplifiée : seulement la formule principale et les coefficients
    let formulasHtml = `<strong>${formula}</strong>`;
    formulasHtml += `<br>${coeffStr}`;
    
    // Ajouter les formules de calcul de chaque couverture
    formulasHtml += `<br><br><strong>Formules de couverture :</strong><br>`;
    formulasHtml += `🍰🪩🌊 = Volume_océan / Profondeur_moyenne / Surface_planète<br>`;
    formulasHtml += `&nbsp;&nbsp;&nbsp;&nbsp;= (Masse_eau_océan / Densité_eau) / Profondeur / (4πR²)<br>`;
    formulasHtml += `&nbsp;&nbsp;&nbsp;&nbsp;= (🍰💧🌊 × ⚖️💧 / 1000) / 3700 / (4πR²)<br>`;
    formulasHtml += `🍰🪩🌳 = min(0.5, 🍰🪩🌊 × (1 - T_surface_C / 30)) si T < 30°C et 🍰🪩🌊 > 0.1<br>`;
    formulasHtml += `🍰🪩🧊 = min(0.9, 🍰💧🧊 × 0.9) (fraction eau en glace → couverture surface)<br>`;
    formulasHtml += `🍰🪩🏜️ = 1.0 - (🍰🪩🎾 + 🍰🪩🌊 + 🍰🪩🌳 + 🍰🪩🧊) (surface restante)<br>`;
    formulasHtml += `🍰🪩⛅ = Si moderne : 0.20 + 0.10 × ☁️ (plage 0.20-0.30). Si Hadéen/Archéen : C_max × ☁️<br>`;
    
    formulasHtml += `<br><strong>Cycle du Carbone (Loi de Henry) :</strong><br>`;
    formulasHtml += `⚖️🏭 = Masse_CO₂_Total / (1 + 50 × exp(2400 × (1/T_surface - 1/T_initiale)) × (1 - 🍰🪩🧊))<br>`;
    
    return `<div class="formule">${formulasHtml}</div>`;
}

// Fonction pour calculer et afficher les formules des flux
function calculateFluxFormulas(flux, soleil, albedo) {
    if (!flux || !soleil || !albedo) return '';
    
    let formulas = [];
    const CONST = window.CONST;
    const DATA = window.DATA;
    
    // 🧲☀️🔽: 🧲☀️🎱 × (1 - 🍰🪩📿) = Flux solaire absorbé (formule = calcul dans calculations_flux.js)
    const solar_avg = soleil['🧲☀️🎱'];
    const albedo_val = albedo['🍰🪩📿'];
    const calculated = solar_avg * (1 - albedo_val);
    const actual = flux['🧲☀️🔽'];
    
    if (solar_avg == null || albedo_val == null || calculated == null || actual == null) {
        return '';
    }
    const matchSolar = (Math.abs(calculated - actual) < 0.01) ? ' ✓' : ` (affiché: ${actual.toFixed(2)})`;
    formulas.push(`<strong>🧲☀️🔽</strong>: <strong>🧲☀️🎱</strong> × (1 - <strong>🍰🪩📿</strong>) = ${solar_avg.toFixed(2)} × (1 - ${albedo_val.toFixed(4)}) = ${calculated.toFixed(2)} W/m²${matchSolar}`);
    
    // 🧲🌕🔽: Flux géothermique (constant)
    if (flux['🧲🌕🔽'] !== undefined) {
        formulas.push(`<strong>🧲🌕🔽</strong>: Flux géothermique (constant) = ${flux['🧲🌕🔽'].toFixed(2)} W/m²`);
    }
    
    // 🧲🌑🔼: σ × T⁴ = Flux émis par la surface (corps noir) — T = DATA['🧮']['🧮🌡️'] (même clé que le calcul)
    if (flux['🧲🌑🔼'] !== undefined && DATA && DATA['🧮'] && DATA['🧮']['🧮🌡️'] != null) {
        const T = DATA['🧮']['🧮🌡️'];
        const sigma = CONST.STEFAN_BOLTZMANN;
        const calculated = sigma * Math.pow(T, 4);
        const actual = flux['🧲🌑🔼'];
        const match = (Math.abs(calculated - actual) < 0.01) ? ' ✓' : ` (affiché: ${actual.toFixed(2)}, écart: ${(actual - calculated).toFixed(2)})`;
        formulas.push(`<strong>🧲🌑🔼</strong>: σ × T⁴ = ${sigma.toExponential(2)} × ${T.toFixed(2)}⁴ = ${calculated.toFixed(2)} W/m²${match}`);
        formulas.push(`&nbsp;&nbsp;&nbsp;&nbsp;Flux émis par la surface (corps noir). ⚠️ Ce n'est PAS le flux qui sort au sommet (c'est 🧲🌈🔼)`);
    }
    
    // 🧲🌈🔼: Σ[λ=0.1→100μm] I_λ(z_max) × Δλ = Aire sous courbe spectrale réelle
    if (flux['🧲🌈🔼'] !== undefined) {
        formulas.push(`<strong>🧲🌈🔼</strong>: Σ[λ=0.1→100μm] I_λ(z_max) × Δλ = ${flux['🧲🌈🔼'].toFixed(2)} W/m²`);
        formulas.push(`&nbsp;&nbsp;&nbsp;&nbsp;Aire sous courbe spectrale réelle (émission au sommet atmosphère, après transfert radiatif couche par couche)`);
    }
    
    // 🧲🪩🔼: 🧲☀️🎱 - 🧲☀️🔽 = 🧲☀️🎱 × 🍰🪩📿 = Flux réfléchi par albedo
    if (flux['🧲🪩🔼'] !== undefined && soleil && soleil['🧲☀️🎱'] !== undefined && flux['🧲☀️🔽'] !== undefined) {
        const solar_avg = soleil['🧲☀️🎱'];
        const calculated1 = solar_avg - flux['🧲☀️🔽'];
        const calculated2 = albedo && albedo['🍰🪩📿'] !== undefined ? solar_avg * albedo['🍰🪩📿'] : calculated1;
        const actual = flux['🧲🪩🔼'];
        formulas.push(`<strong>🧲🪩🔼</strong>: <strong>🧲☀️🎱</strong> - <strong>🧲☀️🔽</strong> = <strong>🧲☀️🎱</strong> × <strong>🍰🪩📿</strong> = ${calculated2.toFixed(2)} W/m²`);
    }
    
    // 🔺🧲: 🧲☀️🔽 + 🧲🌕🔽 - 🧲🌈🔼 = flux_entrant - flux_sortant (Δ>0→réchauffer, Δ<0→refroidir)
    if (flux['🔺🧲'] !== undefined && flux['🧲☀️🔽'] !== undefined && flux['🧲🌕🔽'] !== undefined && flux['🧲🌈🔼'] !== undefined) {
        const calculated = flux['🧲☀️🔽'] + flux['🧲🌕🔽'] - flux['🧲🌈🔼'];
        const actual = flux['🔺🧲'];
        const matchDelta = (Math.abs(calculated - actual) < 0.01) ? ' ✓' : ` (affiché: ${actual.toFixed(2)})`;
        formulas.push(`<strong>🔺🧲</strong>: <strong>🧲☀️🔽</strong> + <strong>🧲🌕🔽</strong> - <strong>🧲🌈🔼</strong> = ${flux['🧲☀️🔽'].toFixed(2)} + ${flux['🧲🌕🔽'].toFixed(2)} - ${flux['🧲🌈🔼'].toFixed(2)} = ${calculated.toFixed(2)} W/m²${matchDelta}`);
        formulas.push(`&nbsp;&nbsp;&nbsp;&nbsp;Delta équilibre radiatif (flux entrant - flux sortant). Δ>0→réchauffer, Δ<0→refroidir. En équilibre: 🔺🧲 ≈ 0`);
    }
    
    if (formulas.length === 0) return '';
    
    return `<div class="formule">${formulas.join('<br>')}</div>`;
}

// Fonction json2html pour convertir un objet JSON en HTML formaté
// Utilise JSON.stringify puis formate pour correspondre à grammar.txt (guillemets simples)
function json2html(obj, title, source, objName = null, categoryKey = null) {
    if (!obj) return '';
    
    // Formater les nombres : notation scientifique pour grands nombres, 3 décimales toujours
    const formatNumber = (value) => {
        if (typeof value !== 'number') return value;
        if (value === 0) return '0.000';
        // Utiliser notation scientifique si |value| > 1000 ou |value| < 0.001
        if (Math.abs(value) > 1000 || (Math.abs(value) < 0.001 && value !== 0)) {
            return value.toExponential(3);
        }
        // Sinon, 3 décimales
        return value.toFixed(3);
    };
    
    // Formater récursivement l'objet
    const formatValue = (value) => {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'number') return formatNumber(value);
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'string') return `'${value}'`;
        if (Array.isArray(value)) {
            return '[' + value.map(formatValue).join(', ') + ']';
        }
        if (typeof value === 'object') {
            const entries = Object.entries(value).map(([k, v]) => `'${k}':${formatValue(v)}`);
            return '{' + entries.join(', ') + '}';
        }
        return String(value);
    };
    
    // Construire la chaîne JSON formatée
    let jsonStr = formatValue(obj);
    
    // Ajouter le logo si categoryKey fourni (sans objName)
    if (categoryKey) {
        // Scie : logo (emoji) comme clé de calcul, pas l'image
        jsonStr = `${categoryKey}=${jsonStr}`;
    } else if (objName) {
        // Si pas de categoryKey mais objName, utiliser juste objName
        jsonStr = `${objName}=${jsonStr}`;
    }
    
    // Ne pas afficher le titre (description) - juste le JSON avec le logo
    // Ajouter les formules depuis FORM si categoryKey fourni
    let formuleHtml = '';
    if (categoryKey && window.FORM && window.FORM[categoryKey]) {
        const formulas = [];
        for (const key in obj) {
            if (window.FORM[categoryKey][key]) {
                let formula = window.FORM[categoryKey][key];
                // Ignorer les formules dont la description commence par "!" (variables internes aux calculs)
                if (formula.startsWith('!')) continue;
                // Remplacer %1, %2, %3... par les valeurs réelles depuis obj[key]
                // %1 = valeur actuelle, %2 = valeur précédente (si disponible), etc.
                const value = obj[key];
                if (typeof value === 'number') {
                    // Formater selon la valeur (notation scientifique si grand/petit)
                    const formatValue = (val) => {
                        if (val === 0) return '0.000';
                        if (Math.abs(val) > 1000 || (Math.abs(val) < 0.001 && val !== 0)) {
                            return val.toExponential(3);
                        }
                        return val.toFixed(3);
                    };
                    formula = formula.replace(/%1/g, formatValue(value));
                    formula = formula.replace(/%2/g, formatValue(value)); // Pour l'instant, %2 = %1
                }
                // Rendre les symboles mathématiques plus visibles
                formula = formula.replace(/∀/g, '<strong style="font-size: 1.1em;">∀</strong>');
                formula = formula.replace(/∈/g, '<strong style="font-size: 1.1em;">∈</strong>');
                formulas.push(`${key}: ${formula}`);
            }
        }
        if (formulas.length > 0) {
            formuleHtml = `<div class="formule">${formulas.join('<br>')}</div>`;
        }
    }
    
    let html = `
        <div class="config-section">
            <div class="config-value">${jsonStr}</div>
            ${formuleHtml ? `<div class="formule-container notVisible">${formuleHtml}</div>` : ''}
        </div>
    `;
    return html;
}

// Fonction pour formater JSON avec notation scientifique pour les grands/petits nombres
function formatJSONCompact(obj) {
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'number') {
            // Utiliser notation scientifique si > 1000 ou < 0.001
            if (Math.abs(value) > 1000 || (Math.abs(value) < 0.001 && value !== 0)) {
                return value.toExponential(3);
            }
            // Sinon, garder la notation décimale avec 3 décimales max
            return parseFloat(value.toFixed(3));
        }
        return value;
    });
}

function formatTuningValue(value) {
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return String(value);
        if (Number.isInteger(value)) return String(value);
        if (Math.abs(value) >= 1000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) return value.toExponential(3);
        return parseFloat(value.toFixed(6)).toString();
    }
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
}

function renderTuningParamLine(logo, key, value, label) {
    const pretty = formatTuningValue(value);
    return `<div class="config-value">${logo} <strong>${key}</strong> = ${pretty}${label ? ` — ${label}` : ''}</div>`;
}

function getTuningLineLogo(groupKey, key) {
    if (groupKey === 'SOLVER') {
        if (key === 'TOL_MIN_WM2') return '🔬';
        if (key === 'LARGE_DELTA_FACTOR') return '🔺🧲';
        if (key === 'MAX_SEARCH_STEP_K' || key === 'MAX_SEARCH_STEP_LARGE_K') return '🌡️';
        return '🧮';
    }
    if (groupKey === 'SCIENCE') {
        if (key === 'CLOUD_FRACTION_INDEX_GAIN') return '☁️';
        if (key === 'OPTICAL_EFF_CCN_GAIN') return '🧪';
        return '🔬';
    }
    if (groupKey === 'CLOUD_SW') {
        if (key.indexOf('SULFATE') === 0) return '✈';
        if (key.indexOf('CLOUD_') === 0) return '☁️';
        if (key.indexOf('OPTICAL_') === 0) return '🧪';
        if (key.indexOf('TEMP_') === 0) return '🌡️';
        return '⛅';
    }
    return '•';
}

function getFineTuningValue(target) {
    return window.DATA['🎚️'][target.group][target.key];
}

function syncSolverConfigFromData() {
    // No-op : SOLVER n'est plus dans DATA. Source unique = window.CONFIG_COMPUTE (configTimeline.js v1.4.13).
}

function renderBiblioLines(logo, title, groupKey, biblioObj) {
    const groupTargets = getFineTuningTargetsByGroup(groupKey);
    const bary = getFineTuningBaryPercent(groupKey);
    let controlsHtml = '';
    if (groupTargets.length) {
        controlsHtml = ` <span style="margin-left:8px;">🎚️</span>
            <input id="fine-tuning-bary-slider-${groupKey}" type="range" min="0" max="100" step="1" value="${bary.toFixed(0)}" oninput="onFineTuningBaryInput('${groupKey}', this.value)">
            <span id="fine-tuning-bary-value-${groupKey}">${bary.toFixed(0)}%</span>
            <button class="toggle-button" onclick="applyFineTuningBaryGroupAndRun('${groupKey}', document.getElementById('fine-tuning-bary-slider-${groupKey}').value); return false;">▶️</button>`;
    }
    let html = `<div class="config-section"><div class="config-value"><strong>${logo} ${title}</strong>${controlsHtml}</div>`;
    if (!biblioObj || Object.keys(biblioObj).length === 0) {
        html += `<div class="config-value">— aucune source renseignée</div></div>`;
        return html;
    }
    const targets = getFineTuningTargets();
    const targetByKey = {};
    for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        targetByKey[t.group + '.' + t.key] = t;
    }
    Object.keys(biblioObj).forEach(function (k) {
        const entry = biblioObj[k];
        const src = entry && entry.source ? entry.source : 'n/a';
        const target = targetByKey[groupKey + '.' + k];
        const activeVal = target ? getFineTuningValue(target) : (entry ? entry.value : null);
        const minStr = target ? formatTuningValue(target.min) : 'n/a';
        const maxStr = target ? formatTuningValue(target.max) : 'n/a';
        html += `<div class="config-value">${logo} ${k} 🔻 : ${formatTuningValue(activeVal)} [${minStr} , ${maxStr}] #${src}</div>`;
    });
    html += `</div>`;
    return html;
}

function renderMergedCategory(groupKey, titleLabel, titleIcon, showHeader) {
    const groupTargets = getFineTuningTargetsByGroup(groupKey);
    if (!groupTargets.length) return '';
    const bary = getFineTuningBaryPercent(groupKey);
    let controlsHtml = '';
    if (groupKey === 'SOLVER') {
        controlsHtml = `<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;margin-left:8px;">
            <input id="fine-tuning-bary-slider-${groupKey}" type="range" min="0" max="100" step="1" value="${bary.toFixed(0)}" oninput="onFineTuningBaryInput('${groupKey}', this.value)">
            <span id="fine-tuning-bary-value-${groupKey}">${bary.toFixed(0)}%</span>
            <button class="toggle-button" onclick="applyFineTuningBaryGroupAndRun('${groupKey}', document.getElementById('fine-tuning-bary-slider-${groupKey}').value); return false;">▶️</button>
        </span>`;
    }
    let html = `<div class="config-section">`;
    if (showHeader !== false) {
        html += `<div class="config-value" style="display:flex;align-items:center;justify-content:flex-start;gap:8px;flex-wrap:nowrap;">
            <strong style="white-space:nowrap;">${titleIcon} ${titleLabel} 🎚️</strong>${controlsHtml}
        </div>`;
    }
    for (let i = 0; i < groupTargets.length; i++) {
        const target = groupTargets[i];
        const logo = getTuningLineLogo(groupKey, target.key);
        const activeVal = getFineTuningBaryValue(target, bary);
        html += `<div class="config-value">${logo} ${target.key} 🔻 ${formatTuningValue(activeVal)} [${formatTuningValue(target.min)} , ${formatTuningValue(target.max)}]${target.note ? ` — ${target.note}` : ''}${target.source ? ` #${target.source}` : ''}</div>`;
    }
    html += `</div>`;
    return html;
}
