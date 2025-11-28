// src/pages/AIChatPage.jsx
import { useState } from 'react';
import api from '../api/client';

export default function AIChatPage() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // 사용자 메시지 추가
    const userMessage = { role: 'user', content: message };
    setChatHistory([...chatHistory, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/api/gemini/chat', { message });
      
      // AI 응답 추가
      const aiMessage = { role: 'ai', content: response.data.response };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI 응답 오류:', error);
      const errorMessage = { 
        role: 'ai', 
        content: '죄송합니다. 응답 생성에 실패했습니다.' 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🤖 Memento AI 어시스턴트</h1>
      
      {/* 채팅 히스토리 */}
      <div style={styles.chatContainer}>
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              ...(msg.role === 'user' ? styles.userMessage : styles.aiMessage)
            }}
          >
            <strong>{msg.role === 'user' ? '나' : 'AI'}:</strong> {msg.content}
          </div>
        ))}
        {loading && (
          <div style={styles.loading}>AI가 답변을 생성하고 있습니다...</div>
        )}
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSendMessage} style={styles.form}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          style={styles.input}
          disabled={loading}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          전송
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#333',
  },
  chatContainer: {
    height: '500px',
    overflowY: 'auto',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    background: '#f9f9f9',
  },
  message: {
    marginBottom: '15px',
    padding: '10px',
    borderRadius: '8px',
  },
  userMessage: {
    background: '#667eea',
    color: 'white',
    marginLeft: 'auto',
    maxWidth: '70%',
  },
  aiMessage: {
    background: 'white',
    border: '1px solid #e0e0e0',
    maxWidth: '70%',
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  form: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
  },
  button: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};