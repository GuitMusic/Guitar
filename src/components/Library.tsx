import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { ACCEPTED_FILES, songFromAsciiTab, songFromFile } from '../import/importFile'
import { db } from '../library/db'
import { BUILT_IN_SONGS, toOpenSong, type OpenSong } from '../library/songs'

interface Props {
  onOpen: (song: OpenSong) => void
}

const EXAMPLE_TAB = `e|-------0-------|-------0-------|
B|-----1---1-----|-----3---3-----|
G|---0-------0---|---0-------0---|
D|---------------|---------------|
A|-3-------------|---------------|
E|---------------|-3-------------|`

export function Library({ onOpen }: Props) {
  const songs = useLiveQuery(() => db.songs.orderBy('addedAt').reverse().toArray(), [])
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
          <p className="empty">No songs yet. Import a tab file, or start with one of the studies below.</p>
        )}
      </section>

      <section>
        <h2>Fingerstyle studies</h2>
        <ul className="song-list">
          {BUILT_IN_SONGS.map((s) => (
            <li key={s.id}>
              <button className="song-card" onClick={() => open(s)}>
                <strong>{s.title}</strong>
                <span className="hint">{s.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
