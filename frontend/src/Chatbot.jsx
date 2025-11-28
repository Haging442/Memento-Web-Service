import React, { useState } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    // 사용자 메시지 추가
    setMessages((prev) => [...prev, { role: "user", text: input }]);

    const res = await fetch("http://localhost:4000/api/chatbot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    // 챗봇 응답 추가
    setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);

    setInput("");
  };

  return (
    <div style={{ width: "500px", margin: "0 auto", padding: "20px" }}>
      <h2>AI 유언장 작성 비서</h2>

      <div style={{
        border: "1px solid #ccc",
        height: "400px",
        overflowY: "scroll",
        padding: "10px",
        marginBottom: "10px"
      }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              textAlign: m.role === "user" ? "right" : "left",
              marginBottom: "8px"
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "10px",
                borderRadius: "8px",
                background: m.role === "user" ? "#d1e7ff" : "#f2f2f2"
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "80%", padding: "10px" }}
        placeholder="메시지를 입력하세요..."
      />
      <button onClick={sendMessage} style={{ padding: "10px 15px" }}>
        전송
      </button>
    </div>
  );
}
