import { describe, expect, it } from 'vitest'
import { NOTE_COLORS, noteColor } from './noteColors'

describe('note colours', () => {
  it('gives each of the 12 notes its own colour', () => {
    expect(new Set(NOTE_COLORS).size).toBe(12)
  })
  it('colours a note the same in every octave', () => {
    expect(noteColor(40)).toBe(noteColor(64))
    expect(noteColor(60)).toBe(NOTE_COLORS[0])
    expect(noteColor(-1)).toBe(NOTE_COLORS[11])
  })
})
