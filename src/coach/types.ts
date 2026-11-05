export type BodyMetric =
  /** Rotation of the shoulder line relative to the camera, 0° = square, 90° = profile. */
  | 'torsoYaw'
  /** Bend of the most bent knee, 0° = straight leg. */
  | 'kneeBendMax'
  /** Bend of the straighter knee (the standing leg). */
  | 'kneeBendMin'
  /** Largest gap between an upper arm and the torso, in degrees. */
  | 'armSpaceMax'
  /** Smallest gap between an upper arm and the torso, in degrees. */
  | 'armSpaceMin'
  /** Closest wrist-to-hip distance, in shoulder widths. */
  | 'wristHipMin'
  /** Closest wrist to the face, in shoulder widths. */
  | 'wristFaceMin'
  /** Bend of the most bent elbow: a bent arm is a hand "doing something". */
  | 'elbowBendMax'
  /** Elbow bend of an arm whose wrist rests near a hip (0 when none does). */
  | 'handOnHip'
  /** Wrists resting near the opposite elbows, in shoulder widths. */
  | 'armsCrossed'
  /** Angle of the less raised thigh from vertical: ~0° standing, ~90° seated. */
  | 'thighPitch'
  /** Torso lean towards the camera in degrees (negative = leaning back). */
  | 'leanForward'
  /** Torso lean from vertical in any direction, degrees. */
  | 'torsoLean'
  /** Distance between the ankles, in leg lengths. */
  | 'stride'
  /** Tilt of the shoulder line in the image, degrees. */
  | 'shoulderTilt'
  /** Tilt of the eye line in the image, degrees. */
  | 'headTilt'
  /** Vertical gap between ears and shoulders, in torso lengths. Small = shrugging. */
  | 'neckGap'
  /** How far the nose rises above the ears, in torso lengths. Positive = chin up. */
  | 'chinUp'
  /** 1 when both eyes face the camera, 0 otherwise. */
  | 'faceToCamera'
  /** Closest elbow-to-knee distance, in shoulder widths. */
  | 'elbowKneeMin'

export type FaceMetric =
  /** Lower-lid / cheek squint, 0 … 1 (blendshape). */
  | 'squint'
  /** Smile intensity, 0 … 1. */
  | 'smile'
  /** Eye openness, 0 (closed) … 1. */
  | 'eyeOpen'
  /** Eyes opened wide (surprise / "deer in headlights"), 0 … 1. */
  | 'eyeWide'
  /** Raised inner brows (worry, tension), 0 … 1. */
  | 'browTension'
  /** Forehead forward vs chin, degrees. Positive = forehead towards the lens. */
  | 'facePitch'
  /** Head turned away from the lens, degrees (absolute). */
  | 'faceYaw'
  /** Head roll, degrees (absolute). */
  | 'faceRoll'

export type Metric = BodyMetric | FaceMetric
export type Metrics = Partial<Record<Metric, number>>

export interface Check {
  id: string
  /** What a good result looks like, e.g. "Corps de trois-quarts". */
  label: string
  metric: Metric
  min?: number
  max?: number
  /** Correction shown when the value is below `min`. */
  tooLow?: string
  /** Correction shown when the value is above `max`. */
  tooHigh?: string
  /** Margin around the range that still counts as "presque". */
  tolerance?: number
  weight?: number
}

export type CoachMode = 'body' | 'face'

export interface CoachSpec {
  mode: CoachMode
  /** "full" needs the whole body in frame, "upper" from the hips up. */
  framing: 'full' | 'upper' | 'face'
  checks: Check[]
}

export type CheckStatus = 'ok' | 'near' | 'fix' | 'unknown'

export interface CheckResult {
  check: Check
  status: CheckStatus
  value: number | undefined
  message: string
}

export interface Evaluation {
  results: CheckResult[]
  /** 0 … 100 */
  score: number
  /** Framing problem preventing a reliable analysis, if any. */
  framingIssue?: string
}
