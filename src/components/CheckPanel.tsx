import { accuracy } from '../check/noteCheck'
import type { CheckMode, JudgedNote, WaitState } from '../check/usePracticeCheck'
import { noteName } from '../music/notes'

interface Props {
  mode: CheckMode
  onModeChange: (m: CheckMode) => void
  muteSong: boolean
  onMuteSongChange: (v: boolean) => void
  listening: boolean
  error: string | null
  judged: JudgedNote[]
  waiting: WaitState | null
  onSkip: () => void
  onClear: () => void
  barCount: number
  onBarClick: (bar: number) => void
  trainer: { on: boolean; target: number; passes: number; message: string | null }
  onStartTrainer: () => void
  onStopTrainer: () => void
  onTargetChange: (t: number) => void
  speed: number
}

const MODES: { id: CheckMode; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'play-along', label: 'Check me' },
  { id: 'wait', label: 'Wait for me' },
]

const RESULT_LABEL = { hit: 'on time', late: 'late', miss: 'missed' } as const

function barClass(acc: number | null): string {
  if (acc === null) return 'bar-cell'
  if (acc >= 0.9) return 'bar-cell good'
  if (acc >= 0.6) return 'bar-cell ok'
  return 'bar-cell bad'
}

/** What sits in the player bar's Listen menu: the listening mode and the speed trainer's start. */
export function ListenMenu(p: Props) {
  return (
    <div className="listen-menu">
      <div className="segmented" role="radiogroup" aria-label="Listening mode">
        {MODES.map((m) => (
          <button key={m.id} role="radio" aria-checked={p.mode === m.id} className={p.mode === m.id ? 'active' : ''} onClick={() => p.onModeChange(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="hint">
        Check me marks every note you play as on time, late or missed. Wait for me pauses on each note until you play it. Both use the
        microphone and turn on the metronome.
      </p>
      {p.mode !== 'off' && (
        <label className="check">
          <input type="checkbox" checked={p.muteSong} onChange={(e) => p.onMuteSongChange(e.target.checked)} /> Mute the song (untick if you
          use headphones)
        </label>
      )}
      <div className="listen-menu-trainer">
        <span className="check-title">Speed trainer</span>
        {p.trainer.on ? (
          <button className="chip" onClick={p.onStopTrainer}>
            Stop trainer
          </button>
        ) : (
          <>
            <label className="field-inline">
              Target
              <select value={p.trainer.target} onChange={(e) => p.onTargetChange(Number(e.target.value))}>
                {[0.8, 0.9, 1, 1.1, 1.2].map((t) => (
                  <option key={t} value={t}>
                    {Math.round(t * 100)}%
                  </option>
                ))}
              </select>
            </label>
            <button className="chip" onClick={p.onStartTrainer}>
              Start at 60%
            </button>
          </>
        )}
      </div>
      <p className="hint">Loops the bars you chose and adds 5% after each pass. With Check me on, only after passes with 90% of notes right.</p>
    </div>
  )
}

/** Results while listening (Check me, Wait for me) and the speed trainer's progress. Hidden when nothing is on. */
export function CheckPanel(p: Props) {
  const byBar = new Map<number, JudgedNote[]>()
  for (const j of p.judged) byBar.set(j.barIndex, [...(byBar.get(j.barIndex) ?? []), j])
  const all = p.judged.map((j) => j.result)
  const overall = all.length ? Math.round(accuracy(all) * 100) : null
  const recent = p.judged.slice(-8).reverse()

  if (p.mode === 'off' && !p.trainer.on && !p.error) return null
  return (
    <section className="check-panel" aria-label="Listen while I play">
      {p.mode !== 'off' && (
        <div className="check-row">
          <span className="check-title">{p.mode === 'wait' ? 'Wait for me' : 'Check me'}</span>
          <button className="link" onClick={() => p.onModeChange('off')}>
            Stop listening
          </button>
        </div>
      )}
      {p.error && <div className="error">{p.error}</div>}
      {p.mode !== 'off' && !p.listening && !p.error && <p className="hint">Starting the microphone…</p>}

      {p.mode === 'wait' && p.listening && (
        <div className="wait-box" role="status">
          {p.waiting ? (
            <>
              <span>
                Play{' '}
                {p.waiting.notes.map((n, i) => (
                  <strong key={i} className={p.waiting!.played.includes(n.midi) ? 'played' : ''}>
                    {noteName(n.midi)} (string {n.string}){i < p.waiting!.notes.length - 1 ? ' + ' : ''}
                  </strong>
                ))}
              </span>
              <button className="chip" onClick={p.onSkip}>
                Skip
              </button>
            </>
          ) : (
            <span className="hint">Press Play. The song stops on each note until you play it.</span>
          )}
        </div>
      )}

      {p.mode === 'play-along' && p.listening && (
        <>
          <div className="check-row">
            <span className="check-score">{overall === null ? 'Press Play and play along' : `${overall}% of notes right`}</span>
            <div className="recent" aria-label="Last notes">
              {recent.map((j) => (
                <span key={`${j.key}-${j.at}`} className={`recent-note ${j.result}`} title={RESULT_LABEL[j.result]}>
                  {noteName(j.midi)}
                </span>
              ))}
            </div>
            {p.judged.length > 0 && (
              <button className="link" onClick={p.onClear}>
                Clear
              </button>
            )}
          </div>
          {p.barCount > 0 && (
            <div className="bar-strip" aria-label="Accuracy per bar. Click a bar to loop it.">
              {Array.from({ length: p.barCount }, (_, i) => {
                const notes = byBar.get(i)
                const acc = notes ? accuracy(notes.map((n) => n.result)) : null
                return (
                  <button
                    key={i}
                    className={barClass(acc)}
                    title={acc === null ? `Bar ${i + 1}: not played yet` : `Bar ${i + 1}: ${Math.round(acc * 100)}% right. Click to loop it.`}
                    onClick={() => p.onBarClick(i + 1)}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {p.trainer.on && (
        <div className="check-row trainer">
          <span className="check-title">Speed trainer</span>
          <span>
            {Math.round(p.speed * 100)}% now, target {Math.round(p.trainer.target * 100)}%
          </span>
          <button className="chip" onClick={p.onStopTrainer}>
            Stop trainer
          </button>
          {p.trainer.message && <span className="hint">{p.trainer.message}</span>}
        </div>
      )}
    </section>
  )
}
