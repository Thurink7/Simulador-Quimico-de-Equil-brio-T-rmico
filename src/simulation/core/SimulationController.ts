import { computeEquilibrium } from '../../physics/calorimetry'
import { getMaterial, type MaterialId } from '../../physics/materials'
import { assessTransfer, mergeSamples } from '../../physics/mixingRules'
import {
  cloneSnapshot,
  type ContainerConfigInput,
  type ContainerState,
  type ExperimentPhase,
  type SimulationSnapshot,
} from './SimulationState'

const MAX_CONTAINERS = 3
const MIN_CONTAINERS = 2
const EXCHANGE_RATE = 1.35
const POUR_DURATION_S = 1.15
const TEMP_EPSILON = 0.04

const LABELS = ['A', 'B', 'C']

function createDefaultSnapshot(): SimulationSnapshot {
  return {
    containers: [
      {
        id: 'beaker-a',
        label: 'A',
        contents: [{ materialId: 'water', massKg: 0.25, temperatureC: 80 }],
        nx: 0.28,
        ny: 0.62,
      },
      {
        id: 'beaker-b',
        label: 'B',
        contents: [{ materialId: 'water', massKg: 0.25, temperatureC: 20 }],
        nx: 0.72,
        ny: 0.62,
      },
    ],
    phase: 'idle',
    selectedId: null,
    dropTargetId: null,
    interactionHint: 'Arraste um recipiente até outro para transferir material.',
    results: null,
    pour: null,
    reducedMotion: false,
    mixingDurationS: 5,
    temperatureSeries: [],
    temperatureHistory: [],
  }
}

export class SimulationController {
  private snapshot: SimulationSnapshot
  private baseline: SimulationSnapshot
  private uiListeners = new Set<(snapshot: SimulationSnapshot) => void>()
  private sceneListeners = new Set<() => void>()
  private pendingContents: { sourceId: string; targetId: string } | null = null
  private uiAcc = 0
  private exchangeTimeS = 0
  private exchangeRate = EXCHANGE_RATE

  constructor() {
    this.snapshot = createDefaultSnapshot()
    this.baseline = cloneSnapshot(this.snapshot)
  }

  getSnapshot(): SimulationSnapshot {
    return cloneSnapshot(this.snapshot)
  }

  subscribeUi(listener: (snapshot: SimulationSnapshot) => void): () => void {
    this.uiListeners.add(listener)
    listener(this.getSnapshot())
    return () => {
      this.uiListeners.delete(listener)
    }
  }

  subscribeScene(listener: () => void): () => void {
    this.sceneListeners.add(listener)
    return () => {
      this.sceneListeners.delete(listener)
    }
  }

  setReducedMotion(value: boolean): void {
    if (this.snapshot.reducedMotion === value) {
      return
    }
    this.snapshot.reducedMotion = value
    this.notifyScene()
  }

  setMixingDurationS(value: number): void {
    if (this.isBusy()) return
    this.snapshot.mixingDurationS = clamp(value, 0.5, 12)
    this.notifyUi()
  }

  selectContainer(id: string | null): void {
    if (this.snapshot.selectedId === id) {
      return
    }
    this.snapshot.selectedId = id
    this.notifyUi()
    this.notifyScene()
  }

  setDropTarget(id: string | null, hint?: string | null): void {
    if (this.snapshot.dropTargetId === id && (hint === undefined || hint === this.snapshot.interactionHint)) {
      return
    }
    this.snapshot.dropTargetId = id
    if (hint !== undefined) {
      this.snapshot.interactionHint = hint
    }
    this.notifyUi()
    this.notifyScene()
  }

  setContainerPosition(id: string, nx: number, ny: number): void {
    const container = this.findContainer(id)
    if (!container) {
      return
    }
    container.nx = nx
    container.ny = ny
    this.notifyScene()
  }

  setMaterial(containerId: string, materialId: MaterialId): void {
    if (!this.beginEdit()) {
      return
    }
    const container = this.findContainer(containerId)
    if (!container) {
      return
    }
    const material = getMaterial(materialId)
    const previous = container.contents
    const massKg = previous.reduce((sum, sample) => sum + sample.massKg, 0) || 0.2
    const previousMass = previous.reduce((sum, sample) => sum + sample.massKg, 0)
    let temperatureC = previousMass > 0
      ? previous.reduce((sum, sample) => sum + sample.massKg * sample.temperatureC, 0) / previousMass
      : 25
    temperatureC = clamp(temperatureC, material.minTempC, material.maxTempC)
    container.contents = [{ materialId, massKg, temperatureC }]
    this.captureBaseline()
    this.notifyAll()
  }

