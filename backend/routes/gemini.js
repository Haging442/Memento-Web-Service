// backend/routes/gemini.js

const express = require('express');
const router = express.Router();
const auth = require('../auth');
const db = require('../db');  // ✅ db 추가

// NOTE:
// 현재는 ../aiservice 를 직접 사용하지만,
// 다른 곳에서는 ../services/geminiService 를 쓰고 있으니
// 장기적으로는 하나의 서비스 모듈로 통합하는 걸 추천.
const {
  analyzeDailyAnswer,
  reviewTimeCapsule,
  generateMemorialPhrase,
  generateMemorialTheme,
  generateThemeCSS,
} = require('../aiservice');

// ----------------------------------------------------
// 1. 오늘의 질문 답변 분석
// POST /api/gemini/analyze-answer
// ----------------------------------------------------
router.post('/analyze-answer', auth, async (req, res) => {
  try {
    const { answerText } = req.body;

    if (!answerText) {
      return res.status(400).json({
        error: 'MISSING_ANSWER',
        message: '분석할 답변이 필요합니다.',
      });
    }

    const analysis = await analyzeDailyAnswer(answerText);

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('답변 분석 오류:', error);
    res.status(500).json({
      error: 'ANALYSIS_FAILED',
      message: 'AI 분석에 실패했습니다.',
    });
  }
});

// ----------------------------------------------------
// 2. 타임캡슐 내용 검토
// POST /api/gemini/review-timecapsule
// ----------------------------------------------------
router.post('/review-timecapsule', auth, async (req, res) => {
  try {
    const { capsuleContent } = req.body;

    if (!capsuleContent) {
      return res.status(400).json({
        error: 'MISSING_CONTENT',
        message: '검토할 내용이 필요합니다.',
      });
    }

    const review = await reviewTimeCapsule(capsuleContent);

    res.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error('타임캡슐 검토 오류:', error);
    res.status(500).json({
      error: 'REVIEW_FAILED',
      message: '내용 검토에 실패했습니다.',
    });
  }
});

// ----------------------------------------------------
// 3. 추모 문구 생성
// POST /api/gemini/generate-memorial-phrase
// ----------------------------------------------------
router.post('/generate-memorial-phrase', auth, async (req, res) => {
  try {
    const { analysisText, userName } = req.body;

    if (!analysisText || !userName) {
      return res.status(400).json({
        error: 'MISSING_PARAMETERS',
        message: '분석 텍스트와 사용자 이름이 필요합니다.',
      });
    }

    const phrase = await generateMemorialPhrase(analysisText, userName);

    res.json({
      success: true,
      phrase,
    });
  } catch (error) {
    console.error('추모 문구 생성 오류:', error);
    res.status(500).json({
      error: 'GENERATION_FAILED',
      message: '추모 문구 생성에 실패했습니다.',
    });
  }
});

// ----------------------------------------------------
// 4. 바이브 기반 테마 생성 + CSS 코드 반환 ⭐
// POST /api/gemini/generate-vibe-theme
// ----------------------------------------------------
router.post('/generate-vibe-theme', auth, async (req, res) => {
  try {
    const { vibeDescription } = req.body;

    if (!vibeDescription) {
      return res.status(400).json({
        error: 'MISSING_VIBE',
        message: '분위기 설명(vibeDescription)을 입력해주세요.',
      });
    }

    console.log(`🎨 바이브 테마 생성 요청: "${vibeDescription}"`);

    // 1단계: AI로 테마 생성
    const theme = await generateMemorialTheme(vibeDescription);

    // 2단계: 테마 기반 CSS 생성
    const css = generateThemeCSS(theme);

    res.json({
      success: true,
      theme,
      css,
      message: '테마와 CSS가 성공적으로 생성되었습니다.',
      usage: {
        applyToHTML: 'HTML <style> 태그 안에 CSS를 넣으세요',
        applyToFile: '.css 파일로 저장 후 링크하세요',
      },
    });
  } catch (error) {
    console.error('❌ 바이브 테마 생성 오류:', error);
    res.status(500).json({
      error: 'THEME_GENERATION_FAILED',
      message: '테마 생성에 실패했습니다.',
      details: error.message,
    });
  }
});

