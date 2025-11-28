// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// uploads 폴더가 없으면 생성
const uploadDir = path.join(__dirname, '../uploads/memorial');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 파일명: userId_timestamp_원본파일명
    // ✅ JWT payload: { userId, role } 기준 + 비로그인 대비
    const userid =
      (req.user && (req.user.userid || req.user.id)) || 'guest';

    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const filename = `${userid}_${timestamp}_${basename}${ext}`;
    cb(null, filename);
  },
});

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
  }
};

// Multer 설정
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
    files: 100, // 한 번에 최대 100개
  },
});

module.exports = upload;
