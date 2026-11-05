import { useState } from 'react'
import { CompareCard } from '../components/CompareCard'
import { CATEGORIES, POSES, type Category } from '../data/poses'

export function Mistakes() {
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const poses = filter === 'all' ? POSES : POSES.filter((p) => p.category === filter)

  return (
    <div className="page">
      <header className="page__head">
        <h1>Les erreurs à éviter</h1>
        <p className="lead">
          Les réflexes qui trahissent le malaise devant l’objectif, chacun à côté de la pose qui le corrige. Repère ceux que tu
          fais, puis travaille la correction.
        </p>
      </header>
      <div className="chips" role="tablist" aria-label="Catégories">
        <button type="button" role="tab" aria-selected={filter === 'all'} className={`chip ${filter === 'all' ? 'chip--active' : ''}`} onClick={() => setFilter('all')}>
          Toutes ({POSES.length})
        </button>
        {CATEGORIES.map((c) => (
          <button
            type="button"
            role="tab"
            key={c.id}
            aria-selected={filter === c.id}
            className={`chip ${filter === c.id ? 'chip--active' : ''}`}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="compare-grid">
        {poses.map((p) => (
          <CompareCard key={p.id} pose={p} linked />
        ))}
      </div>
    </div>
  )
}
