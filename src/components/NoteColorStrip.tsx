import { pitchClassName } from '../music/notes'
import { noteColorStyle, useNoteColors } from '../music/noteColors'

/**
 * The 12 note colours in a row, C to B, as a key. Sharps and flats sit lower
 * and a shade deeper, between the two notes they come between.
 */
export function NoteColorStrip({ compact = false }: { compact?: boolean }) {
  const on = useNoteColors()
  if (!on) return null
  return (
    <div className={compact ? 'nc-strip compact' : 'nc-strip'} aria-label="Note colours, C to B">
      {Array.from({ length: 12 }, (_, pc) => {
        const accidental = [1, 3, 6, 8, 10].includes(pc)
        return (
          <span key={pc} className={accidental ? 'nc-swatch sharp' : 'nc-swatch'} style={noteColorStyle(pc)}>
            {pitchClassName(pc)}
          </span>
        )
      })}
    </div>
  )
}

/** A small dot in a note's colour, to sit beside its name. Nothing when note colours are off. */
export function NoteSwatch({ midi }: { midi: number }) {
  const on = useNoteColors()
  if (!on) return null
  return <span className="nc-dot" style={noteColorStyle(midi)} aria-hidden="true" />
}
