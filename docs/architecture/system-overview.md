# 시스템 아키텍처 개요 – MEMENTO

## 1. 개요
Memento는 백엔드(Express), SQLite DB, 프론트엔드(React)로 구성된  
3-Layer Web Application 입니다.

---

## 2. 시스템 구조도
(여기 diagrams 폴더에 있는 draw.io PNG 이미지를 첨부)

### 흐름:
사용자 → Frontend → Backend API → SQLite DB  
                         ↘ Scheduler (자동작업)

---

## 3. 백엔드 구조

### Routes
- URL path 처리
- 요청을 controller로 전달

### Controllers
- 입력 검증, 응답 구조화
- 서비스 로직 호출

### Services
- 핵심 비즈니스 로직 담당
- DB 접근 및 데이터 처리

### Models
- DB 스키마 및 ORM 역할 (필요시 Prisma 사용 가능)

### Utils / Middlewares
- 공통 기능 (로그, 인증, 토큰처리)

---

## 4. Scheduler (자동작업)
- setInterval로 10분마다 작업 실행
- 72시간 경과한 death_report → FINAL_CONFIRMED 처리
- ON_DATE 타임캡슐 자동 공개

---
