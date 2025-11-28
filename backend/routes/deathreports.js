// routes/deathReports.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/deathreports');
const authMiddleware = require('../auth.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 파일 업로드 설정 (PDF용)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/death_certificates');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// adminMiddleware가 있다면 사용, 없으면 no-op으로 대체
let adminMiddleware;
try {
  adminMiddleware = require('../middlewares/isAdmin.js');
} catch (err) {
  console.warn(
    '[WARNING] isAdmin middleware not found, admin routes will NOT be protected as admin-only (auth only)'
  );
  adminMiddleware = (req, res, next) => next(); // 임시 통과 미들웨어
}

// ------------------------------------------------------
// 사망확인서 PDF 업로드용 multer 설정
//   - 파일 필드 이름: certificate
//   - 경로: /uploads/certificates
// ------------------------------------------------------
const certDir = path.join(__dirname, '../uploads/certificates');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const certStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, certDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const certUpload = multer({
  storage: certStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('PDF 파일만 업로드 가능합니다.'), false);
  },
});

// ============================================
// 🔓 공개 API (로그인 불필요)
// ============================================

// 1. 사망 의심 신고 생성 (누구나 가능)
//    - body: { targetUsername, reporterName, reporterContact, relation, message }
//    - PDF: "누군가가 사망 의심 신고" 단계
router.post('/', ctrl.createReport);

// 2. 신뢰 연락처가 토큰으로 확인/거절
//    - body: { token, decision: 'CONFIRM' | 'REJECT' }
//    - 두 명 이상이 CONFIRM → death_reports.status = 'CONFIRMED' (+ resolved_at)
//    - 이후 72시간 뒤 autoFinalizeDeathReports에서 FINAL_CONFIRMED 처리
router.post('/verify', ctrl.verifyByToken);

// 2-1. (선택) 사망확인서 PDF 업로드 (관리자 또는 신고자만 사용한다고 가정)
//     여기서는 관리자 인증을 걸어두는 예시
router.post(
  '/:id/upload-certificate',
  authMiddleware,
  upload.single('certificate'),
  ctrl.uploadCertificate
);

// ============================================
// 🔐 인증 필요 API (사용자 본인)
// ============================================

// 3. 본인 로그인 후, 자신의 사망 의심 신고를 한 번에 취소
//    - POST /death-reports/cancel-my-reports
//    - PDF: 72시간 대기 중 "오탐지입니다" 버튼 역할
router.post('/cancel-my-reports', authMiddleware, ctrl.cancelByOwner);

// ============================================
// 🛠 관리자 전용 API
//    (isAdmin 미들웨어가 있으면 관리자 제한, 없으면 auth만 적용됨)
// ============================================

// 4. 관리자용: 신고 목록 조회
//    - GET /death-reports?status=PENDING 등
router.get('/', authMiddleware, adminMiddleware, ctrl.getReports);

// 5. 관리자용: 신고 상태 변경 (PUT - 전체 상태 교체)
//    - body: { status, adminNote }
//    - allowed status: PENDING / CONFIRMED / REJECTED / CANCELED
router.put('/:id/status', authMiddleware, adminMiddleware, ctrl.updateReportStatus);

// 6. 관리자용: 신고 상태 변경 (PATCH도 지원, 같은 컨트롤러 사용)
router.patch('/:id/status', authMiddleware, adminMiddleware, ctrl.updateReportStatus);

module.exports = router;
