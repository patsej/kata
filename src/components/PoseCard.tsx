import type { Pose } from '../data/poses'
import { CATEGORIES } from '../data/poses'
import { Figure } from '../figure/Figure'
import { href } from '../router'
import { useProgress } from '../store'
import { Icon } from './Icon'

export function Level({ level }: { level: 1 | 2 | 3 }) {
  const label = ['Facile', 'Intermédiaire', 'Avancé'][level - 1]
  return (
    <span className="level" title={label} aria-label={`Niveau : ${label}`}>
      {[1, 2, 3].map((i) => (
        <i key={i} className={i <= level ? 'on' : ''} />
      ))}
    </span>
  )
}

export function categoryLabel(id: Pose['category']) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id
}

export function PoseCard({ pose }: { pose: Pose }) {
  const progress = useProgress()
  const learned = progress.learned.includes(pose.id)
  const fav = progress.favorites.includes(pose.id)
  const best = progress.bestScores[pose.id]
  return (
    <a className="pose-card" href={href('poses', pose.id)}>
      <div className="pose-card__art">
        <Figure illustration={pose.illustration} annotated={false} title={pose.name} />
        <div className="pose-card__badges">
          {learned && (
            <span className="badge badge--ok" title="Maîtrisée">
              <Icon name="check" size={14} />
            </span>
          )}
          {fav && (
            <span className="badge" title="Favori">
              <Icon name="heart" size={14} filled />
            </span>
          )}
        </div>
      </div>
      <div className="pose-card__body">
        <span className="eyebrow">{categoryLabel(pose.category)}</span>
        <h3>{pose.name}</h3>
        <p>{pose.summary}</p>
        <div className="pose-card__meta">
          <Level level={pose.level} />
          {best !== undefined && <span className="pill">Meilleur score {best}</span>}
        </div>
      </div>
    </a>
  )
}
