// routes/timeCapsules.js
const express = require('express');
const router = express.Router();

const auth = require('../../auth');
const ctrl = require('../controllers/timeCapsules');

// 나의 타임캡슐 목록
router.get('/', auth, ctrl.listMyCapsules);

// 나의 타임캡슐 상세
router.get('/:id', auth, ctrl.getMyCapsuleById);

// 타임캡슐 생성
router.post('/', auth, ctrl.createCapsule);

// 타임캡슐 수정
router.put('/:id', auth, ctrl.updateCapsule);

// 타임캡슐 삭제
router.delete('/:id', auth, ctrl.deleteCapsule);

module.exports = router;
