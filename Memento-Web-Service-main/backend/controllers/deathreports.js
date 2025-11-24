// controllers/deathReports.js
const db = require('../db');

// 1) 사망 의심 신고 생성 (공개 API, 로그인 필요 X)
exports.createReport = (req, res) => {
  const {targetUsername, reporterName, reporterContact, relation, message} =
      req.body || {};

  if (!targetUsername) {
    return res.status(400).json({error: 'TARGET_USERNAME_REQUIRED'});
  }

  // 1. 대상 사용자 찾기
  db.get(
      `SELECT id FROM users WHERE username = ?`, [targetUsername],
      (err, user) => {
        if (err) return res.status(500).json({error: err.message});
        if (!user)
          return res.status(400).json({error: 'TARGET_USER_NOT_FOUND'});

        const targetUserId = user.id;

        // 2. death_reports에 INSERT
        db.run(
            `INSERT INTO death_reports
         (target_user_id, reporter_name, reporter_contact, relation, message)
         VALUES (?, ?, ?, ?, ?)`,
            [targetUserId, reporterName, reporterContact, relation, message],
            function(err) {
              if (err) return res.status(500).json({error: err.message});

              res.status(201).json(
                  {message: 'DEATH_REPORT_CREATED', reportId: this.lastID});
            });
      });
};

// 2) 관리자용: 신고 목록 조회 (status 필터 가능)
exports.getReports = (req, res) => {
  const {status} = req.query;
  let sql = `
    SELECT
      dr.id,
      dr.target_user_id,
      u.username AS target_username,
      dr.reporter_name,
      dr.reporter_contact,
      dr.relation,
      dr.message,
      dr.status,
      dr.admin_note,
      dr.created_at,
      dr.resolved_at
    FROM death_reports dr
    JOIN users u ON dr.target_user_id = u.id
  `;
  const params = [];

  if (status) {
    sql += ` WHERE dr.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY dr.created_at DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
};

// 3) 관리자용: 신고 상태 변경 (CONFIRMED / REJECTED / CANCELED / PENDING)
exports.updateReportStatus = (req, res) => {
  const reportId = req.params.id;
  const {status, adminNote} = req.body || {};

  const allowed = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELED'];
  if (!allowed.includes(status)) {
    return res.status(400).json({error: 'INVALID_STATUS', allowed});
  }

  // status가 PENDING이면 resolved_at은 NULL, 나머지는 현재시간으로
  const resolvedAt = (status === 'PENDING') ? null : new Date().toISOString();

  db.run(
      `UPDATE death_reports
     SET status = ?, admin_note = ?, resolved_at = ?
     WHERE id = ?`,
      [status, adminNote, resolvedAt, reportId], function(err) {
        if (err) return res.status(500).json({error: err.message});
        if (this.changes === 0) {
          return res.status(404).json({error: 'REPORT_NOT_FOUND'});
        }
        res.json({message: 'REPORT_UPDATED'});
      });
};
