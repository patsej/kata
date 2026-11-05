import type { BodyMetric, Check, CheckResult, CheckStatus, CoachSpec, Evaluation, FaceMetric, Metric, Metrics } from './types'

/** A MediaPipe landmark (normalised image coordinates or world metres). */
export interface LM {
  x: number
  y: number
  z: number
  visibility?: number
}

/** MediaPipe Pose landmark indices. */
export const P = {
  nose: 0,
  lEye: 2,
  rEye: 5,
  lEar: 7,
  rEar: 8,
  lSh: 11,
  rSh: 12,
  lEl: 13,
  rEl: 14,
  lWr: 15,
  rWr: 16,
  lHip: 23,
  rHip: 24,
  lKn: 25,
  rKn: 26,
  lAn: 27,
  rAn: 28,
} as const

/** MediaPipe Face Mesh landmark indices used here. */
export const F = { forehead: 10, chin: 152, noseTip: 1, cheekL: 234, cheekR: 454, eyeOutL: 33, eyeOutR: 263 } as const

type V = { x: number; y: number; z: number }
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const mid = (a: V, b: V): V => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 })
const len = (a: V) => Math.hypot(a.x, a.y, a.z)
const dist = (a: V, b: V) => len(sub(a, b))
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y + a.z * b.z
const deg = (rad: number) => (rad * 180) / Math.PI
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Angle at `b` formed by a-b-c, in degrees. */
export function jointAngle(a: V, b: V, c: V) {
  const u = sub(a, b)
  const w = sub(c, b)
  const l = len(u) * len(w)
  if (l === 0) return 180
  return deg(Math.acos(clamp(dot(u, w) / l, -1, 1)))
}

/** Angle of a 2D segment from horizontal, folded into 0 … 90°. */
function lineTilt(dx: number, dy: number) {
  const a = deg(Math.atan2(Math.abs(dy), Math.abs(dx)))
  return a
}

const visible = (lm: LM | undefined, threshold = 0.5) => !!lm && (lm.visibility ?? 1) >= threshold

export interface BodyFrame {
  /** Normalised image landmarks (x, y in 0 … 1). */
  image: LM[]
  /** World landmarks in metres, hips-centred. */
  world: LM[]
  /** Image width / height, to measure 2D angles without distortion. */
  aspect: number
}

