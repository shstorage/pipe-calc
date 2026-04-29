import { useRef, useState } from 'react'

const ACCEPT = '.csv,.xlsx,.xls'

function isValidFile(f) {
  return f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))
}

export default function UploadModal({ title, onUpload, onClose }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState('add')
  const [result, setResult] = useState(null)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (isValidFile(f)) { setFile(f); setResult(null) }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async () => {
    if (!file) return
    try {
      const r = await onUpload(file, mode)
      setResult(r.data)
    } catch {
      setResult({ error: '업로드 실패' })
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="upload-mode-bar">
          <label className={`mode-btn ${mode === 'add' ? 'active' : ''}`}>
            <input type="radio" name="mode" value="add" checked={mode === 'add'}
              onChange={() => setMode('add')} />
            추가
          </label>
          <label className={`mode-btn ${mode === 'replace' ? 'active' : ''}`}>
            <input type="radio" name="mode" value="replace" checked={mode === 'replace'}
              onChange={() => setMode('replace')} />
            교체
          </label>
          <span className="mode-desc">
            {mode === 'add'
              ? '기존 데이터 유지, 파일 순서대로 ID 추가'
              : '기존 데이터 전체 삭제 후 파일로 교체'}
          </span>
        </div>

        {mode === 'replace' && (
          <div className="replace-warning">
            기존 데이터가 모두 삭제됩니다.
          </div>
        )}

        <div
          className={`drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <input ref={inputRef} type="file" accept={ACCEPT} hidden
            onChange={(e) => handleFile(e.target.files[0])} />
          {file
            ? <p className="drop-filename">📄 {file.name}</p>
            : <p>CSV 또는 Excel(.xlsx) 파일을 드래그하거나 클릭하여 선택</p>
          }
        </div>

        {result && (
          <div className={`upload-result ${result.error ? 'error' : 'success'}`}>
            {result.error
              ? result.error
              : `등록 ${result.inserted}건 / 중복 스킵 ${result.skipped}건`}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>닫기</button>
          <button
            className={`btn-primary ${mode === 'replace' ? 'btn-danger' : ''}`}
            onClick={handleSubmit}
            disabled={!file}
          >
            {mode === 'add' ? '추가' : '교체'}
          </button>
        </div>
      </div>
    </div>
  )
}
