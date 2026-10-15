import { CompareCard } from '../components/CompareCard'
import { Icon } from '../components/Icon'
import { categoryLabel, Level } from '../components/PoseCard'
import { POSE_BY_ID, POSES, poseOfTheDay } from '../data/poses'
import { PRINCIPLES } from '../data/training'
import { Figure } from '../figure/Figure'
import { href } from '../router'
import { streak, useProgress } from '../store'

export function Home() {
  const progress = useProgress()
  const pose = poseOfTheDay()
  const learned = progress.learned.length
  const days = streak(progress.practiceDays)
  const pct = Math.round((learned / POSES.length) * 100)

  return (
    <div className="page home">
      <section className="hero">
        <div className="hero__text">
          <span className="eyebrow">Posé · coach photo</span>
          <h1>
            Être à l’aise <em>devant l’objectif</em>, ça s’apprend.
          </h1>
          <p className="lead">
            Les acteurs et les mannequins répètent leurs poses comme des gammes. Apprends les mêmes techniques, entraîne-toi
            quelques minutes par jour, puis vérifie ta pose avec la caméra.
          </p>
          <div className="actions">
            <a className="btn btn--primary" href={href('poses')}>
              Découvrir les poses
            </a>
            <a className="btn btn--ghost" href={href('coach')}>
              <Icon name="camera" size={18} /> Essayer le coach
            </a>
          </div>
        </div>
        <a className="hero__card" href={href('poses', pose.id)}>
          <span className="eyebrow">Pose du jour</span>
          <Figure illustration={pose.illustration} annotated={false} title={pose.name} />
          <div className="hero__card-foot">
            <div>
              <strong>{pose.name}</strong>
              <span>{categoryLabel(pose.category)}</span>
            </div>
            <Level level={pose.level} />
          </div>
        </a>
      </section>

      <section className="stats" aria-label="Ta progression">
        <div className="stat">
          <span className="stat__value">
            {learned}
            <small>/{POSES.length}</small>
          </span>
          <span className="stat__label">poses maîtrisées</span>
          <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="stat">
          <span className="stat__value">{days}</span>
          <span className="stat__label">{days > 1 ? 'jours d’affilée' : 'jour d’affilée'}</span>
        </div>
        <div className="stat">
          <span className="stat__value">{Object.keys(progress.bestScores).length}</span>
          <span className="stat__label">poses testées au coach</span>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Les règles d’or</h2>
          <p>Ce que les photographes répètent à chaque séance.</p>
        </div>
        <ol className="principles">
          {PRINCIPLES.map((p, i) => (
            <li key={p.title}>
              <span className="principles__n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Avant, après</h2>
          <p>Les erreurs qui trahissent le malaise, à côté de la pose qui les corrige.</p>
        </div>
        <div className="compare-grid">
          {['espace-bras', 'front-en-avant'].map((id) => (
            <CompareCard key={id} pose={POSE_BY_ID.get(id)!} linked />
          ))}
        </div>
        <div className="actions section__more">
          <a className="btn btn--ghost" href={href('erreurs')}>
            <Icon name="compare" size={18} /> Voir les {POSES.length} erreurs et leurs corrections
          </a>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Ton parcours</h2>
          <p>Trois étapes, dans l’ordre où les coachs les enseignent.</p>
        </div>
        <div className="path">
          <a className="path__step" href={href('poses')}>
            <span className="path__icon"><Icon name="poses" /></span>
            <h3>1. Apprendre</h3>
            <p>Chaque pose expliquée en trois gestes, avec ce qu’il faut éviter.</p>
          </a>
          <a className="path__step" href={href('entrainement')}>
            <span className="path__icon"><Icon name="train" /></span>
            <h3>2. S’entraîner</h3>
            <p>Échauffement d’acteur, enchaînements devant le miroir, quiz.</p>
          </a>
          <a className="path__step" href={href('coach')}>
            <span className="path__icon"><Icon name="camera" /></span>
            <h3>3. Se corriger</h3>
            <p>La caméra analyse ta pose et te propose des corrections. Rien ne quitte ton appareil.</p>
          </a>
        </div>
      </section>
    </div>
  )
}
