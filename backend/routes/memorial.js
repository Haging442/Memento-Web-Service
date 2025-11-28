// backend/routes/memorial.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');              // JWT
const upload = require('../middlewares/upload'); // memorial 사진용
const path = require('path');
const fs = require('fs');
const axios = require('axios');               // 🔹 reCAPTCHA용 (새로 추가)
const multer = require('multer');             // 🔹 guestbook 전용 업로드용
const memorialCtrl = require('../controllers/memorial'); // 🔹 방명록 컨트롤러 사용


// guestbook 전용 업로드 설정
const guestbookStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/guestbook');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});
const guestbookUpload = multer({ storage: guestbookStorage });

// reCAPTCHA 검증 헬퍼
async function verifyRecaptcha(token) {
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;

    const result = await axios.post(url);

    return result.data.success === true;
  } catch (err) {
    console.error('[reCAPTCHA ERROR]', err);
    return false;
  }
}

// ---------------------------------------------
// 🔹 0. AI 기반 추모공간 동의/생성/방명록 라우트 (PDF 기능)
// ---------------------------------------------

// (1) 생전 추모공간 동의 + 사용할 답변 선택
//    body: { consent: true/false, profilePhotoUrl, selectedContents: [answerId, ...] }
router.post('/consent', auth, memorialCtrl.setMemorialConsent);

// (2) AI 기반 추모공간 자동 생성 + 저장 + 미리보기
//    body: { desiredVibe }  (예: "따뜻하고 포근한 분위기")
router.post('/generate', auth, memorialCtrl.generateMemorialSpace);

// (3) 방명록 작성 (로그인 여부와 무관하게 작성 가능)
router.post(
  '/space/:spaceId/guestbook',
  guestbookUpload.single('image'),
  async (req, res, next) => {


    if (process.env.USE_RECAPTCHA === 'false') {
      console.log('[reCAPTCHA] SKIPPED (USE_RECAPTCHA=false)');
      return next();
    }

    const token = req.body['g-recaptcha-response'];

    if (!token) {
      return res.status(400).json({ error: 'RECAPTCHA_REQUIRED' });
    }

    const ok = await verifyRecaptcha(token);

    if (!ok) {
      return res.status(400).json({ error: 'RECAPTCHA_FAILED' });
    }

    next();
  },
  memorialCtrl.postGuestbook
);


// (4) 방명록 삭제 (작성자 or 추모공간 주인만 가능)
router.delete(
  '/guestbook/:entryId',
  auth,
  memorialCtrl.deleteGuestbookEntry
);

// ---------------------------------------------
// 1. 추모공간 설정 조회 (기존 기능)
// ---------------------------------------------
router.get('/settings', auth, (req, res) => {
  const userId = req.user.userId;
  
  db.get(
    'SELECT * FROM memorial_spaces WHERE user_id = ?',
    [userId],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '설정 조회 실패' });
      }
      
      if (!row) {
        return res.json({
          is_enabled: false,
          profile_image: '',
          display_name: '',
          birth_date: '',
          theme_type: 'clean'  // ✅ 기본값
        });
      }
      
      res.json({
        is_enabled: row.is_enabled === 1,
        profile_image: row.profile_image || '',
        display_name: row.display_name || '',
        birth_date: row.birth_date || '',
        theme_type: row.theme_type || 'clean'
      });
    }
  );
});

