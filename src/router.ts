import { useSyncExternalStore } from 'react'

/** Minimal hash router: works from any static host without server config. */
export function useRoute(): string[] {
  const hash = useSyncExternalStore(
    (l) => {
      window.addEventListener('hashchange', l)
      return () => window.removeEventListener('hashchange', l)
    },
    () => window.location.hash,
  )
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean)
}

export const href = (...parts: string[]) => `#/${parts.join('/')}`

export function navigate(...parts: string[]) {
  window.location.hash = href(...parts)
}
