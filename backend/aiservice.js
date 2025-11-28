// backend/aiservice.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// 환경변수 체크
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY가 설정되지 않았습니다!");
}

// Gemini AI 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// ✅ 모델명 수정: gemini-2.5-flash 사용
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

console.log("✅ Gemini AI 초기화 완료 (model: gemini-2.5-flash)");


// ----------------------------------------------------
// 1. 오늘의 질문 답변 분석 함수
// ----------------------------------------------------
async function analyzeDailyAnswer(answerText) {
    const prompt = `당신은 사용자의 답변을 분석하여 후속 유산 처리 계획을 돕는 전문 AI입니다. 
사용자의 답변을 다음 JSON 형식에 따라 분석하고 추출하세요.

1. **keywords**: 답변의 핵심 키워드 5개.
2. **entities**: 사람, 장소, 그리고 언급된 디지털 자산(계정, 서비스 등)을 추출하세요.
3. **sentiment**: 답변의 주요 감정을 'positive', 'neutral', 'negative' 중 하나로 평가하세요.
4. **summary**: 답변을 20자 이내로 요약하세요.

디지털 자산(assets) 키워드 예시: 은행, 주식, 코인, 넷플릭스, 이메일, 카카오톡, 구글, 보험.

출력은 반드시 다음 JSON 형식이어야 합니다:
{
  "keywords": ["키워드1", "키워드2", ...],
  "entities": {
    "people": ["사람1", "사람2"],
    "places": ["장소1"],
    "assets": ["자산1"]
  },
  "sentiment": "positive|neutral|negative",
  "summary": "요약문"
}

분석할 답변: "${answerText}"`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // JSON 추출
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error("JSON 파싱 실패");
        
    } catch (error) {
        console.error("❌ Daily Answer 분석 오류:", error);
        return { 
            keywords: [], 
            entities: { people:[], places:[], assets:[] }, 
            sentiment: 'error', 
            summary: 'AI 분석 실패' 
        };
    }
}

// ----------------------------------------------------
// 2. 타임캡슐 내용 검토 함수
// ----------------------------------------------------
async function reviewTimeCapsule(capsuleContent) {
    const prompt = `당신은 사용자가 작성한 타임캡슐 내용을 검토하는 전문 AI입니다. 
내용의 위험도를 평가하고 키워드를 추출하여 다음 JSON 형식에 맞춰 응답하세요.

1. **reviewStatus**: 내용이 자살, 폭력, 불법적이거나 매우 부정적인 정서를 포함하는지 판단하여 'SAFE' 또는 'REVIEW_REQUIRED' 중 하나를 선택하세요.
2. **riskScore**: 위험도를 0.0(안전)부터 1.0(매우 위험) 사이의 숫자로 평가하세요.
3. **suggestedTags**: 내용과 관련된 핵심 태그 3개를 추출하세요.

출력은 반드시 다음 JSON 형식이어야 합니다:
{
  "reviewStatus": "SAFE|REVIEW_REQUIRED",
  "riskScore": 0.5,
  "suggestedTags": ["태그1", "태그2", "태그3"]
}

검토할 내용: "${capsuleContent}"`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const review = JSON.parse(jsonMatch[0]);
            // riskScore 보정
            review.riskScore = Math.min(parseFloat(review.riskScore), 1.0).toFixed(2);
            return review;
        }
        
        throw new Error("JSON 파싱 실패");
        
    } catch (error) {
        console.error("❌ Time Capsule 검토 오류:", error);
        return { 
            reviewStatus: 'ERROR', 
            riskScore: '1.00', 
            suggestedTags: ['오류', '재시도필요'] 
        };
    }
}

// ----------------------------------------------------
// 3. AI 추모 문구 생성 함수
// ----------------------------------------------------
async function generateMemorialPhrase(analysisText, userName) {
    const prompt = `당신은 고인의 삶과 성격을 바탕으로 감동적이고 따뜻한 추모 문구를 생성하는 AI입니다. 
다음 정보를 바탕으로 50자 내외의 추모 문구 하나만 생성해주세요. 
문구는 고인('${userName}')의 삶을 기리는 내용이어야 합니다.

고인의 이름: ${userName}
분석된 삶의 키워드 및 요약: ${analysisText}

추모 문구만 작성하세요:`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
        
    } catch (error) {
        console.error("❌ 추모 문구 생성 오류:", error);
        return `${userName}님은 영원히 우리의 기억 속에 남아 계실 것입니다. 편안히 잠드소서.`;
    }
}

