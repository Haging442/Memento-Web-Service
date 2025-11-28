// controllers/contacts.js
const db = require('../db');

// ---------------------------------------------------------------------
// 1) 신뢰 연락처 목록 조회 (GET /contacts)
//    - PDF: "최소 2명의 신뢰 연락처 등록"에 해당하는 목록
// ---------------------------------------------------------------------
exports.getContacts = (req, res) => {
  const userId = req.user.userId;
  
  db.all(
    `SELECT id, user_id, name, relation, email, phone, created_at
     FROM trusted_contacts
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
// 2) 신뢰 연락처 등록 (POST /contacts)
//    - 이름, 관계, 이메일, 전화번호 입력
// ---------------------------------------------------------------------
exports.createContact = (req, res) => {
  const userId = req.user.userId;
  const { name, relation, email, phone } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'NAME_REQUIRED' });
  }

  // 이메일/전화번호 둘 중 하나는 있어야 연락 가능
  if ((!email || !email.trim()) && (!phone || !phone.trim())) {
    return res
      .status(400)
      .json({ error: 'EMAIL_OR_PHONE_REQUIRED' });
  }

  db.run(
    `INSERT INTO trusted_contacts (user_id, name, relation, email, phone)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, name.trim(), relation || null, email || null, phone || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'CONTACT_CREATED', id: this.lastID });
    }
  );
};

// ---------------------------------------------------------------------
// 3) 신뢰 연락처 수정 (PUT /contacts/:id)
// ---------------------------------------------------------------------
exports.updateContact = (req, res) => {
  const userId = req.user.userId;
  const contactId = parseInt(req.params.id, 10);
  const { name, relation, email, phone } = req.body || {};

  if (Number.isNaN(contactId)) {
    return res.status(400).json({ error: 'INVALID_CONTACT_ID' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'NAME_REQUIRED' });
  }

  if ((!email || !email.trim()) && (!phone || !phone.trim())) {
    return res
      .status(400)
      .json({ error: 'EMAIL_OR_PHONE_REQUIRED' });
  }

  db.run(
    `UPDATE trusted_contacts
     SET name = ?, relation = ?, email = ?, phone = ?
     WHERE id = ? AND user_id = ?`,
    [name.trim(), relation || null, email || null, phone || null, contactId, userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ error: 'CONTACT_NOT_FOUND_OR_NO_PERMISSION' });
      }
      res.json({ message: 'CONTACT_UPDATED' });
    }
  );
};

// ---------------------------------------------------------------------
// 4) 신뢰 연락처 삭제 (DELETE /contacts/:id)
// ---------------------------------------------------------------------
exports.deleteContact = (req, res) => {
  const userId = req.user.userId;
  const contactId = parseInt(req.params.id, 10);

  if (Number.isNaN(contactId)) {
    return res.status(400).json({ error: 'INVALID_CONTACT_ID' });
  }

  db.run(
    `DELETE FROM trusted_contacts
     WHERE id = ? AND user_id = ?`,
    [contactId, userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ error: 'CONTACT_NOT_FOUND_OR_NO_PERMISSION' });
      }
      res.json({ message: 'CONTACT_DELETED' });
    }
  );
};

// ---------------------------------------------------------------------
// 5) 신뢰 연락처 요약 (GET /contacts/summary)
//    - totalContacts: 전체 신뢰 연락처 수
//    - hasMinimumContacts: 최소 2명 이상 등록 여부
// ---------------------------------------------------------------------
exports.getContactsSummary = (req, res) => {
  const userId = req.user.userId;

  db.get(
    `SELECT COUNT(*) AS total_contacts
     FROM trusted_contacts
     WHERE user_id = ?`,
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const total = row?.total_contacts || 0;
      res.json({
        totalContacts: total,
        hasMinimumContacts: total >= 2
      });
    }
  );
};
