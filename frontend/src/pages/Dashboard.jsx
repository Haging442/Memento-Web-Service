// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { theme } from "../styles/theme";

export default function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const name = localStorage.getItem("name");

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔥 챗봇 상태 추가
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // 🔥 챗봇 메시지 전송 함수
  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);

    try {
      const res = await fetch("http://localhost:4000/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "서버 응답을 받을 수 없습니다." },
      ]);
    }

    setInput("");
  };

  // 로그아웃 핸들러
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("name");
    navigate("/login");
  }

  // 자산 조회
  useEffect(() => {
    async function fetchAssets() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/assets");
        setAssets(res.data);
      } catch (err) {
        console.error(err);
        setError("자산 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>📖</span>
            <span style={styles.logoText}>Memento</span>
          </div>
          <div style={styles.userInfo}>
            <span style={styles.greeting}>안녕하세요, {name || username}님</span>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          로그아웃
        </button>
      </header>

      {/* 메인 콘텐츠 */}
      <main style={styles.main}>
        {/* 빠른 메뉴 */}
        <section style={styles.quickMenuSection}>
          <h2 style={styles.sectionTitle}>빠른 메뉴</h2>
          <div style={styles.menuGrid}>
            <div style={styles.menuCard} onClick={() => navigate("/assets/create")}>
              <div style={styles.menuIconWrapper}>
                <span style={styles.menuIcon}>💎</span>
              </div>
              <h3 style={styles.menuTitle}>자산 등록</h3>
              <p style={styles.menuDesc}>디지털 자산을 등록하고 관리하세요</p>
            </div>

            <div style={styles.menuCard} onClick={() => navigate("/contacts")}>
              <div style={styles.menuIconWrapper}>
                <span style={styles.menuIcon}>👥</span>
              </div>
              <h3 style={styles.menuTitle}>신뢰 연락처</h3>
              <p style={styles.menuDesc}>신뢰할 수 있는 연락처를 관리하세요</p>
            </div>

            <div style={styles.menuCard} onClick={() => navigate("/time-capsules")}>
              <div style={styles.menuIconWrapper}>
                <span style={styles.menuIcon}>📦</span>
              </div>
              <h3 style={styles.menuTitle}>타임캡슐</h3>
              <p style={styles.menuDesc}>미래에 전할 메시지를 작성하세요</p>
            </div>

            <div style={styles.menuCard} onClick={() => navigate("/test/daily-question")}>
              <div style={styles.menuIconWrapper}>
                <span style={styles.menuIcon}>💭</span>
              </div>
              <h3 style={styles.menuTitle}>오늘의 질문</h3>
              <p style={styles.menuDesc}>AI가 제안하는 일일 질문에 답변하세요</p>
            </div>

            <div style={styles.menuCard} onClick={() => navigate("/memorial/settings")}>
              <div style={styles.menuIconWrapper}>
                <span style={styles.menuIcon}>🕊️</span>
              </div>
              <h3 style={styles.menuTitle}>추모 공간</h3>
              <p style={styles.menuDesc}>추모 공간 생성 동의 및 설정 관리</p>
            </div>

            {role === "ADMIN" && (
              <div
                style={{ ...styles.menuCard, ...styles.adminCard }}
                onClick={() => navigate("/admin")}
              >
                <div style={styles.menuIconWrapper}>
                  <span style={styles.menuIcon}>🔐</span>
                </div>
                <h3 style={styles.menuTitle}>관리자</h3>
                <p style={styles.menuDesc}>사망 신고 관리</p>
              </div>
            )}
          </div>
        </section>

        {/* 🔥 🔥 🔥 AI 유언장 비서 섹션 추가 */}
        <section style={chatbotStyles.card}>
          <h3 style={chatbotStyles.title}>🤖 AI 유언장 작성 비서</h3>

          <div style={chatbotStyles.chatWindow}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ textAlign: m.role === "user" ? "right" : "left" }}>
                <div
                  style={{
                    ...chatbotStyles.messageBubble,
                    ...(m.role === "user"
                      ? chatbotStyles.bubbleUser
                      : chatbotStyles.bubbleBot),
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div style={chatbotStyles.inputRow}>
            <input
              style={chatbotStyles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
            />
            <button style={chatbotStyles.sendButton} onClick={sendMessage}>
              전송
            </button>
          </div>
        </section>
        {/* 🔥 🔥 🔥 AI 챗봇 끝 */}

        {/* 자산 목록 */}
        <section style={styles.assetsSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>내 디지털 자산</h2>
            <button onClick={() => navigate("/assets/create")} style={styles.addButton}>
              + 자산 등록
            </button>
          </div>

          {loading && <p style={styles.loadingText}>불러오는 중...</p>}

          {error && <div style={styles.errorBox}>{error}</div>}

          {!loading && assets.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💎</div>
              <p style={styles.emptyText}>등록된 디지털 자산이 없습니다.</p>
              <button onClick={() => navigate("/assets/create")} style={styles.emptyButton}>
                첫 자산 등록하기
              </button>
            </div>
          )}

          {!loading && assets.length > 0 && (
            <div style={styles.assetsGrid}>
              {assets.map((asset) => (
                <div key={asset.id} style={styles.assetCard}>
                  <div style={styles.assetHeader}>
                    <h3 style={styles.assetName}>{asset.service_name}</h3>
                    {asset.category && (
                      <span style={styles.assetBadge}>{asset.category}</span>
                    )}
                  </div>
                  <div style={styles.assetDetails}>
                    {asset.login_id && (
                      <div style={styles.assetDetail}>
                        <span style={styles.detailLabel}>계정:</span>
                        <span style={styles.detailValue}>{asset.login_id}</span>
                      </div>
                    )}
                    {asset.monthly_fee != null && (
                      <div style={styles.assetDetail}>
                        <span style={styles.detailLabel}>월 정액:</span>
                        <span style={styles.detailValue}>
                          {asset.monthly_fee.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    {asset.memo && (
                      <div style={styles.assetMemo}>{asset.memo}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.sm,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '28px',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: '-0.5px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  greeting: {
    fontSize: '15px',
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  logoutButton: {
    padding: '10px 20px',
    background: 'transparent',
    color: theme.colors.text.secondary,
    border: `2px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  quickMenuSection: {
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: '24px',
    letterSpacing: '-0.5px',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  menuCard: {
    background: theme.colors.surface,
    padding: '32px 24px',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.3s',
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.sm,
  },
  adminCard: {
    background: '#FFF9F5',
    border: `2px solid ${theme.colors.accent}`,
  },
  menuIconWrapper: {
    marginBottom: '16px',
  },
  menuIcon: {
    fontSize: '40px',
  },
  menuTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: theme.colors.text.primary,
    margin: '0 0 8px 0',
  },
  menuDesc: {
    fontSize: '14px',
    color: theme.colors.text.secondary,
    margin: 0,
    lineHeight: 1.5,
  },
  assetsSection: {
    background: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: '32px',
    boxShadow: theme.shadows.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  addButton: {
    padding: '10px 20px',
    background: theme.colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    padding: '40px',
  },
  errorBox: {
    padding: '16px',
    background: '#FEE',
    color: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${theme.colors.error}`,
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
    fontSize: '16px',
    color: theme.colors.text.secondary,
    marginBottom: '24px',
  },
  emptyButton: {
    padding: '12px 24px',
    background: theme.colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
  },
  assetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  assetCard: {
    padding: '20px',
    background: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  assetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  assetName: {
    fontSize: '16px',
    fontWeight: '600',
    color: theme.colors.text.primary,
    margin: 0,
  },
  assetBadge: {
    padding: '4px 12px',
    background: theme.colors.accent,
    color: 'white',
    borderRadius: theme.borderRadius.full,
    fontSize: '12px',
    fontWeight: '600',
  },
  assetDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  assetDetail: {
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
  },
  detailLabel: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  detailValue: {
    color: theme.colors.text.primary,
  },
  assetMemo: {
    fontSize: '13px',
    color: theme.colors.text.light,
    marginTop: '4px',
    paddingTop: '8px',
    borderTop: `1px solid ${theme.colors.border}`,
  },
};

const chatbotStyles = {
  card: {
    background: theme.colors.surface,
    padding: "24px",
    borderRadius: theme.borderRadius.md,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.sm,
    marginBottom: "40px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "16px",
    color: theme.colors.text.primary,
  },
  chatWindow: {
    height: "300px",
    overflowY: "auto",
    padding: "12px",
    borderRadius: theme.borderRadius.sm,
    background: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    marginBottom: "16px",
  },
  messageBubble: {
    display: "inline-block",
    padding: "10px 14px",
    margin: "6px 0",
    borderRadius: theme.borderRadius.sm,
    maxWidth: "85%",
    lineHeight: 1.4,
  },
  bubbleUser: {
    background: "#D8E7FF",
    color: "#1E3A8A",
  },
  bubbleBot: {
    background: "#F2F2F2",
    color: theme.colors.text.primary,
  },
  inputRow: {
    display: "flex",
    gap: "8px",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  sendButton: {
    padding: "10px 16px",
    background: theme.colors.primary,
    color: "white",
    border: "none",
    borderRadius: theme.borderRadius.sm,
    cursor: "pointer",
    fontWeight: "600",
  },
};
