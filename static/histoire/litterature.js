// File: CO2/static/histoire/litterature.js
// Desc: COURBE DE LA LITTÉRATURE — température moyenne de surface de la Terre (°C), t en années avant
//       2025. Tableaux et formules PUBLIÉS uniquement, chacun avec sa référence ; indépendant du modèle
//       (c'est à lui qu'on compare la courbe simulée, courbe_modele.js). Là où la littérature n'a pas
//       de mesure, la page montre un TROU, pas une courbe inventée.
//         · phanda      : Judd et al. 2024 (Science 385:eadk3705), GMST 5 / 50 / 95 % par étage,
//                         à l'âge moyen de l'étage — PhanDA_GMSTandCO2_percentiles.csv (github.com/EJJudd/PhanDA)
//         · instrumental: 1850–1900 = 13,5 °C (Copernicus ESOTC 2024) ; 2000 = 14,4 °C (GISTEMP v4
//                         +0,39 sur 14,0 de Jones et al. 1999) ; 2024 = 13,5 + 1,60 = 15,1 °C (Copernicus) ;
//                         incertitude ±0,5 °C sur l'ABSOLU (Jones et al. 1999)
//         · reperes     : valeurs ponctuelles publiées, avec leur fourchette
//         · glaciations : intervalles DATÉS des glaciations globales ; aucune température (pas de proxy
//                         pendant un Snowball, Hoffman et al. 2017)
// Version 1.0.0
// Date: 2026-09-23
// logs :
//   - v1.0.0: remplace courbe_points.js / courbe_temperature.js (points et formules générés par Gemini,
//     sans source réelle, dont une sinusoïde « Milankovitch » inventée et un seul épisode Snowball mal daté).
// Copyright 2026 DNAvatar.org - Arnaud Maignan
window.HISTOIRE = window.HISTOIRE || {};
window.HISTOIRE.litterature = {
    // [t (années avant 2025), T 5 %, T 50 %, T 95 %]
    phanda: [
        [4.81965e+08, 22.57, 32.10, 36.86], // Tremadocian
        [4.7417e+08, 23.25, 31.53, 39.25], // Floian
        [4.7034e+08, 23.28, 30.90, 35.93], // Dapingian
        [4.638e+08, 24.63, 31.00, 35.86], // Darriwilian
        [4.55465e+08, 22.43, 27.31, 32.93], // Sandbian
        [4.4898e+08, 22.98, 27.85, 32.78], // Katian
        [4.4414e+08, 14.76, 20.80, 27.17], // Hirnantian
        [4.4083e+08, 12.95, 19.48, 24.42], // Aeronian/Rhuddanian
        [4.3576e+08, 17.66, 24.36, 30.79], // Telychian
        [4.31775e+08, 13.61, 19.90, 25.90], // Sheinwoodian
        [4.2868e+08, 15.05, 20.97, 26.72], // Homerian
        [4.25875e+08, 18.77, 25.60, 32.92], // Gorstian
        [4.2387e+08, 28.23, 34.05, 38.17], // Ludfordian
        [4.20865e+08, 25.51, 33.25, 38.64], // Pridoli
        [4.1475e+08, 23.45, 28.81, 33.21], // Pragian/Lochkovian
        [4.024e+08, 21.75, 25.29, 29.13], // Emsian
        [3.898e+08, 18.81, 22.49, 26.87], // Eifelian
        [3.821e+08, 21.52, 25.67, 29.96], // Givetian
        [3.75e+08, 23.58, 27.91, 31.58], // Frasnian
        [3.652e+08, 20.05, 23.76, 27.52], // Famennian
        [3.53015e+08, 18.93, 21.75, 24.76], // Tournaisian
        [3.38535e+08, 7.44, 12.83, 17.31], // Visean
        [3.2687e+08, 9.02, 12.02, 15.68], // Serpukhovian
        [3.19275e+08, 10.58, 14.08, 20.56], // Bashkirian
        [3.11085e+08, 15.00, 18.09, 22.63], // Moscovian
        [3.0535e+08, 11.32, 14.46, 18.29], // Kasimovian
        [3.01285e+08, 14.27, 16.55, 19.61], // Gzhelian
        [2.96205e+08, 15.20, 20.25, 27.39], // Asselian
        [2.92015e+08, 12.58, 20.80, 26.10], // Sakmarian
        [2.86905e+08, 15.56, 20.76, 24.22], // Artinskian
        [2.78835e+08, 15.08, 18.70, 24.39], // Kungurian
        [2.7179e+08, 8.77, 13.50, 18.29], // Roadian
        [2.6438e+08, 14.30, 18.68, 22.06], // Capitanian/Wordian
        [2.56895e+08, 19.14, 22.19, 24.61], // Wuchiapingian
        [2.5307e+08, 14.29, 18.02, 20.70], // Changhsingian
        [2.5089e+08, 24.35, 28.50, 32.06], // Induan
        [2.4567e+08, 20.14, 25.82, 32.62], // Anisian/Olenekian
        [2.3923e+08, 9.29, 19.18, 24.71], // Ladinian
        [2.3215e+08, 18.08, 23.43, 29.47], // Carnian
        [2.1652e+08, 21.04, 25.02, 28.68], // Norian
        [2.0355e+08, 18.51, 22.32, 25.77], // Rhaetian
        [1.9713e+08, 21.17, 25.06, 30.42], // Sinemurian/Hettangian
        [1.8855e+08, 20.86, 24.10, 30.76], // Pliensbachian
        [1.7945e+08, 23.17, 26.37, 29.63], // Toarcian
        [1.728e+08, 16.26, 23.20, 28.80], // Aalenian
        [1.69535e+08, 14.37, 21.39, 23.91], // Bajocian
        [1.6673e+08, 11.10, 17.77, 20.68], // Bathonian
        [1.6341e+08, 16.97, 20.11, 24.40], // Callovian
        [1.58155e+08, 21.38, 23.88, 30.14], // Oxfordian
        [1.5201e+08, 21.18, 24.47, 29.63], // Kimmeridgian
        [1.4617e+08, 23.73, 27.27, 31.35], // Tithonian
        [1.404e+08, 21.27, 27.00, 35.20], // Berriasian
        [1.3515e+08, 22.48, 28.25, 37.73], // Valanginian
        [1.2955e+08, 20.84, 27.27, 31.35], // Hauterivian
        [1.2395e+08, 22.93, 30.52, 34.95], // Barremian
        [1.173e+08, 24.39, 32.00, 37.54], // Aptian
        [1.0685e+08, 23.01, 26.01, 31.05], // Albian
        [9.72e+07, 28.45, 34.14, 40.22], // Cenomanian
        [9.1645e+07, 31.11, 35.56, 43.73], // Turonian
        [8.7545e+07, 29.85, 32.26, 40.82], // Coniacian
        [8.4675e+07, 28.35, 31.42, 38.50], // Santonian
        [7.791e+07, 24.39, 28.13, 31.06], // Campanian
        [6.9085e+07, 21.57, 24.51, 26.81], // Maastrichtian
        [6.262e+07, 25.43, 28.85, 31.87], // Selandian/Danian
        [5.762e+07, 24.57, 25.60, 28.17], // Thanetian
        [5.585e+07, 30.29, 33.59, 39.17], // PETM
        [5.2035e+07, 29.73, 32.28, 37.27], // Ypresian
        [4.455e+07, 24.57, 26.99, 32.61], // Lutetian
        [3.937e+07, 26.10, 28.03, 30.25], // Bartonian
        [3.5805e+07, 24.65, 26.08, 27.89], // Priabonian
        [3.0595e+07, 21.05, 23.40, 25.09], // Rupelian
        [2.5165e+07, 21.69, 23.44, 24.77], // Chattian
        [2.1745e+07, 19.75, 22.07, 24.89], // Aquitanian
        [1.822e+07, 21.39, 24.06, 26.30], // Burdigalian
        [1.4905e+07, 20.72, 23.78, 26.77], // Langhian
        [1.2725e+07, 21.32, 23.60, 25.44], // Serravallian
        [9.44e+06, 19.18, 20.62, 21.97], // Tortonian
        [6.29e+06, 15.75, 16.94, 18.25], // Messinian
        [4.465e+06, 14.97, 16.27, 18.02], // Zanclean
        [3.09e+06, 14.44, 15.63, 17.88], // Piacenzian
        [2.19e+06, 12.94, 14.21, 15.95], // Gelasian
        [1.287e+06, 11.82, 12.82, 14.00], // Calabrian
        [451500, 10.63, 11.79, 13.21], // Chibanian
        [70350, 10.52, 11.44, 12.56], // Upper Pleistocene
        [5850, 12.97, 13.99, 14.54], // Holocene
    ],
    instrumental: [
        [150, 13.0, 13.5, 14.0],   // 1850–1900 (Copernicus ESOTC 2024)
        [25,  13.9, 14.4, 14.9],   // 2000 (GISTEMP v4 + Jones 1999)
        [1,   14.6, 15.1, 15.6]    // 2024 : +1,60 °C sur 1850–1900 (Copernicus)
    ],
    reperes: [
        { t0: 5.0e9, t1: 4.5e9, lo: -19, hi: -17, label: 'Corps noir', src: 'Équation : T_eq = [S(1−A)/4σ]^¼ ≈ −18,5 °C (S = 1361 W/m², A = 0,29)' },
        { t0: 4.5e9, t1: 4.45e9, lo: 2300, hi: 2800, label: 'Océan de magma', src: "Après l'impact géant (Sleep, Zahnle & Neuhoff 2001, PNAS 98:3666 ; Zahnle et al. 2010) — ordre de grandeur" },
        { t0: 4.4e9, t1: 4.4e9, lo: 0, hi: 100, label: 'Eau liquide', src: 'Zircons de Jack Hills : eau liquide dès 4,4 Ga (Wilde et al. 2001, Nature 409:175) → T < 100 °C' },
        { t0: 3.5e9, t1: 3.2e9, lo: 26, hi: 35, label: 'Océan archéen', src: 'δ18O des phosphates, Barberton (Blake, Chang & Lepland 2010, Nature 464:1029)' },
        { t0: 3.42e9, t1: 3.42e9, lo: 0, hi: 40, label: '≤ 40 °C', src: 'δ18O–δD des cherts de Buck Reef (Hren, Tice & Chamberlain 2009, Nature 462:205)' }
    ],
    glaciations: [
        { t0: 717e6, t1: 659e6, label: 'Sturtien', src: 'Hoffman et al. 2017, Sci. Adv. 3:e1600983 (U-Pb : 717 → 659,3–658,5 Ma)' },
        { t0: 639e6, t1: 635.2e6, label: 'Marinoen', src: 'Hoffman et al. 2017 (début 649,9–639,0 Ma ; fin 635,2 Ma)' }
    ]
};
