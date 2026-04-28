import { useState } from 'react'
import Calculator from './pages/Calculator'
import DataManager from './pages/DataManager'
import './App.css'

export default function App() {
  const [page, setPage] = useState('calc')

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
        {page === 'calc' ? <Calculator /> : <DataManager />}
      </main>
    </div>
  )
}
