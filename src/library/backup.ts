import { db } from './db'

/**
 * Everything the app keeps on this device lives in the browser: imported songs, per-song
 * settings and the practice log in IndexedDB, and preferences, stars and best scores in
 * localStorage. Browsers may clear that (Safari does after about a week without a visit),
 * so the app asks to keep it and lets you save it all to one file and load it back.
 */

const FORMAT = 'fingerstyle-trainer-backup'

/** Ask the browser not to clear this app's storage when space runs low. Safe to call often. */
export async function keepStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

// Song files can be binary, which JSON can't hold, so they travel as base64
type Packed = { $bytes: string }
const isPacked = (v: unknown): v is Packed => typeof v === 'object' && v !== null && typeof (v as Packed).$bytes === 'string'

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

function fromBase64(s: string): ArrayBuffer {
  const bin = atob(s)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

export interface Backup {
  format: typeof FORMAT
  version: 1
  savedAt: string
  songs: unknown[]
  settings: unknown[]
  practice: unknown[]
  local: Record<string, string>
}

export async function makeBackup(): Promise<Backup> {
  const [songs, settings, practice] = await Promise.all([db.songs.toArray(), db.settings.toArray(), db.practice.toArray()])
  const local: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k !== null) local[k] = localStorage.getItem(k) ?? ''
  }
  return {
    format: FORMAT,
    version: 1,
    savedAt: new Date().toISOString(),
    songs: songs.map((s) => (s.data instanceof ArrayBuffer ? { ...s, data: { $bytes: toBase64(s.data) } } : s)),
    settings,
    practice,
    local,
  }
}

/** Save everything to a .json file in the downloads folder. */
export async function downloadBackup(): Promise<void> {
  const backup = await makeBackup()
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fingerstyle-backup-${backup.savedAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('This file is not a backup from this app.')
  }
  const b = data as Partial<Backup>
  if (b?.format !== FORMAT || !Array.isArray(b.songs) || !Array.isArray(b.settings) || !Array.isArray(b.practice)) {
    throw new Error('This file is not a backup from this app.')
  }
  return { ...b, local: b.local ?? {} } as Backup
}

/**
 * Load a backup on top of what is here: its songs, settings and practice days are added or
 * replace the ones with the same id, and its preferences replace the current ones.
 * Returns how many songs it held.
 */
export async function restoreBackup(backup: Backup): Promise<number> {
  const songs = backup.songs.map((s) => {
    const rec = s as { data: unknown }
    return isPacked(rec.data) ? { ...rec, data: fromBase64(rec.data.$bytes) } : rec
  })
  await db.transaction('rw', db.songs, db.settings, db.practice, async () => {
    await db.songs.bulkPut(songs as never[])
    await db.settings.bulkPut(backup.settings as never[])
    await db.practice.bulkPut(backup.practice as never[])
  })
  for (const [k, v] of Object.entries(backup.local)) {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* storage full: keep going with the rest */
    }
  }
  return songs.length
}
