// aiLoader.js
async function loadAiModule() {
    // ⚠️ 패키지명 수정: @google/genai → @google/generative-ai
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    return GoogleGenerativeAI;
}

module.exports = loadAiModule;