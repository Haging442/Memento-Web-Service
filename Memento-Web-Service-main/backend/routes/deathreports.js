// routes/deathReports.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/deathreports');
const authMiddleware = require('../auth.js');

// adminMiddleware가 있다면 사용, 없으면 주석 처리
let adminMiddleware;
try {
  adminMiddleware = require('../middlewares/isAdmin.js');
} catch (err) {
  console.warn('[WARNING] isAdmin middleware not found, admin routes will use auth only');
  adminMiddleware = (req, res, next) => next(); // 임시로 통과시키는 미들웨어

// ============================================
// 신고 가능 (로그인 불필요)
// ============================================
router.post('/', ctrl.createReport);

module.exports = router;
}

// ============================================
// 공개 API (로그인 불필요)
// ============================================

// 1. 신고 생성 (누구나 가능)
router.post('/', ctrl.createReport);

// 2. 신뢰 연락처가 토큰으로 확인/거절
router.post('/verify', ctrl.verifyByToken);

// ============================================
// 인증 필요 API
// ============================================

// 3. 본인 로그인 후, 자신의 사망 의심 신고를 한 번에 취소
router.post('/cancel-my-reports', authMiddleware, ctrl.cancelByOwner);

// ============================================
// 관리자 전용 API
// ============================================

// 4. 관리자용: 신고 목록 조회
router.get('/', authMiddleware, adminMiddleware, ctrl.getReports);

// 5. 관리자용: 신고 상태 변경 (RESTful 방식)
router.put('/:id/status', authMiddleware, adminMiddleware, ctrl.updateReportStatus);

// 6. 관리자용: 신고 상태 변경 (PATCH도 지원)
router.patch('/:id/status', authMiddleware, adminMiddleware, ctrl.updateReportStatus);

module.exports = router;