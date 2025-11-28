// controllers/willDocuments.js
const db = require('../db');
const fs = require('fs');
const path = require('path');

// 🔹 1. 내 유언장 보관 정보 조회 (GET /will-documents/me)
exports.getMyWillDocument = (req, res) => {
  const userId = req.user.userId;

  db.get(
    `SELECT id, storage_location, file_url, created_at
     FROM will_documents
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
    (err, row) => {
      if (err) {
        console.error('[WILL] getMyWillDocument error:', err);
        return res.status(500).json({ error: 'DB_ERROR' });
      }

      if (!row) {
        return res.json(null); // 아직 등록 안 한 상태
      }

      res.json({
        id: row.id,
        storageLocation: row.storage_location,
        hasFile: !!row.file_url,
        createdAt: row.created_at
      });
    }
  );
};

// 🔹 2. 유언장 보관 정보 등록/수정 (POST /will-documents)
//  - 이미지 파일(optional) + storageLocation 텍스트
exports.upsertWillDocument = (req, res) => {
  const userId = req.user.userId;
  const storageLocation = req.body.storageLocation || '';
  const file = req.file || null;

  if (!storageLocation && !file) {
    return res.status(400).json({
      error: 'STORAGE_LOCATION_OR_FILE_REQUIRED',
      message: '보관 위치 또는 유언장 파일 중 하나는 반드시 필요합니다.'
    });
  }

  // 파일 경로 (있으면)
  const filePath = file ? file.path : null;

  // 이미 존재하는 유언장이 있는지 확인 (1인 1개 기준)
  db.get(
    `SELECT id, file_url FROM will_documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    [userId],
    (err, existing) => {
      if (err) {
        console.error('[WILL] upsert select error:', err);
        return res.status(500).json({ error: 'DB_ERROR' });
      }

      const now = new Date().toISOString();

      if (existing) {
        // 🔁 UPDATE
        const newFileUrl = filePath || existing.file_url;

        db.run(
          `UPDATE will_documents
           SET storage_location = ?, file_url = ?, created_at = ?
           WHERE id = ?`,
          [storageLocation, newFileUrl, now, existing.id],
          (err2) => {
            if (err2) {
              console.error('[WILL] update error:', err2);
              return res.status(500).json({ error: 'DB_ERROR' });
            }

            // 새 파일을 업로드한 경우, 이전 파일 삭제 (옵션)
            if (filePath && existing.file_url && existing.file_url !== filePath) {
              const oldPath = existing.file_url;
              fs.unlink(oldPath, (e) => {
                if (e) console.warn('[WILL] old file delete failed:', e.message);
              });
            }

            res.json({
              success: true,
              message: 'WILL_DOCUMENT_UPDATED',
              id: existing.id
            });
          }
        );
      } else {
        // 🆕 INSERT
        db.run(
          `INSERT INTO will_documents (user_id, file_url, storage_location, created_at)
           VALUES (?, ?, ?, ?)`,
          [userId, filePath, storageLocation, now],
          function(err2) {
            if (err2) {
              console.error('[WILL] insert error:', err2);
              return res.status(500).json({ error: 'DB_ERROR' });
            }

            res.status(201).json({
              success: true,
              message: 'WILL_DOCUMENT_CREATED',
              id: this.lastID
            });
          }
        );
      }
    }
  );
};

// 🔹 3. 유언장 삭제 (DELETE /will-documents/:id)
exports.deleteWillDocument = (req, res) => {
  const userId = req.user.userId;
  const docId = parseInt(req.params.id, 10);

  db.get(
    `SELECT id, user_id, file_url FROM will_documents WHERE id = ?`,
    [docId],
    (err, row) => {
      if (err) {
        console.error('[WILL] delete select error:', err);
        return res.status(500).json({ error: 'DB_ERROR' });
      }

      if (!row) {
        return res.status(404).json({ error: 'NOT_FOUND' });
      }

      if (row.user_id !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'NO_PERMISSION' });
      }

      db.run(
        `DELETE FROM will_documents WHERE id = ?`,
        [docId],
        (err2) => {
          if (err2) {
            console.error('[WILL] delete error:', err2);
            return res.status(500).json({ error: 'DB_ERROR' });
          }

          if (row.file_url) {
            fs.unlink(row.file_url, (e) => {
              if (e) console.warn('[WILL] file delete failed:', e.message);
            });
          }

          res.json({ success: true, message: 'WILL_DOCUMENT_DELETED' });
        }
      );
    }
  );
};

// 🔹 4. 유언장 파일 다운로드 (GET /will-documents/:id/file)
//   - 본인 또는 ADMIN만 다운로드 가능
exports.downloadWillFile = (req, res) => {
  const userId = req.user.userId;
  const docId = parseInt(req.params.id, 10);

  db.get(
    `SELECT id, user_id, file_url FROM will_documents WHERE id = ?`,
    [docId],
    (err, row) => {
      if (err) {
        console.error('[WILL] download select error:', err);
        return res.status(500).json({ error: 'DB_ERROR' });
      }

      if (!row) {
        return res.status(404).json({ error: 'NOT_FOUND' });
      }

      if (row.user_id !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'NO_PERMISSION' });
      }

      if (!row.file_url) {
        return res.status(404).json({ error: 'NO_FILE' });
      }

      const filePath = row.file_url;

      // 파일이 실제로 존재하는지 체크
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'FILE_NOT_FOUND' });
      }

      res.download(filePath, 'will_document.jpg', (downloadErr) => {
        if (downloadErr) {
          console.error('[WILL] download error:', downloadErr);
        }
      });
    }
  );
};
