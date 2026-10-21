import { Shape } from 'scenerystack/kite'

/** Béquer vetorial com origem no centro da base. */
export const BEAKER_WIDTH = 92
export const BEAKER_HEIGHT = 138

export function createBeakerOuterShape(): Shape {
  return new Shape()
    .moveTo(-34, -130)
    .lineTo(-44, -6)
    .quadraticCurveTo(0, 10, 44, -6)
    .lineTo(34, -130)
    .lineTo(40, -132)
    .lineTo(50, -4)
    .quadraticCurveTo(0, 18, -50, -4)
    .lineTo(-40, -132)
    .close()
}

export function createBeakerInnerShape(): Shape {
  return new Shape()
    .moveTo(-30, -126)
    .lineTo(-39, -8)
    .quadraticCurveTo(0, 4, 39, -8)
    .lineTo(30, -126)
    .close()
}

