import { useId } from 'react'
import type { Arrow, BodySkeleton, FaceSkeleton, Illustration, Pt } from './types'

interface FigureProps {
  illustration: Illustration
  /** Show numbered markers, arrows and guides. */
  annotated?: boolean
  /** Visual tone: "mistake" renders a muted figure for the "à éviter" side. */
  tone?: 'default' | 'mistake'
  className?: string
  title?: string
}

export function Figure({ illustration, annotated = true, tone = 'default', className, title }: FigureProps) {
  const uid = useId().replace(/:/g, '')
  const { skeleton } = illustration
  return (
    <svg
      viewBox="0 0 200 300"
      className={['figure', tone === 'mistake' ? 'figure--mistake' : '', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={`body-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="290">
          <stop offset="0" stopColor="var(--fig-top)" />
          <stop offset="1" stopColor="var(--fig-bottom)" />
        </linearGradient>
        <marker id={`arrow-${uid}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
        </marker>
      </defs>
      {skeleton.kind === 'body' ? <Body s={skeleton} fill={`url(#body-${uid})`} /> : <Face s={skeleton} fill={`url(#body-${uid})`} />}
      {annotated && (
        <g className="figure__annotations">
          {illustration.guides?.map((g, i) => (
            <line key={i} x1={g.from[0]} y1={g.from[1]} x2={g.to[0]} y2={g.to[1]} className="figure__guide" />
          ))}
          {illustration.arrows?.map((a, i) => (
            <path key={i} d={arrowPath(a)} className="figure__arrow" markerEnd={`url(#arrow-${uid})`} />
          ))}
          {illustration.markers?.map((m) => (
            <g key={m.n} transform={`translate(${m.at[0]} ${m.at[1]})`} className="figure__marker">
              <circle r="7.5" />
              <text dy="0.35em">{m.n}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}

function arrowPath({ from, to, bend = 0 }: Arrow) {
  const mx = (from[0] + to[0]) / 2
  const my = (from[1] + to[1]) / 2
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const len = Math.hypot(dx, dy) || 1
  const cx = mx - (dy / len) * bend
  const cy = my + (dx / len) * bend
  return `M${from[0]},${from[1]} Q${cx},${cy} ${to[0]},${to[1]}`
}

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

function Limb({ a, b, w, cls }: { a: Pt; b: Pt; w: number; cls: string }) {
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={w} className={cls} />
}

function Hand({ elbow, wrist, cls }: { elbow: Pt; wrist: Pt; cls: string }) {
  const dx = wrist[0] - elbow[0]
  const dy = wrist[1] - elbow[1]
  const len = Math.hypot(dx, dy) || 1
  const c: Pt = [wrist[0] + (dx / len) * 6, wrist[1] + (dy / len) * 6]
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  return <ellipse cx={c[0]} cy={c[1]} rx="8" ry="5.2" transform={`rotate(${angle} ${c[0]} ${c[1]})`} className={cls} />
}

function Side({ s, side, fill, layer }: { s: BodySkeleton; side: 'l' | 'r'; fill: string; layer: 'far' | 'near' }) {
  const sh = s[`${side}s`]
  const el = s[`${side}e`]
  const wr = s[`${side}w`]
  const hip = s[`${side}h`]
  const kn = s[`${side}k`]
  const an = s[`${side}a`]
  const ft = s[`${side}f`]
  const cls = `fig-limb fig-limb--${layer}`
  return (
    <g stroke={fill} fill={fill} opacity={layer === 'far' ? 0.5 : 1}>
      <Limb a={hip} b={kn} w={19} cls={cls} />
      <Limb a={kn} b={an} w={14} cls={cls} />
      <Limb a={an} b={ft} w={8} cls={cls} />
      {layer === 'near' && (
        // A soft halo, drawn under the whole arm, separates it from the torso when they overlap.
        <g className="fig-halo">
          <Limb a={sh} b={el} w={16} cls="" />
          <Limb a={el} b={wr} w={13.5} cls="" />
        </g>
      )}
      <Limb a={sh} b={el} w={13} cls={cls} />
      <Limb a={el} b={wr} w={10.5} cls={cls} />
      {!s.hideHand?.includes(side) && <Hand elbow={el} wrist={wr} cls={`fig-hand fig-hand--${layer}`} />}
    </g>
  )
}

function Body({ s, fill }: { s: BodySkeleton; fill: string }) {
  const far = s.far ?? null
  const near: ('l' | 'r')[] = far ? [far === 'l' ? 'r' : 'l'] : ['l', 'r']
  // Torso silhouette: shoulders → slightly narrower waist → hips.
  const waistL = lerp(lerp(s.ls, s.lh, 0.62), lerp(s.rs, s.rh, 0.62), 0.07)
  const waistR = lerp(lerp(s.rs, s.rh, 0.62), lerp(s.ls, s.lh, 0.62), 0.07)
  const torso = `M${s.ls[0]},${s.ls[1]} Q${s.neck[0]},${s.neck[1] + 6} ${s.rs[0]},${s.rs[1]} L${waistR[0]},${waistR[1]} L${s.rh[0]},${s.rh[1]} L${s.lh[0]},${s.lh[1]} L${waistL[0]},${waistL[1]} Z`
  const tilt = s.headTilt ?? 0
  const facing = s.facing ?? 'front'
  const groundY = Math.max(s.la[1], s.ra[1], s.lf[1], s.rf[1]) + 6
  const groundX = (s.la[0] + s.ra[0]) / 2
  return (
    <g className="fig-body">
      <Prop prop={s.prop} />
      <ellipse cx={groundX} cy={groundY} rx="46" ry="5" className="fig-shadow" />
      {far && <Side s={s} side={far} fill={fill} layer="far" />}
      <path d={torso} fill={fill} stroke={fill} strokeWidth={12} strokeLinejoin="round" className="fig-torso" />
      <line x1={s.neck[0]} y1={s.neck[1]} x2={(s.ls[0] + s.rs[0]) / 2} y2={(s.ls[1] + s.rs[1]) / 2 + 2} stroke={fill} strokeWidth={11} strokeLinecap="round" />
      {near.map((side) => (
        <Side key={side} s={s} side={side} fill={fill} layer="near" />
      ))}
      <g transform={`rotate(${tilt} ${s.head[0]} ${s.head[1]})`}>
        <ellipse cx={s.head[0]} cy={s.head[1]} rx="12.5" ry="14.5" fill={fill} className="fig-head" />
        {/* hair cap, shifted opposite to the face direction */}
        <path
          d={hairPath(s.head, facing)}
          className="fig-hair"
        />
        {facing !== 'front' && (
          <path
            d={facing === 'left'
              ? `M${s.head[0] - 11},${s.head[1] - 1} l-4,5 l4,1.5`
              : `M${s.head[0] + 11},${s.head[1] - 1} l4,5 l-4,1.5`}
            fill={fill}
            className="fig-nose"
          />
        )}
      </g>
    </g>
  )
}

function hairPath(head: Pt, facing: 'front' | 'left' | 'right') {
  const [x, y] = head
  if (facing === 'front') return `M${x - 13},${y - 1} Q${x - 13},${y - 17} ${x},${y - 16} Q${x + 13},${y - 17} ${x + 13},${y - 1} Q${x + 8},${y - 10} ${x},${y - 10} Q${x - 8},${y - 10} ${x - 13},${y - 1} Z`
  const d = facing === 'left' ? 1 : -1
  return `M${x - 10 * d},${y - 9} Q${x - 2 * d},${y - 19} ${x + 10 * d},${y - 12} Q${x + 15 * d},${y - 2} ${x + 9 * d},${y + 9} Q${x + 6 * d},${y - 3} ${x - 10 * d},${y - 9} Z`
}

function Prop({ prop }: { prop?: BodySkeleton['prop'] }) {
  if (!prop) return null
  if (prop === 'wall-left') return <rect x="0" y="10" width="38" height="282" rx="3" className="fig-prop" />
  if (prop === 'wall-right') return <rect x="162" y="10" width="38" height="282" rx="3" className="fig-prop" />
  if (prop === 'stool')
    return (
      <g className="fig-prop-line">
        <rect x="68" y="204" width="64" height="10" rx="5" className="fig-prop" />
        <line x1="76" y1="214" x2="68" y2="284" />
        <line x1="124" y1="214" x2="132" y2="284" />
        <line x1="72" y1="256" x2="128" y2="256" />
      </g>
    )
  return (
    <g className="fig-prop-line">
      <rect x="60" y="128" width="12" height="96" rx="5" className="fig-prop" />
      <rect x="60" y="214" width="86" height="11" rx="5" className="fig-prop" />
      <line x1="68" y1="225" x2="64" y2="284" />
      <line x1="138" y1="225" x2="142" y2="284" />
    </g>
  )
}

/* ---------- Close-up portrait ---------- */

function Face({ s, fill }: { s: FaceSkeleton; fill: string }) {
  return s.view === 'profile' ? <Profile s={s} fill={fill} /> : <FrontFace s={s} fill={fill} />
}

function FrontFace({ s, fill }: { s: FaceSkeleton; fill: string }) {
  const cx = 100
  const cy = 120
  const tilt = s.tilt ?? 0
  const gaze = (s.gaze ?? 0) * 3.5
  const eyes = s.eyes ?? 'open'
  const mouth = s.mouth ?? 'neutral'
  const angled = s.shoulders === 'angled'
  return (
    <g className="fig-face">
      {/* shoulders */}
      <path
        d={angled
          ? 'M28,300 Q36,222 84,206 L118,206 Q150,214 166,246 L172,300 Z'
          : 'M14,300 Q20,220 78,204 L122,204 Q180,220 186,300 Z'}
        fill={fill}
      />
      <rect x="85" y="168" width="30" height="46" rx="12" fill={fill} />
      <g transform={`rotate(${tilt} ${cx} ${cy + 40})`}>
        <ellipse cx={cx - 47} cy={cy + 6} rx="7" ry="12" fill={fill} />
        <ellipse cx={cx + 47} cy={cy + 6} rx="7" ry="12" fill={fill} />
        <path d={`M${cx - 46},${cy - 6} Q${cx - 48},${cy + 52} ${cx},${cy + 66} Q${cx + 48},${cy + 52} ${cx + 46},${cy - 6} Q${cx + 44},${cy - 62} ${cx},${cy - 62} Q${cx - 44},${cy - 62} ${cx - 46},${cy - 6} Z`} fill={fill} />
        <path d={`M${cx - 50},${cy - 2} Q${cx - 56},${cy - 74} ${cx},${cy - 72} Q${cx + 56},${cy - 74} ${cx + 50},${cy - 2} Q${cx + 40},${cy - 46} ${cx + 4},${cy - 44} Q${cx - 30},${cy - 48} ${cx - 50},${cy - 2} Z`} className="fig-hair" />
        <Eye x={cx - 20} y={cy} kind={eyes} gaze={gaze} />
        <Eye x={cx + 20} y={cy} kind={eyes} gaze={gaze} />
        <Brow x={cx - 20} y={cy - 17} kind={eyes} flip={false} />
        <Brow x={cx + 20} y={cy - 17} kind={eyes} flip />
        <path d={`M${cx},${cy + 4} Q${cx - 4},${cy + 20} ${cx - 2},${cy + 24} Q${cx + 3},${cy + 26} ${cx + 6},${cy + 23}`} className="fig-line" />
        <Mouth x={cx} y={cy + 40} kind={mouth} />
        {(eyes === 'smize' || mouth === 'smile' || mouth === 'laugh') && (
          <>
            <path d={`M${cx - 30},${cy + 18} q4,4 10,4`} className="fig-line fig-line--soft" />
            <path d={`M${cx + 30},${cy + 18} q-4,4 -10,4`} className="fig-line fig-line--soft" />
          </>
        )}
      </g>
    </g>
  )
}

function Eye({ x, y, kind, gaze }: { x: number; y: number; kind: NonNullable<FaceSkeleton['eyes']>; gaze: number }) {
  if (kind === 'closed') return <path d={`M${x - 10},${y} Q${x},${y + 6} ${x + 10},${y}`} className="fig-line" />
  // upper and lower lid heights
  const up = kind === 'wide' ? 9 : kind === 'squinch' ? 6.5 : kind === 'smize' ? 6 : 7
  const low = kind === 'wide' ? 7 : kind === 'squinch' ? 1.2 : kind === 'smize' ? 1.5 : 4.5
  const shape = `M${x - 11},${y} Q${x},${y - up * 1.6} ${x + 11},${y} Q${x},${y + low * 1.4} ${x - 11},${y} Z`
  const irisR = kind === 'wide' ? 4.6 : 5
  return (
    <g>
      <path d={shape} className="fig-eye-white" />
      <clipPath id={`clip-${x}-${y}-${kind}`}>
        <path d={shape} />
      </clipPath>
      <g clipPath={`url(#clip-${x}-${y}-${kind})`}>
        <circle cx={x + gaze} cy={y - 1} r={irisR} className="fig-iris" />
        <circle cx={x + gaze + 1.5} cy={y - 2.5} r={1.2} className="fig-glint" />
      </g>
      <path d={`M${x - 11},${y} Q${x},${y - up * 1.6} ${x + 11},${y}`} className="fig-line" />
      {(kind === 'squinch' || kind === 'smize') && <path d={`M${x - 9},${y + 3.5} Q${x},${y + 6.5} ${x + 9},${y + 3.5}`} className="fig-line fig-line--soft" />}
    </g>
  )
}

function Brow({ x, y, kind, flip }: { x: number; y: number; kind: NonNullable<FaceSkeleton['eyes']>; flip: boolean }) {
  const lift = kind === 'wide' ? -5 : kind === 'smize' ? 1 : 0
  const d = flip ? -1 : 1
  const inner = kind === 'wide' ? -3 : 0
  return <path d={`M${x + 12 * d},${y + lift + inner} Q${x},${y - 6 + lift} ${x - 12 * d},${y + 2 + lift}`} className="fig-line fig-line--brow" />
}

function Mouth({ x, y, kind }: { x: number; y: number; kind: NonNullable<FaceSkeleton['mouth']> }) {
  switch (kind) {
    case 'smile':
      return (
        <g>
          <path d={`M${x - 16},${y - 3} Q${x},${y + 12} ${x + 16},${y - 3} Q${x},${y + 3} ${x - 16},${y - 3} Z`} className="fig-mouth" />
          <path d={`M${x - 14},${y - 2} Q${x},${y + 3} ${x + 14},${y - 2}`} className="fig-teeth" />
        </g>
      )
    case 'laugh':
      return <path d={`M${x - 17},${y - 4} Q${x},${y + 20} ${x + 17},${y - 4} Q${x},${y + 1} ${x - 17},${y - 4} Z`} className="fig-mouth" />
    case 'tense':
      return <path d={`M${x - 12},${y} L${x + 12},${y}`} className="fig-line fig-line--lips" />
    case 'soft':
      return <path d={`M${x - 12},${y} Q${x},${y + 4} ${x + 12},${y - 1}`} className="fig-line fig-line--lips" />
    default:
      return <path d={`M${x - 12},${y + 1} Q${x},${y + 3} ${x + 12},${y + 1}`} className="fig-line fig-line--lips" />
  }
}

function Profile({ s, fill }: { s: FaceSkeleton; fill: string }) {
  // Head offset relative to the neck: forward = towards the camera (right side).
  const chin = s.chin ?? 'neutral'
  const dx = chin === 'forward' ? 10 : chin === 'tucked' ? -8 : 0
  const rot = chin === 'forward' ? 6 : chin === 'tucked' ? -2 : chin === 'up' ? -14 : 0
  const doubleChin = chin === 'tucked'
  return (
    <g className="fig-face">
      <path d="M30,300 Q36,226 80,214 L120,212 Q152,220 158,300 Z" fill={fill} />
      <path d={`M84,226 Q86,196 ${92 + dx * 0.4},176 L${124 + dx * 0.6},176 Q122,202 124,226 Z`} fill={fill} />
      <g transform={`translate(${dx} 0) rotate(${rot} 104 150)`}>
        {/* skull + face profile, facing right */}
        <path
          d="M70,112 Q66,58 112,52 Q150,52 156,96 Q158,108 156,114 L166,134 Q168,140 160,141 L159,152 Q162,156 157,160 Q160,166 154,172 Q150,184 136,186 Q122,188 112,184 Q98,178 88,166 Q74,148 70,112 Z"
          fill={fill}
        />
        <path d="M70,118 Q62,62 110,48 Q148,44 158,84 Q140,62 116,66 Q92,70 92,104 Q84,98 80,112 Z" className="fig-hair" />
        <ellipse cx="96" cy="118" rx="7" ry="11" fill={fill} className="fig-ear" />
        <path d="M140,110 Q146,106 151,110" className="fig-line" />
        <path d="M134,100 Q144,94 154,98" className="fig-line fig-line--brow" />
        <path d={chin === 'up' ? 'M152,163 L143,162' : 'M153,162 Q147,164 142,162'} className="fig-line fig-line--lips" />
        {/* jawline highlight */}
        <path d="M112,182 Q130,190 146,180" className={doubleChin ? 'fig-line fig-line--soft' : 'fig-jaw'} />
        {doubleChin && <path d="M114,190 Q132,200 148,186" className="fig-line" />}
      </g>
    </g>
  )
}