// ---------------------------------------------
// 2. 공개 추모공간 조회 (userId 기준, 인증 불필요)
//    - 사진/방명록/테마 색상까지 포함
// ---------------------------------------------
router.get('/space/:userId', (req, res) => {
  const userId = req.params.userId;

  db.get(
    `SELECT ms.*, u.name as user_name
     FROM memorial_spaces ms
     JOIN users u ON ms.user_id = u.id
     WHERE ms.user_id = ? AND ms.is_enabled = 1`,
    [userId],
    (err, space) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '조회 실패' });
      }

      if (!space) {
        return res.status(404).json({ error: '추모공간을 찾을 수 없습니다' });
      }

      // ✅ 커스텀 테마인 경우 색상 정보 가져오기
      let customColors = null;
      if (space.theme_type && space.theme_type.startsWith('custom_')) {
        const themeId = space.theme_type.replace('custom_', '');
        
        db.get(
          'SELECT colors FROM memorial_themes WHERE id = ?',
          [themeId],
          (err, themeRow) => {
            if (!err && themeRow) {
              try {
                customColors = JSON.parse(themeRow.colors);
              } catch (e) {
                customColors = null;
              }
            }
            fetchRestOfData(space, customColors);
          }
        );
      } else {
        fetchRestOfData(space, null);
      }

      function fetchRestOfData(spaceRow, customColors) {
        db.all(
          `SELECT id, image_url, original_date, created_at 
           FROM memorial_contents 
           WHERE memorial_space_id = ? AND content_type = 'photo'
           ORDER BY original_date DESC`,
          [spaceRow.id],
          (err2, photos) => {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: '사진 조회 실패' });
            }

            db.all(
              `SELECT id, author_name, message, image_url, created_at, visibility
               FROM guestbook_entries
               WHERE memorial_space_id = ? AND is_deleted = 0
               ORDER BY created_at DESC`,
              [spaceRow.id],
              (err3, guestbook) => {
                if (err3) {
                  console.error(err3);
                  return res.status(500).json({ error: '방명록 조회 실패' });
                }

                res.json({
                  space: {
                    id: spaceRow.id,
                    user_id: spaceRow.user_id,
                    display_name: spaceRow.display_name || spaceRow.user_name,
                    profile_image: spaceRow.profile_image,
                    birth_date: spaceRow.birth_date,
                    death_date: spaceRow.death_date,
                    memorial_message: spaceRow.memorial_message,
                    theme_type: spaceRow.theme_type || 'clean',
                    visibility: spaceRow.visibility,
                    custom_colors: customColors
                  },
                  photos: photos,
                  guestbook: guestbook.filter(g => g.visibility === 'public')
                });
              }
            );
          }
        );
      }
    }
  );
});

// ---------------------------------------------
// 3. 추모공간 ON/OFF 및 기본 설정 (기존 기능)
// ---------------------------------------------
router.put('/settings/consent', auth, (req, res) => {
  const userId = req.user.userId;
  const { is_enabled, profile_image, display_name, birth_date, theme_type } = req.body;
  
  db.get(
    'SELECT id FROM memorial_spaces WHERE user_id = ?',
    [userId],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '설정 저장 실패' });
      }
      
      if (row) {
        // UPDATE
        db.run(
          `UPDATE memorial_spaces 
           SET is_enabled = ?, profile_image = ?, display_name = ?, birth_date = ?, theme_type = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          [is_enabled ? 1 : 0, profile_image, display_name, birth_date, theme_type || 'clean', userId],
          (err2) => {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: '설정 저장 실패' });
            }
            res.json({ success: true, message: '설정이 저장되었습니다' });
          }
        );
      } else {
        // INSERT
        db.run(
          `INSERT INTO memorial_spaces (user_id, is_enabled, profile_image, display_name, birth_date, theme_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, is_enabled ? 1 : 0, profile_image, display_name, birth_date, theme_type || 'clean'],
          (err2) => {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: '설정 저장 실패' });
            }
            res.json({ success: true, message: '설정이 저장되었습니다' });
          }
        );
      }
    }
  );
});

