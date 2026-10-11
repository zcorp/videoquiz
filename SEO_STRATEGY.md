# Stratégie de référencement de Video Quiz

## Objectif et périmètre

Faire découvrir la démo Video Quiz aux personnes qui cherchent à créer un QCM à partir d’une vidéo, à réviser en regardant une vidéo ou à comprendre le fonctionnement de l’outil. Faciliter également la compréhension du produit par les moteurs de recherche et les assistants qui explorent le Web.

Cette stratégie s’applique au site statique public `https://www.videoquiz.fr/`, publié par GitHub Pages depuis `frontend/demo/`. Elle ne rend pas indexables les quiz privés au navigateur, les écrans métier de la SPA ni les fonctionnalités du backend. Le référencement ne garantit ni indexation ni positionnement.

## Publics et intention de recherche

- **Créer un quiz vidéo :** « créer un quiz à partir d’une vidéo », « créer un QCM vidéo », « quiz interactif vidéo ».
- **Apprendre en regardant :** « réviser avec une vidéo », « questions pendant une vidéo », « apprendre avec des quiz vidéo ».
- **Comprendre l’outil :** « comment fonctionne Video Quiz », « créer un quiz YouTube ».

Ces formulations guident les titres et les explications. Elles ne justifient pas de répéter artificiellement des mots-clés ni de prétendre que Video Quiz produit automatiquement des questions à partir de la vidéo.

## Décisions techniques mises en place

1. **Canonicalité du domaine :** utiliser `https://www.videoquiz.fr/`. Le domaine sans `www` redirige vers celui-ci; les métadonnées, liens de découverte et sitemap utilisent donc exclusivement l’hôte `www`.
2. **Accueil compréhensible sans JavaScript :** titre, description, robots, canonical, Open Graph, données structurées WebSite/SoftwareApplication et résumé `noscript` sont dans `frontend/demo/index.html`. L’application reste une SPA et conserve son comportement actuel.
3. **Page éditoriale explorable :** `https://www.videoquiz.fr/tutoriel/` est un document HTML statique avec un titre, un H1 explicite, quatre étapes, des liens vers la démo et une explication fidèle du stockage local. Ce document reste utile si le rendu JavaScript échoue.
4. **Métadonnées dans l’application :** les titres et descriptions affichés sont ajustés pour l’accueil et le tutoriel. La route hash du tutoriel pointe vers la page canonique `/tutoriel/`; les autres vues hash restent canoniques vers l’accueil, car elles ne sont pas des pages publiques indépendantes.
5. **Découverte des URLs :** `robots.txt` autorise l’exploration et référence `sitemap.xml`. Le sitemap ne liste que l’accueil et le tutoriel, seules pages publiques éditoriales retenues.
6. **Assistants et moteurs conversationnels :** `llms.txt` donne une description compacte du produit, les URLs canoniques et les limites à respecter. C’est un fichier d’aide non normatif; les agents n’ont aucune obligation de le consulter ou de citer le site.
7. **Partage social :** les métadonnées Open Graph et Twitter fournissent un titre et un résumé cohérents. Aucune image de partage dédiée n’est publiée pour le moment; ajouter une image originale 1200 × 630 px et `og:image` après validation de l’identité visuelle.

## Stratégie éditoriale et confiance

- Garder une promesse concrète : associer une vidéo, préparer ou compléter des questions, s’entraîner et consulter une progression locale.
- Décrire les limites au même endroit que les bénéfices : pas de compte ni synchronisation, stockage dans le navigateur, connexion requise pour YouTube, auto-évaluation non certifiée.
- Ne pas revendiquer d’affiliation avec YouTube, de validation officielle du code de la route, de génération automatique de questions ou de résultats pédagogiques prouvés.
- Créer d’autres pages seulement si elles répondent à une intention distincte et s’appuient sur une expérience ou des sources vérifiables. Sujets possibles à instruire : guide de création d’un QCM vidéo, méthodes de révision active, choix des modes préparé/progressif/QCM. Éviter les pages quasi identiques et la génération en masse.
- Conserver un ton français naturel, des titres hiérarchisés, des liens explicites et des contenus lisibles par clavier et lecteur d’écran. Pas de texte caché destiné aux robots.
- Ne pas ajouter de balisage FAQ ou d’avis/rating fictif pour rechercher un résultat enrichi.

