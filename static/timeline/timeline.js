/* File: timeline.js - Gestion de la timeline et de l'horloge
 * Desc: En français, dans l'architecture, je suis le module de gestion de la timeline
 * Version 1.0.0
 * Copyright 2025 DNAvatar.org - Arnaud Maignan
 * Licensed under Apache License 2.0 with Commons Clause.
 * See LICENSE_HEADER.txt for full terms.
 * Date: [June 08, 2025] [HH:MM UTC+1]
 * Logs:
 *   - Initial version: extraction du code timeline depuis main.js
 */

// ============================================================================
// HORLOGE / TIMELINE
// ============================================================================
let timelineFrame = 0; // Nombre de frames écoulées
const YEARS_PER_FRAME = 10; // 1 frame = 10 ans (tic automatique toutes les secondes = +10 ans)
// Note : Pour les sources industrielles ou volcaniques, on peut espérer un étalement dans le temps
let timelineRunning = true; // État de l'horloge (activée - tics automatiques de +10 ans/seconde)
let timelineLastUpdate = performance.now();
const TIMELINE_UPDATE_INTERVAL = 1000; // Mise à jour toutes les 1000ms (1 seconde = 10 ans) - UNIQUEMENT si pas de calcul en cours
let currentEpochStartYears = null; // Stocker le début de l'époque actuelle pour calculer le delta

// Variable globale pour le temps écoulé dans l'époque (commence toujours à 0 Ma)
window.infoTimeMa = 0; // Temps écoulé depuis le début de l'époque (en millions d'années, Ma)
// textureIndex = infoTimeMa / 50 (calculé automatiquement, chaque texture = 50Ma)
// Accessible via window.textureIndex ou via epochConfig.lightDistance pour Hadéen

// Variables de tracking pour détecter les changements
window.lastTicTime = undefined; // Dernière valeur de ticTime (infoTimeMa / 50)
window.lastIceLevel = undefined; // Dernière valeur de h2oIceFractionFromCalculation

function updateTimeline() {
    // Mettre à jour l'affichage (toujours, même si timelineRunning = false)
    const timelineDisplay = document.getElementById('timeline-display');
    const frameDisplay = document.getElementById('frame-display');
    const infoTimeDisplay = document.getElementById('info-time');

    const years = timelineFrame * YEARS_PER_FRAME;

    // Formater les années avec M (Mega) et M̅ (Milliard avec barre)
    const formattedYears = formatYears(years);

    if (timelineDisplay) {
        timelineDisplay.innerHTML = `<span class="timeline-hourglass">📅</span> ${formattedYears}`;
    }

    if (frameDisplay) {
        frameDisplay.textContent = timelineFrame.toString();
    }

    // Mettre à jour l'horloge dans la zone horloge
    // Toujours utiliser window.infoTimeMa (commence toujours à 0 Ma)
    if (infoTimeDisplay) {
        const currentEpoch = (typeof window !== 'undefined' && window.currentEpochName) || '';
        
        const infoTimeMa = window.infoTimeMa || 0;
        let newText;
        
            // Afficher en Ma (millions d'années)
            const deltaMa = infoTimeMa.toFixed(1).replace(/\.?0+$/, '');
            newText = `+${deltaMa} Ma`;
        
        // Ne modifier le texte que s'il a changé pour éviter le clignotement
        if (infoTimeDisplay.textContent !== newText) {
            infoTimeDisplay.textContent = newText;
        }
    }
    
    // Calculer textureIndex = infoTimeMa / 50 (variable globale pour simplifier)
    // Chaque texture = 50Ma : 0-49Ma = 0, 50-99Ma = 1, ..., 450-499Ma = 9
    if (typeof window !== 'undefined') {
        window.textureIndex = Math.floor((window.infoTimeMa || 0) / 50);
        
        // Détecter les changements pour déclencher les mises à jour
        const currentTicTime = window.textureIndex;
        const currentIceLevel = window.h2oIceFractionFromCalculation !== undefined ? window.h2oIceFractionFromCalculation : 0;
        
        // Détecter changement de texture (ticTime)
        window.isTextChange = (window.lastTicTime !== undefined && window.lastTicTime !== currentTicTime);
        if (window.isTextChange || window.lastTicTime === undefined) {
            window.lastTicTime = currentTicTime;
        }
        
        // Détecter changement de glace
        window.isIceChange = (window.lastIceLevel !== undefined && Math.abs(window.lastIceLevel - currentIceLevel) > 0.001);
        if (window.isIceChange || window.lastIceLevel === undefined) {
            window.lastIceLevel = currentIceLevel;
        }
        
        // Si changement de texture (ticTime) ou de glace, mettre à jour Three.js
        if (window.isTextChange && typeof window.updateHadeenTexture === 'function') {
            window.updateHadeenTexture();
        } else if (window.isIceChange && typeof window.updatePlanetLighting === 'function') {
            // Mettre à jour l'éclairage Three.js si la glace change (affecte lightDistance)
            window.updatePlanetLighting();
        }
    }

    // 🔒 DÉSACTIVÉ : Ne plus incrémenter automatiquement de +10 ans toutes les secondes
    // L'incrémentation se fait uniquement lors des clics sur boutons (météorite glace, etc.)
    // if (timelineRunning && !calculationInProgress) {
    //     const currentTime = performance.now();
    //     const elapsed = currentTime - timelineLastUpdate;
    //
    //     // Incrémenter les frames selon l'intervalle (1 seconde = 10 ans)
    //     if (elapsed >= TIMELINE_UPDATE_INTERVAL) {
    //         timelineFrame++;
    //         timelineLastUpdate = currentTime;
    //         const years = timelineFrame * YEARS_PER_FRAME;
    //         // Mettre à jour l'affichage immédiatement après l'incrémentation
    //         const formattedYears = formatYears(years);
    //         if (timelineDisplay) timelineDisplay.innerHTML = `<span class="timeline-hourglass">📅</span> ${formattedYears}`;
    //         if (frameDisplay) frameDisplay.textContent = timelineFrame.toString();
    //         // Afficher le delta depuis le début de l'époque en dizaines d'années uniquement
    //         if (infoTimeDisplay && currentEpochStartYears !== null) {
    //             const deltaYears = years - currentEpochStartYears;
    //             const deltaInTens = Math.floor(deltaYears / 10) * 10; // Arrondir à la dizaine
    //             const newText = deltaInTens > 0 ? `+${deltaInTens} ans` : '+0 ans';
    //             // Ne modifier le texte que s'il a changé pour éviter le clignotement
    //             if (infoTimeDisplay.textContent !== newText) {
    //                 infoTimeDisplay.textContent = newText;
    //             }
    //         }
    //     }
    // }
    // Si calculationInProgress = true, on ne fait rien (pas d'incrémentation, pas de mise à jour de timelineLastUpdate)
    // pour que le tic reprenne immédiatement après la fin du calcul

    requestAnimationFrame(updateTimeline);
}

