# MEMENTO API 문서

## Base URL
http://localhost:4000


---

## 📌 Auth
### POST /auth/login  
로그인 → JWT 발급

### POST /auth/register  
회원가입

---

## 📌 Users
### GET /users  
전체 사용자 조회 (ADMIN)

### GET /users/:id  
특정 사용자 조회

---

## 📌 Digital Assets
### GET /assets  
자산 조회

### POST /assets  
새 자산 등록

### PATCH /assets/:id  
자산 수정

### DELETE /assets/:id  
자산 삭제

---

## 📌 Trusted Contacts
### GET /contacts  
연락처 조회

### POST /contacts  
연락처 생성

---

## 📌 Death Reports
### POST /death-reports  
사망 의심 신고

### PATCH /death-reports/:id/confirm  
연락처 검증 입력

---

## 📌 Time Capsules
### POST /time-capsules
타임캡슐 생성

### GET /time-capsules/:id  
타임캡슐 조회

### PATCH /time-capsules/:id/release  
강제 공개

---

## ❗ Response Format
```json
{
  "success": true,
  "data": {},
  "error": null
}
