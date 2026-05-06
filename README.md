# pipe-calc

ASME B31.1 기준 **배관 최소 요구 두께 계산 웹 애플리케이션**입니다.

설계 압력·온도·재질을 입력하면 DN 15 ~ DN 600 전 사이즈에 대해 최소 요구 두께를 계산하고,  
ASME B36.10 / B36.19 배관 스케줄 중 조건을 만족하는 최소 스케줄을 바로 확인할 수 있습니다.

---

## 주요 기능

- **B31.1 두께 계산** — DN 15~600 전 사이즈 일괄 계산
- **설계 압력 단위 barg** — 입력값을 내부에서 MPa로 자동 변환
- **Y 계수 자동 계산** — B31.1 Table 104.1.2-1 기반, P-No.로 Ferritic/Austenitic 구분, 온도 선형 보간
- **W 계수 자동 계산** — B31.1 Table 102.4.7-1 기반, P-No.·온도 선형 보간 (Seamless=1.0)
- **적용 규격 자동 결정** — P-No.8(Austenitic SS) → B36.19, 그 외 → B36.10
- **허용응력 선형 보간** — 입력 온도가 테이블 사이 값이면 자동 보간
- **계산 파라미터 표시** — 결과 헤더에 S·Y·W 적용값 표시
- **배관 스케줄 DB** — B36.10 / B36.19, DN 15~600 내장
- **허용응력 DB** — A106 Gr.B / A312 TP304 기본 내장
- **CSV 업로드** — 배관 스케줄·허용응력 데이터를 CSV로 추가 가능
- **데이터 관리 페이지** — 등록된 데이터 조회·삭제

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 백엔드 | Python 3.11 · FastAPI · SQLAlchemy · SQLite |
| 프론트엔드 | React 19 · Vite 8 · Axios |
| 패키지 관리 | uv (Python) · npm (Node) |

---

## 사전 요구 사항

### Python — uv 설치

`uv`는 Python 패키지·가상환경 관리자입니다. pip 대신 사용합니다.

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**macOS / Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

설치 후 터미널을 재시작하면 `uv` 명령어를 사용할 수 있습니다.

### Node.js

[https://nodejs.org](https://nodejs.org) 에서 **LTS 버전**을 설치합니다.  
설치 후 `node -v`, `npm -v` 로 확인합니다.

---

## 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/shstorage/pipe-calc.git
cd pipe-calc
```

### 2. 백엔드 패키지 설치

```bash
uv sync
```

`uv`가 `.python-version` 파일을 읽어 Python 3.11을 자동으로 내려받고,  
`pyproject.toml` / `uv.lock` 기준으로 가상환경(`.venv`)과 모든 패키지를 설치합니다.

### 3. DB 초기 데이터 입력

```bash
uv run python database/seed_pipe.py
uv run python database/seed_allowable.py
```

- `seed_pipe.py` — ASME B36.10 / B36.19 배관 스케줄 입력
- `seed_allowable.py` — A106 Gr.B / A312 TP304 허용응력 입력
- `pipe_calc.db` 파일이 자동으로 생성됩니다.

### 4. 프론트엔드 패키지 설치

```bash
cd frontend
npm install
cd ..
```

---

## 실행

백엔드와 프론트엔드를 **각각 별도의 터미널**에서 실행합니다.

**터미널 1 — 백엔드:**
```bash
uv run uvicorn main:app --reload --port 8000
```

**터미널 2 — 프론트엔드:**
```bash
cd frontend
npm run dev
```

브라우저에서 **http://localhost:5173** 을 엽니다.

> 프론트엔드의 `/api` 요청은 Vite 개발 서버가 자동으로 `http://localhost:8000` 으로 프록시합니다.

---

## 화면 구성

### 계산 페이지

| 좌측 | 우측 |
|------|------|
| 재질, 설계 압력(barg), 설계 온도 입력 | DN 15 ~ DN 600 전 사이즈 계산 결과 |
| 부식 허용치, 제작 공차 | 요구 두께 및 최소 만족 스케줄 표시 |
| 고급 옵션: E / Y(자동) / W(자동) | 헤더에 적용된 S·Y·W·규격 표시 |

### 데이터 관리 페이지

- **배관 스케줄 탭** — standard / DN 필터, 삭제, CSV 업로드
- **허용응력 탭** — code / material 필터, 삭제, CSV 업로드

---

## 두께 계산 공식

**ASME B31.1 Eq.(3)**
```
t = (P × D) / (2 × (S × E × W + P × Y)) + c
```

| 기호 | 의미 | 기본값 |
|------|------|--------|
| P | 설계 압력 (barg 입력 → MPa 변환: ×0.1) | 입력 |
| D | 외경 (mm) | DB 참조 |
| S | 허용응력 (MPa) | DB + 선형 보간 |
| E | 용접 이음 효율 | 1.0 |
| Y | 온도 계수 | Table 104.1.2-1 자동 (P-No. 기반) |
| W | 용접 강도 감소 계수 | Table 102.4.7-1 자동 (P-No.·온도 기반) |
| c | 부식 허용치 (mm) | 1.5 |

---

## CSV 업로드 포맷

### 배관 스케줄

```
standard,dn,nps,schedule,od_mm,wt_mm
B36.10,15,0.5,SCH 40,21.3,2.77
B36.10,50,2.0,SCH 80,60.3,5.54
```

### 허용응력

```
code,spec_no,grade,type_or_class,nominal_comp,p_no,temp_c,stress_mpa
B31.1,A106,B,,C-Si,1,20,138.0
B31.1,A106,B,,C-Si,1,150,131.0
```

중복 행(동일 unique key)은 자동으로 건너뜁니다.
