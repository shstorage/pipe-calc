import { useState } from 'react'
import Calculator from './pages/Calculator'
import DataManager from './pages/DataManager'
import { calculate } from './api/client'
import './App.css'

const INITIAL_FORM = {
  code: 'B31.1',
  material_key: '',   // "{spec_no}||{grade}||{type_or_class}"
  design_pressure_mpa: '',
  temperature_c: '',
  corrosion_allowance_mm: '1.5',
  mill_tolerance_pct: '12.5',
  joint_efficiency: '1.0',
  y_coefficient: '',  // 비워두면 B31.1 Table 104.1.2(A) 자동
  weld_strength_factor: '1.0',
}

export default function App() {
  const [page, setPage] = useState('calc')
  const [formValues, setFormValues] = useState(INITIAL_FORM)

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFormPayload, setLastFormPayload] = useState(null)
  const [pipeStandard, setPipeStandard] = useState('B36.10')
  const [dnMin, setDnMin] = useState('')
  const [dnMax, setDnMax] = useState('')

  const runCalculate = async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const r = await calculate(payload)
      setResults(r.data.results)
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

  const handleCalculate = (formPayload) => {
    setLastFormPayload(formPayload)
    runCalculate({ ...formPayload, pipe_standard: pipeStandard })
  }

  const handleStandardChange = (std) => {
    setPipeStandard(std)
    if (lastFormPayload) {
      runCalculate({ ...lastFormPayload, pipe_standard: std })
    }
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
            pipeStandard={pipeStandard}
            dnMin={dnMin}
            dnMax={dnMax}
            onCalculate={handleCalculate}
            onStandardChange={handleStandardChange}
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
