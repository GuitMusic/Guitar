import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Small inline icons, drawn with currentColor. */
const ICONS = {
  play: <path d="M8 5v14l11-7z" fill="currentColor" />,
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </>
  ),
  restart: <path d="M6 5h2v14H6zM20 5v14L9 12z" fill="currentColor" />,
  loop: (
    <path
      d="M7 7h10l-2-2m2 2-2 2M17 17H7l2 2m-2-2 2-2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  metronome: (
    <path
      d="M9 3h6l4 18H5zM12 15l5-9M7.5 17h9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  mic: (
    <path
      d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  ),
  speed: (
    <path
      d="M4 16a8 8 0 1 1 16 0M12 16l4-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  ),
  settings: (
    <path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  chevron: <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
}

export function Icon({ name, size = 18 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="pb-icon">
      {ICONS[name]}
    </svg>
  )
}

/** A pill that toggles something, with an optional menu behind a small arrow. */
export function TogglePill({
  on,
  icon,
  label,
  title,
  onToggle,
  menuLabel,
  children,
  extra,
}: {
  on: boolean
  icon: keyof typeof ICONS
  label: ReactNode
  title: string
  onToggle: () => void
  menuLabel?: string
  children?: ReactNode
  extra?: ReactNode
}) {
  return (
    <div className={`pb-pill${on ? ' on' : ''}`}>
      <button className="pb-pill-main" aria-pressed={on} title={title} onClick={onToggle}>
        <Icon name={icon} />
        <span className="pb-pill-label">{label}</span>
        {extra}
      </button>
      {children && <Menu label={menuLabel ?? 'More options'}>{children}</Menu>}
    </div>
  )
}

/** An arrow button that opens a small panel; closes on outside click or Escape. */
export function Menu({ label, children, trigger, down = false }: { label: string; children: ReactNode; trigger?: ReactNode; down?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div className="pb-menu" ref={ref}>
      <button className={trigger ? 'pb-pill-main' : 'pb-menu-btn'} aria-label={label} aria-expanded={open} title={label} onClick={() => setOpen(!open)}>
        {trigger ?? <Icon name="chevron" size={16} />}
      </button>
      {open && (
        <div className={`pb-menu-panel${down ? ' down' : ''}`} role="dialog" aria-label={label}>
          {children}
        </div>
      )}
    </div>
  )
}

interface ProgressProps {
  /** Start tick of every bar, plus the song's end tick as the last entry. */
  barTicks: number[]
  tick: number
  loop: { on: boolean; start: number; end: number }
  onSeekBar: (bar: number) => void
  onLoopBars: (start: number, end: number) => void
}

/**
 * The song as a line split into bars. Click a bar to jump there; drag across bars to loop them.
 */
export function ProgressLine({ barTicks, tick, loop, onSeekBar, onLoopBars }: ProgressProps) {
  const el = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null)
  const bars = barTicks.length - 1
  const total = barTicks[bars] || 1
  const pct = (t: number) => `${Math.max(0, Math.min(100, (t / total) * 100))}%`
  const barAt = (clientX: number) => {
    const r = el.current!.getBoundingClientRect()
    const t = ((clientX - r.left) / r.width) * total
    let b = 1
    while (b < bars && barTicks[b] <= t) b++
    return b
  }
  const nextBar = barTicks.findIndex((t) => t > tick)
  const currentBar = nextBar === -1 ? bars : Math.max(1, nextBar)
  const shown = drag ? { on: true, start: Math.min(drag.from, drag.to), end: Math.max(drag.from, drag.to) } : loop

  if (bars < 1) return <div className="pb-progress" />
  return (
    <div
      ref={el}
      className="pb-progress"
      role="slider"
      aria-label="Song position. Click a bar to jump there, drag across bars to loop them."
      aria-valuemin={1}
      aria-valuemax={bars}
      aria-valuenow={currentBar}
      onPointerDown={(e) => {
        el.current!.setPointerCapture(e.pointerId)
        const b = barAt(e.clientX)
        setDrag({ from: b, to: b })
      }}
      onPointerMove={(e) => drag && setDrag({ ...drag, to: barAt(e.clientX) })}
      onPointerUp={() => {
        if (!drag) return
        if (drag.from === drag.to) onSeekBar(drag.from)
        else onLoopBars(Math.min(drag.from, drag.to), Math.max(drag.from, drag.to))
        setDrag(null)
      }}
      onPointerCancel={() => setDrag(null)}
    >
      <div className="pb-track">
        {barTicks.slice(1, -1).map((t, i) => (
          <i key={i} className="pb-bar-tick" style={{ left: pct(t) }} />
        ))}
        <div className="pb-fill" style={{ width: pct(tick) }} />
      </div>
      {shown.on && (
        <div
          className="pb-loop"
          style={{ left: pct(barTicks[shown.start - 1] ?? 0), width: `calc(${pct((barTicks[shown.end] ?? total) - (barTicks[shown.start - 1] ?? 0))})` }}
        />
      )}
      <div className="pb-head" style={{ left: pct(tick) }} />
    </div>
  )
}

/** One light per beat of the bar; the current one is lit, the first beat is bigger. */
export function BeatLights({ count, current }: { count: number; current: number | null }) {
  return (
    <span className="pb-beats" aria-hidden="true">
      {Array.from({ length: Math.min(12, count) }, (_, i) => (
        <i key={i} className={`${i === 0 ? 'first' : ''}${i === current ? ' lit' : ''}`} />
      ))}
    </span>
  )
}
