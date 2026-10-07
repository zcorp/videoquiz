# Fonctionnalités de la démo Video Quiz

Ce document décrit les fonctionnalités disponibles dans la démo statique publiée depuis `frontend/demo/`. Il sert de référence fonctionnelle pour les évolutions de cette démo; il ne décrit pas l’application full-stack.

## Périmètre

- **Inclus :** consultation des quiz et vidéos d’exemple, création et modification de quiz dans le navigateur, passation des quiz, suivi local des résultats et mesure d’audience avec consentement.
- **Exclus :** comptes, authentification, API, partage entre utilisateurs, synchronisation automatique entre appareils et stockage serveur. Ces services ne sont pas fournis par la démo.
- Les vidéos sont lues depuis YouTube. Leur disponibilité et leur contenu dépendent de leurs auteurs et de YouTube.
- Les quiz créés, les tentatives, les corrections mémorisées et le choix Analytics sont propres au navigateur utilisé. Ils ne sont pas transférés lors d’un déploiement.

## Parcours utilisateur

### Découvrir un quiz

**Étant donné** la bibliothèque de quiz, **lorsque** l’utilisateur recherche un terme, choisit un thème ou un mode, ou modifie le tri, **alors** la liste est filtrée ou réordonnée et peut être parcourue par pages.

### Choisir une vidéo

**Étant donné** la collection de vidéos, **lorsque** l’utilisateur recherche un titre ou filtre par thème, **alors** seules les vidéos correspondantes sont affichées. Si une vidéo est déjà associée à un quiz, l’interface permet d’ouvrir ce quiz au lieu d’en créer un doublon.

### Créer puis passer un quiz

**Étant donné** une vidéo YouTube valide, **lorsque** l’utilisateur crée et enregistre un quiz, **alors** celui-ci est disponible dans sa bibliothèque locale. Il peut ensuite répondre aux questions, retrouver sa progression après avoir quitté le quiz et reprendre là où il s’était arrêté.

### Sauvegarder et restaurer ses données

**Étant donné** des quiz et des données de progression enregistrés localement, **lorsque** l’utilisateur exporte puis importe une sauvegarde sur un navigateur, **alors** les données absentes y sont fusionnées sans remplacer les données déjà présentes.

### Suivre sa progression

**Étant donné** une ou plusieurs tentatives enregistrées, **lorsque** l’utilisateur ouvre le tableau de bord ou la progression d’un quiz, **alors** il peut consulter ses indicateurs, ses scores et leur évolution.

### Choisir la mesure d’audience

**Étant donné** qu’aucune préférence n’a encore été donnée, **lorsque** l’utilisateur accepte ou refuse la mesure d’audience, **alors** son choix est mémorisé et peut être modifié depuis le pied de page.

## Catalogue des fonctionnalités

### Bibliothèque de quiz

- **REQ-001 — Parcourir et retrouver les quiz :** l’utilisateur peut rechercher dans les titres, descriptions et thèmes, filtrer par thème et mode, trier par activité récente, titre ou nombre de questions, puis parcourir les résultats paginés.
- **REQ-002 — Repérer ses quiz :** chaque carte présente le thème, le titre, la vidéo, le nombre de questions et, si une tentative existe, le dernier score. Les quiz créés localement peuvent être modifiés, repris ou supprimés.
- **REQ-003 — Accéder rapidement aux vidéos :** l’accueil propose des thèmes vidéo fréquemment représentés et une vidéo mise en avant, avec une action adaptée à l’existence d’un quiz associé.
- **REQ-004 — Être guidé au premier accès :** un guide de bienvenue présente les actions principales et ne se réaffiche pas après sa fermeture sur le même navigateur.
- **REQ-023 — Afficher des miniatures nettes sur mobile :** les miniatures utilisent la meilleure résolution disponible pour chaque vidéo, reviennent automatiquement à une version compatible si celle-ci manque et conservent un cadrage adapté au format vidéo sur petit écran.

### Collection de vidéos

