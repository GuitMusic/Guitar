import { useState } from 'react'
import { Library } from './components/Library'
import { Practice } from './components/Practice'
import type { OpenSong } from './library/songs'
import { setView, useFretboardView } from './components/fretboardView'
import { Metronome } from './tools/Metronome'
import { Tuner } from './tools/Tuner'
import { NoteQuiz } from './quiz/NoteQuiz'

type Page = 'library' | 'practice' | 'quiz' | 'tuner' | 'metronome'

export default function App() {
  const [page, setPage] = useState<Page>('library')
  const [song, setSong] = useState<OpenSong | null>(null)
  const { leftHanded } = useFretboardView()

  const nav = (p: Page, label: string, disabled = false) => (
    <button className={page === p ? 'nav-item active' : 'nav-item'} disabled={disabled} onClick={() => setPage(p)} aria-current={page === p ? 'page' : undefined}>
      {label}
    </button>
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3.5" fill="currentColor" />
          </svg>
          Fingerstyle Trainer
        </div>
        <nav>
          {nav('library', 'Library')}
          {nav('practice', 'Practice', !song)}
          {nav('quiz', 'Note finder')}
          {nav('tuner', 'Tuner')}
          {nav('metronome', 'Metronome')}
          <button
            className={leftHanded ? 'nav-item hand-toggle active' : 'nav-item hand-toggle'}
            onClick={() => setView({ leftHanded: !leftHanded })}
            aria-pressed={leftHanded}
            title="Switch between left-handed and right-handed fretboards"
          >
            {leftHanded ? 'Left-handed' : 'Right-handed'}
          </button>
        </nav>
      </header>
      <main>
        {page === 'library' && (
          <Library
            onOpen={(s) => {
              setSong(s)
              setPage('practice')
            }}
          />
        )}
        {song && <div hidden={page !== 'practice'}><Practice key={song.id} song={song} /></div>}
        {page === 'quiz' && <NoteQuiz />}
        {page === 'tuner' && <Tuner />}
        {page === 'metronome' && <Metronome />}
      </main>
    </div>
  )
}