// ----------------------------------------------------
// 4. AI 추모 공간 디자인 테마 생성 함수 (바이브)
// ----------------------------------------------------
async function generateMemorialTheme(vibeDescription) {
    const prompt = `당신은 추모 공간 디자인 전문가 AI입니다. 사용자가 요청한 분위기(vibe)를 바탕으로, 
웹사이트 디자인에 필요한 핵심 테마 요소를 다음 JSON 형식으로 제안해주세요.

응답 형식 (반드시 이 형식으로만 응답):
{
  "themeName": "테마 이름 (예: 평온한 숲속)",
  "colorPalette": ["#색상1", "#색상2", "#색상3"],
  "fontStyle": "폰트스타일 (예: serif, sans-serif, monospace)",
  "cssKeywords": ["키워드1", "키워드2", "키워드3"]
}

cssKeywords 예시: soft-shadows, warm-tones, blur-effect, elegant, nature, minimal, vintage

사용자 요청 분위기: "${vibeDescription}"`;

    try {
        console.log('🤖 Gemini API 호출 중...');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('📝 Gemini 응답:', text);
        
        // JSON 추출
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ 테마 생성 성공:', parsed);
            return parsed;
        }
        
        throw new Error("JSON 파싱 실패");
        
    } catch (error) {
        console.error("❌ 테마 생성 오류:", error);
        return { 
            themeName: '기본 테마',
            colorPalette: ['#EAEAEA', '#6C757D', '#212529'], 
            fontStyle: 'sans-serif',
            cssKeywords: ['clean', 'minimal', 'default']
        };
    }
}

// ----------------------------------------------------
// 5. 바이브 기반 실제 CSS 생성 함수
// ----------------------------------------------------
function generateThemeCSS(theme) {
    const { themeName, colorPalette, fontStyle, cssKeywords } = theme;
    
    // 기본 색상 할당
    const [primaryColor, secondaryColor, accentColor] = colorPalette;
    
    // CSS 키워드 기반 스타일 매핑
    let additionalStyles = '';
    
    if (cssKeywords && cssKeywords.includes('soft-shadows')) {
        additionalStyles += `
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);`;
    }
    
    if (cssKeywords && cssKeywords.includes('warm-tones')) {
        additionalStyles += `
    filter: sepia(0.15) brightness(1.05);`;
    }
    
    if (cssKeywords && cssKeywords.includes('blur-effect')) {
        additionalStyles += `
    backdrop-filter: blur(10px);`;
    }
    
    if (cssKeywords && cssKeywords.includes('elegant')) {
        additionalStyles += `
    letter-spacing: 0.05em;
    line-height: 1.8;`;
    }

    if (cssKeywords && cssKeywords.includes('nature')) {
        additionalStyles += `
    background-image: linear-gradient(135deg, ${primaryColor}ee, ${secondaryColor}ee);`;
    }

    // 최종 CSS 생성
    return `
/* 🎨 ${themeName} 테마 */
.memorial-container {
    --primary-color: ${primaryColor};
    --secondary-color: ${secondaryColor};
    --accent-color: ${accentColor};
    
    background-color: var(--primary-color);
    color: var(--secondary-color);
    font-family: ${fontStyle}, system-ui, -apple-system;${additionalStyles}
    padding: 40px;
    border-radius: 16px;
    transition: all 0.3s ease;
}

.memorial-title {
    color: var(--accent-color);
    font-size: 2em;
    font-weight: 600;
    margin-bottom: 20px;
}

.memorial-content {
    color: var(--secondary-color);
    font-size: 1.1em;
    line-height: 1.8;
}

.memorial-photo {
    border: 3px solid var(--accent-color);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.memorial-guestbook {
    background: linear-gradient(135deg, ${primaryColor}44, ${secondaryColor}44);
    border-left: 4px solid var(--accent-color);
    padding: 20px;
    margin: 20px 0;
    border-radius: 8px;
}
`.trim();
}

// ----------------------------------------------------
// 내보내기
// ----------------------------------------------------
module.exports = {
    analyzeDailyAnswer,
    reviewTimeCapsule,
    generateMemorialPhrase,
    generateMemorialTheme,
    generateThemeCSS,
};