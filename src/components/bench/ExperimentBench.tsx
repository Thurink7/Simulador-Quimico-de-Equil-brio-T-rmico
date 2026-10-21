import { useEffect, useRef } from 'react'
import type { SimulationController } from '../../simulation/core/SimulationController'
import type { SimulationSnapshot } from '../../simulation/core/SimulationState'
import { LaboratoryScene } from '../../simulation/scene/LaboratoryScene'
import { getMaterial } from '../../physics/materials'

interface ExperimentBenchProps {
  controller: SimulationController
  snapshot: SimulationSnapshot
}

export function ExperimentBench({ controller, snapshot }: ExperimentBenchProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<LaboratoryScene | null>(null)
  const transferringHeat = snapshot.phase === 'exchanging' || snapshot.phase === 'paused'
  const initialSamples = snapshot.results?.initialSamples ?? []
  const hottest = initialSamples.reduce((hot, sample) => sample.temperatureC > hot.temperatureC ? sample : hot, initialSamples[0])
  const coldest = initialSamples.reduce((cold, sample) => sample.temperatureC < cold.temperatureC ? sample : cold, initialSamples[0])

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
    <section id="bancada" className="bench-wrap" aria-label="Bancada experimental">
      <div className="bench-toolbar">
        <div className="bench-instruction"><span className="live-indicator" /><p>{snapshot.interactionHint}</p></div>
        {transferringHeat && hottest && coldest && <span className="flow-direction" aria-live="polite"><strong>Q</strong> {getMaterial(hottest.materialId).shortName} <span aria-hidden="true">→</span> {getMaterial(coldest.materialId).shortName}</span>}
        <label className="bench-duration">
          <span>Tempo da troca</span>
          <input aria-label="Tempo da troca de calor em segundos" type="range" min="0.5" max="12" step="0.5" value={snapshot.mixingDurationS} disabled={controller.isBusy()} onChange={(event) => controller.setMixingDurationS(Number(event.currentTarget.value))} />
          <output>{snapshot.mixingDurationS.toFixed(1)} s</output>
        </label>
        <div className="toolbar-buttons" aria-label="Controles da simulação">
          {snapshot.phase === 'exchanging' ? (
            <button className="toolbar-button" type="button" onClick={() => controller.pause()}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10" /></svg>
              Pausar
            </button>
          ) : null}
          {snapshot.phase === 'paused' ? (
            <button className="toolbar-button primary" type="button" onClick={() => controller.resume()}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 9 6-9 6z" /></svg>
              Continuar
            </button>
          ) : null}
          <button className="toolbar-button reset-button" type="button" onClick={() => controller.reset()} title="Reiniciar experimento">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 9a6.5 6.5 0 1 1 .5 4M4 4v5h5" /></svg>
            Reiniciar
          </button>
        </div>
      </div>
      <div ref={hostRef} className="bench-host" />
    </section>
  )
}
