import { useEffect, useMemo, useRef } from 'react'
import type { FretNote } from '../music/types'
import { HandView, type ViewLayout } from './HandView'
import { buildHandTask, liftHand } from './targets'
import type { HandTask } from './solve'

interface Props {
  notes: FretNote[]
  shape: FretNote[]
  handPosition: number | null
  layout: ViewLayout
}

/** The see-through 3D fretting hand, drawn on a canvas laid over the SVG fretboard. */
export default function HandOverlay({ notes, shape, handPosition, layout }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewRef = useRef<HandView | null>(null)
  const lastTask = useRef<HandTask | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const view = new HandView(canvas, `${import.meta.env.BASE_URL}models/hand-right.glb`)
    view.reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    viewRef.current = view
    return () => {
      view.dispose()
      viewRef.current = null
    }
  }, [])

  // Keep the canvas the same size as the drawing under it
  const layoutKey = JSON.stringify(layout)
  useEffect(() => {
    const canvas = canvasRef.current!
    const apply = () => {
      const r = canvas.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) viewRef.current?.setLayout(layout, r.width, r.height)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(canvas)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey])

  const task = useMemo(() => {
    const t = buildHandTask(notes, shape, handPosition, layout.strings)
    if (t) return t
    // Only open strings: keep the hand where it was, lifted off the strings
    return lastTask.current ? liftHand(lastTask.current) : buildHandTask([], [], 1, layout.strings)
  }, [notes, shape, handPosition, layout.strings])

  useEffect(() => {
    if (!task) return
    lastTask.current = task
    viewRef.current?.setTask(task)
  }, [task])

  return <canvas ref={canvasRef} className="hand-canvas" aria-hidden="true" />
}
