const choice = (id, prompt, at, options, answer, explanation) => ({
  id, prompt, at, type: 'choice', options, answer, explanation,
});

const roadQuestion = (id, prompt, options, answer, explanation, topic, index) => ({
  id,
  prompt,
  at: index * 60,
  type: 'multi_choice',
  topic,
  options,
  answer,
  explanation,
});

const roadCodeQuestions = [
  roadQuestion('road-01', 'À une intersection sans panneau ni marquage, quelle règle s’applique en général ?', ['Priorité au véhicule le plus rapide', 'Priorité à droite', 'Priorité au véhicule le plus lourd', 'Priorité à gauche'], [1], 'En l’absence de signalisation contraire, la priorité à droite s’applique.', 'PRIORITÉS', 0),
  roadQuestion('road-02', 'À l’approche d’un passage piéton, quelles attitudes sont correctes ?', ['Ralentir si un piéton manifeste l’intention de traverser', 'S’arrêter pour le laisser passer', 'Klaxonner pour l’inviter à attendre'], [0, 1], 'Le conducteur doit céder le passage au piéton engagé ou manifestant clairement l’intention de traverser.', 'USAGERS VULNÉRABLES', 1),
  roadQuestion('road-03', 'À l’entrée d’un carrefour à sens giratoire avec « Cédez le passage », qui est prioritaire ?', ['Les véhicules déjà engagés dans l’anneau', 'Les véhicules qui entrent toujours', 'Le véhicule qui arrive de droite, dans tous les cas'], [0], 'La signalisation « Cédez le passage » impose de laisser passer les véhicules circulant sur l’anneau.', 'PRIORITÉS', 2),
  roadQuestion('road-04', 'Au panneau STOP, que faut-il faire ?', ['Marquer un arrêt complet à la ligne', 'Ralentir fortement sans nécessairement s’arrêter', 'Céder le passage après l’arrêt'], [0, 2], 'Le STOP impose un arrêt complet, puis de céder le passage avant de repartir.', 'SIGNALISATION', 3),
  roadQuestion('road-05', 'Un feu passe à l’orange fixe. Quelle conduite adopter ?', ['S’arrêter si l’arrêt peut se faire sans danger', 'Accélérer systématiquement', 'Franchir seulement si l’arrêt présente un danger'], [0, 2], 'L’orange fixe impose l’arrêt, sauf si le véhicule ne peut plus s’arrêter dans des conditions de sécurité suffisantes.', 'SIGNALISATION', 4),
  roadQuestion('road-06', 'Un véhicule prioritaire approche avec avertisseurs spéciaux en action. Que faire ?', ['Faciliter son passage sans créer de danger', 'S’arrêter immédiatement au milieu de la chaussée', 'Ne jamais franchir un feu rouge, même pour libérer le passage'], [0, 2], 'Il faut faciliter le passage du véhicule prioritaire, tout en respectant les règles de sécurité et la signalisation.', 'PRIORITÉS', 5),
  roadQuestion('road-07', 'Sur autoroute, à quoi sert la voie d’insertion ?', ['À accélérer pour atteindre une allure adaptée', 'À s’insérer sans contrôler les autres voies', 'À céder le passage aux véhicules déjà sur l’autoroute'], [0, 2], 'La voie d’insertion permet d’adapter sa vitesse; le conducteur entrant doit céder le passage aux usagers déjà engagés.', 'AUTOROUTE', 6),
  roadQuestion('road-08', 'Que signifie une ligne continue ?', ['Il est interdit de la franchir ou de la chevaucher pour dépasser', 'Elle peut être franchie si la route semble libre', 'Un dépassement reste possible si le véhicule devant est lent'], [0], 'Une ligne continue ne doit pas être franchie ni chevauchée, hors exceptions prévues par le code.', 'MARQUAGES', 7),
  roadQuestion('road-09', 'Avant un dépassement, quels contrôles sont nécessaires ?', ['Vérifier la visibilité et l’absence de danger', 'Contrôler les rétroviseurs et l’angle mort', 'Signaler son intention et se rabattre sans gêner'], [0, 1, 2], 'Un dépassement sûr exige observation, signalement, visibilité suffisante et rabattement sans danger.', 'DÉPASSEMENT', 8),
  roadQuestion('road-10', 'Dans quelles situations faut-il augmenter la distance de sécurité ?', ['Sur chaussée mouillée', 'Lorsque la visibilité est réduite', 'Quand le véhicule suivi roule lentement'], [0, 1], 'L’adhérence et le temps de perception se dégradent avec la pluie et la visibilité réduite; il faut augmenter la marge.', 'DISTANCES', 9),
  roadQuestion('road-11', 'Sur route sèche, la distance de sécurité minimale correspond à environ…', ['Une seconde', 'Deux secondes', 'Une longueur de voiture'], [1], 'La règle pratique est de conserver au moins deux secondes avec le véhicule qui précède.', 'DISTANCES', 10),
  roadQuestion('road-12', 'En cas de pluie, quelle règle de vitesse s’applique ?', ['Les vitesses maximales sont abaissées sur certaines voies', 'Les limitations ne changent jamais', 'Je dois adapter davantage ma vitesse à l’adhérence'], [0, 2], 'Par temps de pluie, certaines limites réglementaires sont réduites; il faut aussi adapter sa vitesse aux conditions réelles.', 'VITESSE', 11),
  roadQuestion('road-13', 'Lorsque la visibilité est inférieure à 50 mètres, quelle est la vitesse maximale ?', ['50 km/h', '70 km/h', '90 km/h'], [0], 'En France, la limite est de 50 km/h lorsque la visibilité est inférieure à 50 mètres, sur tous les réseaux.', 'VITESSE', 12),
  roadQuestion('road-14', 'Sur autoroute, un conducteur en permis probatoire doit normalement respecter quelle limite par temps sec ?', ['110 km/h', '120 km/h', '130 km/h'], [0], 'La vitesse maximale sur autoroute est généralement de 110 km/h pour un conducteur en période probatoire.', 'VITESSE', 13),
  roadQuestion('road-15', 'À quoi sert la règle du corridor de sécurité à l’approche d’un véhicule arrêté sur la bande d’arrêt d’urgence ?', ['S’écarter si possible', 'Réduire sa vitesse', 'Garder sa voie et son allure pour passer plus vite'], [0, 1], 'Il faut ralentir et, si possible sans danger, s’écarter du véhicule d’intervention ou en panne.', 'AUTOROUTE', 14),
  roadQuestion('road-16', 'Sur autoroute, quand peut-on utiliser la bande d’arrêt d’urgence ?', ['En cas de nécessité absolue', 'Pour téléphoner', 'Pour éviter un ralentissement'], [0], 'La bande d’arrêt d’urgence est réservée aux situations d’urgence et ne sert pas à s’arrêter par convenance.', 'AUTOROUTE', 15),
  roadQuestion('road-17', 'En entrant dans un tunnel, quels gestes sont appropriés ?', ['Allumer les feux de croisement si nécessaire selon la signalisation et la visibilité', 'Respecter les distances et la signalisation', 'Faire demi-tour si la circulation ralentit'], [0, 1], 'Dans un tunnel, il faut suivre la signalisation, maintenir les distances et ne jamais faire demi-tour.', 'TUNNELS', 16),
  roadQuestion('road-18', 'En cas de panne sur autoroute, quelle séquence est la plus sûre ?', ['Se mettre à l’abri derrière la glissière si possible', 'Porter le gilet avant de sortir', 'Rester dans le véhicule sur la voie de circulation'], [0, 1], 'Il faut protéger les occupants, enfiler le gilet avant de sortir si possible et se placer derrière la glissière.', 'URGENCE', 17),
  roadQuestion('road-19', 'Le téléphone tenu en main au volant est-il autorisé à un feu rouge ?', ['Oui, si le véhicule est immobile au feu', 'Non, l’arrêt dans la circulation ne rend pas cet usage autorisé', 'Oui, uniquement pour lire un message'], [1], 'Le téléphone tenu en main reste interdit au volant, y compris lors d’un arrêt temporaire dans la circulation.', 'DISTRACTIONS', 18),
  roadQuestion('road-20', 'Quelles conséquences l’alcool peut-il avoir sur la conduite ?', ['Allongement du temps de réaction', 'Réduction du champ visuel', 'Amélioration de l’évaluation des distances'], [0, 1], 'L’alcool altère les capacités, le champ visuel et les réflexes; il n’améliore jamais la conduite.', 'ÉTAT DU CONDUCTEUR', 19),
  roadQuestion('road-21', 'Pour un conducteur en permis probatoire, quel seuil d’alcoolémie est applicable en France ?', ['0,2 g/L de sang', '0,5 g/L de sang', '0,8 g/L de sang'], [0], 'Le seuil applicable aux conducteurs en permis probatoire est de 0,2 g/L de sang; la règle la plus sûre reste de ne pas boire.', 'ÉTAT DU CONDUCTEUR', 20),
  roadQuestion('road-22', 'Pourquoi la fatigue est-elle dangereuse au volant ?', ['Elle peut provoquer des baisses de vigilance', 'Elle augmente le temps de réaction', 'La musique forte supprime ses effets'], [0, 1], 'La fatigue diminue l’attention et allonge les réactions; seul le repos permet de récupérer.', 'ÉTAT DU CONDUCTEUR', 21),
  roadQuestion('road-23', 'Lors d’un long trajet, quelle habitude de prévention est recommandée ?', ['Faire une pause environ toutes les deux heures', 'Attendre les premiers signes de somnolence pour prévoir une pause', 'S’arrêter dans un endroit sûr pour se reposer'], [0, 2], 'Une pause régulière, souvent recommandée toutes les deux heures, aide à prévenir la baisse de vigilance.', 'ÉTAT DU CONDUCTEUR', 22),
  roadQuestion('road-24', 'Avant un trajet, quels contrôles simples améliorent la sécurité ?', ['État et pression des pneus', 'Fonctionnement des feux', 'Niveau de carburant ou d’énergie et autonomie'], [0, 1, 2], 'Pneus, éclairage et autonomie font partie des vérifications utiles avant de prendre la route.', 'VÉHICULE', 23),
  roadQuestion('road-25', 'Le port de la ceinture de sécurité est-il nécessaire à l’arrière ?', ['Oui, les passagers doivent aussi la porter', 'Non, seulement à l’avant', 'Seulement hors agglomération'], [0], 'La ceinture est obligatoire pour les occupants aux places qui en sont équipées, à l’avant comme à l’arrière.', 'PASSAGERS', 24),
  roadQuestion('road-26', 'Comment transporter un enfant en voiture ?', ['Dans un dispositif adapté à sa morphologie, homologué et correctement installé', 'Sur les genoux d’un adulte', 'Avec la ceinture adulte seule, quel que soit son âge et sa taille'], [0], 'L’enfant doit être retenu par un dispositif adapté, homologué et installé conformément aux instructions.', 'PASSAGERS', 25),
  roadQuestion('road-27', 'Avant d’ouvrir une portière côté circulation, que faut-il faire ?', ['Contrôler rétroviseur et angle mort', 'Ouvrir rapidement pour prévenir les autres', 'Vérifier qu’aucun cycliste ou véhicule n’arrive'], [0, 2], 'Avant d’ouvrir, vérifier l’arrivée d’usagers, notamment des cyclistes, pour éviter une collision avec une portière.', 'USAGERS VULNÉRABLES', 26),
  roadQuestion('road-28', 'En dépassant un cycliste, quelle précaution est essentielle ?', ['Laisser un écart latéral suffisant', 'Klaxonner à proximité immédiate', 'Attendre si l’écart ne peut pas être respecté'], [0, 2], 'Il faut respecter la distance latérale réglementaire et attendre si le dépassement ne peut être fait sans danger.', 'USAGERS VULNÉRABLES', 27),
  roadQuestion('road-29', 'À l’approche d’un bus qui quitte son arrêt en agglomération et signale son départ, que faire ?', ['Faciliter son insertion en ralentissant si nécessaire', 'Accélérer pour le dépasser à tout prix', 'Garder une distance qui permet de réagir'], [0, 2], 'En agglomération, il faut faciliter le départ d’un autobus signalant qu’il quitte son arrêt, sans créer de danger.', 'USAGERS VULNÉRABLES', 28),
  roadQuestion('road-30', 'Que faut-il faire à l’approche d’un passage à niveau dont les barrières se ferment ?', ['S’arrêter avant la ligne d’arrêt', 'Contourner la barrière si aucun train n’est visible', 'Attendre la réouverture complète et le signal autorisant le passage', 'S’engager si le véhicule devant avance'], [0, 2], 'Il est interdit de franchir un passage à niveau lorsque les barrières se ferment ou sont fermées.', 'SIGNALISATION', 29),
  roadQuestion('road-31', 'Quels feux utiliser lorsque la visibilité est insuffisante ?', ['Les feux de croisement', 'Les feux de route si l’on risque d’éblouir les autres', 'Les feux adaptés aux conditions et à la signalisation'], [0, 2], 'Les feux doivent permettre de voir sans éblouir; les feux de route sont à éviter lorsqu’ils gênent autrui.', 'VISIBILITÉ', 30),
  roadQuestion('road-32', 'En cas de brouillard épais, comment adapter sa conduite ?', ['Réduire la vitesse', 'Augmenter les distances', 'Suivre de près les feux du véhicule précédent'], [0, 1], 'Le brouillard réduit la visibilité et la perception des distances; ralentir et augmenter l’intervalle est essentiel.', 'VISIBILITÉ', 31),
  roadQuestion('road-33', 'Le feu antibrouillard arrière peut-il être utilisé sous une forte pluie ?', ['Oui, systématiquement', 'Non, il risque d’éblouir; il est réservé au brouillard ou à la neige', 'Oui, en ville uniquement'], [1], 'Le feu antibrouillard arrière est réservé au brouillard ou à la neige, car il peut éblouir sous la pluie.', 'VISIBILITÉ', 32),
  roadQuestion('road-34', 'Dans une zone de rencontre, quelle règle générale s’applique ?', ['Les piétons peuvent circuler sur la chaussée et sont prioritaires', 'La vitesse est limitée à 20 km/h', 'Les véhicules ont priorité sur les piétons'], [0, 1], 'Dans une zone de rencontre, la vitesse est limitée à 20 km/h et les piétons sont prioritaires sur la chaussée.', 'ZONES DE CIRCULATION', 33),
  roadQuestion('road-35', 'Dans une zone 30, quel est le principe ?', ['La vitesse maximale est de 30 km/h', 'La chaussée peut être aménagée pour favoriser la cohabitation', 'Le piéton perd toujours sa priorité'], [0, 1], 'Une zone 30 limite la vitesse à 30 km/h et vise une circulation apaisée entre les usagers.', 'ZONES DE CIRCULATION', 34),
  roadQuestion('road-36', 'À l’approche d’un véhicule d’intervention arrêté avec feux allumés, que faire ?', ['Ralentir', 'S’écarter si cela peut être fait sans danger', 'Conserver sa vitesse pour ne pas gêner le trafic'], [0, 1], 'Ralentir et s’écarter si possible protège les personnes intervenant au bord de la route.', 'USAGERS VULNÉRABLES', 35),
  roadQuestion('road-37', 'Quand la chaussée est verglacée, quelles précautions prendre ?', ['Éviter les gestes brusques', 'Augmenter les distances de sécurité', 'Freiner fortement dans les virages'], [0, 1], 'Sur le verglas, accélérations, freinages et changements de direction doivent rester très progressifs.', 'ADHÉRENCE', 36),
  roadQuestion('road-38', 'Dans une forte descente, comment limiter l’échauffement des freins ?', ['Utiliser un rapport adapté et le frein moteur', 'Descendre au point mort', 'Maintenir une vitesse compatible avec la visibilité'], [0, 2], 'Un rapport adapté et le frein moteur aident à maîtriser la vitesse sans solliciter continuellement les freins.', 'CONDUITE', 37),
  roadQuestion('road-39', 'Avant de changer de direction, quelles actions sont nécessaires ?', ['Contrôler rétroviseurs et angle mort', 'Signaler le changement suffisamment tôt', 'Vérifier que la manœuvre ne met personne en danger'], [0, 1, 2], 'Observer, avertir et s’assurer que la manœuvre peut être réalisée sans danger sont indispensables.', 'MANŒUVRES', 38),
  roadQuestion('road-40', 'Vous manquez une sortie d’autoroute. Que devez-vous faire ?', ['Continuer jusqu’à la prochaine sortie', 'Reculer sur la bande d’arrêt d’urgence', 'Faire demi-tour au prochain terre-plein'], [0], 'Il faut poursuivre jusqu’à la prochaine sortie; marche arrière et demi-tour sur autoroute sont interdits.', 'AUTOROUTE', 39),
];

