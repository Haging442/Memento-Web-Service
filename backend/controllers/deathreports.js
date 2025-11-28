// controllers/deathReports.js
const db = require('../db');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const {
  sendVerificationEmail,
  sendDeathReportAlertToOwner,
} = require('../routes/email');

// memorial 컨트롤러 (있으면 사용, 없으면 무시)
let memorialController;
try {
  memorialController = require('./memorial');
} catch (err) {
  console.warn('[WARNING] memorial controller not found, memorial space auto-generation will be skipped');
  memorialController = null;
}

// ------------------------------------------------------
// (선택) 사망확인서 PDF OCR 추출 헬퍼 (실제 구현은 라이브러리 필요)
// ------------------------------------------------------
async function extractCertificateInfo(filePath) {
  // TODO:
  // 1. pdf-parse 또는 Tesseract / 외부 OCR API 연동
  // 2. 파일에서 텍스트를 추출한 뒤, 이름/주민번호 일부 패턴 매칭
  // 여기서는 구조만 잡고, 실제 OCR 구현은 이후 단계에서 추가
  console.log('[CERT OCR] Placeholder called for', filePath);

  return {
    rawText: null,      // 추출 전체 텍스트
    name: null,         // 인식된 이름
    idFragment: null,   // 주민번호 뒷자리 일부 등
  };
}

// 1) 사망 의심 신고 생성 (공개 API, 로그인 필요 X)
//    + 대상 유저의 신뢰 연락처 최소 2명에게 검증 토큰 생성
//    + 검증 이메일 발송
exports.createReport = (req, res) => {
  const { targetUsername, reporterName, reporterContact, relation, message } = req.body || {};

  if (!targetUsername) {
    return res.status(400).json({ error: 'TARGET_USERNAME_REQUIRED' });
  }

  // 1. 대상 사용자 찾기
  db.get(
    `SELECT id, username, name FROM users WHERE username = ?`,
    [targetUsername],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(400).json({ error: 'TARGET_USER_NOT_FOUND' });

      const targetUserId = user.id;

      // 2. 대상 유저의 신뢰 연락처 조회
      db.all(
        `SELECT id, name, email, phone FROM trusted_contacts WHERE user_id = ?`,
        [targetUserId],
        (err2, contacts) => {
          if (err2) return res.status(500).json({ error: err2.message });

          if (!contacts || contacts.length < 2) {
            return res.status(400).json({
              error: 'NOT_ENOUGH_TRUSTED_CONTACTS',
              message: '신뢰 연락처가 최소 2명 이상 등록되어 있어야 합니다.',
            });
          }

          // 일단 앞에서부터 2명만 사용 (원하면 전체로 확장 가능)
          const selectedContacts = contacts.slice(0, 2);

          // 3. death_reports에 신고 INSERT
          db.run(
            `INSERT INTO death_reports
             (target_user_id, reporter_name, reporter_contact, relation, message)
             VALUES (?, ?, ?, ?, ?)`,
            [targetUserId, reporterName, reporterContact, relation, message],
            function (err3) {
              if (err3) return res.status(500).json({ error: err3.message });

              const reportId = this.lastID;

              // 4. death_verifications에 각 연락처별 토큰 INSERT
              const tokens = [];
              db.serialize(() => {
                const stmt = db.prepare(
                  `INSERT INTO death_verifications
                   (death_report_id, contact_id, token)
                   VALUES (?, ?, ?)`
                );

                selectedContacts.forEach((c) => {
                  const token = crypto.randomBytes(16).toString('hex');
                  tokens.push({
                    contactId: c.id,
                    contactName: c.name,
                    contactEmail: c.email,
                    contactPhone: c.phone,
                    token,
                  });
                  stmt.run([reportId, c.id, token]);
                });

                stmt.finalize(async (err4) => {
                  if (err4) return res.status(500).json({ error: err4.message });

                  // 🔹 검증 이메일 발송 (실 서비스에서 핵심)
                  for (const t of tokens) {
                    if (t.contactEmail) {
                      try {
                        await sendVerificationEmail(
                          t.contactEmail,
                          t.contactName || '신뢰 연락처',
                          t.token,
                          reportId,
                          user.username
                        );
                      } catch (mailErr) {
                        console.error('[DEATH REPORT] sendVerificationEmail error:', mailErr.message);
                      }
                    }
                  }

                  // ⚠ 개발/테스트용: 토큰을 응답에 포함 (실서비스에서는 제거 권장)
                  res.status(201).json({
                    message: 'DEATH_REPORT_CREATED',
                    reportId,
                    verifications: tokens,
                  });
                });
              });
            }
          );
        }
      );
    }
  );
};

