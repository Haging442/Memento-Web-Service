// src/pages/AdminPage.jsx
import { useEffect, useState } from "react";
import {
  getAllUsers,
  getAllAssets,
  getAllContacts,
  getDeathReports,
  updateDeathReportStatus,
  getEmailLogs,
  getCapsuleReleases,
  getDeathReportsDetailed,
} from "../api/adminApi";

const TABS = {
  USERS: "USERS",
  ASSETS: "ASSETS",
  CONTACTS: "CONTACTS",
  DEATH_REPORTS: "DEATH_REPORTS",
  EMAIL_LOGS: "EMAIL_LOGS",
  CAPSULE_RELEASES: "CAPSULE_RELEASES",
  DEATH_REPORTS_DETAILED: "DEATH_REPORTS_DETAILED",
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(TABS.USERS);

  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deathReports, setDeathReports] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [capsuleReleases, setCapsuleReleases] = useState([]);
  const [deathReportsDetailed, setDeathReportsDetailed] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTabData = async () => {
    try {
      setLoading(true);
      setError("");

      switch (activeTab) {
        case TABS.USERS: {
          const res = await getAllUsers();
          setUsers(res.data);
          break;
        }
        case TABS.ASSETS: {
          const res = await getAllAssets();
          setAssets(res.data);
          break;
        }
        case TABS.CONTACTS: {
          const res = await getAllContacts();
          setContacts(res.data);
          break;
        }
        case TABS.DEATH_REPORTS: {
          const res = await getDeathReports();
          setDeathReports(res.data);
          break;
        }
        case TABS.EMAIL_LOGS: {
          const res = await getEmailLogs();
          setEmailLogs(res.data);
          break;
        }
        case TABS.CAPSULE_RELEASES: {
          const res = await getCapsuleReleases();
          setCapsuleReleases(res.data);
          break;
        }
        case TABS.DEATH_REPORTS_DETAILED: {
          const res = await getDeathReportsDetailed();
          setDeathReportsDetailed(res.data);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error(err);
      setError("데이터 로딩 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ---- 각 탭별 렌더링 함수 ----

  const renderUsers = () => (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>아이디</th>
          <th>이름</th>
          <th>권한</th>
          <th>가입일</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td>{u.id}</td>
            <td>{u.username}</td>
            <td>{u.name}</td>
            <td>{u.role}</td>
            <td>{u.created_at}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderAssets = () => (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>서비스명</th>
          <th>카테고리</th>
          <th>로그인 ID</th>
          <th>월 구독료</th>
          <th>등록일</th>
          <th>소유자(username)</th>
        </tr>
      </thead>
      <tbody>
        {assets.map((a) => (
          <tr key={a.id}>
            <td>{a.id}</td>
            <td>{a.service_name}</td>
            <td>{a.category}</td>
            <td>{a.login_id}</td>
            <td>{a.monthly_fee}</td>
            <td>{a.created_at}</td>
            <td>{a.owner_username}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderContacts = () => (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>이름</th>
          <th>관계</th>
          <th>이메일</th>
          <th>전화번호</th>
          <th>등록일</th>
          <th>소유자(username)</th>
        </tr>
      </thead>
      <tbody>
        {contacts.map((c) => (
          <tr key={c.id}>
            <td>{c.id}</td>
            <td>{c.name}</td>
            <td>{c.relation}</td>
            <td>{c.email}</td>
            <td>{c.phone}</td>
            <td>{c.created_at}</td>
            <td>{c.owner_username}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderDeathReports = () => {
    const handleChangeStatus = async (id, status) => {
      try {
        await updateDeathReportStatus(id, status);
        await loadTabData();
        alert("상태가 변경되었습니다.");
      } catch (err) {
        console.error(err);
        alert("상태 변경 중 오류가 발생했습니다.");
      }
    };

    return (
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>대상 유저 ID</th>
            <th>신고자 이름</th>
            <th>연락처</th>
            <th>관계</th>
            <th>메시지</th>
            <th>상태</th>
            <th>신고일</th>
            <th>조치</th>
          </tr>
        </thead>
        <tbody>
          {deathReports.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.target_user_id}</td>
              <td>{r.reporter_name}</td>
              <td>{r.reporter_contact}</td>
              <td>{r.relation}</td>
              <td>{r.message}</td>
              <td>{r.status}</td>
              <td>{r.created_at}</td>
              <td>
                <select
                  defaultValue={r.status}
                  onChange={(e) => handleChangeStatus(r.id, e.target.value)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="FINAL_CONFIRMED">FINAL_CONFIRMED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderEmailLogs = () => (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>유저 이름</th>
          <th>이메일 타입</th>
          <th>수신자 이메일</th>
          <th>제목</th>
          <th>상태</th>
          <th>에러 메시지</th>
          <th>발송 시각</th>
        </tr>
      </thead>
      <tbody>
        {emailLogs.map((log) => (
          <tr key={log.id}>
            <td>{log.id}</td>
            <td>{log.user_name}</td>
            <td>{log.email_type}</td>
            <td>{log.recipient_email}</td>
            <td>{log.subject}</td>
            <td>{log.status}</td>
            <td>{log.error_message}</td>
            <td>{log.sent_at}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCapsuleReleases = () => (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>유저 ID</th>
          <th>캡슐 ID</th>
          <th>공개 타입</th>
          <th>공개 시각</th>
          <th>이메일 발송 여부</th>
        </tr>
      </thead>
      <tbody>
        {capsuleReleases.map((c) => (
          <tr key={c.id}>
            <td>{c.id}</td>
            <td>{c.user_id}</td>
            <td>{c.capsule_id}</td>
            <td>{c.release_type}</td>
            <td>{c.released_at}</td>
            <td>{c.email_sent ? "예" : "아니오"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderDeathReportsDetailed = () => (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>대상 유저 이름</th>
          <th>상태</th>
          <th>신고 생성일</th>
          <th>해결일</th>
          <th>해결 후 경과시간(시간)</th>
        </tr>
      </thead>
      <tbody>
        {deathReportsDetailed.map((r) => (
          <tr key={r.id}>
            <td>{r.id}</td>
            <td>{r.target_user_name}</td>
            <td>{r.status}</td>
            <td>{r.created_at}</td>
            <td>{r.resolved_at}</td>
            <td>{r.hours_elapsed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderContent = () => {
    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    switch (activeTab) {
      case TABS.USERS:
        return renderUsers();
      case TABS.ASSETS:
        return renderAssets();
      case TABS.CONTACTS:
        return renderContacts();
      case TABS.DEATH_REPORTS:
        return renderDeathReports();
      case TABS.EMAIL_LOGS:
        return renderEmailLogs();
      case TABS.CAPSULE_RELEASES:
        return renderCapsuleReleases();
      case TABS.DEATH_REPORTS_DETAILED:
        return renderDeathReportsDetailed();
      default:
        return null;
    }
  };

  const tabButtonStyle = (tab) => ({
    marginRight: "8px",
    padding: "6px 12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    cursor: "pointer",
    backgroundColor: activeTab === tab ? "#333" : "#fff",
    color: activeTab === tab ? "#fff" : "#333",
  });

  return (
    <div style={{ padding: 20 }}>
      <h1>관리자 대시보드</h1>

      <div style={{ marginBottom: 16 }}>
        <button
          style={tabButtonStyle(TABS.USERS)}
          onClick={() => setActiveTab(TABS.USERS)}
        >
          전체 사용자
        </button>
        <button
          style={tabButtonStyle(TABS.ASSETS)}
          onClick={() => setActiveTab(TABS.ASSETS)}
        >
          전체 자산
        </button>
        <button
          style={tabButtonStyle(TABS.CONTACTS)}
          onClick={() => setActiveTab(TABS.CONTACTS)}
        >
          신뢰 연락처
        </button>
        <button
          style={tabButtonStyle(TABS.DEATH_REPORTS)}
          onClick={() => setActiveTab(TABS.DEATH_REPORTS)}
        >
          사망 의심 신고
        </button>
        <button
          style={tabButtonStyle(TABS.EMAIL_LOGS)}
          onClick={() => setActiveTab(TABS.EMAIL_LOGS)}
        >
          이메일 로그
        </button>
        <button
          style={tabButtonStyle(TABS.CAPSULE_RELEASES)}
          onClick={() => setActiveTab(TABS.CAPSULE_RELEASES)}
        >
          타임캡슐 공개 로그
        </button>
        <button
          style={tabButtonStyle(TABS.DEATH_REPORTS_DETAILED)}
          onClick={() => setActiveTab(TABS.DEATH_REPORTS_DETAILED)}
        >
          사망 신고 상세
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>{renderContent()}</div>
    </div>
  );
}