## Mesure et amélioration continue

### Mise en place à faire dans les consoles

1. Vérifier `https://www.videoquiz.fr/` dans Google Search Console, puis envoyer `https://www.videoquiz.fr/sitemap.xml`.
2. Vérifier le site dans Bing Webmaster Tools et importer les données de Search Console si disponible; contrôler aussi l’URL du sitemap.
3. Utiliser l’inspection d’URL et le test en direct pour l’accueil et `/tutoriel/`. Vérifier l’URL canonique choisie, le rendu mobile et les ressources.
4. Après validation, contrôler périodiquement les erreurs de crawl, les URLs exclues et les requêtes d’impressions; ne pas demander l’indexation répétée sans changement réel.

Ces étapes nécessitent l’accès et la validation du propriétaire du domaine; le code ne peut pas créer ni vérifier les propriétés à sa place.

### Indicateurs

Établir une base après la première période de collecte, puis comparer mensuellement :

- URLs éditoriales connues, indexées et retenues comme canoniques;
- impressions, clics, CTR et position moyenne par requête non marquée et page d’entrée;
- visites organiques vers l’accueil et le tutoriel, puis clics vers « Créer mon quiz » ou la bibliothèque;
- erreurs mobiles/de performance et éventuels problèmes de données structurées.

GA4 reste soumis au consentement déjà implémenté. La page tutoriel HTML autonome n’ajoute pas de tag analytique et son trafic organique se mesure via Search Console/Bing; les vues et actions dans la démo continuent à respecter le consentement GA4 existant. Ne jamais envoyer les titres de quiz créés, réponses, scores, URLs avec saisies utilisateur ou données personnelles. Le taux de clic sur une action peut être mesuré uniquement avec un événement générique et après consentement, si la configuration privacy est confirmée.

Les citations par assistants IA sont difficiles à mesurer exhaustivement. Suivre les référents identifiables et faire des vérifications ponctuelles, sans considérer une absence de citation comme une panne ni optimiser par spam.

## Limites connues et pistes ultérieures

- GitHub Pages sert une SPA avec `HashRouter`; les vues `/#/videos`, `/#/dashboard`, quiz et outils locaux ne constituent pas des documents HTML indépendants pour les robots. Seules l’accueil et la page statique du tutoriel sont listées dans le sitemap.
- Les changements de titre lors d’une navigation hash améliorent l’expérience navigateur, mais ne remplacent pas le HTML pré-rendu d’une page publique.
- Le sitemap ne déclare pas de `lastmod`, faute d’horodatage de publication déterministe.
- Les données structurées décrivent uniquement l’application web et la page tutoriel; elles ne promettent pas de résultat enrichi.
- Une évolution vers un vrai site éditorial ou des pages de quiz publiques nécessiterait un rendu statique par route ou un générateur de site, une politique d’indexation et une revue de confidentialité propres à ces données.

## Fichiers concernés

- `frontend/demo/index.html` — métadonnées d’accueil, données structurées et résumé sans JavaScript.
- `frontend/demo/src/DemoApp.jsx` — titres, descriptions et canonical lors du changement de route SPA.
- `frontend/demo/public/tutoriel/index.html` — page éditoriale autonome et canonique.
- `frontend/demo/public/robots.txt`, `sitemap.xml`, `llms.txt` — découverte et contexte public.
- `.github/workflows/demo-pages.yml` — déploie le contenu de `frontend/demo-dist`; aucune étape supplémentaire de référencement n’est requise.
