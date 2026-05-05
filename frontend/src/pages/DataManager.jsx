import { useState, useEffect, useCallback } from 'react'
import {
  getPipeSchedules, deletePipeSchedule, uploadPipeFile, exportPipeSchedule,
  getAllowableStresses, deleteAllowableStress, uploadStressFile,
  exportAllowableStress, downloadStressTemplate, getStressMeta,
} from '../api/client'
import UploadModal from '../components/UploadModal'

const TABS = ['배관 스케줄', '허용응력']

function fmt(val, digits = 2) {
  if (val === null || val === undefined) return <span className="cell-null">-</span>
  return typeof val === 'number' ? val.toFixed(digits).replace(/\.?0+$/, '') : val
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function DataManager() {
  const [tab, setTab] = useState(0)
  const [pipeRows, setPipeRows] = useState([])
  const [stressRows, setStressRows] = useState([])
  const [pipeFilter, setPipeFilter] = useState({ standard: '', dn: '' })
  const [stressFilter, setStressFilter] = useState({ code: '', edition: '', spec_no: '', grade: '' })
  const [stressMeta, setStressMeta] = useState({ codes: [], editions: [], specs: [] })
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
    if (stressFilter.edition) params.edition = stressFilter.edition
    if (stressFilter.spec_no) params.spec_no = stressFilter.spec_no
    if (stressFilter.grade) params.grade = stressFilter.grade
    getAllowableStresses(params).then((r) => setStressRows(r.data))
  }, [stressFilter])

  useEffect(() => { loadPipe() }, [loadPipe])
  useEffect(() => { loadStress() }, [loadStress])
  useEffect(() => {
    getStressMeta().then((r) => setStressMeta(r.data))
  }, [])

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
    tab === 0 ? uploadPipeFile(file, mode) : uploadStressFile(file, mode)

  const afterUpload = () => { tab === 0 ? loadPipe() : loadStress() }

  const handleExport = async () => {
    try {
      const res = tab === 0
        ? await exportPipeSchedule(pipeFilter.standard || undefined)
        : await exportAllowableStress(
            stressFilter.code || undefined,
            stressFilter.edition || undefined,
          )
      const name = tab === 0
        ? `pipe_schedule_${pipeFilter.standard || 'all'}.xlsx`
        : `allowable_stress_${[stressFilter.code, stressFilter.edition].filter(Boolean).join('_') || 'all'}.xlsx`
      downloadBlob(new Blob([res.data]), name)
    } catch {
      alert('다운로드에 실패했습니다.')
    }
  }

  const handleTemplate = async () => {
    try {
      const res = await downloadStressTemplate()
      downloadBlob(new Blob([res.data]), 'allowable_stress_template.xlsx')
    } catch {
      alert('양식 다운로드에 실패했습니다.')
    }
  }

  return (
    <div className="data-manager">
      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button key={t} className={`tab-btn ${tab === i ? 'active' : ''}`}
            onClick={() => setTab(i)}>{t}</button>
        ))}
        <div className="tab-bar-actions">
          {tab === 1 && (
            <button className="btn-ghost" onClick={handleTemplate}
              title="빈 양식 다운로드 → 편집 후 업로드로 대량 추가">
              양식 다운로드
            </button>
          )}
          <button className="btn-secondary" onClick={handleExport}>
            Excel 다운로드
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            파일 업로드
          </button>
        </div>
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
                  <th>ID</th><th>규격</th><th>DN</th><th>NPS</th>
                  <th>스케줄</th><th>Identification</th>
                  <th>OD (mm)</th><th>두께 (mm)</th><th>단중 (kg/m)</th>
                  <th>OD (in)</th><th>두께 (in)</th><th>단중 (lb/ft)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pipeRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td><td>{r.standard}</td><td>{r.dn}</td>
                    <td>{fmt(r.nps, 3)}</td>
                    <td>{r.schedule ?? <span className="cell-null">-</span>}</td>
                    <td>{r.identification ?? <span className="cell-null">-</span>}</td>
                    <td>{fmt(r.od_mm)}</td><td>{fmt(r.wt_mm)}</td>
                    <td>{fmt(r.mass_kg_m)}</td><td>{fmt(r.od_in, 3)}</td>
                    <td>{fmt(r.wt_in, 3)}</td><td>{fmt(r.mass_lb_ft)}</td>
                    <td>
                      <button className="btn-delete"
                        onClick={() => handleDeletePipe(r.id)}>삭제</button>
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
              {stressMeta.codes.length > 0
                ? stressMeta.codes.map((c) => <option key={c}>{c}</option>)
                : <><option>B31.1</option><option>B31.3</option></>}
            </select>
            <select className="field-input sm" value={stressFilter.edition}
              onChange={(e) => setStressFilter((f) => ({ ...f, edition: e.target.value }))}>
              <option value="">전체 년판</option>
              {stressMeta.editions.map((ed) => <option key={ed}>{ed}</option>)}
            </select>
            <input className="field-input sm" placeholder="Spec (예: A106)"
              value={stressFilter.spec_no}
              onChange={(e) => setStressFilter((f) => ({ ...f, spec_no: e.target.value }))} />
            <input className="field-input sm" placeholder="Grade (예: P91)"
              value={stressFilter.grade}
              onChange={(e) => setStressFilter((f) => ({ ...f, grade: e.target.value }))} />
          </div>

          <div className="table-wrapper">
            <table className="result-table stress-table">
              <thead>
                <tr>
                  <th>ID</th><th>코드</th><th>년판</th><th>Spec</th><th>Grade</th>
                  <th>Type/Class</th><th>조성</th><th>P-No.</th>
                  <th>온도 (℃)</th><th>S (MPa)</th><th>Creep</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stressRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td><td>{r.code}</td>
                    <td>{r.edition || <span className="cell-null">-</span>}</td>
                    <td>{r.spec_no}</td><td>{r.grade}</td>
                    <td>{r.type_or_class || <span className="cell-null">-</span>}</td>
                    <td>{r.nominal_comp || <span className="cell-null">-</span>}</td>
                    <td>{r.p_no || <span className="cell-null">-</span>}</td>
                    <td>{fmt(r.temp_c, 1)}</td>
                    <td>{fmt(r.stress_mpa)}</td>
                    <td>{r.is_creep ? <span className="badge-creep">●</span> : ''}</td>
                    <td>
                      <button className="btn-delete"
                        onClick={() => handleDeleteStress(r.id)}>삭제</button>
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
          title={tab === 0 ? '배관 스케줄 업로드' : '허용응력 업로드'}
          onUpload={handleUpload}
          onClose={() => { setShowModal(false); afterUpload() }}
        />
      )}
    </div>
  )
}
