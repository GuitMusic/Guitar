import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Library } from './components/Library'
import type { OpenSong } from './library/songs'
import { setView, useFretboardView } from './components/fretboardView'
import { ToolsPage } from './tools/ToolsPage'
import { NoteQuiz } from './quiz/NoteQuiz'
import { TheoryPage } from './theory/TheoryPage'
import { BrandMark, Icon as LineIcon, type IconName } from './components/icons'
import { Icon, Menu } from './components/PlayerBar'
import { setTheme, useTheme } from './components/theme'
import { Progress } from './progress/Progress'
import { promptInstall, useInstall } from './components/install'
import { TuningsPage } from './tunings/TuningsPage'

// The score engine (alphaTab) is most of the app's code and only Practice needs it, so Home
// opens without it and the Practice code is fetched in the background once Home is up
const loadPractice = () => import('./components/Practice')
const Practice = lazy(() => loadPractice().then((m) => ({ default: m.Practice })))

type Page = 'library' | 'practice' | 'tunings' | 'quiz' | 'theory' | 'progress' | 'tools'

// Line icons for each page, shown in the bottom tab bar on phones
const ICONS: Record<Page, IconName> = {
  library: 'home',
  practice: 'guitar',
  tunings: 'headstock',
  quiz: 'fretboard',
  theory: 'triad',
  progress: 'progress',
  tools: 'metronome',
}

const PAGES: Page[] = ['library', 'practice', 'tunings', 'quiz', 'theory', 'progress', 'tools']
const pageFromState = (state: unknown): Page => {
  const p = (state as { page?: Page } | null)?.page
  return p && PAGES.includes(p) ? p : 'library'
}

export default function App() {
  const [page, setPageState] = useState<Page>('library')
  const pageRef = useRef<Page>('library')
  // The phone's back gesture (and the browser's Back button) always leads to Home: every other
  // page sits one history entry above Home, so going from one to another replaces that entry
  const setPage = useCallback((next: Page) => {
    const current = pageRef.current
    if (next === current) return
    if (next === 'library') {
      // Going Home the same way the back gesture does keeps the history one entry deep
      if (pageFromState(history.state) !== 'library') history.back()
    } else if (current === 'library') history.pushState({ page: next }, '')
    else history.replaceState({ page: next }, '')
    pageRef.current = next
    setPageState(next)
  }, [])
  useEffect(() => {
    // After a reload no song is open, so the app starts from Home
    history.replaceState({ page: 'library' }, '')
    const onPop = (e: PopStateEvent) => {
      pageRef.current = pageFromState(e.state)
      setPageState(pageRef.current)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const [song, setSong] = useState<OpenSong | null>(null)
  useEffect(() => {
    const preload = () => void loadPractice().catch(() => {})
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number }
    if (w.requestIdleCallback) w.requestIdleCallback(preload)
    else window.setTimeout(preload, 1500)
  }, [])
  const { leftHanded } = useFretboardView()
  const { theme } = useTheme()
  const install = useInstall()
  // Coming back Home lands where the song list was left; other pages open at the top
  const homeScroll = useRef(0)
  const shownPage = useRef<Page>('library')
  useEffect(() => {
    if (shownPage.current === 'library' && page !== 'library') homeScroll.current = window.scrollY
    shownPage.current = page
    window.scrollTo(0, page === 'library' ? homeScroll.current : 0)
  }, [page])

  const nav = (p: Page, label: string, disabled = false) => (
    <button className={page === p ? 'nav-item active' : 'nav-item'} disabled={disabled} onClick={() => setPage(p)} aria-current={page === p ? 'page' : undefined}>
      <LineIcon name={ICONS[p]} className="nav-icon" />
      <span>{label}</span>
    </button>
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <BrandMark size={22} />
          </span>
          <span className="brand-name">
            Fingerstyle<span>Trainer</span>
          </span>
        </div>
        <nav className="main-nav" aria-label="Pages">
          {nav('library', 'Home')}
          {nav('practice', 'Practice', !song)}
          {nav('tunings', 'Tunings')}
          {nav('quiz', 'Note finder')}
          {nav('theory', 'Theory')}
          {nav('progress', 'Progress')}
          {nav('tools', 'Tools')}
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
          {install !== 'installed' && (
            <div className="settings-row">
              <span className="settings-label">Install on this device</span>
              {install === 'prompt' ? (
                <button className="primary" onClick={() => void promptInstall()}>
                  Install app
                </button>
              ) : install === 'ios' ? (
                <p className="install-hint">
                  In Safari, tap the Share button, then <b>Add to Home Screen</b>.
                </p>
              ) : (
                <p className="install-hint">
                  Open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.
                </p>
              )}
            </div>
          )}
        </Menu>
      </header>
      <main className={page === 'practice' ? 'on-practice' : ''}>
        {/* Home stays mounted, so search and filters are still set when you come back */}
        <div hidden={page !== 'library'}>
          <Library
            onOpen={(s) => {
              setSong(s)
              setPage('practice')
            }}
            onGo={setPage}
          />
        </div>
        {song && (
          <div hidden={page !== 'practice'}>
            <Suspense fallback={<div className="practice-loading">Loading the song…</div>}>
              <Practice key={song.id} song={song} active={page === 'practice'} />
            </Suspense>
          </div>
        )}
        {page === 'tunings' && (
          <TuningsPage
            onOpen={(s) => {
              setSong(s)
              setPage('practice')
            }}
            onGo={setPage}
          />
        )}
        {page === 'quiz' && <NoteQuiz />}
        {page === 'theory' && <TheoryPage />}
        {page === 'progress' && (
          <Progress
            onOpen={(s) => {
              setSong(s)
              setPage('practice')
            }}
          />
        )}
        {page === 'tools' && (
          <ToolsPage />
        )}
      </main>
    </div>
  )
}
