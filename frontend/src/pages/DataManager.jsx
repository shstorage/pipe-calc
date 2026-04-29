import { useState, useEffect, useCallback } from 'react'
import {
  getPipeSchedules, deletePipeSchedule, uploadPipeFile,
  getAllowableStresses, deleteAllowableStress, uploadStressCSV,
} from '../api/client'
import UploadModal from '../components/UploadModal'

const TABS = ['배관 스케줄', '허용응력']

function fmt(val, digits = 2) {
  if (val === null || val === undefined) return <span className="cell-null">-</span>
  return typeof val === 'number' ? val.toFixed(digits).replace(/\.?0+$/, '') : val
}

export default function DataManager() {
  const [tab, setTab] = useState(0)
  const [pipeRows, setPipeRows] = useState([])
  const [stressRows, setStressRows] = useState([])
  const [pipeFilter, setPipeFilter] = useState({ standard: '', dn: '' })
  const [stressFilter, setStressFilter] = useState({ code: '', material: '' })
  const [showModal, setShowModal] = useState(false)
  const [pipeError, setPipeError] = useState(null)

  const loadPipe = useCallback(() => {
    const params = {}
    if (pipeFilter.standard) params.standard = pipeFilter.standard
    if (pipeFilter.dn) params.dn = pipeFilter.dn
    getPipeSchedules(params)
      .then((r) => { setPipeRows(r.data); setPipeError(null) })
      .catch(() => setPipeError('데이터를 불러오지 못했습니다.'))
  }, [pipeFilter])

  const loadStress = useCallback(() => {
    const params = {}
    if (stressFilter.code) params.code = stressFilter.code
    if (stressFilter.material) params.material = stressFilter.material
    getAllowableStresses(params).then((r) => setStressRows(r.data))
  }, [stressFilter])

  useEffect(() => { loadPipe() }, [loadPipe])
  useEffect(() => { loadStress() }, [loadStress])

  const handleDeletePipe = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deletePipeSchedule(id)
    loadPipe()
  }

  const handleDeleteStress = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteAllowableStress(id)
    loadStress()
  }

  const handleUpload = (file, mode) =>
    tab === 0 ? uploadPipeFile(file, mode) : uploadStressCSV(file, mode)

  const afterUpload = () => { tab === 0 ? loadPipe() : loadStress() }

  return (
    <div className="data-manager">
      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button key={t} className={`tab-btn ${tab === i ? 'active' : ''}`}
            onClick={() => setTab(i)}>{t}</button>
        ))}
        <button className="btn-primary ml-auto" onClick={() => setShowModal(true)}>
          파일 업로드
        </button>
      </div>

      {tab === 0 && (
        <>
          <div className="filter-bar">
            <select className="field-input sm" value={pipeFilter.standard}
              onChange={(e) => setPipeFilter((f) => ({ ...f, standard: e.target.value }))}>
              <option value="">전체 규격</option>
              <option>B36.10</option>
              <option>B36.19</option>
            </select>
            <input className="field-input sm" placeholder="DN" type="number"
              value={pipeFilter.dn}
              onChange={(e) => setPipeFilter((f) => ({ ...f, dn: e.target.value }))} />
          </div>

          {pipeError && <div className="error-msg">{pipeError}</div>}

          <div className="table-wrapper">
            <table className="result-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>규격</th>
                  <th>DN</th>
                  <th>NPS</th>
                  <th>스케줄</th>
                  <th>Identification</th>
                  <th>OD (mm)</th>
                  <th>두께 (mm)</th>
                  <th>단중 (kg/m)</th>
                  <th>OD (in)</th>
                  <th>두께 (in)</th>
                  <th>단중 (lb/ft)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pipeRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.standard}</td>
                    <td>{r.dn}</td>
                    <td>{fmt(r.nps, 3)}</td>
                    <td>{r.schedule ?? <span className="cell-null">-</span>}</td>
                    <td>{r.identification ?? <span className="cell-null">-</span>}</td>
                    <td>{fmt(r.od_mm)}</td>
                    <td>{fmt(r.wt_mm)}</td>
                    <td>{fmt(r.mass_kg_m)}</td>
                    <td>{fmt(r.od_in, 3)}</td>
                    <td>{fmt(r.wt_in, 3)}</td>
                    <td>{fmt(r.mass_lb_ft)}</td>
                    <td>
                      <button className="btn-delete" onClick={() => handleDeletePipe(r.id)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 1 && (
        <>
          <div className="filter-bar">
            <select className="field-input sm" value={stressFilter.code}
              onChange={(e) => setStressFilter((f) => ({ ...f, code: e.target.value }))}>
              <option value="">전체 코드</option>
              <option>B31.1</option>
              <option>B31.3</option>
            </select>
            <input className="field-input sm" placeholder="재질 검색"
              value={stressFilter.material}
              onChange={(e) => setStressFilter((f) => ({ ...f, material: e.target.value }))} />
          </div>
          <div className="table-wrapper">
            <table className="result-table">
              <thead>
                <tr>
                  <th>ID</th><th>코드</th><th>재질</th>
                  <th>온도 (℃)</th><th>허용응력 (MPa)</th><th></th>
                </tr>
              </thead>
              <tbody>
                {stressRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td><td>{r.code}</td><td>{r.material}</td>
                    <td>{r.temp_c}</td><td>{r.stress_mpa}</td>
                    <td>
                      <button className="btn-delete" onClick={() => handleDeleteStress(r.id)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <UploadModal
          title={tab === 0 ? '배관 스케줄 업로드' : '허용응력 CSV 업로드'}
          onUpload={handleUpload}
          onClose={() => { setShowModal(false); afterUpload() }}
        />
      )}
    </div>
  )
}
