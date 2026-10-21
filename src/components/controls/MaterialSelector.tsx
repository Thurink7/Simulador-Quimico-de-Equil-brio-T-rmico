import { MATERIALS, MATERIAL_IDS, type MaterialId } from '../../physics/materials'

interface MaterialSelectorProps {
  value: MaterialId | null
  disabled: boolean
  id: string
  onChange: (id: MaterialId) => void
}

export function MaterialSelector({ value, disabled, id, onChange }: MaterialSelectorProps) {
  return (
    <label className="material-select control-field" htmlFor={`${id}-material`}>
      <span className="field-heading"><span>Material</span><span className="material-sample" style={{ background: value ? MATERIALS[value].fillColor : '#94a3b8' }} /></span>
      <select id={`${id}-material`} value={value ?? ''} disabled={disabled} onChange={(event) => onChange(event.target.value as MaterialId)}>
        <option value="" disabled>Selecione um material</option>
        {MATERIAL_IDS.map((materialId) => <option key={materialId} value={materialId}>{MATERIALS[materialId].name}</option>)}
      </select>
    </label>
  )
}
