import { useState } from 'react'
import { RhythmTrainer } from '../rhythm/RhythmTrainer'
import { VocalTrainer } from '../quiz/VocalTrainer'
import { Metronome } from './Metronome'
import { Tuner } from './Tuner'

export type ToolsTab = 'tools' | 'rhythm' | 'sing'
const TABS: { id: ToolsTab; label: string; short: string }[] = [
  { id: 'tools', label: 'Tuner & metronome', short: 'Tuner' },
  { id: 'rhythm', label: 'Learn the metronome', short: 'Timing' },
  { id: 'sing', label: 'Sing', short: 'Sing' },
]

function loadTab(): ToolsTab {
  try {
    const t = localStorage.getItem('tools-tab')
    return TABS.some((x) => x.id === t) ? (t as ToolsTab) : 'tools'
  } catch {
    return 'tools'
  }
}

/** Tuner and metronome, lessons on playing in time, and voice training. */
export function ToolsPage() {
  const [tab, setTabState] = useState<ToolsTab>(loadTab)
  const setTab = (t: ToolsTab) => {
    setTabState(t)
    try {
      localStorage.setItem('tools-tab', t)
    } catch {
      // storage unavailable
    }
  }
  return (
    <>
      <div className="tools-tabs-wrap">
        <h1>Tools</h1>
        <div className="segmented quiz-tabs tools-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              <span className="tab-long">{t.label}</span>
              <span className="tab-short">{t.short}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={tab === 'tools' ? 'tools-page' : 'tools-page rhythm-page'}>
        {tab === 'tools' ? (
          <>
            <Tuner />
            <Metronome />
          </>
        ) : tab === 'rhythm' ? (
          <div>
            <h2 className="tools-sub">Play in time</h2>
            <RhythmTrainer />
          </div>
        ) : (
          <div>
            <h2 className="tools-sub">Sing in tune</h2>
            <VocalTrainer />
          </div>
        )}
      </div>
    </>
  )
}
