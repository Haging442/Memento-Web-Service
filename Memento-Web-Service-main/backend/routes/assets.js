const express = require('express');
const router = express.Router();
const auth = require('../auth');
const ctrl = require('../controllers/assets');

// 목록 조회
router.get('/', auth, ctrl.getAssets);

// 등록
router.post('/', auth, ctrl.createAsset);

// 🔹 단일 조회
router.get('/:id', auth, ctrl.getAssetById);

// 🔹 수정 (전체 수정이니까 PUT 사용)
router.put('/:id', auth, ctrl.updateAsset);

// 🔹 삭제
router.delete('/:id', auth, ctrl.deleteAsset);

module.exports = router;
