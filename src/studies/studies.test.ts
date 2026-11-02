import { describe, expect, it } from 'vitest'
import * as alphaTab from '@coderline/alphatab'
import { SONGS, STUDIES } from './studies'
import { beatToFretNotes } from '../player/alphaTabAdapter'
import { fingerSong } from '../music/songFingering'

describe.each([...STUDIES, ...SONGS])('$title', (study) => {
  const importer = new alphaTab.importer.AlphaTexImporter()
  importer.initFromString(study.tex, new alphaTab.Settings())
  const score = importer.readScore()
  const staff = score.tracks[0].staves[0]

  it('parses with every bar exactly full', () => {
    for (const mb of score.masterBars) {
      const filled = staff.bars[mb.index].voices[0].beats.reduce((sum, b) => sum + b.playbackDuration, 0)
      expect(filled, `bar ${mb.index + 1}`).toBe(mb.calculateDuration())
    }
  })

  it('uses the steel-string guitar sound and has fingering marks', () => {
    expect(score.tracks[0].playbackInfo.program).toBe(25)
    const notes = staff.bars.flatMap((b) => b.voices[0].beats.flatMap((beat) => beat.notes))
    if (study.kind === 'study') expect(notes.some((n) => n.rightHandFinger >= 0)).toBe(true)
    expect(notes.some((n) => n.leftHandFinger >= 0)).toBe(true)
  })

  it('can be played: every finger within reach of its hand position and of the other fingers', () => {
    const beats = staff.bars.flatMap((bar) => bar.voices.flatMap((v) => v.beats).filter((b) => b.notes.length > 0).sort((a, b) => a.playbackStart - b.playbackStart))
    const events = beats.map((b) => ({ bar: b.voice.bar.index, notes: beatToFretNotes(b) }))
    const { fingers, grips, gripOf } = fingerSong(events)
    events.forEach((ev, i) => {
      const position = grips[gripOf[i]].position
      const held = ev.notes.filter((n) => n.tabFret > 0 && !n.isDead).map((n) => ({ fret: n.fret, f: n.lh ?? fingers.get(n.key) ?? 0 }))
      for (const a of held) {
        expect(a.f, `bar ${ev.bar + 1}: a finger for fret ${a.fret}`).toBeGreaterThan(0)
        // Never more than one fret past one finger per fret from where the hand is
        if (position !== null) expect(a.fret - position - (a.f - 1), `bar ${ev.bar + 1}: finger ${a.f} on fret ${a.fret}, hand at ${position}`).toBeLessThanOrEqual(1)
        for (const b of held)
          if (a.f < b.f) expect(b.fret - a.fret, `bar ${ev.bar + 1}: fingers ${a.f} and ${b.f}`).toBeLessThanOrEqual(b.f - a.f + 1 + (b.f - a.f === 3 && a.fret >= 7 ? 1 : 0))
      }
    })
  })
})
