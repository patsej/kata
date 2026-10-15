const PATHS = {
  home: 'M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z',
  poses: 'M12 4.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM7 10.5l5 1 5-1M12 11.5V16m0 0-3 4.5m3-4.5 3 4.5',
  train: 'M12 3v3m0 12v3M3 12h3m12 0h3M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
  camera: 'M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM12 10a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z',
  heart: 'M12 19s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 7.6a3.8 3.8 0 0 1 7 1.9C19 14.6 12 19 12 19Z',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  back: 'M14.5 5.5 8 12l6.5 6.5',
  next: 'M9.5 5.5 16 12l-6.5 6.5',
  flip: 'M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6M17.5 3v4h-4M6.5 21v-4h4',
  upload: 'M12 15V4.5m0 0L7.5 9M12 4.5 16.5 9M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15',
  timer: 'M12 8v4.5l2.5 2.5M9.5 3h5M12 21a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z',
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M8 5.5v13M16 5.5v13',
  sparkle: 'M12 3.5 13.8 10l6.7 2-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z',
  download: 'M12 4.5V15m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14',
  shuffle: 'M4 7h3.5c2 0 3 1 4.5 5s2.5 5 4.5 5H20m0 0-2.5-2.5M20 17l-2.5 2.5M4 17h3.5c1 0 1.7-.3 2.3-.9M20 7h-3.5c-1 0-1.7.3-2.3.9M20 7l-2.5-2.5M20 7l-2.5 2.5',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13z',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 22, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