- **REQ-005 — Explorer les vidéos :** l’utilisateur peut rechercher par titre, filtrer par thème et parcourir la collection avec une pagination.
- **REQ-006 — Associer une vidéo à un quiz :** depuis une vidéo non utilisée, l’utilisateur peut ouvrir le créateur avec le lien, le titre, le thème et le mode QCM express préremplis.
- **REQ-007 — Préserver l’unicité vidéo-quiz :** une vidéo YouTube normalisée ne peut être associée qu’à un seul quiz, quel que soit son thème ou son mode. Un conflit est signalé dans le créateur et vérifié de nouveau à l’enregistrement.

### Création et modes de révision

- **REQ-008 — Créer et modifier localement :** l’utilisateur peut définir un titre, une vidéo YouTube, une description facultative et un mode de révision. Le thème est repris de la vidéo choisie ou prend la valeur par défaut. Les modifications sont conservées dans ce navigateur.
- **REQ-009 — Quiz préparé :** le créateur permet de définir des questions liées à des instants de la vidéo, avec des choix et une bonne réponse ou une réponse courte. Le lecteur donne accès aux chapitres/questions de la vidéo et se déplace à l’instant correspondant sans recharger ni interrompre le lecteur lors du changement de question.
- **REQ-010 — Révision progressive :** l’utilisateur peut préparer une grille de questions à compléter au fil de la vidéo, régler son nombre de questions et le nombre maximal de choix, puis poursuivre un brouillon incomplet.
- **REQ-011 — Correction déclarée par l’apprenant :** pour une question progressive, l’apprenant soumet d’abord sa propre réponse. La correction qu’il déclare d’après la vidéo n’est proposée qu’ensuite; elle est mémorisée localement et réutilisée lors des tentatives suivantes. La réponse personnelle n’est pas préremplie. Le passage à la question suivante ne demande aucune comparaison intermédiaire.
- **REQ-012 — Comparaison exacte des choix multiples :** une réponse progressive est considérée correcte uniquement si elle contient toutes les bonnes options et aucune option incorrecte.
- **REQ-013 — QCM express :** la collection peut ouvrir le créateur en mode QCM express avec la vidéo et ses métadonnées préremplies; le lecteur sait faire passer les quiz existants selon le parcours progressif. Limite actuelle : dans le créateur, le nombre de questions et d’options est réglable, mais les cellules de la grille QCM affichée ne sont pas éditables.
- **REQ-014 — Examen blanc :** lorsqu’un quiz est marqué comme examen, l’apprenant répond question par question et consulte la correction avant de continuer.
- **REQ-015 — Adapter le lecteur aux écrans :** le lecteur permet d’afficher ou masquer la vidéo. Sur mobile, la vidéo reste visible pendant que le panneau de réponse défile; sur tablette, la colonne vidéo reste disponible pendant le défilement.

### Résultats et progression

- **REQ-016 — Consulter le résultat :** à la fin d’un quiz, l’utilisateur voit son score, son pourcentage et le détail des réponses et corrections disponibles.
- **REQ-024 — Revoir un quiz en mode lecture :** après la fin d’un quiz progressif, l’utilisateur peut revoir chaque question avec la vidéo repositionnée à l’instant correspondant, sa réponse initiale, son auto-correction et l’indication de concordance. Les réponses ne sont pas modifiables dans ce mode.
- **REQ-017 — Suivre l’activité :** le tableau de bord récapitule les quiz joués, les tentatives, la moyenne et le meilleur score. La liste des entraînements peut être recherchée, filtrée, triée et présentée avec le détail du quiz sélectionné.
- **REQ-018 — Consulter l’historique :** chaque quiz joué dispose d’une page de progression avec une courbe des scores et la liste des tentatives. La courbe présente une échelle adaptée au quiz et les détails d’une tentative au survol ou au focus clavier. La démo conserve au maximum les 30 tentatives les plus récentes au total dans le navigateur.

### Confidentialité et attribution

