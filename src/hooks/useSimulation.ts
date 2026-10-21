import { useEffect, useMemo, useState } from 'react'
import { SimulationController } from '../simulation/core/SimulationController'
import type { SimulationSnapshot } from '../simulation/core/SimulationState'

export function useSimulation(): {
  snapshot: SimulationSnapshot
  controller: SimulationController
} {
  const controller = useMemo(() => new SimulationController(), [])
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() => controller.getSnapshot())

  useEffect(() => {
    return controller.subscribeUi(setSnapshot)
  }, [controller])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => controller.setReducedMotion(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [controller])

  return { snapshot, controller }
}
