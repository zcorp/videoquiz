# Fonctionnalités de la démo Video Quiz

Ce document décrit les fonctionnalités disponibles dans la démo statique publiée depuis `frontend/demo/`. Il sert de référence fonctionnelle pour les évolutions de cette démo; il ne décrit pas l’application full-stack.

## Périmètre

- **Inclus :** consultation des quiz et vidéos d’exemple, création et modification de quiz dans le navigateur, passation des quiz, suivi local des résultats et mesure d’audience avec consentement.
- **Exclus :** comptes, authentification, API, partage entre utilisateurs, synchronisation entre appareils et stockage serveur. Ces services ne sont pas fournis par la démo.
- Les vidéos sont lues depuis YouTube. Leur disponibilité et leur contenu dépendent de leurs auteurs et de YouTube.
- Les quiz créés, les tentatives, les corrections mémorisées et le choix Analytics sont propres au navigateur utilisé. Ils ne sont pas transférés lors d’un déploiement.

## Parcours utilisateur

### Découvrir un quiz

**Étant donné** la bibliothèque de quiz, **lorsque** l’utilisateur recherche un terme, choisit un thème ou un mode, ou modifie le tri, **alors** la liste est filtrée ou réordonnée et peut être parcourue par pages.

### Choisir une vidéo

**Étant donné** la collection de vidéos, **lorsque** l’utilisateur recherche un titre ou filtre par thème, **alors** seules les vidéos correspondantes sont affichées. Si une vidéo est déjà associée à un quiz, l’interface permet d’ouvrir ce quiz au lieu d’en créer un doublon.

### Créer puis passer un quiz

**Étant donné** une vidéo YouTube valide, **lorsque** l’utilisateur crée et enregistre un quiz, **alors** celui-ci est disponible dans sa bibliothèque locale. Il peut ensuite répondre aux questions, obtenir son résultat et retrouver sa tentative sur ce navigateur.

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

### Collection de vidéos

- **REQ-005 — Explorer les vidéos :** l’utilisateur peut rechercher par titre, filtrer par thème et parcourir la collection avec une pagination.
- **REQ-006 — Associer une vidéo à un quiz :** depuis une vidéo non utilisée, l’utilisateur peut ouvrir le créateur avec le lien, le titre, le thème et le mode QCM express préremplis.
- **REQ-007 — Préserver l’unicité vidéo-quiz :** une vidéo YouTube normalisée ne peut être associée qu’à un seul quiz, quel que soit son thème ou son mode. Un conflit est signalé dans le créateur et vérifié de nouveau à l’enregistrement.

### Création et modes de révision

- **REQ-008 — Créer et modifier localement :** l’utilisateur peut définir un titre, une vidéo YouTube, une description facultative et un mode de révision. Le thème est repris de la vidéo choisie ou prend la valeur par défaut. Les modifications sont conservées dans ce navigateur.
- **REQ-009 — Quiz préparé :** le créateur permet de définir des questions liées à des instants de la vidéo, avec des choix et une bonne réponse ou une réponse courte. Le lecteur donne accès aux chapitres/questions de la vidéo et se déplace à l’instant correspondant sans recharger ni interrompre le lecteur lors du changement de question.
- **REQ-010 — Révision progressive :** l’utilisateur peut préparer une grille de questions à compléter au fil de la vidéo, régler son nombre de questions et le nombre maximal de choix, puis poursuivre un brouillon incomplet.
- **REQ-011 — Correction déclarée par l’apprenant :** pour une question progressive, l’apprenant soumet d’abord sa propre réponse. La correction qu’il déclare d’après la vidéo n’est proposée qu’ensuite; elle est mémorisée localement et réutilisée lors des tentatives suivantes. La réponse personnelle n’est pas préremplie.
- **REQ-012 — Comparaison exacte des choix multiples :** une réponse progressive est considérée correcte uniquement si elle contient toutes les bonnes options et aucune option incorrecte.
- **REQ-013 — QCM express :** la collection peut ouvrir le créateur en mode QCM express avec la vidéo et ses métadonnées préremplies; le lecteur sait faire passer les quiz existants selon le parcours progressif. Limite actuelle : dans le créateur, le nombre de questions et d’options est réglable, mais les cellules de la grille QCM affichée ne sont pas éditables.
- **REQ-014 — Examen blanc :** lorsqu’un quiz est marqué comme examen, l’apprenant répond question par question et consulte la correction avant de continuer.
- **REQ-015 — Adapter le lecteur aux écrans :** le lecteur permet d’afficher ou masquer la vidéo. Sur mobile, la vidéo reste visible pendant que le panneau de réponse défile; sur tablette, la colonne vidéo reste disponible pendant le défilement.

