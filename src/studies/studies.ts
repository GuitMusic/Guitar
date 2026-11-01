/**
 * Original fingerstyle exercises written for this app, free to bundle.
 * In alphaTex, `lf` is the fretting-hand finger (2 = index … 5 = little) and
 * `rf` is the picking-hand finger (1 = p, 2 = i, 3 = m, 4 = a). Some notes are
 * left unmarked on purpose so the app's fingering suggestions show up too.
 */
export interface Study {
  id: string
  title: string
  description: string
  tex: string
  /** 'study' = exercise written for the app, 'song' = public-domain tune arranged for the app */
  kind: 'study' | 'song'
  /** 1 = beginner, 2 = easy, 3 = intermediate */
  level: 1 | 2 | 3
}

const header = (title: string, tempo: number, extra = '', subtitle = 'Original exercise') =>
  `\\title "${title}"\n\\subtitle "${subtitle}"\n\\tempo ${tempo}\n\\track "Guitar"\n\\instrument acousticguitarsteel\n${extra}`

export const STUDIES: Study[] = [
  {
    id: 'study-thumb-and-three',
    level: 1,
    kind: 'study',
    title: 'Study 1: Thumb and Three',
    description: 'A p-i-m-a arpeggio over C, Am, F and G. Keep the thumb on the bass and let every note ring.',
    tex:
      header('Study 1: Thumb and Three', 72) +
      `:8 3.5{lf 4 rf 1} 0.3{rf 2} 1.2{lf 2 rf 3} 0.1{rf 4} 2.4{lf 3 rf 1} 0.3{rf 2} 1.2{lf 2 rf 3} 0.1{rf 4} |
0.5{rf 1} 2.3{lf 4 rf 2} 1.2{lf 2 rf 3} 0.1{rf 4} 2.4{lf 3 rf 1} 2.3{lf 4 rf 2} 1.2{lf 2 rf 3} 0.1{rf 4} |
3.4{lf 4 rf 1} 2.3{lf 3 rf 2} 1.2{lf 2 rf 3} 1.1{lf 2 rf 4} 3.4 2.3 1.2 1.1 |
3.6{lf 3 rf 1} 0.3{rf 2} 3.2{lf 4 rf 3} 3.1{lf 5 rf 4} 2.5{lf 2 rf 1} 0.3 3.2 3.1 |
(3.5{lf 4 rf 1} 2.4{lf 3 rf 1} 0.3{rf 2} 1.2{lf 2 rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-alternating-thumb',
    level: 2,
    kind: 'study',
    title: 'Study 2: Alternating Thumb',
    description:
      'The thumb walks between two bass strings on every beat while i and m fill the gaps. A pinch with a starts each bar.',
    tex:
      header('Study 2: Alternating Thumb', 80) +
      `:8 (0.6{rf 1} 0.1{rf 4}) 0.3{rf 2} 2.4{lf 4 rf 1} 0.2{rf 3} 0.6{rf 1} 0.3{rf 2} 2.4{lf 4 rf 1} 0.2{rf 3} |
(3.6{lf 3 rf 1} 3.1{lf 4 rf 4}) 0.3{rf 2} 0.4{rf 1} 0.2{rf 3} 3.6{lf 3 rf 1} 0.3{rf 2} 0.4{rf 1} 0.2{rf 3} |
(3.5{lf 4 rf 1} 0.1{rf 4}) 0.3{rf 2} 2.4{lf 3 rf 1} 1.2{lf 2 rf 3} 3.5 0.3 2.4 1.2 |
(0.4{rf 1} 2.1{lf 3 rf 4}) 2.3{lf 2 rf 2} 0.5{rf 1} 3.2{lf 4 rf 3} 0.4 2.3 0.5 3.2 |
(0.6{rf 1} 0.1{rf 4}) 0.3{rf 2} 2.4{lf 4 rf 1} 0.2{rf 3} 0.6 0.3 2.4 0.2 |
(0.6{rf 1} 2.5{lf 3} 2.4{lf 4} 0.3{rf 2} 0.2{rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-capo-waltz',
    level: 1,
    kind: 'study',
    title: 'Study 3: Capo Waltz',
    description:
      'A slow 3/4 arpeggio with the capo on fret 3. Tab numbers count from the capo; the fretboard shows where your hand really goes.',
    tex:
      header('Study 3: Capo Waltz', 96, '\\capo 3\n') +
      `\\ts 3 4 :8 3.5{lf 4 rf 1} 0.3{rf 2} 1.2{lf 2 rf 3} 0.3{rf 2} 1.2{rf 3} 0.3{rf 2} |
2.5{lf 3 rf 1} 0.3{rf 2} 0.2{rf 3} 0.3 0.2 0.3 |
0.5{rf 1} 2.3{lf 4 rf 2} 1.2{lf 2 rf 3} 2.3 1.2 2.3 |
3.4{lf 4 rf 1} 2.3{lf 3 rf 2} 1.2{lf 2 rf 3} 2.3 1.2 2.3 |
3.6{lf 3 rf 1} 0.3{rf 2} 0.2{rf 3} 0.3 0.2 0.3 |
(3.5{lf 4 rf 1} 2.4{lf 3 rf 1} 0.3{rf 2} 1.2{lf 2 rf 3} 0.1{rf 4}).2 {d}`,
  },
  {
    id: 'study-travis',
    level: 2,
    kind: 'study',
    title: 'Study 4: Travis Picking',
    description:
      'The thumb alternates between two bass strings on every beat while i and m answer in between. This is the engine behind Landslide and countless folk songs.',
    tex:
      header('Study 4: Travis Picking', 80) +
      `:8 (3.5{lf 4 rf 1} 1.2{lf 2 rf 3}) 0.3{rf 2} 2.4{lf 3 rf 1} 1.2{rf 3} 3.5{rf 1} 0.3{rf 2} 2.4{rf 1} 1.2{rf 3} |
(2.5{lf 2 rf 1} 0.2{rf 3}) 0.3{rf 2} 0.4{rf 1} 0.2{rf 3} 2.5{rf 1} 0.3{rf 2} 0.4{rf 1} 0.2{rf 3} |
(0.5{rf 1} 1.2{lf 2 rf 3}) 0.3{rf 2} 2.4{lf 3 rf 1} 1.2{rf 3} 0.5{rf 1} 0.3{rf 2} 2.4{rf 1} 1.2{rf 3} |
(2.5{lf 2 rf 1} 0.2{rf 3}) 0.3{rf 2} 0.4{rf 1} 0.2{rf 3} 2.5{rf 1} 0.3{rf 2} 0.4{rf 1} 0.2{rf 3} |
(3.5{lf 4} 1.2{lf 2}) 0.3 2.4{lf 3} 1.2 3.5 0.3 2.4 1.2 |
(2.5{lf 2} 0.2) 0.3 0.4 0.2 2.5 0.3 0.4 0.2 |
(0.5 1.2{lf 2}) 0.3 2.4{lf 3} 1.2 (3.6{lf 3} 0.2) 0.3 0.4 0.2 |
(3.5{lf 4} 1.2{lf 2}) 0.3 2.4{lf 3} 1.2 3.5 0.3 2.4 1.2 |
(3.5{lf 4 rf 1} 2.4{lf 3} 0.3{rf 2} 1.2{lf 2 rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-pinches',
    level: 1,
    kind: 'study',
    title: 'Study 5: Pinches',
    description: 'Thumb and a finger pluck together, then i answers on its own. Squeeze, don’t pull: both notes should sound as one.',
    tex:
      header('Study 5: Pinches', 76) +
      `:8 (3.6{lf 3 rf 1} 3.1{lf 4 rf 4}) 0.3{rf 2} (0.4{rf 1} 0.2{rf 3}) 0.3{rf 2} (3.6{rf 1} 3.1{rf 4}) 0.3{rf 2} (0.4{rf 1} 0.2{rf 3}) 0.3{rf 2} |
(3.5{lf 4 rf 1} 0.1{rf 4}) 0.3{rf 2} (2.4{lf 3 rf 1} 1.2{lf 2 rf 3}) 0.3{rf 2} (3.5{rf 1} 0.1{rf 4}) 0.3{rf 2} (2.4{rf 1} 1.2{rf 3}) 0.3{rf 2} |
(0.4{rf 1} 2.1{lf 3 rf 4}) 2.3{lf 2 rf 2} (0.5{rf 1} 3.2{lf 4 rf 3}) 2.3{rf 2} (0.4{rf 1} 2.1{rf 4}) 2.3{rf 2} (0.5{rf 1} 3.2{rf 3}) 2.3{rf 2} |
(0.6{rf 1} 0.1{rf 4}) 0.3{rf 2} (2.5{lf 3 rf 1} 0.2{rf 3}) 0.3{rf 2} (2.4{lf 4 rf 1} 0.1{rf 4}) 0.3{rf 2} (2.5{rf 1} 0.2{rf 3}) 0.3{rf 2} |
(3.6{lf 3} 3.1{lf 4}) 0.3 (0.4 0.2) 0.3 (3.6 3.1) 0.3 (0.4 0.2) 0.3 |
(3.6{lf 3 rf 1} 2.5{lf 2} 0.4 0.3{rf 2} 0.2{rf 3} 3.1{lf 4 rf 4}).1`,
  },
  {
    id: 'study-slurs',
    level: 2,
    kind: 'study',
    title: 'Study 6: Hammer-ons and Pull-offs',
    description:
      'The fretting hand makes the second note by itself: hammer a finger down, or pull it off sideways so the string sounds again. The thumb keeps the A bass going.',
    tex:
      header('Study 6: Hammer-ons and Pull-offs', 72) +
      `:8 0.5{rf 1} 0.3{rf 2 h} 2.3{lf 3} 1.2{lf 2 rf 3} 0.5{rf 1} 2.3{lf 3 rf 2 h} 0.3 1.2{lf 2 rf 3} |
0.5{rf 1} 0.2{rf 3 h} 1.2{lf 2} 0.1{rf 4} 0.5{rf 1} 1.2{lf 2 rf 3 h} 0.2 2.3{lf 3 rf 2} |
0.6{rf 1} 0.4{rf 2 h} 2.4{lf 3} 1.3{lf 2 rf 2} 0.6{rf 1} 2.4{lf 3 rf 2 h} 0.4 1.3{lf 2 rf 2} |
0.5{rf 1} 0.1{rf 4 h} 1.1{lf 2} 0.2{rf 3} 0.5{rf 1} 1.1{lf 2 rf 4 h} 0.1 0.2{rf 3} |
0.5 0.3{h} 2.3{lf 3} 1.2{lf 2} 0.5 2.3{lf 3 h} 0.3 1.2 |
0.6 0.4{h} 2.4{lf 3} 1.3{lf 2} 0.6 2.4{lf 3 h} 0.4 1.3 |
(0.5{rf 1} 2.4{lf 3} 2.3{lf 4} 1.2{lf 2 rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-spider',
    level: 1,
    kind: 'study',
    title: 'Study 7: Spider Walk',
    description:
      'A warm-up for the fretting hand: one finger per fret, 1-2-3-4 on every string and back. Alternate i and m. Keep each finger down until the next one lands.',
    tex:
      header('Study 7: Spider Walk', 70) +
      `:8 1.6{lf 2 rf 2} 2.6{lf 3 rf 3} 3.6{lf 4 rf 2} 4.6{lf 5 rf 3} 1.5{lf 2 rf 2} 2.5{lf 3 rf 3} 3.5{lf 4 rf 2} 4.5{lf 5 rf 3} |
1.4{lf 2} 2.4{lf 3} 3.4{lf 4} 4.4{lf 5} 1.3{lf 2} 2.3{lf 3} 3.3{lf 4} 4.3{lf 5} |
1.2{lf 2} 2.2{lf 3} 3.2{lf 4} 4.2{lf 5} 1.1{lf 2} 2.1{lf 3} 3.1{lf 4} 4.1{lf 5} |
4.1{lf 5} 3.1{lf 4} 2.1{lf 3} 1.1{lf 2} 4.2{lf 5} 3.2{lf 4} 2.2{lf 3} 1.2{lf 2} |
4.3{lf 5} 3.3{lf 4} 2.3{lf 3} 1.3{lf 2} 4.4{lf 5} 3.4{lf 4} 2.4{lf 3} 1.4{lf 2} |
4.5{lf 5} 3.5{lf 4} 2.5{lf 3} 1.5{lf 2} 4.6{lf 5} 3.6{lf 4} 2.6{lf 3} 1.6{lf 2} |
1.6{lf 2 rf 1}.1`,
  },
  {
    id: 'study-thumb-independence',
    level: 3,
    kind: 'study',
    title: 'Study 8: Steady Thumb',
    description:
      'The thumb plays a steady quarter-note bass while the fingers play a melody in between. Count out loud at first: the thumb never waits for the tune.',
    tex:
      header('Study 8: Steady Thumb', 66) +
      `:8 (0.6{rf 1} 0.1{rf 3}) 2.1{lf 3 rf 2} (0.6{rf 1} 3.1{lf 4 rf 3}) 2.1{lf 3 rf 2} (0.6{rf 1} 0.1{rf 3}) 3.2{lf 4 rf 2} (0.6{rf 1} 0.2{rf 3}) 3.2{lf 4 rf 2} |
(0.6{rf 1} 0.1{rf 3}) 2.1{lf 3 rf 2} (0.6{rf 1} 0.1{rf 3}) 3.2{lf 4 rf 2} (0.6{rf 1} 0.2{rf 3}) 0.3{rf 2} (0.6{rf 1} 0.2{rf 3}) 0.3{rf 2} |
(0.5{rf 1} 0.1{rf 3}) 1.2{lf 2 rf 2} (0.5{rf 1} 0.1{rf 3}) 3.2{lf 4 rf 2} (0.5{rf 1} 1.2{lf 2 rf 3}) 2.3{lf 3 rf 2} (0.5{rf 1} 1.2{rf 3}) 0.1{rf 2} |
(0.6 2.1{lf 3}) 0.1 (2.5{lf 2} 0.2) 2.1{lf 3} (0.6 0.1) 3.2{lf 4} (2.5{lf 2} 0.2) 0.3 |
(0.6 0.1) 2.1{lf 3} (0.6 3.1{lf 4}) 2.1{lf 3} (0.6 0.1) 3.2{lf 4} (0.6 0.2) 3.2{lf 4} |
(0.5 0.1) 1.2{lf 2} (0.5 3.2{lf 4}) 1.2{lf 2} (0.6 0.2) 0.3 (2.5{lf 2} 2.4{lf 3}) 0.3 |
(0.6{rf 1} 2.5{lf 2} 2.4{lf 3} 0.3{rf 2} 0.2{rf 3} 0.1{rf 4}).1`,
  },
  {
    id: 'study-giuliani',
    level: 2,
    kind: 'study',
    title: 'Study 9: p-i-m-a-m-i Arpeggio',
    description:
      'A rolling six-note arpeggio in 3/4, in the style of Giuliani’s 120 right-hand studies. Thumb on the bass, then up and back down: i, m, a, m, i.',
    tex:
      header('Study 9: p-i-m-a-m-i Arpeggio', 84, '\\ts 3 4\n') +
      `:8 3.5{lf 4 rf 1} 0.3{rf 2} 1.2{lf 2 rf 3} 0.1{rf 4} 1.2{rf 3} 0.3{rf 2} |
3.6{lf 4 rf 1} 0.3{rf 2} 0.2{rf 3} 1.1{lf 2 rf 4} 0.2{rf 3} 0.3{rf 2} |
0.5{rf 1} 2.3{lf 4 rf 2} 1.2{lf 2 rf 3} 0.1{rf 4} 1.2{rf 3} 2.3{rf 2} |
0.6{rf 1} 1.3{lf 2 rf 2} 0.2{rf 3} 0.1{rf 4} 0.2{rf 3} 1.3{rf 2} |
0.4{rf 1} 2.3{lf 3 rf 2} 3.2{lf 4 rf 3} 1.1{lf 2 rf 4} 3.2{rf 3} 2.3{rf 2} |
3.6{lf 4} 0.3 0.2 1.1{lf 2} 0.2 0.3 |
3.5{lf 4} 0.3 1.2{lf 2} 0.1 1.2 0.3 |
(3.5{lf 4 rf 1} 2.4{lf 3} 0.3{rf 2} 1.2{lf 2 rf 3} 0.1{rf 4}).2 {d}`,
  },
  {
    id: 'study-barre-arpeggios',
    level: 3,
    kind: 'study',
    title: 'Study 10: Barre Arpeggios',
    description:
      'Arpeggios through E-shape and A-shape barre chords up and down the neck. Set the whole barre before the bass note and keep it down for the full bar.',
    tex:
      header('Study 10: Barre Arpeggios', 76) +
      `:8 3.5{lf 2 rf 1} 5.3{lf 4 rf 2} 5.2{lf 4 rf 3} 3.1{lf 2 rf 4} 5.2{rf 3} 5.3{rf 2} 5.4{lf 4 rf 1} 5.3{rf 2} |
5.6{lf 2 rf 1} 5.3{lf 2 rf 2} 5.2{rf 3} 5.1{rf 4} 5.2 5.3 7.4{lf 5 rf 1} 5.3 |
5.5{lf 2 rf 1} 7.3{lf 5 rf 2} 6.2{lf 3 rf 3} 5.1{lf 2 rf 4} 6.2 7.3 7.4{lf 4 rf 1} 7.3 |
3.6{lf 2 rf 1} 4.3{lf 3 rf 2} 3.2{lf 2 rf 3} 3.1{lf 2 rf 4} 3.2 4.3 5.4{lf 5 rf 1} 4.3 |
1.6{lf 2 rf 1} 2.3{lf 3 rf 2} 1.2{lf 2 rf 3} 1.1{lf 2 rf 4} 1.2 2.3 3.4{lf 5 rf 1} 2.3 |
0.6{rf 1} 1.3{lf 2 rf 2} 0.2{rf 3} 0.1{rf 4} 0.2 1.3 2.5{lf 3 rf 1} 1.3 |
(5.6{lf 2 rf 1} 7.5{lf 4} 7.4{lf 5} 5.3 5.2 5.1).1`,
  },
  {
    id: 'study-tremolo',
    level: 3,
    kind: 'study',
    title: 'Study 11: Tremolo',
    description:
      'Thumb on the beat, then a-m-i on the same melody note. Aim for even, quiet repeats so the tune sounds like one long held note. Start slow; speed comes later.',
    tex:
      header('Study 11: Tremolo', 56) +
      `:16 0.5{rf 1} 0.1{rf 4} 0.1{rf 3} 0.1{rf 2} 2.4{lf 3 rf 1} 0.1{rf 4} 0.1{rf 3} 0.1{rf 2} 2.3{lf 4 rf 1} 1.1{lf 2 rf 4} 1.1{rf 3} 1.1{rf 2} 2.4{lf 3 rf 1} 0.1{rf 4} 0.1{rf 3} 0.1{rf 2} |
0.4 1.1{lf 2} 1.1 1.1 2.3{lf 3} 1.1 1.1 1.1 0.4 3.1{lf 4} 3.1 3.1 2.3{lf 3} 1.1 1.1 1.1 |
0.6 0.1 0.1 0.1 2.5{lf 3} 0.1 0.1 0.1 2.4{lf 4} 0.2 0.2 0.2 1.3{lf 2} 0.2 0.2 0.2 |
0.5 0.1 0.1 0.1 2.4{lf 3} 1.2{lf 2} 1.2 1.2 2.3{lf 4} 1.2 1.2 1.2 2.4 0.1 0.1 0.1 |
(0.5 2.4{lf 3} 2.3{lf 4} 1.2{lf 2} 0.1).1`,
  },
  {
    id: 'study-thirds',
    level: 3,
    kind: 'study',
    title: 'Study 12: Thirds Up the Neck',
    description:
      'Pairs of notes a third apart on the B and high E strings, shifting from the open position to the 12th fret and back, then the same pairs broken. Lead every shift with the index finger.',
    tex:
      header('Study 12: Thirds Up the Neck', 72) +
      `:4 (3.5{lf 4 rf 1} 1.2{lf 2 rf 2} 0.1{rf 3}) (3.2{lf 4 rf 2} 1.1{lf 2 rf 3}) (5.2{lf 4 rf 2} 3.1{lf 2 rf 3}) (6.2{lf 3 rf 2} 5.1{lf 2 rf 3}) |
(8.2{lf 3} 7.1{lf 2}) (10.2{lf 4} 8.1{lf 2}) (12.2{lf 4} 10.1{lf 2}) (13.2{lf 3} 12.1{lf 2}) |
(13.2 12.1) (12.2 10.1) (10.2 8.1) (8.2 7.1) |
(6.2 5.1) (5.2 3.1) (3.2 1.1) (1.2 0.1) |
:8 1.2{rf 2} 0.1{rf 3} 3.2 1.1 5.2 3.1 6.2 5.1 |
8.2 7.1 10.2 8.1 12.2 10.1 13.2 12.1 |
12.1 13.2 10.1 12.2 8.1 10.2 7.1 8.2 |
5.1 6.2 3.1 5.2 1.1 3.2 0.1 1.2 |
(3.5 2.4 0.3 1.2 0.1).1`,
  },
]

const PD = 'Traditional, arranged for this app'

export const SONGS: Study[] = [
  {
    id: 'song-greensleeves',
    level: 2,
    kind: 'song',
    title: 'Greensleeves',
    description: 'English folk tune from the 1500s. Melody on the treble strings with a bass note at the start of each bar.',
    tex:
      header('Greensleeves', 100, '', PD) +
      `\\ts 1 4 2.3{lf 4}.4 |
\\ts 3 4 (1.2{lf 2} 0.5).2 3.2{lf 4}.4 |
(0.1 3.5{lf 4}).4 {d} 1.1{lf 2}.8 0.1.4 |
(3.2{lf 4} 3.6{lf 3}).2 0.2.4 |
(0.3 0.6).4 {d} 2.3{lf 3}.8 0.2.4 |
(1.2{lf 2} 0.5).2 2.3{lf 3}.4 |
(2.3{lf 3} 0.5).4 {d} 1.3{lf 2}.8 2.3{lf 3}.4 |
(0.2 0.6).2 1.3{lf 2}.4 |
(2.4{lf 3} 0.6).2 2.3{lf 3}.4 |
(1.2{lf 2} 0.5).2 3.2{lf 4}.4 |
(0.1 3.5{lf 4}).4 {d} 1.1{lf 2}.8 0.1.4 |
(3.2{lf 4} 3.6{lf 3}).2 0.2.4 |
(0.3 0.6).4 {d} 2.3{lf 3}.8 0.2.4 |
(1.2{lf 2} 0.5).4 {d} 0.2.8 2.3{lf 3}.4 |
(1.3{lf 2} 0.6).4 {d} 4.4{lf 5}.8 1.3{lf 2}.4 |
(0.5 2.4{lf 3} 2.3{lf 4} 1.2{lf 2} 0.1).2 {d}`,
  },
  {
    id: 'song-rising-sun',
    level: 2,
    kind: 'song',
    title: 'House of the Rising Sun',
    description: 'American folk song. A six-note arpeggio in 6/8 over Am, C, D, F and E: thumb on the bass, then i-m-a-m-i.',
    tex:
      header('House of the Rising Sun', 110, '', PD) +
      `\\ts 6 8 :8 0.5{rf 1} 2.3{lf 4} 1.2{lf 2} 0.1 1.2 2.3 |
3.5{lf 4} 0.3 1.2{lf 2} 0.1 1.2 0.3 |
0.4 2.3{lf 2} 3.2{lf 4} 2.1{lf 3} 3.2 2.3 |
3.4{lf 4} 2.3{lf 3} 1.2{lf 2} 1.1{lf 2} 1.2 2.3 |
0.5 2.3{lf 4} 1.2{lf 2} 0.1 1.2 2.3 |
3.5{lf 4} 0.3 1.2{lf 2} 0.1 1.2 0.3 |
0.6 1.3{lf 2} 0.2 0.1 0.2 1.3 |
0.6 1.3{lf 2} 0.2 0.1 0.2 1.3 |
0.5 2.3{lf 4} 1.2{lf 2} 0.1 1.2 2.3 |
3.5{lf 4} 0.3 1.2{lf 2} 0.1 1.2 0.3 |
0.4 2.3{lf 2} 3.2{lf 4} 2.1{lf 3} 3.2 2.3 |
3.4{lf 4} 2.3{lf 3} 1.2{lf 2} 1.1{lf 2} 1.2 2.3 |
0.5 2.3{lf 4} 1.2{lf 2} 0.1 1.2 2.3 |
0.6 1.3{lf 2} 0.2 0.1 0.2 1.3 |
0.5 2.3{lf 4} 1.2{lf 2} 0.1 1.2 2.3 |
(0.5 2.4{lf 3} 2.3{lf 4} 1.2{lf 2} 0.1).2 {d}`,
  },
  {
    id: 'song-spanish-romance',
    level: 3,
    kind: 'song',
    title: 'Spanish Romance (opening)',
    description:
      'The anonymous 1800s classic. Triplets with the melody on the first string (a), open B and G strings (m, i) and the bass on the beat (p).',
    tex: header('Spanish Romance (opening)', 66, '\\ts 3 4\n', 'Anonymous, arranged for this app') + `(7.1 0.6).8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 7.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 7.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} |
(7.1 0.6).8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 5.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 3.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} |
(3.1 0.6).8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 2.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 0.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} |
(0.1 0.6).8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 3.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 7.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} |
(12.1 0.6).8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 12.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 12.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} |
(12.1 0.6).8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 10.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 8.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} |
(8.1 0.5).8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 7.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 5.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} |
(5.1 0.5).8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 7.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} 8.1.8 {tu 3} 0.2.8 {tu 3} 0.3.8 {tu 3} |
(0.6 2.5 2.4 0.3 0.2 0.1).2 {d}`,
  },
  {
    id: 'song-ode-to-joy',
    level: 1,
    kind: 'song',
    title: 'Ode to Joy',
    description: "Beethoven's melody with a bass note on each bar. A gentle first song for thumb and fingers together.",
    tex:
      header('Ode to Joy', 100, '', 'Ludwig van Beethoven, arranged for this app') +
      `(0.1 3.5{lf 4}).4 0.1 1.1{lf 2} 3.1{lf 4} |
(3.1{lf 4} 3.6{lf 3}).4 1.1{lf 2} 0.1 3.2{lf 4} |
(1.2{lf 2} 3.5{lf 4}).4 1.2 3.2{lf 4} 0.1 |
(0.1 3.6{lf 3}).4 {d} 3.2{lf 4}.8 3.2.2 |
(0.1 3.5{lf 4}).4 0.1 1.1{lf 2} 3.1{lf 4} |
(3.1{lf 4} 3.6{lf 3}).4 1.1{lf 2} 0.1 3.2{lf 4} |
(1.2{lf 2} 3.5{lf 4}).4 1.2 3.2{lf 4} 0.1 |
(3.2{lf 4} 3.6{lf 3}).4 {d} 1.2{lf 2}.8 (1.2 3.5{lf 4} 2.4{lf 3}).2`,
  },
  {
    id: 'song-fur-elise',
    level: 2,
    kind: 'song',
    title: 'Für Elise (theme)',
    description: 'Beethoven’s famous theme, an octave lower to suit the guitar. Melody on the treble strings with the A and E bass under it.',
    tex:
      header('Für Elise (theme)', 66, '', 'Ludwig van Beethoven, arranged for this app') +
      `\\ts 1 8 :16 0.1 4.2{lf 5} |
\\ts 3 8 0.1 4.2{lf 5} 0.1 0.2 3.2{lf 4} 1.2{lf 2} |
(2.3{lf 4} 0.5).8 {d} 3.5{lf 4}.16 2.4{lf 3}.16 2.3{lf 4}.16 |
(0.2 0.6).8 {d} 2.4{lf 3}.16 1.3{lf 2}.16 0.2.16 |
(1.2{lf 2} 0.5).8 {d} 2.4{lf 3}.16 0.1.16 4.2{lf 5}.16 |
0.1.16 4.2{lf 5}.16 0.1.16 0.2.16 3.2{lf 4}.16 1.2{lf 2}.16 |
(2.3{lf 4} 0.5).8 {d} 3.5{lf 4}.16 2.4{lf 3}.16 2.3{lf 4}.16 |
(0.2 0.6).8 {d} 2.4{lf 3}.16 1.2{lf 2}.16 0.2.16 |
(2.3{lf 4} 0.5).4 {d}`,
  },
  {
    id: 'song-minuet-in-g',
    level: 2,
    kind: 'song',
    title: 'Minuet in G',
    description: 'The minuet from the Notebook for Anna Magdalena Bach, an octave lower so it sits in first position. A bass note on each bar.',
    tex:
      header('Minuet in G', 100, '\\ts 3 4\n', 'Christian Petzold (Anna Magdalena Bach Notebook), arranged for this app') +
      `(3.2{lf 4} 3.6{lf 3}).4 0.3.8 2.3{lf 3}.8 0.2.8 1.2{lf 2}.8 |
(3.2{lf 4} 3.6{lf 3}).4 0.3.4 0.3.4 |
(0.1 3.5{lf 4}).4 1.2{lf 2}.8 3.2{lf 4}.8 0.1.8 2.1{lf 3}.8 |
(3.1{lf 4} 3.6{lf 3}).4 0.3.4 0.3.4 |
(1.2{lf 2} 3.5{lf 4}).4 3.2{lf 4}.8 1.2{lf 2}.8 0.2.8 2.3{lf 3}.8 |
(0.2 3.6{lf 3}).4 1.2{lf 2}.8 0.2.8 2.3{lf 3}.8 0.3.8 |
(4.4{lf 5} 0.5).4 0.3.8 2.3{lf 3}.8 0.2.8 0.3.8 |
(2.3{lf 3} 0.4).2 {d} |
(3.2{lf 4} 3.6{lf 3}).4 0.3.8 2.3{lf 3}.8 0.2.8 1.2{lf 2}.8 |
(3.2{lf 4} 3.6{lf 3}).4 0.3.4 0.3.4 |
(0.1 3.5{lf 4}).4 1.2{lf 2}.8 3.2{lf 4}.8 0.1.8 2.1{lf 3}.8 |
(3.1{lf 4} 3.6{lf 3}).4 0.3.4 0.3.4 |
(1.2{lf 2} 3.5{lf 4}).4 3.2{lf 4}.8 1.2{lf 2}.8 0.2.8 2.3{lf 3}.8 |
(0.2 3.6{lf 3}).4 1.2{lf 2}.8 0.2.8 2.3{lf 3}.8 0.3.8 |
(2.3{lf 3} 0.4).4 0.2.8 2.3{lf 3}.8 0.3.8 4.4{lf 5}.8 |
(0.3 3.6{lf 3}).2 {d}`,
  },
  {
    id: 'song-canon-in-d',
    level: 2,
    kind: 'song',
    title: 'Canon in D',
    description: 'Pachelbel’s famous chord sequence as a flowing arpeggio: thumb on the bass, then fingers up and back down. Twice through, the second time going down first.',
    tex:
      header('Canon in D', 72, '', 'Johann Pachelbel, arranged for this app') +
      `:8 0.4{rf 1} 2.3{lf 2 rf 2} 3.2{lf 4 rf 3} 2.1{lf 3 rf 4} 3.2{rf 3} 2.3{rf 2} 3.2{rf 3} 2.1{rf 4} |
0.5{rf 1} 2.3{lf 3 rf 2} 2.2{lf 4 rf 3} 0.1{rf 4} 2.2{rf 3} 2.3{rf 2} 2.2{rf 3} 0.1{rf 4} |
2.5{lf 2 rf 1} 4.3{lf 4 rf 2} 3.2{lf 3 rf 3} 2.1{lf 2 rf 4} 3.2{rf 3} 4.3{rf 2} 3.2{rf 3} 2.1{rf 4} |
2.6{lf 2 rf 1} 2.3{lf 2 rf 2} 2.2{lf 2 rf 3} 2.1{lf 2 rf 4} 2.2{rf 3} 2.3{rf 2} 2.2{rf 3} 2.1{rf 4} |
3.6{lf 3 rf 1} 0.3{rf 2} 0.2{rf 3} 3.1{lf 4 rf 4} 0.2{rf 3} 0.3{rf 2} 0.2{rf 3} 3.1{rf 4} |
0.4{rf 1} 2.3{lf 2 rf 2} 3.2{lf 4 rf 3} 2.1{lf 3 rf 4} 3.2{rf 3} 2.3{rf 2} 3.2{rf 3} 2.1{rf 4} |
3.6{lf 3 rf 1} 0.3{rf 2} 0.2{rf 3} 3.1{lf 4 rf 4} 0.2{rf 3} 0.3{rf 2} 0.2{rf 3} 3.1{rf 4} |
0.5{rf 1} 2.3{lf 3 rf 2} 2.2{lf 4 rf 3} 0.1{rf 4} 2.2{rf 3} 2.3{rf 2} 2.2{rf 3} 0.1{rf 4} |
0.4 2.1{lf 3} 3.2{lf 4} 2.3{lf 2} 3.2 2.1 3.2 2.3 |
0.5 0.1 2.2{lf 4} 2.3{lf 3} 2.2 0.1 2.2 2.3 |
2.5{lf 2} 2.1{lf 2} 3.2{lf 3} 4.3{lf 4} 3.2 2.1 3.2 4.3 |
2.6{lf 2} 2.1{lf 2} 2.2{lf 2} 2.3{lf 2} 2.2 2.1 2.2 2.3 |
3.6{lf 3} 3.1{lf 4} 0.2 0.3 0.2 3.1 0.2 0.3 |
0.4 2.1{lf 3} 3.2{lf 4} 2.3{lf 2} 3.2 2.1 3.2 2.3 |
3.6{lf 3} 3.1{lf 4} 0.2 0.3 0.2 3.1 0.2 0.3 |
0.5 0.1 2.2{lf 4} 2.3{lf 3} 2.2 0.1 2.2 2.3 |
(0.4 2.3{lf 2} 3.2{lf 4} 2.1{lf 3}).1`,
  },
  {
    id: 'song-silent-night',
    level: 1,
    kind: 'song',
    title: 'Silent Night',
    description: 'Franz Gruber’s carol in G, in 3/4. A bass note rings under each bar while the melody sings on top. Mostly first position.',
    tex:
      header('Silent Night', 84, '\\ts 3 4\n', 'Franz Xaver Gruber, arranged for this app') +
      `(3.2{lf 4} 3.6{lf 3}).4 {d} 0.1.8 3.2{lf 4}.4 |
(0.2 3.6{lf 3}).2 {d} |
(3.2{lf 4} 3.6{lf 3}).4 {d} 0.1.8 3.2{lf 4}.4 |
(0.2 3.6{lf 3}).2 {d} |
(5.1{lf 2} 0.4).2 5.1{lf 2}.4 |
(2.1{lf 3} 0.4).2 {d} |
(3.1{lf 4} 3.6{lf 3}).2 3.1{lf 4}.4 |
(3.2{lf 4} 3.6{lf 3}).2 {d} |
(0.1 3.5{lf 4}).2 0.1.4 |
(3.1{lf 4} 3.6{lf 3}).4 {d} 2.1{lf 3}.8 0.1.4 |
(3.2{lf 4} 3.6{lf 3}).4 {d} 0.1.8 3.2{lf 4}.4 |
(0.2 3.6{lf 3}).2 {d} |
(0.1 3.5{lf 4}).2 0.1.4 |
(3.1{lf 4} 3.6{lf 3}).4 {d} 2.1{lf 3}.8 0.1.4 |
(3.2{lf 4} 3.6{lf 3}).4 {d} 0.1.8 3.2{lf 4}.4 |
(0.2 3.6{lf 3}).2 {d} |
(5.1{lf 2} 0.4).2 5.1{lf 2}.4 |
(8.1{lf 5} 0.4).4 {d} 5.1{lf 2}.8 2.1{lf 3}.4 |
(3.1{lf 4} 3.6{lf 3}).2 {d} |
(7.1{lf 4} 3.6{lf 3}).2 {d} |
(3.1{lf 4} 3.6{lf 3}).4 3.2{lf 4}.4 0.2.4 |
(3.2{lf 4} 0.4).4 {d} 1.2{lf 2}.8 2.3{lf 3}.4 |
(0.3 3.6{lf 3} 0.4).2 {d}`,
  },
  {
    id: 'song-malaguena',
    level: 2,
    kind: 'song',
    title: 'Malagueña',
    description: 'The traditional Andalusian malagueña (not Lecuona’s 1928 piece): Am, G, F, E with the open high E ringing, then the famous melody in the thumb on the bass strings.',
    tex:
      header('Malagueña', 120, '\\ts 3 4\n', 'Traditional (Spain), arranged for this app') +
      `:8 (0.5{rf 1} 1.2{lf 2 rf 2}) 0.1{rf 3} 1.2{rf 2} 0.1{rf 3} 1.2{rf 2} 0.1{rf 3} |
(3.6{lf 4 rf 1} 0.2{rf 2}) 0.1{rf 3} 0.2{rf 2} 0.1{rf 3} 0.2{rf 2} 0.1{rf 3} |
(1.6{lf 2 rf 1} 1.2{lf 2 rf 2}) 0.1{rf 3} 1.2{rf 2} 0.1{rf 3} 1.2{rf 2} 0.1{rf 3} |
(0.6{rf 1} 0.2{rf 2}) 0.1{rf 3} 0.2{rf 2} 0.1{rf 3} 0.2{rf 2} 0.1{rf 3} |
(0.5 1.2{lf 2}) 0.1 1.2 0.1 1.2 0.1 |
(3.6{lf 4} 0.2) 0.1 0.2 0.1 0.2 0.1 |
(1.6{lf 2} 1.2{lf 2}) 0.1 1.2 0.1 1.2 0.1 |
(0.6 0.2) 0.1 0.2 0.1 0.2 0.1 |
0.6{rf 1} 0.1{rf 3} 1.6{lf 2 rf 1} 0.1{rf 3} 4.6{lf 5 rf 1} 0.1{rf 3} |
0.5{rf 1} 0.1{rf 3} 2.5{lf 3 rf 1} 0.1{rf 3} 3.5{lf 4 rf 1} 0.1{rf 3} |
2.5{lf 3 rf 1} 0.1{rf 3} 0.5{rf 1} 0.1{rf 3} 4.6{lf 5 rf 1} 0.1{rf 3} |
1.6{lf 2 rf 1} 0.1{rf 3} 0.6{rf 1} 0.1{rf 3} (0.6 2.5{lf 3} 2.4{lf 4} 1.3{lf 2} 0.2 0.1).4`,
  },
  {
    id: 'song-gymnopedie',
    level: 3,
    kind: 'song',
    title: 'Gymnopédie No. 1 (opening)',
    description:
      'Satie’s slow, floating waltz. The thumb plays a low note on beat one, the fingers answer with a soft chord, and the melody sits on top. Let everything ring.',
    tex:
      header('Gymnopédie No. 1 (opening)', 72, '\\ts 3 4\n', 'Erik Satie (1888), arranged for this app') +
      `3.6{lf 3 rf 1}.4 (4.4{lf 4 rf 1} 0.3{rf 2} 0.2{rf 3}).2 |
0.4{rf 1}.4 (2.3{lf 2 rf 2} 2.2{lf 2 rf 3} 2.1{lf 2 rf 4}).2 |
3.6.4 (4.4 0.3 0.2).2 |
0.4.4 (2.3 2.2 2.1).2 |
3.6.4 (4.4 0.3 0.2 2.1{lf 2 rf 4}).4 5.1{lf 5 rf 4}.4 |
(0.4 3.1{lf 3}).4 (2.3{lf 2} 2.2{lf 2} 2.1{lf 2}).4 2.2.4 |
(3.6{lf 3} 0.2).4 (4.4{lf 4} 0.3 2.2{lf 2}).4 3.2{lf 3}.4 |
(0.4 2.3{lf 2}).4 (2.2 2.1).2 |
(3.6{lf 3} 4.4{lf 4}).4 (0.3 0.2).2 |
(0.4 2.3 2.2 2.1).2 {d}`,
  },
  {
    id: 'song-bach-prelude',
    level: 3,
    kind: 'song',
    title: 'Prelude in C (opening)',
    description:
      'The first prelude of Bach’s Well-Tempered Clavier as a guitar arpeggio piece: the same eight-note pattern twice a bar while the chords move underneath. Hold each chord shape for the whole bar.',
    tex:
      header('Prelude in C (opening)', 66, '', 'J. S. Bach, BWV 846 (1722), arranged for this app') +
      ':16 3.5{lf 4 rf 1} 2.4{lf 3 rf 1} 0.3{rf 2} 1.2{lf 2 rf 3} 0.1{rf 4} 0.3{rf 2} 1.2{rf 3} 0.1{rf 4} 3.5 2.4 0.3 1.2 0.1 0.3 1.2 0.1 |\n' +
      [
        ['3.5{lf 4}', '0.4', '2.3{lf 3}', '3.2{lf 5}', '1.1{lf 2}'],
        ['2.5{lf 3}', '0.4', '0.3', '3.2{lf 4}', '1.1{lf 2}'],
        ['3.5', '2.4', '0.3', '1.2', '0.1'],
        ['3.5{lf 4}', '2.4{lf 2}', '2.3{lf 3}', '0.1', '5.1{lf 5}'],
        ['3.5{lf 4}', '0.4', '2.3{lf 2}', '3.2{lf 5}', '2.1{lf 3}'],
        ['2.5{lf 3}', '0.4', '0.3', '3.2{lf 4}', '3.1{lf 5}'],
        ['2.5{lf 3}', '2.4{lf 4}', '0.3', '1.2{lf 2}', '0.1'],
        ['0.5', '2.4{lf 3}', '0.3', '1.2{lf 2}', '0.1'],
        ['0.4', '2.3{lf 3}', '1.2{lf 2}', '2.1{lf 4}', '5.1{lf 5}'],
        ['3.6{lf 4}', '2.5{lf 3}', '0.4', '0.3', '0.2'],
      ]
        .map((n) => {
          const [a, b, c, d, e] = n.map((x) => x.replace(/\{[^}]*\}/g, ''))
          return `${n.join(' ')} ${c} ${d} ${e} ${a} ${b} ${c} ${d} ${e} ${c} ${d} ${e} |\n`
        })
        .join('') +
      '(3.5 2.4 0.3 1.2 0.1).1',
  },
  {
    id: 'song-scarborough-fair',
    level: 3,
    kind: 'song',
    title: 'Scarborough Fair',
    description:
      'The English folk ballad in A dorian. Melody on the treble strings with a bass note on every downbeat, moving between Am, G, D and Em shapes.',
    tex:
      header('Scarborough Fair', 100, '\\ts 3 4\n', 'Traditional (England), arranged for this app') +
      `(0.5{rf 1} 2.3{lf 3 rf 2}).2 2.3{rf 2}.4 |
(0.5{rf 1} 0.1{rf 3}).4 0.1{rf 2}.4 0.1{rf 3}.4 |
(3.6{lf 4 rf 1} 0.2{rf 3}).4 {d} 1.2{lf 2 rf 2}.8 0.2{rf 3}.4 |
(0.5 2.3{lf 3}).2 {d} |
0.5.4 0.1.4 3.1{lf 4}.4 |
(3.6{lf 2} 5.1{lf 4}).2 3.1{lf 2}.4 |
(0.4 0.1).4 2.1{lf 3}.4 3.2{lf 4}.4 |
(0.6 0.1).2 {d} |
(0.5 5.1{lf 4}).2 5.1.4 |
(3.6{lf 2} 3.1{lf 4}).4 0.1.4 0.1.4 |
(0.4 3.2{lf 4}).4 1.2{lf 2}.4 0.2.4 |
(3.6{lf 3} 0.3).2 {d} |
(0.5 2.3{lf 3}).2 0.1.4 |
(0.4 3.2{lf 4}).2 1.2{lf 2}.4 |
(3.6{lf 4} 0.2).4 2.3{lf 2}.4 0.3.4 |
(0.5 2.4{lf 3} 2.3{lf 4} 1.2{lf 2} 0.1).2 {d}`,
  },
  {
    id: 'song-amazing-grace',
    level: 3,
    kind: 'song',
    title: 'Amazing Grace',
    description:
      'The 1779 hymn in D, with the melody on the treble strings over an alternating bass: the thumb plays the root on beat one and another bass note on beat two.',
    tex:
      header('Amazing Grace', 84, '', 'John Newton (1779), traditional tune, arranged for this app') +
      `\\ts 1 4 2.3{lf 2 rf 2}.4 |
\\ts 3 4 (0.4{rf 1} 3.2{lf 4 rf 3}).4 0.5{rf 1}.4 2.1{lf 3 rf 3}.8 3.2{lf 4 rf 2}.8 |
(0.4{rf 1} 2.1{lf 3 rf 3}).4 0.5{rf 1}.4 (0.5{rf 1} 0.1{rf 3}).4 |
(3.6{lf 3 rf 1} 3.2{lf 4 rf 3}).4 0.4{rf 1}.4 (0.3{rf 2} 0.2{rf 3}).4 |
(0.4 2.3{lf 2}).4 0.5.4 (0.4 2.3{lf 2}).4 |
(0.4 3.2{lf 4}).4 0.5.4 2.1{lf 3}.8 3.2{lf 4}.8 |
(0.4 2.1{lf 3}).4 0.5.4 0.1.8 2.1{lf 3}.8 |
(0.5 5.1{lf 5}).4 2.4{lf 2}.4 (2.2{lf 3} 2.1{lf 4}).4 |
(0.4 5.1{lf 5}).4 0.5.4 2.1{lf 2}.8 3.2{lf 4}.8 |
(0.4 2.1{lf 3}).4 0.5.4 (0.5 0.1).4 |
(3.6{lf 3} 3.2{lf 4}).4 0.4.4 (0.3 0.2).4 |
(0.4 2.3{lf 2}).4 0.5.4 2.3{lf 2}.4 |
(0.4 3.2{lf 4}).4 0.5.4 2.1{lf 3}.8 3.2{lf 4}.8 |
(0.5 2.1{lf 3}).4 2.4{lf 2}.4 (2.2{lf 2} 0.1).4 |
(0.4 2.3{lf 2} 3.2{lf 4} 2.1{lf 3}).2 {d}`,
  },
  {
    id: 'song-carol-of-the-bells',
    level: 3,
    kind: 'song',
    title: 'Carol of the Bells',
    description:
      'Leontovych’s Ukrainian “Shchedryk” (1916). The four-note bell figure repeats over a falling bass, then moves into thirds that shift between the open position and the 7th fret.',
    tex:
      header('Carol of the Bells', 132, '\\ts 3 4\n', 'Mykola Leontovych (1916), arranged for this app') +
      [
        '(0.6{rf 1} 3.1{lf 4 rf 3}).4 2.1{lf 3 rf 2}.8 3.1{lf 4 rf 3}.8 0.1{rf 2}.4',
        ...['0.6', '0.6', '0.6', '0.6', '0.4', '3.5{lf 3}', '2.5{lf 2}'].map((b) => `(${b} 3.1).4 2.1.8 3.1.8 0.1.4`),
        '(0.6{rf 1} 0.3{rf 2} 7.1{lf 4 rf 3}).4 (4.4{lf 2 rf 1} 5.1{lf 3 rf 3}).8 (0.3{rf 2} 7.1{lf 4 rf 3}).8 (2.4{lf 2 rf 1} 3.1{lf 3 rf 3}).4',
        ...['0.4', '8.6{lf 3}', '7.6{lf 2}', '0.6', '0.4', '8.6{lf 3}'].map((b) => `(${b} 0.3 7.1).4 (4.4 5.1).8 (0.3 7.1).8 (2.4 3.1).4`),
      ].join(' |\n') +
      ' |\n(0.6 2.5{lf 3} 2.4{lf 4} 0.3 0.2 0.1).2 {d}',
  },
  {
    id: 'song-mozart-k545',
    level: 3,
    kind: 'song',
    title: 'Sonata in C, K. 545 (opening)',
    description:
      'Mozart’s “easy” sonata: the tune on top with the rolling Alberti bass underneath, then the famous scale runs. Keep the bass soft and even.',
    tex:
      header('Sonata in C, K. 545 (opening)', 100, '', 'W. A. Mozart (1788), arranged for this app') +
      `\\ts 4 4 (1.2{lf 2 rf 3} 3.5{lf 4 rf 1}).8 3.6{lf 4 rf 1}.8 2.4{lf 3 rf 1}.8 3.6{lf 4 rf 1}.8 (0.1{rf 4} 3.5{lf 4 rf 1}).8 3.6{lf 4 rf 1}.8 (3.1{lf 4 rf 4} 2.4{lf 3 rf 1}).8 3.6{lf 4 rf 1}.8 |
(0.2{rf 3} 0.4{rf 1}).8 3.6{lf 4 rf 1}.8 1.6{lf 2 rf 1}.8 (1.2{lf 2 rf 3} 3.6{lf 4 rf 1}).16 3.2{lf 4 rf 3}.16 (1.2{lf 2 rf 3} 3.5{lf 4 rf 1}).8 3.6{lf 4 rf 1}.8 2.4{lf 3 rf 1}.8 3.6{lf 4 rf 1}.8 |
(5.1{lf 5 rf 4} 3.5{lf 4 rf 1}).8 0.5{rf 1}.8 1.6{lf 2 rf 1}.8 0.5{rf 1}.8 (3.1{lf 2 rf 4} 3.5{lf 2 rf 1}).8 3.6{lf 2 rf 1}.8 (8.1{lf 5 rf 4} 7.5{lf 4 rf 1}).8 3.6{lf 4 rf 1}.8 |
(3.1{lf 4 rf 4} 2.5{lf 3 rf 1}).8 3.6{lf 4 rf 1}.8 (1.1{lf 2 rf 4} 0.4{rf 1}).8 (0.1{rf 4} 3.6{lf 4 rf 1}).16 1.1{lf 2 rf 4}.16 (0.1{rf 4} 3.5{lf 4 rf 1}).8 3.6{lf 4 rf 1}.8 2.4{lf 3 rf 1}.8 3.6{lf 4 rf 1}.8 |
(2.3{lf 3} 1.6{lf 2}).8 0.2.16 1.2{lf 2}.16 3.2{lf 4}.16 0.1.16 1.1{lf 2}.16 3.1{lf 4}.16 5.1{lf 5}.16 3.1{lf 4}.16 1.1{lf 2}.16 0.1.16 (3.2{lf 4} 1.6{lf 2}).16 1.2{lf 2}.16 0.2.16 2.3{lf 3}.16 |
(0.3 0.6).8 2.3{lf 3}.16 0.2.16 1.2{lf 2}.16 3.2{lf 4}.16 0.1.16 1.1{lf 2}.16 3.1{lf 4}.16 1.1{lf 2}.16 0.1.16 3.2{lf 4}.16 (1.2{lf 2} 0.6).16 0.2.16 2.3{lf 3}.16 0.3.16 |
(3.4{lf 4} 5.5{lf 5}).8 0.3.16 2.3{lf 3}.16 0.2.16 1.2{lf 2}.16 3.2{lf 4}.16 0.1.16 1.1{lf 2}.16 0.1.16 3.2{lf 4}.16 1.2{lf 2}.16 (0.2 0.4).16 2.3{lf 3}.16 0.3.16 3.4{lf 4}.16 |
(2.4{lf 3} 3.5{lf 4}).8 3.4{lf 4}.16 0.3.16 2.3{lf 3}.16 0.2.16 1.2{lf 2}.16 3.2{lf 4}.16 0.1.16 3.2{lf 4}.16 1.2{lf 2}.16 0.2.16 (2.3{lf 3} 3.5{lf 4}).16 0.3.16 3.4{lf 4}.16 2.4{lf 3}.16`,
  },
  {
    id: 'song-la-donna-e-mobile',
    level: 3,
    kind: 'song',
    title: 'La donna è mobile',
    description:
      'The Duke’s aria from Rigoletto: a bouncy one-in-a-bar tune with a bass note on every downbeat.',
    tex:
      header('La donna è mobile', 96, '', 'Giuseppe Verdi (1851), arranged for this app') +
      `\\ts 3 8 (2.1{lf 2 rf 4} 0.4{rf 1}).8 2.1{lf 2 rf 4}.8 2.1{lf 2 rf 4}.8 |
(5.1{lf 5 rf 4} 0.5{rf 1}).16 {d} 3.1{lf 3 rf 4}.32 0.1{rf 4}.4 |
(0.1{rf 4} 0.5{rf 1}).8 0.1{rf 4}.8 0.1{rf 4}.8 |
(3.1{lf 3 rf 4} 0.5{rf 1}).16 {d} 2.1{lf 2 rf 4}.32 3.2{lf 3 rf 3}.4 |
(2.1{lf 2} 0.5).8 0.1.8 3.2{lf 3}.8 |
(3.2{lf 3} 0.5).16 {d} 2.2{lf 2}.32 2.2{lf 2}.4 |
(0.1 0.5).8 3.2{lf 3}.8 0.2.8 |
(0.2 0.4).16 {d} 2.3{lf 2}.32 2.3{lf 2}.4 |
(2.1{lf 2} 0.4).8 2.1{lf 2}.8 2.1{lf 2}.8 |
(5.1{lf 5} 0.5).16 {d} 3.1{lf 3}.32 0.1.4 |
(0.1 0.5).8 0.1.8 0.1.8 |
(3.1{lf 3} 0.4).16 {d} 2.1{lf 2}.32 3.2{lf 3}.4 |
(2.1{lf 2} 0.4).8 0.1.8 3.2{lf 3}.8 |
(3.2{lf 3} 0.5).16 {d} 2.2{lf 2}.32 2.2{lf 2}.4 |
(0.1 0.5).8 3.2{lf 3}.8 0.2.8 |
(0.2 0.4).16 {d} 2.3{lf 2}.32 2.3{lf 2}.4`,
  },
  {
    id: 'song-der-lindenbaum',
    level: 3,
    kind: 'song',
    title: 'Der Lindenbaum',
    description:
      'Schubert’s linden-tree song from Winterreise: a gentle melody over a bass note on every beat.',
    tex:
      header('Der Lindenbaum', 80, '', 'Franz Schubert (1827), arranged for this app') +
      `\\ts 3 4 0.6{rf 1}.2 0.6{t}.8 0.1{rf 4}.8 |
(0.1{rf 4} 0.5{rf 1}).4 {d} 2.2{lf 3 rf 3}.8 (2.2{lf 3 rf 3} 4.5{lf 5 rf 1}).8 2.2{lf 3 rf 3}.8 |
(2.2{lf 3 rf 3} 0.5{rf 1}).4 2.3{lf 3 rf 2}.4 {d} 2.3{lf 3 rf 2}.8 |
(0.2{rf 3} 0.6{rf 1}).4 {d} 2.2{lf 3 rf 3}.8 (3.2{lf 4 rf 3} 0.6{rf 1}).8 {tu 3} 2.2{lf 3 rf 3}.8 {tu 3} 0.2{rf 3}.8 {tu 3} |
(2.3{lf 3} 0.5).4 0.5.4 2.5{lf 3}.8 0.1.8 |
(0.1 0.5).4 {d} 2.2{lf 3}.8 (2.2{lf 3} 4.5{lf 5}).8 2.2{lf 3}.8 |
(2.2{lf 3} 0.5).4 2.3{lf 3}.4 {d} 2.3{lf 3}.8 |
(0.2 0.6).4 {d} 2.2{lf 3}.8 (3.2{lf 4} 0.6).8 {tu 3} 2.2{lf 3}.8 {tu 3} 0.2.8 {tu 3} |
(2.3{lf 3} 0.5).4 0.5.4 2.5{lf 3}.8 2.3{lf 3}.8 |
(0.2 1.4{lf 2}).4 {d} 0.2.8 (0.2 0.4).8 0.2.8 |
(2.2{lf 3} 4.5{lf 5}).8 {d} 3.2{lf 4}.16 (0.1 0.5).4 {d} 0.1.8 |
(2.1{lf 3} 0.4).4 {d} 0.1.8 (2.2{lf 3} 0.5).8 2.3{lf 3}.8 |
(0.2 0.6).4 2.4{lf 3}.4 0.6.8 0.2.8 |
(0.2 1.4{lf 2}).4 {d} 0.2.8 (0.2 0.4).8 0.2.8 |
(2.2{lf 3} 4.5{lf 5}).8 {d} 3.2{lf 4}.16 (0.1 0.5).4 {d} 0.1.8 |
(5.1{lf 5} 4.5{lf 4}).4 (0.1 4.5{lf 4}).8 2.2{lf 2}.8 (3.2{lf 3} 2.5{lf 2}).8 {d} 0.2.16 |
(2.3{lf 2} 0.5).4 2.4{lf 2}.4 0.5.4`,
  },
  {
    id: 'song-wachet-auf',
    level: 3,
    kind: 'song',
    title: 'Wachet auf (chorale)',
    description:
      'Bach’s own soprano and bass lines from the chorale, played together. Two independent voices is the classic intermediate fingerstyle skill.',
    tex:
      header('Wachet auf (chorale)', 66, '', 'J. S. Bach, BWV 140 (1731), arranged for this app') +
      `\\ts 4 4 (2.3{lf 2 rf 2} 0.5{rf 1}).4 2.2{lf 2 rf 3}.4 (0.1{rf 4} 0.5{t}).8 4.5{lf 4 rf 1}.8 2.4{lf 2 rf 1}.8 (0.1{rf 4} 0.4{rf 1}).8 |
(0.1{rf 4} 4.5{lf 4 rf 1}).8 2.5{lf 2 rf 1}.8 (0.1{rf 4} 0.5{rf 1}).8 4.6{lf 4 rf 1}.8 (2.1{lf 2 rf 4} 0.5{rf 1}).8 2.6{lf 2 rf 1}.8 2.5{lf 2 rf 1}.4 |
(0.1{rf 4} 0.6{rf 1}).2 {d} (0.1{rf 4} 2.4{lf 2 rf 1}).8 0.4{rf 1}.8 |
(5.1{lf 5 rf 4} 4.5{lf 4 rf 1}).8 0.4{rf 1}.8 (0.1{rf 4} 4.5{lf 4 rf 1}).8 2.5{lf 2 rf 1}.8 (5.1{lf 5 rf 4} 0.5{rf 1}).8 7.1{lf 3 rf 4}.8 (9.1{lf 5 rf 4} 0.5{rf 1}).4 |
(7.1{lf 5} 4.6{lf 2}).8 2.6{lf 2}.8 (5.1{lf 5} 2.4{lf 2}).8 6.5{lf 5}.8 (4.1{lf 4} 2.4{lf 2}).4 (2.1{lf 2} 2.5{lf 2}).4 |
(0.1 0.6).2 {d} (0.1 0.5).8 3.6{lf 3}.8 |
(5.1{lf 5} 2.6{lf 2}).8 4.6{lf 4}.8 (0.1 0.5).4 (2.1{lf 2} 0.4).8 0.6.8 (2.2{lf 2} 2.6{lf 2}).4 |
\\ts 3 4 (3.2{lf 3} 2.5{lf 2}).8 2.2{lf 2}.8 (0.2 0.6).4 (2.3{lf 2} 0.5).4 |
\\ts 1 4 (0.1 4.6{lf 4}).4 |
\\ts 4 4 (0.1 0.5).4 2.5{lf 2}.8 3.2{lf 3}.8 (2.2{lf 2} 4.5{lf 4}).8 0.4.8 (0.2 2.4{lf 2}).8 0.6.8 |
(2.3{lf 2} 2.6{lf 2}).2 {d} (0.1 4.5{lf 4}).4 |
(0.1 4.6{lf 4}).8 2.6{lf 2}.8 0.6.8 3.2{lf 3}.8 (2.2{lf 2} 0.5).8 2.6{lf 2}.8 (0.2 0.4).8 0.6.8 |
(2.3{lf 2} 0.5).2 {d} (0.2 2.4{lf 2}).8 0.4.8`,
  },
  {
    id: 'song-jeanie',
    level: 3,
    kind: 'song',
    title: 'Jeanie with the Light Brown Hair',
    description:
      'Foster’s parlour song: the melody over an alternating bass that follows the original chords.',
    tex:
      header('Jeanie with the Light Brown Hair', 76, '', 'Stephen Foster (1854), arranged for this app') +
      `\\ts 4 4 r.2 2.1{lf 3 rf 4}.2 |
(0.1{rf 4} 1.6{lf 2 rf 1}).4 3.5{lf 4 rf 1}.4 1.6{lf 2 rf 1}.4 (2.2{lf 3 rf 3} 3.5{lf 4 rf 1}).4 |
(3.2{lf 4 rf 3} 1.5{lf 2 rf 1}).4 (2.2{lf 3 rf 3} 1.6{lf 2 rf 1}).4 (0.2{rf 3} 1.5{lf 2 rf 1}).4 (2.3{lf 3 rf 2} 1.6{lf 2 rf 1}).4 |
(2.2{lf 3 rf 3} 1.6{lf 2 rf 1}).4 3.5{lf 4 rf 1}.4 (2.4{lf 3 rf 1} 3.5{lf 4 rf 1}).4 (4.4{lf 5 rf 1} 3.6{lf 4 rf 1}).4 |
(2.3{lf 3} 1.6{lf 2}).4 3.5{lf 4}.4 1.6{lf 2}.4 3.5{lf 4}.4 |
(2.3{lf 3} 1.6{lf 2}).4 3.5{lf 4}.4 (0.2 1.6{lf 2}).4 (2.2{lf 3} 3.5{lf 4}).4 |
(5.1{lf 5} 1.5{lf 2}).4 1.6{lf 2}.4 (2.1{lf 3} 1.5{lf 2}).4 1.6{lf 2}.4 |
(0.1 1.6{lf 2}).4 3.5{lf 4}.8 2.2{lf 3}.8 (0.2 3.6{lf 4}).4 (2.3{lf 3} 0.4).4 |
(0.2 3.5{lf 4}).4 3.6{lf 4}.4 3.5{lf 4}.4 (2.1{lf 3} 3.6{lf 4}).4 |
(0.1 1.6{lf 2}).4 3.5{lf 4}.4 1.6{lf 2}.4 (2.2{lf 3} 3.5{lf 4}).4 |
(3.2{lf 4} 1.5{lf 2}).4 (2.2{lf 3} 1.6{lf 2}).4 (0.2 1.5{lf 2}).4 (2.3{lf 3} 1.6{lf 2}).4 |
(2.2{lf 3} 1.6{lf 2}).4 3.5{lf 4}.4 (2.4{lf 3} 3.5{lf 4}).4 (4.4{lf 5} 3.6{lf 4}).4 |
(2.3{lf 3} 1.6{lf 2}).4 3.5{lf 4}.4 1.6{lf 2}.4 3.5{lf 4}.4 |
(0.2 3.6{lf 4}).4 (4.2{lf 5} 0.4).4 (0.1 3.6{lf 4}).4 (2.1{lf 3} 0.4).4 |
(4.1{lf 5} 3.5{lf 4}).4 (5.1{lf 5} 3.6{lf 4}).4 (2.2{lf 3} 1.6{lf 2}).4 (2.1{lf 3} 3.5{lf 4}).4 |
(0.1 3.5{lf 4}).4 3.6{lf 4}.4 (4.2{lf 5} 3.6{lf 4}).4 (4.2{lf 5} 0.4).4`,
  },
  {
    id: 'song-aloha-oe',
    level: 3,
    kind: 'song',
    title: 'Aloha ʻOe (chorus)',
    description:
      'The Hawaiian farewell song: the chorus melody over the original bass line.',
    tex:
      header('Aloha ʻOe (chorus)', 72, '', 'Queen Liliʻuokalani (1878), arranged for this app') +
      `\\ts 4 4 (2.2{lf 2 rf 3} 0.5{rf 1}).4 0.1{rf 4}.4 (5.1{lf 5 rf 4} 0.5{rf 1}).8 (2.2{lf 2 rf 3} 0.5{rf 1}).8 (2.2{lf 2 rf 3} 0.5{rf 1}).8 (2.2{lf 2 rf 3} 0.5{rf 1}).8 |
(0.2{rf 3} 2.4{lf 2 rf 1}).4 0.1{rf 4}.4 (4.1{lf 4 rf 4} 0.6{rf 1}).4 (0.1{rf 4} 2.4{lf 2 rf 1}).8 (0.1{rf 4} 2.4{lf 2 rf 1}).8 |
(4.2{lf 4 rf 3} 2.5{lf 2 rf 1}).8 (4.2{lf 4 rf 3} 2.5{lf 2 rf 1}).8 (4.2{lf 4 rf 3} 2.5{lf 2 rf 1}).8 (0.1{rf 4} 2.5{lf 2 rf 1}).8 (2.1{lf 2 rf 4} 2.5{lf 2 rf 1}).8 (6.2{lf 5 rf 3} 2.5{lf 2 rf 1}).8 (2.1{lf 2 rf 4} 2.5{lf 2 rf 1}).8 (5.1{lf 5 rf 4} 2.5{lf 2 rf 1}).8 |
(4.1{lf 4 rf 4} 2.4{lf 2 rf 1}).2 (0.1{rf 4} 0.6{rf 1}).4 {d} (4.2{lf 4 rf 3} 0.6{rf 1}).8 |
(2.2{lf 2} 0.5).4 (0.1 0.5).4 (5.1{lf 5} 0.5).4 {d} (2.2{lf 2} 0.5).8 |
(0.2 2.4{lf 2}).8 (0.2 2.4{lf 2}).8 (0.1 2.5{lf 2}).8 (0.1 2.5{lf 2}).8 (4.1{lf 4} 0.6).4 {d} (0.1 4.6{lf 4}).8 |
(4.2{lf 4} 2.5{lf 2}).4 {d} (0.1 2.5{lf 2}).8 (4.1{lf 4} 2.5{lf 2}).8 2.1{lf 2}.4 (4.2{lf 4} 2.5{lf 2}).8 |
\\ts 3 4 (0.1 0.6).2 {d}`,
  },
  {
    id: 'song-carolans-concerto',
    level: 3,
    kind: 'song',
    title: 'Carolan’s Concerto',
    description:
      'A favourite of Celtic fingerstyle players: running eighth notes over a root-and-fifth bass.',
    tex:
      header('Carolan’s Concerto', 96, '', 'Turlough O’Carolan (c. 1720), arranged for this app') +
      `\\ts 3 16 (0.2{rf 3} 0.5{rf 1}).16 2.2{lf 3 rf 3}.16 4.2{lf 5 rf 3}.16 |
\\ts 2 4 (0.1{rf 4} 3.6{lf 4 rf 1}).8 0.1{rf 4}.16 0.1{rf 4}.16 (0.1{rf 4} 0.4{rf 1}).8 4.2{lf 5 rf 3}.16 2.2{lf 3 rf 3}.16 |
(0.2{rf 3} 0.4{rf 1}).16 2.2{lf 3 rf 3}.16 2.3{lf 3 rf 2}.16 0.2{rf 3}.16 (1.3{lf 2 rf 2} 0.5{rf 1}).8 0.2{rf 3}.8 |
(4.4{lf 5 rf 1} 0.5{rf 1}).8 0.2{rf 3}.8 (2.4{lf 3 rf 1} 0.6{rf 1}).8 0.2{rf 3}.8 |
(2.2{lf 3} 0.5).16 4.2{lf 5}.16 0.1.16 2.1{lf 3}.16 (0.1 0.6).16 4.2{lf 5}.16 2.2{lf 3}.16 0.2.16 |
(0.1 0.4).8 7.1{lf 5}.8 (4.1{lf 2} 0.5).16 5.1{lf 3}.16 7.1{lf 5}.16 4.1{lf 2}.16 |
(7.2{lf 5} 0.4).16 4.1{lf 2}.16 5.1{lf 3}.16 7.2{lf 5}.16 (4.1{lf 2} 0.5).16 5.1{lf 3}.16 7.1{lf 5}.16 4.1{lf 2}.16 |
(5.1{lf 3} 0.4).16 7.1{lf 5}.16 9.1{lf 5}.16 5.1{lf 3}.16 (4.1{lf 2} 0.5).16 0.1.16 4.1{lf 2}.16 7.1{lf 5}.16 |
(5.1{lf 5} 0.4).16 4.1{lf 4}.16 2.1{lf 2}.16 0.1.16 (0.1 0.5).16 4.2{lf 4}.16 2.2{lf 2}.16 0.2.16 |
(2.2{lf 2} 3.6{lf 3}).16 0.1.16 2.2{lf 2}.16 0.1.16 (5.1{lf 5} 0.4).16 2.2{lf 2}.16 5.1{lf 5}.16 2.2{lf 2}.16 |
(0.2 0.4).16 0.1.16 0.2.16 0.1.16 (4.1{lf 4} 0.5).16 0.2.16 4.1{lf 4}.16 0.2.16 |
(2.3{lf 2} 0.6).16 2.2{lf 2}.16 2.3{lf 2}.16 2.2{lf 2}.16 (2.1{lf 2} 2.5{lf 2}).16 4.1{lf 5}.16 2.1{lf 3}.16 0.1.16 |
(4.2{lf 5} 0.5).8 2.2{lf 3}.16 4.2{lf 5}.16 (0.2 0.6).8 {d} 2.3{lf 3}.16 |
(1.3{lf 2} 0.4).16 2.3{lf 3}.16 0.2.16 1.3{lf 2}.16 (4.4{lf 5} 0.5).16 1.3{lf 2}.16 2.3{lf 3}.16 4.4{lf 5}.16 |
(1.3{lf 2} 0.4).16 2.3{lf 3}.16 0.2.16 1.3{lf 2}.16 (2.3{lf 3} 0.5).16 0.2.16 2.2{lf 3}.16 2.3{lf 3}.16 |
(0.2 0.4).8 0.1.8 (4.1{lf 5} 0.5).16 2.1{lf 3}.16 0.1.16 4.2{lf 5}.16 |
(0.1 0.4).4 0.5.4`,
  },
  {
    id: 'song-planxty-irwin',
    level: 3,
    kind: 'song',
    title: 'Planxty Irwin',
    description:
      'A lilting O’Carolan tune in 3/4 with a waltz bass: the root on beat one, the fifth on beat two.',
    tex:
      header('Planxty Irwin', 100, '', 'Turlough O’Carolan (c. 1720), arranged for this app') +
      `\\ts 1 8 (0.1{rf 4} 0.4{rf 1}).8 |
\\ts 3 4 (5.1{lf 5 rf 4} 3.6{lf 3 rf 1}).4 (4.1{lf 4 rf 4} 0.4{rf 1}).8 2.1{lf 2 rf 4}.8 4.1{lf 4 rf 4}.8 5.1{lf 5 rf 4}.8 |
(0.1{rf 4} 0.4{rf 1}).4 (3.2{lf 4 rf 3} 0.5{rf 1}).8 2.2{lf 3 rf 3}.8 0.2{rf 3}.8 2.3{lf 3 rf 2}.8 |
(3.2{lf 4 rf 3} 0.6{rf 1}).4 (0.2{rf 3} 2.5{lf 3 rf 1}).8 2.2{lf 3 rf 3}.8 3.2{lf 4 rf 3}.8 0.1{rf 4}.8 |
(1.3{lf 2} 0.5).4 (2.3{lf 3} 0.6).8 0.2.4 4.1{lf 5}.8 |
(5.1{lf 5} 3.6{lf 4}).4 (4.1{lf 5} 0.4).8 2.1{lf 3}.8 4.1{lf 5}.8 5.1{lf 5}.8 |
(0.1 0.4).4 (3.2{lf 4} 0.5).8 2.2{lf 3}.8 0.2.8 2.3{lf 3}.8 |
(3.2{lf 4} 0.6).4 (0.2 2.5{lf 3}).8 2.2{lf 3}.8 3.2{lf 4}.8 0.1.8 |
\\ts 5 8 (2.3{lf 3} 0.4).4 1.3{lf 2}.8 2.3{lf 3}.4 |
\\ts 1 8 (0.1 0.4).8 |
\\ts 3 4 (5.1{lf 3} 0.4).8 {d} 7.1{lf 5}.16 (5.1{lf 3} 0.5).8 5.1{lf 3}.4 5.1{lf 3}.8 |
(7.1{lf 5} 0.5).4 (7.1{lf 5} 0.6).8 7.1{lf 5}.8 4.1{lf 2}.8 0.1.8 |
(0.1 0.4).16 9.1{lf 5}.8 {d} (9.1{lf 5} 0.5).8 7.1{lf 3}.4 5.1{lf 5}.8 |
(5.1{lf 5} 3.6{lf 3}).8 4.1{lf 4}.8 (2.1{lf 2} 0.4).8 0.1.8 2.1{lf 2}.8 4.1{lf 4}.8 |
(5.1{lf 5} 3.6{lf 3}).4 (4.1{lf 4} 0.4).8 2.1{lf 2}.8 4.1{lf 4}.8 5.1{lf 5}.8 |
(0.1 0.4).4 (3.2{lf 3} 0.5).8 2.2{lf 2}.8 0.2.8 2.3{lf 2}.8 |
(3.2{lf 3} 0.4).4 (0.2 0.5).8 2.2{lf 2}.8 3.2{lf 3}.8 0.1.8`,
  },
  {
    id: 'song-fanny-power',
    level: 3,
    kind: 'song',
    title: 'Fanny Power',
    description:
      'O’Carolan’s best-loved air, in 3/4, with a waltz bass under the melody.',
    tex:
      header('Fanny Power', 96, '', 'Turlough O’Carolan (c. 1720), arranged for this app') +
      `\\ts 3 4 (1.2{lf 2 rf 3} 0.5{rf 1}).4 (0.3{rf 2} 0.6{rf 1}).8 1.2{lf 2 rf 3}.8 3.2{lf 4 rf 3}.8 0.1{rf 4}.8 |
\\ts 1 4 (0.1{rf 4} 0.5{rf 1}).8 1.2{lf 2 rf 3}.8 |
\\ts 2 4 (2.3{lf 3 rf 2} 0.5{rf 1}).8 0.3{rf 2}.8 2.3{lf 3 rf 2}.8 0.3{rf 2}.8 |
\\ts 1 4 (1.2{lf 2 rf 3} 0.4{rf 1}).8 1.1{lf 2 rf 4}.8 |
\\ts 3 4 (0.1 0.5).8 3.2{lf 4}.8 (1.2{lf 2} 0.6).8 0.1.8 1.1{lf 2}.8 3.1{lf 4}.8 |
\\ts 2 4 (3.2{lf 4} 0.6).8 3.2{lf 4}.4 1.2{lf 2}.8 |
\\ts 3 4 (0.2 0.6).8 2.3{lf 3}.8 (0.3 2.5{lf 3}).8 0.3.8 2.3{lf 3}.8 0.2.8 |
(1.2{lf 2} 0.5).4 0.6.8 1.2{lf 2}.4 {d} |
(3.1{lf 4} 0.5).8 0.1.16 1.1{lf 2}.16 (3.1{lf 4} 0.6).8 3.1{lf 4}.8 0.1.16 1.1{lf 2}.16 3.1{lf 4}.8 |
(1.2{lf 2} 0.5).4 (1.2{lf 2} 0.6).8 1.2{lf 2}.4 1.2{lf 2}.8 |
(5.1{lf 4} 0.4).8 6.2{lf 5}.16 3.1{lf 2}.16 (5.1{lf 4} 0.5).8 5.1{lf 4}.8 6.2{lf 5}.16 3.1{lf 2}.16 5.1{lf 4}.8 |
(3.2{lf 4} 0.6).4 (3.2{lf 4} 2.5{lf 3}).8 3.2{lf 4}.4 3.2{lf 4}.8 |
(0.1 0.5).8 1.1{lf 2}.8 (3.1{lf 4} 0.6).8 10.2{lf 5}.8 7.1{lf 2}.8 8.1{lf 3}.8 |
(7.1{lf 2} 0.6).8 8.1{lf 3}.8 (10.1{lf 5} 7.6{lf 2}).8 3.1{lf 3}.8 5.1{lf 5}.8 3.1{lf 4}.8 |
(0.1 0.5).8 3.2{lf 4}.8 (1.2{lf 2} 0.6).8 3.2{lf 4}.8 0.1.8 3.2{lf 4}.8 |
(1.2{lf 2} 0.5).4 0.6.8 1.2{lf 2}.4 {d}`,
  },
  {
    id: 'song-carolans-farewell',
    level: 3,
    kind: 'song',
    title: 'Carolan’s Farewell to Music',
    description:
      'Said to be the last tune O’Carolan wrote. A slow minor air: let every note ring into the next.',
    tex:
      header('Carolan’s Farewell to Music', 72, '', 'Turlough O’Carolan (1738), arranged for this app') +
      `\\ts 1 4 (2.3{lf 3 rf 2} 1.6{lf 2 rf 1}).8 0.2{rf 3}.8 |
\\ts 4 4 (1.2{lf 2 rf 3} 3.5{lf 4 rf 1}).4 (0.2{rf 3} 3.6{lf 4 rf 1}).8 2.3{lf 3 rf 2}.8 0.3{rf 2}.4 (2.3{lf 3 rf 2} 1.6{lf 2 rf 1}).8 0.2{rf 3}.8 |
(1.2{lf 2 rf 3} 3.5{lf 4 rf 1}).4 (0.2{rf 3} 3.6{lf 4 rf 1}).8 2.3{lf 3 rf 2}.8 0.3{rf 2}.4 (1.2{lf 2 rf 3} 3.5{lf 4 rf 1}).8 3.2{lf 4 rf 3}.8 |
(0.1{rf 4} 3.5{lf 4 rf 1}).4 (3.2{lf 2 rf 3} 3.6{lf 2 rf 1}).8 0.1{rf 4}.8 1.2{lf 2 rf 3}.4 (0.2{rf 3} 3.6{lf 4 rf 1}).8 2.3{lf 3 rf 2}.8 |
(2.3{lf 3} 1.6{lf 2}).4 3.5{lf 4}.4 0.3.4 (3.2{lf 2} 3.6{lf 2}).8 0.1.8 |
(1.1{lf 2} 1.6{lf 2}).4 (1.1{lf 2} 3.5{lf 4}).8 3.1{lf 4}.8 0.1.4 (0.1 3.5{lf 4}).8 1.1{lf 2}.8 |
(3.2{lf 4} 0.5).8 2.2{lf 3}.8 (3.2{lf 4} 0.6).8 0.1.8 5.1{lf 5}.4 0.5.8 4.1{lf 4}.8 |
(5.1{lf 5} 0.5).8 3.1{lf 4}.8 (0.1 0.6).8 3.2{lf 4}.8 1.2{lf 2}.8 2.3{lf 3}.8 (0.2 3.6{lf 4}).8 1.3{lf 2}.8 |
\\ts 3 4 (2.3{lf 3} 1.6{lf 2}).4 3.5{lf 4}.4 2.3{lf 3}.4 |
\\ts 1 4 (0.1 3.5{lf 4}).4 |
\\ts 4 4 (3.1{lf 2} 3.5{lf 2}).8 0.1.8 (3.2{lf 2} 3.6{lf 2}).8 0.1.8 3.1{lf 2}.4 (3.1{lf 2} 3.5{lf 2}).8 5.1{lf 4}.8 |
(3.1{lf 2} 3.5{lf 2}).8 0.1.8 (3.2{lf 2} 3.6{lf 2}).8 0.1.8 3.1{lf 4}.4 (0.1 3.5{lf 4}).4 |
(5.1{lf 5} 1.6{lf 2}).8 4.1{lf 5}.8 (5.1{lf 4} 3.5{lf 2}).8 7.1{lf 5}.8 5.1{lf 4}.8 3.1{lf 2}.8 (0.1 3.5{lf 2}).8 3.1{lf 2}.8 |
(7.1{lf 5} 3.6{lf 2}).4 0.4.4 5.1{lf 4}.8 7.1{lf 5}.8 (5.1{lf 5} 1.6{lf 2}).8 3.1{lf 4}.8 |
(2.1{lf 3} 3.5{lf 4}).4 (1.1{lf 2} 3.6{lf 4}).8 3.1{lf 4}.8 0.1.4 (0.1 3.5{lf 4}).8 1.1{lf 2}.8 |
(3.2{lf 4} 0.5).8 2.2{lf 3}.8 (3.2{lf 4} 0.6).8 0.1.8 5.1{lf 5}.4 0.5.8 4.1{lf 4}.8 |
(5.1{lf 5} 0.5).8 3.1{lf 4}.8 (0.1 0.6).8 3.2{lf 4}.8 1.2{lf 2}.8 2.3{lf 3}.8 (0.2 3.5{lf 4}).8 1.3{lf 2}.8`,
  },
  {
    id: 'song-drowsy-maggie',
    level: 3,
    kind: 'song',
    title: 'Drowsy Maggie',
    description:
      'An Irish reel in A dorian. The tune keeps coming back to the open A while the bass moves between A minor and G.',
    tex:
      header('Drowsy Maggie', 100, '', 'Traditional (Ireland), arranged for this app') +
      `\\ts 4 4 (2.3{lf 3 rf 2} 0.6{rf 1}).4 (0.1{rf 4} 2.5{lf 3 rf 1}).8 2.3{lf 3 rf 2}.8 (3.1{lf 4 rf 4} 0.6{rf 1}).8 2.3{lf 3 rf 2}.8 (0.1{rf 4} 2.5{lf 3 rf 1}).8 2.3{lf 3 rf 2}.8 |
(2.3{lf 3 rf 2} 0.6{rf 1}).4 (0.1{rf 4} 2.5{lf 3 rf 1}).8 2.3{lf 3 rf 2}.8 (3.2{lf 4 rf 3} 0.4{rf 1}).8 0.2{rf 3}.8 (0.3{rf 2} 0.5{rf 1}).8 0.2{rf 3}.8 |
(2.3{lf 3 rf 2} 0.6{rf 1}).4 (0.1{rf 4} 2.5{lf 3 rf 1}).8 2.3{lf 3 rf 2}.8 (3.1{lf 4 rf 4} 0.6{rf 1}).8 2.3{lf 3 rf 2}.8 (0.1{rf 4} 2.5{lf 3 rf 1}).8 2.3{lf 3 rf 2}.8 |
(0.1{rf 4} 0.6{rf 1}).8 3.2{lf 4 rf 3}.8 (0.1{rf 4} 2.5{lf 3 rf 1}).8 2.1{lf 3 rf 4}.8 (3.1{lf 4 rf 4} 0.4{rf 1}).8 3.2{lf 4 rf 3}.8 (0.2{rf 3} 0.5{rf 1}).8 0.3{rf 2}.8 |
(2.3{lf 3} 0.6).4 (0.1 2.5{lf 3}).8 2.3{lf 3}.8 (3.1{lf 4} 0.6).8 2.3{lf 3}.8 (0.1 2.5{lf 3}).8 2.3{lf 3}.8 |
(2.3{lf 3} 0.6).4 (0.1 2.5{lf 3}).8 2.3{lf 3}.8 (3.2{lf 4} 0.4).8 0.2.8 (0.3 0.5).8 0.2.8 |
(2.3{lf 3} 0.6).4 (0.1 2.5{lf 3}).8 2.3{lf 3}.8 (3.1{lf 4} 0.6).8 2.3{lf 3}.8 (0.1 2.5{lf 3}).8 2.3{lf 3}.8 |
(0.1 0.6).8 3.2{lf 4}.8 (0.1 2.5{lf 3}).8 2.1{lf 3}.8 (3.1{lf 4} 0.4).8 3.2{lf 4}.8 (0.2 0.5).8 3.2{lf 4}.8 |
(3.1{lf 4} 0.4).4 (7.1{lf 4} 0.5).8 8.2{lf 5}.8 (6.2{lf 3} 0.6).4 (5.1{lf 2} 7.6{lf 4}).8 6.2{lf 3}.8 |
(8.2{lf 5} 0.6).8 5.1{lf 2}.8 (7.1{lf 2} 7.6{lf 2}).8 8.1{lf 3}.8 (10.1{lf 5} 0.6).8 7.1{lf 2}.8 (8.1{lf 3} 7.6{lf 2}).8 10.2{lf 5}.8 |
(8.2{lf 3} 0.4).4 (7.1{lf 2} 0.5).8 3.1{lf 4}.8 (1.1{lf 2} 0.6).4 (5.1{lf 5} 2.5{lf 3}).8 1.1{lf 2}.8 |
(0.1 0.6).8 3.2{lf 4}.8 (0.1 2.5{lf 3}).8 1.1{lf 2}.8 (3.1{lf 4} 0.4).8 3.2{lf 4}.8 (0.2 0.5).8 3.2{lf 4}.8 |
(3.1{lf 4} 0.4).4 (7.1{lf 4} 0.5).8 8.2{lf 5}.8 (6.2{lf 3} 0.6).4 (5.1{lf 2} 7.6{lf 4}).8 6.2{lf 3}.8 |
(8.2{lf 5} 0.6).8 5.1{lf 2}.8 (7.1{lf 2} 7.6{lf 2}).8 8.1{lf 3}.8 (10.1{lf 5} 0.6).8 7.1{lf 2}.8 (8.1{lf 3} 7.6{lf 2}).8 10.2{lf 5}.8 |
(10.1{lf 5} 0.6).8 7.1{lf 4}.8 (8.1{lf 5} 7.6{lf 4}).8 5.1{lf 2}.8 (7.1{lf 4} 0.4).8 8.2{lf 5}.8 (5.1{lf 2} 0.5).8 1.1{lf 2}.8 |
(0.1 0.6).8 3.2{lf 4}.8 (0.1 2.5{lf 3}).8 1.1{lf 2}.8 (3.1{lf 4} 0.4).8 3.2{lf 4}.8 (0.2 0.5).8 0.3.8`,
  },
]
