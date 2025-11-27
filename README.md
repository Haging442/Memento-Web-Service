# Memento Web Service  
AI 라이프 솔루션 챌린지 2025 – “메멘토” 웹 서비스 개발 리포지토리

### 폴더 구조

#### `backend/controllers/`
- 요청이 들어오면 실제로 무슨 동작을 할지 담당하는 로직
- DB에서 데이터 읽기/쓰기, 로직 처리, 오류 처리, JSON 응답 반환
- 기능별 로직이 들어 있는 코드 파일 모음

#### `backend/middlewares/`
- 기능으로 요청이 들어가기 전에 자동으로 실행되는 필터들
- 인증/인가 (로그인 검사, 관리자 검사), 요청 데이터 검증, 요청 횟수 제한, CORS 처리, 공통 로깅
- 관리자 전용 기능 접근 제한 기능 구현 코드 파일

#### `backend/routes/`
- URL → 기능 연결하는 안내판
- 사용자 요청 URL을 매핑하는 곳
- `server.js`와 controllers 사이에서 요청 흐름을 정의

---

## 주요 파일 설명

#### `auth.js`
- 관리자 / 일반 사용자 역할 구분  

#### `db.js`
- SQLite 데이터베이스 연결 담당

#### `server.js`
- Express 서버의 시작 지점 
- 미들웨어, 라우터 등록 및 서버 실행 로직 포함
- 데이터베이스 생성

---

## 초기 세팅 가이드

- VS Code 확장 기능 설치:
  - **Thunder Client** → API 테스트 (로그인 테스트 등)
  - **SQLite Viewer** → SQLite DB 구조 및 데이터 GUI로 확인
- **Node.js 설치 필수**

---

## 실행 가이드

### 1. `backend` 폴더에서 다음 명령어 실행:
npm install → `node_modules` 폴더가 자동 생성됩니다.

### 2. 개발 서버 실행
npm run dev → 서버가 실행됩니다.

### 3. 서버 테스트
- VS Code 확장 프로그램 **Thunder Client**를 사용해  
  로그인, 자산 등록 등 정상 동작하는지 테스트할 수 있습니다.

### 4. 데이터베이스 확인
- **SQLite Viewer** 확장 프로그램으로  
  `memento.db` 파일을 GUI 방식으로 열어 테이블과 데이터를 확인할 수 있습니다.



