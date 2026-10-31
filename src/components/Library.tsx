import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { ACCEPTED_FILES, songFromAsciiTab, songFromFile } from '../import/importFile'
import { db } from '../library/db'
import { BUILT_IN_SONGS, toOpenSong, type OpenSong } from '../library/songs'
import { needsRevisit, summarize, type SongProgress } from '../progress/practiceLog'
import { findSong } from '../progress/Progress'

interface Props {
  onOpen: (song: OpenSong) => void
}

const EXAMPLE_TAB = `e|-------0-------|-------0-------|
B|-----1---1-----|-----3---3-----|
G|---0-------0---|---0-------0---|
D|---------------|---------------|
A|-3-------------|---------------|
E|---------------|-3-------------|`

const LEVELS = { 1: 'Beginner', 2: 'Easy', 3: 'Intermediate' } as const

function progressLine(p: SongProgress): string {
  const minutes = Math.max(1, Math.round(p.totalSeconds / 60))
  const when = p.daysSince === 0 ? 'today' : p.daysSince === 1 ? 'yesterday' : `${p.daysSince} days ago`
  const parts = [`${minutes} min`, `up to ${Math.round(p.topSpeed * 100)}% speed`]
  if (p.bestAccuracy !== undefined) parts.push(`best ${Math.round(p.bestAccuracy * 100)}%`)
  return `Played ${when} · ${parts.join(' · ')}`
}

export function Library({ onOpen }: Props) {
  const songs = useLiveQuery(() => db.songs.orderBy('addedAt').reverse().toArray(), [])
  const practice = useLiveQuery(() => db.practice.toArray(), [])
  const progress = practice ? summarize(practice) : []
  const due = needsRevisit(progress).slice(0, 3)
  const bySong = new Map(progress.map((p) => [p.songId, p]))
  const last = progress[0]
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [pasteCapo, setPasteCapo] = useState('')
  const [pasteTempo, setPasteTempo] = useState('80')
  const [dragging, setDragging] = useState(false)

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
      const song = songFromAsciiTab(
        pasteText,
        pasteTitle,
        pasteCapo.trim() ? Number(pasteCapo) : undefined,
        Number(pasteTempo) || 80,
      )
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

  return (
    <div
      className={`library${dragging ? ' dragging' : ''}`}
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
      {last && (
        <button
          className="continue-card"
          onClick={async () => {
            const s = await findSong(last.songId)
            if (s) onOpen(s)
          }}
        >
          <span className="continue-label">Pick up where you left off</span>
          <strong>{last.title}</strong>
          <span className="hint">{progressLine(last)}</span>
          <span className="continue-go" aria-hidden="true">Continue ›</span>
        </button>
      )}

      {due.length > 0 && (
        <div className="revisit">
          <strong>Time to revisit:</strong>
          {due.map((d) => (
            <button
              key={d.songId}
              className="chip"
              onClick={async () => {
                const s = await findSong(d.songId)
                if (s) onOpen(s)
              }}
            >
              {d.title} <small>{d.daysSince} days</small>
            </button>
          ))}
        </div>
      )}

      <section>
        <div className="section-head">
          <h1>Your songs</h1>
          <div className="row">
            <button className="primary" onClick={() => fileInput.current?.click()}>
              Import file
            </button>
            <button onClick={() => setPasteOpen((o) => !o)}>Paste text tab</button>
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
        </div>
        <p className="hint">
          Import tabs you own: Guitar Pro (.gp, .gpx, .gp5, .gp4, .gp3), MusicXML, or a plain text tab. Files stay in this
          browser and are never uploaded. You can also drop files anywhere on this page.
        </p>

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
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={EXAMPLE_TAB}
              rows={10}
              spellCheck={false}
            />
            <div className="row">
              <button className="primary" disabled={!pasteText.trim()} onClick={importPaste}>
                Add to library
              </button>
              <button onClick={() => setPasteOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        {songs && songs.length > 0 ? (
          <ul className="song-list">
            {songs.map((s) => (
              <li key={s.id}>
                <button className="song-card" onClick={() => open(toOpenSong(s))}>
                  <strong>{s.title}</strong>
                  <span className="hint">{s.format === 'tex' ? 'Text tab' : (s.fileName ?? 'Score file')}</span>
                  {bySong.get(s.id) && <span className="card-foot">{progressLine(bySong.get(s.id)!)}</span>}
                </button>
                <button
                  className="icon"
                  aria-label={`Remove ${s.title}`}
                  onClick={() => {
                    if (window.confirm(`Remove ${s.title} from your library?`)) {
                      void db.songs.delete(s.id)
                      void db.settings.delete(s.id)
                    }
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Nothing imported yet. Try a free song below while you find a tab file.</p>
        )}
      </section>

      {(['song', 'study'] as const).map((kind) => (
        <section key={kind}>
          <h2>{kind === 'song' ? 'Free songs' : 'Fingerstyle studies'}</h2>
          {kind === 'song' && (
            <p className="hint">Public-domain tunes arranged for this app. Songs still under copyright, like Landslide, need a tab file you own.</p>
          )}
          <ul className="song-list">
            {BUILT_IN_SONGS.filter((s) => s.kind === kind).map((s) => (
              <li key={s.id}>
                <button className="song-card" onClick={() => open(s)}>
                  <strong>{s.title}</strong>
                  <span className="hint">{s.description}</span>
                  <span className="card-foot">
                    {s.level && <span className={`level level-${s.level}`}>{LEVELS[s.level]}</span>}
                    {bySong.get(s.id) && <span>{progressLine(bySong.get(s.id)!)}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
