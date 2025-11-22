// src/pages/TimeCapsulesPage.jsx
import { useEffect, useState } from "react";
import api from "../api/client";

export default function TimeCapsulesPage() {
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 폼 상태
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [releaseType, setReleaseType] = useState("IMMEDIATE");
  const [releaseDate, setReleaseDate] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");

  // 리스트 불러오기
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

  // 새 타임캡슐 등록
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      await api.post("/time-capsules", {
        // ✅ 백엔드 컨트롤러에서 기대하는 이름 (camelCase)
        title,
        message,
        releaseType,
        releaseDate: releaseType === "ON_DATE" ? releaseDate : null,
        recipientName,
        recipientContact,
      });

      // 리스트 새로고침
      await fetchCapsules();

      // 폼 초기화
      setTitle("");
      setMessage("");
      setReleaseType("IMMEDIATE");
      setReleaseDate("");
      setRecipientName("");
      setRecipientContact("");
    } catch (err) {
      console.error(err);
      setError("타임캡슐 저장 중 오류가 발생했습니다.");
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>타임캡슐 관리</h2>

      {/* 작성 폼 */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 500,
          marginBottom: 24,
        }}
      >
        <div>
          <label>제목 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label>내용 / 메시지</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: "100%", padding: 8, minHeight: 80 }}
          />
        </div>

        <div>
          <label>공개 방식 *</label>
          <select
            value={releaseType}
            onChange={(e) => setReleaseType(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="IMMEDIATE">즉시 공개(IMMEDIATE)</option>
            <option value="ON_DEATH">사망 확정 시 공개(ON_DEATH)</option>
            <option value="ON_DATE">특정 날짜에 공개(ON_DATE)</option>
          </select>
        </div>

        {releaseType === "ON_DATE" && (
          <div>
            <label>공개 날짜 (ISO 형식)</label>
            <input
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              placeholder="예: 2025-12-31T00:00:00.000Z"
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        )}

        <div>
          <label>받는 사람 이름</label>
          <input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label>받는 사람 연락처 (이메일/전화)</label>
          <input
            value={recipientContact}
            onChange={(e) => setRecipientContact(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          type="submit"
          style={{
            padding: "10px 16px",
            background: "#111827",
            color: "white",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          타임캡슐 저장
        </button>
      </form>

      <hr style={{ margin: "24px 0" }} />

      {/* 리스트 영역 */}
      <h3>내 타임캡슐 목록</h3>

      {loading && <p>불러오는 중...</p>}

      {!loading && capsules.length === 0 && (
        <p style={{ color: "#6b7280" }}>작성된 타임캡슐이 없습니다.</p>
      )}

      {!loading && capsules.length > 0 && (
        <ul style={{ paddingLeft: 0 }}>
          {capsules.map((c) => (
            <li
              key={c.id}
              style={{
                listStyle: "none",
                padding: "12px 0",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{c.title}</strong>{" "}
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    ({c.release_type})
                  </span>
                  <br />
                  <span style={{ fontSize: 13, color: "#4b5563" }}>
                    대상: {c.recipient_name || "-"} / {c.recipient_contact || "-"}
                  </span>
                </div>
                <div style={{ textAlign: "right", fontSize: 12 }}>
                  <div>작성: {c.created_at}</div>
                  <div>
                    상태:{" "}
                    {c.is_released ? "공개됨" : "아직 비공개"}
                  </div>
                  {c.released_at && <div>공개일: {c.released_at}</div>}
                </div>
              </div>

              {c.message && (
                <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                  {c.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
