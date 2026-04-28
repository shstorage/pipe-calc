import { useState, useEffect } from 'react'
import { getMaterials } from '../api/client'

const DEFAULTS = {
  'B31.1': { y_coefficient: 0.4, weld_strength_factor: 1.0 },
  'B31.3': { y_coefficient: 0.4, weld_strength_factor: 1.0 },
}

export default function InputForm({ onCalculate, loading }) {
  const [form, setForm] = useState({
    code: 'B31.3',
    material: '',
    design_pressure_mpa: '',
    temperature_c: '',
    corrosion_allowance_mm: '1.5',
    joint_efficiency: '1.0',
    y_coefficient: '0.4',
    weld_strength_factor: '1.0',
  })
  const [materials, setMaterials] = useState([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    getMaterials(form.code).then((r) => {
      setMaterials(r.data)
      setForm((f) => ({ ...f, material: r.data[0] || '' }))
    })
    const d = DEFAULTS[form.code]
    setForm((f) => ({
      ...f,
      y_coefficient: String(d.y_coefficient),
      weld_strength_factor: String(d.weld_strength_factor),
    }))
  }, [form.code])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onCalculate({
      code: form.code,
      material: form.material,
      design_pressure_mpa: parseFloat(form.design_pressure_mpa),
      temperature_c: parseFloat(form.temperature_c),
      corrosion_allowance_mm: parseFloat(form.corrosion_allowance_mm),
      joint_efficiency: parseFloat(form.joint_efficiency),
      y_coefficient: parseFloat(form.y_coefficient),
      weld_strength_factor: parseFloat(form.weld_strength_factor),
    })
  }

  return (
    <form className="input-form card" onSubmit={handleSubmit}>
      <h2 className="form-title">설계 조건</h2>

      <div className="field-group">
        <label className="field-label">적용 코드</label>
        <div className="radio-group">
          {['B31.1', 'B31.3'].map((c) => (
            <label key={c} className="radio-label">
              <input
                type="radio"
                name="code"
                value={c}
                checked={form.code === c}
                onChange={set('code')}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">재질</label>
        <select className="field-input" value={form.material} onChange={set('material')}>
          {materials.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label className="field-label">설계 압력 (MPa)</label>
        <input className="field-input" type="number" step="0.1" required
          placeholder="예: 10.0" value={form.design_pressure_mpa} onChange={set('design_pressure_mpa')} />
      </div>

      <div className="field-group">
        <label className="field-label">설계 온도 (℃)</label>
        <input className="field-input" type="number" step="1" required
          placeholder="예: 150" value={form.temperature_c} onChange={set('temperature_c')} />
      </div>

      <div className="field-group">
        <label className="field-label">부식 허용치 (mm)</label>
        <input className="field-input" type="number" step="0.1"
          value={form.corrosion_allowance_mm} onChange={set('corrosion_allowance_mm')} />
      </div>

      <button type="button" className="advanced-toggle"
        onClick={() => setShowAdvanced((v) => !v)}>
        고급 옵션 {showAdvanced ? '▲' : '▼'}
      </button>

      {showAdvanced && (
        <div className="advanced-fields">
          <div className="field-group">
            <label className="field-label">용접 이음 효율 (E)</label>
            <input className="field-input" type="number" step="0.01"
              value={form.joint_efficiency} onChange={set('joint_efficiency')} />
          </div>
          <div className="field-group">
            <label className="field-label">온도 계수 (Y)</label>
            <input className="field-input" type="number" step="0.01"
              value={form.y_coefficient} onChange={set('y_coefficient')} />
          </div>
          {form.code === 'B31.3' && (
            <div className="field-group">
              <label className="field-label">용접 강도 감소 계수 (W)</label>
              <input className="field-input" type="number" step="0.01"
                value={form.weld_strength_factor} onChange={set('weld_strength_factor')} />
            </div>
          )}
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? '계산 중…' : '계산하기'}
      </button>
    </form>
  )
}