### Résultats et progression

- **REQ-016 — Consulter le résultat :** à la fin d’un quiz, l’utilisateur voit son score, son pourcentage et le détail des réponses et corrections disponibles.
- **REQ-017 — Suivre l’activité :** le tableau de bord récapitule les quiz joués, les tentatives, la moyenne et le meilleur score. La liste des entraînements peut être recherchée, filtrée, triée et présentée avec le détail du quiz sélectionné.
- **REQ-018 — Consulter l’historique :** chaque quiz joué dispose d’une page de progression avec une courbe des scores et la liste des tentatives. La démo conserve au maximum les 30 tentatives les plus récentes au total dans le navigateur.

### Confidentialité et attribution

- **REQ-019 — Conserver les données de quiz sur l’appareil :** les quiz créés, résultats et corrections restent dans le stockage local du navigateur; aucune connexion ni aucun compte n’est requis. La suppression des données du navigateur peut les effacer.
- **REQ-020 — Soumettre Analytics au consentement :** pour améliorer l’expérience utilisateur, le tag GA4 mesure les consultations des sections uniquement après acceptation. Le choix est conservé et modifiable depuis le pied de page; un refus ou retrait bloque les envois futurs. Si le consentement est retiré après le chargement du tag, celui-ci peut rester présent dans la page, mais ne doit plus envoyer d’événements.
- **REQ-021 — Limiter les données envoyées par l’application :** l’application envoie des vues de sections sans transmettre les réponses ni le contenu saisi dans les quiz. Pour éviter les événements automatiques tels que les défilements, la Mesure améliorée doit également être désactivée dans les paramètres du flux GA4.
- **REQ-022 — Attribuer la démo :** le pied de page affiche la mention de droits ZCOORE avec l’année courante et un accès aux préférences Analytics.

## Entités fonctionnelles

- **Quiz :** titre, description, thème, vidéo associée, mode, questions et configuration du parcours.
- **Question :** énoncé, position dans la vidéo, options éventuelles, type de réponse et correction selon le mode.
- **Tentative :** quiz concerné, score, maximum, pourcentage et date de réalisation.
- **Correction personnelle :** correction déclarée par l’apprenant pour une question progressive, enregistrée séparément de sa réponse.
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

## Hors périmètre et limites connues

- Pas de compte, de serveur, de sauvegarde distante, d’import/export ni de synchronisation des données locales.
- Les statistiques ne sont pas partagées entre navigateurs ou appareils.
- Dans le créateur QCM express, les cellules de questions et de choix sont affichées mais ne peuvent pas encore être renseignées directement dans cette grille.
- GA4 peut collecter des événements automatiques configurés au niveau de la propriété, même si l’application n’envoie que des vues de sections. Désactiver la Mesure améliorée si seuls ces événements sont souhaités.
- Les vidéos, miniatures et leur disponibilité dépendent de YouTube et de leurs auteurs.

## Mise à jour de ce document

Mettre à jour ce catalogue lorsque le comportement visible de la démo change. Décrire les résultats attendus pour l’utilisateur et ajouter ou ajuster les critères vérifiables; garder les détails d’implémentation dans le code et les consignes d’exploitation dans `README.md` ou `DEPLOYMENT.md`.
