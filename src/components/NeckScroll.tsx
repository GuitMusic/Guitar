import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { makeFretX, NO_PICK_W } from './fretboardGeometry'

/** Narrowest fret, in screen pixels, that still reads well on a phone. */
const FRET_PX = 62
/** Room kept around a fret window so its edge frets are not cut by the fade. */
const PAD = 22

/**
 * On a phone a whole neck squeezed into the screen width makes the note names too small to
 * read, so the neck is drawn at a readable size and slides sideways under your finger.
 *
 * Give it `focus` (a fret range) when the player must not have to swipe, as in a quiz: the neck
 * is then sized so those frets fit on the screen (but never bigger than the readable size), and
 * it slides to show them. Without `focus` it opens at the nut (on the right for left-handed
 * players). On wider screens the neck always fits as before. The neck inside is expected to be
 * drawn without the picking-hand zone.
 */
export function NeckScroll({
  frets,
  leftHanded,
  focus,
  recenter,
  children,
}: {
  frets: number
  leftHanded: boolean
  /** First and last fret that must be on screen; 0 includes the open strings. */
  focus?: [number, number]
  /** Change it to slide back to the focus frets, e.g. once per question. */
  recenter?: unknown
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState(0)
  const [overflows, setOverflows] = useState(false)
  const lo = focus?.[0]
  const hi = focus?.[1]

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setBox(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The focus window in drawing units, measured from the nut end of the drawing
  let width: number | undefined
  let span: [number, number] | null = null
  let cramped = false
  if (lo !== undefined && hi !== undefined && box > 0) {
    const fretX = makeFretX(frets)
    const a = lo <= 0 ? 0 : Math.max(0, fretX(lo - 1) - PAD)
    const b = hi >= frets ? NO_PICK_W : Math.min(NO_PICK_W, fretX(hi) + PAD)
    const readable = ((frets * FRET_PX + 170) * NO_PICK_W) / 1000
    const fit = (box * NO_PICK_W) / (b - a)
    width = Math.round(Math.max(box, Math.min(readable, fit)))
    // A long window on an upright phone comes out small: suggest turning the phone
    cramped = fit < readable * 0.6
    span = [a, b]
  }

  /** Scroll position that centres a span of the drawing (in drawing units) on the screen. */
  const scrollFor = (el: HTMLDivElement, a: number, b: number) => {
    const s = el.scrollWidth / NO_PICK_W
    const [x1, x2] = leftHanded ? [(NO_PICK_W - b) * s, (NO_PICK_W - a) * s] : [a * s, b * s]
    return Math.max(0, Math.min(el.scrollWidth - el.clientWidth, (x1 + x2) / 2 - el.clientWidth / 2))
  }

  // Without a focus, buttons slide the neck to each part of it, so nobody has to swipe to find a fret
  const fretX = makeFretX(frets)
  const parts: { label: string; a: number; b: number }[] = []
  for (let first = 0; first <= frets; ) {
    const last = Math.min(frets, first === 0 ? 4 : first + 3)
    parts.push({
      label: first === 0 ? `Open to ${last}` : `${first} to ${last}`,
      a: first === 0 ? 0 : fretX(first - 1) - PAD,
      b: Math.min(NO_PICK_W, fretX(last) + PAD),
    })
    first = last + 1
  }
  const [part, setPart] = useState(0)
  const onScroll = () => {
    const el = ref.current
    if (!el || focus) return
    let best = 0
    parts.forEach((p, i) => {
      if (Math.abs(scrollFor(el, p.a, p.b) - el.scrollLeft) < Math.abs(scrollFor(el, parts[best].a, parts[best].b) - el.scrollLeft)) best = i
    })
    setPart(best)
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setOverflows(el.scrollWidth > el.clientWidth + 2)
    if (!span || !width) {
      // Opens at the nut, which is on the right for left-handed players
      el.scrollLeft = leftHanded ? el.scrollWidth : 0
      setPart(0)
      return
    }
    el.scrollLeft = scrollFor(el, span[0], span[1])
    // span and scrollFor are rebuilt every render from the values listed here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftHanded, frets, lo, hi, width, box, recenter])

  const style = { '--neck-frets': frets, ...(width ? { '--neck-w': `${width}px` } : {}) } as CSSProperties
  return (
    <div className="neck-scroll-wrap">
      <div ref={ref} className="neck-scroll" style={style} onScroll={onScroll}>
        {children}
      </div>
      {overflows && !focus && (
        <div className="neck-scroll-hint neck-parts" role="group" aria-label="Show frets">
          <span>Frets</span>
          {parts.map((p, i) => (
            <button
              key={p.label}
              className={i === part ? 'chip active' : 'chip'}
              onClick={() => {
                const el = ref.current
                if (el) el.scrollTo({ left: scrollFor(el, p.a, p.b), behavior: 'smooth' })
                setPart(i)
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {cramped && <p className="neck-scroll-hint neck-scroll-turn">Turn your phone sideways for a bigger neck</p>}
    </div>
  )
}
