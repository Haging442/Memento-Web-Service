// routes/dailyQuestions.js
const express = require('express');
const router = express.Router();
const auth = require('../auth');
const ctrl = require('../controllers/dailyQuestions');

/**
 * 📌 오늘의 질문 조회
 * - GET /daily-question/today  (server.js에서 '/daily-question' 또는 '/daily-questions'로 mount)
 * - 아직 오늘 답변 안 했으면 question + stats 반환
 * - 이미 답변했다면 "오늘은 이미 답변" 메시지 + 통계만 반환
 */
router.get('/today', auth, ctrl.getTodayQuestion);

/**
 * 📌 오늘의 질문에 대한 답변 제출
 * - POST /daily-question/answer
 * body: { questionId, answerText }
 * - user_daily_answers에 저장
 * - user_question_schedule 갱신
 * - Gemini 분석 비동기 트리거
 */
router.post('/answer', auth, ctrl.submitAnswer);

/**
 * 📌 AI 제안 목록 조회
 * - GET /daily-question/suggestions
 * - ai_suggestions 중 status = 'PENDING'인 것만 반환
 * - 이 시점에 해당 answer에 suggestion_shown = 1로 표시 (컨트롤러에서 처리)
 */
router.get('/suggestions', auth, ctrl.getSuggestions);

/**
 * 📌 AI 제안 응답 (수락/거절)
 * - POST /daily-question/suggestions/:id/respond
 * body: { action: 'accept' | 'reject' }
 * - ai_suggestions.status 업데이트
 * - 수락 시 user_daily_answers.suggestion_accepted = 1 (컨트롤러에서 처리)
 */
router.post('/suggestions/:id/respond', auth, ctrl.respondToSuggestion);

/**
 * 📌 답변 히스토리 조회
 * - GET /daily-question/history
 * - 최근 30개까지의 질문/답변/AI 분석 내용 조회
 */
router.get('/history', auth, ctrl.getAnswerHistory);

module.exports = router;
