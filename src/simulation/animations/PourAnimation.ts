export interface PourAnimationState {
  progress: number
  kind: 'pour' | 'place' | 'move'
}

export function pourTiltRadians(state: PourAnimationState | null, isSource: boolean): number {
  if (!state || !isSource) {
    return 0
  }
  const amount = state.kind === 'place' ? 0.12 : 0.38
  const envelope = Math.sin(Math.min(1, state.progress) * Math.PI)
  return -amount * envelope
}

export function pourStreamOpacity(progress: number): number {
  if (progress <= 0.08 || progress >= 0.92) {
    return 0
  }
  return 0.85
}
