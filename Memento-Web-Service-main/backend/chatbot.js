// backend/chatbot.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";


// 대화 기록을 서버 메모리에 저장 (실서비스는 DB에 저장)
let conversationHistory = [];

router.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "message is required" });
  }

  // 히스토리에 추가
  conversationHistory.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  // system prompt – 유언장 전문 비서 역할 부여
  const systemPrompt = {
    role: "model",
    parts: [
      {
        text: `너는 '유언장 작성 AI 비서' 역할을 한다.
사용자의 자산, 가족, 관계, 사후 의지를 이해하고
법적 유언장 초안을 만드는 데 필요한 질문을 대화 형태로 자연스럽게 진행하라.

반드시 다음 규칙을 지켜라:

1. 유언장 관련해서 하나씩 질문하면서 정보를 수집한다  
   예: "가장 먼저, 가족 구성원을 알려주실 수 있을까요?"  
2. 너무 많은 질문을 한 번에 하지 않는다  
3. 사용자의 답변을 정리해서 기억한다  
4. 어느 정도 정보가 모이면 '유언장 초안' 형태로 정리해준다  
5. 법률 자문은 하지 않는다 (안내만 한다)  
6. 감성적·공감형 톤으로 대화한다`
      }
    ]
  };

  // Gemini에 보낼 요청 형식
  const payload = {
    contents: [systemPrompt, ...conversationHistory],
  };

  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    const botReply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송해요, 응답을 생성할 수 없어요.";

    // 히스토리에 챗봇 답변 저장
    conversationHistory.push({
      role: "model",
      parts: [{ text: botReply }],
    });

    res.json({ reply: botReply });

  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: "Gemini API error" });
  }
});

// 기존 코드 아래에 추가
router.get("/models", async (req, res) => {
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
