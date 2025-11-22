// src/pages/CreateAssetPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

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
      // ✅ 백엔드가 기대하는 camelCase 키로 보내기
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
    <div style={{ padding: 24 }}>
      <h2>디지털 자산 등록</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}
      >
        <div>
          <label>서비스명 *</label>
          <input
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label>카테고리</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label>로그인 ID</label>
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label>월 정액(원)</label>
          <input
            type="number"
            value={monthlyFee}
            onChange={(e) => setMonthlyFee(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label>메모</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            style={{ width: "100%", padding: 8, minHeight: 80 }}
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          type="submit"
          style={{
            padding: "10px 16px",
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
    </div>
  );
}
