# Posé · apprendre à poser

Une application web (installable sur téléphone) pour être plus à l’aise quand on te prend en photo.
Elle reprend les techniques enseignées aux acteurs, aux mannequins et aux invités du tapis rouge :

- **Les poses** : 20 poses illustrées (bases, visage, debout, assis, mains), chacune en trois gestes,
  avec ce qu’il faut éviter, pourquoi ça marche, et une comparaison « à faire / à éviter ».
  On y trouve par exemple le *squinch* et le « front en avant » du portraitiste Peter Hurley,
  le *smize* de Tyra Banks, le contrapposto, la pose tapis rouge…
- **L’entraînement** : échauffement d’acteur (respiration, mâchoire, faux rire), enchaînement de
  poses devant le miroir avec chrono, exercice « bouge à chaque déclic », quiz « l’œil du photographe ».
- **Le coach (bêta)** : la caméra (ou une photo existante) analyse ta posture et propose des
  corrections en direct, avec un score, un retardateur et des conseils à voix haute.
  L’analyse tourne **entièrement dans le navigateur** avec [MediaPipe](https://ai.google.dev/edge/mediapipe) :
  aucune image n’est envoyée.
- **La progression** : poses maîtrisées, favoris, meilleurs scores et série de jours, gardés sur l’appareil.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests de l’analyse de posture
npm run build      # version de production dans dist/
```

La caméra ne fonctionne que sur `localhost` ou en HTTPS. Pour tester sur ton téléphone,
utilise la version déployée (voir ci-dessous) ou `npm run dev -- --host` avec un tunnel HTTPS.

## Déploiement

Le workflow `.github/workflows/deploy.yml` publie l’application sur GitHub Pages à chaque push sur
`master`. Il faut activer une fois **Settings → Pages → Source : GitHub Actions** dans le dépôt.
Sur téléphone, « Ajouter à l’écran d’accueil » l’installe comme une application.

## Comment fonctionne le coach

1. MediaPipe détecte 33 points du corps (Pose Landmarker) ou le maillage du visage et ses
   expressions (Face Landmarker), selon la pose visée.
2. `src/coach/analysis.ts` en tire des mesures lisibles : rotation des épaules par rapport à
   l’objectif, flexion des genoux, espace entre bras et buste, main sur la hanche, épaules qui
   remontent, menton levé, paupière inférieure (squinch), sourire des yeux…
3. Chaque pose déclare ses critères dans `src/data/poses.ts` (plage attendue + correction à
   afficher). Le coach note chaque critère « ok / presque / à corriger » et affiche la correction
   la plus importante.

Les seuils sont des premières estimations : ils se règlent dans `src/data/poses.ts`.

## Structure

```
src/
  data/poses.ts        catalogue des poses (texte, illustration, critères du coach)
  data/training.ts     règles d’or, échauffement, variations
  figure/              silhouettes SVG générées à partir de squelettes 2D
  coach/               détection MediaPipe, mesures, évaluation, dessin
  pages/               accueil, poses, entraînement, coach
```

## Idées pour la suite

- Calibrer les seuils du coach sur de vraies séances.
- Comparer la silhouette détectée à la silhouette de référence (superposition « fantôme »).
- Poses à deux ou en groupe, poses avec accessoires.
- Programme sur 7 jours avec rappels.
