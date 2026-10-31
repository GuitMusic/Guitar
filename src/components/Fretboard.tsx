import { useMemo } from 'react'
import { fretFingerLabel } from '../music/fingering'
import { noteName, pitchClassName } from '../music/notes'
import type { FretNote } from '../music/types'

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
}

export interface FretMark {
  key: string
  string: number
  fret: number
  result: 'hit' | 'late' | 'miss' | 'waiting'
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
  /** Strings to highlight, e.g. the string a quiz question asks about. */
  highlightStrings?: number[]
  /** Fixed number of frets to draw instead of fitting the notes. */
  maxFret?: number
  showPickZone?: boolean
  /** Rings that show whether notes were played right. */
  marks?: FretMark[]
}

const W = 1000
const NUT_X = 64
const PICK_W = 128
const NECK_END = W - PICK_W - 16
const TOP = 40
const STRING_GAP = 34

/** Distance from the nut using real guitar fret spacing, scaled to fit the visible frets. */
function makeFretX(frets: number) {
  const scale = (NECK_END - NUT_X) / (1 - Math.pow(2, -frets / 12))
  return (n: number) => NUT_X + scale * (1 - Math.pow(2, -n / 12))
}

const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21]

export function Fretboard({ notes, ghosts, tuning, capo, options, onNoteClick, highlightStrings = [], maxFret, showPickZone = true, marks = [] }: Props) {
  const stringCount = tuning.length
  const maxNoteFret = Math.max(0, ...notes.map((n) => n.fret), ...ghosts.map((n) => n.fret))
  const frets = maxFret ?? (maxNoteFret > 15 ? Math.min(24, maxNoteFret + 2) : capo > 7 ? 17 : 15)
  const fretX = useMemo(() => makeFretX(frets), [frets])
  const H = TOP + (stringCount - 1) * STRING_GAP + 52
  const bottom = TOP + (stringCount - 1) * STRING_GAP

  const X = (x: number) => (options.leftHanded ? W - x : x)
  const Y = (string: number) =>
    TOP + (options.stringOrder === 'tab' ? string - 1 : stringCount - string) * STRING_GAP
  const anchor = (end: 'start' | 'end') =>
    options.leftHanded ? (end === 'start' ? 'end' : 'start') : end
  const noteX = (n: FretNote) =>
    n.fret === 0 ? NUT_X - 22 : n.tabFret === 0 && capo > 0 ? fretX(capo) - 26 : (fretX(n.fret - 1) + fretX(n.fret)) / 2

  const sounding = new Set(notes.filter((n) => !n.isTieContinuation && !n.isHeld).map((n) => n.string))
  const pickX = NECK_END + 16 + PICK_W / 2

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
      <rect className="fb-wood" x={X(options.leftHanded ? NECK_END : NUT_X)} y={TOP - 14} width={NECK_END - NUT_X} height={bottom - TOP + 28} rx="4" />

      {SINGLE_INLAYS.filter((f) => f <= frets).map((f) => (
        <circle key={f} className="fb-inlay" cx={X((fretX(f - 1) + fretX(f)) / 2)} cy={(TOP + bottom) / 2} r="7" />
      ))}
      {frets >= 12 && (
        <g className="fb-inlay">
          <circle cx={X((fretX(11) + fretX(12)) / 2)} cy={TOP + STRING_GAP * 1.5} r="7" />
          <circle cx={X((fretX(11) + fretX(12)) / 2)} cy={bottom - STRING_GAP * 1.5} r="7" />
        </g>
      )}

      <line className="fb-nut" x1={X(NUT_X)} x2={X(NUT_X)} y1={TOP - 14} y2={bottom + 14} />
      {Array.from({ length: frets }, (_, i) => i + 1).map((f) => (
        <g key={f}>
          <line className="fb-fret" x1={X(fretX(f))} x2={X(fretX(f))} y1={TOP - 14} y2={bottom + 14} />
          {[1, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(f) && (
            <text className="fb-fretnum" x={X((fretX(f - 1) + fretX(f)) / 2)} y={bottom + 36} textAnchor="middle">
              {f}
            </text>
          )}
        </g>
      ))}

      {tuning.map((midi, i) => {
        const s = i + 1
        const active = sounding.has(s)
        return (
          <g key={s}>
            <line
              className={`fb-string${active ? ' fb-string-active' : ''}${highlightStrings.includes(s) ? ' fb-string-target' : ''}`}
              x1={X(NUT_X)}
              x2={X(showPickZone ? NECK_END + 16 + PICK_W : NECK_END)}
              y1={Y(s)}
              y2={Y(s)}
              strokeWidth={1 + (s - 1) * 0.45}
            />
            <text className="fb-stringname" x={X(14)} y={Y(s) + 5} textAnchor={anchor('start')}>
              {pitchClassName(midi + capo)}
            </text>
          </g>
        )
      })}

      {capo > 0 && (
        <g className="fb-capo">
          <rect x={X(fretX(capo) - 10) - (options.leftHanded ? 12 : 0)} y={TOP - 18} width="12" height={bottom - TOP + 36} rx="5" />
          <text x={X(fretX(capo) - 4)} y={TOP - 24} textAnchor="middle">
            capo {capo}
          </text>
        </g>
      )}

      {showPickZone && <g className="fb-pickzone">
        <rect x={X(NECK_END + 16) - (options.leftHanded ? PICK_W : 0)} y={TOP - 14} width={PICK_W} height={bottom - TOP + 28} rx="10" />
        <text className="fb-pickzone-label" x={X(pickX)} y={bottom + 36} textAnchor="middle">
          picking hand
        </text>
      </g>}

      {options.showGhosts &&
        ghosts.map((n) => (
          <circle key={`g-${n.key}`} className="fb-ghost" cx={X(noteX(n))} cy={Y(n.string)} r="13" />
        ))}

      {marks.map((m) => {
        const fake = { tabFret: m.fret - capo, fret: m.fret } as FretNote
        return (
          <circle
            key={m.key}
            className={`fb-mark fb-mark-${m.result}${m.fade ? ' fb-mark-fade' : ''}`}
            cx={X(noteX(fake))}
            cy={Y(m.string)}
            r="20"
          />
        )
      })}

      {notes.map((n) => {
        const x = X(noteX(n))
        const y = Y(n.string)
        const open = n.tabFret === 0
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
          n.isTieContinuation || n.isHeld ? 'fb-held' : '',
        ].join(' ')
        return (
          <g key={n.key} className={cls} onClick={click(n)} role="button" aria-label={`${noteName(n.midi)}, edit fingering`}>
            <circle cx={x} cy={y} r="14" />
            <text x={x} y={y + 5} textAnchor="middle">
              {label}
            </text>
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
              <circle cx={X(pickX - 26)} cy={y} r="13" />
              <text x={X(pickX - 26)} y={y + 5} textAnchor="middle">
                {n.rh ?? '?'}
              </text>
              <text className="fb-pick-note" x={X(pickX + 2)} y={y + 5} textAnchor={anchor('start')}>
                {noteName(n.midi)}
              </text>
            </g>
          )
        })}
    </svg>
  )
}
