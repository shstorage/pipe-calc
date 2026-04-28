import { useState } from 'react'
import InputForm from '../components/InputForm'
import ResultTable from '../components/ResultTable'
import { calculate } from '../api/client'

export default function Calculator() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCalculate = async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const r = await calculate(payload)
      setResults(r.data.results)
    } catch (e) {
      setError(e.response?.data?.detail ?? '계산 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="calc-layout">
      <InputForm onCalculate={handleCalculate} loading={loading} />
      <div className="result-area">
        {error && <div className="error-msg">{error}</div>}
        <ResultTable results={results} />
      </div>
    </div>
  )
}
