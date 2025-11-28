// src/pages/CreateAssetPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { theme } from '../styles/theme';

export default function CreateAssetPage() {
  const navigate = useNavigate();
  const [serviceName, setServiceName] = useState("");
  const [category, setCategory] = useState("");
  const [loginId, setLoginId] = useState("");
  const [memo, setMemo] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      await api.post("/assets", {
        serviceName,
        category,
        loginId,
        memo,
        monthlyFee: monthlyFee ? Number(monthlyFee) : null,
      });

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("등록 중 오류가 발생했습니다.");
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
            <span style={styles.headerIcon}>💎</span>
            <h1 style={styles.title}>디지털 자산 등록</h1>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>새 자산 등록</h2>
            <p style={styles.formDesc}>
              관리하고 싶은 디지털 서비스나 계정 정보를 등록하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>서비스명 *</label>
              <input
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                required
                placeholder="예: Netflix, YouTube Premium"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={styles.select}
              >
                <option value="">선택하세요</option>
                <option value="스트리밍">스트리밍</option>
                <option value="소셜미디어">소셜미디어</option>
                <option value="클라우드">클라우드 저장소</option>
                <option value="금융">금융 서비스</option>
                <option value="쇼핑">쇼핑몰</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>로그인 ID</label>
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="example@email.com"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>월 정액 (원)</label>
              <input
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                placeholder="0"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>메모</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="추가 정보나 메모를 작성하세요..."
                style={styles.textarea}
              />
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.submitButton}>
                등록하기
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={styles.cancelButton}
              >
                취소
              </button>
            </div>
          </form>
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
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  formContainer: {
    background: theme.colors.surface,
    padding: '40px',
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  formHeader: {
    marginBottom: '32px',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: theme.colors.text.primary,
    margin: '0 0 8px 0',
  },
  formDesc: {
    fontSize: '15px',
    color: theme.colors.text.secondary,
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
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
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
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
  cancelButton: {
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
};