const demoQcm = (id, title, topic, description, videoId, questions) => ({
  id, title, topic, description, videoId, videoLabel: title, mode: 'qcm', questionCount: questions.length, maxOptions: 3, questions,
});

const historyQcm = demoQcm('history-reperes', 'Repères historiques essentiels', 'HISTOIRE', 'Une courte série pour réviser quelques dates et événements majeurs.', 'faQPgBDocVQ', [
  { id: 'history-q1', prompt: 'En quelle année débute la Révolution française ?', at: 18, type: 'multi_choice', options: ['1789', '1815', '1848'], explanation: 'La Révolution française débute en 1789.', answer: [0] },
  { id: 'history-q2', prompt: 'Quels événements appartiennent à la Seconde Guerre mondiale ?', at: 48, type: 'multi_choice', options: ['Le débarquement de Normandie', 'La chute de Constantinople', 'La libération de Paris'], explanation: 'Le débarquement et la libération de Paris ont lieu en 1944.', answer: [0, 2] },
]);

const scienceQcm = demoQcm('science-climat', 'Climat et énergie', 'SCIENCES', 'Un QCM rapide pour revoir quelques notions de climat et d’énergie.', 'KBTd5Vh-smw', [
  { id: 'science-q1', prompt: 'Quelles sources sont renouvelables ?', at: 16, type: 'multi_choice', options: ['Solaire', 'Charbon', 'Éolien'], explanation: 'Le solaire et l’éolien sont des sources renouvelables.', answer: [0, 2] },
  { id: 'science-q2', prompt: 'Quel gaz est principalement associé à la combustion des énergies fossiles ?', at: 52, type: 'multi_choice', options: ['Oxygène', 'Dioxyde de carbone', 'Hélium'], explanation: 'La combustion des énergies fossiles émet principalement du dioxyde de carbone.', answer: [1] },
]);

