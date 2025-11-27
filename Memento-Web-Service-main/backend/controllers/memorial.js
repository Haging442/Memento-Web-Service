// controllers/memorial.js


const db = require('../db');
const aiService = require('../aiservice'); 
const { calculateAge } = require('../utils/helpers'); // 생몰년도 계산 헬퍼 (별도 구현 필요)


// ----------------------------------------------------
// 1. 추모 공간 생성 동의 및 설정 (POST /memorial/consent)
// ----------------------------------------------------

exports.setMemorialConsent = (req, res) => {
    const userId = req.user.id;
    const { consent, profilePhotoUrl, selectedContents } = req.body; // contents는 배열 형태

    // consent: true/false, profilePhotoUrl: 사용자가 선택한 URL, selectedContents: [answerId, answerId, ...]

    db.run(
        `INSERT INTO user_memorial_settings (user_id, consent_given, profile_photo_url, selected_content_ids)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           consent_given = ?,
           profile_photo_url = ?,
           selected_content_ids = ?`,
        [
            userId, 
            consent ? 1 : 0, 
            profilePhotoUrl, 
            JSON.stringify(selectedContents),
            consent ? 1 : 0, 
            profilePhotoUrl, 
            JSON.stringify(selectedContents)
        ],
        (err) => {
            if (err) return res.status(500).json({ error: '추모 설정 저장 실패: ' + err.message });
            res.json({ success: true, message: '추모 공간 설정이 저장되었습니다.' });
        }
    );
};


// ----------------------------------------------------
// 2. 추모 공간 자동 생성 및 미리보기 (POST /memorial/generate)
// ----------------------------------------------------

exports.generateMemorialSpace = async (req, res) => {
    const userId = req.user.id;
    const { desiredVibe } = req.body; 

    // 1. 사용자 정보 및 동의 설정 확인
    db.get(
        `SELECT u.username, u.birth_date, s.profile_photo_url, s.selected_content_ids
         FROM users u
         JOIN user_memorial_settings s ON u.id = s.user_id
         WHERE u.id = ? AND s.consent_given = 1`,
        [userId],
        async (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(403).json({ error: '추모 공간 생성 동의가 필요합니다.' });

            const selectedIds = JSON.parse(user.selected_content_ids || '[]');
            
            // 2. 사용자가 선택한 콘텐츠 (답변) 및 키워드 추출
            const placeholders = selectedIds.map(() => '?').join(',');
            const sql = `SELECT answer_text, answered_at, ai_analysis FROM user_daily_answers WHERE id IN (${placeholders})`;

            db.all(
                sql,
                selectedIds,
                async (err, contents) => {
                    if (err) return res.status(500).json({ error: '콘텐츠 조회 실패: ' + err.message });
                    
                    const timeline = [];
                    const allKeywords = new Set();
                    let analysisSummary = "";

                    contents.forEach(c => {
                        const analysis = JSON.parse(c.ai_analysis || '{}');
                        
                        // 타임라인 데이터 구성
                        timeline.push({
                            date: c.answered_at.split(' ')[0], 
                            text: c.answer_text,
                            keywords: analysis.keywords || [],
                            summary: analysis.summary || c.answer_text.substring(0, 30) + '...'
                        });
                        
                        // 추모 문구 생성을 위한 분석 요약 합치기
                        if (analysis.summary) {
                            analysisSummary += analysis.summary + ". ";
                        }
                        
                        // 모든 키워드 수집 (중복 제거)
                        (analysis.keywords || []).forEach(k => allKeywords.add(k));
                    });
                    
                    const groupedTimeline = groupTimelineByYear(timeline);

                    // 3. AI 추모 문구 및 테마 생성 (비동기 병렬 처리)
                    const [memorialPhrase, theme] = await Promise.all([
                        aiService.generateMemorialPhrase(analysisSummary || "밝고 긍정적인 삶을 사셨습니다.", user.username),
                        desiredVibe 
                            ? aiService.generateMemorialTheme(desiredVibe) 
                            : Promise.resolve({ 
                                themeName: '기본 테마',
                                colorPalette: ['#EAEAEA', '#6C757D', '#212529'], 
                                fontStyle: 'sans-serif',
                                cssKeywords: ['clean', 'minimal', 'default']
                            })
                    ]);
                    
                    // 4. 최종 데이터 응답
                    const memorialData = {
                        success: true,
                        // 1. 기본 정보
                        profile: {
                            name: user.username,
                            photoUrl: user.profile_photo_url,
                            birthDate: user.birth_date,
                            // calculateAge 함수는 utils/helpers.js에 정의되어야 합니다.
                            age: user.birth_date ? calculateAge(user.birth_date) : null 
                        },
                        // 2. AI 생성 콘텐츠
                        aiContent: {
                            phrase: memorialPhrase,
                            theme: theme,
                            vibeInput: desiredVibe || '기본'
                        },
                        // 3. 타임라인 및 키워드
                        timeline: groupedTimeline,
                        majorKeywords: Array.from(allKeywords).slice(0, 10),
                        // 4. 방명록 설정 (추후 구현)
                        guestbook: {
                            enabled: true,
                            spamPrevention: 'reCAPTCHA',
                            privateEnabled: true,
                            trustedUserDeletion: true 
                        }
                    };

                    // DB에 최종 생성된 데이터 저장 로직 (생략, 추후 구현)
                    
                    res.json(memorialData);
                }
            );
        }
    );
};


// 헬퍼 함수: 타임라인을 연도별로 그룹화
function groupTimelineByYear(timeline) {
    return timeline.reduce((acc, item) => {
        const year = item.date.substring(0, 4);
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(item);
        return acc;
    }, {});
}

// ----------------------------------------------------
// 3. 방명록 관련 기능 (추후 구현)
// ----------------------------------------------------
exports.postGuestbook = (req, res) => { 
    return res.status(501).json({ error: 'Not Implemented' });
};
exports.deleteGuestbookEntry = (req, res) => { 
    return res.status(501).json({ error: 'Not Implemented' });
};
