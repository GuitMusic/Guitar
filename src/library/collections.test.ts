import { describe, expect, it } from 'vitest'
import { BUILT_IN_SONGS } from './songs'
import { collectionOf, groupTunes, tuneName } from './collections'

describe('collections', () => {
  it('puts every built-in piece on a shelf', () => {
    for (const s of BUILT_IN_SONGS) expect(collectionOf(s)).not.toBeNull()
  })
  it('puts the Arab and Andalusian pieces together, in both tunings', () => {
    const arab = BUILT_IN_SONGS.filter((s) => collectionOf(s) === 'arab')
    expect(arab.length).toBeGreaterThanOrEqual(20)
    expect(arab.some((s) => s.title === 'Bafta Hindi')).toBe(true)
    expect(arab.some((s) => s.title === 'Bafta Hindi (DADGAD)')).toBe(true)
  })
  it('groups the versions of one tune, standard first', () => {
    expect(tuneName('Qamarun (DADGAD)')).toBe('Qamarun')
    const tunes = groupTunes(BUILT_IN_SONGS)
    const bafta = tunes.find((t) => t.main.title === 'Bafta Hindi')!
    expect(bafta.versions.map((v) => v.tuning ?? 'standard')).toEqual(['standard', 'dadgad'])
    const grace = tunes.find((t) => t.main.title === 'Amazing Grace')!
    expect(grace.versions).toHaveLength(2)
    expect(tunes.length).toBe(BUILT_IN_SONGS.length - 10)
  })
})
