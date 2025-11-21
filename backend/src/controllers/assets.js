const db = require('../../db');

exports.getAssets = (req, res) => {
  const userId = req.user.userId;

  db.all(
      `SELECT * FROM digital_assets WHERE user_id = ? ORDER BY created_at DESC`,
      [userId], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
      });
};

exports.createAsset = (req, res) => {
  const userId = req.user.userId;
  const {serviceName, category, loginId, memo, monthlyFee} = req.body;

  db.run(
      `INSERT INTO digital_assets (user_id, service_name, category, login_id, memo, monthly_fee)
     VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, serviceName, category, loginId, memo, monthlyFee],
      function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({message: 'ASSET CREATED', id: this.lastID});
      });
};

// 전체 목록 조회
exports.getAssets = (req, res) => {
  const userId = req.user.userId;

  db.all(
      `SELECT * FROM digital_assets WHERE user_id = ? ORDER BY created_at DESC`,
      [userId], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
      });
};

// 자산 등록
exports.createAsset = (req, res) => {
  const userId = req.user.userId;
  const {serviceName, category, loginId, memo, monthlyFee} = req.body;

  db.run(
      `INSERT INTO digital_assets (user_id, service_name, category, login_id, memo, monthly_fee)
     VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, serviceName, category, loginId, memo, monthlyFee],
      function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({message: 'ASSET CREATED', id: this.lastID});
      });
};

// 🔹 단일 자산 조회 (GET /assets/:id)
exports.getAssetById = (req, res) => {
  const userId = req.user.userId;
  const assetId = req.params.id;

  db.get(
      `SELECT * FROM digital_assets WHERE id = ? AND user_id = ?`,
      [assetId, userId], (err, row) => {
        if (err) return res.status(500).json({error: err.message});
        if (!row) return res.status(404).json({error: 'ASSET NOT FOUND'});
        res.json(row);
      });
};

// 🔹 자산 수정 (PUT /assets/:id)
exports.updateAsset = (req, res) => {
  const userId = req.user.userId;
  const assetId = req.params.id;
  const {serviceName, category, loginId, memo, monthlyFee} = req.body;

  db.run(
      `UPDATE digital_assets
     SET service_name = ?, category = ?, login_id = ?, memo = ?, monthly_fee = ?
     WHERE id = ? AND user_id = ?`,
      [serviceName, category, loginId, memo, monthlyFee, assetId, userId],
      function(err) {
        if (err) return res.status(500).json({error: err.message});
        if (this.changes === 0) {
          return res.status(404).json(
              {error: 'ASSET NOT FOUND OR NO PERMISSION'});
        }
        res.json({message: 'ASSET UPDATED'});
      });
};

// 🔹 자산 삭제 (DELETE /assets/:id)
exports.deleteAsset = (req, res) => {
  const userId = req.user.userId;
  const assetId = req.params.id;

  db.run(
      `DELETE FROM digital_assets WHERE id = ? AND user_id = ?`,
      [assetId, userId], function(err) {
        if (err) return res.status(500).json({error: err.message});
        if (this.changes === 0) {
          return res.status(404).json(
              {error: 'ASSET NOT FOUND OR NO PERMISSION'});
        }
        res.json({message: 'ASSET DELETED'});
      });
};
