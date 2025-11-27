// src/styles/theme.js
export const theme = {
  colors: {
    primary: '#8B7355',      // 따뜻한 브라운
    secondary: '#C9A882',    // 베이지 골드
    accent: '#D4A574',       // 부드러운 골드
    background: '#FAF8F5',   // 크림 화이트
    surface: '#FFFFFF',      // 순백
    text: {
      primary: '#3E3530',    // 다크 브라운
      secondary: '#6B5D52',  // 미디엄 브라운
      light: '#9B8B7E',      // 라이트 브라운
    },
    border: '#E8DFD6',       // 연한 베이지
    success: '#7FA66B',      // 부드러운 그린
    error: '#C17767',        // 부드러운 레드
    warning: '#D4A574',      // 따뜻한 오렌지
  },
  shadows: {
    sm: '0 2px 8px rgba(139, 115, 85, 0.08)',
    md: '0 4px 16px rgba(139, 115, 85, 0.12)',
    lg: '0 8px 32px rgba(139, 115, 85, 0.16)',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
  }
};