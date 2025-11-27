// routes/admin.js
const express = require('express');
const router = express.Router();

const auth = require('../auth');
const isAdmin = require('../middlewares/isAdmin');
const ctrl = require('../controllers/admin');
const deathCtrl = require('../controllers/deathreports');

// 관리자 전용: 전체 사용자 목록
router.get('/users', auth, isAdmin, ctrl.getAllUsers);

// 관리자 전용: 전체 자산 목록
router.get('/assets', auth, isAdmin, ctrl.getAllAssets);

// 관리자 전용: 전체 신뢰 연락처 목록
router.get('/contacts', auth, isAdmin, ctrl.getAllContacts);

// 관리자 전용: 사망 의심 신고 목록
router.get('/death-reports', auth, isAdmin, deathCtrl.getReports);

// 관리자 전용: 사망 의심 신고 상태 변경
router.patch('/death-reports/:id', auth, isAdmin, deathCtrl.updateReportStatus);

// 이메일 발송 로그 조회
router.get("/email-logs", async (req, res) => {
  try {
    db.all(
      `SELECT el.*, u.name as user_name 
       FROM email_logs el
       LEFT JOIN users u ON el.user_id = u.id
       ORDER BY el.sent_at DESC
       LIMIT 100`,
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

// 타임캡슐 공개 로그 조회
router.get("/capsule-releases", async (req, res) => {
  try {
    db.all(
      `SELECT crl.*, u.name as user_name, tc.title as capsule_title
       FROM capsule_release_logs crl
       LEFT JOIN users u ON crl.user_id = u.id
       LEFT JOIN time_capsules tc ON crl.capsule_id = tc.id
       ORDER BY crl.released_at DESC
       LIMIT 100`,
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

// 사망 신고 상세 정보 (경과 시간 포함)
router.get("/death-reports-detailed", async (req, res) => {
  try {
    db.all(
      `SELECT dr.*, u.name as target_user_name,
              CAST((julianday('now') - julianday(dr.resolved_at)) * 24 AS INTEGER) as hours_elapsed
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
