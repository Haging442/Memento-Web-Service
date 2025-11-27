const express = require('express');
const router = express.Router();

const auth = require('../auth'); // 🔐 JWT 기반 인증
const ctrl = require('../controllers/timeCapsules');
const { sendTimeCapsuleNotification } = require('./email'); // ✅ 경로 수정

// 모든 라우트 인증 필수
router.use(auth);

/**
 * 1. 타임캡슐 목록 조회
 * GET /time-capsules
 */
router.get('/', ctrl.listMyCapsules);

/**
 * 2. 타임캡슐 상세 조회
 * GET /time-capsules/:id
 * + PRIVATE 이고 beneficiary_email 있을 경우 → 이메일 발송
 */
router.get('/:id', async (req, res) => {
  try {
    const capsule = await ctrl.getMyCapsuleById(req, res, { returnData: true });
    if (!capsule) return; // ctrl이 이미 응답 처리함

    // PRIVATE 공개 방식이면 이메일 발송
    if (capsule.release_type === 'PRIVATE' && capsule.beneficiary_email) {
      try {
        await sendTimeCapsuleNotification(
          capsule.beneficiary_email,
          capsule.user_id,
          capsule.title || '제목 없음'
        );
        console.log(`[EMAIL] Time-capsule opened → Notice sent to ${capsule.beneficiary_email}`);
      } catch (err) {
        console.error('[EMAIL] Failed to send time capsule notification:', err);
      }
    }

    return res.json({ ok: true, capsule });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * 3. 타임캡슐 생성
 * POST /time-capsules
 */
router.post('/', ctrl.createCapsule);

/**
 * 4. 타임캡슐 수정
 * PUT /time-capsules/:id
 */
router.put('/:id', ctrl.updateCapsule);

/**
 * 5. 타임캡슐 삭제
 * DELETE /time-capsules/:id
 */
router.delete('/:id', ctrl.deleteCapsule);

module.exports = router;