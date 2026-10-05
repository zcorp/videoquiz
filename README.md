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

La démo conserve les quiz, résultats et corrections personnelles des quiz progressifs dans le `localStorage` du navigateur; les corrections sont réutilisées lors des tentatives suivantes, mais ne sont révélées qu’après validation de la réponse personnelle. Les réponses personnelles repartent de zéro. Arrêter le conteneur ne supprime pas ces données.

La mesure d’audience Google Analytics 4 (G-8WSJCE0XQM) est soumise au choix explicite du visiteur. Le tag est chargé uniquement après « Accepter »; « Refuser » est mémorisé et les préférences restent accessibles au pied de page. Seules les vues de sections sont envoyées par l’application; ni les réponses ni le contenu saisi ne sont transmis. Désactiver aussi la mesure améliorée dans les paramètres du flux GA4 pour empêcher la collecte automatique d’événements supplémentaires. Le refus ou le retrait du consentement bloque les envois futurs. Il ne faut pas tester le consentement en envoyant de véritables réponses ou informations personnelles.

## Déploiement GitHub Pages

Consulter [DEPLOYMENT.md](DEPLOYMENT.md) pour la procédure complète. Le workflow `.github/workflows/demo-pages.yml` :

1. installe les dépendances uniquement sur le runner GitHub;
2. exécute `npm run build:demo` depuis `frontend/`;
3. publie uniquement `frontend/demo-dist`.

Il ne construit ni ne déploie Spring Boot, MongoDB, Docker Compose ou le frontend de production.

URL attendue :

```text
https://zcorp.github.io/videoquiz/
```

## Contenu de la démo

Consulter [FEATURES.md](FEATURES.md) pour le catalogue fonctionnel détaillé et ses limites.

La démo utilise React, Vite, React Router, `HashRouter` et CoreUI pour ses composants d’interface. Elle propose une bibliothèque filtrable, un dashboard, des QCM thématiques, un lecteur vidéo, une progression locale et des quiz créés dans le navigateur. Dans « Vos entraînements », les filtres sont suivis d’une vue maître-détail : liste scrollable à gauche, évolution du quiz sélectionné à droite, puis empilement des deux zones sur mobile. La navigation, les cartes, formulaires, boutons, badges, indicateurs de progression et pied de page s’appuient sur CoreUI, avec une couche visuelle personnalisée et responsive. Le pied de page attribue les droits à ZCOORE, avec l’année courante. CoreUI est limité à la démo et n’est pas ajouté au frontend de production.

La bibliothèque vidéo rassemble 35 vidéos YouTube autour de plusieurs thèmes : code de la route, culture générale, histoire, géographie, sciences, animaux, nature, football, cinéma, animation, mythologie et sport. Chaque ID vidéo n’apparaît qu’une fois dans le catalogue et ne peut être associé qu’à un quiz, quel que soit le thème ou le mode choisi. La règle est vérifiée dans le formulaire et au moment de l’enregistrement; une vidéo déjà associée renvoie vers le quiz concerné. La bibliothèque dispose d’une recherche, d’un filtre par thème et d’une pagination. L’action **Associer à un QCM** ouvre le créateur en mode QCM express, avec la vidéo, le titre et le thème préremplis; les paramètres de grille restent modifiables. Deux liens transmis sans titre précis sont rangés dans « À classer ». Ces vidéos tierces restent hébergées par leurs auteurs sur YouTube et ne sont pas présentées comme des contenus officiels.

L’accueil propose aussi des raccourcis vers les thèmes vidéo les plus représentés. Ils ouvrent la collection avec le thème déjà filtré; les filtres de la bibliothèque de quiz restent distincts des thèmes de vidéos disponibles.

Sur mobile, le lecteur reste dans la partie supérieure de l’écran pendant que le panneau de question et d’auto-correction défile indépendamment; les chapitres préparés forment une rangée horizontale. Sur tablette, la colonne vidéo reste collée sous la navigation pendant le défilement des questions.
