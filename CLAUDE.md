# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ASME B31.1 / B31.3 배관 최소 요구 두께 계산 웹 앱. FastAPI 백엔드 + React 19 / Vite 8 프론트엔드. SQLite DB에 배관 스케줄(ASME B36.10/B36.19)과 허용응력 테이블을 저장하고, 설계 조건 입력 시 전 사이즈(DN 15~600)의 최소 만족 스케줄을 반환한다.

## Commands

### Backend

```bash
uv sync                                          # 의존성 설치
uv run uvicorn main:app --reload --port 8000     # 개발 서버 (http://localhost:8000)
uv run python database/seed_pipe.py              # B36.10/B36.19 배관 스케줄 초기 데이터
uv run python database/seed_allowable.py         # 허용응력 초기 데이터
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

Vite dev server는 `/api` 경로를 `http://localhost:8000`으로 프록시한다(`vite.config.js`).

## Architecture

```
pipe-calc/
  main.py                  # FastAPI 앱 엔트리, CORS, 라우터 등록
  pipe_calc.db             # SQLite DB (자동 생성)
  database/
    db.py                  # SQLAlchemy engine / SessionLocal / get_db
    models.py              # PipeSchedule, AllowableStress ORM 모델
    seed_pipe.py           # B36.10/B36.19 seed (DN 15~600)
    seed_allowable.py      # A106 Gr.B / A312 TP304 허용응력 seed
  routers/
    pipe_table.py          # GET/POST/DELETE /api/pipe-schedule
    allowable_stress.py    # GET/POST/DELETE /api/allowable-stress
    calculation.py         # POST /api/calculate, GET /api/materials
  schemas/
    pipe_table.py          # PipeScheduleOut (Pydantic)
    allowable_stress.py    # AllowableStressOut (Pydantic)
  frontend/src/
    App.jsx                # 헤더 네비게이션, 페이지 전환 (calc / data)
    api/client.js          # axios 인스턴스 및 API 함수 모음
    components/
      InputForm.jsx        # 설계 조건 입력 폼 (코드, 재질, 압력, 온도 등)
      ResultTable.jsx      # 계산 결과 테이블
      UploadModal.jsx      # CSV 드래그&드롭 업로드 모달
    pages/
      Calculator.jsx       # 메인 계산 페이지
      DataManager.jsx      # 배관 스케줄 / 허용응력 조회·삭제·업로드
```

## Key Logic

**두께 계산 공식** (`routers/calculation.py`):
- B31.1: `t = PD / (2(SE + PY)) + c`
- B31.3: `t = PD / (2(SEW + PY)) + c`
- 입력 온도가 테이블 사이에 있으면 선형 보간 (`interpolate_stress`)

**DB 고유 제약**:
- `pipe_schedule`: `UNIQUE(standard, dn, schedule)`
- `allowable_stress`: `UNIQUE(code, material, temp_c)`
- CSV 업로드 시 중복은 rollback 후 skipped 카운트로 처리

**CSV 업로드 포맷**:
```
# pipe_schedule
standard,dn,nps,schedule,od_mm,wt_mm

# allowable_stress
code,material,temp_c,stress_mpa
```
