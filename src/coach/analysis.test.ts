import { describe, expect, it } from 'vitest'
import { bodyFramingIssue, bodyMetrics, evaluate, evaluateCheck, MetricSmoother, P, type LM } from './analysis'
import { POSES } from '../data/poses'
import type { CoachSpec } from './types'

/**
 * A synthetic 3D person (metres, y down, z towards the back), standing
 * square to the camera. Options bend joints and rotate the whole body.
 */
interface Body {
  yaw?: number
  kneeBend?: number
  armOut?: number
  handOnHip?: boolean
  shrug?: number
  seated?: boolean
  leanForward?: number
}

function person(opts: Body = {}): { world: LM[]; image: LM[] } {
  const w: LM[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 0.99 }))
  const set = (i: number, x: number, y: number, z = 0) => (w[i] = { x, y, z, visibility: 0.99 })
  const lean = ((opts.leanForward ?? 0) * Math.PI) / 180
  // Torso: shoulders 0.5 m above hips, possibly leaning towards the camera (−z).
  const shY = -0.5 * Math.cos(lean)
  const shZ = -0.5 * Math.sin(lean)
  const shrug = opts.shrug ?? 0
  set(P.lSh, 0.18, shY - shrug, shZ)
  set(P.rSh, -0.18, shY - shrug, shZ)
  set(P.nose, 0, shY - 0.2, shZ - 0.08)
  set(P.lEye, 0.03, shY - 0.23, shZ - 0.06)
  set(P.rEye, -0.03, shY - 0.23, shZ - 0.06)
  set(P.lEar, 0.07, shY - 0.21, shZ)
  set(P.rEar, -0.07, shY - 0.21, shZ)
  set(P.lHip, 0.1, 0, 0)
  set(P.rHip, -0.1, 0, 0)

  // Arms hanging, or one abducted / hand on hip.
  const out = ((opts.armOut ?? 8) * Math.PI) / 180
  set(P.lEl, 0.18 + 0.28 * Math.sin(out), shY + 0.28 * Math.cos(out), shZ)
  set(P.lWr, 0.18 + 0.52 * Math.sin(out), shY + 0.52 * Math.cos(out), shZ)
  set(P.rEl, -0.2, shY + 0.28, shZ)
  set(P.rWr, -0.21, shY + 0.53, shZ)
  if (opts.handOnHip) {
    set(P.lEl, 0.36, -0.22, 0.05)
    set(P.lWr, 0.16, -0.06, 0)
  }

  // Legs.
  if (opts.seated) {
    set(P.lKn, 0.1, 0.02, -0.42)
    set(P.rKn, -0.1, 0.02, -0.42)
    set(P.lAn, 0.1, 0.44, -0.44)
    set(P.rAn, -0.1, 0.44, -0.44)
  } else {
    const b = ((opts.kneeBend ?? 0) * Math.PI) / 180
    set(P.lKn, 0.1, 0.42, 0)
    set(P.lAn, 0.1, 0.42 + 0.42 * Math.cos(b), 0.42 * Math.sin(b))
    set(P.rKn, -0.1, 0.42, 0)
    set(P.rAn, -0.1, 0.84, 0)
  }

  // Rotate around the vertical axis.
  const a = ((opts.yaw ?? 0) * Math.PI) / 180
  const world = w.map((p) => ({ ...p, x: p.x * Math.cos(a) - p.z * Math.sin(a), z: p.x * Math.sin(a) + p.z * Math.cos(a) }))
  // Simple orthographic projection into a portrait 3:4 frame.
  const image = world.map((p) => ({ x: 0.5 + p.x / 2.2, y: 0.55 + p.y / 2.6, z: p.z, visibility: p.visibility }))
  return { world, image }
}

const metricsOf = (b: Body) => bodyMetrics({ ...person(b), aspect: 3 / 4 })

