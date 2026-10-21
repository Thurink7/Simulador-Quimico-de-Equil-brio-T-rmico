export const MATERIAL_IDS = ['water', 'copper', 'sand', 'oil'] as const

export type MaterialId = (typeof MATERIAL_IDS)[number]

export type PhysicalState = 'liquid' | 'solid' | 'granular'

export interface MaterialDefinition {
  id: MaterialId
  name: string
  shortName: string
  specificHeatJPerKgC: number
  state: PhysicalState
  color: string
  fillColor: string
  highlightColor: string
  description: string
  pourable: boolean
  minTempC: number
  maxTempC: number
}

export const MATERIALS: Record<MaterialId, MaterialDefinition> = {
  water: {
    id: 'water',
    name: 'Água',
    shortName: 'H₂O',
    specificHeatJPerKgC: 4186,
    state: 'liquid',
    color: '#2563eb',
    fillColor: '#3b82f6',
    highlightColor: '#93c5fd',
    description: 'Líquido de elevada capacidade térmica específica.',
    pourable: true,
    minTempC: 1,
    maxTempC: 99,
  },
  copper: {
    id: 'copper',
    name: 'Cobre',
    shortName: 'Cu',
    specificHeatJPerKgC: 385,
    state: 'solid',
    color: '#b45309',
    fillColor: '#d97706',
    highlightColor: '#fbbf24',
    description: 'Sólido metálico usado em calorimetria.',
    pourable: false,
    minTempC: 0,
    maxTempC: 150,
  },
  sand: {
    id: 'sand',
    name: 'Areia',
    shortName: 'SiO₂',
    specificHeatJPerKgC: 830,
    state: 'granular',
    color: '#ca8a04',
    fillColor: '#eab308',
    highlightColor: '#fde047',
    description: 'Sólido granular; não forma mistura homogénea com líquidos.',
    pourable: true,
    minTempC: 0,
    maxTempC: 150,
  },
  oil: {
    id: 'oil',
    name: 'Óleo',
    shortName: 'óleo',
    specificHeatJPerKgC: 1840,
    state: 'liquid',
    color: '#a16207',
    fillColor: '#ca8a04',
    highlightColor: '#facc15',
    description: 'Líquido imiscível com a água.',
    pourable: true,
    minTempC: 1,
    maxTempC: 99,
  },
}

export function getMaterial(id: MaterialId): MaterialDefinition {
  return MATERIALS[id]
}

export function isLiquid(id: MaterialId): boolean {
  return MATERIALS[id].state === 'liquid'
}
