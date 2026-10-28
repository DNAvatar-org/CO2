// File: astronomie.js - Cycles de Milankovitch
// Desc: Éléments orbitaux de la Terre — excentricité, obliquité, longitude du périhélie — selon la solution La2004 (Laskar et
//       al. 2004), de −51 Ma à l'an 2000, et insolation journalière moyenne (Berger 1978) à une latitude et une longitude
//       solaire données.
// Version 4.0.0
// - v4.0.0 (2026-10-26): solution La2004 en table (astronomie_la04.js) à la place des séries de Berger & Loutre 1991 et
//   Berger 1978 ; effet orbital direct en °C retiré (l'onglet Histoire trace l'insolation d'été à 65° N).
// Date: [October 26, 2026]
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

/* Laskar, J., Robutel, P., Joutel, F., Gastineau, M., Correia, A. C. M. & Levrard, B. (2004), A&A 428, 261-285,
   doi:10.1051/0004-6361:20041335 — intégration numérique du système solaire, table INSOLN.LA2004.BTL.ASC (paquet palinsol de
   M. Crucifix), au pas de 1 ka : astronomie_la04.js (CO2/scripts/astronomie/la2004_table.py). L'excentricité vaut jusqu'à
   40–45 Ma (La2010, Laskar et al. 2011, A&A 532:A89) ; la PHASE de la précession et de l'obliquité devient incertaine vers
   20 Ma (dissipation de marée et forme de la Terre mal connues dans le passé), leurs amplitudes restent celles de la solution.
   Avant −51 Ma, aucune solution : dansLaValidite le dit, orbite() crashe. Après 2000, la table s'arrête : orbite de 2000
   (⚠️ sur les 300 ans de la frise future, au rythme de la table, ϖ tournerait d'environ 5°, e baisserait de 1,4·10⁻⁴ et ε de 0,04°).
   Convention : ϖ de la table + π, la longitude géocentrique du périhélie de palinsol (l'anomalie vraie vaut ν = λ − ϖ, λ
   longitude solaire vraie, π/2 = solstice d'été boréal). Contrôle : en 2000, e 0,016702, ε 23,439°, ϖ 282,9° ; insolation au
   solstice d'été à 65° N à 0,5 W/m² de Berger & Loutre 1991 (477,9 contre 477,4), dont l'excentricité dérivait déjà (0,0172). */

const SOLAR_CONSTANT = 1361;          // W/m², TSI mesurée (Kopp & Lean 2011)
const AN_REFERENCE = 1950;            // t = années après 1950.0 ; orbite de référence des anomalies (physics/orbite.js)
const DEG_RAD = Math.PI / 180;
const L04 = window.LA2004;
const AN_TABLE = 2000;                                            // indice 0 de la table
const N_TABLE = L04.e1e6.length;                                  // 51 001 lignes
const DEBUT_AN = AN_TABLE - (N_TABLE - 1) * L04.pasAns;           // −50 998 000 : la plus vieille année de la solution
const FIN_TABLE_AN = AN_TABLE;
const SOLUTION_NOM = 'Laskar et al. 2004';

/**
 * Éléments orbitaux à t années après 1950.0.
 * @returns {{obliquite:number, excentricite:number, varpi:number}} obliquité ε (rad), excentricité e, longitude vraie du
 *   périhélie ϖ (rad, convention géocentrique, voir en tête). Interpolation linéaire entre les deux lignes de la table qui
 *   encadrent la date ; ϖ, qui tourne de ≈ 0,3 rad par ka, sur l'écart ramené à ]−π, π].
 */
function orbite(t) {
    const u = Math.max(0, (AN_TABLE - AN_REFERENCE - t) / L04.pasAns);   // lignes avant 2000 ; après 2000 : la ligne 0
    if (!(u <= N_TABLE - 1)) throw new Error('[astronomie] an ' + (AN_REFERENCE + t) + ' : avant la solution La2004 (' + DEBUT_AN + ') ou pas un nombre');
    const i = Math.min(Math.floor(u), N_TABLE - 2), f = u - i;
    const lin = (T) => (T[i] + f * (T[i + 1] - T[i]));
    const v0 = L04.varpi1e4[i] / 1e4, dv = ((L04.varpi1e4[i + 1] / 1e4 - v0 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    const deuxPi = 2 * Math.PI;
    return {
        obliquite: lin(L04.eps1e6) / 1e6,
        excentricite: lin(L04.e1e6) / 1e6,
        varpi: ((v0 + f * dv + Math.PI) % deuxPi + deuxPi) % deuxPi
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

/** L'année calendaire est-elle couverte par la solution ? (Après 2000 : oui, orbite de 2000, voir en tête.) */
function dansLaValidite(anCalendaire) {
    if (Number.isNaN(anCalendaire)) throw new Error('[astronomie] dansLaValidite : année NaN');
    return anCalendaire >= DEBUT_AN;
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
    DEBUT_AN,
    FIN_TABLE_AN,
    SOLUTION_NOM,
    orbite,
    insolationJournaliere,
    insolation65N,
    dansLaValidite,
    parametresMilankovitch
};
