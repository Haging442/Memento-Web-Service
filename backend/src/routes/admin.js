// routes/admin.js
const express = require('express');
const router = express.Router();

const auth = require('../../auth');
const isAdmin = require('../middlewares/isAdmin');
const ctrl = require('../controllers/admin');
const deathCtrl = require('../controllers/deathreports');

// 관리자 전용: 전체 사용자 목록
router.get('/users', auth, isAdmin, ctrl.getAllUsers);

// 관리자 전용: 전체 자산 목록
router.get('/assets', auth, isAdmin, ctrl.getAllAssets);

// 관리자 전용: 전체 신뢰 연락처 목록
router.get('/contacts', auth, isAdmin, ctrl.getAllContacts);

// 🔥 관리자 전용: 사망 의심 신고 목록
router.get('/death-reports', auth, isAdmin, deathCtrl.getReports);

// 🔥 관리자 전용: 사망 의심 신고 상태 변경
router.patch('/death-reports/:id', auth, isAdmin, deathCtrl.updateReportStatus);

module.exports = router;
