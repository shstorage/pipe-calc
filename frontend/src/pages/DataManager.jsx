import { useState, useEffect, useCallback } from 'react'
import {
  getPipeSchedules, deletePipeSchedule, uploadPipeCSV,
  getAllowableStresses, deleteAllowableStress, uploadStressCSV,
} from '../api/client'
import UploadModal from '../components/UploadModal'

const TABS = ['배관 스케줄', '허용응력']

export default function DataManager() {
  const [tab, setTab] = useState(0)
  const [pipeRows, setPipeRows] = useState([])
  const [stressRows, setStressRows] = useState([])
  const [pipeFilter, setPipeFilter] = useState({ standard: '', dn: '' })
  const [stressFilter, setStressFilter] = useState({ code: '', material: '' })
  const [showModal, setShowModal] = useState(false)

  const loadPipe = useCallback(() => {
    const params = {}
    if (pipeFilter.standard) params.standard = pipeFilter.standard
    if (pipeFilter.dn) params.dn = pipeFilter.dn
    getPipeSchedules(params).then((r) => setPipeRows(r.data))
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

  const handleUpload = (file) =>
    tab === 0 ? uploadPipeCSV(file) : uploadStressCSV(file)

  const afterUpload = () => { tab === 0 ? loadPipe() : loadStress() }

  return (
    <div className="data-manager">
      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button key={t} className={`tab-btn ${tab === i ? 'active' : ''}`}
            onClick={() => setTab(i)}>{t}</button>
        ))}
        <button className="btn-primary ml-auto" onClick={() => setShowModal(true)}>
          CSV 업로드
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
          <div className="table-wrapper">
            <table className="result-table">
              <thead><tr>
                <th>ID</th><th>규격</th><th>DN</th><th>NPS</th>
                <th>스케줄</th><th>OD (mm)</th><th>두께 (mm)</th><th></th>
              </tr></thead>
              <tbody>
                {pipeRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td><td>{r.standard}</td><td>{r.dn}</td>
                    <td>{r.nps}</td><td>{r.schedule}</td>
                    <td>{r.od_mm}</td><td>{r.wt_mm}</td>
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
              <thead><tr>
                <th>ID</th><th>코드</th><th>재질</th>
                <th>온도 (℃)</th><th>허용응력 (MPa)</th><th></th>
              </tr></thead>
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
          title={tab === 0 ? '배관 스케줄 CSV 업로드' : '허용응력 CSV 업로드'}
          onUpload={handleUpload}
          onClose={() => { setShowModal(false); afterUpload() }}
        />
      )}
    </div>
  )
}
