import type { CoachSpec } from '../coach/types'
import type { BodySkeleton, Illustration } from '../figure/types'

export type Category = 'bases' | 'visage' | 'debout' | 'assis' | 'mains'

export const CATEGORIES: { id: Category; label: string; blurb: string }[] = [
  { id: 'bases', label: 'Les bases', blurb: 'Les réflexes qui changent toutes les photos.' },
  { id: 'visage', label: 'Visage', blurb: 'Regard, sourire, menton : le portrait.' },
  { id: 'debout', label: 'Debout', blurb: 'Tapis rouge, marche, appui : en pied.' },
  { id: 'assis', label: 'Assis', blurb: 'Chaise, tabouret, terrasse.' },
  { id: 'mains', label: 'Mains', blurb: 'Que faire de ses mains ?' },
]

export interface Pose {
  id: string
  name: string
  category: Category
  level: 1 | 2 | 3
  /** Where this pose shines. */
  contexts: string[]
  summary: string
  why: string
  /** Numbered steps; numbers match the markers on the illustration. */
  steps: string[]
  avoid: string[]
  tip?: string
  origin?: string
  illustration: Illustration
  mistake?: { illustration: Illustration; caption: string }
  coach?: CoachSpec
}

/* ---------- Reusable skeletons ---------- */

const NEUTRAL: BodySkeleton = {
  kind: 'body',
  head: [100, 38],
  neck: [100, 58],
  ls: [77, 70],
  rs: [123, 70],
  le: [74, 112],
  re: [126, 112],
  lw: [76, 150],
  rw: [124, 150],
  lh: [87, 150],
  rh: [113, 150],
  lk: [89, 208],
  rk: [111, 208],
  la: [90, 264],
  ra: [110, 264],
  lf: [86, 276],
  rf: [114, 276],
}

const THREE_QUARTER: BodySkeleton = {
  kind: 'body',
  head: [98, 38],
  headTilt: -3,
  neck: [99, 58],
  ls: [81, 71],
  rs: [117, 68],
  le: [78, 113],
  re: [121, 110],
  lw: [80, 150],
  rw: [122, 147],
  lh: [91, 151],
  rh: [112, 148],
  lk: [93, 208],
  rk: [113, 206],
  la: [94, 264],
  ra: [113, 262],
  lf: [84, 274],
  rf: [119, 272],
  far: 'r',
}

const SEATED_SIDE: BodySkeleton = {
  kind: 'body',
  prop: 'chair',
  head: [131, 100],
  headTilt: 4,
  facing: 'right',
  neck: [125, 120],
  ls: [113, 132],
  rs: [129, 130],
  le: [118, 172],
  re: [131, 174],
  lw: [148, 196],
  rw: [156, 198],
  lh: [112, 208],
  rh: [124, 208],
  lk: [164, 208],
  rk: [170, 210],
  la: [160, 266],
  ra: [168, 268],
  lf: [174, 277],
  rf: [182, 278],
  far: 'l',
}

/* ---------- Coach checks shared between poses ---------- */

const turned = (min = 25, max = 60) => ({
  id: 'torso-turn',
  label: 'Corps de trois-quarts',
  metric: 'torsoYaw' as const,
  min,
  max,
  tooLow: 'Tourne les épaules d’environ 45° par rapport à l’objectif.',
  tooHigh: 'Tu es presque de profil : reviens un peu vers l’objectif.',
})

const weightBack = (min = 10, max = 45) => ({
  id: 'weight-back',
  label: 'Un genou souple, poids sur la jambe arrière',
  metric: 'kneeBendMax' as const,
  min,
  max,
  tooLow: 'Plie légèrement le genou avant et repose ton poids sur la jambe arrière.',
  tooHigh: 'Ton genou est très plié : relâche un peu, juste assez pour casser la ligne.',
})

const armSpace = (min = 25) => ({
  id: 'arm-space',
  label: 'De l’espace entre un bras et le corps',
  metric: 'armSpaceMax' as const,
  min,
  tooLow: 'Décolle un bras du corps : main sur la hanche ou coude légèrement écarté.',
})

const seated = {
  id: 'seated',
  label: 'Assis(e)',
  metric: 'thighPitch' as const,
  min: 50,
  tooLow: 'Assieds-toi pour cette pose (cuisses à l’horizontale).',
}

/* ---------- The poses ---------- */

