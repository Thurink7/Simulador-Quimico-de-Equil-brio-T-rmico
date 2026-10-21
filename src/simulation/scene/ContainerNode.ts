import { Circle, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import {
  BEAKER_HEIGHT,
  BEAKER_WIDTH,
  createBeakerInnerShape,
  createBeakerOuterShape,
} from '../../assets/containers/beakerGeometry'
import { formatMassGrams, formatTemperature } from '../../physics/calorimetry'
import { getMaterial } from '../../physics/materials'
import { pourTiltRadians } from '../animations/PourAnimation'
import type { ContainerState, PourState } from '../core/SimulationState'
import { displayTemperature, primaryMaterial } from '../core/SimulationState'
import { MaterialNode } from './MaterialNode'

export class ContainerNode extends Node {
  readonly containerId: string
  private readonly glass = new Path(createBeakerOuterShape(), {
    fill: 'rgba(226, 232, 240, 0.28)',
    stroke: 'rgba(71, 85, 105, 0.55)',
    lineWidth: 2,
  })
  private readonly innerStroke = new Path(createBeakerInnerShape(), {
    stroke: 'rgba(148, 163, 184, 0.45)',
    lineWidth: 1,
    pickable: false,
  })
  private readonly ticks = new Node({ pickable: false })
  private readonly materialNode = new MaterialNode()
  private readonly labelBadge = new Rectangle(-22, 8, 44, 22, 8, 8, {
    fill: '#111827',
  })
  private readonly labelText = new Text('A', {
    font: '700 13px "Segoe UI", system-ui, sans-serif',
    fill: '#ffffff',
  })
  private readonly tempText = new Text('—', {
    font: '600 12px "Segoe UI", system-ui, sans-serif',
    fill: '#172033',
  })
  private readonly massText = new Text('', {
    font: '12px "Segoe UI", system-ui, sans-serif',
    fill: '#475569',
  })
  private readonly thermometer = new Rectangle(48, -112, 7, 88, 3, 3, {
    fill: '#fff',
    stroke: '#94a3b8',
    lineWidth: 1,
  })
  private readonly thermoFill = new Rectangle(49.5, -40, 4, 14, 2, 2, {
    fill: '#3b82f6',
  })
  private readonly thermoBulb = new Circle(6, {
    x: 51.5,
    y: -18,
    fill: '#3b82f6',
    stroke: '#1d4ed8',
    lineWidth: 1,
  })
  private readonly selection = new Circle(58, {
    fill: 'rgba(59, 130, 246, 0.10)',
    stroke: 'rgba(59, 130, 246, 0.0)',
    lineWidth: 3,
    y: -60,
    pickable: false,
  })
  private readonly shadow = new Circle(36, {
    fill: 'rgba(15, 23, 42, 0.13)',
    y: 10,
    pickable: false,
  })
  private readonly contentsRoot = new Node()

  constructor(containerId: string) {
    super({ cursor: 'grab' })
    this.containerId = containerId

    for (let i = 0; i < 5; i += 1) {
      const y = -24 - i * 20
      this.ticks.addChild(
        new Path(`M -28 ${y} L -18 ${y}`, {
          stroke: 'rgba(100, 116, 139, 0.45)',
          lineWidth: 1,
        }),
      )
    }

    this.labelText.center = this.labelBadge.center

    this.contentsRoot.children = [
      this.materialNode,
      this.glass,
      this.innerStroke,
      this.ticks,
      this.thermometer,
      this.thermoFill,
      this.thermoBulb,
    ]

    this.children = [
      this.shadow,
      this.selection,
      this.contentsRoot,
      this.labelBadge,
      this.labelText,
      this.tempText,
      this.massText,
    ]

    this.tempText.centerX = 0
    this.tempText.y = 46
    this.massText.centerX = 0
    this.massText.y = 62
  }

  get footprintWidth(): number {
    return BEAKER_WIDTH
  }

  get footprintHeight(): number {
    return BEAKER_HEIGHT
  }

  updateFromState(
    container: ContainerState,
    selected: boolean,
    isTarget: boolean,
    dragging: boolean,
    pour: PourState | null,
  ): void {
    this.labelText.string = container.label
    this.labelText.center = this.labelBadge.center

    const temperature = displayTemperature(container)
    this.tempText.string = temperature === null ? 'vazio' : formatTemperature(temperature)
    this.tempText.centerX = 0

    const mass = container.contents.reduce((sum, sample) => sum + sample.massKg, 0)
    const names = container.contents.map((sample) => getMaterial(sample.materialId).name).join(' + ')
    this.massText.string = mass > 0 ? `${names} · ${formatMassGrams(mass)}` : 'Recipiente vazio'
    this.massText.centerX = 0

    const fillScale =
      pour && pour.sourceId === container.id ? Math.max(0.12, 1 - pour.progress) : 1
    this.materialNode.update(container.contents, fillScale)

    const primary = primaryMaterial(container)
    const accent = primary ? getMaterial(primary).color : '#64748b'
    this.labelBadge.fill = selected ? '#111827' : accent

    if (temperature !== null) {
      const t = Math.min(1, Math.max(0, (temperature - 5) / 95))
      const fill = t > 0.55 ? '#f97316' : '#3b82f6'
      this.thermoFill.fill = fill
      this.thermoBulb.fill = fill
      const thermoHeight = 12 + t * 70
      this.thermoFill.setRect(49.5, -22 - thermoHeight, 4, thermoHeight)
    }

    this.selection.stroke = isTarget
      ? 'rgba(34, 197, 94, 0.9)'
      : selected || dragging
        ? 'rgba(59, 130, 246, 0.85)'
        : 'rgba(59, 130, 246, 0)'
    this.selection.fill = isTarget
      ? 'rgba(34, 197, 94, 0.12)'
      : dragging
        ? 'rgba(59, 130, 246, 0.16)'
        : 'rgba(59, 130, 246, 0.0)'
    this.cursor = dragging ? 'grabbing' : 'grab'

    const tilt = pourTiltRadians(pour, pour?.sourceId === container.id)
    this.contentsRoot.rotation = tilt
    this.contentsRoot.x = tilt === 0 ? 0 : 10
  }
}
