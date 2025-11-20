// routes/deathReports.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/deathreports');

// 로그인 필요 없이 신고 가능
router.post('/', ctrl.createReport);

module.exports = router;
