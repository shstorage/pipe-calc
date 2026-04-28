# 배관 두께 계산 웹 프로그램 설계서

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | pipe-calc |
| 목적 | ASME B31.1 / B31.3 기준 배관 최소 요구 두께 계산 |
| 프론트엔드 | React 19 + Vite 8 (Node LTS, nvm-windows) |
| 백엔드 | FastAPI + Uvicorn (Python, uv 가상환경) |
| DB | SQLite (sqlite3 내장 모듈) |
| 디자인 | 토스 스타일 (Clean, Sans-serif, 카드 기반 레이아웃) |

---

## 2. 디렉터리 구조

```
pipe-calc/
├── .venv/                        # uv 가상환경
├── .python-version
├── pyproject.toml
├── uv.lock
├── main.py                       # FastAPI 엔트리포인트
├── database/
│   ├── db.py                     # SQLite 연결 및 세션 관리
│   ├── models.py                 # SQLAlchemy ORM 모델
│   ├── seed_pipe.py              # ASME B36.10/36.19 초기 데이터 입력 스크립트
│   └── seed_allowable.py        # 허용응력 초기 데이터 입력 스크립트
├── routers/
│   ├── pipe_table.py             # 배관 테이블 CRUD API
│   ├── allowable_stress.py       # 허용응력 CRUD API
│   └── calculation.py            # 두께 계산 API
├── schemas/
│   ├── pipe_table.py             # Pydantic 스키마
│   └── allowable_stress.py
├── pipe_calc.db                  # SQLite DB 파일 (자동 생성)
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   └── client.js         # axios 인스턴스 및 API 함수
        ├── components/
        │   ├── InputForm.jsx      # 설계 조건 입력 폼
        │   ├── ResultTable.jsx    # 계산 결과 테이블
        │   └── UploadModal.jsx    # CSV/JSON 업로드 모달
        └── pages/
            ├── Calculator.jsx     # 메인 계산 페이지
            └── DataManager.jsx    # DB 데이터 관리 페이지
```

---

## 3. 데이터베이스 스키마

### 3-1. pipe_schedule 테이블 (ASME B36.10 / B36.19)

```sql
CREATE TABLE pipe_schedule (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    standard    TEXT NOT NULL,          -- 'B36.10' or 'B36.19'
    dn          INTEGER NOT NULL,       -- DN (mm 기준 공칭경)
    nps         REAL NOT NULL,          -- NPS (inch 기준 공칭경)
    schedule    TEXT NOT NULL,          -- 'SCH 40', 'SCH 80', 'XXS' 등
    od_mm       REAL NOT NULL,          -- 외경 (mm)
    wt_mm       REAL NOT NULL,          -- 공칭 두께 (mm)
    UNIQUE(standard, dn, schedule)
);
```

### 3-2. allowable_stress 테이블 (ASME B31.1 / B31.3)

```sql
CREATE TABLE allowable_stress (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    code            TEXT NOT NULL,      -- 'B31.1' or 'B31.3'
    material        TEXT NOT NULL,      -- 'A106 Gr.B', 'A312 TP304' 등
    temp_c          REAL NOT NULL,      -- 적용 온도 (℃)
    stress_mpa      REAL NOT NULL,      -- 허용응력 (MPa)
    UNIQUE(code, material, temp_c)
);
```

### CSV 업로드 포맷 (pipe_schedule)

```
standard,dn,nps,schedule,od_mm,wt_mm
B36.10,15,0.5,SCH 40,21.3,2.77
B36.10,15,0.5,SCH 80,21.3,3.73
...
```

### CSV 업로드 포맷 (allowable_stress)

```
code,material,temp_c,stress_mpa
B31.1,A106 Gr.B,20,138.0
B31.1,A106 Gr.B,100,138.0
B31.3,A106 Gr.B,20,138.0
...
```

---

## 4. 두께 계산 공식

### ASME B31.1

```
t_min = (P * D) / (2 * (S * E + P * Y)) + c

P : 설계 압력 (MPa)
D : 외경 (mm)
S : 허용응력 (MPa)
E : 용접 이음 효율 (기본값 1.0)
Y : 온도 계수 (기본값 0.4, 482℃ 미만 ferritic steel)
c : 부식 허용치 (mm)
```

### ASME B31.3

```
t_min = (P * D) / (2 * (S * E * W + P * Y)) + c

W : 용접 강도 감소 계수 (기본값 1.0)
(나머지 변수 동일)
```

---

## 5. API 엔드포인트 설계

### 계산 API

```
POST /api/calculate
Content-Type: application/json

Request:
{
  "code": "B31.1",              // 적용 코드
  "material": "A106 Gr.B",      // 재질
  "design_pressure_mpa": 10.0,  // 설계 압력 (MPa)
  "temperature_c": 150.0,       // 설계 온도 (℃)
  "corrosion_allowance_mm": 1.5,// 부식 허용치 (mm)
  "joint_efficiency": 1.0,      // 용접 이음 효율
  "y_coefficient": 0.4          // 온도 계수
}

Response:
{
  "results": [
    {
      "dn": 50,
      "nps": 2.0,
      "od_mm": 60.3,
      "t_required_mm": 4.23,     // 최소 요구 두께
      "satisfied_schedules": [   // 만족하는 스케줄 중 가장 얇은 것
        {
          "schedule": "SCH 40",
          "wt_mm": 3.91,
          "is_minimum": true      // 최소 만족 스케줄
        }
      ]
    },
    ...
  ]
}
```

