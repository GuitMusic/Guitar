import type { ChordShape } from './guide'

const STRING_GAP = 18
const FRET_GAP = 24
const LEFT = 22
const TOP = 34
const ROWS = 4

/**
 * A chord box: strings run up and down, frets across, dots show where the fingers go
 * with the finger number inside. Left-handed players see it mirrored, the way their
 * own guitar looks when they face it, with the low string on the right.
 */
export function ChordDiagram({ chord, leftHanded }: { chord: ChordShape; leftHanded: boolean }) {
  const fretted = chord.frets.filter((f): f is number => f !== null && f > 0)
  const high = fretted.length ? Math.max(...fretted) : 0
  // Start at the nut when the shape fits in the first frets, otherwise at its lowest fret
  const start = high <= ROWS ? 1 : Math.min(...fretted)
  const width = LEFT * 2 + STRING_GAP * 5
  const height = TOP + FRET_GAP * ROWS + 14
  // Column for string 6 … 1, mirrored for the left hand
  const x = (i: number) => LEFT + STRING_GAP * (leftHanded ? 5 - i : i)
  const y = (fret: number) => TOP + FRET_GAP * (fret - start) + FRET_GAP / 2
  // A barre: the same finger on the same fret across several strings
  const barres = new Map<string, number[]>()
  chord.frets.forEach((f, i) => {
    if (f && chord.fingers[i]) {
      const k = `${chord.fingers[i]}:${f}`
      barres.set(k, [...(barres.get(k) ?? []), i])
    }
  })

  return (
    <svg className="chord-diagram" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${chord.name} chord`}>
      {/* nut or position number */}
      {start === 1 ? (
        <rect x={LEFT - 1} y={TOP - 4} width={STRING_GAP * 5 + 2} height={5} rx={1.5} className="cd-nut" />
      ) : (
        <text x={leftHanded ? width - 4 : 4} y={TOP + FRET_GAP / 2 + 4} className="cd-pos" textAnchor={leftHanded ? 'end' : 'start'}>
          {start}
        </text>
      )}
      {Array.from({ length: ROWS + 1 }, (_, r) => (
        <line key={`f${r}`} x1={LEFT} x2={LEFT + STRING_GAP * 5} y1={TOP + r * FRET_GAP} y2={TOP + r * FRET_GAP} className="cd-fret" />
      ))}
      {chord.frets.map((_, i) => (
        <line key={`s${i}`} x1={x(i)} x2={x(i)} y1={TOP} y2={TOP + ROWS * FRET_GAP} className="cd-string" strokeWidth={1.8 - i * 0.2} />
      ))}
      {chord.frets.map((f, i) =>
        f === null ? (
          <text key={`m${i}`} x={x(i)} y={TOP - 11} className="cd-mute" textAnchor="middle">
            ×
          </text>
        ) : f === 0 ? (
          <circle key={`o${i}`} cx={x(i)} cy={TOP - 15} r={4.5} className="cd-open" />
        ) : null,
      )}
      {[...barres.entries()]
        .filter(([, cols]) => cols.length > 1 && cols.length === Math.max(...cols) - Math.min(...cols) + 1)
        .map(([k, cols]) => {
          const fret = Number(k.split(':')[1])
          const xs = cols.map(x)
          return <rect key={`b${k}`} x={Math.min(...xs) - 8} y={y(fret) - 8} width={Math.max(...xs) - Math.min(...xs) + 16} height={16} rx={8} className={`cd-dot cd-f${k.split(':')[0]}`} />
        })}
      {chord.frets.map((f, i) =>
        f ? (
          <g key={`d${i}`}>
            <circle cx={x(i)} cy={y(f)} r={8} className={`cd-dot cd-f${chord.fingers[i]}`} />
            <text x={x(i)} y={y(f) + 3.5} className="cd-finger" textAnchor="middle">
              {chord.fingers[i]}
            </text>
          </g>
        ) : null,
      )}
      {/* string numbers under the box, so mirrored charts stay readable */}
      {chord.frets.map((_, i) => (
        <text key={`n${i}`} x={x(i)} y={height - 2} className="cd-num" textAnchor="middle">
          {6 - i}
        </text>
      ))}
    </svg>
  )
}
