// controllers/assetInstructions.js
const db = require('../../db');

// 자산이 내 것인지 확인하는 헬퍼
function ensureAssetOwnedByUser(assetId, userId, cb) {
  db.get(
      `SELECT id, user_id FROM digital_assets WHERE id = ?`, [assetId],
      (err, asset) => {
        if (err) return cb(err);
        if (!asset) return cb(new Error('ASSET_NOT_FOUND'));
        if (asset.user_id !== userId) return cb(new Error('NO_PERMISSION'));
        cb(null, asset);
      });
}

// 1) 특정 자산의 사후 지시 조회 (GET /assets/:id/instruction)
exports.getInstruction = (req, res) => {
  const userId = req.user.userId;
  const assetId = parseInt(req.params.id, 10);

  ensureAssetOwnedByUser(assetId, userId, (err) => {
    if (err) {
      if (err.message === 'ASSET_NOT_FOUND') {
        return res.status(404).json({error: 'ASSET_NOT_FOUND'});
      }
      if (err.message === 'NO_PERMISSION') {
        return res.status(403).json({error: 'NO_PERMISSION'});
      }
      return res.status(500).json({error: err.message});
    }

    db.get(
        `SELECT id, asset_id, action, beneficiary_name, beneficiary_contact, note, created_at, updated_at
       FROM asset_instructions
       WHERE asset_id = ?`,
        [assetId], (err2, row) => {
          if (err2) return res.status(500).json({error: err2.message});
          if (!row) return res.json(null);  // 아직 지시가 없는 경우
          res.json(row);
        });
  });
};

// 2) 특정 자산의 사후 지시 생성/수정 (POST /assets/:id/instruction)
exports.upsertInstruction = (req, res) => {
  const userId = req.user.userId;
  const assetId = parseInt(req.params.id, 10);

  const {action, beneficiaryName, beneficiaryContact, note} = req.body || {};

  const allowedActions = ['DELETE', 'TRANSFER', 'KEEP', 'MEMORIALIZE', 'OTHER'];
  if (!allowedActions.includes(action)) {
    return res.status(400).json(
        {error: 'INVALID_ACTION', allowed: allowedActions});
  }

  ensureAssetOwnedByUser(assetId, userId, (err) => {
    if (err) {
      if (err.message === 'ASSET_NOT_FOUND') {
        return res.status(404).json({error: 'ASSET_NOT_FOUND'});
      }
      if (err.message === 'NO_PERMISSION') {
        return res.status(403).json({error: 'NO_PERMISSION'});
      }
      return res.status(500).json({error: err.message});
    }

    const now = new Date().toISOString();

    // 이미 해당 자산에 지시가 있는지 확인
    db.get(
        `SELECT id FROM asset_instructions WHERE asset_id = ?`, [assetId],
        (err2, existing) => {
          if (err2) return res.status(500).json({error: err2.message});

          if (existing) {
            // UPDATE
            db.run(
                `UPDATE asset_instructions
             SET action = ?, beneficiary_name = ?, beneficiary_contact = ?, note = ?, updated_at = ?
             WHERE asset_id = ?`,
                [
                  action, beneficiaryName, beneficiaryContact, note, now,
                  assetId
                ],
                function(err3) {
                  if (err3) return res.status(500).json({error: err3.message});
                  res.json({message: 'INSTRUCTION_UPDATED'});
                });
          } else {
            // INSERT
            db.run(
                `INSERT INTO asset_instructions
             (asset_id, action, beneficiary_name, beneficiary_contact, note)
             VALUES (?, ?, ?, ?, ?)`,
                [assetId, action, beneficiaryName, beneficiaryContact, note],
                function(err3) {
                  if (err3) return res.status(500).json({error: err3.message});
                  res.status(201).json(
                      {message: 'INSTRUCTION_CREATED', id: this.lastID});
                });
          }
        });
  });
};
