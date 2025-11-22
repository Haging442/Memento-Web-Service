// src/pages/ContactsPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 입력 폼
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState("");

  // 연락처 불러오기
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

  // 연락처 등록
  async function handleAdd(e) {
    e.preventDefault();
    setError("");

    try {
      await api.post("/contacts", {
        name,
        relation,
        email,
        phone,
      });

      // 등록 후 다시 조회
      const res = await api.get("/contacts");
      setContacts(res.data);

      // 입력 초기화
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
    <div style={{ padding: 24 }}>
      <h2>신뢰 연락처 설정</h2>

      {/* 등록 폼 */}
      <form
        onSubmit={handleAdd}
        style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}
      >
        <div>
          <label>이름 *</label>
          <input
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label>관계</label>
          <input
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label>이메일</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label>전화번호</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          type="submit"
          style={{
            padding: "10px",
            background: "#111827",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          등록하기
        </button>
      </form>

      <hr style={{ margin: "24px 0" }} />

      {/* 리스트 */}
      <h3>등록된 연락처</h3>
      {loading && <p>불러오는 중...</p>}

      {!loading && contacts.length === 0 && (
        <p style={{ color: "#6b7280" }}>등록된 신뢰 연락처가 없습니다.</p>
      )}

      {!loading && contacts.length > 0 && (
        <ul style={{ paddingLeft: 0 }}>
          {contacts.map((c) => (
            <li
              key={c.id}
              style={{
                listStyle: "none",
                padding: "8px 0",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <strong>{c.name}</strong> ({c.relation || "관계 없음"})
              <br />
              📧 {c.email || "-"}  
              <br />
              📱 {c.phone || "-"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
