# 메멘토 프로젝트 - D팀

## **수정 일시**
2025년 11월 24일

---

## **추가된 기능**
- 신뢰 연락처 관리 시스템
- 사망 확인 시스템
- 사망 알림 시스템

## **패키지 설치**
- 파일 업로드 처리, 이메일 보내기, 로그인 상태 유지: npm install multer nodemailer express-session
- PDF → 이미지 변환, 이미지 → 텍스트 추출(OCR): npm install tesseract.js pdf-poppler

## **추가된 폴더 목록**

### **새로 생성된 폴더**
```
backend/
├── views/                    ← 새로 생성 (웹 페이지 템플릿 저장용)
└── services/                 ← 새로 생성 (비즈니스 로직 서비스 저장용)
```

#### **📁 views 폴더란?**
- **역할**: 사용자가 브라우저에서 보는 웹 페이지 템플릿 저장
- **기술**: EJS (Embedded JavaScript) 템플릿 엔진 사용
- **변화**: JSON API 전용 → 실제 웹 서비스로 업그레이드
- **효과**: 일반 사용자가 브라우저에서 직접 이용 가능

  #### **services 폴더란?** 
- **역할**: 비즈니스 로직과 외부 API 연동 서비스 저장
- **용도**: 이메일 발송, OCR 처리, SMS 전송 등 핵심 기능
- **장점**: 라우터에서 복잡한 로직 분리, 재사용성 증대
- **구조**: 각 서비스별로 독립적인 모듈화

---

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

### **3. 서비스 파일 (2개)**
```
backend/services/
├── email-service.js          ← 실제 이메일 발송 (SMTP 통합)
└── pdf-ocr-service.js        ← PDF OCR 자동 처리 (한국어 지원)
```

### **4. EJS 템플릿 파일 (7개)**
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

---

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

---

## **데이터베이스 변경사항**
- **데이터베이스 스키마 변경 없음**
- **기존 테이블 활용**: `users`, `trusted_contacts`, `death_reports`, `death_verifications`

---

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

### **실제 이메일 발송 시스템**
- **기능**: Gmail, Naver, Daum 등 SMTP 서버 연동
- **특징**: 
  - 예쁜 HTML 이메일 템플릿 (그라디언트 디자인)
  - 자동 fallback (설정 없으면 콘솔 출력)
  - 이메일 발송 실패 시 자동 복구
  - 신고 정보, OCR 결과 포함한 상세 내용
- **설정**: `.env` 파일로 간편 설정
- **지원**: Gmail App Password, 일반 SMTP 모두 지원

### **PDF OCR 자동 처리**
- **기능**: 사망확인서 PDF에서 텍스트 자동 추출
- **추출 정보**:
  - 성명 (한국어 이름 패턴 인식)
  - 주민등록번호 (000000-0000000 형식)
  - 사망일자 (YYYY년 MM월 DD일 형식)
  - 생년월일 (추가 검증용)
- **검증**: 신고된 정보와 자동 대조 확인
- **언어**: 한국어 + 영어 동시 지원
- **성능**: 실시간 진행률 표시
- **안전**: 임시 파일 자동 정리

### **통합 워크플로우**
- **PDF 업로드** → **OCR 처리** → **정보 검증** → **이메일 발송**
- **신고 접수** → **자동 처리** → **결과 저장** → **알림 전송**
- **오류 처리**: 각 단계별 fallback 시스템
- **로깅**: 상세한 처리 과정 기록

---

## **테스트 방법**

### **설치 및 설정**
```bash
# OCR 패키지 설치
npm install tesseract.js pdf-poppler

# 서비스 폴더 생성
mkdir -p backend/services

# 파일 배치
# email-service-real.js → backend/services/email-service.js
# pdf-ocr-service.js → backend/services/pdf-ocr-service.js
# death-verification-enhanced.js → backend/routes/death-verification.js
```

### **실제 이메일 설정 (.env 파일)**
```env
# Gmail 예시
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@memento.com
```

### **단계별 테스트**
1. **기본 테스트**: `http://localhost:4000/death-verification/report`
2. **PDF 업로드**: 사망확인서 PDF 파일 업로드
3. **OCR 확인**: 서버 콘솔에서 텍스트 추출 결과 확인
4. **이메일 테스트**: 콘솔 또는 실제 이메일로 확인 링크 받기
5. **확인 워크플로우**: 링크 클릭 → 확인/거부 → 상태 변경
6. **사망 알림**: 해당 사용자 로그인 시 72시간 카운트다운

### **OCR 테스트 결과 예시**
```
📋 Processing death certificate...
📄 Converting PDF to images...
🔍 Performing OCR on death certificate...
OCR Progress: 100%
✅ OCR completed successfully!
📊 OCR Results:
- Extracted Name: 김철수
- Extracted ID: 901231-1234567
- Death Date: 2024년 11월 24일
- Name Verification: ✅
- ID Verification: ✅
- Overall Confidence: high
```

## **테스트 URL 모음**
1. **신뢰 연락처**: `http://localhost:4000/trusted-contacts` (로그인 필요)
2. **사망 신고**: `http://localhost:4000/death-verification/report` (공개 접근)
3. **관리자**: `http://localhost:4000/death-verification/admin` (관리자 권한 필요)

## **배포 가이드**

### **1단계: 파일 배치**
```bash
# 새로 생성된 폴더들
mkdir -p backend/middlewares
mkdir -p backend/views
mkdir -p backend/services

# 라우터 파일 배치 (기존 파일 교체)
trusted-contacts-db.js → backend/routes/trusted-contacts.js
death-notification-db.js → backend/routes/death-notification.js
death-verification-enhanced.js → backend/routes/death-verification.js

# 미들웨어 파일 배치
death-notification-middleware-db.js → backend/middlewares/death-notification-middleware.js

# 서비스 파일 배치
email-service-real.js → backend/services/email-service.js
pdf-ocr-service.js → backend/services/pdf-ocr-service.js

# EJS 템플릿 배치 (views 폴더명 확인!)
모든 .ejs 파일들 → backend/views/
```

### **2단계: 패키지 설치**
```bash
cd backend
npm install tesseract.js pdf-poppler
mkdir -p uploads/death-certificates
```

### **3단계: 서버 설정**
```bash
# server.js 교체 (백업 권장)
cp server.js server-backup.js
cp server-updated.js server.js
```

### **4단계: 실행 및 테스트**
```bash
npm run dev
# 브라우저에서 http://localhost:4000 접속
```
