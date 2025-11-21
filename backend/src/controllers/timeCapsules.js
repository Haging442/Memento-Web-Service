// controllers/timeCapsules.js
const db = require('../../db');

// 1) 나의 타임캡슐 목록 조회 (GET /time-capsules)
exports.listMyCapsules = (req, res) => {
  const userId = req.user.userId;

  db.all(
      `SELECT id, title, release_type, release_date, recipient_name, is_released, created_at, released_at
     FROM time_capsules
     WHERE user_id = ?
     ORDER BY created_at DESC`,
      [userId], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
      });
};

// 2) 타임캡슐 하나 상세조회 (GET /time-capsules/:id)
exports.getMyCapsuleById = (req, res) => {
  const userId = req.user.userId;
  const capsuleId = parseInt(req.params.id, 10);

  db.get(
      `SELECT *
     FROM time_capsules
     WHERE id = ? AND user_id = ?`,
      [capsuleId, userId], (err, row) => {
        if (err) return res.status(500).json({error: err.message});
        if (!row) return res.status(404).json({error: 'CAPSULE_NOT_FOUND'});
        res.json(row);
      });
};

// 3) 타임캡슐 생성 (POST /time-capsules)
exports.createCapsule = (req, res) => {
  const userId = req.user.userId;
  const {
    title,
    message,
    mediaUrl,
    releaseType,
    releaseDate,
    recipientName,
    recipientContact
  } = req.body || {};

  if (!title) {
    return res.status(400).json({error: 'TITLE_REQUIRED'});
  }

  const allowed = ['ON_DEATH', 'ON_DATE', 'IMMEDIATE'];
  if (!allowed.includes(releaseType)) {
    return res.status(400).json({error: 'INVALID_RELEASE_TYPE', allowed});
  }

  // ON_DATE인데 releaseDate가 없으면 에러
  if (releaseType === 'ON_DATE' && !releaseDate) {
    return res.status(400).json({error: 'RELEASE_DATE_REQUIRED_FOR_ON_DATE'});
  }

  db.run(
      `INSERT INTO time_capsules
     (user_id, title, message, media_url, release_type, release_date, recipient_name, recipient_contact)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, title, message, mediaUrl, releaseType, releaseDate,
        recipientName, recipientContact
      ],
      function(err) {
        if (err) return res.status(500).json({error: err.message});

        res.status(201).json(
            {message: 'TIME_CAPSULE_CREATED', id: this.lastID});
      });
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
    recipientContact
  } = req.body || {};

  const allowed = ['ON_DEATH', 'ON_DATE', 'IMMEDIATE'];
  if (releaseType && !allowed.includes(releaseType)) {
    return res.status(400).json({error: 'INVALID_RELEASE_TYPE', allowed});
  }

  db.get(
      `SELECT * FROM time_capsules WHERE id = ? AND user_id = ?`,
      [capsuleId, userId], (err, existing) => {
        if (err) return res.status(500).json({error: err.message});
        if (!existing)
          return res.status(404).json({error: 'CAPSULE_NOT_FOUND'});

        if (existing.is_released) {
          return res.status(400).json({error: 'CANNOT_EDIT_RELEASED_CAPSULE'});
        }

        const newTitle = title ?? existing.title;
        const newMessage = message ?? existing.message;
        const newMediaUrl = mediaUrl ?? existing.media_url;
        const newReleaseType = releaseType ?? existing.release_type;
        const newReleaseDate = releaseDate ?? existing.release_date;
        const newRecipientName = recipientName ?? existing.recipient_name;
        const newRecipientContact =
            recipientContact ?? existing.recipient_contact;
        const now = new Date().toISOString();

        if (newReleaseType === 'ON_DATE' && !newReleaseDate) {
          return res.status(400).json(
              {error: 'RELEASE_DATE_REQUIRED_FOR_ON_DATE'});
        }

        db.run(
            `UPDATE time_capsules
         SET title = ?, message = ?, media_url = ?, release_type = ?, release_date = ?,
             recipient_name = ?, recipient_contact = ?, updated_at = ?
         WHERE id = ?`,
            [
              newTitle, newMessage, newMediaUrl, newReleaseType, newReleaseDate,
              newRecipientName, newRecipientContact, now, capsuleId
            ],
            function(err2) {
              if (err2) return res.status(500).json({error: err2.message});
              res.json({message: 'TIME_CAPSULE_UPDATED'});
            });
      });
};

// 5) 타임캡슐 삭제 (DELETE /time-capsules/:id)
exports.deleteCapsule = (req, res) => {
  const userId = req.user.userId;
  const capsuleId = parseInt(req.params.id, 10);

  db.run(
      `DELETE FROM time_capsules WHERE id = ? AND user_id = ?`,
      [capsuleId, userId], function(err) {
        if (err) return res.status(500).json({error: err.message});
        if (this.changes === 0) {
          return res.status(404).json({error: 'CAPSULE_NOT_FOUND'});
        }
        res.json({message: 'TIME_CAPSULE_DELETED'});
      });
};
