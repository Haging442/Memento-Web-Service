// src/pages/login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';

export default function LoginPage() {
  const navigate = useNavigate();
  const API_BASE = 'http://localhost:4000';
  
  const [isRegistering, setIsRegistering] = useState(false);
  
  // 로그인 상태
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 회원가입 상태
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // 로그인
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: loginUsername, 
          password: loginPassword 
        })
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('role', result.user.role);
        localStorage.setItem('username', result.user.username);
        localStorage.setItem('name', result.user.name);
        
        // 관리자 계정이면 관리자 페이지로, 아니면 대시보드로
        if (result.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setLoginError(getErrorMessage(result.error));
      }
    } catch (error) {
      setLoginError('서버 연결에 실패했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  // 회원가입
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');

    try {
      const response = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          password: regPassword,
          name: regName,
          isAdmin: false
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        setIsRegistering(false);
        setRegUsername('');
        setRegPassword('');
        setRegName('');
      } else {
        setRegError(getErrorMessage(result.error));
      }
    } catch (error) {
      setRegError('서버 연결에 실패했습니다.');
    } finally {
      setRegLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    const messages = {
      'USERNAME_ALREADY_EXISTS': '이미 존재하는 아이디입니다.',
      'USERNAME_AND_PASSWORD_REQUIRED': '아이디와 비밀번호를 입력해주세요.',
      'USER_NOT_FOUND': '존재하지 않는 사용자입니다.',
      'INVALID_PASSWORD': '비밀번호가 일치하지 않습니다.'
    };
    return messages[error] || '오류가 발생했습니다.';
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.brandSection}>
          <div style={styles.logoIcon}>📖</div>
          <h1 style={styles.brandTitle}>Memento</h1>
          <p style={styles.brandSubtitle}>소중한 기억을 영원히</p>
        </div>
        
        <div style={styles.featureList}>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>💎</span>
            <div>
              <h3 style={styles.featureTitle}>디지털 자산 관리</h3>
              <p style={styles.featureDesc}>중요한 계정과 자산을 안전하게 보관하세요</p>
            </div>
          </div>
          
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>📦</span>
            <div>
              <h3 style={styles.featureTitle}>타임캡슐</h3>
              <p style={styles.featureDesc}>미래에 전할 소중한 메시지를 남겨보세요</p>
            </div>
          </div>
          
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>🤝</span>
            <div>
              <h3 style={styles.featureTitle}>신뢰할 수 있는 관리</h3>
              <p style={styles.featureDesc}>가족과 친구에게 안전하게 전달됩니다</p>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          {!isRegistering ? (
            // 로그인 폼
            <>
              <div style={styles.formHeader}>
                <h2 style={styles.formTitle}>로그인</h2>
                <p style={styles.formSubtitle}>계정에 로그인하세요</p>
              </div>

              <form onSubmit={handleLogin} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>아이디</label>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="아이디를 입력하세요"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>비밀번호</label>
                  <input
                    type="password"
                    style={styles.input}
                    placeholder="비밀번호를 입력하세요"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                {loginError && (
                  <div style={styles.errorMessage}>{loginError}</div>
                )}

                <button 
                  type="submit" 
                  style={styles.primaryButton}
                  disabled={loginLoading}
                >
                  {loginLoading ? '로그인 중...' : '로그인'}
                </button>

                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => setIsRegistering(true)}
                >
                  회원가입
                </button>
              </form>
            </>
          ) : (
            // 회원가입 폼
            <>
              <div style={styles.formHeader}>
                <h2 style={styles.formTitle}>회원가입</h2>
                <p style={styles.formSubtitle}>새 계정을 만드세요</p>
              </div>

              <form onSubmit={handleRegister} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>이름</label>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="이름을 입력하세요"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>아이디</label>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="아이디를 입력하세요"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>비밀번호</label>
                  <input
                    type="password"
                    style={styles.input}
                    placeholder="비밀번호를 입력하세요"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>

                {regError && (
                  <div style={styles.errorMessage}>{regError}</div>
                )}

                <button 
                  type="submit" 
                  style={styles.primaryButton}
                  disabled={regLoading}
                >
                  {regLoading ? '처리중...' : '회원가입'}
                </button>

                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => setIsRegistering(false)}
                >
                  로그인으로 돌아가기
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
  },
  leftPanel: {
    flex: 1,
    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    color: 'white',
  },
  brandSection: {
    marginBottom: '80px',
  },
  logoIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  brandTitle: {
    fontSize: '48px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    letterSpacing: '-0.5px',
  },
  brandSubtitle: {
    fontSize: '20px',
    opacity: 0.95,
    fontWeight: '400',
    margin: 0,
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    marginBottom: '40px',
  },
  featureItem: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: '32px',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  featureDesc: {
    fontSize: '15px',
    opacity: 0.9,
    margin: 0,
    lineHeight: 1.5,
  },
  rightPanel: {
    flex: 1,
    background: theme.colors.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  formContainer: {
    width: '100%',
    maxWidth: '420px',
    background: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: '48px',
    boxShadow: theme.shadows.lg,
  },
  formHeader: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  formTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: theme.colors.text.primary,
    margin: '0 0 8px 0',
  },
  formSubtitle: {
    fontSize: '15px',
    color: theme.colors.text.secondary,
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  input: {
    padding: '14px 16px',
    fontSize: '15px',
    border: `2px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    background: theme.colors.surface,
    color: theme.colors.text.primary,
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  primaryButton: {
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    background: theme.colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '8px',
  },
  secondaryButton: {
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'transparent',
    color: theme.colors.primary,
    border: `2px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  errorMessage: {
    padding: '12px 16px',
    background: '#FEE',
    color: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
    fontSize: '14px',
    border: `1px solid ${theme.colors.error}`,
  },
};