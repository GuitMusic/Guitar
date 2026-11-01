import {
  BoxGeometry,
  BufferAttribute,
  Color,
  CylinderGeometry,
  DirectionalLight,
  GreaterDepth,
  Group,
  HemisphereLight,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SkinnedMesh,
  Vector3,
  WebGLRenderer,
  type Bone,
  type Material,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RIGHT_HAND_BIND } from './bindPose'
import { forward, makeRig, PARAMS, type HandRig } from './rig'
import { pressX, solveHandBest, type HandTask, type Neck } from './solve'
import { taskKey } from './targets'

/** Finger colours, the same as the numbered dots (thumb, index … little). */
export const FINGER_COLORS = ['#a0a0a0', '#3b8ee6', '#2fae66', '#ec9440', '#a964e0']
const SKIN = '#f6dcc8'

export interface StageLayout {
  strings: number
  leftHanded: boolean
  /** 'player': bass strings on top, like the 2D fretboard. 'tab': highest string on top. */
  stringOrder: 'player' | 'tab'
}

export interface StageNote {
  string: number
  fret: number
  finger: number | null
}

/** A real neck in millimetres: 650 mm scale, about 9 mm between strings. */
export function realNeck(strings: number): Neck {
  const spacing = strings <= 6 ? 9 : 54 / strings
  return {
    fretX: (n) => 650 * (1 - Math.pow(2, -n / 12)),
    stringY: (s) => (s - 1) * spacing,
    strings,
    edgeLow: -4.5,
    edgeHigh: (strings - 1) * spacing + 4.5,
    depth: 22,
  }
}

const rig: HandRig = makeRig(RIGHT_HAND_BIND, unit([0, 0.3, 1]), unit([0, -1, 0.3]))

function unit(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(...v)
  return [v[0] / l, v[1] / l, v[2] / l]
}

const FRETS = 19
const INLAYS = [3, 5, 7, 9, 15, 17]

/** Where the camera sits relative to the hand, before mirroring (mm). */
export const VIEWS = {
  /** In front of the guitar, a little from below: the whole back of the hand and the wrist. */
  front: new Vector3(40, -150, 300),
  /** Like looking down at your own guitar from above the bass strings. */
  player: new Vector3(60, 330, 250),
  /** From the body end of the neck, along the strings: how the fingers arch. */
  side: new Vector3(360, -80, 190),
}
export type ViewName = keyof typeof VIEWS

/**
 * A 3D guitar neck with the whole fretting hand on it: palm, wrist, thumb and fingers,
 * posed by the hand solver. The hand is see-through where the neck hides it, so the
 * thumb behind the neck stays visible.
 */
export class HandStage {
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(30, 2, 5, 4000)
  private controls: OrbitControls
  private world = new Group()
  private neckGroup = new Group()
  private markers = new Group()
  private bones: Record<string, Bone> = {}
  private loaded = false
  private layout: StageLayout | null = null
  private neck: Neck = realNeck(6)
  private task: HandTask | null = null
  private current = new Float64Array(PARAMS)
  private target = new Float64Array(PARAMS)
  private hasPose = false
  private focus = new Vector3()
  private focusTarget = new Vector3()
  private raf = 0
  private last = 0
  private cache = new Map<string, Float64Array>()
  private disposed = false
  private disposables: { dispose(): void }[] = []
  private uniforms = { uFingerAlpha: { value: [1, 1, 1, 1, 1, 1] } }
  private alphaTarget = [1, 1, 1, 1, 1, 1]
  private key: DirectionalLight
  private view: ViewName = 'front'
  reduceMotion = false

  constructor(canvas: HTMLCanvasElement, modelUrl: string) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap

    this.scene.add(new HemisphereLight(0xfff2e2, 0x3a2a20, 2.2))
    this.key = new DirectionalLight(0xfff0dd, 2.2)
    this.key.castShadow = true
    this.key.shadow.mapSize.set(1024, 1024)
    this.key.shadow.camera.left = -160
    this.key.shadow.camera.right = 160
    this.key.shadow.camera.top = 160
    this.key.shadow.camera.bottom = -160
    this.key.shadow.camera.near = 10
    this.key.shadow.camera.far = 900
    this.key.shadow.bias = -0.0005
    this.key.shadow.radius = 4
    this.scene.add(this.key, this.key.target)
    const rim = new DirectionalLight(0xbfd6ff, 0.8)
    rim.position.set(0, 300, -400)
    this.scene.add(rim)

