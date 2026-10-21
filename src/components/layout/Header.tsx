import { phaseLabel } from '../../simulation/core/SimulationController'
import type { ExperimentPhase } from '../../simulation/core/SimulationState'

interface HeaderProps {
  phase: ExperimentPhase
  onHelp: () => void
}

export function Header({ phase, onHelp }: HeaderProps) {
  return (
    <header className="lab-header">
      <div className="brand">
        <span className="logo" aria-hidden="true">
          ⌬
        </span>
        <div>
          <p className="brand-name">ThermoLab</p>
          <p className="experiment-name">Laboratório de Trocas de Calor</p>
        </div>
      </div>
      <div className="header-actions">
        <span className={`status-pill status-${phase}`}>{phaseLabel(phase)}</span>
        <button type="button" className="ghost-button" onClick={onHelp}>
          Instruções
        </button>
      </div>
    </header>
  )
}
