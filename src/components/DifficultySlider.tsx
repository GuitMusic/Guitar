/** Easy, Medium or Hard, as an index into a list of three. */
export type Difficulty = 0 | 1 | 2

export const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Hard'] as const

export const asDifficulty = (v: unknown, fallback: Difficulty = 1): Difficulty => (v === 0 || v === 1 || v === 2 ? v : fallback)

export function loadDifficulty(key: string, fallback: Difficulty = 1): Difficulty {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : asDifficulty(Number(raw), fallback)
  } catch {
    return fallback
  }
}

export function saveDifficulty(key: string, d: Difficulty): void {
  try {
    localStorage.setItem(key, String(d))
  } catch {
    // storage unavailable: the choice only lasts this visit
  }
}

/**
 * A three-stop slider for how hard a game or drill is, with a line saying what changes.
 * `value` null means the settings were changed by hand and match no stop.
 */
export function DifficultySlider({
  value,
  onChange,
  detail,
  disabled = false,
  label = 'Difficulty',
}: {
  value: Difficulty | null
  onChange: (d: Difficulty) => void
  detail: string
  disabled?: boolean
  label?: string
}) {
  const v = value ?? 1
  return (
    <div className={`difficulty${value === null ? ' custom' : ''}`} data-level={value ?? 'custom'}>
      <div className="difficulty-head">
        <span className="field-label">{label}</span>
        <strong className="difficulty-now">{value === null ? 'Custom' : DIFFICULTY_LABELS[value]}</strong>
      </div>
      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={v}
        disabled={disabled}
        aria-label={label}
        aria-valuetext={value === null ? 'Custom' : DIFFICULTY_LABELS[value]}
        style={{ ['--fill' as string]: `${v * 50}%` }}
        onChange={(e) => onChange(asDifficulty(Number(e.target.value)))}
      />
      <div className="difficulty-stops">
        {DIFFICULTY_LABELS.map((l, i) => (
          <button key={l} type="button" className={value === i ? 'active' : ''} disabled={disabled} onClick={() => onChange(i as Difficulty)}>
            {l}
          </button>
        ))}
      </div>
      <p className="difficulty-detail">{detail}</p>
    </div>
  )
}