export const demoQuizzes = [
  {
    id: 'react-hooks', title: 'React Hooks, sans magie', topic: 'DÉVELOPPEMENT WEB',
    description: 'Repérer les bons outils pour gérer état et effets dans un composant.',
    videoId: 'TNhaISOUy6Q', videoLabel: 'React Hooks', mode: 'prepared',
    questions: [
      choice('react-q1', 'Quel hook conserve une valeur d’état et relance le rendu lorsqu’elle change ?', 42, ['useState', 'useRef', 'useMemo'], 0, 'useState conserve une valeur et déclenche un nouveau rendu lorsqu’elle change.'),
      choice('state-q1', 'Que provoque la mise à jour d’un state React ?', 68, ['Un nouveau rendu', 'Un rechargement complet', 'Une nouvelle route'], 0, 'Mettre à jour un state demande à React de recalculer le rendu du composant.'),
      { id: 'state-q2', prompt: 'Quel hook fournit une valeur initiale et son setter ?', at: 82, type: 'text', answer: 'useState', explanation: 'useState renvoie la valeur actuelle et une fonction qui permet de la mettre à jour.' },
      choice('react-q2', 'Quel hook synchronise un composant avec un système externe ?', 96, ['useEffect', 'useId', 'useContext'], 0, 'useEffect sert aux effets de bord, par exemple écouter un événement ou synchroniser une API du navigateur.'),
      { id: 'react-q3', prompt: 'Les dépendances indiquent quand un effet doit être…', at: 154, type: 'text', answer: 'recalculé', explanation: 'Les dépendances indiquent les valeurs dont dépend l’effet et quand il doit être recalculé.' },
    ],
  },
  {
    id: 'javascript-basics', title: 'JavaScript : les bons réflexes', topic: 'FONDAMENTAUX', mode: 'prepared',
    description: 'Trois arrêts sur image pour vérifier les bases du langage.',
    videoId: 'W6NZfCO5SIk', videoLabel: 'JavaScript Fundamentals',
    questions: [
      choice('js-q1', 'Quel mot-clé déclare une variable limitée au bloc ?', 60, ['var', 'let', 'global'], 1, 'let, comme const, est limité au bloc dans lequel il est déclaré.'),
      choice('js-q2', 'Quelle méthode retire le dernier élément d’un tableau ?', 112, ['shift()', 'pop()', 'slice()'], 1, 'pop() modifie le tableau et renvoie son dernier élément.'),
      { id: 'js-q3', prompt: 'Que renvoie typeof null ?', at: 182, type: 'text', answer: 'object', explanation: 'C’est une particularité historique de JavaScript : typeof null renvoie "object".' },
    ],
  },

  {
    id: 'code-route-40',
    title: 'Code de la route — examen blanc',
    topic: 'PERMIS B · 40 QUESTIONS',
    description: 'Série indépendante d’entraînement, non officielle : révisez les règles et corrigez chaque réponse avant de continuer.',
    videoId: 'Zk3dQsxtx1U',
    videoLabel: 'Examen blanc code de la route 2026',
    duration: '40 questions',
    exam: true,
    passMark: 35,
    questions: roadCodeQuestions,
  },
  historyQcm,
  scienceQcm,
];

