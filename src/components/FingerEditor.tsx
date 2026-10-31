import { useEffect, useRef } from 'react'
import { fretFingerLabel } from '../music/fingering'
import { noteName } from '../music/notes'
import { PICK_FINGERS, type FingeringOverride, type FretFinger, type FretNote } from '../music/types'

interface Props {
  note: FretNote
  anchor: { x: number; y: number }
  onChange: (override: FingeringOverride | null) => void
  onClose: () => void
}

const FRET_FINGERS: FretFinger[] = [1, 2, 3, 4, 0]

/** Small popover to set the fretting and picking finger for one note. */
export function FingerEditor({ note, anchor, onChange, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const left = Math.min(anchor.x, window.innerWidth - 260)
  return (
    <div ref={ref} className="finger-editor" style={{ left, top: anchor.y + 16 }} role="dialog" aria-label="Edit fingering">
      <div className="finger-editor-title">
        {noteName(note.midi)} · string {note.string}, fret {note.tabFret}
      </div>
      {note.tabFret > 0 && (
        <div className="finger-editor-row">
          <span>Fretting</span>
          {FRET_FINGERS.map((f) => (
            <button key={f} className={note.lh === f ? 'chip active' : 'chip'} onClick={() => onChange({ lh: f })}>
              {fretFingerLabel(f)}
            </button>
          ))}
        </div>
      )}
      <div className="finger-editor-row">
        <span>Picking</span>
        {PICK_FINGERS.map((f) => (
          <button key={f} className={note.rh === f ? 'chip active' : 'chip'} onClick={() => onChange({ rh: f })}>
            {f}
          </button>
        ))}
      </div>
      <div className="finger-editor-foot">
        <button className="link" onClick={() => onChange(null)}>
          Reset to file or suggestion
        </button>
      </div>
    </div>
  )
}
