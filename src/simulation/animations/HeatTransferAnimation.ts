import type { ThermalMass } from '../../physics/calorimetry'

export function thermalColor(temperatureC: number, baseHex: string): string {
  const t = clamp((temperatureC - 5) / 95, 0, 1)
  const cold = hexToRgb('#2563eb')
  const hot = hexToRgb('#dc2626')
  const base = hexToRgb(baseHex)
  const mix = {
    r: Math.round(base.r * 0.35 + cold.r * (1 - t) * 0.65 + hot.r * t * 0.65),
    g: Math.round(base.g * 0.35 + cold.g * (1 - t) * 0.65 + hot.g * t * 0.65),
    b: Math.round(base.b * 0.35 + cold.b * (1 - t) * 0.65 + hot.b * t * 0.65),
  }
  return rgbToHex(mix)
}

export function temperatureSpread(contents: readonly ThermalMass[]): number {
  if (contents.length === 0) {
    return 0
  }
  const temps = contents.map((sample) => sample.temperatureC)
  return Math.max(...temps) - Math.min(...temps)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace('#', '')
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0')
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
