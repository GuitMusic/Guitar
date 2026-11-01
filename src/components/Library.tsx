import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { ACCEPTED_FILES, songFromAsciiTab, songFromFile } from '../import/importFile'
import { db } from '../library/db'
import { BUILT_IN_SONGS, toOpenSong, type OpenSong } from '../library/songs'
import { localDate, minutesByDay, needsRevisit, streak, summarize, type SongProgress } from '../progress/practiceLog'
import { findSong } from '../progress/Progress'

export type ShortcutPage = 'quiz' | 'tools' | 'progress'

interface Props {
  onOpen: (song: OpenSong) => void
  onGo: (page: ShortcutPage) => void
}

const EXAMPLE_TAB = `e|-------0-------|-------0-------|
B|-----1---1-----|-----3---3-----|
G|---0-------0---|---0-------0---|
D|---------------|---------------|
A|-3-------------|---------------|
E|---------------|-3-------------|`

const LEVELS = { 1: 'Beginner', 2: 'Easy', 3: 'Intermediate' } as const

/** The song to suggest when nothing has been played yet. */
const FIRST_SONG = 'song-ode-to-joy'

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Late night session'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Tempo and time signature, read from an alphaTex header. */
function songFacts(song: OpenSong): string[] {
  if (typeof song.data !== 'string') return []
  const tempo = /\\tempo\s+(\d+)/.exec(song.data)?.[1]
  const sigs = [...song.data.matchAll(/\\ts\s+(\d+)\s+(\d+)/g)].map((m) => `${m[1]}/${m[2]}`)
  // A pickup bar is written as 1/4 or 1/8, so skip those
  const ts = sigs.find((s) => !s.startsWith('1/')) ?? sigs[0]
  return [tempo && `${tempo} BPM`, ts].filter((x): x is string => !!x)
}

/**
 * Generated cover art: a slice of fretboard in the song's own colour, with a few glowing
 * finger dots. Every song gets a different, stable picture from its id.
 */
export function SongCover({ id, big = false, dots: showDots = true }: { id: string; big?: boolean; dots?: boolean }) {
  const h = hash(id)
  const hue = h % 360
  const hue2 = (hue + 40 + ((h >>> 9) % 60)) % 360
  const dots = Array.from({ length: 3 + ((h >>> 4) % 3) }, (_, i) => {
    const r = hash(`${id}:${i}`)
    return { x: (big ? 170 : 70) + (r % (big ? 120 : 190)), s: big ? 2 + ((r >>> 8) % 4) : (r >>> 8) % 6, f: (r >>> 16) % 4 }
  })
  const gid = `g-${id}`
  return (
    <svg className={big ? 'cover cover-big' : 'cover'} viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 70% 34%)`} />
          <stop offset="1" stopColor={`hsl(${hue2} 75% 14%)`} />
        </linearGradient>
        <radialGradient id={`${gid}-glow`} cx="0.75" cy="0.2" r="0.8">
          <stop offset="0" stopColor={`hsl(${hue} 90% 70% / 0.45)`} />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${gid})`} />
      <rect width="320" height="180" fill={`url(#${gid}-glow)`} />
      <g transform="rotate(-12 160 90)" opacity="0.9">
        {[0, 1, 2, 3, 4, 5].map((s) => (
          <line key={s} x1="-40" x2="360" y1={50 + s * 17} y2={50 + s * 17} stroke="rgba(255,255,255,0.45)" strokeWidth={0.6 + s * 0.35} />
        ))}
        {[40, 110, 172, 226, 274, 316].map((x) => (
          <line key={x} x1={x} x2={x} y1="40" y2="145" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
        ))}
        {showDots && dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={50 + d.s * 17} r="8" className={`cover-dot cover-dot-${d.f + 1}`} />
        ))}
      </g>
    </svg>
  )
}

