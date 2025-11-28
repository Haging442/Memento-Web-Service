// src/pages/ContactsPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { theme } from '../styles/theme';

export default function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchContacts() {
      try {
        const res = await api.get("/contacts");
        setContacts(res.data);
      } catch (err) {
        console.error(err);
        setError("연락처를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");

    try {
      await api.post("/contacts", { name, relation, email, phone });
      const res = await api.get("/contacts");
      setContacts(res.data);

      setName("");
      setRelation("");
      setEmail("");
      setPhone("");
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
            <span style={styles.headerIcon}>👥</span>
            <h1 style={styles.title}>신뢰 연락처</h1>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.content}>
          {/* 등록 폼 */}
          <section style={styles.formSection}>
            <h2 style={styles.sectionTitle}>새 연락처 등록</h2>
            <form onSubmit={handleAdd} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>이름 *</label>
                  <input
                    value={name}
                    required
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 홍길동"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>관계</label>
                  <input
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    placeholder="예: 가족, 친구, 동료"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>전화번호</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    style={styles.input}
                  />
                </div>
              </div>

              {error && <div style={styles.errorBox}>{error}</div>}

              <button type="submit" style={styles.submitButton}>
                연락처 등록
              </button>
            </form>
          </section>

          {/* 연락처 리스트 */}
          <section style={styles.listSection}>
            <div style={styles.listHeader}>
              <h2 style={styles.sectionTitle}>등록된 연락처</h2>
              <span style={styles.countBadge}>{contacts.length}명</span>
            </div>

            {loading && <p style={styles.loadingText}>불러오는 중...</p>}

            {!loading && contacts.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>👥</div>
                <p style={styles.emptyText}>등록된 신뢰 연락처가 없습니다.</p>
                <p style={styles.emptyDesc}>신뢰할 수 있는 분들의 연락처를 등록해보세요.</p>
              </div>
            )}

            {!loading && contacts.length > 0 && (
              <div style={styles.contactsGrid}>
                {contacts.map((c) => (
                  <div key={c.id} style={styles.contactCard}>
                    <div style={styles.contactHeader}>
                      <div style={styles.contactAvatar}>
                        {c.name.charAt(0)}
                      </div>
                      <div style={styles.contactInfo}>
                        <h3 style={styles.contactName}>{c.name}</h3>
                        {c.relation && (
                          <span style={styles.relationBadge}>{c.relation}</span>
                        )}
                      </div>
                    </div>
                    <div style={styles.contactDetails}>
                      {c.email && (
                        <div style={styles.contactDetail}>
                          <span style={styles.detailIcon}>📧</span>
                          <span style={styles.detailText}>{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div style={styles.contactDetail}>
                          <span style={styles.detailIcon}>📱</span>
                          <span style={styles.detailText}>{c.phone}</span>
                        </div>
                      )}
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
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: '24px',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
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
  contactsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  contactCard: {
    padding: '20px',
    background: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${theme.colors.border}`,
    transition: 'all 0.2s',
  },
  contactHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  contactAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: theme.colors.accent,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '600',
    flexShrink: 0,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: '16px',
    fontWeight: '600',
    color: theme.colors.text.primary,
    margin: '0 0 4px 0',
  },
  relationBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    background: theme.colors.secondary,
    color: 'white',
    borderRadius: theme.borderRadius.full,
    fontSize: '12px',
    fontWeight: '600',
  },
  contactDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  contactDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  detailIcon: {
    fontSize: '16px',
  },
  detailText: {
    fontSize: '14px',
    color: theme.colors.text.secondary,
  },
};