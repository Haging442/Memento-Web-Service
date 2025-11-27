import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { theme } from '../styles/theme';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reports"); // 'reports', 'emails', 'capsules'
  const [reports, setReports] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [capsuleReleases, setCapsuleReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");
      
      if (activeTab === "reports") {
        const res = await api.get("/admin/death-reports-detailed");
        setReports(res.data);
      } else if (activeTab === "emails") {
        const res = await api.get("/admin/email-logs");
        setEmailLogs(res.data);
      } else if (activeTab === "capsules") {
        const res = await api.get("/admin/capsule-releases");
        setCapsuleReleases(res.data);
      }
    } catch (err) {
      console.error(err);
      setError("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const getStatusStyle = (status) => {
    const styles = {
      'PENDING': { bg: '#FFF4E6', color: '#C77A30' },
      'CONFIRMED': { bg: '#E6F4FF', color: '#1677FF' },
      'REJECTED': { bg: '#FFE6E6', color: '#CF1322' },
      'CANCELED': { bg: '#F0F0F0', color: '#8C8C8C' },
      'FINAL_CONFIRMED': { bg: '#F0F9FF', color: '#0369A1' },
      'SUCCESS': { bg: '#E6F9F0', color: '#0F9D58' },
      'FAILED': { bg: '#FFE6E6', color: '#CF1322' },
    };
    return styles[status] || styles['PENDING'];
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate("/dashboard")} style={styles.backButton}>
            ← 돌아가기
          </button>
          <div style={styles.headerTitle}>
            <span style={styles.headerIcon}>🔐</span>
            <h1 style={styles.title}>관리자 페이지</h1>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.content}>
          {/* 탭 메뉴 */}
          <div style={styles.tabContainer}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === "reports" ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab("reports")}
            >
              📋 사망 신고
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === "emails" ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab("emails")}
            >
              📧 이메일 발송 기록
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === "capsules" ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab("capsules")}
            >
              ⏰ 타임캡슐 공개 기록
            </button>
          </div>

          {loading && <p style={styles.loadingText}>불러오는 중...</p>}
          {error && <div style={styles.errorBox}>{error}</div>}

          {/* 사망 신고 탭 */}
          {!loading && activeTab === "reports" && (
            <div>
              <div style={styles.pageHeader}>
                <h2 style={styles.pageTitle}>사망 의심 신고 관리</h2>
                <p style={styles.pageDesc}>접수된 신고를 검토하고 처리하세요</p>
              </div>

              {reports.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📋</div>
                  <p style={styles.emptyText}>현재 접수된 신고가 없습니다.</p>
                </div>
              ) : (
                <div style={styles.reportsContainer}>
                  {reports.map((r) => (
                    <div key={r.id} style={styles.reportCard}>
                      <div style={styles.reportHeader}>
                        <div style={styles.reportId}>신고 #{r.id}</div>
                        <div style={{
                          ...styles.statusBadge,
                          background: getStatusStyle(r.status).bg,
                          color: getStatusStyle(r.status).color,
                        }}>
                          {r.status}
                          {r.status === 'CONFIRMED' && r.hours_elapsed !== null && (
                            <span style={styles.elapsedTime}> ({r.hours_elapsed}시간 경과)</span>
                          )}
                        </div>
                      </div>

                      <div style={styles.reportBody}>
                        <div style={styles.reportRow}>
                          <span style={styles.reportLabel}>대상 사용자:</span>
                          <span style={styles.reportValue}>
                            {r.target_user_name || `ID ${r.target_user_id}`}
                          </span>
                        </div>
                        <div style={styles.reportRow}>
                          <span style={styles.reportLabel}>신고자:</span>
                          <span style={styles.reportValue}>{r.reporter_name || '-'}</span>
                        </div>
                        <div style={styles.reportRow}>
                          <span style={styles.reportLabel}>관계:</span>
                          <span style={styles.reportValue}>{r.relation || '-'}</span>
                        </div>
                        {r.message && (
                          <div style={styles.messageBox}>
                            <div style={styles.messageLabel}>신고 내용:</div>
                            <div style={styles.messageText}>{r.message}</div>
                          </div>
                        )}
                      </div>

                      <div style={styles.reportFooter}>
                        <div style={styles.reportDate}>
                          접수: {new Date(r.created_at).toLocaleString('ko-KR')}
                        </div>
                        {r.resolved_at && (
                          <div style={styles.reportDate}>
                            처리: {new Date(r.resolved_at).toLocaleString('ko-KR')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 이메일 로그 탭 */}
          {!loading && activeTab === "emails" && (
            <div>
              <div style={styles.pageHeader}>
                <h2 style={styles.pageTitle}>이메일 발송 기록</h2>
                <p style={styles.pageDesc}>시스템에서 발송한 이메일 내역</p>
              </div>

              {emailLogs.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📧</div>
                  <p style={styles.emptyText}>발송된 이메일이 없습니다.</p>
                </div>
              ) : (
                <div style={styles.logsContainer}>
                  {emailLogs.map((log) => (
                    <div key={log.id} style={styles.logCard}>
                      <div style={styles.logHeader}>
                        <div style={styles.logType}>
                          {log.email_type === 'WILL' ? '📄 유언장' : '⏰ 타임캡슐'}
                        </div>
                        <div style={{
                          ...styles.statusBadge,
                          background: getStatusStyle(log.status).bg,
                          color: getStatusStyle(log.status).color,
                        }}>
                          {log.status}
                        </div>
                      </div>
                      <div style={styles.logBody}>
                        <div style={styles.reportRow}>
                          <span style={styles.reportLabel}>수신자:</span>
                          <span style={styles.reportValue}>{log.recipient_email}</span>
                        </div>
                        <div style={styles.reportRow}>
                          <span style={styles.reportLabel}>사용자:</span>
                          <span style={styles.reportValue}>{log.user_name || '-'}</span>
                        </div>
                        <div style={styles.reportRow}>
                          <span style={styles.reportLabel}>제목:</span>
                          <span style={styles.reportValue}>{log.subject}</span>
                        </div>
                        {log.error_message && (
                          <div style={styles.errorMessage}>
                            ⚠️ {log.error_message}
                          </div>
                        )}
                      </div>
                      <div style={styles.logFooter}>
                        {new Date(log.sent_at).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 타임캡슐 공개 기록 탭 */}
          {!loading && activeTab === "capsules" && (
            <div>
              <div style={styles.pageHeader}>
                <h2 style={styles.pageTitle}>타임캡슐 공개 기록</h2>
                <p style={styles.pageDesc}>자동으로 공개된 타임캡슐 내역</p>
              </div>

              {capsuleReleases.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>⏰</div>
                  <p style={styles.emptyText}>공개된 타임캡슐이 없습니다.</p>
                </div>
              ) : (
                <div style={styles.logsContainer}>
                  {capsuleReleases.map((release) => (
                    <div key={release.id} style={styles.logCard}>
                      <div style={styles.logHeader}>
                        <div style={styles.logType}>
                          ⏰ {release.capsule_title || '제목 없음'}
                        </div>
                        <div style={styles.releaseTypeBadge}>
                          {release.release_type}
                        </div>
                      </div>
                      <div style={styles.logBody}>
                        <div style={styles.reportRow}>
                          <span style={styles.reportLabel}>사용자:</span>
                          <span style={styles.reportValue}>{release.user_name}</span>
                        </div>
                        <div style={styles.reportRow}>
                          <span style={styles.reportLabel}>이메일 발송:</span>
                          <span style={styles.reportValue}>
                            {release.email_sent ? '✅ 발송됨' : '❌ 미발송'}
                          </span>
                        </div>
                      </div>
                      <div style={styles.logFooter}>
                        공개: {new Date(release.released_at).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
    background: theme.colors.surface,
    padding: '32px',
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '32px',
    borderBottom: `2px solid ${theme.colors.border}`,
  },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    color: theme.colors.text.secondary,
    transition: 'all 0.2s',
  },
  tabActive: {
    color: theme.colors.primary,
    borderBottomColor: theme.colors.primary,
  },
  pageHeader: {
    marginBottom: '32px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: theme.colors.text.primary,
    margin: '0 0 8px 0',
  },
  pageDesc: {
    fontSize: '14px',
    color: theme.colors.text.secondary,
    margin: 0,
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
  },
  reportsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  logsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  reportCard: {
    padding: '24px',
    background: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  logCard: {
    padding: '20px',
    background: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  reportId: {
    fontSize: '16px',
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  logType: {
    fontSize: '15px',
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  statusBadge: {
    padding: '6px 16px',
    borderRadius: theme.borderRadius.full,
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  releaseTypeBadge: {
    padding: '6px 16px',
    borderRadius: theme.borderRadius.full,
    fontSize: '12px',
    fontWeight: '600',
    background: '#F0F9FF',
    color: '#0369A1',
  },
  elapsedTime: {
    fontSize: '11px',
    opacity: 0.8,
  },
  reportBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  logBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '12px',
  },
  reportRow: {
    display: 'flex',
    gap: '12px',
  },
  reportLabel: {
    fontSize: '14px',
    color: theme.colors.text.secondary,
    fontWeight: '600',
    minWidth: '140px',
  },
  reportValue: {
    fontSize: '14px',
    color: theme.colors.text.primary,
  },
  messageBox: {
    marginTop: '8px',
    padding: '16px',
    background: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${theme.colors.border}`,
  },
  messageLabel: {
    fontSize: '13px',
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: '8px',
  },
  messageText: {
    fontSize: '14px',
    color: theme.colors.text.primary,
    lineHeight: 1.6,
  },
  errorMessage: {
    padding: '12px',
    background: '#FEE',
    color: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
    fontSize: '13px',
    marginTop: '8px',
  },
  reportFooter: {
    paddingTop: '16px',
    borderTop: `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  logFooter: {
    paddingTop: '12px',
    borderTop: `1px solid ${theme.colors.border}`,
    fontSize: '13px',
    color: theme.colors.text.light,
  },
  reportDate: {
    fontSize: '13px',
    color: theme.colors.text.light,
  },
};