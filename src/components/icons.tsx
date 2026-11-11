import type { ReactNode } from 'react'

/**
 * The app's line icons: 24 by 24, drawn with a 1.8 stroke in the current text colour,
 * so they match each other and follow light and dark themes.
 */
export type IconName =
  | 'home'
  | 'guitar'
  | 'headstock'
  | 'fretboard'
  | 'progress'
  | 'metronome'
  | 'bolt'
  | 'search-dot'
  | 'octave'
  | 'climb'
  | 'triad'

const DOT = { fill: 'currentColor', stroke: 'none' } as const

const PATHS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3.5 11.2 12 4l8.5 7.2" />
      <path d="M6 9.4V19a1 1 0 0 0 1 1h3.4v-5.2h3.2V20H17a1 1 0 0 0 1-1V9.4" />
    </>
  ),
  // an acoustic guitar, leaning
  guitar: (
    <g transform="rotate(38 12 12)">
      <path d="M12 9.2c-2.3 0-3.3 1.5-3 3 .2 1 .6 1.3 0 2.2-1.3 1-1.5 2.6-1 3.9.7 1.8 2.2 2.5 4 2.5s3.3-.7 4-2.5c.5-1.3.3-2.9-1-3.9-.6-.9-.2-1.2 0-2.2.3-1.5-.7-3-3-3z" />
      <path d="M12 9.2V1.8M10.8 1.8h2.4" />
      <circle cx="12" cy="15.6" r="1.3" />
      <path d="M10.6 18.5h2.8" />
    </g>
  ),
  // a headstock with its tuning pegs
  headstock: (
    <>
      <path d="M9.4 21.5v-8.2C8.3 11 7.6 7.2 8.1 3.6c2.6-1.1 5.2-1.1 7.8 0 .5 3.6-.2 7.4-1.3 9.7v8.2" />
      <circle cx="5.6" cy="5.6" r="1.4" {...DOT} />
      <circle cx="5.3" cy="9.4" r="1.4" {...DOT} />
      <circle cx="18.4" cy="5.6" r="1.4" {...DOT} />
      <circle cx="18.7" cy="9.4" r="1.4" {...DOT} />
      <path d="M12 6.5v15" strokeOpacity="0.5" />
    </>
  ),
  // a piece of fretboard with a note on it
  fretboard: (
    <>
      <rect x="2.8" y="6" width="18.4" height="12" rx="2.2" />
      <path d="M9 6v12M15 6v12" strokeOpacity="0.3" />
      <path d="M2.8 10h18.4M2.8 14h18.4" strokeOpacity="0.45" />
      <circle cx="12" cy="14" r="2.6" {...DOT} />
    </>
  ),
  progress: (
    <>
      <path d="M4 20h16" />
      <path d="m5 15.5 4.5-4.5 3.5 3 6.5-7" />
      <path d="M15.5 7h4v4" />
    </>
  ),
  metronome: (
    <>
      <path d="M9.2 3.5h5.6L18.5 20.5h-13z" />
      <path d="M7 16h10" />
      <path d="m12 16 4.2-8.5" />
      <circle cx="15.2" cy="9.6" r="1.3" {...DOT} />
    </>
  ),
  bolt: <path d="M13.5 2.5 5.5 13.5h6l-1 8 8-11h-6z" fill="currentColor" strokeWidth="1.2" />,
  'search-dot': (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
      <circle cx="10.5" cy="10.5" r="2.4" {...DOT} />
    </>
  ),
  octave: (
    <>
      <circle cx="6" cy="17" r="2.6" {...DOT} />
      <circle cx="18" cy="7" r="2.6" {...DOT} />
      <path d="M6 13.2C6 7.5 9 5.6 14.5 6.3" strokeDasharray="2 2.6" />
    </>
  ),
  // a triad: three stacked notes
  triad: (
    <>
      <path d="M3 6.5h18M3 12h18M3 17.5h18" strokeOpacity="0.35" />
      <circle cx="8" cy="17.5" r="2.6" {...DOT} />
      <circle cx="12" cy="12" r="2.6" {...DOT} />
      <circle cx="16" cy="6.5" r="2.6" {...DOT} />
    </>
  ),
  climb: (
    <>
      <path d="M3.5 20.5h4v-4h4v-4h4v-4h3" />
      <circle cx="19.5" cy="4.5" r="2" {...DOT} />
    </>
  ),
}

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}

/** The app's mark: a guitar pick with strings and one note, as on the home-screen icon. */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="brand-g" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#ff9150" />
          <stop offset="1" stopColor="#ff3a78" />
        </linearGradient>
        <clipPath id="brand-pick">
          <path d="M256 452c-26 0-150-170-160-262-6-60 60-112 160-112s166 52 160 112c-10 92-134 262-160 262z" />
        </clipPath>
      </defs>
      <path d="M256 452c-26 0-150-170-160-262-6-60 60-112 160-112s166 52 160 112c-10 92-134 262-160 262z" fill="url(#brand-g)" />
      <g clipPath="url(#brand-pick)" stroke="#fff" strokeLinecap="round">
        <path d="M190 60v410M256 60v410M322 60v410" strokeWidth="22" />
      </g>
      <circle cx="256" cy="243" r="54" fill="#fff" />
    </svg>
  )
}
