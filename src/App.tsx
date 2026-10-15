import { lazy, Suspense, useEffect } from 'react'
import { Icon, type IconName } from './components/Icon'
import { Home } from './pages/Home'
import { Library } from './pages/Library'
import { Mistakes } from './pages/Mistakes'
import { PoseDetail } from './pages/PoseDetail'
import { Flow, Quiz, Training, Variations, Warmup } from './pages/Training'
import { href, useRoute } from './router'

// The coach pulls in MediaPipe: load it only when the user opens it.
const Coach = lazy(() => import('./pages/Coach').then((m) => ({ default: m.Coach })))

const NAV: { id: string; label: string; icon: IconName }[] = [
  { id: '', label: 'Accueil', icon: 'home' },
  { id: 'poses', label: 'Poses', icon: 'poses' },
  { id: 'erreurs', label: 'Erreurs', icon: 'compare' },
  { id: 'entrainement', label: 'S’entraîner', icon: 'train' },
  { id: 'coach', label: 'Coach', icon: 'camera' },
]

export function App() {
  const route = useRoute()
  const [section = '', param] = route

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [section, param])

  let page: React.ReactNode
  switch (section) {
    case 'poses':
      page = param ? <PoseDetail id={param} /> : <Library />
      break
    case 'erreurs':
      page = <Mistakes />
      break
    case 'entrainement':
      page =
        param === 'echauffement' ? <Warmup /> : param === 'enchainement' ? <Flow /> : param === 'variations' ? <Variations /> : param === 'quiz' ? <Quiz /> : <Training />
      break
    case 'coach':
      page = <Coach key={param ?? ''} poseId={param} />
      break
    default:
      page = <Home />
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href={href()}>
          <span className="brand__mark" aria-hidden="true">P</span>
          Posé
        </a>
        <nav className="topnav" aria-label="Navigation principale">
          {NAV.map((n) => (
            <a key={n.id} href={href(n.id)} aria-current={section === n.id ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
      </header>
      <main>
        <Suspense fallback={<div className="page-loading" aria-busy="true" />}>{page}</Suspense>
      </main>
      <nav className="tabbar" aria-label="Navigation">
        {NAV.map((n) => (
          <a key={n.id} href={href(n.id)} aria-current={section === n.id ? 'page' : undefined}>
            <Icon name={n.icon} />
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
