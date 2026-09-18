// File: CO2/static/texts/epochs_alt2sec.js - Récits alt2sec des époques et des événements
// Desc: En français, dans l'architecture, je suis le TEXTE (histoire de la Terre) affiché en bulle longue (~2 s)
//       sur les boutons d'époque de la frise et sur les boutons d'événement.
// Version 1.0.0
// Date: [September 18, 2026]
// logs :
//   - v1.0.0: création. Récits des 19 époques + événements ; les CHIFFRES ne sont pas écrits ici :
//     buildEpochAlt2sec() les lit à l'affichage dans BENCH_LIT_BY_EPOCH_ID (fourchettes littérature),
//     TIMELINE (valeurs appliquées) et DATA (dernier calcul). Une seule source par nombre, jamais désynchronisée.
//     Reprise du texte 'hysteresis 1a' qui vivait dans alphabet.js (données de l'alphabet, pas sa place).
// Copyright 2026 DNAvatar.org - Arnaud Maignan
// Licensed under Apache License 2.0 with Commons Clause.
// See https://commonsclause.com/ for full terms.

// Contrat : script classique (pas de module ES), chargé avant organigramme.js (addCustomTooltip lit window.EPOCH_ALT2SEC).

/** Récit par id d'époque (clé 📅 de TIMELINE). Texte brut, \n = saut de ligne (tooltips.js convertit en <br>). */
const EPOCH_STORY = {
    '⚫':
        'Corps noir — la Terre sans atmosphère\n\n' +
        'Point de départ du raisonnement, pas une époque géologique : une bille de roche éclairée par le Soleil, ' +
        'sans air, sans eau, sans nuages. Elle rayonne ce qu\'elle reçoit.\n\n' +
        'C\'est la référence qui donne tout son sens à la suite : chaque degré au-dessus de cette valeur est le fait ' +
        'de l\'atmosphère. Sans elle, la surface serait à −18 °C.',

    '🔥':
        'Hadéen — l\'océan de magma (4,5 → 4,0 Ga)\n\n' +
        'Juste après l\'impact qui forme la Lune. La surface est de la roche fondue, le flux de chaleur interne ' +
        'dépasse 2 MW/m² : c\'est lui, et non le Soleil, qui fixe la température.\n\n' +
        'Une « température moyenne » n\'a ici pas grand sens (surface incandescente, écarts énormes) : c\'est la ' +
        'COMPOSITION qui est contrainte par la littérature — atmosphère de vapeur et de CO₂ de plusieurs dizaines de bars.\n\n' +
        'Les météorites de glace ☄️ apportent l\'eau ; le refroidissement par rayonnement fait le reste, très vite ' +
        'à l\'échelle géologique.',

    '🦠':
        'Archéen — le paradoxe du Soleil faible (4,0 → 2,5 Ga)\n\n' +
        'Le Soleil ne rayonne que ~74 % de sa puissance actuelle. Sans effet de serre, la Terre serait gelée ; ' +
        'or les roches indiquent de l\'eau liquide, et la vie apparaît.\n\n' +
        'La sortie du paradoxe passe par une atmosphère très chargée en CO₂ et en méthane, sans oxygène. ' +
        'Le méthane reste sous le seuil de la brume organique (CH₄/CO₂ < 0,1) qui, elle, refroidirait.\n\n' +
        'Obliquité possiblement forte (45°), ce qui réchauffe les hautes latitudes.',

    '🪸':
        'Protérozoïque — l\'oxygène arrive (2,5 Ga → 750 Ma)\n\n' +
        'La photosynthèse oxygénique transforme l\'atmosphère (Grande Oxydation). L\'oxygène détruit le méthane : ' +
        'l\'un des gaz à effet de serre disparaît largement, le CO₂ reste le pilier.\n\n' +
        'Eucaryotes puis multicellularité. La planète s\'approche lentement des conditions où la bascule glaciaire ' +
        'devient possible : c\'est ce qui va se jouer juste après, au Sturtien.',

    'hysteresis 1a':
        'Surfusion climatique — entrée Sturtienne (≈ 750 Ma)\n\n' +
        'Comme en surfusion, le climat peut rester bloqué dans un état (ici chaud, pré-Sturtien) alors que les ' +
        'forçages — CO₂ en baisse, albédo — orientent déjà vers la glaciation.\n\n' +
        'Hystérésis : le système garde une mémoire de son chemin. Il faut souvent un forçage fort ou un choc pour ' +
        'sortir du puits actuel et franchir le seuil (bascule Snowball).\n\n' +
        'Ce n\'est pas l\'équilibre instantané : tant que la bascule n\'est pas passée, l\'état métastable tient — ' +
        'résistance au changement, pas absence de forçage.',

    '⛄':
        'Plein Snowball — la Terre boule de neige (≈ 720 Ma)\n\n' +
        'La bascule a eu lieu : la glace atteint les tropiques, l\'albédo dépasse 0,75, la planète se referme sur ' +
        'elle-même. Le refroidissement s\'auto-entretient — chaque mètre de glace en plus renvoie plus de lumière.\n\n' +
        'Sortir de cet état ne se fait pas en remettant le CO₂ d\'avant : il en faut BEAUCOUP plus. C\'est toute ' +
        'l\'hystérésis, et c\'est la partie la plus sensible du calage du modèle.\n\n' +
        'La glace coupe l\'altération des silicates : le CO₂ volcanique s\'accumule pendant des millions d\'années, ' +
        'jusqu\'au seuil de sortie.',

    'hysteresis 1b':
        'Sortie Marinoenne — la déglaciation brutale (≈ 690 Ma)\n\n' +
        'Le CO₂ accumulé sous la glace finit par franchir le seuil : l\'albédo s\'effondre, la planète passe en ' +
        'quelques milliers d\'années d\'un désert glacé à une serre extrême.\n\n' +
        'La glace sale (poussières, cendres) aide la sortie en abaissant l\'albédo avant même la fonte. ' +
        'Les carbonates de couverture, déposés juste après, sont la trace de cette serre.\n\n' +
        'Le même CO₂ ne donne pas la même température selon qu\'on arrive par le chaud ou par le froid : ' +
        'c\'est la signature d\'une hystérésis, pas d\'un simple thermostat.',

    '🪼':
        'Paléozoïque marin — explosion cambrienne (600 → 420 Ma)\n\n' +
        'La vie complexe se diversifie dans l\'océan. Le climat est chaud et stable, le CO₂ reste élevé ' +
        'alors que le Soleil, lui, continue de gagner en puissance.\n\n' +
        'Les continents sont encore nus : pas de racines, donc une altération des roches lente, et un ' +
        'thermostat carbone moins réactif qu\'aujourd\'hui.',

    '🍄':
        'Paléozoïque terrestre — la conquête des terres (420 → 280 Ma)\n\n' +
        'Les plantes colonisent les continents, puis viennent les forêts du Dévonien et du Carbonifère. ' +
        'Deux conséquences climatiques majeures :\n\n' +
        '— les racines accélèrent l\'altération des silicates, qui consomme du CO₂ ;\n' +
        '— le carbone s\'enfouit massivement (c\'est le charbon d\'aujourd\'hui).\n\n' +
        'Le CO₂ chute, la planète se refroidit, et une glaciation s\'installe (Karoo). ' +
        'La biosphère devient un acteur du climat, pas seulement un passager.',

    '💀':
        'Extinction permienne — la grande crise (280 → 250 Ma)\n\n' +
        'Les trapps de Sibérie injectent d\'énormes quantités de CO₂ et de soufre. Réchauffement rapide, ' +
        'océans anoxiques, acidification : environ 90 % des espèces marines disparaissent.\n\n' +
        'C\'est la plus grande extinction connue — d\'où le nom, plus parlant que « limite P/T ». ' +
        'Le soufre refroidit quelques années, le CO₂ réchauffe pour des dizaines de milliers d\'années : ' +
        'deux échelles de temps opposées, un seul événement.',

    '🦕':
        'Mésozoïque — le monde des dinosaures (252 → 66 Ma)\n\n' +
        'Climat chaud et remarquablement stable, sans calotte polaire permanente : des forêts poussent ' +
        'jusqu\'aux hautes latitudes.\n\n' +
        'Le gradient équateur-pôle est plus faible qu\'aujourd\'hui, ce que le modèle représente par des ' +
        'écarts de température par zone plus serrés. La crise K-Pg (astéroïde, 66 Ma) clôt la période.',

    '🦤':
        'Cénozoïque — après l\'astéroïde (66 → 50 Ma)\n\n' +
        'Les mammifères se diversifient dans un monde encore chaud. Le CO₂ reste haut, ' +
        'les pôles sont libres de glace.\n\n' +
        'C\'est le début de la longue descente qui mènera, 60 millions d\'années plus tard, ' +
        'aux glaciations quaternaires.',

    '🐊':
        'Éocène — le pic de chaleur (50 → 35 Ma)\n\n' +
        'Le monde le plus chaud du Cénozoïque : des crocodiliens vivent dans l\'Arctique, aucune calotte ' +
        'permanente. CO₂ élevé, méthane abondant (zones humides).\n\n' +
        'Puis la surrection de l\'Himalaya expose des roches fraîches à l\'altération : le thermostat carbone ' +
        's\'emballe dans l\'autre sens et pompe le CO₂ pendant des millions d\'années.',

    'hysteresis 2':
        'Prélude glaciaire — Éocène-Oligocène (≈ 35 Ma)\n\n' +
        'Le CO₂ approche du seuil qui permet à une calotte de tenir sur l\'Antarctique. Comme au Sturtien, ' +
        'le système peut rester « en retard » sur son forçage : le franchissement est brutal, pas progressif.\n\n' +
        'Une fois la calotte installée, il faudra bien plus de CO₂ pour la faire disparaître que pour l\'empêcher ' +
        'de se former : deuxième grande hystérésis de l\'histoire de la Terre.',

    '🏔':
        'Grande Coupure — la calotte antarctique (≈ 33 Ma)\n\n' +
        'La bascule a eu lieu : l\'Antarctique se couvre de glace, le niveau des mers chute, ' +
        'les faunes européennes sont renouvelées (d\'où le nom donné par les paléontologues).\n\n' +
        'La Terre entre dans son mode « avec calottes », celui qu\'elle n\'a plus quitté depuis. ' +
        'C\'est ce qui rend possibles les cycles glaciaires qui suivront.',

    '🦣':
        'Quaternaire — les cycles glaciaires (2 Ma → 10 ka)\n\n' +
        'Avec des calottes en place, le climat devient INSTABLE : deux états coexistent pour une même ' +
        'composition d\'atmosphère. Dans le modèle, 0,02 ppm de méthane suffisent à faire passer de 12 °C à 9,5 °C.\n\n' +
        'Ce n\'est pas un défaut : c\'est la signature du seuil glace-albédo, et c\'est exactement ce que montrent ' +
        'les carottes de glace (EPICA) — le CO₂ oscille entre 180 ppm en période glaciaire et 280 ppm entre deux glaciations.\n\n' +
        'Le déclencheur est astronomique : l\'obliquité de l\'axe terrestre varie de 22,1° à 24,5° tous les 41 000 ans. ' +
        'Une faible obliquité refroidit les étés polaires, la neige survit à l\'été, la glace gagne. ' +
        'C\'est la seule époque où les cycles de Milankovitch changent vraiment le résultat.',

    '🛖':
        'Holocène — le climat de l\'agriculture (10 ka → 1800)\n\n' +
        'Onze mille ans d\'une stabilité remarquable : environ 280 ppm de CO₂, une température qui varie de moins ' +
        'd\'un degré. Toutes les civilisations humaines tiennent dans cette fenêtre.\n\n' +
        'La glaciation suivante devrait arriver, mais l\'obliquité est aujourd\'hui dans une phase peu favorable, ' +
        'et le CO₂ a pris une tout autre direction.',

    '🚂':
        'Ère industrielle — le début du signal (1800 → 2000)\n\n' +
        'Charbon, puis pétrole : le carbone enfoui au Carbonifère est renvoyé dans l\'atmosphère en deux siècles. ' +
        'Le CO₂ passe d\'environ 280 à 370 ppm.\n\n' +
        'C\'est la première fois dans cette frise qu\'un forçage vient d\'ailleurs que de la géologie, ' +
        'de l\'astronomie ou de la biosphère.',

    '📱':
        'Aujourd\'hui — de 2000 à 2100 (à vous de jouer)\n\n' +
        'Point de départ : l\'an 2000, mesuré à 369 ppm. Chaque clic ⛽ ou 🛢 ajoute les émissions d\'une tranche ' +
        'de 25 ans et calcule ce que ça donne — c\'est tout l\'objet de l\'application.\n\n' +
        'Le CO₂ émis n\'est pas entièrement dans l\'air : l\'océan en dissout une partie (loi de Henry, freinée par ' +
        'la chimie des carbonates) et les forêts en stockent une autre (elles poussent plus vite quand il y a plus ' +
        'de CO₂). Les deux puits saturent progressivement.\n\n' +
        'Aucun chiffre n\'est calé sur une projection : ce que vous lisez sort des équations.'
};

