import { useEffect, useId, useMemo, useState } from 'react'
import { fretFingerLabel } from '../music/fingering'
import { noteName, pitchClassName, solfegeName } from '../music/notes'
import type { FretNote } from '../music/types'
import { makeFretX, NECK_END, NUT_W, NUT_X, PICK_W, STRING_GAP, TOP, W } from './fretboardGeometry'

export type LabelMode = 'finger' | 'note'
export type StringOrder = 'tab' | 'player'

/** steel and nylon: one recording per note with a little room sound. -dry: closer, drier samples. */
export type GuitarSound = 'steel' | 'nylon' | 'steel-dry' | 'nylon-dry'

export interface FretboardOptions {
  labelMode: LabelMode
  stringOrder: StringOrder
  leftHanded: boolean
  showGhosts: boolean
  /** 'song': only the frets the song uses, so they are bigger. 'neck': the first 15 frets. */
  zoom?: 'song' | 'neck'
  /** Which guitar sample the player uses. */
  sound?: GuitarSound
  /** Show every fretted note of the current bar, and where the hand sits. Default true. */
  showShape?: boolean
  /** Show the 3D view of the fretting hand under the fretboard. Default true. */
  hand3d?: boolean
}

export interface FretMark {
  key: string
  string: number
  fret: number
  result: 'hit' | 'late' | 'miss' | 'waiting' | 'octave'
  /** Fade out after showing briefly. */
  fade?: boolean
}

interface Props {
  notes: FretNote[]
  ghosts: FretNote[]
  /** MIDI notes of the open strings without capo, string 1 (highest) first. */
  tuning: number[]
  capo: number
  options: FretboardOptions
  onNoteClick?: (note: FretNote, anchor: { x: number; y: number }) => void
  /** Tapping an empty spot on the neck: the string, the fret on the neck and the pitch. */
  onFretClick?: (string: number, fret: number, midi: number) => void
  /** Strings to highlight, e.g. the string a quiz question asks about. */
  highlightStrings?: number[]
  /** Fixed number of frets to draw instead of fitting the notes. */
  maxFret?: number
  showPickZone?: boolean
  /** Rings that show whether notes were played right. */
  marks?: FretMark[]
  /** Other fretted notes in the current bar, so the whole hand shape is visible. */
  shape?: FretNote[]
  /** Fret under the index finger, drawn as the four-fret box the hand covers. */
  handPosition?: number | null
  /** Quiet note-name labels on these spots, e.g. to show every note on the neck. */
  names?: FretNote[]
}

const NOTE_R = 17
const CHIP_X = 20
const OPEN_X = NUT_X - 34

/**
 * A note name with its do-ré-mi name in small type underneath. `dy` is where a
 * single-line label would sit, so both lines stay centred on the dot.
 */
function NoteText({ x, y, midi, size }: { x: number; y: number; midi: number; size: 'big' | 'small' }) {
  const big = size === 'big'
  return (
    <>
      <text x={x} y={y + (big ? 2 : 1)} textAnchor="middle">
        {pitchClassName(midi)}
      </text>
      <text x={x} y={y + (big ? 12 : 9)} textAnchor="middle" className={big ? 'fb-solfa' : 'fb-solfa fb-solfa-small'}>
        {solfegeName(midi)}
      </text>
    </>
  )
}

const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21]

