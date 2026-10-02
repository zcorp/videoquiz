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

La démo conserve les quiz et résultats dans le `localStorage` du navigateur; arrêter le conteneur ne supprime pas ces données.

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

La démo utilise React, Vite, React Router, `HashRouter` et CoreUI pour ses composants d’interface. Elle propose une bibliothèque filtrable, un dashboard, des QCM thématiques, un lecteur vidéo, une progression locale et des quiz créés dans le navigateur. Dans « Vos entraînements », les filtres sont suivis d’une vue maître-détail : liste scrollable à gauche, évolution du quiz sélectionné à droite, puis empilement des deux zones sur mobile. CoreUI est limité à la démo et n’est pas ajouté au frontend de production; son intégration progressive couvre les formulaires, boutons d’action, badges de statut, scores et alertes d’erreur.

La bibliothèque vidéo rassemble 35 vidéos YouTube autour de plusieurs thèmes : code de la route, culture générale, histoire, géographie, sciences, animaux, nature, football, cinéma, animation, mythologie et sport. Elle dispose d’une recherche, d’un filtre par thème et d’une pagination. L’action **Associer à un QCM** ouvre le créateur en mode QCM express, avec la vidéo, le titre et le thème préremplis; les paramètres de grille restent modifiables. Deux liens transmis sans titre précis sont rangés dans « À classer ». Ces vidéos tierces restent hébergées par leurs auteurs sur YouTube et ne sont pas présentées comme des contenus officiels.
