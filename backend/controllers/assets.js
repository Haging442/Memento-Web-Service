// controllers/assets.js
const db = require('../db');
const { classifyAssetCategory } = require('../services/geminiService');  // 🔥 추가

// ---------------------------------------------------------------------
// 🔹 자산 대시보드 요약 (GET /assets/summary)
//    - 전체 등록 계정 수
//    - 월 구독 비용 합계
//    - 사후 처리 설정 완료율
// ---------------------------------------------------------------------
exports.getAssetsSummary = (req, res) => {
  const userId = req.user.userId;

  const sql = `
    SELECT
      (SELECT COUNT(*) 
       FROM digital_assets 
       WHERE user_id = ?) AS total_assets,
      (SELECT COALESCE(SUM(monthly_fee), 0)
       FROM digital_assets
       WHERE user_id = ? AND monthly_fee IS NOT NULL) AS total_monthly_fee,
      (SELECT COUNT(DISTINCT asset_id)
       FROM asset_instructions
       WHERE user_id = ?) AS assets_with_instruction
  `;

  db.get(sql, [userId, userId, userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    const totalAssets = row.total_assets || 0;
    const assetsWithInstruction = row.assets_with_instruction || 0;

    const completionRate =
      totalAssets === 0
        ? 0
        : Math.round((assetsWithInstruction / totalAssets) * 100);

    res.json({
      totalAssets,
      totalMonthlyFee: row.total_monthly_fee || 0,
      instruction: {
        completedCount: assetsWithInstruction,
        totalAssets,
        completionRate, // %
      },
    });
  });
};

// ---------------------------------------------------------------------
// 전체 목록 조회 (GET /assets)
// ---------------------------------------------------------------------
exports.getAssets = (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT * 
     FROM digital_assets 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// ---------------------------------------------------------------------
// 자산 등록 (POST /assets)
// ---------------------------------------------------------------------
exports.createAsset = (req, res) => {
  const userId = req.user.userId;
  const { serviceName, category, loginId, memo, monthlyFee } = req.body;

  db.run(
    `INSERT INTO digital_assets 
     (user_id, service_name, category, login_id, memo, monthly_fee)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, serviceName, category, loginId, memo, monthlyFee],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'ASSET CREATED', id: this.lastID });
    }
  );
};

// ---------------------------------------------------------------------
// 단일 자산 조회 (GET /assets/:id)
// ---------------------------------------------------------------------
exports.getAssetById = (req, res) => {
  const userId = req.user.userId;
  const assetId = req.params.id;

  db.get(
    `SELECT * 
     FROM digital_assets 
     WHERE id = ? AND user_id = ?`,
    [assetId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'ASSET NOT FOUND' });
      res.json(row);
    }
  );
};

// ---------------------------------------------------------------------
// 자산 수정 (PUT /assets/:id)
// ---------------------------------------------------------------------
exports.updateAsset = (req, res) => {
  const userId = req.user.userId;
  const assetId = req.params.id;
  const { serviceName, category, loginId, memo, monthlyFee } = req.body;

  db.run(
    `UPDATE digital_assets
     SET service_name = ?, 
         category = ?, 
         login_id = ?, 
         memo = ?, 
         monthly_fee = ?
     WHERE id = ? AND user_id = ?`,
    [serviceName, category, loginId, memo, monthlyFee, assetId, userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ error: 'ASSET NOT FOUND OR NO PERMISSION' });
      }
      res.json({ message: 'ASSET UPDATED' });
    }
  );
};

// ---------------------------------------------------------------------
// 자산 삭제 (DELETE /assets/:id)
// ---------------------------------------------------------------------
exports.deleteAsset = (req, res) => {
  const userId = req.user.userId;
  const assetId = req.params.id;

  db.run(
    `DELETE FROM digital_assets 
     WHERE id = ? AND user_id = ?`,
    [assetId, userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ error: 'ASSET NOT FOUND OR NO PERMISSION' });
      }
      res.json({ message: 'ASSET DELETED' });
    }
  );
};

// ---------------------------------------------------------------------
// 🔥 AI 자동 카테고리 분류 (POST /assets/auto-category)
//    - service_name 기준으로 SNS / 금융 / 구독 / 클라우드 / 기타
// ---------------------------------------------------------------------
exports.getAutoCategory = async (req, res) => {
  const { service_name } = req.body;

  if (!service_name || !service_name.trim()) {
    return res.status(400).json({ error: 'service_name은 필수입니다.' });
  }

  try {
    // 1) Gemini로 분류 시도
    let category = await classifyAssetCategory(service_name.trim());

    // 2) 실패 시 간단한 규칙 기반 fallback
    if (!category) {
      const nameLower = service_name.toLowerCase();

      if (
        nameLower.includes('instagram') ||
        nameLower.includes('facebook') ||
        nameLower.includes('twitter') ||
        nameLower.includes('카카오') ||
        nameLower.includes('kakao')
      ) {
        category = 'SNS';
      } else if (
        nameLower.includes('bank') ||
        nameLower.includes('은행') ||
        nameLower.includes('증권') ||
        nameLower.includes('카드')
      ) {
        category = '금융';
      } else if (
        nameLower.includes('netflix') ||
        nameLower.includes('디즈니') ||
        nameLower.includes('티빙') ||
        nameLower.includes('wavve') ||
        nameLower.includes('멜론') ||
        nameLower.includes('youtube premium')
      ) {
        category = '구독';
      } else if (
        nameLower.includes('drive') ||
        nameLower.includes('dropbox') ||
        nameLower.includes('onedrive') ||
        nameLower.includes('icloud') ||
        nameLower.includes('클라우드')
      ) {
        category = '클라우드';
      } else {
        category = '기타';
      }
    }

    return res.json({ category });
  } catch (err) {
    console.error('[ASSETS] getAutoCategory error:', err);
    return res
      .status(500)
      .json({ error: '카테고리 분류 중 오류가 발생했습니다.' });
  }
};

// 🔥 자산 요약 대시보드 (GET /assets/summary)
exports.getAssetsSummary = (req, res) => {
  const userId = req.user.userId;

  // 1) 전체 자산 수 + 월 구독 합계 + 지시 설정 완료 자산 수
  const sql = `
    SELECT
      COUNT(*) AS total_assets,
      COALESCE(SUM(CASE WHEN monthly_fee IS NOT NULL THEN monthly_fee ELSE 0 END), 0) AS total_monthly_fee,
      COALESCE(SUM(
        CASE
          WHEN ai.id IS NOT NULL THEN 1
          ELSE 0
        END
      ), 0) AS assets_with_instruction
    FROM digital_assets da
    LEFT JOIN asset_instructions ai ON ai.asset_id = da.id
    WHERE da.user_id = ?
  `;

  db.get(sql, [userId], (err, row) => {
    if (err) {
      console.error('[ASSETS] getAssetsSummary error:', err);
      return res.status(500).json({ error: err.message });
    }

    const totalAssets = row.total_assets || 0;
    const assetsWithInstruction = row.assets_with_instruction || 0;

    const completionRate =
      totalAssets === 0
        ? 0
        : Math.round((assetsWithInstruction / totalAssets) * 100);

    res.json({
      totalAssets,
      totalMonthlyFee: row.total_monthly_fee || 0,
      assetsWithInstruction,
      completionRate, // % 값 (0~100)
    });
  });
};