// routes/dailyQuestions.js
const express = require('express');
const router = express.Router();
const auth = require('../auth');
const ctrl = require('../controllers/dailyQuestions');

// 오늘의 질문 조회
router.get('/today', auth, ctrl.getTodayQuestion);

// 답변 제출
router.post('/answer', auth, ctrl.submitAnswer);

// 제안 목록 조회
router.get('/suggestions', auth, ctrl.getSuggestions);

// 제안 응답
router.post('/suggestions/:id/respond', auth, ctrl.respondToSuggestion);

// 답변 히스토리
router.get('/history', auth, ctrl.getAnswerHistory);

module.exports = router;