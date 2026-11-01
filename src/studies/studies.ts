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
    description: 'The Spanish folk classic: Am, G, F, E with the open high E ringing, then the famous melody in the thumb on the bass strings.',
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
]