// Fonction pour formater les années avec Ma (millions d'années)
// Format : -4500 Ma (exemple : -4500 millions d'années)
// Les valeurs positives sont considérées comme des dates dans le passé (affichées avec "-")
function formatYears(years) {
    if (years === 0) {
        return '0 ans';
    }
    
    // Convertir en millions d'années
    const millions = Math.abs(years) / 1e6;
    
    // Si >= 1 million, afficher en Ma
    if (millions >= 1) {
        const sign = years < 0 ? '-' : '';
        // Arrondir à 1 décimale, mais enlever les zéros inutiles
        const millionsFormatted = millions.toFixed(1).replace(/\.?0+$/, '');
        return `${sign}${millionsFormatted} Ma`;
    }
    
    // Sinon, afficher en milliers d'années (Ka)
    const milliers = Math.abs(years) / 1e3;
    if (milliers >= 1) {
        const sign = years < 0 ? '-' : '';
        const milliersFormatted = milliers.toFixed(0);
        return `${sign}${milliersFormatted} Ka`;
    }
    
    // Sinon, afficher en années
    return `${years < 0 ? '-' : ''}${Math.abs(years)} ans`;
}

// Fonction pour incrémenter le temps de 10 ans (lors des clics sur boutons)
// Note : Les tics automatiques ajoutent aussi +10 ans/seconde
function incrementTimeline() {
    timelineFrame++;
    updateTimeline();
}

// Démarrer l'horloge
if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    requestAnimationFrame(updateTimeline);
}

function startTimeline() {
    timelineRunning = true;
    timelineLastUpdate = performance.now();
    updateTimeline();
}

function pauseTimeline() {
    timelineRunning = false;
}

// Exposer les variables et fonctions globalement
if (typeof window !== 'undefined') {
    // Exposer les variables pour main.js
    window.timelineFrame = timelineFrame;
    window.YEARS_PER_FRAME = YEARS_PER_FRAME;
    window.timelineRunning = timelineRunning;
    window.timelineLastUpdate = timelineLastUpdate;
    window.TIMELINE_UPDATE_INTERVAL = TIMELINE_UPDATE_INTERVAL;
    window.currentEpochStartYears = currentEpochStartYears;
    
    // Exposer les fonctions
    window.updateTimeline = updateTimeline;
    window.incrementTimeline = incrementTimeline;
    window.startTimeline = startTimeline;
    window.pauseTimeline = pauseTimeline;
    window.formatYears = formatYears;
}

// Fonction pour réinitialiser la timeline
function resetTimeline() {
    timelineFrame = 0;
    timelineRunning = false;
    if (typeof window !== 'undefined') {
        window.infoTimeMa = 0;
        window.timelineFrame = 0;
        window.timelineRunning = false;
    }
}

// Exposer resetTimeline globalement
if (typeof window !== 'undefined') {
    window.resetTimeline = resetTimeline;
}

