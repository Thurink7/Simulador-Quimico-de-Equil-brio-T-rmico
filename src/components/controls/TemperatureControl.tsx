interface TemperatureControlProps {
  temperatureC: number
  min: number
  max: number
  disabled: boolean
  onChange: (temperatureC: number) => void
}

export function TemperatureControl({
  temperatureC,
  min,
  max,
  disabled,
  onChange,
}: TemperatureControlProps) {
  return (
    <label className="control-field">
      <span>Temperatura inicial</span>
      <div className="control-row">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={Math.round(temperatureC)}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <strong>{temperatureC.toFixed(0)} °C</strong>
      </div>
    </label>
  )
}