// 2) 관리자용: 신고 목록 조회 (status 필터 가능)
exports.getReports = (req, res) => {
  const { status } = req.query;
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
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// 3) 관리자용: 신고 상태 변경 (CONFIRMED / REJECTED / CANCELED / PENDING)
//    + CONFIRMED 시 사망 확정 후속 처리 (사망일 기록, 추모 공간 생성)
exports.updateReportStatus = (req, res) => {
  const reportId = req.params.id;
  const { status, adminNote } = req.body || {};

  const allowed = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELED'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'INVALID_STATUS', allowed });
  }

  const resolvedAt = status === 'PENDING' ? null : new Date().toISOString();

  // 1. 신고 정보 업데이트 및 사용자 ID 확인
  db.get(
    `SELECT target_user_id FROM death_reports WHERE id = ?`,
    [reportId],
    (err, report) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!report) return res.status(404).json({ error: 'REPORT_NOT_FOUND' });

      const targetUserId = report.target_user_id;

      // 2. death_reports 상태 업데이트
      db.run(
        `UPDATE death_reports
         SET status = ?, admin_note = ?, resolved_at = ?
         WHERE id = ?`,
        [status, adminNote, resolvedAt, reportId],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          if (this.changes === 0) {
            return res.status(404).json({ error: 'REPORT_NOT_FOUND' });
          }

          // 3. 사망 확정(CONFIRMED) 시 후속 처리 트리거 
          if (status === 'CONFIRMED') {
            const deathDate = new Date().toISOString();

            // 3-1. 사용자의 사망일 기록 (users 테이블 업데이트)
            db.run(
              `UPDATE users SET death_date = ? WHERE id = ?`,
              [deathDate, targetUserId],
              (updateErr) => {
                if (updateErr) console.error('사용자 사망일 업데이트 실패:', updateErr.message);
              }
            );

            // 3-2. AI 추모 공간 자동 생성 트리거 (비동기 처리)
            if (memorialController && typeof memorialController.generateMemorialSpace === 'function') {
              const mockReq = {
                user: { id: targetUserId },
                body: { desiredVibe: '평온하고 따뜻한 분위기' },
              };
              const mockRes = {
                json: (data) => {
                  console.log(`[Memorial] 추모 공간 자동 생성 결과: ${data.success ? '성공' : '실패'}`);
                },
                status: (code) => mockRes,
              };

              memorialController
                .generateMemorialSpace(mockReq, mockRes)
                .catch((e) => console.error('[Memorial] 추모 공간 생성 중 오류:', e));
            } else {
              console.log('[Memorial] 추모 공간 컨트롤러를 찾을 수 없어 생성을 건너뜁니다.');
            }

            // 3-3. 기타 사후 처리 로직 (e.g., 신뢰인 알림 발송, 계정 잠금 등) 추가 예정
            console.log(`[Death Report] 사용자 ID ${targetUserId} 사망 확정(관리자). 후속 처리 시작.`);
          }

          res.json({ message: 'REPORT_UPDATED_AND_FOLLOW_UP_TRIGGERED' });
        }
      );
    }
  );
};

