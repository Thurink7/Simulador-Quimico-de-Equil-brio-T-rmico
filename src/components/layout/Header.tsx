import { phaseLabel } from '../../simulation/core/SimulationController'
import type { ExperimentPhase } from '../../simulation/core/SimulationState'

interface HeaderProps {
  phase: ExperimentPhase
  onHelp: () => void
}

export function Header({ phase, onHelp }: HeaderProps) {
  return (
    <header className="lab-header">
      <a className="brand" href="#bancada" aria-label="Ponto de Equilíbrio, início">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M16 3v26M4.8 9.5l22.4 13M4.8 22.5l22.4-13" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="16" cy="16" r="3.2" fill="currentColor" />
          </svg>
        </span>
        <span className="brand-copy"><strong>Ponto de Equilíbrio</strong><small>LABORATÓRIO VIRTUAL</small></span>
      </a>
      <div className="header-context">
        <span className="context-kicker">EXPERIMENTO 01</span>
        <strong>Trocas de calor</strong>
      </div>
      <div className="header-actions">
        <span className={`status-pill status-${phase}`} role="status" aria-live="polite"><i />{phaseLabel(phase)}</span>
        <button type="button" className="icon-button help-button" onClick={onHelp} aria-label="Abrir ajuda" title="Ajuda">
          <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.2" /><path d="M8.2 7.5a1.9 1.9 0 1 1 3.3 1.3c-.8.8-1.5 1-1.5 2.2M10 13.8v.1" /></svg>
          <span>Ajuda</span>
        </button>
      </div>
    </header>
  )
}
