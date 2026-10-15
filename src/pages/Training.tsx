import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { CATEGORIES, POSES, type Category, type Pose } from '../data/poses'
import { VARIATIONS, WARMUP } from '../data/training'
import { Figure } from '../figure/Figure'
import { href } from '../router'
import { actions } from '../store'

export function Training() {
  return (
    <div className="page">
      <header className="page__head">
        <h1>S’entraîner</h1>
        <p className="lead">
          Poser, c’est comme le sport : la gêne disparaît avec la répétition. Quelques minutes devant un miroir suffisent.
        </p>
      </header>
      <div className="drills">
        <a className="drill" href={href('entrainement', 'echauffement')}>
          <span className="drill__icon"><Icon name="timer" /></span>
          <div>
            <h3>Échauffement d’acteur</h3>
            <p>3 minutes pour relâcher le corps, la mâchoire et le trac, à faire juste avant une séance photo.</p>
          </div>
          <span className="pill">3 min</span>
        </a>
        <a className="drill" href={href('entrainement', 'enchainement')}>
          <span className="drill__icon"><Icon name="play" /></span>
          <div>
            <h3>Enchaînement miroir</h3>
            <p>Les poses défilent : prends-les devant le miroir avant la fin du chrono. C’est ainsi que les mannequins travaillent leurs automatismes.</p>
          </div>
          <span className="pill">2–4 min</span>
        </a>
        <a className="drill" href={href('entrainement', 'variations')}>
          <span className="drill__icon"><Icon name="shuffle" /></span>
          <div>
            <h3>Bouge à chaque déclic</h3>
            <p>Une micro-variation toutes les quelques secondes. L’exercice qui empêche de se figer quand l’appareil crépite.</p>
          </div>
          <span className="pill">1 min</span>
        </a>
        <a className="drill" href={href('entrainement', 'quiz')}>
          <span className="drill__icon"><Icon name="eye" /></span>
          <div>
            <h3>L’œil du photographe</h3>
            <p>Deux silhouettes, une seule est flatteuse. Entraîne ton œil à repérer ce qui marche.</p>
          </div>
          <span className="pill">Quiz</span>
        </a>
      </div>
    </div>
  )
}

/* ---------- shared helpers ---------- */

let audio: AudioContext | null = null
function beep(freq = 880, duration = 0.12) {
  try {
    audio ??= new AudioContext()
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.15, audio.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)
    osc.connect(gain).connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + duration + 0.02)
  } catch {
    /* audio is optional */
  }
}

/** Counts down `seconds`, calls `onDone` at zero. Restarts when `key` changes. */
function useCountdown(seconds: number, running: boolean, key: unknown, onDone: () => void) {
  const [left, setLeft] = useState(seconds)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => setLeft(seconds), [seconds, key])
  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => window.clearInterval(t)
  }, [running, key])
  useEffect(() => {
    if (running && left === 0) done.current()
  }, [left, running])
  return left
}

function Ring({ value, total, children }: { value: number; total: number; children?: React.ReactNode }) {
  const r = 44
  const c = 2 * Math.PI * r
  return (
    <div className="ring">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="ring__track" />
        <circle cx="50" cy="50" r={r} className="ring__value" strokeDasharray={c} strokeDashoffset={c * (1 - value / total)} />
      </svg>
      <div className="ring__label">{children}</div>
    </div>
  )
}

function DrillHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <a className="back" href={href('entrainement')}>
        <Icon name="back" size={18} /> Entraînement
      </a>
      <header className="page__head">
        <h1>{title}</h1>
        <p className="lead">{subtitle}</p>
      </header>
    </>
  )
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ---------- Warm-up ---------- */