export function Fretboard({ notes, ghosts, tuning, capo, options, onNoteClick, onFretClick, highlightStrings = [], maxFret, showPickZone = true, marks = [], shape = [], handPosition = null, names = [] }: Props) {
  // Unique ids for the SVG gradients, in case two fretboards share a page
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const ref = (name: string) => `url(#${name}-${uid})`
  const stringCount = tuning.length
  const maxNoteFret = Math.max(0, ...notes.map((n) => n.fret), ...ghosts.map((n) => n.fret))
  const frets = maxFret ?? (maxNoteFret > 15 ? Math.min(24, maxNoteFret + 2) : capo > 7 ? 17 : 15)
  const fretX = useMemo(() => makeFretX(frets), [frets])
  const bottom = TOP + (stringCount - 1) * STRING_GAP
  const H = bottom + 58
  const neckTop = TOP - 20
  const neckH = bottom - TOP + 40
  const neckRight = NECK_END

  const X = (x: number) => (options.leftHanded ? W - x : x)
  /** Left edge of a box drawn from x1 to x2 in unmirrored coordinates. */
  const boxX = (x1: number, x2: number) => Math.min(X(x1), X(x2))
  const Y = (string: number) =>
    TOP + (options.stringOrder === 'tab' ? string - 1 : stringCount - string) * STRING_GAP
  const anchor = (end: 'start' | 'end') =>
    options.leftHanded ? (end === 'start' ? 'end' : 'start') : end
  const noteX = (n: FretNote) =>
    n.fret === 0 ? OPEN_X : n.tabFret === 0 && capo > 0 ? fretX(capo) - 26 : (fretX(n.fret - 1) + fretX(n.fret)) / 2

  const sounding = new Set(notes.filter((n) => !n.isTieContinuation && !n.isHeld).map((n) => n.string))
  const pickX = NECK_END + 18 + PICK_W / 2

  // Frets covered by the hand, so the rest of the neck can be dimmed
  const showHand =
    handPosition !== null && handPosition > 0 && handPosition <= frets && (notes.some((n) => n.tabFret > 0) || shape.length > 0)
  const handLast = showHand ? Math.min(frets, handPosition! + 3) : 0

  // The last spot tapped on the neck, shown briefly with its note name
  const [tapped, setTapped] = useState<{ id: number; string: number; fret: number; midi: number } | null>(null)
  const tapFret = (string: number, fret: number) => {
    const midi = tuning[string - 1] + fret
    setTapped((prev) => ({ id: (prev?.id ?? 0) + 1, string, fret, midi }))
    onFretClick?.(string, fret, midi)
  }
  useEffect(() => {
    if (!tapped) return
    const t = window.setTimeout(() => setTapped(null), 1200)
    return () => window.clearTimeout(t)
  }, [tapped])
  /** A gentle sine wave from x1 to x2 along the string, for the ringing animation. */
  const wave = (x1: number, x2: number, y: number) => {
    const half = 12
    const dir = x2 > x1 ? 1 : -1
    let d = `M${x1} ${y}`
    for (let i = 0, x = x1; dir * (x2 - x) > 0; i++, x += dir * half) {
      d += ` Q${x + (dir * half) / 2} ${y + (i % 2 ? -4 : 4)} ${x + dir * half} ${y}`
    }
    return d
  }

  const click = (n: FretNote) => (e: React.MouseEvent) => {
    onNoteClick?.(n, { x: e.clientX, y: e.clientY })
  }

  return (
    <svg
      className="fretboard"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={
        notes.length
          ? `Playing ${notes.map((n) => `${noteName(n.midi)} on string ${n.string} fret ${n.tabFret}`).join(', ')}`
          : 'Fretboard'
      }
    >
      <defs>
        <linearGradient id={`wood-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d2519" />
          <stop offset="0.5" stopColor="#4b2f20" />
          <stop offset="1" stopColor="#2c1a11" />
        </linearGradient>
        <filter id={`grain-${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.2" numOctaves="3" seed="7" />
          <feColorMatrix values="0 0 0 0 0.08  0 0 0 0 0.04  0 0 0 0 0.02  0 0 0 0.6 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <linearGradient id={`fret-${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8a8680" />
          <stop offset="0.45" stopColor="#f3f1ec" />
          <stop offset="1" stopColor="#73706a" />
        </linearGradient>
        <linearGradient id={`nut-${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#d6cebd" />
          <stop offset="0.5" stopColor="#fcf8ee" />
          <stop offset="1" stopColor="#c5bba7" />
        </linearGradient>
        <pattern id={`wound-${uid}`} width="3" height="8" patternUnits="userSpaceOnUse">
          <rect width="3" height="8" fill="#c39b62" />
          <rect width="1.1" height="8" fill="#7a5a32" />
        </pattern>
        <radialGradient id={`spot-${uid}`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#ffd9a8" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffd9a8" stopOpacity="0" />
        </radialGradient>
        <filter id={`shadow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.45" />
        </filter>
        <filter id={`glow-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* Fret numbers on every fret, the hand's frets in the accent colour */}
      <g className="fb-fretnums">
        {Array.from({ length: frets }, (_, i) => i + 1).map((f) => {
          const inHand = showHand && f >= handPosition! && f <= handLast
          return (
            <text
              key={f}
              className={`fb-fretnum${inHand ? ' fb-fretnum-hand' : ''}${SINGLE_INLAYS.includes(f) || f % 12 === 0 ? ' fb-fretnum-dot' : ''}`}
              x={X((fretX(f - 1) + fretX(f)) / 2)}
              y={TOP - 32}
              textAnchor="middle"
            >
              {f}
            </text>
          )
        })}
        {showHand && (
          <rect
            className="fb-fretnum-bar"
            x={boxX(fretX(handPosition! - 1) + 4, fretX(handLast) - 4)}
            y={TOP - 27}
            width={Math.abs(fretX(handLast) - fretX(handPosition! - 1)) - 8}
            height="3"
            rx="1.5"
          />
        )}
      </g>

      {/* The neck: binding, rosewood with grain, a little shadow under it */}
      <rect className="fb-binding" x={boxX(NUT_X, neckRight) - 3} y={neckTop - 3} width={neckRight - NUT_X + 6} height={neckH + 6} rx="5" />
      <g className="fb-wood">
        <rect x={boxX(NUT_X, neckRight)} y={neckTop} width={neckRight - NUT_X} height={neckH} fill={ref('wood')} />
        <rect x={boxX(NUT_X, neckRight)} y={neckTop} width={neckRight - NUT_X} height={neckH} fill="#000" filter={ref('grain')} />
      </g>

      {SINGLE_INLAYS.filter((f) => f <= frets).map((f) => (
        <circle key={f} className="fb-inlay" cx={X((fretX(f - 1) + fretX(f)) / 2)} cy={(TOP + bottom) / 2} r="7.5" />
      ))}
      {frets >= 12 && (
        <g className="fb-inlay">
          <circle cx={X((fretX(11) + fretX(12)) / 2)} cy={TOP + STRING_GAP * 1.5} r="7.5" />
          <circle cx={X((fretX(11) + fretX(12)) / 2)} cy={bottom - STRING_GAP * 1.5} r="7.5" />
        </g>
      )}

      {/* Hand position as a spotlight: the frets outside the hand are dimmed */}
      {showHand && (() => {
        const x1 = fretX(handPosition! - 1)
        const x2 = fretX(handLast)
        return (
          <g className="fb-hand">
            {handPosition! > 1 && <rect className="fb-hand-dim" x={boxX(NUT_X, x1)} y={neckTop} width={x1 - NUT_X} height={neckH} />}
            {handLast < frets && <rect className="fb-hand-dim" x={boxX(x2, neckRight)} y={neckTop} width={neckRight - x2} height={neckH} />}
            <ellipse cx={X((x1 + x2) / 2)} cy={(TOP + bottom) / 2} rx={Math.max(120, (x2 - x1) * 0.8)} ry={neckH * 0.75} fill={ref('spot')} />
            <text x={X((x1 + x2) / 2)} y={bottom + 44} textAnchor="middle">
              Hand at fret {handPosition}
            </text>
          </g>
        )
      })()}

      {Array.from({ length: frets }, (_, i) => i + 1).map((f) => (
        <rect key={f} className="fb-fret" x={X(fretX(f)) - 2} y={neckTop} width="4" height={neckH} fill={ref('fret')} filter={ref('shadow')} />
      ))}
      <rect className="fb-nut" x={X(NUT_X) - (options.leftHanded ? 0 : NUT_W)} y={neckTop - 2} width={NUT_W} height={neckH + 4} rx="2" fill={ref('nut')} />

      {tuning.map((midi, i) => {
        const s = i + 1
        const active = sounding.has(s)
        const target = highlightStrings.includes(s)
        const wound = s > stringCount / 2
        const w = 1.3 + (s - 1) * 0.5
        const x1 = OPEN_X - 18
        const x2 = showPickZone ? NECK_END + 18 + PICK_W : NECK_END
        const y = Y(s)
        return (
          <g key={s} className={`fb-string-g${active ? ' fb-string-active' : ''}${target ? ' fb-string-target' : ''}`}>
            {(active || target) && (
              <rect className="fb-string-glow" x={boxX(x1, x2)} y={y - 5} width={x2 - x1} height="10" rx="5" filter={ref('glow')} />
            )}
            <rect className="fb-string-shadow" x={boxX(x1, x2)} y={y - w / 2 + 1.5} width={x2 - x1} height={w} />
            <rect
              className={`fb-string ${wound ? 'fb-string-wound' : 'fb-string-plain'}`}
              x={boxX(x1, x2)}
              y={y - w / 2}
              width={x2 - x1}
              height={w}
              fill={wound ? ref('wound') : undefined}
            />
            <g className="fb-stringname">
              <rect x={X(CHIP_X) - 13} y={y - 11} width="26" height="22" rx="11" />
              <text x={X(CHIP_X)} y={y + 5} textAnchor="middle">
                {pitchClassName(midi + capo)}
              </text>
            </g>
          </g>
        )
      })}

      {capo > 0 && (
        <g className="fb-capo">
          <rect x={X(fretX(capo) - 10) - (options.leftHanded ? 12 : 0)} y={neckTop - 6} width="12" height={neckH + 12} rx="5" />
          <text x={X(fretX(capo) - 4)} y={bottom + 44} textAnchor="middle">
            capo {capo}
          </text>
        </g>
      )}

      {showPickZone && <g className="fb-pickzone">
        <rect x={boxX(NECK_END + 18, NECK_END + 18 + PICK_W)} y={neckTop - 4} width={PICK_W} height={neckH + 8} rx="14" />
        <text className="fb-pickzone-label" x={X(pickX)} y={bottom + 44} textAnchor="middle">
          picking hand
        </text>
      </g>}

      {onFretClick && (
        <g className="fb-taps">
          {tuning.map((_, i) =>
            Array.from({ length: frets + 1 }, (_, f) => {
              const x1 = f === 0 ? OPEN_X - 18 : fretX(f - 1)
              const x2 = f === 0 ? NUT_X : fretX(f)
              return (
                <rect
                  key={`${i}-${f}`}
                  className="fb-tap"
                  x={boxX(x1, x2)}
                  y={Y(i + 1) - STRING_GAP / 2}
                  width={x2 - x1}
                  height={STRING_GAP}
                  onClick={() => tapFret(i + 1, f)}
                >
                  <title>{`${noteName(tuning[i] + f)}: tap to hear`}</title>
                </rect>
              )
            }),
          )}
        </g>
      )}

      {tapped && (
        <g key={tapped.id} className="fb-tapped">
          <circle cx={X(tapped.fret === 0 ? OPEN_X : (fretX(tapped.fret - 1) + fretX(tapped.fret)) / 2)} cy={Y(tapped.string)} r={NOTE_R} />
          <NoteText x={X(tapped.fret === 0 ? OPEN_X : (fretX(tapped.fret - 1) + fretX(tapped.fret)) / 2)} y={Y(tapped.string)} midi={tapped.midi} size="big" />
        </g>
      )}

      {notes
        .filter((n) => !n.isTieContinuation && !n.isHeld && !n.isDead)
        .map((n) => {
          const x2 = NECK_END + 8
          return (
            <path
              key={`v-${n.key}`}
              className="fb-vibrate"
              d={wave(X(n.tabFret === 0 ? NUT_X : noteX(n)), X(x2), Y(n.string))}
            />
          )
        })}

      {names.length > 0 && (
        <g className="fb-names" aria-hidden="true">
          {names.map((n) => (
            <g key={`n-${n.key}`} className={n.fret === 0 ? 'fb-name fb-name-open' : 'fb-name'}>
              <circle cx={X(noteX(n))} cy={Y(n.string)} r="13" />
              <NoteText x={X(noteX(n))} y={Y(n.string)} midi={n.midi} size="small" />
            </g>
          ))}
        </g>
      )}

      {shape.map((n) => (
        <g key={`s-${n.key}`} className={`fb-shape fb-finger-${n.lh ?? 'x'}`} onClick={click(n)} role="button" aria-label={`${noteName(n.midi)} later in this bar, edit fingering`}>
          <circle cx={X(noteX(n))} cy={Y(n.string)} r="14" />
          {options.labelMode === 'note' ? (
            <NoteText x={X(noteX(n))} y={Y(n.string)} midi={n.midi} size="small" />
          ) : (
            <text x={X(noteX(n))} y={Y(n.string) + 5} textAnchor="middle">
              {n.lh !== null ? fretFingerLabel(n.lh) : ''}
            </text>
          )}
        </g>
      ))}

      {options.showGhosts &&
        ghosts.map((n) => (
          <circle key={`g-${n.key}`} className="fb-ghost" cx={X(noteX(n))} cy={Y(n.string)} r={NOTE_R + 3} />
        ))}

      {marks.map((m) => {
        const fake = { tabFret: m.fret - capo, fret: m.fret } as FretNote
        return (
          <circle
            key={m.key}
            className={`fb-mark fb-mark-${m.result}${m.fade ? ' fb-mark-fade' : ''}`}
            cx={X(noteX(fake))}
            cy={Y(m.string)}
            r="23"
          />
        )
      })}

      {notes.map((n) => {
        const x = X(noteX(n))
        const y = Y(n.string)
        const open = n.tabFret === 0
        const held = n.isTieContinuation || n.isHeld
        const label = n.isDead
          ? '×'
          : options.labelMode === 'note'
            ? pitchClassName(n.midi)
            : open
              ? '0'
              : n.lh !== null
                ? fretFingerLabel(n.lh)
                : ''
        const cls = [
          'fb-note',
          open ? 'fb-note-open' : `fb-finger-${n.lh ?? 'x'}`,
          n.lhInferred ? 'fb-suggested' : '',
          held ? 'fb-held' : '',
        ].join(' ')
        const r = open ? NOTE_R - 3 : NOTE_R
        return (
          <g key={n.key} className={cls} onClick={click(n)} role="button" aria-label={`${noteName(n.midi)}, edit fingering`}>
            {!held && !open && <circle className="fb-note-halo" cx={x} cy={y} r={r + 9} filter={ref('glow')} />}
            {!held && <circle className="fb-note-ripple" cx={x} cy={y} r={r} />}
            <circle className="fb-note-body" cx={x} cy={y} r={r} filter={ref('shadow')} />
            {!open && <circle className="fb-note-shine" cx={x} cy={y - 6} r={r * 0.6} />}
            {options.labelMode === 'note' && !n.isDead ? (
              <NoteText x={x} y={y} midi={n.midi} size="big" />
            ) : (
              <text x={x} y={y + 6} textAnchor="middle">
                {label}
              </text>
            )}
          </g>
        )
      })}

      {showPickZone && notes
        .filter((n) => !n.isTieContinuation && !n.isHeld)
        .map((n) => {
          const y = Y(n.string)
          return (
            <g
              key={`p-${n.key}`}
              className={`fb-pick fb-pick-${n.rh ?? 'none'}${n.rhInferred ? ' fb-suggested' : ''}`}
              onClick={click(n)}
              role="button"
              aria-label={`Picking finger ${n.rh ?? 'not set'}, edit`}
            >
              <circle cx={X(pickX - 18)} cy={y} r="15" />
              <text x={X(pickX - 18)} y={y + 5} textAnchor="middle">
                {n.rh ?? '?'}
              </text>
              <text className="fb-pick-note" x={X(pickX + 2)} y={y + 5} textAnchor={anchor('start')}>
                {noteName(n.midi)}
                <tspan className="fb-solfa-inline"> {solfegeName(n.midi)}</tspan>
              </text>
            </g>
          )
        })}
    </svg>
  )
}
