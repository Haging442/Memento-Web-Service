// src/pages/TimeCapsulesPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { theme } from '../styles/theme';

export default function TimeCapsulesPage() {
  const navigate = useNavigate();
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [releaseType, setReleaseType] = useState("IMMEDIATE");
  const [releaseDate, setReleaseDate] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");

  async function fetchCapsules() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/time-capsules");
      setCapsules(res.data);
    } catch (err) {
      console.error(err);
      setError("타임캡슐 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCapsules();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const capsuleData = {
      title,
      message,
      releaseType,
      releaseDate: releaseType === "ON_DATE" ? releaseDate : null,
      recipientName,
      recipientContact,
    };

    try {
      await api.post("/time-capsules", capsuleData);
      await fetchCapsules();

      setTitle("");
      setMessage("");
      setReleaseType("IMMEDIATE");
      setReleaseDate("");
      setRecipientName("");
      setRecipientContact("");
      
      alert('타임캡슐이 저장되었습니다!');
    } catch (err) {
      console.error(err);
      setError(`타임캡슐 저장 중 오류: ${err.response?.data?.error || err.message}`);
    }
  }

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate("/dashboard")} style={styles.backButton}>
            ← 돌아가기
          </button>
          <div style={styles.headerTitle}>
            <span style={styles.headerIcon}>📦</span>
            <h1 style={styles.title}>타임캡슐</h1>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.content}>
          {/* 생성 폼 */}
          <section style={styles.formSection}>
            <div style={styles.formHeader}>
              <h2 style={styles.sectionTitle}>새 타임캡슐 만들기</h2>
              <p style={styles.sectionDesc}>
                미래에 전하고 싶은 메시지를 담아보세요
              </p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>제목 *</label>
                <input
                  style={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="타임캡슐의 제목을 입력하세요"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>메시지</label>
                <textarea
                  style={styles.textarea}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="전하고 싶은 이야기를 자유롭게 작성하세요..."
                />
              </div>

              <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>공개 방식 *</label>
                  <select
                    style={styles.select}
                    value={releaseType}
                    onChange={(e) => setReleaseType(e.target.value)}
                  >
                    <option value="IMMEDIATE">즉시 공개</option>
                    <option value="ON_DEATH">사망 확정 시 공개</option>
                    <option value="ON_DATE">특정 날짜에 공개</option>
                  </select>
                </div>

                {releaseType === "ON_DATE" && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>공개 날짜</label>
                    <input
                      type="datetime-local"
                      style={styles.input}
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>받는 사람 이름</label>
                  <input
                    style={styles.input}
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="예: 홍길동"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>받는 사람 연락처</label>
                  <input
                    style={styles.input}
                    value={recipientContact}
                    onChange={(e) => setRecipientContact(e.target.value)}
                    placeholder="이메일 또는 전화번호"
                  />
                </div>
              </div>

              {error && <div style={styles.errorBox}>{error}</div>}

              <button type="submit" style={styles.submitButton}>
                타임캡슐 저장
              </button>
            </form>
          </section>

          {/* 타임캡슐 리스트 */}
          <section style={styles.listSection}>
            <div style={styles.listHeader}>
              <h2 style={styles.sectionTitle}>내 타임캡슐</h2>
              <span style={styles.countBadge}>{capsules.length}개</span>
            </div>

            {loading && <p style={styles.loadingText}>불러오는 중...</p>}

            {!loading && capsules.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📦</div>
                <p style={styles.emptyText}>작성된 타임캡슐이 없습니다.</p>
                <p style={styles.emptyDesc}>첫 타임캡슐을 만들어보세요.</p>
              </div>
            )}

            {!loading && capsules.length > 0 && (
              <div style={styles.capsulesGrid}>
                {capsules.map((c) => (
                  <div key={c.id} style={styles.capsuleCard}>
                    <div style={styles.capsuleHeader}>
                      <div>
                        <h3 style={styles.capsuleTitle}>{c.title}</h3>
                        <div style={styles.capsuleMeta}>
                          <span style={styles.releaseTypeBadge}>
                            {c.release_type === 'IMMEDIATE' ? '즉시 공개' :
                             c.release_type === 'ON_DEATH' ? '사망 시 공개' :
                             '날짜 지정'}
                          </span>
                          <span style={c.is_released ? styles.statusReleased : styles.statusLocked}>
                            {c.is_released ? '✓ 공개됨' : '🔒 비공개'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {c.message && (
                      <p style={styles.capsuleMessage}>
                        {c.message.length > 100 ? c.message.substring(0, 100) + '...' : c.message}
                      </p>
                    )}

                    <div style={styles.capsuleFooter}>
                      {c.recipient_name && (
                        <div style={styles.recipientInfo}>
                          <span style={styles.recipientLabel}>받는 사람:</span>
                          <span style={styles.recipientName}>{c.recipient_name}</span>
                        </div>
                      )}
                      <div style={styles.capsuleDate}>
                        {new Date(c.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  formSection: {
    background: theme.colors.surface,
    padding: '32px',
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  formHeader: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: theme.colors.text.primary,
    margin: '0 0 8px 0',
  },
  sectionDesc: {
    fontSize: '14px',
    color: theme.colors.text.secondary,
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    border: `2px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    background: theme.colors.surface,
    color: theme.colors.text.primary,
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  select: {
    padding: '12px 16px',
    fontSize: '15px',
    border: `2px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    background: theme.colors.surface,
    color: theme.colors.text.primary,
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  textarea: {
    padding: '12px 16px',
    fontSize: '15px',
    border: `2px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    background: theme.colors.surface,
    color: theme.colors.text.primary,
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    minHeight: '120px',
    resize: 'vertical',
  },
  errorBox: {
    padding: '12px 16px',
    background: '#FEE',
    color: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${theme.colors.error}`,
    fontSize: '14px',
  },
  submitButton: {
    padding: '14px',
    background: theme.colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s',
    marginTop: '8px',
  },
  listSection: {
    background: theme.colors.surface,
    padding: '32px',
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  countBadge: {
    padding: '6px 16px',
    background: theme.colors.accent,
    color: 'white',
    borderRadius: theme.borderRadius.full,
    fontSize: '14px',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    padding: '40px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: '8px',
  },
  emptyDesc: {
    fontSize: '14px',
    color: theme.colors.text.secondary,
    margin: 0,
  },
  capsulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  capsuleCard: {
    padding: '24px',
    background: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${theme.colors.border}`,
    transition: 'all 0.2s',
  },
  capsuleHeader: {
    marginBottom: '16px',
  },
  capsuleTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: theme.colors.text.primary,
    margin: '0 0 12px 0',
  },
  capsuleMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  releaseTypeBadge: {
    padding: '4px 12px',
    background: theme.colors.secondary,
    color: 'white',
    borderRadius: theme.borderRadius.full,
    fontSize: '12px',
    fontWeight: '600',
  },
  statusReleased: {
    padding: '4px 12px',
    background: theme.colors.success,
    color: 'white',
    borderRadius: theme.borderRadius.full,
    fontSize: '12px',
    fontWeight: '600',
  },
  statusLocked: {
    padding: '4px 12px',
    background: theme.colors.text.light,
    color: 'white',
    borderRadius: theme.borderRadius.full,
    fontSize: '12px',
    fontWeight: '600',
  },
  capsuleMessage: {
    fontSize: '14px',
    color: theme.colors.text.secondary,
    lineHeight: 1.6,
    marginBottom: '16px',
    paddingTop: '12px',
    borderTop: `1px solid ${theme.colors.border}`,
  },
  capsuleFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: `1px solid ${theme.colors.border}`,
  },
  recipientInfo: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  recipientLabel: {
    fontSize: '12px',
    color: theme.colors.text.light,
  },
  recipientName: {
    fontSize: '13px',
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  capsuleDate: {
    fontSize: '12px',
    color: theme.colors.text.light,
  },
};