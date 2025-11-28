// controllers/timeCapsules.js
const db = require('../db');
// IMMEDIATE 공개 시 이메일 알림을 위해 추가
const { sendTimeCapsuleNotification } = require('../routes/email');

// 1) 나의 타임캡슐 목록 조회 (GET /time-capsules)
exports.listMyCapsules = (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT 
       id, 
       title, 
       release_type, 
       release_date, 
       recipient_name, 
       is_released, 
       created_at, 
       released_at,
       beneficiary_email
     FROM time_capsules
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// 2) 타임캡슐 하나 상세조회 (GET /time-capsules/:id)
exports.getMyCapsuleById = (req, res) => {
  const userId = req.user.userId;
  const capsuleId = parseInt(req.params.id, 10);

  db.get(
    `SELECT *
     FROM time_capsules
     WHERE id = ? AND user_id = ?`,
    [capsuleId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'CAPSULE_NOT_FOUND' });
      res.json(row);
    }
  );
};

// 3) 타임캡슐 생성 (POST /time-capsules)
exports.createCapsule = (req, res) => {
  const userId = req.user.userId;
  const {
    title,
    message,
    mediaUrl,
    // content_text, file_url 등은 별도 업로드 API에서 다룰 수도 있어서 여기서는 옵션
    releaseType,
    releaseDate,
    recipientName,
    recipientContact,
    beneficiaryEmail, // 🔥 수혜자 이메일 추가
  } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: 'TITLE_REQUIRED' });
  }

  const allowed = ['ON_DEATH', 'ON_DATE', 'IMMEDIATE'];
  if (!allowed.includes(releaseType)) {
    return res.status(400).json({ error: 'INVALID_RELEASE_TYPE', allowed });
  }

  // ON_DATE인데 releaseDate가 없으면 에러
  if (releaseType === 'ON_DATE' && !releaseDate) {
    return res
      .status(400)
      .json({ error: 'RELEASE_DATE_REQUIRED_FOR_ON_DATE' });
  }

  const nowIso = new Date().toISOString();
  const isReleased = releaseType === 'IMMEDIATE' ? 1 : 0;
  const releasedAt = releaseType === 'IMMEDIATE' ? nowIso : null;

  db.run(
    `INSERT INTO time_capsules
       (user_id, title, message, media_url, 
        release_type, release_date, 
        recipient_name, recipient_contact,
        beneficiary_email, is_released, released_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      title,
      message,
      mediaUrl,
      releaseType,
      releaseDate,
      recipientName,
      recipientContact,
      beneficiaryEmail || null,
      isReleased,
      releasedAt,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const capsuleId = this.lastID;

      // 🔥 IMMEDIATE 타입이면 생성 시점에 바로 공개 로그 + 이메일 알림 처리
      if (releaseType === 'IMMEDIATE') {
        // 공개 로그 기록
        db.run(
          `INSERT INTO capsule_release_logs (capsule_id, user_id, release_type, email_sent)
           VALUES (?, ?, 'IMMEDIATE', ?)`,
          [capsuleId, userId, beneficiaryEmail ? 1 : 0],
          (logErr) => {
            if (logErr) {
              console.error(
                '[TIME CAPSULE] Failed to log IMMEDIATE release:',
                logErr.message
              );
            }
          }
        );

        // 수혜자 이메일 알림
        if (beneficiaryEmail) {
          sendTimeCapsuleNotification(beneficiaryEmail, userId, title)
            .then(() => {
              console.log(
                `[EMAIL] IMMEDIATE Time capsule notification sent to ${beneficiaryEmail}`
              );
            })
            .catch((emailErr) => {
              console.error(
                '[EMAIL] Failed to send IMMEDIATE time capsule notification:',
                emailErr
              );
            });
        }
      }

      res
        .status(201)
        .json({ message: 'TIME_CAPSULE_CREATED', id: capsuleId });
    }
  );
};

// 4) 타임캡슐 수정 (PUT /time-capsules/:id)
//    - 이미 is_released = 1 이면 수정 불가(잠가버림)
exports.updateCapsule = (req, res) => {
  const userId = req.user.userId;
  const capsuleId = parseInt(req.params.id, 10);

  const {
    title,
    message,
    mediaUrl,
    releaseType,
    releaseDate,
    recipientName,
    recipientContact,
    beneficiaryEmail, // 🔥 추가
  } = req.body || {};

  const allowed = ['ON_DEATH', 'ON_DATE', 'IMMEDIATE'];
  if (releaseType && !allowed.includes(releaseType)) {
    return res.status(400).json({ error: 'INVALID_RELEASE_TYPE', allowed });
  }

  db.get(
    `SELECT * FROM time_capsules WHERE id = ? AND user_id = ?`,
    [capsuleId, userId],
    (err, existing) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!existing)
        return res.status(404).json({ error: 'CAPSULE_NOT_FOUND' });

      if (existing.is_released) {
        return res
          .status(400)
          .json({ error: 'CANNOT_EDIT_RELEASED_CAPSULE' });
      }

      const newTitle = title ?? existing.title;
      const newMessage = message ?? existing.message;
      const newMediaUrl = mediaUrl ?? existing.media_url;
      const newReleaseType = releaseType ?? existing.release_type;
      const newReleaseDate = releaseDate ?? existing.release_date;
      const newRecipientName = recipientName ?? existing.recipient_name;
      const newRecipientContact =
        recipientContact ?? existing.recipient_contact;
      const newBeneficiaryEmail =
        beneficiaryEmail ?? existing.beneficiary_email;
      const now = new Date().toISOString();

      if (newReleaseType === 'ON_DATE' && !newReleaseDate) {
        return res.status(400).json({
          error: 'RELEASE_DATE_REQUIRED_FOR_ON_DATE',
        });
      }

      db.run(
        `UPDATE time_capsules
         SET title = ?, 
             message = ?, 
             media_url = ?, 
             release_type = ?, 
             release_date = ?,
             recipient_name = ?, 
             recipient_contact = ?, 
             beneficiary_email = ?,
             updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          newTitle,
          newMessage,
          newMediaUrl,
          newReleaseType,
          newReleaseDate,
          newRecipientName,
          newRecipientContact,
          newBeneficiaryEmail,
          now,
          capsuleId,
          userId,
        ],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });

          // 🔥 수정하면서 IMMEDIATE로 바꾼 경우 → 즉시 공개 처리
          if (newReleaseType === 'IMMEDIATE') {
            const releaseTime = new Date().toISOString();

            db.run(
              `UPDATE time_capsules
               SET is_released = 1,
                   released_at = ?
               WHERE id = ?`,
              [releaseTime, capsuleId],
              (updateErr) => {
                if (updateErr) {
                  console.error(
                    '[TIME CAPSULE] Failed to set IMMEDIATE released state:',
                    updateErr.message
                  );
                }
              }
            );

            // 공개 로그 기록
            db.run(
              `INSERT INTO capsule_release_logs (capsule_id, user_id, release_type, email_sent)
               VALUES (?, ?, 'IMMEDIATE', ?)`,
              [capsuleId, userId, newBeneficiaryEmail ? 1 : 0],
              (logErr) => {
                if (logErr) {
                  console.error(
                    '[TIME CAPSULE] Failed to log IMMEDIATE release (update):',
                    logErr.message
                  );
                }
              }
            );

            // 수혜자 이메일 알림
            if (newBeneficiaryEmail) {
              sendTimeCapsuleNotification(
                newBeneficiaryEmail,
                userId,
                newTitle
              )
                .then(() => {
                  console.log(
                    `[EMAIL] IMMEDIATE Time capsule notification (update) sent to ${newBeneficiaryEmail}`
                  );
                })
                .catch((emailErr) => {
                  console.error(
                    '[EMAIL] Failed to send IMMEDIATE time capsule notification (update):',
                    emailErr
                  );
                });
            }
          }

          res.json({ message: 'TIME_CAPSULE_UPDATED' });
        }
      );
    }
  );
};