export const POSES: Pose[] = [
  {
    id: 'trois-quarts',
    name: 'Le trois-quarts',
    category: 'bases',
    level: 1,
    contexts: ['Partout', 'Portrait pro', 'Soirée'],
    summary: 'Tourner le corps à 45° de l’objectif, puis ramener le visage vers lui.',
    why: 'Face à l’objectif, la silhouette paraît plus large et statique. De trois-quarts, le corps s’affine, la profondeur apparaît et la photo gagne en mouvement. C’est la base de presque toutes les poses de tapis rouge.',
    steps: [
      'Tourne les épaules et les hanches d’environ 45° par rapport à l’objectif.',
      'Ramène le visage vers l’objectif, menton légèrement en avant.',
      'Laisse l’épaule la plus proche de l’objectif descendre un peu.',
    ],
    avoid: ['Rester « carré » face à l’objectif comme sur une photo d’identité.', 'Tourner aussi la tête : on se retrouve de profil sans le vouloir.'],
    tip: 'Repère : pointe ton nombril vers un point situé à côté du photographe, pas sur lui.',
    illustration: {
      skeleton: THREE_QUARTER,
      arrows: [{ from: [64, 92], to: [136, 86], bend: -14 }],
      markers: [
        { n: 1, at: [146, 100] },
        { n: 2, at: [122, 28] },
        { n: 3, at: [62, 66] },
      ],
    },
    mistake: {
      illustration: { skeleton: NEUTRAL },
      caption: 'Épaules carrées face à l’objectif : la silhouette paraît plus large et figée.',
    },
    coach: { mode: 'body', framing: 'upper', checks: [turned()] },
  },
  {
    id: 'poids-arriere',
    name: 'Le poids sur la jambe arrière',
    category: 'bases',
    level: 1,
    contexts: ['En pied', 'Soirée', 'Vacances'],
    summary: 'Tout le poids sur la jambe arrière, le genou avant souple.',
    why: 'C’est le contrapposto des sculpteurs grecs, repris par Michel-Ange pour son David : une jambe porte, l’autre se relâche. Les hanches s’inclinent, la silhouette dessine un S naturel au lieu d’un I rigide.',
    steps: [
      'Mets ton poids sur la jambe la plus éloignée de l’objectif.',
      'Plie légèrement le genou avant et pointe ce pied vers l’objectif.',
      'Laisse les hanches s’incliner, les épaules restent souples.',
    ],
    avoid: ['Répartir le poids sur les deux jambes, pieds parallèles.', 'Bloquer les deux genoux : la posture devient militaire.'],
    tip: '« Si ça se plie, plie-le » : genoux, coudes, poignets légèrement pliés paraissent toujours plus naturels.',
    origin: 'Contrapposto, sculpture grecque classique (Polyclète) puis Renaissance.',
    illustration: {
      skeleton: {
        ...THREE_QUARTER,
        head: [100, 38],
        neck: [101, 58],
        ls: [83, 71],
        rs: [118, 67],
        le: [80, 113],
        re: [122, 108],
        lw: [82, 150],
        rw: [123, 145],
        lh: [92, 154],
        rh: [113, 147],
        lk: [98, 207],
        rk: [114, 205],
        la: [91, 263],
        ra: [116, 262],
        lf: [82, 274],
        rf: [123, 271],
      },
      markers: [
        { n: 1, at: [134, 228] },
        { n: 2, at: [80, 214] },
        { n: 3, at: [134, 150] },
      ],
      arrows: [{ from: [140, 182], to: [124, 262], bend: 8 }],
    },
    mistake: {
      illustration: {
        skeleton: { ...NEUTRAL, lk: [92, 208], rk: [108, 208], la: [94, 264], ra: [106, 264], lf: [90, 276], rf: [110, 276] },
      },
      caption: 'Poids réparti, genoux verrouillés, pieds joints : la pose paraît raide.',
    },
    coach: { mode: 'body', framing: 'full', checks: [weightBack(), turned(15, 60)] },
  },
  {
    id: 'espace-bras',
    name: 'L’espace entre bras et corps',
    category: 'bases',
    level: 1,
    contexts: ['Partout'],
    summary: 'Décoller les bras du buste pour créer des « triangles » de vide.',
    why: 'Un bras plaqué contre le corps s’écrase et élargit la silhouette. Un peu d’air entre le bras et la taille dessine la ligne du corps et donne de la légèreté à la pose.',
    steps: [
      'Pose une main sur la hanche, coude vers l’arrière plutôt que sur le côté.',
      'Garde l’autre bras légèrement écarté, coude souple.',
      'Vérifie qu’on voit du vide entre chaque bras et la taille.',
    ],
    avoid: ['Les bras collés le long du corps.', 'La main crispée sur la hanche : pose-la, ne t’y accroche pas.'],
    tip: 'Sans hanche disponible, glisse simplement un pouce dans une poche : le coude se décolle tout seul.',
    illustration: {
      skeleton: {
        ...NEUTRAL,
        ls: [79, 70],
        rs: [121, 69],
        le: [60, 106],
        lw: [84, 138],
        re: [132, 110],
        rw: [138, 146],
        lh: [88, 150],
        rh: [112, 150],
      },
      markers: [
        { n: 1, at: [52, 96] },
        { n: 2, at: [148, 120] },
        { n: 3, at: [76, 122] },
      ],
    },
    mistake: {
      illustration: { skeleton: { ...NEUTRAL, le: [80, 112], re: [120, 112], lw: [84, 150], rw: [116, 150] } },
      caption: 'Bras plaqués contre le corps : ils s’écrasent et élargissent la silhouette.',
    },
    coach: { mode: 'body', framing: 'upper', checks: [armSpace()] },
  },
  {
    id: 'posture',
    name: 'La posture allongée',
    category: 'bases',
    level: 1,
    contexts: ['Partout'],
    summary: 'Grandir par le haut du crâne, épaules basses et en arrière.',
    why: 'Le dos rond et les épaules qui remontent trahissent immédiatement la gêne. Une colonne allongée donne de la présence sans raideur, et elle libère le cou, qui paraît plus long.',
    steps: [
      'Imagine un fil qui tire le sommet de ton crâne vers le plafond.',
      'Expire et laisse les épaules descendre, loin des oreilles.',
      'Engage légèrement le ventre, sans bomber le torse.',
    ],
    avoid: ['Le dos rond et la tête qui part en avant.', 'Le torse bombé « garde-à-vous », aussi raide que le dos rond.'],
    tip: 'Fais-le juste avant le déclenchement : expire, grandis-toi, puis souris.',
    illustration: {
      skeleton: { ...NEUTRAL, head: [100, 36], neck: [100, 57] },
      guides: [{ from: [100, 2], to: [100, 20] }],
      arrows: [
        { from: [62, 50], to: [66, 66], bend: 0 },
        { from: [138, 50], to: [134, 66], bend: 0 },
      ],
      markers: [
        { n: 1, at: [116, 10] },
        { n: 2, at: [148, 58] },
        { n: 3, at: [128, 128] },
      ],
    },
    mistake: {
      illustration: {
        skeleton: {
          ...NEUTRAL,
          head: [100, 46],
          headTilt: 0,
          neck: [100, 62],
          ls: [79, 64],
          rs: [121, 64],
          le: [76, 106],
          re: [124, 106],
          lw: [80, 144],
          rw: [120, 144],
        },
      },
      caption: 'Épaules remontées, tête rentrée : le cou disparaît et la gêne se voit.',
    },
    coach: {
      mode: 'body',
      framing: 'upper',
      checks: [
        {
          id: 'shoulders-down',
          label: 'Épaules basses, cou long',
          metric: 'neckGap',
          min: 0.27,
          tooLow: 'Grandis-toi par le haut du crâne et laisse tomber les épaules.',
          tolerance: 0.04,
        },
        {
          id: 'torso-upright',
          label: 'Buste droit',
          metric: 'torsoLean',
          max: 10,
          tooHigh: 'Ton buste penche : redresse-toi, comme tiré(e) par un fil.',
        },
        {
          id: 'shoulders-level',
          label: 'Épaules équilibrées',
          metric: 'shoulderTilt',
          max: 6,
          tooHigh: 'Une épaule remonte : relâche-la.',
        },
      ],
    },
  },

  /* ---- Visage ---- */
  {
    id: 'squinch',
    name: 'Le « squinch »',
    category: 'visage',
    level: 2,
    contexts: ['Portrait pro', 'LinkedIn', 'Selfie'],
    summary: 'Remonter très légèrement la paupière inférieure pour un regard assuré.',
    why: 'Des yeux grands ouverts expriment la surprise ou la peur, c’est le « regard de biche dans les phares ». Plisser à peine la paupière du bas donne un regard confiant, concentré, qui accroche l’objectif.',
    steps: [
      'Garde la paupière supérieure immobile.',
      'Remonte doucement la paupière inférieure, comme pour lire un panneau au loin.',
      'Arrête-toi avant de plisser tout le visage : c’est subtil.',
    ],
    avoid: ['Les yeux écarquillés.', 'Plisser les deux paupières : on a l’air ébloui ou suspicieux.'],
    tip: 'Entraîne-toi devant un miroir : alterne yeux ouverts / squinch jusqu’à sentir le petit muscle sous l’œil.',
    origin: 'Technique popularisée par le portraitiste new-yorkais Peter Hurley.',
    illustration: {
      skeleton: { kind: 'face', view: 'front', eyes: 'squinch', mouth: 'soft' },
      markers: [{ n: 2, at: [50, 132] }],
      arrows: [{ from: [80, 140], to: [80, 128] }],
    },
    mistake: {
      illustration: { skeleton: { kind: 'face', view: 'front', eyes: 'wide', mouth: 'neutral' } },
      caption: 'Yeux écarquillés : le regard paraît surpris, voire inquiet.',
    },
    coach: {
      mode: 'face',
      framing: 'face',
      checks: [
        {
          id: 'squint',
          label: 'Paupière inférieure légèrement remontée',
          metric: 'squint',
          min: 0.18,
          max: 0.75,
          tooLow: 'Remonte un peu la paupière du bas, comme pour lire au loin.',
          tooHigh: 'Trop plissé : relâche un peu, garde le regard ouvert.',
        },
        {
          id: 'not-wide',
          label: 'Pas de regard écarquillé',
          metric: 'eyeWide',
          max: 0.3,
          tooHigh: 'Tes yeux s’écarquillent : relâche le haut des paupières.',
        },
      ],
    },
  },
  {
    id: 'front-en-avant',
    name: 'Front en avant, menton vers le bas',
    category: 'visage',
    level: 2,
    contexts: ['Portrait pro', 'LinkedIn', 'Selfie'],
    summary: 'Avancer le front vers l’objectif et baisser le menton d’un rien.',
    why: 'Quand on est mal à l’aise, on recule la tête et le double menton apparaît. Avancer le front tend la ligne de la mâchoire et la sépare du cou : le visage paraît plus net et plus déterminé.',
    steps: [
      'Avance tout le visage vers l’objectif, en partant du front.',
      'Baisse très légèrement le menton, sans le rentrer.',
      'Garde les épaules en place : seule la tête avance.',
    ],
    avoid: ['Reculer la tête pour « se protéger » de l’objectif.', 'Lever le menton : on voit les narines et le cou s’élargit.'],
    tip: 'La sensation est étrange, presque comique de profil. Sur la photo, de face, elle ne se voit pas : seul le contour du visage s’affine.',
    origin: 'Le conseil phare de Peter Hurley pour le portrait professionnel.',
    illustration: {
      skeleton: { kind: 'face', view: 'profile', chin: 'forward' },
      arrows: [{ from: [140, 76], to: [172, 76] }],
      markers: [
        { n: 1, at: [180, 60] },
        { n: 2, at: [176, 190] },
      ],
    },
    mistake: {
      illustration: { skeleton: { kind: 'face', view: 'profile', chin: 'tucked' } },
      caption: 'Tête reculée : la mâchoire se noie dans le cou, le double menton apparaît.',
    },
    coach: {
      mode: 'face',
      framing: 'face',
      checks: [
        {
          id: 'forehead-forward',
          label: 'Front légèrement vers l’objectif',
          metric: 'facePitch',
          min: 7,
          max: 28,
          tooLow: 'Avance le front vers l’objectif et baisse le menton d’un rien.',
          tooHigh: 'Ton menton descend trop : relève-le légèrement.',
        },
      ],
    },
  },
  {
    id: 'smize',
    name: 'Le « smize »',
    category: 'visage',
    level: 2,
    contexts: ['Portrait', 'Soirée', 'Selfie'],
    summary: 'Sourire avec les yeux, bouche détendue.',
    why: 'Un sourire de la bouche seule paraît poli et figé. Quand les yeux sourient, le regard s’éclaire et l’expression paraît sincère, même bouche fermée.',
    steps: [
      'Pense à quelque chose qui t’amuse vraiment.',
      'Laisse le sourire monter jusqu’aux yeux : les joues remontent légèrement.',
      'Garde la bouche détendue, à peine entrouverte ou fermée.',
    ],
    avoid: ['Le sourire « commercial » uniquement avec la bouche.', 'Plisser fort les yeux : le regard disparaît.'],
    tip: 'Couvre ta bouche avec la main devant le miroir : on doit encore deviner que tu souris.',
    origin: 'Mot inventé par Tyra Banks (smile + eyes) dans l’émission America’s Next Top Model.',
    illustration: {
      skeleton: { kind: 'face', view: 'front', eyes: 'smize', mouth: 'soft' },
      markers: [
        { n: 2, at: [150, 138] },
        { n: 3, at: [134, 168] },
      ],
    },
    mistake: {
      illustration: { skeleton: { kind: 'face', view: 'front', eyes: 'open', mouth: 'smile' } },
      caption: 'Sourire de la bouche seule : les yeux restent « éteints », l’expression paraît forcée.',
    },
    coach: {
      mode: 'face',
      framing: 'face',
      checks: [
        {
          id: 'eyes-smile',
          label: 'Les yeux sourient',
          metric: 'squint',
          min: 0.15,
          tooLow: 'Laisse le sourire monter jusqu’aux yeux, joues légèrement relevées.',
        },
        {
          id: 'mouth-soft',
          label: 'Bouche détendue',
          metric: 'smile',
          max: 0.45,
          tooHigh: 'Ici, le sourire est dans les yeux : relâche un peu la bouche.',
        },
      ],
    },
  },
  {
    id: 'sourire-naturel',
    name: 'Le sourire naturel',
    category: 'visage',
    level: 1,
    contexts: ['Partout', 'Famille', 'Mariage'],
    summary: 'Déclencher un vrai sourire plutôt que de le « tenir ».',
    why: 'Un sourire tenu plus de quelques secondes se fige. Les acteurs le relancent à la demande : rire d’abord, puis laisser le sourire redescendre au moment du déclenchement. C’est le sourire de Duchenne, celui qui plisse les yeux.',
    steps: [
      'Expire par la bouche et détends la mâchoire.',
      'Fais un petit rire, même faux : il devient vite vrai.',
      'Laisse le sourire retomber à moitié : c’est le bon moment.',
    ],
    avoid: ['Dire « cheese » : la bouche s’étire sans les yeux.', 'Tenir le même sourire pendant toute la série.'],
    tip: 'Place la langue derrière les dents du haut : le sourire paraît plus doux et moins crispé.',
    illustration: {
      skeleton: { kind: 'face', view: 'front', eyes: 'smize', mouth: 'smile', tilt: -4 },
      markers: [{ n: 3, at: [150, 168] }],
    },
    mistake: {
      illustration: { skeleton: { kind: 'face', view: 'front', eyes: 'wide', mouth: 'smile' } },
      caption: 'Sourire forcé : grande bouche, yeux écarquillés.',
    },
    coach: {
      mode: 'face',
      framing: 'face',
      checks: [
        { id: 'smile', label: 'Un vrai sourire', metric: 'smile', min: 0.4, tooLow: 'Fais un petit rire, puis laisse le sourire retomber à moitié.' },
        { id: 'duchenne', label: 'Les yeux participent', metric: 'squint', min: 0.12, tooLow: 'Ton sourire reste sur la bouche : pense à quelque chose de drôle.' },
      ],
    },
  },
  {
    id: 'regard-hors-champ',
    name: 'Le regard hors champ',
    category: 'visage',
    level: 1,
    contexts: ['Lifestyle', 'Voyage', 'Réseaux'],
    summary: 'Regarder ailleurs, comme si quelque chose venait de capter ton attention.',
    why: 'Fixer l’objectif en continu met sous pression. Regarder hors champ raconte une histoire et donne des photos « prises sur le vif ». Alterner les deux te donne des respirations entre les poses.',
    steps: [
      'Tourne légèrement la tête vers une source de lumière.',
      'Fixe un vrai point (un arbre, une fenêtre), pas le vide.',
      'Reviens vers l’objectif lentement : le photographe a souvent la meilleure image pendant le retour.',
    ],
    avoid: ['Regarder le sol : les paupières se ferment et le visage s’assombrit.', 'Un regard vide, sans cible.'],
    tip: 'Pense à une phrase précise en regardant ailleurs : le regard s’anime.',
    illustration: {
      skeleton: { kind: 'face', view: 'front', eyes: 'open', mouth: 'soft', gaze: 1, tilt: 3, shoulders: 'angled' },
      arrows: [{ from: [140, 80], to: [190, 64], bend: -6 }],
      markers: [{ n: 2, at: [182, 92] }],
    },
    coach: {
      mode: 'face',
      framing: 'face',
      checks: [
        {
          id: 'head-turn',
          label: 'Tête légèrement tournée',
          metric: 'faceYaw',
          min: 10,
          max: 40,
          tooLow: 'Tourne un peu la tête vers un point hors champ.',
          tooHigh: 'Tu es presque de profil : reviens un peu vers l’objectif.',
        },
      ],
    },
  },

  /* ---- Debout ---- */
  {
    id: 'tapis-rouge',
    name: 'La pose tapis rouge',
    category: 'debout',
    level: 2,
    contexts: ['Soirée', 'Événement', 'Mariage'],
    summary: 'Trois-quarts, main sur la hanche, pied avant vers l’objectif.',
    why: 'C’est la combinaison des bases : le trois-quarts affine, la main sur la hanche crée un triangle d’espace, le genou avant casse la ligne. Les stars la répètent jusqu’à pouvoir la prendre en une seconde.',
    steps: [
      'Pose la main la plus éloignée sur la hanche, coude vers l’arrière.',
      'Avance le pied le plus proche, pointé vers l’objectif, genou plié.',
      'Ramène le visage vers l’objectif, léger squinch, menton en avant.',
    ],
    avoid: ['La main sur la hanche avec le coude vers l’objectif : le bras paraît énorme.', 'Les deux pieds parallèles.'],
    tip: 'Entre deux photos, change un seul détail : la main, l’inclinaison de la tête, le regard.',
    illustration: {
      skeleton: {
        kind: 'body',
        head: [97, 38],
        headTilt: -4,
        neck: [99, 58],
        ls: [82, 71],
        rs: [117, 68],
        le: [79, 112],
        lw: [86, 148],
        re: [136, 100],
        rw: [114, 128],
        lh: [91, 153],
        rh: [112, 146],
        lk: [100, 206],
        la: [93, 262],
        lf: [85, 275],
        rk: [113, 205],
        ra: [115, 263],
        rf: [122, 272],
        far: 'r',
      },
      markers: [
        { n: 1, at: [148, 90] },
        { n: 2, at: [76, 228] },
        { n: 3, at: [120, 26] },
      ],
    },
    mistake: {
      illustration: { skeleton: NEUTRAL },
      caption: 'Face à l’objectif, bras le long du corps : la pose « photo de classe ».',
    },
    coach: {
      mode: 'body',
      framing: 'full',
      checks: [
        turned(20, 60),
        {
          id: 'hand-hip',
          label: 'Une main sur la hanche',
          metric: 'handOnHip',
          min: 50,
          tooLow: 'Pose une main sur la hanche, coude vers l’arrière.',
          tolerance: 10,
        },
        armSpace(30),
        weightBack(8, 45),
      ],
    },
  },
  {
    id: 'main-poche',
    name: 'La main dans la poche',
    category: 'debout',
    level: 1,
    contexts: ['Décontracté', 'Portrait pro', 'Vacances'],
    summary: 'Une main dans la poche, pouce dehors, l’autre bras libre.',
    why: 'C’est la réponse la plus simple à « que faire de mes mains ? ». La main est occupée, le coude se décolle du corps, et l’attitude paraît détendue sans effort.',
    steps: [
      'Glisse une main dans la poche avant, à moitié seulement.',
      'Laisse le pouce dehors : la main ne disparaît pas et le poignet reste fin.',
      'Mets ton poids sur la jambe arrière.',
    ],
    avoid: ['La main enfoncée jusqu’au poignet : l’épaule remonte.', 'Les deux mains dans les poches : on a l’air d’attendre le bus.'],
    tip: 'Sans poche ? Accroche le pouce à la ceinture ou à la bandoulière d’un sac.',
    illustration: {
      skeleton: {
        ...THREE_QUARTER,
        le: [72, 110],
        lw: [88, 140],
        hideHand: ['l'],
        lk: [97, 207],
        la: [92, 263],
        lf: [84, 275],
      },
      markers: [
        { n: 1, at: [60, 104] },
        { n: 2, at: [80, 152] },
        { n: 3, at: [130, 232] },
      ],
    },
    coach: {
      mode: 'body',
      framing: 'upper',
      checks: [
        turned(10, 60),
        {
          id: 'hand-pocket',
          label: 'Une main dans la poche',
          metric: 'handOnHip',
          min: 20,
          tooLow: 'Glisse une main dans la poche avant, pouce dehors : le coude se plie.',
        },
        armSpace(14),
      ],
    },
  },
  {
    id: 'bras-croises',
    name: 'Les bras croisés détendus',
    category: 'debout',
    level: 1,
    contexts: ['Portrait pro', 'LinkedIn', 'Équipe'],
    summary: 'Bras croisés lâches, épaules basses, corps légèrement tourné.',
    why: 'Bras croisés serrés = fermeture. Bras croisés lâches, avec un sourire, = assurance. C’est la pose de couverture des portraits d’entrepreneurs, à condition de ne pas « s’agripper ».',
    steps: [
      'Croise les bras sans serrer : les mains reposent sur les avant-bras.',
      'Laisse les épaules descendre, coudes un peu décollés du buste.',
      'Tourne légèrement le corps et souris : les bras croisés ont besoin d’un visage ouvert.',
    ],
    avoid: ['Les doigts qui pincent les bras.', 'Les bras croisés haut sur la poitrine, épaules remontées.'],
    tip: 'Laisse dépasser le bout des doigts d’une main sur le bras : la pose paraît plus légère.',
    illustration: {
      skeleton: {
        kind: 'body',
        head: [99, 38],
        neck: [100, 58],
        ls: [79, 71],
        rs: [120, 69],
        le: [73, 112],
        re: [127, 110],
        lw: [116, 104],
        rw: [86, 108],
        lh: [89, 151],
        rh: [111, 150],
        lk: [92, 208],
        rk: [111, 207],
        la: [92, 264],
        ra: [111, 263],
        lf: [84, 275],
        rf: [117, 274],
      },
      markers: [
        { n: 1, at: [100, 90] },
        { n: 2, at: [140, 62] },
        { n: 3, at: [122, 28] },
      ],
    },
    coach: {
      mode: 'body',
      framing: 'upper',
      checks: [
        {
          id: 'crossed',
          label: 'Bras croisés',
          metric: 'armsCrossed',
          max: 0.7,
          tooHigh: 'Croise les bras, mains posées sur les avant-bras.',
          tolerance: 0.12,
        },
        turned(8, 50),
      ],
    },
  },
  {
    id: 'appui-mur',
    name: 'L’appui contre un mur',
    category: 'debout',
    level: 1,
    contexts: ['Ville', 'Décontracté', 'Voyage'],
    summary: 'L’épaule contre le mur, les chevilles croisées.',
    why: 'S’appuyer donne une raison d’être là et règle le problème de l’équilibre. Le corps s’incline en diagonale, ce qui crée tout de suite une ligne dynamique.',
    steps: [
      'Pose l’épaule (pas tout le dos) contre le mur.',
      'Éloigne les pieds du mur pour que le corps fasse une diagonale.',
      'Croise les chevilles ou plie le genou extérieur.',
    ],
    avoid: ['Tout le dos plaqué au mur : on dirait une photo d’identité judiciaire.', 'Les pieds collés au mur.'],
    illustration: {
      skeleton: {
        kind: 'body',
        prop: 'wall-left',
        head: [62, 40],
        headTilt: 7,
        neck: [64, 60],
        ls: [46, 73],
        rs: [82, 72],
        le: [52, 114],
        lw: [66, 146],
        re: [92, 112],
        rw: [96, 146],
        hideHand: ['r'],
        lh: [68, 152],
        rh: [90, 151],
        lk: [88, 208],
        rk: [104, 206],
        la: [116, 264],
        ra: [100, 264],
        lf: [126, 275],
        rf: [106, 276],
      },
      markers: [
        { n: 1, at: [30, 74] },
        { n: 2, at: [152, 260] },
        { n: 3, at: [130, 232] },
      ],
    },
    coach: {
      mode: 'body',
      framing: 'full',
      checks: [
        {
          id: 'lean',
          label: 'Corps en diagonale',
          metric: 'torsoLean',
          min: 4,
          max: 25,
          tooLow: 'Éloigne les pieds du mur : ton corps doit faire une légère diagonale.',
          tooHigh: 'Tu penches beaucoup : rapproche un peu les pieds du mur.',
        },
        weightBack(10, 60),
      ],
    },
  },
  {
    id: 'marche',
    name: 'La marche',
    category: 'debout',
    level: 2,
    contexts: ['Ville', 'Voyage', 'Mariage'],
    summary: 'Marcher vers l’objectif, lentement, en croisant légèrement les pas.',
    why: 'Le mouvement est le meilleur remède contre la raideur : on ne peut pas marcher et rester figé. Les photographes demandent souvent de marcher pour obtenir des photos naturelles.',
    steps: [
      'Marche lentement vers l’objectif, un peu en diagonale.',
      'Pose chaque pied presque devant l’autre, comme sur une ligne.',
      'Laisse les bras balancer naturellement, regard au loin ou vers l’objectif.',
    ],
    avoid: ['Marcher trop vite : les photos sont floues et les pas lourds.', 'Regarder ses pieds.'],
    tip: 'Fais plusieurs allers-retours : la deuxième ou troisième marche est toujours la plus naturelle.',
    illustration: {
      skeleton: {
        kind: 'body',
        head: [100, 36],
        neck: [100, 56],
        ls: [84, 69],
        rs: [117, 68],
        le: [80, 109],
        lw: [90, 144],
        re: [126, 106],
        rw: [126, 142],
        lh: [92, 150],
        rh: [110, 148],
        lk: [84, 204],
        la: [80, 258],
        lf: [70, 264],
        rk: [117, 205],
        ra: [130, 256],
        rf: [134, 270],
        far: 'r',
      },
      arrows: [{ from: [40, 250], to: [40, 200] }],
      markers: [
        { n: 1, at: [40, 186] },
        { n: 2, at: [64, 246] },
        { n: 3, at: [146, 130] },
      ],
    },
    coach: {
      mode: 'body',
      framing: 'full',
      checks: [
        { id: 'stride', label: 'Un pas engagé', metric: 'stride', min: 0.45, tooLow: 'Fais un vrai pas : un pied nettement devant l’autre.' },
        weightBack(10, 70),
      ],
    },
  },
  {
    id: 'par-dessus-epaule',
    name: 'Le regard par-dessus l’épaule',
    category: 'debout',
    level: 2,
    contexts: ['Soirée', 'Robe dos nu', 'Voyage'],
    summary: 'Le corps de dos ou de profil, le visage qui revient vers l’objectif.',
    why: 'La torsion entre les épaules et le visage crée une tension élégante et une impression de mouvement, comme si on venait d’être interpellé.',
    steps: [
      'Tourne le corps presque dos à l’objectif.',
      'Ramène le visage par-dessus l’épaule, menton près de l’épaule.',
      'Baisse légèrement l’épaule la plus proche.',
    ],
    avoid: ['Tourner seulement les yeux : le cou se plisse.', 'Lever l’épaule pour y poser le menton.'],
    illustration: {
      skeleton: {
        kind: 'body',
        head: [96, 38],
        facing: 'left',
        neck: [100, 58],
        ls: [82, 72],
        rs: [120, 69],
        le: [78, 113],
        lw: [80, 150],
        re: [124, 111],
        rw: [122, 149],
        lh: [89, 152],
        rh: [112, 151],
        lk: [92, 208],
        rk: [110, 207],
        la: [93, 264],
        ra: [109, 263],
        lf: [96, 276],
        rf: [104, 276],
      },
      arrows: [{ from: [140, 50], to: [78, 22], bend: -14 }],
      markers: [
        { n: 1, at: [144, 120] },
        { n: 2, at: [70, 30] },
        { n: 3, at: [62, 72] },
      ],
    },
    coach: {
      mode: 'body',
      framing: 'upper',
      checks: [
        {
          id: 'turned-away',
          label: 'Corps tourné',
          metric: 'torsoYaw',
          min: 50,
          tooLow: 'Tourne davantage le corps, presque dos à l’objectif.',
        },
        {
          id: 'face-back',
          label: 'Visage vers l’objectif',
          metric: 'faceToCamera',
          min: 1,
          tooLow: 'Ramène ton visage vers l’objectif, par-dessus l’épaule.',
        },
      ],
    },
  },

  /* ---- Assis ---- */
  {
    id: 'assis-bord',
    name: 'Assis au bord de la chaise',
    category: 'assis',
    level: 1,
    contexts: ['Portrait pro', 'Interview', 'Bureau'],
    summary: 'S’asseoir à l’avant du siège, buste droit et légèrement penché vers l’objectif.',
    why: 'Au fond d’une chaise, le dos s’arrondit et le ventre se tasse. Au bord, la posture se redresse d’elle-même et le léger penché vers l’avant traduit l’engagement : c’est la position des interviews télévisées.',
    steps: [
      'Assieds-toi sur le premier tiers du siège.',
      'Redresse le buste, puis penche-le légèrement vers l’objectif.',
      'Pose les mains sur les cuisses, sans t’appuyer dessus.',
    ],
    avoid: ['S’enfoncer contre le dossier.', 'Les mains cachées entre les genoux.'],
    illustration: {
      skeleton: SEATED_SIDE,
      markers: [
        { n: 1, at: [118, 232] },
        { n: 2, at: [150, 108] },
        { n: 3, at: [160, 182] },
      ],
      arrows: [{ from: [140, 74], to: [160, 86] }],
    },
    mistake: {
      illustration: {
        skeleton: {
          ...SEATED_SIDE,
          head: [104, 96],
          headTilt: 0,
          neck: [102, 116],
          ls: [86, 130],
          rs: [100, 128],
          le: [96, 170],
          re: [104, 172],
          lw: [124, 196],
          rw: [130, 200],
          lh: [96, 206],
          rh: [108, 206],
          lk: [154, 208],
          rk: [160, 210],
          la: [158, 266],
          ra: [166, 268],
          lf: [170, 277],
          rf: [178, 278],
        },
      },
      caption: 'Enfoncé(e) contre le dossier : le dos s’arrondit et l’attitude paraît passive.',
    },
    coach: {
      mode: 'body',
      framing: 'upper',
      checks: [
        seated,
        {
          id: 'lean-forward',
          label: 'Buste légèrement vers l’objectif',
          metric: 'leanForward',
          min: 4,
          max: 30,
          tooLow: 'Penche légèrement le buste vers l’objectif.',
          tooHigh: 'Tu te penches beaucoup : redresse-toi un peu.',
        },
      ],
    },
  },
  {
    id: 'genoux-de-cote',
    name: 'Les genoux sur le côté',
    category: 'assis',
    level: 2,
    contexts: ['Soirée', 'Canapé', 'Tabouret'],
    summary: 'Genoux serrés et orientés sur le côté, chevilles croisées.',
    why: 'Genoux pointés vers l’objectif, ils paraissent énormes (ce qui est proche paraît plus grand). Les orienter sur le côté allonge les jambes et crée une diagonale élégante.',
    steps: [
      'Assieds-toi droit, genoux joints.',
      'Fais pivoter les deux genoux vers le même côté.',
      'Croise les chevilles et pose les mains sur le genou du dessus.',
    ],
    avoid: ['Les genoux pointés droit vers l’objectif.', 'Les jambes écartées, pieds à plat.'],
    illustration: {
      skeleton: {
        kind: 'body',
        prop: 'stool',
        head: [100, 92],
        headTilt: -5,
        neck: [100, 112],
        ls: [79, 124],
        rs: [121, 124],
        le: [74, 164],
        lw: [80, 200],
        re: [122, 166],
        rw: [92, 204],
        lh: [88, 200],
        rh: [112, 200],
        lk: [70, 212],
        rk: [84, 218],
        la: [70, 270],
        ra: [80, 272],
        lf: [62, 278],
        rf: [72, 280],
      },
      markers: [
        { n: 2, at: [52, 214] },
        { n: 3, at: [94, 276] },
        { n: 1, at: [140, 110] },
      ],
    },
    coach: {
      mode: 'body',
      framing: 'full',
      checks: [seated, turned(0, 45)],
    },
  },
  {
    id: 'coudes-genoux',
    name: 'Les coudes sur les genoux',
    category: 'assis',
    level: 1,
    contexts: ['Décontracté', 'Marches', 'Extérieur'],
    summary: 'Penché vers l’avant, coudes posés sur les genoux, mains jointes.',
    why: 'La pose est stable, les mains sont occupées et le buste qui avance crée une connexion avec l’objectif. Idéale assis sur des marches ou un muret.',
    steps: [
      'Assieds-toi, pieds écartés à largeur d’épaules.',
      'Penche-toi et pose les avant-bras ou les coudes sur les genoux.',
      'Joins les mains sans serrer, visage vers l’objectif.',
    ],
    avoid: ['Le dos très arrondi : penche-toi depuis les hanches.', 'Les doigts entrelacés serrés, articulations blanches.'],
    illustration: {
      skeleton: {
        kind: 'body',
        prop: 'stool',
        head: [100, 104],
        neck: [100, 124],
        ls: [78, 138],
        rs: [122, 138],
        le: [78, 196],
        re: [122, 196],
        lw: [96, 182],
        rw: [104, 182],
        lh: [88, 202],
        rh: [112, 202],
        lk: [76, 214],
        rk: [124, 214],
        la: [74, 272],
        ra: [126, 272],
        lf: [68, 280],
        rf: [132, 280],
      },
      markers: [
        { n: 2, at: [56, 196] },
        { n: 3, at: [100, 160] },
        { n: 1, at: [148, 270] },
      ],
    },
    coach: {
      mode: 'body',
      framing: 'full',
      checks: [
        seated,
        {
          id: 'elbows-knees',
          label: 'Coudes près des genoux',
          metric: 'elbowKneeMin',
          max: 0.6,
          tooHigh: 'Penche-toi et pose les coudes sur les genoux.',
          tolerance: 0.12,
        },
      ],
    },
  },

  /* ---- Mains ---- */
  {
    id: 'mains-occupees',
    name: 'Les mains occupées',
    category: 'mains',
    level: 1,
    contexts: ['Partout'],
    summary: 'Donner une mission à chaque main : un col, une manche, un objet.',
    why: 'Des mains qui pendent sans but sont la première source de malaise. Une main qui touche quelque chose a une raison d’être là, et le geste paraît naturel.',
    steps: [
      'Touche légèrement ton col, ta veste ou la bandoulière d’un sac.',
      'Garde l’autre main occupée : poche, tasse, manche.',
      'Effleure, ne saisis pas : le toucher reste léger.',
    ],
    avoid: ['Les poings fermés.', 'Les mains jointes devant le ventre, « position du footballeur au mur ».'],
    tip: 'Un accessoire (lunettes, café, livre, veste sur l’épaule) règle 90 % des problèmes de mains.',
    illustration: {
      skeleton: {
        ...THREE_QUARTER,
        re: [128, 104],
        rw: [108, 80],
        le: [74, 110],
        lw: [88, 140],
        hideHand: ['l'],
      },
      markers: [
        { n: 1, at: [124, 74] },
        { n: 2, at: [72, 150] },
      ],
    },
    coach: {
      mode: 'body',
      framing: 'upper',
      checks: [
        {
          id: 'hands-busy',
          label: 'Une main occupée',
          metric: 'elbowBendMax',
          min: 45,
          tooLow: 'Donne une mission à une main : col, poche, hanche ou visage.',
        },
        armSpace(15),
      ],
    },
  },
  {
    id: 'main-visage',
    name: 'La main près du visage',
    category: 'mains',
    level: 2,
    contexts: ['Portrait', 'Pensif', 'Beauté'],
    summary: 'Effleurer la mâchoire ou la tempe, la tranche de la main vers l’objectif.',
    why: 'Une main près du visage encadre le regard. Montrer la tranche de la main (et non la paume ou le dos à plat) la rend fine et élégante.',
    steps: [
      'Approche la main du visage, doigts détendus et légèrement espacés.',
      'Montre la tranche de la main à l’objectif, pas la paume.',
      'Effleure à peine : si tu appuies, la peau se déforme.',
    ],
    avoid: ['Poser le menton sur le poing (« le penseur »).', 'Cacher la mâchoire avec toute la main.'],
    tip: 'Imagine que tu tiens une plume : les doigts se placent tout seuls.',
    illustration: {
      skeleton: {
        ...THREE_QUARTER,
        headTilt: 6,
        le: [76, 112],
        lw: [86, 60],
      },
      markers: [
        { n: 2, at: [70, 46] },
        { n: 3, at: [118, 64] },
      ],
    },
    coach: {
      mode: 'body',
      framing: 'upper',
      checks: [
        {
          id: 'hand-face',
          label: 'Une main près du visage',
          metric: 'wristFaceMin',
          max: 0.75,
          tooHigh: 'Approche une main du visage, sans t’y appuyer.',
          tolerance: 0.12,
        },
        turned(10, 60),
      ],
    },
  },
]

export const POSE_BY_ID = new Map(POSES.map((p) => [p.id, p]))

export function posesIn(category: Category) {
  return POSES.filter((p) => p.category === category)
}

/** A stable "pose of the day", the same for everyone on a given date. */
export function poseOfTheDay(date = new Date()) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
  return POSES[day % POSES.length]
}
