import { useRef, useState } from 'react'
import { downloadBackup, parseBackup, restoreBackup } from '../library/backup'

/** Settings row: save every song, setting and score to a file, or load one back. */
export function DataSettings() {
  const input = useRef<HTMLInputElement>(null)
  const [note, setNote] = useState<string | null>(null)
  const restore = async (file: File) => {
    try {
      const backup = parseBackup(await file.text())
      const n = await restoreBackup(backup)
      setNote(`Restored ${n} imported song${n === 1 ? '' : 's'} and your progress. Reloading…`)
      setTimeout(() => location.reload(), 1200)
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e))
    }
  }
  return (
    <div className="settings-row">
      <span className="settings-label">Your songs and progress</span>
      <div className="data-buttons">
        <button
          className="chip"
          onClick={() =>
            void downloadBackup()
              .then(() => setNote('Saved a backup file. Keep it somewhere safe, like your cloud drive.'))
              .catch((e) => setNote(String(e)))
          }
        >
          Back up
        </button>
        <button className="chip" onClick={() => input.current?.click()}>
          Restore
        </button>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void restore(f)
          }}
        />
      </div>
      <p className="install-hint">{note ?? 'Imported songs, stars and scores live only on this device. A backup file keeps them safe.'}</p>
    </div>
  )
}
