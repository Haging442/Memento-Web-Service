const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/deathreports');
const auth = require('../../auth');  // ⬅ 추가

// 로그인 필요 없이 신고 가능
router.post('/', ctrl.createReport);

// 신뢰 연락처가 토큰으로 확인 (확인 / 거절)
router.post('/verify', ctrl.verifyByToken);

// 🔥 본인 로그인 후, 자신의 사망 의심 신고를 한 번에 취소
router.post('/cancel-my-reports', auth, ctrl.cancelByOwner);

module.exports = router;