  setMassKg(containerId: string, massKg: number): void {
    if (!this.beginEdit()) {
      return
    }
    const container = this.findContainer(containerId)
    if (!container || container.contents.length === 0) {
      return
    }
    const clamped = clamp(massKg, 0.05, 1)
    if (container.contents.length === 1) {
      container.contents[0].massKg = clamped
    } else {
      const total = container.contents.reduce((sum, sample) => sum + sample.massKg, 0)
      const scale = total > 0 ? clamped / total : 1
      container.contents = container.contents.map((sample) => ({
        ...sample,
        massKg: sample.massKg * scale,
      }))
    }
    this.captureBaseline()
    this.notifyAll()
  }

  setTemperatureC(containerId: string, temperatureC: number): void {
    if (!this.beginEdit()) {
      return
    }
    const container = this.findContainer(containerId)
    if (!container || container.contents.length === 0) {
      return
    }
    container.contents = container.contents.map((sample) => {
      const material = getMaterial(sample.materialId)
      return {
        ...sample,
        temperatureC: clamp(temperatureC, material.minTempC, material.maxTempC),
      }
    })
    this.captureBaseline()
    this.notifyAll()
  }

  addContainer(): void {
    if (!this.beginEdit() || this.snapshot.containers.length >= MAX_CONTAINERS) {
      return
    }
    const index = this.snapshot.containers.length
    const id = `beaker-${LABELS[index].toLowerCase()}`
    this.snapshot.containers.push({
      id,
      label: LABELS[index],
      contents: [{ materialId: 'copper', massKg: 0.2, temperatureC: 100 }],
      nx: 0.5,
      ny: 0.38,
    })
    this.captureBaseline()
    this.notifyAll()
  }

  removeContainer(containerId: string): void {
    if (!this.beginEdit() || this.snapshot.containers.length <= MIN_CONTAINERS) {
      return
    }
    this.snapshot.containers = this.snapshot.containers.filter((container) => container.id !== containerId)
    if (this.snapshot.selectedId === containerId) {
      this.snapshot.selectedId = null
    }
    this.captureBaseline()
    this.notifyAll()
  }

  emptyContainer(containerId: string): void {
    if (!this.beginEdit()) {
      return
    }
    const container = this.findContainer(containerId)
    if (!container) {
      return
    }
    container.contents = []
    this.captureBaseline()
    this.notifyAll()
  }

  configureContainer(containerId: string, input: ContainerConfigInput): void {
    if (!this.beginEdit()) {
      return
    }
    const container = this.findContainer(containerId)
    if (!container) {
      return
    }
    const material = getMaterial(input.materialId)
    container.contents = [
      {
        materialId: input.materialId,
        massKg: clamp(input.massKg, 0.05, 1),
        temperatureC: clamp(input.temperatureC, material.minTempC, material.maxTempC),
      },
    ]
    this.captureBaseline()
    this.notifyAll()
  }

  requestTransfer(sourceId: string, targetId: string): boolean {
    if (sourceId === targetId) {
      return false
    }
    if (this.snapshot.phase === 'pouring' || this.snapshot.phase === 'exchanging') {
      return false
    }
    if (this.snapshot.phase === 'paused') {
      return false
    }

    const source = this.findContainer(sourceId)
    const target = this.findContainer(targetId)
    if (!source || !target) {
      return false
    }

    const assessment = assessTransfer(source.contents, target.contents)
    if (!assessment.valid || assessment.kind === 'none') {
      this.snapshot.interactionHint = assessment.reason
      this.snapshot.dropTargetId = null
      this.notifyUi()
      this.notifyScene()
      return false
    }

    this.pendingContents = { sourceId, targetId }
    this.beginTemperatureTrace(source, target)
    this.snapshot.pour = {
      sourceId,
      targetId,
      kind: assessment.kind,
      progress: 0,
    }
    this.snapshot.phase = 'pouring'
    this.snapshot.interactionHint = assessment.reason
    this.snapshot.dropTargetId = targetId
    this.snapshot.results = null

    this.notifyAll()
    return true
  }

