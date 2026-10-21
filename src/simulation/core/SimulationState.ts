import type { ThermalMass } from '../../physics/calorimetry'
import type { MaterialId } from '../../physics/materials'

export type ExperimentPhase =
  | 'idle'
  | 'pouring'
  | 'exchanging'
  | 'paused'
  | 'equilibrium'

export interface ContainerState {
  id: string
  label: string
  contents: ThermalMass[]
  nx: number
  ny: number
}

export interface PhysicsResults {
  equilibriumTemperatureC: number
  heatTransferredJ: number
  formula: string
  substitution: string
  explanation: string
  containerId: string
}

export interface SimulationSnapshot {
  containers: ContainerState[]
  phase: ExperimentPhase
  selectedId: string | null
  dropTargetId: string | null
  interactionHint: string | null
  results: PhysicsResults | null
  pour: PourState | null
  reducedMotion: boolean
}

export interface PourState {
  sourceId: string
  targetId: string
  kind: 'pour' | 'place' | 'move'
  progress: number
}

export interface ContainerConfigInput {
  materialId: MaterialId
  massKg: number
  temperatureC: number
}

export function cloneSnapshot(snapshot: SimulationSnapshot): SimulationSnapshot {
  return {
    ...snapshot,
    containers: snapshot.containers.map((container) => ({
      ...container,
      contents: container.contents.map((sample) => ({ ...sample })),
    })),
    results: snapshot.results ? { ...snapshot.results } : null,
    pour: snapshot.pour ? { ...snapshot.pour } : null,
  }
}

export function totalMassKg(container: ContainerState): number {
  return container.contents.reduce((sum, sample) => sum + sample.massKg, 0)
}

export function primaryMaterial(container: ContainerState): MaterialId | null {
  if (container.contents.length === 0) {
    return null
  }
  return [...container.contents].sort((a, b) => b.massKg - a.massKg)[0].materialId
}

export function displayTemperature(container: ContainerState): number | null {
  if (container.contents.length === 0) {
    return null
  }
  const mass = totalMassKg(container)
  if (mass <= 0) {
    return container.contents[0].temperatureC
  }
  return container.contents.reduce(
    (sum, sample) => sum + sample.temperatureC * sample.massKg,
    0,
  ) / mass
}
