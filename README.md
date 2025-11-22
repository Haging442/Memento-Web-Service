# memento_proj
# 🕊️ MEMENTO – 디지털 자산 사후 관리 서비스

**Memento**는 사용자의 사망 또는 장기 미접속을 감지하여  
디지털 자산, 계정, 타임캡슐(사후 메시지) 등을 신뢰 연락처에게 전달하거나 자동으로 처리하는 서비스입니다.

본 프로젝트는 6인 팀 프로젝트로 진행되며,  
백엔드/프론트엔드/기획/설계가 분리된 구조로 협업합니다.

---
# 시스템 아키텍처
[Client - Frontend] ←→ [REST API Server - Node.js/Express] ←→ [SQLite Database]
↑
└── Scheduled Tasks (자동 사후 처리)

## 📁 Folder Structure
memento_proj/
├─ backend/ # Node.js 기반 API 서버
│ ├─ src/
│ │ ├─ routes/ # 각 API 엔드포인트
│ │ ├─ controllers/ # 비즈니스 로직
│ │ ├─ services/ # DB/유즈케이스 로직
│ │ ├─ models/
│ │ ├─ middlewares/
│ │ └─ config/
│ ├─ db.js # SQLite 연결
│ ├─ auth.js # 인증/토큰 관련
│ └─ server.js
│
├─ frontend/ # React 기반 웹 화면
│ └─ (추가 예정)
│
├─ docs/ # 요구사항, 아키텍처, 시나리오, 와이어프레임
│ ├─ requirements/
│ ├─ architecture/
│ ├─ api/
│ └─ design/
│
└─ scripts/ # Dev scripts


---

## 🚀 Features (주요 기능)

### 1) 사용자 인증 · 관리
- 회원가입 / 로그인 (JWT)
- 사용자 역할: USER / ADMIN
- 관리자 전용 대시보드

### 2) 디지털 자산 관리
- 사용 중인 구독 서비스, 계정 정보 등록
- 자산의 사후 처리 지시 작성  
  (예: 삭제 / 이전 / 기념 계정 전환 등)

### 3) 신뢰 연락처 기능
- “사후 확인”을 위한 연락처 등록
- 사망 의심 신고 → 연락처 3명 확인 → 사망 확정

### 4) 사후 메시지 / 타임캡슐
- ON_DEATH: 사망 확정 시 자동 공개  
- ON_DATE: 특정 날짜 자동 공개  
- IMMEDIATE: 즉시 공개

### 5) 자동 작업(스케줄러)
- 72시간 검증 후 사망 자동 확정
- 타임캡슐 자동 공개 로직

등 추가 예정
---


---

# 백엔드 기술 스택

- Node.js (Express)
- SQLite  
- JSON Web Token(JWT)
- bcrypt (패스워드 해시)
- REST API 구조
- 자동 작업 스케줄러(setInterval)

---

# 데이터베이스 구조 요약

### users
- username  
- password_hash  
- role (USER / ADMIN)

### digital_assets
- service_name  
- category  
- login_id  
- memo, monthly_fee  

### asset_instructions  
- action  
- beneficiary_name / contact  
- note  

### trusted_contacts  
- name  
- relation  
- phone/email  

### death_reports  
- status (PENDING / CONFIRMED / FINAL_CONFIRMED / CANCELED)  
- reporter info  
- resolved_at  

### death_verifications  
- token  
- status  
- verified_at  

### time_capsules  
- title, message  
- release_type (IMMEDIATE / ON_DEATH / ON_DATE)  
- release_date  
- is_released  
- released_at  

---

# 현재 구현된 기능 (2025.02 기준)

### ✔ 백엔드 핵심 로직 95% 완료  
- 생전 기능 전체 구현  
- 디지털 자산 CRUD  
- 사후 지시 CRUD  
- 신뢰 연락처 2인 검증  
- 사망 의심 신고 플로우 100% 구현  
- 본인 로그인 취소  
- 72시간 자동 사망확정  
- ON_DEATH 자동 공개  
- ON_DATE 자동 공개  
- 타임캡슐 CRUD + 자동 발동  
- 관리자 신고 조회/상태 변경

---

# 아직 미구현 (추후 개발 예정)

### ❌ 파일 업로드 (사진, 영상, 사망확인서 등)  
### ❌ 이메일 / 문자 / 카카오톡 알림 발송  
### ❌ AI 기반 자동 분류 / 유언 생성  
### ❌ 프론트엔드 UI 전체 (React)  
### ❌ 관리자 대시보드 UI  
### ❌ 추모 공간 / 방명록 / 타임라인 UI  

> ⚠ 백엔드 구조는 위 기능을 쉽게 붙일 수 있도록 설계됨.

---

# 8. 버전 로드맵

## 📌 **v1.0 — 현재 상태 (백엔드 MVP 완성)**

## 📌 **v2.0 — 프론트엔드 + 파일 업로드 + 알림 기능**

## 📌 **v3.0 — AI 기반 추천/분석 + 추모 UI 확장**

---

# 9. 팀 협업 안내

### 브랜치 전략

## 🛠️ Tech Stack

### Backend
- Node.js / Express.js
- SQLite3
- JWT 인증
- Nodemon
- RESTful API

### Frontend
- React (예정)
- React Router
- Axios

---

## 📡 API Overview

모든 API 상세는 `/docs/api` 에 정리.

## ⚙️ How to Run (로컬 실행 방법)

### Backend

```bash
cd backend
npm install
npm run dev