- **REQ-019 — Conserver les données de quiz sur l’appareil :** les quiz créés, résultats et corrections restent dans le stockage local du navigateur; aucune connexion ni aucun compte n’est requis. La suppression des données du navigateur peut les effacer.
- **REQ-020 — Soumettre Analytics au consentement :** pour améliorer l’expérience utilisateur, le tag GA4 mesure les consultations des sections uniquement après acceptation. Le choix est conservé et modifiable depuis le pied de page; un refus ou retrait bloque les envois futurs. Si le consentement est retiré après le chargement du tag, celui-ci peut rester présent dans la page, mais ne doit plus envoyer d’événements.
- **REQ-021 — Limiter les données envoyées par l’application :** l’application envoie des vues de sections sans transmettre les réponses ni le contenu saisi dans les quiz. Pour éviter les événements automatiques tels que les défilements, la Mesure améliorée doit également être désactivée dans les paramètres du flux GA4.
- **REQ-022 — Attribuer la démo :** le pied de page affiche la mention de droits ZCOORE avec l’année courante et un accès aux préférences Analytics.
- **REQ-025 — Reprendre un quiz interrompu :** les réponses, l’auto-correction et la question courante d’un quiz inachevé sont conservées localement. À la prochaine ouverture, le quiz reprend cet état et propose de recommencer; une tentative terminée n’est pas reprise.
- **REQ-026 — Exporter les données locales :** l’utilisateur peut télécharger un fichier JSON qui contient ses quiz créés, les 30 tentatives conservées, les auto-corrections et les quiz inachevés.
- **REQ-027 — Importer et fusionner une sauvegarde :** l’utilisateur peut importer une sauvegarde Video Quiz valide de 5 Mo au plus. Les nouveaux quiz et données compatibles sont ajoutés; un quiz dont l’identifiant ou la vidéo est déjà utilisé est ignoré, et aucune donnée existante n’est remplacée.
- **REQ-028 — Signaler les erreurs de sauvegarde :** un format non reconnu, un fichier illisible ou une erreur de stockage est annoncé dans l’interface et n’est pas présenté comme un import réussi.
- **REQ-029 — Mesurer les interactions consenties :** après acceptation seulement, Analytics peut recevoir des événements sans paramètre utilisateur pour le démarrage, la reprise, l’abandon ou la fin d’un quiz, l’ouverture du mode lecture et les actions de sauvegarde. Aucune réponse, correction, titre, identifiant de quiz ni donnée saisie n’est inclus.
- **REQ-030 — Rendre les parcours accessibles :** les commandes et retours sont utilisables au clavier et annoncés aux technologies d’assistance, les erreurs sont identifiables, les animations sont réduites selon la préférence du système et les textes courants restent lisibles sur petit écran.

## Entités fonctionnelles

- **Quiz :** titre, description, thème, vidéo associée, mode, questions et configuration du parcours.
- **Question :** énoncé, position dans la vidéo, options éventuelles, type de réponse et correction selon le mode.
- **Tentative :** quiz concerné, score, maximum, pourcentage et date de réalisation.
- **Correction personnelle :** correction déclarée par l’apprenant pour une question progressive, enregistrée séparément de sa réponse.
- **Progression en cours :** index de la question courante, réponses et corrections nécessaires à la reprise d’un quiz non terminé.
- **Sauvegarde locale :** fichier portable versionné contenant les données locales exportables du navigateur.
- **Préférence Analytics :** consentement accepté ou refusé, conservé dans le navigateur.

## Critères de réussite vérifiables

