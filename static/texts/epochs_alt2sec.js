// File: CO2/static/texts/epochs_alt2sec.js - Récits alt2sec des époques et des événements
// Desc: En français, dans l'architecture, je suis le TEXTE (histoire de la Terre) affiché en bulle longue (~2 s)
//       sur les boutons d'époque de la frise et sur les boutons d'événement.
// Version 1.1.1
// Date: [September 18, 2026]
// logs :
//   - v1.1.1: 🍄 — 4 récits (l'époque passe à 4 clics de 35 Ma, configTimeline v1.4.88) : le drawdown
//     Dévonien-Carbonifère, la bascule du Karoo au 3e clic (−10 °C, glace 14 → 28 %), la remontée permienne.
//   - v1.1.0: EVENT_STORY entièrement réécrit — un récit PAR CLIC (tableaux) et non par époque, et chaque
//     récit dit ce que le clic VA faire, pas ce que l'époque EST. Calé sur un relevé T/CO₂/CH₄/albédo
//     avant-après de chaque clic (banc epoch_bench headless, api.run par tic) : plusieurs textes annonçaient
//     l'inverse du calcul — 🦠 « stable » alors que ça monte de +3 puis +2 °C, 🪸 « vers la glaciation » alors
//     que le 1er clic réchauffe de +2 °C, 🦤 « le CO₂ décroît » alors qu'il double vers l'optimum éocène,
//     🍄 « le climat se refroidit » alors que le pas saute au Permien et réchauffe de +7 °C.
//     eventClickIndex : l'index du récit suit le compteur DE L'ÉVÉNEMENT (📿☄️ pour ☄️, 📿💫 pour les tics),
//     sinon sur ⚫ la 2e météorite racontait le mauvais texte après un clic de temps.
//   - v1.0.4: 🦣 — 4e récit 💫 (le clic qui sort du Quaternaire) : la suite avait 3 textes pour 4 clics,
//     le dernier clic rejouait donc le texte du 3e.
//   - v1.0.3: bulles d'événement — valeurs inchangées masquées ; dernier clic d'une époque : annonce l'époque suivante.
//   - v1.0.2: récits d'événements pour TOUTES les époques (dont ⛄ : 💫 = le voile est retombé, 🌋 = accumulation du CO₂ volcanique) ;
//     EVENT_STORY accepte un tableau indexé par clic (états 🕰.🔁 du Quaternaire). La config ne porte que des nombres.
//   - v1.0.1: buildEventAlt2sec — composition depuis la CONFIG : ce qui change (masses/obliquité/deltas), pourquoi (📝 de l'état 🕰.🔁 ou récit), effet attendu.
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
        'Le CO₂ chute, la planète se refroidit, et une glaciation s\'installe (Karoo) : quatre clics ' +
        'traversent l\'époque, et c\'est le troisième qui fait basculer. La biosphère devient un acteur ' +
        'du climat, pas seulement un passager.',

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

/**
 * Récit par événement : EVENT_STORY[id époque][emoji bouton].
 * Valeur = texte, OU tableau de textes quand l'époque a des états 🕰.🔁 (index = numéro du clic à venir).
 * Ici le POURQUOI seulement : les chiffres (ce qui change) sont lus dans la config par buildEventAlt2sec().
 */
