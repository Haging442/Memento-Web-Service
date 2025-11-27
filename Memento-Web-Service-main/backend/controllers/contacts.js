// controllers/contacts.js
const db = require('../db');

// 신뢰 연락처 목록 조회 (GET /contacts)
exports.getContacts = (req, res) => {
  const userId = req.user.userId;
  
  db.all(
    `SELECT * FROM trusted_contacts WHERE user_id = ?`, 
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({error: err.message});
      res.json(rows);
    }
  );
};

// 신뢰 연락처 등록 (POST /contacts)
exports.createContact = (req, res) => {
  const userId = req.user.userId;
  const {name, relation, email, phone} = req.body;
  
  db.run(
    `INSERT INTO trusted_contacts (user_id, name, relation, email, phone)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, name, relation, email, phone], 
    function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({message: 'CONTACT CREATED', id: this.lastID});
    }
  );
};