  pause(): void {
    if (this.snapshot.phase === 'exchanging') {
      this.snapshot.phase = 'paused'
      this.notifyUi()
      this.notifyScene()
    }
  }

  resume(): void {
    if (this.snapshot.phase === 'paused') {
      this.snapshot.phase = 'exchanging'
      this.notifyUi()
      this.notifyScene()
    }
  }

  reset(): void {
    const reduced = this.snapshot.reducedMotion
    const mixingDurationS = this.snapshot.mixingDurationS
    this.snapshot = cloneSnapshot(this.baseline)
    this.snapshot.reducedMotion = reduced
    this.snapshot.mixingDurationS = mixingDurationS
    this.snapshot.phase = 'idle'
    this.snapshot.pour = null
    this.snapshot.results = null
    this.snapshot.dropTargetId = null
    this.snapshot.selectedId = null
    this.snapshot.interactionHint = 'Experimento reiniciado. Arraste um recipiente até outro.'
    this.pendingContents = null
    this.exchangeTimeS = 0
    this.uiAcc = 0
    this.notifyAll()
  }

  step(dt: number): void {
    if (this.snapshot.phase === 'pouring' && this.snapshot.pour) {
      const duration = this.snapshot.reducedMotion ? 0.01 : POUR_DURATION_S
      this.snapshot.pour.progress = Math.min(1, this.snapshot.pour.progress + dt / duration)
      if (this.snapshot.pour.progress >= 1) {
        this.completePour()
      }
      this.notifyScene()
      return
    }

    if (this.snapshot.phase !== 'exchanging') {
      return
    }
    this.exchangeTimeS += dt

    let reached = true
    for (const container of this.snapshot.containers) {
      if (container.contents.length < 2) {
        continue
      }
      const result = computeEquilibrium(container.contents)
      if (!result) {
        continue
      }
      for (const sample of container.contents) {
        const next =
          sample.temperatureC +
          (result.equilibriumTemperatureC - sample.temperatureC) * (1 - Math.exp(-this.exchangeRate * dt))
        sample.temperatureC = next
        if (Math.abs(sample.temperatureC - result.equilibriumTemperatureC) > TEMP_EPSILON) {
          reached = false
        } else {
          sample.temperatureC = result.equilibriumTemperatureC
        }
      }
    }

    if (reached) {
      this.finishEquilibrium()
      return
    }

    this.notifyScene()
    this.uiAcc += dt
    if (this.uiAcc >= 0.05) {
      this.uiAcc = 0
      const active = this.snapshot.containers.find((container) => container.id === this.snapshot.results?.containerId)
      if (active) this.appendTemperaturePoint(this.exchangeTimeS, active.contents.map((sample) => sample.temperatureC))
      this.notifyUi()
    }
  }

  canEdit(): boolean {
    return this.snapshot.phase === 'idle' || this.snapshot.phase === 'equilibrium'
  }

  isBusy(): boolean {
    return this.snapshot.phase === 'pouring' || this.snapshot.phase === 'exchanging' || this.snapshot.phase === 'paused'
  }

  private completePour(): void {
    if (!this.pendingContents) {
      this.snapshot.pour = null
      this.snapshot.phase = 'idle'
      return
    }

    const source = this.findContainer(this.pendingContents.sourceId)
    const target = this.findContainer(this.pendingContents.targetId)
    this.pendingContents = null
    this.snapshot.pour = null
    this.snapshot.dropTargetId = null

    if (!source || !target) {
      this.snapshot.phase = 'idle'
      return
    }

    // Keep samples separate while exchanging so equal materials can still reach
    // equilibrium visibly and retain the initial energy transfer for results.
    const combined = [...target.contents, ...source.contents].map((sample) => ({ ...sample }))
    target.contents = combined
    source.contents = []

    if (target.contents.length >= 2) {
      const preview = computeEquilibrium(target.contents)
      this.snapshot.phase = 'exchanging'
      if (preview) {
        const maxDeviation = Math.max(...target.contents.map((sample) => Math.abs(sample.temperatureC - preview.equilibriumTemperatureC)))
        this.exchangeRate = maxDeviation > TEMP_EPSILON
          ? Math.log(maxDeviation / TEMP_EPSILON) / this.snapshot.mixingDurationS
          : EXCHANGE_RATE
        this.snapshot.results = {
          ...preview,
          containerId: target.id,
          initialSamples: target.contents.map((sample) => ({ ...sample })),
        }
      }
      this.snapshot.interactionHint = preview?.explanation ?? 'A troca de calor está em curso.'
      this.notifyAll()
      return
    }

    const result = computeEquilibrium(target.contents)
    if (result && source) {
      this.snapshot.results = {
        ...result,
        containerId: target.id,
        initialSamples: target.contents.map((sample) => ({ ...sample })),
      }
      this.snapshot.phase = 'equilibrium'
      this.snapshot.interactionHint = result.explanation
      this.appendTemperaturePoint(0, result.sampleEquilibrium.map((sample) => sample.temperatureC))
    } else {
      this.snapshot.phase = 'idle'
    }
    this.notifyAll()
  }

