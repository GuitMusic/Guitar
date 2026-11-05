import { STANDARD_TUNING, TUNINGS } from '../music/notes'

export type AltTuningId = 'dadgad' | 'open-d'

/** A chord shape: frets and fingers from the 6th (lowest) string to the 1st, null = not played. */
export interface ChordShape {
  name: string
  /** Frets from string 6 to string 1; null = don't play that string */
  frets: (number | null)[]
  /** Fretting fingers from string 6 to string 1: 1 = index … 4 = little, 0 = open or muted */
  fingers: number[]
  /** Pitch classes the shape must sound (root first), for the test that checks every shape */
  tones: string[]
  tip?: string
  group: string
}

export interface Lesson {
  title: string
  body: string[]
}

export interface ScaleView {
  id: string
  label: string
  /** Pitch-class names shown on the neck; empty = every note */
  notes: string[]
  hint: string
}

export interface TuningGuide {
  id: AltTuningId
  name: string
  short: string
  tagline: string
  /** MIDI notes, string 1 (highest) first, as in TUNINGS */
  strings: number[]
  lessons: Lesson[]
  scales: ScaleView[]
  chords: ChordShape[]
  /** One-line tips shown before the practice path */
  practiceTip: string
}

const strings = (id: string) => TUNINGS.find((t) => t.id === id)!.strings

/** How each string changes from standard tuning, lowest string first. */
export function retuneSteps(target: number[]): { string: number; from: number; to: number; semitones: number }[] {
  return target
    .map((to, i) => ({ string: i + 1, from: STANDARD_TUNING[i], to, semitones: to - STANDARD_TUNING[i] }))
    .reverse()
}

