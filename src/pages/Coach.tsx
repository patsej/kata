import { useCallback, useEffect, useRef, useState } from 'react'
import { evaluate, MetricSmoother, type LM } from '../coach/analysis'
import { drawFrame } from '../coach/draw'
import { FREE_SPEC, interpret } from '../coach/interpret'
import { loadDetector, type Detector } from '../coach/landmarker'
import type { CheckResult, CoachSpec, Evaluation } from '../coach/types'
import { Icon } from '../components/Icon'
import { CATEGORIES, POSES, POSE_BY_ID, type Pose } from '../data/poses'
import { Figure } from '../figure/Figure'
import { href } from '../router'
import { actions } from '../store'

type Phase = 'intro' | 'loading' | 'live' | 'result' | 'error'

const FRAMING_HINT: Record<CoachSpec['framing'], string> = {
  full: 'Pose ton téléphone à 2–3 m, à hauteur de poitrine : on doit te voir de la tête aux pieds.',
  upper: 'Pose ton téléphone à 1,5–2 m, à hauteur des yeux : on doit te voir au moins jusqu’à la taille.',
  face: 'Tiens le téléphone à bout de bras, à hauteur des yeux, face à une fenêtre.',
}

const COACHABLE = POSES.filter((p) => p.coach)

function accentColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c8553d'
}

/** The correction to show first: the heaviest failing check. */
export function topAdvice(ev: Evaluation | null): { text: string; good: boolean } | null {
  if (!ev) return null
  if (ev.framingIssue) return { text: ev.framingIssue, good: false }
  const byWeight = (a: CheckResult, b: CheckResult) => (b.check.weight ?? 1) - (a.check.weight ?? 1)
  const fix = ev.results.filter((r) => r.status === 'fix').sort(byWeight)[0]
  if (fix) return { text: fix.message, good: false }
  const near = ev.results.filter((r) => r.status === 'near').sort(byWeight)[0]
  if (near) return { text: `Presque : ${near.message.charAt(0).toLowerCase()}${near.message.slice(1)}`, good: false }
  return { text: 'C’est ça ! Expire doucement… et souris.', good: true }
}

