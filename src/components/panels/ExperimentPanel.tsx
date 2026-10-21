import { getMaterial, type MaterialId } from '../../physics/materials'
import { assessTransfer } from '../../physics/mixingRules'
import type { SimulationController } from '../../simulation/core/SimulationController'
import { primaryMaterial, type SimulationSnapshot } from '../../simulation/core/SimulationState'
import { MassControl } from '../controls/MassControl'
import { MaterialSelector } from '../controls/MaterialSelector'
import { TemperatureControl } from '../controls/TemperatureControl'

interface ExperimentPanelProps { snapshot: SimulationSnapshot; controller: SimulationController }

export function ExperimentPanel({ snapshot, controller }: ExperimentPanelProps) {
  const editing = controller.canEdit()
  const selected = snapshot.containers.find((container) => container.id === snapshot.selectedId)
  return (
    <aside className="controls-panel" aria-label="Configuração experimental">
      <div className="panel-title-row"><div><span className="section-index">01 / CONFIGURAÇÃO</span><h2>Preparar amostras</h2></div><span className="panel-count">{snapshot.containers.length} amostras</span></div>
      <p className="panel-intro">Defina as condições iniciais de cada recipiente antes da transferência.</p>

      <div className="vessel-list">
        {snapshot.containers.map((container) => {
          const materialId = primaryMaterial(container)
          const sample = container.contents[0]
          const material = materialId ? getMaterial(materialId) : null
          const active = selected?.id === container.id
          return (
            <section key={container.id} className={`vessel-controls ${active ? 'active' : ''}`}>
              <header className="vessel-heading">
                <button type="button" className="select-vessel" aria-pressed={active} onClick={() => controller.selectContainer(active ? null : container.id)}>
                  <span className={`vessel-index vessel-${container.label.toLowerCase()}`}>{container.label}</span><span><strong>Recipiente {container.label}</strong><small>{container.contents.length ? (material?.name ?? 'Amostra') : 'Vazio'}</small></span>
                </button>
                {snapshot.containers.length > 2 && <button type="button" className="quiet-action" aria-label={`Remover recipiente ${container.label}`} disabled={!editing} onClick={() => controller.removeContainer(container.id)}>Remover</button>}
              </header>
              <MaterialSelector id={container.id} value={materialId} disabled={!editing} onChange={(id: MaterialId) => controller.setMaterial(container.id, id)} />
              {sample && material ? <>
                <div className="material-property"><span>Calor específico</span><strong>{material.specificHeatJPerKgC.toLocaleString('pt-BR')} <small>J/kg·°C</small></strong></div>
                <MassControl id={container.id} massKg={container.contents.reduce((sum, item) => sum + item.massKg, 0)} disabled={!editing} onChange={(massKg) => controller.setMassKg(container.id, massKg)} />
                <TemperatureControl id={container.id} temperatureC={sample.temperatureC} min={material.minTempC} max={material.maxTempC} disabled={!editing || container.contents.length > 1} onChange={(temperatureC) => controller.setTemperatureC(container.id, temperatureC)} />
              </> : <p className="hint">Selecione um material para definir a amostra.</p>}
              {active && <div className="transfer-picker"><span>TRANSFERIR AMOSTRA PARA</span>{snapshot.containers.filter((other) => other.id !== container.id).map((other) => {
                const assessment = assessTransfer(container.contents, other.contents)
                const busy = snapshot.phase === 'pouring' || snapshot.phase === 'exchanging' || snapshot.phase === 'paused'
                return <button key={other.id} type="button" disabled={!assessment.valid || busy} onClick={() => controller.requestTransfer(container.id, other.id)}><span>Recipiente {other.label}</span><span aria-hidden="true">↗</span></button>
              })}</div>}
            </section>
          )
        })}
      </div>
      <button className="add-vessel" type="button" disabled={!editing || snapshot.containers.length >= 3} onClick={() => controller.addContainer()}><span aria-hidden="true">+</span>Adicionar recipiente</button>
      <div className="model-assumption"><span className="assumption-mark">i</span><p><strong>Sistema isolado</strong><br />O modelo conserva a energia térmica total.</p></div>
    </aside>
  )
}
