// controllers/deathReports.js
const db = require('../../db');
const crypto = require('crypto');

// 1) 사망 의심 신고 생성 (공개 API, 로그인 필요 X)
//    + 대상 유저의 신뢰 연락처 최소 2명에게 검증 토큰 생성
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

        // 2. 대상 유저의 신뢰 연락처 조회
        db.all(
            `SELECT id, name, email, phone FROM trusted_contacts WHERE user_id = ?`,
            [targetUserId], (err, contacts) => {
              if (err) return res.status(500).json({error: err.message});

              if (!contacts || contacts.length < 2) {
                return res.status(400).json({
                  error: 'NOT_ENOUGH_TRUSTED_CONTACTS',
                  message: '신뢰 연락처가 최소 2명 이상 등록되어 있어야 합니다.'
                });
              }

              // 일단 앞에서부터 2명만 사용 (원하면 전체로 확장 가능)
              const selectedContacts = contacts.slice(0, 2);

              // 3. death_reports에 신고 INSERT
              db.run(
                  `INSERT INTO death_reports
             (target_user_id, reporter_name, reporter_contact, relation, message)
             VALUES (?, ?, ?, ?, ?)`,
                  [
                    targetUserId, reporterName, reporterContact, relation,
                    message
                  ],
                  function(err) {
                    if (err) return res.status(500).json({error: err.message});

                    const reportId = this.lastID;

                    // 4. death_verifications에 각 연락처별 토큰 INSERT
                    const tokens = [];
                    db.serialize(() => {
                      const stmt = db.prepare(`INSERT INTO death_verifications
                   (death_report_id, contact_id, token)
                   VALUES (?, ?, ?)`);

                      selectedContacts.forEach((c) => {
                        const token = crypto.randomBytes(16).toString('hex');
                        tokens.push({
                          contactId: c.id,
                          contactName: c.name,
                          contactEmail: c.email,
                          contactPhone: c.phone,
                          token
                        });
                        stmt.run([reportId, c.id, token]);
                      });

                      stmt.finalize((err) => {
                        if (err)
                          return res.status(500).json({error: err.message});

                        // ⚠ 실제 서비스에서는 토큰을 이메일로 보내야 하지만,
                        // 지금은 개발/테스트용으로 응답에 토큰을 포함해 준다.
                        res.status(201).json({
                          message: 'DEATH_REPORT_CREATED',
                          reportId,
                          verifications: tokens
                        });
                      });
                    });
                  });
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

// 4) 신뢰 연락처용: 토큰으로 검증 (CONFIRM / REJECT)
exports.verifyByToken = (req, res) => {
  const {token, decision} = req.body || {};
  if (!token) return res.status(400).json({error: 'TOKEN_REQUIRED'});

  const upper = (decision || 'CONFIRM').toUpperCase();
  const isReject = upper === 'REJECT';

  const newStatus = isReject ? 'REJECTED' : 'CONFIRMED';
  const now = new Date().toISOString();

  // 1. 토큰에 해당하는 검증 레코드 조회
  db.get(
      `SELECT * FROM death_verifications WHERE token = ?`, [token],
      (err, v) => {
        if (err) return res.status(500).json({error: err.message});
        if (!v) return res.status(404).json({error: 'VERIFICATION_NOT_FOUND'});

        if (v.status !== 'PENDING') {
          return res.status(400).json(
              {error: 'ALREADY_PROCESSED', status: v.status});
        }

        // 2. 이 검증 레코드 상태 업데이트
        db.run(
            `UPDATE death_verifications
         SET status = ?, verified_at = ?
         WHERE id = ?`,
            [newStatus, now, v.id], function(err) {
              if (err) return res.status(500).json({error: err.message});

              // 3. 만약 CONFIRMED라면, 해당 신고의 CONFIRMED 수 확인
              if (newStatus === 'CONFIRMED') {
                db.get(
                    `SELECT COUNT(*) AS cnt
               FROM death_verifications
               WHERE death_report_id = ? AND status = 'CONFIRMED'`,
                    [v.death_report_id], (err, row) => {
                      if (err)
                        return res.status(500).json({error: err.message});

                      const confirmedCount = row.cnt || 0;

                      if (confirmedCount >= 2) {
                        // 4. 2인 이상 CONFIRMED → death_reports.status =
                        // 'CONFIRMED'
                        db.run(
                            `UPDATE death_reports
                     SET status = 'CONFIRMED', resolved_at = ?
                     WHERE id = ?`,
                            [now, v.death_report_id], function(err) {
                              if (err)
                                return res.status(500).json(
                                    {error: err.message});

                              return res.json({
                                message:
                                    'VERIFICATION_CONFIRMED_AND_REPORT_CONFIRMED',
                                reportId: v.death_report_id,
                                confirmedCount
                              });
                            });
                      } else {
                        // 아직 2인 미만
                        return res.json({
                          message: 'VERIFICATION_CONFIRMED',
                          reportId: v.death_report_id,
                          confirmedCount
                        });
                      }
                    });
              } else {
                // REJECTED인 경우
                return res.json({
                  message: 'VERIFICATION_REJECTED',
                  reportId: v.death_report_id
                });
              }
            });
      });
};
// 5) 본인 로그인 시, 자신의 사망 의심 신고 취소
exports.cancelByOwner = (req, res) => {
  const userId = req.user?.userId;
  const reason = (req.body && req.body.reason) || '본인 로그인으로 취소됨.';
  if (!userId) {
    return res.status(401).json({error: 'LOGIN_REQUIRED'});
  }

  const now = new Date().toISOString();

  // 내 계정(target_user_id = userId)에 걸린 신고들 중
  // 아직 살아있는 상태(PENDING / CONFIRMED / FINAL_CONFIRMED)를 전부 취소 처리
  db.run(
      `UPDATE death_reports
     SET status = 'CANCELED_BY_OWNER',
         admin_note = COALESCE(admin_note, '') || '\n[owner] ' || ?,
         resolved_at = ?
     WHERE target_user_id = ?
       AND status IN ('PENDING', 'CONFIRMED', 'FINAL_CONFIRMED')`,
      [reason, now, userId], function(err) {
        if (err) return res.status(500).json({error: err.message});

        if (this.changes === 0) {
          return res.status(404).json({
            error: 'NO_REPORT_TO_CANCEL',
            message: '취소할 수 있는 사망 의심 신고가 없습니다.'
          });
        }

        res.json({
          message: 'REPORTS_CANCELED_BY_OWNER',
          canceledCount: this.changes
        });
      });
};
