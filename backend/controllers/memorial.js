// controllers/memorial.js

const db = require('../db');
const aiService = require('../aiservice');
const { calculateAge } = require('../utils/helpers'); // 생몰년도 계산 헬퍼 (별도 구현)

// ----------------------------------------------------
// 1. 추모 공간 생성 동의 및 설정 (POST /memorial/consent)
//    - 생전에 어떤 답변/콘텐츠를 추모공간에 쓸지 선택
// ----------------------------------------------------

exports.setMemorialConsent = (req, res) => {
  // ✅ auth.js에서 넣어주는 값은 userId
  const userId = req.user.userId;
  const { consent, profilePhotoUrl, selectedContents } = req.body; 
  // selectedContents: [answerId, answerId, ...]

  db.run(
    `INSERT INTO user_memorial_settings 
       (user_id, consent_given, profile_photo_url, selected_content_ids)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       consent_given = excluded.consent_given,
       profile_photo_url = excluded.profile_photo_url,
       selected_content_ids = excluded.selected_content_ids`,
    [
      userId,
      consent ? 1 : 0,
      profilePhotoUrl || null,
      JSON.stringify(selectedContents || []),
    ],
    (err) => {
      if (err) {
        console.error('[Memorial] setMemorialConsent error:', err);
        return res
          .status(500)
          .json({ error: '추모 설정 저장 실패: ' + err.message });
      }
      res.json({ success: true, message: '추모 공간 설정이 저장되었습니다.' });
    }
  );
};

// ----------------------------------------------------
// 2. AI 추모 공간 자동 생성 (POST /memorial/generate)
//    - 사용자가 선택한 답변들 기반으로 문구/타임라인/키워드 생성
// ----------------------------------------------------

