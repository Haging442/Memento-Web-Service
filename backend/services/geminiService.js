// backend/services/geminiService.js
const {GoogleGenerativeAI} = require('@google/generative-ai');

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * 유언장 제안 생성
 * @param {string} answer - 사용자의 답변
 * @param {string} questionCategory - 질문 카테고리
 * @returns {Promise<string>} - AI가 생성한 유언장 제안
 */
async function generateWillSuggestion(answer, questionCategory) {
  try {
    const model = genAI.getGenerativeModel({model: 'gemini-pro'});

    const prompt = `
당신은 전문적인 유언장 작성 도우미입니다.

사용자가 "${questionCategory}" 카테고리의 질문에 다음과 같이 답변했습니다:
"${answer}"

이 답변을 바탕으로 유언장에 포함될 수 있는 구체적이고 따뜻한 제안을 작성해주세요.
제안은 한국어로 작성하고, 100자 이내로 간단명료하게 작성해주세요.

예시:
- "가족들에게 감사의 마음을 담아 편지를 남기는 것은 어떨까요?"
- "추억이 담긴 사진앨범을 특정인에게 남겨보는 건 어떨까요?"
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error('Gemini API 오류:', error);
    throw new Error('AI 제안 생성 실패');
  }
}

/**
 * 일반 AI 응답 생성 (챗봇 용도)
 * @param {string} userMessage - 사용자 메시지
 * @returns {Promise<string>} - AI 응답
 */
async function generateChatResponse(userMessage) {
  try {
    const model = genAI.getGenerativeModel({model: 'gemini-pro'});

    const prompt = `
당신은 디지털 유산 관리 서비스 "Memento"의 친절한 AI 어시스턴트입니다.

사용자 질문: "${userMessage}"

위 질문에 대해 친절하고 따뜻하게 답변해주세요.
답변은 200자 이내로 간단명료하게 작성해주세요.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error('Gemini API 오류:', error);
    throw new Error('AI 응답 생성 실패');
  }
}

/**
 * 타임캡슐 메시지 제안 생성
 * @param {string} occasion - 상황/이벤트 (예: "생일", "결혼기념일")
 * @param {string} recipient - 받는 사람 (예: "딸", "아들", "배우자")
 * @returns {Promise<string>} - AI가 생성한 메시지 제안
 */
async function generateTimeCapsuleMessage(occasion, recipient) {
  try {
    const model = genAI.getGenerativeModel({model: 'gemini-pro'});

    const prompt = `
당신은 감성적인 편지 작성 전문가입니다.

상황: ${occasion}
받는 사람: ${recipient}

위 상황에서 ${
        recipient}에게 전할 수 있는 따뜻하고 감동적인 타임캡슐 메시지를 작성해주세요.
메시지는 한국어로 작성하고, 200자 이내로 작성해주세요.

예시 형식:
"사랑하는 [받는 사람]에게,
[감동적인 내용]
언제나 너를 응원할게. - 보내는 이"
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error('Gemini API 오류:', error);
    throw new Error('타임캡슐 메시지 생성 실패');
  }
}

/**
 * 문서 요약 생성
 * @param {string} documentText - 요약할 문서 텍스트
 * @returns {Promise<string>} - 요약된 텍스트
 */
async function summarizeDocument(documentText) {
  try {
    const model = genAI.getGenerativeModel({model: 'gemini-pro'});

    const prompt = `
다음 문서를 3-5줄로 요약해주세요. 핵심 내용만 간단명료하게 정리해주세요.

문서:
"${documentText}"

요약:
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error('Gemini API 오류:', error);
    throw new Error('문서 요약 실패');
  }
}

/**
 * 🔥 디지털 자산 카테고리 자동 분류
 * @param {string} serviceName - 서비스명 (예: "Instagram", "국민은행",
 *     "Netflix")
 * @returns {Promise<string>} - SNS / 금융 / 구독 / 클라우드 / 기타 중 하나
 */
async function classifyAssetCategory(serviceName) {
  try {
    const model = genAI.getGenerativeModel({model: 'gemini-pro'});

    const prompt = `
당신은 디지털 서비스들을 카테고리로 분류하는 전문가입니다.

다음 서비스 이름을 아래 카테고리 중 하나로 분류하세요.

카테고리 목록:
- SNS
- 금융
- 구독
- 클라우드
- 기타

규칙:
1. 반드시 위 카테고리 중 하나만 출력하세요.
2. 설명이나 이유는 절대 쓰지 말고, 카테고리 이름만 한 단어로 출력하세요.
3. 한국 서비스 이름도 정확히 인식해서 분류하세요.

서비스 이름: "${serviceName}"
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = (response.text() || '').trim();

    // 1차: 그대로 온 경우 (SNS/금융/구독/클라우드/기타)
    const candidates = ['SNS', '금융', '구독', '클라우드', '기타'];
    if (candidates.includes(text)) {
      return text;
    }

    // 2차: 소문자/대문자/공백 제거 후 매핑
    const normalized =
        text.replace(/[^ㄱ-ㅎ가-힣A-Za-z]/g, '').toLowerCase();

    if (normalized.includes('sns')) return 'SNS';
    if (normalized.includes('금융') || normalized.includes('bank'))
      return '금융';
    if (normalized.includes('구독') || normalized.includes('subscription'))
      return '구독';
    if (normalized.includes('클라우드') || normalized.includes('cloud'))
      return '클라우드';

    // 아무 것도 안 맞으면 기타
    return '기타';
  } catch (error) {
    console.error('Gemini 카테고리 분류 오류:', error);
    // AI가 실패하면 호출 쪽에서 fallback 쓸 수 있도록 null 반환
    return null;
  }
}

module.exports = {
  generateWillSuggestion,
  generateChatResponse,
  generateTimeCapsuleMessage,
  summarizeDocument,
  classifyAssetCategory,  // 🔥 새로 export 추가
};
