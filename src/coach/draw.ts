import type { LM } from './analysis'
import { FACE_CONNECTIONS, POSE_CONNECTIONS } from './landmarker'
import type { CoachMode } from './types'

/**
 * Draws `source` on the canvas (mirrored for a selfie camera) and the detected
 * landmarks on top of it, in the same coordinate space.
 */
export function drawFrame(
  canvas: HTMLCanvasElement,
  source: CanvasImageSource & { width?: number; height?: number },
  size: { width: number; height: number },
  points: LM[],
  mode: CoachMode,
  options: { mirrored: boolean; color: string },
) {
  const { width: w, height: h } = size
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.save()
  if (options.mirrored) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, 0, 0, w, h)
  if (points.length) drawLandmarks(ctx, points, mode, w, h, options.color)
  ctx.restore()
}

function drawLandmarks(ctx: CanvasRenderingContext2D, points: LM[], mode: CoachMode, w: number, h: number, color: string) {
  const unit = Math.max(w, h) / 400
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (mode === 'body') {
    const ok = (i: number) => (points[i]?.visibility ?? 1) > 0.4
    ctx.strokeStyle = color
    ctx.lineWidth = 3 * unit
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 4 * unit
    for (const { start, end } of POSE_CONNECTIONS) {
      // Skip the small face connections: only the body is useful here.
      if (start < 11 || end < 11 || start > 28 || end > 28) continue
      if (!ok(start) || !ok(end)) continue
      ctx.beginPath()
      ctx.moveTo(points[start].x * w, points[start].y * h)
      ctx.lineTo(points[end].x * w, points[end].y * h)
      ctx.stroke()
    }
    ctx.fillStyle = '#fff'
    for (const i of [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
      if (!ok(i)) continue
      ctx.beginPath()
      ctx.arc(points[i].x * w, points[i].y * h, (i === 0 ? 5 : 3.5) * unit, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }
  ctx.strokeStyle = color
  ctx.lineWidth = 1.6 * unit
  ctx.globalAlpha = 0.85
  for (const { start, end } of FACE_CONNECTIONS) {
    const a = points[start]
    const b = points[end]
    if (!a || !b) continue
    ctx.beginPath()
    ctx.moveTo(a.x * w, a.y * h)
    ctx.lineTo(b.x * w, b.y * h)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