/** Récit par événement, clé [id époque][emoji bouton]. Optionnel — absent = pas de bulle longue. */
const EVENT_STORY = {
    '🔥': {
        '☄️': 'Météorite de glace\n\nLe bombardement tardif apporte de l\'eau à une planète encore brûlante. ' +
              'Chaque impact ajoute de la masse d\'eau et fait avancer le temps : l\'océan se constitue par livraisons successives.',
        '💫': 'Refroidissement\n\nLe flux géothermique s\'effondre à mesure que la croûte se forme et que la planète rayonne. ' +
              'C\'est le seul moteur ici : le Soleil, encore faible, ne fait presque rien.'
    },
    '🦣': {
        '💫': 'Un pas dans les cycles glaciaires\n\nÀ cette époque, l\'obliquité de l\'axe terrestre oscille entre 22,1° et 24,5° ' +
              'tous les 41 000 ans, et le CO₂ suit entre 180 et 280 ppm (carottes EPICA).\n\n' +
              'Attention à ce que vous allez voir : pour une même composition, deux températures sont possibles. ' +
              'Le passage de l\'une à l\'autre est brutal — c\'est le seuil glace-albédo, pas un réglage du modèle.'
    },
    '📱': {
        '⛽': 'Émissions d\'une tranche de 25 ans\n\nLe CO₂ ajouté ne reste pas entièrement dans l\'air : ' +
              'l\'océan en dissout environ un quart (loi de Henry, freinée par le facteur de Revelle qui augmente avec le CO₂) ' +
              'et les forêts en stockent environ un quart (elles poussent plus vite avec plus de CO₂, effet qui sature en logarithme).\n\n' +
              'Les paramètres viennent de mesures (Global Carbon Budget, expériences FACE), jamais de projections.',
        '🛢': 'Émissions doublées sur 25 ans\n\nMême mécanique que ⛽, avec un rythme d\'émissions deux fois plus fort. ' +
              'Les puits océan et forêts ne suivent pas proportionnellement : ils saturent, donc la part qui reste dans l\'air augmente.'
    }
};

