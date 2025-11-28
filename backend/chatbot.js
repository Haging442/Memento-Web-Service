// backend/chatbot.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const auth = require('./auth'); // 🔐 JWT 인증 (server.js와 같은 위치)

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

// 환경변수 체크
if (!GEMINI_API_KEY) {
  console.warn(
    '[CHATBOT] ⚠ GEMINI_API_KEY 가 .env에 설정되어 있지 않습니다. 챗봇 호출 시 에러가 발생할 수 있습니다.'
  );
}

// 🔹 유저별 대화 히스토리 보관 (메모리)
const conversations = new Map(); // key: user:<id> / anon:<ip>

// 유저 키 헬퍼
function getUserKey(req) {
  if (req.user && req.user.userId) {
    return `user:${req.user.userId}`;
  }
  const ip = req.ip || req.connection?.remoteAddress || 'anonymous';
  return `anon:${ip}`;
}

function getConversationFor(req) {
  const key = getUserKey(req);
  if (!conversations.has(key)) {
    conversations.set(key, []);
  }
  return { key, history: conversations.get(key) };
}

// 공통 system 프롬프트
const systemPrompt = {
  role: 'model',
  parts: [
    {
      text: `너는 '유언장 작성 AI 비서' 역할을 한다.
사용자의 디지털 자산, 가족, 관계, 사후 의지를 이해하고
법적 유언장 초안을 만드는 데 필요한 질문을 대화 형태로 자연스럽게 진행한다.

⚠️ 반드시 아래 형식(JSON)으로만 최종 응답을 출력해야 한다. 한국어로 작성하되, JSON 키 이름은 영어로 유지한다.

반환 형식 (예시):

{
  "message": "사용자에게 보여줄 한국어 답변 한두 문단",
  "willDraft": {
    "people": [
      {
        "name": "아내",
        "relation": "배우자",
        "note": "주요 상속인"
      }
    ],
    "assets": [
      {
        "label": "부산 아파트",
        "type": "부동산",
        "action": "TRANSFER",
        "beneficiary": "아내",
        "note": "전부를 상속"
      }
    ],
    "specialWishes": [
      "장례는 가족장으로 소규모 진행"
    ]
  },
  "nextQuestions": [
    "이번에는 금융 자산에 대해 알려주실 수 있을까요?"
  ]
}

규칙:
1. 항상 위 JSON 구조로만 출력한다. JSON 밖에 다른 텍스트(설명, 마크다운 등)는 절대 쓰지 않는다.
2. "message"에는 사용자에게 보여줄 말풍선 내용을 한국어로 3~6문장 정도로 작성한다.
3. "willDraft"는 지금까지 대화에서 파악한 사람/자산/특별한 의지를 정리한다.
   - 확실하지 않은 정보는 적지 말고 빼도 된다.
4. 유언 내용이 충분히 모이지 않은 경우에도, 지금까지 파악된 범위에서만 간단한 구조를 채워서 넣는다.
5. "nextQuestions"에는 다음에 물어볼 후속 질문 1~3개를 한국어 문장 배열로 넣는다.
6. 법률 자문은 하지 말고, 법적 효력은 변호사/법무사를 통해 확인하라는 안내를 필요시 포함한다.
7. 감성적·공감형 톤(따뜻하고 존중하는 말투)으로 "message"를 작성한다.`
    }
  ]
};

// -----------------------------------------------------
// 1) 챗봇 대화 API
//    POST /api/chatbot/chat
// -----------------------------------------------------
router.post('/chat', auth, async (req, res) => {
  const userMessage = req.body?.message;

  if (!userMessage || !userMessage.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY_NOT_CONFIGURED' });
  }

  const { key, history } = getConversationFor(req);

  // 🔍 유저 발화 히스토리에 추가
  history.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  // 너무 길어지지 않게 최근 20턴만 유지
  if (history.length > 20) {
    history.splice(0, history.length - 20);
  }

  const payload = {
    contents: [systemPrompt, ...history]
  };

  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const rawText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed;
    let replyText = '';
    let willDraft = null;
    let nextQuestions = [];

    // JSON 파싱 시도
    try {
      parsed = JSON.parse(rawText);
      replyText = parsed.message || '';
      willDraft = parsed.willDraft || null;
      nextQuestions = Array.isArray(parsed.nextQuestions)
        ? parsed.nextQuestions
        : [];
    } catch (e) {
      console.warn('[CHATBOT] JSON 파싱 실패, 일반 텍스트로 처리:', e.message);
      // 혹시 모델이 JSON이 아닌 평문을 준 경우 대비
      replyText =
        rawText.trim() ||
        '죄송해요, 유언장 도우미가 지금은 답변을 제대로 만들지 못했어요. 다시 한 번만 말씀해 주시겠어요?';
      willDraft = null;
      nextQuestions = [];
    }

    // 🤖 챗봇 답변도 히스토리에 저장 (원본 텍스트 기준)
    history.push({
      role: 'model',
      parts: [{ text: rawText }]
    });
    conversations.set(key, history);

    res.json({
      reply: replyText,
      willDraft,
      nextQuestions
    });
  } catch (err) {
    console.error('[CHATBOT] Gemini API error:', err.response?.data || err);
    res.status(500).json({ error: 'Gemini API error' });
  }
});

// -----------------------------------------------------
// 2) 대화 리셋 API
//    POST /api/chatbot/reset
// -----------------------------------------------------
router.post('/reset', auth, (req, res) => {
  const key = getUserKey(req);
  conversations.delete(key);
  res.json({ ok: true, message: '현재 유저의 챗봇 대화가 초기화되었습니다.' });
});

// -----------------------------------------------------
// 3) 모델 리스트 조회 (디버그용, 인증 없음)
// -----------------------------------------------------
router.get('/models', async (req, res) => {
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json(err.response?.data || err);
  }
});

module.exports = router;