export function bodyMetrics({ image, world, aspect }: BodyFrame): Metrics {
  const W = world
  const px = (i: number): V => ({ x: image[i].x * aspect, y: image[i].y, z: 0 })
  const m: Metrics = {}

  const shoulderW = dist(W[P.lSh], W[P.rSh]) || 0.35
  const shMid = mid(W[P.lSh], W[P.rSh])
  const hipMid = mid(W[P.lHip], W[P.rHip])

  // Torso rotation: how much of the shoulder line goes into depth.
  const s = sub(W[P.lSh], W[P.rSh])
  m.torsoYaw = deg(Math.atan2(Math.abs(s.z), Math.abs(s.x)))

  // Arms: gap between upper arm and torso side.
  const arm = (sh: number, el: number, hip: number) => jointAngle(W[el], W[sh], W[hip])
  const armL = arm(P.lSh, P.lEl, P.lHip)
  const armR = arm(P.rSh, P.rEl, P.rHip)
  m.armSpaceMax = Math.max(armL, armR)
  m.armSpaceMin = Math.min(armL, armR)

  // Knees.
  const bendL = 180 - jointAngle(W[P.lHip], W[P.lKn], W[P.lAn])
  const bendR = 180 - jointAngle(W[P.rHip], W[P.rKn], W[P.rAn])
  const legsVisible = visible(image[P.lKn]) && visible(image[P.rKn])
  if (legsVisible) {
    m.kneeBendMax = Math.max(bendL, bendR)
    m.kneeBendMin = Math.min(bendL, bendR)
  }

  // Hands.
  const wrists = [W[P.lWr], W[P.rWr]]
  const hips = [W[P.lHip], W[P.rHip]]
  m.wristHipMin = Math.min(...wrists.flatMap((w) => hips.map((h) => dist(w, h)))) / shoulderW
  m.wristFaceMin = Math.min(...wrists.map((w) => dist(w, W[P.nose]))) / shoulderW
  const crossL = dist(W[P.lWr], W[P.rEl]) / shoulderW
  const crossR = dist(W[P.rWr], W[P.lEl]) / shoulderW
  m.armsCrossed = Math.max(crossL, crossR)
  const elbowL = 180 - jointAngle(W[P.lSh], W[P.lEl], W[P.lWr])
  const elbowR = 180 - jointAngle(W[P.rSh], W[P.rEl], W[P.rWr])
  m.elbowBendMax = Math.max(elbowL, elbowR)
  // A hanging hand is already close to the hip joint: what tells "hand on hip"
  // (or in a pocket) apart is the bent elbow.
  const nearHip = (wr: number) => Math.min(...hips.map((h) => dist(W[wr], h))) / shoulderW < 0.7
  m.handOnHip = Math.max(nearHip(P.lWr) ? elbowL : 0, nearHip(P.rWr) ? elbowR : 0)
  if (legsVisible) {
    const elbows = [W[P.lEl], W[P.rEl]]
    const knees = [W[P.lKn], W[P.rKn]]
    m.elbowKneeMin = Math.min(...elbows.flatMap((e) => knees.map((k) => dist(e, k)))) / shoulderW
  }

  // Seated or standing: thighs angle from vertical (y points down).
  if (legsVisible) {
    const thigh = (hip: number, kn: number) => {
      const t = sub(W[kn], W[hip])
      return deg(Math.acos(clamp(t.y / (len(t) || 1), -1, 1)))
    }
    // Both thighs must be raised: a lunge has one horizontal thigh too.
    m.thighPitch = Math.min(thigh(P.lHip, P.lKn), thigh(P.rHip, P.rKn))
  }

  // Torso lean: z decreases towards the camera.
  const torso = sub(hipMid, shMid)
  // hip.z - shoulder.z > 0 → shoulders closer to the camera than the hips.
  m.leanForward = deg(Math.atan2(torso.z, torso.y))
  m.torsoLean = deg(Math.acos(clamp(torso.y / (len(torso) || 1), -1, 1)))

  if (visible(image[P.lAn]) && visible(image[P.rAn])) {
    const legLen = (dist(W[P.lHip], W[P.lKn]) + dist(W[P.lKn], W[P.lAn]) + dist(W[P.rHip], W[P.rKn]) + dist(W[P.rKn], W[P.rAn])) / 2
    const a = sub(W[P.lAn], W[P.rAn])
    m.stride = Math.hypot(a.x, a.z) / (legLen || 1)
  }

  // 2D measures, in the picture as the camera sees it.
  const iShL = px(P.lSh)
  const iShR = px(P.rSh)
  const iShMid = mid(iShL, iShR)
  const iHipMid = mid(px(P.lHip), px(P.rHip))
  const torsoLen = dist(iShMid, iHipMid) || 0.3
  if (m.torsoYaw < 60) m.shoulderTilt = lineTilt(iShL.x - iShR.x, iShL.y - iShR.y)
  const eyesVisible = visible(image[P.lEye]) && visible(image[P.rEye])
  if (eyesVisible) {
    const eL = px(P.lEye)
    const eR = px(P.rEye)
    m.headTilt = lineTilt(eL.x - eR.x, eL.y - eR.y)
  }
  const earMid = mid(px(P.lEar), px(P.rEar))
  m.neckGap = (iShMid.y - earMid.y) / torsoLen
  m.chinUp = (earMid.y - px(P.nose).y) / torsoLen

  const nose = px(P.nose)
  const lo = Math.min(px(P.lEar).x, px(P.rEar).x)
  const hi = Math.max(px(P.lEar).x, px(P.rEar).x)
  m.faceToCamera = eyesVisible && nose.x > lo && nose.x < hi ? 1 : 0

  return m
}

/** Pre-condition: is the person framed well enough to analyse this pose? */
export function bodyFramingIssue(image: LM[], framing: CoachSpec['framing']): string | undefined {
  if (!image.length) return 'Je ne te vois pas encore : place-toi face à l’objectif, bien éclairé.'
  const shoulders = visible(image[P.lSh]) || visible(image[P.rSh])
  if (!shoulders) return 'Recule un peu : tes épaules doivent être dans le cadre.'
  if (framing === 'full') {
    const feet = visible(image[P.lAn], 0.4) || visible(image[P.rAn], 0.4)
    const knees = visible(image[P.lKn], 0.4) || visible(image[P.rKn], 0.4)
    if (!knees || !feet) return 'Recule pour qu’on te voie en entier, de la tête aux pieds.'
  }
  if (framing === 'upper') {
    const hips = visible(image[P.lHip], 0.4) || visible(image[P.rHip], 0.4)
    if (!hips) return 'Recule un peu : il faut te voir au moins jusqu’à la taille.'
  }
  return undefined
}

export interface FaceFrame {
  landmarks: LM[]
  /** Blendshape scores by category name, e.g. { eyeSquintLeft: 0.3 }. */
  blendshapes: Record<string, number>
  /** Image width / height. */
  aspect: number
}

export function faceMetrics({ landmarks: L, blendshapes: b, aspect }: FaceFrame): Metrics {
  const g = (k: string) => b[k] ?? 0
  const m: Metrics = {}
  m.squint = (g('eyeSquintLeft') + g('eyeSquintRight')) / 2
  m.smile = (g('mouthSmileLeft') + g('mouthSmileRight')) / 2
  m.eyeOpen = 1 - (g('eyeBlinkLeft') + g('eyeBlinkRight')) / 2
  m.eyeWide = (g('eyeWideLeft') + g('eyeWideRight')) / 2
  m.browTension = g('browInnerUp')

  if (L.length > F.cheekR) {
    // Work in "width units": x and z share a scale, y must be rescaled by 1/aspect.
    const p = (i: number): V => ({ x: L[i].x, y: L[i].y / aspect, z: L[i].z })
    const top = p(F.forehead)
    const chin = p(F.chin)
    m.facePitch = deg(Math.atan2(chin.z - top.z, chin.y - top.y))
    const c = sub(p(F.cheekR), p(F.cheekL))
    m.faceYaw = deg(Math.atan2(Math.abs(c.z), Math.abs(c.x)))
    const e = sub(p(F.eyeOutR), p(F.eyeOutL))
    m.faceRoll = lineTilt(e.x, e.y)
  }
  return m
}

