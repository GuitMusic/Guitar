import { pitchClassName, solfegeName } from '../music/notes'

/** Small pieces of the Note finder page: saved settings, star rows and the prompt text. */

/** The question, with the do-ré-mi name in small type right after the note name. */
export function PromptText({ text, midi }: { text: string; midi: number | null }) {
  if (midi === null) return <>{text}</>
  const name = pitchClassName(midi)
  const m = new RegExp(`(^|\\s)${name.replace('#', '\\#')}(?=\\s|$)`).exec(text)
  if (!m) return <>{text}</>
  const end = m.index + m[0].length
  return (
    <>
      {text.slice(0, end)}
      <span className="solfa-inline">{solfegeName(midi)}</span>
      {text.slice(end)}
    </>
  )
}

export function Stars({ n, of = 3 }: { n: number; of?: number }) {
  return (
    <span className="stars" aria-label={`${n} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="16" height="16" className={i < n ? 'star on' : 'star'} aria-hidden="true">
          <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
        </svg>
      ))}
    </span>
  )
}

export function Flame() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 0 2 1 3 2 3 0-3-1.5-5 .5-9z" fill="currentColor" />
    </svg>
  )
}
