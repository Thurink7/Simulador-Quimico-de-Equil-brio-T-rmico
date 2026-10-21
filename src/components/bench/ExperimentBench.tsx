import { useEffect, useRef } from 'react'
import type { SimulationController } from '../../simulation/core/SimulationController'
import type { SimulationSnapshot } from '../../simulation/core/SimulationState'
import { LaboratoryScene } from '../../simulation/scene/LaboratoryScene'

interface ExperimentBenchProps {
  controller: SimulationController
  snapshot: SimulationSnapshot
}

export function ExperimentBench({ controller, snapshot }: ExperimentBenchProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<LaboratoryScene | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) {
      return
    }
    const scene = new LaboratoryScene(host, controller)
    sceneRef.current = scene
    const observer = new ResizeObserver(() => scene.resize())
    observer.observe(host)
    return () => {
      observer.disconnect()
      scene.dispose()
      sceneRef.current = null
    }
  }, [controller])

  return (
    <section className="bench-wrap" aria-label="Bancada experimental">
      <div className="bench-toolbar">
        <p>{snapshot.interactionHint}</p>
        <div className="toolbar-buttons">
          {snapshot.phase === 'exchanging' ? (
            <button type="button" onClick={() => controller.pause()}>
              Pausar
            </button>
          ) : null}
          {snapshot.phase === 'paused' ? (
            <button type="button" onClick={() => controller.resume()}>
              Continuar
            </button>
          ) : null}
          <button type="button" onClick={() => controller.reset()}>
            Reiniciar
          </button>
        </div>
      </div>
      <div ref={hostRef} className="bench-host" />
    </section>
  )
}
