import { assessTransfer } from '../../physics/mixingRules'
import type { SimulationController } from '../core/SimulationController'
import { BEAKER_WIDTH } from '../../assets/containers/beakerGeometry'
import type { ContainerNode } from '../scene/ContainerNode'

export function findValidDropTarget(
  controller: SimulationController,
  source: ContainerNode,
  others: ContainerNode[],
): { target: ContainerNode; reason: string } | null {
  const snapshot = controller.getSnapshot()
  const sourceState = snapshot.containers.find((container) => container.id === source.containerId)
  if (!sourceState) {
    return null
  }

  let best: { target: ContainerNode; reason: string; distance: number } | null = null
  const threshold = BEAKER_WIDTH * 1.35

  for (const other of others) {
    const dx = source.x - other.x
    const dy = source.y - other.y
    const distance = Math.hypot(dx, dy)
    if (distance > threshold) {
      continue
    }
    const destState = snapshot.containers.find((container) => container.id === other.containerId)
    if (!destState) {
      continue
    }
    const assessment = assessTransfer(sourceState.contents, destState.contents)
    if (!assessment.valid) {
      continue
    }
    if (!best || distance < best.distance) {
      best = { target: other, reason: assessment.reason, distance }
    }
  }

  return best ? { target: best.target, reason: best.reason } : null
}

export function findRejectedTarget(
  controller: SimulationController,
  source: ContainerNode,
  others: ContainerNode[],
): string | null {
  const snapshot = controller.getSnapshot()
  const sourceState = snapshot.containers.find((container) => container.id === source.containerId)
  if (!sourceState) {
    return null
  }

  const threshold = BEAKER_WIDTH * 1.35
  for (const other of others) {
    const distance = Math.hypot(source.x - other.x, source.y - other.y)
    if (distance > threshold) {
      continue
    }
    const destState = snapshot.containers.find((container) => container.id === other.containerId)
    if (!destState) {
      continue
    }
    const assessment = assessTransfer(sourceState.contents, destState.contents)
    if (!assessment.valid) {
      return assessment.reason
    }
  }
  return null
}
