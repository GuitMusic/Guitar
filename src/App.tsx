import { useEffect, useState } from 'react'
import { Library } from './components/Library'
import { Practice } from './components/Practice'
import type { OpenSong } from './library/songs'
import { setView, useFretboardView } from './components/fretboardView'
import { Metronome } from './tools/Metronome'
import { Tuner } from './tools/Tuner'
import { NoteQuiz } from './quiz/NoteQuiz'
import { Icon, Menu } from './components/PlayerBar'
import { setTheme, useTheme } from './components/theme'
import { Progress } from './progress/Progress'

type Page = 'library' | 'practice' | 'quiz' | 'progress' | 'tuner' | 'metronome'

// Simple line icons, shown in the bottom tab bar on phones
const ICONS: Record<Page, string> = {
  library: 'M4 4h4v16H4zM10 4h4v16h-4zM16.5 4.5l3.5 1-4 15-3.5-1',
  practice: 'M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM19 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  quiz: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.5v1',
  progress: 'M4 20h16M6 16v-4M11 16V8M16 16v-6M21 16V5',
  tuner: 'M4 16a8 8 0 0 1 16 0M12 16l4-6',
  metronome: 'M9 3h6l4 18H5zM12 17l5-9M8 14h8',
}

export default function App() {
  const [page, setPage] = useState<Page>('library')
  const [song, setSong] = useState<OpenSong | null>(null)
  const { leftHanded } = useFretboardView()
  const { theme } = useTheme()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  const nav = (p: Page, label: string, disabled = false) => (
    <button className={page === p ? 'nav-item active' : 'nav-item'} disabled={disabled} onClick={() => setPage(p)} aria-current={page === p ? 'page' : undefined}>
      <svg className="nav-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d={ICONS[p]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{label}</span>
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
          <span className="brand-name">Fingerstyle Trainer</span>
        </div>
        <nav className="main-nav" aria-label="Pages">
          {nav('library', 'Library')}
          {nav('practice', 'Practice', !song)}
          {nav('quiz', 'Note finder')}
          {nav('progress', 'Progress')}
          {nav('tuner', 'Tuner')}
          {nav('metronome', 'Metronome')}
        </nav>
        <Menu
          label="Settings"
          down
          trigger={
            <>
              <Icon name="settings" size={20} />
              <span className="settings-hand">{leftHanded ? 'Left' : 'Right'}</span>
            </>
          }
        >
          <div className="settings-row">
            <span className="settings-label">Fretboard</span>
            <div className="segmented" role="radiogroup" aria-label="Fretboard for">
              <button role="radio" aria-checked={leftHanded} className={leftHanded ? 'active' : ''} onClick={() => setView({ leftHanded: true })}>
                Left-handed
              </button>
              <button role="radio" aria-checked={!leftHanded} className={!leftHanded ? 'active' : ''} onClick={() => setView({ leftHanded: false })}>
                Right-handed
              </button>
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-label">Theme</span>
            <div className="segmented" role="radiogroup" aria-label="Theme">
              {(
                [
                  ['dark', 'Dark'],
                  ['light', 'Light'],
                  ['system', 'Match device'],
                ] as const
              ).map(([t, label]) => (
                <button key={t} role="radio" aria-checked={theme === t} className={theme === t ? 'active' : ''} onClick={() => setTheme(t)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Menu>
      </header>
      <main className={page === 'practice' ? 'on-practice' : ''}>
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
        {page === 'progress' && (
          <Progress
            onOpen={(s) => {
              setSong(s)
              setPage('practice')
            }}
          />
        )}
        {page === 'tuner' && <Tuner />}
        {page === 'metronome' && <Metronome />}
      </main>
    </div>
  )
}
