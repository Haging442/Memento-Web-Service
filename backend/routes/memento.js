// backend/routes/memento.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { encrypt } = require('../encrypt');
const auth = require('../auth');          // 🔐 다른 라우트들과 동일하게 인증 추가

const router = express.Router();

// uploads/memento 폴더에 저장 (조금 더 분리)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/memento');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/**
 * POST /memento/register
 * Fields: originalLocation
 * File: mementoImage
 *
 * - userId는 JWT에서 가져옴
 */
router.post(
  '/register',
  auth,                     // 🔐 인증 필수
  upload.single('mementoImage'),
  (req, res) => {
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);

    if (!req.file) {
      return res
        .status(400)
        .json({ ok: false, error: 'No file uploaded' });
    }

    const userId = req.user.userId;   // 🔐 body가 아니라 토큰에서
    const originalLocation = req.body.originalLocation;

    if (!originalLocation || !originalLocation.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'originalLocation is required',
      });
    }

    // DB에는 웹에서 접근 가능한 경로만 저장 (예: /uploads/memento/xxx.jpg)
    const relativePath = path
      .join('/uploads/memento', req.file.filename)
      .replace(/\\/g, '/'); // 윈도우 대응
    const fullPath = req.file.path; // 필요하다면 내부용으로 사용 가능

    let encryptedJson;
    try {
      const encrypted = encrypt(originalLocation.trim());
      encryptedJson = JSON.stringify(encrypted);
    } catch (e) {
      console.error('Encryption failed:', e);
      // 암호화 실패 시, 이미 저장된 파일 삭제(선택)
      fs.unlink(fullPath, () => {});
      return res
        .status(500)
        .json({ ok: false, error: 'Encryption failed' });
    }

    db.run(
      `INSERT INTO memento_storage (user_id, file_path, encrypted_location)
       VALUES (?, ?, ?)`,
      [userId, relativePath, encryptedJson],
      function (err) {
        if (err) {
          console.error(err);
          // DB 실패 시 파일 삭제(선택)
          fs.unlink(fullPath, () => {});
          return res.status(500).json({ ok: false });
        }

        res.json({
          ok: true,
          id: this.lastID,
          fileUrl: relativePath, // 클라이언트는 이걸로 접근
        });
      }
    );
  }
);

module.exports = router;
