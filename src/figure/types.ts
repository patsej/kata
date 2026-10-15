/** A 2D point in the figure's 200 × 300 drawing space. */
export type Pt = readonly [number, number]

/**
 * A full-body pose, drawn as a stylised mannequin.
 * `l*` / `r*` are the joints on the LEFT / RIGHT side of the drawing
 * (screen side, not anatomical side) to keep authoring simple.
 */
export interface BodySkeleton {
  kind: 'body'
  head: Pt
  /** Head rotation in degrees (positive = tilts clockwise). */
  headTilt?: number
  /** Where the face points: decides where the nose/hair hint goes. */
  facing?: 'front' | 'left' | 'right'
  neck: Pt
  ls: Pt
  rs: Pt
  le: Pt
  re: Pt
  lw: Pt
  rw: Pt
  lh: Pt
  rh: Pt
  lk: Pt
  rk: Pt
  la: Pt
  ra: Pt
  lf: Pt
  rf: Pt
  /** Screen side whose limbs are further from the camera (drawn behind, lighter). */
  far?: 'l' | 'r'
  /** Hide a hand (e.g. inside a pocket or behind the back). */
  hideHand?: ('l' | 'r')[]
  prop?: 'chair' | 'stool' | 'wall-left' | 'wall-right'
}

/** A close-up portrait used for facial techniques. */
export interface FaceSkeleton {
  kind: 'face'
  view: 'front' | 'profile'
  eyes?: 'open' | 'squinch' | 'wide' | 'smize' | 'closed'
  mouth?: 'neutral' | 'soft' | 'smile' | 'tense' | 'laugh'
  /** Profile only: position of the head relative to the neck. */
  chin?: 'forward' | 'neutral' | 'tucked' | 'up'
  /** Head roll in degrees. */
  tilt?: number
  /** Front only: horizontal gaze offset (-1 … 1), 0 = straight into the lens. */
  gaze?: number
  /** Front only: shoulders turned (adds a 3/4 shoulder line). */
  shoulders?: 'square' | 'angled'
}

export type Skeleton = BodySkeleton | FaceSkeleton

export interface Marker {
  /** Number displayed in the bubble, matching a step of the pose. */
  n: number
  at: Pt
}

export interface Arrow {
  from: Pt
  to: Pt
  /** Bend of the arrow, in drawing units (0 = straight). */
  bend?: number
}

export interface Illustration {
  skeleton: Skeleton
  markers?: Marker[]
  arrows?: Arrow[]
  /** A dashed guide line, e.g. the camera axis or the "string" through the spine. */
  guides?: { from: Pt; to: Pt }[]
}
