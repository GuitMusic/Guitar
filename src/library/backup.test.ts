import { describe, expect, it } from 'vitest'
import { parseBackup } from './backup'

describe('parseBackup', () => {
  it('accepts a backup made by the app', () => {
    const b = parseBackup(JSON.stringify({ format: 'fingerstyle-trainer-backup', version: 1, savedAt: 'x', songs: [], settings: [], practice: [], local: { a: '1' } }))
    expect(b.local.a).toBe('1')
  })
  it('refuses other files', () => {
    expect(() => parseBackup('not json')).toThrow(/not a backup/)
    expect(() => parseBackup('{"songs":[]}')).toThrow(/not a backup/)
  })
})