export const GUIDES: TuningGuide[] = [
  {
    id: 'dadgad',
    name: 'DADGAD',
    short: 'D A D G A D',
    tagline: 'Open, ringing and a little mysterious: the sound of Celtic guitar, and a lovely home for modal and Arab melodies.',
    strings: strings('dadgad'),
    lessons: [
      {
        title: 'What changes',
        body: [
          'Three strings go down a whole step (two frets): the 6th from E to D, the 2nd from B to A and the 1st from E to D. The 5th (A), 4th (D) and 3rd (G) strings stay exactly where they are.',
          'So anything you know on the middle three strings still works. On the 6th, 2nd and 1st strings every note now sits two frets higher than you are used to: the D on the 2nd string moves from fret 3 to fret 5.',
        ],
      },
      {
        title: 'Why it sounds like that',
        body: [
          'Strum the open strings: D, A and G make a Dsus4 chord. It has no third, so it is neither happy nor sad. That open, floating sound is DADGAD.',
          'You choose the mood with one finger on the 4th string: fret 4 adds F# for D major, fret 3 adds F for D minor, and leaving it open keeps the floating sound. The same open strings work for both.',
        ],
      },
      {
        title: 'Drones and ringing strings',
        body: [
          'The low D and A strings are the root and fifth of D. Play them under almost any melody in D and they fit, like the drone of bagpipes or the low strings of an oud.',
          'Let open strings ring under fretted notes. When two neighbouring scale notes fall on different strings they overlap like a harp. Guitarists call this campanella, Italian for "little bells".',
        ],
      },
      {
        title: 'Keys and modes that fit',
        body: [
          'D major, D minor, D Mixolydian (major with C instead of C#), D Dorian (minor with B instead of Bb), G major and A. Most Irish and Scottish tunes are in these keys.',
          'For Arab and Moroccan music, Hijaz on D (D Eb F# G A Bb C) sits beautifully over the open D drone. Try it on the neck below, then play "DADGAD 5: Hijaz Drone".',
        ],
      },
      {
        title: 'Your hands',
        body: [
          'Standard chord shapes stop working. Think in small shapes instead: one to three fingers on the middle strings while the open strings ring around them.',
          'The picking hand stays the same: the thumb (p) plays strings 6, 5 and 4; i, m and a play strings 3, 2 and 1. Mute nothing unless the chord chart shows an ×.',
        ],
      },
    ],
    scales: [
      { id: 'all', label: 'All notes', notes: [], hint: 'Every note on the neck. Strings 6, 2 and 1 changed, so their notes moved.' },
      { id: 'major', label: 'D major', notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'], hint: 'D major: D E F# G A B C#. Notice how many are open strings.' },
      { id: 'mixo', label: 'D Mixolydian', notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C'], hint: 'D Mixolydian: a D major scale with C natural. The sound of many Irish jigs and reels.' },
      { id: 'dorian', label: 'D Dorian', notes: ['D', 'E', 'F', 'G', 'A', 'B', 'C'], hint: 'D Dorian: a minor scale with a bright B natural. Scarborough Fair lives here.' },
      { id: 'hijaz', label: 'D Hijaz', notes: ['D', 'Eb', 'F#', 'G', 'A', 'Bb', 'C'], hint: 'Hijaz on D: D Eb F# G A Bb C, the maqam behind many Arab and Andalusian melodies.' },
    ],
    chords: [
      { group: 'D major family', name: 'Dsus4', frets: [0, 0, 0, 0, 0, 0], fingers: [0, 0, 0, 0, 0, 0], tones: ['D', 'G', 'A'], tip: 'All open: the home sound of DADGAD.' },
      { group: 'D major family', name: 'D5', frets: [0, 0, 0, 2, 0, 0], fingers: [0, 0, 0, 1, 0, 0], tones: ['D', 'A'], tip: 'One finger. No third, so it fits major and minor tunes.' },
      { group: 'D major family', name: 'D', frets: [0, 0, 4, 2, 0, 0], fingers: [0, 0, 3, 1, 0, 0], tones: ['D', 'F#', 'A'], tip: 'Fret 4 on the 4th string adds the major third, F#.' },
      { group: 'D major family', name: 'Dsus2', frets: [0, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], tones: ['D', 'E', 'A'] },
      { group: 'D major family', name: 'G', frets: [5, 5, 0, 0, 2, 0], fingers: [3, 4, 0, 0, 1, 0], tones: ['G', 'B', 'D'], tip: 'Low G on the 6th string, B on the 2nd.' },
      { group: 'D major family', name: 'Gadd9', frets: [5, 2, 0, 0, 0, 0], fingers: [3, 1, 0, 0, 0, 0], tones: ['G', 'B', 'D', 'A'], tip: 'Two fingers, four ringing strings.' },
      { group: 'D major family', name: 'A', frets: [null, 0, 2, 2, 4, null], fingers: [0, 0, 1, 2, 4, 0], tones: ['A', 'C#', 'E'], tip: 'Skip the 6th and 1st strings.' },
      { group: 'D major family', name: 'Asus4', frets: [null, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], tones: ['A', 'D', 'E'] },
      { group: 'D major family', name: 'Bm7', frets: [null, 2, 4, 4, 0, 0], fingers: [0, 1, 3, 4, 0, 0], tones: ['B', 'D', 'F#', 'A'] },
      { group: 'D major family', name: 'Em7', frets: [2, 2, 0, 0, 2, 0], fingers: [1, 2, 0, 0, 3, 0], tones: ['E', 'G', 'B', 'D'] },
      { group: 'Minor and modal', name: 'Dm', frets: [0, 0, 3, 2, 0, 0], fingers: [0, 0, 2, 1, 0, 0], tones: ['D', 'F', 'A'], tip: 'Fret 3 on the 4th string: the minor third, F.' },
      { group: 'Minor and modal', name: 'Cadd9', frets: [null, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0], tones: ['C', 'E', 'G', 'D'], tip: 'The C chord of D Mixolydian and D Dorian.' },
      { group: 'Minor and modal', name: 'F', frets: [null, null, 3, 2, 3, null], fingers: [0, 0, 2, 1, 3, 0], tones: ['F', 'A', 'C'] },
      { group: 'Minor and modal', name: 'Gm(add9)', frets: [5, 5, 0, 3, 0, 0], fingers: [3, 4, 0, 1, 0, 0], tones: ['G', 'Bb', 'D', 'A'] },
      { group: 'Minor and modal', name: 'Bb', frets: [null, 1, 0, 3, 1, 0], fingers: [0, 1, 0, 3, 2, 0], tones: ['Bb', 'D'] },
    ],
    practiceTip: 'Start with the five DADGAD studies in order, then pick any song. The airs (Blind Mary, Eileen Aroon, Arran Air) are slower; the jigs come after.',
  },
  {
    id: 'open-d',
    name: 'Open D',
    short: 'D A D F# A D',
    tagline: 'The open strings are a big D major chord. Bright, full and bluesy: the tuning of slide guitar, folk and gospel.',
    strings: strings('open-d'),
    lessons: [
      {
        title: 'What changes',
        body: [
          'Four strings go down: the 6th from E to D, the 2nd from B to A and the 1st from E to D (a whole step, two frets each), and the 3rd from G to F# (a half step, one fret). The 5th (A) and 4th (D) stay.',
          'Coming from DADGAD? Only one string differs: lower the 3rd string from G to F#.',
        ],
      },
      {
        title: 'The open strings are a chord',
        body: [
          'D, F# and A are the notes of D major, so strumming the open strings already plays a D chord. Every song in D starts with zero fingers down.',
          'Because the whole guitar rings in D, the open strings work as a drone under almost every melody note in the key.',
        ],
      },
      {
        title: 'One finger, any chord',
        body: [
          'Lay one finger flat across all six strings and you get another major chord. Fret 5 is G, fret 7 is A, fret 12 is D an octave up. D, G and A are the I, IV and V chords: enough for thousands of folk, blues and gospel songs.',
          'This is also why Open D is a classic slide tuning: a slide is just a finger that can glide.',
        ],
      },
      {
        title: 'Major or minor',
        body: [
          'The 3rd string holds the chord’s third. Keep it one fret lower than the rest of the barre and the chord turns minor: G is everything at fret 5, Gm has the 3rd string at fret 4.',
          'For D minor itself, fret the 4th and 3rd strings at fret 3 (F and A) and leave the rest open.',
        ],
      },
      {
        title: 'Melody on top, drone below',
        body: [
          'The melody lives on the top two strings. On the 1st string the D major scale is frets 0 2 4 5 7 9 11 12, the same pattern as on one string in any tuning.',
          'Meanwhile the thumb keeps the low D strings going on the beat. Start slowly with "Open D 3: Melody over a Thumb Drone", then try Travis picking.',
        ],
      },
    ],
    scales: [
      { id: 'all', label: 'All notes', notes: [], hint: 'Every note on the neck. Four strings changed: 6, 3, 2 and 1.' },
      { id: 'major', label: 'D major', notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'], hint: 'D major: D E F# G A B C#.' },
      { id: 'chord', label: 'D chord tones', notes: ['D', 'F#', 'A'], hint: 'Only D, F# and A. Every open string is one of them.' },
      { id: 'blues', label: 'D blues', notes: ['D', 'F', 'G', 'Ab', 'A', 'C'], hint: 'The D blues scale: D F G Ab A C. Try F to F# hammer-ons on the 4th string.' },
      { id: 'minor', label: 'D minor', notes: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'], hint: 'D natural minor. The open F# clashes here, so fret or avoid the 3rd string.' },
    ],
    chords: [
      { group: 'The open chord and friends', name: 'D', frets: [0, 0, 0, 0, 0, 0], fingers: [0, 0, 0, 0, 0, 0], tones: ['D', 'F#', 'A'], tip: 'All open. No fingers needed.' },
      { group: 'The open chord and friends', name: 'Dsus4', frets: [0, 0, 0, 1, 0, 0], fingers: [0, 0, 0, 1, 0, 0], tones: ['D', 'G', 'A'] },
      { group: 'The open chord and friends', name: 'D7', frets: [0, 0, 0, 0, 3, 0], fingers: [0, 0, 0, 0, 3, 0], tones: ['D', 'F#', 'A', 'C'], tip: 'Leads nicely to G.' },
      { group: 'The open chord and friends', name: 'Dmaj7', frets: [0, 0, 0, 0, 4, 0], fingers: [0, 0, 0, 0, 4, 0], tones: ['D', 'F#', 'A', 'C#'] },
      { group: 'The open chord and friends', name: 'Dm', frets: [0, 0, 3, 3, 0, 0], fingers: [0, 0, 1, 2, 0, 0], tones: ['D', 'F', 'A'] },
      { group: 'The open chord and friends', name: 'G/D', frets: [null, null, 0, 1, 2, 0], fingers: [0, 0, 0, 1, 2, 0], tones: ['G', 'B', 'D'], tip: 'A small G near the nut, over the open D.' },
      { group: 'The open chord and friends', name: 'Bm', frets: [null, 2, 0, 0, 2, 0], fingers: [0, 1, 0, 0, 2, 0], tones: ['B', 'D', 'F#'] },
      { group: 'The open chord and friends', name: 'Em7', frets: [2, 2, 0, 1, 2, 0], fingers: [2, 3, 0, 1, 4, 0], tones: ['E', 'G', 'B', 'D'] },
      { group: 'Barre chords', name: 'G', frets: [5, 5, 5, 5, 5, 5], fingers: [1, 1, 1, 1, 1, 1], tones: ['G', 'B', 'D'], tip: 'One finger across fret 5.' },
      { group: 'Barre chords', name: 'A', frets: [7, 7, 7, 7, 7, 7], fingers: [1, 1, 1, 1, 1, 1], tones: ['A', 'C#', 'E'], tip: 'One finger across fret 7.' },
      { group: 'Barre chords', name: 'E', frets: [2, 2, 2, 2, 2, 2], fingers: [1, 1, 1, 1, 1, 1], tones: ['E', 'G#', 'B'], tip: 'Fret 2: the V of A.' },
      { group: 'Barre chords', name: 'F', frets: [3, 3, 3, 3, 3, 3], fingers: [1, 1, 1, 1, 1, 1], tones: ['F', 'A', 'C'], tip: 'Fret 3: a bluesy flat-three chord in D.' },
      { group: 'Barre chords', name: 'Gm', frets: [null, null, 5, 4, 5, 5], fingers: [0, 0, 2, 1, 3, 4], tones: ['G', 'Bb', 'D'], tip: 'The 3rd string one fret lower makes it minor.' },
      { group: 'Barre chords', name: 'Am', frets: [null, 0, 7, 6, 7, 7], fingers: [0, 0, 2, 1, 3, 4], tones: ['A', 'C', 'E'] },
    ],
    practiceTip: 'Play "Open D 1" and "Open D 2" first: they teach the two ideas everything else uses. Amazing Grace is the gentlest song to start with.',
  },
]
