const express = require('express');
const router = express.Router();
const auth = require('../../auth');
const ctrl = require('../controllers/assets');
const instCtrl = require('../controllers/assetInstructions');  // ⬅ 추가

// 목록 조회
router.get('/', auth, ctrl.getAssets);

// 등록
router.post('/', auth, ctrl.createAsset);

// 단일 조회
router.get('/:id', auth, ctrl.getAssetById);

// 수정
router.put('/:id', auth, ctrl.updateAsset);

// 삭제
router.delete('/:id', auth, ctrl.deleteAsset);

// 🔥 사후 지시 조회 (내 자산에 대해서만)
router.get('/:id/instruction', auth, instCtrl.getInstruction);

// 🔥 사후 지시 생성/수정
router.post('/:id/instruction', auth, instCtrl.upsertInstruction);

module.exports = router;
