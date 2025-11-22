// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/users/login", {
        username,
        password,
      });

      // 백엔드에서 보내준 토큰 저장
      localStorage.setItem("token", res.data.token);
      // 필요하면 role, username 같은 것도 저장 가능
      if (res.data.user?.role) {
      localStorage.setItem("role", res.data.user.role);
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "로그인에 실패했습니다. 아이디/비밀번호를 확인해주세요."
      );
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f4f5",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 320,
          padding: 24,
          borderRadius: 12,
          background: "white",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0, textAlign: "center" }}>Memento 로그인</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label>아이디</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </div>

        {error && (
          <div style={{ color: "red", fontSize: 14 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 6,
            border: "none",
            background: "#111827",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          로그인
        </button>
      </form>
    </div>
  );
}
