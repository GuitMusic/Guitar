import { useEffect, useMemo, useRef, useState } from 'react'
import type { FretNote } from '../music/types'
import { HandStage, type StageLayout, type ViewName } from './HandStage'
import type { HandTask } from './solve'
import { buildHandTask, liftHand } from './targets'

interface Props {
  notes: FretNote[]
  shape: FretNote[]
  handPosition: number | null
  layout: StageLayout
}

const VIEW_KEY = 'hand-view'
const VIEW_LABELS: [ViewName, string, string][] = [
  ['front', 'Front', 'From the front: the whole hand and wrist'],
  ['player', 'Player', 'Looking down at the neck, like when you play'],
  ['side', 'Side', 'Along the neck: how the fingers arch'],
]

function savedView(): ViewName {
  try {
    const v = localStorage.getItem(VIEW_KEY)
    if (v === 'front' || v === 'player' || v === 'side') return v
  } catch {
    /* storage may be unavailable */
  }
  return 'front'
}

/** A 3D guitar neck with the whole fretting hand on it, following the song. */
export default function HandPanel({ notes, shape, handPosition, layout }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HandStage | null>(null)
  const lastTask = useRef<HandTask | null>(null)
  const [view, setView] = useState<ViewName>(savedView)

  useEffect(() => {
    const canvas = canvasRef.current!
    const stage = new HandStage(canvas, `${import.meta.env.BASE_URL}models/hand-right.glb`)
    stage.reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    stageRef.current = stage
    const fit = () => {
      const r = canvas.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) stage.resize(r.width, r.height)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(canvas)
    return () => {
      ro.disconnect()
      stage.dispose()
      stageRef.current = null
    }
  }, [])

  const layoutKey = JSON.stringify(layout)
  useEffect(() => {
    stageRef.current?.setLayout(layout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey])

  useEffect(() => {
    stageRef.current?.setView(view)
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      /* storage may be unavailable */
    }
  }, [view])

  const task = useMemo(() => {
    const t = buildHandTask(notes, shape, handPosition, layout.strings)
    if (t) return t
    // Only open strings: the hand stays where it was, lifted off the strings
    return lastTask.current ? liftHand(lastTask.current) : buildHandTask([], [], 1, layout.strings)
  }, [notes, shape, handPosition, layout.strings])

  useEffect(() => {
    if (!task) return
    lastTask.current = task
    stageRef.current?.setTask(task)
    stageRef.current?.setNotes(
      notes.filter((n) => n.tabFret > 0 && !n.isDead).map((n) => ({ string: n.string, fret: n.fret, finger: n.lh })),
    )
  }, [task, notes])

  return (
    <div className="hand-panel">
      <canvas ref={canvasRef} className="hand-panel-canvas" aria-label="3D view of the fretting hand. Drag sideways to turn it." />
      <div className="hand-panel-views" role="group" aria-label="Camera angle">
        {VIEW_LABELS.map(([v, label, title]) => (
          <button key={v} className={view === v ? 'active' : ''} aria-pressed={view === v} title={title} onClick={() => (view === v ? stageRef.current?.setView(v) : setView(v))}>
            {label}
          </button>
        ))}
      </div>
      <div className="hand-panel-hint">Drag to turn</div>
    </div>
  )
}