function SongTile({ song, p, onOpen, onRemove }: { song: OpenSong; p?: SongProgress; onOpen: () => void; onRemove?: () => void }) {
  const facts = songFacts(song)
  const pct = p ? Math.min(100, Math.round(p.topSpeed * 100)) : 0
  return (
    <li className="tile">
      <button className="tile-main" onClick={onOpen}>
        <div className="tile-art">
          <SongCover id={song.id} />
          {song.level && <span className={`level level-${song.level}`}>{LEVELS[song.level]}</span>}
          <span className="tile-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          </span>
        </div>
        <strong className="tile-title">{song.title}</strong>
        <span className="tile-sub">{song.description ?? (song.format === 'tex' ? 'Text tab' : 'Imported score')}</span>
        <span className="tile-facts">
          {song.level && <span className={`tile-level level-${song.level}`}>{LEVELS[song.level]}</span>}
          {facts.map((f) => (
            <span key={f}>{f}</span>
          ))}
          {p && <span className="tile-played">{Math.max(1, Math.round(p.totalSeconds / 60))} min played</span>}
        </span>
        {p && (
          <span className="tile-meter" title={`Played up to ${pct}% speed`}>
            <i style={{ width: `${pct}%` }} />
          </span>
        )}
      </button>
      {onRemove && (
        <button className="tile-remove" aria-label={`Remove ${song.title}`} onClick={onRemove}>
          ×
        </button>
      )}
    </li>
  )
}

type Kind = 'all' | 'song' | 'study' | 'mine'
interface Filter {
  kind: Kind
  level: 0 | 1 | 2 | 3
}
const KINDS: { id: Kind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'song', label: 'Songs' },
  { id: 'study', label: 'Studies' },
  { id: 'mine', label: 'Imported' },
]
const FILTER_KEY = 'home-filter-v1'
function loadFilter(): Filter {
  try {
    const f = JSON.parse(localStorage.getItem(FILTER_KEY) ?? '') as Filter
    if (KINDS.some((k) => k.id === f.kind) && [0, 1, 2, 3].includes(f.level)) return f
  } catch {
    // No saved filter yet
  }
  return { kind: 'all', level: 0 }
}

