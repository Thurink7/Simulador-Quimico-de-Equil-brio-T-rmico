import { getMaterial, type MaterialId } from './materials'

export interface ThermalMass {
  materialId: MaterialId
  massKg: number
  temperatureC: number
}

export interface EquilibriumResult {
  equilibriumTemperatureC: number
  heatTransferredJ: number
  formula: string
  substitution: string
  explanation: string
  sampleEquilibrium: ThermalMass[]
}

function heatCapacity(sample: ThermalMass): number {
  return sample.massKg * getMaterial(sample.materialId).specificHeatJPerKgC
}

export function computeEquilibrium(samples: readonly ThermalMass[]): EquilibriumResult | null {
  const valid = samples.filter((sample) => sample.massKg > 0)
  if (valid.length === 0) {
    return null
  }

  const totalC = valid.reduce((sum, sample) => sum + heatCapacity(sample), 0)
  if (totalC <= 0) {
    return null
  }

  const energy = valid.reduce(
    (sum, sample) => sum + heatCapacity(sample) * sample.temperatureC,
    0,
  )
  const te = energy / totalC

  const first = valid[0]
  const qFirst = heatCapacity(first) * (te - first.temperatureC)
  const heatTransferredJ = Math.abs(qFirst)

  const sameMaterial = valid.every((sample) => sample.materialId === first.materialId)
  const formula = sameMaterial
    ? 'T_e = (m₁ T₁ + m₂ T₂ + …) / (m₁ + m₂ + …)'
    : 'T_e = (m₁ c₁ T₁ + m₂ c₂ T₂ + …) / (m₁ c₁ + m₂ c₂ + …)'

  const substitution = buildSubstitution(valid, te, sameMaterial)
  const explanation = buildExplanation(valid, te, heatTransferredJ, sameMaterial)

  return {
    equilibriumTemperatureC: te,
    heatTransferredJ,
    formula,
    substitution,
    explanation,
    sampleEquilibrium: valid.map((sample) => ({ ...sample, temperatureC: te })),
  }
}

function buildSubstitution(
  samples: readonly ThermalMass[],
  te: number,
  sameMaterial: boolean,
): string {
  const numerParts = samples.map((sample) => {
    const m = formatNumber(sample.massKg)
    const t = formatNumber(sample.temperatureC)
    if (sameMaterial) {
      return `(${m} kg)(${t} °C)`
    }
    const c = getMaterial(sample.materialId).specificHeatJPerKgC
    return `(${m} kg)(${c} J/kg·°C)(${t} °C)`
  })

  const denomParts = samples.map((sample) => {
    const m = formatNumber(sample.massKg)
    if (sameMaterial) {
      return `${m} kg`
    }
    const c = getMaterial(sample.materialId).specificHeatJPerKgC
    return `(${m} kg)(${c} J/kg·°C)`
  })

  return `T_e = [${numerParts.join(' + ')}] / [${denomParts.join(' + ')}] = ${formatNumber(te)} °C`
}

function buildExplanation(
  samples: readonly ThermalMass[],
  te: number,
  heatTransferredJ: number,
  sameMaterial: boolean,
): string {
  if (samples.length === 1) {
    return 'Há apenas um material no recipiente, portanto a temperatura permanece a temperatura inicial.'
  }

  const names = samples.map((sample) => getMaterial(sample.materialId).name).join(' e ')
  if (sameMaterial) {
    return `Ao misturar porções do mesmo material, a capacidade térmica específica cancela-se. A temperatura de equilíbrio é a média ponderada pelas massas, T_e = ${formatNumber(te)} °C. O calor trocado entre as porções é ${formatEnergy(heatTransferredJ)}.`
  }

  return `Os materiais (${names}) entram em contacto térmico. Conservando a energia, Q_ganho = −Q_perda, obtém-se T_e = ${formatNumber(te)} °C. A quantidade de calor transferida entre os corpos é ${formatEnergy(heatTransferredJ)}.`
}

export function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits).replace(/\.0$/, (match) => (digits === 1 ? match.replace('.0', '') : match))
}

export function formatEnergy(joules: number): string {
  if (Math.abs(joules) >= 1000) {
    return `${(joules / 1000).toFixed(2)} kJ`
  }
  return `${joules.toFixed(0)} J`
}

export function formatTemperature(value: number): string {
  return `${value.toFixed(1)} °C`
}

export function formatMassGrams(massKg: number): string {
  return `${Math.round(massKg * 1000)} g`
}
