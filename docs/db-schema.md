# 📌 Memento – Database Schema (뼈대 설계)

메멘토 웹 서비스는 생전·사후 기능을 모두 제공하기 위해 다음과 같은 데이터 구조를 사용한다.  
기본 DB는 SQLite이며, 현재 구축된 테이블을 기반으로 부족한 기능을 보완하여 설계한다.

---

## 1.1 Users (사용자)

| 필드명           | 타입                      | 설명             |
| ------------- | ----------------------- | -------------- |
| id            | INTEGER PK              | 고유 ID          |
| username      | TEXT UNIQUE             | 로그인 ID         |
| password_hash | TEXT                    | bcrypt 해시 비밀번호 |
| name          | TEXT                    | 사용자 실명         |
| role          | TEXT (‘USER’ / ‘ADMIN’) | 권한             |
| created_at    | TEXT                    | 생성 시각          |

## 1.2 Trusted Contacts (신뢰 연락처)
| 필드명        | 타입                   | 설명             |
| ---------- | -------------------- | -------------- |
| id         | INTEGER PK           | 고유 ID          |
| user_id    | INTEGER FK(users.id) | 해당 사용자의 신뢰 연락처 |
| name       | TEXT                 | 이름             |
| relation   | TEXT                 | 관계             |
| email      | TEXT                 | 이메일            |
| phone      | TEXT                 | 전화번호           |
| created_at | TEXT                 | 등록 시각          |
