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
}

const header = (title: string, tempo: number, extra = '') =>
  `\\title "${title}"\n\\subtitle "Original exercise"\n\\tempo ${tempo}\n\\track "Guitar"\n\\instrument acousticguitarsteel\n${extra}`

export const STUDIES: Study[] = [
  {
    id: 'study-thumb-and-three',
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
