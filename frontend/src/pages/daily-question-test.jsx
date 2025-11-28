// src/pages/DailyQuestionTest.jsx 수정
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { theme } from '../styles/theme';

export default function DailyQuestionTest() {
  const navigate = useNavigate();
  
  // State
  const [stats, setStats] = useState(null);
  const [questionContent, setQuestionContent] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // 컴포넌트 마운트 시 질문 로드
  useEffect(() => {
    loadTodayQuestion();
  }, []);

  // 오늘의 질문 로드
  const loadTodayQuestion = async () => {
    setLoading(true);
    setQuestionContent({ type: 'loading' });

    try {
      console.log('🔍 질문 로드 시작...');
      const response = await api.get('/daily-question/today');
      console.log('✅ 응답 받음:', response.data);
      
      const data = response.data;

      setStats(data.stats);
      if (data.hasQuestionToday) {
        setQuestionContent({ type: 'question', data: data.question });
        console.log('📝 질문 로드 성공:', data.question);
      } else {
        setQuestionContent({ type: 'no-question', message: data.message });
        console.log('ℹ️ 오늘 질문 없음:', data.message);
        loadSuggestions();
      }
    } catch (error) {
      console.error('❌ 질문 로드 실패:', error);
      console.error('에러 상세:', error.response?.data);
      console.error('상태 코드:', error.response?.status);
      
      const errorMessage = error.response?.data?.error || error.message || '알 수 없는 오류';
      setQuestionContent({ 
        type: 'error', 
        message: `질문 로드 실패: ${errorMessage}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // 답변 제출
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setQuestionContent({ type: 'loading' });

    try {
      console.log('📤 답변 제출 중...', {
        questionId: questionContent.data.id,
        answerLength: answerText.length
      });
      
      const response = await api.post('/daily-question/answer', {
        questionId: questionContent.data.id,
        answerText
      });

      console.log('✅ 답변 제출 성공:', response.data);
      setQuestionContent({ type: 'success', message: response.data.message });
      setAnswerText('');
      setTimeout(() => {
        loadSuggestions();
      }, 2000);
    } catch (error) {
      console.error('❌ 답변 제출 실패:', error);
      console.error('에러 상세:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || error.message;
      setQuestionContent({ type: 'error', message: `답변 제출 실패: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  // 제안 로드
  const loadSuggestions = async () => {
    try {
      console.log('💡 제안 로드 중...');
      const response = await api.get('/daily-question/suggestions');
      console.log('✅ 제안 로드 성공:', response.data);
      
      if (response.data.suggestions && response.data.suggestions.length > 0) {
        setSuggestions(response.data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('❌ 제안 로드 실패:', error);
      setSuggestions([]);
    }
  };

  // 제안 응답
  const respondToSuggestion = async (suggestionId, action) => {
    try {
      console.log(`🔄 제안 응답: ${action}`, suggestionId);
      const response = await api.post(
        `/daily-question/suggestions/${suggestionId}/respond`,
        { action }
      );

      console.log('✅ 제안 응답 성공:', response.data);
      alert(response.data.message);
      loadSuggestions();
    } catch (error) {
      console.error('❌ 제안 응답 실패:', error);
      alert(`처리 실패: ${error.response?.data?.error || error.message}`);
    }
  };

  // 질문 건너뛰기
  const skipQuestion = () => {
    console.log('⏭️ 질문 건너뛰기');
    loadSuggestions();
    setQuestionContent({ type: 'no-question', message: '나중에 답변하기로 선택했습니다.' });
  };

  // 제안 관련 유틸리티
  const getSuggestionIcon = (type) => {
    const icons = {
      CONTACT: '👤',
      TIME_CAPSULE: '📦',
      ASSET: '💎',
      WILL_ITEM: '📝'
    };
    return icons[type] || '💡';
  };

  const getSuggestionTitle = (type) => {
    const titles = {
      CONTACT: '신뢰 연락처 추가',
      TIME_CAPSULE: '타임캡슐 생성',
      ASSET: '디지털 자산 등록',
      WILL_ITEM: '유언장 항목 추가'
    };
    return titles[type] || '제안';
  };

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate("/dashboard")} style={styles.backButton}>
            ← 돌아가기
          </button>
          <div style={styles.headerTitle}>
            <span style={styles.headerIcon}>💭</span>
            <h1 style={styles.title}>오늘의 질문</h1>
          </div>
        </div>
        <button onClick={loadTodayQuestion} style={styles.refreshButton}>
          🔄 새로고침
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.content}>
          {/* 통계 */}
          {stats && (
            <div style={styles.statsCard}>
              <div style={styles.statItem}>
                <span style={styles.statIcon}>📊</span>
                <div>
                  <div style={styles.statLabel}>총 답변 수</div>
                  <div style={styles.statValue}>{stats.totalAnswered}개</div>
                </div>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statIcon}>🔥</span>
                <div>
                  <div style={styles.statLabel}>연속 답변</div>
                  <div style={styles.statValue}>{stats.currentStreak || 0}일</div>
                </div>
              </div>
            </div>
          )}

          {/* 질문 콘텐츠 */}
          <div style={styles.questionSection}>
            {questionContent && (
              <>
                {questionContent.type === 'loading' && (
                  <div style={styles.loading}>
                    <div style={styles.spinner} />
                    <p style={styles.loadingText}>질문을 불러오는 중...</p>
                  </div>
                )}

                {questionContent.type === 'question' && (
                  <div style={styles.questionContainer}>
                    <div style={styles.questionCard}>
                      <span style={styles.questionCategory}>{questionContent.data.category}</span>
                      <div style={styles.questionText}>{questionContent.data.text}</div>
                    </div>

                    <form onSubmit={handleSubmitAnswer} style={styles.form}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>답변을 입력해주세요</label>
                        <textarea
                          style={styles.textarea}
                          placeholder="자유롭게 작성해주세요..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          required
                        />
                      </div>
                      <div style={styles.buttonGroup}>
                        <button type="submit" style={styles.submitButton}>
                          답변 제출
                        </button>
                        <button type="button" style={styles.skipButton} onClick={skipQuestion}>
                          나중에 답변하기
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {questionContent.type === 'no-question' && (
                  <div style={styles.messageCard}>
                    <div style={styles.messageIcon}>✨</div>
                    <p style={styles.messageText}>{questionContent.message}</p>
                  </div>
                )}

                {questionContent.type === 'success' && (
                  <div style={styles.successCard}>
                    <div style={styles.successIcon}>✅</div>
                    <p style={styles.successText}>{questionContent.message}</p>
                  </div>
                )}

                {questionContent.type === 'error' && (
                  <div style={styles.errorCard}>
                    <div style={styles.errorIcon}>⚠️</div>
                    <p style={styles.errorText}>{questionContent.message}</p>
                    <button onClick={loadTodayQuestion} style={styles.retryButton}>
                      다시 시도
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* AI 제안 */}
          {suggestions.length > 0 && (
            <div style={styles.suggestionsSection}>
              <h2 style={styles.suggestionsTitle}>💡 AI 제안</h2>
              <div style={styles.suggestionsGrid}>
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} style={styles.suggestionCard}>
                    <div style={styles.suggestionHeader}>
                      <span style={styles.suggestionIcon}>{getSuggestionIcon(suggestion.type)}</span>
                      <h3 style={styles.suggestionCardTitle}>{getSuggestionTitle(suggestion.type)}</h3>
                    </div>
                    <p style={styles.suggestionText}>{suggestion.text}</p>
                    <div style={styles.suggestionActions}>
                      <button
                        style={styles.acceptButton}
                        onClick={() => respondToSuggestion(suggestion.id, 'accept')}
                      >
                        ✓ 수락
                      </button>
                      <button
                        style={styles.rejectButton}
                        onClick={() => respondToSuggestion(suggestion.id, 'reject')}
                      >
                        × 거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: theme.colors.background,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
  },
  header: {
    background: theme.colors.surface,
    padding: '20px 40px',
    borderBottom: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.sm,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  backButton: {
    padding: '8px 16px',
    background: 'transparent',
    color: theme.colors.text.secondary,
    border: `2px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  refreshButton: {
    padding: '8px 16px',
    background: theme.colors.accent,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerIcon: {
    fontSize: '28px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: theme.colors.text.primary,
    margin: 0,
  },
  main: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  statsCard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    background: theme.colors.surface,
    padding: '24px',
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    fontSize: '32px',
  },
  statLabel: {
    fontSize: '13px',
    color: theme.colors.text.secondary,
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: theme.colors.primary,
  },
  questionSection: {
    background: theme.colors.surface,
    padding: '32px',
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  spinner: {
    display: 'inline-block',
    width: '40px',
    height: '40px',
    border: `4px solid ${theme.colors.border}`,
    borderTop: `4px solid ${theme.colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: '14px',
  },
  questionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  questionCard: {
    background: `linear-gradient(135deg, ${theme.colors.primary}15 0%, ${theme.colors.accent}15 100%)`,
    padding: '28px',
    borderRadius: theme.borderRadius.md,
    borderLeft: `4px solid ${theme.colors.primary}`,
  },
  questionCategory: {
    display: 'inline-block',
    padding: '6px 16px',
    background: theme.colors.primary,
    color: 'white',
    borderRadius: theme.borderRadius.full,
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  questionText: {
    fontSize: '20px',
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: 1.6,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  textarea: {
    padding: '16px',
    fontSize: '15px',
    border: `2px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    background: theme.colors.surface,
    color: theme.colors.text.primary,
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    minHeight: '150px',
    resize: 'vertical',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  submitButton: {
    flex: 1,
    padding: '14px',
    background: theme.colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  skipButton: {
    padding: '14px 24px',
    background: 'transparent',
    color: theme.colors.text.secondary,
    border: `2px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  messageCard: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  messageIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  messageText: {
    fontSize: '16px',
    color: theme.colors.text.secondary,
    margin: 0,
  },
  successCard: {
    textAlign: 'center',
    padding: '40px 20px',
    background: `${theme.colors.success}15`,
    borderRadius: theme.borderRadius.md,
    border: `1px solid ${theme.colors.success}`,
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  successText: {
    fontSize: '16px',
    color: theme.colors.success,
    fontWeight: '600',
    margin: 0,
  },
  errorCard: {
    textAlign: 'center',
    padding: '40px 20px',
    background: `${theme.colors.error}15`,
    borderRadius: theme.borderRadius.md,
    border: `1px solid ${theme.colors.error}`,
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  errorText: {
    fontSize: '16px',
    color: theme.colors.error,
    fontWeight: '600',
    marginBottom: '16px',
  },
  retryButton: {
    padding: '10px 20px',
    background: theme.colors.error,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  suggestionsSection: {
    background: theme.colors.surface,
    padding: '32px',
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  suggestionsTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: '24px',
    margin: 0,
  },
  suggestionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
    marginTop: '24px',
  },
  suggestionCard: {
    padding: '20px',
    background: `${theme.colors.warning}15`,
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${theme.colors.warning}`,
  },
  suggestionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  suggestionIcon: {
    fontSize: '24px',
  },
  suggestionCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: theme.colors.text.primary,
    margin: 0,
  },
  suggestionText: {
    fontSize: '14px',
    color: theme.colors.text.secondary,
    lineHeight: 1.6,
    marginBottom: '16px',
  },
  suggestionActions: {
    display: 'flex',
    gap: '8px',
  },
  acceptButton: {
    flex: 1,
    padding: '10px',
    background: theme.colors.success,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  rejectButton: {
    flex: 1,
    padding: '10px',
    background: theme.colors.error,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
};