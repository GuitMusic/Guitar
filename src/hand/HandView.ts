import {
  AmbientLight,
  Bone,
  BufferAttribute,
  Color,
  DirectionalLight,
  Group,
  MeshStandardMaterial,
  MeshDepthMaterial,
  Matrix4,
  OrthographicCamera,
  Scene,
  SkinnedMesh,
  WebGLRenderer,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { fretScale, NUT_X, STRING_GAP, TOP, W, NECK_MARGIN } from '../components/fretboardGeometry'
import { RIGHT_HAND_BIND } from './bindPose'
import { forward, makeRig, PARAMS, type HandRig } from './rig'
import { solveHand, type HandTask, type Neck } from './solve'
import { taskKey } from './targets'

/** Colours of the fingers, the same as the numbered dots. */
const FINGER_COLORS = ['#9a9a9a', '#3b8ee6', '#2fae66', '#ec9440', '#a964e0']
const SKIN = '#f6e7da'

export interface ViewLayout {
  frets: number
  strings: number
  /** Height of the SVG drawing in its own units (width is always W). */
  height: number
  leftHanded: boolean
  /** 'player': bass strings on top. 'tab': highest string on top. */
  stringOrder: 'player' | 'tab'
}

/** Neck geometry in "hand millimetres" for the drawing, and the SVG units per millimetre. */
export function neckFor(layout: ViewLayout): { neck: Neck; k: number } {
  const scale = fretScale(layout.frets)
  // Real guitars: 650 mm scale length, about 9 mm between strings mid-neck. The drawing
  // stretches these differently, so the hand uses a size between the two.
  const sx = scale / 650
  const sy = STRING_GAP / 9
  const k = Math.pow(sx, 0.3) * Math.pow(sy, 0.7)
  const neck: Neck = {
    fretX: (n) => (scale * (1 - Math.pow(2, -n / 12))) / k,
    stringY: (s) => ((s - 1) * STRING_GAP) / k,
    strings: layout.strings,
    edgeLow: -NECK_MARGIN / k,
    edgeHigh: ((layout.strings - 1) * STRING_GAP + NECK_MARGIN) / k,
    depth: 22,
  }
  return { neck, k }
}

const rig: HandRig = makeRig(RIGHT_HAND_BIND, norm3([0, 0.3, 1]), norm3([0, -1, 0.3]))

function norm3(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(...v)
  return [v[0] / l, v[1] / l, v[2] / l]
}

/**
 * Draws a see-through 3D fretting hand over the SVG fretboard. The camera looks straight
 * at the fingerboard, so the fingertips land on the dots of the drawing.
 */
export class HandView {
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new OrthographicCamera(0, W, 0, -300, -4000, 4000)
  private mirror = new Group()
  private mmGroup = new Group()
  private bones: Record<string, Bone> = {}
  private loaded = false
  private layout: ViewLayout | null = null
  private neck: Neck | null = null
  private task: HandTask | null = null
  private current = new Float64Array(PARAMS)
  private target = new Float64Array(PARAMS)
  private hasPose = false
  private raf = 0
  private last = 0
  private cache = new Map<string, Float64Array>()
  private disposed = false
  private materials: MeshStandardMaterial[] = []
  private uniforms = { uNeckTop: { value: 0 }, uNeckBottom: { value: 0 }, uFadeY: { value: 0 }, uFingerAlpha: { value: [1, 1, 1, 1, 1, 1] } }
  /** Opacity per part (thumb, fingers 1-4, palm): fingers at work are solid, resting ones faint. */
  private alphaTarget = [1, 1, 1, 1, 1, 1]
  reduceMotion = false

  constructor(canvas: HTMLCanvasElement, modelUrl: string) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power', premultipliedAlpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.camera.position.set(0, 0, 1000)
    this.scene.add(this.camera)
    this.scene.add(new AmbientLight(0xffffff, 1.1))
    const key = new DirectionalLight(0xffffff, 1.6)
    key.position.set(-0.4, 0.6, 1)
    this.scene.add(key)
    const fill = new DirectionalLight(0xffe2c8, 0.5)
    fill.position.set(0.6, -0.5, 0.6)
    this.scene.add(fill)
    this.scene.add(this.mirror)
    this.mirror.add(this.mmGroup)
    new GLTFLoader().load(modelUrl, (gltf) => {
      if (this.disposed) return
      this.setupModel(gltf.scene)
    })
  }

  private setupModel(root: Object3D) {
    let skinned: SkinnedMesh | null = null
    root.traverse((o) => {
      if ((o as Bone).isBone) this.bones[o.name] = o as Bone
      if ((o as SkinnedMesh).isSkinnedMesh) skinned = o as SkinnedMesh
    })
    if (!skinned) return
    const mesh = skinned as SkinnedMesh
    // Tint each fingertip with its finger colour, fading into the skin colour towards the palm
    const geo = mesh.geometry
    const idx = geo.getAttribute('skinIndex')
    const wgt = geo.getAttribute('skinWeight')
    const jointNames = mesh.skeleton.bones.map((b) => b.name)
    const tintOf = (name: string): [number, number] => {
      const finger = name.startsWith('thumb') ? 0 : ['index', 'middle', 'ring', 'pinky'].findIndex((f) => name.startsWith(f)) + 1
      const amount = name.endsWith('tip') || name.endsWith('distal') ? 1 : name.endsWith('intermediate') ? 0.8 : name.endsWith('proximal') && finger > 0 ? 0.35 : 0
      return [finger, finger === 0 ? amount * 0.5 : amount]
    }
    const skin = new Color(SKIN)
    const colors = new Float32Array(idx.count * 3)
    const c = new Color()
    for (let v = 0; v < idx.count; v++) {
      c.setRGB(0, 0, 0)
      let total = 0
      for (let k = 0; k < 4; k++) {
        const w = wgt.getComponent(v, k)
        if (w <= 0) continue
        const [finger, amount] = tintOf(jointNames[idx.getComponent(v, k)] ?? '')
        const fc = new Color(FINGER_COLORS[finger])
        c.r += w * (skin.r + (fc.r - skin.r) * amount)
        c.g += w * (skin.g + (fc.g - skin.g) * amount)
        c.b += w * (skin.b + (fc.b - skin.b) * amount)
        total += w
      }
      if (total > 0) c.multiplyScalar(1 / total)
      colors.set([c.r, c.g, c.b], v * 3)
    }
    geo.setAttribute('color', new BufferAttribute(colors, 3))
    // Which part each vertex belongs to (its strongest bone): 0 thumb, 1-4 fingers, 5 palm
    const part = new Float32Array(idx.count)
    for (let v = 0; v < idx.count; v++) {
      let best = 0
      for (let k = 1; k < 4; k++) if (wgt.getComponent(v, k) > wgt.getComponent(v, best)) best = k
      const name = jointNames[idx.getComponent(v, best)] ?? ''
      part[v] = name.endsWith('metacarpal') && !name.startsWith('thumb') || name === 'wrist' ? 5 : tintOf(name)[0]
    }
    geo.setAttribute('aPart', new BufferAttribute(part, 1))
    // How much of each vertex is fingertip: the tips get clearer so the numbered dots show through
    const tipness = new Float32Array(idx.count)
    for (let v = 0; v < idx.count; v++) {
      for (let k = 0; k < 4; k++) {
        const name = jointNames[idx.getComponent(v, k)] ?? ''
        if (name.endsWith('tip') || (name.endsWith('distal') && !name.startsWith('thumb'))) tipness[v] += wgt.getComponent(v, k)
      }
    }
    geo.setAttribute('aTip', new BufferAttribute(tipness, 1))
    const partVertex = (src: string) =>
      src
        .replace('#include <common>', '#include <common>\nattribute float aPart;\nattribute float aTip;\nuniform float uFingerAlpha[6];\nvarying float vPartAlpha;\nvarying float vTip;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPartAlpha = uFingerAlpha[int(aPart + 0.5)];\nvTip = aTip;')

    // Depth pre-pass, so only the front surface of the see-through hand is drawn
    const depthMat = new MeshDepthMaterial()
    depthMat.colorWrite = false
    // Faint (resting) fingers don't hide the fingers at work behind them
    depthMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms)
      shader.vertexShader = partVertex(shader.vertexShader)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vPartAlpha;')
        .replace('void main() {', 'void main() {\n  if (vPartAlpha < 0.9) discard;')
    }
    const depth = new SkinnedMesh(geo, depthMat)
    depth.bind(mesh.skeleton, mesh.bindMatrix)
    depth.renderOrder = 0
    depth.frustumCulled = false
    mesh.parent?.add(depth)

    const mat = new MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      roughness: 0.55,
      metalness: 0,
      depthWrite: false,
    })
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms)
      shader.vertexShader = partVertex(shader.vertexShader)
        .replace('#include <common>', '#include <common>\nvarying vec3 vHandWorld;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvHandWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vHandWorld;\nvarying float vPartAlpha;\nvarying float vTip;\nuniform float uNeckTop;\nuniform float uNeckBottom;\nuniform float uFadeY;')
        .replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
          float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.2);
          float behind = (vHandWorld.z < 0.0 && vHandWorld.y < uNeckTop && vHandWorld.y > uNeckBottom) ? 0.4 : 1.0;
          // Fade out where the hand leaves the drawing
          float fade = smoothstep(uFadeY, uFadeY + 70.0, vHandWorld.y) * smoothstep(uFadeY, uFadeY + 70.0, -vHandWorld.y + uFadeY);
          float a = (0.42 - 0.2 * vTip + rim * 0.5) * behind * fade * vPartAlpha;
          gl_FragColor = vec4(gl_FragColor.rgb + rim * 0.25, a);
          gl_FragColor.rgb *= gl_FragColor.a;`,
        )
    }
    mesh.material = mat
    mesh.renderOrder = 1
    mesh.frustumCulled = false
    this.materials.push(mat)
    this.mmGroup.add(root)
    // Bones are posed in millimetres directly, so the model's own scale is metres → mm
    root.scale.setScalar(1000)
    this.loaded = true
    this.kick()
  }

  setLayout(layout: ViewLayout, cssWidth: number, cssHeight: number) {
    const changed = JSON.stringify(layout) !== JSON.stringify(this.layout)
    this.layout = layout
    this.renderer.setSize(cssWidth, cssHeight, false)
    this.camera.left = 0
    this.camera.right = W
    this.camera.top = 0
    this.camera.bottom = -layout.height
    this.camera.updateProjectionMatrix()
    // Oblique view: the fingerboard plane stays exactly where the drawing is, while things
    // above it slide towards the treble strings, as if you look down from over the bass
    // strings like you do when playing. This shows how the fingers arch and peeks the thumb over the neck.
    const shearY = (layout.stringOrder === 'tab' ? 1 : -1) * 0.45
    this.camera.projectionMatrix.multiply(new Matrix4().set(1, 0, 0, 0, 0, 1, shearY, shearY * this.camera.position.z, 0, 0, 1, 0, 0, 0, 0, 1))
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert()
    if (changed) {
      const { neck, k } = neckFor(layout)
      this.neck = neck
      this.cache.clear()
      const bottomString = TOP + (layout.strings - 1) * STRING_GAP
      this.mmGroup.position.set(NUT_X, -bottomString, 0)
      this.mmGroup.scale.setScalar(k)
      // Mirror for left-handed players (nut on the right) and for highest-string-on-top
      const flipY = layout.stringOrder === 'tab'
      this.mirror.scale.set(layout.leftHanded ? -1 : 1, flipY ? -1 : 1, 1)
      this.mirror.position.set(layout.leftHanded ? W : 0, flipY ? -(TOP + bottomString) : 0, 0)
      this.uniforms.uNeckTop.value = -(TOP - NECK_MARGIN)
      this.uniforms.uNeckBottom.value = -(bottomString + NECK_MARGIN)
      this.uniforms.uFadeY.value = -layout.height
      if (this.task) this.setTask(this.task, true)
    }
    this.kick()
  }

  setTask(task: HandTask, force = false) {
    if (!force && this.task && taskKey(task) === taskKey(this.task)) return
    this.task = task
    if (!this.neck) return
    const key = taskKey(task)
    let solved = this.cache.get(key)
    if (!solved) {
      const fresh = solveHand(rig, this.neck, task)
      if (fresh.error > 4 && this.hasPose) {
        const warm = solveHand(rig, this.neck, task, this.current)
        solved = warm.error < fresh.error ? warm.params : fresh.params
      } else {
        solved = fresh.params
      }
      this.cache.set(key, solved)
    }
    this.target.set(solved)
    const weight = { press: 1, barre: 1, hover: 0.7, free: 0.38 }
    this.alphaTarget = [task.thumb.kind === 'over' ? 1 : 0.85, ...task.fingers.map((f) => weight[f.kind]), 1]
    if (!this.hasPose || this.reduceMotion) {
      this.current.set(solved)
      this.hasPose = true
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
      const a = 1 - Math.exp(-dt / 0.06)
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
    }
    this.draw()
    if (moving) this.kick()
  }

  private draw() {
    if (!this.loaded || !this.hasPose) return
    const pose = forward(rig, this.current, 1000, true)
    for (const [name, j] of Object.entries(pose.joints)) {
      const b = this.bones[name]
      if (!b) continue
      b.position.set(j.p[0] / 1000, j.p[1] / 1000, j.p[2] / 1000)
      b.quaternion.set(j.q[0], j.q[1], j.q[2], j.q[3])
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.materials.forEach((m) => m.dispose())
    this.renderer.dispose()
  }
}