export function Warmup() {
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)
  const finished = step >= WARMUP.length
  const current = WARMUP[Math.min(step, WARMUP.length - 1)]
  const left = useCountdown(current.seconds, running && !finished, step, () => {
    beep(step === WARMUP.length - 1 ? 660 : 880)
    if (step === WARMUP.length - 1) {
      setRunning(false)
      actions.practised()
    }
    setStep((s) => s + 1)
  })

  return (
    <div className="page drill-page">
      <DrillHeader title="Échauffement d’acteur" subtitle="Sept exercices enchaînés. Lance le chrono et laisse-toi guider." />
      {finished ? (
        <div className="done">
          <h2>Prêt(e) pour l’objectif</h2>
          <p>Ton corps est relâché. Garde cette sensation : expire avant chaque photo.</p>
          <div className="actions">
            <button type="button" className="btn btn--ghost" onClick={() => setStep(0)}>
              Recommencer
            </button>
            <a className="btn btn--primary" href={href('entrainement', 'enchainement')}>
              Enchaîner des poses
            </a>
          </div>
        </div>
      ) : (
        <div className="warmup">
          <Ring value={left} total={current.seconds}>
            <strong>{left}</strong>
            <small>secondes</small>
          </Ring>
          <div className="warmup__text">
            <span className="eyebrow">
              Exercice {step + 1} / {WARMUP.length}
            </span>
            <h2>{current.title}</h2>
            <p>{current.body}</p>
            <div className="actions">
              <button type="button" className="btn btn--icon" onClick={() => setStep((s) => Math.max(0, s - 1))} aria-label="Exercice précédent" disabled={step === 0}>
                <Icon name="back" />
              </button>
              <button type="button" className="btn btn--primary" onClick={() => setRunning((r) => !r)}>
                <Icon name={running ? 'pause' : 'play'} size={18} /> {running ? 'Pause' : 'Démarrer'}
              </button>
              <button type="button" className="btn btn--icon" onClick={() => setStep((s) => s + 1)} aria-label="Exercice suivant">
                <Icon name="next" />
              </button>
            </div>
          </div>
          <ol className="dots" aria-hidden="true">
            {WARMUP.map((w, i) => (
              <li key={w.title} className={i < step ? 'done' : i === step ? 'current' : ''} />
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

/* ---------- Pose flow ---------- */

export function Flow() {
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [seconds, setSeconds] = useState(8)
  const [queue, setQueue] = useState<Pose[] | null>(null)
  const [index, setIndex] = useState(0)
  const [running, setRunning] = useState(true)

  const start = () => {
    const pool = category === 'all' ? POSES : POSES.filter((p) => p.category === category)
    setQueue(shuffle(pool).slice(0, 8))
    setIndex(0)
    setRunning(true)
  }

  const finished = queue !== null && index >= queue.length
  const pose = queue?.[Math.min(index, queue.length - 1)]
  const left = useCountdown(seconds, running && !!queue && !finished, `${index}-${queue?.length}`, () => {
    beep()
    if (queue && index === queue.length - 1) actions.practised()
    setIndex((i) => i + 1)
  })

  if (!queue) {
    return (
      <div className="page drill-page">
        <DrillHeader title="Enchaînement miroir" subtitle="Place-toi devant un miroir. Chaque pose s’affiche quelques secondes : prends-la, tiens-la, puis passe à la suivante." />
        <div className="setup">
          <fieldset>
            <legend>Poses</legend>
            <div className="chips">
              <button type="button" className={`chip ${category === 'all' ? 'chip--active' : ''}`} onClick={() => setCategory('all')}>
                Toutes
              </button>
              {CATEGORIES.map((c) => (
                <button type="button" key={c.id} className={`chip ${category === c.id ? 'chip--active' : ''}`} onClick={() => setCategory(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Temps par pose</legend>
            <div className="chips">
              {[5, 8, 12, 20].map((s) => (
                <button type="button" key={s} className={`chip ${seconds === s ? 'chip--active' : ''}`} onClick={() => setSeconds(s)}>
                  {s} s
                </button>
              ))}
            </div>
          </fieldset>
          <button type="button" className="btn btn--primary btn--wide" onClick={start}>
            <Icon name="play" size={18} /> Commencer
          </button>
        </div>
      </div>
    )
  }

  if (finished || !pose) {
    return (
      <div className="page drill-page">
        <DrillHeader title="Enchaînement miroir" subtitle="Série terminée." />
        <div className="done">
          <h2>{queue.length} poses enchaînées</h2>
          <p>Refais la série demain, puis essaie de raccourcir le chrono : l’objectif est de prendre chaque pose sans réfléchir.</p>
          <div className="actions">
            <button type="button" className="btn btn--ghost" onClick={() => setQueue(null)}>
              Changer les réglages
            </button>
            <button type="button" className="btn btn--primary" onClick={start}>
              Nouvelle série
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page drill-page">
      <DrillHeader title="Enchaînement miroir" subtitle={`Pose ${index + 1} sur ${queue.length}`} />
      <div className="flow">
        <div className="flow__figure">
          <Figure illustration={pose.illustration} title={pose.name} />
        </div>
        <div className="flow__text">
          <h2>{pose.name}</h2>
          <ol className="steps steps--compact">
            {pose.steps.map((s, i) => (
              <li key={i}>
                <span className="steps__n">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="flow__controls">
            <Ring value={left} total={seconds}>
              <strong>{left}</strong>
            </Ring>
            <button type="button" className="btn btn--icon" onClick={() => setRunning((r) => !r)} aria-label={running ? 'Pause' : 'Reprendre'}>
              <Icon name={running ? 'pause' : 'play'} />
            </button>
            <button type="button" className="btn btn--icon" onClick={() => setIndex((i) => i + 1)} aria-label="Pose suivante">
              <Icon name="next" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Micro-variations ---------- */

export function Variations() {
  const [items, setItems] = useState<string[] | null>(null)
  const [index, setIndex] = useState(0)
  const seconds = 5
  const finished = items !== null && index >= items.length
  const left = useCountdown(seconds, !!items && !finished, index, () => {
    beep(1046, 0.08)
    if (items && index === items.length - 1) actions.practised()
    setIndex((i) => i + 1)
  })
  const start = () => {
    setItems(shuffle(VARIATIONS).slice(0, 12))
    setIndex(0)
  }

  return (
    <div className="page drill-page">
      <DrillHeader
        title="Bouge à chaque déclic"
        subtitle="Prends une pose de base. À chaque bip, change uniquement le détail affiché, comme pendant une vraie rafale."
      />
      {!items ? (
        <div className="setup">
          <p>12 variations, une toutes les {seconds} secondes. Le but n’est pas la perfection mais la fluidité : ne t’arrête jamais.</p>
          <button type="button" className="btn btn--primary btn--wide" onClick={start}>
            <Icon name="play" size={18} /> C’est parti
          </button>
        </div>
      ) : finished ? (
        <div className="done">
          <h2>Rafale terminée</h2>
          <p>C’est exactement ce que fait un mannequin pendant une séance : bouger un peu, souvent, sans se figer.</p>
          <div className="actions">
            <button type="button" className="btn btn--primary" onClick={start}>
              Recommencer
            </button>
          </div>
        </div>
      ) : (
        <div className="variation">
          <span className="eyebrow">
            {index + 1} / {items.length}
          </span>
          <p className="variation__text" key={index}>
            {items[index]}
          </p>
          <Ring value={left} total={seconds}>
            <strong>{left}</strong>
          </Ring>
        </div>
      )}
    </div>
  )
}

/* ---------- Quiz ---------- */

export function Quiz() {
  const rounds = useMemo(
    () =>
      shuffle(POSES.filter((p) => p.mistake)).map((pose) => ({ pose, goodFirst: Math.random() < 0.5 })),
    [],
  )
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<'good' | 'bad' | null>(null)
  const [score, setScore] = useState(0)

  if (index >= rounds.length) {
    return (
      <div className="page drill-page">
        <DrillHeader title="L’œil du photographe" subtitle="Quiz terminé." />
        <div className="done">
          <h2>
            {score} / {rounds.length}
          </h2>
          <p>{score === rounds.length ? 'Sans faute : tu as l’œil.' : 'Relis les poses concernées, puis retente le quiz.'}</p>
          <div className="actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setIndex(0)
                setScore(0)
                setPicked(null)
              }}
            >
              Rejouer
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { pose, goodFirst } = rounds[index]
  const options: ('good' | 'bad')[] = goodFirst ? ['good', 'bad'] : ['bad', 'good']
  const choose = (o: 'good' | 'bad') => {
    if (picked) return
    setPicked(o)
    if (o === 'good') setScore((s) => s + 1)
  }

  return (
    <div className="page drill-page">
      <DrillHeader title="L’œil du photographe" subtitle={`Question ${index + 1} sur ${rounds.length} · Laquelle est la plus photogénique ?`} />
      <div className="quiz">
        {options.map((o, i) => (
          <button
            type="button"
            key={o}
            className={`quiz__option ${picked ? (o === 'good' ? 'is-good' : 'is-bad') : ''} ${picked === o ? 'is-picked' : ''}`}
            onClick={() => choose(o)}
            aria-label={`Silhouette ${i + 1}`}
          >
            <Figure
              illustration={o === 'good' ? pose.illustration : pose.mistake!.illustration}
              annotated={false}
              tone={picked && o === 'bad' ? 'mistake' : 'default'}
            />
            <span className="quiz__label">{i === 0 ? 'A' : 'B'}</span>
          </button>
        ))}
      </div>
      {picked && (
        <div className={`quiz__answer ${picked === 'good' ? 'is-good' : 'is-bad'}`}>
          <strong>{picked === 'good' ? 'Bien vu !' : 'Pas tout à fait.'}</strong>
          <p>
            <b>{pose.name}</b> : {pose.summary} {pose.mistake!.caption}
          </p>
          <div className="actions">
            <a className="btn btn--ghost" href={href('poses', pose.id)}>
              Voir la pose
            </a>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setPicked(null)
                if (index === rounds.length - 1) actions.practised()
                setIndex((i) => i + 1)
              }}
            >
              Suivante <Icon name="next" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
