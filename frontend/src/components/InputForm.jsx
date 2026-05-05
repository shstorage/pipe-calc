import { useState, useEffect } from 'react'
import { getMaterials } from '../api/client'

const toFloat = (v, fallback = 0) => {
  const n = parseFloat(v)
  return isNaN(n) ? fallback : n
}

function parseKey(key) {
  const [spec_no, grade, type_or_class] = (key || '').split('||')
  return { spec_no: spec_no || '', grade: grade || '', type_or_class: type_or_class || '' }
}

export default function InputForm({ formValues, onFormChange, onCalculate, loading }) {
  const [materials, setMaterials] = useState([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const set = (k) => (e) => onFormChange((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    getMaterials(formValues.code).then((r) => {
      setMaterials(r.data)
      const list = r.data
      if (list.length === 0) return
      const exists = list.find((m) => m.key === formValues.material_key)
      if (!exists) {
        onFormChange((f) => ({ ...f, material_key: list[0].key }))
      }
    })
  }, [formValues.code]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e) => {
    e.preventDefault()
    const mat = parseKey(formValues.material_key)
    onCalculate({
      code: formValues.code,
      spec_no: mat.spec_no,
      grade: mat.grade,
      type_or_class: mat.type_or_class,
      design_pressure_mpa: toFloat(formValues.design_pressure_mpa),
      temperature_c: toFloat(formValues.temperature_c),
      corrosion_allowance_mm: toFloat(formValues.corrosion_allowance_mm, 0),
      mill_tolerance_pct: toFloat(formValues.mill_tolerance_pct, 0),
      joint_efficiency: toFloat(formValues.joint_efficiency, 1.0),
      y_coefficient: formValues.y_coefficient === '' ? null : toFloat(formValues.y_coefficient, 0.4),
      weld_strength_factor: toFloat(formValues.weld_strength_factor, 1.0),
    })
  }

  const selectedMat = materials.find((m) => m.key === formValues.material_key)

  return (
    <form className="input-form card" onSubmit={handleSubmit}>
      <h2 className="form-title">설계 조건</h2>

      <div className="field-group">
        <label className="field-label">적용 코드</label>
        <div className="radio-group">
          {['B31.1', 'B31.3'].map((c) => (
            <label key={c} className="radio-label">
              <input type="radio" name="code" value={c}
                checked={formValues.code === c} onChange={set('code')} />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">재질</label>
        <select className="field-input" value={formValues.material_key}
          onChange={set('material_key')}>
          {materials.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
        {selectedMat && (
          <div className="mat-info">
            {selectedMat.nominal_comp} · P-No.{selectedMat.p_no}
          </div>
        )}
      </div>

      <div className="field-group">
        <label className="field-label">설계 압력 (MPa)</label>
        <input className="field-input" type="number" step="0.1" required
          placeholder="예: 10.0" value={formValues.design_pressure_mpa}
          onChange={set('design_pressure_mpa')} />
      </div>

      <div className="field-group">
        <label className="field-label">설계 온도 (℃)</label>
        <input className="field-input" type="number" step="1" required
          placeholder="예: 350" value={formValues.temperature_c}
          onChange={set('temperature_c')} />
      </div>

      <div className="field-group">
        <label className="field-label">부식 허용치 (mm)</label>
        <input className="field-input" type="number" step="0.1" min="0"
          placeholder="0" value={formValues.corrosion_allowance_mm}
          onChange={set('corrosion_allowance_mm')} />
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
            <label className="field-label">용접 이음 효율 E</label>
            <input className="field-input" type="number" step="0.01" min="0" max="1"
              placeholder="Seamless=1.0 / ERW=0.85"
              value={formValues.joint_efficiency} onChange={set('joint_efficiency')} />
          </div>
          <div className="field-group">
            <label className="field-label">온도 계수 Y</label>
            <input className="field-input" type="number" step="0.01"
              placeholder="비워두면 자동 (0.4 / 0.5 / 0.7)"
              value={formValues.y_coefficient} onChange={set('y_coefficient')} />
            <span className="field-hint">비워두면 B31.1 Table 104.1.2(A) 자동 적용</span>
          </div>
          {formValues.code === 'B31.3' && (
            <div className="field-group">
              <label className="field-label">용접 강도 감소 계수 W</label>
              <input className="field-input" type="number" step="0.01"
                value={formValues.weld_strength_factor}
                onChange={set('weld_strength_factor')} />
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
