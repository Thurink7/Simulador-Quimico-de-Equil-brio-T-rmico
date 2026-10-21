import { MATERIALS, MATERIAL_IDS, type MaterialId } from '../../physics/materials'

interface MaterialSelectorProps {
  value: MaterialId | null
  disabled: boolean
  onChange: (id: MaterialId) => void
}

export function MaterialSelector({ value, disabled, onChange }: MaterialSelectorProps) {
  return (
    <div className="material-grid" role="listbox" aria-label="Materiais">
      {MATERIAL_IDS.map((id) => {
        const material = MATERIALS[id]
        const selected = value === id
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={selected}
            className={`material-card ${selected ? 'selected' : ''}`}
            disabled={disabled}
            onClick={() => onChange(id)}
          >
            <span className="swatch" style={{ background: material.fillColor }} />
            <span className="material-name">{material.name}</span>
            <span className="material-meta">
              c = {material.specificHeatJPerKgC} J/kg·°C
            </span>
          </button>
        )
      })}
    </div>
  )
}
