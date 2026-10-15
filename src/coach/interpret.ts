import { bodyFramingIssue, bodyMetrics, F, faceMetrics, type LM } from './analysis'
import type { Detection } from './landmarker'
import type { CoachSpec, Metrics } from './types'

export interface Reading {
  metrics: Metrics
  framingIssue?: string
  /** Normalised landmarks to draw on top of the picture. */
  points: LM[]
}

/** Analysis used when no specific pose is targeted. */
export const FREE_SPEC: CoachSpec = {
  mode: 'body',
  framing: 'upper',
  checks: [
    {
      id: 'free-turn',
      label: 'Corps légèrement tourné',
      metric: 'torsoYaw',
      min: 12,
      max: 70,
      tooLow: 'Tourne un peu le corps : de trois-quarts, la silhouette s’affine.',
      tooHigh: 'Tu es presque de profil : reviens un peu vers l’objectif.',
    },
    {
      id: 'free-arms',
      label: 'De l’air entre un bras et le corps',
      metric: 'armSpaceMax',
      min: 18,
      tooLow: 'Décolle un bras du corps : main sur la hanche, dans la poche, ou coude souple.',
    },
    {
      id: 'free-knee',
      label: 'Un genou souple',
      metric: 'kneeBendMax',
      min: 6,
      tooLow: 'Mets ton poids sur une jambe et relâche l’autre genou.',
      weight: 0.7,
    },
  ],
}

export function interpret(det: Detection, spec: CoachSpec, aspect: number): Reading {
  if (det.mode === 'body') {
    const image = det.result.landmarks[0] ?? []
    const world = det.result.worldLandmarks[0] ?? []
    const framingIssue = bodyFramingIssue(image, spec.framing)
    if (!image.length || !world.length) return { metrics: {}, framingIssue, points: [] }
    return { metrics: bodyMetrics({ image, world, aspect }), framingIssue, points: image }
  }

  const landmarks = det.result.faceLandmarks[0] ?? []
  if (!landmarks.length) {
    return { metrics: {}, framingIssue: 'Je ne vois pas ton visage : regarde l’objectif, bien éclairé(e).', points: [] }
  }
  const blendshapes: Record<string, number> = {}
  for (const c of det.result.faceBlendshapes[0]?.categories ?? []) blendshapes[c.categoryName] = c.score
  const width = Math.abs(landmarks[F.cheekR].x - landmarks[F.cheekL].x)
  const framingIssue = width < 0.16 ? 'Rapproche-toi : ton visage doit occuper une bonne partie de l’image.' : undefined
  return { metrics: faceMetrics({ landmarks, blendshapes, aspect }), framingIssue, points: landmarks }
}
