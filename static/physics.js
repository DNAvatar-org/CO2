// ============================================================================
// File: physics.js - Constantes et lois physiques fondamentales
// Desc: En français, dans l'architecture, je suis le module de physique fondamentale
// Version 1.0.0
// Copyright 2025 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause. 
// See LICENSE_HEADER.txt for full terms.
// Date: [January 2025]
// Logs:
//   - Initial creation: physics constants and Planck/Stefan-Boltzmann functions
// ============================================================================

// ✅ SCIENTIFIQUEMENT CERTAIN : Toutes ces constantes sont des valeurs mesurées et acceptées internationalement
const PLANCK_H = 6.62607015e-34;      // Constante de Planck, J·s (CODATA 2018)
const SPEED_OF_LIGHT = 2.998e8;       // Vitesse de la lumière, m/s (mesurée)
const BOLTZMANN_KB = 1.380649e-23;    // Constante de Boltzmann, J/K (CODATA 2018)
const STEFAN_BOLTZMANN = 5.670374419e-8; // Constante de Stefan-Boltzmann, W/(m²·K⁴) (dérivée des constantes fondamentales)

// ✅ SCIENTIFIQUEMENT CERTAIN :
// - La loi de Planck B(λ,T) = (2hc²/λ⁵) / (exp(hc/λkT) - 1) est une loi fondamentale de la physique
// - Dérivée par Max Planck en 1900, elle décrit le spectre d'émission d'un corps noir
// - Cette formule est exacte et utilisée dans tous les modèles de transfert radiatif
// - Les constantes utilisées (h, c, k) sont des constantes fondamentales mesurées avec précision
function planckFunction(lambda, T) {
    const term1 = (2 * PLANCK_H * SPEED_OF_LIGHT * SPEED_OF_LIGHT) / Math.pow(lambda, 5);
    const term2 = Math.exp((PLANCK_H * SPEED_OF_LIGHT) / (lambda * BOLTZMANN_KB * T)) - 1;
    return term1 / term2; // W/(m²·m·sr) - Intensité spectrale d'un corps noir
}

// Exposer globalement
if (typeof window !== 'undefined') {
    window.PLANCK_H = PLANCK_H;
    window.SPEED_OF_LIGHT = SPEED_OF_LIGHT;
    window.BOLTZMANN_KB = BOLTZMANN_KB;
    window.STEFAN_BOLTZMANN = STEFAN_BOLTZMANN;
    window.planckFunction = planckFunction;
}