// ---------------------------------------------
// 4. 추모 사진 업로드 (기존 기능)
// ---------------------------------------------
router.post('/photos/upload', auth, upload.array('photos', 100), (req, res) => {
  const userId = req.user.userId;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '업로드된 파일이 없습니다' });
  }

  db.get(
    'SELECT id FROM memorial_spaces WHERE user_id = ?',
    [userId],
    (err, space) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '추모공간 조회 실패' });
      }

      if (!space) {
        return res.status(400).json({ error: '추모공간 설정을 먼저 완료해주세요' });
      }

      const stmt = db.prepare(
        `INSERT INTO memorial_contents 
         (memorial_space_id, content_type, image_url, original_date, created_at) 
         VALUES (?, ?, ?, ?, ?)`
      );

      const uploadedFiles = [];

      req.files.forEach(file => {
        const imageUrl = `/uploads/memorial/${file.filename}`;
        const now = new Date().toISOString();
        
        stmt.run(space.id, 'photo', imageUrl, now, now, (err2) => {
          if (err2) {
            console.error('DB 저장 실패:', err2);
          }
        });

        uploadedFiles.push({
          filename: file.filename,
          url: imageUrl,
          size: file.size
        });
      });

      stmt.finalize((err2) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ error: '파일 정보 저장 실패' });
        }

        res.json({
          success: true,
          message: `${uploadedFiles.length}개의 사진이 업로드되었습니다`,
          files: uploadedFiles
        });
      });
    }
  );
});

// ---------------------------------------------
// 5. 업로드된 사진 목록 조회 (기존 기능)
// ---------------------------------------------
router.get('/photos', auth, (req, res) => {
  const userId = req.user.userId;

  db.get(
    'SELECT id FROM memorial_spaces WHERE user_id = ?',
    [userId],
    (err, space) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '조회 실패' });
      }

      if (!space) {
        return res.json({ photos: [] });
      }

      db.all(
        `SELECT id, image_url, original_date, created_at 
         FROM memorial_contents 
         WHERE memorial_space_id = ? AND content_type = 'photo'
         ORDER BY created_at DESC`,
        [space.id],
        (err2, rows) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: '사진 목록 조회 실패' });
          }

          res.json({ photos: rows });
        }
      );
    }
  );
});

// ---------------------------------------------
// 6. 사진 삭제 (기존 기능)
// ---------------------------------------------
router.delete('/photos/:id', auth, (req, res) => {
  const userId = req.user.userId;
  const photoId = req.params.id;

  db.get(
    `SELECT mc.id, mc.image_url, mc.memorial_space_id
     FROM memorial_contents mc
     JOIN memorial_spaces ms ON mc.memorial_space_id = ms.id
     WHERE mc.id = ? AND ms.user_id = ?`,
    [photoId, userId],
    (err, photo) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '조회 실패' });
      }

      if (!photo) {
        return res.status(404).json({ error: '사진을 찾을 수 없습니다' });
      }

      db.run(
        'DELETE FROM memorial_contents WHERE id = ?',
        [photoId],
        (err2) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: '삭제 실패' });
          }

          const safePath = photo.image_url.replace(/^\//, ''); // /uploads/... → uploads/...
          const filePath = path.join(__dirname, '..', safePath);
          fs.unlink(filePath, (err3) => {
            if (err3) {
              console.error('파일 삭제 실패:', err3);
            }
          });

          res.json({ success: true, message: '사진이 삭제되었습니다' });
        }
      );
    }
  );
});

// ---------------------------------------------
// 7. 콘텐츠 표시 여부 설정 (기존 기능)
// ---------------------------------------------
router.post('/settings/content', auth, (req, res) => {
  const userId = req.user.userId;
  const { content_type, content_id, is_included } = req.body;
  
  db.get(
    'SELECT id FROM memorial_content_settings WHERE user_id = ? AND content_type = ? AND content_id = ?',
    [userId, content_type, content_id],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '콘텐츠 설정 저장 실패' });
      }
      
      if (row) {
        db.run(
          'UPDATE memorial_content_settings SET is_included = ? WHERE id = ?',
          [is_included ? 1 : 0, row.id],
          (err2) => {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: '콘텐츠 설정 저장 실패' });
            }
            res.json({ success: true });
          }
        );
      } else {
        db.run(
          'INSERT INTO memorial_content_settings (user_id, content_type, content_id, is_included) VALUES (?, ?, ?, ?)',
          [userId, content_type, content_id, is_included ? 1 : 0],
          (err2) => {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: '콘텐츠 설정 저장 실패' });
            }
            res.json({ success: true });
          }
        );
      }
    }
  );
});