// ----------------------------------------------------
// 5. 테스트용 엔드포인트
//    (운영 환경 안전을 위해 이제 auth 필요)
// POST /api/gemini/test-vibe
// ----------------------------------------------------
router.post('/test-vibe', auth, async (req, res) => {
  try {
    const { vibeDescription } = req.body;

    if (!vibeDescription) {
      return res.status(400).json({
        error: 'vibeDescription을 입력해주세요.',
      });
    }

    const theme = await generateMemorialTheme(vibeDescription);
    const css = generateThemeCSS(theme);

    res.json({
      success: true,
      theme,
      css,
      preview: `
<!DOCTYPE html>
<html>
<head>
    <style>${css}</style>
</head>
<body>
    <div class="memorial-container">
        <h1 class="memorial-title">추모 공간 미리보기</h1>
        <div class="memorial-content">
            이것은 "${vibeDescription}" 바이브로 생성된 테마입니다.
        </div>
    </div>
</body>
</html>
      `.trim(),
    });
  } catch (error) {
    console.error('테스트 오류:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// ✨ AI 생성 커스텀 테마 저장
router.post('/save-custom-theme', auth, (req, res) => {
  const { themeName, colorPalette, fontStyle, cssKeywords, css } = req.body;
  const userId = req.user.userId;

  // ✅ 필수 파라미터 검증 + colorPalette 최소 3개 색상 체크
  if (!themeName || !colorPalette) {
    return res.status(400).json({
      error: 'MISSING_PARAMETERS',
      message: '테마 이름과 색상이 필요합니다.',
    });
  }

  if (!Array.isArray(colorPalette) || colorPalette.length < 3) {
    return res.status(400).json({
      error: 'INVALID_COLOR_PALETTE',
      message: 'colorPalette는 최소 3개의 색상(기본/보조/포인트)이 필요합니다.',
    });
  }

  const colors = JSON.stringify({
    primary: colorPalette[0],
    secondary: colorPalette[1],
    accent: colorPalette[2],
    text: '#111827',
  });

  const fonts = JSON.stringify({
    body: fontStyle || 'sans-serif',
  });

  db.run(
    `INSERT INTO memorial_themes 
       (user_id, name, description, colors, fonts, css_code, is_custom, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
    [userId, themeName, 'AI가 생성한 맞춤 테마', colors, fonts, css || ''],
    function (err) {
      if (err) {
        console.error('❌ 커스텀 테마 저장 오류:', err);
        return res.status(500).json({
          error: 'SAVE_FAILED',
          message: '테마 저장에 실패했습니다.',
          details: err.message,
        });
      }

      res.json({
        success: true,
        themeId: `custom_${this.lastID}`,
        message: '커스텀 테마가 저장되었습니다.',
      });
    }
  );
});

// ✨ 커스텀 테마 삭제
router.delete('/delete-custom-theme/:themeId', auth, (req, res) => {
  const themeId = req.params.themeId.replace('custom_', ''); // custom_ 제거
  const userId = req.user.userId;

  // 1. 해당 테마가 이 사용자 것인지 확인
  db.get(
    'SELECT id, user_id FROM memorial_themes WHERE id = ? AND is_custom = 1',
    [themeId],
    (err, theme) => {
      if (err) {
        console.error('❌ 테마 조회 오류:', err);
        return res.status(500).json({
          error: 'DB_ERROR',
          message: '테마 조회에 실패했습니다.',
        });
      }

      if (!theme) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: '테마를 찾을 수 없습니다.',
        });
      }

      // 2. 본인 테마가 아니면 삭제 불가
      if (theme.user_id !== userId) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: '본인의 테마만 삭제할 수 있습니다.',
        });
      }

      // 3. 삭제 실행
      db.run(
        'DELETE FROM memorial_themes WHERE id = ?',
        [themeId],
        function (deleteErr) {
          if (deleteErr) {
            console.error('❌ 테마 삭제 오류:', deleteErr);
            return res.status(500).json({
              error: 'DELETE_FAILED',
              message: '테마 삭제에 실패했습니다.',
            });
          }

          console.log(`✅ 커스텀 테마 삭제 완료: ID ${themeId}`);

          res.json({
            success: true,
            message: '테마가 삭제되었습니다.',
          });
        }
      );
    }
  );
});

module.exports = router;
