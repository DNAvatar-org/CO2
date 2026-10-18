// File: astronomie.js - Cycles de Milankovitch
// Desc: Éléments orbitaux de la Terre — excentricité, obliquité, longitude du périhélie — selon une solution astronomique
//       en séries (Berger & Loutre 1991 par défaut, ± 3 Ma ; Berger 1978, ± 1 Ma), et insolation journalière moyenne à une
//       latitude et une longitude solaire données.
// Version 3.2.0
// - v3.2.0: effetOrbitalGlobalK — effet orbital direct sur la température moyenne du globe (excentricité, Planck seul).
// - v3.1.0: solution de Berger & Loutre 1991 (± 3 Ma, astronomie_ber90.js), utilisée par défaut ; Berger 1978 gardée.
// - v3.0.0: solution de Berger 1978 (tables : astronomie_ber78.js) à la place des sinusoïdes de périodes fixes, et
//   insolation journalière moyenne (Berger 1978) à la place du flux de midi.
// Date: [October 16, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

/* Algorithme commun (palinsol 1.0, M. Crucifix, UCLouvain : R/astro.R ber78 / ber90, R/Insol.R Insol) :
     ε = ε* + Σ A cos(f t + φ)          e sin π = Σ M sin(g t + β)          e cos π = Σ M cos(g t + β)
     ψ = ψ̄ t + ζ + Σ F sin(f′ t + δ)    ϖ = π + ψ + 180° (convention géocentrique de palinsol), t en années après 1950.0.
   – Berger, A. L. (1978), J. Atmos. Sci., 35, 2362-2367, doi:10.1175/1520-0469(1978)035<2362:LTVODI>2.0.CO;2 — tables
     astronomie_ber78.js, valide à ± 1 Ma. Contrôle : 1950 → ε 23,4463°, e 0,016724, ϖ 102,04° (+ 180° ici) ; insolation
     65° N au solstice de −1000 à +975 ka = la table de palinsol (insolation.txt) à un facteur 1,002 près (constante solaire).
   – Berger, A. & Loutre, M. F. (1991), Quaternary Science Reviews, 10, 297-317, doi:10.1016/0277-3791(91)90033-Q — tables
     astronomie_ber90.js (tronquées, erreur mesurée dans leur en-tête), valide à ± 3 Ma. Un peu moins juste sur les 50
     derniers ka (palinsol : 1950 → e 0,0172 au lieu de 0,0167 ; insolation 65° N à 0,5 W/m² de Berger 1978) ; vers ± 1 Ma,
     c'est Berger 1978 qui dérive (jusqu'à 18,6 W/m² d'écart entre les deux). */

const SOLAR_CONSTANT = 1361;          // W/m², TSI mesurée (Kopp & Lean 2011)
const AN_REFERENCE = 1950;            // t = années après 1950.0 (époque des tables)
const SEC_RAD = Math.PI / (180 * 3600);
const DEG_RAD = Math.PI / 180;

const SOLUTIONS = {
    ber78: { nom: 'Berger 1978', validite: 1e6, epsEtoile: 23.320556, psiBar: 50.439273, zeta: 3.392506,
             termes: () => ({ obliquite: window.BER78.table1, excentricite: window.BER78.table4, precession: window.BER78.table5 }) },
    ber90: { nom: 'Berger & Loutre 1991', validite: 3e6, epsEtoile: window.BER90.epsEtoile, psiBar: window.BER90.psiBar,
             zeta: window.BER90.zeta, termes: () => window.BER90 }
};
const SOLUTION = SOLUTIONS.ber90;     // celle des graphes (Milankovitch, Histoire)
const VALIDITE_ANS = SOLUTION.validite;   // ± autour de 1950

/**
 * Éléments orbitaux à t années après 1950.0, selon une solution (défaut : SOLUTION).
 * @returns {{obliquite:number, excentricite:number, varpi:number}} obliquité ε (rad), excentricité e, longitude vraie du
 *   périhélie ϖ (rad) comptée depuis l'équinoxe de printemps, convention géocentrique de palinsol (Berger + 180°) :
 *   l'anomalie vraie vaut ν = λ − ϖ, λ longitude solaire vraie (π/2 = solstice d'été boréal).
 */
/** e sin π et e cos π à t années après 1950.0 (système d'excentricité de la solution S). */
function sommesExcentricite(t, S) {
    let esin = 0, ecos = 0;
    for (const [M, g, beta] of S.termes().excentricite) {
        esin += M * Math.sin(g * SEC_RAD * t + beta * DEG_RAD);
        ecos += M * Math.cos(g * SEC_RAD * t + beta * DEG_RAD);
    }
    return { esin: esin, ecos: ecos };
}

function orbite(t, S = SOLUTION) {
    const T = S.termes(), { esin, ecos } = sommesExcentricite(t, S);
    let eps = S.epsEtoile, psi = S.psiBar * SEC_RAD * t + S.zeta * DEG_RAD;
    for (const [A, f, phi] of T.obliquite) eps += A / 3600 * Math.cos(f * SEC_RAD * t + phi * DEG_RAD);
    for (const [F, f, delta] of T.precession) psi += F * SEC_RAD * Math.sin(f * SEC_RAD * t + delta * DEG_RAD);
    const deuxPi = 2 * Math.PI;
    return {
        obliquite: eps * DEG_RAD,
        excentricite: Math.hypot(esin, ecos),
        varpi: ((Math.atan2(esin, ecos) + psi + Math.PI) % deuxPi + deuxPi) % deuxPi
    };
}

