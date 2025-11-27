// src/pages/memorial/settings.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function MemorialSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    is_enabled: false,
    profile_image: '',
    display_name: '',
    birth_date: '',
    theme_type: '' 
  });
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  
  // ✨ AI 바이브 관련 state
  const [vibeInput, setVibeInput] = useState('');
  const [vibeLoading, setVibeLoading] = useState(false);
  const [vibeError, setVibeError] = useState('');
  
  const MAX_PHOTOS = 100;

  useEffect(() => {
    fetchSettings();
    fetchPhotos();
    fetchThemes();
  }, []);

  useEffect(() => {
    if (themes.length > 0 && settings.theme_type) {
      const theme = themes.find(t => t.id === settings.theme_type);
      if (theme) {
        setSelectedTheme(theme);
      }
    }
  }, [themes, settings.theme_type]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/memorial/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/memorial/photos', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setExistingPhotos(data.photos || []);
    } catch (error) {
      console.error('사진 목록 로드 실패:', error);
    }
  };

  const fetchThemes = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/memorial/themes', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setThemes(data.themes);
    } catch (error) {
      console.error('테마 로드 실패:', error);
    }
  };

  // ✨ AI 바이브로 테마 생성
  const generateVibeTheme = async () => {
    if (!vibeInput.trim()) {
      alert('원하는 분위기를 입력해주세요!');
      return;
    }

    setVibeLoading(true);
    setVibeError('');

    try {
      // 1단계: AI로 테마 생성
      const res = await api.post('/api/gemini/generate-vibe-theme', {
        vibeDescription: vibeInput
      });

      const { theme, css } = res.data;

      // 2단계: 생성된 테마를 DB에 저장
      const saveRes = await api.post('/api/gemini/save-custom-theme', {
        themeName: theme.themeName,
        colorPalette: theme.colorPalette,
        fontStyle: theme.fontStyle,
        cssKeywords: theme.cssKeywords,
        css: css
      });

      const savedThemeId = saveRes.data.themeId;

      // 3단계: 저장된 테마를 themes 배열에 추가
      const newTheme = {
        id: savedThemeId,
        name: theme.themeName,
        description: 'AI가 생성한 맞춤 테마',
        colors: {
          primary: theme.colorPalette[0],
          secondary: theme.colorPalette[1],
          accent: theme.colorPalette[2],
          text: '#111827'
        },
        fonts: {
          body: theme.fontStyle
        },
        isCustom: true,
        css: css
      };

      setThemes(prev => [...prev, newTheme]);
      handleThemeSelect(newTheme);
      
      alert(`"${theme.themeName}" 테마가 생성되고 저장되었습니다!`);
      setVibeInput('');

    } catch (error) {
      console.error('❌ 바이브 테마 생성 실패:', error);
      setVibeError(error.response?.data?.error || error.response?.data?.message || '테마 생성에 실패했습니다.');
    } finally {
      setVibeLoading(false);
    }
  };

  // ✨ 커스텀 테마 삭제 함수
  const deleteCustomTheme = async (themeId) => {
    if (!confirm('이 테마를 삭제하시겠습니까?')) return;

    try {
      const res = await api.delete(`/api/gemini/delete-custom-theme/${themeId}`);
      
      if (res.data.success) {
        // themes 배열에서 제거
        setThemes(prev => prev.filter(t => t.id !== themeId));
        
        // 만약 삭제한 테마가 현재 선택된 테마였다면 기본 테마로 변경
        if (settings.theme_type === themeId) {
          setSettings(prev => ({
            ...prev,
            theme_type: 'clean'
          }));
          setSelectedTheme(null);
        }
        
        alert('테마가 삭제되었습니다.');
      }
    } catch (error) {
      console.error('❌ 테마 삭제 실패:', error);
      alert('테마 삭제에 실패했습니다.');
    }
  };

  const handleFiles = (fileList) => {
    const filesArray = Array.from(fileList);
    const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
    
    const totalPhotos = photos.length + existingPhotos.length + imageFiles.length;
    if (totalPhotos > MAX_PHOTOS) {
      alert(`최대 ${MAX_PHOTOS}개까지만 업로드 가능합니다.`);
      return;
    }

    const newPhotos = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e) => {
    handleFiles(e.target.files);
  };

  const removePhoto = (id) => {
    setPhotos(prev => {
      const updated = prev.filter(photo => photo.id !== id);
      const removed = prev.find(photo => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return updated;
    });
  };

  const deleteExistingPhoto = async (photoId) => {
    if (!confirm('이 사진을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`http://localhost:4000/api/memorial/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
        alert('사진이 삭제되었습니다');
      } else {
        alert('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다');
    }
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) return true;

    setUploadProgress(true);

    const formData = new FormData();
    photos.forEach(photo => {
      formData.append('photos', photo.file);
    });

    try {
      const res = await fetch('http://localhost:4000/api/memorial/photos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (res.ok) {
        photos.forEach(photo => URL.revokeObjectURL(photo.preview));
        setPhotos([]);
        await fetchPhotos();
        return true;
      } else {
        const error = await res.json();
        alert(error.error || '업로드 실패');
        return false;
      }
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('사진 업로드에 실패했습니다');
      return false;
    } finally {
      setUploadProgress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/memorial/settings/consent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (!res.ok) {
        alert('설정 저장 실패');
        return;
      }

      const uploadSuccess = await uploadPhotos();

      if (uploadSuccess) {
        alert('설정이 저장되었습니다!');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSelect = (theme) => {
    setSettings(prev => ({
      ...prev,
      theme_type: theme.id
    }));
    setSelectedTheme(theme);
  };

  const totalPhotosCount = photos.length + existingPhotos.length;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* 헤더 */}
        <div style={styles.header}>
          <h1 style={styles.title}>추모 공간 설정</h1>
          <p style={styles.subtitle}>생전에 나만의 추모 공간을 미리 준비할 수 있습니다</p>
        </div>
      
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* 동의 체크박스 */}
          <div style={styles.consentCard}>
            <label style={styles.consentLabel}>
              <input
                type="checkbox"
                checked={settings.is_enabled}
                onChange={(e) => setSettings({...settings, is_enabled: e.target.checked})}
                style={styles.checkbox}
              />
              <div>
                <p style={styles.consentTitle}>추모 공간 생성에 동의합니다</p>
                <p style={styles.consentDesc}>
                  사망 후 신뢰인이 이 설정을 바탕으로 추모 공간을 공개할 수 있도록 허용합니다.
                </p>
              </div>
            </label>
          </div>

          {settings.is_enabled && (
            <>
              {/* 기본 정보 */}
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>기본 정보</h2>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>프로필 사진 URL</label>
                  <input
                    type="text"
                    value={settings.profile_image}
                    onChange={(e) => setSettings({...settings, profile_image: e.target.value})}
                    placeholder="https://..."
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>추모 공간에 표시될 이름</label>
                  <input
                    type="text"
                    value={settings.display_name}
                    onChange={(e) => setSettings({...settings, display_name: e.target.value})}
                    placeholder="홍길동"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>생년월일</label>
                  <input
                    type="date"
                    value={settings.birth_date}
                    onChange={(e) => setSettings({...settings, birth_date: e.target.value})}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* 테마 선택 */}
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>추모 공간 테마</h2>
                <p style={styles.cardDesc}>추모 공간의 분위기를 선택해주세요</p>

                <div style={styles.themeGrid}>
                  {themes.map(theme => (
                    <div
                      key={theme.id}
                      style={{
                        ...styles.themeCard,
                        ...(settings.theme_type === theme.id && styles.themeCardSelected)
                      }}
                    >
                      {/* ✅ 선택된 커스텀 테마일 때만 삭제 버튼 표시 */}
{theme.isCustom && settings.theme_type === theme.id && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      deleteCustomTheme(theme.id);
    }}
    style={styles.deleteButton}
    title="테마 삭제"
  >
    ✕
  </button>
)}


                      <div 
                        onClick={() => handleThemeSelect(theme)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{
                          ...styles.themePreview,
                          background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)`
                        }}></div>
                        
                        <div style={styles.themeInfo}>
                          <p style={{ ...styles.themeName, color: theme.colors.text }}>
                            {theme.name}
                            {theme.isCustom && (
                              <span style={styles.customBadge}>✨ AI 생성</span>
                            )}
                          </p>
                          <p style={{ ...styles.themeDesc, color: theme.colors.text }}>
                            {theme.description}
                          </p>
                        </div>

                        {settings.theme_type === theme.id && (
                          <div style={{
                            ...styles.themeCheck,
                            background: theme.colors.accent
                          }}>
                            ✓ 선택됨
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ✨ AI 바이브 입력 영역 */}
                <div style={styles.vibeSection}>
                  <div style={styles.vibeDivider}></div>
                  
                  <p style={styles.vibePrompt}>
                    💡 원하는 테마가 없나요? AI에게 원하는 분위기를 말씀해주세요.<br />
                    색을 말씀해주시면 더 좋습니다.
                  </p>

                  <textarea
                    value={vibeInput}
                    onChange={(e) => setVibeInput(e.target.value)}
                    placeholder="예시:
- 따뜻하고 평화로운 봄날의 느낌
- 진한 파란색과 은은한 회색의 깔끔한 분위기"
                    style={styles.vibeTextarea}
                  />

                  {vibeError && (
                    <div style={styles.vibeError}>
                      ⚠️ {vibeError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={generateVibeTheme}
                    disabled={vibeLoading || !vibeInput.trim()}
                    style={{
                      ...styles.vibeButton,
                      ...(vibeLoading || !vibeInput.trim()) && styles.vibeButtonDisabled
                    }}
                  >
                    {vibeLoading ? '🔄 AI가 테마 생성 중...' : '✨ AI 테마 지정하기'}
                  </button>
                </div>
              </div>

              {/* 사진 업로드 */}
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>추모 사진</h2>
                <p style={styles.cardDesc}>
                  현재 {totalPhotosCount}개 / {MAX_PHOTOS}개
                  {photos.length > 0 && ` (업로드 대기: ${photos.length}개)`}
                </p>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    ...styles.uploadBox,
                    ...(isDragging && styles.uploadBoxDragging)
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={styles.fileInput}
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" style={styles.uploadLabel}>
                    <div style={styles.uploadIcon}>📸</div>
                    <p style={styles.uploadText}>클릭하거나 드래그해서 사진 업로드</p>
                    <p style={styles.uploadHint}>JPG, PNG 등 이미지 파일 (최대 10MB)</p>
                  </label>
                </div>

                {existingPhotos.length > 0 && (
                  <div style={styles.photoSection}>
                    <h3 style={styles.photoSectionTitle}>업로드된 사진들</h3>
                    <div style={styles.photoGrid}>
                      {existingPhotos.map(photo => (
                        <div key={photo.id} style={styles.photoItem}>
                          <img
                            src={`http://localhost:4000${photo.image_url}`}
                            alt="추모 사진"
                            style={styles.photoImg}
                          />
                          <button
                            type="button"
                            onClick={() => deleteExistingPhoto(photo.id)}
                            style={styles.photoDelete}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {photos.length > 0 && (
                  <div style={styles.photoSection}>
                    <h3 style={{ ...styles.photoSectionTitle, color: '#F59E0B' }}>
                      업로드 대기 중 ({photos.length}개)
                    </h3>
                    <div style={styles.photoGrid}>
                      {photos.map(photo => (
                        <div key={photo.id} style={styles.photoItem}>
                          <img
                            src={photo.preview}
                            alt="미리보기"
                            style={{ ...styles.photoImg, border: '3px solid #F59E0B', opacity: 0.8 }}
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            style={styles.photoDelete}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 저장 버튼 */}
          <button
            type="submit"
            disabled={loading || uploadProgress}
            style={{
              ...styles.submitButton,
              ...(loading || uploadProgress) && styles.submitButtonDisabled
            }}
          >
            {uploadProgress ? '사진 업로드 중...' : loading ? '저장 중...' : '설정 저장'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#F9FAFB',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#6B7280',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  consentCard: {
    background: '#FFFFFF',
    padding: '24px',
    borderRadius: '12px',
    border: '2px solid #8B7355',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  consentLabel: {
    display: 'flex',
    gap: '16px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    marginTop: '2px',
  },
  consentTitle: {
    fontWeight: '700',
    fontSize: '17px',
    color: '#111827',
    marginBottom: '8px',
  },
  consentDesc: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
    lineHeight: 1.6,
  },
  card: {
    background: '#FFFFFF',
    padding: '32px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
    letterSpacing: '-0.3px',
  },
  cardDesc: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '24px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #E5E7EB',
    borderRadius: '8px',
    background: '#FFFFFF',
    color: '#111827',
    transition: 'all 0.2s',
    outline: 'none',
    fontFamily: 'inherit',
  },
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  themeCard: {
    position: 'relative',  // ✅ 삭제 버튼 위치를 위해 추가
    padding: '20px',
    borderRadius: '12px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#E5E7EB',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#FFFFFF',
  },
  themeCardSelected: {
    borderColor: '#8B7355',
    boxShadow: '0 4px 12px rgba(139, 115, 85, 0.2)',
  },
  deleteButton: {
  position: 'absolute',
  top: '8px',
  right: '8px',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: 'none',
  background: '#8B7355',
  color: '#FFFFFF',
  fontSize: '18px',
  fontWeight: '700',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  zIndex: 10,
  flexShrink: 0,
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
},


deleteButtonHover: {
  transform: 'scale(1.15)',
  background: '#7C6548',
},


  themePreview: {
    width: '100%',
    height: '80px',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  themeInfo: {
    marginBottom: '8px',
  },
  themeName: {
    fontWeight: '700',
    fontSize: '16px',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  customBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: 'white',
    borderRadius: '12px',
    fontWeight: '600',
  },
  themeDesc: {
    fontSize: '13px',
    opacity: 0.7,
    lineHeight: 1.4,
  },
  themeCheck: {
    marginTop: '12px',
    padding: '6px 12px',
    color: '#FFFFFF',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center',
  },
  vibeSection: {
    marginTop: '32px',
  },
  vibeDivider: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, #E5E7EB, transparent)',
    marginBottom: '24px',
  },
  vibePrompt: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
    textAlign: 'center',
  },
  vibeTextarea: {
    width: '100%',
    minHeight: '100px',
    padding: '16px',
    fontSize: '14px',
    border: '2px solid #E5E7EB',
    borderRadius: '8px',
    background: '#FFFFFF',
    color: '#111827',
    fontFamily: 'inherit',
    resize: 'vertical',
    lineHeight: 1.6,
    marginBottom: '12px',
    outline: 'none',
    transition: 'all 0.2s',
  },
  vibeError: {
    padding: '12px 16px',
    background: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '12px',
  },
  vibeButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #8B7355, #6B5B45)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  vibeButtonDisabled: {
    background: '#9CA3AF',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  uploadBox: {
    border: '2px dashed #D1D5DB',
    borderRadius: '12px',
    padding: '48px 32px',
    textAlign: 'center',
    background: '#F9FAFB',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '24px',
  },
  uploadBoxDragging: {
    borderColor: '#8B7355',
    background: '#F5F3F0',
  },
  fileInput: {
    display: 'none',
  },
  uploadLabel: {
    cursor: 'pointer',
  },
  uploadIcon: {
    fontSize: '56px',
    marginBottom: '16px',
  },
  uploadText: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px',
  },
  uploadHint: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },
  photoSection: {
    marginTop: '24px',
  },
  photoSectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '12px',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '16px',
  },
  photoItem: {
    position: 'relative',
    paddingTop: '100%',
  },
  photoImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '12px',
    border: '2px solid #E5E7EB',
  },
  photoDelete: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  submitButton: {
    width: '100%',
    background: '#8B7355',
    color: 'white',
    padding: '16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submitButtonDisabled: {
    background: '#9CA3AF',
    cursor: 'not-allowed',
  },
};