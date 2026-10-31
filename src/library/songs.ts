import { SONGS, STUDIES } from '../studies/studies'
import type { SongFormat, SongRecord } from './db'

export interface OpenSong {
  id: string
  title: string
  format: SongFormat
  data: ArrayBuffer | string
  builtIn: boolean
  description?: string
  kind?: 'study' | 'song'
  level?: 1 | 2 | 3
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
}))

export function toOpenSong(record: SongRecord): OpenSong {
  return { id: record.id, title: record.title, format: record.format, data: record.data, builtIn: false }
}
