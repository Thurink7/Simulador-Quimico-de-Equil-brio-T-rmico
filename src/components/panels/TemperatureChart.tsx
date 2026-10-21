import type { SimulationSnapshot } from '../../simulation/core/SimulationState'

interface TemperatureChartProps { snapshot: SimulationSnapshot }

const plot = { left: 62, right: 884, top: 24, bottom: 318 }

export function TemperatureChart({ snapshot }: TemperatureChartProps) {
  const history = snapshot.temperatureHistory
  const series = snapshot.temperatureSeries
  const readings = history.flatMap((point) => point.temperaturesC)
  const rawMin = readings.length ? Math.min(...readings) : 0
  const rawMax = readings.length ? Math.max(...readings) : 100
  const spread = Math.max(10, rawMax - rawMin)
  const minTemp = Math.floor((rawMin - spread * 0.12) / 10) * 10
  const maxTemp = Math.ceil((rawMax + spread * 0.12) / 10) * 10
  const tempRange = Math.max(10, maxTemp - minTemp)
  const lastTime = history.at(-1)?.timeS ?? 0
  const maxTime = lastTime > 0 ? lastTime : 1
  const x = (time: number) => plot.left + (time / maxTime) * (plot.right - plot.left)
  const y = (temperature: number) => plot.bottom - ((temperature - minTemp) / tempRange) * (plot.bottom - plot.top)
  const equilibrium = snapshot.results?.equilibriumTemperatureC
  const colorFor = (initial: number) => {
    if (equilibrium === undefined) return '#64748b'
    if (initial < equilibrium - 0.05) return '#3b82f6'
    if (initial > equilibrium + 0.05) return '#f97316'
    return '#64748b'
  }
  const yTicks = Array.from({ length: 4 }, (_, index) => minTemp + (tempRange / 3) * index)
  const xTicks = [0, maxTime / 2, maxTime]

  return (
    <section className="temperature-chart" aria-labelledby="temperature-chart-title">
      <div className="chart-heading">
        <div><span className="section-index">03 / EVOLUÇÃO TEMPORAL</span><h2 id="temperature-chart-title">Temperatura ao longo do tempo</h2></div>
        <span className="chart-unit">T <span>×</span> t</span>
      </div>
      <div className="chart-legend" aria-label="Legenda do gráfico">
        {series.length ? series.map((item) => <span key={item.id}><i style={{ background: colorFor(item.initialTemperatureC) }} />{item.label}</span>) : <span className="chart-hint">Inicie uma transferência para registrar as temperaturas.</span>}
        {equilibrium !== undefined && <span><i className="legend-equilibrium" />Equilíbrio · {equilibrium.toFixed(1)} °C</span>}
      </div>
      <figure className="chart-figure" aria-label="Gráfico de temperatura por tempo">
        <svg viewBox="0 0 920 390" role="img" aria-labelledby="temperature-chart-title temperature-chart-description" preserveAspectRatio="none">
          <desc id="temperature-chart-description">A temperatura de cada amostra é mostrada em graus Celsius conforme o tempo de simulação em segundos.</desc>
          {yTicks.map((tick, index) => <g key={`y-${index}`}>
            <line x1={plot.left} y1={y(tick)} x2={plot.right} y2={y(tick)} className="chart-gridline" />
            <text x={plot.left - 10} y={y(tick) + 4} textAnchor="end" className="chart-tick">{tick.toFixed(0)}°</text>
          </g>)}
          {xTicks.map((tick, index) => <g key={`x-${index}`}>
            <line x1={x(tick)} y1={plot.top} x2={x(tick)} y2={plot.bottom} className="chart-gridline chart-gridline-vertical" />
            <text x={x(tick)} y={plot.bottom + 22} textAnchor="middle" className="chart-tick">{tick.toFixed(1)}</text>
          </g>)}
          <line x1={plot.left} y1={plot.top} x2={plot.left} y2={plot.bottom} className="chart-axis" />
          <line x1={plot.left} y1={plot.bottom} x2={plot.right} y2={plot.bottom} className="chart-axis" />
          {equilibrium !== undefined && <line x1={plot.left} y1={y(equilibrium)} x2={plot.right} y2={y(equilibrium)} className="chart-equilibrium-line" />}
          {series.map((item, seriesIndex) => {
            const color = colorFor(item.initialTemperatureC)
            const coordinates = history.flatMap((point, index) => {
              const temperature = point.temperaturesC[seriesIndex]
              return temperature === undefined ? [] : [{ x: x(point.timeS), y: y(temperature), index }]
            })
            if (!coordinates.length) return null
            const path = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
            const latest = coordinates[coordinates.length - 1]
            return <g key={item.id}>
              <path d={path} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={latest.x} cy={latest.y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
            </g>
          })}
          <text x="18" y="171" transform="rotate(-90 18 171)" textAnchor="middle" className="chart-axis-label">Temperatura (°C)</text>
          <text x={(plot.left + plot.right) / 2} y="378" textAnchor="middle" className="chart-axis-label">Tempo de simulação (s)</text>
          {!history.length && <text x={(plot.left + plot.right) / 2} y="171" textAnchor="middle" className="chart-placeholder">A curva aparece durante a troca de calor</text>}
        </svg>
      </figure>
      <div className="chart-footnote"><span>Leituras sequenciais do modelo térmico; a linha tracejada marca o equilíbrio calculado.</span><span>{history.length ? `${history.length} ${history.length === 1 ? 'leitura' : 'leituras'}` : 'Aguardando execução'}</span></div>
    </section>
  )
}
