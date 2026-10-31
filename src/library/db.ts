import Dexie, { type EntityTable } from 'dexie'
import type { FingeringOverrides } from '../music/types'

export type SongFormat = 'binary' | 'tex'

export interface SongRecord {
  id: string
  title: string
  artist?: string
  format: SongFormat
  /** Guitar Pro / MusicXML bytes, or alphaTex text. */
  data: ArrayBuffer | string
  fileName?: string
  addedAt: number
  lastOpenedAt?: number
}

export interface LoopSection {
  id: string
  name: string
  /** 1-based, inclusive. */
  startBar: number
  endBar: number
}

export interface SongSettings {
  songId: string
  trackIndex: number
  speed: number
  loops: LoopSection[]
  fingering: FingeringOverrides
}

class LibraryDb extends Dexie {
  songs!: EntityTable<SongRecord, 'id'>
  settings!: EntityTable<SongSettings, 'songId'>

  constructor() {
    super('fingerstyle-trainer')
    this.version(1).stores({
      songs: 'id, title, addedAt, lastOpenedAt',
      settings: 'songId',
    })
  }
}

export const db = new LibraryDb()

export function defaultSettings(songId: string): SongSettings {
  return { songId, trackIndex: 0, speed: 1, loops: [], fingering: {} }
}

export async function loadSettings(songId: string): Promise<SongSettings> {
  return (await db.settings.get(songId)) ?? defaultSettings(songId)
}

export async function saveSettings(settings: SongSettings): Promise<void> {
  await db.settings.put(settings)
}

export function newId(): string {
  return crypto.randomUUID()
}
