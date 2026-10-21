import { useEffect, useRef, useState } from 'react'
import type { SimulationController } from '../../simulation/core/SimulationController'
import type { SimulationSnapshot } from '../../simulation/core/SimulationState'
import { ExperimentBench } from '../bench/ExperimentBench'
import { ExperimentPanel } from '../panels/ExperimentPanel'
import { ResultsPanel } from '../panels/ResultsPanel'
import { TemperatureChart } from '../panels/TemperatureChart'
import { Header } from './Header'

interface LaboratoryLayoutProps {
  snapshot: SimulationSnapshot
  controller: SimulationController
}

export function LaboratoryLayout({ snapshot, controller }: LaboratoryLayoutProps) {
  const [helpOpen, setHelpOpen] = useState(false)
  const closeHelpRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!helpOpen) return
    closeHelpRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHelpOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [helpOpen])

  return (
    <div className="laboratory-shell">
      <Header phase={snapshot.phase} onHelp={() => setHelpOpen(true)} />
      <div className="workspace-heading"><div><span>TERMODINÂMICA · CALORIMETRIA</span><h1>Trocas de calor</h1></div><span className="assumption-chip"><i />Sistema isolado</span></div>
      <div className="laboratory-grid">
        <ExperimentPanel snapshot={snapshot} controller={controller} />
        <ExperimentBench snapshot={snapshot} controller={controller} />
        <ResultsPanel snapshot={snapshot} />
      </div>
      <TemperatureChart snapshot={snapshot} />
      {helpOpen ? (
        <div className="help-overlay" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => { if (event.target === event.currentTarget) setHelpOpen(false) }}>
          <div className="help-card">
            <button ref={closeHelpRef} type="button" className="dialog-close" aria-label="Fechar ajuda" onClick={() => setHelpOpen(false)}>×</button>
            <span className="section-index">GUIA RÁPIDO</span>
            <h2 id="help-title">Como usar o laboratório</h2>
            <ol>
              <li>Escolha o material de cada recipiente nos cartões.</li>
              <li>Ajuste a massa e a temperatura inicial.</li>
              <li>Arraste um recipiente até outro, ou use Transferir para…</li>
              <li>Observe a animação e a evolução das temperaturas.</li>
              <li>Leia a fórmula e a substituição no painel de resultados.</li>
            </ol>
            <p>
              O modelo atual considera o sistema isolado. Água e óleo são imiscíveis; o cobre pode ser colocado em contacto térmico com um líquido, sem se dissolver.
            </p>
            <button className="primary-button" type="button" onClick={() => setHelpOpen(false)}>
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
