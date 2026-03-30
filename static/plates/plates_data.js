// plates_data.js — Contours détaillés des plaques tectoniques
// Chaque plaque = polygone en [lat, lon] + hauteur de base (grayscale 0-1)
// hauteur : 0 = fond océanique, 0.5 = continent moyen, 0.7 = plateau élevé
// Les contours sont fermés (dernier point rejoint le premier)
// Coordonnées : lat [-90, 90], lon [-180, 180]
//
// Europe (EU) et Asie (AS) sont séparées : zones où les polygones se chevauchent donnent une altitude
// cumulée dans plate_renderer (somme des h — ex. Alpes EU+AS, collision himalayenne IN+AS).

window.PLATES = {

    'AF': {
        name: 'Afrique',
        height: 0.55,
        color: '#8B6914',
        vertices: [
            // Maroc / Détroit de Gibraltar
            [36, -6], [35, -1], [37, 1], [37, 8], [37, 10],
            // Tunisie / Libye
            [34, 10], [33, 12], [32, 13], [31, 17], [32, 20],
            [31, 25], [31, 30],
            // Égypte / Sinaï
            [30, 33], [28, 33], [22, 36],
            // Corne de l'Afrique
            [18, 38], [15, 40], [12, 44], [12, 48], [11, 51],
            [5, 47], [2, 45], [0, 42],
            // Côte Est (Kenya, Tanzanie, Mozambique)
            [-4, 40], [-8, 40], [-11, 40], [-15, 41],
            [-18, 37], [-22, 35], [-25, 35],
            // Afrique du Sud
            [-28, 33], [-31, 30], [-33, 28], [-34, 26],
            [-35, 20], [-34, 18],
            // Cap de Bonne-Espérance → côte ouest
            [-33, 18], [-31, 17], [-28, 15], [-23, 14],
            [-17, 12], [-12, 14], [-9, 13],
            // Golfe de Guinée
            [-6, 12], [-4, 10], [0, 10], [4, 2], [4, 5],
            [5, 1], [6, 1],
            // Nigeria → Cameroun
            [4, 3], [5, 6], [4, 8], [4, 10],
            // Côte ouest remontée
            [5, -4], [5, -8], [7, -12],
            [10, -15], [12, -16], [15, -17],
            // Sénégal / Mauritanie / Sahara Occidental
            [18, -16], [21, -17], [24, -15],
            [27, -13], [30, -10], [33, -8], [35, -5]
        ]
    },

    'EU': {
        name: 'Europe',
        height: 0.48,
        color: '#5D9C3A',
        vertices: [
            // Ibérie
            [36, -8], [37, -9], [43, -9], [44, -2],
            // France
            [46, -2], [47, -4], [48, -5], [49, -2],
            [51, 2],
            // Benelux / Allemagne
            [52, 4], [54, 8], [55, 10],
            // Danemark / Jutland
            [56, 9], [57, 10],
            // Scandinavie (Norvège → cap Nord)
            [58, 6], [60, 5], [62, 5], [64, 10], [66, 13],
            [68, 15], [70, 19], [71, 26],
            // Finlande / Kola
            [70, 30], [69, 33], [66, 33], [64, 28],
            [62, 24], [60, 25], [58, 20],
            // Baltique → Pologne → Ukraine
            [55, 18], [54, 18], [52, 14], [50, 14],
            [48, 17], [47, 20], [46, 22],
            // Balkans → Turquie occidentale (limite plaque Asie au Caucase)
            [44, 23], [42, 25], [41, 29], [41, 32], [42, 35],
            // Fermeture : mer Noire / Méditerranée orientale → Atlantique (sans traverser l’Asie)
            [44, 28], [42, 22], [40, 16], [39, 10], [38, 4],
            [37, -2], [36, -8]
        ]
    },

    'AS': {
        name: 'Asie',
        height: 0.50,
        color: '#3D8B6E',
        vertices: [
            // Bordure ouest (nord → Caucase) puis saillie vers les Alpes : chevauchement avec EU → surélévation type collision
            [72, 32], [70, 48], [64, 56], [56, 58], [50, 52],
            [52, 18], [50, 12], [48, 8], [46, 7], [45, 11],
            [46, 15], [48, 18], [50, 22], [48, 32], [45, 42],
            // Caucase → Caspienne
            [42, 44], [43, 48], [42, 52],
            // Asie centrale
            [40, 53], [38, 57], [37, 60], [35, 62],
            // Iran → Pakistan
            [33, 58], [30, 61], [28, 63], [25, 63],
            // Nord de l’Inde (bordure himalayenne — chevauchement avec IN)
            [28, 68], [28, 75], [28, 80], [27, 85], [28, 88],
            // Birmanie → Indochine
            [26, 90], [22, 97], [20, 100], [18, 100],
            [15, 100], [10, 105], [5, 103],
            [1, 104],
            // Malaisie / Sumatra
            [-2, 104], [-5, 105], [-7, 106], [-8, 112],
            [-7, 115], [-6, 120],
            // Philippines → Taiwan → Chine côte
            [10, 119], [15, 120], [22, 120], [25, 121],
            [30, 122], [32, 121],
            // Corée / Japon
            [35, 126], [37, 127], [35, 130], [34, 132],
            [36, 136], [40, 140],
            // Hokkaido → Sakhaline → Kamchatka
            [43, 145], [46, 143], [50, 143],
            [52, 143], [55, 155], [57, 160],
            [60, 163], [62, 165], [65, 170],
            // Tchoukotka
            [67, 175], [66, 180],
            // Côte nord sibérienne
            [72, 175], [74, 165], [73, 145], [72, 130],
            [71, 120], [70, 100],
            // Arctique sibérien
            [72, 80], [73, 70], [72, 55], [70, 50],
            [69, 45], [68, 40], [70, 35],
            // Retour Arctique vers bordure ouest
            [72, 53], [76, 60], [77, 68],
            [75, 55], [73, 45], [71, 38],
            [72, 32]
        ]
    },

    'NA': {
        name: 'Amérique du Nord',
        height: 0.50,
        color: '#CD853F',
        vertices: [
            // Alaska (côte sud)
            [60, -150], [58, -153], [57, -157],
            [56, -160], [55, -163], [57, -170],
            // Alaska nord
            [65, -168], [68, -165], [71, -157],
            [71, -150], [70, -142],
            // Yukon → Colombie-Britannique
            [68, -140], [64, -140], [60, -140],
            [58, -137], [55, -133], [52, -128],
            [50, -125], [48, -124],
            // Côte Pacifique US
            [46, -124], [43, -124], [40, -124],
            [38, -123], [35, -121], [33, -118],
            // Baja California / Mexique
            [30, -115], [28, -112], [25, -109],
            [23, -106], [20, -105], [18, -103],
            // Golfe du Mexique (sud)
            [16, -96], [15, -90], [16, -88],
            // Yucatán
            [18, -88], [20, -87], [21, -87],
            // Cuba / Bahamas (simplifié)
            [22, -84], [24, -80], [25, -78],
            // Floride
            [27, -80], [28, -81], [30, -82],
            // Côte Est US
            [32, -80], [34, -78], [36, -76],
            [37, -76], [39, -74], [40, -74],
            // New England → Maritimes
            [42, -70], [44, -67], [45, -64],
            [47, -60], [48, -56], [47, -53],
            // Terre-Neuve → Labrador
            [50, -56], [52, -56], [54, -58],
            [56, -60], [58, -63],
            // Baie d'Hudson (côte est)
            [60, -65], [62, -68], [63, -78],
            [60, -80], [58, -78], [56, -80],
            [55, -85],
            // Baie d'Hudson (sud → ouest)
            [52, -80], [51, -80], [52, -85],
            [55, -90], [58, -88],
            // Arctique central
            [62, -92], [65, -88], [68, -96],
            [70, -100], [72, -98],
            // Archipel arctique
            [74, -95], [76, -90], [78, -82],
            [80, -75], [82, -70], [83, -62],
            // Groenland (côte est) — simplifié comme partie NA
            [82, -50], [78, -20], [76, -18],
            [72, -22], [68, -30], [65, -38],
            [62, -42], [60, -44], [60, -50],
            // Baffin → retour Alaska
            [66, -62], [68, -72], [69, -80],
            [70, -100], [71, -120], [70, -140],
            [68, -150], [65, -153],
            [62, -152], [60, -150]
        ]
    },

    'SA': {
        name: 'Amérique du Sud',
        height: 0.50,
        color: '#DAA520',
        vertices: [
            // Venezuela / Colombie
            [12, -72], [11, -75], [10, -75],
            [8, -77], [7, -78],
            // Équateur / Pérou côte
            [2, -80], [0, -80], [-3, -80],
            [-5, -81], [-8, -80], [-12, -77],
            [-15, -75], [-18, -71],
            // Chili nord
            [-22, -70], [-24, -70], [-27, -71],
            // Chili central
            [-30, -72], [-33, -72], [-35, -72],
            [-37, -73], [-40, -73],
            // Chili sud / Patagonie côte Pacifique
            [-42, -74], [-44, -74], [-46, -75],
            [-48, -75], [-50, -74],
            // Terre de Feu
            [-52, -72], [-54, -70], [-55, -68],
            [-56, -66],
            // Pointe de l'Argentine
            [-55, -64], [-54, -64],
            // Patagonie côte Atlantique
            [-52, -66], [-50, -66], [-48, -66],
            [-46, -66], [-44, -65],
            // Argentine / Uruguay côte
            [-42, -63], [-40, -62], [-38, -58],
            [-36, -57], [-35, -55], [-33, -53],
            // Brésil sud
            [-30, -50], [-28, -48], [-25, -47],
            [-24, -46], [-23, -43],
            // Brésil est (Rio → Salvador)
            [-22, -41], [-20, -40], [-18, -39],
            [-15, -39], [-13, -38], [-10, -36],
            // Nordeste (Recife → Natal)
            [-8, -35], [-6, -35], [-5, -36],
            // Amazone / Guyane
            [-2, -42], [0, -50], [2, -52],
            [4, -52], [6, -58], [7, -60],
            // Venezuela côte
            [8, -63], [10, -65], [11, -68],
            [12, -71]
        ]
    },

    'AN': {
        name: 'Antarctique',
        height: 0.45,
        color: '#C8C8C8',
        vertices: [
            // Tour complet du continent
            [-65, -60], [-66, -50], [-67, -40],
            [-68, -30], [-69, -20], [-70, -10],
            [-70, 0], [-69, 10], [-68, 20],
            [-68, 30], [-67, 40], [-67, 50],
            [-67, 60], [-67, 70], [-67, 80],
            [-68, 90], [-69, 100], [-70, 110],
            [-70, 120], [-71, 130], [-72, 140],
            [-73, 150], [-75, 160], [-77, 170],
            [-78, 180],
            // Retour par les longitudes négatives
            [-77, -170], [-76, -160], [-75, -150],
            [-74, -140], [-73, -130], [-72, -120],
            [-72, -110], [-71, -100], [-71, -90],
            [-70, -80], [-68, -70]
        ]
    },

    'AU': {
        name: 'Australie',
        height: 0.48,
        color: '#D2691E',
        vertices: [
            // Côte nord (Darwin → Cape York)
            [-12, 130], [-12, 132], [-11, 132],
            [-13, 136], [-14, 136], [-16, 140],
            [-14, 142], [-12, 142], [-11, 143],
            [-13, 145],
            // Cape York → côte est
            [-15, 145], [-17, 146], [-19, 147],
            [-21, 149], [-23, 150], [-25, 153],
            [-27, 153], [-28, 154],
            // Sydney → Melbourne
            [-30, 153], [-32, 152], [-34, 151],
            [-36, 150], [-37, 150],
            // Victoria → Adelaide
            [-38, 146], [-38, 145], [-38, 141],
            [-37, 140], [-36, 138], [-35, 137],
            // Golfe Spencer → Grande Baie Australienne
            [-34, 136], [-33, 134], [-33, 132],
            [-32, 128], [-33, 124], [-34, 120],
            [-34, 118], [-35, 116],
            // Perth → côte ouest
            [-33, 115], [-31, 115], [-28, 114],
            [-25, 113], [-23, 114], [-21, 116],
            // Côte nord-ouest
            [-19, 118], [-17, 122], [-16, 124],
            [-15, 126], [-14, 127], [-13, 129]
        ]
    },

    'IN': {
        name: 'Inde',
        height: 0.55,
        color: '#BDB76B',
        vertices: [
            // Frontière nord-ouest (Pakistan)
            [30, 68], [28, 66], [25, 63],
            [24, 68], [23, 70],
            // Gujarat
            [22, 69], [21, 70], [20, 72],
            // Côte ouest (Goa, Kerala)
            [18, 73], [15, 74], [12, 75],
            [10, 76], [8, 77],
            // Pointe sud (Sri Lanka inclus simplifié)
            [7, 78], [6, 80], [8, 80],
            // Côte est (Tamil Nadu, Andhra)
            [10, 80], [13, 80], [15, 80],
            [17, 82], [19, 84],
            // Orissa → Bengale
            [20, 86], [22, 88], [23, 89],
            // Bangladesh → frontière birmane
            [24, 90], [26, 90],
            // Frontière nord (Himalaya)
            [28, 88], [28, 84], [28, 80],
            [28, 77], [30, 75], [30, 72]
        ]
    },

    'AR': {
        name: 'Arabie',
        height: 0.50,
        color: '#C2B280',
        vertices: [
            // Sinaï
            [30, 33], [29, 33], [28, 34],
            // Mer Rouge côte ouest
            [26, 36], [22, 37], [18, 40],
            [15, 42], [13, 43],
            // Yémen → Oman
            [13, 45], [14, 48], [16, 52],
            [18, 54], [20, 56], [22, 59],
            // Golfe Persique
            [24, 58], [26, 56], [27, 51],
            [28, 50], [30, 50],
            // Koweït → Irak
            [30, 48], [31, 46], [32, 44],
            // Jordanie → retour
            [32, 39], [32, 36], [31, 35]
        ]
    }
};

