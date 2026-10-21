import { DragListener } from 'scenerystack/scenery'
import type { SimulationController } from '../core/SimulationController'
import { findRejectedTarget, findValidDropTarget } from './MixingController'
import type { ContainerNode } from '../scene/ContainerNode'

export interface DragBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function attachDragListener(options: {
  node: ContainerNode
  controller: SimulationController
  getBounds: () => DragBounds
  getAllNodes: () => ContainerNode[]
  getSize: () => { width: number; height: number }
}): DragListener {
  const { node, controller, getBounds, getAllNodes, getSize } = options
  const listener = new DragListener({
    targetNode: node,
    allowTouchSnag: true,
    start: () => {
      node.moveToFront()
      controller.selectContainer(node.containerId)
      node.cursor = 'grabbing'
    },
    drag: (_event, dragListener) => {
      const delta = dragListener.modelDelta
      node.x += delta.x
      node.y += delta.y
      const bounds = getBounds()
      node.x = Math.min(bounds.maxX, Math.max(bounds.minX, node.x))
      node.y = Math.min(bounds.maxY, Math.max(bounds.minY, node.y))

      const size = getSize()
      if (size.width > 0 && size.height > 0) {
        controller.setContainerPosition(node.containerId, node.x / size.width, node.y / size.height)
      }

      const others = getAllNodes().filter((item) => item.containerId !== node.containerId)
      const valid = findValidDropTarget(controller, node, others)
      if (valid) {
        controller.setDropTarget(valid.target.containerId, valid.reason)
      } else {
        const rejected = findRejectedTarget(controller, node, others)
        controller.setDropTarget(null, rejected ?? 'Solte sobre um recipiente válido para transferir.')
      }
    },
    end: () => {
      node.cursor = 'grab'
      const others = getAllNodes().filter((item) => item.containerId !== node.containerId)
      const valid = findValidDropTarget(controller, node, others)
      if (valid) {
        controller.requestTransfer(node.containerId, valid.target.containerId)
      } else {
        controller.setDropTarget(null)
      }
    },
  })

  node.addInputListener(listener)
  return listener
}
