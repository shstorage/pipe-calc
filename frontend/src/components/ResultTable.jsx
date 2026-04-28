export default function ResultTable({ results }) {
  if (!results) return null

  return (
    <div className="result-card card">
      <h2 className="form-title">계산 결과</h2>
      {results.length === 0 ? (
        <p className="empty-msg">결과 없음</p>
      ) : (
        <div className="table-wrapper">
          <table className="result-table">
            <thead>
              <tr>
                <th>DN</th>
                <th>NPS</th>
                <th>OD (mm)</th>
                <th>요구 두께 (mm)</th>
                <th>최소 만족 스케줄</th>
                <th>두께 (mm)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => {
                const min = row.satisfied_schedules.find((s) => s.is_minimum)
                return (
                  <tr key={row.dn} className={!min ? 'row-fail' : ''}>
                    <td>{row.dn}</td>
                    <td>{formatNps(row.nps)}</td>
                    <td>{row.od_mm}</td>
                    <td className="t-req">{row.t_required_mm}</td>
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
