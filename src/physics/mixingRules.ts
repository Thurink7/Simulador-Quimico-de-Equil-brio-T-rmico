import { getMaterial, isLiquid, type MaterialId } from './materials'
import type { ThermalMass } from './calorimetry'

export type TransferKind = 'pour' | 'place' | 'move'

export interface TransferAssessment {
  valid: boolean
  kind: TransferKind | 'none'
  reason: string
}

export function canCoexist(a: MaterialId, b: MaterialId): boolean {
  if (a === b) {
    return true
  }
  if (isLiquid(a) && isLiquid(b)) {
    return false
  }
  return true
}

export function assessTransfer(
  source: readonly ThermalMass[],
  destination: readonly ThermalMass[],
): TransferAssessment {
  if (source.length === 0) {
    return {
      valid: false,
      kind: 'none',
      reason: 'O recipiente de origem está vazio.',
    }
  }

  if (destination.length === 0) {
    const pourable = source.every((sample) => getMaterial(sample.materialId).pourable)
    return {
      valid: true,
      kind: pourable ? 'move' : 'place',
      reason: 'O recipiente de destino está vazio.',
    }
  }

  for (const src of source) {
    for (const dest of destination) {
      if (!canCoexist(src.materialId, dest.materialId)) {
        const srcName = getMaterial(src.materialId).name
        const destName = getMaterial(dest.materialId).name
        return {
          valid: false,
          kind: 'none',
          reason: `${srcName} e ${destName} são líquidos imiscíveis. A sobreposição visual não realiza a mistura.`,
        }
      }
    }
  }

  const sourcePourable = source.every((sample) => getMaterial(sample.materialId).pourable)
  const destinationHasLiquid = destination.some((sample) => isLiquid(sample.materialId))
  const sourceHasSolid = source.some((sample) => !getMaterial(sample.materialId).pourable)

  if (sourceHasSolid && destinationHasLiquid) {
    return {
      valid: true,
      kind: 'place',
      reason: 'O sólido será colocado em contacto térmico com o líquido, sem se dissolver.',
    }
  }

  return {
    valid: true,
    kind: sourcePourable ? 'pour' : 'place',
    reason: 'Transferência permitida pelo modelo físico.',
  }
}

export function mergeSamples(samples: readonly ThermalMass[]): ThermalMass[] {
  const byId = new Map<MaterialId, ThermalMass[]>()
  for (const sample of samples) {
    const list = byId.get(sample.materialId) ?? []
    list.push(sample)
    byId.set(sample.materialId, list)
  }

  const merged: ThermalMass[] = []
  for (const [materialId, group] of byId) {
    const massKg = group.reduce((sum, sample) => sum + sample.massKg, 0)
    const energy = group.reduce((sum, sample) => {
      const c = getMaterial(sample.materialId).specificHeatJPerKgC
      return sum + sample.massKg * c * sample.temperatureC
    }, 0)
    const c = getMaterial(materialId).specificHeatJPerKgC
    const temperatureC = massKg > 0 && c > 0 ? energy / (massKg * c) : group[0].temperatureC
    merged.push({ materialId, massKg, temperatureC })
  }
  return merged
}