  private finishEquilibrium(): void {
    const container = this.snapshot.containers.find((item) => item.contents.length >= 2)
    if (container) {
      const result = computeEquilibrium(container.contents)
      if (result) {
        container.contents = mergeSamples(result.sampleEquilibrium)
        this.snapshot.results = this.snapshot.results?.containerId === container.id
          ? { ...this.snapshot.results }
          : { ...result, containerId: container.id, initialSamples: container.contents.map((sample) => ({ ...sample })) }
        this.snapshot.interactionHint = result.explanation
        this.appendTemperaturePoint(this.exchangeTimeS, result.sampleEquilibrium.map((sample) => sample.temperatureC))
      }
    }
    this.snapshot.phase = 'equilibrium'
    this.notifyAll()
  }

  private findContainer(id: string): ContainerState | undefined {
    return this.snapshot.containers.find((container) => container.id === id)
  }

  private captureBaseline(): void {
    if (this.snapshot.phase === 'idle') {
      this.baseline = cloneSnapshot(this.snapshot)
    }
  }

  private beginEdit(): boolean {
    if (!this.canEdit()) {
      return false
    }
    if (this.snapshot.phase === 'equilibrium') {
      this.snapshot.phase = 'idle'
      this.snapshot.results = null
      this.snapshot.pour = null
      this.snapshot.interactionHint = 'Parâmetros atualizados. Ajuste as amostras ou inicie uma nova transferência.'
      this.snapshot.temperatureSeries = []
      this.snapshot.temperatureHistory = []
      this.exchangeTimeS = 0
    }
    return true
  }

  private beginTemperatureTrace(source: ContainerState, target: ContainerState): void {
    const entries = [
      ...target.contents.map((sample) => ({ container: target, sample })),
      ...source.contents.map((sample) => ({ container: source, sample })),
    ]
    this.snapshot.temperatureSeries = entries.map(({ container, sample }, index) => ({
      id: `${container.id}-${sample.materialId}-${index}`,
      label: `${container.label} · ${getMaterial(sample.materialId).shortName}`,
      materialId: sample.materialId,
      initialTemperatureC: sample.temperatureC,
    }))
    this.snapshot.temperatureHistory = [{ timeS: 0, temperaturesC: entries.map(({ sample }) => sample.temperatureC) }]
    this.exchangeTimeS = 0
    this.uiAcc = 0
  }

  private appendTemperaturePoint(timeS: number, temperaturesC: number[]): void {
    const last = this.snapshot.temperatureHistory[this.snapshot.temperatureHistory.length - 1]
    if (last && Math.abs(last.timeS - timeS) < 1e-6) {
      this.snapshot.temperatureHistory[this.snapshot.temperatureHistory.length - 1] = { timeS, temperaturesC: [...temperaturesC] }
      return
    }
    this.snapshot.temperatureHistory.push({ timeS, temperaturesC: [...temperaturesC] })
  }

  private notifyUi(): void {
    const copy = this.getSnapshot()
    for (const listener of this.uiListeners) {
      listener(copy)
    }
  }

  private notifyScene(): void {
    for (const listener of this.sceneListeners) {
      listener()
    }
  }

  private notifyAll(): void {
    this.notifyUi()
    this.notifyScene()
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function phaseLabel(phase: ExperimentPhase): string {
  switch (phase) {
    case 'idle':
      return 'Pronto'
    case 'pouring':
      return 'Transferência'
    case 'exchanging':
      return 'Troca de calor'
    case 'paused':
      return 'Pausado'
    case 'equilibrium':
      return 'Concluído'
    default:
      return phase
  }
}
