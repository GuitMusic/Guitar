import { SONGS, STUDIES } from '../studies/studies'
import { db, type SongFormat, type SongRecord } from './db'

export interface OpenSong {
  id: string
  title: string
  format: SongFormat
  data: ArrayBuffer | string
  builtIn: boolean
  description?: string
  kind?: 'study' | 'song'
  level?: 1 | 2 | 3 | 4
  /** Alternate tuning of a built-in piece (standard when left out) */
  tuning?: 'dadgad' | 'open-d'
}

export const BUILT_IN_SONGS: OpenSong[] = [...SONGS, ...STUDIES].map((s) => ({
  id: s.id,
  title: s.title,
  format: 'tex',
  data: s.tex,
  builtIn: true,
  description: s.description,
  kind: s.kind,
  level: s.level,
  tuning: s.tuning,
}))

export function toOpenSong(record: SongRecord): OpenSong {
  return { id: record.id, title: record.title, format: record.format, data: record.data, builtIn: false }
}

/** A built-in piece or an imported song, by id. */
export async function findSong(songId: string): Promise<OpenSong | null> {
  const builtIn = BUILT_IN_SONGS.find((s) => s.id === songId)
  if (builtIn) return builtIn
  const rec = await db.songs.get(songId)
  return rec ? toOpenSong(rec) : null
}