export const roadCodeVideos = [
  { id: 'cKEKGGAronA', title: 'Test gratuit du code de la route 2026 · Série 312' },
  { id: '3VZpQzXkAAM', title: 'Test gratuit du code de la route 2026 · Série 311' },
  { id: '7OLEHdeh9K4', title: 'Code de la route · série complète', duration: '59:21' },
  { id: 'uZX19sZfB-4', title: 'Test 23 · Code de la route 2026 · 40 questions' },
  { id: '9lgAtRlJpV4', title: 'Test 22 · Code de la route 2026 · 40 questions' },
  { id: 'iy94NPyW5ko', title: 'Code de la route · examen blanc', duration: '45:49' },
  { id: 'tV8CYzqIDOA', title: 'Test Code de la route 2026 · Série 13 · 40 questions' },
  { id: 'D6cFQ971jOM', title: 'Test Code de la route 2026 · Série 12 · 40 questions' },
  { id: 'W3tKRBSbntE', title: 'Test Code de la route 2026 · Série 11 · 40 questions' },
  { id: 'kbm8WZ-jfOc', title: 'Test Code de la route 2026 · Série 10 · 40 questions' },
  { id: 'aQOBR12GPPY', title: 'Questions permis · 2026' },
  { id: '3_dY4HmrUIA', title: 'Code de la route 2026 · 40 questions' },
  { id: 'MeOl_iaymw4', title: 'Code de la route 2026 · Série de 40 questions' },
];