/**
 * Insolation journalière moyenne au sommet de l'atmosphère (W/m²) : S0/(π ρ²) (H0 sin φ sin δ + cos φ cos δ sin H0),
 * ρ = (1 − e²)/(1 + e cos(λ − ϖ)) distance en UA, sin δ = sin ε sin λ, H0 angle horaire du coucher (nuit / jour polaires
 * compris).
 * @param {{obliquite:number, excentricite:number, varpi:number}} orbite  orbite(t)
 * @param {number} lambda    longitude solaire vraie (rad) — π/2 : solstice d'été boréal
 * @param {number} latitude  rad
 */
function insolationJournaliere(orbite, lambda, latitude) {
    const e = orbite.excentricite;
    const rho = (1 - e * e) / (1 + e * Math.cos(lambda - orbite.varpi));
    const sinDelta = Math.sin(orbite.obliquite) * Math.sin(lambda);
    const cosDelta = Math.sqrt(1 - sinDelta * sinDelta);
    const a = Math.sin(latitude) * sinDelta, b = Math.cos(latitude) * cosDelta;
    const H0 = Math.acos(Math.min(Math.max(-a / b, -1), 1));
    return SOLAR_CONSTANT / (Math.PI * rho * rho) * (H0 * a + b * Math.sin(H0));
}

/** Insolation du solstice d'été à 65° N (W/m²), l'indicateur classique des glaciations, en année calendaire. */
function insolation65N(anCalendaire) {
    return insolationJournaliere(orbite(anCalendaire - AN_REFERENCE), Math.PI / 2, 65 * DEG_RAD);
}

/* Effet orbital DIRECT sur la température moyenne du globe : seule l'excentricité change l'insolation moyenne annuelle du
   globe, S0 / (4 √(1 − e²)) (l'obliquité et la précession déplacent l'énergie entre latitudes et saisons, à total
   constant) ; absorbée (1 − α), rendue par la seule réponse de Planck, SANS rétroaction (glace, vapeur, CO₂). Sur ± 3 Ma :
   e de 0,0005 à 0,058 → 0,57 W/m² d'insolation moyenne → 0,13 °C crête à crête. Les ± 4 °C des cycles glaciaires sont
   les rétroactions, que déclenche la redistribution (insolation de l'été boréal, insolation65N). */
const ALBEDO_PLANETAIRE = 0.29;   // albédo planétaire mesuré, CERES EBAF (Loeb et al. 2018, J. Climate 31, 895)
const PLANCK_W_M2_K = 3.2;        // réponse de Planck globale (Soden & Held 2006, J. Climate 19, 3354 : −3,2 W/m²/K)
const insolationMoyenneGlobale = (e) => SOLAR_CONSTANT / (4 * Math.sqrt(1 - e * e));
const E_1950 = Math.hypot(sommesExcentricite(0, SOLUTION).esin, sommesExcentricite(0, SOLUTION).ecos);

/** Écart à 1950 de la température moyenne du globe dû à l'orbite seule (K), en année calendaire. */
function effetOrbitalGlobalK(anCalendaire) {
    const { esin, ecos } = sommesExcentricite(anCalendaire - AN_REFERENCE, SOLUTION);
    return (insolationMoyenneGlobale(Math.hypot(esin, ecos)) - insolationMoyenneGlobale(E_1950)) * (1 - ALBEDO_PLANETAIRE) / PLANCK_W_M2_K;
}

/** L'année calendaire est-elle dans le domaine de validité de la solution ? */
function dansLaValidite(anCalendaire) {
    return Math.abs(anCalendaire - AN_REFERENCE) <= VALIDITE_ANS;
}

/**
 * Paramètres de Milankovitch d'une année calendaire, pour les graphes : obliquité (°), longitude du périhélie (°),
 * excentricité, précession climatique e sin ϖ, distances au périhélie et à l'aphélie (UA, a = 1), insolation 65° N au
 * solstice d'été (W/m²).
 */
function parametresMilankovitch(anCalendaire) {
    const o = orbite(anCalendaire - AN_REFERENCE), e = o.excentricite;
    return {
        excentricite: e,
        obliquiteDeg: o.obliquite / DEG_RAD,
        varpiDeg: o.varpi / DEG_RAD,
        precessionClimatique: e * Math.sin(o.varpi),
        perihelieUA: 1 - e,
        aphelieUA: 1 + e,
        insolation65N: insolationJournaliere(o, Math.PI / 2, 65 * DEG_RAD)
    };
}

window.astronomie = {
    SOLAR_CONSTANT,
    AN_REFERENCE,
    VALIDITE_ANS,
    SOLUTIONS,
    SOLUTION_NOM: SOLUTION.nom,
    orbite,
    insolationJournaliere,
    insolation65N,
    effetOrbitalGlobalK,
    dansLaValidite,
    parametresMilankovitch
};
