import { Display, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import type { SimulationController } from '../core/SimulationController'
import { attachDragListener } from '../interactions/DragController'
import { pourStreamOpacity } from '../animations/PourAnimation'
import { ContainerNode } from './ContainerNode'
import { ParticleSystem } from './ParticleSystem'
import { temperatureSpread } from '../animations/HeatTransferAnimation'

export class LaboratoryScene {
  private readonly host: HTMLElement
  private readonly controller: SimulationController
  private readonly display: Display
  private readonly root: Node
  private readonly bench: Node
  private readonly benchTop: Rectangle
  private readonly backsplash: Rectangle
  private readonly mixZone: Rectangle
  private readonly hint: Text
  private readonly stream: Path
  private readonly particles = new ParticleSystem(14)
  private readonly vesselLayer = new Node()
  private readonly nodes = new Map<string, ContainerNode>()
  private readonly unsubscribe: () => void
  private width = 800
  private height = 480
  private draggingIds = new Set<string>()
  private disposed = false

  constructor(host: HTMLElement, controller: SimulationController) {
    this.host = host
    this.controller = controller
    this.root = new Node()
    this.backsplash = new Rectangle(0, 0, this.width, this.height, {
      fill: '#f7f9fc',
    })
    this.benchTop = new Rectangle(0, this.height * 0.72, this.width, this.height * 0.28, {
      fill: '#e9eef5',
    })
    const edge = new Rectangle(0, this.height * 0.72, this.width, 10, {
      fill: '#cbd5e1',
    })
    this.mixZone = new Rectangle(0, 0, 220, 150, 18, 18, {
      fill: 'rgba(59, 130, 246, 0.045)',
      stroke: 'rgba(59, 130, 246, 0.20)',
      lineWidth: 2,
    })
    this.hint = new Text('', {
      font: '600 12px Inter, "Segoe UI", system-ui, sans-serif',
      fill: '#64748b',
    })
    this.stream = new Path(null, {
      stroke: '#3b82f6',
      lineWidth: 6,
      lineCap: 'round',
      opacity: 0,
      pickable: false,
    })

    this.bench = new Node({
      children: [this.backsplash, this.benchTop, edge, this.mixZone, this.hint],
    })

    this.root.children = [this.bench, this.vesselLayer, this.stream, this.particles.node]

    this.display = new Display(this.root, {
      container: host,
      listenToOnlyElement: true,
      width: this.width,
      height: this.height,
      backgroundColor: '#f7f9fc',
    })
    this.display.initializeEvents()
    this.display.updateOnRequestAnimationFrame((dt: number) => {
      if (this.disposed) {
        return
      }
      this.controller.step(dt)
      this.syncVisuals(dt)
      this.display.updateDisplay()
    })

    this.unsubscribe = this.controller.subscribeScene(() => {
      this.reconcileContainers()
    })
    this.resize()
    this.reconcileContainers()
  }

  resize(): void {
    const rect = this.host.getBoundingClientRect()
    this.width = Math.max(1, Math.floor(rect.width))
    this.height = Math.max(260, Math.floor(rect.height))
    this.display.width = this.width
    this.display.height = this.height
    this.layoutBench()
    this.layoutContainers()
  }

  dispose(): void {
    this.disposed = true
    this.unsubscribe()
    this.particles.dispose()
    this.display.dispose()
    this.host.replaceChildren()
  }

  private layoutBench(): void {
    this.backsplash.setRect(0, 0, this.width, this.height)
    const top = this.height * 0.7
    this.benchTop.setRect(0, top, this.width, this.height - top)
    const edge = this.bench.children[2] as Rectangle
    edge.setRect(0, top, this.width, 12)

    // Faz a zona de transferência acompanhar dinamicamente o centro e a largura disponível
    const mixWidth = Math.min(320, this.width * 0.4);
    this.mixZone.setRect(this.width / 2 - mixWidth / 2, top - 170, mixWidth, 150)
    this.hint.string = 'Zona de transferência'
    this.hint.centerX = this.width / 2
    this.hint.y = top - 178
  }

  private layoutContainers(): void {
    const snapshot = this.controller.getSnapshot()
    for (const container of snapshot.containers) {
      const node = this.nodes.get(container.id)
      if (!node) {
        continue
      }
      node.x = container.nx * this.width
      node.y = container.ny * this.height
      this.clampNode(node)
    }
  }

  private reconcileContainers(): void {
    const snapshot = this.controller.getSnapshot()
    const liveIds = new Set(snapshot.containers.map((container) => container.id))

    for (const [id, node] of this.nodes) {
      if (!liveIds.has(id)) {
        this.vesselLayer.removeChild(node)
        this.nodes.delete(id)
      }
    }

    for (const container of snapshot.containers) {
      if (!this.nodes.has(container.id)) {
        const node = new ContainerNode(container.id)
        attachDragListener({
          node,
          controller: this.controller,
          getBounds: () => this.dragBounds(),
          getAllNodes: () => [...this.nodes.values()],
          getSize: () => ({ width: this.width, height: this.height }),
        })
        this.nodes.set(container.id, node)
        this.vesselLayer.addChild(node)
        node.x = container.nx * this.width
        node.y = container.ny * this.height
      }
    }
  }

  private syncVisuals(dt: number): void {
    const snapshot = this.controller.getSnapshot()
    for (const container of snapshot.containers) {
      const node = this.nodes.get(container.id)
      if (!node) {
        continue
      }
      node.updateFromState(
        container,
        snapshot.selectedId === container.id,
        snapshot.dropTargetId === container.id,
        this.draggingIds.has(container.id),
        snapshot.pour,
      )
    }

    this.updateStream(snapshot.pour?.sourceId ?? null, snapshot.pour?.targetId ?? null, snapshot.pour?.progress ?? 0)

    const exchanging = snapshot.phase === 'exchanging' || snapshot.phase === 'paused'
    const activeContainer = snapshot.containers.find((container) => container.contents.length > 1 && temperatureSpread(container.contents) > 0.2)
    const warmWater = activeContainer?.contents.some((sample) => sample.materialId === 'water' && sample.temperatureC >= 40)
    if (exchanging && activeContainer && warmWater && !snapshot.reducedMotion) {
      const node = this.nodes.get(activeContainer.id)
      if (node) {
        this.particles.step(dt, true, node.x - 16, node.y - 78, node.x + 16, node.y - 45, '#f97316')
      }
    } else {
      this.particles.step(dt, false, 0, 0, 0, 0, '#f97316')
    }
  }

  private updateStream(sourceId: string | null, targetId: string | null, progress: number): void {
    if (!sourceId || !targetId || progress <= 0) {
      this.stream.opacity = 0
      return
    }
    const source = this.nodes.get(sourceId)
    const target = this.nodes.get(targetId)
    if (!source || !target) {
      this.stream.opacity = 0
      return
    }
    const shape = new Shape()
      .moveTo(source.x + 28, source.y - 118)
      .quadraticCurveTo((source.x + target.x) / 2, Math.min(source.y, target.y) - 160, target.x, target.y - 120)
    this.stream.shape = shape
    this.stream.opacity = pourStreamOpacity(progress)
  }

  private dragBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return {
      minX: 40,
      maxX: this.width - 40, // Permite chegar até a borda direita
      minY: 150,
      maxY: this.height - 36,
    }
  }

  private clampNode(node: ContainerNode): void {
    const bounds = this.dragBounds()
    node.x = Math.min(bounds.maxX, Math.max(bounds.minX, node.x))
    node.y = Math.min(bounds.maxY, Math.max(bounds.minY, node.y))
  }
}
