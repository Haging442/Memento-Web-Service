# Memento – Database Schema

메멘토 웹 서비스는 생전·사후 기능을 모두 제공하기 위해 다음과 같은 데이터 구조를 사용한다.  
기본 DB는 SQLite이다.

---

## 1. Users (사용자)
사용자 로그인, 역할 구분, 기본 정보 저장을 위한 테이블.

| 필드명           | 타입           | 설명            |
| ------------- | ------------ | ------------- |
| id            | INTEGER (PK) | 고유 ID         |
| username      | TEXT UNIQUE  | 로그인 ID        |
| password_hash | TEXT         | 비밀번호 해시       |
| name          | TEXT         | 사용자 이름        |
| role          | TEXT         | USER 또는 ADMIN |
| created_at    | TEXT         | 계정 생성 시각      |

역할
- USER: 일반 사용자
- ADMIN: 사망 신고 관리 및 시스템 모니터링

---

## 2. Trusted Contacts (신뢰 연락처)
생전 등록하는 “사망 확인자(Trusted Contact)” 정보를 관리.

| 필드명        | 타입           | 설명                     |
| ---------- | ------------ | ---------------------- |
| id         | INTEGER (PK) | 고유 ID                  |
| user_id    | INTEGER      | 연결된 사용자 (FK: users.id) |
| name       | TEXT         | 이름                     |
| relation   | TEXT         | 사용자와의 관계               |
| email      | TEXT         | 이메일                    |
| phone      | TEXT         | 전화번호                   |
| created_at | TEXT         | 등록일                    |

용도
- 사망 의심 신고 확인 시 2인에게 자동 연락
- 사망확정 프로세스에 필요

---

## 3. Digital Assets (디지털 자산)
생전 등록되는 디지털 계정/구독/서비스 목록 관리 테이블.

| 필드명          | 타입           | 설명                     |
| ------------ | ------------ | ---------------------- |
| id           | INTEGER (PK) | 자산 고유 ID               |
| user_id      | INTEGER      | 사용자 (FK: users.id)     |
| service_name | TEXT         | 서비스명                   |
| category     | TEXT         | SNS / 금융 / 구독 / 클라우드 등 |
| login_id     | TEXT         | 로그인 ID 또는 이메일          |
| memo         | TEXT         | 비고                     |
| monthly_fee  | INTEGER      | 구독료                    |
| created_at   | TEXT         | 등록 시간                  |

용도
- 디지털 자산 대시보드
- 월 구독비 합산
- 사후 지시 연결 가능

---

## 4. Death Reports (사망 의심 신고)
외부 또는 지인이 제출하는 사망 의심 신고를 저장.
| 필드명              | 타입           | 설명                                        |
| ---------------- | ------------ | ----------------------------------------- |
| id               | INTEGER (PK) | 신고 ID                                     |
| target_user_id   | INTEGER      | 신고 대상(USER)                               |
| reporter_name    | TEXT         | 신고자 이름                                    |
| reporter_contact | TEXT         | 전화/이메일                                    |
| relation         | TEXT         | 사용자와의 관계                                  |
| message          | TEXT         | 신고 내용                                     |
| status           | TEXT         | PENDING / CONFIRMED / REJECTED / CANCELED |
| admin_note       | TEXT         | 관리자 메모                                    |
| created_at       | TEXT         | 신고 시각                                     |
| resolved_at      | TEXT         | 처리 시각                                     |

용도
- 관리자 대시보드에서 상태 변경
- ‘72시간 대기 → 사망 확정’ 로직의 근거

---

## 5. Asset Instructions (디지털 자산 사후 처리 지시서)
AI 챗봇이 생성하는 “디지털 자산 사후 처리 전략” 저장.

| 필드명               | 타입           | 설명                              |
| ----------------- | ------------ | ------------------------------- |
| id                | INTEGER (PK) | 지시서 ID                          |
| user_id           | INTEGER      | 지시서 작성자                         |
| asset_id          | INTEGER      | 연결된 디지털 자산                      |
| action            | TEXT         | DELETE / TRANSFER / MEMORIALIZE |
| beneficiary_name  | TEXT         | 상속인 이름                          |
| beneficiary_email | TEXT         | 상속인 이메일                         |
| note              | TEXT         | 추가 설정                           |
| created_at        | TEXT         | 작성 시각                           |

용도
- “Instagram → 추모 계정 전환”
- “Naver Cloud → 가족 이메일로 공유”
- “넷플릭스 → 자동 해지 요청 이메일 생성”
- 이런 규칙을 저장하기 위한 테이블.

---

## 6. Time Capsules (디지털 타임캡슐)
사진/영상/문서/텍스트를 암호화 저장하고, 사후 공개 조건을 설정하는 기능 기반.

| 필드명               | 타입           | 설명                             |
| ----------------- | ------------ | ------------------------------ |
| id                | INTEGER (PK) | 타임캡슐 ID                        |
| user_id           | INTEGER      | 생성한 사용자                        |
| title             | TEXT         | 제목                             |
| content_text      | TEXT         | 텍스트 편지                         |
| file_url          | TEXT         | 파일 저장 경로                       |
| encrypt_key       | TEXT         | 암호화 키                          |
| release_type      | TEXT         | IMMEDIATE / DATE / BENEFICIARY |
| release_date      | TEXT         | 특정 날짜 공개                       |
| beneficiary_email | TEXT         | 특정 상속인에게만 공개                   |
| created_at        | TEXT         | 생성 시각                          |

용도
- 사후 특정 날짜 공개
- 특정 상속인에게만 공개
- 여러 개의 타임캡슐 생성

---

## 7. Will Documents (자필 유언장 정보)
사용자가 직접 작성한 자필 유언장의 사진 파일 + 보관 장소(암호화)를 저장.

| 필드명              | 타입           | 설명                |
| ---------------- | ------------ | ----------------- |
| id               | INTEGER (PK) | 유언장 ID            |
| user_id          | INTEGER      | 작성자               |
| file_url         | TEXT         | 업로드된 이미지/파일       |
| storage_location | TEXT         | 실물 보관 장소 (암호화 저장) |
| created_at       | TEXT         | 등록 시각             |

용도
- 사망 확정 후 상속인에게 자동 전송
- “원본 위치”를 안내하는 기능

---

## 8. 관계 요약 (ERD 개념)
- users (1) — (N) digital_assets
- users (1) — (N) trusted_contacts
- users (1) — (N) death_reports (target)
- users (1) — (N) asset_instructions
- digital_assets (1) — (N) asset_instructions
- users (1) — (N) time_capsules
- users (1) — (N) will_documents
