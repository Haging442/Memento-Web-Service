// src/pages/memorial/MemorialSpace.jsx 수정

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CleanTheme from './themes/CleanTheme';
import ElegantTheme from './themes/ElegantTheme';
import ModernTheme from './themes/ModernTheme';
import CustomTheme from './themes/CustomTheme';  // ✅ 추가

export default function MemorialSpace() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMemorialSpace();
  }, [userId]);

  const fetchMemorialSpace = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/memorial/space/${userId}`);
      
      if (!res.ok) {
        throw new Error('추모공간을 찾을 수 없습니다');
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <p style={{ fontSize: '18px', color: '#666' }}>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <p style={{ fontSize: '18px', color: '#DC2626' }}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const themeType = data.space.theme_type || 'clean';

  // ✅ custom_ 으로 시작하면 AI 생성 커스텀 테마
  if (themeType.startsWith('custom_')) {
    // DB에서 색상 정보 가져오기 (이미 data.space에 포함되어야 함)
    const customColors = data.space.custom_colors || {
      primary: '#F4F3EF',
      secondary: '#1C2740',
      accent: '#D8C27A',
      text: '#1F2937'
    };

    return <CustomTheme data={data} themeColors={customColors} />;
  }

  // 기본 테마들
  switch (themeType) {
    case 'elegant':
      return <ElegantTheme data={data} />;
    case 'modern':
      return <ModernTheme data={data} />;
    case 'clean':
    default:
      return <CleanTheme data={data} />;
  }
}