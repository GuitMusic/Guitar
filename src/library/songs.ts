import { STUDIES } from '../studies/studies'
import type { SongFormat, SongRecord } from './db'

export interface OpenSong {
  id: string
  title: string
  format: SongFormat
  data: ArrayBuffer | string
  builtIn: boolean
  description?: string
}

export const BUILT_IN_SONGS: OpenSong[] = STUDIES.map((s) => ({
  id: s.id,
  title: s.title,
  format: 'tex',
  data: s.tex,
  builtIn: true,
  description: s.description,
}))

export function toOpenSong(record: SongRecord): OpenSong {
  return { id: record.id, title: record.title, format: record.format, data: record.data, builtIn: false }
}