describe('bodyMetrics', () => {
  it('measures how much the torso is turned', () => {
    expect(metricsOf({}).torsoYaw).toBeCloseTo(0, 0)
    expect(metricsOf({ yaw: 45 }).torsoYaw).toBeCloseTo(45, 0)
    expect(metricsOf({ yaw: -30 }).torsoYaw).toBeCloseTo(30, 0)
  })

  it('detects a soft knee', () => {
    expect(metricsOf({}).kneeBendMax).toBeLessThan(2)
    expect(metricsOf({ kneeBend: 25 }).kneeBendMax).toBeCloseTo(25, 0)
  })

  it('detects space between arm and torso', () => {
    expect(metricsOf({}).armSpaceMax).toBeLessThan(20)
    expect(metricsOf({ armOut: 40 }).armSpaceMax).toBeGreaterThan(30)
  })

  it('detects a hand on the hip, not a hanging hand', () => {
    expect(metricsOf({}).handOnHip).toBeLessThan(15)
    expect(metricsOf({ handOnHip: true }).handOnHip).toBeGreaterThan(60)
  })

  it('tells seated from standing', () => {
    expect(metricsOf({}).thighPitch).toBeLessThan(10)
    expect(metricsOf({ seated: true }).thighPitch).toBeGreaterThan(70)
  })

  it('measures a forward lean', () => {
    expect(metricsOf({ leanForward: 15 }).leanForward).toBeCloseTo(15, 0)
    expect(metricsOf({}).leanForward).toBeCloseTo(0, 0)
  })

  it('notices shrugged shoulders', () => {
    expect(metricsOf({}).neckGap).toBeGreaterThan(0.3)
    expect(metricsOf({ shrug: 0.1 }).neckGap).toBeLessThan(0.22)
  })
})

describe('framing', () => {
  it('asks to step back when the feet are cut', () => {
    const { image } = person()
    const cut = image.map((p, i) => (i === P.lAn || i === P.rAn ? { ...p, visibility: 0.1 } : p))
    expect(bodyFramingIssue(cut, 'full')).toMatch(/Recule/)
    expect(bodyFramingIssue(cut, 'upper')).toBeUndefined()
    expect(bodyFramingIssue([], 'upper')).toBeDefined()
  })
})

describe('evaluate', () => {
  const spec: CoachSpec = {
    mode: 'body',
    framing: 'upper',
    checks: [{ id: 'turn', label: 'Trois-quarts', metric: 'torsoYaw', min: 25, max: 60, tooLow: 'Tourne-toi', tooHigh: 'Reviens' }],
  }

  it('grades a check as ok, near or fix', () => {
    const c = spec.checks[0]
    expect(evaluateCheck(c, { torsoYaw: 40 }).status).toBe('ok')
    expect(evaluateCheck(c, { torsoYaw: 21 }).status).toBe('near')
    expect(evaluateCheck(c, { torsoYaw: 5 })).toMatchObject({ status: 'fix', message: 'Tourne-toi' })
    expect(evaluateCheck(c, { torsoYaw: 80 })).toMatchObject({ status: 'fix', message: 'Reviens' })
    expect(evaluateCheck(c, {}).status).toBe('unknown')
  })

  it('scores a good three-quarter pose higher than a square one', () => {
    const good = evaluate(spec, metricsOf({ yaw: 45 }))
    const bad = evaluate(spec, metricsOf({}))
    expect(good.score).toBe(100)
    expect(bad.score).toBeLessThan(good.score)
  })

  it('recognises the red-carpet pose', () => {
    const redCarpet = POSES.find((p) => p.id === 'tapis-rouge')!.coach!
    const good = evaluate(redCarpet, metricsOf({ yaw: 40, handOnHip: true, kneeBend: 20 }))
    const square = evaluate(redCarpet, metricsOf({}))
    expect(good.score).toBeGreaterThanOrEqual(90)
    expect(square.score).toBeLessThan(50)
  })
})

describe('MetricSmoother', () => {
  it('smooths noisy values', () => {
    const s = new MetricSmoother(0.5)
    s.push({ torsoYaw: 0 })
    expect(s.push({ torsoYaw: 40 }).torsoYaw).toBe(20)
  })
})

describe('pose catalogue', () => {
  it('has unique ids and consistent markers', () => {
    const ids = new Set(POSES.map((p) => p.id))
    expect(ids.size).toBe(POSES.length)
    expect(new Set(POSES.map((p) => p.mistake.title)).size).toBe(POSES.length)
    for (const p of POSES) {
      for (const m of p.illustration.markers ?? []) expect(m.n).toBeLessThanOrEqual(p.steps.length)
      for (const c of p.coach?.checks ?? []) expect(c.min !== undefined || c.max !== undefined).toBe(true)
    }
  })
})
