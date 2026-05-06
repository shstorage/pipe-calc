import { useState } from 'react'
import Calculator from './pages/Calculator'
import DataManager from './pages/DataManager'
import { calculate } from './api/client'
import './App.css'

const INITIAL_FORM = {
  material_key: '',
  design_pressure_barg: '',
  temperature_c: '',
  corrosion_allowance_mm: '1.5',
  mill_tolerance_pct: '12.5',
  joint_efficiency: '1.0',
  y_coefficient: '',       // 비워두면 Table 104.1.2-1 자동
  weld_strength_factor: '', // 비워두면 Table 102.4.7-1 자동
}

export default function App() {
  const [page, setPage] = useState('calc')
  const [formValues, setFormValues] = useState(INITIAL_FORM)

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pipeStandard, setPipeStandard] = useState('B36.10')
  const [calcInfo, setCalcInfo] = useState(null)
  const [dnMin, setDnMin] = useState('')
  const [dnMax, setDnMax] = useState('')

  const runCalculate = async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const r = await calculate(payload)
      setResults(r.data.results)
      setCalcInfo({
        allowable_stress_mpa: r.data.allowable_stress_mpa,
        y_coefficient: r.data.y_coefficient,
        w_factor: r.data.w_factor,
        pipe_standard: payload.pipe_standard,
      })
    } catch (e) {
      const detail = e.response?.data?.detail
      setError(
        Array.isArray(detail)
          ? detail.map((d) => d.msg ?? JSON.stringify(d)).join(' / ')
          : (detail ?? '계산 중 오류가 발생했습니다.')
      )
    } finally {
      setLoading(false)
    }
  }

  // p_no === '8' (Austenitic SS) → B36.19, 그 외 → B36.10
  const handleCalculate = (formPayload) => {
    const { _p_no, ...payload } = formPayload
    const std = _p_no === '8' ? 'B36.19' : 'B36.10'
    setPipeStandard(std)
    runCalculate({ ...payload, pipe_standard: std })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <span className="logo">🔧 배관 두께 계산기</span>
          <nav className="header-nav">
            <button
              className={`nav-btn ${page === 'calc' ? 'active' : ''}`}
              onClick={() => setPage('calc')}
            >
              계산
            </button>
            <button
              className={`nav-btn ${page === 'data' ? 'active' : ''}`}
              onClick={() => setPage('data')}
            >
              데이터 관리
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {page === 'calc' ? (
          <Calculator
            formValues={formValues}
            onFormChange={setFormValues}
            results={results}
            loading={loading}
            error={error}
            calcInfo={calcInfo}
            pipeStandard={pipeStandard}
            dnMin={dnMin}
            dnMax={dnMax}
            onCalculate={handleCalculate}
            onDnMinChange={setDnMin}
            onDnMaxChange={setDnMax}
          />
        ) : (
          <DataManager />
        )}
      </main>
    </div>
  )
}
