// routes/willDocuments.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const auth = require('../auth');
const ctrl = require('../controllers/willDocuments');

// 🔐 유언장 파일은 일반 /uploads/static 으로 공개하지 않고
//     별도 secure 디렉토리에 저장해서 직접 다운로드만 허용
const secureDir = path.join(__dirname, '../secure/wills');

if (!fs.existsSync(secureDir)) {
  fs.mkdirSync(secureDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, secureDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext);
    const ts = Date.now();
    cb(null, `${req.user.userId || 'user'}_${ts}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('지원하지 않는 파일 형식입니다.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// --------------------------------------
// 1) 내 유언장 정보 조회 (GET /will-documents/me)
// --------------------------------------
router.get('/me', auth, ctrl.getMyWillDocument);

// --------------------------------------
// 2) 유언장 등록/수정 (POST /will-documents)
//    - multipart/form-data
//    - fields: storageLocation (text), willFile (file)
// --------------------------------------
router.post(
  '/',
  auth,
  upload.single('willFile'),  // 프론트에서 name="willFile" 로 보내기
  ctrl.upsertWillDocument
);

// --------------------------------------
// 3) 유언장 파일 다운로드 (GET /will-documents/:id/file)
// --------------------------------------
router.get('/:id/file', auth, ctrl.downloadWillFile);

// --------------------------------------
// 4) 유언장 삭제 (DELETE /will-documents/:id)
// --------------------------------------
router.delete('/:id', auth, ctrl.deleteWillDocument);

module.exports = router;