const SHORTCUTS: { page: ShortcutPage; title: string; sub: string; icon: string; tone: string }[] = [
  { page: 'quiz', title: 'Note finder', sub: 'Learn the neck by ear', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.5v1', tone: 'violet' },
  { page: 'tools', title: 'Tune up', sub: 'Tuner and metronome', icon: 'M4 16a8 8 0 0 1 16 0M12 16l4-6', tone: 'teal' },
  { page: 'progress', title: 'Your progress', sub: 'Streak and minutes', icon: 'M4 20h16M6 16v-4M11 16V8M16 16v-6M21 16V5', tone: 'amber' },
]

/** The home screen: what to play next, quick tools, and every song. */
export function Library({ onOpen, onGo }: Props) {
  const songs = useLiveQuery(() => db.songs.orderBy('addedAt').reverse().toArray(), [])
  const practice = useLiveQuery(() => db.practice.toArray(), [])
  const progress = practice ? summarize(practice) : []
  const due = needsRevisit(progress).slice(0, 3)
  const bySong = new Map(progress.map((p) => [p.songId, p]))
  const last = progress[0]
  const days = practice ? streak(practice) : 0
  const week = practice ? minutesByDay(practice, 7, localDate()).reduce((a, d) => a + d.minutes, 0) : 0
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [pasteCapo, setPasteCapo] = useState('')
  const [pasteTempo, setPasteTempo] = useState('80')
  const [dragging, setDragging] = useState(false)
  const [query, setQuery] = useState('')
  const [{ kind: savedKind, level }, setFilterState] = useState<Filter>(loadFilter)
  const setFilter = (f: Filter) => {
    setFilterState(f)
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(f))
    } catch {
      // Private mode: the filter just isn't remembered
    }
  }
  const mine = (songs ?? []).map(toOpenSong)
  // A saved 'Imported' filter is meaningless once every import is removed
  const kind: Kind = savedKind === 'mine' && songs?.length === 0 ? 'all' : savedKind
  const all = [...mine, ...BUILT_IN_SONGS]
  const q = query.trim().toLowerCase()
  const shown = all
    .filter((s) => (kind === 'all' ? true : kind === 'mine' ? !s.builtIn : s.builtIn && s.kind === kind))
    .filter((s) => !level || s.level === level)
    .filter((s) => !q || `${s.title} ${s.description ?? ''}`.toLowerCase().includes(q))
    .sort((a, b) => (a.builtIn === b.builtIn ? (a.level ?? 0) - (b.level ?? 0) : a.builtIn ? 1 : -1))

  const importFiles = async (files: FileList | File[]) => {
    const added: string[] = []
    for (const file of Array.from(files)) {
      try {
        const song = await songFromFile(file)
        await db.songs.add(song)
        added.push(song.title)
      } catch (e) {
        setMessage({ kind: 'error', text: e instanceof Error ? e.message : String(e) })
        return
      }
    }
    if (added.length) setMessage({ kind: 'ok', text: `Added ${added.join(', ')}.` })
  }

  const importPaste = async () => {
    try {
      const song = songFromAsciiTab(pasteText, pasteTitle, pasteCapo.trim() ? Number(pasteCapo) : undefined, Number(pasteTempo) || 80)
      await db.songs.add(song)
      setPasteOpen(false)
      setPasteText('')
      setPasteTitle('')
      setMessage({ kind: 'ok', text: `Added ${song.title}. Text tabs have no rhythm, so note lengths are a guess from the spacing.` })
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : String(e) })
    }
  }

  const open = async (song: OpenSong) => {
    if (!song.builtIn) await db.songs.update(song.id, { lastOpenedAt: Date.now() })
    onOpen(song)
  }
  const openById = async (id: string) => {
    const s = await findSong(id)
    if (s) void open(s)
  }

  const featuredId = last?.songId ?? FIRST_SONG
  const featured = BUILT_IN_SONGS.find((s) => s.id === featuredId)
  const featuredTitle = last?.title ?? featured?.title ?? ''
  const featuredFacts = featured ? songFacts(featured) : []

  return (
    <div
      className={`home${dragging ? ' dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        void importFiles(e.dataTransfer.files)
      }}
    >
      <header className="home-head">
        <div>
          <p className="eyebrow">{greeting()}</p>
          <h1 className="display">{last ? 'Ready to play?' : 'Let’s learn your first song'}</h1>
        </div>
        <div className="stat-pills">
          <span className={`stat-pill${days > 0 ? ' hot' : ''}`} title="Days in a row with practice">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.8 1.2 2.8 2.3 3C10 9 11 5 12 2z" fill="currentColor" />
            </svg>
            {days} day{days === 1 ? '' : 's'}
          </span>
          <span className="stat-pill" title="Minutes played in the last 7 days">
            {week} min this week
          </span>
        </div>
      </header>

      {featured || last ? (
        <button className="hero" onClick={() => void openById(featuredId)}>
          <SongCover id={featuredId} big />
          <div className="hero-shade" />
          <div className="hero-body">
            <span className="eyebrow">{last ? 'Pick up where you left off' : 'Start here'}</span>
            <strong className="hero-title">{featuredTitle}</strong>
            <span className="hero-sub">
              {last
                ? `${Math.max(1, Math.round(last.totalSeconds / 60))} min played · up to ${Math.round(last.topSpeed * 100)}% speed${last.bestAccuracy !== undefined ? ` · best ${Math.round(last.bestAccuracy * 100)}%` : ''}`
                : (featured?.description ?? '')}
            </span>
            {featuredFacts.length > 0 && (
              <span className="tile-facts">
                {featuredFacts.map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </span>
            )}
          </div>
          <span className="hero-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          </span>
        </button>
      ) : null}

      {due.length > 0 && (
        <div className="revisit">
          <span>Haven’t played these in a while:</span>
          {due.map((d) => (
            <button key={d.songId} className="chip" onClick={() => void openById(d.songId)}>
              {d.title} <small>{d.daysSince} days</small>
            </button>
          ))}
        </div>
      )}

      <div className="shortcuts">
        {SHORTCUTS.map((s) => (
          <button key={s.page} className={`shortcut tone-${s.tone}`} onClick={() => onGo(s.page)}>
            <span className="shortcut-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d={s.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="shortcut-text">
              <strong>{s.title}</strong>
              <small>{s.sub}</small>
            </span>
          </button>
        ))}
      </div>

      <section className="shelf browse">
        <div className="shelf-head">
          <h2>Songs and studies</h2>
          <span className="shelf-note">
            {shown.length} of {all.length}
          </span>
        </div>
        <div className="browse-bar">
          <label className="browse-search">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search songs and studies" aria-label="Search songs and studies" />
          </label>
          <div className="seg" role="group" aria-label="Type">
            {KINDS.filter((k) => k.id !== 'mine' || mine.length > 0).map((k) => (
              <button key={k.id} className={kind === k.id ? 'on' : ''} aria-pressed={kind === k.id} onClick={() => setFilter({ kind: k.id, level })}>
                {k.label}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Level">
            {([0, 1, 2, 3] as const).map((l) => (
              <button
                key={l}
                className={`${level === l ? 'on' : ''}${l ? ` level-${l}` : ''}`}
                aria-pressed={level === l}
                onClick={() => setFilter({ kind, level: l })}
              >
                {l ? LEVELS[l] : 'Any level'}
              </button>
            ))}
          </div>
        </div>
        {shown.length > 0 ? (
          <ul className="tiles">
            {shown.map((s) => (
              <SongTile
                key={s.id}
                song={s}
                p={bySong.get(s.id)}
                onOpen={() => void open(s)}
                onRemove={
                  s.builtIn
                    ? undefined
                    : () => {
                        if (window.confirm(`Remove ${s.title} from your library?`)) {
                          void db.songs.delete(s.id)
                          void db.settings.delete(s.id)
                        }
                      }
                }
              />
            ))}
          </ul>
        ) : (
          <div className="browse-empty">
            Nothing matches.{' '}
            <button className="link" onClick={() => { setQuery(''); setFilter({ kind: 'all', level: 0 }) }}>
              Show everything
            </button>
          </div>
        )}
      </section>

      <section className="import-card">
        <div className="import-text">
          <h2>Bring your own songs</h2>
          <p>
            Landslide, Blackbird and other songs under copyright can’t ship with the app, but any tab you own works: Guitar Pro
            (.gp, .gpx, .gp5, .gp4, .gp3), MusicXML or a plain text tab. Drop a file here. It stays on this device.
          </p>
        </div>
        <div className="import-actions">
          <button className="primary" onClick={() => fileInput.current?.click()}>
            Import a file
          </button>
          <button className="ghost" onClick={() => setPasteOpen((o) => !o)}>
            Paste a text tab
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_FILES}
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) void importFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
        {message && <div className={message.kind === 'error' ? 'error' : 'notice'}>{message.text}</div>}
        {pasteOpen && (
          <div className="paste-box">
            <div className="row">
              <label className="field grow">
                Title
                <input value={pasteTitle} onChange={(e) => setPasteTitle(e.target.value)} placeholder="Song title" />
              </label>
              <label className="field">
                Capo
                <input className="bar-input" type="number" min={0} max={12} value={pasteCapo} onChange={(e) => setPasteCapo(e.target.value)} placeholder="auto" />
              </label>
              <label className="field">
                Tempo
                <input className="bar-input" type="number" min={30} max={240} value={pasteTempo} onChange={(e) => setPasteTempo(e.target.value)} />
              </label>
            </div>
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={EXAMPLE_TAB} rows={10} spellCheck={false} />
            <div className="row">
              <button className="primary" disabled={!pasteText.trim()} onClick={importPaste}>
                Add to library
              </button>
              <button className="ghost" onClick={() => setPasteOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
