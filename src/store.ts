import { useSyncExternalStore } from 'react'

/** Per-device progress, kept in localStorage (the app works fine without it). */
export interface Progress {
  learned: string[]
  favorites: string[]
  /** Best coach score per pose id. */
  bestScores: Record<string, number>
  /** ISO dates (YYYY-MM-DD) on which the user practised. */
  practiceDays: string[]
}

const KEY = 'pose.progress.v1'
const EMPTY: Progress = { learned: [], favorites: [], bestScores: {}, practiceDays: [] }

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Progress>) }
  } catch {
    return EMPTY
  }
}

let state: Progress = load()
const listeners = new Set<() => void>()

function set(next: Progress) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode or storage disabled: progress lives for this session only */
  }
  listeners.forEach((l) => l())
}

export function useProgress() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

export const today = () => new Date().toISOString().slice(0, 10)

export const actions = {
  toggleLearned(id: string) {
    set({ ...state, learned: toggle(state.learned, id) })
  },
  toggleFavorite(id: string) {
    set({ ...state, favorites: toggle(state.favorites, id) })
  },
  recordScore(id: string, score: number) {
    const best = Math.max(score, state.bestScores[id] ?? 0)
    set({ ...state, bestScores: { ...state.bestScores, [id]: best } })
    this.practised()
  },
  practised() {
    const d = today()
    if (!state.practiceDays.includes(d)) set({ ...state, practiceDays: [...state.practiceDays, d].slice(-400) })
  },
}

/** Number of consecutive days practised, ending today or yesterday. */
export function streak(days: string[], now = new Date()): number {
  const set = new Set(days)
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const iso = () => d.toISOString().slice(0, 10)
  if (!set.has(iso())) d.setUTCDate(d.getUTCDate() - 1)
  let n = 0
  while (set.has(iso())) {
    n++
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return n
}