// 5) 타임캡슐 삭제 (DELETE /time-capsules/:id)
exports.deleteCapsule = (req, res) => {
  const userId = req.user.userId;
  const capsuleId = parseInt(req.params.id, 10);

  db.run(
    `DELETE FROM time_capsules WHERE id = ? AND user_id = ?`,
    [capsuleId, userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'CAPSULE_NOT_FOUND' });
      }
      res.json({ message: 'TIME_CAPSULE_DELETED' });
    }
  );
};

// ---------------------------------------------------------------
// 6) 날짜 기반 타임캡슐 자동 공개 함수 (스케줄러용 / 레거시)
// ---------------------------------------------------------------
//
// ※ server.js에서 이미 ON_DATE / ON_DEATH에 대한 새로운 자동 공개 로직을
//    직접 구현해두었기 때문에, 이 함수는 "원하면 추가로 쓸 수 있는 레거시 옵션"에 가깝다.
//
exports.autoRelease = () => {
  const now = new Date().toISOString();

  console.log(
    '[AUTO RELEASE DATE] Checking for date-based capsules to release...'
  );

  db.all(
    `SELECT id, user_id, title, release_date
     FROM time_capsules
     WHERE release_type = 'ON_DATE'
       AND (is_released = 0 OR is_released IS NULL)
       AND release_date <= ?`,
    [now],
    (err, capsules) => {
      if (err) {
        console.error(
          '[AUTO RELEASE DATE] Query error:',
          err.message
        );
        return;
      }

      if (!capsules || capsules.length === 0) {
        console.log(
          '[AUTO RELEASE DATE] No capsules to release at this time.'
        );
        return;
      }

      console.log(
        `[AUTO RELEASE DATE] Found ${capsules.length} capsule(s) to release.`
      );

      const stmt = db.prepare(`
        UPDATE time_capsules
        SET is_released = 1,
            released_at = ?
        WHERE id = ?
      `);

      capsules.forEach((capsule) => {
        stmt.run([now, capsule.id], (err2) => {
          if (err2) {
            console.error(
              `[AUTO RELEASE DATE] Failed to release capsule ${capsule.id}:`,
              err2.message
            );
          } else {
            console.log(
              `[AUTO RELEASE DATE] Capsule ${capsule.id} (${capsule.title}) released for user ${capsule.user_id}`
            );
          }
        });
      });

      stmt.finalize((err3) => {
        if (err3) {
          console.error(
            '[AUTO RELEASE DATE] Statement finalize error:',
            err3.message
          );
        } else {
          console.log(
            '[AUTO RELEASE DATE] Auto-release process completed.'
          );
        }
      });
    }
  );
};
