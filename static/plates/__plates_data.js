// plates_data.js — Données segmentées (Cratons) pour reconstruction historique (-500 Ma à 0)
window.PLATES = {
    // --- BLOCS NORD-AMÉRICAINS & ARCTIQUES ---
    'LAU': { // Laurentia (Cœur stable de l'Amérique du Nord)
        name: 'Laurentia',
        height: 0.52,
        color: '#CD853F',
        vertices: [[40,-110], [45,-120], [60,-125], [75,-120], [80,-100], [75,-60], [45,-65], [35,-80]]
    },
    'SIB': { // Sibérie (Indépendante jusqu'au Permien)
        name: 'Siberia',
        height: 0.52,
        color: '#458B74',
        vertices: [[55, 80], [65, 80], [75, 90], [78, 110], [75, 135], [60, 140], [50, 120], [50, 95]]
    },
    'BAL': { // Baltica (Scandinavie / Europe de l'Est)
        name: 'Baltica',
        height: 0.50,
        color: '#6495ED',
        vertices: [[55, 10], [65, 10], [72, 25], [70, 45], [60, 50], [50, 35], [50, 20]]
    },

    // --- BLOCS DU GONDWANA (SUD) ---
    'AF': { 
        name: 'Afrique',
        height: 0.55,
        color: '#8B6914',
        vertices: [[35, -5], [32, 20], [15, 40], [0, 45], [-15, 40], [-35, 20], [-34, 15], [0, 8], [5, -15]]
    },
    'SA': { 
        name: 'Amérique du Sud',
        height: 0.50,
        color: '#DAA520',
        vertices: [[12, -75], [10, -50], [-5, -35], [-20, -40], [-55, -65], [-50, -75], [0, -82]]
    },
    'IN': { 
        name: 'Inde',
        height: 0.55,
        color: '#BDB76B',
        vertices: [[25, 70], [28, 80], [25, 90], [15, 85], [8, 78], [15, 70]]
    },
    'AU': { 
        name: 'Australie',
        height: 0.48,
        color: '#D2691E',
        vertices: [[-12, 125], [-15, 145], [-35, 150], [-38, 140], [-33, 115], [-20, 115]]
    },
    'AN': { 
        name: 'Antarctique',
        height: 0.45,
        color: '#C8C8C8',
        vertices: [[-65, -60], [-65, 60], [-75, 150], [-85, 180], [-85, -180], [-75, -120]]
    },

    // --- RESTE & MICRO-PLAQUES ---
    'EU_S': { // Europe du Sud / Asie Centrale (Téthys)
        name: 'Eurasia-Sud',
        height: 0.48,
        color: '#6B8E23',
        vertices: [[45, -5], [48, 25], [40, 50], [30, 60], [25, 30], [35, 0]]
    },
    'AR': { 
        name: 'Arabie',
        height: 0.50,
        color: '#C2B280',
        vertices: [[30, 35], [25, 55], [15, 50], [12, 40]]
    }
};

