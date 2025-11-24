# 메멘토 프로젝트 - D팀

## **수정 일시**
2025년 11월 24일

## **추가된 기능**
- 신뢰 연락처 관리 시스템
- 사망 확인 시스템
- 사망 알림 시스템

## **추가된 파일 목록**

### **1. 라우터 파일 (3개)**
```
backend/routes/
├── trusted-contacts.js       ← 신뢰 연락처 관리
├── death-verification.js     ← 사망 확인 시스템  
└── death-notification.js     ← 사망 알림 페이지
```

### **2. 미들웨어 파일 (1개)**
```
backend/middlewares/
└── death-notification-middleware.js  ← 로그인 시 사망 알림 체크
```

### **3. EJS 템플릿 파일 (7개)**
```
backend/views/
├── trusted-contacts.ejs              ← 신뢰 연락처 관리 페이지
├── death-report.ejs                  ← 사망 신고 페이지 (공개)
├── death-verification.ejs            ← 사망 확인 페이지 (이메일 링크)
├── death-report-success.ejs          ← 사망 신고 접수 완료 페이지
├── verification-complete.ejs         ← 사망 확인 완료 페이지
├── verification-error.ejs            ← 인증 오류 페이지
└── death-notification.ejs            ← 사망 알림 페이지 (72시간 카운트다운)
```

### **4. 수정된 파일 (2개)**
```
backend/server.js              ← 새 라우터 및 미들웨어 등록
```

## **새로 추가된 경로**

### **신뢰 연락처 관리**
- `GET /trusted-contacts` - 신뢰 연락처 목록 페이지
- `POST /trusted-contacts/add` - 신뢰 연락처 추가
- `PUT /trusted-contacts/:id` - 신뢰 연락처 수정
- `DELETE /trusted-contacts/:id` - 신뢰 연락처 삭제

### **사망 확인 시스템**
- `GET /death-verification/report` - 사망 신고 페이지 (공개 접근)
- `POST /death-verification/report` - 사망 신고 접수
- `GET /death-verification/verify/:token` - 사망 확인 페이지 (이메일 링크)
- `POST /death-verification/verify/:token` - 사망 확인 처리
- `GET /death-verification/admin` - 관리자 페이지

### **사망 알림 시스템**
- `GET /death-notification` - 사망 알림 페이지 (72시간 카운트다운)
- `POST /death-notification/cancel` - 사망 신고 취소 (오탐지)


## **데이터베이스 변경사항**
**데이터베이스 스키마 변경 없음**
**기존 테이블 활용**: `users`, `trusted_contacts`, `death_reports`, `death_verifications`

## **주요 특징**

### **신뢰 연락처 관리**
- 최소 2명, 최대 5명 등록 가능
- 이메일 중복 체크 및 유효성 검증
- 실시간 전화번호 포맷팅
- 카드형 UI로 직관적 관리

### **사망 확인 시스템**
- 공개 접근 가능한 사망 신고
- PDF 사망확인서 업로드 지원
- 신뢰 연락처 2명 이상 확인 필요
- 7일 유효기간 토큰 시스템

### **사망 알림 시스템**
- 72시간 실시간 카운트다운
- 오탐지 방지 "취소" 기능
- 로그인 시 자동 체크 미들웨어
- 확인 현황 시각화

## **기존 기능과의 호환성**
**기존 API 완전 호환**
**기존 72시간 자동화 시스템 연동**
**데이터베이스 스키마 변경 X**

## **보안 및 검증**
- SQL Injection 방지 (Prepared Statements)
- 세션 기반 인증
- 파일 업로드 제한 (PDF만, 10MB)
- 토큰 기반 이메일 인증
- 신뢰 연락처 다중 확인 시스템

## **테스트 방법**
1. **신뢰 연락처**: `http://localhost:4000/trusted-contacts`
2. **사망 신고**: `http://localhost:4000/death-verification/report`
3. **관리자**: `http://localhost:4000/death-verification/admin`
