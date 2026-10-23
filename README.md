# Video Quiz demo

Ce dépôt publie uniquement la démo statique Video Quiz sous `frontend/demo/`. Le backend Spring Boot, MongoDB, Docker Compose full-stack et le frontend de production ne font pas partie de ce dépôt de déploiement.

## Lancement local avec Docker

Node.js et `frontend/node_modules` ne sont pas nécessaires sur l’hôte. Depuis la racine :

```sh
docker compose -f docker-compose.demo.yml up --build
```

Ouvrir http://localhost:4174. Arrêter avec :

```sh
docker compose -f docker-compose.demo.yml down
```

Ou utiliser le raccourci :

```sh
./run-demo.sh
```

La démo conserve les quiz, résultats, corrections personnelles et reprises de quiz dans le `localStorage` du navigateur. Depuis la carte « Vos données » du dashboard, l’utilisateur peut télécharger un fichier de transfert puis l’importer dans un autre navigateur; les appareils ne se synchronisent pas automatiquement. Si le fichier et l’appareil contiennent des progressions différentes pour un même quiz, l’utilisateur choisit celle à conserver. Arrêter le conteneur ne supprime pas les données du navigateur.

La mesure d’audience Google Analytics 4 (G-8WSJCE0XQM), destinée à améliorer l’expérience utilisateur, est soumise au choix explicite du visiteur. Le tag est chargé uniquement après « Accepter »; « Refuser » est mémorisé et les préférences restent accessibles au pied de page. Seules les vues de sections sont envoyées par l’application; ni les réponses ni le contenu saisi ne sont transmis. Désactiver aussi la mesure améliorée dans les paramètres du flux GA4 pour empêcher la collecte automatique d’événements supplémentaires. Le refus ou le retrait du consentement bloque les envois futurs. Il ne faut pas tester le consentement en envoyant de véritables réponses ou informations personnelles.

## Déploiement GitHub Pages

Consulter [DEPLOYMENT.md](DEPLOYMENT.md) pour la procédure complète. Le workflow `.github/workflows/demo-pages.yml` :

1. installe les dépendances uniquement sur le runner GitHub;
2. exécute `npm run build:demo` depuis `frontend/`;
3. publie uniquement `frontend/demo-dist`.

Il ne construit ni ne déploie Spring Boot, MongoDB, Docker Compose ou le frontend de production.

## Référencement et découverte

La stratégie de référencement de la démo, ses choix techniques, ses limites et son plan de mesure sont documentés dans [SEO_STRATEGY.md](SEO_STRATEGY.md). L’accueil et le tutoriel public sont déclarés dans le sitemap; le tutoriel est accessible à l’adresse https://www.videoquiz.fr/tutoriel/. La propriété du domaine doit être vérifiée manuellement dans Google Search Console et Bing Webmaster Tools pour suivre l’indexation.

URL publique canonique :

```text
https://www.videoquiz.fr/
```

URL GitHub Pages du dépôt, en cas de retrait du domaine personnalisé :

```text
https://zcorp.github.io/videoquiz/
```

## Contenu de la démo

Consulter [FEATURES.md](FEATURES.md) pour le catalogue fonctionnel détaillé et ses limites.

La démo utilise React, Vite, React Router, `HashRouter` et CoreUI pour ses composants d’interface. Elle propose une bibliothèque filtrable, un dashboard, des QCM thématiques, un lecteur vidéo, une page de suivi avec graphiques par quiz, une progression locale et des quiz créés dans le navigateur. L’accueil propose un tutoriel en quatre étapes, la création directe d’un quiz et un carrousel manuel présentant des vidéos de quiz sur plusieurs thèmes ainsi que le cycle vidéo, QCM et progression; ses slides ouvrent les quiz ou le tutoriel. Le tutoriel précise que l’utilisateur peut partir d’une vidéo YouTube et que le lecteur peut être adapté selon la plateforme. Le dashboard conserve les quatre indicateurs et le graphique interactif par entraînement sur ordinateur; sur mobile et tablette, il reste allégé, avec les graphiques accessibles depuis la page « Suivi ». Sur mobile et tablette, une barre fixe en bas donne accès à « Découvrir », « Vidéos », « Suivi » et « Créer »; elle tient compte de la zone de sécurité de l’écran et se masque pendant un quiz ou la création d’un quiz. Une carte visible du dashboard permet de télécharger ses données ou d’en importer sur un autre appareil; après l’import, un résumé indique les données ajoutées et propose de reprendre les quiz transférés. Le tutoriel présente aussi ce parcours en trois étapes. La page « À propos & aide » explique la démarche et les données locales, puis donne des accès directs aux quiz, aux vidéos et au suivi; l’adresse de contact `contact@videoquiz.fr` y est accessible ainsi que dans le pied de page. La navigation, les cartes, formulaires, boutons, badges, indicateurs de progression et pied de page s’appuient sur CoreUI, avec une couche visuelle personnalisée et responsive. Le pied de page attribue les droits à ZCOORE, avec l’année courante. CoreUI est limité à la démo et n’est pas ajouté au frontend de production.

La bibliothèque vidéo rassemble 35 vidéos YouTube autour de plusieurs thèmes : code de la route, culture générale, histoire, géographie, sciences, animaux, nature, football, cinéma, animation, mythologie et sport. Chaque ID vidéo n’apparaît qu’une fois dans le catalogue et ne peut être associé qu’à un quiz, quel que soit le thème ou le mode choisi. La règle est vérifiée dans le formulaire et au moment de l’enregistrement; une vidéo déjà associée renvoie vers le quiz concerné. La bibliothèque dispose d’une recherche, d’un filtre par thème et d’une pagination. L’action **Associer à un QCM** ouvre le créateur en mode QCM express, avec la vidéo, le titre et le thème préremplis; les paramètres de grille restent modifiables. Deux liens transmis sans titre précis sont rangés dans « À classer ». Ces vidéos tierces restent hébergées par leurs auteurs sur YouTube et ne sont pas présentées comme des contenus officiels.

Les transcriptions et les questions générées sont traitées uniquement par l’équipe éditoriale; elles ne sont pas chargées dans l’application. Seuls les QCM validés par un responsable éditorial sont publiés dans le catalogue de la démo. Le flux de validation et de publication est décrit dans [editorial/README.md](editorial/README.md).

L’accueil propose aussi des raccourcis vers les thèmes vidéo les plus représentés. Ils ouvrent la collection avec le thème déjà filtré; les filtres de la bibliothèque de quiz restent distincts des thèmes de vidéos disponibles.

Sur mobile, le lecteur reste dans la partie supérieure de l’écran pendant que le panneau de question et d’auto-correction défile indépendamment; les chapitres préparés forment une rangée horizontale. Sur tablette, la colonne vidéo reste collée sous la navigation pendant le défilement des questions.
