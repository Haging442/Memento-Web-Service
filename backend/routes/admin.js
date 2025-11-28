// routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db');

const auth = require('../auth');
const isAdmin = require('../middlewares/isAdmin');
const ctrl = require('../controllers/admin');
const deathCtrl = require('../controllers/deathreports');

// ---------------------------------------------------------------------
// 관리자 대시보드 요약 통계
// - 전체 사용자 수, 자산 수, 신뢰 연락처 수, 타임캡슐 수
// - 사망 신고 상태별 개수, 이메일/타임캡슐 로그 개수 등
// ---------------------------------------------------------------------

// 관리자 전용: 대시보드 상단 요약
router.get('/summary', auth, isAdmin, ctrl.getDashboardSummary);
//----------------------------------------------------------

router.get('/dashboard', auth, isAdmin, ctrl.getDashboardStats);

// ---------------------------------------------------------------------
// 관리자 전용: 전체 사용자 목록
// ---------------------------------------------------------------------
router.get('/users', auth, isAdmin, ctrl.getAllUsers);

// ---------------------------------------------------------------------
// 관리자 전용: 전체 자산 목록
// ---------------------------------------------------------------------
router.get('/assets', auth, isAdmin, ctrl.getAllAssets);

// ---------------------------------------------------------------------
// 관리자 전용: 전체 신뢰 연락처 목록
// ---------------------------------------------------------------------
router.get('/contacts', auth, isAdmin, ctrl.getAllContacts);

// ---------------------------------------------------------------------
// 관리자 전용: 사망 의심 신고 목록
//   - PDF: "관리자 계정: 사망 의심 신고 접수" 기능에 대응
// ---------------------------------------------------------------------
router.get('/death-reports', auth, isAdmin, ctrl.getDeathReports);

// ---------------------------------------------------------------------
// 관리자 전용: 사망 의심 신고 상태 변경
//   - PENDING → CONFIRMED 등
//   - CONFIRMED 시 resolved_at 설정 → 72시간 후 autoFinalize에서 FINAL_CONFIRMED
// ---------------------------------------------------------------------
router.patch('/death-reports/:id', auth, isAdmin, ctrl.updateDeathReportStatus);

// ---------------------------------------------------------------------
// 관리자 전용: 이메일 발송 로그 조회
//   - 어떤 이메일을 누구에게, 언제, 성공/실패 여부
// ---------------------------------------------------------------------
router.get('/email-logs', auth, isAdmin, ctrl.getEmailLogs);

// ---------------------------------------------------------------------
// 관리자 전용: 타임캡슐 공개 로그 조회
//   - ON_DEATH / ON_DATE가 실제로 언제 실행됐는지 확인
// ---------------------------------------------------------------------
router.get('/capsule-releases', auth, isAdmin, ctrl.getCapsuleReleaseLogs);

// ---------------------------------------------------------------------
// (옵션) 사망 신고 상세 정보 + 경과 시간
//   - 관리/디버깅용 보조 엔드포인트
//   - 예: CONFIRMED 된 뒤 몇 시간이 지났는지 확인용
// ---------------------------------------------------------------------
router.get('/death-reports-detailed', auth, isAdmin, async (req, res) => {
  try {
    db.all(
      `SELECT dr.*,
              u.name AS target_user_name,
              CAST((julianday('now') - julianday(dr.resolved_at)) * 24 AS INTEGER) AS hours_elapsed
       FROM death_reports dr
       LEFT JOIN users u ON dr.target_user_id = u.id
       ORDER BY dr.created_at DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