// ── Composition du texte final : récit + chiffres lus à la source ────────────────────────────
// Les nombres ne sont JAMAIS recopiés ici : fourchettes = BENCH_LIT_BY_EPOCH_ID (configTimeline.js),
// valeurs appliquées = TIMELINE (config de l'époque), résultat = DATA (dernier calcul).

function fmtRange(range, unit) {
    if (!Array.isArray(range) || range.length !== 2) return null;
    const f = (v) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('fr-FR') : String(v));
    return f(range[0]) + '–' + f(range[1]) + (unit ? ' ' + unit : '');
}

function epochRowById(epochId) {
    if (!window.TIMELINE) return null;
    return window.TIMELINE.find(function (row) { return row && row['📅'] === epochId; }) || null;
}

/** Bloc « littérature » d'une époque (fourchettes du banc) — null si l'époque n'a pas de repère. */
function litBlock(epochId) {
    const lit = window.BENCH_LIT_BY_EPOCH_ID ? window.BENCH_LIT_BY_EPOCH_ID[epochId] : null;
    if (!lit) return null;
    const lines = [];
    const t = fmtRange(lit.tC, '°C');
    const co2 = fmtRange(lit.co2, 'ppm');
    const ch4 = fmtRange(lit.ch4, 'ppm');
    if (t) lines.push('T ' + t);
    if (co2) lines.push('CO₂ ' + co2);
    if (ch4) lines.push('CH₄ ' + ch4);
    return lines.length ? 'Littérature : ' + lines.join(' · ') : null;
}

