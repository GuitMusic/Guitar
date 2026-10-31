import { parsePitchClass, STANDARD_TUNING, texPitch } from '../music/notes'

export interface AsciiTabOptions {
  title?: string
  tempo?: number
  /** Overrides a capo found in the text. */
  capo?: number
}

export interface AsciiTabResult {
  tex: string
  /** MIDI notes from string 1 (highest) down. */
  tuning: number[]
  capo: number
  bars: number
  notes: number
}

interface TabLine {
  label: string | null
  content: string
}

interface TabEvent {
  col: number
  /** string number (1 = top line) to fret, or 'x' for a dead note */
  frets: Map<number, number | 'x'>
}

interface TabBar {
  events: TabEvent[]
  endCol: number
}

const TAB_LINE = /^\s*([A-Ga-g][#b]?)?\s*(\|{1,2}|:)?(.*)$/
const TAB_CHARS = /^[-0-9|:hpbrxX/\\~()<>.*=^vtTsSlL ]*$/

function parseTabLine(raw: string): TabLine | null {
  const m = TAB_LINE.exec(raw)
  if (!m) return null
  const content = m[3].replace(/\s+$/, '')
  if ((content.match(/-/g)?.length ?? 0) < 4) return null
  if (!TAB_CHARS.test(content)) return null
  return { label: m[1] ?? null, content }
}

function findSystems(text: string): TabLine[][] {
  const systems: TabLine[][] = []
  let current: TabLine[] = []
  const flush = () => {
    if (current.length >= 4 && current.length <= 8) systems.push(current)
    else if (current.length > 8 && current.length % 6 === 0) {
      for (let i = 0; i < current.length; i += 6) systems.push(current.slice(i, i + 6))
    }
    current = []
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = parseTabLine(raw)
    if (line) current.push(line)
    else flush()
  }
  flush()
  return systems
}

function defaultTuning(strings: number): number[] {
  if (strings === 7) return [...STANDARD_TUNING, 35]
  if (strings <= 6) return STANDARD_TUNING.slice(0, strings)
  return [...STANDARD_TUNING, ...Array.from({ length: strings - 6 }, (_, i) => 35 - 5 * i)]
}

/** Uses the string labels (e, B, G …) and picks the octave closest to standard tuning. */
function inferTuning(system: TabLine[]): number[] {
  const fallback = defaultTuning(system.length)
  return system.map((line, i) => {
    const pc = line.label ? parsePitchClass(line.label) : null
    if (pc === null) return fallback[i]
    const target = fallback[i]
    let best = target
    let bestDist = Infinity
    for (let midi = target - 6; midi <= target + 6; midi++) {
      if (((midi % 12) + 12) % 12 === pc && Math.abs(midi - target) < bestDist) {
        best = midi
        bestDist = Math.abs(midi - target)
      }
    }
    return best
  })
}

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= '0' && ch <= '9'
}

function parseSystem(system: TabLine[]): TabBar[] {
  const width = Math.max(...system.map((l) => l.content.length))
  const rows = system.map((l) => l.content.padEnd(width, ' '))
  const bars: TabBar[] = []
  let events: TabEvent[] = []

  const closeBar = (col: number) => {
    if (events.length > 0) bars.push({ events, endCol: col })
    events = []
  }

  for (let c = 0; c < width; c++) {
    const barMarks = rows.filter((r) => r[c] === '|' || r[c] === ':').length
    if (barMarks >= Math.ceil(rows.length / 2)) {
      closeBar(c)
      continue
    }
    const frets = new Map<number, number | 'x'>()
    let wide = false
    rows.forEach((row, s) => {
      const ch = row[c]
      if (isDigit(ch)) {
        if (isDigit(row[c + 1]) && Number(ch + row[c + 1]) <= 24) {
          frets.set(s + 1, Number(ch + row[c + 1]))
          wide = true
        } else {
          frets.set(s + 1, Number(ch))
        }
      } else if (ch === 'x' || ch === 'X') {
        frets.set(s + 1, 'x')
      }
    })
    if (frets.size === 0) continue
    if (wide) {
      // Other strings may align their single digit with the second digit of a two-digit fret.
      rows.forEach((row, s) => {
        if (!frets.has(s + 1) && isDigit(row[c + 1]) && !isDigit(row[c + 2])) frets.set(s + 1, Number(row[c + 1]))
      })
      c++
    }
    events.push({ col: wide ? c - 1 : c, frets })
  }
  closeBar(width)
  return bars
}

/** Durations we can write without ties, in eighth notes. */
const EIGHTHS_TO_TEX: Record<number, string> = { 1: '8', 2: '4', 3: '4 {d}', 4: '2', 6: '2 {d}', 8: '1' }
const ALLOWED = [1, 2, 3, 4, 6, 8]

function nearestAllowed(units: number): number {
  return ALLOWED.reduce((best, a) => (Math.abs(a - units) < Math.abs(best - units) ? a : best), 1)
}

function mode(values: number[]): number {
  const counts = new Map<number, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  let best = 1
  let bestCount = 0
  for (const [v, n] of counts) {
    if (n > bestCount || (n === bestCount && v < best)) {
      best = v
      bestCount = n
    }
  }
  return best
}

function escapeTex(s: string): string {
  return s.replace(/\\/g, '').replace(/"/g, "'")
}

/**
 * Converts a plain-text (ASCII) guitar tab into alphaTex. Text tabs have no rhythm,
 * so note lengths are guessed from the horizontal spacing: the most common gap becomes
 * an eighth note, and each bar gets a time signature that fits what it holds.
 */
export function asciiTabToTex(text: string, options: AsciiTabOptions = {}): AsciiTabResult {
  const systems = findSystems(text)
  if (systems.length === 0) {
    throw new Error('No tab lines found. Each string should be on its own line, like e|---0---|.')
  }
  const stringCount = systems[0].length
  const usable = systems.filter((s) => s.length === stringCount)
  const tuning = inferTuning(usable[0])
  const capoMatch = /capo\s*(?:on\s*|at\s*|fret\s*)?(\d{1,2})/i.exec(text)
  const capo = options.capo ?? (capoMatch ? Number(capoMatch[1]) : 0)

  const bars = usable.flatMap(parseSystem)
  const gaps: number[] = []
  for (const bar of bars) {
    bar.events.forEach((e, i) => {
      const next = i + 1 < bar.events.length ? bar.events[i + 1].col : null
      if (next !== null) gaps.push(next - e.col)
    })
  }
  const unit = Math.max(1, mode(gaps))

  let noteCount = 0
  let lastTs = ''
  const barTex = bars.map((bar) => {
    const beats = bar.events.map((e, i) => {
      const next = i + 1 < bar.events.length ? bar.events[i + 1].col : bar.endCol
      const eighths = nearestAllowed(Math.max(1, Math.round((next - e.col) / unit)))
      const notes = [...e.frets.entries()].map(([s, f]) => `${f}.${s}`)
      noteCount += notes.length
      const body = notes.length === 1 ? notes[0] : `(${notes.join(' ')})`
      return { tex: `${body}.${EIGHTHS_TO_TEX[eighths]}`, eighths }
    })
    let total = beats.reduce((sum, b) => sum + b.eighths, 0)
    // Text tabs often end a bar with an empty slot; an odd count like 7 is usually a 4/4 bar.
    const last = beats[beats.length - 1]
    if (total % 2 === 1 && total >= 5 && last.eighths < 4) {
      const longer = last.eighths + 1
      last.eighths = longer
      last.tex = last.tex.replace(/\.[^.]+$/, `.${EIGHTHS_TO_TEX[longer]}`)
      total += 1
    }
    const ts = total % 2 === 0 ? `\\ts ${total / 2} 4` : `\\ts ${total} 8`
    const prefix = ts !== lastTs ? `${ts} ` : ''
    lastTs = ts
    return prefix + beats.map((b) => b.tex).join(' ')
  })

  const header = [
    `\\title "${escapeTex(options.title?.trim() || 'Imported tab')}"`,
    `\\tempo ${options.tempo ?? 80}`,
    '\\track "Guitar"',
    '\\instrument acousticguitarsteel',
    `\\tuning (${tuning.map(texPitch).join(' ')})`,
    capo > 0 ? `\\capo ${capo}` : '',
  ].filter(Boolean)

  return {
    tex: `${header.join('\n')}\n${barTex.join(' |\n')}`,
    tuning,
    capo,
    bars: bars.length,
    notes: noteCount,
  }
}
