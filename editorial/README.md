# Flux éditorial des QCM

La démo est une application statique : elle ne possède ni compte administrateur, ni serveur ni contrôle d’accès capable de protéger une interface de publication. La validation est donc éditoriale et s’effectue dans le dépôt. Un responsable mainteneur prépare les QCM; la revue de code et le déploiement GitHub Pages constituent l’étape de publication.

## Préparer et valider

1. Utiliser les exports de questions/transcriptions du dépôt YoutubeApp, sous `YoutubeApp/data/output/videoquiz/questions/`, comme matériau de travail. Ne pas les copier dans ce dépôt ni les importer dans `frontend/demo/`.
2. Préparer un brouillon localement, hors du code client. Contrôler la formulation, tous les choix, la ou les bonnes réponses et le passage vidéo associé. Vérifier séparément les éléments visuels et les faits susceptibles d’évoluer; écarter les questions ambiguës ou impossibles à confirmer.
3. Faire relire le QCM par un responsable éditorial. Renseigner son identifiant et la date de validation dans `review`.
4. Après validation seulement, déposer le fichier JSON dans `frontend/demo/src/data/preparedQuizzes/approved/` avec `status: "approved"`. Respecter le schéma ci-dessous.
5. Soumettre les changements à la revue habituelle du dépôt. Le build refuse les QCM approuvés incomplets, les réponses invalides, les provenances incohérentes et les doublons. Après fusion, GitHub Actions publie le catalogue validé sur GitHub Pages.

Les exports bruts ne sont pas copiés dans ce dépôt ni chargés par le catalogue client; celui-ci ne recherche des fichiers que dans `preparedQuizzes/approved/`. Les réponses correctes d’un quiz statique sont toutefois visibles dans le JavaScript livré au navigateur : ce mécanisme convient à une démo et à du contenu de révision, pas à un examen sécurisé ou à des réponses confidentielles.

Il n’existe pas d’interface d’administration dans la démo. Une publication depuis un tableau de bord authentifié nécessiterait un backend ou un CMS avec authentification, autorisation et stockage serveur.

## Schéma d’un QCM approuvé

```json
{
  "status": "approved",
  "id": "nom-du-qcm",
  "videoId": "ABCDEFGHIJK",
  "title": "Titre relu du quiz",
  "topic": "THÈME",
  "description": "Description facultative.",
  "review": {
    "reviewer": "Identifiant du relecteur",
    "reviewedAt": "2026-10-23"
  },
  "questions": [
    {
      "id": "q1",
      "prompt": "Question reformulée et vérifiée",
      "at": 42,
      "type": "choice",
      "options": ["Choix A", "Choix B"],
      "answer": 0,
      "explanation": "Explication facultative.",
      "source": {
        "videoId": "ABCDEFGHIJK",
        "startSeconds": 42,
        "endSeconds": 68
      }
    }
  ]
}
```

`type` vaut `choice` pour une réponse correcte ou `multi_choice` pour plusieurs réponses correctes; `answer` est un index à partir de zéro ou un tableau d’index. Chaque question doit pointer vers le même ID vidéo que le QCM et vers un intervalle de source contenant son timestamp `at`.
