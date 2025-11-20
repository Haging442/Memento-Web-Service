# Memento – Database Schema

메멘토 웹 서비스는 생전·사후 기능을 모두 제공하기 위해 다음과 같은 데이터 구조를 사용한다.  
기본 DB는 SQLite이다.

---

## 1.1 Users (사용자)
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

## 1.2 Trusted Contacts (신뢰 연락처)
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
