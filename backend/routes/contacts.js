// routes/contacts.js
const express = require('express');
const router = express.Router();
const auth = require('../auth');
const ctrl = require('../controllers/contacts');

// -------------------------------------
// 🔹 신뢰 연락처 목록 조회 (GET /contacts)
// -------------------------------------
router.get('/', auth, ctrl.getContacts);

// -------------------------------------
// 🔹 신뢰 연락처 등록 (POST /contacts)
// -------------------------------------
router.post('/', auth, ctrl.createContact);

// -------------------------------------
// 🔹 신뢰 연락처 수정 (PUT /contacts/:id)
// -------------------------------------
router.put('/:id', auth, ctrl.updateContact);

// -------------------------------------
// 🔹 신뢰 연락처 삭제 (DELETE /contacts/:id)
// -------------------------------------
router.delete('/:id', auth, ctrl.deleteContact);

// -------------------------------------
// 🔥 최소 2명의 신뢰 연락처 등록 여부 요약 (GET /contacts/summary)
//    - totalContacts: 등록된 연락처 개수
//    - hasMinimumContacts: 2명 이상인지 여부
// -------------------------------------
router.get('/summary', auth, ctrl.getContactsSummary);

module.exports = router;
