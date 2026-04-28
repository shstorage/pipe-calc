import { useRef, useState } from 'react'

export default function UploadModal({ title, onUpload, onClose }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (f && f.name.endsWith('.csv')) setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async () => {
    if (!file) return
    try {
      const r = await onUpload(file)
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

        <div
          className={`drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <input ref={inputRef} type="file" accept=".csv" hidden
            onChange={(e) => handleFile(e.target.files[0])} />
          {file
            ? <p className="drop-filename">📄 {file.name}</p>
            : <p>CSV 파일을 드래그하거나 클릭하여 선택</p>
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
          <button className="btn-primary" onClick={handleSubmit} disabled={!file}>업로드</button>
        </div>
      </div>
    </div>
  )
}
