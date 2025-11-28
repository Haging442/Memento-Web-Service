// routes/assets.js
const express = require('express');
const router = express.Router();

const auth = require('../auth');
const ctrl = require('../controllers/assets');
const instCtrl = require('../controllers/assetInstructions');

// -------------------------------------
// 🔥 AI 자동 카테고리 분류 (POST /assets/auto-category)
// -------------------------------------
router.post('/auto-category', auth, ctrl.getAutoCategory);

// 🔥 자산 요약 (대시보드 요약 정보)
router.get('/summary', auth, ctrl.getAssetsSummary);

// 🔹 자산 목록 조회
router.get('/', auth, ctrl.getAssets);

// 🔹 자산 등록
router.post('/', auth, ctrl.createAsset);

// 🔹 자산 단일 조회
router.get('/:id', auth, ctrl.getAssetById);

// 🔹 수정
router.put('/:id', auth, ctrl.updateAsset);

// 🔹 삭제
router.delete('/:id', auth, ctrl.deleteAsset);

// -------------------------------------
// 🔥 사후 지시(instruction) 기능
// -------------------------------------

// 🔥 특정 자산의 사후 지시 조회
router.get('/:id/instruction', auth, instCtrl.getInstruction);

// 🔥 사후 지시 생성 또는 수정
router.post('/:id/instruction', auth, instCtrl.upsertInstruction);

module.exports = router;
