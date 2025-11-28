// controllers/assetInstructions.js
const db = require('../db');

// 자산이 내 것인지 확인하는 헬퍼
function ensureAssetOwnedByUser(assetId, userId, cb) {
  db.get(
    `SELECT id, user_id FROM digital_assets WHERE id = ?`,
    [assetId],
    (err, asset) => {
      if (err) return cb(err);
      if (!asset) return cb(new Error('ASSET_NOT_FOUND'));
      // 소유자 확인
      if (asset.user_id !== userId) return cb(new Error('NO_PERMISSION'));
      cb(null, asset);
    }
  );
}

// 1) 특정 자산의 사후 지시 조회 (GET /assets/:id/instruction)
exports.getInstruction = (req, res) => {
  const userId = req.user.userId;              // ✅ auth에서 온 userId 사용
  const assetId = parseInt(req.params.id, 10);

  if (isNaN(assetId)) {
    return res.status(400).json({ error: 'INVALID_ASSET_ID' });
  }

  ensureAssetOwnedByUser(assetId, userId, (err) => {
    if (err) {
      if (err.message === 'ASSET_NOT_FOUND') {
        return res.status(404).json({ error: 'ASSET_NOT_FOUND' });
      }
      if (err.message === 'NO_PERMISSION') {
        return res.status(403).json({ error: 'NO_PERMISSION' });
      }
      return res.status(500).json({ error: err.message });
    }

    db.get(
      `SELECT 
         id, 
         user_id,
         asset_id, 
         action, 
         beneficiary_name, 
         beneficiary_email, 
         note, 
         created_at
       FROM asset_instructions
       WHERE asset_id = ? AND user_id = ?`,
      [assetId, userId],
      (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        // 아직 지시가 없는 경우 null 반환
        if (!row) return res.json(null);
        res.json(row);
      }
    );
  });
};

// 2) 특정 자산의 사후 지시 생성/수정 (POST /assets/:id/instruction)
exports.upsertInstruction = (req, res) => {
  const userId = req.user.userId;
  const assetId = parseInt(req.params.id, 10);

  if (isNaN(assetId)) {
    return res.status(400).json({ error: 'INVALID_ASSET_ID' });
  }

  const { action, beneficiaryName, beneficiaryEmail, note } = req.body || {};

  const allowedActions = ['DELETE', 'TRANSFER', 'KEEP', 'MEMORIALIZE', 'OTHER'];
  if (!allowedActions.includes(action)) {
    return res
      .status(400)
      .json({ error: 'INVALID_ACTION', allowed: allowedActions });
  }

  // 이메일은 선택사항으로 둘 수 있음 (없으면 안내 메일은 안 나감)
  if (beneficiaryEmail && typeof beneficiaryEmail !== 'string') {
    return res.status(400).json({ error: 'INVALID_EMAIL' });
  }

  ensureAssetOwnedByUser(assetId, userId, (err) => {
    if (err) {
      if (err.message === 'ASSET_NOT_FOUND') {
        return res.status(404).json({ error: 'ASSET_NOT_FOUND' });
      }
      if (err.message === 'NO_PERMISSION') {
        return res.status(403).json({ error: 'NO_PERMISSION' });
      }
      return res.status(500).json({ error: err.message });
    }

    // 이미 해당 자산에 지시가 있는지 확인 (user_id까지 같이 체크)
    db.get(
      `SELECT id 
       FROM asset_instructions 
       WHERE asset_id = ? AND user_id = ?`,
      [assetId, userId],
      (err2, existing) => {
        if (err2) return res.status(500).json({ error: err2.message });

        if (existing) {
          // UPDATE
          db.run(
            `UPDATE asset_instructions
             SET action = ?, 
                 beneficiary_name = ?, 
                 beneficiary_email = ?, 
                 note = ?
             WHERE id = ?`,
            [
              action,
              beneficiaryName || null,
              beneficiaryEmail || null,
              note || null,
              existing.id,
            ],
            function (err3) {
              if (err3) return res.status(500).json({ error: err3.message });
              res.json({ message: 'INSTRUCTION_UPDATED' });
            }
          );
        } else {
          // INSERT
          db.run(
            `INSERT INTO asset_instructions
             (user_id, asset_id, action, beneficiary_name, beneficiary_email, note)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              userId,
              assetId,
              action,
              beneficiaryName || null,
              beneficiaryEmail || null,
              note || null,
            ],
            function (err3) {
              if (err3) return res.status(500).json({ error: err3.message });
              res
                .status(201)
                .json({ message: 'INSTRUCTION_CREATED', id: this.lastID });
            }
          );
        }
      }
    );
  });
};
