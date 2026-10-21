import { useState } from 'react'
import type { SimulationController } from '../../simulation/core/SimulationController'
import type { SimulationSnapshot } from '../../simulation/core/SimulationState'
import { ExperimentBench } from '../bench/ExperimentBench'
import { ExperimentPanel } from '../panels/ExperimentPanel'
import { ResultsPanel } from '../panels/ResultsPanel'
import { Header } from './Header'

interface LaboratoryLayoutProps {
  snapshot: SimulationSnapshot
  controller: SimulationController
}

export function LaboratoryLayout({ snapshot, controller }: LaboratoryLayoutProps) {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <div className="laboratory-shell">
      <Header phase={snapshot.phase} onHelp={() => setHelpOpen(true)} />
      <div className="laboratory-grid">
        <ExperimentPanel snapshot={snapshot} controller={controller} />
        <ExperimentBench snapshot={snapshot} controller={controller} />
        <ResultsPanel snapshot={snapshot} />
      </div>
      {helpOpen ? (
        <div className="help-overlay" role="dialog" aria-labelledby="help-title">
          <div className="help-card">
            <h2 id="help-title">Como usar o laboratório</h2>
            <ol>
              <li>Escolha o material de cada recipiente nos cartões.</li>
              <li>Ajuste a massa e a temperatura inicial.</li>
              <li>Arraste um recipiente até outro, ou use Transferir para…</li>
              <li>Observe a animação e a evolução das temperaturas.</li>
              <li>Leia a fórmula e a substituição no painel de resultados.</li>
            </ol>
            <p>
              Água e óleo não se misturam. O cobre pode ser colocado em contacto térmico com um
              líquido, sem se dissolver.
            </p>
            <button type="button" onClick={() => setHelpOpen(false)}>
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
