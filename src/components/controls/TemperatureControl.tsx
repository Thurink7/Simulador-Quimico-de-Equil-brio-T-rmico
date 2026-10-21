interface TemperatureControlProps {
  temperatureC: number
  min: number
  max: number
  disabled: boolean
  id: string
  onChange: (temperatureC: number) => void
}

export function TemperatureControl({ temperatureC, min, max, disabled, id, onChange }: TemperatureControlProps) {
  const update = (value: string) => {
    if (value !== '' && Number.isFinite(Number(value))) onChange(Number(value))
  }
  return (
    <div className="control-field temperature-field">
      <div className="field-heading"><label htmlFor={`${id}-temperature`}>Temperatura inicial</label><span>{min} a {max} °C</span></div>
      <div className="control-row">
        <input aria-label={`Ajustar temperatura inicial do recipiente ${id}`} type="range" min={min} max={max} step={1} value={Math.round(temperatureC)} disabled={disabled} onChange={(event) => update(event.target.value)} />
        <div className="number-input temperature-number"><input id={`${id}-temperature`} type="number" min={min} max={max} step={1} value={temperatureC.toFixed(0)} disabled={disabled} onChange={(event) => update(event.target.value)} /><span>°C</span></div>
      </div>
    </div>
  )
}
