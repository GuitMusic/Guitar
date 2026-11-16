import type { OpenSong } from './songs'

/** Shelves on Home and the type filter of the full list. */
export type Collection = 'arab' | 'classical' | 'folk' | 'study'

export const COLLECTIONS: { id: Collection; label: string; note: string }[] = [
  { id: 'arab', label: 'Arab & Andalusian', note: 'Maqam melodies, Egyptian songs and Moroccan nawba' },
  { id: 'classical', label: 'Classical', note: 'Bach, Carcassi, Sor, Satie and more' },
  { id: 'folk', label: 'Folk, Celtic & carols', note: 'Tunes everyone knows, O’Carolan, fiddle tunes' },
  { id: 'study', label: 'Studies', note: 'Short exercises, one technique each' },
]

const ARAB = new Set([
  'song-lamma-bada',
  'song-ah-ya-zein',
  'song-bafta-hindi',
  'song-hamama-beida',
  'song-shedd-el-hizam',
  'song-el-helwa-di',
  'song-shams-al-ashiyya',
  'song-in-kunta',
  'song-qamarun',
  'song-ashawqu',
])
const CLASSICAL = new Set([
  'song-spanish-romance',
  'song-ode-to-joy',
  'song-fur-elise',
  'song-minuet-in-g',
  'song-canon-in-d',
  'song-malaguena',
  'song-gymnopedie',
  'song-bach-prelude',
  'song-mozart-k545',
  'song-la-donna-e-mobile',
  'song-der-lindenbaum',
  'song-wachet-auf',
  'song-carcassi-op60-3',
  'song-carcassi-op60-15',
  'song-sor-op35-14',
  'song-mertz-etude',
  'song-bach-bwv999',
])

/** Which shelf a built-in piece sits on; imported songs have none. */
export function collectionOf(song: OpenSong): Collection | null {
  if (!song.builtIn) return null
  if (song.kind === 'study') return 'study'
  if (ARAB.has(song.id) || song.id.startsWith('song-dadgad-ar-')) return 'arab'
  if (CLASSICAL.has(song.id)) return 'classical'
  return 'folk'
}

/** The tune's name without the tuning it is arranged in, so versions of one tune group together. */
export function tuneName(title: string): string {
  return title.replace(/\s*\((DADGAD|Open D)\)\s*$/, '').trim()
}

/** One tune and every arrangement of it: standard first, then the other tunings. */
export interface Tune {
  key: string
  main: OpenSong
  versions: OpenSong[]
}

/** Groups built-in songs that are the same tune in different tunings; studies and imports stay single. */
export function groupTunes(songs: OpenSong[]): Tune[] {
  const tunes: Tune[] = []
  const byKey = new Map<string, Tune>()
  for (const s of songs) {
    const key = s.builtIn && s.kind === 'song' ? `tune:${tuneName(s.title).toLowerCase()}` : `id:${s.id}`
    const t = byKey.get(key)
    if (t) t.versions.push(s)
    else {
      const tune = { key, main: s, versions: [s] }
      byKey.set(key, tune)
      tunes.push(tune)
    }
  }
  for (const t of tunes) {
    t.versions.sort((a, b) => (a.tuning ? 1 : 0) - (b.tuning ? 1 : 0))
    t.main = t.versions[0]
  }
  return tunes
}
