export default function ResultTable({
  results,
  pipeStandard, onStandardChange,
  dnMin, dnMax, onDnMinChange, onDnMaxChange,
}) {
  const displayResults = results
    ? results.filter((row) => {
        const lo = dnMin === '' ? -Infinity : parseInt(dnMin, 10)
        const hi = dnMax === '' ? Infinity : parseInt(dnMax, 10)
        return row.dn >= lo && row.dn <= hi
      })
    : null

  return (
    <div className="result-card card">
      <div className="result-header">
        <h2 className="form-title">계산 결과</h2>
        <div className="result-controls">
          <div className="result-control-group">
            <span className="field-label">적용 규격</span>
            <div className="radio-group">
              {['B36.10', 'B36.19'].map((s) => (
                <label key={s} className="radio-label">
                  <input
                    type="radio"
                    name="pipe_standard"
                    value={s}
                    checked={pipeStandard === s}
                    onChange={() => onStandardChange(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div className="result-control-group">
            <span className="field-label">DN 범위</span>
            <div className="dn-range-inputs">
              <input
                className="field-input dn-input"
                type="number"
                placeholder="최소"
                value={dnMin}
                onChange={(e) => onDnMinChange(e.target.value)}
              />
              <span className="dn-sep">~</span>
              <input
                className="field-input dn-input"
                type="number"
                placeholder="최대"
                value={dnMax}
                onChange={(e) => onDnMaxChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {results === null ? (
        <div className="result-placeholder">
          설계 조건을 입력하고 <strong>계산하기</strong> 버튼을 눌러주세요.
        </div>
      ) : displayResults.length === 0 ? (
        <p className="empty-msg">해당 DN 범위에 결과가 없습니다.</p>
      ) : (
        <div className="table-wrapper">
          <table className="result-table">
            <thead>
              <tr>
                <th>DN</th>
                <th>NPS</th>
                <th>OD (mm)</th>
                <th>최소 요구 두께 (mm)</th>
                <th>공칭 두께 (mm)</th>
                <th>최소 만족 스케줄</th>
                <th>두께 (mm)</th>
              </tr>
            </thead>
            <tbody>
              {displayResults.map((row) => {
                const min = row.satisfied_schedules.find((s) => s.is_minimum)
                return (
                  <tr key={row.dn} className={!min ? 'row-fail' : ''}>
                    <td>{row.dn}</td>
                    <td>{formatNps(row.nps)}</td>
                    <td>{row.od_mm}</td>
                    <td className="t-req">{row.t_required_mm}</td>
                    <td className="t-nominal">{row.t_nominal_mm}</td>
                    <td>
                      {min ? (
                        <span className="badge badge-ok">{min.schedule}</span>
                      ) : (
                        <span className="badge badge-fail">해당 없음</span>
                      )}
                    </td>
                    <td>{min ? min.wt_mm : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatNps(nps) {
  const map = {
    0.5: '½"', 0.75: '¾"', 1: '1"', 1.25: '1¼"', 1.5: '1½"',
    2: '2"', 2.5: '2½"', 3: '3"', 3.5: '3½"', 4: '4"',
    5: '5"', 6: '6"', 8: '8"', 10: '10"', 12: '12"',
    14: '14"', 16: '16"', 18: '18"', 20: '20"', 22: '22"', 24: '24"',
  }
  return map[nps] ?? `${nps}"`
}