window.PLATE_POSITIONS = {
    // ─── MODERNE (An 0) ───
    '📱': {
        'LAU': {rotLat:0, rotLon:0, rotDeg:0}, 'SIB': {rotLat:0, rotLon:0, rotDeg:0}, 'BAL': {rotLat:0, rotLon:0, rotDeg:0},
        'AF': {rotLat:0, rotLon:0, rotDeg:0}, 'SA': {rotLat:0, rotLon:0, rotDeg:0}, 'IN': {rotLat:0, rotLon:0, rotDeg:0},
        'AU': {rotLat:0, rotLon:0, rotDeg:0}, 'AN': {rotLat:0, rotLon:0, rotDeg:0}, 'EU_S': {rotLat:0, rotLon:0, rotDeg:0}, 'AR': {rotLat:0, rotLon:0, rotDeg:0}
    },

    // ─── CRÉTACÉ (-66 Ma) : Ouverture Atlantique ───
    '🦣': {
        'LAU': {rotLat:10, rotLon:20, rotDeg:15},
        'SA': {rotLat:0, rotLon:0, rotDeg:12},
        'AF': {rotLat:0, rotLon:0, rotDeg:0},
        'IN': {rotLat:-30, rotLon:50, rotDeg:20}, // Inde en pleine remontée rapide
        'AU': {rotLat:-50, rotLon:100, rotDeg:10},
        'AN': {rotLat:-85, rotLon:0, rotDeg:0},
        'BAL': {rotLat:5, rotLon:5, rotDeg:2},
        'SIB': {rotLat:2, rotLon:2, rotDeg:2},
        'EU_S': {rotLat:0, rotLon:0, rotDeg:0}, 'AR': {rotLat:0, rotLon:0, rotDeg:0}
    },

    // ─── TRIAS/PERMIEN (-250 Ma) : PANGÉE ───
    // On regroupe tout le monde autour de l'Afrique (0,0)
    '🦕250': {
        'AF': {rotLat:0, rotLon:0, rotDeg:0},
        'SA': {rotLat:0, rotLon:0, rotDeg:-3},  // Collé à gauche de l'Afrique
        'LAU': {rotLat:35, rotLon:-30, rotDeg:25}, // Collé au nord-ouest
        'BAL': {rotLat:45, rotLon:0, rotDeg:10},   // Collé à Laurentia
        'SIB': {rotLat:55, rotLon:40, rotDeg:-20}, // Commence à souder l'Oural
        'IN': {rotLat:-15, rotLon:15, rotDeg:45},  // Dans le creux est de l'Afrique
        'AN': {rotLat:-50, rotLon:10, rotDeg:0},   // Sud de l'Afrique
        'AU': {rotLat:-45, rotLon:50, rotDeg:-10}, // Bout de l'Antarctique
        'EU_S': {rotLat:25, rotLon:20, rotDeg:0},
        'AR': {rotLat:10, rotLon:25, rotDeg:0}
    },

    // ─── CARBONIFÈRE (-350 Ma) : Collision Laurentia-Baltica (Laurussia) ───
    '🌿350': {
        'LAU': {rotLat:10, rotLon:-20, rotDeg:40},
        'BAL': {rotLat:15, rotLon:-10, rotDeg:35}, // Baltica et Laurentia sont presque soudées
        'AF': {rotLat:-30, rotLon:10, rotDeg:20},  // Le Gondwana remonte vers le Nord
        'SA': {rotLat:-30, rotLon:0, rotDeg:15},
        'IN': {rotLat:-50, rotLon:30, rotDeg:30},
        'AN': {rotLat:-70, rotLon:0, rotDeg:0},
        'AU': {rotLat:-40, rotLon:60, rotDeg:20},
        'SIB': {rotLat:30, rotLon:80, rotDeg:110}, // Toujours isolée
        'EU_S': {rotLat:10, rotLon:40, rotDeg:0}, 'AR': {rotLat:0, rotLon:0, rotDeg:0}
    },

    // ─── ORDOVICIEN (-500 Ma) : Éclatement total ───
    // Le Gondwana est au pôle Sud, les autres sont des îles éparpillées
    '🌿500': {
        'AF': {rotLat:-90, rotLon:0, rotDeg:0},   // Pôle Sud
        'SA': {rotLat:-90, rotLon:0, rotDeg:0},   // Soudé au Gondwana
        'AN': {rotLat:-90, rotLon:0, rotDeg:0},   // Soudé au Gondwana
        'IN': {rotLat:-90, rotLon:0, rotDeg:0},   // Soudé au Gondwana
        'AU': {rotLat:-90, rotLon:0, rotDeg:0},   // Soudé au Gondwana
        'LAU': {rotLat:0, rotLon:160, rotDeg:100}, // Laurentia isolée à l'équateur (rotation 90+)
        'BAL': {rotLat:-40, rotLon:50, rotDeg:60}, // Baltica isolée dans l'hémisphère Sud
        'SIB': {rotLat:20, rotLon:140, rotDeg:180},// Sibérie isolée "tête en bas" au Nord
        'EU_S': {rotLat:10, rotLon:-60, rotDeg:0},
        'AR': {rotLat:-80, rotLon:10, rotDeg:0}
    }
};