### 배관 테이블 API

```
GET    /api/pipe-schedule              # 전체 조회 (필터: standard, dn)
POST   /api/pipe-schedule/upload       # CSV 업로드
DELETE /api/pipe-schedule/{id}         # 단건 삭제
```

### 허용응력 API

```
GET    /api/allowable-stress           # 전체 조회 (필터: code, material)
POST   /api/allowable-stress/upload    # CSV 업로드
DELETE /api/allowable-stress/{id}      # 단건 삭제
```

---

## 6. 프론트엔드 화면 구성

### 6-1. 메인 계산 페이지 (/)

```
┌─────────────────────────────────────────────────┐
│  🔧 배관 두께 계산기          [데이터 관리 →]   │
├──────────────────┬──────────────────────────────┤
│  설계 조건 입력  │  계산 결과                   │
│                  │                              │
│  적용 코드       │  DN  NPS  OD  요구두께  최소스케줄│
│  ○ B31.1 ● B31.3│  ──  ───  ──  ──────  ──────│
│                  │  50  2"  60.3  4.23   SCH 40│
│  재질            │  65  2½" 73.0  4.51   SCH 40│
│  [A106 Gr.B  ▼] │  80  3"  88.9  4.89   SCH 40│
│                  │  ...                         │
│  설계 압력 (MPa) │                              │
│  [______10.0___] │                              │
│                  │                              │
│  설계 온도 (℃)  │                              │
│  [______150____] │                              │
│                  │                              │
│  부식 허용치(mm) │                              │
│  [_______1.5___] │                              │
│                  │                              │
│  용접 이음 효율  │                              │
│  [_______1.0___] │                              │
│                  │                              │
│  [   계산하기  ] │                              │
└──────────────────┴──────────────────────────────┘
```

### 6-2. 데이터 관리 페이지 (/data)

- 탭: [배관 스케줄] / [허용응력]
- 테이블 조회 + 필터
- CSV 업로드 버튼 (드래그&드롭 지원)

---

## 7. 개발 환경 실행 방법

### 백엔드

```bash
cd F:\git_project\pipe-calc
uv run uvicorn main:app --reload --port 8000
```

### 프론트엔드

```bash
cd F:\git_project\pipe-calc\frontend
npm run dev   # → http://localhost:5173
```

### DB 초기 데이터 입력

```bash
uv run python database/seed_pipe.py
uv run python database/seed_allowable.py
```

---

## 11. Seed 데이터 범위 정의

### 배관 스케줄 (ASME B36.10 / B36.19)

| 항목 | 범위 |
|------|------|
| DN 범위 | DN 15 ~ DN 600 |
| B36.10 스케줄 | SCH 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, STD, XS, XXS |
| B36.19 스케줄 | SCH 5S, 10S, 40S, 80S |

### 허용응력 온도 범위

| 재질 | 코드 | 온도 범위 | 온도 간격 |
|------|------|-----------|-----------|
| A106 Gr.B | B31.1 / B31.3 | 상온(20℃) ~ 450℃ | 50℃ 간격 |
| A312 TP304 | B31.1 / B31.3 | 상온(20℃) ~ 450℃ | 50℃ 간격 |

> 입력 온도가 테이블 값 사이에 있을 경우 **선형 보간** 처리

### Y계수 / E값 처리 방침

- 입력 폼에서 **직접 수정 가능** (고급 옵션으로 접기/펼치기 UI)
- 코드 선택 시 아래 **기본값 자동 세팅**, 필요시 수동 변경

| 파라미터 | 기본값 | 설명 |
|----------|--------|------|
| E (용접 이음 효율) | 1.0 | 이음매 없는 관 기준 |
| Y (온도 계수) | 0.4 | 482℃ 미만 ferritic steel |
| W (용접 강도 감소, B31.3만) | 1.0 | 기본값 |

---

## 8. 추가 설치 필요 패키지

### 백엔드 (uv)

```bash
uv add sqlalchemy aiosqlite python-multipart
```

### 프론트엔드 (npm, frontend 폴더에서)

```bash
npm install axios
```

> UI 라이브러리는 기본 CSS로 토스 스타일 구현 (외부 라이브러리 없이 진행,
> 추후 필요시 @mui/material 또는 antd 추가 가능)

---

## 9. 구현 우선순위

| 단계 | 작업 | 비고 |
|------|------|------|
| 1 | DB 모델 및 스키마 정의 | SQLAlchemy |
| 2 | seed 데이터 작성 (B36.10/36.19 주요 사이즈) | DN 15~600 |
| 3 | 계산 API 구현 | B31.1, B31.3 |
| 4 | 배관/허용응력 조회 API | GET |
| 5 | 프론트 계산 입력 폼 | React |
| 6 | 프론트 결과 테이블 | React |
| 7 | CSV 업로드 기능 | 백/프론트 |
| 8 | 토스 스타일 CSS 적용 | 전체 |

---

## 10. 참고 사항

- SQLite DB 파일(`pipe_calc.db`)은 백엔드 루트에 자동 생성됨
- CORS 설정: `http://localhost:5173` 허용
- 허용응력 온도 보간: 입력 온도가 테이블에 없을 경우 **선형 보간** 처리
- 계산 결과에서 만족하는 스케줄이 없는 경우 "해당 없음" 표시