// ---------------------------------------------
// 8. 테마 목록 조회 (기본 + 커스텀) (기존 기능)
// ---------------------------------------------
router.get('/themes', auth, (req, res) => {
  const userId = req.user?.userId;

  // 기본 테마 (하드코딩)
  const defaultThemes = [
    {
      id: 'clean',
      name: '깔끔한',
      colors: {
        secondary: '#E8EEFF',
        accent: '#4D82FF',
        text: '#1E3A8A',
      },
      description: '화이트 앤 블루의 깨끗하고 시원한 느낌',
    },
    {
      id: 'cute',
      name: '귀여운',
      colors: {
        secondary: '#FFE4EE',
        accent: '#FF9DBD',
        text: '#A61B52',
      },
      description: '파스텔 핑크의 사랑스러운 느낌',
    },
    {
      id: 'warmsoft',
      name: '포근한',
      colors: {
        secondary: '#F6E7C9',
        accent: '#D4B892',
        text: '#6B4F33',
      },
      description: '베이지와 크림의 따뜻한 포근함',
    },
    {
      id: 'warm',
      name: '따뜻한',
      colors: {
        secondary: '#FFE7A0',
        accent: '#FFB35E',
        text: '#8A4A00',
      },
      description: '오렌지와 옐로우의 생동감',
    },
    {
      id: 'peace',
      name: '평화로운',
      colors: {
        secondary: '#D8F3E1',
        accent: '#A8DFF5',
        text: '#1E4D4A',
      },
      description: '라이트 블루와 그린의 편안함',
    },
    {
      id: 'elegant',
      name: '우아한',
      colors: {
        secondary: '#11203F',
        accent: '#D8C27A',
        text: '#1F2937',
      },
      description: '다크 네이비와 골드의 고급스러움',
    },
    {
      id: 'natural',
      name: '자연스러운',
      colors: {
        secondary: '#D9E7C6',
        accent: '#C6B497',
        text: '#3F4E2A',
      },
      description: '그린과 브라운의 편안한 자연',
    },
    {
      id: 'modern',
      name: '모던한',
      colors: {
        secondary: '#FFFFFF',
        accent: '#000000',
        text: '#000000',
      },
      description: '블랙과 화이트의 세련된 콘트라스트',
    },
    {
      id: 'soft',
      name: '부드러운',
      colors: {
        secondary: '#EAD9FF',
        accent: '#C1A3FF',
        text: '#5F3E9E',
      },
      description: '라벤더의 부드러움',
    },
    {
      id: 'calm',
      name: '고요한',
      colors: {
        secondary: '#E5E7EB',
        accent: '#9CA3AF',
        text: '#374151',
      },
      description: '그레이와 실버의 차분한 고요함',
    },
  ];

  // 커스텀 테마 조회 (로그인한 경우만)
  if (userId) {
    db.all(
      `SELECT id, name, description, colors, fonts, css_code, created_at
       FROM memorial_themes
       WHERE user_id = ? AND is_custom = 1
       ORDER BY created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('커스텀 테마 조회 실패:', err);
          return res.json({ themes: defaultThemes });
        }

        const customThemes = rows.map((row) => ({
          id: `custom_${row.id}`,
          name: row.name,
          description: row.description || 'AI가 생성한 맞춤 테마',
          colors: JSON.parse(row.colors),
          fonts: JSON.parse(row.fonts || '{}'),
          css: row.css_code,
          isCustom: true,
          createdAt: row.created_at,
        }));

        res.json({ themes: [...customThemes, ...defaultThemes] });
      }
    );
  } else {
    // 비로그인 상태면 기본 테마만
    res.json({ themes: defaultThemes });
  }
});

module.exports = router;
