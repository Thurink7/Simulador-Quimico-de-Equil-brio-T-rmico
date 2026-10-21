import { Circle, Node, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { getMaterial, type MaterialId } from '../../physics/materials'
import type { ThermalMass } from '../../physics/calorimetry'
import { thermalColor } from '../animations/HeatTransferAnimation'

const INNER_WIDTH = 62
const INNER_BOTTOM = -10
const INNER_TOP = -122
const INNER_HEIGHT = INNER_BOTTOM - INNER_TOP

export class MaterialNode extends Node {
  private readonly liquid = new Rectangle(-INNER_WIDTH / 2, INNER_BOTTOM, INNER_WIDTH, 8, {
    fill: '#3b82f6',
    opacity: 0.88,
  })
  private readonly sandLayer = new Node()
  private readonly copperSlug = new Rectangle(-22, -28, 44, 16, 6, 6, {
    fill: '#d97706',
    stroke: '#92400e',
    lineWidth: 1.5,
  })
  private readonly highlight = new Path(null, {
    fill: 'rgba(255,255,255,0.22)',
    pickable: false,
  })

  constructor() {
    super({ pickable: false })
    this.addChild(this.liquid)
    this.addChild(this.sandLayer)
    this.addChild(this.copperSlug)
    this.addChild(this.highlight)
    this.clipArea = new Shape()
      .moveTo(-30, -126)
      .lineTo(-39, -8)
      .quadraticCurveTo(0, 4, 39, -8)
      .lineTo(30, -126)
      .close()
  }

  update(contents: readonly ThermalMass[], fillScale: number): void {
    const liquids = contents.filter((sample) => {
      const state = getMaterial(sample.materialId).state
      return state === 'liquid' || sample.materialId === 'sand'
    })
    const copper = contents.find((sample) => sample.materialId === 'copper')
    const sand = contents.find((sample) => sample.materialId === 'sand')
    const liquid = liquids.find((sample) => sample.materialId !== 'sand') ?? sand

    const totalMass = contents.reduce((sum, sample) => sum + sample.massKg, 0)
    const height = Math.max(6, INNER_HEIGHT * clamp(totalMass / 1, 0.08, 0.92) * fillScale)

    if (liquid) {
      this.liquid.visible = true
      this.liquid.fill = thermalColor(liquid.temperatureC, getMaterial(liquid.materialId).fillColor)
      this.liquid.setRect(-INNER_WIDTH / 2, INNER_BOTTOM - height, INNER_WIDTH, height)
      this.highlight.shape = new Shape()
        .moveTo(-INNER_WIDTH / 2 + 8, INNER_BOTTOM - height + 10)
        .lineTo(-INNER_WIDTH / 2 + 14, INNER_BOTTOM - 12)
        .lineTo(-INNER_WIDTH / 2 + 20, INNER_BOTTOM - 12)
        .lineTo(-INNER_WIDTH / 2 + 12, INNER_BOTTOM - height + 10)
        .close()
    } else {
      this.liquid.visible = false
      this.highlight.shape = null
    }

    this.copperSlug.visible = Boolean(copper)
    if (copper) {
      this.copperSlug.fill = thermalColor(copper.temperatureC, getMaterial('copper').fillColor)
      this.copperSlug.y = liquid ? INNER_BOTTOM - Math.min(height, 36) - 4 : INNER_BOTTOM - 20
    }

    this.renderSand(sand, height)
  }

  private renderSand(sand: ThermalMass | undefined, height: number): void {
    this.sandLayer.removeAllChildren()
    if (!sand) {
      return
    }
    const color = thermalColor(sand.temperatureC, getMaterial('sand').fillColor)
    for (let i = 0; i < 28; i += 1) {
      const gx = -24 + (i % 7) * 8
      const gy = INNER_BOTTOM - 6 - Math.floor(i / 7) * 6
      if (gy < INNER_BOTTOM - height + 4) {
        continue
      }
      this.sandLayer.addChild(
        new Circle(2.1, {
          x: gx + ((i * 13) % 3) - 1,
          y: gy,
          fill: i % 2 === 0 ? color : '#a16207',
        }),
      )
    }
  }
}

export function materialAccent(id: MaterialId): string {
  return getMaterial(id).color
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
