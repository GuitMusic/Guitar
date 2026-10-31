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
]
