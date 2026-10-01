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

La démo utilise React, Vite, React Router et `HashRouter`. Elle propose une bibliothèque filtrable, un dashboard, des QCM thématiques, un lecteur vidéo, une progression locale et des quiz créés dans le navigateur.