const EVENT_STORY = {
    '⚫': {
        '☄️': [
            'Météorite de glace — ce clic va REFROIDIR\n\n' +
              'La cargaison arrive gelée et se pose sur une roche noire qui absorbait tout. L\'albédo passe de 0 à quelques pour cent : une part du Soleil est désormais renvoyée sans avoir chauffé quoi que ce soit.\n\n' +
              'Et cette eau-là ne fait aucun effet de serre pour compenser : sans atmosphère, elle reste de la glace. Moins d\'énergie absorbée, donc une surface plus froide au prochain équilibre — de l\'ordre de deux degrés.',

            'Deuxième cargaison — encore plus froid\n\n' +
              'La couverture de glace s\'étend, l\'albédo double à peu près, la Terre nue renvoie d\'autant plus. C\'est la boucle glace-albédo à l\'état pur, sans air ni nuages pour l\'amortir.\n\n' +
              'Retenez le signe : ici l\'eau refroidit. Ce n\'est qu\'avec une atmosphère, et sous forme de vapeur, qu\'elle deviendra le premier gaz à effet de serre de la planète.'
        ],
        '💫': [
            'Le temps passe — seul le Soleil travaille\n\n' +
              'Rien d\'autre ne bouge ici : pas d\'air, pas de volcans, pas de vie. La seule chose qui change en 100 Ma, c\'est la luminosité solaire, qui monte lentement (Gough 1981).\n\n' +
              'Attendez-vous donc à quelques DIXIÈMES de degré en plus — minuscule à côté des deux degrés que coûte une météorite de glace.',

            'Encore 100 Ma — même mécanisme\n\n' +
              'Toujours le seul Soleil. Comparez les deux boutons : la date réchauffe à peine, la glace refroidit franchement. C\'est l\'albédo qui pilote le Corps noir, pas l\'âge de l\'Univers.'
        ],
        '🎇':
            'Impact majeur — ce clic change de monde\n\n' +
              'Un corps de la taille de Mars percute la Terre : l\'énergie libérée refond toute la surface et arrache la matière dont se formera la Lune.\n\n' +
              'Vous ne gagnerez pas quelques degrés, vous en gagnerez plusieurs milliers : la bille à −22 °C devient un océan de magma au-delà de 2 500 °C, avec l\'atmosphère de vapeur et de CO₂ qui va avec. C\'est l\'entrée dans l\'Hadéen.'
    },
    '🔥': {
        '💫': [
            'Refroidissement — le noyau rayonne vers l\'espace\n\n' +
              'Ce qui chauffe la surface ici n\'est pas le Soleil, encore faible : c\'est la chaleur interne, plus de 2 MW/m² qui traversent une croûte à peine formée. Chaque clic laisse passer 100 Ma pendant lesquels cette chaleur part en rayonnement infrarouge vers l\'espace — et rien ne la remplace.\n\n' +
              'Le flux géothermique s\'effondre donc, et la surface avec lui : attendez-vous à plusieurs CENTAINES de degrés en moins sur ce seul clic.',

            'Le magma continue de se vider de sa chaleur\n\n' +
              'Même moteur : la planète rayonne beaucoup plus qu\'elle ne reçoit, la croûte s\'épaissit, le flux interne baisse encore. Le refroidissement s\'accélère à mesure que la chaleur d\'accrétion s\'épuise.\n\n' +
              'Le CO₂ bouge à peine — ce n\'est pas lui qui tient la température à ce stade, c\'est le noyau.',

            'Dernier pas — la surface passe sous 100 °C\n\n' +
              'Le flux interne rejoint enfin l\'ordre de grandeur actuel. D\'un coup la vapeur peut condenser : l\'océan se forme, le CO₂ se dissout en partie, et ce sont le Soleil et l\'effet de serre qui reprennent la main.\n\n' +
              'La chute est brutale — de plus de 1 500 °C à une vingtaine de degrés. C\'est l\'entrée dans l\'Archéen.'
        ],
        '☄️':
            'Météorite de glace — l\'eau arrive, pas le froid\n\n' +
              'Contrairement au Corps noir, la cargaison tombe sur un océan de magma : elle passe instantanément en vapeur. Elle ne fait donc pas d\'albédo, elle alimente l\'effet de serre.\n\n' +
              'Tant que la surface reste au-dessus de 100 °C, aucun océan ne peut tenir : c\'est le refroidissement du noyau, pas l\'apport d\'eau, qui décidera du moment où la pluie pourra tomber.'
    },
    '🦠': {
        '💫': [
            'Le Soleil gagne plus vite que le CO₂ ne part — ça va RÉCHAUFFER\n\n' +
              'Deux choses bougent en sens inverse sur ce pas : l\'altération des roches enfouit du CO₂ et du méthane (ils baissent d\'environ 20 %), pendant que la luminosité solaire monte (Gough 1981).\n\n' +
              'À plus de 100 000 ppm, l\'absorption du CO₂ est déjà saturée : en perdre le quart ne coûte presque rien en effet de serre. Le Soleil, lui, compte plein tarif. Attendez-vous à quelques degrés de PLUS.',

            'Même bras de fer, même vainqueur\n\n' +
              'Le CO₂ et le méthane continuent de descendre, toujours dans la zone saturée où la baisse ne se paie pas. Le Soleil poursuit sa montée : la Terre archéenne se réchauffe encore.\n\n' +
              'C\'est la sortie du paradoxe du Soleil faible vue de l\'intérieur — non pas un climat stable, mais un climat qui se réchauffe malgré un effet de serre qui s\'affaiblit.',

            'Ce clic casse la tendance — ça va REFROIDIR fort\n\n' +
              'Il amène à −2 500 Ma, c\'est-à-dire à la composition du Protérozoïque : le méthane s\'effondre (l\'oxygène de la Grande Oxydation le détruit) et le CO₂ perd un ordre de grandeur.\n\n' +
              'Cette fois on sort de la saturation, et la baisse se paie plein tarif : attendez-vous à une dizaine de degrés en MOINS, malgré un Soleil toujours plus fort.'
        ]
    },
    '🪸': {
        '💫': [
            'Encore un pas où le Soleil l\'emporte — ça va RÉCHAUFFER\n\n' +
              'Le CO₂ est divisé par deux sur ce clic, et le méthane aussi. Mais on part de plusieurs milliers de ppm : on est toujours dans la partie saturée de l\'absorption, où diviser par deux coûte peu.\n\n' +
              'La montée de la luminosité solaire passe devant. La bascule glaciaire n\'est pas pour ce clic-ci.',

            'Cette fois le CO₂ pèse plus que le Soleil — ça va REFROIDIR\n\n' +
              'Le CO₂ descend sous le millier de ppm : on quitte la zone saturée, et chaque division par deux commence à coûter des degrés. Le méthane, détruit par l\'oxygène, ne compense plus rien.\n\n' +
              'Le refroidissement reste modéré — un à deux degrés — mais le signe a changé, et il ne changera plus.',

            'Dernier pas — la glace apparaît\n\n' +
              'La composition ne bouge presque plus, et pourtant la température va chuter de plusieurs degrés : elle passe le seuil où la neige survit à l\'été aux hautes latitudes. L\'albédo grimpe d\'un coup et amplifie le refroidissement qui l\'a causé.\n\n' +
              'Vous arriverez au pied du Sturtien, dans l\'état métastable où se joue la première grande hystérésis.'
        ]
    },
    'hysteresis 1a': {
        '🗻':
            'Volcanisme Franklin — ce clic fait basculer\n\n' +
              'Des éruptions massives injectent du soufre dans la stratosphère : un voile qui renvoie la lumière avant même qu\'elle n\'atteigne le sol. Sur une planète déjà au seuil, ce coup de froid suffit (Macdonald & Wordsworth 2017).\n\n' +
              'Rien ne changera DANS cette époque — l\'effet est de l\'autre côté du seuil. Le clic vous emmène en plein Snowball : albédo au-dessus de 0,75 et plus de SOIXANTE degrés de moins, à CO₂ quasi inchangé. C\'est ça, une bascule.'
    },
    '⛄': {
        '💫':
            'Le temps passe sous la glace — et rien ne bouge\n\n' +
              'Le voile de sulfates qui avait déclenché la bascule est retombé : la cause a disparu. Et pourtant la température ne remontera pas d\'un dixième de degré sur ce clic.\n\n' +
              'C\'est exactement ça, l\'hystérésis : enlever la cause ne défait pas l\'effet. La glace entretient le froid par son propre albédo. Le résultat intéressant de ce clic, c\'est qu\'il ne se passe rien.',
        '🌋':
            'Volcanisme prolongé — la seule porte de sortie\n\n' +
              'Sous une banquise globale, l\'altération des roches s\'arrête : plus rien ne consomme le CO₂ que les volcans continuent d\'émettre. Il s\'accumule pendant des millions d\'années, et les poussières salissent la glace, ce qui abaisse son albédo avant même la fonte.\n\n' +
              'Ce clic franchit le seuil : le CO₂ est multiplié par une quinzaine, l\'albédo s\'effondre, et vous passerez du désert glacé à une serre extrême — plus de quatre-vingts degrés d\'écart. Il en faut ÉNORMÉMENT plus pour sortir qu\'il n\'en fallait pour entrer.'
    },
    'hysteresis 1b': {
        '💫':
            'La serre post-Snowball s\'évacue — ça va REFROIDIR\n\n' +
              'Les roches mises à nu par la déglaciation s\'altèrent violemment et pompent le CO₂ ; les carbonates de couverture en sont la trace.\n\n' +
              'Ce clic fait redescendre le CO₂ d\'un ordre de grandeur, et la température d\'une petite dizaine de degrés — vers un monde chaud, mais redevenu ordinaire.'
    },
    '🪼': {
        '💫':
            'Le CO₂ baisse de moitié, la température ne bougera pas\n\n' +
              'Les océans redissolvent le CO₂ et la vie marine du Cambrien en enfouit une partie : sur ce clic, le CO₂ est divisé par deux.\n\n' +
              'Et pourtant attendez-vous à une température quasi identique : le Soleil a gagné en puissance pendant ces 180 Ma, et les deux effets se compensent presque exactement. C\'est le thermostat carbone qui travaille — la compensation dont l\'Archéen était incapable.'
    },
    '🍄': {
        '💫': [
            'Les forêts s\'installent — ça va REFROIDIR\n\n' +
            'Les premières vraies racines fracturent la roche et accélèrent l\'altération des silicates, qui ' +
            'consomme du CO₂. Sur ce pas il est réduit d\'un tiers, et le méthane s\'effondre avec la montée ' +
            'de l\'oxygène.\n\n' +
            'Le refroidissement reste modeste — un degré — mais pour la première fois depuis l\'Archéen, ' +
            'c\'est la BIOSPHÈRE qui pilote, ni le Soleil ni les volcans.',

            'Le carbone s\'enfouit — ça continue de REFROIDIR\n\n' +
            'Dévonien supérieur puis Carbonifère : les forêts marécageuses enfouissent le carbone plus vite ' +
            'qu\'il n\'est recyclé. C\'est littéralement le charbon d\'aujourd\'hui qui se met en place.\n\n' +
            'Le CO₂ passe sous les 400 ppm. Encore un degré et demi de moins, et la glace commence à tenir ' +
            'aux hautes latitudes du Gondwana.',

            'La glaciation du Karoo — ça va BASCULER\n\n' +
            'Le CO₂ atteint ~280 ppm et le méthane le ppm et demi : le modèle franchit le seuil glace-albédo. ' +
            'La glace bondit d\'environ 14 % à 28 % de la surface, et chaque mètre de glace en plus renvoie ' +
            'plus de lumière.\n\n' +
            'Attendez-vous à une chute d\'une dizaine de degrés d\'un seul clic. C\'est la plus longue ère ' +
            'glaciaire du Phanérozoïque (Montañez 2007) — et elle est causée par des arbres.',

            'Fin du Karoo — ça va RÉCHAUFFER, beaucoup\n\n' +
            'Les forêts humides du Carbonifère s\'effondrent, la Pangée s\'assèche, l\'enfouissement de ' +
            'carbone s\'arrête et le volcanisme reprend la main : le CO₂ repart vers le millier de ppm.\n\n' +
            'Ce clic vous emmène aux portes de la crise permienne, avec une vingtaine de degrés gagnés. ' +
            'Ce qui a mis 100 Ma à refroidir est défait en 35.'
        ]
    },
    '💀': {
        '💫':
            'Trapps de Sibérie — ça va RÉCHAUFFER, un peu\n\n' +
              'Des éruptions gigantesques pendant des centaines de milliers d\'années. Le soufre refroidit quelques années, le CO₂ réchauffe pour des dizaines de milliers d\'années : c\'est le second qui l\'emporte, avec l\'anoxie des océans et la plus grande extinction connue.\n\n' +
              'Sur ce pas la composition bouge peu et le degré gagné vient surtout du Soleil. L\'extinction, elle, ne se lit pas dans une moyenne de température — c\'est la limite de l\'exercice.'
    },
    '🦕': {
        '💫':
            'Un monde chaud qui le reste — presque rien ne va bouger\n\n' +
              'Pas de calotte permanente, un gradient équateur-pôle faible, un CO₂ élevé entretenu par le volcanisme de l\'ouverture de l\'Atlantique.\n\n' +
              'Ce clic laisse passer 100 Ma sans changer la composition : seul le Soleil ajoute sa fraction de degré. Sur toute la frise, c\'est l\'un des pas les plus stables.',
        '🎇':
            'Impact de Chicxulub — ce clic change d\'époque\n\n' +
              'Poussières et aérosols occultent le Soleil quelques années : photosynthèse interrompue, chaînes alimentaires effondrées.\n\n' +
              'Ce que vous verrez après le clic n\'est pas le nuage d\'impact (quelques années, hors de portée d\'un pas de 100 Ma) mais le monde d\'après : un CO₂ nettement plus bas et une dizaine de degrés en moins. C\'est le Cénozoïque qui commence.'
    },
    '🦤': {
        '💫':
            'Vers l\'optimum éocène — ça va RÉCHAUFFER\n\n' +
              'Après la crise K-Pg le CO₂ ne descend pas : il remonte, et fortement — il sera plus que doublé au bout de ce clic. Vous arrivez à −50 Ma, à l\'entrée du monde le plus chaud du Cénozoïque.\n\n' +
              'La longue descente vers les glaciations viendra APRÈS, quand l\'Himalaya se soulèvera et se mettra à pomper le CO₂. Pas sur ce clic-ci.'
    },
    '🐊': {
        '💫':
            'L\'Himalaya se soulève — ça va REFROIDIR\n\n' +
              'La collision Inde-Asie expose sans cesse des roches fraîches à la pluie. L\'altération s\'emballe et pompe le CO₂ pendant des millions d\'années (Raymo & Ruddiman 1992).\n\n' +
              'Sur ce clic le CO₂ est divisé par deux et la température perd près de quatre degrés : le monde le plus chaud du Cénozoïque commence sa descente, celle qui mène aux calottes.'
    },
    'hysteresis 2': {
        '⛰':
            'Au seuil de la calotte antarctique — ce clic franchit\n\n' +
              'Le CO₂ est passé sous la valeur en dessous de laquelle une calotte peut tenir sur l\'Antarctique. Comme au Sturtien, le franchissement ne sera pas progressif.\n\n' +
              'Dans cette époque-ci rien ne bougera : l\'effet est de l\'autre côté. Le clic installe la glace — albédo en hausse, trois degrés de moins — et une fois qu\'elle est là, il en faudra bien plus pour la faire disparaître que pour l\'avoir empêchée de se former.'
    },
    '🏔': {
        '💫': [
            'La calotte tient, le climat ne bouge guère\n\n' +
              'La composition est presque figée sur ce pas ; seul le Soleil ajoute sa fraction de degré. C\'est le mode « avec calottes » qui s\'installe pour de bon — celui que la Terre n\'a plus quitté depuis, et qui rend possibles les cycles glaciaires.',

            'Vers le Pliocène — ça va REFROIDIR\n\n' +
              'Ce clic amène à −2 Ma : le CO₂ tombe de moitié et la glace gagne l\'hémisphère nord. Trois degrés de moins.\n\n' +
              'Surtout, il plante le décor : avec des calottes aux deux pôles, deux états deviennent possibles pour une même atmosphère. C\'est ce que le Quaternaire va montrer, juste après.'
        ]
    },
    '🦣': {
        '💫': [
            'Vers une glaciation — ça va REFROIDIR fort\n\n' +
              'L\'obliquité descend à son minimum : les étés polaires deviennent trop frais pour faire fondre la neige tombée l\'hiver. La glace s\'étend, l\'albédo monte, l\'océan froid absorbe du CO₂ et les zones humides émettent moins de méthane.\n\n' +
              'Les deux gaz AMPLIFIENT le refroidissement, ils ne le déclenchent pas : le déclencheur est astronomique. Attendez-vous à sept degrés de moins d\'un seul clic.',

            'Vers un interglaciaire — ça va RÉCHAUFFER autant\n\n' +
              'L\'obliquité remonte à son maximum : étés polaires chauds, la glace de l\'année ne survit pas. L\'albédo s\'effondre, l\'océan qui se réchauffe relâche son CO₂, les zones humides redémarrent.\n\n' +
              'Vous retrouverez la température d\'avant la glaciation, à l\'identique. C\'est l\'état dans lequel nous vivons — et il ne tient qu\'à la position de notre axe.',

            'Retour au froid — même clic, même résultat\n\n' +
              'Même obliquité et même composition qu\'au premier clic, et le modèle va retomber exactement sur la même température : ce sont bien deux états stables, pas une dérive.\n\n' +
              'C\'est le test le plus simple de l\'hystérésis glaciaire : la Terre ne garde pas de mémoire du nombre de cycles, seulement de la position de son axe.',

            'Sortie du Quaternaire — ça va RÉCHAUFFER\n\n' +
              'Dernier pas : la date atteint −10 000 ans et le modèle bascule une dernière fois du côté chaud. La calotte nord-américaine a fondu, le niveau des mers est remonté de 120 m.\n\n' +
              'Ce qui suit n\'est pas un nouvel état : c\'est l\'Holocène, le même interglaciaire, mais tenu assez longtemps pour que l\'agriculture y tienne.'
        ]
    },
    '🛖': {
        '💫': [
            'Quatre mille ans — et rien ne bougera\n\n' +
              'Environ 280 ppm de CO₂, une température qui ne varie pas d\'un dixième de degré. C\'est la fenêtre climatique dans laquelle tiennent l\'agriculture et toutes les civilisations humaines.\n\n' +
              'Ici, la stabilité EST le résultat : après quatre milliards d\'années de secousses, le modèle ne trouve plus rien à dire.',

            'Encore quatre mille ans de calme\n\n' +
              'Même composition, même température, au dixième de degré près. Sur toute la frise, c\'est l\'époque où il se passe le moins de choses — et c\'est précisément ce qui la rend remarquable.',

            'Dernier pas — 1800, le CO₂ commence à bouger\n\n' +
              'Le méthane et le CO₂ amorcent leur remontée : quelques ppm, quelques dixièmes de degré. Rien qui saute aux yeux encore.\n\n' +
              'Le clic vous dépose à l\'entrée de l\'ère industrielle, et pour la première fois le forçage ne viendra ni de la géologie, ni de l\'astronomie, ni de la biosphère.'
        ]
    },
    '🚂': {
        '💫': [
            'Premier siècle industriel — presque rien encore\n\n' +
              '1800 → 1900 : le charbon brûle, mais les quantités restent petites devant la masse de l\'atmosphère. Attendez-vous à une composition et à une température quasi inchangées.\n\n' +
              'Le signal n\'est pas encore sorti du bruit — ce qui explique qu\'on ait mis si longtemps à le voir.',

            'Second siècle — cette fois ça se voit\n\n' +
              '1900 → 2000 : le pétrole s\'ajoute au charbon. Le CO₂ passe d\'environ 280 à 365 ppm et la température gagne plus d\'un degré sur ce seul clic.\n\n' +
              'Le carbone enfoui au Carbonifère est renvoyé dans l\'atmosphère en deux siècles — le pas de temps le plus court de toute la frise, et le plus rapide en degrés par million d\'années.'
        ]
    },
    '📱': {
        '⛽':
            'Émissions d\'une tranche de 25 ans\n\n' +
              'Le CO₂ ajouté ne reste pas entièrement dans l\'air : l\'océan en dissout une partie (loi de Henry, freinée par la chimie des carbonates qui sature) et les forêts en stockent une autre (elles poussent plus vite avec plus de CO₂, effet qui sature aussi).\n\n' +
              'Les paramètres viennent de mesures — Global Carbon Budget, expériences FACE — jamais de projections. Ce que vous lirez après le clic sort des équations, pas d\'un scénario.',
        '🛢':
            'Émissions doublées sur 25 ans\n\n' +
              'Même mécanique, rythme deux fois plus fort. Les puits océan et forêts ne suivent pas proportionnellement : ils saturent, donc la PART qui reste dans l\'air augmente.\n\n' +
              'C\'est pourquoi doubler les émissions fait plus que doubler l\'écart de température.'
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

/** ppm molaires depuis une masse (kg) de gaz, avec la composition du dernier calcul. */
function ppmFromMass(massKg, molarMassGas) {
    const DATA = window.DATA;
    if (!DATA || !DATA['⚖️'] || !DATA['🫧']) return null;
    const mAir = DATA['🫧']['🧪'];
    const mDry = DATA['⚖️']['⚖️🫧'];
    if (!Number.isFinite(massKg) || !Number.isFinite(mAir) || !Number.isFinite(mDry) || mDry <= 0) return null;
    return (massKg / mDry) * (mAir / molarMassGas) * 1e6;
}

function fmtPpm(v) {
    if (!Number.isFinite(v)) return '?';
    if (v >= 1000) return Math.round(v).toLocaleString('fr-FR');
    return v >= 10 ? v.toFixed(0) : v.toFixed(2);
}

/**
 * Rang du PROCHAIN clic pour cet événement (0 = premier clic à venir) : c'est l'index dans la suite
 * de récits d'EVENT_STORY. Chaque bouton a son compteur — ☄️ incrémente 📿☄️, les boutons de temps
 * (💫 / 🏔 / ⛰ / 🌋) incrémentent 📿💫 — sinon, sur ⚫ où les deux alternent, le récit de la 2ᵉ
 * météorite s'afficherait après le 1er clic de temps.
 */
function eventClickIndex(eventKey) {
    const H = window.DATA ? window.DATA['📜'] : null;
    if (!H) return 0;
    const n = Number(eventKey === '☄️' ? H['📿☄️'] : H['📿💫']);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

/** État 🔁 que le PROCHAIN clic appliquera (index = 📿💫), ou null. */
function nextCycleState(epochId) {
    const row = epochRowById(epochId);
    const states = row && row['🕰'] && Array.isArray(row['🕰']['🔁']) ? row['🕰']['🔁'] : null;
    if (!states || !states.length) return null;
    const tic = (window.DATA && window.DATA['📜'] && Number.isFinite(Number(window.DATA['📜']['📿💫'])))
        ? Number(window.DATA['📜']['📿💫']) : 0;
    return states[Math.min(tic, states.length - 1)];
}

/**
 * Texte alt2sec d'un bouton d'événement : CE QUI CHANGE (lu dans la config) + POURQUOI (📝 de l'état, sinon
 * récit EVENT_STORY) + EFFET ATTENDU (déduit du signe des variations). Aucun if par époque.
 */
function buildEventAlt2sec(epochId, eventKey) {
    const CONST = window.CONST;
    const row = epochRowById(epochId);
    const cfg = row && row['🕰'] ? row['🕰'][eventKey] : null;
    const state = nextCycleState(epochId);
    const changes = [];
    let warmer = 0; // > 0 attendu plus chaud, < 0 plus froid

    // Durée représentée par le clic
    const stepMa = cfg && Number.isFinite(Number(cfg['🔺⏳'])) ? Number(cfg['🔺⏳']) : null;
    if (stepMa !== null) {
        changes.push(stepMa >= 1 ? '+' + stepMa + ' Ma' : '+' + Math.round(stepMa * 1e6).toLocaleString('fr-FR') + ' ans');
    }

    // Masses imposées par l'état de cycle (🔁) : on montre valeur courante → valeur visée
    if (state) {
        const gases = [['⚖️🏭', 'CO₂', CONST.M_CO2], ['⚖️🐄', 'CH₄', CONST.M_CH4]];
        for (const g of gases) {
            if (!Number.isFinite(Number(state[g[0]]))) continue;
            const now = ppmFromMass(window.DATA['⚖️'][g[0]], g[2]);
            const next = ppmFromMass(Number(state[g[0]]), g[2]);
            if (next === null) continue;
            if (now !== null && fmtPpm(now) === fmtPpm(next)) continue; // inchangé : rien à annoncer
            changes.push(g[1] + ' ' + (now === null ? '' : fmtPpm(now) + ' → ') + fmtPpm(next) + ' ppm');
            if (now !== null) warmer += (next > now ? 1 : (next < now ? -1 : 0));
        }
        if (Number(state['⚾']) > 0) {
            const epochEps = Number.isFinite(Number(row['⚾'])) ? Number(row['⚾'])
                : Number(window.CONFIG_COMPUTE.obliquityDeg);
            const nowEps = Number(window.DATA['📜']['⚾']) > 0 ? Number(window.DATA['📜']['⚾']) : epochEps;
            if (Number(state['⚾']) !== nowEps) {
                changes.push('obliquité ' + nowEps.toFixed(2).replace('.', ',') + '° → '
                    + Number(state['⚾']).toFixed(2).replace('.', ',') + '°');
                warmer += (Number(state['⚾']) > nowEps ? 1 : -1);
            }
        }
    }

    // Deltas portés par l'événement lui-même
    if (cfg && Number.isFinite(Number(cfg['🔺⚖️🏭']))) {
        changes.push('+' + Math.round(Number(cfg['🔺⚖️🏭']) / 1e12).toLocaleString('fr-FR') + ' GtCO₂ émis');
        warmer += 1;
    }
    if (cfg && Number.isFinite(Number(cfg['🔺🍰⚽']))) {
        changes.push('voile SW +' + (Number(cfg['🔺🍰⚽']) * 100).toFixed(0) + ' %');
        warmer -= 1;
    }
    if (cfg && Number.isFinite(Number(cfg['🌫️❄️']))) {
        changes.push('albédo de la glace → ' + Number(cfg['🌫️❄️']).toFixed(2).replace('.', ',') + ' (glace sale)');
        warmer += 1;
    }
    if (cfg && Number.isFinite(Number(cfg['🔺⚖️💧☄️']))) {
        changes.push('+' + Number(cfg['🔺⚖️💧☄️']).toExponential(1) + ' kg d\'eau');
    }

    // Récit : texte simple, ou tableau indexé par le numéro du clic à venir (époques à états 🕰.🔁)
    let why = EVENT_STORY[epochId] ? EVENT_STORY[epochId][eventKey] : undefined;
    if (Array.isArray(why)) {
        why = why[Math.min(eventClickIndex(eventKey), why.length - 1)];
    }
    // Ce clic termine-t-il l'époque ? (durée |▶−◀| vs temps écoulé + un pas) → annoncer la suite
    if (row && stepMa !== null && Number.isFinite(Number(row['▶'])) && Number.isFinite(Number(row['◀']))) {
        const durMa = Math.abs(Number(row['◀']) - Number(row['▶'])) / 1e6;
        const infoMa = Number.isFinite(Number(window.infoTimeMa)) ? Number(window.infoTimeMa) : 0;
        if (infoMa + stepMa >= durMa - 1e-9) {
            const idx = window.TIMELINE.findIndex(function (r) { return r && r['📅'] === epochId; });
            const nextRow = idx >= 0 ? window.TIMELINE[idx + 1] : null;
            const nextName = nextRow ? (window.CHARS_DESC[nextRow['📅']] || nextRow['📅']) : null;
            const head = nextName ? 'Fin de l\'époque : ce clic vous emmène à « ' + nextName + ' ».' : 'Fin de l\'époque.';
            return why ? head + '\n\n' + why : head;
        }
    }
    if (!changes.length && !why) return undefined;

    const blocks = [];
    if (why) blocks.push(why);
    if (changes.length) blocks.push('Ce que ça change : ' + changes.join(' · '));
    if (warmer !== 0) {
        blocks.push('Effet attendu : ' + (warmer > 0 ? 'réchauffement' : 'refroidissement')
            + ' — mais c\'est le calcul qui tranche, pas cette annonce.');
    }
    return blocks.join('\n\n');
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
