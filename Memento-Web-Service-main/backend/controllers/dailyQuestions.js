// controllers/dailyQuestions.js - Gemini 통합 버전
const db = require('../db');
const geminiService = require('../services/geminiService');

// 오늘의 질문 조회
exports.getTodayQuestion = (req, res) => {
  const userId = req.user.userId;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 사용자 스케줄 확인
  db.get(
    `SELECT * FROM user_question_schedule WHERE user_id = ?`,
    [userId],
    (err, schedule) => {
      if (err) return res.status(500).json({ error: err.message });

      // 오늘 이미 답변했는지 확인
      if (schedule && schedule.last_question_date === today) {
        return res.json({
          hasQuestionToday: false,
          message: '오늘은 이미 답변하셨습니다!',
          stats: {
            totalAnswered: schedule.questions_answered_count,
            lastAnsweredDate: schedule.last_question_date
          }
        });
      }

      // 다음 질문 가져오기
      let nextQuestionId = schedule ? schedule.next_question_id : null;

      if (!nextQuestionId) {
        // 랜덤 질문 선택
        db.get(
          `SELECT id FROM daily_questions 
           WHERE id NOT IN (
             SELECT question_id FROM user_daily_answers WHERE user_id = ?
           )
           ORDER BY RANDOM() LIMIT 1`,
          [userId],
          (err, question) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (!question) {
              // 모든 질문을 다 답변함 - 처음부터 다시
              db.get(
                `SELECT id FROM daily_questions ORDER BY RANDOM() LIMIT 1`,
                [],
                (err, q) => {
                  if (err || !q) return res.status(500).json({ error: '질문을 찾을 수 없습니다' });
                  fetchQuestionDetails(q.id);
                }
              );
            } else {
              fetchQuestionDetails(question.id);
            }
          }
        );
      } else {
        fetchQuestionDetails(nextQuestionId);
      }

      function fetchQuestionDetails(questionId) {
        db.get(
          `SELECT * FROM daily_questions WHERE id = ?`,
          [questionId],
          (err, question) => {
            if (err || !question) {
              return res.status(500).json({ error: '질문을 찾을 수 없습니다' });
            }

            res.json({
              hasQuestionToday: true,
              question: {
                id: question.id,
                text: question.question_text,
                category: question.category
              },
              stats: {
                totalAnswered: schedule ? schedule.questions_answered_count : 0,
                currentStreak: calculateStreak(userId)
              }
            });
          }
        );
      }
    }
  );
};

// 답변 제출 - Gemini 통합
exports.submitAnswer = (req, res) => {
  const userId = req.user.userId;
  const { questionId, answerText } = req.body;
  const today = new Date().toISOString().split('T')[0];

  if (!questionId || !answerText) {
    return res.status(400).json({ error: '질문 ID와 답변을 입력해주세요' });
  }

  // 답변 저장
  db.run(
    `INSERT INTO user_daily_answers (user_id, question_id, answer_text)
     VALUES (?, ?, ?)`,
    [userId, questionId, answerText],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      const answerId = this.lastID;

      // 스케줄 업데이트
      db.run(
        `INSERT INTO user_question_schedule (user_id, last_question_date, questions_answered_count)
         VALUES (?, ?, 1)
         ON CONFLICT(user_id) DO UPDATE SET
           last_question_date = ?,
           questions_answered_count = questions_answered_count + 1`,
        [userId, today, today],
        (err) => {
          if (err) {
            console.error('스케줄 업데이트 실패:', err.message);
          }
        }
      );

      // 🌟 Gemini AI 분석 트리거 (비동기)
      analyzeAnswerWithGemini(answerId, userId, questionId, answerText);

      res.json({
        success: true,
        answerId: answerId,
        message: '답변이 저장되었습니다. AI가 분석 중입니다.'
      });
    }
  );
};

// 🌟 Gemini AI 분석 (업그레이드!)
async function analyzeAnswerWithGemini(answerId, userId, questionId, answerText) {
  try {
    // 질문 정보 가져오기
    db.get(
      `SELECT question_text, category FROM daily_questions WHERE id = ?`,
      [questionId],
      async (err, question) => {
        if (err || !question) {
          console.error('질문 정보 조회 실패:', err?.message);
          return;
        }

        try {
          // 🚀 Gemini로 유언장 제안 생성
          const willSuggestion = await geminiService.generateWillSuggestion(
            answerText,
            question.category
          );

          console.log('✅ Gemini 유언장 제안 생성 완료:', willSuggestion);

          // 간단한 엔티티 추출 (보조)
          const entities = extractEntities(answerText);

          const analysis = {
            keywords: extractKeywords(answerText),
            entities: entities,
            willSuggestion: willSuggestion, // 🌟 Gemini 제안 추가
            timestamp: new Date().toISOString()
          };

          // 분석 결과 저장
          db.run(
            `UPDATE user_daily_answers 
             SET ai_analysis = ?, entities_extracted = ?
             WHERE id = ?`,
            [JSON.stringify(analysis), JSON.stringify(entities), answerId],
            (err) => {
              if (err) {
                console.error('AI 분석 저장 실패:', err.message);
                return;
              }

              // 🌟 Gemini 기반 제안 생성
              generateSuggestionsWithGemini(answerId, userId, entities, willSuggestion);
            }
          );
        } catch (geminiError) {
          console.error('Gemini API 호출 실패:', geminiError.message);
          // Gemini 실패해도 기본 제안은 생성
          generateBasicSuggestions(answerId, userId, extractEntities(answerText));
        }
      }
    );
  } catch (error) {
    console.error('AI 분석 전체 실패:', error.message);
  }
}

