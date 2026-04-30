import { useState, useEffect } from 'react'
import { getMaterials } from '../api/client'

const CODE_DEFAULTS = {
  'B31.1': { y_coefficient: '0.4', weld_strength_factor: '1.0' },
  'B31.3': { y_coefficient: '0.4', weld_strength_factor: '1.0' },
}

const toFloat = (v, fallback = 0) => {
  const n = parseFloat(v)
  return isNaN(n) ? fallback : n
}

export default function InputForm({ formValues, onFormChange, onCalculate, loading }) {
  const [materials, setMaterials] = useState([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const set = (k) => (e) => onFormChange((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    getMaterials(formValues.code).then((r) => {
      setMaterials(r.data)
      // 재질 목록이 바뀌면 현재 선택값이 없는 경우에만 첫 번째로 초기화
      onFormChange((f) => ({
        ...f,
        material: r.data.includes(f.material) ? f.material : (r.data[0] ?? ''),
      }))
    })
    const d = CODE_DEFAULTS[formValues.code]
    onFormChange((f) => ({
      ...f,
      y_coefficient: d.y_coefficient,
      weld_strength_factor: d.weld_strength_factor,
    }))
  }, [formValues.code]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e) => {
    e.preventDefault()
    onCalculate({
      code: formValues.code,
      material: formValues.material,
      design_pressure_mpa: toFloat(formValues.design_pressure_mpa),
      temperature_c: toFloat(formValues.temperature_c),
      corrosion_allowance_mm: toFloat(formValues.corrosion_allowance_mm, 0),
      mill_tolerance_pct: toFloat(formValues.mill_tolerance_pct, 0),
      joint_efficiency: toFloat(formValues.joint_efficiency, 1.0),
      y_coefficient: toFloat(formValues.y_coefficient, 0.4),
      weld_strength_factor: toFloat(formValues.weld_strength_factor, 1.0),
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
                checked={formValues.code === c}
                onChange={set('code')}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">재질</label>
        <select className="field-input" value={formValues.material} onChange={set('material')}>
          {materials.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label className="field-label">설계 압력 (MPa)</label>
        <input className="field-input" type="number" step="0.1" required
          placeholder="예: 10.0" value={formValues.design_pressure_mpa} onChange={set('design_pressure_mpa')} />
      </div>

      <div className="field-group">
        <label className="field-label">설계 온도 (℃)</label>
        <input className="field-input" type="number" step="1" required
          placeholder="예: 150" value={formValues.temperature_c} onChange={set('temperature_c')} />
      </div>

      <div className="field-group">
        <label className="field-label">부식 허용치 (mm)</label>
        <input className="field-input" type="number" step="0.1" min="0"
          placeholder="0" value={formValues.corrosion_allowance_mm} onChange={set('corrosion_allowance_mm')} />
      </div>

      <div className="field-group">
        <label className="field-label">제작 공차 (%)</label>
        <input className="field-input" type="number" step="0.1" min="0" max="100"
          value={formValues.mill_tolerance_pct} onChange={set('mill_tolerance_pct')} />
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
              value={formValues.joint_efficiency} onChange={set('joint_efficiency')} />
          </div>
          <div className="field-group">
            <label className="field-label">온도 계수 (Y)</label>
            <input className="field-input" type="number" step="0.01"
              value={formValues.y_coefficient} onChange={set('y_coefficient')} />
          </div>
          {formValues.code === 'B31.3' && (
            <div className="field-group">
              <label className="field-label">용접 강도 감소 계수 (W)</label>
              <input className="field-input" type="number" step="0.01"
                value={formValues.weld_strength_factor} onChange={set('weld_strength_factor')} />
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
