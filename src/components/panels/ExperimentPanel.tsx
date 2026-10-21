import { getMaterial, type MaterialId } from '../../physics/materials'
import { assessTransfer } from '../../physics/mixingRules'
import type { SimulationController } from '../../simulation/core/SimulationController'
import { primaryMaterial, type SimulationSnapshot } from '../../simulation/core/SimulationState'
import { MassControl } from '../controls/MassControl'
import { MaterialSelector } from '../controls/MaterialSelector'
import { TemperatureControl } from '../controls/TemperatureControl'

interface ExperimentPanelProps {
  snapshot: SimulationSnapshot
  controller: SimulationController
}

export function ExperimentPanel({ snapshot, controller }: ExperimentPanelProps) {
  const editing = snapshot.phase === 'idle' || snapshot.phase === 'equilibrium'
  const busy = snapshot.phase === 'pouring' || snapshot.phase === 'exchanging'
  const selected = snapshot.containers.find((container) => container.id === snapshot.selectedId)

  return (
    <aside className="controls-panel" aria-label="Controlos do experimento">
      <h2>Controlos</h2>
      {snapshot.containers.map((container) => {
        const primary = primaryMaterial(container)
        const sample = container.contents[0]
        const material = primary ? getMaterial(primary) : null
        const selectedHere = selected?.id === container.id
        return (
          <section
            key={container.id}
            className={`vessel-controls ${selectedHere ? 'active' : ''}`}
          >
            <header>
              <button
                type="button"
                className="select-vessel"
                onClick={() => controller.selectContainer(container.id)}
              >
                Recipiente {container.label}
              </button>
              <button
                type="button"
                className="text-button"
                disabled={!editing}
                onClick={() => controller.emptyContainer(container.id)}
              >
                Esvaziar
              </button>
            </header>

            <MaterialSelector
              value={primary}
              disabled={!editing}
              onChange={(id: MaterialId) => controller.setMaterial(container.id, id)}
            />

            {sample && material ? (
              <>
                <MassControl
                  massKg={container.contents.reduce((sum, item) => sum + item.massKg, 0)}
                  disabled={!editing}
                  onChange={(massKg) => controller.setMassKg(container.id, massKg)}
                />
                <TemperatureControl
                  temperatureC={sample.temperatureC}
                  min={material.minTempC}
                  max={material.maxTempC}
                  disabled={!editing || container.contents.length > 1}
                  onChange={(temperatureC) => controller.setTemperatureC(container.id, temperatureC)}
                />
              </>
            ) : (
              <p className="hint">Escolha um material para voltar a encher este recipiente.</p>
            )}

            {selectedHere ? (
              <div className="accessible-transfer">
                <p>Alternativa ao arraste</p>
                {snapshot.containers
                  .filter((other) => other.id !== container.id)
                  .map((other) => {
                    const assessment = assessTransfer(container.contents, other.contents)
                    return (
                      <button
                        key={other.id}
                        type="button"
                        disabled={!assessment.valid || busy}
                        onClick={() => controller.requestTransfer(container.id, other.id)}
                      >
                        Transferir para {other.label}
                      </button>
                    )
                  })}
              </div>
            ) : null}

            {snapshot.containers.length > 2 ? (
              <button
                type="button"
                className="text-button"
                disabled={!editing}
                onClick={() => controller.removeContainer(container.id)}
              >
                Remover recipiente
              </button>
            ) : null}
          </section>
        )
      })}

      <div className="panel-actions">
        <button
          type="button"
          disabled={!editing || snapshot.containers.length >= 3}
          onClick={() => controller.addContainer()}
        >
          Adicionar recipiente
        </button>
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
        <button type="button" className="secondary" onClick={() => controller.reset()}>
          Reiniciar
        </button>
      </div>
    </aside>
  )
}
