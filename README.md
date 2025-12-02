# Memento Web Service  
AI 라이프 솔루션 챌린지 2025 – “메멘토” 웹 서비스 개발 리포지토리

## 현 상황
- 백엔드 로직만 짜 놓은 상태이고, 테스트는 UI 만들면서 해야합니다.
- 프론트엔드 코드는 파일형식만 지켜서 처음부터 짜도 됩니다.
- 백엔드 코드 전체적으로 꼭 정독하시고 프론트엔드 만드셔야합니다.

---

## 초기 세팅 가이드
- **Node.js 설치 필수**
- VS Code 확장 기능 설치:
  - Thunder Client → API 테스트 (로그인 테스트 등)
  - SQLite Viewer → SQLite DB 구조 및 데이터 GUI로 확인

---

## 실행 가이드

### 1. 관리자 권한으로 vscode 실행

### 2. `node_modules` 폴더 생성
- npm install → `node_modules` 폴더가 자동 생성됩니다.
- `backend` 폴더와 `frontend` 폴더 각각에서 총 두 번 실행합니다.

### 3. 추가 라이브러리 설치
- npm install pdf-parse (`backend` 폴더에서만 실행)
- npm install vite --save-dev (`frontend` 폴더에서만 실행)

### 4. 개발 서버 실행
- npm run dev → 서버가 실행됩니다.
- `backend` 폴더와 `frontend` 폴더 각각에서 총 두 번 실행합니다. (터미널 창 2개)
  
### 5. 테스트
- http://localhost:5173/ 주소로 이동합니다.

---

### 추가 설명
- **데이터베이스 확인**: SQLite Viewer 확장 프로그램으로 `memento.db` 파일을 GUI 방식으로 열어 테이블과 데이터를 확인할 수 있습니다.
- AI를 적극 활용하시면서 개발하고 오류를 해결하세요.



