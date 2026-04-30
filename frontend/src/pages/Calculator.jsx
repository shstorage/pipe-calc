import InputForm from '../components/InputForm'
import ResultTable from '../components/ResultTable'

export default function Calculator({
  formValues, onFormChange,
  results, loading, error,
  pipeStandard, dnMin, dnMax,
  onCalculate, onStandardChange, onDnMinChange, onDnMaxChange,
}) {
  return (
    <div className="calc-layout">
      <InputForm
        formValues={formValues}
        onFormChange={onFormChange}
        onCalculate={onCalculate}
        loading={loading}
      />
      <div className="result-area">
        {error && <div className="error-msg">{error}</div>}
        <ResultTable
          results={results}
          pipeStandard={pipeStandard}
          dnMin={dnMin}
          dnMax={dnMax}
          onStandardChange={onStandardChange}
          onDnMinChange={onDnMinChange}
          onDnMaxChange={onDnMaxChange}
        />
      </div>
    </div>
  )
}
