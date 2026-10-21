import { useMemo } from 'react'
import { computeEquilibrium, formatEnergy, formatMassGrams, formatTemperature } from '../../physics/calorimetry'
import { getMaterial } from '../../physics/materials'
import { canCoexist } from '../../physics/mixingRules'
import type { SimulationSnapshot } from '../../simulation/core/SimulationState'

interface ResultsPanelProps { snapshot: SimulationSnapshot }

export function ResultsPanel({ snapshot }: ResultsPanelProps) {
  const liveSamples = useMemo(() => snapshot.containers.flatMap((container) => container.contents), [snapshot])
  const live = useMemo(() => {
    const compatible = liveSamples.every((sample, index) => liveSamples.slice(index + 1).every((other) => canCoexist(sample.materialId, other.materialId)))
    return compatible ? computeEquilibrium(liveSamples) : null
  }, [liveSamples])
  const result = snapshot.results ?? live
  const initialSamples = snapshot.results?.initialSamples ?? liveSamples
  const confirmed = snapshot.phase === 'equilibrium' && snapshot.results !== null

  return (
    <aside className="results-panel" aria-label="Painel científico">
      <div className="panel-title-row"><div><span className="section-index">02 / LEITURA CIENTÍFICA</span><h2>Equilíbrio térmico</h2></div></div>
      <p className="panel-intro">Balanço de energia para as amostras selecionadas.</p>

      <section className="result-lead" aria-live="polite">
        <span className="result-label">TEMPERATURA {confirmed ? 'DE EQUILÍBRIO' : 'PREVISTA'}</span>
        <strong className="result-temperature">{result ? formatTemperature(result.equilibriumTemperatureC) : '— °C'}</strong>
        <span className={`result-state ${confirmed ? 'complete' : ''}`}><i />{confirmed ? 'Estado final alcançado' : 'Previsão do modelo isolado'}</span>
      </section>

      <section className="heat-reading"><div><span>Calor transferido</span><small>entre as amostras</small></div><strong>{result ? formatEnergy(result.heatTransferredJ) : '—'}</strong></section>

      {result ? <>
        <section className="equation-section">
          <div className="subsection-heading"><span>01</span><h3>Equação geral</h3></div>
          <div className="equation-display"><span>Q = mcΔT</span><span className="equation-divider" /><span>ΣQ = 0</span></div>
          <p className="equation-caption">No sistema isolado, o calor cedido equivale ao calor recebido.</p>
        </section>

        <section className="equation-section substitution-section">
          <div className="subsection-heading"><span>02</span><h3>Temperatura final</h3></div>
          <div className="equation-fraction" aria-label="Temperatura final igual à soma de massa vezes calor específico vezes temperatura inicial dividida pela soma de massa vezes calor específico">
            <span className="fraction-top">Σ (mᵢ cᵢ Tᵢ)</span><span className="fraction-bottom">Σ (mᵢ cᵢ)</span>
          </div>
          <p className="formula-substitution">{result.substitution}</p>
        </section>

        <section className="sample-changes">
          <div className="subsection-heading"><span>03</span><h3>Variação por amostra</h3></div>
          <div className="sample-table"><div className="sample-table-head"><span>Material · massa</span><span>ΔT</span></div>
            {initialSamples.map((sample, index) => {
              const material = getMaterial(sample.materialId)
              const delta = result.equilibriumTemperatureC - sample.temperatureC
              return <div className="sample-row" key={`${sample.materialId}-${index}`}><span className="sample-name"><i style={{ background: material.fillColor }} /><span><strong>{material.name}</strong><small>{formatMassGrams(sample.massKg)} · {formatTemperature(sample.temperatureC)} → {formatTemperature(result.equilibriumTemperatureC)}</small></span></span><strong className={delta > 0.05 ? 'delta-up' : delta < -0.05 ? 'delta-down' : ''}>{delta > 0 ? '+' : ''}{delta.toFixed(1)} °C</strong></div>
            })}
          </div>
        </section>

        <section className="interpretation"><span className="interpretation-mark" aria-hidden="true">∴</span><p><strong>Interpretação</strong>{result.explanation}</p></section>
      </> : <div className="science-empty"><span>∑</span><p><strong>{liveSamples.length ? 'Sem previsão de mistura' : 'Aguardando amostras'}</strong>{liveSamples.length ? 'Estas amostras não podem coexistir segundo as regras de mistura do modelo.' : 'Configure os recipientes para visualizar a previsão do equilíbrio térmico.'}</p></div>}
    </aside>
  )
}
