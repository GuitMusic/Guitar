import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

/**
 * On a phone a whole neck squeezed into the screen width makes the note names too small to
 * read, so the neck is drawn at a readable size and slides sideways under your finger, about
 * five frets at a time. It opens at the nut (on the right for left-handed players). On wider
 * screens it fits as before.
 */
export function NeckScroll({ frets, leftHanded, children }: { frets: number; leftHanded: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollLeft = leftHanded ? el.scrollWidth : 0
  }, [leftHanded, frets])
  return (
    <div className="neck-scroll-wrap">
      <div ref={ref} className="neck-scroll" style={{ '--neck-frets': frets } as CSSProperties}>
        {children}
      </div>
      <p className="neck-scroll-hint">Swipe the neck to see more frets</p>
    </div>
  )
}