export function Coach({ poseId }: { poseId?: string }) {
  const [pose, setPose] = useState<Pose | undefined>(() => (poseId ? POSE_BY_ID.get(poseId) : undefined))
  const spec = pose?.coach ?? FREE_SPEC
  const [phase, setPhase] = useState<Phase>('intro')
  const [error, setError] = useState('')
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [live, setLive] = useState<Evaluation | null>(null)
  const [result, setResult] = useState<Evaluation | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [voice, setVoice] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<HTMLCanvasElement>(null)
  const resultRef = useRef<HTMLCanvasElement>(null)
  const snapshotRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<Detector | null>(null)
  const specRef = useRef(spec)
  const smoother = useRef(new MetricSmoother(0.25))
  const rafRef = useRef(0)
  const fromCamera = useRef(false)
  const resultPoints = useRef<{ points: LM[]; mode: CoachSpec['mode']; color: string } | null>(null)

  const facingRef = useRef(facing)
  specRef.current = spec
  facingRef.current = facing

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  // Load the right detector (body or face) for the current pose.
  const ensureDetector = useCallback(async (mode: CoachSpec['mode']) => {
    if (detectorRef.current?.mode !== mode) {
      detectorRef.current = null
      detectorRef.current = await loadDetector(mode)
    }
    return detectorRef.current
  }, [])

  useEffect(() => {
    smoother.current.reset()
    if (phase === 'live') ensureDetector(spec.mode).catch(() => setError('Impossible de charger l’analyse.'))
  }, [spec.mode, phase, ensureDetector, pose])

  const loop = useCallback(() => {
    let lastUi = 0
    let lastVideoTime = -1
    const tick = async () => {
      const video = videoRef.current
      const canvas = stageRef.current
      const detector = detectorRef.current
      if (!video || !canvas || !streamRef.current) return
      if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime
        const size = { width: video.videoWidth, height: video.videoHeight }
        const s = specRef.current
        if (detector && detector.mode === s.mode) {
          const det = await detector.detectVideo(video, performance.now())
          const reading = interpret(det, s, size.width / size.height)
          const metrics = smoother.current.push(reading.metrics)
          const ev = evaluate(s, metrics, reading.framingIssue)
          drawFrame(canvas, video, size, reading.points, s.mode, { mirrored: facingRef.current === 'user', color: ev.score >= 80 ? '#5fbf8f' : accentColor() })
          const now = performance.now()
          if (now - lastUi > 160) {
            lastUi = now
            setLive(ev)
          }
        } else {
          drawFrame(canvas, video, size, [], s.mode, { mirrored: facingRef.current === 'user', color: accentColor() })
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const startCamera = useCallback(
    async (mode: 'user' | 'environment' = facingRef.current) => {
      stopCamera()
      setPhase('loading')
      setError('')
      setLive(null)
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-camera')
        const [stream] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 960 } },
            audio: false,
          }),
          ensureDetector(specRef.current.mode),
        ])
        streamRef.current = stream
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        smoother.current.reset()
        setPhase('live')
        actions.practised()
        loop()
      } catch (e) {
        stopCamera()
        const name = (e as Error)?.name
        setError(
          name === 'NotAllowedError'
            ? 'L’accès à la caméra a été refusé. Autorise-le dans les réglages du navigateur, ou analyse une photo à la place.'
            : (e as Error)?.message === 'no-camera' || name === 'NotFoundError'
              ? 'Aucune caméra disponible sur cet appareil. Tu peux analyser une photo à la place.'
              : 'Le coach n’a pas pu démarrer. Vérifie ta connexion (les modèles se téléchargent au premier lancement), puis réessaie.',
        )
        setPhase('error')
      }
    },
    [ensureDetector, loop, stopCamera],
  )

  const flip = () => {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    startCamera(next)
  }

  // Speak the main correction, at most every few seconds.
  const lastSpoken = useRef({ text: '', at: 0 })
  useEffect(() => {
    if (!voice || phase !== 'live' || !('speechSynthesis' in window)) return
    const advice = topAdvice(live)
    if (!advice) return
    const now = Date.now()
    if (advice.text === lastSpoken.current.text || now - lastSpoken.current.at < 5000) return
    lastSpoken.current = { text: advice.text, at: now }
    const u = new SpeechSynthesisUtterance(advice.text)
    u.lang = 'fr-FR'
    u.rate = 1.05
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
  }, [live, voice, phase])

  // Paint the analysed still once its canvas is on screen.
  useEffect(() => {
    const canvas = resultRef.current
    const source = snapshotRef.current
    const r = resultPoints.current
    if (phase !== 'result' || !canvas || !source || !r) return
    drawFrame(canvas, source, source, r.points, r.mode, { mirrored: false, color: r.color })
  }, [phase, result])

  /** Analyse a still picture (camera snapshot or uploaded photo). */
  const analyseStill = useCallback(
    async (source: HTMLCanvasElement) => {
      setPhase('loading')
      try {
        const s = specRef.current
        const detector = await ensureDetector(s.mode)
        const det = await detector.detectImage(source)
        const reading = interpret(det, s, source.width / source.height)
        const ev = evaluate(s, reading.metrics, reading.framingIssue)
        snapshotRef.current = source
        resultPoints.current = { points: reading.points, mode: s.mode, color: ev.score >= 80 ? '#5fbf8f' : accentColor() }
        setResult(ev)
        setPhase('result')
        if (pose && !ev.framingIssue) actions.recordScore(pose.id, ev.score)
        else actions.practised()
      } catch {
        setError('L’analyse de la photo a échoué. Vérifie ta connexion puis réessaie.')
        setPhase('error')
      }
    },
    [ensureDetector, pose],
  )

  const capture = () => {
    let n = 3
    setCountdown(n)
    const t = window.setInterval(() => {
      n -= 1
      setCountdown(n)
      if (n > 0) return
      window.clearInterval(t)
      const video = videoRef.current
      if (!video || !streamRef.current) return
      const snap = document.createElement('canvas')
      const size = { width: video.videoWidth, height: video.videoHeight }
      drawFrame(snap, video, size, [], specRef.current.mode, { mirrored: facingRef.current === 'user', color: '' })
      fromCamera.current = true
      stopCamera()
      analyseStill(snap)
    }, 1000)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      const size = { width: Math.round(bitmap.width * scale), height: Math.round(bitmap.height * scale) }
      drawFrame(canvas, bitmap, size, [], specRef.current.mode, { mirrored: false, color: '' })
      fromCamera.current = false
      stopCamera()
      analyseStill(canvas)
    } catch {
      setError('Impossible de lire cette image. Essaie avec une photo JPEG ou PNG.')
      setPhase('error')
    }
  }

  const download = () => {
    snapshotRef.current?.toBlob(
      (blob) => {
        if (!blob) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `pose-${pose?.id ?? 'libre'}-${new Date().toISOString().slice(0, 10)}.jpg`
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 2000)
      },
      'image/jpeg',
      0.92,
    )
  }

  const fileInput = (
    <label className="btn btn--ghost">
      <Icon name="upload" size={18} /> Analyser une photo
      <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </label>
  )

  const picker = (
    <label className="picker">
      <span>Pose visée</span>
      <select
        value={pose?.id ?? ''}
        onChange={(e) => {
          setPose(e.target.value ? POSE_BY_ID.get(e.target.value) : undefined)
          setResult(null)
        }}
      >
        <option value="">Analyse libre (conseils généraux)</option>
        {CATEGORIES.map((c) => (
          <optgroup key={c.id} label={c.label}>
            {COACHABLE.filter((p) => p.category === c.id).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )

  const advice = topAdvice(phase === 'result' ? result : live)
  const ev = phase === 'result' ? result : live

  return (
    <div className="page coach">
      <header className="page__head">
        <h1>
          Le coach <span className="pill pill--beta">bêta</span>
        </h1>
        <p className="lead">Prends la pose devant la caméra : le coach mesure ta posture et te souffle les corrections.</p>
      </header>

      <div className="coach__layout">
        <div className="coach__main">
          <div className={`stage stage--${spec.framing} ${phase === 'live' || phase === 'loading' ? 'is-live' : ''}`}>
            <video ref={videoRef} playsInline muted className="stage__video" />
            {phase === 'result' ? (
              <canvas ref={resultRef} className="stage__canvas stage__canvas--still" />
            ) : (
              <canvas ref={stageRef} className="stage__canvas" />
            )}

            {(phase === 'intro' || phase === 'error') && (
              <div className="stage__intro">
                {pose ? (
                  <Figure illustration={pose.illustration} annotated={false} className="stage__ghost" />
                ) : (
                  <Icon name="camera" size={48} />
                )}
                <p>{FRAMING_HINT[spec.framing]}</p>
                {error && <p className="stage__error">{error}</p>}
                <div className="actions">
                  <button type="button" className="btn btn--primary" onClick={() => startCamera()}>
                    <Icon name="camera" size={18} /> Ouvrir la caméra
                  </button>
                  {fileInput}
                </div>
              </div>
            )}
            {phase === 'loading' && (
              <div className="stage__loading">
                <span className="spinner" />
                <p>Préparation de l’analyse…</p>
              </div>
            )}
            {phase === 'live' && pose && (
              <div className="stage__ref" aria-hidden="true">
                <Figure illustration={pose.illustration} annotated={false} />
              </div>
            )}
            {phase === 'live' && countdown > 0 && <div className="stage__countdown">{countdown}</div>}
            {(phase === 'live' || phase === 'result') && advice && (
              <div className={`stage__advice ${advice.good ? 'is-good' : ''}`}>{advice.text}</div>
            )}
          </div>

          {phase === 'live' && (
            <div className="coach__controls">
              <button type="button" className="btn btn--icon" onClick={flip} aria-label="Changer de caméra">
                <Icon name="flip" />
              </button>
              <button type="button" className="shutter" onClick={capture} disabled={countdown > 0} aria-label="Prendre la photo (retardateur 3 s)">
                <span />
              </button>
              <button
                type="button"
                className={`btn btn--icon ${voice ? 'is-on' : ''}`}
                onClick={() => setVoice((v) => !v)}
                aria-pressed={voice}
                aria-label="Conseils à voix haute"
                title="Conseils à voix haute"
              >
                <Icon name="sparkle" />
              </button>
            </div>
          )}
          {phase === 'result' && (
            <div className="coach__controls">
              {fromCamera.current ? (
                <button type="button" className="btn btn--primary" onClick={() => startCamera()}>
                  <Icon name="camera" size={18} /> Nouvelle photo
                </button>
              ) : (
                fileInput
              )}
              <button type="button" className="btn btn--ghost" onClick={download}>
                <Icon name="download" size={18} /> Enregistrer
              </button>
            </div>
          )}
        </div>

        <aside className="coach__panel">
          {picker}
          {pose && (
            <a className="coach__pose" href={href('poses', pose.id)}>
              <Figure illustration={pose.illustration} annotated={false} />
              <div>
                <strong>{pose.name}</strong>
                <span>{pose.summary}</span>
              </div>
            </a>
          )}

          {ev && !ev.framingIssue ? (
            <div className="report">
              <div className="report__score">
                <Score value={ev.score} />
                <p>{scoreLabel(ev.score)}</p>
              </div>
              <ul className="checks">
                {ev.results.map((r) => (
                  <li key={r.check.id} className={`check check--${r.status}`}>
                    <span className="check__dot" aria-hidden="true">
                      {r.status === 'ok' ? <Icon name="check" size={14} /> : null}
                    </span>
                    <div>
                      <strong>{r.check.label}</strong>
                      {r.status !== 'ok' && r.status !== 'unknown' && <span>{r.message}</span>}
                      {r.status === 'unknown' && <span>Pas visible sur l’image.</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="report report--empty">
              <h3>Comment ça marche</h3>
              <ol>
                <li>Choisis la pose que tu veux travailler.</li>
                <li>Place-toi devant la caméra : les corrections s’affichent en direct.</li>
                <li>Déclenche le retardateur quand tout est vert, ou analyse une photo existante.</li>
              </ol>
              <p className="muted small">
                <Icon name="lock" size={14} /> L’analyse se fait entièrement sur ton appareil : aucune image n’est envoyée.
                Les mesures sont indicatives et restent à affiner selon l’éclairage et le cadrage.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function scoreLabel(score: number) {
  if (score >= 90) return 'Superbe, c’est la pose.'
  if (score >= 70) return 'Très proche : un dernier détail.'
  if (score >= 45) return 'Bonne base, quelques corrections.'
  return 'Suis les conseils un par un.'
}

function Score({ value }: { value: number }) {
  const r = 40
  const c = 2 * Math.PI * r
  const tone = value >= 80 ? 'good' : value >= 50 ? 'mid' : 'low'
  return (
    <div className={`score score--${tone}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="score__track" />
        <circle cx="50" cy="50" r={r} className="score__value" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <span>{value}</span>
    </div>
  )
}