/* ---------- Evaluation ---------- */

const DEG_METRICS = new Set<Metric>([
  'torsoYaw', 'kneeBendMax', 'kneeBendMin', 'armSpaceMax', 'armSpaceMin', 'thighPitch', 'leanForward', 'torsoLean',
  'shoulderTilt', 'headTilt', 'facePitch', 'faceYaw', 'faceRoll', 'elbowBendMax', 'handOnHip',
])

function defaultTolerance(metric: Metric) {
  if (metric === 'faceToCamera') return 0
  return DEG_METRICS.has(metric) ? 6 : 0.06
}

export function evaluateCheck(check: Check, metrics: Metrics): CheckResult {
  const value = metrics[check.metric]
  if (value === undefined || Number.isNaN(value)) {
    return { check, value, status: 'unknown', message: 'Pas mesurable sur cette image.' }
  }
  const tol = check.tolerance ?? defaultTolerance(check.metric)
  let status: CheckStatus = 'ok'
  let message = check.label
  if (check.min !== undefined && value < check.min) {
    status = value >= check.min - tol && tol > 0 ? 'near' : 'fix'
    message = check.tooLow ?? check.label
  } else if (check.max !== undefined && value > check.max) {
    status = value <= check.max + tol && tol > 0 ? 'near' : 'fix'
    message = check.tooHigh ?? check.label
  }
  return { check, value, status, message }
}

/** Checks every pose gets, unless the pose already measures the same metric. */
export const BODY_BASE_CHECKS: Check[] = [
  {
    id: 'shoulders-relaxed',
    label: 'Épaules relâchées',
    metric: 'neckGap',
    min: 0.22,
    tooLow: 'Tes épaules remontent vers les oreilles : expire et laisse-les descendre.',
    tolerance: 0.04,
    weight: 0.6,
  },
  {
    id: 'head-straight',
    label: 'Tête stable',
    metric: 'headTilt',
    max: 18,
    tooHigh: 'Ta tête penche beaucoup : une légère inclinaison suffit.',
    weight: 0.5,
  },
  {
    id: 'chin-level',
    label: 'Menton à niveau',
    metric: 'chinUp',
    max: 0.03,
    tooHigh: 'Ton menton monte : avance le front et redescends le menton d’un rien.',
    tolerance: 0.02,
    weight: 0.6,
  },
]

export const FACE_BASE_CHECKS: Check[] = [
  {
    id: 'eyes-open',
    label: 'Yeux ouverts',
    metric: 'eyeOpen',
    min: 0.45,
    tooLow: 'Tes yeux se ferment : ouvre-les un peu plus.',
    weight: 0.8,
  },
  {
    id: 'brow-relaxed',
    label: 'Front détendu',
    metric: 'browTension',
    max: 0.35,
    tooHigh: 'Tes sourcils remontent au centre : détends le front, expire.',
    weight: 0.6,
  },
  {
    id: 'head-level',
    label: 'Tête presque droite',
    metric: 'faceRoll',
    max: 16,
    tooHigh: 'Ta tête penche trop : redresse-la légèrement.',
    weight: 0.5,
  },
]

export function checksFor(spec: CoachSpec): Check[] {
  const base = spec.mode === 'face' ? FACE_BASE_CHECKS : BODY_BASE_CHECKS
  const used = new Set(spec.checks.map((c) => c.metric))
  return [...spec.checks, ...base.filter((c) => !used.has(c.metric))]
}

export function evaluate(spec: CoachSpec, metrics: Metrics, framingIssue?: string): Evaluation {
  const results = checksFor(spec).map((c) => evaluateCheck(c, metrics))
  let total = 0
  let got = 0
  for (const r of results) {
    if (r.status === 'unknown') continue
    const w = r.check.weight ?? 1
    total += w
    got += r.status === 'ok' ? w : r.status === 'near' ? w * 0.5 : 0
  }
  const score = total ? Math.round((got / total) * 100) : 0
  return { results, score, framingIssue }
}

/** Exponential smoothing of noisy per-frame metrics. */
export class MetricSmoother {
  private state: Metrics = {}
  constructor(private alpha = 0.3) {}

  push(next: Metrics): Metrics {
    for (const key of Object.keys(next) as Metric[]) {
      const v = next[key]
      if (v === undefined || Number.isNaN(v)) continue
      const prev = this.state[key]
      this.state[key] = prev === undefined ? v : prev + this.alpha * (v - prev)
    }
    return { ...this.state }
  }

  reset() {
    this.state = {}
  }
}

export type { BodyMetric, FaceMetric }
