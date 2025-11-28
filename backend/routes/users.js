// routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../auth');          // 🔐 JWT 인증 미들웨어
const ctrl = require('../controllers/users');

// ---------------------------------------------
// 1) 회원가입
// POST /users/register
// ---------------------------------------------
router.post('/register', ctrl.register);

// ---------------------------------------------
// 2) 로그인
// POST /users/login
// ---------------------------------------------
router.post('/login', ctrl.login);

// ---------------------------------------------
// 3) 내 정보 조회
// GET /users/me
// ---------------------------------------------
router.get('/me', auth, ctrl.getMyProfile);

// ---------------------------------------------
// 4) 프로필 수정 (이름 등)
// PUT /users/me
// ---------------------------------------------
router.put('/me', auth, ctrl.updateMyProfile);

// ---------------------------------------------
// 5) 비밀번호 변경
// PUT /users/change-password
// ---------------------------------------------
router.put('/change-password', auth, ctrl.changePassword);

module.exports = router;
