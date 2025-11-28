// routes/timeCapsules.js
const express = require('express');
const router = express.Router();

const auth = require('../auth');                 // 🔐 JWT 기반 인증
const ctrl = require('../controllers/timeCapsules');

// 🔐 이 라우트 이하 전부 인증 필수
router.use(auth);

/**
 * 1. 타임캡슐 목록 조회
 *    GET /time-capsules
 */
router.get('/', ctrl.listMyCapsules);

/**
 * 2. 타임캡슐 상세 조회
 *    GET /time-capsules/:id
 *    - 컨트롤러에서 직접 res.json(row) 처리
 */
router.get('/:id', ctrl.getMyCapsuleById);

/**
 * 3. 타임캡슐 생성
 *    POST /time-capsules
 *    body:
 *      { title, message, mediaUrl, releaseType, releaseDate,
 *        recipientName, recipientContact, beneficiaryEmail }
 *    - IMMEDIATE 타입이면 컨트롤러에서 즉시 공개 + 이메일/로그 처리
 */
router.post('/', ctrl.createCapsule);

/**
 * 4. 타임캡슐 수정
 *    PUT /time-capsules/:id
 *    - 이미 is_released = 1 이면 수정 불가
 *    - 수정하면서 releaseType을 IMMEDIATE로 바꾸면
 *      컨트롤러에서 바로 공개 + 이메일/로그 처리
 */
router.put('/:id', ctrl.updateCapsule);

/**
 * 5. 타임캡슐 삭제
 *    DELETE /time-capsules/:id
 */
router.delete('/:id', ctrl.deleteCapsule);

module.exports = router;