// 🌟 Gemini 기반 제안 생성
function generateSuggestionsWithGemini(answerId, userId, entities, willSuggestion) {
  const suggestions = [];

  // 1. Gemini가 생성한 유언장 제안
  suggestions.push({
    type: 'WILL_ITEM',
    text: willSuggestion,
    data: { aiGenerated: true }
  });

  // 2. 사람이 언급되면 신뢰 연락처 제안
  if (entities.people.length > 0) {
    suggestions.push({
      type: 'CONTACT',
      text: `당신이 언급한 '${entities.people[0]}'님을 신뢰 연락처로 추가하시겠어요?`,
      data: { name: entities.people[0] }
    });
  }

  // 3. 장소가 언급되면 타임캡슐 제안
  if (entities.places.length > 0) {
    suggestions.push({
      type: 'TIME_CAPSULE',
      text: `'${entities.places[0]}'에 대한 추억을 타임캡슐에 저장하시겠어요?`,
      data: { place: entities.places[0] }
    });
  }

  // 제안 저장
  suggestions.forEach(suggestion => {
    db.run(
      `INSERT INTO ai_suggestions (user_id, answer_id, suggestion_type, suggestion_text, extracted_data)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, answerId, suggestion.type, suggestion.text, JSON.stringify(suggestion.data)],
      (err) => {
        if (err) console.error('제안 저장 실패:', err.message);
        else console.log('✅ 제안 저장 성공:', suggestion.type);
      }
    );
  });
}

// 기본 제안 생성 (Gemini 실패 시 폴백)
function generateBasicSuggestions(answerId, userId, entities) {
  const suggestions = [];

  if (entities.people.length > 0) {
    suggestions.push({
      type: 'CONTACT',
      text: `당신이 언급한 '${entities.people[0]}'님을 신뢰 연락처로 추가하시겠어요?`,
      data: { name: entities.people[0] }
    });
  }

  suggestions.forEach(suggestion => {
    db.run(
      `INSERT INTO ai_suggestions (user_id, answer_id, suggestion_type, suggestion_text, extracted_data)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, answerId, suggestion.type, suggestion.text, JSON.stringify(suggestion.data)]
    );
  });
}

// 간단한 키워드 추출
function extractKeywords(text) {
  const commonWords = ['은', '는', '이', '가', '을', '를', '의', '에', '와', '과', '도', '요', '네요', '있어요', '있습니다'];
  const words = text.split(/\s+/);
  
  return words
    .filter(word => word.length > 1 && !commonWords.includes(word))
    .slice(0, 5);
}

// 간단한 개체 추출
function extractEntities(text) {
  const entities = {
    people: [],
    places: [],
    objects: []
  };

  const peopleKeywords = ['엄마', '아빠', '할머니', '할아버니', '형', '누나', '동생', '친구', '선배', '후배', '이모', '삼촌', '아내', '남편', '딸', '아들'];
  const placeKeywords = ['집', '학교', '회사', '공원', '바다', '산', '카페', '식당', '부산', '서울', '제주', '고향'];
  
  peopleKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      entities.people.push(keyword);
    }
  });

  placeKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      entities.places.push(keyword);
    }
  });

  return entities;
}

// 스트릭 계산
function calculateStreak(userId) {
  return 0; // 간단 버전
}

// 제안 목록 조회
exports.getSuggestions = (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT s.*, a.answer_text, a.answered_at
     FROM ai_suggestions s
     JOIN user_daily_answers a ON s.answer_id = a.id
     WHERE s.user_id = ? AND s.status = 'PENDING'
     ORDER BY s.created_at DESC
     LIMIT 10`,
    [userId],
    (err, suggestions) => {
      if (err) return res.status(500).json({ error: err.message });

      const formattedSuggestions = suggestions.map(s => ({
        id: s.id,
        type: s.suggestion_type,
        text: s.suggestion_text,
        extractedData: s.extracted_data ? JSON.parse(s.extracted_data) : {},
        fromAnswer: {
          text: s.answer_text,
          date: s.answered_at
        },
        createdAt: s.created_at
      }));

      res.json({ suggestions: formattedSuggestions });
    }
  );
};

// 제안 응답 (수락/거절)
exports.respondToSuggestion = (req, res) => {
  const userId = req.user.userId;
  const suggestionId = req.params.id;
  const { action } = req.body;

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: '올바른 액션을 선택해주세요' });
  }

  const status = action === 'accept' ? 'ACCEPTED' : 'REJECTED';

  db.run(
    `UPDATE ai_suggestions
     SET status = ?, processed_at = ?
     WHERE id = ? AND user_id = ?`,
    [status, new Date().toISOString(), suggestionId, userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      if (this.changes === 0) {
        return res.status(404).json({ error: '제안을 찾을 수 없습니다' });
      }

      res.json({
        success: true,
        message: action === 'accept' ? '제안이 수락되었습니다' : '제안이 거절되었습니다'
      });
    }
  );
};

// 답변 히스토리 조회
exports.getAnswerHistory = (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT a.*, q.question_text, q.category
     FROM user_daily_answers a
     JOIN daily_questions q ON a.question_id = q.id
     WHERE a.user_id = ?
     ORDER BY a.answered_at DESC
     LIMIT 30`,
    [userId],
    (err, answers) => {
      if (err) return res.status(500).json({ error: err.message });

      const formattedAnswers = answers.map(a => ({
        id: a.id,
        question: {
          id: a.question_id,
          text: a.question_text,
          category: a.category
        },
        answer: a.answer_text,
        answeredAt: a.answered_at,
        aiAnalysis: a.ai_analysis ? JSON.parse(a.ai_analysis) : null
      }));

      res.json({ answers: formattedAnswers });
    }
  );
};