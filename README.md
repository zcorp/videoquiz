# Video Quiz

Video Quiz est une application web de création et de passation de quiz associés à des vidéos YouTube. Le dépôt contient une SPA React, une API Spring Boot et une base MongoDB. **L’application actuelle dépend du backend pour les comptes, les quiz, les catégories et l’historique des tentatives ; elle n’est pas encore une démo autonome hébergeable telle quelle sur GitHub Pages.**

La mémoire technique détaillée, les limites connues et les pistes pour la démo locale sont dans [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Fonctionnalités présentes

- Comptes utilisateur avec authentification JWT. Un compte `USER` peut créer et passer des quiz; les rôles historiques `CREATOR` et `LEARNER` restent présents dans le modèle.
- Création, modification, publication, partage et suppression de quiz; visibilité publique, privée par lien, ou sur invitation.
- Une ou plusieurs vidéos YouTube par quiz; questions à choix unique, choix multiples, ou réponse texte.
- Deux modes de passation : correction par le serveur (`CREATOR`) et auto-évaluation immédiate (`SELF_ASSESS`).
- Tableau de bord, catégories hiérarchiques, progression, catalogue public, import/export JSON, export des résultats JSON/PDF et envoi d’e-mails optionnel.

Certaines fonctions de recherche et de progression sont partiellement raccordées; voir la section des problèmes connus dans [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Stack

| Brique | Technologies confirmées |
|---|---|
| Interface | React 18, React Router 6, Vite 5, JavaScript, CSS global |
| API | Java 17 cible, Spring Boot 3.2.4, Spring Security, Spring Data MongoDB |
| Données | MongoDB 7; collections users, quizzes, categories et sessions |
| Authentification | JWT signé HMAC, BCrypt |
| Développement/déploiement actuel | Docker Compose, Nginx; Maven pour le backend |

## Lancer localement avec Docker

Prérequis : Docker avec `docker compose`, et OpenSSL pour générer un secret JWT.

Depuis la racine du dépôt :

```sh
cp -n .env.example .env
openssl rand -hex 32
```

Si `.env` existe déjà, conserver ce fichier et vérifier ses valeurs sans les publier. Sinon, remplacer la valeur d’exemple de `JWT_SECRET` par le secret généré, puis lancer :

```sh
docker compose up --build -d
```

- Interface : http://localhost:3000
- API : http://localhost:8080
- Santé API : http://localhost:8080/actuator/health
- MongoDB : port `27017`, données conservées dans le volume Docker `mongo_data`

Arrêter les services sans effacer les données avec `docker compose down`. `docker compose down -v` supprime aussi le volume MongoDB. **Ne pas utiliser `./start.sh up` pour un redémarrage normal : ce script exécute `docker compose down -v` et efface les données avant de reconstruire les services.**

## Développement sans Docker

Prérequis : JDK 17, Maven, Node.js 20+ et MongoDB 7 accessible sur `localhost:27017`.

Terminal backend :

```sh
cd backend
mvn spring-boot:run
```

Terminal frontend :

```sh
cd frontend
npm ci
npm run dev
```

Vite écoute sur le port `3000` et proxifie `/api` vers `http://localhost:8080`. En développement, configurer `VITE_API_URL` dans `frontend/.env.local` uniquement si l’API utilise une autre adresse; un exemple est fourni dans `frontend/.env.example`.

## Build et déploiement actuel

```sh
cd frontend && npm ci && npm run build
cd ../backend && mvn package
```

Le frontend produit `frontend/dist`. En production Docker, Nginx sert les fichiers statiques, applique le fallback SPA et relaie `/api/` vers le backend. MongoDB, l’API et le frontend sont assemblés par `docker-compose.yml`. Configurer un secret JWT dédié et des paramètres SMTP/CORS adaptés avant toute exposition publique; les valeurs locales par défaut ne constituent pas une configuration de production.

Le build backend et les tests automatisés ne sont pas actuellement validés dans cet environnement. La démo statique a son propre build Pages et utilise le stockage local; son workflow distant reste à exécuter dans le dépôt GitHub.

## API

Routes principales sous `/api` :

| Routes | Rôle |
|---|---|
| `/auth/register`, `/auth/login` | Inscription et connexion publiques |
| `/quizzes` et `/quizzes/{id}` | Gestion authentifiée des quiz du compte |
| `/quizzes/share/{token}`, `/quizzes/public/{id}`, `/quizzes/explore` | Accès aux quiz publiés et catalogue |
| `/quizzes/{id}/invites` | Gestion authentifiée des invitations |
| `/categories` et `/categories/tree` | Gestion des catégories |
| `/sessions/submit`, `/sessions`, `/sessions/quiz/{quizId}` | Soumission et consultation authentifiées des tentatives |
| `/email/quiz`, `/email/results` | Envoi d’e-mails authentifié, SMTP désactivé par défaut |

Il n’existe pas de contrôleur `/api/videos` dans le code actuel. Les détails de contrat et de sécurité sont documentés dans [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Vérifications

Il n’y a pas de suite de tests frontend/backend repérée dans le dépôt. Les étapes manuelles sont décrites dans [TESTING_PLAN.md](TESTING_PLAN.md); leur présence ne signifie pas qu’elles ont été exécutées. L’état et les résultats de validation de cette session sont consignés dans [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Démo statique

La démo possède une entrée React/Vite indépendante et n’importe ni les providers d’authentification ni le client API. Depuis `frontend/` :

```sh
npm ci
npm run dev:demo
```

Ouvrir http://localhost:5174. Construire et prévisualiser la version statique :

```sh
npm run build:demo
npm run preview:demo
```

La sortie est `frontend/demo-dist/`, séparée du build de l’application complète. Elle contient un `index.html` et convient à GitHub Pages. Le workflow `.github/workflows/demo-pages.yml` calcule le base path du dépôt et publie ce dossier; activer GitHub Pages avec la source **GitHub Actions** dans les paramètres du dépôt.

Les quiz créés/modifiés et résultats terminés sont enregistrés dans le `localStorage` de ce navigateur. Une tentative garde seulement son quiz, sa date, son score brut (`30/40`) et son pourcentage; les détails de correction ne sont pas persistés. Les réponses de passation en cours ne sont pas sauvegardées. Le créateur propose trois modes : **quiz préparé**, avec réponses correctes définies à l’avance; **révision progressive**, où questions et options peuvent rester vides et se remplir slot par slot; et **QCM express**, qui réserve une grille de N lignes et M cases A/B/C…, sans remplissage manuel. En progressif et QCM express, N et M sont choisis par l’auteur; 40 questions et 4 choix sont des valeurs suggérées, pas des plafonds. Le QCM express se lance directement; l’énoncé et les propositions sont portés par la vidéo. Pendant la vidéo, l’utilisateur coche une ou plusieurs réponses, coche ensuite la ou les réponses correctes d’après la vidéo, puis valide et passe à la question suivante sans voir la correction. Le bilan final révèle le score, les concordances et les explications. Les grilles sont une auto-correction déclarative, pas une correction indépendante.

Chaque quiz ayant au moins une tentative propose aussi une vue **Progression** dédiée (`#/progression/:quizId`) : courbe locale des scores, dernier score et historique daté. La courbe est dérivée des résumés de tentatives; aucun graphique n’est stocké. Le rendu SVG actuel reste léger pour la démo; D3 ou Plotly pourra être ajouté plus tard pour les filtres et comparaisons avancés.

Le **Dashboard** (`#/dashboard`) centralise l’activité locale : nombre de quiz joués, nombre de tentatives, moyenne, meilleur score, derniers résultats par quiz et raccourcis vers les progressions. Il ne possède pas de stockage propre; toutes ses métriques sont calculées à partir des quiz et des tentatives existants.

La bibliothèque propose une recherche instantanée, des filtres par type (`prepared`, progressif, QCM), un filtre par thème, un tri par activité récente/titre/nombre de questions et une pagination de 9 cartes. Les actions de carte sont représentées par des icônes accessibles avec `aria-label` et infobulle; un drawer n’est pas nécessaire dans cette première version locale, la barre d’outils restant visible et rapide à utiliser.

La démo inclut aussi des QCM courts de découverte sur le code de la route, l’histoire, les mathématiques et les sciences, en plus des exemples de développement web. Lors de la première visite, un guide local en trois étapes explique la bibliothèque, le déroulé vidéo et le dashboard; son affichage est mémorisé dans `videoquiz-demo:welcome-seen:v1`.

Les exemples embarqués sont en lecture seule; l’un propose un examen blanc non officiel du code de la route : 40 questions, jusqu’à quatre choix, réponses multiples et correction immédiate. Le seuil d’entraînement affiché est 35/40; ce quiz ne remplace pas les ressources officielles et ses règles/horodatages doivent être vérifiés. La démo n’appelle pas l’API Video Quiz, mais charge vidéos/vignettes via YouTube et polices via Google Fonts.