// PLATE_POSITIONS déplacé dans plate_positions.js
window.PLATE_POSITIONS = window.PLATE_POSITIONS || {
    // ─── Moderne ───
    '📱': {
        'AF': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'EU': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'AS': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'NA': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'SA': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'AN': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'AU': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'IN': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'AR': { rotLat: 0, rotLon: 0, rotDeg: 0 }
    },

    // ─── Glaciation -2 Ma : quasi-moderne ───
    '❄️': {
        'AF': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'EU': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'AS': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'NA': { rotLat: 0, rotLon: 1, rotDeg: 1 },
        'SA': { rotLat: 0, rotLon: 0, rotDeg: 1 },
        'AN': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'AU': { rotLat: 1, rotLon: -1, rotDeg: 1 },
        'IN': { rotLat: 0, rotLon: 0, rotDeg: 1 },
        'AR': { rotLat: 0, rotLon: 0, rotDeg: 0 }
    },

    // ─── Grande Coupure -33 Ma ───
    '🏔': {
        'AF': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'EU': { rotLat: 2, rotLon: 2, rotDeg: 1 },
        'AS': { rotLat: 2, rotLon: 2, rotDeg: 1 },
        'NA': { rotLat: 2, rotLon: 3, rotDeg: 2 },
        'SA': { rotLat: 0, rotLon: 0, rotDeg: 3 },
        'AN': { rotLat: 1, rotLon: 0, rotDeg: 1 },
        'AU': { rotLat: 4, rotLon: -4, rotDeg: 5 },
        'IN': { rotLat: 2, rotLon: -2, rotDeg: 6 },
        'AR': { rotLat: 0, rotLon: 0, rotDeg: 0 }
    },

    // ─── Prélude glaciaire -35 Ma ───
    '⛰': {
        'AF': { rotLat: 0, rotLon: 0, rotDeg: 0 },
        'EU': { rotLat: 2, rotLon: 2, rotDeg: 2 },
        'AS': { rotLat: 2, rotLon: 2, rotDeg: 2 },
        'NA': { rotLat: 2, rotLon: 3, rotDeg: 3 },
        'SA': { rotLat: 0, rotLon: 0, rotDeg: 4 },
        'AN': { rotLat: 2, rotLon: 0, rotDeg: 2 },
        'AU': { rotLat: 5, rotLon: -5, rotDeg: 6 },
        'IN': { rotLat: 3, rotLon: -3, rotDeg: 8 },
        'AR': { rotLat: 0, rotLon: 1, rotDeg: 0 }
    },

    // ─── PETM -50 Ma : Terre étouffe ───
    '🐊': {
        'AF': { rotLat: 0,  rotLon: 0,  rotDeg: 0 },
        'EU': { rotLat: 3,  rotLon: 3,  rotDeg: 3 },
        'AS': { rotLat: 3,  rotLon: 3,  rotDeg: 3 },
        'NA': { rotLat: 3,  rotLon: 5,  rotDeg: 6 },
        'SA': { rotLat: 0,  rotLon: 0,  rotDeg: 8 },
        'AN': { rotLat: 5,  rotLon: 0,  rotDeg: 4 },
        'AU': { rotLat: 10, rotLon: -10, rotDeg: 12 },
        'IN': { rotLat: 5,  rotLon: -5, rotDeg: 15 },
        'AR': { rotLat: 0,  rotLon: 2,  rotDeg: 1 }
    },

    // ─── Fin Crétacé -66 Ma ───
    '🦣': {
        'AF': { rotLat: 0,  rotLon: 0,   rotDeg: 0 },
        'EU': { rotLat: 5,  rotLon: 5,   rotDeg: 5 },
        'AS': { rotLat: 5,  rotLon: 5,   rotDeg: 5 },
        'NA': { rotLat: 5,  rotLon: 10,  rotDeg: 10 },
        'SA': { rotLat: 0,  rotLon: 0,   rotDeg: 15 },
        'AN': { rotLat: 10, rotLon: 0,   rotDeg: 8 },
        'AU': { rotLat: 15, rotLon: -20, rotDeg: 20 },
        'IN': { rotLat: 10, rotLon: -10, rotDeg: 25 },
        'AR': { rotLat: 0,  rotLon: 5,   rotDeg: 2 }
    },

    // ─── Jurassique -150 Ma : Pangée se fragmente ───
    '🦕150': {
        'AF': { rotLat: 0,  rotLon: 0,   rotDeg: 2 },
        'EU': { rotLat: 10, rotLon: 0,   rotDeg: 10 },
        'AS': { rotLat: 10, rotLon: 0,   rotDeg: 10 },
        'NA': { rotLat: 10, rotLon: 0,   rotDeg: 20 },
        'SA': { rotLat: 0,  rotLon: 0,   rotDeg: 30 },
        'AN': { rotLat: 20, rotLon: 0,   rotDeg: 15 },
        'AU': { rotLat: 20, rotLon: -30, rotDeg: 30 },
        'IN': { rotLat: 20, rotLon: -20, rotDeg: 40 },
        'AR': { rotLat: 0,  rotLon: 5,   rotDeg: 4 }
    },

    // ─── Trias -250 Ma : Pangée complète ───
    '🦕250': {
        'AF': { rotLat: 0,  rotLon: 0,   rotDeg: 5 },
        'EU': { rotLat: 10, rotLon: 0,   rotDeg: 15 },
        'AS': { rotLat: 10, rotLon: 0,   rotDeg: 15 },
        'NA': { rotLat: 10, rotLon: 0,   rotDeg: 35 },
        'SA': { rotLat: 0,  rotLon: 0,   rotDeg: 50 },
        'AN': { rotLat: 20, rotLon: 0,   rotDeg: 25 },
        'AU': { rotLat: 30, rotLon: -30, rotDeg: 45 },
        'IN': { rotLat: 30, rotLon: -20, rotDeg: 60 },
        'AR': { rotLat: 0,  rotLon: 5,   rotDeg: 8 }
    },

    // ─── Carbonifère -350 Ma : Euramerica + Gondwana ───
    '🌿350': {
        'AF': { rotLat: -10, rotLon: 0,   rotDeg: 20 },
        'EU': { rotLat: 30,  rotLon: 10,  rotDeg: -30 },
        'AS': { rotLat: 30,  rotLon: 10,  rotDeg: -30 },
        'NA': { rotLat: 30,  rotLon: -20, rotDeg: -25 },
        'SA': { rotLat: -5,  rotLon: 30,  rotDeg: 25 },
        'AN': { rotLat: -20, rotLon: 10,  rotDeg: 15 },
        'AU': { rotLat: -15, rotLon: 20,  rotDeg: 30 },
        'IN': { rotLat: -20, rotLon: 20,  rotDeg: 40 },
        'AR': { rotLat: -10, rotLon: 10,  rotDeg: 20 }
    },

    // ─── Ordovicien -500 Ma : Gondwana + Laurentia + Baltica séparés ───
    '🌿500': {
        'AF': { rotLat: -20, rotLon: -10, rotDeg: 40 },
        'EU': { rotLat: 30,  rotLon: 30,  rotDeg: -60 },
        'AS': { rotLat: 30,  rotLon: 30,  rotDeg: -60 },
        'NA': { rotLat: 45,  rotLon: -60, rotDeg: -50 },
        'SA': { rotLat: -10, rotLon: 20,  rotDeg: 30 },
        'AN': { rotLat: -30, rotLon: 0,   rotDeg: 20 },
        'AU': { rotLat: -20, rotLon: 30,  rotDeg: 40 },
        'IN': { rotLat: -30, rotLon: 20,  rotDeg: 50 },
        'AR': { rotLat: -20, rotLon: 10,  rotDeg: 35 }
    }
};
