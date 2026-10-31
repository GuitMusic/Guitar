import { describe, expect, it } from 'vitest'
import * as alphaTab from '@coderline/alphatab'
import { SONGS, STUDIES } from './studies'

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
    expect(notes.some((n) => n.leftHandFinger >= 0) || study.id === 'song-spanish-romance').toBe(true)
  })
})
