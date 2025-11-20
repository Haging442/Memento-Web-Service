## 프로젝트 구조 설명

### 폴더 구조

#### `controllers/`
- 기능(도메인)별 로직이 들어 있는 코드 파일 모음  
- 예: `users.js`, `assets.js`, `admin.js`  
- 요청 처리 및 DB 상호작용을 담당하는 핵심 비즈니스 로직

#### `middlewares/`
- 로그인, 인증 등 공통적으로 필요한 기능을 담당  
- 예: JWT 인증, 권한 체크

#### `routes/`
- 클라이언트 요청 URL과 controllers를 연결하는 라우터 모음  
- `server.js`와 controllers 사이에서 요청 흐름을 정의

---

## 주요 파일 설명

#### `auth.js`
- 관리자 / 일반 사용자 역할 구분  
- 관리자 전용 기능 접근 제한 기능 구현

#### `db.js`
- SQLite 데이터베이스 연결 및 초기 설정 담당

#### `server.js`
- Express 서버의 시작 지점  
- 미들웨어, 라우터 등록 및 서버 실행 로직 포함

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



