import { playTone } from '../audio/pitch'
import { noteName, STANDARD_TUNING, TUNINGS } from '../music/notes'
import { retuneSteps } from './guide'

const name = (m: number) => noteName(m).replace(/\d/, '')

/**
 * Shown above a song that is not in standard tuning: which strings to retune, by how
 * much, and a reference tone for each, so nobody plays a DADGAD piece in standard.
 */
export function RetuneHint({ tuning }: { tuning: number[] }) {
  if (tuning.length !== 6 || tuning.every((m, i) => m === STANDARD_TUNING[i])) return null
  const steps = retuneSteps(tuning).filter((s) => s.semitones !== 0)
  const known = TUNINGS.find((t) => t.strings.every((m, i) => m === tuning[i]))
  const label = known ? known.name.replace(/ \(.*\)$/, '') : 'a different tuning'
  return (
    <div className="retune-hint" role="note">
      <span className="retune-hint-text">
        <b>
          In {label} ({[...tuning].reverse().map(name).join(' ')})
        </b>
        . Retune from standard:{' '}
        {steps.map((s, i) => (
          <span key={s.string}>
            {i > 0 && ', '}
            string {s.string} {name(s.from)}→{name(s.to)}
          </span>
        ))}
        . Tap a note to hear it.
      </span>
      <span className="retune-hint-notes">
        {steps.map((s) => (
          <button key={s.string} className="chip" onClick={() => playTone(s.to, 2)}>
            {s.string}: {noteName(s.to)}
          </button>
        ))}
      </span>
    </div>
  )
}
