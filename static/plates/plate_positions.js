// Positions des plaques par époque
// dLat > 0 = nord, dLon > 0 = est, rotDeg = rotation propre (autour du centre de la plaque)
// Référence : 📱 (moderne) = tout à 0
// AF = référence fixe

window.PLATE_POSITIONS = {

    '📱': {
        seaLevel: 0.25,
        'AF': { dLat: 0, dLon: 0, rotDeg: 0 },
        'EU': { dLat: 0, dLon: 0, rotDeg: 0 },
        'AS': { dLat: 0, dLon: 0, rotDeg: 0 },
        'NA': { dLat: 0, dLon: 0, rotDeg: 0 },
        'SA': { dLat: 0, dLon: 0, rotDeg: 0 },
        'AN': { dLat: 0, dLon: 0, rotDeg: 0 },
        'AU': { dLat: 0, dLon: 0, rotDeg: 0 },
        'IN': { dLat: 0, dLon: 0, rotDeg: 0 },
        'AR': { dLat: 0, dLon: 0, rotDeg: 0 }
    },

    '❄️': {
        seaLevel: 0.22,
        'AF': { dLat: 0, dLon: 0,  rotDeg: 0 },
        'EU': { dLat: 0, dLon: 0,  rotDeg: 0 },
        'AS': { dLat: 0, dLon: 0,  rotDeg: 0 },
        'NA': { dLat: 0, dLon: -1, rotDeg: 0 },
        'SA': { dLat: 0, dLon: -1, rotDeg: 0 },
        'AN': { dLat: 0, dLon: 0,  rotDeg: 0 },
        'AU': { dLat: -1, dLon: 0, rotDeg: 0 },
        'IN': { dLat: 0, dLon: 0,  rotDeg: 0 },
        'AR': { dLat: 0, dLon: 0,  rotDeg: 0 }
    },

    '🏔': {
        seaLevel: 0.26,
        'AF': { dLat: 0,  dLon: 0,  rotDeg: 0 },
        'EU': { dLat: -1, dLon: 0,  rotDeg: 0 },
        'AS': { dLat: -1, dLon: 0,  rotDeg: 0 },
        'NA': { dLat: 0,  dLon: -2, rotDeg: 0 },
        'SA': { dLat: 0,  dLon: -3, rotDeg: 0 },
        'AN': { dLat: 0,  dLon: 0,  rotDeg: 0 },
        'AU': { dLat: -5, dLon: 0,  rotDeg: 0 },
        'IN': { dLat: -5, dLon: 0,  rotDeg: 0 },
        'AR': { dLat: 0,  dLon: 0,  rotDeg: 0 }
    },

    '⛰': {
        seaLevel: 0.28,
        'AF': { dLat: 0,  dLon: 0,  rotDeg: 0 },
        'EU': { dLat: -1, dLon: 0,  rotDeg: 0 },
        'AS': { dLat: -1, dLon: 0,  rotDeg: 0 },
        'NA': { dLat: 0,  dLon: -3, rotDeg: 0 },
        'SA': { dLat: 0,  dLon: -4, rotDeg: 0 },
        'AN': { dLat: 0,  dLon: 0,  rotDeg: 0 },
        'AU': { dLat: -7, dLon: 0,  rotDeg: 0 },
        'IN': { dLat: -6, dLon: 0,  rotDeg: 0 },
        'AR': { dLat: 0,  dLon: 0,  rotDeg: 0 }
    },

    '🐊': {
        seaLevel: 0.45,
        'AF': { dLat: 0,   dLon: 0,  rotDeg: 0 },
        'EU': { dLat: -2,  dLon: 0,  rotDeg: 0 },
        'AS': { dLat: -2,  dLon: 0,  rotDeg: 0 },
        'NA': { dLat: 0,   dLon: -8, rotDeg: 0 },
        'SA': { dLat: 0,   dLon: -8, rotDeg: 0 },
        'AN': { dLat: 0,   dLon: 0,  rotDeg: 0 },
        'AU': { dLat: -15, dLon: 5,  rotDeg: 0 },
        'IN': { dLat: -12, dLon: 0,  rotDeg: 0 },
        'AR': { dLat: -3,  dLon: 0,  rotDeg: 0 }
    },

    '🦣': {
        seaLevel: 0.35,
        'AF': { dLat: 0,   dLon: 0,   rotDeg: 0 },
        'EU': { dLat: -3,  dLon: 0,   rotDeg: 0 },
        'AS': { dLat: -3,  dLon: 0,   rotDeg: 0 },
        'NA': { dLat: 0,   dLon: -15, rotDeg: 0 },
        'SA': { dLat: 0,   dLon: -15, rotDeg: 0 },
        'AN': { dLat: 0,   dLon: 0,   rotDeg: 0 },
        'AU': { dLat: -25, dLon: 10,  rotDeg: 0 },
        'IN': { dLat: -30, dLon: 0,   rotDeg: 0 },
        'AR': { dLat: -5,  dLon: 0,   rotDeg: 0 }
    },

    '🦕150': {
        seaLevel: 0.30,
        'AF': { dLat: 0,   dLon: 0,   rotDeg: 0 },
        'EU': { dLat: -5,  dLon: -10, rotDeg: 0 },
        'AS': { dLat: -5,  dLon: -10, rotDeg: 0 },
        'NA': { dLat: -5,  dLon: -30, rotDeg: 0 },
        'SA': { dLat: 0,   dLon: -25, rotDeg: 0 },
        'AN': { dLat: 20,  dLon: 0,   rotDeg: 0 },
        'AU': { dLat: -35, dLon: 30,  rotDeg: 0 },
        'IN': { dLat: -55, dLon: -10, rotDeg: 0 },
        'AR': { dLat: -5,  dLon: -5,  rotDeg: 0 }
    },

    '🦕250': {
        seaLevel: 0.15,
        'AF': { dLat: 0,   dLon: 0,   rotDeg: 0 },
        'EU': { dLat: -8,  dLon: -20, rotDeg: 0 },
        'AS': { dLat: -10, dLon: -20, rotDeg: 0 },
        'NA': { dLat: -5,  dLon: -45, rotDeg: 0 },
        'SA': { dLat: 0,   dLon: -35, rotDeg: 0 },
        'AN': { dLat: 35,  dLon: 0,   rotDeg: 0 },
        'AU': { dLat: -45, dLon: 50,  rotDeg: 0 },
        'IN': { dLat: -60, dLon: -20, rotDeg: 0 },
        'AR': { dLat: -5,  dLon: -15, rotDeg: 0 }
    },

    '🌿350': {
        seaLevel: 0.30,
        'AF': { dLat: -20, dLon: 0,   rotDeg: 0 },
        'EU': { dLat: -50, dLon: -30, rotDeg: 0 },
        'AS': { dLat: -30, dLon: -20, rotDeg: 0 },
        'NA': { dLat: -20, dLon: -50, rotDeg: 0 },
        'SA': { dLat: -15, dLon: -35, rotDeg: 0 },
        'AN': { dLat: 40,  dLon: 0,   rotDeg: 0 },
        'AU': { dLat: -40, dLon: 55,  rotDeg: 0 },
        'IN': { dLat: -60, dLon: -30, rotDeg: 0 },
        'AR': { dLat: -25, dLon: -20, rotDeg: 0 }
    },

    '🌿500': {
        seaLevel: 0.55,
        'AF': { dLat: -25, dLon: 0,   rotDeg: 0 },
        'EU': { dLat: -65, dLon: -20, rotDeg: 0 },
        'AS': { dLat: -30, dLon: -10, rotDeg: 0 },
        'NA': { dLat: -35, dLon: -55, rotDeg: 0 },
        'SA': { dLat: -20, dLon: -35, rotDeg: 0 },
        'AN': { dLat: 45,  dLon: 0,   rotDeg: 0 },
        'AU': { dLat: -40, dLon: 60,  rotDeg: 0 },
        'IN': { dLat: -65, dLon: -30, rotDeg: 0 },
        'AR': { dLat: -30, dLon: -20, rotDeg: 0 }
    }
};
