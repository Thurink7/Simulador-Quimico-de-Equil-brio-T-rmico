import {
  computeEquilibrium,
  formatEnergy,
  formatMassGrams,
  formatTemperature,
} from '../../physics/calorimetry'
import { getMaterial } from '../../physics/materials'
import type { SimulationSnapshot } from '../../simulation/core/SimulationState'

interface ResultsPanelProps {
  snapshot: SimulationSnapshot
}

export function ResultsPanel({ snapshot }: ResultsPanelProps) {
  const active =
    snapshot.containers.find((container) => container.id === snapshot.results?.containerId) ??
    snapshot.containers.find((container) => container.contents.length > 1) ??
    snapshot.containers[0]

  const live = active ? computeEquilibrium(active.contents) : null
  const results = snapshot.results ?? (live && active.contents.length > 0
    ? { ...live, containerId: active.id }
    : null)

  return (
    <aside className="results-panel" aria-label="Resultados">
      <h2>Resultados</h2>
      <ul className="reading-list">
        {snapshot.containers.map((container) => (
          <li key={container.id}>
            <strong>Recipiente {container.label}</strong>
            {container.contents.length === 0 ? (
              <p>Vazio</p>
            ) : (
              container.contents.map((sample) => (
                <p key={`${container.id}-${sample.materialId}`}>
                  {getMaterial(sample.materialId).name}: {formatMassGrams(sample.massKg)},{' '}
                  {formatTemperature(sample.temperatureC)}
                </p>
              ))
            )}
          </li>
        ))}
      </ul>

      {results ? (
        <div className="calc-block">
          <p>
            <span>Temperatura de equilíbrio</span>
            <strong>{formatTemperature(results.equilibriumTemperatureC)}</strong>
          </p>
          <p>
            <span>Calor transferido</span>
            <strong>{formatEnergy(results.heatTransferredJ)}</strong>
          </p>
          <p className="formula">{results.formula}</p>
          <p className="substitution">{results.substitution}</p>
          <p className="explanation">{results.explanation}</p>
        </div>
      ) : (
        <p className="empty-results">
          Os cálculos aparecem depois de uma transferência válida, usando o modelo de calorimetria
          do projeto.
        </p>
      )}
    </aside>
  )
}
