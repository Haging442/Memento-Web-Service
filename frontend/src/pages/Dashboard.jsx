// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Dashboard() {
  const navigate = useNavigate();
 const role = localStorage.getItem("role");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  // 자산 목록 불러오기
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
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f4f5",
        color: "#000",
      }}
    >
      {/* 상단 바 */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: "#111827",
          color: "white",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20 }}>Memento 대시보드</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "none",
            background: "#f97316",
            color: "white",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          로그아웃
        </button>
      </header>

      {/* 메인 */}
      <main style={{ padding: "24px" }}>
        <section
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: "white",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>내 디지털 자산</h2>

          {/* ➕ 버튼 영역 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => navigate("/assets/create")}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                background: "#374151",
                color: "white",
                cursor: "pointer",
              }}
            >
              + 자산 등록하기
            </button>

            <button
              onClick={() => navigate("/contacts")}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
              }}
            >
              신뢰 연락처 관리
            </button>
  {/* ✅ 관리자일 때만 보이는 버튼 */}
  {role === "ADMIN" && (
    <button
      onClick={() => navigate("/admin")}
      style={{
        padding: "8px 12px",
        borderRadius: 6,
        border: "none",
        background: "#dc2626",
        color: "white",
        cursor: "pointer",
      }}
    >
      관리자 페이지
    </button>
  )}
              <button
    onClick={() => navigate("/time-capsules")}
    style={{
      padding: "8px 12px",
      borderRadius: 6,
      border: "none",
      background: "#16a34a",
      color: "white",
      cursor: "pointer",
    }}
  >
    타임캡슐 관리
      </button>
          </div>

          {loading && <p>불러오는 중...</p>}

          {error && (
            <p style={{ color: "red", fontSize: 14, marginBottom: 12 }}>{error}</p>
          )}

          {!loading && assets.length === 0 && (
            <p style={{ color: "#6b7280" }}>
              등록된 디지털 자산이 없습니다. 위의 버튼으로 자산을 등록해 보세요.
            </p>
          )}

          {!loading && assets.length > 0 && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>서비스명</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>카테고리</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>로그인 ID</th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>월 정액</th>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>메모</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                  >
                    <td style={{ padding: "8px 4px" }}>{asset.service_name}</td>
                    <td style={{ padding: "8px 4px" }}>{asset.category || "-"}</td>
                    <td style={{ padding: "8px 4px" }}>{asset.login_id || "-"}</td>
                    <td style={{ padding: "8px 4px", textAlign: "right" }}>
                      {asset.monthly_fee != null ? `${asset.monthly_fee}원` : "-"}
                    </td>
                    <td style={{ padding: "8px 4px" }}>{asset.memo || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
