// src/pages/AdminPage.jsx
import { useEffect, useState } from "react";
import api from "../api/client";

export default function AdminPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/admin/death-reports");
        setReports(res.data);
      } catch (err) {
        console.error(err);
        setError("신고 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>관리자 - 사망 의심 신고 리스트</h2>

      {loading && <p>불러오는 중...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && reports.length === 0 && <p>신고가 없습니다.</p>}

      {!loading && reports.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 16,
          }}
        >
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ padding: 8, textAlign: "left" }}>ID</th>
              <th style={{ padding: 8, textAlign: "left" }}>대상 사용자</th>
              <th style={{ padding: 8, textAlign: "left" }}>상태</th>
              <th style={{ padding: 8, textAlign: "left" }}>생성일</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: 8 }}>{r.id}</td>
                <td style={{ padding: 8 }}>{r.target_user_id}</td>
                <td style={{ padding: 8 }}>{r.status}</td>
                <td style={{ padding: 8 }}>{r.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