const additionalVideos = [
  { id: 'zGUxhs0gdLg', title: 'Quiz culture générale · Niveau facile #1 · 40 questions', theme: 'Culture générale' },
  { id: 'mpPtQWGNHkI', title: 'Devine les capitales · Quiz géographie · 35 questions', theme: 'Géographie' },
  { id: 'UW0gQE5v-fo', title: 'Quiz mythologie grecque · 40 questions', theme: 'Mythologie' },
  { id: '8NuORh9qvs8', title: 'Quiz système solaire · 40 questions', theme: 'Sciences' },
  { id: 'faQPgBDocVQ', title: 'Culture générale · Édition histoire · 40 questions', theme: 'Histoire' },
  { id: 'sBFQd3yB4Bs', title: 'Test animalier extrême · 35 questions + bonus', theme: 'Animaux' },
  { id: 'R5duVrQLza4', title: 'Quiz sur le corps humain · 40 questions + bonus', theme: 'Sciences' },
  { id: 'k_dqFN3N6z4', title: 'Défi footballistique · Devine le pays du joueur · 50 questions', theme: 'Football' },
  { id: 'XIpFP_D4Dc0', title: 'Quiz personnages historiques · 50 questions', theme: 'Histoire' },
  { id: 'iGrOHGENeOc', title: 'Quiz culture générale · Niveau difficile', theme: 'Culture générale' },
  { id: '9iolSECMWD4', title: 'Quiz spécial Coupe du Monde · Football', theme: 'Football' },
  { id: 'xKyrytWK4tg', title: 'Quiz spécial cinéma français · 30 questions', theme: 'Cinéma' },
  { id: 'R1N3Z6_esyI', title: 'Quiz culture générale · Niveau moyen #8', theme: 'Culture générale' },
  { id: 'm9yzeXOA7UY', title: 'Quiz spécial fruits', theme: 'Nature' },
  { id: '1JB7bdlXRvU', title: 'Quiz spécial monuments du monde', theme: 'Géographie' },
  { id: '7-gIBM2V6_0', title: 'Identifie 50 fruits', theme: 'Nature' },
  { id: 'HpHLn0mLcG0', title: 'Grand quiz années 80 · 50 questions', theme: 'Culture générale' },
  { id: 'R3ZEA8U0VeY', title: 'Identifie les personnages de dessins animés par leurs ombres', theme: 'Animation' },
  { id: 'wQgPfzuWmWQ', title: 'Vidéo de quiz à classer', duration: '11:47', theme: 'À classer' },
  { id: 'WhLXEsMsoiQ', title: 'Identifie 100 personnalités francophones', theme: 'Culture générale' },
  { id: 'dY7dDTZWUcg', title: 'Vidéo de quiz à classer', duration: '11:56', theme: 'À classer' },
  { id: '5C55d5UZbu8', title: 'Quiz 100% sport · 50 questions multi-sports', theme: 'Sport' },
];

const catalogVideos = [
  ...roadCodeVideos.map(video => ({ ...video, theme: 'Code de la route' })),
  ...additionalVideos,
];

export const videoLibrary = [...new Map(catalogVideos.map(video => [video.id, video])).values()];

export function getVideoUrl(videoId, seconds = 0, enableApi = false) {
  const playerOptions = enableApi ? `&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}` : '';
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&controls=1&disablekb=0&playsinline=1&start=${Math.max(0, Number(seconds) || 0)}${playerOptions}`;
}

export function formatTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export function formatChoiceLabel(index) {
  let value = Math.max(0, Math.floor(Number(index) || 0)) + 1;
  let label = '';
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + value % 26) + label;
    value = Math.floor(value / 26);
  }
  return label;
}