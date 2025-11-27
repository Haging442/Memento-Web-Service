// controllers/assets.js
const db = require('../db');
const {classifyAssetCategory} =
    require('../services/geminiService');  // 🔥 추가

// 전체 목록 조회 (GET /assets)
exports.getAssets = (req, res) => {
  const userId = req.user.userId;

  db.all(
      `SELECT * FROM digital_assets WHERE user_id = ? ORDER BY created_at DESC`,
      [userId], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
      });
};

// 자산 등록 (POST /assets)
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

// 단일 자산 조회 (GET /assets/:id)
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

// 자산 수정 (PUT /assets/:id)
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

// 자산 삭제 (DELETE /assets/:id)
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

// 🔥 AI 자동 카테고리 분류 (POST /assets/auto-category)
exports.getAutoCategory = async (req, res) => {
  const {service_name} = req.body;

  if (!service_name || !service_name.trim()) {
    return res.status(400).json({error: 'service_name은 필수입니다.'});
  }

  try {
    // 1) Gemini로 분류 시도
    let category = await classifyAssetCategory(service_name.trim());

    // 2) 실패 시 간단한 규칙 기반 fallback
    if (!category) {
      const nameLower = service_name.toLowerCase();

      if (nameLower.includes('instagram') || nameLower.includes('facebook') ||
          nameLower.includes('twitter') || nameLower.includes('카카오') ||
          nameLower.includes('kakao')) {
        category = 'SNS';
      } else if (
          nameLower.includes('bank') || nameLower.includes('은행') ||
          nameLower.includes('증권') || nameLower.includes('카드')) {
        category = '금융';
      } else if (
          nameLower.includes('netflix') || nameLower.includes('디즈니') ||
          nameLower.includes('티빙') || nameLower.includes('wavve') ||
          nameLower.includes('멜론') || nameLower.includes('youtube premium')) {
        category = '구독';
      } else if (
          nameLower.includes('drive') || nameLower.includes('dropbox') ||
          nameLower.includes('onedrive') || nameLower.includes('icloud') ||
          nameLower.includes('클라우드')) {
        category = '클라우드';
      } else {
        category = '기타';
      }
    }

    return res.json({category});
  } catch (err) {
    console.error('[ASSETS] getAutoCategory error:', err);
    return res.status(500).json(
        {error: '카테고리 분류 중 오류가 발생했습니다.'});
  }
};
