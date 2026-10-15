/** The handful of rules photographers repeat on every shoot. */
export const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: 'Ce qui est proche paraît plus grand',
    body: 'L’objectif grossit ce qui est près de lui. Avance ce que tu veux mettre en valeur (le visage), éloigne le reste (coudes, hanches, genoux).',
  },
  {
    title: 'Si ça se plie, plie-le',
    body: 'Coudes, poignets, genoux : une articulation légèrement pliée paraît vivante. Une articulation verrouillée paraît raide.',
  },
  {
    title: 'Crée de l’espace',
    body: 'Un peu de vide entre les bras et la taille dessine la silhouette. Les bras collés l’élargissent.',
  },
  {
    title: 'Bouge à chaque déclic',
    body: 'Les modèles changent un détail à chaque photo : la tête, une main, le regard. Rester figé, c’est là que le malaise s’installe.',
  },
  {
    title: 'Expire avant la photo',
    body: 'On retient sa respiration quand on est tendu. Expire doucement par la bouche juste avant le déclenchement : épaules et mâchoire se relâchent.',
  },
  {
    title: 'Les yeux font le sourire',
    body: 'Un sourire sans les yeux paraît poli. Pense à quelque chose de drôle : les yeux suivent.',
  },
  {
    title: 'L’inconfort est normal',
    body: 'Beaucoup de poses photogéniques sont étranges à tenir. Ce que tu ressens n’est pas ce que l’on voit : fais confiance à l’image.',
  },
]

export interface WarmupStep {
  title: string
  body: string
  seconds: number
}

/** Routine inspired by the warm-ups actors do before going on stage or on set. */
export const WARMUP: WarmupStep[] = [
  {
    title: 'Respiration carrée',
    body: 'Inspire 4 secondes, bloque 4, expire 4, bloque 4. Le rythme cardiaque descend, le trac aussi.',
    seconds: 48,
  },
  {
    title: 'Épaules',
    body: 'Monte les épaules jusqu’aux oreilles en inspirant, puis laisse-les tomber d’un coup en expirant. Recommence 5 fois.',
    seconds: 25,
  },
  {
    title: 'Secoue tout',
    body: 'Secoue les mains, les bras, puis les jambes, comme pour te sécher. La tension accumulée s’en va.',
    seconds: 20,
  },
  {
    title: 'Mâchoire',
    body: 'Bâille franchement, puis masse les joues en petits cercles, là où la mâchoire se serre.',
    seconds: 25,
  },
  {
    title: 'Citron, lion',
    body: 'Fais une grimace « citron » (tout le visage serré), puis « lion » (bouche et yeux grands ouverts, langue sortie). Alterne : le visage se réveille.',
    seconds: 30,
  },
  {
    title: 'Le faux rire',
    body: 'Ris sans raison, bouche ouverte. Au bout de quelques secondes, il devient vrai. C’est l’état idéal pour une photo.',
    seconds: 20,
  },
  {
    title: 'Ancrage',
    body: 'Pieds au sol, poids sur une jambe, grandis-toi par le haut du crâne. Expire. Tu es prêt(e).',
    seconds: 20,
  },
]

/** Micro-variations to rehearse "move at every click". */
export const VARIATIONS: string[] = [
  'Tourne la tête de quelques degrés vers la lumière',
  'Change de jambe d’appui',
  'Regarde hors champ, puis reviens vers l’objectif',
  'Pose une main sur la hanche',
  'Passe du sourire au squinch',
  'Touche ton col ou ta manche',
  'Incline légèrement la tête',
  'Glisse un pouce dans une poche',
  'Avance le front, menton vers le bas',
  'Fais un petit rire',
  'Croise les bras, sans serrer',
  'Tourne les épaules un peu plus',
  'Ferme les yeux, expire, rouvre-les sur l’objectif',
  'Baisse l’épaule la plus proche',
  'Fais un pas vers l’objectif',
]
