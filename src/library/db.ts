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

/** Practice time for one song on one day. */
export interface PracticeDay {
  /** songId:YYYY-MM-DD */
  id: string
  songId: string
  title: string
  /** Local date, YYYY-MM-DD */
  date: string
  seconds: number
  /** Highest playback speed used that day (1 = 100%). */
  topSpeed: number
  /** Best "Check me" score that day, 0..1, if it was used. */
  bestAccuracy?: number
}

class LibraryDb extends Dexie {
  songs!: EntityTable<SongRecord, 'id'>
  settings!: EntityTable<SongSettings, 'songId'>
  practice!: EntityTable<PracticeDay, 'id'>

  constructor() {
    super('fingerstyle-trainer')
    this.version(1).stores({
      songs: 'id, title, addedAt, lastOpenedAt',
      settings: 'songId',
    })
    this.version(2).stores({
      songs: 'id, title, addedAt, lastOpenedAt',
      settings: 'songId',
      practice: 'id, songId, date',
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
