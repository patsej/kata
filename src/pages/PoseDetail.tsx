import { CompareCard } from '../components/CompareCard'
import { Icon } from '../components/Icon'
import { categoryLabel, Level } from '../components/PoseCard'
import { POSES, POSE_BY_ID } from '../data/poses'
import { Figure } from '../figure/Figure'
import { href } from '../router'
import { actions, useProgress } from '../store'

export function PoseDetail({ id }: { id: string }) {
  const pose = POSE_BY_ID.get(id)
  const progress = useProgress()

  if (!pose) {
    return (
      <div className="page">
        <p className="empty">
          Cette pose n’existe pas. <a href={href('poses')}>Retour aux poses</a>
        </p>
      </div>
    )
  }

  const index = POSES.indexOf(pose)
  const prev = POSES[(index - 1 + POSES.length) % POSES.length]
  const next = POSES[(index + 1) % POSES.length]
  const learned = progress.learned.includes(pose.id)
  const fav = progress.favorites.includes(pose.id)
  const best = progress.bestScores[pose.id]

  return (
    <div className="page detail" key={pose.id}>
      <a className="back" href={href('poses')}>
        <Icon name="back" size={18} /> Toutes les poses
      </a>
      <div className="detail__layout">
        <div className="detail__art">
          <div className="detail__figure">
            <Figure illustration={pose.illustration} title={pose.name} />
          </div>
          <a className="detail__jump" href="#erreur" onClick={(e) => { e.preventDefault(); document.getElementById('erreur')?.scrollIntoView({ behavior: 'smooth' }) }}>
            <Icon name="compare" size={16} /> Comparer avec l’erreur à éviter
          </a>
        </div>

        <div className="detail__text">
          <span className="eyebrow">
            {categoryLabel(pose.category)} · <Level level={pose.level} />
          </span>
          <h1>{pose.name}</h1>
          <p className="lead">{pose.summary}</p>
          <div className="tags">
            {pose.contexts.map((c) => (
              <span key={c} className="pill">
                {c}
              </span>
            ))}
          </div>

          <h2>En trois gestes</h2>
          <ol className="steps">
            {pose.steps.map((s, i) => (
              <li key={i}>
                <span className="steps__n">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>

          <h2>Pourquoi ça marche</h2>
          <p>{pose.why}</p>

          <h2>À éviter</h2>
          <ul className="avoid">
            {pose.avoid.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>

          {pose.tip && (
            <aside className="tip">
              <Icon name="sparkle" size={18} />
              <p>{pose.tip}</p>
            </aside>
          )}
          {pose.origin && <p className="origin">{pose.origin}</p>}

          <div className="detail__actions">
            {pose.coach && (
              <a className="btn btn--primary" href={href('coach', pose.id)}>
                <Icon name="camera" size={18} /> Vérifier avec le coach
                {best !== undefined && <span className="btn__badge">{best}</span>}
              </a>
            )}
            <button type="button" className={`btn ${learned ? 'btn--ok' : 'btn--ghost'}`} onClick={() => actions.toggleLearned(pose.id)} aria-pressed={learned}>
              <Icon name="check" size={18} /> {learned ? 'Maîtrisée' : 'Je la maîtrise'}
            </button>
            <button
              type="button"
              className={`btn btn--icon ${fav ? 'is-on' : ''}`}
              onClick={() => actions.toggleFavorite(pose.id)}
              aria-pressed={fav}
              aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Icon name="heart" size={20} filled={fav} />
            </button>
          </div>
        </div>
      </div>

      <section id="erreur" className="detail__compare">
        <CompareCard pose={pose} heading="L’erreur à éviter" />
      </section>

      <nav className="pager" aria-label="Autres poses">
        <a href={href('poses', prev.id)}>
          <Icon name="back" size={18} />
          <span>
            <small>Précédente</small>
            {prev.name}
          </span>
        </a>
        <a href={href('poses', next.id)} className="pager__next">
          <span>
            <small>Suivante</small>
            {next.name}
          </span>
          <Icon name="next" size={18} />
        </a>
      </nav>
    </div>
  )
}