    this.scene.add(this.world)
    this.world.add(this.neckGroup, this.markers)
    this.buildNeck()

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enablePan = false
    this.controls.minDistance = 140
    this.controls.maxDistance = 700
    this.controls.addEventListener('change', () => this.kick())
    // Vertical swipes still scroll the page on phones; sideways drags turn the view
    canvas.style.touchAction = 'pan-y'

    new GLTFLoader().load(modelUrl, (gltf) => {
      if (this.disposed) return
      this.setupModel(gltf.scene)
    })
  }

  private mat(m: Material) {
    this.disposables.push(m)
    return m
  }

  private buildNeck() {
    const g = this.neckGroup
    g.clear()
    const n = this.neck
    const end = n.fretX(FRETS) + 8
    const width = n.edgeHigh - n.edgeLow
    const midY = (n.edgeHigh + n.edgeLow) / 2

    const board = new Mesh(new BoxGeometry(end + 4, width, 6), this.mat(new MeshStandardMaterial({ color: '#3b2417', roughness: 0.8 })))
    board.position.set(end / 2 - 2, midY, -3)
    board.receiveShadow = true
    g.add(board)

    // Neck back: half an ellipse under the fingerboard
    const back = new Mesh(new CylinderGeometry(1, 1, end + 4, 32, 1, false, Math.PI / 2, Math.PI), this.mat(new MeshStandardMaterial({ color: '#6b4428', roughness: 0.6 })))
    back.rotation.z = -Math.PI / 2
    back.scale.set(width / 2, 1, n.depth - 6)
    back.position.set(end / 2 - 2, midY, -6)
    back.receiveShadow = true
    g.add(back)

    // Headstock stub and nut
    const head = new Mesh(new BoxGeometry(70, width + 10, 12), this.mat(new MeshStandardMaterial({ color: '#2c1a10', roughness: 0.7 })))
    head.position.set(-38, midY, -8)
    g.add(head)
    const nut = new Mesh(new BoxGeometry(4, width, 5), this.mat(new MeshStandardMaterial({ color: '#efe6d2', roughness: 0.4 })))
    nut.position.set(-2, midY, 0.5)
    g.add(nut)

    const fretMat = this.mat(new MeshStandardMaterial({ color: '#d9d6cf', metalness: 0.9, roughness: 0.25 }))
    for (let f = 1; f <= FRETS; f++) {
      const fret = new Mesh(new BoxGeometry(1.8, width, 1.4), fretMat)
      fret.position.set(n.fretX(f), midY, 0.6)
      fret.castShadow = true
      fret.receiveShadow = true
      g.add(fret)
    }
    const inlayMat = this.mat(new MeshStandardMaterial({ color: '#eadfca', roughness: 0.5 }))
    const inlay = (x: number, y: number) => {
      const d = new Mesh(new CylinderGeometry(3, 3, 0.4, 24), inlayMat)
      d.rotation.x = Math.PI / 2
      d.position.set(x, y, 0.1)
      g.add(d)
    }
    for (const f of INLAYS) inlay((n.fretX(f - 1) + n.fretX(f)) / 2, midY)
    inlay((n.fretX(11) + n.fretX(12)) / 2, midY - width * 0.25)
    inlay((n.fretX(11) + n.fretX(12)) / 2, midY + width * 0.25)

    const plain = this.mat(new MeshStandardMaterial({ color: '#e8e8e8', metalness: 1, roughness: 0.25 }))
    const wound = this.mat(new MeshStandardMaterial({ color: '#c79a5e', metalness: 1, roughness: 0.35 }))
    for (let s = 1; s <= n.strings; s++) {
      const r = 0.25 + (s - 1) * 0.09
      const str = new Mesh(new CylinderGeometry(r, r, end + 10, 8), s > n.strings / 2 ? wound : plain)
      str.rotation.z = Math.PI / 2
      str.position.set(end / 2, n.stringY(s), 2 + r)
      str.castShadow = true
      g.add(str)
    }
  }

  private setupModel(root: Object3D) {
    let mesh: SkinnedMesh | null = null
    root.traverse((o) => {
      if ((o as Bone).isBone) this.bones[o.name] = o as Bone
      if ((o as SkinnedMesh).isSkinnedMesh) mesh = o as SkinnedMesh
    })
    if (!mesh) return
    const skinned = mesh as SkinnedMesh
    prepareGeometry(skinned)
    const geo = skinned.geometry
    const u = this.uniforms
    const partVertex = (src: string) =>
      src
        .replace('#include <common>', '#include <common>\nattribute float aPart;\nuniform float uFingerAlpha[6];\nvarying float vPartAlpha;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPartAlpha = uFingerAlpha[int(aPart + 0.5)];')
    const tinted = (alpha: string, rim: number) => {
      const m = new MeshStandardMaterial({ vertexColors: true, transparent: true, roughness: 0.6, metalness: 0, depthWrite: false })
      m.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, u)
        shader.vertexShader = partVertex(shader.vertexShader)
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPartAlpha;').replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
          float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.0);
          gl_FragColor.rgb += rim * ${rim.toFixed(2)};
          gl_FragColor.a = clamp((${alpha}) * vPartAlpha, 0.0, 1.0);`,
        )
      }
      return this.mat(m) as MeshStandardMaterial
    }

    // Parts the neck hides (the thumb behind it) are drawn faintly, like an X-ray
    const xray = tinted('0.22 + rim * 0.45', 0.35)
    xray.depthFunc = GreaterDepth
    const ghost = new SkinnedMesh(geo, xray)
    ghost.bind(skinned.skeleton, skinned.bindMatrix)
    ghost.renderOrder = 1
    ghost.frustumCulled = false

    // Depth pre-pass so the see-through hand shows only its front surface
    const depthMat = new MeshDepthMaterial()
    depthMat.colorWrite = false
    this.mat(depthMat)
    const depth = new SkinnedMesh(geo, depthMat)
    depth.bind(skinned.skeleton, skinned.bindMatrix)
    depth.renderOrder = 2
    depth.frustumCulled = false
    depth.castShadow = true

    skinned.material = tinted('0.8 + rim * 0.2', 0.12)
    skinned.renderOrder = 3
    skinned.frustumCulled = false
    skinned.parent?.add(ghost, depth)
    root.scale.setScalar(1000)
    this.world.add(root)
    this.loaded = true
    this.kick()
  }

  setLayout(layout: StageLayout) {
    if (JSON.stringify(layout) === JSON.stringify(this.layout)) return
    this.layout = layout
    if (layout.strings !== this.neck.strings) {
      this.neck = realNeck(layout.strings)
      this.cache.clear()
      this.buildNeck()
      if (this.task) this.setTask(this.task, true)
    }
    const flipY = layout.stringOrder === 'tab'
    this.world.scale.set(layout.leftHanded ? -1 : 1, flipY ? -1 : 1, 1)
    this.setView(this.view)
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.kick()
  }

  /** Puts the camera at one of the preset angles, looking at the hand. */
  setView(view: ViewName) {
    this.view = view
    const o = VIEWS[view]
    const sx = this.layout?.leftHanded ? -1 : 1
    const sy = this.layout?.stringOrder === 'tab' ? -1 : 1
    this.controls.target.copy(this.focus)
    this.camera.position.set(this.focus.x + o.x * sx, this.focus.y + o.y * sy, this.focus.z + o.z)
    this.camera.up.set(0, 1, 0)
    this.controls.update()
    this.placeLight()
    this.kick()
  }

  private placeLight() {
    const sx = this.layout?.leftHanded ? -1 : 1
    const sy = this.layout?.stringOrder === 'tab' ? -1 : 1
    this.key.position.set(this.focus.x - 60 * sx, this.focus.y + 160 * sy, this.focus.z + 320)
    this.key.target.position.copy(this.focus)
  }

  setNotes(notes: StageNote[]) {
    for (const m of this.markers.children) {
      const mesh = m as Mesh
      mesh.geometry.dispose()
      ;(mesh.material as Material).dispose()
    }
    this.markers.clear()
    for (const n of notes) {
      if (n.fret <= 0) continue
      const color = new Color(FINGER_COLORS[n.finger ?? 0] ?? FINGER_COLORS[0])
      const disc = new Mesh(new CylinderGeometry(3.4, 3.4, 0.8, 24), new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.4 }))
      disc.rotation.x = Math.PI / 2
      disc.position.set(pressX(this.neck, n.fret), this.neck.stringY(n.string), 1.2)
      this.markers.add(disc)
    }
    this.kick()
  }

  setTask(task: HandTask, force = false) {
    if (!force && this.task && taskKey(task) === taskKey(this.task)) return
    this.task = task
    const key = taskKey(task)
    let solved = this.cache.get(key)
    if (!solved) {
      solved = solveHandBest(rig, this.neck, task).params
      this.cache.set(key, solved)
    }
    this.target.set(solved)
    const weight = { press: 1, barre: 1, hover: 0.8, free: 0.55 }
    this.alphaTarget = [1, ...task.fingers.map((f) => weight[f.kind]), 1]
    // Look at the middle of the hand
    const fx = task.fingers.map((f) => pressX(this.neck, f.fret))
    const local = new Vector3((Math.min(...fx) + Math.max(...fx)) / 2, (this.neck.edgeLow + this.neck.edgeHigh) / 2 - 38, -10)
    this.world.updateMatrixWorld()
    this.focusTarget.copy(this.world.localToWorld(local))
    if (!this.hasPose || this.reduceMotion) {
      this.current.set(solved)
      this.hasPose = true
      const delta = this.focusTarget.clone().sub(this.focus)
      this.focus.copy(this.focusTarget)
      this.camera.position.add(delta)
      this.controls.target.copy(this.focus)
      this.controls.update()
      this.placeLight()
    }
    this.kick()
  }

  private kick() {
    if (this.raf || this.disposed) return
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  private frame = (now: number) => {
    this.raf = 0
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    let moving = false
    if (this.hasPose) {
      const a = 1 - Math.exp(-dt / 0.07)
      for (let i = 0; i < PARAMS; i++) {
        const d = this.target[i] - this.current[i]
        if (Math.abs(d) > (i < 3 ? 0.05 : 0.0005)) moving = true
        this.current[i] += d * a
      }
      if (!moving) this.current.set(this.target)
      const alpha = this.uniforms.uFingerAlpha.value
      for (let i = 0; i < 6; i++) {
        const d = this.alphaTarget[i] - alpha[i]
        if (Math.abs(d) > 0.01) moving = true
        alpha[i] += Math.abs(d) > 0.01 ? d * a : d
      }
      // The camera glides along with the hand
      const b = 1 - Math.exp(-dt / 0.25)
      const delta = this.focusTarget.clone().sub(this.focus)
      if (delta.length() > 0.05) {
        moving = true
        delta.multiplyScalar(b)
        this.focus.add(delta)
        this.camera.position.add(delta)
        this.controls.target.copy(this.focus)
        this.controls.update()
        this.placeLight()
      }
    }
    this.draw()
    if (moving) this.kick()
  }

  private draw() {
    if (this.loaded && this.hasPose) {
      const pose = forward(rig, this.current, 1000, true)
      for (const [name, j] of Object.entries(pose.joints)) {
        const bone = this.bones[name]
        if (!bone) continue
        bone.position.set(j.p[0] / 1000, j.p[1] / 1000, j.p[2] / 1000)
        bone.quaternion.set(j.q[0], j.q[1], j.q[2], j.q[3])
      }
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.controls.dispose()
    this.disposables.forEach((d) => d.dispose())
    this.scene.traverse((o) => (o as Mesh).geometry?.dispose())
    this.renderer.dispose()
  }
}

/** Adds per-vertex finger colours and a part id (0 thumb, 1-4 fingers, 5 palm) to the hand. */
function prepareGeometry(mesh: SkinnedMesh) {
  const geo = mesh.geometry
  const idx = geo.getAttribute('skinIndex')
  const wgt = geo.getAttribute('skinWeight')
  const names = mesh.skeleton.bones.map((b) => b.name)
  const fingerOf = (name: string) => (name.startsWith('thumb') ? 0 : ['index', 'middle', 'ring', 'pinky'].findIndex((f) => name.startsWith(f)) + 1)
  const tint = (name: string) => {
    if (name.endsWith('tip') || name.endsWith('distal')) return 0.9
    if (name.endsWith('intermediate')) return 0.6
    if (name.endsWith('proximal')) return 0.2
    return 0
  }
  const skin = new Color(SKIN)
  const colors = new Float32Array(idx.count * 3)
  const part = new Float32Array(idx.count)
  const c = new Color()
  for (let v = 0; v < idx.count; v++) {
    c.setRGB(0, 0, 0)
    let total = 0
    let best = 0
    for (let k = 0; k < 4; k++) {
      const w = wgt.getComponent(v, k)
      if (w > wgt.getComponent(v, best)) best = k
      if (w <= 0) continue
      const name = names[idx.getComponent(v, k)] ?? ''
      const finger = fingerOf(name)
      const amount = finger === 0 ? tint(name) * 0.4 : tint(name)
      const fc = new Color(FINGER_COLORS[finger])
      c.r += w * (skin.r + (fc.r - skin.r) * amount)
      c.g += w * (skin.g + (fc.g - skin.g) * amount)
      c.b += w * (skin.b + (fc.b - skin.b) * amount)
      total += w
    }
    if (total > 0) c.multiplyScalar(1 / total)
    colors.set([c.r, c.g, c.b], v * 3)
    const name = names[idx.getComponent(v, best)] ?? ''
    part[v] = (name.endsWith('metacarpal') && !name.startsWith('thumb')) || name === 'wrist' ? 5 : fingerOf(name)
  }
  geo.setAttribute('color', new BufferAttribute(colors, 3))
  geo.setAttribute('aPart', new BufferAttribute(part, 1))
}
