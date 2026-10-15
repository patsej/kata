import { useState } from 'react'
import { PoseCard } from '../components/PoseCard'
import { CATEGORIES, POSES, type Category } from '../data/poses'
import { useProgress } from '../store'

type Filter = Category | 'all' | 'favorites'

export function Library() {
  const [filter, setFilter] = useState<Filter>('all')
  const progress = useProgress()
  const poses =
    filter === 'all'
      ? POSES
      : filter === 'favorites'
        ? POSES.filter((p) => progress.favorites.includes(p.id))
        : POSES.filter((p) => p.category === filter)
  const blurb = CATEGORIES.find((c) => c.id === filter)?.blurb

  return (
    <div className="page">
      <header className="page__head">
        <h1>Les poses</h1>
        <p className="lead">{POSES.length} poses issues des techniques de photographes, de mannequins et du tapis rouge.</p>
      </header>
      <div className="chips" role="tablist" aria-label="Catégories">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          Toutes
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
            {c.label}
          </Chip>
        ))}
        <Chip active={filter === 'favorites'} onClick={() => setFilter('favorites')}>
          Favoris
        </Chip>
      </div>
      {blurb && <p className="muted chips__blurb">{blurb}</p>}
      {poses.length === 0 ? (
        <p className="empty">Aucun favori pour l’instant. Touche le cœur sur une pose pour la retrouver ici.</p>
      ) : (
        <div className="grid">
          {poses.map((p) => (
            <PoseCard key={p.id} pose={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={active} className={`chip ${active ? 'chip--active' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}