// 4) 신뢰 연락처용: 토큰으로 검증 (CONFIRM / REJECT)
exports.verifyByToken = (req, res) => {
  const { token, decision } = req.body || {};
  if (!token) return res.status(400).json({ error: 'TOKEN_REQUIRED' });

  const upper = (decision || 'CONFIRM').toUpperCase();
  const isReject = upper === 'REJECT';

  const newStatus = isReject ? 'REJECTED' : 'CONFIRMED';
  const now = new Date().toISOString();

  // 1. 토큰에 해당하는 검증 레코드 조회
  db.get(
    `SELECT * FROM death_verifications WHERE token = ?`,
    [token],
    (err, v) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!v) return res.status(404).json({ error: 'VERIFICATION_NOT_FOUND' });

      if (v.status !== 'PENDING') {
        return res.status(400).json({ error: 'ALREADY_PROCESSED', status: v.status });
      }

      // 2. 이 검증 레코드 상태 업데이트
      db.run(
        `UPDATE death_verifications
         SET status = ?, verified_at = ?
         WHERE id = ?`,
        [newStatus, now, v.id],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });

          // 3. 만약 CONFIRMED라면, 해당 신고의 CONFIRMED 수 확인
          if (newStatus === 'CONFIRMED') {
            db.get(
              `SELECT COUNT(*) AS cnt
               FROM death_verifications
               WHERE death_report_id = ? AND status = 'CONFIRMED'`,
              [v.death_report_id],
              (err3, row) => {
                if (err3) return res.status(500).json({ error: err3.message });

                const confirmedCount = row.cnt || 0;

                if (confirmedCount >= 2) {
                  // 4. 2인 이상 CONFIRMED → death_reports.status = 'CONFIRMED'
                  db.run(
                    `UPDATE death_reports
                     SET status = 'CONFIRMED', resolved_at = ?
                     WHERE id = ?`,
                    [now, v.death_report_id],
                    function (err4) {
                      if (err4) return res.status(500).json({ error: err4.message });

                      // 🔔 본인(계정 소유자)에게 “사망 신고 접수” 알림 이메일 (문자 대체)
                      db.get(
                        `SELECT u.username, u.name
                         FROM death_reports dr
                         JOIN users u ON dr.target_user_id = u.id
                         WHERE dr.id = ?`,
                        [v.death_report_id],
                        async (err5, targetUser) => {
                          if (!err5 && targetUser) {
                            try {
                              // username을 이메일로 쓰는 구조라고 가정
                              await sendDeathReportAlertToOwner(
                                targetUser.username,
                                targetUser.name || targetUser.username
                              );
                            } catch (mailErr) {
                              console.error('[DeathReport] sendDeathReportAlertToOwner error:', mailErr.message);
                            }
                          }
                        }
                      );

                      return res.json({
                        message: 'VERIFICATION_CONFIRMED_AND_REPORT_CONFIRMED',
                        reportId: v.death_report_id,
                        confirmedCount,
                      });
                    }
                  );
                } else {
                  // 아직 2인 미만
                  return res.json({
                    message: 'VERIFICATION_CONFIRMED',
                    reportId: v.death_report_id,
                    confirmedCount,
                  });
                }
              }
            );
          } else {
            // REJECTED인 경우
            return res.json({
              message: 'VERIFICATION_REJECTED',
              reportId: v.death_report_id,
            });
          }
        }
      );
    }
  );
};

// 5) 본인 로그인 시, 자신의 사망 의심 신고 취소
exports.cancelByOwner = (req, res) => {
  const userId = req.user?.userId;
  const reason = (req.body && req.body.reason) || '본인 로그인으로 취소됨.';

  if (!userId) {
    return res.status(401).json({ error: 'LOGIN_REQUIRED' });
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
    [reason, now, userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      if (this.changes === 0) {
        return res.status(404).json({
          error: 'NO_REPORT_TO_CANCEL',
          message: '취소할 수 있는 사망 의심 신고가 없습니다.',
        });
      }

      res.json({
        message: 'REPORTS_CANCELED_BY_OWNER',
        canceledCount: this.changes,
      });
    }
  );
};

// 6) 사망확인서(PDF) 업로드 + (향후) OCR 비교
//    POST /death-reports/:id/certificate
exports.uploadCertificate = async (req, res) => {
  const reportId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'CERTIFICATE_FILE_REQUIRED' });
  }

  // 신고 존재 여부 확인 + 대상 사용자 정보
  db.get(
    `SELECT dr.id, dr.target_user_id, u.username, u.name
     FROM death_reports dr
     JOIN users u ON dr.target_user_id = u.id
     WHERE dr.id = ?`,
    [reportId],
    async (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) {
        // 업로드한 파일 삭제
        fs.unlink(file.path, () => {});
        return res.status(404).json({ error: 'REPORT_NOT_FOUND' });
      }

      try {
        const info = await extractCertificateInfo(file.path);

        let nameMatched = false;
        if (info.name && row.name) {
          nameMatched = info.name.replace(/\s/g, '') === row.name.replace(/\s/g, '');
        }

        // 여기서 DB에 file_path / OCR 결과를 저장하려면
        // death_reports 테이블에 추가 컬럼이 필요함 (추후 마이그레이션에서 처리)

        res.json({
          ok: true,
          reportId: row.id,
          file: {
            originalName: file.originalname,
            storedPath: file.path,
          },
          ocr: info,
          match: {
            nameMatched,
          },
          message: '사망확인서가 업로드되었으며, OCR 분석은 후속 구현이 필요합니다.',
        });
      } catch (e) {
        console.error('[CERT OCR ERROR]', e);
        res.status(500).json({ error: 'CERTIFICATE_OCR_FAILED', details: e.message });
      }
    }
  );
};
