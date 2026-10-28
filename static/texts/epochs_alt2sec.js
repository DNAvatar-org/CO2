// File: CO2/static/texts/epochs_alt2sec.js - Récits alt2sec des époques et des événements
// Desc: En français, dans l'architecture, je suis le TEXTE (histoire de la Terre) affiché en bulle longue (~2 s)
//       sur les boutons d'époque de la frise et sur les boutons d'événement.
// Version 1.3.0
// Date: [October 26, 2026]
// logs :
//   - v1.3.0 (2026-10-26): 🦣 en deux chemins (🐾 pas à pas, 🦘 le saut), un récit par chemin ; orbite La2004 (arrivée bornée à ◀,
//     pas de vote de l'insolation au-delà de l'horizon de phase).
//   - v1.2.6 (2026-10-15): repère tCRepere avec son statut (✅ 🧮 ⚠️ 🔀) et sa source, plus « sources » pour des valeurs non sourcées.
//   - v1.2.5 (2026-10-15): epochSeedLabel (survol frise) ; écarts ± 1σ et fourchette des sources dans l'alt2sec.
//   - v1.2.4 (2026-10-15): 📱 ⛽ 🛢 🪾 = optimiste ×0,5 / comme maintenant / pire ×1,5 par tranche.
//   - v1.2.3 (2026-10-15): 📱 🌈 (zéro émission, tranche 2100 → 2300).
//   - v1.2.2 (2026-10-14): ⚫ = quatre ☄️ de masse croissante (eau lue sur l'entrée de séquence, CLICS.eauDuClic).
//   - v1.2.1 (2026-09-24): « Ce que ça change » affiche le pas de clic à 1 décimale.
//   - v1.2.0 (2026-09-24): vraies dates (ICS 2023, Hoffman et al. 2017) dans les titres ; le Cryogénien a
//     DEUX glaciations — ⛄ Snowball Sturtien, 🌦 1b Sortie Sturtienne + interglaciaire, 🏂 Snowball Marinoen,
//     ⛈ 1c Sortie Marinoenne ; récits de clics recalés sur la chaîne de clics du 2026-09-24.
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
        'Hadéen — l\'océan de magma (4,51 → 4,031 Ga)\n\n' +
        'Juste après l\'impact qui forme la Lune. La surface est de la roche fondue, le flux de chaleur interne ' +
        'dépasse 2 MW/m² : c\'est lui, et non le Soleil, qui fixe la température.\n\n' +
        'Une « température moyenne » n\'a ici pas grand sens (surface incandescente, écarts énormes) : c\'est la ' +
        'COMPOSITION qui est contrainte par la littérature — atmosphère de vapeur et de CO₂ de plusieurs dizaines de bars.\n\n' +
        'Les météorites de glace ☄️ apportent l\'eau ; le refroidissement par rayonnement fait le reste, très vite ' +
        'à l\'échelle géologique.',

    '🦠':
        'Archéen — le paradoxe du Soleil faible (4,031 → 2,5 Ga)\n\n' +
        'Le Soleil ne rayonne que ~74 % de sa puissance actuelle. Sans effet de serre, la Terre serait gelée ; ' +
        'or les roches indiquent de l\'eau liquide, et la vie apparaît.\n\n' +
        'La sortie du paradoxe passe par une atmosphère très chargée en CO₂ et en méthane, sans oxygène. ' +
        'Le méthane reste sous le seuil de la brume organique (CH₄/CO₂ < 0,1) qui, elle, refroidirait.\n\n' +
        'Obliquité possiblement forte (45°), ce qui réchauffe les hautes latitudes.',

    '🪸':
        'Protérozoïque — l\'oxygène arrive (2,5 Ga → 720 Ma)\n\n' +
        'La photosynthèse oxygénique transforme l\'atmosphère (Grande Oxydation). L\'oxygène détruit le méthane : ' +
        'l\'un des gaz à effet de serre disparaît largement, le CO₂ reste le pilier.\n\n' +
        'Eucaryotes puis multicellularité. La planète s\'approche lentement des conditions où la bascule glaciaire ' +
        'devient possible : c\'est ce qui va se jouer juste après, au Sturtien.',

    'hysteresis 1a':
        'Surfusion climatique — entrée Sturtienne (720 → 717 Ma)\n\n' +
        'Comme en surfusion, le climat peut rester bloqué dans un état (ici chaud, pré-Sturtien) alors que les ' +
        'forçages — CO₂ en baisse, albédo — orientent déjà vers la glaciation.\n\n' +
        'Hystérésis : le système garde une mémoire de son chemin. Il faut souvent un forçage fort ou un choc pour ' +
        'sortir du puits actuel et franchir le seuil (bascule Snowball).\n\n' +
        'Ce n\'est pas l\'équilibre instantané : tant que la bascule n\'est pas passée, l\'état métastable tient — ' +
        'résistance au changement, pas absence de forçage.',

    '⛄':
        'Snowball Sturtien — la Terre boule de neige (717 → 659 Ma)\n\n' +
        'La bascule a eu lieu : la glace atteint les tropiques, l\'albédo dépasse 0,75, la planète se referme sur ' +
        'elle-même. Le refroidissement s\'auto-entretient — chaque mètre de glace en plus renvoie plus de lumière.\n\n' +
        'Sortir de cet état ne se fait pas en remettant le CO₂ d\'avant : il en faut BEAUCOUP plus. C\'est toute ' +
        'l\'hystérésis, et c\'est la partie la plus sensible du calage du modèle.\n\n' +
        'La glace coupe l\'altération des silicates : le CO₂ volcanique s\'accumule pendant des millions d\'années, ' +
        'jusqu\'au seuil de sortie. Le Sturtien a duré près de 58 millions d\'années (Hoffman et al. 2017) — et ' +
        'ce n\'est que la première des deux glaciations globales du Cryogénien.',

    'hysteresis 1b':
        'Sortie Sturtienne — la déglaciation brutale, puis l\'interglaciaire (659 → 639 Ma)\n\n' +
        'Le CO₂ accumulé sous la glace finit par franchir le seuil : l\'albédo s\'effondre, la planète passe en ' +
        'quelques milliers d\'années d\'un désert glacé à une serre extrême.\n\n' +
        'Suit un intervalle chaud d\'une vingtaine de millions d\'années, pendant lequel l\'altération des roches ' +
        'mises à nu repompe le CO₂ — jusqu\'au bord d\'une deuxième bascule.\n\n' +
        'La glace sale (poussières, cendres) aide la sortie en abaissant l\'albédo avant même la fonte. ' +
        'Les carbonates de couverture, déposés juste après, sont la trace de cette serre.\n\n' +
        'Le même CO₂ ne donne pas la même température selon qu\'on arrive par le chaud ou par le froid : ' +
        'c\'est la signature d\'une hystérésis, pas d\'un simple thermostat.',

    '🏂':
        'Snowball Marinoen — la deuxième boule de neige (639 → 635,2 Ma)\n\n' +
        'Moins de vingt millions d\'années après la première, la Terre regèle entièrement. Plus courte que le ' +
        'Sturtien — quelques millions d\'années (Hoffman et al. 2017) — mais tout aussi globale : des glaciers ' +
        'atteignent le niveau de la mer à l\'équateur.\n\n' +
        'Même mécanisme, même piège : une fois la glace installée, son albédo la protège, et il faut de nouveau ' +
        'des millions d\'années de CO₂ volcanique accumulé pour en sortir.',

    'hysteresis 1c':
        'Sortie Marinoenne — la dernière déglaciation globale (635,2 Ma)\n\n' +
        'Le seuil est franchi une seconde fois : serre extrême, pluies acides, puis dépôt des carbonates de ' +
        'couverture, datés à 635,2 Ma — la base de l\'Édiacarien.\n\n' +
        'Après elle, la Terre ne connaîtra plus jamais de glaciation globale. La vie multicellulaire complexe ' +
        '(faune d\'Ediacara) apparaît dans les dizaines de millions d\'années qui suivent.',

    '🪼':
        'Paléozoïque marin — explosion cambrienne (538,8 → 419,2 Ma)\n\n' +
        'La vie complexe se diversifie dans l\'océan. Le climat est chaud et stable, le CO₂ reste élevé ' +
        'alors que le Soleil, lui, continue de gagner en puissance.\n\n' +
        'Les continents sont encore nus : pas de racines, donc une altération des roches lente, et un ' +
        'thermostat carbone moins réactif qu\'aujourd\'hui.',

    '🍄':
        'Paléozoïque terrestre — la conquête des terres (419,2 → 252,2 Ma)\n\n' +
        'Les plantes colonisent les continents, puis viennent les forêts du Dévonien et du Carbonifère. ' +
        'Deux conséquences climatiques majeures :\n\n' +
        '— les racines accélèrent l\'altération des silicates, qui consomme du CO₂ ;\n' +
        '— le carbone s\'enfouit massivement (c\'est le charbon d\'aujourd\'hui).\n\n' +
        'Le CO₂ chute, la planète se refroidit, et une glaciation s\'installe (Karoo) : quatre clics ' +
        'traversent l\'époque. La biosphère devient un acteur ' +
        'du climat, pas seulement un passager.',

    '💀':
        'Extinction permienne — la grande crise (252,2 → 251,9 Ma)\n\n' +
        'Les trapps de Sibérie injectent d\'énormes quantités de CO₂ et de soufre. Réchauffement rapide, ' +
        'océans anoxiques, acidification : environ 90 % des espèces marines disparaissent.\n\n' +
        'C\'est la plus grande extinction connue — d\'où le nom, plus parlant que « limite P/T ». ' +
        'Le soufre refroidit quelques années, le CO₂ réchauffe pour des dizaines de milliers d\'années : ' +
        'deux échelles de temps opposées, un seul événement.',

    '🦕':
        'Mésozoïque — le monde des dinosaures (251,9 → 66,0 Ma)\n\n' +
        'Climat chaud et remarquablement stable, sans calotte polaire permanente : des forêts poussent ' +
        'jusqu\'aux hautes latitudes.\n\n' +
        'Le gradient équateur-pôle est plus faible qu\'aujourd\'hui, ce que le modèle représente par des ' +
        'écarts de température par zone plus serrés. La crise K-Pg (astéroïde, 66 Ma) clôt la période.',

    '🦤':
        'Cénozoïque — après l\'astéroïde (66,0 → 56,0 Ma)\n\n' +
        'Les mammifères se diversifient dans un monde encore chaud. Le CO₂ reste haut, ' +
        'les pôles sont libres de glace.\n\n' +
        'C\'est le début de la longue descente qui mènera, 60 millions d\'années plus tard, ' +
        'aux glaciations quaternaires.',

    '🐊':
        'Éocène — le pic de chaleur (56,0 → 34,4 Ma)\n\n' +
        'Le monde le plus chaud du Cénozoïque : des crocodiliens vivent dans l\'Arctique, aucune calotte ' +
        'permanente. CO₂ élevé, méthane abondant (zones humides).\n\n' +
        'Puis la surrection de l\'Himalaya expose des roches fraîches à l\'altération : le thermostat carbone ' +
        's\'emballe dans l\'autre sens et pompe le CO₂ pendant des millions d\'années.',

    'hysteresis 2':
        'Prélude glaciaire — Éocène-Oligocène (34,4 → 33,9 Ma)\n\n' +
        'Le CO₂ approche du seuil qui permet à une calotte de tenir sur l\'Antarctique. Comme au Sturtien, ' +
        'le système peut rester « en retard » sur son forçage : le franchissement est brutal, pas progressif.\n\n' +
        'Une fois la calotte installée, il faudra bien plus de CO₂ pour la faire disparaître que pour l\'empêcher ' +
        'de se former : deuxième grande hystérésis de l\'histoire de la Terre.',

    '🏔':
        'Grande Coupure — la calotte antarctique (33,9 → 2,58 Ma)\n\n' +
        'La bascule a eu lieu : l\'Antarctique se couvre de glace, le niveau des mers chute, ' +
        'les faunes européennes sont renouvelées (d\'où le nom donné par les paléontologues).\n\n' +
        'La Terre entre dans son mode « avec calottes », celui qu\'elle n\'a plus quitté depuis. ' +
        'C\'est ce qui rend possibles les cycles glaciaires qui suivront.',

    '🦣':
        'Quaternaire — les cycles glaciaires (2,58 Ma → 11,7 ka)\n\n' +
        'L\'orbite de la Terre oscille : l\'obliquité tous les 41 000 ans, la précession tous les 23 000, l\'excentricité ' +
        'tous les 100 000. Elle ne change presque rien au Soleil reçu par le globe, mais elle déplace l\'été boréal : quand il ' +
        'faiblit, la neige des terres arctiques survit, une calotte naît et grandit ; quand il revient, sa marge fond.\n\n' +
        'Deux chemins au premier clic : 🐾 pas à pas, 20 000 ans par clic le long des carottes de glace antarctiques (41 clics, ' +
        'la courbe orange de l\'onglet Histoire) ; 🦘 le saut, jusqu\'au dernier maximum glaciaire puis l\'Holocène (2 clics). Le ' +
        'CO₂ et le méthane de chaque clic sont ceux des carottes à cette date. Les calottes n\'ont que le temps du clic pour ' +
        'suivre : elles grandissent lentement et fondent vite.',

    '🛖':
        'Holocène — le climat de l\'agriculture (11,7 ka → 1750)\n\n' +
        'Onze mille ans d\'une stabilité remarquable : environ 280 ppm de CO₂, une température qui varie de moins ' +
        'd\'un degré. Toutes les civilisations humaines tiennent dans cette fenêtre.\n\n' +
        'La glaciation suivante devrait arriver, mais l\'obliquité est aujourd\'hui dans une phase peu favorable, ' +
        'et le CO₂ a pris une tout autre direction.',

    '🚂':
        'Ère industrielle — le début du signal (1750 → 2000)\n\n' +
        'Charbon, puis pétrole : le carbone enfoui au Carbonifère est renvoyé dans l\'atmosphère en deux siècles. ' +
        'Le CO₂ passe de 277 ppm en 1750 à 369 ppm en 2000 (Law Dome, puis Mauna Loa).\n\n' +
        'C\'est la première fois dans cette frise qu\'un forçage vient d\'ailleurs que de la géologie, ' +
        'de l\'astronomie ou de la biosphère.',

    '📱':
        'Aujourd\'hui — de 2000 à 2300 (à vous de jouer)\n\n' +
        'Point de départ : l\'an 2000, mesuré à 369 ppm. Chaque clic ⛽ (optimiste), 🛢 (comme maintenant) ou 🪾 (le pire) ajoute ' +
        'les émissions d\'une tranche de 25 ans et calcule ce que ça donne — c\'est tout l\'objet de l\'application.\n\n' +
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
        // Quatre ☄️ (trois tics de 100 Ma, le 4ᵉ jusqu'à 1 000 ans avant l'impact), de plus en plus lourds (configTimeline : EAU_CUMUL_KG) : ~0,3 m → 7,4 m → 178 m →
        // 4,3 km d'eau globale (un océan). L'albédo de l'eau sature à 10 m (🍰🪩💧) : 3 % → 74 % → 100 % → 100 % de son effet.
        '☄️': [
            'Premières poussières de glace — un peu plus froid\n\n' +
              'L\'eau n\'arrive pas d\'un coup : la Terre l\'accrète tout du long, mais très peu au début. Ce premier apport ne ferait qu\'une pellicule de 30 cm s\'il était étalé partout : il ne couvre qu\'une petite part de la roche noire.\n\n' +
              'Sans atmosphère, cette eau reste de la glace et renvoie un peu de Soleil sans rien chauffer. Attendez-vous à quelques degrés de moins, pas davantage.',

            'Vingt-quatre fois plus d\'eau — nettement plus froid\n\n' +
              'L\'apport grossit à chaque tic (les gros corps riches en eau viennent tard, Morbidelli et al. 2000). Sept mètres d\'eau globale : la glace couvre maintenant les trois quarts de la bille.\n\n' +
              'C\'est la boucle glace-albédo à l\'état pur, sans air ni nuages pour l\'amortir. Attendez-vous à plusieurs dizaines de degrés en moins.',

            'Près de deux cents mètres d\'eau — la glace couvre tout\n\n' +
              'Au-delà d\'une dizaine de mètres, la surface est entièrement blanche : l\'albédo ne peut plus monter. La planète descend vers son équilibre de boule de glace, autour de −100 °C.\n\n' +
              'Retenez le signe : ici l\'eau refroidit. Ce n\'est qu\'avec une atmosphère, et sous forme de vapeur, qu\'elle deviendra le premier gaz à effet de serre.',

            'Le gros de l\'eau arrive — et plus rien ne change\n\n' +
              'Ce dernier apport est presque toute l\'eau de la Terre primitive, un océan : 4,3 km de glace globale sur cette petite bille. Mais la surface était déjà blanche : la température ne bouge presque plus, seul le Soleil, qui monte lentement (Gough 1981), la fait varier d\'une fraction de degré.\n\n' +
              'Toute cette eau attend l\'impact géant pour passer en vapeur.'
        ],
        '🎇':
            'Impact majeur — ce clic change de monde\n\n' +
              'Un corps de la taille de Mars percute la Terre : l\'énergie libérée refond toute la surface et arrache la matière dont se formera la Lune.\n\n' +
              'Vous ne gagnerez pas quelques degrés, vous en gagnerez plusieurs milliers : la bille de glace devient un océan de magma au-delà de 2 500 °C, avec l\'atmosphère de vapeur et de CO₂ qui va avec. C\'est l\'entrée dans l\'Hadéen.'
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
              'À plus de 100 000 ppm, l\'absorption du CO₂ est déjà saturée : en perdre le quart ne coûte presque rien en effet de serre. Le Soleil, lui, compte plein tarif. Attendez-vous à un peu plus d\'un degré de PLUS.',

            'Cette fois le CO₂ l\'emporte — ça va REFROIDIR, un peu\n\n' +
              'Le CO₂ et le méthane perdent encore un tiers : on sort peu à peu de la zone saturée, et la baisse commence à se payer. Le Soleil poursuit sa montée, mais ne suit plus.\n\n' +
              'Attendez-vous à deux degrés de moins. C\'est la sortie du paradoxe du Soleil faible vue de l\'intérieur : un équilibre fragile entre un Soleil qui monte et un effet de serre qui s\'affaiblit.',

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
              'Le CO₂ s\'effondre jusqu\'à quelques dizaines de ppm : on quitte la zone saturée, et chaque division par deux coûte des degrés. Le méthane, détruit par l\'oxygène, ne compense plus rien.\n\n' +
              'Attendez-vous à cinq degrés de moins. Le signe a changé, et il ne changera plus.',

            'Dernier pas — la glace apparaît\n\n' +
              'La composition ne bouge presque plus, et pourtant la température va chuter d\'une dizaine de degrés, jusqu\'à 0 °C : elle passe le seuil où la neige survit à l\'été aux hautes latitudes. L\'albédo grimpe d\'un coup et amplifie le refroidissement qui l\'a causé.\n\n' +
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
              'Le voile de sulfates qui avait déclenché la bascule est retombé : la cause a disparu. Et pourtant la température ne remontera que de deux à trois degrés — la planète reste sous −60 °C.\n\n' +
              'C\'est exactement ça, l\'hystérésis : enlever la cause ne défait pas l\'effet. La glace entretient le froid par son propre albédo.',
        '🌋':
            'Volcanisme prolongé — la seule porte de sortie\n\n' +
              'Sous une banquise globale, l\'altération des roches s\'arrête : plus rien ne consomme le CO₂ que les volcans continuent d\'émettre. Il s\'accumule pendant des millions d\'années, et les poussières salissent la glace, ce qui abaisse son albédo avant même la fonte.\n\n' +
              'Ce clic franchit le seuil : le CO₂ est multiplié par plus de cent, l\'albédo s\'effondre, et vous passerez du désert glacé à une serre extrême — plus de quatre-vingt-dix degrés d\'écart. Il en faut ÉNORMÉMENT plus pour sortir qu\'il n\'en fallait pour entrer.'
    },
    'hysteresis 1b': {
        '💫': [
            'La serre post-Sturtienne s\'évacue — ça va REFROIDIR\n\n' +
              'Les roches mises à nu par la déglaciation s\'altèrent violemment et pompent le CO₂ ; les carbonates de couverture en sont la trace.\n\n' +
              'Sur ce clic le CO₂ perd plus d\'un tiers, la température deux degrés.',

            'L\'interglaciaire se refroidit — encore\n\n' +
              'L\'altération continue de pomper : le CO₂ est divisé par deux et demi, et la température perd quatre degrés. Le monde redevient ordinaire, puis frais.\n\n' +
              'Vous arriverez au bord de la deuxième bascule : un CO₂ où il suffira d\'un coup de pouce pour regeler toute la planète.',

            'Le coup de pouce — ce clic fait regeler la Terre\n\n' +
              'Un nouveau voile volcanique assombrit le Soleil sur une planète déjà au seuil. Comme au Sturtien, l\'effet est de l\'autre côté : le clic vous emmène dans le Marinoen, plus de quatre-vingts degrés plus bas, à CO₂ inchangé.\n\n' +
              'Deux glaciations globales en moins de cent millions d\'années : la bascule n\'était pas un accident.'
        ]
    },
    '🏂': {
        '💫':
            'Sous la glace, une deuxième fois — presque rien ne bouge\n\n' +
              'Le voile est retombé ; la température remonte de deux à trois degrés et reste sous −55 °C. L\'hystérésis, encore : la cause partie, l\'effet demeure.',
        '🌋':
            'Volcanisme accumulé — la dernière porte de sortie\n\n' +
              'Le CO₂ volcanique s\'est de nouveau accumulé sous la banquise, et les poussières salissent la glace.\n\n' +
              'Ce clic franchit le seuil : le CO₂ est multiplié par près de quatre, l\'albédo s\'effondre, et l\'écart atteint près de quatre-vingt-dix degrés. C\'est la dernière glaciation globale de l\'histoire de la Terre.'
    },
    'hysteresis 1c': {
        '💫':
            'La serre post-Marinoenne s\'évacue — ça va REFROIDIR\n\n' +
              'Carbonates de couverture, altération des roches fraîches : le CO₂ est divisé par six sur l\'Édiacarien.\n\n' +
              'Le clic vous dépose au début du Cambrien avec près de neuf degrés de moins — un monde chaud et stable, où la vie complexe va exploser.'
    },
    '🪼': {
        '💫':
            'Le CO₂ baisse de moitié, la température à peine\n\n' +
              'Les océans redissolvent le CO₂ et la vie marine du Cambrien en enfouit une partie : sur ce clic, le CO₂ est divisé par deux.\n\n' +
              'Et pourtant attendez-vous à un degré de moins seulement : le Soleil a gagné en puissance pendant ces 119,6 Ma, et les deux effets se compensent presque exactement. C\'est le thermostat carbone qui travaille — la compensation dont l\'Archéen était incapable.'
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
            'Le CO₂ passe sous les 400 ppm. Encore trois quarts de degré de moins — mais dans le modèle, la ' +
            'glace ne prend toujours pas.',

            'La glaciation du Karoo — le modèle ne bascule PAS\n\n' +
            'Le CO₂ atteint ~280 ppm et le méthane le ppm et demi. La littérature y place la plus longue ère ' +
            'glaciaire du Phanérozoïque (Montañez 2007) — causée par des arbres.\n\n' +
            'Le modèle, lui, reste vers 18 °C sans glace : à peine un dixième de degré de moins. Il est trop ' +
            'chaud ici pour franchir le seuil glace-albédo — un écart à la littérature, pas un résultat.',

            'Fin du Karoo — ça va RÉCHAUFFER, beaucoup\n\n' +
            'Les forêts humides du Carbonifère s\'effondrent, la Pangée s\'assèche, l\'enfouissement de ' +
            'carbone s\'arrête et le volcanisme reprend la main : le CO₂ repart vers le millier de ppm.\n\n' +
            'Ce clic vous emmène aux portes de la crise permienne, avec six degrés gagnés. ' +
            'Ce qui a mis plus de 100 Ma à refroidir est défait en 42.'
        ]
    },
    '💀': {
        '💫':
            'Trapps de Sibérie — ça va RÉCHAUFFER, un peu\n\n' +
              'Des éruptions gigantesques pendant des centaines de milliers d\'années. Le soufre refroidit quelques années, le CO₂ réchauffe pour des dizaines de milliers d\'années : c\'est le second qui l\'emporte, avec l\'anoxie des océans et la plus grande extinction connue.\n\n' +
              'Sur ce pas le CO₂ gagne encore un quart, et près de deux degrés. L\'extinction, elle, ne se lit pas dans une moyenne de température — c\'est la limite de l\'exercice.'
    },
    '🦕': {
        '💫':
            'Un monde chaud qui le reste — presque rien ne va bouger\n\n' +
              'Pas de calotte permanente, un gradient équateur-pôle faible, un CO₂ élevé entretenu par le volcanisme de l\'ouverture de l\'Atlantique.\n\n' +
              'Ce clic laisse passer 100 Ma sans changer la composition : seul le Soleil ajoute un peu plus d\'un degré. Sur toute la frise, c\'est l\'un des pas les plus stables.',
        '🎇':
            'Impact de Chicxulub — ce clic change d\'époque\n\n' +
              'Poussières et aérosols occultent le Soleil quelques années : photosynthèse interrompue, chaînes alimentaires effondrées.\n\n' +
              'Ce que vous verrez après le clic n\'est pas le nuage d\'impact (quelques années, hors de portée d\'un pas de 100 Ma) mais le monde d\'après : un CO₂ plus bas d\'un quart et près de neuf degrés en moins. C\'est le Cénozoïque qui commence.'
    },
    '🦤': {
        '💫':
            'Vers l\'optimum éocène — ça va RÉCHAUFFER\n\n' +
              'Après la crise K-Pg le CO₂ ne descend pas : il remonte — multiplié par 1,4 au bout de ce clic, pour un degré et demi de plus. Vous arrivez à −56 Ma, au PETM, l\'entrée du monde le plus chaud du Cénozoïque.\n\n' +
              'La longue descente vers les glaciations viendra APRÈS, quand l\'Himalaya se soulèvera et se mettra à pomper le CO₂. Pas sur ce clic-ci.'
    },
    '🐊': {
        '💫':
            'L\'Himalaya se soulève — ça va REFROIDIR\n\n' +
              'La collision Inde-Asie expose sans cesse des roches fraîches à la pluie. L\'altération s\'emballe et pompe le CO₂ pendant des millions d\'années (Raymo & Ruddiman 1992).\n\n' +
              'Sur ce clic le CO₂ est presque divisé par deux et la température perd deux degrés : le monde le plus chaud du Cénozoïque commence sa descente, celle qui mène aux calottes.'
    },
    'hysteresis 2': {
        '⛰':
            'Au seuil de la calotte antarctique — ce clic franchit\n\n' +
              'Le CO₂ est passé sous la valeur en dessous de laquelle une calotte peut tenir sur l\'Antarctique. Comme au Sturtien, le franchissement ne sera pas progressif.\n\n' +
              'Dans cette époque-ci rien ne bougera : l\'effet est de l\'autre côté. Le clic fait perdre un peu plus de deux degrés, mais la glace n\'atteint qu\'un pour cent de la surface : le modèle n\'a pas de calotte continentale, et la vraie bascule Oi-1 lui échappe (DeConto & Pollard 2003).'
    },
    '🏔': {
        '💫': [
            'La calotte antarctique recule\n\n' +
              'La composition est presque figée sur ce pas ; seul le Soleil ajoute un peu. Mais la calotte de l\'Oligocène basal est plus grande que ce que le climat calculé peut nourrir : son bord fond, elle recule vers le pôle.\n\n' +
              'Attendez-vous à un climat à peine plus chaud.',

            'Vers le Quaternaire — ça va REFROIDIR un peu\n\n' +
              'Ce clic amène à la base du Quaternaire : le CO₂ tombe de moitié, mais la calotte antarctique, qui continue de reculer, compense une partie du refroidissement.\n\n' +
              'Surtout, l\'orbite de la Terre entre dans le calcul : c\'est elle qui, au Quaternaire, fera naître puis fondre les calottes du nord.'
        ]
    },
    '🦣': {
        // Un récit par clic et par chemin (index = clic à venir) ; les chiffres sont lus à l'affichage.
        '🐾': ['Pas à pas — d\'abord le saut jusqu\'aux plus vieilles carottes de glace\n\n' +
              'Avant 800 000 ans, aucune carotte : le CO₂ n\'est pas connu cycle par cycle. Ce premier clic franchit donc d\'un coup ' +
              '1,8 million d\'années, jusqu\'au plus vieil air piégé dans la glace antarctique.\n\n' +
              'Ensuite, chaque clic avance de 20 000 ans — un cycle de précession, une demi-oscillation de l\'obliquité — avec le CO₂ ' +
              'et le méthane mesurés à cette date.']
            .concat(Array(39).fill('Pas à pas — 20 000 ans de plus\n\n' +
              'Le CO₂ et le méthane sont ceux des carottes à la date où le clic arrive, l\'orbite celle de cette date. Quand l\'été ' +
              'boréal faiblit et que le CO₂ baisse, la neige des terres arctiques survit à l\'été : une calotte peut naître, puis ' +
              's\'épaissir de quelques centimètres de glace par an. Quand l\'été revient, sa marge fond.\n\n' +
              'Comparez la courbe orange à la cyan dans l\'onglet Histoire : c\'est ce chemin qu\'elles partagent.'),
            ['La déglaciation — vers l\'Holocène\n\n' +
              'L\'été boréal est fort et le CO₂ remonte vers 280 ppm : les calottes du nord fondent par leur marge.\n\n' +
              'Ce qui reste de glace au nord passe dans l\'Holocène, et le refroidit d\'autant.']),
        '🦘': [
            'Le saut — jusqu\'au dernier maximum glaciaire\n\n' +
              'Un seul clic franchit le Quaternaire entier : 2,56 millions d\'années et des dizaines de cycles glaciaires. Il arrive ' +
              'au plus froid du dernier cycle, il y a 21 000 ans, avec le CO₂ et le méthane des carottes à cette date. Les calottes ' +
              'ont tout ce temps pour se mettre en équilibre avec ce climat.\n\n' +
              'C\'est le raccourci : la courbe n\'est pas suivie, mais l\'état d\'arrivée est celui d\'un âge glaciaire.',

            'La déglaciation — vers l\'Holocène\n\n' +
              'L\'été boréal est fort et le CO₂ remonte : les calottes du nord fondent par leur marge, l\'Antarctique reste.\n\n' +
              'L\'Holocène commence avec la glace que ce clic n\'a pas eu le temps de fondre : les calculs suivants partent de cet ' +
              'état, pas d\'une graine posée.'
        ]
    },
    '🛖': {
        '💫': [
            'Près de quatre mille ans — et rien ne bougera\n\n' +
              'Environ 280 ppm de CO₂, une température qui ne varie pas d\'un dixième de degré. C\'est la fenêtre climatique dans laquelle tiennent l\'agriculture et toutes les civilisations humaines.\n\n' +
              'Ici, la stabilité EST le résultat : après quatre milliards d\'années de secousses, le modèle ne trouve plus rien à dire.',

            'Encore quatre mille ans de calme\n\n' +
              'Même composition, même température, au dixième de degré près. Sur toute la frise, c\'est l\'époque où il se passe le moins de choses — et c\'est précisément ce qui la rend remarquable.',

            'Dernier pas — 1750, la veille de l\'industrie\n\n' +
              'Le CO₂ de 1750 (277 ppm, Law Dome) est même un peu sous la moyenne holocène : deux dixièmes de degré de plus seulement, qui viennent du Soleil. Rien qui saute aux yeux.\n\n' +
              'Le clic vous dépose à l\'entrée de l\'ère industrielle, et pour la première fois le forçage ne viendra ni de la géologie, ni de l\'astronomie, ni de la biosphère.'
        ]
    },
    '🚂': {
        '💫': [
            'Premier siècle industriel — presque rien encore\n\n' +
              '1750 → 1875 : le charbon brûle, mais les quantités restent petites devant la masse de l\'atmosphère. Attendez-vous à une composition et à une température quasi inchangées.\n\n' +
              'Le signal n\'est pas encore sorti du bruit — ce qui explique qu\'on ait mis si longtemps à le voir.',

            'Second siècle — cette fois ça se voit\n\n' +
              '1875 → 2000 : le pétrole s\'ajoute au charbon. Le CO₂ passe de 277 à 370 ppm et la température gagne sept dixièmes de degré sur ce seul clic — la mesure en donne neuf (Copernicus) : le modèle chauffe un peu trop peu.\n\n' +
              'Le carbone enfoui au Carbonifère est renvoyé dans l\'atmosphère en deux siècles — le pas de temps le plus court de toute la frise, et le plus rapide en degrés par million d\'années.'
        ]
    },
    '📱': {
        '🌈':
            'Plus une tonne de CO₂ pendant 25 ans\n\n' +
              'Rien n\'est injecté : seuls les puits travaillent. L\'océan continue de dissoudre le CO₂ en trop, les forêts de le stocker — de moins en moins vite à mesure que l\'écart se réduit.\n\n' +
              'Le CO₂ redescend, mais lentement, et la température presque pas : ce qui a été émis reste dans l\'air pour des siècles.',
        '⛽':
            'La voie optimiste : moitié moins tous les 25 ans\n\n' +
              'Après les émissions mesurées de 2000-2025, chaque tranche émet la moitié de la précédente : 21 GtCO₂ par an en 2025-2050, 10 ensuite, puis 5… le rythme tend vers zéro sans jamais l\'atteindre.\n\n' +
              'Le CO₂ ajouté ne reste pas entièrement dans l\'air : l\'océan en dissout une partie (loi de Henry, freinée par la chimie des carbonates qui sature) et les forêts en stockent une autre (elles poussent plus vite avec plus de CO₂, effet qui sature aussi). Ce que vous lirez après le clic sort des équations.',
        '🛢':
            'Comme maintenant, sans fin\n\n' +
              'Le rythme actuel, environ 41 GtCO₂ par an (Global Carbon Budget 2024), tenu tel quel : 1040 GtCO₂ par tranche de 25 ans.\n\n' +
              'Les puits océan et forêts ne suivent pas : ils saturent, donc la PART qui reste dans l\'air augmente d\'une tranche à l\'autre, même à émissions constantes.',
        '🪾':
            'Le pire : on ne freine jamais\n\n' +
              'D\'emblée une fois et demie le bidon, 62 GtCO₂ par an en 2025-2050, puis 10 % de plus à chaque tranche de 25 ans : 69, 76, 83… jusqu\'à 162 GtCO₂ par an en 2275-2300.\n\n' +
              'Ce n\'est pas une prévision : c\'est la borne mécanique du geste, pour voir jusqu\'où les équations vont quand les émissions ne cessent jamais de croître.'
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
    // Les écarts : ± 1σ de la courbe cyan (tC) et fourchette des sources de l'époque (tCRepere). Le survol court
    // n'en montre que les centres (epochSeedLabel).
    const t = fmtRange(lit.tC.map(function (v) { return Number(v.toFixed(1)); }), '°C');
    const co2 = fmtRange(lit.co2, 'ppm');
    const ch4 = fmtRange(lit.ch4, 'ppm');
    lines.push('T ' + t + ' (courbe cyan ± 1σ)');
    lines.push('repère ' + fmtRange(lit.tCRepere, '°C') + ' — ' + lit.src.tCRepere);   // statut ✅ 🧮 ⚠️ 🔀 + source
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

/** Survol court d'une époque de la frise : « graine init [repère] », sans les écarts (ils sont dans l'alt2sec).
 *  Graine = 🌡️🧮 de la config (courbe cyan à ▶) ; repère = centre de tCRepere, avec son statut (✅ mesure, 🧮 équation,
 *  ⚠️ non sourcé, 🔀 repère d'hystérésis) : un repère non sourcé ne se donne pas pour de la littérature. */
window.epochSeedLabel = function (epochId) {
    const B = window.BENCH_LIT_BY_EPOCH_ID[epochId], r = B.tCRepere;
    return 'graine ' + (epochRowById(epochId)['🌡️🧮'] - 273.15).toFixed(1) + ' °C [' + ((r[0] + r[1]) / 2).toFixed(1) + ' °C '
        + B.src.tCRepere.split(' ')[0] + ']';
};

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

/** État 🔁 que le PROCHAIN clic sur `eventKey` appliquera (index = 📿💫), ou null ; sur une époque à chemins (🕰.🛤), celui du
 *  chemin de ce bouton. */
function nextCycleState(epochId, eventKey) {
    const row = epochRowById(epochId);
    const W = row['🕰'];
    const states = ('🛤' in W && eventKey in W['🛤']) ? W['🛤'][eventKey]['🔁'] : (Array.isArray(W['🔁']) ? W['🔁'] : null);
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
    const state = nextCycleState(epochId, eventKey);
    const changes = [];
    let warmer = 0; // > 0 attendu plus chaud, < 0 plus froid

    // Durée de CE clic : sur l'entrée de séquence (ou l'action de la tranche, 📱) — CLICS.pas.
    const stepMa = window.CLICS.pas(eventKey);
    changes.push(stepMa >= 1 ? '+' + (Math.round(stepMa * 10) / 10) + ' Ma' : '+' + Math.round(stepMa * 1e6).toLocaleString('fr-FR') + ' ans');

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
    }

    // Orbite à la date où le clic arrive (La2004, API_BILAN/physics/orbite.js) : obliquité et insolation du solstice d'été à
    // 65° N, dans la validité de la solution (−51 Ma → aujourd'hui). Le clic qui termine l'époque arrive à son ◀ (le moteur
    // calcule là), pas au-delà. L'insolation ne vote pour l'effet attendu que dans l'horizon de phase de la solution : au-delà
    // de ~20 Ma, la phase de la précession et de l'obliquité est incertaine (CO2/static/astronomie.js), sa valeur à une date
    // n'annonce rien — elle reste affichée.
    const HORIZON_PHASE_ANS = 20e6;
    const ageAvant = window.INTERIEUR.ageCourant(window.DATA);
    const ageApres = Math.max(ageAvant - stepMa * 1e6, window.INTERIEUR.ageDe(row, row['◀']));
    if (window.ORBITE.valide(ageAvant) && window.ORBITE.valide(ageApres)) {
        const eps = [window.ORBITE.obliquiteDeg(ageAvant), window.ORBITE.obliquiteDeg(ageApres)];
        const q65 = [window.ORBITE.insolation65N(ageAvant), window.ORBITE.insolation65N(ageApres)];
        if (eps[0].toFixed(2) !== eps[1].toFixed(2)) {
            changes.push('obliquité ' + eps[0].toFixed(2).replace('.', ',') + '° → ' + eps[1].toFixed(2).replace('.', ',') + '°');
        }
        if (Math.round(q65[0]) !== Math.round(q65[1])) {
            changes.push('insolation d\'été à 65° N ' + Math.round(q65[0]) + ' → ' + Math.round(q65[1]) + ' W/m²');
            if (ageAvant <= HORIZON_PHASE_ANS) warmer += (q65[1] > q65[0] ? 1 : -1);
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
    if (eventKey === '☄️') {
        changes.push('+' + window.CLICS.eauDuClic().toExponential(1) + ' kg d\'eau');   // masse portée par l'entrée de 🕰.order
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
