interface MassControlProps {
  massKg: number
  disabled: boolean
  id: string
  onChange: (massKg: number) => void
}

export function MassControl({ massKg, disabled, id, onChange }: MassControlProps) {
  const grams = Math.round(massKg * 1000)
  const update = (value: string) => {
    if (value !== '' && Number.isFinite(Number(value))) onChange(Number(value) / 1000)
  }
  return (
    <div className="control-field">
      <div className="field-heading"><label htmlFor={`${id}-mass`}>Massa</label><span>50–1000 g</span></div>
      <div className="control-row">
        <input aria-label={`Ajustar massa do recipiente ${id}`} type="range" min={50} max={1000} step={10} value={grams} disabled={disabled} onChange={(event) => update(event.target.value)} />
        <div className="number-input"><input id={`${id}-mass`} type="number" min={50} max={1000} step={10} value={grams} disabled={disabled} onChange={(event) => update(event.target.value)} /><span>g</span></div>
      </div>
    </div>
  )
}
