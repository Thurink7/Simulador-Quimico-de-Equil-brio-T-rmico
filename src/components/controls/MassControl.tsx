interface MassControlProps {
  massKg: number
  disabled: boolean
  onChange: (massKg: number) => void
}

export function MassControl({ massKg, disabled, onChange }: MassControlProps) {
  const grams = Math.round(massKg * 1000)
  return (
    <label className="control-field">
      <span>Massa</span>
      <div className="control-row">
        <input
          type="range"
          min={50}
          max={1000}
          step={10}
          value={grams}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value) / 1000)}
        />
        <strong>{grams} g</strong>
      </div>
    </label>
  )
}