exports.generateMemorialSpace = (req, res) => {
  const userId = req.user.userId;
  const { desiredVibe } = req.body || {};

  // 1. 사용자 기본 정보 + 추모 설정 확인
  db.get(
    `SELECT 
       u.name AS user_name,
       u.death_date,
       ms.birth_date,
       COALESCE(ms.profile_image, s.profile_photo_url) AS profile_photo_url,
       s.selected_content_ids
     FROM users u
     JOIN user_memorial_settings s ON u.id = s.user_id
     LEFT JOIN memorial_spaces ms ON ms.user_id = u.id
     WHERE u.id = ? AND s.consent_given = 1`,
    [userId],
    (err, user) => {
      if (err) {
        console.error('[Memorial] generateMemorialSpace user query error:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res
          .status(403)
          .json({ error: '추모 공간 생성 동의가 필요합니다.' });
      }

      const selectedIds = JSON.parse(user.selected_content_ids || '[]');
      if (!selectedIds.length) {
        return res
          .status(400)
          .json({ error: '선택된 추모 콘텐츠가 없습니다.' });
      }

      const placeholders = selectedIds.map(() => '?').join(',');
      const sql = `
        SELECT answer_text, answered_at, ai_analysis
        FROM user_daily_answers
        WHERE id IN (${placeholders})
        ORDER BY answered_at ASC
      `;

      // 2. 선택된 답변/콘텐츠 로드
      db.all(sql, selectedIds, async (err2, contents) => {
        if (err2) {
          console.error('[Memorial] contents query error:', err2);
          return res
            .status(500)
            .json({ error: '콘텐츠 조회 실패: ' + err2.message });
        }
        if (!contents || contents.length === 0) {
          return res
            .status(400)
            .json({ error: '선택된 추모 콘텐츠를 찾을 수 없습니다.' });
        }

        const timeline = [];
        const allKeywords = new Set();
        let analysisSummary = '';

        contents.forEach((c) => {
          let analysis = {};
          try {
            analysis = c.ai_analysis ? JSON.parse(c.ai_analysis) : {};
          } catch (e) {
            analysis = {};
          }

          const datePart = (c.answered_at || '').split(' ')[0];

          timeline.push({
            date: datePart,
            text: c.answer_text,
            keywords: analysis.keywords || [],
            summary:
              analysis.summary ||
              (c.answer_text
                ? c.answer_text.substring(0, 30) + '...'
                : ''),
          });

          if (analysis.summary) {
            analysisSummary += analysis.summary + '. ';
          }

          (analysis.keywords || []).forEach((k) => allKeywords.add(k));
        });

        const groupedTimeline = groupTimelineByYear(timeline);

        try {
          // 3. AI 추모 문구 및 테마 생성
          const [memorialPhrase, theme] = await Promise.all([
            aiService.generateMemorialPhrase(
              analysisSummary || '밝고 긍정적인 삶을 사셨습니다.',
              user.user_name
            ),
            desiredVibe
              ? aiService.generateMemorialTheme(desiredVibe)
              : Promise.resolve({
                  themeName: '기본 테마',
                  colorPalette: ['#EAEAEA', '#6C757D', '#212529'],
                  fontStyle: 'sans-serif',
                  cssKeywords: ['clean', 'minimal', 'default'],
                }),
          ]);

          const profileBirthYear =
            user.birth_date && user.birth_date.length >= 4
              ? user.birth_date.substring(0, 4)
              : null;
          const profileDeathYear =
            user.death_date && user.death_date.length >= 4
              ? user.death_date.substring(0, 4)
              : null;

          const memorialData = {
            success: true,
            // 1. 기본 정보 (프로필 + 생몰년도)
            profile: {
              name: user.user_name,
              photoUrl: user.profile_photo_url,
              birthDate: user.birth_date || null,
              deathDate: user.death_date || null,
              birthYear: profileBirthYear,
              deathYear: profileDeathYear,
              age:
                user.birth_date && user.death_date
                  ? calculateAge(user.birth_date, user.death_date)
                  : user.birth_date
                  ? calculateAge(user.birth_date)
                  : null,
            },
            // 2. AI 생성 콘텐츠
            aiContent: {
              phrase: memorialPhrase,
              theme,
              vibeInput: desiredVibe || '기본',
            },
            // 3. 타임라인 및 키워드
            timeline: groupedTimeline, // { "2022": [...], "2023": [...] }
            majorKeywords: Array.from(allKeywords).slice(0, 10),

            // 4. 방명록 설정 (프론트 참고용)
            guestbook: {
              enabled: true,
              spamPrevention: 'reCAPTCHA',
              privateEnabled: true,
              trustedUserDeletion: true,
            },
          };

          // (선택) memorial_spaces에 memorial_message, theme_type 등을 저장하고 싶으면 여기서 UPDATE 가능

          res.json(memorialData);
        } catch (aiErr) {
          console.error('[Memorial] AI generation error:', aiErr);
          return res
            .status(500)
            .json({ error: 'AI 추모 문구/테마 생성 중 오류가 발생했습니다.' });
        }
      });
    }
  );
};

// 헬퍼: 타임라인 연도별 그룹화
function groupTimelineByYear(timeline) {
  return timeline.reduce((acc, item) => {
    const year = item.date ? item.date.substring(0, 4) : 'unknown';
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {});
}

// ----------------------------------------------------
// 3. 방명록 작성 (POST /memorial/space/:spaceId/guestbook)
//    - 비로그인 가능
//    - 이미지 첨부 가능 (req.file)
//    - Public / Private 설정
// ----------------------------------------------------

exports.postGuestbook = (req, res) => {
  const spaceId = parseInt(req.params.spaceId, 10);
  if (isNaN(spaceId)) {
    return res.status(400).json({ error: 'INVALID_SPACE_ID' });
  }

  const { authorName, message, isPrivate, visibility } = req.body || {};
  const userId = req.user?.userId || null; // 비로그인 가능

  if (!message || !message.trim()) {
    return res
      .status(400)
      .json({ error: 'MESSAGE_REQUIRED', message: '메시지를 입력해주세요.' });
  }

  // visibility 결정
  let finalVisibility = 'public';
  if (
    visibility === 'private' ||
    visibility === 'PRIVATE' ||
    isPrivate === true ||
    isPrivate === 'true'
  ) {
    finalVisibility = 'private';
  }

  // 이미지 경로
  let imageUrl = null;
  if (req.file && req.file.filename) {
    imageUrl = `/uploads/guestbook/${req.file.filename}`;
  }

  // 1) 추모공간 존재 여부 확인
  db.get(
    `SELECT id, user_id 
     FROM memorial_spaces 
     WHERE id = ? AND is_enabled = 1`,
    [spaceId],
    (err, space) => {
      if (err) {
        console.error('[Guestbook] space query error:', err);
        return res.status(500).json({ error: '추모공간 조회 실패' });
      }
      if (!space) {
        return res
          .status(404)
          .json({ error: '추모공간을 찾을 수 없습니다.' });
      }

      // 2) 작성자 이름 결정
      const baseAuthorName =
        authorName && authorName.trim().length > 0
          ? authorName.trim()
          : '익명';

      // 로그인된 경우, users에서 이름 한 번 가져와 덮어쓸 수도 있음 (선택)
      if (userId) {
        db.get(
          `SELECT name FROM users WHERE id = ?`,
          [userId],
          (uErr, userRow) => {
            const finalAuthorName =
              uErr || !userRow || !userRow.name
                ? baseAuthorName
                : userRow.name;

            insertGuestbookEntry(
              space.id,
              finalAuthorName,
              userId,
              message,
              imageUrl,
              finalVisibility,
              res
            );
          }
        );
      } else {
        // 비로그인
        insertGuestbookEntry(
          space.id,
          baseAuthorName,
          null,
          message,
          imageUrl,
          finalVisibility,
          res
        );
      }
    }
  );
};

// 실제 삽입 처리 헬퍼
function insertGuestbookEntry(
  spaceId,
  authorName,
  authorUserId,
  message,
  imageUrl,
  visibility,
  res
) {
  db.run(
    `INSERT INTO guestbook_entries
       (memorial_space_id, author_name, author_user_id, message, image_url, visibility)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [spaceId, authorName, authorUserId, message, imageUrl, visibility],
    function (err) {
      if (err) {
        console.error('[Guestbook] insert error:', err);
        return res.status(500).json({ error: '방명록 저장 실패' });
      }

      res.status(201).json({
        success: true,
        id: this.lastID,
        memorial_space_id: spaceId,
        author_name: authorName,
        visibility,
        image_url: imageUrl,
      });
    }
  );
}

// ----------------------------------------------------
// 4. 방명록 삭제 (DELETE /memorial/guestbook/:entryId)
//    - 작성자 or 추모공간 주인 or ADMIN 역할만 삭제 가능
//    - 실제 삭제 대신 is_deleted 플래그 + deleted_by, deleted_at 기록
// ----------------------------------------------------

exports.deleteGuestbookEntry = (req, res) => {
  const userId = req.user.userId;
  const entryId = parseInt(req.params.entryId, 10);

  if (isNaN(entryId)) {
    return res.status(400).json({ error: 'INVALID_ENTRY_ID' });
  }

  // 1) 방명록 + 추모공간 + 작성자 정보 조회
  db.get(
    `SELECT 
       g.id,
       g.memorial_space_id,
       g.author_user_id,
       g.is_deleted,
       ms.user_id AS space_owner_id
     FROM guestbook_entries g
     JOIN memorial_spaces ms ON g.memorial_space_id = ms.id
     WHERE g.id = ?`,
    [entryId],
    (err, entry) => {
      if (err) {
        console.error('[Guestbook] select error:', err);
        return res.status(500).json({ error: '방명록 조회 실패' });
      }
      if (!entry) {
        return res
          .status(404)
          .json({ error: '방명록 항목을 찾을 수 없습니다.' });
      }
      if (entry.is_deleted) {
        return res
          .status(400)
          .json({ error: '이미 삭제된 방명록입니다.' });
      }

      // 2) 현재 사용자 role 조회
      db.get(
        `SELECT role FROM users WHERE id = ?`,
        [userId],
        (uErr, userRow) => {
          if (uErr) {
            console.error('[Guestbook] user role error:', uErr);
            return res.status(500).json({ error: '권한 확인 실패' });
          }

          const role = userRow?.role || 'USER';

          // 삭제 권한 조건:
          // - 본인 글(author_user_id)
          // - 추모공간 주인(space_owner_id)
          // - ADMIN
          const isAuthor =
            entry.author_user_id && entry.author_user_id === userId;
          const isSpaceOwner = entry.space_owner_id === userId;
          const isAdmin = role === 'ADMIN';

          if (!isAuthor && !isSpaceOwner && !isAdmin) {
            return res
              .status(403)
              .json({ error: '삭제 권한이 없습니다.' });
          }

          const now = new Date().toISOString();

          // 3) soft delete
          db.run(
            `UPDATE guestbook_entries
             SET is_deleted = 1,
                 deleted_by = ?,
                 deleted_at = ?
             WHERE id = ?`,
            [userId, now, entryId],
            function (upErr) {
              if (upErr) {
                console.error('[Guestbook] delete update error:', upErr);
                return res
                  .status(500)
                  .json({ error: '방명록 삭제 처리 실패' });
              }

              res.json({
                success: true,
                message: '방명록이 삭제되었습니다.',
              });
            }
          );
        }
      );
    }
  );
};