/** Bloc « appliqué » : graine de température de la config + CO₂ calculé au dernier run si c'est l'époque courante. */
function appliedBlock(epochId) {
    const row = epochRowById(epochId);
    if (!row) return null;
    const lines = [];
    if (Number.isFinite(Number(row['🌡️🧮']))) {
        lines.push('graine ' + (Number(row['🌡️🧮']) - 273.15).toFixed(1) + ' °C');
    }
    const DATA = window.DATA;
    const isCurrent = DATA && DATA['📜'] && DATA['📜']['🗿'] === epochId;
    if (isCurrent && DATA['🫧'] && Number.isFinite(Number(DATA['🫧']['🍰🫧🏭']))) {
        const ppm = DATA['🫧']['🍰🫧🏭'] * 1e6 * DATA['🫧']['🧪'] / window.CONST.M_CO2;
        lines.push('CO₂ calculé ' + Math.round(ppm).toLocaleString('fr-FR') + ' ppm');
        if (DATA['🧮'] && Number.isFinite(Number(DATA['🧮']['🧮🌡️']))) {
            lines.push('T calculée ' + (DATA['🧮']['🧮🌡️'] - 273.15).toFixed(1) + ' °C');
        }
    }
    return lines.length ? 'Appliqué : ' + lines.join(' · ') : null;
}