- **SC-001 :** une recherche, un filtre de thème et un filtre de mode peuvent être appliqués dans la bibliothèque sans modifier les données du quiz.
- **SC-002 :** une seconde association de la même vidéo à un autre quiz est refusée au moment de l’enregistrement.
- **SC-003 :** dans une question progressive, la correction n’est pas visible ni modifiable avant la validation de la réponse personnelle; une nouvelle tentative peut réutiliser la correction mémorisée sans réutiliser la réponse personnelle.
- **SC-004 :** une sélection de choix multiples n’est marquée correcte que si l’ensemble sélectionné correspond exactement à l’ensemble attendu.
- **SC-005 :** après une tentative, le score apparaît dans le tableau de bord et la page de progression du quiz concerné.
- **SC-006 :** sur un premier accès sans acceptation préalable, aucun tag GA4 n’est chargé; après un refus ou le retrait du consentement, aucune nouvelle vue n’est envoyée par l’application.
- **SC-007 :** aucune réponse au quiz ni aucun texte saisi dans le créateur n’est transmis dans les vues Analytics envoyées par l’application.
- **SC-008 :** le parcours vidéo et réponses reste utilisable sur mobile et tablette sans perdre l’accès à la vidéo pendant la réponse.
- **SC-009 :** passer à une autre question ne recharge pas le lecteur YouTube; le lecteur se positionne à l’instant associé à la nouvelle question et conserve son état de lecture.
- **SC-010 :** les miniatures restent visibles même si les versions les plus haute résolution ne sont pas disponibles, gardent un cadrage 16:9 sur mobile, et les effets visuels au survol ne restent pas activés après un toucher sur un écran tactile.
- **SC-011 :** après avoir saisi sa réponse et son auto-correction à une question progressive, l’utilisateur passe directement à la question suivante; la comparaison et le score ne s’affichent qu’à la fin du quiz.
- **SC-012 :** depuis le résultat d’un quiz progressif, le mode lecture permet de parcourir toutes les questions, affiche les deux réponses et leur concordance, repositionne la vidéo sur chaque instant et ne permet aucune modification.
- **SC-013 :** la courbe de progression affiche une graduation cohérente avec le score maximal, reste lisible sur petit écran et rend le score, le pourcentage et la date de chaque tentative accessibles au survol ou au clavier.
- **SC-014 :** après avoir répondu à au moins une question puis quitté et rouvert le même quiz, l’utilisateur retrouve la question, ses réponses et les corrections déjà saisies; les tentatives terminées ne réapparaissent pas comme quiz à reprendre.
- **SC-015 :** un export puis un import dans un navigateur sans données correspondantes restaure les quiz, tentatives, corrections et progressions exportés; les collisions ne remplacent aucune donnée existante et sont signalées.
- **SC-016 :** un fichier invalide ou de plus de 5 Mo produit un message d’erreur accessible et ne modifie pas les données locales.
- **SC-017 :** sans consentement Analytics accepté, aucun événement d’interaction n’est envoyé; après acceptation, les événements ne contiennent que leur nom, sans paramètres de quiz ou de réponse.
- **SC-018 :** les commandes d’export et d’import sont accessibles au clavier, les résultats et erreurs d’import sont annoncés sans dépendre uniquement de la couleur, et les préférences de réduction du mouvement sont respectées. Les textes secondaires et corail sur fond blanc ou papier atteignent un contraste de 4,5:1; le contour de focus atteint au moins 3:1.
- **SC-019 :** hors titres et icônes, les informations secondaires et repères de section sont affichés à 14 px ou plus; les paragraphes et commandes restent à 15 px ou plus (champs à 16 px), y compris sur les petits écrans.
- **SC-020 :** les écrans de la démo appliquent une typographie cohérente avec CoreUI; les formulaires gardent une taille de saisie de 16 px et les numérotations de questions, étapes et tentatives utilisent une hiérarchie visuelle lisible et uniforme.
- **SC-021 :** la démo utilise une identité de marque cohérente bleu nuit, turquoise et corail dans son en-tête, ses actions, ses états de réponse, sa progression et ses accents; les fonds clairs et les contrastes maintiennent la lisibilité.
- **SC-022 :** sur téléphone et tablette, les pages utilisent la largeur disponible avec des marges cohérentes, une hiérarchie de titres lisible et des informations clés alignées; les grilles et actions restent utilisables sans défilement horizontal, et le lecteur vidéo reste épinglé sous la barre de navigation pendant le défilement du quiz.

## Hors périmètre et limites connues

- Pas de compte, de serveur, de sauvegarde distante ni de synchronisation automatique des données locales.
- Les statistiques ne sont pas partagées entre navigateurs ou appareils.
- Dans le créateur QCM express, les cellules de questions et de choix sont affichées mais ne peuvent pas encore être renseignées directement dans cette grille.
- GA4 peut collecter des événements automatiques configurés au niveau de la propriété, même si l’application n’envoie que des vues de sections. Désactiver la Mesure améliorée si seuls ces événements sont souhaités.
- Les vidéos, miniatures et leur disponibilité dépendent de YouTube et de leurs auteurs.

## Mise à jour de ce document

Mettre à jour ce catalogue lorsque le comportement visible de la démo change. Décrire les résultats attendus pour l’utilisateur et ajouter ou ajuster les critères vérifiables; garder les détails d’implémentation dans le code et les consignes d’exploitation dans `README.md` ou `DEPLOYMENT.md`.
