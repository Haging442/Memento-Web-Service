//src/pages/memorial/themes/CuteTheme.jsx 귀여운

export default function CuteTheme({ data }) {
  const { space, photos, guestbook } = data;

  const colors = {
  primary: '#FFF5F7',      // 화이트 + 핑크
  secondary: '#FFE4EE',    // 파스텔 연핑크
  accent: '#FF9DBD',       // 진한 파스텔 핑크 포인트
  text: '#5D5D5D',
  border: '#FFC7D9'        // 핑크 테두리
};

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.primary,
      fontFamily: '"Noto Sans KR", sans-serif'
    }}>
      {/* 헤더 */}
      <header style={{
        background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
        padding: '60px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 장식 요소 */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          fontSize: '48px',
          opacity: 0.3
        }}>🌸</div>
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          fontSize: '48px',
          opacity: 0.3
        }}>💕</div>

        {space.profile_image && (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={space.profile_image}
              alt={space.display_name}
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `5px solid ${colors.accent}`,
                marginBottom: '20px',
                boxShadow: '0 8px 20px rgba(255, 107, 157, 0.3)'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '15px',
              right: '-5px',
              fontSize: '36px'
            }}>✨</div>
          </div>
        )}
        <h1 style={{ 
          fontSize: '40px', 
          fontWeight: '700', 
          color: colors.accent,
          marginBottom: '12px',
          textShadow: '2px 2px 4px rgba(255, 107, 157, 0.1)'
        }}>
          {space.display_name}
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: colors.text,
          marginBottom: '16px'
        }}>
          {space.birth_date} ~ {space.death_date || '현재'}
        </p>
        {space.memorial_message && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            padding: '20px',
            borderRadius: '20px',
            maxWidth: '600px',
            margin: '0 auto',
            border: `2px solid ${colors.border}`
          }}>
            <p style={{
              fontSize: '16px',
              color: colors.text,
              lineHeight: 1.8
            }}>
              {space.memorial_message}
            </p>
          </div>
        )}
      </header>

      {/* 사진 갤러리 */}
      {photos.length > 0 && (
        <section style={{ 
          maxWidth: '1200px', 
          margin: '60px auto',
          padding: '0 20px'
        }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: colors.accent,
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            💖 소중한 추억들 💖
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ 
                position: 'relative',
                paddingTop: '100%',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 8px 20px rgba(255, 107, 157, 0.2)',
                border: `3px solid ${colors.border}`,
                transition: 'transform 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img
                  src={`http://localhost:4000${photo.image_url}`}
                  alt="추억"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 방명록 */}
      <section style={{ 
        maxWidth: '800px', 
        margin: '80px auto',
        padding: '0 20px'
      }}>
        <h2 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: colors.accent,
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          🌷 방명록 🌷
        </h2>
        
        {guestbook.length === 0 ? (
          <div style={{
            background: colors.secondary,
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center'
          }}>
            <p style={{ 
              color: colors.text,
              fontSize: '16px'
            }}>
              아직 방명록이 없습니다 ✨
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {guestbook.map(entry => (
              <div key={entry.id} style={{
                background: 'white',
                padding: '24px',
                borderRadius: '20px',
                border: `3px solid ${colors.border}`,
                boxShadow: '0 4px 12px rgba(255, 107, 157, 0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <span style={{ 
                    fontWeight: '700', 
                    color: colors.accent,
                    fontSize: '16px'
                  }}>
                    💌 {entry.author_name}
                  </span>
                  <span style={{ 
                    fontSize: '13px', 
                    color: colors.text,
                    opacity: 0.6
                  }}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ 
                  color: colors.text,
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap'
                }}>
                  {entry.message}
                </p>
                {entry.image_url && (
                  <img
                    src={`http://localhost:4000${entry.image_url}`}
                    alt="첨부 사진"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      borderRadius: '12px',
                      marginTop: '16px',
                      border: `2px solid ${colors.border}`
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 푸터 */}
      <footer style={{
        background: colors.secondary,
        padding: '40px 20px',
        textAlign: 'center',
        marginTop: '80px'
      }}>
        <p style={{ 
          color: colors.text,
          fontSize: '14px'
        }}>
          💕 Memento - 사랑으로 기억합니다 💕
        </p>
      </footer>
    </div>
  );
}