/** Texte alt2sec complet d'une époque : récit + littérature + valeurs appliquées. */
function buildEpochAlt2sec(epochId) {
    const story = EPOCH_STORY[epochId];
    if (!story) return undefined;
    const blocks = [story];
    const lit = litBlock(epochId);
    const applied = appliedBlock(epochId);
    if (lit) blocks.push(lit);
    if (applied) blocks.push(applied);
    return blocks.join('\n\n');
}

/** Texte alt2sec d'un bouton d'événement (récit seul). */
function buildEventAlt2sec(epochId, eventKey) {
    const byEpoch = EVENT_STORY[epochId];
    return byEpoch ? byEpoch[eventKey] : undefined;
}

// window.EPOCH_ALT2SEC[id] : lu tel quel par organigramme.js addCustomTooltip.
// Proxy → le texte est composé À LA LECTURE, donc les chiffres sont toujours ceux du dernier calcul.
window.EPOCH_ALT2SEC = new Proxy({}, {
    get: function (_t, key) { return typeof key === 'string' ? buildEpochAlt2sec(key) : undefined; },
    has: function (_t, key) { return typeof key === 'string' && EPOCH_STORY[key] !== undefined; }
});
window.EPOCH_STORY = EPOCH_STORY;
window.EVENT_STORY = EVENT_STORY;
window.buildEpochAlt2sec = buildEpochAlt2sec;
window.buildEventAlt2sec = buildEventAlt2sec;
