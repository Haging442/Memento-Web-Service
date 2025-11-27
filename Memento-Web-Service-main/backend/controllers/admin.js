// controllers/admin.js
const db = require('../db');

// 전체 사용자 목록 (관리자용)
exports.getAllUsers = (req, res) => {
  db.all(
      `SELECT id, username, name, role, created_at 
      FROM users 
      ORDER BY created_at DESC`,
      [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
      });
};

// 전체 자산 목록 (관리자용, 누가 어떤 자산을 갖고 있는지)
exports.getAllAssets = (req, res) => {
  db.all(
      `SELECT 
       a.id,
       a.service_name,
       a.category,
       a.login_id,
       a.monthly_fee,
       a.created_at,
       u.username AS owner_username
     FROM digital_assets a
     JOIN users u ON a.user_id = u.id
     ORDER BY a.created_at DESC`,
      [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
      });
};

// 전체 신뢰 연락처 목록 (관리자용)
exports.getAllContacts = (req, res) => {
  db.all(
      `SELECT 
       c.id,
       c.name,
       c.relation,
       c.email,
       c.phone,
       c.created_at,
       u.username AS owner_username
     FROM trusted_contacts c
     JOIN users u ON c.user_id = u.id
     ORDER BY c.created_at DESC`,
      [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
      });
};
// 시스템 모니터링(누가 가입했는지, 누가 어떤 자산과 연락처를 추가했는지 등)
// 용도로 사용

