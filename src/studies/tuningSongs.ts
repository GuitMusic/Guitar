import type { Study } from './studies'

/**
 * Songs and exercises in DADGAD and Open D. The songs are public-domain tunes placed by
 * scripts/arrange/arrange.py ("alt-*" specs in specs.json): melody, bass and an open-string
 * drone, picked for each tuning. The studies are original exercises written for the app.
 */

/** alphaTex tuning, string 1 (highest) first */
const TEX_TUNING = { dadgad: 'd4 a3 g3 d3 a2 d2', 'open-d': 'd4 a3 f#3 d3 a2 d2' } as const

const header = (title: string, tempo: number, tuning: keyof typeof TEX_TUNING, subtitle = 'Original exercise', extra = '') =>
  `\\title "${title}"\n\\subtitle "${subtitle}"\n\\tempo ${tempo}\n\\track "Guitar"\n\\instrument acousticguitarsteel\n\\tuning (${TEX_TUNING[tuning]})\n${extra}`

export const TUNING_STUDIES: Study[] = [
  {
    id: 'study-dadgad-1-open-drone',
    level: 1,
    kind: 'study',
    tuning: 'dadgad',
    title: 'DADGAD 1: Open Strings and Drones',
    description:
      'Your first sounds in DADGAD. Start on all open strings (Dsus4), then add one finger at a time: D5, D major, D minor, Dsus2. The thumb keeps the low D ringing.',
    tex:
      header('DADGAD 1: Open Strings and Drones', 72, 'dadgad') +
      `:8 0.6{rf 1} 0.3{rf 2} 0.2{rf 3} 0.1{rf 4} 0.4{rf 1} 0.3{rf 2} 0.2{rf 3} 0.3{rf 2} |
0.6{rf 1} 2.3{lf 2 rf 2} 0.2{rf 3} 0.1{rf 4} 0.4{rf 1} 2.3{rf 2} 0.2{rf 3} 2.3{rf 2} |
0.6{rf 1} 2.3{lf 2 rf 2} 0.2{rf 3} 0.1{rf 4} 4.4{lf 4 rf 1} 2.3{rf 2} 0.2{rf 3} 2.3{rf 2} |
0.6{rf 1} 2.3{lf 2 rf 2} 0.2{rf 3} 0.1{rf 4} 3.4{lf 3 rf 1} 2.3{rf 2} 0.2{rf 3} 2.3{rf 2} |
0.6{rf 1} 2.3{lf 3 rf 2} 0.2{rf 3} 0.1{rf 4} 2.4{lf 2 rf 1} 2.3{rf 2} 0.2{rf 3} 2.3{rf 2} |
0.6 0.3 0.2 0.1 0.4 0.3 0.2 0.3 |
(0.6{rf 1} 0.5 0.4 0.3{rf 2} 0.2{rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-dadgad-2-campanella',
    level: 2,
    kind: 'study',
    tuning: 'dadgad',
    title: 'DADGAD 2: The Ringing Scale',
    description:
      'The D major scale played across the strings so every note keeps ringing into the next, like a harp. This "campanella" sound is the heart of DADGAD playing.',
    tex:
      header('DADGAD 2: The Ringing Scale', 66, 'dadgad') +
      `:8 0.4{rf 1} 2.4{lf 2 rf 1} 4.4{lf 4 rf 1} 0.3{rf 2} 0.2{rf 3} 2.2{lf 2 rf 2} 4.2{lf 4 rf 3} 0.1{rf 4} |
0.1{rf 4} 4.2{lf 4 rf 3} 2.2{lf 2 rf 2} 0.2{rf 3} 0.3{rf 2} 4.4{lf 4 rf 1} 2.4{lf 2 rf 1} 0.4{rf 1} |
(0.6{rf 1} 0.1{rf 4}) 2.1{lf 2 rf 3} 4.1{lf 4 rf 4} 5.1{lf 5 rf 3} 4.1{lf 4 rf 4} 2.1{lf 2 rf 3} 0.1{rf 4} 4.2{lf 4 rf 3} |
(0.6{rf 1} 2.2{lf 2 rf 3}) 0.2{rf 2} 0.3{rf 2} 4.4{lf 4 rf 1} 2.4{lf 2 rf 1} 0.4{rf 1} 0.5{rf 1} 0.4{rf 1} |
0.4 2.4{lf 2} 4.4{lf 4} 0.3 0.2 2.2{lf 2} 4.2{lf 4} 0.1 |
(0.6 0.1) 2.1{lf 2} 4.1{lf 4} 5.1{lf 5} 4.1{lf 4} 2.1{lf 2} 0.1 4.2{lf 4} |
(0.6{rf 1} 0.4 4.4{lf 4} 2.3{lf 2} 0.2{rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-dadgad-3-chord-walk',
    level: 2,
    kind: 'study',
    tuning: 'dadgad',
    title: 'DADGAD 3: Chord Walk',
    description:
      'Four DADGAD chord shapes in a p-i-m-a pattern: D, G, Bm7 and A. Open strings ring through every chord, so each change sounds smooth even when the hand moves.',
    tex:
      header('DADGAD 3: Chord Walk', 76, 'dadgad') +
      `:8 0.6{rf 1} 2.3{lf 2 rf 2} 0.2{rf 3} 0.1{rf 4} 4.4{lf 4 rf 1} 2.3{rf 2} 0.2{rf 3} 2.3{rf 2} |
5.6{lf 4 rf 1} 0.3{rf 2} 2.2{lf 2 rf 3} 0.1{rf 4} 5.5{lf 5 rf 1} 0.3{rf 2} 2.2{rf 3} 0.3{rf 2} |
2.5{lf 2 rf 1} 4.3{lf 5 rf 2} 0.2{rf 3} 0.1{rf 4} 4.4{lf 4 rf 1} 4.3{rf 2} 0.2{rf 3} 4.3{rf 2} |
0.5{rf 1} 2.3{lf 3 rf 2} 4.2{lf 5 rf 3} 2.3{rf 2} 2.4{lf 2 rf 1} 2.3{rf 2} 0.2{rf 3} 0.1{rf 4} |
0.6 2.3{lf 2} 0.2 0.1 4.4{lf 4} 2.3 0.2 2.3 |
5.6{lf 4} 0.3 2.2{lf 2} 0.1 5.5{lf 5} 0.3 2.2 0.3 |
2.5{lf 2} 4.3{lf 5} 0.2 0.1 4.4{lf 4} 4.3 0.2 4.3 |
0.5 2.3{lf 3} 4.2{lf 5} 2.3 2.4{lf 2} 2.3 0.2 0.1 |
(0.6{rf 1} 0.5 4.4{lf 4} 2.3{lf 2} 0.2{rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-dadgad-4-mixolydian-jig',
    level: 3,
    kind: 'study',
    tuning: 'dadgad',
    title: 'DADGAD 4: Mixolydian Jig',
    description:
      'An original jig in 6/8 on the D Mixolydian scale (a D major scale with C instead of C#), the sound of countless Irish tunes. The thumb plays the low D and A on beats 1 and 4.',
    tex:
      header('DADGAD 4: Mixolydian Jig', 96, 'dadgad', 'Original exercise', '\\ts 6 8\n') +
      `:8 (0.6{rf 1} 0.1{rf 4}) 2.1{lf 2 rf 3} 4.1{lf 4 rf 2} (0.5{rf 1} 5.1{lf 5 rf 3}) 4.1{lf 4 rf 2} 2.1{lf 2 rf 3} |
(0.6{rf 1} 0.1{rf 4}) 3.2{lf 3 rf 3} 0.2{rf 2} (0.5{rf 1} 3.2{lf 3 rf 3}) 0.1{rf 4} 2.1{lf 2 rf 3} |
(0.6{rf 1} 4.1{lf 4 rf 4}) 2.1{lf 2 rf 3} 0.1{rf 4} (0.5{rf 1} 3.2{lf 3 rf 3}) 0.2{rf 2} 2.2{lf 2 rf 3} |
(0.6 0.1).4 {d} :8 (0.5 0.2) 2.2{lf 2} 3.2{lf 3} |
(0.6 0.1) 2.1{lf 2} 4.1{lf 4} (0.5 5.1{lf 5}) 4.1{lf 4} 2.1{lf 2} |
(0.6 4.1{lf 4}) 5.1{lf 5} 4.1{lf 4} (0.5 2.1{lf 2}) 0.1 3.2{lf 3} |
(0.6 0.2) 3.2{lf 3} 0.1 (0.5 2.1{lf 2}) 0.1 3.2{lf 3} |
(0.6 0.4 0.1).2 {d}`,
  },
  {
    id: 'study-dadgad-5-hijaz',
    level: 3,
    kind: 'study',
    tuning: 'dadgad',
    title: 'DADGAD 5: Hijaz Drone',
    description:
      'The Hijaz maqam on D (D Eb F# G A Bb C), the scale behind many Arab and Moroccan melodies, over the open D drone. DADGAD lets the low strings hum like an oud while the melody moves on top.',
    tex:
      header('DADGAD 5: Hijaz Drone', 70, 'dadgad') +
      `:8 0.6{rf 1} 0.4{rf 1} 1.4{lf 2 rf 2} 4.4{lf 5 rf 3} 0.3{rf 2} 4.4{rf 3} 1.4{rf 2} 0.4{rf 1} |
0.6{rf 1} 0.3{rf 2} 0.2{rf 3} 1.2{lf 2 rf 2} 3.2{lf 4 rf 3} 1.2{rf 2} 0.2{rf 3} 0.3{rf 2} |
(0.6{rf 1} 0.1{rf 4}) 1.1{lf 2 rf 3} 4.1{lf 5 rf 4} 1.1{rf 3} 0.1{rf 4} 3.2{lf 4 rf 3} 1.2{lf 2 rf 2} 0.2{rf 3} |
(0.5{rf 1} 0.3{rf 2}) 4.4{lf 5 rf 1} 1.4{lf 2 rf 1} 0.4{rf 1} (0.5 0.3) 4.4{lf 5} 1.4{lf 2} 0.4 |
0.6 0.4 1.4{lf 2} 4.4{lf 5} 0.3 4.4 1.4 0.4 |
0.6 0.3 0.2 1.2{lf 2} 3.2{lf 4} 1.2 0.2 0.3 |
(0.6 0.1) 1.1{lf 2} 4.1{lf 5} 1.1 0.1 3.2{lf 4} 1.2{lf 2} 0.2 |
(0.6{rf 1} 0.5 4.4{lf 4} 2.3{lf 2} 0.2{rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-open-d-1-barre',
    level: 1,
    kind: 'study',
    tuning: 'open-d',
    title: 'Open D 1: One Finger, Any Chord',
    description:
      'In Open D the open strings already make a D major chord, so laying one finger flat across any fret gives another major chord: fret 5 is G, fret 7 is A, fret 12 is D an octave up.',
    tex:
      header('Open D 1: One Finger, Any Chord', 72, 'open-d') +
      `:8 0.6{rf 1} 0.3{rf 2} 0.2{rf 3} 0.1{rf 4} 0.4{rf 1} 0.3{rf 2} 0.2{rf 3} 0.3{rf 2} |
5.6{lf 2 rf 1} 5.3{lf 2 rf 2} 5.2{lf 2 rf 3} 5.1{lf 2 rf 4} 5.4{lf 2 rf 1} 5.3{rf 2} 5.2{rf 3} 5.3{rf 2} |
7.6{lf 2 rf 1} 7.3{lf 2 rf 2} 7.2{lf 2 rf 3} 7.1{lf 2 rf 4} 7.4{lf 2 rf 1} 7.3{rf 2} 7.2{rf 3} 7.3{rf 2} |
0.6 0.3 0.2 0.1 0.4 0.3 0.2 0.3 |
12.6{lf 2} 12.3{lf 2} 12.2{lf 2} 12.1{lf 2} 12.4{lf 2} 12.3 12.2 12.3 |
10.6{lf 2} 10.3{lf 2} 10.2{lf 2} 10.1{lf 2} 10.4{lf 2} 10.3 10.2 10.3 |
7.6{lf 2} 7.3{lf 2} 7.2{lf 2} 7.1{lf 2} 7.4{lf 2} 7.3 7.2 7.3 |
(0.6{rf 1} 0.5 0.4 0.3{rf 2} 0.2{rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-open-d-2-minor',
    level: 2,
    kind: 'study',
    tuning: 'open-d',
    title: 'Open D 2: Major to Minor',
    description:
      'The 3rd string carries the chord’s third. Fret it one fret lower than the rest and a major chord turns minor: G to Gm, A to Am, D to Dm.',
    tex:
      header('Open D 2: Major to Minor', 72, 'open-d') +
      `:8 5.6{lf 2 rf 1} 5.3{lf 2 rf 2} 5.2{lf 2 rf 3} 5.1{lf 2 rf 4} 5.4{lf 2 rf 1} 5.3{rf 2} 5.2{rf 3} 5.3{rf 2} |
0.6{rf 1} 4.3{lf 2 rf 2} 5.2{lf 4 rf 3} 5.1{lf 5 rf 4} 5.4{lf 3 rf 1} 4.3{rf 2} 5.2{rf 3} 4.3{rf 2} |
7.6{lf 2 rf 1} 7.3{lf 2 rf 2} 7.2{lf 2 rf 3} 7.1{lf 2 rf 4} 7.4{lf 2 rf 1} 7.3{rf 2} 7.2{rf 3} 7.3{rf 2} |
0.5{rf 1} 6.3{lf 2 rf 2} 7.2{lf 4 rf 3} 7.1{lf 5 rf 4} 7.4{lf 3 rf 1} 6.3{rf 2} 7.2{rf 3} 6.3{rf 2} |
0.6 0.3 0.2 0.1 0.4 0.3 0.2 0.3 |
0.6{rf 1} 3.3{lf 3 rf 2} 0.2{rf 3} 0.1{rf 4} 3.4{lf 2 rf 1} 3.3{rf 2} 0.2{rf 3} 3.3{rf 2} |
(0.6{rf 1} 0.5 0.4 0.3{rf 2} 0.2{rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-open-d-3-thumb-drone',
    level: 2,
    kind: 'study',
    tuning: 'open-d',
    title: 'Open D 3: Melody over a Thumb Drone',
    description:
      'The thumb rocks between the low D strings on every beat while i and m play the D major scale on the top two strings. Keep the thumb steady and let the melody float.',
    tex:
      header('Open D 3: Melody over a Thumb Drone', 80, 'open-d') +
      `:8 (0.6{rf 1} 0.2{rf 3}) 2.2{lf 2 rf 2} (0.4{rf 1} 4.2{lf 4 rf 3}) 0.1{rf 2} (0.6{rf 1} 2.1{lf 2 rf 3}) 4.1{lf 4 rf 2} (0.4{rf 1} 5.1{lf 5 rf 3}) 4.1{lf 4 rf 2} |
(0.6{rf 1} 2.1{lf 2 rf 3}) 0.1{rf 2} (0.4{rf 1} 4.2{lf 4 rf 3}) 2.2{lf 2 rf 2} (0.6{rf 1} 0.2{rf 3}) 2.2{lf 2 rf 2} (0.4{rf 1} 0.1{rf 3}).4 |
:8 (0.6 4.1{lf 2}) 5.1{lf 3} (0.4 7.1{lf 5}) 5.1{lf 3} (0.6 4.1{lf 2}) 2.1{lf 2} (0.4 0.1) 2.1{lf 2} |
(0.6 4.1{lf 4}) 2.1{lf 2} (0.4 0.1) 4.2{lf 4} (0.6 2.2{lf 2}) 0.2 (0.4 2.2{lf 2}) 4.2{lf 4} |
(0.6{rf 1} 0.1{rf 4}).2 (0.4{rf 1} 0.3{rf 2} 0.2{rf 3} 0.1{rf 4}).2`,
  },
  {
    id: 'study-open-d-4-hammer-blues',
    level: 3,
    kind: 'study',
    tuning: 'open-d',
    title: 'Open D 4: Hammer-on Blues',
    description:
      'Bluesy hammer-ons in Open D: from F up to F# on the 4th string, and a ringing barre with a hammer on the 3rd string for G and A. The open strings fill in the rest.',
    tex:
      header('Open D 4: Hammer-on Blues', 76, 'open-d') +
      `:8 0.6{rf 1} 3.4{lf 3 rf 1 h} 4.4{lf 4} 0.3{rf 2} 0.6{rf 1} 0.2{rf 3} 0.3{rf 2} 0.4{rf 1} |
0.6{rf 1} 0.1{rf 4 h} 3.1{lf 4} 0.2{rf 3} 0.6{rf 1} 3.1{lf 3 rf 4 h} 4.1{lf 4} 0.2{rf 3} |
5.6{lf 2 rf 1} 5.3{lf 2 rf 2} 5.2{lf 2 rf 3} 5.1{lf 2 rf 4} 5.6{rf 1} 5.3{rf 2 h} 7.3{lf 4} 5.2{rf 3} |
0.6 3.4{lf 3 h} 4.4{lf 4} 0.3 0.6 0.2 0.3 0.4 |
7.6{lf 2} 7.3{lf 2} 7.2{lf 2} 7.1{lf 2} 7.6 7.3{h} 9.3{lf 4} 7.2 |
5.6{lf 2} 5.3{lf 2} 5.2{lf 2} 5.1{lf 2} 5.6 5.3{h} 7.3{lf 4} 5.2 |
0.6 3.4{lf 3 h} 4.4{lf 4} 0.3 0.6 0.2 0.3 0.4 |
(0.6{rf 1} 0.5 0.4 0.3{rf 2} 0.2{rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-open-d-5-travis',
    level: 3,
    kind: 'study',
    tuning: 'open-d',
    title: 'Open D 5: Travis Picking',
    description:
      'Alternating-thumb Travis picking in Open D over D, G, A and Bm. The thumb alternates between the 6th and 4th strings while the fingers add a melody note on top.',
    tex:
      header('Open D 5: Travis Picking', 84, 'open-d') +
      `:8 (0.6{rf 1} 0.1{rf 4}) 0.2{rf 3} 0.4{rf 1} 0.3{rf 2} (0.6{rf 1} 2.1{lf 2 rf 4}) 0.2{rf 3} 0.4{rf 1} 0.3{rf 2} |
(5.6{lf 2 rf 1} 5.1{lf 2 rf 4}) 5.2{lf 2 rf 3} 5.4{lf 2 rf 1} 5.3{lf 2 rf 2} (5.6{rf 1} 7.1{lf 4 rf 4}) 5.2{rf 3} 5.4{rf 1} 5.3{rf 2} |
(0.6 0.1) 0.2 0.4 0.3 (0.6 2.1{lf 2}) 0.2 0.4 0.3 |
(7.6{lf 2} 7.1{lf 2}) 7.2{lf 2} 7.4{lf 2} 7.3{lf 2} (7.6 9.1{lf 4}) 7.2 7.4 7.3 |
(0.6 2.1{lf 2}) 0.2 0.4 0.3 (0.6 0.1) 0.2 0.4 0.3 |
(2.5{lf 2} 0.1) 2.2{lf 3} 0.4 0.3 (2.5 0.1) 2.2 0.4 0.3 |
(5.6{lf 2} 5.1{lf 2}) 5.2{lf 2} 5.4{lf 2} 5.3{lf 2} (7.6{lf 2} 7.1{lf 2}) 7.2{lf 2} 7.4{lf 2} 7.3{lf 2} |
(0.6{rf 1} 0.5 0.4 0.3{rf 2} 0.2{rf 3} 0.1{rf 4}).1`,
  },
]

export const TUNING_SONGS: Study[] = [
  {
    id: 'song-dadgad-blindmary',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Blind Mary",
    description: "A gentle air by the blind Irish harper O'Carolan. The melody sits on the top strings while the open D and A strings hum underneath like a harp. Key of D.",
    tex:
      header("Blind Mary", 72, 'dadgad', "Turlough O'Carolan (1670-1738), arranged for this app") +
      `\\ts 1 8 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).8 |
\\ts 2 4 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 0.1{rf 4}.8 {d} 4.2{lf 4 rf 3}.16 |
(2.2{lf 2 rf 3} 5.6{lf 5 rf 1} 0.4{rf 1}).4 0.2{rf 3}.8 4.4{lf 4 rf 1}.16 0.3{rf 2}.16 |
(0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).8 {d} 2.2{lf 2 rf 3}.16 0.2{rf 3}.8 4.4{lf 4 rf 1}.8 |
(2.4{lf 2} 2.6{lf 2}).4 {d} 4.4{lf 4}.16 0.3.16 |
(0.2 0.6 0.5).8 4.1{lf 4}.8 4.1{lf 4}.8 {d} 2.1{lf 2}.16 |
(0.1 0.6 0.5).8 2.2{lf 2}.8 0.2.8 0.4.16 2.4{lf 2}.16 |
(4.4{lf 4} 0.6 0.5).8 {d} 0.3.16 2.4{lf 2}.8 {d} 0.4.16 |
\\ts 3 8 (0.4 0.6 0.5).4 {d} |
\\ts 1 8 (0.1 0.6 0.5).16 2.1{lf 2}.16 |
\\ts 2 4 (4.1{lf 4} 2.5{lf 2}).8 {d} 5.1{lf 5}.16 4.1{lf 4}.8 2.2{lf 2}.8 |
(2.1{lf 2} 0.5).8 {d} 4.2{lf 4}.16 0.2.8 2.2{lf 2}.16 4.2{lf 4}.16 |
(0.1 0.6 0.5).8 {d} 0.4.16 0.4.8 2.4{lf 2}.16 4.4{lf 4}.16 |
(2.4{lf 2} 0.5).4 {d} 0.2.16 0.3.16 |
(4.4{lf 4} 0.6 0.5).8 {d} 0.3.16 0.2.8 0.1.8 |
(4.1{lf 4} 0.6 0.5).8 {d} 2.1{lf 2}.16 0.1.8 0.4.16 2.4{lf 2}.16 |
(4.4{lf 4} 0.6 0.5).8 {d} 0.3.16 2.4{lf 2}.8 {d} 0.4.16 |
\\ts 3 8 (0.4 0.6 0.5).4 {d}`,
  },
  {
    id: 'song-dadgad-eileen',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Eileen Aroon",
    description: "One of the oldest Irish love songs. Slow and singing: let each melody note ring into the next over the open-string drone. Key of D.",
    tex:
      header("Eileen Aroon", 76, 'dadgad', "Old Irish air, arranged for this app") +
      `\\ts 1 4 (0.1{rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).8 2.2{lf 2 rf 3}.8 |
\\ts 3 4 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).4 2.2{lf 2 rf 3}.4 0.1{rf 4}.8 2.2{lf 2 rf 3}.8 |
(0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 2.1{lf 2 rf 4}.4 4.1{lf 4 rf 4}.4 |
(4.4{lf 4 rf 1} 0.6{rf 1} 0.5{rf 1}).4 0.2{rf 3}.4 2.1{lf 2 rf 4}.8 0.1{rf 4}.8 |
(2.2{lf 2} 5.6{lf 5} 0.4).2 0.1.8 2.2{lf 2}.8 |
(0.2 0.6 0.5).4 2.2{lf 2}.4 0.1.8 2.2{lf 2}.8 |
(0.1 0.6 0.5).4 2.1{lf 2}.4 4.1{lf 4}.4 |
(4.4{lf 4} 0.6 0.5).4 0.2.4 2.2{lf 2}.8 0.1.8 |
\\ts 2 4 (0.1 0.6 0.5).2 |
\\ts 1 4 (0.1 0.6 0.5).8 4.1{lf 4}.8 |
\\ts 3 4 (5.1{lf 5} 0.6 0.5).8 5.1{lf 5}.8 4.1{lf 4}.4 4.1{lf 4}.8 2.1{lf 2}.8 |
(4.1{lf 4} 0.6 0.5).8 7.1{lf 5}.8 7.1{lf 5}.4 4.1{lf 2}.8 7.2{lf 5}.8 |
(0.1 5.6{lf 3} 0.4).8 0.1.8 7.2{lf 5}.4 0.1.8 4.3{lf 2}.8 |
(0.2 0.6 0.5).2 4.1{lf 2}.4 |
(7.1{lf 5} 0.6 0.5).4 4.1{lf 2}.8 7.2{lf 5}.8 0.1.8 4.3{lf 2}.8 |
(0.1 0.6 0.5).8 7.2{lf 5}.8 4.1{lf 2}.2 |
(4.4{lf 2} 0.6 0.5).4 0.2.4 4.3{lf 2}.8 0.1.8 |
\\ts 2 4 (0.1 0.6 0.5).2`,
  },
  {
    id: 'song-dadgad-parting',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "The Parting Glass",
    description: "The classic farewell song. In DADGAD the open strings keep ringing between phrases, so it sounds bigger than the notes you play. Key of A.",
    tex:
      header("The Parting Glass", 76, 'dadgad', "Irish and Scottish traditional, arranged for this app") +
      `\\ts 1 4 (2.1{lf 3 rf 4} 0.5{rf 1}).8 {d} 0.1{rf 4}.16 |
\\ts 4 4 (4.2{lf 5 rf 3} 0.5{rf 1}).4 2.2{lf 3 rf 3}.8 {d} 4.2{lf 5 rf 3}.16 (0.2{rf 3} 0.5{rf 1}).4 0.2{rf 3}.8 2.2{lf 3 rf 3}.8 |
(4.2{lf 5 rf 3} 0.5{rf 1}).8 0.1{rf 4}.8 2.1{lf 3 rf 4}.8 4.2{lf 5 rf 3}.8 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 4.2{lf 5 rf 3}.8 {d} 0.1{rf 4}.16 |
(2.1{lf 3 rf 4} 0.5{rf 1}).4 7.1{lf 5 rf 4}.8 {d} 4.1{lf 2 rf 4}.16 (5.1{lf 3 rf 4} 0.6{rf 1} 0.5{rf 1}).8 4.1{lf 5 rf 4}.8 2.1{lf 3 rf 4}.8 0.1{rf 4}.8 |
(4.2{lf 5} 0.5).4 0.2.4 (1.3{lf 2} 2.6{lf 3}).4 2.1{lf 3}.8 {d} 0.1.16 |
(4.2{lf 5} 0.5).4 2.2{lf 3}.8 {d} 4.2{lf 5}.16 (0.2 0.5).4 0.2.8 2.2{lf 3}.8 |
\\ts 3 4 (4.2{lf 5} 0.5).8 0.1.8 2.1{lf 3}.8 4.2{lf 5}.8 (4.2{lf 5} 0.5).8 {d} 0.1.16 |
\\ts 4 4 (2.1{lf 3} 0.5).4 7.1{lf 5}.8 {d} 4.1{lf 2}.16 (5.1{lf 3} 0.6 0.5).8 4.1{lf 2}.8 7.2{lf 5}.8 0.1.8 |
\\ts 3 4 (4.2{lf 2} 0.5).4 0.2.4 (0.2 0.5).4 |
\\ts 1 4 (7.2{lf 5} 0.5).8 {d} 4.1{lf 2}.16 |
\\ts 4 4 (5.1{lf 3} 0.6 0.5).8 4.1{lf 2}.8 6.1{lf 4}.8 7.1{lf 5}.8 (6.1{lf 5} 2.6{lf 2}).8 4.1{lf 4}.8 2.1{lf 2}.8 0.1.8 |
(2.1{lf 2} 0.5).4 7.1{lf 4}.4 (7.1{lf 4} 0.5).4 9.1{lf 5}.8 7.1{lf 4}.8 |
(5.1{lf 2} 0.6 0.5).8 4.1{lf 5}.8 2.1{lf 3}.8 0.1.8 (4.2{lf 5} 0.5).8 2.2{lf 3}.8 0.1.8 2.1{lf 3}.8 |
(2.1{lf 3} 0.5).4 0.3.4 (1.3{lf 2} 2.6{lf 3}).4 2.1{lf 3}.8 {d} 0.1.16 |
(4.2{lf 5} 0.5).4 2.2{lf 3}.8 {d} 4.2{lf 5}.16 (0.2 0.5).4 0.2.8 2.2{lf 3}.8 |
\\ts 3 4 (4.2{lf 5} 0.5).8 0.1.8 2.1{lf 3}.8 4.2{lf 5}.8 (4.2{lf 5} 0.5).8 {d} 0.1.16 |
\\ts 4 4 (2.1{lf 3} 0.5).4 7.1{lf 5}.8 {d} 4.1{lf 2}.16 (5.1{lf 3} 0.6 0.5).8 4.1{lf 2}.8 7.2{lf 5}.8 0.1.8 |
\\ts 3 4 (4.2{lf 2} 0.5).4 0.2.4 (0.2 0.5).4`,
  },
  {
    id: 'song-dadgad-foggy',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "The Foggy Dew",
    description: "A haunting minor-key air. A good first taste of minor keys in DADGAD, where the open G and D strings fit right in. Key of G minor.",
    tex:
      header("The Foggy Dew", 70, 'dadgad', "Old Irish air, arranged for this app") +
      `\\ts 1 4 (8.1{lf 2 rf 4} 8.6{lf 2 rf 1}).8 7.1{lf 5 rf 4}.8 |
\\ts 2 4 (5.1{lf 5 rf 4} 1.6{lf 2 rf 1}).8 7.1{lf 5 rf 4}.8 5.1{lf 3 rf 4}.8 3.1{lf 4 rf 4}.8 |
(0.1{rf 4} 1.5{lf 2 rf 1}).4 1.2{lf 2 rf 3}.8 0.1{rf 4}.8 |
(3.2{lf 2 rf 3} 3.6{lf 2 rf 1}).8 0.1{rf 4}.8 3.2{lf 2 rf 3}.8 0.2{rf 3}.8 |
(3.4{lf 2} 3.6{lf 2}).4 0.3.8 0.2.8 |
(1.2{lf 2} 1.5{lf 2}).4 3.2{lf 4}.8 1.2{lf 2}.8 |
(0.3 1.6{lf 2}).4 0.3.4 |
(0.3 1.6{lf 2}).2 |
\\ts 1 4 (3.4{lf 4} 1.5{lf 2}).4 |
(0.1 1.5{lf 2}).4 |
\\ts 2 4 (0.3 1.6{lf 2}).4 0.3.4 |
(1.2{lf 2} 1.5{lf 2}).8 3.2{lf 4}.8 0.1.8 1.1{lf 2}.8 |
(3.1{lf 4} 1.5{lf 2}).4 0.1.8 3.2{lf 4}.8 |
(1.2{lf 2} 1.5{lf 2}).4 3.2{lf 4}.4 |
(0.1 5.6{lf 4} 0.4).4 5.1{lf 4}.4 |
(3.1{lf 2} 3.6{lf 2}).4 7.1{lf 5}.4 |
(5.1{lf 5} 1.6{lf 2}).2 |
\\ts 1 4 (5.1{t} 1.5{lf 2}).4`,
  },
  {
    id: 'song-dadgad-receipt',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Carolan's Receipt",
    description: "O'Carolan's lively 'recipe for drinking'. Melody in G with ringing open strings: a classic DADGAD sound. Key of G.",
    tex:
      header("Carolan's Receipt", 84, 'dadgad', "Turlough O'Carolan, arranged for this app") +
      `\\ts 1 8 (5.1{lf 2 rf 4} 5.6{lf 2 rf 1} 0.4{rf 1}).16 {d} 4.1{lf 4 rf 4}.32 |
\\ts 2 4 (2.1{lf 2 rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).16 0.1{rf 4}.16 3.2{lf 3 rf 3}.16 2.2{lf 2 rf 3}.16 3.2{lf 3 rf 3}.16 2.2{lf 2 rf 3}.16 0.2{rf 3}.16 0.3{rf 2}.16 |
(2.4{lf 2 rf 1} 3.5{lf 3 rf 1}).8 0.3{rf 2}.16 {d} 0.2{rf 3}.32 0.3{rf 2}.8 5.1{lf 5 rf 4}.16 {d} 4.1{lf 4 rf 4}.32 |
(2.1{lf 2 rf 4} 3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).16 0.1{rf 4}.16 3.2{lf 3 rf 3}.16 2.2{lf 2 rf 3}.16 3.2{lf 3 rf 3}.16 2.2{lf 2 rf 3}.16 3.2{lf 3 rf 3}.16 0.1{rf 4}.16 |
(2.1{lf 2} 0.5).8 0.2.16 2.2{lf 2}.16 0.2.8 2.2{lf 2}.16 3.2{lf 3}.16 |
(0.1 5.6{lf 5} 0.4).16 2.2{lf 2}.16 0.1.16 2.1{lf 2}.16 0.1.8 2.2{lf 2}.16 0.1.16 |
(2.1{lf 2} 3.5{lf 3} 5.4{lf 5}).16 5.1{lf 5}.16 4.1{lf 4}.16 7.1{lf 5}.16 5.1{lf 5}.8 4.1{lf 4}.16 5.1{lf 5}.16 |
(2.1{lf 2} 3.5{lf 3} 5.4{lf 5}).16 0.1.16 3.2{lf 3}.16 2.2{lf 2}.16 3.2{lf 3}.16 2.2{lf 2}.16 0.2.16 0.3.16 |
\\ts 5 16 (2.4{lf 2} 3.5{lf 3}).8 0.3.16 {d} 0.2.32 0.3.16 |
\\ts 1 8 (2.2{lf 2} 5.6{lf 5} 0.4).16 3.2{lf 3}.16 |
\\ts 2 4 (0.1 5.6{lf 5} 0.4).16 {d} 2.2{lf 2}.32 0.1.16 {d} 2.1{lf 2}.32 0.1.32 2.2{lf 2}.16 {d} 0.2.16 0.3.16 |
(2.4{lf 2} 3.5{lf 3}).16 {d} 4.4{lf 4}.32 0.3.16 {d} 0.2.32 0.3.8 2.2{lf 2}.16 3.2{lf 3}.16 |
(0.1 5.6{lf 5} 0.4).16 2.2{lf 2}.16 0.1.16 2.1{lf 2}.16 0.1.8 2.2{lf 2}.16 0.1.16 |
(2.1{lf 2} 3.5{lf 3} 5.4{lf 5}).16 5.1{lf 5}.16 4.1{lf 4}.16 7.1{lf 5}.16 5.1{lf 5}.4 |
(0.3 5.6{lf 5} 0.4).8 {d} 2.2{lf 2}.16 0.2.8 {d} 3.2{lf 3}.16 |
(2.2{lf 2} 2.6{lf 2}).16 0.2.16 2.2{lf 2}.16 0.1.16 2.1{lf 2}.8 {d} 4.1{lf 4}.16 |
(5.1{lf 4} 5.6{lf 5} 0.4).16 4.1{lf 3}.16 2.1{lf 2}.16 0.1.16 2.2{lf 2}.16 0.2.16 2.2{lf 2}.16 0.1.16 |
(2.1{lf 2} 3.5{lf 3} 5.4{lf 5}).16 5.1{lf 5}.16 4.1{lf 4}.16 7.1{lf 4}.16 5.1{lf 2}.8 5.1{lf 2}.16 7.1{lf 4}.16 |
(9.1{lf 5} 5.6{lf 2} 0.4).16 7.1{lf 4}.16 9.1{lf 5}.16 5.1{lf 2}.16 7.1{lf 4}.16 5.1{lf 2}.16 7.1{lf 4}.16 7.2{lf 4}.16 |
(5.1{lf 4} 5.6{lf 5} 0.4).16 4.1{lf 3}.16 5.1{lf 5}.16 0.1.16 2.1{lf 2}.16 0.1.16 3.2{lf 3}.16 2.2{lf 2}.16 |
(3.2{lf 2} 3.5{lf 2} 5.4{lf 4}).16 2.2{lf 2}.16 3.2{lf 3}.16 0.1.16 2.1{lf 2}.16 4.1{lf 4}.16 5.1{lf 5}.16 4.1{lf 4}.16 |
(2.1{lf 2} 3.5{lf 3} 5.4{lf 5}).16 0.1.16 5.1{lf 5}.16 2.2{lf 2}.16 0.2.8 5.1{lf 5}.16 2.1{lf 2}.16 |
(0.1 5.6{lf 5} 0.4).16 3.2{lf 3}.16 2.2{lf 2}.16 0.2.16 0.3.8 5.1{lf 5}.16 2.1{lf 2}.16 |
(0.1 5.6{lf 5} 0.4).16 2.2{lf 2}.16 0.2.16 0.3.16 2.4{lf 2}.8 0.3.16 0.2.16 |
(2.2{lf 2} 5.6{lf 5} 0.4).16 0.2.16 0.3.16 2.4{lf 2}.16 0.2.16 0.3.16 2.4{lf 2}.16 0.4.16 |
\\ts 3 8 (2.4{lf 2} 5.6{lf 5}).8 0.3.16 0.2.16 0.3.8`,
  },
  {
    id: 'song-dadgad-ocean',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Out on the Ocean",
    description: "A rolling Irish jig in 6/8. Count 1-2-3 4-5-6 and keep the thumb on the first of each group of three. Key of G.",
    tex:
      header("Out on the Ocean", 100, 'dadgad', "Irish jig, arranged for this app") +
      `\\ts 1 8 (2.1{lf 2 rf 4} 3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).8 |
\\ts 6 8 (0.1{rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).8 3.2{lf 3 rf 3}.8 2.2{lf 2 rf 3}.8 2.2{lf 2 rf 3}.8 0.2{rf 3}.8 0.3{rf 2}.8 |
(2.2{lf 2 rf 3} 5.6{lf 5 rf 1} 0.4{rf 1}).8 0.1{rf 4}.8 2.2{lf 2 rf 3}.8 0.2{rf 3}.4 2.2{lf 2 rf 3}.8 |
(0.3{rf 2} 5.6{lf 5 rf 1} 0.4{rf 1}).8 2.4{lf 2 rf 1}.8 0.4{rf 1}.8 0.3{rf 2}.4 0.2{rf 3}.8 |
(2.2{lf 2} 5.6{lf 5} 0.4).8 0.2.8 2.2{lf 2}.8 0.3.8 2.4{lf 2}.8 0.4.8 |
(0.1 5.6{lf 5} 0.4).8 3.2{lf 3}.8 2.2{lf 2}.8 2.2{lf 2}.8 0.2.8 0.3.8 |
(2.2{lf 2} 5.6{lf 5} 0.4).8 0.1.8 2.2{lf 2}.8 0.2.4 2.2{lf 2}.8 |
(0.3 5.6{lf 5} 0.4).8 2.4{lf 2}.8 0.4.8 0.3.4 0.2.8 |
\\ts 5 8 (2.2{lf 2} 5.6{lf 5} 0.4).8 0.3.8 0.3.8 0.3.4 |
\\ts 1 8 (0.1 5.6{lf 5} 0.4).8 |
\\ts 6 8 (2.1{lf 2} 5.6{lf 5} 0.4).8 4.1{lf 4}.8 0.1.8 2.1{lf 2}.8 0.1.8 2.2{lf 2}.8 |
(2.1{lf 2} 2.6{lf 2}).8 4.1{lf 4}.8 2.1{lf 2}.8 4.1{lf 4}.8 0.1.8 2.2{lf 2}.8 |
(0.1 5.6{lf 5} 0.4).8 2.1{lf 2}.8 0.1.8 0.1.8 2.2{lf 2}.8 0.1.8 |
(5.1{lf 4} 5.6{lf 5} 0.4).8 4.1{lf 3}.8 2.1{lf 2}.8 0.1.8 2.2{lf 2}.8 0.2.8 |
(0.3 5.6{lf 5} 0.4).8 4.4{lf 4}.8 0.3.8 0.2.8 0.3.8 0.2.8 |
(2.2{lf 2} 5.6{lf 5} 0.4).8 3.2{lf 3}.8 2.2{lf 2}.8 2.2{lf 2}.4 0.2.8 |
(0.3 5.6{lf 5} 0.4).8 2.4{lf 2}.8 0.4.8 0.3.4 0.2.8 |
\\ts 5 8 (2.2{lf 2} 5.6{lf 5} 0.4).8 0.3.8 0.3.8 0.3.4`,
  },
  {
    id: 'song-dadgad-brianboru',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Brian Boru's March",
    description: "A proud old march in 6/8 named after the High King of Ireland. Minor and modal: DADGAD's natural home. Key of A minor.",
    tex:
      header("Brian Boru's March", 96, 'dadgad', "Irish traditional, arranged for this app") +
      `\\ts 1 8 (2.1{lf 2 rf 4} 3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).16 0.1{rf 4}.16 |
\\ts 6 8 (3.2{lf 3 rf 3} 0.5{rf 1}).8 {d} 2.2{lf 2 rf 3}.16 0.2{rf 3}.8 0.2{rf 3}.4 2.1{lf 2 rf 4}.16 0.1{rf 4}.16 |
(3.2{lf 3 rf 3} 0.5{rf 1}).8 {d} 2.2{lf 2 rf 3}.16 0.2{rf 3}.8 0.2{rf 3}.4 0.1{rf 4}.16 3.2{lf 3 rf 3}.16 |
(2.2{lf 2 rf 3} 5.6{lf 5 rf 1} 0.4{rf 1}).8 {d} 0.2{rf 3}.16 0.3{rf 2}.8 0.3{rf 2}.4 0.1{rf 4}.16 3.2{lf 3 rf 3}.16 |
(2.2{lf 2} 5.6{lf 5} 0.4).8 {d} 0.2.16 0.3.8 0.3.4 2.1{lf 2}.16 0.1.16 |
(3.2{lf 3} 0.5).8 {d} 2.2{lf 2}.16 0.2.8 0.2.4 2.1{lf 2}.16 0.1.16 |
(3.2{lf 3} 0.5).8 {d} 2.2{lf 2}.16 0.2.8 0.2.4 7.1{lf 5}.8 |
(2.1{lf 2} 3.5{lf 3} 5.4{lf 5}).8 {d} 3.1{lf 3}.16 2.1{lf 2}.8 2.1{lf 2}.4 0.1.8 |
\\ts 5 8 (5.3{lf 5} 3.6{lf 3}).16 0.2.8 {d} 0.2.8 0.2.4 |
\\ts 1 8 (0.3 3.5{lf 3}).8 |
\\ts 6 8 (0.2 0.5).8 3.2{lf 3}.8 0.1.8 2.1{lf 2}.4 0.1.8 |
(2.1{lf 2} 2.6{lf 2}).4 0.1.8 2.1{lf 2}.8 0.1.8 2.2{lf 2}.8 |
(0.3 5.6{lf 5} 0.4).8 2.2{lf 2}.8 3.2{lf 3}.8 0.1.4 2.2{lf 2}.8 |
(0.1 5.6{lf 5} 0.4).4 2.2{lf 2}.8 0.1.8 2.2{lf 2}.8 0.3.8 |
(0.2 0.5).8 3.2{lf 3}.8 0.1.8 2.1{lf 2}.4 0.1.8 |
(2.1{lf 2} 0.5).4 0.1.8 2.1{lf 2}.8 3.2{lf 3}.8 0.2.8 |
(3.2{lf 2} 3.5{lf 2} 5.4{lf 4}).8 2.2{lf 2}.8 0.2.8 2.1{lf 2}.4 0.1.8`,
  },
  {
    id: 'song-dadgad-johnston',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Planxty Johnston (first part)",
    description: "The opening strain of an O'Carolan planxty in 6/8, with the low D drone underneath. Key of D.",
    tex:
      header("Planxty Johnston (first part)", 96, 'dadgad', "Turlough O'Carolan, arranged for this app") +
      `\\ts 6 8 (0.1{rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).4 0.1{rf 4}.8 0.1{rf 4}.8 4.2{lf 4 rf 3}.8 2.2{lf 2 rf 3}.8 |
(0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).4 0.3{rf 2}.8 4.4{lf 4 rf 1}.4 0.3{rf 2}.8 |
(2.4{lf 2 rf 1} 0.6{rf 1} 0.5{rf 1}).4 0.2{rf 3}.8 0.4{rf 1}.4 0.1{rf 4}.8 |
(4.2{lf 4 rf 3} 0.5{rf 1}).4 2.2{lf 2 rf 3}.8 0.2{rf 3}.4 7.1{lf 5 rf 4}.8 |
(4.1{lf 2} 0.6 0.5).4 7.2{lf 5}.8 0.1.4 7.2{lf 5}.8 |
(4.1{lf 2} 0.6 0.5).4 5.1{lf 3}.8 7.1{lf 5}.4 9.1{lf 5}.8 |
(7.1{lf 3} 0.6 0.5).4 4.1{lf 5}.8 0.1.4 2.1{lf 3}.8 |
(4.2{lf 5} 0.5).4 0.1.8 2.1{lf 3}.4 4.1{lf 5}.8 |
(2.1{lf 3} 0.5).8 4.2{lf 5}.8 0.2.8 2.1{lf 3}.8 4.2{lf 5}.8 0.2.8`,
  },
  {
    id: 'song-dadgad-lark',
    level: 4,
    kind: 'song',
    tuning: 'dadgad',
    title: "The Lark in the Morning (first part)",
    description: "The first part of a favourite session jig. Quick runs across the strings: let notes on different strings overlap. Key of D.",
    tex:
      header("The Lark in the Morning (first part)", 100, 'dadgad', "Irish jig, arranged for this app") +
      `\\ts 1 8 (2.2{lf 2 rf 3} 0.6{rf 1} 0.5{rf 1}).16 0.2{rf 3}.16 |
\\ts 6 8 (0.3{rf 2} 2.6{lf 2 rf 1}).8 2.4{lf 2 rf 1}.8 2.4{lf 2 rf 1}.8 2.4{lf 2 rf 1}.8 0.3{rf 2}.8 0.2{rf 3}.8 |
(2.2{lf 2 rf 3} 5.6{lf 5 rf 1} 0.4{rf 1}).8 0.2{rf 3}.8 2.2{lf 2 rf 3}.8 2.2{lf 2 rf 3}.8 0.1{rf 4}.8 2.2{lf 2 rf 3}.8 |
(0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).8 4.4{lf 4 rf 1}.8 0.4{rf 1}.8 0.4{rf 1}.8 4.4{lf 4 rf 1}.8 0.2{rf 3}.8 |
(0.2 0.6 0.5).8 4.4{lf 4}.8 0.2.8 0.2.8 2.2{lf 2}.8 3.2{lf 3}.8 |
(2.2{lf 2} 2.6{lf 2}).8 2.4{lf 2}.8 2.4{lf 2}.8 2.4{lf 2}.8 0.3.8 0.2.8 |
(2.2{lf 2} 2.6{lf 2}).8 0.2.8 2.2{lf 2}.8 2.2{lf 2}.8 2.1{lf 2}.8 2.1{lf 2}.8 |
(0.1 5.6{lf 5} 0.4).8 2.2{lf 2}.8 2.2{lf 2}.8 2.2{lf 2}.8 0.2.8 2.2{lf 2}.8 |
\\ts 5 8 (0.3 2.6{lf 2}).8 2.4{lf 2}.8 2.4{lf 2}.8 2.4{lf 2}.4`,
  },
  {
    id: 'song-dadgad-charlie',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Over the Water to Charlie",
    description: "A cheerful Scottish jig in D. The open D strings drone under every bar. Key of D.",
    tex:
      header("Over the Water to Charlie", 100, 'dadgad', "Scottish jig, arranged for this app") +
      `\\ts 6 8 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).4 0.2{rf 3}.8 0.2{rf 3}.8 {d} 2.2{lf 2 rf 3}.16 0.3{rf 2}.8 |
(4.4{lf 4 rf 1} 0.6{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 2.4{lf 2 rf 1}.8 0.4{rf 1}.8 {d} 4.4{lf 4 rf 1}.16 0.3{rf 2}.8 |
(0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).8 {d} 2.2{lf 2 rf 3}.16 0.2{rf 3}.8 0.2{rf 3}.8 4.4{lf 4 rf 1}.8 0.2{rf 3}.8 |
(2.2{lf 2 rf 3} 5.6{lf 5 rf 1} 0.4{rf 1}).4 {d} 0.1{rf 4}.4 {d} |
(0.4 0.6 0.5).4 0.4.8 0.4.8 2.4{lf 2}.8 4.4{lf 4}.8 |
(0.3 0.6 0.5).8 0.2.8 4.4{lf 4}.8 2.4{lf 2}.4 0.4.8 |
(0.1 0.6 0.5).8 4.2{lf 4}.8 2.2{lf 2}.8 0.2.8 4.4{lf 4}.8 0.2.8 |
(2.2{lf 2} 5.6{lf 5} 0.4).4 {d} 0.1.4 {d} |
(0.1 0.6 0.5).4 2.1{lf 2}.8 4.1{lf 4}.8 5.1{lf 5}.8 4.1{lf 4}.8 |
(2.1{lf 2} 0.5).8 4.1{lf 4}.8 0.1.8 2.1{lf 2}.8 4.2{lf 4}.8 0.2.8 |
(0.1 0.6 0.5).4 2.1{lf 2}.8 4.1{lf 4}.8 5.1{lf 5}.8 4.1{lf 4}.8 |
(2.1{lf 2} 0.5).4 {d} 0.2.4 {d} |
(0.1 0.6 0.5).4 2.1{lf 2}.8 4.1{lf 4}.8 5.1{lf 5}.8 4.1{lf 4}.8 |
(2.1{lf 2} 0.5).8 4.1{lf 4}.8 0.1.8 2.1{lf 2}.8 4.2{lf 4}.8 0.2.8 |
(2.2{lf 2} 0.6 0.5).16 4.2{lf 4}.16 0.1.8 2.2{lf 2}.8 0.2.8 4.4{lf 4}.8 0.2.8 |
(2.2{lf 2} 5.6{lf 5} 0.4).4 {d} 0.1.4 {d} |
(0.2 0.6 0.5).8 4.4{lf 4}.8 0.4.8 0.2.8 4.4{lf 4}.8 0.4.8`,
  },
  {
    id: 'song-open-d-arran',
    level: 3,
    kind: 'song',
    tuning: 'open-d',
    title: "Arran Air",
    description: "A calm Scottish air in D. The thumb rocks between the low D and A strings while the melody walks on the top strings. Key of D.",
    tex:
      header("Arran Air", 72, 'open-d', "Scottish traditional, arranged for this app") +
      `\\ts 1 8 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).16 0.3{rf 2}.16 |
\\ts 2 4 (0.4{rf 1} 0.6{rf 1} 0.5{rf 1}).8 0.3{rf 2}.16 1.3{lf 2 rf 2}.16 0.2{rf 3}.8 2.2{lf 3 rf 3}.16 4.2{lf 5 rf 3}.16 |
(0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).16 2.1{lf 3 rf 4}.16 4.1{lf 5 rf 4}.16 0.1{rf 4}.16 2.1{lf 3 rf 4}.8 0.1{rf 4}.16 2.2{lf 3 rf 3}.16 |
(0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).8 0.2{rf 3}.16 2.2{lf 3 rf 3}.16 0.2{rf 3}.16 0.3{rf 2}.16 0.1{rf 4}.16 2.1{lf 3 rf 4}.16 |
(4.1{lf 5} 0.5).8 2.1{lf 3}.8 2.1{lf 3}.4 |
\\ts 1 8 (0.2 0.6 0.5).16 0.3.16 |
\\ts 2 4 (0.4 0.6 0.5).8 0.3.16 1.3{lf 2}.16 0.2.8 2.2{lf 3}.16 4.2{lf 5}.16 |
(0.1 0.6 0.5).16 2.1{lf 3}.16 4.1{lf 5}.16 0.1.16 2.1{lf 3}.8 0.1.16 2.2{lf 3}.16 |
(0.2 0.6 0.5).8 0.2.16 2.2{lf 3}.16 0.2.16 0.3.16 0.4.16 0.3.16 |
(2.4{lf 3} 0.6 0.5).8 0.4.8 0.4.4 |
\\ts 1 8 (0.2 0.6 0.5).16 0.3.16 |
\\ts 2 4 (0.2 0.6 0.5).16 2.2{lf 3}.16 0.1.16 2.1{lf 3}.16 4.1{lf 5}.8 2.1{lf 3}.16 4.1{lf 5}.16 |
(5.1{lf 5} 2.6{lf 3}).16 2.1{lf 3}.16 4.1{lf 5}.16 0.1.16 2.1{lf 3}.8 0.1.16 2.1{lf 3}.16 |
(4.1{lf 5} 0.6 0.5).8 2.1{lf 3}.8 0.1.16 2.2{lf 3}.16 0.2.16 0.3.16 |
(0.3 0.6 0.5).8 2.4{lf 3}.8 2.4{lf 3}.8 0.2.16 0.3.16 |
(0.4 0.6 0.5).8 0.3.16 1.3{lf 2}.16 0.2.8 2.2{lf 3}.16 4.2{lf 5}.16 |
(0.1 0.6 0.5).16 2.1{lf 3}.16 4.1{lf 5}.16 0.1.16 2.1{lf 3}.8 0.1.16 2.2{lf 3}.16 |
(0.2 0.6 0.5).8 0.2.16 2.2{lf 3}.16 0.2.16 0.3.16 0.4.16 0.3.16 |
(2.4{lf 3} 0.6 0.5).8 0.4.8 0.4.4`,
  },
  {
    id: 'song-open-d-grace',
    level: 2,
    kind: 'song',
    tuning: 'open-d',
    title: "Amazing Grace",
    description: "The best-known hymn tune, in Open D. The open strings make a full D chord, so the melody sounds rich with very few fretted notes. Key of D.",
    tex:
      header("Amazing Grace", 70, 'open-d', "Traditional (New Britain), arranged for this app") +
      `\\ts 1 4 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).4 |
\\ts 3 4 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).2 4.1{lf 2 rf 4}.8 0.1{rf 4}.8 |
(4.1{lf 2 rf 4} 0.6{rf 1} 0.5{rf 1}).2 7.2{lf 5 rf 3}.4 |
(0.1{rf 4} 5.6{lf 3 rf 1} 0.4{rf 1}).2 5.3{lf 3 rf 2}.4 |
(0.2 0.6 0.5).2 0.2.4 |
(0.1 0.6 0.5).2 4.1{lf 2}.8 0.1.8 |
(4.1{lf 2} 0.6 0.5).2 7.2{lf 5}.4 |
(7.1{lf 5} 0.6 0.5).2 {d} |
(7.1{t} 0.6 0.5).2 4.1{lf 2}.4 |
(7.1{lf 5} 0.6 0.5).2 4.1{lf 2}.8 0.1.8 |
(4.1{lf 2} 0.6 0.5).2 7.2{lf 5}.4 |
(0.1 5.6{lf 3} 0.4).2 5.3{lf 3}.4 |
(0.2 0.6 0.5).2 0.2.4 |
(0.1 0.6 0.5).2 4.1{lf 2}.8 0.1.8 |
(4.1{lf 2} 0.6 0.5).2 7.2{lf 5}.4 |
(0.1 0.6 0.5).2 {d} |
\\ts 2 4 (0.1{t} 0.6 0.5).2`,
  },
  {
    id: 'song-open-d-soldier',
    level: 3,
    kind: 'song',
    tuning: 'open-d',
    title: "Soldier's Joy",
    description: "An old fiddle tune played everywhere from Ireland to Appalachia. Open D gives it a big, banjo-like ring. Key of D.",
    tex:
      header("Soldier's Joy", 96, 'open-d', "Traditional fiddle tune, arranged for this app") +
      `\\ts 1 4 (0.3{rf 2} 0.6{rf 1} 0.5{rf 1}).8 5.4{lf 5 rf 1}.8 |
\\ts 4 4 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 (0.4{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 (0.4{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 |
(0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).4 (0.1{rf 4} 0.5{rf 1}).4 (0.1{rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).4 (4.2{lf 4 rf 3} 0.6{rf 1} 0.5{rf 1}).8 2.2{lf 2 rf 3}.8 |
(0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 (0.4{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 (0.4{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 |
(5.4{lf 5} 2.6{lf 2}).4 (2.4{lf 2} 2.5{lf 2}).4 (2.4{lf 2} 2.6{lf 2}).4 (0.3 2.5{lf 2}).8 5.4{lf 5}.8 |
(0.2 0.6 0.5).8 0.3.8 (0.4 0.5).8 0.3.8 (0.2 0.6 0.5).8 0.3.8 (0.4 0.5).8 0.3.8 |
(0.2 0.6 0.5).4 (0.1 0.5).4 (0.1 0.6 0.5).4 (0.1 0.5).8 2.1{lf 2}.8 |
(4.1{lf 4} 0.6 0.5).8 7.1{lf 5}.8 (4.1{lf 4} 0.5).8 0.1.8 (2.1{lf 2} 0.5).8 5.1{lf 5}.8 (2.1{lf 2} 2.6{lf 2}).8 4.2{lf 4}.8 |
\\ts 3 4 (0.1 0.6 0.5).4 (0.1 0.5).4 (0.1 0.6 0.5).4 |
\\ts 1 4 (0.1 0.6 0.5).8 2.1{lf 2}.8 |
\\ts 4 4 (4.1{lf 4} 0.6 0.5).8 0.1.8 (4.1{lf 4} 0.5).8 0.1.8 (4.1{lf 4} 0.6 0.5).8 7.1{lf 5}.8 (5.1{lf 5} 0.5).8 4.1{lf 4}.8 |
(2.1{lf 2} 0.5).8 0.1.8 (4.2{lf 4} 2.6{lf 2}).8 0.1.8 (2.1{lf 2} 2.6{lf 2}).8 4.1{lf 4}.8 (5.1{lf 5} 2.5{lf 2} 4.4{lf 4}).8 2.1{lf 2}.8 |
(4.1{lf 4} 0.6 0.5).8 0.1.8 (4.1{lf 4} 0.5).8 0.1.8 (4.1{lf 4} 0.6 0.5).8 7.1{lf 5}.8 (5.1{lf 5} 0.5).8 4.1{lf 4}.8 |
(2.1{lf 2} 0.5).8 0.1.8 (4.2{lf 4} 2.6{lf 2}).8 2.2{lf 2}.8 (0.2 0.5).4 (0.1 2.6{lf 2}).8 2.1{lf 2}.8 |
(4.1{lf 4} 0.6 0.5).8 0.1.8 (4.1{lf 4} 0.5).8 0.1.8 (4.1{lf 4} 0.6 0.5).8 7.1{lf 5}.8 (5.1{lf 5} 0.5).8 4.1{lf 4}.8 |
(2.1{lf 2} 0.5).8 4.2{lf 4}.8 (0.2 2.6{lf 2}).8 4.2{lf 4}.8 (2.1{lf 2} 2.6{lf 2}).8 4.1{lf 4}.8 (5.1{lf 5} 2.5{lf 2} 4.4{lf 4}).8 2.1{lf 2}.8 |
(4.1{lf 4} 0.6 0.5).8 7.1{lf 5}.8 (4.1{lf 4} 0.5).8 0.1.8 (2.1{lf 2} 0.5).8 5.1{lf 5}.8 (2.1{lf 2} 2.6{lf 2}).8 4.2{lf 4}.8 |
\\ts 3 4 (0.1 0.6 0.5).4 (0.1 0.5).4 (0.1 0.6 0.5).4`,
  },
  {
    id: 'song-open-d-harvest',
    level: 3,
    kind: 'song',
    tuning: 'open-d',
    title: "Harvest Home",
    description: "A bright hornpipe in D. Fretted notes on the top strings, open strings everywhere else. Key of D.",
    tex:
      header("Harvest Home", 92, 'open-d', "Irish hornpipe, arranged for this app") +
      `\\ts 1 4 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 |
\\ts 4 4 (0.4{rf 1} 0.6{rf 1} 0.5{rf 1}).8 0.2{rf 3}.8 (0.3{rf 2} 0.5{rf 1}).8 0.2{rf 3}.8 (0.4{rf 1} 0.6{rf 1} 0.5{rf 1}).8 0.2{rf 3}.8 (0.3{rf 2} 0.5{rf 1}).8 0.2{rf 3}.8 |
(0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).8 2.1{lf 2 rf 4}.8 (4.1{lf 4 rf 4} 0.5{rf 1}).8 2.1{lf 2 rf 4}.8 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).8 4.2{lf 4 rf 3}.8 (2.2{lf 2 rf 3} 0.5{rf 1}).8 0.2{rf 3}.8 |
(2.1{lf 2 rf 4} 0.5{rf 1}).8 0.2{rf 3}.8 (4.1{lf 4 rf 4} 2.6{lf 2 rf 1}).8 0.2{rf 3}.8 (5.1{lf 5 rf 4} 0.6{rf 1} 0.5{rf 1}).8 0.2{rf 3}.8 (4.1{lf 4 rf 4} 0.5{rf 1}).8 0.2{rf 3}.8 |
(2.1{lf 2} 0.5).8 0.1.8 (4.2{lf 4} 2.6{lf 2}).8 2.2{lf 2}.8 (0.2 0.5).8 5.4{lf 5}.8 (0.3 2.6{lf 2}).8 2.4{lf 2}.8 |
(0.4 0.6 0.5).8 0.2.8 (0.3 0.5).8 0.2.8 (0.4 0.6 0.5).8 0.2.8 (0.3 0.5).8 0.2.8 |
(0.1 0.6 0.5).8 2.1{lf 2}.8 (4.1{lf 4} 0.5).8 2.1{lf 2}.8 (0.1 0.6 0.5).8 4.2{lf 4}.8 (2.2{lf 2} 0.5).8 0.2.8 |
(0.1 0.6 0.5).8 0.2.8 (0.3 0.5).8 0.2.8 (4.1{lf 4} 0.6 0.5).8 5.1{lf 5}.8 (2.1{lf 2} 0.5).8 4.2{lf 4}.8 |
\\ts 3 4 (0.1 0.6 0.5).4 (0.1 0.5).4 (0.1 0.6 0.5).4 |
\\ts 1 4 (4.2{lf 4} 0.5).8 0.1.8 |
\\ts 4 4 (2.1{lf 2} 0.5).8 {d} 0.2.16 (0.2 2.6{lf 2}).8 {tu 3} 0.2.8 {tu 3} 0.2.8 {tu 3} (4.1{lf 4} 0.6 0.5).8 {d} 0.2.16 (0.2 0.5).8 {tu 3} 0.2.8 {tu 3} 0.2.8 {tu 3} |
(2.1{lf 2} 0.5).8 {d} 0.2.16 (0.2 2.6{lf 2}).8 {tu 3} 0.2.8 {tu 3} 0.2.8 {tu 3} (4.1{lf 4} 0.6 0.5).8 {d} 0.2.16 (0.2 0.5).8 {tu 3} 0.2.8 {tu 3} 0.2.8 {tu 3} |
(2.1{lf 2} 0.5).8 0.2.8 (4.1{lf 4} 2.6{lf 2}).8 0.2.8 (5.1{lf 5} 0.6 0.5).8 0.2.8 (4.1{lf 4} 0.5).8 0.2.8 |
(2.1{lf 2} 0.5).8 {tu 3} 4.1{lf 4}.8 {tu 3} 2.1{lf 2}.8 {tu 3} (0.1 2.6{lf 2}).8 {tu 3} 4.2{lf 4}.8 {tu 3} 2.2{lf 2}.8 {tu 3} (0.2 0.5).8 {tu 3} 2.2{lf 2}.8 {tu 3} 0.2.8 {tu 3} (5.4{lf 5} 2.6{lf 2}).8 {tu 3} 0.3.8 {tu 3} 2.4{lf 2}.8 {tu 3} |
(0.4 0.6 0.5).8 0.2.8 (0.3 0.5).8 0.2.8 (0.4 0.6 0.5).8 0.2.8 (0.3 0.5).8 0.2.8 |
(0.1 0.6 0.5).8 2.1{lf 2}.8 (4.1{lf 4} 0.5).8 2.1{lf 2}.8 (0.1 0.6 0.5).8 4.2{lf 4}.8 (2.2{lf 2} 0.5).8 0.2.8 |
(0.1 0.6 0.5).8 0.2.8 (0.3 0.5).8 0.2.8 (4.1{lf 4} 0.6 0.5).8 5.1{lf 5}.8 (2.1{lf 2} 0.5).8 4.2{lf 4}.8 |
\\ts 3 4 (0.1 0.6 0.5).4 (0.1 0.5).4 (0.1 0.6 0.5).4`,
  },
  {
    id: 'song-open-d-rakes',
    level: 3,
    kind: 'song',
    tuning: 'open-d',
    title: "The Rakes of Mallow",
    description: "A bouncy Irish polka in 2/4. Short, catchy, and full of open-string drones in Open D. Key of D.",
    tex:
      header("The Rakes of Mallow", 104, 'open-d', "Irish polka, arranged for this app") +
      `\\ts 2 4 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).8 4.1{lf 4 rf 4}.8 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).8 4.1{lf 4 rf 4}.8 |
(0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).8 4.1{lf 4 rf 4}.8 (5.1{lf 5 rf 4} 0.6{rf 1} 0.5{rf 1}).16 4.1{lf 4 rf 4}.16 2.1{lf 2 rf 4}.16 0.1{rf 4}.16 |
(4.2{lf 4 rf 3} 0.5{rf 1}).8 2.1{lf 2 rf 4}.8 (4.2{lf 4 rf 3} 0.5{rf 1}).8 2.1{lf 2 rf 4}.8 |
(4.2{lf 4 rf 3} 0.5{rf 1}).8 2.1{lf 2 rf 4}.8 (7.1{lf 5 rf 4} 0.5{rf 1}).16 5.1{lf 3 rf 4}.16 4.1{lf 2 rf 4}.16 7.2{lf 5 rf 3}.16 |
(0.1 0.6 0.5).8 4.1{lf 2}.8 (0.1 0.6 0.5).8 4.1{lf 2}.8 |
(0.1 0.6 0.5).8 4.1{lf 2}.8 (7.1{lf 5} 0.6 0.5).8 4.1{lf 4}.8 |
(5.1{lf 5} 0.6 0.5).16 4.1{lf 4}.16 2.1{lf 2}.16 0.1.16 (4.2{lf 4} 0.5).16 0.1.16 2.1{lf 2}.16 5.1{lf 5}.16 |
(4.1{lf 4} 0.6 0.5).8 0.1.8 (0.1 0.6 0.5).4 |
(0.1 0.6 0.5).16 4.1{lf 4}.16 4.1{lf 4}.16 4.1{lf 4}.16 (0.1 0.6 0.5).16 4.1{lf 4}.16 4.1{lf 4}.16 4.1{lf 4}.16 |
(0.1 0.6 0.5).16 4.1{lf 4}.16 4.1{lf 4}.16 4.1{lf 4}.16 (5.1{lf 5} 0.6 0.5).16 4.1{lf 4}.16 2.1{lf 2}.16 0.1.16 |
(4.2{lf 4} 0.5).16 2.1{lf 2}.16 2.1{lf 2}.16 2.1{lf 2}.16 (4.2{lf 4} 0.5).16 2.1{lf 2}.16 2.1{lf 2}.16 2.1{lf 2}.16 |
(4.2{lf 4} 0.5).16 2.1{lf 2}.16 2.1{lf 2}.16 2.1{lf 2}.16 (7.1{lf 5} 0.5).16 5.1{lf 3}.16 4.1{lf 2}.16 7.2{lf 5}.16 |
(0.1 0.6 0.5).16 4.1{lf 2}.16 4.1{lf 2}.16 4.1{lf 2}.16 (0.1 0.6 0.5).16 4.1{lf 2}.16 4.1{lf 2}.16 4.1{lf 2}.16 |
(0.1 0.6 0.5).16 4.1{lf 2}.16 4.1{lf 2}.16 4.1{lf 2}.16 (7.1{lf 5} 0.6 0.5).8 4.1{lf 2}.8 |
(5.1{lf 3} 0.6 0.5).16 4.1{lf 2}.16 7.2{lf 5}.16 0.1.16 (4.2{lf 2} 0.5).16 0.1.16 7.2{lf 5}.16 5.1{lf 3}.16 |
(4.1{lf 2} 0.6 0.5).8 0.1.8 (0.1 0.6 0.5).4 |
(12.1{lf 5} 0.6 0.5).8 11.1{lf 4}.16 9.1{lf 2}.16 (12.2{lf 5} 0.6 0.5).8 10.2{lf 3}.8`,
  },
  {
    id: 'song-open-d-shady',
    level: 3,
    kind: 'song',
    tuning: 'open-d',
    title: "Shady Groves",
    description: "A short Irish air from O'Neill's 1903 collection, with the thumb rocking on the low strings. Key of A.",
    tex:
      header("Shady Groves", 76, 'open-d', "Irish air, arranged for this app") +
      `\\ts 1 4 (0.2{rf 3} 0.5{rf 1}).8 {d} 2.2{lf 2 rf 3}.16 |
\\ts 4 4 (4.2{lf 4 rf 3} 0.5{rf 1}).8 2.1{lf 2 rf 4}.8 (2.2{lf 2 rf 3} 2.6{lf 2 rf 1}).8 4.2{lf 4 rf 3}.8 (0.2{rf 3} 0.5{rf 1}).8 2.3{lf 2 rf 2}.8 (0.3{rf 2} 2.6{lf 2 rf 1}).8 2.4{lf 2 rf 1}.8 |
(0.3{rf 2} 2.5{lf 2 rf 1}).4 (2.2{lf 2 rf 3} 4.6{lf 4 rf 1}).4 (2.2{lf 2 rf 3} 2.6{lf 2 rf 1}).4 (0.2{rf 3} 2.5{lf 2 rf 1} 4.4{lf 4 rf 1}).8 2.2{lf 2 rf 3}.8 |
(4.2{lf 4 rf 3} 0.5{rf 1}).8 2.1{lf 2 rf 4}.8 (2.2{lf 2 rf 3} 2.6{lf 2 rf 1}).8 4.2{lf 4 rf 3}.8 (0.2{rf 3} 0.5{rf 1}).8 2.3{lf 2 rf 2}.8 (0.3{rf 2} 2.6{lf 2 rf 1}).8 2.4{lf 2 rf 1}.8 |
\\ts 3 4 (0.3 0.6 0.5).4 (0.2 0.5).4 (0.2 0.5).4 |
\\ts 1 4 (2.2{lf 2} 2.6{lf 2}).8 4.2{lf 4}.8 |
\\ts 3 4 (0.1 0.6 0.5).8 4.2{lf 4}.8 (0.1 0.5).8 2.1{lf 2}.8 (4.2{lf 4} 0.5).8 0.1.8 |
(2.1{lf 2} 0.5).8 4.2{lf 4}.8 (2.2{lf 2} 2.6{lf 2}).8 0.2.8 (2.3{lf 2} 2.6{lf 2}).8 0.2.8 |
\\ts 4 4 (2.2{lf 2} 2.6{lf 2}).8 2.1{lf 2}.8 (6.2{lf 5} 2.5{lf 2} 4.4{lf 4}).8 4.2{lf 4}.8 (2.2{lf 2} 2.6{lf 2}).8 0.2.8 (2.3{lf 2} 2.5{lf 2}).8 0.3.8 |
(2.3{lf 2} 2.6{lf 2}).4 (2.4{lf 2} 2.5{lf 2}).4 (2.4{lf 2} 2.6{lf 2}).4 (2.3{lf 2} 2.5{lf 2}).8 2.1{lf 2}.8 |
(2.1{lf 2} 2.6{lf 2}).8 0.1.8 (4.2{lf 4} 2.5{lf 2} 0.3).8 2.2{lf 2}.8 (4.3{lf 4} 2.6{lf 2}).4 (4.1{lf 4} 2.5{lf 2} 0.3).8 2.1{lf 2}.8 |
(0.1 2.5{lf 2} 4.4{lf 4}).4 (2.2{lf 2} 4.6{lf 4}).4 (2.2{lf 2} 2.6{lf 2}).4 (2.2{lf 2} 2.5{lf 2} 4.4{lf 4}).8 4.2{lf 4}.8 |
(0.1 0.6 0.5).8 4.2{lf 4}.8 (2.2{lf 2} 0.5).8 0.2.8 (2.3{lf 2} 2.6{lf 2}).4 (2.1{lf 2} 2.5{lf 2} 4.4{lf 4}).8 0.1.8 |
(4.2{lf 4} 0.5).4 (0.2 2.6{lf 2}).4 (0.2 0.5).4 (2.2{lf 2} 2.6{lf 2}).8 4.2{lf 4}.8 |
\\ts 3 4 (0.1 0.5).8 4.2{lf 4}.8 (0.1 2.6{lf 2}).8 2.1{lf 2}.8 (4.2{lf 4} 0.5).8 0.1.8 |
(2.1{lf 2} 0.5).8 4.2{lf 4}.8 (2.2{lf 2} 2.6{lf 2}).8 0.2.8 (2.2{lf 2} 0.5).4`,
  },
  {
    id: 'song-open-d-arkansas',
    level: 3,
    kind: 'song',
    tuning: 'open-d',
    title: "Arkansas Traveler (first part)",
    description: "The famous American fiddle tune. Open D was made for this kind of music: bright melody, droning bass. Key of A.",
    tex:
      header("Arkansas Traveler (first part)", 96, 'open-d', "American fiddle tune, arranged for this app") +
      `\\ts 1 8 (2.4{lf 2 rf 1} 2.6{lf 2 rf 1}).16 {tu 3} 0.3{rf 2}.16 {tu 3} 2.3{lf 2 rf 2}.16 {tu 3} |
\\ts 2 4 (0.2{rf 3} 0.5{rf 1}).16 4.2{lf 4 rf 3}.16 2.2{lf 2 rf 3}.16 0.2{rf 3}.16 (0.3{rf 2} 0.6{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 |
(2.4{lf 2 rf 1} 0.5{rf 1}).8 2.4{lf 2 rf 1}.8 (0.2{rf 3} 0.5{rf 1}).4 |
(2.2{lf 2 rf 3} 2.6{lf 2 rf 1}).16 2.2{lf 2 rf 3}.16 2.2{lf 2 rf 3}.8 (4.2{lf 4 rf 3} 0.5{rf 1}).16 4.2{lf 4 rf 3}.16 4.2{lf 4 rf 3}.8 |
(0.2 0.5).16 4.2{lf 4}.16 2.2{lf 2}.16 0.2.16 (0.3 0.5).8 2.4{lf 2}.8 |
(0.2 0.5).16 4.2{lf 4}.16 2.2{lf 2}.16 0.2.16 (0.3 0.6 0.5).8 0.3.8 |
(2.4{lf 2} 0.5).8 2.4{lf 2}.8 (0.2 0.5).4 |
(7.1{lf 5} 0.5).16 6.1{lf 4}.16 7.1{lf 5}.16 7.2{lf 5}.16 (4.1{lf 2} 0.6 0.5).16 7.1{lf 5}.16 7.2{lf 5}.16 0.1.16 |
(4.2{lf 2} 0.5).16 5.3{lf 3}.16 0.2.16 6.4{lf 4}.16 (0.2 0.5).4`,
  },
  {
    id: 'song-open-d-flowers',
    level: 3,
    kind: 'song',
    tuning: 'open-d',
    title: "Flowers of Edinburgh (first part)",
    description: "The opening strain of a well-known Scottish reel. Keep the thumb steady and let the melody dance on top. Key of A.",
    tex:
      header("Flowers of Edinburgh (first part)", 92, 'open-d', "Scottish reel, arranged for this app") +
      `\\ts 1 8 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).16 0.3{rf 2}.16 |
\\ts 2 4 (2.4{lf 2 rf 1} 0.5{rf 1}).8 2.4{lf 2 rf 1}.16 0.3{rf 2}.16 (0.2{rf 3} 0.5{rf 1}).8 0.2{rf 3}.8 |
(4.2{lf 4 rf 3} 0.5{rf 1}).16 0.2{rf 3}.16 4.2{lf 4 rf 3}.16 2.1{lf 2 rf 4}.16 (0.1{rf 4} 0.5{rf 1}).16 4.2{lf 4 rf 3}.16 2.2{lf 2 rf 3}.16 0.2{rf 3}.16 |
(2.3{lf 2 rf 2} 2.6{lf 2 rf 1}).16 0.2{rf 3}.16 0.3{rf 2}.16 2.3{lf 2 rf 2}.16 (2.4{lf 2 rf 1} 2.6{lf 2 rf 1}).16 0.3{rf 2}.16 2.3{lf 2 rf 2}.16 0.2{rf 3}.16 |
(2.2{lf 2} 2.6{lf 2}).16 2.3{lf 2}.16 0.1.16 2.3{lf 2}.16 (0.3 0.6 0.5).8 0.2.16 0.3.16 |
(2.4{lf 2} 0.5).8 2.4{lf 2}.16 0.3.16 (0.2 0.5).8 0.2.8 |
(4.2{lf 4} 0.5).16 0.2.16 4.2{lf 4}.16 2.1{lf 2}.16 (4.1{lf 4} 0.6 0.5).16 6.1{lf 4}.16 7.1{lf 5}.16 4.1{lf 5}.16 |
(2.1{lf 3} 0.5).16 0.1.16 4.2{lf 5}.16 2.2{lf 3}.16 (0.2 0.5).16 2.3{lf 3}.16 0.2.16 2.2{lf 3}.16 |
\\ts 3 8 (4.2{lf 5} 0.5).8 0.2.8 (0.2 0.5).8`,
  },
  {
    id: 'song-dadgad-ar-lamma',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Lamma Bada Yatathanna (DADGAD)",
    description: "The best-loved Andalusian muwashshah in 10/8 (count 3+4+3), now in D minor over DADGAD's open D drone, the way an oud player would hold the low string.",
    tex:
      header("Lamma Bada Yatathanna (DADGAD)", 60, 'dadgad', "Muwashshah from al-Andalus, traditional, arranged for this app") +
      `\\ts 1 8 0.2{rf 3}.8 |
\\ts 10 8 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 7.2{lf 4 rf 3}.16 8.2{lf 5 rf 3}.16 (5.1{lf 2 rf 4} 5.6{lf 2 rf 1} 0.4{rf 1}).16 8.2{lf 5 rf 3}.16 8.2{lf 5 rf 3}.16 7.2{lf 4 rf 3}.16 (7.2{lf 4 rf 3} 0.5{rf 1}).16 0.1{rf 4}.16 0.1{rf 4}.16 6.3{lf 3 rf 2}.16 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 0.2{rf 3}.8 |
(0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 7.2{lf 4 rf 3}.16 8.2{lf 5 rf 3}.16 (5.1{lf 2 rf 4} 5.6{lf 2 rf 1} 0.4{rf 1}).16 8.2{lf 5 rf 3}.16 8.2{lf 5 rf 3}.16 7.2{lf 4 rf 3}.16 (7.2{lf 4 rf 3} 0.5{rf 1}).16 0.1{rf 4}.16 0.1{rf 4}.16 6.3{lf 3 rf 2}.16 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 7.2{lf 4 rf 3}.16 8.2{lf 5 rf 3}.16 |
(5.1{lf 2 rf 4} 5.6{lf 2 rf 1} 0.4{rf 1}).4 7.1{lf 4 rf 4}.8 (3.1{lf 4 rf 4} 1.5{lf 2 rf 1}).8 {d} 2.1{lf 3 rf 4}.16 (2.1{lf 3 rf 4} 0.5{rf 1}).16 0.1{rf 4}.16 0.1{rf 4}.16 4.2{lf 5 rf 3}.16 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 2.1{lf 3 rf 4}.8 |
(4.2{lf 5} 0.5).4 0.1.8 (3.3{lf 3} 5.6{lf 5} 0.4).8 {d} 0.2.16 (3.3{lf 3} 5.6{lf 5} 0.4).16 0.2.16 3.3{lf 3}.16 4.2{lf 4}.16 (0.2 0.5).4 3.3{lf 3}.16 0.2.16 |
(0.3 5.6{lf 5} 0.4).4 0.2.16 0.3.16 (3.4{lf 4} 1.5{lf 2}).8 {d} 2.4{lf 3}.16 (2.4{lf 3} 0.5).16 0.4.16 0.4.16 4.5{lf 5}.16 (0.4 0.6 0.5).4 0.2.8 |
(0.1 0.6 0.5).4 2.1{lf 3}.16 3.1{lf 4}.16 (5.1{lf 2} 5.6{lf 2} 0.4).16 8.2{lf 5}.16 8.2{lf 5}.16 7.2{lf 4}.16 (7.2{lf 4} 0.5).16 0.1.16 6.3{lf 3}.16 7.2{lf 4}.16 (0.1 0.6 0.5).4 0.2.8 |
(0.1 0.6 0.5).4 7.2{lf 4}.16 8.2{lf 5}.16 (5.1{lf 2} 5.6{lf 2} 0.4).16 3.1{lf 4}.16 3.1{lf 4}.16 2.1{lf 3}.16 (2.1{lf 3} 0.5).16 0.1.16 4.2{lf 5}.16 2.1{lf 3}.16 (0.1 0.6 0.5).4 3.1{lf 4}.8 |
(3.1{lf 4} 1.5{lf 2}).4 3.1{lf 4}.8 3.1{lf 4}.4 (5.1{lf 5} 1.5{lf 2}).16 3.1{lf 4}.16 2.1{lf 3}.16 5.1{lf 2}.16 8.2{lf 5}.4 5.1{lf 2}.8 |
(7.1{lf 4} 8.6{lf 5}).4 5.1{lf 2}.8 7.1{lf 4}.16 5.1{lf 2}.16 5.1{lf 2}.16 3.1{lf 4}.16 (3.1{lf 4} 1.5{lf 2}).16 2.1{lf 3}.16 0.1.16 3.1{lf 4}.16 (2.1{lf 3} 0.5).4 0.1.16 2.1{lf 3}.16 |
(3.1{lf 4} 1.5{lf 2}).4 3.1{lf 4}.8 3.1{lf 4}.4 (5.1{lf 5} 1.5{lf 2}).16 3.1{lf 4}.16 2.1{lf 3}.16 5.1{lf 5}.16 3.1{lf 3}.4 2.1{lf 2}.16 3.1{lf 3}.16 |
(5.1{lf 4} 5.6{lf 5} 0.4).4 7.1{lf 5}.8 (3.1{lf 4} 1.5{lf 2}).8 {d} 2.1{lf 3}.16 (2.1{lf 3} 0.5).16 0.1.16 0.1.16 4.2{lf 5}.16 (0.1 0.6 0.5).4 2.1{lf 3}.8 |
(4.2{lf 5} 0.5).4 0.1.8 (3.3{lf 3} 5.6{lf 5} 0.4).8 {d} 0.2.16 (3.3{lf 3} 5.6{lf 5} 0.4).16 0.2.16 3.3{lf 3}.16 4.2{lf 4}.16 (0.2 0.5).4 3.3{lf 3}.16 0.2.16 |
(0.3 5.6{lf 5} 0.4).4 0.2.16 0.3.16 (3.4{lf 4} 1.5{lf 2}).8 {d} 2.4{lf 3}.16 (2.4{lf 3} 0.5).16 0.4.16 0.4.16 4.5{lf 5}.16 (0.4 0.6 0.5).4 {d}`,
  },
  {
    id: 'song-dadgad-ar-bafta',
    level: 2,
    kind: 'song',
    tuning: 'dadgad',
    title: "Bafta Hindi (DADGAD)",
    description: "A cheerful folk song in maqam Nahawand (minor) with a bass on every beat. In DADGAD the open D and A strings ring under it: a gentle first Arabic tune in the new tuning.",
    tex:
      header("Bafta Hindi (DADGAD)", 96, 'dadgad', "Traditional (Iraq and the Levant), arranged for this app") +
      `\\ts 4 4 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 (0.1{rf 4} 0.5{rf 1}).4 (0.2{rf 3} 0.5{rf 1}).4 (0.2{rf 3} 0.5{rf 1}).4 |
(0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 (0.1{rf 4} 0.5{rf 1}).4 (0.2{rf 3} 0.5{rf 1}).4 (0.2{rf 3} 0.5{rf 1}).4 |
(0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).4 (0.2{rf 3} 0.5{rf 1}).4 (1.2{lf 2 rf 3} 2.6{lf 3 rf 1}).4 (0.1{rf 4} 1.5{lf 2 rf 1}).4 |
(4.2{lf 5 rf 3} 0.5{rf 1}).4 (1.2{lf 2 rf 3} 2.6{lf 3 rf 1}).4 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).4 0.5{rf 1}.4 |
(0.2 0.6 0.5).4 (0.2 0.5).4 (1.2{lf 2} 2.6{lf 3}).4 (0.3 1.5{lf 2}).4 |
(0.3 0.5).4 (0.3 2.6{lf 3}).4 (0.2 0.6 0.5).4 (3.4{lf 4} 0.5).4 |
(3.4{lf 4} 0.6 0.5).4 (3.4{lf 4} 0.5).4 (0.3 2.6{lf 3}).4 (3.4{lf 4} 1.5{lf 2}).4 |
(2.4{lf 3} 0.5).4 (0.4 2.6{lf 3}).4 (0.2 0.6 0.5).4 0.5.4 |
(0.2 0.6 0.5).4 (0.2 0.5).4 (1.2{lf 2} 2.6{lf 3}).4 (0.3 1.5{lf 2}).4 |
(0.3 0.5).4 (0.3 2.6{lf 3}).4 (0.2 0.6 0.5).4 (3.4{lf 4} 0.5).4 |
(3.4{lf 4} 0.6 0.5).4 (3.4{lf 4} 0.5).4 (0.3 2.6{lf 3}).4 (3.4{lf 4} 1.5{lf 2}).4 |
(2.4{lf 3} 0.5).4 (0.4 2.6{lf 3}).4 (0.4 0.6 0.5).4 0.5.4`,
  },
  {
    id: 'song-dadgad-ar-zein',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Ah Ya Zein (DADGAD)",
    description: "Levantine folk song in maqam Hijaz Kar, in A over open-string drones. The flat 2nd and raised 3rd give the Arabic sound on ordinary frets.",
    tex:
      header("Ah Ya Zein (DADGAD)", 88, 'dadgad', "Traditional (Levant), arranged for this app") +
      `\\ts 1 4 4.2{lf 4 rf 3}.8 0.1{rf 4}.8 |
\\ts 4 4 (2.1{lf 2 rf 4} 0.5{rf 1}).4 2.6{lf 2 rf 1}.4 0.5{rf 1}.4 (4.2{lf 4 rf 3} 2.6{lf 2 rf 1}).8 0.1{rf 4}.8 |
(2.1{lf 2 rf 4} 0.5{rf 1}).4 2.6{lf 2 rf 1}.4 0.5{rf 1}.4 (4.2{lf 4 rf 3} 2.6{lf 2 rf 1}).8 0.1{rf 4}.8 |
(2.1{lf 2 rf 4} 0.5{rf 1}).8 3.1{lf 3 rf 4}.8 (2.1{lf 2 rf 4} 2.6{lf 2 rf 1}).8 0.1{rf 4}.8 (2.1{lf 2 rf 4} 0.5{rf 1}).8 3.1{lf 3 rf 4}.8 (2.1{lf 2 rf 4} 2.6{lf 2 rf 1}).8 0.1{rf 4}.8 |
(4.2{lf 4} 0.5).4 2.6{lf 2}.4 0.5.4 (3.1{lf 3} 2.6{lf 2}).8 2.1{lf 2}.8 |
(0.1 5.6{lf 5} 0.4).4 (0.6 0.5).4 (5.6{lf 5} 0.4).4 (4.2{lf 4} 0.6 0.5).8 0.1.8 |
(2.1{lf 2} 0.5).8 3.1{lf 3}.8 (2.1{lf 2} 2.6{lf 2}).8 0.1.8 (4.2{lf 4} 0.5).8 3.3{lf 3}.8 (0.2 2.6{lf 2}).4 |
(2.1{lf 2} 2.6{lf 2}).8 0.1.8 (0.1 1.5{lf 2}).8 4.2{lf 5}.8 (4.2{lf 4} 5.6{lf 5} 0.4).8 3.3{lf 3}.8 (3.3{lf 3} 0.6 0.5).8 0.2.8 |
(0.2 0.5).4 2.6{lf 2}.4 0.5.4 (4.2{lf 4} 2.6{lf 2}).8 0.1.8 |
(2.1{lf 2} 0.5).8 3.1{lf 3}.8 (2.1{lf 2} 2.6{lf 2}).8 0.1.8 (4.2{lf 4} 0.5).8 3.3{lf 3}.8 (0.2 2.6{lf 2}).4 |
(2.1{lf 2} 2.6{lf 2}).8 0.1.8 (0.1 1.5{lf 2}).8 4.2{lf 5}.8 (4.2{lf 4} 5.6{lf 5} 0.4).8 3.3{lf 3}.8 (3.3{lf 3} 0.6 0.5).8 0.2.8`,
  },
  {
    id: 'song-dadgad-ar-hamama',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Hamama Beida (DADGAD)",
    description: "Dawud Husni's Egyptian song in D minor. The Rast half-flat third is played natural, the usual compromise on guitar, while the low D drones.",
    tex:
      header("Hamama Beida (DADGAD)", 80, 'dadgad', "Dawud Husni (1870–1937), arranged for this app") +
      `\\ts 4 4 (3.1{lf 2 rf 4} 3.6{lf 2 rf 1}).4 (3.1{lf 2 rf 4} 3.5{lf 2 rf 1} 5.4{lf 4 rf 1}).4 (3.1{lf 2 rf 4} 3.6{lf 2 rf 1}).4 (2.1{lf 2 rf 4} 2.6{lf 2 rf 1}).8 3.1{lf 3 rf 4}.16 2.1{lf 2 rf 4}.16 |
(0.1{rf 4} 2.6{lf 2 rf 1}).8 2.1{lf 2 rf 4}.8 (3.1{lf 2 rf 4} 3.6{lf 2 rf 1}).4 3.6{lf 2 rf 1}.4 (3.5{lf 2 rf 1} 5.4{lf 4 rf 1}).4 |
(7.2{lf 5 rf 3} 3.6{lf 2 rf 1}).8 3.1{lf 2 rf 4}.8 (5.1{lf 4 rf 4} 3.5{lf 2 rf 1} 0.3{rf 1}).8 3.1{lf 2 rf 4}.8 (3.1{lf 2 rf 4} 3.6{lf 2 rf 1}).8 2.1{lf 2 rf 4}.8 (2.1{lf 2 rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).8 0.1{rf 4}.8 |
(0.1{rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).8 3.2{lf 3 rf 3}.8 (3.2{lf 2 rf 3} 3.5{lf 2 rf 1} 5.4{lf 4 rf 1}).4 (3.5{lf 2 rf 1} 5.4{lf 4 rf 1}).4 (5.6{lf 4 rf 1} 0.4{rf 1}).4 |
(3.1{lf 2} 3.6{lf 2}).4 (3.1{lf 2} 3.5{lf 2} 5.4{lf 4}).4 (3.1{lf 2} 3.6{lf 2}).4 (2.1{lf 2} 2.6{lf 2}).8 3.1{lf 3}.16 2.1{lf 2}.16 |
(0.1 2.6{lf 2}).8 2.1{lf 2}.8 (3.1{lf 2} 3.6{lf 2}).4 3.6{lf 2}.4 (3.5{lf 2} 5.4{lf 4}).4 |
(7.2{lf 5} 3.6{lf 2}).8 3.1{lf 2}.8 (5.1{lf 4} 3.5{lf 2} 0.3).8 3.1{lf 2}.8 (3.1{lf 2} 3.6{lf 2}).8 2.1{lf 2}.8 (2.1{lf 2} 5.6{lf 5} 0.4).8 0.1.8 |
(0.1 5.6{lf 5} 0.4).8 3.2{lf 3}.8 (3.2{lf 2} 3.5{lf 2} 5.4{lf 4}).4 (3.5{lf 2} 5.4{lf 4}).4 (5.6{lf 4} 0.4).4 |
(0.1 1.5{lf 2}).4 (5.3{lf 5} 3.6{lf 4}).4 (1.2{lf 2} 1.5{lf 2}).4 (0.2 0.5).8 1.2{lf 2}.16 0.2.16 |
(0.3 0.5).8 1.2{lf 2}.8 (0.2 2.6{lf 3}).4 0.5.4 2.6{lf 3}.4 |
(0.2 5.6{lf 4} 0.4).4 (0.3 0.6 0.5).4 (3.3{lf 2} 5.6{lf 4} 0.4).4 (0.2 3.5{lf 2}).8 0.3.8 |
(0.3 3.5{lf 2}).8 3.4{lf 2}.8 (3.4{lf 2} 3.6{lf 2}).8 0.2.8 (3.2{lf 2} 3.6{lf 2}).4 (3.4{lf 2} 3.5{lf 2}).4`,
  },
  {
    id: 'song-dadgad-ar-shedd',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Shedd el Hizam (DADGAD)",
    description: "Sayed Darwish's rousing \"Tighten the belt\", in D with a Hijaz colour (Bb and C#) over the open D strings.",
    tex:
      header("Shedd el Hizam (DADGAD)", 96, 'dadgad', "Sayed Darwish (1892–1923), arranged for this app") +
      `\\ts 2 4 1.5{lf 2 rf 1}.8 2.1{lf 3 rf 4}.8 (4.2{lf 5 rf 3} 2.6{lf 3 rf 1}).8 1.2{lf 2 rf 3}.8 |
(0.2{rf 3} 0.5{rf 1}).8 0.3{rf 2}.8 (0.2{rf 3} 2.6{lf 3 rf 1}).8 1.2{lf 2 rf 3}.8 |
(4.2{lf 5 rf 3} 1.5{lf 2 rf 1}).8 0.1{rf 4}.8 (4.2{lf 5 rf 3} 2.6{lf 3 rf 1}).8 1.2{lf 2 rf 3}.8 |
(0.2{rf 3} 0.5{rf 1}).4 2.6{lf 3 rf 1}.4 |
1.5{lf 2}.8 2.1{lf 3}.8 (4.2{lf 5} 2.6{lf 3}).8 1.2{lf 2}.8 |
(0.2 0.5).8 0.3.8 (0.2 2.6{lf 3}).8 1.2{lf 2}.8 |
(4.2{lf 5} 1.5{lf 2}).8 0.1.8 (4.2{lf 5} 2.6{lf 3}).8 1.2{lf 2}.8 |
(0.2 0.5).4 2.6{lf 3}.4 |
(0.6 0.5).8 0.1.8 (0.1 0.5).8 0.1.8 |
(4.2{lf 5} 0.5).8 0.1.8 (2.1{lf 2} 2.6{lf 2}).4 |
(2.1{lf 2} 0.6 0.5).8 3.1{lf 3}.8 (2.1{lf 2} 0.5).8 0.1.8 |
(4.2{lf 4} 0.5).8 0.1.8 (2.1{lf 2} 2.6{lf 2}).4 |
1.5{lf 2}.8 2.1{lf 3}.8 (4.2{lf 5} 2.6{lf 3}).8 1.2{lf 2}.8 |
(0.2 0.5).8 0.3.8 (0.2 2.6{lf 3}).8 1.2{lf 2}.8 |
\\ts 3 4 (4.2{lf 5} 1.5{lf 2}).8 0.1.8 (2.1{lf 2} 2.6{lf 2}).8 {d} 4.2{lf 5}.16 (0.1 1.5{lf 2}).8 {d} 1.2{lf 2}.16 |
\\ts 2 4 (0.2 0.5).8 0.2.8 (0.1 2.6{lf 3}).8 2.1{lf 3}.8 |
(3.1{lf 4} 0.5).8 2.1{lf 3}.8 (0.1 2.6{lf 3}).8 4.2{lf 5}.8 |
(0.1 0.6 0.5).4 0.5.4 |
(0.1{t} 0.6 0.5).4 0.5.4`,
  },
  {
    id: 'song-dadgad-ar-shams',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Shams al-Ashiyya (DADGAD)",
    description: "A sanʿa from Nawbat al-Māya in 3/4, in D. DADGAD's drones sound like the rabab and oud of a Moroccan Āla orchestra.",
    tex:
      header("Shams al-Ashiyya (DADGAD)", 86, 'dadgad', "Moroccan Andalusian music (al-Āla), traditional, arranged for this app") +
      `\\ts 3 4 (0.6{rf 1} 0.5{rf 1}).8 0.4{rf 1}.8 (4.4{lf 5 rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 0.2{rf 3}.4 |
(0.6{rf 1} 0.5{rf 1}).8 0.2{rf 3}.8 (0.2{rf 3} 0.5{rf 1}).8 0.2{rf 3}.8 0.2{rf 3}.8 2.2{lf 3 rf 3}.8 |
(3.2{lf 4 rf 3} 0.6{rf 1} 0.5{rf 1}).8 2.2{lf 3 rf 3}.8 (0.2{rf 3} 0.5{rf 1}).8 0.3{rf 2}.8 4.4{lf 5 rf 1}.4 |
(0.6{rf 1} 0.5{rf 1}).8 0.2{rf 3}.8 (0.2{rf 3} 0.5{rf 1}).8 0.3{rf 2}.8 4.4{lf 5 rf 1}.8 2.4{lf 3 rf 1}.8 |
(0.4 0.6 0.5).4 (0.2 0.5).8 0.3.8 0.2.16 2.2{lf 3}.16 0.2.16 0.3.16 |
(4.4{lf 5} 0.6 0.5).8 0.4.8 (4.4{lf 5} 0.5).8 0.3.8 0.2.4 |
(0.6 0.5).8 0.2.8 (0.2 0.5).8 0.2.8 0.2.8 2.2{lf 3}.8 |
(3.2{lf 4} 0.6 0.5).8 2.2{lf 3}.8 (0.2 0.5).8 0.3.8 4.4{lf 5}.4 |
(0.6 0.5).8 0.2.8 (0.2 0.5).8 0.3.8 4.4{lf 5}.8 2.4{lf 3}.8 |
(0.4 0.6 0.5).4 (0.2 0.5).8 0.3.8 0.2.16 2.2{lf 3}.16 0.2.16 0.3.16 |
(4.4{lf 5} 0.6 0.5).8 0.4.8 (4.4{lf 5} 0.5).8 0.3.8 0.2.4`,
  },
  {
    id: 'song-dadgad-ar-inkunta',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "In Kunta Min Ahli al-Hawa (DADGAD)",
    description: "A Moroccan Andalusian sanʿa from Nawbat Gharībat al-Ḥusayn in 3/4, in G, with the open G and D strings ringing.",
    tex:
      header("In Kunta Min Ahli al-Hawa (DADGAD)", 86, 'dadgad', "Moroccan Andalusian music (al-Āla), traditional, arranged for this app") +
      `\\ts 3 4 (0.3{rf 2} 5.6{lf 5 rf 1} 0.4{rf 1}).4 (0.3{rf 2} 0.6{rf 1} 0.5{rf 1}).8 0.3{rf 2}.4 2.2{lf 2 rf 3}.8 |
(2.2{lf 2 rf 3} 5.6{lf 5 rf 1} 0.4{rf 1}).4 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).8 3.2{lf 3 rf 3}.8 0.1{rf 4}.16 2.1{lf 2 rf 4}.16 0.1{rf 4}.16 3.2{lf 3 rf 3}.16 |
(2.2{lf 2 rf 3} 5.6{lf 5 rf 1} 0.4{rf 1}).4 (3.2{lf 3 rf 3} 0.6{rf 1} 0.5{rf 1}).8 2.2{lf 2 rf 3}.16 0.2{rf 3}.16 0.3{rf 2}.8 2.2{lf 2 rf 3}.8 |
(2.2{lf 2 rf 3} 5.6{lf 5 rf 1} 0.4{rf 1}).4 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).8 3.2{lf 3 rf 3}.8 0.1{rf 4}.16 2.1{lf 2 rf 4}.16 0.1{rf 4}.16 3.2{lf 3 rf 3}.16 |
(2.2{lf 2} 5.6{lf 5} 0.4).4 (0.1 0.6 0.5).8 0.1.4 3.2{lf 3}.8 |
(3.1{lf 2} 3.6{lf 2}).8 2.1{lf 2}.8 (0.1 3.5{lf 3} 5.4{lf 5}).8 3.2{lf 3}.8 0.1.16 2.1{lf 2}.16 0.1.16 3.2{lf 3}.16 |
(2.2{lf 2} 5.6{lf 5} 0.4).4 (3.2{lf 3} 0.6 0.5).8 2.2{lf 2}.16 0.2.16 0.3.8 2.2{lf 2}.8 |
(2.2{lf 2} 5.6{lf 5} 0.4).8 0.3.8 (0.2 0.6 0.5).16 2.2{lf 2}.16 3.2{lf 3}.16 2.1{lf 2}.16 0.1.16 3.2{lf 3}.16 2.2{lf 2}.16 0.2.16 |
(0.3 5.6{lf 5} 0.4).4 (2.2{lf 2} 0.6 0.5).8 3.2{lf 3}.4 2.2{lf 2}.8 |
(3.2{lf 2} 3.5{lf 2} 5.4{lf 4}).8 2.1{lf 2}.8 (0.1 5.6{lf 5} 0.4).8 3.2{lf 3}.8 0.1.16 2.1{lf 2}.16 0.1.16 3.2{lf 3}.16 |
(2.2{lf 2} 5.6{lf 5} 0.4).4 (3.2{lf 3} 0.6 0.5).8 2.2{lf 2}.16 0.2.16 0.3.8 2.2{lf 2}.8 |
(2.2{lf 2} 5.6{lf 5} 0.4).8 0.3.8 (0.2 0.6 0.5).16 2.2{lf 2}.16 3.2{lf 3}.16 2.1{lf 2}.16 0.1.16 3.2{lf 3}.16 2.2{lf 2}.16 0.2.16`,
  },
  {
    id: 'song-dadgad-ar-qamarun',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Qamarun (DADGAD)",
    description: "A sanʿa from Nawbat al-Ḥijāz al-Kabīr. The Hijaz colour (Bb and C# around D) sits right on DADGAD's open D: try the D Hijaz scale on the Tunings page first.",
    tex:
      header("Qamarun (DADGAD)", 78, 'dadgad', "Moroccan Andalusian music (al-Āla), traditional, arranged for this app") +
      `\\ts 4 4 0.5{rf 1}.8 0.2{rf 3}.8 (0.2{rf 3} 2.6{lf 2 rf 1}).8 2.2{lf 2 rf 3}.16 4.2{lf 4 rf 3}.16 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).8 2.1{lf 2 rf 4}.8 (0.1{rf 4} 0.5{rf 1}).16 4.2{lf 4 rf 3}.16 3.3{lf 3 rf 2}.16 0.2{rf 3}.16 |
(0.3{rf 2} 5.6{lf 5 rf 1} 0.4{rf 1}).8 0.3{rf 2}.8 (0.3{rf 2} 0.6{rf 1} 0.5{rf 1}).8 0.2{rf 3}.8 (0.6{rf 1} 0.5{rf 1}).8 2.2{lf 2 rf 3}.8 (4.2{lf 4 rf 3} 0.5{rf 1}).8 0.1{rf 4}.8 |
(2.1{lf 2 rf 4} 0.5{rf 1}).8 0.1{rf 4}.8 (4.2{lf 4 rf 3} 2.6{lf 2 rf 1}).8 0.1{rf 4}.8 (4.2{lf 4 rf 3} 0.5{rf 1}).8 3.3{lf 3 rf 2}.8 (0.2{rf 3} 2.6{lf 2 rf 1}).4 |
0.5{rf 1}.8 0.2{rf 3}.8 (0.2{rf 3} 2.6{lf 2 rf 1}).8 0.2{rf 3}.8 (0.2{t} 0.5{rf 1}).8 0.3{rf 2}.8 (0.2{rf 3} 2.6{lf 2 rf 1}).8 2.2{lf 2 rf 3}.16 3.2{lf 3 rf 3}.16 |
(0.1 0.6 0.5).8 3.2{lf 3}.8 (2.2{lf 2} 0.5).8 0.2.8 (0.6 0.5).8 0.3.8 (4.4{lf 4} 0.5).8 2.4{lf 2}.8 |
(0.4 0.6 0.5).8 0.4.8 (0.4 0.5).8 4.4{lf 4}.8 (0.6 0.5).8 0.3.8 (0.2 0.5).4 |
(0.6 0.5).8 0.2.8 (0.2 0.5).8 0.1.8 (0.6 0.5).8 2.1{lf 2}.8 (0.1 0.5).16 4.2{lf 4}.16 3.3{lf 3}.16 0.2.16 |
(0.3 5.6{lf 5} 0.4).8 0.3.8 (0.3 0.6 0.5).8 0.2.8 (0.6 0.5).8 2.2{lf 2}.8 (4.2{lf 4} 0.5).8 0.1.8 |
(2.1{lf 2} 0.5).8 0.1.8 (4.2{lf 4} 2.6{lf 2}).8 0.1.8 (4.2{lf 4} 0.5).8 3.3{lf 3}.8 (0.2 2.6{lf 2}).4 |
(5.6{lf 5} 0.4).8 0.3.8 (0.3 0.6 0.5).8 0.3.8 (5.6{lf 5} 0.4).8 0.2.8 (2.2{lf 2} 0.6 0.5).4 |
(0.2 0.6 0.5).8 2.1{lf 2}.8 (0.1 0.5).8 3.3{lf 3}.16 0.2.16 (0.3 0.6 0.5).8 3.3{lf 3}.8 (0.2 0.5).4 |
(5.6{lf 5} 0.4).8 0.3.8 (4.4{lf 4} 0.6 0.5).8 0.3.8 (0.2 0.6 0.5).8 0.2.8 (0.2 0.5).4`,
  },
  {
    id: 'song-dadgad-ar-shawq',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Ashawqu Allamani (DADGAD)",
    description: "A lilting sanʿa from Nawbat al-Ḥijāz al-Mashriqī in 3/4, in A minor over open-string drones.",
    tex:
      header("Ashawqu Allamani (DADGAD)", 86, 'dadgad', "Moroccan Andalusian music (al-Āla), traditional, arranged for this app") +
      `\\ts 3 4 (3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).4 (2.1{lf 2 rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).8 2.1{lf 2 rf 4}.4 3.2{lf 3 rf 3}.8 |
(0.1{rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).8 2.1{lf 2 rf 4}.8 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).8 3.2{lf 3 rf 3}.8 2.2{lf 2 rf 3}.8 0.2{rf 3}.8 |
(0.3{rf 2} 3.5{lf 3 rf 1}).4 (0.3{rf 2} 5.6{lf 5 rf 1} 0.4{rf 1}).8 0.2{rf 3}.4 0.3{rf 2}.8 |
(0.2{rf 3} 3.6{lf 3 rf 1}).8 3.2{lf 3 rf 3}.8 (3.2{lf 2 rf 3} 3.5{lf 2 rf 1} 5.4{lf 4 rf 1}).8 0.1{rf 4}.16 7.2{lf 5 rf 3}.16 0.1{rf 4}.16 3.2{lf 2 rf 3}.16 4.3{lf 3 rf 2}.16 0.2{rf 3}.16 |
(0.3 3.5{lf 2}).4 (0.3 5.6{lf 4} 0.4).8 0.2.4 0.3.8 |
(0.2 3.6{lf 2}).8 3.2{lf 2}.8 (3.2{lf 2} 3.5{lf 2} 5.4{lf 4}).8 0.1.8 3.2{lf 2}.4 |
(3.2{t} 3.5{lf 2} 5.4{lf 4}).4 (3.2{lf 2} 5.6{lf 4} 0.4).8 3.2{lf 2}.4 4.3{lf 3}.8 |
(3.2{lf 2} 3.6{lf 2}).8 0.1.8 (3.2{lf 2} 3.5{lf 2} 5.4{lf 4}).8 2.2{lf 2}.8 0.2.4 |
(0.3 3.5{lf 3}).8 3.2{lf 3}.8 (3.2{lf 3} 5.6{lf 5} 0.4).8 0.1.8 3.2{lf 3}.8 2.1{lf 2}.8 |
(0.1 5.6{lf 5} 0.4).4 (3.2{lf 3} 0.6 0.5).8 2.2{lf 2}.8 0.2.4 |
(2.1{lf 2} 3.5{lf 3} 5.4{lf 5}).4 (5.6{lf 5} 0.4).8 2.1{lf 2}.4 3.2{lf 3}.8 |
(0.1 3.5{lf 3} 5.4{lf 5}).8 2.1{lf 2}.8 (0.1 5.6{lf 5} 0.4).8 3.2{lf 3}.8 2.2{lf 2}.8 0.2.8`,
  },
  {
    id: 'song-dadgad-ar-malakni',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Ya Man Malakni ʿAbda",
    description: "New: a sanʿa from the Quddām of Nawbat Ramal al-Māya. A gently rocking melody in D around the open D string, in 3/4.",
    tex:
      header("Ya Man Malakni ʿAbda", 86, 'dadgad', "Moroccan Andalusian music (al-Āla), traditional, arranged for this app") +
      `\\ts 3 4 (0.1{rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).4 (2.2{lf 2 rf 3} 0.6{rf 1} 0.5{rf 1}).4 (4.2{lf 4 rf 3} 0.5{rf 1}).4 |
(0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 (0.1{rf 4} 0.5{rf 1}).4 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 |
(0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 0.5{rf 1}.4 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 |
(2.1{lf 2 rf 4} 0.5{rf 1}).8 0.1{rf 4}.8 (4.2{lf 4 rf 3} 2.6{lf 2 rf 1}).8 2.1{lf 2 rf 4}.8 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).4 |
(5.6{lf 5} 0.4).4 (2.2{lf 2} 0.6 0.5).4 (4.2{lf 4} 0.5).4 |
(0.1 0.6 0.5).4 (0.1 0.5).4 (0.1 0.6 0.5).4 |
(0.1 0.6 0.5).4 0.5.4 (0.1 0.6 0.5).4 |
(2.1{lf 2} 0.5).8 0.1.8 (4.2{lf 4} 2.6{lf 2}).8 2.1{lf 2}.8 (0.1 0.6 0.5).4 |
(5.6{lf 5} 0.4).4 (2.2{lf 2} 0.6 0.5).4 (4.2{lf 4} 0.5).4 |
(0.1 0.6 0.5).4 (0.1 0.5).4 (0.1 0.6 0.5).4 |
(0.1 0.6 0.5).4 (4.2{lf 4} 0.5).4 (0.1 0.6 0.5).4 |
(2.1{lf 2} 0.5).4 2.6{lf 2}.4 (0.6 0.5).4`,
  },
  {
    id: 'song-dadgad-ar-assobho',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Assubhu Anar",
    description: "New: \"The morning has shone\", a sanʿa sung in Nawbat Ramal al-Māya, in 3/4. Melody in G over the open G and D strings.",
    tex:
      header("Assubhu Anar", 86, 'dadgad', "Moroccan Andalusian music (al-Āla), traditional, arranged for this app") +
      `\\ts 3 4 (0.3{rf 2} 5.6{lf 4 rf 1} 0.4{rf 1}).8 4.4{lf 3 rf 1}.8 (0.3{rf 2} 0.6{rf 1} 0.5{rf 1}).8 4.3{lf 3 rf 2}.8 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).8 0.3{rf 2}.8 |
(4.4{lf 3 rf 1} 0.6{rf 1} 0.5{rf 1}).4 (0.2{rf 3} 0.5{rf 1}).8 0.2{rf 3}.8 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).4 |
(0.6{rf 1} 0.5{rf 1}).8 0.2{rf 3}.8 (0.2{rf 3} 0.5{rf 1}).8 0.3{rf 2}.8 (3.2{lf 2 rf 3} 3.5{lf 2 rf 1} 5.4{lf 4 rf 1}).8 2.2{lf 2 rf 3}.8 |
(0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).4 0.5{rf 1}.8 0.1{rf 4}.8 (0.2{rf 3} 0.6{rf 1} 0.5{rf 1}).4 |
(0.6 0.5).8 0.2.8 (0.2 0.5).8 0.3.8 (4.4{lf 4} 0.6 0.5).8 0.3.8 |
(2.2{lf 2} 5.6{lf 5} 0.4).4 (0.6 0.5).8 2.2{lf 2}.8 (3.2{lf 3} 5.6{lf 5} 0.4).8 2.2{lf 2}.8 |
(3.2{lf 3} 5.6{lf 5} 0.4).8 0.1.8 (2.2{lf 2} 0.6 0.5).8 3.2{lf 3}.8 (2.2{lf 2} 5.6{lf 5} 0.4).8 2.2{lf 2}.8 |
(2.2{lf 2} 5.6{lf 5} 0.4).4 (0.1 0.6 0.5).8 2.1{lf 2}.8 (0.1 5.6{lf 5} 0.4).16 3.2{lf 3}.16 2.2{lf 2}.16 0.2.16 |
(0.3 5.6{lf 5} 0.4).8 4.4{lf 4}.8 (0.3 0.6 0.5).8 2.2{lf 2}.8 (0.2 0.6 0.5).8 0.3.8 |
(4.4{lf 4} 0.6 0.5).4 (0.2 0.5).8 0.2.8 (0.2 0.6 0.5).4 |
(0.6 0.5).8 0.2.8 (0.2 0.5).8 0.3.8 (3.2{lf 2} 3.5{lf 2} 5.4{lf 4}).8 4.3{lf 3}.8 |
(0.2 0.6 0.5).4 0.5.8 0.1.8 (0.2 5.6{lf 4} 0.4).4`,
  },
  {
    id: 'song-dadgad-ar-ghaybatuk',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Ghaybatuk",
    description: "New: \"Your absence\", a sanʿa from Nawbat al-Ḥijāz al-Mashriqī in 3/4, in A minor. Slow and singing: let the open strings carry each phrase.",
    tex:
      header("Ghaybatuk", 84, 'dadgad', "Moroccan Andalusian music (al-Āla), traditional, arranged for this app") +
      `\\ts 3 4 (3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).4 (5.6{lf 5 rf 1} 0.4{rf 1}).4 (2.1{lf 2 rf 4} 3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).4 |
(2.1{lf 2 rf 4} 3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).4 (2.1{lf 2 rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).4 (4.1{lf 4 rf 4} 3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).4 |
(5.1{lf 5 rf 4} 3.5{lf 3 rf 1} 0.3{rf 1}).4 (2.1{lf 2 rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).4 (2.1{lf 2 rf 4} 3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).4 |
(0.1{rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).4 (3.2{lf 3 rf 3} 0.6{rf 1} 0.5{rf 1}).4 (2.2{lf 2 rf 3} 5.6{lf 5 rf 1} 0.4{rf 1}).8 3.2{lf 3 rf 3}.8 |
(0.1 5.6{lf 5} 0.4).4 (0.6 0.5).4 (0.3 5.6{lf 5} 0.4).4 |
(0.3 5.6{lf 5} 0.4).4 (0.2 0.6 0.5).4 (2.2{lf 2} 5.6{lf 5} 0.4).4 |
(3.2{lf 2} 3.5{lf 2} 5.4{lf 4}).4 (3.2{lf 2} 5.6{lf 4} 0.4).4 (3.2{lf 2} 3.5{lf 2} 5.4{lf 4}).4 |
(3.2{lf 2} 3.5{lf 2} 5.4{lf 4}).4 (3.2{lf 2} 5.6{lf 4} 0.4).4 (4.3{lf 3} 5.6{lf 4} 0.4).8 3.2{lf 2}.8 |
(0.1 5.6{lf 4} 0.4).4 (0.6 0.5).4 (0.3 5.6{lf 4} 0.4).4 |
(0.3 5.6{lf 4} 0.4).4 (0.2 0.6 0.5).4 (4.3{lf 3} 5.6{lf 4} 0.4).4 |
(3.2{lf 2} 3.5{lf 2} 5.4{lf 4}).4 (2.1{lf 2} 5.6{lf 5} 0.4).4 (2.1{lf 2} 3.5{lf 3} 5.4{lf 5}).4 |
(0.1 5.6{lf 5} 0.4).4 (3.2{lf 3} 0.6 0.5).4 (2.2{lf 2} 3.5{lf 3} 5.4{lf 5}).4`,
  },
  {
    id: 'song-dadgad-ar-talata',
    level: 3,
    kind: 'song',
    tuning: 'dadgad',
    title: "Ya Talʿata Thurayya",
    description: "New: a Moroccan Andalusian sanʿa from Nawbat al-Iṣbahān in 3/4, with runs that climb up to the top D string.",
    tex:
      header("Ya Talʿata Thurayya", 86, 'dadgad', "Moroccan Andalusian music (al-Āla), traditional, arranged for this app") +
      `\\ts 3 4 (0.1{rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).4 (2.1{lf 2 rf 4} 0.6{rf 1} 0.5{rf 1}).4 (3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).8 2.1{lf 2 rf 4}.8 |
(2.1{lf 2 rf 4} 3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).8 2.1{lf 2 rf 4}.8 (2.1{lf 2 rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).4 (2.1{lf 2 rf 4} 3.5{lf 3 rf 1} 5.4{lf 5 rf 1}).8 0.1{rf 4}.8 |
(3.1{lf 2 rf 4} 3.5{lf 2 rf 1} 5.4{lf 4 rf 1}).8 2.1{lf 2 rf 4}.8 (0.1{rf 4} 5.6{lf 5 rf 1} 0.4{rf 1}).8 3.2{lf 3 rf 3}.8 (2.2{lf 2 rf 3} 5.6{lf 5 rf 1} 0.4{rf 1}).8 0.2{rf 3}.8 |
(2.2{lf 2 rf 3} 5.6{lf 5 rf 1} 0.4{rf 1}).8 3.2{lf 3 rf 3}.8 (0.1{rf 4} 0.6{rf 1} 0.5{rf 1}).8 2.1{lf 2 rf 4}.8 (4.1{lf 4 rf 4} 0.6{rf 1} 0.5{rf 1}).8 5.1{lf 5 rf 4}.8 |
(4.1{lf 4} 0.6 0.5).8 2.1{lf 2}.8 (0.1 0.5).8 3.2{lf 3}.8 (2.2{lf 2} 5.6{lf 5} 0.4).8 0.1.8 |
(3.2{lf 3} 5.6{lf 5} 0.4).8 2.2{lf 2}.8 (3.2{lf 3} 0.6 0.5).16 0.1.16 3.2{lf 3}.16 2.2{lf 2}.16 (0.2 0.6 0.5).4 |
(0.2 0.6 0.5).8 0.2.8 (2.2{lf 2} 0.5).4 (0.3 5.6{lf 5} 0.4).8 0.2.8 |
(0.2{t} 0.6 0.5).8 2.2{lf 2}.16 3.2{lf 3}.16 (0.1 0.5).8 3.2{lf 3}.16 2.2{lf 2}.16 (0.2 0.6 0.5).8 0.3.8 |
(0.2 0.6 0.5).8 2.2{lf 2}.8 (0.2 0.5).8 0.3.8 (2.4{lf 2} 3.5{lf 3}).8 0.4.8 |
(0.3 5.6{lf 5} 0.4).4 (2.2{lf 2} 0.6 0.5).4 (0.2 0.6 0.5).8 2.2{lf 2}.8 |
(0.3 5.6{lf 5} 0.4).8 2.2{lf 2}.8 (0.2 0.6 0.5).4 (0.6 0.5).8 0.2.8 |
(0.1 0.6 0.5).4 (2.1{lf 2} 0.5).4 (5.6{lf 5} 0.4).8 2.1{lf 2}.8`,
  },
  {
    id: 'song-dadgad-ar-batta',
    level: 2,
    kind: 'song',
    tuning: 'dadgad',
    title: "Taʿaleeli Ya Batta",
    description: "New: the much-loved Egyptian children's song \"Come to me, little duck\", in A minor. Short, bouncy and a nice warm-up for DADGAD.",
    tex:
      header("Taʿaleeli Ya Batta", 100, 'dadgad', "Traditional (Egypt), arranged for this app") +
      `\\ts 2 4 (2.4{lf 3 rf 1} 0.5{rf 1}).8 0.2{rf 3}.8 (0.2{rf 3} 2.6{lf 3 rf 1}).8 0.2{rf 3}.8 |
(2.2{lf 3 rf 3} 0.5{rf 1}).8 0.2{rf 3}.8 (3.2{lf 4 rf 3} 2.6{lf 3 rf 1}).8 2.2{lf 3 rf 3}.8 |
(0.1{rf 4} 0.5{rf 1}).8 3.2{lf 4 rf 3}.8 (4.3{lf 5 rf 2} 2.6{lf 3 rf 1}).8 0.2{rf 3}.8 |
(0.2{rf 3} 0.5{rf 1}).4 2.6{lf 3 rf 1}.4 |
(0.2 0.5).4 2.6{lf 3}.4 |
(0.2 2.6{lf 3}).4 (0.2 3.5{lf 4}).4 |
(0.2 0.5).4 (3.2{lf 4} 2.6{lf 3}).8 0.1.8 |
(2.1{lf 3} 0.6 0.5).8 0.1.8 (3.2{lf 4} 0.5).8 2.2{lf 3}.8 |
(0.1 2.6{lf 3}).4 (3.2{lf 4} 2.5{lf 3}).4 |
(4.3{lf 5} 2.5{lf 3}).8 3.2{lf 4}.8 (0.1 3.6{lf 4}).8 2.2{lf 3}.8 |
(3.2{lf 4} 0.5).4 (3.2{lf 4} 2.6{lf 3}).8 0.1.8 |
(3.2{lf 4} 0.5).4 (3.2{lf 4} 2.6{lf 3}).4 |
(0.2 0.5).4 (0.2 2.6{lf 3}).4 |
(3.2{lf 4} 0.5).4 2.6{lf 3}.4 |
(3.2{lf 4} 0.5).8 0.1.8 (2.1{lf 2} 2.6{lf 2}).4 |
(0.1 0.5).4 (3.2{lf 3} 2.6{lf 2}).4`,
  },
]
